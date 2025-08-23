'use client';

import { useState } from 'react';
import { ArrowsRightLeftIcon, ChatBubbleLeftRightIcon, CheckIcon, XMarkIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { StarIcon, FireIcon } from '@heroicons/react/24/solid';

interface Trade {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'countered';
  proposer: {
    team: string;
    owner: string;
    players: {
      name: string;
      position: string;
      team: string;
      projectedPoints: number;
    }[];
  };
  receiver: {
    team: string;
    owner: string;
    players: {
      name: string;
      position: string;
      team: string;
      projectedPoints: number;
    }[];
  };
  proposedDate: string;
  expiresIn: string;
  votes?: {
    for: number;
    against: number;
  };
  messages: {
    author: string;
    message: string;
    time: string;
  }[];
}

export default function TradesPage() {
  const [activeTab, setActiveTab] = useState<'propose' | 'pending' | 'history' | 'voting'>('propose');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Mock trades data
  const trades: Trade[] = [
    {
      id: '1',
      status: 'pending',
      proposer: {
        team: 'Lightning Bolts',
        owner: 'You',
        players: [
          { name: 'Davante Adams', position: 'WR', team: 'LV', projectedPoints: 14.5 },
          { name: 'James Conner', position: 'RB', team: 'ARI', projectedPoints: 11.2 }
        ]
      },
      receiver: {
        team: 'Thunder Strikes',
        owner: 'Jack',
        players: [
          { name: 'A.J. Brown', position: 'WR', team: 'PHI', projectedPoints: 15.8 },
          { name: 'Rachaad White', position: 'RB', team: 'TB', projectedPoints: 10.5 }
        ]
      },
      proposedDate: '2 hours ago',
      expiresIn: '46 hours',
      messages: [
        { author: 'You', message: 'Interested in upgrading at WR, fair swap?', time: '2 hours ago' },
        { author: 'Jack', message: 'Let me think about it', time: '1 hour ago' }
      ]
    },
    {
      id: '2',
      status: 'countered',
      proposer: {
        team: 'Gridiron Giants',
        owner: 'Jon',
        players: [
          { name: 'Josh Jacobs', position: 'RB', team: 'GB', projectedPoints: 13.8 }
        ]
      },
      receiver: {
        team: 'Lightning Bolts',
        owner: 'You',
        players: [
          { name: 'Calvin Ridley', position: 'WR', team: 'TEN', projectedPoints: 12.1 },
          { name: 'Tyler Allgeier', position: 'RB', team: 'ATL', projectedPoints: 7.5 }
        ]
      },
      proposedDate: '1 day ago',
      expiresIn: '23 hours',
      messages: [
        { author: 'Jon', message: 'Need a WR but this seems light', time: '1 day ago' },
        { author: 'Jon', message: 'Would you add a draft pick?', time: '12 hours ago' }
      ]
    }
  ];

  const leagueVoteTrades: Trade[] = [
    {
      id: '3',
      status: 'pending',
      proposer: {
        team: 'Dynasty Warriors',
        owner: 'Mike',
        players: [
          { name: 'Tyreek Hill', position: 'WR', team: 'MIA', projectedPoints: 18.2 }
        ]
      },
      receiver: {
        team: 'Touchdown Kings',
        owner: 'Sarah',
        players: [
          { name: 'Travis Etienne', position: 'RB', team: 'JAX', projectedPoints: 12.5 },
          { name: 'Mike Evans', position: 'WR', team: 'TB', projectedPoints: 13.8 }
        ]
      },
      proposedDate: '3 hours ago',
      expiresIn: '45 hours',
      votes: {
        for: 4,
        against: 2
      },
      messages: []
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Trade Center</h1>
              <p className="text-gray-400 mt-1">Propose, negotiate, and manage trades</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                <SparklesIcon className="h-5 w-5" />
                <span>Trade Analyzer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'propose', label: 'Propose Trade' },
              { id: 'pending', label: 'My Trades', badge: trades.length },
              { id: 'voting', label: 'League Voting', badge: leagueVoteTrades.length },
              { id: 'history', label: 'Trade History' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-1 py-4 border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'propose' && (
          <div className="space-y-6">
            {/* Team Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Select Trading Partner</h3>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500"
              >
                <option value="">Choose a team...</option>
                <option value="thunder">Thunder Strikes (Jack)</option>
                <option value="giants">Gridiron Giants (Jon)</option>
                <option value="dynasty">Dynasty Warriors (Mike)</option>
                <option value="kings">Touchdown Kings (Sarah)</option>
              </select>
            </div>

            {selectedTeam && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Your Team */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Your Players</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {[
                      { name: 'Patrick Mahomes', position: 'QB', team: 'KC', points: 22.5 },
                      { name: 'Christian McCaffrey', position: 'RB', team: 'SF', points: 18.2 },
                      { name: 'Davante Adams', position: 'WR', team: 'LV', points: 14.5 },
                      { name: 'CeeDee Lamb', position: 'WR', team: 'DAL', points: 16.4 },
                      { name: 'Travis Kelce', position: 'TE', team: 'KC', points: 12.1 },
                      { name: 'James Conner', position: 'RB', team: 'ARI', points: 11.2 },
                      { name: 'Calvin Ridley', position: 'WR', team: 'TEN', points: 12.1 }
                    ].map((player) => (
                      <label key={player.name} className="group flex items-center justify-between p-3 bg-black/40 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-500/50 cursor-pointer transition-all">
                        <div className="flex items-center space-x-3">
                          <input type="checkbox" className="w-4 h-4 rounded border-cyan-500/50 bg-black/60 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0" />
                          <div className="relative">
                            <div className={`absolute -left-2 top-0 w-1 h-full bg-gradient-to-b ${
                              player.position === 'QB' ? 'from-red-500 to-pink-500' :
                              player.position === 'RB' ? 'from-blue-500 to-cyan-500' :
                              player.position === 'WR' ? 'from-green-500 to-emerald-500' :
                              player.position === 'TE' ? 'from-purple-500 to-violet-500' :
                              'from-gray-500 to-gray-600'
                            } rounded-full opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                            <div className="pl-2">
                              <p className="text-white font-semibold group-hover:text-cyan-400 transition-colors">{player.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{player.team} • {player.position}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400 font-mono">
                            {player.points}
                          </span>
                          <p className="text-xs text-gray-500 font-mono">PTS</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Their Team */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Their Players</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {[
                      { name: 'Lamar Jackson', position: 'QB', team: 'BAL', points: 21.8 },
                      { name: 'Saquon Barkley', position: 'RB', team: 'PHI', points: 16.5 },
                      { name: 'A.J. Brown', position: 'WR', team: 'PHI', points: 15.8 },
                      { name: 'Stefon Diggs', position: 'WR', team: 'BUF', points: 14.2 },
                      { name: 'Mark Andrews', position: 'TE', team: 'BAL', points: 10.5 },
                      { name: 'Rachaad White', position: 'RB', team: 'TB', points: 10.5 },
                      { name: 'Chris Olave', position: 'WR', team: 'NO', points: 11.8 }
                    ].map((player) => (
                      <label key={player.name} className="group flex items-center justify-between p-3 bg-black/40 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-500/50 cursor-pointer transition-all">
                        <div className="flex items-center space-x-3">
                          <input type="checkbox" className="w-4 h-4 rounded border-cyan-500/50 bg-black/60 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0" />
                          <div className="relative">
                            <div className={`absolute -left-2 top-0 w-1 h-full bg-gradient-to-b ${
                              player.position === 'QB' ? 'from-red-500 to-pink-500' :
                              player.position === 'RB' ? 'from-blue-500 to-cyan-500' :
                              player.position === 'WR' ? 'from-green-500 to-emerald-500' :
                              player.position === 'TE' ? 'from-purple-500 to-violet-500' :
                              'from-gray-500 to-gray-600'
                            } rounded-full opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                            <div className="pl-2">
                              <p className="text-white font-semibold group-hover:text-cyan-400 transition-colors">{player.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{player.team} • {player.position}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400 font-mono">
                            {player.points}
                          </span>
                          <p className="text-xs text-gray-500 font-mono">PTS</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trade Actions */}
            {selectedTeam && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm text-gray-400">You Give</p>
                      <p className="text-lg font-medium text-white">0 players selected</p>
                    </div>
                    <ArrowsRightLeftIcon className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">You Receive</p>
                      <p className="text-lg font-medium text-white">0 players selected</p>
                    </div>
                  </div>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Propose Trade
                  </button>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Add Message (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Explain your trade proposal..."
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-4">
            {trades.map((trade) => (
              <div key={trade.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      trade.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      trade.status === 'countered' ? 'bg-blue-500/20 text-blue-400' :
                      trade.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-400">{trade.proposedDate}</span>
                    <span className="text-sm text-gray-400">• Expires in {trade.expiresIn}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTrade(trade);
                      setShowChat(!showChat);
                    }}
                    className="flex items-center space-x-1 text-blue-400 hover:text-blue-300"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    <span className="text-sm">Chat ({trade.messages.length})</span>
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Proposer */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-2">{trade.proposer.owner} Gives</p>
                    <div className="space-y-2">
                      {trade.proposer.players.map((player) => (
                        <div key={player.name} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                          <div>
                            <p className="text-sm text-white">{player.name}</p>
                            <p className="text-xs text-gray-400">{player.team} - {player.position}</p>
                          </div>
                          <span className="text-xs text-purple-400">{player.projectedPoints}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowsRightLeftIcon className="h-8 w-8 text-gray-400" />
                  </div>

                  {/* Receiver */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-2">{trade.receiver.owner} Gives</p>
                    <div className="space-y-2">
                      {trade.receiver.players.map((player) => (
                        <div key={player.name} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                          <div>
                            <p className="text-sm text-white">{player.name}</p>
                            <p className="text-xs text-gray-400">{player.team} - {player.position}</p>
                          </div>
                          <span className="text-xs text-purple-400">{player.projectedPoints}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {trade.proposer.owner === 'You' ? (
                  <div className="mt-4 flex items-center justify-end space-x-2">
                    <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                      Cancel Trade
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-end space-x-2">
                    <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                      Counter
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center space-x-1">
                      <XMarkIcon className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-1">
                      <CheckIcon className="h-4 w-4" />
                      <span>Accept</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'voting' && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                League trades require majority approval. Vote to maintain fair competition.
              </p>
            </div>

            {leagueVoteTrades.map((trade) => (
              <div key={trade.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {trade.proposer.owner} ⇄ {trade.receiver.owner}
                    </h3>
                    <p className="text-sm text-gray-400">{trade.proposedDate}</p>
                  </div>
                  {trade.votes && (
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{trade.votes.for}</p>
                        <p className="text-xs text-gray-400">Approve</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-400">{trade.votes.against}</p>
                        <p className="text-xs text-gray-400">Veto</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">{trade.proposer.owner} gives:</p>
                    <div className="space-y-1">
                      {trade.proposer.players.map((player) => (
                        <div key={player.name} className="text-white">
                          {player.name} ({player.position})
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">{trade.receiver.owner} gives:</p>
                    <div className="space-y-1">
                      {trade.receiver.players.map((player) => (
                        <div key={player.name} className="text-white">
                          {player.name} ({player.position})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <span className="text-sm text-gray-400">Expires in {trade.expiresIn}</span>
                  <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                      Veto Trade
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                      Approve Trade
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Teams</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trade Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-400">Dec 8, 2024</td>
                  <td className="px-6 py-4 text-sm text-white">Lightning Bolts ⇄ Dynasty Warriors</td>
                  <td className="px-6 py-4 text-sm text-white">
                    D. Adams + 3rd Round Pick for S. Diggs
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                      COMPLETED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-400">Dec 1, 2024</td>
                  <td className="px-6 py-4 text-sm text-white">Thunder Strikes ⇄ Gridiron Giants</td>
                  <td className="px-6 py-4 text-sm text-white">
                    J. Jefferson for C. McCaffrey + M. Evans
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
                      VETOED
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cyberpunk Chat Modal */}
      {showChat && selectedTrade && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-magenta-500/20 blur-xl"></div>
            <div className="relative bg-black/90 backdrop-blur-xl border border-cyan-500/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400 font-mono">
                  TRADE NEGOTIATIONS
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4 custom-scrollbar">
                {selectedTrade.messages.map((msg, idx) => (
                  <div key={idx} className={`${msg.author === 'You' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      msg.author === 'You' 
                        ? 'bg-gradient-to-r from-cyan-500/20 to-green-500/20 border border-cyan-500/50' 
                        : 'bg-black/60 border border-magenta-500/50'
                    }`}>
                      <p className="text-sm text-white">{msg.message}</p>
                    </div>
                    <p className="text-xs text-cyan-400/50 mt-1 font-mono">{msg.time}</p>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="ENTER MESSAGE..."
                  className="flex-1 px-3 py-2 bg-black/60 text-cyan-400 rounded-lg border border-cyan-500/50 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all font-mono placeholder-cyan-400/50"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-green-500 text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all font-mono">
                  SEND
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes matrix {
          0% { transform: perspective(500px) rotateX(45deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(45deg) translateY(30px); }
        }
        @keyframes dataStream {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #00FFFF, #FF00FF);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}