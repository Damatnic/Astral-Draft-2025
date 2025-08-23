import { prisma } from '../db';
import type { League, Team, User } from '@prisma/client';

interface AwardCandidate {
  id: string;
  type: 'TEAM' | 'USER';
  value: number;
  metadata?: any;
}

interface WeeklyAward {
  type: string;
  week: number;
  winner: AwardCandidate;
  description: string;
}

interface SeasonAward {
  type: string;
  winner: AwardCandidate;
  description: string;
  value?: number;
}

export class AwardsCalculator {
  /**
   * Calculate all weekly awards for a given week
   */
  static async calculateWeeklyAwards(leagueId: string, week: number, season: number): Promise<void> {
    const awards: WeeklyAward[] = [];

    // Get all matchups for the week
    const matchups = await prisma.matchup.findMany({
      where: {
        leagueId,
        week,
        season,
        isComplete: true
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    });

    // Weekly High Scorer
    const highScorer = await this.calculateWeeklyHighScorer(matchups);
    if (highScorer) {
      await prisma.award.create({
        data: {
          leagueId,
          season,
          week,
          type: 'WEEKLY_HIGH_SCORER',
          category: 'WEEKLY',
          recipientId: highScorer.winner.id,
          recipientType: 'TEAM',
          title: 'Weekly High Scorer',
          description: highScorer.description,
          value: highScorer.winner.value,
          badgeUrl: '/badges/high-scorer.svg',
          color: '#FFD700'
        }
      });
    }

    // Biggest Upset
    const biggestUpset = await this.calculateBiggestUpset(matchups);
    if (biggestUpset) {
      await prisma.award.create({
        data: {
          leagueId,
          season,
          week,
          type: 'BIGGEST_UPSET',
          category: 'WEEKLY',
          recipientId: biggestUpset.winner.id,
          recipientType: 'TEAM',
          title: 'Biggest Upset',
          description: biggestUpset.description,
          value: biggestUpset.winner.value,
          metadata: JSON.stringify(biggestUpset.winner.metadata),
          badgeUrl: '/badges/upset.svg',
          color: '#FF6B6B'
        }
      });
    }

    // Closest Victory
    const closestVictory = await this.calculateClosestVictory(matchups);
    if (closestVictory) {
      await prisma.award.create({
        data: {
          leagueId,
          season,
          week,
          type: 'CLOSEST_VICTORY',
          category: 'WEEKLY',
          recipientId: closestVictory.winner.id,
          recipientType: 'TEAM',
          title: 'Narrowest Victory',
          description: closestVictory.description,
          value: closestVictory.winner.value,
          badgeUrl: '/badges/close-call.svg',
          color: '#4ECDC4'
        }
      });
    }

    // Biggest Blowout
    const biggestBlowout = await this.calculateBiggestBlowout(matchups);
    if (biggestBlowout) {
      await prisma.award.create({
        data: {
          leagueId,
          season,
          week,
          type: 'BIGGEST_BLOWOUT',
          category: 'WEEKLY',
          recipientId: biggestBlowout.winner.id,
          recipientType: 'TEAM',
          title: 'Domination',
          description: biggestBlowout.description,
          value: biggestBlowout.winner.value,
          badgeUrl: '/badges/domination.svg',
          color: '#9B59B6'
        }
      });
    }
  }

  /**
   * Calculate season-long awards
   */
  static async calculateSeasonAwards(leagueId: string, season: number): Promise<void> {
    // Get all teams and their stats
    const teams = await prisma.team.findMany({
      where: { leagueId },
      include: {
        owner: true,
        roster: {
          where: { season }
        }
      }
    });

    // MVP - Most total points scored
    const mvp = await this.calculateMVP(teams);
    if (mvp) {
      await prisma.award.create({
        data: {
          leagueId,
          season,
          type: 'MVP',
          category: 'SEASON',
          recipientId: mvp.winner.id,
          recipientType: 'TEAM',
          title: 'Season MVP',
          description: mvp.description,
          value: mvp.winner.value,
          badgeUrl: '/badges/mvp.svg',
          color: '#FFD700'
        }
      });
    }

    // Best Draft
    const bestDraft = await this.calculateBestDraft(leagueId, season);
    if (bestDraft) {
      await prisma.award.create({
        data: {
          leagueId,
          season,
          type: 'BEST_DRAFT',
          category: 'SEASON',
          recipientId: bestDraft.winner.id,
          recipientType: 'TEAM',
          title: 'Best Draft',
          description: bestDraft.description,
          badgeUrl: '/badges/best-draft.svg',
          color: '#2ECC71'
        }
      });
    }

    // Most Consistent
    const mostConsistent = await this.calculateMostConsistent(leagueId, season);
    if (mostConsistent) {
      await prisma.award.create({
        data: {
          leagueId,
          season,
          type: 'MOST_CONSISTENT',
          category: 'SEASON',
          recipientId: mostConsistent.winner.id,
          recipientType: 'TEAM',
          title: 'Mr. Consistent',
          description: mostConsistent.description,
          value: mostConsistent.winner.value,
          badgeUrl: '/badges/consistent.svg',
          color: '#3498DB'
        }
      });
    }

    // Best Manager (best record)
    const bestManager = await this.calculateBestManager(teams);
    if (bestManager) {
      await prisma.award.create({
        data: {
          leagueId,
          season,
          type: 'BEST_MANAGER',
          category: 'SEASON',
          recipientId: bestManager.winner.id,
          recipientType: 'USER',
          title: 'Manager of the Year',
          description: bestManager.description,
          badgeUrl: '/badges/best-manager.svg',
          color: '#E74C3C'
        }
      });
    }

    // Trade Master (most trades)
    const tradeMaster = await this.calculateTradeMaster(leagueId, season);
    if (tradeMaster) {
      await prisma.award.create({
        data: {
          leagueId,
          season,
          type: 'TRADE_MASTER',
          category: 'SEASON',
          recipientId: tradeMaster.winner.id,
          recipientType: 'TEAM',
          title: 'Trade Master',
          description: tradeMaster.description,
          value: tradeMaster.winner.value,
          badgeUrl: '/badges/trade-master.svg',
          color: '#F39C12'
        }
      });
    }

    // Waiver Wire Hero
    const waiverHero = await this.calculateWaiverWireHero(leagueId, season);
    if (waiverHero) {
      await prisma.award.create({
        data: {
          leagueId,
          season,
          type: 'WAIVER_WIRE_HERO',
          category: 'SEASON',
          recipientId: waiverHero.winner.id,
          recipientType: 'TEAM',
          title: 'Waiver Wire Wizard',
          description: waiverHero.description,
          badgeUrl: '/badges/waiver-hero.svg',
          color: '#8E44AD'
        }
      });
    }
  }

  /**
   * Calculate weekly high scorer
   */
  private static async calculateWeeklyHighScorer(matchups: any[]): Promise<WeeklyAward | null> {
    let highestScore = 0;
    let winner: AwardCandidate | null = null;
    let teamName = '';

    for (const matchup of matchups) {
      if (matchup.homeScore > highestScore) {
        highestScore = matchup.homeScore;
        winner = {
          id: matchup.homeTeam.id,
          type: 'TEAM',
          value: matchup.homeScore
        };
        teamName = matchup.homeTeam.name;
      }
      if (matchup.awayScore > highestScore) {
        highestScore = matchup.awayScore;
        winner = {
          id: matchup.awayTeam.id,
          type: 'TEAM',
          value: matchup.awayScore
        };
        teamName = matchup.awayTeam.name;
      }
    }

    if (!winner) return null;

    return {
      type: 'WEEKLY_HIGH_SCORER',
      week: matchups[0].week,
      winner,
      description: `${teamName} scored ${highestScore.toFixed(2)} points`
    };
  }

  /**
   * Calculate biggest upset
   */
  private static async calculateBiggestUpset(matchups: any[]): Promise<WeeklyAward | null> {
    let biggestUpsetMargin = 0;
    let winner: AwardCandidate | null = null;
    let description = '';

    for (const matchup of matchups) {
      const homeProjected = matchup.homeTeam.standing;
      const awayProjected = matchup.awayTeam.standing;

      // Home team upset
      if (matchup.homeScore > matchup.awayScore && homeProjected > awayProjected) {
        const margin = homeProjected - awayProjected;
        if (margin > biggestUpsetMargin) {
          biggestUpsetMargin = margin;
          winner = {
            id: matchup.homeTeam.id,
            type: 'TEAM',
            value: margin,
            metadata: {
              opponentId: matchup.awayTeam.id,
              opponentName: matchup.awayTeam.name,
              score: `${matchup.homeScore.toFixed(2)} - ${matchup.awayScore.toFixed(2)}`
            }
          };
          description = `${matchup.homeTeam.name} (${homeProjected}) defeated ${matchup.awayTeam.name} (${awayProjected})`;
        }
      }

      // Away team upset
      if (matchup.awayScore > matchup.homeScore && awayProjected > homeProjected) {
        const margin = awayProjected - homeProjected;
        if (margin > biggestUpsetMargin) {
          biggestUpsetMargin = margin;
          winner = {
            id: matchup.awayTeam.id,
            type: 'TEAM',
            value: margin,
            metadata: {
              opponentId: matchup.homeTeam.id,
              opponentName: matchup.homeTeam.name,
              score: `${matchup.awayScore.toFixed(2)} - ${matchup.homeScore.toFixed(2)}`
            }
          };
          description = `${matchup.awayTeam.name} (${awayProjected}) defeated ${matchup.homeTeam.name} (${homeProjected})`;
        }
      }
    }

    if (!winner) return null;

    return {
      type: 'BIGGEST_UPSET',
      week: matchups[0].week,
      winner,
      description
    };
  }

  /**
   * Calculate closest victory
   */
  private static async calculateClosestVictory(matchups: any[]): Promise<WeeklyAward | null> {
    let smallestMargin = Infinity;
    let winner: AwardCandidate | null = null;
    let description = '';

    for (const matchup of matchups) {
      const margin = Math.abs(matchup.homeScore - matchup.awayScore);
      
      if (margin < smallestMargin && margin > 0) {
        smallestMargin = margin;
        
        if (matchup.homeScore > matchup.awayScore) {
          winner = {
            id: matchup.homeTeam.id,
            type: 'TEAM',
            value: margin
          };
          description = `${matchup.homeTeam.name} won by just ${margin.toFixed(2)} points over ${matchup.awayTeam.name}`;
        } else {
          winner = {
            id: matchup.awayTeam.id,
            type: 'TEAM',
            value: margin
          };
          description = `${matchup.awayTeam.name} won by just ${margin.toFixed(2)} points over ${matchup.homeTeam.name}`;
        }
      }
    }

    if (!winner) return null;

    return {
      type: 'CLOSEST_VICTORY',
      week: matchups[0].week,
      winner,
      description
    };
  }

  /**
   * Calculate biggest blowout
   */
  private static async calculateBiggestBlowout(matchups: any[]): Promise<WeeklyAward | null> {
    let largestMargin = 0;
    let winner: AwardCandidate | null = null;
    let description = '';

    for (const matchup of matchups) {
      const margin = Math.abs(matchup.homeScore - matchup.awayScore);
      
      if (margin > largestMargin) {
        largestMargin = margin;
        
        if (matchup.homeScore > matchup.awayScore) {
          winner = {
            id: matchup.homeTeam.id,
            type: 'TEAM',
            value: margin
          };
          description = `${matchup.homeTeam.name} destroyed ${matchup.awayTeam.name} by ${margin.toFixed(2)} points`;
        } else {
          winner = {
            id: matchup.awayTeam.id,
            type: 'TEAM',
            value: margin
          };
          description = `${matchup.awayTeam.name} destroyed ${matchup.homeTeam.name} by ${margin.toFixed(2)} points`;
        }
      }
    }

    if (!winner) return null;

    return {
      type: 'BIGGEST_BLOWOUT',
      week: matchups[0].week,
      winner,
      description
    };
  }

  /**
   * Calculate season MVP (most points scored)
   */
  private static async calculateMVP(teams: any[]): Promise<SeasonAward | null> {
    let highestPoints = 0;
    let winner: AwardCandidate | null = null;
    let teamName = '';

    for (const team of teams) {
      if (team.pointsFor > highestPoints) {
        highestPoints = team.pointsFor;
        winner = {
          id: team.id,
          type: 'TEAM',
          value: team.pointsFor
        };
        teamName = team.name;
      }
    }

    if (!winner) return null;

    return {
      type: 'MVP',
      winner,
      description: `${teamName} scored ${highestPoints.toFixed(2)} total points`,
      value: highestPoints
    };
  }

  /**
   * Calculate best draft based on player performance vs ADP
   */
  private static async calculateBestDraft(leagueId: string, season: number): Promise<SeasonAward | null> {
    const draft = await prisma.draft.findUnique({
      where: { leagueId },
      include: {
        picks: {
          include: {
            player: true,
            team: true
          }
        }
      }
    });

    if (!draft) return null;

    let bestValue = 0;
    let winner: AwardCandidate | null = null;
    let teamName = '';

    // Group picks by team
    const teamPicks = new Map<string, any[]>();
    
    for (const pick of draft.draftPicks) {
      if (!teamPicks.has(pick.teamId)) {
        teamPicks.set(pick.teamId, []);
      }
      teamPicks.get(pick.teamId)!.push(pick);
    }

    // Calculate draft value for each team
    for (const [teamId, picks] of teamPicks) {
      let totalValue = 0;
      
      for (const pick of picks) {
        if (pick.player && pick.player.adp) {
          const expectedPick = pick.player.adp;
          const actualPick = pick.pick;
          const value = expectedPick - actualPick; // Positive means got player later than expected
          totalValue += value;
        }
      }

      if (totalValue > bestValue) {
        bestValue = totalValue;
        winner = {
          id: teamId,
          type: 'TEAM',
          value: bestValue
        };
        teamName = picks[0].team.name;
      }
    }

    if (!winner) return null;

    return {
      type: 'BEST_DRAFT',
      winner,
      description: `${teamName} had the best draft with +${bestValue.toFixed(1)} value over ADP`
    };
  }

  /**
   * Calculate most consistent team (lowest standard deviation in weekly scores)
   */
  private static async calculateMostConsistent(leagueId: string, season: number): Promise<SeasonAward | null> {
    const matchups = await prisma.matchup.findMany({
      where: {
        leagueId,
        season,
        isComplete: true
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    });

    const teamScores = new Map<string, number[]>();

    // Collect all scores for each team
    for (const matchup of matchups) {
      if (!teamScores.has(matchup.homeTeamId)) {
        teamScores.set(matchup.homeTeamId, []);
      }
      if (!teamScores.has(matchup.awayTeamId)) {
        teamScores.set(matchup.awayTeamId, []);
      }

      teamScores.get(matchup.homeTeamId)!.push(matchup.homeScore);
      teamScores.get(matchup.awayTeamId)!.push(matchup.awayScore);
    }

    let lowestStdDev = Infinity;
    let winner: AwardCandidate | null = null;
    let teamName = '';

    // Calculate standard deviation for each team
    for (const [teamId, scores] of teamScores) {
      if (scores.length > 0) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev < lowestStdDev) {
          lowestStdDev = stdDev;
          winner = {
            id: teamId,
            type: 'TEAM',
            value: stdDev
          };

          const team = await prisma.team.findUnique({ where: { id: teamId } });
          teamName = team?.name || '';
        }
      }
    }

    if (!winner) return null;

    return {
      type: 'MOST_CONSISTENT',
      winner,
      description: `${teamName} had the most consistent scoring with σ = ${lowestStdDev.toFixed(2)}`,
      value: lowestStdDev
    };
  }

