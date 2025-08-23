'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Trophy, Users, TrendingUp, Award, BarChart,
  Clock, ChevronRight, Filter, Search, Archive,
  Medal, Flag, Zap, Target
} from 'lucide-react';

interface SeasonData {
  id: string;
  season: number;
  championId: string;
  championName: string;
  championOwner: string;
  runnerUpId: string;
  runnerUpName: string;
  thirdPlaceId?: string;
  thirdPlaceName?: string;
  sackoId?: string;
  sackoName?: string;
  standings: Array<{
    rank: number;
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
  }>;
  statistics: {
    totalGames: number;
    totalPoints: number;
    highestScore: number;
    lowestScore: number;
    averageScore: number;
    closestGame: number;
    biggestBlowout: number;
  };
  highlights: string[];
  draftRecap?: {
    bestPick: string;
    worstPick: string;
    bestValue: string;
    biggestReach: string;
  };
  tradeRecap?: {
    totalTrades: number;
    mostActive: string;
    bestTrade: string;
  };
}

interface SeasonArchiveProps {
  seasons: SeasonData[];
  currentSeason: number;
  onSeasonSelect?: (season: SeasonData) => void;
}

export default function SeasonArchive({
  seasons,
  currentSeason,
  onSeasonSelect
}: SeasonArchiveProps) {
  const [selectedSeason, setSelectedSeason] = useState<SeasonData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'champion' | 'participated'>('all');
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);

  // Filter seasons based on search and filter
  const filteredSeasons = seasons.filter(season => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        season.championName.toLowerCase().includes(query) ||
        season.championOwner.toLowerCase().includes(query) ||
        season.season.toString().includes(query)
      );
    }
    return true;
  });

  const handleSeasonClick = (season: SeasonData) => {
    setSelectedSeason(season);
    if (onSeasonSelect) {
      onSeasonSelect(season);
    }
  };

  const renderSeasonCard = (season: SeasonData) => {
    const isExpanded = expandedSeason === season.id;
    const isCurrent = season.season === currentSeason;

    return (
      <motion.div
        key={season.id}
        className={`border rounded-xl overflow-hidden ${
          isCurrent 
            ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/20 border-purple-500/50' 
            : 'bg-gray-900/30 border-gray-700/30'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
      >
        <div
          className="p-6 cursor-pointer"
          onClick={() => setExpandedSeason(isExpanded ? null : season.id)}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="text-2xl font-bold">
                  {season.season} Season
                  {isCurrent && (
                    <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded">
                      CURRENT
                    </span>
                  )}
                </h3>
              </div>
            </div>
            <ChevronRight 
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </div>

          {/* Champion Display */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-900/20 to-yellow-600/10 border border-yellow-500/30 rounded-lg">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <div>
              <div className="text-lg font-bold text-yellow-400">
                {season.championName}
              </div>
              <div className="text-sm text-gray-400">
                Manager: {season.championOwner}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">
                {season.statistics.totalGames}
              </div>
              <div className="text-xs text-gray-500">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">
                {season.statistics.averageScore.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">
                {season.statistics.highestScore.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">High Score</div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-700/30"
            >
              <div className="p-6 space-y-6">
                {/* Final Standings */}
                <div>
                  <h4 className="text-lg font-bold text-purple-300 mb-3">
                    Final Standings
                  </h4>
                  <div className="space-y-2">
                    {season.standings.slice(0, 3).map((team) => (
                      <div
                        key={team.teamId}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            team.rank === 1 ? 'bg-yellow-900/50' :
                            team.rank === 2 ? 'bg-gray-700/50' :
                            'bg-orange-900/50'
                          }`}>
                            {team.rank === 1 && <Trophy className="w-4 h-4 text-yellow-400" />}
                            {team.rank === 2 && <Medal className="w-4 h-4 text-gray-400" />}
                            {team.rank === 3 && <Medal className="w-4 h-4 text-orange-500" />}
                          </div>
                          <div>
                            <div className="font-semibold">{team.teamName}</div>
                            <div className="text-sm text-gray-400">
                              {team.wins}-{team.losses}{team.ties > 0 && `-${team.ties}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{team.pointsFor.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">PF</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Season Highlights */}
                {season.highlights.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-purple-300 mb-3">
                      Season Highlights
                    </h4>
                    <div className="space-y-2">
                      {season.highlights.map((highlight, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-400"
                        >
                          <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Full Season Button */}
                <button
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeasonClick(season);
                  }}
                >
                  View Full Season Details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderSeasonStats = () => {
    if (seasons.length === 0) return null;

    // Calculate all-time stats
    const totalSeasons = seasons.length;
    const uniqueChampions = new Set(seasons.map(s => s.championOwner)).size;
    const dynasties = seasons.filter((s, i) => 
      i > 0 && seasons[i - 1].championOwner === s.championOwner
    ).length;

    const allTimeHighScore = Math.max(...seasons.map(s => s.statistics.highestScore));
    const avgPointsPerSeason = seasons.reduce((sum, s) => sum + s.statistics.totalPoints, 0) / totalSeasons;

    return (
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <motion.div
          className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-600/10 border border-purple-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <Archive className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-2xl font-bold">{totalSeasons}</div>
          <div className="text-xs text-gray-400">Total Seasons</div>
        </motion.div>

        <motion.div
          className="p-4 bg-gradient-to-br from-yellow-900/20 to-yellow-600/10 border border-yellow-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <Trophy className="w-6 h-6 text-yellow-400 mb-2" />
          <div className="text-2xl font-bold">{uniqueChampions}</div>
          <div className="text-xs text-gray-400">Unique Champions</div>
        </motion.div>

        <motion.div
          className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-600/10 border border-blue-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <Flag className="w-6 h-6 text-blue-400 mb-2" />
          <div className="text-2xl font-bold">{dynasties}</div>
          <div className="text-xs text-gray-400">Back-to-Back</div>
        </motion.div>

        <motion.div
          className="p-4 bg-gradient-to-br from-green-900/20 to-green-600/10 border border-green-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <Target className="w-6 h-6 text-green-400 mb-2" />
          <div className="text-2xl font-bold">{allTimeHighScore.toFixed(1)}</div>
          <div className="text-xs text-gray-400">All-Time High</div>
        </motion.div>

        <motion.div
          className="p-4 bg-gradient-to-br from-orange-900/20 to-orange-600/10 border border-orange-500/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <BarChart className="w-6 h-6 text-orange-400 mb-2" />
          <div className="text-2xl font-bold">{(avgPointsPerSeason / 1000).toFixed(1)}K</div>
          <div className="text-xs text-gray-400">Avg Points/Season</div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-2xl border border-purple-500/20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Season Archive
        </h2>
        <div className="text-gray-400">
          Relive the glory, heartbreak, and legendary moments
        </div>
      </div>

      {renderSeasonStats()}

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search seasons, champions, or managers..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
        >
          <option value="all">All Seasons</option>
          <option value="champion">My Championships</option>
          <option value="participated">Participated</option>
        </select>
      </div>

      {/* Season Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredSeasons.map(renderSeasonCard)}
      </div>

      {/* Season Detail Modal */}
      <AnimatePresence>
        {selectedSeason && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSeason(null)}
          >
            <motion.div
              className="bg-gray-900 p-8 rounded-2xl border border-purple-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-3xl font-bold mb-6">
                {selectedSeason.season} Season Overview
              </h3>
              
              {/* Full season details would go here */}
              
              <button
                className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                onClick={() => setSelectedSeason(null)}
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