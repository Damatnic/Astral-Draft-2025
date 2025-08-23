'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { motion, AnimatePresence } from 'framer-motion'
import { ClockIcon, FlameIcon, TrophyIcon, ChevronRightIcon, TvIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Cyberpunk color palette
const neonColors = {
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  yellow: '#FFFF00',
  green: '#00FF00',
  red: '#FF0040',
  purple: '#9D00FF',
  orange: '#FF6B00',
  pink: '#FF006E'
};

// Mock real-time game data with exact scores requested
const nflGames = [
  {
    id: 1,
    away: { team: 'KC', score: 31, logo: '🏈', record: '11-2' },
    home: { team: 'BUF', score: 24, logo: '🦬', record: '10-3' },
    quarter: 'Q4',
    time: '2:47',
    possession: 'BUF',
    redzone: false,
    primetime: true,
    scoringPlays: [
      { team: 'KC', player: 'Patrick Mahomes', type: '25-yd TD pass to Travis Kelce', points: 6, time: 'Q4 4:15', fantasy: '6 pts' },
      { team: 'BUF', player: 'Josh Allen', type: '12-yd Rush TD', points: 6, time: 'Q3 8:22', fantasy: '7.2 pts' },
      { team: 'KC', player: 'Isiah Pacheco', type: '3-yd Rush TD', points: 6, time: 'Q2 1:30', fantasy: '6.3 pts' }
    ]
  },
  {
    id: 2,
    away: { team: 'DAL', score: 27, logo: '⭐', record: '8-5' },
    home: { team: 'PHI', score: 34, logo: '🦅', record: '12-1' },
    quarter: 'Final',
    time: '0:00',
    possession: null,
    redzone: false,
    scoringPlays: [
      { team: 'PHI', player: 'Saquon Barkley', type: '67-yd rushing TD', points: 6, time: 'Q4 1:45', fantasy: '12.7 pts' },
      { team: 'DAL', player: 'CeeDee Lamb', type: '38-yd TD from Dak Prescott', points: 6, time: 'Q3 11:20', fantasy: '9.8 pts' },
      { team: 'PHI', player: 'A.J. Brown', type: '42-yd TD from Jalen Hurts', points: 6, time: 'Q2 5:15', fantasy: '10.2 pts' }
    ]
  },
  {
    id: 3,
    away: { team: 'SF', score: 24, logo: '🟥', record: '10-3' },
    home: { team: 'SEA', score: 17, logo: '🦅', record: '7-6' },
    quarter: 'Q3',
    time: '8:15',
    possession: 'SF',
    redzone: true,
    scoringPlays: [
      { team: 'SF', player: 'Christian McCaffrey', type: '8-yd Rush TD', points: 6, time: 'Q3 10:22', fantasy: '8.8 pts' },
      { team: 'SEA', player: 'DK Metcalf', type: '55-yd TD from Geno Smith', points: 6, time: 'Q2 4:15', fantasy: '11.5 pts' },
      { team: 'SF', player: 'George Kittle', type: '22-yd TD from Brock Purdy', points: 6, time: 'Q1 7:30', fantasy: '8.2 pts' }
    ]
  },
  {
    id: 4,
    away: { team: 'MIA', score: 28, logo: '🐬', record: '9-4' },
    home: { team: 'NYJ', score: 21, logo: '✈️', record: '5-8' },
    quarter: 'Halftime',
    time: '0:00',
    possession: null,
    redzone: false,
    scoringPlays: [
      { team: 'MIA', player: 'Tyreek Hill', type: '45-yd TD from Tua Tagovailoa', points: 6, time: 'Q2 1:20', fantasy: '10.5 pts' },
      { team: 'NYJ', player: 'Breece Hall', type: '12-yd Rush TD', points: 6, time: 'Q2 5:45', fantasy: '7.2 pts' },
      { team: 'MIA', player: 'Raheem Mostert', type: '3-yd Rush TD', points: 6, time: 'Q1 9:15', fantasy: '6.3 pts' }
    ]
  },
  {
    id: 5,
    away: { team: 'BAL', score: 35, logo: '🟣', record: '11-2' },
    home: { team: 'CIN', score: 28, logo: '🐅', record: '8-5' },
    quarter: 'Final/OT',
    time: '0:00',
    possession: null,
    redzone: false,
    overtime: true,
    scoringPlays: [
      { team: 'BAL', player: 'Lamar Jackson', type: '8-yd Rush TD (OT)', points: 6, time: 'OT 2:15', fantasy: '6.8 pts' },
      { team: 'CIN', player: 'Ja\'Marr Chase', type: '72-yd TD from Joe Burrow', points: 6, time: 'Q4 3:20', fantasy: '13.2 pts' },
      { team: 'BAL', player: 'Mark Andrews', type: '15-yd TD from Lamar Jackson', points: 6, time: 'Q3 6:45', fantasy: '7.5 pts' }
    ]
  },
  {
    id: 6,
    away: { team: 'GB', score: 21, logo: '🧀', record: '10-3' },
    home: { team: 'CHI', score: 17, logo: '🐻', record: '4-9' },
    quarter: 'Q4',
    time: '0:45',
    possession: 'CHI',
    redzone: true,
    scoringPlays: [
      { team: 'GB', player: 'Aaron Jones', type: '22-yd Rush TD', points: 6, time: 'Q3 11:30', fantasy: '8.2 pts' },
      { team: 'CHI', player: 'DJ Moore', type: '38-yd TD from Justin Fields', points: 6, time: 'Q3 5:15', fantasy: '9.8 pts' },
      { team: 'GB', player: 'Christian Watson', type: '45-yd TD from Jordan Love', points: 6, time: 'Q2 8:20', fantasy: '10.5 pts' }
    ]
  }
]

// Mock fantasy matchups
const fantasyMatchups = [
  {
    id: 1,
    team1: {
      name: 'Mahomes Magic',
      manager: 'You',
      score: 118.5,
      projected: 125.2,
      logo: '🎯',
      playersPlaying: 7,
      playersRemaining: 2,
      topScorer: { name: 'Patrick Mahomes', points: 28.5, status: 'Final' }
    },
    team2: {
      name: 'Allen\'s Army',
      manager: 'Mike',
      score: 102.3,
      projected: 110.5,
      logo: '⚔️',
      playersPlaying: 6,
      playersRemaining: 3,
      topScorer: { name: 'Josh Allen', points: 22.8, status: 'Final' }
    },
    winProbability: 78
  },
  {
    id: 2,
    team1: {
      name: 'Hurts So Good',
      manager: 'Sarah',
      score: 135.2,
      projected: 138.0,
      logo: '🦅',
      playersPlaying: 8,
      playersRemaining: 1,
      topScorer: { name: 'Jalen Hurts', points: 31.2, status: 'Final' }
    },
    team2: {
      name: 'Lamb Chops',
      manager: 'Tom',
      score: 128.7,
      projected: 132.5,
      logo: '🐑',
      playersPlaying: 7,
      playersRemaining: 2,
      topScorer: { name: 'CeeDee Lamb', points: 24.5, status: 'Final' }
    },
    winProbability: 62
  }
]

// RedZone style updates with actual fantasy scoring events
const redZoneUpdates = [
  { id: 1, time: 'NOW', team: 'KC', description: '🏈 TOUCHDOWN! Patrick Mahomes 25-yd TD pass to Travis Kelce', fantasy: 'P. Mahomes +6 pts, T. Kelce +8.5 pts', urgent: true, touchdown: true },
  { id: 2, time: '0:45', team: 'CHI', description: '🔴 RED ZONE: Bears at GB 8 yard line, timeout called', fantasy: 'Watch: D. Montgomery, DJ Moore', urgent: true },
  { id: 3, time: '2:47', team: 'BUF', description: 'Josh Allen scrambles for 18 yards', fantasy: 'J. Allen +1.8 pts', urgent: false },
  { id: 4, time: '3:15', team: 'PHI', description: '🏈 TOUCHDOWN! Saquon Barkley 67-yd rushing TD!', fantasy: 'S. Barkley +12.7 pts', urgent: true, touchdown: true },
  { id: 5, time: '5:30', team: 'MIN', description: '🏈 TOUCHDOWN! Justin Jefferson 8 rec, 127 yds, 2 TD', fantasy: 'J. Jefferson +32.7 pts (MONSTER GAME!)', urgent: true, touchdown: true },
  { id: 6, time: '8:15', team: 'SF', description: '🔴 RED ZONE: 49ers 1st & Goal at SEA 7', fantasy: 'Watch: McCaffrey, Deebo, Kittle', urgent: true },
  { id: 7, time: '10:22', team: 'BAL', description: 'Lamar Jackson 45-yd pass to Mark Andrews', fantasy: 'L. Jackson +4.5 pts, M. Andrews +8.5 pts', urgent: false },
  { id: 8, time: '12:00', team: 'CIN', description: 'Ja\'Marr Chase breaks free for 72-yd TD!', fantasy: 'J. Chase +13.2 pts', urgent: true, touchdown: true }
]

export default function LiveScoringDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedGame, setSelectedGame] = useState<number | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [scanLinePosition, setScanLinePosition] = useState(0)
  const [glitchEffect, setGlitchEffect] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Cyberpunk animations
  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanLinePosition(prev => (prev + 0.5) % 100)
    }, 40)
    
    const glitchInterval = setInterval(() => {
      setGlitchEffect(true)
      setTimeout(() => setGlitchEffect(false), 100)
    }, 10000)
    
    return () => {
      clearInterval(scanInterval)
      clearInterval(glitchInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cyberpunk Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `linear-gradient(${neonColors.cyan} 1px, transparent 1px), linear-gradient(90deg, ${neonColors.magenta} 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
        
        {/* Multiple Scanning Lines */}
        <div 
          className="absolute w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-40"
          style={{ 
            top: `${scanLinePosition}%`, 
            boxShadow: `0 0 40px ${neonColors.red}`,
            filter: 'blur(2px)'
          }}
        />
        <div 
          className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30"
          style={{ 
            top: `${(scanLinePosition + 33) % 100}%`, 
            boxShadow: `0 0 20px ${neonColors.cyan}`
          }}
        />
        <div 
          className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-20"
          style={{ 
            top: `${(scanLinePosition + 66) % 100}%`, 
            boxShadow: `0 0 15px ${neonColors.purple}`
          }}
        />
        
        {/* Holographic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-cyan-900/10" />
        
        {/* Glitch Effect */}
        {glitchEffect && (
          <div className="absolute inset-0 mix-blend-screen">
            <div className="absolute inset-0 bg-red-500/20 transform translate-x-2" />
            <div className="absolute inset-0 bg-cyan-500/20 transform -translate-x-2" />
          </div>
        )}
      </div>

      {/* Header */}
      <div className="relative z-10 mb-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2"
              style={{
                textShadow: `0 0 40px ${neonColors.red}, 0 0 80px ${neonColors.orange}`,
                letterSpacing: '0.05em'
              }}>
              LIVE SCORING CENTRAL
            </h1>
            <p className="text-gray-400 font-mono tracking-wider">NFL WEEK.11 | SUNDAY.11.17</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/fantasycast">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-lg flex items-center gap-2 transform hover:scale-105 transition-all uppercase tracking-wider"
                style={{
                  boxShadow: `0 0 30px ${neonColors.red}60, 0 0 50px ${neonColors.orange}40`,
                  textShadow: '0 0 10px rgba(0,0,0,0.5)'
                }}
              >
                <TvIcon className="w-5 h-5" />
                FANTASYCAST
              </motion.button>
            </Link>
            <div className="flex items-center gap-2 text-cyan-400 font-mono bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-cyan-500/30"
              style={{ boxShadow: `0 0 15px ${neonColors.cyan}40` }}>
              <ClockIcon className="w-5 h-5" style={{ filter: `drop-shadow(0 0 5px ${neonColors.cyan})` }} />
              <span className="font-bold tracking-wider">{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
        {/* NFL Scoreboard with Holographic Cards */}
        <div className="lg:col-span-2">
          <Card className="bg-black/60 backdrop-blur-xl border-cyan-500/30 p-6"
            style={{ boxShadow: `0 0 30px ${neonColors.cyan}20` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-cyan-400 uppercase tracking-wider"
                style={{ textShadow: `0 0 20px ${neonColors.cyan}` }}>
                NFL GAMES
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-red-600/30 backdrop-blur-sm text-red-400 rounded-full text-sm font-bold animate-pulse border border-red-500/50"
                  style={{ boxShadow: `0 0 15px ${neonColors.red}` }}>
                  LIVE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {nflGames.map((game) => (
                <motion.div
                  key={game.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedGame(game.id)}
                  className={cn(
                    'relative p-4 rounded-lg cursor-pointer transition-all overflow-hidden',
                    game.redzone 
                      ? 'bg-gradient-to-br from-red-900/40 to-red-800/20 border-2 border-red-500 animate-pulse' 
                      : 'bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-600/50',
                    selectedGame === game.id && 'ring-2 ring-purple-500 shadow-[0_0_30px_rgba(157,0,255,0.5)]'
                  )}
                  style={{
                    boxShadow: game.redzone 
                      ? `0 0 30px ${neonColors.red}60, inset 0 0 20px ${neonColors.red}20`
                      : `0 0 15px rgba(0,255,255,0.1)`
                  }}
                >
                  {/* Holographic shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent transform -skew-x-12 translate-x-[-100%] hover:translate-x-[200%] transition-transform duration-1500" />
                  
                  {game.primetime && (
                    <div className="text-xs text-yellow-400 font-bold mb-2 uppercase tracking-wider"
                      style={{ textShadow: `0 0 10px ${neonColors.yellow}` }}>
                      🌟 PRIMETIME
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{game.away.logo}</span>
                      <div>
                        <div className="text-white font-bold">{game.away.team}</div>
                        <div className="text-xs text-gray-500 font-mono">{game.away.record}</div>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text"
                      style={{ textShadow: `0 0 15px ${neonColors.cyan}60` }}>
                      {game.away.score}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{game.home.logo}</span>
                      <div>
                        <div className="text-white font-bold">{game.home.team}</div>
                        <div className="text-xs text-gray-500 font-mono">{game.home.record}</div>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text"
                      style={{ textShadow: `0 0 15px ${neonColors.purple}60` }}>
                      {game.home.score}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                    <div className="flex items-center gap-2">
                      {game.quarter === 'Final' ? (
                        <span className="text-gray-400 font-bold uppercase">FINAL</span>
                      ) : game.overtime ? (
                        <span className="text-yellow-400 font-bold animate-pulse">OVERTIME</span>
                      ) : (
                        <>
                          <span className="text-yellow-400 font-bold">{game.quarter}</span>
                          <span className="text-gray-400 font-mono">{game.time}</span>
                        </>
                      )}
                    </div>
                    {game.possession && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,0,0.8)]" />
                        <span className="text-xs text-gray-400 font-mono">{game.possession}</span>
                      </div>
                    )}
                    {game.redzone && (
                      <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded animate-pulse uppercase"
                        style={{ boxShadow: `0 0 20px ${neonColors.red}` }}>
                        RED ZONE
                      </span>
                    )}
                  </div>
                </motion.div>
                ))}
              </div>
          </Card>

          {/* Cyberpunk RedZone Updates */}
          <Card className="bg-black/60 backdrop-blur-xl border-red-500/30 p-6 mt-6"
            style={{ boxShadow: `0 0 30px ${neonColors.red}20` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-red-400 flex items-center gap-2 uppercase tracking-wider"
                style={{ textShadow: `0 0 20px ${neonColors.red}` }}>
                <FlameIcon className="w-5 h-5" style={{ filter: `drop-shadow(0 0 10px ${neonColors.red})` }} />
                REDZONE UPDATES
              </h2>
              <span className="text-xs text-gray-400 font-mono">AUTO-UPDATING</span>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {redZoneUpdates.map((update) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`relative p-3 rounded-lg flex items-start gap-3 overflow-hidden ${
                      update.touchdown 
                        ? 'bg-gradient-to-r from-green-900/40 to-green-800/20 border-2 border-green-500' 
                        : update.urgent 
                          ? 'bg-gradient-to-r from-red-900/30 to-transparent border border-red-500/50 animate-pulse' 
                          : 'bg-gradient-to-r from-gray-900/30 to-transparent border border-gray-600/30'
                    }`}
                    style={{
                      boxShadow: update.touchdown 
                        ? `0 0 30px ${neonColors.green}60, inset 0 0 20px ${neonColors.green}20`
                        : update.urgent
                          ? `0 0 20px ${neonColors.red}40`
                          : 'none'
                    }}
                  >
                    {/* Holographic effect for touchdowns */}
                    {update.touchdown && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent transform -skew-x-12 animate-slide" />
                    )}
                    
                    <div className="flex flex-col items-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded font-mono ${
                        update.time === 'NOW' 
                          ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(255,0,64,0.8)]' 
                          : 'text-gray-400'
                      }`}>
                        {update.time}
                      </span>
                      <span className="text-xs text-gray-500 mt-1 font-mono">{update.team}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white font-bold mb-1">{update.description}</div>
                      <div className={`text-xs ${
                        update.touchdown 
                          ? 'text-green-400 font-bold' 
                          : 'text-cyan-400'
                      }`}
                        style={{
                          textShadow: update.touchdown ? `0 0 10px ${neonColors.green}` : 'none'
                        }}>
                        {update.fantasy}
                      </div>
                    </div>
                    {update.touchdown && (
                      <div className="text-2xl animate-bounce">
                        🏈
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>
        </div>

        {/* Fantasy Matchups with Neon Effects */}
        <div className="space-y-6">
          <Card className="bg-black/60 backdrop-blur-xl border-purple-500/30 p-6"
            style={{ boxShadow: `0 0 30px ${neonColors.purple}20` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-purple-400 uppercase tracking-wider"
                style={{ textShadow: `0 0 20px ${neonColors.purple}` }}>
                YOUR MATCHUPS
              </h2>
              <TrophyIcon className="w-6 h-6 text-yellow-400" 
                style={{ filter: `drop-shadow(0 0 10px ${neonColors.yellow})` }} />
            </div>

            <div className="space-y-4">
              {fantasyMatchups.map((matchup) => (
                <Link key={matchup.id} href="/fantasycast">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative p-4 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-lg border border-purple-500/30 cursor-pointer hover:border-purple-400/50 transition-all overflow-hidden"
                    style={{
                      boxShadow: `0 0 20px ${neonColors.purple}20, inset 0 0 15px ${neonColors.purple}10`
                    }}
                  >
                    {/* Holographic shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent transform -skew-x-12 translate-x-[-100%] hover:translate-x-[200%] transition-transform duration-1500" />
                    
                    {/* Team 1 */}
                    <div className="relative flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{matchup.team1.logo}</span>
                        <div>
                          <div className="text-white font-bold">{matchup.team1.name}</div>
                          <div className="text-xs text-cyan-400 font-mono">{matchup.team1.manager}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text"
                          style={{ textShadow: `0 0 15px ${neonColors.cyan}60` }}>
                          {matchup.team1.score}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">PROJ: {matchup.team1.projected}</div>
                      </div>
                    </div>

                    {/* Win Probability Bar */}
                    <div className="relative h-3 bg-black/60 rounded-full mb-3 overflow-hidden border border-gray-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${matchup.winProbability}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute h-full bg-gradient-to-r from-green-500 via-cyan-500 to-green-400"
                        style={{
                          boxShadow: `0 0 20px ${neonColors.green}, inset 0 0 10px ${neonColors.cyan}`
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white mix-blend-difference">
                          {matchup.winProbability}% WIN
                        </span>
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="relative flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{matchup.team2.logo}</span>
                        <div>
                          <div className="text-white font-bold">{matchup.team2.name}</div>
                          <div className="text-xs text-gray-400 font-mono">{matchup.team2.manager}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-transparent bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text">
                          {matchup.team2.score}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">PROJ: {matchup.team2.projected}</div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                      <div className="text-xs text-gray-400 font-mono">
                        {matchup.team1.playersPlaying} PLAYING | {matchup.team1.playersRemaining} TO GO
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-purple-400" 
                        style={{ filter: `drop-shadow(0 0 5px ${neonColors.purple})` }} />
                    </div>
                  </motion.div>
                </Link>
                ))}
              </div>

            {/* League Leaders with Holographic Display */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm rounded-lg border border-purple-500/30"
              style={{ boxShadow: `0 0 20px ${neonColors.purple}30` }}>
              <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider"
                style={{ textShadow: `0 0 10px ${neonColors.purple}` }}>
                LEAGUE LEADERS
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-mono">HIGHEST_SCORE:</span>
                  <span className="text-white font-bold">Hurts So Good (135.2)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-mono">BEST_PLAYER:</span>
                  <span className="text-white font-bold">J. Hurts (31.2 pts)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-mono">BIGGEST_UPSET:</span>
                  <span className="text-white font-bold">Jets over Dolphins</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Fantasy Performances with Neon Cards */}
          <Card className="bg-black/60 backdrop-blur-xl border-orange-500/30 p-6"
            style={{ boxShadow: `0 0 30px ${neonColors.orange}20` }}>
            <h2 className="text-xl font-black text-orange-400 mb-4 flex items-center gap-2 uppercase tracking-wider"
              style={{ textShadow: `0 0 20px ${neonColors.orange}` }}>
              <FlameIcon className="w-5 h-5" style={{ filter: `drop-shadow(0 0 10px ${neonColors.orange})` }} />
              TOP PERFORMANCES
            </h2>
            
            <div className="space-y-3">
              <div className="relative p-3 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 backdrop-blur-sm rounded-lg border border-yellow-500/50 overflow-hidden"
                style={{ boxShadow: `0 0 20px ${neonColors.yellow}30` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent transform -skew-x-12 animate-slide" />
                <div className="relative flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">Justin Jefferson</span>
                  <span className="text-xs bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-2 py-1 rounded font-bold"
                    style={{ boxShadow: `0 0 10px ${neonColors.yellow}` }}>
                    WR1
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1 font-mono">MIN vs GB | FINAL</div>
                <div className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text"
                  style={{ textShadow: `0 0 20px ${neonColors.yellow}60` }}>
                  32.7 PTS
                </div>
                <div className="text-xs text-gray-300 mt-1">8 rec, 127 yds, 2 TD</div>
              </div>

              <div className="relative p-3 bg-gradient-to-r from-green-900/30 to-cyan-900/30 backdrop-blur-sm rounded-lg border border-green-500/50 overflow-hidden"
                style={{ boxShadow: `0 0 20px ${neonColors.green}30` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent transform -skew-x-12 animate-slide" />
                <div className="relative flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">Saquon Barkley</span>
                  <span className="text-xs bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-2 py-1 rounded font-bold"
                    style={{ boxShadow: `0 0 10px ${neonColors.cyan}` }}>
                    RB1
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1 font-mono">PHI vs DAL | FINAL</div>
                <div className="text-3xl font-black text-transparent bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text"
                  style={{ textShadow: `0 0 20px ${neonColors.green}60` }}>
                  28.7 PTS
                </div>
                <div className="text-xs text-gray-300 mt-1">125 rush yds, TD, 4 rec, 42 yds</div>
                <div className="text-xs text-yellow-400 mt-2 font-bold">🔥 67-YD RUSHING TD!</div>
              </div>

              <div className="relative p-3 bg-gradient-to-r from-gray-900/30 to-gray-800/20 backdrop-blur-sm rounded-lg border border-gray-600/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent transform -skew-x-12 animate-slide" />
                <div className="relative flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">Patrick Mahomes</span>
                  <span className="text-xs bg-gradient-to-r from-red-600 to-pink-600 text-white px-2 py-1 rounded font-bold"
                    style={{ boxShadow: `0 0 10px ${neonColors.red}` }}>
                    QB1
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1 font-mono">KC vs BUF | Q4 2:47</div>
                <div className="text-3xl font-black text-transparent bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text"
                  style={{ textShadow: `0 0 20px ${neonColors.red}60` }}>
                  31.2 PTS
                </div>
                <div className="text-xs text-gray-300 mt-1">325 pass yds, 3 TD, 28 rush yds</div>
                <div className="text-xs text-green-400 mt-2 animate-pulse font-bold uppercase">🔴 LIVE</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide {
          from {
            transform: translateX(-100%) skewX(-12deg);
          }
          to {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        
        .animate-slide {
          animation: slide 3s linear infinite;
        }
      `}</style>
    </div>
  )
}