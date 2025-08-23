/**
 * Oracle Performance Optimization Service
 * Implements caching strategies and query optimization for Oracle analytics
 */

export interface CacheConfig {
    ttl: number; // Time to live in seconds
    maxSize: number; // Maximum cache size
    keyPrefix: string; // Cache key prefix
}

export interface QueryOptimization {
    enableIndexHints: boolean;
    useQueryPlan: boolean;
    batchSize: number;
    enablePagination: boolean;
}

export interface PerformanceMetrics {
    cacheHitRate: number;
    avgQueryTime: number;
    totalQueries: number;
    cacheSize: number;
    memoryUsage: number;
}

/**
 * In-memory cache implementation with LRU eviction
 */
class LRUCache<T> {
    private readonly cache: Map<string, { value: T; timestamp: number; accessCount: number }>;
    private readonly maxSize: number;
    private readonly ttl: number;

    constructor(maxSize: number = 1000, ttl: number = 300) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl * 1000; // Convert to milliseconds
    }

    get(key: string): T | null {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        // Check if item has expired
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        // Update access count and move to end (most recently used)
        item.accessCount++;
        this.cache.delete(key);
        this.cache.set(key, item);
        
        return item.value;
    }

    set(key: string, value: T): void {
        // Remove oldest item if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            accessCount: 1
        });
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }

    getStats(): { size: number; hitRate: number } {
        let totalAccess = 0;
        for (const item of this.cache.values()) {
            totalAccess += item.accessCount;
        }

        return {
            size: this.cache.size,
            hitRate: totalAccess > 0 ? (this.cache.size / totalAccess) : 0
        };
    }
}

/**
 * Multi-tier caching system for Oracle analytics
 */
export class OraclePerformanceService {
    private readonly predictionCache: LRUCache<any>;
    private readonly analyticsCache: LRUCache<any>;
    private readonly userDataCache: LRUCache<any>;
    private readonly queryCache: LRUCache<any>;
    
    private readonly queryMetrics: Map<string, { count: number; totalTime: number; avgTime: number }>;
    private cacheMetrics: { hits: number; misses: number };

    constructor() {
        // Initialize different cache tiers with appropriate TTL
        this.predictionCache = new LRUCache(500, 300); // 5 minutes for predictions
        this.analyticsCache = new LRUCache(200, 900); // 15 minutes for analytics
        this.userDataCache = new LRUCache(1000, 1800); // 30 minutes for user data
        this.queryCache = new LRUCache(100, 600); // 10 minutes for complex queries
        
        this.queryMetrics = new Map();
        this.cacheMetrics = { hits: 0, misses: 0 };
    }

    /**
     * Get cached prediction data
     */
    getCachedPredictions(key: string): any {
        const result = this.predictionCache.get(key);
        if (result) {
            this.cacheMetrics.hits++;
            return result;
        }
        this.cacheMetrics.misses++;
        return null;
    }

    /**
     * Cache prediction data
     */
    cachePredictions(key: string, data: any): void {
        this.predictionCache.set(key, data);
    }

    /**
     * Get cached analytics data
     */
    getCachedAnalytics(key: string): any {
        const result = this.analyticsCache.get(key);
        if (result) {
            this.cacheMetrics.hits++;
            return result;
        }
        this.cacheMetrics.misses++;
        return null;
    }

    /**
     * Cache analytics data
     */
    cacheAnalytics(key: string, data: any): void {
        this.analyticsCache.set(key, data);
    }

    /**
     * Get cached user data
     */
    getCachedUserData(key: string): any {
        const result = this.userDataCache.get(key);
        if (result) {
            this.cacheMetrics.hits++;
            return result;
        }
        this.cacheMetrics.misses++;
        return null;
    }

    /**
     * Cache user data
     */
    cacheUserData(key: string, data: any): void {
        this.userDataCache.set(key, data);
    }

    /**
     * Get cached query results
     */
    getCachedQuery(key: string): any {
        const result = this.queryCache.get(key);
        if (result) {
            this.cacheMetrics.hits++;
            return result;
        }
        this.cacheMetrics.misses++;
        return null;
    }

    /**
     * Cache query results
     */
    cacheQuery(key: string, data: any): void {
        this.queryCache.set(key, data);
    }

    /**
     * Generate cache key for predictions
     */
    generatePredictionCacheKey(week: number, season: number, type?: string, userId?: number): string {
        const base = `predictions:${season}:${week}`;
        const typeKey = type ? `:${type}` : '';
        const userKey = userId ? `:user:${userId}` : '';
        return `${base}${typeKey}${userKey}`;
    }

