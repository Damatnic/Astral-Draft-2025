/**
 * Enhanced Analytics Dashboard Component
 * Comprehensive analytics dashboard with performance metrics, predictive insights, and advanced visualization
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, Brain, 
  Calendar, Download, RefreshCw,
  BarChart3, LineChart as LineChartIcon,
  RadarIcon, AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/ShadcnTabs';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useEnhancedAnalytics } from '../../hooks/useEnhancedAnalytics';

interface EnhancedAnalyticsDashboardProps {
  className?: string;
  onExport?: (data: any) => void;
}

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  format: 'percentage' | 'number' | 'currency' | 'time';
  color: string;
  description?: string;
}

interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'pie' | 'radar' | 'scatter';
  title: string;
  data: any[];
  config: any;
}

const EnhancedAnalyticsDashboard: React.FC<EnhancedAnalyticsDashboardProps> = ({
  className = '',
  onExport
}) => {
  const { isAuthenticated } = useAuth();
  const {
    report,
    metrics,
    insights,
    charts,
    loading,
    error,
    refresh,
    exportData,
    setTimeRange,
    timeRange
  } = useEnhancedAnalytics({ timeRange: 7, autoRefresh: false });

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const exportAnalytics = async () => {
    try {
      const data = await exportData('json');
      
      if (onExport) {
        onExport(JSON.parse(data));
      } else {
        // Default export as JSON
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeRange}d-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export analytics:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`enhanced-analytics-dashboard ${className}`}>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access your analytics dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`enhanced-analytics-dashboard ${className}`}>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`enhanced-analytics-dashboard ${className}`}>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access your analytics dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`enhanced-analytics-dashboard space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive performance insights and predictive analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={timeRange} 
            onChange={(e: any) => setTimeRange(parseInt(e.target.value))}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>24 Hours</option>
            <option value={7}>7 Days</option>
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
            <option value={365}>1 Year</option>
          </select>
          
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={exportAnalytics}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main content */}
      {!loading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="comparative">Comparative</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metrics && [
                {
                  id: 'accuracy',
                  name: 'Overall Accuracy',
                  value: metrics.accuracy.overall * 100,
                  change: metrics.accuracy.trend * 100,
                  trend: metrics.accuracy.trend >= 0 ? 'up' : 'down',
                  format: 'percentage',
                  color: '#10B981',
                  description: 'Overall prediction accuracy across all categories'
                },
                {
                  id: 'win_rate',
                  name: 'User Win Rate',
                  value: metrics.performance.userWinRate * 100,
                  change: 0,
                  trend: 'stable',
                  format: 'percentage',
                  color: '#3B82F6',
                  description: 'Your success rate against Oracle predictions'
                },
                {
                  id: 'predictions',
                  name: 'Total Predictions',
                  value: metrics.engagement.totalPredictions,
                  change: 0,
                  trend: 'stable',
                  format: 'number',
                  color: '#8B5CF6',
                  description: 'Total number of predictions made'
                },
                {
                  id: 'confidence',
                  name: 'Confidence Correlation',
                  value: metrics.performance.confidenceCorrelation * 100,
                  change: 0,
                  trend: 'stable',
                  format: 'percentage',
                  color: '#F59E0B',
                  description: 'How well confidence levels predict actual outcomes'
                },
                {
                  id: 'consistency',
                  name: 'Weekly Consistency',
                  value: metrics.accuracy.weeklyConsistency,
                  change: 0,
                  trend: 'stable',
                  format: 'percentage',
                  color: '#06B6D4',
                  description: 'Consistency of performance across weeks'
                },
                {
                  id: 'percentile',
                  name: 'User Percentile',
                  value: metrics.comparative.userPercentile,
                  change: 0,
                  trend: 'stable',
                  format: 'number',
                  color: '#EF4444',
                  description: 'Your ranking compared to other users'
                }
              ].map((metric) => (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">{metric.name}</h3>
                        <div className={`flex items-center text-sm ${
                          metric.trend === 'up' ? 'text-green-600' : 
                          metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {metric.trend === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
                          {metric.trend === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
                          {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="flex items-center mb-3">
                        <span className="text-2xl font-bold text-gray-900">
                          {metric.format === 'percentage' ? 
                            `${metric.value.toFixed(1)}%` : 
                            metric.value.toLocaleString()
                          }
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, metric.value)}%`,
                            backgroundColor: metric.color
                          }}
                        />
                      </div>

                      {metric.description && (
                        <p className="text-xs text-gray-500">{metric.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {charts.map((chart, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {chart.type === 'line' && <LineChartIcon className="w-5 h-5" />}
                        {chart.type === 'bar' && <BarChart3 className="w-5 h-5" />}
                        {chart.type === 'radar' && <RadarIcon className="w-5 h-5" />}
                        {chart.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          {chart.type === 'line' ? (
                            <LineChart data={chart.data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey={chart.config.xAxisKey} />
                              <YAxis />
                              <Tooltip />
                              <Line 
                                type="monotone" 
                                dataKey={chart.config.yAxisKey}
                                stroke={chart.config.color}
                                strokeWidth={2}
                                dot={{ fill: chart.config.color, strokeWidth: 2, r: 4 }}
                              />
                            </LineChart>
                          ) : chart.type === 'bar' ? (
                            <BarChart data={chart.data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey={chart.config.xAxisKey} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey={chart.config.yAxisKey} fill="#3B82F6" />
                            </BarChart>
                          ) : chart.type === 'radar' ? (
                            <RadarChart data={chart.data}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey={chart.config.angleKey} />
                              <PolarRadiusAxis />
                              <Radar
                                name="Performance"
                                dataKey={chart.config.radiusKey}
                                stroke={chart.config.color}
                                fill={chart.config.color}
                                fillOpacity={0.3}
                              />
                              <Tooltip />
                            </RadarChart>
                          ) : (
                            <div>Chart type not supported</div>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance details */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {metrics && Object.entries(metrics.accuracy.byCategory).map(([type, accuracy]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${accuracy * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12">
                          {(accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Weekly consistency */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Performance Consistency</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Simple placeholder for weekly performance chart */}
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Weekly performance chart will be displayed here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5" />
                          {insight.title}
                        </CardTitle>
                        <Badge
                          variant={insight.confidence > 80 ? 'default' : 'secondary'}
                        >
                          {insight.confidence}% confident
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">Impact:</span>
                          <Badge variant="outline" className={
                            insight.impact === 'high' ? 'border-red-300 text-red-700' :
                            insight.impact === 'medium' ? 'border-yellow-300 text-yellow-700' :
                            'border-green-300 text-green-700'
                          }>
                            {insight.impact}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{insight.timeframe}</span>
                        </div>
                      </div>

                      {insight.recommendations && insight.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {insight.recommendations.map((rec: string, i: number) => (
                              <li key={`rec-${insight.id}-${i}`} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insight.data?.potentialGain && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Potential Improvement: {insight.data.potentialGain}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Comparative Tab */}
          <TabsContent value="comparative" className="space-y-6">
            {metrics && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Accuracy Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Your Performance</span>
                        <span className="font-medium">
                          {(metrics.accuracy.overall * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Community Average</span>
                        <span className="font-medium">65.0%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Top 10%</span>
                        <span className="font-medium">85.0%</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Your Percentile</span>
                        <Badge variant={metrics.comparative.userPercentile > 75 ? 'default' : 'secondary'}>
                          {metrics.comparative.userPercentile}th
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400"
                          style={{ width: `${metrics.comparative.userPercentile}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Win Rate</span>
                        <span className="font-medium">
                          {(metrics.performance.userWinRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Confidence Correlation</span>
                        <span className="font-medium">
                          {(metrics.performance.confidenceCorrelation * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Weekly Consistency</span>
                        <span className="font-medium">
                          {metrics.accuracy.weeklyConsistency.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Predictions</span>
                        <span className="font-medium">{metrics.engagement.totalPredictions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Confidence</span>
                        <span className="font-medium">
                          {(metrics.engagement.averageConfidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Streak</span>
                        <span className="font-medium">{metrics.engagement.streakData.current}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default EnhancedAnalyticsDashboard;
