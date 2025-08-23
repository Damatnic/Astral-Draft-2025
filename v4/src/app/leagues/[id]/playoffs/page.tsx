'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import PlayoffBracket from '@/components/playoffs/PlayoffBracket';
import ConsolationBracket from '@/components/playoffs/ConsolationBracket';
import TrophyRoom from '@/components/playoffs/TrophyRoom';
import SeasonArchive from '@/components/playoffs/SeasonArchive';
import RecordBook from '@/components/playoffs/RecordBook';
import { Trophy, Users, BookOpen, Archive, Medal, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayoffBracket as PlayoffBracketType, ConsolationBracket as ConsolationBracketType, Trophy as TrophyType, Award, Achievement, SeasonArchive as SeasonArchiveType, RecordBook as RecordBookType } from '@/types';

export default function PlayoffsPage() {
  const params = useParams();
  const leagueId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<'bracket' | 'consolation' | 'trophies' | 'archive' | 'records'>('bracket');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateConfig, setGenerateConfig] = useState<{
    teamCount: 4 | 6 | 8;
    startWeek: number;
    endWeek: number;
    hasThirdPlace: boolean;
    championshipWeeks: 1 | 2;
  }>({
    teamCount: 6,
    startWeek: 15,
    endWeek: 17,
    hasThirdPlace: true,
    championshipWeeks: 1
  });

  // Fetch data
  const { data: bracket, isLoading: bracketLoading } = api.playoffs.getBracket.useQuery({ leagueId });
  const { data: consolation } = api.playoffs.getConsolationBracket.useQuery({ leagueId });
  const { data: trophies } = api.playoffs.getTrophies.useQuery({ leagueId });
  const { data: awards } = api.playoffs.getAwards.useQuery({ leagueId });
  const { data: achievements } = api.playoffs.getAchievements.useQuery({});
  const { data: archive } = api.playoffs.getSeasonArchive.useQuery({ leagueId });
  const { data: records } = api.playoffs.getRecordBook.useQuery({ leagueId });
  const { data: h2hRecords } = api.playoffs.getHeadToHeadRecords.useQuery({ leagueId });

  const generateBracketMutation = api.playoffs.generateBracket.useMutation({
    onSuccess: () => {
      setShowGenerateModal(false);
      // Refetch bracket data
      window.location.reload();
    },
    onError: (error) => {
      console.error('Failed to generate bracket:', error);
      // Could add toast notification here
    }
  });

  const handleGenerateBracket = () => {
    generateBracketMutation.mutate({
      leagueId,
      season: new Date().getFullYear(),
      teamCount: generateConfig.teamCount.toString() as "4" | "6" | "8",
      startWeek: generateConfig.startWeek,
      endWeek: generateConfig.endWeek,
      hasThirdPlace: generateConfig.hasThirdPlace,
      championshipWeeks: generateConfig.championshipWeeks.toString() as "1" | "2"
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bracket':
        if (!bracket) {
          return (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Playoff Bracket</h3>
              <p className="text-gray-400 mb-6">Generate a playoff bracket to get started</p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                Generate Playoff Bracket
              </button>
            </div>
          );
        }
        
        return (
          <PlayoffBracket
            bracketId={bracket.id}
            rounds={bracket.rounds}
            currentWeek={15} // This should come from league data
            teamCount={bracket.teamCount as 4 | 6 | 8}
            championId={bracket.championId || undefined}
            runnerUpId={bracket.runnerUpId || undefined}
            thirdPlaceId={bracket.thirdPlaceId || undefined}
          />
        );

      case 'consolation':
        if (!consolation) {
          return (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Consolation Bracket</h3>
              <p className="text-gray-400">Consolation games will be generated with the playoff bracket</p>
            </div>
          );
        }

        return (
          <ConsolationBracket
            type={consolation.type}
            matchups={consolation.bracketData}
            currentWeek={15}
            sackoId={consolation.winnerId || undefined}
          />
        );

      case 'trophies':
        return (
          <TrophyRoom
            trophies={trophies || []}
            awards={awards || []}
            achievements={achievements || []}
            currentSeason={new Date().getFullYear()}
          />
        );

      case 'archive':
        return (
          <SeasonArchive
            seasons={archive || []}
            currentSeason={new Date().getFullYear()}
          />
        );

      case 'records':
        return (
          <RecordBook
            records={records || []}
            headToHeadRecords={h2hRecords || []}
            currentSeason={new Date().getFullYear()}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Playoffs & Championships
          </h1>
          <p className="text-gray-400">Where legends are made and dreams are crushed</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeTab === 'bracket'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Trophy className="w-5 h-5" />
            Playoff Bracket
          </button>
          
          <button
            onClick={() => setActiveTab('consolation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeTab === 'consolation'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Users className="w-5 h-5" />
            Consolation
          </button>
          
          <button
            onClick={() => setActiveTab('trophies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeTab === 'trophies'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Medal className="w-5 h-5" />
            Trophy Room
          </button>
          
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeTab === 'archive'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Archive className="w-5 h-5" />
            Season Archive
          </button>
          
          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeTab === 'records'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Record Book
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {bracketLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              renderTabContent()
            )}
          </motion.div>
        </AnimatePresence>

        {/* Generate Bracket Modal */}
        <AnimatePresence>
          {showGenerateModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGenerateModal(false)}
            >
              <motion.div
                className="bg-gray-900 p-8 rounded-2xl border border-purple-500/30 max-w-md w-full"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-bold mb-6">Generate Playoff Bracket</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Teams</label>
                    <select
                      value={generateConfig.teamCount.toString()}
                      onChange={(e) => setGenerateConfig({ ...generateConfig, teamCount: parseInt(e.target.value) as 4 | 6 | 8 })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="4">4 Teams</option>
                      <option value="6">6 Teams (2 byes)</option>
                      <option value="8">8 Teams</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Start Week</label>
                    <input
                      type="number"
                      value={generateConfig.startWeek}
                      onChange={(e) => setGenerateConfig({ ...generateConfig, startWeek: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
                      min="1"
                      max="18"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">End Week</label>
                    <input
                      type="number"
                      value={generateConfig.endWeek}
                      onChange={(e) => setGenerateConfig({ ...generateConfig, endWeek: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
                      min="1"
                      max="18"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Championship Duration</label>
                    <select
                      value={generateConfig.championshipWeeks.toString()}
                      onChange={(e) => setGenerateConfig({ ...generateConfig, championshipWeeks: parseInt(e.target.value) as 1 | 2 })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="1">1 Week</option>
                      <option value="2">2 Weeks</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="thirdPlace"
                      checked={generateConfig.hasThirdPlace}
                      onChange={(e) => setGenerateConfig({ ...generateConfig, hasThirdPlace: e.target.checked })}
                      className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="thirdPlace" className="text-sm">Include Third Place Game</label>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateBracket}
                    disabled={generateBracketMutation.isPending}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {generateBracketMutation.isPending ? 'Generating...' : 'Generate Bracket'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}