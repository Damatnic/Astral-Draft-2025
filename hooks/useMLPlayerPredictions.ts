/**
 * React Hook for Machine Learning Player Predictions
 * Provides comprehensive ML-based player performance predictions with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { machineLearningPlayerPredictionService, type PlayerPredictionResult, type WeeklyRankings, type PlayerComparison, type ModelPerformanceMetrics } from '../services/machineLearningPlayerPredictionService';

export interface UseMLPlayerPredictionsState {
  // Prediction data
  prediction: PlayerPredictionResult | null;
  rankings: WeeklyRankings | null;
  comparison: PlayerComparison | null;
  
  // Loading states
  loading: boolean;
  loadingRankings: boolean;
  loadingComparison: boolean;
  
  // Error states
  error: string | null;
  
  // Service status
  serviceStatus: {
    isActive: boolean;
    modelsLoaded: number;
    cacheSize: number;
    lastPrediction: string;
    performanceMetrics: ModelPerformanceMetrics | null;
  };
}

export interface UseMLPlayerPredictionsActions {
  // Core prediction methods
  generatePrediction: (playerId: string, week: number, season?: number) => Promise<void>;
  generateRankings: (position: string, week: number, season?: number, limit?: number) => Promise<void>;
  comparePlayers: (playerId1: string, playerId2: string, week: number, season?: number) => Promise<void>;
  
  // Performance methods
  backtestModel: (startWeek: number, endWeek: number, season?: number) => Promise<ModelPerformanceMetrics | null>;
  refreshServiceStatus: () => void;
  
  // Cache management
  clearPrediction: () => void;
  clearRankings: () => void;
  clearComparison: () => void;
  clearAll: () => void;
}

export interface UseMLPlayerPredictionsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  cacheResults?: boolean;
  onPredictionGenerated?: (prediction: PlayerPredictionResult) => void;
  onRankingsGenerated?: (rankings: WeeklyRankings) => void;
  onComparisonGenerated?: (comparison: PlayerComparison) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for ML player predictions with comprehensive state management
 */
