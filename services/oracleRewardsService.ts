/**
 * Oracle Rewards & Achievements System
 * Manages points, badges, achievements, and seasonal rewards for Oracle challenges
 */

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'PREDICTION' | 'STREAK' | 'ACCURACY' | 'PARTICIPATION' | 'SEASONAL' | 'MILESTONE';
    difficulty: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'LEGENDARY';
    requirements: AchievementRequirement;
    points: number;
    unlockedAt?: string;
    progress?: number;
    isHidden?: boolean;
}

export interface AchievementRequirement {
    type: 'WIN_COUNT' | 'STREAK' | 'ACCURACY_RATE' | 'POINTS_TOTAL' | 'CHALLENGES_COMPLETED' | 'BEAT_ORACLE' | 'PERFECT_WEEK' | 'CATEGORY_MASTERY';
    target: number;
    category?: string;
    timeframe?: 'WEEKLY' | 'MONTHLY' | 'SEASONAL' | 'ALL_TIME';
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    earnedAt?: string;
}

export interface Reward {
    id: string;
    type: 'POINTS' | 'BADGE' | 'ACHIEVEMENT' | 'TITLE' | 'MULTIPLIER';
    value: number | string;
    description: string;
    icon?: string;
    expiresAt?: string;
}

export interface LeaderboardEntry {
    userId: string;
    username: string;
    avatar: string;
    totalPoints: number;
    weeklyPoints: number;
    achievements: number;
    rank: number;
    weeklyRank: number;
    badges: Badge[];
    title?: string;
}

export interface UserRewards {
    totalPoints: number;
    weeklyPoints: number;
    seasonalPoints: number;
    level: number;
    nextLevelPoints: number;
    achievements: Achievement[];
    badges: Badge[];
    activeTitle?: string;
    availableTitles: string[];
    streakMultiplier: number;
    seasonRank: number;
    weeklyRank: number;
}

export interface RewardCalculation {
    basePoints: number;
    bonusPoints: number;
    streakBonus: number;
    accuracyBonus: number;
    totalPoints: number;
    newAchievements: Achievement[];
    newBadges: Badge[];
    levelUp?: boolean;
}

class OracleRewardsService {
    private readonly STORAGE_KEY = 'oracleRewards';
    private readonly ACHIEVEMENTS_KEY = 'oracleAchievements';
    private readonly BADGES_KEY = 'oracleBadges';
    private readonly LEADERBOARD_KEY = 'oracleLeaderboard';

    /**
     * Get user's current rewards status
     */
    async getUserRewards(): Promise<UserRewards> {
        const stored = this.getStoredRewards();
        const achievements = await this.getUserAchievements();
        const badges = await this.getUserBadges();
        
        return {
            ...stored,
            achievements,
            badges,
            level: this.calculateLevel(stored.totalPoints),
            nextLevelPoints: this.getNextLevelPoints(stored.totalPoints)
        };
    }

    /**
     * Calculate rewards for completing a challenge
     */
    async calculateChallengeReward(
        isWin: boolean,
        oracleConfidence: number,
        currentStreak: number,
        challengeType: string,
        beatOracle: boolean = false
    ): Promise<RewardCalculation> {
        const basePoints = isWin ? this.getBasePointsForChallenge(challengeType) : 0;
        const streakBonus = this.calculateStreakBonus(currentStreak, isWin);
        const accuracyBonus = beatOracle ? this.calculateOracleBeatenBonus(oracleConfidence) : 0;
        const bonusPoints = streakBonus + accuracyBonus;
        
        const totalPoints = basePoints + bonusPoints;
        
        // Check for new achievements and badges
        const newAchievements = await this.checkForNewAchievements();
        const newBadges = await this.checkForNewBadges();
        
        // Check for level up
        const currentRewards = this.getStoredRewards();
        const oldLevel = this.calculateLevel(currentRewards.totalPoints);
        const newLevel = this.calculateLevel(currentRewards.totalPoints + totalPoints);
        const levelUp = newLevel > oldLevel;

        return {
            basePoints,
            bonusPoints,
            streakBonus,
            accuracyBonus,
            totalPoints,
            newAchievements,
            newBadges,
            levelUp
        };
    }

