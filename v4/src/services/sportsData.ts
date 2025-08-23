/**
 * Sports Data Service for Astral Draft v4
 * Handles all NFL data fetching, caching, and fallback mechanisms
 */

import { prisma } from '../server/db';
import { Redis } from 'ioredis';
import { z } from 'zod';

// Initialize Redis for caching (fallback to in-memory if not available)
let redis: Redis | null = null;
try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
} catch (error) {
  console.warn('Redis not available, using in-memory cache');
}

// In-memory cache fallback
const memoryCache = new Map<string, { data: any; expires: number }>();

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  LIVE_SCORES: 30,        // 30 seconds for live data
  PLAYER_STATS: 300,      // 5 minutes for player stats
  INJURIES: 600,          // 10 minutes for injury data
  SCHEDULE: 3600,         // 1 hour for schedule
  STANDINGS: 1800,        // 30 minutes for standings
  NEWS: 900,              // 15 minutes for news
};

// SportsIO API configuration
const SPORTSIO_CONFIG = {
  API_KEY: 'bab44477ed904140b43630a7520517e7',
  BASE_URL: 'https://api.sportsdata.io/v3/nfl',
  TIMEOUT: 10000, // 10 seconds
};

// Type definitions
export interface NFLPlayer {
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  Number: number;
  Status: string;
  InjuryStatus?: string;
  InjuryNotes?: string;
  PhotoUrl?: string;
  AverageDraftPosition?: number;
  ByeWeek?: number;
  LastSeasonFantasyPoints?: number;
  ProjectedFantasyPoints?: number;
}

export interface NFLGame {
  GameKey: string;
  Date: string;
  SeasonType: number;
  Status: string;
  HomeTeam: string;
  AwayTeam: string;
  HomeScore?: number;
  AwayScore?: number;
  Quarter?: string;
  TimeRemaining?: string;
  Possession?: string;
  RedZone?: boolean;
  LastUpdated?: string;
}

export interface PlayerStats {
  PlayerID: number;
  Season: number;
  Week: number;
  Team: string;
  Opponent: string;
  PassingYards?: number;
  PassingTouchdowns?: number;
  PassingInterceptions?: number;
  RushingYards?: number;
  RushingTouchdowns?: number;
  ReceivingYards?: number;
  ReceivingTouchdowns?: number;
  Receptions?: number;
  Targets?: number;
  FantasyPoints?: number;
  FantasyPointsPPR?: number;
}

export interface TeamStanding {
  Team: string;
  Wins: number;
  Losses: number;
  Ties: number;
  DivisionWins: number;
  DivisionLosses: number;
  Conference: string;
  Division: string;
  PointsFor: number;
  PointsAgainst: number;
}

export interface InjuryReport {
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  InjuryStatus: string;
  InjuryBodyPart?: string;
  InjuryNotes?: string;
  Updated: string;
}

export interface NewsItem {
  NewsID: number;
  Title: string;
  Content: string;
  Updated: string;
  PlayerID?: number;
  Team?: string;
  Source?: string;
  TermsOfUse?: string;
}

class SportsDataService {
  private rateLimitTracker = new Map<string, number[]>();
  private readonly MAX_REQUESTS_PER_SECOND = 10;

