'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Medal, Award, Star, Crown, Zap, Target, TrendingUp,
  Users, Calendar, BarChart, Shield, Flame, Gem, Heart,
  Brain, Swords, Flag, Rocket
} from 'lucide-react';

interface TrophyData {
  id: string;
  type: string;
  title: string;
  description: string;
  teamName: string;
  userName: string;
  season: number;
  value?: number;
  iconUrl?: string;
  awardedAt: string;
}

interface AwardData {
  id: string;
  type: string;
  category: 'WEEKLY' | 'SEASON' | 'ACHIEVEMENT';
  title: string;
  description: string;
  recipientName: string;
  value?: number;
  week?: number;
  season: number;
  color?: string;
  badgeUrl?: string;
}

interface AchievementData {
  id: string;
  type: string;
  title: string;
  description: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  iconUrl?: string;
}

interface TrophyRoomProps {
  trophies: TrophyData[];
  awards: AwardData[];
  achievements: AchievementData[];
  currentSeason: number;
  userName?: string;
  teamName?: string;
}

export default function TrophyRoom({
  trophies,
  awards,
  achievements,
  currentSeason,
  userName,
  teamName
}: TrophyRoomProps) {
  const [selectedTab, setSelectedTab] = useState<'trophies' | 'awards' | 'achievements'>('trophies');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filterSeason, setFilterSeason] = useState<number | 'all'>(currentSeason);

  // Get unique seasons
  const seasons = Array.from(new Set([
    ...trophies.map(t => t.season),
    ...awards.map(a => a.season)
  ])).sort((a, b) => b - a);

  // Filter items by season
  const filteredTrophies = filterSeason === 'all' 
    ? trophies 
    : trophies.filter(t => t.season === filterSeason);

  const filteredAwards = filterSeason === 'all'
    ? awards
    : awards.filter(a => a.season === filterSeason);

  // Group awards by category
  const weeklyAwards = filteredAwards.filter(a => a.category === 'WEEKLY');
  const seasonAwards = filteredAwards.filter(a => a.category === 'SEASON');
  const achievementAwards = filteredAwards.filter(a => a.category === 'ACHIEVEMENT');

  const getTrophyIcon = (type: string) => {
    switch (type) {
      case 'CHAMPION':
        return { Icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
      case 'RUNNER_UP':
        return { Icon: Medal, color: 'text-gray-400', bg: 'bg-gray-900/20' };
      case 'THIRD_PLACE':
        return { Icon: Medal, color: 'text-orange-500', bg: 'bg-orange-900/20' };
      case 'SACKO':
        return { Icon: Flag, color: 'text-red-500', bg: 'bg-red-900/20' };
      default:
        return { Icon: Award, color: 'text-purple-400', bg: 'bg-purple-900/20' };
    }
  };

  const getAwardIcon = (type: string) => {
    switch (type) {
      case 'WEEKLY_HIGH_SCORER':
        return Flame;
      case 'BIGGEST_UPSET':
        return Rocket;
      case 'CLOSEST_VICTORY':
        return Target;
      case 'BIGGEST_BLOWOUT':
        return Swords;
      case 'MVP':
        return Crown;
      case 'BEST_DRAFT':
        return Brain;
      case 'MOST_CONSISTENT':
        return BarChart;
      case 'BEST_MANAGER':
        return Users;
      case 'TRADE_MASTER':
        return TrendingUp;
      case 'WAIVER_WIRE_HERO':
        return Zap;
      default:
        return Star;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BRONZE':
        return 'from-orange-700 to-orange-600';
      case 'SILVER':
        return 'from-gray-500 to-gray-400';
      case 'GOLD':
        return 'from-yellow-500 to-yellow-400';
      case 'PLATINUM':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-600 to-gray-500';
    }
  };

  const renderTrophy = (trophy: TrophyData) => {
    const { Icon, color, bg } = getTrophyIcon(trophy.type);

    return (
      <motion.div
        key={trophy.id}
        className={`p-6 ${bg} border border-gray-700/50 rounded-xl cursor-pointer`}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedItem(trophy)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col items-center text-center">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Icon className={`w-16 h-16 ${color} mb-4`} />
          </motion.div>
          <h3 className="text-lg font-bold mb-1">{trophy.title}</h3>
          <div className="text-sm text-gray-400 mb-2">{trophy.teamName}</div>
          <div className="text-xs text-gray-500">Season {trophy.season}</div>
        </div>
      </motion.div>
    );
  };

  const renderAward = (award: AwardData) => {
    const Icon = getAwardIcon(award.type);
    const bgColor = award.color ? `bg-${award.color}-900/20` : 'bg-purple-900/20';

    return (
      <motion.div
        key={award.id}
        className={`p-4 ${bgColor} border border-gray-700/50 rounded-lg cursor-pointer`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedItem(award)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-900/50 rounded-lg">
            <Icon className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">{award.title}</div>
            <div className="text-sm text-gray-400">{award.recipientName}</div>
            {award.week && (
              <div className="text-xs text-gray-500">Week {award.week}</div>
            )}
          </div>
          {award.value && (
            <div className="text-xl font-bold text-purple-300">
              {award.value.toFixed(0)}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderAchievement = (achievement: AchievementData) => {
    const progress = (achievement.progress / achievement.target) * 100;
    const isComplete = achievement.isUnlocked;

    return (
      <motion.div
        key={achievement.id}
        className={`p-4 border rounded-lg cursor-pointer ${
          isComplete 
            ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/20 border-purple-500/50' 
            : 'bg-gray-900/20 border-gray-700/30'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedItem(achievement)}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${getTierColor(achievement.tier)}`}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{achievement.title}</h4>
              {isComplete && (
                <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
              )}
            </div>
            <div className="text-sm text-gray-400 mb-2">{achievement.description}</div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <motion.div
                className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {achievement.progress} / {achievement.target}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderStats = () => {
    const totalTrophies = trophies.length;
    const championships = trophies.filter(t => t.type === 'CHAMPION').length;
    const totalAwards = awards.length;
    const unlockedAchievements = achievements.filter(a => a.isUnlocked).length;

    return (
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <motion.div
          className="p-4 bg-gradient-to-br from-yellow-900/20 to-yellow-600/10 border border-yellow-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
          <div className="text-2xl font-bold">{totalTrophies}</div>
          <div className="text-sm text-gray-400">Total Trophies</div>
        </motion.div>

        <motion.div
          className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-600/10 border border-purple-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <Crown className="w-8 h-8 text-purple-400 mb-2" />
          <div className="text-2xl font-bold">{championships}</div>
          <div className="text-sm text-gray-400">Championships</div>
        </motion.div>

        <motion.div
          className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-600/10 border border-blue-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <Award className="w-8 h-8 text-blue-400 mb-2" />
          <div className="text-2xl font-bold">{totalAwards}</div>
          <div className="text-sm text-gray-400">Awards Won</div>
        </motion.div>

        <motion.div
          className="p-4 bg-gradient-to-br from-green-900/20 to-green-600/10 border border-green-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <Gem className="w-8 h-8 text-green-400 mb-2" />
          <div className="text-2xl font-bold">{unlockedAchievements}/{achievements.length}</div>
          <div className="text-sm text-gray-400">Achievements</div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-2xl border border-purple-500/20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Trophy Room
        </h2>
        {(userName || teamName) && (
          <div className="text-gray-400">
            {teamName && <span className="font-semibold">{teamName}</span>}
            {userName && teamName && ' • '}
            {userName && <span>{userName}</span>}
          </div>
        )}
      </div>

      {renderStats()}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        {['trophies', 'awards', 'achievements'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedTab === tab
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            onClick={() => setSelectedTab(tab as any)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Season Filter */}
      {selectedTab !== 'achievements' && (
        <div className="flex gap-2 mb-6">
          <button
            className={`px-3 py-1 rounded text-sm ${
              filterSeason === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            onClick={() => setFilterSeason('all')}
          >
            All Seasons
          </button>
          {seasons.map(season => (
            <button
              key={season}
              className={`px-3 py-1 rounded text-sm ${
                filterSeason === season
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setFilterSeason(season)}
            >
              {season}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {selectedTab === 'trophies' && (
          <motion.div
            key="trophies"
            className="grid gap-4 md:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {filteredTrophies.map(renderTrophy)}
          </motion.div>
        )}

        {selectedTab === 'awards' && (
          <motion.div
            key="awards"
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {seasonAwards.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-purple-300 mb-4">Season Awards</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {seasonAwards.map(renderAward)}
                </div>
              </div>
            )}

            {weeklyAwards.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-purple-300 mb-4">Weekly Awards</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {weeklyAwards.map(renderAward)}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {selectedTab === 'achievements' && (
          <motion.div
            key="achievements"
            className="grid gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {achievements.map(renderAchievement)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              className="bg-gray-900 p-8 rounded-2xl border border-purple-500/30 max-w-md w-full mx-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4">{selectedItem.title}</h3>
              <p className="text-gray-400 mb-6">{selectedItem.description}</p>
              <button
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}