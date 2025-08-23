/**
 * @fileoverview Enhanced rate limiting with DDoS protection and adaptive limits
 * Phase 8.2 - Rate Limiting Implementation
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { TRPCError } from '@trpc/server';
import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../env';

// Redis client for rate limiting
const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints (very strict)
  auth: {
    requests: 5,
    window: '5 m',
    description: 'Authentication attempts',
  },
  authStrict: {
    requests: 3,
    window: '1 h',
    description: 'Password reset, account recovery',
  },
  
  // Core application endpoints
  api: {
    requests: 100,
    window: '1 m',
    description: 'General API requests',
  },
  apiStrict: {
    requests: 30,
    window: '1 m',
    description: 'Write operations',
  },
  
  // Real-time and interactive features
  websocket: {
    requests: 120,
    window: '1 m',
    description: 'WebSocket connections',
  },
  draft: {
    requests: 60,
    window: '1 m',
    description: 'Draft room actions',
  },
  chat: {
    requests: 30,
    window: '1 m',
    description: 'Chat messages',
  },
  
  // Resource-intensive operations
  upload: {
    requests: 10,
    window: '1 h',
    description: 'File uploads',
  },
  oracle: {
    requests: 50,
    window: '1 h',
    description: 'Oracle predictions',
  },
  
  // Administrative functions
  admin: {
    requests: 200,
    window: '1 h',
    description: 'Admin operations',
  },
  
  // Query operations (more lenient)
  query: {
    requests: 300,
    window: '1 m',
    description: 'Read operations',
  },
  
  // Burst protection (very short window)
  burst: {
    requests: 15,
    window: '10 s',
    description: 'Burst protection',
  },
  
  // Global user limits
  userGlobal: {
    requests: 1000,
    window: '1 h',
    description: 'Global user actions per hour',
  },
  
  // IP-based limits
  ipGlobal: {
    requests: 500,
    window: '1 h',
    description: 'Global IP requests per hour',
  },
  
  // DDoS protection (very strict)
  ddos: {
    requests: 10,
    window: '1 m',
    description: 'DDoS protection',
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

/**
 * Advanced rate limiter class with multiple protection layers
 */
export class AdvancedRateLimiter {
  private limiters: Map<string, Ratelimit> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  private alertThresholds: Map<string, number> = new Map();

  constructor() {
    this.initializeLimiters();
    this.setupAlertThresholds();
  }

