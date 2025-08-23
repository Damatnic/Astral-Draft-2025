/**
 * Oracle Panel Component
 * Main interface for AI-powered predictions and insights
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, TrendingUp, Trophy, Sparkles, AlertTriangle } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState';
import { useLeague } from '../../hooks/useLeague';
import { Player } from '../../types';

interface OraclePrediction {
  id: string;
  type: 'player' | 'team' | 'matchup' | 'trade';
  confidence: number;
  prediction: string;
  reasoning: string[];
  timestamp: Date;
}

export const OraclePanel: React.FC = () => {
  const { state, dispatch } = useAppState();
  const { league, myTeam } = useLeague();
  const [activeTab, setActiveTab] = React.useState<'predictions' | 'insights' | 'challenge'>('predictions');
  const [userPrediction, setUserPrediction] = React.useState('');
  const [oracleScore, setOracleScore] = React.useState(0);
  const [userScore, setUserScore] = React.useState(0);
  
  // Mock predictions
  const predictions: OraclePrediction[] = [
    {
      id: '1',
      type: 'player',
      confidence: 85,
      prediction: 'CeeDee Lamb will score 25+ fantasy points this week',
      reasoning: [
        'Facing a bottom-5 pass defense',
        'Averaging 10 targets per game',
        'Red zone target share of 28%'
      ],
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'team',
      confidence: 72,
      prediction: 'Your team has a 68% chance to win this week',
      reasoning: [
        'Favorable matchups at RB positions',
        'Opponent missing key players',
        'Historical performance in similar matchups'
      ],
      timestamp: new Date()
    },
    {
      id: '3',
      type: 'trade',
      confidence: 90,
      prediction: 'Trade Alert: Sell high on Josh Jacobs',
      reasoning: [
        'Peak value after recent performances',
        'Tough schedule ahead',
        'Potential workload concerns'
      ],
      timestamp: new Date()
    }
  ];
  
  const insights = [
    {
      title: 'Sleeper Alert',
      content: 'Jaylen Warren is projected to outperform his ranking by 15+ spots',
      icon: <Sparkles className="w-5 h-5 text-yellow-400" />
    },
    {
      title: 'Injury Impact',
      content: 'Monitor Travis Kelce\'s practice status - 30% performance drop if limited',
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />
    },
    {
      title: 'Weather Factor',
      content: 'High winds expected in BUF vs MIA - favor running backs',
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />
    }
  ];
  
  const handleChallenge = () => {
    // Submit user prediction to challenge the Oracle
    if (!userPrediction) return;
    
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: 'Prediction submitted! Check back after games to see results.',
        type: 'INFO'
      }
    });
    
    setUserPrediction('');
  };
  
  const renderPredictions = () => (
    <div className="space-y-4">
      {predictions.map(pred => (
        <motion.div
          key={pred.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                  {pred.type.toUpperCase()}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {pred.confidence}% confidence
                </span>
              </div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                {pred.prediction}
              </h3>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                pred.confidence >= 80 ? 'text-green-400' :
                pred.confidence >= 60 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {pred.confidence}%
              </div>
            </div>
          </div>
          
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-[var(--text-secondary)]">Reasoning:</p>
            <ul className="space-y-1">
              {pred.reasoning.map((reason, idx) => (
                <li key={idx} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      ))}
    </div>
  );
  
  const renderInsights = () => (
    <div className="space-y-4">
      {insights.map((insight, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-black/20 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1">{insight.icon}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                {insight.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {insight.content}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
  
  const renderChallenge = () => (
    <div className="space-y-6">
      {/* Score Board */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/20 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-cyan-400">{userScore}</div>
          <div className="text-sm text-[var(--text-secondary)]">Your Score</div>
        </div>
        <div className="bg-black/20 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{oracleScore}</div>
          <div className="text-sm text-[var(--text-secondary)]">Oracle Score</div>
        </div>
      </div>
      
      {/* Make Prediction */}
      <div className="bg-black/20 rounded-lg p-4">
        <h3 className="font-semibold text-[var(--text-primary)] mb-3">
          Make Your Prediction
        </h3>
        <div className="space-y-3">
          <select className="w-full px-3 py-2 bg-black/20 border border-[var(--panel-border)] rounded text-[var(--text-primary)]">
            <option>Player Performance</option>
            <option>Game Outcome</option>
            <option>Season Stats</option>
          </select>
          
          <textarea
            value={userPrediction}
            onChange={(e) => setUserPrediction(e.target.value)}
            placeholder="Enter your prediction..."
            className="w-full px-3 py-2 bg-black/20 border border-[var(--panel-border)] rounded text-[var(--text-primary)] h-24 resize-none"
          />
          
          <button
            onClick={handleChallenge}
            className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded font-medium hover:opacity-90 transition-opacity"
          >
            Submit Prediction
          </button>
        </div>
      </div>
      
      {/* Recent Challenges */}
      <div className="bg-black/20 rounded-lg p-4">
        <h3 className="font-semibold text-[var(--text-primary)] mb-3">
          Recent Challenges
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Week 1: Player Points</span>
            <span className="text-green-400">Won (+1)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Week 2: Game Outcome</span>
            <span className="text-red-400">Lost (0)</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BrainCircuit className="w-8 h-8 text-cyan-400" />
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            The Oracle
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            AI-powered predictions and insights
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['predictions', 'insights', 'challenge'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-cyan-500 text-white'
                : 'bg-black/20 text-[var(--text-secondary)] hover:bg-black/30'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'predictions' && renderPredictions()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'challenge' && renderChallenge()}
      </div>
    </div>
  );
};

export default OraclePanel;