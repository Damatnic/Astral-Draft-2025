
export type PlayerPosition = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
export type Persona = 'The Analyst' | 'The Gambler' | 'The Trash Talker' | 'The Cagey Veteran' | 'The Homer' | 'The Enforcer' | 'Tom Brady' | 'Bill Belichick' | 'Jerry Jones';

export interface Player {
  id: number;
  name: string;
  position: PlayerPosition;
  team: string;
  rank: number;
  adp?: number;
  bye: number;
  tier?: number;
  age?: number;
  auctionValue: number;
  projectedPoints?: number;
  consistency?: 'high' | 'medium' | 'low';
  upside?: 'high' | 'medium' | 'low';
  injuryStatus?: 'healthy' | 'questionable' | 'doubtful' | 'out';
  injuryHistory?: 'minimal' | 'moderate' | 'extensive';
  yearsExperience?: number;
  situationChange?: 'improved' | 'same' | 'worse';
  role?: 'starter' | 'backup' | 'committee';
  handcuffValue?: 'high' | 'medium' | 'low';
  scheduleStrength?: {
    overall: 'easy' | 'medium' | 'hard';
    playoff: 'easy' | 'medium' | 'hard';
  };
  receptions?: number;
  stats: {
    projection: number;
    lastYear: number;
    vorp: number; // Value Over Replacement Player
    weeklyProjections: { [week: number]: number };
  };
  bio?: string;
  scoutingReport?: {
      summary: string;
      strengths: string[];
      weaknesses: string[];
  };
  contract?: {
      years: number;
      amount: string;
      guaranteed: string;
  };
  injuryHistory?: {
      date: string;
      injury: string;
      status: 'Active' | 'Out' | 'Questionable';
  }[];
  newsFeed?: NewsItem[];
  astralIntelligence?: {
      pregameRitual: string;
      offseasonHobby: string;
      signatureCelebration: string;
      spiritAnimal: string;
      lastBreakfast: string;
  };
  advancedMetrics?: AdvancedMetrics;
}

export type BadgeType = 'CHAMPION' | 'TOP_SCORER' | 'WIN_STREAK_3';

export interface Badge {
  id: string;
  type: BadgeType;
  text: string;
  season: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  isCommissioner?: boolean;
  persona?: Persona;
  isReady?: boolean;
  bio?: string;
  memberSince?: number;
  badges?: Badge[];
}

export type ChampionshipProbability = {
    week: number;
    probability: number;
};

export type DraftPickAsset = {
  season: number;
  round: number;
  originalTeamId?: number; // Tracks original owner if traded
};

export interface Team {
  id: number;
  name: string;
  owner: User;
  avatar: string;
  roster: Player[];
  budget: number; // for auction
  faab: number; // for waivers
  draftGrade?: DraftGrade;
  record: { wins: number; losses: number; ties: number };
  tradeBlock?: number[];
  chemistryReport?: string | null;
  seasonOutlook?: { prediction: string, keyPlayer: string; } | null;
  headerImage?: string;
  teamNeeds?: { position: PlayerPosition, rationale: string }[];
  awards?: { title: string; week: number; }[];
  championshipProbHistory?: ChampionshipProbability[];
  futureDraftPicks: DraftPickAsset[];
  motto?: string;
  themeSongUrl?: string;
  mascotUrl?: string;
  keepers?: number[]; // player IDs
}

export interface DraftGrade {
    overall: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
    value: number; // 0-100
    need: number; // 0-100
    bestPick: Player;
    biggestReach: Player;
    narrative: string;
}

export interface DraftPick {
  overall: number;
  round: number;
  pickInRound: number;
  teamId: number;
  playerId?: number;
  price?: number; // For auction
  timestamp?: number;
}

export type RecommendationType = 'VALUE' | 'UPSCALE' | 'POSITIONAL_NEED' | 'SAFE_PICK' | 'SLEEPER' | 'INJURY_RISK' | 'HOT_PROSPECT' | 'GAMBIT';

