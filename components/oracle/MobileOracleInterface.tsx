/**
 * Mobile Oracle Interface
 * Mobile-optimized Oracle prediction interface with touch interactions
 * Designed for mobile-first experience with responsive design
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { ZapIcon } from '../icons/ZapIcon';
import { TrophyIcon } from '../icons/TrophyIcon';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon } from 'lucide-react';
import { oracleMobileService, type MobileOracleChallenge, type MobileNotificationConfig } from '../../services/oracleMobileService';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface MobileOracleInterfaceProps {
    week: number;
    onSubmitPrediction: (challengeId: string, optionIndex: number) => void;
    onViewAnalytics: () => void;
    onViewRewards: () => void;
}

interface SwipeDirection {
    deltaX: number;
    deltaY: number;
}

const MobileOracleInterface: React.FC<MobileOracleInterfaceProps> = ({
    week,
    onSubmitPrediction,
    onViewAnalytics,
    onViewRewards
}) => {
    const [challenges, setChallenges] = React.useState<MobileOracleChallenge[]>([]);
    const [currentChallengeIndex, setCurrentChallengeIndex] = React.useState(0);
    const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [notificationConfig, setNotificationConfig] = React.useState<MobileNotificationConfig | null>(null);
    const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
    
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTouch = useMediaQuery('(pointer: coarse)');

    // Load challenges and setup mobile service
    React.useEffect(() => {
        const loadChallenges = async () => {
            const mobileChallenges = await oracleMobileService.getMobileChallenges(week);
            setChallenges(mobileChallenges);
        };

        loadChallenges();
        setNotificationConfig(oracleMobileService.getNotificationConfig());
        setShowInstallPrompt(oracleMobileService.isInstallable() && !oracleMobileService.isInstalled());

        // Setup custom event listeners for mobile navigation
        const handleOracleNavigate = (event: CustomEvent) => {
            if (event.detail.direction === 'next') {
                handleNextChallenge();
            } else if (event.detail.direction === 'previous') {
                handlePreviousChallenge();
            }
        };

        const handleQuickSubmit = () => {
            if (selectedOption !== null) {
                handleSubmitPrediction();
            }
        };

        document.addEventListener('oracle-navigate', handleOracleNavigate as EventListener);
        document.addEventListener('oracle-quick-submit', handleQuickSubmit);

        return () => {
            document.removeEventListener('oracle-navigate', handleOracleNavigate as EventListener);
            document.removeEventListener('oracle-quick-submit', handleQuickSubmit);
        };
    }, [week, selectedOption]);

    const currentChallenge = challenges[currentChallengeIndex];

    const handleNextChallenge = () => {
        setCurrentChallengeIndex(prev => Math.min(prev + 1, challenges.length - 1));
        setSelectedOption(null);
    };

    const handlePreviousChallenge = () => {
        setCurrentChallengeIndex(prev => Math.max(prev - 1, 0));
        setSelectedOption(null);
    };

    const handleSubmitPrediction = async () => {
        if (!currentChallenge || selectedOption === null) return;

        setIsSubmitting(true);
        try {
            onSubmitPrediction(currentChallenge.id, selectedOption);
            
            // Show haptic feedback
            oracleMobileService.vibrate([50, 100, 50]);
            
            // Auto-advance to next challenge
            setTimeout(() => {
                if (currentChallengeIndex < challenges.length - 1) {
                    handleNextChallenge();
                }
            }, 1000);
        } catch (error) {
            console.error('Failed to submit prediction:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        });
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;

        const deltaX = e.changedTouches[0].clientX - touchStart.x;
        const deltaY = e.changedTouches[0].clientY - touchStart.y;
        const minSwipeDistance = 50;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                handlePreviousChallenge();
            } else {
                handleNextChallenge();
            }
            oracleMobileService.vibrate([25]); // Light haptic feedback
        }

        setTouchStart(null);
    };

    const handleInstallPWA = async () => {
        const installed = await oracleMobileService.promptInstall();
        if (installed) {
            setShowInstallPrompt(false);
        }
    };

    const handleEnableNotifications = async () => {
        const granted = await oracleMobileService.requestNotificationPermission();
        if (granted) {
            setNotificationConfig(oracleMobileService.getNotificationConfig());
        }
    };

    const formatTimeRemaining = (milliseconds: number): string => {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const getDifficultyColor = (difficulty: string): string => {
        switch (difficulty) {
            case 'easy': return 'text-green-400 bg-green-500/20';
            case 'medium': return 'text-yellow-400 bg-yellow-500/20';
            case 'hard': return 'text-red-400 bg-red-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    if (!currentChallenge) {
        return (
            <Widget title="Oracle Challenges" icon={<ZapIcon />}>
                <div className="p-6 text-center">
                    <div className="text-gray-400 mb-4">🔮</div>
                    <p className="text-gray-400">No challenges available for Week {week}</p>
                </div>
            </Widget>
        );
    }

    return (
        <div className="space-y-4">
            {/* Install PWA Prompt */}
            <AnimatePresence>
                {showInstallPrompt && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-lg p-3"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-blue-300">Install Oracle App</p>
                                <p className="text-xs text-gray-400">Get offline access and push notifications</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowInstallPrompt(false)}
                                    className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={handleInstallPWA}
                                    className="px-3 py-1 text-xs font-bold bg-blue-500 text-white rounded-md hover:bg-blue-400"
                                >
                                    Install
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification Settings */}
            <AnimatePresence>
                {notificationConfig && !notificationConfig.enabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-lg p-3"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-yellow-300">Enable Notifications</p>
                                <p className="text-xs text-gray-400">Get alerts for new challenges and results</p>
                            </div>
                            <button
                                onClick={handleEnableNotifications}
                                className="px-3 py-1 text-xs font-bold bg-yellow-500 text-black rounded-md hover:bg-yellow-400"
                            >
                                Enable
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Challenge Interface */}
            <Widget title="Oracle Challenges" icon={<ZapIcon />} className="oracle-challenge-card">
                <div
                    className="relative overflow-hidden"
                    onTouchStart={isTouch ? handleTouchStart : undefined}
                    onTouchEnd={isTouch ? handleTouchEnd : undefined}
                >
                    {/* Challenge Header */}
                    <div className="p-4 border-b border-gray-700/50">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`px-2 py-1 rounded-full text-xs font-bold ${getDifficultyColor(currentChallenge.difficulty)}`}>
                                    {currentChallenge.difficulty.toUpperCase()}
                                </div>
                                {currentChallenge.isUrgent && (
                                    <div className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 animate-pulse">
                                        ⚡ URGENT
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <ClockIcon className="w-3 h-3" />
                                {formatTimeRemaining(currentChallenge.timeRemaining)}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <TrophyIcon className="w-3 h-3" />
                                {currentChallenge.pointsAvailable} pts
                            </div>
                            <div className="text-xs text-gray-400">
                                {currentChallengeIndex + 1} of {challenges.length}
                            </div>
                        </div>
                    </div>

                    {/* Challenge Question */}
                    <div className="p-4">
                        <h3 className="text-lg font-bold text-white mb-4 leading-tight">
                            {currentChallenge.question}
                        </h3>

                        {/* Options */}
                        <div className="space-y-3">
                            {currentChallenge.options.map((option, index) => (
                                <motion.button
                                    key={`option-${currentChallenge.id}-${index}`}
                                    onClick={() => setSelectedOption(index)}
                                    className={`w-full p-4 rounded-lg text-left transition-all duration-200 prediction-option ${
                                        selectedOption === index
                                            ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300'
                                            : 'bg-gray-800/50 border-2 border-gray-600/30 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500/50'
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{option}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            selectedOption === index
                                                ? 'border-cyan-400 bg-cyan-400'
                                                : 'border-gray-500'
                                        }`}>
                                            {selectedOption === index && (
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            )}
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            onClick={handleSubmitPrediction}
                            disabled={selectedOption === null || isSubmitting}
                            className={`w-full mt-6 py-4 rounded-lg font-bold text-lg transition-all duration-200 ${
                                selectedOption !== null && !isSubmitting
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-400 hover:to-purple-500 shadow-lg'
                                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                            }`}
                            whileHover={selectedOption !== null ? { scale: 1.02 } : {}}
                            whileTap={selectedOption !== null ? { scale: 0.98 } : {}}
                        >
                            {(() => {
                                if (isSubmitting) {
                                    return (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Submitting...
                                        </div>
                                    );
                                }
                                if (selectedOption !== null) {
                                    return 'Submit Prediction';
                                }
                                return 'Select an Option';
                            })()}
                        </motion.button>

                        {/* Swipe Hint */}
                        {isTouch && challenges.length > 1 && (
                            <p className="text-center text-xs text-gray-500 mt-3">
                                ← Swipe to navigate between challenges →
                            </p>
                        )}
                    </div>

                    {/* Navigation Buttons for Non-Touch Devices */}
                    {!isTouch && challenges.length > 1 && (
                        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
                            <button
                                onClick={handlePreviousChallenge}
                                disabled={currentChallengeIndex === 0}
                                className="ml-2 p-2 bg-black/50 backdrop-blur-sm rounded-full pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/70"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleNextChallenge}
                                disabled={currentChallengeIndex === challenges.length - 1}
                                className="mr-2 p-2 bg-black/50 backdrop-blur-sm rounded-full pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/70"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </Widget>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onViewAnalytics}
                    className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-lg text-left hover:from-blue-500/30 hover:to-cyan-500/30 transition-all"
                >
                    <div className="text-2xl font-bold text-blue-300">78%</div>
                    <div className="text-xs text-gray-400">Accuracy</div>
                </button>
                <button
                    onClick={onViewRewards}
                    className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg text-left hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                >
                    <div className="text-2xl font-bold text-purple-300">1,250</div>
                    <div className="text-xs text-gray-400">Points</div>
                </button>
            </div>

            {/* Mobile-Optimized Tips */}
            {isMobile && (
                <div className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">💡 Mobile Tips</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                        <li>• Swipe left/right to navigate challenges</li>
                        <li>• Long press options for quick submission</li>
                        <li>• Install the app for offline access</li>
                        <li>• Enable notifications for alerts</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MobileOracleInterface;
