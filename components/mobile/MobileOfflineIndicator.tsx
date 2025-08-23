/**
 * Mobile Offline Indicator
 * Shows offline status and sync progress for mobile users
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mobileOfflineService } from '../../services/mobileOfflineService';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import {
    announceToScreenReader,
    useReducedMotion,
} from '../../utils/mobileAccessibilityUtils';

import {
    VisuallyHidden
} from '../../utils/mobileAccessibilityComponents';
import {
    WifiOffIcon,
    WifiIcon,
    RefreshCwIcon,
    CheckCircleIcon,
    ClockIcon
} from 'lucide-react';

interface OfflineIndicatorProps {
    className?: string;
    position?: 'top' | 'bottom';
    showDetails?: boolean;
}

const MobileOfflineIndicator: React.FC<OfflineIndicatorProps> = ({
    className = '',
    position = 'top',
    showDetails = false
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [offlineState, setOfflineState] = React.useState(mobileOfflineService.getState());
    const [showBanner, setShowBanner] = React.useState(false);
    const [lastOnlineTime, setLastOnlineTime] = React.useState<Date | null>(null);
    const prefersReducedMotion = useReducedMotion();

    // Announce status changes to screen readers
    React.useEffect(() => {
        const unsubscribe = mobileOfflineService.subscribe((state) => {
            const previousOfflineStatus = offlineState.isOffline;
            setOfflineState(state);
            
            // Announce status changes
            if (state.isOffline !== previousOfflineStatus) {
                const message = state.isOffline 
                    ? 'Connection lost. You are now offline. Draft data will be saved locally and synced when reconnected.'
                    : 'Connection restored. You are now online. Syncing pending changes.';
                announceToScreenReader(message, 'assertive');
            }
            
            // Show banner when going offline or coming back online
            if (state.isOffline !== previousOfflineStatus) {
                setShowBanner(true);
                
                if (!state.isOffline) {
                    setLastOnlineTime(new Date());
                    // Hide banner after successful reconnection
                    setTimeout(() => setShowBanner(false), 3000);
                } else {
                    // Keep banner visible while offline
                    setShowBanner(true);
                }
            }
        });

        return unsubscribe;
    }, [offlineState.isOffline]);

    React.useEffect(() => {
        // Auto-hide banner after 5 seconds when going offline
        if (offlineState.isOffline && showBanner) {
            const timer = setTimeout(() => setShowBanner(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [offlineState.isOffline, showBanner]);

    const getStatusIcon = () => {
        if (offlineState.syncInProgress) {
            return <RefreshCwIcon className={`w-4 h-4 ${!prefersReducedMotion ? 'animate-spin' : ''}`} />;
        }
        if (offlineState.isOffline) {
            return <WifiOffIcon className="w-4 h-4" />;
        }
        if (offlineState.pendingActions.length > 0) {
            return <ClockIcon className="w-4 h-4" />;
        }
        return <WifiIcon className="w-4 h-4" />;
    };

    const getStatusText = () => {
        if (offlineState.syncInProgress) {
            return 'Syncing...';
        }
        if (offlineState.isOffline) {
            return 'Offline Mode';
        }
        if (offlineState.pendingActions.length > 0) {
            return `${offlineState.pendingActions.length} pending`;
        }
        return 'Online';
    };

    const getStatusColor = () => {
        if (offlineState.syncInProgress) {
            return 'text-blue-400 bg-blue-500/20';
        }
        if (offlineState.isOffline) {
            return 'text-red-400 bg-red-500/20';
        }
        if (offlineState.pendingActions.length > 0) {
            return 'text-yellow-400 bg-yellow-500/20';
        }
        return 'text-green-400 bg-green-500/20';
    };

    const getStatusDescription = () => {
        if (offlineState.isOffline) {
            return offlineState.hasOfflineData 
                ? 'You can continue drafting. Changes will sync when reconnected.'
                : 'Limited functionality available. Try to reconnect.';
        }
        
        if (offlineState.pendingActions.length > 0) {
            return `Syncing ${offlineState.pendingActions.length} pending changes...`;
        }
        
        return 'All changes have been synced successfully.';
    };

    const getBannerTitle = () => {
        return offlineState.isOffline ? 'You\'re offline' : 'Back online!';
    };

    const formatLastSync = () => {
        if (!offlineState.lastSync) return 'Never';
        
        const now = new Date();
        const diff = now.getTime() - offlineState.lastSync.getTime();
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const handleBannerClick = () => {
        if (!offlineState.isOffline && offlineState.pendingActions.length > 0) {
            mobileOfflineService.syncPendingActions();
            announceToScreenReader('Manually syncing pending changes', 'polite');
        }
    };

    const handleSyncNow = (e: React.MouseEvent) => {
        e.stopPropagation();
        mobileOfflineService.syncPendingActions();
        announceToScreenReader('Manual sync initiated', 'polite');
    };

    // Don't show on desktop unless specifically requested
    if (!isMobile && !showDetails) {
        return null;
    }

    const animationProps = prefersReducedMotion 
        ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
        : { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } };

    const bannerAnimationProps = prefersReducedMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : { 
            initial: { y: position === 'top' ? -100 : 100, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { y: position === 'top' ? -100 : 100, opacity: 0 }
        };

    return (
        <>
            {/* Persistent Status Indicator */}
            <output
                className={`fixed ${position === 'top' ? 'top-4' : 'bottom-4'} right-4 z-50 ${className}`}
                aria-label={`Connection status: ${getStatusText()}`}
            >
                <motion.div
                    {...animationProps}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--panel-border)] ${getStatusColor()}`}
                >
                    {getStatusIcon()}
                    <VisuallyHidden>
                        Connection status: {getStatusText()}
                        {offlineState.pendingActions.length > 0 && 
                            `, ${offlineState.pendingActions.length} actions pending sync`
                        }
                    </VisuallyHidden>
                    {showDetails && (
                        <span className="text-xs font-medium">
                            {getStatusText()}
                        </span>
                    )}
                </motion.div>
            </output>

            {/* Status Change Banner */}
            <AnimatePresence>
                {showBanner && (
                    <motion.div
                        {...bannerAnimationProps}
                        className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-40`}
                    >
                        <button
                            onClick={handleBannerClick}
                            onKeyDown={(e: any) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleBannerClick();
                                }
                            }}
                            disabled={!(!offlineState.isOffline && offlineState.pendingActions.length > 0)}
                            className={`mx-4 my-2 p-4 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] w-full text-left mobile-focus-ring ${
                                (!offlineState.isOffline && offlineState.pendingActions.length > 0) 
                                    ? 'cursor-pointer hover:bg-[var(--panel-bg-hover)] transition-colors' 
                                    : 'cursor-default'
                            }`}
                            aria-label={`Connection status: ${getBannerTitle()}. ${getStatusDescription()}. ${
                                (!offlineState.isOffline && offlineState.pendingActions.length > 0) 
                                    ? 'Press to sync pending changes.' 
                                    : ''
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${getStatusColor()}`}>
                                    {getStatusIcon()}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-[var(--text-primary)]">
                                            {getBannerTitle()}
                                        </h3>
                                        
                                        {!offlineState.isOffline && lastOnlineTime && (
                                            <CheckCircleIcon className="w-5 h-5 text-green-400" aria-hidden="true" />
                                        )}
                                    </div>
                                    
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                                        {getStatusDescription()}
                                    </p>
                                    
                                    {showDetails && (
                                        <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-[var(--text-secondary)]">
                                            <div>
                                                <span className="block font-medium">Last Sync</span>
                                                <span>{formatLastSync()}</span>
                                            </div>
                                            
                                            <div>
                                                <span className="block font-medium">Pending Actions</span>
                                                <span>{offlineState.pendingActions.length}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {(offlineState.pendingActions.length > 0 && !offlineState.isOffline) && (
                                    <button
                                        onClick={handleSyncNow}
                                        onKeyDown={(e: any) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleSyncNow(e as any);
                                            }
                                        }}
                                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors mobile-focus-ring"
                                        aria-label="Manually sync pending changes now"
                                    >
                                        Sync Now
                                    </button>
                                )}
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detailed Status Panel for Settings/Debug */}
            {showDetails && (
                <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-[var(--text-primary)] mb-3">Offline Status Details</h4>
                    
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">Connection Status:</span>
                            <span className={offlineState.isOffline ? 'text-red-400' : 'text-green-400'}>
                                {offlineState.isOffline ? 'Offline' : 'Online'}
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">Offline Data Available:</span>
                            <span className={offlineState.hasOfflineData ? 'text-green-400' : 'text-red-400'}>
                                {offlineState.hasOfflineData ? 'Yes' : 'No'}
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">Pending Actions:</span>
                            <span className={offlineState.pendingActions.length > 0 ? 'text-yellow-400' : 'text-green-400'}>
                                {offlineState.pendingActions.length}
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">Last Sync:</span>
                            <span className="text-[var(--text-primary)]">
                                {formatLastSync()}
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">Sync in Progress:</span>
                            <span className={offlineState.syncInProgress ? 'text-blue-400' : 'text-green-400'}>
                                {offlineState.syncInProgress ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                    
                    {offlineState.pendingActions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[var(--panel-border)]">
                            <h5 className="font-medium text-[var(--text-primary)] mb-2">Pending Actions:</h5>
                            <div className="space-y-1 text-xs">
                                {offlineState.pendingActions.map((action, index) => (
                                    <div key={action.id} className="flex justify-between text-[var(--text-secondary)]">
                                        <span>{action.type}</span>
                                        <span>Retry {action.retryCount}/{action.maxRetries}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default MobileOfflineIndicator;
