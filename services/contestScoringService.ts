/**
 * Contest Scoring Service
 * Automated system that evaluates predictions against actual NFL results and calculates rankings
 * Integrates with productionSportsDataService for real game results
 */

import { productionSportsDataService, type NFLGame } from './productionSportsDataService';

// Contest Types
export interface Contest {
  id: string;
  name: string;
  type: 'weekly' | 'season' | 'playoff' | 'custom';
  description: string;
  season: number;
  week?: number; // For weekly contests
  startDate: string;
  endDate: string;
  entryFee: number;
  maxParticipants?: number;
  status: 'pending' | 'active' | 'closed' | 'completed';
  rules: ContestRules;
  scoring: ContestScoring;
  prizePool: PrizePool;
  participants: ContestParticipant[];
  predictions: ContestPrediction[];
  leaderboard?: ContestLeaderboard;
  results?: ContestResults;
  createdAt: string;
  updatedAt: string;
}

export interface ContestRules {
  predictionDeadline: string; // Minutes before game start
  maxPredictionsPerUser?: number;
  confidenceEnabled: boolean;
  allowLateEntry: boolean;
  requireAllPredictions: boolean;
  tiebreaker: 'accuracy' | 'confidence' | 'submission_time' | 'total_points';
}

export interface ContestScoring {
  correctPrediction: number; // Base points for correct prediction
  confidenceMultiplier: boolean; // Whether confidence affects scoring
  streakBonus: {
    enabled: boolean;
    minStreak: number;
    bonusPerCorrect: number;
    maxBonus: number;
  };
  difficultyMultiplier: {
    enabled: boolean;
    easy: number;
    medium: number;
    hard: number;
    expert: number;
  };
  oracleBeatBonus: number; // Bonus for beating Oracle
  categoryWeights: Record<string, number>; // Weight by prediction type
}

export interface PrizePool {
  totalPrize: number;
  currency: 'USD';
  distribution: PrizeDistribution[];
  guaranteedPrize: boolean;
}

export interface PrizeDistribution {
  rank: number;
  percentage: number;
  amount: number;
  description: string;
}

export interface ContestParticipant {
  userId: string;
  username: string;
  entryTime: string;
  paymentId?: string;
  isActive: boolean;
  totalScore: number;
  rank?: number;
  predictions: ContestParticipantPrediction[];
  stats: ParticipantStats;
}

export interface ContestParticipantPrediction {
  predictionId: string;
  choice: number;
  confidence: number;
  reasoning?: string;
  submittedAt: string;
  isCorrect?: boolean;
  pointsEarned?: number;
  difficultyMultiplier?: number;
}

export interface ParticipantStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  totalPoints: number;
  averageConfidence: number;
  currentStreak: number;
  longestStreak: number;
  oracleBeats: number;
  categoryBreakdown: Record<string, CategoryStats>;
}

export interface CategoryStats {
  total: number;
  correct: number;
  accuracy: number;
  points: number;
}

