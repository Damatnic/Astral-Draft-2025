'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, Swords, ChevronRight, Star, Zap } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  seed: number;
  logo?: string;
  score?: number;
  wins?: number;
  losses?: number;
}

interface Matchup {
  id: string;
  highSeed?: Team;
  lowSeed?: Team;
  highSeedScore: number;
  lowSeedScore: number;
  winnerId?: string;
  isComplete: boolean;
  isBye?: boolean;
  isLive?: boolean;
}

interface Round {
  id: string;
  name: string;
  matchups: Matchup[];
  week: number;
  isComplete: boolean;
}

interface PlayoffBracketProps {
  bracketId: string;
  rounds: Round[];
  currentWeek: number;
  teamCount: 4 | 6 | 8;
  championId?: string;
  runnerUpId?: string;
  thirdPlaceId?: string;
  onMatchupClick?: (matchup: Matchup) => void;
}

export default function PlayoffBracket({
  bracketId,
  rounds,
  currentWeek,
  teamCount,
  championId,
  runnerUpId,
  thirdPlaceId,
  onMatchupClick
}: PlayoffBracketProps) {
  const [selectedMatchup, setSelectedMatchup] = useState<Matchup | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);

  // Calculate bracket dimensions based on team count
  const getBracketLayout = () => {
    switch (teamCount) {
      case 4:
        return { columns: 2, maxRounds: 2 };
      case 6:
        return { columns: 3, maxRounds: 3 };
      case 8:
        return { columns: 3, maxRounds: 3 };
      default:
        return { columns: 2, maxRounds: 2 };
    }
  };

  const { columns, maxRounds } = getBracketLayout();

  const handleMatchupClick = (matchup: Matchup) => {
    setSelectedMatchup(matchup);
    if (onMatchupClick) {
      onMatchupClick(matchup);
    }
  };

  const getTeamStatus = (team: Team, matchup: Matchup) => {
    if (matchup.winnerId === team.id) return 'winner';
    if (matchup.isComplete && matchup.winnerId !== team.id) return 'eliminated';
    if (matchup.isLive) return 'live';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'winner':
        return 'text-green-400 bg-green-900/20 border-green-500/50';
      case 'eliminated':
        return 'text-gray-500 bg-gray-900/20 border-gray-700/50';
      case 'live':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/50 animate-pulse';
      default:
        return 'text-purple-300 bg-purple-900/20 border-purple-500/30';
    }
  };

  const renderTeam = (team: Team | undefined, matchup: Matchup, position: 'high' | 'low') => {
    if (!team) {
      return (
        <div className="flex items-center justify-between p-3 bg-gray-900/30 border border-gray-700/30 rounded-lg">
          <span className="text-gray-600">TBD</span>
        </div>
      );
    }

    const status = getTeamStatus(team, matchup);
    const isWinner = matchup.winnerId === team.id;
    const score = position === 'high' ? matchup.highSeedScore : matchup.lowSeedScore;

    return (
      <motion.div
        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${getStatusColor(status)}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => setHoveredTeam(team.id)}
        onMouseLeave={() => setHoveredTeam(null)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-900/50 rounded-full">
            <span className="text-sm font-bold">{team.seed}</span>
          </div>
          {team.logo && (
            <img src={team.logo} alt={team.name} className="w-8 h-8 rounded" />
          )}
          <div>
            <div className="font-semibold">{team.name}</div>
            {team.wins !== undefined && (
              <div className="text-xs opacity-70">
                {team.wins}-{team.losses}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {matchup.isLive && (
            <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
          )}
          <span className="text-xl font-bold">{score.toFixed(2)}</span>
          {isWinner && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              <Crown className="w-5 h-5 text-yellow-400" />
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderMatchup = (matchup: Matchup, roundIndex: number) => {
    const isFinals = roundIndex === rounds.length - 1;
    const isSemis = roundIndex === rounds.length - 2;

    return (
      <motion.div
        key={matchup.id}
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: roundIndex * 0.1 }}
      >
        {matchup.isBye ? (
          <div className="p-4 bg-gray-900/30 border border-gray-700/30 rounded-lg">
            <div className="text-center text-gray-500">BYE WEEK</div>
          </div>
        ) : (
          <div
            className="space-y-2 cursor-pointer"
            onClick={() => handleMatchupClick(matchup)}
          >
            {renderTeam(matchup.highSeed, matchup, 'high')}
            <div className="flex items-center justify-center">
              <div className="text-xs text-gray-500">VS</div>
            </div>
            {renderTeam(matchup.lowSeed, matchup, 'low')}
          </div>
        )}

        {/* Connection lines to next round */}
        {roundIndex < rounds.length - 1 && (
          <svg
            className="absolute top-1/2 -right-12 w-12 h-1"
            style={{ transform: 'translateY(-50%)' }}
          >
            <line
              x1="0"
              y1="0"
              x2="48"
              y2="0"
              stroke="rgb(168 85 247 / 0.3)"
              strokeWidth="2"
            />
          </svg>
        )}

        {/* Special badges for finals/semis */}
        {isFinals && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs font-bold rounded-full">
              <Trophy className="w-3 h-3" />
              CHAMPIONSHIP
            </div>
          </div>
        )}
        {isSemis && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold rounded-full">
              <Swords className="w-3 h-3" />
              SEMIFINALS
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderRound = (round: Round, roundIndex: number) => {
    return (
      <div key={round.id} className="flex-1">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-purple-300">{round.name}</h3>
          <div className="text-sm text-gray-500">Week {round.week}</div>
          {round.isComplete && (
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
              <Star className="w-3 h-3" />
              COMPLETE
            </div>
          )}
        </div>
        <div className="space-y-8">
          {round.matchups.map(matchup => renderMatchup(matchup, roundIndex))}
        </div>
      </div>
    );
  };

  // Render champion celebration if bracket is complete
  const renderChampion = () => {
    if (!championId) return null;

    return (
      <motion.div
        className="mt-12 p-8 bg-gradient-to-br from-yellow-900/20 to-yellow-600/10 border-2 border-yellow-500/50 rounded-2xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
          </motion.div>
          <h2 className="text-3xl font-bold text-yellow-400 mb-2">CHAMPION</h2>
          <div className="text-xl text-white">
            {/* Team name would be fetched based on championId */}
            Team Champion
          </div>
        </div>

        {runnerUpId && (
          <div className="mt-6 flex justify-center gap-8">
            <div className="text-center">
              <Medal className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <div className="text-sm text-gray-400">Runner-Up</div>
              <div className="text-white">Team Runner-Up</div>
            </div>
            {thirdPlaceId && (
              <div className="text-center">
                <Medal className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                <div className="text-sm text-orange-600">Third Place</div>
                <div className="text-white">Team Third</div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-2xl border border-purple-500/20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Playoff Bracket
        </h2>
        <div className="text-gray-400 mt-2">
          {teamCount} Team Single Elimination • Week {currentWeek}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-12 min-w-max">
          {rounds.map((round, index) => renderRound(round, index))}
        </div>
      </div>

      {renderChampion()}

      {/* Matchup Detail Modal */}
      <AnimatePresence>
        {selectedMatchup && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMatchup(null)}
          >
            <motion.div
              className="bg-gray-900 p-8 rounded-2xl border border-purple-500/30 max-w-2xl w-full mx-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6">Matchup Details</h3>
              {/* Add detailed matchup information here */}
              <button
                className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                onClick={() => setSelectedMatchup(null)}
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