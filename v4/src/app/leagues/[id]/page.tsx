'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Trophy, Users, Calendar, Settings, TrendingUp, ChevronRight,
  Award, Shield, Star, Activity, Clock, Target, MessageSquare,
  BarChart2, FileText, DollarSign, Bell, Zap, ArrowUpRight,
  ArrowDownRight, Minus, UserPlus, RefreshCw, Gavel, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// Realistic NFL Fantasy Data
const mockLeagueData = {
  id: 'league-2024-nfl',
  name: 'The Gridiron Dynasty',
  description: 'Competitive 10-team PPR league established 2019',
  type: 'REDRAFT',
  scoringType: 'PPR',
  teamCount: 10,
  season: 2024,
  currentWeek: 8,
  logo: null,
  creatorId: 'user-1',
  totalTrades: 12,
  totalTransactions: 147,
  draftDate: '2024-09-01T19:00:00Z',
  playoffWeeks: [15, 16, 17],
  tradeDeadline: '2024-11-20T23:59:59Z',
  settings: {
    rosterSize: 16,
    startingLineup: {
      QB: 1,
      RB: 2,
      WR: 2,
      TE: 1,
      FLEX: 1,
      DST: 1,
      K: 1
    },
    waiverType: 'FAAB',
    waiverBudget: 100,
    playoffTeams: 6
  }
};

