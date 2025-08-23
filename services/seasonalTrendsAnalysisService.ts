/**
 * Seasonal Trends Analysis Service
 * Calculates player performance trends across different parts of the NFL season
 * Provides insights into early/mid/late season performance patterns
 */

import { productionSportsDataService } from './productionSportsDataService';

export interface SeasonalTrendData {
  playerId: string;
  playerName: string;
  position: string;
  season: number;
  trends: {
    earlySeason: SeasonalMetrics;    // Weeks 1-6
    midSeason: SeasonalMetrics;      // Weeks 7-12
    lateSeason: SeasonalMetrics;     // Weeks 13-18
    playoffs: SeasonalMetrics;       // Weeks 19-22
  };
  patterns: SeasonalPattern[];
  analysis: SeasonalAnalysis;
}

export interface SeasonalMetrics {
  weeks: number[];
  averageFantasyPoints: number;
  averageTargets?: number;
  averageReceptions?: number;
  averageYards: number;
  averageTouchdowns: number;
  consistencyScore: number;        // 0-100, lower deviation = higher consistency
  ceiling: number;                 // Best performance
  floor: number;                   // Worst performance
  gamesPlayed: number;
  touchesPerGame?: number;
  redZoneTargets?: number;
  snapSharePercentage?: number;
}

export interface SeasonalPattern {
  type: 'improving' | 'declining' | 'consistent' | 'volatile' | 'injury_prone';
  description: string;
  confidence: number;              // 0-1
  supportingWeeks: number[];
  severity: 'low' | 'moderate' | 'high';
  fantasyImpact: string;
}

export interface SeasonalAnalysis {
  overallTrend: 'positive' | 'negative' | 'stable';
  bestPeriod: 'early' | 'mid' | 'late' | 'playoffs';
  worstPeriod: 'early' | 'mid' | 'late' | 'playoffs';
  volatility: number;              // Coefficient of variation
  projectedTrend: {
    direction: 'up' | 'down' | 'stable';
    confidence: number;
    reasoning: string[];
  };
  recommendations: string[];
}

export interface WeeklyPlayerData {
  week: number;
  opponent: string;
  fantasyPoints: number;
  targets?: number;
  receptions?: number;
  yards: number;
  touchdowns: number;
  touches?: number;
  snapShare?: number;
  gameScript: 'positive' | 'neutral' | 'negative';
  homeGame: boolean;
  weather?: 'dome' | 'good' | 'poor';
}

class SeasonalTrendsAnalysisService {
  private readonly cache = new Map<string, SeasonalTrendData>();
  private readonly historicalData = new Map<string, WeeklyPlayerData[]>();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Generate comprehensive seasonal trends analysis for a player
   */
  async generateSeasonalTrends(
    playerId: string, 
    seasons: number[] = [2023, 2024]
  ): Promise<SeasonalTrendData> {
    const cacheKey = `${playerId}_${seasons.join('_')}`;
    
    if (this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      // Get player information
      const player = await productionSportsDataService.getPlayerDetails(playerId);
      if (!player) {
        throw new Error(`Player ${playerId} not found`);
      }

      // Get historical weekly data
      const weeklyData = await this.getPlayerWeeklyData(playerId, seasons);
      
      // Calculate seasonal metrics
      const trends = this.calculateSeasonalMetrics(weeklyData);
      
      // Detect patterns
      const patterns = this.detectSeasonalPatterns(weeklyData, trends);
      
      // Perform analysis
      const analysis = this.analyzeSeasonalTrends(trends, patterns);

      const seasonalTrendData: SeasonalTrendData = {
        playerId,
        playerName: player.name,
        position: player.position,
        season: Math.max(...seasons),
        trends,
        patterns,
        analysis
      };

      this.cache.set(cacheKey, seasonalTrendData);
      return seasonalTrendData;

    } catch (error) {
      console.error(`Error generating seasonal trends for player ${playerId}:`, error);
      return this.generateMockSeasonalData(playerId, 'Unknown Player', 'UNKNOWN');
    }
  }

