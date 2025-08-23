/**
 * Accessible Mobile Components
 * Enhanced mobile components with full accessibility support
 */

import React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
    announceToScreenReader,
    useKeyboardNavigation,
    useFocusManagement,
    useReducedMotion,
} from '../../utils/mobileAccessibilityUtils';

import {
    AccessibleButton,
    VisuallyHidden,
    LiveRegion
} from '../../utils/mobileAccessibilityComponents';
import { useThrottle } from '../../utils/mobilePerformanceUtils';
import { RefreshCwIcon, ChevronDownIcon } from 'lucide-react';

interface AccessiblePullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    refreshThreshold?: number;
    maxPullDistance?: number;
    disabled?: boolean;
    className?: string;
}

export const AccessiblePullToRefresh: React.FC<AccessiblePullToRefreshProps> = ({
    onRefresh,
    children,
    refreshThreshold = 80,
    maxPullDistance = 120,
    disabled = false,
    className = ''
}) => {
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [pullState, setPullState] = React.useState<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle');
    const [announcement, setAnnouncement] = React.useState('');
    
    const pullY = React.useRef(0);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const startScrollTop = React.useRef(0);
    const prefersReducedMotion = useReducedMotion();

    const handlePanStart = (event: any, info: PanInfo) => {
        if (disabled || isRefreshing) return;
        
        const container = containerRef.current;
        if (!container) return;
        
        startScrollTop.current = container.scrollTop;
        
        // Only allow pull-to-refresh at the top of the scroll
        if (startScrollTop.current <= 0) {
            setPullState('pulling');
            setAnnouncement('Pull to refresh started');
        }
    };

    const handlePan = useThrottle((event: any, info: PanInfo) => {
        if (disabled || isRefreshing || pullState === 'idle') return;
        
        const container = containerRef.current;
        if (!container) return;
        
        // Only pull down when at the top
        if (container.scrollTop > 0) {
            setPullState('idle');
            pullY.current = 0;
            return;
        }
        
        const deltaY = Math.max(0, info.offset.y);
        const dampedY = Math.min(deltaY * 0.6, maxPullDistance);
        
        pullY.current = dampedY;
        
        if (dampedY >= refreshThreshold && pullState !== 'ready') {
            setPullState('ready');
            setAnnouncement('Release to refresh');
        } else if (dampedY < refreshThreshold && pullState !== 'pulling') {
            setPullState('pulling');
            setAnnouncement('Pull further to refresh');
        }
    }, 16); // 60fps throttling

    const handlePanEnd = async (event: any, info: PanInfo) => {
        if (disabled || isRefreshing) return;
        
        if (pullState === 'ready') {
            setPullState('refreshing');
            setIsRefreshing(true);
            setAnnouncement('Refreshing content');
            
            try {
                await onRefresh();
                setAnnouncement('Content refreshed successfully');
            } catch (error) {
                console.error('Refresh failed:', error);
                setAnnouncement('Refresh failed. Please try again.');
            } finally {
                setIsRefreshing(false);
                setPullState('idle');
                pullY.current = 0;
            }
        } else {
            setPullState('idle');
            pullY.current = 0;
        }
    };

    // Keyboard support for refresh
    const handleKeyboardRefresh = React.useCallback(async () => {
        if (disabled || isRefreshing) return;
        
        setIsRefreshing(true);
        setAnnouncement('Refreshing content');
        
        try {
            await onRefresh();
            setAnnouncement('Content refreshed successfully');
        } catch (error) {
            setAnnouncement('Refresh failed. Please try again.');
        } finally {
            setIsRefreshing(false);
        }
    }, [onRefresh, disabled, isRefreshing]);

    useKeyboardNavigation(containerRef as React.RefObject<HTMLElement>);

    const getPullIndicatorColor = () => {
        switch (pullState) {
            case 'ready':
                return 'text-green-500';
            case 'pulling':
                return 'text-blue-500';
            case 'refreshing':
                return 'text-blue-500';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusText = () => {
        switch (pullState) {
            case 'pulling':
                return 'Pull down to refresh';
            case 'ready':
                return 'Release to refresh';
            case 'refreshing':
                return 'Refreshing...';
            default:
                return '';
        }
    };

    return (
        <div className={`relative w-full h-full ${className}`}>
            {/* Live region for announcements */}
            <LiveRegion politeness="polite">{announcement}</LiveRegion>
            
            {/* Refresh button for keyboard users */}
            <div className="absolute top-2 right-2 z-10">
                <AccessibleButton
                    onClick={handleKeyboardRefresh}
                    disabled={disabled || isRefreshing}
                    className="mobile-focus-ring text-sm px-2 py-1"
                    ariaLabel="Refresh content"
                >
                    <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <VisuallyHidden>Refresh</VisuallyHidden>
                </AccessibleButton>
            </div>

            {/* Main content area */}
            <motion.div
                ref={containerRef}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDragStart={handlePanStart}
                onDrag={handlePan}
                onDragEnd={handlePanEnd}
                className="w-full h-full overflow-auto"
                style={{
                    transform: pullY.current > 0 ? `translateY(${pullY.current}px)` : 'none'
                }}
                role="main"
                aria-label="Content area with pull-to-refresh"
                tabIndex={0}
            >
                {/* Pull indicator */}
                <AnimatePresence>
                    {pullState !== 'idle' && (
                        <motion.div
                            initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
                            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                            exit={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
                            className={`flex flex-col items-center justify-center py-4 ${getPullIndicatorColor()}`}
                            role="status"
                            aria-live="polite"
                            aria-label={getStatusText()}
                        >
                            <motion.div
                                animate={prefersReducedMotion ? {} : {
                                    rotate: pullState === 'refreshing' ? 360 : 0,
                                    scale: pullState === 'ready' ? 1.2 : 1
                                }}
                                transition={{
                                    rotate: { duration: 1, repeat: pullState === 'refreshing' ? Infinity : 0 },
                                    scale: { duration: 0.2 }
                                }}
                            >
                                {pullState === 'refreshing' ? (
                                    <RefreshCwIcon className="w-6 h-6" />
                                ) : (
                                    <ChevronDownIcon className="w-6 h-6" />
                                )}
                            </motion.div>
                            <span className="text-sm mt-2 font-medium">
                                {getStatusText()}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                {children}
            </motion.div>
        </div>
    );
};

interface AccessibleTouchAreaProps {
    onTap?: () => void;
    onLongPress?: () => void;
    onSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    role?: string;
    ariaLabel?: string;
}

export const AccessibleTouchArea: React.FC<AccessibleTouchAreaProps> = ({
    onTap,
    onLongPress,
    onSwipe,
    children,
    className = '',
    disabled = false,
    role = 'button',
    ariaLabel
}) => {
    const [isPressed, setIsPressed] = React.useState(false);
    const longPressTimer = React.useRef<NodeJS.Timeout | undefined>(undefined);
    const prefersReducedMotion = useReducedMotion();

    const handleTapStart = () => {
        if (disabled) return;
        setIsPressed(true);
        
        if (onLongPress) {
            longPressTimer.current = setTimeout(() => {
                onLongPress();
                announceToScreenReader('Long press action activated', 'polite');
            }, 500);
        }
    };

    const handleTapEnd = () => {
        setIsPressed(false);
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleTap = () => {
        if (disabled) return;
        if (onTap) {
            onTap();
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (disabled) return;
        
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (onTap) {
                onTap();
            }
        }
    };

    const handlePan = (event: any, info: PanInfo) => {
        if (disabled || !onSwipe) return;
        
        const { offset } = info;
        const threshold = 50;
        
        if (Math.abs(offset.x) > Math.abs(offset.y)) {
            // Horizontal swipe
            if (offset.x > threshold) {
                onSwipe('right');
            } else if (offset.x < -threshold) {
                onSwipe('left');
            }
        } else {
            // Vertical swipe
            if (offset.y > threshold) {
                onSwipe('down');
            } else if (offset.y < -threshold) {
                onSwipe('up');
            }
        }
    };

    return (
        <motion.div
            className={`mobile-touch-target mobile-focus-ring ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            onTapStart={handleTapStart}
            onTap={handleTap}
            onTapCancel={handleTapEnd}
            onPan={onSwipe ? handlePan : undefined}
            onKeyDown={handleKeyDown}
            role={role}
            aria-label={ariaLabel}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
        >
            {children}
        </motion.div>
    );
};