    /**
     * Generate cache key for analytics
     */
    generateAnalyticsCacheKey(startDate: string, endDate: string, metrics: string[], groupBy?: string): string {
        const sortedMetrics = [...metrics].sort((a, b) => a.localeCompare(b));
        const metricsKey = sortedMetrics.join(',');
        const groupKey = groupBy ? `:group:${groupBy}` : '';
        return `analytics:${startDate}:${endDate}:${metricsKey}${groupKey}`;
    }

    /**
     * Generate cache key for user analytics
     */
    generateUserAnalyticsCacheKey(userId: number, timeframe: string, season?: number): string {
        const seasonKey = season ? `:${season}` : '';
        return `user:${userId}:analytics:${timeframe}${seasonKey}`;
    }

    /**
     * Record query performance metrics
     */
    recordQueryMetrics(queryName: string, executionTime: number): void {
        const existing = this.queryMetrics.get(queryName);
        
        if (existing) {
            existing.count++;
            existing.totalTime += executionTime;
            existing.avgTime = existing.totalTime / existing.count;
        } else {
            this.queryMetrics.set(queryName, {
                count: 1,
                totalTime: executionTime,
                avgTime: executionTime
            });
        }
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): PerformanceMetrics {
        const totalCacheRequests = this.cacheMetrics.hits + this.cacheMetrics.misses;
        const cacheHitRate = totalCacheRequests > 0 ? (this.cacheMetrics.hits / totalCacheRequests) : 0;
        
        let totalQueries = 0;
        let totalTime = 0;
        
        for (const metric of this.queryMetrics.values()) {
            totalQueries += metric.count;
            totalTime += metric.totalTime;
        }
        
        const avgQueryTime = totalQueries > 0 ? (totalTime / totalQueries) : 0;
        
        return {
            cacheHitRate,
            avgQueryTime,
            totalQueries,
            cacheSize: this.predictionCache.size() + this.analyticsCache.size() + 
                      this.userDataCache.size() + this.queryCache.size(),
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    /**
     * Get detailed query metrics
     */
    getQueryMetrics(): Map<string, { count: number; totalTime: number; avgTime: number }> {
        return new Map(this.queryMetrics);
    }

    /**
     * Clear specific cache or all caches
     */
    clearCache(cacheType?: 'predictions' | 'analytics' | 'users' | 'queries'): void {
        switch (cacheType) {
            case 'predictions':
                this.predictionCache.clear();
                break;
            case 'analytics':
                this.analyticsCache.clear();
                break;
            case 'users':
                this.userDataCache.clear();
                break;
            case 'queries':
                this.queryCache.clear();
                break;
            default:
                this.predictionCache.clear();
                this.analyticsCache.clear();
                this.userDataCache.clear();
                this.queryCache.clear();
                this.cacheMetrics = { hits: 0, misses: 0 };
                this.queryMetrics.clear();
        }
    }

    /**
     * Estimate memory usage (rough calculation)
     */
    private estimateMemoryUsage(): number {
        // Rough estimate: 1KB per cache entry average
        const totalEntries = this.predictionCache.size() + this.analyticsCache.size() + 
                           this.userDataCache.size() + this.queryCache.size();
        return totalEntries * 1024; // bytes
    }

    /**
     * Warm up cache with commonly accessed data
     */
    async warmUpCache(dbService: any): Promise<void> {
        console.log('🔥 Warming up Oracle performance cache...');
        
        try {
            // Pre-load current week predictions for current season
            const currentWeek = this.getCurrentWeek();
            const currentSeason = new Date().getFullYear();
            
            // Cache current week predictions
            this.generatePredictionCacheKey(currentWeek, currentSeason);
            // This would typically fetch from database and cache the results
            
            // Pre-load popular analytics queries
            const popularMetrics = ['accuracy', 'confidence', 'volume'];
            const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const today = new Date().toISOString();
            
            this.generateAnalyticsCacheKey(last30Days, today, popularMetrics, 'week');
            // This would fetch and cache popular analytics
            
            console.log('✅ Cache warm-up completed');
        } catch (error) {
            console.error('❌ Cache warm-up failed:', error);
        }
    }

    /**
     * Get current NFL week (simplified calculation)
     */
    private getCurrentWeek(): number {
        const now = new Date();
        const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
        const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return Math.max(1, Math.min(18, weeksSinceStart + 1));
    }

    /**
     * Invalidate related caches when data changes
     */
    invalidateRelatedCaches(type: 'prediction' | 'user' | 'analytics', identifier: string): void {
        // This would implement cache invalidation strategies
        // For now, we'll implement a simple approach
        
        switch (type) {
            case 'prediction':
                // Clear prediction-related caches
                this.predictionCache.clear();
                break;
            case 'user':
                // Clear user-specific caches
                this.userDataCache.clear();
                break;
            case 'analytics':
                // Clear analytics caches
                this.analyticsCache.clear();
                break;
        }
    }
}

// Export singleton instance
export const oraclePerformanceService = new OraclePerformanceService();
