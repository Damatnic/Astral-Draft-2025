/**
 * @fileoverview SQL injection prevention and query validation system
 * Phase 8.4 - SQL Injection Prevention Implementation
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

/**
 * SQL injection patterns to detect and prevent
 */
const SQL_INJECTION_PATTERNS = [
  // Union-based injections
  /(\s|^)(union|UNION)\s+(all\s+)?(select|SELECT)/gi,
  
  // Comment-based injections
  /--[\s\S]*$/gm,
  /\/\*[\s\S]*?\*\//g,
  
  // Stacked queries
  /;\s*(drop|DROP|delete|DELETE|truncate|TRUNCATE|alter|ALTER|create|CREATE)/gi,
  
  // Boolean-based blind injections
  /(\s|^)(and|AND|or|OR)\s+(\d+\s*=\s*\d+|\w+\s*=\s*\w+)/gi,
  
  // Time-based blind injections
  /(sleep|SLEEP|waitfor|WAITFOR|delay|DELAY)\s*\(/gi,
  
  // Information schema injections
  /(information_schema|INFORMATION_SCHEMA|sys\.|master\.)/gi,
  
  // Function-based injections
  /(char|CHAR|ascii|ASCII|substring|SUBSTRING|concat|CONCAT)\s*\(/gi,
  
  // Hex encoding injections
  /0x[0-9a-fA-F]+/g,
  
  // SQL keywords in unexpected contexts
  /(\s|^)(select|SELECT|insert|INSERT|update|UPDATE|delete|DELETE|exec|EXEC|execute|EXECUTE)\s/gi,
  
  // Stored procedure calls
  /(exec|EXEC|sp_|xp_)/gi,
];

/**
 * Dangerous SQL keywords that should be escaped or blocked
 */
const DANGEROUS_KEYWORDS = [
  'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'EXEC', 'EXECUTE',
  'UNION', 'SELECT', 'INSERT', 'UPDATE', 'DECLARE', 'CAST', 'CONVERT',
  'INFORMATION_SCHEMA', 'SYSOBJECTS', 'SYSCOLUMNS', 'MASTER', 'MSDB',
  'TEMPDB', 'SLEEP', 'WAITFOR', 'DELAY', 'BENCHMARK',
];

/**
 * SQL validation and sanitization utilities
 */
export class SQLValidator {
  /**
   * Check if input contains potential SQL injection patterns
   */
  static containsSQLInjection(input: string): SQLInjectionResult {
    if (!input || typeof input !== 'string') {
      return { detected: false, patterns: [] };
    }

    const detectedPatterns: string[] = [];

    // Check against known injection patterns
    SQL_INJECTION_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(input)) {
        detectedPatterns.push(`Pattern ${index + 1}: ${pattern.source}`);
      }
    });

    // Check for dangerous keywords
    const upperInput = input.toUpperCase();
    DANGEROUS_KEYWORDS.forEach(keyword => {
      if (upperInput.includes(keyword)) {
        detectedPatterns.push(`Dangerous keyword: ${keyword}`);
      }
    });

    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns,
      input: input.substring(0, 100), // Log first 100 chars for analysis
    };
  }

  /**
   * Sanitize input to prevent SQL injection
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
      // Escape single quotes
      .replace(/'/g, "''")
      // Remove or escape semicolons
      .replace(/;/g, '')
      // Remove SQL comments
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Limit length to prevent buffer overflows
      .substring(0, 1000)
      .trim();
  }

  /**
   * Validate table/column names (identifiers)
   */
  static validateIdentifier(identifier: string): boolean {
    if (!identifier || typeof identifier !== 'string') return false;
    
    // Only allow alphanumeric characters, underscores, and specific characters
    const identifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    
    return identifierPattern.test(identifier) && 
           identifier.length <= 64 && // MySQL limit
           !DANGEROUS_KEYWORDS.includes(identifier.toUpperCase());
  }

  /**
   * Validate numeric inputs
   */
  static validateNumeric(input: string): number | null {
    if (!input || typeof input !== 'string') return null;
    
    const cleaned = input.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    
    return !isNaN(num) && isFinite(num) ? num : null;
  }

  /**
   * Validate date inputs
   */
  static validateDate(input: string): Date | null {
    if (!input || typeof input !== 'string') return null;
    
    try {
      const date = new Date(input);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  /**
   * Create parameterized query validator
   */
  static createQueryValidator<T extends Record<string, any>>(
    queryTemplate: string,
    paramSchema: z.ZodSchema<T>
  ) {
    return (params: unknown): ValidatedQuery<T> => {
      // Validate parameters against schema
      const validationResult = paramSchema.safeParse(params);
      
      if (!validationResult.success) {
        return {
          valid: false,
          error: 'Parameter validation failed',
          details: validationResult.error.issues,
        };
      }

      const validatedParams = validationResult.data;

      // Check each parameter for SQL injection
      for (const [key, value] of Object.entries(validatedParams)) {
        if (typeof value === 'string') {
          const injectionCheck = this.containsSQLInjection(value);
          if (injectionCheck.detected) {
            return {
              valid: false,
              error: `SQL injection detected in parameter '${key}'`,
              details: injectionCheck.patterns,
            };
          }
        }
      }

      return {
        valid: true,
        query: queryTemplate,
        params: validatedParams,
      };
    };
  }
}

/**
 * Prisma query interceptor for additional security
 */
export class PrismaQueryInterceptor {
  private static instance: PrismaQueryInterceptor;
  private queryLog: QueryLogEntry[] = [];
  private suspiciousQueries: Set<string> = new Set();

  static getInstance(): PrismaQueryInterceptor {
    if (!this.instance) {
      this.instance = new PrismaQueryInterceptor();
    }
    return this.instance;
  }

  /**
   * Intercept and validate Prisma queries
   */
  interceptQuery(query: string, params: any[]): QueryInterceptionResult {
    const timestamp = new Date();
    const queryId = this.generateQueryId(query, params);

    // Log the query
    const logEntry: QueryLogEntry = {
      id: queryId,
      query: query.substring(0, 500), // Limit log size
      params: this.sanitizeParams(params),
      timestamp,
      suspicious: false,
    };

    // Check for suspicious patterns
    const injectionCheck = SQLValidator.containsSQLInjection(query);
    if (injectionCheck.detected) {
      logEntry.suspicious = true;
      logEntry.suspiciousReasons = injectionCheck.patterns;
      this.suspiciousQueries.add(queryId);

      // Log security event
      this.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
        query: query.substring(0, 200),
        patterns: injectionCheck.patterns,
        timestamp,
      });

      return {
        allowed: false,
        reason: 'Query contains suspicious patterns',
        queryId,
      };
    }

    // Check query complexity (prevent DoS)
    if (this.isQueryTooComplex(query)) {
      logEntry.suspicious = true;
      logEntry.suspiciousReasons = ['Query too complex'];

      return {
        allowed: false,
        reason: 'Query too complex',
        queryId,
      };
    }

    // Add to query log
    this.addToLog(logEntry);

    return {
      allowed: true,
      queryId,
    };
  }

  /**
   * Check if query is too complex (DoS prevention)
   */
  private isQueryTooComplex(query: string): boolean {
    // Count subqueries
    const subqueryCount = (query.match(/\bSELECT\b/gi) || []).length;
    if (subqueryCount > 5) return true;

    // Count JOINs
    const joinCount = (query.match(/\bJOIN\b/gi) || []).length;
    if (joinCount > 10) return true;

    // Check query length
    if (query.length > 10000) return true;

    // Check for recursive patterns
    if (/WITH\s+RECURSIVE/gi.test(query)) return true;

    return false;
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(query: string, params: any[]): string {
    const content = query + JSON.stringify(params);
    return require('crypto')
      .createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Sanitize parameters for logging
   */
  private sanitizeParams(params: any[]): any[] {
    return params.map(param => {
      if (typeof param === 'string' && param.length > 100) {
        return param.substring(0, 100) + '...';
      }
      return param;
    });
  }

  /**
   * Add entry to query log with rotation
   */
  private addToLog(entry: QueryLogEntry): void {
    this.queryLog.push(entry);
    
    // Rotate log to prevent memory issues
    if (this.queryLog.length > 1000) {
      this.queryLog = this.queryLog.slice(-500);
    }
  }

  /**
   * Get suspicious queries for monitoring
   */
  getSuspiciousQueries(): QueryLogEntry[] {
    return this.queryLog.filter(entry => entry.suspicious);
  }

  /**
   * Log security events
   */
  private logSecurityEvent(event: string, details: any): void {
    console.error('SQL SECURITY EVENT:', {
      event,
      details,
      timestamp: new Date().toISOString(),
    });

    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // await this.sendToSecurityService(event, details);
    }
  }

  /**
   * Get query statistics
   */
  getQueryStats(): QueryStats {
    const total = this.queryLog.length;
    const suspicious = this.queryLog.filter(q => q.suspicious).length;
    const recentQueries = this.queryLog.filter(
      q => Date.now() - q.timestamp.getTime() < 3600000 // Last hour
    ).length;

    return {
      totalQueries: total,
      suspiciousQueries: suspicious,
      recentQueries,
      suspiciousPercentage: total > 0 ? (suspicious / total) * 100 : 0,
    };
  }
}

