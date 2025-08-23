import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { trpc } from '../lib/api';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface DraftState {
  id: string;
  status: string;
  type: string;
  currentRound: number;
  currentPick: number;
  currentTeamId?: string;
  currentTeam?: { id: string; name: string };
  myTeamId?: string;
  currentUserId?: string;
  draftOrder: string[];
  picks: any[];
  teams: any[];
  timePerPick: number;
  rounds: number;
  autoPickEnabled?: boolean;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  teamName?: string;
  content: string;
  type: 'chat' | 'system' | 'pick' | 'trade';
  timestamp: Date;
}

interface QueuedPlayer {
  id: string;
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  rank: number;
  adp: number;
}

interface UseDraftRoomReturn {
  draftState: DraftState | null;
  isConnected: boolean;
  isMyTurn: boolean;
  timeRemaining: number;
  makePick: (playerId: string) => Promise<void>;
  addToQueue: (playerId: string) => Promise<void>;
  removeFromQueue: (playerId: string) => void;
  sendMessage: (content: string) => void;
  toggleAutoPick: () => void;
  queue: QueuedPlayer[];
  messages: Message[];
  rosters: any[];
}

export function useDraftRoom(draftId: string): UseDraftRoomReturn {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [queue, setQueue] = useState<QueuedPlayer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rosters, setRosters] = useState<any[]>([]);

  // Get initial draft data
  const { data: initialDraft } = trpc.draft.getDraft.useQuery(
    { draftId },
    { enabled: !!draftId }
  );

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!session?.user || !draftId) return;

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      auth: {
        token: (session.user as any).id,
        draftId,
      },
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to draft room');
      setIsConnected(true);
      socket.emit('draft:join', { draftId });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from draft room');
      setIsConnected(false);
    });

    // Draft events
    socket.on('draft:state', (state: DraftState) => {
      setDraftState(state);
      setTimeRemaining(state.timePerPick);
    });

    socket.on('draft:started', (data) => {
      toast.success('Draft has started!');
      setDraftState((prev) => prev ? { ...prev, status: 'IN_PROGRESS' } : null);
    });

    socket.on('draft:on_clock', (data) => {
      setTimeRemaining(data.timeLimit);
      setDraftState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentTeamId: data.teamId,
          currentRound: data.round,
          currentPick: data.pick,
        };
      });

      if (data.teamId === (session.user as any).teamId) {
        toast.info("You're on the clock!");
        // Play notification sound
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(() => {});
      }
    });

    socket.on('draft:pick_made', (data) => {
      setDraftState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          picks: [...prev.picks, data.pick],
        };
      });

      // Add system message
      const pickMessage: Message = {
        id: `pick-${Date.now()}`,
        userId: 'system',
        username: 'System',
        content: `${data.pick.teamName} selected ${data.pick.playerName} (${data.pick.position})`,
        type: 'pick',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, pickMessage]);

      if (data.pick.isAutopick) {
        toast.info(`${data.pick.teamName} auto-picked ${data.pick.playerName}`);
      }
    });

    socket.on('draft:completed', () => {
      toast.success('Draft completed!');
      setDraftState((prev) => prev ? { ...prev, status: 'COMPLETED' } : null);
    });

    // Chat events
    socket.on('chat:message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // User events
    socket.on('user:joined', (data) => {
      const joinMessage: Message = {
        id: `join-${Date.now()}`,
        userId: 'system',
        username: 'System',
        content: `${data.username} joined the draft`,
        type: 'system',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, joinMessage]);
    });

    socket.on('user:left', (data) => {
      const leaveMessage: Message = {
        id: `leave-${Date.now()}`,
        userId: 'system',
        username: 'System',
        content: `${data.username} left the draft`,
        type: 'system',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, leaveMessage]);
    });

    // Roster updates
    socket.on('roster:updated', (data) => {
      setRosters(data.rosters);
    });

    // Error handling
    socket.on('error', (error) => {
      toast.error(error.message || 'An error occurred');
    });

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up WebSocket connection');
        socketRef.current.off(); // Remove all event listeners
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [session, draftId]);

  // Load queue from localStorage
  useEffect(() => {
    const savedQueue = localStorage.getItem(`draft-queue-${draftId}`);
    if (savedQueue) {
      setQueue(JSON.parse(savedQueue));
    }
  }, [draftId]);

  // Save queue to localStorage
  useEffect(() => {
    if (queue.length > 0) {
      localStorage.setItem(`draft-queue-${draftId}`, JSON.stringify(queue));
    }
  }, [queue, draftId]);

  const makePick = useCallback(async (playerId: string) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('draft:make_pick', { playerId });
    
    // Remove from queue if exists
    setQueue((prev) => prev.filter((p) => p.playerId !== playerId));
  }, []);

  const addToQueue = useCallback(async (playerId: string) => {
    try {
      // For now, create a basic queue item without fetching full player details
      // This would typically be handled by the component calling this hook
      const queueItem: QueuedPlayer = {
        id: `queue-${Date.now()}`,
        playerId: playerId,
        playerName: 'Player Name', // Would be passed as parameter or fetched separately
        position: 'Unknown',
        team: 'Unknown',
        rank: 0,
        adp: 0,
      };
      
      setQueue((prev) => {
        if (prev.some((p) => p.playerId === playerId)) {
          toast.error('Player already in queue');
          return prev;
        }
        toast.success(`Added player to queue`);
        return [...prev, queueItem];
      });
    } catch (error) {
      console.error('Failed to add player to queue:', error);
      toast.error('Failed to add player to queue');
    }
  }, []);

  const removeFromQueue = useCallback((playerId: string) => {
    setQueue((prev) => prev.filter((p) => p.playerId !== playerId));
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!socketRef.current || !session?.user) return;
    
    const message: Message = {
      id: `msg-${Date.now()}`,
      userId: (session.user as any).id,
      username: session.user.name || 'Unknown',
      teamName: draftState?.teams.find(t => t.ownerId === (session.user as any).id)?.name,
      content,
      type: 'chat',
      timestamp: new Date(),
    };
    
    socketRef.current.emit('chat:send', message);
    setMessages((prev) => [...prev, message]);
  }, [session, draftState]);

  const toggleAutoPick = useCallback(() => {
    if (!socketRef.current) return;
    
    const newState = !draftState?.autoPickEnabled;
    socketRef.current.emit('draft:toggle_autopick', { enabled: newState });
    
    setDraftState((prev) => prev ? { ...prev, autoPickEnabled: newState } : null);
    toast.success(`Auto-pick ${newState ? 'enabled' : 'disabled'}`);
  }, [draftState]);

  const isMyTurn = draftState?.currentTeamId === (session?.user as any)?.teamId;

  return {
    draftState,
    isConnected,
    isMyTurn,
    timeRemaining,
    makePick,
    addToQueue,
    removeFromQueue,
    sendMessage,
    toggleAutoPick,
    queue,
    messages,
    rosters,
  };
}