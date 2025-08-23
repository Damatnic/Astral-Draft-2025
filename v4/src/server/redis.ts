/**
 * Redis client for caching, rate limiting, and real-time features
 */

import Redis from 'ioredis';
import { env } from '../env';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: env.REDIS_HOST || 'localhost',
    port: env.REDIS_PORT || 6379,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB || 0,
    retryStrategy: (times) => {
      // Reconnect after
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });

if (env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Helper functions for common Redis operations
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' 
      ? value 
      : JSON.stringify(value);
    
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async del(key: string | string[]): Promise<void> {
    if (Array.isArray(key)) {
      if (key.length > 0) {
        await redis.del(...key);
      }
    } else {
      await redis.del(key);
    }
  },

  async flush(pattern?: string): Promise<void> {
    if (pattern) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.flushdb();
    }
  },

  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  async expire(key: string, ttl: number): Promise<void> {
    await redis.expire(key, ttl);
  },

  async ttl(key: string): Promise<number> {
    return redis.ttl(key);
  },
};

// Pub/Sub helpers for real-time features
export const pubsub = {
  async publish(channel: string, message: any): Promise<void> {
    const serialized = typeof message === 'string'
      ? message
      : JSON.stringify(message);
    await redis.publish(channel, serialized);
  },

  subscribe(channel: string, callback: (message: any) => void): Redis {
    const subscriber = new Redis(redis.options);
    subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          const parsed = JSON.parse(message);
          callback(parsed);
        } catch {
          callback(message);
        }
      }
    });
    return subscriber;
  },
};

export default redis;