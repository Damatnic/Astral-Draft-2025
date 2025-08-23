/**
 * InsightPanel - Display AI insights with actionable recommendations
 */

import { useState } from 'react';
import { useOracleStore } from '../../stores/oracleStore';
import { 
  AlertCircle,
  TrendingUp,
  Zap,
  Target,
  X,
  ChevronRight,
  Clock,
  User,
  CheckCircle
} from 'lucide-react';

interface OracleInsight {
  id: string;
  type: 'tip' | 'warning' | 'opportunity' | 'trend';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
  relatedPlayers?: string[];
  actionable: boolean;
}

interface InsightPanelProps {
  insight: OracleInsight;
  compact?: boolean;
}

export function InsightPanel({ insight, compact = false }: InsightPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActioned, setIsActioned] = useState(false);
  const { dismissInsight } = useOracleStore();

  const getInsightIcon = () => {
    switch (insight.type) {
      case 'warning':
        return AlertCircle;
      case 'opportunity':
        return Zap;
      case 'trend':
        return TrendingUp;
      default:
        return Target;
    }
  };

  const getInsightColor = () => {
    if (insight.priority === 'high') {
      switch (insight.type) {
        case 'warning':
          return 'border-red-500/30 bg-red-900/20';
        case 'opportunity':
          return 'border-green-500/30 bg-green-900/20';
        default:
          return 'border-purple-500/30 bg-purple-900/20';
      }
    }
    return 'border-gray-600/30 bg-gray-800/30';
  };

  const getIconColor = () => {
    if (insight.priority === 'high') {
      switch (insight.type) {
        case 'warning':
          return 'text-red-400';
        case 'opportunity':
          return 'text-green-400';
        default:
          return 'text-purple-400';
      }
    }
    return 'text-gray-400';
  };

  const handleAction = () => {
    setIsActioned(true);
    // Here you would typically trigger the actual action
    // For example, opening a trade modal, adjusting lineup, etc.
    setTimeout(() => {
      dismissInsight(insight.id);
    }, 1500);
  };

  const Icon = getInsightIcon();
  const timeAgo = new Date(insight.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  if (compact) {
    return (
      <div className={`p-3 rounded-lg border ${getInsightColor()} transition-all`}>
        <div className="flex items-start space-x-2">
          <Icon className={`h-4 w-4 ${getIconColor()} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-200 line-clamp-1">{insight.title}</p>
            <p className="text-xs text-gray-400 line-clamp-2 mt-1">{insight.content}</p>
          </div>
          <button
            onClick={() => dismissInsight(insight.id)}
            className="p-1 rounded hover:bg-gray-700/50 transition-colors"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${getInsightColor()} overflow-hidden transition-all`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${
              insight.priority === 'high' ? 'bg-white/10' : 'bg-gray-700/50'
            }`}>
              <Icon className={`h-5 w-5 ${getIconColor()}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-200">{insight.title}</h3>
                {insight.priority === 'high' && (
                  <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded">
                    HIGH
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 flex items-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>{timeAgo}</span>
                {insight.relatedPlayers && insight.relatedPlayers.length > 0 && (
                  <>
                    <span>•</span>
                    <User className="h-3 w-3" />
                    <span>{insight.relatedPlayers.length} players</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => dismissInsight(insight.id)}
            className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-3">
          <p className={`text-sm text-gray-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
            {insight.content}
          </p>
          
          {!isExpanded && insight.content.length > 100 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="mt-2 text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1"
            >
              <span>Show more</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Related Players */}
        {isExpanded && insight.relatedPlayers && insight.relatedPlayers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <p className="text-xs text-gray-400 mb-2">Related Players</p>
            <div className="flex flex-wrap gap-2">
              {insight.relatedPlayers.map((playerId) => (
                <span
                  key={playerId}
                  className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-lg"
                >
                  Player {playerId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {insight.actionable && !isActioned && (
          <div className="mt-4">
            <button
              onClick={handleAction}
              className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                insight.priority === 'high'
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Take Action
            </button>
          </div>
        )}

        {/* Success State */}
        {isActioned && (
          <div className="mt-4 flex items-center justify-center space-x-2 py-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400">Action taken!</span>
          </div>
        )}
      </div>
    </div>
  );
}