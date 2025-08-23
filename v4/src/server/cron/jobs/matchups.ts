/**
 * Weekly Matchup Generation Cron Job
 * 
 * Automatically generates weekly matchups for all active leagues,
 * handles bye weeks, playoff brackets, and sends notifications.
 * 
 * Runs: Every Tuesday at 2 AM (after Monday Night Football)
 */

import { prisma as db } from '../../db';
import { addDays, startOfWeek, endOfWeek, format } from 'date-fns';
import { sportsIOService } from '../../api/external/sportsio';

interface MatchupSchedule {
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  startDate: Date;
  endDate: Date;
}

interface PlayoffBracket {
  round: number;
  matchups: {
    homeTeamId: string;
    awayTeamId: string;
    seed1: number;
    seed2: number;
  }[];
}

/**
 * Main matchup generation job handler
 */
export async function matchupGenerationJob(): Promise<void> {
  console.log('🏈 Starting weekly matchup generation...');

  try {
    // Get all active leagues that need matchup generation
    const activeLeagues = await db.league.findMany({
      where: {
        status: { in: ['IN_SEASON', 'PLAYOFFS'] },
      },
      include: {
        teams: {
          where: { isActive: true },
          orderBy: { standing: 'asc' }
        },
        matchups: {
          where: {
            week: { gte: getCurrentNFLWeek() - 1 }
          }
        }
      }
    });

    console.log(`📋 Found ${activeLeagues.length} active leagues`);

    for (const league of activeLeagues) {
      try {
        await generateMatchupsForLeague(league);
      } catch (error) {
        console.error(`❌ Failed to generate matchups for league ${league.name}:`, error);
        // Continue with other leagues even if one fails
      }
    }

    console.log('✅ Weekly matchup generation completed');
  } catch (error) {
    console.error('❌ Matchup generation job failed:', error);
    throw error;
  }
}

/**
 * Generate matchups for a specific league
 */
async function generateMatchupsForLeague(league: any): Promise<void> {
  const currentWeek = getCurrentNFLWeek();
  const nextWeek = currentWeek + 1;

  console.log(`🏈 Generating matchups for league: ${league.name} (Week ${nextWeek})`);

  // Check if we need to advance to playoffs
  if (league.currentWeek >= 14 && league.status === 'IN_SEASON') {
    await handlePlayoffTransition(league);
    return;
  }

  // Check if matchups already exist for next week
  const existingMatchups = league.matchups.filter((m: any) => m.week === nextWeek);
  if (existingMatchups.length > 0) {
    console.log(`⏭️  Matchups already exist for league ${league.name} Week ${nextWeek}`);
    return;
  }

  // Generate regular season or playoff matchups
  if (league.status === 'IN_SEASON') {
    await generateRegularSeasonMatchups(league, nextWeek);
  } else if (league.status === 'PLAYOFFS') {
    await generatePlayoffMatchups(league, nextWeek);
  }

  // Update league's current week
  await db.league.update({
    where: { id: league.id },
    data: { currentWeek: nextWeek }
  });

  // Send matchup notifications
  await sendMatchupNotifications(league.id, nextWeek);
}

/**
 * Generate regular season matchups using round-robin or custom schedule
 */
async function generateRegularSeasonMatchups(league: any, week: number): Promise<void> {
  const teams = league.teams;
  const teamCount = teams.length;

  if (teamCount < 2) {
    console.warn(`⚠️  League ${league.name} has insufficient teams for matchups`);
    return;
  }

  let matchups: MatchupSchedule[];

  // Use stored schedule if available, otherwise generate round-robin
  if (league.customSchedule) {
    matchups = generateFromCustomSchedule(league.customSchedule, week, teams);
  } else {
    matchups = generateRoundRobinMatchups(teams, week);
  }

  // Get NFL week dates
  const weekDates = await getNFLWeekDates(week);

  // Create matchups in database
  for (const matchup of matchups) {
    await db.matchup.create({
      data: {
        leagueId: league.id,
        week: week,
        season: league.season,
        homeTeamId: matchup.homeTeamId,
        awayTeamId: matchup.awayTeamId,
        startDate: weekDates.start,
        endDate: weekDates.end,
        isPlayoff: false
      }
    });
  }

  console.log(`✅ Created ${matchups.length} regular season matchups for Week ${week}`);
}

/**
 * Generate playoff matchups based on seeding
 */
async function generatePlayoffMatchups(league: any, week: number): Promise<void> {
  const teams = league.teams.slice(0, league.playoffTeams);
  const playoffWeek = week - league.playoffStartWeek + 1;

  if (playoffWeek === 1) {
    // First round of playoffs
    await generateFirstRoundPlayoffs(league, teams, week);
  } else {
    // Subsequent playoff rounds
    await generateAdvancedPlayoffRound(league, week, playoffWeek);
  }
}

/**
 * Generate first round playoff matchups
 */
