/**
 * @fileoverview Performance monitoring and Core Web Vitals tracking
 * Implements comprehensive performance monitoring with real-time analytics
 */

// Types for performance metrics
export interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
  
  // Custom metrics
  tti?: number // Time to Interactive
  tbt?: number // Total Blocking Time
  si?: number // Speed Index
  
  // Resource metrics
  domContentLoaded?: number
  loadComplete?: number
  
  // Navigation timing
  navigationStart?: number
  responseStart?: number
  responseEnd?: number
  domInteractive?: number
  
  // Memory metrics (if available)
  usedJSMemorySize?: number
  totalJSMemorySize?: number
  jsMemoryLimit?: number
  
  // Connection info
  effectiveType?: string
  downlink?: number
  rtt?: number
  
  // Page context
  url: string
  userAgent: string
  timestamp: number
  sessionId: string
  userId?: string
}

export interface PerformanceBudget {
  fcp: number // 2.5s
  lcp: number // 4s  
  fid: number // 100ms
  cls: number // 0.1
  ttfb: number // 600ms
}

const PERFORMANCE_BUDGET: PerformanceBudget = {
  fcp: 2500,
  lcp: 4000,
  fid: 100,
  cls: 0.1,
  ttfb: 600,
}

// Performance observer for Core Web Vitals
class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {}
  private observers: PerformanceObserver[] = []
  private sessionId: string
  private analyticsEndpoint: string
  private isEnabled: boolean

  constructor(analyticsEndpoint = '/api/analytics/performance') {
    this.analyticsEndpoint = analyticsEndpoint
    this.sessionId = this.generateSessionId()
    this.isEnabled = typeof window !== 'undefined' && 'PerformanceObserver' in window
    
    if (this.isEnabled) {
      this.initializeObservers()
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeObservers() {
    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entry) => {
      this.metrics.lcp = entry.startTime
    })

    // First Input Delay
    this.observeMetric('first-input', (entry) => {
      this.metrics.fid = entry.processingStart - entry.startTime
    })

    // Cumulative Layout Shift
    this.observeMetric('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        this.metrics.cls = (this.metrics.cls || 0) + entry.value
      }
    })

    // Navigation timing
    this.observeMetric('navigation', (entry) => {
      this.metrics.ttfb = entry.responseStart - entry.requestStart
      this.metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.requestStart
      this.metrics.loadComplete = entry.loadEventEnd - entry.requestStart
    })

    // First Contentful Paint
    this.observeMetric('paint', (entry) => {
      if (entry.name === 'first-contentful-paint') {
        this.metrics.fcp = entry.startTime
      }
    })

    // Long tasks (for Total Blocking Time)
    this.observeMetric('longtask', (entry) => {
      this.metrics.tbt = (this.metrics.tbt || 0) + Math.max(0, entry.duration - 50)
    })

    // Resource timing
    this.observeMetric('resource', (entry) => {
      // Track resource loading performance
      this.trackResourcePerformance(entry)
    })

    // Memory usage (if available)
    this.trackMemoryUsage()

    // Network information (if available)
    this.trackNetworkInfo()

    // Custom TTI calculation
    this.calculateTimeToInteractive()
  }

  private observeMetric(type: string, callback: (entry: any) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback)
      })
      
      observer.observe({ type, buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error)
    }
  }

  private trackResourcePerformance(entry: PerformanceResourceTiming) {
    // Track slow resources
    const duration = entry.responseEnd - entry.requestStart
    if (duration > 1000) { // Slow resource threshold: 1s
      this.reportSlowResource({
        name: entry.name,
        duration,
        size: entry.transferSize || 0,
        type: this.getResourceType(entry.name),
      })
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|webp|avif|svg)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font'
    return 'other'
  }

  private trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.usedJSMemorySize = memory.usedJSMemorySize
      this.metrics.totalJSMemorySize = memory.totalJSMemorySize
      this.metrics.jsMemoryLimit = memory.jsHeapSizeLimit
    }
  }

  private trackNetworkInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.metrics.effectiveType = connection.effectiveType
      this.metrics.downlink = connection.downlink
      this.metrics.rtt = connection.rtt
    }
  }

  private async calculateTimeToInteractive() {
    // Simplified TTI calculation
    // In practice, this would be more complex
    setTimeout(() => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigationEntry) {
        this.metrics.tti = navigationEntry.domInteractive - navigationEntry.requestStart
      }
    }, 5000) // Wait 5 seconds to calculate TTI
  }

  private async reportSlowResource(resource: {
    name: string
    duration: number
    size: number
    type: string
  }) {
    if (!this.analyticsEndpoint) return

    try {
      await fetch(`${this.analyticsEndpoint}/slow-resource`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...resource,
          sessionId: this.sessionId,
          timestamp: Date.now(),
          url: window.location.href,
        }),
      })
    } catch (error) {
      console.warn('Failed to report slow resource:', error)
    }
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return {
      ...this.metrics,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now(),
      sessionId: this.sessionId,
    }
  }

  public checkBudgets(): { metric: string; value: number; budget: number; passed: boolean }[] {
    const results: { metric: string; value: number; budget: number; passed: boolean }[] = []
    const metrics = this.getMetrics()

    Object.entries(PERFORMANCE_BUDGET).forEach(([metric, budget]) => {
      const value = metrics[metric as keyof PerformanceMetrics]
      if (typeof value === 'number') {
        results.push({
          metric,
          value,
          budget,
          passed: value <= budget,
        })
      }
    })

    return results
  }

  public async reportMetrics(additionalData?: Record<string, any>) {
    if (!this.analyticsEndpoint) return

    const metrics = this.getMetrics()
    const budgetResults = this.checkBudgets()
    
    try {
      await fetch(this.analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          budgetResults,
          ...additionalData,
        }),
      })
    } catch (error) {
      console.warn('Failed to report performance metrics:', error)
    }
  }

  public startPerformanceMonitoring() {
    // Report initial metrics after page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => this.reportMetrics(), 5000)
      })

      // Report on page visibility change (user leaving/returning)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.reportMetrics({ event: 'page_hidden' })
        }
      })

      // Report before page unload
      window.addEventListener('beforeunload', () => {
        this.reportMetrics({ event: 'page_unload' })
      })
    }
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// React hook for performance monitoring
export function usePerformanceMonitoring(enabled = true) {
  const [monitor] = React.useState(() => new PerformanceMonitor())
  
  React.useEffect(() => {
    if (enabled) {
      monitor.startPerformanceMonitoring()
    }
    
    return () => monitor.disconnect()
  }, [enabled, monitor])

  return {
    reportMetrics: (data?: Record<string, any>) => monitor.reportMetrics(data),
    getMetrics: () => monitor.getMetrics(),
    checkBudgets: () => monitor.checkBudgets(),
  }
}

