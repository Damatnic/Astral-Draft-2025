/**
 * Enhanced Notification Service
 * Comprehensive notification system for draft alerts, Oracle predictions, and league updates
 */

import { authService } from './authService';

// Enhanced notification types
export type EnhancedNotificationType = 
    | 'DRAFT' 
    | 'TRADE' 
    | 'WAIVER' 
    | 'SYSTEM' 
    | 'ORACLE_PREDICTION' 
    | 'ORACLE_RESULT' 
    | 'DRAFT_PICK' 
    | 'DRAFT_START' 
    | 'DRAFT_PAUSE' 
    | 'LEAGUE_UPDATE' 
    | 'ACHIEVEMENT' 
    | 'REMINDER' 
    | 'SOCIAL'
    | 'MATCHUP_UPDATE';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface EnhancedNotification {
    id: string;
    title: string;
    message: string;
    type: EnhancedNotificationType;
    priority: NotificationPriority;
    userId: string;
    leagueId?: string;
    data?: any;
    isRead: boolean;
    isArchived: boolean;
    createdAt: Date;
    scheduledFor?: Date;
    expiresAt?: Date;
    actionUrl?: string;
    actionText?: string;
    imageUrl?: string;
    category: 'draft' | 'oracle' | 'league' | 'system';
}

export interface NotificationPreferences {
    userId: string;
    enablePushNotifications: boolean;
    enableInAppNotifications: boolean;
    enableEmailNotifications: boolean;
    enableSoundNotifications: boolean;
    categories: {
        draft: {
            enabled: boolean;
            pushEnabled: boolean;
            emailEnabled: boolean;
            pickReminders: boolean;
            draftStart: boolean;
            draftEnd: boolean;
            autopickWarnings: boolean;
        };
        oracle: {
            enabled: boolean;
            pushEnabled: boolean;
            emailEnabled: boolean;
            predictionUpdates: boolean;
            challengeReminders: boolean;
            resultsAvailable: boolean;
            achievementUnlocked: boolean;
        };
        league: {
            enabled: boolean;
            pushEnabled: boolean;
            emailEnabled: boolean;
            tradeProposals: boolean;
            waiverResults: boolean;
            matchupUpdates: boolean;
            leagueAnnouncements: boolean;
        };
        system: {
            enabled: boolean;
            pushEnabled: boolean;
            emailEnabled: boolean;
            maintenanceAlerts: boolean;
            featureUpdates: boolean;
            securityAlerts: boolean;
        };
    };
    quietHours: {
        enabled: boolean;
        startTime: string; // "22:00"
        endTime: string;   // "08:00"
        timezone: string;
    };
    maxNotificationsPerDay: number;
}

export interface NotificationChannel {
    id: string;
    name: string;
    type: 'push' | 'email' | 'in-app' | 'webhook';
    enabled: boolean;
    config: any;
}

export interface NotificationTemplate {
    id: string;
    type: EnhancedNotificationType;
    title: string;
    messageTemplate: string;
    variables: string[];
    defaultPriority: NotificationPriority;
}

export interface NotificationStats {
    totalSent: number;
    totalRead: number;
    readRate: number;
    averageReadTime: number;
    topTypes: { type: EnhancedNotificationType; count: number }[];
    engagementByCategory: { [category: string]: number };
}

class EnhancedNotificationService {
    private readonly notifications: Map<string, EnhancedNotification[]> = new Map();
    private readonly userPreferences: Map<string, NotificationPreferences> = new Map();
    private notificationChannels: NotificationChannel[] = [];
    private readonly templates: Map<string, NotificationTemplate> = new Map();
    private offlineQueue: EnhancedNotification[] = [];
    private isOnline: boolean = navigator.onLine;
    private serviceWorker: ServiceWorkerRegistration | null = null;
    private readonly eventListeners: Map<string, Function[]> = new Map();

    constructor() {
        this.setupNetworkListeners();
        this.loadDefaultTemplates();
        
        // Initialize async operations
        setTimeout(() => {
            this.initializeService();
            this.setupServiceWorker();
        }, 0);
    }