// Realistic team standings with NFL team themes
const mockStandings = [
  {
    id: 'team-1',
    name: 'Kansas City Dynasty',
    abbreviation: 'KCD',
    owner: { id: 'user-1', username: 'PatMahomes15', avatar: null },
    wins: 6,
    losses: 1,
    ties: 0,
    standing: 1,
    pointsFor: 892.4,
    pointsAgainst: 756.2,
    winPercentage: 0.857,
    pointsPerGame: 127.5,
    streak: 'W4',
    lastWeekRank: 1,
    playoffClinched: false,
    eliminated: false,
    currentWeekScore: 115.2,
    projectedScore: 128.5
  },
  {
    id: 'team-2',
    name: 'Baltimore Beatdown',
    abbreviation: 'BAL',
    owner: { id: 'user-2', username: 'LamarJackson8', avatar: null },
    wins: 5,
    losses: 2,
    ties: 0,
    standing: 2,
    pointsFor: 854.6,
    pointsAgainst: 798.3,
    winPercentage: 0.714,
    pointsPerGame: 122.1,
    streak: 'W2',
    lastWeekRank: 3,
    playoffClinched: false,
    eliminated: false,
    currentWeekScore: 102.8,
    projectedScore: 119.3
  },
  {
    id: 'team-3',
    name: 'SF Gold Rush',
    abbreviation: 'SFG',
    owner: { id: 'user-3', username: 'NinerEmpire', avatar: null },
    wins: 5,
    losses: 2,
    ties: 0,
    standing: 3,
    pointsFor: 841.2,
    pointsAgainst: 812.4,
    winPercentage: 0.714,
    pointsPerGame: 120.2,
    streak: 'L1',
    lastWeekRank: 2,
    playoffClinched: false,
    eliminated: false,
    currentWeekScore: 98.4,
    projectedScore: 116.7
  },
  {
    id: 'team-4',
    name: 'Buffalo Stampede',
    abbreviation: 'BUF',
    owner: { id: 'user-4', username: 'BillsMafia17', avatar: null },
    wins: 4,
    losses: 3,
    ties: 0,
    standing: 4,
    pointsFor: 823.7,
    pointsAgainst: 815.2,
    winPercentage: 0.571,
    pointsPerGame: 117.7,
    streak: 'W1',
    lastWeekRank: 5,
    playoffClinched: false,
    eliminated: false,
    currentWeekScore: 121.3,
    projectedScore: 114.2
  },
  {
    id: 'team-5',
    name: 'Philly Special',
    abbreviation: 'PHI',
    owner: { id: 'user-5', username: 'EaglesFlyHigh', avatar: null },
    wins: 4,
    losses: 3,
    ties: 0,
    standing: 5,
    pointsFor: 805.9,
    pointsAgainst: 798.6,
    winPercentage: 0.571,
    pointsPerGame: 115.1,
    streak: 'L2',
    lastWeekRank: 4,
    playoffClinched: false,
    eliminated: false,
    currentWeekScore: 89.6,
    projectedScore: 108.4
  },
  {
    id: 'team-6',
    name: 'Dallas Dynasty',
    abbreviation: 'DAL',
    owner: { id: 'user-6', username: 'CowboysNation88', avatar: null },
    wins: 3,
    losses: 4,
    ties: 0,
    standing: 6,
    pointsFor: 792.3,
    pointsAgainst: 824.1,
    winPercentage: 0.429,
    pointsPerGame: 113.2,
    streak: 'W1',
    lastWeekRank: 7,
    playoffClinched: false,
    eliminated: false,
    currentWeekScore: 106.9,
    projectedScore: 111.5
  },
  {
    id: 'team-7',
    name: 'Miami Hurricanes',
    abbreviation: 'MIA',
    owner: { id: 'user-7', username: 'FinsFan72', avatar: null },
    wins: 3,
    losses: 4,
    ties: 0,
    standing: 7,
    pointsFor: 781.5,
    pointsAgainst: 836.7,
    winPercentage: 0.429,
    pointsPerGame: 111.6,
    streak: 'L3',
    lastWeekRank: 6,
    playoffClinched: false,
    eliminated: false,
    currentWeekScore: 93.2,
    projectedScore: 105.8
  },
  {
    id: 'team-8',
    name: 'Green Bay Pack',
    abbreviation: 'GB',
    owner: { id: 'user-8', username: 'CheeseHead4Life', avatar: null },
    wins: 2,
    losses: 5,
    ties: 0,
    standing: 8,
    pointsFor: 756.8,
    pointsAgainst: 851.3,
    winPercentage: 0.286,
    pointsPerGame: 108.1,
    streak: 'L1',
    lastWeekRank: 8,
    playoffClinched: false,
    eliminated: false,
    currentWeekScore: 87.4,
    projectedScore: 102.6
  },
  {
    id: 'team-9',
    name: 'Detroit Roar',
    abbreviation: 'DET',
    owner: { id: 'user-9', username: 'LionsRise313', avatar: null },
    wins: 2,
    losses: 5,
    ties: 0,
    standing: 9,
    pointsFor: 742.3,
    pointsAgainst: 864.5,
    winPercentage: 0.286,
    pointsPerGame: 106.0,
    streak: 'W1',
    lastWeekRank: 10,
    playoffClinched: false,
    eliminated: false,
    currentWeekScore: 95.7,
    projectedScore: 99.3
  },
  {
    id: 'team-10',
    name: 'NY Giants Revenge',
    abbreviation: 'NYG',
    owner: { id: 'user-10', username: 'BigBlue4Ever', avatar: null },
    wins: 1,
    losses: 6,
    ties: 0,
    standing: 10,
    pointsFor: 698.4,
    pointsAgainst: 889.2,
    winPercentage: 0.143,
    pointsPerGame: 99.8,
    streak: 'L4',
    lastWeekRank: 9,
    playoffClinched: false,
    eliminated: false,
    currentWeekScore: 78.3,
    projectedScore: 94.7
  }
];

// This week's matchups
const mockMatchups = [
  {
    id: 'matchup-1',
    team1: mockStandings[0], // Kansas City Dynasty vs Baltimore Beatdown
    team2: mockStandings[1],
    week: 8
  },
  {
    id: 'matchup-2',
    team1: mockStandings[2], // SF Gold Rush vs Buffalo Stampede
    team2: mockStandings[3],
    week: 8
  },
  {
    id: 'matchup-3',
    team1: mockStandings[4], // Philly Special vs Dallas Dynasty
    team2: mockStandings[5],
    week: 8
  },
  {
    id: 'matchup-4',
    team1: mockStandings[6], // Miami Hurricanes vs Green Bay Pack
    team2: mockStandings[7],
    week: 8
  },
  {
    id: 'matchup-5',
    team1: mockStandings[8], // Detroit Roar vs NY Giants Revenge
    team2: mockStandings[9],
    week: 8
  }
];

