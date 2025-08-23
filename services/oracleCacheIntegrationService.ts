/**
 * Oracle Cache Integration Service
 * Centralized service for Oracle caching integration across the application
 */

import { oracleIntelligentCachingService } from './oracleIntelligentCachingService';

interface CacheIntegrationOptions {
    enableAutoWarmup?: boolean;
    enableBackgroundSync?: boolean;
    enablePredictivePrefetch?: boolean;
    monitoringInterval?: number;
}

interface UserActivity {
    action: string;
    timestamp: number;
    data?: any;
}

interface CacheMetricsSnapshot {
    timestamp: number;
    hitRate: number;
    memoryUsage: number;
    responseTime: number;
    healthScore: number;
}

class OracleCacheIntegrationService {
    private readonly options: CacheIntegrationOptions;
    private userActivity: UserActivity[] = [];
    private metricsHistory: CacheMetricsSnapshot[] = [];
    private monitoringTimer: NodeJS.Timeout | null = null;
    private backgroundSyncTimer: NodeJS.Timeout | null = null;
    private isInitialized = false;

    constructor(options: CacheIntegrationOptions = {}) {
        this.options = {
            enableAutoWarmup: true,
            enableBackgroundSync: true,
            enablePredictivePrefetch: true,
            monitoringInterval: 30 * 1000, // 30 seconds
            ...options
        };
    }

    /**
     * Initialize the cache integration service
     */
    async initialize(userId: string): Promise<void> {
        if (this.isInitialized) return;

        console.log('🚀 Initializing Oracle Cache Integration Service...');

        // Auto-warmup cache with user data
        if (this.options.enableAutoWarmup) {
            await this.performAutoWarmup(userId);
        }

        // Start monitoring
        this.startMonitoring();

        // Start background sync
        if (this.options.enableBackgroundSync) {
            this.startBackgroundSync(userId);
        }

        // Setup predictive prefetching
        if (this.options.enablePredictivePrefetch) {
            this.setupPredictivePrefetch(userId);
        }

        this.isInitialized = true;
        console.log('✅ Oracle Cache Integration Service initialized');
    }

    /**
     * Track user activity for predictive caching
     */
    trackActivity(action: string, data?: any): void {
        const activity: UserActivity = {
            action,
            timestamp: Date.now(),
            data
        };

        this.userActivity.push(activity);

        // Keep only last 100 activities
        if (this.userActivity.length > 100) {
            this.userActivity = this.userActivity.slice(-100);
        }

        // Trigger predictive prefetch if enabled
        if (this.options.enablePredictivePrefetch) {
            this.handleActivityPrefetch(activity);
        }
    }

    /**
     * Get Oracle predictions with intelligent caching
     */
    async getOraclePredictions(
        week: number,
        userId: string,
        options?: {
            forceFresh?: boolean;
            background?: boolean;
        }
    ): Promise<any> {
        const cacheKey = `predictions:week:${week}:${userId}`;
        
        this.trackActivity('view_predictions', { week, userId });

        try {
            const predictions = await oracleIntelligentCachingService.get(
                cacheKey,
                async () => {
                    // Simulate API call
                    const response = await this.fetchFromAPI(`/api/oracle/predictions/${week}`, {
                        userId
                    });
                    return response;
                },
                {
                    strategy: 'predictions',
                    tags: ['predictions', 'oracle', `week-${week}`, `user-${userId}`],
                    forceFresh: options?.forceFresh
                }
            );

            // Prefetch next week's predictions if current week is requested
            if (!options?.forceFresh && this.isCurrentWeek(week)) {
                this.prefetchNextWeekPredictions(week + 1, userId);
            }

            return predictions;
        } catch (error) {
            console.error('Failed to get Oracle predictions:', error);
            throw error;
        }
    }

    /**
     * Get Oracle analytics with intelligent caching
     */
    async getOracleAnalytics(
        userId: string,
        timeRange: string = '7d',
        options?: { forceFresh?: boolean }
    ): Promise<any> {
        const cacheKey = `analytics:${userId}:${timeRange}`;
        
        this.trackActivity('view_analytics', { userId, timeRange });

        try {
            const analytics = await oracleIntelligentCachingService.get(
                cacheKey,
                async () => {
                    const response = await this.fetchFromAPI(`/api/oracle/analytics/${userId}`, {
                        range: timeRange
                    });
                    return response;
                },
                {
                    strategy: 'analytics',
                    tags: ['analytics', 'oracle', `user-${userId}`, `range-${timeRange}`],
                    forceFresh: options?.forceFresh
                }
            );

            // Prefetch related analytics ranges
            this.prefetchRelatedAnalytics(userId, timeRange);

            return analytics;
        } catch (error) {
            console.error('Failed to get Oracle analytics:', error);
            throw error;
        }
    }

