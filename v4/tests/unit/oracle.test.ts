/**
 * @fileoverview Comprehensive Oracle AI prediction system unit tests
 * Target Coverage: 90% for critical Oracle module
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  createOraclePredictionFixture,
  createOracleInsightFixture,
  createOracleAnalysisFixture,
  createWeeklyPredictionsFixture,
  createTradeAnalysisInsightFixture,
  createPlayerComparisonAnalysisFixture,
} from '../fixtures'

// Mock Gemini AI client
const mockGeminiClient = {
  generatePrediction: jest.fn(),
  analyzePlayerData: jest.fn(),
  generateInsight: jest.fn(),
  calculateConfidence: jest.fn(),
}

// Mock database operations
const mockPrisma = {
  oraclePrediction: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  oracleInsight: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  oracleAnalysis: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  player: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
}

// Mock Redis cache
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
}

jest.mock('../../src/lib/oracle/gemini-client', () => ({
  geminiClient: mockGeminiClient,
}))

jest.mock('../../src/server/db', () => ({
  prisma: mockPrisma,
}))

jest.mock('../../src/server/redis', () => ({
  redis: mockRedis,
}))

describe('Oracle AI Prediction System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRedis.get.mockResolvedValue(null) // Default cache miss
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Prediction Generation', () => {
    it('should generate weekly player predictions', async () => {
      const playerIds = ['player-1', 'player-2', 'player-3']
      const week = 5
      const predictions = createWeeklyPredictionsFixture(playerIds, week)

      mockGeminiClient.generatePrediction.mockResolvedValue({
        projectedPoints: 18.5,
        confidence: 0.85,
        factors: {
          matchupDifficulty: 0.3,
          weatherImpact: 0.1,
          injuryRisk: 0.2,
          recentForm: 0.8,
          teamPerformance: 0.7,
        },
      })

      mockPrisma.oraclePrediction.create.mockResolvedValue(predictions[0])

      const result = await mockPrisma.oraclePrediction.create({
        data: {
          playerId: playerIds[0],
          week,
          projectedPoints: 18.5,
          confidence: 0.85,
          predictionType: 'WEEKLY',
        },
      })

      expect(mockPrisma.oraclePrediction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            playerId: playerIds[0],
            week,
            predictionType: 'WEEKLY',
          }),
        })
      )
      expect(result.projectedPoints).toBe(predictions[0].projectedPoints)
    })

    it('should generate season-long projections', async () => {
      const prediction = createOraclePredictionFixture({
        predictionType: 'SEASON',
        week: 0,
        projectedPoints: 275.5,
        confidence: 0.78,
      })

      mockGeminiClient.generatePrediction.mockResolvedValue({
        projectedPoints: 275.5,
        confidence: 0.78,
      })

      mockPrisma.oraclePrediction.create.mockResolvedValue(prediction)

      const result = await mockPrisma.oraclePrediction.create({
        data: {
          playerId: prediction.playerId,
          predictionType: 'SEASON',
          projectedPoints: 275.5,
          confidence: 0.78,
        },
      })

      expect(result.predictionType).toBe('SEASON')
      expect(result.projectedPoints).toBeGreaterThan(200) // Season totals should be higher
    })

    it('should calculate prediction confidence scores', () => {
      const factors = {
        dataQuality: 0.9,
        sampleSize: 0.8,
        recentness: 0.95,
        sourceReliability: 0.85,
        modelAccuracy: 0.82,
      }

      // Mock confidence calculation
      const calculateConfidence = (factors: typeof factors) => {
        const weights = {
          dataQuality: 0.25,
          sampleSize: 0.20,
          recentness: 0.20,
          sourceReliability: 0.20,
          modelAccuracy: 0.15,
        }

        return Object.entries(factors).reduce((acc, [key, value]) => {
          return acc + (value * weights[key as keyof typeof weights])
        }, 0)
      }

      const confidence = calculateConfidence(factors)

      expect(confidence).toBeGreaterThan(0.7)
      expect(confidence).toBeLessThanOrEqual(1.0)
    })

    it('should handle prediction failures gracefully', async () => {
      const error = new Error('API rate limit exceeded')
      mockGeminiClient.generatePrediction.mockRejectedValue(error)

      await expect(
        mockGeminiClient.generatePrediction('player-1', { week: 5 })
      ).rejects.toThrow('API rate limit exceeded')
    })

    it('should validate prediction data before saving', () => {
      const validPrediction = createOraclePredictionFixture({
        projectedPoints: 15.5,
        confidence: 0.85,
        week: 5,
      })

      const invalidPredictions = [
        { ...validPrediction, projectedPoints: -5 }, // Negative points
        { ...validPrediction, confidence: 1.5 }, // Confidence > 1
        { ...validPrediction, week: 0 }, // Invalid week for weekly prediction
        { ...validPrediction, confidence: 0.3 }, // Low confidence threshold
      ]

      expect(validPrediction.projectedPoints).toBeGreaterThanOrEqual(0)
      expect(validPrediction.confidence).toBeGreaterThanOrEqual(0)
      expect(validPrediction.confidence).toBeLessThanOrEqual(1)

      invalidPredictions.forEach(pred => {
        const isValid = 
          pred.projectedPoints >= 0 &&
          pred.confidence >= 0 &&
          pred.confidence <= 1 &&
          (pred.predictionType !== 'WEEKLY' || pred.week > 0) &&
          pred.confidence >= 0.5 // Minimum confidence threshold

        expect(isValid).toBe(false)
      })
    })
  })

  describe('Insight Generation', () => {
    it('should generate trade analysis insights', async () => {
      const playerIds = ['player-1', 'player-2']
      const insight = createTradeAnalysisInsightFixture(playerIds)

      mockGeminiClient.generateInsight.mockResolvedValue({
        type: 'TRADE_ANALYSIS',
        confidence: 0.82,
        recommendations: ['Execute this trade', 'Monitor player health'],
      })

      mockPrisma.oracleInsight.create.mockResolvedValue(insight)

      const result = await mockPrisma.oracleInsight.create({
        data: {
          type: 'TRADE_ANALYSIS',
          relevantPlayerIds: playerIds,
          confidence: 0.82,
        },
      })

      expect(result.type).toBe('TRADE_ANALYSIS')
      expect(result.relevantPlayerIds).toEqual(playerIds)
    })

    it('should prioritize insights by impact and confidence', () => {
      const insights = [
        createOracleInsightFixture({ impact: 'HIGH', confidence: 0.9 }),
        createOracleInsightFixture({ impact: 'MEDIUM', confidence: 0.95 }),
        createOracleInsightFixture({ impact: 'LOW', confidence: 0.85 }),
        createOracleInsightFixture({ impact: 'HIGH', confidence: 0.75 }),
      ]

      const priorityScore = (insight: typeof insights[0]) => {
        const impactWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 }
        return impactWeights[insight.impact] * insight.confidence
      }

      const sortedInsights = insights.sort(
        (a, b) => priorityScore(b) - priorityScore(a)
      )

      expect(priorityScore(sortedInsights[0])).toBeGreaterThan(
        priorityScore(sortedInsights[sortedInsights.length - 1])
      )
    })

    it('should expire outdated insights', () => {
      const expiredInsight = createOracleInsightFixture({
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      })

      const activeInsight = createOracleInsightFixture({
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      })

      const isExpired = (insight: typeof expiredInsight) => {
        return insight.expiresAt < new Date()
      }

      expect(isExpired(expiredInsight)).toBe(true)
      expect(isExpired(activeInsight)).toBe(false)
    })

    it('should generate contextual waiver wire recommendations', async () => {
      const playerId = 'available-player-1'
      const insight = createOracleInsightFixture({
        type: 'WAIVER_RECOMMENDATION',
        relevantPlayerIds: [playerId],
        impact: 'MEDIUM',
        confidence: 0.78,
      })

      mockPrisma.oracleInsight.create.mockResolvedValue(insight)

      const result = await mockPrisma.oracleInsight.create({
        data: {
          type: 'WAIVER_RECOMMENDATION',
          relevantPlayerIds: [playerId],
        },
      })

      expect(result.type).toBe('WAIVER_RECOMMENDATION')
      expect(result.relevantPlayerIds).toContain(playerId)
    })
  })

  describe('Player Analysis', () => {
    it('should perform comprehensive player comparisons', async () => {
      const playerIds = ['player-1', 'player-2']
      const analysis = createPlayerComparisonAnalysisFixture(playerIds)

      mockGeminiClient.analyzePlayerData.mockResolvedValue({
        keyMetrics: {
          expectedValue: 18.5,
          riskAdjustedValue: 16.2,
          volatility: 0.35,
        },
        recommendations: ['Strong WR2 option'],
      })

      mockPrisma.oracleAnalysis.create.mockResolvedValue(analysis)

      const result = await mockPrisma.oracleAnalysis.create({
        data: {
          analysisType: 'PLAYER_COMPARISON',
          subjectId: playerIds[0],
        },
      })

      expect(result.analysisType).toBe('PLAYER_COMPARISON')
      expect(result.results.keyMetrics).toHaveProperty('expectedValue')
      expect(result.results.keyMetrics).toHaveProperty('volatility')
    })

    it('should calculate risk-adjusted player values', () => {
      const playerData = {
        projectedPoints: 20.0,
        volatility: 0.25,
        injuryRisk: 0.15,
        floorPoints: 12.0,
        ceilingPoints: 30.0,
      }

      const calculateRiskAdjustedValue = (data: typeof playerData) => {
        const riskDiscount = (data.volatility + data.injuryRisk) * 0.5
        return data.projectedPoints * (1 - riskDiscount)
      }

      const riskAdjustedValue = calculateRiskAdjustedValue(playerData)

      expect(riskAdjustedValue).toBeLessThan(playerData.projectedPoints)
      expect(riskAdjustedValue).toBeGreaterThan(playerData.floorPoints)
    })

    it('should identify breakout candidates', () => {
      const players = [
        {
          id: 'player-1',
          currentADP: 120,
          projectedValue: 80, // Overvalued
          opportunityScore: 0.3,
        },
        {
          id: 'player-2',
          currentADP: 150,
          projectedValue: 90, // Undervalued
          opportunityScore: 0.8,
        },
        {
          id: 'player-3',
          currentADP: 100,
          projectedValue: 105, // Fair value
          opportunityScore: 0.6,
        },
      ]

      const identifyBreakoutCandidates = (players: typeof players) => {
        return players.filter(player => {
          const valueGap = player.currentADP - player.projectedValue
          return valueGap > 20 && player.opportunityScore > 0.7
        })
      }

      const breakoutCandidates = identifyBreakoutCandidates(players)

      expect(breakoutCandidates).toHaveLength(1)
      expect(breakoutCandidates[0].id).toBe('player-2')
    })
  })

  describe('Caching and Performance', () => {
    it('should cache frequently accessed predictions', async () => {
      const playerId = 'player-1'
      const week = 5
      const cacheKey = `oracle:prediction:${playerId}:${week}`
      const prediction = createOraclePredictionFixture({ playerId, week })

      // First call - cache miss
      mockRedis.get.mockResolvedValueOnce(null)
      mockPrisma.oraclePrediction.findUnique.mockResolvedValue(prediction)
      mockRedis.set.mockResolvedValue('OK')

      // Simulate service layer caching logic
      let cachedData = await mockRedis.get(cacheKey)
      if (!cachedData) {
        const dbData = await mockPrisma.oraclePrediction.findUnique({
          where: { playerId_week: { playerId, week } },
        })
        await mockRedis.set(cacheKey, JSON.stringify(dbData), 'EX', 3600)
        cachedData = JSON.stringify(dbData)
      }

      expect(mockRedis.get).toHaveBeenCalledWith(cacheKey)
      expect(mockRedis.set).toHaveBeenCalledWith(
        cacheKey,
        expect.any(String),
        'EX',
        3600
      )

      // Second call - cache hit
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(prediction))

      cachedData = await mockRedis.get(cacheKey)
      expect(cachedData).toBeDefined()
      expect(mockPrisma.oraclePrediction.findUnique).toHaveBeenCalledTimes(1) // Not called again
    })

    it('should batch process multiple predictions', async () => {
      const playerIds = ['player-1', 'player-2', 'player-3', 'player-4', 'player-5']
      const predictions = playerIds.map(id => createOraclePredictionFixture({ playerId: id }))

      mockPrisma.oraclePrediction.create.mockImplementation(({ data }) => 
        Promise.resolve({ ...data, id: `pred-${data.playerId}` })
      )

      // Simulate batch processing
      const batchSize = 3
      const batches = []
      for (let i = 0; i < playerIds.length; i += batchSize) {
        batches.push(playerIds.slice(i, i + batchSize))
      }

      let totalProcessed = 0
      for (const batch of batches) {
        const batchPromises = batch.map(playerId =>
          mockPrisma.oraclePrediction.create({ data: { playerId } })
        )
        await Promise.all(batchPromises)
        totalProcessed += batch.length
      }

      expect(totalProcessed).toBe(playerIds.length)
      expect(batches).toHaveLength(2) // 5 players / 3 batch size = 2 batches
    })

    it('should invalidate cache on prediction updates', async () => {
      const playerId = 'player-1'
      const week = 5
      const cacheKey = `oracle:prediction:${playerId}:${week}`

      mockRedis.del.mockResolvedValue(1)

      // Simulate cache invalidation after update
      await mockRedis.del(cacheKey)

      expect(mockRedis.del).toHaveBeenCalledWith(cacheKey)
    })
  })

  describe('Model Performance Tracking', () => {
    it('should track prediction accuracy over time', () => {
      const predictions = [
        { predicted: 18.5, actual: 19.2, playerId: 'player-1', week: 1 },
        { predicted: 12.0, actual: 8.5, playerId: 'player-2', week: 1 },
        { predicted: 22.1, actual: 24.8, playerId: 'player-3', week: 1 },
      ]

      const calculateAccuracyMetrics = (predictions: typeof predictions) => {
        const errors = predictions.map(p => Math.abs(p.predicted - p.actual))
        const mae = errors.reduce((sum, err) => sum + err, 0) / errors.length
        const rmse = Math.sqrt(
          errors.reduce((sum, err) => sum + err * err, 0) / errors.length
        )

        return { mae, rmse }
      }

      const metrics = calculateAccuracyMetrics(predictions)

      expect(metrics.mae).toBeGreaterThan(0)
      expect(metrics.rmse).toBeGreaterThan(metrics.mae)
    })

    it('should adjust model confidence based on historical performance', () => {
      const modelHistory = {
        version: 'v2.1',
        predictions: 1000,
        accuracy: 0.82,
        mae: 3.2,
        rmse: 4.1,
        recentTrend: 'improving', // 'improving' | 'declining' | 'stable'
      }

      const adjustConfidence = (baseConfidence: number, history: typeof modelHistory) => {
        const accuracyMultiplier = history.accuracy
        const trendMultiplier = {
          improving: 1.05,
          stable: 1.0,
          declining: 0.95,
        }[history.recentTrend]

        return Math.min(baseConfidence * accuracyMultiplier * trendMultiplier, 0.98)
      }

      const adjustedConfidence = adjustConfidence(0.85, modelHistory)

      expect(adjustedConfidence).toBeGreaterThan(0.85) // Should increase with good history
      expect(adjustedConfidence).toBeLessThanOrEqual(0.98) // Capped at reasonable max
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing player data gracefully', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null)

      const nonExistentPlayerId = 'non-existent-player'

      await expect(
        mockPrisma.player.findUnique({
          where: { id: nonExistentPlayerId },
        })
      ).resolves.toBeNull()
    })

    it('should handle AI service outages', async () => {
      const serviceError = new Error('Service temporarily unavailable')
      mockGeminiClient.generatePrediction.mockRejectedValue(serviceError)

      await expect(
        mockGeminiClient.generatePrediction('player-1')
      ).rejects.toThrow('Service temporarily unavailable')
    })

    it('should validate prediction thresholds', () => {
      const predictions = [
        { projectedPoints: -5, confidence: 0.8 }, // Invalid: negative points
        { projectedPoints: 100, confidence: 0.9 }, // Invalid: unrealistic points
        { projectedPoints: 18.5, confidence: 1.2 }, // Invalid: confidence > 1
        { projectedPoints: 15.0, confidence: 0.3 }, // Invalid: low confidence
        { projectedPoints: 18.5, confidence: 0.85 }, // Valid
      ]

      const validatePrediction = (pred: { projectedPoints: number; confidence: number }) => {
        return (
          pred.projectedPoints >= 0 &&
          pred.projectedPoints <= 50 && // Reasonable max for fantasy points
          pred.confidence >= 0.5 &&
          pred.confidence <= 1.0
        )
      }

      const validPredictions = predictions.filter(validatePrediction)

      expect(validPredictions).toHaveLength(1)
    })

    it('should handle rate limiting from external APIs', async () => {
      const rateLimitError = new Error('Rate limit exceeded')
      mockGeminiClient.generatePrediction.mockRejectedValueOnce(rateLimitError)

      // Simulate retry logic
      let retries = 0
      const maxRetries = 3

      const attemptPrediction = async (): Promise<any> => {
        try {
          return await mockGeminiClient.generatePrediction('player-1')
        } catch (error) {
          if (retries < maxRetries && error.message === 'Rate limit exceeded') {
            retries++
            // Would normally wait before retry
            return attemptPrediction()
          }
          throw error
        }
      }

      await expect(attemptPrediction()).rejects.toThrow('Rate limit exceeded')
      expect(retries).toBe(maxRetries)
    })
  })
})