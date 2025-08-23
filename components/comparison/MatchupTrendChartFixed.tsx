/**
 * Enhanced Matchup Trend Visualization Component
 * Advanced charts for displaying historical matchup performance trends
 */

import React, { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Area,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import Tabs from '../ui/Tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Cloud, 
  Wind, 
  Droplets,
  Target,
  Shield,
  BarChart3
} from 'lucide-react';
import { 
  MatchupTrend, 
  DefensiveHeatMap, 
  WeatherTrendAnalysis,
  enhancedMatchupAnalyticsService 
} from '../../services/enhancedMatchupAnalyticsService';

interface MatchupTrendChartProps {
  playerId: string;
  playerName: string;
  className?: string;
}

interface ChartDataPoint extends MatchupTrend {
  formattedWeek: string;
  difficultyColor: string;
  weatherIcon: string;
}

// Move tooltip component outside to avoid lint issues
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload as ChartDataPoint;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-600">vs {data.opponent}</p>
        <p className="text-lg font-bold text-blue-600">{data.fantasyPoints.toFixed(1)} pts</p>
        <p className="text-sm">Touches: {data.touches}</p>
        <p className="text-sm">Efficiency: {data.efficiency.toFixed(2)}</p>
        <p className="text-sm">Def Rank: #{data.defensiveRank}</p>
        <p className="text-sm">Game Script: {data.gameScript}</p>
        {data.weather && <p className="text-sm">Weather: {data.weatherIcon}</p>}
      </div>
    );
  }
  return null;
};

