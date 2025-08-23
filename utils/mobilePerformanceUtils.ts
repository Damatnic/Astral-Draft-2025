/**
 * Mobile Performance Utilities
 * Optimized utilities for mobile performance including debouncing and throttling
 */

import { useCallback, useRef, useEffect, useState } from 'react';

export interface DebouncedFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): void;
    cancel: () => void;
    flush: () => void;
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
): DebouncedFunction<T> {
    let timeout: NodeJS.Timeout | null = null;
    let result: ReturnType<T>;
    let savedThis: any;
    let savedArgs: Parameters<T>;

    const debounced = function(this: any, ...args: Parameters<T>) {
        savedThis = this;
        savedArgs = args;
        
        const later = () => {
            timeout = null;
            if (!immediate) result = func.apply(savedThis, savedArgs);
        };

        const callNow = immediate && !timeout;
        
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) result = func.apply(this, args);
    };

    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    debounced.flush = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
            result = func.apply(savedThis, savedArgs);
        }
    };

    return debounced as DebouncedFunction<T>;
}

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = {}
): DebouncedFunction<T> {
    let timeout: NodeJS.Timeout | null = null;
    let previous = 0;
    let result: ReturnType<T>;
    let savedThis: any;
    let savedArgs: Parameters<T>;

    const { leading = true, trailing = true } = options;

    const throttled = function(this: any, ...args: Parameters<T>) {
        savedThis = this;
        savedArgs = args;
        
        const now = Date.now();
        
        if (!previous && !leading) previous = now;
        
        const remaining = wait - (now - previous);

        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(this, args);
        } else if (!timeout && trailing) {
            timeout = setTimeout(() => {
                previous = leading ? Date.now() : 0;
                timeout = null;
                result = func.apply(savedThis, savedArgs);
            }, remaining);
        }
    };

    throttled.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        previous = 0;
    };

    throttled.flush = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
            result = func.apply(savedThis, savedArgs);
        }
    };

    return throttled as DebouncedFunction<T>;
}

export const useDebounce = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    immediate = false
): DebouncedFunction<T> => {
    const callbackRef = useRef(callback);
    const debouncedRef = useRef<DebouncedFunction<T> | null>(null);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Create debounced function
    const debouncedCallback = useCallback(() => {
        return debounce((...args: Parameters<T>) => {
            return callbackRef.current(...args);
        }, delay, immediate);
    }, [delay, immediate]);

    // Update debounced function when delay or immediate changes
    useEffect(() => {
        debouncedRef.current = debouncedCallback();
        return () => {
            debouncedRef.current?.cancel();
        };
    }, [debouncedCallback]);

    return debouncedRef.current!;
};

export const useThrottle = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    options: { leading?: boolean; trailing?: boolean } = {}
): DebouncedFunction<T> => {
    const callbackRef = useRef(callback);
    const throttledRef = useRef<DebouncedFunction<T> | null>(null);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Create throttled function
    const throttledCallback = useCallback(() => {
        return throttle((...args: Parameters<T>) => {
            return callbackRef.current(...args);
        }, delay, options);
    }, [delay, options]);

    // Update throttled function when delay or options change
    useEffect(() => {
        throttledRef.current = throttledCallback();
        return () => {
            throttledRef.current?.cancel();
        };
    }, [throttledCallback]);

    return throttledRef.current!;
};

// Optimized scroll handler for mobile
export const useOptimizedScroll = (
    callback: (event: Event) => void,
    delay = 16 // ~60fps
) => {
    const throttledCallback = useThrottle(callback, delay, { 
        leading: true, 
        trailing: true 
    });

    useEffect(() => {
        const handleScroll = (event: Event) => {
            throttledCallback(event);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            throttledCallback.cancel();
        };
    }, [throttledCallback]);
};

// Optimized resize handler for mobile
export const useOptimizedResize = (
    callback: (event: Event) => void,
    delay = 250
) => {
    const debouncedCallback = useDebounce(callback, delay);

    useEffect(() => {
        const handleResize = (event: Event) => {
            debouncedCallback(event);
        };

        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            window.removeEventListener('resize', handleResize);
            debouncedCallback.cancel();
        };
    }, [debouncedCallback]);
};

// Performance monitoring utilities
export const measurePerformance = (name: string, fn: () => void) => {
    if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`${name}-start`);
        fn();
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
    } else {
        fn();
    }
};

export const measureAsyncPerformance = async (name: string, fn: () => Promise<void>) => {
    if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`${name}-start`);
        await fn();
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
    } else {
        await fn();
    }
};

