/**
 * Transaction router
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const transactionRouter = createTRPCRouter({
  getLeagueTransactions: protectedProcedure
    .input(z.object({ leagueId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.transaction.findMany({
        where: { leagueId: input.leagueId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }),
});
