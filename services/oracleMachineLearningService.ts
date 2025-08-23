/**
 * Oracle Machine Learning Service
 * Continuously improves prediction algorithms using historical performance data
 * Implements feedback loops, pattern recognition, and algorithm optimization
 */

export interface MLTrainingData {
    predictionId: string;
    week: number;
    type: string;
    confidence: number;
    oracleChoice: number;
    actualResult: number;
    isCorrect: boolean;
    features: FeatureVector;
    timestamp: string;
}

export interface FeatureVector {
    // Player-based features
    playerRecentPerformance: number[];
    playerPositionRank: number;
    playerInjuryRisk: number;
    playerMatchupDifficulty: number;
    playerTargetShare: number;
    
    // Team-based features
    teamOffensiveRank: number;
    teamDefensiveRank: number;
    teamHomeAdvantage: number;
    teamRecentForm: number[];
    
    // Game-based features
    weatherConditions: number[];
    gameImportance: number;
    restDays: number;
    travelDistance: number;
    
    // Historical patterns
    headToHeadRecord: number[];
    seasonalTrends: number[];
    venuePerformance: number[];
    
    // Meta features
    timeOfSeason: number;
    weekType: 'REGULAR' | 'PLAYOFF' | 'CHAMPIONSHIP';
    marketConfidence: number;
}

export interface ModelPerformance {
    type: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    calibrationScore: number;
    confidenceCorrelation: number;
    lastUpdated: string;
    sampleSize: number;
}

export interface FeatureImportance {
    feature: string;
    importance: number;
    category: 'PLAYER' | 'TEAM' | 'GAME' | 'HISTORICAL' | 'META';
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

export interface PredictionOptimization {
    type: string;
    currentAccuracy: number;
    optimizedConfidenceThreshold: number;
    recommendedFeatureWeights: Record<string, number>;
    identifiedPatterns: Pattern[];
    improvementPotential: number;
}

export interface Pattern {
    name: string;
    description: string;
    confidence: number;
    supportingData: number;
    actionable: boolean;
    recommendation: string;
}

export interface MLInsight {
    type: 'ACCURACY_DRIFT' | 'FEATURE_IMPORTANCE_SHIFT' | 'SEASONAL_PATTERN' | 'OVERCONFIDENCE' | 'UNDERCONFIDENCE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    recommendation: string;
    supportingData: any;
}

class OracleMachineLearningService {
    private readonly TRAINING_DATA_KEY = 'oracleMLTrainingData';
    private readonly MODEL_PERFORMANCE_KEY = 'oracleModelPerformance';
    private readonly FEATURE_IMPORTANCE_KEY = 'oracleFeatureImportance';
    private readonly ML_INSIGHTS_KEY = 'oracleMLInsights';
    
    private readonly MIN_TRAINING_SAMPLES = 50;
    private readonly RETRAINING_FREQUENCY_DAYS = 7;
    private readonly CONFIDENCE_CALIBRATION_WINDOW = 100;

    /**
     * Record prediction outcome for machine learning training
     */
    async recordPredictionOutcome(
        predictionId: string,
        week: number,
        type: string,
        confidence: number,
        oracleChoice: number,
        actualResult: number,
        features: FeatureVector
    ): Promise<void> {
        const trainingData: MLTrainingData = {
            predictionId,
            week,
            type,
            confidence,
            oracleChoice,
            actualResult,
            isCorrect: oracleChoice === actualResult,
            features,
            timestamp: new Date().toISOString()
        };

        const existingData = this.getStoredTrainingData();
        existingData.push(trainingData);
        
        // Keep only recent data (last 52 weeks for seasonal patterns)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 365);
        
        const filteredData = existingData.filter(data => 
            new Date(data.timestamp) > cutoffDate
        );
        
        this.storeTrainingData(filteredData);
        
        // Trigger retraining if enough new data
        if (this.shouldRetrain()) {
            await this.retrainModels();
        }
    }