// RAF-based updates for smooth animations
export const useRAFCallback = (callback: () => void) => {
    const rafRef = useRef<number | undefined>(undefined);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const start = useCallback(() => {
        if (rafRef.current) return;
        
        const loop = () => {
            callbackRef.current();
            rafRef.current = requestAnimationFrame(loop);
        };
        
        rafRef.current = requestAnimationFrame(loop);
    }, []);

    const stop = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = undefined;
        }
    }, []);

    useEffect(() => {
        return stop;
    }, [stop]);

    return { start, stop };
};

// Advanced Mobile Performance and PWA Features

interface MobileDeviceCapabilities {
    isLowEndDevice: boolean;
    memoryInfo?: any;
    connectionType?: string;
    batteryLevel?: number;
    devicePixelRatio: number;
    hardwareConcurrency: number;
}

interface PWAInstallPrompt {
    isInstallable: boolean;
    installPrompt: Event | null;
    showInstallPrompt: () => Promise<void>;
}

// Device capability detection
export const detectMobileCapabilities = (): MobileDeviceCapabilities => {
    const capabilities: MobileDeviceCapabilities = {
        isLowEndDevice: false,
        devicePixelRatio: window.devicePixelRatio || 1,
        hardwareConcurrency: navigator.hardwareConcurrency || 4
    };

    // Memory detection (Chrome only)
    if ('memory' in performance) {
        capabilities.memoryInfo = (performance as any).memory;
        const memory = capabilities.memoryInfo;
        if (memory && memory.jsHeapSizeLimit < 1000000000) { // Less than 1GB
            capabilities.isLowEndDevice = true;
        }
    }

    // Network connection
    const connection = (navigator as any).connection || (navigator as any).mozConnection;
    if (connection) {
        capabilities.connectionType = connection.effectiveType;
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            capabilities.isLowEndDevice = true;
        }
    }

    // Hardware concurrency check
    if (capabilities.hardwareConcurrency <= 2) {
        capabilities.isLowEndDevice = true;
    }

    // Battery API
    if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
            capabilities.batteryLevel = battery.level;
        });
    }

    return capabilities;
};

// PWA installation hook
export const usePWAInstall = (): PWAInstallPrompt => {
    const [isInstallable, setIsInstallable] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setInstallPrompt(null);
            setIsInstallable(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const showInstallPrompt = useCallback(async () => {
        if (!installPrompt) return;

        try {
            const result = await installPrompt.prompt();
            console.log('PWA install prompt result:', result);
            
            if (result.outcome === 'accepted') {
                setInstallPrompt(null);
                setIsInstallable(false);
            }
        } catch (error) {
            console.error('PWA install failed:', error);
        }
    }, [installPrompt]);

    return {
        isInstallable,
        installPrompt,
        showInstallPrompt
    };
};

// Mobile-optimized image loading
export const useMobileImageOptimization = () => {
    const deviceCapabilities = useRef(detectMobileCapabilities());
    const imageCache = useRef(new Map<string, string>());

    const optimizeImageForMobile = useCallback(async (
        src: string,
        options: {
            width?: number;
            height?: number;
            quality?: number;
            format?: 'webp' | 'jpeg';
        } = {}
    ): Promise<string> => {
        const { isLowEndDevice, devicePixelRatio } = deviceCapabilities.current;
        const { width, height, quality = isLowEndDevice ? 0.6 : 0.8, format = 'webp' } = options;

        const cacheKey = `${src}-${width}-${height}-${quality}-${format}`;
        if (imageCache.current.has(cacheKey)) {
            const cached = imageCache.current.get(cacheKey);
            return cached || src;
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    if (!ctx) {
                        resolve(src);
                        return;
                    }

                    // Calculate optimal dimensions
                    let targetWidth = img.naturalWidth;
                    let targetHeight = img.naturalHeight;
                    
                    if (width || height) {
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        if (width && height) {
                            targetWidth = width;
                            targetHeight = height;
                        } else if (width) {
                            targetWidth = width;
                            targetHeight = width / aspectRatio;
                        } else if (height) {
                            targetHeight = height;
                            targetWidth = height * aspectRatio;
                        }
                    }

                    // Adjust for device pixel ratio (but limit on low-end devices)
                    const pixelRatio = isLowEndDevice ? 1 : Math.min(devicePixelRatio, 2);
                    canvas.width = targetWidth * pixelRatio;
                    canvas.height = targetHeight * pixelRatio;
                    
                    ctx.scale(pixelRatio, pixelRatio);
                    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                    // Convert with appropriate quality
                    const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
                    const optimizedDataUrl = canvas.toDataURL(mimeType, quality);

                    imageCache.current.set(cacheKey, optimizedDataUrl);
                    resolve(optimizedDataUrl);
                } catch (error) {
                    console.warn('Image optimization failed:', error);
                    resolve(src);
                }
            };

            img.onerror = () => resolve(src);
            img.src = src;
        });
    }, []);

    const clearImageCache = useCallback(() => {
        imageCache.current.clear();
    }, []);

    return {
        optimizeImageForMobile,
        clearImageCache,
        isLowEndDevice: deviceCapabilities.current.isLowEndDevice
    };
};

