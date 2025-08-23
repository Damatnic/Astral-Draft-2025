/**
 * Advanced Ensemble ML Dashboard Component
 * Displays sophisticated ensemble machine learning predictions with detailed analysis
 */

import React, { useState, useEffect } from 'react';
import oracleEnsembleMachineLearningService, { 
    EnsemblePredictionDetail,
    FeatureVector 
} from '../../services/oracleEnsembleMachineLearningService';

interface Props {
    playerId?: string;
    onPredictionGenerated?: (prediction: EnsemblePredictionDetail) => void;
}

const AdvancedEnsembleMLDashboard: React.FC<Props> = ({ 
    playerId, 
    onPredictionGenerated 
}) => {
    const [prediction, setPrediction] = useState<EnsemblePredictionDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sample feature vector for demonstration
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
            generatePrediction();
        }
    }, [playerId]);

    const generatePrediction = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const features = sampleFeatures;
            const result = await oracleEnsembleMachineLearningService
                .generateEnsemblePrediction(features, 'fantasy_points');
            
            setPrediction(result);
            onPredictionGenerated?.(result);
        } catch (err) {
            setError('Failed to generate ensemble prediction');
            console.error('Ensemble prediction error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderModelPredictions = () => {
        if (!prediction) return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {prediction.modelPredictions.map((model) => (
                    <div key={model.modelId} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-gray-800">{model.modelName}</h4>
                            <span className="text-sm text-gray-600">
                                Weight: {(model.weight * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="mb-2">
                            <div className="text-2xl font-bold text-blue-600">
                                {model.prediction.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600">
                                Confidence: {(model.confidence * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${model.confidence * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderConsensusMetrics = () => {
        if (!prediction) return null;

        const { consensusMetrics } = prediction;

        return (
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">
                    📊 Consensus Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {consensusMetrics.variance.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Variance</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            ±{consensusMetrics.standardDeviation.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">Std Deviation</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {(consensusMetrics.agreementScore * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Agreement</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-medium text-blue-600">
                            [{consensusMetrics.confidenceInterval[0].toFixed(1)}, 
                             {consensusMetrics.confidenceInterval[1].toFixed(1)}]
                        </div>
                        <div className="text-sm text-gray-600">95% CI</div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFeatureContributions = () => {
        if (!prediction) return null;

        const topFeatures = prediction.featureContributions.slice(0, 8);

        return (
            <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">
                    🎯 Feature Contributions
                </h3>
                <div className="space-y-3">
                    {topFeatures.map((feature) => (
                        <div key={feature.feature} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <span className={`w-3 h-3 rounded-full ${
                                    feature.direction === 'POSITIVE' ? 'bg-green-500' : 'bg-red-500'
                                }`}></span>
                                <span className="text-sm font-medium capitalize">
                                    {feature.feature.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-semibold text-gray-800">
                                    {(feature.importance * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500">
                                    Consensus: {(feature.modelConsensus * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderUncertaintyMetrics = () => {
        if (!prediction) return null;

        const { uncertaintyMetrics } = prediction;

        return (
            <div className="bg-yellow-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                    ⚠️ Uncertainty Analysis
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">
                            {(uncertaintyMetrics.epistemic * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Model Uncertainty</div>
                        <div className="text-xs text-gray-500">How much models disagree</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">
                            {(uncertaintyMetrics.aleatoric * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Data Uncertainty</div>
                        <div className="text-xs text-gray-500">Inherent data noise</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">
                            {(uncertaintyMetrics.total * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Total Uncertainty</div>
                        <div className="text-xs text-gray-500">Combined uncertainty</div>
                    </div>
                </div>
            </div>
        );
    };

    const renderExplanation = () => {
        if (!prediction) return null;

        const { explanability } = prediction;

        return (
            <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">
                    🧠 AI Explanation
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium text-purple-700 mb-2">Primary Drivers</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {explanability.primaryDrivers.map((driver) => (
                                <li key={driver} className="flex items-center space-x-2">
                                    <span className="text-green-500">✓</span>
                                    <span className="capitalize">{driver}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium text-purple-700 mb-2">Risk Factors</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {explanability.riskFactors.map((risk) => (
                                <li key={risk} className="flex items-center space-x-2">
                                    <span className="text-red-500">⚠</span>
                                    <span>{risk}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium text-purple-700 mb-2">Confidence Reasons</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {explanability.confidenceReasons.map((reason) => (
                                <li key={reason} className="flex items-center space-x-2">
                                    <span className="text-blue-500">ℹ</span>
                                    <span>{reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium text-purple-700 mb-2">Important Caveats</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {explanability.caveats.map((caveat) => (
                                <li key={caveat} className="flex items-center space-x-2">
                                    <span className="text-gray-500">•</span>
                                    <span>{caveat}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        🧠 Advanced Ensemble ML
                    </h2>
                    <p className="text-gray-600">
                        Sophisticated machine learning ensemble for enhanced predictions
                    </p>
                </div>
                <button
                    onClick={generatePrediction}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                    {loading ? 'Generating...' : 'Generate Prediction'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="text-red-800">❌ {error}</div>
                </div>
            )}

            {prediction && (
                <div>
                    {/* Main Prediction Display */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium mb-2">Ensemble Prediction</h3>
                                <div className="text-4xl font-bold">
                                    {prediction.prediction.toFixed(1)} pts
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-medium">Confidence</div>
                                <div className="text-3xl font-bold">
                                    {(prediction.confidence * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Model Predictions */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            🤖 Individual Model Predictions
                        </h3>
                        {renderModelPredictions()}
                    </div>

                    {/* Consensus Metrics */}
                    {renderConsensusMetrics()}

                    {/* Feature Contributions */}
                    {renderFeatureContributions()}

                    {/* Uncertainty Analysis */}
                    {renderUncertaintyMetrics()}

                    {/* AI Explanation */}
                    {renderExplanation()}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Training ensemble models...</span>
                </div>
            )}
        </div>
    );
};

export default AdvancedEnsembleMLDashboard;
