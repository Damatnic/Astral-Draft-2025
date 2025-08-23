/**
 * Real-time Draft WebSocket Service
 * Manages live draft room connections, pick updates, and timer synchronization
 */

export interface DraftPickMessage {
  type: 'PICK_MADE';
  data: {
    leagueId: string;
    teamId: number;
    playerId: number;
    pickNumber: number;
    timestamp: number;
    timeRemaining?: number;
  };
}

export interface DraftTimerMessage {
  type: 'TIMER_UPDATE';
  data: {
    leagueId: string;
    timeRemaining: number;
    currentPicker: number;
    pickNumber: number;
    isPaused: boolean;
  };
}

export interface DraftStatusMessage {
  type: 'DRAFT_STATUS';
  data: {
    leagueId: string;
    status: 'WAITING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    currentRound: number;
    currentPick: number;
    participants: {
      teamId: number;
      userId: string;
      isOnline: boolean;
      lastSeen: number;
    }[];
  };
}

export interface UserJoinMessage {
  type: 'USER_JOINED';
  data: {
    leagueId: string;
    userId: string;
    teamId: number;
    timestamp: number;
  };
}

export interface UserLeaveMessage {
  type: 'USER_LEFT';
  data: {
    leagueId: string;
    userId: string;
    teamId: number;
    timestamp: number;
  };
}

export interface DraftChatMessage {
  type: 'CHAT_MESSAGE';
  data: {
    leagueId: string;
    userId: string;
    message: string;
    timestamp: number;
    isTradeProposal?: boolean;
  };
}

export type DraftWebSocketMessage = 
  | DraftPickMessage 
  | DraftTimerMessage 
  | DraftStatusMessage 
  | UserJoinMessage 
  | UserLeaveMessage 
  | DraftChatMessage;

export interface DraftRoomState {
  leagueId: string;
  status: 'WAITING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  currentRound: number;
  currentPick: number;
  currentPicker: number;
  timePerPick: number;
  timeRemaining: number;
  isPaused: boolean;
  participants: Map<string, {
    teamId: number;
    userId: string;
    isOnline: boolean;
    lastSeen: number;
  }>;
  picks: Array<{
    teamId: number;
    playerId: number;
    pickNumber: number;
    timestamp: number;
  }>;
  chatMessages: Array<{
    userId: string;
    message: string;
    timestamp: number;
    isTradeProposal?: boolean;
  }>;
}

class DraftWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  
  private readonly listeners: Map<string, ((message: DraftWebSocketMessage) => void)[]> = new Map();
  private roomState: DraftRoomState | null = null;
  
  constructor() {
    this.setupEventListeners();
  }

  /**
   * Connect to draft room WebSocket
   */
  async connectToDraftRoom(leagueId: string, userId: string): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      const wsUrl = this.getWebSocketUrl(leagueId, userId);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      
    } catch (error) {
      console.error('Failed to connect to draft room:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Disconnect from draft room
   */
  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.roomState = null;
  }

  /**
   * Send draft pick
   */
  sendPick(leagueId: string, teamId: number, playerId: number): void {
    if (!this.isConnected()) {
      throw new Error('Not connected to draft room');
    }

    const message: DraftPickMessage = {
      type: 'PICK_MADE',
      data: {
        leagueId,
        teamId,
        playerId,
        pickNumber: this.roomState?.currentPick || 1,
        timestamp: Date.now()
      }
    };

    this.send(message);
  }

  /**
   * Send chat message
   */
  sendChatMessage(leagueId: string, userId: string, message: string, isTradeProposal = false): void {
    if (!this.isConnected()) {
      throw new Error('Not connected to draft room');
    }

    const chatMessage: DraftChatMessage = {
      type: 'CHAT_MESSAGE',
      data: {
        leagueId,
        userId,
        message,
        timestamp: Date.now(),
        isTradeProposal
      }
    };

    this.send(chatMessage);
  }

  /**
   * Pause/resume draft timer
   */
  toggleTimer(leagueId: string): void {
    if (!this.isConnected()) {
      throw new Error('Not connected to draft room');
    }

    this.send({
      type: 'TIMER_UPDATE',
      data: {
        leagueId,
        timeRemaining: this.roomState?.timeRemaining || 0,
        currentPicker: this.roomState?.currentPicker || 1,
        pickNumber: this.roomState?.currentPick || 1,
        isPaused: !this.roomState?.isPaused
      }
    });
  }

  /**
   * Add event listener for specific message types
   */
  addEventListener(eventType: DraftWebSocketMessage['type'], callback: (message: DraftWebSocketMessage) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.push(callback);
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: DraftWebSocketMessage['type'], callback: (message: DraftWebSocketMessage) => void): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Get current room state
   */
  getRoomState(): DraftRoomState | null {
    return this.roomState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get WebSocket connection status
   */
  getConnectionStatus(): 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR' {
    if (this.isConnecting) return 'CONNECTING';
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'CONNECTED';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED: return 'DISCONNECTED';
      default: return 'ERROR';
    }
  }

  private getWebSocketUrl(leagueId: string, userId: string): string {
    const host = process.env.NODE_ENV === 'production' 
      ? 'wss://your-websocket-server.netlify.app'
      : 'ws://localhost:3001';
    
    return `${host}/draft-room?leagueId=${leagueId}&userId=${userId}`;
  }

  private setupEventListeners(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.ws && this.ws.readyState === WebSocket.CLOSED) {
        this.attemptReconnect();
      }
    });

    // Handle beforeunload
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  private handleOpen(event: Event): void {
    console.log('Connected to draft room WebSocket');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    
    // Notify listeners of connection
    this.emit({
      type: 'DRAFT_STATUS',
      data: {
        leagueId: '',
        status: 'WAITING',
        currentRound: 1,
        currentPick: 1,
        participants: []
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: DraftWebSocketMessage = JSON.parse(event.data);
      this.processMessage(message);
      this.emit(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('Draft room WebSocket closed:', event.code, event.reason);
    this.isConnecting = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Attempt reconnection if not intentionally closed
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('Draft room WebSocket error:', event);
    this.isConnecting = false;
  }

  private processMessage(message: DraftWebSocketMessage): void {
    switch (message.type) {
      case 'DRAFT_STATUS':
        this.updateRoomState(message.data);
        break;
      case 'PICK_MADE':
        this.handlePickMade(message.data);
        break;
      case 'TIMER_UPDATE':
        this.handleTimerUpdate(message.data);
        break;
      case 'USER_JOINED':
        this.handleUserJoined(message.data);
        break;
      case 'USER_LEFT':
        this.handleUserLeft(message.data);
        break;
      case 'CHAT_MESSAGE':
        this.handleChatMessage(message.data);
        break;
    }
  }

  private updateRoomState(data: DraftStatusMessage['data']): void {
    if (!this.roomState) {
      this.roomState = {
        leagueId: data.leagueId,
        status: data.status,
        currentRound: data.currentRound,
        currentPick: data.currentPick,
        currentPicker: 1,
        timePerPick: 120, // 2 minutes default
        timeRemaining: 120,
        isPaused: false,
        participants: new Map(),
        picks: [],
        chatMessages: []
      };
    } else {
      this.roomState.status = data.status;
      this.roomState.currentRound = data.currentRound;
      this.roomState.currentPick = data.currentPick;
    }

    // Update participants
    data.participants.forEach(participant => {
      if (this.roomState) {
        this.roomState.participants.set(participant.userId, participant);
      }
    });
  }

  private handlePickMade(data: DraftPickMessage['data']): void {
    if (this.roomState) {
      this.roomState.picks.push({
        teamId: data.teamId,
        playerId: data.playerId,
        pickNumber: data.pickNumber,
        timestamp: data.timestamp
      });
      
      // Advance to next pick
      this.roomState.currentPick++;
      this.roomState.timeRemaining = this.roomState.timePerPick;
    }
  }

  private handleTimerUpdate(data: DraftTimerMessage['data']): void {
    if (this.roomState) {
      this.roomState.timeRemaining = data.timeRemaining;
      this.roomState.currentPicker = data.currentPicker;
      this.roomState.currentPick = data.pickNumber;
      this.roomState.isPaused = data.isPaused;
    }
  }

  private handleUserJoined(data: UserJoinMessage['data']): void {
    if (this.roomState) {
      this.roomState.participants.set(data.userId, {
        teamId: data.teamId,
        userId: data.userId,
        isOnline: true,
        lastSeen: data.timestamp
      });
    }
  }

  private handleUserLeft(data: UserLeaveMessage['data']): void {
    if (this.roomState) {
      const participant = this.roomState.participants.get(data.userId);
      if (participant) {
        participant.isOnline = false;
        participant.lastSeen = data.timestamp;
      }
    }
  }

  private handleChatMessage(data: DraftChatMessage['data']): void {
    if (this.roomState) {
      this.roomState.chatMessages.push({
        userId: data.userId,
        message: data.message,
        timestamp: data.timestamp,
        isTradeProposal: data.isTradeProposal
      });
      
      // Keep only last 100 messages
      if (this.roomState.chatMessages.length > 100) {
        this.roomState.chatMessages.shift();
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.roomState) {
        this.connectToDraftRoom(this.roomState.leagueId, '').catch(console.error);
      }
    }, delay);
  }

  private send(message: DraftWebSocketMessage | { type: string }): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  private emit(message: DraftWebSocketMessage): void {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }
}

// Export singleton instance
export const draftWebSocketService = new DraftWebSocketService();
export default draftWebSocketService;
