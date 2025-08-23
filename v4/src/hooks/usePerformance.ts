/**
 * @fileoverview React Performance Optimization Hooks
 * Provides custom hooks for memoization, performance monitoring, and component optimization
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import type { DependencyList, UIEvent, ComponentType } from 'react';
import { measureFunction } from '../lib/performance/monitoring';

// Performance tracking for components
interface ComponentPerformanceMetrics {
  componentName: string;
  renderCount: number;
  avgRenderTime: number;
  totalRenderTime: number;
  lastRenderTime: number;
  propsChanges: number;
  wastedRenders: number;
}

const componentMetrics = new Map<string, ComponentPerformanceMetrics>();

/**
 * Hook for tracking component render performance
 */
export function useRenderTracking(componentName: string, dependencies?: any[]) {
  const renderCount = useRef(0);
  const lastPropsRef = useRef(dependencies);
  const startTimeRef = useRef(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
  });

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    renderCount.current++;

    // Check if this was a wasted render (props didn't change)
    const wasWastedRender = dependencies && 
      lastPropsRef.current && 
      JSON.stringify(dependencies) === JSON.stringify(lastPropsRef.current);

    // Update metrics
    const currentMetrics = componentMetrics.get(componentName) || {
      componentName,
      renderCount: 0,
      avgRenderTime: 0,
      totalRenderTime: 0,
      lastRenderTime: 0,
      propsChanges: 0,
      wastedRenders: 0,
    };

    const newTotalTime = currentMetrics.totalRenderTime + renderTime;
    const newRenderCount = currentMetrics.renderCount + 1;

    componentMetrics.set(componentName, {
      ...currentMetrics,
      renderCount: newRenderCount,
      totalRenderTime: newTotalTime,
      avgRenderTime: newTotalTime / newRenderCount,
      lastRenderTime: renderTime,
      propsChanges: wasWastedRender ? currentMetrics.propsChanges : currentMetrics.propsChanges + 1,
      wastedRenders: wasWastedRender ? currentMetrics.wastedRenders + 1 : currentMetrics.wastedRenders,
    });

    lastPropsRef.current = dependencies;

    // Log slow renders
    if (renderTime > 16) { // > 1 frame at 60fps
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  });

  return componentMetrics.get(componentName);
}

/**
 * Enhanced useMemo with performance tracking
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: DependencyList,
  debugName?: string
): T {
  return useMemo(() => {
    if (debugName) {
      return measureFunction(factory, `useMemo_${debugName}`)();
    }
    return factory();
  }, deps);
}

/**
 * Enhanced useCallback with performance tracking
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList,
  debugName?: string
): T {
  return useCallback(
    debugName ? measureFunction(callback, `useCallback_${debugName}`) : callback,
    deps
  );
}

/**
 * Hook for debouncing expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttling expensive operations
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Hook for memoizing expensive computations with cache
 */
export function useMemoizedComputation<T, U>(
  computation: (input: T) => U,
  input: T,
  cacheSize = 10
): U {
  const cache = useRef(new Map<string, { result: U; timestamp: number }>());

  return useMemo(() => {
    const key = JSON.stringify(input);
    const cached = cache.current.get(key);
    
    if (cached) {
      // Move to end (LRU behavior)
      cache.current.delete(key);
      cache.current.set(key, cached);
      return cached.result;
    }

    const result = computation(input);
    
    // Manage cache size
    if (cache.current.size >= cacheSize) {
      const firstKey = cache.current.keys().next().value;
      if (firstKey !== undefined) {
        cache.current.delete(firstKey);
      }
    }
    
    cache.current.set(key, { result, timestamp: Date.now() });
    return result;
  }, [input, computation, cacheSize]);
}

/**
 * Hook for virtual scrolling performance
 */
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length - 1
    );

    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex,
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    visibleRange,
    onScroll: useCallback((e: UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []),
  };
}

/**
 * Hook for lazy loading components
 */
export function useLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = useCallback(async () => {
    if (Component || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const loadedModule = await importFunc();
      setComponent(() => loadedModule.default);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load component'));
    } finally {
      setIsLoading(false);
    }
  }, [Component, isLoading, importFunc]);

  return {
    Component: Component || fallback,
    isLoading,
    error,
    loadComponent,
  };
}

/**
 * Hook for intersection observer (lazy loading images/content)
 */
export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
}: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
} = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<Element | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && triggerOnce) {
          setHasTriggered(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return {
    elementRef,
    isIntersecting: isIntersecting || hasTriggered,
    hasTriggered,
  };
}

/**
 * Hook for measuring component dimensions
 */
export function useComponentSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { size, elementRef };
}

/**
 * Hook for prefetching data
 */
export function usePrefetch<T>(
  fetchFn: () => Promise<T>,
  shouldPrefetch: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!shouldPrefetch) return;

    let cancelled = false;
    setIsLoading(true);

    fetchFn()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Prefetch failed'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchFn, shouldPrefetch]);

  return { data, isLoading, error };
}

/**
 * Get performance metrics for all tracked components
 */
export function getComponentPerformanceMetrics(): ComponentPerformanceMetrics[] {
  return Array.from(componentMetrics.values());
}

/**
 * Clear component performance metrics
 */
export function clearComponentMetrics() {
  componentMetrics.clear();
}

/**
 * HOC for automatic performance tracking
 * NOTE: Temporarily commented out due to JSX in .ts file - needs to be moved to .tsx
 */
// export function withPerformanceTracking<P extends {}>(
//   Component: React.ComponentType<P>,
//   componentName?: string
// ) {
//   const displayName = componentName || Component.displayName || Component.name || 'UnknownComponent';
//   const WrappedComponent = React.memo((props: P) => {
//     useRenderTracking(displayName, [props]);
//     return <Component {...props} />;
//   });
//   WrappedComponent.displayName = `withPerformanceTracking(${displayName})`;
//   return WrappedComponent;
// }

// Type for performance optimization props
export interface PerformanceOptimizedProps {
  shouldUpdate?: (prevProps: any, nextProps: any) => boolean;
  debugName?: string;
  trackRenders?: boolean;
}

/**
 * Enhanced React.memo with custom comparison and performance tracking
 * NOTE: Temporarily commented out due to JSX dependency - needs to be moved to .tsx
 */
// export function memo<P extends {}>(
//   Component: React.ComponentType<P>,
//   options?: {
//     areEqual?: (prevProps: P, nextProps: P) => boolean;
//     debugName?: string;
//     trackRenders?: boolean;
//   }
// ) {
//   const { areEqual, debugName, trackRenders = false } = options || {};
//   const MemoizedComponent = React.memo(Component, areEqual);
//   if (trackRenders) {
//     return withPerformanceTracking(MemoizedComponent, debugName);
//   }
//   return MemoizedComponent;
// }