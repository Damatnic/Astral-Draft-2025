import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { seasonContestService, SeasonContest } from '../services/seasonContestService';

interface SeasonContestViewProps {
  userId?: string;
}

const SeasonContestView: React.FC<SeasonContestViewProps> = ({ userId = 'user-123' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'weekly' | 'bracket' | 'awards' | 'leaderboard'>('overview');
  const [selectedContest, setSelectedContest] = useState<SeasonContest | null>(null);
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [userContests, setUserContests] = useState<SeasonContest[]>([]);
  const [allContests, setAllContests] = useState<SeasonContest[]>([]);

  useEffect(() => {
    // Load user's contests
    const contests = seasonContestService.getUserContests(userId);
    setUserContests(contests);
    
    // Load all active contests
    const active = seasonContestService.getActiveContests();
    setAllContests(active);
    
    // Set default selected contest
    if (contests.length > 0) {
      setSelectedContest(contests[0]);
    }
  }, [userId]);

  const getContestStatusColor = (status: SeasonContest['status']) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'UPCOMING': return 'text-blue-600 bg-blue-100';
      case 'COMPLETED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getContestTypeIcon = (type: SeasonContest['contestType']) => {
    switch (type) {
      case 'WEEKLY_PREDICTIONS': return '📊';
      case 'PLAYOFF_BRACKET': return '🏆';
      case 'SEASON_AWARDS': return '🏅';
      case 'MILESTONE_PREDICTIONS': return '🎯';
      default: return '📈';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Contest Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Contests</p>
              <p className="text-2xl font-bold text-gray-900">{userContests.filter(c => c.status === 'ACTIVE').length}</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedContest?.participants.find(p => p.userId === userId)?.totalScore || 0}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Rank</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedContest?.participants.find(p => p.userId === userId)?.currentRank || '-'}
              </p>
            </div>
            <div className="text-3xl">🏅</div>
          </div>
        </div>
      </div>

      {/* Active Contests */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Your Contests</h2>
        </div>
        <div className="p-6">
          {userContests.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Contests</h3>
              <p className="text-gray-600 mb-4">Join a contest to start competing for prizes!</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                Browse Available Contests
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userContests.map(contest => (
                <motion.div
                  key={contest.id}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedContest?.id === contest.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedContest(contest)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getContestTypeIcon(contest.contestType)}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{contest.name}</h3>
                        <p className="text-sm text-gray-600">{contest.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContestStatusColor(contest.status)}`}>
                            {contest.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {contest.participants.length} participants
                          </span>
                          <span className="text-xs text-gray-500">
                            Prize Pool: ${contest.prizePool.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {contest.participants.find(p => p.userId === userId)?.totalScore || 0} pts
                      </div>
                      <div className="text-sm text-gray-600">
                        Rank #{contest.participants.find(p => p.userId === userId)?.currentRank || '-'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Contests */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Available Contests</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allContests.filter(c => !userContests.some(uc => uc.id === c.id)).map(contest => (
              <div key={contest.id} className="p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-xl">{getContestTypeIcon(contest.contestType)}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{contest.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContestStatusColor(contest.status)}`}>
                      {contest.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{contest.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Prize Pool: ${contest.prizePool.toLocaleString()}
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors">
                    Join Contest
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWeeklyPredictions = () => (
    <div className="space-y-6">
      {selectedContest?.weeks && (
        <>
          {/* Week Navigation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Weekly Predictions</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Week:</label>
                <select
                  value={activeWeek}
                  onChange={(e) => setActiveWeek(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                >
                  {selectedContest.weeks.map(week => (
                    <option key={week.week} value={week.week}>
                      Week {week.week}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const currentWeek = selectedContest.weeks.find(w => w.week === activeWeek);
              if (!currentWeek) return <div>Week not found</div>;

              return (
                <div className="space-y-6">
                  {/* Week Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{currentWeek.theme}</h3>
                      <p className="text-sm text-gray-600">
                        Deadline: {currentWeek.deadline.toLocaleDateString()} at {currentWeek.deadline.toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentWeek.status === 'OPEN' ? 'text-green-600 bg-green-100' :
                      currentWeek.status === 'LOCKED' ? 'text-orange-600 bg-orange-100' :
                      currentWeek.status === 'COMPLETED' ? 'text-gray-600 bg-gray-100' :
                      'text-blue-600 bg-blue-100'
                    }`}>
                      {currentWeek.status}
                    </span>
                  </div>

                  {/* Predictions */}
                  <div className="space-y-4">
                    {currentWeek.predictions.map(prediction => (
                      <div key={prediction.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{prediction.question}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{prediction.points} pts</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              prediction.difficulty === 'EASY' ? 'text-green-600 bg-green-100' :
                              prediction.difficulty === 'MEDIUM' ? 'text-orange-600 bg-orange-100' :
                              prediction.difficulty === 'HARD' ? 'text-red-600 bg-red-100' :
                              'text-purple-600 bg-purple-100'
                            }`}>
                              {prediction.difficulty}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {prediction.options.map(option => (
                            <label
                              key={option.id}
                              className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={prediction.id}
                                value={option.id}
                                className="text-blue-600"
                                disabled={currentWeek.status !== 'OPEN'}
                              />
                              <span className="text-sm text-gray-900">{option.label}</span>
                              {option.odds && (
                                <span className="text-xs text-gray-500">({option.odds > 0 ? '+' : ''}{option.odds})</span>
                              )}
                            </label>
                          ))}
                        </div>

                        {prediction.confidenceEnabled && currentWeek.status === 'OPEN' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <label className="block text-sm text-gray-600 mb-2">
                              Confidence Level (1-5):
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bonus Questions */}
                  {currentWeek.bonusQuestions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Bonus Questions</h3>
                      {currentWeek.bonusQuestions.map(bonus => (
                        <div key={bonus.id} className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{bonus.question}</h4>
                            <span className="text-sm text-blue-600 font-medium">+{bonus.pointValue} bonus</span>
                          </div>
                          
                          {bonus.type === 'MULTIPLE_CHOICE' && bonus.options && (
                            <div className="space-y-2">
                              {bonus.options.map((option, index) => (
                                <label
                                  key={index}
                                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-100 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={bonus.id}
                                    value={option}
                                    className="text-blue-600"
                                    disabled={currentWeek.status !== 'OPEN'}
                                  />
                                  <span className="text-sm text-gray-900">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {bonus.type === 'NUMERIC' && (
                            <input
                              type="number"
                              className="w-full p-2 border border-gray-300 rounded-lg"
                              placeholder="Enter your prediction..."
                              disabled={currentWeek.status !== 'OPEN'}
                            />
                          )}

                          {bonus.type === 'TRUE_FALSE' && (
                            <div className="flex space-x-4">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={bonus.id}
                                  value="true"
                                  className="text-blue-600"
                                  disabled={currentWeek.status !== 'OPEN'}
                                />
                                <span className="text-sm text-gray-900">True</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={bonus.id}
                                  value="false"
                                  className="text-blue-600"
                                  disabled={currentWeek.status !== 'OPEN'}
                                />
                                <span className="text-sm text-gray-900">False</span>
                              </label>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit Button */}
                  {currentWeek.status === 'OPEN' && (
                    <div className="flex justify-end">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                        Submit Predictions
                      </button>
                    </div>
                  )}

                  {/* Results */}
                  {currentWeek.status === 'COMPLETED' && currentWeek.results && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-4">Week {activeWeek} Results</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-green-600">Your Score</p>
                          <p className="text-2xl font-bold text-green-900">
                            {selectedContest.participants.find(p => p.userId === userId)?.weeklyScores[activeWeek] || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-green-600">Average Score</p>
                          <p className="text-2xl font-bold text-green-900">
                            {currentWeek.results.averageScore.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-green-600">Weekly Rank</p>
                          <p className="text-2xl font-bold text-green-900">
                            {selectedContest.participants.find(p => p.userId === userId)?.predictions[activeWeek]?.weeklyRank || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );

  const renderLeaderboard = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Contest Leaderboard</h2>
      </div>
      <div className="p-6">
        {selectedContest?.leaderboard.rankings.map((ranking, index) => (
          <motion.div
            key={ranking.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-4 rounded-lg mb-3 ${
              ranking.userId === userId ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                ranking.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                ranking.rank === 2 ? 'bg-gray-300 text-gray-700' :
                ranking.rank === 3 ? 'bg-orange-400 text-orange-900' :
                'bg-gray-200 text-gray-600'
              }`}>
                {ranking.rank}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{ranking.userName}</span>
                  {ranking.userId === userId && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">You</span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Accuracy: {ranking.accuracy.toFixed(1)}%</span>
                  <span>Streak: {ranking.streak}</span>
                  <span>Avg: {ranking.weeklyAverage.toFixed(1)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{ranking.totalScore}</div>
              <div className={`text-sm ${
                ranking.rankChange > 0 ? 'text-green-600' :
                ranking.rankChange < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {ranking.rankChange > 0 ? '↗' : ranking.rankChange < 0 ? '↘' : '→'} 
                {Math.abs(ranking.rankChange)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (!selectedContest) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Contest Selected</h2>
        <p className="text-gray-600">Join a contest to start competing!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Season Contests</h1>
          <p className="text-gray-600">Compete in season-long prediction contests and championship brackets</p>
        </div>

        {/* Contest Selection */}
        {userContests.length > 1 && (
          <div className="mb-6">
            <div className="flex space-x-2">
              {userContests.map(contest => (
                <button
                  key={contest.id}
                  onClick={() => setSelectedContest(contest)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedContest.id === contest.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {contest.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'weekly', label: 'Weekly Predictions', icon: '📅' },
                { id: 'bracket', label: 'Playoff Bracket', icon: '🏆' },
                { id: 'awards', label: 'Season Awards', icon: '🏅' },
                { id: 'leaderboard', label: 'Leaderboard', icon: '👑' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'weekly' && renderWeeklyPredictions()}
            {activeTab === 'leaderboard' && renderLeaderboard()}
            {activeTab === 'bracket' && (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Playoff Bracket</h3>
                <p className="text-gray-600">Bracket predictions will be available during playoff season</p>
              </div>
            )}
            {activeTab === 'awards' && (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-6xl mb-4">🏅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Season Awards</h3>
                <p className="text-gray-600">Award predictions will be available near the end of the season</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SeasonContestView;
