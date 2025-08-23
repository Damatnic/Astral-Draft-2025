/**
 * Scoring Engine Service for Astral Draft v4
 * Handles all fantasy point calculations, matchup scoring, and playoff scenarios
 */

import { prisma } from '../server/db';
import sportsDataService from './sportsData';
import type { PlayerStats } from './sportsData';
import { EventEmitter } from 'events';

// Scoring system configurations
export const SCORING_SYSTEMS = {
  STANDARD: {
    passing: {
      yards: 0.04,      // 1 point per 25 yards
      touchdowns: 4,
      interceptions: -2,
      twoPointConversions: 2,
    },
    rushing: {
      yards: 0.1,       // 1 point per 10 yards
      touchdowns: 6,
      twoPointConversions: 2,
    },
    receiving: {
      yards: 0.1,       // 1 point per 10 yards
      touchdowns: 6,
      receptions: 0,    // No PPR
      twoPointConversions: 2,
    },
    kicking: {
      made0to19: 3,
      made20to29: 3,
      made30to39: 3,
      made40to49: 4,
      made50plus: 5,
      missed: -1,
      extraPoints: 1,
      missedExtraPoints: -1,
    },
    defense: {
      sacks: 1,
      interceptions: 2,
      fumblesRecovered: 2,
      touchdowns: 6,
      safeties: 2,
      blockedKicks: 2,
      pointsAllowed0: 10,
      pointsAllowed1to6: 7,
      pointsAllowed7to13: 4,
      pointsAllowed14to20: 1,
      pointsAllowed21to27: 0,
      pointsAllowed28to34: -1,
      pointsAllowed35plus: -4,
    },
    misc: {
      fumblesLost: -2,
      fumbleRecoveryTD: 6,
      returnTD: 6,
    },
  },
  PPR: {
    // Inherits from STANDARD with reception bonus
    receiving: {
      receptions: 1,    // Full PPR
    },
  },
  HALF_PPR: {
    // Inherits from STANDARD with half reception bonus
    receiving: {
      receptions: 0.5,  // Half PPR
    },
  },
};

// Type definitions
export interface ScoringSettings {
  type: 'STANDARD' | 'PPR' | 'HALF_PPR' | 'CUSTOM';
  customRules?: Record<string, number>;
  bonuses?: {
    passing300Yards?: number;
    passing400Yards?: number;
    rushing100Yards?: number;
    rushing200Yards?: number;
    receiving100Yards?: number;
    receiving200Yards?: number;
  };
  penalties?: {
    fumbles?: number;
    interceptions?: number;
    missedFieldGoals?: number;
  };
}

export interface MatchupScore {
  matchupId: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  homeProjected: number;
  awayProjected: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'FINAL';
  lastUpdated: Date;
  playerScores: {
    teamId: string;
    playerId: string;
    playerName: string;
    position: string;
    points: number;
    projected: number;
    status: string;
  }[];
}

export interface PlayoffScenario {
  teamId: string;
  teamName: string;
  currentRecord: { wins: number; losses: number; ties: number };
  playoffOdds: number;
  divisionWinOdds: number;
  championshipOdds: number;
  remainingSchedule: {
    week: number;
    opponent: string;
    projectedWinProbability: number;
  }[];
  scenarios: {
    description: string;
    probability: number;
    requirements: string[];
  }[];
  strengthOfSchedule: number;
  expectedWins: number;
}

export interface LiveScoringUpdate {
  type: 'SCORE_UPDATE' | 'PLAYER_UPDATE' | 'GAME_STATUS' | 'FINAL';
  matchupId: string;
  teamId?: string;
  playerId?: string;
  previousScore?: number;
  newScore?: number;
  delta?: number;
  description?: string;
  timestamp: Date;
}

class ScoringEngineService extends EventEmitter {
  private updateInterval: NodeJS.Timeout | null = null;
  private activeMatchups = new Set<string>();

  constructor() {
    super();
    this.setMaxListeners(100); // Support many concurrent listeners
  }

