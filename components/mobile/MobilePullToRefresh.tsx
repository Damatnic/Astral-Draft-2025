/**
 * Mobile Pull-to-Refresh Component
 * Implements native-style pull-to-refresh functionality with smooth animations
 */

import React from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCwIcon } from 'lucide-react';
import { useThrottle } from '../../utils/mobilePerformanceUtils';
import {
    announceToScreenReader,
    useReducedMotion,
} from '../../utils/mobileAccessibilityUtils';

import {
    VisuallyHidden
} from '../../utils/mobileAccessibilityComponents';interface MobilePullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    refreshThreshold?: number;
    maxPullDistance?: number;
    disabled?: boolean;
    className?: string;
}

const MobilePullToRefresh: React.FC<MobilePullToRefreshProps> = ({
    onRefresh,
    children,
    refreshThreshold = 80,
    maxPullDistance = 120,
    disabled = false,
    className = ''
}) => {
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [pullState, setPullState] = React.useState<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle');
    
    const pullY = useMotionValue(0);
    const pullProgress = useTransform(pullY, [0, refreshThreshold], [0, 1]);
    const refreshIconRotation = useTransform(pullY, [0, refreshThreshold], [0, 180]);
    
    const containerRef = React.useRef<HTMLDivElement>(null);
    const startScrollTop = React.useRef(0);
    const prefersReducedMotion = useReducedMotion();

    // Announce state changes to screen readers
    React.useEffect(() => {
        switch (pullState) {
            case 'ready':
                announceToScreenReader('Ready to refresh, release to refresh content', 'polite');
                break;
            case 'refreshing':
                announceToScreenReader('Refreshing content, please wait', 'polite');
                break;
        }
    }, [pullState]);

    // Keyboard accessibility for refresh
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            if (!disabled && !isRefreshing) {
                handleRefresh();
            }
        }
    };

    const handleRefresh = async () => {
        if (disabled || isRefreshing) return;
        
        setPullState('refreshing');
        setIsRefreshing(true);
        announceToScreenReader('Refreshing content', 'assertive');
        
        try {
            await onRefresh();
            announceToScreenReader('Content refreshed successfully', 'polite');
        } catch (error) {
            console.error('Refresh failed:', error);
            announceToScreenReader('Failed to refresh content', 'assertive');
        } finally {
            setIsRefreshing(false);
            setPullState('idle');
            pullY.set(0);
        }
    };

    const handlePanStart = (event: any, info: PanInfo) => {
        if (disabled || isRefreshing) return;
        
        const container = containerRef.current;
        if (!container) return;
        
        startScrollTop.current = container.scrollTop;
        
        // Only allow pull-to-refresh at the top of the scroll
        if (startScrollTop.current <= 0) {
            setPullState('pulling');
        }
    };

    const handlePan = useThrottle((event: any, info: PanInfo) => {
        if (disabled || isRefreshing || pullState === 'idle') return;
        
        const container = containerRef.current;
        if (!container) return;
        
        // Only pull down when at the top
        if (container.scrollTop > 0) {
            setPullState('idle');
            pullY.set(0);
            return;
        }
        
        const deltaY = Math.max(0, info.offset.y);
        const dampedY = Math.min(deltaY * 0.6, maxPullDistance);
        
        pullY.set(dampedY);
        
        if (dampedY >= refreshThreshold) {
            setPullState('ready');
        } else {
            setPullState('pulling');
        }
    }, 16); // ~60fps throttling

    const handlePanEnd = async (event: any, info: PanInfo) => {
        if (disabled || isRefreshing) return;
        
        if (pullState === 'ready') {
            await handleRefresh();
        } else {
            setPullState('idle');
            pullY.set(0);
        }
    };

    const getPullIndicatorColor = () => {
        switch (pullState) {
            case 'ready':
                return 'text-green-400';
            case 'refreshing':
                return 'text-blue-400';
            default:
                return 'text-gray-400';
        }
    };

    const getPullIndicatorText = () => {
        switch (pullState) {
            case 'pulling':
                return 'Pull to refresh';
            case 'ready':
                return 'Release to refresh';
            case 'refreshing':
                return 'Refreshing...';
            default:
                return '';
        }
    };

    React.useEffect(() => {
        if (isRefreshing) {
            pullY.set(refreshThreshold);
        }
    }, [isRefreshing, pullY, refreshThreshold]);

    return (
        <section 
            className={`relative h-full overflow-hidden ${className}`}
            aria-label="Pull to refresh content area"
            aria-live="polite"
            aria-busy={isRefreshing}
        >
            <VisuallyHidden>
                <button
                    onClick={handleRefresh}
                    onKeyDown={handleKeyDown}
                    disabled={disabled || isRefreshing}
                    aria-label="Refresh content (Ctrl+R)"
                >
                    Refresh Content
                </button>
            </VisuallyHidden>

            {/* Pull Indicator */}
            <motion.div
                style={{ 
                    y: useTransform(pullY, [0, refreshThreshold], [-60, 0]) 
                }}
                className="absolute top-0 left-0 right-0 z-10"
            >
                <output
                    className="flex flex-col items-center justify-center h-16 bg-[var(--panel-bg)] border-b border-[var(--panel-border)]"
                    aria-live="polite"
                    aria-label={getPullIndicatorText()}
                >
                    <motion.div
                        style={{ 
                            rotate: prefersReducedMotion ? 0 : refreshIconRotation 
                        }}
                        className={`mb-1 ${getPullIndicatorColor()}`}
                        aria-hidden="true"
                    >
                        {pullState === 'refreshing' ? (
                            <motion.div
                                animate={prefersReducedMotion ? {} : { rotate: 360 }}
                                transition={prefersReducedMotion ? {} : { duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <RefreshCwIcon className="w-5 h-5" />
                            </motion.div>
                        ) : (
                            <RefreshCwIcon className="w-5 h-5" />
                        )}
                    </motion.div>
                    <motion.span
                        style={{ opacity: pullProgress }}
                        className={`text-xs font-medium ${getPullIndicatorColor()}`}
                    >
                        {getPullIndicatorText()}
                    </motion.span>
                    <VisuallyHidden>
                        {pullState === 'refreshing' && 'Content is being refreshed'}
                        {pullState === 'ready' && 'Release to refresh content'}
                        {pullState === 'pulling' && 'Continue pulling down to refresh'}
                    </VisuallyHidden>
                </output>
            </motion.div>

            {/* Content Container */}
            <motion.div
                ref={containerRef}
                style={{ y: pullY }}
                onPanStart={handlePanStart}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                drag={disabled ? false : "y"}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0}
                className="h-full overflow-y-auto overscroll-behavior-y-none mobile-scrollbar"
                aria-label="Scrollable content"
            >
                {children}
            </motion.div>
        </section>
    );
};

export default MobilePullToRefresh;
