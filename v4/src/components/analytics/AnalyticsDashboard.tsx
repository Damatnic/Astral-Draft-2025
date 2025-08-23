/**
 * Analytics Dashboard (Phase 11.4)
 * Internal dashboard for monitoring user behavior and key metrics
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { 
  BarChartIcon, 
  TrendingUpIcon, 
  UsersIcon, 
  ActivityIcon,
  EyeIcon,
  MousePointerClickIcon,
  ClockIcon,
  ZapIcon
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
    conversionRate: number;
  };
  userJourney: {
    signups: number;
    leagueCreations: number;
    draftsCompleted: number;
    tradesCompleted: number;
    premiumUpgrades: number;
  };
  topPages: Array<{
    page: string;
    views: number;
    uniqueViews: number;
    avgTime: number;
    bounceRate: number;
  }>;
  topEvents: Array<{
    event: string;
    count: number;
    percentage: number;
  }>;
  realTimeData: {
    activeUsers: number;
    topPages: string[];
    recentEvents: Array<{
      event: string;
      timestamp: string;
      userId?: string;
    }>;
  };
  conversionFunnel: Array<{
    step: string;
    users: number;
    conversionRate: number;
  }>;
  demographics: {
    devices: Array<{ device: string; percentage: number }>;
    browsers: Array<{ browser: string; percentage: number }>;
    locations: Array<{ country: string; percentage: number }>;
  };
}

// Mock data - in production, this would come from GA4 API
const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalUsers: 15420,
    activeUsers: 3240,
    newUsers: 520,
    sessions: 4850,
    pageViews: 18340,
    bounceRate: 0.34,
    avgSessionDuration: 425,
    conversionRate: 0.067
  },
  userJourney: {
    signups: 520,
    leagueCreations: 180,
    draftsCompleted: 145,
    tradesCompleted: 89,
    premiumUpgrades: 35
  },
  topPages: [
    { page: '/dashboard', views: 5430, uniqueViews: 3240, avgTime: 245, bounceRate: 0.28 },
    { page: '/draft', views: 3890, uniqueViews: 2100, avgTime: 520, bounceRate: 0.15 },
    { page: '/team', views: 3450, uniqueViews: 1980, avgTime: 180, bounceRate: 0.42 },
    { page: '/oracle', views: 2340, uniqueViews: 1450, avgTime: 320, bounceRate: 0.38 },
    { page: '/trades', views: 1890, uniqueViews: 1200, avgTime: 290, bounceRate: 0.35 }
  ],
  topEvents: [
    { event: 'lineup_set', count: 8420, percentage: 35.2 },
    { event: 'player_viewed', count: 6780, percentage: 28.4 },
    { event: 'oracle_prediction_viewed', count: 4320, percentage: 18.1 },
    { event: 'trade_analyzed', count: 2890, percentage: 12.1 },
    { event: 'draft_player_selected', count: 1520, percentage: 6.2 }
  ],
  realTimeData: {
    activeUsers: 147,
    topPages: ['/dashboard', '/draft/abc123/room', '/team/xyz789'],
    recentEvents: [
      { event: 'lineup_set', timestamp: '2 minutes ago', userId: 'user123' },
      { event: 'trade_proposed', timestamp: '3 minutes ago', userId: 'user456' },
      { event: 'oracle_prediction_viewed', timestamp: '4 minutes ago', userId: 'user789' },
      { event: 'draft_player_selected', timestamp: '5 minutes ago', userId: 'user101' },
      { event: 'league_joined', timestamp: '6 minutes ago', userId: 'user202' }
    ]
  },
  conversionFunnel: [
    { step: 'Visit Site', users: 10000, conversionRate: 1.0 },
    { step: 'Sign Up', users: 520, conversionRate: 0.052 },
    { step: 'Create/Join League', users: 380, conversionRate: 0.73 },
    { step: 'Complete Draft', users: 290, conversionRate: 0.76 },
    { step: 'Set Lineup', users: 245, conversionRate: 0.84 },
    { step: 'Premium Upgrade', users: 35, conversionRate: 0.14 }
  ],
  demographics: {
    devices: [
      { device: 'Desktop', percentage: 58.3 },
      { device: 'Mobile', percentage: 35.7 },
      { device: 'Tablet', percentage: 6.0 }
    ],
    browsers: [
      { browser: 'Chrome', percentage: 67.8 },
      { browser: 'Safari', percentage: 18.9 },
      { browser: 'Firefox', percentage: 8.4 },
      { browser: 'Edge', percentage: 4.9 }
    ],
    locations: [
      { country: 'United States', percentage: 72.4 },
      { country: 'Canada', percentage: 12.8 },
      { country: 'United Kingdom', percentage: 6.2 },
      { country: 'Australia', percentage: 4.1 },
      { country: 'Other', percentage: 4.5 }
    ]
  }
};

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>(mockAnalyticsData);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    // In production, fetch real analytics data based on timeRange
    const fetchAnalyticsData = async () => {
      // Simulate API call
      setTimeout(() => {
        setData(mockAnalyticsData);
      }, 1000);
    };

    fetchAnalyticsData();
  }, [timeRange]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-astral-void p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Analytics Dashboard</h1>
            <p className="text-astral-purple-300">Real-time insights into user behavior and platform performance</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex space-x-2">
            {['1d', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm transition-colors',
                  timeRange === range
                    ? 'bg-astral-purple-500 text-white'
                    : 'bg-astral-steel/20 text-astral-purple-300 hover:bg-astral-steel/30'
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-green-400 text-sm">+12.5%</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{formatNumber(data.overview.totalUsers)}</h3>
            <p className="text-astral-purple-300 text-sm">Total Users</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <ActivityIcon className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-green-400 text-sm">+8.3%</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{formatNumber(data.overview.activeUsers)}</h3>
            <p className="text-astral-purple-300 text-sm">Active Users</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <EyeIcon className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-green-400 text-sm">+15.7%</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{formatNumber(data.overview.pageViews)}</h3>
            <p className="text-astral-purple-300 text-sm">Page Views</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <ZapIcon className="w-6 h-6 text-yellow-400" />
              </div>
              <span className="text-green-400 text-sm">+3.2%</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{formatPercentage(data.overview.conversionRate)}</h3>
            <p className="text-astral-purple-300 text-sm">Conversion Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Real-time Activity */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              Real-time Activity
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-astral-purple-300">Active Users</span>
                <span className="text-2xl font-bold text-green-400">{data.realTimeData.activeUsers}</span>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Top Active Pages</h4>
                <div className="space-y-1">
                  {data.realTimeData.topPages.map((page, index) => (
                    <div key={index} className="text-xs text-astral-purple-300 truncate">
                      {page}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Recent Events</h4>
                <div className="space-y-2">
                  {data.realTimeData.recentEvents.slice(0, 5).map((event, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-astral-purple-200">{event.event}</span>
                      <span className="text-astral-purple-400">{event.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User Journey Funnel */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Conversion Funnel</h3>
            <div className="space-y-3">
              {data.conversionFunnel.map((step, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-white">{step.step}</span>
                    <span className="text-astral-purple-300">{formatNumber(step.users)}</span>
                  </div>
                  <div className="w-full bg-astral-steel/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-astral-purple-500 to-astral-neon-cyan h-2 rounded-full transition-all duration-500"
                      style={{ width: `${step.conversionRate * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-astral-purple-400 mt-1">
                    {formatPercentage(step.conversionRate)} conversion
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Events */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Top Events</h3>
            <div className="space-y-3">
              {data.topEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-white">{event.event}</span>
                      <span className="text-astral-purple-300">{formatNumber(event.count)}</span>
                    </div>
                    <div className="w-full bg-astral-steel/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-astral-neon-cyan to-astral-accent-lime h-2 rounded-full"
                        style={{ width: `${event.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Pages */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Top Pages</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-astral-purple-500/20">
                    <th className="text-left text-astral-purple-300 pb-2">Page</th>
                    <th className="text-right text-astral-purple-300 pb-2">Views</th>
                    <th className="text-right text-astral-purple-300 pb-2">Avg Time</th>
                    <th className="text-right text-astral-purple-300 pb-2">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((page, index) => (
                    <tr key={index} className="border-b border-astral-purple-500/10">
                      <td className="py-2 text-white">{page.page}</td>
                      <td className="py-2 text-right text-astral-purple-200">{formatNumber(page.views)}</td>
                      <td className="py-2 text-right text-astral-purple-200">{formatTime(page.avgTime)}</td>
                      <td className="py-2 text-right text-astral-purple-200">{formatPercentage(page.bounceRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Demographics */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">User Demographics</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-astral-purple-300 mb-3">Devices</h4>
                <div className="space-y-2">
                  {data.demographics.devices.map((device, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-white text-sm">{device.device}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-astral-steel/20 rounded-full h-2">
                          <div 
                            className="bg-astral-purple-500 h-2 rounded-full"
                            style={{ width: `${device.percentage}%` }}
                          />
                        </div>
                        <span className="text-astral-purple-300 text-sm w-12 text-right">
                          {device.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-astral-purple-300 mb-3">Browsers</h4>
                <div className="space-y-2">
                  {data.demographics.browsers.map((browser, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-white text-sm">{browser.browser}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-astral-steel/20 rounded-full h-2">
                          <div 
                            className="bg-astral-neon-cyan h-2 rounded-full"
                            style={{ width: `${browser.percentage}%` }}
                          />
                        </div>
                        <span className="text-astral-purple-300 text-sm w-12 text-right">
                          {browser.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Key Performance Indicators</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {formatTime(data.overview.avgSessionDuration)}
              </div>
              <div className="text-astral-purple-300 text-sm">Avg Session Duration</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {formatPercentage(data.overview.bounceRate)}
              </div>
              <div className="text-astral-purple-300 text-sm">Bounce Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {formatNumber(data.overview.newUsers)}
              </div>
              <div className="text-astral-purple-300 text-sm">New Users</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {formatNumber(data.overview.sessions)}
              </div>
              <div className="text-astral-purple-300 text-sm">Total Sessions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;