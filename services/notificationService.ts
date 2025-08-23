/**
 * Oracle Notification Service
 * Handles browser notifications, in-app notifications, and notification preferences
 */

export interface OracleNotification {
    id: string;
    type: 'deadline_warning' | 'result_announced' | 'accuracy_update' | 'streak_milestone' | 'ranking_change';
    title: string;
    message: string;
    predictionId?: string;
    timestamp: string;
    isRead: boolean;
    priority: 'low' | 'medium' | 'high';
    actionUrl?: string;
    data?: Record<string, any>;
}

export interface NotificationPreferences {
    browserNotifications: boolean;
    inAppNotifications: boolean;
    emailNotifications: boolean;
    deadlineWarnings: boolean;
    resultAnnouncements: boolean;
    accuracyUpdates: boolean;
    streakMilestones: boolean;
    rankingChanges: boolean;
    timeBeforeDeadline: number; // minutes
}

class NotificationService {
    private static instance: NotificationService;
    private notifications: OracleNotification[] = [];
    private preferences: NotificationPreferences;
    private notificationCallbacks: ((notification: OracleNotification) => void)[] = [];

    private constructor() {
        this.preferences = this.loadPreferences();
        this.loadNotifications();
        this.requestNotificationPermission();
    }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    // Notification Management
    async addNotification(notification: Omit<OracleNotification, 'id' | 'timestamp' | 'isRead'>): Promise<void> {
        const newNotification: OracleNotification = {
            ...notification,
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            isRead: false
        };

        this.notifications.unshift(newNotification);
        this.saveNotifications();

        // Send browser notification if enabled and permission granted
        if (this.preferences.browserNotifications && this.shouldSendNotification(notification.type)) {
            await this.sendBrowserNotification(newNotification);
        }

        // Trigger in-app notification callbacks
        if (this.preferences.inAppNotifications) {
            this.notificationCallbacks.forEach(callback => callback(newNotification));
        }
    }

    getNotifications(): OracleNotification[] {
        return [...this.notifications];
    }

    getUnreadNotifications(): OracleNotification[] {
        return this.notifications.filter(n => !n.isRead);
    }

