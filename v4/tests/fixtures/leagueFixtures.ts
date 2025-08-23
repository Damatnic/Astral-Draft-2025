import type { League, LeagueSettings, DraftSettings, ScoringSettings } from '@prisma/client'
import { faker } from '@faker-js/faker'

export interface CreateLeagueFixtureOptions {
  id?: string
  name?: string
  description?: string
  commissionerId?: string
  maxTeams?: number
  currentSeason?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT_PENDING' | 'DRAFT_IN_PROGRESS' | 'SEASON_COMPLETE'
  isPublic?: boolean
  createdAt?: Date
  updatedAt?: Date
}

const createDefaultLeagueSettings = (): LeagueSettings => ({
  rosterPositions: {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    FLEX: 1,
    DST: 1,
    K: 1,
    BENCH: 6,
  },
  startingLineupSize: 9,
  benchSize: 6,
  injuredReserveSlots: 1,
  waiverPeriod: 2,
  tradeDeadline: '2024-11-15',
  playoffWeeks: [15, 16, 17],
  regularSeasonWeeks: 14,
  divisionalPlay: false,
  conferencePlay: false,
})

const createDefaultDraftSettings = (): DraftSettings => ({
  type: 'SNAKE',
  rounds: 15,
  pickTimeLimit: 120, // 2 minutes
  order: 'RANDOMIZED',
  scheduledAt: faker.date.future(),
  allowTrades: true,
  autopickEnabled: true,
  isPPR: true,
})

const createDefaultScoringSettings = (): ScoringSettings => ({
  passing: {
    passingYards: 0.04,
    passingTouchdowns: 4,
    interceptions: -2,
    passingTwoPointConversions: 2,
  },
  rushing: {
    rushingYards: 0.1,
    rushingTouchdowns: 6,
    rushingTwoPointConversions: 2,
  },
  receiving: {
    receivingYards: 0.1,
    receivingTouchdowns: 6,
    receptions: 1, // PPR
    receivingTwoPointConversions: 2,
  },
  kicking: {
    fieldGoalsMade: {
      '0-29': 3,
      '30-39': 3,
      '40-49': 4,
      '50+': 5,
    },
    fieldGoalsMissed: {
      '0-29': -3,
      '30-39': -2,
      '40-49': -1,
      '50+': 0,
    },
    extraPoints: 1,
  },
  defense: {
    pointsAllowed: {
      '0': 10,
      '1-6': 7,
      '7-13': 4,
      '14-20': 1,
      '21-27': 0,
      '28-34': -1,
      '35+': -4,
    },
    yardsAllowed: {
      'under-100': 4,
      '100-199': 2,
      '200-299': 0,
      '300-399': -1,
      '400-449': -3,
      '450+': -5,
    },
    sacks: 1,
    interceptions: 2,
    fumblesRecovered: 2,
    safeties: 2,
    defensiveTouchdowns: 6,
    blockKicks: 2,
  },
  misc: {
    fumbles: -2,
    fumblesLost: -1,
  },
})

export const createLeagueFixture = (
  options: CreateLeagueFixtureOptions = {}
): League => {
  return {
    id: options.id || faker.string.uuid(),
    name: options.name || `${faker.company.name()} Fantasy League`,
    description: options.description || faker.lorem.sentences(2),
    commissionerId: options.commissionerId || faker.string.uuid(),
    maxTeams: options.maxTeams || faker.helpers.arrayElement([8, 10, 12, 14, 16]),
    currentSeason: options.currentSeason || new Date().getFullYear(),
    status: options.status || 'ACTIVE',
    isPublic: options.isPublic ?? false,
    inviteCode: faker.string.alphanumeric(8).toUpperCase(),
    createdAt: options.createdAt || faker.date.past(),
    updatedAt: options.updatedAt || faker.date.recent(),
    settings: createDefaultLeagueSettings(),
    draftSettings: createDefaultDraftSettings(),
    scoringSettings: createDefaultScoringSettings(),
    logo: faker.image.url({ width: 200, height: 200 }),
    theme: faker.helpers.arrayElement(['default', 'dark', 'blue', 'green', 'purple']),
  }
}

export const createLeaguesFixture = (
  count: number = 5,
  options: CreateLeagueFixtureOptions = {}
): League[] => {
  const leagues: League[] = []
  
  for (let i = 0; i < count; i++) {
    const league = createLeagueFixture({
      ...options,
      id: undefined, // Force unique ID for each league
      name: undefined, // Force unique name for each league
    })
    leagues.push(league)
  }
  
  return leagues
}

export const createDraftPendingLeagueFixture = (
  options: CreateLeagueFixtureOptions = {}
): League => {
  return createLeagueFixture({
    ...options,
    status: 'DRAFT_PENDING',
    draftSettings: {
      ...createDefaultDraftSettings(),
      scheduledAt: faker.date.future({ days: 7 }), // Draft scheduled within a week
    },
  })
}

export const createActiveSeasonLeagueFixture = (
  options: CreateLeagueFixtureOptions = {}
): League => {
  return createLeagueFixture({
    ...options,
    status: 'ACTIVE',
    draftSettings: {
      ...createDefaultDraftSettings(),
      scheduledAt: faker.date.past({ days: 30 }), // Draft completed
    },
  })
}

export const createPublicLeagueFixture = (
  options: CreateLeagueFixtureOptions = {}
): League => {
  return createLeagueFixture({
    ...options,
    isPublic: true,
    status: 'DRAFT_PENDING',
  })
}