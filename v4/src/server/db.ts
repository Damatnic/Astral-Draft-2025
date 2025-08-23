/**
 * Prisma database client for Astral Draft V4
 * Instantiates a single instance PrismaClient and saves it on the global object.
 * @see https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client';
import { env } from '../env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Middleware for soft deletes (if needed)
// prisma.$use(async (params, next) => {
//   // Add soft delete logic here
//   return next(params);
// });

export default prisma;