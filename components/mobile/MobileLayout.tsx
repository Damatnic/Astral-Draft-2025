/**
 * Mobile Layout Container
 * Responsive layout with safe area support and mobile optimizations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MobileNavigation from './MobileNavigation';
import PWAInstallPrompt from './PWAInstallPrompt';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface Props {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  showNavigation?: boolean;
  showPWAPrompt?: boolean;
  notificationCount?: number;
  className?: string;
}

const MobileLayout: React.FC<Props> = ({
  children,
  activeView,
  onViewChange,
  showNavigation = true,
  showPWAPrompt = true,
  notificationCount = 0,
  className = ''
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1023px)');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Handle virtual keyboard on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      // Detect virtual keyboard by comparing viewport height
      const windowHeight = window.innerHeight;
      const screenHeight = window.screen.height;
      const threshold = screenHeight * 0.75; // 75% of screen height
      
      setIsKeyboardOpen(windowHeight < threshold);
    };

    const handleVisualViewport = () => {
      if ('visualViewport' in window) {
        const viewport = window.visualViewport as any;
        const initialHeight = window.innerHeight;
        setIsKeyboardOpen(viewport.height < initialHeight * 0.75);
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
  }, [isMobile]);

  // Add viewport meta tag for better mobile support
  useEffect(() => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
  }, []);

  const getLayoutClasses = () => {
    const baseClasses = 'min-h-screen bg-gray-900 text-white relative';
    
    if (isMobile) {
      return `${baseClasses} ${showNavigation ? 'pb-20' : ''} ${isKeyboardOpen ? 'keyboard-open' : ''}`;
    }
    
    if (isTablet) {
      return `${baseClasses} ${showNavigation ? 'pt-16' : ''}`;
    }
    
    return baseClasses;
  };

  const getContentClasses = () => {
    const baseClasses = 'relative z-10';
    
    if (isMobile) {
      return `${baseClasses} safe-area-content mobile-content`;
    }
    
    return baseClasses;
  };

  return (
    <div className={`${getLayoutClasses()} ${className}`}>
      {/* Safe area top spacing for mobile devices */}
      {isMobile && (
        <div 
          className="safe-area-top bg-gray-900" 
          style={{ height: 'env(safe-area-inset-top)' }}
        />
      )}

      {/* Main content area */}
      <motion.main
        className={getContentClasses()}
        style={{
          paddingLeft: isMobile ? 'env(safe-area-inset-left)' : undefined,
          paddingRight: isMobile ? 'env(safe-area-inset-right)' : undefined,
          minHeight: isMobile ? 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))' : '100vh'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>

      {/* Mobile Navigation */}
      {showNavigation && (isMobile || isTablet) && (
        <MobileNavigation
          activeView={activeView}
          onViewChange={onViewChange}
          notificationCount={notificationCount}
          className={isKeyboardOpen ? 'hidden' : ''}
        />
      )}

      {/* PWA Install Prompt */}
      {showPWAPrompt && isMobile && (
        <PWAInstallPrompt
          onInstall={() => console.log('PWA installed')}
          onDismiss={() => console.log('PWA prompt dismissed')}
          className={isKeyboardOpen ? 'hidden' : ''}
        />
      )}
    </div>
  );
};

export default MobileLayout;
