/**
 * Oracle Cache Optimization Hooks
 * React hooks for intelligent caching of Oracle data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { oracleIntelligentCachingService } from '../services/oracleIntelligentCachingService';

interface CacheHookOptions {
    strategy?: string;
    ttl?: number;
    tags?: string[];
    forceFresh?: boolean;
    enabled?: boolean;
    dependencies?: any[];
    background?: boolean;
}

interface CacheState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    lastUpdated: number | null;
    fromCache: boolean;
    cacheKey: string;
}

/**
 * Hook for cached Oracle predictions with automatic background refresh
 */
export function useCachedOraclePredictions(
    week: number,
    userId?: string,
    options: CacheHookOptions = {}
) {
    const cacheKey = `predictions:week:${week}:${userId || 'anonymous'}`;
    const [state, setState] = useState<CacheState<any>>({
        data: null,
        loading: true,
        error: null,
        lastUpdated: null,
        fromCache: false,
        cacheKey
    });

    const fetchPredictions = useCallback(async () => {
        if (!options.enabled && options.enabled !== undefined) return;

        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const predictions = await oracleIntelligentCachingService.get(
                cacheKey,
                async () => {
                    // Simulate API call - replace with actual Oracle prediction API
                    const response = await fetch(`/api/oracle/predictions/${week}?userId=${userId}`);
                    if (!response.ok) throw new Error('Failed to fetch predictions');
                    return response.json();
                },
                {
                    strategy: 'predictions',
                    tags: ['predictions', 'oracle', `week-${week}`, `user-${userId}`],
                    forceFresh: options.forceFresh
                }
            );

            setState(prev => ({
                ...prev,
                data: predictions,
                loading: false,
                lastUpdated: Date.now(),
                fromCache: !options.forceFresh
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error as Error,
                loading: false
            }));
        }
    }, [cacheKey, week, userId, options.forceFresh, options.enabled]);

    // Auto-refresh effect
    useEffect(() => {
        fetchPredictions();
    }, [fetchPredictions, ...(options.dependencies || [])]);

    // Background refresh for predictions
    useEffect(() => {
        if (!options.background) return;

        const interval = setInterval(() => {
            fetchPredictions();
        }, 2 * 60 * 1000); // Refresh every 2 minutes

        return () => clearInterval(interval);
    }, [fetchPredictions, options.background]);

    const refresh = useCallback(() => {
        return fetchPredictions();
    }, [fetchPredictions]);

    const invalidate = useCallback(() => {
        oracleIntelligentCachingService.delete(cacheKey);
        fetchPredictions();
    }, [cacheKey, fetchPredictions]);

    return {
        ...state,
        refresh,
        invalidate,
        isStale: state.lastUpdated && Date.now() - state.lastUpdated > 5 * 60 * 1000
    };
}

/**
 * Hook for cached Oracle analytics with intelligent prefetching
 */
export function useCachedOracleAnalytics(
    userId: string,
    timeRange: string = '7d',
    options: CacheHookOptions = {}
) {
    const cacheKey = `analytics:${userId}:${timeRange}`;
    const [state, setState] = useState<CacheState<any>>({
        data: null,
        loading: true,
        error: null,
        lastUpdated: null,
        fromCache: false,
        cacheKey
    });

    const fetchAnalytics = useCallback(async () => {
        if (!options.enabled && options.enabled !== undefined) return;

        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const analytics = await oracleIntelligentCachingService.get(
                cacheKey,
                async () => {
                    const response = await fetch(`/api/oracle/analytics/${userId}?range=${timeRange}`);
                    if (!response.ok) throw new Error('Failed to fetch analytics');
                    return response.json();
                },
                {
                    strategy: 'analytics',
                    tags: ['analytics', 'oracle', `user-${userId}`, `range-${timeRange}`],
                    forceFresh: options.forceFresh
                }
            );

            setState(prev => ({
                ...prev,
                data: analytics,
                loading: false,
                lastUpdated: Date.now(),
                fromCache: !options.forceFresh
            }));

            // Prefetch related analytics
            if (analytics && !options.forceFresh) {
                prefetchRelatedAnalytics(userId, timeRange);
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error as Error,
                loading: false
            }));
        }
    }, [cacheKey, userId, timeRange, options.forceFresh, options.enabled]);

    const prefetchRelatedAnalytics = useCallback(async (userId: string, currentRange: string) => {
        const relatedRanges = ['1d', '7d', '30d'].filter(range => range !== currentRange);
        
        for (const range of relatedRanges) {
            const prefetchKey = `analytics:${userId}:${range}`;
            
            // Only prefetch if not already cached
            const cached = await oracleIntelligentCachingService.get(prefetchKey);
            if (!cached) {
                oracleIntelligentCachingService.set(
                    prefetchKey,
                    { prefetched: true, timestamp: Date.now() },
                    { strategy: 'analytics', ttl: 30 * 60 * 1000 }
                );
            }
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics, ...(options.dependencies || [])]);

    const refresh = useCallback(() => {
        return fetchAnalytics();
    }, [fetchAnalytics]);

    const invalidate = useCallback(() => {
        oracleIntelligentCachingService.clearByTags([`user-${userId}`]);
        fetchAnalytics();
    }, [userId, fetchAnalytics]);

    return {
        ...state,
        refresh,
        invalidate,
        isStale: state.lastUpdated && Date.now() - state.lastUpdated > 15 * 60 * 1000
    };
}

