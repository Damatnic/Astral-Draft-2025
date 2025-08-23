/**
 * Automated League Advancement Cron Job
 * 
 * Handles league progression through the season:
 * - Advances weeks automatically
 * - Manages playoff transitions
 * - Handles season completion and archiving
 * - Awards championships and final standings
 * 
 * Runs: Every Tuesday at 4 AM (after scoring and matchups are complete)
 */

import { prisma as db } from '../../db';
import { generateWeeklyReport } from './scoring';
import { sportsIOService } from '../../api/external/sportsio';
import { addDays, format } from 'date-fns';

interface LeagueAdvancement {
  leagueId: string;
  leagueName: string;
  action: 'ADVANCE_WEEK' | 'START_PLAYOFFS' | 'ADVANCE_PLAYOFF' | 'COMPLETE_SEASON' | 'NO_ACTION';
  fromWeek: number;
  toWeek: number;
  fromStatus: string;
  toStatus: string;
  details?: string;
}

interface ChampionshipResult {
  leagueId: string;
  championTeamId: string;
  runnerUpTeamId: string;
  championshipScore: { winner: number; runnerUp: number };
  finalStandings: Array<{
    teamId: string;
    teamName: string;
    ownerName: string;
    finalRank: number;
    wins: number;
    losses: number;
    pointsFor: number;
  }>;
}

/**
 * Main league advancement job handler
 */
export async function leagueAdvancementJob(): Promise<void> {
  console.log('🏆 Starting automated league advancement...');

  try {
    const currentSeason = new Date().getFullYear();
    const currentNFLWeek = getCurrentNFLWeek();

    // Get all active leagues that might need advancement
    const activeLeagues = await db.league.findMany({
      where: {
        status: { in: ['IN_SEASON', 'PLAYOFFS'] },
        season: currentSeason
      },
      include: {
        teams: {
          include: {
            owner: {
              select: { username: true, id: true }
            }
          },
          orderBy: { standing: 'asc' }
        },
        matchups: {
          where: {
            season: currentSeason
          },
          orderBy: { week: 'desc' },
          take: 10 // Get recent matchups
        }
      }
    });

    console.log(`🏆 Evaluating ${activeLeagues.length} leagues for advancement`);

    const advancements: LeagueAdvancement[] = [];

    for (const league of activeLeagues) {
      try {
        const advancement = await evaluateLeagueAdvancement(league, currentNFLWeek);
        if (advancement.action !== 'NO_ACTION') {
          advancements.push(advancement);
          await executeLeagueAdvancement(advancement);
        }
      } catch (error) {
        console.error(`❌ Failed to advance league ${league.name}:`, error);
      }
    }

    // Send advancement notifications
    await sendAdvancementNotifications(advancements);

    console.log(`✅ League advancement completed: ${advancements.length} leagues advanced`);
  } catch (error) {
    console.error('❌ League advancement job failed:', error);
    throw error;
  }
}

/**
 * Evaluate if a league needs advancement and determine the action
 */
async function evaluateLeagueAdvancement(league: any, currentNFLWeek: number): Promise<LeagueAdvancement> {
  const baseAdvancement: LeagueAdvancement = {
    leagueId: league.id,
    leagueName: league.name,
    action: 'NO_ACTION',
    fromWeek: league.currentWeek,
    toWeek: league.currentWeek,
    fromStatus: league.status,
    toStatus: league.status
  };

  // Check if league is behind NFL schedule
  if (league.currentWeek < currentNFLWeek - 1) {
    console.log(`📅 League ${league.name} is behind NFL schedule (${league.currentWeek} vs ${currentNFLWeek})`);
  }

  // Check if all matchups for current week are complete
  const currentWeekMatchups = league.matchups.filter((m: any) => m.week === league.currentWeek);
  const incompleteMatchups = currentWeekMatchups.filter((m: any) => !m.isComplete);

  if (incompleteMatchups.length > 0) {
    console.log(`⏳ League ${league.name} has ${incompleteMatchups.length} incomplete matchups for Week ${league.currentWeek}`);
    return baseAdvancement;
  }

  // Determine advancement action based on league status and week
  if (league.status === 'IN_SEASON') {
    if (league.currentWeek >= 14) {
      // Time for playoffs
      return {
        ...baseAdvancement,
        action: 'START_PLAYOFFS',
        toWeek: league.playoffStartWeek,
        toStatus: 'PLAYOFFS',
        details: `Starting playoffs with ${league.playoffTeams} teams`
      };
    } else {
      // Advance to next regular season week
      return {
        ...baseAdvancement,
        action: 'ADVANCE_WEEK',
        toWeek: league.currentWeek + 1,
        details: `Advancing to Week ${league.currentWeek + 1}`
      };
    }
  } else if (league.status === 'PLAYOFFS') {
    const playoffWeek = league.currentWeek - league.playoffStartWeek + 1;
    const remainingTeams = await countRemainingPlayoffTeams(league.id, league.currentWeek);

    if (remainingTeams <= 1) {
      // Season complete
      return {
        ...baseAdvancement,
        action: 'COMPLETE_SEASON',
        toWeek: league.currentWeek,
        toStatus: 'COMPLETED',
        details: 'Season completed - crowning champion'
      };
    } else {
      // Advance playoff round
      return {
        ...baseAdvancement,
        action: 'ADVANCE_PLAYOFF',
        toWeek: league.currentWeek + 1,
        details: `Advancing to playoff round ${playoffWeek + 1}`
      };
    }
  }

  return baseAdvancement;
}

