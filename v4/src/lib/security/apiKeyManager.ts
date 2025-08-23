/**
 * @fileoverview API Key rotation and management system with versioning
 * Phase 8.5 - API Key Rotation System Implementation
 */

import crypto from 'crypto';
import { z } from 'zod';
import { Redis } from '@upstash/redis';
import { env } from '../../env';

// Redis client for key storage
const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * API Key configuration
 */
const API_KEY_CONFIG = {
  KEY_LENGTH: 32,
  VERSION_LENGTH: 8,
  PREFIX: 'ak', // astral key
  SEPARATOR: '_',
  DEFAULT_TTL: 30 * 24 * 60 * 60, // 30 days in seconds
  GRACE_PERIOD: 7 * 24 * 60 * 60, // 7 days grace period
  MAX_VERSIONS: 5, // Maximum number of key versions to keep
  ROTATION_INTERVAL: 15 * 24 * 60 * 60, // 15 days between rotations
  REDIS_PREFIX: 'apikey:',
  AUDIT_RETENTION: 90 * 24 * 60 * 60, // 90 days audit log retention
};

/**
 * API Key scopes and permissions
 */
export const API_KEY_SCOPES = {
  // Read permissions
  READ_USERS: 'read:users',
  READ_LEAGUES: 'read:leagues',
  READ_PLAYERS: 'read:players',
  READ_DRAFTS: 'read:drafts',
  READ_ANALYTICS: 'read:analytics',
  
  // Write permissions
  WRITE_USERS: 'write:users',
  WRITE_LEAGUES: 'write:leagues',
  WRITE_DRAFTS: 'write:drafts',
  WRITE_TRADES: 'write:trades',
  
  // Admin permissions
  ADMIN_USERS: 'admin:users',
  ADMIN_LEAGUES: 'admin:leagues',
  ADMIN_SYSTEM: 'admin:system',
  
  // Special permissions
  ORACLE_PREDICTIONS: 'oracle:predictions',
  WEBHOOK_ACCESS: 'webhook:access',
  REAL_TIME_DATA: 'realtime:data',
} as const;

export type APIKeyScope = typeof API_KEY_SCOPES[keyof typeof API_KEY_SCOPES];

/**
 * API Key management class
 */
export class APIKeyManager {
  private static instance: APIKeyManager;

  static getInstance(): APIKeyManager {
    if (!this.instance) {
      this.instance = new APIKeyManager();
    }
    return this.instance;
  }

  /**
   * Generate a new API key with version
   */
  async generateKey(
    userId: string,
    name: string,
    scopes: APIKeyScope[],
    ttl?: number
  ): Promise<APIKey> {
    const keyId = this.generateKeyId();
    const version = this.generateVersion();
    const secret = this.generateSecret();
    
    const keyString = this.formatKey(keyId, version, secret);
    const hash = this.hashKey(keyString);
    
    const apiKey: APIKey = {
      id: keyId,
      userId,
      name,
      keyString,
      hash,
      version,
      scopes,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (ttl || API_KEY_CONFIG.DEFAULT_TTL) * 1000),
      lastUsedAt: null,
      isActive: true,
      rotationSchedule: this.calculateNextRotation(),
      metadata: {},
    };

    // Store in Redis
    await this.storeKey(apiKey);
    
    // Log creation event
    await this.logAuditEvent('KEY_CREATED', keyId, userId, {
      name,
      scopes,
      ttl,
    });

