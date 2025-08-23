/**
 * BullMQ job queue configuration for background processing
 */

import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../redis';
import { prisma } from '../db';
import { processWaiverClaims } from './jobs/waivers';
import { updatePlayerStats } from './jobs/stats';
import { sendNotification } from './jobs/notifications';
import { calculateFantasyPoints } from './jobs/scoring';
import { processTradeExpiration } from './jobs/trades';

// Queue configuration
const defaultJobOptions = {
  removeOnComplete: {
    age: 24 * 3600, // 24 hours
    count: 100,
  },
  removeOnFail: {
    age: 24 * 3600 * 7, // 7 days
  },
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
};

// Create queues for different job types
export const queues = {
  waivers: new Queue('waivers', {
    connection: redis,
    defaultJobOptions,
  }),
  
  stats: new Queue('stats', {
    connection: redis,
    defaultJobOptions,
  }),
  
  notifications: new Queue('notifications', {
    connection: redis,
    defaultJobOptions: {
      ...defaultJobOptions,
      attempts: 5,
    },
  }),
  
  scoring: new Queue('scoring', {
    connection: redis,
    defaultJobOptions,
  }),
  
  trades: new Queue('trades', {
    connection: redis,
    defaultJobOptions,
  }),
  
  general: new Queue('general', {
    connection: redis,
    defaultJobOptions,
  }),
};

// Note: QueueScheduler is deprecated in BullMQ v4+
// Scheduling functionality is now built into Queue itself

// Worker configurations
export const workers = {
  waivers: new Worker(
    'waivers',
    async (job: Job) => {
      console.log(`Processing waiver job ${job.id}`);
      return processWaiverClaims(job.data);
    },
    {
      connection: redis,
      concurrency: 5,
    }
  ),
  
  stats: new Worker(
    'stats',
    async (job: Job) => {
      console.log(`Processing stats job ${job.id}`);
      return updatePlayerStats(job.data);
    },
    {
      connection: redis,
      concurrency: 10,
    }
  ),
  
  notifications: new Worker(
    'notifications',
    async (job: Job) => {
      console.log(`Processing notification job ${job.id}`);
      return sendNotification(job.data);
    },
    {
      connection: redis,
      concurrency: 20,
    }
  ),
  
  scoring: new Worker(
    'scoring',
    async (job: Job) => {
      console.log(`Processing scoring job ${job.id}`);
      return calculateFantasyPoints(job.data);
    },
    {
      connection: redis,
      concurrency: 10,
    }
  ),
  
  trades: new Worker(
    'trades',
    async (job: Job) => {
      console.log(`Processing trade job ${job.id}`);
      return processTradeExpiration(job.data);
    },
    {
      connection: redis,
      concurrency: 5,
    }
  ),
};

// Job scheduling functions
export const scheduleJobs = {
  /**
   * Schedule waiver processing for a specific league
   */
  async scheduleWaiverProcessing(leagueId: string, processAt: Date) {
    return queues.waivers.add(
      'process-waivers',
      { leagueId },
      {
        delay: processAt.getTime() - Date.now(),
        jobId: `waiver-${leagueId}-${processAt.getTime()}`,
      }
    );
  },
  
  /**
   * Schedule player stats update
   */
  async scheduleStatsUpdate(week: number, season: number) {
    return queues.stats.add(
      'update-stats',
      { week, season },
      {
        repeat: {
          pattern: '*/15 * * * *', // Every 15 minutes during games
        },
        jobId: `stats-${season}-${week}`,
      }
    );
  },
  
  /**
   * Schedule notification
   */
  async scheduleNotification(userId: string, notification: any, sendAt?: Date) {
    const options = sendAt 
      ? { delay: sendAt.getTime() - Date.now() }
      : {};
      
    return queues.notifications.add(
      'send-notification',
      { userId, notification },
      options
    );
  },
  
  /**
   * Schedule fantasy points calculation
   */
  async scheduleScoring(leagueId: string, week: number) {
    return queues.scoring.add(
      'calculate-scores',
      { leagueId, week },
      {
        repeat: {
          pattern: '*/5 * * * * SUN', // Every 5 minutes on Sunday
        },
        jobId: `scoring-${leagueId}-${week}`,
      }
    );
  },
  
  /**
   * Schedule trade expiration check
   */
  async scheduleTradeExpiration(tradeId: string, expiresAt: Date) {
    return queues.trades.add(
      'expire-trade',
      { tradeId },
      {
        delay: expiresAt.getTime() - Date.now(),
        jobId: `trade-expire-${tradeId}`,
      }
    );
  },
};

// Worker event handlers
Object.values(workers).forEach((worker) => {
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
  
  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });
});

// Helper function to add jobs to queues
export async function addJob(jobType: string, data: any, options?: any) {
  switch (jobType) {
    case 'processWaiverClaims':
      return queues.waivers.add('process-waivers', data, options);
    case 'updatePlayerStats':
      return queues.stats.add('update-stats', data, options);
    case 'sendNotification':
      return queues.notifications.add('send-notification', data, options);
    case 'calculateFantasyPoints':
      return queues.scoring.add('calculate-scores', data, options);
    case 'processTradeExpiration':
      return queues.trades.add('expire-trade', data, options);
    default:
      return queues.general.add(jobType, data, options);
  }
}

// Graceful shutdown
export const shutdownQueues = async () => {
  console.log('Shutting down queues...');
  
  // Close all workers
  await Promise.all(Object.values(workers).map(w => w.close()));
  
  // Close all schedulers
  await Promise.all(Object.values(schedulers).map(s => s.close()));
  
  // Close all queues
  await Promise.all(Object.values(queues).map(q => q.close()));
  
  console.log('Queues shut down successfully');
};

process.on('SIGTERM', shutdownQueues);
process.on('SIGINT', shutdownQueues);