    /**
     * Get Oracle leaderboard with intelligent caching
     */
    async getOracleLeaderboard(
        category: string = 'overall',
        options?: { forceFresh?: boolean }
    ): Promise<any> {
        const cacheKey = `leaderboard:${category}`;
        
        this.trackActivity('view_leaderboard', { category });

        try {
            const leaderboard = await oracleIntelligentCachingService.get(
                cacheKey,
                async () => {
                    const response = await this.fetchFromAPI(`/api/oracle/leaderboard/${category}`);
                    return response;
                },
                {
                    strategy: 'leaderboard',
                    tags: ['leaderboard', 'oracle', `category-${category}`],
                    forceFresh: options?.forceFresh
                }
            );

            return leaderboard;
        } catch (error) {
            console.error('Failed to get Oracle leaderboard:', error);
            throw error;
        }
    }

    /**
     * Submit Oracle prediction with cache invalidation
     */
    async submitOraclePrediction(
        week: number,
        userId: string,
        prediction: any
    ): Promise<any> {
        this.trackActivity('submit_prediction', { week, userId, prediction });

        try {
            // Submit prediction
            const result = await this.fetchFromAPI('/api/oracle/predictions', {
                method: 'POST',
                body: JSON.stringify({ week, userId, prediction })
            });

            // Invalidate related caches
            await this.invalidateUserCaches(userId, week);

            return result;
        } catch (error) {
            console.error('Failed to submit Oracle prediction:', error);
            throw error;
        }
    }

    /**
     * Invalidate caches related to user and week
     */
    private async invalidateUserCaches(userId: string, week?: number): Promise<void> {
        const tagsToInvalidate = [`user-${userId}`];
        
        if (week) {
            tagsToInvalidate.push(`week-${week}`);
        }

        // Also invalidate leaderboard
        tagsToInvalidate.push('leaderboard');

        oracleIntelligentCachingService.clearByTags(tagsToInvalidate);
        
        const weekInfo = week ? ` and week ${week}` : '';
        console.log(`🗑️ Invalidated caches for user ${userId}${weekInfo}`);
    }

    /**
     * Perform auto-warmup of frequently accessed data
     */
    private async performAutoWarmup(userId: string): Promise<void> {
        console.log('🔥 Starting auto-warmup process...');

        try {
            const currentWeek = this.getCurrentWeek();
            
            // Warmup current week predictions
            await oracleIntelligentCachingService.warmCache(userId, currentWeek);

            // Warmup common analytics ranges
            const commonRanges = ['1d', '7d', '30d'];
            for (const range of commonRanges) {
                const cacheKey = `analytics:${userId}:${range}`;
                await oracleIntelligentCachingService.set(
                    cacheKey,
                    { warmed: true, timestamp: Date.now() },
                    { 
                        strategy: 'analytics',
                        ttl: 60 * 1000 // Short TTL for warmup data
                    }
                );
            }

            // Warmup leaderboard
            const cacheKey = 'leaderboard:overall';
            await oracleIntelligentCachingService.set(
                cacheKey,
                { warmed: true, timestamp: Date.now() },
                { 
                    strategy: 'leaderboard',
                    ttl: 60 * 1000
                }
            );

            console.log('✅ Auto-warmup completed');
        } catch (error) {
            console.error('Auto-warmup failed:', error);
        }
    }

    /**
     * Start cache monitoring
     */
    private startMonitoring(): void {
        if (this.monitoringTimer) return;

        this.monitoringTimer = setInterval(() => {
            const stats = oracleIntelligentCachingService.getStats();
            
            const snapshot: CacheMetricsSnapshot = {
                timestamp: Date.now(),
                hitRate: stats.hitRate,
                memoryUsage: stats.totalSize,
                responseTime: stats.avgResponseTime,
                healthScore: stats.healthScore
            };

            this.metricsHistory.push(snapshot);

            // Keep only last 100 snapshots (50 minutes of data at 30s intervals)
            if (this.metricsHistory.length > 100) {
                this.metricsHistory = this.metricsHistory.slice(-100);
            }

            // Auto-optimize if health score is low
            if (stats.healthScore < 60) {
                console.log('⚠️ Low cache health score, triggering optimization...');
                oracleIntelligentCachingService.optimize();
            }
        }, this.options.monitoringInterval);

        console.log('📊 Cache monitoring started');
    }

    /**
     * Start background sync for real-time data
     */
    private startBackgroundSync(userId: string): void {
        if (this.backgroundSyncTimer) return;

        this.backgroundSyncTimer = setInterval(async () => {
            try {
                const currentWeek = this.getCurrentWeek();
                
                // Sync current week predictions in background
                await this.getOraclePredictions(currentWeek, userId, { background: true });
                
                // Sync leaderboard
                await this.getOracleLeaderboard('overall');
                
            } catch (error) {
                console.error('Background sync error:', error);
            }
        }, 2 * 60 * 1000); // Every 2 minutes

        console.log('🔄 Background sync started');
    }

