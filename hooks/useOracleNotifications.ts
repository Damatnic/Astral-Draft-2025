/**
 * Oracle Notifications Hook
 * React hook for managing Oracle notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationService, OracleNotification, NotificationPreferences } from '../services/notificationService';

export interface UseOracleNotificationsReturn {
    notifications: OracleNotification[];
    unreadCount: number;
    preferences: NotificationPreferences;
    addNotification: (notification: Omit<OracleNotification, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
    updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
    
    // Convenience methods for Oracle-specific notifications
    notifyPredictionDeadline: (predictionId: string, question: string, minutesRemaining: number) => Promise<void>;
    notifyPredictionResult: (predictionId: string, question: string, isCorrect: boolean, pointsEarned: number) => Promise<void>;
    notifyAccuracyUpdate: (newAccuracy: number, previousAccuracy: number) => Promise<void>;
    notifyStreakMilestone: (streakCount: number) => Promise<void>;
    notifyRankingChange: (newRank: number, previousRank: number) => Promise<void>;
    scheduleDeadlineNotifications: (predictionId: string, question: string, expiresAt: string) => void;
}

export const useOracleNotifications = (): UseOracleNotificationsReturn => {
    const [notifications, setNotifications] = useState<OracleNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [preferences, setPreferences] = useState<NotificationPreferences>(
        notificationService.getPreferences()
    );

    // Load initial data
    useEffect(() => {
        const loadNotifications = () => {
            const existing = notificationService.getNotifications();
            setNotifications(existing);
            setUnreadCount(notificationService.getUnreadNotifications().length);
        };

        loadNotifications();

        // Listen for new notifications
        const unsubscribe = notificationService.onNotification((notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return unsubscribe;
    }, []);

    // Add notification
    const addNotification = useCallback(async (notification: Omit<OracleNotification, 'id' | 'timestamp' | 'isRead'>) => {
        await notificationService.addNotification(notification);
    }, []);

    // Mark notification as read
    const markAsRead = useCallback((notificationId: string) => {
        notificationService.markAsRead(notificationId);
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(() => {
        notificationService.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }, []);

    // Clear all notifications
    const clearNotifications = useCallback(() => {
        notificationService.clearNotifications();
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // Update preferences
    const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
        const updated = { ...preferences, ...newPreferences };
        notificationService.updatePreferences(newPreferences);
        setPreferences(updated);
    }, [preferences]);

    // Oracle-specific notification methods
    const notifyPredictionDeadline = useCallback(async (predictionId: string, question: string, minutesRemaining: number) => {
        await notificationService.notifyPredictionDeadline(predictionId, question, minutesRemaining);
    }, []);

    const notifyPredictionResult = useCallback(async (predictionId: string, question: string, isCorrect: boolean, pointsEarned: number) => {
        await notificationService.notifyPredictionResult(predictionId, question, isCorrect, pointsEarned);
    }, []);

    const notifyAccuracyUpdate = useCallback(async (newAccuracy: number, previousAccuracy: number) => {
        await notificationService.notifyAccuracyUpdate(newAccuracy, previousAccuracy);
    }, []);

    const notifyStreakMilestone = useCallback(async (streakCount: number) => {
        await notificationService.notifyStreakMilestone(streakCount);
    }, []);

    const notifyRankingChange = useCallback(async (newRank: number, previousRank: number) => {
        await notificationService.notifyRankingChange(newRank, previousRank);
    }, []);

    const scheduleDeadlineNotifications = useCallback((predictionId: string, question: string, expiresAt: string) => {
        notificationService.scheduleDeadlineNotifications(predictionId, question, expiresAt);
    }, []);

    return {
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        updatePreferences,
        notifyPredictionDeadline,
        notifyPredictionResult,
        notifyAccuracyUpdate,
        notifyStreakMilestone,
        notifyRankingChange,
        scheduleDeadlineNotifications
    };
};

export default useOracleNotifications;
