/**
 * Player Stats and Projections Service
 * Handles player statistics, projections, and analysis
 */

import { nflPlayers } from '@/data/nfl-players';
import type { NFLPlayer } from '@/data/nfl-players';

export interface PlayerProjection {
  week: number;
  season: number;
  projectedPoints: number;
  confidence: number;
  breakdown: {
    passYards?: number;
    passTds?: number;
    rushYards?: number;
    rushTds?: number;
    receptions?: number;
    recYards?: number;
    recTds?: number;
  };
}

export interface PlayerAnalysis {
  strengthOfSchedule: number; // 1-32, lower is easier
  restOfSeasonRank: number;
  playoffScheduleRating: number;
  targetShare?: number;
  redZoneShare?: number;
  snapPercentage?: number;
  consistency: number; // 0-100
  volatility: number; // 0-100
  trending: 'up' | 'down' | 'stable';
}

export interface PlayerComparison {
  player1: NFLPlayer;
  player2: NFLPlayer;
  winner: string; // player ID
  confidence: number; // 0-100
  factors: {
    recentForm: { winner: string; margin: number };
    consistency: { winner: string; margin: number };
    matchup: { winner: string; margin: number };
    health: { winner: string; margin: number };
    projections: { winner: string; margin: number };
  };
}

class PlayerStatsService {
  /**
   * Get player projections for upcoming weeks
   */
  getProjections(playerId: string, weeks: number = 5): PlayerProjection[] {
    const player = nflPlayers.find(p => p.id === playerId);
    if (!player) return [];

    const projections: PlayerProjection[] = [];
    const currentWeek = this.getCurrentWeek();
    const baseProjection = player.projectedPoints / 17; // Average per week

    for (let i = 0; i < weeks; i++) {
      const week = currentWeek + i;
      const variance = (Math.random() - 0.5) * 0.3; // ±15% variance
      const weekProjection = baseProjection * (1 + variance);

      const projection: PlayerProjection = {
        week,
        season: new Date().getFullYear(),
        projectedPoints: Number(weekProjection.toFixed(1)),
        confidence: 75 + Math.random() * 15, // 75-90% confidence
        breakdown: this.getProjectionBreakdown(player, weekProjection)
      };

      projections.push(projection);
    }

    return projections;
  }

  /**
   * Get projection breakdown by position
   */
  private getProjectionBreakdown(player: NFLPlayer, totalPoints: number): PlayerProjection['breakdown'] {
    const breakdown: PlayerProjection['breakdown'] = {};

    switch (player.position) {
      case 'QB':
        const qbPassPct = 0.75;
        const qbRushPct = 0.25;
        breakdown.passYards = Math.round((totalPoints * qbPassPct * 25));
        breakdown.passTds = Math.round((totalPoints * qbPassPct) / 6);
        breakdown.rushYards = Math.round((totalPoints * qbRushPct * 10));
        breakdown.rushTds = Math.random() > 0.7 ? 1 : 0;
        break;

      case 'RB':
        const rbRushPct = 0.65;
        const rbRecPct = 0.35;
        breakdown.rushYards = Math.round((totalPoints * rbRushPct * 10));
        breakdown.rushTds = Math.round((totalPoints * rbRushPct) / 8);
        breakdown.receptions = Math.round((totalPoints * rbRecPct) / 2);
        breakdown.recYards = Math.round((totalPoints * rbRecPct * 10));
        breakdown.recTds = Math.random() > 0.8 ? 1 : 0;
        break;

      case 'WR':
      case 'TE':
        breakdown.receptions = Math.round(totalPoints / 3);
        breakdown.recYards = Math.round(totalPoints * 6);
        breakdown.recTds = Math.round(totalPoints / 12);
        break;
    }

    return breakdown;
  }

  /**
   * Analyze player performance and trends
   */
  analyzePlayer(playerId: string): PlayerAnalysis | null {
    const player = nflPlayers.find(p => p.id === playerId);
    if (!player) return null;

    // Calculate consistency from weekly stats
    let consistency = 75;
    let volatility = 25;
    let trending: PlayerAnalysis['trending'] = 'stable';

    if (player.weeklyStats && player.weeklyStats.length > 0) {
      const points = player.weeklyStats.map(w => w.fantasyPoints);
      const avg = points.reduce((a, b) => a + b, 0) / points.length;
      const variance = points.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / points.length;
      const stdDev = Math.sqrt(variance);

      consistency = Math.max(0, Math.min(100, 100 - (stdDev / avg * 100)));
      volatility = Math.min(100, stdDev / avg * 100);

      // Check trend (last 3 games vs previous)
      if (points.length >= 3) {
        const recent = points.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const previous = points.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, points.length - 3);
        
        if (recent > previous * 1.15) trending = 'up';
        else if (recent < previous * 0.85) trending = 'down';
      }
    }

