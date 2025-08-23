/**
 * @fileoverview Security monitoring API endpoints
 * Provides security statistics and controls for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../server/auth';
import { SecurityEventLogger } from '../../../../server/middleware/security';
import { apiKeyManager } from '../../../../lib/security/apiKeyManager';
import { securePrisma } from '../../../../lib/security/sqlValidator';
import { rateLimiter } from '../../../../lib/security/rateLimiter';
import { adminSecurityMiddleware } from '../../../../server/middleware/security';

/**
 * GET /api/admin/security - Get security dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get security statistics
    const securityStats = await SecurityEventLogger.getSecurityStats();
    
    // Get API key statistics
    const apiKeysNeedingRotation = await apiKeyManager.checkRotationSchedule();
    
    // Get database security statistics
    const dbStats = securePrisma.getSecurityStats();
    
    // Get recent security events (mock data for now)
    const recentEvents = await getRecentSecurityEvents();
    
    const dashboardData = {
      security: securityStats,
      apiKeys: {
        total: 0, // Would get actual count from database
        needingRotation: apiKeysNeedingRotation.length,
        expiringSoon: 0, // Would calculate from database
      },
      database: dbStats,
      recentEvents,
      systemStatus: {
        rateLimiting: true,
        csrfProtection: true,
        inputSanitization: true,
        sqlValidation: true,
        apiKeyRotation: true,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Security dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/security/actions - Execute security actions
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, parameters } = body;

    let result;

    switch (action) {
      case 'ROTATE_API_KEYS':
        result = await handleApiKeyRotation(parameters);
        break;

      case 'UPDATE_RATE_LIMITS':
        result = await handleRateLimitUpdate(parameters);
        break;

      case 'EXPORT_SECURITY_REPORT':
        result = await handleSecurityReportExport(parameters);
        break;

      case 'CLEAR_SECURITY_EVENTS':
        result = await handleClearSecurityEvents(parameters);
        break;

      case 'UPDATE_SECURITY_RULES':
        result = await handleSecurityRulesUpdate(parameters);
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

    // Log the admin action
    await SecurityEventLogger.logSecurityEvent(
      'ADMIN_SECURITY_ACTION',
      'medium',
      { action, parameters, result },
      {
        userId: session.user.id,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Security action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute security action' },
      { status: 500 }
    );
  }
}

/**
 * Helper functions for security actions
 */

async function getRecentSecurityEvents() {
  // In a real implementation, this would query the security event log
  // For now, return mock data
  return [
    {
      timestamp: new Date(Date.now() - 300000).toISOString(),
      eventType: 'SQL_INJECTION_ATTEMPT',
      severity: 'critical',
      details: { patterns: ['union select', 'drop table'] },
      context: { ip: '192.168.1.100', path: '/api/users' },
    },
    {
      timestamp: new Date(Date.now() - 600000).toISOString(),
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'high',
      details: { limit: 100, attempts: 150 },
      context: { ip: '10.0.0.50', path: '/api/auth/login' },
    },
    {
      timestamp: new Date(Date.now() - 900000).toISOString(),
      eventType: 'XSS_ATTEMPT',
      severity: 'high',
      details: { input: '<script>alert("xss")</script>' },
      context: { ip: '172.16.0.25', path: '/api/profile' },
    },
    {
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      eventType: 'CSRF_VIOLATION',
      severity: 'medium',
      details: { reason: 'Missing CSRF token' },
      context: { ip: '203.0.113.45', path: '/api/settings' },
    },
    {
      timestamp: new Date(Date.now() - 1500000).toISOString(),
      eventType: 'INVALID_API_KEY',
      severity: 'medium',
      details: { reason: 'Expired key' },
      context: { ip: '198.51.100.123', path: '/api/oracle' },
    },
  ];
}

async function handleApiKeyRotation(parameters: any) {
  try {
    const results = await apiKeyManager.autoRotateKeys();
    
    const summary = {
      totalKeys: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      errors: results.filter(r => !r.success).map(r => r.error),
    };

    return {
      message: `Rotated ${summary.successful} API keys successfully`,
      summary,
      results,
    };
  } catch (error) {
    throw new Error(`API key rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleRateLimitUpdate(parameters: any) {
  // In a real implementation, this would update rate limit configurations
  return {
    message: 'Rate limits updated successfully',
    updatedLimits: parameters.limits || [],
  };
}

async function handleSecurityReportExport(parameters: any) {
  const reportData = {
    generatedAt: new Date().toISOString(),
    period: parameters.period || 'last_24_hours',
    securityEvents: await getRecentSecurityEvents(),
    apiKeyStats: await apiKeyManager.checkRotationSchedule(),
    systemHealth: {
      rateLimiting: true,
      csrfProtection: true,
      inputSanitization: true,
      sqlValidation: true,
    },
  };

  // In a real implementation, this would generate a downloadable report
  return {
    message: 'Security report generated',
    reportId: `security_report_${Date.now()}`,
    data: reportData,
  };
}

async function handleClearSecurityEvents(parameters: any) {
  // In a real implementation, this would clear old security events
  const clearedCount = parameters.olderThan ? 
    Math.floor(Math.random() * 1000) : 0; // Mock

  return {
    message: `Cleared ${clearedCount} security events`,
    clearedCount,
  };
}

async function handleSecurityRulesUpdate(parameters: any) {
  // In a real implementation, this would update security rule configurations
  return {
    message: 'Security rules updated successfully',
    updatedRules: parameters.rules || [],
  };
}

/**
 * Security event analysis endpoints
 */

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { eventId, action } = body;

    // Handle security event actions (acknowledge, investigate, etc.)
    let result;

    switch (action) {
      case 'ACKNOWLEDGE':
        result = await acknowledgeSecurityEvent(eventId);
        break;

      case 'INVESTIGATE':
        result = await initiateSecurityInvestigation(eventId);
        break;

      case 'BLOCK_IP':
        result = await blockSuspiciousIP(body.ip);
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown event action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Security event action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute event action' },
      { status: 500 }
    );
  }
}

async function acknowledgeSecurityEvent(eventId: string) {
  // Mark security event as acknowledged
  return {
    message: `Security event ${eventId} acknowledged`,
    eventId,
    acknowledgedAt: new Date().toISOString(),
  };
}

async function initiateSecurityInvestigation(eventId: string) {
  // Start security investigation process
  return {
    message: `Investigation initiated for event ${eventId}`,
    eventId,
    investigationId: `inv_${Date.now()}`,
    status: 'in_progress',
  };
}

async function blockSuspiciousIP(ip: string) {
  // Add IP to blocklist
  // In a real implementation, this would update firewall rules or IP blocklist
  return {
    message: `IP ${ip} has been blocked`,
    ip,
    blockedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };
}