    return apiKey;
  }

  /**
   * Rotate an existing API key
   */
  async rotateKey(keyId: string, userId: string): Promise<APIKey> {
    const existingKey = await this.getKeyById(keyId);
    
    if (!existingKey || existingKey.userId !== userId) {
      throw new Error('API key not found or access denied');
    }

    // Generate new version
    const newVersion = this.generateVersion();
    const newSecret = this.generateSecret();
    const newKeyString = this.formatKey(keyId, newVersion, newSecret);
    const newHash = this.hashKey(newKeyString);

    // Create rotated key
    const rotatedKey: APIKey = {
      ...existingKey,
      keyString: newKeyString,
      hash: newHash,
      version: newVersion,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + API_KEY_CONFIG.DEFAULT_TTL * 1000),
      rotationSchedule: this.calculateNextRotation(),
      lastRotatedAt: new Date(),
    };

    // Keep old version for grace period
    await this.archiveKeyVersion(existingKey);
    
    // Store new version
    await this.storeKey(rotatedKey);
    
    // Log rotation event
    await this.logAuditEvent('KEY_ROTATED', keyId, userId, {
      oldVersion: existingKey.version,
      newVersion: newVersion,
    });

    return rotatedKey;
  }

  /**
   * Validate API key and return permissions
   */
  async validateKey(keyString: string): Promise<APIKeyValidation> {
    try {
      const { keyId, version } = this.parseKey(keyString);
      const hash = this.hashKey(keyString);
      
      // Try current version first
      const currentKey = await this.getKeyByHash(hash);
      
      if (currentKey && currentKey.isActive && !this.isExpired(currentKey)) {
        await this.updateLastUsed(currentKey.id);
        return {
          valid: true,
          key: currentKey,
        };
      }

      // Check archived versions (grace period)
      const archivedKey = await this.getArchivedKeyVersion(keyId, version);
      
      if (archivedKey && archivedKey.isActive && this.isInGracePeriod(archivedKey)) {
        await this.updateLastUsed(archivedKey.id);
        return {
          valid: true,
          key: archivedKey,
          warning: 'Using deprecated key version. Please update to latest version.',
        };
      }

      return {
        valid: false,
        reason: 'Invalid, expired, or revoked API key',
      };
    } catch (error) {
      return {
        valid: false,
        reason: 'Malformed API key',
      };
    }
  }

  /**
   * Revoke API key
   */
  async revokeKey(keyId: string, userId: string, reason?: string): Promise<void> {
    const key = await this.getKeyById(keyId);
    
    if (!key || key.userId !== userId) {
      throw new Error('API key not found or access denied');
    }

    // Mark as inactive
    key.isActive = false;
    key.revokedAt = new Date();
    key.revocationReason = reason;

    await this.storeKey(key);
    
    // Remove from active indexes
    await this.removeFromIndexes(key);
    
    // Log revocation
    await this.logAuditEvent('KEY_REVOKED', keyId, userId, {
      reason,
    });
  }

  /**
   * List user's API keys
   */
  async getUserKeys(userId: string): Promise<APIKeySummary[]> {
    if (!redis) return [];

    const keyIds = await redis.smembers(`${API_KEY_CONFIG.REDIS_PREFIX}user:${userId}`);
    const keys = await Promise.all(
      keyIds.map(async (keyId) => {
        const key = await this.getKeyById(keyId);
        return key ? this.toSummary(key) : null;
      })
    );

    return keys.filter((key): key is APIKeySummary => key !== null);
  }

  /**
   * Check if keys need rotation
   */
  async checkRotationSchedule(): Promise<APIKey[]> {
    if (!redis) return [];

    const now = new Date();
    const allKeys = await this.getAllActiveKeys();
    
    return allKeys.filter(key => 
      key.rotationSchedule && 
      key.rotationSchedule <= now &&
      key.isActive
    );
  }

  /**
   * Auto-rotate keys that are due
   */
  async autoRotateKeys(): Promise<RotationResult[]> {
    const keysToRotate = await this.checkRotationSchedule();
    const results: RotationResult[] = [];

    for (const key of keysToRotate) {
      try {
        const rotatedKey = await this.rotateKey(key.id, key.userId);
        results.push({
          keyId: key.id,
          success: true,
          newVersion: rotatedKey.version,
        });

        // Notify user about rotation
        await this.notifyKeyRotation(key);
      } catch (error) {
        results.push({
          keyId: key.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get key usage analytics
   */
  async getKeyAnalytics(keyId: string, userId: string): Promise<APIKeyAnalytics> {
    const key = await this.getKeyById(keyId);
    
    if (!key || key.userId !== userId) {
      throw new Error('API key not found or access denied');
    }

    // Get usage statistics from Redis
    const usageData = await this.getUsageStatistics(keyId);
    const auditLogs = await this.getAuditLogs(keyId);

    return {
      keyId,
      totalRequests: usageData.totalRequests,
      requestsToday: usageData.requestsToday,
      requestsThisWeek: usageData.requestsThisWeek,
      lastUsed: key.lastUsedAt,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      isExpired: this.isExpired(key),
      daysUntilExpiry: this.getDaysUntilExpiry(key),
      auditEvents: auditLogs,
    };
  }

  /**
   * Validate key permissions for specific scope
   */
  hasPermission(key: APIKey, requiredScope: APIKeyScope): boolean {
    return key.scopes.includes(requiredScope);
  }

  /**
   * Private helper methods
   */
  private generateKeyId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private generateVersion(): string {
    return crypto.randomBytes(API_KEY_CONFIG.VERSION_LENGTH / 2).toString('hex');
  }

  private generateSecret(): string {
    return crypto.randomBytes(API_KEY_CONFIG.KEY_LENGTH).toString('hex');
  }

  private formatKey(keyId: string, version: string, secret: string): string {
    return [
      API_KEY_CONFIG.PREFIX,
      keyId,
      version,
      secret
    ].join(API_KEY_CONFIG.SEPARATOR);
  }

  private parseKey(keyString: string): { keyId: string; version: string; secret: string } {
    const parts = keyString.split(API_KEY_CONFIG.SEPARATOR);
    
    if (parts.length !== 4 || parts[0] !== API_KEY_CONFIG.PREFIX) {
      throw new Error('Invalid key format');
    }

    return {
      keyId: parts[1],
      version: parts[2],
      secret: parts[3],
    };
  }

  private hashKey(keyString: string): string {
    return crypto.createHash('sha256').update(keyString).digest('hex');
  }

  private async storeKey(key: APIKey): Promise<void> {
    if (!redis) return;

    const keyData = JSON.stringify(key);
    
    // Store main key data
    await redis.setex(
      `${API_KEY_CONFIG.REDIS_PREFIX}key:${key.id}`,
      API_KEY_CONFIG.DEFAULT_TTL,
      keyData
    );

    // Store hash index
    await redis.setex(
      `${API_KEY_CONFIG.REDIS_PREFIX}hash:${key.hash}`,
      API_KEY_CONFIG.DEFAULT_TTL,
      key.id
    );

    // Add to user index
    await redis.sadd(`${API_KEY_CONFIG.REDIS_PREFIX}user:${key.userId}`, key.id);
  }

  private async getKeyById(keyId: string): Promise<APIKey | null> {
    if (!redis) return null;

    const data = await redis.get(`${API_KEY_CONFIG.REDIS_PREFIX}key:${keyId}`);
    return data ? JSON.parse(data as string) : null;
  }

  private async getKeyByHash(hash: string): Promise<APIKey | null> {
    if (!redis) return null;

    const keyId = await redis.get(`${API_KEY_CONFIG.REDIS_PREFIX}hash:${hash}`);
    return keyId ? this.getKeyById(keyId as string) : null;
  }

  private async archiveKeyVersion(key: APIKey): Promise<void> {
    if (!redis) return;

    const archiveKey = `${API_KEY_CONFIG.REDIS_PREFIX}archive:${key.id}:${key.version}`;
    await redis.setex(archiveKey, API_KEY_CONFIG.GRACE_PERIOD, JSON.stringify(key));
  }

  private async getArchivedKeyVersion(keyId: string, version: string): Promise<APIKey | null> {
    if (!redis) return null;

    const archiveKey = `${API_KEY_CONFIG.REDIS_PREFIX}archive:${keyId}:${version}`;
    const data = await redis.get(archiveKey);
    return data ? JSON.parse(data as string) : null;
  }

  private isExpired(key: APIKey): boolean {
    return key.expiresAt < new Date();
  }

  private isInGracePeriod(key: APIKey): boolean {
    const gracePeriodEnd = new Date(key.createdAt.getTime() + API_KEY_CONFIG.GRACE_PERIOD * 1000);
    return new Date() <= gracePeriodEnd;
  }

  private calculateNextRotation(): Date {
    return new Date(Date.now() + API_KEY_CONFIG.ROTATION_INTERVAL * 1000);
  }

  private async updateLastUsed(keyId: string): Promise<void> {
    if (!redis) return;

    const key = await this.getKeyById(keyId);
    if (key) {
      key.lastUsedAt = new Date();
      await this.storeKey(key);
    }

    // Update usage statistics
    const today = new Date().toISOString().split('T')[0];
    await redis.incr(`${API_KEY_CONFIG.REDIS_PREFIX}usage:${keyId}:${today}`);
    await redis.incr(`${API_KEY_CONFIG.REDIS_PREFIX}usage:${keyId}:total`);
  }

  private async logAuditEvent(
    event: string,
    keyId: string,
    userId: string,
    details: any
  ): Promise<void> {
    if (!redis) return;

    const auditEntry = {
      event,
      keyId,
      userId,
      details,
      timestamp: new Date().toISOString(),
    };

    const auditKey = `${API_KEY_CONFIG.REDIS_PREFIX}audit:${keyId}`;
    await redis.lpush(auditKey, JSON.stringify(auditEntry));
    await redis.expire(auditKey, API_KEY_CONFIG.AUDIT_RETENTION);
    
    // Limit audit log size
    await redis.ltrim(auditKey, 0, 100);
  }

  private async getAllActiveKeys(): Promise<APIKey[]> {
    // Implementation would scan all active keys
    // For brevity, returning empty array
    return [];
  }

  private async removeFromIndexes(key: APIKey): Promise<void> {
    if (!redis) return;

    await redis.del(`${API_KEY_CONFIG.REDIS_PREFIX}hash:${key.hash}`);
    await redis.srem(`${API_KEY_CONFIG.REDIS_PREFIX}user:${key.userId}`, key.id);
  }

  private toSummary(key: APIKey): APIKeySummary {
    return {
      id: key.id,
      name: key.name,
      version: key.version,
      scopes: key.scopes,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      isActive: key.isActive,
      isExpired: this.isExpired(key),
    };
  }

  private getDaysUntilExpiry(key: APIKey): number {
    const now = new Date();
    const diffTime = key.expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async getUsageStatistics(keyId: string): Promise<any> {
    if (!redis) return { totalRequests: 0, requestsToday: 0, requestsThisWeek: 0 };

    const today = new Date().toISOString().split('T')[0];
    const total = await redis.get(`${API_KEY_CONFIG.REDIS_PREFIX}usage:${keyId}:total`) || 0;
    const todayCount = await redis.get(`${API_KEY_CONFIG.REDIS_PREFIX}usage:${keyId}:${today}`) || 0;

    return {
      totalRequests: parseInt(total as string),
      requestsToday: parseInt(todayCount as string),
      requestsThisWeek: 0, // Could implement weekly aggregation
    };
  }

  private async getAuditLogs(keyId: string): Promise<AuditEvent[]> {
    if (!redis) return [];

    const auditKey = `${API_KEY_CONFIG.REDIS_PREFIX}audit:${keyId}`;
    const logs = await redis.lrange(auditKey, 0, 20);
    
    return logs.map(log => JSON.parse(log as string));
  }

  private async notifyKeyRotation(key: APIKey): Promise<void> {
    // In production, send email/notification to user
    console.log(`API key rotated for user ${key.userId}: ${key.name}`);
  }
}

/**
 * Validation schemas
 */
export const apiKeySchemas = {
  createKey: z.object({
    name: z.string().min(1).max(100),
    scopes: z.array(z.string()).min(1),
    ttl: z.number().int().min(3600).max(365 * 24 * 60 * 60).optional(),
  }),

  rotateKey: z.object({
    keyId: z.string().min(1),
  }),

  revokeKey: z.object({
    keyId: z.string().min(1),
    reason: z.string().max(500).optional(),
  }),
};

// Type definitions
export interface APIKey {
  id: string;
  userId: string;
  name: string;
  keyString: string;
  hash: string;
  version: string;
  scopes: APIKeyScope[];
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date | null;
  lastRotatedAt?: Date;
  isActive: boolean;
  rotationSchedule: Date;
  revokedAt?: Date;
  revocationReason?: string;
  metadata: Record<string, any>;
}

export interface APIKeySummary {
  id: string;
  name: string;
  version: string;
  scopes: APIKeyScope[];
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date | null;
  isActive: boolean;
  isExpired: boolean;
}

export interface APIKeyValidation {
  valid: boolean;
  key?: APIKey;
  warning?: string;
  reason?: string;
}

export interface APIKeyAnalytics {
  keyId: string;
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  lastUsed: Date | null;
  createdAt: Date;
  expiresAt: Date;
  isExpired: boolean;
  daysUntilExpiry: number;
  auditEvents: AuditEvent[];
}

export interface RotationResult {
  keyId: string;
  success: boolean;
  newVersion?: string;
  error?: string;
}

export interface AuditEvent {
  event: string;
  keyId: string;
  userId: string;
  details: any;
  timestamp: string;
}

// Global instance
export const apiKeyManager = APIKeyManager.getInstance();

// Middleware for API key authentication
export const createAPIKeyMiddleware = (requiredScope?: APIKeyScope) => {
  return async (request: Request) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }

    const keyString = authHeader.substring(7);
    const validation = await apiKeyManager.validateKey(keyString);

    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid API key');
    }

    if (requiredScope && !apiKeyManager.hasPermission(validation.key!, requiredScope)) {
      throw new Error('Insufficient permissions');
    }

    return validation.key!;
  };
};

// Export commonly used functions
export const validateAPIKey = apiKeyManager.validateKey.bind(apiKeyManager);
export const createAPIKey = apiKeyManager.generateKey.bind(apiKeyManager);
export const rotateAPIKey = apiKeyManager.rotateKey.bind(apiKeyManager);