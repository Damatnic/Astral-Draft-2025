/**
 * Waiver Wire System Router
 * Complete FAAB-based waiver wire management with blind bidding
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { prisma } from '../../db';
import { cache } from '../../redis';
import { processWaiverClaims } from '../../queue/jobs/waivers';
import { addJob } from '../../queue';

// Types
export type WaiverType = 'FAAB' | 'ROLLING' | 'REVERSE_STANDINGS' | 'CONTINUAL';
export type WaiverStatus = 'PENDING' | 'PROCESSING' | 'EXECUTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

interface WaiverClaim {
  id: string;
  teamId: string;
  leagueId: string;
  playerId: string;
  dropPlayerId?: string;
  faabAmount: number;
  priority: number;
  status: WaiverStatus;
  processDate: Date;
  createdAt: Date;
  player: {
    id: string;
    displayName: string;
    position: string;
    nflTeam: string;
    status: string;
  };
  dropPlayer?: {
    id: string;
    displayName: string;
    position: string;
    nflTeam: string;
  };
  team: {
    id: string;
    name: string;
    logo?: string;
  };
}

interface WaiverSettings {
  waiverType: WaiverType;
  waiverBudget: number;
  waiverPeriod: number; // days
  processSchedule: string; // cron expression or time
  allowZeroDollarBids: boolean;
  continualWaivers: boolean;
  resetPriority: 'weekly' | 'never' | 'afterClaim';
  tiebreaker: 'priority' | 'recordInverse' | 'random';
}

interface TeamWaiverInfo {
  teamId: string;
  remainingBudget: number;
  waiverPriority: number;
  activeClaims: number;
  successfulClaims: number;
  totalSpent: number;
}

export const waiverRouter = createTRPCRouter({
  /**
   * Submit a waiver claim
   */
  submitClaim: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      teamId: z.string(),
      playerId: z.string(),
      dropPlayerId: z.string().optional(),
      faabAmount: z.number().min(0),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the team
      const team = await prisma.team.findFirst({
        where: {
          id: input.teamId,
          leagueId: input.leagueId,
          ownerId: ctx.session.user.id,
        },
        include: {
          league: true,
        },
      });

      if (!team) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not own this team',
        });
      }

      // Get league waiver settings
      const league = team.league;
      const waiverSettings = {
        waiverType: league.waiverType as WaiverType,
        waiverBudget: league.waiverBudget,
        waiverPeriod: league.waiverPeriod,
      };

      // Check if FAAB system is enabled
      if (waiverSettings.waiverType === 'FAAB') {
        // Calculate remaining budget
        const spentBudget = await prisma.transaction.aggregate({
          where: {
            teamId: input.teamId,
            type: 'WAIVER_CLAIM',
            status: 'EXECUTED',
            createdAt: {
              gte: new Date(league.season, 0, 1),
            },
          },
          _sum: {
            faabAmount: true,
          },
        });

        const remainingBudget = waiverSettings.waiverBudget - (spentBudget._sum.faabAmount || 0);

        if (input.faabAmount > remainingBudget) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Insufficient FAAB budget. You have $${remainingBudget} remaining.`,
          });
        }

        // Check for $0 bids if not allowed
        const allowZeroDollarBids = league.scoringRules ? 
          JSON.parse(league.scoringRules).allowZeroDollarBids !== false : true;
        
        if (!allowZeroDollarBids && input.faabAmount === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '$0 bids are not allowed in this league',
          });
        }
      }

      // Verify player is available
      const playerRoster = await prisma.roster.findFirst({
        where: {
          playerId: input.playerId,
          team: {
            leagueId: input.leagueId,
          },
          week: league.currentWeek,
          season: league.season,
        },
      });

      if (playerRoster) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Player is already on a roster',
        });
      }

      // Get player details
      const player = await prisma.player.findUnique({
        where: { id: input.playerId },
      });

      if (!player) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Player not found',
        });
      }

      // Check for existing claim on same player
      const existingClaim = await prisma.transaction.findFirst({
        where: {
          teamId: input.teamId,
          type: 'WAIVER_CLAIM',
          status: 'PENDING',
          details: {
            contains: input.playerId,
          },
        },
      });

      if (existingClaim) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You already have a pending claim for this player',
        });
      }

      // Verify drop player if specified
      let dropPlayer = null;
      if (input.dropPlayerId) {
        const rosterSpot = await prisma.roster.findFirst({
          where: {
            teamId: input.teamId,
            playerId: input.dropPlayerId,
            week: league.currentWeek,
            season: league.season,
          },
          include: {
            player: true,
          },
        });

        if (!rosterSpot) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Drop player is not on your roster',
          });
        }

        dropPlayer = rosterSpot.player;
      }

      // Calculate process date (next waiver processing period)
      const processDate = new Date();
      processDate.setDate(processDate.getDate() + waiverSettings.waiverPeriod);
      processDate.setHours(3, 0, 0, 0); // Default 3 AM processing

      // Get current waiver priority
      const waiverPriority = await getTeamWaiverPriority(input.teamId, input.leagueId);

      // Create the waiver claim
      const claim = await prisma.transaction.create({
        data: {
          leagueId: input.leagueId,
          teamId: input.teamId,
          userId: ctx.session.user.id,
          type: 'WAIVER_CLAIM',
          status: 'PENDING',
          details: JSON.stringify({
            playerId: input.playerId,
            playerName: player.displayName,
            dropPlayerId: input.dropPlayerId,
            dropPlayerName: dropPlayer?.displayName,
            notes: input.notes,
          }),
          faabAmount: waiverSettings.waiverType === 'FAAB' ? input.faabAmount : null,
          waiverPriority,
          processDate,
        },
      });

      // Clear cache
      await cache.del(`league:${input.leagueId}:waivers`);
      await cache.del(`team:${input.teamId}:waivers`);

      // Create notification
      await prisma.notification.create({
        data: {
          userId: ctx.session.user.id,
          type: 'WAIVER_SUBMITTED',
          title: 'Waiver Claim Submitted',
          content: `Your waiver claim for ${player.displayName}${
            waiverSettings.waiverType === 'FAAB' ? ` ($${input.faabAmount})` : ''
          } has been submitted`,
          data: JSON.stringify({
            claimId: claim.id,
            playerId: input.playerId,
            teamId: input.teamId,
          }),
        },
      });

      return {
        success: true,
        claimId: claim.id,
        processDate,
      };
    }),

  /**
   * Cancel a pending waiver claim
   */
  cancelClaim: protectedProcedure
    .input(z.object({
      claimId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const claim = await prisma.transaction.findUnique({
        where: { id: input.claimId },
        include: {
          team: true,
        },
      });

      if (!claim) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Waiver claim not found',
        });
      }

      if (claim.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only cancel your own claims',
        });
      }

      if (claim.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending claims can be cancelled',
        });
      }

      // Update claim status
      await prisma.transaction.update({
        where: { id: input.claimId },
        data: {
          status: 'CANCELLED',
          executedAt: new Date(),
        },
      });

      // Clear cache
      await cache.del(`league:${claim.leagueId}:waivers`);
      await cache.del(`team:${claim.teamId}:waivers`);

      return {
        success: true,
        message: 'Waiver claim cancelled successfully',
      };
    }),

  /**
   * Get user's waiver claims
   */
  getMyWaiverClaims: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      teamId: z.string().optional(),
      status: z.enum(['PENDING', 'EXECUTED', 'REJECTED', 'CANCELLED', 'ALL']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const cacheKey = `user:${ctx.session.user.id}:league:${input.leagueId}:waivers`;
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const where: any = {
        userId: ctx.session.user.id,
        leagueId: input.leagueId,
        type: 'WAIVER_CLAIM',
      };

      if (input.teamId) {
        where.teamId = input.teamId;
      }

      if (input.status && input.status !== 'ALL') {
        where.status = input.status;
      }

      const claims = await prisma.transaction.findMany({
        where,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Parse details and fetch player info
      const enrichedClaims = await Promise.all(
        claims.map(async (claim) => {
          const details = JSON.parse(claim.details);
          
          const player = await prisma.player.findUnique({
            where: { id: details.playerId },
            select: {
              id: true,
              displayName: true,
              position: true,
              nflTeam: true,
              status: true,
            },
          });

          let dropPlayer = null;
          if (details.dropPlayerId) {
            dropPlayer = await prisma.player.findUnique({
              where: { id: details.dropPlayerId },
              select: {
                id: true,
                displayName: true,
                position: true,
                nflTeam: true,
              },
            });
          }

          return {
            id: claim.id,
            teamId: claim.teamId,
            leagueId: claim.leagueId,
            playerId: details.playerId,
            dropPlayerId: details.dropPlayerId,
            faabAmount: claim.faabAmount || 0,
            priority: claim.waiverPriority || 0,
            status: claim.status as WaiverStatus,
            processDate: claim.processDate!,
            createdAt: claim.createdAt,
            executedAt: claim.executedAt,
            player,
            dropPlayer,
            team: claim.team,
            notes: details.notes,
          };
        })
      );

      await cache.setex(cacheKey, 300, JSON.stringify(enrichedClaims));
      return enrichedClaims;
    }),

  /**
   * Get league waiver order/priority
   */
  getLeagueWaiverOrder: publicProcedure
    .input(z.object({
      leagueId: z.string(),
    }))
    .query(async ({ input }) => {
      const cacheKey = `league:${input.leagueId}:waiver-order`;
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const league = await prisma.league.findUnique({
        where: { id: input.leagueId },
        include: {
          teams: {
            include: {
              owner: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              standing: 'desc', // Worst teams get better priority
            },
          },
        },
      });

      if (!league) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'League not found',
        });
      }

      const waiverType = league.waiverType as WaiverType;

      // Calculate waiver order based on type
      const waiverOrder = await Promise.all(
        league.teams.map(async (team, index) => {
          let priority = index + 1;
          
          if (waiverType === 'REVERSE_STANDINGS') {
            // Worst record gets priority 1
            priority = index + 1;
          } else if (waiverType === 'CONTINUAL') {
            // Check last successful claim
            const lastClaim = await prisma.transaction.findFirst({
              where: {
                teamId: team.id,
                type: 'WAIVER_CLAIM',
                status: 'EXECUTED',
              },
              orderBy: {
                executedAt: 'desc',
              },
            });

            if (lastClaim) {
              // Move to back of line after successful claim
              priority = league.teams.length;
            }
          }

          // Get FAAB info if applicable
          let remainingBudget = league.waiverBudget;
          let totalSpent = 0;
          
          if (waiverType === 'FAAB') {
            const spent = await prisma.transaction.aggregate({
              where: {
                teamId: team.id,
                type: 'WAIVER_CLAIM',
                status: 'EXECUTED',
                createdAt: {
                  gte: new Date(league.season, 0, 1),
                },
              },
              _sum: {
                faabAmount: true,
              },
            });
            
            totalSpent = spent._sum.faabAmount || 0;
            remainingBudget = league.waiverBudget - totalSpent;
          }

          // Count active claims
          const activeClaims = await prisma.transaction.count({
            where: {
              teamId: team.id,
              type: 'WAIVER_CLAIM',
              status: 'PENDING',
            },
          });

          // Count successful claims this season
          const successfulClaims = await prisma.transaction.count({
            where: {
              teamId: team.id,
              type: 'WAIVER_CLAIM',
              status: 'EXECUTED',
              createdAt: {
                gte: new Date(league.season, 0, 1),
              },
            },
          });

          return {
            teamId: team.id,
            teamName: team.name,
            teamLogo: team.logo,
            owner: team.owner,
            record: {
              wins: team.wins,
              losses: team.losses,
              ties: team.ties,
            },
            standing: team.standing,
            waiverPriority: priority,
            remainingBudget: waiverType === 'FAAB' ? remainingBudget : null,
            totalSpent: waiverType === 'FAAB' ? totalSpent : null,
            activeClaims,
            successfulClaims,
          };
        })
      );

      // Sort by priority
      waiverOrder.sort((a, b) => a.waiverPriority - b.waiverPriority);

      const result = {
        leagueId: input.leagueId,
        waiverType,
        waiverBudget: league.waiverBudget,
        waiverPeriod: league.waiverPeriod,
        teams: waiverOrder,
      };

      await cache.setex(cacheKey, 600, JSON.stringify(result));
      return result;
    }),

  /**
   * Get available players (free agents and waiver wire)
   */
  getAvailablePlayers: publicProcedure
    .input(z.object({
      leagueId: z.string(),
      position: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      sortBy: z.enum(['rank', 'projectedPoints', 'recentPoints', 'owned']).default('rank'),
      includeWaiverInfo: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      const league = await prisma.league.findUnique({
        where: { id: input.leagueId },
        select: {
          id: true,
          currentWeek: true,
          season: true,
          waiverPeriod: true,
        },
      });

      if (!league) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'League not found',
        });
      }

      // Get all rostered players in the league
      const rosteredPlayers = await prisma.roster.findMany({
        where: {
          team: {
            leagueId: input.leagueId,
          },
          week: league.currentWeek,
          season: league.season,
        },
        select: {
          playerId: true,
        },
      });

      const rosteredPlayerIds = new Set(rosteredPlayers.map(r => r.playerId));

      // Build query for available players
      const where: any = {
        id: {
          notIn: Array.from(rosteredPlayerIds),
        },
        status: {
          notIn: ['RETIRED', 'INACTIVE'],
        },
      };

      if (input.position) {
        where.position = input.position;
      }

      if (input.search) {
        where.displayName = {
          contains: input.search,
          mode: 'insensitive',
        };
      }

      // Get available players with stats and projections
      const players = await prisma.player.findMany({
        where,
        include: {
          stats: {
            where: {
              season: league.season,
              week: {
                gte: Math.max(1, league.currentWeek - 3), // Last 3 weeks
              },
            },
            orderBy: {
              week: 'desc',
            },
            take: 3,
          },
          projections: {
            where: {
              season: league.season,
              week: league.currentWeek,
            },
            take: 1,
          },
        },
        orderBy: input.sortBy === 'rank' ? { rank: 'asc' } :
                 input.sortBy === 'projectedPoints' ? { projectedPoints: 'desc' } :
                 { rank: 'asc' },
        take: input.limit,
        skip: input.offset,
      });

      // Enrich with waiver info if requested
      const enrichedPlayers = await Promise.all(
        players.map(async (player) => {
          // Calculate recent points average
          const recentPoints = player.stats.length > 0
            ? player.stats.reduce((sum, stat) => sum + stat.fantasyPoints, 0) / player.stats.length
            : 0;

          // Check if player is on waivers (recently dropped)
          const lastDrop = await prisma.transaction.findFirst({
            where: {
              type: 'DROP',
              status: 'EXECUTED',
              details: {
                contains: player.id,
              },
              leagueId: input.leagueId,
            },
            orderBy: {
              executedAt: 'desc',
            },
          });

          const onWaivers = lastDrop && 
            lastDrop.executedAt && 
            (new Date().getTime() - lastDrop.executedAt.getTime()) < (league.waiverPeriod * 24 * 60 * 60 * 1000);

          const waiverClearDate = onWaivers && lastDrop.executedAt
            ? new Date(lastDrop.executedAt.getTime() + (league.waiverPeriod * 24 * 60 * 60 * 1000))
            : null;

          // Get claim count for this player
          const claimCount = input.includeWaiverInfo ? await prisma.transaction.count({
            where: {
              type: 'WAIVER_CLAIM',
              status: 'PENDING',
              details: {
                contains: player.id,
              },
              leagueId: input.leagueId,
            },
          }) : 0;

          return {
            id: player.id,
            displayName: player.displayName,
            firstName: player.firstName,
            lastName: player.lastName,
            position: player.position,
            nflTeam: player.nflTeam,
            jerseyNumber: player.jerseyNumber,
            status: player.status,
            injuryStatus: player.injuryStatus,
            injuryNotes: player.injuryNotes,
            headshotUrl: player.headshotUrl,
            rank: player.rank,
            adp: player.adp,
            projectedPoints: player.projections[0]?.projectedPoints || player.projectedPoints || 0,
            recentPoints,
            recentStats: player.stats,
            onWaivers,
            waiverClearDate,
            claimCount,
          };
        })
      );

      return {
        players: enrichedPlayers,
        hasMore: enrichedPlayers.length === input.limit,
        total: await prisma.player.count({ where }),
      };
    }),

  /**
   * Process all pending waivers (admin/cron job)
   */
  processWaivers: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      force: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is league commissioner or admin
      const member = await prisma.leagueMember.findFirst({
        where: {
          leagueId: input.leagueId,
          userId: ctx.session.user.id,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
      const isCommissioner = member?.role === 'COMMISSIONER' || member?.role === 'CO_COMMISSIONER';

      if (!isAdmin && !isCommissioner && !input.force) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only commissioners can manually process waivers',
        });
      }

      // Add job to queue for processing
      const job = await addJob('processWaiverClaims', {
        leagueId: input.leagueId,
      });

      return {
        success: true,
        jobId: job.id,
        message: 'Waiver processing has been initiated',
      };
    }),

  /**
   * Get team's waiver information
   */
  getTeamWaiverInfo: publicProcedure
    .input(z.object({
      teamId: z.string(),
      leagueId: z.string(),
    }))
    .query(async ({ input }) => {
      const team = await prisma.team.findFirst({
        where: {
          id: input.teamId,
          leagueId: input.leagueId,
        },
        include: {
          league: true,
        },
      });

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        });
      }

      const league = team.league;
      const waiverType = league.waiverType as WaiverType;

      // Calculate remaining budget for FAAB
      let remainingBudget = league.waiverBudget;
      let totalSpent = 0;
      
      if (waiverType === 'FAAB') {
        const spent = await prisma.transaction.aggregate({
          where: {
            teamId: input.teamId,
            type: 'WAIVER_CLAIM',
            status: 'EXECUTED',
            createdAt: {
              gte: new Date(league.season, 0, 1),
            },
          },
          _sum: {
            faabAmount: true,
          },
        });
        
        totalSpent = spent._sum.faabAmount || 0;
        remainingBudget = league.waiverBudget - totalSpent;
      }

      // Get waiver priority
      const waiverPriority = await getTeamWaiverPriority(input.teamId, input.leagueId);

      // Count claims
      const activeClaims = await prisma.transaction.count({
        where: {
          teamId: input.teamId,
          type: 'WAIVER_CLAIM',
          status: 'PENDING',
        },
      });

      const successfulClaims = await prisma.transaction.count({
        where: {
          teamId: input.teamId,
          type: 'WAIVER_CLAIM',
          status: 'EXECUTED',
          createdAt: {
            gte: new Date(league.season, 0, 1),
          },
        },
      });

      return {
        teamId: input.teamId,
        waiverType,
        remainingBudget: waiverType === 'FAAB' ? remainingBudget : null,
        totalBudget: waiverType === 'FAAB' ? league.waiverBudget : null,
        totalSpent: waiverType === 'FAAB' ? totalSpent : null,
        waiverPriority,
        activeClaims,
        successfulClaims,
        waiverPeriod: league.waiverPeriod,
        nextProcessingDate: getNextWaiverProcessingDate(league.waiverPeriod),
      };
    }),

  /**
   * Update league waiver settings (commissioner only)
   */
  updateWaiverSettings: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      waiverType: z.enum(['FAAB', 'ROLLING', 'REVERSE_STANDINGS', 'CONTINUAL']),
      waiverBudget: z.number().min(0).optional(),
      waiverPeriod: z.number().min(0).max(7).optional(),
      processSchedule: z.string().optional(),
      allowZeroDollarBids: z.boolean().optional(),
      continualWaivers: z.boolean().optional(),
      resetPriority: z.enum(['weekly', 'never', 'afterClaim']).optional(),
      tiebreaker: z.enum(['priority', 'recordInverse', 'random']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is commissioner
      const member = await prisma.leagueMember.findFirst({
        where: {
          leagueId: input.leagueId,
          userId: ctx.session.user.id,
          role: {
            in: ['COMMISSIONER', 'CO_COMMISSIONER'],
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only commissioners can update waiver settings',
        });
      }

      // Get current league settings
      const league = await prisma.league.findUnique({
        where: { id: input.leagueId },
      });

      if (!league) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'League not found',
        });
      }

      // Parse existing scoring rules
      const scoringRules = league.scoringRules ? JSON.parse(league.scoringRules) : {};

      // Update waiver-specific settings in scoring rules
      if (input.allowZeroDollarBids !== undefined) {
        scoringRules.allowZeroDollarBids = input.allowZeroDollarBids;
      }
      if (input.continualWaivers !== undefined) {
        scoringRules.continualWaivers = input.continualWaivers;
      }
      if (input.resetPriority !== undefined) {
        scoringRules.resetPriority = input.resetPriority;
      }
      if (input.tiebreaker !== undefined) {
        scoringRules.tiebreaker = input.tiebreaker;
      }
      if (input.processSchedule !== undefined) {
        scoringRules.processSchedule = input.processSchedule;
      }

      // Update league
      const updatedLeague = await prisma.league.update({
        where: { id: input.leagueId },
        data: {
          waiverType: input.waiverType || league.waiverType,
          waiverBudget: input.waiverBudget ?? league.waiverBudget,
          waiverPeriod: input.waiverPeriod ?? league.waiverPeriod,
          scoringRules: JSON.stringify(scoringRules),
        },
      });

      // Clear cache
      await cache.flush(`league:${input.leagueId}:*`);

      // Create notification for all league members
      const members = await prisma.leagueMember.findMany({
        where: { leagueId: input.leagueId },
      });

      await Promise.all(
        members.map(member =>
          prisma.notification.create({
            data: {
              userId: member.userId,
              type: 'SETTINGS_CHANGED',
              title: 'Waiver Settings Updated',
              content: 'The commissioner has updated the league waiver settings',
              data: JSON.stringify({
                leagueId: input.leagueId,
                changes: input,
              }),
            },
          })
        )
      );

      return {
        success: true,
        message: 'Waiver settings updated successfully',
        settings: {
          waiverType: updatedLeague.waiverType,
          waiverBudget: updatedLeague.waiverBudget,
          waiverPeriod: updatedLeague.waiverPeriod,
          ...scoringRules,
        },
      };
    }),

  /**
   * Get waiver wire analytics
   */
  getWaiverAnalytics: publicProcedure
    .input(z.object({
      leagueId: z.string(),
      timeframe: z.enum(['week', 'month', 'season']).default('season'),
    }))
    .query(async ({ input }) => {
      const league = await prisma.league.findUnique({
        where: { id: input.leagueId },
        select: {
          season: true,
          currentWeek: true,
        },
      });

      if (!league) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'League not found',
        });
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date(league.season, 0, 1);
      
      if (input.timeframe === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (input.timeframe === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get all waiver transactions
      const waiverTransactions = await prisma.transaction.findMany({
        where: {
          leagueId: input.leagueId,
          type: 'WAIVER_CLAIM',
          status: 'EXECUTED',
          executedAt: {
            gte: startDate,
          },
        },
        include: {
          team: true,
        },
      });

      // Calculate analytics
      const totalClaims = waiverTransactions.length;
      const totalFAABSpent = waiverTransactions.reduce((sum, t) => sum + (t.faabAmount || 0), 0);
      const averageBid = totalClaims > 0 ? totalFAABSpent / totalClaims : 0;

      // Most active teams
      const teamActivity = new Map<string, { team: any; claims: number; spent: number }>();
      
      for (const transaction of waiverTransactions) {
        const existing = teamActivity.get(transaction.teamId) || {
          team: transaction.team,
          claims: 0,
          spent: 0,
        };
        
        existing.claims++;
        existing.spent += transaction.faabAmount || 0;
        teamActivity.set(transaction.teamId, existing);
      }

      const mostActiveTeams = Array.from(teamActivity.values())
        .sort((a, b) => b.claims - a.claims)
        .slice(0, 5);

      // Most claimed players
      const playerClaims = new Map<string, { playerId: string; playerName: string; claims: number; totalBid: number }>();
      
      for (const transaction of waiverTransactions) {
        const details = JSON.parse(transaction.details);
        const existing = playerClaims.get(details.playerId) || {
          playerId: details.playerId,
          playerName: details.playerName,
          claims: 0,
          totalBid: 0,
        };
        
        existing.claims++;
        existing.totalBid += transaction.faabAmount || 0;
        playerClaims.set(details.playerId, existing);
      }

      const hotPlayers = Array.from(playerClaims.values())
        .sort((a, b) => b.claims - a.claims)
        .slice(0, 10);

      // Highest bids
      const highestBids = waiverTransactions
        .filter(t => t.faabAmount && t.faabAmount > 0)
        .sort((a, b) => (b.faabAmount || 0) - (a.faabAmount || 0))
        .slice(0, 5)
        .map(t => {
          const details = JSON.parse(t.details);
          return {
            teamName: t.team.name,
            playerName: details.playerName,
            amount: t.faabAmount,
            date: t.executedAt,
          };
        });

      return {
        timeframe: input.timeframe,
        totalClaims,
        totalFAABSpent,
        averageBid,
        mostActiveTeams,
        hotPlayers,
        highestBids,
      };
    }),
});

// Helper function to get team's waiver priority
async function getTeamWaiverPriority(teamId: string, leagueId: string): Promise<number> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      teams: {
        orderBy: [
          { losses: 'desc' },
          { wins: 'asc' },
          { pointsFor: 'asc' },
        ],
      },
    },
  });

  if (!league) return 999;

  const waiverType = league.waiverType as WaiverType;
  
  if (waiverType === 'REVERSE_STANDINGS') {
    // Worst teams get better priority
    const teamIndex = league.teams.findIndex(t => t.id === teamId);
    return teamIndex + 1;
  } else if (waiverType === 'CONTINUAL') {
    // Check last successful claim
    const lastClaim = await prisma.transaction.findFirst({
      where: {
        teamId,
        type: 'WAIVER_CLAIM',
        status: 'EXECUTED',
      },
      orderBy: {
        executedAt: 'desc',
      },
    });

    if (lastClaim) {
      // Move to back after successful claim
      return league.teams.length;
    }
    
    // Otherwise use standing-based priority
    const teamIndex = league.teams.findIndex(t => t.id === teamId);
    return teamIndex + 1;
  }

  // Default rolling priority
  const teamIndex = league.teams.findIndex(t => t.id === teamId);
  return teamIndex + 1;
}

// Helper function to get next waiver processing date
function getNextWaiverProcessingDate(waiverPeriod: number): Date {
  const now = new Date();
  const nextDate = new Date();
  
  // Default processing at 3 AM
  nextDate.setDate(nextDate.getDate() + waiverPeriod);
  nextDate.setHours(3, 0, 0, 0);
  
  // If it's already past that time, add another period
  if (nextDate.getTime() <= now.getTime()) {
    nextDate.setDate(nextDate.getDate() + waiverPeriod);
  }
  
  return nextDate;
}