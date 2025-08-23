/**
 * @fileoverview Comprehensive input sanitization and XSS protection
 * Phase 8.1 - Input Sanitization Audit Implementation
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
import validator from 'validator';

// HTML sanitization configuration
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOWED_URI_REGEXP: /^https?:\/\/|^\/|^#/,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
};

const STRICT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
};

/**
 * Core sanitization functions
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content allowing safe tags
   */
  static sanitizeHTML(input: string, strict = false): string {
    if (!input || typeof input !== 'string') return '';
    
    const config = strict ? STRICT_SANITIZE_CONFIG : SANITIZE_CONFIG;
    return DOMPurify.sanitize(input, config);
  }

  /**
   * Sanitize plain text - remove all HTML/XML tags
   */
  static sanitizePlainText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[#\w\d]+;/g, '') // Remove HTML entities
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/data:/gi, '') // Remove data: protocols
      .replace(/vbscript:/gi, '') // Remove vbscript: protocols
      .trim();
  }

  /**
   * Sanitize SQL input - escape dangerous characters
   */
  static sanitizeSQL(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/'/g, "''") // Escape single quotes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comment start
      .replace(/\*\//g, '') // Remove block comment end
      .replace(/xp_/gi, '') // Remove extended stored procedures
      .replace(/sp_/gi, '') // Remove stored procedures
      .trim();
  }

  /**
   * Sanitize JavaScript/JSON input
   */
  static sanitizeJavaScript(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/eval\s*\(/gi, '') // Remove eval calls
      .replace(/function\s*\(/gi, '') // Remove function declarations
      .replace(/setTimeout\s*\(/gi, '') // Remove setTimeout
      .replace(/setInterval\s*\(/gi, '') // Remove setInterval
      .replace(/new\s+Function/gi, '') // Remove Function constructor
      .replace(/document\./gi, '') // Remove document references
      .replace(/window\./gi, '') // Remove window references
      .replace(/alert\s*\(/gi, '') // Remove alert calls
      .replace(/confirm\s*\(/gi, '') // Remove confirm calls
      .replace(/prompt\s*\(/gi, '') // Remove prompt calls
      .trim();
  }

  /**
   * Sanitize file names for upload security
   */
  static sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') return '';
    
    return fileName
      .replace(/[^\w\-_.]/g, '') // Keep only word chars, hyphens, underscores, dots
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .substring(0, 255) // Limit length
      .toLowerCase();
  }

  /**
   * Sanitize URLs and prevent protocol-based attacks
   */
  static sanitizeURL(url: string, allowedProtocols = ['http', 'https']): string {
    if (!url || typeof url !== 'string') return '';
    
    try {
      const urlObj = new URL(url);
      
      // Check if protocol is allowed
      const protocol = urlObj.protocol.replace(':', '');
      if (!allowedProtocols.includes(protocol)) {
        return '';
      }
      
      // Additional security checks
      if (urlObj.hostname === 'localhost' || urlObj.hostname.includes('127.0.0.1')) {
        return '';
      }
      
      return urlObj.toString();
    } catch {
      return '';
    }
  }

  /**
   * Sanitize email addresses
   */
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    
    const sanitized = email.toLowerCase().trim();
    return validator.isEmail(sanitized) ? sanitized : '';
  }

  /**
   * Sanitize phone numbers
   */
  static sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';
    
    return phone.replace(/[^\d+\-\(\)\s]/g, '').trim();
  }

  /**
   * Deep sanitize objects recursively
   */
  static sanitizeObject<T extends Record<string, any>>(
    obj: T,
    options: SanitizeOptions = {}
  ): T {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = { ...obj } as any;
    
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value, options);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' 
            ? this.sanitizeString(item, options)
            : typeof item === 'object' 
              ? this.sanitizeObject(item, options)
              : item
        );
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value, options);
      }
    }
    
    return sanitized as T;
  }

  /**
   * Generic string sanitization with options
   */
  static sanitizeString(input: string, options: SanitizeOptions = {}): string {
    if (!input || typeof input !== 'string') return '';
    
    let sanitized = input;
    
    // Apply sanitization based on options
    if (options.html !== false) {
      sanitized = this.sanitizeHTML(sanitized, options.strict);
    }
    
    if (options.sql !== false) {
      sanitized = this.sanitizeSQL(sanitized);
    }
    
    if (options.javascript !== false) {
      sanitized = this.sanitizeJavaScript(sanitized);
    }
    
    // Limit length
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    return sanitized.trim();
  }
}

/**
 * Enhanced Zod schemas with built-in sanitization
 */
export const createSanitizedSchema = <T>(baseSchema: z.ZodSchema<T>) => {
  return baseSchema.transform(data => {
    if (typeof data === 'string') {
      return InputSanitizer.sanitizeString(data);
    }
    if (typeof data === 'object' && data !== null) {
      return InputSanitizer.sanitizeObject(data);
    }
    return data;
  });
};

/**
 * Sanitization options interface
 */
export interface SanitizeOptions {
  html?: boolean;
  sql?: boolean;
  javascript?: boolean;
  strict?: boolean;
  maxLength?: number;
}

/**
 * XSS Protection utilities
 */
