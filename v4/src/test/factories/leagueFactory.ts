/**
 * League Factory
 * Generates test data for league entities
 */

import { faker } from '@faker-js/faker'
import { BaseFactory, TestUtils, DateUtils, NFLUtils } from './baseFactory'
import type { League } from '@prisma/client'

export type LeagueTestData = Omit<League, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
  createdAt?: Date
  updatedAt?: Date
}

export class LeagueFactory extends BaseFactory<LeagueTestData> {
  protected generateDefaults(): Partial<LeagueTestData> {
    const leagueName = faker.company.name() + ' Fantasy League'
    const currentSeason = DateUtils.getCurrentSeason()
    
    return {
      id: TestUtils.randomId(),
      name: leagueName,
      slug: TestUtils.slugify(leagueName) + '-' + faker.string.alphanumeric(6),
      description: faker.lorem.paragraph(),
      avatar: faker.image.url({ width: 200, height: 200 }),
      season: currentSeason,
      isPublic: TestUtils.randomBoolean(),
      isPremium: TestUtils.randomBoolean(),
      maxTeams: TestUtils.randomArrayElement([8, 10, 12, 14, 16]),
      currentTeams: 0,
      status: 'SETUP',
      draftDate: DateUtils.getDraftDate(currentSeason),
      draftType: TestUtils.randomArrayElement(['SNAKE', 'AUCTION', 'LINEAR']),
      draftTimeLimit: TestUtils.randomArrayElement([60, 90, 120, 180, 300]),
      scoringSystem: TestUtils.randomArrayElement(['STANDARD', 'PPR', 'HALF_PPR', 'CUSTOM']),
      playoffTeams: TestUtils.randomArrayElement([4, 6, 8]),
      playoffStart: 14, // Week 14 typically
      championshipWeek: 17,
      rosterSettings: {
        qb: 1,
        rb: 2,
        wr: 2,
        te: 1,
        flex: 1,
        k: 1,
        dst: 1,
        bench: 6,
        ir: 1,
      },
      scoringSettings: {
        passing: {
          yards: 0.04,
          touchdowns: 4,
          interceptions: -2,
          twoPointConversions: 2,
        },
        rushing: {
          yards: 0.1,
          touchdowns: 6,
          twoPointConversions: 2,
        },
        receiving: {
          yards: 0.1,
          touchdowns: 6,
          receptions: 1, // PPR
          twoPointConversions: 2,
        },
        kicking: {
          fieldGoal0To39: 3,
          fieldGoal40To49: 4,
          fieldGoal50Plus: 5,
          extraPoint: 1,
          missedFieldGoal: -1,
        },
        defense: {
          sack: 1,
          interception: 2,
          fumbleRecovery: 2,
          touchdown: 6,
          safety: 2,
          pointsAllowed0: 10,
          pointsAllowed1To6: 7,
          pointsAllowed7To13: 4,
          pointsAllowed14To20: 1,
          pointsAllowed21To27: 0,
          pointsAllowed28To34: -1,
          pointsAllowed35Plus: -4,
        },
      },
      waiverSettings: {
        type: TestUtils.randomArrayElement(['WAIVER_CLAIMS', 'FREE_AGENT_BUDGET']),
        budget: 100,
        processingTime: TestUtils.randomArrayElement(['TUESDAY', 'WEDNESDAY', 'DAILY']),
        processingHour: TestUtils.randomNumber(0, 23),
      },
      tradeSettings: {
        deadline: 10, // Week 10 trade deadline
        reviewPeriod: TestUtils.randomArrayElement([0, 24, 48, 72]),
        vetoPeriod: TestUtils.randomArrayElement([24, 48, 72]),
        allowTradingFuturePicks: TestUtils.randomBoolean(),
      },
      inviteCode: faker.string.alphanumeric(8).toUpperCase(),
      inviteCodeExpires: faker.date.future({ days: 30 }),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
    }
  }

  protected generateSequenceAttributes(sequence: number): Partial<LeagueTestData> {
    return {
      name: `Test League ${sequence}`,
      slug: `test-league-${sequence}`,
      inviteCode: `TEST${sequence.toString().padStart(4, '0')}`,
    }
  }

