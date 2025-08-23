/**
 * Matchup router
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const matchupRouter = createTRPCRouter({
  getWeekMatchups: protectedProcedure
    .input(z.object({ leagueId: z.string(), week: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.matchup.findMany({
        where: {
          leagueId: input.leagueId,
          week: input.week,
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      });
    }),
});