async function generateFirstRoundPlayoffs(league: any, teams: any[], week: number): Promise<void> {
  const playoffTeams = teams.slice(0, league.playoffTeams);
  const matchups: MatchupSchedule[] = [];
  const weekDates = await getNFLWeekDates(week);

  // Standard playoff bracket: 1v4, 2v3 for 4 teams, etc.
  switch (league.playoffTeams) {
    case 4:
      matchups.push(
        {
          week,
          homeTeamId: playoffTeams[0].id, // 1 seed
          awayTeamId: playoffTeams[3].id, // 4 seed
          startDate: weekDates.start,
          endDate: weekDates.end
        },
        {
          week,
          homeTeamId: playoffTeams[1].id, // 2 seed
          awayTeamId: playoffTeams[2].id, // 3 seed
          startDate: weekDates.start,
          endDate: weekDates.end
        }
      );
      break;

    case 6:
      // 6-team playoff: 1&2 get byes, 3v6, 4v5
      matchups.push(
        {
          week,
          homeTeamId: playoffTeams[2].id, // 3 seed
          awayTeamId: playoffTeams[5].id, // 6 seed
          startDate: weekDates.start,
          endDate: weekDates.end
        },
        {
          week,
          homeTeamId: playoffTeams[3].id, // 4 seed
          awayTeamId: playoffTeams[4].id, // 5 seed
          startDate: weekDates.start,
          endDate: weekDates.end
        }
      );
      break;

    case 8:
      // 8-team playoff: 1v8, 2v7, 3v6, 4v5
      for (let i = 0; i < 4; i++) {
        matchups.push({
          week,
          homeTeamId: playoffTeams[i].id,
          awayTeamId: playoffTeams[7 - i].id,
          startDate: weekDates.start,
          endDate: weekDates.end
        });
      }
      break;
  }

  // Create playoff matchups
  for (const matchup of matchups) {
    await db.matchup.create({
      data: {
        leagueId: league.id,
        week: matchup.week,
        season: league.season,
        homeTeamId: matchup.homeTeamId,
        awayTeamId: matchup.awayTeamId,
        startDate: matchup.startDate,
        endDate: matchup.endDate,
        isPlayoff: true
      }
    });
  }

  console.log(`🏆 Created ${matchups.length} first-round playoff matchups`);
}

/**
 * Generate advanced playoff rounds (semifinals, finals)
 */
async function generateAdvancedPlayoffRound(league: any, week: number, playoffWeek: number): Promise<void> {
  // Get winners from previous week
  const previousWeek = week - 1;
  const previousMatchups = await db.matchup.findMany({
    where: {
      leagueId: league.id,
      week: previousWeek,
      isPlayoff: true,
      isComplete: true,
      winnerId: { not: null }
    },
    include: {
      homeTeam: true,
      awayTeam: true
    }
  });

  if (previousMatchups.length === 0) {
    console.warn(`⚠️  No completed playoff matchups found for previous week`);
    return;
  }

  const winners = previousMatchups.map(m => m.winnerId);
  const weekDates = await getNFLWeekDates(week);

  // Create matchups for winners
  const matchups: MatchupSchedule[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      matchups.push({
        week,
        homeTeamId: winners[i]!,
        awayTeamId: winners[i + 1]!,
        startDate: weekDates.start,
        endDate: weekDates.end
      });
    }
  }

  // Create the matchups
  for (const matchup of matchups) {
    await db.matchup.create({
      data: {
        leagueId: league.id,
        week: matchup.week,
        season: league.season,
        homeTeamId: matchup.homeTeamId,
        awayTeamId: matchup.awayTeamId,
        startDate: matchup.startDate,
        endDate: matchup.endDate,
        isPlayoff: true
      }
    });
  }

  console.log(`🏆 Created ${matchups.length} playoff round ${playoffWeek} matchups`);
}

/**
 * Handle transition from regular season to playoffs
 */
async function handlePlayoffTransition(league: any): Promise<void> {
  console.log(`🏆 Transitioning league ${league.name} to playoffs`);

  // Update league status
  await db.league.update({
    where: { id: league.id },
    data: {
      status: 'PLAYOFFS',
      currentWeek: league.playoffStartWeek
    }
  });

  // Calculate final standings and playoff seeding
  await calculatePlayoffSeeding(league);

  // Generate first round playoff matchups
  await generatePlayoffMatchups(league, league.playoffStartWeek);
}

/**
 * Calculate playoff seeding based on regular season record
 */
async function calculatePlayoffSeeding(league: any): Promise<void> {
  const teams = await db.team.findMany({
    where: {
      leagueId: league.id,
      isActive: true
    },
    orderBy: [
      { wins: 'desc' },
      { pointsFor: 'desc' }, // Tiebreaker
      { pointsAgainst: 'asc' }
    ]
  });

  // Update team standings
  for (let i = 0; i < teams.length; i++) {
    await db.team.update({
      where: { id: teams[i].id },
      data: { standing: i + 1 }
    });
  }

  console.log(`📊 Updated playoff seeding for ${teams.length} teams`);
}

