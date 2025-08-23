/**
 * Player Comparison Hook
 * Provides state management and business logic for player comparisons
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  playerComparisonService, 
  PlayerComparison,
  ComparisonPlayer
} from '../services/playerComparisonService';

interface UsePlayerComparisonOptions {
  defaultWeek?: number;
  defaultSeason?: number;
  maxPlayers?: number;
  autoCompare?: boolean;
}

interface UsePlayerComparisonReturn {
  // State
  selectedPlayers: string[];
  comparison: PlayerComparison | null;
  loading: boolean;
  error: string | null;
  currentWeek: number;
  currentSeason: number;
  
  // Actions
  addPlayer: (playerId: string) => void;
  removePlayer: (playerId: string) => void;
  clearPlayers: () => void;
  setWeek: (week: number) => void;
  setSeason: (season: number) => void;
  compareNow: () => Promise<void>;
  refreshComparison: () => Promise<void>;
  
  // Computed values
  canCompare: boolean;
  hasMaxPlayers: boolean;
  recommendedPlayer: ComparisonPlayer | null;
  comparisonSummary: string | null;
  
  // Quick comparison methods
  quickCompare: (playerId1: string, playerId2: string) => Promise<{
    winner: string;
    confidence: number;
    keyDifferences: string[];
    projectedPoints: { [playerId: string]: number };
  } | null>;
  
  // Cache management
  clearCache: () => void;
  getCacheStats: () => { size: number; keys: string[] };
}

export const usePlayerComparison = (options: UsePlayerComparisonOptions = {}): UsePlayerComparisonReturn => {
  const {
    defaultWeek = 1,
    defaultSeason = 2024,
    maxPlayers = 4,
    autoCompare = true
  } = options;

  // State
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [comparison, setComparison] = useState<PlayerComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(defaultWeek);
  const [currentSeason, setCurrentSeason] = useState(defaultSeason);

  // Auto-compare when players or settings change
  useEffect(() => {
    if (autoCompare && selectedPlayers.length >= 2) {
      compareNow();
    } else if (selectedPlayers.length < 2) {
      setComparison(null);
    }
  }, [selectedPlayers, currentWeek, currentSeason, autoCompare]);

  // Player management
  const addPlayer = useCallback((playerId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId) || prev.length >= maxPlayers) {
        return prev;
      }
      return [...prev, playerId];
    });
    setError(null);
  }, [maxPlayers]);

  const removePlayer = useCallback((playerId: string) => {
    setSelectedPlayers(prev => prev.filter(id => id !== playerId));
    setError(null);
  }, []);

  const clearPlayers = useCallback(() => {
    setSelectedPlayers([]);
    setComparison(null);
    setError(null);
  }, []);

  // Settings management
  const setWeek = useCallback((week: number) => {
    setCurrentWeek(week);
    setError(null);
  }, []);

  const setSeason = useCallback((season: number) => {
    setCurrentSeason(season);
    setError(null);
  }, []);

  // Comparison execution
  const compareNow = useCallback(async () => {
    if (selectedPlayers.length < 2) {
      setError('Please select at least 2 players to compare');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const comparisonResult = await playerComparisonService.comparePlayersFull(
        selectedPlayers,
        currentWeek,
        currentSeason
      );
      
      setComparison(comparisonResult);

      // Log high-confidence comparisons
      if (comparisonResult.analysis.confidence > 80) {
        const winner = comparisonResult.players.find(p => p.id === comparisonResult.analysis.winner);
        if (winner) {
          console.log(`🎯 High confidence comparison: ${winner.name} recommended with ${comparisonResult.analysis.confidence}% confidence for Week ${currentWeek}`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare players';
      setError(errorMessage);
      console.error('Player comparison error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPlayers, currentWeek, currentSeason]);

  const refreshComparison = useCallback(async () => {
    if (comparison) {
      await compareNow();
    }
  }, [comparison, compareNow]);

  // Quick comparison for two players
  const quickCompare = useCallback(async (playerId1: string, playerId2: string) => {
    try {
      setLoading(true);
      const result = await playerComparisonService.quickCompare(playerId1, playerId2, currentWeek);
      return result;
    } catch (err) {
      console.error('Quick comparison error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentWeek]);

  // Cache management
  const clearCache = useCallback(() => {
    playerComparisonService.clearCache();
  }, []);

  const getCacheStats = useCallback(() => {
    return playerComparisonService.getCacheStats();
  }, []);

  // Computed values
  const canCompare = selectedPlayers.length >= 2;
  const hasMaxPlayers = selectedPlayers.length >= maxPlayers;
  
  const recommendedPlayer = comparison?.players.find(
    p => p.id === comparison.analysis.winner
  ) || null;

  const comparisonSummary = comparison ? (() => {
    const winner = recommendedPlayer;
    if (!winner) return null;
    
    const confidence = comparison.analysis.confidence;
    const projectedPoints = winner.projectedStats.fantasyPoints;
    const matchup = winner.matchupAnalysis.difficulty;
    
    return `${winner.name} is recommended with ${confidence}% confidence, projecting ${projectedPoints} points in a ${matchup} matchup`;
  })() : null;

  return {
    // State
    selectedPlayers,
    comparison,
    loading,
    error,
    currentWeek,
    currentSeason,
    
    // Actions
    addPlayer,
    removePlayer,
    clearPlayers,
    setWeek,
    setSeason,
    compareNow,
    refreshComparison,
    
    // Computed values
    canCompare,
    hasMaxPlayers,
    recommendedPlayer,
    comparisonSummary,
    
    // Quick comparison
    quickCompare,
    
    // Cache management
    clearCache,
    getCacheStats
  };
};

export default usePlayerComparison;
