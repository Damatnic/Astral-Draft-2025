/**
 * Enhanced Mobile Navigation Bar
 * Provides advanced mobile navigation with haptic feedback and gesture support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdvancedTouch } from '../../hooks/useAdvancedTouch';
import { useMobileViewport } from '../../hooks/useMobileViewport';
import { ZapIcon } from '../icons/ZapIcon';
import { TrophyIcon } from '../icons/TrophyIcon';
import { UserIcon } from '../icons/UserIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { LayoutIcon } from '../icons/LayoutIcon';
import type { View } from '../../types';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  view: View;
  badge?: number;
  disabled?: boolean;
}

interface EnhancedMobileNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onToggleMenu?: () => void;
  className?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: <LayoutIcon />,
    view: 'DASHBOARD'
  },
  {
    id: 'oracle',
    label: 'Oracle',
    icon: <ZapIcon />,
    view: 'BEAT_THE_ORACLE'
  },
  {
    id: 'analytics',
    label: 'Stats',
    icon: <ChartBarIcon />,
    view: 'ANALYTICS_HUB'
  },
  {
    id: 'leagues',
    label: 'Leagues',
    icon: <TrophyIcon />,
    view: 'LEAGUE_HUB'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <UserIcon />,
    view: 'PROFILE'
  }
];

export const EnhancedMobileNav: React.FC<EnhancedMobileNavProps> = ({
  currentView,
  onNavigate,
  onToggleMenu,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPressed, setIsPressed] = useState<string | null>(null);
  const [longPressTarget, setLongPressTarget] = useState<string | null>(null);
  
  const { viewportInfo, safeAreaInsets } = useMobileViewport();

  // Handle gesture callback first
  const handleGesture = useCallback((gesture: any) => {
    if (gesture.type === 'longpress' && longPressTarget) {
      // Long press opens context menu or quick actions
      if (onToggleMenu) {
        onToggleMenu();
      }
    }
  }, [longPressTarget, onToggleMenu]);
  
  const { triggerHaptic } = useAdvancedTouch({
    hapticFeedback: true,
    longPressDelay: 600
  }, handleGesture);

  // Update active index when current view changes
  useEffect(() => {
    const index = navigationItems.findIndex((item: any) => item.view === currentView);
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [currentView]);

  const handleNavItemPress = useCallback((item: NavigationItem, index: number) => {
    if (item.disabled) return;
    
    setIsPressed(item.id);
    setActiveIndex(index);
    triggerHaptic('light');
    
    // Small delay for visual feedback
    setTimeout(() => {
      onNavigate(item.view);
      setIsPressed(null);
    }, 100);
  }, [onNavigate, triggerHaptic]);

  const handleLongPress = useCallback((itemId: string) => {
    setLongPressTarget(itemId);
    triggerHaptic('medium');
  }, [triggerHaptic]);

  return (
    <motion.nav
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
        border-t border-gray-200/50 dark:border-gray-700/50
        shadow-lg shadow-black/5
        ${className}
      `}
      style={{
        paddingBottom: `calc(var(--safe-area-inset-bottom, 0px) + 8px)`,
        height: `calc(72px + var(--safe-area-inset-bottom, 0px))`
      }}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      {/* Background blur effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-white/60 dark:from-gray-900/80 dark:to-gray-900/60" />
      
      {/* Navigation Items */}
      <div className="relative flex items-center justify-around h-full px-4">
        {navigationItems.map((item, index) => {
          const isActive = activeIndex === index;
          const isCurrentPressed = isPressed === item.id;
          
          return (
            <motion.button
              key={item.id}
              onTouchStart={() => handleLongPress(item.id)}
              onTouchEnd={() => setLongPressTarget(null)}
              onClick={() => handleNavItemPress(item, index)}
              disabled={item.disabled}
              className={`
                relative flex flex-col items-center justify-center
                min-w-[48px] min-h-[48px] p-2 rounded-xl
                transition-all duration-200 ease-out
                ${item.disabled 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'cursor-pointer touch-manipulation'
                }
                ${isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
                }
                active:scale-95
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                scale: isCurrentPressed ? 0.9 : 1,
                y: isActive ? -2 : 0
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Active indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute -top-1 left-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                    style={{ x: '-50%' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon container */}
              <div className={`
                flex items-center justify-center w-6 h-6 mb-1
                transition-transform duration-200
                ${isActive ? 'scale-110' : 'scale-100'}
              `}>
                {item.icon}
              </div>

              {/* Label */}
              <span className={`
                text-xs font-medium leading-none
                transition-all duration-200
                ${isActive ? 'font-semibold' : 'font-normal'}
              `}>
                {item.label}
              </span>

              {/* Badge */}
              {Boolean(item.badge && item.badge > 0) && (
                <motion.div
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, delay: 0.1 }}
                >
                  {item.badge && item.badge > 99 ? '99+' : item.badge}
                </motion.div>
              )}

              {/* Ripple effect */}
              {isCurrentPressed && (
                <motion.div
                  className="absolute inset-0 bg-blue-500/20 rounded-xl"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Gesture hint for new users */}
      <AnimatePresence>
        {longPressTarget && (
          <motion.div
            className="absolute -top-12 left-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg"
            style={{ x: '-50%' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            Hold for quick actions
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default EnhancedMobileNav;