  private initializeLimiters() {
    if (!redis) return;

    Object.entries(RATE_LIMIT_CONFIGS).forEach(([type, config]) => {
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.requests, config.window),
        analytics: true,
        prefix: `rl_${type}`,
      });
      this.limiters.set(type, limiter);
    });
  }

  private setupAlertThresholds() {
    // Set alert thresholds for different types
    this.alertThresholds.set('auth', 3); // Alert after 3 failed auth attempts
    this.alertThresholds.set('upload', 5); // Alert after 5 uploads
    this.alertThresholds.set('admin', 50); // Alert after 50 admin actions
  }

  /**
   * Check rate limit with comprehensive logging and protection
   */
  async checkLimit(
    identifier: string,
    type: RateLimitType,
    context?: RateLimitContext
  ): Promise<RateLimitResult> {
    const limiter = this.limiters.get(type);
    
    if (!limiter) {
      console.warn(`Rate limiter not configured for type: ${type}`);
      return { success: true, limit: 0, remaining: 0, reset: 0 };
    }

    const result = await limiter.limit(identifier);
    
    // Log rate limit events
    await this.logRateLimitEvent(identifier, type, result, context);
    
    // Check for suspicious activity
    if (!result.success) {
      await this.handleRateLimitExceeded(identifier, type, context);
    }
    
    // Check alert thresholds
    await this.checkAlertThresholds(identifier, type, result);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  /**
   * Multi-layered rate limit check
   */
  async checkMultiLayerLimit(
    userId: string | null,
    ip: string,
    type: RateLimitType,
    context?: RateLimitContext
  ): Promise<void> {
    const checks: Promise<RateLimitResult>[] = [];

    // Primary identifier (user or IP)
    const primaryId = userId || ip;
    checks.push(this.checkLimit(`${type}:${primaryId}`, type, context));

    // Always check IP-based limits for additional protection
    checks.push(this.checkLimit(`ip:${ip}`, 'ipGlobal', context));

    // Check for burst protection on critical endpoints
    if (['auth', 'upload', 'admin'].includes(type)) {
      checks.push(this.checkLimit(`burst:${primaryId}`, 'burst', context));
    }

    // Global user limits for authenticated users
    if (userId) {
      checks.push(this.checkLimit(`user:${userId}`, 'userGlobal', context));
    }

    // DDoS protection for suspicious IPs
    if (this.suspiciousIPs.has(ip)) {
      checks.push(this.checkLimit(`ddos:${ip}`, 'ddos', context));
    }

    const results = await Promise.all(checks);
    
    // If any check fails, throw error
    const failedResult = results.find(result => !result.success);
    if (failedResult) {
      const resetTime = Math.ceil((failedResult.reset - Date.now()) / 1000);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${resetTime} seconds.`,
      });
    }
  }

  /**
   * Adaptive rate limiting based on system conditions
   */
  async checkAdaptiveLimit(
    identifier: string,
    baseType: RateLimitType,
    systemLoad: number = 0,
    context?: RateLimitContext
  ): Promise<RateLimitResult> {
    let adjustedType = baseType;

    // Adjust limits based on system load
    if (systemLoad > 0.8) {
      // High load - use stricter limits
      adjustedType = this.getStricterType(baseType);
      console.warn('High system load detected, applying stricter rate limits', {
        originalType: baseType,
        adjustedType,
        systemLoad,
      });
    } else if (systemLoad < 0.3) {
      // Low load - could allow more lenient limits
      adjustedType = this.getLenientType(baseType);
    }

    return this.checkLimit(identifier, adjustedType, context);
  }

  /**
   * Geographic-based rate limiting
   */
  async checkGeographicLimit(
    ip: string,
    country: string,
    type: RateLimitType,
    context?: RateLimitContext
  ): Promise<void> {
    // Stricter limits for certain countries or regions
    const highRiskCountries = ['CN', 'RU', 'IR', 'KP']; // Example list
    
    if (highRiskCountries.includes(country)) {
      const strictType = this.getStricterType(type);
      await this.checkLimit(`geo:${country}:${ip}`, strictType, context);
    }
    
    // Regular check
    await this.checkLimit(`${type}:${ip}`, type, context);
  }

  /**
   * Distributed rate limiting for load-balanced environments
   */
  async checkDistributedLimit(
    identifier: string,
    type: RateLimitType,
    nodeId: string,
    context?: RateLimitContext
  ): Promise<RateLimitResult> {
    // Create distributed identifier
    const distributedId = `${identifier}:node:${nodeId}`;
    
    // Check both local and global limits
    const [localResult, globalResult] = await Promise.all([
      this.checkLimit(distributedId, type, context),
      this.checkLimit(identifier, type, context),
    ]);

    // Return the more restrictive result
    if (!localResult.success || !globalResult.success) {
      return { ...localResult, success: false };
    }

    return globalResult;
  }

  private async logRateLimitEvent(
    identifier: string,
    type: RateLimitType,
    result: { success: boolean; limit: number; remaining: number; reset: number },
    context?: RateLimitContext
  ): Promise<void> {
    const logData = {
      timestamp: new Date().toISOString(),
      identifier,
      type,
      success: result.success,
      remaining: result.remaining,
      limit: result.limit,
      ip: context?.ip,
      userAgent: context?.userAgent,
      path: context?.path,
      userId: context?.userId,
    };

    // Log to appropriate level based on result
    if (!result.success) {
      console.warn('Rate limit exceeded:', logData);
    } else if (result.remaining < result.limit * 0.1) {
      console.info('Rate limit warning:', logData);
    }

    // In production, send to centralized logging service
    if (process.env.NODE_ENV === 'production') {
      // await this.sendToLoggingService(logData);
    }
  }

  private async handleRateLimitExceeded(
    identifier: string,
    type: RateLimitType,
    context?: RateLimitContext
  ): Promise<void> {
    // Track suspicious IPs
    if (context?.ip) {
      this.suspiciousIPs.add(context.ip);
      
      // Auto-remove from suspicious list after some time
      setTimeout(() => {
        this.suspiciousIPs.delete(context.ip!);
      }, 3600000); // 1 hour
    }

    // Log security event
    console.error('Rate limit exceeded - potential attack:', {
      identifier,
      type,
      ip: context?.ip,
      userAgent: context?.userAgent,
      path: context?.path,
      timestamp: new Date().toISOString(),
    });

    // Notify security team for critical endpoints
    if (['auth', 'admin', 'upload'].includes(type)) {
      await this.notifySecurityTeam(identifier, type, context);
    }
  }

  private async checkAlertThresholds(
    identifier: string,
    type: RateLimitType,
    result: { remaining: number; limit: number }
  ): Promise<void> {
    const threshold = this.alertThresholds.get(type);
    if (!threshold) return;

    const used = result.limit - result.remaining;
    if (used >= threshold) {
      console.warn(`Rate limit alert threshold reached for ${type}:`, {
        identifier,
        used,
        threshold,
        limit: result.limit,
      });
    }
  }

  private getStricterType(type: RateLimitType): RateLimitType {
    const strictMapping: Partial<Record<RateLimitType, RateLimitType>> = {
      api: 'apiStrict',
      auth: 'authStrict',
      query: 'api',
      websocket: 'draft',
      chat: 'burst',
    };
    
    return strictMapping[type] || 'ddos';
  }

  private getLenientType(type: RateLimitType): RateLimitType {
    const lenientMapping: Partial<Record<RateLimitType, RateLimitType>> = {
      apiStrict: 'api',
      authStrict: 'auth',
      burst: 'chat',
    };
    
    return lenientMapping[type] || type;
  }

  private async notifySecurityTeam(
    identifier: string,
    type: RateLimitType,
    context?: RateLimitContext
  ): Promise<void> {
    // In production, this would send alerts to security team
    console.error('SECURITY ALERT: Critical rate limit exceeded', {
      identifier,
      type,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

// Global rate limiter instance
export const rateLimiter = new AdvancedRateLimiter();

/**
 * Express-style middleware for Next.js
 */
export function createRateLimitMiddleware(type: RateLimitType) {
  return async (request: NextRequest): Promise<NextResponse | void> => {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const path = request.nextUrl.pathname;

    try {
      await rateLimiter.checkMultiLayerLimit(null, ip, type, {
        ip,
        userAgent,
        path,
      });
    } catch (error) {
      if (error instanceof TRPCError && error.code === 'TOO_MANY_REQUESTS') {
        return new NextResponse(
          JSON.stringify({ error: error.message }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
            },
          }
        );
      }
      throw error;
    }
  };
}

/**
 * tRPC middleware for rate limiting
 */
export function createTRPCRateLimitMiddleware(type: RateLimitType) {
  return async ({ ctx, next, path }: any) => {
    const ip = ctx.req?.ip || ctx.req?.connection?.remoteAddress || 'unknown';
    const userAgent = ctx.req?.headers?.['user-agent'] || 'unknown';
    const userId = ctx.session?.user?.id;

    await rateLimiter.checkMultiLayerLimit(userId, ip, type, {
      ip,
      userAgent,
      path,
      userId,
    });

    return next({ ctx });
  };
}

/**
 * Utility functions
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  
  return 'unknown';
}

export function getSystemLoad(): number {
  // In production, this would check actual system metrics
  // For now, return a mock value
  return Math.random();
}

export function getCountryFromIP(ip: string): string {
  // In production, use a GeoIP service
  // For now, return unknown
  return 'unknown';
}

/**
 * Rate limit bypass for trusted services
 */
export class RateLimitBypass {
  private static trustedTokens = new Set(
    process.env.TRUSTED_SERVICE_TOKENS?.split(',') || []
  );

  static isTrustedRequest(request: NextRequest): boolean {
    const token = request.headers.get('x-service-token');
    return token ? this.trustedTokens.has(token) : false;
  }

  static async checkWithBypass(
    request: NextRequest,
    type: RateLimitType,
    checkFunction: () => Promise<void>
  ): Promise<void> {
    if (this.isTrustedRequest(request)) {
      return; // Bypass rate limiting for trusted services
    }
    
    await checkFunction();
  }
}

// Type definitions
export interface RateLimitContext {
  ip?: string;
  userAgent?: string;
  path?: string;
  userId?: string;
  nodeId?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// Export middleware creators
export const authRateLimit = createRateLimitMiddleware('auth');
export const apiRateLimit = createRateLimitMiddleware('api');
export const uploadRateLimit = createRateLimitMiddleware('upload');
export const adminRateLimit = createRateLimitMiddleware('admin');

export const authRateLimitTRPC = createTRPCRateLimitMiddleware('auth');
export const apiRateLimitTRPC = createTRPCRateLimitMiddleware('api');
export const draftRateLimitTRPC = createTRPCRateLimitMiddleware('draft');
export const oracleRateLimitTRPC = createTRPCRateLimitMiddleware('oracle');