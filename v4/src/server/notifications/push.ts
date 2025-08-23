/**
 * Push Notification Service
 * Handles Web Push API integration with VAPID keys
 */

import webpush from 'web-push';
import { prisma } from '../db';
import { pubsub } from '../redis';

// VAPID keys for push notifications
// In production, these should be environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI80xmqmHBSBC8h-qjCRDr84zB2_NiGxs3F0sGWhbxOeQNZG5H9K0WkBaU';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '5KV8TKT1QQa1JZJ5JJVH4L1v2N5j2d4Bj5J5J5J5J5J';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'admin@astraldraft.com';

// Configure web-push
webpush.setVapidDetails(
  `mailto:${VAPID_EMAIL}`,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  type?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  vibrate?: number[];
  silent?: boolean;
}

export interface NotificationOptions {
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: 'GENERAL' | 'URGENT' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  iconType?: string;
  sendPush?: boolean;
  sendEmail?: boolean;
  data?: Record<string, any>;
}

class PushNotificationService {
  /**
   * Get VAPID public key for client registration
   */
  getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribeUser(
    userId: string,
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    },
    deviceInfo?: {
      userAgent?: string;
      deviceType?: string;
      browser?: string;
    }
  ) {
    try {
      // Remove any existing subscription for this endpoint
      await prisma.notificationSubscription.deleteMany({
        where: { endpoint: subscription.endpoint },
      });

      // Create new subscription
      const notificationSubscription = await prisma.notificationSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent: deviceInfo?.userAgent,
          deviceType: deviceInfo?.deviceType,
          browser: deviceInfo?.browser,
          lastUsed: new Date(),
        },
      });

      console.log(`Push subscription created for user ${userId}`);
      return notificationSubscription;
    } catch (error) {
      console.error('Error creating push subscription:', error);
      throw new Error('Failed to create push subscription');
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeUser(userId: string, endpoint?: string) {
    try {
      const where: any = { userId };
      if (endpoint) {
        where.endpoint = endpoint;
      }

      await prisma.notificationSubscription.deleteMany({ where });
      
      console.log(`Push subscriptions removed for user ${userId}`);
    } catch (error) {
      console.error('Error removing push subscription:', error);
      throw new Error('Failed to remove push subscription');
    }
  }

  /**
   * Send push notification to user
   */
  async sendPushToUser(
    userId: string,
    payload: PushNotificationPayload,
    options: { skipIfQuietHours?: boolean } = {}
  ) {
    try {
      // Get user's notification preferences
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      // Check if push notifications are enabled
      if (!preferences?.enablePush) {
        console.log(`Push notifications disabled for user ${userId}`);
        return { sent: false, reason: 'Push notifications disabled' };
      }

      // Check quiet hours
      if (options.skipIfQuietHours && preferences) {
        const isQuietHours = this.isQuietHours(preferences);
        if (isQuietHours) {
          console.log(`Skipping push notification for user ${userId} - quiet hours`);
          return { sent: false, reason: 'Quiet hours' };
        }
      }

      // Get active subscriptions
      const subscriptions = await prisma.notificationSubscription.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      if (subscriptions.length === 0) {
        console.log(`No active push subscriptions for user ${userId}`);
        return { sent: false, reason: 'No active subscriptions' };
      }

      // Prepare notification payload
      const notificationPayload = {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        tag: payload.tag,
        url: payload.url,
        type: payload.type,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction || false,
        vibrate: preferences?.enableVibration ? (payload.vibrate || [200, 100, 200]) : [],
        silent: payload.silent || !preferences?.enableSound,
      };

      // Send to all subscriptions
      const results = await Promise.allSettled(
        subscriptions.map(async (subscription) => {
          try {
            const pushSubscription = {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            };

            await webpush.sendNotification(
              pushSubscription,
              JSON.stringify(notificationPayload),
              {
                TTL: 24 * 60 * 60, // 24 hours
                urgency: this.getUrgencyFromPayload(payload),
              }
            );

            // Update last used timestamp
            await prisma.notificationSubscription.update({
              where: { id: subscription.id },
              data: { lastUsed: new Date() },
            });

            return { success: true, subscriptionId: subscription.id };
          } catch (error: any) {
            console.error(`Push notification failed for subscription ${subscription.id}:`, error);

            // Handle specific error cases
            if (error.statusCode === 410 || error.statusCode === 404) {
              // Subscription is no longer valid, deactivate it
              await prisma.notificationSubscription.update({
                where: { id: subscription.id },
                data: { isActive: false },
              });
              console.log(`Deactivated invalid subscription ${subscription.id}`);
            }

            return { success: false, subscriptionId: subscription.id, error: error.message };
          }
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      console.log(`Push notification sent to user ${userId}: ${successful} successful, ${failed} failed`);

      return {
        sent: successful > 0,
        successful,
        failed,
        results,
      };
    } catch (error) {
      console.error(`Error sending push notification to user ${userId}:`, error);
      throw new Error('Failed to send push notification');
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendPushToUsers(
    userIds: string[],
    payload: PushNotificationPayload,
    options: { skipIfQuietHours?: boolean } = {}
  ) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendPushToUser(userId, payload, options))
    );

    const summary = {
      total: userIds.length,
      successful: 0,
      failed: 0,
      results: results.map((result, index) => ({
        userId: userIds[index],
        success: result.status === 'fulfilled' && result.value.sent,
        result: result.status === 'fulfilled' ? result.value : { error: result.reason },
      })),
    };

    summary.successful = summary.results.filter(r => r.success).length;
    summary.failed = summary.total - summary.successful;

    return summary;
  }

  /**
   * Create and send notification (in-app + push)
   */
  async createNotification(
    userId: string,
    title: string,
    content: string,
    options: NotificationOptions
  ) {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: options.type,
          title,
          content,
          category: options.category,
          priority: options.priority,
          iconType: options.iconType,
          data: options.data ? JSON.stringify(options.data) : null,
          isPush: options.sendPush ?? true,
          isEmail: options.sendEmail ?? false,
          sentAt: new Date(),
        },
      });

      // Send real-time notification via WebSocket
      await pubsub.publish(`user:${userId}:notifications`, {
        type: 'notification:new',
        notification,
      });

      // Send push notification if enabled
      if (options.sendPush !== false) {
        const pushPayload: PushNotificationPayload = {
          title,
          body: content,
          type: options.type,
          url: this.getNotificationUrl(options.type, options.data),
          data: options.data,
          requireInteraction: options.priority === 'URGENT',
          vibrate: options.priority === 'URGENT' ? [200, 100, 200, 100, 200] : [200, 100, 200],
        };

        await this.sendPushToUser(userId, pushPayload, { skipIfQuietHours: true });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Send system notification to all users
   */
  async sendSystemNotification(
    title: string,
    content: string,
    options: Omit<NotificationOptions, 'type'> & { excludeUserIds?: string[] } = {}
  ) {
    try {
      // Get all users except excluded ones
      const users = await prisma.user.findMany({
        where: {
          id: {
            notIn: options.excludeUserIds || [],
          },
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      const userIds = users.map(u => u.id);

      // Create notifications for all users
      await Promise.all(
        userIds.map(userId =>
          this.createNotification(userId, title, content, {
            ...options,
            type: 'SYSTEM',
          })
        )
      );

      return { sent: userIds.length };
    } catch (error) {
      console.error('Error sending system notification:', error);
      throw new Error('Failed to send system notification');
    }
  }

  /**
   * Check if current time is within user's quiet hours
   */
  private isQuietHours(preferences: any): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const timezone = preferences.timezone || 'UTC';
    
    // Convert to user's timezone
    const userTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);

    const currentTime = userTime.replace(':', '');
    const startTime = preferences.quietHoursStart.replace(':', '');
    const endTime = preferences.quietHoursEnd.replace(':', '');

    // Handle overnight quiet hours
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Get push notification urgency level
   */
  private getUrgencyFromPayload(payload: PushNotificationPayload): 'very-low' | 'low' | 'normal' | 'high' {
    if (payload.type === 'SYSTEM' || payload.requireInteraction) {
      return 'high';
    }
    if (payload.type === 'TRADE' || payload.type === 'DRAFT') {
      return 'normal';
    }
    return 'low';
  }

  /**
   * Get notification URL based on type and data
   */
  private getNotificationUrl(type: string, data?: Record<string, any>): string {
    switch (type) {
      case 'TRADE':
        return data?.tradeId ? `/trades/${data.tradeId}` : '/trades';
      case 'WAIVER':
        return '/waivers';
      case 'DRAFT':
        return data?.draftId ? `/draft/${data.draftId}/room` : '/draft';
      case 'MATCHUP':
        return data?.matchupId ? `/matchup/${data.matchupId}` : '/team';
      case 'MESSAGE':
        return data?.leagueId ? `/leagues/${data.leagueId}` : '/leagues';
      default:
        return '/notifications';
    }
  }

  /**
   * Clean up expired and invalid subscriptions
   */
  async cleanupSubscriptions() {
    try {
      // Remove subscriptions older than 90 days that haven't been used
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const deleted = await prisma.notificationSubscription.deleteMany({
        where: {
          OR: [
            { isActive: false },
            {
              lastUsed: {
                lt: ninetyDaysAgo,
              },
            },
          ],
        },
      });

      console.log(`Cleaned up ${deleted.count} expired push subscriptions`);
      return deleted.count;
    } catch (error) {
      console.error('Error cleaning up subscriptions:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export for testing
export { PushNotificationService };