/**
 * Hook for cached Oracle leaderboard with real-time updates
 */
export function useCachedOracleLeaderboard(
    category: string = 'overall',
    options: CacheHookOptions = {}
) {
    const cacheKey = `leaderboard:${category}`;
    const [state, setState] = useState<CacheState<any>>({
        data: null,
        loading: true,
        error: null,
        lastUpdated: null,
        fromCache: false,
        cacheKey
    });

    const fetchLeaderboard = useCallback(async () => {
        if (!options.enabled && options.enabled !== undefined) return;

        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const leaderboard = await oracleIntelligentCachingService.get(
                cacheKey,
                async () => {
                    const response = await fetch(`/api/oracle/leaderboard/${category}`);
                    if (!response.ok) throw new Error('Failed to fetch leaderboard');
                    return response.json();
                },
                {
                    strategy: 'leaderboard',
                    tags: ['leaderboard', 'oracle', `category-${category}`],
                    forceFresh: options.forceFresh
                }
            );

            setState(prev => ({
                ...prev,
                data: leaderboard,
                loading: false,
                lastUpdated: Date.now(),
                fromCache: !options.forceFresh
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error as Error,
                loading: false
            }));
        }
    }, [cacheKey, category, options.forceFresh, options.enabled]);

    // Real-time updates for leaderboard
    useEffect(() => {
        fetchLeaderboard();

        const interval = setInterval(fetchLeaderboard, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(interval);
    }, [fetchLeaderboard, ...(options.dependencies || [])]);

    const refresh = useCallback(() => {
        return fetchLeaderboard();
    }, [fetchLeaderboard]);

    const invalidate = useCallback(() => {
        oracleIntelligentCachingService.clearByTags(['leaderboard']);
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    return {
        ...state,
        refresh,
        invalidate,
        isStale: state.lastUpdated && Date.now() - state.lastUpdated > 5 * 60 * 1000
    };
}

/**
 * Hook for Oracle cache statistics and management
 */
export function useOracleCacheManager() {
    const [stats, setStats] = useState<any>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);

    const refreshStats = useCallback(() => {
        const cacheStats = oracleIntelligentCachingService.getStats();
        setStats(cacheStats);
    }, []);

    const optimize = useCallback(async () => {
        setIsOptimizing(true);
        try {
            const result = await oracleIntelligentCachingService.optimize();
            refreshStats();
            return result;
        } finally {
            setIsOptimizing(false);
        }
    }, [refreshStats]);

    const warmCache = useCallback(async (userId: string, week?: number) => {
        await oracleIntelligentCachingService.warmCache(userId, week);
        refreshStats();
    }, [refreshStats]);

    const clearCache = useCallback((tags?: string[]) => {
        if (tags) {
            oracleIntelligentCachingService.clearByTags(tags);
        } else {
            // Clear all Oracle caches
            oracleIntelligentCachingService.clearByTags(['oracle']);
        }
        refreshStats();
    }, [refreshStats]);

    useEffect(() => {
        refreshStats();
        const interval = setInterval(refreshStats, 30 * 1000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, [refreshStats]);

    return {
        stats,
        isOptimizing,
        optimize,
        warmCache,
        clearCache,
        refreshStats
    };
}

/**
 * Hook for intelligent Oracle data prefetching
 */
export function useOracleDataPrefetcher(
    userId: string,
    context: {
        currentView?: string;
        recentActions?: string[];
        userPreferences?: Record<string, any>;
    }
) {
    const prefetchRef = useRef<Set<string>>(new Set());

    const prefetchData = useCallback(async () => {
        const prefetchKey = `prefetch:${userId}:${context.currentView}`;
        
        if (prefetchRef.current.has(prefetchKey)) return;
        prefetchRef.current.add(prefetchKey);

        try {
            await oracleIntelligentCachingService.prefetchLikelyNeeded(userId, {
                currentView: context.currentView,
                recentActions: context.recentActions,
                timeOfDay: new Date().getHours(),
                userPreferences: context.userPreferences
            });

            // Remove from prefetch set after 5 minutes
            setTimeout(() => {
                prefetchRef.current.delete(prefetchKey);
            }, 5 * 60 * 1000);
        } catch (error) {
            console.error('Prefetch error:', error);
            prefetchRef.current.delete(prefetchKey);
        }
    }, [userId, context.currentView, context.recentActions, context.userPreferences]);

    useEffect(() => {
        const timer = setTimeout(prefetchData, 1000); // Delay prefetching
        return () => clearTimeout(timer);
    }, [prefetchData]);

    return { prefetchData };
}

/**
 * Higher-order hook for cached Oracle data with advanced features
 */
export function useAdvancedOracleCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheHookOptions & {
        revalidateOnFocus?: boolean;
        revalidateOnReconnect?: boolean;
        backgroundRevalidation?: boolean;
        optimisticUpdates?: boolean;
    } = {}
) {
    const [state, setState] = useState<CacheState<T>>({
        data: null,
        loading: true,
        error: null,
        lastUpdated: null,
        fromCache: false,
        cacheKey: key
    });

    const fetchData = useCallback(async (skipCache = false) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const data = await oracleIntelligentCachingService.get(
                key,
                fetcher,
                {
                    strategy: options.strategy,
                    tags: options.tags,
                    forceFresh: skipCache || options.forceFresh
                }
            );

            setState(prev => ({
                ...prev,
                data,
                loading: false,
                lastUpdated: Date.now(),
                fromCache: !skipCache && !options.forceFresh
            }));

            return data;
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error as Error,
                loading: false
            }));
            throw error;
        }
    }, [key, fetcher, options.strategy, options.tags, options.forceFresh]);

    // Focus revalidation
    useEffect(() => {
        if (!options.revalidateOnFocus) return;

        const handleFocus = () => {
            if (state.lastUpdated && Date.now() - state.lastUpdated > 60 * 1000) {
                fetchData();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [options.revalidateOnFocus, state.lastUpdated, fetchData]);

    // Network reconnect revalidation
    useEffect(() => {
        if (!options.revalidateOnReconnect) return;

        const handleOnline = () => fetchData();
        
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [options.revalidateOnReconnect, fetchData]);

    // Background revalidation
    useEffect(() => {
        if (!options.backgroundRevalidation) return;

        const interval = setInterval(() => {
            if (!document.hidden) {
                fetchData();
            }
        }, 5 * 60 * 1000); // Every 5 minutes

        return () => clearInterval(interval);
    }, [options.backgroundRevalidation, fetchData]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData, ...(options.dependencies || [])]);

    const mutate = useCallback(async (
        updater?: T | ((current: T | null) => T) | Promise<T>,
        shouldRevalidate = true
    ) => {
        if (updater !== undefined) {
            let newData: T;
            
            if (typeof updater === 'function') {
                newData = (updater as (current: T | null) => T)(state.data);
            } else if (updater instanceof Promise) {
                newData = await updater;
            } else {
                newData = updater;
            }

            // Optimistic update
            if (options.optimisticUpdates) {
                setState(prev => ({
                    ...prev,
                    data: newData,
                    lastUpdated: Date.now()
                }));
            }

            // Update cache
            await oracleIntelligentCachingService.set(key, newData, {
                strategy: options.strategy,
                tags: options.tags
            });
        }

        if (shouldRevalidate) {
            return fetchData(true);
        }

        return state.data;
    }, [key, state.data, options.strategy, options.tags, options.optimisticUpdates, fetchData]);

    return {
        ...state,
        mutate,
        refresh: () => fetchData(true),
        invalidate: () => {
            oracleIntelligentCachingService.delete(key);
            return fetchData(true);
        }
    };
}

export default {
    useCachedOraclePredictions,
    useCachedOracleAnalytics,
    useCachedOracleLeaderboard,
    useOracleCacheManager,
    useOracleDataPrefetcher,
    useAdvancedOracleCache
};
