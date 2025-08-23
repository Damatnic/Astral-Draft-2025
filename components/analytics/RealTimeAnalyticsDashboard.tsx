/**
 * Real-Time Analytics Dashboard
 * Advanced analytics dashboard with real-time metrics, predictive insights, and comprehensive reporting
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Eye, Download, 
  RefreshCw, AlertTriangle, Lightbulb, Play, Pause
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { enhancedAnalyticsService, type RealTimeMetrics, type PredictiveInsight } from '../../services/enhancedAnalyticsService';

// WebSocket hook with basic implementation for demo
const useWebSocket = (url: string, options: any = {}) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastMessage, setLastMessage] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    // Mock connection for demo
    setIsConnected(true);
    
    // Simulate periodic messages
    const interval = setInterval(() => {
      setLastMessage(JSON.stringify({
        type: 'metrics_update',
        payload: { timestamp: new Date().toISOString() }
      }));
    }, 30000);
    
    return () => clearInterval(interval);
  }, [url]);
  
  return {
    isConnected,
    lastMessage,
    sendMessage: (message: string) => console.log('Sending:', message),
    connect: () => setIsConnected(true),
    disconnect: () => setIsConnected(false),
    reconnect: () => setIsConnected(true)
  };
};

interface DashboardState {
  isRealTime: boolean;
  selectedTimeframe: '1h' | '24h' | '7d' | '30d' | 'all';
  selectedMetrics: string[];
  alertsEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

const COLORS = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',
  gradient: ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626']
};

const RealTimeAnalyticsDashboard: React.FC = () => {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy > 75) return COLORS.success;
    if (accuracy > 60) return COLORS.warning;
    return COLORS.danger;
  };

  const getInsightBorderColor = (type: string) => {
    if (type === 'opportunity') return 'border-green-500 bg-green-50';
    if (type === 'warning') return 'border-yellow-500 bg-yellow-50';
    if (type === 'achievement') return 'border-blue-500 bg-blue-50';
    return 'border-purple-500 bg-purple-50';
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'bg-red-100 text-red-800';
    if (impact === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<DashboardState>({
    isRealTime: true,
    selectedTimeframe: '24h',
    selectedMetrics: ['accuracy', 'predictions', 'users', 'performance'],
    alertsEnabled: true,
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket('/ws/analytics', {
    enabled: state.isRealTime,
    reconnectInterval: 5000
  });

  // Auto-refresh interval
  useEffect(() => {
    if (!state.autoRefresh) return;

    const interval = setInterval(() => {
      loadAnalyticsData();
    }, state.refreshInterval);

    return () => clearInterval(interval);
  }, [state.autoRefresh, state.refreshInterval]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage && state.isRealTime) {
      try {
        const data = JSON.parse(lastMessage);
        if (data.type === 'metrics_update') {
          updateMetrics(data.payload);
        } else if (data.type === 'insight_generated') {
          addNewInsight(data.payload);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage, state.isRealTime]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load real-time metrics
      const realTimeData = await enhancedAnalyticsService.getRealTimeMetrics(state.selectedTimeframe);
      setMetrics(realTimeData);

      // Load predictive insights
      const insights = await enhancedAnalyticsService.getPredictiveInsights(state.selectedTimeframe);
      setPredictiveInsights(insights);

    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      
      // Use mock data for demo
      setMetrics(generateMockRealTimeMetrics());
      setPredictiveInsights(generateMockPredictiveInsights());
    } finally {
      setLoading(false);
    }
  }, [state.selectedTimeframe]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const updateMetrics = useCallback((update: Partial<RealTimeMetrics>) => {
    setMetrics(prev => prev ? { ...prev, ...update } : null);
  }, []);

  const addNewInsight = useCallback((insight: PredictiveInsight) => {
    setPredictiveInsights(prev => [insight, ...prev.slice(0, 9)]);
  }, []);

  const handleStateChange = (updates: Partial<DashboardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const generateReport = async () => {
    try {
      const report = await enhancedAnalyticsService.generateAnalyticsReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  // Memoized calculations
  const accuracyTrend = useMemo(() => {
    if (!metrics) return [];
    return metrics.accuracy.predictions.slice(-24).map((pred, index) => ({
      time: `${23 - index}h ago`,
      accuracy: pred.accuracy,
      confidence: pred.confidence
    }));
  }, [metrics]);

  const performanceIndicators = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        label: 'Accuracy',
        value: `${metrics.accuracy.current.toFixed(1)}%`,
        change: metrics.accuracy.change24h,
        trend: metrics.accuracy.trend,
        color: getAccuracyColor(metrics.accuracy.current)
      },
      {
        label: 'Active Users',
        value: metrics.users.active.toLocaleString(),
        change: metrics.users.newToday,
        trend: 'up' as const,
        color: COLORS.info
      },
      {
        label: 'Success Rate',
        value: `${metrics.predictions.successRate.toFixed(1)}%`,
        change: 0,
        trend: 'stable' as const,
        color: COLORS.primary
      },
      {
        label: 'Response Time',
        value: `${metrics.performance.responseTime}ms`,
        change: -5,
        trend: 'up' as const,
        color: metrics.performance.responseTime < 200 ? COLORS.success : COLORS.warning
      }
    ];
  }, [metrics]);

  const generateMockRealTimeMetrics = (): RealTimeMetrics => ({
    timestamp: new Date().toISOString(),
    accuracy: {
      current: 78.5,
      change24h: 2.3,
      trend: 'up',
      predictions: Array.from({ length: 24 }, (_, i) => ({
        id: `pred-${i}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        accuracy: 70 + Math.random() * 20,
        confidence: 60 + Math.random() * 40,
        type: ['PLAYER_PERFORMANCE', 'GAME_OUTCOME', 'WEEKLY_SCORING'][Math.floor(Math.random() * 3)]
      }))
    },
    predictions: {
      total: 1247,
      active: 89,
      resolved: 1158,
      avgConfidence: 74.2,
      successRate: 68.7
    },
    users: {
      active: 342,
      newToday: 28,
      totalPredictions: 5640,
      beatOracleRate: 42.1
    },
    performance: {
      responseTime: 145,
      uptime: 99.7,
      errorRate: 0.3,
      throughput: 150
    },
    insights: [
      {
        id: 'insight-1',
        type: 'opportunity',
        title: 'Accuracy Improvement Opportunity',
        description: 'Player performance predictions show 15% better accuracy during prime time hours',
        confidence: 87,
        impact: 'high',
        actionable: true
      },
      {
        id: 'insight-2',
        type: 'trend',
        title: 'User Engagement Trending Up',
        description: 'New user retention increased by 23% this week',
        confidence: 92,
        impact: 'medium',
        actionable: false
      }
    ]
  });

  const generateMockPredictiveInsights = (): PredictiveInsight[] => [
    {
      id: 'forecast-1',
      type: 'trend',
      title: 'Accuracy Forecast: Next 7 Days',
      description: 'Model predicts 3-5% accuracy improvement based on historical patterns',
      confidence: 84,
      timeframe: '7d',
      actionable: true,
      impact: 'medium',
      recommendations: [
        'Focus on player performance predictions during evening hours',
        'Implement confidence calibration for high-stakes games'
      ],
      data: {
        currentAccuracy: 78.5,
        predicted: 82.1,
        trend: Array.from({ length: 7 }, (_, i) => ({
          timestamp: new Date(Date.now() + i * 86400000).toISOString(),
          value: 78.5 + (i * 0.6) + (Math.random() - 0.5) * 2,
          confidence: 84 - i * 2
        }))
      }
    }
  ];

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading real-time analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Real-Time Analytics Dashboard</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            <span>•</span>
            <span>Last updated: {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : 'Never'}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={state.selectedTimeframe}
            onChange={(e: any) => handleStateChange({ selectedTimeframe: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          
          <button
            onClick={() => handleStateChange({ isRealTime: !state.isRealTime })}
            className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              state.isRealTime 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {state.isRealTime ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {state.isRealTime ? 'Real-Time' : 'Paused'}
          </button>
          
          <button
            onClick={loadAnalyticsData}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={generateReport}
            className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceIndicators.map((indicator, index) => (
          <motion.div
            key={indicator.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{indicator.label}</p>
                    <p className="text-2xl font-bold" style={{ color: indicator.color }}>{indicator.value}</p>
                    {indicator.change !== 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {indicator.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm ${indicator.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {indicator.change > 0 ? '+' : ''}{indicator.change}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${indicator.color}20` }}>
                    <Activity className="h-6 w-6" style={{ color: indicator.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Real-Time Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Accuracy Trend (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={accuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="accuracy" 
                  fill={`${COLORS.primary}20`} 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  name="Accuracy %"
                />
                <Line 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke={COLORS.secondary} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Confidence %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Predictive Insights */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Predictive Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {predictiveInsights.slice(0, 3).map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{insight.timeframe} forecast</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Impact:</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          insight.impact === 'high' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {insight.impact === 'high' ? 'High' : 'Moderate'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Insights Feed */}
      {metrics?.insights && metrics.insights.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Real-Time Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${getInsightBorderColor(insight.type)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(insight.impact)}`}>
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{insight.confidence}% confidence</span>
                    {insight.actionable && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Actionable
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeAnalyticsDashboard;
