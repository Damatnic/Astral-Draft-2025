import { prisma } from '../db';
import type { League, Team, PlayoffBracket } from '@prisma/client';

interface ChampionshipConfig {
  bracketId: string;
  weeks: 1 | 2;
  hasThirdPlace: boolean;
}

interface ChampionshipMatchup {
  id: string;
  team1: {
    id: string;
    name: string;
    logo?: string;
    seed: number;
    weekScores: number[];
    totalScore: number;
  };
  team2: {
    id: string;
    name: string;
    logo?: string;
    seed: number;
    weekScores: number[];
    totalScore: number;
  };
  type: 'CHAMPIONSHIP' | 'THIRD_PLACE';
  status: 'IN_PROGRESS' | 'COMPLETED';
  winnerId?: string;
}

export class ChampionshipManager {
  /**
   * Initialize championship matchups
   */
  static async initializeChampionship(config: ChampionshipConfig): Promise<ChampionshipMatchup[]> {
    const { bracketId, weeks, hasThirdPlace } = config;

    const bracket = await prisma.playoffBracket.findUnique({
      where: { id: bracketId },
      include: {
        rounds: {
          include: {
            matchups: true
          },
          orderBy: { roundNumber: 'desc' }
        }
      }
    });

    if (!bracket) {
      throw new Error('Playoff bracket not found');
    }

    const matchups: ChampionshipMatchup[] = [];

    // Get semifinal round (second to last round)
    const semiFinalRound = bracket.rounds[1];
    
    if (!semiFinalRound) {
      throw new Error('Semifinal round not found');
    }

    // Get championship round (last round)
    const championshipRound = bracket.rounds[0];
    
    if (!championshipRound) {
      throw new Error('Championship round not found');
    }

    // Create championship matchup
    const championshipMatchup = championshipRound.matchups[0];
    
    if (championshipMatchup) {
      const team1 = await this.getTeamDetails(championshipMatchup.highSeedId!);
      const team2 = await this.getTeamDetails(championshipMatchup.lowSeedId!);

      matchups.push({
        id: championshipMatchup.id,
        team1: {
          id: team1.id,
          name: team1.name,
          logo: team1.logo || undefined,
          seed: 1, // Will be determined by semifinal results
          weekScores: [],
          totalScore: 0
        },
        team2: {
          id: team2.id,
          name: team2.name,
          logo: team2.logo || undefined,
          seed: 2, // Will be determined by semifinal results
          weekScores: [],
          totalScore: 0
        },
        type: 'CHAMPIONSHIP',
        status: 'IN_PROGRESS'
      });
    }

    // Create third place matchup if enabled
    if (hasThirdPlace) {
      const semifinalLosers = await this.getSemifinalLosers(semiFinalRound.id);
      
      if (semifinalLosers.length === 2) {
        const team1 = await this.getTeamDetails(semifinalLosers[0]);
        const team2 = await this.getTeamDetails(semifinalLosers[1]);

        // Create a third place matchup record
        const thirdPlaceMatchup = await prisma.playoffMatchup.create({
          data: {
            roundId: championshipRound.id,
            matchupSlot: 2, // Second matchup in championship round
            highSeedId: team1.id,
            lowSeedId: team2.id,
            highSeedScore: 0,
            lowSeedScore: 0,
            isComplete: false
          }
        });

        matchups.push({
          id: thirdPlaceMatchup.id,
          team1: {
            id: team1.id,
            name: team1.name,
            logo: team1.logo || undefined,
            seed: 3,
            weekScores: [],
            totalScore: 0
          },
          team2: {
            id: team2.id,
            name: team2.name,
            logo: team2.logo || undefined,
            seed: 4,
            weekScores: [],
            totalScore: 0
          },
          type: 'THIRD_PLACE',
          status: 'IN_PROGRESS'
        });
      }
    }

    return matchups;
  }