    private async initializeService(): Promise<void> {
        try {
            // Load user preferences from storage
            await this.loadUserPreferences();
            
            // Setup notification channels
            this.setupNotificationChannels();
            
            // Setup periodic cleanup
            this.setupCleanupSchedule();
            
            console.log('📱 Enhanced Notification Service initialized');
        } catch (error) {
            console.error('Failed to initialize notification service:', error);
        }
    }

    private async setupServiceWorker(): Promise<void> {
        if ('serviceWorker' in navigator) {
            try {
                this.serviceWorker = await navigator.serviceWorker.ready;
                console.log('🔧 Service Worker ready for notifications');
            } catch (error) {
                console.error('Service Worker setup failed:', error);
            }
        }
    }

    private setupNetworkListeners(): void {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    private loadDefaultTemplates(): void {
        const defaultTemplates: NotificationTemplate[] = [
            {
                id: 'draft-pick-reminder',
                type: 'DRAFT_PICK',
                title: 'Your Turn to Pick!',
                messageTemplate: 'It\'s your turn to pick in the {{leagueName}} draft. Time remaining: {{timeRemaining}}',
                variables: ['leagueName', 'timeRemaining'],
                defaultPriority: 'urgent'
            },
            {
                id: 'oracle-prediction-update',
                type: 'ORACLE_PREDICTION',
                title: 'Oracle Prediction Updated',
                messageTemplate: 'Oracle updated prediction for {{question}} - Confidence: {{confidence}}%',
                variables: ['question', 'confidence'],
                defaultPriority: 'medium'
            },
            {
                id: 'trade-proposal',
                type: 'TRADE',
                title: 'New Trade Proposal',
                messageTemplate: '{{fromTeam}} sent you a trade proposal in {{leagueName}}',
                variables: ['fromTeam', 'leagueName'],
                defaultPriority: 'medium'
            },
            {
                id: 'league-announcement',
                type: 'LEAGUE_UPDATE',
                title: 'League Announcement',
                messageTemplate: 'New announcement from {{commissionerName}} in {{leagueName}}: {{announcement}}',
                variables: ['commissionerName', 'leagueName', 'announcement'],
                defaultPriority: 'medium'
            },
            {
                id: 'achievement-unlocked',
                type: 'ACHIEVEMENT',
                title: 'Achievement Unlocked! 🏆',
                messageTemplate: 'You unlocked {{achievementName}}: {{achievementDescription}}',
                variables: ['achievementName', 'achievementDescription'],
                defaultPriority: 'low'
            }
        ];

        defaultTemplates.forEach(template => {
            this.templates.set(template.id, template);
        });
    }

    private setupNotificationChannels(): void {
        this.notificationChannels = [
            {
                id: 'push',
                name: 'Push Notifications',
                type: 'push',
                enabled: true,
                config: {}
            },
            {
                id: 'in-app',
                name: 'In-App Notifications',
                type: 'in-app',
                enabled: true,
                config: {}
            }
        ];
    }

    private setupCleanupSchedule(): void {
        // Clean up old notifications every hour
        setInterval(() => {
            this.cleanupExpiredNotifications();
        }, 60 * 60 * 1000);
    }

    // Core notification methods
    async sendNotification(
        userId: string,
        type: EnhancedNotificationType,
        title: string,
        message: string,
        options: Partial<EnhancedNotification> = {}
    ): Promise<EnhancedNotification> {
        const notification: EnhancedNotification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            title,
            message,
            type,
            priority: options.priority || 'medium',
            userId,
            leagueId: options.leagueId,
            data: options.data,
            isRead: false,
            isArchived: false,
            createdAt: new Date(),
            scheduledFor: options.scheduledFor,
            expiresAt: options.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            actionUrl: options.actionUrl,
            actionText: options.actionText,
            imageUrl: options.imageUrl,
            category: this.getCategoryFromType(type)
        };

        // Check user preferences
        const preferences = await this.getUserPreferences(userId);
        if (!this.shouldSendNotification(notification, preferences)) {
            return notification;
        }

        // Store notification
        await this.storeNotification(notification);

        // Send through appropriate channels
        if (this.isOnline) {
            await this.deliverNotification(notification, preferences);
        } else {
            this.offlineQueue.push(notification);
        }

        // Emit event for real-time updates
        this.emitNotificationEvent('new', notification);

        return notification;
    }

