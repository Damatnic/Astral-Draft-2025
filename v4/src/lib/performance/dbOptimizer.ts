/**
 * @fileoverview Database Query Optimization utilities
 * Provides query optimization, batching, and performance monitoring for Prisma queries
 */

import { PrismaClient } from '@prisma/client';
import { measureAsyncFunction } from './monitoring';

// Query performance tracking
interface QueryPerformanceMetrics {
  queryType: string;
  tableName: string;
  duration: number;
  rowsAffected?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

class DatabaseOptimizer {
  private queryMetrics: QueryPerformanceMetrics[] = [];
  private slowQueryThreshold = 500; // ms
  private batchSize = 100;

  constructor(private prisma: PrismaClient) {}

  /**
   * Optimized user queries with proper selection and includes
   */
  async findUserById(id: string, includeRelations = false) {
    const baseQuery = {
      id: true,
      username: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      status: true,
      experienceLevel: true,
      favoriteTeam: true,
      createdAt: true,
      lastLoginAt: true,
    };

    if (!includeRelations) {
      return this.measureQuery(
        'findUserById_basic',
        'users',
        () => this.prisma.user.findUnique({
          where: { id },
          select: baseQuery,
        })
      );
    }

    return this.measureQuery(
      'findUserById_with_relations',
      'users',
      () => this.prisma.user.findUnique({
        where: { id },
        select: {
          ...baseQuery,
          teams: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
              logo: true,
              wins: true,
              losses: true,
              ties: true,
              pointsFor: true,
              pointsAgainst: true,
              league: {
                select: {
                  id: true,
                  name: true,
                  season: true,
                  status: true,
                },
              },
            },
          },
          memberships: {
            select: {
              role: true,
              joinedAt: true,
              league: {
                select: {
                  id: true,
                  name: true,
                  season: true,
                  status: true,
                  teamCount: true,
                },
              },
            },
          },
        },
      })
    );
  }

  /**
   * Optimized league queries with pagination and filtering
   */
  async findLeagues(options: {
    skip?: number;
    take?: number;
    userId?: string;
    status?: string;
    season?: number;
    includeTeams?: boolean;
  }) {
    const { skip = 0, take = 20, userId, status, season, includeTeams = false } = options;

    const where: any = {};
    if (userId) {
      where.OR = [
        { creatorId: userId },
        { members: { some: { userId } } },
      ];
    }
    if (status) where.status = status;
    if (season) where.season = season;

    const select = {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      type: true,
      status: true,
      scoringType: true,
      teamCount: true,
      currentWeek: true,
      season: true,
      isPublic: true,
      createdAt: true,
      creator: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          members: true,
          teams: true,
        },
      },
    };

    if (includeTeams) {
      (select as any).teams = {
        select: {
          id: true,
          name: true,
          abbreviation: true,
          logo: true,
          wins: true,
          losses: true,
          ties: true,
          pointsFor: true,
          pointsAgainst: true,
          standing: true,
          owner: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { standing: 'asc' },
      };
    }

    return this.measureQuery(
      'findLeagues',
      'leagues',
      () => this.prisma.league.findMany({
        where,
        select,
        skip,
        take,
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' },
        ],
      })
    );
  }

  /**
   * Optimized player queries with position and team filtering
   */
  async findPlayers(options: {
    skip?: number;
    take?: number;
    position?: string;
    nflTeam?: string;
    search?: string;
    status?: string;
    includeStats?: boolean;
    season?: number;
    week?: number;
  }) {
    const {
      skip = 0,
      take = 50,
      position,
      nflTeam,
      search,
      status = 'ACTIVE',
      includeStats = false,
      season,
      week,
    } = options;

    const where: any = { status };
    if (position) where.position = position;
    if (nflTeam) where.nflTeam = nflTeam;
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const select = {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      position: true,
      nflTeam: true,
      jerseyNumber: true,
      status: true,
      injuryStatus: true,
      headshotUrl: true,
      adp: true,
      rank: true,
      projectedPoints: true,
    };

    if (includeStats && season) {
      const statsWhere: any = { season };
      if (week) statsWhere.week = week;

      (select as any).stats = {
        where: statsWhere,
        select: {
          week: true,
          season: true,
          fantasyPoints: true,
          passYards: true,
          passTds: true,
          rushYards: true,
          rushTds: true,
          recYards: true,
          recTds: true,
          receptions: true,
        },
        orderBy: { week: 'desc' },
        take: week ? 1 : 17, // Single week or full season
      };
    }

    return this.measureQuery(
      'findPlayers',
      'players',
      () => this.prisma.player.findMany({
        where,
        select,
        skip,
        take,
        orderBy: [
          { adp: 'asc' },
          { name: 'asc' },
        ],
      })
    );
  }

  /**
   * Optimized roster queries with player and team information
   */
  async findRoster(teamId: string, week: number, season: number) {
    return this.measureQuery(
      'findRoster',
      'rosters',
      () => this.prisma.roster.findMany({
        where: { teamId },
        select: {
          id: true,
          position: true,
          isStarter: true,
          player: {
            select: {
              id: true,
              name: true,
              position: true,
              nflTeam: true,
              jerseyNumber: true,
              status: true,
              injuryStatus: true,
              photoUrl: true,
            },
          },
        },
        orderBy: [
          { isStarter: 'desc' },
          { position: 'asc' },
        ],
      })
    );
  }

  /**
   * Batch player stats updates for performance
   */
  async batchUpdatePlayerStats(statsUpdates: Array<{
    playerId: string;
    week: number;
    season: number;
    stats: Record<string, number>;
    points: number;
  }>) {
    const batches = this.chunkArray(statsUpdates, this.batchSize);
    const results = [];

    for (const batch of batches) {
      const batchResult = await this.measureQuery(
        'batchUpdatePlayerStats',
        'player_stats',
        () => this.prisma.$transaction(
          batch.map(({ playerId, week, season, stats, points }) =>
            this.prisma.playerStats.upsert({
              where: {
                playerId_week_season: { playerId, week, season },
              },
              update: { 
                stats: JSON.stringify(stats),
                points 
              },
              create: {
                playerId,
                week,
                season,
                stats: JSON.stringify(stats),
                points,
              },
            })
          )
        )
      );
      results.push(batchResult);
    }

    return results.flat();
  }

  /**
   * Optimized matchup queries with team and score information
   */
  async findMatchups(options: {
    leagueId: string;
    week?: number;
    season: number;
    includeTeamDetails?: boolean;
  }) {
    const { leagueId, week, season, includeTeamDetails = true } = options;

    const where: any = { leagueId, season };
    if (week) where.week = week;

    const select = {
      id: true,
      week: true,
      homeScore: true,
      awayScore: true,
      isComplete: true,
      isPlayoff: true,
      winnerId: true,
      startDate: true,
      endDate: true,
    };

    if (includeTeamDetails) {
      (select as any).homeTeam = {
        select: {
          id: true,
          name: true,
          abbreviation: true,
          logo: true,
          owner: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      };
      (select as any).awayTeam = {
        select: {
          id: true,
          name: true,
          abbreviation: true,
          logo: true,
          owner: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      };
    }

    return this.measureQuery(
      'findMatchups',
      'matchups',
      () => this.prisma.matchup.findMany({
        where,
        select,
        orderBy: [
          { week: 'asc' },
          { createdAt: 'asc' },
        ],
      })
    );
  }

  /**
   * Connection pooling and query optimization utilities
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (attempt === maxRetries) throw error;
        
        // Retry on connection or timeout errors
        if (
          error.code === 'P2028' || // Connection timeout
          error.code === 'P2024' || // Connection pool timeout
          error.code === 'P1017'    // Server closed connection
        ) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Query performance measurement wrapper
   */
  private async measureQuery<T>(
    queryType: string,
    tableName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - start;
      
      this.recordQueryMetrics({
        queryType,
        tableName,
        duration,
        rowsAffected: Array.isArray(result) ? result.length : result ? 1 : 0,
        timestamp: Date.now(),
        sessionId: this.generateSessionId(),
      });

      if (duration > this.slowQueryThreshold) {
        this.reportSlowQuery(queryType, tableName, duration);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordQueryMetrics({
        queryType: `${queryType}_error`,
        tableName,
        duration,
        timestamp: Date.now(),
        sessionId: this.generateSessionId(),
      });
      throw error;
    }
  }

  private recordQueryMetrics(metrics: QueryPerformanceMetrics) {
    this.queryMetrics.push(metrics);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }
  }

  private async reportSlowQuery(queryType: string, tableName: string, duration: number) {
    try {
      await fetch('/api/analytics/performance/slow-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType,
          tableName,
          duration,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.warn('Failed to report slow query:', error);
    }
  }

  private generateSessionId(): string {
    return `db-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get query performance statistics
   */
  getQueryStats() {
    const totalQueries = this.queryMetrics.length;
    const slowQueries = this.queryMetrics.filter(m => m.duration > this.slowQueryThreshold);
    const avgDuration = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;
    
    const byTable = this.queryMetrics.reduce((acc, metric) => {
      if (!acc[metric.tableName]) {
        acc[metric.tableName] = { count: 0, totalDuration: 0 };
      }
      acc[metric.tableName].count++;
      acc[metric.tableName].totalDuration += metric.duration;
      return acc;
    }, {} as Record<string, { count: number; totalDuration: number }>);

    return {
      totalQueries,
      slowQueries: slowQueries.length,
      slowQueryPercentage: (slowQueries.length / totalQueries) * 100,
      avgDuration,
      byTable: Object.entries(byTable).map(([table, stats]) => ({
        table,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count,
      })),
    };
  }

  /**
   * Clear metrics (for testing or memory management)
   */
  clearMetrics() {
    this.queryMetrics = [];
  }
}

// Export configured instance
export const dbOptimizer = new DatabaseOptimizer(new PrismaClient());

// Utility functions for common optimizations
export const withQueryOptimization = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  queryName: string
): T => {
  return measureAsyncFunction(fn, `db_${queryName}`) as T;
};

export const createBatchProcessor = <T, R>(
  processor: (batch: T[]) => Promise<R[]>,
  batchSize = 100
) => {
  return async (items: T[]): Promise<R[]> => {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    const results = [];
    for (const batch of batches) {
      const batchResult = await processor(batch);
      results.push(...batchResult);
    }

    return results;
  };
};

export default DatabaseOptimizer;