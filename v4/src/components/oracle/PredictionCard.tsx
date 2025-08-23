/**
 * PredictionCard - Display player predictions with confidence metrics
 */

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useOracleStore } from '../../stores/oracleStore';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  Zap,
  Shield,
  Target,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface PredictionCardProps {
  playerId: string;
  playerName: string;
  week: number;
  compact?: boolean;
  onSelect?: () => void;
}

export function PredictionCard({ 
  playerId, 
  playerName, 
  week, 
  compact = false,
  onSelect 
}: PredictionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { setPlayerPrediction, showConfidence } = useOracleStore();
  
  const { data: prediction, isLoading, error } = api.oracle.getPlayerPrediction.useQuery(
    { playerId, week, includeWeather: true },
    { 
      enabled: !!playerId
    }
  );

  // Handle successful data fetching
  useEffect(() => {
    if (prediction) {
      setPlayerPrediction(playerId, prediction);
    }
  }, [prediction, playerId, setPlayerPrediction]);

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-purple-500/20">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-red-500/20">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-400">Unable to load prediction</p>
        </div>
      </div>
    );
  }

  const getBoomBustColor = (value: number) => {
    if (value >= 40) return 'text-red-400';
    if (value >= 25) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getConfidenceColor = (value: number) => {
    if (value >= 80) return 'text-green-400 bg-green-400/20';
    if (value >= 60) return 'text-yellow-400 bg-yellow-400/20';
    return 'text-red-400 bg-red-400/20';
  };

  if (compact) {
    return (
      <button
        onClick={onSelect}
        className="w-full bg-gray-800/50 backdrop-blur-lg rounded-lg p-3 border border-purple-500/20 hover:bg-gray-800/70 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-300">{playerName}</p>
              <p className="text-lg font-bold text-white">
                {prediction.projectedPoints.toFixed(1)} pts
              </p>
            </div>
          </div>
          {showConfidence && (
            <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${getConfidenceColor(prediction.confidence)}`}>
              {prediction.confidence}%
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Activity className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{playerName}</h3>
              <p className="text-xs text-gray-400">Week {week} Projection</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Prediction */}
      <div className="p-4">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Projected Points</p>
            <p className="text-3xl font-bold text-white">
              {prediction.projectedPoints.toFixed(1)}
            </p>
          </div>
          {showConfidence && (
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Confidence</p>
              <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                {prediction.confidence}%
              </div>
            </div>
          )}
        </div>

        {/* Boom/Bust Indicators */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs text-gray-400">Boom</span>
              </div>
              <span className={`text-sm font-bold ${getBoomBustColor(100 - prediction.boom)}`}>
                {prediction.boom}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                style={{ width: `${prediction.boom}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-xs text-gray-400">Bust</span>
              </div>
              <span className={`text-sm font-bold ${getBoomBustColor(prediction.bust)}`}>
                {prediction.bust}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                style={{ width: `${prediction.bust}%` }}
              />
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="space-y-2">
          {prediction.insights.slice(0, isExpanded ? undefined : 2).map((insight, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <Zap className="h-3 w-3 text-purple-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-300">{insight}</p>
            </div>
          ))}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="bg-purple-600/10 rounded-lg p-3 border border-purple-500/20">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-purple-400 mb-1">Oracle Analysis</p>
                  <p className="text-xs text-gray-300">{prediction.reasoning}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-3">
              <button className="flex-1 px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors text-xs font-medium">
                Add to Lineup
              </button>
              <button className="flex-1 px-3 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/70 transition-colors text-xs font-medium">
                Compare
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}