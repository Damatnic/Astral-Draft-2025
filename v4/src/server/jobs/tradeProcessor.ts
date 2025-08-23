/**
 * Trade Processor Job
 * Handles automated trade processing tasks:
 * - Expire old trades
 * - Execute trades after review period
 * - Send reminders for pending trades
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Trade assets schema
const TradeAssetsSchema = z.object({
  playerIds: z.array(z.string()),
  draftPicks: z.array(z.object({
    round: z.number(),
    year: z.number(),
    originalOwner: z.string().optional()
  }))
});

/**
 * Main job processor - should be run periodically (e.g., every hour)
 */
export async function processTradeJobs(): Promise<void> {
  console.log('[TradeProcessor] Starting trade processing jobs...');
  
  try {
    await processExpiredTrades();
    await processReviewPeriodEnded();
    await sendTradeReminders();
    await cleanupOldTrades();
    
    console.log('[TradeProcessor] All trade jobs completed successfully');
  } catch (error) {
    console.error('[TradeProcessor] Error processing trade jobs:', error);
    throw error;
  }
}

/**
 * Process expired trades
 */
async function processExpiredTrades(): Promise<void> {
  const now = new Date();
  
  // Find all proposed trades that have expired
  const expiredTrades = await prisma.trade.findMany({
    where: {
      status: 'PROPOSED',
      expiresAt: {
        lt: now
      }
    },
    include: {
      initiator: {
        include: { owner: true }
      },
      partner: {
        include: { owner: true }
      }
    }
  });

  console.log(`[TradeProcessor] Found ${expiredTrades.length} expired trades`);

  for (const trade of expiredTrades) {
    await prisma.$transaction(async (tx) => {
      // Update trade status
      await tx.trade.update({
        where: { id: trade.id },
        data: { 
          status: 'EXPIRED',
          respondedAt: now
        }
      });

      // Update related transactions
      await tx.transaction.updateMany({
        where: {
          details: {
            contains: trade.id
          },
          status: 'PENDING'
        },
        data: {
          status: 'CANCELLED'
        }
      });

      // Notify both parties
      await tx.notification.createMany({
        data: [
          {
            userId: trade.initiator.ownerId,
            type: 'TRADE',
            title: 'Trade Expired',
            content: `Your trade proposal with ${trade.partner.name} has expired`,
            data: JSON.stringify({ tradeId: trade.id })
          },
          {
            userId: trade.partner.ownerId,
            type: 'TRADE',
            title: 'Trade Expired',
            content: `Trade proposal from ${trade.initiator.name} has expired`,
            data: JSON.stringify({ tradeId: trade.id })
          }
        ]
      });
    });

    console.log(`[TradeProcessor] Expired trade ${trade.id}`);
  }
}

/**
 * Process trades where review period has ended
 */
async function processReviewPeriodEnded(): Promise<void> {
  const now = new Date();
  
  // Find accepted trades where review period has ended
  const tradesReady = await prisma.trade.findMany({
    where: {
      status: 'ACCEPTED',
      reviewEndsAt: {
        not: null,
        lt: now
      }
    },
    include: {
      league: true,
      initiator: {
        include: { owner: true }
      },
      partner: {
        include: { owner: true }
      },
      votes: true
    }
  });

  console.log(`[TradeProcessor] Found ${tradesReady.length} trades with ended review period`);

  for (const trade of tradesReady) {
    await prisma.$transaction(async (tx) => {
      // Check if trade was vetoed
      const vetoThreshold = trade.league.tradeVotesNeeded || 0;
      
      if (vetoThreshold > 0 && trade.vetoVotes >= vetoThreshold) {
        // Trade was vetoed
        await tx.trade.update({
          where: { id: trade.id },
          data: {
            status: 'VETOED',
            respondedAt: now
          }
        });

        await tx.notification.createMany({
          data: [
            {
              userId: trade.initiator.ownerId,
              type: 'TRADE',
              title: 'Trade Vetoed',
              content: 'Your trade was vetoed by the league after review',
              data: JSON.stringify({ tradeId: trade.id })
            },
            {
              userId: trade.partner.ownerId,
              type: 'TRADE',
              title: 'Trade Vetoed',
              content: 'Your trade was vetoed by the league after review',
              data: JSON.stringify({ tradeId: trade.id })
            }
          ]
        });

        console.log(`[TradeProcessor] Trade ${trade.id} vetoed after review`);
      } else {
        // Execute the trade
        await executeTrade(tx, trade.id);
        console.log(`[TradeProcessor] Trade ${trade.id} executed after review`);
      }
    });
  }
}

