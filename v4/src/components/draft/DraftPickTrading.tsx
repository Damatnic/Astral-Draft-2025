'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Calendar, TrendingUp, AlertTriangle, CheckCircle, XCircle, Package, Send, Target } from 'lucide-react';

interface DraftPickTradingProps {
  leagueId: string;
  teamId: string;
  userId: string;
  currentYear: number;
}

interface DraftPick {
  round: number;
  year: number;
  originalOwner: string;
  currentOwner: string;
  value: number;
  isTradable: boolean;
}

interface Team {
  id: string;
  name: string;
  owner: string;
  record: { wins: number; losses: number };
  projectedFinish: number;
}

interface TradeOffer {
  id: string;
  fromTeam: Team;
  toTeam: Team;
  givingPicks: DraftPick[];
  receivingPicks: DraftPick[];
  givingPlayers?: any[];
  receivingPlayers?: any[];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  fairnessScore: number;
  createdAt: Date;
  expiresAt: Date;
}

const PICK_VALUES: Record<number, number> = {
  1: 100, 2: 85, 3: 72, 4: 61, 5: 52,
  6: 44, 7: 37, 8: 31, 9: 26, 10: 22,
  11: 18, 12: 15, 13: 12, 14: 10, 15: 8, 16: 6,
};

export default function DraftPickTrading({
  leagueId,
  teamId,
  userId,
  currentYear,
}: DraftPickTradingProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [myPicks, setMyPicks] = useState<DraftPick[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [theirPicks, setTheirPicks] = useState<DraftPick[]>([]);
  const [selectedGiving, setSelectedGiving] = useState<Set<string>>(new Set());
  const [selectedReceiving, setSelectedReceiving] = useState<Set<string>>(new Set());
  const [activeOffers, setActiveOffers] = useState<TradeOffer[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [tradeNotes, setTradeNotes] = useState('');
  const [viewMode, setViewMode] = useState<'create' | 'pending' | 'history'>('create');

  // Load teams and picks
  useEffect(() => {
    // Mock data - would fetch from API
    const mockTeams: Team[] = [
      { id: '1', name: 'Team Alpha', owner: 'John', record: { wins: 8, losses: 2 }, projectedFinish: 2 },
      { id: '2', name: 'Team Beta', owner: 'Sarah', record: { wins: 6, losses: 4 }, projectedFinish: 5 },
      { id: '3', name: 'Team Gamma', owner: 'Mike', record: { wins: 4, losses: 6 }, projectedFinish: 8 },
    ].filter(t => t.id !== teamId);
    
    setTeams(mockTeams);

    // Generate my picks
    const picks: DraftPick[] = [];
    for (let year = currentYear; year <= currentYear + 2; year++) {
      for (let round = 1; round <= 16; round++) {
        picks.push({
          round,
          year,
          originalOwner: teamId,
          currentOwner: teamId,
          value: calculatePickValue(round, year, currentYear),
          isTradable: true,
        });
      }
    }
    setMyPicks(picks);
  }, [currentYear, teamId]);

  // Load selected team's picks
  useEffect(() => {
    if (!selectedTeam) {
      setTheirPicks([]);
      return;
    }

    // Generate their picks
    const picks: DraftPick[] = [];
    for (let year = currentYear; year <= currentYear + 2; year++) {
      for (let round = 1; round <= 16; round++) {
        picks.push({
          round,
          year,
          originalOwner: selectedTeam.id,
          currentOwner: selectedTeam.id,
          value: calculatePickValue(round, year, currentYear, selectedTeam.projectedFinish),
          isTradable: true,
        });
      }
    }
    setTheirPicks(picks);
  }, [selectedTeam, currentYear]);

  // Calculate pick value with future discount
  const calculatePickValue = (
    round: number, 
    year: number, 
    currentYear: number,
    projectedFinish: number = 5
  ): number => {
    let baseValue = PICK_VALUES[round] || 0;
    
    // Adjust for team strength (better teams have later picks)
    const positionMultiplier = 1 + (5 - projectedFinish) * 0.02;
    baseValue *= positionMultiplier;
    
    // Discount future picks
    const yearDiff = year - currentYear;
    const discount = Math.pow(0.85, yearDiff);
    
    return Math.round(baseValue * discount);
  };

  // Toggle pick selection
  const togglePick = (pickId: string, type: 'giving' | 'receiving') => {
    const set = type === 'giving' ? selectedGiving : selectedReceiving;
    const newSet = new Set(set);
    
    if (newSet.has(pickId)) {
      newSet.delete(pickId);
    } else {
      newSet.add(pickId);
    }
    
    if (type === 'giving') {
      setSelectedGiving(newSet);
    } else {
      setSelectedReceiving(newSet);
    }
  };

  // Calculate trade fairness
  const calculateFairness = useMemo(() => {
    let givingValue = 0;
    let receivingValue = 0;

    selectedGiving.forEach(pickId => {
      const [year, round] = pickId.split('-').map(Number);
      const pick = myPicks.find(p => p.year === year && p.round === round);
      if (pick) givingValue += pick.value;
    });

    selectedReceiving.forEach(pickId => {
      const [year, round] = pickId.split('-').map(Number);
      const pick = theirPicks.find(p => p.year === year && p.round === round);
      if (pick) receivingValue += pick.value;
    });

    const fairnessScore = givingValue > 0 ? (receivingValue / givingValue) * 100 : 0;
    
    return {
      givingValue,
      receivingValue,
      fairnessScore,
      differential: receivingValue - givingValue,
      rating: 
        fairnessScore >= 95 && fairnessScore <= 105 ? 'FAIR' :
        fairnessScore >= 85 && fairnessScore <= 115 ? 'REASONABLE' :
        fairnessScore < 85 ? 'BAD_FOR_YOU' :
        'BAD_FOR_THEM',
    };
  }, [selectedGiving, selectedReceiving, myPicks, theirPicks]);

  // Send trade offer
  const sendTradeOffer = () => {
    if (!selectedTeam || selectedGiving.size === 0 || selectedReceiving.size === 0) return;

    const offer: TradeOffer = {
      id: `trade_${Date.now()}`,
      fromTeam: { id: teamId, name: 'Your Team', owner: 'You', record: { wins: 0, losses: 0 }, projectedFinish: 5 },
      toTeam: selectedTeam,
      givingPicks: Array.from(selectedGiving).map(pickId => {
        const [year, round] = pickId.split('-').map(Number);
        return myPicks.find(p => p.year === year && p.round === round)!;
      }),
      receivingPicks: Array.from(selectedReceiving).map(pickId => {
        const [year, round] = pickId.split('-').map(Number);
        return theirPicks.find(p => p.year === year && p.round === round)!;
      }),
      status: 'PENDING',
      fairnessScore: calculateFairness.fairnessScore,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    };

    setActiveOffers(prev => [...prev, offer]);
    
    // Reset selection
    setSelectedGiving(new Set());
    setSelectedReceiving(new Set());
    setTradeNotes('');
    setViewMode('pending');
  };

  // Render pick grid
  const renderPickGrid = (picks: DraftPick[], selected: Set<string>, type: 'giving' | 'receiving') => {
    const picksByYear = picks.reduce((acc, pick) => {
      if (!acc[pick.year]) acc[pick.year] = [];
      acc[pick.year].push(pick);
      return acc;
    }, {} as Record<number, DraftPick[]>);

    return (
      <div className="space-y-4">
        {Object.entries(picksByYear).map(([year, yearPicks]) => (
          <div key={year}>
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              {year} Draft
            </h4>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {yearPicks.map(pick => {
                const pickId = `${pick.year}-${pick.round}`;
                const isSelected = selected.has(pickId);
                const isOwned = pick.currentOwner === (type === 'giving' ? teamId : selectedTeam?.id);
                
                return (
                  <button
                    key={pickId}
                    onClick={() => isOwned && togglePick(pickId, type)}
                    disabled={!isOwned || !pick.isTradable}
                    className={`p-2 rounded-lg text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : isOwned
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div>R{pick.round}</div>
                    <div className="text-xs opacity-75">({pick.value})</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-purple-500/30">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <ArrowLeftRight className="w-8 h-8 text-purple-400" />
            Draft Pick Trading
          </h1>
          
          {/* View Mode Tabs */}
          <div className="flex gap-2">
            {['create', 'pending', 'history'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === mode
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {mode === 'create' && 'Create Trade'}
                {mode === 'pending' && `Pending (${activeOffers.filter(o => o.status === 'PENDING').length})`}
                {mode === 'history' && 'Trade History'}
              </button>
            ))}
          </div>
        </div>

        {/* Create Trade View */}
        {viewMode === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trade Builder */}
            <div className="lg:col-span-2 space-y-6">
              {/* Team Selection */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Select Trading Partner</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {teams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className={`p-4 rounded-lg text-left transition-all ${
                        selectedTeam?.id === team.id
                          ? 'bg-purple-600/30 border-2 border-purple-500'
                          : 'bg-gray-900/50 border-2 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-semibold text-white">{team.name}</div>
                      <div className="text-sm text-gray-400">
                        {team.owner} • {team.record.wins}-{team.record.losses}
                      </div>
                      <div className="text-xs text-purple-400 mt-1">
                        Projected finish: #{team.projectedFinish}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedTeam && (
                <>
                  {/* Your Picks */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">
                      Your Picks to Trade
                      {selectedGiving.size > 0 && (
                        <span className="ml-2 text-sm text-purple-400">
                          ({selectedGiving.size} selected)
                        </span>
                      )}
                    </h3>
                    {renderPickGrid(myPicks, selectedGiving, 'giving')}
                  </div>

                  {/* Their Picks */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">
                      {selectedTeam.name}'s Picks to Receive
                      {selectedReceiving.size > 0 && (
                        <span className="ml-2 text-sm text-purple-400">
                          ({selectedReceiving.size} selected)
                        </span>
                      )}
                    </h3>
                    {renderPickGrid(theirPicks, selectedReceiving, 'receiving')}
                  </div>

                  {/* Trade Notes */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">Trade Notes (Optional)</h3>
                    <textarea
                      value={tradeNotes}
                      onChange={(e) => setTradeNotes(e.target.value)}
                      placeholder="Add any notes or context for this trade..."
                      className="w-full h-24 px-4 py-3 bg-gray-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Trade Analysis Sidebar */}
            <div className="space-y-6">
              {/* Fairness Analysis */}
              {(selectedGiving.size > 0 || selectedReceiving.size > 0) && (
                <div className="bg-gradient-to-br from-purple-800/50 to-blue-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/50">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                    Trade Analysis
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Value Comparison */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">You Give</span>
                        <span className="text-white font-bold">{calculateFairness.givingValue} pts</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">You Get</span>
                        <span className="text-white font-bold">{calculateFairness.receivingValue} pts</span>
                      </div>
                      <div className="h-px bg-gray-700 my-2" />
                      <div className="flex justify-between">
                        <span className="text-gray-400">Net Value</span>
                        <span className={`font-bold ${
                          calculateFairness.differential > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {calculateFairness.differential > 0 ? '+' : ''}{calculateFairness.differential} pts
                        </span>
                      </div>
                    </div>

                    {/* Fairness Meter */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Fairness Score</span>
                        <span className="text-white">{Math.round(calculateFairness.fairnessScore)}%</span>
                      </div>
                      <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            calculateFairness.rating === 'FAIR' ? 'bg-green-500' :
                            calculateFairness.rating === 'REASONABLE' ? 'bg-yellow-500' :
                            calculateFairness.rating === 'BAD_FOR_YOU' ? 'bg-red-500' :
                            'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(100, calculateFairness.fairnessScore)}%` }}
                        />
                      </div>
                    </div>

                    {/* Rating */}
                    <div className={`p-3 rounded-lg text-center ${
                      calculateFairness.rating === 'FAIR' ? 'bg-green-500/20 text-green-400' :
                      calculateFairness.rating === 'REASONABLE' ? 'bg-yellow-500/20 text-yellow-400' :
                      calculateFairness.rating === 'BAD_FOR_YOU' ? 'bg-red-500/20 text-red-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {calculateFairness.rating === 'FAIR' && 'Fair Trade'}
                      {calculateFairness.rating === 'REASONABLE' && 'Reasonable Trade'}
                      {calculateFairness.rating === 'BAD_FOR_YOU' && 'Bad Deal for You'}
                      {calculateFairness.rating === 'BAD_FOR_THEM' && 'They Might Reject'}
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={sendTradeOffer}
                      disabled={selectedGiving.size === 0 || selectedReceiving.size === 0}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Send Trade Offer
                    </button>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-3">Trading Tips</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-purple-400 mt-0.5" />
                    <span>Future picks lose ~15% value per year</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-purple-400 mt-0.5" />
                    <span>Team strength affects pick value</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-purple-400 mt-0.5" />
                    <span>Consider roster needs when trading</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-purple-400 mt-0.5" />
                    <span>Multiple late picks ≈ one early pick</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Pending Trades View */}
        {viewMode === 'pending' && (
          <div className="space-y-4">
            {activeOffers.filter(o => o.status === 'PENDING').map(offer => (
              <div key={offer.id} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Trade with {offer.toTeam.name}
                    </h3>
                    <div className="text-sm text-gray-400 mt-1">
                      Expires in {Math.round((offer.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))} hours
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    offer.fairnessScore >= 95 && offer.fairnessScore <= 105
                      ? 'bg-green-500/20 text-green-400'
                      : offer.fairnessScore < 95
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {Math.round(offer.fairnessScore)}% Fair
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm text-gray-400 mb-2">You Give</h4>
                    <div className="space-y-1">
                      {offer.givingPicks.map((pick, idx) => (
                        <div key={idx} className="text-white">
                          {pick.year} Round {pick.round}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm text-gray-400 mb-2">You Get</h4>
                    <div className="space-y-1">
                      {offer.receivingPicks.map((pick, idx) => (
                        <div key={idx} className="text-white">
                          {pick.year} Round {pick.round}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ))}

            {activeOffers.filter(o => o.status === 'PENDING').length === 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-12 border border-gray-700 text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No pending trades</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}