/**
 * Execute the determined league advancement
 */
async function executeLeagueAdvancement(advancement: LeagueAdvancement): Promise<void> {
  console.log(`🚀 Executing ${advancement.action} for league ${advancement.leagueName}`);

  switch (advancement.action) {
    case 'ADVANCE_WEEK':
      await advanceRegularSeasonWeek(advancement);
      break;
    case 'START_PLAYOFFS':
      await startPlayoffs(advancement);
      break;
    case 'ADVANCE_PLAYOFF':
      await advancePlayoffRound(advancement);
      break;
    case 'COMPLETE_SEASON':
      await completeSeason(advancement);
      break;
  }
}

/**
 * Advance to next regular season week
 */
async function advanceRegularSeasonWeek(advancement: LeagueAdvancement): Promise<void> {
  // Update league week
  await db.league.update({
    where: { id: advancement.leagueId },
    data: {
      currentWeek: advancement.toWeek,
      updatedAt: new Date()
    }
  });

  // Generate weekly report for completed week
  try {
    const report = await generateWeeklyReport(
      advancement.leagueId, 
      advancement.fromWeek, 
      new Date().getFullYear()
    );
    
    console.log(`📊 Week ${advancement.fromWeek} report: High: ${report.highestScore.score}, Low: ${report.lowestScore.score}`);
  } catch (error) {
    console.warn(`⚠️  Could not generate weekly report:`, error);
  }

  console.log(`✅ Advanced league ${advancement.leagueName} to Week ${advancement.toWeek}`);
}

/**
 * Start playoff phase
 */
async function startPlayoffs(advancement: LeagueAdvancement): Promise<void> {
  // Update league status and week
  await db.league.update({
    where: { id: advancement.leagueId },
    data: {
      status: 'PLAYOFFS',
      currentWeek: advancement.toWeek,
      updatedAt: new Date()
    }
  });

  // Lock rosters for playoffs
  await lockPlayoffRosters(advancement.leagueId);

  // Set eliminated status for non-playoff teams
  await markEliminatedTeams(advancement.leagueId);

  console.log(`🏆 Started playoffs for league ${advancement.leagueName}`);
}

/**
 * Advance to next playoff round
 */
async function advancePlayoffRound(advancement: LeagueAdvancement): Promise<void> {
  // Update league week
  await db.league.update({
    where: { id: advancement.leagueId },
    data: {
      currentWeek: advancement.toWeek,
      updatedAt: new Date()
    }
  });

  // Mark eliminated teams from previous round
  await updatePlayoffEliminatedTeams(advancement.leagueId, advancement.fromWeek);

  console.log(`🏆 Advanced league ${advancement.leagueName} to playoff Week ${advancement.toWeek}`);
}

/**
 * Complete the season and crown champion
 */
async function completeSeason(advancement: LeagueAdvancement): Promise<void> {
  const championship = await crownChampion(advancement.leagueId);
  
  // Update league status
  await db.league.update({
    where: { id: advancement.leagueId },
    data: {
      status: 'COMPLETED',
      updatedAt: new Date()
    }
  });

  // Archive league data
  await archiveLeagueData(advancement.leagueId, championship);

  console.log(`🎉 Completed season for league ${advancement.leagueName} - Champion: Team ${championship.championTeamId}`);
}

