import { prisma } from '../db';
import type { Team, League, PlayoffBracket } from '@prisma/client';

interface BracketNode {
  matchupId?: string;
  roundNumber: number;
  matchupSlot: number;
  highSeed?: {
    teamId: string;
    teamName: string;
    seed: number;
    logo?: string;
  };
  lowSeed?: {
    teamId: string;
    teamName: string;
    seed: number;
    logo?: string;
  };
  winnerId?: string;
  isBye?: boolean;
  nextMatchupSlot?: number;
  children?: BracketNode[];
}

interface BracketConfig {
  leagueId: string;
  season: number;
  teamCount: 4 | 6 | 8;
  startWeek: number;
  endWeek: number;
  hasThirdPlace?: boolean;
  championshipWeeks?: 1 | 2;
}

export class PlayoffBracketGenerator {
  /**
   * Generate a playoff bracket for a league
   */
  static async generateBracket(config: BracketConfig): Promise<PlayoffBracket> {
    const { leagueId, season, teamCount, startWeek, endWeek, hasThirdPlace = false, championshipWeeks = 1 } = config;

    // Get league and teams
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        teams: {
          orderBy: [
            { wins: 'desc' },
            { pointsFor: 'desc' }
          ],
          take: teamCount
        }
      }
    });

    if (!league) {
      throw new Error('League not found');
    }

    // Create bracket structure based on team count
    const bracketData = this.createBracketStructure(league.teams, teamCount);

    // Create playoff bracket record
    const bracket = await prisma.playoffBracket.create({
      data: {
        leagueId,
        season,
        format: 'SINGLE_ELIMINATION',
        teamCount,
        startWeek,
        endWeek,
        bracketData: JSON.stringify(bracketData),
        championshipWeeks,
        hasThirdPlace,
        status: 'PENDING'
      }
    });

    // Create rounds and matchups
    await this.createRoundsAndMatchups(bracket.id, bracketData, startWeek);

    return bracket;
  }

  /**
   * Create bracket structure based on number of teams
   */
  private static createBracketStructure(teams: Team[], teamCount: 4 | 6 | 8): BracketNode {
    // Seed teams based on regular season record
    const seededTeams = teams.map((team, index) => ({
      teamId: team.id,
      teamName: team.name,
      seed: index + 1,
      logo: team.logo || undefined,
      wins: team.wins,
      losses: team.losses,
      pointsFor: team.pointsFor
    }));

    switch (teamCount) {
      case 4:
        return this.create4TeamBracket(seededTeams);
      case 6:
        return this.create6TeamBracket(seededTeams);
      case 8:
        return this.create8TeamBracket(seededTeams);
      default:
        throw new Error('Invalid team count for playoffs');
    }
  }

  /**
   * Create a 4-team bracket (2 rounds)
   * Round 1: Semifinals (1v4, 2v3)
   * Round 2: Championship
   */
  private static create4TeamBracket(teams: any[]): BracketNode {
    return {
      roundNumber: 2,
      matchupSlot: 1,
      children: [
        {
          roundNumber: 1,
          matchupSlot: 1,
          highSeed: teams[0],
          lowSeed: teams[3],
          nextMatchupSlot: 1
        },
        {
          roundNumber: 1,
          matchupSlot: 2,
          highSeed: teams[1],
          lowSeed: teams[2],
          nextMatchupSlot: 1
        }
      ]
    };
  }

  /**
   * Create a 6-team bracket (3 rounds)
   * Round 1: Wild Card (3v6, 4v5) - Top 2 seeds get bye
   * Round 2: Semifinals
   * Round 3: Championship
   */
  private static create6TeamBracket(teams: any[]): BracketNode {
    return {
      roundNumber: 3,
      matchupSlot: 1,
      children: [
        {
          roundNumber: 2,
          matchupSlot: 1,
          highSeed: teams[0], // 1 seed gets bye to semifinals
          nextMatchupSlot: 1,
          children: [
            {
              roundNumber: 1,
              matchupSlot: 1,
              highSeed: teams[3], // 4 seed
              lowSeed: teams[4],  // 5 seed
              nextMatchupSlot: 1
            }
          ]
        },
        {
          roundNumber: 2,
          matchupSlot: 2,
          highSeed: teams[1], // 2 seed gets bye to semifinals
          nextMatchupSlot: 1,
          children: [
            {
              roundNumber: 1,
              matchupSlot: 2,
              highSeed: teams[2], // 3 seed
              lowSeed: teams[5],  // 6 seed
              nextMatchupSlot: 2
            }
          ]
        }
      ]
    };
  }

  /**
   * Create an 8-team bracket (3 rounds)
   * Round 1: Wild Card (all teams play)
   * Round 2: Semifinals
   * Round 3: Championship
   */
  private static create8TeamBracket(teams: any[]): BracketNode {
    return {
      roundNumber: 3,
      matchupSlot: 1,
      children: [
        {
          roundNumber: 2,
          matchupSlot: 1,
          nextMatchupSlot: 1,
          children: [
            {
              roundNumber: 1,
              matchupSlot: 1,
              highSeed: teams[0], // 1 seed
              lowSeed: teams[7],  // 8 seed
              nextMatchupSlot: 1
            },
            {
              roundNumber: 1,
              matchupSlot: 2,
              highSeed: teams[3], // 4 seed
              lowSeed: teams[4],  // 5 seed
              nextMatchupSlot: 1
            }
          ]
        },
        {
          roundNumber: 2,
          matchupSlot: 2,
          nextMatchupSlot: 1,
          children: [
            {
              roundNumber: 1,
              matchupSlot: 3,
              highSeed: teams[1], // 2 seed
              lowSeed: teams[6],  // 7 seed
              nextMatchupSlot: 2
            },
            {
              roundNumber: 1,
              matchupSlot: 4,
              highSeed: teams[2], // 3 seed
              lowSeed: teams[5],  // 6 seed
              nextMatchupSlot: 2
            }
          ]
        }
      ]
    };
  }

  /**
   * Create database records for rounds and matchups
   */
  private static async createRoundsAndMatchups(
    bracketId: string,
    bracketNode: BracketNode,
    startWeek: number
  ): Promise<void> {
    const rounds = this.extractRounds(bracketNode);
    const roundNames = ['Wild Card', 'Semifinals', 'Championship', 'Finals'];
    
    for (const [roundNumber, matchups] of rounds.entries()) {
      const week = startWeek + roundNumber;
      
      // Create round
      const round = await prisma.playoffRound.create({
        data: {
          bracketId,
          roundNumber: roundNumber + 1,
          roundName: roundNames[roundNumber] || `Round ${roundNumber + 1}`,
          week,
          isComplete: false
        }
      });

      // Create matchups for this round
      for (const matchup of matchups) {
        await prisma.playoffMatchup.create({
          data: {
            roundId: round.id,
            matchupSlot: matchup.matchupSlot,
            highSeedId: matchup.highSeed?.teamId,
            lowSeedId: matchup.lowSeed?.teamId,
            isBye: matchup.isBye || false,
            highSeedScore: 0,
            lowSeedScore: 0,
            isComplete: false
          }
        });
      }
    }
  }

  /**
   * Extract rounds from bracket tree structure
   */
  private static extractRounds(node: BracketNode, rounds: Map<number, BracketNode[]> = new Map()): Map<number, BracketNode[]> {
    const roundIndex = node.roundNumber - 1;
    
    if (!rounds.has(roundIndex)) {
      rounds.set(roundIndex, []);
    }
    
    rounds.get(roundIndex)!.push(node);
    
    if (node.children) {
      for (const child of node.children) {
        this.extractRounds(child, rounds);
      }
    }
    
    return rounds;
  }

  /**
   * Advance winner to next round
   */
  static async advanceWinner(matchupId: string, winnerId: string): Promise<void> {
    const matchup = await prisma.playoffMatchup.findUnique({
      where: { id: matchupId },
      include: {
        round: {
          include: {
            bracket: true
          }
        }
      }
    });

    if (!matchup) {
      throw new Error('Matchup not found');
    }

    // Update matchup with winner
    await prisma.playoffMatchup.update({
      where: { id: matchupId },
      data: {
        winnerId,
        isComplete: true
      }
    });

    // Find next matchup if exists
    if (matchup.nextMatchupId) {
      const nextMatchup = await prisma.playoffMatchup.findUnique({
        where: { id: matchup.nextMatchupId }
      });

      if (nextMatchup) {
        // Determine if winner should be high or low seed in next matchup
        const updateData = matchup.matchupSlot % 2 === 1
          ? { highSeedId: winnerId }
          : { lowSeedId: winnerId };

        await prisma.playoffMatchup.update({
          where: { id: matchup.nextMatchupId },
          data: updateData
        });
      }
    }

    // Check if round is complete
    const roundMatchups = await prisma.playoffMatchup.findMany({
      where: { roundId: matchup.round.id }
    });

    const allComplete = roundMatchups.every(m => m.isComplete);
    
    if (allComplete) {
      await prisma.playoffRound.update({
        where: { id: matchup.round.id },
        data: { isComplete: true }
      });

      // Check if entire bracket is complete
      const allRounds = await prisma.playoffRound.findMany({
        where: { bracketId: matchup.round.bracketId }
      });

      const bracketComplete = allRounds.every(r => r.isComplete);
      
      if (bracketComplete) {
        // Get championship matchup to determine final placements
        const championshipRound = allRounds.find(r => r.roundName === 'Championship' || r.roundName === 'Finals');
        
        if (championshipRound) {
          const championshipMatchup = await prisma.playoffMatchup.findFirst({
            where: { roundId: championshipRound.id }
          });

          if (championshipMatchup) {
            const championId = championshipMatchup.winnerId;
            const runnerUpId = championshipMatchup.highSeedId === championId 
              ? championshipMatchup.lowSeedId 
              : championshipMatchup.highSeedId;

            await prisma.playoffBracket.update({
              where: { id: matchup.round.bracketId },
              data: {
                status: 'COMPLETED',
                championId,
                runnerUpId,
                completedAt: new Date()
              }
            });
          }
        }
      }
    }
  }

  /**
   * Update matchup scores
   */
  static async updateMatchupScores(
    matchupId: string,
    highSeedScore: number,
    lowSeedScore: number
  ): Promise<void> {
    await prisma.playoffMatchup.update({
      where: { id: matchupId },
      data: {
        highSeedScore,
        lowSeedScore
      }
    });
  }

  /**
   * Get bracket visualization data
   */
  static async getBracketVisualization(bracketId: string): Promise<any> {
    const bracket = await prisma.playoffBracket.findUnique({
      where: { id: bracketId },
      include: {
        rounds: {
          include: {
            matchups: true
          },
          orderBy: { roundNumber: 'asc' }
        }
      }
    });

    if (!bracket) {
      throw new Error('Bracket not found');
    }

    // Parse and enhance bracket data with current matchup information
    const bracketData = JSON.parse(bracket.bracketData);
    
    // Map matchups to bracket nodes
    for (const round of bracket.rounds) {
      for (const matchup of round.matchups) {
        this.updateBracketNode(bracketData, round.roundNumber, matchup);
      }
    }

    return {
      ...bracket,
      bracketData
    };
  }

  /**
   * Update bracket node with matchup data
   */
  private static updateBracketNode(node: BracketNode, roundNumber: number, matchup: any): void {
    if (node.roundNumber === roundNumber && node.matchupSlot === matchup.matchupSlot) {
      node.matchupId = matchup.id;
      node.winnerId = matchup.winnerId;
      
      if (matchup.highSeedId && node.highSeed) {
        node.highSeed.teamId = matchup.highSeedId;
      }
      
      if (matchup.lowSeedId && node.lowSeed) {
        node.lowSeed.teamId = matchup.lowSeedId;
      }
    }
    
    if (node.children) {
      for (const child of node.children) {
        this.updateBracketNode(child, roundNumber, matchup);
      }
    }
  }
}