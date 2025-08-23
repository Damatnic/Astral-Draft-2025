/**
 * Enhanced Cache Service
 * Intelligent caching strategies for improved performance and offline functionality
 */

import { openDB, IDBPDatabase } from 'idb';

// Cache configuration
interface CacheConfig {
    name: string;
    version: number;
    maxAge: number; // in milliseconds
    maxSize: number; // max number of items
    priority: 'high' | 'medium' | 'low';
}

interface CacheItem<T = any> {
    key: string;
    data: T;
    timestamp: number;
    expiresAt: number;
    priority: 'high' | 'medium' | 'low';
    size: number; // approximate size in bytes
    metadata: {
        url?: string;
        tags?: string[];
        dependencies?: string[];
        version?: string;
    };
}

interface CacheStats {
    totalItems: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    lastCleanup: number;
}

class EnhancedCacheService {
    private db: IDBPDatabase | null = null;
    private readonly memoryCache = new Map<string, CacheItem>();
    private stats: CacheStats = {
        totalItems: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        lastCleanup: Date.now()
    };
    private hits = 0;
    private misses = 0;

    // Cache configurations for different data types
    private readonly cacheConfigs: Map<string, CacheConfig> = new Map([
        ['api', { name: 'api-cache', version: 1, maxAge: 5 * 60 * 1000, maxSize: 1000, priority: 'high' }], // 5 minutes
        ['players', { name: 'players-cache', version: 1, maxAge: 30 * 60 * 1000, maxSize: 500, priority: 'high' }], // 30 minutes
        ['draft', { name: 'draft-cache', version: 1, maxAge: 60 * 1000, maxSize: 100, priority: 'high' }], // 1 minute
        ['oracle', { name: 'oracle-cache', version: 1, maxAge: 10 * 60 * 1000, maxSize: 200, priority: 'high' }], // 10 minutes
        ['analytics', { name: 'analytics-cache', version: 1, maxAge: 15 * 60 * 1000, maxSize: 300, priority: 'medium' }], // 15 minutes
        ['images', { name: 'images-cache', version: 1, maxAge: 24 * 60 * 60 * 1000, maxSize: 100, priority: 'low' }], // 24 hours
        ['static', { name: 'static-cache', version: 1, maxAge: 60 * 60 * 1000, maxSize: 50, priority: 'low' }], // 1 hour
    ]);

    /**
     * Initialize the cache service
     */
    async initialize(): Promise<void> {
        try {
            this.db = await openDB('astral-draft-cache', 1, {
                upgrade(db) {
                    // Create object stores for different cache types
                    const storeConfigs = [
                        'api', 'players', 'draft', 'oracle', 'analytics', 'images', 'static'
                    ];
                    
                    for (const type of storeConfigs) {
                        if (!db.objectStoreNames.contains(type)) {
                            const store = db.createObjectStore(type, { keyPath: 'key' });
                            store.createIndex('timestamp', 'timestamp');
                            store.createIndex('expiresAt', 'expiresAt');
                            store.createIndex('priority', 'priority');
                            store.createIndex('tags', 'metadata.tags', { multiEntry: true });
                        }
                    }
                }
            });

            // Load stats from localStorage
            const savedStats = localStorage.getItem('cache-stats');
            if (savedStats) {
                this.stats = { ...this.stats, ...JSON.parse(savedStats) };
            }

            // Schedule periodic cleanup
            this.scheduleCleanup();

            console.log('Enhanced Cache Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize cache service:', error);
            // Fallback to memory-only cache
        }
    }

    /**
     * Set item in cache with intelligent expiration and storage strategy
     */
    async set<T>(
        type: string,
        key: string,
        data: T,
        options: {
            tags?: string[];
            dependencies?: string[];
            customTTL?: number;
            forceMemory?: boolean;
        } = {}
    ): Promise<void> {
        const config = this.cacheConfigs.get(type);
        if (!config) {
            throw new Error(`Unknown cache type: ${type}`);
        }

        const now = Date.now();
        const ttl = options.customTTL || config.maxAge;
        const dataSize = this.estimateSize(data);
        
        const item: CacheItem<T> = {
            key: `${type}:${key}`,
            data,
            timestamp: now,
            expiresAt: now + ttl,
            priority: config.priority,
            size: dataSize,
            metadata: {
                tags: options.tags,
                dependencies: options.dependencies,
                version: '1.0'
            }
        };

        // Always store in memory cache for quick access
        this.memoryCache.set(item.key, item);
        this.updateStats(dataSize, 'add');

        // Store in IndexedDB for persistence (unless forced memory-only)
        if (!options.forceMemory && this.db) {
            try {
                await this.db.put(type, item);
            } catch (error) {
                console.warn('Failed to store in IndexedDB:', error);
            }
        }

        // Cleanup if cache is getting too large
        await this.performIntelligentCleanup(type);
    }

