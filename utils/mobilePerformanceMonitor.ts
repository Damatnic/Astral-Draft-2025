/**
 * Mobile Performance Monitor
 * Monitors Web Vitals and performance metrics for mobile optimization
 */

import React from 'react';

// Web Vitals types (define locally since package may not be installed)
interface WebVitalMetric {
    name: string;
    value: number;
    delta: number;
    id: string;
    rating: 'good' | 'needs-improvement' | 'poor';
    navigationType?: string;
}

export interface PerformanceMetric {
    name: string;
    value: number;
    delta: number;
    id: string;
    rating: 'good' | 'needs-improvement' | 'poor';
    navigationType: string;
}

export interface PerformanceConfig {
    enableLogging?: boolean;
    enableReporting?: boolean;
    sampleRate?: number;
    apiEndpoint?: string;
}

class MobilePerformanceMonitor {
    private readonly config: PerformanceConfig;
    private readonly metrics: Map<string, PerformanceMetric> = new Map();
    private readonly startTime: number = performance.now();

    constructor(config: PerformanceConfig = {}) {
        this.config = {
            enableLogging: true,
            enableReporting: false,
            sampleRate: 1,
            ...config
        };

        this.initializeWebVitals();
        this.setupResourceObserver();
        this.setupNavigationObserver();
    }

    private initializeWebVitals() {
        // Manual Web Vitals implementation
        this.observeBasicMetrics();
    }