// Utility functions for manual performance tracking
export const measureFunction = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: Parameters<T>) => {
    const start = performance.now()
    const result = fn(...args)
    const duration = performance.now() - start
    
    console.log(`${name} took ${duration.toFixed(2)}ms`)
    
    // Report long-running functions
    if (duration > 100) {
      fetch('/api/analytics/performance/slow-function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: name,
          duration,
          timestamp: Date.now(),
          url: window.location.href,
        }),
      }).catch(console.warn)
    }
    
    return result
  }) as T
}

export const measureAsyncFunction = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T => {
  return (async (...args: Parameters<T>) => {
    const start = performance.now()
    const result = await fn(...args)
    const duration = performance.now() - start
    
    console.log(`${name} (async) took ${duration.toFixed(2)}ms`)
    
    if (duration > 500) { // Higher threshold for async operations
      fetch('/api/analytics/performance/slow-async-function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: name,
          duration,
          timestamp: Date.now(),
          url: window.location.href,
        }),
      }).catch(console.warn)
    }
    
    return result
  }) as T
}

// Performance budget checker
export const checkPerformanceBudget = (metrics: Partial<PerformanceMetrics>) => {
  const violations = []
  
  if (metrics.fcp && metrics.fcp > PERFORMANCE_BUDGET.fcp) {
    violations.push(`FCP (${metrics.fcp}ms) exceeds budget (${PERFORMANCE_BUDGET.fcp}ms)`)
  }
  
  if (metrics.lcp && metrics.lcp > PERFORMANCE_BUDGET.lcp) {
    violations.push(`LCP (${metrics.lcp}ms) exceeds budget (${PERFORMANCE_BUDGET.lcp}ms)`)
  }
  
  if (metrics.fid && metrics.fid > PERFORMANCE_BUDGET.fid) {
    violations.push(`FID (${metrics.fid}ms) exceeds budget (${PERFORMANCE_BUDGET.fid}ms)`)
  }
  
  if (metrics.cls && metrics.cls > PERFORMANCE_BUDGET.cls) {
    violations.push(`CLS (${metrics.cls}) exceeds budget (${PERFORMANCE_BUDGET.cls})`)
  }
  
  if (metrics.ttfb && metrics.ttfb > PERFORMANCE_BUDGET.ttfb) {
    violations.push(`TTFB (${metrics.ttfb}ms) exceeds budget (${PERFORMANCE_BUDGET.ttfb}ms)`)
  }
  
  return {
    passed: violations.length === 0,
    violations,
  }
}

// Global performance monitor instance
export const performanceMonitor = typeof window !== 'undefined' 
  ? new PerformanceMonitor()
  : null

// Auto-start monitoring in browser
if (performanceMonitor) {
  performanceMonitor.startPerformanceMonitoring()
}

// Import React dynamically to avoid SSR issues
let React: typeof import('react')
try {
  React = require('react')
} catch {
  // React not available
}