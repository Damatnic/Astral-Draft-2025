/**
 * Player stats update job handler
 */

import { prisma } from '../../db';
import { cache } from '../../redis';

interface UpdatePlayerStatsData {
  week: number;
  season: number;
  playerId?: string;
}

export async function updatePlayerStats(data: UpdatePlayerStatsData) {
  const { week, season, playerId } = data;
  
  try {
    // In production, this would fetch from a real sports data API
    // For now, we'll simulate with random data
    
    const players = playerId 
      ? await prisma.player.findMany({ where: { id: playerId } })
      : await prisma.player.findMany({ where: { status: 'ACTIVE' } });
    
    const statsUpdates = [];
    
    for (const player of players) {
      // Check if stats already exist
      const existingStats = await prisma.playerStats.findUnique({
        where: {
          playerId_week_season: {
            playerId: player.id,
            week,
            season,
          },
        },
      });
      
      // Simulate fetching stats from API
      const stats = generateMockStats(player.position);
      
      if (existingStats) {
        // Update existing stats
        statsUpdates.push(
          prisma.playerStats.update({
            where: {
              id: existingStats.id,
            },
            data: stats,
          })
        );
      } else {
        // Create new stats
        statsUpdates.push(
          prisma.playerStats.create({
            data: {
              playerId: player.id,
              week,
              season,
              ...stats,
            },
          })
        );
      }
    }
    
    // Execute all updates in a transaction
    await prisma.$transaction(statsUpdates);
    
    // Clear relevant caches
    await cache.flush(`stats:${season}:${week}:*`);
    if (playerId) {
      await cache.del(`player:${playerId}:stats`);
    }
    
    return {
      success: true,
      updated: statsUpdates.length,
    };
    
  } catch (error) {
    console.error('Error updating player stats:', error);
    throw error;
  }
}

function generateMockStats(position: string) {
  const stats: any = {
    fantasyPoints: 0,
  };
  
  switch (position) {
    case 'QB':
      stats.passYards = Math.floor(Math.random() * 400);
      stats.passTds = Math.floor(Math.random() * 4);
      stats.passInts = Math.floor(Math.random() * 2);
      stats.passAttempts = Math.floor(Math.random() * 40) + 10;
      stats.passCompletions = Math.floor(stats.passAttempts * (0.5 + Math.random() * 0.3));
      stats.rushYards = Math.floor(Math.random() * 50);
      stats.rushTds = Math.random() > 0.8 ? 1 : 0;
      stats.fantasyPoints = 
        stats.passYards * 0.04 +
        stats.passTds * 4 -
        stats.passInts * 2 +
        stats.rushYards * 0.1 +
        stats.rushTds * 6;
      break;
      
    case 'RB':
      stats.rushYards = Math.floor(Math.random() * 150);
      stats.rushTds = Math.floor(Math.random() * 2);
      stats.rushAttempts = Math.floor(Math.random() * 25) + 5;
      stats.recYards = Math.floor(Math.random() * 50);
      stats.recTds = Math.random() > 0.9 ? 1 : 0;
      stats.receptions = Math.floor(Math.random() * 6);
      stats.targets = stats.receptions + Math.floor(Math.random() * 3);
      stats.fantasyPoints = 
        stats.rushYards * 0.1 +
        stats.rushTds * 6 +
        stats.recYards * 0.1 +
        stats.recTds * 6 +
        stats.receptions; // PPR
      break;
      
    case 'WR':
    case 'TE':
      stats.recYards = Math.floor(Math.random() * 120);
      stats.recTds = Math.floor(Math.random() * 2);
      stats.receptions = Math.floor(Math.random() * 8);
      stats.targets = stats.receptions + Math.floor(Math.random() * 4);
      stats.fantasyPoints = 
        stats.recYards * 0.1 +
        stats.recTds * 6 +
        stats.receptions; // PPR
      break;
      
    case 'K':
      stats.fgMade = Math.floor(Math.random() * 3);
      stats.fgAttempts = stats.fgMade + Math.floor(Math.random() * 2);
      stats.xpMade = Math.floor(Math.random() * 4);
      stats.xpAttempts = stats.xpMade;
      stats.fantasyPoints = 
        stats.fgMade * 3 +
        stats.xpMade;
      break;
      
    case 'DEF':
      stats.pointsAllowed = Math.floor(Math.random() * 35);
      stats.yardsAllowed = Math.floor(Math.random() * 400) + 200;
      stats.sacks = Math.floor(Math.random() * 5);
      stats.interceptions = Math.floor(Math.random() * 3);
      stats.forcedFumbles = Math.floor(Math.random() * 2);
      stats.fumbleRecoveries = Math.floor(Math.random() * 2);
      stats.tds = Math.random() > 0.9 ? 1 : 0;
      stats.safeties = Math.random() > 0.95 ? 1 : 0;
      
      // Defense scoring is complex, simplified version
      let defensePoints = 10;
      if (stats.pointsAllowed === 0) defensePoints = 10;
      else if (stats.pointsAllowed <= 6) defensePoints = 7;
      else if (stats.pointsAllowed <= 13) defensePoints = 4;
      else if (stats.pointsAllowed <= 20) defensePoints = 1;
      else if (stats.pointsAllowed <= 27) defensePoints = 0;
      else if (stats.pointsAllowed <= 34) defensePoints = -1;
      else defensePoints = -4;
      
      stats.fantasyPoints = 
        defensePoints +
        stats.sacks +
        stats.interceptions * 2 +
        stats.forcedFumbles * 2 +
        stats.fumbleRecoveries * 2 +
        stats.tds * 6 +
        stats.safeties * 2;
      break;
  }
  
  return stats;
}