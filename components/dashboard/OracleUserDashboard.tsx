/**
 * Comprehensive Oracle User Dashboard
 * Displays prediction history, accuracy metrics, and personalized insights
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Widget } from '../ui/Widget';
import { 
    TrophyIcon, 
    Target, 
    TrendingUp, 
    BarChart3, 
    Activity,
    Award,
    Flame,
    Star,
    Eye,
    Brain
} from 'lucide-react';

interface UserStats {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    totalPoints: number;
    rank: number;
    weeklyAccuracy: { week: number; accuracy: number; predictions: number }[];
    categoryAccuracy: { category: string; accuracy: number; total: number }[];
    streaks: {
        current: number;
        longest: number;
        type: 'correct' | 'incorrect' | 'none';
    };
    confidence: {
        average: number;
        calibration: number;
        overconfidence: number;
    };
}

interface PredictionHistory {
    id: string;
    week: number;
    question: string;
    userChoice: number;
    oracleChoice: number;
    confidence: number;
    actualResult?: number;
    isResolved: boolean;
    isCorrect?: boolean;
    points: number;
    submittedAt: string;
    category: string;
}

interface PersonalizedInsight {
    type: 'strength' | 'improvement' | 'trend' | 'recommendation';
    title: string;
    description: string;
    actionable?: string;
    priority: 'high' | 'medium' | 'low';
    metric?: number;
}

const OracleUserDashboard: React.FC = () => {
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [predictionHistory, setPredictionHistory] = useState<PredictionHistory[]>([]);
    const [insights, setInsights] = useState<PersonalizedInsight[]>([]);
    const [timeframe, setTimeframe] = useState<'week' | 'month' | 'season' | 'all'>('season');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Mock data generation for demonstration
    useEffect(() => {
        const generateMockData = () => {
            // Generate user stats
            const mockStats: UserStats = {
                totalPredictions: 47,
                correctPredictions: 32,
                accuracy: 68.1,
                totalPoints: 320,
                rank: 15,
                weeklyAccuracy: [
                    { week: 1, accuracy: 75, predictions: 8 },
                    { week: 2, accuracy: 62.5, predictions: 8 },
                    { week: 3, accuracy: 70, predictions: 10 },
                    { week: 4, accuracy: 66.7, predictions: 9 },
                    { week: 5, accuracy: 72.7, predictions: 11 },
                    { week: 6, accuracy: 63.6, predictions: 11 }
                ],
                categoryAccuracy: [
                    { category: 'Player Performance', accuracy: 71.4, total: 14 },
                    { category: 'Game Outcomes', accuracy: 66.7, total: 18 },
                    { category: 'Statistical Milestones', accuracy: 70.0, total: 10 },
                    { category: 'Team Performance', accuracy: 60.0, total: 5 }
                ],
                streaks: {
                    current: 3,
                    longest: 7,
                    type: 'correct'
                },
                confidence: {
                    average: 72.5,
                    calibration: 0.85,
                    overconfidence: 4.5
                }
            };

            // Generate prediction history
            const mockHistory: PredictionHistory[] = Array.from({ length: 20 }, (_, i) => {
                const randomResult = Math.random();
                let actualResult: number | undefined;
                
                if (randomResult > 0.3) {
                    actualResult = Math.random() > 0.5 ? 1 : 0;
                } else {
                    actualResult = undefined;
                }

                return {
                    id: `pred_${i + 1}`,
                    week: Math.floor(i / 3) + 1,
                    question: [
                        'Will Josh Allen throw for 300+ yards?',
                        'Will the Chiefs win by 7+ points?',
                        'Will Davante Adams score 2+ TDs?',
                        'Will the game total exceed 47.5 points?',
                        'Will Christian McCaffrey rush for 100+ yards?',
                        'Will Mahomes throw an interception?',
                        'Will the Eagles cover the spread?'
                    ][i % 7],
                    userChoice: Math.random() > 0.5 ? 1 : 0,
                    oracleChoice: Math.random() > 0.5 ? 1 : 0,
                    confidence: Math.floor(Math.random() * 40) + 60,
                    actualResult,
                    isResolved: Math.random() > 0.2,
                    isCorrect: Math.random() > 0.32,
                    points: Math.random() > 0.32 ? 10 : 0,
                    submittedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                    category: ['Player Performance', 'Game Outcomes', 'Statistical Milestones', 'Team Performance'][i % 4]
                };
            });

            // Generate personalized insights
            const mockInsights: PersonalizedInsight[] = [
                {
                    type: 'strength',
                    title: 'Player Performance Expert',
                    description: 'You excel at predicting individual player performances with 71.4% accuracy',
                    priority: 'high',
                    metric: 71.4
                },
                {
                    type: 'trend',
                    title: 'Improving Accuracy',
                    description: 'Your accuracy has improved 8.2% over the last 3 weeks',
                    priority: 'medium',
                    metric: 8.2
                },
                {
                    type: 'improvement',
                    title: 'Confidence Calibration',
                    description: 'Consider lowering confidence on game outcome predictions',
                    actionable: 'Your average confidence is 4.5% higher than your accuracy in this category',
                    priority: 'medium',
                    metric: 4.5
                },
                {
                    type: 'recommendation',
                    title: 'Focus on Statistical Milestones',
                    description: 'You show strong potential in milestone predictions but have limited attempts',
                    actionable: 'Try making more predictions in this category to boost your overall accuracy',
                    priority: 'low'
                }
            ];

            setUserStats(mockStats);
            setPredictionHistory(mockHistory);
            setInsights(mockInsights);
            setIsLoading(false);
        };

        generateMockData();
    }, []);

    // Filter predictions based on timeframe and category
    const filteredHistory = useMemo(() => {
        if (!predictionHistory) return [];

        let filtered = predictionHistory;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter((p: any) => p.category === selectedCategory);
        }

        // Filter by timeframe
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (timeframe) {
            case 'week':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                cutoffDate.setMonth(now.getMonth() - 1);
                break;
            case 'season':
                cutoffDate.setMonth(now.getMonth() - 4); // Approximate season start
                break;
            default:
                cutoffDate.setFullYear(2020); // All time
        }

        return filtered.filter((p: any) => new Date(p.submittedAt) >= cutoffDate);
    }, [predictionHistory, timeframe, selectedCategory]);

    if (isLoading || !userStats) {
        return (
            <Widget title="Oracle Dashboard">
                <div className="p-6 text-center">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                        <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto"></div>
                    </div>
                </div>
            </Widget>
        );
    }

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 70) return 'text-green-500';
        if (accuracy >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'strength': return <Star className="w-4 h-4 text-yellow-500" />;
            case 'trend': return <TrendingUp className="w-4 h-4 text-blue-500" />;
            case 'improvement': return <Target className="w-4 h-4 text-orange-500" />;
            case 'recommendation': return <Brain className="w-4 h-4 text-purple-500" />;
            default: return <Eye className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="oracle-user-dashboard space-y-6">
            {/* Dashboard Header */}
            <div className="dashboard-header">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-500" />
                        Oracle Dashboard
                    </h2>
                    
                    <div className="flex items-center gap-2">
                        <select 
                            value={timeframe} 
                            onChange={(e: any) => setTimeframe(e.target.value as any)}
                            className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600 text-sm"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="season">This Season</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Key Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Widget title="Overall Accuracy">
                    <div className="p-4 text-center">
                        <div className={`text-3xl font-bold ${getAccuracyColor(userStats.accuracy)}`}>
                            {userStats.accuracy}%
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                            {userStats.correctPredictions}/{userStats.totalPredictions} correct
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-2 text-xs">
                            <TrophyIcon className="w-3 h-3" />
                            Rank #{userStats.rank}
                        </div>
                    </div>
                </Widget>

                <Widget title="Current Streak">
                    <div className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <Flame className={`w-6 h-6 ${userStats.streaks.current >= 3 ? 'text-orange-500' : 'text-gray-400'}`} />
                            <span className="text-2xl font-bold text-white">
                                {userStats.streaks.current}
                            </span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                            {userStats.streaks.type === 'correct' ? 'Correct' : 'Incorrect'} predictions
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Best: {userStats.streaks.longest}
                        </div>
                    </div>
                </Widget>

                <Widget title="Total Points">
                    <div className="p-4 text-center">
                        <div className="text-3xl font-bold text-blue-500">
                            {userStats.totalPoints}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                            +{Math.round(userStats.totalPoints / userStats.totalPredictions)} avg per prediction
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-2 text-xs">
                            <Award className="w-3 h-3" />
                            Oracle Points
                        </div>
                    </div>
                </Widget>

                <Widget title="Confidence">
                    <div className="p-4 text-center">
                        <div className="text-3xl font-bold text-purple-500">
                            {userStats.confidence.average}%
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                            Average confidence
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Calibration: {Math.round(userStats.confidence.calibration * 100)}%
                        </div>
                    </div>
                </Widget>
            </div>

            {/* Category Performance */}
            <Widget title="Performance by Category">
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userStats.categoryAccuracy.map((category) => {
                            const isSelected = selectedCategory === category.category;
                            const borderClass = isSelected 
                                ? 'border-blue-500 bg-blue-500/10' 
                                : 'border-gray-600 hover:border-gray-500';
                            
                            return (
                                <button
                                    key={category.category}
                                    className={`p-3 rounded-lg border transition-colors ${borderClass}`}
                                    onClick={() => setSelectedCategory(
                                        isSelected ? 'all' : category.category
                                    )}
                                    type="button"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium text-white">{category.category}</span>
                                        </div>
                                        <div className={`font-bold ${getAccuracyColor(category.accuracy)}`}>
                                            {category.accuracy}%
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {Math.round(category.accuracy * category.total / 100)} correct out of {category.total}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Widget>

            {/* Weekly Accuracy Trend */}
            <Widget title="Weekly Accuracy Trend">
                <div className="p-4">
                    <div className="flex items-end gap-2 h-32">
                        {userStats.weeklyAccuracy.map((week) => {
                            let bgColorClass = 'bg-red-500';
                            if (week.accuracy >= 70) {
                                bgColorClass = 'bg-green-500';
                            } else if (week.accuracy >= 60) {
                                bgColorClass = 'bg-yellow-500';
                            }

                            return (
                                <div key={week.week} className="flex-1 flex flex-col items-center">
                                    <div 
                                        className={`w-full rounded-t transition-all ${bgColorClass}`}
                                        style={{ height: `${week.accuracy}%` }}
                                    />
                                    <div className="text-xs text-gray-400 mt-1">W{week.week}</div>
                                    <div className="text-xs text-gray-500">{week.accuracy}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Widget>

            {/* Personalized Insights */}
            <Widget title="Personalized Insights">
                <div className="p-4 space-y-3">
                    {insights.map((insight) => {
                        let borderClass = 'border-blue-500 bg-blue-500/10';
                        if (insight.priority === 'high') {
                            borderClass = 'border-red-500 bg-red-500/10';
                        } else if (insight.priority === 'medium') {
                            borderClass = 'border-yellow-500 bg-yellow-500/10';
                        }

                        return (
                            <div 
                                key={insight.title}
                                className={`p-3 rounded-lg border-l-4 ${borderClass}`}
                            >
                                <div className="flex items-start gap-3">
                                    {getInsightIcon(insight.type)}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-white">{insight.title}</h4>
                                            {Boolean(insight.metric) && (
                                                <span className="text-sm font-bold text-white">
                                                    {insight.metric}%
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-300 mt-1">{insight.description}</p>
                                        {insight.actionable && (
                                            <p className="text-xs text-gray-400 mt-2 italic">
                                                💡 {insight.actionable}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Widget>

            {/* Recent Prediction History */}
            <Widget title={selectedCategory !== 'all' ? `Recent Predictions (${selectedCategory})` : 'Recent Predictions'}>
                <div className="p-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredHistory.slice(0, 10).map((prediction) => (
                            <div 
                                key={prediction.id}
                                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white">
                                            {prediction.question}
                                        </span>
                                        {prediction.isResolved && (
                                            <span className={`px-2 py-1 text-xs rounded ${
                                                prediction.isCorrect 
                                                    ? 'bg-green-500/20 text-green-400' 
                                                    : 'bg-red-500/20 text-red-400'
                                            }`}>
                                                {prediction.isCorrect ? 'Correct' : 'Incorrect'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                        <span>Week {prediction.week}</span>
                                        <span>Confidence: {prediction.confidence}%</span>
                                        <span>Category: {prediction.category}</span>
                                        {prediction.isResolved && (
                                            <span className="text-blue-400">+{prediction.points} pts</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-400">
                                        {new Date(prediction.submittedAt).toLocaleDateString()}
                                    </div>
                                    {!prediction.isResolved && (
                                        <div className="text-xs text-yellow-500">Pending</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {filteredHistory.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No predictions found for the selected filters</p>
                        </div>
                    )}
                </div>
            </Widget>
        </div>
    );
};

export default OracleUserDashboard;