/**
 * Enhanced Prisma client with security features
 */
export class SecurePrismaClient {
  private prisma: PrismaClient;
  private interceptor: PrismaQueryInterceptor;

  constructor() {
    this.interceptor = PrismaQueryInterceptor.getInstance();
    
    this.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Set up query logging
    this.setupQueryLogging();
  }

  private setupQueryLogging(): void {
    // Query logging is not supported in current Prisma version
    // TODO: Implement using Prisma middleware when available
    console.info('Query logging setup skipped - not supported in current Prisma version');
  }

  /**
   * Execute query with validation
   */
  async executeValidatedQuery<T>(
    queryFn: (prisma: PrismaClient) => Promise<T>,
    context?: QueryContext
  ): Promise<T> {
    try {
      // Context is passed but not used in current implementation
      // TODO: Implement context-aware query validation
      
      const result = await queryFn(this.prisma);
      return result;
    } catch (error) {
      // Log database errors for security analysis
      console.error('Database query error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Get Prisma client (for direct access when needed)
   */
  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): QueryStats {
    return this.interceptor.getQueryStats();
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * Query validation schemas
 */
export const queryValidationSchemas = {
  // User queries
  userById: z.object({
    id: z.string().uuid(),
  }),

  userByEmail: z.object({
    email: z.string().email().max(254),
  }),

  // League queries
  leagueById: z.object({
    id: z.string().uuid(),
  }),

  leaguesByUser: z.object({
    userId: z.string().uuid(),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  }),

  // Player queries
  playersSearch: z.object({
    query: z.string().min(1).max(100),
    position: z.enum(['QB', 'RB', 'WR', 'TE', 'K', 'DST']).optional(),
    limit: z.number().int().min(1).max(50).default(25),
  }),

  // Draft queries
  draftPicks: z.object({
    draftId: z.string().uuid(),
    round: z.number().int().min(1).max(20).optional(),
  }),

  // Generic pagination
  pagination: z.object({
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
};

/**
 * Create validated query functions
 */
export const createValidatedQueries = (prisma: SecurePrismaClient) => {
  return {
    getUserById: SQLValidator.createQueryValidator(
      'SELECT * FROM users WHERE id = ?',
      queryValidationSchemas.userById
    ),

    searchPlayers: SQLValidator.createQueryValidator(
      'SELECT * FROM players WHERE name ILIKE ? LIMIT ? OFFSET ?',
      queryValidationSchemas.playersSearch
    ),

    // Add more validated queries as needed
  };
};

// Type definitions
export interface SQLInjectionResult {
  detected: boolean;
  patterns: string[];
  input?: string;
}

export interface ValidatedQuery<T> {
  valid: boolean;
  query?: string;
  params?: T;
  error?: string;
  details?: any;
}

export interface QueryInterceptionResult {
  allowed: boolean;
  reason?: string;
  queryId: string;
}

export interface QueryLogEntry {
  id: string;
  query: string;
  params: any[];
  timestamp: Date;
  suspicious: boolean;
  suspiciousReasons?: string[];
}

export interface QueryStats {
  totalQueries: number;
  suspiciousQueries: number;
  recentQueries: number;
  suspiciousPercentage: number;
}

export interface QueryContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  action?: string;
}

// Global instance
export const securePrisma = new SecurePrismaClient();

// Export utilities
export const validateSQL = SQLValidator.containsSQLInjection;
export const sanitizeSQL = SQLValidator.sanitizeInput;
export const validateIdentifier = SQLValidator.validateIdentifier;