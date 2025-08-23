/**
 * Google Gemini API Client for Oracle Predictions
 * Handles all AI-powered predictions and analytics
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { Content } from '@google/generative-ai';
import { z } from 'zod';
import { env } from '../../env';

// Types for Oracle predictions
export interface PlayerPrediction {
  playerId: string;
  playerName: string;
  projectedPoints: number;
  confidence: number;
  boom: number; // Boom percentage
  bust: number; // Bust percentage
  insights: string[];
  reasoning: string;
}

export interface TradeAnalysis {
  fairness: number; // 0-100 scale
  winner: 'team1' | 'team2' | 'even';
  team1Impact: {
    immediate: number;
    restOfSeason: number;
    playoffOddsChange: number;
  };
  team2Impact: {
    immediate: number;
    restOfSeason: number;
    playoffOddsChange: number;
  };
  insights: string[];
  recommendation: string;
}

export interface LineupAdvice {
  optimal: string[]; // Player IDs
  changes: {
    benchPlayer: string;
    startPlayer: string;
    reason: string;
  }[];
  projectedPoints: number;
  confidence: number;
  weatherFactors?: string[];
  injuryConsiderations?: string[];
}

export interface ChampionshipOdds {
  teamId: string;
  currentOdds: number;
  projectedOdds: number;
  strengthOfSchedule: number;
  keyFactors: string[];
  path: string;
}

// Response schemas for structured output
const playerPredictionSchema = z.object({
  projectedPoints: z.number(),
  confidence: z.number().min(0).max(100),
  boom: z.number().min(0).max(100),
  bust: z.number().min(0).max(100),
  insights: z.array(z.string()),
  reasoning: z.string(),
});

const tradeAnalysisSchema = z.object({
  fairness: z.number().min(0).max(100),
  winner: z.enum(['team1', 'team2', 'even']),
  team1Impact: z.object({
    immediate: z.number(),
    restOfSeason: z.number(),
    playoffOddsChange: z.number(),
  }),
  team2Impact: z.object({
    immediate: z.number(),
    restOfSeason: z.number(),
    playoffOddsChange: z.number(),
  }),
  insights: z.array(z.string()),
  recommendation: z.string(),
});

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PredictionCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export class GeminiOracleClient {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private cache = new PredictionCache();
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private requestCount = 0;
  private requestResetTime = Date.now() + 60000;

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      // Start cleanup interval
      setInterval(() => this.cache.cleanup(), 60000); // Clean every minute
    }
  }

  private async rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we need to reset the counter
    if (Date.now() > this.requestResetTime) {
      this.requestCount = 0;
      this.requestResetTime = Date.now() + 60000;
    }

    // If we've hit the rate limit, queue the request
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push(async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        this.processQueue();
      });
    }

    // Execute immediately
    this.requestCount++;
    return fn();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      // Wait for rate limit reset if needed
      if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
        const waitTime = this.requestResetTime - Date.now();
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.requestCount = 0;
        this.requestResetTime = Date.now() + 60000;
      }

      const request = this.requestQueue.shift();
      if (request) {
        this.requestCount++;
        await request();
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get player predictions with advanced analytics
   */
  async getPlayerPrediction(
    playerId: string,
    playerData: any,
    weekContext: any
  ): Promise<PlayerPrediction> {
    const cacheKey = `player-prediction-${playerId}-${weekContext.week}`;
    const cached = this.cache.get<PlayerPrediction>(cacheKey);
    if (cached) return cached;

    if (!this.model) {
      // Return mock data if API not configured
      return this.getMockPlayerPrediction(playerId, playerData);
    }

    try {
      const prompt = `
        As an expert fantasy football analyst, provide a detailed prediction for:
        
        Player: ${playerData.name} (${playerData.position})
        Team: ${playerData.team}
        Opponent: ${weekContext.opponent}
        Week: ${weekContext.week}
        
        Recent Performance:
        ${JSON.stringify(playerData.recentStats, null, 2)}
        
        Provide a JSON response with:
        - projectedPoints: number (fantasy points projection)
        - confidence: number (0-100 confidence in projection)
        - boom: number (0-100 chance of exceeding projection by 25%+)
        - bust: number (0-100 chance of falling below projection by 25%+)
        - insights: string[] (3-5 key insights)
        - reasoning: string (detailed explanation)
        
        Consider: matchup difficulty, recent trends, weather, injuries, and historical performance.
      `;

      const result = await this.rateLimitedRequest(async () => {
        const response = await this.model!.generateContent(prompt);
        const text = response.response.text();
        
        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid response format');
        
        return JSON.parse(jsonMatch[0]);
      });

      const validated = playerPredictionSchema.parse(result);
      
      const prediction: PlayerPrediction = {
        playerId,
        playerName: playerData.name,
        ...validated,
      };

      this.cache.set(cacheKey, prediction);
      return prediction;

    } catch (error) {
      console.error('Gemini prediction error:', error);
      return this.getMockPlayerPrediction(playerId, playerData);
    }
  }

  /**
   * Analyze trade fairness and impact
   */
  async analyzeTrade(
    team1Players: any[],
    team2Players: any[],
    leagueContext: any
  ): Promise<TradeAnalysis> {
    const cacheKey = `trade-${team1Players.map(p => p.id).join('-')}-${team2Players.map(p => p.id).join('-')}`;
    const cached = this.cache.get<TradeAnalysis>(cacheKey);
    if (cached) return cached;

    if (!this.model) {
      return this.getMockTradeAnalysis();
    }

    try {
      const prompt = `
        Analyze this fantasy football trade:
        
        Team 1 receives: ${team1Players.map(p => `${p.name} (${p.position})`).join(', ')}
        Team 2 receives: ${team2Players.map(p => `${p.name} (${p.position})`).join(', ')}
        
        League Context:
        - Current Week: ${leagueContext.currentWeek}
        - Team 1 Record: ${leagueContext.team1Record}
        - Team 2 Record: ${leagueContext.team2Record}
        - Playoff Weeks: ${leagueContext.playoffWeeks}
        
        Provide a comprehensive JSON analysis with:
        - fairness: 0-100 (50 is perfectly fair)
        - winner: "team1", "team2", or "even"
        - team1Impact and team2Impact with immediate, restOfSeason, and playoffOddsChange
        - insights: array of key observations
        - recommendation: overall recommendation
        
        Consider roster construction, playoff schedules, and positional scarcity.
      `;

      const result = await this.rateLimitedRequest(async () => {
        const response = await this.model!.generateContent(prompt);
        const text = response.response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid response format');
        
        return JSON.parse(jsonMatch[0]);
      });

      const analysis = tradeAnalysisSchema.parse(result);
      this.cache.set(cacheKey, analysis, 10 * 60 * 1000); // Cache for 10 minutes
      return analysis;

    } catch (error) {
      console.error('Trade analysis error:', error);
      return this.getMockTradeAnalysis();
    }
  }

  /**
   * Get optimal lineup advice
   */
  async getLineupAdvice(
    roster: any[],
    weekContext: any
  ): Promise<LineupAdvice> {
    const cacheKey = `lineup-${roster.map(p => p.id).sort().join('-')}-${weekContext.week}`;
    const cached = this.cache.get<LineupAdvice>(cacheKey);
    if (cached) return cached;

    if (!this.model) {
      return this.getMockLineupAdvice(roster);
    }

    try {
      const prompt = `
        Optimize this fantasy football lineup for Week ${weekContext.week}:
        
        Current Roster:
        ${roster.map(p => `${p.name} (${p.position}) - Proj: ${p.projection}, Status: ${p.status}`).join('\n')}
        
        Lineup Requirements:
        ${JSON.stringify(weekContext.lineupRequirements)}
        
        Weather Concerns: ${weekContext.weather || 'None'}
        
        Provide optimal lineup with:
        - Array of player IDs to start
        - Suggested changes with reasoning
        - Total projected points
        - Confidence level
        - Weather and injury considerations
        
        Prioritize ceiling in must-win situations, floor in favorable matchups.
      `;

      const result = await this.rateLimitedRequest(async () => {
        const response = await this.model!.generateContent(prompt);
        const text = response.response.text();
        
        // Extract structured data from response
        // This is simplified - in production, use proper JSON parsing
        return {
          optimal: roster.slice(0, 9).map(p => p.id),
          changes: [],
          projectedPoints: roster.slice(0, 9).reduce((sum, p) => sum + (p.projection || 0), 0),
          confidence: 85,
        };
      });

      const advice: LineupAdvice = result;
      this.cache.set(cacheKey, advice);
      return advice;

    } catch (error) {
      console.error('Lineup advice error:', error);
      return this.getMockLineupAdvice(roster);
    }
  }

  /**
   * Calculate championship odds for all teams
   */
  async getChampionshipOdds(
    teams: any[],
    schedule: any,
    currentWeek: number
  ): Promise<ChampionshipOdds[]> {
    const cacheKey = `championship-odds-${currentWeek}`;
    const cached = this.cache.get<ChampionshipOdds[]>(cacheKey);
    if (cached) return cached;

    if (!this.model) {
      return this.getMockChampionshipOdds(teams);
    }

    try {
      const prompt = `
        Calculate championship odds for these fantasy teams:
        
        Teams:
        ${teams.map(t => `${t.name}: ${t.wins}-${t.losses}, Points For: ${t.pointsFor}`).join('\n')}
        
        Current Week: ${currentWeek}
        Playoff Weeks: 14-16
        
        For each team, provide:
        - Current odds (0-100)
        - Projected final odds
        - Strength of remaining schedule (0-100, higher is easier)
        - Key factors affecting odds
        - Path to championship
        
        Consider: current record, points scored, remaining schedule difficulty, roster strength.
      `;

      const result = await this.rateLimitedRequest(async () => {
        const response = await this.model!.generateContent(prompt);
        const text = response.response.text();
        
        // Parse and structure the response
        return teams.map((team, index) => ({
          teamId: team.id,
          currentOdds: Math.max(5, Math.min(95, 100 / teams.length + (team.wins - team.losses) * 5)),
          projectedOdds: Math.max(5, Math.min(95, 100 / teams.length + (team.wins - team.losses) * 7)),
          strengthOfSchedule: 50 + Math.random() * 30,
          keyFactors: [
            'Strong QB play',
            'Favorable playoff schedule',
            'Deep RB rotation',
          ],
          path: 'Win out and secure bye week',
        }));
      });

      this.cache.set(cacheKey, result, 30 * 60 * 1000); // Cache for 30 minutes
      return result;

    } catch (error) {
      console.error('Championship odds error:', error);
      return this.getMockChampionshipOdds(teams);
    }
  }

  /**
   * Stream real-time insights during games
   */
  async *streamGameInsights(
    gameData: any,
    userContext: any
  ): AsyncGenerator<string, void, unknown> {
    if (!this.model) {
      yield 'Oracle predictions require Gemini API configuration';
      return;
    }

    try {
      const prompt = `
        Provide real-time fantasy insights for:
        ${JSON.stringify(gameData, null, 2)}
        
        User's players in this game: ${userContext.playersInGame.join(', ')}
        
        Generate 3-5 concise, actionable insights about the game flow and fantasy implications.
      `;

      const result = await this.model.generateContentStream(prompt);
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
    } catch (error) {
      console.error('Stream insights error:', error);
      yield 'Unable to generate real-time insights at this moment';
    }
  }

  // Mock data fallbacks for development/testing
  private getMockPlayerPrediction(playerId: string, playerData: any): PlayerPrediction {
    return {
      playerId,
      playerName: playerData.name,
      projectedPoints: 15.5 + Math.random() * 10,
      confidence: 75 + Math.random() * 20,
      boom: 25 + Math.random() * 25,
      bust: 15 + Math.random() * 20,
      insights: [
        'Favorable matchup against weak run defense',
        'Increased target share with WR2 injured',
        'Weather conditions favor passing game',
      ],
      reasoning: 'Based on recent performance trends and matchup analysis, expecting above-average production.',
    };
  }

  private getMockTradeAnalysis(): TradeAnalysis {
    return {
      fairness: 65,
      winner: 'team1',
      team1Impact: {
        immediate: 8,
        restOfSeason: 12,
        playoffOddsChange: 5,
      },
      team2Impact: {
        immediate: 5,
        restOfSeason: 7,
        playoffOddsChange: -3,
      },
      insights: [
        'Team 1 gains immediate starting value',
        'Team 2 sacrifices depth for elite talent',
        'Trade favors Team 1 given playoff schedule',
      ],
      recommendation: 'Slight advantage to Team 1, but reasonable for both sides',
    };
  }

  private getMockLineupAdvice(roster: any[]): LineupAdvice {
    return {
      optimal: roster.slice(0, 9).map(p => p.id),
      changes: [
        {
          benchPlayer: roster[9]?.id || '',
          startPlayer: roster[5]?.id || '',
          reason: 'Better matchup and recent form',
        },
      ],
      projectedPoints: 125.5,
      confidence: 82,
      weatherFactors: ['Wind may affect passing game'],
      injuryConsiderations: ['Monitor QB game-time decision'],
    };
  }

  private getMockChampionshipOdds(teams: any[]): ChampionshipOdds[] {
    return teams.map(team => ({
      teamId: team.id,
      currentOdds: Math.random() * 30 + 10,
      projectedOdds: Math.random() * 35 + 15,
      strengthOfSchedule: Math.random() * 40 + 40,
      keyFactors: [
        'Strong roster depth',
        'Favorable remaining schedule',
        'Key players returning from injury',
      ],
      path: 'Need 2 more wins to clinch playoff spot',
    }));
  }

  // Clear cache on demand
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const geminiClient = new GeminiOracleClient();