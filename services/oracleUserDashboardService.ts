/**
 * Oracle User Dashboard Service
 * Manages user prediction analytics, performance metrics, and personalized insights
 */

import { oracleDatabaseService } from './oracleDatabaseOptimizationService';
import { oraclePerformanceCache } from './oraclePerformanceCacheService';

export interface UserDashboardStats {
    userId: string;
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    totalPoints: number;
    rank: number;
    weeklyPerformance: WeeklyPerformance[];
    categoryBreakdown: CategoryBreakdown[];
    streakData: StreakData;
    confidenceMetrics: ConfidenceMetrics;
    compareToOracle: OracleComparison;
}

export interface WeeklyPerformance {
    week: number;
    predictions: number;
    correct: number;
    accuracy: number;
    points: number;
    avgConfidence: number;
}

export interface CategoryBreakdown {
    category: string;
    total: number;
    correct: number;
    accuracy: number;
    avgConfidence: number;
    improvement: number; // Week-over-week change
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    streakType: 'correct' | 'incorrect';
    recentResults: boolean[]; // Last 10 predictions
}

export interface ConfidenceMetrics {
    averageConfidence: number;
    calibrationScore: number; // How well confidence matches accuracy
    overconfidenceBias: number;
    confidenceByCategory: { [category: string]: number };
}

export interface OracleComparison {
    userAccuracy: number;
    oracleAccuracy: number;
    agreementRate: number; // How often user agrees with Oracle
    outperformanceRate: number; // How often user is right when Oracle is wrong
}

export interface PersonalizedInsight {
    id: string;
    type: 'strength' | 'improvement' | 'trend' | 'recommendation';
    category: string;
    title: string;
    description: string;
    actionableAdvice?: string;
    priority: 'high' | 'medium' | 'low';
    metric?: number;
    trend?: 'improving' | 'declining' | 'stable';
    evidence: string[];
}

export interface UserPredictionHistory {
    id: string;
    week: number;
    season: number;
    question: string;
    category: string;
    userChoice: number;
    userConfidence: number;
    oracleChoice: number;
    oracleConfidence: number;
    actualResult?: number;
    isResolved: boolean;
    isCorrect?: boolean;
    points: number;
    submittedAt: Date;
    resolvedAt?: Date;
    reasoning?: string;
}

class OracleUserDashboardService {
    private readonly CACHE_TTL = 300; // 5 minutes
    private readonly INSIGHTS_CACHE_TTL = 1800; // 30 minutes

    /**
     * Get comprehensive dashboard statistics for a user
     */
    async getUserDashboardStats(userId: string, season: number = 2024): Promise<UserDashboardStats> {
        const cacheKey = `user_dashboard_${userId}_${season}`;
        
        // Check cache first
        let stats = oraclePerformanceCache.getUserStats(cacheKey);
        if (stats) {
            return stats;
        }

        try {
            // Fetch user prediction data
            const [userStats, weeklyData, categoryData, streakData, confidenceData, oracleComparison] = await Promise.all([
                this.getUserBasicStats(userId),
                this.getUserWeeklyPerformance(userId, season),
                this.getUserCategoryBreakdown(userId, season),
                this.getUserStreakData(userId),
                this.getUserConfidenceMetrics(userId, season),
                this.getOracleComparison(userId, season)
            ]);

            stats = {
                userId,
                ...userStats,
                weeklyPerformance: weeklyData,
                categoryBreakdown: categoryData,
                streakData,
                confidenceMetrics: confidenceData,
                compareToOracle: oracleComparison
            };

            // Cache the result
            oraclePerformanceCache.cacheUserStats(cacheKey, stats);
            return stats;

        } catch (error) {
            console.error('Failed to fetch user dashboard stats:', error);
            throw new Error('Unable to load dashboard statistics');
        }
    }

    /**
     * Get personalized insights for a user
     */
    async getPersonalizedInsights(userId: string, season: number = 2024): Promise<PersonalizedInsight[]> {
        const cacheKey = `user_insights_${userId}_${season}`;
        
        // Check cache first
        let insights = oraclePerformanceCache.getUserStats(cacheKey);
        if (insights) {
            return insights;
        }

        try {
            const stats = await this.getUserDashboardStats(userId, season);
            insights = await this.generateInsights(stats);

            // Cache insights for longer period
            oraclePerformanceCache.cacheUserStats(cacheKey, insights);
            return insights;

        } catch (error) {
            console.error('Failed to generate insights:', error);
            return [];
        }
    }

