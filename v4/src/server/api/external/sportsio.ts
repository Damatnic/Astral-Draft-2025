/**
 * SportsIO API Integration Service
 * 
 * Handles all interactions with the SportsIO API for real-time NFL data,
 * player stats, injury reports, and game information.
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Redis } from 'ioredis';

// SportsIO API configuration
const SPORTSIO_API_KEY = 'bab44477ed904140b43630a7520517e7';
const SPORTSIO_BASE_URL = 'https://api.sportsdata.io/v3/nfl';

// Types for SportsIO API responses
export interface SportsIOPlayer {
  PlayerID: number;
  Team: string;
  Number: number;
  FirstName: string;
  LastName: string;
  Position: string;
  Status: string;
  Height: string;
  Weight: number;
  BirthDate: string;
  College: string;
  Experience: number;
  InjuryStatus?: string;
  InjuryBodyPart?: string;
  InjuryNotes?: string;
  InjuryStartDate?: string;
  PhotoUrl?: string;
}

export interface SportsIOPlayerStats {
  PlayerID: number;
  SeasonType: number;
  Season: number;
  Week: number;
  Team: string;
  Position: string;
  Number: number;
  Name: string;
  
  // Passing stats
  PassingYards: number;
  PassingTouchdowns: number;
  PassingInterceptions: number;
  PassingAttempts: number;
  PassingCompletions: number;
  
  // Rushing stats
  RushingYards: number;
  RushingTouchdowns: number;
  RushingAttempts: number;
  
  // Receiving stats
  ReceivingYards: number;
  ReceivingTouchdowns: number;
  Receptions: number;
  ReceivingTargets: number;
  
  // Kicking stats
  FieldGoalsMade: number;
  FieldGoalsAttempted: number;
  ExtraPointsMade: number;
  ExtraPointsAttempted: number;
  
  // Defense stats
  Sacks: number;
  SackYards: number;
  Interceptions: number;
  FumblesRecovered: number;
  FumblesForced: number;
  DefensiveTouchdowns: number;
  Safeties: number;
  
  // Fantasy points
  FantasyPoints: number;
  FantasyPointsPPR: number;
  FantasyPointsHalfPPR: number;
}

export interface SportsIOInjuryReport {
  InjuryID: number;
  SeasonType: number;
  Season: number;
  Week: number;
  PlayerID: number;
  Name: string;
  Position: string;
  Number: number;
  Team: string;
  Opponent: string;
  BodyPart: string;
  Status: string;
  PracticeStatus: string;
  PracticeStatusColor: string;
  Notes: string;
  Created: string;
  Updated: string;
}

export interface SportsIOGame {
  GameID: number;
  Season: number;
  SeasonType: number;
  Week: number;
  Date: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayScore: number;
  HomeScore: number;
  Quarter: string;
  TimeRemainingMinutes: number;
  TimeRemainingSeconds: number;
  PointSpread: number;
  OverUnder: number;
  Stadium: string;
  PlayingSurface: string;
  Temperature: number;
  Humidity: number;
  WindSpeed: number;
  ForecastTempLow: number;
  ForecastTempHigh: number;
  ForecastDescription: string;
  IsInProgress: boolean;
  IsClosed: boolean;
  HasStarted: boolean;
}

export interface SportsIOTeamSeasonStats {
  Season: number;
  Team: string;
  Conference: string;
  Division: string;
  Wins: number;
  Losses: number;
  Ties: number;
  Percentage: number;
  PointsFor: number;
  PointsAgainst: number;
  NetPoints: number;
  TouchdownsFor: number;
  TouchdownsAgainst: number;
}

class SportsIOService {
  private client: AxiosInstance;
  private redis: Redis;
  private readonly CACHE_TTL = {
    PLAYERS: 3600, // 1 hour
    STATS: 900, // 15 minutes
    INJURIES: 1800, // 30 minutes
    GAMES: 300, // 5 minutes
    SCHEDULES: 86400 // 24 hours
  };

  constructor() {
    this.client = axios.create({
      baseURL: SPORTSIO_BASE_URL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Ocp-Apim-Subscription-Key': SPORTSIO_API_KEY
      }
    });

    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        console.log(`📡 SportsIO API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ SportsIO API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ SportsIO API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ SportsIO API Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all NFL players with caching
   */
  public async getPlayers(season?: number): Promise<SportsIOPlayer[]> {
    const currentSeason = season || new Date().getFullYear();
    const cacheKey = `sportsio:players:${currentSeason}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('📋 Using cached players data');
        return JSON.parse(cached);
      }

      // Fetch from API
      const response = await this.client.get<SportsIOPlayer[]>(`/players`);
      const players = response.data;

      // Cache the result
      await this.redis.setex(cacheKey, this.CACHE_TTL.PLAYERS, JSON.stringify(players));
      
      console.log(`📋 Fetched ${players.length} players from SportsIO API`);
      return players;
    } catch (error) {
      console.error('❌ Failed to fetch players:', error);
      throw new Error(`Failed to fetch players: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get player stats for a specific week and season
   */
  public async getPlayerStats(season: number, week: number, seasonType: number = 1): Promise<SportsIOPlayerStats[]> {
    const cacheKey = `sportsio:stats:${season}:${seasonType}:${week}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log(`📊 Using cached stats data for Week ${week}`);
        return JSON.parse(cached);
      }

      // Fetch from API
      const response = await this.client.get<SportsIOPlayerStats[]>(
        `/playerstats/${season}/${seasonType}/${week}`
      );
      const stats = response.data;

      // Cache the result
      await this.redis.setex(cacheKey, this.CACHE_TTL.STATS, JSON.stringify(stats));
      
      console.log(`📊 Fetched stats for ${stats.length} players (Week ${week})`);
      return stats;
    } catch (error) {
      console.error(`❌ Failed to fetch player stats for Week ${week}:`, error);
      throw new Error(`Failed to fetch player stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current injury reports
   */
  public async getInjuryReports(season?: number, week?: number): Promise<SportsIOInjuryReport[]> {
    const currentSeason = season || new Date().getFullYear();
    const currentWeek = week || this.getCurrentNFLWeek();
    const cacheKey = `sportsio:injuries:${currentSeason}:${currentWeek}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('🏥 Using cached injury reports');
        return JSON.parse(cached);
      }

      // Fetch from API
      const response = await this.client.get<SportsIOInjuryReport[]>(
        `/injuries/${currentSeason}/${currentWeek}`
      );
      const injuries = response.data;

      // Cache the result
      await this.redis.setex(cacheKey, this.CACHE_TTL.INJURIES, JSON.stringify(injuries));
      
      console.log(`🏥 Fetched ${injuries.length} injury reports`);
      return injuries;
    } catch (error) {
      console.error('❌ Failed to fetch injury reports:', error);
      throw new Error(`Failed to fetch injury reports: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get games for a specific week and season
   */
  public async getGames(season: number, week: number, seasonType: number = 1): Promise<SportsIOGame[]> {
    const cacheKey = `sportsio:games:${season}:${seasonType}:${week}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log(`🏈 Using cached games data for Week ${week}`);
        return JSON.parse(cached);
      }

      // Fetch from API
      const response = await this.client.get<SportsIOGame[]>(
        `/scores/${season}/${seasonType}/${week}`
      );
      const games = response.data;

      // Cache the result
      await this.redis.setex(cacheKey, this.CACHE_TTL.GAMES, JSON.stringify(games));
      
      console.log(`🏈 Fetched ${games.length} games for Week ${week}`);
      return games;
    } catch (error) {
      console.error(`❌ Failed to fetch games for Week ${week}:`, error);
      throw new Error(`Failed to fetch games: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get team season stats
   */
  public async getTeamSeasonStats(season: number): Promise<SportsIOTeamSeasonStats[]> {
    const cacheKey = `sportsio:team-stats:${season}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('🏆 Using cached team season stats');
        return JSON.parse(cached);
      }

      // Fetch from API
      const response = await this.client.get<SportsIOTeamSeasonStats[]>(`/teamseasonstatsr/${season}`);
      const teamStats = response.data;

      // Cache the result
      await this.redis.setex(cacheKey, this.CACHE_TTL.SCHEDULES, JSON.stringify(teamStats));
      
      console.log(`🏆 Fetched team stats for ${teamStats.length} teams`);
      return teamStats;
    } catch (error) {
      console.error('❌ Failed to fetch team season stats:', error);
      throw new Error(`Failed to fetch team season stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get live scores for ongoing games
   */
  public async getLiveScores(): Promise<SportsIOGame[]> {
    try {
      const currentSeason = new Date().getFullYear();
      const currentWeek = this.getCurrentNFLWeek();
      
      // Don't cache live scores, always fetch fresh
      const response = await this.client.get<SportsIOGame[]>(
        `/scoresbasic/${currentSeason}/1/${currentWeek}`
      );
      
      // Filter for live games only
      const liveGames = response.data.filter(game => game.IsInProgress);
      
      console.log(`⚡ Fetched ${liveGames.length} live games`);
      return liveGames;
    } catch (error) {
      console.error('❌ Failed to fetch live scores:', error);
      throw new Error(`Failed to fetch live scores: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check API rate limits and usage
   */
  public async checkApiStatus(): Promise<{ healthy: boolean; rateLimitRemaining?: number }> {
    try {
      const response = await this.client.get('/teams');
      
      const rateLimitRemaining = response.headers['x-requests-remaining'];
      const rateLimitReset = response.headers['x-requests-reset'];
      
      console.log(`📊 API Status: ${rateLimitRemaining} requests remaining`);
      
      return {
        healthy: true,
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined
      };
    } catch (error) {
      console.error('❌ API health check failed:', error);
      return { healthy: false };
    }
  }

  /**
   * Clear specific cache keys
   */
  public async clearCache(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(`sportsio:${pattern}*`);
      if (keys.length === 0) return 0;
      
      const deleted = await this.redis.del(...keys);
      console.log(`🗑️  Cleared ${deleted} cache keys matching: ${pattern}`);
      return deleted;
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      return 0;
    }
  }

  /**
   * Get current NFL week (simple approximation)
   */
  private getCurrentNFLWeek(): number {
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
    const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
    const week = Math.ceil(daysSinceStart / 7);
    return Math.max(1, Math.min(18, week)); // NFL weeks 1-18
  }

  /**
   * Batch API requests with rate limiting
   */
  public async batchRequest<T>(
    requests: (() => Promise<T>)[],
    concurrency: number = 3,
    delayMs: number = 200
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch.map(request => request()));
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('❌ Batch request failed:', result.reason);
          throw result.reason;
        }
      }
      
      // Add delay between batches to respect rate limits
      if (i + concurrency < requests.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }

  /**
   * Close Redis connection
   */
  public async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

// Export singleton instance
export const sportsIOService = new SportsIOService();
export default sportsIOService;