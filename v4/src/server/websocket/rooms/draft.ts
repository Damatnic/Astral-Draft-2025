/**
 * Draft room handler for real-time draft functionality
 */

import { Server } from 'socket.io';
import { prisma } from '../../db';
import { cache, pubsub } from '../../redis';
import type { Draft, Team } from '@prisma/client';

interface DraftUser {
  userId: string;
  username: string;
  teamId: string;
  teamName: string;
  socket: any;
}

export class DraftRoom {
  private io: Server;
  private draft: Draft & { league: { teams: Team[] } };
  private users: Map<string, DraftUser> = new Map();
  private pickTimer: NodeJS.Timeout | null = null;
  private autopickEnabled: Map<string, boolean> = new Map();
  private currentRound: number = 1;
  private currentTeamId: string | null = null;
  
  constructor(io: Server, draft: Draft & { league: { teams: Team[] } }) {
    this.io = io;
    this.draft = draft;
    this.initializeDraft();
  }
  
  private async initializeDraft() {
    // Set up draft order if not already set
    if (!this.draft.draftOrder || (this.draft.draftOrder as any[]).length === 0) {
      const teams = this.draft.league.teams;
      const order = teams.map(t => t.id).sort(() => Math.random() - 0.5);
      
      await prisma.draft.update({
        where: { id: this.draft.id },
        data: { draftOrder: order },
      });
      
      this.draft.draftOrder = order;
    }
    
    // Start draft if scheduled time has passed
    if (this.draft.status === 'SCHEDULED' && 
        this.draft.scheduledDate && 
        this.draft.scheduledDate <= new Date()) {
      await this.startDraft();
    }
  }
  
  async addUser(socket: any, team: Team) {
    const user: DraftUser = {
      userId: socket.userId,
      username: socket.username,
      teamId: team.id,
      teamName: team.name,
      socket,
    };
    
    this.users.set(socket.userId, user);
    
    // Notify other users
    this.broadcast('user:joined', {
      userId: user.userId,
      username: user.username,
      teamName: user.teamName,
    }, socket.userId);
    
    // Check if all users are present and draft can start
    if (this.users.size === this.draft.league.teams.length && 
        this.draft.status === 'SCHEDULED') {
      await this.startDraft();
    }
  }
  
