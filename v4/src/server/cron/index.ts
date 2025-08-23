/**
 * Astral Draft V4 - Cron Job Orchestrator
 * 
 * Central coordinator for all automated cron jobs in the fantasy football platform.
 * Handles scheduling, monitoring, and management of automated tasks.
 */

import * as cron from 'node-cron';
import { prisma as db } from '../db';
import { Redis } from 'ioredis';

// Import all cron job modules
import { matchupGenerationJob } from './jobs/matchups';
import { playerStatsSyncJob } from './jobs/stats';
import { injuryReportJob } from './jobs/injuries';
import { weeklyScoringJob } from './jobs/scoring';
import { leagueAdvancementJob } from './jobs/league';

interface CronJobConfig {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  enabled: boolean;
  description: string;
  timezone?: string;
}

interface CronJobStatus {
  name: string;
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
  lastError?: string;
  runCount: number;
  errorCount: number;
}

class CronOrchestrator {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private jobStatuses: Map<string, CronJobStatus> = new Map();
  private redis: Redis;
  private isShuttingDown = false;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.setupGracefulShutdown();
  }

  /**
   * Initialize and start all cron jobs
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Astral Draft Cron System...');

    const cronJobConfigs: CronJobConfig[] = [
      {
        name: 'matchupGeneration',
        schedule: '0 2 * * 2', // Every Tuesday at 2 AM (after Monday Night Football)
        handler: matchupGenerationJob,
        enabled: true,
        description: 'Generate weekly matchups and handle bye weeks',
        timezone: 'America/New_York'
      },
      {
        name: 'playerStatsSync',
        schedule: '*/15 * * * *', // Every 15 minutes during season
        handler: playerStatsSyncJob,
        enabled: true,
        description: 'Sync player stats from SportsIO API'
      },
      {
        name: 'injuryReports',
        schedule: '0 */6 * * *', // Every 6 hours
        handler: injuryReportJob,
        enabled: true,
        description: 'Update player injury status and notifications'
      },
      {
        name: 'weeklyScoring',
        schedule: '0 3 * * 2', // Every Tuesday at 3 AM
        handler: weeklyScoringJob,
        enabled: true,
        description: 'Calculate weekly fantasy scores and update standings'
      },
      {
        name: 'leagueAdvancement',
        schedule: '0 4 * * 2', // Every Tuesday at 4 AM
        handler: leagueAdvancementJob,
        enabled: true,
        description: 'Advance league weeks and handle playoff transitions'
      }
    ];

    // Schedule all jobs
    for (const config of cronJobConfigs) {
      await this.scheduleJob(config);
    }

    console.log(`✅ Cron system initialized with ${cronJobConfigs.length} jobs`);
  }

  /**
   * Schedule a single cron job
   */
  private async scheduleJob(config: CronJobConfig): Promise<void> {
    if (!config.enabled) {
      console.log(`⏸️  Skipping disabled job: ${config.name}`);
      return;
    }

    try {
      const task = cron.schedule(config.schedule, async () => {
        if (this.isShuttingDown) return;
        await this.executeJob(config.name, config.handler);
      }, {
        timezone: config.timezone || 'UTC'
      });

      this.jobs.set(config.name, task);
      this.jobStatuses.set(config.name, {
        name: config.name,
        isRunning: false,
        runCount: 0,
        errorCount: 0
      });

      console.log(`📅 Scheduled job: ${config.name} (${config.schedule})`);
    } catch (error) {
      console.error(`❌ Failed to schedule job ${config.name}:`, error);
    }
  }

  /**
   * Execute a cron job with error handling and monitoring
   */
  private async executeJob(jobName: string, handler: () => Promise<void>): Promise<void> {
    const status = this.jobStatuses.get(jobName);
    if (!status) return;

    if (status.isRunning) {
      console.warn(`⚠️  Job ${jobName} is already running, skipping execution`);
      return;
    }

    console.log(`🏃 Starting job: ${jobName}`);
    const startTime = Date.now();

    try {
      // Update status
      status.isRunning = true;
      status.lastRun = new Date();
      this.jobStatuses.set(jobName, status);

      // Store job start in Redis for monitoring
      await this.redis.setex(`cron:${jobName}:status`, 3600, JSON.stringify({
        status: 'running',
        startTime: startTime,
        pid: process.pid
      }));

      // Execute the job
      await handler();

      // Update success status
      status.runCount++;
      status.isRunning = false;
      status.lastError = undefined;

      const duration = Date.now() - startTime;
      console.log(`✅ Job ${jobName} completed successfully in ${duration}ms`);

      // Store success metrics
      await this.redis.setex(`cron:${jobName}:status`, 3600, JSON.stringify({
        status: 'completed',
        duration: duration,
        completedAt: Date.now()
      }));

    } catch (error) {
      // Update error status
      status.errorCount++;
      status.isRunning = false;
      status.lastError = error instanceof Error ? error.message : String(error);

      const duration = Date.now() - startTime;
      console.error(`❌ Job ${jobName} failed after ${duration}ms:`, error);

      // Store error metrics
      await this.redis.setex(`cron:${jobName}:status`, 3600, JSON.stringify({
        status: 'error',
        error: status.lastError,
        duration: duration,
        failedAt: Date.now()
      }));

      // TODO: Send notification to administrators
      await this.notifyAdminsOfFailure(jobName, status.lastError);
    }

    this.jobStatuses.set(jobName, status);
  }

  /**
   * Manually trigger a job (for testing or admin override)
   */
  public async triggerJob(jobName: string): Promise<{ success: boolean; message: string }> {
    const jobConfigs: Record<string, () => Promise<void>> = {
      matchupGeneration: matchupGenerationJob,
      playerStatsSync: playerStatsSyncJob,
      injuryReports: injuryReportJob,
      weeklyScoring: weeklyScoringJob,
      leagueAdvancement: leagueAdvancementJob
    };

    const handler = jobConfigs[jobName];
    if (!handler) {
      return { success: false, message: `Job ${jobName} not found` };
    }

    try {
      await this.executeJob(jobName, handler);
      return { success: true, message: `Job ${jobName} triggered successfully` };
    } catch (error) {
      return { 
        success: false, 
        message: `Job ${jobName} failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Get status of all cron jobs
   */
  public getJobStatuses(): CronJobStatus[] {
    return Array.from(this.jobStatuses.values());
  }

  /**
   * Get status of a specific job
   */
  public getJobStatus(jobName: string): CronJobStatus | null {
    return this.jobStatuses.get(jobName) || null;
  }

  /**
   * Stop a specific job
   */
  public stopJob(jobName: string): boolean {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      console.log(`🛑 Stopped job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Start a specific job
   */
  public startJob(jobName: string): boolean {
    const job = this.jobs.get(jobName);
    if (job) {
      job.start();
      console.log(`▶️  Started job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Stop all cron jobs
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down cron orchestrator...');
    this.isShuttingDown = true;

    // Stop all jobs
    for (const [name, job] of Array.from(this.jobs.entries())) {
      job.stop();
      console.log(`🛑 Stopped job: ${name}`);
    }

    // Wait for running jobs to complete (with timeout)
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const runningJobs = Array.from(this.jobStatuses.values())
        .filter(status => status.isRunning);
      
      if (runningJobs.length === 0) break;
      
      console.log(`⏳ Waiting for ${runningJobs.length} jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Close Redis connection
    await this.redis.quit();
    console.log('✅ Cron orchestrator shut down complete');
  }

  /**
   * Notify administrators of job failures
   */
  private async notifyAdminsOfFailure(jobName: string, error: string): Promise<void> {
    try {
      // Find all admin users
      const admins = await db.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] }
        },
        select: { id: true, email: true, username: true }
      });

      // Create notifications for each admin
      for (const admin of admins) {
        await db.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM',
            title: `Cron Job Failure: ${jobName}`,
            content: `The ${jobName} cron job has failed with error: ${error}`,
            category: 'ERROR',
            priority: 'URGENT',
            iconType: 'alert-triangle'
          }
        });
      }
    } catch (notificationError) {
      console.error('Failed to send admin notifications:', notificationError);
    }
  }

  /**
   * Setup graceful shutdown handling
   */
  private setupGracefulShutdown(): void {
    const handleShutdown = async (signal: string) => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGUSR2', () => handleShutdown('SIGUSR2')); // nodemon restart
  }
}

// Global orchestrator instance
export const cronOrchestrator = new CronOrchestrator();

// Auto-initialize in production
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
  cronOrchestrator.initialize().catch(console.error);
}

export default cronOrchestrator;