  /**
   * Calculate best manager (best win percentage)
   */
  private static async calculateBestManager(teams: any[]): Promise<SeasonAward | null> {
    let bestWinPct = 0;
    let winner: AwardCandidate | null = null;
    let ownerName = '';
    let teamName = '';

    for (const team of teams) {
      const totalGames = team.wins + team.losses + team.ties;
      if (totalGames > 0) {
        const winPct = (team.wins + team.ties * 0.5) / totalGames;
        
        if (winPct > bestWinPct) {
          bestWinPct = winPct;
          winner = {
            id: team.ownerId,
            type: 'USER',
            value: winPct
          };
          ownerName = team.owner.name || team.owner.username;
          teamName = team.name;
        }
      }
    }

    if (!winner) return null;

    return {
      type: 'BEST_MANAGER',
      winner,
      description: `${ownerName} (${teamName}) had a ${(bestWinPct * 100).toFixed(1)}% win rate`
    };
  }

  /**
   * Calculate trade master (most successful trades)
   */
  private static async calculateTradeMaster(leagueId: string, season: number): Promise<SeasonAward | null> {
    const trades = await prisma.trade.findMany({
      where: {
        leagueId,
        status: 'EXECUTED'
      },
      include: {
        initiator: true
      }
    });

    const tradeCount = new Map<string, number>();

    for (const trade of trades) {
      tradeCount.set(trade.initiatorId, (tradeCount.get(trade.initiatorId) || 0) + 1);
      tradeCount.set(trade.partnerId, (tradeCount.get(trade.partnerId) || 0) + 1);
    }

    let mostTrades = 0;
    let winner: AwardCandidate | null = null;
    let teamName = '';

    for (const [teamId, count] of tradeCount) {
      if (count > mostTrades) {
        mostTrades = count;
        winner = {
          id: teamId,
          type: 'TEAM',
          value: count
        };

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        teamName = team?.name || '';
      }
    }

    if (!winner) return null;

    return {
      type: 'TRADE_MASTER',
      winner,
      description: `${teamName} completed ${mostTrades} trades`,
      value: mostTrades
    };
  }

