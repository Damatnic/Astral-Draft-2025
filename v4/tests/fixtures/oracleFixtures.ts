import { faker } from '@faker-js/faker'

export interface OraclePredictionFixture {
  id: string
  playerId: string
  week: number
  season: number
  projectedPoints: number
  confidence: number
  predictionType: 'WEEKLY' | 'SEASON' | 'DRAFT_VALUE'
  modelVersion: string
  factors: {
    matchupDifficulty: number
    weatherImpact: number
    injuryRisk: number
    recentForm: number
    teamPerformance: number
  }
  metadata: {
    dataQuality: number
    lastUpdated: Date
    sourceReliability: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface OracleInsightFixture {
  id: string
  type: 'TRADE_ANALYSIS' | 'WAIVER_RECOMMENDATION' | 'LINEUP_OPTIMIZATION' | 'DRAFT_STRATEGY'
  title: string
  description: string
  confidence: number
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  relevantPlayerIds: string[]
  actionRecommendation: string
  reasoning: string[]
  dataPoints: Record<string, number>
  createdAt: Date
  expiresAt: Date
}

export interface OracleAnalysisFixture {
  id: string
  analysisType: 'PLAYER_COMPARISON' | 'MATCHUP_PREVIEW' | 'SEASON_OUTLOOK' | 'INJURY_IMPACT'
  subjectId: string // player, matchup, or team ID
  results: {
    summary: string
    keyMetrics: Record<string, number>
    recommendations: string[]
    riskFactors: string[]
    opportunityScore: number
  }
  confidence: number
  modelInputs: Record<string, any>
  createdAt: Date
}

export const createOraclePredictionFixture = (
  options: Partial<OraclePredictionFixture> = {}
): OraclePredictionFixture => {
  const week = options.week || faker.number.int({ min: 1, max: 18 })
  const confidence = options.confidence || faker.number.float({ min: 0.6, max: 0.95 })
  
  return {
    id: faker.string.uuid(),
    playerId: faker.string.uuid(),
    week,
    season: 2024,
    projectedPoints: faker.number.float({ min: 2, max: 35, fractionDigits: 1 }),
    confidence,
    predictionType: faker.helpers.arrayElement(['WEEKLY', 'SEASON', 'DRAFT_VALUE']),
    modelVersion: `v${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({ min: 0, max: 10 })}`,
    factors: {
      matchupDifficulty: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
      weatherImpact: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
      injuryRisk: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
      recentForm: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
      teamPerformance: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
    },
    metadata: {
      dataQuality: faker.number.float({ min: 0.7, max: 1, fractionDigits: 2 }),
      lastUpdated: faker.date.recent({ days: 1 }),
      sourceReliability: faker.number.float({ min: 0.8, max: 1, fractionDigits: 2 }),
    },
    createdAt: faker.date.recent({ days: 7 }),
    updatedAt: faker.date.recent({ days: 1 }),
    ...options,
  }
}

export const createOracleInsightFixture = (
  options: Partial<OracleInsightFixture> = {}
): OracleInsightFixture => {
  const type = options.type || faker.helpers.arrayElement([
    'TRADE_ANALYSIS',
    'WAIVER_RECOMMENDATION', 
    'LINEUP_OPTIMIZATION',
    'DRAFT_STRATEGY'
  ])
  
  const titles = {
    TRADE_ANALYSIS: 'Trade Opportunity Detected',
    WAIVER_RECOMMENDATION: 'High-Value Waiver Target',
    LINEUP_OPTIMIZATION: 'Optimal Lineup Suggestion',
    DRAFT_STRATEGY: 'Draft Strategy Adjustment'
  }
  
  return {
    id: faker.string.uuid(),
    type,
    title: titles[type],
    description: faker.lorem.sentences(2),
    confidence: faker.number.float({ min: 0.65, max: 0.95, fractionDigits: 2 }),
    impact: faker.helpers.arrayElement(['HIGH', 'MEDIUM', 'LOW']),
    relevantPlayerIds: Array.from(
      { length: faker.number.int({ min: 1, max: 4 }) },
      () => faker.string.uuid()
    ),
    actionRecommendation: faker.lorem.sentence(),
    reasoning: Array.from(
      { length: faker.number.int({ min: 2, max: 5 }) },
      () => faker.lorem.sentence()
    ),
    dataPoints: {
      projectedImpact: faker.number.float({ min: 1, max: 15, fractionDigits: 1 }),
      riskScore: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
      valueScore: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
      timeRelevance: faker.number.float({ min: 0.5, max: 1, fractionDigits: 2 }),
    },
    createdAt: faker.date.recent({ days: 1 }),
    expiresAt: faker.date.future({ days: 7 }),
    ...options,
  }
}

export const createOracleAnalysisFixture = (
  options: Partial<OracleAnalysisFixture> = {}
): OracleAnalysisFixture => {
  const analysisType = options.analysisType || faker.helpers.arrayElement([
    'PLAYER_COMPARISON',
    'MATCHUP_PREVIEW', 
    'SEASON_OUTLOOK',
    'INJURY_IMPACT'
  ])
  
  return {
    id: faker.string.uuid(),
    analysisType,
    subjectId: faker.string.uuid(),
    results: {
      summary: faker.lorem.paragraph(),
      keyMetrics: {
        expectedValue: faker.number.float({ min: 5, max: 25, fractionDigits: 1 }),
        riskAdjustedValue: faker.number.float({ min: 4, max: 20, fractionDigits: 1 }),
        volatility: faker.number.float({ min: 0.1, max: 0.8, fractionDigits: 2 }),
        ceiling: faker.number.float({ min: 15, max: 40, fractionDigits: 1 }),
        floor: faker.number.float({ min: 0, max: 10, fractionDigits: 1 }),
      },
      recommendations: Array.from(
        { length: faker.number.int({ min: 2, max: 4 }) },
        () => faker.lorem.sentence()
      ),
      riskFactors: Array.from(
        { length: faker.number.int({ min: 1, max: 3 }) },
        () => faker.lorem.sentence()
      ),
      opportunityScore: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
    },
    confidence: faker.number.float({ min: 0.7, max: 0.95, fractionDigits: 2 }),
    modelInputs: {
      historicalData: faker.number.int({ min: 10, max: 100 }),
      recentGameData: faker.number.int({ min: 3, max: 10 }),
      injuryReports: faker.number.int({ min: 0, max: 5 }),
      weatherData: faker.datatype.boolean(),
      teamContext: faker.datatype.boolean(),
    },
    createdAt: faker.date.recent({ days: 1 }),
    ...options,
  }
}

export const createWeeklyPredictionsFixture = (playerIds: string[], week: number) => {
  return playerIds.map(playerId => 
    createOraclePredictionFixture({
      playerId,
      week,
      predictionType: 'WEEKLY',
    })
  )
}

export const createSeasonProjectionsFixture = (playerIds: string[]) => {
  return playerIds.map(playerId => 
    createOraclePredictionFixture({
      playerId,
      week: 0, // Season-long projection
      predictionType: 'SEASON',
      projectedPoints: faker.number.float({ min: 100, max: 400, fractionDigits: 1 }),
    })
  )
}

export const createDraftValuePredictionsFixture = (playerIds: string[]) => {
  return playerIds.map(playerId => 
    createOraclePredictionFixture({
      playerId,
      predictionType: 'DRAFT_VALUE',
      projectedPoints: faker.number.float({ min: 150, max: 350, fractionDigits: 1 }),
      confidence: faker.number.float({ min: 0.75, max: 0.95, fractionDigits: 2 }),
    })
  )
}

export const createTradeAnalysisInsightFixture = (playerIds: string[]) => {
  return createOracleInsightFixture({
    type: 'TRADE_ANALYSIS',
    relevantPlayerIds: playerIds,
    title: 'Favorable Trade Opportunity',
    description: 'Analysis suggests this trade would improve your team strength',
    impact: 'HIGH',
    actionRecommendation: 'Execute this trade before the deadline',
  })
}

export const createWaiverRecommendationFixture = (playerId: string) => {
  return createOracleInsightFixture({
    type: 'WAIVER_RECOMMENDATION',
    relevantPlayerIds: [playerId],
    title: 'High-Priority Waiver Target',
    description: 'This player shows strong upside potential',
    impact: 'MEDIUM',
    actionRecommendation: 'Prioritize this player on waivers',
  })
}

export const createPlayerComparisonAnalysisFixture = (playerIds: string[]) => {
  return createOracleAnalysisFixture({
    analysisType: 'PLAYER_COMPARISON',
    subjectId: playerIds[0],
    results: {
      summary: 'Comprehensive player comparison analysis',
      keyMetrics: {
        expectedValue: 18.5,
        riskAdjustedValue: 16.2,
        volatility: 0.35,
        ceiling: 28.0,
        floor: 8.0,
      },
      recommendations: [
        'Consider as strong WR2 option',
        'Monitor injury status closely',
        'Good trade value in current market'
      ],
      riskFactors: [
        'Injury history concerns',
        'Team offensive line issues'
      ],
      opportunityScore: 78.5,
    },
  })
}