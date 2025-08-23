/**
 * Advanced Touch Interactions Hook
 * Provides comprehensive touch gesture support including momentum scrolling,
 * pull-to-refresh, and haptic feedback for mobile devices
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface GestureConfig {
  swipeThreshold: number;
  velocityThreshold: number;
  pinchThreshold: number;
  longPressDelay: number;
  hapticFeedback: boolean;
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'longpress' | 'tap' | 'doubletap';
  direction?: 'up' | 'down' | 'left' | 'right';
  velocity?: number;
  scale?: number;
  duration?: number;
  points: TouchPoint[];
}

const DEFAULT_CONFIG: GestureConfig = {
  swipeThreshold: 50,
  velocityThreshold: 0.5,
  pinchThreshold: 1.2,
  longPressDelay: 500,
  hapticFeedback: true
};

export const useAdvancedTouch = (
  config: Partial<GestureConfig> = {},
  onGesture?: (gesture: TouchGesture) => void
) => {
  const [isActive, setIsActive] = useState(false);
  const [gestureState, setGestureState] = useState<TouchGesture | null>(null);
  
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });
  const touchStartRef = useRef<TouchPoint[]>([]);
  const touchHistoryRef = useRef<TouchPoint[]>([]);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastTapRef = useRef<TouchPoint | null>(null);
  const pinchStartDistanceRef = useRef<number>(0);

  // Haptic feedback utility
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!configRef.current.hapticFeedback) return;
    
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [50],
        heavy: [100]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Calculate distance between two points
  const getDistance = useCallback((p1: TouchPoint, p2: TouchPoint): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  // Calculate velocity
  const getVelocity = useCallback((points: TouchPoint[]): number => {
    if (points.length < 2) return 0;
    
    const recent = points.slice(-5); // Use last 5 points for smoother calculation
    const start = recent[0];
    const end = recent[recent.length - 1];
    
    const distance = getDistance(start, end);
    const time = end.timestamp - start.timestamp;
    
    return time > 0 ? distance / time : 0;
  }, [getDistance]);

  // Determine swipe direction
  const getSwipeDirection = useCallback((start: TouchPoint, end: TouchPoint): 'up' | 'down' | 'left' | 'right' => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));

    touchStartRef.current = touches;
    touchHistoryRef.current = [...touches];
    setIsActive(true);

    // Clear any existing long press timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }

    // Start long press detection for single touch
    if (touches.length === 1) {
      longPressTimeoutRef.current = setTimeout(() => {
        const gesture: TouchGesture = {
          type: 'longpress',
          duration: configRef.current.longPressDelay,
          points: touchHistoryRef.current
        };
        
        triggerHaptic('medium');
        setGestureState(gesture);
        onGesture?.(gesture);
      }, configRef.current.longPressDelay);
    }

    // Store pinch start distance for two-finger gestures
    if (touches.length === 2) {
      pinchStartDistanceRef.current = getDistance(touches[0], touches[1]);
    }
  }, [getDistance, onGesture, triggerHaptic]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isActive) return;

    const touches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));

    // Add to history (keep last 10 points for performance)
    touchHistoryRef.current = [...touchHistoryRef.current, ...touches].slice(-10);

    // Handle pinch gesture
    if (touches.length === 2 && touchStartRef.current.length === 2) {
      const currentDistance = getDistance(touches[0], touches[1]);
      const scale = currentDistance / pinchStartDistanceRef.current;
      
      if (Math.abs(scale - 1) > (configRef.current.pinchThreshold - 1)) {
        const gesture: TouchGesture = {
          type: 'pinch',
          scale,
          points: touchHistoryRef.current
        };
        
        setGestureState(gesture);
        onGesture?.(gesture);
      }
    }

    // Clear long press timeout on movement
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = undefined;
    }
  }, [isActive, getDistance, onGesture]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isActive || touchStartRef.current.length === 0) return;

    const endTime = Date.now();
    const startPoint = touchStartRef.current[0];
    const endPoint = touchHistoryRef.current[touchHistoryRef.current.length - 1];
    
    // Clear long press timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = undefined;
    }

    // Check for tap/double tap
    const distance = getDistance(startPoint, endPoint);
    const duration = endTime - startPoint.timestamp;
    
    if (distance < configRef.current.swipeThreshold && duration < 300) {
      // Check for double tap
      if (lastTapRef.current && 
          (endTime - lastTapRef.current.timestamp) < 300 &&
          getDistance(lastTapRef.current, endPoint) < 50) {
        
        const gesture: TouchGesture = {
          type: 'doubletap',
          points: [lastTapRef.current, endPoint]
        };
        
        triggerHaptic('light');
        setGestureState(gesture);
        onGesture?.(gesture);
        lastTapRef.current = null;
      } else {
        // Single tap
        const gesture: TouchGesture = {
          type: 'tap',
          points: [endPoint]
        };
        
        setGestureState(gesture);
        onGesture?.(gesture);
        lastTapRef.current = endPoint;
      }
    } else if (distance >= configRef.current.swipeThreshold) {
      // Swipe gesture
      const velocity = getVelocity(touchHistoryRef.current);
      
      if (velocity >= configRef.current.velocityThreshold) {
        const gesture: TouchGesture = {
          type: 'swipe',
          direction: getSwipeDirection(startPoint, endPoint),
          velocity,
          points: touchHistoryRef.current
        };
        
        triggerHaptic('light');
        setGestureState(gesture);
        onGesture?.(gesture);
      }
    }

    // Reset state
    setIsActive(false);
    touchStartRef.current = [];
    touchHistoryRef.current = [];
    
    // Clear double tap timeout
    setTimeout(() => {
      if (lastTapRef.current && (Date.now() - lastTapRef.current.timestamp) > 300) {
        lastTapRef.current = null;
      }
    }, 300);
  }, [isActive, getDistance, getVelocity, getSwipeDirection, onGesture, triggerHaptic]);

  // Attach event listeners
  useEffect(() => {
    const options = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isActive,
    gestureState,
    triggerHaptic,
    config: configRef.current
  };
};

/**
 * Pull-to-refresh hook
 */
export const usePullToRefresh = (
  onRefresh: () => Promise<void>,
  threshold: number = 100
) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const startY = useRef<number>(0);
  const containerRef = useRef<HTMLElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (containerRef.current?.scrollTop !== 0 || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    if (distance > 10) {
      e.preventDefault();
      setIsPulling(true);
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [threshold, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
    startY.current = 0;
  }, [pullDistance, threshold, onRefresh, isRefreshing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options = { passive: false };
    
    container.addEventListener('touchstart', handleTouchStart, options);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, options);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1)
  };
};

export default useAdvancedTouch;
