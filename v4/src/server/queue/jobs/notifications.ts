/**
 * Notification sending job handler
 */

import { prisma } from '../../db';
import { pubsub } from '../../redis';

interface SendNotificationData {
  userId: string;
  notification: {
    type: string;
    title: string;
    content: string;
    data?: any;
  };
}

export async function sendNotification(data: SendNotificationData) {
  const { userId, notification } = data;
  
  try {
    // Create notification in database
    const created = await prisma.notification.create({
      data: {
        userId,
        ...notification,
      },
    });
    
    // Get user's notification preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        notifications: true,
      },
    });
    
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    const preferences = user.notifications as any;
    
    // Send real-time notification via WebSocket
    await pubsub.publish(`user:${userId}:notifications`, {
      type: 'NEW_NOTIFICATION',
      notification: created,
    });
    
    // Send email if enabled
    if (preferences?.email?.[notification.type] !== false) {
      // Queue email job (would integrate with email service)
      console.log(`Would send email to ${user.email}: ${notification.title}`);
    }
    
    // Send push notification if enabled
    if (preferences?.push?.[notification.type] !== false) {
      // Queue push notification job (would integrate with push service)
      console.log(`Would send push notification to user ${userId}`);
    }
    
    return {
      success: true,
      notificationId: created.id,
    };
    
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}