    /**
     * Get user prediction history with filters
     */
    async getUserPredictionHistory(
        userId: string, 
        options: {
            limit?: number;
            offset?: number;
            category?: string;
            timeframe?: 'week' | 'month' | 'season' | 'all';
            onlyResolved?: boolean;
        } = {}
    ): Promise<{ predictions: UserPredictionHistory[]; total: number }> {
        const { limit = 20, offset = 0, category, timeframe = 'all', onlyResolved = false } = options;

        try {
            // Use optimized database service
            const rawPredictions = await oracleDatabaseService.getUserPredictions(userId, limit + 10, offset);
            
            // Transform and filter data
            let predictions = rawPredictions.map(this.transformPredictionData);

            // Apply filters
            if (category && category !== 'all') {
                predictions = predictions.filter(p => p.category === category);
            }

            if (onlyResolved) {
                predictions = predictions.filter(p => p.isResolved);
            }

            // Apply timeframe filter
            if (timeframe !== 'all') {
                const now = new Date();
                const cutoff = new Date();
                
                switch (timeframe) {
                    case 'week':
                        cutoff.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        cutoff.setMonth(now.getMonth() - 1);
                        break;
                    case 'season':
                        cutoff.setMonth(now.getMonth() - 4);
                        break;
                }
                
                predictions = predictions.filter(p => p.submittedAt >= cutoff);
            }

            return {
                predictions: predictions.slice(0, limit),
                total: predictions.length
            };

        } catch (error) {
            console.error('Failed to fetch prediction history:', error);
            throw new Error('Unable to load prediction history');
        }
    }

