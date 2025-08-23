import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobileViewport } from '../../hooks/useMobileViewport';
import PullToRefresh from '../ui/PullToRefresh';

interface MobileEnhancedDashboardProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  showPullToRefresh?: boolean;
}

/**
 * Enhanced mobile dashboard component that wraps content with advanced mobile interactions
 * Provides pull-to-refresh, optimized mobile viewport handling, and gesture feedback
 */
export const MobileEnhancedDashboard: React.FC<MobileEnhancedDashboardProps> = ({
  children,
  onRefresh,
  showPullToRefresh = true
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { isPortrait, safeAreaInsets, isMobile } = useMobileViewport();
  const [isInteracting, setIsInteracting] = React.useState(false);

  // Handle touch interaction states
  const handleTouchStart = React.useCallback(() => {
    setIsInteracting(true);
  }, []);

  const handleTouchEnd = React.useCallback(() => {
    setIsInteracting(false);
  }, []);

  const dashboardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.2
      }
    }
  };

  const contentVariants = {
    active: {
      scale: isInteracting ? 0.98 : 1,
      transition: { duration: 0.2 }
    }
  };

  if (!isMobile) {
    // Render without mobile enhancements for desktop
    return <div className="dashboard-content">{children}</div>;
  }

  return (
    <motion.div
      ref={containerRef}
      className={`
        mobile-enhanced-dashboard
        mobile-viewport-container
        ${isPortrait ? 'portrait' : 'landscape'}
        ${isInteracting ? 'gesture-active' : ''}
      `}
      style={{
        paddingTop: safeAreaInsets.top,
        paddingBottom: safeAreaInsets.bottom,
        paddingLeft: safeAreaInsets.left,
        paddingRight: safeAreaInsets.right,
        minHeight: '100vh',
        overflowX: 'hidden'
      }}
      variants={dashboardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh wrapper */}
      {showPullToRefresh && onRefresh ? (
        <PullToRefresh
          onRefresh={onRefresh}
          threshold={80}
        >
          <motion.div
            className="dashboard-content-wrapper mobile-content-safe"
            variants={contentVariants}
            animate="active"
          >
            {children}
          </motion.div>
        </PullToRefresh>
      ) : (
        <motion.div
          className="dashboard-content-wrapper mobile-content-safe"
          variants={contentVariants}
          animate="active"
        >
          {children}
        </motion.div>
      )}

      {/* Touch interaction feedback */}
      <AnimatePresence>
        {isInteracting && (
          <motion.div
            className="gesture-feedback-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(59, 130, 246, 0.05)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileEnhancedDashboard;
