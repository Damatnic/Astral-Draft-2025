'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Trophy, Users, Calendar, TrendingUp, Search, Filter, Grid, List, Zap, Shield, Target, Activity, Award, Star, Flame, Crown, Swords, Gamepad2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { League } from '@/types';
import './leagues.css'

// Mock data interface for display purposes only
interface MockLeagueDisplay {
  id: string
  name: string
  type: 'public' | 'private'
  format: 'standard' | 'ppr' | 'dynasty' | 'keeper'
  teams: number
  currentRank: number
  record: string
  pointsFor: number
  pointsAgainst: number
  nextMatchup: string
  draftDate: string
  status: 'drafting' | 'active' | 'completed' | 'playoffs'
  badge?: string
  winStreak?: number
  powerRanking?: number
  playoffOdds?: number
  recentActivity?: {
    type: 'trade' | 'waiver' | 'score' | 'achievement'
    message: string
    time: string
  }[]
}

const mockLeagues: MockLeagueDisplay[] = [
  {
    id: '1',
    name: 'Championship Chase 2024',
    type: 'private',
    format: 'ppr',
    teams: 12,
    currentRank: 3,
    record: '8-2',
    pointsFor: 1247.8,
    pointsAgainst: 1156.3,
    nextMatchup: 'vs Team Alpha',
    draftDate: '2024-08-28',
    status: 'active',
    badge: '🔥',
    winStreak: 4,
    powerRanking: 2,
    playoffOdds: 87,
    recentActivity: [
      { type: 'trade', message: 'Completed blockbuster trade', time: '2h ago' },
      { type: 'score', message: 'Highest score of the week!', time: '1d ago' }
    ]
  },
  {
    id: '2',
    name: 'Dynasty Warriors',
    type: 'public',
    format: 'dynasty',
    teams: 10,
    currentRank: 1,
    record: '9-1',
    pointsFor: 1389.2,
    pointsAgainst: 1098.7,
    nextMatchup: 'vs The Underdogs',
    draftDate: '2024-08-15',
    status: 'active',
    badge: '👑',
    winStreak: 7,
    powerRanking: 1,
    playoffOdds: 98,
    recentActivity: [
      { type: 'achievement', message: 'Unlocked 7-game win streak!', time: '3h ago' },
      { type: 'waiver', message: 'Added hot waiver pickup', time: '2d ago' }
    ]
  },
  {
    id: '3',
    name: 'Keeper League Elite',
    type: 'private',
    format: 'keeper',
    teams: 14,
    currentRank: 7,
    record: '5-5',
    pointsFor: 1145.6,
    pointsAgainst: 1189.2,
    nextMatchup: 'vs Dynasty Builders',
    draftDate: '2024-09-01',
    status: 'active',
    winStreak: -2,
    powerRanking: 8,
    playoffOdds: 42
  },
  {
    id: '4',
    name: 'Standard Scoring Masters',
    type: 'public',
    format: 'standard',
    teams: 8,
    currentRank: 2,
    record: '7-3',
    pointsFor: 987.4,
    pointsAgainst: 892.1,
    nextMatchup: 'vs Grid Iron Gang',
    draftDate: '2024-08-20',
    status: 'playoffs',
    badge: '🏆',
    winStreak: 3,
    powerRanking: 3,
    playoffOdds: 100,
    recentActivity: [
      { type: 'achievement', message: 'Clinched playoff spot!', time: '1d ago' }
    ]
  }
]

