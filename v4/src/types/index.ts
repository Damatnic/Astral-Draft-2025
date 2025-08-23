/**
 * Core type definitions for Astral Draft V4
 */

// User Profile Types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  favoriteTeam?: string;
  createdAt: Date;
  stats: UserStats;
  achievements: Achievement[];
  recentActivity: Activity[];
  teams: TeamSummary[];
}

export interface UserStats {
  totalWins: number;
  totalLosses: number;
  championships: number;
  playoffAppearances: number;
  winPercentage: number;
  totalPoints: number;
  averagePoints: number;
  bestFinish: number;
  currentStreak: number;
  longestWinStreak: number;
  totalTrades: number;
  successfulWaivers: number;
}

// Achievement interface moved to playoff types section

export interface Activity {
  id: string;
  type: 'trade' | 'waiver' | 'roster_move' | 'message' | 'draft_pick' | 'win' | 'loss';
  title: string;
  description: string;
  timestamp: Date;
  leagueId?: string;
  leagueName?: string;
  metadata?: Record<string, any>;
}

export interface TeamSummary {
  id: string;
  name: string;
  logo?: string;
  leagueId: string;
  leagueName: string;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  standing: number;
  totalTeams: number;
  pointsFor: number;
  pointsAgainst: number;
}

// Settings Types
export interface UserSettings {
  account: AccountSettings;
  notifications: NotificationSettings;
  display: DisplaySettings;
  fantasy: FantasySettings;
  privacy: PrivacySettings;
  connected: ConnectedAccounts;
  subscription: SubscriptionSettings;
}

export interface AccountSettings {
  email: string;
  username: string;
  name?: string;
  bio?: string;
  avatar?: string;
  twoFactorEnabled: boolean;
  passwordLastChanged?: Date;
}

export interface NotificationSettings {
  email: {
    trades: boolean;
    waivers: boolean;
    scoring: boolean;
    leagueUpdates: boolean;
    newsletter: boolean;
  };
  push: {
    trades: boolean;
    waivers: boolean;
    scoring: boolean;
    leagueUpdates: boolean;
    injuries: boolean;
  };
  inApp: {
    trades: boolean;
    waivers: boolean;
    scoring: boolean;
    messages: boolean;
    reminders: boolean;
  };
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'never';
    time: string; // HH:MM format
  };
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  language: string;
  dateFormat: string;
  compactView: boolean;
  showPlayerPhotos: boolean;
  colorBlindMode: boolean;
  animations: boolean;
}

export interface FantasySettings {
  defaultScoringType: 'standard' | 'ppr' | 'half_ppr' | 'custom';
  defaultRosterSize: number;
  favoritePositions: string[];
  autoSetLineup: boolean;
  injuryAlerts: boolean;
  tradeBlockVisible: boolean;
  defaultLeagueSize: number;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showStats: boolean;
  showTeams: boolean;
  allowFriendRequests: boolean;
  dataSharing: boolean;
  analytics: boolean;
}

export interface ConnectedAccounts {
  google?: {
    connected: boolean;
    email?: string;
  };
  facebook?: {
    connected: boolean;
    name?: string;
  };
  twitter?: {
    connected: boolean;
    handle?: string;
  };
  espn?: {
    connected: boolean;
    username?: string;
  };
  yahoo?: {
    connected: boolean;
    username?: string;
  };
}

export interface SubscriptionSettings {
  plan: 'free' | 'pro' | 'premium';
  status: 'active' | 'canceled' | 'expired';
  renewalDate?: Date;
  paymentMethod?: {
    type: string;
    last4?: string;
  };
  features: string[];
}

// Notification Types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  action?: {
    label: string;
    url: string;
  };
}

export type NotificationType = 
  | 'trade_offer'
  | 'trade_accepted'
  | 'trade_rejected'
  | 'trade_processed'
  | 'waiver_processed'
  | 'waiver_failed'
  | 'roster_illegal'
  | 'message'
  | 'score_update'
  | 'injury_update'
  | 'league_invite'
  | 'draft_reminder'
  | 'payment_due'
  | 'achievement'
  | 'system';

