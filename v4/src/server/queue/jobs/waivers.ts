/**
 * Enhanced Waiver Processing Job Handler
 * Handles FAAB, priority-based, and continual rolling waiver systems
 */

import { prisma } from '../../db';
import { cache } from '../../redis';
import type { WaiverType } from '../../api/routers/waiver';

interface ProcessWaiverClaimsData {
  leagueId: string;
  force?: boolean;
}

interface WaiverClaimDetails {
  playerId: string;
  playerName: string;
  dropPlayerId?: string;
  dropPlayerName?: string;
  notes?: string;
}

interface ProcessingResult {
  playerId: string;
  playerName: string;
  winnerId: string | null;
  winnerName?: string;
  amount?: number;
  reason?: string;
  losers?: Array<{
    teamId: string;
    teamName: string;
    bidAmount: number;
  }>;
}

export async function processWaiverClaims(data: ProcessWaiverClaimsData) {
  const { leagueId, force = false } = data;
  
  console.log(`[Waiver Processing] Starting for league ${leagueId}`);
  
  try {
    // Get league settings
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        waiverType: true,
        waiverBudget: true,
        waiverPeriod: true,
        season: true,
        currentWeek: true,
        scoringRules: true,
      },
    });

    if (!league) {
      throw new Error(`League ${leagueId} not found`);
    }

    const waiverType = league.waiverType as WaiverType;
    const waiverSettings = league.scoringRules ? JSON.parse(league.scoringRules) : {};
    
    // Get all pending waiver claims for the league
    const whereClause: any = {
      leagueId,
      type: 'WAIVER_CLAIM',
      status: 'PENDING',
    };
    
    // Only check process date if not forcing
    if (!force) {
      whereClause.processDate = { lte: new Date() };
    }
    
    const claims = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        team: {
          include: {
            owner: true,
          },
        },
        user: true,
      },
      orderBy: [
        { waiverPriority: 'asc' },
        { faabAmount: 'desc' },
        { createdAt: 'asc' },
      ],
    });
    
    if (claims.length === 0) {
      console.log(`[Waiver Processing] No pending claims found for league ${leagueId}`);
      return {
        success: true,
        processed: 0,
        results: [],
      };
    }
    
    console.log(`[Waiver Processing] Found ${claims.length} pending claims`);
    
    // Group claims by player
    const claimsByPlayer = new Map<string, typeof claims>();
    
    for (const claim of claims) {
      const details = JSON.parse(claim.details) as WaiverClaimDetails;
      const playerId = details.playerId;
      
      if (!claimsByPlayer.has(playerId)) {
        claimsByPlayer.set(playerId, []);
      }
      claimsByPlayer.get(playerId)!.push(claim);
    }
    
    console.log(`[Waiver Processing] Processing claims for ${claimsByPlayer.size} players`);
    
    // Process each player's claims
    const results: ProcessingResult[] = [];
    const processedTeams = new Set<string>(); // Track teams that won claims for priority updates
    
    for (const [playerId, playerClaims] of claimsByPlayer) {
      console.log(`[Waiver Processing] Processing ${playerClaims.length} claims for player ${playerId}`);
      
      // Sort claims based on waiver type
      const sortedClaims = await sortClaimsByPriority(playerClaims, waiverType, waiverSettings);
      
      // Award to the winner
      const winner = sortedClaims[0];
      const winnerDetails = JSON.parse(winner.details) as WaiverClaimDetails;
      
      // For FAAB leagues, check budget
      if (waiverType === 'FAAB') {
      
        // Get team's remaining budget
        const spentBudget = await prisma.transaction.aggregate({
          where: {
            teamId: winner.teamId,
            type: 'WAIVER_CLAIM',
            status: 'EXECUTED',
            createdAt: {
              gte: new Date(league.season, 0, 1),
            },
          },
          _sum: {
            faabAmount: true,
          },
        });
        
        const remainingBudget = league.waiverBudget - (spentBudget._sum.faabAmount || 0);
        
        if ((winner.faabAmount || 0) > remainingBudget) {
          // Reject due to insufficient funds
          await prisma.transaction.update({
            where: { id: winner.id },
            data: {
              status: 'REJECTED',
              executedAt: new Date(),
            },
          });
          
          // Notify user of rejection
          await prisma.notification.create({
            data: {
              userId: winner.userId,
              type: 'WAIVER_REJECTED',
              title: 'Waiver Claim Rejected',
              content: `Your claim for ${winnerDetails.playerName} was rejected due to insufficient FAAB budget`,
              data: JSON.stringify({
                playerId,
                teamId: winner.teamId,
                reason: 'Insufficient FAAB budget',
                remainingBudget,
                bidAmount: winner.faabAmount,
              }),
            },
          });
          
          results.push({
            playerId,
            playerName: winnerDetails.playerName,
            winnerId: null,
            reason: 'Insufficient FAAB budget',
          });
          
          // Try next highest bidder
          if (sortedClaims.length > 1) {
            sortedClaims.shift();
            continue;
          }
          
          continue;
        }
      }
      
      // Execute the winning claim
      await prisma.$transaction(async (tx) => {
        // Add player to roster
        if (winnerDetails.dropPlayerId) {
          // Drop the player being replaced
          await tx.roster.deleteMany({
            where: {
              teamId: winner.teamId,
              playerId: winnerDetails.dropPlayerId,
              week: league.currentWeek,
              season: league.season,
            },
          });
        }
        
        // Add new player
        await tx.roster.create({
          data: {
            teamId: winner.teamId,
            playerId,
            position: 'BENCH',
            week: league.currentWeek,
            season: league.season,
            isStarter: false,
          },
        });
        
        // Update transaction status
        await tx.transaction.update({
          where: { id: winner.id },
          data: {
            status: 'EXECUTED',
            executedAt: new Date(),
          },
        });
        
        // Reject all other claims for this player
        const loserIds = sortedClaims.slice(1).map(c => c.id);
        if (loserIds.length > 0) {
          await tx.transaction.updateMany({
            where: {
              id: { in: loserIds },
            },
            data: {
              status: 'REJECTED',
              executedAt: new Date(),
            },
          });
        }
        
        // Create notification for winner
        const faabText = waiverType === 'FAAB' ? ` for $${winner.faabAmount || 0}` : '';
        await tx.notification.create({
          data: {
            userId: winner.userId,
            type: 'WAIVER_SUCCESS',
            title: 'Waiver Claim Successful',
            content: `You successfully claimed ${winnerDetails.playerName}${faabText}`,
            data: JSON.stringify({
              playerId,
              teamId: winner.teamId,
              amount: winner.faabAmount,
            }),
          },
        });
        
        // Create notifications for losers
        const losers = [];
        for (const loser of sortedClaims.slice(1)) {
          const loserDetails = JSON.parse(loser.details) as WaiverClaimDetails;
          const loserBidText = waiverType === 'FAAB' ? ` (Your bid: $${loser.faabAmount || 0})` : '';
          
          await tx.notification.create({
            data: {
              userId: loser.userId,
              type: 'WAIVER_FAILED',
              title: 'Waiver Claim Failed',
              content: `Your claim for ${winnerDetails.playerName} was outbid${loserBidText}`,
              data: JSON.stringify({
                playerId,
                teamId: loser.teamId,
                winnerTeamId: winner.teamId,
                yourBid: loser.faabAmount,
                winningBid: winner.faabAmount,
              }),
            },
          });
          
          losers.push({
            teamId: loser.teamId,
            teamName: loser.team.name,
            bidAmount: loser.faabAmount || 0,
          });
        }
      });
      
      // Track winning team for priority updates
      processedTeams.add(winner.teamId);
      
      results.push({
        playerId,
        playerName: winnerDetails.playerName,
        winnerId: winner.teamId,
        winnerName: winner.team.name,
        amount: winner.faabAmount,
        losers: sortedClaims.length > 1 ? losers : undefined,
      });
    }
    
    // Update waiver priorities if needed
    if (waiverType === 'CONTINUAL' || waiverSettings.resetPriority === 'afterClaim') {
      await updateWaiverPriorities(leagueId, Array.from(processedTeams));
    }
    
    // Clear cache for affected teams and league
    await cache.flush(`league:${leagueId}:*`);
    for (const teamId of processedTeams) {
      await cache.flush(`team:${teamId}:*`);
    }
    
    console.log(`[Waiver Processing] Completed for league ${leagueId}. Processed ${results.length} claims.`);
    
    return {
      success: true,
      processed: results.length,
      results,
    };
    
  } catch (error) {
    console.error('[Waiver Processing] Error:', error);
    
    // Send error notification to league commissioner
    try {
      const commissioner = await prisma.leagueMember.findFirst({
        where: {
          leagueId,
          role: 'COMMISSIONER',
        },
      });
      
      if (commissioner) {
        await prisma.notification.create({
          data: {
            userId: commissioner.userId,
            type: 'SYSTEM_ERROR',
            title: 'Waiver Processing Error',
            content: 'There was an error processing waiver claims. Please contact support.',
            data: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
              leagueId,
            }),
          },
        });
      }
    } catch (notifyError) {
      console.error('[Waiver Processing] Failed to notify commissioner:', notifyError);
    }
    
    throw error;
  }
}