// Mobile touch performance optimization
export const useMobileTouchOptimization = () => {
    const lastTouchTime = useRef(0);
    const touchStartPosition = useRef<{ x: number; y: number } | null>(null);

    const optimizeTouchEvent = useCallback((callback: (event: TouchEvent) => void, delay = 16) => {
        return (event: TouchEvent) => {
            const now = Date.now();
            
            if (now - lastTouchTime.current >= delay) {
                callback(event);
                lastTouchTime.current = now;
            }
        };
    }, []);

    const handleTouchStart = useCallback((event: TouchEvent) => {
        const touch = event.touches[0];
        touchStartPosition.current = { x: touch.clientX, y: touch.clientY };
        
        // Prevent zooming on double tap for specific elements
        if (event.touches.length === 1) {
            const target = event.target as HTMLElement;
            if (target.classList.contains('prevent-zoom')) {
                event.preventDefault();
            }
        }
    }, []);

    const getTouchDistance = useCallback((startPos: { x: number; y: number }, endPos: { x: number; y: number }) => {
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        return Math.sqrt(dx * dx + dy * dy);
    }, []);

    return {
        optimizeTouchEvent,
        handleTouchStart,
        getTouchDistance,
        touchStartPosition: touchStartPosition.current
    };
};

// Network-aware loading
export const useNetworkAwareLoading = () => {
    const [connectionInfo, setConnectionInfo] = useState<{
        effectiveType: string;
        saveData: boolean;
        downlink: number;
    } | null>(null);

    useEffect(() => {
        const connection = (navigator as any).connection || (navigator as any).mozConnection;
        
        if (connection) {
            const updateConnectionInfo = () => {
                setConnectionInfo({
                    effectiveType: connection.effectiveType,
                    saveData: connection.saveData,
                    downlink: connection.downlink
                });
            };

            updateConnectionInfo();
            connection.addEventListener('change', updateConnectionInfo);

            return () => {
                connection.removeEventListener('change', updateConnectionInfo);
            };
        }
    }, []);

    const shouldLoadHeavyContent = useCallback((contentType: 'images' | 'videos' | 'animations') => {
        if (!connectionInfo) return true;

        const { effectiveType, saveData } = connectionInfo;

        if (saveData) {
            return contentType === 'images';
        }

        switch (effectiveType) {
            case 'slow-2g':
                return false;
            case '2g':
                return contentType === 'images';
            case '3g':
                return contentType !== 'videos';
            case '4g':
            default:
                return true;
        }
    }, [connectionInfo]);

    return {
        connectionInfo,
        shouldLoadHeavyContent,
        isSlowConnection: connectionInfo?.effectiveType === 'slow-2g' || connectionInfo?.effectiveType === '2g',
        isDataSaverOn: connectionInfo?.saveData || false
    };
};

// Mobile gesture performance optimization
export const useMobileGesturePerformance = () => {
    const gestureStartTime = useRef(0);
    const gestureFrameId = useRef<number | null>(null);

    const optimizeGestureCallback = useCallback((callback: () => void) => {
        if (gestureFrameId.current) {
            cancelAnimationFrame(gestureFrameId.current);
        }

        gestureFrameId.current = requestAnimationFrame(() => {
            callback();
            gestureFrameId.current = null;
        });
    }, []);

    const startGestureTracking = useCallback(() => {
        gestureStartTime.current = performance.now();
    }, []);

    const endGestureTracking = useCallback((gestureName: string) => {
        const duration = performance.now() - gestureStartTime.current;
        if (duration > 16) { // More than one frame
            console.warn(`Gesture "${gestureName}" took ${duration.toFixed(2)}ms`);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (gestureFrameId.current) {
                cancelAnimationFrame(gestureFrameId.current);
            }
        };
    }, []);

    return {
        optimizeGestureCallback,
        startGestureTracking,
        endGestureTracking
    };
};
