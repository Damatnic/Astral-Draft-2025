/**
 * Enhanced Cache Hook
 * React hook for intelligent cache management and offline functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService } from '../services/enhancedCacheService';

interface CacheHookOptions {
    enabled?: boolean;
    refreshInterval?: number;
    staleTime?: number;
    cacheTime?: number;
    retry?: number;
    retryDelay?: number;
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
    onSettled?: (data: any, error: Error | null) => void;
}

interface CacheState<T> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
    isFetching: boolean;
    isStale: boolean;
    isError: boolean;
    isSuccess: boolean;
    lastUpdated: number | null;
}

interface CacheActions<T> {
    refetch: () => Promise<T | null>;
    invalidate: () => Promise<void>;
    setData: (data: T | ((prev: T | null) => T)) => void;
    reset: () => void;
}

export function useCache<T = any>(
    cacheType: string,
    cacheKey: string,
    fetcher: () => Promise<T>,
    options: CacheHookOptions = {}
): CacheState<T> & CacheActions<T> {
    const {
        enabled = true,
        refreshInterval,
        staleTime = 5 * 60 * 1000, // 5 minutes
        cacheTime = 30 * 60 * 1000, // 30 minutes
        retry = 3,
        retryDelay = 1000,
        onSuccess,
        onError,
        onSettled
    } = options;

    const [state, setState] = useState<CacheState<T>>({
        data: null,
        error: null,
        isLoading: true,
        isFetching: false,
        isStale: false,
        isError: false,
        isSuccess: false,
        lastUpdated: null
    });

    const retryCount = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const mounted = useRef(true);

    // Fetch data with retry logic
    const fetchData = useCallback(async (isRefetch = false): Promise<T | null> => {
        if (!enabled) return null;

        setState(prev => ({ 
            ...prev, 
            isFetching: true,
            isLoading: !isRefetch,
            error: isRefetch ? null : prev.error 
        }));

        try {
            // First try to get from cache
            let data = await cacheService.get<T>(cacheType, cacheKey);
            let fromCache = data !== null;

            if (!data || isRefetch) {
                // Fetch fresh data
                data = await fetcher();
                fromCache = false;

                // Cache the fresh data
                if (data !== null) {
                    await cacheService.set(cacheType, cacheKey, data, {
                        customTTL: cacheTime
                    });
                }
            }

            if (!mounted.current) return data;

            const now = Date.now();
            const isStale = fromCache && (now - (state.lastUpdated || 0)) > staleTime;

            setState({
                data,
                error: null,
                isLoading: false,
                isFetching: false,
                isStale,
                isError: false,
                isSuccess: true,
                lastUpdated: fromCache ? state.lastUpdated : now
            });

            retryCount.current = 0;
            onSuccess?.(data);
            onSettled?.(data, null);

            return data;
        } catch (error) {
            const err = error as Error;
            
            if (!mounted.current) return null;

            // Retry logic
            if (retryCount.current < retry) {
                retryCount.current++;
                setTimeout(() => {
                    if (mounted.current) {
                        fetchData(isRefetch);
                    }
                }, retryDelay * retryCount.current);
                return null;
            }

            // Try to get stale data from cache as fallback
            const staleData = await cacheService.get<T>(cacheType, cacheKey);

            setState(prev => ({
                ...prev,
                data: staleData || prev.data,
                error: err,
                isLoading: false,
                isFetching: false,
                isStale: Boolean(staleData),
                isError: true,
                isSuccess: Boolean(staleData)
            }));

            retryCount.current = 0;
            onError?.(err);
            onSettled?.(staleData, err);

            return staleData;
        }
    }, [enabled, cacheType, cacheKey, fetcher, cacheTime, staleTime, retry, retryDelay, onSuccess, onError, onSettled]);

    // Refetch data
    const refetch = useCallback(async (): Promise<T | null> => {
        return fetchData(true);
    }, [fetchData]);

    // Invalidate cache
    const invalidate = useCallback(async (): Promise<void> => {
        await cacheService.delete(cacheType, cacheKey);
        setState(prev => ({ ...prev, isStale: true }));
    }, [cacheType, cacheKey]);

    // Set data manually
    const setData = useCallback((data: T | ((prev: T | null) => T)): void => {
        setState(prev => {
            const newData = typeof data === 'function' ? (data as (prev: T | null) => T)(prev.data) : data;
            
            // Update cache
            cacheService.set(cacheType, cacheKey, newData, { customTTL: cacheTime });
            
            return {
                ...prev,
                data: newData,
                isSuccess: true,
                isError: false,
                lastUpdated: Date.now()
            };
        });
    }, [cacheType, cacheKey, cacheTime]);

    // Reset state
    const reset = useCallback((): void => {
        setState({
            data: null,
            error: null,
            isLoading: true,
            isFetching: false,
            isStale: false,
            isError: false,
            isSuccess: false,
            lastUpdated: null
        });
        retryCount.current = 0;
    }, []);

    // Initial fetch and cleanup
    useEffect(() => {
        if (enabled) {
            fetchData();
        }

        return () => {
            mounted.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, fetchData]);

    // Set up refresh interval
    useEffect(() => {
        if (refreshInterval && enabled && state.isSuccess) {
            intervalRef.current = setInterval(() => {
                refetch();
            }, refreshInterval);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [refreshInterval, enabled, state.isSuccess, refetch]);

    return {
        ...state,
        refetch,
        invalidate,
        setData,
        reset
    };
}

/**
 * Hook for cache statistics
 */
