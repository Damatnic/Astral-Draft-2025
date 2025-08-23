/**
 * Fantasy scoring calculation job handler
 */

import { prisma } from '../../db';
import { cache, pubsub } from '../../redis';

interface CalculateFantasyPointsData {
  leagueId: string;
  week: number;
}

export async function calculateFantasyPoints(data: CalculateFantasyPointsData) {
  const { leagueId, week } = data;
  
  try {
    // Get league scoring settings
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        season: true,
        scoringType: true,
        scoringRules: true,
        teams: {
          include: {
            roster: {
              where: { week, season: true },
              include: {
                player: {
                  include: {
                    stats: {
                      where: { week, season: true },
                    },
                  },
                },
              },
            },
          },
        },
        matchups: {
          where: { week },
        },
      },
    });
    
    if (!league) {
      throw new Error(`League ${leagueId} not found`);
    }
    
    const scoringRules = league.scoringRules as any;
    const updates = [];
    
    // Calculate points for each team
    for (const team of league.teams) {
      let totalPoints = 0;
      const rosterUpdates = [];
      
      for (const rosterSpot of team.roster) {
        if (!rosterSpot.isStarter) continue;
        
        const playerStats = rosterSpot.player.stats[0];
        if (!playerStats) continue;
        
        // Calculate points based on scoring type
        let points = 0;
        
        switch (rosterSpot.player.position) {
          case 'QB':
            points = calculateQBPoints(playerStats, scoringRules);
            break;
          case 'RB':
            points = calculateRBPoints(playerStats, scoringRules, league.scoringType);
            break;
          case 'WR':
          case 'TE':
            points = calculateWRTEPoints(playerStats, scoringRules, league.scoringType);
            break;
          case 'K':
            points = calculateKPoints(playerStats, scoringRules);
            break;
          case 'DEF':
            points = calculateDEFPoints(playerStats, scoringRules);
            break;
        }
        
        totalPoints += points;
        
        // Update roster spot with calculated points
        rosterUpdates.push(
          prisma.roster.update({
            where: { id: rosterSpot.id },
            data: { points },
          })
        );
      }
      
      // Update team's total points
      updates.push(
        prisma.team.update({
          where: { id: team.id },
          data: {
            pointsFor: {
              increment: totalPoints,
            },
          },
        })
      );
      
      // Update matchup scores
      const matchup = league.matchups.find(
        m => m.homeTeamId === team.id || m.awayTeamId === team.id
      );
      
      if (matchup) {
        const isHome = matchup.homeTeamId === team.id;
        updates.push(
          prisma.matchup.update({
            where: { id: matchup.id },
            data: isHome 
              ? { homeScore: totalPoints }
              : { awayScore: totalPoints },
          })
        );
      }
      
      // Execute roster updates
      await prisma.$transaction(rosterUpdates);
      
      // Send real-time score update
      await pubsub.publish(`league:${leagueId}:scores`, {
        type: 'SCORE_UPDATE',
        teamId: team.id,
        week,
        points: totalPoints,
      });
    }
    
    // Execute all team and matchup updates
    await prisma.$transaction(updates);
    
    // Check for completed matchups
    const completedMatchups = await prisma.matchup.findMany({
      where: {
        leagueId,
        week,
        isComplete: false,
        endDate: {
          lte: new Date(),
        },
      },
    });
    
    for (const matchup of completedMatchups) {
      const winnerId = matchup.homeScore > matchup.awayScore 
        ? matchup.homeTeamId
        : matchup.awayScore > matchup.homeScore
        ? matchup.awayTeamId
        : null; // Tie
      
      await prisma.matchup.update({
        where: { id: matchup.id },
        data: {
          isComplete: true,
          winnerId,
        },
      });
      
      // Update team records
      if (winnerId) {
        await prisma.team.update({
          where: { id: winnerId },
          data: { wins: { increment: 1 } },
        });
        
        const loserId = winnerId === matchup.homeTeamId 
          ? matchup.awayTeamId 
          : matchup.homeTeamId;
          
        await prisma.team.update({
          where: { id: loserId },
          data: { losses: { increment: 1 } },
        });
      } else {
        // Handle tie
        await prisma.team.updateMany({
          where: {
            id: { in: [matchup.homeTeamId, matchup.awayTeamId] },
          },
          data: { ties: { increment: 1 } },
        });
      }
    }
    
    // Clear cache
    await cache.flush(`league:${leagueId}:scores:*`);
    
    return {
      success: true,
      teamsUpdated: league.teams.length,
      matchupsCompleted: completedMatchups.length,
    };
    
  } catch (error) {
    console.error('Error calculating fantasy points:', error);
    throw error;
  }
}

