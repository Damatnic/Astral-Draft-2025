import React from 'react';
import { motion } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { ZapIcon } from '../icons/ZapIcon';
import { oracleRewardsService, type UserRewards, type Achievement, type Badge } from '../../services/oracleRewardsService';

interface ProgressBarProps {
    current: number;
    max: number;
    color?: string;
    showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
    current, 
    max, 
    color = 'bg-blue-500',
    showLabel = true 
}) => {
    const percentage = Math.min((current / max) * 100, 100);
    
    return (
        <div className="w-full">
            <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`${color} h-2 rounded-full`}
                />
            </div>
            {showLabel && (
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{current}</span>
                    <span>{max}</span>
                </div>
            )}
        </div>
    );
};

interface AchievementCardProps {
    achievement: Achievement;
    isUnlocked: boolean;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, isUnlocked }) => {
    const getDifficultyColor = (difficulty: Achievement['difficulty']) => {
        switch (difficulty) {
            case 'BRONZE':
                return 'border-amber-600 bg-amber-600/10';
            case 'SILVER':
                return 'border-gray-400 bg-gray-400/10';
            case 'GOLD':
                return 'border-yellow-500 bg-yellow-500/10';
            case 'PLATINUM':
                return 'border-purple-500 bg-purple-500/10';
            case 'LEGENDARY':
                return 'border-red-500 bg-red-500/10';
            default:
                return 'border-gray-500 bg-gray-500/10';
        }
    };

    const getCategoryIcon = (category: Achievement['category']) => {
        switch (category) {
            case 'PREDICTION':
                return '🎯';
            case 'STREAK':
                return '🔥';
            case 'ACCURACY':
                return '📊';
            case 'PARTICIPATION':
                return '🏃';
            case 'SEASONAL':
                return '🏆';
            case 'MILESTONE':
                return '💎';
            default:
                return '⭐';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`border rounded-lg p-4 ${getDifficultyColor(achievement.difficulty)} ${
                isUnlocked ? '' : 'opacity-50 grayscale'
            }`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <span className="text-xs">{getCategoryIcon(achievement.category)}</span>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-400 capitalize">
                        {achievement.difficulty.toLowerCase()}
                    </span>
                    <div className="text-sm font-bold text-yellow-400">
                        +{achievement.points} pts
                    </div>
                </div>
            </div>
            <h4 className="font-semibold text-white text-sm mb-1">
                {achievement.title}
            </h4>
            <p className="text-xs text-gray-300 mb-2">
                {achievement.description}
            </p>
            {isUnlocked ? (
                <div className="text-xs text-green-400">
                    ✅ Unlocked {achievement.unlockedAt ? 
                        new Date(achievement.unlockedAt).toLocaleDateString() : 'Recently'
                    }
                </div>
            ) : (
                <div className="text-xs text-gray-500">
                    🔒 Locked
                </div>
            )}
        </motion.div>
    );
};

interface BadgeDisplayProps {
    badge: Badge;
    size?: 'sm' | 'md' | 'lg';
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badge, size = 'md' }) => {
    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'w-8 h-8 text-xs';
            case 'lg':
                return 'w-16 h-16 text-2xl';
            default:
                return 'w-12 h-12 text-lg';
        }
    };

    const getRarityGlow = (rarity: Badge['rarity']) => {
        switch (rarity) {
            case 'LEGENDARY':
                return 'shadow-lg shadow-yellow-500/50 animate-pulse';
            case 'EPIC':
                return 'shadow-lg shadow-purple-500/30';
            case 'RARE':
                return 'shadow-lg shadow-blue-500/20';
            default:
                return '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${badge.color} rounded-full flex items-center justify-center ${getSizeClasses()} ${getRarityGlow(badge.rarity)}`}
            title={`${badge.name}: ${badge.description}`}
        >
            <span>{badge.icon}</span>
        </motion.div>
    );
};

interface LevelDisplayProps {
    level: number;
    currentPoints: number;
    nextLevelPoints: number;
}