export interface Recommendation {
    id: number;
    player: Player;
    type: RecommendationType;
    reason: string;
}

export interface Analytics {
    draftEfficiency: number;
    valuePicks: number;
    championshipProbability: number;
    avgPickTime: number;
}

// Multiplayer & League Types
export type DraftFormat = 'SNAKE' | 'AUCTION';

export interface ScoringRule {
  stat: string;
  points: number;
}

export interface ScoringSettings {
  passing: ScoringRule[];
  rushing: ScoringRule[];
  receiving: ScoringRule[];
  misc: ScoringRule[];
}


export interface LeagueSettings {
    draftFormat: DraftFormat;
    teamCount: number;
    rosterSize: number;
    scoring: 'PPR' | 'Standard' | 'Half-PPR';
    tradeDeadline: number; // week number
    playoffFormat: '4_TEAM' | '6_TEAM';
    waiverRule: 'FAAB' | 'REVERSE_ORDER';
    scoringRules?: ScoringSettings;
    keeperCount?: number;
    aiAssistanceLevel: 'FULL' | 'BASIC';
}

export interface AuctionState {
    nominatingTeamId: number;
    nominatedPlayerId: number | null;
    currentBid: number;
    highBidderId: number | null;
    timer: number;
    lastBidTimestamp: number;
    bidHistory: { teamId: number, bid: number }[];
}

export interface TradeAnalysis {
    summary: string;
    winner: 'TEAM_A' | 'TEAM_B' | 'EVEN' | null;
}

export interface TradeOffer {
    id: string;
    fromTeamId: number;
    toTeamId: number;
    playersOffered: number[]; // Player IDs
    playersRequested: number[]; // Player IDs
    draftPicksOffered: DraftPickAsset[];
    draftPicksRequested: DraftPickAsset[];
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'VETOED' | 'FORCED';
    createdAt: number;
    tradeAnalysis?: TradeAnalysis | null;
}

export interface WaiverClaim {
    id: string;
    teamId: number;
    playerId: number;
    bid: number;
    playerToDropId?: number;
    status: 'PENDING' | 'PROCESSED';
}

export interface WaiverWireAdvice {
    summary: string;
    suggestedBid: number;
    optimalDropPlayerId?: number;
}

export type WaiverIntelligenceType = 'STORY' | 'STREAMING' | 'BREAKOUT';

export interface WaiverIntelligence {
    type: WaiverIntelligenceType;
    title: string;
    content: string;
    players: string[];
}

export interface StartSitAdvice {
    recommendedPlayerId: number;
    summary: string;
}

export interface WeeklyReportData {
    title: string;
    summary: string;
    gameOfWeek: {
        teamAName: string;
        teamBName: string;
        reason: string;
    };
    playerOfWeek: {
        playerName: string;
        teamName: string;
        stats: string;
        reason: string;
    };
    powerPlay?: {
        teamName: string;
        move: string;
        rationale: string;
    };
}

export interface SeasonReviewData {
    title: string;
    summary: string;
    superlatives: {
        title: string;
        teamName: string;
        rationale: string;
    }[];
    finalPowerRanking: {
        teamName: string;
        rank: number;
    }[];
}

export type BriefingItemType = 'MATCHUP_PREVIEW' | 'WAIVER_GEM' | 'ROSTER_WARNING' | 'PLAYER_SPOTLIGHT' | 'TRADE_TIP' | 'ON_THE_HOT_SEAT';

export interface DailyBriefingItem {
    type: BriefingItemType;
    title: string;
    summary: string;
    relatedPlayerIds?: number[];
    playerName?: string;
}

export interface MatchupPlayer {
    player: Player;
    projectedScore: number;
    actualScore: number;
    isHot?: boolean; // For RedZone alerts
}

export interface MatchupTeam {
    teamId: number;
    score: number;
    roster: MatchupPlayer[];
    seed?: number;
}

export interface Matchup {
    id: string;
    week: number;
    teamA: MatchupTeam;
    teamB: MatchupTeam;
}

