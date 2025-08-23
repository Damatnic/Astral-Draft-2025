'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, TrendingUp, Calendar, DollarSign, Award, Lock, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface KeeperSelectionProps {
  leagueId: string;
  teamId: string;
  maxKeepers: number;
  keeperRules: 'ROUND_PENALTY' | 'AUCTION_INCREASE' | 'FIXED_ROUNDS';
  roundPenalty?: number;
  auctionIncrease?: number;
  deadline: Date;
  onSubmit: (keepers: KeeperChoice[]) => void;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  draftedRound?: number;
  draftedCost?: number;
  currentRank: number;
  projectedPoints: number;
  lastYearPoints: number;
  gamesPlayed: number;
  imageUrl?: string;
}

interface KeeperChoice {
  playerId: string;
  cost: number;
  round: number;
}

interface KeeperAnalysis {
  value: number;
  recommendation: 'MUST_KEEP' | 'SHOULD_KEEP' | 'CONSIDER' | 'AVOID';
  reasons: string[];
}

export default function KeeperSelection({
  leagueId,
  teamId,
  maxKeepers,
  keeperRules,
  roundPenalty = 2,
  auctionIncrease = 5,
  deadline,
  onSubmit,
}: KeeperSelectionProps) {
  const [eligiblePlayers, setEligiblePlayers] = useState<Player[]>([]);
  const [selectedKeepers, setSelectedKeepers] = useState<Set<string>>(new Set());
  const [keeperCosts, setKeeperCosts] = useState<Map<string, KeeperChoice>>(new Map());
  const [showAnalysis, setShowAnalysis] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'value' | 'round' | 'points'>('value');
  const [filterPosition, setFilterPosition] = useState<string>('ALL');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Load eligible players
  useEffect(() => {
    // Mock data - would fetch from API
    const mockPlayers: Player[] = [
      {
        id: '1',
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        draftedRound: 1,
        currentRank: 1,
        projectedPoints: 380,
        lastYearPoints: 395,
        gamesPlayed: 17,
      },
      {
        id: '2',
        name: 'CeeDee Lamb',
        position: 'WR',
        team: 'DAL',
        draftedRound: 3,
        currentRank: 5,
        projectedPoints: 320,
        lastYearPoints: 310,
        gamesPlayed: 17,
      },
      {
        id: '3',
        name: 'Amon-Ra St. Brown',
        position: 'WR',
        team: 'DET',
        draftedRound: 5,
        currentRank: 8,
        projectedPoints: 295,
        lastYearPoints: 288,
        gamesPlayed: 16,
      },
      {
        id: '4',
        name: 'Sam LaPorta',
        position: 'TE',
        team: 'DET',
        draftedRound: 10,
        currentRank: 15,
        projectedPoints: 210,
        lastYearPoints: 198,
        gamesPlayed: 17,
      },
      {
        id: '5',
        name: 'Puka Nacua',
        position: 'WR',
        team: 'LAR',
        draftedRound: 12,
        currentRank: 12,
        projectedPoints: 275,
        lastYearPoints: 265,
        gamesPlayed: 17,
      },
    ];

    setEligiblePlayers(mockPlayers);

    // Calculate keeper costs
    const costs = new Map<string, KeeperChoice>();
    mockPlayers.forEach(player => {
      const cost = calculateKeeperCost(player);
      costs.set(player.id, cost);
    });
    setKeeperCosts(costs);
  }, []);

  // Calculate keeper cost based on rules
  const calculateKeeperCost = (player: Player): KeeperChoice => {
    switch (keeperRules) {
      case 'ROUND_PENALTY':
        const newRound = Math.max(1, (player.draftedRound || 16) - roundPenalty);
        return {
          playerId: player.id,
          cost: 0,
          round: newRound,
        };
      
      case 'AUCTION_INCREASE':
        const newCost = (player.draftedCost || 1) + (player.draftedCost || 1) * (auctionIncrease / 100);
        return {
          playerId: player.id,
          cost: Math.round(newCost),
          round: 0,
        };
      
      case 'FIXED_ROUNDS':
        // Fixed round based on current rank
        const fixedRound = Math.ceil(player.currentRank / 12);
        return {
          playerId: player.id,
          cost: 0,
          round: Math.min(3, fixedRound),
        };
      
      default:
        return { playerId: player.id, cost: 0, round: 1 };
    }
  };

  // Analyze keeper value
  const analyzeKeeper = (player: Player): KeeperAnalysis => {
    const cost = keeperCosts.get(player.id);
    if (!cost) return { value: 0, recommendation: 'AVOID', reasons: [] };

    const reasons: string[] = [];
    let value = 0;

    // Calculate value based on projected rank vs keeper cost
    const expectedDraftPosition = player.currentRank;
    const keeperPosition = cost.round * 12; // Approximate pick number

    if (keeperRules === 'ROUND_PENALTY') {
      value = keeperPosition - expectedDraftPosition;
      
      if (value > 36) {
        reasons.push(`Exceptional value: ${Math.abs(value)} picks better than ADP`);
      } else if (value > 24) {
        reasons.push(`Great value: ${Math.abs(value)} picks better than ADP`);
      } else if (value > 12) {
        reasons.push(`Good value: ${Math.abs(value)} picks better than ADP`);
      } else if (value < -12) {
        reasons.push(`Poor value: ${Math.abs(value)} picks worse than ADP`);
      }
    }

    // Consider consistency
    if (player.gamesPlayed === 17) {
      reasons.push('Played all games last season');
      value += 5;
    } else if (player.gamesPlayed < 14) {
      reasons.push('Injury concerns - missed multiple games');
      value -= 10;
    }

    // Consider trajectory
    if (player.projectedPoints > player.lastYearPoints * 1.1) {
      reasons.push('Projected for breakout season');
      value += 10;
    } else if (player.projectedPoints < player.lastYearPoints * 0.9) {
      reasons.push('Projected regression');
      value -= 10;
    }

    // Position scarcity
    if (player.position === 'RB' && player.currentRank <= 10) {
      reasons.push('Elite RB - positional scarcity');
      value += 15;
    } else if (player.position === 'TE' && player.currentRank <= 3) {
      reasons.push('Elite TE - massive positional advantage');
      value += 20;
    }

    // Determine recommendation
    let recommendation: KeeperAnalysis['recommendation'];
    if (value > 30) {
      recommendation = 'MUST_KEEP';
    } else if (value > 15) {
      recommendation = 'SHOULD_KEEP';
    } else if (value > 0) {
      recommendation = 'CONSIDER';
    } else {
      recommendation = 'AVOID';
    }

    return { value, recommendation, reasons };
  };

  // Toggle keeper selection
  const toggleKeeper = (playerId: string) => {
    const newSelected = new Set(selectedKeepers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else if (newSelected.size < maxKeepers) {
      newSelected.add(playerId);
    }
    setSelectedKeepers(newSelected);
  };

  // Submit keeper selections
  const handleSubmit = () => {
    const keepers: KeeperChoice[] = Array.from(selectedKeepers).map(playerId => 
      keeperCosts.get(playerId)!
    );
    onSubmit(keepers);
    setConfirmSubmit(false);
  };

  // Filter and sort players
  const displayPlayers = useMemo(() => {
    let filtered = eligiblePlayers;
    
    if (filterPosition !== 'ALL') {
      filtered = filtered.filter(p => p.position === filterPosition);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return analyzeKeeper(b).value - analyzeKeeper(a).value;
        case 'round':
          return (keeperCosts.get(a.id)?.round || 0) - (keeperCosts.get(b.id)?.round || 0);
        case 'points':
          return b.projectedPoints - a.projectedPoints;
        default:
          return 0;
      }
    });
  }, [eligiblePlayers, filterPosition, sortBy, keeperCosts]);

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours };
  }, [deadline]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              Keeper Selection
            </h1>
            <div className="text-right">
              <div className="text-sm text-gray-400">Deadline</div>
              <div className="text-white font-semibold">
                {timeRemaining.days} days, {timeRemaining.hours} hours
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Max Keepers</div>
              <div className="text-2xl font-bold text-white">{maxKeepers}</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Selected</div>
              <div className="text-2xl font-bold text-purple-400">
                {selectedKeepers.size} / {maxKeepers}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Keeper Rules</div>
              <div className="text-lg font-semibold text-white">
                {keeperRules === 'ROUND_PENALTY' && `Round -${roundPenalty}`}
                {keeperRules === 'AUCTION_INCREASE' && `+${auctionIncrease}%`}
                {keeperRules === 'FIXED_ROUNDS' && 'Fixed Rounds'}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm">Position:</label>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="px-3 py-1 bg-gray-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All</option>
                <option value="QB">QB</option>
                <option value="RB">RB</option>
                <option value="WR">WR</option>
                <option value="TE">TE</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 bg-gray-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="value">Best Value</option>
                <option value="round">Keeper Cost</option>
                <option value="points">Projected Points</option>
              </select>
            </div>
          </div>
        </div>

        {/* Player Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {displayPlayers.map((player) => {
            const cost = keeperCosts.get(player.id);
            const analysis = analyzeKeeper(player);
            const isSelected = selectedKeepers.has(player.id);

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected 
                    ? 'border-purple-500 shadow-lg shadow-purple-500/30' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {/* Recommendation Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                  analysis.recommendation === 'MUST_KEEP' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                  analysis.recommendation === 'SHOULD_KEEP' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
                  analysis.recommendation === 'CONSIDER' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                  'bg-red-500/20 text-red-400 border border-red-500/50'
                }`}>
                  {analysis.recommendation.replace('_', ' ')}
                </div>

                <div className="p-6">
                  {/* Player Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-1">{player.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm">
                        {player.position}
                      </span>
                      <span className="text-gray-400 text-sm">{player.team}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <div className="text-xs text-gray-500">Current Rank</div>
                      <div className="text-lg font-bold text-white">#{player.currentRank}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Projected Pts</div>
                      <div className="text-lg font-bold text-green-400">{player.projectedPoints}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Keeper Cost</div>
                      <div className="text-lg font-bold text-purple-400">
                        {keeperRules === 'AUCTION_INCREASE' ? `$${cost?.cost}` : `Round ${cost?.round}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Value Score</div>
                      <div className={`text-lg font-bold ${
                        analysis.value > 20 ? 'text-green-400' :
                        analysis.value > 0 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {analysis.value > 0 ? '+' : ''}{analysis.value.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Analysis Button */}
                  <button
                    onClick={() => setShowAnalysis(showAnalysis === player.id ? null : player.id)}
                    className="w-full mb-3 px-3 py-2 bg-gray-900/50 text-gray-300 rounded-lg hover:bg-gray-900/70 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    {showAnalysis === player.id ? 'Hide' : 'Show'} Analysis
                  </button>

                  {/* Analysis Details */}
                  <AnimatePresence>
                    {showAnalysis === player.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
                          <ul className="space-y-1">
                            {analysis.reasons.map((reason, idx) => (
                              <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                                <span className="text-purple-400 mt-0.5">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Select Button */}
                  <button
                    onClick={() => toggleKeeper(player.id)}
                    disabled={!isSelected && selectedKeepers.size >= maxKeepers}
                    className={`w-full px-4 py-3 rounded-lg font-bold transition-all ${
                      isSelected
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : selectedKeepers.size >= maxKeepers
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle className="w-5 h-5 inline mr-2" />
                        Selected as Keeper
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 inline mr-2" />
                        Select as Keeper
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Submit Section */}
        {selectedKeepers.size > 0 && (
          <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Selected Keepers Summary</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedKeepers).map(playerId => {
                    const player = eligiblePlayers.find(p => p.id === playerId);
                    const cost = keeperCosts.get(playerId);
                    return (
                      <div key={playerId} className="bg-gray-900/50 px-3 py-1 rounded-full text-sm text-white">
                        {player?.name} - {keeperRules === 'AUCTION_INCREASE' ? `$${cost?.cost}` : `R${cost?.round}`}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-2">
                  {selectedKeepers.size} of {maxKeepers} keepers selected
                </div>
                <button
                  onClick={() => setConfirmSubmit(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Submit Keepers
                </button>
              </div>
            </div>
            
            {selectedKeepers.size < maxKeepers && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                <p className="text-yellow-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  You can still select {maxKeepers - selectedKeepers.size} more keeper{maxKeepers - selectedKeepers.size !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmSubmit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setConfirmSubmit(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-purple-500/50"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-4">Confirm Keeper Selection</h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to submit these {selectedKeepers.size} keeper{selectedKeepers.size !== 1 ? 's' : ''}? 
                  This action cannot be undone after the deadline.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmSubmit(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Confirm Selection
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}