  removeUser(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      this.users.delete(userId);
      this.broadcast('user:left', {
        userId,
        username: user.username,
      });
      
      // Enable autopick for disconnected user
      this.autopickEnabled.set(user.teamId, true);
    }
  }
  
  hasUser(userId: string): boolean {
    return this.users.has(userId);
  }
  
  isEmpty(): boolean {
    return this.users.size === 0;
  }
  
  private async startDraft() {
    await prisma.draft.update({
      where: { id: this.draft.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
    
    this.draft.status = 'IN_PROGRESS';
    
    this.broadcast('draft:started', {
      draftId: this.draft.id,
      currentRound: 1,
      currentPick: 1,
    });
    
    this.broadcast('draft:status_update', {
      started: true,
      paused: false,
    });
    
    await this.startPickTimer();
  }
  
  private async startPickTimer() {
    const currentTeamId = this.getCurrentTeamId();
    if (!currentTeamId) return;
    
    // Store current team ID in memory since it's not in the DB schema
    this.currentTeamId = currentTeamId;
    
    this.broadcast('draft:on_clock', {
      teamId: currentTeamId,
      round: this.currentRound,
      pick: this.draft.currentPick,
      timeLimit: this.draft.timePerPick,
    });
    
    // Also send timer updates every second
    let timeRemaining = this.draft.timePerPick;
    const timerInterval = setInterval(() => {
      timeRemaining--;
      this.broadcast('draft:timer_update', {
        timeRemaining,
      });
      
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
      }
    }, 1000);
    
    // Clear any existing timer
    if (this.pickTimer) {
      clearTimeout(this.pickTimer);
    }
    
    // Set new timer
    this.pickTimer = setTimeout(async () => {
      await this.handleTimeout(currentTeamId);
    }, this.draft.timePerPick * 1000);
  }
  
  private getCurrentTeamId(): string | null {
    const order = JSON.parse(this.draft.draftOrder || '[]') as string[];
    const round = this.currentRound;
    const pick = this.draft.currentPick;
    
    if (order.length === 0) return null;
    
    // Snake draft logic
    const teamIndex = round % 2 === 1
      ? (pick - 1) % order.length
      : (order.length - 1) - ((pick - 1) % order.length);
    
    return order[teamIndex] || null;
  }
  
  private async handleTimeout(teamId: string) {
    // Auto-pick best available player
    const bestAvailable = await this.getBestAvailablePlayer();
    if (bestAvailable) {
      await this.executePick(teamId, bestAvailable.id, true);
    }
  }
  
  private async getBestAvailablePlayer() {
    // Get all drafted players
    const draftedPlayers = await prisma.draftPick.findMany({
      where: { draftId: this.draft.id },
      select: { playerId: true },
    });
    
    const draftedIds = draftedPlayers.map(p => p.playerId).filter(Boolean);
    
    // Get best available by ADP
    const available = await prisma.player.findFirst({
      where: {
        id: { notIn: draftedIds },
        status: 'ACTIVE',
      },
      orderBy: [
        { adp: 'asc' },
        { rank: 'asc' },
      ],
    });
    
    return available;
  }
  
  async makePick(socket: any, playerId: string) {
    const currentTeamId = this.getCurrentTeamId();
    const user = this.users.get(socket.userId);
    
    if (!user || user.teamId !== currentTeamId) {
      socket.emit('error', { message: 'Not your turn to pick' });
      return;
    }
    
    // Validate player is available
    const existing = await prisma.draftPick.findFirst({
      where: {
        draftId: this.draft.id,
        playerId,
      },
    });
    
    if (existing) {
      socket.emit('error', { message: 'Player already drafted' });
      return;
    }
    
    await this.executePick(currentTeamId, playerId, false);
  }
  
  private async executePick(teamId: string, playerId: string, isAutopick: boolean) {
    // Clear timer
    if (this.pickTimer) {
      clearTimeout(this.pickTimer);
      this.pickTimer = null;
    }
    
    // Get team owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });
    
    if (!team) return;
    
    // Create draft pick
    const pick = await prisma.draftPick.create({
      data: {
        draftId: this.draft.id,
        teamId,
        playerId,
        userId: team.ownerId,
        round: this.draft.currentRound,
        pick: this.getOverallPick(),
      },
      include: {
        player: true,
        team: true,
      },
    });
    
    // Add to roster
    const league = await prisma.league.findUnique({
      where: { id: this.draft.leagueId },
    });
    
    if (league) {
      await prisma.roster.create({
        data: {
          teamId,
          playerId,
          position: 'BENCH',
          week: 1,
          season: league.season,
          isStarter: false,
        },
      });
    }
    
    // Broadcast pick
    this.broadcast('draft:pick_made', {
      nextPick: this.getNextPick(),
      nextRound: this.getNextRound(),
      playerId: pick.playerId,
      playerName: pick.player?.name || 'Unknown Player',
      position: pick.player?.position || 'Unknown',
      teamName: pick.team.name,
      teamId: pick.teamId,
      pick: {
        round: pick.round,
        pick: pick.pick,
        teamId: pick.teamId,
        teamName: pick.team.name,
        playerId: pick.playerId,
        playerName: pick.player?.name || 'Unknown Player',
        position: pick.player?.position || 'Unknown',
        isAutopick,
      },
    });
    
    // Update draft state
    const order = JSON.parse(this.draft.draftOrder || '[]') as string[];
    const totalPicks = order.length * this.draft.rounds;
    const currentOverallPick = this.getOverallPick();
    
    if (currentOverallPick >= totalPicks) {
      // Draft complete
      await this.completeDraft();
    } else {
      // Move to next pick
      await this.moveToNextPick();
    }
  }
  
  private getOverallPick(): number {
    const order = JSON.parse(this.draft.draftOrder || '[]') as string[];
    const teamsCount = order.length;
    return (this.currentRound - 1) * teamsCount + this.draft.currentPick;
  }
  
  private getNextPick(): number {
    const order = JSON.parse(this.draft.draftOrder || '[]') as string[];
    const teamsCount = order.length;
    const nextPick = this.draft.currentPick + 1;
    
    if (nextPick > teamsCount) {
      nextPick = 1;
    }
    
    return nextPick;
  }
  
  private getNextRound(): number {
    const order = JSON.parse(this.draft.draftOrder || '[]') as string[];
    const teamsCount = order.length;
    let nextRound = this.currentRound;
    const nextPick = this.draft.currentPick + 1;
    
    if (nextPick > teamsCount) {
      nextRound++;
    }
    
    return nextRound;
  }
  
  private async moveToNextPick() {
    const order = JSON.parse(this.draft.draftOrder || '[]') as string[];
    const teamsCount = order.length;
    let nextRound = this.currentRound;
    const nextPick = this.draft.currentPick + 1;
    
    if (nextPick > teamsCount) {
      nextRound++;
      nextPick = 1;
    }
    
    await prisma.draft.update({
      where: { id: this.draft.id },
      data: {
        currentPick: nextPick,
      },
    });
    
    this.currentRound = nextRound;
    this.draft.currentPick = nextPick;
    
    await this.startPickTimer();
  }
  
  private async completeDraft() {
    await prisma.draft.update({
      where: { id: this.draft.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    
    // Update league status
    await prisma.league.update({
      where: { id: this.draft.leagueId },
      data: { status: 'IN_SEASON' },
    });
    
    this.broadcast('draft:completed', {
      draftId: this.draft.id,
    });
    
    // Clear timer
    if (this.pickTimer) {
      clearTimeout(this.pickTimer);
      this.pickTimer = null;
    }
  }
  
  async getDraftState() {
    const picks = await prisma.draftPick.findMany({
      where: { draftId: this.draft.id },
      include: {
        player: true,
        team: true,
      },
      orderBy: [
        { round: 'asc' },
        { pick: 'asc' },
      ],
    });
    
    return {
      id: this.draft.id,
      status: this.draft.status,
      type: this.draft.type,
      currentRound: this.currentRound,
      currentPick: this.draft.currentPick,
      currentTeamId: this.getCurrentTeamId(),
      draftOrder: this.draft.draftOrder,
      picks: picks.map(p => ({
        round: p.round,
        pick: p.pick,
        teamId: p.teamId,
        teamName: p.team.name,
        playerId: p.playerId,
        playerName: p.player?.name,
        position: p.player?.position,
      })),
      timePerPick: this.draft.timePerPick,
      rounds: this.draft.rounds,
    };
  }
  
  private broadcast(event: string, data: any, excludeUserId?: string) {
    this.users.forEach((user) => {
      if (user.userId !== excludeUserId) {
        user.socket.emit(event, data);
      }
    });
  }
}