import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Target, Trophy, Zap, BarChart3, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { oracleApiClient } from '../../services/oracleApiClient';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface PerformanceData {
    predictionHistory: Array<{
        id: string;
        week: number;
        question: string;
        type: string;
        userChoice: number;
        oracleChoice: number;
        userConfidence: number;
        oracleConfidence: number;
        pointsEarned: number;
        submittedAt: string;
        isResolved: boolean;
        actualResult: number | null;
        isCorrect: boolean;
    }>;
    weeklyTrends: Array<{
        week: number;
        totalPredictions: number;
        correctPredictions: number;
        accuracy: number;
        totalPoints: number;
        currentStreak: number;
        oracleBeats: number;
    }>;
    typeBreakdown: Array<{
        type: string;
        totalPredictions: number;
        correctPredictions: number;
        accuracy: number;
        avgConfidence: number;
        totalPoints: number;
    }>;
    confidenceAnalysis: Array<{
        confidenceRange: string;
        totalPredictions: number;
        correctPredictions: number;
        accuracy: number;
        avgConfidence: number;
    }>;
}

interface GlobalAnalytics {
    globalStats: {
        totalUsers: number;
        totalPredictions: number;
        totalSubmissions: number;
        avgUserConfidence: number;
        avgOracleConfidence: number;
        userAccuracy: number;
        oracleAccuracy: number;
    };
    weeklyParticipation: Array<{
        week: number;
        predictionsCreated: number;
        totalSubmissions: number;
        activeUsers: number;
        avgConfidence: number;
    }>;
    typePopularity: Array<{
        type: string;
        totalPredictions: number;
        totalSubmissions: number;
        avgUserConfidence: number;
        uniqueParticipants: number;
    }>;
}

