/**
 * Auction Draft Manager
 * Handles all auction draft logic including bidding, nominations, and budget management
 */

import { PrismaClient } from '@prisma/client';
import { Server as SocketServer } from 'socket.io';
import { Redis } from 'ioredis';

interface AuctionState {
  draftId: string;
  currentNomination: {
    playerId: string;
    nominatorTeamId: string;
    currentBid: number;
    currentBidder: string;
    bidHistory: Bid[];
    nominationTime: Date;
    expiresAt: Date;
  } | null;
  teamBudgets: Map<string, TeamBudget>;
  nominationQueue: string[];
  currentNominatorIndex: number;
  completedPicks: Set<string>;
  autoBidSettings: Map<string, AutoBidConfig>;
}

interface TeamBudget {
  teamId: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  maxBid: number;
  rosterSpots: number;
  filledSpots: number;
  players: string[];
}

interface Bid {
  teamId: string;
  amount: number;
  timestamp: Date;
  isAutoBid: boolean;
}

interface AutoBidConfig {
  enabled: boolean;
  targetPlayers: string[];
  maxBidPerPlayer: Map<string, number>;
  defaultMaxBid: number;
  bidIncrement: number;
  stopAtBudget: number;
}

export class AuctionDraftManager {
  private prisma: PrismaClient;
  private io: SocketServer;
  private redis: Redis;
  private auctionStates: Map<string, AuctionState>;
  private bidTimers: Map<string, NodeJS.Timeout>;
  private nominationTimers: Map<string, NodeJS.Timeout>;

  constructor(prisma: PrismaClient, io: SocketServer, redis: Redis) {
    this.prisma = prisma;
    this.io = io;
    this.redis = redis;
    this.auctionStates = new Map();
    this.bidTimers = new Map();
    this.nominationTimers = new Map();
  }

  /**
   * Initialize auction draft
   */
  async initializeAuction(draftId: string): Promise<void> {
    const draft = await this.prisma.draft.findUnique({
      where: { id: draftId },
      include: {
        league: {
          include: { teams: true },
        },
      },
    });

    if (!draft || draft.type !== 'AUCTION') {
      throw new Error('Invalid auction draft');
    }

    const settings = JSON.parse(draft.draftOrder as string);
    const teamBudgets = new Map<string, TeamBudget>();
    const nominationOrder: string[] = [];

    // Initialize team budgets
    for (const team of draft.league.teams) {
      teamBudgets.set(team.id, {
        teamId: team.id,
        totalBudget: draft.budget || 200,
        spent: 0,
        remaining: draft.budget || 200,
        maxBid: (draft.budget || 200) - 15, // Save $1 for each remaining spot
        rosterSpots: 16,
        filledSpots: 0,
        players: [],
      });
      nominationOrder.push(team.id);
    }

    // Randomize nomination order
    nominationOrder.sort(() => Math.random() - 0.5);

    const auctionState: AuctionState = {
      draftId,
      currentNomination: null,
      teamBudgets,
      nominationQueue: nominationOrder,
      currentNominatorIndex: 0,
      completedPicks: new Set(),
      autoBidSettings: new Map(),
    };

    this.auctionStates.set(draftId, auctionState);
    await this.saveStateToRedis(draftId, auctionState);
  }

  /**
   * Nominate a player for auction
   */
  async nominatePlayer(
    draftId: string,
    teamId: string,
    playerId: string,
    openingBid: number = 1
  ): Promise<void> {
    const state = await this.getAuctionState(draftId);
    
    if (state.currentNomination) {
      throw new Error('A player is already being auctioned');
    }

    const currentNominator = state.nominationQueue[state.currentNominatorIndex];
    if (currentNominator !== teamId) {
      throw new Error('Not your turn to nominate');
    }

    if (state.completedPicks.has(playerId)) {
      throw new Error('Player already drafted');
    }

    const budget = state.teamBudgets.get(teamId);
    if (!budget || openingBid > budget.maxBid) {
      throw new Error('Invalid opening bid');
    }

    // Create nomination
    state.currentNomination = {
      playerId,
      nominatorTeamId: teamId,
      currentBid: openingBid,
      currentBidder: teamId,
      bidHistory: [{
        teamId,
        amount: openingBid,
        timestamp: new Date(),
        isAutoBid: false,
      }],
      nominationTime: new Date(),
      expiresAt: new Date(Date.now() + 10000), // 10 second timer
    };

    // Start bid timer
    this.startBidTimer(draftId);

    // Emit to all clients
    this.io.to(`draft:${draftId}`).emit('player-nominated', {
      playerId,
      nominatorTeamId: teamId,
      openingBid,
      timer: 10,
    });

    await this.saveStateToRedis(draftId, state);
    
    // Check for auto-bids
    this.processAutoBids(draftId);
  }