/**
 * Crown the league champion and determine final standings
 */
async function crownChampion(leagueId: string): Promise<ChampionshipResult> {
  const currentSeason = new Date().getFullYear();
  
  // Get championship matchup (most recent completed playoff matchup)
  const championshipMatchup = await db.matchup.findFirst({
    where: {
      leagueId,
      isPlayoff: true,
      isComplete: true,
      season: currentSeason
    },
    include: {
      homeTeam: {
        include: { owner: { select: { username: true } } }
      },
      awayTeam: {
        include: { owner: { select: { username: true } } }
      }
    },
    orderBy: { week: 'desc' }
  });

  if (!championshipMatchup) {
    throw new Error('No championship matchup found');
  }

  const isHomeWinner = championshipMatchup.homeScore > championshipMatchup.awayScore;
  const championTeam = isHomeWinner ? championshipMatchup.homeTeam : championshipMatchup.awayTeam;
  const runnerUpTeam = isHomeWinner ? championshipMatchup.awayTeam : championshipMatchup.homeTeam;

  // Get final standings
  const finalStandings = await db.team.findMany({
    where: { leagueId },
    include: {
      owner: { select: { username: true } }
    },
    orderBy: { standing: 'asc' }
  });

  // Award championship
  await db.team.update({
    where: { id: championTeam.id },
    data: { standing: 1 }
  });

  await db.team.update({
    where: { id: runnerUpTeam.id },
    data: { standing: 2 }
  });

  return {
    leagueId,
    championTeamId: championTeam.id,
    runnerUpTeamId: runnerUpTeam.id,
    championshipScore: {
      winner: isHomeWinner ? championshipMatchup.homeScore : championshipMatchup.awayScore,
      runnerUp: isHomeWinner ? championshipMatchup.awayScore : championshipMatchup.homeScore
    },
    finalStandings: finalStandings.map((team, index) => ({
      teamId: team.id,
      teamName: team.name,
      ownerName: team.owner.username,
      finalRank: index + 1,
      wins: team.wins,
      losses: team.losses,
      pointsFor: team.pointsFor
    }))
  };
}

/**
 * Lock rosters for playoff teams
 */
async function lockPlayoffRosters(leagueId: string): Promise<void> {
  // This would implement roster locking logic
  // For now, we'll just log it
  console.log(`🔒 Locked playoff rosters for league ${leagueId}`);
}

/**
 * Mark teams that didn't make playoffs as eliminated
 */
async function markEliminatedTeams(leagueId: string): Promise<void> {
  const league = await db.league.findUnique({
    where: { id: leagueId },
    select: { playoffTeams: true }
  });

  if (!league) return;

  await db.team.updateMany({
    where: {
      leagueId,
      standing: { gt: league.playoffTeams }
    },
    data: { eliminated: true }
  });

  console.log(`❌ Marked non-playoff teams as eliminated`);
}

/**
 * Update eliminated teams after playoff round
 */
async function updatePlayoffEliminatedTeams(leagueId: string, completedWeek: number): Promise<void> {
  // Find losing teams from completed playoff matchups
  const completedMatchups = await db.matchup.findMany({
    where: {
      leagueId,
      week: completedWeek,
      isPlayoff: true,
      isComplete: true,
      winnerId: { not: null }
    }
  });

  for (const matchup of completedMatchups) {
    const losingTeamId = matchup.winnerId === matchup.homeTeamId 
      ? matchup.awayTeamId 
      : matchup.homeTeamId;

    await db.team.update({
      where: { id: losingTeamId },
      data: { eliminated: true }
    });
  }

  console.log(`❌ Updated eliminated teams after Week ${completedWeek}`);
}

/**
 * Count remaining teams in playoffs
 */
async function countRemainingPlayoffTeams(leagueId: string, currentWeek: number): Promise<number> {
  // Count teams that advanced from the most recent playoff week
  const recentMatchups = await db.matchup.findMany({
    where: {
      leagueId,
      week: currentWeek,
      isPlayoff: true,
      isComplete: true,
      winnerId: { not: null }
    }
  });

  return recentMatchups.length === 0 ? 0 : recentMatchups.length;
}

/**
 * Archive league data for historical purposes
 */
