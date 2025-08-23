/**
 * Notification router
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { pushNotificationService } from '../../notifications/push';

export const notificationRouter = createTRPCRouter({
  getMyNotifications: protectedProcedure
    .input(z.object({
      filter: z.enum(['all', 'unread', 'trade', 'waiver', 'league', 'system']).optional(),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const filter = input?.filter || 'all';
      const limit = input?.limit || 50;
      const offset = input?.offset || 0;

      const where: any = { userId: ctx.session.user.id };

      if (filter === 'unread') {
        where.isRead = false;
      } else if (filter !== 'all') {
        where.type = {
          contains: filter,
        };
      }

      const [notifications, total] = await Promise.all([
        ctx.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        ctx.prisma.notification.count({ where }),
      ]);

      // Add action URLs for different notification types
      const enrichedNotifications = notifications.map(notification => {
        const data = notification.data as any;
        let action = undefined;

        switch (notification.type) {
          case 'trade_offer':
            action = {
              label: 'View Trade',
              url: `/trades/${data?.tradeId}`,
            };
            break;
          case 'waiver_processed':
            action = {
              label: 'View Waivers',
              url: `/waivers`,
            };
            break;
          case 'league_invite':
            action = {
              label: 'View League',
              url: `/leagues/${data?.leagueId}`,
            };
            break;
          case 'draft_reminder':
            action = {
              label: 'Enter Draft Room',
              url: `/draft/${data?.draftId}/room`,
            };
            break;
        }

        return {
          ...notification,
          action,
        };
      });

      return {
        notifications: enrichedNotifications,
        total,
        hasMore: offset + limit < total,
      };
    }),
  
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.update({
        where: { 
          id: input.notificationId,
          userId: ctx.session.user.id, // Ensure user owns the notification
        },
        data: { isRead: true, readAt: new Date() },
      });
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      return ctx.prisma.notification.updateMany({
        where: { 
          userId: ctx.session.user.id,
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      });
    }),

  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.delete({
        where: { 
          id: input.notificationId,
          userId: ctx.session.user.id, // Ensure user owns the notification
        },
      });
    }),

  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.notification.count({
        where: { 
          userId: ctx.session.user.id,
          isRead: false,
        },
      });
    }),

  // Notification Preferences
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      let preferences = await ctx.prisma.notificationPreference.findUnique({
        where: { userId: ctx.session.user.id },
      });

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await ctx.prisma.notificationPreference.create({
          data: { userId: ctx.session.user.id },
        });
      }

      return preferences;
    }),

  updatePreferences: protectedProcedure
    .input(z.object({
      enablePush: z.boolean(),
      enableEmail: z.boolean(),
      enableSound: z.boolean(),
      enableVibration: z.boolean(),
      tradeNotifications: z.boolean(),
      waiverNotifications: z.boolean(),
      draftNotifications: z.boolean(),
      matchupNotifications: z.boolean(),
      systemNotifications: z.boolean(),
      messageNotifications: z.boolean(),
      quietHoursStart: z.string().optional(),
      quietHoursEnd: z.string().optional(),
      timezone: z.string(),
      batchNotifications: z.boolean(),
      batchInterval: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notificationPreference.upsert({
        where: { userId: ctx.session.user.id },
        update: input,
        create: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Push Notification Subscription
  subscribePush: protectedProcedure
    .input(z.object({
      subscription: z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      }),
      deviceInfo: z.object({
        userAgent: z.string().optional(),
        deviceType: z.string().optional(),
        browser: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return pushNotificationService.subscribeUser(
        ctx.session.user.id,
        input.subscription,
        input.deviceInfo
      );
    }),

  unsubscribePush: protectedProcedure
    .input(z.object({
      endpoint: z.string().optional(),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      return pushNotificationService.unsubscribeUser(
        ctx.session.user.id,
        input?.endpoint
      );
    }),

  // Get VAPID public key for push subscription
  getVapidKey: protectedProcedure
    .query(async () => {
      return {
        publicKey: pushNotificationService.getVapidPublicKey(),
      };
    }),

  // Send notification
  sendNotification: protectedProcedure
    .input(z.object({
      userId: z.string(),
      type: z.string(),
      title: z.string(),
      content: z.string(),
      category: z.enum(['GENERAL', 'URGENT', 'INFO', 'SUCCESS', 'WARNING', 'ERROR']).optional().default('GENERAL'),
      priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
      iconType: z.string().optional(),
      sendPush: z.boolean().optional().default(true),
      sendEmail: z.boolean().optional().default(false),
      data: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission to send notifications (admin/commissioner)
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new Error('Unauthorized to send notifications');
      }

      return pushNotificationService.createNotification(
        input.userId,
        input.title,
        input.content,
        {
          type: input.type,
          category: input.category,
          priority: input.priority,
          iconType: input.iconType,
          sendPush: input.sendPush,
          sendEmail: input.sendEmail,
          data: input.data,
        }
      );
    }),

  // Send system notification to all users
  sendSystemNotification: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      category: z.enum(['GENERAL', 'URGENT', 'INFO', 'SUCCESS', 'WARNING', 'ERROR']).optional().default('GENERAL'),
      priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
      excludeUserIds: z.array(z.string()).optional(),
      sendPush: z.boolean().optional().default(true),
      sendEmail: z.boolean().optional().default(false),
      data: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission to send system notifications
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new Error('Unauthorized to send system notifications');
      }

      return pushNotificationService.sendSystemNotification(
        input.title,
        input.content,
        {
          category: input.category,
          priority: input.priority,
          excludeUserIds: input.excludeUserIds,
          sendPush: input.sendPush,
          sendEmail: input.sendEmail,
          data: input.data,
        }
      );
    }),

  createTestNotification: protectedProcedure
    .input(z.object({
      type: z.string(),
      title: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return pushNotificationService.createNotification(
        ctx.session.user.id,
        input.title,
        input.content,
        {
          type: input.type,
          category: 'INFO',
          priority: 'NORMAL',
          sendPush: true,
          sendEmail: false,
          data: { test: true },
        }
      );
    }),

  // Get notification statistics
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const [
        totalNotifications,
        unreadNotifications,
        todayNotifications,
        weekNotifications,
      ] = await Promise.all([
        ctx.prisma.notification.count({
          where: { userId: ctx.session.user.id },
        }),
        ctx.prisma.notification.count({
          where: { 
            userId: ctx.session.user.id,
            isRead: false,
          },
        }),
        ctx.prisma.notification.count({
          where: {
            userId: ctx.session.user.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
        ctx.prisma.notification.count({
          where: {
            userId: ctx.session.user.id,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      return {
        total: totalNotifications,
        unread: unreadNotifications,
        today: todayNotifications,
        week: weekNotifications,
      };
    }),
});
