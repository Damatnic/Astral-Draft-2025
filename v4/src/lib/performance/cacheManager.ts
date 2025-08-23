/**
 * @fileoverview Advanced Caching Manager
 * Provides Redis caching, tRPC response caching, and cache invalidation strategies
 */

import { Redis } from 'ioredis';
import { measureAsyncFunction } from './monitoring';

// Cache configuration
interface CacheConfig {
  ttl?: number; // Time to live in seconds
  staleWhileRevalidate?: number; // SWR time in seconds
  tags?: string[]; // Cache tags for invalidation
  maxAge?: number; // Max age in seconds
  sMaxAge?: number; // Shared max age in seconds
  revalidate?: number; // ISR revalidation time
}

interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  staleTime?: number;
  tags?: string[];
  hits: number;
  lastAccess: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

// Cache levels enum
enum CacheLevel {
  Memory = 'memory',
  Redis = 'redis',
  CDN = 'cdn',
  Browser = 'browser',
}

class AdvancedCacheManager {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, CacheEntry>();
  private cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  };

  // Default cache configurations for different data types
  private readonly cacheConfigs = {
    user: { ttl: 300, staleWhileRevalidate: 60, tags: ['user'] }, // 5 minutes
    league: { ttl: 600, staleWhileRevalidate: 120, tags: ['league'] }, // 10 minutes
    player: { ttl: 1800, staleWhileRevalidate: 300, tags: ['player'] }, // 30 minutes
    stats: { ttl: 900, staleWhileRevalidate: 180, tags: ['stats'] }, // 15 minutes
    draft: { ttl: 60, staleWhileRevalidate: 15, tags: ['draft'] }, // 1 minute (live data)
    matchup: { ttl: 300, staleWhileRevalidate: 60, tags: ['matchup'] }, // 5 minutes
    standings: { ttl: 600, staleWhileRevalidate: 120, tags: ['standings'] }, // 10 minutes
    news: { ttl: 1800, staleWhileRevalidate: 300, tags: ['news'] }, // 30 minutes
    static: { ttl: 86400, staleWhileRevalidate: 3600, tags: ['static'] }, // 24 hours
  };

  constructor() {
    this.initializeRedis();
    this.startCleanupInterval();
  }

  private async initializeRedis() {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        await this.redis.ping();
        console.log('Redis connected successfully');
      } catch (error) {
        console.warn('Redis connection failed, falling back to memory cache:', error);
        this.redis = null;
      }
    }
  }

  /**
   * Get cached value with multi-level caching
   */
  async get<T>(key: string, level: CacheLevel[] = [CacheLevel.Memory, CacheLevel.Redis]): Promise<T | null> {
    // Try memory cache first
    if (level.includes(CacheLevel.Memory)) {
      const memoryResult = this.getFromMemory<T>(key);
      if (memoryResult !== null) {
        this.cacheStats.hits++;
        this.updateHitRate();
        return memoryResult;
      }
    }

    // Try Redis cache
    if (level.includes(CacheLevel.Redis) && this.redis) {
      try {
        const redisResult = await measureAsyncFunction(
          () => this.getFromRedis<T>(key),
          'cache_redis_get'
        )();
        
        if (redisResult !== null) {
          // Populate memory cache with Redis result
          if (level.includes(CacheLevel.Memory)) {
            this.setInMemory(key, redisResult.value, redisResult);
          }
          this.cacheStats.hits++;
          this.updateHitRate();
          return redisResult.value;
        }
      } catch (error) {
        console.warn('Redis get error:', error);
      }
    }

    this.cacheStats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set cached value with multi-level caching
   */
  async set<T>(
    key: string,
    value: T,
    config?: CacheConfig,
    level: CacheLevel[] = [CacheLevel.Memory, CacheLevel.Redis]
  ): Promise<void> {
    const finalConfig = { ...this.getDefaultConfig(key), ...config };
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: finalConfig.ttl || 300,
      staleTime: finalConfig.staleWhileRevalidate,
      tags: finalConfig.tags,
      hits: 0,
      lastAccess: Date.now(),
    };

    // Set in memory cache
    if (level.includes(CacheLevel.Memory)) {
      this.setInMemory(key, value, entry);
    }

    // Set in Redis cache
    if (level.includes(CacheLevel.Redis) && this.redis) {
      try {
        await measureAsyncFunction(
          () => this.setInRedis(key, entry),
          'cache_redis_set'
        )();
      } catch (error) {
        console.warn('Redis set error:', error);
      }
    }

    this.cacheStats.sets++;
  }

  /**
   * Delete cached value
   */
  async delete(key: string, level: CacheLevel[] = [CacheLevel.Memory, CacheLevel.Redis]): Promise<void> {
    if (level.includes(CacheLevel.Memory)) {
      this.memoryCache.delete(key);
    }

    if (level.includes(CacheLevel.Redis) && this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.warn('Redis delete error:', error);
      }
    }

    this.cacheStats.deletes++;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    // Memory cache invalidation
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags?.some(tag => tags.includes(tag))) {
        this.memoryCache.delete(key);
      }
    }

    // Redis cache invalidation
    if (this.redis) {
      try {
        const keys = await this.redis.keys('*');
        const pipeline = this.redis.pipeline();

        for (const key of keys) {
          const entryStr = await this.redis.get(key);
          if (entryStr) {
            try {
              const entry = JSON.parse(entryStr);
              if (entry.tags?.some((tag: string) => tags.includes(tag))) {
                pipeline.del(key);
              }
            } catch (error) {
              // Skip invalid JSON entries
            }
          }
        }

        await pipeline.exec();
      } catch (error) {
        console.warn('Redis tag invalidation error:', error);
      }
    }
  }

  /**
   * Get cached value or execute function with caching
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T> | T,
    config?: CacheConfig
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, config);
    return result;
  }

  /**
   * Stale-while-revalidate pattern
   */
  async getSWR<T>(
    key: string,
    fn: () => Promise<T> | T,
    config?: CacheConfig
  ): Promise<T> {
    const cached = await this.get<T>(key);
    const now = Date.now();

    if (cached !== null) {
      // Check if data is stale
      const entry = this.memoryCache.get(key) || await this.getFromRedis<T>(key);
      if (entry) {
        const age = (now - entry.timestamp) / 1000;
        const isStale = entry.staleTime && age > entry.staleTime;

        if (isStale) {
          // Return stale data immediately and revalidate in background
          this.revalidateInBackground(key, fn, config);
        }

        return cached;
      }
    }

    // No cached data, fetch fresh
    const result = await fn();
    await this.set(key, result, config);
    return result;
  }

  /**
   * Memory cache operations
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = (now - entry.timestamp) / 1000;

    if (age > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    entry.hits++;
    entry.lastAccess = now;
    return entry.value;
  }

  private setInMemory<T>(key: string, value: T, entry: CacheEntry<T>): void {
    this.memoryCache.set(key, entry);
    
    // Limit memory cache size
    if (this.memoryCache.size > 1000) {
      this.evictLRU();
    }
  }

  /**
   * Redis cache operations
   */
  private async getFromRedis<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.redis) return null;

    try {
      const result = await this.redis.get(key);
      if (!result) return null;

      const entry: CacheEntry<T> = JSON.parse(result);
      const now = Date.now();
      const age = (now - entry.timestamp) / 1000;

      if (age > entry.ttl) {
        await this.redis.del(key);
        return null;
      }

      return entry;
    } catch (error) {
      console.warn('Redis get parsing error:', error);
      return null;
    }
  }

  private async setInRedis<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!this.redis) return;

    const serialized = JSON.stringify(entry);
    await this.redis.setex(key, entry.ttl, serialized);
  }

  /**
   * Cache management utilities
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  private async revalidateInBackground<T>(
    key: string,
    fn: () => Promise<T> | T,
    config?: CacheConfig
  ): Promise<void> {
    try {
      const result = await fn();
      await this.set(key, result, config);
    } catch (error) {
      console.warn('Background revalidation failed:', error);
    }
  }

  private getDefaultConfig(key: string): CacheConfig {
    const type = key.split(':')[0];
    return this.cacheConfigs[type as keyof typeof this.cacheConfigs] || this.cacheConfigs.static;
  }

  private updateHitRate(): void {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    this.cacheStats.hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 60000); // Clean up every minute
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      const age = (now - entry.timestamp) / 1000;
      if (age > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
    this.cacheStats.size = this.memoryCache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.cacheStats.size = this.memoryCache.size;
    return { ...this.cacheStats };
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    if (this.redis) {
      try {
        await this.redis.flushall();
      } catch (error) {
        console.warn('Redis flush error:', error);
      }
    }
  }

  /**
   * Warm up cache with critical data
   */
  async warmUp(warmUpFunctions: Array<() => Promise<void>>): Promise<void> {
    console.log('Starting cache warm-up...');
    const start = Date.now();

    await Promise.allSettled(
      warmUpFunctions.map(fn => fn())
    );

    const duration = Date.now() - start;
    console.log(`Cache warm-up completed in ${duration}ms`);
  }
}