  /**
   * Get multiple players' seasonal trends for comparison
   */
  async getMultiplePlayerTrends(
    playerIds: string[], 
    seasons: number[] = [2024]
  ): Promise<SeasonalTrendData[]> {
    const promises = playerIds.map(playerId => 
      this.generateSeasonalTrends(playerId, seasons)
    );
    
    return Promise.all(promises);
  }

  /**
   * Calculate seasonal trend values for ML models (0-1 normalized)
   */
  async calculateSeasonalTrendValues(playerId: string): Promise<number[]> {
    const trends = await this.generateSeasonalTrends(playerId);
    
    // Calculate trend values as ratios between periods
    const early = trends.trends.earlySeason.averageFantasyPoints;
    const mid = trends.trends.midSeason.averageFantasyPoints;
    const late = trends.trends.lateSeason.averageFantasyPoints;
    
    if (early === 0) return [0.5, 0.5, 0.5]; // Default if no data
    
    return [
      Math.min(1, Math.max(0, mid / early)),        // Mid vs Early ratio
      Math.min(1, Math.max(0, late / early)),       // Late vs Early ratio  
      Math.min(1, Math.max(0, late / mid))          // Late vs Mid ratio
    ];
  }

  /**
   * Get player's weekly performance data
   */
  private async getPlayerWeeklyData(
    playerId: string, 
    seasons: number[]
  ): Promise<WeeklyPlayerData[]> {
    // Check cache first
    const cacheKey = `${playerId}_weekly_${seasons.join('_')}`;
    if (this.historicalData.has(cacheKey)) {
      const cachedData = this.historicalData.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // In a real implementation, this would fetch from APIs
    // For now, generate realistic mock data
    const weeklyData = this.generateMockWeeklyData(playerId, seasons);
    this.historicalData.set(cacheKey, weeklyData);
    
    return weeklyData;
  }

  /**
   * Calculate seasonal metrics from weekly data
   */
  private calculateSeasonalMetrics(weeklyData: WeeklyPlayerData[]): SeasonalTrendData['trends'] {
    const earlyWeeks = weeklyData.filter(w => w.week >= 1 && w.week <= 6);
    const midWeeks = weeklyData.filter(w => w.week >= 7 && w.week <= 12);
    const lateWeeks = weeklyData.filter(w => w.week >= 13 && w.week <= 18);
    const playoffWeeks = weeklyData.filter(w => w.week >= 19 && w.week <= 22);

    return {
      earlySeason: this.calculatePeriodMetrics(earlyWeeks),
      midSeason: this.calculatePeriodMetrics(midWeeks),
      lateSeason: this.calculatePeriodMetrics(lateWeeks),
      playoffs: this.calculatePeriodMetrics(playoffWeeks)
    };
  }

  /**
   * Calculate metrics for a specific period
   */
  private calculatePeriodMetrics(periodData: WeeklyPlayerData[]): SeasonalMetrics {
    if (periodData.length === 0) {
      return {
        weeks: [],
        averageFantasyPoints: 0,
        averageYards: 0,
        averageTouchdowns: 0,
        consistencyScore: 0,
        ceiling: 0,
        floor: 0,
        gamesPlayed: 0
      };
    }

    const fantasyPoints = periodData.map(w => w.fantasyPoints);
    const yards = periodData.map(w => w.yards);
    const touchdowns = periodData.map(w => w.touchdowns);

    const avgPoints = fantasyPoints.reduce((a, b) => a + b, 0) / fantasyPoints.length;
    const avgYards = yards.reduce((a, b) => a + b, 0) / yards.length;
    const avgTouchdowns = touchdowns.reduce((a, b) => a + b, 0) / touchdowns.length;

    // Calculate consistency (inverse of coefficient of variation)
    const variance = fantasyPoints.reduce((acc, points) => acc + Math.pow(points - avgPoints, 2), 0) / fantasyPoints.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgPoints > 0 ? stdDev / avgPoints : 0;
    const consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 100));