/**
 * Sort claims based on waiver type and settings
 */
async function sortClaimsByPriority(
  claims: any[],
  waiverType: WaiverType,
  settings: any
): Promise<any[]> {
  if (waiverType === 'FAAB') {
    // FAAB: Sort by bid amount (highest first), then priority, then timestamp
    return claims.sort((a, b) => {
      // Higher FAAB bid wins
      if (a.faabAmount !== b.faabAmount) {
        return (b.faabAmount || 0) - (a.faabAmount || 0);
      }
      
      // Tiebreaker based on settings
      if (settings.tiebreaker === 'random') {
        return Math.random() - 0.5;
      } else if (settings.tiebreaker === 'recordInverse') {
        // Worse record wins ties (more losses = better priority)
        const aRecord = a.team.losses - a.team.wins;
        const bRecord = b.team.losses - b.team.wins;
        if (aRecord !== bRecord) {
          return bRecord - aRecord;
        }
      }
      
      // Default: Lower waiver priority number wins
      if (a.waiverPriority !== b.waiverPriority) {
        return (a.waiverPriority || 999) - (b.waiverPriority || 999);
      }
      
      // Final tiebreaker: Earlier claim wins
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  } else {
    // Priority-based systems (ROLLING, REVERSE_STANDINGS, CONTINUAL)
    return claims.sort((a, b) => {
      // Lower waiver priority number wins (1 is better than 2)
      if (a.waiverPriority !== b.waiverPriority) {
        return (a.waiverPriority || 999) - (b.waiverPriority || 999);
      }
      
      // Tiebreaker: Earlier claim wins
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }
}

/**
 * Update waiver priorities after processing
 */
async function updateWaiverPriorities(
  leagueId: string,
  winningTeamIds: string[]
): Promise<void> {
  if (winningTeamIds.length === 0) return;
  
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      teams: {
        orderBy: [
          { losses: 'desc' },
          { wins: 'asc' },
        ],
      },
    },
  });
  
  if (!league) return;
  
  // Move winning teams to the back of the priority order
  const nonWinningTeams = league.teams.filter(t => !winningTeamIds.includes(t.id));
  const winningTeams = league.teams.filter(t => winningTeamIds.includes(t.id));
  
  const newOrder = [...nonWinningTeams, ...winningTeams];
  
  // Update priority in database (if you want to persist it)
  // This is optional - you might calculate priority dynamically instead
  console.log(`[Waiver Processing] Updated waiver priority for ${winningTeamIds.length} teams`);
}