export interface MatchupAnalysis {
    winProbability: number;
    keyPlayerMyTeam: string;
    keyPlayerOpponent: string;
}

export interface PowerRanking {
    teamId: number;
    rank: number;
    trend: 'up' | 'down' | 'same';
    justification: string;
}

export interface AiLineupSuggestion {
    recommendedStarters: number[]; // player IDs
    reasoning: string;
}

export type LeagueAwardType = 'HIGHEST_SCORE' | 'BEST_TRADE' | 'BEST_RECORD' | 'CLOSEST_MATCHUP';

export interface LeagueAward {
    id: string;
    type: LeagueAwardType;
    season: number;
    teamId: number;
    details: string; // e.g., "185.5 points in Week 8"
}

export interface LeagueHistoryEntry {
    season: number;
    championTeamId: number;
    records: {
        highestScore: { teamId: number; week: number; score: number; playerName: string; };
    };
    finalStandings: { teamId: number; rank: number; record: { wins: number; losses: number; ties: number } }[];
    leagueAwards?: LeagueAward[];
}

export interface AiProfileData {
    name: string;
    avatar: string;
    persona: Persona;
}

export interface CreateLeaguePayload {
    id: string;
    name: string;
    settings: LeagueSettings;
    status: 'PRE_DRAFT';
    commissionerId: string;
    userTeamName: string;
    userTeamAvatar: string;
    aiProfiles: AiProfileData[];
}

export interface TopRivalry {
    teamAId: number;
    teamBId: number;
    narrative: string;
}

export type ActivityType = 'TRADE' | 'WAIVER' | 'DRAFT';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  timestamp: number;
  content: string;
}

export interface LeagueInvitation {
    id: string;
    email: string;
    leagueId: string;
    link: string;
    status: 'PENDING' | 'ACCEPTED';
}

export interface DirectMessage {
    id: string;
    fromUserId: string;
    toUserId: string;
    text: string;
    timestamp: number;
    isRead: boolean;
}

export interface DraftCommentaryItem {
  pickNumber: number;
  text: string;
}

export interface Dues {
    [teamId: number]: {
        amount: number;
        paid: boolean;
    }
}

export interface Payout {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
}

export type GamedayEventType = 'TOUCHDOWN' | 'FIELD_GOAL' | 'INTERCEPTION' | 'FUMBLE' | 'BIG_PLAY' | 'REDZONE_ENTRY';

export interface GamedayEvent {
    id: string;
    timestamp: number;
    text: string;
    teamId: number;
    player: Player;
    type: GamedayEventType;
    points: number;
}

export type PlayerAwardType = 'MVP' | 'DRAFT_GEM' | 'WAIVER_HERO' | 'BIGGEST_BUST';

export interface PlayerAward {
    id: string;
    awardType: PlayerAwardType;
    playerId: number;
    season: number;
    awardedByTeamId: number;
}

export interface NewspaperArticle {
    headline: string;
    content: string;
}

export interface NewspaperContent {
    masthead: string;
    leadStory: NewspaperArticle;
    articles: NewspaperArticle[];
}

export interface League {
    id: string;
    name: string;
    settings: LeagueSettings;
    members: User[];
    status: 'PRE_DRAFT' | 'DRAFTING' | 'DRAFT_COMPLETE' | 'IN_SEASON' | 'PLAYOFFS' | 'COMPLETE';
    commissionerId: string;
    draftPicks: DraftPick[];
    teams: Team[];
    draftLog: DraftEvent[];
    chatMessages: ChatMessage[];
    auctionState?: AuctionState | null;
    tradeOffers: TradeOffer[];
    waiverClaims: WaiverClaim[];
    schedule: Matchup[];
    currentWeek: number;
    playoffBracket?: {
        [week: number]: Matchup[];
    };
    isMock?: boolean;
    isPublic?: boolean;
    history?: LeagueHistoryEntry[];
    topRivalry?: TopRivalry | null;
    logoUrl?: string;
    invitations?: LeagueInvitation[];
    draftCommentary: DraftCommentaryItem[];
    dues?: Dues;
    payouts?: Payout;
    sideBets?: SideBet[];
    playerAwards?: PlayerAward[];
}