// Recent activity with real NFL players
const mockRecentActivity = [
  {
    id: 'activity-1',
    type: 'trade',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    title: 'Trade Completed',
    description: 'Kansas City Dynasty trades Travis Kelce to Baltimore Beatdown for Mark Andrews and 2024 3rd round pick',
    teams: ['Kansas City Dynasty', 'Baltimore Beatdown'],
    icon: 'trade'
  },
  {
    id: 'activity-2',
    type: 'add',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    title: 'Waiver Claim',
    description: 'SF Gold Rush adds Jaylen Warren (RB - PIT) for $12 FAAB',
    teams: ['SF Gold Rush'],
    icon: 'add'
  },
  {
    id: 'activity-3',
    type: 'drop',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    title: 'Player Dropped',
    description: 'Buffalo Stampede drops Zay Jones (WR - JAX)',
    teams: ['Buffalo Stampede'],
    icon: 'drop'
  },
  {
    id: 'activity-4',
    type: 'trade',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    title: 'Trade Completed',
    description: 'Philly Special trades AJ Brown to Dallas Dynasty for CeeDee Lamb',
    teams: ['Philly Special', 'Dallas Dynasty'],
    icon: 'trade'
  },
  {
    id: 'activity-5',
    type: 'add',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
    title: 'Free Agent Add',
    description: 'Miami Hurricanes adds Tank Bigsby (RB - JAX)',
    teams: ['Miami Hurricanes'],
    icon: 'add'
  }
];

// League chat messages
const mockChatMessages = [
  {
    id: 'msg-1',
    userId: 'user-1',
    username: 'PatMahomes15',
    message: 'Good luck this week everyone! May the best team win 🏈',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    reactions: ['👍', '🔥']
  },
  {
    id: 'msg-2',
    userId: 'user-2',
    username: 'LamarJackson8',
    message: 'That Kelce trade is going to pay off big time. Thanks for the TE1!',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    reactions: ['😤']
  },
  {
    id: 'msg-3',
    userId: 'user-5',
    username: 'EaglesFlyHigh',
    message: 'Anyone interested in trading for a RB2? I\'m loaded at the position',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    reactions: ['👀', '💬']
  }
];

