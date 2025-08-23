/**
 * Real-time Service for Astral Draft v4
 * Handles WebSocket connections, live updates, chat, and push notifications
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../server/db';
import { verifyJWT } from '../lib/auth/jwt';
import scoringEngine from './scoringEngine';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

// Initialize Redis for pub/sub
let redis: Redis | null = null;
let redisSub: Redis | null = null;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  });
  
  redisSub = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  });
} catch (error) {
  console.warn('Redis not available for real-time service');
}

// Type definitions
export interface RealTimeUser {
  id: string;
  username: string;
  socketId: string;
  leagueIds: string[];
  activeRoom?: string;
}

export interface DraftUpdate {
  type: 'PICK_MADE' | 'TIMER_UPDATE' | 'DRAFT_PAUSED' | 'DRAFT_RESUMED' | 'DRAFT_COMPLETE';
  draftId: string;
  pick?: {
    round: number;
    pickNumber: number;
    teamId: string;
    playerId: string;
    playerName: string;
    position: string;
  };
  nextUp?: {
    teamId: string;
    teamName: string;
    timeRemaining: number;
  };
  timeRemaining?: number;
  message?: string;
}

export interface LiveScoreUpdate {
  type: 'SCORE_UPDATE' | 'PLAYER_SCORE' | 'GAME_FINAL' | 'INJURY_UPDATE';
  leagueId: string;
  matchupId?: string;
  teamId?: string;
  playerId?: string;
  previousScore?: number;
  newScore?: number;
  delta?: number;
  gameStatus?: string;
  injuryStatus?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  type: 'TEXT' | 'TRADE' | 'SYSTEM' | 'EMOJI' | 'GIF';
  metadata?: any;
  timestamp: Date;
  reactions?: Map<string, string[]>; // emoji -> userIds
}

export interface TradeNotification {
  type: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED';
  tradeId: string;
  fromTeam: string;
  toTeam: string;
  players: {
    from: string[];
    to: string[];
  };
  message?: string;
}

export interface PushNotification {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class RealTimeService extends EventEmitter {
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, RealTimeUser>();
  private draftRooms = new Map<string, Set<string>>(); // draftId -> Set<userId>
  private leagueRooms = new Map<string, Set<string>>(); // leagueId -> Set<userId>
  private typingUsers = new Map<string, Set<string>>(); // roomId -> Set<userId>
  private messageHistory = new Map<string, ChatMessage[]>(); // roomId -> messages
  private readonly MAX_HISTORY_SIZE = 100;

  constructor() {
    super();
    this.setupRedisSubscriptions();
    this.startHeartbeat();
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const user = await this.authenticateSocket(token);
        if (!user) {
          return next(new Error('Invalid authentication'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('Real-time service initialized');
  }

  /**
   * Authenticate socket connection
   */
  private async authenticateSocket(token: string): Promise<RealTimeUser | null> {
    try {
      const decoded = await verifyJWT(token);
      if (!decoded || !decoded.id) return null;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          memberships: {
            select: { leagueId: true },
          },
        },
      });

      if (!user) return null;

      return {
        id: user.id,
        username: user.username,
        socketId: '',
        leagueIds: user.memberships.map(m => m.leagueId),
      };
    } catch (error) {
      console.error('Socket authentication error:', error);
      return null;
    }
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: Socket): void {
    const user = socket.data.user as RealTimeUser;
    user.socketId = socket.id;

    console.log(`User connected: ${user.username} (${socket.id})`);
    
    // Store connected user
    this.connectedUsers.set(user.id, user);

    // Join user to their league rooms
    user.leagueIds.forEach(leagueId => {
      socket.join(`league:${leagueId}`);
      this.addToLeagueRoom(leagueId, user.id);
    });

    // Set up event handlers
    this.setupSocketHandlers(socket, user);

    // Send connection confirmation
    socket.emit('connected', {
      userId: user.id,
      username: user.username,
      leagues: user.leagueIds,
    });

    // Notify others of user online status
    this.broadcastUserStatus(user.id, 'online');

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(user);
    });
  }

  /**
   * Set up socket event handlers
   */
  private setupSocketHandlers(socket: Socket, user: RealTimeUser): void {
    // Draft events
    socket.on('join_draft', (draftId: string) => this.handleJoinDraft(socket, user, draftId));
    socket.on('leave_draft', (draftId: string) => this.handleLeaveDraft(socket, user, draftId));
    socket.on('make_pick', (data) => this.handleDraftPick(socket, user, data));
    socket.on('draft_chat', (data) => this.handleDraftChat(socket, user, data));

    // Live scoring events
    socket.on('subscribe_scores', (leagueId: string) => this.handleSubscribeScores(socket, user, leagueId));
    socket.on('unsubscribe_scores', (leagueId: string) => this.handleUnsubscribeScores(socket, user, leagueId));

    // Chat events
    socket.on('send_message', (data) => this.handleSendMessage(socket, user, data));
    socket.on('typing_start', (roomId: string) => this.handleTypingStart(socket, user, roomId));
    socket.on('typing_stop', (roomId: string) => this.handleTypingStop(socket, user, roomId));
    socket.on('react_message', (data) => this.handleMessageReaction(socket, user, data));
    socket.on('get_history', (roomId: string) => this.handleGetHistory(socket, roomId));

    // Trade events
    socket.on('trade_proposed', (data) => this.handleTradeProposed(socket, user, data));
    socket.on('trade_response', (data) => this.handleTradeResponse(socket, user, data));

    // Notification events
    socket.on('mark_read', (notificationId: string) => this.handleMarkRead(user, notificationId));
    socket.on('update_push_token', (token: string) => this.handleUpdatePushToken(user, token));
  }

  /**
   * Handle user disconnection
   */
  private handleDisconnection(user: RealTimeUser): void {
    console.log(`User disconnected: ${user.username}`);
    
    // Remove from connected users
    this.connectedUsers.delete(user.id);

    // Remove from all rooms
    user.leagueIds.forEach(leagueId => {
      this.removeFromLeagueRoom(leagueId, user.id);
    });

    // Remove from draft rooms
    this.draftRooms.forEach((users, draftId) => {
      if (users.has(user.id)) {
        users.delete(user.id);
        this.io?.to(`draft:${draftId}`).emit('user_left_draft', {
          userId: user.id,
          username: user.username,
        });
      }
    });

    // Clear typing status
    this.typingUsers.forEach(users => {
      users.delete(user.id);
    });

    // Notify others of user offline status
    this.broadcastUserStatus(user.id, 'offline');
  }

  /**
   * Handle joining draft room
   */
  private async handleJoinDraft(socket: Socket, user: RealTimeUser, draftId: string): Promise<void> {
    try {
      // Verify user is in this draft
      const draft = await prisma.draft.findUnique({
        where: { id: draftId },
        include: {
          league: {
            include: {
              teams: {
                where: { ownerId: user.id },
              },
            },
          },
        },
      });

      if (!draft || draft.league.teams.length === 0) {
        socket.emit('error', { message: 'Not authorized for this draft' });
        return;
      }

      // Join draft room
      socket.join(`draft:${draftId}`);
      
      // Track draft room membership
      if (!this.draftRooms.has(draftId)) {
        this.draftRooms.set(draftId, new Set());
      }
      this.draftRooms.get(draftId)!.add(user.id);

      // Send draft state to user
      const draftState = await this.getDraftState(draftId);
      socket.emit('draft_state', draftState);

      // Notify others
      socket.to(`draft:${draftId}`).emit('user_joined_draft', {
        userId: user.id,
        username: user.username,
      });

      console.log(`${user.username} joined draft ${draftId}`);
    } catch (error) {
      console.error('Join draft error:', error);
      socket.emit('error', { message: 'Failed to join draft' });
    }
  }

  /**
   * Handle leaving draft room
   */
  private handleLeaveDraft(socket: Socket, user: RealTimeUser, draftId: string): void {
    socket.leave(`draft:${draftId}`);
    
    const draftUsers = this.draftRooms.get(draftId);
    if (draftUsers) {
      draftUsers.delete(user.id);
      if (draftUsers.size === 0) {
        this.draftRooms.delete(draftId);
      }
    }

    socket.to(`draft:${draftId}`).emit('user_left_draft', {
      userId: user.id,
      username: user.username,
    });

    console.log(`${user.username} left draft ${draftId}`);
  }

  /**
   * Handle draft pick
   */
  private async handleDraftPick(socket: Socket, user: RealTimeUser, data: any): Promise<void> {
    try {
      const { draftId, playerId, teamId } = data;

      // Validate pick
      const draft = await prisma.draft.findUnique({
        where: { id: draftId },
        include: { picks: true },
      });

      if (!draft || draft.status !== 'IN_PROGRESS') {
        socket.emit('error', { message: 'Invalid draft state' });
        return;
      }

      // Check if it's user's turn
      if (draft.currentTeamId !== teamId) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      // Make the pick
      const pick = await prisma.draftPick.create({
        data: {
          draftId,
          teamId,
          playerId,
          userId: user.id,
          round: draft.currentRound,
          pick: draft.currentPick,
        },
        include: {
          player: true,
          team: true,
        },
      });

      // Update draft state
      const nextPick = this.calculateNextPick(draft);
      await prisma.draft.update({
        where: { id: draftId },
        data: nextPick,
      });

      // Broadcast pick to all users in draft
      const update: DraftUpdate = {
        type: 'PICK_MADE',
        draftId,
        pick: {
          round: pick.round,
          pickNumber: pick.pick,
          teamId: pick.teamId,
          playerId: pick.playerId,
          playerName: pick.player?.displayName || 'Unknown',
          position: pick.player?.position || 'Unknown',
        },
        nextUp: nextPick.currentTeamId ? {
          teamId: nextPick.currentTeamId,
          teamName: 'Next Team', // Would fetch actual name
          timeRemaining: draft.timePerPick,
        } : undefined,
      };

      this.io?.to(`draft:${draftId}`).emit('draft_update', update);

      // Send push notification to next team
      if (nextPick.currentTeamId) {
        await this.sendDraftTurnNotification(nextPick.currentTeamId, draftId);
      }

      console.log(`Pick made: ${pick.player?.displayName} to ${pick.team.name}`);
    } catch (error) {
      console.error('Draft pick error:', error);
      socket.emit('error', { message: 'Failed to make pick' });
    }
  }

  /**
   * Handle subscribing to live scores
   */
  private handleSubscribeScores(socket: Socket, user: RealTimeUser, leagueId: string): void {
    if (!user.leagueIds.includes(leagueId)) {
      socket.emit('error', { message: 'Not authorized for this league' });
      return;
    }

    socket.join(`scores:${leagueId}`);
    console.log(`${user.username} subscribed to scores for league ${leagueId}`);

    // Start live updates if not already running
    this.startLiveScoring(leagueId);
  }

  /**
   * Handle unsubscribing from live scores
   */
  private handleUnsubscribeScores(socket: Socket, user: RealTimeUser, leagueId: string): void {
    socket.leave(`scores:${leagueId}`);
    console.log(`${user.username} unsubscribed from scores for league ${leagueId}`);
  }

  /**
   * Handle sending chat message
   */
  private async handleSendMessage(socket: Socket, user: RealTimeUser, data: any): Promise<void> {
    try {
      const { roomId, content, type = 'TEXT', metadata } = data;

      // Validate room access
      if (!this.canAccessRoom(user, roomId)) {
        socket.emit('error', { message: 'Not authorized for this room' });
        return;
      }

      // Create message
      const message: ChatMessage = {
        id: `msg_${Date.now()}_${user.id}`,
        roomId,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        content,
        type,
        metadata,
        timestamp: new Date(),
        reactions: new Map(),
      };

      // Store in history
      this.addToMessageHistory(roomId, message);

      // Save to database
      await prisma.message.create({
        data: {
          leagueId: roomId.replace('league:', ''),
          userId: user.id,
          content,
          type,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      // Broadcast to room
      this.io?.to(roomId).emit('new_message', message);

      // Send push notifications to offline users
      await this.sendChatNotifications(roomId, user, content);

      console.log(`Message sent in ${roomId} by ${user.username}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle typing indicators
   */
  private handleTypingStart(socket: Socket, user: RealTimeUser, roomId: string): void {
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }
    
    this.typingUsers.get(roomId)!.add(user.id);
    
    socket.to(roomId).emit('typing_update', {
      roomId,
      typingUsers: Array.from(this.typingUsers.get(roomId)!).map(id => {
        const u = this.connectedUsers.get(id);
        return u ? { id: u.id, username: u.username } : null;
      }).filter(Boolean),
    });
  }

  private handleTypingStop(socket: Socket, user: RealTimeUser, roomId: string): void {
    const typing = this.typingUsers.get(roomId);
    if (typing) {
      typing.delete(user.id);
      
      socket.to(roomId).emit('typing_update', {
        roomId,
        typingUsers: Array.from(typing).map(id => {
          const u = this.connectedUsers.get(id);
          return u ? { id: u.id, username: u.username } : null;
        }).filter(Boolean),
      });
    }
  }

  /**
   * Handle message reactions
   */
  private handleMessageReaction(socket: Socket, user: RealTimeUser, data: any): void {
    const { roomId, messageId, emoji } = data;
    
    // Find message in history
    const messages = this.messageHistory.get(roomId);
    if (!messages) return;
    
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    // Toggle reaction
    if (!message.reactions) {
      message.reactions = new Map();
    }
    
    const users = message.reactions.get(emoji) || [];
    const index = users.indexOf(user.id);
    
    if (index > -1) {
      users.splice(index, 1);
    } else {
      users.push(user.id);
    }
    
    if (users.length > 0) {
      message.reactions.set(emoji, users);
    } else {
      message.reactions.delete(emoji);
    }
    
    // Broadcast update
    this.io?.to(roomId).emit('reaction_update', {
      messageId,
      reactions: Array.from(message.reactions.entries()).map(([emoji, userIds]) => ({
        emoji,
        userIds,
        count: userIds.length,
      })),
    });
  }

  /**
   * Handle trade proposals
   */
  private async handleTradeProposed(socket: Socket, user: RealTimeUser, data: any): Promise<void> {
    try {
      const notification: TradeNotification = {
        type: 'PROPOSED',
        tradeId: data.tradeId,
        fromTeam: data.fromTeam,
        toTeam: data.toTeam,
        players: data.players,
        message: data.message,
      };

      // Send to target team owner
      const targetTeam = await prisma.team.findUnique({
        where: { id: data.toTeamId },
        select: { ownerId: true },
      });

      if (targetTeam) {
        const targetUser = this.connectedUsers.get(targetTeam.ownerId);
        if (targetUser) {
          this.io?.to(targetUser.socketId).emit('trade_notification', notification);
        }

        // Send push notification
        await this.sendPushNotification({
          userId: targetTeam.ownerId,
          title: 'New Trade Proposal',
          body: `${data.fromTeam} has proposed a trade`,
          tag: 'trade',
          data: { tradeId: data.tradeId },
        });
      }

      console.log(`Trade proposed: ${data.tradeId}`);
    } catch (error) {
      console.error('Trade proposal error:', error);
    }
  }

  /**
   * Broadcast live score updates
   */
  broadcastScoreUpdate(update: LiveScoreUpdate): void {
    if (!this.io) return;
    
    this.io.to(`scores:${update.leagueId}`).emit('score_update', update);
    
    // Send push notifications for significant events
    if (update.type === 'GAME_FINAL' || update.type === 'INJURY_UPDATE') {
      this.sendScoreNotifications(update);
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notification: PushNotification): Promise<void> {
    try {
      // Get user's push tokens
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { 
          id: true,
          notificationSettings: true,
        },
      });

      if (!user) return;

      const settings = JSON.parse(user.notificationSettings || '{}');
      if (!settings.pushEnabled) return;

      // In production, integrate with FCM/APNS
      // For now, emit to connected sockets
      const connectedUser = this.connectedUsers.get(notification.userId);
      if (connectedUser) {
        this.io?.to(connectedUser.socketId).emit('push_notification', notification);
      }

      // Store notification in database
      await prisma.notification.create({
        data: {
          userId: notification.userId,
          type: notification.tag || 'GENERAL',
          title: notification.title,
          content: notification.body,
          data: notification.data ? JSON.stringify(notification.data) : null,
        },
      });

      console.log(`Push notification sent to ${notification.userId}`);
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  // Helper methods
  private addToLeagueRoom(leagueId: string, userId: string): void {
    if (!this.leagueRooms.has(leagueId)) {
      this.leagueRooms.set(leagueId, new Set());
    }
    this.leagueRooms.get(leagueId)!.add(userId);
  }

  private removeFromLeagueRoom(leagueId: string, userId: string): void {
    const room = this.leagueRooms.get(leagueId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.leagueRooms.delete(leagueId);
      }
    }
  }

  private canAccessRoom(user: RealTimeUser, roomId: string): boolean {
    if (roomId.startsWith('league:')) {
      const leagueId = roomId.replace('league:', '');
      return user.leagueIds.includes(leagueId);
    }
    return false;
  }

  private addToMessageHistory(roomId: string, message: ChatMessage): void {
    if (!this.messageHistory.has(roomId)) {
      this.messageHistory.set(roomId, []);
    }
    
    const history = this.messageHistory.get(roomId)!;
    history.push(message);
    
    // Trim history if too large
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.shift();
    }
  }

  private async handleGetHistory(socket: Socket, roomId: string): Promise<void> {
    const history = this.messageHistory.get(roomId) || [];
    socket.emit('message_history', {
      roomId,
      messages: history.slice(-50), // Last 50 messages
    });
  }

  private broadcastUserStatus(userId: string, status: 'online' | 'offline'): void {
    const user = this.connectedUsers.get(userId);
    if (!user) return;

    user.leagueIds.forEach(leagueId => {
      this.io?.to(`league:${leagueId}`).emit('user_status', {
        userId,
        status,
        timestamp: new Date(),
      });
    });
  }

  private async getDraftState(draftId: string): Promise<any> {
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
      include: {
        picks: {
          include: {
            player: true,
            team: true,
          },
          orderBy: { pick: 'asc' },
        },
        league: {
          include: {
            teams: true,
          },
        },
      },
    });

    return {
      draftId,
      status: draft?.status,
      currentRound: draft?.currentRound,
      currentPick: draft?.currentPick,
      currentTeamId: draft?.currentTeamId,
      timePerPick: draft?.timePerPick,
      picks: draft?.picks,
      teams: draft?.league.teams,
      draftOrder: JSON.parse(draft?.draftOrder || '[]'),
    };
  }

  private calculateNextPick(draft: any): any {
    const totalTeams = JSON.parse(draft.draftOrder).length;
    const isSnake = draft.type === 'SNAKE';
    
    let nextRound = draft.currentRound;
    let nextPick = draft.currentPick + 1;
    
    if (nextPick > totalTeams) {
      nextRound++;
      nextPick = 1;
    }
    
    if (nextRound > draft.rounds) {
      return {
        status: 'COMPLETED',
        currentRound: draft.rounds,
        currentPick: totalTeams,
        currentTeamId: null,
        completedAt: new Date(),
      };
    }
    
    const draftOrder = JSON.parse(draft.draftOrder);
    const pickIndex = isSnake && nextRound % 2 === 0 
      ? totalTeams - nextPick 
      : nextPick - 1;
    
    return {
      currentRound: nextRound,
      currentPick: nextPick,
      currentTeamId: draftOrder[pickIndex],
    };
  }

  private async sendDraftTurnNotification(teamId: string, draftId: string): Promise<void> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true, name: true },
    });

    if (team) {
      await this.sendPushNotification({
        userId: team.ownerId,
        title: "It's Your Turn!",
        body: `${team.name} is on the clock`,
        tag: 'draft',
        data: { draftId },
        requireInteraction: true,
      });
    }
  }

  private async sendChatNotifications(roomId: string, sender: RealTimeUser, content: string): Promise<void> {
    if (!roomId.startsWith('league:')) return;
    
    const leagueId = roomId.replace('league:', '');
    const room = this.leagueRooms.get(leagueId);
    if (!room) return;

    for (const userId of room) {
      if (userId === sender.id) continue;
      if (this.connectedUsers.has(userId)) continue; // Skip online users
      
      await this.sendPushNotification({
        userId,
        title: `${sender.username}`,
        body: content.substring(0, 100),
        tag: 'chat',
        data: { roomId },
      });
    }
  }

  private async sendScoreNotifications(update: LiveScoreUpdate): Promise<void> {
    // Implementation for score-based notifications
    // Would send notifications for close games, upsets, etc.
  }

  private async handleMarkRead(user: RealTimeUser, notificationId: string): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  private async handleUpdatePushToken(user: RealTimeUser, token: string): Promise<void> {
    // Store FCM/APNS token for user
    // In production, would store in database
    console.log(`Updated push token for ${user.username}`);
  }

  private async handleTradeResponse(socket: Socket, user: RealTimeUser, data: any): Promise<void> {
    // Handle trade accept/reject/counter
    const notification: TradeNotification = {
      type: data.response,
      tradeId: data.tradeId,
      fromTeam: data.fromTeam,
      toTeam: data.toTeam,
      players: data.players,
      message: data.message,
    };

    // Broadcast to involved parties
    this.io?.to(`league:${data.leagueId}`).emit('trade_update', notification);
  }

  private async handleDraftChat(socket: Socket, user: RealTimeUser, data: any): Promise<void> {
    const message = {
      userId: user.id,
      username: user.username,
      content: data.content,
      timestamp: new Date(),
    };

    this.io?.to(`draft:${data.draftId}`).emit('draft_chat', message);
  }

  private startLiveScoring(leagueId: string): void {
    // Subscribe to scoring engine events
    scoringEngine.on('liveUpdate', (update) => {
      this.broadcastScoreUpdate({
        type: 'SCORE_UPDATE',
        leagueId,
        ...update,
      });
    });
  }

  private setupRedisSubscriptions(): void {
    if (!redisSub) return;

    redisSub.subscribe('draft:updates', 'score:updates', 'trade:updates');
    
    redisSub.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        
        switch (channel) {
          case 'draft:updates':
            this.io?.to(`draft:${data.draftId}`).emit('draft_update', data);
            break;
          case 'score:updates':
            this.io?.to(`scores:${data.leagueId}`).emit('score_update', data);
            break;
          case 'trade:updates':
            this.io?.to(`league:${data.leagueId}`).emit('trade_update', data);
            break;
        }
      } catch (error) {
        console.error('Redis message error:', error);
      }
    });
  }

  private startHeartbeat(): void {
    setInterval(() => {
      this.connectedUsers.forEach((user) => {
        const socket = this.io?.sockets.sockets.get(user.socketId);
        if (!socket || !socket.connected) {
          this.handleDisconnection(user);
        }
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Get online users for a league
   */
  getOnlineUsers(leagueId: string): RealTimeUser[] {
    const room = this.leagueRooms.get(leagueId);
    if (!room) return [];

    return Array.from(room)
      .map(userId => this.connectedUsers.get(userId))
      .filter(Boolean) as RealTimeUser[];
  }

  /**
   * Shutdown service gracefully
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down real-time service...');
    
    // Notify all connected users
    this.io?.emit('server_shutdown', {
      message: 'Server is restarting. Please reconnect in a moment.',
    });

    // Close all connections
    this.io?.disconnectSockets();
    
    // Close Redis connections
    if (redis) await redis.quit();
    if (redisSub) await redisSub.quit();
    
    // Clear intervals
    scoringEngine.stopRealTimeUpdates();
    
    console.log('Real-time service shutdown complete');
  }
}

// Export singleton instance
export const realTimeService = new RealTimeService();
export default realTimeService;