    /**
     * Get item from cache with fallback strategy
     */
    async get<T>(type: string, key: string): Promise<T | null> {
        const fullKey = `${type}:${key}`;
        const now = Date.now();

        // First check memory cache
        let item = this.memoryCache.get(fullKey);
        
        // If not in memory, check IndexedDB
        if (!item && this.db) {
            try {
                item = await this.db.get(type, fullKey);
                if (item) {
                    // Add back to memory cache for faster access
                    this.memoryCache.set(fullKey, item);
                }
            } catch (error) {
                console.warn('Failed to read from IndexedDB:', error);
            }
        }

        // Check if item exists and is not expired
        if (item) {
            if (item.expiresAt > now) {
                this.hits++;
                this.updateHitRate();
                return item.data;
            } else {
                // Item expired, remove it
                await this.delete(type, key);
            }
        }

        this.misses++;
        this.updateHitRate();
        return null;
    }

    /**
     * Get multiple items from cache efficiently
     */
    async getMultiple<T>(type: string, keys: string[]): Promise<Map<string, T>> {
        const results = new Map<string, T>();
        const missingKeys: string[] = [];

        // First check memory cache for all keys
        for (const key of keys) {
            const fullKey = `${type}:${key}`;
            const item = this.memoryCache.get(fullKey);
            if (item && item.expiresAt > Date.now()) {
                results.set(key, item.data);
            } else {
                missingKeys.push(key);
            }
        }

        // Check IndexedDB for missing keys
        if (missingKeys.length > 0 && this.db) {
            try {
                const transaction = this.db.transaction(type, 'readonly');
                const store = transaction.objectStore(type);
                
                await Promise.all(missingKeys.map(async (key) => {
                    const fullKey = `${type}:${key}`;
                    const item = await store.get(fullKey);
                    if (item && item.expiresAt > Date.now()) {
                        results.set(key, item.data);
                        // Add to memory cache
                        this.memoryCache.set(fullKey, item);
                    }
                }));
            } catch (error) {
                console.warn('Failed to read multiple from IndexedDB:', error);
            }
        }

        return results;
    }

    /**
     * Delete item from cache
     */
    async delete(type: string, key: string): Promise<void> {
        const fullKey = `${type}:${key}`;
        
        // Remove from memory cache
        const item = this.memoryCache.get(fullKey);
        if (item) {
            this.memoryCache.delete(fullKey);
            this.updateStats(-item.size, 'remove');
        }

        // Remove from IndexedDB
        if (this.db) {
            try {
                await this.db.delete(type, fullKey);
            } catch (error) {
                console.warn('Failed to delete from IndexedDB:', error);
            }
        }
    }

    /**
     * Invalidate cache by tags
     */
    async invalidateByTags(tags: string[]): Promise<void> {
        const keysToDelete = await this.findKeysByTags(tags);
        
        // Delete all found keys
        for (const key of keysToDelete) {
            const [type, ...keyParts] = key.split(':');
            await this.delete(type, keyParts.join(':'));
        }
    }

    /**
     * Helper method to find keys by tags
     */
    private async findKeysByTags(tags: string[]): Promise<string[]> {
        const keysToDelete: string[] = [];

        // Check memory cache
        for (const [key, item] of this.memoryCache.entries()) {
            if (item.metadata.tags?.some(tag => tags.includes(tag))) {
                keysToDelete.push(key);
            }
        }

        // Check IndexedDB
        if (this.db) {
            await this.findKeysInIndexedDB(tags, keysToDelete);
        }

        return keysToDelete;
    }

    /**
     * Helper method to find keys in IndexedDB
     */
    private async findKeysInIndexedDB(tags: string[], keysToDelete: string[]): Promise<void> {
        for (const cacheType of this.cacheConfigs.keys()) {
            try {
                const transaction = this.db!.transaction(cacheType, 'readonly');
                const store = transaction.objectStore(cacheType);
                const index = store.index('tags');
                
                for (const tag of tags) {
                    const items = await index.getAll(tag);
                    for (const item of items) {
                        keysToDelete.push(item.key);
                    }
                }
            } catch (error) {
                console.warn(`Failed to invalidate by tags in ${cacheType}:`, error);
            }
        }
    }

    /**
     * Clear all cache for a specific type
     */
    async clear(type?: string): Promise<void> {
        if (type) {
            await this.clearSpecificType(type);
        } else {
            await this.clearAllTypes();
        }
    }