  /**
   * Get team details
   */
  private static async getTeamDetails(teamId: string): Promise<Team> {
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    return team;
  }

  /**
   * Get semifinal losers for third place game
   */
  private static async getSemifinalLosers(semiFinalRoundId: string): Promise<string[]> {
    const matchups = await prisma.playoffMatchup.findMany({
      where: {
        roundId: semiFinalRoundId,
        isComplete: true
      }
    });

    const losers: string[] = [];

    for (const matchup of matchups) {
      if (matchup.winnerId) {
        const loser = matchup.highSeedId === matchup.winnerId
          ? matchup.lowSeedId
          : matchup.highSeedId;
        
        if (loser) {
          losers.push(loser);
        }
      }
    }

    return losers;
  }

  /**
   * Update championship week scores
   */
  static async updateWeekScores(
    matchupId: string,
    week: number,
    team1Score: number,
    team2Score: number
  ): Promise<void> {
    const matchup = await prisma.playoffMatchup.findUnique({
      where: { id: matchupId }
    });

    if (!matchup) {
      throw new Error('Matchup not found');
    }

    // Store week scores in metadata
    const metadata = matchup.nextMatchupId ? JSON.parse(matchup.nextMatchupId) : { weekScores: {} };
    
    if (!metadata.weekScores) {
      metadata.weekScores = {};
    }

    metadata.weekScores[week] = {
      team1: team1Score,
      team2: team2Score
    };

    // Calculate total scores
    const totalTeam1 = Object.values(metadata.weekScores).reduce((sum: number, scores: any) => sum + scores.team1, 0);
    const totalTeam2 = Object.values(metadata.weekScores).reduce((sum: number, scores: any) => sum + scores.team2, 0);

    await prisma.playoffMatchup.update({
      where: { id: matchupId },
      data: {
        highSeedScore: totalTeam1,
        lowSeedScore: totalTeam2,
        nextMatchupId: JSON.stringify(metadata) // Storing metadata in unused field
      }
    });
  }

  /**
   * Finalize championship and determine winners
   */
  static async finalizeChampionship(bracketId: string): Promise<void> {
    const bracket = await prisma.playoffBracket.findUnique({
      where: { id: bracketId },
      include: {
        rounds: {
          include: {
            matchups: true
          },
          orderBy: { roundNumber: 'desc' }
        },
        league: true
      }
    });

    if (!bracket) {
      throw new Error('Bracket not found');
    }

    const championshipRound = bracket.rounds[0];
    const championshipMatchup = championshipRound.matchups[0];
    const thirdPlaceMatchup = championshipRound.matchups[1];

    // Determine champion and runner-up
    let championId: string | null = null;
    let runnerUpId: string | null = null;
    let thirdPlaceId: string | null = null;

    if (championshipMatchup.highSeedScore > championshipMatchup.lowSeedScore) {
      championId = championshipMatchup.highSeedId;
      runnerUpId = championshipMatchup.lowSeedId;
    } else {
      championId = championshipMatchup.lowSeedId;
      runnerUpId = championshipMatchup.highSeedId;
    }

    // Determine third place if applicable
    if (thirdPlaceMatchup) {
      if (thirdPlaceMatchup.highSeedScore > thirdPlaceMatchup.lowSeedScore) {
        thirdPlaceId = thirdPlaceMatchup.highSeedId;
      } else {
        thirdPlaceId = thirdPlaceMatchup.lowSeedId;
      }
    }

    // Update bracket with final results
    await prisma.playoffBracket.update({
      where: { id: bracketId },
      data: {
        status: 'COMPLETED',
        championId,
        runnerUpId,
        thirdPlaceId,
        completedAt: new Date()
      }
    });

    // Create trophies
    await this.awardTrophies(bracket.leagueId, bracket.season, championId!, runnerUpId!, thirdPlaceId);

    // Update season summary
    await this.updateSeasonSummary(bracket.leagueId, bracket.season, championId!, runnerUpId!, thirdPlaceId);
  }

