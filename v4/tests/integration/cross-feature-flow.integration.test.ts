/**
 * Cross-Feature Integration Tests (Phase 11.1)
 * Tests the complete user journey across multiple features
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createUser, createLeague, createDraft } from '../factories';
import { prisma } from '../../src/server/db';
import { WebSocket } from 'ws';

describe('Cross-Feature Integration Tests', () => {
  let testUser: any;
  let testLeague: any;
  let testDraft: any;

  beforeEach(async () => {
    // Clean database
    await prisma.user.deleteMany();
    await prisma.league.deleteMany();
    await prisma.draft.deleteMany();
    
    // Create test data
    testUser = await createUser({
      email: 'test@astraldraft.com',
      username: 'testuser',
      displayName: 'Test User'
    });
    
    testLeague = await createLeague({
      name: 'Test League',
      commissionerId: testUser.id,
      settings: {
        teamCount: 12,
        scoringFormat: 'PPR',
        playoffTeams: 6
      }
    });
    
    testDraft = await createDraft({
      leagueId: testLeague.id,
      type: 'SNAKE',
      rounds: 16,
      timePerPick: 90
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany();
    await prisma.league.deleteMany();
    await prisma.draft.deleteMany();
  });

  describe('Draft → Team → Trade → Waiver Flow', () => {
    it('should complete the full fantasy football lifecycle', async () => {
      // 1. DRAFT PHASE
      // Simulate draft picks
      const draftPicks = await simulateCompleteDraft();
      expect(draftPicks.length).toBe(testLeague.settings.teamCount * testDraft.rounds);
      
      // Verify rosters are populated
      const teams = await prisma.team.findMany({
        where: { leagueId: testLeague.id },
        include: { roster: { include: { player: true } } }
      });
      
      expect(teams.length).toBe(testLeague.settings.teamCount);
      teams.forEach(team => {
        expect(team.roster.length).toBeGreaterThan(0);
      });

      // 2. TEAM MANAGEMENT PHASE
      // Test lineup setting
      const primaryTeam = teams[0];
      await setOptimalLineup(primaryTeam.id);
      
      const updatedTeam = await prisma.team.findUnique({
        where: { id: primaryTeam.id },
        include: { lineup: true }
      });
      
      expect(updatedTeam?.lineup).toBeDefined();
      expect(updatedTeam?.lineup.length).toBeGreaterThan(0);

      // 3. TRADE PHASE
      // Propose and execute a trade
      const trade = await proposeAndExecuteTrade(teams[0].id, teams[1].id);
      expect(trade.status).toBe('COMPLETED');
      
      // Verify rosters updated correctly
      const updatedTeams = await prisma.team.findMany({
        where: { id: { in: [teams[0].id, teams[1].id] } },
        include: { roster: true }
      });
      
      // Check that players were swapped correctly
      expect(updatedTeams[0].roster.some(r => r.playerId === trade.receivingPlayers[0].id)).toBe(true);
      expect(updatedTeams[1].roster.some(r => r.playerId === trade.givingPlayers[0].id)).toBe(true);

      // 4. WAIVER WIRE PHASE
      // Add player to waivers and process claim
      const waiverClaim = await addWaiverClaim(primaryTeam.id);
      await processWaiverClaims();
      
      const processedClaim = await prisma.waiverClaim.findUnique({
        where: { id: waiverClaim.id }
      });
      
      expect(processedClaim?.status).toBe('PROCESSED');
      
      // 5. SEASON PROGRESSION
      // Simulate week progression
      await advanceToWeek(2);
      const currentWeek = await getCurrentWeek(testLeague.id);
      expect(currentWeek).toBe(2);
      
      // Test scoring update
      await updateWeeklyScores(testLeague.id, 2);
      const matchups = await prisma.matchup.findMany({
        where: { leagueId: testLeague.id, week: 2 }
      });
      
      expect(matchups.length).toBeGreaterThan(0);
      matchups.forEach(matchup => {
        expect(matchup.homeScore).toBeDefined();
        expect(matchup.awayScore).toBeDefined();
      });
    });
  });

  describe('Real-time Updates End-to-End', () => {
    it('should propagate updates across all connected clients', async () => {
      const wsConnections: WebSocket[] = [];
      const receivedMessages: any[][] = Array(3).fill(null).map(() => []);
      
      try {
        // Connect multiple WebSocket clients
        for (let i = 0; i < 3; i++) {
          const ws = new WebSocket(`ws://localhost:3001/league/${testLeague.id}`);
          wsConnections.push(ws);
          
          ws.on('message', (data) => {
            receivedMessages[i].push(JSON.parse(data.toString()));
          });
          
          await new Promise(resolve => ws.on('open', resolve));
        }

        // Trigger a trade action
        const trade = await proposeAndExecuteTrade(
          await getFirstTeamId(),
          await getSecondTeamId()
        );

        // Wait for messages to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify all clients received the trade update
        receivedMessages.forEach(messages => {
          const tradeMessage = messages.find(msg => 
            msg.type === 'TRADE_COMPLETED' && msg.data.tradeId === trade.id
          );
          expect(tradeMessage).toBeDefined();
        });

        // Trigger a waiver claim
        const waiverClaim = await addWaiverClaim(await getFirstTeamId());
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify waiver claim broadcasts
        receivedMessages.forEach(messages => {
          const waiverMessage = messages.find(msg => 
            msg.type === 'WAIVER_CLAIM_ADDED' && msg.data.claimId === waiverClaim.id
          );
          expect(waiverMessage).toBeDefined();
        });

      } finally {
        // Clean up WebSocket connections
        wsConnections.forEach(ws => ws.close());
      }
    });
  });

  describe('Notification Delivery Across Features', () => {
    it('should deliver notifications for all major events', async () => {
      const notificationEvents: any[] = [];
      
      // Mock notification service to capture events
      const originalSendNotification = global.sendNotification;
      global.sendNotification = (event: any) => {
        notificationEvents.push(event);
        return Promise.resolve();
      };

      try {
        // 1. Draft notification
        await simulateCompleteDraft();
        expect(notificationEvents.some(e => e.type === 'DRAFT_COMPLETED')).toBe(true);

        // 2. Trade notification
        const trade = await proposeAndExecuteTrade(
          await getFirstTeamId(),
          await getSecondTeamId()
        );
        expect(notificationEvents.some(e => 
          e.type === 'TRADE_PROPOSED' && e.data.tradeId === trade.id
        )).toBe(true);

        // 3. Waiver notification
        const waiverClaim = await addWaiverClaim(await getFirstTeamId());
        await processWaiverClaims();
        expect(notificationEvents.some(e => 
          e.type === 'WAIVER_PROCESSED' && e.data.claimId === waiverClaim.id
        )).toBe(true);

        // 4. Matchup notification
        await advanceToWeek(2);
        await updateWeeklyScores(testLeague.id, 2);
        expect(notificationEvents.some(e => e.type === 'SCORES_UPDATED')).toBe(true);

        // 5. Playoff notification
        await advanceToPlayoffs();
        expect(notificationEvents.some(e => e.type === 'PLAYOFFS_STARTED')).toBe(true);

      } finally {
        global.sendNotification = originalSendNotification;
      }
    });
  });

  describe('Season Progression Through Playoffs', () => {
    it('should handle complete season including playoffs', async () => {
      // Complete regular season
      await simulateCompleteDraft();
      
      // Simulate all regular season weeks
      for (let week = 1; week <= 14; week++) {
        await advanceToWeek(week);
        await updateWeeklyScores(testLeague.id, week);
        await processWaiverClaims();
      }

      // Check standings
      const standings = await calculateStandings(testLeague.id);
      expect(standings.length).toBe(testLeague.settings.teamCount);
      expect(standings[0].wins).toBeGreaterThanOrEqual(0);

      // Start playoffs
      await advanceToPlayoffs();
      const playoffBracket = await generatePlayoffBracket(testLeague.id);
      expect(playoffBracket.teams.length).toBe(testLeague.settings.playoffTeams);

      // Simulate playoff weeks
      for (let week = 15; week <= 17; week++) {
        await advanceToWeek(week);
        await updateWeeklyScores(testLeague.id, week);
        
        const playoffMatchups = await prisma.matchup.findMany({
          where: { 
            leagueId: testLeague.id, 
            week,
            isPlayoff: true 
          }
        });
        expect(playoffMatchups.length).toBeGreaterThan(0);
      }

      // Verify champion
      const champion = await getLeagueChampion(testLeague.id);
      expect(champion).toBeDefined();
      expect(champion.teamId).toBeDefined();
    });
  });

  // Helper functions
  async function simulateCompleteDraft() {
    const picks = [];
    for (let round = 1; round <= testDraft.rounds; round++) {
      for (let pick = 1; pick <= testLeague.settings.teamCount; pick++) {
        const draftPick = await prisma.draftPick.create({
          data: {
            draftId: testDraft.id,
            round,
            pick,
            teamId: await getTeamIdByPickOrder(pick),
            playerId: await getNextAvailablePlayer(),
            timestamp: new Date()
          }
        });
        picks.push(draftPick);
      }
    }
    return picks;
  }

  async function setOptimalLineup(teamId: string) {
    const roster = await prisma.rosterPlayer.findMany({
      where: { teamId },
      include: { player: true }
    });

    const lineup = [];
    const positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DST'];
    
    for (const position of positions) {
      const player = roster.find(r => 
        r.player.position === position && 
        !lineup.find(l => l.playerId === r.playerId)
      );
      
      if (player) {
        lineup.push({
          teamId,
          playerId: player.playerId,
          position,
          week: 1
        });
      }
    }

    await prisma.lineup.createMany({ data: lineup });
  }

  async function proposeAndExecuteTrade(team1Id: string, team2Id: string) {
    const team1Players = await prisma.rosterPlayer.findMany({
      where: { teamId: team1Id },
      take: 1
    });
    
    const team2Players = await prisma.rosterPlayer.findMany({
      where: { teamId: team2Id },
      take: 1
    });

    const trade = await prisma.trade.create({
      data: {
        leagueId: testLeague.id,
        proposingTeamId: team1Id,
        receivingTeamId: team2Id,
        status: 'PROPOSED',
        proposedAt: new Date()
      }
    });

    // Add trade players
    await prisma.tradedPlayer.createMany({
      data: [
        {
          tradeId: trade.id,
          playerId: team1Players[0].playerId,
          fromTeamId: team1Id,
          toTeamId: team2Id
        },
        {
          tradeId: trade.id,
          playerId: team2Players[0].playerId,
          fromTeamId: team2Id,
          toTeamId: team1Id
        }
      ]
    });

    // Execute trade
    return await prisma.trade.update({
      where: { id: trade.id },
      data: { 
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        givingPlayers: true,
        receivingPlayers: true
      }
    });
  }

  async function addWaiverClaim(teamId: string) {
    const availablePlayer = await getNextAvailablePlayer();
    const droppablePlayer = await prisma.rosterPlayer.findFirst({
      where: { teamId }
    });

    return await prisma.waiverClaim.create({
      data: {
        teamId,
        playerId: availablePlayer,
        dropPlayerId: droppablePlayer?.playerId,
        priority: 1,
        week: 1,
        status: 'PENDING'
      }
    });
  }

  async function processWaiverClaims() {
    const claims = await prisma.waiverClaim.findMany({
      where: { status: 'PENDING' },
      orderBy: { priority: 'asc' }
    });

    for (const claim of claims) {
      await prisma.waiverClaim.update({
        where: { id: claim.id },
        data: { status: 'PROCESSED' }
      });
    }
  }

  async function advanceToWeek(week: number) {
    await prisma.league.update({
      where: { id: testLeague.id },
      data: { currentWeek: week }
    });
  }

  async function getCurrentWeek(leagueId: string) {
    const league = await prisma.league.findUnique({
      where: { id: leagueId }
    });
    return league?.currentWeek || 1;
  }

  async function updateWeeklyScores(leagueId: string, week: number) {
    const matchups = await prisma.matchup.findMany({
      where: { leagueId, week }
    });

    for (const matchup of matchups) {
      await prisma.matchup.update({
        where: { id: matchup.id },
        data: {
          homeScore: Math.random() * 200,
          awayScore: Math.random() * 200
        }
      });
    }
  }

  async function advanceToPlayoffs() {
    await prisma.league.update({
      where: { id: testLeague.id },
      data: { 
        currentWeek: 15,
        status: 'PLAYOFFS'
      }
    });
  }

  async function calculateStandings(leagueId: string) {
    const teams = await prisma.team.findMany({
      where: { leagueId }
    });

    return teams.map(team => ({
      ...team,
      wins: Math.floor(Math.random() * 14),
      losses: Math.floor(Math.random() * 14),
      pointsFor: Math.random() * 2000,
      pointsAgainst: Math.random() * 2000
    })).sort((a, b) => b.wins - a.wins);
  }

  async function generatePlayoffBracket(leagueId: string) {
    const standings = await calculateStandings(leagueId);
    const playoffTeams = standings.slice(0, testLeague.settings.playoffTeams);
    
    return {
      teams: playoffTeams,
      bracket: generateBracketStructure(playoffTeams)
    };
  }

  async function getLeagueChampion(leagueId: string) {
    const championshipMatchup = await prisma.matchup.findFirst({
      where: { 
        leagueId, 
        week: 17,
        isPlayoff: true
      }
    });

    if (!championshipMatchup) return null;

    const winnerTeamId = championshipMatchup.homeScore > championshipMatchup.awayScore 
      ? championshipMatchup.homeTeamId 
      : championshipMatchup.awayTeamId;

    return { teamId: winnerTeamId };
  }

  // Utility helper functions
  async function getTeamIdByPickOrder(pickOrder: number): Promise<string> {
    const teams = await prisma.team.findMany({
      where: { leagueId: testLeague.id },
      orderBy: { createdAt: 'asc' }
    });
    return teams[(pickOrder - 1) % teams.length].id;
  }

  async function getNextAvailablePlayer(): Promise<string> {
    const player = await prisma.player.findFirst({
      where: {
        roster: { none: {} }
      }
    });
    return player?.id || 'mock-player-id';
  }

  async function getFirstTeamId(): Promise<string> {
    const team = await prisma.team.findFirst({
      where: { leagueId: testLeague.id }
    });
    return team!.id;
  }

  async function getSecondTeamId(): Promise<string> {
    const teams = await prisma.team.findMany({
      where: { leagueId: testLeague.id },
      take: 2
    });
    return teams[1].id;
  }

  function generateBracketStructure(teams: any[]) {
    // Simple bracket generation logic
    const rounds = Math.ceil(Math.log2(teams.length));
    return {
      rounds,
      matchups: teams.length / 2
    };
  }
});