    /**
     * Analyze model performance across different prediction types
     */
    async analyzeModelPerformance(): Promise<ModelPerformance[]> {
        const trainingData = this.getStoredTrainingData();
        const predictionTypes = [...new Set(trainingData.map(d => d.type))];
        
        const performances: ModelPerformance[] = [];
        
        for (const type of predictionTypes) {
            const typeData = trainingData.filter(d => d.type === type);
            
            if (typeData.length >= this.MIN_TRAINING_SAMPLES) {
                const performance = this.calculateModelPerformance(typeData);
                performances.push({
                    type,
                    ...performance,
                    lastUpdated: new Date().toISOString(),
                    sampleSize: typeData.length
                });
            }
        }
        
        this.storeModelPerformance(performances);
        return performances;
    }

    /**
     * Calculate feature importance across all prediction types
     */
    async calculateFeatureImportance(): Promise<FeatureImportance[]> {
        const trainingData = this.getStoredTrainingData();
        
        if (trainingData.length < this.MIN_TRAINING_SAMPLES) {
            return [];
        }

        // Calculate correlation between features and prediction accuracy
        const featureNames = this.extractFeatureNames(trainingData[0].features);
        const importance: FeatureImportance[] = [];
        
        for (const featureName of featureNames) {
            const correlation = this.calculateFeatureCorrelation(trainingData, featureName);
            const trend = this.calculateFeatureTrend(trainingData, featureName);
            
            importance.push({
                feature: featureName,
                importance: Math.abs(correlation),
                category: this.categorizeFeature(featureName),
                trend
            });
        }
        
        // Sort by importance
        importance.sort((a, b) => b.importance - a.importance);
        
        this.storeFeatureImportance(importance);
        return importance;
    }

    /**
     * Generate optimization recommendations for each prediction type
     */
    async optimizePredictionAlgorithms(): Promise<PredictionOptimization[]> {
        const trainingData = this.getStoredTrainingData();
        const predictionTypes = [...new Set(trainingData.map(d => d.type))];
        
        const optimizations: PredictionOptimization[] = [];
        
        for (const type of predictionTypes) {
            const typeData = trainingData.filter(d => d.type === type);
            
            if (typeData.length >= this.MIN_TRAINING_SAMPLES) {
                const optimization = await this.optimizePredictionType(typeData, type);
                optimizations.push(optimization);
            }
        }
        
        return optimizations;
    }

    /**
     * Detect and analyze prediction patterns
     */
    async detectPredictionPatterns(): Promise<Pattern[]> {
        const trainingData = this.getStoredTrainingData();
        const patterns: Pattern[] = [];
        
        // Seasonal performance patterns
        patterns.push(...this.detectSeasonalPatterns(trainingData));
        
        // Confidence vs accuracy patterns
        patterns.push(...this.detectConfidencePatterns(trainingData));
        
        // Feature combination patterns
        patterns.push(...this.detectFeatureCombinationPatterns(trainingData));
        
        // Opponent-specific patterns
        patterns.push(...this.detectOpponentPatterns(trainingData));
        
        // Time-based patterns
        patterns.push(...this.detectTimingPatterns(trainingData));
        
        return patterns.filter(p => p.confidence > 0.7);
    }

    /**
     * Generate machine learning insights and recommendations
     */
    async generateMLInsights(): Promise<MLInsight[]> {
        const trainingData = this.getStoredTrainingData();
        const insights: MLInsight[] = [];
        
        // Check for accuracy drift
        const accuracyDrift = this.detectAccuracyDrift(trainingData);
        if (accuracyDrift) {
            insights.push(accuracyDrift);
        }
        
        // Check for overconfidence/underconfidence
        const confidenceIssues = this.detectConfidenceIssues(trainingData);
        insights.push(...confidenceIssues);
        
        // Check for feature importance shifts
        const featureShifts = await this.detectFeatureImportanceShifts();
        insights.push(...featureShifts);
        
        // Check for seasonal patterns
        const seasonalInsights = this.detectSeasonalInsights(trainingData);
        insights.push(...seasonalInsights);
        
        this.storeMLInsights(insights);
        return insights;
    }

