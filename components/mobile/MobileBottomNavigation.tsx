/**
 * Mobile Bottom Navigation Component
 * Bottom sheet navigation optimized for mobile devices with gesture support
 */

import React, { useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { View } from '../../types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useThrottle } from '../../utils/mobilePerformanceUtils';
import {
    announceToScreenReader,
    useKeyboardNavigation,
    useReducedMotion
} from '../../utils/mobileAccessibilityUtils';

import {
    VisuallyHidden,
} from '../../utils/mobileAccessibilityComponents';
import { 
    HomeIcon,
    TrophyIcon,
    UsersIcon,
    BarChartIcon,
    UserIcon,
    MessageSquareIcon,
    CalendarIcon,
    SearchIcon
} from 'lucide-react';

interface MobileBottomNavigationProps {
    activeView: View;
    onViewChange: (view: View) => void;
    notificationCount?: number;
    className?: string;
}

interface NavigationItem {
    id: View;
    label: string;
    icon: React.ReactNode;
    color: string;
    category: 'primary' | 'secondary';
}

const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
    activeView,
    onViewChange,
    notificationCount = 0,
    className = ''
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [dragY, setDragY] = React.useState(0);
    const prefersReducedMotion = useReducedMotion();
    const navRef = useRef<HTMLDivElement>(null);

    // Keyboard navigation for the bottom nav
    useKeyboardNavigation(navRef as React.RefObject<HTMLElement>);

    const primaryNavItems: NavigationItem[] = [
        {
            id: 'DASHBOARD',
            label: 'Dashboard',
            icon: <HomeIcon className="w-5 h-5" />,
            color: 'text-blue-400',
            category: 'primary'
        },
        {
            id: 'DRAFT_ROOM',
            label: 'Draft',
            icon: <TrophyIcon className="w-5 h-5" />,
            color: 'text-green-400',
            category: 'primary'
        },
        {
            id: 'LEAGUE_HUB',
            label: 'League',
            icon: <UsersIcon className="w-5 h-5" />,
            color: 'text-purple-400',
            category: 'primary'
        },
        {
            id: 'ANALYTICS_HUB',
            label: 'Analytics',
            icon: <BarChartIcon className="w-5 h-5" />,
            color: 'text-orange-400',
            category: 'primary'
        },
        {
            id: 'PROFILE',
            label: 'Profile',
            icon: <UserIcon className="w-5 h-5" />,
            color: 'text-indigo-400',
            category: 'primary'
        }
    ];

    const secondaryNavItems: NavigationItem[] = [
        {
            id: 'TEAM_HUB',
            label: 'My Team',
            icon: <TrophyIcon className="w-4 h-4" />,
            color: 'text-yellow-400',
            category: 'secondary'
        },
        {
            id: 'MATCHUP',
            label: 'Matchup',
            icon: <UsersIcon className="w-4 h-4" />,
            color: 'text-red-400',
            category: 'secondary'
        },
        {
            id: 'WAIVER_WIRE',
            label: 'Waivers',
            icon: <SearchIcon className="w-4 h-4" />,
            color: 'text-cyan-400',
            category: 'secondary'
        },
        {
            id: 'MESSAGES',
            label: 'Messages',
            icon: <MessageSquareIcon className="w-4 h-4" />,
            color: 'text-pink-400',
            category: 'secondary'
        },
        {
            id: 'LEAGUE_STANDINGS',
            label: 'Standings',
            icon: <BarChartIcon className="w-4 h-4" />,
            color: 'text-emerald-400',
            category: 'secondary'
        },
        {
            id: 'WEEKLY_REPORT',
            label: 'Report',
            icon: <CalendarIcon className="w-4 h-4" />,
            color: 'text-violet-400',
            category: 'secondary'
        }
    ];

    const handleDrag = useThrottle((event: any, info: PanInfo) => {
        const newY = Math.max(-100, Math.min(100, info.offset.y));
        setDragY(newY);
    }, 16); // 60fps throttling

    const handleDragEnd = (event: any, info: PanInfo) => {
        const threshold = 30;
        
        if (info.offset.y < -threshold) {
            setIsExpanded(true);
        } else if (info.offset.y > threshold) {
            setIsExpanded(false);
        }
        
        setDragY(0);
    };

    const renderNavItem = (item: NavigationItem, isActive: boolean) => {
        const handleClick = () => {
            onViewChange(item.id);
            announceToScreenReader(`Navigated to ${item.label}`, 'polite');
        };

        const buttonId = `nav-${item.id.toLowerCase()}`;
        const hasNotification = item.id === 'MESSAGES' && notificationCount > 0;
        const ariaLabel = hasNotification 
            ? `${item.label} (${notificationCount} notifications)`
            : item.label;

        return (
            <motion.button
                key={item.id}
                id={buttonId}
                onClick={handleClick}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                className={`mobile-touch-target mobile-focus-ring flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                    isActive
                        ? `${item.color} bg-white/10`
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                aria-label={ariaLabel}
                aria-current={isActive ? 'page' : undefined}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
            >
                <div className="relative" aria-hidden="true">
                    {item.icon}
                    {hasNotification && (
                        <motion.div
                            initial={prefersReducedMotion ? {} : { scale: 0 }}
                            animate={prefersReducedMotion ? {} : { scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold"
                            aria-hidden="true"
                        >
                            {notificationCount > 9 ? '9+' : notificationCount}
                        </motion.div>
                    )}
                </div>
                <span className="text-xs mt-1 font-medium" aria-hidden="true">
                    {item.label}
                </span>
                {hasNotification && (
                    <VisuallyHidden>
                        {notificationCount} new notifications
                    </VisuallyHidden>
                )}
            </motion.button>
        );
    };

    if (!isMobile) {
        return null;
    }

    return (
        <nav 
            className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}
            aria-label="Main navigation"
            role="navigation"
        >
            {/* Backdrop */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={prefersReducedMotion ? {} : { opacity: 0 }}
                        animate={prefersReducedMotion ? {} : { opacity: 1 }}
                        exit={prefersReducedMotion ? {} : { opacity: 0 }}
                        onClick={() => setIsExpanded(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        style={{ zIndex: -1 }}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* Navigation Panel */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={prefersReducedMotion ? {} : {
                    y: isExpanded ? -200 : 0,
                    height: isExpanded ? 'auto' : 80
                }}
                style={{ y: dragY }}
                className="bg-[var(--panel-bg)]/95 backdrop-blur-lg border-t border-[var(--panel-border)] rounded-t-xl shadow-2xl"
                role="tablist"
                aria-label="Navigation tabs"
            >
                {/* Drag Handle */}
                <div className="flex justify-center py-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mobile-touch-target mobile-focus-ring p-2 rounded-lg"
                        aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
                        aria-expanded={isExpanded}
                        aria-controls="secondary-navigation"
                    >
                        <motion.div
                            animate={prefersReducedMotion ? {} : { rotate: isExpanded ? 180 : 0 }}
                            className="w-8 h-1 bg-gray-400 rounded-full"
                            aria-hidden="true"
                        />
                    </button>
                </div>

                {/* Primary Navigation */}
                <div className="px-4 pb-2">
                    <div className="grid grid-cols-5 gap-1">
                        {primaryNavItems.map((item: any) => 
                            renderNavItem(item, activeView === item.id)
                        )}
                    </div>
                </div>

                {/* Expanded Secondary Navigation */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4 pb-6"
                        >
                            <div className="border-t border-[var(--panel-border)] pt-4 mb-4">
                                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                                    More Options
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {secondaryNavItems.map((item: any) => (
                                        <motion.button
                                            key={item.id}
                                            onClick={() => {
                                                onViewChange(item.id);
                                                setIsExpanded(false);
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${
                                                activeView === item.id
                                                    ? `${item.color} bg-white/10`
                                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                                            }`}
                                        >
                                            {item.icon}
                                            <span className="text-xs mt-1 font-medium">
                                                {item.label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center justify-center gap-2 p-3 bg-blue-500/20 text-blue-400 rounded-lg"
                                    onClick={() => {
                                        onViewChange('DRAFT_ROOM');
                                        setIsExpanded(false);
                                    }}
                                >
                                    <TrophyIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium">Start Draft</span>
                                </motion.button>
                                
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center justify-center gap-2 p-3 bg-green-500/20 text-green-400 rounded-lg"
                                    onClick={() => {
                                        onViewChange('TEAM_HUB');
                                        setIsExpanded(false);
                                    }}
                                >
                                    <UsersIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium">My Team</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Safe area padding for devices with home indicator */}
                <div className="h-safe-area-inset-bottom" />
            </motion.div>
        </nav>
    );
};

export default React.memo(MobileBottomNavigation);
