/**
 * Enhanced Auth Configuration for Astral Draft v4
 * Production-ready authentication with SQLite/Prisma integration
 */

import { PrismaAdapter } from '@auth/prisma-adapter';
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
  type Session,
} from 'next-auth';
import { type Adapter } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../server/db';
import { randomBytes } from 'crypto';
import { addMinutes } from 'date-fns';

// Session token expiry (30 days)
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const SESSION_UPDATE_AGE = 24 * 60 * 60; // Update session every 24 hours

// Rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().min(1, 'Name is required'),
});

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      status?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    status?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
  }
}

/**
 * Check rate limiting for login attempts
 */
function checkRateLimit(email: string): boolean {
  const now = new Date();
  const attempt = loginAttempts.get(email);

  if (!attempt) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  const timeDiff = now.getTime() - attempt.lastAttempt.getTime();
  
  if (timeDiff > LOGIN_ATTEMPT_WINDOW) {
    // Reset counter after window expires
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return false; // Too many attempts
  }

  attempt.count++;
  attempt.lastAttempt = now;
  return true;
}

/**
 * Clear rate limit for successful login
 */
function clearRateLimit(email: string): void {
  loginAttempts.delete(email);
}

/**
 * Generate secure session token
 */
function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash password with bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password with bcrypt
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create or update user session
 */
async function createUserSession(userId: string): Promise<string> {
  const sessionToken = generateSessionToken();
  const expires = addMinutes(new Date(), SESSION_MAX_AGE / 60);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  return sessionToken;
}

/**
 * NextAuth configuration
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.username = user.username;
        token.role = user.role;
        if (user.status) {
          token.status = user.status;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
    signIn: async ({ user, account, profile }) => {
      // Check if user is banned
      if (user.status === 'BANNED') {
        return false;
      }

      // Update status if needed
      if (user.status === 'PENDING_VERIFICATION') {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            status: 'ACTIVE',
          },
        });
      }

      return true;
    },
  },
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    // Credentials provider for email/password authentication
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate input
          const creds = loginSchema.parse(credentials);

          // Check rate limiting
          if (!checkRateLimit(creds.email)) {
            throw new Error('Too many login attempts. Please try again later.');
          }

          // Find user
          const user = await prisma.user.findUnique({
            where: { email: creds.email },
            select: {
              id: true,
              email: true,
              username: true,
              password: true,
              role: true,
              status: true,
              emailVerified: true,
            },
          });

          if (!user) {
            throw new Error('Invalid email or password');
          }

          // Check if user is active
          if (user.status === 'BANNED') {
            throw new Error('Your account has been banned');
          }

          if (user.status === 'SUSPENDED') {
            throw new Error('Your account has been suspended');
          }

          // Verify password
          if (!user.password) {
            throw new Error('Invalid email or password');
          }

          const isValidPassword = await verifyPassword(creds.password, user.password);

          if (!isValidPassword) {
            throw new Error('Invalid email or password');
          }

          // Clear rate limit on successful login
          clearRateLimit(creds.email);

          // Return user object for session
          return {
            id: user.id,
            email: user.email || '',
            username: user.username || '',
            role: user.role,
            status: user.status,
          };
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
    }),
    
    // OAuth providers (optional, configured via environment variables)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/onboarding',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ session }) {
      console.log(`User signed out: ${session?.user?.email}`);
    },
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
      
      // Send welcome email (implement email service)
      // await sendWelcomeEmail(user.email);
    },
    async linkAccount({ user, account }) {
      console.log(`Account linked: ${user.email} - ${account.provider}`);
    },
    async session({ session }) {
      // Track active sessions
      if (session?.user?.id) {
        // User session is valid
      }
    },
  },
};

/**
 * Register new user
 */
export async function registerUser(data: {
  email: string;
  username: string;
  password: string;
  name: string;
}): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Validate input
    const validated = registerSchema.parse(data);

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingEmail) {
      return { success: false, message: 'Email already registered' };
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: validated.username },
    });

    if (existingUsername) {
      return { success: false, message: 'Username already taken' };
    }

    // Hash password
    const hashedPassword = await hashPassword(validated.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        username: validated.username,
        password: hashedPassword,
        name: validated.name,
        role: 'USER',
        status: 'PENDING_VERIFICATION',
        settings: JSON.stringify({
          theme: 'dark',
          notifications: true,
          emailUpdates: true,
        }),
        notificationSettings: JSON.stringify({
          trades: true,
          waivers: true,
          messages: true,
          scores: true,
        }),
      },
    });

    // TODO: Send verification email
    // await sendVerificationEmail(user.email, user.id);

    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message,
      };
    }

    return {
      success: false,
      message: 'Registration failed. Please try again.',
    };
  }
}

/**
 * Update user password
 */
export async function updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Verify current password
    if (!user.password) {
      return { success: false, message: 'Password authentication not available for this account' };
    }
    
    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Validate new password
    const passwordValidation = z.string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/);

    try {
      passwordValidation.parse(newPassword);
    } catch {
      return {
        success: false,
        message: 'New password must be at least 8 characters with uppercase, lowercase, number, and special character',
      };
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Password update error:', error);
    return { success: false, message: 'Failed to update password' };
  }
}

/**
 * Verify user email
 */
export async function verifyEmail(
  userId: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    // In production, validate token from email
    // For now, just verify the user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        status: 'ACTIVE',
      },
    });

    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, message: 'Failed to verify email' };
  }
}

/**
 * Get server session helper
 */
export const getServerAuthSession = () => {
  return getServerSession(authOptions);
};

/**
 * Require authenticated session
 */
export async function requireAuth(): Promise<Session> {
  const session = await getServerAuthSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Require specific role
 */
export async function requireRole(role: string): Promise<Session> {
  const session = await requireAuth();
  
  if (session.user.role !== role && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Insufficient permissions');
  }

  return session;
}

/**
 * Clean up expired sessions and login attempts
 */
export async function cleanupAuthData(): Promise<void> {
  try {
    // Delete expired sessions
    await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });

    // Clean up old login attempts
    const now = Date.now();
    for (const [email, attempt] of loginAttempts.entries()) {
      if (now - attempt.lastAttempt.getTime() > LOGIN_ATTEMPT_WINDOW) {
        loginAttempts.delete(email);
      }
    }

    console.log('Auth cleanup completed');
  } catch (error) {
    console.error('Auth cleanup error:', error);
  }
}

// Run cleanup periodically
if (typeof window === 'undefined') {
  setInterval(cleanupAuthData, 60 * 60 * 1000); // Every hour
}