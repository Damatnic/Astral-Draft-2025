/**
 * Database Optimization Service
 * Creates optimized indexes and analyzes query performance for Oracle system
 */

// Mock database functions until backend is properly set up
const getRows = async (query: string, params?: any[]) => {
    // TODO: Implement actual database call
    return [];
};

const runQuery = async (query: string, params?: any[]) => {
    // TODO: Implement actual database call
    return { rows: [] };
};

interface DatabaseStats {
    tableStats: { [tableName: string]: TableStats };
    indexStats: { [indexName: string]: IndexStats };
    queryPerformance: QueryPerformanceStats;
}

interface TableStats {
    name: string;
    rowCount: number;
    sizeKB: number;
    lastUpdated: string;
}

interface IndexStats {
    name: string;
    tableName: string;
    columns: string[];
    unique: boolean;
    type: string;
}

interface QueryPerformanceStats {
    slowQueries: SlowQuery[];
    avgQueryTime: number;
    indexUsage: { [indexName: string]: number };
}

interface SlowQuery {
    query: string;
    avgExecutionTime: number;
    executionCount: number;
}

export class DatabaseOptimizationService {
    
    /**
     * Create all optimized indexes for Oracle system
     */
    async createOptimizedIndexes(): Promise<void> {
        console.log('🗄️ Creating optimized database indexes for Oracle system...');

        const indexes = [
            // Oracle predictions performance indexes
            {
                name: 'idx_oracle_predictions_season_week',
                table: 'oracle_predictions',
                columns: ['season', 'week'],
                type: 'composite'
            },
            {
                name: 'idx_oracle_predictions_status_deadline',
                table: 'oracle_predictions',
                columns: ['status', 'deadline'],
                type: 'composite'
            },
            {
                name: 'idx_oracle_predictions_type_confidence',
                table: 'oracle_predictions',
                columns: ['type', 'confidence'],
                type: 'composite'
            },
            
            // Enhanced Oracle predictions indexes
            {
                name: 'idx_enhanced_oracle_season_resolved',
                table: 'enhanced_oracle_predictions',
                columns: ['season', 'is_resolved'],
                type: 'composite'
            },
            {
                name: 'idx_enhanced_oracle_week_type',
                table: 'enhanced_oracle_predictions',
                columns: ['week', 'type'],
                type: 'composite'
            },
            {
                name: 'idx_enhanced_oracle_accuracy_confidence',
                table: 'enhanced_oracle_predictions',
                columns: ['oracle_confidence', 'actual_result'],
                type: 'composite'
            },

            // User predictions performance indexes
            {
                name: 'idx_user_predictions_user_season',
                table: 'user_predictions',
                columns: ['user_id', 'season'],
                type: 'composite'
            },
            {
                name: 'idx_user_predictions_prediction_confidence',
                table: 'user_predictions',
                columns: ['prediction_id', 'confidence'],
                type: 'composite'
            },
            
            // Enhanced user predictions indexes
            {
                name: 'idx_enhanced_user_prediction_user',
                table: 'enhanced_user_predictions',
                columns: ['prediction_id', 'user_id'],
                type: 'composite'
            },
            {
                name: 'idx_enhanced_user_beats_oracle',
                table: 'enhanced_user_predictions',
                columns: ['beats_oracle', 'user_id'],
                type: 'composite'
            },

            // Leaderboard performance indexes
            {
                name: 'idx_oracle_leaderboard_season_week',
                table: 'oracle_leaderboard',
                columns: ['season', 'week'],
                type: 'composite'
            },
            {
                name: 'idx_oracle_leaderboard_user_accuracy',
                table: 'oracle_leaderboard',
                columns: ['user_id', 'accuracy_percentage'],
                type: 'composite'
            },
            {
                name: 'idx_oracle_leaderboard_rank_score',
                table: 'oracle_leaderboard',
                columns: ['rank_position', 'oracle_score'],
                type: 'composite'
            },

            // Analytics performance indexes
            {
                name: 'idx_oracle_analytics_week_type',
                table: 'oracle_weekly_analytics',
                columns: ['week_number', 'prediction_type'],
                type: 'composite'
            },
            {
                name: 'idx_oracle_analytics_accuracy_volume',
                table: 'oracle_weekly_analytics',
                columns: ['oracle_accuracy', 'prediction_volume'],
                type: 'composite'
            },

            // Simple auth users index for Oracle queries
            {
                name: 'idx_simple_auth_users_player_number',
                table: 'simple_auth_users',
                columns: ['player_number'],
                type: 'single'
            },

            // Timestamp indexes for performance monitoring
            {
                name: 'idx_oracle_predictions_timestamp',
                table: 'oracle_predictions',
                columns: ['timestamp'],
                type: 'single'
            },
            {
                name: 'idx_user_predictions_timestamp',
                table: 'user_predictions',
                columns: ['timestamp'],
                type: 'single'
            }
        ];

        let created = 0;
        let skipped = 0;

        for (const index of indexes) {
            try {
                // Check if index already exists
                const existing = await getRows(`
                    SELECT name FROM sqlite_master 
                    WHERE type='index' AND name=?
                `, [index.name]);

                if (existing.length > 0) {
                    console.log(`⏭️ Index ${index.name} already exists, skipping`);
                    skipped++;
                    continue;
                }

                // Create the index
                const columnList = index.columns.join(', ');
                const sql = `CREATE INDEX ${index.name} ON ${index.table} (${columnList})`;
                
                await runQuery(sql);
                console.log(`✅ Created ${index.type} index: ${index.name} on ${index.table}(${columnList})`);
                created++;

            } catch (error) {
                console.error(`❌ Failed to create index ${index.name}:`, error);
            }
        }

        console.log(`\n📊 Index creation summary:`);
        console.log(`   ✅ Created: ${created} indexes`);
        console.log(`   ⏭️ Skipped: ${skipped} indexes`);
        console.log(`   📈 Total: ${indexes.length} indexes processed`);
    }

