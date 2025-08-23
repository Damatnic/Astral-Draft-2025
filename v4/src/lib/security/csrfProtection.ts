/**
 * @fileoverview Advanced CSRF protection with double-submit cookies and origin validation
 * Phase 8.3 - CSRF Protection Implementation
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../server/auth';

/**
 * CSRF token configuration
 */
const CSRF_CONFIG = {
  TOKEN_LENGTH: 32,
  COOKIE_NAME: '__Host-csrf-token',
  HEADER_NAME: 'X-CSRF-Token',
  FORM_FIELD_NAME: '_token',
  TOKEN_LIFETIME: 3600000, // 1 hour in milliseconds
  SECURE_COOKIE: process.env.NODE_ENV === 'production',
  SAME_SITE: 'strict' as const,
  HTTP_ONLY: false, // Needs to be accessible to client for forms
};

/**
 * Allowed origins for CSRF validation
 */
const ALLOWED_ORIGINS = new Set([
  process.env.NEXTAUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  'https://astraldraft.com',
  'https://www.astraldraft.com',
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
].filter(Boolean));

/**
 * CSRF token management
 */
export class CSRFManager {
  /**
   * Generate a cryptographically secure CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(CSRF_CONFIG.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Generate a signed CSRF token with timestamp
   */
  static generateSignedToken(userId?: string): SignedCSRFToken {
    const token = this.generateToken();
    const timestamp = Date.now();
    const payload = `${token}:${timestamp}:${userId || 'anonymous'}`;
    
    const signature = crypto
      .createHmac('sha256', this.getSecretKey())
      .update(payload)
      .digest('hex');

    return {
      token,
      timestamp,
      signature,
      signed: `${token}.${timestamp}.${signature}`,
    };
  }