  /**
   * Create a public league
   */
  public(overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      isPublic: true,
      ...overrides,
    })
  }

  /**
   * Create a private league
   */
  private(overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      isPublic: false,
      ...overrides,
    })
  }

  /**
   * Create a premium league
   */
  premium(overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      isPremium: true,
      ...overrides,
    })
  }

  /**
   * Create a league in draft state
   */
  drafting(overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      status: 'DRAFTING',
      draftDate: faker.date.recent(),
      currentTeams: this.generateDefaults().maxTeams,
      ...overrides,
    })
  }

  /**
   * Create an active league (season in progress)
   */
  active(overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      status: 'ACTIVE',
      draftDate: faker.date.past({ days: 30 }),
      currentTeams: this.generateDefaults().maxTeams,
      ...overrides,
    })
  }

  /**
   * Create a completed league
   */
  completed(overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      status: 'COMPLETED',
      draftDate: faker.date.past({ days: 120 }),
      currentTeams: this.generateDefaults().maxTeams,
      ...overrides,
    })
  }

  /**
   * Create a league with custom scoring
   */
  withScoring(scoring: Record<string, any>, overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      scoringSystem: 'CUSTOM',
      scoringSettings: {
        ...this.generateDefaults().scoringSettings,
        ...scoring,
      },
      ...overrides,
    })
  }

  /**
   * Create a PPR league
   */
  ppr(overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      scoringSystem: 'PPR',
      scoringSettings: {
        ...this.generateDefaults().scoringSettings,
        receiving: {
          ...this.generateDefaults().scoringSettings?.receiving,
          receptions: 1,
        },
      },
      ...overrides,
    })
  }

  /**
   * Create a standard (non-PPR) league
   */
  standard(overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      scoringSystem: 'STANDARD',
      scoringSettings: {
        ...this.generateDefaults().scoringSettings,
        receiving: {
          ...this.generateDefaults().scoringSettings?.receiving,
          receptions: 0,
        },
      },
      ...overrides,
    })
  }

  /**
   * Create an auction draft league
   */
  auction(overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      draftType: 'AUCTION',
      draftSettings: {
        budget: 200,
        minimumBid: 1,
        bidTimeLimit: 30,
        nominationTimeLimit: 60,
      },
      ...overrides,
    })
  }

  /**
   * Create a dynasty league
   */
  dynasty(overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      isDynasty: true,
      keeperSettings: {
        maxKeepers: 15,
        keeperDeadline: new Date(DateUtils.getCurrentSeason(), 7, 1), // August 1st
        rookieDraftRounds: 4,
      },
      rosterSettings: {
        ...this.generateDefaults().rosterSettings,
        bench: 10,
        ir: 3,
        taxi: 5,
      },
      ...overrides,
    })
  }

  /**
   * Create a keeper league
   */
  keeper(maxKeepers: number = 3, overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      isKeeper: true,
      keeperSettings: {
        maxKeepers,
        keeperDeadline: new Date(DateUtils.getCurrentSeason(), 7, 15), // August 15th
        penaltyType: TestUtils.randomArrayElement(['ROUND_PENALTY', 'AUCTION_VALUE']),
      },
      ...overrides,
    })
  }

  /**
   * Create a league with specific number of teams
   */
  withTeams(teamCount: number, overrides: Partial<LeagueTestData> = {}): LeagueTestData {
    return this.build({
      maxTeams: teamCount,
      currentTeams: teamCount,
      ...overrides,
    })
  }
}

// Export singleton instance
export const leagueFactory = new LeagueFactory()

/**
 * League-related test utilities
 */
export class LeagueTestUtils {
  /**
   * Generate league standings
   */
  static generateStandings(teamCount: number) {
    return Array.from({ length: teamCount }, (_, i) => ({
      teamId: TestUtils.randomId(),
      rank: i + 1,
      wins: TestUtils.randomNumber(0, 13),
      losses: TestUtils.randomNumber(0, 13),
      ties: TestUtils.randomNumber(0, 2),
      pointsFor: TestUtils.randomFloat(800, 1600),
      pointsAgainst: TestUtils.randomFloat(800, 1600),
      streak: TestUtils.randomNumber(-5, 5),
    }))
  }

  /**
   * Generate playoff bracket
   */
  static generatePlayoffBracket(teamCount: number, playoffTeams: number) {
    const teams = Array.from({ length: playoffTeams }, (_, i) => ({
      seed: i + 1,
      teamId: TestUtils.randomId(),
    }))

    return {
      teams,
      rounds: Math.ceil(Math.log2(playoffTeams)),
      championshipWeek: 17,
    }
  }

  /**
   * Generate weekly schedule
   */
  static generateSchedule(teamCount: number, weeks: number = 14) {
    const schedule = []
    const teams = Array.from({ length: teamCount }, () => TestUtils.randomId())
    
    for (let week = 1; week <= weeks; week++) {
      const weekMatchups = []
      const availableTeams = [...teams]
      
      while (availableTeams.length >= 2) {
        const team1 = availableTeams.splice(TestUtils.randomNumber(0, availableTeams.length - 1), 1)[0]
        const team2 = availableTeams.splice(TestUtils.randomNumber(0, availableTeams.length - 1), 1)[0]
        
        weekMatchups.push({
          week,
          homeTeamId: team1,
          awayTeamId: team2,
          homeScore: week <= DateUtils.getCurrentSeason() ? TestUtils.randomFloat(80, 180) : null,
          awayScore: week <= DateUtils.getCurrentSeason() ? TestUtils.randomFloat(80, 180) : null,
        })
      }
      
      schedule.push(...weekMatchups)
    }
    
    return schedule
  }

  /**
   * Generate league activity feed
   */
  static generateActivity(leagueId: string, count: number = 10) {
    const activityTypes = [
      'TRADE_PROPOSED',
      'TRADE_ACCEPTED',
      'WAIVER_CLAIM',
      'FREE_AGENT_PICKUP',
      'PLAYER_DROP',
      'LINEUP_SET',
      'DRAFT_PICK',
    ]

    return Array.from({ length: count }, () => ({
      id: TestUtils.randomId(),
      leagueId,
      type: TestUtils.randomArrayElement(activityTypes),
      description: faker.lorem.sentence(),
      data: {},
      createdAt: faker.date.recent({ days: 7 }),
    }))
  }
}