/**
 * Generate round-robin matchups for a given week
 */
function generateRoundRobinMatchups(teams: any[], week: number): MatchupSchedule[] {
  const matchups: MatchupSchedule[] = [];
  const teamCount = teams.length;

  if (teamCount % 2 !== 0) {
    // Add a "bye" team for odd number of teams
    teams = [...teams, { id: 'BYE', isBye: true }];
  }

  // Round-robin algorithm
  const rounds = teamCount - 1;
  const gamesPerRound = teamCount / 2;
  const roundIndex = (week - 1) % rounds;

  for (let game = 0; game < gamesPerRound; game++) {
    const home = (roundIndex + game) % (teamCount - 1);
    let away = (teamCount - 1 - game + roundIndex) % (teamCount - 1);

    // Last team stays in place
    if (game === 0) {
      away = teamCount - 1;
    }

    const homeTeam = teams[home];
    const awayTeam = teams[away];

    // Skip if either team is a bye
    if (!homeTeam.isBye && !awayTeam.isBye) {
      matchups.push({
        week,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        startDate: new Date(), // Will be set by caller
        endDate: new Date()    // Will be set by caller
      });
    }
  }

  return matchups;
}

/**
 * Generate matchups from custom schedule
 */
function generateFromCustomSchedule(customSchedule: string, week: number, teams: any[]): MatchupSchedule[] {
  try {
    const schedule = JSON.parse(customSchedule);
    const weekSchedule = schedule[`week${week}`];
    
    if (!weekSchedule) return [];

    return weekSchedule.map((matchup: any) => ({
      week,
      homeTeamId: matchup.homeTeamId,
      awayTeamId: matchup.awayTeamId,
      startDate: new Date(),
      endDate: new Date()
    }));
  } catch (error) {
    console.error('❌ Failed to parse custom schedule:', error);
    return generateRoundRobinMatchups(teams, week);
  }
}

/**
 * Get NFL week start and end dates
 */
async function getNFLWeekDates(week: number): Promise<{ start: Date; end: Date }> {
  try {
    // Get games for the week to determine actual dates
    const currentSeason = new Date().getFullYear();
    const games = await sportsIOService.getGames(currentSeason, week);
    
    if (games.length > 0) {
      const gameDates = games.map(g => new Date(g.Date));
      const start = new Date(Math.min(...gameDates.map(d => d.getTime())));
      const end = new Date(Math.max(...gameDates.map(d => d.getTime())));
      
      return {
        start: startOfWeek(start, { weekStartsOn: 4 }), // Thursday
        end: addDays(endOfWeek(end, { weekStartsOn: 4 }), 1) // Tuesday
      };
    }
  } catch (error) {
    console.warn('⚠️  Failed to get NFL week dates, using defaults:', error);
  }

  // Fallback to estimated dates
  const seasonStart = new Date(new Date().getFullYear(), 8, 5); // Sept 5th estimate
  const weekStart = addDays(seasonStart, (week - 1) * 7);
  
  return {
    start: startOfWeek(weekStart, { weekStartsOn: 4 }),
    end: addDays(endOfWeek(weekStart, { weekStartsOn: 4 }), 1)
  };
}

/**
 * Send matchup notifications to all league members
 */
async function sendMatchupNotifications(leagueId: string, week: number): Promise<void> {
  try {
    // Get all matchups for the week
    const matchups = await db.matchup.findMany({
      where: { leagueId, week },
      include: {
        homeTeam: { include: { owner: true } },
        awayTeam: { include: { owner: true } },
        league: true
      }
    });

    // Get all league members
    const leagueMembers = await db.leagueMember.findMany({
      where: { leagueId },
      include: { user: true }
    });

    for (const member of leagueMembers) {
      // Find user's matchup for this week
      const userMatchup = matchups.find(m => 
        m.homeTeam.ownerId === member.userId || m.awayTeam.ownerId === member.userId
      );

      if (userMatchup) {
        const opponent = userMatchup.homeTeam.ownerId === member.userId 
          ? userMatchup.awayTeam 
          : userMatchup.homeTeam;

        // Create notification
        await db.notification.create({
          data: {
            userId: member.userId,
            type: 'MATCHUP',
            title: `Week ${week} Matchup`,
            content: `Your matchup against ${opponent.name} (${opponent.owner.username}) is ready!`,
            category: 'INFO',
            priority: 'NORMAL',
            iconType: 'swords',
            data: JSON.stringify({
              leagueId,
              matchupId: userMatchup.id,
              week,
              opponentTeamId: opponent.id
            })
          }
        });
      }
    }

    console.log(`📧 Sent matchup notifications for Week ${week}`);
  } catch (error) {
    console.error('❌ Failed to send matchup notifications:', error);
  }
}

/**
 * Get current NFL week (helper function)
 */
function getCurrentNFLWeek(): number {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.ceil(daysSinceStart / 7);
  return Math.max(1, Math.min(18, week));
}