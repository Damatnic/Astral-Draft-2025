/**
 * Oracle Performance Cache Service
 * Specialized caching service for Oracle prediction system performance optimization
 */

import CacheService from './cacheService';

interface OraclePrediction {
    id: string;
    week: number;
    season: number;
    type: string;
    question: string;
    options: any[];
    oracleChoice: number;
    confidence: number;
    reasoning: string;
    dataPoints: string[];
    status: string;
    gameId?: string;
    playerId?: string;
    timestamp: string;
}

interface LeaderboardEntry {
    rank: number;
    username: string;
    accuracy: number;
    predictions: number;
    points: number;
}

interface OracleStats {
    accuracy: number;
    confidenceAccuracy: number;
    totalPredictions: number;
    resolvedPredictions: number;
}

interface CachedAnalytics {
    userAccuracy: number;
    totalPredictions: number;
    correctPredictions: number;
    weeklyTrends: any[];
    typePerformance: any[];
    lastUpdated: string;
}

class OraclePerformanceCacheService {
    private cache: CacheService;
    private readonly CACHE_KEYS = {
        PREDICTIONS: 'oracle:predictions',
        LEADERBOARD: 'oracle:leaderboard',
        USER_STATS: 'oracle:user_stats',
        ANALYTICS: 'oracle:analytics',
        WEEK_PREDICTIONS: 'oracle:week',
        USER_PREDICTIONS: 'oracle:user_predictions',
        ORACLE_STATS: 'oracle:stats',
        PERFORMANCE_METRICS: 'oracle:performance'
    };

    private readonly CACHE_TTL = {
        PREDICTIONS: 5 * 60 * 1000,      // 5 minutes
        LEADERBOARD: 2 * 60 * 1000,      // 2 minutes
        USER_STATS: 10 * 60 * 1000,      // 10 minutes
        ANALYTICS: 15 * 60 * 1000,       // 15 minutes
        WEEK_PREDICTIONS: 30 * 60 * 1000, // 30 minutes
        USER_PREDICTIONS: 5 * 60 * 1000,  // 5 minutes
        ORACLE_STATS: 10 * 60 * 1000,    // 10 minutes
        PERFORMANCE_METRICS: 60 * 60 * 1000 // 1 hour
    };

    constructor() {
        this.cache = new CacheService({
            maxSize: 500,
            defaultTTL: 5 * 60 * 1000,
            enablePersistence: true,
            storagePrefix: 'oracle_perf_'
        });
    }

    // ==================== PREDICTION CACHING ====================

    /**
     * Cache predictions for a specific week/season
     */
    cacheWeekPredictions(week: number, season: number, predictions: OraclePrediction[]): void {
        const key = `${this.CACHE_KEYS.WEEK_PREDICTIONS}:${season}:${week}`;
        this.cache.set(key, predictions, this.CACHE_TTL.WEEK_PREDICTIONS);
    }

    /**
     * Get cached predictions for a specific week/season
     */
    getWeekPredictions(week: number, season: number): OraclePrediction[] | null {
        const key = `${this.CACHE_KEYS.WEEK_PREDICTIONS}:${season}:${week}`;
        return this.cache.get<OraclePrediction[]>(key);
    }

    /**
     * Cache individual prediction
     */
    cachePrediction(prediction: OraclePrediction): void {
        const key = `${this.CACHE_KEYS.PREDICTIONS}:${prediction.id}`;
        this.cache.set(key, prediction, this.CACHE_TTL.PREDICTIONS);
    }

    /**
     * Get cached prediction by ID
     */
    getPrediction(predictionId: string): OraclePrediction | null {
        const key = `${this.CACHE_KEYS.PREDICTIONS}:${predictionId}`;
        return this.cache.get<OraclePrediction>(key);
    }

    /**
     * Invalidate prediction cache (when updated)
     */
    invalidatePrediction(predictionId: string): void {
        const key = `${this.CACHE_KEYS.PREDICTIONS}:${predictionId}`;
        this.cache.delete(key);
    }

    // ==================== LEADERBOARD CACHING ====================

    /**
     * Cache leaderboard data
     */
    cacheLeaderboard(timeframe: string, season: number, leaderboard: LeaderboardEntry[]): void {
        const key = `${this.CACHE_KEYS.LEADERBOARD}:${season}:${timeframe}`;
        this.cache.set(key, leaderboard, this.CACHE_TTL.LEADERBOARD);
    }

    /**
     * Get cached leaderboard
     */
    getLeaderboard(timeframe: string, season: number): LeaderboardEntry[] | null {
        const key = `${this.CACHE_KEYS.LEADERBOARD}:${season}:${timeframe}`;
        return this.cache.get<LeaderboardEntry[]>(key);
    }

    /**
     * Invalidate leaderboard cache (when user scores change)
     */
    invalidateLeaderboard(season: number): void {
        // Since clearByPattern doesn't exist, we'll manually delete known patterns
        const timeframes = ['all', 'weekly', 'monthly'];
        timeframes.forEach(timeframe => {
            const key = `${this.CACHE_KEYS.LEADERBOARD}:${season}:${timeframe}`;
            this.cache.delete(key);
        });
    }

    // ==================== USER STATS CACHING ====================

    /**
     * Cache user statistics
     */
    cacheUserStats(userId: string, stats: any): void {
        const key = `${this.CACHE_KEYS.USER_STATS}:${userId}`;
        this.cache.set(key, stats, this.CACHE_TTL.USER_STATS);
    }

