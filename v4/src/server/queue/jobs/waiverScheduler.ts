/**
 * Waiver Scheduler Job
 * Automatically processes waivers based on league settings
 */

import { prisma } from '../../db';
import { addJob } from '../../queue';
import cron from 'node-cron';

interface ScheduledWaiverJob {
  leagueId: string;
  schedule: string; // cron expression or time
  enabled: boolean;
}

// Store active cron jobs
const activeJobs = new Map<string, cron.ScheduledTask>();

/**
 * Initialize waiver processing schedules for all active leagues
 */
export async function initializeWaiverSchedules() {
  console.log('[Waiver Scheduler] Initializing waiver processing schedules...');
  
  try {
    // Get all active leagues with waiver settings
    const leagues = await prisma.league.findMany({
      where: {
        status: {
          in: ['IN_SEASON', 'PLAYOFFS'],
        },
      },
      select: {
        id: true,
        name: true,
        waiverType: true,
        waiverPeriod: true,
        scoringRules: true,
      },
    });
    
    console.log(`[Waiver Scheduler] Found ${leagues.length} active leagues`);
    
    for (const league of leagues) {
      const settings = league.scoringRules ? JSON.parse(league.scoringRules) : {};
      const schedule = settings.processSchedule || getDefaultSchedule(league.waiverPeriod);
      
      if (schedule) {
        scheduleWaiverProcessing({
          leagueId: league.id,
          schedule,
          enabled: true,
        });
      }
    }
    
    console.log('[Waiver Scheduler] Initialization complete');
  } catch (error) {
    console.error('[Waiver Scheduler] Failed to initialize:', error);
  }
}

/**
 * Schedule waiver processing for a specific league
 */
export function scheduleWaiverProcessing(config: ScheduledWaiverJob) {
  const { leagueId, schedule, enabled } = config;
  
  // Cancel existing job if any
  cancelWaiverSchedule(leagueId);
  
  if (!enabled) {
    console.log(`[Waiver Scheduler] Waiver processing disabled for league ${leagueId}`);
    return;
  }
  
  try {
    // Parse schedule - can be cron expression or time format
    const cronExpression = parseToCronExpression(schedule);
    
    if (!cron.validate(cronExpression)) {
      console.error(`[Waiver Scheduler] Invalid cron expression: ${cronExpression}`);
      return;
    }
    
    // Create scheduled task
    const task = cron.schedule(cronExpression, async () => {
      console.log(`[Waiver Scheduler] Running scheduled waiver processing for league ${leagueId}`);
      
      try {
        // Add waiver processing job to queue
        await addJob('processWaiverClaims', {
          leagueId,
          force: false,
        });
        
        // Log execution
        await logWaiverExecution(leagueId, 'SCHEDULED');
      } catch (error) {
        console.error(`[Waiver Scheduler] Failed to queue waiver processing for league ${leagueId}:`, error);
        await logWaiverExecution(leagueId, 'FAILED', error);
      }
    });
    
    // Store the job
    activeJobs.set(leagueId, task);
    
    console.log(`[Waiver Scheduler] Scheduled waiver processing for league ${leagueId} with schedule: ${cronExpression}`);
  } catch (error) {
    console.error(`[Waiver Scheduler] Failed to schedule for league ${leagueId}:`, error);
  }
}

/**
 * Cancel waiver processing schedule for a league
 */
export function cancelWaiverSchedule(leagueId: string) {
  const existingJob = activeJobs.get(leagueId);
  
  if (existingJob) {
    existingJob.stop();
    activeJobs.delete(leagueId);
    console.log(`[Waiver Scheduler] Cancelled waiver schedule for league ${leagueId}`);
  }
}

/**
 * Update waiver processing schedule
 */
