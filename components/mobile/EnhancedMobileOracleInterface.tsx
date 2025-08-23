/**
 * Enhanced Mobile Oracle Interface
 * Optimized for touch interactions and mobile screens
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  BarChart3, 
  Clock,
  Trophy,
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import MobileLayout from './MobileLayout';

interface Prediction {
  id: string;
  question: string;
  options: PredictionOption[];
  deadline: string;
  category: 'spread' | 'total' | 'player_prop' | 'team_prop';
  difficulty: 'easy' | 'medium' | 'hard';
  confidence?: number;
  submitted?: boolean;
  result?: number;
}

interface PredictionOption {
  id: number;
  text: string;
  odds: number;
  probability: number;
}

interface Props {
  activeView: string;
  onViewChange: (view: string) => void;
  week?: number;
  className?: string;
}

const EnhancedMobileOracleInterface: React.FC<Props> = ({
  activeView,
  onViewChange,
  week = 1,
  className = ''
}) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalPredictions: 0,
    submitted: 0,
    accuracy: 0,
    weeklyRank: 0
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockPredictions: Prediction[] = [
      {
        id: 'pred_1',
        question: 'Will the Chiefs cover the -7.5 spread vs Raiders?',
        options: [
          { id: 0, text: 'Yes, Chiefs cover', odds: -110, probability: 0.52 },
          { id: 1, text: 'No, Raiders cover', odds: -110, probability: 0.48 }
        ],
        deadline: '2024-09-15T17:00:00Z',
        category: 'spread',
        difficulty: 'medium',
        submitted: true,
        confidence: 75
      },
      {
        id: 'pred_2',
        question: 'Will the total points be over 47.5 in Bills vs Dolphins?',
        options: [
          { id: 0, text: 'Over 47.5', odds: -105, probability: 0.51 },
          { id: 1, text: 'Under 47.5', odds: -115, probability: 0.49 }
        ],
        deadline: '2024-09-15T20:00:00Z',
        category: 'total',
        difficulty: 'easy'
      },
      {
        id: 'pred_3',
        question: 'Will Josh Allen throw for over 2.5 TDs?',
        options: [
          { id: 0, text: 'Over 2.5 TDs', odds: +120, probability: 0.45 },
          { id: 1, text: 'Under 2.5 TDs', odds: -140, probability: 0.55 }
        ],
        deadline: '2024-09-15T20:00:00Z',
        category: 'player_prop',
        difficulty: 'hard'
      }
    ];

    setPredictions(mockPredictions);
    setStats({
      totalPredictions: mockPredictions.length,
      submitted: mockPredictions.filter((p: any) => p.submitted).length,
      accuracy: 73.5,
      weeklyRank: 42
    });
  }, [week]);

  const handlePredictionSubmit = useCallback((predictionId: string, optionId: number, confidence: number) => {
    setPredictions(prev => prev.map((p: any) => 
      p.id === predictionId 
        ? { ...p, submitted: true, confidence }
        : p
    ));
    setSelectedPrediction(null);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      submitted: prev.submitted + 1
    }));
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'hard': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spread': return Target;
      case 'total': return BarChart3;
      case 'player_prop': return Users;
      case 'team_prop': return Trophy;
      default: return Target;
    }
  };

  const isDeadlineSoon = (deadline: string) => {
    const deadlineTime = new Date(deadline).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return deadlineTime - now < oneHour;
  };

  const renderStatsCard = () => (
    <motion.div
      className="bg-gray-800/50 rounded-xl p-4 mb-6 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Week {week} Oracle</h2>
        <motion.button
          onClick={handleRefresh}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 min-h-[44px] min-w-[44px]"
          whileTap={{ scale: 0.95 }}
          disabled={refreshing}
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.submitted}/{stats.totalPredictions}</div>
          <div className="text-sm text-gray-400">Submitted</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats.accuracy}%</div>
          <div className="text-sm text-gray-400">Accuracy</div>
        </div>
      </div>
    </motion.div>
  );

  const renderPredictionCard = (prediction: Prediction) => {
    const CategoryIcon = getCategoryIcon(prediction.category);
    const deadlineSoon = isDeadlineSoon(prediction.deadline);
    
    return (
      <motion.div
        key={prediction.id}
        className="bg-gray-800/50 rounded-xl p-4 mb-4 backdrop-blur-sm border border-gray-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <CategoryIcon className="w-5 h-5 text-blue-400" />
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(prediction.difficulty)}`}>
              {prediction.difficulty.toUpperCase()}
            </span>
          </div>
          
          {prediction.submitted ? (
            <div className="flex items-center space-x-1 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{prediction.confidence}%</span>
            </div>
          ) : deadlineSoon && (
            <div className="flex items-center space-x-1 text-orange-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Soon</span>
            </div>
          )}
        </div>

        {/* Question */}
        <h3 className="text-white font-medium mb-3 leading-relaxed">
          {prediction.question}
        </h3>

        {/* Options */}
        <div className="space-y-2 mb-3">
          {prediction.options.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => setSelectedPrediction(prediction.id)}
              className="
                w-full p-3 rounded-lg border border-gray-600/50
                bg-gray-700/30 hover:bg-gray-700/50
                text-left transition-colors min-h-[44px]
                flex items-center justify-between
              "
              whileTap={{ scale: 0.98 }}
              disabled={prediction.submitted}
            >
              <span className="text-white text-sm">{option.text}</span>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>{option.odds > 0 ? '+' : ''}{option.odds}</span>
                <span>({(option.probability * 100).toFixed(0)}%)</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Deadline: {new Date(prediction.deadline).toLocaleTimeString()}</span>
          </div>
          {!prediction.submitted && (
            <span className="text-blue-400 font-medium">Tap to predict</span>
          )}
        </div>
      </motion.div>
    );
  };

  const renderPredictionModal = () => {
    const prediction = predictions.find((p: any) => p.id === selectedPrediction);
    if (!prediction) return null;

    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedPrediction(null)}
        >
          <motion.div
            className="
              bg-gray-800 rounded-t-xl p-6 w-full max-w-sm
              border-t border-gray-700
            "
            style={{ 
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom))'
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold mb-4">Make Your Prediction</h3>
            
            <div className="space-y-3">
              {prediction.options.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => handlePredictionSubmit(prediction.id, option.id, 75)}
                  className="
                    w-full p-4 rounded-lg border border-gray-600
                    bg-gray-700/50 hover:bg-blue-600/20 hover:border-blue-500
                    text-white transition-colors min-h-[44px]
                  "
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.text}</span>
                    <span className="text-sm text-gray-400">
                      {option.odds > 0 ? '+' : ''}{option.odds}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <MobileLayout
      activeView={activeView}
      onViewChange={onViewChange}
      className={className}
    >
      <div className="p-4 pb-6">
        {/* Stats Card */}
        {renderStatsCard()}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Available Predictions</h2>
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <Zap className="w-4 h-4" />
            <span>Live</span>
          </div>
        </div>

        {/* Predictions List */}
        <div className="space-y-4">
          {predictions.map(renderPredictionCard)}
        </div>

        {/* Empty State */}
        {predictions.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No Predictions Available</h3>
            <p className="text-gray-500">Check back soon for new Oracle predictions!</p>
          </motion.div>
        )}
      </div>

      {/* Prediction Modal */}
      {selectedPrediction && renderPredictionModal()}
    </MobileLayout>
  );
};

export default EnhancedMobileOracleInterface;
