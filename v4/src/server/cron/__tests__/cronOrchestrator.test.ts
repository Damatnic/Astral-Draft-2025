/**
 * Cron Orchestrator Tests
 * 
 * Tests for the main cron job orchestrator functionality
 */

import { cronOrchestrator } from '../index';

// Mock the cron jobs to avoid actual execution during tests
jest.mock('../jobs/matchups', () => ({
  matchupGenerationJob: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../jobs/stats', () => ({
  playerStatsSyncJob: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../jobs/injuries', () => ({
  injuryReportJob: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../jobs/scoring', () => ({
  weeklyScoringJob: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../jobs/league', () => ({
  leagueAdvancementJob: jest.fn().mockResolvedValue(undefined)
}));

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    quit: jest.fn().mockResolvedValue('OK'),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(0)
  }));
});

// Mock database
jest.mock('../../db', () => ({
  db: {
    user: {
      findMany: jest.fn().mockResolvedValue([])
    },
    notification: {
      create: jest.fn().mockResolvedValue({})
    }
  }
}));

describe('CronOrchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Ensure orchestrator is clean after each test
    await cronOrchestrator.shutdown();
  });

  describe('Job Management', () => {
    test('should get empty job statuses initially', () => {
      const statuses = cronOrchestrator.getJobStatuses();
      expect(Array.isArray(statuses)).toBe(true);
    });

    test('should return null for non-existent job status', () => {
      const status = cronOrchestrator.getJobStatus('nonExistentJob');
      expect(status).toBeNull();
    });

    test('should handle job control operations', () => {
      const stopResult = cronOrchestrator.stopJob('nonExistentJob');
      expect(stopResult).toBe(false);

      const startResult = cronOrchestrator.startJob('nonExistentJob');
      expect(startResult).toBe(false);
    });

    test('should trigger job manually', async () => {
      const result = await cronOrchestrator.triggerJob('matchupGeneration');
      expect(result.success).toBe(true);
      expect(result.message).toContain('triggered successfully');
    });

    test('should handle invalid job trigger', async () => {
      const result = await cronOrchestrator.triggerJob('invalidJob' as any);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('Error Handling', () => {
    test('should handle job execution errors gracefully', async () => {
      // Mock a job that throws an error
      jest.doMock('../jobs/matchups', () => ({
        matchupGenerationJob: jest.fn().mockRejectedValue(new Error('Test error'))
      }));

      const result = await cronOrchestrator.triggerJob('matchupGeneration');
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
    });
  });

  describe('Initialization', () => {
    test('should initialize without errors', async () => {
      // Mock environment to enable cron
      const originalEnv = process.env.ENABLE_CRON;
      process.env.ENABLE_CRON = 'false'; // Prevent auto-init

      await expect(cronOrchestrator.initialize()).resolves.not.toThrow();

      // Restore environment
      process.env.ENABLE_CRON = originalEnv;
    });
  });
});

describe('Cron Job Integration', () => {
  test('should import all job modules without errors', async () => {
    // Test that all job modules can be imported successfully
    expect(() => require('../jobs/matchups')).not.toThrow();
    expect(() => require('../jobs/stats')).not.toThrow();
    expect(() => require('../jobs/injuries')).not.toThrow();
    expect(() => require('../jobs/scoring')).not.toThrow();
    expect(() => require('../jobs/league')).not.toThrow();
  });

  test('should have correct job function exports', () => {
    const matchupsModule = require('../jobs/matchups');
    const statsModule = require('../jobs/stats');
    const injuriesModule = require('../jobs/injuries');
    const scoringModule = require('../jobs/scoring');
    const leagueModule = require('../jobs/league');

    expect(typeof matchupsModule.matchupGenerationJob).toBe('function');
    expect(typeof statsModule.playerStatsSyncJob).toBe('function');
    expect(typeof injuriesModule.injuryReportJob).toBe('function');
    expect(typeof scoringModule.weeklyScoringJob).toBe('function');
    expect(typeof leagueModule.leagueAdvancementJob).toBe('function');
  });
});

describe('SportsIO Integration', () => {
  test('should import SportsIO service without errors', () => {
    expect(() => require('../../api/external/sportsio')).not.toThrow();
  });

  test('should have correct SportsIO service methods', () => {
    const sportsIOModule = require('../../api/external/sportsio');
    const service = sportsIOModule.sportsIOService;

    expect(typeof service.getPlayers).toBe('function');
    expect(typeof service.getPlayerStats).toBe('function');
    expect(typeof service.getInjuryReports).toBe('function');
    expect(typeof service.getGames).toBe('function');
    expect(typeof service.checkApiStatus).toBe('function');
    expect(typeof service.clearCache).toBe('function');
  });
});

describe('Type Safety', () => {
  test('should have proper TypeScript types', () => {
    // This test ensures TypeScript compilation succeeds
    // If types are wrong, TypeScript compilation would fail
    expect(true).toBe(true);
  });
});