/**
 * Injury Report Updates Cron Job
 * 
 * Fetches the latest injury reports from SportsIO API,
 * updates player status, and sends notifications to affected team owners.
 * 
 * Runs: Every 6 hours during NFL season
 */

import { prisma as db } from '../../db';
import { sportsIOService, type SportsIOInjuryReport } from '../../api/external/sportsio';
import { differenceInHours, parseISO, format } from 'date-fns';

interface InjuryUpdate {
  playerId: string;
  status: string;
  injuryStatus?: string;
  injuryNotes?: string;
  practiceStatus?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  isNewInjury: boolean;
  isStatusChange: boolean;
}

interface PlayerInjuryData {
  id: string;
  externalId: string;
  displayName: string;
  position: string;
  nflTeam: string;
  status: string;
  injuryStatus?: string;
  injuryNotes?: string;
  updatedAt: Date;
}

/**
 * Main injury report update job handler
 */
export async function injuryReportJob(): Promise<void> {
  console.log('🏥 Starting injury report update...');

  try {
    const currentSeason = new Date().getFullYear();
    const currentWeek = getCurrentNFLWeek();

    // Fetch latest injury reports from SportsIO
    const injuryReports = await sportsIOService.getInjuryReports(currentSeason, currentWeek);
    
    if (injuryReports.length === 0) {
      console.log('🏥 No injury reports found for current week');
      return;
    }

    console.log(`🏥 Processing ${injuryReports.length} injury reports`);

    // Process injury updates
    const injuryUpdates = await processInjuryReports(injuryReports);
    
    // Update player statuses in database
    await updatePlayerInjuryStatuses(injuryUpdates);
    
    // Send notifications for significant injuries
    await sendInjuryNotifications(injuryUpdates);
    
    // Clean up old injury data
    await cleanupOldInjuryData();

    console.log('✅ Injury report update completed');
  } catch (error) {
    console.error('❌ Injury report update failed:', error);
    throw error;
  }
}

/**
 * Process injury reports and determine updates needed
 */
async function processInjuryReports(reports: SportsIOInjuryReport[]): Promise<InjuryUpdate[]> {
  const updates: InjuryUpdate[] = [];

  for (const report of reports) {
    try {
      // Find player in our database
      const player = await findPlayerByExternalId(report.PlayerID.toString());
      if (!player) {
        console.warn(`⚠️  Player not found for injury report: ${report.Name} (ID: ${report.PlayerID})`);
        continue;
      }

      // Determine if this is a new injury or status change
      const currentStatus = player.status;
      const currentInjuryStatus = player.injuryStatus;
      const newStatus = mapInjuryStatusToPlayerStatus(report.Status);
      const newInjuryStatus = report.Status;

      const isNewInjury = !currentInjuryStatus && newInjuryStatus && newInjuryStatus !== 'Active';
      const isStatusChange = currentInjuryStatus !== newInjuryStatus;

      if (isNewInjury || isStatusChange || needsUpdate(player, report)) {
        updates.push({
          playerId: player.id,
          status: newStatus,
          injuryStatus: newInjuryStatus,
          injuryNotes: report.Notes || undefined,
          practiceStatus: report.PracticeStatus || undefined,
          severity: determineInjurySeverity(report),
          isNewInjury,
          isStatusChange
        });
      }
    } catch (error) {
      console.error(`❌ Error processing injury report for ${report.Name}:`, error);
    }
  }

  console.log(`🏥 Found ${updates.length} injury updates to process`);
  return updates;
}

/**
 * Find player by external API ID
 */
async function findPlayerByExternalId(externalId: string): Promise<PlayerInjuryData | null> {
  try {
    return await db.player.findUnique({
      where: { externalId },
      select: {
        id: true,
        externalId: true,
        displayName: true,
        position: true,
        nflTeam: true,
        status: true,
        injuryStatus: true,
        injuryNotes: true,
        updatedAt: true
      }
    });
  } catch (error) {
    console.error(`❌ Error finding player with external ID ${externalId}:`, error);
    return null;
  }
}

/**
 * Map SportsIO injury status to our player status
 */
