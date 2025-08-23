/**
 * Compact Ensemble ML Widget for Oracle Dashboard
 * Displays key ensemble prediction metrics in a compact format
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Widget } from '../ui/Widget';
import oracleEnsembleMachineLearningService, { 
    EnsemblePredictionDetail,
    FeatureVector 
} from '../../services/oracleEnsembleMachineLearningService';

interface Props {
    playerId?: string;
    compact?: boolean;
}

const EnsembleMLWidget: React.FC<Props> = ({ playerId, compact = true }) => {
    const [prediction, setPrediction] = useState<EnsemblePredictionDetail | null>(null);
    const [loading, setLoading] = useState(false);

    // Sample features for demonstration
    const sampleFeatures: FeatureVector = {
        playerRecentPerformance: [18.5, 16.2, 20.1, 14.8, 19.3],
        playerPositionRank: 8,
        playerInjuryRisk: 0.15,
        playerMatchupDifficulty: 0.7,
        playerTargetShare: 0.28,
        teamOffensiveRank: 5,
        teamDefensiveRank: 12,
        teamHomeAdvantage: 0.6,
        teamRecentForm: [1, 1, 0, 1],
        weatherConditions: [72, 0, 8],
        gameImportance: 0.8,
        restDays: 6,
        travelDistance: 1200,
        headToHeadRecord: [0.6],
        seasonalTrends: [0.15],
        venuePerformance: [0.1],
        timeOfSeason: 0.65,
        weekType: 'REGULAR',
        marketConfidence: 0.85
    };

    useEffect(() => {
        if (playerId) {
            generateQuickPrediction();
        }
    }, [playerId]);

    const generateQuickPrediction = async () => {
        setLoading(true);
        try {
            const result = await oracleEnsembleMachineLearningService
                .generateEnsemblePrediction(sampleFeatures, 'fantasy_points');
            setPrediction(result);
        } catch (error) {
            console.error('Failed to generate prediction:', error);
        } finally {
            setLoading(false);
        }
    };

    if (compact) {
        return (
            <Widget title="🧠 AI Ensemble Prediction" className="bg-gradient-to-br from-blue-900/30 to-purple-900/30">
                <div className="space-y-4">
                    {loading && (
                        <div className="flex items-center justify-center py-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                            <span className="ml-2 text-gray-400 text-sm">Computing...</span>
                        </div>
                    )}
                    
                    {!loading && prediction && (
                        <>
                            {/* Main Prediction */}
                            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">Ensemble Prediction</div>
                                        <div className="text-2xl font-bold text-white">
                                            {prediction.prediction.toFixed(1)} pts
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-400 mb-1">Confidence</div>
                                        <div className="text-xl font-bold text-green-400">
                                            {(prediction.confidence * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Model Consensus */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-800/50 rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Model Agreement</div>
                                    <div className="text-lg font-semibold text-blue-400">
                                        {(prediction.consensusMetrics.agreementScore * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {prediction.modelPredictions.length} models
                                    </div>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Uncertainty</div>
                                    <div className="text-lg font-semibold text-yellow-400">
                                        {(prediction.uncertaintyMetrics.total * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        ±{prediction.consensusMetrics.standardDeviation.toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            {/* Top Features */}
                            <div className="space-y-2">
                                <div className="text-sm text-gray-400">Key Factors</div>
                                <div className="flex flex-wrap gap-2">
                                    {prediction.featureContributions.slice(0, 3).map((feature) => (
                                        <div
                                            key={feature.feature}
                                            className="flex items-center space-x-1 bg-gray-800/30 rounded px-2 py-1"
                                        >
                                            <span className={`w-2 h-2 rounded-full ${
                                                feature.direction === 'POSITIVE' ? 'bg-green-400' : 'bg-red-400'
                                            }`}></span>
                                            <span className="text-xs text-gray-300 capitalize">
                                                {feature.feature.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                ({(feature.importance * 100).toFixed(0)}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Action */}
                            <button
                                onClick={generateQuickPrediction}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition-colors"
                            >
                                🔄 Regenerate Prediction
                            </button>
                        </>
                    )}
                    
                    {!loading && !prediction && (
                        <div className="text-center py-6">
                            <div className="text-gray-400 mb-2">🧠 AI Ensemble Ready</div>
                            <button
                                onClick={generateQuickPrediction}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                            >
                                Generate Prediction
                            </button>
                        </div>
                    )}
                </div>
            </Widget>
        );
    }

    // Full widget view (non-compact)
    return (
        <Widget title="🧠 Advanced Ensemble Machine Learning" className="bg-gray-900/50">
            <div className="space-y-6">
                {prediction && (
                    <>
                        {/* Main Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                                    Ensemble Prediction
                                </div>
                                <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                                    {prediction.prediction.toFixed(1)} pts
                                </div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">
                                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                                </div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                <div className="text-green-600 dark:text-green-400 text-sm font-medium">
                                    Model Consensus
                                </div>
                                <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                                    {(prediction.consensusMetrics.agreementScore * 100).toFixed(0)}%
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400">
                                    {prediction.modelPredictions.length} models agree
                                </div>
                            </div>

                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                <div className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                                    Prediction Range
                                </div>
                                <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">
                                    ±{prediction.consensusMetrics.standardDeviation.toFixed(1)}
                                </div>
                                <div className="text-sm text-purple-600 dark:text-purple-400">
                                    95% CI: [{prediction.consensusMetrics.confidenceInterval[0].toFixed(1)}, {prediction.consensusMetrics.confidenceInterval[1].toFixed(1)}]
                                </div>
                            </div>
                        </div>

                        {/* Model Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {prediction.modelPredictions.map((model) => (
                                <motion.div
                                    key={model.modelId}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gray-800/30 rounded-lg p-3"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-300">
                                            {model.modelName}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {(model.weight * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="text-lg font-bold text-white mb-1">
                                        {model.prediction.toFixed(1)}
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                                        <div 
                                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${model.confidence * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {(model.confidence * 100).toFixed(0)}% confident
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}

                <div className="flex space-x-3">
                    <button
                        onClick={generateQuickPrediction}
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                        {loading ? 'Generating...' : '🔄 Generate New Prediction'}
                    </button>
                </div>
            </div>
        </Widget>
    );
};

export default EnsembleMLWidget;
