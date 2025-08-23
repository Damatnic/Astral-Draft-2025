/**
 * Advanced Mobile Touch Gestures Hook
 * Provides comprehensive touch gesture detection and handling
 */

import { useRef, useCallback, useEffect, useState } from 'react';

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface GestureState {
  startPoint: TouchPoint | null;
  currentPoint: TouchPoint | null;
  direction: 'up' | 'down' | 'left' | 'right' | null;
  distance: number;
  velocity: number;
  duration: number;
}

interface SwipeOptions {
  threshold?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
  direction?: 'horizontal' | 'vertical' | 'all';
}

interface PinchOptions {
  threshold?: number;
  preventZoom?: boolean;
}

interface UseAdvancedTouchGesturesOptions {
  swipe?: SwipeOptions;
  pinch?: PinchOptions;
  longPress?: {
    duration?: number;
    threshold?: number;
  };
  doubleTap?: {
    threshold?: number;
    delay?: number;
  };
}

interface UseAdvancedTouchGesturesReturn {
  onSwipeLeft: (callback: (gesture: GestureState) => void) => void;
  onSwipeRight: (callback: (gesture: GestureState) => void) => void;
  onSwipeUp: (callback: (gesture: GestureState) => void) => void;
  onSwipeDown: (callback: (gesture: GestureState) => void) => void;
  onPinch: (callback: (scale: number, center: { x: number; y: number }) => void) => void;
  onLongPress: (callback: (point: TouchPoint) => void) => void;
  onDoubleTap: (callback: (point: TouchPoint) => void) => void;
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  gestureState: GestureState;
  isGestureActive: boolean;
}