    /**
     * Get calibrated confidence adjustments based on historical performance
     */
    async getCalibratedConfidence(
        originalConfidence: number,
        predictionType: string,
        features: FeatureVector
    ): Promise<number> {
        const trainingData = this.getStoredTrainingData()
            .filter(d => d.type === predictionType)
            .slice(-this.CONFIDENCE_CALIBRATION_WINDOW);
        
        if (trainingData.length < 20) {
            return originalConfidence;
        }
        
        // Calculate historical accuracy for similar confidence levels
        const confidenceRange = 10;
        const similarConfidenceData = trainingData.filter(d => 
            Math.abs(d.confidence - originalConfidence) <= confidenceRange
        );
        
        if (similarConfidenceData.length === 0) {
            return originalConfidence;
        }
        
        const actualAccuracy = similarConfidenceData.filter(d => d.isCorrect).length / similarConfidenceData.length;
        
        // Apply feature-based adjustments
        const featureAdjustment = this.calculateFeatureBasedAdjustment(features, trainingData);
        
        // Calibrate confidence based on actual performance
        const calibratedConfidence = this.calibrateConfidence(originalConfidence, actualAccuracy, featureAdjustment);
        
        return Math.max(10, Math.min(95, calibratedConfidence));
    }

    /**
     * Retrain models with latest data
     */
    private async retrainModels(): Promise<void> {
        console.log('🤖 Starting Oracle ML model retraining...');
        
        try {
            // Analyze current performance
            await this.analyzeModelPerformance();
            
            // Update feature importance
            await this.calculateFeatureImportance();
            
            // Generate new optimizations
            await this.optimizePredictionAlgorithms();
            
            // Update insights
            await this.generateMLInsights();
            
            console.log('✅ Oracle ML models retrained successfully');
        } catch (error) {
            console.error('❌ Failed to retrain Oracle ML models:', error);
        }
    }

    /**
     * Calculate model performance metrics
     */
    private calculateModelPerformance(data: MLTrainingData[]): Omit<ModelPerformance, 'type' | 'lastUpdated' | 'sampleSize'> {
        const totalPredictions = data.length;
        const correctPredictions = data.filter(d => d.isCorrect).length;
        
        const accuracy = correctPredictions / totalPredictions;
        
        // Calculate precision, recall, F1 score for binary classification
        const truePositives = data.filter(d => d.isCorrect && d.oracleChoice === 1).length;
        const falsePositives = data.filter(d => !d.isCorrect && d.oracleChoice === 1).length;
        const falseNegatives = data.filter(d => !d.isCorrect && d.oracleChoice === 0).length;
        
        const precision = truePositives / (truePositives + falsePositives) || 0;
        const recall = truePositives / (truePositives + falseNegatives) || 0;
        const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
        
        // Calculate calibration score (how well confidence matches actual accuracy)
        const calibrationScore = this.calculateCalibrationScore(data);
        
        // Calculate confidence correlation
        const confidenceCorrelation = this.calculateConfidenceCorrelation(data);
        
        return {
            accuracy,
            precision,
            recall,
            f1Score,
            calibrationScore,
            confidenceCorrelation
        };
    }

    /**
     * Optimize prediction algorithm for specific type
     */
    private async optimizePredictionType(data: MLTrainingData[], type: string): Promise<PredictionOptimization> {
        const currentAccuracy = data.filter(d => d.isCorrect).length / data.length;
        
        // Find optimal confidence threshold
        const optimizedThreshold = this.findOptimalConfidenceThreshold(data);
        
        // Calculate feature weights through correlation analysis
        const featureWeights = this.calculateOptimalFeatureWeights(data);
        
        // Identify patterns
        const patterns = this.identifyTypeSpecificPatterns(data, type);
        
        // Estimate improvement potential
        const improvementPotential = this.estimateImprovementPotential(data, optimizedThreshold, featureWeights);
        
        return {
            type,
            currentAccuracy,
            optimizedConfidenceThreshold: optimizedThreshold,
            recommendedFeatureWeights: featureWeights,
            identifiedPatterns: patterns,
            improvementPotential
        };
    }