  /**
   * Calculate fantasy points for a player's stats
   */
  calculateFantasyPoints(
    stats: PlayerStats,
    scoringType: 'STANDARD' | 'PPR' | 'HALF_PPR' = 'PPR',
    customRules?: Record<string, number>
  ): number {
    let points = 0;
    const system = { ...SCORING_SYSTEMS.STANDARD };

    // Apply scoring type modifications
    if (scoringType === 'PPR') {
      system.receiving.receptions = 1;
    } else if (scoringType === 'HALF_PPR') {
      system.receiving.receptions = 0.5;
    }

    // Apply custom rules if provided
    if (customRules) {
      Object.assign(system, customRules);
    }

    // Calculate passing points
    if (stats.PassingYards) {
      points += stats.PassingYards * system.passing.yards;
    }
    if (stats.PassingTouchdowns) {
      points += stats.PassingTouchdowns * system.passing.touchdowns;
    }
    if (stats.PassingInterceptions) {
      points += stats.PassingInterceptions * system.passing.interceptions;
    }

    // Calculate rushing points
    if (stats.RushingYards) {
      points += stats.RushingYards * system.rushing.yards;
    }
    if (stats.RushingTouchdowns) {
      points += stats.RushingTouchdowns * system.rushing.touchdowns;
    }

    // Calculate receiving points
    if (stats.ReceivingYards) {
      points += stats.ReceivingYards * system.receiving.yards;
    }
    if (stats.ReceivingTouchdowns) {
      points += stats.ReceivingTouchdowns * system.receiving.touchdowns;
    }
    if (stats.Receptions) {
      points += stats.Receptions * system.receiving.receptions;
    }

    // Apply bonuses
    if (stats.PassingYards && stats.PassingYards >= 300) {
      points += customRules?.['passing300Bonus'] || 0;
    }
    if (stats.RushingYards && stats.RushingYards >= 100) {
      points += customRules?.['rushing100Bonus'] || 0;
    }
    if (stats.ReceivingYards && stats.ReceivingYards >= 100) {
      points += customRules?.['receiving100Bonus'] || 0;
    }

    return Math.round(points * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Update live scores for all active matchups
   */
  async updateLiveScores(leagueId: string, week: number): Promise<MatchupScore[]> {
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
          matchups: {
            where: { week, season: 2024 },
            include: {
              homeTeam: { include: { roster: { include: { player: true } } } },
              awayTeam: { include: { roster: { include: { player: true } } } },
            },
          },
        },
      });

      if (!league) throw new Error('League not found');

      const playerStats = await sportsDataService.getPlayerStats(2024, week);
      const statsMap = new Map(playerStats.map(s => [s.PlayerID.toString(), s]));

      const matchupScores: MatchupScore[] = [];

      for (const matchup of league.matchups) {
        const homeScore = await this.calculateTeamScore(
          matchup.homeTeam.roster,
          statsMap,
          league.scoringType as 'STANDARD' | 'PPR' | 'HALF_PPR'
        );

        const awayScore = await this.calculateTeamScore(
          matchup.awayTeam.roster,
          statsMap,
          league.scoringType as 'STANDARD' | 'PPR' | 'HALF_PPR'
        );

        // Update matchup in database
        const updated = await prisma.matchup.update({
          where: { id: matchup.id },
          data: {
            homeScore: homeScore.actual,
            awayScore: awayScore.actual,
            winnerId: matchup.isComplete 
              ? (homeScore.actual > awayScore.actual ? matchup.homeTeamId : matchup.awayTeamId)
              : null,
          },
        });

        // Prepare player scores
        const playerScores = [
          ...homeScore.players.map(p => ({ ...p, teamId: matchup.homeTeamId })),
          ...awayScore.players.map(p => ({ ...p, teamId: matchup.awayTeamId })),
        ];

        const matchupScore: MatchupScore = {
          matchupId: matchup.id,
          week,
          homeTeamId: matchup.homeTeamId,
          awayTeamId: matchup.awayTeamId,
          homeScore: homeScore.actual,
          awayScore: awayScore.actual,
          homeProjected: homeScore.projected,
          awayProjected: awayScore.projected,
          status: this.determineMatchupStatus(playerScores),
          lastUpdated: new Date(),
          playerScores,
        };

        matchupScores.push(matchupScore);

        // Emit live update event
        this.emit('scoreUpdate', {
          type: 'SCORE_UPDATE',
          matchupId: matchup.id,
          timestamp: new Date(),
        } as LiveScoringUpdate);
      }

