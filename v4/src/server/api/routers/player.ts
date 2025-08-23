/**
 * Player router with comprehensive endpoints
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
// Player position and status will be handled as strings

export const playerRouter = createTRPCRouter({
  // Search players with filters
  search: publicProcedure
    .input(z.object({ 
      query: z.string().optional(),
      position: z.string().optional(),
      team: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      sortBy: z.enum(['adp', 'name']).default('adp'),
      sortOrder: z.enum(['asc', 'desc']).default('asc')
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        AND: []
      };

      if (input.query) {
        where.OR = [
          { name: { contains: input.query, mode: 'insensitive' } },
          { nflTeam: { contains: input.query, mode: 'insensitive' } },
          { college: { contains: input.query, mode: 'insensitive' } },
        ];
      }

      if (input.position) {
        where.AND.push({ position: input.position });
      }

      if (input.team) {
        where.AND.push({ nflTeam: input.team });
      }

      if (input.status) {
        where.AND.push({ status: input.status });
      }

      const [players, total] = await Promise.all([
        ctx.prisma.player.findMany({
          where: where.AND.length > 0 || where.OR ? where : undefined,
          take: input.limit,
          skip: input.offset,
          orderBy: {
            [input.sortBy]: input.sortOrder
          },
          include: {
            stats: {
              where: {
                season: new Date().getFullYear()
              },
              orderBy: {
                week: 'desc'
              },
              take: 5
            }
          }
        }),
        ctx.prisma.player.count({
          where: where.AND.length > 0 || where.OR ? where : undefined
        })
      ]);

      return {
        players,
        total,
        hasMore: input.offset + input.limit < total
      };
    }),

  // Get single player by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const player = await ctx.prisma.player.findUnique({
        where: { id: input.id },
        include: {
          stats: {
            where: {
              season: new Date().getFullYear()
            },
            orderBy: {
              week: 'desc'
            }
          },
          projections: {
            where: {
              season: new Date().getFullYear()
            },
            orderBy: {
              week: 'desc'
            },
            take: 1
          }
        }
      });

      if (!player) {
        throw new Error('Player not found');
      }

      return player;
    }),

  // Get players by position
  getByPosition: publicProcedure
    .input(z.object({ 
      position: z.string(),
      limit: z.number().min(1).max(100).default(50)
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.player.findMany({
        where: { position: input.position },
        orderBy: { adp: 'asc' },
        take: input.limit
      });
    }),

  // Get players by team
  getByTeam: publicProcedure
    .input(z.object({ team: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.player.findMany({
        where: { nflTeam: input.team },
        orderBy: { rank: 'asc' }
      });
    }),

  // Get top ranked players
  getTopRanked: publicProcedure
    .input(z.object({ 
      limit: z.number().min(1).max(200).default(100),
      excludeDrafted: z.boolean().default(false),
      leagueId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.excludeDrafted && input.leagueId) {
        // Get drafted player IDs in this league
        const draftedPlayers = await ctx.prisma.draftPick.findMany({
          where: {
            draft: {
              leagueId: input.leagueId
            },
            playerId: { not: null }
          },
          select: { playerId: true }
        });

        where.id = {
          notIn: draftedPlayers.map(p => p.playerId).filter(Boolean) as string[]
        };
      }

      return ctx.prisma.player.findMany({
        where,
        orderBy: { rank: 'asc' },
        take: input.limit,
        include: {
          projections: {
            where: {
              season: new Date().getFullYear(),
              week: 0 // Season projection
            },
            take: 1
          }
        }
      });
    }),

  // Get player stats
  getStats: publicProcedure
    .input(z.object({ 
      playerId: z.string(),
      season: z.number().optional(),
      week: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        playerId: input.playerId
      };

      if (input.season) {
        where.season = input.season;
      }

      if (input.week !== undefined) {
        where.week = input.week;
      }

      return ctx.prisma.playerStats.findMany({
        where,
        orderBy: [
          { season: 'desc' },
          { week: 'desc' }
        ]
      });
    }),

  // Get player projections
  getProjections: publicProcedure
    .input(z.object({ 
      playerId: z.string(),
      season: z.number().default(new Date().getFullYear()),
      week: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        playerId: input.playerId,
        season: input.season
      };

      if (input.week !== undefined) {
        where.week = input.week;
      }

      return ctx.prisma.playerProjection.findMany({
        where,
        orderBy: { week: 'desc' }
      });
    }),

  // Add player to watchlist (protected)
  addToWatchlist: protectedProcedure
    .input(z.object({ 
      playerId: z.string(),
      leagueId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // This would be stored in a watchlist table
      // For now, we'll use league player tags
      const leaguePlayer = await ctx.prisma.leaguePlayer.upsert({
        where: {
          playerId_leagueId: {
            playerId: input.playerId,
            leagueId: input.leagueId
          }
        },
        update: {
          tags: {
            push: 'watchlist'
          }
        },
        create: {
          playerId: input.playerId,
          leagueId: input.leagueId,
          tags: ['watchlist']
        }
      });

      return leaguePlayer;
    }),

  // Remove from watchlist (protected)
  removeFromWatchlist: protectedProcedure
    .input(z.object({ 
      playerId: z.string(),
      leagueId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const leaguePlayer = await ctx.prisma.leaguePlayer.findUnique({
        where: {
          playerId_leagueId: {
            playerId: input.playerId,
            leagueId: input.leagueId
          }
        }
      });

      if (leaguePlayer) {
        const updatedTags = leaguePlayer.tags.filter(tag => tag !== 'watchlist');
        
        if (updatedTags.length === 0) {
          // Delete the record if no tags remain
          await ctx.prisma.leaguePlayer.delete({
            where: {
              playerId_leagueId: {
                playerId: input.playerId,
                leagueId: input.leagueId
              }
            }
          });
        } else {
          // Update with remaining tags
          await ctx.prisma.leaguePlayer.update({
            where: {
              playerId_leagueId: {
                playerId: input.playerId,
                leagueId: input.leagueId
              }
            },
            data: {
              tags: updatedTags
            }
          });
        }
      }

      return { success: true };
    }),

  // Get watchlist (protected)
  getWatchlist: protectedProcedure
    .input(z.object({ leagueId: z.string() }))
    .query(async ({ ctx, input }) => {
      const leaguePlayers = await ctx.prisma.leaguePlayer.findMany({
        where: {
          leagueId: input.leagueId,
          tags: {
            has: 'watchlist'
          }
        },
        include: {
          player: true
        }
      });

      return leaguePlayers.map(lp => lp.player);
    }),

  // Compare multiple players
  compare: publicProcedure
    .input(z.object({ 
      playerIds: z.array(z.string()).min(2).max(5),
      season: z.number().default(new Date().getFullYear())
    }))
    .query(async ({ ctx, input }) => {
      const players = await ctx.prisma.player.findMany({
        where: {
          id: { in: input.playerIds }
        },
        include: {
          stats: {
            where: {
              season: input.season
            },
            orderBy: {
              week: 'desc'
            }
          },
          projections: {
            where: {
              season: input.season,
              week: 0 // Season projection
            },
            take: 1
          }
        }
      });

      return players;
    }),

  // Get injury report
  getInjuryReport: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.player.findMany({
        where: {
          status: {
            in: ['INJURED', 'IR', 'OUT', 'QUESTIONABLE', 'DOUBTFUL']
          }
        },
        orderBy: [
          { status: 'asc' },
          { rank: 'asc' }
        ],
        select: {
          id: true,
          name: true,
          position: true,
          nflTeam: true,
          status: true,
          injuryStatus: true,
          injuryNotes: true
        }
      });
    }),

  // Search players with more specific filtering for draft
  searchPlayers: publicProcedure
    .input(z.object({
      query: z.string().optional(),
      position: z.string().optional(),
      excludeIds: z.array(z.string()).optional(),
      sortBy: z.enum(['adp', 'name']).default('adp'),
      limit: z.number().min(1).max(100).default(50)
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        AND: []
      };

      if (input.query) {
        where.OR = [
          { name: { contains: input.query, mode: 'insensitive' } },
          { nflTeam: { contains: input.query, mode: 'insensitive' } }
        ];
      }

      if (input.position && input.position !== 'ALL') {
        where.position = input.position;
      }

      if (input.excludeIds && input.excludeIds.length > 0) {
        where.id = { notIn: input.excludeIds };
      }

      // Only active players
      where.status = 'ACTIVE';

      const orderBy: any = {};
      orderBy[input.sortBy] = 'asc';

      return ctx.prisma.player.findMany({
        where,
        orderBy,
        take: input.limit,
        select: {
          id: true,
          name: true,
          position: true,
          nflTeam: true,
          injuryStatus: true
        }
      });
    }),

  // Get available players for draft
  getAvailable: publicProcedure
    .input(z.object({
      draftId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Get already drafted players in this draft
      const draftedPicks = await ctx.prisma.draftPick.findMany({
        where: {
          draftId: input.draftId,
          playerId: { not: null }
        },
        select: {
          playerId: true
        }
      });

      const draftedPlayerIds = draftedPicks.map(pick => pick.playerId).filter(Boolean);

      // Return all active players not yet drafted
      return ctx.prisma.player.findMany({
        where: {
          status: 'ACTIVE',
          id: { notIn: draftedPlayerIds }
        },
        orderBy: {
          adp: 'asc'
        },
        select: {
          id: true,
          name: true,
          position: true,
          nflTeam: true,
          adp: true,
          injuryStatus: true
        }
      });
    }),

  // Get single player details
  getPlayer: publicProcedure
    .input(z.object({
      playerId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.player.findUnique({
        where: {
          id: input.playerId
        },
        include: {
          stats: {
            orderBy: {
              week: 'desc'
            },
            take: 5 // Last 5 games
          },
          projections: {
            where: {
              week: 0 // Season projections
            },
            take: 1
          }
        }
      });
    })
});
