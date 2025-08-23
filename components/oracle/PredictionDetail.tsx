/**
 * Enhanced Prediction Detail Component
 * Detailed view and interaction for individual predictions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BrainIcon, 
    TrophyIcon, 
    UsersIcon, 
    ClockIcon,
    AlertCircleIcon,
    CheckCircleIcon,
    TrendingUpIcon,
    InfoIcon
} from 'lucide-react';
import { Widget } from '../ui/Widget';
import { LivePrediction } from './PredictionCard';

interface PredictionDetailProps {
    prediction: LivePrediction;
    onSubmit: (predictionId: string, choice: number, confidence: number) => void;
    className?: string;
}

export const PredictionDetail: React.FC<PredictionDetailProps> = ({ 
    prediction, 
    onSubmit,
    className = ''
}) => {
    const [selectedChoice, setSelectedChoice] = useState<number | null>(prediction.userChoice ?? null);
    const [confidence, setConfidence] = useState(prediction.userConfidence ?? 75);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Reset state when prediction changes
    useEffect(() => {
        setSelectedChoice(prediction.userChoice ?? null);
        setConfidence(prediction.userConfidence ?? 75);
        setValidationError(null);
        setIsSubmitting(false);
    }, [prediction.id, prediction.userChoice, prediction.userConfidence]);

    // Check if prediction is expired
    const isExpired = !prediction.timeRemaining || prediction.timeRemaining <= 0;

    // Validate submission
    const validateSubmission = (): boolean => {
        if (selectedChoice === null) {
            setValidationError('Please select a choice');
            return false;
        }
        
        if (confidence < 50 || confidence > 100) {
            setValidationError('Confidence must be between 50% and 100%');
            return false;
        }
        
        if (isExpired) {
            setValidationError('This prediction has expired');
            return false;
        }
        
        setValidationError(null);
        return true;
    };

    const handleSubmit = async () => {
        if (!validateSubmission() || selectedChoice === null) return;
        
        setIsSubmitting(true);
        try {
            onSubmit(prediction.id, selectedChoice, confidence);
        } catch (error) {
            console.error('Failed to submit prediction:', error);
            setValidationError('Failed to submit prediction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format time remaining with urgency
    const formatTimeRemaining = (ms?: number) => {
        if (!ms) return { text: 'Expired', urgent: true };
        
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const urgent = minutes < 15;
        
        if (hours > 0) {
            return { 
                text: `${hours}h ${minutes % 60}m remaining`, 
                urgent: false 
            };
        }
        
        return { 
            text: `${minutes}m remaining`, 
            urgent 
        };
    };

    const timeInfo = formatTimeRemaining(prediction.timeRemaining);

    return (
        <Widget title="Prediction Details" className={`bg-gray-900/50 ${className}`}>
            <div className="space-y-6">
                {/* Question Header */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                        {prediction.question}
                    </h3>
                    
                    {/* Time and participation info */}
                    <div className="flex items-center justify-between text-sm md:text-xs">
                        <div className="flex items-center space-x-2">
                            <ClockIcon className={`w-5 h-5 md:w-4 md:h-4 ${timeInfo.urgent ? 'text-red-400' : 'text-gray-400'}`} />
                            <span className={timeInfo.urgent ? 'text-red-400 font-medium' : 'text-gray-400'}>
                                {timeInfo.text}
                            </span>
                            {timeInfo.urgent && !isExpired && (
                                <motion.span
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="text-red-400"
                                >
                                    ⚡
                                </motion.span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400 text-sm md:text-xs">
                            <UsersIcon className="w-5 h-5 md:w-4 md:h-4" />
                            <span>{prediction.participants || 0} participants</span>
                        </div>
                    </div>
                </div>

                {/* Oracle's Prediction */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-900/30 rounded-lg p-4 border border-blue-800/50"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <BrainIcon className="w-6 h-6 md:w-5 md:h-5 text-blue-400" />
                            <span className="text-sm md:text-xs font-medium text-blue-400">Oracle's Prediction</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm md:text-xs text-gray-400">{prediction.confidence}% confident</span>
                            <div className={`w-3 h-3 md:w-2 md:h-2 rounded-full ${
                                (() => {
                                    if (prediction.confidence >= 80) return 'bg-green-400';
                                    if (prediction.confidence >= 60) return 'bg-yellow-400';
                                    return 'bg-red-400';
                                })()
                            }`} />
                        </div>
                    </div>
                    <div className="text-white font-medium mb-2">
                        {prediction.options[prediction.oracleChoice]?.text || 'Unknown'}
                    </div>
                    {prediction.reasoning && (
                        <div className="text-sm text-gray-300 bg-blue-900/20 rounded-md p-3">
                            <div className="flex items-start space-x-2">
                                <InfoIcon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span>{prediction.reasoning}</span>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* User's Prediction Section */}
                <AnimatePresence mode="wait">
                    {!prediction.isSubmitted && !isExpired && (
                        <motion.div
                            key="prediction-form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <h4 className="font-medium text-white flex items-center space-x-2">
                                <TrendingUpIcon className="w-5 h-5 md:w-4 md:h-4" />
                                <span className="text-base md:text-sm">Your Prediction</span>
                            </h4>
                            
                            {/* Choice Selection */}
                            <div className="space-y-2">
                                {prediction.options.map((option, index) => (
                                    <motion.button
                                        key={option.text}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedChoice(index)}
                                        className={`prediction-option btn-secondary w-full text-left p-4 md:p-3 rounded-lg transition-all border ${
                                            selectedChoice === index 
                                                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25' 
                                                : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-base md:text-sm font-medium">{option.text}</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm md:text-xs opacity-75">
                                                    {(option.probability * 100).toFixed(1)}% likely
                                                </span>
                                                {selectedChoice === index && (
                                                    <CheckCircleIcon className="w-5 h-5 md:w-4 md:h-4 text-white" />
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Confidence Slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="confidence-slider" className="font-medium text-white">
                                        Confidence Level
                                    </label>
                                    <span className={`text-lg font-bold ${
                                        (() => {
                                            if (confidence >= 80) return 'text-green-400';
                                            if (confidence >= 65) return 'text-yellow-400';
                                            return 'text-red-400';
                                        })()
                                    }`}>
                                        {confidence}%
                                    </span>
                                </div>
                                <input
                                    id="confidence-slider"
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={confidence}
                                    onChange={(e: any) => setConfidence(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>50% (Uncertain)</span>
                                    <span>75% (Confident)</span>
                                    <span>100% (Certain)</span>
                                </div>
                            </div>

                            {/* Validation Error */}
                            <AnimatePresence>
                                {validationError && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center space-x-2 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg p-3"
                                    >
                                        <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm">{validationError}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={selectedChoice === null || isSubmitting}
                                className="submit-prediction btn-primary w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 md:py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 md:h-4 md:w-4 border-b-2 border-white" />
                                        <span className="text-base md:text-sm">Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <TrophyIcon className="w-5 h-5 md:w-4 md:h-4" />
                                        <span className="text-base md:text-sm">Submit Prediction</span>
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Submitted State */}
                    {prediction.isSubmitted && (
                        <motion.div
                            key="submitted-state"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-900/30 rounded-lg p-4 border border-green-800/50"
                        >
                            <div className="flex items-center space-x-2 mb-3">
                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                <span className="font-medium text-green-400">Prediction Submitted</span>
                            </div>
                            <div className="text-white font-medium mb-1">
                                {prediction.userChoice !== undefined ? prediction.options[prediction.userChoice]?.text : 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-400">
                                {prediction.userConfidence}% confidence • Submitted successfully
                            </div>
                        </motion.div>
                    )}

                    {/* Expired State */}
                    {isExpired && !prediction.isSubmitted && (
                        <motion.div
                            key="expired-state"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-900/30 rounded-lg p-4 border border-red-800/50 text-center"
                        >
                            <ClockIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                            <div className="font-medium text-red-400 mb-1">Prediction Expired</div>
                            <div className="text-sm text-gray-400">
                                This prediction is no longer accepting submissions
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Community Consensus */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-900/30 rounded-lg p-4 border border-purple-800/50"
                >
                    <div className="flex items-center space-x-2 mb-3">
                        <UsersIcon className="w-5 h-5 text-purple-400" />
                        <span className="font-medium text-purple-400">Community Consensus</span>
                    </div>
                    <div className="text-white font-medium mb-1">
                        {prediction.options[prediction.consensusChoice || 0]?.text}
                    </div>
                    <div className="text-sm text-gray-400">
                        {prediction.consensusConfidence || 0}% average confidence • {prediction.participants || 0} participants
                    </div>
                    
                    {/* Agreement indicator */}
                    {prediction.userChoice !== undefined && (
                        <div className="mt-3 pt-3 border-t border-purple-800/50">
                            {prediction.userChoice === prediction.consensusChoice ? (
                                <div className="flex items-center space-x-2 text-green-400">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    <span className="text-sm">You agree with the community</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2 text-yellow-400">
                                    <TrendingUpIcon className="w-4 h-4" />
                                    <span className="text-sm">You have a different prediction</span>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </Widget>
    );
};

export default PredictionDetail;