  /**
   * Verify a signed CSRF token
   */
  static verifySignedToken(signedToken: string, userId?: string): boolean {
    try {
      const [token, timestampStr, signature] = signedToken.split('.');
      
      if (!token || !timestampStr || !signature) {
        return false;
      }

      const timestamp = parseInt(timestampStr, 10);
      
      // Check token age
      if (Date.now() - timestamp > CSRF_CONFIG.TOKEN_LIFETIME) {
        return false;
      }

      // Verify signature
      const payload = `${token}:${timestamp}:${userId || 'anonymous'}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.getSecretKey())
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Set CSRF token in response cookies
   */
  static setCookieToken(response: NextResponse, token: string): void {
    const cookieOptions = {
      name: CSRF_CONFIG.COOKIE_NAME,
      value: token,
      httpOnly: CSRF_CONFIG.HTTP_ONLY,
      secure: CSRF_CONFIG.SECURE_COOKIE,
      sameSite: CSRF_CONFIG.SAME_SITE,
      maxAge: CSRF_CONFIG.TOKEN_LIFETIME / 1000, // Convert to seconds
      path: '/',
    };

    response.cookies.set(cookieOptions);
  }

  /**
   * Get CSRF token from request cookies
   */
  static getCookieToken(request: NextRequest): string | null {
    return request.cookies.get(CSRF_CONFIG.COOKIE_NAME)?.value || null;
  }

  /**
   * Get CSRF token from request headers
   */
  static getHeaderToken(request: NextRequest): string | null {
    return request.headers.get(CSRF_CONFIG.HEADER_NAME) ||
           request.headers.get(CSRF_CONFIG.HEADER_NAME.toLowerCase());
  }

  /**
   * Get CSRF token from form data
   */
  static async getFormToken(request: NextRequest): Promise<string | null> {
    try {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        return formData.get(CSRF_CONFIG.FORM_FIELD_NAME) as string || null;
      }
      
      if (contentType?.includes('application/json')) {
        const body = await request.json();
        return body[CSRF_CONFIG.FORM_FIELD_NAME] || null;
      }
    } catch {
      // Invalid form data
    }
    
    return null;
  }

  private static getSecretKey(): string {
    return process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
  }
}

/**
 * Origin validation utilities
 */
export class OriginValidator {
  /**
   * Validate request origin against allowed origins
   */
  static validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // For same-origin requests, origin might be null
    if (!origin && !referer) {
      // Allow requests without origin/referer for same-origin
      return true;
    }

    // Check origin header
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      console.warn('Invalid origin detected:', { origin, allowed: Array.from(ALLOWED_ORIGINS) });
      return false;
    }

    // Check referer as fallback
    if (!origin && referer) {
      try {
        const refererUrl = new URL(referer);
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
        
        if (!ALLOWED_ORIGINS.has(refererOrigin)) {
          console.warn('Invalid referer detected:', { referer, refererOrigin });
          return false;
        }
      } catch {
        console.warn('Invalid referer URL:', referer);
        return false;
      }
    }

    return true;
  }

  /**
   * Validate request against subdomain attacks
   */
  static validateSubdomain(request: NextRequest): boolean {
    const host = request.headers.get('host');
    const origin = request.headers.get('origin');
    
    if (!host || !origin) return true; // Skip if headers missing
    
    try {
      const originUrl = new URL(origin);
      
      // Ensure host matches origin
      if (host !== originUrl.host) {
        console.warn('Host/origin mismatch:', { host, origin: originUrl.host });
        return false;
      }
      
      // Check for suspicious subdomains
      const suspiciousPatterns = [
        /.*\.evil\.com$/,
        /.*\.(tk|ml|cf|ga)$/,
        /^\d+\.\d+\.\d+\.\d+$/, // Direct IP addresses
      ];
      
      return !suspiciousPatterns.some(pattern => pattern.test(originUrl.hostname));
    } catch {
      return false;
    }
  }
}

/**
 * Double-submit cookie implementation
 */
export class DoubleSubmitCookie {
  /**
   * Generate and set double-submit cookie
   */
  static setDoubleSubmitCookie(response: NextResponse, userId?: string): string {
    const token = CSRFManager.generateSignedToken(userId);
    
    // Set in cookie
    CSRFManager.setCookieToken(response, token.signed);
    
    // Return token for client-side use
    return token.signed;
  }

  /**
   * Validate double-submit cookie
   */
  static validateDoubleSubmitCookie(
    request: NextRequest,
    userId?: string
  ): ValidationResult {
    const cookieToken = CSRFManager.getCookieToken(request);
    const headerToken = CSRFManager.getHeaderToken(request);
    
    if (!cookieToken || !headerToken) {
      return {
        valid: false,
        reason: 'Missing CSRF tokens',
      };
    }

    // Tokens must match
    if (cookieToken !== headerToken) {
      return {
        valid: false,
        reason: 'CSRF token mismatch',
      };
    }

    // Verify token signature and age
    if (!CSRFManager.verifySignedToken(cookieToken, userId)) {
      return {
        valid: false,
        reason: 'Invalid or expired CSRF token',
      };
    }

    return { valid: true };
  }

  /**
   * Validate double-submit for form submissions
   */
  static async validateFormSubmission(
    request: NextRequest,
    userId?: string
  ): Promise<ValidationResult> {
    const cookieToken = CSRFManager.getCookieToken(request);
    const formToken = await CSRFManager.getFormToken(request);
    
    if (!cookieToken || !formToken) {
      return {
        valid: false,
        reason: 'Missing CSRF tokens in form',
      };
    }

    // Tokens must match
    if (cookieToken !== formToken) {
      return {
        valid: false,
        reason: 'CSRF form token mismatch',
      };
    }

    // Verify token signature and age
    if (!CSRFManager.verifySignedToken(cookieToken, userId)) {
      return {
        valid: false,
        reason: 'Invalid or expired CSRF form token',
      };
    }

    return { valid: true };
  }
}

/**
 * Main CSRF protection middleware
 */
export class CSRFProtection {
  /**
   * Comprehensive CSRF validation
   */
  static async validate(request: NextRequest): Promise<CSRFValidationResult> {
    // Skip CSRF protection for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return { valid: true, requiresToken: false };
    }

    // Skip for API auth routes (they have their own protection)
    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
      return { valid: true, requiresToken: false };
    }

    // Validate origin first
    if (!OriginValidator.validateOrigin(request)) {
      return {
        valid: false,
        reason: 'Invalid origin',
        requiresToken: true,
      };
    }

    // Validate subdomain protection
    if (!OriginValidator.validateSubdomain(request)) {
      return {
        valid: false,
        reason: 'Subdomain validation failed',
        requiresToken: true,
      };
    }

    // Get user session for token validation
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Validate double-submit cookie
    const contentType = request.headers.get('content-type');
    let validation: ValidationResult;

    if (contentType?.includes('application/x-www-form-urlencoded') ||
        contentType?.includes('multipart/form-data')) {
      validation = await DoubleSubmitCookie.validateFormSubmission(request, userId);
    } else {
      validation = DoubleSubmitCookie.validateDoubleSubmitCookie(request, userId);
    }

    if (!validation.valid) {
      return {
        valid: false,
        reason: validation.reason,
        requiresToken: true,
      };
    }

    return { valid: true, requiresToken: true };
  }

  /**
   * Middleware for Next.js API routes
   */
  static async middleware(request: NextRequest): Promise<NextResponse | void> {
    const validation = await this.validate(request);

    if (!validation.valid) {
      console.warn('CSRF validation failed:', {
        method: request.method,
        url: request.url,
        reason: validation.reason,
        timestamp: new Date().toISOString(),
      });

      return new NextResponse(
        JSON.stringify({
          error: 'CSRF validation failed',
          code: 'CSRF_TOKEN_INVALID',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Add CSRF token to response for next request
    const response = NextResponse.next();
    
    if (validation.requiresToken) {
      const session = await getServerSession(authOptions);
      const newToken = DoubleSubmitCookie.setDoubleSubmitCookie(
        response,
        session?.user?.id
      );
      
      // Add token to response headers for client access
      response.headers.set('X-CSRF-Token', newToken);
    }

    return response;
  }

  /**
   * tRPC middleware for CSRF protection
   */
  static createTRPCMiddleware() {
    return async ({ ctx, next }: any) => {
      const request = ctx.req as NextRequest;
      
      if (!request) {
        throw new Error('Request object not available in context');
      }

      const validation = await this.validate(request);

      if (!validation.valid) {
        throw new Error(`CSRF validation failed: ${validation.reason}`);
      }

      return next({ ctx });
    };
  }

  /**
   * Generate CSRF token for client-side use
   */
  static async generateTokenForUser(userId?: string): Promise<string> {
    const token = CSRFManager.generateSignedToken(userId);
    return token.signed;
  }

  /**
   * Validate CSRF token for client-side validation
   */
  static validateToken(token: string, userId?: string): boolean {
    return CSRFManager.verifySignedToken(token, userId);
  }
}

/**
 * SameSite cookie security enhancement
 */
export class SameSiteSecurity {
  /**
   * Set secure cookie attributes
   */
  static setSecureCookie(
    response: NextResponse,
    name: string,
    value: string,
    options: CookieOptions = {}
  ): void {
    const secureOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 3600, // 1 hour default
      path: '/',
      ...options,
    };

    response.cookies.set(name, value, secureOptions);
  }

  /**
   * Clear secure cookie
   */
  static clearSecureCookie(response: NextResponse, name: string): void {
    response.cookies.delete(name);
  }

  /**
   * Validate cookie security attributes
   */
  static validateCookieSecurity(request: NextRequest): boolean {
    const cookies = request.cookies.getAll();
    let allSecure = true;

    cookies.forEach(cookie => {
      // In production, ensure all cookies are secure
      if (process.env.NODE_ENV === 'production') {
        if (!cookie.name.startsWith('__Secure-') && 
            !cookie.name.startsWith('__Host-')) {
          console.warn('Insecure cookie detected:', cookie.name);
          allSecure = false;
        }
      }
    });

    return allSecure;
  }
}

/**
 * CSRF token React hook helper
 */
export const useCSRFToken = () => {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${CSRF_CONFIG.COOKIE_NAME}=`)
  );
  
