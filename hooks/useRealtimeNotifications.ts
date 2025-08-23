/**
 * Real-Time Notification Integration Hook
 * Connects real-time notification service with the existing notification system
 */

import { useEffect, useCallback } from 'react';
import { realtimeNotificationService, RealtimeNotification } from '../services/realtimeNotificationService';
import { useNotifications } from '../contexts/NotificationContext';

export interface RealtimeNotificationHookOptions {
  enableToasts?: boolean;
  enableSounds?: boolean;
  highPriorityOnly?: boolean;
  maxToastDuration?: number;
}

export const useRealtimeNotifications = (options: RealtimeNotificationHookOptions = {}) => {
  const {
    enableToasts = true,
    enableSounds = true,
    highPriorityOnly = false,
    maxToastDuration = 5000
  } = options;

  const { refreshNotifications, preferences } = useNotifications();

  // Convert real-time notification to display format
  const convertToDisplayFormat = useCallback((notification: RealtimeNotification) => {
    const getCategory = (source: string) => {
      if (source === 'oracle') return 'oracle';
      if (source === 'contest' || source === 'social') return 'league';
      return 'draft';
    };

    return {
      id: notification.id,
      type: notification.type.toUpperCase(),
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
      isRead: false, // Default to unread
      priority: notification.priority,
      category: getCategory(notification.type),
      actionUrl: notification.actionUrl,
      data: notification.metadata
    };
  }, []);

  // Show toast notification
  const showToast = useCallback((notification: RealtimeNotification) => {
    if (!enableToasts) return;

    // Check if we should show this notification based on settings
    if (highPriorityOnly && notification.priority !== 'high') return;

    // Create a toast notification event
    const toastEvent = new CustomEvent('showNotificationToast', {
      detail: {
        notification: convertToDisplayFormat(notification),
        duration: maxToastDuration
      }
    });
    
    window.dispatchEvent(toastEvent);
  }, [enableToasts, highPriorityOnly, maxToastDuration, convertToDisplayFormat]);

  // Play notification sound
  const playNotificationSound = useCallback((notification: RealtimeNotification) => {
    if (!enableSounds || !preferences?.enableSoundNotifications) return;

    // Different sounds for different priorities
    let soundFile = '/sounds/notification.mp3';
    if (notification.priority === 'high') {
      soundFile = '/sounds/high-priority.mp3';
    } else if (notification.type === 'prediction') {
      soundFile = '/sounds/oracle.mp3';
    }

    const audio = new Audio(soundFile);
    audio.volume = 0.3; // Keep it subtle
    audio.play().catch(() => {
      // Fallback to default notification sound
      const fallbackAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj');
      fallbackAudio.play().catch(() => {}); // Ignore if this fails too
    });
  }, [enableSounds, preferences]);

  // Handle incoming real-time notifications
  const handleRealtimeNotification = useCallback((notification: RealtimeNotification) => {
    // Always refresh the notification list
    refreshNotifications();

    // Show toast for important notifications
    const shouldShowToast = 
      notification.priority === 'high' ||
      notification.type === 'prediction' ||
      notification.type === 'result' ||
      notification.type === 'achievement' ||
      notification.type === 'system';

    if (shouldShowToast) {
      showToast(notification);
    }

    // Play sound for all notifications (filtered by preferences)
    playNotificationSound(notification);

    // Log for debugging
    console.log('Real-time notification received:', notification.title);
  }, [refreshNotifications, showToast, playNotificationSound]);

  // Setup real-time notification listener
  useEffect(() => {
    realtimeNotificationService.on('notification_received', handleRealtimeNotification);
    
    return () => {
      realtimeNotificationService.off('notification_received', handleRealtimeNotification);
    };
  }, [handleRealtimeNotification]);

  // API methods for triggering notifications programmatically
  const triggerPredictionDeadlineWarning = useCallback((data: {
    predictionId: string;
    question: string;
    minutesRemaining: number;
    userId?: string;
  }) => {
    // Create a notification for deadline warning
    const notification: RealtimeNotification = {
      id: `deadline-${Date.now()}`,
      type: 'prediction',
      title: 'Prediction Deadline Warning',
      message: `Deadline approaching for: ${data.question}`,
      timestamp: new Date(),
      priority: 'high',
      metadata: data
    };
    handleRealtimeNotification(notification);
  }, []);

  const triggerPredictionResult = useCallback((data: {
    predictionId: string;
    question: string;
    isCorrect: boolean;
    pointsEarned: number;
    userId?: string;
  }) => {
    // Create a notification for result
    const notification: RealtimeNotification = {
      id: `result-${Date.now()}`,
      type: 'result',
      title: 'Prediction Result Available',
      message: `Result for: ${data.question}`,
      timestamp: new Date(),
      priority: 'high',
      metadata: data
    };
    handleRealtimeNotification(notification);
  }, []);

  const triggerAccuracyUpdate = useCallback((data: {
    newAccuracy: number;
    previousAccuracy: number;
    userId?: string;
  }) => {
    // Create a notification for accuracy update
    const notification: RealtimeNotification = {
      id: `accuracy-${Date.now()}`,
      type: 'result',
      title: 'Oracle Accuracy Update',
      message: `Current accuracy: ${data.newAccuracy}%`,
      timestamp: new Date(),
      priority: 'low',
      metadata: data
    };
    handleRealtimeNotification(notification);
  }, []);

  const triggerStreakMilestone = useCallback((data: {
    streakCount: number;
    userId?: string;
  }) => {
    // Create a notification for streak
    const notification: RealtimeNotification = {
      id: `streak-${Date.now()}`,
      type: 'achievement',
      title: 'Streak Milestone',
      message: `${data.streakCount} day streak!`,
      timestamp: new Date(),
      priority: 'medium',
      metadata: data
    };
    handleRealtimeNotification(notification);
  }, []);

  const triggerContestUpdate = useCallback((data: {
    contestId: string;
    contestName: string;
    participants: string[];
  }) => {
    // Create a notification for contest
    const notification: RealtimeNotification = {
      id: `contest-${Date.now()}`,
      type: 'challenge',
      title: 'Contest Started',
      message: data.contestName,
      timestamp: new Date(),
      priority: 'high',
      metadata: data
    };
    handleRealtimeNotification(notification);
  }, []);

  const triggerGameScoreUpdate = useCallback((data: {
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
  }) => {
    // Create a notification for game score
    const notification: RealtimeNotification = {
      id: `score-${Date.now()}`,
      type: 'result',
      title: 'Game Score Update',
      message: `${data.homeTeam} ${data.homeScore} - ${data.awayScore} ${data.awayTeam}`,
      timestamp: new Date(),
      priority: 'low',
      metadata: data
    };
    handleRealtimeNotification(notification);
  }, []);

  const triggerPlayerInjuryUpdate = useCallback((data: {
    playerId: string;
    playerName: string;
    team: string;
    injuryStatus: string;
  }) => {
    // Create a notification for injury
    const notification: RealtimeNotification = {
      id: `injury-${Date.now()}`,
      type: 'system',
      title: 'Player Injury Update',
      message: `${data.playerName}: ${data.injuryStatus}`,
      timestamp: new Date(),
      priority: data.injuryStatus.toLowerCase().includes('out') ? 'high' : 'medium',
      metadata: data
    };
    handleRealtimeNotification(notification);
  }, []);

  const triggerAdminAnnouncement = useCallback((data: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }) => {
    // Create a notification for admin announcement
    const notification: RealtimeNotification = {
      id: `admin-${Date.now()}`,
      type: 'system',
      title: 'Admin Announcement',
      message: data.message,
      timestamp: new Date(),
      priority: 'high',
      metadata: data
    };
    handleRealtimeNotification(notification);
  }, []);

  const testNotification = useCallback(() => {
    realtimeNotificationService.sendTestNotification();
  }, []);

  // Get real-time service metrics
  const getMetrics = useCallback(() => {
    // Metrics not directly available from service
    const allNotifications = realtimeNotificationService.getNotifications();
    return {
      totalNotifications: allNotifications.length,
      unreadCount: realtimeNotificationService.getUnreadCount(),
      connected: realtimeNotificationService.isConnectedToService()
    };
  }, []);

  const getActiveConnections = useCallback(() => {
    // Return connection status
    return realtimeNotificationService.getConnectionStatus();
  }, []);

  return {
    // Trigger methods for different notification types
    triggerPredictionDeadlineWarning,
    triggerPredictionResult,
    triggerAccuracyUpdate,
    triggerStreakMilestone,
    triggerContestUpdate,
    triggerGameScoreUpdate,
    triggerPlayerInjuryUpdate,
    triggerAdminAnnouncement,
    testNotification,
    
    // Utility methods
    getMetrics,
    getActiveConnections,
    
    // Service reference for advanced usage
    realtimeService: realtimeNotificationService
  };
};

// Export types for external use
export type { RealtimeNotification } from '../services/realtimeNotificationService';