    /**
     * Apply reward points and unlock achievements
     */
    async applyRewards(calculation: RewardCalculation): Promise<void> {
        const currentRewards = this.getStoredRewards();
        
        // Update points
        const updatedRewards = {
            ...currentRewards,
            totalPoints: currentRewards.totalPoints + calculation.totalPoints,
            weeklyPoints: currentRewards.weeklyPoints + calculation.totalPoints,
            seasonalPoints: currentRewards.seasonalPoints + calculation.totalPoints
        };

        // Apply streak multiplier if applicable
        if (calculation.streakBonus > 0) {
            updatedRewards.streakMultiplier = Math.min(updatedRewards.streakMultiplier + 0.1, 3.0);
        } else {
            updatedRewards.streakMultiplier = 1.0;
        }

        this.storeRewards(updatedRewards);

        // Unlock achievements and badges
        for (const achievement of calculation.newAchievements) {
            await this.unlockAchievement(achievement.id);
        }

        for (const badge of calculation.newBadges) {
            await this.unlockBadge(badge.id);
        }
    }

    /**
     * Get all available achievements
     */
    getAvailableAchievements(): Achievement[] {
        return [
            // Prediction Achievements
            {
                id: 'first-win',
                title: 'First Victory',
                description: 'Win your first Oracle challenge',
                icon: '🎯',
                category: 'PREDICTION',
                difficulty: 'BRONZE',
                requirements: { type: 'WIN_COUNT', target: 1 },
                points: 50
            },
            {
                id: 'ten-wins',
                title: 'Oracle Challenger',
                description: 'Win 10 Oracle challenges',
                icon: '⚔️',
                category: 'PREDICTION',
                difficulty: 'SILVER',
                requirements: { type: 'WIN_COUNT', target: 10 },
                points: 200
            },
            {
                id: 'fifty-wins',
                title: 'Oracle Slayer',
                description: 'Win 50 Oracle challenges',
                icon: '🏆',
                category: 'PREDICTION',
                difficulty: 'GOLD',
                requirements: { type: 'WIN_COUNT', target: 50 },
                points: 500
            },
            {
                id: 'hundred-wins',
                title: 'Oracle Master',
                description: 'Win 100 Oracle challenges',
                icon: '👑',
                category: 'PREDICTION',
                difficulty: 'PLATINUM',
                requirements: { type: 'WIN_COUNT', target: 100 },
                points: 1000
            },
            
            // Streak Achievements
            {
                id: 'three-streak',
                title: 'Hot Streak',
                description: 'Win 3 challenges in a row',
                icon: '🔥',
                category: 'STREAK',
                difficulty: 'BRONZE',
                requirements: { type: 'STREAK', target: 3 },
                points: 100
            },
            {
                id: 'five-streak',
                title: 'On Fire',
                description: 'Win 5 challenges in a row',
                icon: '🌟',
                category: 'STREAK',
                difficulty: 'SILVER',
                requirements: { type: 'STREAK', target: 5 },
                points: 250
            },
            {
                id: 'ten-streak',
                title: 'Unstoppable',
                description: 'Win 10 challenges in a row',
                icon: '⚡',
                category: 'STREAK',
                difficulty: 'GOLD',
                requirements: { type: 'STREAK', target: 10 },
                points: 500
            },
            {
                id: 'twenty-streak',
                title: 'Legendary Streak',
                description: 'Win 20 challenges in a row',
                icon: '🌪️',
                category: 'STREAK',
                difficulty: 'LEGENDARY',
                requirements: { type: 'STREAK', target: 20 },
                points: 1500
            },

            // Accuracy Achievements
            {
                id: 'accuracy-master',
                title: 'Accuracy Master',
                description: 'Maintain 80% win rate over 20 challenges',
                icon: '🎯',
                category: 'ACCURACY',
                difficulty: 'GOLD',
                requirements: { type: 'ACCURACY_RATE', target: 80 },
                points: 750
            },
            {
                id: 'perfect-week',
                title: 'Perfect Week',
                description: 'Win all challenges in a single week',
                icon: '💎',
                category: 'ACCURACY',
                difficulty: 'PLATINUM',
                requirements: { type: 'PERFECT_WEEK', target: 1, timeframe: 'WEEKLY' },
                points: 1000
            },

            // Oracle-Beating Achievements
            {
                id: 'oracle-defeater',
                title: 'Oracle Defeater',
                description: 'Beat the Oracle on 5 high-confidence predictions (90%+)',
                icon: '🥊',
                category: 'PREDICTION',
                difficulty: 'GOLD',
                requirements: { type: 'BEAT_ORACLE', target: 5 },
                points: 800
            },

            // Milestone Achievements
            {
                id: 'point-collector',
                title: 'Point Collector',
                description: 'Earn 1,000 total points',
                icon: '💰',
                category: 'MILESTONE',
                difficulty: 'SILVER',
                requirements: { type: 'POINTS_TOTAL', target: 1000 },
                points: 200
            },
            {
                id: 'point-hoarder',
                title: 'Point Hoarder',
                description: 'Earn 5,000 total points',
                icon: '💎',
                category: 'MILESTONE',
                difficulty: 'GOLD',
                requirements: { type: 'POINTS_TOTAL', target: 5000 },
                points: 500
            },

            // Category Mastery
            {
                id: 'player-prophet',
                title: 'Player Prophet',
                description: 'Win 20 Player Performance challenges',
                icon: '🏃',
                category: 'PREDICTION',
                difficulty: 'SILVER',
                requirements: { type: 'CATEGORY_MASTERY', target: 20, category: 'PLAYER_PERFORMANCE' },
                points: 300
            },
            {
                id: 'game-guru',
                title: 'Game Guru',
                description: 'Win 20 Game Outcome challenges',
                icon: '🏈',
                category: 'PREDICTION',
                difficulty: 'SILVER',
                requirements: { type: 'CATEGORY_MASTERY', target: 20, category: 'GAME_OUTCOME' },
                points: 300
            },
            {
                id: 'score-seer',
                title: 'Score Seer',
                description: 'Win 20 Weekly Scoring challenges',
                icon: '📊',
                category: 'PREDICTION',
                difficulty: 'SILVER',
                requirements: { type: 'CATEGORY_MASTERY', target: 20, category: 'WEEKLY_SCORING' },
                points: 300
            }
        ];
    }

