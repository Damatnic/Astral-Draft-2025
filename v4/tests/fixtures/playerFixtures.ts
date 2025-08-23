import { faker } from '@faker-js/faker'

export interface PlayerFixture {
  id: string
  name: string
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST'
  team: string
  byeWeek: number
  projectedPoints: number
  adp: number
  tier: number
  isInjured: boolean
  injuryStatus?: 'QUESTIONABLE' | 'DOUBTFUL' | 'OUT' | 'IR'
  stats?: {
    passingYards?: number
    passingTouchdowns?: number
    interceptions?: number
    rushingYards?: number
    rushingTouchdowns?: number
    receptions?: number
    receivingYards?: number
    receivingTouchdowns?: number
    fumbles?: number
  }
}

const NFL_TEAMS = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
]

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const

export const createPlayerFixture = (
  options: Partial<PlayerFixture> = {}
): PlayerFixture => {
  const position = options.position || faker.helpers.arrayElement(POSITIONS)
  
  return {
    id: faker.string.uuid(),
    name: `${faker.person.firstName()} ${faker.person.lastName()}`,
    position,
    team: faker.helpers.arrayElement(NFL_TEAMS),
    byeWeek: faker.number.int({ min: 4, max: 14 }),
    projectedPoints: faker.number.float({ min: 50, max: 350, fractionDigits: 1 }),
    adp: faker.number.float({ min: 1, max: 300, fractionDigits: 1 }),
    tier: faker.number.int({ min: 1, max: 10 }),
    isInjured: faker.datatype.boolean({ probability: 0.1 }),
    injuryStatus: faker.helpers.maybe(
      () => faker.helpers.arrayElement(['QUESTIONABLE', 'DOUBTFUL', 'OUT', 'IR']),
      { probability: 0.1 }
    ),
    stats: generateStatsForPosition(position),
    ...options,
  }
}

const generateStatsForPosition = (position: typeof POSITIONS[number]) => {
  switch (position) {
    case 'QB':
      return {
        passingYards: faker.number.int({ min: 2000, max: 5500 }),
        passingTouchdowns: faker.number.int({ min: 15, max: 55 }),
        interceptions: faker.number.int({ min: 5, max: 20 }),
        rushingYards: faker.number.int({ min: 0, max: 1200 }),
        rushingTouchdowns: faker.number.int({ min: 0, max: 15 }),
        fumbles: faker.number.int({ min: 0, max: 8 }),
      }
    case 'RB':
      return {
        rushingYards: faker.number.int({ min: 200, max: 2000 }),
        rushingTouchdowns: faker.number.int({ min: 0, max: 25 }),
        receptions: faker.number.int({ min: 10, max: 100 }),
        receivingYards: faker.number.int({ min: 50, max: 800 }),
        receivingTouchdowns: faker.number.int({ min: 0, max: 15 }),
        fumbles: faker.number.int({ min: 0, max: 5 }),
      }
    case 'WR':
    case 'TE':
      return {
        receptions: faker.number.int({ min: 20, max: 150 }),
        receivingYards: faker.number.int({ min: 200, max: 1900 }),
        receivingTouchdowns: faker.number.int({ min: 0, max: 20 }),
        rushingYards: faker.number.int({ min: 0, max: 200 }),
        rushingTouchdowns: faker.number.int({ min: 0, max: 3 }),
        fumbles: faker.number.int({ min: 0, max: 3 }),
      }
    default:
      return {}
  }
}

export const createPlayersFixture = (
  count: number = 10,
  options: Partial<PlayerFixture> = {}
): PlayerFixture[] => {
  return Array.from({ length: count }, () => createPlayerFixture(options))
}

export const createDraftEligiblePlayersFixture = (): PlayerFixture[] => {
  const players: PlayerFixture[] = []
  
  // Create QB pool (32 QBs)
  for (let i = 0; i < 32; i++) {
    players.push(createPlayerFixture({
      position: 'QB',
      adp: i * 8 + faker.number.int({ min: 1, max: 20 }),
      tier: Math.floor(i / 4) + 1,
    }))
  }
  
  // Create RB pool (64 RBs)
  for (let i = 0; i < 64; i++) {
    players.push(createPlayerFixture({
      position: 'RB',
      adp: i * 4 + faker.number.int({ min: 1, max: 10 }),
      tier: Math.floor(i / 8) + 1,
    }))
  }
  
  // Create WR pool (80 WRs)
  for (let i = 0; i < 80; i++) {
    players.push(createPlayerFixture({
      position: 'WR',
      adp: i * 3 + faker.number.int({ min: 1, max: 8 }),
      tier: Math.floor(i / 10) + 1,
    }))
  }
  
  // Create TE pool (32 TEs)
  for (let i = 0; i < 32; i++) {
    players.push(createPlayerFixture({
      position: 'TE',
      adp: i * 6 + faker.number.int({ min: 1, max: 15 }),
      tier: Math.floor(i / 4) + 1,
    }))
  }
  
  // Create K pool (32 Ks)
  for (let i = 0; i < 32; i++) {
    players.push(createPlayerFixture({
      position: 'K',
      adp: 200 + i * 2,
      tier: Math.floor(i / 8) + 1,
    }))
  }
  
  // Create DST pool (32 DSTs)
  for (let i = 0; i < 32; i++) {
    players.push(createPlayerFixture({
      position: 'DST',
      name: `${faker.helpers.arrayElement(NFL_TEAMS)} Defense`,
      adp: 180 + i * 3,
      tier: Math.floor(i / 8) + 1,
    }))
  }
  
  return players.sort((a, b) => a.adp - b.adp)
}

export const createTopPlayersByPositionFixture = () => {
  return {
    QB: createPlayersFixture(12, { position: 'QB', tier: 1 }),
    RB: createPlayersFixture(24, { position: 'RB', tier: 1 }),
    WR: createPlayersFixture(36, { position: 'WR', tier: 1 }),
    TE: createPlayersFixture(12, { position: 'TE', tier: 1 }),
    K: createPlayersFixture(10, { position: 'K', tier: 1 }),
    DST: createPlayersFixture(10, { position: 'DST', tier: 1 }),
  }
}