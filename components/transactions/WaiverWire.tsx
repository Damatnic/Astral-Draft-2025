/**
 * Waiver Wire Component
 * Manages free agent pickups and waiver claims
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '../../hooks/useAppState';
import { useLeague } from '../../hooks/useLeague';
import { players } from '../../data/players';
import { Player } from '../../types';
import { Search, Plus, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface WaiverClaim {
  id: string;
  playerId: number;
  teamId: number;
  bidAmount: number;
  priority: number;
  status: 'pending' | 'processed' | 'failed';
  timestamp: Date;
}

export const WaiverWire: React.FC = () => {
  const { state, dispatch } = useAppState();
  const { league, myTeam } = useLeague();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [bidAmount, setBidAmount] = React.useState(0);
  const [showBidModal, setShowBidModal] = React.useState(false);
  
  // Get available free agents
  const freeAgents = React.useMemo(() => {
    if (!league) return [];
    
    const rosteredPlayerIds = new Set(
      league.teams.flatMap(team => team.roster.map(p => p.id))
    );
    
    return players.filter(p => !rosteredPlayerIds.has(p.id));
  }, [league]);
  
  // Filter free agents based on search
  const filteredPlayers = React.useMemo(() => {
    if (!searchQuery) return freeAgents.slice(0, 50);
    
    const query = searchQuery.toLowerCase();
    return freeAgents.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.team.toLowerCase().includes(query) ||
      p.position.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [freeAgents, searchQuery]);
  
  // Get trending players (mock data for now)
  const trendingPlayers = React.useMemo(() => {
    return freeAgents
      .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
      .slice(0, 5);
  }, [freeAgents]);
  
  const handleAddPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setBidAmount(Math.min(10, myTeam?.faabBudget || 0));
    setShowBidModal(true);
  };
  
  const submitWaiverClaim = () => {
    if (!selectedPlayer || !myTeam || !league) return;
    
    const claim: WaiverClaim = {
      id: Date.now().toString(),
      playerId: selectedPlayer.id,
      teamId: myTeam.id,
      bidAmount,
      priority: 1,
      status: 'pending',
      timestamp: new Date()
    };
    
    dispatch({
      type: 'ADD_WAIVER_CLAIM',
      payload: {
        leagueId: league.id,
        claim
      }
    });
    
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: `Waiver claim submitted for ${selectedPlayer.name} ($${bidAmount})`,
        type: 'SUCCESS'
      }
    });
    
    setShowBidModal(false);
    setSelectedPlayer(null);
  };
  
  const getFAABRemaining = () => {
    return myTeam?.faabBudget || 0;
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Waiver Wire</h2>
          <p className="text-[var(--text-secondary)]">
            FAAB Remaining: ${getFAABRemaining()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm text-[var(--text-secondary)]">
            Waivers process: Wed 3:00 AM ET
          </span>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
        <input
          type="text"
          placeholder="Search free agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)] focus:border-cyan-400 focus:outline-none"
        />
      </div>
      
      {/* Trending Players */}
      <div className="bg-[var(--panel-bg)] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-[var(--text-primary)]">Trending Players</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {trendingPlayers.map(player => (
            <button
              key={player.id}
              onClick={() => handleAddPlayer(player)}
              className="p-2 bg-black/20 rounded hover:bg-black/30 transition-colors text-left"
            >
              <div className="font-medium text-sm text-[var(--text-primary)]">
                {player.name}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {player.position} - {player.team}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Free Agents List */}
      <div className="bg-[var(--panel-bg)] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--panel-border)]">
              <th className="text-left p-3 text-xs font-medium text-[var(--text-secondary)]">PLAYER</th>
              <th className="text-left p-3 text-xs font-medium text-[var(--text-secondary)]">POS</th>
              <th className="text-left p-3 text-xs font-medium text-[var(--text-secondary)]">TEAM</th>
              <th className="text-center p-3 text-xs font-medium text-[var(--text-secondary)]">PROJ PTS</th>
              <th className="text-center p-3 text-xs font-medium text-[var(--text-secondary)]">% ROSTERED</th>
              <th className="text-center p-3 text-xs font-medium text-[var(--text-secondary)]">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(player => (
              <tr key={player.id} className="border-b border-[var(--panel-border)] hover:bg-white/5">
                <td className="p-3">
                  <div className="font-medium text-[var(--text-primary)]">{player.name}</div>
                </td>
                <td className="p-3 text-[var(--text-secondary)]">{player.position}</td>
                <td className="p-3 text-[var(--text-secondary)]">{player.team}</td>
                <td className="p-3 text-center text-[var(--text-primary)]">
                  {player.projectedPoints?.toFixed(1)}
                </td>
                <td className="p-3 text-center text-[var(--text-secondary)]">
                  {Math.floor(Math.random() * 40)}%
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleAddPlayer(player)}
                    className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Bid Modal */}
      {showBidModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--panel-bg)] rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              Submit Waiver Claim
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/20 rounded p-3">
                <div className="font-medium text-[var(--text-primary)]">
                  {selectedPlayer.name}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  {selectedPlayer.position} - {selectedPlayer.team}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  FAAB Bid Amount
                </label>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[var(--text-secondary)]" />
                  <input
                    type="number"
                    min="0"
                    max={getFAABRemaining()}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-black/20 border border-[var(--panel-border)] rounded text-[var(--text-primary)]"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">
                    / ${getFAABRemaining()}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBidModal(false)}
                  className="flex-1 px-4 py-2 border border-[var(--panel-border)] rounded text-[var(--text-primary)] hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={submitWaiverClaim}
                  className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
                >
                  Submit Claim
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WaiverWire;