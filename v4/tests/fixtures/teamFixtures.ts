import { faker } from '@faker-js/faker'
import type { PlayerFixture } from './playerFixtures'
import { createPlayersFixture } from './playerFixtures'

export interface RosterPlayerFixture {
  id: string
  playerId: string
  teamId: string
  position: 'STARTER' | 'BENCH' | 'IR'
  lineupPosition?: 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'K' | 'DST'
  weeklyPoints: Record<number, number> // week -> points
  projectedPoints: number
  player: PlayerFixture
  acquiredAt: Date
  acquiredVia: 'DRAFT' | 'TRADE' | 'WAIVER' | 'FREE_AGENT'
}

export interface TeamFixture {
  id: string
  name: string
  userId: string
  leagueId: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  roster: RosterPlayerFixture[]
  stats: {
    wins: number
    losses: number
    pointsFor: number
    pointsAgainst: number
    transactionCount: number
    tradeCount: number
  }
  settings: {
    autoLineup: boolean
    waiverPriority: number
    draftPosition?: number
  }
  createdAt: Date
  updatedAt: Date
}

const TEAM_COLORS = [
  { primary: '#FF6B35', secondary: '#F7F3E9' }, // Orange/Cream
  { primary: '#2E4057', secondary: '#F0F0F0' }, // Navy/Light Gray
  { primary: '#8B0000', secondary: '#FFD700' }, // Maroon/Gold
  { primary: '#006400', secondary: '#FFFFFF' }, // Dark Green/White
  { primary: '#4B0082', secondary: '#FFA500' }, // Indigo/Orange
  { primary: '#000080', secondary: '#C0C0C0' }, // Navy/Silver
  { primary: '#800080', secondary: '#FFFF00' }, // Purple/Yellow
  { primary: '#B22222', secondary: '#F0F8FF' }, // Fire Brick/Alice Blue
]

const TEAM_NAMES = [
  'Thunder Bolts', 'Fire Dragons', 'Storm Chasers', 'Lightning Wolves',
  'Iron Eagles', 'Crimson Hawks', 'Golden Panthers', 'Silver Bullets',
  'Diamond Dogs', 'Platinum Tigers', 'Midnight Raiders', 'Solar Flares',
  'Cyber Sharks', 'Neon Ninjas', 'Atomic Bombers', 'Laser Legends'
]

export const createRosterPlayerFixture = (
  options: Partial<RosterPlayerFixture> = {}
): RosterPlayerFixture => {
  const player = options.player || createPlayersFixture(1)[0]
  const weeklyPoints: Record<number, number> = {}
  
  // Generate weekly points for 18 weeks
  for (let week = 1; week <= 18; week++) {
    weeklyPoints[week] = faker.number.float({ min: 0, max: 35, fractionDigits: 1 })
  }

  return {
    id: faker.string.uuid(),
    playerId: player.id,
    teamId: faker.string.uuid(),
    position: faker.helpers.arrayElement(['STARTER', 'BENCH', 'IR']),
    lineupPosition: faker.helpers.maybe(() =>
      faker.helpers.arrayElement(['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'])
    ),
    weeklyPoints,
    projectedPoints: faker.number.float({ min: 100, max: 300, fractionDigits: 1 }),
    player,
    acquiredAt: faker.date.past({ years: 1 }),
    acquiredVia: faker.helpers.arrayElement(['DRAFT', 'TRADE', 'WAIVER', 'FREE_AGENT']),
    ...options,
  }
}

export const createValidRosterFixture = (): RosterPlayerFixture[] => {
  const roster: RosterPlayerFixture[] = []
  
  // Create starting lineup
  const startingPositions = [
    { position: 'QB', count: 1 },
    { position: 'RB', count: 2 },
    { position: 'WR', count: 2 },
    { position: 'TE', count: 1 },
    { position: 'FLEX', count: 1 },
    { position: 'K', count: 1 },
    { position: 'DST', count: 1 },
  ]

  startingPositions.forEach(({ position, count }) => {
    for (let i = 0; i < count; i++) {
      const playerPosition = position === 'FLEX' 
        ? faker.helpers.arrayElement(['RB', 'WR', 'TE'])
        : position
      
      const player = createPlayersFixture(1, { 
        position: playerPosition as any 
      })[0]
      
      roster.push(createRosterPlayerFixture({
        player,
        position: 'STARTER',
        lineupPosition: position as any,
      }))
    }
  })

  // Create bench players (6 bench spots)
  const benchPositions = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE']
  benchPositions.forEach(pos => {
    const player = createPlayersFixture(1, { 
      position: pos as any 
    })[0]
    
    roster.push(createRosterPlayerFixture({
      player,
      position: 'BENCH',
    }))
  })

  return roster
}

