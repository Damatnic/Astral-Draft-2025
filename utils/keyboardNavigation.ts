/**
 * Keyboard Navigation Utilities
 * Enhanced mobile and desktop keyboard navigation support
 */

import React from 'react';
import { KEYBOARD_KEYS } from './accessibility';

export interface KeyboardNavigationOptions {
  orientation?: 'horizontal' | 'vertical' | 'both';
  wrap?: boolean;
  disabled?: boolean;
  onActivate?: (index: number, element: HTMLElement) => void;
  onEscape?: () => void;
}

/**
 * Hook for managing keyboard navigation in lists, grids, and menus
 */
export const useKeyboardNavigation = (
  itemCount: number,
  options: KeyboardNavigationOptions = {}
) => {
  const {
    orientation = 'vertical',
    wrap = true,
    disabled = false,
    onActivate,
    onEscape
  } = options;

  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
  const containerRef = React.useRef<HTMLElement>(null);

  const getNavigableElements = React.useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="menuitem"]:not([aria-disabled="true"])',
      '[role="option"]:not([aria-disabled="true"])'
    ];

    return Array.from(
      containerRef.current.querySelectorAll(focusableSelectors.join(', '))
    ).filter((el): el is HTMLElement => el instanceof HTMLElement);
  }, []);

  const setFocus = React.useCallback((index: number) => {
    const elements = getNavigableElements();
    if (index >= 0 && index < elements.length) {
      elements[index].focus();
      setFocusedIndex(index);
    }
  }, [getNavigableElements]);

  const moveNext = React.useCallback(() => {
    const elements = getNavigableElements();
    if (elements.length === 0) return;

    let nextIndex = focusedIndex + 1;
    if (nextIndex >= elements.length) {
      nextIndex = wrap ? 0 : elements.length - 1;
    }
    setFocus(nextIndex);
  }, [focusedIndex, wrap, setFocus, getNavigableElements]);

  const movePrevious = React.useCallback(() => {
    const elements = getNavigableElements();
    if (elements.length === 0) return;

    let prevIndex = focusedIndex - 1;
    if (prevIndex < 0) {
      prevIndex = wrap ? elements.length - 1 : 0;
    }
    setFocus(prevIndex);
  }, [focusedIndex, wrap, setFocus, getNavigableElements]);

  const moveToFirst = React.useCallback(() => {
    setFocus(0);
  }, [setFocus]);

  const moveToLast = React.useCallback(() => {
    const elements = getNavigableElements();
    if (elements.length > 0) {
      setFocus(elements.length - 1);
    }
  }, [setFocus, getNavigableElements]);

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case KEYBOARD_KEYS.ARROW_DOWN:
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          moveNext();
        }
        break;

      case KEYBOARD_KEYS.ARROW_UP:
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          movePrevious();
        }
        break;

      case KEYBOARD_KEYS.ARROW_RIGHT:
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          moveNext();
        }
        break;

      case KEYBOARD_KEYS.ARROW_LEFT:
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          movePrevious();
        }
        break;

      case KEYBOARD_KEYS.HOME:
        e.preventDefault();
        moveToFirst();
        break;

      case KEYBOARD_KEYS.END:
        e.preventDefault();
        moveToLast();
        break;

      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        if (focusedIndex >= 0 && onActivate) {
          e.preventDefault();
          const elements = getNavigableElements();
          if (elements[focusedIndex]) {
            onActivate(focusedIndex, elements[focusedIndex]);
          }
        }
        break;

      case KEYBOARD_KEYS.ESCAPE:
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;
    }
  }, [
    disabled,
    orientation,
    moveNext,
    movePrevious,
    moveToFirst,
    moveToLast,
    focusedIndex,
    onActivate,
    onEscape,
    getNavigableElements
  ]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Update focused index when an element receives focus
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocusIn = (e: FocusEvent) => {
      const elements = getNavigableElements();
      const index = elements.indexOf(e.target as HTMLElement);
      if (index >= 0) {
        setFocusedIndex(index);
      }
    };

    container.addEventListener('focusin', handleFocusIn);
    return () => container.removeEventListener('focusin', handleFocusIn);
  }, [getNavigableElements]);

  return {
    containerRef,
    focusedIndex,
    setFocus,
    moveNext,
    movePrevious,
    moveToFirst,
    moveToLast
  };
};

/**
 * Hook for roving tabindex pattern (common in complex widgets)
 */
export const useRovingTabIndex = (itemCount: number, initialIndex: number = 0) => {
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);

  const getTabIndex = React.useCallback((index: number) => {
    return index === activeIndex ? 0 : -1;
  }, [activeIndex]);

  const setActiveItem = React.useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      setActiveIndex(index);
    }
  }, [itemCount]);

  return {
    activeIndex,
    getTabIndex,
    setActiveItem
  };
};

/**
 * Mobile-specific keyboard navigation enhancements
 */
export const useMobileKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const navigation = useKeyboardNavigation(0, options);

  // Enhanced for mobile: Add support for swipe-to-navigate
  React.useEffect(() => {
    const container = navigation.containerRef.current;
    if (!container) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Minimum swipe distance
      const minSwipeDistance = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            // Swipe right
            if (options.orientation === 'horizontal' || options.orientation === 'both') {
              navigation.moveNext();
            }
          } else {
            // Swipe left  
            if (options.orientation === 'horizontal' || options.orientation === 'both') {
              navigation.movePrevious();
            }
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            // Swipe down
            if (options.orientation === 'vertical' || options.orientation === 'both') {
              navigation.moveNext();
            }
          } else {
            // Swipe up
            if (options.orientation === 'vertical' || options.orientation === 'both') {
              navigation.movePrevious();
            }
          }
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navigation, options.orientation]);

  return navigation;
};

/**
 * Dropdown/Menu keyboard navigation
 */
export const useMenuNavigation = (
  itemCount: number,
  onClose?: () => void,
  onSelect?: (index: number) => void
) => {
  return useKeyboardNavigation(itemCount, {
    orientation: 'vertical',
    wrap: true,
    onEscape: onClose,
    onActivate: onSelect
  });
};

export default useKeyboardNavigation;