export const OracleAnalyticsDashboard: React.FC = () => {
    const { user } = useAuth();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 1024px)');
    
    const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
    const [globalData, setGlobalData] = useState<GlobalAnalytics | null>(null);
    const [leaderboardData, setLeaderboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<number>(2024);
    const [selectedWeeks, setSelectedWeeks] = useState<number>(10);

    useEffect(() => {
        if (user?.id) {
            loadAnalyticsData();
        }
    }, [user, selectedSeason, selectedWeeks]);

    const getPlayerNumber = (user: any): number => {
        if (user.isAdmin) return 0; // Admin is player 0 for Oracle
        const match = user.id.match(/player(\d+)/);
        return match ? parseInt(match[1]) : 1;
    };

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);
            setError(null);

            const playerNumber = getPlayerNumber(user!);

            const [performanceResponse, globalResponse, leaderboardResponse] = await Promise.all([
                oracleApiClient.getPerformanceAnalytics(playerNumber, { 
                    season: selectedSeason, 
                    weeks: selectedWeeks 
                }),
                oracleApiClient.getGlobalAnalytics({ 
                    season: selectedSeason, 
                    weeks: selectedWeeks 
                }),
                oracleApiClient.getLeaderboard(selectedSeason, undefined, 20)
            ]);

            if (performanceResponse.success) {
                setPerformanceData(performanceResponse.data);
            }

            if (globalResponse.success) {
                setGlobalData(globalResponse.data);
            }

            if (leaderboardResponse.success) {
                setLeaderboardData(leaderboardResponse.data);
            }

        } catch (err) {
            console.error('Error loading analytics data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const StatCard: React.FC<{
        title: string;
        value: string | number;
        description?: string;
        icon: React.ReactNode;
        trend?: 'up' | 'down' | 'neutral';
        trendValue?: string;
    }> = ({ title, value, description, icon, trend, trendValue }) => (
        <Card>
            <CardContent className="flex items-center p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
                        {description && (
                            <p className="text-xs text-gray-500 truncate">{description}</p>
                        )}
                        {trend && trendValue && (
                            <div className={`flex items-center text-xs ${
                                trend === 'up' ? 'text-green-600' : 
                                trend === 'down' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                                {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" /> : 
                                 trend === 'down' ? <TrendingDown className="w-3 h-3 mr-1 flex-shrink-0" /> : null}
                                <span className="truncate">{trendValue}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Oracle Analytics Dashboard</h1>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4 sm:p-6">
                                <div className="animate-pulse">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded mb-2"></div>
                                    <div className="w-16 sm:w-20 h-3 sm:h-4 bg-gray-200 rounded mb-1"></div>
                                    <div className="w-12 sm:w-16 h-5 sm:h-6 bg-gray-200 rounded"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6">
                <Card>
                    <CardContent className="p-4 sm:p-6 text-center">
                        <div className="text-red-500 mb-2">
                            <Activity className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-red-700">Error Loading Analytics</h3>
                        <p className="text-red-600 mt-2 text-sm sm:text-base break-words">{error}</p>
                        <button 
                            onClick={loadAnalyticsData}
                            className="mt-4 px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base font-medium min-h-[44px] min-w-[120px]"
                            aria-label="Retry loading analytics data"
                        >
                            Retry
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const currentUserRank = leaderboardData?.find((entry: any) => entry.playerNumber === getPlayerNumber(user!));

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Oracle Analytics Dashboard</h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                    <select 
                        value={selectedSeason} 
                        onChange={(e: any) => setSelectedSeason(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm sm:text-base min-h-[44px]"
                        aria-label="Select season"
                    >
                        <option value="2024">2024 Season</option>
                        <option value="2023">2023 Season</option>
                    </select>
                    <select 
                        value={selectedWeeks} 
                        onChange={(e: any) => setSelectedWeeks(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm sm:text-base min-h-[44px]"
                        aria-label="Select time range"
                    >
                        <option value="5">Last 5 Weeks</option>
                        <option value="10">Last 10 Weeks</option>
                        <option value="15">Last 15 Weeks</option>
                        <option value="20">All Season</option>
                    </select>
                </div>
            </div>

            {/* Key Performance Indicators */}
            {performanceData && globalData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard
                        title="Your Ranking"
                        value={currentUserRank ? `#${currentUserRank.rank}` : 'Unranked'}
                        description="Current position"
                        icon={<Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
                    />
                    <StatCard
                        title="Prediction Accuracy"
                        value={`${performanceData.weeklyTrends.length > 0 ? 
                            Math.round(performanceData.weeklyTrends.reduce((acc, w) => acc + w.accuracy, 0) / performanceData.weeklyTrends.length) 
                            : 0}%`}
                        description={`vs Oracle ${globalData.globalStats.oracleAccuracy}%`}
                        icon={<Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
                        trend={performanceData.weeklyTrends.length >= 2 ? 
                            (performanceData.weeklyTrends[0].accuracy > performanceData.weeklyTrends[1].accuracy ? 'up' : 'down') : 'neutral'}
                    />
                    <StatCard
                        title="Current Streak"
                        value={performanceData.weeklyTrends.length > 0 ? performanceData.weeklyTrends[0].currentStreak : 0}
                        description="Consecutive correct"
                        icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
                    />
                    <StatCard
                        title="Total Points"
                        value={performanceData.weeklyTrends.reduce((acc, w) => acc + w.totalPoints, 0)}
                        description={`${performanceData.predictionHistory.length} predictions`}
                        icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
                    />
                </div>
            )}

            {/* Performance Charts */}
            {performanceData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Weekly Accuracy Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-white text-base sm:text-lg">Weekly Accuracy Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                                <LineChart data={[...performanceData.weeklyTrends].reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="week" 
                                        fontSize={isMobile ? 10 : 12}
                                        tick={{ fontSize: isMobile ? 10 : 12 }}
                                    />
                                    <YAxis 
                                        fontSize={isMobile ? 10 : 12}
                                        tick={{ fontSize: isMobile ? 10 : 12 }}
                                    />
                                    <Tooltip />
                                    {!isMobile && <Legend />}
                                    <Line 
                                        type="monotone" 
                                        dataKey="accuracy" 
                                        stroke="#3B82F6" 
                                        strokeWidth={2}
                                        name="Accuracy %" 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Confidence vs Accuracy */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-white text-base sm:text-lg">Confidence vs Accuracy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                                <BarChart data={performanceData.confidenceAnalysis}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="confidenceRange" 
                                        fontSize={isMobile ? 10 : 12}
                                        tick={{ fontSize: isMobile ? 10 : 12 }}
                                        angle={isMobile ? -45 : 0}
                                        textAnchor={isMobile ? 'end' : 'middle'}
                                        height={isMobile ? 60 : 30}
                                    />
                                    <YAxis 
                                        fontSize={isMobile ? 10 : 12}
                                        tick={{ fontSize: isMobile ? 10 : 12 }}
                                    />
                                    <Tooltip />
                                    {!isMobile && <Legend />}
                                    <Bar dataKey="accuracy" fill="#10B981" name="Accuracy %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Points Progression */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-white text-base sm:text-lg">Points Progression</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                                <LineChart data={[...performanceData.weeklyTrends].reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="week" 
                                        fontSize={isMobile ? 10 : 12}
                                        tick={{ fontSize: isMobile ? 10 : 12 }}
                                    />
                                    <YAxis 
                                        fontSize={isMobile ? 10 : 12}
                                        tick={{ fontSize: isMobile ? 10 : 12 }}
                                    />
                                    <Tooltip />
                                    {!isMobile && <Legend />}
                                    <Line 
                                        type="monotone" 
                                        dataKey="totalPoints" 
                                        stroke="#F59E0B" 
                                        strokeWidth={2}
                                        name="Points Earned" 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Prediction Type Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-white text-base sm:text-lg">Performance by Prediction Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                                <BarChart data={performanceData.typeBreakdown}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="type" 
                                        fontSize={isMobile ? 10 : 12}
                                        tick={{ fontSize: isMobile ? 10 : 12 }}
                                        angle={isMobile ? -45 : 0}
                                        textAnchor={isMobile ? 'end' : 'middle'}
                                        height={isMobile ? 60 : 30}
                                    />
                                    <YAxis 
                                        fontSize={isMobile ? 10 : 12}
                                        tick={{ fontSize: isMobile ? 10 : 12 }}
                                    />
                                    <Tooltip />
                                    {!isMobile && <Legend />}
                                    <Bar dataKey="accuracy" fill="#8B5CF6" name="Accuracy %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Recent Activity */}
            {performanceData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-white text-base sm:text-lg">Recent Prediction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 sm:space-y-3">
                            {performanceData.predictionHistory.slice(0, isMobile ? 3 : 5).map((prediction) => (
                                <div key={prediction.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-2 sm:gap-0">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{prediction.question}</p>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            Week {prediction.week} • {prediction.type}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                                        <Badge variant={prediction.isCorrect ? "default" : "secondary"} className="text-xs">
                                            {prediction.userConfidence}% confidence
                                        </Badge>
                                        {prediction.isResolved && (
                                            <Badge variant={prediction.isCorrect ? "default" : "destructive"} className="text-xs">
                                                {prediction.isCorrect ? 'Correct' : 'Incorrect'}
                                            </Badge>
                                        )}
                                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                                            {prediction.pointsEarned} pts
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default OracleAnalyticsDashboard;