    return {
      weeks: periodData.map(w => w.week),
      averageFantasyPoints: parseFloat(avgPoints.toFixed(1)),
      averageTargets: periodData.filter(w => w.targets).length > 0 
        ? periodData.reduce((sum, w) => sum + (w.targets || 0), 0) / periodData.filter(w => w.targets).length 
        : undefined,
      averageReceptions: periodData.filter(w => w.receptions).length > 0 
        ? periodData.reduce((sum, w) => sum + (w.receptions || 0), 0) / periodData.filter(w => w.receptions).length 
        : undefined,
      averageYards: parseFloat(avgYards.toFixed(1)),
      averageTouchdowns: parseFloat(avgTouchdowns.toFixed(2)),
      consistencyScore: parseFloat(consistencyScore.toFixed(1)),
      ceiling: Math.max(...fantasyPoints),
      floor: Math.min(...fantasyPoints),
      gamesPlayed: periodData.length,
      touchesPerGame: periodData.filter(w => w.touches).length > 0 
        ? periodData.reduce((sum, w) => sum + (w.touches || 0), 0) / periodData.filter(w => w.touches).length 
        : undefined
    };
  }

  /**
   * Helper function to determine severity based on change percent
   */
  private getSeverityLevel(changePercent: number): 'low' | 'moderate' | 'high' {
    const absChange = Math.abs(changePercent);
    if (absChange > 30) return 'high';
    if (absChange > 20) return 'moderate';
    return 'low';
  }

  /**
   * Helper function to determine trend direction
   */
  private getTrendDirection(overallTrend: string): 'up' | 'down' | 'stable' {
    if (overallTrend === 'positive') return 'up';
    if (overallTrend === 'negative') return 'down';
    return 'stable';
  }

  /**
   * Detect seasonal patterns in player performance
   */
  private detectSeasonalPatterns(
    weeklyData: WeeklyPlayerData[], 
    trends: SeasonalTrendData['trends']
  ): SeasonalPattern[] {
    const patterns: SeasonalPattern[] = [];

    // Improvement/Decline pattern
    const earlyAvg = trends.earlySeason.averageFantasyPoints;
    const lateAvg = trends.lateSeason.averageFantasyPoints;
    
    if (earlyAvg > 0) {
      const changePercent = ((lateAvg - earlyAvg) / earlyAvg) * 100;
      
      if (changePercent > 15) {
        patterns.push({
          type: 'improving',
          description: `Strong improvement from early season (${earlyAvg.toFixed(1)}) to late season (${lateAvg.toFixed(1)}) - ${changePercent.toFixed(1)}% increase`,
          confidence: Math.min(0.9, Math.abs(changePercent) / 20),
          supportingWeeks: [...trends.earlySeason.weeks, ...trends.lateSeason.weeks],
          severity: this.getSeverityLevel(changePercent),
          fantasyImpact: 'Positive trend suggests higher value in playoffs and following season'
        });
      } else if (changePercent < -15) {
        patterns.push({
          type: 'declining',
          description: `Notable decline from early season (${earlyAvg.toFixed(1)}) to late season (${lateAvg.toFixed(1)}) - ${Math.abs(changePercent).toFixed(1)}% decrease`,
          confidence: Math.min(0.9, Math.abs(changePercent) / 20),
          supportingWeeks: [...trends.earlySeason.weeks, ...trends.lateSeason.weeks],
          severity: this.getSeverityLevel(changePercent),
          fantasyImpact: 'Declining trend suggests potential injury or usage concerns'
        });
      }
    }

    // Consistency pattern
    const avgConsistency = (trends.earlySeason.consistencyScore + trends.midSeason.consistencyScore + trends.lateSeason.consistencyScore) / 3;
    
    if (avgConsistency > 75) {
      patterns.push({
        type: 'consistent',
        description: `High consistency across all periods (${avgConsistency.toFixed(1)}% average)`,
        confidence: 0.8,
        supportingWeeks: weeklyData.map(w => w.week),
        severity: 'low',
        fantasyImpact: 'Reliable floor makes player suitable for consistent lineup usage'
      });
    } else if (avgConsistency < 40) {
      patterns.push({
        type: 'volatile',
        description: `High volatility across all periods (${avgConsistency.toFixed(1)}% consistency)`,
        confidence: 0.8,
        supportingWeeks: weeklyData.map(w => w.week),
        severity: 'high',
        fantasyImpact: 'Boom/bust player with high ceiling but low floor'
      });
    }

    return patterns;
  }

  /**
   * Analyze seasonal trends and provide insights
   */
  private analyzeSeasonalTrends(
    trends: SeasonalTrendData['trends'],
    patterns: SeasonalPattern[]
  ): SeasonalAnalysis {
    const periods = [
      { name: 'early', metrics: trends.earlySeason },
      { name: 'mid', metrics: trends.midSeason },
      { name: 'late', metrics: trends.lateSeason },
      { name: 'playoffs', metrics: trends.playoffs }
    ];

    // Find best and worst periods
    const periodsWithData = periods.filter(p => p.metrics.gamesPlayed > 0);
    
    if (periodsWithData.length === 0) {
      // Return default analysis if no data
      return {
        overallTrend: 'stable',
        bestPeriod: 'early',
        worstPeriod: 'early',
        volatility: 0,
        projectedTrend: {
          direction: 'stable',
          confidence: 0,
          reasoning: ['No historical data available']
        },
        recommendations: ['Insufficient data for analysis']
      };
    }

    const bestPeriod = periodsWithData.reduce((best, current) => 
      current.metrics.averageFantasyPoints > best.metrics.averageFantasyPoints ? current : best
    , periodsWithData[0]);
    
    const worstPeriod = periodsWithData.reduce((worst, current) => 
      current.metrics.averageFantasyPoints < worst.metrics.averageFantasyPoints ? current : worst
    , periodsWithData[0]);

    // Calculate overall trend
    const earlyAvg = trends.earlySeason.averageFantasyPoints;
    const lateAvg = trends.lateSeason.averageFantasyPoints;
    let overallTrend: 'positive' | 'negative' | 'stable' = 'stable';
    
    if (earlyAvg > 0) {
      const changePercent = ((lateAvg - earlyAvg) / earlyAvg) * 100;
      if (changePercent > 10) overallTrend = 'positive';
      else if (changePercent < -10) overallTrend = 'negative';
    }

    // Calculate volatility
    const allPoints = periodsWithData.map(p => p.metrics.averageFantasyPoints);
    const meanPoints = allPoints.reduce((a, b) => a + b, 0) / allPoints.length;
    const variance = allPoints.reduce((acc, points) => acc + Math.pow(points - meanPoints, 2), 0) / allPoints.length;
    const volatility = meanPoints > 0 ? Math.sqrt(variance) / meanPoints : 0;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (overallTrend === 'positive') {
      recommendations.push('Consider acquiring for playoffs due to improving trend');
    } else if (overallTrend === 'negative') {
      recommendations.push('Monitor for potential sell opportunities');
    }
    
    if (volatility > 0.3) {
      recommendations.push('High volatility makes player better for DFS than season-long');
    }
    
    if (bestPeriod.name === 'late' || bestPeriod.name === 'playoffs') {
      recommendations.push('Strong playoff performer - premium trade target');
    }

    return {
      overallTrend,
      bestPeriod: bestPeriod.name as any,
      worstPeriod: worstPeriod.name as any,
      volatility: parseFloat(volatility.toFixed(3)),
      projectedTrend: {
        direction: this.getTrendDirection(overallTrend),
        confidence: Math.min(0.9, periodsWithData.length / 4),
        reasoning: this.generateTrendReasoning(patterns, overallTrend)
      },
      recommendations
    };
  }

  /**
   * Generate reasoning for trend projections
   */
  private generateTrendReasoning(patterns: SeasonalPattern[], trend: string): string[] {
    const reasoning: string[] = [];
    
    patterns.forEach(pattern => {
      switch (pattern.type) {
        case 'improving':
          reasoning.push('Showed improvement throughout season');
          break;
        case 'declining':
          reasoning.push('Performance declined as season progressed');
          break;
        case 'consistent':
          reasoning.push('Maintained consistent performance');
          break;
        case 'volatile':
          reasoning.push('High variance in weekly performance');
          break;
      }
    });

    if (reasoning.length === 0) {
      reasoning.push('Limited historical data available');
    }

    return reasoning;
  }

  /**
   * Generate mock weekly data for testing
   */
  private generateMockWeeklyData(playerId: string, seasons: number[]): WeeklyPlayerData[] {
    const data: WeeklyPlayerData[] = [];
    
    seasons.forEach((_, seasonIndex) => {
      // Simulate different performance patterns
      const basePoints = 12 + Math.random() * 8; // Base performance 12-20 points
      const seasonTrend = (Math.random() - 0.5) * 0.5; // -25% to +25% season trend
      
      for (let week = 1; week <= 18; week++) {
        // Apply seasonal trend
        const weekFactor = 1 + (seasonTrend * (week - 1) / 17);
        const expectedPoints = basePoints * weekFactor;
        
        // Add some randomness
        const variance = expectedPoints * 0.4;
        const actualPoints = Math.max(0, expectedPoints + (Math.random() - 0.5) * variance);
        
        // Calculate derived stats
        const yards = actualPoints * (8 + Math.random() * 4); // 8-12 yards per point
        const touchdowns = Math.max(0, Math.floor(actualPoints / 8) + (Math.random() > 0.7 ? 1 : 0));
        
        data.push({
          week,
          opponent: ['LAR', 'SF', 'SEA', 'ARI', 'DAL', 'NYG', 'PHI', 'WAS'][Math.floor(Math.random() * 8)],
          fantasyPoints: parseFloat(actualPoints.toFixed(1)),
          targets: Math.floor(5 + Math.random() * 8),
          receptions: Math.floor(3 + Math.random() * 6),
          yards: parseFloat(yards.toFixed(1)),
          touchdowns: parseFloat(touchdowns.toFixed(2)),
          touches: Math.floor(actualPoints / 2 + Math.random() * 5),
          snapShare: parseFloat((0.6 + Math.random() * 0.3).toFixed(2)),
          gameScript: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any,
          homeGame: Math.random() > 0.5,
          weather: ['dome', 'good', 'poor'][Math.floor(Math.random() * 3)] as any
        });
      }
    });
    
    return data;
  }

  /**
   * Generate mock seasonal data when real data isn't available
   */
  private generateMockSeasonalData(
    playerId: string, 
    playerName: string, 
    position: string
  ): SeasonalTrendData {
    const weeklyData = this.generateMockWeeklyData(playerId, [2024]);
    const trends = this.calculateSeasonalMetrics(weeklyData);
    const patterns = this.detectSeasonalPatterns(weeklyData, trends);
    const analysis = this.analyzeSeasonalTrends(trends, patterns);

    return {
      playerId,
      playerName,
      position,
      season: 2024,
      trends,
      patterns,
      analysis
    };
  }

  /**
   * Initialize with some mock data for testing
   */
  private initializeMockData(): void {
    // This can be expanded with more realistic mock data
    console.log('Seasonal Trends Analysis Service initialized');
  }
}

// Export singleton instance
export const seasonalTrendsAnalysisService = new SeasonalTrendsAnalysisService();
export default seasonalTrendsAnalysisService;
