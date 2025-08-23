'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPlayerById, type NFLPlayer } from '@/data/nfl-players';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState<NFLPlayer | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'gamelog' | 'news'>('overview');
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);

  useEffect(() => {
    const playerId = params.id as string;
    const foundPlayer = getPlayerById(playerId);
    if (foundPlayer) {
      setPlayer(foundPlayer);
      
      // Check watchlist
      const watchlist = JSON.parse(localStorage.getItem('playerWatchlist') || '[]');
      setIsInWatchlist(watchlist.includes(playerId));
    } else {
      // Redirect to players page if player not found
      router.push('/players');
    }
  }, [params.id, router]);

  const toggleWatchlist = () => {
    if (!player) return;
    
    const watchlist = JSON.parse(localStorage.getItem('playerWatchlist') || '[]');
    let newWatchlist;
    
    if (isInWatchlist) {
      newWatchlist = watchlist.filter((id: string) => id !== player.id);
    } else {
      newWatchlist = [...watchlist, player.id];
    }
    
    localStorage.setItem('playerWatchlist', JSON.stringify(newWatchlist));
    setIsInWatchlist(!isInWatchlist);
  };

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading player data...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: NFLPlayer['status']) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50';
      case 'INJURED': return 'text-red-600 bg-red-50';
      case 'IR': return 'text-red-700 bg-red-100';
      case 'OUT': return 'text-red-800 bg-red-100';
      case 'QUESTIONABLE': return 'text-yellow-600 bg-yellow-50';
      case 'DOUBTFUL': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPositionColor = (position: NFLPlayer['position']) => {
    switch (position) {
      case 'QB': return 'bg-red-500';
      case 'RB': return 'bg-green-500';
      case 'WR': return 'bg-blue-500';
      case 'TE': return 'bg-orange-500';
      case 'K': return 'bg-purple-500';
      case 'DEF': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  // Chart data for fantasy points trend
  const chartData = {
    labels: player.weeklyStats?.map(w => `Week ${w.week}`) || [],
    datasets: [
      {
        label: 'Fantasy Points',
        data: player.weeklyStats?.map(w => w.fantasyPoints) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y.toFixed(1)} points`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => router.push('/players')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Players
        </button>
      </div>

      {/* Player Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Player Image Placeholder */}
            <div className="flex-shrink-0">
              <div className={`w-32 h-32 rounded-full ${getPositionColor(player.position)} flex items-center justify-center text-white`}>
                <span className="text-4xl font-bold">{player.jerseyNumber || player.position}</span>
              </div>
            </div>

            {/* Player Info */}
            <div className="flex-grow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">{player.displayName}</h1>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-white ${getPositionColor(player.position)}`}>
                      {player.position}
                    </span>
                    <span className="text-lg text-gray-600">{player.nflTeam}</span>
                    <span className="text-lg text-gray-600">#{player.jerseyNumber}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(player.status)}`}>
                      {player.status}
                      {player.injuryStatus && ` - ${player.injuryStatus}`}
                    </span>
                    {player.injuryNotes && (
                      <p className="text-sm text-gray-600 mt-1">{player.injuryNotes}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={toggleWatchlist}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isInWatchlist
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill={isInWatchlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </div>
                  </button>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors">
                    Add/Drop
                  </button>
                  <button
                    onClick={() => setShowTradeModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    Trade
                  </button>
                </div>
              </div>

              {/* Bio Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Height/Weight</p>
                  <p className="font-semibold">{player.height} • {player.weight} lbs</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-semibold">{player.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-semibold">{player.experience} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">College</p>
                  <p className="font-semibold">{player.college}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Bar */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-blue-100 text-sm">Rank</p>
              <p className="text-3xl font-bold">#{player.rank}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">ADP</p>
              <p className="text-3xl font-bold">{player.adp.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Projected Points</p>
              <p className="text-3xl font-bold">{player.projectedPoints.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">2023 Total</p>
              <p className="text-3xl font-bold">{player.stats2023.fantasyPoints.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">2023 PPG</p>
              <p className="text-3xl font-bold">{player.stats2023.fantasyPPG.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {(['overview', 'stats', 'gamelog', 'news'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'gamelog' ? 'Game Log' : tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Fantasy Points Trend */}
            {player.weeklyStats && player.weeklyStats.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Fantasy Points Trend</h3>
                <Line data={chartData} options={chartOptions} />
              </div>
            )}

            {/* Season Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">2023 Season Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Games Played</span>
                  <span className="font-semibold">{player.stats2023.gamesPlayed}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Fantasy Points</span>
                  <span className="font-semibold">{player.stats2023.fantasyPoints.toFixed(1)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Points Per Game</span>
                  <span className="font-semibold">{player.stats2023.fantasyPPG.toFixed(1)}</span>
                </div>
                
                {/* Position-specific stats */}
                {player.position === 'QB' && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Passing Yards</span>
                      <span className="font-semibold">{player.stats2023.passYards?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Passing TDs</span>
                      <span className="font-semibold">{player.stats2023.passTds}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Interceptions</span>
                      <span className="font-semibold">{player.stats2023.passInts}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Rushing Yards</span>
                      <span className="font-semibold">{player.stats2023.rushYards}</span>
                    </div>
                  </>
                )}
                
                {player.position === 'RB' && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Rushing Yards</span>
                      <span className="font-semibold">{player.stats2023.rushYards?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Rushing TDs</span>
                      <span className="font-semibold">{player.stats2023.rushTds}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Receptions</span>
                      <span className="font-semibold">{player.stats2023.receptions}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Receiving Yards</span>
                      <span className="font-semibold">{player.stats2023.recYards?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Receiving TDs</span>
                      <span className="font-semibold">{player.stats2023.recTds}</span>
                    </div>
                  </>
                )}
                
                {(player.position === 'WR' || player.position === 'TE') && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Receptions</span>
                      <span className="font-semibold">{player.stats2023.receptions}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Targets</span>
                      <span className="font-semibold">{player.stats2023.targets}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Receiving Yards</span>
                      <span className="font-semibold">{player.stats2023.recYards?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Receiving TDs</span>
                      <span className="font-semibold">{player.stats2023.recTds}</span>
                    </div>
                  </>
                )}
                
                {player.position === 'K' && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Field Goals Made</span>
                      <span className="font-semibold">{player.stats2023.fgMade}/{player.stats2023.fgAttempts}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Extra Points Made</span>
                      <span className="font-semibold">{player.stats2023.xpMade}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Detailed Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Season Totals</h4>
                <div className="space-y-2">
                  {Object.entries(player.stats2023).map(([key, value]) => {
                    if (key === 'gamesPlayed' || key === 'fantasyPoints' || key === 'fantasyPPG') return null;
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={key} className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">{label}</span>
                        <span className="text-sm font-medium">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Per Game Averages</h4>
                <div className="space-y-2">
                  {player.position === 'QB' && (
                    <>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Pass Yards/Game</span>
                        <span className="text-sm font-medium">{(player.stats2023.passYards! / player.stats2023.gamesPlayed).toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Pass TDs/Game</span>
                        <span className="text-sm font-medium">{(player.stats2023.passTds! / player.stats2023.gamesPlayed).toFixed(1)}</span>
                      </div>
                    </>
                  )}
                  {player.position === 'RB' && (
                    <>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Rush Yards/Game</span>
                        <span className="text-sm font-medium">{(player.stats2023.rushYards! / player.stats2023.gamesPlayed).toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Receptions/Game</span>
                        <span className="text-sm font-medium">{(player.stats2023.receptions! / player.stats2023.gamesPlayed).toFixed(1)}</span>
                      </div>
                    </>
                  )}
                  {(player.position === 'WR' || player.position === 'TE') && (
                    <>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Receptions/Game</span>
                        <span className="text-sm font-medium">{(player.stats2023.receptions! / player.stats2023.gamesPlayed).toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Rec Yards/Game</span>
                        <span className="text-sm font-medium">{(player.stats2023.recYards! / player.stats2023.gamesPlayed).toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Catch Rate</span>
                        <span className="text-sm font-medium">{((player.stats2023.receptions! / player.stats2023.targets!) * 100).toFixed(1)}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gamelog' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold p-6 pb-4">Recent Games</h3>
            {player.weeklyStats && player.weeklyStats.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opponent</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fantasy Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {player.weeklyStats.map((week) => (
                    <tr key={week.week}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Week {week.week}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">vs {week.opponent}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                          week.fantasyPoints >= 20 ? 'bg-green-100 text-green-800' :
                          week.fantasyPoints >= 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {week.fantasyPoints.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {Object.entries(week.stats).map(([key, value], index) => (
                          <span key={key}>
                            {index > 0 && ' • '}
                            {String(value)} {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-6 text-gray-500">No game log data available</p>
            )}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-4">
            {player.news && player.news.length > 0 ? (
              player.news.map((article, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{article.headline}</h3>
                      <p className="text-sm text-gray-500 mt-1">{article.date}</p>
                      <p className="text-gray-600 mt-3">{article.content}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-gray-500">No recent news available for this player</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trade Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowTradeModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Propose Trade</h3>
              <p className="text-gray-600 mb-4">Select a team to propose a trade for {player.displayName}</p>
              <div className="space-y-2 mb-4">
                {/* This would normally list teams from the league */}
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100">Team 1</button>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100">Team 2</button>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100">Team 3</button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}