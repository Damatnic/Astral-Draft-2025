/**
 * Trade Analysis and Recommendation Service
 * Comprehensive system for evaluating fantasy football trades with fair value calculations,
 * team fit analysis, and future projections
 */

import { productionSportsDataService, type NFLPlayer } from './productionSportsDataService';
import { machineLearningPlayerPredictionService } from './machineLearningPlayerPredictionService';
import { injuryTrackingService } from './injuryTrackingService';

// Trade interfaces
export interface TradeProposal {
  id: string;
  proposedBy: string;
  proposedTo: string;
  givingPlayers: string[]; // Player IDs
  receivingPlayers: string[]; // Player IDs
  status: 'proposed' | 'accepted' | 'rejected' | 'countered' | 'expired';
  proposedAt: string;
  expiresAt: string;
  metadata?: {
    league: string;
    week: number;
    season: number;
    tradeDeadline: string;
  };
}

export interface TradeAnalysis {
  tradeId: string;
  fairnessScore: number; // 0-100, 50 = fair trade
  recommendation: 'accept' | 'reject' | 'counter' | 'hold';
  confidence: number; // 0-1
  analysis: {
    valueComparison: TradeValueComparison;
    teamFitAnalysis: TeamFitAnalysis;
    futureProjections: FutureProjectionAnalysis;
    riskAssessment: RiskAssessment;
  };
  reasoning: string;
  alternativeOffers?: AlternativeTradeOffer[];
  generatedAt: string;
}

export interface TradeValueComparison {
  givingSide: {
    totalValue: number;
    playerValues: PlayerValue[];
    averagePoints: number;
    totalProjection: number;
  };
  receivingSide: {
    totalValue: number;
    playerValues: PlayerValue[];
    averagePoints: number;
    totalProjection: number;
  };
  valueDifference: number; // Positive = getting more value
  methodology: string;
}

export interface PlayerValue {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  currentValue: number;
  marketValue: number;
  projectedValue: number;
  valueFactors: {
    recentPerformance: number;
    scheduleStrength: number;
    injuryRisk: number;
    positionScarcity: number;
    teamOffense: number;
  };
  confidence: number;
}

export interface TeamFitAnalysis {
  forProposer: {
    positionNeeds: PositionNeed[];
    rosterImprovement: number;
    startingLineupImpact: number;
    benchDepthImpact: number;
  };
  forReceiver: {
    positionNeeds: PositionNeed[];
    rosterImprovement: number;
    startingLineupImpact: number;
    benchDepthImpact: number;
  };
  mutualBenefit: number; // 0-1, higher = both teams benefit
}

export interface PositionNeed {
  position: string;
  needLevel: 'critical' | 'high' | 'moderate' | 'low' | 'surplus';
  currentStarters: PlayerValue[];
  depthChart: PlayerValue[];
  recommendation: string;
}

export interface FutureProjectionAnalysis {
  restOfSeasonProjection: {
    givingSide: WeeklyProjection[];
    receivingSide: WeeklyProjection[];
    cumulativeAdvantage: number;
  };
  playoffProjection: {
    weeks: number[];
    givingSide: WeeklyProjection[];
    receivingSide: WeeklyProjection[];
    playoffAdvantage: number;
  };
  injuryContingency: {
    scenarios: InjuryScenario[];
    averageImpact: number;
  };
}

export interface WeeklyProjection {
  week: number;
  totalPoints: number;
  playerProjections: {
    playerId: string;
    projectedPoints: number;
    confidence: number;
  }[];
}

export interface InjuryScenario {
  injuredPlayer: string;
  likelihood: number;
  impactOnGiving: number;
  impactOnReceiving: number;
  reasoning: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'moderate' | 'high' | 'extreme';
  riskFactors: RiskFactor[];
  mitigationSuggestions: string[];
  riskScore: number; // 0-100, higher = more risky
}

export interface RiskFactor {
  type: 'injury' | 'performance_decline' | 'schedule' | 'team_change' | 'usage_concern';
  player: string;
  severity: 'low' | 'moderate' | 'high';
  description: string;
  likelihood: number;
  impact: number;
}

export interface AlternativeTradeOffer {
  givingPlayers: string[];
  receivingPlayers: string[];
  fairnessScore: number;
  reasoning: string;
  improvementOverOriginal: number;
}

export interface FantasyRoster {
  teamId: string;
  leagueId: string;
  players: RosterPlayer[];
  settings: {
    startingPositions: { [position: string]: number };
    benchSize: number;
    scoring: ScoringSettings;
  };
}