    /**
     * Clear cache for a specific type
     */
    private async clearSpecificType(type: string): Promise<void> {
        const keysToDelete: string[] = [];
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(`${type}:`)) {
                keysToDelete.push(key);
            }
        }
        
        for (const key of keysToDelete) {
            this.memoryCache.delete(key);
        }

        if (this.db) {
            try {
                await this.db.clear(type);
            } catch (error) {
                console.warn(`Failed to clear ${type} cache:`, error);
            }
        }
    }

    /**
     * Clear all cache types
     */
    private async clearAllTypes(): Promise<void> {
        this.memoryCache.clear();
        this.stats.totalItems = 0;
        this.stats.totalSize = 0;

        if (this.db) {
            for (const cacheType of this.cacheConfigs.keys()) {
                try {
                    await this.db.clear(cacheType);
                } catch (error) {
                    console.warn(`Failed to clear ${cacheType} cache:`, error);
                }
            }
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Intelligent cleanup based on cache size, usage patterns, and priority
     */
    private async performIntelligentCleanup(type: string): Promise<void> {
        const config = this.cacheConfigs.get(type);
        if (!config) return;

        const now = Date.now();
        const typeItems: CacheItem[] = [];

        // Collect items for this cache type
        for (const [key, item] of this.memoryCache.entries()) {
            if (key.startsWith(`${type}:`)) {
                typeItems.push(item);
            }
        }

        // If under the limit, no cleanup needed
        if (typeItems.length <= config.maxSize) return;

        // Sort items for cleanup priority
        // 1. Expired items first
        // 2. Then by priority (low priority first)  
        // 3. Then by age (oldest first)
        const sortedItems = [...typeItems];
        sortedItems.sort((a, b) => {
            // Expired items first
            if (a.expiresAt <= now && b.expiresAt > now) return -1;
            if (a.expiresAt > now && b.expiresAt <= now) return 1;

            // Priority order: low < medium < high
            const priorityOrder = { low: 0, medium: 1, high: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }

            // Age (oldest first)
            return a.timestamp - b.timestamp;
        });

        const itemsToRemove = sortedItems.slice(0, typeItems.length - config.maxSize);

        // Remove selected items
        for (const item of itemsToRemove) {
            const [itemType, ...keyParts] = item.key.split(':');
            await this.delete(itemType, keyParts.join(':'));
        }
    }

    /**
     * Schedule periodic cleanup
     */
    private scheduleCleanup(): void {
        // Run cleanup every 5 minutes
        setInterval(() => {
            this.performPeriodicCleanup();
        }, 5 * 60 * 1000);
    }

    /**
     * Periodic cleanup of expired items
     */
    private async performPeriodicCleanup(): Promise<void> {
        const now = Date.now();
        const expiredKeys: string[] = [];

        // Find expired items in memory cache
        for (const [key, item] of this.memoryCache.entries()) {
            if (item.expiresAt <= now) {
                expiredKeys.push(key);
            }
        }

        // Remove expired items
        for (const key of expiredKeys) {
            const [type, ...keyParts] = key.split(':');
            await this.delete(type, keyParts.join(':'));
        }

        // Update cleanup timestamp
        this.stats.lastCleanup = now;
        this.saveStats();
    }

    /**
     * Estimate size of data for cache management
     */
    private estimateSize(data: any): number {
        try {
            return JSON.stringify(data).length;
        } catch {
            return 1000; // Default estimate
        }
    }

    /**
     * Update cache statistics
     */
    private updateStats(sizeChange: number, operation: 'add' | 'remove'): void {
        if (operation === 'add') {
            this.stats.totalItems++;
            this.stats.totalSize += sizeChange;
        } else {
            this.stats.totalItems = Math.max(0, this.stats.totalItems - 1);
            this.stats.totalSize = Math.max(0, this.stats.totalSize - sizeChange);
        }
    }

    /**
     * Update hit rate statistics
     */
    private updateHitRate(): void {
        const total = this.hits + this.misses;
        this.stats.hitRate = total > 0 ? this.hits / total : 0;
        this.stats.missRate = total > 0 ? this.misses / total : 0;
    }

    /**
     * Save statistics to localStorage
     */
    private saveStats(): void {
        try {
            localStorage.setItem('cache-stats', JSON.stringify(this.stats));
        } catch (error) {
            console.warn('Failed to save cache stats:', error);
        }
    }

    /**
     * Cache decorator for functions
     */
    cached<T extends any[], R>(
        type: string,
        ttl?: number,
        keyGenerator?: (...args: T) => string
    ) {
        return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
            const originalMethod = descriptor.value;

            descriptor.value = async function (this: EnhancedCacheService, ...args: T): Promise<R> {
                const cacheKey = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
                
                // Try to get from cache
                let result = await this.get(type, cacheKey) as R | null;
                
                if (result === null) {
                    // Not in cache, execute original method
                    result = await originalMethod.apply(this, args);
                    
                    // Store in cache
                    await this.set(type, cacheKey, result, { customTTL: ttl });
                }
                
                return result as R;
            };

            return descriptor;
        };
    }
}

// Create and export singleton instance
export const cacheService = new EnhancedCacheService();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
    cacheService.initialize().catch(console.error);
}

export default cacheService;
