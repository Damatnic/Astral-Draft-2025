'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon, MinusIcon, ClockIcon, ArrowPathIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Zap, TrendingUp, TrendingDown, DollarSign, Shield, AlertCircle, Sparkles, Activity } from 'lucide-react';

interface WaiverClaim {
  id: string;
  priority: number;
  add: {
    player: string;
    team: string;
    position: string;
  };
  drop: {
    player: string;
    team: string;
    position: string;
  };
  status: 'pending' | 'processed' | 'success' | 'failed';
  processDate: string;
}

interface AvailablePlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  waiverStatus: 'free' | 'waivers';
  clearsDate?: string;
  addDrops: string;
  percentOwned: number;
  projectedPoints: number;
  trend: 'up' | 'down' | 'steady';
}

export default function WaiversPage() {
  const [activeTab, setActiveTab] = useState<'claims' | 'available' | 'faab' | 'history'>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<AvailablePlayer | null>(null);

  // Mock data
  const waiverClaims: WaiverClaim[] = [
    {
      id: '1',
      priority: 1,
      add: { player: 'Kyren Williams', team: 'LAR', position: 'RB' },
      drop: { player: 'Dameon Pierce', team: 'HOU', position: 'RB' },
      status: 'pending',
      processDate: 'Wed 3:00 AM'
    },
    {
      id: '2',
      priority: 2,
      add: { player: 'Tank Dell', team: 'HOU', position: 'WR' },
      drop: { player: 'Quentin Johnston', team: 'LAC', position: 'WR' },
      status: 'pending',
      processDate: 'Wed 3:00 AM'
    }
  ];

  const availablePlayers: AvailablePlayer[] = [
    {
      id: '1',
      name: 'Kyren Williams',
      team: 'LAR',
      position: 'RB',
      waiverStatus: 'waivers',
      clearsDate: 'Wed 3:00 AM',
      addDrops: '+8,234',
      percentOwned: 87.2,
      projectedPoints: 14.5,
      trend: 'up'
    },
    {
      id: '2',
      name: 'Tank Dell',
      team: 'HOU',
      position: 'WR',
      waiverStatus: 'waivers',
      clearsDate: 'Wed 3:00 AM',
      addDrops: '+5,123',
      percentOwned: 72.1,
      projectedPoints: 11.8,
      trend: 'up'
    },
    {
      id: '3',
      name: 'Trey McBride',
      team: 'ARI',
      position: 'TE',
      waiverStatus: 'free',
      addDrops: '+3,456',
      percentOwned: 65.3,
      projectedPoints: 9.2,
      trend: 'up'
    },
    {
      id: '4',
      name: 'Gus Edwards',
      team: 'LAC',
      position: 'RB',
      waiverStatus: 'free',
      addDrops: '-1,234',
      percentOwned: 42.1,
      projectedPoints: 7.8,
      trend: 'down'
    },
    {
      id: '5',
      name: 'Demario Douglas',
      team: 'NE',
      position: 'WR',
      waiverStatus: 'waivers',
      clearsDate: 'Wed 3:00 AM',
      addDrops: '+2,345',
      percentOwned: 38.5,
      projectedPoints: 8.9,
      trend: 'up'
    }
  ];

  const faabBudget = {
    remaining: 65,
    spent: 35,
    total: 100
  };

  const handleAddClaim = (player: AvailablePlayer) => {
    setSelectedPlayer(player);
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(#00FFFF 1px, transparent 1px), linear-gradient(90deg, #FF00FF 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'grid 20s linear infinite',
        }}></div>
      </div>

      {/* Scanning Lines */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="h-px bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50 animate-scan"></div>
      </div>

      {/* Cyberpunk Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-magenta-500/20 to-cyan-500/20 blur-xl"></div>
        <div className="relative bg-black/80 backdrop-blur-xl border-b border-cyan-500/30">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-magenta-400">
                  WAIVER WIRE
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-green-400 font-mono text-sm">PROCESS: WED 3:00 AM EST</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg blur-lg group-hover:blur-xl transition-all opacity-50"></div>
                  <div className="relative bg-black/90 border border-yellow-500/50 rounded-lg p-4 backdrop-blur">
                    <p className="text-xs text-yellow-300 font-mono mb-1">PRIORITY</p>
                    <p className="text-3xl font-bold text-yellow-400 font-mono">#4</p>
                    <Zap className="absolute -top-2 -right-2 w-4 h-4 text-yellow-500 animate-pulse" />
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg blur-lg group-hover:blur-xl transition-all opacity-50"></div>
                  <div className="relative bg-black/90 border border-green-500/50 rounded-lg p-4 backdrop-blur">
                    <p className="text-xs text-green-300 font-mono mb-1">FAAB CREDITS</p>
                    <p className="text-3xl font-bold text-green-400 font-mono">${faabBudget.remaining}</p>
                    <DollarSign className="absolute -top-2 -right-2 w-4 h-4 text-green-500 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cyberpunk Navigation Tabs */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-magenta-500/10 blur-xl"></div>
        <div className="relative bg-black/60 backdrop-blur-xl border-b border-cyan-500/30">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex space-x-2 p-2">
              {[
                { id: 'available', label: 'AVAILABLE PLAYERS', icon: '⚡' },
                { id: 'claims', label: 'MY CLAIMS', icon: '🎯' },
                { id: 'faab', label: 'FAAB BIDS', icon: '💰' },
                { id: 'history', label: 'TRANSACTION LOG', icon: '📊' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-6 py-3 rounded-lg font-medium text-sm uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? 'text-black'
                      : 'text-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  {activeTab === tab.id && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-magenta-500 rounded-lg"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-magenta-500 rounded-lg blur-md opacity-70"></div>
                    </>
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span>{tab.icon}</span>
                    {tab.label}
                    {tab.id === 'claims' && waiverClaims.length > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                        {waiverClaims.length}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'available' && (
          <div className="space-y-4">
            {/* Cyberpunk Search and Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-magenta-500/20 rounded-lg blur group-hover:blur-md transition-all"></div>
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400 z-10" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH PLAYERS..."
                  className="relative w-full pl-10 pr-4 py-3 bg-black/80 text-cyan-400 rounded-lg border border-cyan-500/50 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all font-mono placeholder-cyan-400/50"
                />
              </div>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="px-4 py-3 bg-black/80 text-cyan-400 rounded-lg border border-cyan-500/50 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.5)] font-mono"
              >
                <option value="ALL">ALL POSITIONS</option>
                <option value="QB">QB</option>
                <option value="RB">RB</option>
                <option value="WR">WR</option>
                <option value="TE">TE</option>
                <option value="K">K</option>
                <option value="DST">DST</option>
              </select>
              <button className="relative group px-4 py-3 rounded-lg font-mono text-sm transition-all">
                <div className="absolute inset-0 bg-gradient-to-r from-magenta-500 to-cyan-500 rounded-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 flex items-center space-x-2 text-black font-bold">
                  <FunnelIcon className="h-4 w-4" />
                  <span>FILTERS</span>
                </span>
              </button>
            </div>

            {/* Cyberpunk Players Table */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-magenta-500/10 blur-xl"></div>
              <div className="relative bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-black/80 border-b border-cyan-500/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">PLAYER</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">STATUS</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">TREND</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">OWNED</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">PROJ</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {availablePlayers.map((player) => (
                    <tr key={player.id} className="group hover:bg-cyan-500/5 transition-all">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                              player.position === 'QB' ? 'from-red-500 to-pink-500' :
                              player.position === 'RB' ? 'from-blue-500 to-cyan-500' :
                              player.position === 'WR' ? 'from-green-500 to-emerald-500' :
                              player.position === 'TE' ? 'from-purple-500 to-violet-500' :
                              'from-gray-500 to-gray-600'
                            } p-0.5`}>
                              <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{player.position}</span>
                              </div>
                            </div>
                            {player.trend === 'up' && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">{player.name}</div>
                            <div className="text-xs text-gray-400 font-mono">{player.team}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {player.waiverStatus === 'waivers' ? (
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <ClockIcon className="h-4 w-4 text-yellow-400 animate-pulse" />
                              <div className="absolute inset-0 blur-sm bg-yellow-400/50"></div>
                            </div>
                            <span className="text-sm text-yellow-400 font-mono">LOCKED</span>
                            <span className="text-xs text-yellow-400/70">({player.clearsDate})</span>
                          </div>
                        ) : (
                          <span className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-400 font-mono">FREE</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold font-mono ${
                            player.addDrops.startsWith('+') ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {player.addDrops}
                          </span>
                          {player.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                          {player.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-black/50 rounded-full overflow-hidden border border-cyan-500/30">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-magenta-500 rounded-full"
                                 style={{ width: `${player.percentOwned}%` }}></div>
                          </div>
                          <span className="text-xs text-cyan-400 font-mono">{player.percentOwned}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 font-mono">
                          {player.projectedPoints}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleAddClaim(player)}
                          className="relative group/btn px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-green-500 rounded-lg opacity-70 group-hover/btn:opacity-100 transition-opacity"></div>
                          <span className="relative z-10 flex items-center space-x-1 text-black">
                            <PlusIcon className="h-4 w-4" />
                            <span>CLAIM</span>
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="space-y-4">
            {waiverClaims.length > 0 ? (
              <>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm">
                    Claims will process Wednesday at 3:00 AM EST. You can reorder priority by dragging.
                  </p>
                </div>

                <div className="space-y-3">
                  {waiverClaims.map((claim) => (
                    <div key={claim.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-400 uppercase">Priority</span>
                            <span className="text-2xl font-bold text-white">#{claim.priority}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-center">
                              <p className="text-xs text-gray-400 uppercase mb-1">Add</p>
                              <p className="text-white font-medium">{claim.add.player}</p>
                              <p className="text-sm text-gray-400">{claim.add.team} - {claim.add.position}</p>
                            </div>
                            <ArrowPathIcon className="h-5 w-5 text-gray-400" />
                            <div className="text-center">
                              <p className="text-xs text-gray-400 uppercase mb-1">Drop</p>
                              <p className="text-white font-medium">{claim.drop.player}</p>
                              <p className="text-sm text-gray-400">{claim.drop.team} - {claim.drop.position}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                            Edit
                          </button>
                          <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Active Claims</h3>
                <p className="text-gray-400">You haven&apos;t submitted any waiver claims this week.</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Browse Available Players
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'faab' && (
          <div className="space-y-6">
            {/* FAAB Budget Overview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">FAAB Budget</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Remaining</p>
                  <p className="text-2xl font-bold text-green-400">${faabBudget.remaining}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Spent</p>
                  <p className="text-2xl font-bold text-red-400">${faabBudget.spent}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Budget</p>
                  <p className="text-2xl font-bold text-white">${faabBudget.total}</p>
                </div>
              </div>
              <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(faabBudget.remaining / faabBudget.total) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Active FAAB Bids */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Active Bids</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-white font-medium">Kyren Williams</p>
                      <p className="text-sm text-gray-400">LAR - RB</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Bid:</span>
                      <input
                        type="number"
                        defaultValue={15}
                        className="w-20 px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500"
                      />
                    </div>
                    <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-white font-medium">Tank Dell</p>
                      <p className="text-sm text-gray-400">HOU - WR</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Bid:</span>
                      <input
                        type="number"
                        defaultValue={8}
                        className="w-20 px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500"
                      />
                    </div>
                    <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Bids:</span>
                  <span className="text-xl font-bold text-white">$23</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  <tr className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-400">Dec 11, 2024</td>
                    <td className="px-6 py-4 text-sm text-white">Waiver</td>
                    <td className="px-6 py-4 text-sm text-white">
                      Added Rashee Rice, Dropped Elijah Moore
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center space-x-1 text-green-400">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span className="text-sm">Success</span>
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-400">Dec 4, 2024</td>
                    <td className="px-6 py-4 text-sm text-white">Free Agent</td>
                    <td className="px-6 py-4 text-sm text-white">
                      Added Cowboys DST, Dropped Commanders DST
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center space-x-1 text-green-400">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span className="text-sm">Success</span>
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-400">Nov 27, 2024</td>
                    <td className="px-6 py-4 text-sm text-white">FAAB</td>
                    <td className="px-6 py-4 text-sm text-white">
                      Bid $12 for Jaylen Warren
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center space-x-1 text-red-400">
                        <XCircleIcon className="h-4 w-4" />
                        <span className="text-sm">Outbid</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Cyberpunk Add Player Modal */}
      {showAddModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-magenta-500/20 blur-xl"></div>
            <div className="relative bg-black/90 backdrop-blur-xl border border-cyan-500/50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400 mb-6">
                CLAIM: {selectedPlayer.name}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-cyan-400 mb-3 font-mono uppercase tracking-wider">
                    SELECT PLAYER TO DROP
                  </label>
                  <select className="w-full px-4 py-3 bg-black/60 text-cyan-400 rounded-lg border border-cyan-500/50 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all font-mono">
                    <option>Dameon Pierce - RB</option>
                    <option>Quentin Johnston - WR</option>
                    <option>Elijah Moore - WR</option>
                    <option>Tyler Allgeier - RB</option>
                  </select>
                </div>

                {selectedPlayer.waiverStatus === 'waivers' && (
                  <div>
                    <label className="block text-xs font-bold text-green-400 mb-3 font-mono uppercase tracking-wider">
                      FAAB BID (OPTIONAL)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-400" />
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-3 bg-black/60 text-green-400 rounded-lg border border-green-500/50 focus:border-green-400 focus:shadow-[0_0_20px_rgba(0,255,0,0.5)] transition-all font-mono"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-green-400/70 font-mono">REMAINING CREDITS:</p>
                      <p className="text-sm font-bold text-green-400 font-mono">${faabBudget.remaining}</p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-black/80 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 hover:border-red-400 transition-all font-mono font-bold text-sm"
                  >
                    CANCEL
                  </button>
                  <button className="flex-1 relative group px-4 py-3 rounded-lg font-mono font-bold text-sm transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-green-500 rounded-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10 text-black">SUBMIT CLAIM</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes grid {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes scan {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}