export type ChatMessage = {
    id: string;
    user: User;
    text: string;
    timestamp: number;
    isSystemMessage?: boolean;
    reactions?: { [emoji: string]: string[] }; // emoji: array of user IDs
    mentions?: string[]; // array of user IDs
    tradeEvent?: TradeOffer;
    aiHotTake?: string;
};

export type DraftEventType = 'PICK' | 'TRADE' | 'PAUSE' | 'RESUME' | 'NOMINATION' | 'BID' | 'FIRST_PICK' | 'QB_RUSH' | 'DRAFT_STEAL' | 'THE_REACH' | 'MR_IRRELEVANT';

export interface DraftEvent {
    id: string;
    type: DraftEventType;
    timestamp: number;
    content: string;
    teamId?: number;
    playerId?: number;
}

export type View = 'AUTH' | 'DASHBOARD' | 'LEAGUE_HUB' | 'CREATE_LEAGUE' | 'DRAFT_ROOM' | 'LIVE_DRAFT_ROOM' | 'SEASON_CONTESTS' | 'TEAM_HUB' | 'ANALYTICS_HUB' | 'REALTIME_ANALYTICS' | 'HISTORICAL_ANALYTICS' | 'LEAGUE_STANDINGS' | 'WAIVER_WIRE' | 'MATCHUP' | 'POWER_RANKINGS' | 'PLAYOFF_BRACKET' | 'WEEKLY_REPORT' | 'LEAGUE_HISTORY' | 'SEASON_REVIEW' | 'START_SIT_TOOL' | 'ASSISTANT' | 'PROFILE' | 'LEAGUE_RULES' | 'COMMISSIONER_TOOLS' | 'DRAFT_STORY' | 'MANAGER_PROFILE' | 'PROJECT_INTEGRITY' | 'EDIT_ROSTER' | 'DRAFT_PREP_CENTER' | 'PERFORMANCE_TRENDS' | 'SEASON_STORY' | 'TEAM_COMPARISON' | 'EDIT_LEAGUE_SETTINGS' | 'SEASON_ARCHIVE' | 'LEAGUE_STATS' | 'SCHEDULE_MANAGEMENT' | 'MESSAGES' | 'CHAMPIONSHIP_ODDS' | 'PROJECTED_STANDINGS' | 'TROPHY_ROOM' | 'BEAT_THE_ORACLE' | 'LEAGUE_CONSTITUTION' | 'CUSTOM_SCORING_EDITOR' | 'FINANCE_TRACKER' | 'WEEKLY_RECAP_VIDEO' | 'GAMEDAY_HOST' | 'LEAGUE_NEWSPAPER' | 'KEEPER_SELECTION' | 'OPEN_LEAGUES' | 'LEADERBOARD';

export type PlayerNote = {
    text: string;
    audio?: string | null;
};

export type NotificationType = 'DRAFT' | 'TRADE' | 'WAIVER' | 'SYSTEM';
export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

export interface DraftRecapData {
    title: string;
    summary: string;
    awards: {
        awardTitle: string;
        teamName: string;
        playerName: string;
        rationale: string;
    }[];
}

export type WatchlistInsightType = 'MATCHUP_GOOD' | 'VALUE_INCREASE' | 'RISK_ALERT' | 'NEWS_POSITIVE';

export interface WatchlistInsight {
  playerId: number;
  insight: string;
  type: WatchlistInsightType;
}

export interface WebGroundingChunk {
    uri?: string;
    title?: string;
}

export interface GroundingChunk {
    web?: WebGroundingChunk;
}

export type CustomRanking = { [playerId: number]: number };

export interface LeaguePoll {
    id: string;
    question: string;
    options: { id: string; text: string; votes: string[] }[];
    createdBy: string; // user ID
    closesAt: number;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    timestamp: number;
}

