'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { 
  Trophy,
  TrendingUp,
  Users,
  Activity,
  Settings,
  Award,
  ChevronRight,
  Edit,
  Share2,
  BarChart3,
  Target,
  Zap,
  Shield,
  Star
} from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'achievements' | 'teams' | 'h2h'>('overview');

  const { data: profile, isLoading } = api.user.getProfile.useQuery(
    { userId: session?.user?.id },
    { enabled: !!session?.user?.id }
  );

  const { data: h2hRecords } = api.user.getHeadToHeadRecords.useQuery(
    undefined,
    { enabled: !!session?.user?.id && activeTab === 'h2h' }
  );

  if (!session) {
    router.push('/login');
    return null;
  }

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500';
      case 'epic': return 'text-purple-500';
      case 'rare': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trade': return '🤝';
      case 'waiver': return '📋';
      case 'roster_move': return '🔄';
      case 'message': return '💬';
      case 'draft_pick': return '🎯';
      case 'win': return '✅';
      case 'loss': return '❌';
      default: return '📌';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex items-center space-x-6 mb-4 md:mb-0">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 p-1">
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-3xl md:text-4xl font-bold">
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
              </div>
              {profile.stats.championships > 0 && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-2">
                  <Trophy className="w-4 h-4 text-gray-900" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {profile.name || profile.username}
              </h1>
              <p className="text-gray-300">@{profile.username}</p>
              {profile.bio && (
                <p className="text-gray-400 mt-2 max-w-md">{profile.bio}</p>
              )}
              <div className="flex items-center space-x-4 mt-3">
                <span className="text-sm text-gray-400">
                  Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                </span>
                {profile.experienceLevel && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs uppercase">
                    {profile.experienceLevel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="border-gray-600 text-white hover:bg-gray-800"
              onClick={() => router.push('/settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Win Rate</p>
            <p className="text-2xl font-bold text-white">
              {(profile.stats.winPercentage * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Championships</p>
            <p className="text-2xl font-bold text-white">{profile.stats.championships}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Wins</p>
            <p className="text-2xl font-bold text-white">{profile.stats.totalWins}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Avg Points</p>
            <p className="text-2xl font-bold text-white">
              {profile.stats.averagePoints.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
        {['overview', 'stats', 'achievements', 'teams', 'h2h'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 px-4 rounded-md transition-colors capitalize ${
              activeTab === tab 
                ? 'bg-green-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab === 'h2h' ? 'Head to Head' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.recentActivity?.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-900 rounded-lg">
                      <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{activity.title}</p>
                        <p className="text-gray-400 text-sm">{activity.description}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                          {activity.leagueName && (
                            <Link 
                              href={`/leagues/${activity.leagueId}`}
                              className="text-xs text-green-500 hover:text-green-400"
                            >
                              {activity.leagueName}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trophy Cabinet */}
          <div>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Trophy Cabinet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.achievements
                    ?.filter(a => a.unlockedAt)
                    .slice(0, 5)
                    .map((achievement) => (
                      <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-900 rounded-lg">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <p className={`font-medium ${getRarityColor(achievement.rarity)}`}>
                            {achievement.name}
                          </p>
                          <p className="text-gray-500 text-xs">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setActiveTab('achievements')}
                >
                  View All Achievements
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Performance Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Record</span>
                  <span className="text-white font-medium">
                    {profile.stats.totalWins}-{profile.stats.totalLosses}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Percentage</span>
                  <span className="text-white font-medium">
                    {(profile.stats.winPercentage * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Points</span>
                  <span className="text-white font-medium">
                    {profile.stats.totalPoints.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Points/Week</span>
                  <span className="text-white font-medium">
                    {profile.stats.averagePoints.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Best Finish</span>
                  <span className="text-white font-medium">
                    {profile.stats.bestFinish === Infinity ? 'N/A' : `#${profile.stats.bestFinish}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Championships</span>
                  <span className="text-white font-medium">{profile.stats.championships}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Playoff Appearances</span>
                  <span className="text-white font-medium">{profile.stats.playoffAppearances}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Streak</span>
                  <span className="text-white font-medium">
                    {profile.stats.currentStreak > 0 ? `W${profile.stats.currentStreak}` : 
                     profile.stats.currentStreak < 0 ? `L${Math.abs(profile.stats.currentStreak)}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Longest Win Streak</span>
                  <span className="text-white font-medium">{profile.stats.longestWinStreak}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-500" />
                Transaction Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Trades</span>
                  <span className="text-white font-medium">{profile.stats.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Successful Waivers</span>
                  <span className="text-white font-medium">{profile.stats.successfulWaivers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile.achievements?.map((achievement) => (
            <Card 
              key={achievement.id} 
              className={`bg-gray-800 border-gray-700 ${
                achievement.unlockedAt ? '' : 'opacity-50'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <span className="text-3xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${getRarityColor(achievement.rarity)}`}>
                      {achievement.name}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">{achievement.description}</p>
                    {achievement.progress !== undefined && achievement.maxProgress && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {achievement.unlockedAt && (
                      <p className="text-xs text-green-500 mt-2">
                        Unlocked {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profile.teams?.map((team) => (
            <Card key={team.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>{team.league?.name || 'League'}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      0-0
                    </p>
                    <p className="text-sm text-gray-400">
                      1/10
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Points For</p>
                    <p className="text-white font-medium">{team.pointsFor.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Points Against</p>
                    <p className="text-white font-medium">{team.pointsAgainst.toFixed(1)}</p>
                  </div>
                </div>
                <Link href={`/team/${team.id}`}>
                  <Button variant="outline" className="w-full mt-4">
                    View Team
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'h2h' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {h2hRecords?.map((record) => (
            <Card key={record.opponentId} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white font-bold">
                    {record.opponentName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{record.opponentName}</h3>
                    <p className="text-2xl font-bold text-white">
                      {record.wins}-{record.losses}
                      {record.ties > 0 && `-${record.ties}`}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total PF</span>
                    <span className="text-white">{record.totalPointsFor.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total PA</span>
                    <span className="text-white">{record.totalPointsAgainst.toFixed(1)}</span>
                  </div>
                  {record.lastMatchup && (
                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-gray-400 text-xs mb-1">Last Matchup (Week {record.lastMatchup.week})</p>
                      <div className="flex justify-between">
                        <span className={record.lastMatchup.result === 'win' ? 'text-green-500' : 'text-red-500'}>
                          {record.lastMatchup.myScore.toFixed(1)}
                        </span>
                        <span className="text-gray-500">vs</span>
                        <span className={record.lastMatchup.result === 'loss' ? 'text-green-500' : 'text-red-500'}>
                          {record.lastMatchup.opponentScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}