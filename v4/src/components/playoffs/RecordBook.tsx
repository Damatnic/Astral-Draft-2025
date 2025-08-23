'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Trophy, TrendingUp, Zap, Target, Users,
  Calendar, Award, BarChart, Flame, Shield, Swords,
  Crown, Star, ChevronUp, ChevronDown, Filter
} from 'lucide-react';

interface LeagueRecord {
  id: string;
  category: 'SINGLE_GAME' | 'SEASON' | 'ALL_TIME' | 'PLAYOFFS';
  type: string;
  value: number;
  holderId: string;
  holderName: string;
  holderType: 'TEAM' | 'USER';
  description: string;
  season?: number;
  week?: number;
  opponent?: string;
  previousValue?: number;
  previousHolder?: string;
  setAt: string;
}

interface HeadToHeadRecord {
  id: string;
  team1Name: string;
  team2Name: string;
  team1Wins: number;
  team2Wins: number;
  ties: number;
  team1Points: number;
  team2Points: number;
  team1PlayoffWins: number;
  team2PlayoffWins: number;
  currentStreak?: string;
  longestStreak?: string;
  lastMatchup?: string;
}

interface RecordBookProps {
  records: LeagueRecord[];
  headToHeadRecords: HeadToHeadRecord[];
  currentSeason: number;
  onRecordClick?: (record: LeagueRecord) => void;
}

