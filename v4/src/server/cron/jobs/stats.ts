/**
 * Player Stats Sync Cron Job
 * 
 * Syncs player statistics from SportsIO API to local database,
 * calculates fantasy points, and updates real-time scoring.
 * 
 * Runs: Every 15 minutes during NFL season
 */

import { prisma as db } from '../../db';
import { sportsIOService, type SportsIOPlayerStats } from '../../api/external/sportsio';
import { addMinutes, isAfter, isBefore, parseISO } from 'date-fns';

interface ScoringRules {
  passingYards: number;
  passingTouchdowns: number;
  passingInterceptions: number;
  rushingYards: number;
  rushingTouchdowns: number;
  receivingYards: number;
  receivingTouchdowns: number;
  receptions: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  extraPointsMade: number;
  sacks: number;
  interceptions: number;
  fumblesRecovered: number;
  defensiveTouchdowns: number;
  safeties: number;
  pointsAllowed: number;
}

interface PlayerUpdate {
  playerId: string;
  week: number;
  season: number;
  stats: Partial<SportsIOPlayerStats>;
  fantasyPoints: number;
}

/**
 * Main player stats sync job handler
 */
export async function playerStatsSyncJob(): Promise<void> {
  console.log('📊 Starting player stats sync...');

  try {
    const currentSeason = new Date().getFullYear();
    const currentWeek = getCurrentNFLWeek();

    // Check if it's during game hours (Thursday-Tuesday)
    if (!isDuringNFLWeek()) {
      console.log('⏸️  Not during NFL game week, skipping stats sync');
      return;
    }

    // Get all active leagues to determine which stats to sync
    const activeLeagues = await db.league.findMany({
      where: {
        status: { in: ['IN_SEASON', 'PLAYOFFS'] },
        season: currentSeason
      },
      select: {
        id: true,
        scoringRules: true,
        scoringType: true
      }
    });

    if (activeLeagues.length === 0) {
      console.log('📋 No active leagues found for current season');
      return;
    }

    // Sync stats for current week
    await syncWeeklyStats(currentSeason, currentWeek, activeLeagues);

    // Also sync previous week if games are still completing
    if (currentWeek > 1) {
      const previousWeekComplete = await checkWeekComplete(currentSeason, currentWeek - 1);
      if (!previousWeekComplete) {
        await syncWeeklyStats(currentSeason, currentWeek - 1, activeLeagues);
      }
    }

    console.log('✅ Player stats sync completed');
  } catch (error) {
    console.error('❌ Player stats sync failed:', error);
    throw error;
  }
}

/**
 * Sync stats for a specific week
 */
