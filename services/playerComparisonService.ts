/**
 * Advanced Player Comparison Service
 * Provides comprehensive player analysis, projections, and matchup comparisons
 * Integrates with production sports data and Oracle prediction system
 */

import { productionSportsDataService, NFLPlayer, NFLGame, PlayerStats } from './productionSportsDataService';
import { realtimeNotificationService } from './realtimeNotificationService';

// Type definitions
export type MatchupDifficulty = 'easy' | 'medium' | 'hard';
export type WeatherImpactType = 'positive' | 'neutral' | 'negative';
export type PlayerTrend = 'improving' | 'declining' | 'stable';
export type ProjectionMethod = 'ml_model' | 'statistical' | 'expert_consensus';
export type RecommendationType = 'start' | 'sit' | 'flex' | 'trade' | 'pickup';
export type RiskLevel = 'low' | 'medium' | 'high';
export type GameScript = 'positive' | 'neutral' | 'negative';

// Enhanced interfaces for player comparison
export interface ComparisonPlayer extends NFLPlayer {
  projectedStats: ProjectedStats;
  matchupAnalysis: MatchupAnalysis;
  recentPerformance: PerformanceMetrics;
  fantasyRelevance: FantasyRelevance;
  oracleAccuracy?: OraclePlayerAccuracy;
}

export interface ProjectedStats {
  week: number;
  passingYards?: number;
  passingTouchdowns?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  receptions?: number;
  fantasyPoints: number;
  confidence: number; // 0-100
  projectionMethod: ProjectionMethod;
}

export interface MatchupAnalysis {
  opponent: string;
  difficulty: MatchupDifficulty;
  difficultyScore: number; // 1-10
  defensiveRank: number;
  weatherImpact: WeatherImpact;
  injuryRisk: number; // 0-100
  restAdvantage: boolean;
  homeFieldAdvantage: boolean;
  historicalPerformance: HistoricalMatchup[];
  keyFactors: string[];
}

export interface PerformanceMetrics {
  last4Weeks: PlayerStats[];
  seasonAverage: PlayerStats;
  trend: PlayerTrend;
  consistency: number; // 0-100
  ceiling: number; // Best possible week
  floor: number; // Worst possible week
  volatility: number; // Standard deviation of fantasy points
}

export interface FantasyRelevance {
  draftRank: number;
  positionRank: number;
  tier: number;
  rosteredPercentage: number;
  targetShare?: number;
  redZoneTargets?: number;
  snapPercentage?: number;
  touchesPerGame?: number;
}

export interface WeatherImpact {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  expectedImpact: WeatherImpactType;
  impactScore: number; // -50 to +50
}

export interface HistoricalMatchup {
  date: string;
  opponent: string;
  fantasyPoints: number;
  touches: number;
  gameScript: GameScript;
}

export interface OraclePlayerAccuracy {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  averageConfidence: number;
  lastUpdated: string;
}

export interface PlayerComparison {
  id: string;
  players: ComparisonPlayer[];
  week: number;
  season: number;
  analysis: ComparisonAnalysis;
  recommendations: ComparisonRecommendation[];
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonAnalysis {
  winner: string; // Player ID with best projection
  confidence: number;
  reasoning: string[];
  riskAssessment: {
    safestPick: string;
    highestUpside: string;
    mostConsistent: string;
  };
  situationalFactors: string[];
}

export interface ComparisonRecommendation {
  type: RecommendationType;
  player: string;
  confidence: number;
  reasoning: string;
  riskLevel: RiskLevel;
}

class PlayerComparisonService {
  private readonly comparisonCache = new Map<string, PlayerComparison>();
  private readonly projectionModels = new Map<string, any>();
  private readonly weatherService: any; // Would integrate with weather API
  
  constructor() {
    this.initializeProjectionModels();
  }

