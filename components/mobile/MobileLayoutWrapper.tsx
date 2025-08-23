/**
 * Mobile Layout Wrapper
 * Provides responsive layout structure and mobile-specific navigation
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MobileBottomNavigation from './MobileBottomNavigation';
import { View } from '../../types';
import { 
    announceToScreenReader, 
    useReducedMotion,
} from '../../utils/mobileAccessibilityUtils';

import {
    VisuallyHidden
} from '../../utils/mobileAccessibilityComponents';

interface MobileLayoutWrapperProps {
    children: React.ReactNode;
    currentView: View;
    onViewChange: (view: View) => void;
    showBottomNav?: boolean;
    className?: string;
}

interface MobileLayoutConfig {
    hasBottomNav: boolean;
    hasPadding: boolean;
    hasScrollPadding: boolean;
    backgroundColor: string;
}

const MobileLayoutWrapper: React.FC<MobileLayoutWrapperProps> = ({
    children,
    currentView,
    onViewChange,
    showBottomNav = true,
    className = ''
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 1024px)');
    const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);
    const [safeAreaInsets, setSafeAreaInsets] = React.useState({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    });
    
    const prefersReducedMotion = useReducedMotion();

    // Announce view changes to screen readers
    React.useEffect(() => {
        // Convert view to readable format
        const viewLabel = currentView.replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
        announceToScreenReader(`Navigated to ${viewLabel}`, 'polite');
    }, [currentView]);

    // Detect keyboard visibility (mobile virtual keyboards)
    React.useEffect(() => {
        if (!isMobile) return;

        const handleResize = () => {
            // On mobile, viewport height changes when keyboard appears
            const viewportHeight = window.visualViewport?.height || window.innerHeight;
            const documentHeight = document.documentElement.clientHeight;
            const keyboardHeight = documentHeight - viewportHeight;
            
            setIsKeyboardVisible(keyboardHeight > 150); // Threshold for keyboard detection
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            return () => window.visualViewport?.removeEventListener('resize', handleResize);
        } else {
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [isMobile]);

    // Detect safe area insets for devices with notches
    React.useEffect(() => {
        if (!isMobile) return;

        const updateSafeArea = () => {
            const computedStyle = getComputedStyle(document.documentElement);
            setSafeAreaInsets({
                top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
                bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
                left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
                right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0')
            });
        };

        updateSafeArea();
        window.addEventListener('orientationchange', updateSafeArea);
        return () => window.removeEventListener('orientationchange', updateSafeArea);
    }, [isMobile]);

    // Layout configuration based on current view
    const getLayoutConfig = (view: View): MobileLayoutConfig => {
        const configs: Partial<Record<View, MobileLayoutConfig>> = {
            'DASHBOARD': {
                hasBottomNav: true,
                hasPadding: false,
                hasScrollPadding: true,
                backgroundColor: 'var(--app-bg)'
            },
            'DRAFT_ROOM': {
                hasBottomNav: false,
                hasPadding: false,
                hasScrollPadding: false,
                backgroundColor: 'var(--draft-bg, var(--app-bg))'
            },
            'ANALYTICS_HUB': {
                hasBottomNav: true,
                hasPadding: false,
                hasScrollPadding: true,
                backgroundColor: 'var(--app-bg)'
            },
            'TEAM_HUB': {
                hasBottomNav: true,
                hasPadding: true,
                hasScrollPadding: true,
                backgroundColor: 'var(--app-bg)'
            },
            'PROFILE': {
                hasBottomNav: true,
                hasPadding: true,
                hasScrollPadding: true,
                backgroundColor: 'var(--app-bg)'
            }
        };

        return configs[view] || {
            hasBottomNav: true,
            hasPadding: true,
            hasScrollPadding: true,
            backgroundColor: 'var(--app-bg)'
        };
    };

    const layoutConfig = getLayoutConfig(currentView);

    // Don't apply mobile layout on desktop
    if (!isMobile && !isTablet) {
        return <>{children}</>;
    }

    const bottomNavHeight = 80; // Height of bottom navigation

    return (
        <main 
            className={`mobile-layout-wrapper ${className}`}
            aria-label={`Mobile layout for ${currentView.replace(/_/g, ' ').toLowerCase()}`}
            style={{
                height: '100vh',
                overflow: 'hidden',
                backgroundColor: layoutConfig.backgroundColor,
                paddingTop: safeAreaInsets.top,
                paddingLeft: safeAreaInsets.left,
                paddingRight: safeAreaInsets.right,
                paddingBottom: safeAreaInsets.bottom
            }}
        >
            <VisuallyHidden>
                <h1>Fantasy Football Draft Assistant - {currentView.replace(/_/g, ' ')}</h1>
            </VisuallyHidden>

            {/* Main Content Area */}
            <section 
                className="mobile-content-area"
                aria-label="Main content"
                style={{
                    height: `calc(100vh - ${safeAreaInsets.top + safeAreaInsets.bottom}px)`,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Content Container */}
                <div 
                    className="flex-1 relative overflow-hidden"
                    style={{
                        marginBottom: layoutConfig.hasBottomNav && showBottomNav && !isKeyboardVisible 
                            ? `${bottomNavHeight}px` 
                            : 0
                    }}
                >
                    <div 
                        className={`h-full ${layoutConfig.hasPadding ? 'p-4' : ''}`}
                        style={{
                            paddingBottom: layoutConfig.hasScrollPadding ? '2rem' : 0
                        }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentView}
                                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
                                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                                className="h-full"
                                aria-live="polite"
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Bottom Navigation */}
                <AnimatePresence>
                    {layoutConfig.hasBottomNav && showBottomNav && !isKeyboardVisible && (
                        <motion.div
                            initial={prefersReducedMotion ? { opacity: 0 } : { y: bottomNavHeight }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0 }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { y: bottomNavHeight }}
                            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }}
                            className="fixed bottom-0 left-0 right-0 z-50"
                            style={{
                                paddingLeft: safeAreaInsets.left,
                                paddingRight: safeAreaInsets.right,
                                paddingBottom: safeAreaInsets.bottom
                            }}
                        >
                            <MobileBottomNavigation
                                activeView={currentView}
                                onViewChange={onViewChange}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Mobile-specific CSS */}
            <style>{`
                .mobile-layout-wrapper {
                    -webkit-overflow-scrolling: touch;
                    touch-action: manipulation;
                }

                .mobile-content-area {
                    position: relative;
                    z-index: 1;
                }

                /* Handle safe areas for devices with notches */
                @supports (padding: env(safe-area-inset-top)) {
                    .mobile-layout-wrapper {
                        padding-top: env(safe-area-inset-top);
                        padding-left: env(safe-area-inset-left);
                        padding-right: env(safe-area-inset-right);
                        padding-bottom: env(safe-area-inset-bottom);
                    }
                }

                /* Prevent zoom on input focus */
                @media screen and (max-width: 768px) {
                    input, select, textarea {
                        font-size: 16px !important;
                    }
                }

                /* Hide scrollbars on mobile but keep functionality */
                @media screen and (max-width: 768px) {
                    ::-webkit-scrollbar {
                        width: 0px;
                        background: transparent;
                    }
                }

                /* Improve touch performance */
                * {
                    -webkit-tap-highlight-color: transparent;
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                }

                /* Allow text selection in specific areas */
                input, textarea, [contenteditable] {
                    -webkit-user-select: auto;
                    user-select: auto;
                }

                /* Optimize for mobile performance */
                .mobile-content-area * {
                    transform: translateZ(0);
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }
            `}</style>
        </main>
    );
};

export default MobileLayoutWrapper;
