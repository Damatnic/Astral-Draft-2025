/**
 * Advanced Caching Service for Astral Draft
 * Provides intelligent caching with TTL, LRU eviction, and persistence
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  enablePersistence: boolean;
  storagePrefix: string;
}

class CacheService {
  private readonly cache: Map<string, CacheItem<any>> = new Map();
  private readonly config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private hitCount: number = 0;
  private missCount: number = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      enablePersistence: true,
      storagePrefix: 'astral_cache_',
      ...config
    };

    this.startCleanup();
    this.loadFromStorage();
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const itemTTL = ttl || this.config.defaultTTL;

    // Remove oldest item if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: itemTTL,
      accessCount: 0,
      lastAccess: now
    };

    this.cache.set(key, item);
    this.persistItem(key, item);
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.missCount++;
      return null;
    }

    const now = Date.now();
    
    // Check if item has expired
    if (now - item.timestamp > item.ttl) {
      this.delete(key);
      this.missCount++;
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccess = now;
    this.hitCount++;
    
    return item.data as T;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted && this.config.enablePersistence) {
      localStorage.removeItem(this.config.storagePrefix + key);
    }
    return deleted;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    if (this.config.enablePersistence) {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.config.storagePrefix)
      );
      keys.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Get cache statistics
   */
  stats() {
    const now = Date.now();
    let expired = 0;
    let total = 0;
    let totalSize = 0;

    for (const [, item] of this.cache.entries()) {
      total++;
      totalSize += JSON.stringify(item.data).length;
      
      if (now - item.timestamp > item.ttl) {
        expired++;
      }
    }

    return {
      total,
      expired,
      size: totalSize,
      maxSize: this.config.maxSize,
      hitRatio: this.calculateHitRatio()
    };
  }

  /**
   * LRU eviction strategy
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccess < oldestAccess) {
        oldestAccess = item.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Cleanup expired items
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Persist item to localStorage
   */
  private persistItem<T>(key: string, item: CacheItem<T>): void {
    if (!this.config.enablePersistence) return;

    try {
      const serialized = JSON.stringify({
        data: item.data,
        timestamp: item.timestamp,
        ttl: item.ttl
      });
      localStorage.setItem(this.config.storagePrefix + key, serialized);
    } catch (error) {
      console.warn('Failed to persist cache item:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (!this.config.enablePersistence) return;

    try {
      const now = Date.now();
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.config.storagePrefix)
      );

      for (const storageKey of keys) {
        const cacheKey = storageKey.replace(this.config.storagePrefix, '');
        const itemData = localStorage.getItem(storageKey);
        
        if (itemData) {
          const parsed = JSON.parse(itemData);
          
          // Check if item is still valid
          if (now - parsed.timestamp < parsed.ttl) {
            const item: CacheItem<any> = {
              data: parsed.data,
              timestamp: parsed.timestamp,
              ttl: parsed.ttl,
              accessCount: 0,
              lastAccess: now
            };
            this.cache.set(cacheKey, item);
          } else {
            // Remove expired item from storage
            localStorage.removeItem(storageKey);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Calculate cache hit ratio
   */
  private calculateHitRatio(): number {
    const totalRequests = this.hitCount + this.missCount;
    if (totalRequests === 0) return 0;
    
    return this.hitCount / totalRequests;
  }

  /**
   * Memoization helper for functions
   */
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttl?: number
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cacheKey = `memoized_${fn.name}_${key}`;
      
      const cached = this.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      const result = fn(...args);
      this.set(cacheKey, result, ttl);
      return result;
    }) as T;
  }
}

// Create singleton instances for different cache types
export const apiCache = new CacheService({
  maxSize: 200,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  storagePrefix: 'astral_api_'
});

export const playerCache = new CacheService({
  maxSize: 1000,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  storagePrefix: 'astral_player_'
});

export const gameCache = new CacheService({
  maxSize: 500,
  defaultTTL: 30 * 1000, // 30 seconds for live data
  storagePrefix: 'astral_game_'
});

export default CacheService;
