/**
 * Pull-to-Refresh Component
 * Provides native-like pull-to-refresh functionality for mobile devices
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '../../hooks/useAdvancedTouch';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  threshold?: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  threshold = 100,
  children,
  className = '',
  disabled = false,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh'
}) => {
  const {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress
  } = usePullToRefresh(onRefresh, threshold);

  // Prevent scroll when pulling on mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (isPulling && pullDistance > 10) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isPulling, pullDistance, disabled]);

  const getStatusText = () => {
    if (isRefreshing) return refreshingText;
    if (pullProgress >= 1) return releaseText;
    return pullText;
  };

  const getIconRotation = () => {
    if (isRefreshing) return 360;
    if (pullProgress >= 1) return 180;
    return pullProgress * 180;
  };

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden ${className}`}
      style={{ 
        transform: isPulling ? `translateY(${Math.min(pullDistance * 0.5, 60)}px)` : 'translateY(0)',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center z-10"
            style={{
              height: Math.min(pullDistance, 80),
              transform: `translateY(-${Math.max(0, 80 - pullDistance)}px)`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              {/* Refresh icon */}
              <motion.div
                className="w-6 h-6 mb-1"
                animate={{ rotate: isRefreshing ? 360 : getIconRotation() }}
                transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0.3 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-full h-full text-blue-600 dark:text-blue-400"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </motion.div>
              
              {/* Status text */}
              <motion.span
                className="text-xs font-medium text-gray-600 dark:text-gray-400"
                key={getStatusText()}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {getStatusText()}
              </motion.span>
            </div>

            {/* Progress indicator */}
            <motion.div
              className="w-8 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: 32 }}
            >
              <motion.div
                className="h-full bg-blue-600 dark:bg-blue-400 rounded-full"
                style={{ width: `${pullProgress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className={`${disabled ? 'pointer-events-none opacity-50' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
