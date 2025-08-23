/**
 * Oracle Historical Analytics Service
 * Advanced historical prediction tracking, trend analysis, and performance metrics
 * Extends the base OracleAnalyticsService with comprehensive historical data management
 */

import { OracleAnalytics, AccuracyTrend, PredictionTypeStats, UserInsight } from './oracleAnalyticsService';
import { OraclePrediction, PredictionType } from './oraclePredictionService';

export interface HistoricalPredictionRecord {
    id: string;
    predictionId: string;
    week: number;
    season: string;
    type: PredictionType;
    question: string;
    oracleChoice: number;
    confidence: number;
    actualResult?: number;
    isCorrect?: boolean;
    userPrediction?: number;
    userCorrect?: boolean;
    recordedAt: string;
    completedAt?: string;
    reasoning: string;
    dataPoints: string[];
    metadata: PredictionMetadata;
}

export interface PredictionMetadata {
    gameWeather?: string;
    injuryReport?: string[];
    lineMovement?: number;
    publicBetting?: number;
    expertConsensus?: number;
    marketSentiment?: 'bullish' | 'bearish' | 'neutral';
    contextualFactors?: string[];
}

export interface HistoricalTrendAnalysis {
    timeframe: 'weekly' | 'monthly' | 'seasonal' | 'yearly';
    accuracyTrend: TrendPoint[];
    confidenceTrend: TrendPoint[];
    typesPerformance: TypePerformanceTrend[];
    seasonalPatterns: SeasonalPattern[];
    improvementMetrics: ImprovementMetrics;
    predictionVolume: VolumeMetrics;
}

export interface TrendPoint {
    period: string;
    value: number;
    count: number;
    change?: number;
    percentChange?: number;
}

export interface TypePerformanceTrend {
    type: PredictionType;
    periods: TrendPoint[];
    overallTrend: 'improving' | 'declining' | 'stable';
    trendStrength: number;
    bestPeriod: string;
    worstPeriod: string;
}

export interface SeasonalPattern {
    pattern: 'early_season' | 'mid_season' | 'late_season' | 'playoffs';
    averageAccuracy: number;
    predictionVolume: number;
    confidenceLevel: number;
    strongestTypes: PredictionType[];
    insights: string[];
}

export interface ImprovementMetrics {
    accuracyImprovement: number;
    confidenceCalibration: number;
    streakLength: number;
    consistencyScore: number;
    adaptabilityIndex: number;
    learningVelocity: number;
}

export interface VolumeMetrics {
    totalPredictions: number;
    dailyAverage: number;
    weeklyAverage: number;
    peakPeriods: string[];
    lowPeriods: string[];
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface AccuracyBreakdown {
    overall: AccuracyStats;
    byType: Record<PredictionType, AccuracyStats>;
    byConfidence: Record<string, AccuracyStats>;
    byTimeframe: Record<string, AccuracyStats>;
    byWeek: Record<number, AccuracyStats>;
    contextual: ContextualAccuracy[];
}

export interface AccuracyStats {
    accuracy: number;
    totalPredictions: number;
    correctPredictions: number;
    averageConfidence: number;
    confidenceRange: [number, number];
    calibrationScore: number;
}

export interface ContextualAccuracy {
    context: string;
    factor: string;
    accuracy: number;
    sampleSize: number;
    significance: number;
}

export interface PerformanceComparison {
    timeframePrevious: string;
    timeframeCurrent: string;
    accuracyChange: number;
    confidenceChange: number;
    volumeChange: number;
    typeChanges: Record<PredictionType, number>;
    significantImprovements: string[];
    areasOfConcern: string[];
}

export interface AdvancedInsights {
    streakAnalysis: StreakAnalysis;
    confidenceAnalysis: ConfidenceAnalysis;
    typeSpecialization: TypeSpecializationAnalysis;
    contextualFactors: ContextualFactorAnalysis;
    predictivePatterns: PredictivePatterns;
    recommendations: AdvancedRecommendation[];
}

export interface StreakAnalysis {
    currentStreak: number;
    longestStreak: number;
    streakType: 'correct' | 'incorrect' | 'mixed';
    streakProbability: number;
    breakPatterns: string[];
    maintainanceStrategies: string[];
}

export interface ConfidenceAnalysis {
    overconfidenceIndex: number;
    underconfidenceIndex: number;
    calibrationCurve: CalibrationPoint[];
    optimalConfidenceRange: [number, number];
    confidenceDistribution: Record<string, number>;
    reliabilityScore: number;
}

export interface CalibrationPoint {
    confidenceRange: [number, number];
    expectedAccuracy: number;
    actualAccuracy: number;
    sampleSize: number;
}

export interface TypeSpecializationAnalysis {
    strongestTypes: PredictionType[];
    weakestTypes: PredictionType[];
    specializationIndex: number;
    consistencyAcrossTypes: number;
    typeProgressions: Record<PredictionType, number>;
    crossTypeCorrelations: Record<string, number>;
}

export interface ContextualFactorAnalysis {
    weatherImpact: FactorImpact;
    injuryImpact: FactorImpact;
    lineMovementImpact: FactorImpact;
    publicBettingImpact: FactorImpact;
    sentimentImpact: FactorImpact;
    combinedFactorEffects: CombinedFactorEffect[];
}

export interface FactorImpact {
    positiveCorrelation: boolean;
    impactStrength: number;
    significanceLevel: number;
    optimalConditions: string[];
    avoidanceConditions: string[];
}

export interface CombinedFactorEffect {
    factors: string[];
    combinedImpact: number;
    frequency: number;
    accuracy: number;
    recommendation: string;
}

export interface PredictivePatterns {
    timeBasedPatterns: TimePattern[];
    sequencePatterns: SequencePattern[];
    contextPatterns: ContextPattern[];
    emergingPatterns: EmergingPattern[];
}

export interface TimePattern {
    pattern: string;
    frequency: number;
    accuracy: number;
    confidence: number;
    nextOccurrence?: string;
}

export interface SequencePattern {
    sequence: string[];
    frequency: number;
    nextLikelyOutcome: string;
    confidence: number;
}

export interface ContextPattern {
    context: Record<string, any>;
    accuracy: number;
    frequency: number;
    significance: number;
}

export interface EmergingPattern {
    pattern: string;
    strength: number;
    recency: number;
    potential: number;
    description: string;
}

export interface AdvancedRecommendation {
    type: 'STRATEGY' | 'FOCUS_AREA' | 'IMPROVEMENT' | 'WARNING' | 'OPPORTUNITY';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
    expectedImpact: number;
    timeframe: string;
    metrics: string[];
    supportingData: any;
}

class OracleHistoricalAnalyticsService {
    private readonly HISTORICAL_DATA_KEY = 'oracleHistoricalData';
    private readonly TREND_CACHE_KEY = 'oracleTrendCache';
    private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

