/**
 * Trade router - Complete trade system implementation
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

// Validation schemas
const TradeAssetsSchema = z.object({
  playerIds: z.array(z.string()),
  draftPicks: z.array(z.object({
    round: z.number().min(1),
    year: z.number(),
    originalOwner: z.string().optional()
  }))
});

const ProposeTradeMutationSchema = z.object({
  leagueId: z.string(),
  partnerId: z.string(), // Team ID of trade partner
  initiatorGives: TradeAssetsSchema,
  initiatorReceives: TradeAssetsSchema,
  tradeNote: z.string().optional(),
  expirationDays: z.number().min(1).max(7).default(3)
});

export const tradeRouter = createTRPCRouter({
  // ==================== QUERIES ====================
  
  /**
   * Get all trades for the current user across all their teams
   */
  getMyTrades: protectedProcedure
    .input(z.object({
      leagueId: z.string().optional(),
      status: z.enum(['PROPOSED', 'ACCEPTED', 'REJECTED', 'VETOED', 'EXECUTED', 'CANCELLED', 'EXPIRED', 'COUNTERED']).optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.TradeWhereInput = {
        OR: [
          { initiatorUserId: ctx.session.user.id },
          { partner: { ownerId: ctx.session.user.id } }
        ]
      };

      if (input.leagueId) {
        where.leagueId = input.leagueId;
      }

      if (input.status) {
        where.status = input.status;
      }

      const trades = await ctx.prisma.trade.findMany({
        where,
        include: {
          initiator: {
            include: { owner: true }
          },
          partner: {
            include: { owner: true }
          },
          league: true,
          votes: {
            include: {
              user: true,
              team: true
            }
          }
        },
        orderBy: { proposedAt: 'desc' }
      });

      // Parse JSON strings and add computed fields
      return trades.map(trade => ({
        ...trade,
        initiatorGives: JSON.parse(trade.initiatorGives),
        initiatorReceives: JSON.parse(trade.initiatorReceives),
        isInitiator: trade.initiatorUserId === ctx.session.user.id,
        canRespond: trade.partner.ownerId === ctx.session.user.id && trade.status === 'PROPOSED',
        votesNeeded: trade.league.tradeVotesNeeded,
        hasVoted: trade.votes.some(v => v.userId === ctx.session.user.id)
      }));
    }),

  /**
   * Get detailed information about a specific trade
   */
  getTradeDetails: protectedProcedure
    .input(z.object({
      tradeId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const trade = await ctx.prisma.trade.findUnique({
        where: { id: input.tradeId },
        include: {
          initiator: {
            include: {
              owner: true,
              roster: {
                where: {
                  season: new Date().getFullYear()
                },
                include: {
                  player: true
                }
              }
            }
          },
          partner: {
            include: {
              owner: true,
              roster: {
                where: {
                  season: new Date().getFullYear()
                },
                include: {
                  player: true
                }
              }
            }
          },
          league: {
            include: {
              members: {
                include: { user: true }
              }
            }
          },
          votes: {
            include: {
              user: true,
              team: true
            }
          }
        }
      });

      if (!trade) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Trade not found'
        });
      }

      // Verify user has access to view this trade
      const isMember = trade.league.members.some(m => m.userId === ctx.session.user.id);
      if (!isMember) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to view this trade'
        });
      }

      // Parse trade assets
      const initiatorGives = JSON.parse(trade.initiatorGives) as z.infer<typeof TradeAssetsSchema>;
      const initiatorReceives = JSON.parse(trade.initiatorReceives) as z.infer<typeof TradeAssetsSchema>;

      // Fetch player details for the trade
      const allPlayerIds = [...initiatorGives.playerIds, ...initiatorReceives.playerIds];
      const players = await ctx.prisma.player.findMany({
        where: { id: { in: allPlayerIds } },
        include: {
          stats: {
            where: { season: new Date().getFullYear() },
            orderBy: { week: 'desc' },
            take: 5
          },
          projections: {
            where: {
              week: { gte: trade.league.currentWeek },
              season: new Date().getFullYear()
            }
          }
        }
      });

      return {
        ...trade,
        initiatorGives: {
          ...initiatorGives,
          players: players.filter(p => initiatorGives.playerIds.includes(p.id))
        },
        initiatorReceives: {
          ...initiatorReceives,
          players: players.filter(p => initiatorReceives.playerIds.includes(p.id))
        },
        isInitiator: trade.initiatorUserId === ctx.session.user.id,
        isPartner: trade.partner.ownerId === ctx.session.user.id,
        canVote: isMember && 
                 !trade.votes.some(v => v.userId === ctx.session.user.id) &&
                 trade.status === 'PROPOSED' &&
                 trade.initiatorUserId !== ctx.session.user.id &&
                 trade.partner.ownerId !== ctx.session.user.id,
        vetoProgress: trade.league.tradeVotesNeeded ? 
                      (trade.vetoVotes / trade.league.tradeVotesNeeded) * 100 : 0
      };
    }),

  /**
   * Get all trades in a league (for voting/review)
   */
  getLeagueTrades: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      includeHistory: z.boolean().default(false),
      limit: z.number().min(1).max(100).default(20)
    }))
    .query(async ({ ctx, input }) => {
      // Verify user is member of the league
      const membership = await ctx.prisma.leagueMember.findUnique({
        where: {
          userId_leagueId: {
            userId: ctx.session.user.id,
            leagueId: input.leagueId
          }
        }
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this league'
        });
      }

      const statusFilter = input.includeHistory 
        ? undefined 
        : { in: ['PROPOSED', 'ACCEPTED'] };

      const trades = await ctx.prisma.trade.findMany({
        where: {
          leagueId: input.leagueId,
          ...(statusFilter && { status: statusFilter })
        },
        include: {
          initiator: {
            include: { owner: true }
          },
          partner: {
            include: { owner: true }
          },
          votes: {
            where: { userId: ctx.session.user.id }
          },
          _count: {
            select: { votes: true }
          }
        },
        orderBy: { proposedAt: 'desc' },
        take: input.limit
      });

      return trades.map(trade => ({
        ...trade,
        initiatorGives: JSON.parse(trade.initiatorGives),
        initiatorReceives: JSON.parse(trade.initiatorReceives),
        hasVoted: trade.votes.length > 0,
        totalVotes: trade._count.votes,
        isInvolved: trade.initiatorUserId === ctx.session.user.id || 
                   trade.partner.ownerId === ctx.session.user.id
      }));
    }),

  // ==================== MUTATIONS ====================

  /**
   * Propose a new trade
   */
  proposeTrade: protectedProcedure
    .input(ProposeTradeMutationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        // Get user's team in the league
        const initiatorTeam = await tx.team.findFirst({
          where: {
            leagueId: input.leagueId,
            ownerId: ctx.session.user.id
          },
          include: {
            roster: {
              where: { season: new Date().getFullYear() }
            }
          }
        });

        if (!initiatorTeam) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'You do not have a team in this league'
          });
        }

        // Get partner team
        const partnerTeam = await tx.team.findUnique({
          where: { id: input.partnerId },
          include: {
            roster: {
              where: { season: new Date().getFullYear() }
            }
          }
        });

        if (!partnerTeam || partnerTeam.leagueId !== input.leagueId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Partner team not found in this league'
          });
        }

        // Get league settings
        const league = await tx.league.findUnique({
          where: { id: input.leagueId }
        });

        if (!league) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'League not found'
          });
        }

        // Check trade deadline
        if (league.tradeDeadline && new Date() > league.tradeDeadline) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Trade deadline has passed'
          });
        }

        // Validate that initiator owns the players they're giving
        const initiatorRosterPlayerIds = initiatorTeam.roster.map(r => r.playerId);
        const invalidGives = input.initiatorGives.playerIds.filter(
          id => !initiatorRosterPlayerIds.includes(id)
        );

        if (invalidGives.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You cannot trade players not on your roster'
          });
        }

        // Validate that partner owns the players initiator will receive
        const partnerRosterPlayerIds = partnerTeam.roster.map(r => r.playerId);
        const invalidReceives = input.initiatorReceives.playerIds.filter(
          id => !partnerRosterPlayerIds.includes(id)
        );

        if (invalidReceives.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Partner does not own some of the players you want to receive'
          });
        }

        // Check for duplicate players (can't trade for someone you already have)
        const duplicatePlayers = input.initiatorReceives.playerIds.filter(
          id => initiatorRosterPlayerIds.includes(id) && 
                !input.initiatorGives.playerIds.includes(id)
        );

        if (duplicatePlayers.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You already have some of the players you are trying to acquire'
          });
        }

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expirationDays);

        // Calculate review end date (if league has voting)
        let reviewEndsAt = null;
        if (league.tradeVotesNeeded && league.tradeVotesNeeded > 0) {
          reviewEndsAt = new Date();
          reviewEndsAt.setDate(reviewEndsAt.getDate() + league.tradeReviewDays);
        }

        // Create the trade
        const trade = await tx.trade.create({
          data: {
            leagueId: input.leagueId,
            initiatorId: initiatorTeam.id,
            partnerId: partnerTeam.id,
            initiatorUserId: ctx.session.user.id,
            initiatorGives: JSON.stringify(input.initiatorGives),
            initiatorReceives: JSON.stringify(input.initiatorReceives),
            tradeNote: input.tradeNote,
            expiresAt,
            reviewEndsAt,
            status: 'PROPOSED'
          },
          include: {
            initiator: {
              include: { owner: true }
            },
            partner: {
              include: { owner: true }
            }
          }
        });

        // Create notification for partner
        await tx.notification.create({
          data: {
            userId: partnerTeam.ownerId,
            type: 'TRADE',
            title: 'New Trade Proposal',
            content: `${initiatorTeam.owner.username} has proposed a trade with your team ${partnerTeam.name}`,
            data: JSON.stringify({ tradeId: trade.id })
          }
        });

        // Log transaction
        await tx.transaction.create({
          data: {
            leagueId: input.leagueId,
            teamId: initiatorTeam.id,
            userId: ctx.session.user.id,
            type: 'TRADE',
            status: 'PENDING',
            details: JSON.stringify({
              tradeId: trade.id,
              partnerId: partnerTeam.id,
              gives: input.initiatorGives,
              receives: input.initiatorReceives
            })
          }
        });

        return trade;
      });
    }),

  /**
   * Accept a trade proposal
   */
  acceptTrade: protectedProcedure
    .input(z.object({
      tradeId: z.string(),
      acceptNote: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const trade = await tx.trade.findUnique({
          where: { id: input.tradeId },
          include: {
            partner: true,
            initiator: true,
            league: true
          }
        });

        if (!trade) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trade not found'
          });
        }

        // Verify user is the partner
        if (trade.partner.ownerId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the trade partner can accept this trade'
          });
        }

        // Verify trade is still proposed
        if (trade.status !== 'PROPOSED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot accept trade with status: ${trade.status}`
          });
        }

        // Check if trade has expired
        if (new Date() > trade.expiresAt) {
          await tx.trade.update({
            where: { id: input.tradeId },
            data: { status: 'EXPIRED' }
          });
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This trade has expired'
          });
        }

        // Update trade status
        const updatedTrade = await tx.trade.update({
          where: { id: input.tradeId },
          data: {
            status: 'ACCEPTED',
            respondedAt: new Date()
          }
        });

        // Create notification for initiator
        await tx.notification.create({
          data: {
            userId: trade.initiatorUserId,
            type: 'TRADE',
            title: 'Trade Accepted',
            content: `Your trade with ${trade.partner.name} has been accepted!`,
            data: JSON.stringify({ tradeId: trade.id })
          }
        });

        // If league requires voting, start the review period
        if (trade.league.tradeVotesNeeded && trade.league.tradeVotesNeeded > 0) {
          // Notify all league members about the accepted trade
          const members = await tx.leagueMember.findMany({
            where: { 
              leagueId: trade.leagueId,
              userId: {
                notIn: [trade.initiatorUserId, trade.partner.ownerId]
              }
            }
          });

          await tx.notification.createMany({
            data: members.map(member => ({
              userId: member.userId,
              type: 'TRADE',
              title: 'Trade Review Period',
              content: `A trade between ${trade.initiator.name} and ${trade.partner.name} is under review`,
              data: JSON.stringify({ tradeId: trade.id })
            }))
          });
        } else {
          // No voting required, execute immediately
          await this.executeTrade(tx, trade.id);
        }

        return updatedTrade;
      });
    }),

  /**
   * Reject a trade proposal
   */
  rejectTrade: protectedProcedure
    .input(z.object({
      tradeId: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const trade = await tx.trade.findUnique({
          where: { id: input.tradeId },
          include: {
            partner: true,
            initiator: true
          }
        });

        if (!trade) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trade not found'
          });
        }

        // Verify user is the partner
        if (trade.partner.ownerId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the trade partner can reject this trade'
          });
        }

        // Verify trade is still proposed
        if (trade.status !== 'PROPOSED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot reject trade with status: ${trade.status}`
          });
        }

        // Update trade status
        const updatedTrade = await tx.trade.update({
          where: { id: input.tradeId },
          data: {
            status: 'REJECTED',
            rejectReason: input.reason,
            respondedAt: new Date()
          }
        });

        // Create notification for initiator
        await tx.notification.create({
          data: {
            userId: trade.initiatorUserId,
            type: 'TRADE',
            title: 'Trade Rejected',
            content: `Your trade with ${trade.partner.name} has been rejected${input.reason ? ': ' + input.reason : ''}`,
            data: JSON.stringify({ tradeId: trade.id })
          }
        });

        // Update transaction status
        await tx.transaction.updateMany({
          where: {
            details: {
              contains: trade.id
            }
          },
          data: {
            status: 'REJECTED'
          }
        });

        return updatedTrade;
      });
    }),

  /**
   * Counter a trade proposal with a new offer
   */
  counterTrade: protectedProcedure
    .input(z.object({
      originalTradeId: z.string(),
      counterGives: TradeAssetsSchema,
      counterReceives: TradeAssetsSchema,
      counterNote: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        // Get original trade
        const originalTrade = await tx.trade.findUnique({
          where: { id: input.originalTradeId },
          include: {
            partner: true,
            initiator: true,
            league: true
          }
        });

        if (!originalTrade) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Original trade not found'
          });
        }

        // Verify user is the partner
        if (originalTrade.partner.ownerId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the trade partner can counter this trade'
          });
        }

        // Verify trade is still proposed
        if (originalTrade.status !== 'PROPOSED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot counter trade with status: ${originalTrade.status}`
          });
        }

        // Mark original trade as countered
        await tx.trade.update({
          where: { id: input.originalTradeId },
          data: {
            status: 'COUNTERED',
            respondedAt: new Date()
          }
        });

        // Create counter trade (swap initiator and partner)
        const counterTrade = await tx.trade.create({
          data: {
            leagueId: originalTrade.leagueId,
            initiatorId: originalTrade.partnerId,
            partnerId: originalTrade.initiatorId,
            initiatorUserId: ctx.session.user.id,
            initiatorGives: JSON.stringify(input.counterGives),
            initiatorReceives: JSON.stringify(input.counterReceives),
            tradeNote: input.counterNote,
            parentTradeId: originalTrade.id,
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            status: 'PROPOSED'
          }
        });

        // Update original trade with counter reference
        await tx.trade.update({
          where: { id: input.originalTradeId },
          data: { counterTradeId: counterTrade.id }
        });

        // Create notification for original initiator
        await tx.notification.create({
          data: {
            userId: originalTrade.initiatorUserId,
            type: 'TRADE',
            title: 'Trade Counter-Offer',
            content: `${originalTrade.partner.name} has made a counter-offer to your trade proposal`,
            data: JSON.stringify({ tradeId: counterTrade.id, originalTradeId: originalTrade.id })
          }
        });

        return counterTrade;
      });
    }),

  /**
   * Cancel a trade proposal (by initiator)
   */
  cancelTrade: protectedProcedure
    .input(z.object({
      tradeId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const trade = await tx.trade.findUnique({
          where: { id: input.tradeId },
          include: {
            partner: true,
            initiator: true
          }
        });

        if (!trade) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trade not found'
          });
        }

        // Verify user is the initiator
        if (trade.initiatorUserId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the trade initiator can cancel this trade'
          });
        }

        // Verify trade can be cancelled
        if (!['PROPOSED', 'ACCEPTED'].includes(trade.status)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot cancel trade with status: ${trade.status}`
          });
        }

        // Update trade status
        const updatedTrade = await tx.trade.update({
          where: { id: input.tradeId },
          data: {
            status: 'CANCELLED',
            respondedAt: new Date()
          }
        });

        // Create notification for partner if trade was proposed
        if (trade.status === 'PROPOSED') {
          await tx.notification.create({
            data: {
              userId: trade.partner.ownerId,
              type: 'TRADE',
              title: 'Trade Cancelled',
              content: `${trade.initiator.name} has cancelled their trade proposal`,
              data: JSON.stringify({ tradeId: trade.id })
            }
          });
        }

        // Update transaction status
        await tx.transaction.updateMany({
          where: {
            details: {
              contains: trade.id
            }
          },
          data: {
            status: 'CANCELLED'
          }
        });

        return updatedTrade;
      });
    }),

  /**
   * Vote on a trade (for league voting)
   */
  voteTrade: protectedProcedure
    .input(z.object({
      tradeId: z.string(),
      voteType: z.enum(['APPROVE', 'VETO']),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const trade = await tx.trade.findUnique({
          where: { id: input.tradeId },
          include: {
            league: true,
            initiator: true,
            partner: true,
            votes: true
          }
        });

        if (!trade) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trade not found'
          });
        }

        // Verify trade is accepted and under review
        if (trade.status !== 'ACCEPTED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This trade is not open for voting'
          });
        }

        // Verify league has voting enabled
        if (!trade.league.tradeVotesNeeded || trade.league.tradeVotesNeeded === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This league does not use trade voting'
          });
        }

        // Get user's team
        const userTeam = await tx.team.findFirst({
          where: {
            leagueId: trade.leagueId,
            ownerId: ctx.session.user.id
          }
        });

        if (!userTeam) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have a team in this league'
          });
        }

        // Verify user is not involved in the trade
        if (trade.initiatorUserId === ctx.session.user.id || 
            trade.partner.ownerId === ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You cannot vote on your own trade'
          });
        }

        // Check if user has already voted
        const existingVote = trade.votes.find(v => v.userId === ctx.session.user.id);
        if (existingVote) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You have already voted on this trade'
          });
        }

        // Create vote
        await tx.tradeVote.create({
          data: {
            tradeId: input.tradeId,
            userId: ctx.session.user.id,
            teamId: userTeam.id,
            voteType: input.voteType,
            reason: input.reason
          }
        });

        // Update veto count if this is a veto vote
        let updatedTrade = trade;
        if (input.voteType === 'VETO') {
          updatedTrade = await tx.trade.update({
            where: { id: input.tradeId },
            data: {
              vetoVotes: trade.vetoVotes + 1
            }
          });

          // Check if veto threshold is reached
          if (updatedTrade.vetoVotes >= trade.league.tradeVotesNeeded) {
            updatedTrade = await tx.trade.update({
              where: { id: input.tradeId },
              data: {
                status: 'VETOED',
                respondedAt: new Date()
              }
            });

            // Notify both parties
            await tx.notification.createMany({
              data: [
                {
                  userId: trade.initiatorUserId,
                  type: 'TRADE',
                  title: 'Trade Vetoed',
                  content: 'Your trade has been vetoed by the league',
                  data: JSON.stringify({ tradeId: trade.id })
                },
                {
                  userId: trade.partner.ownerId,
                  type: 'TRADE',
                  title: 'Trade Vetoed',
                  content: 'Your trade has been vetoed by the league',
                  data: JSON.stringify({ tradeId: trade.id })
                }
              ]
            });
          }
        }

        return updatedTrade;
      });
    }),

  /**
   * Commissioner override - force approve or veto a trade
   */
  commissionerOverride: protectedProcedure
    .input(z.object({
      tradeId: z.string(),
      action: z.enum(['APPROVE', 'VETO']),
      reason: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const trade = await tx.trade.findUnique({
          where: { id: input.tradeId },
          include: {
            league: {
              include: {
                members: true
              }
            },
            initiator: true,
            partner: true
          }
        });

        if (!trade) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trade not found'
          });
        }

        // Verify user is commissioner
        const membership = trade.league.members.find(m => m.userId === ctx.session.user.id);
        if (!membership || membership.role !== 'COMMISSIONER') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the commissioner can override trades'
          });
        }

        // Update trade based on action
        const newStatus = input.action === 'APPROVE' ? 'EXECUTED' : 'VETOED';
        const updatedTrade = await tx.trade.update({
          where: { id: input.tradeId },
          data: {
            status: newStatus,
            commissionerOverride: true,
            respondedAt: new Date(),
            executedAt: input.action === 'APPROVE' ? new Date() : undefined
          }
        });

        // If approving, execute the trade
        if (input.action === 'APPROVE') {
          await this.executeTrade(tx, trade.id);
        }

        // Notify both parties
        const actionText = input.action === 'APPROVE' ? 'approved' : 'vetoed';
        await tx.notification.createMany({
          data: [
            {
              userId: trade.initiatorUserId,
              type: 'TRADE',
              title: `Trade ${actionText} by Commissioner`,
              content: `Your trade has been ${actionText} by the commissioner: ${input.reason}`,
              data: JSON.stringify({ tradeId: trade.id })
            },
            {
              userId: trade.partner.ownerId,
              type: 'TRADE',
              title: `Trade ${actionText} by Commissioner`,
              content: `Your trade has been ${actionText} by the commissioner: ${input.reason}`,
              data: JSON.stringify({ tradeId: trade.id })
            }
          ]
        });

        return updatedTrade;
      });
    }),

  /**
   * Private helper method to execute a trade
   */
  executeTrade: async function(tx: Prisma.TransactionClient, tradeId: string) {
    const trade = await tx.trade.findUnique({
      where: { id: tradeId },
      include: {
        initiator: true,
        partner: true,
        league: true
      }
    });

    if (!trade) {
      throw new Error('Trade not found');
    }

    const initiatorGives = JSON.parse(trade.initiatorGives) as z.infer<typeof TradeAssetsSchema>;
    const initiatorReceives = JSON.parse(trade.initiatorReceives) as z.infer<typeof TradeAssetsSchema>;
    const currentSeason = new Date().getFullYear();

    // Move players from initiator to partner
    if (initiatorGives.playerIds.length > 0) {
      // Remove from initiator's roster
      await tx.roster.deleteMany({
        where: {
          teamId: trade.initiatorId,
          playerId: { in: initiatorGives.playerIds },
          season: currentSeason
        }
      });

      // Add to partner's roster
      const currentWeek = trade.league.currentWeek || 1;
      await tx.roster.createMany({
        data: initiatorGives.playerIds.map(playerId => ({
          teamId: trade.partnerId,
          playerId,
          position: 'BENCH',
          week: currentWeek,
          season: currentSeason,
          isStarter: false
        }))
      });
    }

    // Move players from partner to initiator
    if (initiatorReceives.playerIds.length > 0) {
      // Remove from partner's roster
      await tx.roster.deleteMany({
        where: {
          teamId: trade.partnerId,
          playerId: { in: initiatorReceives.playerIds },
          season: currentSeason
        }
      });

      // Add to initiator's roster
      const currentWeek = trade.league.currentWeek || 1;
      await tx.roster.createMany({
        data: initiatorReceives.playerIds.map(playerId => ({
          teamId: trade.initiatorId,
          playerId,
          position: 'BENCH',
          week: currentWeek,
          season: currentSeason,
          isStarter: false
        }))
      });
    }

    // Handle draft pick transfers if applicable
    // This would require additional logic based on your draft pick system

    // Update trade status
    await tx.trade.update({
      where: { id: tradeId },
      data: {
        status: 'EXECUTED',
        executedAt: new Date()
      }
    });

    // Update transaction records
    await tx.transaction.updateMany({
      where: {
        details: {
          contains: tradeId
        }
      },
      data: {
        status: 'EXECUTED',
        executedAt: new Date()
      }
    });

    // Send notifications
    await tx.notification.createMany({
      data: [
        {
          userId: trade.initiatorUserId,
          type: 'TRADE',
          title: 'Trade Executed',
          content: 'Your trade has been successfully executed!',
          data: JSON.stringify({ tradeId })
        },
        {
          userId: trade.partner.ownerId,
          type: 'TRADE',
          title: 'Trade Executed',
          content: 'Your trade has been successfully executed!',
          data: JSON.stringify({ tradeId })
        }
      ]
    });

    return true;
  }
});