    /**
     * Get available badges
     */
    getAvailableBadges(): Badge[] {
        return [
            {
                id: 'rookie',
                name: 'Rookie',
                description: 'Complete your first challenge',
                icon: '🆕',
                color: 'bg-green-500',
                rarity: 'COMMON'
            },
            {
                id: 'veteran',
                name: 'Veteran',
                description: 'Complete 50 challenges',
                icon: '⭐',
                color: 'bg-blue-500',
                rarity: 'RARE'
            },
            {
                id: 'elite',
                name: 'Elite',
                description: 'Reach top 10% in weekly leaderboard',
                icon: '👑',
                color: 'bg-purple-500',
                rarity: 'EPIC'
            },
            {
                id: 'legend',
                name: 'Legend',
                description: 'Reach #1 in seasonal leaderboard',
                icon: '🏆',
                color: 'bg-yellow-500',
                rarity: 'LEGENDARY'
            },
            {
                id: 'oracle-nemesis',
                name: 'Oracle Nemesis',
                description: 'Beat Oracle 10 times in high-confidence predictions',
                icon: '⚔️',
                color: 'bg-red-500',
                rarity: 'EPIC'
            }
        ];
    }

    // Helper methods
    private getBasePointsForChallenge(type: string): number {
        const pointMap: Record<string, number> = {
            'PLAYER_PERFORMANCE': 25,
            'GAME_OUTCOME': 30,
            'WEEKLY_SCORING': 35,
            'WEATHER_IMPACT': 40,
            'INJURY_IMPACT': 45
        };
        return pointMap[type] || 25;
    }

