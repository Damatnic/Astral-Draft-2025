/**
 * Draft router
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const draftRouter = createTRPCRouter({
  getDraft: protectedProcedure
    .input(z.object({ draftId: z.string() }))
    .query(async ({ ctx, input }) => {
      const draft = await ctx.prisma.draft.findUnique({
        where: { id: input.draftId },
        include: {
          league: {
            include: {
              teams: true,
            },
          },
          draftPicks: {
            include: {
              player: true,
              team: true,
            },
            orderBy: [
              { round: 'asc' },
              { pick: 'asc' },
            ],
          },
        },
      });

      if (!draft) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Draft not found',
        });
      }

      return draft;
    }),

  createDraft: protectedProcedure
    .input(
      z.object({
        leagueId: z.string(),
        type: z.enum(['SNAKE', 'AUCTION', 'LINEAR']),
        rounds: z.number().min(1).max(30).default(16),
        timePerPick: z.number().min(10).max(300).default(90),
        scheduledDate: z.date().optional(),
        budget: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user owns a team in this league (simplified check)
      const userTeam = await ctx.prisma.team.findFirst({
        where: {
          leagueId: input.leagueId,
          userId: ctx.session.user.id,
        },
      });

      if (!userTeam) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only league members can create a draft',
        });
      }

      // Check if draft already exists
      const existingDraft = await ctx.prisma.draft.findFirst({
        where: { leagueId: input.leagueId },
      });

      if (existingDraft) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Draft already exists for this league',
        });
      }

      const draft = await ctx.prisma.draft.create({
        data: {
          leagueId: input.leagueId,
          type: input.type,
          rounds: input.rounds,
          timePerPick: input.timePerPick,
          scheduledDate: input.scheduledDate,
          status: 'SCHEDULED',
          draftOrder: '[]',
        },
      });

      return draft;
    }),

  updateDraftSettings: protectedProcedure
    .input(
      z.object({
        draftId: z.string(),
        rounds: z.number().min(1).max(30).optional(),
        timePerPick: z.number().min(10).max(300).optional(),
        scheduledDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is commissioner
      const draft = await ctx.prisma.draft.findFirst({
        where: {
          id: input.draftId,
          league: {
            members: {
              some: {
                userId: ctx.session.user.id,
                role: 'COMMISSIONER',
              },
            },
          },
        },
      });

      if (!draft) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the commissioner can update draft settings',
        });
      }

      if (draft.status !== 'SCHEDULED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot update draft after it has started',
        });
      }

      const updatedDraft = await ctx.prisma.draft.update({
        where: { id: input.draftId },
        data: {
          rounds: input.rounds,
          timePerPick: input.timePerPick,
          scheduledDate: input.scheduledDate,
        },
      });

      return updatedDraft;
    }),

  startDraft: protectedProcedure
    .input(z.object({ draftId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is commissioner
      const draft = await ctx.prisma.draft.findFirst({
        where: {
          id: input.draftId,
          league: {
            members: {
              some: {
                userId: ctx.session.user.id,
                role: 'COMMISSIONER',
              },
            },
          },
        },
        include: {
          league: {
            include: {
              teams: true,
            },
          },
        },
      });

      if (!draft) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the commissioner can start the draft',
        });
      }

      if (draft.status !== 'SCHEDULED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Draft has already started',
        });
      }

      // Generate random draft order if not set
      let draftOrder: string[] = [];
      if (!draft.draftOrder || draft.draftOrder === '[]') {
        const teams = draft.league.teams;
        draftOrder = teams.map(t => t.id).sort(() => Math.random() - 0.5);
      } else {
        draftOrder = JSON.parse(draft.draftOrder);
      }

      const updatedDraft = await ctx.prisma.draft.update({
        where: { id: input.draftId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          draftOrder: JSON.stringify(draftOrder),
          currentPick: 1,
        },
      });

      return updatedDraft;
    }),

  getDraftPicks: protectedProcedure
    .input(z.object({ draftId: z.string() }))
    .query(async ({ ctx, input }) => {
      const picks = await ctx.prisma.draftPick.findMany({
        where: { draftId: input.draftId },
        include: {
          player: true,
          team: true,
        },
        orderBy: [
          { round: 'asc' },
          { pick: 'asc' },
        ],
      });

      return picks;
    }),

  makePick: protectedProcedure
    .input(
      z.object({
        draftId: z.string(),
        playerId: z.string(),
        amount: z.number().optional(), // For auction drafts
      })
    )
    .mutation(async ({ ctx, input }) => {
      const draft = await ctx.prisma.draft.findUnique({
        where: { id: input.draftId },
        include: {
          league: {
            include: {
              teams: true,
            },
          },
        },
      });

      if (!draft) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Draft not found',
        });
      }

      if (draft.status !== 'IN_PROGRESS') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Draft is not in progress',
        });
      }

      // Find user's team
      const userTeam = draft.league.teams.find(
        t => t.userId === ctx.session.user.id
      );

      if (!userTeam) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User not in this league',
        });
      }

      // Check if player is already drafted
      const existingPick = await ctx.prisma.draftPick.findFirst({
        where: {
          draftId: input.draftId,
          playerId: input.playerId,
        },
      });

      if (existingPick) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Player has already been drafted',
        });
      }

      // Create the pick
      const pick = await ctx.prisma.draftPick.create({
        data: {
          draft: { connect: { id: input.draftId } },
          team: { connect: { id: userTeam.id } },
          player: input.playerId ? { connect: { id: input.playerId } } : undefined,
          user: { connect: { id: ctx.session.user.id } },
          round: Math.ceil(draft.currentPick / draft.league.teams.length),
          pick: draft.currentPick,
          overallPick: draft.currentPick,
        },
      });

      // Add to roster
      await ctx.prisma.roster.create({
        data: {
          teamId: userTeam.id,
          playerId: input.playerId,
          position: 'BENCH',
          isStarter: false,
        },
      });

      // Update draft state
      const totalPicks = draft.league.teams.length * draft.rounds;
      
      if (draft.currentPick >= totalPicks) {
        // Draft complete
        await ctx.prisma.draft.update({
          where: { id: input.draftId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        await ctx.prisma.league.update({
          where: { id: draft.leagueId },
          data: { status: 'IN_SEASON' },
        });
      } else {
        // Move to next pick
        await ctx.prisma.draft.update({
          where: { id: input.draftId },
          data: {
            currentPick: draft.currentPick + 1,
          },
        });
      }

      return pick;
    }),

  getMockDrafts: publicProcedure
    .query(async ({ ctx }) => {
      // For now, return sample mock draft data since MockDraftSession is for single-user drafts
      // In a real implementation, you might want to create a separate model for multi-user mock drafts
      const sampleMockDrafts = [
        {
          id: 'mock-1',
          teamCount: 10,
          rounds: 16,
          timePerPick: 60,
          currentPlayers: 7,
          status: 'WAITING',
          createdAt: new Date(),
        },
        {
          id: 'mock-2',
          teamCount: 12,
          rounds: 15,
          timePerPick: 45,
          currentPlayers: 12,
          status: 'IN_PROGRESS',
          createdAt: new Date(Date.now() - 30000),
        },
      ];

      return sampleMockDrafts;
    }),

  createMockDraft: protectedProcedure
    .input(
      z.object({
        rounds: z.number().min(1).max(30).default(16),
        teamCount: z.number().min(4).max(20).default(10),
        timePerPick: z.number().min(10).max(120).default(60),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create a mock draft session
      // This would typically create a temporary draft room
      return {
        id: `mock-${Date.now()}`,
        ...input,
        status: 'WAITING',
      };
    }),

  getDraftRecap: protectedProcedure
    .input(z.object({ draftId: z.string() }))
    .query(async ({ ctx, input }) => {
      const draft = await ctx.prisma.draft.findUnique({
        where: { id: input.draftId },
        include: {
          league: {
            include: {
              teams: true,
            },
          },
          draftPicks: {
            include: {
              player: true,
              team: true,
            },
            orderBy: [
              { round: 'asc' },
              { pick: 'asc' },
            ],
          },
        },
      });

      if (!draft || draft.status !== 'COMPLETED') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Draft not found or not completed',
        });
      }

      // Calculate draft grades and statistics
      const teamGrades = draft.league.teams.map(team => {
        const teamPicks = draft.draftPicks.filter(p => p.teamId === team.id);
        const averageAdp = teamPicks.reduce((sum, pick) => 
          sum + (pick.player?.adp || 0), 0) / teamPicks.length;
        
        // Simple grading logic (would be more complex in production)
        let grade = 'B';
        if (averageAdp < 80) grade = 'A';
        else if (averageAdp < 100) grade = 'B+';
        else if (averageAdp > 120) grade = 'C';

        return {
          teamId: team.id,
          teamName: team.name,
          picks: teamPicks,
          grade,
          bestPick: teamPicks.reduce((best, pick) => {
            if (!best) return pick;
            const pickValue = pick.overallPick - (pick.player?.adp || 0);
            const bestValue = best.overallPick - (best.player?.adp || 0);
            return pickValue > bestValue ? pick : best;
          }, teamPicks[0]),
          reachPick: teamPicks.reduce((reach, pick) => {
            if (!reach) return pick;
            const pickValue = (pick.player?.adp || 0) - pick.overallPick;
            const reachValue = (reach.player?.adp || 0) - reach.overallPick;
            return pickValue > reachValue ? pick : reach;
          }, teamPicks[0]),
        };
      });

      return {
        draft,
        teamGrades,
        totalPicks: draft.draftPicks.length,
        duration: draft.completedAt && draft.startedAt
          ? Math.round((draft.completedAt.getTime() - draft.startedAt.getTime()) / 1000 / 60)
          : 0,
      };
    }),

  // Get draft picks separately for real-time updates
  getPicks: protectedProcedure
    .input(z.object({ draftId: z.string() }))
    .query(async ({ ctx, input }) => {
      const picks = await ctx.prisma.draftPick.findMany({
        where: { draftId: input.draftId },
        include: {
          player: {
            select: {
              id: true,
              name: true,
              position: true,
              nflTeam: true,
              adp: true
            }
          },
          team: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { round: 'asc' },
          { pick: 'asc' }
        ]
      });

      return picks;
    })
});