export function useCacheStats() {
    const [stats, setStats] = useState(cacheService.getStats());

    useEffect(() => {
        const updateStats = () => {
            setStats(cacheService.getStats());
        };

        // Update stats every 5 seconds
        const interval = setInterval(updateStats, 5000);

        return () => clearInterval(interval);
    }, []);

    return stats;
}

/**
 * Hook for cache operations
 */
export function useCacheOperations() {
    const clearCache = useCallback(async (type?: string) => {
        await cacheService.clear(type);
    }, []);

    const invalidateByTags = useCallback(async (tags: string[]) => {
        await cacheService.invalidateByTags(tags);
    }, []);

    const preloadData = useCallback(async <T>(
        cacheType: string,
        cacheKey: string,
        fetcher: () => Promise<T>,
        options?: { tags?: string[]; customTTL?: number }
    ) => {
        try {
            const data = await fetcher();
            await cacheService.set(cacheType, cacheKey, data, options);
            return data;
        } catch (error) {
            console.error('Preload failed:', error);
            throw error;
        }
    }, []);

    return {
        clearCache,
        invalidateByTags,
        preloadData
    };
}

/**
 * Hook for offline status and cache-aware fetching
 */
export function useOfflineCache<T = any>(
    cacheType: string,
    cacheKey: string,
    fetcher: () => Promise<T>,
    options: CacheHookOptions = {}
) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Modify fetcher to handle offline scenario
    const offlineAwareFetcher = useCallback(async (): Promise<T> => {
        if (!isOnline) {
            // When offline, try to get from cache only
            const cachedData = await cacheService.get<T>(cacheType, cacheKey);
            if (cachedData !== null) {
                return cachedData;
            }
            throw new Error('No cached data available offline');
        }
        
        return fetcher();
    }, [isOnline, fetcher, cacheType, cacheKey]);

    const cacheResult = useCache(cacheType, cacheKey, offlineAwareFetcher, {
        ...options,
        enabled: options.enabled !== false, // Default to enabled
        staleTime: isOnline ? options.staleTime : Infinity, // Don't consider stale when offline
    });

    return {
        ...cacheResult,
        isOnline,
        isOfflineError: !isOnline && cacheResult.isError
    };
}

export default useCache;
