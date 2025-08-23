/**
 * Oracle Historical Analytics View
 * Comprehensive historical prediction tracking, trend analysis, and performance metrics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FiBarChart, 
    FiTrendingUp, 
    FiTrendingDown, 
    FiPieChart, 
    FiActivity, 
    FiAlertTriangle, 
    FiDownload, 
    FiRefreshCw, 
    FiTarget, 
    FiZap, 
    FiCheckCircle 
} from 'react-icons/fi';
import { 
    LineChart, 
    Line, 
    AreaChart, 
    Area, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
import { useHistoricalAnalytics, TimeframeType } from '../hooks/useHistoricalAnalytics';
import { PredictionType } from '../services/oraclePredictionService';
import { useResponsiveBreakpoint, useMobileModalClasses } from '../utils/mobileOptimizationUtils';

// Simple SVG Icons to replace react-icons
const TrendingUpIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const TrendingDownIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
);

const TargetIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const BrainIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const ActivityIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const DownloadIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const AlertIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.134 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
);

const ZapIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const BarChartIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const PieChartIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
);

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B'];

const PREDICTION_TYPE_COLORS: Record<PredictionType, string> = {
    'PLAYER_PERFORMANCE': '#8B5CF6',
    'GAME_OUTCOME': '#06B6D4',
    'WEEKLY_SCORING': '#10B981',
    'WEATHER_IMPACT': '#F59E0B',
    'INJURY_IMPACT': '#EF4444',
    'TEAM_PERFORMANCE': '#8B5A2B'
};

interface HistoricalAnalyticsViewProps {
    className?: string;
}

export function HistoricalAnalyticsView({ className = '' }: HistoricalAnalyticsViewProps) {
    const { isMobile } = useResponsiveBreakpoint();
    const modalClasses = useMobileModalClasses();
    
    const {
        trendAnalysis,
        accuracyBreakdown,
        performanceComparison,
        advancedInsights,
        historicalRecords,
        isLoading,
        isLoadingTrends,
        isLoadingBreakdown,
        isLoadingInsights,
        error,
        refreshAnalytics,
        analyzeTimeframe,
        comparePerformance,
        exportData,
        importData,
        filterByType,
        getOverallStats,
        getTypePerformance,
        getRecentPerformance
    } = useHistoricalAnalytics();

    const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'breakdown' | 'insights' | 'comparison'>('overview');
    const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>('monthly');
    const [selectedTypes, setSelectedTypes] = useState<PredictionType[]>([]);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    const overallStats = getOverallStats();
    const typePerformance = getTypePerformance();
    const recentPerformance = getRecentPerformance(30);

    useEffect(() => {
        if (selectedTimeframe) {
            analyzeTimeframe(selectedTimeframe);
        }
    }, [selectedTimeframe, analyzeTimeframe]);

    const handleExport = async () => {
        try {
            const data = await exportData('json');
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `oracle-analytics-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setShowExportModal(false);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const formatAccuracy = (accuracy: number) => `${(accuracy * 100).toFixed(1)}%`;
    const formatChange = (change: number) => {
        const prefix = change > 0 ? '+' : '';
        return `${prefix}${(change * 100).toFixed(1)}%`;
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FiBarChart },
        { id: 'trends', label: 'Trends', icon: FiTrendingUp },
        { id: 'breakdown', label: 'Breakdown', icon: FiPieChart },
        { id: 'insights', label: 'Insights', icon: FiActivity },
        { id: 'comparison', label: 'Comparison', icon: FiActivity }
    ];

    if (error) {
        return (
            <div className={`p-6 ${className}`}>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-800">
                        <FiAlertTriangle className="h-5 w-5" />
                        <span className="font-medium">Error Loading Analytics</span>
                    </div>
                    <p className="text-red-600 mt-1">{error}</p>
                    <button
                        onClick={refreshAnalytics}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Oracle Historical Analytics</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        Track prediction accuracy, analyze trends, and gain insights from historical performance
                    </p>
                </div>
                
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                    <select
                        value={selectedTimeframe}
                        onChange={(e) => setSelectedTimeframe(e.target.value as TimeframeType)}
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm mobile-touch-target"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="seasonal">Seasonal</option>
                        <option value="yearly">Yearly</option>
                    </select>
                    
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm mobile-touch-target"
                        >
                            <FiDownload className="h-4 w-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        
                        <button
                            onClick={refreshAnalytics}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm mobile-touch-target"
                        >
                            <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Overall Accuracy</p>
                            <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                {formatAccuracy(overallStats.overallAccuracy)}
                            </p>
                        </div>
                        <div className="h-8 w-8 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FiTarget className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-2 sm:mt-4">
                        <span className={`text-xs sm:text-sm ${recentPerformance.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatChange(recentPerformance.improvement)} from last 30 days
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Predictions</p>
                            <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                {overallStats.totalPredictions.toLocaleString()}
                            </p>
                        </div>
                        <div className="h-8 w-8 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FiActivity className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-2 sm:mt-4">
                        <span className="text-xs sm:text-sm text-gray-600">
                            {recentPerformance.predictions} in last 30 days
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Current Streak</p>
                            <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                {overallStats.currentStreak}
                            </p>
                        </div>
                        <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <FiZap className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-2 sm:mt-4">
                        <span className="text-xs sm:text-sm text-gray-600">
                            Best: {overallStats.longestStreak} correct
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Confidence</p>
                            <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                {overallStats.averageConfidence.toFixed(0)}%
                            </p>
                        </div>
                        <div className="h-8 w-8 sm:h-12 sm:w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <FiActivity className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
                        </div>
                    </div>
                    <div className="mt-2 sm:mt-4">
                        <span className="text-xs sm:text-sm text-gray-600">
                            Calibration pending analysis
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 transition-colors mobile-touch-target ${
                                    activeTab === tab.id
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Accuracy Trend Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
                        >
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Accuracy Trend</h3>
                            {isLoadingTrends ? (
                                <div className="h-48 sm:h-64 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                </div>
                            ) : trendAnalysis ? (
                                <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
                                    <LineChart data={trendAnalysis.accuracyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" fontSize={12} />
                                        <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} fontSize={12} />
                                        <Tooltip 
                                            labelFormatter={(label) => `Period: ${label}`}
                                            formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Accuracy']}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#8B5CF6" 
                                            strokeWidth={2}
                                            dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500">
                                    No trend data available
                                </div>
                            )}
                        </motion.div>

                        {/* Type Performance */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
                        >
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Performance by Type</h3>
                            <div className="space-y-2 sm:space-y-3">
                                {Object.entries(typePerformance).map(([type, stats], index) => (
                                    <div key={type} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                            <div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: PREDICTION_TYPE_COLORS[type as PredictionType] }}
                                            ></div>
                                            <span className="text-sm sm:text-base font-medium text-gray-900">
                                                {type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm sm:text-base font-semibold text-gray-900">
                                                {formatAccuracy(stats.accuracy)}
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-600">
                                                {stats.count} predictions
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {activeTab === 'trends' && trendAnalysis && (
                    <div className="space-y-6">
                        {/* Confidence Trend */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
                        >
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Confidence Trend</h3>
                            <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
                                <AreaChart data={trendAnalysis.confidenceTrend}>
                                    <defs>
                                        <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" fontSize={12} />
                                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} fontSize={12} />
                                    <Tooltip 
                                        labelFormatter={(label) => `Period: ${label}`}
                                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Confidence']}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#06B6D4" 
                                        fillOpacity={1}
                                        fill="url(#confidenceGradient)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Type Performance Trends */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
                        >
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Type Performance Trends</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                                {trendAnalysis.typesPerformance.map((typeData, index) => (
                                    <div key={typeData.type} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-1 sm:space-y-0">
                                            <h4 className="text-sm sm:text-base font-medium text-gray-900">
                                                {typeData.type.replace('_', ' ')}
                                            </h4>
                                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                                typeData.overallTrend === 'improving' ? 'bg-green-100 text-green-800' :
                                                typeData.overallTrend === 'declining' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {typeData.overallTrend}
                                            </span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={120}>
                                            <LineChart data={typeData.periods}>
                                                <XAxis dataKey="period" hide />
                                                <YAxis hide domain={[0, 1]} />
                                                <Tooltip 
                                                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Accuracy']}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="value" 
                                                    stroke={PREDICTION_TYPE_COLORS[typeData.type]}
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {activeTab === 'breakdown' && accuracyBreakdown && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Accuracy by Confidence */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
                        >
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Accuracy by Confidence Level</h3>
                            <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
                                <BarChart data={Object.entries(accuracyBreakdown.byConfidence).map(([range, stats]) => ({
                                    range,
                                    accuracy: stats.accuracy,
                                    count: stats.totalPredictions
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" fontSize={10} angle={-45} textAnchor="end" height={60} />
                                    <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} fontSize={12} />
                                    <Tooltip 
                                        formatter={(value: number, name: string) => [
                                            name === 'accuracy' ? `${(value * 100).toFixed(1)}%` : value.toString(),
                                            name === 'accuracy' ? 'Accuracy' : 'Count'
                                        ]}
                                    />
                                    <Bar dataKey="accuracy" fill="#8B5CF6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Weekly Performance */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
                        >
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Performance by Week</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={Object.entries(accuracyBreakdown.byWeek).map(([week, stats]) => ({
                                    week: parseInt(week),
                                    accuracy: stats.accuracy,
                                    count: stats.totalPredictions
                                })).sort((a, b) => a.week - b.week)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" fontSize={12} />
                                    <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} fontSize={12} />
                                    <Tooltip 
                                        formatter={(value: number, name: string) => [
                                            name === 'accuracy' ? `${(value * 100).toFixed(1)}%` : value.toString(),
                                            name === 'accuracy' ? 'Accuracy' : 'Predictions'
                                        ]}
                                    />
                                    <Bar dataKey="accuracy" fill="#10B981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </div>
                )}

                {activeTab === 'insights' && (
                    <div className="space-y-4 sm:space-y-6">
                        {isLoadingInsights ? (
                            <div className="flex items-center justify-center h-48 sm:h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            </div>
                        ) : advancedInsights ? (
                            <>
                                {/* Recommendations */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
                                >
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                                    <div className="space-y-3 sm:space-y-4">
                                        {advancedInsights.recommendations.map((rec, index) => (
                                            <div 
                                                key={index}
                                                className={`p-3 sm:p-4 rounded-lg border-l-4 ${
                                                    rec.type === 'WARNING' ? 'bg-red-50 border-red-400' :
                                                    rec.type === 'OPPORTUNITY' ? 'bg-green-50 border-green-400' :
                                                    rec.type === 'IMPROVEMENT' ? 'bg-blue-50 border-blue-400' :
                                                    'bg-purple-50 border-purple-400'
                                                }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm sm:text-base font-medium text-gray-900">{rec.title}</h4>
                                                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                                                        <div className="mt-2">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {rec.priority} priority
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-left sm:text-right sm:ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            +{(rec.expectedImpact * 100).toFixed(0)}% impact
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {rec.timeframe}
                                                        </div>
                                                    </div>
                                                </div>
                                                {rec.actionItems.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-sm font-medium text-gray-700 mb-1">Action Items:</p>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {rec.actionItems.map((item, itemIndex) => (
                                                                <li key={itemIndex} className="text-xs sm:text-sm text-gray-600">{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Streak Analysis */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
                                >
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Streak Analysis</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div className="text-center">
                                            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                                                {advancedInsights.streakAnalysis.currentStreak}
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-600 mt-1">Current Streak</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl sm:text-3xl font-bold text-green-600">
                                                {advancedInsights.streakAnalysis.longestStreak}
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-600 mt-1">Longest Streak</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                                                {(advancedInsights.streakAnalysis.streakProbability * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-600 mt-1">Continue Probability</div>
                                        </div>
                                    </div>
                                    
                                    {advancedInsights.streakAnalysis.maintainanceStrategies.length > 0 && (
                                        <div className="mt-4 sm:mt-6">
                                            <h4 className="font-medium text-gray-900 mb-2">Maintenance Strategies</h4>
                                            <ul className="space-y-1">
                                                {advancedInsights.streakAnalysis.maintainanceStrategies.map((strategy, index) => (
                                                    <li key={index} className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                                                        <FiCheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                        <span>{strategy}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </motion.div>
                            </>
                        ) : (
                            <div className="text-center py-8 sm:py-12">
                                <FiActivity className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Insights Available</h3>
                                <p className="text-sm sm:text-base text-gray-600">Make more predictions to generate advanced insights.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'comparison' && performanceComparison && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
                    >
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {formatChange(performanceComparison.accuracyChange)}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-1">Accuracy Change</div>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {formatChange(performanceComparison.confidenceChange / 100)}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-1">Confidence Change</div>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {performanceComparison.volumeChange > 0 ? '+' : ''}{performanceComparison.volumeChange}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-1">Volume Change</div>
                            </div>
                        </div>

                        {performanceComparison.significantImprovements.length > 0 && (
                            <div className="mt-4 sm:mt-6">
                                <h4 className="font-medium text-gray-900 mb-2">Significant Improvements</h4>
                                <ul className="space-y-1">
                                    {performanceComparison.significantImprovements.map((improvement, index) => (
                                        <li key={index} className="flex items-center space-x-2 text-xs sm:text-sm text-green-600">
                                            <FiTrendingUp className="h-4 w-4 flex-shrink-0" />
                                            <span>{improvement}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {performanceComparison.areasOfConcern.length > 0 && (
                            <div className="mt-4 sm:mt-6">
                                <h4 className="font-medium text-gray-900 mb-2">Areas of Concern</h4>
                                <ul className="space-y-1">
                                    {performanceComparison.areasOfConcern.map((concern, index) => (
                                        <li key={index} className="flex items-center space-x-2 text-xs sm:text-sm text-red-600">
                                            <FiTrendingDown className="h-4 w-4 flex-shrink-0" />
                                            <span>{concern}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className={modalClasses.overlay}>
                    <div className={`${modalClasses.content} ${isMobile ? 'p-4' : 'p-6'} w-full max-w-sm sm:max-w-md`}>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Export Analytics Data</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="export-format" className="block text-sm font-medium text-gray-700 mb-2">
                                    Export Format
                                </label>
                                <select id="export-format" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mobile-touch-target">
                                    <option value="json">JSON</option>
                                    <option value="csv">CSV</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors mobile-touch-target"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExport}
                                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mobile-touch-target"
                            >
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HistoricalAnalyticsView;