async function syncWeeklyStats(season: number, week: number, leagues: any[]): Promise<void> {
  console.log(`📊 Syncing stats for Week ${week}, ${season}`);

  try {
    // Fetch latest player stats from SportsIO
    const playerStats = await sportsIOService.getPlayerStats(season, week);
    
    if (playerStats.length === 0) {
      console.log(`📊 No player stats available for Week ${week}`);
      return;
    }

    console.log(`📊 Processing ${playerStats.length} player stat records`);

    // Process stats in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < playerStats.length; i += batchSize) {
      const batch = playerStats.slice(i, i + batchSize);
      await processBatch(batch, season, week, leagues);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Completed stats sync for Week ${week}`);
  } catch (error) {
    console.error(`❌ Failed to sync stats for Week ${week}:`, error);
    throw error;
  }
}

/**
 * Process a batch of player stats
 */
async function processBatch(
  statsBatch: SportsIOPlayerStats[], 
  season: number, 
  week: number, 
  leagues: any[]
): Promise<void> {
  const updates: PlayerUpdate[] = [];

  for (const statsRecord of statsBatch) {
    try {
      // Find the player in our database
      const player = await findPlayerByExternalId(statsRecord.PlayerID.toString());
      if (!player) {
        console.warn(`⚠️  Player not found: ${statsRecord.Name} (ID: ${statsRecord.PlayerID})`);
        continue;
      }

      // Calculate fantasy points for each league's scoring system
      for (const league of leagues) {
        const scoringRules = parseScoringRules(league.scoringRules, league.scoringType);
        const fantasyPoints = calculateFantasyPoints(statsRecord, scoringRules);

        updates.push({
          playerId: player.id,
          week,
          season,
          stats: statsRecord,
          fantasyPoints
        });
      }
    } catch (error) {
      console.error(`❌ Error processing stats for ${statsRecord.Name}:`, error);
    }
  }

  // Bulk update player stats
  await bulkUpdatePlayerStats(updates);
}

/**
 * Find player by external API ID
 */
async function findPlayerByExternalId(externalId: string): Promise<{ id: string } | null> {
  try {
    return await db.player.findUnique({
      where: { externalId },
      select: { id: true }
    });
  } catch (error) {
    console.error(`❌ Error finding player with external ID ${externalId}:`, error);
    return null;
  }
}

/**
 * Calculate fantasy points based on league scoring rules
 */
function calculateFantasyPoints(stats: SportsIOPlayerStats, rules: ScoringRules): number {
  let points = 0;

  // Passing points
  points += (stats.PassingYards || 0) * rules.passingYards;
  points += (stats.PassingTouchdowns || 0) * rules.passingTouchdowns;
  points += (stats.PassingInterceptions || 0) * rules.passingInterceptions;

  // Rushing points
  points += (stats.RushingYards || 0) * rules.rushingYards;
  points += (stats.RushingTouchdowns || 0) * rules.rushingTouchdowns;

  // Receiving points
  points += (stats.ReceivingYards || 0) * rules.receivingYards;
  points += (stats.ReceivingTouchdowns || 0) * rules.receivingTouchdowns;
  points += (stats.Receptions || 0) * rules.receptions;

  // Kicking points
  points += (stats.FieldGoalsMade || 0) * rules.fieldGoalsMade;
  points += (stats.ExtraPointsMade || 0) * rules.extraPointsMade;

  // Defensive points
  points += (stats.Sacks || 0) * rules.sacks;
  points += (stats.Interceptions || 0) * rules.interceptions;
  points += (stats.FumblesRecovered || 0) * rules.fumblesRecovered;
  points += (stats.DefensiveTouchdowns || 0) * rules.defensiveTouchdowns;
  points += (stats.Safeties || 0) * rules.safeties;

  return Math.round(points * 100) / 100; // Round to 2 decimal places
}

/**
 * Parse scoring rules from league configuration
 */
function parseScoringRules(scoringRulesJson: string, scoringType: string): ScoringRules {
  try {
    const customRules = JSON.parse(scoringRulesJson);
    return { ...getDefaultScoringRules(scoringType), ...customRules };
  } catch (error) {
    console.warn('⚠️  Failed to parse custom scoring rules, using defaults');
    return getDefaultScoringRules(scoringType);
  }
}

/**
 * Get default scoring rules based on league type
 */
function getDefaultScoringRules(scoringType: string): ScoringRules {
  const baseRules: ScoringRules = {
    passingYards: 0.04, // 1 point per 25 yards
    passingTouchdowns: 4,
    passingInterceptions: -2,
    rushingYards: 0.1, // 1 point per 10 yards
    rushingTouchdowns: 6,
    receivingYards: 0.1, // 1 point per 10 yards
    receivingTouchdowns: 6,
    receptions: 0, // Varies by league type
    fieldGoalsMade: 3,
    fieldGoalsAttempted: 0,
    extraPointsMade: 1,
    sacks: 1,
    interceptions: 2,
    fumblesRecovered: 2,
    defensiveTouchdowns: 6,
    safeties: 2,
    pointsAllowed: 0 // Complex calculation handled separately
  };

  // Adjust for PPR settings
  switch (scoringType) {
    case 'PPR':
      baseRules.receptions = 1;
      break;
    case 'HALF_PPR':
      baseRules.receptions = 0.5;
      break;
    case 'STANDARD':
    default:
      baseRules.receptions = 0;
      break;
  }

  return baseRules;
}

/**
 * Bulk update player stats in database
 */
async function bulkUpdatePlayerStats(updates: PlayerUpdate[]): Promise<void> {
  if (updates.length === 0) return;

  try {
    // Group updates by unique player/week/season combination
    const groupedUpdates = new Map<string, PlayerUpdate>();
    
    for (const update of updates) {
      const key = `${update.playerId}-${update.week}-${update.season}`;
      if (!groupedUpdates.has(key)) {
        groupedUpdates.set(key, update);
      } else {
        // Take the highest fantasy points if multiple leagues
        const existing = groupedUpdates.get(key)!;
        if (update.fantasyPoints > existing.fantasyPoints) {
          groupedUpdates.set(key, update);
        }
      }
    }

    console.log(`💾 Updating ${groupedUpdates.size} player stat records`);

    // Perform upserts for each stat record
    for (const update of Array.from(groupedUpdates.values())) {
      await db.playerStats.upsert({
        where: {
          playerId_week_season: {
            playerId: update.playerId,
            week: update.week,
            season: update.season
          }
        },
        update: {
          passYards: update.stats.PassingYards || 0,
          passTds: update.stats.PassingTouchdowns || 0,
          passInts: update.stats.PassingInterceptions || 0,
          passAttempts: update.stats.PassingAttempts || 0,
          passCompletions: update.stats.PassingCompletions || 0,
          rushYards: update.stats.RushingYards || 0,
          rushTds: update.stats.RushingTouchdowns || 0,
          rushAttempts: update.stats.RushingAttempts || 0,
          recYards: update.stats.ReceivingYards || 0,
          recTds: update.stats.ReceivingTouchdowns || 0,
          receptions: update.stats.Receptions || 0,
          targets: update.stats.ReceivingTargets || 0,
          fgMade: update.stats.FieldGoalsMade || 0,
          fgAttempts: update.stats.FieldGoalsAttempted || 0,
          xpMade: update.stats.ExtraPointsMade || 0,
          xpAttempts: update.stats.ExtraPointsAttempted || 0,
          sacks: update.stats.Sacks || 0,
          interceptions: update.stats.Interceptions || 0,
          forcedFumbles: update.stats.FumblesForced || 0,
          fumbleRecoveries: update.stats.FumblesRecovered || 0,
          tds: update.stats.DefensiveTouchdowns || 0,
          safeties: update.stats.Safeties || 0,
          fantasyPoints: update.fantasyPoints,
          updatedAt: new Date()
        },
        create: {
          playerId: update.playerId,
          week: update.week,
          season: update.season,
          passYards: update.stats.PassingYards || 0,
          passTds: update.stats.PassingTouchdowns || 0,
          passInts: update.stats.PassingInterceptions || 0,
          passAttempts: update.stats.PassingAttempts || 0,
          passCompletions: update.stats.PassingCompletions || 0,
          rushYards: update.stats.RushingYards || 0,
          rushTds: update.stats.RushingTouchdowns || 0,
          rushAttempts: update.stats.RushingAttempts || 0,
          recYards: update.stats.ReceivingYards || 0,
          recTds: update.stats.ReceivingTouchdowns || 0,
          receptions: update.stats.Receptions || 0,
          targets: update.stats.ReceivingTargets || 0,
          fgMade: update.stats.FieldGoalsMade || 0,
          fgAttempts: update.stats.FieldGoalsAttempted || 0,
          xpMade: update.stats.ExtraPointsMade || 0,
          xpAttempts: update.stats.ExtraPointsAttempted || 0,
          sacks: update.stats.Sacks || 0,
          interceptions: update.stats.Interceptions || 0,
          forcedFumbles: update.stats.FumblesForced || 0,
          fumbleRecoveries: update.stats.FumblesRecovered || 0,
          tds: update.stats.DefensiveTouchdowns || 0,
          safeties: update.stats.Safeties || 0,
          fantasyPoints: update.fantasyPoints
        }
      });
    }

    console.log(`✅ Successfully updated ${groupedUpdates.size} player stats`);
  } catch (error) {
    console.error('❌ Failed to bulk update player stats:', error);
    throw error;
  }
}

/**
 * Check if current time is during NFL week (Thursday-Tuesday)
 */
function isDuringNFLWeek(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // NFL games typically: Thursday, Sunday, Monday
  // Allow sync from Thursday through Tuesday
  return day >= 4 || day <= 2; // Thursday (4) through Tuesday (2)
}

/**
 * Check if a specific week's games are complete
 */
async function checkWeekComplete(season: number, week: number): Promise<boolean> {
  try {
    const games = await sportsIOService.getGames(season, week);
    const incompleteGames = games.filter(game => !game.IsClosed);
    
    console.log(`🏈 Week ${week}: ${incompleteGames.length} games still in progress`);
    return incompleteGames.length === 0;
  } catch (error) {
    console.warn(`⚠️  Could not check if Week ${week} is complete:`, error);
    return false; // Assume incomplete if we can't check
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
 * Update live scoring for active matchups
 */
export async function updateLiveScoring(): Promise<void> {
  console.log('⚡ Updating live scoring for active matchups...');

  try {
    const currentSeason = new Date().getFullYear();
    const currentWeek = getCurrentNFLWeek();

    // Get all active matchups for current week
    const activeMatchups = await db.matchup.findMany({
      where: {
        week: currentWeek,
        season: currentSeason,
        isComplete: false,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: {
        homeTeam: {
          include: {
            roster: {
              where: {
                week: currentWeek,
                season: currentSeason,
                isStarter: true
              },
              include: {
                player: {
                  include: {
                    stats: {
                      where: {
                        week: currentWeek,
                        season: currentSeason
                      }
                    }
                  }
                }
              }
            }
          }
        },
        awayTeam: {
          include: {
            roster: {
              where: {
                week: currentWeek,
                season: currentSeason,
                isStarter: true
              },
              include: {
                player: {
                  include: {
                    stats: {
                      where: {
                        week: currentWeek,
                        season: currentSeason
                      }
                    }
                  }
                }
              }
            }
          }
        },
        league: {
          select: {
            id: true,
            scoringRules: true,
            scoringType: true
          }
        }
      }
    });

    console.log(`⚡ Updating ${activeMatchups.length} active matchups`);

    // Update scores for each matchup
    for (const matchup of activeMatchups) {
      const homeScore = calculateTeamScore(matchup.homeTeam.roster);
      const awayScore = calculateTeamScore(matchup.awayTeam.roster);

      await db.matchup.update({
        where: { id: matchup.id },
        data: {
          homeScore,
          awayScore,
          updatedAt: new Date()
        }
      });
    }

    console.log('✅ Live scoring update completed');
  } catch (error) {
    console.error('❌ Live scoring update failed:', error);
  }
}

/**
 * Calculate total team score from roster
 */
function calculateTeamScore(roster: any[]): number {
  return roster.reduce((total, rosterSpot) => {
    const playerStats = rosterSpot.player.stats[0];
    return total + (playerStats?.fantasyPoints || 0);
  }, 0);
}