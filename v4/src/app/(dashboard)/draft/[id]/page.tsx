'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Search,
  Filter,
  ChevronDown,
  Trophy,
  Star,
  AlertCircle,
  Zap,
  Target,
  Brain,
  BarChart3
} from 'lucide-react';

// Mock NFL Players Data
const NFL_PLAYERS = [
  // Quarterbacks
  { id: 'pm15', name: 'Patrick Mahomes', position: 'QB', team: 'KC', rank: 1, adp: 2.3, bye: 6, posRank: 'QB1', points2023: 417.2 },
  { id: 'ja17', name: 'Josh Allen', position: 'QB', team: 'BUF', rank: 3, adp: 3.8, bye: 13, posRank: 'QB2', points2023: 389.8 },
  { id: 'jh1', name: 'Jalen Hurts', position: 'QB', team: 'PHI', rank: 5, adp: 4.2, bye: 10, posRank: 'QB3', points2023: 394.5 },
  { id: 'jb9', name: 'Joe Burrow', position: 'QB', team: 'CIN', rank: 8, adp: 6.7, bye: 12, posRank: 'QB4', points2023: 347.9 },
  { id: 'lj8', name: 'Lamar Jackson', position: 'QB', team: 'BAL', rank: 11, adp: 8.4, bye: 14, posRank: 'QB5', points2023: 366.2 },
  { id: 'dw4', name: 'Dak Prescott', position: 'QB', team: 'DAL', rank: 18, adp: 12.3, bye: 7, posRank: 'QB6', points2023: 328.4 },
  { id: 'th16', name: 'Tua Tagovailoa', position: 'QB', team: 'MIA', rank: 24, adp: 16.8, bye: 10, posRank: 'QB7', points2023: 301.7 },
  { id: 'js11', name: 'Justin Herbert', position: 'QB', team: 'LAC', rank: 28, adp: 19.2, bye: 8, posRank: 'QB8', points2023: 295.4 },
  
  // Running Backs
  { id: 'cm22', name: 'Christian McCaffrey', position: 'RB', team: 'SF', rank: 2, adp: 1.1, bye: 9, posRank: 'RB1', points2023: 392.8 },
  { id: 'ae30', name: 'Austin Ekeler', position: 'RB', team: 'LAC', rank: 4, adp: 3.5, bye: 8, posRank: 'RB2', points2023: 298.7 },
  { id: 'sb26', name: 'Saquon Barkley', position: 'RB', team: 'NYG', rank: 6, adp: 5.2, bye: 13, posRank: 'RB3', points2023: 276.4 },
  { id: 'jt28', name: 'Jonathan Taylor', position: 'RB', team: 'IND', rank: 7, adp: 5.8, bye: 11, posRank: 'RB4', points2023: 251.2 },
  { id: 'dh22', name: 'Derrick Henry', position: 'RB', team: 'TEN', rank: 12, adp: 8.9, bye: 7, posRank: 'RB5', points2023: 247.8 },
  { id: 'nc4', name: 'Nick Chubb', position: 'RB', team: 'CLE', rank: 14, adp: 10.1, bye: 9, posRank: 'RB6', points2023: 239.5 },
  { id: 'tp12', name: 'Tony Pollard', position: 'RB', team: 'DAL', rank: 16, adp: 11.4, bye: 7, posRank: 'RB7', points2023: 218.9 },
  { id: 'bp24', name: 'Bijan Robinson', position: 'RB', team: 'ATL', rank: 9, adp: 7.2, bye: 11, posRank: 'RB8', points2023: 267.3 },
  { id: 'jj12', name: 'Josh Jacobs', position: 'RB', team: 'LV', rank: 17, adp: 12.1, bye: 13, posRank: 'RB9', points2023: 222.6 },
  { id: 'aj41', name: 'Alvin Kamara', position: 'RB', team: 'NO', rank: 23, adp: 15.7, bye: 11, posRank: 'RB10', points2023: 197.4 },
  
  // Wide Receivers
  { id: 'jj18', name: 'Justin Jefferson', position: 'WR', team: 'MIN', rank: 10, adp: 7.8, bye: 13, posRank: 'WR1', points2023: 347.9 },
  { id: 'jc1', name: "Ja'Marr Chase", position: 'WR', team: 'CIN', rank: 13, adp: 9.4, bye: 12, posRank: 'WR2', points2023: 312.4 },
  { id: 'th10', name: 'Tyreek Hill', position: 'WR', team: 'MIA', rank: 15, adp: 10.8, bye: 10, posRank: 'WR3', points2023: 298.7 },
  { id: 'sd14', name: 'Stefon Diggs', position: 'WR', team: 'BUF', rank: 19, adp: 13.2, bye: 13, posRank: 'WR4', points2023: 276.3 },
  { id: 'da17', name: 'Davante Adams', position: 'WR', team: 'LV', rank: 20, adp: 13.8, bye: 13, posRank: 'WR5', points2023: 268.9 },
  { id: 'cl17', name: 'Cooper Kupp', position: 'WR', team: 'LAR', rank: 21, adp: 14.5, bye: 10, posRank: 'WR6', points2023: 254.2 },
  { id: 'cm11', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', rank: 22, adp: 15.2, bye: 7, posRank: 'WR7', points2023: 247.8 },
  { id: 'ab11', name: 'A.J. Brown', position: 'WR', team: 'PHI', rank: 25, adp: 17.4, bye: 10, posRank: 'WR8', points2023: 236.5 },
  { id: 'gs9', name: 'Garrett Wilson', position: 'WR', team: 'NYJ', rank: 26, adp: 18.1, bye: 7, posRank: 'WR9', points2023: 218.3 },
  { id: 'cs7', name: 'Calvin Ridley', position: 'WR', team: 'JAX', rank: 27, adp: 18.9, bye: 9, posRank: 'WR10', points2023: 209.7 },
  { id: 'aj2', name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', rank: 29, adp: 19.8, bye: 9, posRank: 'WR11', points2023: 232.1 },
  { id: 'dj12', name: 'DK Metcalf', position: 'WR', team: 'SEA', rank: 30, adp: 20.4, bye: 5, posRank: 'WR12', points2023: 201.4 },
  
  // Tight Ends
  { id: 'tk87', name: 'Travis Kelce', position: 'TE', team: 'KC', rank: 31, adp: 21.2, bye: 6, posRank: 'TE1', points2023: 201.8 },
  { id: 'ma89', name: 'Mark Andrews', position: 'TE', team: 'BAL', rank: 38, adp: 27.8, bye: 14, posRank: 'TE2', points2023: 167.3 },
  { id: 'th87', name: 'T.J. Hockenson', position: 'TE', team: 'MIN', rank: 42, adp: 32.4, bye: 13, posRank: 'TE3', points2023: 142.9 },
  { id: 'gk85', name: 'George Kittle', position: 'TE', team: 'SF', rank: 48, adp: 38.1, bye: 9, posRank: 'TE4', points2023: 128.6 },
  { id: 'dp80', name: 'Dallas Goedert', position: 'TE', team: 'PHI', rank: 55, adp: 44.7, bye: 10, posRank: 'TE5', points2023: 114.2 },
  { id: 'kp84', name: 'Kyle Pitts', position: 'TE', team: 'ATL', rank: 61, adp: 49.3, bye: 11, posRank: 'TE6', points2023: 97.8 },
];

// Mock Teams
const MOCK_TEAMS = [
  { id: '1', name: 'Dynasty Destroyers', owner: 'Alex Johnson', avatar: '🔥' },
  { id: '2', name: 'Gridiron Gladiators', owner: 'Sarah Williams', avatar: '⚔️' },
  { id: '3', name: 'TD Titans', owner: 'Mike Chen', avatar: '⚡' },
  { id: '4', name: 'Fantasy Phenoms', owner: 'Emily Davis', avatar: '✨' },
  { id: '5', name: 'Endzone Elite', owner: 'James Wilson', avatar: '🏆' },
  { id: '6', name: 'Field Generals', owner: 'Lisa Martinez', avatar: '🎯' },
  { id: '7', name: 'Victory Formation', owner: 'Chris Taylor', avatar: '🏅' },
  { id: '8', name: 'Pigskin Prophets', owner: 'Jessica Brown', avatar: '🔮' },
  { id: '9', name: 'Red Zone Rebels', owner: 'David Lee', avatar: '🚀' },
  { id: '10', name: 'Championship Chase', owner: 'You', avatar: '👑' },
];

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

export default function DraftRoomPage() {
  const params = useParams();
  const draftId = params.id as string;
  
  // Draft state
  const [currentPick, setCurrentPick] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [draftedPlayers, setDraftedPlayers] = useState<Set<string>>(new Set());
  const [draftPicks, setDraftPicks] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [isPaused, setIsPaused] = useState(false);
  const [draftStarted, setDraftStarted] = useState(false);
  
  // UI state
  const [selectedTab, setSelectedTab] = useState<'board' | 'players' | 'rosters' | 'chat'>('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'rank' | 'adp' | 'name'>('rank');
  const [myQueue, setMyQueue] = useState<typeof NFL_PLAYERS>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<typeof NFL_PLAYERS[0] | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    user: string;
    message: string;
    type: 'chat' | 'pick' | 'system';
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  
  // Team rosters
  const [teamRosters, setTeamRosters] = useState<Record<string, typeof NFL_PLAYERS>>({});
  
  // Calculate current team
  const totalTeams = MOCK_TEAMS.length;
  const isSnakeOrder = currentRound % 2 === 0;
  const pickInRound = ((currentPick - 1) % totalTeams) + 1;
  const currentTeamIndex = isSnakeOrder 
    ? totalTeams - pickInRound 
    : pickInRound - 1;
  const currentTeam = MOCK_TEAMS[currentTeamIndex];
  const isMyTurn = currentTeam?.id === '10';
  
  // Initialize draft
  useEffect(() => {
    // Initialize team rosters
    const initialRosters: Record<string, typeof NFL_PLAYERS> = {};
    MOCK_TEAMS.forEach(team => {
      initialRosters[team.id] = [];
    });
    setTeamRosters(initialRosters);
    
    // Add welcome message
    setChatMessages([{
      id: '1',
      user: 'System',
      message: 'INITIALIZING CYBER DRAFT PROTOCOL... NEURAL LINK ESTABLISHED',
      type: 'system',
      timestamp: new Date()
    }]);
    
    // Auto-start draft after 3 seconds
    setTimeout(() => {
      setDraftStarted(true);
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: 'Commissioner',
        message: '🎯 DRAFT SEQUENCE ACTIVATED | NEURAL NETWORKS ONLINE | MAY THE ALGORITHMS BE WITH YOU',
        type: 'system',
        timestamp: new Date()
      }]);
    }, 3000);
  }, []);
  
  // Make an auto pick for CPU teams
  const makeAutoPick = useCallback(() => {
    const availablePlayers = NFL_PLAYERS.filter(p => !draftedPlayers.has(p.id));
    if (availablePlayers.length === 0) return;
    
    // Pick best available by rank
    const playerToPick = availablePlayers[0];
    if (playerToPick) {
      // Inline the pick logic to avoid hoisting issues
      setDraftedPlayers(prev => new Set([...prev, playerToPick.id]));
      setCurrentPick(prev => prev + 1);
      setTimeRemaining(90);
    }
  }, [draftedPlayers]);
  
  // Timer countdown
  useEffect(() => {
    if (!draftStarted || isPaused || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-pick when time runs out
          if (!isMyTurn) {
            makeAutoPick();
          }
          return 90;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, isPaused, draftStarted, isMyTurn, makeAutoPick]);
  

  // Auto-pick for CPU teams
  useEffect(() => {
    if (!draftStarted || isMyTurn || isPaused) return;
    
    const autoPickTimer = setTimeout(() => {
      makeAutoPick();
    }, Math.random() * 8000 + 2000); // Random time between 2-10 seconds
    
    return () => clearTimeout(autoPickTimer);
  }, [currentPick, draftStarted, isMyTurn, isPaused, makeAutoPick]);

  // AI Coach suggestions
  useEffect(() => {
    if (!isMyTurn || !draftStarted) return;
    
    const timer = setTimeout(() => {
      const availablePlayers = NFL_PLAYERS.filter(p => !draftedPlayers.has(p.id));
      const topPlayer = availablePlayers[0];
      if (!topPlayer) return;
      
      const messages = [
        `Consider ${topPlayer.name} - Elite ${topPlayer.position} with ${topPlayer.points2023.toFixed(0)} points last year!`,
        `${topPlayer.name} is the best available. Don't overthink this one!`,
        `My algorithms suggest ${topPlayer.name}. Trust the process.`,
        `Statistical analysis: ${topPlayer.name} has 87% success probability`,
        `${topPlayer.name} + your roster = Championship potential!`
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      if (randomMessage) {
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          user: 'AI Coach',
          message: randomMessage,
          type: 'system',
          timestamp: new Date()
        }]);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isMyTurn, draftStarted, draftedPlayers]);
  
  // Make a pick
  const makePick = useCallback((player: typeof NFL_PLAYERS[0]) => {
    if (draftedPlayers.has(player.id)) return;
    
    // Add to drafted players
    setDraftedPlayers(prev => new Set([...prev, player.id]));
    
    // Add to draft picks
    const pick = {
      pickNumber: currentPick,
      round: currentRound,
      team: currentTeam,
      player,
      timestamp: new Date()
    };
    setDraftPicks(prev => [...prev, pick]);
    
    // Add to team roster
    if (currentTeam) {
      setTeamRosters(prev => ({
        ...prev,
        [currentTeam.id]: [...(prev[currentTeam.id] || []), player]
      }));
    }
    
    // Add chat message with cyberpunk flair
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: 'Draft Board',
      message: `${currentTeam?.name || 'Unknown Team'} ACQUIRED: ${player.name} [${player.position}|${player.team}] | RANK: #${player.rank} | POWER: ${player.points2023.toFixed(0)}`,
      type: 'pick',
      timestamp: new Date()
    }]);
    
    // Remove from queue if present
    setMyQueue(prev => prev.filter(p => p.id !== player.id));
    
    // Move to next pick
    const nextPick = currentPick + 1;
    const nextRound = Math.ceil(nextPick / totalTeams);
    
    if (nextRound > 15) {
      // Draft complete
      setDraftStarted(false);
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: 'Commissioner',
        message: '🏆 DRAFT SEQUENCE COMPLETE | ROSTERS LOCKED | INITIATING SEASON PROTOCOL',
        type: 'system',
        timestamp: new Date()
      }]);
    } else {
      setCurrentPick(nextPick);
      setCurrentRound(nextRound);
      setTimeRemaining(90);
    }
  }, [currentPick, currentRound, currentTeam, draftedPlayers, totalTeams]);
  
  // Filter and sort players
  const filteredPlayers = NFL_PLAYERS
    .filter(p => !draftedPlayers.has(p.id))
    .filter(p => positionFilter === 'ALL' || p.position === positionFilter)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'rank': return a.rank - b.rank;
        case 'adp': return a.adp - b.adp;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  
  // Send chat message
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: 'You',
      message: chatInput,
      type: 'chat',
      timestamp: new Date()
    }]);
    setChatInput('');
    
    // Scroll to bottom
    setTimeout(() => {
      chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
    }, 100);
  };
  
  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              2024 Fantasy Draft
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                Round {currentRound} • Pick {currentPick}
              </span>
              <span className="text-sm">
                Overall: {currentPick}/150
              </span>
            </div>
          </div>
          
          {/* Timer */}
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isMyTurn ? 'bg-green-600' : 'bg-gray-700'
            }`}>
              <Clock className="w-5 h-5" />
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
            
            {!isMyTurn && (
              <div className="text-gray-400">
                {currentTeam?.name || 'Unknown Team'} is on the clock
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Draft Board */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Draft Board
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-10 gap-1 text-xs">
              {/* Team headers */}
              {MOCK_TEAMS.map(team => (
                <div 
                  key={team.id}
                  className={`text-center p-1 border-b border-gray-700 ${
                    team.id === '10' ? 'bg-blue-900' : ''
                  }`}
                  title={team.name}
                >
                  <div>{team.avatar}</div>
                </div>
              ))}
              
              {/* Draft grid */}
              {Array.from({ length: 150 }, (_, i) => {
                const pickNum = i + 1;
                const round = Math.ceil(pickNum / 10);
                const pick = draftPicks.find(p => p.pickNumber === pickNum);
                const isPending = pickNum === currentPick;
                
                return (
                  <div
                    key={pickNum}
                    className={`
                      border p-1 text-center h-12 flex flex-col justify-center transition-all
                      ${isPending 
                        ? 'bg-yellow-500/30 border-yellow-400 animate-pulse shadow-[0_0_10px_rgba(255,255,0,0.5)]' 
                        : pick 
                          ? 'bg-gray-800/70 border-gray-600/50' 
                          : 'bg-black/40 border-gray-700/30'}
                    `}
                    style={{
                      boxShadow: isPending ? `0 0 15px #fbbf2460` : 'none'
                    }}
                  >
                    {pick ? (
                      <>
                        <div className={`text-xs px-1 py-0.5 rounded ${getPositionColor(pick.player.position)}`}>
                          {pick.player.position}
                        </div>
                        <div className="text-xs truncate mt-0.5" title={pick.player.name}>
                          {pick.player.name.split(' ').pop()}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500 text-xs font-mono">
                        {round.toString().padStart(2, '0')}.{(((pickNum - 1) % 10) + 1).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Center Panel - Players/Rosters */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="bg-gray-800 border-b border-gray-700 flex">
            <button
              onClick={() => setSelectedTab('players')}
              className={`px-6 py-3 font-medium transition-colors ${
                selectedTab === 'players' 
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Available Players
            </button>
            <button
              onClick={() => setSelectedTab('rosters')}
              className={`px-6 py-3 font-medium transition-colors ${
                selectedTab === 'rosters' 
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Team Rosters
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {selectedTab === 'players' && (
              <div className="h-full flex flex-col">
                {/* Search and Filters */}
                <div className="bg-gray-800 p-4 border-b border-gray-700">
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                        <th className="px-4 py-2">2023 Pts</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlayers.map((player) => (
                        <motion.tr
                          key={player.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`
                            border-b border-gray-700 hover:bg-gray-700 cursor-pointer transition-colors
                            ${selectedPlayer?.id === player.id ? 'bg-gray-700' : ''}
                            ${myQueue.some(p => p.id === player.id) ? 'bg-blue-900 bg-opacity-30' : ''}
                          `}
                          onClick={() => setSelectedPlayer(player)}
                        >
                          <td className="px-4 py-3">{player.rank}</td>
                          <td className="px-4 py-3 font-medium">{player.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getPositionColor(player.position)}`}>
                              {player.position}
                            </span>
                          </td>
                          <td className="px-4 py-3">{player.team}</td>
                          <td className="px-4 py-3">{player.bye}</td>
                          <td className="px-4 py-3">{player.adp.toFixed(1)}</td>
                          <td className="px-4 py-3">{player.points2023.toFixed(1)}</td>
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
            )}
            
            {selectedTab === 'rosters' && (
              <div className="h-full overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-4">
                  {MOCK_TEAMS.map(team => (
                    <div 
                      key={team.id}
                      className={`bg-gray-800 rounded-lg p-4 ${
                        team.id === '10' ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{team.avatar}</span>
                          <div>
                            <h3 className="font-semibold">{team.name}</h3>
                            <p className="text-sm text-gray-400">{team.owner}</p>
                          </div>
                        </div>
                        {team.id === currentTeam?.id && (
                          <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                            ON CLOCK
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {['QB', 'RB', 'WR', 'TE'].map(pos => {
                          const posPlayers = teamRosters[team.id]?.filter(p => p.position === pos) || [];
                          return (
                            <div key={pos}>
                              <div className="text-xs text-gray-400 mb-1">{pos}</div>
                              {posPlayers.length > 0 ? (
                                posPlayers.map(player => (
                                  <div key={player.id} className="text-sm bg-gray-700 rounded px-2 py-1 mb-1">
                                    {player.name} ({player.team})
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-600 italic">Empty</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Queue */}
          {myQueue.length > 0 && (
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  My Queue ({myQueue.length})
                </h3>
                <button
                  onClick={() => setMyQueue([])}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Clear All
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {myQueue.map((player, index) => (
                  <div
                    key={player.id}
                    className="bg-gray-700 rounded px-3 py-2 flex items-center gap-2 whitespace-nowrap"
                  >
                    <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPositionColor(player.position)}`}>
                      {player.position}
                    </span>
                    <span className="text-sm">{player.name}</span>
                    <button
                      onClick={() => setMyQueue(prev => prev.filter(p => p.id !== player.id))}
                      className="text-gray-400 hover:text-red-500 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel - Chat */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
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