    /**
     * Setup predictive prefetching based on user patterns
     */
    private setupPredictivePrefetch(userId: string): void {
        // Analyze user patterns and prefetch likely needed data
        console.log('🔮 Predictive prefetching enabled');
    }

    /**
     * Handle activity-based prefetching
     */
    private async handleActivityPrefetch(activity: UserActivity): Promise<void> {
        switch (activity.action) {
            case 'view_predictions':
                if (activity.data?.week) {
                    // Prefetch next and previous weeks
                    this.prefetchAdjacentWeeks(activity.data.week, activity.data.userId);
                }
                break;
                
            case 'view_analytics':
                if (activity.data?.userId && activity.data?.timeRange) {
                    // Prefetch other time ranges
                    this.prefetchRelatedAnalytics(activity.data.userId, activity.data.timeRange);
                }
                break;
                
            case 'view_leaderboard':
                // Prefetch other leaderboard categories
                this.prefetchLeaderboardCategories(activity.data?.category);
                break;
        }
    }

    /**
     * Prefetch adjacent weeks' predictions
     */
    private async prefetchAdjacentWeeks(week: number, userId: string): Promise<void> {
        const weeksToPrefetch = [week - 1, week + 1].filter(w => w > 0 && w <= 18);
        
        for (const w of weeksToPrefetch) {
            const cacheKey = `predictions:week:${w}:${userId}`;
            const cached = await oracleIntelligentCachingService.get(cacheKey);
            
            if (!cached) {
                // Prefetch in background
                setTimeout(() => {
                    this.getOraclePredictions(w, userId, { background: true });
                }, 100);
            }
        }
    }

    /**
     * Prefetch next week's predictions
     */
    private async prefetchNextWeekPredictions(week: number, userId: string): Promise<void> {
        setTimeout(() => {
            this.getOraclePredictions(week, userId, { background: true });
        }, 1000);
    }

    /**
     * Prefetch related analytics ranges
     */
    private async prefetchRelatedAnalytics(userId: string, currentRange: string): Promise<void> {
        const allRanges = ['1d', '7d', '30d', '90d'];
        const rangesToPrefetch = allRanges.filter(range => range !== currentRange);
        
        for (const range of rangesToPrefetch) {
            setTimeout(() => {
                this.getOracleAnalytics(userId, range);
            }, Math.random() * 2000); // Stagger requests
        }
    }

    /**
     * Prefetch other leaderboard categories
     */
    private async prefetchLeaderboardCategories(currentCategory?: string): Promise<void> {
        const categories = ['overall', 'weekly', 'accuracy', 'consistency'];
        const categoriesToPrefetch = categories.filter(cat => cat !== currentCategory);
        
        for (const category of categoriesToPrefetch) {
            setTimeout(() => {
                this.getOracleLeaderboard(category);
            }, Math.random() * 1500);
        }
    }

    /**
     * Get cache metrics history
     */
    getMetricsHistory(): CacheMetricsSnapshot[] {
        return [...this.metricsHistory];
    }

    /**
     * Get user activity history
     */
    getUserActivity(): UserActivity[] {
        return [...this.userActivity];
    }

    /**
     * Utility methods
     */
    private getCurrentWeek(): number {
        const now = new Date();
        const start = new Date(now.getFullYear(), 8, 1); // Sept 1st
        const diff = now.getTime() - start.getTime();
        return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
    }

    private isCurrentWeek(week: number): boolean {
        return week === this.getCurrentWeek();
    }

    private async fetchFromAPI(url: string, options: any = {}): Promise<any> {
        // Simulate API call with delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        // Return mock data based on URL
        if (url.includes('/predictions/')) {
            return { predictions: [], accuracy: 75.5, confidence: 0.85 };
        } else if (url.includes('/analytics/')) {
            return { stats: {}, trends: [], insights: [] };
        } else if (url.includes('/leaderboard/')) {
            return { rankings: [], userRank: 42, totalUsers: 1000 };
        }
        
        return { success: true };
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }

        if (this.backgroundSyncTimer) {
            clearInterval(this.backgroundSyncTimer);
            this.backgroundSyncTimer = null;
        }

        this.userActivity = [];
        this.metricsHistory = [];
        this.isInitialized = false;

        console.log('🧹 Oracle Cache Integration Service destroyed');
    }
}

// Export singleton instance
export const oracleCacheIntegrationService = new OracleCacheIntegrationService({
    enableAutoWarmup: true,
    enableBackgroundSync: true,
    enablePredictivePrefetch: true,
    monitoringInterval: 30 * 1000
});

export default oracleCacheIntegrationService;
