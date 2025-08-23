/**
 * Base Factory Class
 * Provides common functionality for all test data factories
 */

import { faker } from '@faker-js/faker'

export class BaseFactory<T> {
  protected defaultAttributes: Partial<T> = {}
  
  constructor(defaultAttributes: Partial<T> = {}) {
    this.defaultAttributes = defaultAttributes
  }

  /**
   * Create a single instance with optional overrides
   */
  build(overrides: Partial<T> = {}): T {
    return {
      ...this.defaultAttributes,
      ...this.generateDefaults(),
      ...overrides,
    } as T
  }

  /**
   * Create multiple instances
   */
  buildList(count: number, overrides: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => this.build(overrides))
  }

  /**
   * Create instance with sequential attributes for list generation
   */
  buildSequence(sequence: number, overrides: Partial<T> = {}): T {
    return {
      ...this.defaultAttributes,
      ...this.generateDefaults(),
      ...this.generateSequenceAttributes(sequence),
      ...overrides,
    } as T
  }

  /**
   * Generate default attributes (to be overridden by subclasses)
   */
  protected generateDefaults(): Partial<T> {
    return {}
  }

  /**
   * Generate sequence-specific attributes
   */
  protected generateSequenceAttributes(sequence: number): Partial<T> {
    return {}
  }

  /**
   * Set default attributes for the factory
   */
  withDefaults(attributes: Partial<T>): BaseFactory<T> {
    return new BaseFactory({
      ...this.defaultAttributes,
      ...attributes,
    })
  }
}

/**
 * Common test utilities
 */
export class TestUtils {
  static randomId(): string {
    return faker.string.uuid()
  }

  static randomEmail(): string {
    return faker.internet.email()
  }

  static randomUsername(): string {
    return faker.internet.userName().toLowerCase()
  }

  static randomPassword(): string {
    return faker.internet.password({ length: 12 })
  }

  static randomDate(options?: { past?: boolean; future?: boolean }): Date {
    if (options?.past) {
      return faker.date.past()
    }
    if (options?.future) {
      return faker.date.future()
    }
    return faker.date.recent()
  }

  static randomBoolean(): boolean {
    return faker.datatype.boolean()
  }

  static randomNumber(min: number = 0, max: number = 100): number {
    return faker.number.int({ min, max })
  }

  static randomFloat(min: number = 0, max: number = 100): number {
    return faker.number.float({ min, max, fractionDigits: 2 })
  }

  static randomArrayElement<T>(array: T[]): T {
    return faker.helpers.arrayElement(array)
  }

  static randomArrayElements<T>(array: T[], count?: number): T[] {
    return faker.helpers.arrayElements(array, count)
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .trim()
  }
}

/**
 * Date utilities for testing
 */
export class DateUtils {
  static getCurrentSeason(): number {
    const now = new Date()
    const month = now.getMonth() + 1 // JavaScript months are 0-indexed
    
    // NFL season typically runs from September to February
    if (month >= 9) {
      return now.getFullYear()
    } else {
      return now.getFullYear() - 1
    }
  }

  static getSeasonStartDate(year?: number): Date {
    const season = year || this.getCurrentSeason()
    return new Date(season, 8, 1) // September 1st
  }

  static getSeasonEndDate(year?: number): Date {
    const season = year || this.getCurrentSeason()
    return new Date(season + 1, 1, 28) // February 28th of next year
  }

  static getDraftDate(year?: number): Date {
    const season = year || this.getCurrentSeason()
    // Draft typically happens in late August/early September
    return faker.date.between({
      from: new Date(season, 7, 15), // August 15
      to: new Date(season, 8, 15),   // September 15
    })
  }

  static getRandomGameDate(year?: number): Date {
    const season = year || this.getCurrentSeason()
    return faker.date.between({
      from: this.getSeasonStartDate(season),
      to: this.getSeasonEndDate(season),
    })
  }
}

/**
 * NFL-specific test utilities
 */
export class NFLUtils {
  static readonly POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const
  static readonly SKILL_POSITIONS = ['QB', 'RB', 'WR', 'TE'] as const
  static readonly TEAMS = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
    'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA',
    'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB',
    'TEN', 'WAS'
  ] as const

  static randomPosition(skillOnly: boolean = false): string {
    const positions = skillOnly ? this.SKILL_POSITIONS : this.POSITIONS
    return TestUtils.randomArrayElement([...positions])
  }

  static randomTeam(): string {
    return TestUtils.randomArrayElement([...this.TEAMS])
  }

  static randomByeWeek(): number {
    return TestUtils.randomNumber(4, 14) // Bye weeks typically 4-14
  }

  static randomJerseyNumber(position?: string): number {
    // NFL jersey number rules
    switch (position) {
      case 'QB':
        return TestUtils.randomNumber(1, 19)
      case 'RB':
      case 'FB':
        return TestUtils.randomNumber(20, 49)
      case 'WR':
        return TestUtils.randomNumber(10, 19) || TestUtils.randomNumber(80, 89)
      case 'TE':
        return TestUtils.randomNumber(40, 49) || TestUtils.randomNumber(80, 89)
      case 'K':
      case 'P':
        return TestUtils.randomNumber(1, 19)
      default:
        return TestUtils.randomNumber(1, 99)
    }
  }

  static generateStats(position: string): Record<string, number> {
    const baseStats = {
      games_played: TestUtils.randomNumber(12, 17),
      games_started: TestUtils.randomNumber(8, 17),
    }

    switch (position) {
      case 'QB':
        return {
          ...baseStats,
          passing_yards: TestUtils.randomNumber(2000, 5500),
          passing_tds: TestUtils.randomNumber(15, 55),
          interceptions: TestUtils.randomNumber(5, 20),
          rushing_yards: TestUtils.randomNumber(0, 1000),
          rushing_tds: TestUtils.randomNumber(0, 15),
          completions: TestUtils.randomNumber(200, 450),
          attempts: TestUtils.randomNumber(300, 700),
        }
      case 'RB':
        return {
          ...baseStats,
          rushing_yards: TestUtils.randomNumber(300, 2000),
          rushing_tds: TestUtils.randomNumber(2, 25),
          receptions: TestUtils.randomNumber(10, 100),
          receiving_yards: TestUtils.randomNumber(100, 1000),
          receiving_tds: TestUtils.randomNumber(0, 15),
          carries: TestUtils.randomNumber(50, 400),
        }
      case 'WR':
      case 'TE':
        return {
          ...baseStats,
          receptions: TestUtils.randomNumber(20, 150),
          receiving_yards: TestUtils.randomNumber(200, 1800),
          receiving_tds: TestUtils.randomNumber(1, 20),
          targets: TestUtils.randomNumber(30, 200),
          rushing_yards: TestUtils.randomNumber(0, 200),
          rushing_tds: TestUtils.randomNumber(0, 5),
        }
      case 'K':
        return {
          ...baseStats,
          field_goals_made: TestUtils.randomNumber(15, 35),
          field_goals_attempted: TestUtils.randomNumber(20, 40),
          extra_points_made: TestUtils.randomNumber(20, 60),
          extra_points_attempted: TestUtils.randomNumber(20, 65),
        }
      case 'DST':
        return {
          ...baseStats,
          sacks: TestUtils.randomNumber(15, 60),
          interceptions: TestUtils.randomNumber(5, 25),
          fumble_recoveries: TestUtils.randomNumber(5, 20),
          defensive_tds: TestUtils.randomNumber(0, 5),
          points_allowed: TestUtils.randomNumber(200, 500),
          yards_allowed: TestUtils.randomNumber(4000, 7000),
        }
      default:
        return baseStats
    }
  }
}