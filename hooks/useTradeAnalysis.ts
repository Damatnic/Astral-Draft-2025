/**
 * Trade Analysis React Hook
 * React integration for comprehensive trade analysis and recommendation system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { tradeAnalysisService, TradeProposal, TradeAnalysis, FantasyRoster } from '../services/tradeAnalysisService';

// Hook interfaces
export interface UseTradeAnalysisOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  cacheTimeout?: number;
}

export interface TradeAnalysisState {
  isLoading: boolean;
  isAnalyzing: boolean;
  currentAnalysis: TradeAnalysis | null;
  error: string | null;
  lastUpdated: string | null;
  analysisHistory: TradeAnalysis[];
}

export interface TradeComparisionState {
  proposals: TradeProposal[];
  analyses: Map<string, TradeAnalysis>;
  rankings: {
    tradeId: string;
    score: number;
    recommendation: string;
  }[];
  bestTrade: TradeAnalysis | null;
}

/**
 * Main trade analysis hook
 */
export function useTradeAnalysis(options: UseTradeAnalysisOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    cacheTimeout = 1800000    // 30 minutes
  } = options;

  const [state, setState] = useState<TradeAnalysisState>({
    isLoading: false,
    isAnalyzing: false,
    currentAnalysis: null,
    error: null,
    lastUpdated: null,
    analysisHistory: []
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const analysisCache = useRef(new Map<string, { analysis: TradeAnalysis; expires: number }>());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && state.currentAnalysis) {
      refreshIntervalRef.current = setInterval(() => {
        // Re-analyze current trade if we have one
        if (state.currentAnalysis) {
          console.log('🔄 Auto-refreshing trade analysis...');
          // Would trigger re-analysis here
        }
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, state.currentAnalysis]);

  /**
   * Analyze a trade proposal
   */
  const analyzeTradeProposal = useCallback(async (
    proposal: TradeProposal,
    proposerRoster: FantasyRoster,
    receiverRoster: FantasyRoster
  ): Promise<TradeAnalysis | null> => {
    const cacheKey = `${proposal.id}_${proposal.proposedAt}`;
    
    // Check cache first
    const cached = analysisCache.current.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      setState(prev => ({
        ...prev,
        currentAnalysis: cached.analysis,
        lastUpdated: new Date().toISOString(),
        error: null
      }));
      return cached.analysis;
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null
    }));

    try {
      console.log(`🔍 Analyzing trade proposal: ${proposal.id}`);
      
      const analysis = await tradeAnalysisService.analyzeTradeProposal(
        proposal,
        proposerRoster,
        receiverRoster
      );

      // Cache the result
      analysisCache.current.set(cacheKey, {
        analysis,
        expires: Date.now() + cacheTimeout
      });

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        currentAnalysis: analysis,
        lastUpdated: new Date().toISOString(),
        analysisHistory: [analysis, ...prev.analysisHistory.slice(0, 9)], // Keep last 10
        error: null
      }));

      console.log(`✅ Trade analysis completed: ${analysis.recommendation} (${analysis.fairnessScore}% fair)`);
      return analysis;

    } catch (error) {
      console.error('❌ Error analyzing trade:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Failed to analyze trade',
        lastUpdated: new Date().toISOString()
      }));
      return null;
    }
  }, [cacheTimeout]);

  /**
   * Clear current analysis
   */
  const clearAnalysis = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentAnalysis: null,
      error: null
    }));
  }, []);

  /**
   * Clear analysis history
   */
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      analysisHistory: []
    }));
  }, []);

  /**
   * Get analysis from history
   */
  const getAnalysisFromHistory = useCallback((tradeId: string): TradeAnalysis | null => {
    return state.analysisHistory.find(analysis => analysis.tradeId === tradeId) || null;
  }, [state.analysisHistory]);

  /**
   * Refresh current analysis
   */
  const refreshAnalysis = useCallback(async (
    proposal: TradeProposal,
    proposerRoster: FantasyRoster,
    receiverRoster: FantasyRoster
  ): Promise<TradeAnalysis | null> => {
    // Clear cache for this proposal
    const cacheKey = `${proposal.id}_${proposal.proposedAt}`;
    analysisCache.current.delete(cacheKey);
    
    return analyzeTradeProposal(proposal, proposerRoster, receiverRoster);
  }, [analyzeTradeProposal]);

  return {
    ...state,
    analyzeTradeProposal,
    clearAnalysis,
    clearHistory,
    getAnalysisFromHistory,
    refreshAnalysis,
    // Service status
    serviceStatus: tradeAnalysisService.getServiceStatus()
  };
}

/**
 * Hook for comparing multiple trade proposals
 */
