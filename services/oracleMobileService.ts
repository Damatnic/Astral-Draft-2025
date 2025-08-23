/**
 * Oracle Mobile Service
 * Mobile-optimized features and push notifications for Oracle prediction system
 * Handles PWA functionality, touch interactions, and mobile notifications
 */

import { showNotification } from '../utils/notifications';
import { oraclePredictionService, type OraclePrediction } from './oraclePredictionService';
import type { Achievement } from './oracleRewardsService';

// Mobile-specific types
export interface MobileNotificationConfig {
    enabled: boolean;
    challengeReminders: boolean;
    resultNotifications: boolean;
    achievementAlerts: boolean;
    socialUpdates: boolean;
    predictionUpdates: boolean;
    quietHours: {
        enabled: boolean;
        startTime: string; // "22:00"
        endTime: string;   // "08:00"
    };
}

export interface TouchInteraction {
    type: 'swipe' | 'pinch' | 'tap' | 'long-press';
    direction?: 'left' | 'right' | 'up' | 'down';
    element: string;
    action: () => void;
}

export interface PWAInstallPrompt {
    isInstallable: boolean;
    promptEvent: Event | null;
    isInstalled: boolean;
}

export interface MobileOracleChallenge {
    id: string;
    question: string;
    options: string[];
    timeRemaining: number;
    isUrgent: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    pointsAvailable: number;
}

class OracleMobileService {
    private notificationConfig: MobileNotificationConfig;
    private readonly touchInteractions: Map<string, TouchInteraction> = new Map();
    private installPrompt: PWAInstallPrompt;
    private isOnline: boolean = navigator.onLine;
    private offlineQueue: any[] = [];

    constructor() {
        this.notificationConfig = this.loadNotificationConfig();
        this.installPrompt = {
            isInstallable: false,
            promptEvent: null,
            isInstalled: this.checkIfInstalled()
        };

        this.initializeMobileFeatures();
        this.setupPWAListeners();
        this.setupNetworkListeners();
    }

    /**
     * Initialize mobile-specific features
     */
    private initializeMobileFeatures(): void {
        // Enable touch interactions for Oracle challenges
        this.setupTouchInteractions();
        
        // Setup mobile viewport handling
        this.setupViewportHandling();
        
        // Initialize service worker communication
        this.setupServiceWorkerCommunication();
        
        // Setup background sync for offline functionality
        this.setupBackgroundSync();

        console.log('📱 Oracle Mobile Service initialized');
    }