      return matchupScores;
    } catch (error) {
      console.error('Live score update error:', error);
      throw error;
    }
  }

  /**
   * Calculate team score from roster
   */
  private async calculateTeamScore(
    roster: any[],
    statsMap: Map<string, PlayerStats>,
    scoringType: 'STANDARD' | 'PPR' | 'HALF_PPR'
  ): Promise<{
    actual: number;
    projected: number;
    players: any[];
  }> {
    let actualScore = 0;
    let projectedScore = 0;
    const players = [];

    for (const rosterSpot of roster) {
      if (!rosterSpot.isStarter) continue;

      const stats = rosterSpot.player.externalId 
        ? statsMap.get(rosterSpot.player.externalId)
        : null;

      const points = stats 
        ? this.calculateFantasyPoints(stats, scoringType)
        : 0;

      actualScore += points;
      projectedScore += rosterSpot.projectedPoints || 0;

      players.push({
        playerId: rosterSpot.player.id,
        playerName: rosterSpot.player.displayName,
        position: rosterSpot.position,
        points,
        projected: rosterSpot.projectedPoints || 0,
        status: rosterSpot.player.status,
      });
    }

    return {
      actual: Math.round(actualScore * 100) / 100,
      projected: Math.round(projectedScore * 100) / 100,
      players,
    };
  }

  /**
   * Determine matchup status based on player statuses
   */
  private determineMatchupStatus(playerScores: any[]): 'NOT_STARTED' | 'IN_PROGRESS' | 'FINAL' {
    const hasStarted = playerScores.some(p => p.points > 0);
    const allFinished = playerScores.every(p => 
      p.status === 'FINAL' || p.status === 'INACTIVE'
    );

    if (!hasStarted) return 'NOT_STARTED';
    if (allFinished) return 'FINAL';
    return 'IN_PROGRESS';
  }

  /**
   * Calculate playoff scenarios for all teams
   */
  async calculatePlayoffScenarios(leagueId: string): Promise<PlayoffScenario[]> {
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
          teams: true,
          matchups: {
            where: { season: 2024 },
            orderBy: { week: 'asc' },
          },
        },
      });

      if (!league) throw new Error('League not found');

      const scenarios: PlayoffScenario[] = [];
      const simulations = 10000; // Monte Carlo simulations

      for (const team of league.teams) {
        const scenario = await this.simulatePlayoffScenario(
          team,
          league,
          simulations
        );
        scenarios.push(scenario);
      }

      // Sort by playoff odds
      scenarios.sort((a, b) => b.playoffOdds - a.playoffOdds);

      return scenarios;
    } catch (error) {
      console.error('Playoff scenario calculation error:', error);
      throw error;
    }
  }

  /**
   * Simulate playoff scenarios for a team
   */
  private async simulatePlayoffScenario(
    team: any,
    league: any,
    simulations: number
  ): Promise<PlayoffScenario> {
    let playoffAppearances = 0;
    let divisionWins = 0;
    let championships = 0;

    const currentWeek = league.currentWeek;
    const remainingWeeks = league.playoffStartWeek - currentWeek - 1;

    // Get remaining schedule
    const remainingMatchups = league.matchups.filter((m: any) => 
      m.week > currentWeek && 
      m.week < league.playoffStartWeek &&
      (m.homeTeamId === team.id || m.awayTeamId === team.id)
    );

    // Run Monte Carlo simulations
    for (let i = 0; i < simulations; i++) {
      const simulatedRecords = this.simulateSeasonCompletion(
        league.teams,
        league.matchups,
        currentWeek,
        league.playoffStartWeek
      );

      // Check if team makes playoffs
      const sortedTeams = simulatedRecords.sort((a, b) => {
        const aWinPct = a.wins / (a.wins + a.losses);
        const bWinPct = b.wins / (b.wins + b.losses);
        if (aWinPct !== bWinPct) return bWinPct - aWinPct;
        return b.pointsFor - a.pointsFor; // Tiebreaker
      });

      const teamRank = sortedTeams.findIndex(t => t.id === team.id) + 1;
      
      if (teamRank <= league.playoffTeams) {
        playoffAppearances++;
        
        // Simulate playoff outcomes
        if (teamRank === 1) {
          divisionWins++;
          if (Math.random() > 0.5) { // Simplified championship odds
            championships++;
          }
        }
      }
    }

    // Calculate remaining schedule with win probabilities
    const remainingSchedule = remainingMatchups.map((m: any) => {
      const opponentId = m.homeTeamId === team.id ? m.awayTeamId : m.homeTeamId;
      const opponent = league.teams.find((t: any) => t.id === opponentId);
      
      return {
        week: m.week,
        opponent: opponent?.name || 'BYE',
        projectedWinProbability: this.calculateWinProbability(team, opponent),
      };
    });

    // Calculate strength of schedule
    const strengthOfSchedule = this.calculateStrengthOfSchedule(
      team,
      league.teams,
      league.matchups
    );

    // Expected wins calculation
    const expectedWins = team.wins + remainingSchedule.reduce(
      (sum: number, game: any) => sum + game.projectedWinProbability,
      0
    );

    return {
      teamId: team.id,
      teamName: team.name,
      currentRecord: {
        wins: team.wins,
        losses: team.losses,
        ties: team.ties,
      },
      playoffOdds: (playoffAppearances / simulations) * 100,
      divisionWinOdds: (divisionWins / simulations) * 100,
      championshipOdds: (championships / simulations) * 100,
      remainingSchedule,
      scenarios: this.generateScenarioDescriptions(team, league),
      strengthOfSchedule,
      expectedWins: Math.round(expectedWins * 10) / 10,
    };
  }

  /**
   * Simulate season completion for playoff scenarios
   */
  private simulateSeasonCompletion(
    teams: any[],
    matchups: any[],
    currentWeek: number,
    playoffStartWeek: number
  ): any[] {
    const simulatedTeams = teams.map(t => ({ ...t }));

    // Simulate remaining regular season games
    const futureMatchups = matchups.filter((m: any) => 
      m.week > currentWeek && m.week < playoffStartWeek
    );

    for (const matchup of futureMatchups) {
      const homeTeam = simulatedTeams.find(t => t.id === matchup.homeTeamId);
      const awayTeam = simulatedTeams.find(t => t.id === matchup.awayTeamId);

      if (homeTeam && awayTeam) {
        const homeWinProb = this.calculateWinProbability(homeTeam, awayTeam);
        
        if (Math.random() < homeWinProb) {
          homeTeam.wins++;
          awayTeam.losses++;
        } else {
          awayTeam.wins++;
          homeTeam.losses++;
        }
      }
    }

    return simulatedTeams;
  }

  /**
   * Calculate win probability between two teams
   */
  private calculateWinProbability(teamA: any, teamB: any): number {
    if (!teamA || !teamB) return 0.5;

    // Simple model based on current records and points
    const teamAWinPct = teamA.wins / (teamA.wins + teamA.losses + 0.01);
    const teamBWinPct = teamB.wins / (teamB.wins + teamB.losses + 0.01);
    
    const teamAPPG = teamA.pointsFor / (teamA.wins + teamA.losses + 0.01);
    const teamBPPG = teamB.pointsFor / (teamB.wins + teamB.losses + 0.01);

    // Weighted average of win percentage and points per game
    const teamAScore = (teamAWinPct * 0.6) + (teamAPPG / (teamAPPG + teamBPPG) * 0.4);
    
    // Add some randomness for uncertainty
    const probability = teamAScore + (Math.random() * 0.2 - 0.1);
    
    return Math.max(0.1, Math.min(0.9, probability));
  }

  /**
   * Calculate strength of schedule
   */
  private calculateStrengthOfSchedule(
    team: any,
    allTeams: any[],
    matchups: any[]
  ): number {
    const teamMatchups = matchups.filter((m: any) => 
      m.homeTeamId === team.id || m.awayTeamId === team.id
    );

    let totalOpponentWinPct = 0;
    let opponentCount = 0;

    for (const matchup of teamMatchups) {
      const opponentId = matchup.homeTeamId === team.id 
        ? matchup.awayTeamId 
        : matchup.homeTeamId;
      
      const opponent = allTeams.find(t => t.id === opponentId);
      if (opponent) {
        const winPct = opponent.wins / (opponent.wins + opponent.losses + 0.01);
        totalOpponentWinPct += winPct;
        opponentCount++;
      }
    }

    return opponentCount > 0 
      ? Math.round((totalOpponentWinPct / opponentCount) * 1000) / 1000
      : 0.5;
  }

  /**
   * Generate scenario descriptions
   */
  private generateScenarioDescriptions(team: any, league: any): any[] {
    const scenarios = [];

    // Clinch scenarios
    if (team.wins >= league.playoffTeams * 2) {
      scenarios.push({
        description: 'Clinched playoff berth',
        probability: 100,
        requirements: ['Already clinched'],
      });
    }

    // Must-win scenarios
    const gamesRemaining = league.playoffStartWeek - league.currentWeek - 1;
    if (team.losses >= league.teamCount - league.playoffTeams) {
      scenarios.push({
        description: 'Must win out to make playoffs',
        probability: Math.pow(0.5, gamesRemaining) * 100,
        requirements: [`Win next ${gamesRemaining} games`],
      });
    }

    // Elimination scenarios
    if (team.losses > league.teamCount - league.playoffTeams + gamesRemaining) {
      scenarios.push({
        description: 'Eliminated from playoff contention',
        probability: 100,
        requirements: ['Mathematically eliminated'],
      });
    }

    return scenarios;
  }

  /**
   * Start real-time scoring updates
   */
  startRealTimeUpdates(leagueId: string, week: number, intervalMs: number = 30000): void {
    if (this.updateInterval) {
      this.stopRealTimeUpdates();
    }

    this.updateInterval = setInterval(async () => {
      try {
        const scores = await this.updateLiveScores(leagueId, week);
        
        // Track active matchups
        scores.forEach(score => {
          if (score.status === 'IN_PROGRESS') {
            this.activeMatchups.add(score.matchupId);
          } else if (score.status === 'FINAL') {
            this.activeMatchups.delete(score.matchupId);
          }
        });

        // Emit updates for active matchups
        for (const matchupId of this.activeMatchups) {
          const matchup = scores.find(s => s.matchupId === matchupId);
          if (matchup) {
            this.emit('liveUpdate', matchup);
          }
        }

        // Stop updates if all matchups are final
        if (this.activeMatchups.size === 0) {
          this.stopRealTimeUpdates();
          this.emit('allMatchupsComplete', { leagueId, week });
        }
      } catch (error) {
        console.error('Real-time update error:', error);
        this.emit('updateError', error);
      }
    }, intervalMs);

    console.log(`Started real-time updates for league ${leagueId}, week ${week}`);
  }

  /**
   * Stop real-time scoring updates
   */
  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.activeMatchups.clear();
      console.log('Stopped real-time updates');
    }
  }

  /**
   * Get historical scoring data
   */
  async getHistoricalScoring(
    leagueId: string,
    teamId?: string,
    weeks?: number
  ): Promise<any> {
    try {
      const whereClause: any = { leagueId };
      if (teamId) {
        whereClause.OR = [
          { homeTeamId: teamId },
          { awayTeamId: teamId },
        ];
      }

      const matchups = await prisma.matchup.findMany({
        where: whereClause,
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: { week: 'desc' },
        take: weeks,
      });

      return matchups.map(m => ({
        week: m.week,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        winner: m.winnerId === m.homeTeamId ? m.homeTeam.name : m.awayTeam.name,
        margin: Math.abs(m.homeScore - m.awayScore),
      }));
    } catch (error) {
      console.error('Historical scoring error:', error);
      throw error;
    }
  }

  /**
   * Calculate custom scoring
   */
  calculateCustomScoring(
    stats: PlayerStats,
    customRules: Record<string, number>
  ): number {
    let points = 0;

    // Apply each custom rule
    for (const [stat, value] of Object.entries(customRules)) {
      const statValue = (stats as any)[stat] || 0;
      points += statValue * value;
    }

    return Math.round(points * 100) / 100;
  }

  /**
   * Project weekly scores
   */
  async projectWeeklyScores(
    leagueId: string,
    week: number
  ): Promise<Map<string, number>> {
    const projections = new Map<string, number>();

    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
          teams: {
            include: {
              roster: {
                where: { week, season: 2024, isStarter: true },
                include: { player: true },
              },
            },
          },
        },
      });

      if (!league) throw new Error('League not found');

      for (const team of league.teams) {
        const teamProjection = team.roster.reduce(
          (sum, player) => sum + (player.projectedPoints || 0),
          0
        );
        projections.set(team.id, Math.round(teamProjection * 100) / 100);
      }

      return projections;
    } catch (error) {
      console.error('Weekly projection error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const scoringEngine = new ScoringEngineService();
export default scoringEngine;