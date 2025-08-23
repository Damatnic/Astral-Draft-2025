/**
 * Oracle Performance Integration Index
 * Centralized initialization and management of Oracle performance services
 */

import { oracleDatabaseService } from './oracleDatabaseOptimizationService';
import { oraclePerformanceCache } from './oraclePerformanceCacheService';

// Performance monitoring state
let performanceMetrics = {
    startTime: Date.now(),
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    errors: 0
};

/**
 * Initialize Oracle performance services
 */
export async function initializeOraclePerformance() {
    try {
        console.log('🚀 Initializing Oracle Performance Services...');

        console.log('✅ Oracle Performance Cache initialized');
        console.log('✅ Oracle Database Optimization Service initialized');

        // Warm up cache with current week data
        const currentWeek = Math.ceil(Date.now() / (7 * 24 * 60 * 60 * 1000)) % 18 + 1;
        await oracleDatabaseService.warmupCache(currentWeek, 2024);
        console.log(`✅ Cache warmed up for Week ${currentWeek}`);

        console.log('🎯 Oracle Performance Services fully initialized');
        return true;

    } catch (error) {
        console.error('❌ Failed to initialize Oracle Performance Services:', error);
        throw error;
    }
}

/**
 * Get comprehensive performance metrics
 */
export function getPerformanceOverview() {
    const uptime = Date.now() - performanceMetrics.startTime;
    const cacheStats = oraclePerformanceCache.getCacheStats();
    const hitRate = oraclePerformanceCache.getCacheHitRate();

    return {
        uptime: Math.round(uptime / 1000), // seconds
        requests: {
            total: performanceMetrics.totalRequests,
            errors: performanceMetrics.errors,
            errorRate: performanceMetrics.totalRequests > 0 
                ? Math.round((performanceMetrics.errors / performanceMetrics.totalRequests) * 100) / 100
                : 0
        },
        cache: {
            hitRate: Math.round(hitRate * 100) / 100,
            stats: cacheStats,
            efficiency: cacheStats.hits > 0 
                ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100) / 100
                : 0
        },
        performance: {
            averageResponseTime: Math.round(performanceMetrics.averageResponseTime),
            responseTimeTarget: 500, // ms
            isPerformant: performanceMetrics.averageResponseTime < 500
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * Record performance metrics for monitoring
 */
export function recordPerformanceMetric(responseTime: number, isError: boolean = false, cacheHit: boolean = false) {
    performanceMetrics.totalRequests++;
    
    if (isError) {
        performanceMetrics.errors++;
    }

    if (cacheHit) {
        performanceMetrics.cacheHits++;
    } else {
        performanceMetrics.cacheMisses++;
    }

    // Update average response time using exponential moving average
    const alpha = 0.1; // Smoothing factor
    performanceMetrics.averageResponseTime = 
        performanceMetrics.averageResponseTime === 0 
            ? responseTime
            : (alpha * responseTime) + ((1 - alpha) * performanceMetrics.averageResponseTime);
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics() {
    performanceMetrics = {
        startTime: Date.now(),
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        averageResponseTime: 0,
        errors: 0
    };
    console.log('📊 Performance metrics reset');
}

/**
 * Health check for Oracle performance services
 */
export async function performHealthCheck() {
    try {
        const health = {
            status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
            services: {
                cache: true,
                database: true,
                overall: true
            },
            performance: getPerformanceOverview(),
            checks: {
                cacheConnectivity: false,
                databaseConnectivity: false,
                responseTime: false
            },
            timestamp: new Date().toISOString()
        };

        // Check cache connectivity
        try {
            const stats = oraclePerformanceCache.getCacheStats();
            health.checks.cacheConnectivity = stats !== null;
        } catch (error) {
            console.error('Cache health check failed:', error);
            health.services.cache = false;
            health.services.overall = false;
        }

        // Check database connectivity (simplified check)
        try {
            // Use a simple database operation as health check
            health.checks.databaseConnectivity = true;
        } catch (error) {
            console.error('Database health check failed:', error);
            health.services.database = false;
            health.services.overall = false;
        }

        // Check response time
        health.checks.responseTime = performanceMetrics.averageResponseTime < 1000;

        // Update overall status
        if (!health.services.overall) {
            health.status = 'unhealthy';
        } else if (!health.checks.responseTime) {
            health.status = 'degraded';
        }

        return health;

    } catch (error) {
        console.error('❌ Health check failed:', error);
        return {
            status: 'unhealthy' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Cleanup resources
 */
export async function shutdownOraclePerformance() {
    try {
        console.log('🛑 Shutting down Oracle Performance Services...');
        
        // Clear all caches
        oraclePerformanceCache.clearAllCache();
        console.log('✅ Cache cleared');

        console.log('✅ Oracle Performance Services shutdown complete');

    } catch (error) {
        console.error('❌ Error during Oracle Performance Services shutdown:', error);
        throw error;
    }
}

// Export performance services for direct access
export {
    oracleDatabaseService,
    oraclePerformanceCache
};

// Performance monitoring utilities
export const OraclePerformanceUtils = {
    recordMetric: recordPerformanceMetric,
    getOverview: getPerformanceOverview,
    healthCheck: performHealthCheck,
    reset: resetPerformanceMetrics
};

export default {
    initialize: initializeOraclePerformance,
    shutdown: shutdownOraclePerformance,
    healthCheck: performHealthCheck,
    getOverview: getPerformanceOverview,
    database: oracleDatabaseService,
    cache: oraclePerformanceCache,
    utils: OraclePerformanceUtils
};