/**
 * Execute a trade
 */
async function executeTrade(tx: any, tradeId: string): Promise<void> {
  const trade = await tx.trade.findUnique({
    where: { id: tradeId },
    include: {
      initiator: true,
      partner: true,
      league: true
    }
  });

  if (!trade) {
    throw new Error(`Trade ${tradeId} not found`);
  }

  const initiatorGives = JSON.parse(trade.initiatorGives) as z.infer<typeof TradeAssetsSchema>;
  const initiatorReceives = JSON.parse(trade.initiatorReceives) as z.infer<typeof TradeAssetsSchema>;
  const currentSeason = new Date().getFullYear();
  const currentWeek = trade.league.currentWeek || 1;

  // Move players from initiator to partner
  if (initiatorGives.playerIds.length > 0) {
    // Remove from initiator's roster
    await tx.roster.deleteMany({
      where: {
        teamId: trade.initiatorId,
        playerId: { in: initiatorGives.playerIds },
        season: currentSeason
      }
    });

    // Add to partner's roster
    for (const playerId of initiatorGives.playerIds) {
      // Check if roster entry already exists (for different weeks)
      const existingRoster = await tx.roster.findFirst({
        where: {
          teamId: trade.partnerId,
          playerId,
          week: currentWeek,
          season: currentSeason
        }
      });

      if (!existingRoster) {
        await tx.roster.create({
          data: {
            teamId: trade.partnerId,
            playerId,
            position: 'BENCH',
            week: currentWeek,
            season: currentSeason,
            isStarter: false
          }
        });
      }
    }
  }

  // Move players from partner to initiator
  if (initiatorReceives.playerIds.length > 0) {
    // Remove from partner's roster
    await tx.roster.deleteMany({
      where: {
        teamId: trade.partnerId,
        playerId: { in: initiatorReceives.playerIds },
        season: currentSeason
      }
    });

    // Add to initiator's roster
    for (const playerId of initiatorReceives.playerIds) {
      const existingRoster = await tx.roster.findFirst({
        where: {
          teamId: trade.initiatorId,
          playerId,
          week: currentWeek,
          season: currentSeason
        }
      });

      if (!existingRoster) {
        await tx.roster.create({
          data: {
            teamId: trade.initiatorId,
            playerId,
            position: 'BENCH',
            week: currentWeek,
            season: currentSeason,
            isStarter: false
          }
        });
      }
    }
  }

  // Handle draft pick transfers
  if (initiatorGives.draftPicks.length > 0 || initiatorReceives.draftPicks.length > 0) {
    // This would require a DraftPick ownership table
    // For now, we'll store this in the transaction log
    await tx.transaction.create({
      data: {
        leagueId: trade.leagueId,
        teamId: trade.initiatorId,
        userId: trade.initiatorUserId,
        type: 'TRADE',
        status: 'EXECUTED',
        details: JSON.stringify({
          tradeId: trade.id,
          draftPicksGiven: initiatorGives.draftPicks,
          draftPicksReceived: initiatorReceives.draftPicks
        }),
        executedAt: new Date()
      }
    });
  }

  // Update trade status
  await tx.trade.update({
    where: { id: tradeId },
    data: {
      status: 'EXECUTED',
      executedAt: new Date()
    }
  });

  // Update transaction records
  await tx.transaction.updateMany({
    where: {
      details: {
        contains: tradeId
      },
      status: 'PENDING'
    },
    data: {
      status: 'EXECUTED',
      executedAt: new Date()
    }
  });

  // Send notifications
  await tx.notification.createMany({
    data: [
      {
        userId: trade.initiator.ownerId,
        type: 'TRADE',
        title: 'Trade Completed',
        content: 'Your trade has been successfully executed!',
        data: JSON.stringify({ tradeId })
      },
      {
        userId: trade.partner.ownerId,
        type: 'TRADE',
        title: 'Trade Completed',
        content: 'Your trade has been successfully executed!',
        data: JSON.stringify({ tradeId })
      }
    ]
  });

  // Create league message
  await tx.message.create({
    data: {
      leagueId: trade.leagueId,
      userId: trade.initiatorUserId,
      type: 'TRADE_PROPOSAL',
      content: `Trade executed: ${trade.initiator.name} and ${trade.partner.name} have completed their trade`,
      metadata: JSON.stringify({
        tradeId,
        initiatorGives,
        initiatorReceives
      })
    }
  });
}