export async function updateWaiverSchedule(leagueId: string) {
  try {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        status: true,
        scoringRules: true,
        waiverPeriod: true,
      },
    });
    
    if (!league) {
      cancelWaiverSchedule(leagueId);
      return;
    }
    
    // Only schedule for active leagues
    if (!['IN_SEASON', 'PLAYOFFS'].includes(league.status)) {
      cancelWaiverSchedule(leagueId);
      return;
    }
    
    const settings = league.scoringRules ? JSON.parse(league.scoringRules) : {};
    const schedule = settings.processSchedule || getDefaultSchedule(league.waiverPeriod);
    
    scheduleWaiverProcessing({
      leagueId,
      schedule,
      enabled: settings.waiverProcessingEnabled !== false,
    });
  } catch (error) {
    console.error(`[Waiver Scheduler] Failed to update schedule for league ${leagueId}:`, error);
  }
}

/**
 * Get default schedule based on waiver period
 */
function getDefaultSchedule(waiverPeriod: number): string {
  // Default schedules based on waiver period
  switch (waiverPeriod) {
    case 1:
      // Daily waivers - process at 3 AM every day
      return '0 3 * * *';
    case 2:
      // 2-day waivers - process Wednesday and Saturday at 3 AM
      return '0 3 * * 3,6';
    case 3:
      // 3-day waivers - process Wednesday at 3 AM
      return '0 3 * * 3';
    default:
      // Default to Wednesday 3 AM
      return '0 3 * * 3';
  }
}

/**
 * Parse various schedule formats to cron expression
 */
function parseToCronExpression(schedule: string): string {
  // If already a cron expression, return as-is
  if (schedule.includes('*') || schedule.split(' ').length === 5) {
    return schedule;
  }
  
  // Parse time formats (e.g., "03:00", "3:00 AM", "Wednesday 3:00 AM")
  const timeMatch = schedule.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]);
    const period = timeMatch[3];
    
    // Convert to 24-hour format
    if (period) {
      if (period.toUpperCase() === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period.toUpperCase() === 'AM' && hour === 12) {
        hour = 0;
      }
    }
    
    // Check for day of week
    const dayMatch = schedule.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    const dayOfWeek = dayMatch ? getDayOfWeekNumber(dayMatch[1]) : '*';
    
    return `${minute} ${hour} * * ${dayOfWeek}`;
  }
  
  // Default to Wednesday 3 AM if unparseable
  console.warn(`[Waiver Scheduler] Could not parse schedule "${schedule}", using default`);
  return '0 3 * * 3';
}

/**
 * Convert day name to cron day number
 */
function getDayOfWeekNumber(day: string): string {
  const days: Record<string, string> = {
    sunday: '0',
    monday: '1',
    tuesday: '2',
    wednesday: '3',
    thursday: '4',
    friday: '5',
    saturday: '6',
  };
  
  return days[day.toLowerCase()] || '3';
}

/**
 * Log waiver execution for auditing
 */
async function logWaiverExecution(
  leagueId: string,
  status: 'SCHEDULED' | 'MANUAL' | 'FAILED',
  error?: any
) {
  try {
    // You could store this in a separate audit table
    // For now, we'll just log it
    const logEntry = {
      leagueId,
      status,
      timestamp: new Date(),
      error: error ? (error instanceof Error ? error.message : String(error)) : null,
    };
    
    console.log('[Waiver Scheduler] Execution log:', logEntry);
    
    // Optionally store in database for audit trail
    // await prisma.waiverExecutionLog.create({ data: logEntry });
  } catch (logError) {
    console.error('[Waiver Scheduler] Failed to log execution:', logError);
  }
}

/**
 * Get status of all scheduled waiver jobs
 */
export function getScheduledJobs(): Array<{ leagueId: string; active: boolean }> {
  const jobs = [];
  
  for (const [leagueId, task] of activeJobs.entries()) {
    jobs.push({
      leagueId,
      active: task.getStatus() === 'scheduled',
    });
  }
  
  return jobs;
}

/**
 * Cleanup all scheduled jobs (for graceful shutdown)
 */
export function cleanupAllSchedules() {
  console.log('[Waiver Scheduler] Cleaning up all scheduled jobs...');
  
  for (const [leagueId, task] of activeJobs.entries()) {
    task.stop();
    console.log(`[Waiver Scheduler] Stopped schedule for league ${leagueId}`);
  }
  
  activeJobs.clear();
  console.log('[Waiver Scheduler] All schedules cleaned up');
}