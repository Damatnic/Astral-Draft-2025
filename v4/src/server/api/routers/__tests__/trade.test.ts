/**
 * Trade Router Test Suite
 * Comprehensive tests for all trade functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInnerTRPCContext } from '../../trpc';
import { appRouter } from '../../root';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn();
  PrismaClient.prototype.$transaction = vi.fn();
  PrismaClient.prototype.trade = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  PrismaClient.prototype.team = {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  };
  PrismaClient.prototype.league = {
    findUnique: vi.fn(),
  };
  PrismaClient.prototype.leagueMember = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  };
  PrismaClient.prototype.notification = {
    create: vi.fn(),
    createMany: vi.fn(),
  };
  PrismaClient.prototype.transaction = {
    create: vi.fn(),
    updateMany: vi.fn(),
  };
  PrismaClient.prototype.tradeVote = {
    create: vi.fn(),
  };
  PrismaClient.prototype.roster = {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  };
  PrismaClient.prototype.player = {
    findMany: vi.fn(),
  };
  return { PrismaClient };
});

describe('Trade Router', () => {
  let ctx: ReturnType<typeof createInnerTRPCContext>;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    // Create mock context
    ctx = createInnerTRPCContext({
      session: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    });

    // Create caller with mock context
    caller = appRouter.createCaller(ctx);
  });

  describe('proposeTrade', () => {
    it('should create a new trade proposal', async () => {
      // Mock data
      const mockInitiatorTeam = {
        id: 'team-1',
        name: 'Test Team 1',
        ownerId: 'user-123',
        leagueId: 'league-1',
        roster: [
          { playerId: 'player-1', teamId: 'team-1' },
          { playerId: 'player-2', teamId: 'team-1' }
        ],
        owner: { username: 'testuser' }
      };

      const mockPartnerTeam = {
        id: 'team-2',
        name: 'Test Team 2',
        ownerId: 'user-456',
        leagueId: 'league-1',
        roster: [
          { playerId: 'player-3', teamId: 'team-2' },
          { playerId: 'player-4', teamId: 'team-2' }
        ]
      };

      const mockLeague = {
        id: 'league-1',
        name: 'Test League',
        tradeDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        tradeReviewDays: 2,
        tradeVotesNeeded: 4
      };

      const mockTrade = {
        id: 'trade-1',
        leagueId: 'league-1',
        initiatorId: 'team-1',
        partnerId: 'team-2',
        initiatorUserId: 'user-123',
        initiatorGives: JSON.stringify({ playerIds: ['player-1'], draftPicks: [] }),
        initiatorReceives: JSON.stringify({ playerIds: ['player-3'], draftPicks: [] }),
        status: 'PROPOSED',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        initiator: mockInitiatorTeam,
        partner: mockPartnerTeam
      };

      // Setup mocks
      ctx.prisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          team: {
            findFirst: vi.fn().mockResolvedValueOnce(mockInitiatorTeam),
            findUnique: vi.fn().mockResolvedValueOnce(mockPartnerTeam),
          },
          league: {
            findUnique: vi.fn().mockResolvedValueOnce(mockLeague),
          },
          trade: {
            create: vi.fn().mockResolvedValueOnce(mockTrade),
          },
          notification: {
            create: vi.fn().mockResolvedValueOnce({}),
          },
          transaction: {
            create: vi.fn().mockResolvedValueOnce({}),
          }
        };
        return callback(tx);
      });

      // Execute
      const result = await caller.trade.proposeTrade({
        leagueId: 'league-1',
        partnerId: 'team-2',
        initiatorGives: { playerIds: ['player-1'], draftPicks: [] },
        initiatorReceives: { playerIds: ['player-3'], draftPicks: [] },
        tradeNote: 'Fair trade?',
        expirationDays: 3
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('trade-1');
      expect(result.status).toBe('PROPOSED');
    });

    it('should reject trade with invalid players', async () => {
      const mockInitiatorTeam = {
        id: 'team-1',
        ownerId: 'user-123',
        leagueId: 'league-1',
        roster: [{ playerId: 'player-1', teamId: 'team-1' }]
      };

      const mockPartnerTeam = {
        id: 'team-2',
        ownerId: 'user-456',
        leagueId: 'league-1',
        roster: [{ playerId: 'player-3', teamId: 'team-2' }]
      };

      const mockLeague = {
        id: 'league-1',
        tradeDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      ctx.prisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          team: {
            findFirst: vi.fn().mockResolvedValueOnce(mockInitiatorTeam),
            findUnique: vi.fn().mockResolvedValueOnce(mockPartnerTeam),
          },
          league: {
            findUnique: vi.fn().mockResolvedValueOnce(mockLeague),
          }
        };
        return callback(tx);
      });

      // Try to trade a player not on roster
      await expect(
        caller.trade.proposeTrade({
          leagueId: 'league-1',
          partnerId: 'team-2',
          initiatorGives: { playerIds: ['player-99'], draftPicks: [] }, // Invalid player
          initiatorReceives: { playerIds: ['player-3'], draftPicks: [] },
          expirationDays: 3
        })
      ).rejects.toThrow('You cannot trade players not on your roster');
    });

    it('should reject trade after deadline', async () => {
      const mockInitiatorTeam = {
        id: 'team-1',
        ownerId: 'user-123',
        leagueId: 'league-1',
        roster: []
      };

      const mockLeague = {
        id: 'league-1',
        tradeDeadline: new Date(Date.now() - 1000) // Past deadline
      };

      ctx.prisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          team: {
            findFirst: vi.fn().mockResolvedValueOnce(mockInitiatorTeam),
          },
          league: {
            findUnique: vi.fn().mockResolvedValueOnce(mockLeague),
          }
        };
        return callback(tx);
      });

      await expect(
        caller.trade.proposeTrade({
          leagueId: 'league-1',
          partnerId: 'team-2',
          initiatorGives: { playerIds: [], draftPicks: [] },
          initiatorReceives: { playerIds: [], draftPicks: [] },
          expirationDays: 3
        })
      ).rejects.toThrow('Trade deadline has passed');
    });
  });

  describe('acceptTrade', () => {
    it('should accept a proposed trade', async () => {
      const mockTrade = {
        id: 'trade-1',
        status: 'PROPOSED',
        partner: { ownerId: 'user-123', name: 'Partner Team' },
        initiator: { name: 'Initiator Team' },
        initiatorUserId: 'user-456',
        league: { tradeVotesNeeded: 0 },
        leagueId: 'league-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      ctx.prisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          trade: {
            findUnique: vi.fn().mockResolvedValueOnce(mockTrade),
            update: vi.fn().mockResolvedValueOnce({ ...mockTrade, status: 'ACCEPTED' })
          },
          notification: {
            create: vi.fn().mockResolvedValueOnce({})
          }
        };
        
        // Mock executeTrade
        const routerContext = { executeTrade: vi.fn().mockResolvedValueOnce(true) };
        
        return callback.call(routerContext, tx);
      });

      const result = await caller.trade.acceptTrade({
        tradeId: 'trade-1'
      });

      expect(result.status).toBe('ACCEPTED');
    });

    it('should start review period for leagues with voting', async () => {
      const mockTrade = {
        id: 'trade-1',
        status: 'PROPOSED',
        partner: { ownerId: 'user-123', name: 'Partner Team' },
        initiator: { name: 'Initiator Team' },
        initiatorUserId: 'user-456',
        league: { tradeVotesNeeded: 4 },
        leagueId: 'league-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      const mockMembers = [
        { userId: 'user-789', leagueId: 'league-1' },
        { userId: 'user-012', leagueId: 'league-1' }
      ];

      ctx.prisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          trade: {
            findUnique: vi.fn().mockResolvedValueOnce(mockTrade),
            update: vi.fn().mockResolvedValueOnce({ ...mockTrade, status: 'ACCEPTED' })
          },
          notification: {
            create: vi.fn().mockResolvedValueOnce({}),
            createMany: vi.fn().mockResolvedValueOnce({})
          },
          leagueMember: {
            findMany: vi.fn().mockResolvedValueOnce(mockMembers)
          }
        };
        
        return callback(tx);
      });

      const result = await caller.trade.acceptTrade({
        tradeId: 'trade-1'
      });

      expect(result.status).toBe('ACCEPTED');
    });
  });

  describe('voteTrade', () => {
    it('should record a vote on a trade', async () => {
      const mockTrade = {
        id: 'trade-1',
        status: 'ACCEPTED',
        leagueId: 'league-1',
        initiatorUserId: 'user-456',
        partner: { ownerId: 'user-789' },
        league: { tradeVotesNeeded: 4 },
        vetoVotes: 0,
        votes: []
      };

      const mockUserTeam = {
        id: 'team-3',
        ownerId: 'user-123',
        leagueId: 'league-1'
      };

      ctx.prisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          trade: {
            findUnique: vi.fn().mockResolvedValueOnce(mockTrade),
            update: vi.fn().mockResolvedValueOnce({ ...mockTrade, vetoVotes: 1 })
          },
          team: {
            findFirst: vi.fn().mockResolvedValueOnce(mockUserTeam)
          },
          tradeVote: {
            create: vi.fn().mockResolvedValueOnce({})
          }
        };
        
        return callback(tx);
      });

      const result = await caller.trade.voteTrade({
        tradeId: 'trade-1',
        voteType: 'VETO',
        reason: 'Unfair trade'
      });

      expect(result.vetoVotes).toBe(1);
    });

    it('should veto trade when threshold reached', async () => {
      const mockTrade = {
        id: 'trade-1',
        status: 'ACCEPTED',
        leagueId: 'league-1',
        initiatorUserId: 'user-456',
        partner: { ownerId: 'user-789' },
        initiator: { name: 'Team A' },
        league: { tradeVotesNeeded: 3 },
        vetoVotes: 2, // One more vote will veto
        votes: []
      };

      const mockUserTeam = {
        id: 'team-3',
        ownerId: 'user-123',
        leagueId: 'league-1'
      };

      ctx.prisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          trade: {
            findUnique: vi.fn().mockResolvedValueOnce(mockTrade),
            update: vi.fn()
              .mockResolvedValueOnce({ ...mockTrade, vetoVotes: 3 })
              .mockResolvedValueOnce({ ...mockTrade, vetoVotes: 3, status: 'VETOED' })
          },
          team: {
            findFirst: vi.fn().mockResolvedValueOnce(mockUserTeam)
          },
          tradeVote: {
            create: vi.fn().mockResolvedValueOnce({})
          },
          notification: {
            createMany: vi.fn().mockResolvedValueOnce({})
          }
        };
        
        return callback(tx);
      });

      const result = await caller.trade.voteTrade({
        tradeId: 'trade-1',
        voteType: 'VETO'
      });

      expect(result.status).toBe('VETOED');
    });
  });

  describe('getLeagueTrades', () => {
    it('should return trades for league members', async () => {
      const mockMembership = {
        userId: 'user-123',
        leagueId: 'league-1',
        role: 'MEMBER'
      };

      const mockTrades = [
        {
          id: 'trade-1',
          status: 'PROPOSED',
          initiatorGives: JSON.stringify({ playerIds: ['p1'], draftPicks: [] }),
          initiatorReceives: JSON.stringify({ playerIds: ['p2'], draftPicks: [] }),
          initiatorUserId: 'user-456',
          initiator: { owner: { username: 'user1' } },
          partner: { ownerId: 'user-789', owner: { username: 'user2' } },
          votes: [],
          _count: { votes: 0 }
        },
        {
          id: 'trade-2',
          status: 'ACCEPTED',
          initiatorGives: JSON.stringify({ playerIds: ['p3'], draftPicks: [] }),
          initiatorReceives: JSON.stringify({ playerIds: ['p4'], draftPicks: [] }),
          initiatorUserId: 'user-123',
          initiator: { owner: { username: 'testuser' } },
          partner: { ownerId: 'user-012', owner: { username: 'user3' } },
          votes: [],
          _count: { votes: 2 }
        }
      ];

      ctx.prisma.leagueMember.findUnique = vi.fn().mockResolvedValueOnce(mockMembership);
      ctx.prisma.trade.findMany = vi.fn().mockResolvedValueOnce(mockTrades);

      const result = await caller.trade.getLeagueTrades({
        leagueId: 'league-1'
      });

      expect(result).toHaveLength(2);
      expect(result[0].hasVoted).toBe(false);
      expect(result[1].isInvolved).toBe(true);
    });
  });

  describe('counterTrade', () => {
    it('should create a counter-offer', async () => {
      const mockOriginalTrade = {
        id: 'trade-1',
        status: 'PROPOSED',
        leagueId: 'league-1',
        initiatorId: 'team-1',
        partnerId: 'team-2',
        initiatorUserId: 'user-456',
        partner: { ownerId: 'user-123', name: 'My Team' },
        initiator: { name: 'Their Team' },
        league: {}
      };

      const mockCounterTrade = {
        id: 'trade-2',
        status: 'PROPOSED',
        leagueId: 'league-1',
        initiatorId: 'team-2',
        partnerId: 'team-1',
        initiatorUserId: 'user-123',
        parentTradeId: 'trade-1'
      };

      ctx.prisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          trade: {
            findUnique: vi.fn().mockResolvedValueOnce(mockOriginalTrade),
            update: vi.fn()
              .mockResolvedValueOnce({ ...mockOriginalTrade, status: 'COUNTERED' })
              .mockResolvedValueOnce({ ...mockOriginalTrade, counterTradeId: 'trade-2' }),
            create: vi.fn().mockResolvedValueOnce(mockCounterTrade)
          },
          notification: {
            create: vi.fn().mockResolvedValueOnce({})
          }
        };
        
        return callback(tx);
      });

      const result = await caller.trade.counterTrade({
        originalTradeId: 'trade-1',
        counterGives: { playerIds: ['p2'], draftPicks: [] },
        counterReceives: { playerIds: ['p1', 'p5'], draftPicks: [] },
        counterNote: 'Need another player'
      });

      expect(result.id).toBe('trade-2');
      expect(result.parentTradeId).toBe('trade-1');
    });
  });

  describe('commissionerOverride', () => {
    it('should allow commissioner to force approve trade', async () => {
      const mockTrade = {
        id: 'trade-1',
        status: 'ACCEPTED',
        leagueId: 'league-1',
        initiatorUserId: 'user-456',
        initiatorGives: JSON.stringify({ playerIds: ['p1'], draftPicks: [] }),
        initiatorReceives: JSON.stringify({ playerIds: ['p2'], draftPicks: [] }),
        initiatorId: 'team-1',
        partnerId: 'team-2',
        partner: { ownerId: 'user-789' },
        initiator: { name: 'Team A' },
        league: {
          currentWeek: 5,
          members: [
            { userId: 'user-123', role: 'COMMISSIONER' },
            { userId: 'user-456', role: 'MEMBER' },
            { userId: 'user-789', role: 'MEMBER' }
          ]
        }
      };

      ctx.prisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          trade: {
            findUnique: vi.fn().mockResolvedValue(mockTrade),
            update: vi.fn().mockResolvedValue({ 
              ...mockTrade, 
              status: 'EXECUTED',
              commissionerOverride: true,
              executedAt: new Date()
            })
          },
          notification: {
            createMany: vi.fn().mockResolvedValue({})
          },
          roster: {
            deleteMany: vi.fn().mockResolvedValue({}),
            createMany: vi.fn().mockResolvedValue({})
          },
          transaction: {
            updateMany: vi.fn().mockResolvedValue({})
          }
        };
        
        const routerContext = { 
          executeTrade: vi.fn().mockResolvedValue(true)
        };
        
        return callback.call(routerContext, tx);
      });

      const result = await caller.trade.commissionerOverride({
        tradeId: 'trade-1',
        action: 'APPROVE',
        reason: 'Trade is fair after review'
      });

      expect(result.status).toBe('EXECUTED');
      expect(result.commissionerOverride).toBe(true);
    });
  });
});