export const createTeamFixture = (
  options: Partial<TeamFixture> = {}
): TeamFixture => {
  const colorScheme = faker.helpers.arrayElement(TEAM_COLORS)
  const roster = options.roster || createValidRosterFixture()
  
  // Calculate team stats from roster
  const totalPoints = roster.reduce((sum, rosterPlayer) => {
    return sum + Object.values(rosterPlayer.weeklyPoints).reduce((a, b) => a + b, 0)
  }, 0)

  return {
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(TEAM_NAMES),
    userId: faker.string.uuid(),
    leagueId: faker.string.uuid(),
    logoUrl: faker.helpers.maybe(() => faker.image.url({ width: 100, height: 100 })),
    primaryColor: colorScheme.primary,
    secondaryColor: colorScheme.secondary,
    roster,
    stats: {
      wins: faker.number.int({ min: 0, max: 14 }),
      losses: faker.number.int({ min: 0, max: 14 }),
      pointsFor: totalPoints,
      pointsAgainst: faker.number.float({ min: 800, max: 2000, fractionDigits: 1 }),
      transactionCount: faker.number.int({ min: 5, max: 50 }),
      tradeCount: faker.number.int({ min: 0, max: 10 }),
    },
    settings: {
      autoLineup: faker.datatype.boolean(),
      waiverPriority: faker.number.int({ min: 1, max: 12 }),
      draftPosition: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 12 })),
    },
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent(),
    ...options,
  }
}

export const createTeamsFixture = (
  count: number = 10,
  leagueId?: string
): TeamFixture[] => {
  return Array.from({ length: count }, (_, index) => 
    createTeamFixture({
      leagueId: leagueId || faker.string.uuid(),
      settings: {
        ...createTeamFixture().settings,
        draftPosition: index + 1,
        waiverPriority: count - index, // Inverse of draft position
      },
    })
  )
}

export const createDraftedRosterFixture = (draftPosition: number): RosterPlayerFixture[] => {
  const roster: RosterPlayerFixture[] = []
  const rounds = 15
  
  for (let round = 1; round <= rounds; round++) {
    // Determine position to draft based on round
    let position: string
    if (round <= 2) position = faker.helpers.arrayElement(['RB', 'WR'])
    else if (round === 3) position = 'QB'
    else if (round <= 6) position = faker.helpers.arrayElement(['RB', 'WR', 'TE'])
    else if (round <= 12) position = faker.helpers.arrayElement(['RB', 'WR', 'QB', 'TE'])
    else if (round === 13) position = 'DST'
    else if (round === 14) position = 'K'
    else position = faker.helpers.arrayElement(['RB', 'WR', 'QB'])

    const player = createPlayersFixture(1, { 
      position: position as any,
      adp: (round - 1) * 12 + draftPosition + faker.number.int({ min: -5, max: 5 })
    })[0]
    
    roster.push(createRosterPlayerFixture({
      player,
      position: round <= 9 ? 'STARTER' : 'BENCH',
      acquiredVia: 'DRAFT',
      acquiredAt: faker.date.past({ days: 30 }),
    }))
  }

  return roster
}

export const createOptimalLineupFixture = (roster: RosterPlayerFixture[], week: number) => {
  const lineup: Record<string, RosterPlayerFixture | null> = {
    QB: null,
    RB1: null,
    RB2: null,
    WR1: null,
    WR2: null,
    TE: null,
    FLEX: null,
    K: null,
    DST: null,
  }

  // Sort players by projected points for the week
  const availablePlayers = roster
    .filter(rp => rp.position !== 'IR')
    .sort((a, b) => (b.weeklyPoints[week] || 0) - (a.weeklyPoints[week] || 0))

  // Fill required positions first
  const positionRequirements = {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    K: 1,
    DST: 1,
  }

  Object.entries(positionRequirements).forEach(([pos, count]) => {
    const eligiblePlayers = availablePlayers.filter(
      rp => rp.player.position === pos && !Object.values(lineup).includes(rp)
    )

    for (let i = 0; i < count && i < eligiblePlayers.length; i++) {
      const key = pos === 'RB' ? `RB${i + 1}` : pos === 'WR' ? `WR${i + 1}` : pos
      lineup[key] = eligiblePlayers[i]
    }
  })

  // Fill FLEX with best remaining RB/WR/TE
  const flexEligible = availablePlayers.filter(
    rp => ['RB', 'WR', 'TE'].includes(rp.player.position) && 
    !Object.values(lineup).includes(rp)
  )
  
  if (flexEligible.length > 0) {
    lineup.FLEX = flexEligible[0]
  }

  return lineup
}