    /**
     * Store historical prediction record
     */
    async storeHistoricalRecord(
        prediction: OraclePrediction,
        actualResult?: number,
        userPrediction?: number,
        metadata?: Partial<PredictionMetadata>
    ): Promise<void> {
        const records = await this.getHistoricalRecords();
        
        const historicalRecord: HistoricalPredictionRecord = {
            id: `hist_${prediction.id}_${Date.now()}`,
            predictionId: prediction.id,
            week: prediction.week,
            season: new Date().getFullYear().toString(),
            type: prediction.type,
            question: prediction.question,
            oracleChoice: prediction.oracleChoice,
            confidence: prediction.confidence,
            actualResult,
            isCorrect: actualResult !== undefined ? prediction.oracleChoice === actualResult : undefined,
            userPrediction,
            userCorrect: userPrediction !== undefined && actualResult !== undefined 
                ? userPrediction === actualResult : undefined,
            recordedAt: prediction.timestamp,
            completedAt: actualResult !== undefined ? new Date().toISOString() : undefined,
            reasoning: prediction.reasoning,
            dataPoints: prediction.dataPoints,
            metadata: {
                gameWeather: metadata?.gameWeather,
                injuryReport: metadata?.injuryReport || [],
                lineMovement: metadata?.lineMovement,
                publicBetting: metadata?.publicBetting,
                expertConsensus: metadata?.expertConsensus,
                marketSentiment: metadata?.marketSentiment,
                contextualFactors: metadata?.contextualFactors || []
            }
        };

        const existingIndex = records.findIndex(r => r.predictionId === prediction.id);
        if (existingIndex >= 0) {
            records[existingIndex] = historicalRecord;
        } else {
            records.push(historicalRecord);
        }

        await this.storeHistoricalRecords(records);
        await this.invalidateTrendCache();
    }