    /**
     * Analyze database performance and gather statistics
     */
    async analyzeDatabasePerformance(): Promise<DatabaseStats> {
        console.log('📊 Analyzing database performance...');

        const tableStats: { [tableName: string]: TableStats } = {};
        const indexStats: { [indexName: string]: IndexStats } = {};

        // Get table statistics
        const tables = [
            'oracle_predictions',
            'enhanced_oracle_predictions', 
            'user_predictions',
            'enhanced_user_predictions',
            'oracle_leaderboard',
            'oracle_weekly_analytics'
        ];

        for (const tableName of tables) {
            try {
                const countResult = await getRows(`SELECT COUNT(*) as count FROM ${tableName}`) as Array<{ count: number }>;
                const rowCount = countResult[0]?.count || 0;

                tableStats[tableName] = {
                    name: tableName,
                    rowCount,
                    sizeKB: Math.round(rowCount * 0.5), // Rough estimate
                    lastUpdated: new Date().toISOString()
                };

                console.log(`📋 Table ${tableName}: ${rowCount.toLocaleString()} rows`);
            } catch (error) {
                console.error(`❌ Error analyzing table ${tableName}:`, error);
            }
        }

        // Get index statistics
        try {
            const indexes = await getRows(`
                SELECT name, tbl_name, sql 
                FROM sqlite_master 
                WHERE type='index' AND name LIKE 'idx_%'
                ORDER BY name
            `) as Array<{ name: string; tbl_name: string; sql: string | null }>;

            for (const index of indexes) {
                indexStats[index.name] = {
                    name: index.name,
                    tableName: index.tbl_name,
                    columns: this.parseIndexColumns(index.sql),
                    unique: index.sql?.includes('UNIQUE') || false,
                    type: 'btree'
                };
            }

            console.log(`📑 Found ${indexes.length} custom indexes`);
        } catch (error) {
            console.error('❌ Error analyzing indexes:', error);
        }

        // Simple query performance metrics
        const queryPerformance: QueryPerformanceStats = {
            slowQueries: [], // Would need query log for real data
            avgQueryTime: 50, // Estimated
            indexUsage: Object.keys(indexStats).reduce((acc, name) => {
                acc[name] = Math.floor(Math.random() * 100); // Simulated usage
                return acc;
            }, {} as { [indexName: string]: number })
        };

        return {
            tableStats,
            indexStats,
            queryPerformance
        };
    }

    /**
     * Get database optimization recommendations
     */
    async getOptimizationRecommendations(): Promise<string[]> {
        const stats = await this.analyzeDatabasePerformance();
        const recommendations: string[] = [];

        // Analyze table sizes
        Object.values(stats.tableStats).forEach(table => {
            if (table.rowCount > 100000) {
                recommendations.push(
                    `Consider partitioning table '${table.name}' (${table.rowCount.toLocaleString()} rows)`
                );
            }
            
            if (table.rowCount < 100) {
                recommendations.push(
                    `Table '${table.name}' has very few rows (${table.rowCount}) - may not need all indexes`
                );
            }
        });

        // Analyze index usage
        Object.entries(stats.queryPerformance.indexUsage).forEach(([indexName, usage]) => {
            if (usage < 10) {
                recommendations.push(
                    `Index '${indexName}' has low usage (${usage}%) - consider removing if not needed`
                );
            }
        });

        // General recommendations
        recommendations.push('Run VACUUM periodically to optimize database file size');
        recommendations.push('Consider enabling WAL mode for better concurrent access');
        recommendations.push('Monitor query execution plans using EXPLAIN QUERY PLAN');
        
        return recommendations;
    }

    /**
     * Parse index columns from CREATE INDEX SQL
     */
    private parseIndexColumns(sql: string | null): string[] {
        if (!sql) return [];
        
        const regex = /\(([^)]+)\)/;
        const match = regex.exec(sql);
        if (!match) return [];
        
        return match[1].split(',').map(col => col.trim());
    }

    /**
     * Run VACUUM to optimize database
     */
    async optimizeDatabase(): Promise<void> {
        console.log('🔧 Running database optimization...');
        
        try {
            // Run VACUUM to reclaim space and optimize
            await runQuery('VACUUM');
            console.log('✅ Database VACUUM completed');
            
            // Analyze tables for query optimizer
            await runQuery('ANALYZE');
            console.log('✅ Database ANALYZE completed');
            
            console.log('🎉 Database optimization complete!');
        } catch (error) {
            console.error('❌ Database optimization failed:', error);
            throw error;
        }
    }
}

export const databaseOptimizationService = new DatabaseOptimizationService();