    private observeBasicMetrics() {
        // Observe paint timing
        if ('PerformanceObserver' in window) {
            const paintObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name === 'first-contentful-paint') {
                        this.handleMetric({
                            name: 'FCP',
                            value: entry.startTime,
                            delta: entry.startTime,
                            id: 'fcp',
                            rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor'
                        });
                    }
                });
            });
            paintObserver.observe({ entryTypes: ['paint'] });

            // Observe largest contentful paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                if (lastEntry) {
                    this.handleMetric({
                        name: 'LCP',
                        value: lastEntry.startTime,
                        delta: lastEntry.startTime,
                        id: 'lcp',
                        rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
                    });
                }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Observe layout shifts
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                list.getEntries().forEach((entry: any) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                if (clsValue > 0) {
                    this.handleMetric({
                        name: 'CLS',
                        value: clsValue,
                        delta: clsValue,
                        id: 'cls',
                        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
                    });
                }
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }

        // TTFB calculation
        window.addEventListener('load', () => {
            const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navTiming) {
                const ttfb = navTiming.responseStart - navTiming.requestStart;
                this.handleMetric({
                    name: 'TTFB',
                    value: ttfb,
                    delta: ttfb,
                    id: 'ttfb',
                    rating: ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor'
                });
            }
        });
    }

    private handleMetric(metric: any) {
        const performanceMetric: PerformanceMetric = {
            name: metric.name,
            value: metric.value,
            delta: metric.delta,
            id: metric.id,
            rating: metric.rating,
            navigationType: metric.navigationType || 'unknown'
        };

        this.metrics.set(metric.name, performanceMetric);

        if (this.config.enableLogging) {
            console.log(`Performance Metric: ${metric.name}`, performanceMetric);
        }

        if (this.config.enableReporting && Math.random() < (this.config.sampleRate || 1)) {
            this.reportMetric(performanceMetric);
        }

        // Trigger custom events for app-level handling
        window.dispatchEvent(new CustomEvent('performance-metric', {
            detail: performanceMetric
        }));
    }

    private setupResourceObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        this.trackResourceLoading(entry as PerformanceResourceTiming);
                    }
                });
            });

            observer.observe({ entryTypes: ['resource'] });
        }
    }

    private setupNavigationObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'navigation') {
                        this.trackNavigation(entry as PerformanceNavigationTiming);
                    }
                });
            });

            observer.observe({ entryTypes: ['navigation'] });
        }
    }

    private trackResourceLoading(entry: PerformanceResourceTiming) {
        const duration = entry.responseEnd - entry.requestStart;
        
        if (this.config.enableLogging && duration > 100) {
            console.log(`Slow resource: ${entry.name} took ${duration}ms`);
        }

        // Track large resources
        if (entry.transferSize && entry.transferSize > 100000) { // 100KB
            console.warn(`Large resource: ${entry.name} (${Math.round(entry.transferSize / 1024)}KB)`);
        }
    }

    private trackNavigation(entry: PerformanceNavigationTiming) {
        const metrics = {
            'DNS Lookup': entry.domainLookupEnd - entry.domainLookupStart,
            'TCP Connect': entry.connectEnd - entry.connectStart,
            'Request': entry.responseStart - entry.requestStart,
            'Response': entry.responseEnd - entry.responseStart,
            'DOM Processing': entry.domContentLoadedEventStart - entry.responseEnd,
            'Load Complete': entry.loadEventEnd - entry.loadEventStart
        };

        if (this.config.enableLogging) {
            console.log('Navigation Timing:', metrics);
        }
    }

    private async reportMetric(metric: PerformanceMetric) {
        if (!this.config.apiEndpoint) return;

        try {
            await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    metric,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now(),
                    url: window.location.href
                })
            });
        } catch (error) {
            console.error('Failed to report metric:', error);
        }
    }

    // Manual performance measurements
    public startMeasure(name: string) {
        performance.mark(`${name}-start`);
    }

    public endMeasure(name: string) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure && this.config.enableLogging) {
            console.log(`Custom Metric: ${name} took ${measure.duration}ms`);
        }
        
        return measure?.duration || 0;
    }

    // Memory usage monitoring
    public getMemoryUsage() {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            return {
                used: Math.round(memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
            };
        }
        return null;
    }

    // Network information
    public getNetworkInfo() {
        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        return null;
    }

    // Battery API for mobile
    public async getBatteryInfo() {
        if ('getBattery' in navigator) {
            try {
                const battery = await (navigator as any).getBattery();
                return {
                    level: Math.round(battery.level * 100),
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            } catch (error) {
                console.error('Battery API not available:', error);
                return null;
            }
        }
        return null;
    }

    // Get all collected metrics
    public getMetrics() {
        return Array.from(this.metrics.values());
    }

    // Performance score calculation
    public getPerformanceScore() {
        const metrics = this.getMetrics();
        let score = 100;

        metrics.forEach(metric => {
            switch (metric.rating) {
                case 'poor':
                    score -= 20;
                    break;
                case 'needs-improvement':
                    score -= 10;
                    break;
                default:
                    break;
            }
        });

        return Math.max(0, score);
    }

    // Device and environment info
    public getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            deviceMemory: (navigator as any).deviceMemory || 'unknown',
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            screen: {
                width: screen.width,
                height: screen.height,
                pixelRatio: window.devicePixelRatio
            }
        };
    }
}

// Singleton instance
export const performanceMonitor = new MobilePerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
    const [metrics, setMetrics] = React.useState<PerformanceMetric[]>([]);
    const [score, setScore] = React.useState<number>(100);

    React.useEffect(() => {
        const handleMetric = (event: CustomEvent) => {
            setMetrics(prev => [...prev, event.detail]);
            setScore(performanceMonitor.getPerformanceScore());
        };

        window.addEventListener('performance-metric', handleMetric as EventListener);
        
        return () => {
            window.removeEventListener('performance-metric', handleMetric as EventListener);
        };
    }, []);

    return {
        metrics,
        score,
        startMeasure: performanceMonitor.startMeasure.bind(performanceMonitor),
        endMeasure: performanceMonitor.endMeasure.bind(performanceMonitor),
        getMemoryUsage: performanceMonitor.getMemoryUsage.bind(performanceMonitor),
        getNetworkInfo: performanceMonitor.getNetworkInfo.bind(performanceMonitor),
        getBatteryInfo: performanceMonitor.getBatteryInfo.bind(performanceMonitor),
        getDeviceInfo: performanceMonitor.getDeviceInfo.bind(performanceMonitor)
    };
};

export default performanceMonitor;
