'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
// Drag and drop temporarily disabled for type compatibility
import {
  ArrowLeft,
  Save,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Shield,
  Info,
  ArrowUpDown,
  Zap
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  photo: string;
  status: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'ir';
  projectedPoints: number;
  actualPoints?: number;
  byeWeek: number;
  trend?: 'up' | 'down' | 'neutral';
  lastWeekPoints?: number;
  seasonAvg?: number;
  opponent?: string;
  gameTime?: string;
}

interface RosterSlot {
  position: string;
  player: Player | null;
  locked: boolean;
}

// Player Card Component
function PlayerCard({ player, isStarter }: { player: Player; isStarter: boolean }) {

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'questionable': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'doubtful': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'out': return 'bg-red-100 text-red-800 border-red-200';
      case 'ir': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch(trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold">{player.position}</span>
            </div>
            {player.status !== 'healthy' && (
              <div className="absolute -top-1 -right-1">
                {player.status === 'questionable' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                {player.status === 'doubtful' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                {player.status === 'out' && <X className="w-4 h-4 text-red-500" />}
                {player.status === 'ir' && <Shield className="w-4 h-4 text-purple-500" />}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{player.name}</h3>
              {getTrendIcon(player.trend)}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-600">{player.team}</span>
              {player.opponent && (
                <>
                  <span className="text-gray-400">vs</span>
                  <span className="text-sm text-gray-600">{player.opponent}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(player.status)}`}>
                {player.status.toUpperCase()}
              </span>
              {player.byeWeek === 12 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  BYE
                </span>
              )}
              {player.gameTime && (
                <span className="text-xs text-gray-500">{player.gameTime}</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{player.projectedPoints}</div>
          <div className="text-xs text-gray-500">PROJ PTS</div>
          {player.seasonAvg && (
            <div className="text-sm text-gray-600 mt-1">Avg: {player.seasonAvg}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mock data with real NFL players
const initialRoster: Player[] = [
  { id: '1', name: 'Dak Prescott', position: 'QB', team: 'DAL', photo: '/players/dak.jpg', status: 'healthy', projectedPoints: 22.5, trend: 'up', seasonAvg: 21.3, opponent: 'WAS', gameTime: 'Thu 4:30', byeWeek: 7 },
  { id: '2', name: 'Breece Hall', position: 'RB', team: 'NYJ', photo: '/players/breece.jpg', status: 'healthy', projectedPoints: 16.8, trend: 'up', seasonAvg: 15.2, opponent: 'MIA', gameTime: 'Fri 3:00', byeWeek: 10 },
  { id: '3', name: 'Kenneth Walker', position: 'RB', team: 'SEA', photo: '/players/walker.jpg', status: 'questionable', projectedPoints: 14.2, trend: 'down', seasonAvg: 13.8, opponent: 'SF', gameTime: 'Thu 8:20', byeWeek: 5 },
  { id: '4', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', photo: '/players/ceedee.jpg', status: 'healthy', projectedPoints: 18.4, trend: 'up', seasonAvg: 17.9, opponent: 'WAS', gameTime: 'Thu 4:30', byeWeek: 7 },
  { id: '5', name: 'AJ Brown', position: 'WR', team: 'PHI', photo: '/players/ajbrown.jpg', status: 'healthy', projectedPoints: 17.2, trend: 'neutral', seasonAvg: 16.5, opponent: 'BUF', gameTime: 'Sun 4:25', byeWeek: 10 },
  { id: '6', name: 'Sam LaPorta', position: 'TE', team: 'DET', photo: '/players/laporta.jpg', status: 'healthy', projectedPoints: 11.5, trend: 'up', seasonAvg: 10.8, opponent: 'GB', gameTime: 'Thu 12:30', byeWeek: 9 },
  { id: '7', name: 'Chris Olave', position: 'WR', team: 'NO', photo: '/players/olave.jpg', status: 'healthy', projectedPoints: 13.8, trend: 'neutral', seasonAvg: 13.2, opponent: 'ATL', gameTime: 'Sun 1:00', byeWeek: 11 },
  { id: '8', name: 'Justin Tucker', position: 'K', team: 'BAL', photo: '/players/tucker.jpg', status: 'healthy', projectedPoints: 8.5, seasonAvg: 8.8, opponent: 'LAC', gameTime: 'Sun 8:20', byeWeek: 13 },
  { id: '9', name: 'San Francisco', position: 'DEF', team: 'SF', photo: '/teams/sf.jpg', status: 'healthy', projectedPoints: 9.0, seasonAvg: 8.5, opponent: 'SEA', gameTime: 'Thu 8:20', byeWeek: 9 }
];

const initialBench: Player[] = [
  { id: '10', name: 'Calvin Ridley', position: 'WR', team: 'TEN', photo: '/players/ridley.jpg', status: 'healthy', projectedPoints: 12.3, trend: 'up', seasonAvg: 11.5, opponent: 'HOU', gameTime: 'Sun 1:00', byeWeek: 5 },
  { id: '11', name: 'James Cook', position: 'RB', team: 'BUF', photo: '/players/cook.jpg', status: 'healthy', projectedPoints: 11.8, trend: 'up', seasonAvg: 11.2, opponent: 'PHI', gameTime: 'Sun 4:25', byeWeek: 13 },
  { id: '12', name: 'Drake London', position: 'WR', team: 'ATL', photo: '/players/london.jpg', status: 'healthy', projectedPoints: 10.5, trend: 'neutral', seasonAvg: 10.1, opponent: 'NO', gameTime: 'Sun 1:00', byeWeek: 11 },
  { id: '13', name: 'Dalton Kincaid', position: 'TE', team: 'BUF', photo: '/players/kincaid.jpg', status: 'healthy', projectedPoints: 8.2, trend: 'down', seasonAvg: 8.8, opponent: 'PHI', gameTime: 'Sun 4:25', byeWeek: 13 },
  { id: '14', name: 'Jared Goff', position: 'QB', team: 'DET', photo: '/players/goff.jpg', status: 'healthy', projectedPoints: 18.5, trend: 'neutral', seasonAvg: 19.2, opponent: 'GB', gameTime: 'Thu 12:30', byeWeek: 9 },
  { id: '15', name: 'Tyler Bass', position: 'K', team: 'BUF', photo: '/players/bass.jpg', status: 'healthy', projectedPoints: 7.5, seasonAvg: 7.8, opponent: 'PHI', gameTime: 'Sun 4:25', byeWeek: 13 }
];

const positionRequirements = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  FLEX: 1, // RB/WR/TE
  K: 1,
  DEF: 1
};

export default function RosterManagement() {
  const params = useParams();
  const router = useRouter();
  const [starters, setStarters] = useState<Player[]>(initialRoster);
  const [bench, setBench] = useState<Player[]>(initialBench);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [showCoachTips, setShowCoachTips] = useState(true);

  // Drag and drop functionality temporarily disabled
  // const handleDragEnd = (result: DropResult) => {
  //   // Implementation removed for type compatibility
  // };

  const handleQuickSwap = (starterId: string, benchId: string) => {
    const starter = starters.find(p => p.id === starterId);
    const benchPlayer = bench.find(p => p.id === benchId);
    
    if (starter && benchPlayer) {
      setStarters(prev => prev.map(p => p.id === starterId ? benchPlayer : p));
      setBench(prev => prev.map(p => p.id === benchId ? starter : p));
      setHasChanges(true);
    }
  };

  const handleOptimizeLineup = async () => {
    setOptimizing(true);
    // Simulate AI optimization
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Sort all players by projected points
    const allPlayers = [...starters, ...bench];
    const sortedPlayers = allPlayers.sort((a, b) => b.projectedPoints - a.projectedPoints);
    
    // Fill positions based on requirements
    const newStarters: Player[] = [];
    const newBench: Player[] = [];
    const positionsFilled: Record<string, number> = {
      QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, K: 0, DEF: 0
    };

    sortedPlayers.forEach(player => {
      let added = false;
      
      // Check primary position
      if (positionsFilled[player.position] < (positionRequirements[player.position as keyof typeof positionRequirements] || 0)) {
        newStarters.push(player);
        positionsFilled[player.position]++;
        added = true;
      }
      // Check FLEX eligibility
      else if (!added && ['RB', 'WR', 'TE'].includes(player.position) && positionsFilled.FLEX < positionRequirements.FLEX) {
        newStarters.push(player);
        positionsFilled.FLEX++;
        added = true;
      }
      
      if (!added) {
        newBench.push(player);
      }
    });

    setStarters(newStarters);
    setBench(newBench);
    setHasChanges(true);
    setOptimizing(false);
  };

  const handleSaveLineup = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setHasChanges(false);
  };

  const getPositionCount = (position: string) => {
    return starters.filter(p => p.position === position).length;
  };

  const getFlexCount = () => {
    const rbCount = getPositionCount('RB');
    const wrCount = getPositionCount('WR');
    const teCount = getPositionCount('TE');
    
    const extraRB = Math.max(0, rbCount - positionRequirements.RB);
    const extraWR = Math.max(0, wrCount - positionRequirements.WR);
    const extraTE = Math.max(0, teCount - positionRequirements.TE);
    
    return extraRB + extraWR + extraTE;
  };

  const isLineupValid = () => {
    return getPositionCount('QB') === positionRequirements.QB &&
           getPositionCount('RB') >= positionRequirements.RB &&
           getPositionCount('WR') >= positionRequirements.WR &&
           getPositionCount('TE') >= positionRequirements.TE &&
           getPositionCount('K') === positionRequirements.K &&
           getPositionCount('DEF') === positionRequirements.DEF &&
           getFlexCount() >= positionRequirements.FLEX;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/team/${params.id}`}>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Manage Roster</h1>
                <p className="text-sm text-gray-500">Drag players to set your optimal lineup</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <span className="text-sm text-orange-600 font-medium flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Unsaved Changes
                </span>
              )}
              <button
                onClick={() => {
                  setStarters(initialRoster);
                  setBench(initialBench);
                  setHasChanges(false);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </button>
              <button
                onClick={handleOptimizeLineup}
                disabled={optimizing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center disabled:opacity-50"
              >
                <Zap className="w-4 h-4 mr-2" />
                {optimizing ? 'Optimizing...' : 'Auto-Optimize'}
              </button>
              <button
                onClick={handleSaveLineup}
                disabled={!hasChanges || saving || !isLineupValid()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Lineup'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Roster */}
          <div className="lg:col-span-2 space-y-6">
            {/* Position Requirements */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold mb-4">Position Requirements</h2>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(positionRequirements).map(([pos, req]) => {
                  const current = pos === 'FLEX' ? getFlexCount() : getPositionCount(pos);
                  const isValid = current >= req;
                  
                  return (
                    <div key={pos} className="text-center">
                      <div className={`text-2xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {current}/{req}
                      </div>
                      <div className="text-sm text-gray-600">{pos}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Starting Lineup */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Starting Lineup</h2>
                <div className="text-sm text-gray-500">
                  Total Projected: <span className="font-bold text-gray-900">
                    {starters.reduce((sum, p) => sum + p.projectedPoints, 0).toFixed(1)} pts
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {starters.map((player) => (
                  <PlayerCard key={player.id} player={player} isStarter={true} />
                ))}
              </div>
            </div>

            {/* Bench */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Bench</h2>
                <div className="text-sm text-gray-500">
                  {bench.length} players
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bench.map((player) => (
                  <PlayerCard key={player.id} player={player} isStarter={false} />
                ))}
              </div>
            </div>

            {/* IR Slots */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Injured Reserve (IR)</h2>
                <span className="text-sm text-gray-500">0/2 slots used</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((slot) => (
                  <div key={slot} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400">
                    <Shield className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Empty IR Slot</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Coach Tips */}
            {showCoachTips && (
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Coach Tips</h3>
                  <button 
                    onClick={() => setShowCoachTips(false)}
                    className="text-white/70 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Lineup Alert</p>
                    <p className="text-xs opacity-90">Kenneth Walker is questionable. Consider starting James Cook instead.</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Matchup Advantage</p>
                    <p className="text-xs opacity-90">Calvin Ridley has a great matchup vs HOU. Consider flexing him.</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Weather Impact</p>
                    <p className="text-xs opacity-90">Heavy rain expected for SF vs SEA. May impact passing game.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Swaps */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Quick Swaps</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">RB Swap</span>
                    <button
                      onClick={() => handleQuickSwap('3', '11')}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Swap
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    Kenneth Walker (Q) ↔ James Cook
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">FLEX Upgrade</span>
                    <button
                      onClick={() => handleQuickSwap('7', '10')}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Swap
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    Chris Olave ↔ Calvin Ridley
                  </div>
                </div>
              </div>
            </div>

            {/* Projected Score Comparison */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Projected Score Impact</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Lineup</span>
                  <span className="text-lg font-bold">
                    {starters.reduce((sum, p) => sum + p.projectedPoints, 0).toFixed(1)} pts
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Optimized Lineup</span>
                  <span className="text-lg font-bold text-green-600">
                    +3.2 pts
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Win Probability</span>
                    <span className="text-lg font-bold text-green-600">68% → 72%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lineup Notes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Lineup Notes</h3>
              <textarea
                className="w-full p-3 border rounded-lg text-sm resize-none"
                rows={4}
                placeholder="Add notes about your lineup decisions..."
                onChange={() => setHasChanges(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}