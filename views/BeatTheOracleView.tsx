import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { Widget } from '../components/ui/Widget';
import { motion } from 'framer-motion';
import { ZapIcon } from '../components/icons/ZapIcon';
import { Avatar } from '../components/ui/Avatar';
import { oraclePredictionService, type OraclePrediction } from '../services/oraclePredictionService';
import { realTimeDataService } from '../services/realTimeDataService';
import { OracleAnalyticsDashboard } from '../components/oracle/OracleAnalyticsDashboard';
import AdvancedOracleAnalyticsDashboard from '../components/analytics/AdvancedOracleAnalyticsDashboard';
import { OracleRewardsDashboard } from '../components/oracle/OracleRewardsDashboard';
import { oracleRewardsService, type RewardCalculation } from '../services/oracleRewardsService';
import SocialTab from '../components/social/SocialTab';
import MLAnalyticsDashboard from '../components/analytics/MLAnalyticsDashboard';
import EnsembleMLWidget from '../components/oracle/EnsembleMLWidget';
import TrainingDataManager from '../components/oracle/TrainingDataManager';
import OracleRealTimePredictionInterface from '../components/oracle/OracleRealTimePredictionInterface';
import OracleLeaderboard from '../components/oracle/OracleLeaderboard';
import { useResponsiveBreakpoint, useMobileFixedPosition, useMobileModalClasses } from '../utils/mobileOptimizationUtils';

interface OracleChallenge {
    id: string;
    week: number;
    type: 'PLAYER_PERFORMANCE' | 'GAME_OUTCOME' | 'WEEKLY_SCORING';
    question: string;
    options: string[];
    userPrediction?: number;
    oraclePrediction: number;
    oracleConfidence: number;
    result?: number;
    points?: number;
}

interface UserStats {
    totalChallenges: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
}

// Helper function for generating challenges using AI prediction service
const generateChallenges = async (week: number): Promise<OracleChallenge[]> => {
    try {
        // Get AI-powered predictions from the Oracle service
        const predictions = await oraclePredictionService.generateWeeklyPredictions(week);
        
        // Convert OraclePrediction to OracleChallenge format
        return predictions.map((prediction: OraclePrediction) => ({
            id: prediction.id,
            week: prediction.week,
            type: prediction.type as 'PLAYER_PERFORMANCE' | 'GAME_OUTCOME' | 'WEEKLY_SCORING',
            question: prediction.question,
            options: prediction.options.map(opt => opt.text),
            oraclePrediction: prediction.oracleChoice,
            oracleConfidence: prediction.confidence
        }));
    } catch (error) {
        console.error('Failed to generate Oracle challenges:', error);
        // Fallback to mock data if service fails
        return generateMockChallenges(week);
    }
};

// Fallback mock challenge generation
const generateMockChallenges = (week: number): OracleChallenge[] => {
    const challengeTypes = [
        {
            type: 'PLAYER_PERFORMANCE' as const,
            questions: [
                'Who will score the most fantasy points this week?',
                'Which RB will have the most rushing yards?',
                'Which WR will have the most receiving TDs?',
                'Who will throw the most passing yards?'
            ]
        },
        {
            type: 'GAME_OUTCOME' as const,
            questions: [
                'Which game will have the highest total score?',
                'Which team will win by the largest margin?',
                'Will there be any shutouts this week?',
                'Which game will go to overtime?'
            ]
        },
        {
            type: 'WEEKLY_SCORING' as const,
            questions: [
                'What will be the highest individual score?',
                'How many teams will score over 100 points?',
                'Which position will score the most total points?',
                'Will any defense score a touchdown?'
            ]
        }
    ];

    return challengeTypes.map((categoryData, index) => {
        const randomQuestion = categoryData.questions[Math.floor(Math.random() * categoryData.questions.length)];
        const options = ['Option A', 'Option B', 'Option C', 'Option D'];
        const oraclePrediction = Math.floor(Math.random() * 4);
        
        return {
            id: `challenge-${week}-${index}`,
            week,
            type: categoryData.type,
            question: randomQuestion,
            options,
            oraclePrediction,
            oracleConfidence: Math.floor(Math.random() * 40) + 60 // 60-100%
        };
    });
};

