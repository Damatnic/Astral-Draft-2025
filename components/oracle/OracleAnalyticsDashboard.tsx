import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { Widget } from '../ui/Widget';
import { ZapIcon } from '../icons/ZapIcon';
import { useAppState } from '../../contexts/AppContext';
import { oracleAnalyticsService, type OracleAnalytics, type OraclePerformanceMetrics, type UserInsight } from '../../services/oracleAnalyticsService';
import AdvancedEnsembleMLDashboard from './AdvancedEnsembleMLDashboard';

interface PerformanceChartProps {
    data: Array<{ week: number; accuracy: number; userWins: number; totalPredictions: number }>;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
    const maxAccuracy = Math.max(...data.map((d: any) => d.accuracy), 1);
    const maxUserWins = Math.max(...data.map((d: any) => d.userWins), 1);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Weekly Performance Trends</span>
                <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-gray-400">Oracle Accuracy</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-gray-400">Your Wins</span>
                    </div>
                </div>
            </div>
            
            <div className="relative h-32 bg-gray-800/30 rounded-lg p-3">
                <div className="flex items-end justify-between h-full space-x-2">
                    {data.map((item, index) => (
                        <div key={item.week} className="flex-1 flex flex-col items-center">
                            <div className="flex flex-col space-y-1 w-full">
                                {/* Oracle accuracy bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(item.accuracy / maxAccuracy) * 60}px` }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-blue-500 rounded-sm"
                                    title={`Oracle: ${(item.accuracy * 100).toFixed(1)}% accurate`}
                                />
                                {/* User wins bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(item.userWins / maxUserWins) * 40}px` }}
                                    transition={{ delay: index * 0.1 + 0.2 }}
                                    className="bg-green-500 rounded-sm"
                                    title={`You: ${item.userWins} wins`}
                                />
                            </div>
                            <span className="text-xs text-gray-500 mt-1">W{item.week}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface ConfidenceAnalysisProps {
    confidenceByType: Record<string, number>;
    typeAccuracy: Record<string, number>;
}

const ConfidenceAnalysis: React.FC<ConfidenceAnalysisProps> = ({ confidenceByType, typeAccuracy }) => {
    const predictionTypes = Object.keys(confidenceByType);

    return (
        <div className="space-y-4">
            <span className="text-sm text-gray-400">Prediction Type Analysis</span>
            <div className="space-y-3">
                {predictionTypes.map((type) => {
                    const confidence = confidenceByType[type] || 0;
                    const accuracy = typeAccuracy[type] || 0;
                    const isWellCalibrated = Math.abs(confidence - accuracy * 100) < 10;
                    
                    return (
                        <div key={type} className="bg-gray-800/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white capitalize">
                                    {type.toLowerCase().replace('_', ' ')}
                                </span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400">
                                        {confidence.toFixed(1)}% conf
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {(accuracy * 100).toFixed(1)}% acc
                                    </span>
                                    {isWellCalibrated && (
                                        <span className="text-xs text-green-400">✓ Calibrated</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex space-x-2">
                                {/* Confidence bar */}
                                <div className="flex-1">
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${confidence}%` }}
                                            className="bg-blue-500 h-2 rounded-full"
                                        />
                                    </div>
                                </div>
                                {/* Accuracy bar */}
                                <div className="flex-1">
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${accuracy * 100}%` }}
                                            className="bg-green-500 h-2 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface InsightCardProps {
    insight: UserInsight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
    const getInsightIcon = (type: UserInsight['type']) => {
        switch (type) {
            case 'SUCCESS_PATTERN':
                return '🎯';
            case 'IMPROVEMENT_AREA':
                return '📈';
            case 'STREAK_POTENTIAL':
                return '🔥';
            case 'RECOMMENDATION':
                return '💡';
            default:
                return '📊';
        }
    };

    const getInsightColor = (type: UserInsight['type']) => {
        switch (type) {
            case 'SUCCESS_PATTERN':
                return 'border-green-500/40 bg-green-500/10';
            case 'IMPROVEMENT_AREA':
                return 'border-yellow-500/40 bg-yellow-500/10';
            case 'STREAK_POTENTIAL':
                return 'border-red-500/40 bg-red-500/10';
            case 'RECOMMENDATION':
                return 'border-blue-500/40 bg-blue-500/10';
            default:
                return 'border-gray-500/40 bg-gray-500/10';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-lg p-3 ${getInsightColor(insight.type)}`}
        >
            <div className="flex items-start space-x-3">
                <span className="text-lg">{getInsightIcon(insight.type)}</span>
                <div className="flex-1">
                    <h4 className="font-medium text-white text-sm">{insight.title}</h4>
                    <p className="text-xs text-gray-300 mt-1">{insight.description}</p>
                </div>
            </div>
        </motion.div>
    );
};

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
    title, 
    value, 
    subtitle, 
    trend = 'neutral',
    color = 'text-blue-400'
}) => {
    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return '↗️';
            case 'down':
                return '↘️';
            default:
                return '';
        }
    };

    return (
        <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">{title}</span>
                {trend !== 'neutral' && (
                    <span className="text-xs">{getTrendIcon()}</span>
                )}
            </div>
            <div className={`text-2xl font-bold ${color}`}>
                {typeof value === 'number' && value < 1 && value > 0 
                    ? `${(value * 100).toFixed(1)}%`
                    : value
                }
            </div>
            {subtitle && (
                <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
            )}
        </div>
    );
};

export const OracleAnalyticsDashboard: React.FC = () => {
    const { dispatch } = useAppState();
    const [analytics, setAnalytics] = React.useState<OracleAnalytics | null>(null);
    const [performanceMetrics, setPerformanceMetrics] = React.useState<OraclePerformanceMetrics | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isTrainingModels, setIsTrainingModels] = React.useState(false);

    React.useEffect(() => {
        const loadAnalytics = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [analyticsData, metricsData] = await Promise.all([
                    oracleAnalyticsService.getAnalytics(),
                    oracleAnalyticsService.getOraclePerformanceMetrics()
                ]);
                
                setAnalytics(analyticsData);
                setPerformanceMetrics(metricsData);
            } catch (err) {
                console.error('Failed to load Oracle analytics:', err);
                setError('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, []);

    const handleTrainModels = async () => {
        setIsTrainingModels(true);
        try {
            // Import the advanced analytics service dynamically to avoid circular deps
            const { oracleAdvancedAnalyticsService } = await import('../../services/oracleAdvancedAnalyticsService');
            
            // Generate mock historical training data
            const mockHistoricalData = Array.from({ length: 150 }, (_, i) => ({
                week: Math.floor(i / 10) + 1,
                predictionType: ['player_performance', 'game_outcome', 'weekly_scoring'][i % 3],
                prediction: 12 + Math.random() * 16,
                actualResult: 12 + Math.random() * 16,
                confidence: 0.6 + Math.random() * 0.3,
                factors: {
                    playerMetrics: {
                        recentPerformance: [15 + Math.random() * 10],
                        positionRank: Math.floor(Math.random() * 32) + 1,
                        targetShare: Math.random() * 0.4,
                        matchupDifficulty: Math.random()
                    },
                    teamMetrics: {
                        offensiveRank: Math.floor(Math.random() * 32) + 1,
                        defensiveRank: Math.floor(Math.random() * 32) + 1,
                        recentForm: [Math.random() > 0.5 ? 1 : 0, Math.random() > 0.5 ? 1 : 0]
                    },
                    externalFactors: {
                        weather: [65 + Math.random() * 20, Math.random() * 0.5, Math.random() * 15],
                        restDays: Math.floor(Math.random() * 10) + 3,
                        gameImportance: Math.random()
                    }
                },
                timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            }));

            await oracleAdvancedAnalyticsService.trainEnsembleModels(mockHistoricalData);
            
            // Show success message
            alert('✅ Ensemble models trained successfully with ' + mockHistoricalData.length + ' data points!');
        } catch (error) {
            console.error('Training failed:', error);
            alert('❌ Model training failed. Check console for details.');
        } finally {
            setIsTrainingModels(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !analytics || !performanceMetrics) {
        return (
            <div className="space-y-6">
                <Widget title="Analytics Dashboard" className="bg-gray-900/50">
                    <div className="text-center py-8">
                        <ZapIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">
                            {error || 'No analytics data available yet'}
                        </p>
                        <p className="text-sm text-gray-500">
                            Complete some Oracle challenges to see your analytics
                        </p>
                    </div>
                </Widget>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="flex items-center justify-between mb-4">
                    <div></div> {/* Spacer */}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                            <ZapIcon className="text-blue-400" />
                            Oracle Analytics Dashboard
                        </h2>
                        <p className="text-gray-400">
                            Deep insights into your Oracle challenge performance
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleTrainModels}
                            disabled={isTrainingModels}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isTrainingModels ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Training...</span>
                                </>
                            ) : (
                                <>
                                    <Brain className="w-4 h-4" />
                                    <span>Train Models</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'HISTORICAL_ANALYTICS' })}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center space-x-2"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Historical</span>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    title="Overall Accuracy"
                    value={performanceMetrics.overallAccuracy}
                    subtitle="Oracle predictions"
                    color="text-blue-400"
                />
                <MetricCard
                    title="Your Win Rate"
                    value={analytics.userWinRate}
                    subtitle={`${analytics.totalUserChallenges} challenges`}
                    color="text-green-400"
                />
                <MetricCard
                    title="Prediction Quality"
                    value={performanceMetrics.calibrationScore}
                    subtitle="Confidence calibration"
                    color="text-purple-400"
                />
                <MetricCard
                    title="Confidence Correlation"
                    value={performanceMetrics.confidenceCorrelation}
                    subtitle="Accuracy vs confidence"
                    color="text-yellow-400"
                />
            </div>

            {/* Advanced Machine Learning Dashboard */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <AdvancedEnsembleMLDashboard />
            </motion.div>

            {/* Performance Trends */}
            <Widget title="Performance Trends" className="bg-gray-900/50">
                {analytics.accuracyTrends.length > 0 ? (
                    <PerformanceChart data={analytics.accuracyTrends} />
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <p>Complete challenges across multiple weeks to see trends</p>
                    </div>
                )}
            </Widget>

            {/* Prediction Type Analysis */}
            <Widget title="Prediction Analysis by Type" className="bg-gray-900/50">
                {Object.keys(analytics.confidenceByType).length > 0 ? (
                    <ConfidenceAnalysis 
                        confidenceByType={analytics.confidenceByType}
                        typeAccuracy={performanceMetrics.typeAccuracy}
                    />
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <p>Complete more challenges to see detailed type analysis</p>
                    </div>
                )}
            </Widget>

            {/* Top Prediction Types */}
            <Widget title="Your Strongest Categories" className="bg-gray-900/50">
                <div className="space-y-3">
                    {analytics.topPredictionTypes.length > 0 ? (
                        (() => {
                            const sortedTypes = [...analytics.topPredictionTypes].sort((a, b) => b.userSuccessRate - a.userSuccessRate);
                            return sortedTypes.slice(0, 3).map((type, index) => (
                                <motion.div
                                    key={type.type}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-lg font-bold text-gray-400">
                                            #{index + 1}
                                        </span>
                                        <div>
                                            <span className="text-white font-medium capitalize">
                                                {type.type.toLowerCase().replace('_', ' ')}
                                            </span>
                                            <div className="text-xs text-gray-400">
                                                {type.totalPredictions} predictions
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 font-bold">
                                            {(type.userSuccessRate * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            vs Oracle: {(type.accuracy * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </motion.div>
                            ));
                        })()
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>Complete more challenges to see your strongest categories</p>
                        </div>
                    )}
                </div>
            </Widget>

            {/* Personalized Insights */}
            <Widget title="Personalized Insights" className="bg-gray-900/50">
                <div className="space-y-3">
                    {analytics.userInsights.length > 0 ? (
                        analytics.userInsights.map((insight) => (
                            <InsightCard key={`${insight.type}-${insight.title}`} insight={insight} />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>Complete more challenges to unlock personalized insights</p>
                        </div>
                    )}
                </div>
            </Widget>

            {/* Summary Stats */}
            <Widget title="Session Summary" className="bg-gray-900/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                            {analytics.totalPredictions}
                        </div>
                        <div className="text-sm text-gray-400">Oracle Predictions</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                            {analytics.totalUserChallenges}
                        </div>
                        <div className="text-sm text-gray-400">Your Challenges</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                            {Object.keys(analytics.confidenceByType).length}
                        </div>
                        <div className="text-sm text-gray-400">Prediction Types</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                            {analytics.userInsights.length}
                        </div>
                        <div className="text-sm text-gray-400">Active Insights</div>
                    </div>
                </div>
            </Widget>
        </div>
    );
};

export default OracleAnalyticsDashboard;