const LevelDisplay: React.FC<LevelDisplayProps> = ({ level, currentPoints, nextLevelPoints }) => {
    const pointsInCurrentLevel = currentPoints % 500;
    
    return (
        <div className="text-center">
            <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-white">{level}</span>
                </div>
                <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-yellow-400 rounded-full mx-auto"
                    style={{
                        borderTopColor: nextLevelPoints < 50 ? '#fbbf24' : 'transparent'
                    }}
                />
            </div>
            <div className="text-lg font-bold text-white">Level {level}</div>
            <div className="text-sm text-gray-400">
                {nextLevelPoints} points to level {level + 1}
            </div>
            <div className="mt-2">
                <ProgressBar
                    current={pointsInCurrentLevel}
                    max={500}
                    color="bg-gradient-to-r from-blue-500 to-purple-500"
                    showLabel={false}
                />
            </div>
        </div>
    );
};

interface RewardNotificationProps {
    rewards: {
        points: number;
        newAchievements: Achievement[];
        newBadges: Badge[];
        levelUp?: boolean;
    };
    onClose: () => void;
}

const RewardNotification: React.FC<RewardNotificationProps> = ({ rewards, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-sm z-50"
        >
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Rewards Earned!</h4>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white"
                >
                    ✕
                </button>
            </div>
            
            <div className="space-y-2">
                {rewards.points > 0 && (
                    <div className="flex items-center space-x-2">
                        <span className="text-yellow-400">💰</span>
                        <span className="text-sm text-white">+{rewards.points} points</span>
                    </div>
                )}
                
                {rewards.levelUp && (
                    <div className="flex items-center space-x-2">
                        <span className="text-purple-400">⬆️</span>
                        <span className="text-sm text-white">Level up!</span>
                    </div>
                )}
                
                {rewards.newAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-2">
                        <span className="text-2xl">{achievement.icon}</span>
                        <span className="text-sm text-white">{achievement.title}</span>
                    </div>
                ))}
                
                {rewards.newBadges.map((badge) => (
                    <div key={badge.id} className="flex items-center space-x-2">
                        <BadgeDisplay badge={badge} size="sm" />
                        <span className="text-sm text-white">{badge.name}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export const OracleRewardsDashboard: React.FC = () => {
    const [userRewards, setUserRewards] = React.useState<UserRewards | null>(null);
    const [allAchievements, setAllAchievements] = React.useState<Achievement[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedCategory, setSelectedCategory] = React.useState<'ALL' | Achievement['category']>('ALL');

    React.useEffect(() => {
        const loadRewards = async () => {
            try {
                setLoading(true);
                const rewards = await oracleRewardsService.getUserRewards();
                const achievements = oracleRewardsService.getAvailableAchievements();
                
                setUserRewards(rewards);
                setAllAchievements(achievements);
            } catch (error) {
                console.error('Failed to load rewards:', error);
            } finally {
                setLoading(false);
            }
        };

        loadRewards();
    }, []);

    const filteredAchievements = React.useMemo(() => {
        if (selectedCategory === 'ALL') return allAchievements;
        return allAchievements.filter((a: any) => a.category === selectedCategory);
    }, [allAchievements, selectedCategory]);

    const unlockedAchievements = React.useMemo(() => {
        if (!userRewards) return [];
        return userRewards.achievements;
    }, [userRewards]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading rewards...</p>
                </div>
            </div>
        );
    }

    if (!userRewards) {
        return (
            <div className="space-y-6">
                <Widget title="Rewards & Achievements" className="bg-gray-900/50">
                    <div className="text-center py-8">
                        <ZapIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">Failed to load rewards data</p>
                    </div>
                </Widget>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <ZapIcon className="text-yellow-400" />
                    Rewards & Achievements
                </h2>
                <p className="text-gray-400">
                    Track your progress and unlock amazing rewards
                </p>
            </motion.div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Level & XP */}
                <Widget title="Your Level" className="bg-gray-900/50">
                    <LevelDisplay
                        level={userRewards.level}
                        currentPoints={userRewards.totalPoints}
                        nextLevelPoints={userRewards.nextLevelPoints}
                    />
                </Widget>

                {/* Points Summary */}
                <Widget title="Points Summary" className="bg-gray-900/50">
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-400">
                                {userRewards.totalPoints.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-400">Total Points</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-lg font-bold text-blue-400">
                                    {userRewards.weeklyPoints}
                                </div>
                                <div className="text-xs text-gray-400">This Week</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-purple-400">
                                    {userRewards.seasonalPoints}
                                </div>
                                <div className="text-xs text-gray-400">This Season</div>
                            </div>
                        </div>

                        {userRewards.streakMultiplier > 1 && (
                            <div className="text-center">
                                <div className="text-sm text-orange-400">
                                    🔥 {userRewards.streakMultiplier.toFixed(1)}x Streak Multiplier
                                </div>
                            </div>
                        )}
                    </div>
                </Widget>

                {/* Badges Collection */}
                <Widget title="Badge Collection" className="bg-gray-900/50">
                    <div className="space-y-4">
                        {userRewards.badges.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                                {userRewards.badges.slice(0, 6).map((badge) => (
                                    <BadgeDisplay key={badge.id} badge={badge} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-4">
                                <div className="text-4xl mb-2">🏆</div>
                                <p className="text-sm">No badges earned yet</p>
                                <p className="text-xs">Complete challenges to earn badges!</p>
                            </div>
                        )}
                        
                        {userRewards.badges.length > 6 && (
                            <div className="text-center">
                                <span className="text-sm text-gray-400">
                                    +{userRewards.badges.length - 6} more badges
                                </span>
                            </div>
                        )}
                    </div>
                </Widget>
            </div>

            {/* Achievement Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Widget title="Achievements" className="bg-green-500/10">
                    <div className="text-2xl font-bold text-green-400">
                        {unlockedAchievements.length}
                    </div>
                    <div className="text-sm text-gray-400">
                        of {allAchievements.length} unlocked
                    </div>
                    <ProgressBar
                        current={unlockedAchievements.length}
                        max={allAchievements.length}
                        color="bg-green-500"
                        showLabel={false}
                    />
                </Widget>

                <Widget title="Completion Rate" className="bg-blue-500/10">
                    <div className="text-2xl font-bold text-blue-400">
                        {((unlockedAchievements.length / allAchievements.length) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">
                        Overall progress
                    </div>
                </Widget>

                <Widget title="Weekly Rank" className="bg-purple-500/10">
                    <div className="text-2xl font-bold text-purple-400">
                        {userRewards.weeklyRank || '—'}
                    </div>
                    <div className="text-sm text-gray-400">
                        This week
                    </div>
                </Widget>

                <Widget title="Season Rank" className="bg-yellow-500/10">
                    <div className="text-2xl font-bold text-yellow-400">
                        {userRewards.seasonRank || '—'}
                    </div>
                    <div className="text-sm text-gray-400">
                        Overall season
                    </div>
                </Widget>
            </div>

            {/* Achievement Categories Filter */}
            <Widget title="Achievements" className="bg-gray-900/50">
                <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                        {(['ALL', 'PREDICTION', 'STREAK', 'ACCURACY', 'PARTICIPATION', 'SEASONAL', 'MILESTONE'] as const).map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                                    selectedCategory === category
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {category === 'ALL' ? 'All' : category.charAt(0) + category.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAchievements.map((achievement) => {
                        const isUnlocked = unlockedAchievements.some((ua: any) => ua.id === achievement.id);
                        return (
                            <AchievementCard
                                key={achievement.id}
                                achievement={achievement}
                                isUnlocked={isUnlocked}
                            />
                        );
                    })}
                </div>
            </Widget>
        </div>
    );
};

export default OracleRewardsDashboard;