/**
 * Send reminders for pending trades
 */
async function sendTradeReminders(): Promise<void> {
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  // Find trades expiring in the next 24 hours that haven't been reminded
  const tradesNeedingReminder = await prisma.trade.findMany({
    where: {
      status: 'PROPOSED',
      expiresAt: {
        gte: now,
        lte: oneDayFromNow
      }
    },
    include: {
      initiator: {
        include: { owner: true }
      },
      partner: {
        include: { owner: true }
      }
    }
  });

  console.log(`[TradeProcessor] Sending reminders for ${tradesNeedingReminder.length} trades`);

  for (const trade of tradesNeedingReminder) {
    // Check if reminder was already sent (could track this in a separate table)
    const existingReminder = await prisma.notification.findFirst({
      where: {
        userId: trade.partner.ownerId,
        type: 'TRADE',
        title: 'Trade Expiring Soon',
        data: {
          contains: trade.id
        },
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (!existingReminder) {
      await prisma.notification.create({
        data: {
          userId: trade.partner.ownerId,
          type: 'TRADE',
          title: 'Trade Expiring Soon',
          content: `Trade proposal from ${trade.initiator.name} expires in less than 24 hours`,
          data: JSON.stringify({ 
            tradeId: trade.id,
            expiresAt: trade.expiresAt.toISOString()
          })
        }
      });

      console.log(`[TradeProcessor] Sent reminder for trade ${trade.id}`);
    }
  }
}

/**
 * Clean up old completed trades (archive)
 */
async function cleanupOldTrades(): Promise<void> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  // Find old executed/cancelled/rejected trades
  const oldTrades = await prisma.trade.findMany({
    where: {
      status: {
        in: ['EXECUTED', 'CANCELLED', 'REJECTED', 'EXPIRED', 'VETOED']
      },
      updatedAt: {
        lt: sixMonthsAgo
      }
    }
  });

  if (oldTrades.length > 0) {
    console.log(`[TradeProcessor] Archiving ${oldTrades.length} old trades`);
    
    // In production, you might want to move these to an archive table
    // For now, we'll just log them
    for (const trade of oldTrades) {
      console.log(`[TradeProcessor] Would archive trade ${trade.id} from ${trade.updatedAt}`);
    }
  }
}

/**
 * Run processor as a scheduled job
 */
export async function startTradeProcessor(intervalMinutes: number = 60): void {
  console.log(`[TradeProcessor] Starting trade processor with ${intervalMinutes} minute interval`);
  
  // Run immediately
  await processTradeJobs();
  
  // Schedule recurring runs
  setInterval(async () => {
    try {
      await processTradeJobs();
    } catch (error) {
      console.error('[TradeProcessor] Error in scheduled job:', error);
    }
  }, intervalMinutes * 60 * 1000);
}

// Export for testing
export const testExports = {
  processExpiredTrades,
  processReviewPeriodEnded,
  executeTrade,
  sendTradeReminders,
  cleanupOldTrades
};