'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrophyIcon, 
  FlameIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  RefreshCwIcon,
  BarChart3Icon,
  ActivityIcon,
  Zap,
  Target,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

// Mock player data with real-time updates
const mockPlayers = {
  team1: [
    { 
      id: 1, 
      name: 'Patrick Mahomes', 
      position: 'QB', 
      team: 'KC', 
      opponent: 'vs BUF',
      status: 'Q4 2:47',
      score: 31.2, 
      projected: 26.2,
      stats: { pass: 325, passTD: 3, rush: 28, rushTD: 1, int: 0 },
      gameFlow: [
        { quarter: 'Q1', points: 6.8, event: '95 pass yds, Rush TD' },
        { quarter: 'Q2', points: 8.4, event: '102 pass yds, Pass TD to Kelce' },
        { quarter: 'Q3', points: 7.2, event: '78 pass yds, Pass TD to Rice' },
        { quarter: 'Q4', points: 8.8, event: '50 pass yds, 25-yd TD to Kelce' }
      ],
      bigPlay: '25-yd TD pass to Travis Kelce (6 pts)'
    },
    { 
      id: 2, 
      name: 'Christian McCaffrey', 
      position: 'RB', 
      team: 'SF', 
      opponent: '@ SEA',
      status: 'Q4 2:45',
      score: 18.3, 
      projected: 22.5,
      redzone: true,
      stats: { rush: 87, rushTD: 1, rec: 4, recYds: 36 },
      gameFlow: [
        { quarter: 'Q1', points: 4.2, event: '32 rush yds' },
        { quarter: 'Q2', points: 5.8, event: '28 rush yds, 2 rec' },
        { quarter: 'Q3', points: 8.3, event: 'Rush TD, 27 yds' }
      ]
    },
    { 
      id: 3, 
      name: 'Justin Jefferson', 
      position: 'WR', 
      team: 'MIN', 
      opponent: 'vs GB',
      status: 'Final',
      score: 32.7, 
      projected: 22.5,
      stats: { rec: 8, recYds: 127, recTD: 2 },
      gameFlow: [
        { quarter: 'Q1', points: 7.2, event: '3 rec, 42 yds' },
        { quarter: 'Q2', points: 12.5, event: '2 rec, 35 yds, TD' },
        { quarter: 'Q3', points: 8.0, event: '2 rec, 30 yds' },
        { quarter: 'Q4', points: 5.0, event: '1 rec, 20 yds, TD' }
      ],
      bigPlay: '8 rec, 127 yds, 2 TD (32.7 pts) - MONSTER GAME!'
    },
    { 
      id: 4, 
      name: 'Travis Kelce', 
      position: 'TE', 
      team: 'KC', 
      opponent: 'vs BUF',
      status: 'Q4 2:47',
      score: 18.5, 
      projected: 14.3,
      stats: { rec: 8, recYds: 95, recTD: 1 },
      gameFlow: [
        { quarter: 'Q1', points: 3.2, event: '2 rec, 22 yds' },
        { quarter: 'Q2', points: 4.5, event: '3 rec, 35 yds' },
        { quarter: 'Q3', points: 2.3, event: '1 rec, 13 yds' },
        { quarter: 'Q4', points: 8.5, event: '2 rec, 25 yds, TD from Mahomes' }
      ],
      bigPlay: '25-yd TD from Mahomes (6 pts)'
    },
    { 
      id: 8, 
      name: 'Saquon Barkley', 
      position: 'RB', 
      team: 'PHI', 
      opponent: 'vs DAL',
      status: 'Final',
      score: 28.7, 
      projected: 19.5,
      stats: { rush: 125, rushTD: 1, rec: 4, recYds: 42 },
      gameFlow: [
        { quarter: 'Q1', points: 5.2, event: '32 rush yds, 1 rec' },
        { quarter: 'Q2', points: 6.5, event: '26 rush yds, 2 rec, 25 yds' },
        { quarter: 'Q3', points: 4.3, event: '18 rush yds, 1 rec' },
        { quarter: 'Q4', points: 12.7, event: '67-yd rushing TD!' }
      ],
      bigPlay: '67-yd rushing TD (12.7 pts)'
    }
  ],
  team2: [
    { 
      id: 5, 
      name: 'Josh Allen', 
      position: 'QB', 
      team: 'BUF', 
      opponent: '@ KC',
      status: 'Final',
      score: 22.8, 
      projected: 27.5,
      stats: { pass: 268, passTD: 2, rush: 44, rushTD: 1, int: 1 },
      gameFlow: [
        { quarter: 'Q1', points: 4.8, event: '68 pass yds' },
        { quarter: 'Q2', points: 6.2, event: '82 pass yds, Pass TD' },
        { quarter: 'Q3', points: 3.8, event: '58 pass yds, INT' },
        { quarter: 'Q4', points: 8.0, event: '60 pass yds, Rush TD' }
      ]
    },
    { 
      id: 6, 
      name: 'Breece Hall', 
      position: 'RB', 
      team: 'NYJ', 
      opponent: 'vs MIA',
      status: 'Q3 8:30',
      score: 12.4, 
      projected: 15.8,
      stats: { rush: 62, rushTD: 1, rec: 3, recYds: 22 },
      gameFlow: [
        { quarter: 'Q1', points: 3.4, event: '24 rush yds' },
        { quarter: 'Q2', points: 7.0, event: 'Rush TD, 18 yds' },
        { quarter: 'Q3', points: 2.0, event: '20 rush yds (LIVE)' }
      ]
    },
    { 
      id: 7, 
      name: 'CeeDee Lamb', 
      position: 'WR', 
      team: 'DAL', 
      opponent: '@ PHI',
      status: 'Final',
      score: 24.5, 
      projected: 20.2,
      stats: { rec: 9, recYds: 125, recTD: 1 },
      gameFlow: [
        { quarter: 'Q1', points: 4.5, event: '45 rec yds' },
        { quarter: 'Q2', points: 5.0, event: '30 rec yds' },
        { quarter: 'Q3', points: 5.0, event: '20 rec yds' },
        { quarter: 'Q4', points: 10.0, event: '30 rec yds, Rec TD' }
      ]
    }
  ]
}

