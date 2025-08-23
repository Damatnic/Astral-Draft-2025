/**
 * tRPC setup and context creation for Astral Draft V4
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type NextRequest } from 'next/server';
import { type Session } from 'next-auth';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { getServerAuthSession } from '../auth';
import { prisma } from '../db';
import { redis } from '../redis';

/**
 * Defines the context available in all tRPC procedures
 */
interface CreateContextOptions {
  session: Session | null;
}

/**
 * Inner context creation helper - doesn't require req/res
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
    redis,
  };
};

/**
 * Context creation for tRPC (Pages Router) - runs for each request
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get the session from the server using the getServerSession wrapper
  const session = await getServerAuthSession({ req, res });

  return createInnerTRPCContext({
    session,
  });
};

/**
 * Context creation for tRPC (App Router) - runs for each request
 * @see https://trpc.io/docs/context
 */
export const createTRPCContextAppRouter = async (opts: { req: NextRequest }) => {
  // For app router, we need to create a minimal req/res object for auth
  const mockRes = {
    headers: new Map(),
    status: 200,
  };

  // Get the session from the server using the getServerSession wrapper
  const session = await getServerAuthSession({ 
    req: opts.req as any, 
    res: mockRes as any 
  });

  return createInnerTRPCContext({
    session,
  });
};

/**
 * Initialize tRPC backend
 * Should be done only once per backend
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a tRPC router
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure
 * Anyone can access
 */
export const publicProcedure = t.procedure;

/**
 * Middleware to enforce authentication
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Protected procedure
 * User must be logged in
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Commissioner procedure
 * User must be a league commissioner
 */
export const commissionerProcedure = protectedProcedure.use(
  async ({ ctx, next, input }) => {
    // Check if user is commissioner of the league
    // This will be expanded based on the specific router requirements
    return next({ ctx });
  }
);

/**
 * Admin procedure
 * User must be an admin
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({ ctx });
});