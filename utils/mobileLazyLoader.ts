// Lazy Loading Implementation for Mobile Performance Optimization
// Implements code splitting and lazy loading for mobile-specific components

import React from 'react';
import { useResponsiveBreakpoint } from './mobileOptimizationUtils';

/**
 * Higher-order component for lazy loading mobile-optimized features
 */
export function withMobileLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ComponentElement<any, any>;
    loadOnMobile?: boolean;
    loadDelay?: number;
  } = {}
) {
  const { 
    fallback = React.createElement('div', { 
      className: 'animate-pulse bg-gray-200 rounded h-20 w-full' 
    }),
    loadOnMobile = true,
    loadDelay = 0
  } = options;

  return React.forwardRef<any, P>((props, ref) => {
    const { isMobile } = useResponsiveBreakpoint();
    const [shouldLoad, setShouldLoad] = React.useState(!loadOnMobile || !isMobile);

    React.useEffect(() => {
      if (loadOnMobile && isMobile && !shouldLoad) {
        const timer = setTimeout(() => {
          setShouldLoad(true);
        }, loadDelay);

        return () => clearTimeout(timer);
      }
    }, [isMobile, shouldLoad, loadOnMobile, loadDelay]);

    if (!shouldLoad) {
      return fallback;
    }

    return React.createElement(Component, props as any);
  });
}

/**
 * Lazy-loaded mobile modal component
 */
const LazyMobileModal = React.lazy(() => 
  import('../components/modals/EditTeamBrandingModal').then(module => ({
    default: withMobileLazyLoading(module.default, { loadDelay: 100 })
  }))
);

/**
 * Lazy-loaded mobile chart components
 */
const LazyMobileCharts = React.lazy(() =>
  Promise.resolve({ default: () => React.createElement('div', {}, 'Chart Component') })
);

/**
 * Mobile-specific component lazy loader with intersection observer
 */
export class MobileLazyLoader {
  private static intersectionObserver: IntersectionObserver | null = null;
  private static loadedComponents = new Set<string>();

  /**
   * Initialize intersection observer for lazy loading
   */
  static initialize() {
    if (typeof window === 'undefined' || this.intersectionObserver) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const componentId = entry.target.getAttribute('data-lazy-id');
            if (componentId && !this.loadedComponents.has(componentId)) {
              this.loadComponent(componentId);
              this.loadedComponents.add(componentId);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px', // Load 50px before coming into view
        threshold: 0.1
      }
    );
  }

  /**
   * Register component for lazy loading
   */
  static registerComponent(element: HTMLElement, componentId: string) {
    if (!this.intersectionObserver) this.initialize();
    
    element.setAttribute('data-lazy-id', componentId);
    this.intersectionObserver?.observe(element);
  }

  /**
   * Load component dynamically
   */
  private static async loadComponent(componentId: string) {
    try {
      switch (componentId) {
        case 'mobile-modal':
          // Dynamically import mobile modal
          await import('../components/modals/EditTeamBrandingModal');
          break;
        case 'mobile-charts':
          // Dynamically import chart components
          // Mock chart component loading for now
          await Promise.resolve();
          break;
        case 'mobile-analytics':
          // Dynamically import analytics components
          await import('../views/HistoricalAnalyticsView');
          break;
        default:
          console.warn(`Unknown component for lazy loading: ${componentId}`);
      }
    } catch (error) {
      console.error(`Failed to lazy load component ${componentId}:`, error);
    }
  }

  /**
   * Cleanup intersection observer
   */
  static cleanup() {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.loadedComponents.clear();
  }
}

/**
 * Hook for lazy loading mobile components
 */
export function useMobileLazyLoad(componentId: string) {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const { isMobile } = useResponsiveBreakpoint();
  const [isLoaded, setIsLoaded] = React.useState(!isMobile);

  React.useEffect(() => {
    if (isMobile && elementRef.current && !isLoaded) {
      MobileLazyLoader.registerComponent(elementRef.current, componentId);
      
      // Set up mutation observer to detect when component is loaded
      const observer = new MutationObserver(() => {
        if (MobileLazyLoader['loadedComponents'].has(componentId)) {
          setIsLoaded(true);
          observer.disconnect();
        }
      });

      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });

      return () => observer.disconnect();
    }
  }, [componentId, isMobile, isLoaded]);

  React.useEffect(() => {
    return () => {
      MobileLazyLoader.cleanup();
    };
  }, []);

  return { elementRef, isLoaded };
}

/**
 * Performance-optimized mobile component wrapper
 */
export const MobileOptimizedWrapper: React.FC<{
  children: React.ReactNode;
  componentId: string;
  fallback?: React.ReactNode;
}> = ({ children, componentId, fallback = null }) => {
  const { elementRef, isLoaded } = useMobileLazyLoad(componentId);

  return React.createElement(
    'div',
    {
      ref: elementRef,
      'data-testid': `mobile-lazy-${componentId}`
    },
    isLoaded ? children : fallback
  );
};

/**
 * Bundle size monitoring utility
 */
export class BundleSizeMonitor {
  private static readonly performanceEntries: PerformanceEntry[] = [];

  /**
   * Track bundle loading performance
   */
  static trackBundleLoad(bundleName: string) {
    const startTime = performance.now();
    
    return {
      finish: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.performanceEntries.push({
          name: bundleName,
          duration,
          startTime,
          entryType: 'measure',
          toJSON: () => ({ name: bundleName, duration, startTime })
        } as PerformanceEntry);

        console.log(`Bundle ${bundleName} loaded in ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Get performance summary
   */
  static getPerformanceSummary() {
    return {
      totalBundles: this.performanceEntries.length,
      averageLoadTime: this.performanceEntries.reduce((sum, entry) => 
        sum + entry.duration, 0) / this.performanceEntries.length,
      slowestBundle: this.performanceEntries.reduce((slowest, entry) =>
        entry.duration > slowest.duration ? entry : slowest,
        this.performanceEntries[0] || { duration: 0, name: 'none' }
      )
    };
  }
}

// Export lazy-loaded components
export { LazyMobileModal, LazyMobileCharts };
export default MobileLazyLoader;