async function archiveLeagueData(leagueId: string, championship: ChampionshipResult): Promise<void> {
  const archiveData = {
    leagueId,
    season: new Date().getFullYear(),
    championshipResult: championship,
    archivedAt: new Date()
  };

  // Store in a separate archive table or external storage
  // For now, we'll log the archive data
  console.log(`📦 Archived league data:`, JSON.stringify(archiveData, null, 2));
}

/**
 * Send advancement notifications to league members
 */
async function sendAdvancementNotifications(advancements: LeagueAdvancement[]): Promise<void> {
  for (const advancement of advancements) {
    try {
      await sendLeagueAdvancementNotification(advancement);
    } catch (error) {
      console.error(`❌ Failed to send advancement notification for ${advancement.leagueName}:`, error);
    }
  }
}

/**
 * Send notification for specific league advancement
 */
async function sendLeagueAdvancementNotification(advancement: LeagueAdvancement): Promise<void> {
  // Get all league members
  const leagueMembers = await db.leagueMember.findMany({
    where: { leagueId: advancement.leagueId },
    include: { user: { select: { id: true } } }
  });

  const { title, content, priority } = getAdvancementNotificationContent(advancement);

  // Send notification to all members
  for (const member of leagueMembers) {
    await db.notification.create({
      data: {
        userId: member.user.id,
        type: 'SYSTEM',
        title,
        content,
        category: 'INFO',
        priority,
        iconType: getAdvancementIcon(advancement.action),
        data: JSON.stringify({
          leagueId: advancement.leagueId,
          action: advancement.action,
          week: advancement.toWeek,
          status: advancement.toStatus
        })
      }
    });
  }

  console.log(`📧 Sent ${advancement.action} notifications to ${leagueMembers.length} league members`);
}

/**
 * Get notification content based on advancement type
 */
function getAdvancementNotificationContent(advancement: LeagueAdvancement): {
  title: string;
  content: string;
  priority: string;
} {
  switch (advancement.action) {
    case 'ADVANCE_WEEK':
      return {
        title: `Week ${advancement.toWeek} is Here!`,
        content: `${advancement.leagueName} has advanced to Week ${advancement.toWeek}. Set your lineups!`,
        priority: 'NORMAL'
      };
    
    case 'START_PLAYOFFS':
      return {
        title: '🏆 Playoffs Have Begun!',
        content: `The playoffs have started in ${advancement.leagueName}! Good luck to all playoff teams!`,
        priority: 'HIGH'
      };
    
    case 'ADVANCE_PLAYOFF':
      return {
        title: '🏆 Next Playoff Round',
        content: `${advancement.leagueName} playoffs continue with the next round. Check your matchups!`,
        priority: 'HIGH'
      };
    
    case 'COMPLETE_SEASON':
      return {
        title: '🎉 Season Complete!',
        content: `${advancement.leagueName} season has concluded! Check the final standings and congratulate your champion!`,
        priority: 'URGENT'
      };
    
    default:
      return {
        title: `League Update`,
        content: `${advancement.leagueName} has been updated.`,
        priority: 'NORMAL'
      };
  }
}

/**
 * Get icon for advancement notification
 */
function getAdvancementIcon(action: string): string {
  switch (action) {
    case 'ADVANCE_WEEK': return 'calendar';
    case 'START_PLAYOFFS': return 'trophy';
    case 'ADVANCE_PLAYOFF': return 'crown';
    case 'COMPLETE_SEASON': return 'party-popper';
    default: return 'info';
  }
}

/**
 * Get current NFL week
 */
function getCurrentNFLWeek(): number {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 1);
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.ceil(daysSinceStart / 7);
  return Math.max(1, Math.min(18, week));
}

/**
 * Manual league advancement for admin override
 */
export async function manualAdvanceLeague(leagueId: string, targetWeek?: number): Promise<LeagueAdvancement> {
  const league = await db.league.findUnique({
    where: { id: leagueId },
    include: {
      teams: { orderBy: { standing: 'asc' } },
      matchups: { 
        where: { isComplete: false },
        orderBy: { week: 'desc' }
      }
    }
  });

  if (!league) {
    throw new Error('League not found');
  }

  const advancement: LeagueAdvancement = {
    leagueId,
    leagueName: league.name,
    action: 'ADVANCE_WEEK',
    fromWeek: league.currentWeek,
    toWeek: targetWeek || league.currentWeek + 1,
    fromStatus: league.status,
    toStatus: league.status,
    details: 'Manual advancement by administrator'
  };

  await executeLeagueAdvancement(advancement);
  return advancement;
}