/**
 * NextAuth.js configuration for Astral Draft V4
 */

import { PrismaAdapter } from '@auth/prisma-adapter';
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from 'next-auth';
import { type Adapter } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { env } from '../env';
import { prisma } from './db';

/**
 * Module augmentation for `next-auth` types
 * Allows us to add custom properties to the `session` object
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      role: string;
      email: string;
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
    role: UserRole;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * NextAuth configuration
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id,
        username: token.username,
        role: token.role,
        email: token.email,
      },
    }),
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
        const creds = loginSchema.parse(credentials);

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
          select: {
            id: true,
            email: true,
            username: true,
            password: true,
            role: true,
            status: true,
          },
        });

        if (!user) {
          return null;
        }

        // Check if user is active
        if (user.status !== 'ACTIVE' && user.status !== 'PENDING_VERIFICATION') {
          throw new Error('Account is suspended or banned');
        }

        const isValidPassword = await bcrypt.compare(
          creds.password,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastLoginAt: new Date(),
            status: user.status === 'PENDING_VERIFICATION' ? 'ACTIVE' : user.status,
          },
        });

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        };
      },
    }),
    
    // OAuth providers (optional)
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(env.GITHUB_ID && env.GITHUB_SECRET
      ? [
          GithubProvider({
            clientId: env.GITHUB_ID,
            clientSecret: env.GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: env.NEXTAUTH_SECRET,
  debug: env.NODE_ENV === 'development',
};

/**
 * Wrapper for `getServerSession` so you don't have to import authOptions every time
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: any;
  res: any;
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};