function calculateQBPoints(stats: any, rules: any): number {
  const defaults = {
    passYards: 0.04,
    passTds: 4,
    passInts: -2,
    rushYards: 0.1,
    rushTds: 6,
    twoPointConversions: 2,
  };
  
  const scoring = { ...defaults, ...rules?.QB };
  
  return (
    stats.passYards * scoring.passYards +
    stats.passTds * scoring.passTds +
    stats.passInts * scoring.passInts +
    stats.rushYards * scoring.rushYards +
    stats.rushTds * scoring.rushTds
  );
}

function calculateRBPoints(stats: any, rules: any, scoringType: string): number {
  const defaults = {
    rushYards: 0.1,
    rushTds: 6,
    recYards: 0.1,
    recTds: 6,
    receptions: scoringType === 'PPR' ? 1 : scoringType === 'HALF_PPR' ? 0.5 : 0,
    twoPointConversions: 2,
  };
  
  const scoring = { ...defaults, ...rules?.RB };
  
  return (
    stats.rushYards * scoring.rushYards +
    stats.rushTds * scoring.rushTds +
    stats.recYards * scoring.recYards +
    stats.recTds * scoring.recTds +
    stats.receptions * scoring.receptions
  );
}

function calculateWRTEPoints(stats: any, rules: any, scoringType: string): number {
  const defaults = {
    recYards: 0.1,
    recTds: 6,
    receptions: scoringType === 'PPR' ? 1 : scoringType === 'HALF_PPR' ? 0.5 : 0,
    rushYards: 0.1,
    rushTds: 6,
    twoPointConversions: 2,
  };
  
  const position = stats.position === 'TE' ? 'TE' : 'WR';
  const scoring = { ...defaults, ...rules?.[position] };
  
  return (
    stats.recYards * scoring.recYards +
    stats.recTds * scoring.recTds +
    stats.receptions * scoring.receptions +
    (stats.rushYards || 0) * scoring.rushYards +
    (stats.rushTds || 0) * scoring.rushTds
  );
}

function calculateKPoints(stats: any, rules: any): number {
  const defaults = {
    xpMade: 1,
    fg0to39: 3,
    fg40to49: 4,
    fg50plus: 5,
    fgMissed: -1,
  };
  
  const scoring = { ...defaults, ...rules?.K };
  
  // Simplified - would need actual distance data
  return (
    stats.xpMade * scoring.xpMade +
    stats.fgMade * scoring.fg0to39
  );
}

function calculateDEFPoints(stats: any, rules: any): number {
  const defaults = {
    sacks: 1,
    interceptions: 2,
    fumbleRecoveries: 2,
    tds: 6,
    safeties: 2,
    pointsAllowed0: 10,
    pointsAllowed1to6: 7,
    pointsAllowed7to13: 4,
    pointsAllowed14to20: 1,
    pointsAllowed21to27: 0,
    pointsAllowed28to34: -1,
    pointsAllowed35plus: -4,
  };
  
  const scoring = { ...defaults, ...rules?.DEF };
  
  let pointsAllowedScore = 0;
  if (stats.pointsAllowed === 0) pointsAllowedScore = scoring.pointsAllowed0;
  else if (stats.pointsAllowed <= 6) pointsAllowedScore = scoring.pointsAllowed1to6;
  else if (stats.pointsAllowed <= 13) pointsAllowedScore = scoring.pointsAllowed7to13;
  else if (stats.pointsAllowed <= 20) pointsAllowedScore = scoring.pointsAllowed14to20;
  else if (stats.pointsAllowed <= 27) pointsAllowedScore = scoring.pointsAllowed21to27;
  else if (stats.pointsAllowed <= 34) pointsAllowedScore = scoring.pointsAllowed28to34;
  else pointsAllowedScore = scoring.pointsAllowed35plus;
  
  return (
    pointsAllowedScore +
    stats.sacks * scoring.sacks +
    stats.interceptions * scoring.interceptions +
    stats.fumbleRecoveries * scoring.fumbleRecoveries +
    stats.tds * scoring.tds +
    stats.safeties * scoring.safeties
  );
}