export class XSSProtection {
  /**
   * Check if string contains potential XSS vectors
   */
  static containsXSS(input: string): boolean {
    if (!input || typeof input !== 'string') return false;
    
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi, // Event handlers like onclick=
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*rel\s*=\s*["']?stylesheet/gi,
      /<meta[^>]*http-equiv/gi,
      /expression\s*\(/gi, // CSS expressions
      /url\s*\(\s*["']?javascript:/gi,
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate Content Security Policy compliance
   */
  static validateCSPCompliance(content: string): {
    compliant: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    
    // Check for inline scripts
    if (/<script[^>]*>/gi.test(content)) {
      violations.push('Inline script tags detected');
    }
    
    // Check for inline styles
    if (/style\s*=/gi.test(content)) {
      violations.push('Inline styles detected');
    }
    
    // Check for event handlers
    if (/on\w+\s*=/gi.test(content)) {
      violations.push('Inline event handlers detected');
    }
    
    // Check for javascript: URLs
    if (/javascript:/gi.test(content)) {
      violations.push('JavaScript URLs detected');
    }
    
    return {
      compliant: violations.length === 0,
      violations,
    };
  }
}

/**
 * File upload sanitization
 */
export class FileUploadSanitizer {
  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
  ];

  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.app', '.deb', '.pkg', '.dmg', '.rpm', '.run', '.msi', '.php', '.asp',
    '.jsp', '.py', '.rb', '.pl', '.sh', '.bash', '.csh', '.fish', '.zsh',
  ];

  /**
   * Validate and sanitize file upload
   */
  static validateFile(file: {
    name: string;
    type: string;
    size: number;
  }, options: FileValidationOptions = {}): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate file name
    const sanitizedName = InputSanitizer.sanitizeFileName(file.name);
    if (!sanitizedName) {
      errors.push('Invalid file name');
    }

    // Check file extension
    const extension = sanitizedName.toLowerCase().substring(sanitizedName.lastIndexOf('.'));
    if (this.DANGEROUS_EXTENSIONS.includes(extension)) {
      errors.push(`Dangerous file extension: ${extension}`);
    }

    // Validate MIME type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      errors.push(`File type not allowed: ${file.type}`);
    }

    // Validate file size
    const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
    if (file.size > maxSize) {
      errors.push(`File too large: ${file.size} bytes (max: ${maxSize})`);
    }

    // Check for empty files
    if (file.size === 0) {
      warnings.push('Empty file detected');
    }

    // Image-specific validation
    if (this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      // Additional image validation could go here
      if (file.size > 10 * 1024 * 1024) { // 10MB for images
        warnings.push('Large image file - consider compression');
      }
    }

    return {
      isValid: errors.length === 0,
      sanitizedName,
      errors,
      warnings,
    };
  }

  /**
   * Generate secure file name with timestamp
   */
  static generateSecureFileName(originalName: string, userId?: string): string {
    const sanitized = this.sanitizeFileName(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    
    const prefix = userId ? `user_${userId}` : 'upload';
    return `${prefix}_${timestamp}_${random}${extension}`;
  }

  private static sanitizeFileName(fileName: string): string {
    return InputSanitizer.sanitizeFileName(fileName);
  }
}

/**
 * Form data sanitization middleware
 */
export const sanitizeFormData = (formData: FormData): FormData => {
  const sanitized = new FormData();
  
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      sanitized.append(key, InputSanitizer.sanitizeString(value));
    } else if (value instanceof File) {
      const validation = FileUploadSanitizer.validateFile({
        name: value.name,
        type: value.type,
        size: value.size,
      });
      
      if (validation.isValid) {
        const newFile = new File([value], validation.sanitizedName, {
          type: value.type,
          lastModified: value.lastModified,
        });
        sanitized.append(key, newFile);
      }
    } else {
      sanitized.append(key, value);
    }
  }
  
  return sanitized;
};

/**
 * JSON sanitization for API requests
 */
export const sanitizeJSON = (obj: any): any => {
  if (typeof obj === 'string') {
    return InputSanitizer.sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJSON);
  }
  
  if (obj && typeof obj === 'object') {
    return InputSanitizer.sanitizeObject(obj);
  }
  
  return obj;
};

/**
 * Request sanitization middleware for Next.js
 */
export const requestSanitizationMiddleware = async (
  request: Request
): Promise<Request> => {
  // Clone the request to avoid modifying the original
  const clonedRequest = request.clone();
  
  // Sanitize headers
  const sanitizedHeaders = new Headers();
  for (const [key, value] of clonedRequest.headers.entries()) {
    sanitizedHeaders.set(key, InputSanitizer.sanitizePlainText(value));
  }
  
  // Sanitize body if present
  let sanitizedBody: string | FormData | null = null;
  
  const contentType = clonedRequest.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    try {
      const body = await clonedRequest.json();
      sanitizedBody = JSON.stringify(sanitizeJSON(body));
    } catch {
      // Invalid JSON, skip sanitization
    }
  } else if (contentType?.includes('application/x-www-form-urlencoded')) {
    try {
      const formData = await clonedRequest.formData();
      sanitizedBody = sanitizeFormData(formData);
    } catch {
      // Invalid form data, skip sanitization
    }
  }
  
  return new Request(clonedRequest.url, {
    method: clonedRequest.method,
    headers: sanitizedHeaders,
    body: sanitizedBody,
  });
};

// Type definitions
export interface FileValidationOptions {
  allowedTypes?: string[];
  maxSize?: number;
}

export interface FileValidationResult {
  isValid: boolean;
  sanitizedName: string;
  errors: string[];
  warnings: string[];
}

// Export commonly used sanitization functions
export const sanitize = {
  html: InputSanitizer.sanitizeHTML,
  text: InputSanitizer.sanitizePlainText,
  sql: InputSanitizer.sanitizeSQL,
  js: InputSanitizer.sanitizeJavaScript,
  url: InputSanitizer.sanitizeURL,
  email: InputSanitizer.sanitizeEmail,
  fileName: InputSanitizer.sanitizeFileName,
  object: InputSanitizer.sanitizeObject,
};

export const detectXSS = XSSProtection.containsXSS;
export const validateCSP = XSSProtection.validateCSPCompliance;