    /**
     * Generate personalized insights based on user performance
     */
    private async generateInsights(stats: UserDashboardStats): Promise<PersonalizedInsight[]> {
        const insights: PersonalizedInsight[] = [];

        // Strength insights
        if (stats.categoryBreakdown.length > 0) {
            const bestCategory = stats.categoryBreakdown.reduce((best, cat) => 
                cat.accuracy > best.accuracy ? cat : best, stats.categoryBreakdown[0]
            );

            if (bestCategory.accuracy > 70) {
                insights.push(this.createStrengthInsight(bestCategory));
            }
        }

        // Improvement opportunities
        if (stats.categoryBreakdown.length > 0) {
            const worstCategory = stats.categoryBreakdown.reduce((worst, cat) => 
                cat.accuracy < worst.accuracy ? cat : worst, stats.categoryBreakdown[0]
            );

            if (worstCategory.accuracy < 60 && worstCategory.total >= 5) {
                insights.push(this.createImprovementInsight(worstCategory, stats.accuracy));
            }
        }

        // Add other insights
        insights.push(...this.generateTrendInsights(stats));
        insights.push(...this.generateConfidenceInsights(stats));
        insights.push(...this.generateOracleComparisonInsights(stats));
        insights.push(...this.generateRecommendationInsights(stats));

        return insights.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    private createStrengthInsight(category: CategoryBreakdown): PersonalizedInsight {
        return {
            id: `strength_${category.category}`,
            type: 'strength',
            category: category.category,
            title: `${category.category} Expert`,
            description: `You excel at ${category.category.toLowerCase()} predictions with ${category.accuracy}% accuracy`,
            priority: 'high',
            metric: category.accuracy,
            evidence: [
                `${category.correct}/${category.total} correct predictions`,
                `Average confidence: ${category.avgConfidence}%`
            ]
        };
    }

    private createImprovementInsight(category: CategoryBreakdown, overallAccuracy: number): PersonalizedInsight {
        return {
            id: `improvement_${category.category}`,
            type: 'improvement',
            category: category.category,
            title: `Focus on ${category.category}`,
            description: `Your ${category.category.toLowerCase()} accuracy is below average at ${category.accuracy}%`,
            actionableAdvice: 'Consider studying recent trends and Oracle reasoning in this category',
            priority: 'medium',
            metric: category.accuracy,
            evidence: [
                `Only ${category.correct}/${category.total} correct`,
                `Room for ${Math.round(overallAccuracy - category.accuracy)}% improvement`
            ]
        };
    }

    private generateTrendInsights(stats: UserDashboardStats): PersonalizedInsight[] {
        const insights: PersonalizedInsight[] = [];
        
        const recentWeeks = stats.weeklyPerformance.slice(-3);
        const earlierWeeks = stats.weeklyPerformance.slice(-6, -3);
        
        if (recentWeeks.length < 2 || earlierWeeks.length < 2) {
            return insights;
        }

        const recentAvg = recentWeeks.reduce((sum, w) => sum + w.accuracy, 0) / recentWeeks.length;
        const earlierAvg = earlierWeeks.reduce((sum, w) => sum + w.accuracy, 0) / earlierWeeks.length;
        const improvement = recentAvg - earlierAvg;

        if (Math.abs(improvement) > 5) {
            const isImproving = improvement > 0;
            
            insights.push({
                id: 'trend_performance',
                type: 'trend',
                category: 'Overall',
                title: isImproving ? 'Improving Performance' : 'Declining Performance',
                description: `Your accuracy has ${isImproving ? 'improved' : 'declined'} by ${Math.abs(improvement).toFixed(1)}% in recent weeks`,
                priority: isImproving ? 'medium' : 'high',
                metric: Math.abs(improvement),
                trend: isImproving ? 'improving' : 'declining',
                evidence: [
                    `Recent 3 weeks: ${recentAvg.toFixed(1)}%`,
                    `Previous 3 weeks: ${earlierAvg.toFixed(1)}%`
                ]
            });
        }
        
        return insights;
    }

    private generateConfidenceInsights(stats: UserDashboardStats): PersonalizedInsight[] {
        const insights: PersonalizedInsight[] = [];
        
        if (stats.confidenceMetrics.overconfidenceBias > 10) {
            insights.push({
                id: 'confidence_calibration',
                type: 'improvement',
                category: 'Confidence',
                title: 'Confidence Calibration',
                description: 'Your confidence tends to be higher than your actual accuracy',
                actionableAdvice: 'Consider being more conservative with confidence levels, especially on uncertain predictions',
                priority: 'medium',
                metric: stats.confidenceMetrics.overconfidenceBias,
                evidence: [
                    `Average confidence: ${stats.confidenceMetrics.averageConfidence}%`,
                    `Actual accuracy: ${stats.accuracy}%`
                ]
            });
        }
        
        return insights;
    }

    private generateOracleComparisonInsights(stats: UserDashboardStats): PersonalizedInsight[] {
        const insights: PersonalizedInsight[] = [];
        
        if (stats.compareToOracle.outperformanceRate > 30) {
            insights.push({
                id: 'oracle_outperformance',
                type: 'strength',
                category: 'Oracle Comparison',
                title: 'Independent Thinking',
                description: `You outperform Oracle ${stats.compareToOracle.outperformanceRate}% of the time when you disagree`,
                priority: 'high',
                metric: stats.compareToOracle.outperformanceRate,
                evidence: [
                    `Agreement rate: ${stats.compareToOracle.agreementRate}%`,
                    'Strong independent analysis skills'
                ]
            });
        }
        
        return insights;
    }

    private generateRecommendationInsights(stats: UserDashboardStats): PersonalizedInsight[] {
        const insights: PersonalizedInsight[] = [];
        
        const underusedCategories = stats.categoryBreakdown.filter(cat => cat.total < 5);
        if (underusedCategories.length > 0) {
            const bestUnderusedCategory = underusedCategories.reduce((best, cat) => 
                cat.accuracy > best.accuracy ? cat : best, underusedCategories[0]
            );

            insights.push({
                id: `recommendation_${bestUnderusedCategory.category}`,
                type: 'recommendation',
                category: bestUnderusedCategory.category,
                title: `Explore ${bestUnderusedCategory.category}`,
                description: 'You show potential in this category but have limited predictions',
                actionableAdvice: `Try making more ${bestUnderusedCategory.category.toLowerCase()} predictions to build expertise`,
                priority: 'low',
                evidence: [
                    `Current accuracy: ${bestUnderusedCategory.accuracy}%`,
                    `Only ${bestUnderusedCategory.total} predictions made`
                ]
            });
        }
        
        return insights;
    }

    /**
     * Helper methods for data transformation and calculations
     */
    private async getUserBasicStats(userId: string) {
        const stats = await oracleDatabaseService.getUserAccuracy(userId);
        return {
            totalPredictions: stats.total_predictions || 0,
            correctPredictions: stats.correct_predictions || 0,
            accuracy: stats.accuracy || 0,
            totalPoints: stats.correct_predictions * 10 || 0,
            rank: 0 // Will be calculated separately
        };
    }

    private async getUserWeeklyPerformance(userId: string, season: number): Promise<WeeklyPerformance[]> {
        // This would typically query the database for weekly breakdown
        // For now, return mock data structure
        return [];
    }

    private async getUserCategoryBreakdown(userId: string, season: number): Promise<CategoryBreakdown[]> {
        // This would typically query the database for category breakdown
        // For now, return mock data structure
        return [];
    }

    private async getUserStreakData(userId: string): Promise<StreakData> {
        // This would typically analyze recent predictions for streaks
        return {
            currentStreak: 0,
            longestStreak: 0,
            streakType: 'correct',
            recentResults: []
        };
    }

    private async getUserConfidenceMetrics(userId: string, season: number): Promise<ConfidenceMetrics> {
        // This would typically analyze confidence vs accuracy
        return {
            averageConfidence: 0,
            calibrationScore: 0,
            overconfidenceBias: 0,
            confidenceByCategory: {}
        };
    }

    private async getOracleComparison(userId: string, season: number): Promise<OracleComparison> {
        // This would typically compare user vs Oracle performance
        return {
            userAccuracy: 0,
            oracleAccuracy: 0,
            agreementRate: 0,
            outperformanceRate: 0
        };
    }

    private transformPredictionData(rawPrediction: any): UserPredictionHistory {
        return {
            id: rawPrediction.id,
            week: rawPrediction.week || 1,
            season: rawPrediction.season || 2024,
            question: rawPrediction.question || '',
            category: this.inferCategory(rawPrediction.question),
            userChoice: rawPrediction.user_choice,
            userConfidence: rawPrediction.confidence || 50,
            oracleChoice: rawPrediction.oracle_choice || 0,
            oracleConfidence: rawPrediction.oracle_confidence || 50,
            actualResult: rawPrediction.actual_result,
            isResolved: Boolean(rawPrediction.is_resolved),
            isCorrect: rawPrediction.actual_result !== undefined 
                ? rawPrediction.user_choice === rawPrediction.actual_result
                : undefined,
            points: rawPrediction.actual_result !== undefined && rawPrediction.user_choice === rawPrediction.actual_result ? 10 : 0,
            submittedAt: new Date(rawPrediction.submitted_at),
            resolvedAt: rawPrediction.resolved_at ? new Date(rawPrediction.resolved_at) : undefined,
            reasoning: rawPrediction.reasoning
        };
    }

    private inferCategory(question: string): string {
        const questionLower = question.toLowerCase();
        
        if (questionLower.includes('player') || questionLower.includes('yards') || questionLower.includes('touchdown') || questionLower.includes('reception')) {
            return 'Player Performance';
        }
        if (questionLower.includes('team') || questionLower.includes('win') || questionLower.includes('score')) {
            return 'Team Performance';
        }
        if (questionLower.includes('total') || questionLower.includes('over') || questionLower.includes('under')) {
            return 'Game Totals';
        }
        if (questionLower.includes('first') || questionLower.includes('milestone')) {
            return 'Statistical Milestones';
        }
        
        return 'Game Outcomes';
    }

    /**
     * Clear user dashboard cache
     */
    clearUserCache(userId: string, season?: number): void {
        // Use available cache clearing methods
        oraclePerformanceCache.clearAllCache(); // Clear all cache as specific user clearing not available
    }
}

export const oracleUserDashboardService = new OracleUserDashboardService();
