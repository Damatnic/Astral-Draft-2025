/**
 * Demo script to populate Oracle Analytics with sample data
 * This can be used to demonstrate the analytics dashboard functionality
 */

export const populateSampleAnalyticsData = () => {
    // Sample Oracle predictions data
    const samplePredictions = [
        {
            id: 'pred-week1-1',
            week: 1,
            type: 'PLAYER_PERFORMANCE',
            question: 'Who will score the most fantasy points?',
            oracleChoice: 1,
            confidence: 85,
            actualResult: 1,
            isCorrect: true,
            recordedAt: new Date('2025-01-15').toISOString()
        },
        {
            id: 'pred-week1-2',
            week: 1,
            type: 'GAME_OUTCOME',
            question: 'Which team will win Chiefs vs Bills?',
            oracleChoice: 0,
            confidence: 72,
            actualResult: 1,
            isCorrect: false,
            recordedAt: new Date('2025-01-15').toISOString()
        },
        {
            id: 'pred-week1-3',
            week: 1,
            type: 'WEEKLY_SCORING',
            question: 'Will any player score over 30 points?',
            oracleChoice: 1,
            confidence: 68,
            actualResult: 1,
            isCorrect: true,
            recordedAt: new Date('2025-01-15').toISOString()
        },
        {
            id: 'pred-week2-1',
            week: 2,
            type: 'PLAYER_PERFORMANCE',
            question: 'Who will have the most rushing yards?',
            oracleChoice: 2,
            confidence: 91,
            actualResult: 2,
            isCorrect: true,
            recordedAt: new Date('2025-01-22').toISOString()
        },
        {
            id: 'pred-week2-2',
            week: 2,
            type: 'GAME_OUTCOME',
            question: 'Which game will have the highest score?',
            oracleChoice: 1,
            confidence: 76,
            actualResult: 1,
            isCorrect: true,
            recordedAt: new Date('2025-01-22').toISOString()
        },
        {
            id: 'pred-week2-3',
            week: 2,
            type: 'WEATHER_IMPACT',
            question: 'Will weather affect scoring in outdoor games?',
            oracleChoice: 0,
            confidence: 63,
            actualResult: 1,
            isCorrect: false,
            recordedAt: new Date('2025-01-22').toISOString()
        }
    ];

    // Sample user challenges data
    const sampleUserChallenges = [
        {
            id: 'challenge-week1-1',
            week: 1,
            type: 'PLAYER_PERFORMANCE',
            userPrediction: 1,
            actualResult: 1,
            userCorrect: true,
            points: 45,
            timestamp: new Date('2025-01-15').toISOString()
        },
        {
            id: 'challenge-week1-2',
            week: 1,
            type: 'GAME_OUTCOME',
            userPrediction: 1,
            actualResult: 1,
            userCorrect: true,
            points: 35,
            timestamp: new Date('2025-01-15').toISOString()
        },
        {
            id: 'challenge-week1-3',
            week: 1,
            type: 'WEEKLY_SCORING',
            userPrediction: 0,
            actualResult: 1,
            userCorrect: false,
            points: 0,
            timestamp: new Date('2025-01-15').toISOString()
        },
        {
            id: 'challenge-week2-1',
            week: 2,
            type: 'PLAYER_PERFORMANCE',
            userPrediction: 2,
            actualResult: 2,
            userCorrect: true,
            points: 50,
            timestamp: new Date('2025-01-22').toISOString()
        },
        {
            id: 'challenge-week2-2',
            week: 2,
            type: 'GAME_OUTCOME',
            userPrediction: 0,
            actualResult: 1,
            userCorrect: false,
            points: 0,
            timestamp: new Date('2025-01-22').toISOString()
        }
    ];

    // Store sample data in localStorage
    localStorage.setItem('oraclePredictions', JSON.stringify(samplePredictions));
    localStorage.setItem('userChallenges', JSON.stringify(sampleUserChallenges));

    console.log('✅ Sample Oracle analytics data populated!');
    console.log('🎯 Oracle Accuracy: 66.7% (4/6 predictions correct)');
    console.log('👤 User Win Rate: 60% (3/5 challenges won)');
    console.log('📊 Analytics Dashboard now has data to display');
    
    return {
        predictions: samplePredictions,
        userChallenges: sampleUserChallenges,
        summary: {
            oracleAccuracy: 66.7,
            userWinRate: 60,
            totalPredictions: 6,
            totalChallenges: 5
        }
    };
};

// Function to clear sample data
export const clearSampleData = () => {
    localStorage.removeItem('oraclePredictions');
    localStorage.removeItem('userChallenges');
    console.log('🧹 Sample data cleared');
};

// Function to check if sample data exists
export const hasSampleData = (): boolean => {
    const predictions = localStorage.getItem('oraclePredictions');
    const challenges = localStorage.getItem('userChallenges');
    return !!(predictions && challenges);
};

console.log('📊 Oracle Analytics Demo Utils Loaded');
console.log('💡 Use populateSampleAnalyticsData() to add demo data');
console.log('🧹 Use clearSampleData() to remove demo data');
console.log('❓ Use hasSampleData() to check if demo data exists');