// Helper function for updating stats
const updateUserStats = (
    prevStats: UserStats, 
    challengeResult: { isWin: boolean; points: number }
): UserStats => {
    const newStats = {
        ...prevStats,
        totalChallenges: prevStats.totalChallenges + 1,
        totalPoints: prevStats.totalPoints + challengeResult.points
    };

    if (challengeResult.isWin) {
        newStats.wins = prevStats.wins + 1;
        newStats.currentStreak = prevStats.currentStreak + 1;
        newStats.longestStreak = Math.max(prevStats.longestStreak, newStats.currentStreak);
    } else {
        newStats.losses = prevStats.losses + 1;
        newStats.currentStreak = 0;
    }

    newStats.winRate = newStats.wins / newStats.totalChallenges;
    return newStats;
};

// Component for rendering challenge options
const ChallengeOptions: React.FC<{
    challenge: OracleChallenge;
    onSelectOption: (challengeId: string, optionIndex: number) => void;
}> = ({ challenge, onSelectOption }) => {
    const getOptionStyle = (optionIndex: number): string => {
        if (challenge.userPrediction === optionIndex) {
            return 'bg-green-500/20 border border-green-500/40';
        }
        if (challenge.oraclePrediction === optionIndex) {
            return 'bg-blue-500/20 border border-blue-500/40';
        }
        return 'bg-gray-500/10 border border-gray-500/20 hover:bg-gray-500/20';
    };

    return (
        <>
            {challenge.options.map((option, optionIndex) => (
                <button
                    key={`${challenge.id}-option-${optionIndex}`}
                    onClick={() => onSelectOption(challenge.id, optionIndex)}
                    disabled={challenge.userPrediction !== undefined}
                    className={`p-3 rounded-lg text-left transition-all ${getOptionStyle(optionIndex)}`}
                >
                    <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {challenge.userPrediction === optionIndex && (
                            <span className="text-green-400 text-sm">Your pick</span>
                        )}
                        {challenge.oraclePrediction === optionIndex && (
                            <span className="text-blue-400 text-sm">Oracle pick</span>
                        )}
                    </div>
                </button>
            ))}
        </>
    );
};