export default function RecordBook({
  records,
  headToHeadRecords,
  currentSeason,
  onRecordClick
}: RecordBookProps) {
  const [selectedCategory, setSelectedCategory] = useState<'SINGLE_GAME' | 'SEASON' | 'ALL_TIME' | 'PLAYOFFS' | 'H2H'>('ALL_TIME');
  const [selectedRecord, setSelectedRecord] = useState<LeagueRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'recent'>('value');

  // Filter records by category
  const filteredRecords = records
    .filter(r => selectedCategory === 'H2H' ? false : r.category === selectedCategory)
    .filter(r => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          r.holderName.toLowerCase().includes(query) ||
          r.type.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'value') {
        return b.value - a.value;
      } else {
        return new Date(b.setAt).getTime() - new Date(a.setAt).getTime();
      }
    });

  // Group records by type
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    if (!acc[record.type]) {
      acc[record.type] = [];
    }
    acc[record.type].push(record);
    return acc;
  }, {} as Record<string, LeagueRecord[]>);

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'POINTS_SCORED':
        return Flame;
      case 'MARGIN_OF_VICTORY':
        return Swords;
      case 'TOTAL_WINS':
        return Trophy;
      case 'WIN_STREAK':
        return TrendingUp;
      case 'POINTS_IN_SEASON':
        return BarChart;
      case 'PERFECT_SEASON':
        return Crown;
      case 'COMEBACK_VICTORY':
        return Shield;
      default:
        return Star;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SINGLE_GAME':
        return 'from-purple-500 to-pink-500';
      case 'SEASON':
        return 'from-blue-500 to-cyan-500';
      case 'ALL_TIME':
        return 'from-yellow-500 to-orange-500';
      case 'PLAYOFFS':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatRecordValue = (record: LeagueRecord) => {
    switch (record.type) {
      case 'WIN_PERCENTAGE':
        return `${(record.value * 100).toFixed(1)}%`;
      case 'POINTS_SCORED':
      case 'POINTS_IN_SEASON':
        return record.value.toFixed(2);
      default:
        return record.value.toFixed(0);
    }
  };

  const renderRecord = (record: LeagueRecord, isTopRecord: boolean = false) => {
    const Icon = getRecordIcon(record.type);

    return (
      <motion.div
        key={record.id}
        className={`p-4 border rounded-lg cursor-pointer ${
          isTopRecord
            ? 'bg-gradient-to-br from-yellow-900/20 to-yellow-600/10 border-yellow-500/50'
            : 'bg-gray-900/30 border-gray-700/30'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setSelectedRecord(record);
          if (onRecordClick) onRecordClick(record);
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${
            isTopRecord ? 'bg-yellow-900/50' : 'bg-gray-800/50'
          }`}>
            <Icon className={`w-6 h-6 ${
              isTopRecord ? 'text-yellow-400' : 'text-purple-400'
            }`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">
                  {record.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </h4>
                <div className="text-sm text-gray-400 mt-1">
                  {record.holderName}
                  {record.season && ` • ${record.season} Season`}
                  {record.week && ` • Week ${record.week}`}
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  isTopRecord ? 'text-yellow-400' : 'text-purple-300'
                }`}>
                  {formatRecordValue(record)}
                </div>
                {record.previousValue && (
                  <div className="text-xs text-gray-500">
                    Previous: {record.previousValue.toFixed(0)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-400">
              {record.description}
              {record.opponent && ` vs ${record.opponent}`}
            </div>

            {record.previousHolder && (
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                <ChevronUp className="w-3 h-3" />
                Broke record held by {record.previousHolder}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderHeadToHead = (h2h: HeadToHeadRecord) => {
    const team1WinPct = h2h.team1Wins / (h2h.team1Wins + h2h.team2Wins + h2h.ties);
    const team2WinPct = h2h.team2Wins / (h2h.team1Wins + h2h.team2Wins + h2h.ties);
    const favored = team1WinPct > team2WinPct ? 'team1' : 'team2';

    return (
      <motion.div
        key={h2h.id}
        className="p-4 bg-gray-900/30 border border-gray-700/30 rounded-lg"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <div className={`font-semibold text-lg ${favored === 'team1' ? 'text-green-400' : ''}`}>
              {h2h.team1Name}
            </div>
            <div className="text-2xl font-bold mt-1">{h2h.team1Wins}</div>
          </div>
          
          <div className="px-4">
            <Swords className="w-6 h-6 text-gray-500" />
            <div className="text-xs text-gray-500 mt-1">VS</div>
          </div>
          
          <div className="text-center flex-1">
            <div className={`font-semibold text-lg ${favored === 'team2' ? 'text-green-400' : ''}`}>
              {h2h.team2Name}
            </div>
            <div className="text-2xl font-bold mt-1">{h2h.team2Wins}</div>
          </div>
        </div>

        {h2h.ties > 0 && (
          <div className="text-center text-sm text-gray-500 mb-2">
            {h2h.ties} Tie{h2h.ties > 1 ? 's' : ''}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700/50">
          <div>
            <div className="text-xs text-gray-500">Total Points</div>
            <div className="font-semibold">
              {h2h.team1Points.toFixed(0)} - {h2h.team2Points.toFixed(0)}
            </div>
          </div>
          
          {(h2h.team1PlayoffWins > 0 || h2h.team2PlayoffWins > 0) && (
            <div>
              <div className="text-xs text-gray-500">Playoff Record</div>
              <div className="font-semibold">
                {h2h.team1PlayoffWins} - {h2h.team2PlayoffWins}
              </div>
            </div>
          )}
          
          {h2h.currentStreak && (
            <div>
              <div className="text-xs text-gray-500">Current Streak</div>
              <div className="font-semibold text-yellow-400">{h2h.currentStreak}</div>
            </div>
          )}
          
          {h2h.longestStreak && (
            <div>
              <div className="text-xs text-gray-500">Longest Streak</div>
              <div className="font-semibold">{h2h.longestStreak}</div>
            </div>
          )}
        </div>

        {h2h.lastMatchup && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 text-sm text-gray-500">
            Last matchup: {h2h.lastMatchup}
          </div>
        )}
      </motion.div>
    );
  };

  const renderCategoryStats = () => {
    const categoryRecords = records.filter(r => r.category === selectedCategory);
    const recentRecord = categoryRecords.sort((a, b) => 
      new Date(b.setAt).getTime() - new Date(a.setAt).getTime()
    )[0];

    return (
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <motion.div
          className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-600/10 border border-purple-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <BookOpen className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-2xl font-bold">{categoryRecords.length}</div>
          <div className="text-xs text-gray-400">Total Records</div>
        </motion.div>

        <motion.div
          className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-600/10 border border-blue-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <Users className="w-6 h-6 text-blue-400 mb-2" />
          <div className="text-2xl font-bold">
            {new Set(categoryRecords.map(r => r.holderId)).size}
          </div>
          <div className="text-xs text-gray-400">Record Holders</div>
        </motion.div>

        <motion.div
          className="p-4 bg-gradient-to-br from-green-900/20 to-green-600/10 border border-green-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <Calendar className="w-6 h-6 text-green-400 mb-2" />
          <div className="text-2xl font-bold">
            {categoryRecords.filter(r => r.season === currentSeason).length}
          </div>
          <div className="text-xs text-gray-400">This Season</div>
        </motion.div>

        {recentRecord && (
          <motion.div
            className="p-4 bg-gradient-to-br from-yellow-900/20 to-yellow-600/10 border border-yellow-500/30 rounded-lg"
            whileHover={{ scale: 1.05 }}
          >
            <Zap className="w-6 h-6 text-yellow-400 mb-2" />
            <div className="text-sm font-bold truncate">{recentRecord.holderName}</div>
            <div className="text-xs text-gray-400">Most Recent</div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-2xl border border-purple-500/20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Record Book
        </h2>
        <div className="text-gray-400">
          Legendary performances and historic achievements
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['ALL_TIME', 'SINGLE_GAME', 'SEASON', 'PLAYOFFS', 'H2H'].map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              selectedCategory === category
                ? `bg-gradient-to-r ${getCategoryColor(category)} text-white`
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            onClick={() => setSelectedCategory(category as any)}
          >
            {category === 'H2H' ? 'Head-to-Head' : category.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {selectedCategory !== 'H2H' && (
        <>
          {/* Search and Sort */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search records..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="value">Sort by Value</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>

          {renderCategoryStats()}

          {/* Records List */}
          <div className="space-y-6">
            {Object.entries(groupedRecords).map(([type, typeRecords]) => (
              <div key={type}>
                <h3 className="text-xl font-bold text-purple-300 mb-4">
                  {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                <div className="space-y-3">
                  {typeRecords.map((record, index) => 
                    renderRecord(record, index === 0)
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedCategory === 'H2H' && (
        <div className="grid gap-4 md:grid-cols-2">
          {headToHeadRecords.map(renderHeadToHead)}
        </div>
      )}

      {/* Record Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRecord(null)}
          >
            <motion.div
              className="bg-gray-900 p-8 rounded-2xl border border-purple-500/30 max-w-md w-full mx-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4">Record Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Record Type</div>
                  <div className="font-semibold">
                    {selectedRecord.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Record Holder</div>
                  <div className="font-semibold">{selectedRecord.holderName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Value</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {formatRecordValue(selectedRecord)}
                  </div>
                </div>
                {selectedRecord.previousHolder && (
                  <div>
                    <div className="text-sm text-gray-500">Previous Record</div>
                    <div className="font-semibold">
                      {selectedRecord.previousValue} by {selectedRecord.previousHolder}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500">Set On</div>
                  <div className="font-semibold">
                    {new Date(selectedRecord.setAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button
                className="mt-6 w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                onClick={() => setSelectedRecord(null)}
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