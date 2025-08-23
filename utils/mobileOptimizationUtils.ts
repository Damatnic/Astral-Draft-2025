// Mobile Optimization Utilities for Astral Draft Views
// Provides consistent mobile-first patterns and utilities for view components

import { useState, useEffect } from 'react';

// Breakpoint system based on Tailwind CSS
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

// Mobile-specific constants
export const MOBILE_CONSTANTS = {
  MIN_TOUCH_TARGET: 44, // Apple/W3C recommended minimum
  SAFE_AREA_BOTTOM: 34, // iPhone safe area
  KEYBOARD_HEIGHT: 300, // Estimated keyboard height
  MOBILE_MAX_WIDTH: 640, // sm breakpoint
  TABLET_MAX_WIDTH: 1024 // lg breakpoint
} as const;

/**
 * Hook to detect current screen size and mobile status
 */
export const useResponsiveBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<keyof typeof BREAKPOINTS>('sm');
  const [isMobile, setIsMobile] = useState(true);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= BREAKPOINTS['2xl']) {
        setBreakpoint('2xl');
        setIsMobile(false);
        setIsTablet(false);
      } else if (width >= BREAKPOINTS.xl) {
        setBreakpoint('xl');
        setIsMobile(false);
        setIsTablet(false);
      } else if (width >= BREAKPOINTS.lg) {
        setBreakpoint('lg');
        setIsMobile(false);
        setIsTablet(true);
      } else if (width >= BREAKPOINTS.md) {
        setBreakpoint('md');
        setIsMobile(false);
        setIsTablet(true);
      } else {
        setBreakpoint('sm');
        setIsMobile(true);
        setIsTablet(false);
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return { breakpoint, isMobile, isTablet };
};

/**
 * Mobile-optimized class name builders (static, no hooks)
 */
export const mobileClasses = {
  // Layout patterns
  container: "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  panel: "bg-[var(--panel-bg)] rounded-lg border border-[var(--panel-border)] shadow-lg",
  panelPadding: "p-4 sm:p-6",
  
  // Grid patterns
  statsGrid: "grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6",
  cardGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
  widgetGrid: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6",
  
  // Text sizing (mobile-first)
  titleLarge: "text-2xl sm:text-3xl lg:text-4xl font-bold",
  titleMedium: "text-xl sm:text-2xl font-semibold",
  titleSmall: "text-lg sm:text-xl font-medium",
  bodyLarge: "text-base sm:text-lg",
  bodyRegular: "text-sm sm:text-base",
  bodySmall: "text-xs sm:text-sm",
  
  // Touch targets
  touchTarget: "mobile-touch-target min-h-[44px] min-w-[44px] p-3",
  button: "px-4 py-3 rounded-lg font-medium mobile-touch-target",
  buttonSmall: "px-3 py-2 rounded-md font-medium mobile-touch-target",
  
  // Spacing patterns
  spacingSmall: "space-y-2 sm:space-y-3",
  spacingMedium: "space-y-4 sm:space-y-6",
  spacingLarge: "space-y-6 sm:space-y-8",
  
  // Navigation patterns
  tabsContainer: "flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hide pb-2",
  tabButton: "flex-shrink-0 px-3 py-2 mobile-touch-target rounded-lg whitespace-nowrap",
  
  // Modal patterns (mobile-optimized)
  modalOverlay: "fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4",
  modalContent: "w-full sm:w-auto sm:max-w-lg sm:rounded-lg bg-[var(--panel-bg)] border border-[var(--panel-border)]",
  modalContentMobile: "rounded-t-xl sm:rounded-lg max-h-[90vh] overflow-y-auto",
  
  // Form patterns
  input: "w-full bg-black/10 dark:bg-gray-900/50 border border-[var(--panel-border)] rounded-md px-3 py-2 text-sm",
  inputLarge: "w-full bg-black/10 dark:bg-gray-900/50 border border-[var(--panel-border)] rounded-lg px-4 py-3 text-base",
  
  // Chart container (responsive)
  chartContainer: "w-full h-64 sm:h-80 lg:h-96 p-2 sm:p-4",
  chartContainerSmall: "w-full h-48 sm:h-64 p-2 sm:p-3",
};

/**
 * Custom hook for mobile-optimized class names
 */
export const useMobileOptimizedClasses = (
  baseClasses: string,
  mobileClasses: string,
  tabletClasses?: string,
  desktopClasses?: string
) => {
  const { isMobile, isTablet } = useResponsiveBreakpoint();
  
  if (isMobile) {
    return `${baseClasses} ${mobileClasses}`;
  } else if (isTablet && tabletClasses) {
    return `${baseClasses} ${tabletClasses}`;
  } else if (desktopClasses) {
    return `${baseClasses} ${desktopClasses}`;
  }
  
  return baseClasses;
};

