/**
 * @fileoverview Performance Monitoring Dashboard
 * Comprehensive dashboard for monitoring application performance metrics
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  useRenderTracking, 
  getComponentPerformanceMetrics, 
  clearComponentMetrics 
} from '@/hooks/usePerformance';
import { 
  performanceMonitor, 
  checkPerformanceBudget,
  type PerformanceMetrics 
} from '@/lib/performance/monitoring';
import { cacheManager } from '@/lib/performance/cacheManager';
import { dbOptimizer } from '@/lib/performance/dbOptimizer';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'warning' | 'error';
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit, 
  status, 
  description 
}) => {
  const statusColors = {
    good: 'border-green-500 bg-green-50 text-green-800',
    warning: 'border-yellow-500 bg-yellow-50 text-yellow-800',
    error: 'border-red-500 bg-red-50 text-red-800',
  };

  return (
    <Card className={`p-4 border-l-4 ${statusColors[status]}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
          <div className="mt-1">
            <span className="text-2xl font-bold">{value}</span>
            {unit && <span className="text-sm ml-1 text-gray-500">{unit}</span>}
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

const PerformanceChart: React.FC<{
  data: Array<{ label: string; value: number; threshold?: number }>;
  title: string;
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-gray-600 truncate">
              {item.label}
            </div>
            <div className="flex-1 relative">
              <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    item.threshold && item.value > item.threshold
                      ? 'bg-red-500'
                      : item.value > maxValue * 0.7
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
              {item.threshold && (
                <div
                  className="absolute top-0 h-6 w-0.5 bg-red-700"
                  style={{ left: `${(item.threshold / maxValue) * 100}%` }}
                />
              )}
            </div>
            <div className="w-16 text-sm text-gray-600 text-right">
              {item.value.toFixed(1)}ms
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const ComponentPerformanceTable: React.FC = () => {
  const [componentMetrics, setComponentMetrics] = useState(getComponentPerformanceMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setComponentMetrics(getComponentPerformanceMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">Component Performance</h3>
        <Button
          onClick={() => {
            clearComponentMetrics();
            setComponentMetrics([]);
          }}
          className="text-sm"
          variant="outline"
        >
          Clear Metrics
        </Button>
      </div>
      
      {componentMetrics.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No component metrics available. Navigate around the app to see data.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-600">
                <th className="pb-2">Component</th>
                <th className="pb-2">Renders</th>
                <th className="pb-2">Avg Time</th>
                <th className="pb-2">Total Time</th>
                <th className="pb-2">Wasted</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {componentMetrics.map((metric, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 font-medium">{metric.componentName}</td>
                  <td className="py-2">{metric.renderCount}</td>
                  <td className="py-2">{metric.avgRenderTime.toFixed(2)}ms</td>
                  <td className="py-2">{metric.totalRenderTime.toFixed(2)}ms</td>
                  <td className="py-2 text-red-600">{metric.wastedRenders}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        metric.avgRenderTime < 16
                          ? 'bg-green-100 text-green-800'
                          : metric.avgRenderTime < 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {metric.avgRenderTime < 16 ? 'Good' : metric.avgRenderTime < 50 ? 'Warning' : 'Slow'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

const PerformanceDashboard: React.FC = () => {
  useRenderTracking('PerformanceDashboard');
  
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [cacheStats, setCacheStats] = useState(cacheManager.getStats());
  const [dbStats, setDbStats] = useState(dbOptimizer.getQueryStats());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Get current performance metrics
    if (performanceMonitor) {
      setMetrics(performanceMonitor.getMetrics());
    }

    // Update cache and DB stats
    setCacheStats(cacheManager.getStats());
    setDbStats(dbOptimizer.getQueryStats());

    const interval = setInterval(() => {
      if (performanceMonitor) {
        setMetrics(performanceMonitor.getMetrics());
      }
      setCacheStats(cacheManager.getStats());
      setDbStats(dbOptimizer.getQueryStats());
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  const coreWebVitals = useMemo(() => {
    const budget = checkPerformanceBudget(metrics);
    return [
      {
        title: 'First Contentful Paint',
        value: metrics.fcp ? (metrics.fcp / 1000).toFixed(2) : 'N/A',
        unit: 's',
        status: (!metrics.fcp || metrics.fcp <= 2500) ? 'good' : metrics.fcp <= 4000 ? 'warning' : 'error',
        description: 'Time until first content is painted',
      },
      {
        title: 'Largest Contentful Paint',
        value: metrics.lcp ? (metrics.lcp / 1000).toFixed(2) : 'N/A',
        unit: 's',
        status: (!metrics.lcp || metrics.lcp <= 2500) ? 'good' : metrics.lcp <= 4000 ? 'warning' : 'error',
        description: 'Time until largest content element is painted',
      },
      {
        title: 'First Input Delay',
        value: metrics.fid ? metrics.fid.toFixed(1) : 'N/A',
        unit: 'ms',
        status: (!metrics.fid || metrics.fid <= 100) ? 'good' : metrics.fid <= 300 ? 'warning' : 'error',
        description: 'Time from first user interaction to response',
      },
      {
        title: 'Cumulative Layout Shift',
        value: metrics.cls ? metrics.cls.toFixed(3) : 'N/A',
        unit: '',
        status: (!metrics.cls || metrics.cls <= 0.1) ? 'good' : metrics.cls <= 0.25 ? 'warning' : 'error',
        description: 'Measure of visual stability',
      },
    ] as MetricCardProps[];
  }, [metrics]);

  const performanceChartData = useMemo(() => [
    { label: 'FCP', value: metrics.fcp || 0, threshold: 2500 },
    { label: 'LCP', value: metrics.lcp || 0, threshold: 4000 },
    { label: 'TTI', value: metrics.tti || 0, threshold: 5000 },
    { label: 'TTFB', value: metrics.ttfb || 0, threshold: 600 },
  ], [metrics]);

  const systemMetrics = useMemo(() => [
    {
      title: 'Memory Usage',
      value: metrics.usedJSMemorySize 
        ? (metrics.usedJSMemorySize / 1024 / 1024).toFixed(1) 
        : 'N/A',
      unit: 'MB',
      status: !metrics.usedJSMemorySize || metrics.usedJSMemorySize < 50 * 1024 * 1024 
        ? 'good' : 'warning',
      description: 'JavaScript heap usage',
    },
    {
      title: 'Cache Hit Rate',
      value: cacheStats.hitRate.toFixed(1),
      unit: '%',
      status: cacheStats.hitRate > 80 ? 'good' : cacheStats.hitRate > 60 ? 'warning' : 'error',
      description: 'Percentage of cache hits',
    },
    {
      title: 'DB Query Time',
      value: dbStats.avgDuration ? dbStats.avgDuration.toFixed(1) : 'N/A',
      unit: 'ms',
      status: !dbStats.avgDuration || dbStats.avgDuration < 100 
        ? 'good' : dbStats.avgDuration < 300 ? 'warning' : 'error',
      description: 'Average database query time',
    },
    {
      title: 'Slow Queries',
      value: dbStats.slowQueryPercentage ? dbStats.slowQueryPercentage.toFixed(1) : '0',
      unit: '%',
      status: !dbStats.slowQueryPercentage || dbStats.slowQueryPercentage < 5 
        ? 'good' : dbStats.slowQueryPercentage < 15 ? 'warning' : 'error',
      description: 'Percentage of slow database queries',
    },
  ] as MetricCardProps[], [cacheStats, dbStats]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600">Monitor application performance and optimization metrics</p>
        </div>
        <Button
          onClick={() => setRefreshKey(prev => prev + 1)}
          variant="outline"
        >
          Refresh Metrics
        </Button>
      </div>

      {/* Core Web Vitals */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Core Web Vitals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreWebVitals.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart
          data={performanceChartData}
          title="Core Performance Metrics"
        />
        
        {/* System Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">System Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemMetrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>
        </div>
      </div>

      {/* Cache Statistics */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-700 mb-4">Cache Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{cacheStats.hits}</div>
            <div className="text-gray-500">Cache Hits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{cacheStats.misses}</div>
            <div className="text-gray-500">Cache Misses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{cacheStats.sets}</div>
            <div className="text-gray-500">Cache Sets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{cacheStats.size}</div>
            <div className="text-gray-500">Cache Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {cacheStats.hitRate.toFixed(1)}%
            </div>
            <div className="text-gray-500">Hit Rate</div>
          </div>
        </div>
      </Card>

      {/* Database Statistics */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-700 mb-4">Database Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-gray-600 mb-2">Query Statistics</h4>
            <div className="space-y-1 text-sm">
              <div>Total Queries: <span className="font-medium">{dbStats.totalQueries}</span></div>
              <div>Slow Queries: <span className="font-medium text-red-600">{dbStats.slowQueries}</span></div>
              <div>Avg Duration: <span className="font-medium">{dbStats.avgDuration?.toFixed(2)}ms</span></div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <h4 className="font-medium text-gray-600 mb-2">Queries by Table</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {dbStats.byTable?.map((table, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{table.table}</span>
                  <span className="text-gray-500">
                    {table.count} queries, {table.avgDuration.toFixed(2)}ms avg
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Component Performance */}
      <ComponentPerformanceTable />

      {/* Performance Recommendations */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-700 mb-4">Performance Recommendations</h3>
        <div className="space-y-3">
          {metrics.lcp && metrics.lcp > 4000 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800">Slow LCP detected</h4>
              <p className="text-red-600 text-sm">
                Consider optimizing images, reducing server response times, or implementing resource hints.
              </p>
            </div>
          )}
          
          {cacheStats.hitRate < 60 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800">Low cache hit rate</h4>
              <p className="text-yellow-600 text-sm">
                Review caching strategies and consider adjusting cache TTL values.
              </p>
            </div>
          )}
          
          {dbStats.slowQueryPercentage && dbStats.slowQueryPercentage > 15 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-orange-800">High percentage of slow queries</h4>
              <p className="text-orange-600 text-sm">
                Review database indexes and optimize slow queries.
              </p>
            </div>
          )}
          
          {!metrics.fcp && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800">Performance monitoring active</h4>
              <p className="text-blue-600 text-sm">
                Navigate around the application to see detailed performance metrics.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;