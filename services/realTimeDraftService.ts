/**
 * Enhanced Real-Time Draft Service
 * Provides comprehensive WebSocket-based draft functionality with participant tracking,
 * live updates, pick notifications, and synchronized state management
 */

import { io, Socket } from 'socket.io-client';
import { DraftPick } from '../types';
import { authService } from './authService';
import { dataPersistenceService } from './dataPersistenceService';

export interface DraftParticipant {
  userId: number;
  username: string;
  pickOrder: number;
  budget?: number;
  roster: DraftPick[];
  isOnline: boolean;
  lastActivity?: string;
}

export interface DraftRoom {
  id: string;
  leagueId: string;
  status: 'pending' | 'active' | 'paused' | 'completed';
  currentPick: {
    round: number;
    pickNumber: number;
    teamId: number;
    timeRemaining: number;
  };
  participants: DraftParticipant[];
  picks: DraftPick[];
  settings: {
    rounds: number;
    timePerPick: number;
    draftType: 'snake' | 'auction';
    pauseOnDisconnect: boolean;
    autoPickEnabled: boolean;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface DraftEvent {
  type: 'pick_made' | 'timer_update' | 'participant_joined' | 'participant_left' | 'draft_paused' | 'draft_resumed' | 'chat_message';
  data: any;
  timestamp: string;
  userId?: number;
}

export interface DraftPickRequest {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
}

export interface ChatMessage {
  id: string;
  userId: number;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'pick_announcement';
}

class RealTimeDraftService {
  private socket: Socket | null = null;
  private currentDraftRoom: DraftRoom | null = null;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 3;
  private readonly listeners: Map<string, Function[]> = new Map();
  private isConnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.setupEventHandlers();
  }

  /**
   * Initialize connection to draft server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    const sessionToken = authService.getSessionToken();
    if (!sessionToken) {
      throw new Error('User not authenticated');
    }

    this.isConnecting = true;

    try {
      const serverUrl = (import.meta as any).env?.VITE_WEBSOCKET_URL || 'ws://localhost:3001';
      
      this.socket = io(serverUrl, {
        auth: {
          token: sessionToken
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        retries: 3
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          this.connectionAttempts = 0;
          this.isConnecting = false;
          console.log('✅ Connected to draft server');
          this.emit('connection_established');
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.error('❌ Draft server connection failed:', error);
          reject(new Error(error instanceof Error ? error.message : 'Connection failed'));
        });
      });

      this.setupSocketEventHandlers();
    } catch (error) {
      this.isConnecting = false;
      this.connectionAttempts++;
      
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`Retrying connection (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
        this.reconnectTimeout = setTimeout(() => this.connect(), 2000 * this.connectionAttempts);
      } else {
        console.error('Max connection attempts reached');
        throw error;
      }
    }
  }

  /**
   * Disconnect from draft server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentDraftRoom = null;
    this.connectionAttempts = 0;
    this.isConnecting = false;
    this.emit('connection_lost');
  }

  /**
   * Join a draft room
   */
  async joinDraftRoom(draftRoomId: string): Promise<DraftRoom> {
    if (!this.socket?.connected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join room timeout'));
      }, 5000);

      this.socket!.emit('join_draft_room', { draftRoomId }, (response: any) => {
        clearTimeout(timeout);
        
        if (response.success) {
          this.currentDraftRoom = response.room;
          this.emit('room_joined', response.room);
          resolve(response.room);
        } else {
          reject(new Error(response.error || 'Failed to join draft room'));
        }
      });
    });
  }

  /**
   * Leave current draft room
   */
  async leaveDraftRoom(): Promise<void> {
    if (!this.socket?.connected || !this.currentDraftRoom) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Leave room timeout'));
      }, 3000);

      if (!this.currentDraftRoom) {
        return reject(new Error('Not in a draft room.'));
      }
      this.socket?.emit('leave_draft_room', { draftRoomId: this.currentDraftRoom.id }, (response: any) => {
        clearTimeout(timeout);
        
        if (response.success) {
          this.currentDraftRoom = null;
          this.emit('room_left');
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to leave draft room'));
        }
      });
    });
  }

  /**
   * Make a draft pick
   */
  async makePick(pickRequest: DraftPickRequest): Promise<void> {
    if (!this.socket?.connected || !this.currentDraftRoom) {
      throw new Error('Not connected to draft room');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Pick timeout'));
      }, 5000);

      if (!this.currentDraftRoom) {
        return reject(new Error('Not in a draft room.'));
      }
      this.socket?.emit('make_pick', {
        draftRoomId: this.currentDraftRoom.id,
        pick: pickRequest
      }, (response: any) => {
        clearTimeout(timeout);
        
        if (response.success) {
          // Save pick to local storage
          this.saveDraftPickLocally(response.pick);
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to make pick'));
        }
      });
    });
  }

  /**
   * Set auto-pick preferences
   */
  async setAutoPick(enabled: boolean, playerQueue: string[] = []): Promise<void> {
    if (!this.socket?.connected || !this.currentDraftRoom) {
      throw new Error('Not connected to draft room');
    }

    return new Promise((resolve, reject) => {
      if (!this.currentDraftRoom) {
        return reject(new Error('Not in a draft room.'));
      }
      this.socket?.emit('set_auto_pick', {
        draftRoomId: this.currentDraftRoom.id,
        enabled,
        playerQueue
      }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to set auto pick'));
        }
      });
    });
  }

  /**
   * Send chat message
   */
  async sendChatMessage(message: string): Promise<void> {
    if (!this.socket?.connected || !this.currentDraftRoom) {
      throw new Error('Not connected to draft room');
    }

    if (!this.currentDraftRoom) {
      throw new Error('Not in a draft room.');
    }
    this.socket.emit('chat_message', {
      draftRoomId: this.currentDraftRoom.id,
      message
    });
  }

  /**
   * Pause/Resume draft (commissioners only)
   */
  async pauseDraft(paused: boolean): Promise<void> {
    if (!this.socket?.connected || !this.currentDraftRoom) {
      throw new Error('Not connected to draft room');
    }

    return new Promise((resolve, reject) => {
      if (!this.currentDraftRoom) {
        return reject(new Error('Not in a draft room.'));
      }
      this.socket?.emit('pause_draft', {
        draftRoomId: this.currentDraftRoom.id,
        paused
      }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to pause/resume draft'));
        }
      });
    });
  }

  /**
   * Get current draft room state
   */
  getCurrentDraftRoom(): DraftRoom | null {
    return this.currentDraftRoom;
  }

  /**
   * Check if connected to a draft room
   */
  isInDraftRoom(): boolean {
    return this.currentDraftRoom !== null && this.socket?.connected === true;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.socket?.connected) return 'connected';
    if (this.isConnecting) return 'connecting';
    return 'disconnected';
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Draft events
    this.socket.on('draft_event', (event: DraftEvent) => {
      this.handleDraftEvent(event);
    });

    // Pick made
    this.socket.on('pick_made', (data: { pick: DraftPick; room: DraftRoom }) => {
      this.currentDraftRoom = data.room;
      this.saveDraftPickLocally(data.pick);
      this.emit('pick_made', data);
    });

    // Timer updates
    this.socket.on('timer_update', (data: { timeRemaining: number }) => {
      if (this.currentDraftRoom) {
        this.currentDraftRoom.currentPick.timeRemaining = data.timeRemaining;
        this.emit('timer_update', data);
      }
    });

    // Participant updates
    this.socket.on('participant_update', (data: { participants: DraftParticipant[] }) => {
      if (this.currentDraftRoom) {
        this.currentDraftRoom.participants = data.participants;
        this.emit('participants_updated', data);
      }
    });

    // Chat messages
    this.socket.on('chat_message', (message: ChatMessage) => {
      this.emit('chat_message', message);
    });

    // Draft status changes
    this.socket.on('draft_status_changed', (data: { status: DraftRoom['status']; room: DraftRoom }) => {
      this.currentDraftRoom = data.room;
      this.emit('draft_status_changed', data);
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('Draft socket error:', error);
      this.emit('error', error);
    });

    // Disconnection handling
    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from draft server:', reason);
      this.emit('disconnected', { reason });
      
      // Attempt to reconnect if not intentional
      if (reason === 'io server disconnect') {
        setTimeout(() => this.connect(), 2000);
      }
    });
  }

  /**
   * Handle incoming draft events
   */
  private handleDraftEvent(event: DraftEvent): void {
    console.log('Draft event received:', event);
    
    switch (event.type) {
      case 'pick_made':
        this.saveDraftPickLocally(event.data.pick);
        break;
      case 'draft_paused':
      case 'draft_resumed':
        if (this.currentDraftRoom) {
          this.currentDraftRoom.status = event.data.status;
        }
        break;
    }

    this.emit('draft_event', event);
  }

  /**
   * Save draft pick to local storage
   */
  private async saveDraftPickLocally(pick: DraftPick): Promise<void> {
    try {
      const service = await dataPersistenceService;
      
      // Save individual pick analytics data
      const analyticsData = {
        id: `pick_${pick.playerId}_${Date.now()}`,
        userId: authService.getCurrentUser()?.id || 0,
        type: 'draft_performance' as const,
        data: {
          pick,
          draftRoomId: this.currentDraftRoom?.id,
          timestamp: new Date().toISOString()
        },
        season: 2024,
        createdAt: new Date().toISOString()
      };

      await service.saveAnalyticsData(analyticsData);
      console.log('✅ Draft pick saved locally:', pick);
    } catch (error) {
      console.error('Failed to save draft pick locally:', error);
    }
  }

  /**
   * Setup general event handlers
   */
  private setupEventHandlers(): void {
    // Handle browser visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.currentDraftRoom && !this.socket?.connected) {
        console.log('Tab became visible, reconnecting to draft...');
        this.connect();
      }
    });

    // Handle before unload
    window.addEventListener('beforeunload', () => {
      if (this.currentDraftRoom) {
        this.leaveDraftRoom();
      }
    });
  }

  /**
   * Event emitter functionality
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.push(callback);
    }
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    this.listeners.clear();
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.setupEventHandlers);
    window.removeEventListener('beforeunload', this.setupEventHandlers);
  }
}

export const realTimeDraftService = new RealTimeDraftService();
export default realTimeDraftService;