const MatchupTrendChart: React.FC<MatchupTrendChartProps> = ({
  playerId,
  playerName,
  className = ''
}) => {
  const [trends, setTrends] = useState<MatchupTrend[]>([]);
  const [defensiveHeatMap, setDefensiveHeatMap] = useState<DefensiveHeatMap | null>(null);
  const [weatherAnalysis, setWeatherAnalysis] = useState<WeatherTrendAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('trends');

  useEffect(() => {
    loadMatchupData();
  }, [playerId]);

  const loadMatchupData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [trendsData, weatherData] = await Promise.all([
        enhancedMatchupAnalyticsService.generateMatchupTrends(playerId, 2),
        enhancedMatchupAnalyticsService.analyzeWeatherTrends(playerId)
      ]);

      setTrends(trendsData);
      setWeatherAnalysis(weatherData);

      // Load defensive heat map for most recent opponent
      if (trendsData.length > 0) {
        const recentOpponent = trendsData[trendsData.length - 1].opponent;
        const position = 'WR'; // Mock position
        const heatMapData = await enhancedMatchupAnalyticsService.generateDefensiveHeatMap(recentOpponent, position);
        setDefensiveHeatMap(heatMapData);
      }
    } catch (err) {
      console.error('Error loading matchup data:', err);
      setError('Failed to load matchup analysis data');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (): ChartDataPoint[] => {
    return trends.map((trend: any) => ({
      ...trend,
      formattedWeek: `W${trend.week}`,
      difficultyColor: getDifficultyColor(trend.defensiveRank),
      weatherIcon: getWeatherIcon(trend.weather)
    }));
  };

  const getDifficultyColor = (defensiveRank: number): string => {
    if (defensiveRank <= 8) return '#dc2626'; // red - hard matchup
    if (defensiveRank <= 16) return '#f59e0b'; // yellow - moderate
    if (defensiveRank <= 24) return '#22c55e'; // green - easier
    return '#16a34a'; // dark green - easy
  };

  const getWeatherIcon = (weather?: string): string => {
    switch (weather) {
      case 'rain': return '🌧️';
      case 'snow': return '❄️';
      case 'wind': return '💨';
      case 'fog': return '🌫️';
      default: return '☀️';
    }
  };

  const getTrendDirection = (data: ChartDataPoint[]): 'up' | 'down' | 'stable' => {
    if (data.length < 3) return 'stable';
    
    const recent = data.slice(-5);
    const firstHalf = recent.slice(0, 3).reduce((sum, d) => sum + d.fantasyPoints, 0) / 3;
    const secondHalf = recent.slice(-3).reduce((sum, d) => sum + d.fantasyPoints, 0) / 3;
    
    const difference = secondHalf - firstHalf;
    if (difference > 2) return 'up';
    if (difference < -2) return 'down';
    return 'stable';
  };

  const getBadgeVariant = (direction: string) => {
    switch (direction) {
      case 'up': return 'default';
      case 'down': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDefensiveBadgeVariant = (rank: number) => {
    if (rank <= 10) return 'destructive';
    if (rank <= 20) return 'default';
    return 'secondary';
  };

  const chartData = prepareChartData();
  const trendDirection = getTrendDirection(chartData);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Loading Matchup Trends...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`enhanced-matchup-trends ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Enhanced Matchup Analysis - {playerName}
            </div>
            <div className="flex items-center gap-2">
              {trendDirection === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
              {trendDirection === 'down' && <TrendingDown className="h-5 w-5 text-red-600" />}
              {trendDirection === 'stable' && <Activity className="h-5 w-5 text-blue-600" />}
              <Badge variant={getBadgeVariant(trendDirection)}>
                {trendDirection} trend
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            items={[
              { id: 'trends', label: 'Performance Trends' },
              { id: 'defensive', label: 'Defensive Analysis' },
              { id: 'weather', label: 'Weather Impact' },
              { id: 'efficiency', label: 'Efficiency Metrics' }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="mt-6">
            {/* Performance Trends Tab */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formattedWeek" />
                      <YAxis yAxisId="points" orientation="left" />
                      <YAxis yAxisId="touches" orientation="right" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        yAxisId="points"
                        type="monotone"
                        dataKey="fantasyPoints"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Fantasy Points"
                      />
                      <Line
                        yAxisId="touches"
                        type="monotone"
                        dataKey="touches"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Touches"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Game Script Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Game Script Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {['positive', 'neutral', 'negative'].map((script: any) => {
                          const count = trends.filter((t: any) => t.gameScript === script).length;
                          const percentage = trends.length > 0 ? (count / trends.length * 100).toFixed(0) : '0';
                          return (
                            <div key={script} className="flex justify-between">
                              <span className="capitalize">{script}:</span>
                              <span className="font-medium">{count} ({percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Matchup Difficulty</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Avg Def Rank:</span>
                          <span className="font-medium">
                            #{trends.length > 0 ? (trends.reduce((sum, t) => sum + t.defensiveRank, 0) / trends.length).toFixed(0) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Toughest:</span>
                          <span className="font-medium">#{trends.length > 0 ? Math.min(...trends.map(t => t.defensiveRank)) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Easiest:</span>
                          <span className="font-medium">#{trends.length > 0 ? Math.max(...trends.map(t => t.defensiveRank)) : 'N/A'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Avg Points:</span>
                          <span className="font-medium">
                            {trends.length > 0 ? (trends.reduce((sum, t) => sum + t.fantasyPoints, 0) / trends.length).toFixed(1) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Best Game:</span>
                          <span className="font-medium">{trends.length > 0 ? Math.max(...trends.map(t => t.fantasyPoints)).toFixed(1) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Consistency:</span>
                          <span className="font-medium">
                            {trends.length > 0 ? (100 - (Math.sqrt(trends.reduce((sum, t) => sum + Math.pow(t.fantasyPoints - (trends.reduce((s, tr) => s + tr.fantasyPoints, 0) / trends.length), 2), 0) / trends.length) / (trends.reduce((sum, t) => sum + t.fantasyPoints, 0) / trends.length) * 100)).toFixed(0) : '0'}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Defensive Analysis Tab */}
            {activeTab === 'defensive' && defensiveHeatMap && (
              <div className="space-y-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={defensiveHeatMap.weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="fantasyPointsAllowed" name="Fantasy Points Allowed">
                        {defensiveHeatMap.weeklyTrends.map((entry, index) => {
                          let color = '#22c55e'; // green default
                          if (entry.fantasyPointsAllowed > 20) {
                            color = '#dc2626'; // red
                          } else if (entry.fantasyPointsAllowed > 15) {
                            color = '#f59e0b'; // yellow
                          }
                          return <Cell key={`cell-${entry.week}-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Defensive Stats vs {defensiveHeatMap.position}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Fantasy Points Allowed:</span>
                        <span className="font-medium">{defensiveHeatMap.vsPosition.fantasyPointsAllowed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>League Rank:</span>
                        <Badge variant={getDefensiveBadgeVariant(defensiveHeatMap.vsPosition.rank)}>
                          #{defensiveHeatMap.vsPosition.rank}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Yards Allowed:</span>
                        <span className="font-medium">
                          {(() => {
                            if (defensiveHeatMap.position === 'QB') return defensiveHeatMap.vsPosition.passingYards;
                            if (defensiveHeatMap.position === 'RB') return defensiveHeatMap.vsPosition.rushingYards;
                            return defensiveHeatMap.vsPosition.receivingYards;
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>TDs Allowed:</span>
                        <span className="font-medium">{defensiveHeatMap.vsPosition.touchdowns}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Home vs Away Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Home Games:</span>
                            <span className="font-medium">{defensiveHeatMap.seasonTotals.homeVsAway.home.toFixed(1)} pts</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(defensiveHeatMap.seasonTotals.homeVsAway.home / 25) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Away Games:</span>
                            <span className="font-medium">{defensiveHeatMap.seasonTotals.homeVsAway.away.toFixed(1)} pts</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-600 h-2 rounded-full"
                              style={{ width: `${(defensiveHeatMap.seasonTotals.homeVsAway.away / 25) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Weather Impact Tab */}
            {activeTab === 'weather' && weatherAnalysis && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Temperature Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Optimal Range:</span>
                        <span className="font-medium">
                          {weatherAnalysis.temperatureImpact.optimalRange.min}°-{weatherAnalysis.temperatureImpact.optimalRange.max}°F
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cold Weather:</span>
                        <span className={`font-medium ${weatherAnalysis.temperatureImpact.coldWeatherPerformance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {weatherAnalysis.temperatureImpact.coldWeatherPerformance > 0 ? '+' : ''}{weatherAnalysis.temperatureImpact.coldWeatherPerformance}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hot Weather:</span>
                        <span className={`font-medium ${weatherAnalysis.temperatureImpact.hotWeatherPerformance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {weatherAnalysis.temperatureImpact.hotWeatherPerformance > 0 ? '+' : ''}{weatherAnalysis.temperatureImpact.hotWeatherPerformance}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Wind className="h-4 w-4" />
                        Wind Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Threshold:</span>
                        <span className="font-medium">{weatherAnalysis.windImpact.threshold} mph</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pass Attempts:</span>
                        <span className="font-medium text-red-600">{weatherAnalysis.windImpact.passAttemptImpact}% per mph</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accuracy:</span>
                        <span className="font-medium text-red-600">{weatherAnalysis.windImpact.passingAccuracyImpact}% per mph</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Precipitation Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Fumbles:</span>
                        <span className="font-medium text-red-600">+{weatherAnalysis.precipitationImpact.fumblesIncreaseRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Passing:</span>
                        <span className="font-medium text-red-600">{weatherAnalysis.precipitationImpact.passingImpact}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Running:</span>
                        <span className={`font-medium ${weatherAnalysis.precipitationImpact.runningImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {weatherAnalysis.precipitationImpact.runningImpact > 0 ? '+' : ''}{weatherAnalysis.precipitationImpact.runningImpact}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Historical Weather Games</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart data={weatherAnalysis.historicalWeatherGames}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="temperature" name="Temperature" unit="°F" />
                          <YAxis dataKey="fantasyPoints" name="Fantasy Points" />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter name="Performance vs Temperature" fill="#8884d8" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Efficiency Metrics Tab */}
            {activeTab === 'efficiency' && (
              <div className="space-y-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formattedWeek" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Fantasy Points per Touch"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Efficiency Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Average Efficiency:</span>
                        <span className="font-medium">
                          {trends.length > 0 ? (trends.reduce((sum, t) => sum + t.efficiency, 0) / trends.length).toFixed(2) : 'N/A'} pts/touch
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Best Efficiency:</span>
                        <span className="font-medium text-green-600">
                          {trends.length > 0 ? Math.max(...trends.map((t: any) => t.efficiency)).toFixed(2) : 'N/A'} pts/touch
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Worst Efficiency:</span>
                        <span className="font-medium text-red-600">
                          {trends.length > 0 ? Math.min(...trends.map((t: any) => t.efficiency)).toFixed(2) : 'N/A'} pts/touch
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Efficiency Trend:</span>
                        <Badge variant={getBadgeVariant(trendDirection)}>
                          {trendDirection}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Touch Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>High Volume (20+ touches):</span>
                            <span className="font-medium">
                              {trends.filter((t: any) => t.touches >= 20).length} games
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${trends.length > 0 ? (trends.filter((t: any) => t.touches >= 20).length / trends.length) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Medium Volume (10-19 touches):</span>
                            <span className="font-medium">
                              {trends.filter(t => t.touches >= 10 && t.touches < 20).length} games
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-600 h-2 rounded-full"
                              style={{ width: `${trends.length > 0 ? (trends.filter(t => t.touches >= 10 && t.touches < 20).length / trends.length) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Low Volume (&lt;10 touches):</span>
                            <span className="font-medium">
                              {trends.filter(t => t.touches < 10).length} games
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-600 h-2 rounded-full"
                              style={{ width: `${trends.length > 0 ? (trends.filter(t => t.touches < 10).length / trends.length) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchupTrendChart;
