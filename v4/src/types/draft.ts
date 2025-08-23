/**
 * Draft-related type definitions for Astral Draft V4
 */

// Core Draft Types
export interface DraftPick {
  id: string;
  round: number;
  pick: number;
  teamId: string;
  teamName: string;
  playerId?: string;
  playerName?: string;
  position?: string;
  timestamp?: Date;
}

export interface Team {
  id: string;
  name: string;
  avatar?: string;
  ownerId?: string;
  ownerName?: string;
  draftPosition?: number;
}

export interface QueuedPlayer {
  id: string;
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  rank?: number;
  adp?: number;
  projectedPoints?: number;
  bye?: number;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  adp?: number;
  rank?: number;
  projectedPoints?: number;
  bye?: number;
  injuryStatus?: 'ACTIVE' | 'QUESTIONABLE' | 'DOUBTFUL' | 'OUT' | 'IR' | 'SUSPENDED';
}

// Draft State Types
export interface DraftState {
  isDrafting: boolean;
  currentPick: number;
  totalPicks: number;
  currentRound: number;
  currentPickInRound: number;
  picks: DraftPick[];
  teams: Team[];
  currentTeam: Team | null;
  myTeamId: string;
  timeRemaining?: number;
  draftSettings?: DraftSettings;
}

export interface DraftSettings {
  rounds: number;
  pickTimeLimit: number;
  draftType: 'snake' | 'linear' | 'auction';
  scoringType: 'standard' | 'ppr' | 'half_ppr';
  positions: Record<string, number>;
}

// Hook Return Types
export interface UseMockDraftReturn {
  draftState: DraftState;
  isMyTurn: boolean;
  timeRemaining: number;
  isDrafting: boolean;
  currentPick: number;
  startDraft: () => void;
  makePick: (playerId: string) => Promise<void>;
  pauseDraft: () => void;
  resetDraft: () => void;
  addToQueue: (player: QueuedPlayer) => void;
  removeFromQueue: (playerId: string) => void;
  queue: QueuedPlayer[];
  simulatePick: () => Promise<void>;
}

// Component Props Types
export interface DraftBoardProps {
  picks: DraftPick[];
  teams: Team[];
  currentRound?: number;
  currentPick?: number;
  onPlayerSelect?: (playerId: string) => void;
}

export interface DraftQueueProps {
  queue: QueuedPlayer[];
  onRemove: (playerId: string) => void;
  onReorder: (queue: QueuedPlayer[]) => void;
  draftedPlayers: string[];
  maxQueueSize?: number;
}

export interface DraftTimerProps {
  timeRemaining: number;
  isMyTurn: boolean;
  size?: 'small' | 'medium' | 'large';
  onTimeExpired?: () => void;
}

export interface PlayerSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  draftedPlayers: string[];
  onPlayerSelect: (playerId: string) => void;
  onAddToQueue: (player: QueuedPlayer) => void;
  selectedPlayer: string | null;
  isMyTurn: boolean;
  onDraftPlayer: (playerId: string) => void;
}

// Analysis Types
export interface DraftAnalysis {
  averageAdp: number;
  valuePicks: number;
  reaches: number;
  grade: string;
  positionBreakdown: Record<string, number>;
  recommendations: string[];
}

export interface MockDraftAnalysisProps {
  picks: DraftPick[];
  currentRound: number;
  myTeamId: string;
}

export interface DraftStrategyTipsProps {
  currentRound: number;
  myPicks: DraftPick[];
}

export interface YourMockRosterProps {
  picks: DraftPick[];
}