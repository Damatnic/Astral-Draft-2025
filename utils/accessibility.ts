/**
 * Accessibility utilities for mobile-responsive focus management
 * Provides focus trapping, ARIA management, and keyboard navigation support
 */

import React from 'react';

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];

  return Array.from(
    container.querySelectorAll(focusableSelectors.join(', '))
  );
};

/**
 * Focus trap hook for modals and overlays
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = React.useRef<HTMLElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = getFocusableElements(container);
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first element
    firstElement.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // Trap focus within the container
      if (e.shiftKey) {
        // Shift + Tab: move backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        // Trigger a custom event for components to handle
        container.dispatchEvent(new CustomEvent('focustrap:escape'));
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return { containerRef };
};

/**
 * ARIA live region announcer for screen readers
 */
export class LiveAnnouncer {
  private static instance: LiveAnnouncer;
  private liveRegion: HTMLElement | null = null;

  private constructor() {
    this.createLiveRegion();
  }

  public static getInstance(): LiveAnnouncer {
    if (!LiveAnnouncer.instance) {
      LiveAnnouncer.instance = new LiveAnnouncer();
    }
    return LiveAnnouncer.instance;
  }

  private createLiveRegion() {
    if (typeof document === 'undefined') return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(this.liveRegion);
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear the message after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }
}

/**
 * Hook for announcing messages to screen readers
 */
export const useAnnouncer = () => {
  const announcer = React.useMemo(() => LiveAnnouncer.getInstance(), []);

  const announce = React.useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      announcer.announce(message, priority);
    },
    [announcer]
  );

  return { announce };
};

/**
 * Enhanced modal accessibility props
 */
export const getModalA11yProps = (
  isOpen: boolean,
  titleId: string,
  descriptionId?: string
) => ({
  role: 'dialog',
  'aria-modal': isOpen,
  'aria-labelledby': titleId,
  'aria-describedby': descriptionId,
  'aria-hidden': !isOpen
});

/**
 * Enhanced button accessibility props
 */
export const getButtonA11yProps = (
  label: string,
  disabled?: boolean,
  pressed?: boolean,
  expanded?: boolean
) => ({
  'aria-label': label,
  'aria-disabled': disabled,
  'aria-pressed': pressed,
  'aria-expanded': expanded,
  role: 'button'
});

/**
 * Mobile-specific focus utilities
 */
export const mobileFocusUtils = {
  /**
   * Ensure focus is visible on mobile devices
   */
  ensureVisibleFocus: (element: HTMLElement) => {
    if (!element) return;

    // Add visible focus indicator for mobile
    element.style.outline = '2px solid #3b82f6';
    element.style.outlineOffset = '2px';
    
    // Scroll element into view if needed
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  },

  /**
   * Handle touch vs keyboard focus differently
   */
  setupAccessibleInteraction: (element: HTMLElement) => {
    let isUsingKeyboard = false;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isUsingKeyboard = true;
      }
    };

    const handleMousedown = () => {
      isUsingKeyboard = false;
    };

    const handleFocus = () => {
      if (isUsingKeyboard) {
        mobileFocusUtils.ensureVisibleFocus(element);
      }
    };

    const handleBlur = () => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    };

    element.addEventListener('keydown', handleKeydown);
    element.addEventListener('mousedown', handleMousedown);
    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('keydown', handleKeydown);
      element.removeEventListener('mousedown', handleMousedown);
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }
};

/**
 * Keyboard navigation constants
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End'
} as const;

/**
 * Screen reader only text utility
 */
export const srOnlyClasses = 'sr-only absolute left-[-10000px] w-[1px] h-[1px] overflow-hidden';