  return csrfCookie ? 
    csrfCookie.split('=')[1] : null;
};

export const useCSRFForm = () => {
  const token = useCSRFToken();
  
  return {
    csrfInput: token ? (
      `<input type="hidden" name="${CSRF_CONFIG.FORM_FIELD_NAME}" value="${token}" />`
    ) : '',
    csrfHeaders: token ? {
      [CSRF_CONFIG.HEADER_NAME]: token,
    } : {},
  };
};

// Type definitions
export interface SignedCSRFToken {
  token: string;
  timestamp: number;
  signature: string;
  signed: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface CSRFValidationResult extends ValidationResult {
  requiresToken: boolean;
}

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

// Export convenience functions
export const csrfMiddleware = CSRFProtection.middleware;
export const csrfTRPCMiddleware = CSRFProtection.createTRPCMiddleware();
export const generateCSRFToken = CSRFProtection.generateTokenForUser;
export const validateCSRFToken = CSRFProtection.validateToken;

// Configuration exports
export const CSRF_TOKEN_HEADER = CSRF_CONFIG.HEADER_NAME;
export const CSRF_TOKEN_FIELD = CSRF_CONFIG.FORM_FIELD_NAME;
export const CSRF_COOKIE_NAME = CSRF_CONFIG.COOKIE_NAME;