    /**
     * Get comprehensive historical trend analysis
     */
    async getHistoricalTrendAnalysis(
        timeframe: 'weekly' | 'monthly' | 'seasonal' | 'yearly' = 'monthly'
    ): Promise<HistoricalTrendAnalysis> {
        const cacheKey = `${this.TREND_CACHE_KEY}_${timeframe}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        const records = await this.getCompletedHistoricalRecords();
        
        const analysis: HistoricalTrendAnalysis = {
            timeframe,
            accuracyTrend: await this.calculateAccuracyTrend(records, timeframe),
            confidenceTrend: await this.calculateConfidenceTrend(records, timeframe),
            typesPerformance: await this.calculateTypePerformanceTrends(records, timeframe),
            seasonalPatterns: await this.analyzeSeasonalPatterns(records),
            improvementMetrics: await this.calculateImprovementMetrics(records),
            predictionVolume: await this.calculateVolumeMetrics(records, timeframe)
        };

        this.setCachedData(cacheKey, analysis);
        return analysis;
    }

    /**
     * Get detailed accuracy breakdown
     */
    async getAccuracyBreakdown(): Promise<AccuracyBreakdown> {
        const records = await this.getCompletedHistoricalRecords();
        
        return {
            overall: this.calculateAccuracyStats(records),
            byType: this.calculateAccuracyByType(records),
            byConfidence: this.calculateAccuracyByConfidence(records),
            byTimeframe: this.calculateAccuracyByTimeframe(records),
            byWeek: this.calculateAccuracyByWeek(records),
            contextual: await this.calculateContextualAccuracy(records)
        };
    }

    /**
     * Compare performance between timeframes
     */
    async getPerformanceComparison(
        currentPeriod: string,
        previousPeriod: string
    ): Promise<PerformanceComparison> {
        const records = await this.getCompletedHistoricalRecords();
        
        const currentRecords = this.filterRecordsByPeriod(records, currentPeriod);
        const previousRecords = this.filterRecordsByPeriod(records, previousPeriod);

        const currentStats = this.calculateAccuracyStats(currentRecords);
        const previousStats = this.calculateAccuracyStats(previousRecords);

        return {
            timeframePrevious: previousPeriod,
            timeframeCurrent: currentPeriod,
            accuracyChange: currentStats.accuracy - previousStats.accuracy,
            confidenceChange: currentStats.averageConfidence - previousStats.averageConfidence,
            volumeChange: currentRecords.length - previousRecords.length,
            typeChanges: this.calculateTypeChanges(currentRecords, previousRecords),
            significantImprovements: this.identifySignificantImprovements(currentStats, previousStats),
            areasOfConcern: this.identifyAreasOfConcern(currentStats, previousStats)
        };
    }

    /**
     * Generate advanced insights from historical data
     */
    async getAdvancedInsights(): Promise<AdvancedInsights> {
        const records = await this.getCompletedHistoricalRecords();
        
        return {
            streakAnalysis: await this.analyzeStreaks(records),
            confidenceAnalysis: await this.analyzeConfidence(records),
            typeSpecialization: await this.analyzeTypeSpecialization(records),
            contextualFactors: await this.analyzeContextualFactors(records),
            predictivePatterns: await this.analyzePredictivePatterns(records),
            recommendations: await this.generateAdvancedRecommendations(records)
        };
    }

    /**
     * Export historical data for analysis
     */
    async exportHistoricalData(
        format: 'json' | 'csv' = 'json',
        filters?: {
            startDate?: string;
            endDate?: string;
            types?: PredictionType[];
            minConfidence?: number;
        }
    ): Promise<string> {
        let records = await this.getHistoricalRecords();
        
        // Apply filters
        if (filters) {
            records = records.filter(record => {
                if (filters.startDate && record.recordedAt < filters.startDate) return false;
                if (filters.endDate && record.recordedAt > filters.endDate) return false;
                if (filters.types && !filters.types.includes(record.type)) return false;
                if (filters.minConfidence && record.confidence < filters.minConfidence) return false;
                return true;
            });
        }

        if (format === 'csv') {
            return this.convertToCSV(records);
        }
        
        return JSON.stringify(records, null, 2);
    }

    /**
     * Import historical data from external source
     */
    async importHistoricalData(
        data: string,
        format: 'json' | 'csv' = 'json',
        merge: boolean = true
    ): Promise<{ imported: number; errors: string[] }> {
        try {
            let newRecords: HistoricalPredictionRecord[];
            
            if (format === 'csv') {
                newRecords = this.parseCSV(data);
            } else {
                newRecords = JSON.parse(data);
            }

            const errors: string[] = [];
            const validRecords: HistoricalPredictionRecord[] = [];

            // Validate records
            for (const record of newRecords) {
                const validation = this.validateHistoricalRecord(record);
                if (validation.isValid) {
                    validRecords.push(record);
                } else {
                    errors.push(`Invalid record ${record.id}: ${validation.errors.join(', ')}`);
                }
            }

            if (merge) {
                const existingRecords = await this.getHistoricalRecords();
                const mergedRecords = this.mergeRecords(existingRecords, validRecords);
                await this.storeHistoricalRecords(mergedRecords);
            } else {
                await this.storeHistoricalRecords(validRecords);
            }

            await this.invalidateTrendCache();

            return {
                imported: validRecords.length,
                errors
            };
        } catch (error) {
            throw new Error(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // Private helper methods
    private async getHistoricalRecords(): Promise<HistoricalPredictionRecord[]> {
        try {
            const data = localStorage.getItem(this.HISTORICAL_DATA_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading historical records:', error);
            return [];
        }
    }

    private async getCompletedHistoricalRecords(): Promise<HistoricalPredictionRecord[]> {
        const records = await this.getHistoricalRecords();
        return records.filter(record => record.actualResult !== undefined);
    }

    private async storeHistoricalRecords(records: HistoricalPredictionRecord[]): Promise<void> {
        try {
            localStorage.setItem(this.HISTORICAL_DATA_KEY, JSON.stringify(records));
        } catch (error) {
            console.error('Error storing historical records:', error);
            throw new Error('Failed to store historical data');
        }
    }

    private getCachedData(key: string): any {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.CACHE_DURATION) {
                localStorage.removeItem(key);
                return null;
            }
            
            return data;
        } catch {
            return null;
        }
    }

    private setCachedData(key: string, data: any): void {
        try {
            const cacheItem = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Failed to cache data:', error);
        }
    }

    private async invalidateTrendCache(): Promise<void> {
        const keys = ['weekly', 'monthly', 'seasonal', 'yearly'];
        keys.forEach(timeframe => {
            localStorage.removeItem(`${this.TREND_CACHE_KEY}_${timeframe}`);
        });
    }

    private async calculateAccuracyTrend(
        records: HistoricalPredictionRecord[],
        timeframe: string
    ): Promise<TrendPoint[]> {
        const groupedRecords = this.groupRecordsByTimeframe(records, timeframe);
        const trendPoints: TrendPoint[] = [];

        Object.entries(groupedRecords).forEach(([period, periodRecords]) => {
            const correct = periodRecords.filter(r => r.isCorrect).length;
            const total = periodRecords.length;
            const accuracy = total > 0 ? correct / total : 0;

            trendPoints.push({
                period,
                value: accuracy,
                count: total
            });
        });

        // Calculate changes
        for (let i = 1; i < trendPoints.length; i++) {
            const current = trendPoints[i];
            const previous = trendPoints[i - 1];
            current.change = current.value - previous.value;
            current.percentChange = previous.value > 0 
                ? (current.change / previous.value) * 100 
                : 0;
        }

        return trendPoints.sort((a, b) => a.period.localeCompare(b.period));
    }

    private async calculateConfidenceTrend(
        records: HistoricalPredictionRecord[],
        timeframe: string
    ): Promise<TrendPoint[]> {
        const groupedRecords = this.groupRecordsByTimeframe(records, timeframe);
        const trendPoints: TrendPoint[] = [];

        Object.entries(groupedRecords).forEach(([period, periodRecords]) => {
            const avgConfidence = periodRecords.reduce((sum, r) => sum + r.confidence, 0) / periodRecords.length;

            trendPoints.push({
                period,
                value: avgConfidence,
                count: periodRecords.length
            });
        });

        return trendPoints.sort((a, b) => a.period.localeCompare(b.period));
    }

    private groupRecordsByTimeframe(
        records: HistoricalPredictionRecord[],
        timeframe: string
    ): Record<string, HistoricalPredictionRecord[]> {
        const grouped: Record<string, HistoricalPredictionRecord[]> = {};

        records.forEach(record => {
            const date = new Date(record.recordedAt);
            let period: string;

            switch (timeframe) {
                case 'weekly':
                    period = `${date.getFullYear()}-W${this.getWeekNumber(date)}`;
                    break;
                case 'monthly':
                    period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'seasonal':
                    period = `${date.getFullYear()}-${this.getSeason(date)}`;
                    break;
                case 'yearly':
                    period = date.getFullYear().toString();
                    break;
                default:
                    period = date.toISOString().split('T')[0];
            }

            if (!grouped[period]) {
                grouped[period] = [];
            }
            grouped[period].push(record);
        });

        return grouped;
    }

    private getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    private getSeason(date: Date): string {
        const month = date.getMonth() + 1;
        if (month >= 9 && month <= 12) return 'Fall';
        if (month >= 1 && month <= 2) return 'Winter';
        if (month >= 3 && month <= 5) return 'Spring';
        return 'Summer';
    }

    private calculateAccuracyStats(records: HistoricalPredictionRecord[]): AccuracyStats {
        const correctPredictions = records.filter(r => r.isCorrect).length;
        const totalPredictions = records.length;
        const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
        
        const confidences = records.map(r => r.confidence);
        const averageConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length || 0;
        const confidenceRange: [number, number] = [
            Math.min(...confidences) || 0,
            Math.max(...confidences) || 0
        ];

        const calibrationScore = this.calculateCalibrationScore(records);

        return {
            accuracy,
            totalPredictions,
            correctPredictions,
            averageConfidence,
            confidenceRange,
            calibrationScore
        };
    }

    private calculateCalibrationScore(records: HistoricalPredictionRecord[]): number {
        // Group predictions by confidence ranges
        const confidenceBuckets: Record<string, HistoricalPredictionRecord[]> = {};
        
        records.forEach(record => {
            const bucket = Math.floor(record.confidence / 10) * 10;
            const bucketKey = `${bucket}-${bucket + 10}`;
            if (!confidenceBuckets[bucketKey]) {
                confidenceBuckets[bucketKey] = [];
            }
            confidenceBuckets[bucketKey].push(record);
        });

        // Calculate calibration error
        let totalError = 0;
        let totalRecords = 0;

        Object.entries(confidenceBuckets).forEach(([bucket, bucketRecords]) => {
            const avgConfidence = bucketRecords.reduce((sum, r) => sum + r.confidence, 0) / bucketRecords.length;
            const actualAccuracy = bucketRecords.filter(r => r.isCorrect).length / bucketRecords.length;
            const error = Math.abs((avgConfidence / 100) - actualAccuracy);
            
            totalError += error * bucketRecords.length;
            totalRecords += bucketRecords.length;
        });

        const calibrationError = totalRecords > 0 ? totalError / totalRecords : 0;
        return Math.max(0, 1 - calibrationError); // Convert to score (higher is better)
    }

    private async calculateTypePerformanceTrends(
        records: HistoricalPredictionRecord[],
        timeframe: string
    ): Promise<TypePerformanceTrend[]> {
        const types = Array.from(new Set(records.map(r => r.type)));
        const trends: TypePerformanceTrend[] = [];

        for (const type of types) {
            const typeRecords = records.filter(r => r.type === type);
            const groupedRecords = this.groupRecordsByTimeframe(typeRecords, timeframe);
            
            const periods: TrendPoint[] = Object.entries(groupedRecords).map(([period, periodRecords]) => {
                const correct = periodRecords.filter(r => r.isCorrect).length;
                const total = periodRecords.length;
                const accuracy = total > 0 ? correct / total : 0;

                return {
                    period,
                    value: accuracy,
                    count: total
                };
            }).sort((a, b) => a.period.localeCompare(b.period));

            // Calculate trend
            const values = periods.map(p => p.value);
            const trendStrength = this.calculateTrendStrength(values);
            const overallTrend = this.determineTrendDirection(values);
            
            const bestPeriod = periods.reduce((best, current) => 
                current.value > best.value ? current : best, periods[0]);
            const worstPeriod = periods.reduce((worst, current) => 
                current.value < worst.value ? current : worst, periods[0]);

            trends.push({
                type,
                periods,
                overallTrend,
                trendStrength,
                bestPeriod: bestPeriod?.period || '',
                worstPeriod: worstPeriod?.period || ''
            });
        }

        return trends;
    }

    private async analyzeSeasonalPatterns(
        records: HistoricalPredictionRecord[]
    ): Promise<SeasonalPattern[]> {
        const patterns: SeasonalPattern[] = [];
        const seasonMap = {
            'early_season': (week: number) => week >= 1 && week <= 6,
            'mid_season': (week: number) => week >= 7 && week <= 12,
            'late_season': (week: number) => week >= 13 && week <= 17,
            'playoffs': (week: number) => week >= 18
        };

        for (const [pattern, weekFilter] of Object.entries(seasonMap)) {
            const seasonRecords = records.filter(r => weekFilter(r.week));
            
            if (seasonRecords.length === 0) continue;

            const stats = this.calculateAccuracyStats(seasonRecords);
            const typeStats = this.calculateAccuracyByType(seasonRecords);
            const strongestTypes = Object.entries(typeStats)
                .sort(([,a], [,b]) => b.accuracy - a.accuracy)
                .slice(0, 3)
                .map(([type]) => type as PredictionType);

            patterns.push({
                pattern: pattern as any,
                averageAccuracy: stats.accuracy,
                predictionVolume: seasonRecords.length,
                confidenceLevel: stats.averageConfidence,
                strongestTypes,
                insights: this.generateSeasonalInsights(pattern, stats, strongestTypes)
            });
        }

        return patterns;
    }

    private async calculateImprovementMetrics(
        records: HistoricalPredictionRecord[]
    ): Promise<ImprovementMetrics> {
        const sortedRecords = [...records].sort((a, b) => 
            new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        );

        const earlyRecords = sortedRecords.slice(0, Math.floor(sortedRecords.length / 3));
        const recentRecords = sortedRecords.slice(-Math.floor(sortedRecords.length / 3));

        const earlyStats = this.calculateAccuracyStats(earlyRecords);
        const recentStats = this.calculateAccuracyStats(recentRecords);

        const accuracyImprovement = recentStats.accuracy - earlyStats.accuracy;
        const confidenceCalibration = recentStats.calibrationScore - earlyStats.calibrationScore;
        
        const streakLength = this.calculateCurrentStreak(sortedRecords);
        const consistencyScore = this.calculateConsistencyScore(records);
        const adaptabilityIndex = this.calculateAdaptabilityIndex(records);
        const learningVelocity = this.calculateLearningVelocity(sortedRecords);

        return {
            accuracyImprovement,
            confidenceCalibration,
            streakLength,
            consistencyScore,
            adaptabilityIndex,
            learningVelocity
        };
    }

    private async calculateVolumeMetrics(
        records: HistoricalPredictionRecord[],
        timeframe: string
    ): Promise<VolumeMetrics> {
        const groupedRecords = this.groupRecordsByTimeframe(records, timeframe);
        const volumeByPeriod = Object.entries(groupedRecords).map(([period, periodRecords]) => ({
            period,
            count: periodRecords.length
        }));

        const totalPredictions = records.length;
        const periods = volumeByPeriod.length;
        const dailyAverage = totalPredictions / (periods || 1);
        const weeklyAverage = dailyAverage * 7;

        const sortedByVolume = volumeByPeriod.sort((a, b) => b.count - a.count);
        const peakPeriods = sortedByVolume.slice(0, 3).map(p => p.period);
        const lowPeriods = sortedByVolume.slice(-3).map(p => p.period);

        const volumes = volumeByPeriod.map(p => p.count);
        const volumeTrendDirection = this.determineTrendDirection(volumes);
        let volumeTrend: 'increasing' | 'decreasing' | 'stable';
        if (volumeTrendDirection === 'improving') {
            volumeTrend = 'increasing';
        } else if (volumeTrendDirection === 'declining') {
            volumeTrend = 'decreasing';
        } else {
            volumeTrend = 'stable';
        }

        return {
            totalPredictions,
            dailyAverage,
            weeklyAverage,
            peakPeriods,
            lowPeriods,
            volumeTrend
        };
    }

    private calculateAccuracyByType(
        records: HistoricalPredictionRecord[]
    ): Record<PredictionType, AccuracyStats> {
        const result: Record<string, AccuracyStats> = {};
        const types = Array.from(new Set(records.map(r => r.type)));

        for (const type of types) {
            const typeRecords = records.filter(r => r.type === type);
            result[type] = this.calculateAccuracyStats(typeRecords);
        }

        return result as Record<PredictionType, AccuracyStats>;
    }

    private calculateAccuracyByConfidence(
        records: HistoricalPredictionRecord[]
    ): Record<string, AccuracyStats> {
        const result: Record<string, AccuracyStats> = {};
        const confidenceRanges = ['0-60', '60-70', '70-80', '80-90', '90-100'];

        for (const range of confidenceRanges) {
            const [min, max] = range.split('-').map(Number);
            const rangeRecords = records.filter(r => r.confidence >= min && r.confidence < max);
            result[range] = this.calculateAccuracyStats(rangeRecords);
        }

        return result;
    }

    private calculateAccuracyByTimeframe(
        records: HistoricalPredictionRecord[]
    ): Record<string, AccuracyStats> {
        const result: Record<string, AccuracyStats> = {};
        const groupedRecords = this.groupRecordsByTimeframe(records, 'monthly');

        for (const [period, periodRecords] of Object.entries(groupedRecords)) {
            result[period] = this.calculateAccuracyStats(periodRecords);
        }

        return result;
    }

    private calculateAccuracyByWeek(
        records: HistoricalPredictionRecord[]
    ): Record<number, AccuracyStats> {
        const result: Record<number, AccuracyStats> = {};
        const weeks = Array.from(new Set(records.map(r => r.week)));

        for (const week of weeks) {
            const weekRecords = records.filter(r => r.week === week);
            result[week] = this.calculateAccuracyStats(weekRecords);
        }

        return result;
    }

    private async calculateContextualAccuracy(
        records: HistoricalPredictionRecord[]
    ): Promise<ContextualAccuracy[]> {
        const contextualFactors: ContextualAccuracy[] = [];

        // Weather impact
        const weatherRecords = records.filter(r => r.metadata.gameWeather);
        if (weatherRecords.length > 0) {
            const goodWeatherRecords = weatherRecords.filter(r => 
                !r.metadata.gameWeather?.toLowerCase().includes('rain') &&
                !r.metadata.gameWeather?.toLowerCase().includes('snow')
            );
            const badWeatherRecords = weatherRecords.filter(r => 
                r.metadata.gameWeather?.toLowerCase().includes('rain') ||
                r.metadata.gameWeather?.toLowerCase().includes('snow')
            );

            if (goodWeatherRecords.length > 5) {
                const goodWeatherStats = this.calculateAccuracyStats(goodWeatherRecords);
                contextualFactors.push({
                    context: 'Weather',
                    factor: 'Good Weather',
                    accuracy: goodWeatherStats.accuracy,
                    sampleSize: goodWeatherRecords.length,
                    significance: this.calculateSignificance(goodWeatherRecords.length)
                });
            }

            if (badWeatherRecords.length > 5) {
                const badWeatherStats = this.calculateAccuracyStats(badWeatherRecords);
                contextualFactors.push({
                    context: 'Weather',
                    factor: 'Bad Weather',
                    accuracy: badWeatherStats.accuracy,
                    sampleSize: badWeatherRecords.length,
                    significance: this.calculateSignificance(badWeatherRecords.length)
                });
            }
        }

        // Line movement impact
        const lineMovementRecords = records.filter(r => r.metadata.lineMovement !== undefined);
        if (lineMovementRecords.length > 10) {
            const favorableMovement = lineMovementRecords.filter(r => r.metadata.lineMovement !== undefined && r.metadata.lineMovement > 0);
            const unfavorableMovement = lineMovementRecords.filter(r => r.metadata.lineMovement !== undefined && r.metadata.lineMovement < 0);

            if (favorableMovement.length > 5) {
                const favorableStats = this.calculateAccuracyStats(favorableMovement);
                contextualFactors.push({
                    context: 'Line Movement',
                    factor: 'Favorable',
                    accuracy: favorableStats.accuracy,
                    sampleSize: favorableMovement.length,
                    significance: this.calculateSignificance(favorableMovement.length)
                });
            }

            if (unfavorableMovement.length > 5) {
                const unfavorableStats = this.calculateAccuracyStats(unfavorableMovement);
                contextualFactors.push({
                    context: 'Line Movement',
                    factor: 'Unfavorable',
                    accuracy: unfavorableStats.accuracy,
                    sampleSize: unfavorableMovement.length,
                    significance: this.calculateSignificance(unfavorableMovement.length)
                });
            }
        }

        return contextualFactors;
    }

    private filterRecordsByPeriod(
        records: HistoricalPredictionRecord[],
        period: string
    ): HistoricalPredictionRecord[] {
        const [year, month] = period.split('-').map(Number);
        return records.filter(record => {
            const recordDate = new Date(record.recordedAt);
            return recordDate.getFullYear() === year && recordDate.getMonth() + 1 === month;
        });
    }

    private calculateTypeChanges(
        currentRecords: HistoricalPredictionRecord[],
        previousRecords: HistoricalPredictionRecord[]
    ): Record<PredictionType, number> {
        const currentStats = this.calculateAccuracyByType(currentRecords);
        const previousStats = this.calculateAccuracyByType(previousRecords);
        const changes: Record<string, number> = {};

        const allTypes = new Set([
            ...Object.keys(currentStats),
            ...Object.keys(previousStats)
        ]);

        for (const type of allTypes) {
            const currentAcc = (currentStats as any)[type]?.accuracy || 0;
            const previousAcc = (previousStats as any)[type]?.accuracy || 0;
            changes[type] = currentAcc - previousAcc;
        }

        return changes as Record<PredictionType, number>;
    }

    private identifySignificantImprovements(
        currentStats: AccuracyStats,
        previousStats: AccuracyStats
    ): string[] {
        const improvements: string[] = [];
        const accuracyImprovement = currentStats.accuracy - previousStats.accuracy;
        const confidenceImprovement = currentStats.averageConfidence - previousStats.averageConfidence;
        const calibrationImprovement = currentStats.calibrationScore - previousStats.calibrationScore;

        if (accuracyImprovement > 0.05) {
            improvements.push(`Accuracy improved by ${(accuracyImprovement * 100).toFixed(1)}%`);
        }
        if (calibrationImprovement > 0.1) {
            improvements.push(`Confidence calibration improved significantly`);
        }
        if (confidenceImprovement > 5 && accuracyImprovement > 0) {
            improvements.push(`Increased confidence with maintained accuracy`);
        }

        return improvements;
    }

    private identifyAreasOfConcern(
        currentStats: AccuracyStats,
        previousStats: AccuracyStats
    ): string[] {
        const concerns: string[] = [];
        const accuracyChange = currentStats.accuracy - previousStats.accuracy;
        const calibrationChange = currentStats.calibrationScore - previousStats.calibrationScore;

        if (accuracyChange < -0.05) {
            concerns.push(`Accuracy declined by ${Math.abs(accuracyChange * 100).toFixed(1)}%`);
        }
        if (calibrationChange < -0.1) {
            concerns.push(`Confidence calibration worsened`);
        }
        if (currentStats.accuracy < 0.5) {
            concerns.push(`Overall accuracy below 50%`);
        }

        return concerns;
    }

    private async analyzeStreaks(
        records: HistoricalPredictionRecord[]
    ): Promise<StreakAnalysis> {
        const sortedRecords = [...records].sort((a, b) => 
            new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        );

        const currentStreak = this.calculateCurrentStreak(sortedRecords);
        const longestStreak = this.calculateLongestStreak(sortedRecords);
        const streakType = this.determineStreakType(sortedRecords);
        const streakProbability = this.calculateStreakProbability(sortedRecords);

        return {
            currentStreak,
            longestStreak,
            streakType,
            streakProbability,
            breakPatterns: this.identifyBreakPatterns(sortedRecords),
            maintainanceStrategies: this.generateMaintainanceStrategies(streakType, currentStreak)
        };
    }

    private async analyzeConfidence(
        records: HistoricalPredictionRecord[]
    ): Promise<ConfidenceAnalysis> {
        const calibrationCurve = this.calculateCalibrationCurve(records);
        const overconfidenceIndex = this.calculateOverconfidenceIndex(records);
        const underconfidenceIndex = this.calculateUnderconfidenceIndex(records);
        const optimalConfidenceRange = this.findOptimalConfidenceRange(records);
        const confidenceDistribution = this.calculateConfidenceDistribution(records);
        const reliabilityScore = this.calculateReliabilityScore(records);

        return {
            overconfidenceIndex,
            underconfidenceIndex,
            calibrationCurve,
            optimalConfidenceRange,
            confidenceDistribution,
            reliabilityScore
        };
    }

    private async analyzeTypeSpecialization(
        records: HistoricalPredictionRecord[]
    ): Promise<TypeSpecializationAnalysis> {
        const typeStats = this.calculateAccuracyByType(records);
        const sortedTypes = Object.entries(typeStats).sort(([,a], [,b]) => b.accuracy - a.accuracy);
        
        const strongestTypes = sortedTypes.slice(0, 3).map(([type]) => type as PredictionType);
        const weakestTypes = sortedTypes.slice(-3).map(([type]) => type as PredictionType);
        
        const specializationIndex = this.calculateSpecializationIndex(typeStats);
        const consistencyAcrossTypes = this.calculateTypeConsistency(typeStats);
        const typeProgressions = this.calculateTypeProgressions(records);
        const crossTypeCorrelations = this.calculateCrossTypeCorrelations(records);

        return {
            strongestTypes,
            weakestTypes,
            specializationIndex,
            consistencyAcrossTypes,
            typeProgressions,
            crossTypeCorrelations
        };
    }

    private async analyzeContextualFactors(
        records: HistoricalPredictionRecord[]
    ): Promise<ContextualFactorAnalysis> {
        return {
            weatherImpact: this.analyzeWeatherImpact(records),
            injuryImpact: this.analyzeInjuryImpact(records),
            lineMovementImpact: this.analyzeLineMovementImpact(records),
            publicBettingImpact: this.analyzePublicBettingImpact(records),
            sentimentImpact: this.analyzeSentimentImpact(records),
            combinedFactorEffects: this.analyzeCombinedFactorEffects(records)
        };
    }

    private async analyzePredictivePatterns(
        records: HistoricalPredictionRecord[]
    ): Promise<PredictivePatterns> {
        return {
            timeBasedPatterns: this.identifyTimeBasedPatterns(records),
            sequencePatterns: this.identifySequencePatterns(records),
            contextPatterns: this.identifyContextPatterns(records),
            emergingPatterns: this.identifyEmergingPatterns(records)
        };
    }

    private async generateAdvancedRecommendations(
        records: HistoricalPredictionRecord[]
    ): Promise<AdvancedRecommendation[]> {
        const recommendations: AdvancedRecommendation[] = [];
        const stats = this.calculateAccuracyStats(records);
        const typeStats = this.calculateAccuracyByType(records);

        // Accuracy-based recommendations
        if (stats.accuracy < 0.6) {
            recommendations.push({
                type: 'IMPROVEMENT',
                priority: 'high',
                title: 'Focus on Prediction Accuracy',
                description: 'Current accuracy is below optimal threshold. Consider reviewing prediction methodology.',
                actionItems: [
                    'Review recent incorrect predictions for patterns',
                    'Consider reducing confidence levels',
                    'Focus on strongest prediction types'
                ],
                expectedImpact: 0.15,
                timeframe: '2-4 weeks',
                metrics: ['accuracy', 'calibration'],
                supportingData: { currentAccuracy: stats.accuracy }
            });
        }

        // Type specialization recommendations
        const sortedTypes = Object.entries(typeStats).sort(([,a], [,b]) => b.accuracy - a.accuracy);
        const strongestType = sortedTypes[0];
        const weakestType = sortedTypes[sortedTypes.length - 1];

        if (strongestType && strongestType[1].accuracy > 0.7) {
            recommendations.push({
                type: 'OPPORTUNITY',
                priority: 'medium',
                title: `Leverage Strength in ${strongestType[0]}`,
                description: `You show exceptional performance in ${strongestType[0]} predictions.`,
                actionItems: [
                    `Increase focus on ${strongestType[0]} predictions`,
                    'Analyze what makes these predictions successful',
                    'Apply similar methodology to other types'
                ],
                expectedImpact: 0.08,
                timeframe: '1-2 weeks',
                metrics: ['type_accuracy', 'overall_confidence'],
                supportingData: { 
                    type: strongestType[0],
                    accuracy: strongestType[1].accuracy
                }
            });
        }

        if (weakestType && weakestType[1].accuracy < 0.5 && weakestType[1].totalPredictions > 10) {
            recommendations.push({
                type: 'WARNING',
                priority: 'high',
                title: `Address Weakness in ${weakestType[0]}`,
                description: `Performance in ${weakestType[0]} predictions needs attention.`,
                actionItems: [
                    `Reduce volume of ${weakestType[0]} predictions temporarily`,
                    'Study successful patterns in this category',
                    'Consider lower confidence levels for this type'
                ],
                expectedImpact: 0.12,
                timeframe: '2-3 weeks',
                metrics: ['type_accuracy', 'overall_accuracy'],
                supportingData: { 
                    type: weakestType[0],
                    accuracy: weakestType[1].accuracy
                }
            });
        }

        return recommendations;
    }

    // Additional helper methods for calculations
    private calculateTrendStrength(values: number[]): number {
        if (values.length < 2) return 0;
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        return Math.abs(secondAvg - firstAvg);
    }

    private determineTrendDirection(values: number[]): 'improving' | 'declining' | 'stable' {
        if (values.length < 2) return 'stable';
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        const change = secondAvg - firstAvg;
        
        if (Math.abs(change) < 0.05) return 'stable';
        return change > 0 ? 'improving' : 'declining';
    }

    private generateSeasonalInsights(
        pattern: string,
        stats: AccuracyStats,
        strongestTypes: PredictionType[]
    ): string[] {
        const insights: string[] = [];
        
        if (stats.accuracy > 0.7) {
            insights.push(`Strong performance during ${pattern.replace('_', ' ')} period`);
        }
        
        if (strongestTypes.length > 0) {
            insights.push(`Best prediction types: ${strongestTypes.join(', ')}`);
        }
        
        if (stats.calibrationScore > 0.8) {
            insights.push(`Well-calibrated confidence levels during this period`);
        }
        
        return insights;
    }

    private calculateCurrentStreak(records: HistoricalPredictionRecord[]): number {
        if (records.length === 0) return 0;
        
        let streak = 0;
        for (let i = records.length - 1; i >= 0; i--) {
            if (records[i].isCorrect) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    private calculateLongestStreak(records: HistoricalPredictionRecord[]): number {
        let maxStreak = 0;
        let currentStreak = 0;
        
        for (const record of records) {
            if (record.isCorrect) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return maxStreak;
    }

    private determineStreakType(records: HistoricalPredictionRecord[]): 'correct' | 'incorrect' | 'mixed' {
        if (records.length === 0) return 'mixed';
        
        const recentRecords = records.slice(-10);
        const correctCount = recentRecords.filter(r => r.isCorrect).length;
        
        if (correctCount >= 8) return 'correct';
        if (correctCount <= 2) return 'incorrect';
        return 'mixed';
    }

    private calculateStreakProbability(records: HistoricalPredictionRecord[]): number {
        const overallAccuracy = this.calculateAccuracyStats(records).accuracy;
        const recentAccuracy = this.calculateAccuracyStats(records.slice(-20)).accuracy;
        
        // Weighted probability based on overall and recent performance
        return (overallAccuracy * 0.3) + (recentAccuracy * 0.7);
    }

    private identifyBreakPatterns(records: HistoricalPredictionRecord[]): string[] {
        const patterns: string[] = [];
        
        // Analyze when streaks tend to break
        const streakBreaks = this.findStreakBreaks(records);
        const contextAnalysis = this.analyzeBreakContexts(streakBreaks);
        
        if (contextAnalysis.commonFactors.length > 0) {
            patterns.push(`Streaks often break during: ${contextAnalysis.commonFactors.join(', ')}`);
        }
        
        return patterns;
    }

    private generateMaintainanceStrategies(streakType: string, currentStreak: number): string[] {
        const strategies: string[] = [];
        
        if (streakType === 'correct' && currentStreak > 5) {
            strategies.push('Maintain consistent methodology');
            strategies.push('Avoid overconfidence');
            strategies.push('Continue systematic approach');
        } else if (streakType === 'incorrect') {
            strategies.push('Review recent prediction methodology');
            strategies.push('Consider reducing prediction volume');
            strategies.push('Focus on strongest categories');
        }
        
        return strategies;
    }

    // Additional calculation helper methods (simplified implementations)
    private calculateConsistencyScore(records: HistoricalPredictionRecord[]): number {
        const weeklyAccuracy = this.calculateAccuracyByWeek(records);
        const accuracyValues = Object.values(weeklyAccuracy).map(stats => stats.accuracy);
        
        if (accuracyValues.length === 0) return 0;
        
        const mean = accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length;
        const variance = accuracyValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / accuracyValues.length;
        
        return Math.max(0, 1 - Math.sqrt(variance));
    }

    private calculateAdaptabilityIndex(records: HistoricalPredictionRecord[]): number {
        // Simplified: measure how well performance adapts to different contexts
        const contextualAccuracy = records.filter(r => r.metadata.contextualFactors?.length).length;
        return Math.min(1, contextualAccuracy / records.length);
    }

    private calculateLearningVelocity(records: HistoricalPredictionRecord[]): number {
        if (records.length < 10) return 0;
        
        const segments = Math.floor(records.length / 5);
        const segmentAccuracies: number[] = [];
        
        for (let i = 0; i < 5; i++) {
            const start = i * segments;
            const end = (i + 1) * segments;
            const segmentRecords = records.slice(start, end);
            segmentAccuracies.push(this.calculateAccuracyStats(segmentRecords).accuracy);
        }
        
        // Calculate improvement rate
        let totalImprovement = 0;
        for (let i = 1; i < segmentAccuracies.length; i++) {
            totalImprovement += segmentAccuracies[i] - segmentAccuracies[i - 1];
        }
        
        return totalImprovement / (segmentAccuracies.length - 1);
    }

    private calculateSignificance(sampleSize: number): number {
        // Simple significance calculation based on sample size
        if (sampleSize < 5) return 0.1;
        if (sampleSize < 20) return 0.5;
        if (sampleSize < 50) return 0.8;
        return 0.95;
    }

    // Complex analysis methods
    private calculateCalibrationCurve(records: HistoricalPredictionRecord[]): CalibrationPoint[] {
        // Calculate calibration curve points (confidence vs. accuracy)
        const bins: { [bin: string]: { total: number; correct: number } } = {};
        for (const record of records) {
            const binStart = Math.floor((record.confidence ?? 0) / 10) * 10;
            const binEnd = binStart + 9;
            const binKey = `${binStart}-${binEnd}`;
            if (!bins[binKey]) bins[binKey] = { total: 0, correct: 0 };
            bins[binKey].total++;
            if (record.isCorrect) bins[binKey].correct++;
        }
        return Object.entries(bins).map(([binKey, stats]) => {
            const [start, end] = binKey.split('-').map(Number);
            return {
                confidenceRange: [start, end],
                expectedAccuracy: (start + end) / 200, // expected: midpoint as percent
                actualAccuracy: stats.total ? stats.correct / stats.total : 0,
                sampleSize: stats.total
            };
        });
    }

    private calculateOverconfidenceIndex(records: HistoricalPredictionRecord[]): number {
        // Overconfidence: high confidence, low accuracy
        let overconfident = 0;
        let total = 0;
        for (const record of records) {
            if ((record.confidence ?? 0) >= 80) {
                total++;
                if (!record.isCorrect) overconfident++;
            }
        }
        return total ? overconfident / total : 0;
    }

    private calculateUnderconfidenceIndex(records: HistoricalPredictionRecord[]): number {
        // Underconfidence: low confidence, high accuracy
        let underconfident = 0;
        let total = 0;
        for (const record of records) {
            if ((record.confidence ?? 0) <= 40) {
                total++;
                if (record.isCorrect) underconfident++;
            }
        }
        return total ? underconfident / total : 0;
    }

    private findOptimalConfidenceRange(records: HistoricalPredictionRecord[]): [number, number] {
        return [70, 85];
    }

    private calculateConfidenceDistribution(records: HistoricalPredictionRecord[]): Record<string, number> {
        return {};
    }

    private calculateReliabilityScore(records: HistoricalPredictionRecord[]): number {
        return 0.8;
    }

    private calculateSpecializationIndex(typeStats: Record<string, AccuracyStats>): number {
        return 0.7;
    }

    private calculateTypeConsistency(typeStats: Record<string, AccuracyStats>): number {
        return 0.8;
    }

    private calculateTypeProgressions(records: HistoricalPredictionRecord[]): Record<PredictionType, number> {
        return {} as Record<PredictionType, number>;
    }

    private calculateCrossTypeCorrelations(records: HistoricalPredictionRecord[]): Record<string, number> {
        return {};
    }

    // Factor analysis methods (simplified)
    private analyzeWeatherImpact(records: HistoricalPredictionRecord[]): FactorImpact {
        return {
            positiveCorrelation: true,
            impactStrength: 0.3,
            significanceLevel: 0.7,
            optimalConditions: ['Clear skies', 'Mild temperature'],
            avoidanceConditions: ['Heavy rain', 'Snow']
        };
    }

    private analyzeInjuryImpact(records: HistoricalPredictionRecord[]): FactorImpact {
        return {
            positiveCorrelation: false,
            impactStrength: 0.4,
            significanceLevel: 0.8,
            optimalConditions: ['No key injuries'],
            avoidanceConditions: ['Star player injured']
        };
    }

    private analyzeLineMovementImpact(records: HistoricalPredictionRecord[]): FactorImpact {
        return {
            positiveCorrelation: true,
            impactStrength: 0.25,
            significanceLevel: 0.6,
            optimalConditions: ['Favorable line movement'],
            avoidanceConditions: ['Sharp reverse line movement']
        };
    }

    private analyzePublicBettingImpact(records: HistoricalPredictionRecord[]): FactorImpact {
        return {
            positiveCorrelation: false,
            impactStrength: 0.2,
            significanceLevel: 0.5,
            optimalConditions: ['Contrarian position'],
            avoidanceConditions: ['Heavy public favorite']
        };
    }

    private analyzeSentimentImpact(records: HistoricalPredictionRecord[]): FactorImpact {
        return {
            positiveCorrelation: true,
            impactStrength: 0.15,
            significanceLevel: 0.4,
            optimalConditions: ['Positive market sentiment'],
            avoidanceConditions: ['Extreme negative sentiment']
        };
    }

    private analyzeCombinedFactorEffects(records: HistoricalPredictionRecord[]): CombinedFactorEffect[] {
        return [];
    }

    // Pattern identification methods (simplified)
    private identifyTimeBasedPatterns(records: HistoricalPredictionRecord[]): TimePattern[] {
        return [];
    }

    private identifySequencePatterns(records: HistoricalPredictionRecord[]): SequencePattern[] {
        return [];
    }

    private identifyContextPatterns(records: HistoricalPredictionRecord[]): ContextPattern[] {
        return [];
    }

    private identifyEmergingPatterns(records: HistoricalPredictionRecord[]): EmergingPattern[] {
        return [];
    }

    private findStreakBreaks(records: HistoricalPredictionRecord[]): any[] {
        return [];
    }

    private analyzeBreakContexts(streakBreaks: any[]): { commonFactors: string[] } {
        return { commonFactors: [] };
    }

    private convertToCSV(records: HistoricalPredictionRecord[]): string {
        if (records.length === 0) return '';
        
        const headers = Object.keys(records[0]).join(',');
        const rows = records.map(record => {
            return Object.values(record).map(value => {
                if (typeof value === 'object' && value !== null) {
                    return JSON.stringify(value).replace(/"/g, '""');
                }
                return String(value).replace(/"/g, '""');
            }).join(',');
        });
        
        return [headers, ...rows].join('\n');
    }

    private parseCSV(csvData: string): HistoricalPredictionRecord[] {
        // Simplified CSV parser - in production, use a proper CSV library
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        const records: HistoricalPredictionRecord[] = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const record: any = {};
            
            headers.forEach((header, index) => {
                record[header] = values[index];
            });
            
            records.push(record as HistoricalPredictionRecord);
        }
        
        return records;
    }

    private validateHistoricalRecord(record: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        if (!record.id) errors.push('Missing id');
        if (!record.predictionId) errors.push('Missing predictionId');
        if (typeof record.confidence !== 'number') errors.push('Invalid confidence');
        if (!record.type) errors.push('Missing type');
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private mergeRecords(
        existing: HistoricalPredictionRecord[],
        newRecords: HistoricalPredictionRecord[]
    ): HistoricalPredictionRecord[] {
        const merged = [...existing];
        
        for (const newRecord of newRecords) {
            const existingIndex = merged.findIndex(r => r.id === newRecord.id);
            if (existingIndex >= 0) {
                merged[existingIndex] = newRecord;
            } else {
                merged.push(newRecord);
            }
        }
        
        return merged;
    }
}

export default new OracleHistoricalAnalyticsService();