// Component for leaderboard entries
const LeaderboardEntry: React.FC<{
    rank: number;
    name: string;
    score: number;
    isCurrentUser?: boolean;
}> = ({ rank, name, score, isCurrentUser = false }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
        isCurrentUser ? 'bg-blue-500/20' : 'bg-gray-500/10'
    }`}>
        <div className="flex items-center space-x-3">
            <span className="text-lg font-bold">{rank}</span>
            <Avatar avatar="👤" className="w-6 h-6" />
            <span>{name}</span>
        </div>
        <span className="font-bold">{score} pts</span>
    </div>
);

const BeatTheOracleView: React.FC = () => {
    const { state } = useAppState();
    const { isMobile } = useResponsiveBreakpoint();
    const modalClasses = useMobileModalClasses();
    const notificationPosition = useMobileFixedPosition('corner');
    
    const [userStats, setUserStats] = React.useState<UserStats>({
        totalChallenges: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0
    });
    const [activeChallenges, setActiveChallenges] = React.useState<OracleChallenge[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [realTimeActive, setRealTimeActive] = React.useState(false);
    const [liveUpdates, setLiveUpdates] = React.useState<Array<{id: string, message: string, timestamp: string}>>([]);
    const [activeTab, setActiveTab] = React.useState<'challenges' | 'analytics' | 'rewards' | 'social' | 'ml-analytics' | 'training' | 'realtime' | 'leaderboard'>('challenges');
    const [analyticsSubTab, setAnalyticsSubTab] = React.useState<'basic' | 'advanced'>('basic');
    const [rewardNotification, setRewardNotification] = React.useState<RewardCalculation | null>(null);

    React.useEffect(() => {
        // Load user stats from localStorage
        const savedStats = localStorage.getItem('oracleUserStats');
        if (savedStats) {
            setUserStats(JSON.parse(savedStats));
        }

        // Generate new challenges for current week
        const loadChallenges = async () => {
            setLoading(true);
            try {
                const currentWeek = 1; // Default week
                const challenges = await generateChallenges(currentWeek);
                setActiveChallenges(challenges);
                
                // Start real-time monitoring
                await startRealTimeMonitoring();
            } catch (error) {
                console.error('Failed to load challenges:', error);
                // Fallback to mock challenges
                const currentWeek = 1;
                const mockChallenges = generateMockChallenges(currentWeek);
                setActiveChallenges(mockChallenges);
            } finally {
                setLoading(false);
            }
        };

        loadChallenges();

        // Cleanup on unmount
        return () => {
            realTimeDataService.stopRealTimeUpdates();
        };
    }, []);

    // Auto-dismiss reward notification after 5 seconds
    React.useEffect(() => {
        if (rewardNotification) {
            const timer = setTimeout(() => {
                setRewardNotification(null);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [rewardNotification]);

    const startRealTimeMonitoring = async () => {
        try {
            // Set up real-time callbacks
            realTimeDataService.onGameUpdate((update) => {
                addLiveUpdate(`🏈 Game Update: ${update.homeTeam} ${update.homeScore} - ${update.awayScore} ${update.awayTeam}`);
            });

            realTimeDataService.onPlayerUpdate((update) => {
                addLiveUpdate(`📊 ${update.name} (${update.team}): ${update.fantasyPoints} pts`);
            });

            realTimeDataService.onInjuryAlert((alert) => {
                addLiveUpdate(`🚨 Injury Alert: ${alert.playerName} (${alert.team}) - ${alert.injuryType}`);
            });

            realTimeDataService.onPredictionUpdate((update) => {
                addLiveUpdate(`🔮 Oracle Update: Confidence adjusted to ${update.newConfidence}%`);
                // Update the relevant challenge
                updateChallengeConfidence(update.predictionId, update.newConfidence);
            });

            await realTimeDataService.startRealTimeUpdates();
            setRealTimeActive(true);
            addLiveUpdate('🚀 Real-time monitoring activated!');
        } catch (error) {
            console.error('Failed to start real-time monitoring:', error);
        }
    };

    const addLiveUpdate = (message: string) => {
        const update = {
            id: `update-${Date.now()}-${Math.random()}`,
            message,
            timestamp: new Date().toISOString()
        };
        setLiveUpdates(prev => {
            const newUpdates = [update, ...prev].slice(0, 10); // Keep last 10 updates
            return newUpdates;
        });
    };

    const updateChallengeConfidence = (predictionId: string, newConfidence: number) => {
        setActiveChallenges(prev => 
            prev.map(challenge => 
                challenge.id === predictionId 
                    ? { ...challenge, oracleConfidence: newConfidence }
                    : challenge
            )
        );
    };

    const handleSelectOption = async (challengeId: string, optionIndex: number) => {
        setLoading(true);
        
        const challenge = activeChallenges.find(c => c.id === challengeId);
        if (!challenge) return;

        const updatedChallenge: OracleChallenge = {
            ...challenge,
            userPrediction: optionIndex,
            result: Math.floor(Math.random() * 4), // Simulate result
            points: Math.floor(Math.random() * 50) + 10 // 10-60 points
        };

        const isWin = updatedChallenge.userPrediction === updatedChallenge.result;
        const beatOracle = isWin && updatedChallenge.oraclePrediction !== updatedChallenge.result;
        
        // Calculate rewards using the rewards service
        try {
            const rewardCalc = await oracleRewardsService.calculateChallengeReward(
                isWin,
                updatedChallenge.oracleConfidence,
                userStats.currentStreak,
                updatedChallenge.type,
                beatOracle
            );

            // Apply the calculated rewards
            await oracleRewardsService.applyRewards(rewardCalc);
            
            // Update challenge points with calculated total
            updatedChallenge.points = rewardCalc.totalPoints;

            // Show reward notification
            setRewardNotification(rewardCalc);
            
            // Add live update for rewards
            if (rewardCalc.totalPoints > 0) {
                addLiveUpdate(`💰 Earned ${rewardCalc.totalPoints} points! ${rewardCalc.levelUp ? '⬆️ Level up!' : ''}`);
            }
            
            if (rewardCalc.newAchievements.length > 0) {
                rewardCalc.newAchievements.forEach(achievement => {
                    addLiveUpdate(`🏆 Achievement unlocked: ${achievement.title}!`);
                });
            }
        } catch (error) {
            console.error('Failed to calculate rewards:', error);
            // Fallback to basic points if rewards service fails
            updatedChallenge.points = isWin ? 25 : 0;
        }
        
        // Update challenge in state
        setActiveChallenges(prev => 
            prev.map(c => c.id === challengeId ? updatedChallenge : c)
        );

        // Update user stats
        const newStats = updateUserStats(userStats, {
            isWin,
            points: updatedChallenge.points || 0
        });
        
        setUserStats(newStats);
        localStorage.setItem('oracleUserStats', JSON.stringify(newStats));
        
        setLoading(false);
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <ZapIcon className="text-yellow-400" />
                    Beat The Oracle
                </h1>
                <p className="text-sm sm:text-base text-gray-400">
                    Challenge the AI Oracle with your fantasy football predictions
                </p>
            </motion.div>

            {/* Tab Navigation */}
            <div className="w-full overflow-x-auto">
                <div className="flex space-x-2 sm:space-x-1 pb-2 px-4 sm:px-0 min-w-max sm:min-w-0 sm:justify-center">
                    <div className="bg-gray-800/50 rounded-lg p-1 flex space-x-1 min-w-max">
                        <button
                            onClick={() => setActiveTab('challenges')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all mobile-touch-target whitespace-nowrap ${
                                activeTab === 'challenges'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                        >
                            Oracle Challenges
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all mobile-touch-target whitespace-nowrap ${
                                activeTab === 'analytics'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                        >
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('rewards')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all mobile-touch-target whitespace-nowrap ${
                                activeTab === 'rewards'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                        >
                            Rewards
                        </button>
                        <button
                            onClick={() => setActiveTab('social')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all mobile-touch-target whitespace-nowrap ${
                                activeTab === 'social'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                        >
                            Social
                        </button>
                        <button
                            onClick={() => setActiveTab('ml-analytics')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all mobile-touch-target whitespace-nowrap ${
                                activeTab === 'ml-analytics'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                        >
                            🤖 ML
                        </button>
                        <button
                            onClick={() => setActiveTab('training')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all mobile-touch-target whitespace-nowrap ${
                                activeTab === 'training'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                        >
                            🎯 Training
                        </button>
                        <button
                            onClick={() => setActiveTab('realtime')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all mobile-touch-target whitespace-nowrap ${
                                activeTab === 'realtime'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                        >
                            ⚡ Real-Time
                        </button>
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all mobile-touch-target whitespace-nowrap ${
                                activeTab === 'leaderboard'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                        >
                            🏆 Leaderboard
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'challenges' ? (
                <>
                    {/* User Stats Dashboard */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <Widget title="Win Rate" className="bg-green-500/10">
                            <div className="text-2xl font-bold text-green-400">
                                {(userStats.winRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-400">
                                {userStats.wins}W - {userStats.losses}L
                            </div>
                        </Widget>

                        <Widget title="Total Points" className="bg-blue-500/10">
                            <div className="text-2xl font-bold text-blue-400">
                                {userStats.totalPoints}
                            </div>
                            <div className="text-sm text-gray-400">
                                {userStats.totalChallenges} challenges
                            </div>
                        </Widget>

                        <Widget title="Current Streak" className="bg-purple-500/10">
                            <div className="text-2xl font-bold text-purple-400">
                                {userStats.currentStreak}
                            </div>
                            <div className="text-sm text-gray-400">
                                Best: {userStats.longestStreak}
                            </div>
                        </Widget>

                        <Widget title="Oracle Status" className="bg-yellow-500/10">
                            <div className="text-2xl font-bold text-yellow-400">
                                Active
                            </div>
                            <div className="text-sm text-gray-400">
                                Week 1
                            </div>
                        </Widget>
                    </div>

                    {/* Main Content Area with Challenges and ML Widget */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Left Side - Active Challenges */}
                        <div className="lg:col-span-2">
                            <Widget title="Weekly Challenges" className="bg-gray-900/50">
                                <div className="space-y-4">
                                    {activeChallenges.map((challenge) => (
                                <motion.div
                                    key={challenge.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-gray-800/50 rounded-lg p-4"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-white">{challenge.question}</h3>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-400">
                                                Oracle: {challenge.oracleConfidence}% confident
                                            </span>
                                            <ZapIcon className="w-4 h-4 text-blue-400" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                        <ChallengeOptions 
                                            challenge={challenge}
                                            onSelectOption={handleSelectOption}
                                        />
                                    </div>

                                    {challenge.result !== undefined && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 p-3 rounded-lg bg-gray-700/50"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>
                                                    {challenge.userPrediction === challenge.result 
                                                        ? '🎉 You won!' 
                                                        : '😔 Oracle wins this round'
                                                    }
                                                </span>
                                                <span className="font-bold text-yellow-400">
                                                    +{challenge.points} pts
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </Widget>

                    {/* Leaderboard */}
                    <Widget title="Oracle Leaderboard" className="bg-gray-900/50">
                        <OracleLeaderboard 
                            currentUserId={state.user?.id}
                            showAchievements={false}
                            compact={true}
                        />
                    </Widget>

                    {/* Real-Time Updates Feed */}
                    <Widget title="Live Updates" className="bg-gray-900/50">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-gray-400">Real-time monitoring</span>
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${realTimeActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className="text-xs text-gray-500">
                                        {realTimeActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {liveUpdates.length === 0 ? (
                                    <div className="text-sm text-gray-500 italic">No live updates yet...</div>
                                ) : (
                                    liveUpdates.map((update) => (
                                        <motion.div
                                            key={update.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-xs text-gray-300 bg-gray-800/50 rounded p-2"
                                        >
                                            {update.message}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Widget>
                        </div>

                        {/* Right Side - AI Ensemble ML Widget */}
                        <div className="lg:col-span-1">
                            <EnsembleMLWidget compact={true} />
                        </div>
                    </div>
                </>
            ) : null}

            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <div className="border-b border-[var(--panel-border)]">
                        <nav className="flex space-x-6">
                            <button
                                onClick={() => setAnalyticsSubTab('basic')}
                                className={`pb-2 border-b-2 transition-colors ${
                                    analyticsSubTab === 'basic'
                                        ? 'border-cyan-500 text-cyan-400'
                                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                Basic Analytics
                            </button>
                            <button
                                onClick={() => setAnalyticsSubTab('advanced')}
                                className={`pb-2 border-b-2 transition-colors ${
                                    analyticsSubTab === 'advanced'
                                        ? 'border-cyan-500 text-cyan-400'
                                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                Advanced Analytics
                            </button>
                        </nav>
                    </div>
                    
                    {analyticsSubTab === 'basic' && <OracleAnalyticsDashboard />}
                    {analyticsSubTab === 'advanced' && <AdvancedOracleAnalyticsDashboard />}
                </div>
            )}
            {activeTab === 'rewards' && <OracleRewardsDashboard />}
            {activeTab === 'social' && <SocialTab isActive={activeTab === 'social'} />}
            {activeTab === 'ml-analytics' && <MLAnalyticsDashboard isActive={activeTab === 'ml-analytics'} />}
            {activeTab === 'training' && <TrainingDataManager />}
            {activeTab === 'realtime' && <OracleRealTimePredictionInterface />}
            {activeTab === 'leaderboard' && (
                <div className="space-y-6">
                    <OracleLeaderboard 
                        currentUserId={state.user?.id}
                        showAchievements={true}
                        compact={false}
                    />
                </div>
            )}

            {/* Reward Notification */}
            {rewardNotification && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className={`${notificationPosition} bg-gray-800 border border-gray-600 rounded-lg p-4 ${isMobile ? 'w-full mx-4' : 'max-w-sm'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white">Rewards Earned!</h4>
                        <button
                            onClick={() => setRewardNotification(null)}
                            className="text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {rewardNotification.totalPoints > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-yellow-400">💰</span>
                                <span className="text-sm text-white">+{rewardNotification.totalPoints} points</span>
                            </div>
                        )}
                        
                        {rewardNotification.streakBonus > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-orange-400">🔥</span>
                                <span className="text-sm text-white">+{rewardNotification.streakBonus} streak bonus</span>
                            </div>
                        )}
                        
                        {rewardNotification.accuracyBonus > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-blue-400">🎯</span>
                                <span className="text-sm text-white">+{rewardNotification.accuracyBonus} Oracle beaten bonus</span>
                            </div>
                        )}
                        
                        {rewardNotification.levelUp && (
                            <div className="flex items-center space-x-2">
                                <span className="text-purple-400">⬆️</span>
                                <span className="text-sm text-white">Level up!</span>
                            </div>
                        )}
                        
                        {rewardNotification.newAchievements.map((achievement) => (
                            <div key={achievement.id} className="flex items-center space-x-2">
                                <span className="text-2xl">{achievement.icon}</span>
                                <span className="text-sm text-white">Achievement: {achievement.title}</span>
                            </div>
                        ))}
                        
                        {rewardNotification.newBadges.map((badge) => (
                            <div key={badge.id} className="flex items-center space-x-2">
                                <span className="text-lg">{badge.icon}</span>
                                <span className="text-sm text-white">Badge: {badge.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {loading && (
                <div className={modalClasses.overlay}>
                    <div className={`${modalClasses.content} p-6 flex items-center space-x-3`}>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                        <span className="text-white">Processing prediction...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BeatTheOracleView;