export interface PlayerStory {
    title: string;
    narrative: string;
}

export interface TradeStory {
    title: string;
    narrative: string;
    winnerDeclared: string;
}

export interface SeasonStory {
    title: string;
    narrative: string;
}

export interface TeamComparison {
    strengthsA: string[];
    weaknessesA: string[];
    strengthsB: string[];
    weaknessesB: string[];
    analysis: string;
    prediction: string;
}

export type IntegrityTaskStatus = 'pending' | 'passed' | 'failed' | 'skipped';

export interface ScanFinding {
    severity: 'Critical' | 'Warning' | 'Passed';
    description: string;
    taskText: string;
    isCritical: boolean;
}

export interface IntegrityTask {
  id: number;
  category: string;
  text: string;
  status: IntegrityTaskStatus;
  isCritical?: boolean;
  details?: string;
}

export interface ChampionshipOddsSimulation {
    before: { teamId: number; probability: number; }[];
    after: { teamId: number; probability: number; }[];
}

export interface PlayerVolatility {
    boom: number; // 0-100
    bust: number; // 0-100
    narrative: string;
}

export interface ProjectedStanding {
    teamId: number;
    projectedWins: number;
    projectedLosses: number;
    projectedTies: number;
    narrative: string;
}

export interface AdvancedMetrics {
    snapCountPct: number;
    targetSharePct: number;
    redZoneTouches: number;
}

export type UserPrediction = {
    [matchupId: string]: number; // teamId of predicted winner
};

export type NewsItem = {
    date: string;
    headline: string;
    source: string;
};

export type LiveNewsItem = NewsItem & { id: string };

export interface RecapVideoScene {
    type: 'TITLE' | 'MATCHUP' | 'UPSET' | 'TOP_PERFORMER' | 'OUTRO';
    title?: string;
    narration: string;
    teamAName?: string;
    teamBName?: string;
    teamAScore?: number;
    teamBScore?: number;
    playerName?: string;
    playerTeam?: string;
    playerScore?: number;
}

export interface SideBet {
  id: string;
  proposerId: number;
  accepterId: number;
  terms: string;
  stakes: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'RESOLVED';
  winnerId?: number;
}

export interface SmartFaabAdvice {
    narrative: string;
    aggressiveBid: number;
    valueBid: number;
}

export interface TradeSuggestion {
    playersToSend: number[];
    playersToReceive: number[];
    toTeamId: number;
    rationale: string;
}

export interface AppState {
    theme: 'dark' | 'light';
    isLoading: boolean;
    user: User;
    leagues: League[];
    currentView: View;
    activeLeagueId: string | null;
    playerNotes: { [playerId: number]: PlayerNote };
    playerNicknames: { [playerId: number]: string };
    playerVolatility: { [playerId: number]: PlayerVolatility };
    newsImpactAnalyses: { [headline: string]: string };
    weeklyRecapScripts: { [leagueId_week: string]: RecapVideoScene[] };
    leagueNewspapers: { [leagueId_week: string]: NewspaperContent };
    smartFaabAdvice: { [playerId: number]: SmartFaabAdvice };
    gamedayEvents: { [matchupId: string]: GamedayEvent[] };
    teamSlogans: { [teamId: number]: string };
    playerQueues: { [leagueId:string]: number[] }; // array of player IDs
    dashboardLayout: string[];
    notifications: Notification[];
    isDraftPaused: boolean;
    soundEnabled: boolean;
    isAudioUnlocked: boolean;
    isCommandPaletteOpen: boolean;
    activeSeasonReviewYear: number | null;
    activeArchiveSeason: number | null;
    watchlist: number[]; // Array of player IDs
    watchlistInsights: WatchlistInsight[];
    activeManagerId: string | null;
    activePlayerDetail: Player | null;
    activePlayerDetailInitialTab: string;
    notificationPermission: 'default' | 'granted' | 'denied';
    customRankings: { [leagueId: string]: CustomRanking };
    leaguePolls: { [leagueId: string]: LeaguePoll[] };
    leagueAnnouncements: { [leagueId: string]: Announcement[] };
    teamsToCompare: [number, number] | null;
    isMobileNavOpen: boolean;
    recentCommands: { name: string, view: View }[];
    activityFeed: ActivityItem[];
    directMessages: DirectMessage[];
    userPredictions: { [leagueId: string]: { [week: number]: UserPrediction } };
    oraclePredictions: { [leagueId: string]: { [week: number]: UserPrediction } };
    playerAvatars: { [playerId: number]: string };
    // Accessibility Settings
    reduceMotion: boolean;
    highContrast: boolean;
    textSize: 'sm' | 'md' | 'lg';
}