// Head to Head Record Types
export interface HeadToHeadRecord {
  opponentId: string;
  opponentName: string;
  opponentAvatar?: string;
  wins: number;
  losses: number;
  ties: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
  lastMatchup?: {
    week: number;
    season: number;
    myScore: number;
    opponentScore: number;
    result: 'win' | 'loss' | 'tie';
  };
  currentMatchup?: {
    week: number;
    myProjected: number;
    opponentProjected: number;
  };
}

// League Types - Matching Prisma Schema
export interface League {
  id: string;
  name: string;
  description?: string;
  season: number;
  teamCount: number;
  scoringType: string;
  draftType: string;
  waiverType: string;
  waiverBudget: number;
  tradeDeadline?: Date;
  playoffWeeks: number;
  playoffTeams: number;
  status: string;
  isPublic: boolean;
  settings?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  teams?: Team[];
  members?: LeagueMember[];
  draft?: Draft;
  creator?: UserSummary;
  _count?: {
    teams: number;
    members: number;
  };
}

export interface LeagueMember {
  id: string;
  leagueId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  user?: UserSummary;
}

export interface Team {
  id: string;
  leagueId: string;
  userId: string;
  name: string;
  abbreviation?: string;
  logo?: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  waiverOrder: number;
  waiverBudget: number;
  isActive: boolean;
  isChampion: boolean;
  madePlayoffs: boolean;
  finalRank?: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  owner?: UserSummary;
  // Computed fields
  standing?: number;
  winPercentage?: number;
  pointsPerGame?: number;
  record?: string;
}

export interface UserSummary {
  id: string;
  username: string;
  avatar?: string;
}

export interface Draft {
  id: string;
  leagueId: string;
  type: string;
  status: string;
  rounds: number;
  timePerPick: number;
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  draftOrder?: string;
  currentPick: number;
  isPaused: boolean;
  settings?: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional computed fields
  currentRound?: number;
}

export interface Matchup {
  id: string;
  leagueId: string;
  week: number;
  season: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  homeTeam?: Team;
  awayTeam?: Team;
}

// Playoff Types
export interface PlayoffBracket {
  id: string;
  leagueId: string;
  season: number;
  teamCount: 4 | 6 | 8;
  rounds: PlayoffRound[];
  championId?: string;
  runnerUpId?: string;
  thirdPlaceId?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayoffRound {
  id: string;
  bracketId: string;
  round: number;
  matchups: PlayoffMatchup[];
}

export interface PlayoffMatchup {
  id: string;
  roundId: string;
  team1Id?: string;
  team2Id?: string;
  winnerId?: string;
  week: number;
  team1Score?: number;
  team2Score?: number;
  isComplete: boolean;
  // Relations
  team1?: Team;
  team2?: Team;
}

export interface ConsolationBracket {
  id: string;
  leagueId: string;
  season: number;
  type: 'TOILET_BOWL' | 'CONSOLATION_LADDER' | 'SACKO';
  bracketData: any;
  winnerId?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trophy {
  id: string;
  leagueId: string;
  season: number;
  type: string;
  winnerId: string;
  title: string;
  description?: string;
  icon?: string;
  createdAt: Date;
  winner?: UserSummary;
}

export interface Award {
  id: string;
  leagueId: string;
  season: number;
  type: string;
  recipientId: string;
  title: string;
  description?: string;
  value?: number;
  createdAt: Date;
  recipient?: UserSummary;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  category: string;
  requirements?: string;
  points?: number;
}

export interface SeasonArchive {
  id: string;
  leagueId: string;
  season: number;
  championId: string;
  runnerUpId?: string;
  thirdPlaceId?: string;
  regularSeasonWinnerId?: string;
  highestScoringTeamId?: string;
  totalPoints: number;
  averageScore: number;
  highestWeeklyScore: number;
  playoffFormat: string;
  createdAt: Date;
  // Relations
  champion?: UserSummary;
  runnerUp?: UserSummary;
  thirdPlace?: UserSummary;
}

export interface RecordBook {
  id: string;
  leagueId: string;
  category: string;
  subcategory?: string;
  recordType: 'SEASON' | 'WEEKLY' | 'CAREER' | 'GAME';
  value: number;
  holderId: string;
  season?: number;
  week?: number;
  opponent?: string;
  date: Date;
  description: string;
  // Relations
  holder?: UserSummary;
}