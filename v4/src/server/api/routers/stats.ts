/**
 * Stats router
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const statsRouter = createTRPCRouter({
  getPlayerStats: publicProcedure
    .input(z.object({ playerId: z.string(), season: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.playerStats.findMany({
        where: {
          playerId: input.playerId,
          season: input.season,
        },
        orderBy: { week: 'asc' },
      });
    }),
});
