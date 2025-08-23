/**
 * Weekly Scoring Calculations Cron Job
 * 
 * Calculates final fantasy scores for completed matchups,
 * updates team records and standings, and generates weekly reports.
 * 
 * Runs: Every Tuesday at 3 AM (after stats are finalized)
 */

import { prisma as db } from '../../db';
import { sportsIOService } from '../../api/external/sportsio';
import { updateLiveScoring } from './stats';

interface WeeklyResults {
  leagueId: string;
  week: number;
  season: number;
  completedMatchups: number;
  updatedTeams: number;
}

interface TeamStandingUpdate {
  teamId: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  standing: number;
}

interface MatchupResult {
  matchupId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  winnerId: string | null;
  isTie: boolean;
}

/**
 * Main weekly scoring calculation job handler
 */
export async function weeklyScoringJob(): Promise<void> {
  console.log('📊 Starting weekly scoring calculations...');

  try {
    const currentSeason = new Date().getFullYear();
    const currentWeek = getCurrentNFLWeek();
    
    // Calculate scoring for previous week (current week's games may still be in progress)
    const weekToCalculate = Math.max(1, currentWeek - 1);

    // Get all active leagues
    const activeLeagues = await db.league.findMany({
      where: {
        status: { in: ['IN_SEASON', 'PLAYOFFS'] },
        season: currentSeason
      },
      select: { id: true, name: true }
    });

    console.log(`📊 Processing scoring for ${activeLeagues.length} leagues (Week ${weekToCalculate})`);

    const results: WeeklyResults[] = [];

    for (const league of activeLeagues) {
      try {
        const result = await calculateLeagueScoring(league.id, weekToCalculate, currentSeason);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to calculate scoring for league ${league.name}:`, error);
      }
    }

    // Also update live scoring for current week
    await updateLiveScoring();

    // Generate weekly summary
    const totalMatchups = results.reduce((sum, r) => sum + r.completedMatchups, 0);
    const totalTeams = results.reduce((sum, r) => sum + r.updatedTeams, 0);

    console.log(`✅ Weekly scoring completed: ${totalMatchups} matchups, ${totalTeams} teams updated`);
  } catch (error) {
    console.error('❌ Weekly scoring job failed:', error);
    throw error;
  }
}

/**
 * Calculate scoring for a specific league and week
 */
async function calculateLeagueScoring(
  leagueId: string, 
  week: number, 
  season: number
): Promise<WeeklyResults> {
  console.log(`📊 Calculating scoring for league ${leagueId}, Week ${week}`);

  // Get all matchups for the week that haven't been finalized yet
  const matchups = await db.matchup.findMany({
    where: {
      leagueId,
      week,
      season,
      isComplete: false
    },
    include: {
      homeTeam: {
        include: {
          roster: {
            where: {
              week,
              season,
              isStarter: true
            },
            include: {
              player: {
                include: {
                  stats: {
                    where: {
                      week,
                      season
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
              week,
              season,
              isStarter: true
            },
            include: {
              player: {
                include: {
                  stats: {
                    where: {
                      week,
                      season
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
          scoringRules: true,
          scoringType: true
        }
      }
    }
  });

  if (matchups.length === 0) {
    console.log(`📊 No incomplete matchups found for Week ${week}`);
    return {
      leagueId,
      week,
      season,
      completedMatchups: 0,
      updatedTeams: 0
    };
  }

  // Check if all NFL games for the week are complete
  const weekComplete = await isWeekComplete(season, week);
  if (!weekComplete) {
    console.log(`⏳ Week ${week} games still in progress, skipping finalization`);
    
    // Update live scores but don't finalize
    for (const matchup of matchups) {
      await updateMatchupScores(matchup);
    }
    
    return {
      leagueId,
      week,
      season,
      completedMatchups: 0,
      updatedTeams: 0
    };
  }

  // Week is complete, finalize all matchups
  const matchupResults: MatchupResult[] = [];
  
  for (const matchup of matchups) {
    const result = await finalizeMatchup(matchup);
    if (result) {
      matchupResults.push(result);
    }
  }

  // Update team records and standings
  const updatedTeams = await updateTeamStandings(leagueId, matchupResults, season);

  console.log(`✅ Finalized ${matchupResults.length} matchups for league ${leagueId}`);

  return {
    leagueId,
    week,
    season,
    completedMatchups: matchupResults.length,
    updatedTeams
  };
}

/**
 * Update matchup scores without finalizing
 */
async function updateMatchupScores(matchup: any): Promise<void> {
  const homeScore = calculateTeamScore(matchup.homeTeam.roster, matchup.league.scoringRules, matchup.league.scoringType);
  const awayScore = calculateTeamScore(matchup.awayTeam.roster, matchup.league.scoringRules, matchup.league.scoringType);

  await db.matchup.update({
    where: { id: matchup.id },
    data: {
      homeScore,
      awayScore,
      updatedAt: new Date()
    }
  });
}

/**
 * Finalize a matchup by calculating final scores and determining winner
 */
async function finalizeMatchup(matchup: any): Promise<MatchupResult | null> {
  try {
    const homeScore = calculateTeamScore(matchup.homeTeam.roster, matchup.league.scoringRules, matchup.league.scoringType);
    const awayScore = calculateTeamScore(matchup.awayTeam.roster, matchup.league.scoringRules, matchup.league.scoringType);
    
    // Determine winner
    let winnerId: string | null = null;
    let isTie = false;

    if (homeScore > awayScore) {
      winnerId = matchup.homeTeamId;
    } else if (awayScore > homeScore) {
      winnerId = matchup.awayTeamId;
    } else {
      isTie = true;
    }

    // Update matchup with final results
    await db.matchup.update({
      where: { id: matchup.id },
      data: {
        homeScore,
        awayScore,
        winnerId,
        isComplete: true,
        updatedAt: new Date()
      }
    });

    // Update individual roster scores
    await updateRosterScores(matchup.homeTeam.roster, homeScore);
    await updateRosterScores(matchup.awayTeam.roster, awayScore);

    return {
      matchupId: matchup.id,
      homeTeamId: matchup.homeTeamId,
      awayTeamId: matchup.awayTeamId,
      homeScore,
      awayScore,
      winnerId,
      isTie
    };
  } catch (error) {
    console.error(`❌ Failed to finalize matchup ${matchup.id}:`, error);
    return null;
  }
}

/**
 * Calculate team score from roster
 */
function calculateTeamScore(roster: any[], scoringRulesJson: string, scoringType: string): number {
  const scoringRules = parseScoringRules(scoringRulesJson, scoringType);
  
  return roster.reduce((total, rosterSpot) => {
    const playerStats = rosterSpot.player.stats[0];
    if (!playerStats) return total;

    // Calculate fantasy points using league's scoring rules
    const fantasyPoints = calculateFantasyPoints(playerStats, scoringRules);
    return total + fantasyPoints;
  }, 0);
}

/**
 * Parse scoring rules from league configuration
 */
function parseScoringRules(scoringRulesJson: string, scoringType: string): any {
  try {
    const customRules = JSON.parse(scoringRulesJson);
    return { ...getDefaultScoringRules(scoringType), ...customRules };
  } catch (error) {
    return getDefaultScoringRules(scoringType);
  }
}

/**
 * Get default scoring rules based on league type
 */
function getDefaultScoringRules(scoringType: string): any {
  const baseRules = {
    passingYards: 0.04,
    passingTouchdowns: 4,
    passingInterceptions: -2,
    rushingYards: 0.1,
    rushingTouchdowns: 6,
    receivingYards: 0.1,
    receivingTouchdowns: 6,
    receptions: 0,
    fieldGoalsMade: 3,
    extraPointsMade: 1,
    sacks: 1,
    interceptions: 2,
    fumblesRecovered: 2,
    defensiveTouchdowns: 6,
    safeties: 2
  };

  // Adjust for PPR settings
  switch (scoringType) {
    case 'PPR':
      baseRules.receptions = 1;
      break;
    case 'HALF_PPR':
      baseRules.receptions = 0.5;
      break;
    default:
      baseRules.receptions = 0;
      break;
  }

  return baseRules;
}

/**
 * Calculate fantasy points using scoring rules
 */
function calculateFantasyPoints(stats: any, rules: any): number {
  let points = 0;

  points += (stats.passYards || 0) * rules.passingYards;
  points += (stats.passTds || 0) * rules.passingTouchdowns;
  points += (stats.passInts || 0) * rules.passingInterceptions;
  points += (stats.rushYards || 0) * rules.rushingYards;
  points += (stats.rushTds || 0) * rules.rushingTouchdowns;
  points += (stats.recYards || 0) * rules.receivingYards;
  points += (stats.recTds || 0) * rules.receivingTouchdowns;
  points += (stats.receptions || 0) * rules.receptions;
  points += (stats.fgMade || 0) * rules.fieldGoalsMade;
  points += (stats.xpMade || 0) * rules.extraPointsMade;
  points += (stats.sacks || 0) * rules.sacks;
  points += (stats.interceptions || 0) * rules.interceptions;
  points += (stats.fumbleRecoveries || 0) * rules.fumblesRecovered;
  points += (stats.tds || 0) * rules.defensiveTouchdowns;
  points += (stats.safeties || 0) * rules.safeties;

  return Math.round(points * 100) / 100;
}

/**
 * Update individual roster spot scores
 */
async function updateRosterScores(roster: any[], teamScore: number): Promise<void> {
  for (const rosterSpot of roster) {
    const playerStats = rosterSpot.player.stats[0];
    const playerPoints = playerStats ? playerStats.fantasyPoints : 0;

    await db.roster.update({
      where: { id: rosterSpot.id },
      data: {
        points: playerPoints,
        projectedPoints: playerStats?.projectedPoints || 0
      }
    });
  }
}

/**
 * Update team standings based on matchup results
 */
async function updateTeamStandings(
  leagueId: string, 
  matchupResults: MatchupResult[], 
  season: number
): Promise<number> {
  const teamUpdates = new Map<string, TeamStandingUpdate>();

  // Get current team records
  const teams = await db.team.findMany({
    where: { leagueId },
    select: {
      id: true,
      wins: true,
      losses: true,
      ties: true,
      pointsFor: true,
      pointsAgainst: true
    }
  });

  // Initialize team updates
  for (const team of teams) {
    teamUpdates.set(team.id, {
      teamId: team.id,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      pointsFor: team.pointsFor,
      pointsAgainst: team.pointsAgainst,
      standing: 0
    });
  }

  // Process matchup results
  for (const result of matchupResults) {
    const homeUpdate = teamUpdates.get(result.homeTeamId);
    const awayUpdate = teamUpdates.get(result.awayTeamId);

    if (!homeUpdate || !awayUpdate) continue;

    // Update points
    homeUpdate.pointsFor += result.homeScore;
    homeUpdate.pointsAgainst += result.awayScore;
    awayUpdate.pointsFor += result.awayScore;
    awayUpdate.pointsAgainst += result.homeScore;

    // Update wins/losses/ties
    if (result.isTie) {
      homeUpdate.ties++;
      awayUpdate.ties++;
    } else if (result.winnerId === result.homeTeamId) {
      homeUpdate.wins++;
      awayUpdate.losses++;
    } else {
      awayUpdate.wins++;
      homeUpdate.losses++;
    }
  }

  // Calculate standings
  const sortedTeams = Array.from(teamUpdates.values()).sort((a, b) => {
    // Sort by wins descending, then by points for descending
    if (a.wins !== b.wins) return b.wins - a.wins;
    return b.pointsFor - a.pointsFor;
  });

  sortedTeams.forEach((team, index) => {
    team.standing = index + 1;
  });

  // Update teams in database
  for (const update of Array.from(teamUpdates.values())) {
    await db.team.update({
      where: { id: update.teamId },
      data: {
        wins: update.wins,
        losses: update.losses,
        ties: update.ties,
        pointsFor: update.pointsFor,
        pointsAgainst: update.pointsAgainst,
        standing: update.standing
      }
    });
  }

  return teamUpdates.size;
}

/**
 * Check if all NFL games for a week are complete
 */
async function isWeekComplete(season: number, week: number): Promise<boolean> {
  try {
    const games = await sportsIOService.getGames(season, week);
    const incompleteGames = games.filter(game => !game.IsClosed);
    
    console.log(`🏈 Week ${week}: ${incompleteGames.length} games still in progress`);
    return incompleteGames.length === 0;
  } catch (error) {
    console.warn(`⚠️  Could not verify Week ${week} completion:`, error);
    return false; // Don't finalize if we can't verify
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
 * Generate weekly report for a league
 */
export async function generateWeeklyReport(leagueId: string, week: number, season: number): Promise<{
  week: number;
  totalGames: number;
  highestScore: { teamName: string; score: number };
  lowestScore: { teamName: string; score: number };
  blowouts: number;
  upsets: number;
  averageScore: number;
}> {
  try {
    const matchups = await db.matchup.findMany({
      where: {
        leagueId,
        week,
        season,
        isComplete: true
      },
      include: {
        homeTeam: { select: { name: true, standing: true } },
        awayTeam: { select: { name: true, standing: true } }
      }
    });

    if (matchups.length === 0) {
      throw new Error('No completed matchups found for the week');
    }

    const scores = matchups.flatMap(m => [
      { teamName: m.homeTeam.name, score: m.homeScore, standing: m.homeTeam.standing },
      { teamName: m.awayTeam.name, score: m.awayScore, standing: m.awayTeam.standing }
    ]);

    const highestScore = scores.reduce((max, team) => team.score > max.score ? team : max);
    const lowestScore = scores.reduce((min, team) => team.score < min.score ? team : min);
    const averageScore = scores.reduce((sum, team) => sum + team.score, 0) / scores.length;

    // Count blowouts (>30 point difference)
    const blowouts = matchups.filter(m => Math.abs(m.homeScore - m.awayScore) > 30).length;

    // Count upsets (lower standing beats higher standing)
    const upsets = matchups.filter(m => {
      const homeWon = m.homeScore > m.awayScore;
      const homeUpset = homeWon && m.homeTeam.standing > m.awayTeam.standing;
      const awayUpset = !homeWon && m.awayTeam.standing > m.homeTeam.standing;
      return homeUpset || awayUpset;
    }).length;

    return {
      week,
      totalGames: matchups.length,
      highestScore: { teamName: highestScore.teamName, score: highestScore.score },
      lowestScore: { teamName: lowestScore.teamName, score: lowestScore.score },
      blowouts,
      upsets,
      averageScore: Math.round(averageScore * 100) / 100
    };
  } catch (error) {
    console.error(`❌ Failed to generate weekly report for league ${leagueId}:`, error);
    throw error;
  }
}