  /**
   * Calculate waiver wire hero
   */
  private static async calculateWaiverWireHero(leagueId: string, season: number): Promise<SeasonAward | null> {
    const transactions = await prisma.transaction.findMany({
      where: {
        leagueId,
        type: 'WAIVER_CLAIM',
        status: 'EXECUTED'
      },
      include: {
        team: true
      }
    });

    const waiverCount = new Map<string, number>();

    for (const transaction of transactions) {
      waiverCount.set(transaction.teamId, (waiverCount.get(transaction.teamId) || 0) + 1);
    }

    let mostWaivers = 0;
    let winner: AwardCandidate | null = null;
    let teamName = '';

    for (const [teamId, count] of waiverCount) {
      if (count > mostWaivers) {
        mostWaivers = count;
        winner = {
          id: teamId,
          type: 'TEAM',
          value: count
        };

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        teamName = team?.name || '';
      }
    }

    if (!winner) return null;

    return {
      type: 'WAIVER_WIRE_HERO',
      winner,
      description: `${teamName} made ${mostWaivers} successful waiver claims`
    };
  }

  /**
   * Check and award achievements for users
   */
  static async checkAchievements(userId: string): Promise<void> {
    // Get user's teams and trophies
    const teams = await prisma.team.findMany({
      where: { ownerId: userId }
    });

    const trophies = await prisma.trophy.findMany({
      where: { userId }
    });

    // Check for various achievements
    await this.checkChampionshipAchievements(userId, trophies);
    await this.checkSeasonAchievements(userId, teams);
    await this.checkSpecialAchievements(userId);
  }

