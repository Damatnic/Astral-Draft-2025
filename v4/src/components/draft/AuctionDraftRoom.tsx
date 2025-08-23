'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Clock, Users, TrendingUp, AlertTriangle, Gavel, Target, Zap } from 'lucide-react';

interface AuctionDraftRoomProps {
  draftId: string;
  leagueId: string;
  teamId: string;
  userId: string;
}

interface TeamBudget {
  teamId: string;
  teamName: string;
  budget: number;
  spent: number;
  maxBid: number;
  rosterSpots: number;
  filledSpots: number;
}

interface CurrentBid {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  currentBid: number;
  currentBidder: string;
  bidderName: string;
  timeRemaining: number;
  nominatedBy: string;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  adp: number;
  projectedPoints: number;
  auctionValue: number;
  sold?: boolean;
  soldPrice?: number;
  soldTo?: string;
}

export default function AuctionDraftRoom({
  draftId,
  leagueId,
  teamId,
  userId,
}: AuctionDraftRoomProps) {
  // State management
  const [currentBid, setCurrentBid] = useState<CurrentBid | null>(null);
  const [bidAmount, setBidAmount] = useState(1);
  const [teamBudgets, setTeamBudgets] = useState<TeamBudget[]>([]);
  const [myBudget, setMyBudget] = useState<TeamBudget | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [myRoster, setMyRoster] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [nominationQueue, setNominationQueue] = useState<string[]>([]);
  const [isMyTurnToNominate, setIsMyTurnToNominate] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [autoBidSettings, setAutoBidSettings] = useState({
    enabled: false,
    maxBid: 0,
    targetPlayer: null as string | null,
  });
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [showStrategy, setShowStrategy] = useState(false);

  // WebSocket connection
  const { socket, isConnected, joinRoom, leaveRoom } = useWebSocket();

  // Calculate max bid
  const calculateMaxBid = useCallback(() => {
    if (!myBudget) return 0;
    const remainingSpots = myBudget.rosterSpots - myBudget.filledSpots;
    const remainingBudget = myBudget.budget - myBudget.spent;
    // Must save $1 for each remaining roster spot
    return Math.max(1, remainingBudget - (remainingSpots - 1));
  }, [myBudget]);

  // Join draft room
  useEffect(() => {
    if (draftId) {
      joinRoom(`/draft/${draftId}`);
      return () => {
        leaveRoom(`/draft/${draftId}`);
      };
    }
    return undefined;
  }, [draftId, joinRoom, leaveRoom]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('bid-update', (data: any) => {
      setCurrentBid(data.currentBid);
      setBidHistory(prev => [...prev, data]);
    });

    socket.on('player-sold', (data: any) => {
      const { player, price, teamId: soldToTeam } = data;
      
      // Update available players
      setAvailablePlayers(prev => 
        prev.map(p => p.id === player.id 
          ? { ...p, sold: true, soldPrice: price, soldTo: soldToTeam }
          : p
        )
      );

      // Update budgets
      setTeamBudgets(prev => 
        prev.map(t => t.teamId === soldToTeam
          ? { 
              ...t, 
              spent: t.spent + price,
              filledSpots: t.filledSpots + 1,
              maxBid: Math.max(1, t.budget - t.spent - price - (t.rosterSpots - t.filledSpots - 1))
            }
          : t
        )
      );

      // Update my roster if I won
      if (soldToTeam === teamId) {
        setMyRoster(prev => [...prev, { ...player, soldPrice: price }]);
      }

      // Clear current bid
      setCurrentBid(null);
      setBidAmount(1);
    });

    socket.on('nomination-turn', (data: any) => {
      setIsMyTurnToNominate(data.teamId === teamId);
      if (data.teamId === teamId) {
        // Show notification
        showNotification('Your turn to nominate a player!');
      }
    });

    socket.on('draft-complete', () => {
      // Handle draft completion
      showNotification('Auction draft complete!');
    });

    return () => {
      socket.off('bid-update');
      socket.off('player-sold');
      socket.off('nomination-turn');
      socket.off('draft-complete');
    };
  }, [socket, teamId]);

  // Place bid
  const placeBid = useCallback(() => {
    if (!socket || !currentBid || bidAmount <= currentBid.currentBid) return;

    const maxBid = calculateMaxBid();
    if (bidAmount > maxBid) {
      showNotification(`Cannot bid more than $${maxBid}`, 'error');
      return;
    }

    socket.emit('place-bid', {
      draftId,
      playerId: currentBid.playerId,
      amount: bidAmount,
      teamId,
    });

    // Optimistically update UI
    setCurrentBid(prev => prev ? {
      ...prev,
      currentBid: bidAmount,
      currentBidder: teamId,
      bidderName: 'You',
      timeRemaining: 10, // Reset timer
    } : null);
  }, [socket, currentBid, bidAmount, calculateMaxBid, draftId, teamId]);

  // Nominate player
  const nominatePlayer = useCallback((player: Player) => {
    if (!socket || !isMyTurnToNominate) return;

    socket.emit('nominate-player', {
      draftId,
      playerId: player.id,
      openingBid: 1,
    });

    setIsMyTurnToNominate(false);
    setSelectedPlayer(null);
  }, [socket, isMyTurnToNominate, draftId]);

  // Auto-bid logic
  useEffect(() => {
    if (!autoBidSettings.enabled || !currentBid || !socket) return;
    
    if (
      autoBidSettings.targetPlayer === currentBid.playerId &&
      currentBid.currentBidder !== teamId &&
      currentBid.currentBid < autoBidSettings.maxBid
    ) {
      const autoBidAmount = Math.min(
        currentBid.currentBid + 1,
        autoBidSettings.maxBid,
        calculateMaxBid()
      );

      setTimeout(() => {
        socket.emit('place-bid', {
          draftId,
          playerId: currentBid.playerId,
          amount: autoBidAmount,
          teamId,
        });
      }, 1000); // Small delay to seem more human
    }
  }, [currentBid, autoBidSettings, socket, teamId, calculateMaxBid, draftId]);

  // Filter available players
  const filteredPlayers = useMemo(() => {
    return availablePlayers
      .filter(p => !p.sold)
      .filter(p => 
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.auctionValue - a.auctionValue);
  }, [availablePlayers, searchQuery]);

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Implementation would use a toast library
    console.log(`[${type}] ${message}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Gavel className="w-8 h-8 text-purple-400" />
              Auction Draft Room
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-white">
                <span className="text-gray-400">Status:</span>{' '}
                <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Auction Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Bid */}
            {currentBid ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-purple-800/50 to-blue-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{currentBid.playerName}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                        {currentBid.position}
                      </span>
                      <span className="text-gray-400">{currentBid.team}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                      ${currentBid.currentBid}
                    </div>
                    <div className="text-sm text-gray-400">Current Bid</div>
                    <div className="text-sm text-purple-300 mt-1">
                      {currentBid.bidderName}
                    </div>
                  </div>
                </div>

                {/* Timer */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                    <span>Time Remaining</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {currentBid.timeRemaining}s
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-yellow-500"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(currentBid.timeRemaining / 10) * 100}%` }}
                      transition={{ duration: 1, ease: 'linear' }}
                    />
                  </div>
                </div>

                {/* Bid Controls */}
                {currentBid.currentBidder !== teamId && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center bg-gray-800/50 rounded-lg">
                        <button
                          onClick={() => setBidAmount(Math.max(1, bidAmount - 1))}
                          className="px-4 py-3 text-gray-400 hover:text-white transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Math.max(currentBid.currentBid + 1, parseInt(e.target.value) || 0))}
                          className="flex-1 bg-transparent text-white text-center text-xl font-bold focus:outline-none"
                          min={currentBid.currentBid + 1}
                          max={calculateMaxBid()}
                        />
                        <button
                          onClick={() => setBidAmount(Math.min(calculateMaxBid(), bidAmount + 1))}
                          className="px-4 py-3 text-gray-400 hover:text-white transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={placeBid}
                      disabled={bidAmount <= currentBid.currentBid || bidAmount > calculateMaxBid()}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Place Bid
                    </button>
                  </div>
                )}

                {currentBid.currentBidder === teamId && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                    <p className="text-green-400 font-semibold text-center">
                      You have the current high bid!
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700">
                <p className="text-gray-400 text-center">Waiting for next nomination...</p>
              </div>
            )}

            {/* Nomination Section */}
            {isMyTurnToNominate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-orange-800/50 to-red-800/50 backdrop-blur-sm rounded-lg p-6 border border-orange-500/50"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-orange-400" />
                  Your Turn to Nominate
                </h3>

                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search players to nominate..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Player List */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredPlayers.slice(0, 10).map((player) => (
                    <div
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className={`p-3 bg-gray-800/50 rounded-lg cursor-pointer transition-all hover:bg-gray-700/50 ${
                        selectedPlayer?.id === player.id ? 'ring-2 ring-orange-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{player.name}</div>
                          <div className="text-sm text-gray-400">
                            {player.position} - {player.team}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">${player.auctionValue}</div>
                          <div className="text-xs text-gray-500">Est. Value</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedPlayer && (
                  <button
                    onClick={() => nominatePlayer(selectedPlayer)}
                    className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
                  >
                    Nominate {selectedPlayer.name}
                  </button>
                )}
              </motion.div>
            )}

            {/* Team Budgets */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" />
                Team Budgets
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {teamBudgets.map((team) => (
                  <div
                    key={team.teamId}
                    className={`p-3 bg-gray-900/50 rounded-lg border ${
                      team.teamId === teamId ? 'border-purple-500' : 'border-gray-700'
                    }`}
                  >
                    <div className="font-semibold text-white text-sm mb-1">
                      {team.teamName}
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      ${team.budget - team.spent}
                    </div>
                    <div className="text-xs text-gray-500">
                      {team.filledSpots}/{team.rosterSpots} spots
                    </div>
                    <div className="text-xs text-yellow-400">
                      Max: ${team.maxBid}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* My Budget */}
            {myBudget && (
              <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/50">
                <h3 className="text-xl font-bold text-white mb-4">My Budget</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Remaining:</span>
                    <span className="text-2xl font-bold text-green-400">
                      ${myBudget.budget - myBudget.spent}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Bid:</span>
                    <span className="text-xl font-bold text-yellow-400">
                      ${calculateMaxBid()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Roster:</span>
                    <span className="text-white">
                      {myBudget.filledSpots}/{myBudget.rosterSpots}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg/Player:</span>
                    <span className="text-white">
                      ${Math.round((myBudget.budget - myBudget.spent) / (myBudget.rosterSpots - myBudget.filledSpots))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* My Roster */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">My Roster</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {myRoster.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No players yet</p>
                ) : (
                  myRoster.map((player) => (
                    <div key={player.id} className="p-3 bg-gray-900/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white text-sm">
                            {player.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {player.position} - {player.team}
                          </div>
                        </div>
                        <div className="text-green-400 font-bold">
                          ${player.soldPrice}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Auto-Bid Settings */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                Auto-Bid
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={autoBidSettings.enabled}
                    onChange={(e) => setAutoBidSettings(prev => ({
                      ...prev,
                      enabled: e.target.checked
                    }))}
                    className="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
                  />
                  <span className="text-white">Enable Auto-Bid</span>
                </label>
                {autoBidSettings.enabled && (
                  <>
                    <div>
                      <label className="text-sm text-gray-400">Max Bid Amount</label>
                      <input
                        type="number"
                        value={autoBidSettings.maxBid}
                        onChange={(e) => setAutoBidSettings(prev => ({
                          ...prev,
                          maxBid: parseInt(e.target.value) || 0
                        }))}
                        className="w-full mt-1 px-3 py-2 bg-gray-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="text-xs text-yellow-400">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Auto-bid will only trigger for selected target player
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Strategy Tips */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h3 
                onClick={() => setShowStrategy(!showStrategy)}
                className="text-xl font-bold text-white mb-4 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  Strategy Tips
                </span>
                <span className="text-sm text-gray-400">
                  {showStrategy ? '−' : '+'}
                </span>
              </h3>
              {showStrategy && (
                <div className="space-y-2 text-sm text-gray-300">
                  <p>• Save at least $1 for each remaining roster spot</p>
                  <p>• Target 2-3 studs, then focus on value</p>
                  <p>• Don&apos;t overpay early - prices often drop</p>
                  <p>• Nominate expensive players you don&apos;t want</p>
                  <p>• Track other teams&apos; needs and budgets</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}