    async sendFromTemplate(
        templateId: string,
        userId: string,
        variables: { [key: string]: string },
        options: Partial<EnhancedNotification> = {}
    ): Promise<EnhancedNotification | null> {
        const template = this.templates.get(templateId);
        if (!template) {
            console.error(`Template not found: ${templateId}`);
            return null;
        }

        let message = template.messageTemplate;
        template.variables.forEach(variable => {
            const value = variables[variable] || '';
            message = message.replace(new RegExp(`{{${variable}}}`, 'g'), value);
        });

        return this.sendNotification(
            userId,
            template.type,
            template.title,
            message,
            {
                priority: template.defaultPriority,
                ...options
            }
        );
    }

    async scheduleNotification(
        userId: string,
        type: EnhancedNotificationType,
        title: string,
        message: string,
        scheduledFor: Date,
        options: Partial<EnhancedNotification> = {}
    ): Promise<EnhancedNotification> {
        return this.sendNotification(userId, type, title, message, {
            ...options,
            scheduledFor
        });
    }

    // Draft-specific notifications
    async sendDraftPickReminder(
        userId: string,
        leagueId: string,
        timeRemaining: number,
        pickNumber: number
    ): Promise<void> {
        const timeText = this.formatTimeRemaining(timeRemaining);
        
        await this.sendFromTemplate('draft-pick-reminder', userId, {
            leagueName: 'Draft League',
            timeRemaining: timeText
        }, {
            leagueId,
            priority: 'urgent',
            actionUrl: `/draft/${leagueId}`,
            actionText: 'Make Pick',
            data: { pickNumber, timeRemaining }
        });
    }

    async sendDraftStartAlert(
        userIds: string[],
        leagueId: string,
        startTime: Date
    ): Promise<void> {
        const promises = userIds.map(userId =>
            this.sendNotification(
                userId,
                'DRAFT_START',
                'Draft Starting Soon! 🏈',
                `Your draft is starting in 15 minutes. Get ready!`,
                {
                    leagueId,
                    priority: 'high',
                    actionUrl: `/draft/${leagueId}`,
                    actionText: 'Join Draft',
                    scheduledFor: new Date(startTime.getTime() - 15 * 60 * 1000)
                }
            )
        );

        await Promise.all(promises);
    }

    // Oracle-specific notifications
    async sendOraclePredictionUpdate(
        userId: string,
        predictionId: string,
        question: string,
        confidence: number,
        reasoning?: string
    ): Promise<void> {
        await this.sendFromTemplate('oracle-prediction-update', userId, {
            question,
            confidence: confidence.toString()
        }, {
            priority: 'medium',
            actionUrl: `/oracle/predictions/${predictionId}`,
            actionText: 'View Prediction',
            data: { predictionId, confidence, reasoning }
        });
    }

    async sendOracleResultNotification(
        userId: string,
        challengeId: string,
        result: 'won' | 'lost',
        points: number
    ): Promise<void> {
        const title = result === 'won' ? 'Oracle Challenge Won! 🎉' : 'Oracle Challenge Complete';
        const message = result === 'won' 
            ? `Congratulations! You earned ${points} points.`
            : `Challenge complete. Better luck next time!`;

        await this.sendNotification(
            userId,
            'ORACLE_RESULT',
            title,
            message,
            {
                priority: result === 'won' ? 'medium' : 'low',
                actionUrl: `/oracle/challenges/${challengeId}`,
                actionText: 'View Result',
                data: { challengeId, result, points }
            }
        );
    }