// Holdout Validation Result Interface
export interface HoldoutResult {
    method: string;
    trainSize: number;
    testSize: number;
    validationSize?: number;
    trainScore: number;
    testScore: number;
    validationScore?: number;
    overfit: number;
    generalizationGap: number;
    metrics: {
        mae: number;
        rmse: number;
        r2: number;
        mape: number;
        fantasyAccuracy: number;
        rankingCorrelation: number;
    };
}

// Time Series Validation Result Interface
export interface TimeSeriesResult {
    method: string;
    totalSplits: number;
    trainSize: number;
    testSize: number;
    windowSize?: number;
    stepSize?: number;
    avgTrainScore: number;
    avgTestScore: number;
    scoreStability: number;
    temporalConsistency: number;
    splits: Array<{
        splitIndex: number;
        trainPeriod: string;
        testPeriod: string;
        trainScore: number;
        testScore: number;
        dataLeakage: boolean;
    }>;
    metrics: {
        mae: number;
        rmse: number;
        r2: number;
        mape: number;
        fantasyAccuracy: number;
        rankingCorrelation: number;
        temporalStability: number;
        seasonConsistency: number;
    };
}

// Bootstrap Resampling Result Interface
export interface BootstrapResult {
    method: string;
    nBootstraps: number;
    sampleSize: number;
    blockSize?: number;
    replacementRatio: number;
    avgScore: number;
    bootstrapScores: number[];
    confidenceInterval: {
        lower: number;
        upper: number;
        level: number;
    };
    statistics: {
        mean: number;
        std: number;
        variance: number;
        skewness: number;
        kurtosis: number;
        median: number;
        q25: number;
        q75: number;
    };
    metrics: {
        mae: number;
        rmse: number;
        r2: number;
        mape: number;
        fantasyAccuracy: number;
        stabilityIndex: number;
        diversityScore: number;
        robustnessMetric: number;
    };
    convergence: {
        converged: boolean;
        requiredSamples: number;
        stabilityThreshold: number;
        finalVariance: number;
    };
}

// Calibration Techniques Result Interface
export interface CalibrationResult {
    method: string;
    methodType: 'parametric' | 'non_parametric' | 'bayesian' | 'neural';
    calibrationType: 'platt' | 'isotonic' | 'bayesian' | 'temperature';
    originalBrierScore: number;
    calibratedBrierScore: number;
    brierImprovement: number;
    reliabilityDiagram: {
        binEdges: number[];
        binMeans: number[];
        binCounts: number[];
        expectedCalibrationError: number;
        maximumCalibrationError: number;
    };
    calibrationMetrics: {
        brierScore: number;
        logLoss: number;
        calibrationError: number;
        reliability: number;
        resolution: number;
        uncertainty: number;
    };
    parameters: {
        [key: string]: number | string | boolean;
    };
    predictions: {
        original: number[];
        calibrated: number[];
        actualOutcomes: number[];
    };
    performanceMetrics: {
        accuracy: number;
        precision: number;
        recall: number;
        f1Score: number;
        auc: number;
        fantasyAccuracy: number;
    };
    calibrationCurve: {
        meanPredicted: number[];
        fractionPositives: number[];
        binCounts: number[];
    };
}
