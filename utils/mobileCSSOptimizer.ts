// CSS Optimization Utilities for Mobile Performance
// Identifies and helps eliminate unused CSS classes for better bundle size

interface CSSUsageAnalysis {
  usedClasses: string[];
  unusedClasses: string[];
  mobileSpecificClasses: string[];
  criticalClasses: string[];
}

/**
 * Analyzes CSS class usage across mobile-optimized components
 * Helps identify opportunities for CSS purging and optimization
 */
export class MobileCSSOptimizer {
  private static mobileBreakpoints = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
  private static criticalMobileClasses = [
    'min-h-[44px]', // Touch targets
    'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', // Responsive grids
    'text-sm', 'sm:text-base', 'lg:text-lg', // Typography
    'p-4', 'sm:p-6', 'lg:p-8', // Responsive padding
    'w-full', 'sm:w-auto', // Width utilities
    'flex-col', 'sm:flex-row', // Flex direction
    'gap-2', 'gap-4', 'gap-6', // Spacing
    'justify-center', 'sm:justify-between', // Justification
  ];

  /**
   * Scans component files for CSS class usage
   */
  static analyzeComponentCSSUsage(componentContent: string): CSSUsageAnalysis {
    const classMatches = componentContent.match(/className="([^"]+)"/g) || [];
    const allClasses = classMatches
      .map(match => match.replace(/className="|"/g, ''))
      .flatMap(classes => classes.split(' '))
      .filter(Boolean);

    const uniqueClasses = [...new Set(allClasses)];
    
    const mobileSpecificClasses = uniqueClasses.filter(cls => 
      this.mobileBreakpoints.some(bp => cls.startsWith(bp))
    );

    const criticalClasses = uniqueClasses.filter(cls =>
      this.criticalMobileClasses.includes(cls)
    );

    return {
      usedClasses: uniqueClasses,
      unusedClasses: [], // Would need full CSS bundle analysis
      mobileSpecificClasses,
      criticalClasses
    };
  }

  /**
   * Generates critical CSS for mobile-first loading
   */
  static generateCriticalMobileCSS(): string {
    return `
/* Critical Mobile CSS - Inline for Performance */
.min-h-\\[44px\\] { min-height: 44px; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.p-4 { padding: 1rem; }
.w-full { width: 100%; }
.flex-col { flex-direction: column; }
.gap-2 { gap: 0.5rem; }
.justify-center { justify-content: center; }

/* Mobile breakpoint optimizations */
@media (min-width: 640px) {
  .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sm\\:text-base { font-size: 1rem; line-height: 1.5rem; }
  .sm\\:p-6 { padding: 1.5rem; }
  .sm\\:w-auto { width: auto; }
  .sm\\:flex-row { flex-direction: row; }
  .sm\\:justify-between { justify-content: space-between; }
}
`;
  }

  /**
   * Lazy loading helper for mobile-specific components
   */
  static createLazyMobileComponent<T>(
    importFn: () => Promise<{ default: React.ComponentType<T> }>,
    fallback?: React.ComponentType
  ) {
    return React.lazy(async () => {
      // Only load on mobile if needed
      if (window.innerWidth > 768) {
        return importFn();
      }
      
      // Add artificial delay to prevent loading flash
      await new Promise(resolve => setTimeout(resolve, 100));
      return importFn();
    });
  }

  /**
   * Performance monitoring utilities for mobile optimization
   */
  static measureMobilePerformance() {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name.includes('mobile')) {
          console.log(`Mobile Performance: ${entry.name} took ${entry.duration}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });
    
    return {
      markStart: (name: string) => performance.mark(`${name}-start`),
      markEnd: (name: string) => {
        performance.mark(`${name}-end`);
        performance.measure(
          `mobile-${name}`,
          `${name}-start`,
          `${name}-end`
        );
      }
    };
  }

  /**
   * Bundle size optimization recommendations
   */
  static getBundleOptimizationRecommendations(): {
    description: string;
    impact: 'high' | 'medium' | 'low';
    implementation: string;
  }[] {
    return [
      {
        description: 'Remove unused Tailwind CSS classes',
        impact: 'medium',
        implementation: 'Configure PurgeCSS or Tailwind purge options'
      },
      {
        description: 'Implement code splitting for mobile-specific features',
        impact: 'high',
        implementation: 'Use React.lazy() for mobile modals and complex components'
      },
      {
        description: 'Inline critical mobile CSS',
        impact: 'low',
        implementation: 'Extract and inline critical CSS for mobile breakpoints'
      },
      {
        description: 'Tree-shake unused mobile utilities',
        impact: 'low',
        implementation: 'Ensure mobile optimization utilities are properly tree-shaken'
      }
    ];
  }
}

// React import for lazy loading
import React from 'react';

export default MobileCSSOptimizer;