export const useAdvancedTouchGestures = (
  options: UseAdvancedTouchGesturesOptions = {}
): UseAdvancedTouchGesturesReturn => {
  const {
    swipe = {
      threshold: 50,
      velocityThreshold: 0.3,
      preventScroll: false,
      direction: 'all'
    },
    pinch = {
      threshold: 1.2,
      preventZoom: true
    },
    longPress = {
      duration: 500,
      threshold: 10
    },
    doubleTap = {
      threshold: 10,
      delay: 300
    }
  } = options;

  const [gestureState, setGestureState] = useState<GestureState>({
    startPoint: null,
    currentPoint: null,
    direction: null,
    distance: 0,
    velocity: 0,
    duration: 0
  });

  const [isGestureActive, setIsGestureActive] = useState(false);

  // Callback refs for gesture handlers
  const swipeLeftRef = useRef<((gesture: GestureState) => void) | null>(null);
  const swipeRightRef = useRef<((gesture: GestureState) => void) | null>(null);
  const swipeUpRef = useRef<((gesture: GestureState) => void) | null>(null);
  const swipeDownRef = useRef<((gesture: GestureState) => void) | null>(null);
  const pinchRef = useRef<((scale: number, center: { x: number; y: number }) => void) | null>(null);
  const longPressRef = useRef<((point: TouchPoint) => void) | null>(null);
  const doubleTapRef = useRef<((point: TouchPoint) => void) | null>(null);

  // Gesture tracking state
  const gestureStartTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef<number>(0);
  const lastTapPoint = useRef<TouchPoint | null>(null);
  const initialTouchDistance = useRef<number>(0);
  const initialTouchCenter = useRef<{ x: number; y: number } | null>(null);

  // Utility functions
  const getTouchPoint = (touch: React.Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now()
  });

  const getDistance = (point1: TouchPoint, point2: TouchPoint): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getDirection = (start: TouchPoint, end: TouchPoint): 'up' | 'down' | 'left' | 'right' => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  };

  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList): { x: number; y: number } => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const shouldPreventScroll = (direction: 'up' | 'down' | 'left' | 'right'): boolean => {
    if (swipe.direction === 'all') return true;
    if (swipe.direction === 'horizontal') return direction === 'left' || direction === 'right';
    if (swipe.direction === 'vertical') return direction === 'up' || direction === 'down';
    return false;
  };

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const touch = touches[0];
    const point = getTouchPoint(touch);

    setIsGestureActive(true);
    gestureStartTime.current = point.timestamp;

    if (touches.length === 1) {
      // Single touch - potential swipe, long press, or tap
      setGestureState(prev => ({
        ...prev,
        startPoint: point,
        currentPoint: point,
        direction: null,
        distance: 0,
        velocity: 0,
        duration: 0
      }));

      // Start long press timer
      if (longPressRef.current) {
        longPressTimer.current = setTimeout(() => {
          if (gestureState.distance < (longPress.threshold || 10)) {
            longPressRef.current?.(point);
          }
        }, longPress.duration);
      }

      // Check for double tap
      if (doubleTapRef.current && lastTapTime.current) {
        const timeSinceLastTap = point.timestamp - lastTapTime.current;
        if (timeSinceLastTap < (doubleTap.delay || 300) && lastTapPoint.current) {
          const tapDistance = getDistance(point, lastTapPoint.current);
          if (tapDistance < (doubleTap.threshold || 10)) {
            doubleTapRef.current(point);
            lastTapTime.current = 0;
            lastTapPoint.current = null;
            return;
          }
        }
      }

    } else if (touches.length === 2) {
      // Multi-touch - potential pinch
      if (pinchRef.current) {
        initialTouchDistance.current = getTouchDistance(touches);
        initialTouchCenter.current = getTouchCenter(touches);
        
        if (pinch.preventZoom) {
          e.preventDefault();
        }
      }
    }

    if (swipe.preventScroll) {
      e.preventDefault();
    }
  }, [gestureState.distance, longPress.threshold, longPress.duration, doubleTap.delay, doubleTap.threshold, pinch.preventZoom, swipe.preventScroll]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const touch = touches[0];
    const point = getTouchPoint(touch);

    if (touches.length === 1 && gestureState.startPoint) {
      // Single touch movement - swipe detection
      const distance = getDistance(gestureState.startPoint, point);
      const direction = getDirection(gestureState.startPoint, point);
      const duration = point.timestamp - gestureState.startPoint.timestamp;
      const velocity = duration > 0 ? distance / duration : 0;

      setGestureState(prev => ({
        ...prev,
        currentPoint: point,
        direction,
        distance,
        velocity,
        duration
      }));

      // Clear long press timer on movement
      if (longPressTimer.current && distance > (longPress.threshold || 10)) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Prevent scroll if needed based on direction
      if (swipe.preventScroll && shouldPreventScroll(direction)) {
        e.preventDefault();
      }

    } else if (touches.length === 2 && pinchRef.current) {
      // Multi-touch pinch
      const currentDistance = getTouchDistance(touches);
      const currentCenter = getTouchCenter(touches);
      
      if (initialTouchDistance.current > 0) {
        const scale = currentDistance / initialTouchDistance.current;
        if (Math.abs(scale - 1) > ((pinch.threshold || 1.2) - 1)) {
          pinchRef.current(scale, currentCenter);
        }
      }

      if (pinch.preventZoom) {
        e.preventDefault();
      }
    }
  }, [gestureState.startPoint, longPress.threshold, swipe.preventScroll, swipe.direction, pinch.threshold, pinch.preventZoom]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsGestureActive(false);

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Handle swipe gestures
    if (gestureState.startPoint && gestureState.currentPoint) {
      const distance = gestureState.distance;
      const velocity = gestureState.velocity;
      const direction = gestureState.direction;

      if (distance > (swipe.threshold || 50) && velocity > (swipe.velocityThreshold || 0.3)) {
        const gesture = { ...gestureState };
        
        switch (direction) {
          case 'left':
            swipeLeftRef.current?.(gesture);
            break;
          case 'right':
            swipeRightRef.current?.(gesture);
            break;
          case 'up':
            swipeUpRef.current?.(gesture);
            break;
          case 'down':
            swipeDownRef.current?.(gesture);
            break;
        }
      } else if (distance < (doubleTap.threshold || 50)) {
        // Potential single tap
        const now = Date.now();
        lastTapTime.current = now;
        lastTapPoint.current = gestureState.currentPoint;
      }
    }

    // Reset gesture state
    setGestureState({
      startPoint: null,
      currentPoint: null,
      direction: null,
      distance: 0,
      velocity: 0,
      duration: 0
    });

    initialTouchDistance.current = 0;
    initialTouchCenter.current = null;
  }, [gestureState, swipe.threshold, swipe.velocityThreshold, doubleTap.threshold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Gesture registration functions
  const onSwipeLeft = useCallback((callback: (gesture: GestureState) => void) => {
    swipeLeftRef.current = callback;
  }, []);

  const onSwipeRight = useCallback((callback: (gesture: GestureState) => void) => {
    swipeRightRef.current = callback;
  }, []);

  const onSwipeUp = useCallback((callback: (gesture: GestureState) => void) => {
    swipeUpRef.current = callback;
  }, []);

  const onSwipeDown = useCallback((callback: (gesture: GestureState) => void) => {
    swipeDownRef.current = callback;
  }, []);

  const onPinch = useCallback((callback: (scale: number, center: { x: number; y: number }) => void) => {
    pinchRef.current = callback;
  }, []);

  const onLongPress = useCallback((callback: (point: TouchPoint) => void) => {
    longPressRef.current = callback;
  }, []);

  const onDoubleTap = useCallback((callback: (point: TouchPoint) => void) => {
    doubleTapRef.current = callback;
  }, []);

  return {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onLongPress,
    onDoubleTap,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    gestureState,
    isGestureActive
  };
};
