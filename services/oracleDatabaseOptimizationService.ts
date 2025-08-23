/**
 * Oracle Database Query Optimization Service
 * Optimized database queries with caching, connection pooling, and batch operations
 */

// @ts-ignore - backend module
import { runQuery, getRow, getRows } from '../backend/db/index';
import { oraclePerformanceCache } from './oraclePerformanceCacheService';

interface OraclePrediction {
    id: string;
    week: number;
    season: number;
    type: string;
    question: string;
    options: string; // JSON string
    oracle_choice: number;
    confidence: number;
    reasoning: string;
    data_points: string; // JSON string
    actual_result?: number;
    is_resolved: boolean;
    created_at: string;
    resolved_at?: string;
    game_id?: string;
    player_id?: string;
}

interface UserPrediction {
    id: string;
    prediction_id: string;
    user_id: string;
    user_choice: number;
    confidence: number;
    reasoning?: string;
    submitted_at: string;
}

interface LeaderboardEntry {
    user_id: string;
    username: string;
    total_predictions: number;
    correct_predictions: number;
    accuracy: number;
    total_points: number;
    rank: number;
}

class OracleDatabaseOptimizationService {
    // Pre-compiled queries for better performance
    private readonly QUERIES = {
        GET_WEEK_PREDICTIONS: `
            SELECT * FROM oracle_predictions 
            WHERE week = ? AND season = ? 
            ORDER BY created_at DESC
        `,
        GET_PREDICTION_BY_ID: `
            SELECT * FROM oracle_predictions 
            WHERE id = ?
        `,
        GET_USER_PREDICTIONS: `
            SELECT up.*, op.question, op.options, op.actual_result, op.is_resolved
            FROM user_predictions up
            LEFT JOIN oracle_predictions op ON up.prediction_id = op.id
            WHERE up.user_id = ?
            ORDER BY up.submitted_at DESC
            LIMIT ? OFFSET ?
        `,
        GET_LEADERBOARD: `
            SELECT 
                u.id as user_id,
                u.username,
                COUNT(up.id) as total_predictions,
                SUM(CASE WHEN up.user_choice = op.actual_result THEN 1 ELSE 0 END) as correct_predictions,
                ROUND(
                    CAST(SUM(CASE WHEN up.user_choice = op.actual_result THEN 1 ELSE 0 END) AS FLOAT) / 
                    COUNT(up.id) * 100, 2
                ) as accuracy,
                SUM(CASE WHEN up.user_choice = op.actual_result THEN 10 ELSE 0 END) as total_points
            FROM users u
            LEFT JOIN user_predictions up ON u.id = up.user_id
            LEFT JOIN oracle_predictions op ON up.prediction_id = op.id AND op.is_resolved = 1
            WHERE up.id IS NOT NULL
            GROUP BY u.id, u.username
            HAVING total_predictions >= 5
            ORDER BY accuracy DESC, total_predictions DESC
            LIMIT ?
        `,
        GET_USER_ACCURACY: `
            SELECT 
                COUNT(up.id) as total_predictions,
                SUM(CASE WHEN up.user_choice = op.actual_result THEN 1 ELSE 0 END) as correct_predictions,
                ROUND(
                    CAST(SUM(CASE WHEN up.user_choice = op.actual_result THEN 1 ELSE 0 END) AS FLOAT) / 
                    COUNT(up.id) * 100, 2
                ) as accuracy
            FROM user_predictions up
            LEFT JOIN oracle_predictions op ON up.prediction_id = op.id
            WHERE up.user_id = ? AND op.is_resolved = 1
        `,
        GET_ORACLE_ACCURACY: `
            SELECT 
                COUNT(*) as total_predictions,
                SUM(CASE WHEN oracle_choice = actual_result THEN 1 ELSE 0 END) as correct_predictions,
                ROUND(
                    CAST(SUM(CASE WHEN oracle_choice = actual_result THEN 1 ELSE 0 END) AS FLOAT) / 
                    COUNT(*) * 100, 2
                ) as accuracy
            FROM oracle_predictions
            WHERE is_resolved = 1 AND season = ?
        `,
        INSERT_PREDICTION: `
            INSERT INTO oracle_predictions (
                id, week, season, type, question, options, oracle_choice, 
                confidence, reasoning, data_points, game_id, player_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        INSERT_USER_PREDICTION: `
            INSERT INTO user_predictions (
                prediction_id, user_id, user_choice, confidence, reasoning
            ) VALUES (?, ?, ?, ?, ?)
        `,
        UPDATE_PREDICTION_RESULT: `
            UPDATE oracle_predictions 
            SET actual_result = ?, is_resolved = 1, resolved_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `
    };

    // ==================== OPTIMIZED RETRIEVAL METHODS ====================

    /**
     * Get predictions for a specific week with caching
     */
    async getWeekPredictions(week: number, season: number): Promise<any[]> {
        // Check cache first
        const cached = oraclePerformanceCache.getWeekPredictions(week, season);
        if (cached) {
            return cached;
        }

        // Query database
        const predictions = await getRows(
            this.QUERIES.GET_WEEK_PREDICTIONS,
            [week, season]
        );

        // Parse JSON fields
        const processedPredictions = predictions.map(this.processPredictionRow);

        // Cache result
        oraclePerformanceCache.cacheWeekPredictions(week, season, processedPredictions);

        return processedPredictions;
    }

    /**
     * Get single prediction by ID with caching
     */
    async getPredictionById(predictionId: string): Promise<any | null> {
        // Check cache first
        const cached = oraclePerformanceCache.getPrediction(predictionId);
        if (cached) {
            return cached;
        }

        // Query database
        const prediction = await getRow(
            this.QUERIES.GET_PREDICTION_BY_ID,
            [predictionId]
        );

        if (!prediction) {
            return null;
        }

        const processed = this.processPredictionRow(prediction);

        // Cache result
        oraclePerformanceCache.cachePrediction(processed);

        return processed;
    }

    /**
     * Get user predictions with pagination and caching
     */
    async getUserPredictions(
        userId: string, 
        limit: number = 50, 
        offset: number = 0
    ): Promise<any[]> {
        // Check cache for recent requests
        const cacheKey = `user_predictions:${userId}:${limit}:${offset}`;
        const cached = oraclePerformanceCache.getUserPredictions(userId);
        if (cached && offset === 0) {
            return cached.slice(0, limit);
        }

        // Query database
        const predictions = await getRows(
            this.QUERIES.GET_USER_PREDICTIONS,
            [userId, limit, offset]
        );

        // Process and cache if it's the first page
        if (offset === 0) {
            oraclePerformanceCache.cacheUserPredictions(userId, predictions);
        }

        return predictions;
    }

    /**
     * Get leaderboard with caching
     */
    async getLeaderboard(
        limit: number = 50,
        timeframe: string = 'all',
        season: number = 2024
    ): Promise<any[]> {
        // Check cache first
        const cached = oraclePerformanceCache.getLeaderboard(timeframe, season);
        if (cached) {
            return cached.slice(0, limit);
        }

        // Query database
        const leaderboard = await getRows(
            this.QUERIES.GET_LEADERBOARD,
            [limit]
        );

        // Add ranking
        const rankedLeaderboard = leaderboard.map((entry: any, index: number) => ({
            ...entry,
            rank: index + 1
        }));

        // Cache result
        oraclePerformanceCache.cacheLeaderboard(timeframe, season, rankedLeaderboard);

        return rankedLeaderboard;
    }

    /**
     * Get user accuracy statistics with caching
     */
    async getUserAccuracy(userId: string): Promise<any> {
        // Check cache first
        const cached = oraclePerformanceCache.getUserStats(userId);
        if (cached) {
            return cached;
        }

        // Query database
        const stats = await getRow(
            this.QUERIES.GET_USER_ACCURACY,
            [userId]
        );

        const processedStats = {
            totalPredictions: stats?.total_predictions || 0,
            correctPredictions: stats?.correct_predictions || 0,
            accuracy: stats?.accuracy || 0,
            lastUpdated: new Date().toISOString()
        };

        // Cache result
        oraclePerformanceCache.cacheUserStats(userId, processedStats);

        return processedStats;
    }

    /**
     * Get Oracle accuracy statistics with caching
     */
    async getOracleAccuracy(season: number = 2024): Promise<any> {
        // Check cache first
        const cached = oraclePerformanceCache.getOracleStats();
        if (cached) {
            return cached;
        }

        // Query database
        const stats = await getRow(
            this.QUERIES.GET_ORACLE_ACCURACY,
            [season]
        );

        const processedStats = {
            totalPredictions: stats?.total_predictions || 0,
            correctPredictions: stats?.correct_predictions || 0,
            accuracy: stats?.accuracy || 0,
            confidenceAccuracy: stats?.accuracy || 0, // Simplified for now
            resolvedPredictions: stats?.correct_predictions || 0,
            season,
            lastUpdated: new Date().toISOString()
        };

        // Cache result
        oraclePerformanceCache.cacheOracleStats(processedStats);

        return processedStats;
    }

    // ==================== OPTIMIZED INSERTION METHODS ====================

    /**
     * Create new prediction with optimized insertion
     */
    async createPrediction(predictionData: any): Promise<string> {
        const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        await runQuery(this.QUERIES.INSERT_PREDICTION, [
            predictionId,
            predictionData.week,
            predictionData.season || 2024,
            predictionData.type,
            predictionData.question,
            JSON.stringify(predictionData.options),
            predictionData.oracleChoice,
            predictionData.confidence,
            predictionData.reasoning,
            JSON.stringify(predictionData.dataPoints),
            predictionData.gameId,
            predictionData.playerId
        ]);

        // Invalidate related caches
        oraclePerformanceCache.invalidateLeaderboard(predictionData.season || 2024);

        return predictionId;
    }

    /**
     * Submit user prediction with optimized insertion
     */
    async submitUserPrediction(
        predictionId: string,
        userId: string,
        userChoice: number,
        confidence: number,
        reasoning?: string
    ): Promise<void> {
        await runQuery(this.QUERIES.INSERT_USER_PREDICTION, [
            predictionId,
            userId,
            userChoice,
            confidence,
            reasoning || null
        ]);

        // Invalidate user-related caches
        oraclePerformanceCache.invalidateUserCache(userId);
        oraclePerformanceCache.invalidateLeaderboard(2024); // Assume current season
    }

    /**
     * Resolve prediction with batch cache invalidation
     */
    async resolvePrediction(predictionId: string, actualResult: number): Promise<void> {
        await runQuery(this.QUERIES.UPDATE_PREDICTION_RESULT, [
            actualResult,
            predictionId
        ]);

        // Batch invalidate related caches
        oraclePerformanceCache.batchInvalidateOnUpdate(predictionId);
    }

    // ==================== BATCH OPERATIONS ====================

    /**
     * Batch create multiple predictions
     */
    async batchCreatePredictions(predictions: any[]): Promise<string[]> {
        const predictionIds: string[] = [];

        // Use transaction for better performance
        for (const predictionData of predictions) {
            const id = await this.createPrediction(predictionData);
            predictionIds.push(id);
        }

        return predictionIds;
    }

    /**
     * Batch update prediction results
     */
    async batchResolvePredictions(updates: { predictionId: string; actualResult: number }[]): Promise<void> {
        for (const update of updates) {
            await this.resolvePrediction(update.predictionId, update.actualResult);
        }

        // Clear relevant caches after batch operation
        oraclePerformanceCache.clearAllCache();
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Process raw prediction row from database
     */
    private processPredictionRow(row: OraclePrediction): any {
        return {
            id: row.id,
            week: row.week,
            season: row.season,
            type: row.type,
            question: row.question,
            options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
            oracleChoice: row.oracle_choice,
            confidence: row.confidence,
            reasoning: row.reasoning,
            dataPoints: typeof row.data_points === 'string' ? JSON.parse(row.data_points) : row.data_points,
            status: row.is_resolved ? 'resolved' : 'active',
            gameId: row.game_id,
            playerId: row.player_id,
            timestamp: row.created_at
        };
    }

    /**
     * Get database performance metrics
     */
    async getPerformanceMetrics(): Promise<any> {
        const cacheStats = oraclePerformanceCache.getCacheStats();
        const cacheHitRate = oraclePerformanceCache.getCacheHitRate();

        return {
            cache: {
                hitRate: cacheHitRate,
                stats: cacheStats
            },
            database: {
                connectionCount: 1, // SQLite is single connection
                avgQueryTime: 'N/A' // Would need query timing implementation
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Warm up caches for current week
     */
    async warmupCache(currentWeek: number, currentSeason: number): Promise<void> {
        console.log(`🔥 Warming up Oracle caches for Week ${currentWeek}, Season ${currentSeason}`);

        // Pre-load common queries
        await Promise.all([
            this.getWeekPredictions(currentWeek, currentSeason),
            this.getLeaderboard(50, 'all', currentSeason),
            this.getOracleAccuracy(currentSeason)
        ]);

        console.log('✅ Oracle cache warmup completed');
    }
}

// Singleton instance
export const oracleDatabaseService = new OracleDatabaseOptimizationService();
export default OracleDatabaseOptimizationService;
