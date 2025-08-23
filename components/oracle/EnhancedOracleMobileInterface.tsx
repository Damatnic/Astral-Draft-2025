/**
 * Enhanced Oracle Mobile Responsive Interface
 * Comprehensive mobile optimization for Oracle prediction interface
 * Features responsive design, touch interactions, and mobile-first UX
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { Widget } from '../ui/Widget';
import { ZapIcon } from '../icons/ZapIcon';
import { oracleApiClient } from '../../services/oracleApiClient';
import { PredictionResponse } from '../../services/oracleApiClient';
import { useOracleWebSocket, OracleWebSocketMessage } from '../../hooks/useOracleWebSocket';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useOracleNotifications } from '../../hooks/useOracleNotifications';
import { oracleMobileService } from '../../services/oracleMobileService';
import { 
    BarChart3, 
    Target, 
    Settings, 
    Menu, 
    X, 
    ChevronLeft, 
    ChevronRight,
    TrendingUp,
    Users,
    Clock,
    Zap,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

import UserStatsWidget, { UserStats } from './UserStatsWidget';
import RealtimeUpdatesWidget, { RealtimeUpdate } from './RealtimeUpdatesWidget';
import PredictionCard, { LivePrediction } from './PredictionCard';
import PredictionDetail from './PredictionDetail';
import OracleErrorBoundary from './OracleErrorBoundary';
import { OracleAnalyticsDashboard } from '../analytics/OracleAnalyticsDashboard';
import { NotificationCenter } from './NotificationCenter';
import { NotificationPreferencesComponent } from './NotificationPreferences';

interface Props {
    week?: number;
    className?: string;
}

interface MobileTouchState {
    startX: number;
    startY: number;
    startTime: number;
}

const EnhancedOracleMobileInterface: React.FC<Props> = ({ 
    week = 1, 
    className = '' 
}) => {
    const { user, isAuthenticated } = useAuth();
    
    // Media queries for responsive design
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
    
    // Mobile-specific state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [touchState, setTouchState] = useState<MobileTouchState | null>(null);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const [showMobileFAB, setShowMobileFAB] = useState(true);
    
    // Core State
    const [predictions, setPredictions] = useState<LivePrediction[]>([]);
    const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'predictions' | 'analytics' | 'stats'>('predictions');
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);
    
    // Real-time State
    const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeUpdate[]>([]);
    const [userStats, setUserStats] = useState<UserStats>({
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        streak: 0,
        rank: 0
    });

    // Notification system (only keeping used function)
    const {
        notifyAccuracyUpdate
    } = useOracleNotifications();

    // Initialize mobile features
    useEffect(() => {
        if (isMobile) {
            // Setup viewport for mobile
            const viewport = document.querySelector('meta[name=viewport]') || document.createElement('meta');
            viewport.setAttribute('name', 'viewport');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
            if (!document.querySelector('meta[name=viewport]')) {
                document.head.appendChild(viewport);
            }
        }
    }, [isMobile]);

    // Mobile touch handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!isMobile) return;
        
        const touch = e.touches[0];
        setTouchState({
            startX: touch.clientX,
            startY: touch.clientY,
            startTime: Date.now()
        });
        
        // Setup long press detection
        const longPressTimer = setTimeout(() => {
            oracleMobileService.vibrate([50]); // Haptic feedback
        }, 500);
        
        // Clear timer on touch end
        const clearTimer = () => {
            clearTimeout(longPressTimer);
        };
        
        e.currentTarget.addEventListener('touchend', clearTimer, { once: true });
        e.currentTarget.addEventListener('touchcancel', clearTimer, { once: true });
    }, [isMobile]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!touchState || !isMobile) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchState.startX;
        const deltaY = touch.clientY - touchState.startY;
        const deltaTime = Date.now() - touchState.startTime;
        
        const minSwipeDistance = 80;
        const maxSwipeTime = 300;
        
        // Detect swipe gestures
        if (Math.abs(deltaX) > Math.abs(deltaY) && 
            Math.abs(deltaX) > minSwipeDistance && 
            deltaTime < maxSwipeTime) {
            
            const direction = deltaX > 0 ? 'right' : 'left';
            setSwipeDirection(direction);
            
            // Handle swipe navigation
            if (direction === 'left' && activeView === 'predictions') {
                setActiveView('analytics');
            } else if (direction === 'right' && activeView === 'analytics') {
                setActiveView('predictions');
            }
            
            oracleMobileService.vibrate([25]); // Light haptic feedback
            
            // Clear swipe direction after animation
            setTimeout(() => setSwipeDirection(null), 300);
        }
        
        setTouchState(null);
    }, [touchState, isMobile, activeView]);

    // Mobile scroll detection for FAB hiding
    useEffect(() => {
        if (!isMobile) return;
        
        let lastScrollY = window.scrollY;
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    setShowMobileFAB(currentScrollY < lastScrollY || currentScrollY < 100);
                    lastScrollY = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isMobile]);

    // Helper functions (moved before usage in dependencies)
    const updatePrediction = useCallback((updatedPrediction: LivePrediction) => {
        setPredictions(prev => 
            prev.map((p: any) => p.id === updatedPrediction.id ? updatedPrediction : p)
        );
    }, []);

    const addRealtimeUpdate = useCallback((update: RealtimeUpdate) => {
        setRealtimeUpdates(prev => [update, ...prev.slice(0, 9)]);
    }, []);

    // WebSocket message handler
    const handleWebSocketMessage = useCallback((message: any) => {
        switch (message.type) {
            case 'PREDICTION_UPDATE':
                updatePrediction(message.data);
                addRealtimeUpdate({
                    id: Date.now().toString(),
                    type: 'PREDICTION_UPDATE',
                    message: `Updated ${message.data.playerName} prediction`,
                    timestamp: new Date().toISOString()
                });
                break;
            case 'ACCURACY_UPDATE':
                if (user?.id) {
                    setUserStats(prev => ({ ...prev, accuracy: message.data.accuracy }));
                    notifyAccuracyUpdate(message.data.accuracy, message.data.previousAccuracy || 0);
                }
                break;
        }
    }, [user?.id, notifyAccuracyUpdate, updatePrediction, addRealtimeUpdate]);

    // WebSocket connection
    const { connectionStatus } = useOracleWebSocket({
        userId: user?.id || '',
        week,
        onMessage: handleWebSocketMessage
    });

    // Load predictions
    useEffect(() => {
        loadPredictions();
    }, [week]);

    const loadPredictions = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await oracleApiClient.getWeeklyPredictions(week);
            
            // Transform PredictionResponse[] to LivePrediction[]
            const livePredictions: LivePrediction[] = response.data.map((p: PredictionResponse) => ({
                id: p.id,
                question: p.question,
                options: p.options.map((opt: string, idx: number) => ({
                    text: opt,
                    probability: 0.5 // Default probability
                })),
                oracleChoice: p.oracleChoice,
                confidence: p.oracleConfidence, // Map oracleConfidence to confidence
                reasoning: p.oracleReasoning,
                participants: p.participantsCount,
                timeRemaining: p.expiresAt ? new Date(p.expiresAt).getTime() - Date.now() : undefined,
                consensusChoice: p.consensusChoice,
                consensusConfidence: p.consensusConfidence,
                userChoice: p.userSubmission?.choice,
                userConfidence: p.userSubmission?.confidence,
                isSubmitted: !!p.userSubmission
            }));
            
            setPredictions(livePredictions);
            
            // Note: userStats would need to be fetched separately or the API response structure needs to be updated
            // For now, we'll skip setting userStats from this response since it's not part of WeeklyPredictionsResponse
            
        } catch (err) {
            console.error('Failed to load predictions:', err);
            setError('Failed to load Oracle predictions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Mobile navigation component
    const MobileBottomNav = () => (
        <motion.div 
            className="fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700 z-50 safe-area-pb"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="flex items-center justify-around py-2 px-4">
                <button
                    onClick={() => setActiveView('predictions')}
                    className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                        activeView === 'predictions' 
                            ? 'text-blue-400 bg-blue-400/10' 
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Target className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Predictions</span>
                </button>
                
                <button
                    onClick={() => setActiveView('stats')}
                    className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                        activeView === 'stats' 
                            ? 'text-green-400 bg-green-400/10' 
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <TrendingUp className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Stats</span>
                </button>
                
                <button
                    onClick={() => setActiveView('analytics')}
                    className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                        activeView === 'analytics' 
                            ? 'text-purple-400 bg-purple-400/10' 
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <BarChart3 className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Analytics</span>
                </button>
                
                <button
                    onClick={() => setShowNotificationSettings(true)}
                    className="flex flex-col items-center py-2 px-4 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <Settings className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Settings</span>
                </button>
            </div>
        </motion.div>
    );

    // Floating Action Button for mobile
    const MobileFAB = () => (
        <AnimatePresence>
            {showMobileFAB && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-40 flex items-center justify-center safe-area-br"
                >
                    <Zap className="w-6 h-6" />
                </motion.button>
            )}
        </AnimatePresence>
    );

    // Mobile quick actions menu
    const MobileQuickMenu = () => (
        <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50 flex items-end"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full bg-gray-800 rounded-t-3xl p-6 safe-area-pb"
                        onClick={(e: any) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6"></div>
                        
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                            
                            <button
                                onClick={() => {
                                    loadPredictions();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 p-4 bg-gray-700 rounded-xl text-left hover:bg-gray-600 transition-colors"
                            >
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Refresh Predictions</p>
                                    <p className="text-gray-400 text-sm">Get latest Oracle predictions</p>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => {
                                    setActiveView('analytics');
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 p-4 bg-gray-700 rounded-xl text-left hover:bg-gray-600 transition-colors"
                            >
                                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">View Analytics</p>
                                    <p className="text-gray-400 text-sm">Check your performance</p>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => {
                                    setShowNotificationSettings(true);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 p-4 bg-gray-700 rounded-xl text-left hover:bg-gray-600 transition-colors"
                            >
                                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Notification Settings</p>
                                    <p className="text-gray-400 text-sm">Manage your alerts</p>
                                </div>
                            </button>
                        </div>
                        
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full mt-6 py-3 bg-gray-700 rounded-xl text-white font-medium hover:bg-gray-600 transition-colors"
                        >
                            Close
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Mobile swipe indicators
    const MobileSwipeIndicators = () => (
        <div className="flex justify-center space-x-2 py-2">
            <div className={`w-2 h-2 rounded-full transition-colors ${
                activeView === 'predictions' ? 'bg-blue-400' : 'bg-gray-600'
            }`}></div>
            <div className={`w-2 h-2 rounded-full transition-colors ${
                activeView === 'stats' ? 'bg-green-400' : 'bg-gray-600'
            }`}></div>
            <div className={`w-2 h-2 rounded-full transition-colors ${
                activeView === 'analytics' ? 'bg-purple-400' : 'bg-gray-600'
            }`}></div>
        </div>
    );

    // Connection status for mobile
    const MobileConnectionStatus = () => (
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-400' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-sm text-gray-300">
                    {connectionStatus === 'connected' ? 'Live' : 
                     connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                </span>
            </div>
            
            {predictions.length > 0 && (
                <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">
                        {predictions.reduce((total, p) => total + (p.participants || 0), 0)} active
                    </span>
                </div>
            )}
        </div>
    );

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-center">
                    <ZapIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">Oracle Access Required</h2>
                    <p className="text-gray-400">Please sign in to access Oracle predictions</p>
                </div>
            </div>
        );
    }

    return (
        <OracleErrorBoundary>
            <div 
                className={`w-full ${isMobile ? 'pb-20' : ''} ${className}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Mobile Header */}
                {isMobile && (
                    <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 z-40 p-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                                <ZapIcon className="w-6 h-6 text-blue-400" />
                                <span>Oracle</span>
                            </h1>
                            
                            <div className="flex items-center space-x-3">
                                <NotificationCenter className="relative" />
                                <div className="text-right">
                                    <p className="text-sm text-white font-medium">{userStats.accuracy.toFixed(1)}%</p>
                                    <p className="text-xs text-gray-400">Accuracy</p>
                                </div>
                            </div>
                        </div>
                        
                        <MobileSwipeIndicators />
                        <MobileConnectionStatus />
                    </div>
                )}

                {/* Main Content with Swipe Navigation */}
                <div className="relative overflow-hidden">
                    <motion.div
                        key={activeView}
                        initial={{ x: swipeDirection === 'left' ? 300 : swipeDirection === 'right' ? -300 : 0, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: swipeDirection === 'left' ? -300 : 300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full"
                    >
                        {activeView === 'predictions' && (
                            <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-6'}`}>
                                {/* Mobile Tips */}
                                {isMobile && (
                                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
                                        <p className="text-sm text-blue-200 flex items-center space-x-2">
                                            <Zap className="w-4 h-4" />
                                            <span>Swipe left/right to navigate • Long press for quick actions</span>
                                        </p>
                                    </div>
                                )}

                                {/* Error State */}
                                {error && (
                                    <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 flex items-start space-x-3">
                                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-red-200 font-medium">Error Loading Predictions</p>
                                            <p className="text-red-300/70 text-sm mt-1">{error}</p>
                                            <button
                                                onClick={loadPredictions}
                                                className="mt-2 text-sm text-red-200 hover:text-white underline"
                                            >
                                                Try Again
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Loading State */}
                                {loading && (
                                    <div className="space-y-4">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
                                                <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                                                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Predictions Grid */}
                                {!loading && predictions.length > 0 && (
                                    <div className={`grid gap-4 ${
                                        isMobile ? 'grid-cols-1' : 
                                        isTablet ? 'grid-cols-1 lg:grid-cols-2' : 
                                        'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                                    }`}>
                                        {predictions.map((prediction) => (
                                            <PredictionCard
                                                key={prediction.id}
                                                prediction={prediction}
                                                onClick={() => setSelectedPrediction(prediction.id)}
                                                isSelected={selectedPrediction === prediction.id}
                                                className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Empty State */}
                                {!loading && predictions.length === 0 && !error && (
                                    <div className="text-center py-12">
                                        <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-300 mb-2">No Predictions Available</h3>
                                        <p className="text-gray-500 mb-6">Check back later for new Oracle predictions</p>
                                        <button
                                            onClick={loadPredictions}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeView === 'stats' && (
                            <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-6'}`}>
                                <UserStatsWidget 
                                    stats={userStats} 
                                    className="w-full"
                                />
                                <RealtimeUpdatesWidget
                                    updates={realtimeUpdates}
                                    className="w-full"
                                />
                            </div>
                        )}

                        {activeView === 'analytics' && (
                            <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                                <OracleAnalyticsDashboard />
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Selected Prediction Detail Modal */}
                <AnimatePresence>
                    {selectedPrediction && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                            onClick={() => setSelectedPrediction(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className={`bg-gray-800 rounded-xl max-h-[90vh] overflow-y-auto ${
                                    isMobile ? 'w-full max-w-sm' : 'w-full max-w-2xl'
                                }`}
                                onClick={(e: any) => e.stopPropagation()}
                            >
                                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white">Oracle Prediction</h3>
                                        <button
                                            onClick={() => setSelectedPrediction(null)}
                                            className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                {predictions.find((p: any) => p.id === selectedPrediction) && (
                                    <PredictionDetail
                                        prediction={predictions.find((p: any) => p.id === selectedPrediction)!}
                                        onSubmit={async (predictionId, choice, confidence) => {
                                            try {
                                                await oracleApiClient.submitPrediction(predictionId, choice, confidence, user?.id);
                                                setSelectedPrediction(null);
                                                loadPredictions();
                                                
                                                // Mobile success feedback
                                                if (isMobile) {
                                                    oracleMobileService.vibrate([50, 50, 50]);
                                                }
                                            } catch (error) {
                                                console.error('Failed to submit prediction:', error);
                                            }
                                        }}
                                        className="p-6"
                                    />
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notification Settings Modal */}
                <AnimatePresence>
                    {showNotificationSettings && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                            onClick={() => setShowNotificationSettings(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className={`bg-gray-800 rounded-xl max-h-[90vh] overflow-y-auto ${
                                    isMobile ? 'w-full max-w-sm' : 'w-full max-w-lg'
                                }`}
                                onClick={(e: any) => e.stopPropagation()}
                            >
                                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
                                        <button
                                            onClick={() => setShowNotificationSettings(false)}
                                            className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <NotificationPreferencesComponent
                                    className="p-6"
                                    onClose={() => setShowNotificationSettings(false)}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile-specific UI components */}
                {isMobile && (
                    <>
                        <MobileBottomNav />
                        <MobileFAB />
                        <MobileQuickMenu />
                    </>
                )}
            </div>
        </OracleErrorBoundary>
    );
};

export default EnhancedOracleMobileInterface;