  /**
   * Place a bid on current player
   */
  async placeBid(
    draftId: string,
    teamId: string,
    amount: number,
    isAutoBid: boolean = false
  ): Promise<void> {
    const state = await this.getAuctionState(draftId);
    
    if (!state.currentNomination) {
      throw new Error('No player currently being auctioned');
    }

    if (amount <= state.currentNomination.currentBid) {
      throw new Error('Bid must be higher than current bid');
    }

    const budget = state.teamBudgets.get(teamId);
    if (!budget || amount > budget.maxBid) {
      throw new Error('Insufficient budget');
    }

    // Update bid
    state.currentNomination.currentBid = amount;
    state.currentNomination.currentBidder = teamId;
    state.currentNomination.bidHistory.push({
      teamId,
      amount,
      timestamp: new Date(),
      isAutoBid,
    });
    state.currentNomination.expiresAt = new Date(Date.now() + 10000); // Reset timer

    // Cancel and restart timer
    this.resetBidTimer(draftId);

    // Emit update
    this.io.to(`draft:${draftId}`).emit('bid-update', {
      playerId: state.currentNomination.playerId,
      currentBid: amount,
      currentBidder: teamId,
      timeRemaining: 10,
      isAutoBid,
    });

    await this.saveStateToRedis(draftId, state);
    
    // Process auto-bids from other teams
    if (!isAutoBid) {
      this.processAutoBids(draftId);
    }
  }

  /**
   * Complete auction for current player
   */
  private async completeAuction(draftId: string): Promise<void> {
    const state = await this.getAuctionState(draftId);
    
    if (!state.currentNomination) return;

    const { playerId, currentBidder, currentBid } = state.currentNomination;
    const budget = state.teamBudgets.get(currentBidder)!;

    // Update budget
    budget.spent += currentBid;
    budget.remaining -= currentBid;
    budget.filledSpots++;
    budget.players.push(playerId);
    budget.maxBid = Math.max(1, budget.remaining - (budget.rosterSpots - budget.filledSpots - 1));

    // Mark player as drafted
    state.completedPicks.add(playerId);

    // Save to database
    await this.prisma.draftPick.create({
      data: {
        draftId,
        teamId: currentBidder,
        playerId,
        amount: currentBid,
        round: 0,
        pick: state.completedPicks.size,
        userId: '', // Would get from team owner
      },
    });

    // Emit completion
    this.io.to(`draft:${draftId}`).emit('player-sold', {
      playerId,
      teamId: currentBidder,
      amount: currentBid,
      teamBudget: {
        remaining: budget.remaining,
        maxBid: budget.maxBid,
        filledSpots: budget.filledSpots,
      },
    });

    // Clear nomination
    state.currentNomination = null;

    // Move to next nominator
    state.currentNominatorIndex = (state.currentNominatorIndex + 1) % state.nominationQueue.length;
    
    // Check if draft is complete
    const allTeamsFull = Array.from(state.teamBudgets.values())
      .every(b => b.filledSpots >= b.rosterSpots);
    
    if (allTeamsFull) {
      await this.completeDraft(draftId);
    } else {
      // Start nomination timer for next team
      this.startNominationTimer(draftId);
    }

    await this.saveStateToRedis(draftId, state);
  }

  /**
   * Process auto-bids for all teams
   */
  private async processAutoBids(draftId: string): Promise<void> {
    const state = await this.getAuctionState(draftId);
    
    if (!state.currentNomination) return;

    const { playerId, currentBid, currentBidder } = state.currentNomination;

    for (const [teamId, config] of state.autoBidSettings) {
      if (!config.enabled || teamId === currentBidder) continue;

      // Check if this player is a target
      const isTarget = config.targetPlayers.includes(playerId);
      if (!isTarget && config.targetPlayers.length > 0) continue;

      // Determine max bid for this player
      const maxBid = config.maxBidPerPlayer.get(playerId) || config.defaultMaxBid;
      const nextBid = currentBid + config.bidIncrement;

      // Check budget constraints
      const budget = state.teamBudgets.get(teamId);
      if (!budget || nextBid > maxBid || nextBid > budget.maxBid) continue;
      if (budget.remaining < config.stopAtBudget) continue;

      // Place auto-bid with small delay
      setTimeout(() => {
        this.placeBid(draftId, teamId, nextBid, true).catch(console.error);
      }, Math.random() * 1000 + 500); // 0.5-1.5 second delay
    }
  }

