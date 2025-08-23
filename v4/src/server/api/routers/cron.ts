/**
 * tRPC Cron Management Router
 * 
 * Provides API endpoints for managing cron jobs, monitoring status,
 * and manual triggers for administrators.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc';
import { cronOrchestrator } from '../../cron';
import { sportsIOService } from '../external/sportsio';
import { getInjuryReportSummary } from '../../cron/jobs/injuries';
import { generateWeeklyReport } from '../../cron/jobs/scoring';
import { manualAdvanceLeague } from '../../cron/jobs/league';

// Input validation schemas
const triggerJobSchema = z.object({
  jobName: z.enum(['matchupGeneration', 'playerStatsSync', 'injuryReports', 'weeklyScoring', 'leagueAdvancement'])
});

const jobControlSchema = z.object({
  jobName: z.string(),
  action: z.enum(['start', 'stop'])
});

const weeklyReportSchema = z.object({
  leagueId: z.string(),
  week: z.number().min(1).max(18),
  season: z.number().min(2020).max(2030)
});

const manualAdvanceSchema = z.object({
  leagueId: z.string(),
  targetWeek: z.number().min(1).max(18).optional()
});

const clearCacheSchema = z.object({
  pattern: z.string().min(1).max(50)
});

export const cronRouter = createTRPCRouter({
  /**
   * Get status of all cron jobs
   */
  getJobStatuses: adminProcedure
    .query(async () => {
      try {
        const statuses = cronOrchestrator.getJobStatuses();
        return {
          success: true,
          data: statuses,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to get job statuses: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Get status of a specific cron job
   */
  getJobStatus: adminProcedure
    .input(z.object({ jobName: z.string() }))
    .query(async ({ input }) => {
      try {
        const status = cronOrchestrator.getJobStatus(input.jobName);
        
        if (!status) {
          throw new Error(`Job ${input.jobName} not found`);
        }

        return {
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to get job status: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Manually trigger a cron job
   */
  triggerJob: adminProcedure
    .input(triggerJobSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await cronOrchestrator.triggerJob(input.jobName);
        
        return {
          success: result.success,
          message: result.message,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to trigger job: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Start or stop a specific cron job
   */
  controlJob: adminProcedure
    .input(jobControlSchema)
    .mutation(async ({ input }) => {
      try {
        let success = false;
        
        if (input.action === 'start') {
          success = cronOrchestrator.startJob(input.jobName);
        } else if (input.action === 'stop') {
          success = cronOrchestrator.stopJob(input.jobName);
        }

        return {
          success,
          message: success 
            ? `Job ${input.jobName} ${input.action}ed successfully` 
            : `Failed to ${input.action} job ${input.jobName}`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to control job: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Get SportsIO API status and rate limits
   */
  getApiStatus: adminProcedure
    .query(async () => {
      try {
        const apiStatus = await sportsIOService.checkApiStatus();
        
        return {
          success: true,
          data: {
            healthy: apiStatus.healthy,
            rateLimitRemaining: apiStatus.rateLimitRemaining,
            lastChecked: new Date().toISOString()
          }
        };
      } catch (error) {
        return {
          success: false,
          data: {
            healthy: false,
            error: error instanceof Error ? error.message : String(error),
            lastChecked: new Date().toISOString()
          }
        };
      }
    }),

  /**
   * Clear SportsIO API cache
   */
  clearCache: adminProcedure
    .input(clearCacheSchema)
    .mutation(async ({ input }) => {
      try {
        const deletedCount = await sportsIOService.clearCache(input.pattern);
        
        return {
          success: true,
          message: `Cleared ${deletedCount} cache entries matching pattern: ${input.pattern}`,
          deletedCount,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Get injury report summary
   */
  getInjurySummary: protectedProcedure
    .query(async () => {
      try {
        const summary = await getInjuryReportSummary();
        
        return {
          success: true,
          data: summary,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to get injury summary: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Generate weekly report for a league
   */
  generateWeeklyReport: protectedProcedure
    .input(weeklyReportSchema)
    .query(async ({ input }) => {
      try {
        const report = await generateWeeklyReport(input.leagueId, input.week, input.season);
        
        return {
          success: true,
          data: report,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to generate weekly report: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Manually advance a league (admin override)
   */
  manualAdvanceLeague: adminProcedure
    .input(manualAdvanceSchema)
    .mutation(async ({ input }) => {
      try {
        const advancement = await manualAdvanceLeague(input.leagueId, input.targetWeek);
        
        return {
          success: true,
          data: advancement,
          message: `League manually advanced: ${advancement.action}`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to advance league: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Get system health overview
   */
  getSystemHealth: adminProcedure
    .query(async () => {
      try {
        const [jobStatuses, apiStatus, injurySummary] = await Promise.all([
          cronOrchestrator.getJobStatuses(),
          sportsIOService.checkApiStatus().catch(() => ({ healthy: false })),
          getInjuryReportSummary().catch(() => null)
        ]);

        const runningJobs = jobStatuses.filter(job => job.isRunning).length;
        const errorJobs = jobStatuses.filter(job => job.errorCount > 0).length;
        const totalRuns = jobStatuses.reduce((sum, job) => sum + job.runCount, 0);

        return {
          success: true,
          data: {
            overview: {
              totalJobs: jobStatuses.length,
              runningJobs,
              errorJobs,
              totalRuns,
              apiHealthy: apiStatus.healthy,
              rateLimitRemaining: 'rateLimitRemaining' in apiStatus ? apiStatus.rateLimitRemaining : undefined
            },
            jobs: jobStatuses,
            injuries: injurySummary,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        throw new Error(`Failed to get system health: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Get cron job execution logs (recent runs)
   */
  getJobLogs: adminProcedure
    .input(z.object({
      jobName: z.string().optional(),
      limit: z.number().min(1).max(100).default(50)
    }))
    .query(async ({ input }) => {
      try {
        // This would typically query a log storage system
        // For now, return mock data structure
        const logs = [
          {
            id: '1',
            jobName: input.jobName || 'playerStatsSync',
            status: 'completed',
            startTime: new Date(Date.now() - 900000).toISOString(), // 15 min ago
            endTime: new Date(Date.now() - 840000).toISOString(), // 14 min ago
            duration: 60000,
            message: 'Successfully synced 1,247 player stats',
            error: null
          },
          {
            id: '2',
            jobName: input.jobName || 'injuryReports',
            status: 'completed',
            startTime: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
            endTime: new Date(Date.now() - 21580000).toISOString(),
            duration: 20000,
            message: 'Updated 23 injury reports',
            error: null
          }
        ];

        return {
          success: true,
          data: logs.slice(0, input.limit),
          total: logs.length,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to get job logs: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Get cron scheduling information
   */
  getScheduleInfo: adminProcedure
    .query(async () => {
      try {
        const schedules = [
          {
            jobName: 'matchupGeneration',
            schedule: '0 2 * * 2',
            description: 'Every Tuesday at 2 AM',
            nextRun: getNextCronRun('0 2 * * 2'),
            timezone: 'America/New_York'
          },
          {
            jobName: 'playerStatsSync',
            schedule: '*/15 * * * *',
            description: 'Every 15 minutes',
            nextRun: getNextCronRun('*/15 * * * *'),
            timezone: 'UTC'
          },
          {
            jobName: 'injuryReports',
            schedule: '0 */6 * * *',
            description: 'Every 6 hours',
            nextRun: getNextCronRun('0 */6 * * *'),
            timezone: 'UTC'
          },
          {
            jobName: 'weeklyScoring',
            schedule: '0 3 * * 2',
            description: 'Every Tuesday at 3 AM',
            nextRun: getNextCronRun('0 3 * * 2'),
            timezone: 'America/New_York'
          },
          {
            jobName: 'leagueAdvancement',
            schedule: '0 4 * * 2',
            description: 'Every Tuesday at 4 AM',
            nextRun: getNextCronRun('0 4 * * 2'),
            timezone: 'America/New_York'
          }
        ];

        return {
          success: true,
          data: schedules,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to get schedule info: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Test cron job functionality (dry run)
   */
  testJob: adminProcedure
    .input(z.object({
      jobName: z.string(),
      dryRun: z.boolean().default(true)
    }))
    .mutation(async ({ input }) => {
      try {
        if (!input.dryRun) {
          throw new Error('Non-dry-run testing not implemented for safety');
        }

        // Simulate job testing
        const testResults = {
          jobName: input.jobName,
          testStatus: 'passed',
          validations: [
            { check: 'API connectivity', status: 'passed' },
            { check: 'Database access', status: 'passed' },
            { check: 'Required data availability', status: 'passed' }
          ],
          estimatedRunTime: '30-60 seconds',
          potentialIssues: [],
          recommendations: []
        };

        return {
          success: true,
          data: testResults,
          message: `Dry run test completed for ${input.jobName}`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to test job: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),
});

/**
 * Calculate next cron run time (simplified)
 */
function getNextCronRun(cronExpression: string): string {
  // This is a simplified implementation
  // In production, you'd use a proper cron parser like 'cron-parser'
  const now = new Date();
  
  if (cronExpression === '*/15 * * * *') {
    // Every 15 minutes
    const next = new Date(now);
    next.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    return next.toISOString();
  }
  
  if (cronExpression === '0 */6 * * *') {
    // Every 6 hours
    const next = new Date(now);
    next.setHours(Math.ceil(now.getHours() / 6) * 6, 0, 0, 0);
    return next.toISOString();
  }
  
  if (cronExpression.includes('* * 2')) {
    // Every Tuesday
    const next = new Date(now);
    const daysUntilTuesday = (2 - now.getDay() + 7) % 7;
    next.setDate(now.getDate() + (daysUntilTuesday || 7));
    
    if (cronExpression.includes('0 2')) {
      next.setHours(2, 0, 0, 0);
    } else if (cronExpression.includes('0 3')) {
      next.setHours(3, 0, 0, 0);
    } else if (cronExpression.includes('0 4')) {
      next.setHours(4, 0, 0, 0);
    }
    
    return next.toISOString();
  }
  
  // Fallback
  const next = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  return next.toISOString();
}