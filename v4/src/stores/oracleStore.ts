/**
 * Oracle Store - State management for AI predictions and analytics
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  PlayerPrediction, 
  TradeAnalysis, 
  LineupAdvice, 
  ChampionshipOdds 
} from '../lib/oracle/gemini-client';

interface PredictionRequest {
  id: string;
  type: 'player' | 'trade' | 'lineup' | 'championship';
  status: 'pending' | 'loading' | 'success' | 'error';
  timestamp: number;
  data?: any;
  error?: string;
}

interface OracleInsight {
  id: string;
  type: 'tip' | 'warning' | 'opportunity' | 'trend';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
  relatedPlayers?: string[];
  actionable: boolean;
}

interface OracleState {
  // Predictions cache
  playerPredictions: Map<string, PlayerPrediction>;
  tradeAnalyses: Map<string, TradeAnalysis>;
  lineupAdvice: Map<string, LineupAdvice>;
  championshipOdds: ChampionshipOdds[];
  
  // Request tracking
  activeRequests: Map<string, PredictionRequest>;
  requestHistory: PredictionRequest[];
  
  // Real-time insights
  insights: OracleInsight[];
  liveGameInsights: Map<string, string[]>;
  
  // UI State
  selectedPlayerId: string | null;
  comparePlayers: string[];
  isOracleOpen: boolean;
  activeView: 'predictions' | 'trades' | 'lineup' | 'championship';
  
  // Preferences
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  showConfidence: boolean;
  
  // Actions
  setPlayerPrediction: (playerId: string, prediction: PlayerPrediction) => void;
  setTradeAnalysis: (tradeId: string, analysis: TradeAnalysis) => void;
  setLineupAdvice: (teamId: string, advice: LineupAdvice) => void;
  setChampionshipOdds: (odds: ChampionshipOdds[]) => void;
  
  addRequest: (request: PredictionRequest) => void;
  updateRequest: (id: string, updates: Partial<PredictionRequest>) => void;
  removeRequest: (id: string) => void;
  
  addInsight: (insight: OracleInsight) => void;
  dismissInsight: (id: string) => void;
  clearInsights: () => void;
  
  addLiveGameInsight: (gameId: string, insight: string) => void;
  clearGameInsights: (gameId: string) => void;
  
  setSelectedPlayer: (playerId: string | null) => void;
  addComparePlayer: (playerId: string) => void;
  removeComparePlayer: (playerId: string) => void;
  clearComparePlayers: () => void;
  
  toggleOracle: () => void;
  setActiveView: (view: OracleState['activeView']) => void;
  
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (seconds: number) => void;
  setShowConfidence: (show: boolean) => void;
  
  // Cache management
  clearPredictionCache: () => void;
  clearAllCaches: () => void;
  
  // Optimistic updates
  optimisticTradeUpdate: (tradeId: string, analysis: Partial<TradeAnalysis>) => void;
  optimisticLineupUpdate: (teamId: string, playerIds: string[]) => void;
  
  reset: () => void;
}

const initialState = {
  playerPredictions: new Map(),
  tradeAnalyses: new Map(),
  lineupAdvice: new Map(),
  championshipOdds: [],
  
  activeRequests: new Map(),
  requestHistory: [],
  
  insights: [],
  liveGameInsights: new Map(),
  
  selectedPlayerId: null,
  comparePlayers: [],
  isOracleOpen: false,
  activeView: 'predictions' as const,
  
  autoRefresh: true,
  refreshInterval: 300, // 5 minutes
  showConfidence: true,
};

export const useOracleStore = create<OracleState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        setPlayerPrediction: (playerId, prediction) =>
          set((state) => {
            state.playerPredictions.set(playerId, prediction);
          }),
        
        setTradeAnalysis: (tradeId, analysis) =>
          set((state) => {
            state.tradeAnalyses.set(tradeId, analysis);
          }),
        
        setLineupAdvice: (teamId, advice) =>
          set((state) => {
            state.lineupAdvice.set(teamId, advice);
          }),
        
        setChampionshipOdds: (odds) =>
          set((state) => {
            state.championshipOdds = odds;
          }),
        
        addRequest: (request) =>
          set((state) => {
            state.activeRequests.set(request.id, request);
            state.requestHistory.push(request);
            
            // Keep only last 100 requests in history
            if (state.requestHistory.length > 100) {
              state.requestHistory = state.requestHistory.slice(-100);
            }
          }),
        
        updateRequest: (id, updates) =>
          set((state) => {
            const request = state.activeRequests.get(id);
            if (request) {
              state.activeRequests.set(id, { ...request, ...updates });
              
              // Update in history as well
              const historyIndex = state.requestHistory.findIndex(r => r.id === id);
              if (historyIndex !== -1) {
                state.requestHistory[historyIndex] = { 
                  ...state.requestHistory[historyIndex], 
                  ...updates 
                };
              }
            }
            
            // Remove from active if completed
            if (updates.status === 'success' || updates.status === 'error') {
              setTimeout(() => {
                get().removeRequest(id);
              }, 5000);
            }
          }),
        
        removeRequest: (id) =>
          set((state) => {
            state.activeRequests.delete(id);
          }),
        
        addInsight: (insight) =>
          set((state) => {
            // Add to beginning for newest first
            state.insights.unshift(insight);
            
            // Keep only last 50 insights
            if (state.insights.length > 50) {
              state.insights = state.insights.slice(0, 50);
            }
          }),
        
        dismissInsight: (id) =>
          set((state) => {
            state.insights = state.insights.filter(i => i.id !== id);
          }),
        
        clearInsights: () =>
          set((state) => {
            state.insights = [];
          }),
        
        addLiveGameInsight: (gameId, insight) =>
          set((state) => {
            const current = state.liveGameInsights.get(gameId) || [];
            current.push(insight);
            
            // Keep only last 20 insights per game
            if (current.length > 20) {
              current.shift();
            }
            
            state.liveGameInsights.set(gameId, current);
          }),
        
        clearGameInsights: (gameId) =>
          set((state) => {
            state.liveGameInsights.delete(gameId);
          }),
        
        setSelectedPlayer: (playerId) =>
          set((state) => {
            state.selectedPlayerId = playerId;
          }),
        
        addComparePlayer: (playerId) =>
          set((state) => {
            if (!state.comparePlayers.includes(playerId) && state.comparePlayers.length < 4) {
              state.comparePlayers.push(playerId);
            }
          }),
        
        removeComparePlayer: (playerId) =>
          set((state) => {
            state.comparePlayers = state.comparePlayers.filter(id => id !== playerId);
          }),
        
        clearComparePlayers: () =>
          set((state) => {
            state.comparePlayers = [];
          }),
        
        toggleOracle: () =>
          set((state) => {
            state.isOracleOpen = !state.isOracleOpen;
          }),
        
        setActiveView: (view) =>
          set((state) => {
            state.activeView = view;
          }),
        
        setAutoRefresh: (enabled) =>
          set((state) => {
            state.autoRefresh = enabled;
          }),
        
        setRefreshInterval: (seconds) =>
          set((state) => {
            state.refreshInterval = Math.max(60, Math.min(3600, seconds));
          }),
        
        setShowConfidence: (show) =>
          set((state) => {
            state.showConfidence = show;
          }),
        
        clearPredictionCache: () =>
          set((state) => {
            state.playerPredictions.clear();
            state.tradeAnalyses.clear();
            state.lineupAdvice.clear();
            state.championshipOdds = [];
          }),
        
        clearAllCaches: () =>
          set((state) => {
            state.playerPredictions.clear();
            state.tradeAnalyses.clear();
            state.lineupAdvice.clear();
            state.championshipOdds = [];
            state.liveGameInsights.clear();
            state.insights = [];
          }),
        
        optimisticTradeUpdate: (tradeId, analysis) =>
          set((state) => {
            const current = state.tradeAnalyses.get(tradeId);
            if (current) {
              state.tradeAnalyses.set(tradeId, { ...current, ...analysis });
            }
          }),
        
        optimisticLineupUpdate: (teamId, playerIds) =>
          set((state) => {
            const current = state.lineupAdvice.get(teamId);
            if (current) {
              state.lineupAdvice.set(teamId, { 
                ...current, 
                optimal: playerIds,
                // Mark as needing refresh
                confidence: current.confidence * 0.9
              });
            }
          }),
        
        reset: () => set(() => initialState),
      })),
      {
        name: 'oracle-store',
        partialize: (state) => ({
          autoRefresh: state.autoRefresh,
          refreshInterval: state.refreshInterval,
          showConfidence: state.showConfidence,
          activeView: state.activeView,
        }),
      }
    )
  )
);

// Selectors
export const selectPlayerPrediction = (playerId: string) => 
  (state: OracleState) => state.playerPredictions.get(playerId);

export const selectTradeAnalysis = (tradeId: string) => 
  (state: OracleState) => state.tradeAnalyses.get(tradeId);

export const selectLineupAdvice = (teamId: string) => 
  (state: OracleState) => state.lineupAdvice.get(teamId);

export const selectActiveRequests = () => 
  (state: OracleState) => Array.from(state.activeRequests.values());

export const selectHighPriorityInsights = () => 
  (state: OracleState) => state.insights.filter(i => i.priority === 'high');

export const selectGameInsights = (gameId: string) => 
  (state: OracleState) => state.liveGameInsights.get(gameId) || [];