  /**
   * Award trophies to winners
   */
  private static async awardTrophies(
    leagueId: string,
    season: number,
    championId: string,
    runnerUpId: string,
    thirdPlaceId: string | null
  ): Promise<void> {
    // Get team details for trophies
    const champion = await prisma.team.findUnique({
      where: { id: championId },
      include: { owner: true }
    });

    const runnerUp = await prisma.team.findUnique({
      where: { id: runnerUpId },
      include: { owner: true }
    });

    if (!champion || !runnerUp) {
      throw new Error('Teams not found');
    }

    // Champion trophy
    await prisma.trophy.create({
      data: {
        leagueId,
        season,
        type: 'CHAMPION',
        teamId: champion.id,
        userId: champion.ownerId,
        title: `${season} League Champion`,
        description: `${champion.name} defeated ${runnerUp.name} to win the championship`,
        iconUrl: '/trophies/champion.svg'
      }
    });

    // Runner-up trophy
    await prisma.trophy.create({
      data: {
        leagueId,
        season,
        type: 'RUNNER_UP',
        teamId: runnerUp.id,
        userId: runnerUp.ownerId,
        title: `${season} Runner-Up`,
        description: `${runnerUp.name} finished second in the championship`,
        iconUrl: '/trophies/runner-up.svg'
      }
    });

    // Third place trophy if applicable
    if (thirdPlaceId) {
      const thirdPlace = await prisma.team.findUnique({
        where: { id: thirdPlaceId },
        include: { owner: true }
      });

      if (thirdPlace) {
        await prisma.trophy.create({
          data: {
            leagueId,
            season,
            type: 'THIRD_PLACE',
            teamId: thirdPlace.id,
            userId: thirdPlace.ownerId,
            title: `${season} Third Place`,
            description: `${thirdPlace.name} won the third place game`,
            iconUrl: '/trophies/third-place.svg'
          }
        });
      }
    }
  }

  /**
   * Update season summary with championship results
   */
  private static async updateSeasonSummary(
    leagueId: string,
    season: number,
    championId: string,
    runnerUpId: string,
    thirdPlaceId: string | null
  ): Promise<void> {
    // Get final standings
    const teams = await prisma.team.findMany({
      where: { leagueId },
      orderBy: [
        { wins: 'desc' },
        { pointsFor: 'desc' }
      ]
    });

    const standings = teams.map((team, index) => ({
      rank: index + 1,
      teamId: team.id,
      teamName: team.name,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      pointsFor: team.pointsFor,
      pointsAgainst: team.pointsAgainst
    }));

    // Check if season summary exists
    const existingSummary = await prisma.seasonSummary.findUnique({
      where: {
        leagueId_season: {
          leagueId,
          season
        }
      }
    });

    const summaryData = {
      leagueId,
      season,
      championId,
      runnerUpId,
      thirdPlaceId,
      standings: JSON.stringify(standings),
      statistics: JSON.stringify({}), // Will be populated by stats calculator
      highlights: JSON.stringify([]) // Will be populated by highlights generator
    };

    if (existingSummary) {
      await prisma.seasonSummary.update({
        where: { id: existingSummary.id },
        data: summaryData
      });
    } else {
      await prisma.seasonSummary.create({
        data: summaryData
      });
    }
  }

  /**
   * Handle tiebreakers for championship
   */
  static async resolveTiebreaker(matchupId: string): Promise<string> {
    const matchup = await prisma.playoffMatchup.findUnique({
      where: { id: matchupId }
    });

    if (!matchup) {
      throw new Error('Matchup not found');
    }

    // Tiebreaker rules (can be customized):
    // 1. Higher seed wins
    // 2. Better regular season record
    // 3. More points scored in regular season
    // 4. Coin flip (random)

    // For now, implementing higher seed wins
    return matchup.highSeedId!;
  }
}