    /**
     * Get cached user statistics
     */
    getUserStats(userId: string): any | null {
        const key = `${this.CACHE_KEYS.USER_STATS}:${userId}`;
        return this.cache.get(key);
    }

    /**
     * Cache user predictions
     */
    cacheUserPredictions(userId: string, predictions: any[]): void {
        const key = `${this.CACHE_KEYS.USER_PREDICTIONS}:${userId}`;
        this.cache.set(key, predictions, this.CACHE_TTL.USER_PREDICTIONS);
    }

    /**
     * Get cached user predictions
     */
    getUserPredictions(userId: string): any[] | null {
        const key = `${this.CACHE_KEYS.USER_PREDICTIONS}:${userId}`;
        return this.cache.get<any[]>(key);
    }

    /**
     * Invalidate user cache (when user makes new prediction)
     */
    invalidateUserCache(userId: string): void {
        this.cache.delete(`${this.CACHE_KEYS.USER_STATS}:${userId}`);
        this.cache.delete(`${this.CACHE_KEYS.USER_PREDICTIONS}:${userId}`);
    }

    // ==================== ANALYTICS CACHING ====================

    /**
     * Cache analytics data
     */
    cacheAnalytics(timeframe: string, analytics: CachedAnalytics): void {
        const key = `${this.CACHE_KEYS.ANALYTICS}:${timeframe}`;
        this.cache.set(key, analytics, this.CACHE_TTL.ANALYTICS);
    }

    /**
     * Get cached analytics
     */
    getAnalytics(timeframe: string): CachedAnalytics | null {
        const key = `${this.CACHE_KEYS.ANALYTICS}:${timeframe}`;
        return this.cache.get<CachedAnalytics>(key);
    }

    /**
     * Cache Oracle performance stats
     */
    cacheOracleStats(stats: OracleStats): void {
        this.cache.set(this.CACHE_KEYS.ORACLE_STATS, stats, this.CACHE_TTL.ORACLE_STATS);
    }

    /**
     * Get cached Oracle stats
     */
    getOracleStats(): OracleStats | null {
        return this.cache.get<OracleStats>(this.CACHE_KEYS.ORACLE_STATS);
    }

    // ==================== PERFORMANCE METRICS CACHING ====================

    /**
     * Cache performance metrics
     */
    cachePerformanceMetrics(metrics: any): void {
        this.cache.set(this.CACHE_KEYS.PERFORMANCE_METRICS, {
            ...metrics,
            cachedAt: new Date().toISOString()
        }, this.CACHE_TTL.PERFORMANCE_METRICS);
    }

    /**
     * Get cached performance metrics
     */
    getPerformanceMetrics(): any | null {
        return this.cache.get(this.CACHE_KEYS.PERFORMANCE_METRICS);
    }

    // ==================== CACHE MANAGEMENT ====================

    /**
     * Warm up cache with frequently accessed data
     */
    async warmupCache(currentWeek: number, currentSeason: number): Promise<void> {
        // This would be called during server startup or periodically
        // to pre-load commonly accessed data
        console.log(`🔥 Warming up Oracle cache for Week ${currentWeek}, Season ${currentSeason}`);
    }

    /**
     * Clear all Oracle-related cache
     */
    clearAllCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): any {
        return this.cache.stats();
    }

    /**
     * Cache hit rate for monitoring
     */
    getCacheHitRate(): number {
        const stats = this.cache.stats();
        return stats.hitRatio || 0;
    }

    // ==================== BATCH OPERATIONS ====================

    /**
     * Batch cache multiple predictions
     */
    batchCachePredictions(predictions: OraclePrediction[]): void {
        predictions.forEach(prediction => {
            this.cachePrediction(prediction);
        });
    }

    /**
     * Batch invalidate related caches when data changes
     */
    batchInvalidateOnUpdate(predictionId: string, userId?: string): void {
        // Invalidate prediction
        this.invalidatePrediction(predictionId);
        
        // Invalidate user cache if user made prediction
        if (userId) {
            this.invalidateUserCache(userId);
        }
        
        // Invalidate leaderboard (user stats might have changed)
        // Note: Season should be determined from context
        this.invalidateLeaderboard(2024);
        
        // Clear analytics cache as data has changed
        const analyticsTimeframes = ['all', 'weekly', 'monthly', 'season'];
        analyticsTimeframes.forEach(timeframe => {
            const key = `${this.CACHE_KEYS.ANALYTICS}:${timeframe}`;
            this.cache.delete(key);
        });
    }

    // ==================== ADVANCED CACHING STRATEGIES ====================

    /**
     * Cached computation with TTL
     */
    async computeWithCache<T>(
        key: string,
        computeFn: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        // Try to get from cache first
        const cached = this.cache.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Compute and cache result
        const result = await computeFn();
        this.cache.set(key, result, ttl);
        return result;
    }

    /**
     * Cache with refresh strategy
     */
    async cacheWithRefresh<T>(
        key: string,
        computeFn: () => Promise<T>,
        refreshThreshold: number = 0.8
    ): Promise<T> {
        // Check if item exists and get it
        const cached = this.cache.get<T>(key);
        
        if (cached !== null) {
            // For simplicity, always return cached value
            // In a production system, you would implement background refresh
            // based on item age and refresh threshold
            return cached;
        }

        // No cached value, compute and cache
        const result = await computeFn();
        this.cache.set(key, result);
        return result;
    }
}

// Singleton instance
export const oraclePerformanceCache = new OraclePerformanceCacheService();
export default OraclePerformanceCacheService;
