/**
 * Optimized Oracle Real-Time Prediction Interface
 * Enhanced version with performance optimizations for large datasets and real-time interactions
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { Widget } from '../ui/Widget';
import { ZapIcon } from '../icons/ZapIcon';
import { oracleApiClient } from '../../services/oracleApiClient';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { 
    useOracleSearch,
    useThrottledOracleUpdates,
    useVirtualizedPredictionList,
    useCachedOracleData,
    useOptimizedPredictionSubmission,
    useOraclePerformanceMonitoring,
    useMemoryEfficientState
} from '../../hooks/useOraclePerformanceOptimization';
import oraclePerformanceOptimizationService, { VirtualScrollItem } from '../../services/oraclePerformanceOptimizationService';

// Memoized components for better performance
const MemoizedPredictionCard = memo(({ prediction, isSelected, onSelect, onSubmit }: {
    prediction: any;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onSubmit: (id: string, choice: number, confidence: number) => void;
}) => {
    const handleSubmit = useCallback((choice: number, confidence: number) => {
        onSubmit(prediction.id, choice, confidence);
    }, [prediction.id, onSubmit]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            onClick={() => onSelect(prediction.id)}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-5">
                        {prediction.question}
                    </h4>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                        <span>Week {prediction.week}</span>
                        <span>•</span>
                        <span className="capitalize">{prediction.type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{prediction.participants} participants</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                    <div className="text-right">
                        <div className="text-xs text-gray-500">Oracle Confidence</div>
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {Math.round(prediction.oracleConfidence)}%
                        </div>
                    </div>
                </div>
            </div>

            {isSelected && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3"
                >
                    <PredictionSubmissionForm prediction={prediction} onSubmit={handleSubmit} />
                </motion.div>
            )}
        </motion.div>
    );
});

// Memoized prediction submission form
const PredictionSubmissionForm = memo(({ prediction, onSubmit }: {
    prediction: any;
    onSubmit: (choice: number, confidence: number) => void;
}) => {
    const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
    const [confidence, setConfidence] = useState(75);

    const handleSubmit = useCallback(() => {
        if (selectedChoice !== null) {
            onSubmit(selectedChoice, confidence);
        }
    }, [selectedChoice, confidence, onSubmit]);

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Prediction
                </label>
                <div className="space-y-2">
                    {prediction.choices.map((choice: string, index: number) => (
                        <button
                            key={index}
                            onClick={() => setSelectedChoice(index)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                selectedChoice === index
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {choice}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confidence: {confidence}%
                </label>
                <input
                    type="range"
                    min="50"
                    max="100"
                    value={confidence}
                    onChange={(e: any) => setConfidence(Number(e.target.value))}
                    className="w-full"
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={selectedChoice === null}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
                Submit Prediction
            </button>
        </div>
    );
});

// Virtualized prediction list component
const VirtualizedPredictionList = memo(({ 
    predictions, 
    selectedPrediction, 
    onSelectPrediction,
    onSubmitPrediction,
    containerHeight = 400 
}: {
    predictions: any[];
    selectedPrediction: string | null;
    onSelectPrediction: (id: string) => void;
    onSubmitPrediction: (id: string, choice: number, confidence: number) => void;
    containerHeight?: number;
}) => {
    // Convert predictions to virtual scroll items
    const virtualItems: VirtualScrollItem[] = useMemo(() => 
        predictions.map((prediction: any) => ({
            id: prediction.id,
            height: selectedPrediction === prediction.id ? 200 : 120, // Expanded height when selected
            data: prediction
        })),
        [predictions, selectedPrediction]
    );

    const { virtualState, handleScroll } = useVirtualizedPredictionList(
        virtualItems, 
        containerHeight
    );

    return (
        <div 
            className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg"
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div style={{ height: virtualState.totalHeight, position: 'relative' }}>
                {virtualState.visibleItems.map((item, index) => (
                    <div
                        key={item.id}
                        style={{
                            position: 'absolute',
                            top: (virtualState.startIndex + index) * 120,
                            left: 0,
                            right: 0,
                            height: item.height || 120
                        }}
                        className="px-4 py-2"
                    >
                        <MemoizedPredictionCard
                            prediction={item.data}
                            isSelected={selectedPrediction === item.id}
                            onSelect={onSelectPrediction}
                            onSubmit={onSubmitPrediction}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
});

// Main optimized interface component
const OptimizedOracleRealTimePredictionInterface: React.FC<{
    week?: number;
    className?: string;
}> = ({ week = 1, className = '' }) => {
    const { user } = useAuth();
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    // Performance monitoring
    const { metrics, startRenderMeasurement, endRenderMeasurement } = useOraclePerformanceMonitoring();
    
    // Optimized search
    const { query, debouncedQuery, isSearching, setQuery } = useOracleSearch();
    
    // Throttled real-time updates
    const { updates, addUpdate } = useThrottledOracleUpdates();
    
    // Memory-efficient state management
    const [selectedPrediction, setSelectedPrediction] = useMemoryEfficientState<string | null>(null);
    const [activeView, setActiveView] = useMemoryEfficientState<'predictions' | 'analytics'>('predictions');
    
    // Optimized prediction submission
    const { isSubmitting, submissionError, submitPrediction } = useOptimizedPredictionSubmission();
    
    // Cached predictions data
    const { 
        data: predictions, 
        loading: predictionsLoading, 
        error: predictionsError,
        refetch: refetchPredictions 
    } = useCachedOracleData(
        `predictions-week-${week}`,
        () => oracleApiClient.getWeeklyPredictions(week),
        'prediction'
    );
    
    // Cached user stats
    const { 
        data: userStats, 
        loading: statsLoading 
    } = useCachedOracleData(
        `user-stats-${user?.id}`,
        () => oracleApiClient.getUserStats(parseInt(user?.id || '0')),
        'userStats'
    );

    // Performance measurement effect
    useEffect(() => {
        startRenderMeasurement();
        return () => {
            endRenderMeasurement();
        };
    });

    // Handle prediction selection
    const handleSelectPrediction = useCallback((predictionId: string) => {
        setSelectedPrediction(selectedPrediction === predictionId ? null : predictionId);
    }, [selectedPrediction, setSelectedPrediction]);

    // Handle prediction submission with optimization
    const handleSubmitPrediction = useCallback(async (
        predictionId: string, 
        choice: number, 
        confidence: number
    ) => {
        try {
            await submitPrediction(() => 
                oracleApiClient.submitPrediction(predictionId, choice, confidence)
            );
            
            // Add real-time update
            addUpdate({
                id: `submission-${Date.now()}`,
                type: 'USER_PREDICTION_SUBMITTED',
                message: `Prediction submitted with ${confidence}% confidence`,
                timestamp: new Date().toISOString()
            });
            
            // Refresh predictions
            refetchPredictions();
            
            // Clear selection
            setSelectedPrediction(null);
        } catch (error) {
            console.error('Prediction submission failed:', error);
        }
    }, [submitPrediction, addUpdate, refetchPredictions, setSelectedPrediction]);

    // Filter predictions based on search
    const filteredPredictions = useMemo(() => {
        if (!predictions?.data || !debouncedQuery) return predictions?.data || [];
        
        return predictions.data.filter((prediction: any) =>
            prediction.question.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            prediction.type.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
    }, [predictions, debouncedQuery]);

    // Loading state
    if (predictionsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading predictions...</span>
            </div>
        );
    }

    // Error state
    if (predictionsError) {
        return (
            <div className="text-center py-8">
                <div className="text-red-600 mb-4">Failed to load predictions</div>
                <button 
                    onClick={() => refetchPredictions()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={`optimized-oracle-interface ${className}`}>
            {/* Performance metrics (development only) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    <div>Renders: {metrics.renderCount} | Avg: {metrics.averageRenderTime.toFixed(2)}ms</div>
                    <div>Cache Hit Rate: {metrics.cacheHitRate.toFixed(1)}% | Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
                </div>
            )}

            {/* Header with search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center space-x-3">
                    <ZapIcon className="w-6 h-6 text-blue-600" />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Oracle Predictions
                    </h1>
                    <span className="text-sm text-gray-500">Week {week}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search predictions..."
                            value={query}
                            onChange={(e: any) => setQuery(e.target.value)}
                            className="w-64 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {isSearching && (
                            <div className="absolute right-2 top-2">
                                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={() => setActiveView(activeView === 'predictions' ? 'analytics' : 'predictions')}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        {activeView === 'predictions' ? 'Analytics' : 'Predictions'}
                    </button>
                </div>
            </div>

            {/* Real-time updates */}
            {updates.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Recent Updates
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                        {updates.slice(-3).map((update, index) => (
                            <div key={index} className="text-xs text-blue-700 dark:text-blue-300">
                                {update.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submission error */}
            {submissionError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-sm text-red-700 dark:text-red-300">
                        {submissionError}
                    </div>
                </div>
            )}

            {/* Main content */}
            <AnimatePresence mode="wait">
                {activeView === 'predictions' ? (
                    <motion.div
                        key="predictions"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {/* User stats widget */}
                        {userStats?.data && !statsLoading && (
                            <Widget title="Your Performance" className="mb-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-blue-600">{userStats.data.totalPredictions}</div>
                                        <div className="text-sm text-gray-500">Total</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">{userStats.data.correctPredictions}</div>
                                        <div className="text-sm text-gray-500">Correct</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-purple-600">{userStats.data.accuracy.toFixed(1)}%</div>
                                        <div className="text-sm text-gray-500">Accuracy</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-orange-600">{userStats.data.currentStreak}</div>
                                        <div className="text-sm text-gray-500">Streak</div>
                                    </div>
                                </div>
                            </Widget>
                        )}

                        {/* Virtualized predictions list */}
                        <VirtualizedPredictionList
                            predictions={filteredPredictions}
                            selectedPrediction={selectedPrediction}
                            onSelectPrediction={handleSelectPrediction}
                            onSubmitPrediction={handleSubmitPrediction}
                            containerHeight={isMobile ? 300 : 500}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Analytics placeholder - would load optimized analytics component */}
                        <div className="text-center py-8">
                            <div className="text-gray-600 dark:text-gray-400">
                                Analytics view with optimized performance
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading overlay for submissions */}
            {isSubmitting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-700 dark:text-gray-300">Submitting prediction...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(OptimizedOracleRealTimePredictionInterface);
