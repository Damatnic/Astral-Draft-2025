'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Clock, Users, TrendingUp, Trophy, Target, Zap, Brain, ChevronRight, Play, Pause, BarChart, CheckCircle, XCircle } from 'lucide-react';

interface MockDraftRoomProps {
  teamCount: number;
  rounds: number;
  scoringType: 'STANDARD' | 'PPR' | 'HALF_PPR';
  draftPosition: number;
  aiDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  timePerPick: number;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  adp: number;
  rank: number;
  projectedPoints: number;
  byeWeek: number;
  injuryStatus?: string;
  positionRank: number;
}

interface DraftPick {
  round: number;
  pick: number;
  teamId: string;
  player: Player;
  timestamp: Date;
  analysis?: string;
}

interface MockTeam {
  id: string;
  name: string;
  position: number;
  strategy: 'BEST_AVAILABLE' | 'POSITION_PRIORITY' | 'BALANCED' | 'VALUE_BASED' | 'ZERO_RB' | 'ROBUST_RB';
  roster: Player[];
  needs: Record<string, number>;
  isUser: boolean;
}

interface DraftAnalysis {
  grade: string;
  strengths: string[];
  weaknesses: string[];
  bestPick: DraftPick;
  worstPick: DraftPick;
  projectedFinish: number;
  suggestions: string[];
}

// AI Team Names
const AI_TEAM_NAMES = [
  'Draft Dynamos', 'Grid Iron Giants', 'Fantasy Phenoms', 'Touchdown Titans',
  'End Zone Elite', 'Red Zone Raiders', 'Victory Vipers', 'Champion Chasers',
  'Playoff Predators', 'Trophy Hunters', 'Draft Day Devils', 'Fantasy Force',
  'Gridiron Gladiators', 'Pigskin Pros', 'Draft Dominators', 'Fantasy Legends',
  'Championship Contenders', 'Draft Day Dragons', 'Fantasy Wizards', 'Grid Masters'
];

// AI Strategies by difficulty
const AI_STRATEGIES: Record<string, string[]> = {
  EASY: ['BEST_AVAILABLE', 'BEST_AVAILABLE', 'POSITION_PRIORITY'],
  MEDIUM: ['BEST_AVAILABLE', 'BALANCED', 'POSITION_PRIORITY', 'VALUE_BASED'],
  HARD: ['VALUE_BASED', 'BALANCED', 'ZERO_RB', 'ROBUST_RB'],
  EXPERT: ['VALUE_BASED', 'VALUE_BASED', 'ZERO_RB', 'ROBUST_RB', 'BALANCED'],
};

