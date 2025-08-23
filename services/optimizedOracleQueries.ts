/**
 * Optimized Database Queries for Oracle Analytics
 * Performance-tuned queries with caching integration
 */

// @ts-ignore - backend module
import { getRows, getRow, runQuery } from '../backend/db/index';
import { oraclePerformanceService } from './oraclePerformanceService';

export interface OptimizedQueryConfig {
    enableCache: boolean;
    cacheTTL: number;
    enablePagination: boolean;
    pageSize: number;
    enableIndexHints: boolean;
}

export interface QueryResult<T> {
    data: T[];
    total: number;
    cached: boolean;
    executionTime: number;
    page?: number;
    pageSize?: number;
}

export interface PaginationOptions {
    page: number;
    pageSize: number;
}

/**
 * Optimized Oracle Analytics Query Service
 */
export class OptimizedOracleQueries {
    private readonly defaultConfig: OptimizedQueryConfig = {
        enableCache: true,
        cacheTTL: 300, // 5 minutes
        enablePagination: true,
        pageSize: 50,
        enableIndexHints: true
    };

    /**
     * Get Oracle predictions with optimized query and caching
     */
    async getOraclePredictionsOptimized(
        week?: number,
        season?: number,
        type?: string,
        status?: string,
        pagination?: PaginationOptions,
        config: Partial<OptimizedQueryConfig> = {}
    ): Promise<QueryResult<any>> {
        const queryConfig = { ...this.defaultConfig, ...config };
        const startTime = Date.now();

        // Generate cache key
        const cacheKey = oraclePerformanceService.generatePredictionCacheKey(
            week || 0, 
            season || 0, 
            type
        ) + `${status || ''}:${pagination?.page || 0}:${pagination?.pageSize || 0}`;

        // Check cache first
        if (queryConfig.enableCache) {
            const cached = oraclePerformanceService.getCachedPredictions(cacheKey);
            if (cached) {
                return {
                    ...cached,
                    cached: true,
                    executionTime: Date.now() - startTime
                };
            }
        }

        // Build optimized query with proper indexing hints
        let query = `
            SELECT ${queryConfig.enableIndexHints ? '/*+ INDEX(op, idx_oracle_predictions_week_season) */' : ''}
                op.id,
                op.week,
                op.season,
                op.type,
                op.question,
                op.options,
                op.oracle_choice,
                op.oracle_confidence,
                op.oracle_reasoning,
                op.status,
                op.created_at,
                op.closes_at,
                op.resolved_at,
                COUNT(up.id) as submission_count,
                AVG(up.confidence) as avg_user_confidence
            FROM oracle_predictions op
            LEFT JOIN user_predictions up ON op.id = up.prediction_id
        `;

        const params: any[] = [];
        const conditions: string[] = [];

        // Add filtering conditions
        if (week !== undefined) {
            conditions.push('op.week = ?');
            params.push(week);
        }
        if (season !== undefined) {
            conditions.push('op.season = ?');
            params.push(season);
        }
        if (type) {
            conditions.push('op.type = ?');
            params.push(type);
        }
        if (status) {
            conditions.push('op.status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ' GROUP BY op.id';
        query += ' ORDER BY op.week DESC, op.created_at DESC';

        // Add pagination
        if (queryConfig.enablePagination && pagination) {
            const offset = (pagination.page - 1) * pagination.pageSize;
            query += ` LIMIT ${pagination.pageSize} OFFSET ${offset}`;
        }

        try {
            // Execute main query
            const data = await getRows(query, params);
            
            // Get total count for pagination (if needed)
            let total = data.length;
            if (queryConfig.enablePagination && pagination) {
                const countQuery = `
                    SELECT COUNT(DISTINCT op.id) as total
                    FROM oracle_predictions op
                    ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
                `;
                const countResult = await getRow(countQuery, params);
                total = countResult?.total || 0;
            }

            const result = {
                data,
                total,
                cached: false,
                executionTime: Date.now() - startTime,
                page: pagination?.page,
                pageSize: pagination?.pageSize
            };

            // Cache the result
            if (queryConfig.enableCache) {
                oraclePerformanceService.cachePredictions(cacheKey, result);
            }

            // Record performance metrics
            oraclePerformanceService.recordQueryMetrics('getOraclePredictions', result.executionTime);

            return result;

        } catch (error) {
            console.error('❌ Optimized Oracle predictions query failed:', error);
            throw error;
        }
    }

    /**
     * Get user analytics with optimized aggregation
     */
    async getUserAnalyticsOptimized(
        userId: number,
        timeframe: 'week' | 'month' | 'season' = 'month',
        season?: number,
        config: Partial<OptimizedQueryConfig> = {}
    ): Promise<QueryResult<any>> {
        const queryConfig = { ...this.defaultConfig, ...config };
        const startTime = Date.now();

        // Generate cache key
        const cacheKey = oraclePerformanceService.generateUserAnalyticsCacheKey(userId, timeframe, season);

        // Check cache first
        if (queryConfig.enableCache) {
            const cached = oraclePerformanceService.getCachedUserData(cacheKey);
            if (cached) {
                return {
                    ...cached,
                    cached: true,
                    executionTime: Date.now() - startTime
                };
            }
        }

        try {
            // Optimized user analytics query with proper indexing
            const query = `
                SELECT ${queryConfig.enableIndexHints ? '/*+ INDEX(up, idx_user_predictions_user_id) */' : ''}
                    u.id as user_id,
                    u.display_name,
                    COUNT(up.id) as total_predictions,
                    SUM(CASE WHEN up.user_choice = op.oracle_choice THEN 1 ELSE 0 END) as correct_predictions,
                    (SUM(CASE WHEN up.user_choice = op.oracle_choice THEN 1 ELSE 0 END) * 100.0 / COUNT(up.id)) as accuracy_rate,
                    AVG(up.confidence) as avg_confidence,
                    AVG(CASE WHEN up.user_choice = op.oracle_choice THEN up.confidence ELSE 0 END) as avg_correct_confidence,
                    COUNT(DISTINCT op.week) as weeks_participated,
                    MAX(up.submitted_at) as last_prediction,
                    SUM(CASE WHEN up.confidence >= 80 THEN 1 ELSE 0 END) as high_confidence_predictions,
                    SUM(CASE WHEN up.confidence >= 80 AND up.user_choice = op.oracle_choice THEN 1 ELSE 0 END) as high_confidence_correct
                FROM users u
                INNER JOIN user_predictions up ON u.id = up.user_id
                INNER JOIN oracle_predictions op ON up.prediction_id = op.id
                WHERE u.id = ?
                ${season ? 'AND op.season = ?' : ''}
                ${timeframe === 'week' ? 'AND op.week >= CAST(strftime("%W", "now") AS INTEGER)' : ''}
                ${timeframe === 'month' ? 'AND up.submitted_at >= date("now", "-1 month")' : ''}
                GROUP BY u.id, u.display_name
            `;

            const params = [userId];
            if (season) {
                params.push(season);
            }

            const data = await getRows(query, params);

            const result = {
                data,
                total: data.length,
                cached: false,
                executionTime: Date.now() - startTime
            };

            // Cache the result
            if (queryConfig.enableCache) {
                oraclePerformanceService.cacheUserData(cacheKey, result);
            }

            // Record performance metrics
            oraclePerformanceService.recordQueryMetrics('getUserAnalytics', result.executionTime);

            return result;

        } catch (error) {
            console.error('❌ Optimized user analytics query failed:', error);
            throw error;
        }
    }

    /**
     * Get Oracle accuracy analytics with advanced aggregation
     */
    async getOracleAccuracyAnalyticsOptimized(
        startDate: string,
        endDate: string,
        groupBy: 'day' | 'week' | 'month' = 'week',
        config: Partial<OptimizedQueryConfig> = {}
    ): Promise<QueryResult<any>> {
        const queryConfig = { ...this.defaultConfig, ...config };
        const startTime = Date.now();

        // Generate cache key
        const cacheKey = oraclePerformanceService.generateAnalyticsCacheKey(
            startDate,
            endDate,
            ['accuracy', 'confidence'],
            groupBy
        );

        // Check cache first
        if (queryConfig.enableCache) {
            const cached = oraclePerformanceService.getCachedAnalytics(cacheKey);
            if (cached) {
                return {
                    ...cached,
                    cached: true,
                    executionTime: Date.now() - startTime
                };
            }
        }

        try {
            // Build optimized analytics query with proper date formatting
            const dateFormat = {
                day: '%Y-%m-%d',
                week: '%Y-%W',
                month: '%Y-%m'
            }[groupBy];

            const query = `
                SELECT ${queryConfig.enableIndexHints ? '/*+ INDEX(op, idx_oracle_predictions_created_at) */' : ''}
                    strftime('${dateFormat}', op.created_at) as period,
                    op.type,
                    COUNT(*) as total_predictions,
                    SUM(CASE WHEN op.oracle_choice = op.actual_result THEN 1 ELSE 0 END) as correct_predictions,
                    (SUM(CASE WHEN op.oracle_choice = op.actual_result THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as accuracy_rate,
                    AVG(op.oracle_confidence) as avg_oracle_confidence,
                    AVG(CASE WHEN op.oracle_choice = op.actual_result THEN op.oracle_confidence ELSE 0 END) as avg_correct_confidence,
                    COUNT(DISTINCT op.week) as weeks_covered,
                    
                    -- User performance vs Oracle
                    COUNT(DISTINCT up.user_id) as unique_users,
                    AVG(up.confidence) as avg_user_confidence,
                    SUM(CASE WHEN up.user_choice = op.oracle_choice THEN 1 ELSE 0 END) as users_agreed_with_oracle,
                    (SUM(CASE WHEN up.user_choice = op.oracle_choice THEN 1 ELSE 0 END) * 100.0 / COUNT(up.id)) as oracle_agreement_rate,
                    
                    -- Confidence calibration
                    AVG(ABS(op.oracle_confidence - 
                        CASE WHEN op.oracle_choice = op.actual_result THEN 100 ELSE 0 END)) as confidence_calibration_error
                    
                FROM oracle_predictions op
                LEFT JOIN user_predictions up ON op.id = up.prediction_id
                WHERE op.created_at BETWEEN ? AND ?
                    AND op.status = 'resolved'
                GROUP BY strftime('${dateFormat}', op.created_at), op.type
                ORDER BY period DESC, op.type
            `;

            const data = await getRows(query, [startDate, endDate]);

            const result = {
                data,
                total: data.length,
                cached: false,
                executionTime: Date.now() - startTime
            };

            // Cache the result
            if (queryConfig.enableCache) {
                oraclePerformanceService.cacheAnalytics(cacheKey, result);
            }

            // Record performance metrics
            oraclePerformanceService.recordQueryMetrics('getOracleAccuracyAnalytics', result.executionTime);

            return result;

        } catch (error) {
            console.error('❌ Optimized Oracle accuracy analytics query failed:', error);
            throw error;
        }
    }

    /**
     * Get leaderboard with optimized ranking calculation
     */
    async getLeaderboardOptimized(
        season?: number,
        week?: number,
        limit: number = 50,
        config: Partial<OptimizedQueryConfig> = {}
    ): Promise<QueryResult<any>> {
        const queryConfig = { ...this.defaultConfig, ...config };
        const startTime = Date.now();

        // Generate cache key
        const cacheKey = `leaderboard:${season || 'all'}:${week || 'all'}:${limit}`;

        // Check cache first
        if (queryConfig.enableCache) {
            const cached = oraclePerformanceService.getCachedQuery(cacheKey);
            if (cached) {
                return {
                    ...cached,
                    cached: true,
                    executionTime: Date.now() - startTime
                };
            }
        }

        try {
            // Optimized leaderboard query with ranking window functions
            const query = `
                WITH user_stats AS (
                    SELECT ${queryConfig.enableIndexHints ? '/*+ INDEX(up, idx_user_predictions_user_id) */' : ''}
                        u.id,
                        u.display_name,
                        u.avatar_url,
                        COUNT(up.id) as total_predictions,
                        SUM(CASE WHEN up.user_choice = op.oracle_choice THEN 1 ELSE 0 END) as correct_predictions,
                        (SUM(CASE WHEN up.user_choice = op.oracle_choice THEN 1 ELSE 0 END) * 100.0 / COUNT(up.id)) as accuracy_rate,
                        AVG(up.confidence) as avg_confidence,
                        SUM(CASE WHEN up.user_choice = op.oracle_choice THEN up.confidence ELSE 0 END) as confidence_score,
                        COUNT(DISTINCT op.week) as weeks_participated,
                        MAX(up.submitted_at) as last_prediction_date
                    FROM users u
                    INNER JOIN user_predictions up ON u.id = up.user_id
                    INNER JOIN oracle_predictions op ON up.prediction_id = op.id
                    WHERE op.status = 'resolved'
                        ${season ? 'AND op.season = ?' : ''}
                        ${week ? 'AND op.week = ?' : ''}
                    GROUP BY u.id, u.display_name, u.avatar_url
                    HAVING COUNT(up.id) >= 5  -- Minimum 5 predictions to qualify
                )
                SELECT 
                    *,
                    ROW_NUMBER() OVER (ORDER BY accuracy_rate DESC, confidence_score DESC, total_predictions DESC) as rank,
                    ROUND(accuracy_rate, 2) as accuracy_percentage,
                    ROUND(avg_confidence, 1) as avg_confidence_rounded
                FROM user_stats
                ORDER BY rank
                LIMIT ?
            `;

            const params: any[] = [];
            if (season) params.push(season);
            if (week) params.push(week);
            params.push(limit);

            const data = await getRows(query, params);

            const result = {
                data,
                total: data.length,
                cached: false,
                executionTime: Date.now() - startTime
            };

            // Cache the result
            if (queryConfig.enableCache) {
                oraclePerformanceService.cacheQuery(cacheKey, result);
            }

            // Record performance metrics
            oraclePerformanceService.recordQueryMetrics('getLeaderboard', result.executionTime);

            return result;

        } catch (error) {
            console.error('❌ Optimized leaderboard query failed:', error);
            throw error;
        }
    }

    /**
     * Batch update predictions for better performance
     */
    async batchUpdatePredictions(updates: Array<{ id: string; actualResult: number; resolvedAt?: Date }>): Promise<number> {
        const startTime = Date.now();

        try {
            // Use transaction for batch updates
            await runQuery('BEGIN TRANSACTION');

            let updatedCount = 0;
            
            // Process in chunks to avoid memory issues
            const chunkSize = 100;
            for (let i = 0; i < updates.length; i += chunkSize) {
                const chunk = updates.slice(i, i + chunkSize);
                
                // Build batch update query
                const placeholders = chunk.map(() => '(?, ?, ?)').join(', ');
                const query = `
                    INSERT OR REPLACE INTO oracle_predictions (id, actual_result, resolved_at, status)
                    VALUES ${placeholders}
                `;
                
                const params: any[] = [];
                chunk.forEach(update => {
                    params.push(
                        update.id,
                        update.actualResult,
                        update.resolvedAt ? update.resolvedAt.toISOString() : new Date().toISOString()
                    );
                });

                await runQuery(query, params);
                updatedCount += chunk.length;
            }

            await runQuery('COMMIT');

            // Invalidate related caches
            oraclePerformanceService.clearCache('predictions');
            oraclePerformanceService.clearCache('analytics');

            // Record performance metrics
            oraclePerformanceService.recordQueryMetrics('batchUpdatePredictions', Date.now() - startTime);

            return updatedCount;

        } catch (error) {
            await runQuery('ROLLBACK');
            console.error('❌ Batch update failed:', error);
            throw error;
        }
    }

    /**
     * Create optimized database indexes for better query performance
     */
    async createOptimizedIndexes(): Promise<void> {
        const indexes = [
            // Oracle predictions indexes
            'CREATE INDEX IF NOT EXISTS idx_oracle_predictions_week_season ON oracle_predictions (week, season)',
            'CREATE INDEX IF NOT EXISTS idx_oracle_predictions_type_status ON oracle_predictions (type, status)',
            'CREATE INDEX IF NOT EXISTS idx_oracle_predictions_created_at ON oracle_predictions (created_at)',
            'CREATE INDEX IF NOT EXISTS idx_oracle_predictions_status_week ON oracle_predictions (status, week)',

            // User predictions indexes
            'CREATE INDEX IF NOT EXISTS idx_user_predictions_user_id ON user_predictions (user_id)',
            'CREATE INDEX IF NOT EXISTS idx_user_predictions_prediction_id ON user_predictions (prediction_id)',
            'CREATE INDEX IF NOT EXISTS idx_user_predictions_submitted_at ON user_predictions (submitted_at)',
            'CREATE INDEX IF NOT EXISTS idx_user_predictions_user_choice ON user_predictions (user_choice)',

            // Composite indexes for common query patterns
            'CREATE INDEX IF NOT EXISTS idx_oracle_predictions_composite ON oracle_predictions (season, week, type, status)',
            'CREATE INDEX IF NOT EXISTS idx_user_predictions_composite ON user_predictions (user_id, prediction_id, user_choice)',

            // Analytics optimization indexes
            'CREATE INDEX IF NOT EXISTS idx_oracle_analytics_user_week ON oracle_analytics (user_id, week)',
            'CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON user_analytics (created_at)',
        ];

        try {
            for (const indexQuery of indexes) {
                await runQuery(indexQuery);
            }
            console.log('✅ Optimized database indexes created successfully');
        } catch (error) {
            console.error('❌ Failed to create optimized indexes:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const optimizedOracleQueries = new OptimizedOracleQueries();
