/**
 * Enhanced Notification Toast
 * Modern toast notification component with actions, animations, and real-time updates
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XIcon, EyeIcon } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

interface NotificationToastProps {
    notification: any;
    onDismiss: () => void;
    onMarkAsRead?: () => void;
    autoHideDuration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
    notification,
    onDismiss,
    onMarkAsRead,
    autoHideDuration = 5000
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300); // Wait for exit animation
        }, autoHideDuration);

        // Progress bar animation
        const progressTimer = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev - (100 / (autoHideDuration / 100));
                return newProgress <= 0 ? 0 : newProgress;
            });
        }, 100);

        return () => {
            clearTimeout(timer);
            clearInterval(progressTimer);
        };
    }, [autoHideDuration, onDismiss]);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'DRAFT_PICK': return '🏈';
            case 'DRAFT_START': return '🚀';
            case 'ORACLE_PREDICTION': return '🔮';
            case 'ORACLE_RESULT': return '🎯';
            case 'TRADE': return '🔄';
            case 'LEAGUE_UPDATE': return '📢';
            case 'ACHIEVEMENT': return '🏆';
            default: return '📱';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'border-red-500 bg-red-500/90';
            case 'high': return 'border-orange-500 bg-orange-500/90';
            case 'medium': return 'border-blue-500 bg-blue-500/90';
            default: return 'border-gray-500 bg-gray-500/90';
        }
    };

    const handleAction = (actionFn?: () => void) => {
        if (actionFn) actionFn();
        setIsVisible(false);
        setTimeout(onDismiss, 300);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 300, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 300, scale: 0.8 }}
                    className={`relative w-80 rounded-lg border-l-4 ${getPriorityColor(notification.priority)} 
                        bg-gray-900/95 backdrop-blur-sm shadow-xl overflow-hidden`}
                >
                    {/* Progress bar */}
                    <div className="absolute top-0 left-0 h-1 bg-white/20 transition-all duration-100 ease-linear"
                         style={{ width: `${progress}%` }} />
                    
                    <div className="p-4">
                        <div className="flex items-start space-x-3">
                            <div className="text-2xl flex-shrink-0">
                                {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-white mb-1">
                                    {notification.title}
                                </h4>
                                <p className="text-sm text-gray-300 line-clamp-2">
                                    {notification.message}
                                </p>
                                
                                {notification.actionUrl && (
                                    <a
                                        href={notification.actionUrl}
                                        onClick={() => handleAction()}
                                        className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        {notification.actionText || 'View Details'} →
                                    </a>
                                )}
                            </div>
                            
                            <div className="flex items-center space-x-1 flex-shrink-0">
                                {!notification.isRead && onMarkAsRead && (
                                    <button
                                        onClick={() => handleAction(onMarkAsRead)}
                                        className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                                        title="Mark as read"
                                    >
                                        <CheckIcon className="w-4 h-4" />
                                    </button>
                                )}
                                
                                {notification.actionUrl && (
                                    <button
                                        onClick={() => window.open(notification.actionUrl, '_blank')}
                                        className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                                        title="View details"
                                    >
                                        <EyeIcon className="w-4 h-4" />
                                    </button>
                                )}
                                
                                <button
                                    onClick={() => handleAction()}
                                    className="p-1 text-gray-400 hover:text-white transition-colors"
                                    title="Dismiss"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Toast Container Component
interface NotificationToastContainerProps {
    maxToasts?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
    maxToasts = 3,
    position = 'top-right'
}) => {
    const { notifications, markAsRead } = useNotifications();
    const [displayedToasts, setDisplayedToasts] = useState<string[]>([]);

    // Show newest unread notifications as toasts
    useEffect(() => {
        const unreadNotifications = notifications
            .filter((n: any) => !n.isRead && !displayedToasts.includes(n.id))
            .slice(0, maxToasts);

        if (unreadNotifications.length > 0) {
            const newToastIds = unreadNotifications.map((n: any) => n.id);
            setDisplayedToasts(prev => [...prev, ...newToastIds].slice(-maxToasts));
        }
    }, [notifications, displayedToasts, maxToasts]);

    const handleDismissToast = (notificationId: string) => {
        setDisplayedToasts(prev => prev.filter((id: any) => id !== notificationId));
    };

    const handleMarkAsRead = (notificationId: string) => {
        markAsRead(notificationId);
        handleDismissToast(notificationId);
    };

    const getPositionClasses = () => {
        switch (position) {
            case 'top-left': return 'top-4 left-4';
            case 'bottom-left': return 'bottom-4 left-4';
            case 'bottom-right': return 'bottom-4 right-4';
            default: return 'top-4 right-4';
        }
    };

    const toastsToShow = notifications.filter((n: any) => displayedToasts.includes(n.id));

    return (
        <div className={`fixed ${getPositionClasses()} z-50 space-y-3 pointer-events-none`}>
            <AnimatePresence>
                {toastsToShow.map((notification) => (
                    <div key={notification.id} className="pointer-events-auto">
                        <NotificationToast
                            notification={notification}
                            onDismiss={() => handleDismissToast(notification.id)}
                            onMarkAsRead={() => handleMarkAsRead(notification.id)}
                        />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default NotificationToast;
