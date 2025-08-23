'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  Zap,
  Trophy,
  Play,
  Target,
  Shield,
  Heart,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  opponent: string;
  status: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'ir';
  projectedPoints: number;
  actualPoints: number;
  percentPlayed: number;
  gameStatus: 'not_started' | 'in_progress' | 'final';
  gameTime?: string;
  stats?: {
    [key: string]: number;
  };
}

interface PlayByPlay {
  id: string;
  time: string;
  quarter: string;
  description: string;
  points: number;
  player: string;
  type: 'touchdown' | 'field_goal' | 'reception' | 'rush' | 'pass' | 'defense';
}

interface MatchupData {
  week: number;
  myTeam: {
    name: string;
    logo: string;
    score: number;
    projectedScore: number;
    players: Player[];
  };
  opponent: {
    name: string;
    logo: string;
    score: number;
    projectedScore: number;
    players: Player[];
  };
  winProbability: number;
  playByPlay: PlayByPlay[];
}

// Mock data
const mockMatchup: MatchupData = {
  week: 12,
  myTeam: {
    name: 'Dallas Dynasty',
    logo: '/team-logos/dallas.png',
    score: 98.5,
    projectedScore: 132.9,
    players: [
      { 
        id: '1', 
        name: 'Dak Prescott', 
        position: 'QB', 
        team: 'DAL', 
        opponent: 'WAS',
        status: 'healthy', 
        projectedPoints: 22.5, 
        actualPoints: 18.3, 
        percentPlayed: 75,
        gameStatus: 'in_progress',
        gameTime: 'Q4 2:35',
        stats: { pass_yds: 287, pass_td: 2, int: 1, rush_yds: 12 }
      },
      { 
        id: '2', 
        name: 'Breece Hall', 
        position: 'RB', 
        team: 'NYJ', 
        opponent: 'MIA',
        status: 'healthy', 
        projectedPoints: 16.8, 
        actualPoints: 19.2, 
        percentPlayed: 100,
        gameStatus: 'final',
        stats: { rush_yds: 112, rush_td: 1, rec: 4, rec_yds: 38 }
      },
      { 
        id: '3', 
        name: 'Kenneth Walker', 
        position: 'RB', 
        team: 'SEA', 
        opponent: 'SF',
        status: 'questionable', 
        projectedPoints: 14.2, 
        actualPoints: 0, 
        percentPlayed: 0,
        gameStatus: 'not_started',
        gameTime: '8:20 PM'
      },
      { 
        id: '4', 
        name: 'CeeDee Lamb', 
        position: 'WR', 
        team: 'DAL', 
        opponent: 'WAS',
        status: 'healthy', 
        projectedPoints: 18.4, 
        actualPoints: 21.5, 
        percentPlayed: 75,
        gameStatus: 'in_progress',
        gameTime: 'Q4 2:35',
        stats: { rec: 8, rec_yds: 143, rec_td: 1 }
      },
      { 
        id: '5', 
        name: 'AJ Brown', 
        position: 'WR', 
        team: 'PHI', 
        opponent: 'BUF',
        status: 'healthy', 
        projectedPoints: 17.2, 
        actualPoints: 15.8, 
        percentPlayed: 100,
        gameStatus: 'final',
        stats: { rec: 6, rec_yds: 98, rec_td: 1 }
      },
      { 
        id: '6', 
        name: 'Sam LaPorta', 
        position: 'TE', 
        team: 'DET', 
        opponent: 'GB',
        status: 'healthy', 
        projectedPoints: 11.5, 
        actualPoints: 13.2, 
        percentPlayed: 100,
        gameStatus: 'final',
        stats: { rec: 7, rec_yds: 82, rec_td: 1 }
      },
      { 
        id: '7', 
        name: 'Chris Olave', 
        position: 'FLEX', 
        team: 'NO', 
        opponent: 'ATL',
        status: 'healthy', 
        projectedPoints: 13.8, 
        actualPoints: 8.5, 
        percentPlayed: 50,
        gameStatus: 'in_progress',
        gameTime: 'Q3 8:42',
        stats: { rec: 4, rec_yds: 45 }
      },
      { 
        id: '8', 
        name: 'Justin Tucker', 
        position: 'K', 
        team: 'BAL', 
        opponent: 'LAC',
        status: 'healthy', 
        projectedPoints: 8.5, 
        actualPoints: 0, 
        percentPlayed: 0,
        gameStatus: 'not_started',
        gameTime: '8:20 PM'
      },
      { 
        id: '9', 
        name: 'San Francisco', 
        position: 'DEF', 
        team: 'SF', 
        opponent: 'SEA',
        status: 'healthy', 
        projectedPoints: 9.0, 
        actualPoints: 0, 
        percentPlayed: 0,
        gameStatus: 'not_started',
        gameTime: '8:20 PM',
        stats: {}
      }
    ]
  },
  opponent: {
    name: 'Green Bay Glory',
    logo: '/team-logos/gb.png',
    score: 87.2,
    projectedScore: 125.4,
    players: [
      { id: '10', name: 'Josh Allen', position: 'QB', team: 'BUF', opponent: 'PHI', status: 'healthy', projectedPoints: 24.5, actualPoints: 22.1, percentPlayed: 100, gameStatus: 'final' },
      { id: '11', name: 'Christian McCaffrey', position: 'RB', team: 'SF', opponent: 'SEA', status: 'healthy', projectedPoints: 19.2, actualPoints: 0, percentPlayed: 0, gameStatus: 'not_started' },
      { id: '12', name: 'Saquon Barkley', position: 'RB', team: 'PHI', opponent: 'BUF', status: 'healthy', projectedPoints: 17.8, actualPoints: 16.5, percentPlayed: 100, gameStatus: 'final' },
      { id: '13', name: 'Tyreek Hill', position: 'WR', team: 'MIA', opponent: 'NYJ', status: 'healthy', projectedPoints: 20.1, actualPoints: 18.8, percentPlayed: 100, gameStatus: 'final' },
      { id: '14', name: 'Stefon Diggs', position: 'WR', team: 'HOU', opponent: 'TEN', status: 'healthy', projectedPoints: 15.5, actualPoints: 12.3, percentPlayed: 100, gameStatus: 'final' },
      { id: '15', name: 'Travis Kelce', position: 'TE', team: 'KC', opponent: 'CAR', status: 'healthy', projectedPoints: 13.2, actualPoints: 11.8, percentPlayed: 100, gameStatus: 'final' },
      { id: '16', name: 'Mike Evans', position: 'FLEX', team: 'TB', opponent: 'NYG', status: 'healthy', projectedPoints: 14.8, actualPoints: 5.7, percentPlayed: 50, gameStatus: 'in_progress' },
      { id: '17', name: 'Harrison Butker', position: 'K', team: 'KC', opponent: 'CAR', status: 'healthy', projectedPoints: 9.0, actualPoints: 10.0, percentPlayed: 100, gameStatus: 'final' },
      { id: '18', name: 'Baltimore', position: 'DEF', team: 'BAL', opponent: 'LAC', status: 'healthy', projectedPoints: 8.5, actualPoints: 0, percentPlayed: 0, gameStatus: 'not_started' }
    ]
  },
  winProbability: 68,
  playByPlay: [
    { id: '1', time: '2:35', quarter: 'Q4', description: 'CeeDee Lamb 23-yard touchdown reception from Dak Prescott', points: 6.3, player: 'CeeDee Lamb', type: 'touchdown' },
    { id: '2', time: '5:12', quarter: 'Q4', description: 'Dak Prescott 287 passing yards milestone bonus', points: 2.0, player: 'Dak Prescott', type: 'pass' },
    { id: '3', time: '8:42', quarter: 'Q3', description: 'Chris Olave 12-yard reception', points: 1.2, player: 'Chris Olave', type: 'reception' },
    { id: '4', time: '10:15', quarter: 'Q3', description: 'Mike Evans 8-yard reception', points: 0.8, player: 'Mike Evans', type: 'reception' },
    { id: '5', time: 'Final', quarter: 'Final', description: 'Breece Hall game complete: 112 rush yards, 1 TD, 4 rec, 38 rec yards', points: 19.2, player: 'Breece Hall', type: 'rush' }
  ]
};

