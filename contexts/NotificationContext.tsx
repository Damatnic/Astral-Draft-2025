/**
 * Notification Context and Hook
 * React integration for enhanced notification system
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { enhancedNotificationService, EnhancedNotification, NotificationPreferences, EnhancedNotificationType } from '../services/enhancedNotificationService';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
    notifications: EnhancedNotification[];
    unreadCount: number;
    preferences: NotificationPreferences | null;
    loading: boolean;
    
    // Notification management
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: (category?: string) => Promise<void>;
    archiveNotification: (notificationId: string) => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    
    // Preferences management
    updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
    
    // Sending notifications
    sendNotification: (
        type: EnhancedNotificationType,
        title: string,
        message: string,
        options?: Partial<EnhancedNotification>
    ) => Promise<void>;
    
    // Stats
    getNotificationStats: () => Promise<any>;
    
    // Utility
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(false);

    // Helper functions for notification updates
    const markNotificationAsRead = useCallback((notificationId: string) => {
        setNotifications(current => {
            return current.map(notification => {
                return notification.id === notificationId 
                    ? { ...notification, isRead: true }
                    : notification;
            });
        });
    }, []);

    const markNotificationAsArchived = useCallback((notificationId: string) => {
        setNotifications(current => {
            return current.map(notification => {
                return notification.id === notificationId 
                    ? { ...notification, isArchived: true }
                    : notification;
            });
        });
    }, []);

    const removeNotificationFromList = useCallback((notificationId: string) => {
        setNotifications(current => {
            return current.filter(notification => notification.id !== notificationId);
        });
    }, []);

    // Load notifications when user changes
    useEffect(() => {
        if (isAuthenticated && user) {
            loadNotifications();
            loadPreferences();
        } else {
            setNotifications([]);
            setPreferences(null);
        }
    }, [isAuthenticated, user]);

    // Set up event listeners for real-time updates
    useEffect(() => {
        const addNewNotification = (notification: EnhancedNotification) => {
            setNotifications(prev => [notification, ...prev]);
        };

        const updateNotificationAsRead = (notification: EnhancedNotification) => {
            markNotificationAsRead(notification.id);
        };

        const updateNotificationAsArchived = (notification: EnhancedNotification) => {
            markNotificationAsArchived(notification.id);
        };

        const removeNotification = (notification: EnhancedNotification) => {
            removeNotificationFromList(notification.id);
        };

        enhancedNotificationService.addEventListener('new', addNewNotification);
        enhancedNotificationService.addEventListener('read', updateNotificationAsRead);
        enhancedNotificationService.addEventListener('archived', updateNotificationAsArchived);
        enhancedNotificationService.addEventListener('deleted', removeNotification);

        return () => {
            enhancedNotificationService.removeEventListener('new', addNewNotification);
            enhancedNotificationService.removeEventListener('read', updateNotificationAsRead);
            enhancedNotificationService.removeEventListener('archived', updateNotificationAsArchived);
            enhancedNotificationService.removeEventListener('deleted', removeNotification);
        };
    }, [markNotificationAsRead, markNotificationAsArchived, removeNotificationFromList]);

    const loadNotifications = useCallback(async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            const userNotifications = await enhancedNotificationService.getNotifications(
                user.id.toString(),
                { limit: 50 }
            );
            setNotifications(userNotifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const loadPreferences = useCallback(async () => {
        if (!user) return;
        
        try {
            const userPreferences = await enhancedNotificationService.getUserPreferences(
                user.id.toString()
            );
            setPreferences(userPreferences);
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
        }
    }, [user]);

    const markAsRead = useCallback(async (notificationId: string) => {
        if (!user) return;
        
        try {
            await enhancedNotificationService.markAsRead(user.id.toString(), notificationId);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, [user]);

    const markAllAsRead = useCallback(async (category?: string) => {
        if (!user) return;
        
        try {
            await enhancedNotificationService.markAllAsRead(user.id.toString(), category);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, [user]);

    const archiveNotification = useCallback(async (notificationId: string) => {
        if (!user) return;
        
        try {
            await enhancedNotificationService.archiveNotification(user.id.toString(), notificationId);
        } catch (error) {
            console.error('Failed to archive notification:', error);
        }
    }, [user]);

    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!user) return;
        
        try {
            await enhancedNotificationService.deleteNotification(user.id.toString(), notificationId);
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    }, [user]);

    const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
        if (!user) return;
        
        try {
            await enhancedNotificationService.updateUserPreferences(user.id.toString(), updates);
            await loadPreferences();
        } catch (error) {
            console.error('Failed to update notification preferences:', error);
        }
    }, [user, loadPreferences]);

    const sendNotification = useCallback(async (
        type: EnhancedNotificationType,
        title: string,
        message: string,
        options: Partial<EnhancedNotification> = {}
    ) => {
        if (!user) return;
        
        try {
            await enhancedNotificationService.sendNotification(
                user.id.toString(),
                type,
                title,
                message,
                options
            );
        } catch (error) {
            console.error('Failed to send notification:', error);
        }
    }, [user]);

    const getNotificationStats = useCallback(async () => {
        if (!user) return null;
        
        try {
            return await enhancedNotificationService.getNotificationStats(user.id.toString());
        } catch (error) {
            console.error('Failed to get notification stats:', error);
            return null;
        }
    }, [user]);

    const refreshNotifications = useCallback(async () => {
        await loadNotifications();
    }, [loadNotifications]);

    const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;

    const contextValue = useMemo<NotificationContextValue>(() => ({
        notifications: notifications.filter(n => !n.isArchived),
        unreadCount,
        preferences,
        loading,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        updatePreferences,
        sendNotification,
        getNotificationStats,
        refreshNotifications
    }), [
        notifications,
        unreadCount,
        preferences,
        loading,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        updatePreferences,
        sendNotification,
        getNotificationStats,
        refreshNotifications
    ]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextValue => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default NotificationContext;
