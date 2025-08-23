import { useState, useEffect, useCallback, useRef } from 'react';
import { draftWebSocketService, DraftWebSocketMessage, DraftRoomState } from '../services/draftWebSocketService';

export interface UseDraftRoomOptions {
  leagueId: string;
  userId: string;
  teamId: number;
  autoConnect?: boolean;
}

export interface DraftRoomHookReturn {
  // Connection state
  isConnected: boolean;
  connectionStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  
  // Room state
  roomState: DraftRoomState | null;
  participants: Array<{
    teamId: number;
    userId: string;
    isOnline: boolean;
    lastSeen: number;
  }>;
  
  // Draft state
  currentPick: number;
  currentRound: number;
  currentPicker: number;
  timeRemaining: number;
  isPaused: boolean;
  isMyTurn: boolean;
  
  // Picks and chat
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
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  makePick: (playerId: number) => void;
  sendChatMessage: (message: string, isTradeProposal?: boolean) => void;
  toggleTimer: () => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for managing real-time draft room functionality
 */
export function useDraftRoom(options: UseDraftRoomOptions): DraftRoomHookReturn {
  const { leagueId, userId, teamId, autoConnect = true } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('DISCONNECTED');
  const [roomState, setRoomState] = useState<DraftRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messageHandlersRef = useRef<Map<string, (message: DraftWebSocketMessage) => void>>(new Map());
  const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Connection management
  const connect = useCallback(async () => {
    try {
      setError(null);
      setConnectionStatus('CONNECTING');
      await draftWebSocketService.connectToDraftRoom(leagueId, userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to draft room';
      setError(errorMessage);
      setConnectionStatus('ERROR');
      console.error('Draft room connection error:', err);
    }
  }, [leagueId, userId]);

  const disconnect = useCallback(() => {
    draftWebSocketService.disconnect();
    setConnectionStatus('DISCONNECTED');
    setIsConnected(false);
    setRoomState(null);
  }, []);

  // Draft actions
  const makePick = useCallback((playerId: number) => {
    try {
      if (!isConnected) {
        throw new Error('Not connected to draft room');
      }
      
      if (!roomState || roomState.currentPicker !== teamId) {
        throw new Error('It is not your turn to pick');
      }
      
      draftWebSocketService.sendPick(leagueId, teamId, playerId);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to make pick';
      setError(errorMessage);
    }
  }, [isConnected, roomState, teamId, leagueId]);

  const sendChatMessage = useCallback((message: string, isTradeProposal = false) => {
    try {
      if (!isConnected) {
        throw new Error('Not connected to draft room');
      }
      
      draftWebSocketService.sendChatMessage(leagueId, userId, message, isTradeProposal);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    }
  }, [isConnected, leagueId, userId]);

  const toggleTimer = useCallback(() => {
    try {
      if (!isConnected) {
        throw new Error('Not connected to draft room');
      }
      
      draftWebSocketService.toggleTimer(leagueId);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle timer';
      setError(errorMessage);
    }
  }, [isConnected, leagueId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Setup message handlers
  useEffect(() => {
    const handlers = new Map<string, (message: DraftWebSocketMessage) => void>();

    // Draft status handler
    handlers.set('DRAFT_STATUS', (message) => {
      if (message.type === 'DRAFT_STATUS') {
        setRoomState(draftWebSocketService.getRoomState());
        setConnectionStatus('CONNECTED');
        setIsConnected(true);
      }
    });

    // Pick made handler
    handlers.set('PICK_MADE', (message) => {
      if (message.type === 'PICK_MADE') {
        setRoomState(draftWebSocketService.getRoomState());
        
        // Play notification sound for picks
        if ('serviceWorker' in navigator && 'showNotification' in window) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Draft Pick Made', {
              body: `Team ${message.data.teamId} selected a player`,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              tag: 'draft-pick'
            });
          });
        }
      }
    });

    // Timer update handler
    handlers.set('TIMER_UPDATE', (message) => {
      if (message.type === 'TIMER_UPDATE') {
        setRoomState(draftWebSocketService.getRoomState());
        
        // Show notification when time is running low
        if (message.data.timeRemaining <= 30 && message.data.currentPicker === teamId) {
          if ('serviceWorker' in navigator && 'showNotification' in window) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification('Your Pick Time is Running Out!', {
                body: `${message.data.timeRemaining} seconds remaining`,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                tag: 'draft-timer-warning',
                requireInteraction: true
              });
            });
          }
        }
      }
    });

    // User joined/left handlers
    handlers.set('USER_JOINED', () => {
      setRoomState(draftWebSocketService.getRoomState());
    });

    handlers.set('USER_LEFT', () => {
      setRoomState(draftWebSocketService.getRoomState());
    });

    // Chat message handler
    handlers.set('CHAT_MESSAGE', (message) => {
      if (message.type === 'CHAT_MESSAGE') {
        setRoomState(draftWebSocketService.getRoomState());
        
        // Show notification for trade proposals
        if (message.data.isTradeProposal && message.data.userId !== userId) {
          if ('serviceWorker' in navigator && 'showNotification' in window) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification('Trade Proposal Received', {
                body: message.data.message,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                tag: 'trade-proposal'
              });
            });
          }
        }
      }
    });

    // Register all handlers
    handlers.forEach((handler, eventType) => {
      draftWebSocketService.addEventListener(eventType as DraftWebSocketMessage['type'], handler);
    });

    messageHandlersRef.current = handlers;

    return () => {
      // Cleanup handlers
      handlers.forEach((handler, eventType) => {
        draftWebSocketService.removeEventListener(eventType as DraftWebSocketMessage['type'], handler);
      });
    };
  }, [teamId, userId]);

  // Auto-connect and connection monitoring
  useEffect(() => {
    if (autoConnect && leagueId && userId) {
      connect();
    }

    // Monitor connection status
    connectionCheckInterval.current = setInterval(() => {
      const status = draftWebSocketService.getConnectionStatus();
      setConnectionStatus(status);
      setIsConnected(status === 'CONNECTED');
    }, 1000);

    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
      }
    };
  }, [autoConnect, leagueId, userId, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Derived state
  const participants = roomState ? Array.from(roomState.participants.values()) : [];
  const currentPick = roomState?.currentPick || 1;
  const currentRound = roomState?.currentRound || 1;
  const currentPicker = roomState?.currentPicker || 1;
  const timeRemaining = roomState?.timeRemaining || 0;
  const isPaused = roomState?.isPaused || false;
  const isMyTurn = roomState?.currentPicker === teamId;
  const picks = roomState?.picks || [];
  const chatMessages = roomState?.chatMessages || [];

  return {
    // Connection state
    isConnected,
    connectionStatus,
    
    // Room state
    roomState,
    participants,
    
    // Draft state
    currentPick,
    currentRound,
    currentPicker,
    timeRemaining,
    isPaused,
    isMyTurn,
    
    // Picks and chat
    picks,
    chatMessages,
    
    // Actions
    connect,
    disconnect,
    makePick,
    sendChatMessage,
    toggleTimer,
    
    // Error handling
    error,
    clearError
  };
}

export default useDraftRoom;
