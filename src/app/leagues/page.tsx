'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Users, 
  Calendar, 
  TrendingUp, 
  Plus, 
  UserPlus,
  ChevronRight,
  Clock,
  Target,
  Shield,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Sample league data with realistic NFL fantasy football information
const sampleLeagues = [
  {
    id: 'league-1',
    name: 'Champions of the Gridiron',
    year: 2024,
    size: 10,
    type: 'Standard',
    status: 'active',
    currentWeek: 8,
    userTeam: {
      name: 'Mahomes Magic',
      rank: 2,
      record: { wins: 6, losses: 1, ties: 0 },
      pointsFor: 987.4,
      pointsAgainst: 842.2,
      streak: 'W4',
      playoffOdds: 94
    },
    nextMatchup: {
      opponent: 'Burrow\'s Bengals',
      opponentRank: 5,
      opponentRecord: { wins: 4, losses: 3 },
      week: 8,
      matchupTime: 'Sun 1:00 PM EST',
      projectedScore: { user: 112.4, opponent: 108.7 }
    },
    recentActivity: 'Trade accepted: Josh Jacobs for Calvin Ridley',
    draftDate: '2024-08-28',
    playoffWeeks: '15-17',
    tradeDeadline: '2024-11-15',
    commissioner: 'John Smith'
  },
  {
    id: 'league-2',
    name: 'Dynasty Warriors 2024',
    year: 2024,
    size: 12,
    type: 'Dynasty PPR',
    status: 'active',
    currentWeek: 8,
    userTeam: {
      name: 'Lamar\'s Legion',
      rank: 4,
      record: { wins: 5, losses: 2, ties: 0 },
      pointsFor: 1124.8,
      pointsAgainst: 1098.4,
      streak: 'W2',
      playoffOdds: 78
    },
    nextMatchup: {
      opponent: 'Herbert\'s Heroes',
      opponentRank: 1,
      opponentRecord: { wins: 7, losses: 0 },
      week: 8,
      matchupTime: 'Sun 1:00 PM EST',
      projectedScore: { user: 128.2, opponent: 135.6 }
    },
    recentActivity: 'Waiver claim: Added Romeo Doubs, Dropped Allen Lazard',
    draftDate: '2024-08-25',
    playoffWeeks: '15-17',
    tradeDeadline: '2024-11-22',
    commissioner: 'Sarah Johnson',
    dynastyYear: 3
  },
  {
    id: 'league-3',
    name: 'Office League 2024',
    year: 2024,
    size: 10,
    type: 'Half-PPR',
    status: 'active',
    currentWeek: 8,
    userTeam: {
      name: 'Allen\'s Army',
      rank: 7,
      record: { wins: 3, losses: 4, ties: 0 },
      pointsFor: 756.2,
      pointsAgainst: 812.9,
      streak: 'L1',
      playoffOdds: 42
    },
    nextMatchup: {
      opponent: 'Hurts So Good',
      opponentRank: 3,
      opponentRecord: { wins: 5, losses: 2 },
      week: 8,
      matchupTime: 'Sun 1:00 PM EST',
      projectedScore: { user: 105.8, opponent: 118.3 }
    },
    recentActivity: 'Lineup change: Benched D.J. Moore, Started Chris Olave',
    draftDate: '2024-09-02',
    playoffWeeks: '15-17',
    tradeDeadline: '2024-11-20',
    commissioner: 'Mike Williams'
  },
  {
    id: 'league-4',
    name: 'College Buddies Keeper',
    year: 2024,
    size: 14,
    type: 'Keeper',
    status: 'active',
    currentWeek: 8,
    userTeam: {
      name: 'Dak Attack',
      rank: 1,
      record: { wins: 7, losses: 0, ties: 0 },
      pointsFor: 1045.7,
      pointsAgainst: 889.3,
      streak: 'W7',
      playoffOdds: 99
    },
    nextMatchup: {
      opponent: 'Tua\'s Titans',
      opponentRank: 8,
      opponentRecord: { wins: 3, losses: 4 },
      week: 8,
      matchupTime: 'Sun 1:00 PM EST',
      projectedScore: { user: 122.1, opponent: 99.4 }
    },
    recentActivity: 'Trade offer received: Stefon Diggs for DeVonta Smith',
    draftDate: '2024-08-30',
    playoffWeeks: '15-17',
    tradeDeadline: '2024-11-18',
    commissioner: 'Dave Miller',
    keeperCount: 3
  }
];

// League type badge colors
const leagueTypeBadgeColors: Record<string, string> = {
  'Standard': 'bg-blue-100 text-blue-800',
  'PPR': 'bg-purple-100 text-purple-800',
  'Half-PPR': 'bg-indigo-100 text-indigo-800',
  'Dynasty PPR': 'bg-pink-100 text-pink-800',
  'Keeper': 'bg-teal-100 text-teal-800'
};

