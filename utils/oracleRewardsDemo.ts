/**
 * Demo script to populate Oracle Rewards with sample data
 * This can be used to demonstrate the rewards system functionality
 */

import { oracleRewardsService } from '../services/oracleRewardsService';

export const populateSampleRewardsData = async () => {
    // Sample rewards data
    const sampleRewards = {
        totalPoints: 2450,
        weeklyPoints: 340,
        seasonalPoints: 2450,
        level: 5,
        nextLevelPoints: 50,
        achievements: [],
        badges: [],
        availableTitles: ['Oracle Challenger', 'Streak Master'],
        activeTitle: 'Oracle Challenger',
        streakMultiplier: 1.3,
        seasonRank: 12,
        weeklyRank: 8
    };

    // Sample unlocked achievements
    const sampleAchievements = [
        {
            id: 'first-win',
            title: 'First Victory',
            description: 'Win your first Oracle challenge',
            icon: '🎯',
            category: 'PREDICTION',
            difficulty: 'BRONZE',
            requirements: { type: 'WIN_COUNT', target: 1 },
            points: 50,
            unlockedAt: new Date('2025-01-10').toISOString()
        },
        {
            id: 'ten-wins',
            title: 'Oracle Challenger',
            description: 'Win 10 Oracle challenges',
            icon: '⚔️',
            category: 'PREDICTION',
            difficulty: 'SILVER',
            requirements: { type: 'WIN_COUNT', target: 10 },
            points: 200,
            unlockedAt: new Date('2025-01-18').toISOString()
        },
        {
            id: 'three-streak',
            title: 'Hot Streak',
            description: 'Win 3 challenges in a row',
            icon: '🔥',
            category: 'STREAK',
            difficulty: 'BRONZE',
            requirements: { type: 'STREAK', target: 3 },
            points: 100,
            unlockedAt: new Date('2025-01-15').toISOString()
        },
        {
            id: 'five-streak',
            title: 'On Fire',
            description: 'Win 5 challenges in a row',
            icon: '🌟',
            category: 'STREAK',
            difficulty: 'SILVER',
            requirements: { type: 'STREAK', target: 5 },
            points: 250,
            unlockedAt: new Date('2025-01-20').toISOString()
        },
        {
            id: 'point-collector',
            title: 'Point Collector',
            description: 'Earn 1,000 total points',
            icon: '💰',
            category: 'MILESTONE',
            difficulty: 'SILVER',
            requirements: { type: 'POINTS_TOTAL', target: 1000 },
            points: 200,
            unlockedAt: new Date('2025-01-25').toISOString()
        }
    ];

    // Sample badges
    const sampleBadges = [
        {
            id: 'rookie',
            name: 'Rookie',
            description: 'Complete your first challenge',
            icon: '🆕',
            color: 'bg-green-500',
            rarity: 'COMMON',
            earnedAt: new Date('2025-01-10').toISOString()
        },
        {
            id: 'veteran',
            name: 'Veteran',
            description: 'Complete 50 challenges',
            icon: '⭐',
            color: 'bg-blue-500',
            rarity: 'RARE',
            earnedAt: new Date('2025-01-28').toISOString()
        },
        {
            id: 'oracle-nemesis',
            name: 'Oracle Nemesis',
            description: 'Beat Oracle 10 times in high-confidence predictions',
            icon: '⚔️',
            color: 'bg-red-500',
            rarity: 'EPIC',
            earnedAt: new Date('2025-02-01').toISOString()
        }
    ];

    // Store sample data in localStorage
    localStorage.setItem('oracleRewards', JSON.stringify(sampleRewards));
    localStorage.setItem('oracleAchievements', JSON.stringify(sampleAchievements));
    localStorage.setItem('oracleBadges', JSON.stringify(sampleBadges));

    console.log('✅ Sample Oracle rewards data populated!');
    console.log('🏆 Level 5 with 2,450 total points');
    console.log('🎯 5 achievements unlocked');
    console.log('🏅 3 badges earned');
    console.log('🔥 1.3x streak multiplier active');
    console.log('📊 Rewards Dashboard now has data to display');
    
    return {
        rewards: sampleRewards,
        achievements: sampleAchievements,
        badges: sampleBadges,
        summary: {
            level: 5,
            totalPoints: 2450,
            achievementsCount: 5,
            badgesCount: 3,
            weeklyRank: 8,
            seasonRank: 12
        }
    };
};

// Function to clear sample rewards data
export const clearSampleRewardsData = () => {
    localStorage.removeItem('oracleRewards');
    localStorage.removeItem('oracleAchievements');
    localStorage.removeItem('oracleBadges');
    console.log('🧹 Sample rewards data cleared');
};

// Function to check if sample rewards data exists
export const hasSampleRewardsData = (): boolean => {
    const rewards = localStorage.getItem('oracleRewards');
    const achievements = localStorage.getItem('oracleAchievements');
    const badges = localStorage.getItem('oracleBadges');
    return !!(rewards && achievements && badges);
};

// Function to simulate earning a reward
export const simulateRewardEarning = async (challengeType = 'PLAYER_PERFORMANCE') => {
    try {
        const rewardCalc = await oracleRewardsService.calculateChallengeReward(
            true,  // isWin
            85,    // oracleConfidence
            3,     // currentStreak
            challengeType,
            true   // beatOracle
        );

        await oracleRewardsService.applyRewards(rewardCalc);
        
        console.log('🎉 Simulated reward earning:');
        console.log(`💰 ${rewardCalc.totalPoints} total points`);
        console.log(`🔥 ${rewardCalc.streakBonus} streak bonus`);
        console.log(`🎯 ${rewardCalc.accuracyBonus} Oracle beaten bonus`);
        
        if (rewardCalc.newAchievements.length > 0) {
            console.log(`🏆 ${rewardCalc.newAchievements.length} new achievements`);
        }
        
        if (rewardCalc.levelUp) {
            console.log('⬆️ Level up!');
        }
        
        return rewardCalc;
    } catch (error) {
        console.error('Failed to simulate reward earning:', error);
        return null;
    }
};

console.log('🎮 Oracle Rewards Demo Utils Loaded');
console.log('💡 Use populateSampleRewardsData() to add demo data');
console.log('🧹 Use clearSampleRewardsData() to remove demo data');
console.log('❓ Use hasSampleRewardsData() to check if demo data exists');
console.log('🎉 Use simulateRewardEarning() to test reward notifications');
