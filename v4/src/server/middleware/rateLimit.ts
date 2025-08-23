/**
 * Rate limiting middleware using Upstash
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { TRPCError } from '@trpc/server';
import { env } from '../../env';

// Create Redis client for rate limiting
const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Configure rate limiters for different endpoints
const rateLimiters = {
  // Default rate limit: 100 requests per minute
  default: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
  }) : null,
  
  // Auth endpoints: 5 requests per minute (prevent brute force)
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
  }) : null,
  
  // Strict auth (password reset, etc): 3 requests per hour
  authStrict: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
  }) : null,
  
  // Draft actions: 30 requests per minute
  draft: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
  }) : null,
  
  // Real-time WebSocket: 60 requests per minute
  websocket: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
  }) : null,
  
  // Data fetching: 200 requests per minute
  query: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, '1 m'),
    analytics: true,
  }) : null,
  
  // File uploads: 10 requests per hour
  upload: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
  }) : null,
  
  // Oracle predictions: 50 requests per hour
  oracle: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
    analytics: true,
  }) : null,
  
  // Chat messages: 20 requests per minute
  chat: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
  }) : null,
  
  // Admin actions: 100 requests per hour
  admin: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 h'),
    analytics: true,
  }) : null,
};

/**
 * Rate limit check function
 */
export async function checkRateLimit(
  identifier: string,
  type: keyof typeof rateLimiters = 'default'
) {
  const limiter = rateLimiters[type];
  
  // Skip rate limiting if Upstash is not configured
  if (!limiter) {
    console.warn('Rate limiting disabled: Upstash Redis not configured');
    return;
  }
  
  const { success, limit, reset, remaining } = await limiter.limit(identifier);
  
  if (!success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds`,
    });
  }
  
  return { limit, remaining, reset };
}

/**
 * Advanced rate limit check with security logging
 */
export async function checkAdvancedRateLimit(
  identifier: string,
  type: keyof typeof rateLimiters = 'default',
  context?: { ip?: string; userAgent?: string; path?: string }
) {
  const limiter = rateLimiters[type];
  
  if (!limiter) {
    console.warn('Rate limiting disabled: Upstash Redis not configured');
    return;
  }
  
  const { success, limit, reset, remaining } = await limiter.limit(identifier);
  
  // Log suspicious activity
  if (!success) {
    console.warn('Rate limit exceeded', {
      identifier,
      type,
      ip: context?.ip,
      userAgent: context?.userAgent,
      path: context?.path,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Log when user is approaching rate limit
  if (remaining < limit * 0.1) { // Less than 10% remaining
    console.info('Rate limit warning', {
      identifier,
      type,
      remaining,
      limit,
      ip: context?.ip,
    });
  }
  
  if (!success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds`,
    });
  }
  
  return { limit, remaining, reset };
}

/**
 * IP-based rate limiting for additional security
 */
export async function checkIPRateLimit(ip: string, strictMode = false) {
  if (!ip || ip === 'unknown') return;
  
  const limitType = strictMode ? 'authStrict' : 'default';
  const limiter = rateLimiters[limitType];
  
  if (!limiter) return;
  
  const { success } = await limiter.limit(`ip:${ip}`);
  
  if (!success) {
    console.error('IP rate limit exceeded', { ip, strictMode });
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP address',
    });
  }
}

/**
 * User action rate limiting (per user across all endpoints)
 */
export async function checkUserActionLimit(userId: string) {
  if (!redis) return;
  
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(500, '1 h'), // 500 actions per hour per user
    analytics: true,
  });
  
  const { success } = await limiter.limit(`user_actions:${userId}`);
  
  if (!success) {
    console.warn('User action limit exceeded', { userId });
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many actions. Please slow down.',
    });
  }
}

/**
 * Enhanced tRPC middleware for rate limiting
 */
export const rateLimitMiddleware = (type: keyof typeof rateLimiters = 'default') => {
  return async ({ ctx, next, path }: any) => {
    const ip = ctx.req?.ip || ctx.req?.connection?.remoteAddress || 'unknown';
    const userAgent = ctx.req?.headers?.['user-agent'] || 'unknown';
    const userId = ctx.session?.user?.id;
    
    // Primary rate limit check (per endpoint + user/IP)
    const identifier = userId ? `user:${userId}` : `ip:${ip}`;
    await checkAdvancedRateLimit(`${path}:${identifier}`, type, {
      ip,
      userAgent,
      path,
    });
    
    // Additional IP-based rate limiting for non-authenticated users
    if (!userId) {
      await checkIPRateLimit(ip, type === 'authStrict');
    }
    
    // Global user action limiting for authenticated users
    if (userId && type !== 'query') { // Don't count read operations
      await checkUserActionLimit(userId);
    }
    
    return next({ ctx });
  };
};

/**
 * Burst protection for critical endpoints
 */
export const burstProtectionMiddleware = () => {
  return async ({ ctx, next, path }: any) => {
    if (!redis) return next({ ctx });
    
    const userId = ctx.session?.user?.id;
    const ip = ctx.req?.ip || 'unknown';
    const identifier = userId || ip;
    
    // Very short-term burst protection (10 requests per 10 seconds)
    const burstLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
    });
    
    const { success } = await burstLimiter.limit(`burst:${path}:${identifier}`);
    
    if (!success) {
      console.warn('Burst limit exceeded', { identifier, path });
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests too quickly. Please slow down.',
      });
    }
    
    return next({ ctx });
  };
};

/**
 * Adaptive rate limiting based on system load
 */
export const adaptiveRateLimitMiddleware = (baseType: keyof typeof rateLimiters = 'default') => {
  return async ({ ctx, next, path }: any) => {
    // Simple system load check (in production, this could check Redis/DB latency)
    const systemLoad = Math.random(); // Mock system load (0-1)
    
    // Reduce limits if system is under high load
    let adjustedType = baseType;
    if (systemLoad > 0.8) {
      // Use stricter limits when system is overloaded
      adjustedType = 'authStrict';
      console.warn('System under high load, applying stricter rate limits', { systemLoad });
    }
    
    const identifier = ctx.session?.user?.id || ctx.req?.ip || 'anonymous';
    await checkRateLimit(`${path}:${identifier}`, adjustedType);
    
    return next({ ctx });
  };
};