function mapInjuryStatusToPlayerStatus(injuryStatus: string): string {
  switch (injuryStatus.toLowerCase()) {
    case 'out':
    case 'inactive':
      return 'OUT';
    case 'doubtful':
      return 'DOUBTFUL';
    case 'questionable':
      return 'QUESTIONABLE';
    case 'probable':
    case 'active':
    case 'healthy':
      return 'ACTIVE';
    case 'injured reserve':
    case 'ir':
      return 'IR';
    case 'suspended':
      return 'SUSPENDED';
    case 'retired':
      return 'RETIRED';
    default:
      return 'ACTIVE';
  }
}

/**
 * Determine injury severity level
 */
function determineInjurySeverity(report: SportsIOInjuryReport): 'LOW' | 'MEDIUM' | 'HIGH' {
  const status = report.Status.toLowerCase();
  const notes = (report.Notes || '').toLowerCase();
  
  // High severity indicators
  if (status.includes('out') || 
      status.includes('ir') || 
      status.includes('injured reserve') ||
      notes.includes('season-ending') ||
      notes.includes('surgery') ||
      notes.includes('torn') ||
      notes.includes('broken') ||
      notes.includes('fracture')) {
    return 'HIGH';
  }
  
  // Medium severity indicators
  if (status.includes('doubtful') ||
      notes.includes('week-to-week') ||
      notes.includes('multiple weeks') ||
      notes.includes('significant')) {
    return 'MEDIUM';
  }
  
  // Low severity (questionable, probable, day-to-day)
  return 'LOW';
}

/**
 * Check if player data needs updating
 */
function needsUpdate(player: PlayerInjuryData, report: SportsIOInjuryReport): boolean {
  // Update if notes have changed significantly
  const oldNotes = player.injuryNotes || '';
  const newNotes = report.Notes || '';
  
  if (oldNotes !== newNotes) return true;
  
  // Update if it's been more than 24 hours since last update
  const hoursSinceUpdate = differenceInHours(new Date(), player.updatedAt);
  return hoursSinceUpdate > 24;
}

/**
 * Update player injury statuses in database
 */