    // Position-specific metrics
    let targetShare = undefined;
    let redZoneShare = undefined;
    let snapPercentage = undefined;

    if (player.position === 'WR' || player.position === 'TE') {
      targetShare = 20 + Math.random() * 15; // 20-35%
      redZoneShare = 15 + Math.random() * 20; // 15-35%
      snapPercentage = 70 + Math.random() * 25; // 70-95%
    } else if (player.position === 'RB') {
      snapPercentage = 40 + Math.random() * 40; // 40-80%
      redZoneShare = 20 + Math.random() * 30; // 20-50%
    }

    return {
      strengthOfSchedule: Math.floor(Math.random() * 32) + 1,
      restOfSeasonRank: player.rank + Math.floor((Math.random() - 0.5) * 10),
      playoffScheduleRating: 50 + Math.random() * 50,
      targetShare,
      redZoneShare,
      snapPercentage,
      consistency,
      volatility,
      trending
    };
  }

  /**
   * Compare two players head-to-head
   */
  comparePlayersPlayers(player1Id: string, player2Id: string): PlayerComparison | null {
    const player1 = nflPlayers.find(p => p.id === player1Id);
    const player2 = nflPlayers.find(p => p.id === player2Id);

    if (!player1 || !player2) return null;

    const factors: PlayerComparison['factors'] = {
      recentForm: this.compareRecentForm(player1, player2),
      consistency: this.compareConsistency(player1, player2),
      matchup: this.compareMatchup(player1, player2),
      health: this.compareHealth(player1, player2),
      projections: this.compareProjections(player1, player2)
    };

    // Calculate overall winner
    let player1Score = 0;
    let player2Score = 0;

    Object.values(factors).forEach(factor => {
      if (factor.winner === player1.id) {
        player1Score += factor.margin;
      } else {
        player2Score += factor.margin;
      }
    });

    const totalScore = player1Score + player2Score;
    const confidence = Math.abs(player1Score - player2Score) / totalScore * 100;

    return {
      player1,
      player2,
      winner: player1Score > player2Score ? player1.id : player2.id,
      confidence: Math.min(95, confidence),
      factors
    };
  }

  private compareRecentForm(p1: NFLPlayer, p2: NFLPlayer): { winner: string; margin: number } {
    const p1Recent = p1.weeklyStats?.slice(-3).reduce((sum, w) => sum + w.fantasyPoints, 0) || 0;
    const p2Recent = p2.weeklyStats?.slice(-3).reduce((sum, w) => sum + w.fantasyPoints, 0) || 0;
    
    return {
      winner: p1Recent > p2Recent ? p1.id : p2.id,
      margin: Math.abs(p1Recent - p2Recent) / Math.max(p1Recent, p2Recent, 1) * 100
    };
  }

  private compareConsistency(p1: NFLPlayer, p2: NFLPlayer): { winner: string; margin: number } {
    const p1PPG = p1.stats2023.fantasyPPG;
    const p2PPG = p2.stats2023.fantasyPPG;
    
    // Lower variance is better for consistency
    const p1Variance = this.calculateVariance(p1);
    const p2Variance = this.calculateVariance(p2);
    
    return {
      winner: p1Variance < p2Variance ? p1.id : p2.id,
      margin: Math.abs(p1Variance - p2Variance)
    };
  }

  private compareMatchup(p1: NFLPlayer, p2: NFLPlayer): { winner: string; margin: number } {
    // Simplified matchup comparison based on projected points
    const p1Proj = p1.projectedPoints;
    const p2Proj = p2.projectedPoints;
    
    return {
      winner: p1Proj > p2Proj ? p1.id : p2.id,
      margin: Math.abs(p1Proj - p2Proj) / Math.max(p1Proj, p2Proj) * 100
    };
  }

  private compareHealth(p1: NFLPlayer, p2: NFLPlayer): { winner: string; margin: number } {
    const healthScore: Record<NFLPlayer['status'], number> = {
      'ACTIVE': 100,
      'QUESTIONABLE': 70,
      'DOUBTFUL': 30,
      'OUT': 0,
      'IR': 0,
      'INJURED': 20,
      'SUSPENDED': 0,
      'RETIRED': 0
    };
    
    const p1Health = healthScore[p1.status];
    const p2Health = healthScore[p2.status];
    
    return {
      winner: p1Health > p2Health ? p1.id : p2.id,
      margin: Math.abs(p1Health - p2Health)
    };
  }

  private compareProjections(p1: NFLPlayer, p2: NFLPlayer): { winner: string; margin: number } {
    const p1Proj = p1.projectedPoints;
    const p2Proj = p2.projectedPoints;
    
    return {
      winner: p1Proj > p2Proj ? p1.id : p2.id,
      margin: Math.abs(p1Proj - p2Proj) / Math.max(p1Proj, p2Proj) * 100
    };
  }

  private calculateVariance(player: NFLPlayer): number {
    if (!player.weeklyStats || player.weeklyStats.length === 0) return 50;
    
    const points = player.weeklyStats.map(w => w.fantasyPoints);
    const avg = points.reduce((a, b) => a + b, 0) / points.length;
    const variance = points.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / points.length;
    
    return Math.sqrt(variance) / avg * 100;
  }

  /**
   * Get current NFL week
   */
  private getCurrentWeek(): number {
    const seasonStart = new Date('2024-09-05'); // NFL season start
    const now = new Date();
    const weeksPassed = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(18, Math.max(1, weeksPassed + 1));
  }

  /**
   * Get season-long value prediction
   */
  getSeasonOutlook(playerId: string): {
    currentRank: number;
    projectedFinish: number;
    upside: number;
    floor: number;
    recommendation: 'buy' | 'hold' | 'sell';
  } | null {
    const player = nflPlayers.find(p => p.id === playerId);
    if (!player) return null;

    const analysis = this.analyzePlayer(playerId);
    if (!analysis) return null;

    let projectedFinish = player.rank;
    let recommendation: 'buy' | 'hold' | 'sell' = 'hold';

    // Adjust based on trending
    if (analysis.trending === 'up') {
      projectedFinish = Math.max(1, player.rank - Math.floor(Math.random() * 5 + 2));
      recommendation = player.rank > 20 ? 'buy' : 'hold';
    } else if (analysis.trending === 'down') {
      projectedFinish = player.rank + Math.floor(Math.random() * 5 + 2);
      recommendation = player.rank < 15 ? 'sell' : 'hold';
    }

    // Calculate upside and floor
    const variance = analysis.volatility / 100;
    const upside = Math.max(1, Math.floor(projectedFinish * (1 - variance * 0.5)));
    const floor = Math.floor(projectedFinish * (1 + variance * 0.8));

    return {
      currentRank: player.rank,
      projectedFinish,
      upside,
      floor,
      recommendation
    };
  }

  /**
   * Get trade value assessment
   */
  getTradeValue(playerId: string): {
    value: number; // 1-100
    trend: 'rising' | 'falling' | 'stable';
    fairTrades: string[]; // Player IDs of fair trade targets
  } | null {
    const player = nflPlayers.find(p => p.id === playerId);
    if (!player) return null;

    const analysis = this.analyzePlayer(playerId);
    if (!analysis) return null;

    // Calculate trade value based on rank and trending
    let value = Math.max(1, 100 - player.rank * 2);
    
    if (analysis.trending === 'up') value += 10;
    if (analysis.trending === 'down') value -= 10;
    
    // Adjust for consistency
    value += (analysis.consistency - 50) / 5;
    
    // Ensure within bounds
    value = Math.max(1, Math.min(100, value));

    // Find fair trade targets (similar value players)
    const fairTrades = nflPlayers
      .filter(p => {
        const pValue = Math.max(1, 100 - p.rank * 2);
        return Math.abs(pValue - value) < 10 && p.id !== playerId;
      })
      .slice(0, 5)
      .map(p => p.id);

    return {
      value,
      trend: analysis.trending === 'up' ? 'rising' : analysis.trending === 'down' ? 'falling' : 'stable',
      fairTrades
    };
  }
}

export const playerStatsService = new PlayerStatsService();