    private calculateStreakBonus(streak: number, isWin: boolean): number {
        if (!isWin || streak < 3) return 0;
        return Math.min(streak * 5, 100); // Max 100 bonus points
    }

    private calculateOracleBeatenBonus(oracleConfidence: number): number {
        if (oracleConfidence >= 90) return 50;
        if (oracleConfidence >= 80) return 30;
        if (oracleConfidence >= 70) return 15;
        return 0;
    }

    private calculateLevel(totalPoints: number): number {
        return Math.floor(totalPoints / 500) + 1; // Level up every 500 points
    }

    private getNextLevelPoints(totalPoints: number): number {
        const currentLevel = this.calculateLevel(totalPoints);
        return currentLevel * 500 - totalPoints;
    }

    private async checkForNewAchievements(): Promise<Achievement[]> {
        // Implementation would check current stats against achievement requirements
        // This is a simplified version - full implementation would check all achievements
        return [];
    }

    private async checkForNewBadges(): Promise<Badge[]> {
        // Implementation would check current stats against badge requirements
        return [];
    }

    private async unlockAchievement(achievementId: string): Promise<void> {
        const achievements = this.getStoredAchievements();
        const achievement = this.getAvailableAchievements().find(a => a.id === achievementId);
        
        if (achievement && !achievements.find(a => a.id === achievementId)) {
            achievement.unlockedAt = new Date().toISOString();
            achievements.push(achievement);
            this.storeAchievements(achievements);
        }
    }

    private async unlockBadge(badgeId: string): Promise<void> {
        const badges = this.getStoredBadges();
        const badge = this.getAvailableBadges().find(b => b.id === badgeId);
        
        if (badge && !badges.find(b => b.id === badgeId)) {
            badge.earnedAt = new Date().toISOString();
            badges.push(badge);
            this.storeBadges(badges);
        }
    }

    private async getUserAchievements(): Promise<Achievement[]> {
        return this.getStoredAchievements();
    }

    private async getUserBadges(): Promise<Badge[]> {
        return this.getStoredBadges();
    }

    // Storage methods
    private getStoredRewards(): UserRewards {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : {
                totalPoints: 0,
                weeklyPoints: 0,
                seasonalPoints: 0,
                level: 1,
                nextLevelPoints: 500,
                achievements: [],
                badges: [],
                availableTitles: [],
                streakMultiplier: 1.0,
                seasonRank: 0,
                weeklyRank: 0
            };
        } catch (error) {
            console.error('Failed to load stored rewards:', error);
            return {
                totalPoints: 0,
                weeklyPoints: 0,
                seasonalPoints: 0,
                level: 1,
                nextLevelPoints: 500,
                achievements: [],
                badges: [],
                availableTitles: [],
                streakMultiplier: 1.0,
                seasonRank: 0,
                weeklyRank: 0
            };
        }
    }

    private storeRewards(rewards: UserRewards): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rewards));
        } catch (error) {
            console.error('Failed to store rewards:', error);
        }
    }

    private getStoredAchievements(): Achievement[] {
        try {
            const stored = localStorage.getItem(this.ACHIEVEMENTS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load achievements:', error);
            return [];
        }
    }

    private storeAchievements(achievements: Achievement[]): void {
        try {
            localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(achievements));
        } catch (error) {
            console.error('Failed to store achievements:', error);
        }
    }

    private getStoredBadges(): Badge[] {
        try {
            const stored = localStorage.getItem(this.BADGES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load badges:', error);
            return [];
        }
    }

    private storeBadges(badges: Badge[]): void {
        try {
            localStorage.setItem(this.BADGES_KEY, JSON.stringify(badges));
        } catch (error) {
            console.error('Failed to store badges:', error);
        }
    }
}

// Export singleton instance
export const oracleRewardsService = new OracleRewardsService();
export default oracleRewardsService;