export default function LeaguesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFormat, setFilterFormat] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [hoveredLeague, setHoveredLeague] = useState<string | null>(null)
  const [glitchActive, setGlitchActive] = useState(false)
  
  // Fetch user's leagues from database
  const { data: userLeagues, isLoading: leaguesLoading } = api.league.getMyLeagues.useQuery(
    undefined,
    {
      enabled: !!session?.user,
      refetchOnWindowFocus: false,
    }
  )
  
  // Fetch available public leagues
  // TODO: Add getPublicLeagues endpoint to tRPC router
  const publicLeagues: any[] = []
  
  // Create league mutation
  const createLeagueMutation = api.league.create.useMutation({
    onSuccess: (data) => {
      router.push(`/leagues/${data.id}`)
    },
    onError: (error) => {
      console.error('Failed to create league:', error)
    },
  })
  
  // Join league mutation
  const joinLeagueMutation = api.league.join.useMutation({
    onSuccess: () => {
      // Refetch leagues after joining
      router.refresh()
    },
    onError: (error) => {
      console.error('Failed to join league:', error)
    },
  })

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])
  
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 200)
    }, 8000)
    return () => clearInterval(glitchInterval)
  }, [])

  // Transform real league data to display format or use mock data as fallback
  const allLeagues = userLeagues?.map(league => ({
    id: league.id,
    name: league.name,
    type: league.isPublic ? 'public' : 'private' as 'public' | 'private',
    format: league.scoringType.toLowerCase() as 'standard' | 'ppr' | 'dynasty' | 'keeper',
    teams: league.teamCount,
    status: league.status.toLowerCase() as 'drafting' | 'active' | 'completed' | 'playoffs',
    // Mock computed fields for display - these would come from API in real implementation
    currentRank: 1,
    record: '0-0',
    pointsFor: 0,
    pointsAgainst: 0,
    nextMatchup: 'TBD',
    draftDate: league.createdAt.toISOString(),
    winStreak: 0,
    powerRanking: 1,
    playoffOdds: 50,
    badge: undefined,
    recentActivity: undefined,
  })) || mockLeagues
  
  const filteredLeagues = allLeagues.filter(league => {
    const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFormat = filterFormat === 'all' || league.format === filterFormat
    return matchesSearch && matchesFormat
  })

  const getStatusGlow = (status: string) => {
    switch (status) {
      case 'active': return 'status-active'
      case 'playoffs': return 'status-playoffs'
      case 'drafting': return 'status-drafting'
      case 'completed': return 'status-completed'
      default: return ''
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'ppr': return '⚡'
      case 'dynasty': return '👑'
      case 'keeper': return '🔒'
      case 'standard': return '🎯'
      default: return '🏈'
    }
  }

  const getStreakDisplay = (streak?: number) => {
    if (!streak) return null
    if (streak > 0) return { text: `W${streak}`, class: 'streak-win' }
    return { text: `L${Math.abs(streak)}`, class: 'streak-loss' }
  }

  return (
    <div className={`leagues-page ${glitchActive ? 'glitch-active' : ''}`}>
      {/* Cyber Background Effects */}
      <div className="cyber-bg-effects">
        <div className="hologram-grid"></div>
        <div className="scan-effect"></div>
        <div className="floating-particles">
          {[...Array(15)].map((_, i) => (
            <div key={i} className={`particle p-${i}`}></div>
          ))}
        </div>
      </div>

      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="cyber-title" data-text="MY LEAGUES">
              <span className="title-glitch">MY LEAGUES</span>
              MY LEAGUES
            </h1>
            <p className="cyber-subtitle">MANAGE YOUR FANTASY FOOTBALL EMPIRE</p>
          </div>
          <div className="header-effects">
            <div className="pulse-ring"></div>
            <div className="pulse-ring delay"></div>
          </div>
        </div>
      </div>

      {/* Holographic Stats Dashboard */}
      <div className="holo-stats-grid">
        <div className="holo-stat-card">
          <div className="stat-bg-effect"></div>
          <div className="stat-content">
            <div className="stat-icon-wrapper">
              <Users className="stat-icon" />
              <div className="icon-glow"></div>
            </div>
            <div className="stat-info">
              <span className="stat-label">TOTAL LEAGUES</span>
              <span className="stat-value" data-value={allLeagues.length}>
                {leaguesLoading ? '...' : allLeagues.length}
              </span>
            </div>
            <div className="stat-border"></div>
          </div>
        </div>

        <div className="holo-stat-card active-card">
          <div className="stat-bg-effect"></div>
          <div className="stat-content">
            <div className="stat-icon-wrapper">
              <Activity className="stat-icon" />
              <div className="icon-glow"></div>
            </div>
            <div className="stat-info">
              <span className="stat-label">ACTIVE</span>
              <span className="stat-value" data-value={allLeagues.filter(l => l.status === 'active').length}>
                {leaguesLoading ? '...' : allLeagues.filter(l => l.status === 'active').length}
              </span>
            </div>
            <div className="stat-border"></div>
          </div>
        </div>

        <div className="holo-stat-card playoffs-card">
          <div className="stat-bg-effect"></div>
          <div className="stat-content">
            <div className="stat-icon-wrapper">
              <Trophy className="stat-icon" />
              <div className="icon-glow"></div>
            </div>
            <div className="stat-info">
              <span className="stat-label">IN PLAYOFFS</span>
              <span className="stat-value" data-value={allLeagues.filter(l => l.status === 'playoffs').length}>
                {leaguesLoading ? '...' : allLeagues.filter(l => l.status === 'playoffs').length}
              </span>
            </div>
            <div className="stat-border"></div>
          </div>
        </div>

        <div className="holo-stat-card win-card">
          <div className="stat-bg-effect"></div>
          <div className="stat-content">
            <div className="stat-icon-wrapper">
              <Award className="stat-icon" />
              <div className="icon-glow"></div>
            </div>
            <div className="stat-info">
              <span className="stat-label">WIN RATE</span>
              <span className="stat-value" data-value="72%">72%</span>
            </div>
            <div className="stat-border"></div>
          </div>
        </div>
      </div>

      {/* Cyber Control Panel */}
      <div className="cyber-control-panel">
        <div className="panel-glow"></div>
        <div className="control-section search-section">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="SEARCH LEAGUES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cyber-search"
            />
            <div className="search-scan"></div>
          </div>
        </div>

        <div className="control-section filter-section">
          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="cyber-select"
          >
            <option value="all">ALL FORMATS</option>
            <option value="standard">STANDARD</option>
            <option value="ppr">PPR</option>
            <option value="dynasty">DYNASTY</option>
            <option value="keeper">KEEPER</option>
          </select>
        </div>

        <div className="control-section view-section">
          <button
            onClick={() => setViewMode('grid')}
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
          >
            <Grid className="view-icon" />
            <span className="btn-glow"></span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
          >
            <List className="view-icon" />
            <span className="btn-glow"></span>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-grid">
        <Link href="/leagues/create" className="cyber-action-btn create-btn">
          <div className="btn-bg-effect"></div>
          <div className="btn-content">
            <Plus className="btn-icon" />
            <span className="btn-text">CREATE NEW LEAGUE</span>
            <div className="btn-energy"></div>
          </div>
          <div className="btn-border"></div>
        </Link>

        <Link href="/leagues/join" className="cyber-action-btn join-btn">
          <div className="btn-bg-effect"></div>
          <div className="btn-content">
            <Users className="btn-icon" />
            <span className="btn-text">JOIN LEAGUE</span>
            <div className="btn-energy"></div>
          </div>
          <div className="btn-border"></div>
        </Link>
      </div>

      {/* Loading State */}
      {leaguesLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-cyan-400 font-mono">LOADING LEAGUES...</p>
          </div>
        </div>
      )}
      
      {/* Leagues Display */}
      {!leaguesLoading && viewMode === 'grid' ? (
        <div className="cyber-leagues-grid">
          {filteredLeagues.map((league) => {
            const streak = getStreakDisplay(league.winStreak || 0)
            return (
              <Link key={league.id} href={`/leagues/${league.id}`}>
                <div 
                  className={`cyber-league-card ${getStatusGlow(league.status)} ${hoveredLeague === league.id ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredLeague(league.id)}
                  onMouseLeave={() => setHoveredLeague(null)}
                >
                  {/* Card Background Effects */}
                  <div className="card-bg-grid"></div>
                  <div className="card-scan-line"></div>
                  <div className="card-glow"></div>
                  
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="league-title-section">
                      <div className="format-icon">{getFormatIcon(league.format)}</div>
                      <h3 className="league-name">
                        {league.badge && <span className="league-badge">{league.badge}</span>}
                        {league.name}
                      </h3>
                    </div>
                    <div className="status-indicator">
                      <span className={`status-badge ${getStatusGlow(league.status)}`}>
                        {league.status.toUpperCase()}
                      </span>
                      <div className="status-pulse"></div>
                    </div>
                  </div>

                  {/* Holographic Display */}
                  <div className="holo-display">
                    <div className="rank-display">
                      <div className="rank-label">RANK</div>
                      <div className="rank-value">#{league.currentRank}</div>
                      <div className="rank-total">/{league.teams}</div>
                    </div>
                    <div className="record-display">
                      <div className="record-label">RECORD</div>
                      <div className="record-value">{league.record}</div>
                      {streak && (
                        <span className={`streak-badge ${streak.class}`}>
                          {streak.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-key">PF</span>
                      <span className="stat-val">{league.pointsFor.toFixed(1)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-key">PA</span>
                      <span className="stat-val">{league.pointsAgainst.toFixed(1)}</span>
                    </div>
                    {league.powerRanking && (
                      <div className="stat-item">
                        <span className="stat-key">PWR</span>
                        <span className="stat-val">#{league.powerRanking}</span>
                      </div>
                    )}
                    {league.playoffOdds && (
                      <div className="stat-item">
                        <span className="stat-key">PLAYOFF%</span>
                        <span className="stat-val">{league.playoffOdds}%</span>
                      </div>
                    )}
                  </div>

                  {/* Next Matchup */}
                  <div className="matchup-display">
                    <div className="matchup-label">NEXT MATCHUP</div>
                    <div className="matchup-value">{league.nextMatchup}</div>
                    <div className="matchup-scan"></div>
                  </div>

                  {/* Activity Feed */}
                  {league.recentActivity && league.recentActivity.length > 0 && (
                    <div className="activity-feed">
                      <div className="feed-header">RECENT ACTIVITY</div>
                      {league.recentActivity?.slice(0, 2).map((activity: any, idx: number) => (
                        <div key={idx} className="activity-item">
                          <div className={`activity-icon ${activity.type}`}>
                            {activity.type === 'trade' && '🔄'}
                            {activity.type === 'waiver' && '📋'}
                            {activity.type === 'score' && '📊'}
                            {activity.type === 'achievement' && '🏆'}
                          </div>
                          <div className="activity-text">{activity.message}</div>
                          <div className="activity-time">{activity.time}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="card-footer">
                    <div className="footer-content">
                      <span className="view-league-text">ACCESS LEAGUE</span>
                      <Zap className="footer-icon" />
                    </div>
                    <div className="footer-glow"></div>
                  </div>

                  {/* Hover Effects */}
                  <div className="card-hover-effect">
                    <div className="hover-border"></div>
                    <div className="hover-corners">
                      <div className="corner tl"></div>
                      <div className="corner tr"></div>
                      <div className="corner bl"></div>
                      <div className="corner br"></div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : !leaguesLoading ? (
        <div className="cyber-leagues-list">
          <div className="list-header">
            <div className="header-cell">LEAGUE</div>
            <div className="header-cell">FORMAT</div>
            <div className="header-cell">RANK</div>
            <div className="header-cell">RECORD</div>
            <div className="header-cell">POINTS</div>
            <div className="header-cell">STATUS</div>
          </div>
          <div className="list-body">
            {filteredLeagues.map((league) => {
              const streak = getStreakDisplay(league.winStreak || 0)
              return (
                <Link key={league.id} href={`/leagues/${league.id}`}>
                  <div className="list-row">
                    <div className="list-cell league-cell">
                      <div className="format-icon">{getFormatIcon(league.format)}</div>
                      <div className="league-info">
                        <span className="league-name">
                          {league.badge && <span className="badge">{league.badge}</span>}
                          {league.name}
                        </span>
                        <span className="team-count">{league.teams} TEAMS</span>
                      </div>
                    </div>
                    <div className="list-cell format-cell">
                      <span className="format-badge">{league.format.toUpperCase()}</span>
                    </div>
                    <div className="list-cell rank-cell">
                      <span className="rank-display">#{league.currentRank}</span>
                      {league.powerRanking && (
                        <span className="power-rank">PWR #{league.powerRanking}</span>
                      )}
                    </div>
                    <div className="list-cell record-cell">
                      <span className="record">{league.record}</span>
                      {streak && (
                        <span className={`streak ${streak.class}`}>{streak.text}</span>
                      )}
                    </div>
                    <div className="list-cell points-cell">
                      <div className="points-display">
                        <span className="pf">{league.pointsFor.toFixed(1)} PF</span>
                        <span className="pa">{league.pointsAgainst.toFixed(1)} PA</span>
                      </div>
                    </div>
                    <div className="list-cell status-cell">
                      <span className={`status-indicator ${getStatusGlow(league.status)}`}>
                        {league.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="row-hover-effect"></div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Glitch Overlay */}
      {glitchActive && <div className="glitch-overlay"></div>}
    </div>
  )
}