// Cache headers utilities
export function getCacheHeaders(config: CacheConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config.maxAge) {
    headers['Cache-Control'] = `max-age=${config.maxAge}`;
  }

  if (config.sMaxAge) {
    headers['Cache-Control'] += `, s-maxage=${config.sMaxAge}`;
  }

  if (config.staleWhileRevalidate) {
    headers['Cache-Control'] += `, stale-while-revalidate=${config.staleWhileRevalidate}`;
  }

  if (config.revalidate) {
    headers['Cache-Control'] += `, must-revalidate`;
  }

  return headers;
}

// tRPC cache middleware
export function createTRPCCacheMiddleware(cacheManager: AdvancedCacheManager) {
  return async function cacheMiddleware(opts: any) {
    const { path, type, next } = opts;
    
    if (type !== 'query') {
      return next(opts);
    }

    const cacheKey = `trpc:${path}:${JSON.stringify(opts.input)}`;
    
    try {
      return await cacheManager.getSWR(
        cacheKey,
        () => next(opts),
        { ttl: 300, staleWhileRevalidate: 60, tags: ['trpc'] }
      );
    } catch (error) {
      // If caching fails, execute without cache
      return next(opts);
    }
  };
}

// React hook for cache invalidation
export function useCacheInvalidation() {
  const invalidateCache = async (tags: string[]) => {
    await cacheManager.invalidateByTags(tags);
    
    // Also trigger SWR revalidation if available
    if (typeof window !== 'undefined' && (window as any).SWRConfig) {
      const { mutate } = await import('swr');
      mutate(() => true, undefined, { revalidate: true });
    }
  };

  return { invalidateCache };
}

// Export configured cache manager
export const cacheManager = new AdvancedCacheManager();

// Cache key generators
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  league: (id: string) => `league:${id}`,
  leaguesByUser: (userId: string) => `leagues:user:${userId}`,
  team: (id: string) => `team:${id}`,
  teamsByLeague: (leagueId: string) => `teams:league:${leagueId}`,
  player: (id: string) => `player:${id}`,
  playersByPosition: (position: string) => `players:position:${position}`,
  playerStats: (playerId: string, week: number, season: number) => 
    `stats:${playerId}:${season}:${week}`,
  matchups: (leagueId: string, week: number, season: number) => 
    `matchups:${leagueId}:${season}:${week}`,
  standings: (leagueId: string, season: number) => `standings:${leagueId}:${season}`,
  draft: (leagueId: string) => `draft:${leagueId}`,
  draftPicks: (draftId: string) => `draft:picks:${draftId}`,
};

export default cacheManager;