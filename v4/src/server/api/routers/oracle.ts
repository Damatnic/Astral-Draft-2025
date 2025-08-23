/**
 * Oracle API Router - TRPC endpoints for AI predictions
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { geminiClient } from '../../../lib/oracle/gemini-client';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

// Input validation schemas
const playerPredictionInput = z.object({
  playerId: z.string(),
  week: z.number().min(1).max(18),
  includeWeather: z.boolean().optional(),
});

const tradeAnalysisInput = z.object({
  team1Id: z.string(),
  team2Id: z.string(),
  team1PlayerIds: z.array(z.string()).min(1),
  team2PlayerIds: z.array(z.string()).min(1),
  includeDraftPicks: z.boolean().optional(),
});

const lineupAdviceInput = z.object({
  teamId: z.string(),
  week: z.number().min(1).max(18),
  mustWin: z.boolean().optional(),
  includeWeather: z.boolean().optional(),
});

const championshipOddsInput = z.object({
  leagueId: z.string(),
  simulateRemainingGames: z.boolean().optional(),
});

// Event emitter for real-time updates
const oracleEvents = new EventEmitter();

export const oracleRouter = createTRPCRouter({
  /**
   * Get player prediction with caching
   */
  getPlayerPrediction: protectedProcedure
    .input(playerPredictionInput)
    .query(async ({ ctx, input }) => {
      try {
        // Get player data from database
        const player = await ctx.db.player.findUnique({
          where: { id: input.playerId },
          include: {
            team: true,
            stats: {
              where: { week: { gte: Math.max(1, input.week - 3) } },
              orderBy: { week: 'desc' },
              take: 3,
            },
          },
        });

        if (!player) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Player not found',
          });
        }

        // Get opponent for the week
        const matchup = await ctx.db.matchup.findFirst({
          where: {
            week: input.week,
            OR: [
              { homeTeamId: player.teamId },
              { awayTeamId: player.teamId },
            ],
          },
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        });

        const opponent = matchup
          ? player.teamId === matchup.homeTeamId
            ? matchup.awayTeam
            : matchup.homeTeam
          : null;

        // Prepare context for Gemini
        const weekContext = {
          week: input.week,
          opponent: opponent?.name || 'BYE',
          isHome: matchup ? player.teamId === matchup.homeTeamId : false,
        };

        const playerData = {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team.name,
          recentStats: player.stats.map(s => ({
            week: s.week,
            points: s.fantasyPoints,
            targets: s.targets,
            touches: s.rushAttempts + s.receptions,
          })),
        };

        // Get prediction from Gemini
        const prediction = await geminiClient.getPlayerPrediction(
          input.playerId,
          playerData,
          weekContext
        );

        // Store in database for historical tracking
        await ctx.db.oraclePrediction.create({
          data: {
            playerId: input.playerId,
            week: input.week,
            projectedPoints: prediction.projectedPoints,
            confidence: prediction.confidence,
            boom: prediction.boom,
            bust: prediction.bust,
            insights: prediction.insights,
            userId: ctx.session.user.id,
          },
        });

        return prediction;
      } catch (error) {
        console.error('Player prediction error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate prediction',
        });
      }
    }),

  /**
   * Analyze trade fairness and impact
   */
  analyzeTrade: protectedProcedure
    .input(tradeAnalysisInput)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get team data
        const [team1, team2] = await Promise.all([
          ctx.db.team.findUnique({
            where: { id: input.team1Id },
            include: {
              roster: {
                include: { player: true },
              },
            },
          }),
          ctx.db.team.findUnique({
            where: { id: input.team2Id },
            include: {
              roster: {
                include: { player: true },
              },
            },
          }),
        ]);

        if (!team1 || !team2) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Team not found',
          });
        }

        // Get players involved in trade
        const team1Players = await ctx.db.player.findMany({
          where: { id: { in: input.team1PlayerIds } },
          include: { stats: true },
        });

        const team2Players = await ctx.db.player.findMany({
          where: { id: { in: input.team2PlayerIds } },
          include: { stats: true },
        });

        // Get league context
        const league = await ctx.db.league.findFirst({
          where: {
            teams: {
              some: { id: input.team1Id },
            },
          },
        });

        const leagueContext = {
          currentWeek: league?.currentWeek || 1,
          team1Record: `${team1.wins}-${team1.losses}`,
          team2Record: `${team2.wins}-${team2.losses}`,
          playoffWeeks: '14-16',
        };

        // Analyze trade
        const analysis = await geminiClient.analyzeTrade(
          team1Players,
          team2Players,
          leagueContext
        );

        // Store trade analysis
        await ctx.db.tradeAnalysis.create({
          data: {
            team1Id: input.team1Id,
            team2Id: input.team2Id,
            team1PlayerIds: input.team1PlayerIds,
            team2PlayerIds: input.team2PlayerIds,
            fairness: analysis.fairness,
            winner: analysis.winner,
            recommendation: analysis.recommendation,
            userId: ctx.session.user.id,
          },
        });

        // Emit event for real-time updates
        oracleEvents.emit('tradeAnalyzed', {
          userId: ctx.session.user.id,
          analysis,
        });

        return analysis;
      } catch (error) {
        console.error('Trade analysis error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to analyze trade',
        });
      }
    }),

  /**
   * Get optimal lineup advice
   */
  getLineupAdvice: protectedProcedure
    .input(lineupAdviceInput)
    .query(async ({ ctx, input }) => {
      try {
        // Get team roster
        const team = await ctx.db.team.findUnique({
          where: { id: input.teamId },
          include: {
            roster: {
              include: {
                player: {
                  include: {
                    stats: {
                      where: { week: input.week },
                      take: 1,
                    },
                  },
                },
              },
            },
            league: {
              include: {
                settings: true,
              },
            },
          },
        });

        if (!team) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Team not found',
          });
        }

        // Prepare roster data
        const roster = team.roster.map(r => ({
          id: r.player.id,
          name: r.player.name,
          position: r.player.position,
          projection: r.player.stats[0]?.projectedPoints || 0,
          status: r.status || 'ACTIVE',
        }));

        // Get lineup requirements from league settings
        const lineupRequirements = {
          QB: team.league.settings?.qbSlots || 1,
          RB: team.league.settings?.rbSlots || 2,
          WR: team.league.settings?.wrSlots || 2,
          TE: team.league.settings?.teSlots || 1,
          FLEX: team.league.settings?.flexSlots || 1,
          DST: team.league.settings?.dstSlots || 1,
          K: team.league.settings?.kSlots || 1,
        };

        const weekContext = {
          week: input.week,
          lineupRequirements,
          mustWin: input.mustWin,
          weather: input.includeWeather ? 'Clear, 72°F, 5mph winds' : null,
        };

        // Get lineup advice
        const advice = await geminiClient.getLineupAdvice(roster, weekContext);

        // Store for tracking
        await ctx.db.lineupAdvice.create({
          data: {
            teamId: input.teamId,
            week: input.week,
            optimal: advice.optimal,
            projectedPoints: advice.projectedPoints,
            confidence: advice.confidence,
            userId: ctx.session.user.id,
          },
        });

        return advice;
      } catch (error) {
        console.error('Lineup advice error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate lineup advice',
        });
      }
    }),

  /**
   * Get championship odds for all teams
   */
  getChampionshipOdds: protectedProcedure
    .input(championshipOddsInput)
    .query(async ({ ctx, input }) => {
      try {
        // Get all teams in league
        const league = await ctx.db.league.findUnique({
          where: { id: input.leagueId },
          include: {
            teams: {
              include: {
                roster: {
                  include: { player: true },
                },
              },
            },
            schedule: {
              where: { week: { gt: league?.currentWeek || 0 } },
            },
          },
        });

        if (!league) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'League not found',
          });
        }

        // Prepare team data
        const teams = league.teams.map(t => ({
          id: t.id,
          name: t.name,
          wins: t.wins,
          losses: t.losses,
          pointsFor: t.pointsFor,
          pointsAgainst: t.pointsAgainst,
        }));

        // Get championship odds
        const odds = await geminiClient.getChampionshipOdds(
          teams,
          league.schedule,
          league.currentWeek
        );

        // Store odds history
        await Promise.all(
          odds.map(o =>
            ctx.db.championshipOdds.create({
              data: {
                teamId: o.teamId,
                week: league.currentWeek,
                currentOdds: o.currentOdds,
                projectedOdds: o.projectedOdds,
                strengthOfSchedule: o.strengthOfSchedule,
                keyFactors: o.keyFactors,
                path: o.path,
              },
            })
          )
        );

        return odds;
      } catch (error) {
        console.error('Championship odds error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to calculate championship odds',
        });
      }
    }),

  /**
   * Get real-time game insights stream
   */
  subscribeToGameInsights: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .subscription(({ ctx, input }) => {
      return observable<string>((emit) => {
        const onInsight = (data: { gameId: string; insight: string }) => {
          if (data.gameId === input.gameId) {
            emit.next(data.insight);
          }
        };

        oracleEvents.on('gameInsight', onInsight);

        return () => {
          oracleEvents.off('gameInsight', onInsight);
        };
      });
    }),

  /**
   * Get trending insights
   */
  getTrendingInsights: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      try {
        // Get recent high-value predictions and insights
        const insights = await ctx.db.oracleInsight.findMany({
          where: {
            priority: 'high',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          orderBy: [
            { views: 'desc' },
            { createdAt: 'desc' },
          ],
          take: input.limit,
          include: {
            relatedPlayers: true,
          },
        });

        return insights.map(i => ({
          id: i.id,
          type: i.type,
          title: i.title,
          content: i.content,
          priority: i.priority,
          timestamp: i.createdAt.getTime(),
          relatedPlayers: i.relatedPlayers.map(p => p.id),
          actionable: i.actionable,
        }));
      } catch (error) {
        console.error('Trending insights error:', error);
        return [];
      }
    }),

  /**
   * Clear prediction cache
   */
  clearCache: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        geminiClient.clearCache();
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to clear cache',
        });
      }
    }),
});