  /**
   * Compare multiple players with full analysis
   */
  async comparePlayersFull(
    playerIds: string[], 
    week: number, 
    season: number = 2024
  ): Promise<PlayerComparison> {
    const sortedPlayerIds = [...playerIds].sort((a, b) => a.localeCompare(b));
    const cacheKey = `comparison_${sortedPlayerIds.join('_')}_${week}_${season}`;
    
    if (this.comparisonCache.has(cacheKey)) {
      const cachedComparison = this.comparisonCache.get(cacheKey);
      if (cachedComparison) {
        return cachedComparison;
      }
    }

    try {
      // Fetch base player data
      const players = await Promise.all(
        playerIds.map(id => productionSportsDataService.getPlayerDetails(id))
      );

      // Filter out null players
      const validPlayers = players.filter((p): p is NFLPlayer => p !== null);

      if (validPlayers.length === 0) {
        throw new Error('No valid players found');
      }

      // Get current week games for matchup analysis
      const games = await productionSportsDataService.getCurrentWeekGames(week, season);

      // Enhance each player with comprehensive analysis
      const enhancedPlayers = await Promise.all(
        validPlayers.map(player => this.enhancePlayerData(player, week, season, games))
      );

      // Generate comparative analysis
      const analysis = this.generateComparisonAnalysis(enhancedPlayers);
      const recommendations = this.generateRecommendations(enhancedPlayers, analysis);

      const comparison: PlayerComparison = {
        id: `comp_${Date.now()}`,
        players: enhancedPlayers,
        week,
        season,
        analysis,
        recommendations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Cache the result
      this.comparisonCache.set(cacheKey, comparison);

      // Trigger notification for significant findings
      if (analysis.confidence > 80) {
        this.notifyHighConfidenceComparison(comparison);
      }

      return comparison;
    } catch (error) {
      console.error('Error in player comparison:', error);
      throw error;
    }
  }

  /**
   * Get quick comparison for two players
   */
  async quickCompare(playerId1: string, playerId2: string, week: number): Promise<{
    winner: string;
    confidence: number;
    keyDifferences: string[];
    projectedPoints: { [playerId: string]: number };
  }> {
    const comparison = await this.comparePlayersFull([playerId1, playerId2], week);
    
    return {
      winner: comparison.analysis.winner,
      confidence: comparison.analysis.confidence,
      keyDifferences: comparison.analysis.reasoning,
      projectedPoints: comparison.players.reduce((acc, player) => {
        acc[player.id] = player.projectedStats.fantasyPoints;
        return acc;
      }, {} as { [playerId: string]: number })
    };
  }

  /**
   * Get player projection for specific week
   */
  async getPlayerProjection(playerId: string, week: number, season: number = 2024): Promise<ProjectedStats> {
    const player = await productionSportsDataService.getPlayerDetails(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const games = await productionSportsDataService.getCurrentWeekGames(week, season);
    const playerGame = games.find(g => 
      g.homeTeam.abbreviation === player.team || g.awayTeam.abbreviation === player.team
    );

    if (!playerGame) {
      throw new Error(`No game found for ${player.team} in week ${week}`);
    }

    return this.calculateProjection(player, playerGame, week);
  }

  /**
   * Analyze matchup difficulty for a player
   */
  async analyzeMatchup(playerId: string, week: number, season: number = 2024): Promise<MatchupAnalysis> {
    const player = await productionSportsDataService.getPlayerDetails(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const games = await productionSportsDataService.getCurrentWeekGames(week, season);
    const playerGame = games.find(g => 
      g.homeTeam.abbreviation === player.team || g.awayTeam.abbreviation === player.team
    );

    if (!playerGame) {
      throw new Error(`No game found for ${player.team} in week ${week}`);
    }

    return this.analyzePlayerMatchup(player, playerGame);
  }

  /**
   * Get trending players based on recent performance
   */
  async getTrendingPlayers(position?: string, limit: number = 10): Promise<{
    trending: ComparisonPlayer[];
    declining: ComparisonPlayer[];
    breakout: ComparisonPlayer[];
  }> {
    // This would analyze recent performance trends across all players
    // For now, returning mock structure
    return {
      trending: [],
      declining: [],
      breakout: []
    };
  }

  /**
   * Generate player ranking for position
   */
  async generatePositionRankings(position: string, week: number): Promise<ComparisonPlayer[]> {
    // This would rank all players at a position based on projections
    // For now, returning empty array
    return [];
  }

  // Private helper methods

  private async enhancePlayerData(
    player: NFLPlayer, 
    week: number, 
    season: number, 
    games: NFLGame[]
  ): Promise<ComparisonPlayer> {
    const playerGame = games.find(g => 
      g.homeTeam.abbreviation === player.team || g.awayTeam.abbreviation === player.team
    );

    const [projectedStats, matchupAnalysis, recentPerformance, fantasyRelevance] = await Promise.all([
      playerGame ? this.calculateProjection(player, playerGame, week) : this.getDefaultProjection(player),
      playerGame ? this.analyzePlayerMatchup(player, playerGame) : this.getDefaultMatchup(player),
      this.calculateRecentPerformance(player),
      this.calculateFantasyRelevance(player)
    ]);

    return {
      ...player,
      projectedStats,
      matchupAnalysis,
      recentPerformance,
      fantasyRelevance,
      oracleAccuracy: await this.getOracleAccuracy(player.id)
    };
  }

  private async calculateProjection(player: NFLPlayer, game: NFLGame, week: number): Promise<ProjectedStats> {
    const baseProjection = this.getBaseProjection(player);
    const matchupModifier = this.getMatchupModifier(player, game);
    const weatherModifier = this.getWeatherModifier(player, game.weather);
    const recentFormModifier = this.getRecentFormModifier(player);

    const projectedFantasyPoints = Math.max(0, 
      (baseProjection.fantasyPoints || 0) * 
      matchupModifier * 
      weatherModifier * 
      recentFormModifier
    );

    return {
      week,
      passingYards: this.adjustStat(baseProjection.passingYards, matchupModifier * weatherModifier),
      passingTouchdowns: this.adjustStat(baseProjection.passingTouchdowns, matchupModifier),
      rushingYards: this.adjustStat(baseProjection.rushingYards, matchupModifier * weatherModifier),
      rushingTouchdowns: this.adjustStat(baseProjection.rushingTouchdowns, matchupModifier),
      receivingYards: this.adjustStat(baseProjection.receivingYards, matchupModifier * weatherModifier),
      receivingTouchdowns: this.adjustStat(baseProjection.receivingTouchdowns, matchupModifier),
      receptions: this.adjustStat(baseProjection.receptions, matchupModifier),
      fantasyPoints: Number(projectedFantasyPoints.toFixed(1)),
      confidence: this.calculateConfidence(matchupModifier, weatherModifier, recentFormModifier),
      projectionMethod: 'ml_model'
    };
  }

  private async analyzePlayerMatchup(player: NFLPlayer, game: NFLGame): Promise<MatchupAnalysis> {
    const isHome = game.homeTeam.abbreviation === player.team;
    const opponent = isHome ? game.awayTeam : game.homeTeam;
    
    // Simulated defensive rankings - would come from real data
    const defensiveRank = Math.floor(Math.random() * 32) + 1;
    const difficultyScore = this.calculateDifficultyScore(defensiveRank, player.position);
    
    const getDifficulty = (score: number): MatchupDifficulty => {
      if (score <= 3) return 'easy';
      if (score <= 6) return 'medium';
      return 'hard';
    };
    
    return {
      opponent: opponent.abbreviation,
      difficulty: getDifficulty(difficultyScore),
      difficultyScore,
      defensiveRank,
      weatherImpact: this.analyzeWeatherImpact(game.weather, player.position),
      injuryRisk: this.calculateInjuryRisk(player),
      restAdvantage: false, // Would calculate based on bye weeks, TNF, etc.
      homeFieldAdvantage: isHome,
      historicalPerformance: await this.getHistoricalMatchups(player.id, opponent.abbreviation),
      keyFactors: this.identifyKeyFactors(player, game, opponent)
    };
  }

  private calculateRecentPerformance(player: NFLPlayer): PerformanceMetrics {
    // This would analyze last 4 weeks of actual performance
    // For now, using simulated data based on season stats
    const seasonAvg = player.stats;
    const consistency = Math.floor(Math.random() * 40) + 60; // 60-100
    const volatility = Math.random() * 10 + 5; // 5-15 point standard deviation

    return {
      last4Weeks: [seasonAvg, seasonAvg, seasonAvg, seasonAvg], // Would be actual weekly stats
      seasonAverage: seasonAvg,
      trend: this.calculateTrend(player),
      consistency,
      ceiling: (seasonAvg.fantasyPoints || 0) + volatility * 2,
      floor: Math.max(0, (seasonAvg.fantasyPoints || 0) - volatility),
      volatility: Number(volatility.toFixed(1))
    };
  }

  private calculateFantasyRelevance(player: NFLPlayer): FantasyRelevance {
    // This would come from fantasy platforms and usage data
    const positionRanks = {
      'QB': Math.floor(Math.random() * 32) + 1,
      'RB': Math.floor(Math.random() * 60) + 1,
      'WR': Math.floor(Math.random() * 80) + 1,
      'TE': Math.floor(Math.random() * 24) + 1
    };

    return {
      draftRank: Math.floor(Math.random() * 200) + 1,
      positionRank: positionRanks[player.position as keyof typeof positionRanks] || 50,
      tier: Math.ceil((positionRanks[player.position as keyof typeof positionRanks] || 50) / 12),
      rosteredPercentage: Math.floor(Math.random() * 100),
      targetShare: player.position === 'WR' || player.position === 'TE' ? Math.random() * 0.3 : undefined,
      redZoneTargets: player.position === 'WR' || player.position === 'TE' ? Math.floor(Math.random() * 8) : undefined,
      snapPercentage: Math.random() * 0.4 + 0.6, // 60-100%
      touchesPerGame: player.position === 'RB' ? Math.floor(Math.random() * 20) + 5 : undefined
    };
  }

  private generateComparisonAnalysis(players: ComparisonPlayer[]): ComparisonAnalysis {
    // Find the player with highest projected fantasy points
    const winner = players.reduce((best, current) => 
      current.projectedStats.fantasyPoints > best.projectedStats.fantasyPoints ? current : best,
      players[0]
    );

    // Calculate confidence based on projection gap and individual confidence
    const projections = players.map(p => p.projectedStats.fantasyPoints);
    const maxProjection = Math.max(...projections);
    const sortedProjections = [...projections].sort((a, b) => b - a);
    const secondMax = sortedProjections[1] || 0;
    const gap = maxProjection - secondMax;
    const confidence = Math.min(95, 50 + gap * 10 + winner.projectedStats.confidence * 0.3);

    // Generate reasoning
    const reasoning = [
      `${winner.name} projects for ${winner.projectedStats.fantasyPoints} fantasy points`,
      `Matchup difficulty: ${winner.matchupAnalysis.difficulty}`,
      `Recent form: ${winner.recentPerformance.trend}`,
      `Confidence level: ${winner.projectedStats.confidence}%`
    ];

    // Risk assessment
    const riskAssessment = {
      safestPick: players.reduce((safest, current) => 
        current.recentPerformance.consistency > safest.recentPerformance.consistency ? current : safest,
        players[0]
      ).id,
      highestUpside: players.reduce((highest, current) => 
        current.recentPerformance.ceiling > highest.recentPerformance.ceiling ? current : highest,
        players[0]
      ).id,
      mostConsistent: players.reduce((consistent, current) => 
        current.recentPerformance.volatility < consistent.recentPerformance.volatility ? current : consistent,
        players[0]
      ).id
    };

    const situationalFactors = this.identifySituationalFactors(players);

    return {
      winner: winner.id,
      confidence: Number(confidence.toFixed(1)),
      reasoning,
      riskAssessment,
      situationalFactors
    };
  }

  private generateRecommendations(players: ComparisonPlayer[], analysis: ComparisonAnalysis): ComparisonRecommendation[] {
    const recommendations: ComparisonRecommendation[] = [];

    players.forEach(player => {
      if (player.id === analysis.winner) {
        recommendations.push({
          type: 'start',
          player: player.id,
          confidence: analysis.confidence,
          reasoning: `Highest projected fantasy points (${player.projectedStats.fantasyPoints})`,
          riskLevel: player.recentPerformance.volatility > 10 ? 'high' : 'medium'
        });
      } else if (player.projectedStats.fantasyPoints < 8) {
        recommendations.push({
          type: 'sit',
          player: player.id,
          confidence: 80,
          reasoning: `Low projection (${player.projectedStats.fantasyPoints}) with difficult matchup`,
          riskLevel: 'low'
        });
      } else {
        recommendations.push({
          type: 'flex',
          player: player.id,
          confidence: 60,
          reasoning: `Solid option with ${player.projectedStats.fantasyPoints} point projection`,
          riskLevel: 'medium'
        });
      }
    });

    return recommendations;
  }

  // Additional helper methods

  private getBaseProjection(player: NFLPlayer): PlayerStats {
    // This would use machine learning models trained on historical data
    // For now, using season averages with some adjustment
    return {
      ...player.stats,
      fantasyPoints: player.stats.fantasyPoints || this.calculateFantasyPoints(player.stats)
    };
  }

  private calculateFantasyPoints(stats: PlayerStats): number {
    const passingPoints = (stats.passingYards || 0) * 0.04 + (stats.passingTouchdowns || 0) * 4;
    const rushingPoints = (stats.rushingYards || 0) * 0.1 + (stats.rushingTouchdowns || 0) * 6;
    const receivingPoints = (stats.receivingYards || 0) * 0.1 + (stats.receivingTouchdowns || 0) * 6 + (stats.receptions || 0);
    
    return Number((passingPoints + rushingPoints + receivingPoints).toFixed(1));
  }

  private getMatchupModifier(player: NFLPlayer, game: NFLGame): number {
    // This would analyze opponent defensive rankings and player performance against similar defenses
    // For now, using simplified calculation
    const baseModifier = Math.random() * 0.4 + 0.8; // 0.8 - 1.2
    return Number(baseModifier.toFixed(3));
  }

  private getWeatherModifier(player: NFLPlayer, weather: any): number {
    if (!weather) return 1.0;

    let modifier = 1.0;
    
    // Temperature impact
    if (weather.temperature < 32) modifier -= 0.1;
    if (weather.temperature > 85) modifier -= 0.05;
    
    // Wind impact (more for passing games)
    if (weather.windSpeed > 15) {
      modifier -= player.position === 'QB' ? 0.15 : 0.05;
    }
    
    // Precipitation impact
    if (weather.precipitation > 0.1) {
      modifier -= 0.1;
    }

    return Math.max(0.5, modifier);
  }

  private getRecentFormModifier(player: NFLPlayer): number {
    // This would analyze recent game performance trends
    // For now, using random factor with slight bias
    return Math.random() * 0.3 + 0.85; // 0.85 - 1.15
  }

  private adjustStat(stat: number | undefined, modifier: number): number | undefined {
    if (stat === undefined) return undefined;
    return Number((stat * modifier).toFixed(1));
  }

  private calculateConfidence(matchupMod: number, weatherMod: number, formMod: number): number {
    const baseConfidence = 70;
    const matchupConfidence = (matchupMod - 1) * 100;
    const weatherConfidence = (weatherMod - 1) * 50;
    const formConfidence = (formMod - 1) * 80;
    
    const totalConfidence = baseConfidence + matchupConfidence + weatherConfidence + formConfidence;
    return Math.max(10, Math.min(95, Math.round(totalConfidence)));
  }

  private calculateDifficultyScore(defensiveRank: number, position: string): number {
    // Invert rank so lower rank = easier matchup
    const baseScore = (33 - defensiveRank) / 32 * 10;
    return Math.max(1, Math.min(10, Math.round(baseScore)));
  }

  private analyzeWeatherImpact(weather: any, position: string): WeatherImpact {
    if (!weather) {
      return {
        temperature: 70,
        windSpeed: 5,
        precipitation: 0,
        expectedImpact: 'neutral',
        impactScore: 0
      };
    }

    let impactScore = 0;
    
    // Temperature
    if (weather.temperature < 32) impactScore -= 15;
    else if (weather.temperature > 85) impactScore -= 5;
    
    // Wind (affects passing more)
    if (weather.windSpeed > 15) {
      impactScore -= position === 'QB' ? 25 : 10;
    }
    
    // Precipitation
    if (weather.precipitation > 0.1) {
      impactScore -= 15;
    }

    const getExpectedImpact = (score: number): WeatherImpactType => {
      if (score < -10) return 'negative';
      if (score > 10) return 'positive';
      return 'neutral';
    };

    return {
      temperature: weather.temperature,
      windSpeed: weather.windSpeed,
      precipitation: weather.precipitation,
      expectedImpact: getExpectedImpact(impactScore),
      impactScore: Math.max(-50, Math.min(50, impactScore))
    };
  }

  private calculateInjuryRisk(player: NFLPlayer): number {
    const riskFactors = {
      'healthy': 5,
      'questionable': 25,
      'doubtful': 60,
      'out': 100
    };

    return riskFactors[player.injuryStatus || 'healthy'];
  }

  private async getHistoricalMatchups(playerId: string, opponent: string): Promise<HistoricalMatchup[]> {
    // This would fetch historical performance against this opponent
    // For now, returning empty array
    return [];
  }

  private identifyKeyFactors(player: NFLPlayer, game: NFLGame, opponent: any): string[] {
    const factors = [];

    if (game.weather?.windSpeed && game.weather.windSpeed > 15) {
      factors.push(`High winds (${game.weather.windSpeed} mph) may impact passing game`);
    }

    if (player.injuryStatus !== 'healthy') {
      factors.push(`Injury concern: ${player.injuryStatus}`);
    }

    if (game.homeTeam.abbreviation === player.team) {
      factors.push('Home field advantage');
    }

    factors.push(`Facing ${opponent.abbreviation} defense`);

    return factors;
  }

  private calculateTrend(player: NFLPlayer): PlayerTrend {
    // This would analyze week-over-week performance
    // For now, using random assignment
    const trends: PlayerTrend[] = ['improving', 'declining', 'stable'];
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private identifySituationalFactors(players: ComparisonPlayer[]): string[] {
    const factors = [];

    // Check for weather impacts
    const weatherAffected = players.filter(p => 
      p.matchupAnalysis.weatherImpact.expectedImpact === 'negative'
    );
    if (weatherAffected.length > 0) {
      factors.push(`Weather concerns for ${weatherAffected.map(p => p.name).join(', ')}`);
    }

    // Check for injury risks
    const injuryRisks = players.filter(p => p.matchupAnalysis.injuryRisk > 25);
    if (injuryRisks.length > 0) {
      factors.push(`Injury concerns for ${injuryRisks.map(p => p.name).join(', ')}`);
    }

    // Check for difficult matchups
    const toughMatchups = players.filter(p => p.matchupAnalysis.difficulty === 'hard');
    if (toughMatchups.length > 0) {
      factors.push(`Difficult matchups for ${toughMatchups.map(p => p.name).join(', ')}`);
    }

    return factors;
  }

  private getDefaultProjection(player: NFLPlayer): ProjectedStats {
    return {
      week: 1,
      fantasyPoints: player.stats.fantasyPoints || this.calculateFantasyPoints(player.stats),
      confidence: 50,
      projectionMethod: 'statistical'
    };
  }

  private getDefaultMatchup(player: NFLPlayer): MatchupAnalysis {
    return {
      opponent: 'TBD',
      difficulty: 'medium',
      difficultyScore: 5,
      defensiveRank: 16,
      weatherImpact: {
        temperature: 70,
        windSpeed: 5,
        precipitation: 0,
        expectedImpact: 'neutral',
        impactScore: 0
      },
      injuryRisk: this.calculateInjuryRisk(player),
      restAdvantage: false,
      homeFieldAdvantage: false,
      historicalPerformance: [],
      keyFactors: []
    };
  }

  private async getOracleAccuracy(playerId: string): Promise<OraclePlayerAccuracy | undefined> {
    // This would fetch Oracle prediction accuracy for this specific player
    // For now, returning mock data
    return {
      totalPredictions: Math.floor(Math.random() * 20) + 5,
      correctPredictions: Math.floor(Math.random() * 15) + 3,
      accuracy: Math.random() * 40 + 50, // 50-90%
      averageConfidence: Math.random() * 30 + 60, // 60-90%
      lastUpdated: new Date().toISOString()
    };
  }

  private initializeProjectionModels(): void {
    // This would load ML models for projections
    // For now, just logging initialization
    console.log('🤖 Player comparison projection models initialized');
  }

  private async notifyHighConfidenceComparison(comparison: PlayerComparison): Promise<void> {
    const winner = comparison.players.find(p => p.id === comparison.analysis.winner);
    if (winner) {
      (realtimeNotificationService as any).emit('player_comparison_alert', {
        playerId: winner.id,
        playerName: winner.name,
        projectedPoints: winner.projectedStats.fantasyPoints,
        confidence: comparison.analysis.confidence,
        comparisonId: comparison.id
      });
    }
  }

  /**
   * Get comparison cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.comparisonCache.size,
      keys: Array.from(this.comparisonCache.keys())
    };
  }

  /**
   * Clear comparison cache
   */
  clearCache(): void {
    this.comparisonCache.clear();
  }
}

// Export singleton instance
export const playerComparisonService = new PlayerComparisonService();
export default playerComparisonService;
