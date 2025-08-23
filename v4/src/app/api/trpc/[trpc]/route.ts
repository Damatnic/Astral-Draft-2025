/**
 * tRPC API handler for Next.js App Router
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';

import { env } from '../../../../env';
import { appRouter } from '../../../../server/api/root';
import { createTRPCContextAppRouter } from '../../../../server/api/trpc';

/**
 * This wraps the tRPC API handler to work with Next.js App Router
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContextAppRouter({ req }),
    onError:
      env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };