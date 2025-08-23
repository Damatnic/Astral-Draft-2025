/**
 * @fileoverview Security monitoring dashboard component
 * Phase 8 - Security dashboard for monitoring threats and events
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SecurityEvent {
  timestamp: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  context?: {
    ip?: string;
    userAgent?: string;
    userId?: string;
    path?: string;
    method?: string;
  };
}

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  recentEvents: number;
  topThreats: Array<{ type: string; count: number }>;
}

interface APIKeyStats {
  total: number;
  needingRotation: number;
  expiringSoon: number;
}

interface DatabaseStats {
  totalQueries: number;
  suspiciousQueries: number;
  recentQueries: number;
  suspiciousPercentage: number;
}

export const SecurityDashboard: React.FC = () => {
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalEvents: 0,
    recentEvents: 0,
    topThreats: [],
  });

  const [apiKeyStats, setApiKeyStats] = useState<APIKeyStats>({
    total: 0,
    needingRotation: 0,
    expiringSoon: 0,
  });

  const [databaseStats, setDatabaseStats] = useState<DatabaseStats>({
    totalQueries: 0,
    suspiciousQueries: 0,
    recentQueries: 0,
    suspiciousPercentage: 0,
  });

  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch security data
  const fetchSecurityData = async () => {
    try {
      // In a real implementation, these would be API calls
      // const response = await fetch('/api/admin/security/stats');
      // const data = await response.json();
      
      // Mock data for demonstration
      setSecurityStats({
        totalEvents: 1247,
        criticalEvents: 3,
        recentEvents: 45,
        topThreats: [
          { type: 'RATE_LIMIT_EXCEEDED', count: 523 },
          { type: 'XSS_ATTEMPT', count: 234 },
          { type: 'SQL_INJECTION_ATTEMPT', count: 89 },
          { type: 'INVALID_API_KEY', count: 156 },
          { type: 'CSRF_VIOLATION', count: 67 },
        ],
      });

      setApiKeyStats({
        total: 156,
        needingRotation: 12,
        expiringSoon: 8,
      });

      setDatabaseStats({
        totalQueries: 45623,
        suspiciousQueries: 23,
        recentQueries: 1234,
        suspiciousPercentage: 0.05,
      });

      setRecentEvents([
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
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSecurityData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        <div className="flex space-x-4">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'secondary'}
            size="sm"
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={fetchSecurityData} variant="outline" size="sm">
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {securityStats.criticalEvents > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Critical Security Alert
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{securityStats.criticalEvents} critical security events detected in the last hour.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Events</div>
                <div className="text-2xl font-bold text-gray-900">{securityStats.totalEvents.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Critical Events</div>
                <div className="text-2xl font-bold text-red-600">{securityStats.criticalEvents}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">API Keys</div>
                <div className="text-2xl font-bold text-gray-900">{apiKeyStats.total}</div>
                {apiKeyStats.needingRotation > 0 && (
                  <div className="text-xs text-yellow-600">{apiKeyStats.needingRotation} need rotation</div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">DB Queries</div>
                <div className="text-2xl font-bold text-gray-900">{databaseStats.totalQueries.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{databaseStats.suspiciousPercentage}% suspicious</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Threats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Security Threats</h3>
            <div className="space-y-3">
              {securityStats.topThreats.map((threat, index) => (
                <div key={threat.type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">
                      {threat.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <Badge variant="secondary">{threat.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Events */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Security Events</h3>
            <div className="space-y-4">
              {recentEvents.map((event, index) => (
                <div key={index} className="border-l-4 border-gray-200 pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {event.eventType.replace(/_/g, ' ')}
                    </span>
                    <Badge className={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {formatTimestamp(event.timestamp)}
                  </div>
                  {event.context?.ip && (
                    <div className="text-xs text-gray-600">
                      IP: {event.context.ip} | Path: {event.context.path}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Security Controls */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Rate Limiting</h4>
              <div className="text-sm text-gray-600 mb-3">
                API rate limits are active and blocking excessive requests.
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-green-600">Active</span>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">CSRF Protection</h4>
              <div className="text-sm text-gray-600 mb-3">
                Cross-site request forgery protection is enabled.
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-green-600">Active</span>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Input Sanitization</h4>
              <div className="text-sm text-gray-600 mb-3">
                All user inputs are sanitized for XSS and injection attacks.
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              Export Security Report
            </Button>
            <Button variant="outline" size="sm">
              Rotate API Keys
            </Button>
            <Button variant="outline" size="sm">
              Update Security Rules
            </Button>
            <Button variant="outline" size="sm">
              View Audit Logs
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SecurityDashboard;