    markAsRead(notificationId: string): void {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.isRead = true;
            this.saveNotifications();
        }
    }

    markAllAsRead(): void {
        this.notifications.forEach(n => n.isRead = true);
        this.saveNotifications();
    }

    clearNotifications(): void {
        this.notifications = [];
        this.saveNotifications();
    }

    // Prediction-specific notifications
    async notifyPredictionDeadline(predictionId: string, question: string, minutesRemaining: number): Promise<void> {
        if (!this.preferences.deadlineWarnings) return;

        await this.addNotification({
            type: 'deadline_warning',
            title: '⏰ Prediction Deadline Approaching',
            message: `"${question}" expires in ${minutesRemaining} minutes`,
            predictionId,
            priority: minutesRemaining <= 15 ? 'high' : 'medium',
            actionUrl: `/oracle?prediction=${predictionId}`
        });
    }

    async notifyPredictionResult(predictionId: string, question: string, isCorrect: boolean, pointsEarned: number): Promise<void> {
        if (!this.preferences.resultAnnouncements) return;

        await this.addNotification({
            type: 'result_announced',
            title: isCorrect ? '🎉 Correct Prediction!' : '📊 Prediction Result',
            message: `"${question}" - You ${isCorrect ? 'were correct' : 'missed this one'}. ${pointsEarned > 0 ? `+${pointsEarned} points` : 'No points earned'}`,
            predictionId,
            priority: isCorrect ? 'high' : 'medium',
            actionUrl: '/oracle/analytics',
            data: { isCorrect, pointsEarned }
        });
    }

    async notifyAccuracyUpdate(newAccuracy: number, previousAccuracy: number): Promise<void> {
        if (!this.preferences.accuracyUpdates) return;

        const isImprovement = newAccuracy > previousAccuracy;
        const change = Math.abs(newAccuracy - previousAccuracy);

        if (change >= 5) { // Only notify for significant changes
            await this.addNotification({
                type: 'accuracy_update',
                title: isImprovement ? '📈 Accuracy Improved!' : '📉 Accuracy Update',
                message: `Your prediction accuracy ${isImprovement ? 'increased' : 'decreased'} to ${newAccuracy.toFixed(1)}%`,
                priority: isImprovement ? 'medium' : 'low',
                actionUrl: '/oracle/analytics',
                data: { newAccuracy, previousAccuracy, change }
            });
        }
    }

    async notifyStreakMilestone(streakCount: number): Promise<void> {
        if (!this.preferences.streakMilestones) return;

        const milestones = [3, 5, 10, 15, 20, 25];
        if (milestones.includes(streakCount)) {
            await this.addNotification({
                type: 'streak_milestone',
                title: '🔥 Streak Milestone!',
                message: `You've reached a ${streakCount}-prediction winning streak!`,
                priority: 'high',
                actionUrl: '/oracle/analytics',
                data: { streakCount }
            });
        }
    }

    async notifyRankingChange(newRank: number, previousRank: number): Promise<void> {
        if (!this.preferences.rankingChanges) return;

        const isImprovement = newRank < previousRank;
        const change = Math.abs(newRank - previousRank);

        if (change >= 1) {
            await this.addNotification({
                type: 'ranking_change',
                title: isImprovement ? '🏆 Rank Improved!' : '📊 Ranking Update',
                message: `You ${isImprovement ? 'climbed' : 'dropped'} to rank #${newRank}`,
                priority: isImprovement ? 'medium' : 'low',
                actionUrl: '/oracle/analytics',
                data: { newRank, previousRank, change }
            });
        }
    }

    // Browser Notifications
    private async requestNotificationPermission(): Promise<void> {
        if (!('Notification' in window)) {
            console.warn('Browser does not support notifications');
            return;
        }

        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    private async sendBrowserNotification(notification: OracleNotification): Promise<void> {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: notification.id,
            requireInteraction: notification.priority === 'high',
            data: {
                notificationId: notification.id,
                actionUrl: notification.actionUrl
            }
        });

        browserNotification.onclick = () => {
            window.focus();
            this.markAsRead(notification.id);
            
            if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
            }
            
            browserNotification.close();
        };

        // Auto-close after 10 seconds for non-high priority notifications
        if (notification.priority !== 'high') {
            setTimeout(() => {
                browserNotification.close();
            }, 10000);
        }
    }

    // Preferences Management
    getPreferences(): NotificationPreferences {
        return { ...this.preferences };
    }

    updatePreferences(newPreferences: Partial<NotificationPreferences>): void {
        this.preferences = { ...this.preferences, ...newPreferences };
        this.savePreferences();
    }

    private loadPreferences(): NotificationPreferences {
        const defaultPreferences: NotificationPreferences = {
            browserNotifications: true,
            inAppNotifications: true,
            emailNotifications: false,
            deadlineWarnings: true,
            resultAnnouncements: true,
            accuracyUpdates: true,
            streakMilestones: true,
            rankingChanges: true,
            timeBeforeDeadline: 30 // 30 minutes
        };

        try {
            const saved = localStorage.getItem('oracle_notification_preferences');
            return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
        } catch {
            return defaultPreferences;
        }
    }

    private savePreferences(): void {
        try {
            localStorage.setItem('oracle_notification_preferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.warn('Failed to save notification preferences:', error);
        }
    }

    private loadNotifications(): void {
        try {
            const saved = localStorage.getItem('oracle_notifications');
            if (saved) {
                this.notifications = JSON.parse(saved);
                // Clean up old notifications (older than 7 days)
                const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                this.notifications = this.notifications.filter(n => n.timestamp > cutoff);
                this.saveNotifications();
            }
        } catch (error) {
            console.warn('Failed to load notifications:', error);
            this.notifications = [];
        }
    }

    private saveNotifications(): void {
        try {
            // Only keep the most recent 50 notifications
            const toSave = this.notifications.slice(0, 50);
            localStorage.setItem('oracle_notifications', JSON.stringify(toSave));
        } catch (error) {
            console.warn('Failed to save notifications:', error);
        }
    }

    private shouldSendNotification(type: OracleNotification['type']): boolean {
        switch (type) {
            case 'deadline_warning':
                return this.preferences.deadlineWarnings;
            case 'result_announced':
                return this.preferences.resultAnnouncements;
            case 'accuracy_update':
                return this.preferences.accuracyUpdates;
            case 'streak_milestone':
                return this.preferences.streakMilestones;
            case 'ranking_change':
                return this.preferences.rankingChanges;
            default:
                return true;
        }
    }

    private generateId(): string {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Callback Management
    onNotification(callback: (notification: OracleNotification) => void): () => void {
        this.notificationCallbacks.push(callback);
        return () => {
            const index = this.notificationCallbacks.indexOf(callback);
            if (index > -1) {
                this.notificationCallbacks.splice(index, 1);
            }
        };
    }

    // Scheduling for deadline notifications
    scheduleDeadlineNotifications(predictionId: string, question: string, expiresAt: string): void {
        const expireTime = new Date(expiresAt).getTime();
        const now = Date.now();

        // Schedule notifications at different intervals
        const intervals = [
            this.preferences.timeBeforeDeadline * 60 * 1000, // User preference
            15 * 60 * 1000, // 15 minutes
            5 * 60 * 1000,  // 5 minutes
            1 * 60 * 1000   // 1 minute
        ];

        intervals.forEach(interval => {
            const notificationTime = expireTime - interval;
            if (notificationTime > now) {
                const timeoutDuration = notificationTime - now;
                setTimeout(() => {
                    const minutesRemaining = Math.floor(interval / (60 * 1000));
                    this.notifyPredictionDeadline(predictionId, question, minutesRemaining);
                }, timeoutDuration);
            }
        });
    }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;