export default function MatchupPage() {
  const params = useParams();
  const [matchup, setMatchup] = useState<MatchupData>(mockMatchup);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'matchup' | 'playbyplay' | 'projections'>('matchup');

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate live score updates
        setMatchup(prev => ({
          ...prev,
          myTeam: {
            ...prev.myTeam,
            score: prev.myTeam.score + Math.random() * 2
          },
          opponent: {
            ...prev.opponent,
            score: prev.opponent.score + Math.random() * 1.5
          }
        }));
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const togglePlayerExpanded = (playerId: string) => {
    setExpandedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const getGameStatusColor = (status: string) => {
    switch(status) {
      case 'final': return 'text-gray-600';
      case 'in_progress': return 'text-green-600';
      case 'not_started': return 'text-gray-400';
      default: return 'text-gray-500';
    }
  };

  const getGameStatusIcon = (status: string) => {
    switch(status) {
      case 'final': return <Trophy className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4 animate-pulse" />;
      case 'not_started': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  const getPointsDifference = (actual: number, projected: number) => {
    const diff = actual - projected;
    if (diff > 0) {
      return <span className="text-green-600">+{diff.toFixed(1)}</span>;
    } else if (diff < 0) {
      return <span className="text-red-600">{diff.toFixed(1)}</span>;
    }
    return <span className="text-gray-500">0.0</span>;
  };

  const PlayerRow = ({ player, isMyTeam }: { player: Player; isMyTeam: boolean }) => {
    const isExpanded = expandedPlayers.has(player.id);
    
    return (
      <div className="border-b last:border-0">
        <div
          className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition"
          onClick={() => togglePlayerExpanded(player.id)}
        >
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold">{player.position}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{player.name}</span>
                {player.status !== 'healthy' && (
                  <AlertTriangle className={`w-4 h-4 ${
                    player.status === 'questionable' ? 'text-yellow-500' :
                    player.status === 'doubtful' ? 'text-orange-500' :
                    'text-red-500'
                  }`} />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{player.team} vs {player.opponent}</span>
                <span className={`flex items-center ${getGameStatusColor(player.gameStatus)}`}>
                  {getGameStatusIcon(player.gameStatus)}
                  <span className="ml-1">
                    {player.gameStatus === 'in_progress' ? player.gameTime :
                     player.gameStatus === 'final' ? 'Final' :
                     player.gameTime}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xl font-bold">{player.actualPoints.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Proj: {player.projectedPoints.toFixed(1)}</div>
            </div>
            <div className="text-right min-w-[60px]">
              {getPointsDifference(player.actualPoints, player.projectedPoints)}
            </div>
            <div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
        </div>
        
        {isExpanded && player.stats && (
          <div className="px-4 pb-4 bg-gray-50">
            <div className="grid grid-cols-4 gap-2 text-sm">
              {Object.entries(player.stats).map(([stat, value]) => (
                <div key={stat} className="text-center">
                  <div className="font-medium">{value}</div>
                  <div className="text-xs text-gray-500 uppercase">{stat.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/team/${params.id}`}>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Week {matchup.week} Matchup</h1>
                <p className="text-sm text-gray-500">Live scoring updates</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg transition flex items-center ${
                  autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Score Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-4xl">🏈</span>
              </div>
              <h2 className="text-2xl font-bold mb-1">{matchup.myTeam.name}</h2>
              <div className="text-5xl font-bold mb-2">{matchup.myTeam.score.toFixed(1)}</div>
              <div className="text-sm opacity-80">Projected: {matchup.myTeam.projectedScore.toFixed(1)}</div>
            </div>
            
            <div className="px-8">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">VS</div>
                <div className="text-sm opacity-80">WEEK {matchup.week}</div>
              </div>
            </div>
            
            <div className="flex-1 text-center">
              <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-4xl">🧀</span>
              </div>
              <h2 className="text-2xl font-bold mb-1">{matchup.opponent.name}</h2>
              <div className="text-5xl font-bold mb-2">{matchup.opponent.score.toFixed(1)}</div>
              <div className="text-sm opacity-80">Projected: {matchup.opponent.projectedScore.toFixed(1)}</div>
            </div>
          </div>
          
          {/* Win Probability */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Win Probability</span>
              <span className="text-lg font-bold">{matchup.winProbability}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-green-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${matchup.winProbability}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {(['matchup', 'playbyplay', 'projections'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition ${
                  selectedTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'playbyplay' ? 'Play-by-Play' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {selectedTab === 'matchup' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* My Team */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{matchup.myTeam.name}</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{matchup.myTeam.score.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Proj: {matchup.myTeam.projectedScore.toFixed(1)}</div>
                  </div>
                </div>
              </div>
              <div>
                {matchup.myTeam.players.map((player) => (
                  <PlayerRow key={player.id} player={player} isMyTeam={true} />
                ))}
              </div>
            </div>

            {/* Opponent Team */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b bg-gradient-to-r from-red-50 to-red-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{matchup.opponent.name}</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{matchup.opponent.score.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Proj: {matchup.opponent.projectedScore.toFixed(1)}</div>
                  </div>
                </div>
              </div>
              <div>
                {matchup.opponent.players.map((player) => (
                  <PlayerRow key={player.id} player={player} isMyTeam={false} />
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'playbyplay' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Live Play-by-Play</h3>
              <span className="text-sm text-gray-500">Auto-updating</span>
            </div>
            <div className="space-y-4">
              {matchup.playByPlay.map((play) => (
                <div key={play.id} className="flex items-start space-x-4 pb-4 border-b last:border-0">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      play.type === 'touchdown' ? 'bg-green-100' :
                      play.type === 'field_goal' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {play.type === 'touchdown' && <Zap className="w-5 h-5 text-green-600" />}
                      {play.type === 'field_goal' && <Target className="w-5 h-5 text-blue-600" />}
                      {(play.type === 'reception' || play.type === 'rush' || play.type === 'pass') && 
                        <Activity className="w-5 h-5 text-gray-600" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{play.description}</p>
                        <p className="text-sm text-gray-500">{play.player} • {play.quarter} {play.time}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">+{play.points}</div>
                        <div className="text-xs text-gray-500">POINTS</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'projections' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Projection Analysis</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Score</span>
                  <span className="text-xl font-bold">{matchup.myTeam.score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Projected Final</span>
                  <span className="text-xl font-bold">{matchup.myTeam.projectedScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Remaining Points</span>
                  <span className="text-xl font-bold text-blue-600">
                    {(matchup.myTeam.projectedScore - matchup.myTeam.score).toFixed(1)}
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Win Probability</span>
                    <span className="text-2xl font-bold text-green-600">{matchup.winProbability}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Key Players Remaining</h3>
              <div className="space-y-3">
                {matchup.myTeam.players
                  .filter(p => p.gameStatus === 'not_started')
                  .map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-sm text-gray-500">{player.team} • {player.gameTime}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{player.projectedPoints.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">PROJ PTS</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}