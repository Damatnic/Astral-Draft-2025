'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  ChatBubbleLeftRightIcon, 
  MagnifyingGlassIcon,
  TrophyIcon,
  ExclamationCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { useWebSocket } from '@/providers/WebSocketProvider';

// Cyberpunk color palette removed - was unused

// Helper function to get position color
const getPositionColor = (position: string) => {
  switch (position) {
    case 'QB': return 'bg-red-500';
    case 'RB': return 'bg-green-500';
    case 'WR': return 'bg-blue-500';
    case 'TE': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

export default function ConnectedDraftRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const draftId = params.id as string;
  const { socket, isConnected, joinRoom, leaveRoom, emit, on, off } = useWebSocket();
  
  // Fetch draft data from database
  const { data: draftData, isLoading: draftLoading } = api.draft.getDraft.useQuery(
    { draftId },
    {
      enabled: !!draftId && !!session,
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  );
  
  // Fetch available players
  const { data: availablePlayers, isLoading: playersLoading } = api.player.getAvailable.useQuery(
    { draftId },
    {
      enabled: !!draftId && !!session,
      refetchOnWindowFocus: false,
    }
  );
  
  // Fetch draft picks
  const { data: draftPicks, refetch: refetchPicks } = api.draft.getPicks.useQuery(
    { draftId },
    {
      enabled: !!draftId && !!session,
    }
  );
  
  // Make pick mutation
  const makeDraftPick = api.draft.makePick.useMutation({
    onSuccess: () => {
      refetchPicks();
    },
    onError: (error) => {
      console.error('Failed to make draft pick:', error);
      // Could add toast notification here
    },
  });
  
  // Draft state
  const [currentPick, setCurrentPick] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [draftedPlayers, setDraftedPlayers] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [isPaused, setIsPaused] = useState(false);
  const [draftStarted, setDraftStarted] = useState(false);
  
  // UI state
  const [selectedTab, setSelectedTab] = useState<'board' | 'players' | 'rosters' | 'chat'>('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'rank' | 'adp' | 'name'>('rank');
  const [myQueue, setMyQueue] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    user: string;
    message: string;
    type: 'chat' | 'pick' | 'system' | 'ai-coach';
    timestamp: Date;
    glow?: string;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  
  // Team rosters
  const [teamRosters, setTeamRosters] = useState<Record<string, any[]>>({});
  
  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Join draft room via WebSocket
  useEffect(() => {
    if (isConnected && draftId && session?.user) {
      // Join the draft room
      joinRoom(`draft:${draftId}`);
      
      // Send user info
      emit('draft:join', {
        draftId,
        userId: (session.user as any)?.id,
        username: session.user.name || session.user.email,
      });
      
      // Set up WebSocket event listeners
      on('draft:pick_made', (data) => {
        console.log('Pick made:', data);
        setCurrentPick(data.nextPick);
        setCurrentRound(data.nextRound);
        setDraftedPlayers(prev => new Set(Array.from(prev).concat([data.playerId])));
        refetchPicks();
        
        // Add to chat
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          user: 'Draft Board',
          message: `${data.teamName} selected ${data.playerName} (${data.position})`,
          type: 'pick',
          timestamp: new Date(),
        }]);
      });
      
      on('draft:timer_update', (data) => {
        setTimeRemaining(data.timeRemaining);
      });
      
      on('draft:chat_message', (data) => {
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          user: data.username,
          message: data.message,
          type: 'chat',
          timestamp: new Date(data.timestamp),
        }]);
      });
      
      on('draft:status_update', (data) => {
        setDraftStarted(data.started);
        setIsPaused(data.paused);
      });
      
      return () => {
        console.log('Cleaning up draft room connection');
        leaveRoom(`draft:${draftId}`);
        off('draft:pick_made');
        off('draft:timer_update');
        off('draft:chat_message');
        off('draft:status_update');
      };
    }
    return undefined;
  }, [isConnected, draftId, session, joinRoom, leaveRoom, emit, on, off, refetchPicks]);
  
  // Initialize draft data
  useEffect(() => {
    if (draftData) {
      const teamCount = draftData.league?.teams?.length || 10;
      const currentPickNum = draftData.currentPick || 1;
      setCurrentPick(currentPickNum);
      setCurrentRound(Math.ceil(currentPickNum / teamCount));
      setDraftStarted(draftData.status === 'IN_PROGRESS' || draftData.status === 'ACTIVE');
      
      // Initialize team rosters from draft picks
      if (draftData.league?.teams && draftData.draftPicks) {
        const rosters: Record<string, any[]> = {};
        draftData.league.teams.forEach((team: any) => {
          rosters[team.id] = draftData.draftPicks
            .filter((pick: any) => pick.teamId === team.id)
            .map((pick: any) => pick.player)
            .filter(Boolean);
        });
        setTeamRosters(rosters);
      }
    }
  }, [draftData]);
  
  // Update drafted players from picks
  useEffect(() => {
    if (draftPicks) {
      const drafted = new Set(draftPicks.map((pick: any) => pick.playerId).filter(Boolean) as string[]);
      setDraftedPlayers(drafted);
    }
  }, [draftPicks]);
  
  // Timer countdown
  useEffect(() => {
    if (!draftStarted || isPaused || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 90; // Reset timer
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, isPaused, draftStarted]);
  
  // Make a pick
  const makePick = useCallback(async (player: any) => {
    if (draftedPlayers.has(player.id)) return;
    
    try {
      await makeDraftPick.mutateAsync({
        draftId,
        playerId: player.id,
      });
      
      // Emit WebSocket event
      emit('draft:make_pick', {
        draftId,
        playerId: player.id,
        playerName: player.name,
        position: player.position,
        team: player.team,
      });
      
      // Remove from queue if present
      setMyQueue(prev => prev.filter(p => p.id !== player.id));
      
    } catch (error) {
      console.error('Failed to make pick:', error);
    }
  }, [draftId, currentPick, currentRound, draftedPlayers, makeDraftPick, emit]);
  
  // Filter and sort players
  const filteredPlayers = (availablePlayers || [])
    .filter((p: any) => !draftedPlayers.has(p.id))
    .filter((p: any) => positionFilter === 'ALL' || p.position === positionFilter)
    .filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'rank': return (a.rank || 999) - (b.rank || 999);
        case 'adp': return (a.adp || 999) - (b.adp || 999);
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  
  // Send chat message
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    
    emit('draft:send_chat', {
      draftId,
      message: chatInput,
    });
    
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: 'You',
      message: chatInput,
      type: 'chat',
      timestamp: new Date(),
    }]);
    
    setChatInput('');
    
    // Scroll to bottom
    setTimeout(() => {
      chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
    }, 100);
  };
  
  // Check if it's user's turn (simplified for now)
  const userTeam = draftData?.league?.teams?.find((t: any) => t.userId === (session?.user as any)?.id);
  const isMyTurn = Boolean(userTeam && draftData?.status === 'IN_PROGRESS');
  
  if (draftLoading || playersLoading) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-cyan-400 font-mono">INITIALIZING DRAFT ROOM...</p>
        </div>
      </div>
    );
  }
  
  if (!draftData) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-red-400">Draft not found</p>
          <button
            onClick={() => router.push('/leagues')}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
          >
            Back to Leagues
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrophyIcon className="w-6 h-6 text-yellow-500" />
              {'2024 Fantasy Draft'}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                Round {currentRound} • Pick {currentPick}
              </span>
              <span className="text-sm">
                Overall: {
                  draftData?.draftPicks?.length || 0
                }/{
                  (draftData?.league?.teams?.length || 10) * (draftData?.rounds || 16)
                }
              </span>
            </div>
          </div>
          
          {/* Timer */}
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isMyTurn ? 'bg-green-600' : 'bg-gray-700'
            }`}>
              <ClockIcon className="w-5 h-5" />
              <span className="font-mono text-xl">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
            
            {isMyTurn && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold"
              >
                YOUR PICK!
              </motion.div>
            )}
            
            {/* TODO: Show current team on the clock */}
            
            {/* WebSocket Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
              isConnected ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              } animate-pulse`} />
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Draft Board */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4" />
              Draft Board
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Simplified draft board - show recent picks */}
            <div className="space-y-2">
              <h3 className="text-sm text-gray-400 mb-2">Recent Picks</h3>
              {(draftPicks || []).slice(-10).reverse().map((pick: any) => (
                <div key={pick.id} className="bg-gray-700 rounded p-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold">{pick.player?.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getPositionColor(pick.player?.position)}`}>
                      {pick.player?.position}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Pick {pick.pickNumber} • {pick.team?.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Center Panel - Players */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 p-4 border-b border-gray-700">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Positions</option>
                <option value="QB">QB</option>
                <option value="RB">RB</option>
                <option value="WR">WR</option>
                <option value="TE">TE</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rank">Sort by Rank</option>
                <option value="adp">Sort by ADP</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
          
          {/* Players List */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-800 sticky top-0">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-4 py-2">Rank</th>
                  <th className="px-4 py-2">Player</th>
                  <th className="px-4 py-2">Pos</th>
                  <th className="px-4 py-2">Team</th>
                  <th className="px-4 py-2">Bye</th>
                  <th className="px-4 py-2">ADP</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player: any) => (
                  <motion.tr
                    key={player.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`
                      border-b border-gray-700 hover:bg-gray-700 cursor-pointer transition-colors
                      ${selectedPlayer?.id === player.id ? 'bg-gray-700' : ''}
                    `}
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <td className="px-4 py-3">{player.rank || '-'}</td>
                    <td className="px-4 py-3 font-medium">{player.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getPositionColor(player.position)}`}>
                        {player.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">{player.nflTeam}</td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3">{player.adp?.toFixed(1) || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {isMyTurn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              makePick(player);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm font-medium transition-colors"
                          >
                            Draft
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (myQueue.some(p => p.id === player.id)) {
                              setMyQueue(prev => prev.filter(p => p.id !== player.id));
                            } else {
                              setMyQueue(prev => [...prev, player]);
                            }
                          }}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            myQueue.some(p => p.id === player.id)
                              ? 'bg-red-600 hover:bg-red-500'
                              : 'bg-blue-600 hover:bg-blue-500'
                          }`}
                        >
                          {myQueue.some(p => p.id === player.id) ? 'Remove' : 'Queue'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Right Panel - Chat */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Draft Chat
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatRef}>
            {chatMessages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${
                  msg.type === 'system' ? 'text-center' : ''
                }`}
              >
                {msg.type === 'system' ? (
                  <div className="text-sm text-yellow-500 bg-yellow-900 bg-opacity-20 rounded px-3 py-1 inline-block">
                    {msg.message}
                  </div>
                ) : msg.type === 'pick' ? (
                  <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded p-3">
                    <div className="text-green-400 text-sm font-semibold">Pick Announcement</div>
                    <div className="text-white mt-1">{msg.message}</div>
                  </div>
                ) : msg.type === 'ai-coach' ? (
                  <div className="bg-purple-900 bg-opacity-30 border border-purple-700 rounded p-3"
                    style={{ boxShadow: msg.glow ? `0 0 20px ${msg.glow}` : undefined }}>
                    <div className="text-purple-400 text-sm font-semibold">AI Coach</div>
                    <div className="text-white mt-1">{msg.message}</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">
                      {msg.user} • {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="bg-gray-700 rounded px-3 py-2">
                      {msg.message}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          
          <div className="border-t border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                className="flex-1 px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendChatMessage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}