/**
 * TradeAnalyzer - AI-powered trade analysis component
 */

import { useState } from 'react';
import { api } from '../../lib/api';
import { useOracleStore } from '../../stores/oracleStore';
import { useAppStore } from '../../stores/useAppStore';
import { 
  Users,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus,
  X,
  ChevronRight,
  Trophy,
  Target,
  Shield
} from 'lucide-react';

interface TradeSide {
  teamId: string;
  teamName: string;
  playerIds: string[];
  players: Array<{ id: string; name: string; position: string }>;
}

export function TradeAnalyzer() {
  const { currentLeague, currentTeam } = useAppStore();
  const { setTradeAnalysis, optimisticTradeUpdate } = useOracleStore();
  
  const [team1, setTeam1] = useState<TradeSide>({
    teamId: currentTeam?.id || '',
    teamName: currentTeam?.name || 'Your Team',
    playerIds: [],
    players: []
  });
  
  const [team2, setTeam2] = useState<TradeSide>({
    teamId: '',
    teamName: '',
    playerIds: [],
    players: []
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeTradeMutation = api.oracle.analyzeTrade.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
      const tradeId = `${team1.teamId}-${team2.teamId}-${Date.now()}`;
      setTradeAnalysis(tradeId, data);
    }
  });

  const handleAnalyze = async () => {
    if (team1.playerIds.length === 0 || team2.playerIds.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    try {
      await analyzeTradeMutation.mutateAsync({
        team1Id: team1.teamId,
        team2Id: team2.teamId,
        team1PlayerIds: team1.playerIds,
        team2PlayerIds: team2.playerIds,
        includeDraftPicks: false
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addPlayerToTeam = (teamSide: 'team1' | 'team2', player: any) => {
    if (teamSide === 'team1') {
      setTeam1(prev => ({
        ...prev,
        playerIds: [...prev.playerIds, player.id],
        players: [...prev.players, player]
      }));
    } else {
      setTeam2(prev => ({
        ...prev,
        playerIds: [...prev.playerIds, player.id],
        players: [...prev.players, player]
      }));
    }
  };

  const removePlayerFromTeam = (teamSide: 'team1' | 'team2', playerId: string) => {
    if (teamSide === 'team1') {
      setTeam1(prev => ({
        ...prev,
        playerIds: prev.playerIds.filter(id => id !== playerId),
        players: prev.players.filter(p => p.id !== playerId)
      }));
    } else {
      setTeam2(prev => ({
        ...prev,
        playerIds: prev.playerIds.filter(id => id !== playerId),
        players: prev.players.filter(p => p.id !== playerId)
      }));
    }
  };

  const getFairnessColor = (fairness: number) => {
    const diff = Math.abs(50 - fairness);
    if (diff <= 10) return 'text-green-400 bg-green-400/20';
    if (diff <= 25) return 'text-yellow-400 bg-yellow-400/20';
    return 'text-red-400 bg-red-400/20';
  };

  const getImpactColor = (impact: number) => {
    if (impact > 10) return 'text-green-400';
    if (impact > 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Trade Builder */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <ArrowRightLeft className="h-5 w-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Trade Analyzer</h2>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || team1.playerIds.length === 0 || team2.playerIds.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4" />
                <span>Analyze Trade</span>
              </>
            )}
          </button>
        </div>

        {/* Trade Sides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team 1 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">{team1.teamName}</h3>
              <span className="text-xs text-gray-400">Sending</span>
            </div>
            
            <div className="space-y-2">
              {team1.players.map(player => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{player.name}</p>
                    <p className="text-xs text-gray-400">{player.position}</p>
                  </div>
                  <button
                    onClick={() => removePlayerFromTeam('team1', player.id)}
                    className="p-1 rounded hover:bg-gray-600/50 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))}
              
              {team1.players.length === 0 && (
                <div className="p-8 border-2 border-dashed border-gray-600 rounded-lg">
                  <p className="text-center text-sm text-gray-400">No players selected</p>
                </div>
              )}
              
              <button className="w-full p-3 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/70 transition-colors flex items-center justify-center space-x-2">
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add Player</span>
              </button>
            </div>
          </div>

          {/* Team 2 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">{team2.teamName || 'Select Team'}</h3>
              <span className="text-xs text-gray-400">Receiving</span>
            </div>
            
            <div className="space-y-2">
              {team2.players.map(player => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{player.name}</p>
                    <p className="text-xs text-gray-400">{player.position}</p>
                  </div>
                  <button
                    onClick={() => removePlayerFromTeam('team2', player.id)}
                    className="p-1 rounded hover:bg-gray-600/50 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))}
              
              {team2.players.length === 0 && (
                <div className="p-8 border-2 border-dashed border-gray-600 rounded-lg">
                  <p className="text-center text-sm text-gray-400">No players selected</p>
                </div>
              )}
              
              <button className="w-full p-3 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/70 transition-colors flex items-center justify-center space-x-2">
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add Player</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Fairness Meter */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Trade Fairness</h3>
              <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${getFairnessColor(analysis.fairness)}`}>
                {analysis.fairness}% Fair
              </div>
            </div>
            
            <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-gradient-to-r from-red-600 to-yellow-600" />
                <div className="w-1/5 bg-gradient-to-r from-yellow-600 to-green-600" />
                <div className="flex-1 bg-gradient-to-r from-green-600 to-red-600" />
              </div>
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-lg transition-all duration-500"
                style={{ left: `${analysis.fairness}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">{team1.teamName} Favored</span>
              <span className="text-xs text-gray-400">Even</span>
              <span className="text-xs text-gray-400">{team2.teamName} Favored</span>
            </div>
          </div>

          {/* Winner Declaration */}
          {analysis.winner !== 'even' && (
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center space-x-3">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-300">Trade Winner</p>
                  <p className="text-lg font-bold text-white">
                    {analysis.winner === 'team1' ? team1.teamName : team2.teamName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Impact Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team 1 Impact */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-purple-500/20">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">{team1.teamName} Impact</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Immediate</span>
                  <div className="flex items-center space-x-1">
                    {analysis.team1Impact.immediate > 0 ? (
                      <TrendingUp className={`h-3 w-3 ${getImpactColor(analysis.team1Impact.immediate)}`} />
                    ) : (
                      <TrendingDown className={`h-3 w-3 ${getImpactColor(analysis.team1Impact.immediate)}`} />
                    )}
                    <span className={`text-sm font-bold ${getImpactColor(analysis.team1Impact.immediate)}`}>
                      {analysis.team1Impact.immediate > 0 ? '+' : ''}{analysis.team1Impact.immediate}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Rest of Season</span>
                  <div className="flex items-center space-x-1">
                    {analysis.team1Impact.restOfSeason > 0 ? (
                      <TrendingUp className={`h-3 w-3 ${getImpactColor(analysis.team1Impact.restOfSeason)}`} />
                    ) : (
                      <TrendingDown className={`h-3 w-3 ${getImpactColor(analysis.team1Impact.restOfSeason)}`} />
                    )}
                    <span className={`text-sm font-bold ${getImpactColor(analysis.team1Impact.restOfSeason)}`}>
                      {analysis.team1Impact.restOfSeason > 0 ? '+' : ''}{analysis.team1Impact.restOfSeason}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Playoff Odds</span>
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-3 w-3 text-yellow-400" />
                    <span className={`text-sm font-bold ${getImpactColor(analysis.team1Impact.playoffOddsChange)}`}>
                      {analysis.team1Impact.playoffOddsChange > 0 ? '+' : ''}{analysis.team1Impact.playoffOddsChange}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team 2 Impact */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-purple-500/20">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">{team2.teamName} Impact</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Immediate</span>
                  <div className="flex items-center space-x-1">
                    {analysis.team2Impact.immediate > 0 ? (
                      <TrendingUp className={`h-3 w-3 ${getImpactColor(analysis.team2Impact.immediate)}`} />
                    ) : (
                      <TrendingDown className={`h-3 w-3 ${getImpactColor(analysis.team2Impact.immediate)}`} />
                    )}
                    <span className={`text-sm font-bold ${getImpactColor(analysis.team2Impact.immediate)}`}>
                      {analysis.team2Impact.immediate > 0 ? '+' : ''}{analysis.team2Impact.immediate}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Rest of Season</span>
                  <div className="flex items-center space-x-1">
                    {analysis.team2Impact.restOfSeason > 0 ? (
                      <TrendingUp className={`h-3 w-3 ${getImpactColor(analysis.team2Impact.restOfSeason)}`} />
                    ) : (
                      <TrendingDown className={`h-3 w-3 ${getImpactColor(analysis.team2Impact.restOfSeason)}`} />
                    )}
                    <span className={`text-sm font-bold ${getImpactColor(analysis.team2Impact.restOfSeason)}`}>
                      {analysis.team2Impact.restOfSeason > 0 ? '+' : ''}{analysis.team2Impact.restOfSeason}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Playoff Odds</span>
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-3 w-3 text-yellow-400" />
                    <span className={`text-sm font-bold ${getImpactColor(analysis.team2Impact.playoffOddsChange)}`}>
                      {analysis.team2Impact.playoffOddsChange > 0 ? '+' : ''}{analysis.team2Impact.playoffOddsChange}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-semibold text-white mb-4">Oracle Insights</h3>
            <div className="space-y-3">
              {analysis.insights.map((insight: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-2">
                  <Target className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">{insight}</p>
                </div>
              ))}
            </div>
            
            {/* Recommendation */}
            <div className="mt-4 p-4 bg-purple-600/10 rounded-lg border border-purple-500/20">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-purple-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-purple-400 mb-1">Recommendation</p>
                  <p className="text-sm text-gray-300">{analysis.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}