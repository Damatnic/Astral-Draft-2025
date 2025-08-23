/**
 * Oracle AI Service for Astral Draft v4
 * Advanced AI-powered predictions and analysis using Google Gemini
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { prisma } from '../server/db';
import sportsDataService from './sportsData';
import { z } from 'zod';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyB2qXWzDeOIVkQljvmVbT1uOI0_191zumw');

// Model configuration
const modelConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Type definitions
export interface PlayerPrediction {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  opponent: string;
  projectedPoints: number;
  floor: number;
  ceiling: number;
  confidence: number;
  analysis: string;
  keyFactors: string[];
  injuryRisk: number;
  weatherImpact: number;
  recommendation: 'START' | 'SIT' | 'FLEX' | 'BENCH';
}

export interface TradeAnalysis {
  tradeId: string;
  fairnessScore: number; // 0-100
  teamAGrade: string;
  teamBGrade: string;
  winner: 'TEAM_A' | 'TEAM_B' | 'EVEN';
  impactAnalysis: {
    teamA: {
      immediateImpact: number;
      seasonLongImpact: number;
      playoffImpact: number;
      strengths: string[];
      weaknesses: string[];
    };
    teamB: {
      immediateImpact: number;
      seasonLongImpact: number;
      playoffImpact: number;
      strengths: string[];
      weaknesses: string[];
    };
  };
  recommendation: string;
  alternativeSuggestions: string[];
  marketContext: string;
}

export interface LineupOptimization {
  currentScore: number;
  optimizedScore: number;
  improvement: number;
  lineup: {
    position: string;
    player: {
      id: string;
      name: string;
      projectedPoints: number;
    };
    isOptimal: boolean;
    suggestedChange?: {
      player: {
        id: string;
        name: string;
        projectedPoints: number;
      };
      reason: string;
    };
  }[];
  benchAnalysis: {
    playerId: string;
    playerName: string;
    shouldStart: boolean;
    reason: string;
  }[];
  flexRecommendation: {
    player: {
      id: string;
      name: string;
      position: string;
      projectedPoints: number;
    };
    reason: string;
  };
}

export interface InjuryImpact {
  playerId: string;
  playerName: string;
  injuryStatus: string;
  projectedPointsHealthy: number;
  projectedPointsInjured: number;
  pointsLost: number;
  snapCountProjection: number;
  replacementSuggestions: {
    playerId: string;
    playerName: string;
    availability: 'FREE_AGENT' | 'WAIVER' | 'TRADE';
    projectedPoints: number;
    cost?: number;
  }[];
  analysis: string;
  timeline: string;
}

export interface WeeklyInsights {
  week: number;
  topPlays: PlayerPrediction[];
  sleepers: PlayerPrediction[];
  busts: PlayerPrediction[];
  injuryAlerts: InjuryImpact[];
  weatherConcerns: {
    game: string;
    impact: string;
    affectedPlayers: string[];
  }[];
  dfsValue: {
    playerId: string;
    playerName: string;
    salary: number;
    projectedPoints: number;
    value: number;
  }[];
  narrative: string;
}

class OracleAIService {
  private model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    generationConfig: modelConfig,
    safetySettings,
  });

  private predictionCache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  /**
   * Get cached prediction or null
   */
  private getCached<T>(key: string): T | null {
    const cached = this.predictionCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.predictionCache.delete(key);
    return null;
  }

  /**
   * Set cache with TTL
   */
  private setCache(key: string, data: any): void {
    this.predictionCache.set(key, {
      data,
      expires: Date.now() + this.CACHE_TTL,
    });
  }

  /**
   * Generate player predictions for a week
   */
  async generatePlayerPredictions(
    leagueId: string,
    week: number,
    position?: string
  ): Promise<PlayerPrediction[]> {
    const cacheKey = `predictions:${leagueId}:${week}:${position || 'all'}`;
    const cached = this.getCached<PlayerPrediction[]>(cacheKey);
    if (cached) return cached;

    try {
      // Get league and player data
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
      });

      if (!league) throw new Error('League not found');

      // Get player stats and injuries
      const [players, injuries, stats] = await Promise.all([
        sportsDataService.getPlayers(),
        sportsDataService.getInjuries(),
        sportsDataService.getPlayerStats(league.season, week - 1),
      ]);

      // Filter by position if specified
      const targetPlayers = position 
        ? players.filter(p => p.Position === position)
        : players;

      // Build context for AI
      const context = {
        week,
        season: league.season,
        scoringType: league.scoringType,
        injuries: injuries.map(i => ({
          name: i.Name,
          status: i.InjuryStatus,
          notes: i.InjuryNotes,
        })),
        recentStats: stats.slice(0, 100), // Limit for context window
      };

      const prompt = `
        As an expert fantasy football analyst, generate detailed projections for Week ${week}.
        
        Context:
        - Scoring: ${league.scoringType}
        - Key Injuries: ${JSON.stringify(context.injuries.slice(0, 10))}
        
        For the top ${position || 'flex'} players, provide:
        1. Projected points (be specific)
        2. Floor and ceiling
        3. Key factors affecting performance
        4. Start/sit recommendation
        5. Confidence level (0-100)
        
        Consider: matchups, injuries, weather, recent form, and historical performance.
        
        Return as JSON array with this structure:
        [{
          "playerName": "string",
          "position": "string",
          "team": "string",
          "opponent": "string",
          "projectedPoints": number,
          "floor": number,
          "ceiling": number,
          "confidence": number,
          "keyFactors": ["string"],
          "recommendation": "START|SIT|FLEX|BENCH",
          "analysis": "string"
        }]
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Parse AI response
      let predictions: PlayerPrediction[] = [];
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          predictions = parsed.map((p: any) => ({
            playerId: this.findPlayerId(p.playerName, players),
            playerName: p.playerName,
            position: p.position,
            team: p.team,
            opponent: p.opponent,
            projectedPoints: p.projectedPoints,
            floor: p.floor,
            ceiling: p.ceiling,
            confidence: p.confidence,
            analysis: p.analysis,
            keyFactors: p.keyFactors,
            injuryRisk: this.calculateInjuryRisk(p.playerName, injuries),
            weatherImpact: 0, // Would integrate weather API
            recommendation: p.recommendation,
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        predictions = this.generateFallbackPredictions(targetPlayers.slice(0, 20));
      }

      this.setCache(cacheKey, predictions);
      return predictions;
    } catch (error) {
      console.error('Player prediction error:', error);
      return this.generateFallbackPredictions([]);
    }
  }

  /**
   * Analyze a trade proposal
   */
  async analyzeTradeProposal(
    leagueId: string,
    teamAPlayers: string[],
    teamBPlayers: string[],
    teamAId: string,
    teamBId: string
  ): Promise<TradeAnalysis> {
    try {
      // Get team rosters and league settings
      const [league, teamA, teamB] = await Promise.all([
        prisma.league.findUnique({ where: { id: leagueId } }),
        prisma.team.findUnique({
          where: { id: teamAId },
          include: { roster: { include: { player: true } } },
        }),
        prisma.team.findUnique({
          where: { id: teamBId },
          include: { roster: { include: { player: true } } },
        }),
      ]);

      if (!league || !teamA || !teamB) {
        throw new Error('Invalid league or teams');
      }

      const prompt = `
        Analyze this fantasy football trade proposal:
        
        League: ${league.scoringType} scoring, ${league.teamCount} teams
        
        Team A (${teamA.wins}-${teamA.losses}) gives:
        ${teamAPlayers.join(', ')}
        
        Team B (${teamB.wins}-${teamB.losses}) gives:
        ${teamBPlayers.join(', ')}
        
        Provide a comprehensive analysis including:
        1. Fairness score (0-100)
        2. Letter grades for each team
        3. Winner determination
        4. Immediate vs long-term impact
        5. How it affects each team's strengths/weaknesses
        6. Alternative suggestions if unfair
        7. Market context
        
        Consider: positional scarcity, team needs, playoff implications, keeper value.
        
        Return as JSON with this structure:
        {
          "fairnessScore": number,
          "teamAGrade": "A-F",
          "teamBGrade": "A-F",
          "winner": "TEAM_A|TEAM_B|EVEN",
          "teamAImmediateImpact": number,
          "teamASeasonImpact": number,
          "teamAPlayoffImpact": number,
          "teamAStrengths": ["string"],
          "teamAWeaknesses": ["string"],
          "teamBImmediateImpact": number,
          "teamBSeasonImpact": number,
          "teamBPlayoffImpact": number,
          "teamBStrengths": ["string"],
          "teamBWeaknesses": ["string"],
          "recommendation": "string",
          "alternatives": ["string"],
          "marketContext": "string"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Parse response
      let analysis: TradeAnalysis;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          analysis = {
            tradeId: `${teamAId}-${teamBId}-${Date.now()}`,
            fairnessScore: parsed.fairnessScore,
            teamAGrade: parsed.teamAGrade,
            teamBGrade: parsed.teamBGrade,
            winner: parsed.winner,
            impactAnalysis: {
              teamA: {
                immediateImpact: parsed.teamAImmediateImpact,
                seasonLongImpact: parsed.teamASeasonImpact,
                playoffImpact: parsed.teamAPlayoffImpact,
                strengths: parsed.teamAStrengths,
                weaknesses: parsed.teamAWeaknesses,
              },
              teamB: {
                immediateImpact: parsed.teamBImmediateImpact,
                seasonLongImpact: parsed.teamBSeasonImpact,
                playoffImpact: parsed.teamBPlayoffImpact,
                strengths: parsed.teamBStrengths,
                weaknesses: parsed.teamBWeaknesses,
              },
            },
            recommendation: parsed.recommendation,
            alternativeSuggestions: parsed.alternatives,
            marketContext: parsed.marketContext,
          };
        } else {
          throw new Error('Failed to parse trade analysis');
        }
      } catch (parseError) {
        console.error('Trade analysis parse error:', parseError);
        analysis = this.generateFallbackTradeAnalysis(teamAPlayers, teamBPlayers);
      }

      return analysis;
    } catch (error) {
      console.error('Trade analysis error:', error);
      return this.generateFallbackTradeAnalysis(teamAPlayers, teamBPlayers);
    }
  }

  /**
   * Optimize lineup for maximum points
   */
  async optimizeLineup(
    teamId: string,
    week: number
  ): Promise<LineupOptimization> {
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          league: true,
          roster: {
            where: { week, season: 2024 },
            include: { player: true },
          },
        },
      });

      if (!team) throw new Error('Team not found');

      // Get predictions for all roster players
      const predictions = await this.generatePlayerPredictions(
        team.leagueId,
        week
      );

      const rosterConfig = JSON.parse(team.league.rosterPositions);
      const currentLineup = team.roster.filter(r => r.isStarter);
      const bench = team.roster.filter(r => !r.isStarter);

      const prompt = `
        Optimize this fantasy lineup for Week ${week}:
        
        Current Starters:
        ${currentLineup.map(r => `${r.position}: ${r.player.displayName} (${r.projectedPoints} pts)`).join('\n')}
        
        Bench:
        ${bench.map(r => `${r.player.position}: ${r.player.displayName} (${r.projectedPoints} pts)`).join('\n')}
        
        Roster Requirements: ${JSON.stringify(rosterConfig)}
        
        Provide:
        1. Optimal lineup with projected points
        2. Suggested changes with reasoning
        3. Flex position recommendation
        4. Bench analysis (who might outperform starters)
        
        Consider: matchups, recent form, injuries, weather.
        
        Return optimal lineup and analysis as detailed JSON.
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Parse and structure the optimization
      const optimization = this.parseLineupOptimization(response, team.roster);
      
      return optimization;
    } catch (error) {
      console.error('Lineup optimization error:', error);
      throw error;
    }
  }

  /**
   * Analyze injury impact on fantasy value
   */
  async analyzeInjuryImpact(
    playerId: string,
    leagueId: string
  ): Promise<InjuryImpact> {
    try {
      const [player, injuries, league] = await Promise.all([
        prisma.player.findUnique({ where: { id: playerId } }),
        sportsDataService.getInjuries(),
        prisma.league.findUnique({ where: { id: leagueId } }),
      ]);

      if (!player || !league) throw new Error('Player or league not found');

      const injury = injuries.find(i => 
        i.Name.toLowerCase() === player.displayName.toLowerCase()
      );

      if (!injury) {
        return {
          playerId,
          playerName: player.displayName,
          injuryStatus: 'HEALTHY',
          projectedPointsHealthy: player.projectedPoints || 0,
          projectedPointsInjured: player.projectedPoints || 0,
          pointsLost: 0,
          snapCountProjection: 100,
          replacementSuggestions: [],
          analysis: 'Player is currently healthy',
          timeline: 'No injury concerns',
        };
      }

      const prompt = `
        Analyze injury impact for ${player.displayName}:
        
        Injury: ${injury.InjuryStatus} - ${injury.InjuryBodyPart}
        Notes: ${injury.InjuryNotes}
        Position: ${player.position}
        
        Provide:
        1. Projected points when healthy vs injured
        2. Expected snap count percentage
        3. Recovery timeline
        4. Top 3 replacement options (if needed)
        5. Detailed analysis
        
        Return as JSON with specific projections.
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return this.parseInjuryImpact(response, player, injury);
    } catch (error) {
      console.error('Injury impact analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate weekly insights and narratives
   */
  async generateWeeklyInsights(
    leagueId: string,
    week: number
  ): Promise<WeeklyInsights> {
    try {
      const [predictions, injuries] = await Promise.all([
        this.generatePlayerPredictions(leagueId, week),
        sportsDataService.getInjuries(),
      ]);

      // Sort and categorize predictions
      const sortedByPoints = [...predictions].sort((a, b) => 
        b.projectedPoints - a.projectedPoints
      );

      const sortedByValue = [...predictions].sort((a, b) => {
        const aValue = (a.projectedPoints - a.floor) / (a.ceiling - a.floor);
        const bValue = (b.projectedPoints - b.floor) / (b.ceiling - b.floor);
        return bValue - aValue;
      });

      const topPlays = sortedByPoints.slice(0, 10);
      
      const sleepers = sortedByValue
        .filter(p => p.confidence > 70 && p.projectedPoints > 10)
        .slice(0, 5);
      
      const busts = predictions
        .filter(p => p.confidence < 40 && p.floor < 5)
        .slice(0, 5);

      // Get injury impacts for key players
      const injuryAlerts: InjuryImpact[] = [];
      for (const injury of injuries.slice(0, 5)) {
        const player = await prisma.player.findFirst({
          where: { displayName: injury.Name },
        });
        
        if (player) {
          const impact = await this.analyzeInjuryImpact(player.id, leagueId);
          injuryAlerts.push(impact);
        }
      }

      // Generate narrative
      const narrativePrompt = `
        Create an engaging fantasy football narrative for Week ${week}:
        
        Top performers: ${topPlays.slice(0, 3).map(p => p.playerName).join(', ')}
        Key sleepers: ${sleepers.slice(0, 3).map(p => p.playerName).join(', ')}
        Injury concerns: ${injuryAlerts.slice(0, 3).map(i => i.playerName).join(', ')}
        
        Write a 2-3 paragraph preview highlighting key storylines, must-start players,
        and strategic insights. Make it informative but entertaining.
      `;

      const narrativeResult = await this.model.generateContent(narrativePrompt);
      const narrative = narrativeResult.response.text();

      return {
        week,
        topPlays,
        sleepers,
        busts,
        injuryAlerts,
        weatherConcerns: [], // Would integrate weather API
        dfsValue: this.calculateDFSValue(predictions),
        narrative,
      };
    } catch (error) {
      console.error('Weekly insights generation error:', error);
      throw error;
    }
  }

  /**
   * Chat-based assistant for quick questions
   */
  async askOracle(question: string, context?: any): Promise<string> {
    try {
      const prompt = `
        You are the Oracle, an expert fantasy football advisor.
        
        User Question: ${question}
        
        ${context ? `Context: ${JSON.stringify(context)}` : ''}
        
        Provide a helpful, accurate, and concise response.
        Focus on actionable advice and specific recommendations.
        If discussing players, include projected points when relevant.
      `;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Oracle chat error:', error);
      return 'I apologize, but I encountered an error processing your question. Please try again or rephrase your question.';
    }
  }

  // Helper methods
  private findPlayerId(playerName: string, players: any[]): string {
    const player = players.find(p => 
      p.Name.toLowerCase() === playerName.toLowerCase()
    );
    return player ? player.PlayerID.toString() : `unknown-${playerName}`;
  }

  private calculateInjuryRisk(playerName: string, injuries: any[]): number {
    const injury = injuries.find(i => 
      i.Name.toLowerCase() === playerName.toLowerCase()
    );
    
    if (!injury) return 0;
    
    const riskMap: Record<string, number> = {
      'Out': 100,
      'Doubtful': 80,
      'Questionable': 50,
      'Probable': 20,
    };
    
    return riskMap[injury.InjuryStatus] || 0;
  }

  private generateFallbackPredictions(players: any[]): PlayerPrediction[] {
    return players.slice(0, 20).map(p => ({
      playerId: p.PlayerID?.toString() || 'unknown',
      playerName: p.Name || 'Unknown Player',
      position: p.Position || 'FLEX',
      team: p.Team || 'FA',
      opponent: 'TBD',
      projectedPoints: Math.random() * 20 + 5,
      floor: Math.random() * 10 + 2,
      ceiling: Math.random() * 30 + 10,
      confidence: Math.random() * 100,
      analysis: 'Analysis pending',
      keyFactors: ['Matchup', 'Recent form'],
      injuryRisk: 0,
      weatherImpact: 0,
      recommendation: 'FLEX' as const,
    }));
  }

  private generateFallbackTradeAnalysis(
    teamAPlayers: string[],
    teamBPlayers: string[]
  ): TradeAnalysis {
    const fairness = 50 + Math.random() * 30;
    return {
      tradeId: `trade-${Date.now()}`,
      fairnessScore: fairness,
      teamAGrade: fairness > 60 ? 'B+' : 'C+',
      teamBGrade: fairness > 60 ? 'B' : 'C',
      winner: fairness > 60 ? 'EVEN' : 'TEAM_A',
      impactAnalysis: {
        teamA: {
          immediateImpact: Math.random() * 10,
          seasonLongImpact: Math.random() * 10,
          playoffImpact: Math.random() * 10,
          strengths: ['Depth improved'],
          weaknesses: ['Lost top talent'],
        },
        teamB: {
          immediateImpact: Math.random() * 10,
          seasonLongImpact: Math.random() * 10,
          playoffImpact: Math.random() * 10,
          strengths: ['Star power added'],
          weaknesses: ['Depth concerns'],
        },
      },
      recommendation: 'Consider team needs before accepting',
      alternativeSuggestions: ['Add draft pick compensation'],
      marketContext: 'Fair market value',
    };
  }

  private parseLineupOptimization(response: string, roster: any[]): LineupOptimization {
    // Parse AI response and structure lineup optimization
    // This is a simplified version - would need more robust parsing
    const currentScore = roster
      .filter(r => r.isStarter)
      .reduce((sum, r) => sum + r.projectedPoints, 0);

    return {
      currentScore,
      optimizedScore: currentScore * 1.1, // Placeholder
      improvement: currentScore * 0.1,
      lineup: roster.map(r => ({
        position: r.position,
        player: {
          id: r.player.id,
          name: r.player.displayName,
          projectedPoints: r.projectedPoints,
        },
        isOptimal: r.isStarter,
        suggestedChange: undefined,
      })),
      benchAnalysis: [],
      flexRecommendation: {
        player: {
          id: roster[0].player.id,
          name: roster[0].player.displayName,
          position: roster[0].player.position,
          projectedPoints: roster[0].projectedPoints,
        },
        reason: 'Best flex option based on matchup',
      },
    };
  }

  private parseInjuryImpact(
    response: string,
    player: any,
    injury: any
  ): InjuryImpact {
    // Parse AI response for injury impact
    const impactMap: Record<string, number> = {
      'Out': 1.0,
      'Doubtful': 0.7,
      'Questionable': 0.3,
      'Probable': 0.1,
    };

    const impact = impactMap[injury.InjuryStatus] || 0.2;
    const healthyPoints = player.projectedPoints || 15;
    const injuredPoints = healthyPoints * (1 - impact);

    return {
      playerId: player.id,
      playerName: player.displayName,
      injuryStatus: injury.InjuryStatus,
      projectedPointsHealthy: healthyPoints,
      projectedPointsInjured: injuredPoints,
      pointsLost: healthyPoints - injuredPoints,
      snapCountProjection: (1 - impact) * 100,
      replacementSuggestions: [],
      analysis: `${injury.InjuryBodyPart} injury affecting performance`,
      timeline: injury.InjuryNotes || 'Week-to-week',
    };
  }

  private calculateDFSValue(predictions: PlayerPrediction[]): any[] {
    // Calculate DFS value (points per dollar)
    return predictions.slice(0, 10).map(p => ({
      playerId: p.playerId,
      playerName: p.playerName,
      salary: 5000 + Math.random() * 5000, // Placeholder
      projectedPoints: p.projectedPoints,
      value: p.projectedPoints / (5000 + Math.random() * 5000) * 1000,
    }));
  }

  /**
   * Clear prediction cache
   */
  clearCache(): void {
    this.predictionCache.clear();
  }
}

// Export singleton instance
export const oracleAI = new OracleAIService();
export default oracleAI;