    // League-specific notifications
    async sendTradeProposal(
        userId: string,
        fromTeamName: string,
        leagueId: string,
        tradeId: string
    ): Promise<void> {
        await this.sendFromTemplate('trade-proposal', userId, {
            fromTeam: fromTeamName,
            leagueName: 'League'
        }, {
            leagueId,
            priority: 'medium',
            actionUrl: `/league/${leagueId}/trades/${tradeId}`,
            actionText: 'Review Trade',
            data: { tradeId, fromTeamName }
        });
    }

    async sendLeagueAnnouncement(
        userIds: string[],
        leagueId: string,
        commissionerName: string,
        announcement: string
    ): Promise<void> {
        const promises = userIds.map(userId =>
            this.sendFromTemplate('league-announcement', userId, {
                commissionerName,
                leagueName: 'League',
                announcement: announcement.substring(0, 100) + (announcement.length > 100 ? '...' : '')
            }, {
                leagueId,
                priority: 'medium',
                actionUrl: `/league/${leagueId}/announcements`,
                actionText: 'View Details',
                data: { announcement, commissionerName }
            })
        );

        await Promise.all(promises);
    }

    // Notification management
    async getNotifications(
        userId: string,
        options: {
            category?: string;
            limit?: number;
            offset?: number;
            unreadOnly?: boolean;
        } = {}
    ): Promise<EnhancedNotification[]> {
        const userNotifications = this.notifications.get(userId) || [];
        
        let filtered = userNotifications;
        
        if (options.category) {
            filtered = filtered.filter(n => n.category === options.category);
        }
        
        if (options.unreadOnly) {
            filtered = filtered.filter(n => !n.isRead);
        }
        
        // Sort by priority and creation date
        filtered.sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });
        
        const offset = options.offset || 0;
        const limit = options.limit || 50;
        
        return filtered.slice(offset, offset + limit);
    }

    async markAsRead(userId: string, notificationId: string): Promise<void> {
        const userNotifications = this.notifications.get(userId) || [];
        const notification = userNotifications.find(n => n.id === notificationId);
        
        if (notification && !notification.isRead) {
            notification.isRead = true;
            await this.saveNotifications(userId);
            this.emitNotificationEvent('read', notification);
        }
    }

    async markAllAsRead(userId: string, category?: string): Promise<void> {
        const userNotifications = this.notifications.get(userId) || [];
        
        userNotifications.forEach(notification => {
            if (!notification.isRead && (!category || notification.category === category)) {
                notification.isRead = true;
                this.emitNotificationEvent('read', notification);
            }
        });
        
        await this.saveNotifications(userId);
    }

    async archiveNotification(userId: string, notificationId: string): Promise<void> {
        const userNotifications = this.notifications.get(userId) || [];
        const notification = userNotifications.find(n => n.id === notificationId);
        
        if (notification) {
            notification.isArchived = true;
            await this.saveNotifications(userId);
            this.emitNotificationEvent('archived', notification);
        }
    }

    async deleteNotification(userId: string, notificationId: string): Promise<void> {
        const userNotifications = this.notifications.get(userId) || [];
        const index = userNotifications.findIndex(n => n.id === notificationId);
        
        if (index !== -1) {
            const notification = userNotifications[index];
            userNotifications.splice(index, 1);
            await this.saveNotifications(userId);
            this.emitNotificationEvent('deleted', notification);
        }
    }

    // Preferences management
    async getUserPreferences(userId: string): Promise<NotificationPreferences> {
        let preferences = this.userPreferences.get(userId);
        
        if (!preferences) {
            preferences = this.getDefaultPreferences(userId);
            this.userPreferences.set(userId, preferences);
            await this.saveUserPreferences(userId);
        }
        
        return preferences;
    }

    async updateUserPreferences(
        userId: string,
        updates: Partial<NotificationPreferences>
    ): Promise<void> {
        const current = await this.getUserPreferences(userId);
        const updated = { ...current, ...updates };
        
        this.userPreferences.set(userId, updated);
        await this.saveUserPreferences(userId);
        
        this.emitNotificationEvent('preferencesUpdated', updated);
    }

    // Utility methods
    private getCategoryFromType(type: EnhancedNotificationType): 'draft' | 'oracle' | 'league' | 'system' {
        if (['DRAFT_PICK', 'DRAFT_START', 'DRAFT_PAUSE'].includes(type)) {
            return 'draft';
        }
        if (['ORACLE_PREDICTION', 'ORACLE_RESULT', 'ACHIEVEMENT'].includes(type)) {
            return 'oracle';
        }
        if (['TRADE', 'WAIVER', 'LEAGUE_UPDATE', 'MATCHUP_UPDATE'].includes(type)) {
            return 'league';
        }
        return 'system';
    }

    private shouldSendNotification(
        notification: EnhancedNotification,
        preferences: NotificationPreferences
    ): boolean {
        // Check if notifications are enabled for this category
        const categoryPrefs = preferences.categories[notification.category];
        if (!categoryPrefs.enabled) return false;

        // Check quiet hours
        if (this.isQuietHours(preferences)) return false;

        // Check daily limit (implement more sophisticated counting later if needed)
        return true;
    }

    private isQuietHours(preferences: NotificationPreferences): boolean {
        if (!preferences.quietHours.enabled) return false;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const start = preferences.quietHours.startTime;
        const end = preferences.quietHours.endTime;
        
        if (start <= end) {
            return currentTime >= start && currentTime <= end;
        } else {
            // Quiet hours span midnight
            return currentTime >= start || currentTime <= end;
        }
    }

    private async deliverNotification(
        notification: EnhancedNotification,
        preferences: NotificationPreferences
    ): Promise<void> {
        const categoryPrefs = preferences.categories[notification.category];

        // Push notification
        if (categoryPrefs.pushEnabled && preferences.enablePushNotifications) {
            await this.sendPushNotification(notification);
        }

        // In-app notification (always sent for immediate display)
        this.sendInAppNotification(notification);
    }

    private async sendPushNotification(notification: EnhancedNotification): Promise<void> {
        if (!this.serviceWorker) return;

        try {
            await this.serviceWorker.showNotification(notification.title, {
                body: notification.message,
                icon: notification.imageUrl || '/favicon.svg',
                badge: '/favicon.svg',
                tag: notification.id,
                data: {
                    notificationId: notification.id,
                    actionUrl: notification.actionUrl,
                    category: notification.category
                },
                requireInteraction: notification.priority === 'urgent'
            });
        } catch (error) {
            console.error('Failed to send push notification:', error);
        }
    }

    private sendInAppNotification(notification: EnhancedNotification): void {
        // Emit event for in-app notification display
        this.emitNotificationEvent('display', notification);
    }

    private formatTimeRemaining(seconds: number): string {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m`;
    }

    private getDefaultPreferences(userId: string): NotificationPreferences {
        return {
            userId,
            enablePushNotifications: true,
            enableInAppNotifications: true,
            enableEmailNotifications: false,
            enableSoundNotifications: true,
            categories: {
                draft: {
                    enabled: true,
                    pushEnabled: true,
                    emailEnabled: false,
                    pickReminders: true,
                    draftStart: true,
                    draftEnd: true,
                    autopickWarnings: true
                },
                oracle: {
                    enabled: true,
                    pushEnabled: true,
                    emailEnabled: false,
                    predictionUpdates: true,
                    challengeReminders: true,
                    resultsAvailable: true,
                    achievementUnlocked: true
                },
                league: {
                    enabled: true,
                    pushEnabled: true,
                    emailEnabled: false,
                    tradeProposals: true,
                    waiverResults: true,
                    matchupUpdates: true,
                    leagueAnnouncements: true
                },
                system: {
                    enabled: true,
                    pushEnabled: false,
                    emailEnabled: false,
                    maintenanceAlerts: true,
                    featureUpdates: false,
                    securityAlerts: true
                }
            },
            quietHours: {
                enabled: true,
                startTime: '22:00',
                endTime: '08:00',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            maxNotificationsPerDay: 50
        };
    }

    // Storage methods
    private async storeNotification(notification: EnhancedNotification): Promise<void> {
        const userNotifications = this.notifications.get(notification.userId) || [];
        userNotifications.unshift(notification);
        
        // Keep only last 100 notifications per user
        if (userNotifications.length > 100) {
            userNotifications.splice(100);
        }
        
        this.notifications.set(notification.userId, userNotifications);
        await this.saveNotifications(notification.userId);
    }

    private async saveNotifications(userId: string): Promise<void> {
        try {
            const notifications = this.notifications.get(userId) || [];
            localStorage.setItem(`astral_notifications_${userId}`, JSON.stringify(notifications));
        } catch (error) {
            console.error('Failed to save notifications:', error);
        }
    }

    private async loadUserPreferences(): Promise<void> {
        try {
            const user = authService.getCurrentUser();
            if (user) {
                const storedPrefs = localStorage.getItem(`astral_notification_prefs_${user.id}`);
                if (storedPrefs) {
                    const preferences = JSON.parse(storedPrefs);
                    this.userPreferences.set(user.id.toString(), preferences);
                }
            }
        } catch (error) {
            console.error('Failed to load user preferences:', error);
        }
    }

    private async saveUserPreferences(userId: string): Promise<void> {
        try {
            const preferences = this.userPreferences.get(userId);
            if (preferences) {
                localStorage.setItem(`astral_notification_prefs_${userId}`, JSON.stringify(preferences));
            }
        } catch (error) {
            console.error('Failed to save user preferences:', error);
        }
    }

    private cleanupExpiredNotifications(): void {
        const now = new Date();
        
        this.notifications.forEach((userNotifications, userId) => {
            const filtered = userNotifications.filter(notification => 
                !notification.expiresAt || notification.expiresAt > now
            );
            
            if (filtered.length !== userNotifications.length) {
                this.notifications.set(userId, filtered);
                this.saveNotifications(userId);
            }
        });
    }

    private async processOfflineQueue(): Promise<void> {
        if (this.offlineQueue.length === 0) return;

        const queue = [...this.offlineQueue];
        this.offlineQueue = [];

        for (const notification of queue) {
            try {
                const preferences = await this.getUserPreferences(notification.userId);
                await this.deliverNotification(notification, preferences);
            } catch (error) {
                console.error('Failed to process offline notification:', error);
                // Re-queue on failure
                this.offlineQueue.push(notification);
            }
        }
    }

    // Event handling
    addEventListener(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.push(callback);
        }
    }

    removeEventListener(event: string, callback: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    private emitNotificationEvent(event: string, data: any): void {
        const listeners = this.eventListeners.get(event) || [];
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Notification event callback error:', error);
            }
        });
    }

    // Stats and analytics
    async getNotificationStats(userId: string): Promise<NotificationStats> {
        const notifications = this.notifications.get(userId) || [];
        const read = notifications.filter(n => n.isRead);
        
        const typeCount = notifications.reduce((acc, n) => {
            acc[n.type] = (acc[n.type] || 0) + 1;
            return acc;
        }, {} as { [type: string]: number });

        const topTypes = Object.entries(typeCount)
            .map(([type, count]) => ({ type: type as EnhancedNotificationType, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const categoryCount = notifications.reduce((acc, n) => {
            acc[n.category] = (acc[n.category] || 0) + 1;
            return acc;
        }, {} as { [category: string]: number });

        return {
            totalSent: notifications.length,
            totalRead: read.length,
            readRate: notifications.length > 0 ? (read.length / notifications.length) * 100 : 0,
            averageReadTime: 0, // Will be implemented with read time tracking in future
            topTypes,
            engagementByCategory: categoryCount
        };
    }
}

// Export singleton instance
export const enhancedNotificationService = new EnhancedNotificationService();
export default enhancedNotificationService;