// Live play-by-play updates with actual fantasy events
const playByPlay = [
  { 
    id: 1, 
    time: 'Q4 2:47', 
    team: 'KC',
    play: '🏈 TOUCHDOWN! Patrick Mahomes 25-yd TD pass to Travis Kelce', 
    fantasy: 'Mahomes +6 pts, Kelce +8.5 pts',
    impact: 'touchdown',
    highlight: true 
  },
  { 
    id: 2, 
    time: 'Q4 1:45', 
    team: 'PHI',
    play: '🔥 TOUCHDOWN! Saquon Barkley 67-yd rushing TD!', 
    fantasy: 'Barkley +12.7 pts (EXPLOSIVE!)',
    impact: 'touchdown',
    highlight: true 
  },
  { 
    id: 3, 
    time: 'Q3 8:15', 
    team: 'SF',
    play: '🔴 RED ZONE: McCaffrey at SEA 7 yard line', 
    fantasy: 'McCaffrey in scoring position',
    impact: 'redzone',
    redzone: true 
  },
  { 
    id: 4, 
    time: 'FINAL', 
    team: 'MIN',
    play: '🎆 Justin Jefferson finishes with 8 rec, 127 yds, 2 TD', 
    fantasy: 'Jefferson 32.7 pts - TOP SCORER!',
    impact: 'big-play',
    highlight: true 
  },
  { 
    id: 5, 
    time: 'Q4 0:45', 
    team: 'CHI',
    play: '🔴 RED ZONE: Bears 1st & Goal at GB 8', 
    fantasy: 'Montgomery, Moore in scoring range',
    impact: 'redzone',
    redzone: true 
  },
  { 
    id: 6, 
    time: 'FINAL/OT', 
    team: 'BAL',
    play: '🏈 OT WINNER! Lamar Jackson 8-yd Rush TD', 
    fantasy: 'Jackson +6.8 pts, Ravens win in OT!',
    impact: 'touchdown' 
  },
  { 
    id: 7, 
    time: 'Q3 5:15', 
    team: 'CIN',
    play: 'Ja\'Marr Chase 72-yd TD from Joe Burrow!', 
    fantasy: 'Chase +13.2 pts, Burrow +7.2 pts',
    impact: 'big-play' 
  },
  { 
    id: 8, 
    time: 'Halftime', 
    team: 'MIA',
    play: 'Tyreek Hill: 5 rec, 87 yds, 1 TD at half', 
    fantasy: 'Hill 14.7 pts (on pace for 29.4)',
    impact: 'positive' 
  }
]