// Navigation tabs
const navigationTabs = [
  { id: 'overview', label: 'Overview', icon: Trophy, href: '' },
  { id: 'standings', label: 'Standings', icon: BarChart2, href: '/standings' },
  { id: 'schedule', label: 'Schedule', icon: Calendar, href: '/schedule' },
  { id: 'transactions', label: 'Transactions', icon: RefreshCw, href: '/transactions' },
  { id: 'playoffs', label: 'Playoffs', icon: Crown, href: '/playoffs' },
  { id: 'message-board', label: 'Message Board', icon: MessageSquare, href: '/message-board' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export default function LeagueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [league, setLeague] = useState(mockLeagueData);
  const [standings, setStandings] = useState(mockStandings);
  const [matchups, setMatchups] = useState(mockMatchups);
  const [recentActivity, setRecentActivity] = useState(mockRecentActivity);
  const [chatMessages, setChatMessages] = useState(mockChatMessages);
  const [loading, setLoading] = useState(false);
  const [showAllStandings, setShowAllStandings] = useState(false);
  
  const leagueId = params.id as string;
  const currentUserId = 'user-1'; // Mock current user
  const isCommissioner = league?.creatorId === currentUserId;

  // Calculate league stats
  const avgScore = standings.reduce((acc, team) => acc + (team.pointsPerGame || 0), 0) / standings.length;
  const highestScore = Math.max(...standings.map(t => t.pointsFor));
  const topScorer = standings.find(t => t.pointsFor === highestScore);

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trade': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'add': return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'drop': return <Minus className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get rank change indicator
  const getRankChange = (team: any) => {
    if (!team.lastWeekRank) return null;
    const change = team.lastWeekRank - team.standing;
    if (change > 0) return { type: 'up', value: change };
    if (change < 0) return { type: 'down', value: Math.abs(change) };
    return { type: 'same', value: 0 };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* League Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {league.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {league.type} · {league.scoringType} · {league.teamCount} Teams · Season {league.season}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Clock className="mr-1 h-3 w-3" />
                    Week {league.currentWeek} of 17
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <Calendar className="mr-1 h-3 w-3" />
                    Trade Deadline: Week 12
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isCommissioner && (
                <Button
                  onClick={() => router.push(`/leagues/${leagueId}/settings`)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Gavel className="h-4 w-4" />
                  <span className="hidden md:inline">Commissioner Tools</span>
                  <span className="md:hidden">Tools</span>
                </Button>
              )}
              <Button
                onClick={() => router.push(`/leagues/${leagueId}/invite`)}
                variant="default"
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden md:inline">Invite Members</span>
                <span className="md:hidden">Invite</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === 'overview';
              return (
                <button
                  key={tab.id}
                  onClick={() => tab.href && router.push(`/leagues/${leagueId}${tab.href}`)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap",
                    isActive
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* League Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Teams</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {standings.length}/{league.teamCount}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgScore.toFixed(1)}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Trades</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {league.totalTrades}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {league.totalTransactions}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Standings & Matchups */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Standings */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Current Standings
                </h2>
                <button
                  onClick={() => router.push(`/leagues/${leagueId}/standings`)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {standings.slice(0, showAllStandings ? 10 : 6).map((team) => {
                  const rankChange = getRankChange(team);
                  const isPlayoffPosition = team.standing <= 6;
                  
                  return (
                    <div
                      key={team.id}
                      onClick={() => router.push(`/team/${team.id}`)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700",
                        isPlayoffPosition && "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
                        team.standing === 6 && "border-b-2 border-blue-500"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {team.standing}
                          </span>
                          {team.standing === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                          {team.standing === 2 && <Award className="h-4 w-4 text-gray-400" />}
                          {team.standing === 3 && <Award className="h-4 w-4 text-orange-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {team.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{team.owner.username} · {team.wins}-{team.losses}
                            {team.ties > 0 && `-${team.ties}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {team.pointsFor.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {team.pointsPerGame.toFixed(1)} PPG
                          </p>
                        </div>
                        
                        {rankChange && (
                          <div className="flex items-center">
                            {rankChange.type === 'up' && (
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                            )}
                            {rankChange.type === 'down' && (
                              <ArrowDownRight className="h-4 w-4 text-red-500" />
                            )}
                            {rankChange.type === 'same' && (
                              <Minus className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {!showAllStandings && standings.length > 6 && (
                <button
                  onClick={() => setShowAllStandings(true)}
                  className="mt-4 w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Show All Teams
                </button>
              )}
            </Card>

            {/* This Week's Matchups */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Week {league.currentWeek} Matchups
                </h2>
                <button
                  onClick={() => router.push(`/leagues/${leagueId}/schedule`)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Full Schedule
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {matchups.map((matchup) => (
                  <div
                    key={matchup.id}
                    onClick={() => router.push(`/matchup/${matchup.id}`)}
                    className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {matchup.team1.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {matchup.team1.wins}-{matchup.team1.losses}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {matchup.team1.currentWeekScore.toFixed(1)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Proj: {matchup.team1.projectedScore.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
                            style={{ 
                              width: `${(matchup.team1.currentWeekScore / (matchup.team1.currentWeekScore + matchup.team2.currentWeekScore)) * 100}%` 
                            }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {matchup.team2.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {matchup.team2.wins}-{matchup.team2.losses}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {matchup.team2.currentWeekScore.toFixed(1)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Proj: {matchup.team2.projectedScore.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Activity & Chat */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Recent Activity
                </h2>
                <button
                  onClick={() => router.push(`/leagues/${leagueId}/transactions`)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* League Chat Preview */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  League Chat
                </h2>
                <button
                  onClick={() => router.push(`/leagues/${leagueId}/message-board`)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Open Chat
                </button>
              </div>
              
              <div className="space-y-3 mb-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                        {msg.username.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {msg.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(msg.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                        {msg.message}
                      </p>
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {msg.reactions.map((reaction, idx) => (
                            <span key={idx} className="text-xs">
                              {reaction}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-3 border-t dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={() => router.push(`/leagues/${leagueId}/message-board`)}
                    variant="default"
                    className="px-3 py-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Commissioner Tools Quick Access */}
            {isCommissioner && (
              <Card className="p-6 bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <Gavel className="h-6 w-6" />
                  <h3 className="text-lg font-semibold">Commissioner Tools</h3>
                </div>
                <p className="text-sm opacity-90 mb-4">
                  Manage your league settings, review trades, and handle disputes.
                </p>
                <Button
                  onClick={() => router.push(`/leagues/${leagueId}/settings`)}
                  variant="outline"
                  className="w-full bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  Open Commissioner Panel
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}