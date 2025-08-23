/**
 * Performance Monitoring Service
 * Tracks bundle performance, loading times, and optimization metrics
 */

export interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkAnalysis[];
  duplicates: string[];
  largestAssets: AssetAnalysis[];
}

export interface ChunkAnalysis {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  loadPriority: 'high' | 'medium' | 'low';
}

export interface AssetAnalysis {
  name: string;
  size: number;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
  optimization: OptimizationSuggestion[];
}

export interface OptimizationSuggestion {
  type: 'code-split' | 'lazy-load' | 'compress' | 'cache' | 'minify';
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSavings: number;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetrics | null = null;
  private observer: PerformanceObserver | null = null;

  /**
   * Initialize performance monitoring
   */
  public init(): void {
    if (typeof window === 'undefined') return;

    this.collectWebVitals();
    this.monitorResourceLoading();
    this.trackUserInteractions();
  }

  /**
   * Collect Core Web Vitals metrics
   */
  private collectWebVitals(): void {
    // First Contentful Paint
    this.measureFCP();
    
    // Largest Contentful Paint
    this.measureLCP();
    
    // Cumulative Layout Shift
    this.measureCLS();
    
    // First Input Delay
    this.measureFID();
    
    // Time to Interactive
    this.measureTTI();
  }

  private measureFCP(): void {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.updateMetric('firstContentfulPaint', fcp.startTime);
        console.log('FCP:', fcp.startTime);
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
  }

  private measureLCP(): void {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.updateMetric('largestContentfulPaint', lastEntry.startTime);
      console.log('LCP:', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private measureCLS(): void {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.updateMetric('cumulativeLayoutShift', clsValue);
      console.log('CLS:', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }

  private measureFID(): void {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        this.updateMetric('firstInputDelay', entry.processingStart - entry.startTime);
        console.log('FID:', entry.processingStart - entry.startTime);
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  }

  private measureTTI(): void {
    // Simplified TTI measurement
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const tti = navigationEntry.domInteractive - navigationEntry.fetchStart;
      this.updateMetric('timeToInteractive', tti);
      console.log('TTI:', tti);
    }
  }

  /**
   * Monitor resource loading performance
   */
  private monitorResourceLoading(): void {
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        if (resource.initiatorType === 'script' || resource.initiatorType === 'link') {
          console.log(`Resource: ${resource.name}, Duration: ${resource.duration}ms`);
        }
      }
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
  }

  /**
   * Track user interactions for performance impact
   */
  private trackUserInteractions(): void {
    // Track long tasks that block the main thread
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(`Long task detected: ${entry.duration}ms`);
        }
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Browser doesn't support longtask entries
        console.log('Long task monitoring not supported');
      }
    }
  }

  /**
   * Analyze bundle composition and suggest optimizations
   */
  public async analyzeBundlePerformance(): Promise<BundleAnalysis> {
    // This would typically be called during build time
    // For runtime analysis, we can estimate based on loaded resources
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    const cssResources = resources.filter(r => r.name.endsWith('.css'));
    
    const chunks: ChunkAnalysis[] = jsResources.map(resource => ({
      name: resource.name.split('/').pop() || 'unknown',
      size: resource.transferSize || 0,
      gzippedSize: resource.encodedBodySize || 0,
      modules: [], // Would need build-time analysis
      loadPriority: this.determineLoadPriority(resource)
    }));

    const largestAssets: AssetAnalysis[] = resources
      .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
      .slice(0, 10)
      .map(resource => ({
        name: resource.name.split('/').pop() || 'unknown',
        size: resource.transferSize || 0,
        type: this.getAssetType(resource.name),
        optimization: this.suggestOptimizations(resource)
      }));

    return {
      totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      gzippedSize: resources.reduce((sum, r) => sum + (r.encodedBodySize || 0), 0),
      chunks,
      duplicates: [], // Would need build-time analysis
      largestAssets
    };
  }

  private determineLoadPriority(resource: PerformanceResourceTiming): 'high' | 'medium' | 'low' {
    if (resource.name.includes('vendor-react') || resource.name.includes('index-')) {
      return 'high';
    }
    if (resource.name.includes('vendor-') || resource.name.includes('feature-')) {
      return 'medium';
    }
    return 'low';
  }

  private getAssetType(filename: string): 'js' | 'css' | 'image' | 'font' | 'other' {
    if (filename.endsWith('.js')) return 'js';
    if (filename.endsWith('.css')) return 'css';
    if (filename.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) return 'image';
    if (filename.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  private suggestOptimizations(resource: PerformanceResourceTiming): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const size = resource.transferSize || 0;

    if (size > 500000) { // > 500KB
      suggestions.push({
        type: 'code-split',
        description: 'Consider code splitting this large bundle',
        impact: 'high',
        estimatedSavings: size * 0.3
      });
    }

    if (size > 100000 && resource.name.includes('vendor-')) { // > 100KB vendor
      suggestions.push({
        type: 'lazy-load',
        description: 'Consider lazy loading this vendor chunk',
        impact: 'medium',
        estimatedSavings: size * 0.5
      });
    }

    return suggestions;
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  /**
   * Update a specific metric
   */
  private updateMetric(key: keyof PerformanceMetrics, value: number): void {
    if (!this.metrics) {
      this.metrics = {
        bundleSize: 0,
        loadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        timeToInteractive: 0,
        totalBlockingTime: 0
      };
    }
    this.metrics[key] = value;
  }

  /**
   * Generate performance report
   */
  public generateReport(): string {
    const metrics = this.getMetrics();
    if (!metrics) return 'No metrics available';

    return `
Performance Report:
- First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms
- Largest Contentful Paint: ${metrics.largestContentfulPaint.toFixed(2)}ms
- Cumulative Layout Shift: ${metrics.cumulativeLayoutShift.toFixed(3)}
- First Input Delay: ${metrics.firstInputDelay.toFixed(2)}ms
- Time to Interactive: ${metrics.timeToInteractive.toFixed(2)}ms

Recommendations:
- FCP should be < 1800ms (${metrics.firstContentfulPaint < 1800 ? '✓' : '✗'})
- LCP should be < 2500ms (${metrics.largestContentfulPaint < 2500 ? '✓' : '✗'})
- CLS should be < 0.1 (${metrics.cumulativeLayoutShift < 0.1 ? '✓' : '✗'})
- FID should be < 100ms (${metrics.firstInputDelay < 100 ? '✓' : '✗'})
`;
  }

  /**
   * Cleanup performance monitoring
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();
export default performanceMonitoringService;
