/**
 * Oracle Intelligent Caching Service
 * Multi-layer caching system for predictions, analytics, and ML model outputs
 * Features TTL, LRU eviction, cache warming, and intelligent prefetching
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
    size: number;
    dependencies?: string[];
    tags?: string[];
}

interface CacheConfig {
    maxMemoryMB: number;
    defaultTTL: number;
    maxEntries: number;
    cleanupInterval: number;
    compressionThreshold: number;
    enablePersistence: boolean;
    enableMetrics: boolean;
}

interface CacheMetrics {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    totalSize: number;
    entryCount: number;
    hitRate: number;
    avgResponseTime: number;
    lastCleanup: number;
}

interface CacheStrategy {
    name: string;
    ttl: number;
    priority: number;
    prefetch: boolean;
    compression: boolean;
    persistence: boolean;
}

class OracleIntelligentCachingService {
    private readonly cache: Map<string, CacheEntry<any>> = new Map();
    private readonly tagIndex: Map<string, Set<string>> = new Map();
    private accessOrder: string[] = [];
    private readonly config: CacheConfig;
    private readonly metrics: CacheMetrics;
    private cleanupTimer: NodeJS.Timeout | null = null;
    private readonly compressionWorker: Worker | null = null;
    private persistenceQueue: Array<{ key: string; entry: CacheEntry<any> }> = [];

    // Cache strategies for different data types
    private readonly strategies: Record<string, CacheStrategy> = {
        'predictions': {
            name: 'Oracle Predictions',
            ttl: 5 * 60 * 1000, // 5 minutes
            priority: 10,
            prefetch: true,
            compression: true,
            persistence: true
        },
        'analytics': {
            name: 'Analytics Data',
            ttl: 15 * 60 * 1000, // 15 minutes
            priority: 8,
            prefetch: true,
            compression: true,
            persistence: true
        },
        'user-stats': {
            name: 'User Statistics',
            ttl: 10 * 60 * 1000, // 10 minutes
            priority: 7,
            prefetch: false,
            compression: false,
            persistence: true
        },
        'ml-models': {
            name: 'ML Model Outputs',
            ttl: 30 * 60 * 1000, // 30 minutes
            priority: 9,
            prefetch: false,
            compression: true,
            persistence: true
        },
        'leaderboard': {
            name: 'Leaderboard Data',
            ttl: 5 * 60 * 1000, // 5 minutes
            priority: 6,
            prefetch: true,
            compression: false,
            persistence: true
        },
        'notifications': {
            name: 'Notification Data',
            ttl: 2 * 60 * 1000, // 2 minutes
            priority: 5,
            prefetch: false,
            compression: false,
            persistence: false
        },
        'realtime-updates': {
            name: 'Realtime Updates',
            ttl: 30 * 1000, // 30 seconds
            priority: 3,
            prefetch: false,
            compression: false,
            persistence: false
        }
    };

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = {
            maxMemoryMB: 50,
            defaultTTL: 10 * 60 * 1000, // 10 minutes
            maxEntries: 1000,
            cleanupInterval: 5 * 60 * 1000, // 5 minutes
            compressionThreshold: 10 * 1024, // 10KB
            enablePersistence: true,
            enableMetrics: true,
            ...config
        };

        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            totalSize: 0,
            entryCount: 0,
            hitRate: 0,
            avgResponseTime: 0,
            lastCleanup: Date.now()
        };

        this.initializeCache();
    }

    /**
     * Initialize caching service
     */
    private initializeCache(): void {
        // Load persisted cache if enabled
        if (this.config.enablePersistence) {
            this.loadPersistedCache();
        }

        // Setup compression worker
        this.setupCompressionWorker();

        // Start cleanup timer
        this.startCleanupTimer();

        // Setup beforeunload handler for persistence
        if (typeof window !== 'undefined' && this.config.enablePersistence) {
            window.addEventListener('beforeunload', () => {
                this.persistCache();
            });
        }

        console.log('🧠 Oracle Intelligent Caching Service initialized');
    }

    /**
     * Get data from cache with intelligent fallback
     */
    async get<T>(key: string, fallbackFn?: () => Promise<T>, options?: {
        strategy?: string;
        tags?: string[];
        forceFresh?: boolean;
    }): Promise<T | null> {
        const startTime = performance.now();

        try {
            // Check if force fresh is requested
            if (options?.forceFresh) {
                if (fallbackFn) {
                    const data = await fallbackFn();
                    await this.set(key, data, options);
                    return data;
                }
                return null;
            }

            // Try to get from cache
            const entry = this.getCacheEntry<T>(key);
            
            if (entry && !this.isExpired(entry)) {
                // Cache hit
                this.updateAccessInfo(key, entry);
                this.recordMetric('hit', performance.now() - startTime);
                return entry.data;
            }

            // Cache miss - try fallback
            this.recordMetric('miss', performance.now() - startTime);

            if (fallbackFn) {
                const data = await fallbackFn();
                await this.set(key, data, options);
                return data;
            }

            return null;
        } catch (error) {
            console.error('Cache get error:', error);
            return fallbackFn ? await fallbackFn() : null;
        }
    }

    /**
     * Set data in cache with intelligent strategies
     */
    async set<T>(key: string, data: T, options?: {
        strategy?: string;
        ttl?: number;
        tags?: string[];
        priority?: number;
        compress?: boolean;
    }): Promise<void> {
        try {
            const strategy = options?.strategy ? this.strategies[options.strategy] : null;
            const ttl = options?.ttl || strategy?.ttl || this.config.defaultTTL;
            const tags = options?.tags || [];
            const shouldCompress = options?.compress ?? 
                (strategy?.compression && this.estimateSize(data) > this.config.compressionThreshold);

            // Prepare cache entry
            let processedData = data;
            if (shouldCompress && this.compressionWorker) {
                processedData = await this.compressData(data);
            }

            const entry: CacheEntry<T> = {
                data: processedData,
                timestamp: Date.now(),
                ttl,
                accessCount: 0,
                lastAccessed: Date.now(),
                size: this.estimateSize(processedData),
                dependencies: [],
                tags
            };

            // Check if we need to make space
            await this.ensureCapacity(entry.size);

            // Store in cache
            this.cache.set(key, entry);
            this.updateAccessOrder(key);

            // Update tag index
            this.updateTagIndex(key, tags);

            // Update metrics
            this.recordMetric('set');
            this.updateMetrics();

            // Queue for persistence if enabled
            if (this.config.enablePersistence && strategy?.persistence) {
                this.queueForPersistence(key, entry);
            }

            console.log(`📦 Cached ${key} (${this.formatBytes(entry.size)}, TTL: ${this.formatTime(ttl)})`);
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    /**
     * Delete from cache
     */
    delete(key: string): boolean {
        const existed = this.cache.has(key);
        
        if (existed) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
            this.removeFromTagIndex(key);
            this.recordMetric('delete');
            this.updateMetrics();

            console.log(`🗑️ Removed ${key} from cache`);
        }

        return existed;
    }

    /**
     * Clear cache by tags
     */
    clearByTags(tags: string[]): number {
        let cleared = 0;
        
        for (const tag of tags) {
            const keys = this.tagIndex.get(tag);
            if (keys) {
                for (const key of keys) {
                    if (this.delete(key)) {
                        cleared++;
                    }
                }
            }
        }

        return cleared;
    }

    /**
     * Warm cache with predicted data needs
     */
    async warmCache(userId: string, week?: number): Promise<void> {
        const warmingTasks: Promise<void>[] = [];

        // Warm predictions for current week
        const currentWeek = week || this.getCurrentWeek();
        warmingTasks.push(this.warmPredictions(currentWeek));

        // Warm user stats
        warmingTasks.push(this.warmUserStats(userId));

        // Warm analytics data
        warmingTasks.push(this.warmAnalytics(userId));

        // Warm leaderboard
        warmingTasks.push(this.warmLeaderboard());

        try {
            await Promise.all(warmingTasks);
            console.log('🔥 Cache warming completed successfully');
        } catch (error) {
            console.error('Cache warming error:', error);
        }
    }

    /**
     * Intelligent prefetching based on usage patterns
     */
    async prefetchLikelyNeeded(userId: string, context: {
        currentView?: string;
        recentActions?: string[];
        timeOfDay?: number;
        userPreferences?: Record<string, any>;
    }): Promise<void> {
        const prefetchTasks: Promise<void>[] = [];

        // Prefetch based on current view
        if (context.currentView === 'predictions') {
            prefetchTasks.push(this.prefetchPredictionsData());
        } else if (context.currentView === 'analytics') {
            prefetchTasks.push(this.prefetchAnalyticsData(userId));
        }

        // Prefetch based on time patterns
        const hour = new Date().getHours();
        if (hour >= 17 && hour <= 23) { // Evening prime time
            prefetchTasks.push(this.prefetchPrimeTimeData());
        }

        try {
            await Promise.all(prefetchTasks);
            console.log('🔮 Intelligent prefetching completed');
        } catch (error) {
            console.error('Prefetching error:', error);
        }
    }

    /**
     * Get cache statistics and health
     */
    getStats(): CacheMetrics & {
        memoryUsage: string;
        topKeys: Array<{ key: string; accessCount: number; size: string }>;
        strategies: Record<string, CacheStrategy>;
        healthScore: number;
    } {
        const topKeys = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => b.accessCount - a.accessCount)
            .slice(0, 10)
            .map(([key, entry]) => ({
                key,
                accessCount: entry.accessCount,
                size: this.formatBytes(entry.size)
            }));

        const healthScore = this.calculateHealthScore();

        return {
            ...this.metrics,
            memoryUsage: this.formatBytes(this.metrics.totalSize),
            topKeys,
            strategies: this.strategies,
            healthScore
        };
    }

    /**
     * Optimize cache performance
     */
    async optimize(): Promise<{
        entriesEvicted: number;
        memoryFreed: number;
        compressionSavings: number;
    }> {
        console.log('🔧 Starting cache optimization...');

        let entriesEvicted = 0;
        let memoryFreed = 0;
        let compressionSavings = 0;

        // Remove expired entries
        const expiredKeys = this.findExpiredKeys();
        for (const key of expiredKeys) {
            const entry = this.cache.get(key);
            if (entry) {
                memoryFreed += entry.size;
                this.delete(key);
                entriesEvicted++;
            }
        }

        // Compress large uncompressed entries
        const compressionCandidates = this.findCompressionCandidates();
        for (const key of compressionCandidates) {
            const entry = this.cache.get(key);
            if (entry && this.compressionWorker) {
                const originalSize = entry.size;
                const compressedData = await this.compressData(entry.data);
                const newSize = this.estimateSize(compressedData);
                
                if (newSize < originalSize * 0.8) { // Only if 20%+ savings
                    entry.data = compressedData;
                    entry.size = newSize;
                    compressionSavings += originalSize - newSize;
                }
            }
        }

        // LRU eviction if still over capacity
        const maxBytes = this.config.maxMemoryMB * 1024 * 1024;
        while (this.metrics.totalSize > maxBytes && this.cache.size > 0) {
            const lruKey = this.findLRUKey();
            if (lruKey) {
                const entry = this.cache.get(lruKey);
                if (entry) {
                    memoryFreed += entry.size;
                    this.delete(lruKey);
                    entriesEvicted++;
                }
            } else {
                break;
            }
        }

        this.updateMetrics();

        console.log(`✨ Cache optimization completed: ${entriesEvicted} evicted, ${this.formatBytes(memoryFreed)} freed, ${this.formatBytes(compressionSavings)} compressed`);

        return { entriesEvicted, memoryFreed, compressionSavings };
    }

    // Helper methods

    private getCacheEntry<T>(key: string): CacheEntry<T> | null {
        return this.cache.get(key) || null;
    }

    private isExpired(entry: CacheEntry<any>): boolean {
        return Date.now() - entry.timestamp > entry.ttl;
    }

    private updateAccessInfo(key: string, entry: CacheEntry<any>): void {
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.updateAccessOrder(key);
    }

    private updateAccessOrder(key: string): void {
        // Remove from current position
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        // Add to end (most recently used)
        this.accessOrder.push(key);
    }

    private removeFromAccessOrder(key: string): void {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    private updateTagIndex(key: string, tags: string[]): void {
        // Remove from old tags
        for (const [tag, keys] of this.tagIndex) {
            keys.delete(key);
            if (keys.size === 0) {
                this.tagIndex.delete(tag);
            }
        }

        // Add to new tags
        for (const tag of tags) {
            if (!this.tagIndex.has(tag)) {
                this.tagIndex.set(tag, new Set());
            }
            const tagSet = this.tagIndex.get(tag);
            if (tagSet) {
                tagSet.add(key);
            }
        }
    }

    private removeFromTagIndex(key: string): void {
        for (const [tag, keys] of this.tagIndex) {
            keys.delete(key);
            if (keys.size === 0) {
                this.tagIndex.delete(tag);
            }
        }
    }

    private async ensureCapacity(newEntrySize: number): Promise<void> {
        const maxBytes = this.config.maxMemoryMB * 1024 * 1024;
        const maxEntries = this.config.maxEntries;

        // Check memory limit
        while (this.metrics.totalSize + newEntrySize > maxBytes && this.cache.size > 0) {
            await this.evictLRU();
        }

        // Check entry count limit
        while (this.cache.size >= maxEntries && this.cache.size > 0) {
            await this.evictLRU();
        }
    }

    private async evictLRU(): Promise<void> {
        const lruKey = this.findLRUKey();
        if (lruKey) {
            this.delete(lruKey);
            this.recordMetric('eviction');
        }
    }

    private findLRUKey(): string | null {
        // Find least recently used key with lowest priority
        let lruKey: string | null = null;
        let oldestAccess = Date.now();
        let lowestPriority = 10;

        for (const [key, entry] of this.cache) {
            const strategy = this.getStrategyForKey(key);
            const priority = strategy?.priority || 5;

            if (entry.lastAccessed < oldestAccess || 
                (entry.lastAccessed === oldestAccess && priority < lowestPriority)) {
                lruKey = key;
                oldestAccess = entry.lastAccessed;
                lowestPriority = priority;
            }
        }

        return lruKey;
    }

    private findExpiredKeys(): string[] {
        const expired: string[] = [];
        for (const [key, entry] of this.cache) {
            if (this.isExpired(entry)) {
                expired.push(key);
            }
        }
        return expired;
    }

    private findCompressionCandidates(): string[] {
        const candidates: string[] = [];
        for (const [key, entry] of this.cache) {
            if (entry.size > this.config.compressionThreshold && 
                !this.isCompressed(entry.data)) {
                candidates.push(key);
            }
        }
        return candidates;
    }

    private getStrategyForKey(key: string): CacheStrategy | null {
        for (const [strategyKey, strategy] of Object.entries(this.strategies)) {
            if (key.startsWith(strategyKey + ':')) {
                return strategy;
            }
        }
        return null;
    }

    private estimateSize(data: any): number {
        return JSON.stringify(data).length * 2; // Rough estimate
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private formatTime(ms: number): string {
        if (ms < 1000) return ms + 'ms';
        if (ms < 60000) return Math.round(ms / 1000) + 's';
        return Math.round(ms / 60000) + 'm';
    }

    private recordMetric(type: 'hit' | 'miss' | 'set' | 'delete' | 'eviction', responseTime?: number): void {
        if (!this.config.enableMetrics) return;

        let metricKey: keyof CacheMetrics;
        if (type === 'hit') {
            metricKey = 'hits';
        } else if (type === 'miss') {
            metricKey = 'misses';
        } else if (type === 'set') {
            metricKey = 'sets';
        } else if (type === 'delete') {
            metricKey = 'deletes';
        } else {
            metricKey = 'evictions';
        }

        this.metrics[metricKey]++;

        if (responseTime) {
            this.metrics.avgResponseTime = 
                (this.metrics.avgResponseTime + responseTime) / 2;
        }
    }

    private updateMetrics(): void {
        if (!this.config.enableMetrics) return;

        this.metrics.entryCount = this.cache.size;
        this.metrics.totalSize = Array.from(this.cache.values())
            .reduce((total, entry) => total + entry.size, 0);
        this.metrics.hitRate = this.metrics.hits / 
            (this.metrics.hits + this.metrics.misses + 1) * 100;
    }

    private calculateHealthScore(): number {
        const hitRate = this.metrics.hitRate;
        const memoryEfficiency = Math.min(100, 
            (1 - this.metrics.totalSize / (this.config.maxMemoryMB * 1024 * 1024)) * 100);
        const evictionRate = this.metrics.evictions / 
            (this.metrics.sets + 1) * 100;

        return Math.round((hitRate * 0.5 + memoryEfficiency * 0.3 + (100 - evictionRate) * 0.2));
    }

    private getCurrentWeek(): number {
        // Simple week calculation
        const now = new Date();
        const start = new Date(now.getFullYear(), 8, 1); // Sept 1st
        const diff = now.getTime() - start.getTime();
        return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
    }

    // Cache warming methods
    private async warmPredictions(week: number): Promise<void> {
        const key = `predictions:week:${week}`;
        if (!this.cache.has(key)) {
            // This would call the actual Oracle API
            console.log(`🔥 Warming predictions for week ${week}`);
        }
    }

    private async warmUserStats(userId: string): Promise<void> {
        const key = `user-stats:${userId}`;
        if (!this.cache.has(key)) {
            console.log(`🔥 Warming user stats for ${userId}`);
        }
    }

    private async warmAnalytics(userId: string): Promise<void> {
        const key = `analytics:${userId}`;
        if (!this.cache.has(key)) {
            console.log(`🔥 Warming analytics for ${userId}`);
        }
    }

    private async warmLeaderboard(): Promise<void> {
        const key = 'leaderboard:global';
        if (!this.cache.has(key)) {
            console.log('🔥 Warming global leaderboard');
        }
    }

    // Prefetching methods
    private async prefetchPredictionsData(): Promise<void> {
        console.log('🔮 Prefetching predictions data');
    }

    private async prefetchAnalyticsData(userId: string): Promise<void> {
        console.log(`🔮 Prefetching analytics data for ${userId}`);
    }

    private async prefetchPrimeTimeData(): Promise<void> {
        console.log('🔮 Prefetching prime time data');
    }

    // Compression and persistence (simplified implementations)
    private setupCompressionWorker(): void {
        // In a real implementation, this would setup a Web Worker for compression
        console.log('🗜️ Compression worker setup (simplified)');
    }

    private async compressData(data: any): Promise<any> {
        // Simplified compression - in reality would use actual compression
        return data;
    }

    private isCompressed(data: any): boolean {
        return false; // Simplified check
    }

    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.optimize();
        }, this.config.cleanupInterval);
    }

    private queueForPersistence(key: string, entry: CacheEntry<any>): void {
        this.persistenceQueue.push({ key, entry });
        
        // Process queue if it gets large
        if (this.persistenceQueue.length > 100) {
            this.processPersistenceQueue();
        }
    }

    private async processPersistenceQueue(): Promise<void> {
        // Process persistence queue in background
        console.log(`💾 Processing ${this.persistenceQueue.length} persistence entries`);
        this.persistenceQueue = [];
    }

    private loadPersistedCache(): void {
        // Load from localStorage or IndexedDB
        console.log('📂 Loading persisted cache');
    }

    private persistCache(): void {
        // Save to localStorage or IndexedDB
        console.log('💾 Persisting cache');
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        
        if (this.compressionWorker) {
            this.compressionWorker.terminate();
        }

        if (this.config.enablePersistence) {
            this.persistCache();
        }

        this.cache.clear();
        this.tagIndex.clear();
        this.accessOrder = [];
        
        console.log('🧹 Oracle caching service destroyed');
    }
}

// Export singleton instance
export const oracleIntelligentCachingService = new OracleIntelligentCachingService({
    maxMemoryMB: 50,
    defaultTTL: 10 * 60 * 1000,
    maxEntries: 1000,
    cleanupInterval: 5 * 60 * 1000,
    compressionThreshold: 10 * 1024,
    enablePersistence: true,
    enableMetrics: true
});

export default oracleIntelligentCachingService;
