/**
 * Root tRPC router
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 */

import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { leagueRouter } from './routers/league';
import { teamRouter } from './routers/team';
import { draftRouter } from './routers/draft';
import { advancedDraftRouter } from './routers/advancedDraft';
import { playerRouter } from './routers/player';
import { transactionRouter } from './routers/transaction';
import { tradeRouter } from './routers/trade';
import { matchupRouter } from './routers/matchup';
import { notificationRouter } from './routers/notification';
import { statsRouter } from './routers/stats';
import { oracleRouter } from './routers/oracle';
import { waiverRouter } from './routers/waiver';
import { emailRouter } from './routers/email';
import { cronRouter } from './routers/cron';
import { playoffRouter } from './routers/playoffs';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  league: leagueRouter,
  team: teamRouter,
  draft: draftRouter,
  advancedDraft: advancedDraftRouter,
  player: playerRouter,
  transaction: transactionRouter,
  trade: tradeRouter,
  matchup: matchupRouter,
  notification: notificationRouter,
  stats: statsRouter,
  oracle: oracleRouter,
  waiver: waiverRouter,
  email: emailRouter,
  cron: cronRouter,
  playoffs: playoffRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;