/**
 * Custom hook for mobile-optimized modal positioning
 */
export const useMobileModalClasses = () => {
  const { isMobile } = useResponsiveBreakpoint();
  
  if (isMobile) {
    return {
      overlay: "fixed inset-0 bg-black/50 flex items-end justify-center z-50",
      content: "w-full bg-[var(--panel-bg)] rounded-t-xl border-t border-[var(--panel-border)] max-h-[90vh] overflow-y-auto",
      animation: "animate-slide-up"
    };
  }
  
  return {
    overlay: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
    content: "w-full max-w-lg bg-[var(--panel-bg)] rounded-lg border border-[var(--panel-border)]",
    animation: "animate-fade-in"
  };
};

/**
 * Custom hook for touch-friendly icon sizing
 */
export const useIconSize = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const { isMobile } = useResponsiveBreakpoint();
  
  const sizes = {
    sm: isMobile ? 'w-5 h-5' : 'w-4 h-4',
    md: isMobile ? 'w-6 h-6' : 'w-5 h-5',
    lg: isMobile ? 'w-8 h-8' : 'w-6 h-6'
  };
  
  return sizes[size];
};

/**
 * Custom hook for mobile-optimized fixed positioning
 */
export const useMobileFixedPosition = (position: 'top' | 'bottom' | 'corner') => {
  const { isMobile } = useResponsiveBreakpoint();
  
  if (!isMobile) {
    return {
      top: "fixed top-4 left-1/2 -translate-x-1/2 z-50",
      bottom: "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
      corner: "fixed bottom-4 right-4 z-50"
    }[position];
  }
  
  // Mobile-optimized positions with safe areas
  return {
    top: "fixed top-4 left-4 right-4 z-50",
    bottom: "fixed bottom-4 left-4 right-4 z-50 pb-safe",
    corner: "fixed bottom-4 right-4 z-50 mb-safe"
  }[position];
};

/**
 * Custom hook for responsive grid columns
 */
export const useResponsiveColumns = (
  itemCount: number,
  maxCols: { mobile: number; tablet: number; desktop: number } = 
    { mobile: 2, tablet: 3, desktop: 4 }
) => {
  const { isMobile, isTablet } = useResponsiveBreakpoint();
  
  let cols: number;
  if (isMobile) {
    cols = Math.min(itemCount, maxCols.mobile);
  } else if (isTablet) {
    cols = Math.min(itemCount, maxCols.tablet);
  } else {
    cols = Math.min(itemCount, maxCols.desktop);
  }
  
  const gridClasses = [
    `grid-cols-${cols}`,
    `sm:grid-cols-${Math.min(itemCount, maxCols.tablet)}`,
    `lg:grid-cols-${Math.min(itemCount, maxCols.desktop)}`
  ].join(' ');
  
  return `grid ${gridClasses} gap-3 sm:gap-4 lg:gap-6`;
};

/**
 * Mobile-optimized spacing utilities
 */
export const spacing = {
  xs: "gap-1 sm:gap-2",
  sm: "gap-2 sm:gap-3", 
  md: "gap-3 sm:gap-4",
  lg: "gap-4 sm:gap-6",
  xl: "gap-6 sm:gap-8",
  
  padding: {
    xs: "p-2 sm:p-3",
    sm: "p-3 sm:p-4", 
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  },
  
  margin: {
    xs: "m-2 sm:m-3",
    sm: "m-3 sm:m-4",
    md: "m-4 sm:m-6", 
    lg: "m-6 sm:m-8",
  }
};

/**
 * Custom hook to determine if element should use mobile layout
 */
export const useShouldUseMobileLayout = () => {
  const { isMobile } = useResponsiveBreakpoint();
  return isMobile;
};

/**
 * Mobile-safe scrollable container
 */
export const getMobileScrollContainer = (height: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
  const heights = {
    sm: 'max-h-32 sm:max-h-40',
    md: 'max-h-48 sm:max-h-64', 
    lg: 'max-h-64 sm:max-h-80',
    xl: 'max-h-80 sm:max-h-96'
  };
  
  return `${heights[height]} overflow-y-auto scrollbar-hide overscroll-contain`;
};

export default {
  useResponsiveBreakpoint,
  mobileClasses,
  useMobileOptimizedClasses,
  useMobileModalClasses,
  useIconSize,
  useMobileFixedPosition,
  useResponsiveColumns,
  spacing,
  useShouldUseMobileLayout,
  getMobileScrollContainer,
  BREAKPOINTS,
  MOBILE_CONSTANTS
};