async function updatePlayerInjuryStatuses(updates: InjuryUpdate[]): Promise<void> {
  if (updates.length === 0) return;

  console.log(`💾 Updating ${updates.length} player injury statuses`);

  for (const update of updates) {
    try {
      await db.player.update({
        where: { id: update.playerId },
        data: {
          status: update.status,
          injuryStatus: update.injuryStatus,
          injuryNotes: update.injuryNotes,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error(`❌ Failed to update player ${update.playerId}:`, error);
    }
  }

  console.log(`✅ Successfully updated ${updates.length} player statuses`);
}

/**
 * Send injury notifications to affected team owners
 */
async function sendInjuryNotifications(updates: InjuryUpdate[]): Promise<void> {
  console.log('📧 Sending injury notifications...');

  // Filter for significant injuries that warrant notifications
  const significantUpdates = updates.filter(update => 
    update.isNewInjury || 
    (update.isStatusChange && ['HIGH', 'MEDIUM'].includes(update.severity))
  );

  if (significantUpdates.length === 0) {
    console.log('📧 No significant injuries to notify about');
    return;
  }

  for (const update of significantUpdates) {
    try {
      await notifyTeamOwnersOfInjury(update);
    } catch (error) {
      console.error(`❌ Failed to send injury notification for player ${update.playerId}:`, error);
    }
  }

  console.log(`📧 Sent notifications for ${significantUpdates.length} injury updates`);
}

/**
 * Notify team owners of player injury
 */
async function notifyTeamOwnersOfInjury(update: InjuryUpdate): Promise<void> {
  // Find all teams that have this player on their roster
  const currentSeason = new Date().getFullYear();
  const currentWeek = getCurrentNFLWeek();

  const teamsWithPlayer = await db.roster.findMany({
    where: {
      playerId: update.playerId,
      season: currentSeason,
      week: { gte: currentWeek - 1 } // Check current and previous week
    },
    include: {
      team: {
        include: {
          owner: {
            select: { id: true, username: true }
          },
          league: {
            select: { id: true, name: true }
          }
        }
      },
      player: {
        select: {
          displayName: true,
          position: true,
          nflTeam: true
        }
      }
    },
    distinct: ['teamId'] // Only one notification per team
  });

  for (const roster of teamsWithPlayer) {
    const { team, player } = roster;
    
    // Determine notification message based on injury type
    const { title, content, priority } = generateInjuryNotificationContent(
      player, 
      update, 
      team.league.name
    );

    // Create notification
    await db.notification.create({
      data: {
        userId: team.owner.id,
        type: 'INJURY',
        title,
        content,
        category: 'WARNING',
        priority,
        iconType: 'alert-triangle',
        data: JSON.stringify({
          playerId: update.playerId,
          playerName: player.displayName,
          position: player.position,
          team: player.nflTeam,
          leagueId: team.league.id,
          teamId: team.id,
          injuryStatus: update.injuryStatus,
          severity: update.severity
        })
      }
    });
  }
}

/**
 * Generate notification content for injury update
 */
function generateInjuryNotificationContent(
  player: any, 
  update: InjuryUpdate, 
  leagueName: string
): { title: string; content: string; priority: string } {
  const playerName = `${player.displayName} (${player.position} - ${player.nflTeam})`;
  
  if (update.isNewInjury) {
    return {
      title: `🏥 New Injury: ${player.displayName}`,
      content: `${playerName} has been added to the injury report with status: ${update.injuryStatus}. Check your lineup for ${leagueName}.`,
      priority: update.severity === 'HIGH' ? 'URGENT' : 'HIGH'
    };
  }
  
  if (update.isStatusChange) {
    return {
      title: `🏥 Injury Update: ${player.displayName}`,
      content: `${playerName} injury status updated to: ${update.injuryStatus}. Review your lineup for ${leagueName}.`,
      priority: update.severity === 'HIGH' ? 'URGENT' : 'NORMAL'
    };
  }
  
  return {
    title: `🏥 Injury Report: ${player.displayName}`,
    content: `Updated injury information available for ${playerName} in ${leagueName}.`,
    priority: 'NORMAL'
  };
}

/**
 * Clean up old injury data (remove resolved injuries older than 2 weeks)
 */
async function cleanupOldInjuryData(): Promise<void> {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Clear injury status for players marked as active for more than 2 weeks
    const clearedCount = await db.player.updateMany({
      where: {
        injuryStatus: { not: null },
        status: 'ACTIVE',
        updatedAt: { lt: twoWeeksAgo }
      },
      data: {
        injuryStatus: null,
        injuryNotes: null
      }
    });

    if (clearedCount.count > 0) {
      console.log(`🗑️  Cleaned up ${clearedCount.count} resolved injury records`);
    }
  } catch (error) {
    console.error('❌ Failed to cleanup old injury data:', error);
  }
}

/**
 * Get current NFL week
 */
function getCurrentNFLWeek(): number {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st approximation
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.ceil(daysSinceStart / 7);
  return Math.max(1, Math.min(18, week));
}

/**
 * Get injury report summary for admin dashboard
 */
export async function getInjuryReportSummary(): Promise<{
  totalInjuries: number;
  newThisWeek: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
}> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [totalInjuries, newThisWeek, statusCounts] = await Promise.all([
      // Total current injuries
      db.player.count({
        where: {
          injuryStatus: { not: null },
          status: { not: 'ACTIVE' }
        }
      }),
      
      // New injuries this week
      db.player.count({
        where: {
          injuryStatus: { not: null },
          updatedAt: { gte: oneWeekAgo }
        }
      }),
      
      // Group by status
      db.player.groupBy({
        by: ['injuryStatus'],
        where: {
          injuryStatus: { not: null }
        },
        _count: true
      })
    ]);

    const byStatus = statusCounts.reduce((acc, item) => {
      if (item.injuryStatus) {
        acc[item.injuryStatus] = item._count;
      }
      return acc;
    }, {} as Record<string, number>);

    // Estimate severity distribution
    const bySeverity = {
      HIGH: (byStatus['OUT'] || 0) + (byStatus['IR'] || 0),
      MEDIUM: (byStatus['DOUBTFUL'] || 0),
      LOW: (byStatus['QUESTIONABLE'] || 0)
    };

    return {
      totalInjuries,
      newThisWeek,
      byStatus,
      bySeverity
    };
  } catch (error) {
    console.error('❌ Failed to get injury report summary:', error);
    return {
      totalInjuries: 0,
      newThisWeek: 0,
      byStatus: {},
      bySeverity: {}
    };
  }
}