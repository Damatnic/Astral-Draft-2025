/**
 * Email logging and monitoring utilities
 */

import type { EmailTypeValue } from './index';

export interface EmailLog {
  id: string;
  type: EmailTypeValue;
  to: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complaint';
  messageId?: string;
  error?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface EmailMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  failureRate: number;
  bounceRate: number;
  complaintRate: number;
  recentFailures: EmailLog[];
}

/**
 * Email logging service for tracking email delivery and debugging
 */
export class EmailLogger {
  private logs: Map<string, EmailLog> = new Map();

  /**
   * Log an email sending attempt
   */
  logEmailSent(
    id: string,
    type: EmailTypeValue,
    to: string,
    messageId?: string,
    metadata?: Record<string, any>
  ): void {
    const log: EmailLog = {
      id,
      type,
      to,
      status: messageId ? 'sent' : 'pending',
      messageId,
      timestamp: new Date(),
      metadata,
    };

    this.logs.set(id, log);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Email ${log.status}: ${type} to ${to}`, {
        messageId,
        metadata: metadata ? Object.keys(metadata) : undefined,
      });
    }
  }

  /**
   * Log email delivery confirmation
   */
  logEmailDelivered(messageId: string): void {
    const log = Array.from(this.logs.values()).find(l => l.messageId === messageId);
    if (log) {
      log.status = 'delivered';
      console.log(`✅ Email delivered: ${log.type} to ${log.to}`);
    }
  }

  /**
   * Log email failure
   */
  logEmailFailed(
    idOrMessageId: string,
    error: string,
    isMessageId = false
  ): void {
    let log: EmailLog | undefined;
    
    if (isMessageId) {
      log = Array.from(this.logs.values()).find(l => l.messageId === idOrMessageId);
    } else {
      log = this.logs.get(idOrMessageId);
    }

    if (log) {
      log.status = 'failed';
      log.error = error;
      console.error(`❌ Email failed: ${log.type} to ${log.to} - ${error}`);
    }
  }

  /**
   * Log email bounce
   */
  logEmailBounced(messageId: string, reason: string): void {
    const log = Array.from(this.logs.values()).find(l => l.messageId === messageId);
    if (log) {
      log.status = 'bounced';
      log.error = reason;
      console.warn(`⚠️ Email bounced: ${log.type} to ${log.to} - ${reason}`);
    }
  }

  /**
   * Log email complaint (spam report)
   */
  logEmailComplaint(messageId: string): void {
    const log = Array.from(this.logs.values()).find(l => l.messageId === messageId);
    if (log) {
      log.status = 'complaint';
      console.warn(`🚨 Email complaint: ${log.type} to ${log.to}`);
    }
  }

  /**
   * Get email metrics for monitoring
   */
  getMetrics(since?: Date): EmailMetrics {
    const logs = Array.from(this.logs.values());
    const filteredLogs = since 
      ? logs.filter(log => log.timestamp >= since)
      : logs;

    const totalSent = filteredLogs.filter(log => 
      ['sent', 'delivered', 'failed', 'bounced', 'complaint'].includes(log.status)
    ).length;

    const totalDelivered = filteredLogs.filter(log => log.status === 'delivered').length;
    const totalFailed = filteredLogs.filter(log => log.status === 'failed').length;
    const totalBounced = filteredLogs.filter(log => log.status === 'bounced').length;
    const totalComplaints = filteredLogs.filter(log => log.status === 'complaint').length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const failureRate = totalSent > 0 ? (totalFailed / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const complaintRate = totalSent > 0 ? (totalComplaints / totalSent) * 100 : 0;

    const recentFailures = filteredLogs
      .filter(log => log.status === 'failed')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalSent,
      totalDelivered,
      totalFailed,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      complaintRate: Math.round(complaintRate * 100) / 100,
      recentFailures,
    };
  }

  /**
   * Get logs for a specific email type
   */
  getLogsByType(type: EmailTypeValue, limit = 50): EmailLog[] {
    return Array.from(this.logs.values())
      .filter(log => log.type === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get logs for a specific recipient
   */
  getLogsByRecipient(email: string, limit = 50): EmailLog[] {
    return Array.from(this.logs.values())
      .filter(log => log.to === email)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear old logs to prevent memory leaks
   */
  clearOldLogs(olderThan: Date): number {
    const logsToDelete = Array.from(this.logs.entries())
      .filter(([_, log]) => log.timestamp < olderThan);

    logsToDelete.forEach(([id]) => this.logs.delete(id));

    console.log(`🧹 Cleared ${logsToDelete.length} old email logs`);
    return logsToDelete.length;
  }

  /**
   * Export logs for analysis
   */
  exportLogs(since?: Date): EmailLog[] {
    const logs = Array.from(this.logs.values());
    return since 
      ? logs.filter(log => log.timestamp >= since)
      : logs;
  }

  /**
   * Get log by message ID
   */
  getLogByMessageId(messageId: string): EmailLog | undefined {
    return Array.from(this.logs.values()).find(log => log.messageId === messageId);
  }

  /**
   * Get recent activity summary
   */
  getRecentActivity(hours = 24): {
    period: string;
    sent: number;
    delivered: number;
    failed: number;
    types: Record<EmailTypeValue, number>;
  } {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs = Array.from(this.logs.values())
      .filter(log => log.timestamp >= since);

    const sent = logs.filter(log => 
      ['sent', 'delivered', 'failed', 'bounced', 'complaint'].includes(log.status)
    ).length;

    const delivered = logs.filter(log => log.status === 'delivered').length;
    const failed = logs.filter(log => log.status === 'failed').length;

    const types = logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<EmailTypeValue, number>);

    return {
      period: `Last ${hours} hours`,
      sent,
      delivered,
      failed,
      types,
    };
  }
}

// Export singleton instance
export const emailLogger = new EmailLogger();

// Automatically clear old logs daily in production
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    emailLogger.clearOldLogs(thirtyDaysAgo);
  }, 24 * 60 * 60 * 1000); // Run daily
}

/**
 * Email error categories for better error handling
 */
export enum EmailErrorCategory {
  CONFIGURATION = 'configuration',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  INVALID_RECIPIENT = 'invalid_recipient',
  CONTENT = 'content',
  UNKNOWN = 'unknown',
}

/**
 * Enhanced error class for email operations
 */
export class EmailError extends Error {
  public category: EmailErrorCategory;
  public isRetryable: boolean;
  public metadata?: Record<string, any>;

  constructor(
    message: string,
    category: EmailErrorCategory = EmailErrorCategory.UNKNOWN,
    isRetryable = false,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'EmailError';
    this.category = category;
    this.isRetryable = isRetryable;
    this.metadata = metadata;
  }

  static fromResendError(error: any): EmailError {
    const message = error?.message || 'Unknown email service error';
    
    // Categorize common Resend errors
    if (message.includes('API key')) {
      return new EmailError(
        message,
        EmailErrorCategory.AUTHENTICATION,
        false,
        { originalError: error }
      );
    }
    
    if (message.includes('rate limit')) {
      return new EmailError(
        message,
        EmailErrorCategory.RATE_LIMIT,
        true,
        { originalError: error }
      );
    }
    
    if (message.includes('invalid email')) {
      return new EmailError(
        message,
        EmailErrorCategory.INVALID_RECIPIENT,
        false,
        { originalError: error }
      );
    }
    
    if (message.includes('network') || message.includes('timeout')) {
      return new EmailError(
        message,
        EmailErrorCategory.NETWORK,
        true,
        { originalError: error }
      );
    }

    return new EmailError(
      message,
      EmailErrorCategory.UNKNOWN,
      false,
      { originalError: error }
    );
  }
}

/**
 * Retry mechanism for email sending
 */
export class EmailRetryManager {
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;
  private retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    isRetryableError: (error: any) => boolean = () => false
  ): Promise<T> {
    const attempts = this.retryAttempts.get(operationId) || 0;

    try {
      const result = await operation();
      // Clear retry count on success
      this.retryAttempts.delete(operationId);
      return result;
    } catch (error) {
      const emailError = error instanceof EmailError 
        ? error 
        : EmailError.fromResendError(error);

      if (!emailError.isRetryable || attempts >= this.maxRetries) {
        this.retryAttempts.delete(operationId);
        throw emailError;
      }

      // Increment retry count
      this.retryAttempts.set(operationId, attempts + 1);
      
      // Wait before retry
      const delay = this.retryDelays[attempts] || this.retryDelays[this.retryDelays.length - 1];
      console.log(`🔄 Retrying email operation ${operationId} in ${delay}ms (attempt ${attempts + 1}/${this.maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.executeWithRetry(operation, operationId, isRetryableError);
    }
  }

  clearRetryHistory(operationId: string): void {
    this.retryAttempts.delete(operationId);
  }

  getRetryCount(operationId: string): number {
    return this.retryAttempts.get(operationId) || 0;
  }
}

// Export singleton instance
export const emailRetryManager = new EmailRetryManager();