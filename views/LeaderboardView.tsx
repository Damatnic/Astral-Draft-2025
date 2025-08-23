/**
 * Comprehensive Leaderboard View Component
 * Shows rankings, achievements, and performance using oracleScoringService
 */

import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../components/ui/Widget';
import { Avatar } from '../components/ui/Avatar';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { StarIcon } from '../components/icons/StarIcon';
import { FlameIcon } from '../components/icons/FlameIcon';
import { CrownIcon } from '../components/icons/CrownIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { type Achievement } from '../services/oracleScoringService';

interface LeaderboardFilter {
  timeframe: 'weekly' | 'monthly' | 'season' | 'all-time';
  category: 'overall' | 'accuracy' | 'streak' | 'consistency';
  league?: string;
}

interface LeaderboardTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface LeaderboardEntry {
  userId: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  totalPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number;
  oracleBeats: number;
  currentStreak: number;
  longestStreak: number;
  rank: number;
  level: number;
  consistency: number;
  achievements: Achievement[];
  streak: number;
}

const LeaderboardView: React.FC = () => {
  const { state } = useAppState();
  const [activeTab, setActiveTab] = React.useState('overall');
  const [filter, setFilter] = React.useState<LeaderboardFilter>({
    timeframe: 'season',
    category: 'overall'
  });
  const [leaderboardData, setLeaderboardData] = React.useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = React.useState<(Achievement & { points: number; category: string })[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Mock data generator for leaderboard
  const generateMockLeaderboardData = (users: any[]): LeaderboardEntry[] => {
    return users.map((user, index) => {
      const baseScore = Math.max(50, 1000 - (index * 50) + Math.random() * 100);
      const predictions = Math.floor(20 + Math.random() * 30);
      const correct = Math.floor(predictions * (0.6 + Math.random() * 0.3));
      
      return {
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        },
        totalPoints: Math.floor(baseScore),
        correctPredictions: correct,
        totalPredictions: predictions,
        accuracy: (correct / predictions) * 100,
        oracleBeats: Math.floor(Math.random() * 15),
        currentStreak: Math.floor(Math.random() * 10) - 3,
        longestStreak: Math.floor(Math.random() * 15),
        rank: index + 1,
        level: Math.floor(baseScore / 100),
        consistency: 60 + Math.random() * 40,
        achievements: [],
        streak: Math.floor(Math.random() * 10) - 3
      };
    });
  };

  const generateMockAchievements = (): (Achievement & { points: number; category: string })[] => {
    return [
      {
        id: 'first_prediction',
        name: 'First Steps',
        description: 'Made your first Oracle prediction',
        icon: '👶',
        tier: 'bronze',
        requirement: { type: 'prediction_count', value: 1 },
        points: 50,
        category: 'milestone'
      },
      {
        id: 'accuracy_master',
        name: 'Accuracy Master',
        description: 'Achieved 80% accuracy over 20 predictions',
        icon: '🎯',
        tier: 'gold',
        requirement: { type: 'accuracy', value: 80 },
        points: 200,
        category: 'accuracy'
      },
      {
        id: 'streak_legend',
        name: 'Streak Legend',
        description: 'Achieved a 10-game winning streak',
        icon: '🔥',
        tier: 'platinum',
        requirement: { type: 'streak', value: 10 },
        points: 300,
        category: 'streak'
      },
      {
        id: 'oracle_slayer',
        name: 'Oracle Slayer',
        description: 'Beat the Oracle 5 times in a row',
        icon: '⚔️',
        tier: 'legendary',
        requirement: { type: 'oracle_beats', value: 5 },
        points: 500,
        category: 'accuracy'
      },
      {
        id: 'perfect_week',
        name: 'Perfect Week',
        description: 'Got 100% accuracy for a full week',
        icon: '💯',
        tier: 'platinum',
        requirement: { type: 'perfect_week', value: 1 },
        points: 400,
        category: 'streak'
      }
    ];
  };

  const tabs: LeaderboardTab[] = [
    {
      id: 'overall',
      label: 'Overall Rankings',
      icon: <TrophyIcon />,
      description: 'Complete leaderboard with all scoring categories'
    },
    {
      id: 'weekly',
      label: 'Weekly Champions',
      icon: <CrownIcon />,
      description: 'Top performers for the current week'
    },
    {
      id: 'streaks',
      label: 'Hot Streaks',
      icon: <FlameIcon />,
      description: 'Longest winning and losing streaks'
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: <StarIcon />,
      description: 'Badges and milestones unlocked'
    }
  ];

  // Load leaderboard data
  React.useEffect(() => {
    const loadLeaderboardData = async () => {
      setIsLoading(true);
      try {
        // Get unique users from all leagues
        const uniqueUsers = state.leagues
          .flatMap(league => league.members)
          .reduce((unique, user) => {
            if (!unique.find(u => u.id === user.id)) {
              unique.push(user);
            }
            return unique;
          }, [] as any[])
          .slice(0, 20);

        // Generate mock leaderboard data
        const leaderboard = generateMockLeaderboardData(uniqueUsers);
        setLeaderboardData(leaderboard);

        // Generate mock achievements
        const mockAchievements = generateMockAchievements();
        setAchievements(mockAchievements);
      } catch (error) {
        console.error('Failed to load leaderboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboardData();
  }, [filter, state.leagues]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-sm">1</div>;
      case 2:
        return <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-black font-bold text-sm">2</div>;
      case 3:
        return <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>;
      default:
        return <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold text-sm">{rank}</div>;
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const renderOverallLeaderboard = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={filter.timeframe}
          onChange={(e) => setFilter(prev => ({ ...prev, timeframe: e.target.value as LeaderboardFilter['timeframe'] }))}
          className="form-input bg-slate-800 border-slate-600 text-white rounded-lg px-4 py-2"
        >
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="season">This Season</option>
          <option value="all-time">All Time</option>
        </select>
        
        <select
          value={filter.category}
          onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value as LeaderboardFilter['category'] }))}
          className="form-input bg-slate-800 border-slate-600 text-white rounded-lg px-4 py-2"
        >
          <option value="overall">Overall Score</option>
          <option value="accuracy">Prediction Accuracy</option>
          <option value="streak">Current Streak</option>
          <option value="consistency">Consistency Rating</option>
        </select>

        {state.leagues.length > 1 && (
          <select
            value={filter.league || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, league: e.target.value || undefined }))}
            className="form-input bg-slate-800 border-slate-600 text-white rounded-lg px-4 py-2"
          >
            <option value="">All Leagues</option>
            {state.leagues.map(league => (
              <option key={league.id} value={league.id}>{league.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Top 3 Podium */}
      {leaderboardData.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <motion.div 
            className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl p-6 text-center relative"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <Avatar avatar={leaderboardData[1].user.avatar} className="w-16 h-16 rounded-full border-4 border-gray-300" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-black font-bold text-sm">2</div>
            </div>
            <h3 className="font-bold text-white text-lg">{leaderboardData[1].user.name}</h3>
            <p className="text-gray-300 text-sm">{leaderboardData[1].totalPoints} points</p>
            <div className="mt-2 text-gray-400 text-xs">
              {leaderboardData[1].accuracy.toFixed(1)}% accuracy
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl p-6 text-center relative transform scale-105"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CrownIcon className="w-8 h-8 mx-auto mb-2 text-yellow-200" />
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <Avatar avatar={leaderboardData[0].user.avatar} className="w-20 h-20 rounded-full border-4 border-yellow-300" />
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold">1</div>
            </div>
            <h3 className="font-bold text-black text-xl">{leaderboardData[0].user.name}</h3>
            <p className="text-black/80 font-semibold">{leaderboardData[0].totalPoints} points</p>
            <div className="mt-2 text-black/70 text-sm">
              {leaderboardData[0].accuracy.toFixed(1)}% accuracy
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-6 text-center relative"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <Avatar avatar={leaderboardData[2].user.avatar} className="w-16 h-16 rounded-full border-4 border-orange-300" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
            </div>
            <h3 className="font-bold text-white text-lg">{leaderboardData[2].user.name}</h3>
            <p className="text-orange-200 text-sm">{leaderboardData[2].totalPoints} points</p>
            <div className="mt-2 text-orange-300 text-xs">
              {leaderboardData[2].accuracy.toFixed(1)}% accuracy
            </div>
          </motion.div>
        </div>
      )}

      {/* Full Rankings Table */}
      <Widget title="Complete Rankings" className="overflow-hidden">
        <div className="space-y-2">
          {leaderboardData.map((scoreCard, index) => (
            <motion.div
              key={scoreCard.user.id}
              className={`
                flex items-center gap-4 p-4 rounded-lg transition-all duration-200
                ${index < 3 ? 'bg-gradient-to-r from-slate-800 to-slate-700 border border-accent-500/30' : 'bg-slate-800/50 hover:bg-slate-800'}
                ${scoreCard.user.id === state.user.id ? 'ring-2 ring-accent-500/50' : ''}
              `}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Rank */}
              <div className="flex-shrink-0">
                {getRankIcon(index + 1)}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 flex-1">
                <Avatar avatar={scoreCard.user.avatar} className="w-10 h-10 rounded-full" />
                <div>
                  <h4 className="font-semibold text-white text-sm">
                    {scoreCard.user.name}
                    {scoreCard.user.id === state.user.id && (
                      <span className="ml-2 text-xs text-accent-400">(You)</span>
                    )}
                  </h4>
                  <p className="text-slate-400 text-xs">
                    {scoreCard.achievements.length} achievements
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center flex-1">
                <div>
                  <p className={`font-bold ${getScoreColor(scoreCard.totalPoints, 1000)}`}>
                    {scoreCard.totalPoints}
                  </p>
                  <p className="text-xs text-slate-400">Total Score</p>
                </div>
                <div>
                  <p className="font-bold text-blue-400">
                    {scoreCard.accuracy.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400">Accuracy</p>
                </div>
                <div>
                  <p className="font-bold text-purple-400">
                    {scoreCard.streak}
                  </p>
                  <p className="text-xs text-slate-400">Streak</p>
                </div>
                <div className="hidden md:block">
                  <p className="font-bold text-green-400">
                    {scoreCard.consistency.toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-400">Consistency</p>
                </div>
              </div>

              {/* Trend Indicator */}
              <div className="flex-shrink-0">
                <TrendingUpIcon className="w-5 h-5 text-green-400" />
              </div>
            </motion.div>
          ))}
        </div>
      </Widget>
    </div>
  );

  const renderWeeklyChampions = () => (
    <Widget title="Weekly Champions" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(12)].map((_, weekIndex) => {
          const week = weekIndex + 1;
          const champion = leaderboardData[weekIndex % leaderboardData.length];
          if (!champion) return null;

          return (
            <motion.div
              key={week}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: weekIndex * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {week}
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Week {week}</h4>
                  <p className="text-slate-400 text-xs">Champion</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Avatar avatar={champion.user.avatar} className="w-12 h-12 rounded-full" />
                <div>
                  <h5 className="font-semibold text-white">{champion.user.name}</h5>
                  <p className="text-accent-400 text-sm font-medium">
                    {Math.floor(champion.totalPoints / 10)} pts
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Widget>
  );

  const renderStreaks = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Widget title="🔥 Hot Streaks" className="space-y-3">
        {leaderboardData
          .filter(user => user.streak > 0)
          .sort((a, b) => b.streak - a.streak)
          .slice(0, 10)
          .map((scoreCard, index) => (
            <div key={scoreCard.user.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </div>
              <Avatar avatar={scoreCard.user.avatar} className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <h4 className="font-semibold text-white text-sm">{scoreCard.user.name}</h4>
                <p className="text-orange-400 text-xs">{scoreCard.streak} game streak</p>
              </div>
              <FlameIcon className="w-5 h-5 text-orange-400" />
            </div>
          ))}
      </Widget>

      <Widget title="❄️ Cold Streaks" className="space-y-3">
        {leaderboardData
          .filter(user => user.streak < 0)
          .sort((a, b) => a.streak - b.streak)
          .slice(0, 10)
          .map((scoreCard, index) => (
            <div key={scoreCard.user.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </div>
              <Avatar avatar={scoreCard.user.avatar} className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <h4 className="font-semibold text-white text-sm">{scoreCard.user.name}</h4>
                <p className="text-blue-400 text-xs">{Math.abs(scoreCard.streak)} game streak</p>
              </div>
              <div className="text-blue-400 text-lg">❄️</div>
            </div>
          ))}
      </Widget>
    </div>
  );

  const renderAchievements = () => (
    <Widget title="Achievement Gallery" className="space-y-6">
      {/* Recent Achievements */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">🏆 Recent Unlocks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.slice(0, 6).map((achievement, index) => (
            <motion.div
              key={`${achievement.id}-${index}`}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-accent-500/30"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl">
                  {achievement.icon}
                </div>
                <h4 className="font-bold text-white text-sm mb-1">{achievement.name}</h4>
                <p className="text-slate-400 text-xs mb-2">{achievement.description}</p>
                <p className="text-accent-400 text-xs font-medium">+{achievement.points} points</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievement Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">🎯 Accuracy Masters</h3>
          <div className="space-y-2">
            {achievements
              .filter(ach => ach.category === 'accuracy')
              .slice(0, 5)
              .map((achievement, index) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm">{achievement.name}</h4>
                    <p className="text-slate-400 text-xs">{achievement.description}</p>
                  </div>
                  <span className="text-yellow-400 text-sm font-bold">+{achievement.points}</span>
                </div>
              ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">🔥 Streak Legends</h3>
          <div className="space-y-2">
            {achievements
              .filter(ach => ach.category === 'streak')
              .slice(0, 5)
              .map((achievement, index) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm">{achievement.name}</h4>
                    <p className="text-slate-400 text-xs">{achievement.description}</p>
                  </div>
                  <span className="text-yellow-400 text-sm font-bold">+{achievement.points}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </Widget>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-700 rounded-xl"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-display">
          Oracle Leaderboard
        </h1>
        <p className="text-slate-400">
          Track your performance and compete against the best predictors
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-accent-500/20 text-accent-400 border-b-2 border-accent-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }
            `}
          >
            <div className="w-5 h-5">{tab.icon}</div>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overall' && renderOverallLeaderboard()}
          {activeTab === 'weekly' && renderWeeklyChampions()}
          {activeTab === 'streaks' && renderStreaks()}
          {activeTab === 'achievements' && renderAchievements()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LeaderboardView;
