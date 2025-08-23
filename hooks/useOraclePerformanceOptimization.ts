/**
 * Oracle Performance Optimization Hooks
 * React hooks for optimized Oracle component performance
 * Features virtualization, debouncing, and efficient state management
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import oraclePerformanceOptimizationService, { 
    VirtualScrollItem, 
    VirtualScrollState 
} from '../services/oraclePerformanceOptimizationService';

// Hook for debounced Oracle search
export function useOracleSearch(initialQuery: string = '') {
    const [query, setQuery] = useState(initialQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
    const [isSearching, setIsSearching] = useState(false);

    const debouncedSearch = useMemo(
        () => oraclePerformanceOptimizationService.debouncedSearch((q: string) => {
            setDebouncedQuery(q);
            setIsSearching(false);
        }),
        []
    );

    useEffect(() => {
        if (query !== debouncedQuery) {
            setIsSearching(true);
            debouncedSearch(query);
        }
    }, [query, debouncedQuery, debouncedSearch]);

    return {
        query,
        debouncedQuery,
        isSearching,
        setQuery
    };
}

// Hook for throttled real-time updates
export function useThrottledOracleUpdates() {
    const [updates, setUpdates] = useState<any[]>([]);
    const updateQueueRef = useRef<any[]>([]);

    const throttledUpdateState = useMemo(
        () => oraclePerformanceOptimizationService.throttledRealTimeUpdate(() => {
            setUpdates([...updateQueueRef.current]);
            updateQueueRef.current = [];
        }),
        []
    );

    const addUpdate = useCallback((update: any) => {
        updateQueueRef.current.push(update);
        throttledUpdateState();
    }, [throttledUpdateState]);

    return {
        updates,
        addUpdate
    };
}

// Hook for virtual scrolling large prediction lists
export function useVirtualizedPredictionList(
    items: VirtualScrollItem[], 
    containerHeight: number
) {
    const [scrollTop, setScrollTop] = useState(0);
    const [virtualState, setVirtualState] = useState<VirtualScrollState>({
        startIndex: 0,
        endIndex: 0,
        visibleItems: [],
        totalHeight: 0,
        scrollTop: 0
    });

    useEffect(() => {
        oraclePerformanceOptimizationService.setupVirtualScroll(items, containerHeight);
    }, [items, containerHeight]);

    useEffect(() => {
        const newState = oraclePerformanceOptimizationService.getVirtualScrollState(scrollTop);
        setVirtualState(newState);
    }, [scrollTop, items]);

    const handleScroll = useCallback(
        oraclePerformanceOptimizationService.throttledScrollEvent((event: React.UIEvent<HTMLDivElement>) => {
            const target = event.target as HTMLElement;
            setScrollTop(target.scrollTop);
        }),
        []
    );

    return {
        virtualState,
        handleScroll: handleScroll as React.UIEventHandler<HTMLDivElement>,
        totalHeight: virtualState.totalHeight,
        visibleItems: virtualState.visibleItems
    };
}

// Hook for cached Oracle data with automatic refresh
export function useCachedOracleData<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    cacheType: 'prediction' | 'analytics' | 'userStats' = 'prediction'
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getCachedData = useCallback(() => {
        switch (cacheType) {
            case 'prediction':
                return oraclePerformanceOptimizationService.getCachedPrediction(key) as T | null;
            case 'analytics':
                return oraclePerformanceOptimizationService.getCachedAnalytics(key) as T | null;
            case 'userStats':
                return oraclePerformanceOptimizationService.getCachedUserStats(key) as T | null;
            default:
                return null;
        }
    }, [key, cacheType]);

    const setCachedData = useCallback((newData: T) => {
        switch (cacheType) {
            case 'prediction':
                oraclePerformanceOptimizationService.setCachedPrediction(key, newData);
                break;
            case 'analytics':
                oraclePerformanceOptimizationService.setCachedAnalytics(key, newData);
                break;
            case 'userStats':
                oraclePerformanceOptimizationService.setCachedUserStats(key, newData);
                break;
        }
    }, [key, cacheType]);

    const fetchData = useCallback(async (forceRefresh = false) => {
        // Check cache first
        if (!forceRefresh) {
            const cached = getCachedData();
            if (cached) {
                setData(cached);
                return cached;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const result = await oraclePerformanceOptimizationService.queueRequest(fetchFunction);
            setData(result);
            setCachedData(result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchFunction, getCachedData, setCachedData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch: () => fetchData(true)
    };
}

// Hook for optimized Oracle prediction submission
export function useOptimizedPredictionSubmission() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    const debouncedSubmit = useMemo(
        () => oraclePerformanceOptimizationService.debouncedPredictionSubmission(
            async (submissionFn: () => Promise<any>) => {
                setIsSubmitting(true);
                setSubmissionError(null);
                
                try {
                    const result = await oraclePerformanceOptimizationService.queueRequest(submissionFn);
                    return result;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Submission failed';
                    setSubmissionError(errorMessage);
                    throw error;
                } finally {
                    setIsSubmitting(false);
                }
            }
        ),
        []
    );

    const submitPrediction = useCallback((submissionFn: () => Promise<any>) => {
        return debouncedSubmit(submissionFn);
    }, [debouncedSubmit]);

    return {
        isSubmitting,
        submissionError,
        submitPrediction
    };
}

// Hook for batch processing Oracle analytics updates
export function useBatchedAnalyticsUpdates() {
    const [batchedUpdates, setBatchedUpdates] = useState<any[]>([]);
    const pendingUpdatesRef = useRef<any[]>([]);

    const processBatch = useCallback(() => {
        if (pendingUpdatesRef.current.length > 0) {
            setBatchedUpdates([...pendingUpdatesRef.current]);
            pendingUpdatesRef.current = [];
        }
    }, []);

    const addAnalyticsUpdate = useCallback((update: any) => {
        pendingUpdatesRef.current.push(update);
        oraclePerformanceOptimizationService.addAnalyticsUpdate(update);
    }, []);

    useEffect(() => {
        const interval = setInterval(processBatch, 1000); // Process every second
        return () => clearInterval(interval);
    }, [processBatch]);

    return {
        batchedUpdates,
        addAnalyticsUpdate
    };
}

// Hook for performance monitoring
export function useOraclePerformanceMonitoring() {
    const [metrics, setMetrics] = useState(oraclePerformanceOptimizationService.getPerformanceMetrics());
    const renderStartTime = useRef<number | undefined>(undefined);

    const startRenderMeasurement = useCallback(() => {
        renderStartTime.current = performance.now();
    }, []);

    const endRenderMeasurement = useCallback(() => {
        if (renderStartTime.current) {
            const renderTime = performance.now() - renderStartTime.current;
            oraclePerformanceOptimizationService.recordRender(renderTime);
            setMetrics(oraclePerformanceOptimizationService.getPerformanceMetrics());
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(oraclePerformanceOptimizationService.getPerformanceMetrics());
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return {
        metrics,
        startRenderMeasurement,
        endRenderMeasurement
    };
}

// Hook for optimized user input handling
export function useOptimizedUserInput(initialValue: string = '') {
    const [value, setValue] = useState(initialValue);
    const [debouncedValue, setDebouncedValue] = useState(initialValue);

    const debouncedUpdate = useMemo(
        () => oraclePerformanceOptimizationService.debouncedUserInput((newValue: string) => {
            setDebouncedValue(newValue);
        }),
        []
    );

    const handleChange = useCallback((newValue: string) => {
        setValue(newValue);
        debouncedUpdate(newValue);
    }, [debouncedUpdate]);

    return {
        value,
        debouncedValue,
        setValue: handleChange
    };
}

// Hook for memory-efficient component state
export function useMemoryEfficientState<T>(
    initialState: T,
    shouldUpdate: (prev: T, next: T) => boolean = (prev, next) => prev !== next
) {
    const [state, setState] = useState<T>(initialState);
    const stateRef = useRef<T>(initialState);

    const optimizedSetState = useCallback((newState: T | ((prev: T) => T)) => {
        const nextState = typeof newState === 'function' 
            ? (newState as (prev: T) => T)(stateRef.current)
            : newState;

        if (shouldUpdate(stateRef.current, nextState)) {
            stateRef.current = nextState;
            setState(nextState);
        }
    }, [shouldUpdate]);

    return [state, optimizedSetState] as const;
}

// Hook for lazy-loaded Oracle components
export function useLazyOracleComponent<T>(
    importFunction: () => Promise<{ default: React.ComponentType<T> }>,
    dependencies: React.DependencyList = []
) {
    const [Component, setComponent] = useState<React.ComponentType<T> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadComponent = async () => {
            setLoading(true);
            setError(null);

            try {
                const module = await importFunction();
                if (mounted) {
                    setComponent(() => module.default);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load component');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadComponent();

        return () => {
            mounted = false;
        };
    }, dependencies);

    return { Component, loading, error };
}
