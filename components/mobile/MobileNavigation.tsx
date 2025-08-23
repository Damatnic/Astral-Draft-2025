/**
 * Mobile Navigation Component
 * Responsive bottom navigation bar with safe area support
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Target, 
  BarChart3, 
  Settings, 
  User, 
  Trophy,
  Calendar,
  Bell,
  Menu,
  X
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
}

interface Props {
  activeView: string;
  onViewChange: (view: string) => void;
  notificationCount?: number;
  className?: string;
}

const primaryNavItems: NavigationItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'predictions', label: 'Oracle', icon: Target, path: '/oracle' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

const secondaryNavItems: NavigationItem[] = [
  { id: 'contests', label: 'Contests', icon: Trophy, path: '/contests' },
  { id: 'schedule', label: 'Schedule', icon: Calendar, path: '/schedule' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

const MobileNavigation: React.FC<Props> = ({ 
  activeView, 
  onViewChange, 
  notificationCount = 0,
  className = ''
}) => {
  const [showSecondaryNav, setShowSecondaryNav] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleNavItemClick = (item: NavigationItem) => {
    onViewChange(item.id);
    setShowSecondaryNav(false);
  };

  const renderNavItem = (item: NavigationItem, isSecondary = false) => {
    const isActive = activeView === item.id;
    const IconComponent = item.icon;
    const showBadge = item.id === 'notifications' && notificationCount > 0;

    return (
      <motion.button
        key={item.id}
        onClick={() => handleNavItemClick(item)}
        className={`
          relative flex flex-col items-center justify-center
          min-h-[44px] min-w-[44px] px-2 py-1
          rounded-lg transition-colors duration-200
          ${isActive 
            ? 'text-blue-400 bg-blue-400/10' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }
          ${isSecondary ? 'w-full text-left flex-row px-4 py-3' : ''}
        `}
        whileTap={{ scale: 0.95 }}
        initial={false}
        animate={{
          backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
        }}
      >
        <div className="relative">
          <IconComponent className={`w-5 h-5 ${isSecondary ? 'mr-3' : 'mb-0.5'}`} />
          {showBadge && (
            <motion.div
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {notificationCount > 99 ? '99+' : notificationCount}
            </motion.div>
          )}
        </div>
        <span className={`text-xs font-medium ${isSecondary ? 'flex-1' : ''}`}>
          {item.label}
        </span>
      </motion.button>
    );
  };

  return (
    <>
      {/* Main Bottom Navigation */}
      <motion.nav
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-gray-800/95 backdrop-blur-sm
          border-t border-gray-700
          ${className}
        `}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {primaryNavItems.map((item: any) => renderNavItem(item))}
          
          {/* More Menu Button */}
          <motion.button
            onClick={() => setShowSecondaryNav(!showSecondaryNav)}
            className={`
              flex flex-col items-center justify-center
              min-h-[44px] min-w-[44px] px-2 py-1
              rounded-lg transition-colors duration-200
              ${showSecondaryNav 
                ? 'text-blue-400 bg-blue-400/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
            `}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-xs font-medium">More</span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Secondary Navigation Overlay */}
      <AnimatePresence>
        {showSecondaryNav && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSecondaryNav(false)}
            />

            {/* Secondary Nav Panel */}
            <motion.div
              className="
                fixed bottom-0 left-0 right-0 z-50
                bg-gray-800/98 backdrop-blur-sm
                border-t border-gray-700
                rounded-t-xl
              "
              style={{ 
                paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
                paddingLeft: 'env(safe-area-inset-left)',
                paddingRight: 'env(safe-area-inset-right)'
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">More Options</h3>
                <button
                  onClick={() => setShowSecondaryNav(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Secondary Nav Items */}
              <div className="p-4 space-y-2">
                {secondaryNavItems.map((item: any) => renderNavItem(item, true))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tablet-specific horizontal navigation */}
      {isTablet && (
        <motion.nav
          className="
            fixed top-0 left-0 right-0 z-40
            bg-gray-800/95 backdrop-blur-sm
            border-b border-gray-700
          "
          style={{ 
            paddingTop: 'env(safe-area-inset-top)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)'
          }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-6">
              {[...primaryNavItems, ...secondaryNavItems].map((item: any) => (
                <motion.button
                  key={`tablet-${item.id}`}
                  onClick={() => handleNavItemClick(item)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg
                    min-h-[44px] transition-colors duration-200
                    ${activeView === item.id 
                      ? 'text-blue-400 bg-blue-400/10' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.id === 'notifications' && notificationCount > 0 && (
                    <div className="bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.nav>
      )}
    </>
  );
};

export default MobileNavigation;