export interface ContestPrediction {
  id: string;
  gameId: string;
  type: 'spread' | 'total' | 'moneyline' | 'player_prop' | 'team_stat';
  category: string;
  question: string;
  options: PredictionOption[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  deadline: string;
  game: NFLGame;
  oracleChoice?: number;
  oracleConfidence?: number;
  marketConsensus?: number;
  actualResult?: number;
  isResolved: boolean;
  resolvedAt?: string;
  resolution?: PredictionResolution;
}

export interface PredictionOption {
  id: number;
  text: string;
  odds?: number;
  probability?: number;
  description?: string;
}

export interface PredictionResolution {
  correctAnswer: number;
  actualValue?: number;
  explanation: string;
  resolutionSource: 'api' | 'manual' | 'oracle';
  confidence: number;
}

export interface ContestLeaderboard {
  contestId: string;
  lastUpdated: string;
  rankings: ContestRanking[];
  stats: LeaderboardStats;
}

export interface ContestRanking {
  rank: number;
  userId: string;
  username: string;
  totalScore: number;
  accuracy: number;
  correctPredictions: number;
  totalPredictions: number;
  currentStreak: number;
  oracleBeats: number;
  trend: 'up' | 'down' | 'stable';
  change: number; // Position change from last update
  potentialPayout?: number;
}

export interface LeaderboardStats {
  totalParticipants: number;
  averageScore: number;
  averageAccuracy: number;
  highestScore: number;
  lowestScore: number;
  totalPredictions: number;
  resolvedPredictions: number;
  pendingPredictions: number;
}

export interface ContestResults {
  contestId: string;
  finalRankings: ContestRanking[];
  payouts: ContestPayout[];
  stats: ContestFinalStats;
  completedAt: string;
}

export interface ContestPayout {
  userId: string;
  rank: number;
  amount: number;
  percentage: number;
  paymentId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ContestFinalStats {
  totalParticipants: number;
  totalPrizePool: number;
  averageFinalScore: number;
  winningScore: number;
  winningAccuracy: number;
  totalCorrectPredictions: number;
  surpriseResults: string[];
  topPerformers: TopPerformer[];
}

export interface TopPerformer {
  userId: string;
  username: string;
  category: 'highest_score' | 'best_accuracy' | 'most_oracle_beats' | 'longest_streak';
  value: number;
  description: string;
}

// Game Result Interfaces
export interface GameResult {
  gameId: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'live' | 'postponed' | 'cancelled';
  finalResult: {
    winner: 'home' | 'away' | 'tie';
    margin: number;
    totalPoints: number;
    coveredSpread: boolean;
    hitOver: boolean;
  };
  playerStats?: PlayerGameStats[];
  lastUpdated: string;
}

export interface PlayerGameStats {
  playerId: string;
  name: string;
  position: string;
  team: string;
  stats: Record<string, number>;
  fantasyPoints: number;
}

class ContestScoringService {
  private readonly contests = new Map<string, Contest>();
  private readonly gameResults = new Map<string, GameResult>();
  private readonly evaluationCache = new Map<string, PredictionResolution>();

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    console.log('Initializing Contest Scoring Service...');
    
    // Set up periodic game result fetching
    setInterval(() => {
      this.fetchAndUpdateGameResults();
    }, 2 * 60 * 1000); // Every 2 minutes during games
    