// Record color based on performance
const getRecordColor = (wins: number, losses: number) => {
  const winPercentage = wins / (wins + losses);
  if (winPercentage >= 0.7) return 'text-green-600';
  if (winPercentage >= 0.5) return 'text-yellow-600';
  return 'text-red-600';
};

// Playoff odds color
const getPlayoffOddsColor = (odds: number) => {
  if (odds >= 80) return 'text-green-600';
  if (odds >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

// Streak badge component
const StreakBadge: React.FC<{ streak: string }> = ({ streak }) => {
  const isWinning = streak.startsWith('W');
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isWinning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {isWinning ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
      {streak}
    </span>
  );
};

// Projected matchup component
const ProjectedMatchup: React.FC<{ userScore: number; opponentScore: number }> = ({ userScore, opponentScore }) => {
  const userWinning = userScore > opponentScore;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`font-semibold ${userWinning ? 'text-green-600' : 'text-gray-600'}`}>
        {userScore.toFixed(1)}
      </span>
      <span className="text-gray-400 mx-2">vs</span>
      <span className={`font-semibold ${!userWinning ? 'text-green-600' : 'text-gray-600'}`}>
        {opponentScore.toFixed(1)}
      </span>
    </div>
  );
};

export default function LeaguesPage() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Leagues</h1>
              <p className="mt-2 text-gray-600">2024 Season • Week 8</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Join League
              </button>
              <Link
                href="/leagues/create"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create League
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Total Leagues</p>
              <p className="text-2xl font-bold text-gray-900">{sampleLeagues.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Combined Record</p>
              <p className="text-2xl font-bold text-gray-900">21-7</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Avg. Rank</p>
              <p className="text-2xl font-bold text-gray-900">3.5</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Playoff Teams</p>
              <p className="text-2xl font-bold text-green-600">3/4</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leagues Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          {sampleLeagues.map((league) => (
            <div
              key={league.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              {/* League Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{league.name}</h3>
                    <div className="mt-2 flex items-center gap-3 text-blue-100">
                      <span className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        {league.size} Teams
                      </span>
                      <span className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        Week {league.currentWeek}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${leagueTypeBadgeColors[league.type]}`}>
                      {league.type}
                    </span>
                    {league.userTeam.rank === 1 && (
                      <Trophy className="w-5 h-5 text-yellow-300" />
                    )}
                  </div>
                </div>
              </div>

              {/* Team Info */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Your Team</p>
                    <p className="font-semibold text-gray-900">{league.userTeam.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Rank</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {league.userTeam.rank}
                      <span className="text-sm text-gray-500">/{league.size}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Record</p>
                    <p className={`font-semibold ${getRecordColor(league.userTeam.record.wins, league.userTeam.record.losses)}`}>
                      {league.userTeam.record.wins}-{league.userTeam.record.losses}
                      {league.userTeam.record.ties > 0 && `-${league.userTeam.record.ties}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Streak</p>
                    <StreakBadge streak={league.userTeam.streak} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Playoff %</p>
                    <p className={`font-semibold ${getPlayoffOddsColor(league.userTeam.playoffOdds)}`}>
                      {league.userTeam.playoffOdds}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Matchup */}
              <div className="p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Week {league.nextMatchup.week} Matchup</p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {league.nextMatchup.matchupTime}
                  </p>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-gray-600">vs {league.nextMatchup.opponent}</p>
                    <p className="text-xs text-gray-500">
                      Rank #{league.nextMatchup.opponentRank} ({league.nextMatchup.opponentRecord.wins}-{league.nextMatchup.opponentRecord.losses})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Projected</p>
                    <ProjectedMatchup 
                      userScore={league.nextMatchup.projectedScore.user}
                      opponentScore={league.nextMatchup.projectedScore.opponent}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-xs text-blue-800">{league.recentActivity}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 bg-white border-t">
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href={`/leagues/${league.id}/roster`}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Roster
                  </Link>
                  <Link
                    href={`/leagues/${league.id}/matchup`}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Target className="w-4 h-4 mr-1" />
                    Matchup
                  </Link>
                  <Link
                    href={`/leagues/${league.id}/standings`}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Trophy className="w-4 h-4 mr-1" />
                    Standings
                  </Link>
                </div>
                <Link
                  href={`/leagues/${league.id}`}
                  className="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  View League Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (shown when no leagues) */}
        {sampleLeagues.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leagues</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating or joining a league.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Join League
              </button>
              <Link
                href="/leagues/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create League
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Join League Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Join a League</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the league code provided by your commissioner to join an existing league.
            </p>
            <div className="mb-4">
              <label htmlFor="league-code" className="block text-sm font-medium text-gray-700 mb-2">
                League Code
              </label>
              <input
                type="text"
                id="league-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle join league logic
                  console.log('Joining league with code:', joinCode);
                  setShowJoinModal(false);
                }}
                disabled={joinCode.length !== 6}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Join League
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}