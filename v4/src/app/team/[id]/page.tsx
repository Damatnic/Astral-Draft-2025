'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { 
  Trophy, 
  Activity, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  ChevronRight,
  Shield,
  Zap,
  Heart
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
}

interface TeamData {
  id: string;
  name: string;
  logo: string;
  owner: string;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  standing: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
  roster: Player[];
  bench: Player[];
  matchup: {
    opponent: string;
    opponentLogo: string;
    week: number;
    myScore: number;
    opponentScore: number;
    projectedScore: number;
    opponentProjectedScore: number;
  };
}

// Mock data with real NFL players
const mockTeamData: TeamData = {
  id: '1',
  name: 'Dallas Dynasty',
  logo: '/team-logos/dallas.png',
  owner: 'John Smith',
  record: { wins: 8, losses: 3, ties: 0 },
  standing: 2,
  pointsFor: 1245.5,
  pointsAgainst: 1098.3,
  streak: 'W3',
  roster: [
    { id: '1', name: 'Dak Prescott', position: 'QB', team: 'DAL', photo: '/players/dak.jpg', status: 'healthy', projectedPoints: 22.5, actualPoints: 18.3, byeWeek: 7 },
    { id: '2', name: 'Breece Hall', position: 'RB', team: 'NYJ', photo: '/players/breece.jpg', status: 'healthy', projectedPoints: 16.8, actualPoints: 19.2, byeWeek: 10 },
    { id: '3', name: 'Kenneth Walker', position: 'RB', team: 'SEA', photo: '/players/walker.jpg', status: 'questionable', projectedPoints: 14.2, actualPoints: 12.1, byeWeek: 5 },
    { id: '4', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', photo: '/players/ceedee.jpg', status: 'healthy', projectedPoints: 18.4, actualPoints: 21.5, byeWeek: 7 },
    { id: '5', name: 'AJ Brown', position: 'WR', team: 'PHI', photo: '/players/ajbrown.jpg', status: 'healthy', projectedPoints: 17.2, actualPoints: 15.8, byeWeek: 10 },
    { id: '6', name: 'Sam LaPorta', position: 'TE', team: 'DET', photo: '/players/laporta.jpg', status: 'healthy', projectedPoints: 11.5, actualPoints: 13.2, byeWeek: 9 },
    { id: '7', name: 'Chris Olave', position: 'FLEX', team: 'NO', photo: '/players/olave.jpg', status: 'healthy', projectedPoints: 13.8, actualPoints: 14.5, byeWeek: 11 },
    { id: '8', name: 'Justin Tucker', position: 'K', team: 'BAL', photo: '/players/tucker.jpg', status: 'healthy', projectedPoints: 8.5, actualPoints: 10.0, byeWeek: 13 },
    { id: '9', name: 'San Francisco', position: 'DEF', team: 'SF', photo: '/teams/sf.jpg', status: 'healthy', projectedPoints: 9.0, actualPoints: 12.0, byeWeek: 9 }
  ],
  bench: [
    { id: '10', name: 'Calvin Ridley', position: 'WR', team: 'TEN', photo: '/players/ridley.jpg', status: 'healthy', projectedPoints: 12.3, byeWeek: 5 },
    { id: '11', name: 'James Cook', position: 'RB', team: 'BUF', photo: '/players/cook.jpg', status: 'healthy', projectedPoints: 11.8, byeWeek: 13 },
    { id: '12', name: 'Drake London', position: 'WR', team: 'ATL', photo: '/players/london.jpg', status: 'healthy', projectedPoints: 10.5, byeWeek: 11 },
    { id: '13', name: 'Dalton Kincaid', position: 'TE', team: 'BUF', photo: '/players/kincaid.jpg', status: 'healthy', projectedPoints: 8.2, byeWeek: 13 },
    { id: '14', name: 'Jared Goff', position: 'QB', team: 'DET', photo: '/players/goff.jpg', status: 'healthy', projectedPoints: 18.5, byeWeek: 9 },
    { id: '15', name: 'Tyler Bass', position: 'K', team: 'BUF', photo: '/players/bass.jpg', status: 'healthy', projectedPoints: 7.5, byeWeek: 13 }
  ],
  matchup: {
    opponent: 'Green Bay Glory',
    opponentLogo: '/team-logos/gb.png',
    week: 12,
    myScore: 98.5,
    opponentScore: 87.2,
    projectedScore: 132.9,
    opponentProjectedScore: 125.4
  }
};

const recentTransactions = [
  { type: 'add', player: 'Calvin Ridley', date: '2 days ago', action: 'Added from Waivers' },
  { type: 'drop', player: 'Zay Flowers', date: '2 days ago', action: 'Dropped' },
  { type: 'trade', player: 'Traded for AJ Brown', date: '1 week ago', action: 'Trade Completed' }
];

const teamNews = [
  { title: 'CeeDee Lamb limited in practice', time: '2 hours ago', impact: 'Monitor for Sunday' },
  { title: 'Kenneth Walker questionable for Week 12', time: '5 hours ago', impact: 'Game-time decision' },
  { title: 'Breece Hall sees increased targets', time: '1 day ago', impact: 'Positive trend' }
];

export default function TeamDashboard() {
  const params = useParams();
  const [team, setTeam] = useState<TeamData>(mockTeamData);
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'healthy': return 'text-green-500';
      case 'questionable': return 'text-yellow-500';
      case 'doubtful': return 'text-orange-500';
      case 'out': return 'text-red-500';
      case 'ir': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'healthy': return <Heart className="w-4 h-4 text-green-500" />;
      case 'questionable': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'doubtful': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'out': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'ir': return <Shield className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Team Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl">🏈</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold">{team.name}</h1>
                <p className="text-xl opacity-90">Owner: {team.owner}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-2xl font-semibold">
                    {team.record.wins}-{team.record.losses}
                    {team.record.ties > 0 && `-${team.record.ties}`}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {team.standing === 1 ? '1st' : team.standing === 2 ? '2nd' : team.standing === 3 ? '3rd' : `${team.standing}th`} Place
                  </span>
                  <span className="px-3 py-1 bg-green-500/30 rounded-full text-sm flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {team.streak}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link href={`/team/${params.id}/roster`}>
                <button className="px-6 py-3 bg-white text-blue-900 rounded-lg font-semibold hover:bg-gray-100 transition">
                  Manage Roster
                </button>
              </Link>
              <Link href={`/team/${params.id}/matchup`}>
                <button className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition">
                  View Matchup
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {['overview', 'roster', 'schedule', 'stats', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Week Matchup */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Week {team.matchup.week} Matchup</h2>
                <span className="text-sm text-gray-500">Live Scoring</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-3xl">🏈</span>
                  </div>
                  <h3 className="font-semibold">{team.name}</h3>
                  <div className="text-3xl font-bold mt-2">{team.matchup.myScore}</div>
                  <div className="text-sm text-gray-500">Projected: {team.matchup.projectedScore}</div>
                </div>
                <div className="px-4">
                  <div className="text-2xl font-bold text-gray-400">VS</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-3xl">🧀</span>
                  </div>
                  <h3 className="font-semibold">{team.matchup.opponent}</h3>
                  <div className="text-3xl font-bold mt-2">{team.matchup.opponentScore}</div>
                  <div className="text-sm text-gray-500">Projected: {team.matchup.opponentProjectedScore}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Win Probability</span>
                  <span className="text-lg font-semibold text-green-600">68%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>
            </div>

            {/* Starting Lineup */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Starting Lineup</h2>
                <Link href={`/team/${params.id}/roster`}>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Edit Lineup →
                  </button>
                </Link>
              </div>
              <div className="space-y-3">
                {team.roster.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">{player.position}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{player.name}</span>
                          {getStatusIcon(player.status)}
                        </div>
                        <div className="text-sm text-gray-500">{player.team} - {player.position}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{player.actualPoints || '--'}</div>
                      <div className="text-sm text-gray-500">Proj: {player.projectedPoints}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Points</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{team.matchup.myScore}</span>
                    <span className="text-sm text-gray-500 ml-2">/ {team.matchup.projectedScore} proj</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bench Players */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Bench</h2>
              <div className="grid grid-cols-2 gap-3">
                {team.bench.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold bg-gray-200 px-2 py-1 rounded">{player.position}</span>
                      <div>
                        <div className="font-medium text-sm">{player.name}</div>
                        <div className="text-xs text-gray-500">{player.team}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">{player.projectedPoints}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Coach Assistant */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Coach Assistant</h3>
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Lineup Suggestion</p>
                  <p className="text-xs opacity-90">Consider benching Kenneth Walker (Q) for James Cook this week</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Waiver Wire Alert</p>
                  <p className="text-xs opacity-90">Tank Dell is available and projected for 14.5 pts</p>
                </div>
                <button className="w-full bg-white text-purple-700 rounded-lg py-2 text-sm font-semibold hover:bg-purple-50 transition">
                  Get Full Analysis
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      transaction.type === 'add' ? 'bg-green-500' : 
                      transaction.type === 'drop' ? 'bg-red-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{transaction.action}</p>
                      <p className="text-xs text-gray-500">{transaction.player} • {transaction.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-blue-600 text-sm font-medium hover:text-blue-700">
                View All Transactions →
              </button>
            </div>

            {/* Injury Report */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Injury Report</h3>
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="space-y-3">
                {team.roster.concat(team.bench)
                  .filter(p => p.status !== 'healthy')
                  .map((player) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(player.status)}
                        <span className="text-sm font-medium">{player.name}</span>
                      </div>
                      <span className={`text-xs font-medium ${getStatusColor(player.status)}`}>
                        {player.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Team News */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Team News</h3>
              <div className="space-y-3">
                {teamNews.map((news, index) => (
                  <div key={index} className="border-l-2 border-blue-500 pl-3">
                    <p className="text-sm font-medium">{news.title}</p>
                    <p className="text-xs text-gray-500">{news.time} • {news.impact}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-blue-600 text-sm font-medium hover:text-blue-700">
                View All News →
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href={`/team/${params.id}/roster`}>
                  <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-between">
                    <span className="text-sm font-medium">Set Lineup</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </Link>
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-between">
                  <span className="text-sm font-medium">Propose Trade</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-between">
                  <span className="text-sm font-medium">Waiver Wire</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-between">
                  <span className="text-sm font-medium">Free Agents</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}