export const useMLPlayerPredictions = (options: UseMLPlayerPredictionsOptions = {}): [UseMLPlayerPredictionsState, UseMLPlayerPredictionsActions] => {
  const {
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    cacheResults = true,
    onPredictionGenerated,
    onRankingsGenerated,
    onComparisonGenerated,
    onError
  } = options;

  // State management
  const [state, setState] = useState<UseMLPlayerPredictionsState>({
    prediction: null,
    rankings: null,
    comparison: null,
    loading: false,
    loadingRankings: false,
    loadingComparison: false,
    error: null,
    serviceStatus: {
      isActive: false,
      modelsLoaded: 0,
      cacheSize: 0,
      lastPrediction: '',
      performanceMetrics: null
    }
  });

  // Cache for predictions if enabled
  const predictionCache = cacheResults ? new Map<string, PlayerPredictionResult>() : null;
  const rankingsCache = cacheResults ? new Map<string, WeeklyRankings>() : null;

  /**
   * Generate ML prediction for a specific player
   */
  const generatePrediction = useCallback(async (playerId: string, week: number, season: number = 2024) => {
    const cacheKey = `${playerId}_${week}_${season}`;
    
    // Check cache first
    if (predictionCache?.has(cacheKey)) {
      const cachedPrediction = predictionCache.get(cacheKey);
      if (cachedPrediction) {
        setState(prev => ({ ...prev, prediction: cachedPrediction, error: null }));
        onPredictionGenerated?.(cachedPrediction);
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const prediction = await machineLearningPlayerPredictionService.generatePlayerPrediction(playerId, week, season);
      
      // Cache the result
      predictionCache?.set(cacheKey, prediction);
      
      setState(prev => ({
        ...prev,
        prediction,
        loading: false,
        error: null
      }));

      onPredictionGenerated?.(prediction);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate prediction';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      onError?.(errorMessage);
    }
  }, [predictionCache, onPredictionGenerated, onError]);

  /**
   * Generate weekly rankings for a position
   */
  const generateRankings = useCallback(async (position: string, week: number, season: number = 2024, limit: number = 50) => {
    const cacheKey = `${position}_${week}_${season}_${limit}`;
    
    // Check cache first
    if (rankingsCache?.has(cacheKey)) {
      const cachedRankings = rankingsCache.get(cacheKey);
      if (cachedRankings) {
        setState(prev => ({ ...prev, rankings: cachedRankings, error: null }));
        onRankingsGenerated?.(cachedRankings);
        return;
      }
    }

    setState(prev => ({ ...prev, loadingRankings: true, error: null }));

    try {
      const rankings = await machineLearningPlayerPredictionService.generateWeeklyRankings(position, week, season, limit);
      
      // Cache the result
      rankingsCache?.set(cacheKey, rankings);
      
      setState(prev => ({
        ...prev,
        rankings,
        loadingRankings: false,
        error: null
      }));

      onRankingsGenerated?.(rankings);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate rankings';
      setState(prev => ({
        ...prev,
        loadingRankings: false,
        error: errorMessage
      }));
      onError?.(errorMessage);
    }
  }, [rankingsCache, onRankingsGenerated, onError]);

  /**
   * Compare two players using ML predictions
   */
  const comparePlayers = useCallback(async (playerId1: string, playerId2: string, week: number, season: number = 2024) => {
    setState(prev => ({ ...prev, loadingComparison: true, error: null }));

    try {
      const comparison = await machineLearningPlayerPredictionService.comparePlayerPredictions(playerId1, playerId2, week, season);
      
      setState(prev => ({
        ...prev,
        comparison,
        loadingComparison: false,
        error: null
      }));

      onComparisonGenerated?.(comparison);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to compare players';
      setState(prev => ({
        ...prev,
        loadingComparison: false,
        error: errorMessage
      }));
      onError?.(errorMessage);
    }
  }, [onComparisonGenerated, onError]);

  /**
   * Backtest model performance
   */
  const backtestModel = useCallback(async (startWeek: number, endWeek: number, season: number = 2023): Promise<ModelPerformanceMetrics | null> => {
    try {
      const metrics = await machineLearningPlayerPredictionService.backtestModelPerformance(startWeek, endWeek, season);
      
      setState(prev => ({
        ...prev,
        serviceStatus: {
          ...prev.serviceStatus,
          performanceMetrics: metrics
        }
      }));

      return metrics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to backtest model';
      onError?.(errorMessage);
      return null;
    }
  }, [onError]);

  /**
   * Refresh service status
   */
  const refreshServiceStatus = useCallback(() => {
    const status = machineLearningPlayerPredictionService.getServiceStatus();
    setState(prev => ({
      ...prev,
      serviceStatus: status
    }));
  }, []);

  /**
   * Clear methods
   */
  const clearPrediction = useCallback(() => {
    setState(prev => ({ ...prev, prediction: null, error: null }));
  }, []);

  const clearRankings = useCallback(() => {
    setState(prev => ({ ...prev, rankings: null, error: null }));
  }, []);

  const clearComparison = useCallback(() => {
    setState(prev => ({ ...prev, comparison: null, error: null }));
  }, []);

  const clearAll = useCallback(() => {
    predictionCache?.clear();
    rankingsCache?.clear();
    setState(prev => ({
      ...prev,
      prediction: null,
      rankings: null,
      comparison: null,
      error: null
    }));
  }, [predictionCache, rankingsCache]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshServiceStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshServiceStatus]);

  // Initialize service status on mount
  useEffect(() => {
    refreshServiceStatus();
  }, [refreshServiceStatus]);

  const actions: UseMLPlayerPredictionsActions = {
    generatePrediction,
    generateRankings,
    comparePlayers,
    backtestModel,
    refreshServiceStatus,
    clearPrediction,
    clearRankings,
    clearComparison,
    clearAll
  };

  return [state, actions];
};

/**
 * Simplified hook for single player predictions
 */
export const usePlayerPrediction = (playerId: string | null, week: number, season: number = 2024) => {
  const [state, actions] = useMLPlayerPredictions({
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000 // 10 minutes
  });

  useEffect(() => {
    if (playerId) {
      actions.generatePrediction(playerId, week, season);
    }
  }, [playerId, week, season, actions]);

  return {
    prediction: state.prediction,
    loading: state.loading,
    error: state.error,
    refresh: () => playerId && actions.generatePrediction(playerId, week, season)
  };
};

/**
 * Hook for position rankings
 */
export const usePositionRankings = (position: string, week: number, season: number = 2024, limit: number = 50) => {
  const [state, actions] = useMLPlayerPredictions({
    autoRefresh: true,
    refreshInterval: 15 * 60 * 1000 // 15 minutes
  });

  useEffect(() => {
    actions.generateRankings(position, week, season, limit);
  }, [position, week, season, limit, actions]);

  return {
    rankings: state.rankings,
    loading: state.loadingRankings,
    error: state.error,
    refresh: () => actions.generateRankings(position, week, season, limit)
  };
};

/**
 * Hook for player comparisons
 */
export const usePlayerComparison = (
  playerId1: string | null, 
  playerId2: string | null, 
  week: number, 
  season: number = 2024
) => {
  const [state, actions] = useMLPlayerPredictions();

  useEffect(() => {
    if (playerId1 && playerId2) {
      actions.comparePlayers(playerId1, playerId2, week, season);
    }
  }, [playerId1, playerId2, week, season, actions]);

  return {
    comparison: state.comparison,
    loading: state.loadingComparison,
    error: state.error,
    refresh: () => playerId1 && playerId2 && actions.comparePlayers(playerId1, playerId2, week, season)
  };
};

export default useMLPlayerPredictions;