  /**
   * Check championship-related achievements
   */
  private static async checkChampionshipAchievements(userId: string, trophies: any[]): Promise<void> {
    const championships = trophies.filter(t => t.type === 'CHAMPION');

    // First Championship
    if (championships.length === 1) {
      await this.unlockAchievement(userId, 'FIRST_CHAMPIONSHIP', 'First Championship', 'Win your first league championship', 'GOLD');
    }

    // Dynasty (3 championships)
    if (championships.length >= 3) {
      await this.unlockAchievement(userId, 'DYNASTY', 'Dynasty', 'Win 3 league championships', 'PLATINUM');
    }

    // Back-to-Back Championships
    const sortedChampionships = championships.sort((a, b) => a.season - b.season);
    for (let i = 0; i < sortedChampionships.length - 1; i++) {
      if (sortedChampionships[i + 1].season === sortedChampionships[i].season + 1) {
        await this.unlockAchievement(userId, 'BACK_TO_BACK', 'Back-to-Back', 'Win consecutive championships', 'PLATINUM');
        break;
      }
    }
  }

  /**
   * Check season-related achievements
   */
  private static async checkSeasonAchievements(userId: string, teams: any[]): Promise<void> {
    for (const team of teams) {
      // Perfect Season
      if (team.losses === 0 && team.wins >= 13) {
        await this.unlockAchievement(userId, 'PERFECT_SEASON', 'Perfect Season', 'Go undefeated in the regular season', 'PLATINUM');
      }

      // Points Machine (2000+ points in a season)
      if (team.pointsFor >= 2000) {
        await this.unlockAchievement(userId, 'POINTS_MACHINE', 'Points Machine', 'Score 2000+ points in a season', 'GOLD');
      }

      // Comeback Kid (make playoffs after 0-3 start)
      // This would require more complex logic with week-by-week records
    }
  }

