/**
 * League router
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, commissionerProcedure } from '../trpc';
import { cache } from '../../redis';
import { scheduleJobs } from '../../queue';

const createLeagueSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  type: z.enum(['REDRAFT', 'KEEPER', 'DYNASTY', 'BEST_BALL']),
  scoringType: z.enum(['STANDARD', 'PPR', 'HALF_PPR', 'CUSTOM']),
  teamCount: z.number().min(4).max(20),
  season: z.number(),
  isPublic: z.boolean().default(false),
  rosterPositions: z.record(z.number()),
  maxRosterSize: z.number().min(10).max(30),
  waiverType: z.string().default('FAAB'),
  waiverBudget: z.number().default(100),
  playoffTeams: z.number().min(2).max(8),
  playoffStartWeek: z.number().min(10).max(17),
  draftDate: z.date().optional(),
});

export const leagueRouter = createTRPCRouter({
  /**
   * Create a new league
   */
  create: protectedProcedure
    .input(createLeagueSchema)
    .mutation(async ({ ctx, input }) => {
      // Generate unique slug - NOTE: slug field doesn't exist in League model
      // const baseSlug = input.name
      //   .toLowerCase()
      //   .replace(/[^a-z0-9]+/g, '-')
      //   .replace(/^-|-$/g, '');
      
      // let slug = baseSlug;
      // let counter = 1;
      
      // while (await ctx.prisma.league.findUnique({ where: { slug } })) {
      //   slug = `${baseSlug}-${counter}`;
      //   counter++;
      // }
      
      // Create league with creator as first member
      const league = await ctx.prisma.league.create({
        data: {
          ...input,
          // slug doesn't exist in League model
          // creatorId doesn't exist in League model
          // scoringRules doesn't exist in League model - use settings instead
          settings: JSON.stringify({
            scoringRules: getDefaultScoringRules(input.scoringType || 'PPR'),
          }),
          members: {
            create: {
              userId: ctx.session.user.id,
              role: 'COMMISSIONER',
            },
          },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
          teams: true,
        },
      });
      
      // Create commissioner's team
      await ctx.prisma.team.create({
        data: {
          name: `${ctx.session.user.username}'s Team`,
          abbreviation: ctx.session.user.username.substring(0, 4).toUpperCase(),
          userId: ctx.session.user.id,
          leagueId: league.id,
        },
      });
      
      return league;
    }),
  
  /**
   * Get user's leagues
   */
  getMyLeagues: protectedProcedure.query(async ({ ctx }) => {
    const leagues = await ctx.prisma.league.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
        _count: {
          select: {
            teams: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return leagues;
  }),

  /**
   * Get public leagues available to join
   */
  getPublicLeagues: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      format: z.string().optional(),
      limit: z.number().default(20),
      page: z.number().default(1),
    }))
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      
      const leagues = await ctx.prisma.league.findMany({
        where: {
          isPublic: true,
          status: 'RECRUITING', // Only show leagues still looking for members
          // TODO: Can't filter by teams.length < teamCount in Prisma
          // Would need to filter in application code after fetching
          ...(input.search && {
            OR: [
              { name: { contains: input.search } },
              { description: { contains: input.search } },
            ],
          }),
          ...(input.format && input.format !== 'all' && {
            type: input.format.toUpperCase(),
          }),
        },
        include: {
          members: {
            where: { role: 'COMMISSIONER' },
            select: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              teams: true,
              members: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: input.limit,
      });
      
      const total = await ctx.prisma.league.count({
        where: {
          isPublic: true,
          status: 'RECRUITING',
          ...(input.search && {
            OR: [
              { name: { contains: input.search } },
              { description: { contains: input.search } },
            ],
          }),
          ...(input.format && input.format !== 'all' && {
            type: input.format.toUpperCase(),
          }),
        },
      });
      
      return {
        leagues,
        hasMore: skip + leagues.length < total,
        total,
      };
    }),

  /**
   * Get user's leagues with draft information for draft lobby
   */
  getUserLeagues: protectedProcedure.query(async ({ ctx }) => {
    const leagues = await ctx.prisma.league.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        draft: {
          select: {
            id: true,
            type: true,
            status: true,
            rounds: true,
            timePerPick: true,
            scheduledDate: true,
            startedAt: true,
            completedAt: true,
            currentPick: true,
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
        _count: {
          select: {
            teams: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Filter to only include leagues that have drafts or are relevant for drafting
    return leagues.filter(league => 
      league.draft && 
      ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(league.draft.status)
    );
  }),
  
  /**
   * Get league by ID or slug
   */
  get: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        slug: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.id && !input.slug) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either id or slug is required',
        });
      }
      
      // Check cache first
      const cacheKey = `league:${input.id || input.slug}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
      
      // Note: slug field doesn't exist in League model
      if (!input.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'League ID is required',
        });
      }
      
      const league = await ctx.prisma.league.findUnique({
        where: { id: input.id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
          teams: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              wins: 'desc',
            },
          },
          draft: true,
        },
      });
      
      if (!league) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'League not found',
        });
      }
      
      // Check if user is member
      const isMember = league.members.some(m => m.userId === ctx.session.user.id);
      
      if (!league.isPublic && !isMember) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this league',
        });
      }
      
      // Cache for 5 minutes
      await cache.set(cacheKey, league, 300);
      
      return league;
    }),
  
  /**
   * Join a league
   */
  join: protectedProcedure
    .input(
      z.object({
        leagueId: z.string(),
        inviteCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const league = await ctx.prisma.league.findUnique({
        where: { id: input.leagueId },
        include: {
          teams: true,
          members: true,
        },
      });
      
      if (!league) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'League not found',
        });
      }
      
      // Check if already a member
      if (league.members.some(m => m.userId === ctx.session.user.id)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Already a member of this league',
        });
      }
      
      // Check if league is full
      if (league.teams.length >= league.teamCount) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'League is full',
        });
      }
      
      // Verify invite code if league is private
      if (!league.isPublic && input.inviteCode !== league.id.substring(0, 8)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid invite code',
        });
      }
      
      // Create member and team
      await ctx.prisma.$transaction([
        ctx.prisma.leagueMember.create({
          data: {
            userId: ctx.session.user.id,
            leagueId: input.leagueId,
            role: 'MEMBER',
          },
        }),
        ctx.prisma.team.create({
          data: {
            name: `${ctx.session.user.username}'s Team`,
            abbreviation: ctx.session.user.username.substring(0, 4).toUpperCase(),
            userId: ctx.session.user.id,
            leagueId: input.leagueId,
          },
        }),
      ]);
      
      // Clear cache
      await cache.del(`league:${input.leagueId}`);
      
      return { success: true };
    }),
  
  /**
   * Update league settings (commissioner only)
   */
  updateSettings: commissionerProcedure
    .input(
      z.object({
        leagueId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        logo: z.string().url().optional(),
        scoringRules: z.any().optional(),
        tradeDeadline: z.date().optional(),
        tradeReviewDays: z.number().optional(),
        waiverPeriod: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { leagueId, ...data } = input;
      
      // Verify commissioner status
      const member = await ctx.prisma.leagueMember.findUnique({
        where: {
          leagueId_userId: {
            leagueId,
            userId: ctx.session.user.id,
          },
        },
      });
      
      if (!member || member.role !== 'COMMISSIONER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only commissioners can update league settings',
        });
      }
      
      const updated = await ctx.prisma.league.update({
        where: { id: leagueId },
        data,
      });
      
      // Clear cache
      await cache.del(`league:${leagueId}`);
      
      return updated;
    }),
  
  /**
   * Get league standings
   */
  getStandings: protectedProcedure
    .input(z.object({ leagueId: z.string() }))
    .query(async ({ ctx, input }) => {
      const teams = await ctx.prisma.team.findMany({
        where: { leagueId: input.leagueId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: [
          { wins: 'desc' },
          { pointsFor: 'desc' },
        ],
      });
      
      // Calculate standings
      const standings = teams.map((team, index) => ({
        ...team,
        standing: index + 1,
        winPercentage: team.wins / Math.max(1, team.wins + team.losses + team.ties),
        pointsPerGame: team.pointsFor / Math.max(1, team.wins + team.losses + team.ties),
      }));
      
      return standings;
    }),
  
  /**
   * Get league matchups
   */
  getMatchups: protectedProcedure
    .input(z.object({ 
      leagueId: z.string(),
      week: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const matchups = await ctx.prisma.matchup.findMany({
        where: { 
          leagueId: input.leagueId,
          ...(input.week && { week: input.week })
        },
        include: {
          homeTeam: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
          awayTeam: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { week: 'asc' },
      });
      
      return matchups;
    }),
  
  /**
   * Get league activity feed
   * NOTE: LeagueActivity model doesn't exist in the schema
   */
  getActivity: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      filter: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      // TODO: LeagueActivity model doesn't exist
      // Need to implement this using Transaction or Message models
      return { activities: [], total: 0, page: input.page, pages: 0 };
      
      /* Original implementation for reference:
      const skip = (input.page - 1) * input.limit;
      
      const activities = await ctx.prisma.leagueActivity.findMany({
        where: {
          leagueId: input.leagueId,
          ...(input.filter && { type: input.filter }),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: input.limit,
      });
      
      const total = await ctx.prisma.leagueActivity.count({
        where: {
          leagueId: input.leagueId,
          ...(input.filter && { type: input.filter }),
        },
      });
      
      return {
        items: activities,
        hasMore: skip + activities.length < total,
        total,
      };
    }),
  
  /**
   * Get league messages
   */
  getMessages: protectedProcedure
    .input(z.object({ leagueId: z.string() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.leagueMessage.findMany({
        where: { leagueId: input.leagueId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          reactions: true,
        },
        orderBy: { createdAt: 'asc' },
        take: 100, // Limit to last 100 messages
      });
      
      return messages;
    }),
  
  /**
   * Send league message
   */
  sendMessage: protectedProcedure
    .input(z.object({
      leagueId: z.string(),
      content: z.string().min(1).max(500),
      replyToId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.prisma.leagueMessage.create({
        data: {
          leagueId: input.leagueId,
          userId: ctx.session.user.id,
          content: input.content,
          replyToId: input.replyToId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });
      
      // Create activity log
      await ctx.prisma.leagueActivity.create({
        data: {
          leagueId: input.leagueId,
          userId: ctx.session.user.id,
          type: 'MESSAGE',
          title: 'New message',
          description: input.content.substring(0, 100),
        },
      });
      
      return message;
    }),
  
  /**
   * Delete league (commissioner only)
   */
  delete: commissionerProcedure
    .input(z.object({ leagueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify commissioner status
      const leagueMember = await ctx.prisma.leagueMember.findFirst({
        where: {
          leagueId: input.leagueId,
          userId: ctx.session.user.id,
          role: 'COMMISSIONER',
        },
      });
      
      if (!leagueMember) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only league commissioner can delete the league',
        });
      }
      
      // Delete league and all related data (cascade)
      await ctx.prisma.league.delete({
        where: { id: input.leagueId },
      });
      
      return { success: true };
    }),
  
  /**
   * Invite member (commissioner only)
   */
  inviteMember: commissionerProcedure
    .input(z.object({
      leagueId: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create invitation
      const invitation = await ctx.prisma.leagueInvitation.create({
        data: {
          leagueId: input.leagueId,
          email: input.email,
          invitedBy: ctx.session.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
      
      // Send invitation email (would use email service)
      // await sendInvitationEmail(input.email, invitation);
      
      return invitation;
    }),
  
  /**
   * Remove member (commissioner only)
   */
  removeMember: commissionerProcedure
    .input(z.object({
      leagueId: z.string(),
      memberId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Can't remove commissioner
      const member = await ctx.prisma.leagueMember.findUnique({
        where: {
          userId_leagueId: {
            userId: input.memberId,
            leagueId: input.leagueId,
          },
        },
      });
      
      if (member?.role === 'COMMISSIONER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot remove commissioner',
        });
      }
      
      // Remove member and their team
      await ctx.prisma.$transaction([
        ctx.prisma.leagueMember.delete({
          where: {
            userId_leagueId: {
              userId: input.memberId,
              leagueId: input.leagueId,
            },
          },
        }),
        ctx.prisma.team.deleteMany({
          where: {
            ownerId: input.memberId,
            leagueId: input.leagueId,
          },
        }),
      ]);
      
      return { success: true };
    }),
  
  /**
   * Update member role (commissioner only)
   */
  updateMemberRole: commissionerProcedure
    .input(z.object({
      leagueId: z.string(),
      memberId: z.string(),
      role: z.enum(['MEMBER', 'COMMISSIONER']),
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.leagueMember.update({
        where: {
          userId_leagueId: {
            userId: input.memberId,
            leagueId: input.leagueId,
          },
        },
        data: { role: input.role },
      });
      
      return updated;
    }),
  
  /**
   * Approve pending action (commissioner only)
   */
  approveAction: commissionerProcedure
    .input(z.object({
      leagueId: z.string(),
      actionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Process the action based on type
      // This would handle trades, waivers, etc.
      
      await ctx.prisma.pendingAction.update({
        where: { id: input.actionId },
        data: { 
          status: 'APPROVED',
          processedBy: ctx.session.user.id,
          processedAt: new Date(),
        },
      });
      
      return { success: true };
    }),
  
  /**
   * Reject pending action (commissioner only)
   */
  rejectAction: commissionerProcedure
    .input(z.object({
      leagueId: z.string(),
      actionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.pendingAction.update({
        where: { id: input.actionId },
        data: { 
          status: 'REJECTED',
          processedBy: ctx.session.user.id,
          processedAt: new Date(),
        },
      });
      
      return { success: true };
    }),
});

function getDefaultScoringRules(scoringType: string) {
  const base = {
    QB: {
      passYards: 0.04,
      passTds: 4,
      passInts: -2,
      rushYards: 0.1,
      rushTds: 6,
    },
    RB: {
      rushYards: 0.1,
      rushTds: 6,
      recYards: 0.1,
      recTds: 6,
      receptions: scoringType === 'PPR' ? 1 : scoringType === 'HALF_PPR' ? 0.5 : 0,
    },
    WR: {
      recYards: 0.1,
      recTds: 6,
      receptions: scoringType === 'PPR' ? 1 : scoringType === 'HALF_PPR' ? 0.5 : 0,
      rushYards: 0.1,
      rushTds: 6,
    },
    TE: {
      recYards: 0.1,
      recTds: 6,
      receptions: scoringType === 'PPR' ? 1 : scoringType === 'HALF_PPR' ? 0.5 : 0,
    },
    K: {
      xpMade: 1,
      fg0to39: 3,
      fg40to49: 4,
      fg50plus: 5,
    },
    DEF: {
      sacks: 1,
      interceptions: 2,
      fumbleRecoveries: 2,
      tds: 6,
      safeties: 2,
      pointsAllowed0: 10,
      pointsAllowed1to6: 7,
      pointsAllowed7to13: 4,
      pointsAllowed14to20: 1,
      pointsAllowed21to27: 0,
      pointsAllowed28to34: -1,
      pointsAllowed35plus: -4,
    },
  };
  
  return base;
}