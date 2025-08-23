/**
 * Oracle Historical Analytics Overview
 * Simplified overview component for historical analytics without external dependencies
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useHistoricalAnalytics, TimeframeType } from '../hooks/useHistoricalAnalytics';
import { PredictionType } from '../services/oraclePredictionService';
import {
    StatCard,
    SimpleLineChart,
    SimpleBarChart,
    LoadingSpinner,
    ErrorDisplay,
    TrendIndicator,
    TargetIcon,
    ActivityIcon,
    ZapIcon,
    BrainIcon,
    BarChartIcon,
    TrendingUpIcon,
    DownloadIcon,
    RefreshIcon
} from '../components/analytics/AnalyticsComponents';

const PREDICTION_TYPE_COLORS: Record<PredictionType, string> = {
    'PLAYER_PERFORMANCE': 'bg-purple-600',
    'GAME_OUTCOME': 'bg-blue-600',
    'WEEKLY_SCORING': 'bg-green-600',
    'WEATHER_IMPACT': 'bg-yellow-600',
    'INJURY_IMPACT': 'bg-red-600',
    'TEAM_PERFORMANCE': 'bg-indigo-600'
};

interface HistoricalAnalyticsOverviewProps {
    className?: string;
}

export function HistoricalAnalyticsOverview({ className = '' }: Readonly<HistoricalAnalyticsOverviewProps>) {
    const {
        trendAnalysis,
        advancedInsights,
        isLoading,
        isLoadingTrends,
        isLoadingInsights,
        error,
        refreshAnalytics,
        analyzeTimeframe,
        exportData,
        getOverallStats,
        getTypePerformance,
        getRecentPerformance
    } = useHistoricalAnalytics();

    const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>('monthly');
    const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'insights'>('overview');

    const overallStats = getOverallStats();
    const typePerformance = getTypePerformance();
    const recentPerformance = getRecentPerformance(30);

    const handleTimeframeChange = async (timeframe: TimeframeType) => {
        setSelectedTimeframe(timeframe);
        await analyzeTimeframe(timeframe);
    };

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
        { id: 'overview', label: 'Overview', icon: BarChartIcon },
        { id: 'trends', label: 'Trends', icon: TrendingUpIcon },
        { id: 'insights', label: 'Insights', icon: BrainIcon }
    ];

    if (error) {
        return (
            <div className={`p-6 ${className}`}>
                <ErrorDisplay error={error} onRetry={refreshAnalytics} />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Oracle Historical Analytics</h1>
                    <p className="text-gray-600 mt-1">
                        Track prediction accuracy, analyze trends, and gain insights from historical performance
                    </p>
                </div>
                
                <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                    <select
                        value={selectedTimeframe}
                        onChange={(e) => handleTimeframeChange(e.target.value as TimeframeType)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="seasonal">Seasonal</option>
                        <option value="yearly">Yearly</option>
                    </select>
                    
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <DownloadIcon />
                        <span>Export</span>
                    </button>
                    
                    <button
                        onClick={refreshAnalytics}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshIcon className={isLoading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Overall Accuracy"
                    value={formatAccuracy(overallStats.overallAccuracy)}
                    change={formatChange(recentPerformance.improvement) + " from last 30 days"}
                    changeType={recentPerformance.improvement >= 0 ? 'positive' : 'negative'}
                    icon={<TargetIcon className="h-6 w-6 text-purple-600" />}
                    iconBgColor="bg-purple-100"
                    delay={0}
                />

                <StatCard
                    title="Total Predictions"
                    value={overallStats.totalPredictions.toLocaleString()}
                    change={`${recentPerformance.predictions} in last 30 days`}
                    changeType="neutral"
                    icon={<ActivityIcon className="h-6 w-6 text-blue-600" />}
                    iconBgColor="bg-blue-100"
                    delay={0.1}
                />

                <StatCard
                    title="Current Streak"
                    value={overallStats.currentStreak.toString()}
                    change={`Best: ${overallStats.longestStreak} correct`}
                    changeType="neutral"
                    icon={<ZapIcon className="h-6 w-6 text-green-600" />}
                    iconBgColor="bg-green-100"
                    delay={0.2}
                />

                <StatCard
                    title="Avg Confidence"
                    value={`${overallStats.averageConfidence.toFixed(0)}%`}
                    change="Calibration pending analysis"
                    changeType="neutral"
                    icon={<BrainIcon className="h-6 w-6 text-orange-600" />}
                    iconBgColor="bg-orange-100"
                    delay={0.3}
                />
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Accuracy Trend Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-lg border border-gray-200 p-6"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accuracy Trend</h3>
                            {isLoadingTrends ? (
                                <div className="h-64 flex items-center justify-center">
                                    <LoadingSpinner />
                                </div>
                            ) : (
                                <>
                                    {trendAnalysis ? (
                                        <SimpleLineChart 
                                            data={trendAnalysis.accuracyTrend}
                                            height={250}
                                            color="#8B5CF6"
                                        />
                                    ) : (
                                        <div className="h-64 flex items-center justify-center text-gray-500">
                                            No trend data available
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>

                        {/* Type Performance */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-lg border border-gray-200 p-6"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Type</h3>
                            <SimpleBarChart
                                data={Object.entries(typePerformance).map(([type, stats]) => ({
                                    label: type.replace('_', ' '),
                                    value: stats.accuracy,
                                    color: PREDICTION_TYPE_COLORS[type as PredictionType]
                                }))}
                                height={300}
                            />
                        </motion.div>
                    </div>
                )}

                {activeTab === 'trends' && trendAnalysis && (
                    <div className="space-y-6">
                        {/* Confidence Trend */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-lg border border-gray-200 p-6"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Trend</h3>
                            <SimpleLineChart 
                                data={trendAnalysis.confidenceTrend}
                                height={300}
                                color="#06B6D4"
                            />
                        </motion.div>

                        {/* Type Performance Trends */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-lg border border-gray-200 p-6"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Type Performance Trends</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {trendAnalysis.typesPerformance.map((typeData) => (
                                    <div key={typeData.type} className="p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-gray-900">
                                                {typeData.type.replace('_', ' ')}
                                            </h4>
                                            <TrendIndicator 
                                                value={typeData.trendStrength}
                                                label={typeData.overallTrend}
                                                showIcon={false}
                                            />
                                        </div>
                                        <SimpleLineChart
                                            data={typeData.periods}
                                            height={150}
                                            color="#10B981"
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {activeTab === 'insights' && (
                    <div className="space-y-6">
                        {isLoadingInsights ? (
                            <div className="flex items-center justify-center h-64">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <>
                                {advancedInsights ? (
                            <>
                                {/* Recommendations */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-lg border border-gray-200 p-6"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                                    <div className="space-y-4">
                                        {advancedInsights.recommendations.map((rec, index) => {
                                            let recBgClass: string;
                                            switch (rec.type) {
                                                case 'WARNING':
                                                    recBgClass = 'bg-red-50 border-red-400';
                                                    break;
                                                case 'OPPORTUNITY':
                                                    recBgClass = 'bg-green-50 border-green-400';
                                                    break;
                                                case 'IMPROVEMENT':
                                                    recBgClass = 'bg-blue-50 border-blue-400';
                                                    break;
                                                default:
                                                    recBgClass = 'bg-purple-50 border-purple-400';
                                            }
                                            
                                            let priorityClass: string;
                                            switch (rec.priority) {
                                                case 'high':
                                                    priorityClass = 'bg-red-100 text-red-800';
                                                    break;
                                                case 'medium':
                                                    priorityClass = 'bg-yellow-100 text-yellow-800';
                                                    break;
                                                default:
                                                    priorityClass = 'bg-gray-100 text-gray-800';
                                            }
                                            
                                            return (
                                                <div 
                                                    key={`recommendation-${rec.title}-${index}`}
                                                    className={`p-4 rounded-lg border-l-4 ${recBgClass}`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900">{rec.title}</h4>
                                                            <p className="text-gray-600 mt-1">{rec.description}</p>
                                                            <div className="mt-2">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityClass}`}>
                                                                    {rec.priority} priority
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-4">
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
                                                                    <li key={`action-${rec.title}-${itemIndex}`} className="text-sm text-gray-600">{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>

                                {/* Streak Analysis */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white rounded-lg border border-gray-200 p-6"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Streak Analysis</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-purple-600">
                                                {advancedInsights.streakAnalysis.currentStreak}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">Current Streak</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-green-600">
                                                {advancedInsights.streakAnalysis.longestStreak}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">Longest Streak</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-blue-600">
                                                {(advancedInsights.streakAnalysis.streakProbability * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">Continue Probability</div>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                                ) : (
                                    <div className="text-center py-12">
                                        <BrainIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Available</h3>
                                        <p className="text-gray-600">Make more predictions to generate advanced insights.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistoricalAnalyticsOverview;