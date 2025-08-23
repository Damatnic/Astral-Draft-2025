/**
 * Oracle Performance Dashboard Component
 * Showcases UI performance optimizations for real-time Oracle interactions
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
    Activity, 
    Zap, 
    Clock, 
    Database, 
    TrendingUp, 
    Settings,
    RefreshCw,
    CheckCircle
} from 'lucide-react';
import { Widget } from '../ui/Widget';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import {
    useOraclePerformanceMonitoring,
    useThrottledOracleUpdates,
    useOptimizedUserInput,
    useBatchedAnalyticsUpdates
} from '../../hooks/useOraclePerformanceOptimization';
import oraclePerformanceOptimizationService from '../../services/oraclePerformanceOptimizationService';

// Memoized performance metric card
const PerformanceMetricCard = memo(({ 
    title, 
    value, 
    unit, 
    trend, 
    icon: Icon,
    color = 'blue' 
}: {
    title: string;
    value: number;
    unit: string;
    trend?: 'up' | 'down' | 'stable';
    icon: React.ComponentType<any>;
    color?: string;
}) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-100',
        green: 'text-green-600 bg-green-100',
        orange: 'text-orange-600 bg-orange-100',
        purple: 'text-purple-600 bg-purple-100'
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <div className={`text-xs px-2 py-1 rounded ${
                        trend === 'up' ? 'bg-green-100 text-green-600' :
                        trend === 'down' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {value.toFixed(value < 10 ? 2 : 0)}{unit}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
        </div>
    );
});

// Memoized real-time updates list
const RealTimeUpdatesList = memo(({ updates, maxVisible = 5 }: {
    updates: any[];
    maxVisible?: number;
}) => {
    const visibleUpdates = useMemo(() => 
        updates.slice(-maxVisible).reverse(), 
        [updates, maxVisible]
    );

    return (
        <div className="space-y-2 max-h-40 overflow-y-auto">
            <AnimatePresence>
                {visibleUpdates.map((update, index) => (
                    <motion.div
                        key={`${update.id}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                            {update.message}
                        </div>
                        <div className="text-xs text-gray-500">
                            {new Date(update.timestamp).toLocaleTimeString()}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
});

// Memoized performance chart
const PerformanceChart = memo(({ data, height = 200 }: {
    data: any[];
    height?: number;
}) => {
    const chartData = useMemo(() => 
        data.map((item, index) => ({
            time: index,
            renderTime: item.renderTime || 0,
            cacheHitRate: item.cacheHitRate || 0,
            memoryUsage: item.memoryUsage || 0
        })),
        [data]
    );

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                    type="monotone" 
                    dataKey="renderTime" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Render Time (ms)"
                />
                <Line 
                    type="monotone" 
                    dataKey="cacheHitRate" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Cache Hit Rate (%)"
                />
            </LineChart>
        </ResponsiveContainer>
    );
});

// Debounced settings panel
const SettingsPanel = memo(({ 
    onConfigUpdate,
    currentConfig 
}: {
    onConfigUpdate: (config: any) => void;
    currentConfig: any;
}) => {
    const { value: debounceMs, setValue: setDebounceMs } = useOptimizedUserInput(
        currentConfig.userInputDebounceMs?.toString() || '300'
    );
    
    const { value: throttleMs, setValue: setThrottleMs } = useOptimizedUserInput(
        currentConfig.realTimeUpdateThrottleMs?.toString() || '100'
    );

    const handleSave = useCallback(() => {
        onConfigUpdate({
            userInputDebounceMs: parseInt(debounceMs) || 300,
            realTimeUpdateThrottleMs: parseInt(throttleMs) || 100
        });
    }, [debounceMs, throttleMs, onConfigUpdate]);

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Input Debounce (ms)
                </label>
                <input
                    type="number"
                    value={debounceMs}
                    onChange={(e: any) => setDebounceMs(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
                    min="0"
                    max="2000"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Update Throttle (ms)
                </label>
                <input
                    type="number"
                    value={throttleMs}
                    onChange={(e: any) => setThrottleMs(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
                    min="0"
                    max="1000"
                />
            </div>
            
            <button
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
                Apply Settings
            </button>
        </div>
    );
});

// Main dashboard component
const OraclePerformanceDashboard: React.FC<{
    className?: string;
}> = ({ className = '' }) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    // Performance monitoring
    const { metrics, startRenderMeasurement, endRenderMeasurement } = useOraclePerformanceMonitoring();
    
    // Real-time updates
    const { updates, addUpdate } = useThrottledOracleUpdates();
    
    // Batched analytics
    const { batchedUpdates, addAnalyticsUpdate } = useBatchedAnalyticsUpdates();
    
    // Local state
    const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'settings'>('overview');
    const [showSettings, setShowSettings] = useState(false);
    const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);

    // Performance measurement
    useEffect(() => {
        startRenderMeasurement();
        return () => {
            endRenderMeasurement();
        };
    });

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            const updateTypes = ['PREDICTION_UPDATE', 'USER_JOINED', 'CONSENSUS_CHANGE'];
            const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)];
            
            addUpdate({
                id: `update-${Date.now()}`,
                type: randomType,
                message: `Simulated ${randomType.toLowerCase().replace('_', ' ')}`,
                timestamp: new Date().toISOString()
            });
            
            // Add analytics update
            addAnalyticsUpdate({
                type: 'performance_metric',
                value: Math.random() * 100,
                timestamp: new Date().toISOString()
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [addUpdate, addAnalyticsUpdate]);

    // Track performance history
    useEffect(() => {
        const interval = setInterval(() => {
            setPerformanceHistory(prev => [
                ...prev.slice(-19), // Keep last 20 entries
                {
                    timestamp: Date.now(),
                    renderTime: metrics.averageRenderTime,
                    cacheHitRate: metrics.cacheHitRate,
                    memoryUsage: metrics.memoryUsage
                }
            ]);
        }, 1000);

        return () => clearInterval(interval);
    }, [metrics]);

    // Handle performance optimization
    const handleOptimization = useCallback(async () => {
        setIsOptimizing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate optimization
            oraclePerformanceOptimizationService.optimizePerformance();
            addUpdate({
                id: `optimization-${Date.now()}`,
                type: 'SYSTEM_OPTIMIZATION',
                message: 'Performance optimization completed',
                timestamp: new Date().toISOString()
            });
        } finally {
            setIsOptimizing(false);
        }
    }, [addUpdate]);

    // Handle configuration updates
    const handleConfigUpdate = useCallback((newConfig: any) => {
        oraclePerformanceOptimizationService.updateConfig(newConfig);
        addUpdate({
            id: `config-${Date.now()}`,
            type: 'CONFIG_UPDATE',
            message: 'Performance configuration updated',
            timestamp: new Date().toISOString()
        });
    }, [addUpdate]);

    const renderOverviewTab = () => (
        <div className="space-y-6">
            {/* Performance metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <PerformanceMetricCard
                    title="Render Time"
                    value={metrics.averageRenderTime}
                    unit="ms"
                    icon={Clock}
                    color="blue"
                    trend={metrics.averageRenderTime < 16 ? 'up' : 'stable'}
                />
                <PerformanceMetricCard
                    title="Cache Hit Rate"
                    value={metrics.cacheHitRate}
                    unit="%"
                    icon={Database}
                    color="green"
                    trend="up"
                />
                <PerformanceMetricCard
                    title="Memory Usage"
                    value={metrics.memoryUsage}
                    unit="MB"
                    icon={Activity}
                    color="orange"
                    trend="stable"
                />
                <PerformanceMetricCard
                    title="Render Count"
                    value={metrics.renderCount}
                    unit=""
                    icon={TrendingUp}
                    color="purple"
                    trend="up"
                />
            </div>

            {/* Real-time updates */}
            <Widget title="Real-Time Updates" className="bg-white dark:bg-gray-800">
                <RealTimeUpdatesList updates={updates} maxVisible={isMobile ? 3 : 5} />
            </Widget>

            {/* Optimization controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleOptimization}
                    disabled={isOptimizing}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                    {isOptimizing ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Optimizing...</span>
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
                            <span>Optimize Performance</span>
                        </>
                    )}
                </button>
                
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                </button>
            </div>
        </div>
    );

    const renderPerformanceTab = () => (
        <div className="space-y-6">
            <Widget title="Performance Trends" className="bg-white dark:bg-gray-800">
                <PerformanceChart data={performanceHistory} height={isMobile ? 200 : 300} />
            </Widget>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Widget title="Batched Updates" className="bg-white dark:bg-gray-800">
                    <div className="space-y-2">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Processing {batchedUpdates.length} batched analytics updates
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-xs text-gray-500">
                                Last batch: {batchedUpdates.length > 0 ? 
                                    new Date(batchedUpdates[batchedUpdates.length - 1]?.timestamp || Date.now()).toLocaleTimeString() :
                                    'No updates'
                                }
                            </div>
                        </div>
                    </div>
                </Widget>
                
                <Widget title="Optimization Status" className="bg-white dark:bg-gray-800">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Virtual scrolling enabled</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Debounced user input</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Throttled updates</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Intelligent caching</span>
                        </div>
                    </div>
                </Widget>
            </div>
        </div>
    );

    return (
        <div className={`oracle-performance-dashboard ${className}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Performance Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Real-time Oracle UI performance monitoring and optimization
                    </p>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeTab === 'overview'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeTab === 'performance'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        Performance
                    </button>
                </div>
            </div>

            {/* Settings panel */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                    >
                        <Widget title="Performance Settings" className="bg-white dark:bg-gray-800">
                            <SettingsPanel
                                onConfigUpdate={handleConfigUpdate}
                                currentConfig={oraclePerformanceOptimizationService}
                            />
                        </Widget>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' ? renderOverviewTab() : renderPerformanceTab()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default memo(OraclePerformanceDashboard);