export function useTradeComparison() {
  const [state, setState] = useState<TradeComparisionState>({
    proposals: [],
    analyses: new Map(),
    rankings: [],
    bestTrade: null
  });

  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add trade proposal to comparison
   */
  const addTradeForComparison = useCallback((proposal: TradeProposal) => {
    setState(prev => ({
      ...prev,
      proposals: [...prev.proposals.filter(p => p.id !== proposal.id), proposal]
    }));
  }, []);

  /**
   * Remove trade from comparison
   */
  const removeTradeFromComparison = useCallback((tradeId: string) => {
    setState(prev => {
      const newAnalyses = new Map(prev.analyses);
      newAnalyses.delete(tradeId);
      
      return {
        ...prev,
        proposals: prev.proposals.filter(p => p.id !== tradeId),
        analyses: newAnalyses,
        rankings: prev.rankings.filter(r => r.tradeId !== tradeId)
      };
    });
  }, []);

  /**
   * Compare all trades in the list
   */
  const compareAllTrades = useCallback(async (
    proposerRoster: FantasyRoster,
    receiverRoster: FantasyRoster
  ): Promise<void> => {
    if (state.proposals.length === 0) return;

    setIsComparing(true);
    setError(null);

    try {
      const analyses = new Map<string, TradeAnalysis>();
      
      // Analyze each proposal
      for (const proposal of state.proposals) {
        try {
          const analysis = await tradeAnalysisService.analyzeTradeProposal(
            proposal,
            proposerRoster,
            receiverRoster
          );
          analyses.set(proposal.id, analysis);
        } catch (error) {
          console.error(`Error analyzing trade ${proposal.id}:`, error);
        }
      }

      // Create rankings
      const rankings = Array.from(analyses.entries())
        .map(([tradeId, analysis]) => ({
          tradeId,
          score: analysis.fairnessScore,
          recommendation: analysis.recommendation
        }))
        .sort((a, b) => b.score - a.score);

      // Find best trade
      const bestTrade = rankings.length > 0 ? analyses.get(rankings[0].tradeId) || null : null;

      setState(prev => ({
        ...prev,
        analyses,
        rankings,
        bestTrade
      }));

    } catch (error) {
      console.error('Error comparing trades:', error);
      setError(error instanceof Error ? error.message : 'Failed to compare trades');
    } finally {
      setIsComparing(false);
    }
  }, [state.proposals]);

  /**
   * Clear all comparisons
   */
  const clearComparisons = useCallback(() => {
    setState({
      proposals: [],
      analyses: new Map(),
      rankings: [],
      bestTrade: null
    });
    setError(null);
  }, []);

  /**
   * Get analysis for specific trade
   */
  const getTradeAnalysis = useCallback((tradeId: string): TradeAnalysis | null => {
    return state.analyses.get(tradeId) || null;
  }, [state.analyses]);

  return {
    ...state,
    isComparing,
    error,
    addTradeForComparison,
    removeTradeFromComparison,
    compareAllTrades,
    clearComparisons,
    getTradeAnalysis
  };
}

/**
 * Hook for analyzing a single trade with specific players
 */
export function useSingleTradeAnalysis() {
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeTradeByPlayers = useCallback(async (
    givingPlayerIds: string[],
    receivingPlayerIds: string[],
    proposerRoster: FantasyRoster,
    receiverRoster: FantasyRoster,
    metadata?: TradeProposal['metadata']
  ): Promise<TradeAnalysis | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Create a trade proposal from the player IDs
      const proposal: TradeProposal = {
        id: `temp_${Date.now()}`,
        proposedBy: 'user',
        proposedTo: 'opponent',
        givingPlayers: givingPlayerIds,
        receivingPlayers: receivingPlayerIds,
        status: 'proposed',
        proposedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        metadata
      };

      const result = await tradeAnalysisService.analyzeTradeProposal(
        proposal,
        proposerRoster,
        receiverRoster
      );

      setAnalysis(result);
      return result;

    } catch (error) {
      console.error('Error analyzing single trade:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze trade');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    isAnalyzing,
    error,
    analyzeTradeByPlayers,
    clearAnalysis
  };
}

/**
 * Hook for trade recommendation insights
 */
export function useTradeRecommendations() {
  const [recommendations, setRecommendations] = useState<{
    playerToTrade: string[];
    playersToTarget: string[];
    tradeStrategies: string[];
    marketTrends: string[];
  }>({
    playerToTrade: [],
    playersToTarget: [],
    tradeStrategies: [],
    marketTrends: []
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const generateRecommendations = useCallback(async (
    roster: FantasyRoster,
    leagueSettings: any,
    currentWeek: number
  ): Promise<void> => {
    setIsGenerating(true);

    try {
      // Mock implementation - would analyze roster and generate recommendations
      await new Promise(resolve => setTimeout(resolve, 2000));

      setRecommendations({
        playerToTrade: [
          'Consider trading bench players for starters',
          'Sell high on overperforming players',
          'Trade players with difficult playoff schedules'
        ],
        playersToTarget: [
          'Target players with easy playoff schedules',
          'Look for buy-low candidates with upside',
          'Acquire handcuffs for your key players'
        ],
        tradeStrategies: [
          'Package deals for star players',
          '2-for-1 trades to improve starting lineup',
          'Positional scarcity exploitation'
        ],
        marketTrends: [
          'RB values increasing due to injuries',
          'QB streaming becoming more viable',
          'Defense values fluctuating weekly'
        ]
      });

    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    recommendations,
    isGenerating,
    generateRecommendations
  };
}
