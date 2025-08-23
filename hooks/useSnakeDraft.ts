/**
 * Enhanced Snake Draft Hook
 * Provides optimized snake draft functionality with auto-draft, strategy analysis, and keeper support
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, DraftPick, League, PlayerPosition } from '../types';
import { players } from '../data/players';
import { 
  enhancedDraftEngine, 
  AutoDraftConfig, 
  SnakeDraftOptimization, 
  DraftRecommendation,
  KeeperLeagueConfig,
  KeeperPlayer
} from '../services/enhancedDraftEngine';
import { useAppState } from '../contexts/AppContext';

export interface SnakeDraftState {
  // Basic draft state
  currentPick: number;
  currentRound: number;
  currentTeamId: number;
  timeRemaining: number;
  isPaused: boolean;
  isComplete: boolean;
  
  // Enhanced features
  autoDraftEnabled: boolean;
  autoDraftConfig: AutoDraftConfig;
  draftAnalysis: SnakeDraftOptimization | null;
  recommendations: DraftRecommendation[];
  
  // Keeper league support
  keeperConfig: KeeperLeagueConfig | null;
  eligibleKeepers: KeeperPlayer[];
  
  // Available players and filtering
  availablePlayers: Player[];
  filteredPlayers: Player[];
  searchTerm: string;
  positionFilter: PlayerPosition | 'ALL';
  tierFilter: number | 'ALL';
  
  // User queue and watchlist
  draftQueue: number[];
  watchlist: number[];
  
  // Actions
  makePick: (playerId: number) => void;
  enableAutoDraft: (config?: Partial<AutoDraftConfig>) => void;
  disableAutoDraft: () => void;
  addToQueue: (playerId: number) => void;
  removeFromQueue: (playerId: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  addToWatchlist: (playerId: number) => void;
  removeFromWatchlist: (playerId: number) => void;
  setPositionFilter: (position: PlayerPosition | 'ALL') => void;
  setTierFilter: (tier: number | 'ALL') => void;
  setSearchTerm: (term: string) => void;
  getRecommendations: () => DraftRecommendation[];
  analyzePosition: () => SnakeDraftOptimization | null;
}

export interface UseSnakeDraftOptions {
  league: League;
  userTeamId: number;
  autoDraftTimeout?: number; // Default timeout for auto-draft in ms
  enableAnalytics?: boolean;
  keeperConfig?: KeeperLeagueConfig;
}

export function useSnakeDraft(options: UseSnakeDraftOptions): SnakeDraftState {
  const { league, userTeamId, autoDraftTimeout = 60000, enableAnalytics = true, keeperConfig } = options;
  const { dispatch } = useAppState();
  
  // Basic draft state
  const [isPaused] = useState(false);
  const [timeRemaining] = useState(0);
  const [autoDraftEnabled, setAutoDraftEnabled] = useState(false);
  const [autoDraftConfig, setAutoDraftConfig] = useState<AutoDraftConfig>({
    enabled: false,
    strategy: 'BPA',
    positionPriority: ['RB', 'WR', 'QB', 'TE', 'K', 'DST'],
    riskTolerance: 'MEDIUM',
    targetRosterComposition: { QB: 2, RB: 5, WR: 6, TE: 2, K: 1, DST: 1 },
    avoidInjuryProne: false,
    preferVeterans: false,
    timeoutAction: 'AUTO_DRAFT'
  });
  
  // Enhanced features
  const [draftAnalysis, setDraftAnalysis] = useState<SnakeDraftOptimization | null>(null);
  const [recommendations, setRecommendations] = useState<DraftRecommendation[]>([]);
  const [eligibleKeepers, setEligibleKeepers] = useState<KeeperPlayer[]>([]);
  
  // Filtering and search
  const [searchTerm, setSearchTermState] = useState('');
  const [positionFilter, setPositionFilterState] = useState<PlayerPosition | 'ALL'>('ALL');
  const [tierFilter, setTierFilterState] = useState<number | 'ALL'>('ALL');
  
  // User preferences
  const [draftQueue, setDraftQueue] = useState<number[]>([]);
  const [watchlist, setWatchlist] = useState<number[]>([]);

  // Calculate current draft state
  const completedPicks = league.draftPicks.filter(pick => pick.playerId).length;
  const currentPick = completedPicks + 1;
  const currentRound = Math.ceil(currentPick / league.teams.length);
  const pickInRound = ((currentPick - 1) % league.teams.length) + 1;
  
  // Calculate current team (snake draft logic)
  const currentTeamId = useMemo(() => {
    if (currentRound % 2 === 1) {
      // Odd rounds: normal order
      return pickInRound;
    } else {
      // Even rounds: reverse order
      return league.teams.length - pickInRound + 1;
    }
  }, [currentRound, pickInRound, league.teams.length]);

  // Check if draft is complete
  const isComplete = completedPicks >= league.teams.length * 16; // Assuming 16 rounds
  
  // Get available players
  const availablePlayers = useMemo(() => {
    const draftedPlayerIds = new Set(
      league.draftPicks
        .filter(pick => pick.playerId)
        .map(pick => pick.playerId)
    );
    
    return players.filter(player => !draftedPlayerIds.has(player.id));
  }, [league.draftPicks]);

  // Apply filters to available players
  const filteredPlayers = useMemo(() => {
    let filtered = [...availablePlayers];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchLower) ||
        player.team.toLowerCase().includes(searchLower)
      );
    }

    // Position filter
    if (positionFilter !== 'ALL') {
      filtered = filtered.filter(player => player.position === positionFilter);
    }

    // Tier filter
    if (tierFilter !== 'ALL') {
      filtered = filtered.filter(player => player.tier === tierFilter);
    }

    // Sort by ADP
    return filtered.sort((a, b) => (a.adp || 999) - (b.adp || 999));
  }, [availablePlayers, searchTerm, positionFilter, tierFilter]);

  // Load keeper players if keeper league
  useEffect(() => {
    if (keeperConfig?.enabled) {
      const userTeam = league.teams.find(team => team.id === userTeamId);
      if (userTeam?.keepers) {
        const keeperPlayers: KeeperPlayer[] = userTeam.keepers.map(keeperId => {
          const player = players.find(p => p.id === keeperId);
          if (!player) return null;
          
          return {
            ...player,
            keeperCost: 50, // Mock cost - would be calculated based on keeper rules
            yearsKept: 1,
            contractYearsRemaining: keeperConfig.contractYears ? 2 : undefined,
            originalDraftRound: 5, // Mock - would be tracked
            isEligibleKeeper: true,
            keeperValue: 75 // Mock value calculation
          } as KeeperPlayer;
        }).filter((keeper): keeper is KeeperPlayer => keeper !== null);
        
        setEligibleKeepers(keeperPlayers);
      }
    }
  }, [keeperConfig, league.teams, userTeamId]);

  // Auto-draft timer
  useEffect(() => {
    if (!autoDraftEnabled || isPaused || isComplete || currentTeamId !== userTeamId) {
      return;
    }

    const timer = setTimeout(async () => {
      await performAutoDraft();
    }, autoDraftTimeout);

    return () => clearTimeout(timer);
  }, [autoDraftEnabled, isPaused, isComplete, currentTeamId, userTeamId, autoDraftTimeout]);

  // Update recommendations when pick changes
  useEffect(() => {
    if (enableAnalytics && currentTeamId === userTeamId && !isComplete) {
      updateRecommendations();
      updateDraftAnalysis();
    }
  }, [currentPick, currentTeamId, userTeamId, isComplete, enableAnalytics]);

  // Actions
  const makePick = useCallback((playerId: number) => {
    if (currentTeamId !== userTeamId || isComplete) {
      console.warn('Not your turn or draft is complete');
      return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) {
      console.error('Player not found');
      return;
    }

    // Create draft pick
    const draftPick: DraftPick = {
      overall: currentPick,
      round: currentRound,
      pickInRound,
      teamId: currentTeamId,
      playerId,
      timestamp: Date.now()
    };

    // Dispatch pick - using a more general action type
    dispatch({
      type: 'SET_LOADING',
      payload: false
    });

    console.log('Draft pick made:', draftPick, player);
    
    // Note: In a real implementation, you would dispatch to a draft management system
    // For now, we'll just log and update local state

    // Remove from queue if present
    setDraftQueue(prev => prev.filter(id => id !== playerId));
    setWatchlist(prev => prev.filter(id => id !== playerId));
  }, [currentTeamId, userTeamId, isComplete, currentPick, currentRound, pickInRound, league.id, dispatch]);

  const enableAutoDraft = useCallback((configOverrides?: Partial<AutoDraftConfig>) => {
    setAutoDraftConfig(prev => ({ ...prev, enabled: true, ...configOverrides }));
    setAutoDraftEnabled(true);
  }, []);

  const disableAutoDraft = useCallback(() => {
    setAutoDraftConfig(prev => ({ ...prev, enabled: false }));
    setAutoDraftEnabled(false);
  }, []);

  const addToQueue = useCallback((playerId: number) => {
    setDraftQueue(prev => {
      if (prev.includes(playerId)) return prev;
      return [...prev, playerId];
    });
  }, []);

  const removeFromQueue = useCallback((playerId: number) => {
    setDraftQueue(prev => prev.filter(id => id !== playerId));
  }, []);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setDraftQueue(prev => {
      const result = [...prev];
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const addToWatchlist = useCallback((playerId: number) => {
    setWatchlist(prev => {
      if (prev.includes(playerId)) return prev;
      return [...prev, playerId];
    });
  }, []);

  const removeFromWatchlist = useCallback((playerId: number) => {
    setWatchlist(prev => prev.filter(id => id !== playerId));
  }, []);

  const setPositionFilter = useCallback((position: PlayerPosition | 'ALL') => {
    setPositionFilterState(position);
  }, []);

  const setTierFilter = useCallback((tier: number | 'ALL') => {
    setTierFilterState(tier);
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  const getRecommendations = useCallback((): DraftRecommendation[] => {
    if (currentTeamId !== userTeamId) return [];

    const userTeam = league.teams.find(team => team.id === userTeamId);
    if (!userTeam) return [];

    try {
      const recs = enhancedDraftEngine.getPickRecommendations(
        availablePlayers,
        userTeam.roster || [],
        currentPick,
        16, // Total rounds
        autoDraftConfig
      );
      
      setRecommendations(recs);
      return recs;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }, [currentTeamId, userTeamId, league.teams, availablePlayers, currentPick, autoDraftConfig]);

  const analyzePosition = useCallback((): SnakeDraftOptimization | null => {
    if (currentTeamId !== userTeamId) return null;

    const userTeam = league.teams.find(team => team.id === userTeamId);
    if (!userTeam) return null;

    // Find user's draft position (1-based)
    const draftPosition = league.teams.findIndex(team => team.id === userTeamId) + 1;
    
    const analysis = enhancedDraftEngine.analyzeSnakeDraftPosition(
      draftPosition,
      league.teams.length,
      currentRound
    );
    
    setDraftAnalysis(analysis);
    return analysis;
  }, [currentTeamId, userTeamId, league.teams, currentRound]);

  const updateRecommendations = useCallback(() => {
    getRecommendations();
  }, [getRecommendations]);

  const updateDraftAnalysis = useCallback(() => {
    analyzePosition();
  }, [analyzePosition]);

  const performAutoDraft = useCallback(async () => {
    if (currentTeamId !== userTeamId || !autoDraftEnabled) return;

    const userTeam = league.teams.find(team => team.id === userTeamId);
    if (!userTeam) return;

    try {
      // Check queue first
      const availableInQueue = draftQueue
        .map(id => players.find(p => p.id === id))
        .filter(p => p && availablePlayers.includes(p))[0];

      if (availableInQueue) {
        makePick(availableInQueue.id);
        return;
      }

      // Get AI recommendation
      const recommendation = await enhancedDraftEngine.generateAutoDraftPick(
        userTeam,
        availablePlayers,
        userTeam.roster || [],
        currentPick,
        16,
        autoDraftConfig
      );

      if (recommendation) {
        makePick(recommendation.player.id);
        
        // Notify user of auto-pick
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            message: `Auto-drafted ${recommendation.player.name} (${recommendation.reasoning})`,
            type: 'DRAFT'
          }
        });
      }
    } catch (error) {
      console.error('Auto-draft failed:', error);
      
      // Fallback to best available
      if (availablePlayers.length > 0) {
        makePick(availablePlayers[0].id);
      }
    }
  }, [currentTeamId, userTeamId, autoDraftEnabled, league.teams, draftQueue, availablePlayers, currentPick, autoDraftConfig, makePick, dispatch]);

  return {
    // Basic state
    currentPick,
    currentRound,
    currentTeamId,
    timeRemaining,
    isPaused,
    isComplete,
    
    // Enhanced features
    autoDraftEnabled,
    autoDraftConfig,
    draftAnalysis,
    recommendations,
    
    // Keeper league
    keeperConfig: keeperConfig || null,
    eligibleKeepers,
    
    // Players and filtering
    availablePlayers,
    filteredPlayers,
    searchTerm,
    positionFilter,
    tierFilter,
    
    // User preferences
    draftQueue,
    watchlist,
    
    // Actions
    makePick,
    enableAutoDraft,
    disableAutoDraft,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    addToWatchlist,
    removeFromWatchlist,
    setPositionFilter,
    setTierFilter,
    setSearchTerm,
    getRecommendations,
    analyzePosition
  };
}
