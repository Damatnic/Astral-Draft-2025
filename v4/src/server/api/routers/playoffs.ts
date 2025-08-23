import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { PlayoffBracketGenerator } from '../../playoffs/bracketGenerator';
import { ChampionshipManager } from '../../playoffs/championshipManager';
import { AwardsCalculator } from '../../playoffs/awardsCalculator';
import { prisma } from '../../db';
import { TRPCError } from '@trpc/server';

export const playoffRouter = createTRPCRouter({
  // Generate playoff bracket
  generateBracket: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      season: z.number(),
      teamCount: z.enum(['4', '6', '8']).transform(val => parseInt(val) as 4 | 6 | 8),
      startWeek: z.number(),
      endWeek: z.number(),
      hasThirdPlace: z.boolean().optional(),
      championshipWeeks: z.enum(['1', '2']).transform(val => parseInt(val) as 1 | 2).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is commissioner
      const member = await prisma.leagueMember.findFirst({
        where: {
          leagueId: input.leagueId,
          userId: ctx.session.user.id,
          role: { in: ['COMMISSIONER', 'CO_COMMISSIONER'] }
        }
      });

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only commissioners can generate playoff brackets'
        });
      }

      // Check if bracket already exists
      const existingBracket = await prisma.playoffBracket.findUnique({
        where: { leagueId: input.leagueId }
      });

      if (existingBracket) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Playoff bracket already exists for this league'
        });
      }

      const bracket = await PlayoffBracketGenerator.generateBracket({
        leagueId: input.leagueId,
        season: input.season,
        teamCount: input.teamCount,
        startWeek: input.startWeek,
        endWeek: input.endWeek,
        hasThirdPlace: input.hasThirdPlace,
        championshipWeeks: input.championshipWeeks
      });

      return bracket;
    }),

  // Get playoff bracket
  getBracket: protectedProcedure
    .input(z.object({
      leagueId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Check if user is league member
      const member = await prisma.leagueMember.findFirst({
        where: {
          leagueId: input.leagueId,
          userId: ctx.session.user.id
        }
      });

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be a league member to view the playoff bracket'
        });
      }

      const bracket = await prisma.playoffBracket.findUnique({
        where: { leagueId: input.leagueId },
        include: {
          rounds: {
            include: {
              matchups: true
            },
            orderBy: { roundNumber: 'asc' }
          }
        }
      });

      if (!bracket) {
        return null;
      }

      // Get team details for matchups
      const teamIds = new Set<string>();
      bracket.rounds.forEach(round => {
        round.matchups.forEach(matchup => {
          if (matchup.highSeedId) teamIds.add(matchup.highSeedId);
          if (matchup.lowSeedId) teamIds.add(matchup.lowSeedId);
        });
      });

      const teams = await prisma.team.findMany({
        where: { id: { in: Array.from(teamIds) } },
        include: { owner: true }
      });

      const teamMap = new Map(teams.map(t => [t.id, t]));

      // Enhance matchups with team data
      const enhancedRounds = bracket.rounds.map(round => ({
        ...round,
        matchups: round.matchups.map(matchup => ({
          ...matchup,
          highSeed: matchup.highSeedId ? teamMap.get(matchup.highSeedId) : undefined,
          lowSeed: matchup.lowSeedId ? teamMap.get(matchup.lowSeedId) : undefined
        }))
      }));

      return {
        ...bracket,
        rounds: enhancedRounds
      };
    }),

  // Update matchup scores
  updateMatchupScores: protectedProcedure
    .input(z.object({
      matchupId: z.string(),
      highSeedScore: z.number(),
      lowSeedScore: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      // Get matchup and verify user is commissioner
      const matchup = await prisma.playoffMatchup.findUnique({
        where: { id: input.matchupId },
        include: {
          round: {
            include: {
              bracket: {
                include: {
                  league: {
                    include: {
                      members: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!matchup) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Matchup not found'
        });
      }

      const isCommissioner = matchup.round.bracket.league.members.some(
        m => m.userId === ctx.session.user.id && 
        (m.role === 'COMMISSIONER' || m.role === 'CO_COMMISSIONER')
      );

      if (!isCommissioner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only commissioners can update matchup scores'
        });
      }

      await PlayoffBracketGenerator.updateMatchupScores(
        input.matchupId,
        input.highSeedScore,
        input.lowSeedScore
      );

      return { success: true };
    }),

  // Advance winner
  advanceWinner: protectedProcedure
    .input(z.object({
      matchupId: z.string(),
      winnerId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Similar permission check as updateMatchupScores
      const matchup = await prisma.playoffMatchup.findUnique({
        where: { id: input.matchupId },
        include: {
          round: {
            include: {
              bracket: {
                include: {
                  league: {
                    include: {
                      members: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!matchup) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Matchup not found'
        });
      }

      const isCommissioner = matchup.round.bracket.league.members.some(
        m => m.userId === ctx.session.user.id && 
        (m.role === 'COMMISSIONER' || m.role === 'CO_COMMISSIONER')
      );

      if (!isCommissioner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only commissioners can advance winners'
        });
      }

      await PlayoffBracketGenerator.advanceWinner(input.matchupId, input.winnerId);

      // Check if championship is complete
      const bracket = await prisma.playoffBracket.findUnique({
        where: { id: matchup.round.bracketId },
        include: {
          rounds: {
            include: {
              matchups: true
            }
          }
        }
      });

      if (bracket?.status === 'COMPLETED') {
        // Award trophies and calculate final awards
        await ChampionshipManager.finalizeChampionship(bracket.id);
      }

      return { success: true };
    }),

  // Get consolation bracket
  getConsolationBracket: protectedProcedure
    .input(z.object({
      leagueId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const consolation = await prisma.consolationBracket.findUnique({
        where: { leagueId: input.leagueId }
      });

      if (!consolation) {
        return null;
      }

      // Parse bracket data and get team details
      const bracketData = JSON.parse(consolation.bracketData);
      
      return {
        ...consolation,
        bracketData
      };
    }),

  // Get trophies
  getTrophies: protectedProcedure
    .input(z.object({
      leagueId: z.string().optional(),
      userId: z.string().optional(),
      teamId: z.string().optional(),
      season: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.leagueId) where.leagueId = input.leagueId;
      if (input.userId) where.userId = input.userId;
      if (input.teamId) where.teamId = input.teamId;
      if (input.season) where.season = input.season;

      const trophies = await prisma.trophy.findMany({
        where,
        include: {
          league: true
        },
        orderBy: { awardedAt: 'desc' }
      });

      return trophies;
    }),

  // Get awards
  getAwards: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      season: z.number().optional(),
      week: z.number().optional(),
      category: z.enum(['WEEKLY', 'SEASON', 'ACHIEVEMENT']).optional(),
      recipientId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { leagueId: input.leagueId };

      if (input.season) where.season = input.season;
      if (input.week) where.week = input.week;
      if (input.category) where.category = input.category;
      if (input.recipientId) where.recipientId = input.recipientId;

      const awards = await prisma.award.findMany({
        where,
        orderBy: { awardedAt: 'desc' }
      });

      return awards;
    }),

  // Calculate weekly awards
  calculateWeeklyAwards: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      week: z.number(),
      season: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is commissioner
      const member = await prisma.leagueMember.findFirst({
        where: {
          leagueId: input.leagueId,
          userId: ctx.session.user.id,
          role: { in: ['COMMISSIONER', 'CO_COMMISSIONER'] }
        }
      });

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only commissioners can calculate awards'
        });
      }

      await AwardsCalculator.calculateWeeklyAwards(
        input.leagueId,
        input.week,
        input.season
      );

      return { success: true };
    }),

  // Calculate season awards
  calculateSeasonAwards: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      season: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is commissioner
      const member = await prisma.leagueMember.findFirst({
        where: {
          leagueId: input.leagueId,
          userId: ctx.session.user.id,
          role: { in: ['COMMISSIONER', 'CO_COMMISSIONER'] }
        }
      });

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only commissioners can calculate awards'
        });
      }

      await AwardsCalculator.calculateSeasonAwards(input.leagueId, input.season);
      
      return { success: true };
    }),

  // Get achievements
  getAchievements: protectedProcedure
    .input(z.object({
      userId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.session.user.id;

      const achievements = await prisma.achievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' }
      });

      return achievements;
    }),

  // Get season archive
  getSeasonArchive: protectedProcedure
    .input(z.object({
      leagueId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const summaries = await prisma.seasonSummary.findMany({
        where: { leagueId: input.leagueId },
        orderBy: { season: 'desc' }
      });

      // Parse JSON fields and get team details
      const enhancedSummaries = await Promise.all(
        summaries.map(async (summary) => {
          const teams = await prisma.team.findMany({
            where: {
              id: {
                in: [
                  summary.championId,
                  summary.runnerUpId,
                  summary.thirdPlaceId,
                  summary.sackoId
                ].filter(Boolean) as string[]
              }
            },
            include: { owner: true }
          });

          const teamMap = new Map(teams.map(t => [t.id, t]));

          return {
            ...summary,
            standings: JSON.parse(summary.standings),
            statistics: JSON.parse(summary.statistics),
            highlights: JSON.parse(summary.highlights),
            draftRecap: summary.draftRecap ? JSON.parse(summary.draftRecap) : null,
            tradeRecap: summary.tradeRecap ? JSON.parse(summary.tradeRecap) : null,
            champion: teamMap.get(summary.championId),
            runnerUp: teamMap.get(summary.runnerUpId),
            thirdPlace: summary.thirdPlaceId ? teamMap.get(summary.thirdPlaceId) : null,
            sacko: summary.sackoId ? teamMap.get(summary.sackoId) : null
          };
        })
      );

      return enhancedSummaries;
    }),

  // Get record book
  getRecordBook: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      category: z.enum(['SINGLE_GAME', 'SEASON', 'ALL_TIME', 'PLAYOFFS']).optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { leagueId: input.leagueId };
      
      if (input.category) {
        where.category = input.category;
      }

      const records = await prisma.seasonRecord.findMany({
        where,
        orderBy: { value: 'desc' }
      });

      // Get team/user details for record holders
      const teamIds = new Set<string>();
      const userIds = new Set<string>();

      records.forEach(record => {
        if (record.holderType === 'TEAM') {
          teamIds.add(record.holderId);
        } else {
          userIds.add(record.holderId);
        }
      });

      const teams = await prisma.team.findMany({
        where: { id: { in: Array.from(teamIds) } }
      });

      const users = await prisma.user.findMany({
        where: { id: { in: Array.from(userIds) } }
      });

      const teamMap = new Map(teams.map(t => [t.id, t.name]));
      const userMap = new Map(users.map(u => [u.id, u.name || u.username]));

      const enhancedRecords = records.map(record => ({
        ...record,
        holderName: record.holderType === 'TEAM' 
          ? teamMap.get(record.holderId) || 'Unknown Team'
          : userMap.get(record.holderId) || 'Unknown User'
      }));

      return enhancedRecords;
    }),

  // Get head-to-head records
  getHeadToHeadRecords: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      teamId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { leagueId: input.leagueId };

      if (input.teamId) {
        where.OR = [
          { team1Id: input.teamId },
          { team2Id: input.teamId }
        ];
      }

      const h2hRecords = await prisma.headToHeadRecord.findMany({
        where
      });

      // Get team details
      const teamIds = new Set<string>();
      h2hRecords.forEach(record => {
        teamIds.add(record.team1Id);
        teamIds.add(record.team2Id);
      });

      const teams = await prisma.team.findMany({
        where: { id: { in: Array.from(teamIds) } }
      });

      const teamMap = new Map(teams.map(t => [t.id, t.name]));

      const enhancedRecords = h2hRecords.map(record => ({
        ...record,
        team1Name: teamMap.get(record.team1Id) || 'Unknown Team',
        team2Name: teamMap.get(record.team2Id) || 'Unknown Team'
      }));

      return enhancedRecords;
    })
});