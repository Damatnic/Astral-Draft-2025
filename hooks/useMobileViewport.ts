/**
 * Mobile Viewport Manager
 * Handles mobile viewport optimization, orientation changes, and safe areas
 */

import React, { useEffect, useState, useCallback } from 'react';

export interface ViewportInfo {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isStandalone: boolean;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  devicePixelRatio: number;
  touchCapable: boolean;
}

export interface MobileViewportConfig {
  preventZoom: boolean;
  fixedViewport: boolean;
  statusBarStyle: 'default' | 'light-content' | 'dark-content';
  homeIndicatorAutoHidden: boolean;
}

const DEFAULT_CONFIG: MobileViewportConfig = {
  preventZoom: true,
  fixedViewport: true,
  statusBarStyle: 'dark-content',
  homeIndicatorAutoHidden: false
};

export const useMobileViewport = (config: Partial<MobileViewportConfig> = {}) => {
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>({
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    devicePixelRatio: window.devicePixelRatio || 1,
    touchCapable: 'ontouchstart' in window
  });

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Get safe area insets from CSS environment variables
  const getSafeAreaInsets = useCallback(() => {
    const testEl = document.createElement('div');
    testEl.style.position = 'fixed';
    testEl.style.top = '0';
    testEl.style.left = '0';
    testEl.style.visibility = 'hidden';
    document.body.appendChild(testEl);

    const computedStyle = getComputedStyle(testEl);
    
    // Try to get safe area insets
    const safeAreaTop = computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0px';
    const safeAreaRight = computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0px';
    const safeAreaBottom = computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0px';
    const safeAreaLeft = computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0px';

    document.body.removeChild(testEl);

    return {
      top: parseInt(safeAreaTop) || 0,
      right: parseInt(safeAreaRight) || 0,
      bottom: parseInt(safeAreaBottom) || 0,
      left: parseInt(safeAreaLeft) || 0
    };
  }, []);

  // Update viewport info
  const updateViewportInfo = useCallback(() => {
    setViewportInfo({
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      safeAreaInsets: getSafeAreaInsets(),
      devicePixelRatio: window.devicePixelRatio || 1,
      touchCapable: 'ontouchstart' in window
    });
  }, [getSafeAreaInsets]);

  // Set up viewport meta tag
  const setupViewportMeta = useCallback(() => {
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    const contentParts = [
      'width=device-width',
      'initial-scale=1.0'
    ];

    if (mergedConfig.preventZoom) {
      contentParts.push('maximum-scale=1.0', 'user-scalable=no');
    }

    if (mergedConfig.fixedViewport) {
      contentParts.push('viewport-fit=cover');
    }

    viewportMeta.content = contentParts.join(', ');
  }, [mergedConfig]);

  // Set up iOS specific meta tags
  const setupIOSMeta = useCallback(() => {
    // Status bar style
    let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
    if (!statusBarMeta) {
      statusBarMeta = document.createElement('meta');
      statusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(statusBarMeta);
    }
    statusBarMeta.content = mergedConfig.statusBarStyle;

    // Web app capable
    let webAppMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]') as HTMLMetaElement;
    if (!webAppMeta) {
      webAppMeta = document.createElement('meta');
      webAppMeta.name = 'apple-mobile-web-app-capable';
      webAppMeta.content = 'yes';
      document.head.appendChild(webAppMeta);
    }

    // Home indicator auto-hidden
    if (mergedConfig.homeIndicatorAutoHidden) {
      let indicatorMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
      if (indicatorMeta) {
        indicatorMeta.content = 'black-translucent';
      }
    }
  }, [mergedConfig]);

  // Handle orientation change
  const handleOrientationChange = useCallback(() => {
    // Small delay to ensure dimensions are updated
    setTimeout(() => {
      updateViewportInfo();
      
      // Trigger a custom event for components to listen to
      window.dispatchEvent(new CustomEvent('orientationchange-complete', {
        detail: { 
          orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
          width: window.innerWidth,
          height: window.innerHeight
        }
      }));
    }, 100);
  }, [updateViewportInfo]);

  // Prevent double-tap zoom on iOS
  const preventDoubleTabZoom = useCallback(() => {
    if (!mergedConfig.preventZoom) return;

    let lastTouchEnd = 0;
    
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [mergedConfig.preventZoom]);

  // Handle focus on inputs (prevent zoom on iOS)
  const handleInputFocus = useCallback(() => {
    if (!mergedConfig.preventZoom) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Temporarily disable zoom
        const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
        if (viewport) {
          const originalContent = viewport.content;
          viewport.content = originalContent + ', maximum-scale=1.0';
          
          const handleBlur = () => {
            viewport.content = originalContent;
            target.removeEventListener('blur', handleBlur);
          };
          
          target.addEventListener('blur', handleBlur);
        }
      }
    };

    document.addEventListener('focusin', handleFocus);
    
    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, [mergedConfig.preventZoom]);

  // Update CSS custom properties for safe areas
  const updateSafeAreaCSS = useCallback(() => {
    const { safeAreaInsets } = viewportInfo;
    const root = document.documentElement;
    
    root.style.setProperty('--safe-area-inset-top', `${safeAreaInsets.top}px`);
    root.style.setProperty('--safe-area-inset-right', `${safeAreaInsets.right}px`);
    root.style.setProperty('--safe-area-inset-bottom', `${safeAreaInsets.bottom}px`);
    root.style.setProperty('--safe-area-inset-left', `${safeAreaInsets.left}px`);
    
    // Also set viewport dimensions
    root.style.setProperty('--viewport-width', `${viewportInfo.width}px`);
    root.style.setProperty('--viewport-height', `${viewportInfo.height}px`);
  }, [viewportInfo]);

  // Initialize on mount
  useEffect(() => {
    setupViewportMeta();
    setupIOSMeta();
    updateViewportInfo();
    
    const cleanupDoubleTab = preventDoubleTabZoom();
    const cleanupInputFocus = handleInputFocus();
    
    return () => {
      cleanupDoubleTab?.();
      cleanupInputFocus?.();
    };
  }, [setupViewportMeta, setupIOSMeta, updateViewportInfo, preventDoubleTabZoom, handleInputFocus]);

  // Listen for viewport changes
  useEffect(() => {
    window.addEventListener('resize', updateViewportInfo);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', updateViewportInfo);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateViewportInfo, handleOrientationChange]);

  // Update CSS properties when viewport info changes
  useEffect(() => {
    updateSafeAreaCSS();
  }, [updateSafeAreaCSS]);

  return {
    viewportInfo,
    isPortrait: viewportInfo.orientation === 'portrait',
    isLandscape: viewportInfo.orientation === 'landscape',
    isMobile: viewportInfo.width < 768,
    isTablet: viewportInfo.width >= 768 && viewportInfo.width < 1024,
    isDesktop: viewportInfo.width >= 1024,
    isStandalone: viewportInfo.isStandalone,
    safeAreaInsets: viewportInfo.safeAreaInsets,
    updateViewportInfo
  };
};

/**
 * Component to handle mobile viewport setup
 */
export default useMobileViewport;