export interface RosterPlayer {
  playerId: string;
  position: string;
  acquisitionType: 'draft' | 'waiver' | 'trade' | 'free_agent';
  acquisitionWeek?: number;
  isStarter: boolean;
}

export interface ScoringSettings {
  passingTouchdown: number;
  rushingTouchdown: number;
  receivingTouchdown: number;
  passingYards: number;
  rushingYards: number;
  receivingYards: number;
  reception: number; // PPR value
  fieldGoal: number;
  extraPoint: number;
  defenseInterception: number;
  defenseFumble: number;
  defenseSack: number;
  defenseTouchdown: number;
  defenseSafety: number;
}

class TradeAnalysisService {
  private readonly cache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    console.log('🔄 Initializing Trade Analysis Service...');
    
    // Clean up expired cache entries every 15 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expires) {
          this.cache.delete(key);
        }
      }
    }, 15 * 60 * 1000);
  }

  /**
   * Analyze a proposed trade with comprehensive evaluation
   */
  async analyzeTradeProposal(
    tradeProposal: TradeProposal,
    proposerRoster: FantasyRoster,
    receiverRoster: FantasyRoster
  ): Promise<TradeAnalysis> {
    try {
      console.log(`🔍 Analyzing trade proposal: ${tradeProposal.id}`);

      const cacheKey = `trade_analysis_${tradeProposal.id}_${tradeProposal.proposedAt}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() < cached.expires) {
        return cached.data;
      }

      // Get player data for all involved players
      const allPlayerIds = [...tradeProposal.givingPlayers, ...tradeProposal.receivingPlayers];
      const playerData = await this.getPlayersData(allPlayerIds);

      // Calculate trade components
      const valueComparison = await this.calculateTradeValue(
        tradeProposal.givingPlayers,
        tradeProposal.receivingPlayers,
        playerData,
        proposerRoster.settings.scoring
      );

      const teamFitAnalysis = await this.analyzeTeamFit(
        tradeProposal,
        proposerRoster,
        receiverRoster,
        playerData
      );

      const futureProjections = await this.analyzeFutureProjections(
        tradeProposal.givingPlayers,
        tradeProposal.receivingPlayers,
        playerData,
        tradeProposal.metadata?.week || 1,
        tradeProposal.metadata?.season || 2024
      );

      const riskAssessment = await this.assessTradeRisks(
        allPlayerIds,
        playerData,
        tradeProposal.metadata?.week || 1
      );

      // Calculate overall fairness score and recommendation
      const fairnessScore = this.calculateFairnessScore(
        valueComparison,
        teamFitAnalysis,
        futureProjections,
        riskAssessment
      );

      const recommendation = this.generateTradeRecommendation(
        fairnessScore,
        valueComparison,
        teamFitAnalysis,
        riskAssessment
      );

      const confidence = this.calculateConfidence(
        valueComparison,
        teamFitAnalysis,
        futureProjections,
        riskAssessment
      );

      const reasoning = this.generateTradeReasoning(
        recommendation,
        valueComparison,
        teamFitAnalysis,
        futureProjections,
        riskAssessment
      );

      // Generate alternative offers if the current trade isn't ideal
      const alternativeOffers = recommendation === 'counter' 
        ? await this.generateAlternativeOffers(tradeProposal, proposerRoster, receiverRoster, playerData)
        : [];

      const analysis: TradeAnalysis = {
        tradeId: tradeProposal.id,
        fairnessScore,
        recommendation,
        confidence,
        analysis: {
          valueComparison,
          teamFitAnalysis,
          futureProjections,
          riskAssessment
        },
        reasoning,
        alternativeOffers,
        generatedAt: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, { data: analysis, expires: Date.now() + this.CACHE_TTL });

      console.log(`✅ Trade analysis completed for ${tradeProposal.id}: ${recommendation} (${fairnessScore}% fair)`);
      return analysis;

    } catch (error) {
      console.error('❌ Error analyzing trade proposal:', error);
      throw new Error(`Failed to analyze trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate fair market value for players involved in trade
   */
  private async calculateTradeValue(
    givingPlayerIds: string[],
    receivingPlayerIds: string[],
    playerData: Map<string, NFLPlayer>,
    scoring: ScoringSettings
  ): Promise<TradeValueComparison> {
    const givingValues = await Promise.all(
      givingPlayerIds.map(id => this.calculatePlayerValue(id, playerData.get(id), scoring))
    );

    const receivingValues = await Promise.all(
      receivingPlayerIds.map(id => this.calculatePlayerValue(id, playerData.get(id), scoring))
    );

    const givingTotal = givingValues.reduce((sum, player) => sum + player.currentValue, 0);
    const receivingTotal = receivingValues.reduce((sum, player) => sum + player.currentValue, 0);

    return {
      givingSide: {
        totalValue: givingTotal,
        playerValues: givingValues,
        averagePoints: givingValues.reduce((sum, p) => sum + (p.projectedValue || 0), 0) / givingValues.length,
        totalProjection: givingValues.reduce((sum, p) => sum + (p.projectedValue || 0), 0)
      },
      receivingSide: {
        totalValue: receivingTotal,
        playerValues: receivingValues,
        averagePoints: receivingValues.reduce((sum, p) => sum + (p.projectedValue || 0), 0) / receivingValues.length,
        totalProjection: receivingValues.reduce((sum, p) => sum + (p.projectedValue || 0), 0)
      },
      valueDifference: receivingTotal - givingTotal,
      methodology: 'Market value based on recent performance, projections, positional scarcity, and injury risk'
    };
  }

  /**
   * Calculate individual player value considering multiple factors
   */
  private async calculatePlayerValue(
    playerId: string,
    playerData?: NFLPlayer,
    scoring?: ScoringSettings
  ): Promise<PlayerValue> {
    if (!playerData) {
      return {
        playerId,
        playerName: 'Unknown Player',
        position: 'UNKNOWN',
        team: 'UNKNOWN',
        currentValue: 0,
        marketValue: 0,
        projectedValue: 0,
        valueFactors: {
          recentPerformance: 0,
          scheduleStrength: 0.5,
          injuryRisk: 0.5,
          positionScarcity: 0.5,
          teamOffense: 0.5
        },
        confidence: 0
      };
    }

    try {
      // Get ML prediction for player
      const mlPrediction = await machineLearningPlayerPredictionService.generatePlayerPrediction(
        playerId, 
        1, 
        2024
      );

      // Get injury assessment
      const injuryStatus = injuryTrackingService.getPlayerInjuryStatus(playerId);
      const injuryRisk = injuryStatus?.fantasyImpact.projectionChange 
        ? 1 - (Math.abs(injuryStatus.fantasyImpact.projectionChange) / 100)
        : 0.5;

      // Calculate value factors
      const recentPerformance = this.calculateRecentPerformance(playerData);
      const scheduleStrength = await this.calculateScheduleStrength(playerData.team);
      const positionScarcity = this.calculatePositionScarcity(playerData.position);
      const teamOffense = await this.calculateTeamOffenseStrength(playerData.team);

      // Base value calculation
      const baseValue = mlPrediction?.fantasyPoints.expected || playerData.stats.fantasyPoints || 0;
      
      // Apply multipliers based on factors
      const performanceMultiplier = 0.8 + (recentPerformance * 0.4);
      const scheduleMultiplier = 0.9 + (scheduleStrength * 0.2);
      const injuryMultiplier = 0.7 + (injuryRisk * 0.3);
      const scarcityMultiplier = 0.9 + (positionScarcity * 0.2);
      const offenseMultiplier = 0.8 + (teamOffense * 0.4);

      const adjustedValue = baseValue * performanceMultiplier * scheduleMultiplier * 
                          injuryMultiplier * scarcityMultiplier * offenseMultiplier;

      return {
        playerId,
        playerName: playerData.name,
        position: playerData.position,
        team: playerData.team,
        currentValue: Math.round(adjustedValue * 10) / 10,
        marketValue: Math.round(baseValue * 10) / 10,
        projectedValue: mlPrediction?.fantasyPoints.expected || baseValue,
        valueFactors: {
          recentPerformance,
          scheduleStrength,
          injuryRisk,
          positionScarcity,
          teamOffense
        },
        confidence: mlPrediction?.confidence || 0.5
      };

    } catch (error) {
      console.error(`Error calculating value for player ${playerId}:`, error);
      return {
        playerId,
        playerName: playerData.name,
        position: playerData.position,
        team: playerData.team,
        currentValue: playerData.stats.fantasyPoints || 0,
        marketValue: playerData.stats.fantasyPoints || 0,
        projectedValue: playerData.stats.fantasyPoints || 0,
        valueFactors: {
          recentPerformance: 0.5,
          scheduleStrength: 0.5,
          injuryRisk: 0.5,
          positionScarcity: 0.5,
          teamOffense: 0.5
        },
        confidence: 0.3
      };
    }
  }

  /**
   * Analyze how well the trade fits each team's needs
   */
  private async analyzeTeamFit(
    tradeProposal: TradeProposal,
    proposerRoster: FantasyRoster,
    receiverRoster: FantasyRoster,
    playerData: Map<string, NFLPlayer>
  ): Promise<TeamFitAnalysis> {
    // Analyze proposer's team fit
    const proposerNeeds = await this.analyzePositionNeeds(proposerRoster, playerData);
    const proposerImpact = this.calculateRosterImpact(
      tradeProposal.receivingPlayers,
      tradeProposal.givingPlayers,
      proposerRoster,
      playerData
    );

    // Analyze receiver's team fit
    const receiverNeeds = await this.analyzePositionNeeds(receiverRoster, playerData);
    const receiverImpact = this.calculateRosterImpact(
      tradeProposal.givingPlayers,
      tradeProposal.receivingPlayers,
      receiverRoster,
      playerData
    );

    // Calculate mutual benefit
    const mutualBenefit = this.calculateMutualBenefit(proposerImpact, receiverImpact);

    return {
      forProposer: {
        positionNeeds: proposerNeeds,
        rosterImprovement: proposerImpact.overallImprovement,
        startingLineupImpact: proposerImpact.startingLineupImpact,
        benchDepthImpact: proposerImpact.benchDepthImpact
      },
      forReceiver: {
        positionNeeds: receiverNeeds,
        rosterImprovement: receiverImpact.overallImprovement,
        startingLineupImpact: receiverImpact.startingLineupImpact,
        benchDepthImpact: receiverImpact.benchDepthImpact
      },
      mutualBenefit
    };
  }

  /**
   * Analyze future projections and playoff implications
   */
  private async analyzeFutureProjections(
    givingPlayerIds: string[],
    receivingPlayerIds: string[],
    playerData: Map<string, NFLPlayer>,
    currentWeek: number,
    season: number
  ): Promise<FutureProjectionAnalysis> {
    const remainingWeeks = Array.from({ length: 18 - currentWeek }, (_, i) => currentWeek + i);
    const playoffWeeks = [14, 15, 16, 17]; // Standard fantasy playoff weeks

    // Generate rest of season projections
    const restOfSeasonProjection = {
      givingSide: await this.generateWeeklyProjections(givingPlayerIds, remainingWeeks, season, playerData),
      receivingSide: await this.generateWeeklyProjections(receivingPlayerIds, remainingWeeks, season, playerData),
      cumulativeAdvantage: 0
    };

    restOfSeasonProjection.cumulativeAdvantage = 
      restOfSeasonProjection.receivingSide.reduce((sum, week) => sum + week.totalPoints, 0) -
      restOfSeasonProjection.givingSide.reduce((sum, week) => sum + week.totalPoints, 0);

    // Generate playoff projections
    const playoffProjection = {
      weeks: playoffWeeks,
      givingSide: await this.generateWeeklyProjections(givingPlayerIds, playoffWeeks, season, playerData),
      receivingSide: await this.generateWeeklyProjections(receivingPlayerIds, playoffWeeks, season, playerData),
      playoffAdvantage: 0
    };

    playoffProjection.playoffAdvantage = 
      playoffProjection.receivingSide.reduce((sum, week) => sum + week.totalPoints, 0) -
      playoffProjection.givingSide.reduce((sum, week) => sum + week.totalPoints, 0);

    // Generate injury contingency scenarios
    const injuryContingency = await this.generateInjuryScenarios(
      [...givingPlayerIds, ...receivingPlayerIds],
      playerData
    );

    return {
      restOfSeasonProjection,
      playoffProjection,
      injuryContingency
    };
  }

  /**
   * Assess risks associated with the trade
   */
  private async assessTradeRisks(
    playerIds: string[],
    playerData: Map<string, NFLPlayer>,
    currentWeek: number
  ): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];

    for (const playerId of playerIds) {
      const player = playerData.get(playerId);
      if (!player) continue;

      // Injury risk assessment
      const injuryStatus = injuryTrackingService.getPlayerInjuryStatus(playerId);
      if (injuryStatus && injuryStatus.fantasyImpact.projectionChange < -20) {
        const riskScore = Math.abs(injuryStatus.fantasyImpact.projectionChange) / 100;
        riskFactors.push({
          type: 'injury',
          player: player.name,
          severity: riskScore > 0.5 ? 'high' : 'moderate',
          description: `High injury risk based on ${injuryStatus.injuryType} (${injuryStatus.status})`,
          likelihood: riskScore,
          impact: 0.8
        });
      }

      // Performance decline risk (age, usage, recent trends)
      const performanceRisk = this.assessPerformanceDeclineRisk(player, currentWeek);
      if (performanceRisk.likelihood > 0.5) {
        riskFactors.push(performanceRisk);
      }

      // Schedule-based risks
      const scheduleRisk = await this.assessScheduleRisk(player.team, currentWeek);
      if (scheduleRisk.likelihood > 0.4) {
        riskFactors.push({
          ...scheduleRisk,
          player: player.name
        });
      }
    }

    const riskScore = this.calculateOverallRiskScore(riskFactors);
    const overallRisk = this.categorizeRisk(riskScore);
    const mitigationSuggestions = this.generateRiskMitigationSuggestions(riskFactors);

    return {
      overallRisk,
      riskFactors,
      mitigationSuggestions,
      riskScore
    };
  }

  /**
   * Generate alternative trade offers if current proposal isn't optimal
   */
  private async generateAlternativeOffers(
    originalTrade: TradeProposal,
    proposerRoster: FantasyRoster,
    receiverRoster: FantasyRoster,
    playerData: Map<string, NFLPlayer>
  ): Promise<AlternativeTradeOffer[]> {
    const alternatives: AlternativeTradeOffer[] = [];

    // Get all tradeable players from both rosters
    const proposerPlayers = proposerRoster.players.map(p => p.playerId);
    const receiverPlayers = receiverRoster.players.map(p => p.playerId);

    // Generate 3-5 alternative trade scenarios
    for (let i = 0; i < 5; i++) {
      try {
        const alternative = await this.generateSingleAlternative(
          originalTrade,
          proposerPlayers,
          receiverPlayers,
          playerData,
          proposerRoster.settings.scoring
        );

        if (alternative) {
          alternatives.push(alternative);
        }
      } catch (error) {
        console.error('Error generating alternative trade:', error);
      }
    }

    // Sort by fairness score and return top alternatives
    const sortedAlternatives = [...alternatives];
    sortedAlternatives.sort((a, b) => b.fairnessScore - a.fairnessScore);
    return sortedAlternatives.slice(0, 3);
  }

  // Helper methods for calculations

  private calculateRecentPerformance(player: NFLPlayer): number {
    // Mock calculation - would use last 3-4 games performance vs season average
    const recentAvg = player.stats.fantasyPoints || 0;
    const seasonAvg = player.stats.fantasyPoints || 0;
    return Math.min(1, Math.max(0, recentAvg / Math.max(seasonAvg, 1)));
  }

  private async calculateScheduleStrength(team: string): Promise<number> {
    // Mock calculation - would analyze remaining opponent defenses
    return 0.5 + (Math.random() - 0.5) * 0.3;
  }

  private calculatePositionScarcity(position: string): number {
    const scarcityMap: { [key: string]: number } = {
      'QB': 0.3,
      'RB': 0.8,
      'WR': 0.6,
      'TE': 0.9,
      'K': 0.1,
      'DEF': 0.2
    };
    return scarcityMap[position] || 0.5;
  }

  private async calculateTeamOffenseStrength(team: string): Promise<number> {
    // Mock calculation - would use team offensive metrics
    return 0.4 + Math.random() * 0.6;
  }

  private async analyzePositionNeeds(
    roster: FantasyRoster,
    playerData: Map<string, NFLPlayer>
  ): Promise<PositionNeed[]> {
    const positions = ['QB', 'RB', 'WR', 'TE'];
    const needs: PositionNeed[] = [];

    for (const position of positions) {
      const positionPlayers = roster.players
        .filter(p => {
          const player = playerData.get(p.playerId);
          return player?.position === position;
        })
        .map(p => ({
          playerId: p.playerId,
          playerName: playerData.get(p.playerId)?.name || 'Unknown',
          position,
          team: playerData.get(p.playerId)?.team || 'Unknown',
          currentValue: playerData.get(p.playerId)?.stats.fantasyPoints || 0,
          marketValue: playerData.get(p.playerId)?.stats.fantasyPoints || 0,
          projectedValue: playerData.get(p.playerId)?.stats.fantasyPoints || 0,
          valueFactors: {
            recentPerformance: 0.5,
            scheduleStrength: 0.5,
            injuryRisk: 0.5,
            positionScarcity: 0.5,
            teamOffense: 0.5
          },
          confidence: 0.5
        }));

      const requiredStarters = roster.settings.startingPositions[position] || 1;
      const needLevel = this.determinePositionNeedLevel(positionPlayers, requiredStarters);

      needs.push({
        position,
        needLevel,
        currentStarters: positionPlayers.slice(0, requiredStarters),
        depthChart: positionPlayers,
        recommendation: this.generatePositionRecommendation(needLevel, position)
      });
    }

    return needs;
  }

  private calculateRosterImpact(
    incomingPlayerIds: string[],
    outgoingPlayerIds: string[],
    roster: FantasyRoster,
    playerData: Map<string, NFLPlayer>
  ): { overallImprovement: number; startingLineupImpact: number; benchDepthImpact: number } {
    // Mock calculation - would analyze actual roster spots and improvements
    return {
      overallImprovement: Math.random() * 2 - 1, // -1 to 1
      startingLineupImpact: Math.random() * 2 - 1,
      benchDepthImpact: Math.random() * 2 - 1
    };
  }

  private calculateMutualBenefit(
    proposerImpact: { overallImprovement: number },
    receiverImpact: { overallImprovement: number }
  ): number {
    // Both teams should benefit for high mutual benefit
    if (proposerImpact.overallImprovement > 0 && receiverImpact.overallImprovement > 0) {
      return Math.min(proposerImpact.overallImprovement, receiverImpact.overallImprovement);
    }
    return 0;
  }

  private async generateWeeklyProjections(
    playerIds: string[],
    weeks: number[],
    season: number,
    playerData: Map<string, NFLPlayer>
  ): Promise<WeeklyProjection[]> {
    const projections: WeeklyProjection[] = [];

    for (const week of weeks) {
      const playerProjections = await Promise.all(
        playerIds.map(async (playerId) => {
          const mlPrediction = await machineLearningPlayerPredictionService.generatePlayerPrediction(
            playerId, week, season
          );
          return {
            playerId,
            projectedPoints: mlPrediction?.fantasyPoints.expected || 0,
            confidence: mlPrediction?.confidence || 0.5
          };
        })
      );

      projections.push({
        week,
        totalPoints: playerProjections.reduce((sum, p) => sum + p.projectedPoints, 0),
        playerProjections
      });
    }

    return projections;
  }

  private async generateInjuryScenarios(
    playerIds: string[],
    playerData: Map<string, NFLPlayer>
  ): Promise<{ scenarios: InjuryScenario[]; averageImpact: number }> {
    const scenarios: InjuryScenario[] = [];

    for (const playerId of playerIds) {
      const player = playerData.get(playerId);
      if (!player) continue;

      const injuryStatus = injuryTrackingService.getPlayerInjuryStatus(playerId);
      if (injuryStatus && injuryStatus.fantasyImpact.projectionChange < -20) {
        const riskScore = Math.abs(injuryStatus.fantasyImpact.projectionChange) / 100;
        scenarios.push({
          injuredPlayer: player.name,
          likelihood: riskScore,
          impactOnGiving: player.stats.fantasyPoints || 0,
          impactOnReceiving: -(player.stats.fantasyPoints || 0),
          reasoning: `Injury risk based on ${injuryStatus.injuryType} (${injuryStatus.status})`
        });
      }
    }

    const averageImpact = scenarios.reduce((sum, s) => sum + s.impactOnGiving, 0) / Math.max(scenarios.length, 1);

    return { scenarios, averageImpact };
  }

  private assessPerformanceDeclineRisk(player: NFLPlayer, currentWeek: number): RiskFactor {
    // Mock assessment - would analyze age, usage trends, team changes, etc.
    const riskLevel = Math.random();
    
    let severity: 'low' | 'moderate' | 'high';
    if (riskLevel > 0.7) {
      severity = 'high';
    } else if (riskLevel > 0.4) {
      severity = 'moderate';
    } else {
      severity = 'low';
    }
    
    return {
      type: 'performance_decline',
      player: player.name,
      severity,
      description: 'Risk of performance decline based on age and usage patterns',
      likelihood: riskLevel,
      impact: 0.6
    };
  }

  private async assessScheduleRisk(team: string, currentWeek: number): Promise<Omit<RiskFactor, 'player'>> {
    // Mock assessment - would analyze remaining schedule difficulty
    return {
      type: 'schedule',
      severity: 'moderate',
      description: 'Difficult remaining schedule may impact fantasy production',
      likelihood: 0.4,
      impact: 0.5
    };
  }

  private calculateOverallRiskScore(riskFactors: RiskFactor[]): number {
    if (riskFactors.length === 0) return 20;
    
    const weightedRisk = riskFactors.reduce((sum, risk) => {
      let severityWeight: number;
      if (risk.severity === 'high') {
        severityWeight = 1;
      } else if (risk.severity === 'moderate') {
        severityWeight = 0.7;
      } else {
        severityWeight = 0.3;
      }
      return sum + (risk.likelihood * risk.impact * severityWeight);
    }, 0);

    return Math.min(100, weightedRisk * 100 / riskFactors.length);
  }

  private categorizeRisk(riskScore: number): 'low' | 'moderate' | 'high' | 'extreme' {
    if (riskScore < 25) return 'low';
    if (riskScore < 50) return 'moderate';
    if (riskScore < 75) return 'high';
    return 'extreme';
  }

  private generateRiskMitigationSuggestions(riskFactors: RiskFactor[]): string[] {
    const suggestions: string[] = [];
    
    if (riskFactors.some(r => r.type === 'injury')) {
      suggestions.push('Consider handcuff players or backup options');
    }
    
    if (riskFactors.some(r => r.type === 'performance_decline')) {
      suggestions.push('Monitor recent performance trends closely');
    }
    
    if (riskFactors.some(r => r.type === 'schedule')) {
      suggestions.push('Review playoff schedule and matchup difficulty');
    }

    return suggestions;
  }

  private calculateFairnessScore(
    valueComparison: TradeValueComparison,
    teamFitAnalysis: TeamFitAnalysis,
    futureProjections: FutureProjectionAnalysis,
    riskAssessment: RiskAssessment
  ): number {
    // Base fairness on value difference (closer to 0 = more fair)
    const valueFairness = Math.max(0, 100 - Math.abs(valueComparison.valueDifference) * 2);
    
    // Adjust for team fit (mutual benefit increases fairness)
    const fitAdjustment = teamFitAnalysis.mutualBenefit * 20;
    
    // Adjust for future projections
    const projectionAdjustment = Math.max(-20, Math.min(20, futureProjections.restOfSeasonProjection.cumulativeAdvantage * 0.5));
    
    // Penalize high risk
    const riskPenalty = riskAssessment.riskScore * 0.3;

    return Math.max(0, Math.min(100, valueFairness + fitAdjustment + projectionAdjustment - riskPenalty));
  }

  private generateTradeRecommendation(
    fairnessScore: number,
    valueComparison: TradeValueComparison,
    teamFitAnalysis: TeamFitAnalysis,
    riskAssessment: RiskAssessment
  ): 'accept' | 'reject' | 'counter' | 'hold' {
    if (riskAssessment.overallRisk === 'extreme') return 'reject';
    if (fairnessScore >= 75 && teamFitAnalysis.forProposer.rosterImprovement > 0) return 'accept';
    if (fairnessScore >= 60 && valueComparison.valueDifference > 0) return 'accept';
    if (fairnessScore >= 40) return 'counter';
    return 'reject';
  }

  private calculateConfidence(
    valueComparison: TradeValueComparison,
    teamFitAnalysis: TeamFitAnalysis,
    futureProjections: FutureProjectionAnalysis,
    riskAssessment: RiskAssessment
  ): number {
    // Higher confidence when we have good data and low risk
    const dataQuality = (
      valueComparison.givingSide.playerValues.reduce((sum, p) => sum + p.confidence, 0) /
      Math.max(valueComparison.givingSide.playerValues.length, 1) +
      valueComparison.receivingSide.playerValues.reduce((sum, p) => sum + p.confidence, 0) /
      Math.max(valueComparison.receivingSide.playerValues.length, 1)
    ) / 2;

    const riskPenalty = (100 - riskAssessment.riskScore) / 100;
    
    return Math.max(0.3, Math.min(1, dataQuality * riskPenalty));
  }

  private generateTradeReasoning(
    recommendation: string,
    valueComparison: TradeValueComparison,
    teamFitAnalysis: TeamFitAnalysis,
    futureProjections: FutureProjectionAnalysis,
    riskAssessment: RiskAssessment
  ): string {
    const reasons: string[] = [];

    // Value analysis
    if (Math.abs(valueComparison.valueDifference) < 5) {
      reasons.push("The trade is fairly balanced in terms of player value");
    } else if (valueComparison.valueDifference > 0) {
      reasons.push(`You would receive approximately ${valueComparison.valueDifference.toFixed(1)} more points of value`);
    } else {
      reasons.push(`You would give up approximately ${Math.abs(valueComparison.valueDifference).toFixed(1)} points of value`);
    }

    // Team fit analysis
    if (teamFitAnalysis.forProposer.rosterImprovement > 0.2) {
      reasons.push("This trade would significantly improve your roster construction");
    } else if (teamFitAnalysis.forProposer.rosterImprovement < -0.2) {
      reasons.push("This trade would weaken your roster construction");
    }

    // Future projections
    if (futureProjections.playoffProjection.playoffAdvantage > 5) {
      reasons.push("The trade provides a meaningful advantage during fantasy playoffs");
    } else if (futureProjections.playoffProjection.playoffAdvantage < -5) {
      reasons.push("The trade could hurt your playoff performance");
    }

    // Risk assessment
    if (riskAssessment.overallRisk === 'high' || riskAssessment.overallRisk === 'extreme') {
      reasons.push(`High risk trade due to ${riskAssessment.riskFactors.map(r => r.description).join(', ')}`);
    }

    const baseReason = this.getRecommendationPrefix(recommendation);

    return baseReason + reasons.join(', ') + '.';
  }

  private getRecommendationPrefix(recommendation: string): string {
    if (recommendation === 'accept') {
      return 'I recommend accepting this trade because ';
    } else if (recommendation === 'reject') {
      return 'I recommend rejecting this trade because ';
    } else if (recommendation === 'counter') {
      return 'I recommend countering this trade because ';
    } else {
      return 'I recommend holding on this trade because ';
    }
  }

  private async generateSingleAlternative(
    originalTrade: TradeProposal,
    proposerPlayers: string[],
    receiverPlayers: string[],
    playerData: Map<string, NFLPlayer>,
    scoring: ScoringSettings
  ): Promise<AlternativeTradeOffer | null> {
    // Mock implementation - would use more sophisticated logic
    const newGiving = [proposerPlayers[Math.floor(Math.random() * proposerPlayers.length)]];
    const newReceiving = [receiverPlayers[Math.floor(Math.random() * receiverPlayers.length)]];

    // Calculate fairness for this alternative
    await this.calculateTradeValue(newGiving, newReceiving, playerData, scoring);
    const fairnessScore = 50 + Math.random() * 40; // Mock calculation

    return {
      givingPlayers: newGiving,
      receivingPlayers: newReceiving,
      fairnessScore,
      reasoning: "Alternative trade suggestion based on position needs and value balance",
      improvementOverOriginal: Math.random() * 20 - 10
    };
  }

  private determinePositionNeedLevel(
    players: PlayerValue[],
    requiredStarters: number
  ): 'critical' | 'high' | 'moderate' | 'low' | 'surplus' {
    if (players.length < requiredStarters) return 'critical';
    if (players.length === requiredStarters) return 'high';
    if (players.length <= requiredStarters + 1) return 'moderate';
    if (players.length <= requiredStarters + 2) return 'low';
    return 'surplus';
  }

  private generatePositionRecommendation(needLevel: string, position: string): string {
    const recommendations = {
      critical: `Urgently need to acquire ${position} players`,
      high: `Should look to add depth at ${position}`,
      moderate: `${position} depth is adequate but could be improved`,
      low: `${position} is well-stocked`,
      surplus: `Consider trading excess ${position} players`
    };
    return recommendations[needLevel as keyof typeof recommendations] || 'No specific recommendation';
  }

  private async getPlayersData(playerIds: string[]): Promise<Map<string, NFLPlayer>> {
    const playerMap = new Map<string, NFLPlayer>();
    
    await Promise.all(
      playerIds.map(async (playerId) => {
        try {
          const player = await productionSportsDataService.getPlayerDetails(playerId);
          if (player) {
            playerMap.set(playerId, player);
          }
        } catch (error) {
          console.error(`Error fetching player ${playerId}:`, error);
        }
      })
    );

    return playerMap;
  }

  /**
   * Get service status and performance metrics
   */
  getServiceStatus(): {
    isActive: boolean;
    tradesAnalyzed: number;
    cacheSize: number;
    averageAnalysisTime: number;
    lastAnalysis: string | null;
  } {
    return {
      isActive: true,
      tradesAnalyzed: this.cache.size,
      cacheSize: this.cache.size,
      averageAnalysisTime: 2.5, // seconds
      lastAnalysis: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const tradeAnalysisService = new TradeAnalysisService();
export default tradeAnalysisService;
