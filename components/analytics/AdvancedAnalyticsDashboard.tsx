/**
 * Advanced Analytics Dashboard Component
 * Comprehensive visualization of advanced statistical modeling and external data sources
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, Brain, Activity, Users, Cloud, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/ShadcnTabs';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { 
    PredictionFactors, 
    oracleAdvancedAnalyticsService 
} from '../../services/oracleAdvancedAnalyticsService';

interface AdvancedAnalyticsDashboardProps {
    playerId: string;
    week: number;
    predictionFactors: PredictionFactors | null;
    onRefresh: () => void;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
    playerId,
    week,
    predictionFactors,
    onRefresh
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [compositeScore, setCompositeScore] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Calculate composite score when prediction factors change
    useEffect(() => {
        if (predictionFactors) {
            calculateCompositeScore();
        }
    }, [predictionFactors]);

    const calculateCompositeScore = async () => {
        if (!predictionFactors) return;
        
        setIsLoading(true);
        try {
            const score = await oracleAdvancedAnalyticsService.calculateAdvancedCompositeScore(predictionFactors);
            setCompositeScore(score);
        } catch (error) {
            console.error('Failed to calculate composite score:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Prepare chart data
    const playerMetricsData = useMemo(() => {
        if (!predictionFactors) return [];
        
        const metrics = predictionFactors.playerMetrics;
        return [
            { name: 'Efficiency Rating', value: metrics.playerEfficiencyRating, max: 150 },
            { name: 'Target Share', value: metrics.targetShare * 100, max: 35 },
            { name: 'Red Zone Share', value: metrics.redZoneTargetShare * 100, max: 40 },
            { name: 'Snap %', value: metrics.snapCountPercentage * 100, max: 100 },
            { name: 'Separation', value: metrics.separationRating, max: 5 },
            { name: 'YAC', value: metrics.yardsAfterContact, max: 8 }
        ];
    }, [predictionFactors]);

    const teamChemistryData = useMemo(() => {
        if (!predictionFactors) return [];
        
        const team = predictionFactors.teamMetrics;
        return [
            { subject: 'Team Chemistry', A: team.teamChemistryScore, fullMark: 100 },
            { subject: 'Offensive Chemistry', A: team.offlineChemistry, fullMark: 100 },
            { subject: 'Passing Chemistry', A: team.passingChemistry, fullMark: 100 },
            { subject: 'Run Blocking', A: team.runBlockingChemistry, fullMark: 100 },
            { subject: 'Defensive Chemistry', A: team.defensiveChemistry, fullMark: 100 },
            { subject: 'Morale', A: team.locker_roomMorale, fullMark: 100 }
        ];
    }, [predictionFactors]);

    const marketSentimentData = useMemo(() => {
        if (!predictionFactors) return [];
        
        const market = predictionFactors.marketData;
        return [
            { name: 'Media Sentiment', value: (market.mediaSentimentScore + 1) * 50, color: '#22c55e' },
            { name: 'Social Buzz', value: market.socialMediaBuzz, color: '#3b82f6' },
            { name: 'Injury Sentiment', value: (market?.injuryReportSentiment + 1) * 50, color: '#f59e0b' },
            { name: 'Reporter Confidence', value: market.beatReporterConfidence * 100, color: '#8b5cf6' }
        ];
    }, [predictionFactors]);

    const ensembleModelData = useMemo(() => {
        if (!predictionFactors) return [];
        
        return predictionFactors.ensemblePrediction.modelPredictions.map((model: any) => ({
            name: model.model,
            prediction: model.prediction,
            weight: model.weight * 100,
            confidence: model.confidence * 100
        }));
    }, [predictionFactors]);

    const regressionFactorsData = useMemo(() => {
        if (!predictionFactors) return [];
        
        return predictionFactors.regressionAnalysis.significantFactors.map((factor: any) => ({
            name: factor.factor,
            coefficient: Math.abs(factor.coefficient),
            impact: factor.impact,
            pValue: factor.pValue,
            significance: factor.pValue < 0.01 ? 'High' : factor.pValue < 0.05 ? 'Medium' : 'Low'
        }));
    }, [predictionFactors]);

    const environmentalFactors = useMemo(() => {
        if (!predictionFactors) return [];
        
        const env = predictionFactors.externalFactors;
        return [
            { name: 'Temperature', value: env.detailedWeather.temperature, unit: '°F', ideal: [65, 75] },
            { name: 'Wind Speed', value: env.detailedWeather.windSpeed, unit: 'mph', ideal: [0, 10] },
            { name: 'Humidity', value: env.detailedWeather.humidity, unit: '%', ideal: [40, 60] },
            { name: 'Rest Days', value: env.restDays, unit: 'days', ideal: [6, 9] },
            { name: 'Travel Distance', value: env.travelDistance, unit: 'miles', ideal: [0, 500] }
        ];
    }, [predictionFactors]);

    if (!predictionFactors) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Advanced Analytics Dashboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Generate an advanced prediction to view detailed analytics.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Header with Composite Score */}
            <Card className="w-full">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            Advanced Analytics Dashboard
                        </CardTitle>
                        <button
                            onClick={onRefresh}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? '🔄' : '↻'} Refresh
                        </button>
                    </div>
                </CardHeader>
                <CardContent>
                    {compositeScore && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">
                                    {(compositeScore.score * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600">Composite Score</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">
                                    {(compositeScore.confidence * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600">Confidence Level</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">
                                    {predictionFactors.ensemblePrediction.prediction.toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-600">Predicted Points</div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1">
                    <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                    <TabsTrigger value="player" className="text-xs sm:text-sm">Player</TabsTrigger>
                    <TabsTrigger value="team" className="text-xs sm:text-sm">Team</TabsTrigger>
                    <TabsTrigger value="models" className="text-xs sm:text-sm">Models</TabsTrigger>
                    <TabsTrigger value="market" className="text-xs sm:text-sm">Market</TabsTrigger>
                    <TabsTrigger value="environment" className="text-xs sm:text-sm">Environment</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Key Insights */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Target className="h-4 w-4" />
                                    Key Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {compositeScore && (
                                    <div className="space-y-2 sm:space-y-3">
                                        {compositeScore.reasoning.map((reason: string, index: number) => (
                                            <div key={index} className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs sm:text-sm">{reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Prediction Range */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Activity className="h-4 w-4" />
                                    Prediction Range
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                                        <span className="text-xs sm:text-sm text-gray-600">Ensemble Prediction</span>
                                        <span className="text-base sm:text-lg font-semibold">
                                            {predictionFactors.ensemblePrediction.prediction.toFixed(1)} pts
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm space-y-1 sm:space-y-0">
                                            <span>Range</span>
                                            <span>
                                                {predictionFactors.ensemblePrediction.predictionRange[0].toFixed(1)} - {predictionFactors.ensemblePrediction.predictionRange[1].toFixed(1)} pts
                                            </span>
                                        </div>
                                        <Progress 
                                            value={(predictionFactors.ensemblePrediction.prediction / 25) * 100} 
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="mt-3 sm:mt-4">
                                        <h4 className="text-sm sm:text-base font-medium mb-2">Key Drivers:</h4>
                                        <div className="flex flex-wrap gap-1 sm:gap-2">
                                            {predictionFactors.ensemblePrediction.keyDrivers.map((driver, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {driver}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Score Breakdown */}
                    {compositeScore && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">Score Component Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={Object.entries(compositeScore.breakdown).map(([key, value]) => ({
                                        name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                                        score: Number(value) * 100
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                                        <YAxis domain={[0, 100]} fontSize={12} />
                                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']} />
                                        <Bar dataKey="score" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Player Metrics Tab */}
                <TabsContent value="player" className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Efficiency Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">Player Efficiency Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={playerMetricsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} fontSize={10} />
                                        <YAxis fontSize={12} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#22c55e" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Situational Performance */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">Situational Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                                        <span className="text-xs sm:text-sm">Red Zone Efficiency</span>
                                        <span className="text-sm sm:text-base font-semibold">
                                            {(predictionFactors.playerMetrics.redZoneEfficiency * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <Progress value={predictionFactors.playerMetrics.redZoneEfficiency * 100} />

                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                                        <span className="text-xs sm:text-sm">Fourth Quarter Performance</span>
                                        <span className="text-sm sm:text-base font-semibold">
                                            {predictionFactors.playerMetrics.fourthQuarterPerformance.toFixed(2)}x
                                        </span>
                                    </div>
                                    <Progress value={(predictionFactors.playerMetrics.fourthQuarterPerformance - 0.8) / 0.5 * 100} />

                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                                        <span className="text-xs sm:text-sm">Prime Time Performance</span>
                                        <span className="text-sm sm:text-base font-semibold">
                                            {predictionFactors.playerMetrics.primeTimePerformance.toFixed(2)}x
                                        </span>
                                    </div>
                                    <Progress value={(predictionFactors.playerMetrics.primeTimePerformance - 0.7) / 0.7 * 100} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Advanced Receiving Metrics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Advanced Receiving Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {(predictionFactors.playerMetrics.contestedCatchRate * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-gray-600">Contested Catch Rate</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {(predictionFactors.playerMetrics.dropsPerTarget * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-gray-600">Drop Rate</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {predictionFactors.playerMetrics.averageTargetDepth.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-gray-600">Avg Target Depth</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {predictionFactors.playerMetrics.separationRating.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-gray-600">Separation Rating</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Team Analytics Tab */}
                <TabsContent value="team" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Team Chemistry Radar */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Team Chemistry Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={teamChemistryData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                        <Radar name="Chemistry" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Offensive/Defensive Efficiency */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Efficiency Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span>Offensive Efficiency</span>
                                            <span>{(predictionFactors.teamMetrics.offensiveEfficiency * 100).toFixed(1)}%</span>
                                        </div>
                                        <Progress value={predictionFactors.teamMetrics.offensiveEfficiency * 100} />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span>Defensive Efficiency</span>
                                            <span>{(predictionFactors.teamMetrics.defensiveEfficiency * 100).toFixed(1)}%</span>
                                        </div>
                                        <Progress value={predictionFactors.teamMetrics.defensiveEfficiency * 100} />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span>Red Zone Efficiency</span>
                                            <span>{(predictionFactors.teamMetrics.redZoneEfficiency * 100).toFixed(1)}%</span>
                                        </div>
                                        <Progress value={predictionFactors.teamMetrics.redZoneEfficiency * 100} />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span>Special Teams Efficiency</span>
                                            <span>{(predictionFactors.teamMetrics.specialTeamsEfficiency * 100).toFixed(1)}%</span>
                                        </div>
                                        <Progress value={predictionFactors.teamMetrics.specialTeamsEfficiency * 100} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* EPA Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Expected Points Added (EPA) Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${predictionFactors.teamMetrics.passingEpa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {predictionFactors.teamMetrics.passingEpa >= 0 ? '+' : ''}{predictionFactors.teamMetrics.passingEpa.toFixed(3)}
                                    </div>
                                    <div className="text-sm text-gray-600">Passing EPA</div>
                                    {predictionFactors.teamMetrics.passingEpa >= 0 ? (
                                        <TrendingUp className="h-4 w-4 text-green-600 mx-auto mt-1" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-600 mx-auto mt-1" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${predictionFactors.teamMetrics.rushingEpa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {predictionFactors.teamMetrics.rushingEpa >= 0 ? '+' : ''}{predictionFactors.teamMetrics.rushingEpa.toFixed(3)}
                                    </div>
                                    <div className="text-sm text-gray-600">Rushing EPA</div>
                                    {predictionFactors.teamMetrics.rushingEpa >= 0 ? (
                                        <TrendingUp className="h-4 w-4 text-green-600 mx-auto mt-1" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-600 mx-auto mt-1" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {predictionFactors.teamMetrics.homeFieldAdvantage.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-gray-600">Home Field Advantage</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Ensemble Models Tab */}
                <TabsContent value="models" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Model Predictions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ensemble Model Predictions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={ensembleModelData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="prediction" fill="#8b5cf6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Model Weights */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Model Weights & Confidence</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {ensembleModelData.map((model, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="font-medium">{model.name}</span>
                                                <span className="text-sm text-gray-600">
                                                    Weight: {model.weight.toFixed(1)}% | Confidence: {model.confidence.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Progress value={model.weight} className="h-2" />
                                                <Progress value={model.confidence} className="h-2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Regression Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Regression Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium mb-3">Model Statistics</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>R-squared</span>
                                            <span className="font-semibold">
                                                {predictionFactors.regressionAnalysis.rSquared.toFixed(3)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Standard Error</span>
                                            <span className="font-semibold">
                                                {predictionFactors.regressionAnalysis.standardError.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Confidence Interval</span>
                                            <span className="font-semibold">
                                                [{predictionFactors.regressionAnalysis.confidenceInterval[0].toFixed(1)}, {predictionFactors.regressionAnalysis.confidenceInterval[1].toFixed(1)}]
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-3">Significant Factors</h4>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={regressionFactorsData} layout="horizontal">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={120} fontSize={10} />
                                            <Tooltip />
                                            <Bar dataKey="coefficient">
                                                {regressionFactorsData.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.impact === 'POSITIVE' ? '#22c55e' : '#ef4444'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Market Data Tab */}
                <TabsContent value="market" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Market Sentiment */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Market Sentiment Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={marketSentimentData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Sentiment']} />
                                        <Bar dataKey="value" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* DFS Market Data */}
                        <Card>
                            <CardHeader>
                                <CardTitle>DFS Market Indicators</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {(Object.values(predictionFactors.marketData.dfsOwnershipProjections)[0] * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-gray-600">Projected Ownership</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {Object.values(predictionFactors.marketData.dfsProjectedScores)[0].toFixed(1)}
                                        </div>
                                        <div className="text-sm text-gray-600">DFS Projected Score</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {Object.values(predictionFactors.marketData.dfsPriceValue)[0].toFixed(2)}x
                                        </div>
                                        <div className="text-sm text-gray-600">Price Value</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Betting Market */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Betting Market Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-lg font-bold">
                                        {predictionFactors.marketData.spreadMovement[0] >= 0 ? '+' : ''}{predictionFactors.marketData.spreadMovement[0].toFixed(1)}
                                    </div>
                                    <div className="text-sm text-gray-600">Opening Spread</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold">
                                        {predictionFactors.marketData.spreadMovement[1] >= 0 ? '+' : ''}{predictionFactors.marketData.spreadMovement[1].toFixed(1)}
                                    </div>
                                    <div className="text-sm text-gray-600">Current Spread</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold">
                                        {predictionFactors.marketData.totalMovement[0].toFixed(1)}
                                    </div>
                                    <div className="text-sm text-gray-600">Opening Total</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold">
                                        {predictionFactors.marketData.totalMovement[1].toFixed(1)}
                                    </div>
                                    <div className="text-sm text-gray-600">Current Total</div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex justify-between mb-2">
                                    <span>Public Betting %</span>
                                    <span>{(predictionFactors.marketData.publicBettingPercentage * 100).toFixed(1)}%</span>
                                </div>
                                <Progress value={predictionFactors.marketData.publicBettingPercentage * 100} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Environment Tab */}
                <TabsContent value="environment" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Weather Conditions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cloud className="h-4 w-4" />
                                    Weather Conditions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    {environmentalFactors.map((factor, index) => (
                                        <div key={index} className="text-center">
                                            <div className="text-xl font-bold">
                                                {factor.value.toFixed(1)} {factor.unit}
                                            </div>
                                            <div className="text-sm text-gray-600 mb-2">{factor.name}</div>
                                            <div className="text-xs text-gray-500">
                                                Ideal: {factor.ideal[0]}-{factor.ideal[1]} {factor.unit}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stadium & Travel */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Stadium & Travel Factors
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span>Stadium Type</span>
                                        <Badge variant="outline">
                                            {predictionFactors.externalFactors.stadiumType}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Field Type</span>
                                        <Badge variant="outline">
                                            {predictionFactors.externalFactors.fieldType}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Elevation</span>
                                        <span>{predictionFactors.externalFactors.elevation.toFixed(0)} ft</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Travel Distance</span>
                                        <span>{predictionFactors.externalFactors.travelDistance.toFixed(0)} miles</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Time Zone Changes</span>
                                        <span>{predictionFactors.externalFactors.timeZoneChanges}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Game Context */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base sm:text-lg">Game Context Factors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                <div className="text-center">
                                    <div className={`text-base sm:text-lg font-bold ${predictionFactors.externalFactors.thursdayNightGame ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {predictionFactors.externalFactors.thursdayNightGame ? 'YES' : 'NO'}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600">Thursday Night</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-base sm:text-lg font-bold ${predictionFactors.externalFactors.mondayNightGame ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {predictionFactors.externalFactors.mondayNightGame ? 'YES' : 'NO'}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600">Monday Night</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-base sm:text-lg font-bold text-green-600">
                                        {predictionFactors.externalFactors.restDays}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600">Rest Days</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-base sm:text-lg font-bold text-purple-600">
                                        {predictionFactors.externalFactors.crowdNoise.toFixed(0)} dB
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600">Crowd Noise</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdvancedAnalyticsDashboard;
