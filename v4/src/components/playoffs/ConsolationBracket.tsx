'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Toilet, TrendingDown, Hash, Award, Frown, AlertTriangle } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  seed: number;
  logo?: string;
  score?: number;
  record?: string;
}

interface ConsolationMatchup {
  id: string;
  team1?: Team;
  team2?: Team;
  team1Score: number;
  team2Score: number;
  winnerId?: string;
  loserId?: string;
  isComplete: boolean;
  week: number;
  type: 'TOILET_BOWL' | 'DRAFT_ORDER' | 'SACKO';
}

interface ConsolationBracketProps {
  type: 'TOILET_BOWL' | 'DRAFT_ORDER' | 'SACKO';
  matchups: ConsolationMatchup[];
  currentWeek: number;
  sackoId?: string;
  onMatchupClick?: (matchup: ConsolationMatchup) => void;
}

export default function ConsolationBracket({
  type,
  matchups,
  currentWeek,
  sackoId,
  onMatchupClick
}: ConsolationBracketProps) {
  const [selectedMatchup, setSelectedMatchup] = useState<ConsolationMatchup | null>(null);

  const getBracketTitle = () => {
    switch (type) {
      case 'TOILET_BOWL':
        return {
          title: 'Toilet Bowl',
          subtitle: 'Battle for the Bottom',
          icon: Toilet,
          color: 'from-orange-500 to-red-500'
        };
      case 'DRAFT_ORDER':
        return {
          title: 'Draft Position Games',
          subtitle: 'Fighting for Next Year',
          icon: Hash,
          color: 'from-blue-500 to-cyan-500'
        };
      case 'SACKO':
        return {
          title: 'Sacko Championship',
          subtitle: 'Avoiding Ultimate Shame',
          icon: Frown,
          color: 'from-red-600 to-pink-600'
        };
    }
  };

  const { title, subtitle, icon: Icon, color } = getBracketTitle();

  const handleMatchupClick = (matchup: ConsolationMatchup) => {
    setSelectedMatchup(matchup);
    if (onMatchupClick) {
      onMatchupClick(matchup);
    }
  };

  const renderTeam = (team: Team | undefined, matchup: ConsolationMatchup, position: 'team1' | 'team2') => {
    if (!team) {
      return (
        <div className="flex items-center justify-between p-3 bg-gray-900/30 border border-gray-700/30 rounded-lg">
          <span className="text-gray-600">Eliminated Team</span>
        </div>
      );
    }

    const score = position === 'team1' ? matchup.team1Score : matchup.team2Score;
    const isWinner = matchup.winnerId === team.id;
    const isLoser = matchup.loserId === team.id;
    const isSacko = sackoId === team.id;

    let statusClass = 'bg-gray-900/20 border-gray-700/30';
    if (isWinner && type !== 'SACKO') {
      statusClass = 'bg-green-900/20 border-green-500/50';
    } else if (isLoser || (isWinner && type === 'SACKO')) {
      statusClass = 'bg-red-900/20 border-red-500/50';
    }

    return (
      <motion.div
        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${statusClass}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          {team.logo && (
            <img src={team.logo} alt={team.name} className="w-8 h-8 rounded" />
          )}
          <div>
            <div className="font-semibold">{team.name}</div>
            {team.record && (
              <div className="text-xs text-gray-400">{team.record}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">{score.toFixed(2)}</span>
          {isSacko && (
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderMatchup = (matchup: ConsolationMatchup, index: number) => {
    const isSackoGame = type === 'SACKO' && index === matchups.length - 1;

    return (
      <motion.div
        key={matchup.id}
        className="relative"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        {isSackoGame && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-bold rounded-full">
              <Frown className="w-3 h-3" />
              SACKO GAME
            </div>
          </div>
        )}

        <div
          className="space-y-2 cursor-pointer"
          onClick={() => handleMatchupClick(matchup)}
        >
          {renderTeam(matchup.team1, matchup, 'team1')}
          <div className="flex items-center justify-center">
            <div className="text-xs text-gray-500">VS</div>
          </div>
          {renderTeam(matchup.team2, matchup, 'team2')}
        </div>

        <div className="mt-2 text-center text-xs text-gray-500">
          Week {matchup.week}
        </div>
      </motion.div>
    );
  };

  const renderDraftOrderResult = () => {
    if (type !== 'DRAFT_ORDER') return null;

    const completedMatchups = matchups.filter(m => m.isComplete);
    if (completedMatchups.length === 0) return null;

    // Sort teams by performance to determine draft order
    const draftOrder = completedMatchups
      .flatMap(m => [
        { team: m.team1, score: m.team1Score, won: m.winnerId === m.team1?.id },
        { team: m.team2, score: m.team2Score, won: m.winnerId === m.team2?.id }
      ])
      .filter(t => t.team)
      .sort((a, b) => {
        // Winners get better picks (reverse order for non-playoff teams)
        if (a.won !== b.won) return a.won ? -1 : 1;
        return b.score - a.score;
      });

    return (
      <motion.div
        className="mt-8 p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 border border-blue-500/30 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-bold text-blue-400 mb-4">
          Projected Draft Order
        </h3>
        <div className="space-y-2">
          {draftOrder.map((entry, index) => (
            <div
              key={entry.team?.id}
              className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-900/50 rounded-full">
                  <span className="text-sm font-bold">#{index + 1}</span>
                </div>
                <span>{entry.team?.name}</span>
              </div>
              <div className="text-sm text-gray-400">
                {entry.score.toFixed(2)} pts
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderSackoShame = () => {
    if (!sackoId || type !== 'SACKO') return null;

    const sackoTeam = matchups
      .flatMap(m => [m.team1, m.team2])
      .find(t => t?.id === sackoId);

    if (!sackoTeam) return null;

    return (
      <motion.div
        className="mt-8 p-6 bg-gradient-to-br from-red-900/30 to-pink-900/20 border-2 border-red-500/50 rounded-xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Frown className="w-16 h-16 mx-auto text-red-500 mb-4" />
          </motion.div>
          <h3 className="text-2xl font-bold text-red-400 mb-2">SACKO</h3>
          <div className="text-xl text-white">{sackoTeam.name}</div>
          <div className="mt-4 text-sm text-gray-400">
            Forever remembered as the worst team of the season
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl border border-gray-700/50">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-8 h-8 text-gray-400" />
          <h2 className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            {title}
          </h2>
        </div>
        <div className="text-gray-400">{subtitle}</div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {matchups.map((matchup, index) => renderMatchup(matchup, index))}
      </div>

      {renderDraftOrderResult()}
      {renderSackoShame()}

      {/* Fun Stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <motion.div
          className="p-4 bg-gray-900/30 border border-gray-700/30 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-sm text-gray-500 mb-1">Total Shame Points</div>
          <div className="text-2xl font-bold text-red-400">
            {matchups.reduce((sum, m) => sum + m.team1Score + m.team2Score, 0).toFixed(0)}
          </div>
        </motion.div>

        <motion.div
          className="p-4 bg-gray-900/30 border border-gray-700/30 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-sm text-gray-500 mb-1">Games Played</div>
          <div className="text-2xl font-bold text-orange-400">
            {matchups.filter(m => m.isComplete).length} / {matchups.length}
          </div>
        </motion.div>

        <motion.div
          className="p-4 bg-gray-900/30 border border-gray-700/30 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-sm text-gray-500 mb-1">Lowest Score</div>
          <div className="text-2xl font-bold text-pink-400">
            {Math.min(...matchups.flatMap(m => [m.team1Score, m.team2Score])).toFixed(2)}
          </div>
        </motion.div>
      </div>
    </div>
  );
}