    /**
     * Detect seasonal patterns in prediction accuracy
     */
    private detectSeasonalPatterns(data: MLTrainingData[]): Pattern[] {
        const patterns: Pattern[] = [];
        
        // Group by week number to find seasonal trends
        const weeklyAccuracy: Record<number, { correct: number; total: number }> = {};
        
        data.forEach(d => {
            if (!weeklyAccuracy[d.week]) {
                weeklyAccuracy[d.week] = { correct: 0, total: 0 };
            }
            weeklyAccuracy[d.week].total++;
            if (d.isCorrect) {
                weeklyAccuracy[d.week].correct++;
            }
        });
        
        const weeks = Object.keys(weeklyAccuracy).map(Number).sort((a, b) => a - b);
        const accuracies = weeks.map(week => weeklyAccuracy[week].correct / weeklyAccuracy[week].total);
        
        // Find early/mid/late season patterns
        if (weeks.length >= 12) {
            const earlySeasonAccuracy = accuracies.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
            const lateSeasonAccuracy = accuracies.slice(8).reduce((a, b) => a + b, 0) / (accuracies.length - 8);
            
            if (Math.abs(earlySeasonAccuracy - lateSeasonAccuracy) > 0.1) {
                patterns.push({
                    name: 'Seasonal Performance Variation',
                    description: `Accuracy varies significantly between early season (${(earlySeasonAccuracy * 100).toFixed(1)}%) and late season (${(lateSeasonAccuracy * 100).toFixed(1)}%)`,
                    confidence: 0.8,
                    supportingData: weeks.length,
                    actionable: true,
                    recommendation: 'Adjust prediction algorithms based on time of season'
                });
            }
        }
        
        return patterns;
    }

    // Helper methods for ML calculations
    private calculateCalibrationScore(data: MLTrainingData[]): number {
        // Bin predictions by confidence and calculate accuracy for each bin
        const bins = Array.from({ length: 10 }, (_, i) => ({
            range: [i * 10, (i + 1) * 10],
            predictions: [] as MLTrainingData[]
        }));
        
        data.forEach(d => {
            const binIndex = Math.min(9, Math.floor(d.confidence / 10));
            bins[binIndex].predictions.push(d);
        });
        
        let totalCalibrationError = 0;
        let totalWeight = 0;
        
        bins.forEach(bin => {
            if (bin.predictions.length > 0) {
                const avgConfidence = bin.predictions.reduce((sum, p) => sum + p.confidence, 0) / bin.predictions.length;
                const actualAccuracy = bin.predictions.filter(p => p.isCorrect).length / bin.predictions.length;
                const calibrationError = Math.abs(avgConfidence / 100 - actualAccuracy);
                
                totalCalibrationError += calibrationError * bin.predictions.length;
                totalWeight += bin.predictions.length;
            }
        });
        
        return totalWeight > 0 ? 1 - (totalCalibrationError / totalWeight) : 0;
    }

    private calculateConfidenceCorrelation(data: MLTrainingData[]): number {
        if (data.length < 10) return 0;
        
        const confidences = data.map(d => d.confidence);
        const accuracies = data.map(d => d.isCorrect ? 1 : 0);
        
        return this.calculateCorrelation(confidences, accuracies);
    }

    private calculateCorrelation(x: number[], y: number[]): number {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator !== 0 ? numerator / denominator : 0;
    }

