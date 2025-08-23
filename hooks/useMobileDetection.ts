/**
 * Enhanced Mobile Detection Hook
 * Comprehensive mobile device and interaction detection
 */

import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isPWA: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  viewportWidth: number;
  viewportHeight: number;
  hasNotch: boolean;
  supportsHover: boolean;
}

export const useMobileDetection = (): MobileDetection => {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    isPortrait: false,
    isLandscape: true,
    isPWA: false,
    isIOS: false,
    isAndroid: false,
    screenSize: 'large',
    viewportWidth: 1024,
    viewportHeight: 768,
    hasNotch: false,
    supportsHover: true
  });

  useEffect(() => {
    const updateDetection = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Device type detection
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      
      // Touch detection
      const isTouchDevice = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 ||
                           (navigator as any).msMaxTouchPoints > 0;
      
      // Orientation detection
      const isPortrait = height > width;
      const isLandscape = width > height;
      
      // PWA detection
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone ||
                   document.referrer.includes('android-app://');
      
      // Platform detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent) ||
                   (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1);
      const isAndroid = /android/.test(userAgent);
      
      // Screen size categorization
      let screenSize: 'small' | 'medium' | 'large' | 'xlarge';
      if (width < 480) screenSize = 'small';
      else if (width < 768) screenSize = 'medium';
      else if (width < 1280) screenSize = 'large';
      else screenSize = 'xlarge';
      
      // Notch detection (iOS safe area)
      const hasNotch = isIOS && (
        CSS.supports('padding: env(safe-area-inset-top)') ||
        CSS.supports('padding: constant(safe-area-inset-top)')
      );
      
      // Hover support detection
      const supportsHover = window.matchMedia('(hover: hover)').matches;
      
      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        isPortrait,
        isLandscape,
        isPWA,
        isIOS,
        isAndroid,
        screenSize,
        viewportWidth: width,
        viewportHeight: height,
        hasNotch,
        supportsHover
      });
    };

    // Initial detection
    updateDetection();
    
    // Listen for changes
    window.addEventListener('resize', updateDetection);
    window.addEventListener('orientationchange', updateDetection);
    
    // Listen for PWA installation
    window.addEventListener('appinstalled', updateDetection);
    
    return () => {
      window.removeEventListener('resize', updateDetection);
      window.removeEventListener('orientationchange', updateDetection);
      window.removeEventListener('appinstalled', updateDetection);
    };
  }, []);

  return detection;
};

// Enhanced media query hook with mobile-specific breakpoints
export const useResponsiveBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 480) setBreakpoint('xs');      // Extra small phones
      else if (width < 640) setBreakpoint('sm'); // Small phones
      else if (width < 768) setBreakpoint('md'); // Large phones / small tablets
      else if (width < 1024) setBreakpoint('lg'); // Tablets / small laptops
      else setBreakpoint('xl');                   // Desktops
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};

// Mobile gesture detection hook
export const useMobileGestures = () => {
  const [isSwipeEnabled, setIsSwipeEnabled] = useState(false);
  const [isPullToRefreshEnabled, setIsPullToRefreshEnabled] = useState(false);
  const detection = useMobileDetection();

  useEffect(() => {
    setIsSwipeEnabled(detection.isTouchDevice);
    setIsPullToRefreshEnabled(detection.isMobile && detection.isTouchDevice);
  }, [detection.isTouchDevice, detection.isMobile]);

  return {
    isSwipeEnabled,
    isPullToRefreshEnabled,
    isTouchDevice: detection.isTouchDevice
  };
};

// Virtual keyboard detection hook
export const useVirtualKeyboard = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const screenHeight = window.screen.height;
      const threshold = screenHeight * 0.75;
      
      const keyboardOpen = windowHeight < threshold;
      setIsKeyboardOpen(keyboardOpen);
      
      if (keyboardOpen) {
        setKeyboardHeight(screenHeight - windowHeight);
      } else {
        setKeyboardHeight(0);
      }
    };

    const handleVisualViewport = () => {
      if ('visualViewport' in window && window.visualViewport) {
        const viewport = window.visualViewport;
        const initialHeight = window.screen.height;
        
        const keyboardOpen = viewport.height < initialHeight * 0.75;
        setIsKeyboardOpen(keyboardOpen);
        setKeyboardHeight(keyboardOpen ? initialHeight - viewport.height : 0);
      }
    };

    window.addEventListener('resize', handleResize);
    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewport);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewport);
      }
    };
  }, []);

  return { isKeyboardOpen, keyboardHeight };
};

// Network detection for PWA offline support
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    const updateConnectionType = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    updateConnectionType();
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return { isOnline, connectionType };
};