export default function MockDraftRoom({
  teamCount,
  rounds,
  scoringType,
  draftPosition,
  aiDifficulty,
  timePerPick,
}: MockDraftRoomProps) {
  const [draftStarted, setDraftStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPick, setCurrentPick] = useState(1);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timePerPick);
  const [teams, setTeams] = useState<MockTeam[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [draftComplete, setDraftComplete] = useState(false);
  const [draftSpeed, setDraftSpeed] = useState<'SLOW' | 'NORMAL' | 'FAST'>('NORMAL');
  const [autoPickEnabled, setAutoPickEnabled] = useState(false);

  // Initialize teams
  useEffect(() => {
    const mockTeams: MockTeam[] = [];
    const strategies = AI_STRATEGIES[aiDifficulty];
    
    for (let i = 1; i <= teamCount; i++) {
      const isUser = i === draftPosition;
      mockTeams.push({
        id: `team_${i}`,
        name: isUser ? 'Your Team' : AI_TEAM_NAMES[i - 1],
        position: i,
        strategy: isUser ? 'BALANCED' : strategies[Math.floor(Math.random() * strategies.length)] as any,
        roster: [],
        needs: {
          QB: 2, RB: 5, WR: 5, TE: 2, K: 1, DEF: 1,
        },
        isUser,
      });
    }
    
    setTeams(mockTeams);
  }, [teamCount, draftPosition, aiDifficulty]);

  // Load available players
  useEffect(() => {
    // Mock player data - would fetch from API
    const players: Player[] = [
      { id: '1', name: 'Christian McCaffrey', position: 'RB', team: 'SF', adp: 1.2, rank: 1, projectedPoints: 380, byeWeek: 9, positionRank: 1 },
      { id: '2', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', adp: 2.8, rank: 2, projectedPoints: 320, byeWeek: 7, positionRank: 1 },
      { id: '3', name: 'Tyreek Hill', position: 'WR', team: 'MIA', adp: 3.5, rank: 3, projectedPoints: 315, byeWeek: 10, positionRank: 2 },
      { id: '4', name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', adp: 6.2, rank: 4, projectedPoints: 295, byeWeek: 5, positionRank: 3 },
      { id: '5', name: 'Bijan Robinson', position: 'RB', team: 'ATL', adp: 5.1, rank: 5, projectedPoints: 310, byeWeek: 11, positionRank: 2 },
      // Add more players...
    ];
    
    // Generate more mock players
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
    const positionCounts = { QB: 32, RB: 80, WR: 90, TE: 32, K: 20, DEF: 20 };
    
    for (const pos of positions) {
      const count = positionCounts[pos as keyof typeof positionCounts];
      for (let i = players.filter(p => p.position === pos).length; i < count; i++) {
        players.push({
          id: `${pos}_${i}`,
          name: `${pos} Player ${i + 1}`,
          position: pos,
          team: 'TBD',
          adp: 10 + i * 2 + Math.random() * 10,
          rank: players.length + 1,
          projectedPoints: 200 - i * 2 + Math.random() * 20,
          byeWeek: Math.floor(Math.random() * 8) + 5,
          positionRank: i + 1,
        });
      }
    }
    
    setAvailablePlayers(players.sort((a, b) => a.adp - b.adp));
  }, [scoringType]);

  // Timer effect
  useEffect(() => {
    if (!draftStarted || isPaused || draftComplete) return;
    
    const speedMultiplier = draftSpeed === 'SLOW' ? 1 : draftSpeed === 'NORMAL' ? 0.5 : 0.1;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          // Auto-pick if time runs out
          if (teams[currentTeamIndex]?.isUser && !autoPickEnabled) {
            // Make best available pick for user
            handleAutoPick();
          }
          return timePerPick;
        }
        return prev - 1;
      });
    }, 1000 * speedMultiplier);
    
    return () => clearInterval(interval);
  }, [draftStarted, isPaused, draftComplete, currentTeamIndex, draftSpeed, autoPickEnabled]);

  // AI draft logic
  useEffect(() => {
    if (!draftStarted || isPaused || draftComplete) return;
    if (teams[currentTeamIndex]?.isUser && !autoPickEnabled) return;
    
    const delay = draftSpeed === 'FAST' ? 500 : draftSpeed === 'NORMAL' ? 2000 : 4000;
    
    const timeout = setTimeout(() => {
      if (!teams[currentTeamIndex]?.isUser || autoPickEnabled) {
        makeAiPick();
      }
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [currentTeamIndex, draftStarted, isPaused, draftComplete, teams, autoPickEnabled, draftSpeed]);

  // Make AI pick
  const makeAiPick = useCallback(() => {
    const team = teams[currentTeamIndex];
    if (!team || team.isUser && !autoPickEnabled) return;
    
    const player = selectBestPlayer(team);
    if (player) {
      makePick(player, `AI selected based on ${team.strategy} strategy`);
    }
  }, [teams, currentTeamIndex, autoPickEnabled]);

  // AI player selection logic
  const selectBestPlayer = (team: MockTeam): Player | null => {
    const available = availablePlayers.filter(p => !draftPicks.some(pick => pick.player.id === p.id));
    if (available.length === 0) return null;
    
    let selectedPlayer: Player | null = null;
    
    switch (team.strategy) {
      case 'BEST_AVAILABLE':
        selectedPlayer = available[0];
        break;
        
      case 'POSITION_PRIORITY':
        // Prioritize positions with highest need
        const highestNeed = Object.entries(team.needs)
          .filter(([_, need]) => need > 0)
          .sort(([, a], [, b]) => b - a)[0];
        
        if (highestNeed) {
          const positionPlayers = available.filter(p => p.position === highestNeed[0]);
          selectedPlayer = positionPlayers[0] || available[0];
        } else {
          selectedPlayer = available[0];
        }
        break;
        
      case 'BALANCED':
        // Balance between value and need
        selectedPlayer = available.reduce((best, player) => {
          const needScore = team.needs[player.position] || 0;
          const valueScore = 200 - player.adp;
          const totalScore = needScore * 30 + valueScore;
          
          const bestNeedScore = team.needs[best.position] || 0;
          const bestValueScore = 200 - best.adp;
          const bestTotalScore = bestNeedScore * 30 + bestValueScore;
          
          return totalScore > bestTotalScore ? player : best;
        });
        break;
        
      case 'VALUE_BASED':
        // Pick based on value over replacement
        const vorScores = available.slice(0, 30).map(player => {
          const positionPlayers = available
            .filter(p => p.position === player.position)
            .slice(0, 20);
          
          const replacementLevel = positionPlayers[Math.min(12, positionPlayers.length - 1)];
          const vor = player.projectedPoints - (replacementLevel?.projectedPoints || 0);
          
          return { player, vor };
        });
        
        selectedPlayer = vorScores.sort((a, b) => b.vor - a.vor)[0]?.player || available[0];
        break;
        
      case 'ZERO_RB':
        // Avoid RBs early
        if (currentRound <= 4) {
          selectedPlayer = available.find(p => p.position !== 'RB') || available[0];
        } else {
          selectedPlayer = available[0];
        }
        break;
        
      case 'ROBUST_RB':
        // Prioritize RBs early
        if (currentRound <= 5) {
          selectedPlayer = available.find(p => p.position === 'RB') || available[0];
        } else {
          selectedPlayer = available[0];
        }
        break;
        
      default:
        selectedPlayer = available[0];
    }
    
    return selectedPlayer;
  };

  // Make a pick
  const makePick = useCallback((player: Player, analysis?: string) => {
    const pick: DraftPick = {
      round: currentRound,
      pick: (currentRound - 1) * teamCount + currentPick,
      teamId: teams[currentTeamIndex].id,
      player,
      timestamp: new Date(),
      analysis,
    };
    
    // Update state
    setDraftPicks(prev => [...prev, pick]);
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
    
    // Update team roster and needs
    setTeams(prev => prev.map(team => {
      if (team.id === teams[currentTeamIndex].id) {
        const newRoster = [...team.roster, player];
        const newNeeds = { ...team.needs };
        if (newNeeds[player.position] > 0) {
          newNeeds[player.position]--;
        }
        return { ...team, roster: newRoster, needs: newNeeds };
      }
      return team;
    }));
    
    // Move to next pick
    moveToNextPick();
  }, [currentRound, currentPick, teamCount, teams, currentTeamIndex]);

  // Move to next pick
  const moveToNextPick = useCallback(() => {
    const totalPicks = teamCount * rounds;
    const currentOverallPick = (currentRound - 1) * teamCount + currentPick;
    
    if (currentOverallPick >= totalPicks) {
      setDraftComplete(true);
      return;
    }
    
    // Snake draft logic
    let nextPick = currentPick + 1;
    let nextRound = currentRound;
    let nextTeamIndex = currentTeamIndex;
    
    if (currentRound % 2 === 1) {
      // Odd round - going forward
      if (currentPick >= teamCount) {
        nextRound++;
        nextPick = 1;
        nextTeamIndex = teamCount - 1;
      } else {
        nextTeamIndex = currentPick;
      }
    } else {
      // Even round - going backward
      if (currentPick >= teamCount) {
        nextRound++;
        nextPick = 1;
        nextTeamIndex = 0;
      } else {
        nextTeamIndex = teamCount - currentPick - 1;
      }
    }
    
    setCurrentRound(nextRound);
    setCurrentPick(nextPick);
    setCurrentTeamIndex(nextTeamIndex);
    setTimeRemaining(timePerPick);
    setSelectedPlayer(null);
  }, [currentRound, currentPick, teamCount, rounds, currentTeamIndex, timePerPick]);

  // Handle user pick
  const handleUserPick = useCallback(() => {
    if (!selectedPlayer || !teams[currentTeamIndex]?.isUser) return;
    makePick(selectedPlayer, 'User manual selection');
  }, [selectedPlayer, teams, currentTeamIndex, makePick]);

  // Handle auto pick for user
  const handleAutoPick = useCallback(() => {
    const team = teams[currentTeamIndex];
    if (!team || !team.isUser) return;
    
    const player = selectBestPlayer(team);
    if (player) {
      makePick(player, 'Auto-pick due to timeout');
    }
  }, [teams, currentTeamIndex, makePick]);

  // Filter players
  const filteredPlayers = useMemo(() => {
    return availablePlayers
      .filter(p => !draftPicks.some(pick => pick.player.id === p.id))
      .filter(p => 
        (positionFilter === 'ALL' || p.position === positionFilter) &&
        (searchQuery === '' || 
         p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.team.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .slice(0, 50);
  }, [availablePlayers, draftPicks, positionFilter, searchQuery]);

  // Get current team
  const currentTeam = teams[currentTeamIndex];
  const isUserTurn = currentTeam?.isUser;

  // Generate draft analysis
  const generateDraftAnalysis = (): DraftAnalysis => {
    const userTeam = teams.find(t => t.isUser);
    if (!userTeam) return {
      grade: 'N/A',
      strengths: [],
      weaknesses: [],
      bestPick: draftPicks[0],
      worstPick: draftPicks[0],
      projectedFinish: 0,
      suggestions: [],
    };

    const userPicks = draftPicks.filter(p => p.teamId === userTeam.id);
    
    // Calculate grade based on value
    let totalValue = 0;
    let bestValue = -100;
    let worstValue = 100;
    let bestPick = userPicks[0];
    let worstPick = userPicks[0];
    
    userPicks.forEach(pick => {
      const expectedPick = pick.player.adp * teamCount;
      const actualPick = pick.pick;
      const value = expectedPick - actualPick;
      totalValue += value;
      
      if (value > bestValue) {
        bestValue = value;
        bestPick = pick;
      }
      if (value < worstValue) {
        worstValue = value;
        worstPick = pick;
      }
    });
    
    const avgValue = totalValue / userPicks.length;
    let grade = 'C';
    if (avgValue > 15) grade = 'A';
    else if (avgValue > 10) grade = 'A-';
    else if (avgValue > 5) grade = 'B+';
    else if (avgValue > 2) grade = 'B';
    else if (avgValue > -2) grade = 'B-';
    else if (avgValue > -5) grade = 'C+';
    else if (avgValue > -10) grade = 'C-';
    else grade = 'D';
    
    // Analyze strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];
    
    const positionCounts = userTeam.roster.reduce((acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Check position groups
    if ((positionCounts.RB || 0) >= 4) strengths.push('Strong RB depth');
    if ((positionCounts.WR || 0) >= 4) strengths.push('Solid WR corps');
    if ((positionCounts.QB || 0) >= 2) strengths.push('QB position secured');
    
    if ((positionCounts.RB || 0) < 3) weaknesses.push('Thin at RB');
    if ((positionCounts.WR || 0) < 3) weaknesses.push('Need WR depth');
    if ((positionCounts.TE || 0) < 1) weaknesses.push('No starting TE');
    
    // Check for elite players
    const elitePlayers = userTeam.roster.filter(p => p.rank <= 10);
    if (elitePlayers.length >= 2) strengths.push(`${elitePlayers.length} elite players`);
    else if (elitePlayers.length === 0) weaknesses.push('Lacks elite talent');
    
    // Generate suggestions
    if (weaknesses.includes('Thin at RB')) {
      suggestions.push('Target RB handcuffs on waivers');
    }
    if (weaknesses.includes('Need WR depth')) {
      suggestions.push('Look for breakout WR candidates');
    }
    if (!positionCounts.K) {
      suggestions.push('Stream kickers based on matchups');
    }
    
    // Project finish
    const projectedPoints = userTeam.roster.reduce((sum, p) => sum + p.projectedPoints, 0);
    const allProjections = teams.map(t => 
      t.roster.reduce((sum, p) => sum + p.projectedPoints, 0)
    ).sort((a, b) => b - a);
    
    const projectedFinish = allProjections.indexOf(projectedPoints) + 1;
    
    return {
      grade,
      strengths,
      weaknesses,
      bestPick,
      worstPick,
      projectedFinish,
      suggestions,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Bot className="w-8 h-8 text-purple-400" />
              Mock Draft Room
            </h1>
            <div className="flex items-center gap-4">
              {!draftStarted ? (
                <button
                  onClick={() => setDraftStarted(true)}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Draft
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <select
                    value={draftSpeed}
                    onChange={(e) => setDraftSpeed(e.target.value as any)}
                    className="px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="SLOW">Slow</option>
                    <option value="NORMAL">Normal</option>
                    <option value="FAST">Fast</option>
                  </select>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={autoPickEnabled}
                      onChange={(e) => setAutoPickEnabled(e.target.checked)}
                      className="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
                    />
                    Auto-Pick
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {draftStarted && !draftComplete && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Draft Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Pick Info */}
              <div className="bg-gradient-to-br from-purple-800/50 to-blue-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Now Picking</div>
                    <div className="text-2xl font-bold text-white">{currentTeam?.name}</div>
                    <div className="text-sm text-purple-300 mt-1">
                      Round {currentRound}, Pick {currentPick} (#{(currentRound - 1) * teamCount + currentPick} overall)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white flex items-center gap-2">
                      <Clock className="w-8 h-8 text-purple-400" />
                      {timeRemaining}s
                    </div>
                    {!isUserTurn && (
                      <div className="text-sm text-gray-400 mt-1">
                        AI thinking...
                      </div>
                    )}
                  </div>
                </div>

                {/* Timer Bar */}
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeRemaining / timePerPick) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
              </div>

              {/* Player Search and Filter */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                <div className="flex flex-wrap gap-3">
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 min-w-[200px] px-4 py-2 bg-gray-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ALL">All Positions</option>
                    <option value="QB">QB</option>
                    <option value="RB">RB</option>
                    <option value="WR">WR</option>
                    <option value="TE">TE</option>
                    <option value="K">K</option>
                    <option value="DEF">DEF</option>
                  </select>
                </div>
              </div>

              {/* Available Players */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Available Players</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPlayers.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => isUserTurn && setSelectedPlayer(player)}
                      className={`p-3 bg-gray-900/50 rounded-lg cursor-pointer transition-all hover:bg-gray-700/50 ${
                        selectedPlayer?.id === player.id ? 'ring-2 ring-purple-500' : ''
                      } ${!isUserTurn ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-gray-500 text-sm w-8">
                            {Math.round(player.adp)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{player.name}</div>
                            <div className="text-sm text-gray-400">
                              {player.position} - {player.team} • Bye: {player.byeWeek}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">{player.projectedPoints} pts</div>
                          <div className="text-xs text-gray-500">#{player.positionRank} {player.position}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {isUserTurn && selectedPlayer && (
                  <button
                    onClick={handleUserPick}
                    className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Draft {selectedPlayer.name}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Draft Board */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Recent Picks</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {draftPicks.slice(-10).reverse().map((pick, idx) => {
                    const team = teams.find(t => t.id === pick.teamId);
                    return (
                      <div key={idx} className="text-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-gray-400">
                            {pick.round}.{pick.pick}
                          </div>
                          <div className="text-white flex-1 mx-2">
                            {pick.player.name}
                          </div>
                          <div className={`text-xs ${team?.isUser ? 'text-purple-400' : 'text-gray-500'}`}>
                            {team?.name.slice(0, 10)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Your Roster */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Your Roster</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {teams.find(t => t.isUser)?.roster.map((player, idx) => (
                    <div key={idx} className="p-2 bg-gray-900/50 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white text-sm font-semibold">{player.name}</div>
                          <div className="text-xs text-gray-400">
                            {player.position} - {player.team}
                          </div>
                        </div>
                        <div className="text-green-400 text-sm">
                          {player.projectedPoints}
                        </div>
                      </div>
                    </div>
                  ))}
                  {teams.find(t => t.isUser)?.roster.length === 0 && (
                    <p className="text-gray-500 text-center">No players drafted yet</p>
                  )}
                </div>
              </div>

              {/* Team Needs */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Position Needs</h3>
                <div className="space-y-2">
                  {Object.entries(teams.find(t => t.isUser)?.needs || {}).map(([pos, need]) => (
                    <div key={pos} className="flex items-center justify-between">
                      <span className="text-gray-400">{pos}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: Math.max(0, 5 - need) }).map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-green-500 rounded-full" />
                          ))}
                          {Array.from({ length: Math.max(0, need) }).map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-gray-600 rounded-full" />
                          ))}
                        </div>
                        <span className={`text-sm ${need > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {need > 0 ? `Need ${need}` : 'Filled'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Draft Complete */}
        {draftComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-lg p-8 border border-purple-500/50"
          >
            <h2 className="text-3xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-400" />
              Mock Draft Complete!
            </h2>

            {(() => {
              const analysis = generateDraftAnalysis();
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Draft Grade</h3>
                    <div className="text-6xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {analysis.grade}
                    </div>
                    <div className="text-center text-gray-400 mb-4">
                      Projected Finish: #{analysis.projectedFinish}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {analysis.strengths.map((strength, idx) => (
                          <li key={idx} className="text-green-400 text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Weaknesses</h4>
                      <ul className="space-y-1">
                        {analysis.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-red-400 text-sm flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {analysis.bestPick && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Best Pick</h4>
                        <p className="text-gray-300">
                          {analysis.bestPick.player.name} in Round {analysis.bestPick.round}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Suggestions</h4>
                      <ul className="space-y-1">
                        {analysis.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-400" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Start New Mock Draft
              </button>
              <button
                onClick={() => setShowAnalysis(true)}
                className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2"
              >
                <BarChart className="w-5 h-5" />
                View Full Analysis
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}