/**
 * Team router
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const teamRouter = createTRPCRouter({
  getMyTeams: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.team.findMany({
      where: { ownerId: ctx.session.user.id },
      include: {
        league: true,
      },
    });
  }),
});
