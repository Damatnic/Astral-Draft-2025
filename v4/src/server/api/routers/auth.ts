/**
 * Enhanced Authentication router with comprehensive security
 */

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { authSecurityMiddleware } from '../../middleware/security';
import { 
  signUpSchema, 
  signInSchema, 
  resetPasswordSchema, 
  changePasswordSchema,
  emailSchema,
  usernameSchema,
  passwordSchema 
} from '../../../lib/validation/schemas';

export const authRouter = createTRPCRouter({
  /**
   * Register a new user with enhanced security validation
   */
  register: publicProcedure
    .use(authSecurityMiddleware)
    .input(z.object({
      email: emailSchema,
      username: usernameSchema,
      password: passwordSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists
      const existingEmail = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      
      if (existingEmail) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already registered',
        });
      }
      
      // Check if username already exists
      const existingUsername = await ctx.prisma.user.findUnique({
        where: { username: input.username },
      });
      
      if (existingUsername) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Username already taken',
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 12);
      
      // Create user
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          username: input.username,
          password: hashedPassword,
          name: input.username, // Use username as name initially
          role: 'USER',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
      
      return {
        success: true,
        user,
      };
    }),
  
  /**
   * Get current user
   */
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  
  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        bio: z.string().max(500).optional(),
        avatar: z.string().url().optional(),
        experienceLevel: z.enum(['beginner', 'intermediate', 'expert']).optional(),
        favoriteTeam: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
          avatar: true,
          experienceLevel: true,
          favoriteTeam: true,
        },
      });
      
      return updated;
    }),
  
  /**
   * Change password
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user with password
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { password: true },
      });
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      
      // Check if user has a password (might be OAuth user)
      if (!user.password) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot change password for OAuth users',
        });
      }

      // Verify current password
      const isValid = await bcrypt.compare(input.currentPassword, user.password);
      
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(input.newPassword, 12);
      
      // Update password
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashedPassword },
      });
      
      return { success: true };
    }),
  
  /**
   * Update notification settings
   */
  updateNotificationSettings: protectedProcedure
    .input(
      z.object({
        email: z.record(z.boolean()).optional(),
        push: z.record(z.boolean()).optional(),
        inApp: z.record(z.boolean()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { notificationSettings: true },
      });
      
      const currentSettings = (currentUser?.notificationSettings as any) || {};
      
      const updatedSettings = {
        ...currentSettings,
        ...input,
      };
      
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          notificationSettings: updatedSettings,
        },
      });
      
      return { success: true, settings: updatedSettings };
    }),
});