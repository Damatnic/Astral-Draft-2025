/**
 * Enhanced Matchup Analytics Hook
 * Provides advanced matchup analysis data and state management
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  MatchupTrend, 
  DefensiveHeatMap, 
  WeatherTrendAnalysis,
  enhancedMatchupAnalyticsService 
} from '../services/enhancedMatchupAnalyticsService';

interface EnhancedMatchupAnalyticsState {
  trends: MatchupTrend[];
  defensiveHeatMap: DefensiveHeatMap | null;
  weatherAnalysis: WeatherTrendAnalysis | null;
  loading: boolean;
  error: string | null;
}

interface UseEnhancedMatchupAnalyticsProps {
  playerId: string;
  position?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useEnhancedMatchupAnalytics = ({
  playerId,
  position = 'WR',
  autoRefresh = false,
  refreshInterval = 300000 // 5 minutes
}: UseEnhancedMatchupAnalyticsProps) => {
  const [state, setState] = useState<EnhancedMatchupAnalyticsState>({
    trends: [],
    defensiveHeatMap: null,
    weatherAnalysis: null,
    loading: true,
    error: null
  });

  const loadAnalyticsData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      // Load core analytics data in parallel
      const [
        trendsData,
        weatherData
      ] = await Promise.all([
        enhancedMatchupAnalyticsService.generateMatchupTrends(playerId, 2),
        enhancedMatchupAnalyticsService.analyzeWeatherTrends(playerId)
      ]);

      // Load defensive heat map for most recent opponent
      let defensiveData: DefensiveHeatMap | null = null;

      if (trendsData.length > 0) {
        const recentOpponent = trendsData[trendsData.length - 1].opponent;
        defensiveData = await enhancedMatchupAnalyticsService.generateDefensiveHeatMap(recentOpponent, position);
      }

      setState(prev => ({
        ...prev,
        trends: trendsData,
        weatherAnalysis: weatherData,
        defensiveHeatMap: defensiveData,
        loading: false,
        error: null
      }));

    } catch (err) {
      console.error('Error loading enhanced matchup analytics:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load matchup analysis data'
      }));
    }
  }, [playerId, position]);

  // Initial data load
  useEffect(() => {
    if (playerId) {
      loadAnalyticsData();
    }
  }, [playerId, loadAnalyticsData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !playerId) return;

    const interval = setInterval(() => {
      loadAnalyticsData(false); // Don't show loading spinner for background refresh
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadAnalyticsData, playerId]);

  // Helper function to get correlation strength
  const getCorrelationStrength = (value: number): string => {
    const abs = Math.abs(value);
    if (abs > 0.7) return 'strong';
    if (abs > 0.4) return 'moderate';
    return 'weak';
  };

  // Derived analytics calculations
  const analytics = {
    // Trend analysis
    trendDirection: getTrendDirection(state.trends),
    averagePoints: state.trends.length > 0 
      ? state.trends.reduce((sum, t) => sum + t.fantasyPoints, 0) / state.trends.length 
      : 0,
    consistency: calculateConsistency(state.trends),
    
    // Performance splits
    gameScriptPerformance: calculateGameScriptPerformance(state.trends),
    
    // Matchup difficulty
    averageDefensiveRank: state.trends.length > 0 
      ? state.trends.reduce((sum, t) => sum + t.defensiveRank, 0) / state.trends.length 
      : 0,
    hardestMatchup: state.trends.length > 0 
      ? Math.min(...state.trends.map(t => t.defensiveRank)) 
      : 0,
    easiestMatchup: state.trends.length > 0 
      ? Math.max(...state.trends.map(t => t.defensiveRank)) 
      : 0,
    
    // Volume analysis
    averageTouches: state.trends.length > 0 
      ? state.trends.reduce((sum, t) => sum + t.touches, 0) / state.trends.length 
      : 0,
    highVolumeGames: state.trends.filter(t => t.touches >= 20).length,
    
    // Efficiency metrics
    averageEfficiency: state.trends.length > 0 
      ? state.trends.reduce((sum, t) => sum + t.efficiency, 0) / state.trends.length 
      : 0,
    bestEfficiency: state.trends.length > 0 
      ? Math.max(...state.trends.map(t => t.efficiency)) 
      : 0,
    
    // Correlations
    correlations: calculateCorrelations(state.trends, getCorrelationStrength),
    
    // Weather sensitivity
    weatherSensitivity: state.weatherAnalysis?.predictedImpact.expectedImpact === 'negative' ? 'high' : 'low'
  };

  return {
    ...state,
    analytics,
    refresh: () => loadAnalyticsData(),
    refreshSilent: () => loadAnalyticsData(false)
  };
};

// Helper functions
function getTrendDirection(trends: MatchupTrend[]): 'up' | 'down' | 'stable' {
  if (trends.length < 3) return 'stable';
  
  const recent = trends.slice(-5);
  const firstHalf = recent.slice(0, 3).reduce((sum, d) => sum + d.fantasyPoints, 0) / 3;
  const secondHalf = recent.slice(-3).reduce((sum, d) => sum + d.fantasyPoints, 0) / 3;
  
  const difference = secondHalf - firstHalf;
  if (difference > 2) return 'up';
  if (difference < -2) return 'down';
  return 'stable';
}

function calculateConsistency(trends: MatchupTrend[]): number {
  if (trends.length < 2) return 0;
  
  const mean = trends.reduce((sum, t) => sum + t.fantasyPoints, 0) / trends.length;
  const variance = trends.reduce((sum, t) => sum + Math.pow(t.fantasyPoints - mean, 2), 0) / trends.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Return consistency as percentage (100 - coefficient of variation)
  return Math.max(0, 100 - (standardDeviation / mean * 100));
}

function calculateGameScriptPerformance(trends: MatchupTrend[]) {
  const gameScripts = ['positive', 'neutral', 'negative'] as const;
  
  return gameScripts.reduce((acc, script) => {
    const games = trends.filter(t => t.gameScript === script);
    acc[script] = {
      games: games.length,
      averagePoints: games.length > 0 
        ? games.reduce((sum, t) => sum + t.fantasyPoints, 0) / games.length 
        : 0,
      percentage: trends.length > 0 ? (games.length / trends.length) * 100 : 0
    };
    return acc;
  }, {} as Record<typeof gameScripts[number], { games: number; averagePoints: number; percentage: number }>);
}

function calculateCorrelations(trends: MatchupTrend[], getStrength: (value: number) => string) {
  if (trends.length < 5) return null;

  const defensiveRankCorr = calculateCorrelation(
    trends.map(t => t.defensiveRank),
    trends.map(t => t.fantasyPoints)
  );

  const touchesCorr = calculateCorrelation(
    trends.map(t => t.touches),
    trends.map(t => t.fantasyPoints)
  );

  return {
    defensiveRank: {
      value: defensiveRankCorr,
      strength: getStrength(defensiveRankCorr),
      direction: defensiveRankCorr < 0 ? 'negative' : 'positive'
    },
    touches: {
      value: touchesCorr,
      strength: getStrength(touchesCorr),
      direction: touchesCorr > 0 ? 'positive' : 'negative'
    }
  };
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

export default useEnhancedMatchupAnalytics;
