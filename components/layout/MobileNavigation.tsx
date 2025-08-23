/**
 * Enhanced Mobile Navigation Component
 * Provides accessible mobile navigation with proper touch targets
 */

import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from '../icons/CloseIcon';
import { ZapIcon } from '../icons/ZapIcon';
import { TrophyIcon } from '../icons/TrophyIcon';
import { UserIcon } from '../icons/UserIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { LayoutIcon } from '../icons/LayoutIcon';
import { LazyImage } from '../ui/LazyImage';
import type { View } from '../../types';
import { useFocusTrap } from '../../utils/accessibility';

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  view: View;
  badge?: number;
  disabled?: boolean;
}

const MobileNavigation: React.FC = () => {
  const { state, dispatch } = useAppState();
  const { isMobileNavOpen } = state;
  const { containerRef } = useFocusTrap(isMobileNavOpen);

  const navigationItems: MobileNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutIcon />,
      view: 'DASHBOARD'
    },
    {
      id: 'oracle',
      label: 'Beat The Oracle',
      icon: <ZapIcon />,
      view: 'BEAT_THE_ORACLE'
    },
    {
      id: 'draft',
      label: 'Draft Room',
      icon: <TrophyIcon />,
      view: 'DRAFT_ROOM'
    },
    {
      id: 'analytics',
      label: 'Analytics Hub',
      icon: <ChartBarIcon />,
      view: 'ANALYTICS_HUB'
    },
    {
      id: 'historical-analytics',
      label: 'Historical Analytics',
      icon: <ChartBarIcon />,
      view: 'HISTORICAL_ANALYTICS'
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: <TrophyIcon />,
      view: 'LEADERBOARD'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <UserIcon />,
      view: 'PROFILE'
    },
    {
      id: 'commissioner',
      label: 'Commissioner Tools',
      icon: <SettingsIcon />,
      view: 'COMMISSIONER_TOOLS'
    }
  ];

  const handleNavItemClick = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });
    dispatch({ type: 'TOGGLE_MOBILE_NAV' }); // Close nav after selection
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      dispatch({ type: 'TOGGLE_MOBILE_NAV' });
    }
  };

  React.useEffect(() => {
    // Prevent body scroll when nav is open
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  // Focus trap for accessibility
  React.useEffect(() => {
    if (!isMobileNavOpen) return;

    const focusableElements = document.querySelectorAll(
      '.mobile-nav button, .mobile-nav [tabindex="0"]'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'TOGGLE_MOBILE_NAV' });
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMobileNavOpen, dispatch]);

  return (
    <AnimatePresence>
      {isMobileNavOpen && (
        <motion.dialog
          ref={containerRef as React.RefObject<HTMLDialogElement>}
          open
          className="mobile-nav fixed inset-0 z-50 flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
          aria-label="Mobile Navigation"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Navigation Panel */}
          <motion.div
            className="relative ml-auto h-full w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 200,
              duration: 0.3 
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <LazyImage 
                  src="/favicon.svg" 
                  alt="Astral Draft" 
                  className="h-8 w-8"
                  loading="eager"
                />
                <h2 className="text-xl font-bold text-white font-display">
                  ASTRAL DRAFT
                </h2>
              </div>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_MOBILE_NAV' })}
                className="mobile-touch-target flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close navigation"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                  {state.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{state.user.name}</h3>
                  <p className="text-white/60 text-sm">
                    {state.leagues.filter((l: any) => l.members.some((m: any) => m.id === state.user.id)).length} leagues
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4" role="navigation">
              <ul className="space-y-2 px-4">
                {navigationItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavItemClick(item.view)}
                      disabled={item.disabled}
                      className={`
                        mobile-nav-item group relative flex items-center justify-between w-full p-4 rounded-xl text-left transition-all duration-200
                        ${state.currentView === item.view 
                          ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        }
                        ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
                      `}
                      aria-current={state.currentView === item.view ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-6 h-6 transition-colors duration-200
                          ${state.currentView === item.view ? 'text-accent-400' : 'text-white/60 group-hover:text-white'}
                        `}>
                          {item.icon}
                        </div>
                        <span className="font-medium text-base">
                          {item.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {Boolean(item.badge && item.badge > 0) && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                            {item.badge && item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        <ArrowRightIcon className={`
                          w-4 h-4 transition-all duration-200
                          ${state.currentView === item.view 
                            ? 'text-accent-400 transform rotate-90' 
                            : 'text-white/40 group-hover:text-white/60 group-hover:transform group-hover:translate-x-1'
                          }
                        `} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-white/10">
              <div className="text-center text-white/60 text-sm">
                <p>Astral Draft v2.0</p>
                <p className="mt-1">Fantasy Football Reimagined</p>
              </div>
            </div>
          </motion.div>
        </motion.dialog>
      )}
    </AnimatePresence>
  );
};

export default MobileNavigation;