  /**
   * Configure auto-bid settings for a team
   */
  async setAutoBidConfig(
    draftId: string,
    teamId: string,
    config: Partial<AutoBidConfig>
  ): Promise<void> {
    const state = await this.getAuctionState(draftId);
    
    const existingConfig = state.autoBidSettings.get(teamId) || {
      enabled: false,
      targetPlayers: [],
      maxBidPerPlayer: new Map(),
      defaultMaxBid: 20,
      bidIncrement: 1,
      stopAtBudget: 10,
    };

    state.autoBidSettings.set(teamId, {
      ...existingConfig,
      ...config,
    });

    await this.saveStateToRedis(draftId, state);
  }

  /**
   * Start bid timer
   */
  private startBidTimer(draftId: string): void {
    const timer = setTimeout(() => {
      this.completeAuction(draftId);
    }, 10000); // 10 seconds

    this.bidTimers.set(draftId, timer);
  }

  /**
   * Reset bid timer
   */
  private resetBidTimer(draftId: string): void {
    const existingTimer = this.bidTimers.get(draftId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    this.startBidTimer(draftId);
  }

  /**
   * Start nomination timer
   */
  private startNominationTimer(draftId: string): void {
    const timer = setTimeout(async () => {
      // Auto-nominate if time runs out
      const state = await this.getAuctionState(draftId);
      const nominatorId = state.nominationQueue[state.currentNominatorIndex];
      
      // Get random available player
      const availablePlayer = await this.getRandomAvailablePlayer(draftId);
      if (availablePlayer) {
        await this.nominatePlayer(draftId, nominatorId, availablePlayer.id, 1);
      }
    }, 30000); // 30 seconds to nominate

    this.nominationTimers.set(draftId, timer);
  }

  /**
   * Get random available player
   */
  private async getRandomAvailablePlayer(draftId: string): Promise<any> {
    const state = await this.getAuctionState(draftId);
    
    const players = await this.prisma.player.findMany({
      where: {
        id: {
          notIn: Array.from(state.completedPicks),
        },
      },
      orderBy: {
        adp: 'asc',
      },
      take: 50,
    });

    return players[Math.floor(Math.random() * Math.min(10, players.length))];
  }

  /**
   * Complete the draft
   */
  private async completeDraft(draftId: string): Promise<void> {
    await this.prisma.draft.update({
      where: { id: draftId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    this.io.to(`draft:${draftId}`).emit('draft-complete');
    
    // Clean up
    this.auctionStates.delete(draftId);
    const timer = this.bidTimers.get(draftId);
    if (timer) clearTimeout(timer);
    this.bidTimers.delete(draftId);
    
    await this.redis.del(`auction:${draftId}`);
  }

  /**
   * Get auction state
   */
  private async getAuctionState(draftId: string): Promise<AuctionState> {
    let state = this.auctionStates.get(draftId);
    
    if (!state) {
      // Try to load from Redis
      const savedState = await this.redis.get(`auction:${draftId}`);
      if (savedState) {
        state = JSON.parse(savedState);
        // Restore Maps
        state!.teamBudgets = new Map(Object.entries(state!.teamBudgets as any));
        state!.completedPicks = new Set(state!.completedPicks as any);
        state!.autoBidSettings = new Map(Object.entries(state!.autoBidSettings as any));
        this.auctionStates.set(draftId, state!);
      }
    }
    
    if (!state) {
      throw new Error('Auction state not found');
    }
    
    return state;
  }

  /**
   * Save state to Redis
   */
  private async saveStateToRedis(draftId: string, state: AuctionState): Promise<void> {
    const serializable = {
      ...state,
      teamBudgets: Object.fromEntries(state.teamBudgets),
      completedPicks: Array.from(state.completedPicks),
      autoBidSettings: Object.fromEntries(
        Array.from(state.autoBidSettings.entries()).map(([k, v]) => [
          k,
          { ...v, maxBidPerPlayer: Object.fromEntries(v.maxBidPerPlayer) },
        ])
      ),
    };
    
    await this.redis.set(
      `auction:${draftId}`,
      JSON.stringify(serializable),
      'EX',
      86400 // 24 hour expiry
    );
  }

  /**
   * Get team budget status
   */
  async getTeamBudget(draftId: string, teamId: string): Promise<TeamBudget | undefined> {
    const state = await this.getAuctionState(draftId);
    return state.teamBudgets.get(teamId);
  }

  /**
   * Get all team budgets
   */
  async getAllBudgets(draftId: string): Promise<TeamBudget[]> {
    const state = await this.getAuctionState(draftId);
    return Array.from(state.teamBudgets.values());
  }
}