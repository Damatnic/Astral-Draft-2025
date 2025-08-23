/**
 * @fileoverview Bundle Analyzer Component
 * Provides bundle size analysis and optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { componentSizes } from '@/components/lazy';

interface BundleInfo {
  name: string;
  size: number;
  gzipSize: number;
  percentage: number;
  type: 'chunk' | 'asset' | 'component';
  recommendation?: string;
}

interface BundleStats {
  totalSize: number;
  totalGzipSize: number;
  chunks: BundleInfo[];
  assets: BundleInfo[];
  recommendations: string[];
}

const BundleAnalyzer: React.FC = () => {
  const [bundleStats, setBundleStats] = useState<BundleStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<'chunks' | 'assets' | 'components'>('chunks');

  // Mock bundle analysis data (in production, this would come from webpack-bundle-analyzer)
  const mockBundleStats: BundleStats = {
    totalSize: 2450000, // 2.45MB
    totalGzipSize: 890000, // 890KB
    chunks: [
      { name: 'main', size: 450000, gzipSize: 165000, percentage: 18.4, type: 'chunk' },
      { name: 'vendors', size: 1200000, gzipSize: 420000, percentage: 49.0, type: 'chunk' },
      { name: 'react', size: 180000, gzipSize: 65000, percentage: 7.3, type: 'chunk' },
      { name: 'draft', size: 320000, gzipSize: 110000, percentage: 13.1, type: 'chunk' },
      { name: 'oracle', size: 200000, gzipSize: 85000, percentage: 8.2, type: 'chunk' },
      { name: 'fantasy', size: 100000, gzipSize: 45000, percentage: 4.1, type: 'chunk' },
    ],
    assets: [
      { name: 'styles.css', size: 45000, gzipSize: 12000, percentage: 1.8, type: 'asset' },
      { name: 'images', size: 380000, gzipSize: 350000, percentage: 15.5, type: 'asset' },
      { name: 'fonts', size: 120000, gzipSize: 115000, percentage: 4.9, type: 'asset' },
    ],
    recommendations: [
      'Consider code splitting for the Oracle module to reduce initial bundle size',
      'Optimize images - some images are not optimized for web',
      'Remove unused dependencies from node_modules',
      'Consider lazy loading heavy components like draft board',
      'Enable gzip compression on server for better compression ratios',
    ],
  };

  const analyzeBundles = async () => {
    setLoading(true);
    
    // Simulate API call to get bundle analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setBundleStats(mockBundleStats);
    setLoading(false);
  };

  useEffect(() => {
    analyzeBundles();
  }, []);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getRecommendation = (item: BundleInfo): string => {
    if (item.percentage > 20) {
      return 'Consider splitting this large chunk';
    } else if (item.percentage > 10) {
      return 'Monitor size growth';
    } else if (item.type === 'asset' && item.gzipSize / item.size > 0.9) {
      return 'Poor compression ratio - check file type';
    }
    return 'Size is acceptable';
  };

  const getSizeStatus = (percentage: number): 'good' | 'warning' | 'error' => {
    if (percentage > 20) return 'error';
    if (percentage > 10) return 'warning';
    return 'good';
  };

  const renderBundleTable = (items: BundleInfo[], title: string) => (
    <Card className="p-4">
      <h3 className="font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-600">
              <th className="pb-2">Name</th>
              <th className="pb-2">Size</th>
              <th className="pb-2">Gzipped</th>
              <th className="pb-2">% of Total</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-2 font-medium">{item.name}</td>
                <td className="py-2">{formatSize(item.size)}</td>
                <td className="py-2 text-green-600">{formatSize(item.gzipSize)}</td>
                <td className="py-2">{item.percentage.toFixed(1)}%</td>
                <td className="py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      getSizeStatus(item.percentage) === 'good'
                        ? 'bg-green-100 text-green-800'
                        : getSizeStatus(item.percentage) === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {getSizeStatus(item.percentage) === 'good' 
                      ? 'Good' 
                      : getSizeStatus(item.percentage) === 'warning' 
                      ? 'Watch' 
                      : 'Large'}
                  </span>
                </td>
                <td className="py-2 text-xs text-gray-600">
                  {getRecommendation(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderComponentSizes = () => (
    <Card className="p-4">
      <h3 className="font-semibold text-gray-700 mb-4">Component Size Estimates</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(componentSizes).map(([component, size]) => (
          <div key={component} className="p-3 border rounded-lg">
            <h4 className="font-medium text-gray-700">{component}</h4>
            <p className="text-sm text-gray-500">{size}</p>
            <div className="mt-2">
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  size.includes('Very Large')
                    ? 'bg-red-100 text-red-800'
                    : size.includes('Large')
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {size.includes('Very Large')
                  ? 'Heavy'
                  : size.includes('Large')
                  ? 'Medium'
                  : 'Light'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2">Analyzing bundle sizes...</span>
      </div>
    );
  }

  if (!bundleStats) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No bundle analysis available</p>
        <Button onClick={analyzeBundles} className="mt-4">
          Run Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bundle Analyzer</h1>
          <p className="text-gray-600">Analyze and optimize bundle sizes</p>
        </div>
        <Button onClick={analyzeBundles} variant="outline">
          Re-analyze
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-700">Total Bundle Size</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold">{formatSize(bundleStats.totalSize)}</span>
            <p className="text-sm text-gray-500">
              {formatSize(bundleStats.totalGzipSize)} gzipped
            </p>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-semibold text-gray-700">Compression Ratio</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold">
              {((bundleStats.totalGzipSize / bundleStats.totalSize) * 100).toFixed(1)}%
            </span>
            <p className="text-sm text-gray-500">Gzip compression</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-semibold text-gray-700">Largest Chunk</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold">
              {bundleStats.chunks[0]?.percentage.toFixed(1)}%
            </span>
            <p className="text-sm text-gray-500">{bundleStats.chunks[0]?.name}</p>
          </div>
        </Card>
      </div>

      {/* Analysis Type Selector */}
      <div className="flex space-x-4">
        <Button
          onClick={() => setAnalysisType('chunks')}
          variant={analysisType === 'chunks' ? 'default' : 'outline'}
        >
          JavaScript Chunks
        </Button>
        <Button
          onClick={() => setAnalysisType('assets')}
          variant={analysisType === 'assets' ? 'default' : 'outline'}
        >
          Static Assets
        </Button>
        <Button
          onClick={() => setAnalysisType('components')}
          variant={analysisType === 'components' ? 'default' : 'outline'}
        >
          Components
        </Button>
      </div>

      {/* Bundle Analysis */}
      {analysisType === 'chunks' && renderBundleTable(bundleStats.chunks, 'JavaScript Chunks')}
      {analysisType === 'assets' && renderBundleTable(bundleStats.assets, 'Static Assets')}
      {analysisType === 'components' && renderComponentSizes()}

      {/* Bundle Visualization */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-700 mb-4">Bundle Size Visualization</h3>
        <div className="space-y-3">
          {bundleStats.chunks.map((chunk, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-24 text-sm font-medium truncate">{chunk.name}</div>
              <div className="flex-1 relative">
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      chunk.percentage > 20
                        ? 'bg-red-500'
                        : chunk.percentage > 10
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${chunk.percentage}%` }}
                  />
                </div>
              </div>
              <div className="w-20 text-sm text-gray-600 text-right">
                {chunk.percentage.toFixed(1)}%
              </div>
              <div className="w-24 text-sm text-gray-600 text-right">
                {formatSize(chunk.size)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-700 mb-4">Optimization Recommendations</h3>
        <div className="space-y-3">
          {bundleStats.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
              </div>
              <p className="text-blue-800 text-sm">{recommendation}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Bundle Analysis Commands */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-700 mb-4">Bundle Analysis Commands</h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700">Analyze bundle in development</h4>
            <code className="text-sm text-gray-600 block mt-1">
              ANALYZE=true npm run build
            </code>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700">Generate bundle report</h4>
            <code className="text-sm text-gray-600 block mt-1">
              npm run analyze
            </code>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700">Check gzip sizes</h4>
            <code className="text-sm text-gray-600 block mt-1">
              npm run build && npx bundlesize
            </code>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BundleAnalyzer;