  /**
   * Check special achievements
   */
  private static async checkSpecialAchievements(userId: string): Promise<void> {
    // Trade Addict (10+ trades in a season)
    const trades = await prisma.trade.count({
      where: {
        initiatorUserId: userId,
        status: 'EXECUTED'
      }
    });

    if (trades >= 10) {
      await this.unlockAchievement(userId, 'TRADE_ADDICT', 'Trade Addict', 'Complete 10+ trades in a season', 'SILVER');
    }

    // Waiver Wire Warrior (20+ waiver claims)
    const waivers = await prisma.transaction.count({
      where: {
        userId,
        type: 'WAIVER_CLAIM',
        status: 'EXECUTED'
      }
    });

    if (waivers >= 20) {
      await this.unlockAchievement(userId, 'WAIVER_WARRIOR', 'Waiver Wire Warrior', 'Make 20+ successful waiver claims', 'SILVER');
    }
  }

  /**
   * Unlock an achievement for a user
   */
  private static async unlockAchievement(
    userId: string,
    type: string,
    title: string,
    description: string,
    tier: string
  ): Promise<void> {
    const existing = await prisma.achievement.findUnique({
      where: {
        userId_type: {
          userId,
          type
        }
      }
    });

    if (!existing || !existing.isUnlocked) {
      await prisma.achievement.upsert({
        where: {
          userId_type: {
            userId,
            type
          }
        },
        update: {
          isUnlocked: true,
          unlockedAt: new Date(),
          progress: 1,
          target: 1
        },
        create: {
          userId,
          type,
          title,
          description,
          tier,
          isUnlocked: true,
          unlockedAt: new Date(),
          progress: 1,
          target: 1,
          iconUrl: `/achievements/${type.toLowerCase()}.svg`,
          badgeUrl: `/badges/${tier.toLowerCase()}.svg`
        }
      });
    }
  }
}