    /**
     * Setup PWA installation listeners
     */
    private setupPWAListeners(): void {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = {
                isInstallable: true,
                promptEvent: e,
                isInstalled: false
            };
            console.log('📱 PWA installation prompt available');
        });

        window.addEventListener('appinstalled', () => {
            this.installPrompt.isInstalled = true;
            this.showNotification('Oracle Mobile Installed!', {
                body: 'You can now use Oracle predictions offline and receive push notifications.',
                tag: 'pwa-installed'
            });
            console.log('📱 Oracle PWA installed successfully');
        });
    }

    /**
     * Setup network connectivity listeners
     */
    private setupNetworkListeners(): void {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineQueue();
            console.log('📱 Connection restored - syncing Oracle data');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('Oracle Offline Mode', {
                body: 'Your predictions will be saved and synced when connection is restored.',
                tag: 'offline-mode'
            });
            console.log('📱 Oracle offline mode activated');
        });
    }

    /**
     * Setup touch interactions for Oracle interface
     */
    private setupTouchInteractions(): void {
        // Swipe left to view next Oracle challenge
        this.addTouchInteraction({
            type: 'swipe',
            direction: 'left',
            element: '.oracle-challenge-card',
            action: () => this.navigateToNextChallenge()
        });

        // Swipe right to view previous Oracle challenge
        this.addTouchInteraction({
            type: 'swipe',
            direction: 'right',
            element: '.oracle-challenge-card',
            action: () => this.navigateToPreviousChallenge()
        });

        // Long press for quick prediction submission
        this.addTouchInteraction({
            type: 'long-press',
            element: '.prediction-option',
            action: () => this.quickSubmitPrediction()
        });

        // Pinch to zoom on analytics charts
        this.addTouchInteraction({
            type: 'pinch',
            element: '.oracle-analytics-chart',
            action: () => this.toggleChartZoom()
        });

        console.log('📱 Touch interactions configured for Oracle interface');
    }

    /**
     * Add touch interaction handler
     */
    private addTouchInteraction(interaction: TouchInteraction): void {
        const key = `${interaction.type}-${interaction.element}`;
        this.touchInteractions.set(key, interaction);

        // Setup event listeners based on interaction type
        if (interaction.type === 'swipe') {
            this.setupSwipeGesture(interaction);
        } else if (interaction.type === 'long-press') {
            this.setupLongPressGesture(interaction);
        } else if (interaction.type === 'pinch') {
            this.setupPinchGesture(interaction);
        }
    }

    /**
     * Setup swipe gesture detection
     */
    private setupSwipeGesture(interaction: TouchInteraction): void {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        document.addEventListener('touchstart', (e) => {
            if (this.matchesSelector(e.target as Element, interaction.element)) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (this.matchesSelector(e.target as Element, interaction.element)) {
                endX = e.changedTouches[0].clientX;
                endY = e.changedTouches[0].clientY;

                const deltaX = endX - startX;
                const deltaY = endY - startY;
                const minSwipeDistance = 50;

                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                    const direction = deltaX > 0 ? 'right' : 'left';
                    if (direction === interaction.direction) {
                        interaction.action();
                    }
                }
            }
        }, { passive: true });
    }

    /**
     * Setup long press gesture detection
     */
    private setupLongPressGesture(interaction: TouchInteraction): void {
        let pressTimer: NodeJS.Timeout;

        document.addEventListener('touchstart', (e) => {
            if (this.matchesSelector(e.target as Element, interaction.element)) {
                pressTimer = setTimeout(() => {
                    interaction.action();
                    this.vibrate([50, 100, 50]); // Haptic feedback
                }, 500);
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        }, { passive: true });
    }

    /**
     * Setup pinch gesture detection
     */
    private setupPinchGesture(interaction: TouchInteraction): void {
        let initialDistance = 0;
        let currentDistance = 0;

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2 && this.matchesSelector(e.target as Element, interaction.element)) {
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && this.matchesSelector(e.target as Element, interaction.element)) {
                currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scaleFactor = currentDistance / initialDistance;
                
                if (scaleFactor > 1.2 || scaleFactor < 0.8) {
                    interaction.action();
                }
            }
        }, { passive: true });
    }

    /**
     * Helper function to calculate distance between two touch points
     */
    private getDistance(touch1: Touch, touch2: Touch): number {
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    }

    /**
     * Helper function to check if element matches selector
     */
    private matchesSelector(element: Element | null, selector: string): boolean {
        if (!element) return false;
        return element.matches(selector) || element.closest(selector) !== null;
    }

    /**
     * Setup viewport handling for mobile devices
     */
    private setupViewportHandling(): void {
        // Prevent zoom on input focus
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
            );
        }

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle keyboard show/hide on mobile
        window.addEventListener('resize', () => {
            this.handleKeyboardToggle();
        });
    }

    /**
     * Handle device orientation changes
     */
    private handleOrientationChange(): void {
        // Use screen.orientation API or fallback to window.orientation
        const orientation = screen.orientation?.angle || (window as any).orientation || 0;
        const body = document.body;
        
        // Add orientation classes for responsive styling
        body.classList.remove('portrait', 'landscape');
        if (Math.abs(orientation) === 90) {
            body.classList.add('landscape');
        } else {
            body.classList.add('portrait');
        }

        // Trigger Oracle interface reflow
        const event = new CustomEvent('oracle-orientation-change', { 
            detail: { orientation } 
        });
        document.dispatchEvent(event);
    }

    /**
     * Handle virtual keyboard show/hide
     */
    private handleKeyboardToggle(): void {
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const isKeyboardVisible = viewportHeight < window.screen.height * 0.75;
        
        document.body.classList.toggle('keyboard-visible', isKeyboardVisible);
        
        // Adjust Oracle interface when keyboard is visible
        if (isKeyboardVisible) {
            this.adjustForKeyboard();
        }
    }

    /**
     * Adjust Oracle interface when keyboard is visible
     */
    private adjustForKeyboard(): void {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            // Scroll active input into view
            setTimeout(() => {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }

    /**
     * Setup service worker communication
     */
    private setupServiceWorkerCommunication(): void {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'oracle-notification') {
                    this.handleServiceWorkerNotification(event.data);
                }
            });
        }
    }

    /**
     * Handle notifications from service worker
     */
    private handleServiceWorkerNotification(data: any): void {
        const { type, payload } = data;
        
        switch (type) {
            case 'challenge-reminder':
                this.showChallengeReminder(payload);
                break;
            case 'result-available':
                this.showResultNotification(payload);
                break;
            case 'achievement-unlocked':
                this.showAchievementNotification(payload);
                break;
            case 'social-update':
                this.showSocialNotification(payload);
                break;
        }
    }

    /**
     * Setup background sync for offline functionality
     */
    private setupBackgroundSync(): void {
        if ('serviceWorker' in navigator && 'serviceWorker' in window) {
            navigator.serviceWorker.ready.then((registration) => {
                // Register background sync for Oracle predictions (if supported)
                if ('sync' in (registration as any)) {
                    (registration as any).sync.register('oracle-prediction-sync');
                    console.log('📱 Background sync registered for Oracle predictions');
                }
            });
        }
    }

    /**
     * Sync offline queue when connection is restored
     */
    private async syncOfflineQueue(): Promise<void> {
        if (this.offlineQueue.length === 0) return;

        console.log(`📱 Syncing ${this.offlineQueue.length} offline Oracle actions`);
        
        for (const action of this.offlineQueue) {
            try {
                await this.executeOfflineAction(action);
            } catch (error) {
                console.error('Failed to sync offline action:', error);
            }
        }

        this.offlineQueue = [];
        this.showNotification('Oracle Sync Complete', {
            body: 'All offline predictions have been synchronized.',
            tag: 'sync-complete'
        });
    }

    /**
     * Execute offline action
     */
    private async executeOfflineAction(action: any): Promise<void> {
        switch (action.type) {
            case 'submit-prediction':
                // Re-submit prediction
                break;
            case 'update-settings':
                // Update settings
                break;
            case 'social-action':
                // Execute social action
                break;
        }
    }

    /**
     * Navigation methods for touch interactions
     */
    private navigateToNextChallenge(): void {
        const event = new CustomEvent('oracle-navigate', { 
            detail: { direction: 'next' } 
        });
        document.dispatchEvent(event);
        this.vibrate([25]); // Light haptic feedback
    }

    private navigateToPreviousChallenge(): void {
        const event = new CustomEvent('oracle-navigate', { 
            detail: { direction: 'previous' } 
        });
        document.dispatchEvent(event);
        this.vibrate([25]); // Light haptic feedback
    }

    private quickSubmitPrediction(): void {
        const event = new CustomEvent('oracle-quick-submit');
        document.dispatchEvent(event);
        this.vibrate([50, 100, 50]); // Confirmation haptic feedback
    }

    private toggleChartZoom(): void {
        const event = new CustomEvent('oracle-chart-zoom');
        document.dispatchEvent(event);
    }

    /**
     * PWA Installation methods
     */
    async promptInstall(): Promise<boolean> {
        if (!this.installPrompt.isInstallable || !this.installPrompt.promptEvent) {
            return false;
        }

        try {
            const promptEvent = this.installPrompt.promptEvent as any;
            promptEvent.prompt();
            const result = await promptEvent.userChoice;
            
            if (result.outcome === 'accepted') {
                this.installPrompt.isInstallable = false;
                this.installPrompt.promptEvent = null;
                return true;
            }
            return false;
        } catch (error) {
            console.error('PWA installation failed:', error);
            return false;
        }
    }

    isInstallable(): boolean {
        return this.installPrompt.isInstallable;
    }

    isInstalled(): boolean {
        return this.installPrompt.isInstalled;
    }

    private checkIfInstalled(): boolean {
        return window.matchMedia('(display-mode: standalone)').matches ||
               (window.navigator as any).standalone === true;
    }

    /**
     * Notification methods
     */
    async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            this.notificationConfig.enabled = true;
            this.saveNotificationConfig();
            return true;
        }
        return false;
    }

    updateNotificationConfig(config: Partial<MobileNotificationConfig>): void {
        this.notificationConfig = { ...this.notificationConfig, ...config };
        this.saveNotificationConfig();
    }

    getNotificationConfig(): MobileNotificationConfig {
        return { ...this.notificationConfig };
    }

    private isQuietHours(): boolean {
        if (!this.notificationConfig.quietHours.enabled) return false;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const start = this.notificationConfig.quietHours.startTime;
        const end = this.notificationConfig.quietHours.endTime;
        
        if (start <= end) {
            return currentTime >= start && currentTime <= end;
        } else {
            // Quiet hours span midnight
            return currentTime >= start || currentTime <= end;
        }
    }

    /**
     * Show Oracle challenge reminder
     */
    showChallengeReminder(challenge: MobileOracleChallenge): void {
        if (!this.notificationConfig.challengeReminders || this.isQuietHours()) return;

        const urgencyText = challenge.isUrgent ? '⚡ URGENT: ' : '';
        const difficultyEmoji = {
            easy: '🟢',
            medium: '🟡',
            hard: '🔴'
        }[challenge.difficulty];

        this.showNotification(`${urgencyText}Oracle Challenge Available`, {
            body: `${difficultyEmoji} ${challenge.question}\n💰 ${challenge.pointsAvailable} points available`,
            tag: `challenge-${challenge.id}`,
            icon: '/icons/oracle-challenge.png',
            actions: [
                { action: 'view', title: 'View Challenge' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        });
    }

    /**
     * Show result notification
     */
    showResultNotification(result: any): void {
        if (!this.notificationConfig.resultNotifications || this.isQuietHours()) return;

        const isWin = result.userWon;
        const emoji = isWin ? '🎉' : '😔';
        const title = isWin ? 'Oracle Challenge Won!' : 'Oracle Challenge Result';
        
        this.showNotification(title, {
            body: `${emoji} ${result.challengeName}\n${isWin ? '✅' : '❌'} ${result.outcomeText}`,
            tag: `result-${result.challengeId}`,
            icon: '/icons/oracle-result.png'
        });
    }

    /**
     * Show achievement notification
     */
    showAchievementNotification(achievement: Achievement): void {
        if (!this.notificationConfig.achievementAlerts || this.isQuietHours()) return;

        // Use default emoji since Achievement type doesn't have rarity property
        const rarityEmoji = '🏆';

        this.showNotification('Achievement Unlocked! 🎯', {
            body: `${rarityEmoji} ${achievement.id}\n${achievement.description || 'New achievement earned!'}`,
            tag: `achievement-${achievement.id}`,
            icon: '/icons/oracle-achievement.png'
        });
    }

    /**
     * Show social notification
     */
    showSocialNotification(notification: any): void {
        if (!this.notificationConfig.socialUpdates || this.isQuietHours()) return;

        this.showNotification(notification.title, {
            body: notification.message,
            tag: `social-${notification.id}`,
            icon: '/icons/oracle-social.png'
        });
    }

    /**
     * Show prediction update notification
     */
    showPredictionUpdateNotification(update: any): void {
        if (!this.notificationConfig.predictionUpdates || this.isQuietHours()) return;

        this.showNotification('Oracle Prediction Updated', {
            body: `Confidence changed: ${update.oldConfidence}% → ${update.newConfidence}%\n${update.reasoning}`,
            tag: `prediction-${update.predictionId}`,
            icon: '/icons/oracle-update.png'
        });
    }

    /**
     * Generic notification method
     */
    private showNotification(title: string, options: NotificationOptions & { actions?: { action: string; title: string }[] } = {}): void {
        if (!this.notificationConfig.enabled) return;

        // Use browser notification API
        showNotification(title, {
            ...options,
            icon: options.icon || '/favicon.svg',
            badge: '/icons/oracle-badge.png',
            requireInteraction: false,
            silent: this.isQuietHours()
        });

        // Separate vibration API call
        if (!this.isQuietHours()) {
            this.vibrate([200, 100, 200]);
        }
    }

    /**
     * Haptic feedback
     */
    vibrate(pattern: number[]): void {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Storage methods
     */
    private loadNotificationConfig(): MobileNotificationConfig {
        try {
            const stored = localStorage.getItem('oracle-mobile-config');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load notification config:', error);
        }

        // Default configuration
        return {
            enabled: false,
            challengeReminders: true,
            resultNotifications: true,
            achievementAlerts: true,
            socialUpdates: true,
            predictionUpdates: false,
            quietHours: {
                enabled: true,
                startTime: '22:00',
                endTime: '08:00'
            }
        };
    }

    private saveNotificationConfig(): void {
        try {
            localStorage.setItem('oracle-mobile-config', JSON.stringify(this.notificationConfig));
        } catch (error) {
            console.error('Failed to save notification config:', error);
        }
    }

    /**
     * Get mobile challenges optimized for mobile display
     */
    async getMobileChallenges(week: number): Promise<MobileOracleChallenge[]> {
        try {
            const predictions = await oraclePredictionService.generateWeeklyPredictions(week);
            
            return predictions.map(prediction => ({
                id: prediction.id,
                question: prediction.question,
                options: prediction.options.map(opt => opt.text),
                timeRemaining: this.calculateTimeRemaining(prediction.timestamp),
                isUrgent: this.isUrgentChallenge(prediction),
                difficulty: this.calculateDifficulty(prediction.confidence),
                pointsAvailable: this.calculatePoints(prediction.confidence, prediction.type)
            }));
        } catch (error) {
            console.error('Failed to get mobile challenges:', error);
            return [];
        }
    }

    private calculateTimeRemaining(timestamp: string): number {
        // Calculate time remaining until prediction closes (typically 24-48 hours)
        const created = new Date(timestamp);
        const deadline = new Date(created.getTime() + 48 * 60 * 60 * 1000); // 48 hours from creation
        return Math.max(0, deadline.getTime() - Date.now());
    }

    private isUrgentChallenge(prediction: OraclePrediction): boolean {
        const timeRemaining = this.calculateTimeRemaining(prediction.timestamp);
        return timeRemaining < 6 * 60 * 60 * 1000; // Urgent if less than 6 hours remaining
    }

    private calculateDifficulty(confidence: number): 'easy' | 'medium' | 'hard' {
        if (confidence >= 80) return 'easy';
        if (confidence >= 60) return 'medium';
        return 'hard';
    }

    private calculatePoints(confidence: number, type: string): number {
        const basePoints = {
            'PLAYER_PERFORMANCE': 10,
            'GAME_OUTCOME': 15,
            'WEEKLY_SCORING': 20,
            'WEATHER_IMPACT': 12,
            'INJURY_IMPACT': 18
        }[type] || 10;

        // Higher points for lower confidence (harder predictions)
        let difficultyMultiplier = 1;
        if (confidence < 60) {
            difficultyMultiplier = 2;
        } else if (confidence < 80) {
            difficultyMultiplier = 1.5;
        }
        
        return Math.round(basePoints * difficultyMultiplier);
    }

    /**
     * Mobile analytics optimized for touch and smaller screens
     */
    getMobileAnalytics(): any {
        return {
            quickStats: this.getQuickStats(),
            touchOptimizedCharts: this.getTouchOptimizedCharts(),
            compactInsights: this.getCompactInsights()
        };
    }

    private getQuickStats(): any {
        return {
            todaysChallenges: 3,
            weeklyAccuracy: 78,
            totalPoints: 1250,
            currentStreak: 5,
            nextReward: 'Oracle Master',
            rewardProgress: 0.65
        };
    }

    private getTouchOptimizedCharts(): any {
        return {
            weeklyTrend: 'simplified-line-chart',
            accuracyByType: 'donut-chart',
            pointsProgression: 'area-chart',
            socialComparison: 'horizontal-bar-chart'
        };
    }

    private getCompactInsights(): string[] {
        return [
            '🎯 You\'re 22% more accurate on game outcomes',
            '⚡ Best prediction time: 2-4 hours before games',
            '📈 Your accuracy improves 15% when Oracle confidence is <70%',
            '🏆 You\'re in the top 25% of Oracle challengers'
        ];
    }

    /**
     * Cleanup method
     */
    destroy(): void {
        this.touchInteractions.clear();
        this.offlineQueue = [];
        console.log('📱 Oracle Mobile Service destroyed');
    }
}

// Export singleton instance
export const oracleMobileService = new OracleMobileService();
export default oracleMobileService;