  /**
   * Rate limiting mechanism
   */
  private async checkRateLimit(endpoint: string): Promise<void> {
    const now = Date.now();
    const requests = this.rateLimitTracker.get(endpoint) || [];
    const recentRequests = requests.filter(time => now - time < 1000);
    
    if (recentRequests.length >= this.MAX_REQUESTS_PER_SECOND) {
      const waitTime = 1000 - (now - recentRequests[0]);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    recentRequests.push(now);
    this.rateLimitTracker.set(endpoint, recentRequests);
  }

  /**
   * Generic cache getter
   */
  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      if (redis) {
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
      } else {
        const cached = memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.data;
        }
        memoryCache.delete(key);
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Generic cache setter
   */
  private async setCache(key: string, data: any, ttl: number): Promise<void> {
    try {
      if (redis) {
        await redis.setex(key, ttl, JSON.stringify(data));
      } else {
        memoryCache.set(key, {
          data,
          expires: Date.now() + (ttl * 1000),
        });
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Fetch from SportsIO API with error handling
   */
  private async fetchFromAPI<T>(endpoint: string, ttl: number = 300): Promise<T | null> {
    const cacheKey = `sportsio:${endpoint}`;
    
    // Check cache first
    const cached = await this.getFromCache<T>(cacheKey);
    if (cached) return cached;

    try {
      await this.checkRateLimit(endpoint);
      
      const response = await fetch(
        `${SPORTSIO_CONFIG.BASE_URL}/${endpoint}?key=${SPORTSIO_CONFIG.API_KEY}`,
        {
          signal: AbortSignal.timeout(SPORTSIO_CONFIG.TIMEOUT),
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      await this.setCache(cacheKey, data, ttl);
      return data;
    } catch (error) {
      console.error(`SportsIO API error for ${endpoint}:`, error);
      return this.getMockData<T>(endpoint);
    }
  }

  /**
   * Get mock data when API is unavailable
   */
  private getMockData<T>(endpoint: string): T | null {
    const mockDataMap: Record<string, any> = {
      'scores/json/Players': this.generateMockPlayers(),
      'scores/json/CurrentWeek': 10,
      'scores/json/Injuries': this.generateMockInjuries(),
      'scores/json/News': this.generateMockNews(),
      'scores/json/Standings': this.generateMockStandings(),
    };

    const endpointKey = Object.keys(mockDataMap).find(key => endpoint.includes(key));
    return endpointKey ? mockDataMap[endpointKey] : null;
  }

  /**
   * Fetch all NFL players
   */
  async getPlayers(): Promise<NFLPlayer[]> {
    const data = await this.fetchFromAPI<NFLPlayer[]>(
      'scores/json/Players',
      CACHE_TTL.PLAYER_STATS
    );
    return data || this.generateMockPlayers();
  }

  /**
   * Fetch player by ID
   */
  async getPlayer(playerId: number): Promise<NFLPlayer | null> {
    const players = await this.getPlayers();
    return players.find(p => p.PlayerID === playerId) || null;
  }

  /**
   * Fetch current week's games/scores
   */
  async getLiveScores(season: number, week: number): Promise<NFLGame[]> {
    const data = await this.fetchFromAPI<NFLGame[]>(
      `scores/json/ScoresByWeek/${season}/${week}`,
      CACHE_TTL.LIVE_SCORES
    );
    return data || this.generateMockGames();
  }

  /**
   * Fetch player stats for a specific week
   */
  async getPlayerStats(season: number, week: number): Promise<PlayerStats[]> {
    const data = await this.fetchFromAPI<PlayerStats[]>(
      `stats/json/PlayerGameStatsByWeek/${season}/${week}`,
      CACHE_TTL.PLAYER_STATS
    );
    return data || this.generateMockPlayerStats();
  }

  /**
   * Fetch injury reports
   */
  async getInjuries(): Promise<InjuryReport[]> {
    const data = await this.fetchFromAPI<InjuryReport[]>(
      'scores/json/Injuries',
      CACHE_TTL.INJURIES
    );
    return data || this.generateMockInjuries();
  }

  /**
   * Fetch NFL news
   */
  async getNews(playerId?: number): Promise<NewsItem[]> {
    const endpoint = playerId 
      ? `scores/json/NewsByPlayerID/${playerId}`
      : 'scores/json/News';
    
    const data = await this.fetchFromAPI<NewsItem[]>(endpoint, CACHE_TTL.NEWS);
    return data || this.generateMockNews();
  }

  /**
   * Fetch team standings
   */
  async getStandings(season: number): Promise<TeamStanding[]> {
    const data = await this.fetchFromAPI<TeamStanding[]>(
      `scores/json/Standings/${season}`,
      CACHE_TTL.STANDINGS
    );
    return data || this.generateMockStandings();
  }

  /**
   * Calculate fantasy points based on scoring system
   */
  calculateFantasyPoints(
    stats: PlayerStats,
    scoringSystem: 'STANDARD' | 'PPR' | 'HALF_PPR' = 'PPR'
  ): number {
    let points = 0;

    // Passing
    points += (stats.PassingYards || 0) * 0.04;
    points += (stats.PassingTouchdowns || 0) * 4;
    points -= (stats.PassingInterceptions || 0) * 2;

    // Rushing
    points += (stats.RushingYards || 0) * 0.1;
    points += (stats.RushingTouchdowns || 0) * 6;

    // Receiving
    points += (stats.ReceivingYards || 0) * 0.1;
    points += (stats.ReceivingTouchdowns || 0) * 6;

    // Reception points
    if (scoringSystem === 'PPR') {
      points += (stats.Receptions || 0) * 1;
    } else if (scoringSystem === 'HALF_PPR') {
      points += (stats.Receptions || 0) * 0.5;
    }

    return Math.round(points * 100) / 100;
  }

  /**
   * Sync player data with database
   */
  async syncPlayersWithDatabase(): Promise<void> {
    try {
      const players = await this.getPlayers();
      
      for (const player of players) {
        await prisma.player.upsert({
          where: { externalId: player.PlayerID.toString() },
          update: {
            firstName: player.Name.split(' ')[0] || '',
            lastName: player.Name.split(' ').slice(1).join(' ') || '',
            displayName: player.Name,
            position: player.Position,
            nflTeam: player.Team || 'FA',
            jerseyNumber: player.Number,
            status: player.Status || 'ACTIVE',
            injuryStatus: player.InjuryStatus,
            injuryNotes: player.InjuryNotes,
            headshotUrl: player.PhotoUrl,
            adp: player.AverageDraftPosition,
            projectedPoints: player.ProjectedFantasyPoints,
            updatedAt: new Date(),
          },
          create: {
            externalId: player.PlayerID.toString(),
            firstName: player.Name.split(' ')[0] || '',
            lastName: player.Name.split(' ').slice(1).join(' ') || '',
            displayName: player.Name,
            position: player.Position,
            nflTeam: player.Team || 'FA',
            jerseyNumber: player.Number,
            status: player.Status || 'ACTIVE',
            injuryStatus: player.InjuryStatus,
            injuryNotes: player.InjuryNotes,
            headshotUrl: player.PhotoUrl,
            adp: player.AverageDraftPosition,
            projectedPoints: player.ProjectedFantasyPoints,
          },
        });
      }

      console.log(`Synced ${players.length} players to database`);
    } catch (error) {
      console.error('Database sync error:', error);
      throw error;
    }
  }

  /**
   * Update live scores and calculate fantasy points
   */
  async updateLiveScoresAndPoints(leagueId: string, week: number): Promise<void> {
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: { teams: true },
      });

      if (!league) throw new Error('League not found');

      const stats = await this.getPlayerStats(league.season, week);
      const statsMap = new Map(stats.map(s => [s.PlayerID.toString(), s]));

      // Update roster points
      for (const team of league.teams) {
        const rosters = await prisma.roster.findMany({
          where: {
            teamId: team.id,
            week,
            season: league.season,
          },
          include: { player: true },
        });

        for (const roster of rosters) {
          if (roster.player.externalId) {
            const playerStats = statsMap.get(roster.player.externalId);
            if (playerStats) {
              const points = this.calculateFantasyPoints(
                playerStats,
                league.scoringType as 'STANDARD' | 'PPR' | 'HALF_PPR'
              );

              await prisma.roster.update({
                where: { id: roster.id },
                data: { points },
              });
            }
          }
        }
      }

      console.log(`Updated live scores for league ${leagueId}, week ${week}`);
    } catch (error) {
      console.error('Live score update error:', error);
      throw error;
    }
  }

  // Mock data generators
  private generateMockPlayers(): NFLPlayer[] {
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
    const teams = ['KC', 'BUF', 'SF', 'DAL', 'PHI', 'MIA', 'CIN', 'BAL'];
    const players: NFLPlayer[] = [];

    for (let i = 1; i <= 500; i++) {
      players.push({
        PlayerID: i,
        Name: `Player ${i}`,
        Team: teams[Math.floor(Math.random() * teams.length)],
        Position: positions[Math.floor(Math.random() * positions.length)],
        Number: Math.floor(Math.random() * 99) + 1,
        Status: Math.random() > 0.9 ? 'Injured' : 'Active',
        AverageDraftPosition: Math.random() * 200 + 1,
        ProjectedFantasyPoints: Math.random() * 20 + 5,
      });
    }

    return players;
  }

  private generateMockGames(): NFLGame[] {
    const teams = ['KC', 'BUF', 'SF', 'DAL', 'PHI', 'MIA', 'CIN', 'BAL'];
    const games: NFLGame[] = [];

    for (let i = 0; i < teams.length / 2; i++) {
      games.push({
        GameKey: `202401${i}`,
        Date: new Date().toISOString(),
        SeasonType: 1,
        Status: 'InProgress',
        HomeTeam: teams[i * 2],
        AwayTeam: teams[i * 2 + 1],
        HomeScore: Math.floor(Math.random() * 35),
        AwayScore: Math.floor(Math.random() * 35),
        Quarter: '3',
        TimeRemaining: '5:42',
      });
    }

    return games;
  }

  private generateMockPlayerStats(): PlayerStats[] {
    const stats: PlayerStats[] = [];

    for (let i = 1; i <= 100; i++) {
      stats.push({
        PlayerID: i,
        Season: 2024,
        Week: 10,
        Team: 'KC',
        Opponent: 'BUF',
        PassingYards: Math.random() > 0.8 ? Math.floor(Math.random() * 400) : 0,
        PassingTouchdowns: Math.random() > 0.8 ? Math.floor(Math.random() * 4) : 0,
        RushingYards: Math.random() > 0.5 ? Math.floor(Math.random() * 150) : 0,
        RushingTouchdowns: Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0,
        ReceivingYards: Math.random() > 0.5 ? Math.floor(Math.random() * 150) : 0,
        Receptions: Math.random() > 0.5 ? Math.floor(Math.random() * 10) : 0,
        FantasyPointsPPR: Math.random() * 30 + 5,
      });
    }

    return stats;
  }

  private generateMockInjuries(): InjuryReport[] {
    const injuries: InjuryReport[] = [];
    const statuses = ['Questionable', 'Doubtful', 'Out', 'IR'];

    for (let i = 1; i <= 20; i++) {
      injuries.push({
        PlayerID: Math.floor(Math.random() * 100) + 1,
        Name: `Injured Player ${i}`,
        Team: 'KC',
        Position: 'RB',
        InjuryStatus: statuses[Math.floor(Math.random() * statuses.length)],
        InjuryBodyPart: 'Knee',
        InjuryNotes: 'Week-to-week',
        Updated: new Date().toISOString(),
      });
    }

    return injuries;
  }

  private generateMockNews(): NewsItem[] {
    const news: NewsItem[] = [];

    for (let i = 1; i <= 10; i++) {
      news.push({
        NewsID: i,
        Title: `Breaking: Major NFL News ${i}`,
        Content: `This is important news content about the NFL and fantasy football implications.`,
        Updated: new Date().toISOString(),
        Source: 'ESPN',
      });
    }

    return news;
  }

  private generateMockStandings(): TeamStanding[] {
    const teams = ['KC', 'BUF', 'SF', 'DAL', 'PHI', 'MIA', 'CIN', 'BAL'];
    
    return teams.map((team, i) => ({
      Team: team,
      Wins: 10 - i,
      Losses: i + 3,
      Ties: 0,
      DivisionWins: 4 - Math.floor(i / 2),
      DivisionLosses: Math.floor(i / 2),
      Conference: i < 4 ? 'AFC' : 'NFC',
      Division: i < 4 ? 'West' : 'East',
      PointsFor: 350 - (i * 10),
      PointsAgainst: 250 + (i * 10),
    }));
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    try {
      if (redis) {
        const keys = await redis.keys('sportsio:*');
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        memoryCache.clear();
      }
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    cache: boolean;
    api: boolean;
    database: boolean;
  }> {
    let cacheHealthy = false;
    let apiHealthy = false;
    let databaseHealthy = false;

    // Check cache
    try {
      if (redis) {
        await redis.ping();
        cacheHealthy = true;
      } else {
        cacheHealthy = memoryCache.size >= 0;
      }
    } catch (error) {
      console.error('Cache health check failed:', error);
    }

    // Check API
    try {
      const response = await fetch(
        `${SPORTSIO_CONFIG.BASE_URL}/scores/json/CurrentWeek?key=${SPORTSIO_CONFIG.API_KEY}`,
        { signal: AbortSignal.timeout(5000) }
      );
      apiHealthy = response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
    }

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseHealthy = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    const healthy = cacheHealthy && apiHealthy && databaseHealthy;
    const degraded = (cacheHealthy || apiHealthy) && databaseHealthy;

    return {
      status: healthy ? 'healthy' : degraded ? 'degraded' : 'unhealthy',
      cache: cacheHealthy,
      api: apiHealthy,
      database: databaseHealthy,
    };
  }
}

// Export singleton instance
export const sportsDataService = new SportsDataService();
export default sportsDataService;