    private shouldRetrain(): boolean {
        const lastRetraining = localStorage.getItem('oracleMLLastRetraining');
        if (!lastRetraining) return true;
        
        const daysSinceRetraining = (Date.now() - new Date(lastRetraining).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceRetraining >= this.RETRAINING_FREQUENCY_DAYS;
    }

    private extractFeatureNames(features: FeatureVector): string[] {
        return Object.keys(features).filter(key => 
            typeof features[key as keyof FeatureVector] === 'number' || 
            Array.isArray(features[key as keyof FeatureVector])
        );
    }

    private calculateFeatureCorrelation(data: MLTrainingData[], featureName: string): number {
        const featureValues = data.map(d => {
            const feature = d.features[featureName as keyof FeatureVector];
            return Array.isArray(feature) ? feature[0] || 0 : Number(feature) || 0;
        });
        
        const accuracies = data.map(d => d.isCorrect ? 1 : 0);
        
        return this.calculateCorrelation(featureValues, accuracies);
    }

    private calculateFeatureTrend(data: MLTrainingData[], featureName: string): 'INCREASING' | 'DECREASING' | 'STABLE' {
        if (data.length < 20) return 'STABLE';
        
        const recent = data.slice(-10);
        const earlier = data.slice(-20, -10);
        
        const recentCorr = this.calculateFeatureCorrelation(recent, featureName);
        const earlierCorr = this.calculateFeatureCorrelation(earlier, featureName);
        
        const change = recentCorr - earlierCorr;
        
        if (change > 0.1) return 'INCREASING';
        if (change < -0.1) return 'DECREASING';
        return 'STABLE';
    }

    private categorizeFeature(featureName: string): 'PLAYER' | 'TEAM' | 'GAME' | 'HISTORICAL' | 'META' {
        if (featureName.includes('player') || featureName.includes('Player')) return 'PLAYER';
        if (featureName.includes('team') || featureName.includes('Team')) return 'TEAM';
        if (featureName.includes('game') || featureName.includes('weather') || featureName.includes('venue')) return 'GAME';
        if (featureName.includes('historical') || featureName.includes('seasonal') || featureName.includes('headToHead')) return 'HISTORICAL';
        return 'META';
    }

    // Additional helper methods would be implemented here...
    private detectConfidencePatterns(data: MLTrainingData[]): Pattern[] { return []; }
    private detectFeatureCombinationPatterns(data: MLTrainingData[]): Pattern[] { return []; }
    private detectOpponentPatterns(data: MLTrainingData[]): Pattern[] { return []; }
    private detectTimingPatterns(data: MLTrainingData[]): Pattern[] { return []; }
    private detectAccuracyDrift(data: MLTrainingData[]): MLInsight | null { return null; }
    private detectConfidenceIssues(data: MLTrainingData[]): MLInsight[] { return []; }
    private async detectFeatureImportanceShifts(): Promise<MLInsight[]> { return []; }
    private detectSeasonalInsights(data: MLTrainingData[]): MLInsight[] { return []; }
    private calculateFeatureBasedAdjustment(features: FeatureVector, data: MLTrainingData[]): number { return 0; }
    private calibrateConfidence(original: number, actual: number, adjustment: number): number { return original; }
    private findOptimalConfidenceThreshold(data: MLTrainingData[]): number { return 75; }
    private calculateOptimalFeatureWeights(data: MLTrainingData[]): Record<string, number> { return {}; }
    private identifyTypeSpecificPatterns(data: MLTrainingData[], type: string): Pattern[] { return []; }
    private estimateImprovementPotential(data: MLTrainingData[], threshold: number, weights: Record<string, number>): number { return 0; }

    // Storage methods
    private getStoredTrainingData(): MLTrainingData[] {
        try {
            const stored = localStorage.getItem(this.TRAINING_DATA_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load ML training data:', error);
            return [];
        }
    }

    private storeTrainingData(data: MLTrainingData[]): void {
        try {
            localStorage.setItem(this.TRAINING_DATA_KEY, JSON.stringify(data));
            localStorage.setItem('oracleMLLastRetraining', new Date().toISOString());
        } catch (error) {
            console.error('Failed to store ML training data:', error);
        }
    }

    private storeModelPerformance(performance: ModelPerformance[]): void {
        try {
            localStorage.setItem(this.MODEL_PERFORMANCE_KEY, JSON.stringify(performance));
        } catch (error) {
            console.error('Failed to store model performance:', error);
        }
    }

    private storeFeatureImportance(importance: FeatureImportance[]): void {
        try {
            localStorage.setItem(this.FEATURE_IMPORTANCE_KEY, JSON.stringify(importance));
        } catch (error) {
            console.error('Failed to store feature importance:', error);
        }
    }

    private storeMLInsights(insights: MLInsight[]): void {
        try {
            localStorage.setItem(this.ML_INSIGHTS_KEY, JSON.stringify(insights));
        } catch (error) {
            console.error('Failed to store ML insights:', error);
        }
    }
}

// Export singleton instance
export const oracleMachineLearningService = new OracleMachineLearningService();
export default oracleMachineLearningService;
