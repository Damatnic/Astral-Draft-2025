/**
 * WebSocket server for real-time features
 */

import { Server } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { prisma } from '../db';
import { pubsub } from '../redis';
import { DraftRoom } from './rooms/draft';
import { LeagueRoom } from './rooms/league';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

import { Socket } from 'socket.io';

interface SocketWithAuth extends Socket {
  userId?: string;
  username?: string;
  leagueId?: string;
  teamId?: string;
}

export async function createWebSocketServer(port = 3001) {
  await app.prepare();
  
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });
  
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });
  
  // Authentication middleware
  io.use(async (socket: SocketWithAuth, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      // For now, accept the token as user ID for simplicity
      // In production, you'd want to verify a JWT token or session
      const userId = token;
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
        },
      });
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Attach user info to socket
      socket.userId = user.id;
      socket.username = user.username || user.email || 'Anonymous';
      
      next();
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });
  
  // Room managers
  const draftRooms = new Map<string, DraftRoom>();
  const leagueRooms = new Map<string, LeagueRoom>();
  
  io.on('connection', async (socket: SocketWithAuth) => {
    console.log(`User ${socket.username} connected`);
    
    // Join user's personal room for notifications
    socket.join(`user:${socket.userId}`);
    
    // Subscribe to user notifications
    const notificationSub = pubsub.subscribe(
      `user:${socket.userId}:notifications`,
      (data) => {
        socket.emit('notification', data);
        
        // Also emit specific notification types for different handling
        if (data.notification) {
          switch (data.notification.type) {
            case 'TRADE':
              socket.emit('notification:trade', data.notification);
              break;
            case 'WAIVER':
              socket.emit('notification:waiver', data.notification);
              break;
            case 'DRAFT':
              socket.emit('notification:draft', data.notification);
              break;
            case 'MATCHUP':
              socket.emit('notification:matchup', data.notification);
              break;
            case 'SYSTEM':
              socket.emit('notification:system', data.notification);
              break;
            default:
              socket.emit('notification:general', data.notification);
          }
        }
      }
    );
    
    // Join league room
    socket.on('join:league', async (leagueId: string) => {
      try {
        // Verify user is member of league
        const member = await prisma.leagueMember.findUnique({
          where: {
            userId_leagueId: {
              userId: socket.userId!,
              leagueId,
            },
          },
          include: {
            league: true,
          },
        });
        
        if (!member) {
          socket.emit('error', { message: 'Not a member of this league' });
          return;
        }
        
        // Get user's team
        const team = await prisma.team.findFirst({
          where: {
            leagueId,
            ownerId: socket.userId!,
          },
        });
        
        socket.leagueId = leagueId;
        socket.teamId = team?.id;
        
        // Join league room
        socket.join(`league:${leagueId}`);
        
        // Create or get league room
        if (!leagueRooms.has(leagueId)) {
          leagueRooms.set(leagueId, new LeagueRoom(io, leagueId));
        }
        
        const room = leagueRooms.get(leagueId)!;
        await room.addUser(socket);
        
        // Subscribe to league events
        const leagueSub = pubsub.subscribe(
          `league:${leagueId}:events`,
          (event) => {
            socket.emit('league:event', event);
          }
        );
        
        socket.emit('joined:league', {
          leagueId,
          teamId: team?.id,
          members: room.getMembers(),
        });
        
      } catch (error) {
        console.error('Error joining league:', error);
        socket.emit('error', { message: 'Failed to join league' });
      }
    });
    
    // Join draft room
    socket.on('draft:join', async (data: { draftId: string }) => {
      const draftId = data.draftId;
      try {
        const draft = await prisma.draft.findUnique({
          where: { id: draftId },
          include: {
            league: {
              include: {
                teams: true,
              },
            },
          },
        });
        
        if (!draft) {
          socket.emit('error', { message: 'Draft not found' });
          return;
        }
        
        // Verify user has a team in this draft
        const userTeam = draft.league.teams.find(
          t => t.ownerId === socket.userId
        );
        
        if (!userTeam) {
          socket.emit('error', { message: 'Not part of this draft' });
          return;
        }
        
        // Join draft room
        socket.join(`draft:${draftId}`);
        
        // Create or get draft room
        if (!draftRooms.has(draftId)) {
          draftRooms.set(draftId, new DraftRoom(io, draft));
        }
        
        const room = draftRooms.get(draftId)!;
        await room.addUser(socket, userTeam);
        
        socket.emit('joined:draft', {
          draftId,
          draft: await room.getDraftState(),
          teamId: userTeam.id,
        });
        
      } catch (error) {
        console.error('Error joining draft:', error);
        socket.emit('error', { message: 'Failed to join draft' });
      }
    });
    
    // Handle draft pick
    socket.on('draft:make_pick', async (data: { draftId: string; playerId: string }) => {
      try {
        const room = draftRooms.get(data.draftId);
        if (!room) {
          socket.emit('error', { message: 'Draft room not found' });
          return;
        }
        
        await room.makePick(socket, data.playerId);
        
      } catch (error) {
        console.error('Error making pick:', error);
        socket.emit('error', { message: 'Failed to make pick' });
      }
    });
    
    // Handle chat message
    socket.on('draft:send_chat', async (data: { draftId: string; message: string }) => {
      try {
        // Validate user is in draft room
        const room = draftRooms.get(data.draftId);
        if (!room || !room.hasUser(socket.userId!)) {
          socket.emit('error', { message: 'Not in this draft' });
          return;
        }
        
        // Create message object
        const message = {
          id: `msg-${Date.now()}`,
          userId: socket.userId!,
          username: socket.username!,
          message: data.message,
          timestamp: new Date(),
          type: 'chat' as const,
        };
        
        // Broadcast to draft room
        io.to(`draft:${data.draftId}`).emit('draft:chat_message', message);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle trade proposal
    socket.on('trade:propose', async (data: any) => {
      try {
        // Validate and create trade proposal
        const trade = await prisma.trade.create({
          data: {
            leagueId: socket.leagueId!,
            initiatorId: socket.teamId!,
            partnerId: data.partnerId,
            initiatorUserId: socket.userId!,
            initiatorGives: data.gives,
            initiatorReceives: data.receives,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
          },
        });
        
        // Notify partner
        const partnerTeam = await prisma.team.findUnique({
          where: { id: data.partnerId },
        });
        
        if (partnerTeam) {
          io.to(`user:${partnerTeam.ownerId}`).emit('trade:proposal', {
            trade,
            from: socket.username,
          });
        }
        
        socket.emit('trade:proposed', trade);
        
      } catch (error) {
        console.error('Error proposing trade:', error);
        socket.emit('error', { message: 'Failed to propose trade' });
      }
    });
    
    // Handle notification acknowledgment
    socket.on('notification:ack', async (notificationId: string) => {
      try {
        // Mark notification as read
        await prisma.notification.update({
          where: { 
            id: notificationId,
            userId: socket.userId!,
          },
          data: { 
            isRead: true, 
            readAt: new Date(),
          },
        });
        
        socket.emit('notification:ack:success', { notificationId });
        
      } catch (error) {
        console.error('Error acknowledging notification:', error);
        socket.emit('notification:ack:error', { 
          notificationId, 
          error: 'Failed to acknowledge notification' 
        });
      }
    });

    // Handle notification preferences update
    socket.on('notification:preferences', async (preferences: any) => {
      try {
        await prisma.notificationPreference.upsert({
          where: { userId: socket.userId! },
          update: preferences,
          create: {
            ...preferences,
            userId: socket.userId!,
          },
        });
        
        socket.emit('notification:preferences:updated', preferences);
        
      } catch (error) {
        console.error('Error updating notification preferences:', error);
        socket.emit('notification:preferences:error', { 
          error: 'Failed to update preferences' 
        });
      }
    });

    // Handle push notification subscription
    socket.on('notification:subscribe', async (subscriptionData: any) => {
      try {
        const { subscription, deviceInfo } = subscriptionData;
        
        // Remove any existing subscription for this endpoint
        await prisma.notificationSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        });

        // Create new subscription
        await prisma.notificationSubscription.create({
          data: {
            userId: socket.userId!,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            userAgent: deviceInfo?.userAgent,
            deviceType: deviceInfo?.deviceType,
            browser: deviceInfo?.browser,
            lastUsed: new Date(),
          },
        });
        
        socket.emit('notification:subscribe:success');
        
      } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        socket.emit('notification:subscribe:error', { 
          error: 'Failed to subscribe to push notifications' 
        });
      }
    });

    // Handle push notification unsubscription
    socket.on('notification:unsubscribe', async (endpoint?: string) => {
      try {
        const where: any = { userId: socket.userId! };
        if (endpoint) {
          where.endpoint = endpoint;
        }

        await prisma.notificationSubscription.deleteMany({ where });
        
        socket.emit('notification:unsubscribe:success');
        
      } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        socket.emit('notification:unsubscribe:error', { 
          error: 'Failed to unsubscribe from push notifications' 
        });
      }
    });

    // Handle notification deletion
    socket.on('notification:delete', async (notificationId: string) => {
      try {
        await prisma.notification.delete({
          where: { 
            id: notificationId,
            userId: socket.userId!,
          },
        });
        
        socket.emit('notification:delete:success', { notificationId });
        
      } catch (error) {
        console.error('Error deleting notification:', error);
        socket.emit('notification:delete:error', { 
          notificationId, 
          error: 'Failed to delete notification' 
        });
      }
    });

    // Handle mark all as read
    socket.on('notification:mark-all-read', async () => {
      try {
        await prisma.notification.updateMany({
          where: { 
            userId: socket.userId!,
            isRead: false,
          },
          data: { 
            isRead: true, 
            readAt: new Date(),
          },
        });
        
        socket.emit('notification:mark-all-read:success');
        
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        socket.emit('notification:mark-all-read:error', { 
          error: 'Failed to mark all notifications as read' 
        });
      }
    });

    // Handle notification test
    socket.on('notification:test', async () => {
      try {
        const notification = await prisma.notification.create({
          data: {
            userId: socket.userId!,
            type: 'TEST',
            title: 'Test Notification',
            content: 'This is a test notification from the WebSocket connection!',
            category: 'INFO',
            priority: 'NORMAL',
            data: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
          },
        });

        // Send via WebSocket
        socket.emit('notification', {
          type: 'notification:new',
          notification,
        });
        
        socket.emit('notification:test:success', notification);
        
      } catch (error) {
        console.error('Error creating test notification:', error);
        socket.emit('notification:test:error', { 
          error: 'Failed to create test notification' 
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.username} disconnected: ${reason}`);
      
      // Remove from draft room if in one
      draftRooms.forEach((room, draftId) => {
        if (room.hasUser(socket.userId!)) {
          room.removeUser(socket.userId!);
          if (room.isEmpty()) {
            console.log(`Cleaning up empty draft room: ${draftId}`);
            draftRooms.delete(draftId);
          }
        }
      });
      
      // Remove from league room
      if (socket.leagueId) {
        const room = leagueRooms.get(socket.leagueId);
        if (room) {
          room.removeUser(socket.userId!);
          if (room.isEmpty()) {
            console.log(`Cleaning up empty league room: ${socket.leagueId}`);
            leagueRooms.delete(socket.leagueId);
          }
        }
      }
      
      // Clean up subscriptions if they exist
      try {
        if (notificationSub && typeof notificationSub.disconnect === 'function') {
          notificationSub.disconnect();
        }
      } catch (error) {
        console.error('Error cleaning up notification subscription:', error);
      }
    });
  });
  
  server.listen(port, () => {
    console.log(`> WebSocket server ready on http://localhost:${port}`);
  });
  
  return { io, server };
}

// Start server if run directly
if (require.main === module) {
  const port = parseInt(process.env.WS_PORT || '3001', 10);
  createWebSocketServer(port);
}