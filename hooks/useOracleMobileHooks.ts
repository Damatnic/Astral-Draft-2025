/**
 * Oracle Mobile Hooks
 * Custom React hooks for enhanced mobile Oracle experience
 * Touch interactions, gestures, and mobile-specific functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMediaQuery } from './useMediaQuery';

// Touch gesture types
export interface TouchGesture {
    type: 'swipe' | 'longpress' | 'tap' | 'pinch';
    direction?: 'left' | 'right' | 'up' | 'down';
    deltaX?: number;
    deltaY?: number;
    duration?: number;
    touches?: number;
}

// Mobile Oracle state interface
export interface MobileOracleState {
    isKeyboardVisible: boolean;
    orientation: 'portrait' | 'landscape';
    viewportHeight: number;
    activeInput: HTMLElement | null;
    lastTouchTime: number;
}

// Hook for Oracle touch gestures
export const useOracleTouchGestures = (
    element: React.RefObject<HTMLElement>,
    onGesture: (gesture: TouchGesture) => void
) => {
    const touchStart = useRef<Touch | null>(null);
    const touchStartTime = useRef<number>(0);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        touchStart.current = e.touches[0];
        touchStartTime.current = Date.now();

        // Setup long press detection
        longPressTimer.current = setTimeout(() => {
            onGesture({
                type: 'longpress',
                duration: Date.now() - touchStartTime.current
            });
            
            // Haptic feedback if available
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        }, 500);
    }, [onGesture]);

    const handleTouchMove = useCallback(() => {
        // Clear long press timer if user moves finger
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        if (!touchStart.current) return;

        const touchEnd = e.changedTouches[0];
        const deltaX = touchEnd.clientX - touchStart.current.clientX;
        const deltaY = touchEnd.clientY - touchStart.current.clientY;
        const duration = Date.now() - touchStartTime.current;

        const minSwipeDistance = 50;
        const maxTapDuration = 200;

        // Detect swipe gestures
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            onGesture({
                type: 'swipe',
                direction: deltaX > 0 ? 'right' : 'left',
                deltaX,
                deltaY,
                duration
            });
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
            onGesture({
                type: 'swipe',
                direction: deltaY > 0 ? 'down' : 'up',
                deltaX,
                deltaY,
                duration
            });
        } else if (duration < maxTapDuration && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            onGesture({
                type: 'tap',
                duration
            });
        }

        touchStart.current = null;
    }, [onGesture]);

    useEffect(() => {
        const currentElement = element.current;
        if (!currentElement) return;

        currentElement.addEventListener('touchstart', handleTouchStart, { passive: true });
        currentElement.addEventListener('touchmove', handleTouchMove, { passive: true });
        currentElement.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            currentElement.removeEventListener('touchstart', handleTouchStart);
            currentElement.removeEventListener('touchmove', handleTouchMove);
            currentElement.removeEventListener('touchend', handleTouchEnd);
        };
    }, [element, handleTouchStart, handleTouchMove, handleTouchEnd]);
};

// Hook for Oracle mobile state management
export const useOracleMobileState = (): MobileOracleState => {
    const [state, setState] = useState<MobileOracleState>({
        isKeyboardVisible: false,
        orientation: 'portrait',
        viewportHeight: window.innerHeight,
        activeInput: null,
        lastTouchTime: 0
    });

    useEffect(() => {
        const handleResize = () => {
            const currentHeight = window.innerHeight;
            const isKeyboardVisible = currentHeight < window.screen.height * 0.75;
            
            setState(prev => ({
                ...prev,
                viewportHeight: currentHeight,
                isKeyboardVisible
            }));
        };

        const handleOrientationChange = () => {
            // Use screen.orientation API or fallback
            const angle = screen.orientation?.angle || (window as any).orientation || 0;
            const orientation = Math.abs(angle) === 90 ? 'landscape' : 'portrait';
            
            setState(prev => ({
                ...prev,
                orientation
            }));
        };

        const handleFocusIn = (e: FocusEvent) => {
            if (e.target instanceof HTMLElement && 
                (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                setState(prev => ({
                    ...prev,
                    activeInput: e.target as HTMLElement
                }));
            }
        };

        const handleFocusOut = () => {
            setState(prev => ({
                ...prev,
                activeInput: null
            }));
        };

        const handleTouchStart = () => {
            setState(prev => ({
                ...prev,
                lastTouchTime: Date.now()
            }));
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);
        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);
        document.addEventListener('touchstart', handleTouchStart, { passive: true });

        // Initial state
        handleOrientationChange();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientationChange);
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
            document.removeEventListener('touchstart', handleTouchStart);
        };
    }, []);

    return state;
};

// Hook for Oracle mobile navigation with swipe support
export const useOracleMobileNavigation = (views: string[], initialView: string = views[0]) => {
    const [activeView, setActiveView] = useState(initialView);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const navigateToView = useCallback((viewName: string) => {
        if (views.includes(viewName) && viewName !== activeView) {
            setIsTransitioning(true);
            setActiveView(viewName);
            
            // Reset transition state after animation
            setTimeout(() => setIsTransitioning(false), 300);
        }
    }, [views, activeView]);

    const navigateNext = useCallback(() => {
        const currentIndex = views.indexOf(activeView);
        const nextIndex = (currentIndex + 1) % views.length;
        navigateToView(views[nextIndex]);
    }, [views, activeView, navigateToView]);

    const navigatePrevious = useCallback(() => {
        const currentIndex = views.indexOf(activeView);
        const prevIndex = currentIndex === 0 ? views.length - 1 : currentIndex - 1;
        navigateToView(views[prevIndex]);
    }, [views, activeView, navigateToView]);

    const handleSwipeGesture = useCallback((gesture: TouchGesture) => {
        if (!isMobile || gesture.type !== 'swipe') return;

        if (gesture.direction === 'left') {
            navigateNext();
        } else if (gesture.direction === 'right') {
            navigatePrevious();
        }
    }, [isMobile, navigateNext, navigatePrevious]);

    return {
        activeView,
        isTransitioning,
        navigateToView,
        navigateNext,
        navigatePrevious,
        handleSwipeGesture,
        viewIndex: views.indexOf(activeView),
        totalViews: views.length
    };
};

// Hook for Oracle mobile form optimization
export const useOracleMobileForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const mobileState = useOracleMobileState();

    const optimizeInputForMobile = useCallback((inputElement: HTMLInputElement) => {
        // Prevent zoom on input focus
        inputElement.setAttribute('autocomplete', 'off');
        inputElement.setAttribute('autocorrect', 'off');
        inputElement.setAttribute('autocapitalize', 'off');
        inputElement.setAttribute('spellcheck', 'false');

        // Set appropriate input types for mobile keyboards
        if (inputElement.type === 'text') {
            if (inputElement.name?.includes('email')) {
                inputElement.type = 'email';
            } else if (inputElement.name?.includes('phone')) {
                inputElement.type = 'tel';
            } else if (inputElement.name?.includes('number') || inputElement.name?.includes('confidence')) {
                inputElement.type = 'number';
            }
        }
    }, []);

    const scrollToActiveInput = useCallback(() => {
        if (mobileState.activeInput && mobileState.isKeyboardVisible) {
            setTimeout(() => {
                mobileState.activeInput?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);
        }
    }, [mobileState.activeInput, mobileState.isKeyboardVisible]);

    const submitWithHapticFeedback = useCallback(async (submitFunction: () => Promise<void>) => {
        setIsSubmitting(true);
        
        try {
            await submitFunction();
            
            // Success haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 50, 50]);
            }
        } catch (error) {
            // Error haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    // Auto-scroll to active input when keyboard appears
    useEffect(() => {
        scrollToActiveInput();
    }, [scrollToActiveInput, mobileState.isKeyboardVisible]);

    return {
        isSubmitting,
        mobileState,
        optimizeInputForMobile,
        scrollToActiveInput,
        submitWithHapticFeedback
    };
};

// Hook for Oracle mobile performance optimization
export const useOracleMobilePerformance = () => {
    const [isLowEndDevice, setIsLowEndDevice] = useState(false);
    const [shouldReduceAnimations, setShouldReduceAnimations] = useState(false);

    useEffect(() => {
        // Detect low-end devices
        const connection = (navigator as any).connection;
        const memory = (performance as any).memory;
        
        const isSlowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
        const isLowMemory = memory?.usedJSHeapSize > memory?.jsHeapSizeLimit * 0.8;
        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        setIsLowEndDevice(isSlowConnection || isLowMemory);
        setShouldReduceAnimations(isReducedMotion || isSlowConnection);
    }, []);

    const getOptimizedAnimationConfig = useCallback(() => {
        if (shouldReduceAnimations) {
            return {
                duration: 0.1,
                ease: 'linear'
            };
        }
        
        return {
            duration: 0.3,
            ease: 'easeOut'
        };
    }, [shouldReduceAnimations]);

    const shouldPreloadContent = useCallback(() => {
        return !isLowEndDevice;
    }, [isLowEndDevice]);

    return {
        isLowEndDevice,
        shouldReduceAnimations,
        getOptimizedAnimationConfig,
        shouldPreloadContent
    };
};

// Hook for Oracle mobile accessibility
export const useOracleMobileAccessibility = () => {
    const [isHighContrast, setIsHighContrast] = useState(false);
    const [fontSize, setFontSize] = useState('normal');

    useEffect(() => {
        // Detect high contrast mode
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        setIsHighContrast(highContrastQuery.matches);

        const handleContrastChange = (e: MediaQueryListEvent) => {
            setIsHighContrast(e.matches);
        };

        highContrastQuery.addEventListener('change', handleContrastChange);

        // Detect font size preferences
        const largeTextQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (largeTextQuery.matches) {
            setFontSize('large');
        }

        return () => {
            highContrastQuery.removeEventListener('change', handleContrastChange);
        };
    }, []);

    const getAccessibilityClasses = useCallback(() => {
        const classes = [];
        
        if (isHighContrast) {
            classes.push('high-contrast-mode');
        }
        
        if (fontSize === 'large') {
            classes.push('large-text-mode');
        }
        
        return classes.join(' ');
    }, [isHighContrast, fontSize]);

    const announceToScreenReader = useCallback((message: string) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }, []);

    return {
        isHighContrast,
        fontSize,
        getAccessibilityClasses,
        announceToScreenReader
    };
};

export default {
    useOracleTouchGestures,
    useOracleMobileState,
    useOracleMobileNavigation,
    useOracleMobileForm,
    useOracleMobilePerformance,
    useOracleMobileAccessibility
};