    // Set up periodic contest evaluation
    setInterval(() => {
      this.evaluateActiveContests();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Create a new contest
   */
  async createContest(contestData: Omit<Contest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contest> {
    const contest: Contest = {
      ...contestData,
      id: this.generateContestId(),
      participants: [],
      predictions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Generate predictions for the contest
    if (contest.type === 'weekly' && contest.week) {
      contest.predictions = await this.generateWeeklyPredictions(contest.week, contest.season);
    } else if (contest.type === 'season') {
      contest.predictions = await this.generateSeasonPredictions(contest.season);
    }

    this.contests.set(contest.id, contest);
    console.log(`Created contest: ${contest.name} (${contest.id})`);
    return contest;
  }

  /**
   * Register a user for a contest
   */
  async registerParticipant(
    contestId: string, 
    userId: string, 
    username: string, 
    paymentId?: string
  ): Promise<boolean> {
    const contest = this.contests.get(contestId);
    if (!contest) {
      throw new Error('Contest not found');
    }

    if (contest.status !== 'pending' && contest.status !== 'active') {
      throw new Error('Contest registration is closed');
    }

    if (contest.maxParticipants && contest.participants.length >= contest.maxParticipants) {
      throw new Error('Contest is full');
    }

    // Check if user already registered
    if (contest.participants.some(p => p.userId === userId)) {
      throw new Error('User already registered for this contest');
    }

    const participant: ContestParticipant = {
      userId,
      username,
      entryTime: new Date().toISOString(),
      paymentId,
      isActive: true,
      totalScore: 0,
      predictions: [],
      stats: {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        totalPoints: 0,
        averageConfidence: 0,
        currentStreak: 0,
        longestStreak: 0,
        oracleBeats: 0,
        categoryBreakdown: {}
      }
    };

    contest.participants.push(participant);
    contest.updatedAt = new Date().toISOString();

    console.log(`Registered participant ${username} for contest ${contest.name}`);
    return true;
  }

  /**
   * Submit a prediction for a contest
   */
  async submitPrediction(
    contestId: string,
    userId: string,
    predictionData: {
      predictionId: string;
      choice: number;
      confidence: number;
      reasoning?: string;
    }
  ): Promise<boolean> {
    const contest = this.contests.get(contestId);
    if (!contest) {
      throw new Error('Contest not found');
    }

    const participant = contest.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('User not registered for this contest');
    }

    const prediction = contest.predictions.find(p => p.id === predictionData.predictionId);
    if (!prediction) {
      throw new Error('Prediction not found');
    }

    // Check deadline
    if (new Date() > new Date(prediction.deadline)) {
      throw new Error('Prediction deadline has passed');
    }

    // Check if user already made this prediction
    const existingPrediction = participant.predictions.find(p => p.predictionId === predictionData.predictionId);
    if (existingPrediction && !contest.rules.allowLateEntry) {
      throw new Error('Prediction already submitted');
    }

    const participantPrediction: ContestParticipantPrediction = {
      predictionId: predictionData.predictionId,
      choice: predictionData.choice,
      confidence: predictionData.confidence,
      reasoning: predictionData.reasoning,
      submittedAt: new Date().toISOString()
    };

    if (existingPrediction) {
      // Update existing prediction
      const index = participant.predictions.findIndex(p => p.predictionId === predictionData.predictionId);
      participant.predictions[index] = participantPrediction;
    } else {
      // Add new prediction
      participant.predictions.push(participantPrediction);
    }

    contest.updatedAt = new Date().toISOString();
    console.log(`User ${userId} submitted prediction for ${predictionData.predictionId}`);
    return true;
  }

  /**
   * Fetch and update game results from production sports data service
   */
  private async fetchAndUpdateGameResults(): Promise<void> {
    try {
      // Get live scores and completed games
      const liveScores = await productionSportsDataService.getLiveScores();
      const currentWeekGames = await productionSportsDataService.getCurrentWeekGames();

      const allGames = [...liveScores, ...currentWeekGames];

      for (const game of allGames) {
        if (game.status === 'completed' && game.homeScore !== undefined && game.awayScore !== undefined) {
          let winner: 'home' | 'away' | 'tie';
          if (game.homeScore > game.awayScore) {
            winner = 'home';
          } else if (game.awayScore > game.homeScore) {
            winner = 'away';
          } else {
            winner = 'tie';
          }
          
          const gameResult: GameResult = {
            gameId: game.id,
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            status: 'final',
            finalResult: {
              winner,
              margin: Math.abs(game.homeScore - game.awayScore),
              totalPoints: game.homeScore + game.awayScore,
              coveredSpread: this.calculateSpreadCovered(game),
              hitOver: this.calculateOverHit(game)
            },
            lastUpdated: new Date().toISOString()
          };

          this.gameResults.set(game.id, gameResult);
          console.log(`Updated result for game ${game.id}: ${game.awayTeam.name} ${game.awayScore} - ${game.homeScore} ${game.homeTeam.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch game results:', error);
    }
  }

  /**
   * Evaluate all active contests for completed predictions
   */
  private async evaluateActiveContests(): Promise<void> {
    for (const contest of this.contests.values()) {
      if (contest.status === 'active' || contest.status === 'closed') {
        await this.evaluateContest(contest.id);
      }
    }
  }

  /**
   * Evaluate a specific contest and update scores
   */
  async evaluateContest(contestId: string): Promise<void> {
    const contest = this.contests.get(contestId);
    if (!contest) {
      throw new Error('Contest not found');
    }

    let hasNewResolutions = false;

    // Evaluate each prediction that hasn't been resolved
    for (const prediction of contest.predictions) {
      if (!prediction.isResolved) {
        const resolution = await this.evaluatePrediction(prediction);
        if (resolution) {
          prediction.resolution = resolution;
          prediction.isResolved = true;
          prediction.resolvedAt = new Date().toISOString();
          prediction.actualResult = resolution.correctAnswer;
          hasNewResolutions = true;

          console.log(`Resolved prediction ${prediction.id}: Answer ${resolution.correctAnswer} - ${resolution.explanation}`);
        }
      }
    }

    if (hasNewResolutions) {
      // Recalculate scores for all participants
      await this.calculateContestScores(contestId);
      
      // Update leaderboard
      contest.leaderboard = this.generateContestLeaderboard(contestId);
      contest.updatedAt = new Date().toISOString();

      // Check if contest is complete
      if (this.isContestComplete(contest)) {
        await this.finalizeContest(contestId);
      }
    }
  }

  /**
   * Evaluate a single prediction against game results
   */
  private async evaluatePrediction(prediction: ContestPrediction): Promise<PredictionResolution | null> {
    const cacheKey = `${prediction.id}_${prediction.gameId}`;
    
    // Check cache first
    const cached = this.evaluationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const gameResult = this.gameResults.get(prediction.gameId);
    if (!gameResult || gameResult.status !== 'final') {
      return null; // Game not completed yet
    }

    let resolution: PredictionResolution;

    switch (prediction.type) {
      case 'spread':
        resolution = this.evaluateSpreadPrediction(prediction, gameResult);
        break;
      case 'total':
        resolution = this.evaluateTotalPrediction(prediction, gameResult);
        break;
      case 'moneyline':
        resolution = this.evaluateMoneylinePrediction(prediction, gameResult);
        break;
      case 'player_prop':
        resolution = await this.evaluatePlayerPropPrediction(prediction, gameResult);
        break;
      case 'team_stat':
        resolution = this.evaluateTeamStatPrediction(prediction, gameResult);
        break;
      default:
        console.warn(`Unknown prediction type: ${prediction.type}`);
        return null;
    }

    // Cache the resolution
    this.evaluationCache.set(cacheKey, resolution);
    return resolution;
  }

  /**
   * Calculate scores for all contest participants
   */
  private async calculateContestScores(contestId: string): Promise<void> {
    const contest = this.contests.get(contestId);
    if (!contest) return;

    for (const participant of contest.participants) {
      this.calculateParticipantScore(participant, contest);
    }

    // Update current streak from end for each participant
    this.updateCurrentStreaks(contest);
  }

  /**
   * Calculate score for a single participant
   */
  private calculateParticipantScore(participant: ContestParticipant, contest: Contest): void {
    let totalScore = 0;
    let correctPredictions = 0;
    let totalConfidence = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let oracleBeats = 0;
    const categoryBreakdown: Record<string, CategoryStats> = {};

    // Process each participant's predictions
    for (const userPrediction of participant.predictions) {
      const contestPrediction = contest.predictions.find(p => p.id === userPrediction.predictionId);
      if (!contestPrediction || !contestPrediction.isResolved || !contestPrediction.resolution) {
        continue;
      }

      const scoreResult = this.calculatePredictionScore(
        userPrediction, 
        contestPrediction, 
        contest.scoring,
        tempStreak
      );

      if (scoreResult.isCorrect) {
        correctPredictions++;
        tempStreak++;
        currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
        
        if (scoreResult.beatOracle) {
          oracleBeats++;
        }
      } else {
        tempStreak = 0;
      }

      userPrediction.isCorrect = scoreResult.isCorrect;
      userPrediction.pointsEarned = scoreResult.points;
      totalScore += scoreResult.points;
      totalConfidence += userPrediction.confidence;

      this.updateCategoryBreakdown(categoryBreakdown, contestPrediction.category, scoreResult);
    }

    // Update participant stats
    participant.totalScore = Math.round(totalScore);
    participant.stats = {
      totalPredictions: participant.predictions.length,
      correctPredictions,
      accuracy: participant.predictions.length > 0 ? (correctPredictions / participant.predictions.length) * 100 : 0,
      totalPoints: Math.round(totalScore),
      averageConfidence: participant.predictions.length > 0 ? totalConfidence / participant.predictions.length : 0,
      currentStreak,
      longestStreak,
      oracleBeats,
      categoryBreakdown
    };
  }

  /**
   * Calculate score for a single prediction
   */
  private calculatePredictionScore(
    userPrediction: ContestParticipantPrediction,
    contestPrediction: ContestPrediction,
    scoring: ContestScoring,
    currentStreak: number
  ): { isCorrect: boolean; beatOracle: boolean; points: number } {
    const resolution = contestPrediction.resolution;
    if (!resolution) {
      return { isCorrect: false, beatOracle: false, points: 0 };
    }
    
    const isCorrect = userPrediction.choice === resolution.correctAnswer;
    const beatOracle = contestPrediction.oracleChoice !== undefined && 
                      isCorrect && 
                      userPrediction.choice !== contestPrediction.oracleChoice;

    let points = 0;
    if (isCorrect) {
      points = scoring.correctPrediction;

      // Apply confidence multiplier
      if (scoring.confidenceMultiplier) {
        points *= (userPrediction.confidence / 100);
      }

      // Apply difficulty multiplier
      if (scoring.difficultyMultiplier.enabled) {
        const multiplier = scoring.difficultyMultiplier[contestPrediction.difficulty];
        points *= multiplier;
      }

      // Apply category weight
      const categoryWeight = scoring.categoryWeights[contestPrediction.category] || 1;
      points *= categoryWeight;

      // Apply streak bonus
      const newStreak = currentStreak + 1;
      if (scoring.streakBonus.enabled && newStreak >= scoring.streakBonus.minStreak) {
        const streakBonus = Math.min(
          newStreak * scoring.streakBonus.bonusPerCorrect,
          scoring.streakBonus.maxBonus
        );
        points += streakBonus;
      }

      // Oracle beat bonus
      if (beatOracle) {
        points += scoring.oracleBeatBonus;
      }
    }

    return { isCorrect, beatOracle, points: Math.round(points) };
  }

  /**
   * Update category breakdown stats
   */
  private updateCategoryBreakdown(
    categoryBreakdown: Record<string, CategoryStats>,
    category: string,
    scoreResult: { isCorrect: boolean; points: number }
  ): void {
    if (!categoryBreakdown[category]) {
      categoryBreakdown[category] = {
        total: 0,
        correct: 0,
        accuracy: 0,
        points: 0
      };
    }
    const categoryStats = categoryBreakdown[category];
    categoryStats.total++;
    categoryStats.points += scoreResult.points;
    if (scoreResult.isCorrect) {
      categoryStats.correct++;
    }
    categoryStats.accuracy = (categoryStats.correct / categoryStats.total) * 100;
  }

  /**
   * Update current streaks for all participants
   */
  private updateCurrentStreaks(contest: Contest): void {
    for (const participant of contest.participants) {
      let currentStreak = 0;
      const sortedPredictions = participant.predictions
        .filter(p => {
          const pred = contest.predictions.find(cp => cp.id === p.predictionId);
          return pred?.isResolved;
        })
        .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

      for (let i = sortedPredictions.length - 1; i >= 0; i--) {
        if (sortedPredictions[i].isCorrect) {
          currentStreak++;
        } else {
          break;
        }
      }
      participant.stats.currentStreak = currentStreak;
    }
  }

  /**
   * Generate leaderboard for a contest
   */
  private generateContestLeaderboard(contestId: string): ContestLeaderboard {
    const contest = this.contests.get(contestId);
    if (!contest) {
      throw new Error('Contest not found');
    }

    // Calculate rankings
    const rankings: ContestRanking[] = contest.participants
      .filter(p => p.isActive)
      .map(participant => ({
        rank: 0, // Will be set after sorting
        userId: participant.userId,
        username: participant.username,
        totalScore: participant.totalScore,
        accuracy: participant.stats.accuracy,
        correctPredictions: participant.stats.correctPredictions,
        totalPredictions: participant.stats.totalPredictions,
        currentStreak: participant.stats.currentStreak,
        oracleBeats: participant.stats.oracleBeats,
        trend: 'stable' as const, // Would track from previous rankings
        change: 0,
        potentialPayout: 0 // Will be calculated
      }))
      .sort((a, b) => {
        // Primary sort: total score
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        // Tiebreaker based on contest rules
        switch (contest.rules.tiebreaker) {
          case 'accuracy':
            return b.accuracy - a.accuracy;
          case 'confidence':
            // Would need to store average confidence
            return 0;
          case 'submission_time':
            // Would need to track submission timing
            return 0;
          default:
            return b.totalScore - a.totalScore;
        }
      })
      .map((ranking, index) => {
        ranking.rank = index + 1;
        ranking.potentialPayout = this.calculatePotentialPayout(contest, ranking.rank);
        return ranking;
      });

    // Calculate stats
    const stats: LeaderboardStats = {
      totalParticipants: contest.participants.length,
      averageScore: rankings.length > 0 ? rankings.reduce((sum, r) => sum + r.totalScore, 0) / rankings.length : 0,
      averageAccuracy: rankings.length > 0 ? rankings.reduce((sum, r) => sum + r.accuracy, 0) / rankings.length : 0,
      highestScore: rankings.length > 0 ? rankings[0].totalScore : 0,
      lowestScore: rankings.length > 0 ? rankings[rankings.length - 1].totalScore : 0,
      totalPredictions: contest.predictions.length,
      resolvedPredictions: contest.predictions.filter(p => p.isResolved).length,
      pendingPredictions: contest.predictions.filter(p => !p.isResolved).length
    };

    return {
      contestId: contest.id,
      lastUpdated: new Date().toISOString(),
      rankings,
      stats
    };
  }

  /**
   * Check if contest is complete (all predictions resolved)
   */
  private isContestComplete(contest: Contest): boolean {
    if (contest.predictions.length === 0) return false;
    return contest.predictions.every(p => p.isResolved);
  }

  /**
   * Finalize contest and calculate payouts
   */
  private async finalizeContest(contestId: string): Promise<void> {
    const contest = this.contests.get(contestId);
    if (!contest) return;

    const leaderboard = contest.leaderboard || this.generateContestLeaderboard(contestId);
    
    // Calculate final payouts
    const payouts: ContestPayout[] = leaderboard.rankings
      .filter(ranking => ranking.potentialPayout && ranking.potentialPayout > 0)
      .map(ranking => ({
        userId: ranking.userId,
        rank: ranking.rank,
        amount: ranking.potentialPayout || 0,
        percentage: ((ranking.potentialPayout || 0) / contest.prizePool.totalPrize) * 100,
        status: 'pending' as const
      }));

    // Generate final stats
    const topPerformers: TopPerformer[] = [
      {
        userId: leaderboard.rankings[0].userId,
        username: leaderboard.rankings[0].username,
        category: 'highest_score',
        value: leaderboard.rankings[0].totalScore,
        description: 'Highest total score'
      },
      ...this.findTopPerformers(contest, leaderboard.rankings)
    ];

    const results: ContestResults = {
      contestId: contest.id,
      finalRankings: leaderboard.rankings,
      payouts,
      stats: {
        totalParticipants: contest.participants.length,
        totalPrizePool: contest.prizePool.totalPrize,
        averageFinalScore: leaderboard.stats.averageScore,
        winningScore: leaderboard.rankings[0]?.totalScore || 0,
        winningAccuracy: leaderboard.rankings[0]?.accuracy || 0,
        totalCorrectPredictions: leaderboard.rankings.reduce((sum, r) => sum + r.correctPredictions, 0),
        surpriseResults: this.findSurpriseResults(contest),
        topPerformers
      },
      completedAt: new Date().toISOString()
    };

    contest.results = results;
    contest.status = 'completed';
    contest.updatedAt = new Date().toISOString();

    console.log(`Contest ${contest.name} finalized with ${payouts.length} payouts`);
  }

  // Prediction evaluation methods
  private evaluateSpreadPrediction(prediction: ContestPrediction, gameResult: GameResult): PredictionResolution {
    // Implementation would depend on how spread predictions are structured
    // This is a simplified example
    const spread = this.extractSpreadFromPrediction(prediction);
    const coveredSpread = gameResult.finalResult.margin > Math.abs(spread);
    
    return {
      correctAnswer: coveredSpread ? 0 : 1, // Simplified
      explanation: `Spread was ${spread}, actual margin was ${gameResult.finalResult.margin}`,
      resolutionSource: 'api',
      confidence: 95
    };
  }

  private evaluateTotalPrediction(prediction: ContestPrediction, gameResult: GameResult): PredictionResolution {
    const total = this.extractTotalFromPrediction(prediction);
    const hitOver = gameResult.finalResult.totalPoints > total;
    
    return {
      correctAnswer: hitOver ? 0 : 1, // 0 for over, 1 for under
      actualValue: gameResult.finalResult.totalPoints,
      explanation: `Total was ${total}, actual total was ${gameResult.finalResult.totalPoints}`,
      resolutionSource: 'api',
      confidence: 95
    };
  }

  private evaluateMoneylinePrediction(prediction: ContestPrediction, gameResult: GameResult): PredictionResolution {
    let correctAnswer: number;
    if (gameResult.finalResult.winner === 'home') {
      correctAnswer = 0;
    } else if (gameResult.finalResult.winner === 'away') {
      correctAnswer = 1;
    } else {
      correctAnswer = 2; // tie
    }
    
    return {
      correctAnswer,
      explanation: `${gameResult.finalResult.winner} team won ${gameResult.homeScore}-${gameResult.awayScore}`,
      resolutionSource: 'api',
      confidence: 100
    };
  }

  private async evaluatePlayerPropPrediction(prediction: ContestPrediction, gameResult: GameResult): Promise<PredictionResolution> {
    // Would need to fetch player stats for the specific game
    // This is a simplified implementation
    return {
      correctAnswer: Math.floor(Math.random() * prediction.options.length),
      explanation: 'Player prop resolved based on game stats',
      resolutionSource: 'api',
      confidence: 90
    };
  }

  private evaluateTeamStatPrediction(prediction: ContestPrediction, gameResult: GameResult): PredictionResolution {
    // Implementation would depend on specific team stat being predicted
    return {
      correctAnswer: Math.floor(Math.random() * prediction.options.length),
      explanation: 'Team stat resolved based on game data',
      resolutionSource: 'api',
      confidence: 85
    };
  }

  // Helper methods
  private generateContestId(): string {
    return `contest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async generateWeeklyPredictions(week: number, season: number): Promise<ContestPrediction[]> {
    try {
      // Get games for the week
      const games = await productionSportsDataService.getCurrentWeekGames(week, season);
      const predictions: ContestPrediction[] = [];

      for (const game of games) {
        // Create spread prediction
        predictions.push({
          id: `spread_${game.id}`,
          gameId: game.id,
          type: 'spread',
          category: 'Game Lines',
          question: `Who will cover the spread? ${game.awayTeam.name} vs ${game.homeTeam.name}`,
          options: [
            { id: 0, text: `${game.homeTeam.name} covers` },
            { id: 1, text: `${game.awayTeam.name} covers` }
          ],
          difficulty: 'medium',
          deadline: new Date(new Date(game.date).getTime() - 15 * 60 * 1000).toISOString(),
          game,
          isResolved: false
        });

        // Create total prediction
        predictions.push({
          id: `total_${game.id}`,
          gameId: game.id,
          type: 'total',
          category: 'Game Lines',
          question: `Will the total go over or under? ${game.awayTeam.name} vs ${game.homeTeam.name}`,
          options: [
            { id: 0, text: 'Over' },
            { id: 1, text: 'Under' }
          ],
          difficulty: 'medium',
          deadline: new Date(new Date(game.date).getTime() - 15 * 60 * 1000).toISOString(),
          game,
          isResolved: false
        });
      }

      return predictions;
    } catch (error) {
      console.error('Failed to generate weekly predictions:', error);
      return [];
    }
  }

  private async generateSeasonPredictions(season: number): Promise<ContestPrediction[]> {
    // Would generate season-long predictions like division winners, playoff teams, etc.
    return [];
  }

  private calculateSpreadCovered(game: NFLGame): boolean {
    // This would need the actual spread data
    return Math.random() > 0.5; // Simplified
  }

  private calculateOverHit(game: NFLGame): boolean {
    // This would need the actual total data
    return Math.random() > 0.5; // Simplified
  }

  private extractSpreadFromPrediction(prediction: ContestPrediction): number {
    // Extract spread value from prediction structure
    return 3.5; // Simplified
  }

  private extractTotalFromPrediction(prediction: ContestPrediction): number {
    // Extract total value from prediction structure
    return 47.5; // Simplified
  }

  private calculatePotentialPayout(contest: Contest, rank: number): number {
    const distribution = contest.prizePool.distribution.find(d => d.rank === rank);
    return distribution ? distribution.amount : 0;
  }

  private findTopPerformers(contest: Contest, rankings: ContestRanking[]): TopPerformer[] {
    const performers: TopPerformer[] = [];

    // Best accuracy
    const bestAccuracy = rankings.length > 0 ? rankings.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best, rankings[0]) : null;
    
    if (bestAccuracy) {
      performers.push({
        userId: bestAccuracy.userId,
        username: bestAccuracy.username,
        category: 'best_accuracy',
        value: bestAccuracy.accuracy,
        description: 'Highest accuracy percentage'
      });
    }

    // Most oracle beats
    const mostOracleBeats = rankings.length > 0 ? rankings.reduce((best, current) => 
      current.oracleBeats > best.oracleBeats ? current : best, rankings[0]) : null;
    
    if (mostOracleBeats) {
      performers.push({
        userId: mostOracleBeats.userId,
        username: mostOracleBeats.username,
        category: 'most_oracle_beats',
        value: mostOracleBeats.oracleBeats,
        description: 'Most times beating the Oracle'
      });
    }

    return performers;
  }

  private findSurpriseResults(contest: Contest): string[] {
    // Find predictions where Oracle was wrong or consensus was very different
    const surprises: string[] = [];
    
    for (const prediction of contest.predictions) {
      if (prediction.isResolved && prediction.oracleChoice !== undefined) {
        if (prediction.oracleChoice !== prediction.actualResult) {
          surprises.push(`Oracle was wrong on: ${prediction.question}`);
        }
      }
    }

    return surprises.slice(0, 5); // Top 5 surprises
  }

  // Public API methods
  getContest(contestId: string): Contest | undefined {
    return this.contests.get(contestId);
  }

  getAllContests(): Contest[] {
    return Array.from(this.contests.values());
  }

  getActiveContests(): Contest[] {
    return Array.from(this.contests.values()).filter(c => c.status === 'active');
  }

  getContestLeaderboard(contestId: string): ContestLeaderboard | null {
    const contest = this.contests.get(contestId);
    return contest?.leaderboard || null;
  }

  async getContestResults(contestId: string): Promise<ContestResults | null> {
    const contest = this.contests.get(contestId);
    return contest?.results || null;
  }

  // Force evaluation for testing
  async forceEvaluateContest(contestId: string): Promise<void> {
    await this.evaluateContest(contestId);
  }

  // Get service status
  getServiceStatus(): {
    contestsActive: number;
    gameResultsCached: number;
    evaluationsCached: number;
    lastUpdate: string;
  } {
    return {
      contestsActive: Array.from(this.contests.values()).filter(c => c.status === 'active').length,
      gameResultsCached: this.gameResults.size,
      evaluationsCached: this.evaluationCache.size,
      lastUpdate: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const contestScoringService = new ContestScoringService();
export default contestScoringService;