export default function FantasyCastPage() {
  const [selectedMatchup, setSelectedMatchup] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null)
  const [winProbability, setWinProbability] = useState(68)
  const [showPlayByPlay, setShowPlayByPlay] = useState(true)

  // Simulate live updates
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setWinProbability(prev => {
          const change = (Math.random() - 0.5) * 5
          return Math.max(0, Math.min(100, prev + change))
        })
      }, 5000)
      return () => clearInterval(interval)
    }
    return undefined
  }, [autoRefresh])

  const team1Score = mockPlayers.team1.reduce((sum, p) => sum + p.score, 0)
  const team2Score = mockPlayers.team2.reduce((sum, p) => sum + p.score, 0)
  const team1Projected = mockPlayers.team1.reduce((sum, p) => sum + p.projected, 0)
  const team2Projected = mockPlayers.team2.reduce((sum, p) => sum + p.projected, 0)

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Cyber Grid */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(#00FFFF 1px, transparent 1px),
            linear-gradient(90deg, #FF00FF 1px, transparent 1px),
            linear-gradient(#00FF00 0.5px, transparent 0.5px),
            linear-gradient(90deg, #00FF00 0.5px, transparent 0.5px)
          `,
          backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
          animation: 'cyberGrid 30s linear infinite',
        }}></div>
      </div>

      {/* Live Data Stream Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)',
          animation: 'dataFlow 1s linear infinite',
        }}></div>
      </div>

      {/* ESPN-Style Cyberpunk Header */}
      <div className="relative z-20 mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-green-500/20 to-magenta-500/20 blur-xl"></div>
        <div className="relative bg-black/80 backdrop-blur-xl border-b border-cyan-500/30">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/live">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2 bg-black/60 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-400 transition-all font-mono"
                  >
                    ← BACK
                  </motion.button>
                </Link>
                <div>
                  <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-magenta-400">
                    FANTASYCAST™
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-green-400 font-mono text-sm">LIVE TRACKER • WEEK 11 • REAL-TIME DATA</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative group px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all ${
                    autoRefresh ? '' : 'opacity-60'
                  }`}
                >
                  <div className={`absolute inset-0 rounded-lg ${
                    autoRefresh 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse' 
                      : 'bg-gradient-to-r from-gray-600 to-gray-700'
                  }`}></div>
                  <span className="relative z-10 flex items-center gap-2 text-black">
                    {autoRefresh ? (
                      <>
                        <Wifi className="w-4 h-4" />
                        LIVE
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4" />
                        PAUSED
                      </>
                    )}
                  </span>
                </button>
                <button className="relative group px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10 text-black">
                    <RefreshCwIcon className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Holographic Main Score Display */}
        <Card className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-magenta-500/20 blur-xl"></div>
          <div className="relative bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 overflow-hidden">
            {/* Holographic Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,255,255,0.1) 10px, rgba(0,255,255,0.1) 20px)',
              }}></div>
            </div>

            <div className="relative grid grid-cols-3 gap-4 items-center">
              {/* Team 1 Holographic Display */}
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="text-4xl">🎯</div>
                  <div className="absolute inset-0 blur-xl bg-cyan-400/30 animate-pulse"></div>
                </div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 mb-1 font-mono">
                  MAHOMES MAGIC
                </h2>
                <p className="text-cyan-400/70 text-sm mb-3 font-mono">YOU</p>
                <div className="relative">
                  <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 mb-2">
                    {team1Score.toFixed(1)}
                  </div>
                  <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-green-400/20 to-cyan-400/20"></div>
                </div>
                <div className="text-xs text-cyan-400/70 font-mono">PROJECTED: {team1Projected.toFixed(1)}</div>
                <div className={`text-sm mt-2 font-mono font-bold ${team1Score > team1Projected ? 'text-green-400' : 'text-red-400'}`}>
                  {team1Score > team1Projected ? '▲' : '▼'} {Math.abs(team1Score - team1Projected).toFixed(1)}
                </div>
              </div>

              {/* Holographic Win Probability Meter */}
              <div className="text-center">
                <div className="mb-4">
                  <div className="text-xs text-cyan-400 mb-2 font-mono uppercase tracking-widest">Win Probability</div>
                  <div className="relative">
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-400">
                      {winProbability}%
                    </div>
                    <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-cyan-400/30 to-magenta-400/30 animate-pulse"></div>
                  </div>
                </div>
                <div className="relative h-6 bg-black/50 rounded-full overflow-hidden border border-cyan-500/30">
                  <motion.div
                    animate={{ width: `${winProbability}%` }}
                    transition={{ duration: 0.5 }}
                    className="absolute h-full bg-gradient-to-r from-green-500 via-cyan-500 to-magenta-500"
                    style={{ boxShadow: '0 0 20px rgba(0,255,255,0.5)' }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-mono text-white/80 font-bold">CALCULATING...</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-cyan-400/50 mt-2 font-mono">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Team 2 Holographic Display */}
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="text-4xl">⚔️</div>
                  <div className="absolute inset-0 blur-xl bg-magenta-400/30 animate-pulse"></div>
                </div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 to-red-400 mb-1 font-mono">
                  ALLEN&apos;S ARMY
                </h2>
                <p className="text-magenta-400/70 text-sm mb-3 font-mono">MIKE</p>
                <div className="relative">
                  <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 to-red-400 mb-2">
                    {team2Score.toFixed(1)}
                  </div>
                  <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-magenta-400/20 to-red-400/20"></div>
                </div>
                <div className="text-xs text-magenta-400/70 font-mono">PROJECTED: {team2Projected.toFixed(1)}</div>
                <div className={`text-sm mt-2 font-mono font-bold ${team2Score > team2Projected ? 'text-green-400' : 'text-red-400'}`}>
                  {team2Score > team2Projected ? '▲' : '▼'} {Math.abs(team2Score - team2Projected).toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">4</div>
            <div className="text-xs text-gray-400">Players Finished</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">3</div>
            <div className="text-xs text-gray-400">Playing Now</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">2</div>
            <div className="text-xs text-gray-400">Yet to Play</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">Q4</div>
            <div className="text-xs text-gray-400">Latest Quarter</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Details */}
        <div className="lg:col-span-2">
          {/* Team 1 Roster */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Mahomes Magic
              </h3>
              <span className="text-sm text-gray-400">Live Scoring</span>
            </div>

            <div className="space-y-2">
              {mockPlayers.team1.map((player) => (
                <motion.div
                  key={player.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    player.redzone 
                      ? 'bg-red-900/30 border-red-500 animate-pulse' 
                      : 'bg-gray-700/30 border-gray-600'
                  } hover:border-purple-500`}
                  onClick={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                          player.position === 'QB' ? 'bg-red-600' :
                          player.position === 'RB' ? 'bg-blue-600' :
                          player.position === 'WR' ? 'bg-green-600' :
                          'bg-purple-600'
                        } text-white`}>
                          {player.position}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">{player.name}</div>
                        <div className="text-xs text-gray-400">
                          {player.team} {player.opponent} • {player.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{player.score}</div>
                      <div className={`text-xs ${player.score > player.projected ? 'text-green-400' : 'text-red-400'}`}>
                        Proj: {player.projected}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Stats */}
                  <AnimatePresence>
                    {expandedPlayer === player.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 pt-3 border-t border-gray-600"
                      >
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          {Object.entries(player.stats).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-400 capitalize">{key}:</span>
                              <span className="text-white font-semibold">{value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {player.gameFlow.map((flow, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-gray-400">{flow.quarter}</span>
                              <span className="text-green-400">+{flow.points}</span>
                              <span className="text-gray-300">{flow.event}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Team 2 Roster */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-2xl">⚔️</span>
                Allen&apos;s Army
              </h3>
              <span className="text-sm text-gray-400">Live Scoring</span>
            </div>

            <div className="space-y-2">
              {mockPlayers.team2.map((player) => (
                <motion.div
                  key={player.id}
                  className="p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-purple-500 transition-all cursor-pointer"
                  onClick={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                          player.position === 'QB' ? 'bg-red-600' :
                          player.position === 'RB' ? 'bg-blue-600' :
                          player.position === 'WR' ? 'bg-green-600' :
                          'bg-purple-600'
                        } text-white`}>
                          {player.position}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">{player.name}</div>
                        <div className="text-xs text-gray-400">
                          {player.team} {player.opponent} • {player.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{player.score}</div>
                      <div className={`text-xs ${player.score > player.projected ? 'text-green-400' : 'text-red-400'}`}>
                        Proj: {player.projected}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Stats */}
                  <AnimatePresence>
                    {expandedPlayer === player.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 pt-3 border-t border-gray-600"
                      >
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          {Object.entries(player.stats).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-400 capitalize">{key}:</span>
                              <span className="text-white font-semibold">{value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {player.gameFlow.map((flow, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-gray-400">{flow.quarter}</span>
                              <span className="text-green-400">+{flow.points}</span>
                              <span className="text-gray-300">{flow.event}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Play by Play & League Overview */}
        <div className="space-y-6">
          {/* Play-by-Play */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ActivityIcon className="w-5 h-5" />
                Play-by-Play
              </h3>
              <button
                onClick={() => setShowPlayByPlay(!showPlayByPlay)}
                className="text-gray-400 hover:text-white"
              >
                {showPlayByPlay ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {showPlayByPlay && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 max-h-96 overflow-y-auto"
                >
                  {playByPlay.map((play) => (
                    <motion.div
                      key={play.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={`p-3 rounded-lg ${
                        play.impact === 'touchdown' ? 'bg-green-900/30 border border-green-500' :
                        play.impact === 'big-play' ? 'bg-blue-900/30 border border-blue-500' :
                        play.redzone ? 'bg-red-900/30 border border-red-500' :
                        'bg-gray-700/30 border border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs text-gray-400">{play.time}</span>
                        <span className="text-xs font-bold text-gray-300">{play.team}</span>
                      </div>
                      <div className="text-sm text-white mb-1">{play.play}</div>
                      <div className={`text-xs ${
                        play.impact === 'touchdown' || play.impact === 'big-play' ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {play.fantasy}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* League Scoreboard */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3Icon className="w-5 h-5" />
              League Scoreboard
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-white">Jefferson&apos;s Jets</div>
                    <div className="text-xs text-gray-400">Sarah</div>
                    <div className="text-xs text-yellow-400">J. Jefferson: 32.7 pts 🔥</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">142.8</div>
                    <div className="text-xs text-green-400">Leading</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-white">Lamb Chops</div>
                    <div className="text-xs text-gray-400">Tom</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">128.7</div>
                    <div className="text-xs text-gray-400">2nd</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-white">Mahomes Magic</div>
                    <div className="text-xs text-gray-400">You</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{team1Score.toFixed(1)}</div>
                    <div className="text-xs text-green-400">Winning</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-white">Allen&apos;s Army</div>
                    <div className="text-xs text-gray-400">Mike</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{team2Score.toFixed(1)}</div>
                    <div className="text-xs text-red-400">Losing</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Key Alerts */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircleIcon className="w-5 h-5 text-yellow-400" />
              Key Alerts
            </h3>
            
            <div className="space-y-2">
              <div className="p-3 bg-red-900/30 rounded-lg border border-red-500/50">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 animate-pulse" />
                  <div>
                    <div className="text-sm text-white font-semibold">RED ZONE</div>
                    <div className="text-xs text-gray-400">C. McCaffrey at SEA 5 yard line</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-900/30 rounded-lg border border-green-500/50">
                <div className="flex items-start gap-2">
                  <TrendingUpIcon className="w-4 h-4 text-green-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-white">T. Hill Exceeding Projections</div>
                    <div className="text-xs text-gray-400">24.8 pts (Proj: 18.5)</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-500/50">
                <div className="flex items-start gap-2">
                  <TrendingDownIcon className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-white">J. Allen Below Projection</div>
                    <div className="text-xs text-gray-400">22.8 pts (Proj: 27.5)</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes cyberGrid {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(100px) translateX(100px); }
        }
        @keyframes dataFlow {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
        @keyframes scan {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
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
    </div>
  )
}