/**
 * Oracle Notification Center
 * In-app notification display and management
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Clock, Trophy, TrendingUp, Target } from 'lucide-react';
import { notificationService, OracleNotification } from '../../services/notificationService';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface NotificationCenterProps {
    className?: string;
    maxVisible?: number;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    className = '',
    maxVisible = 5
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [notifications, setNotifications] = useState<OracleNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [showToast, setShowToast] = useState<OracleNotification | null>(null);

    useEffect(() => {
        // Load existing notifications
        const existing = notificationService.getNotifications();
        setNotifications(existing);
        setUnreadCount(notificationService.getUnreadNotifications().length);

        // Listen for new notifications
        const unsubscribe = notificationService.onNotification((notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast for new notifications
            setShowToast(notification);
            setTimeout(() => setShowToast(null), 5000);
        });

        return unsubscribe;
    }, []);

    const handleMarkAsRead = (notificationId: string) => {
        notificationService.markAsRead(notificationId);
        setNotifications(prev => 
            prev.map((n: any) => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllAsRead = () => {
        notificationService.markAllAsRead();
        setNotifications(prev => prev.map((n: any) => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const handleClearAll = () => {
        notificationService.clearNotifications();
        setNotifications([]);
        setUnreadCount(0);
        setIsOpen(false);
    };

    const getNotificationIcon = (type: OracleNotification['type']) => {
        switch (type) {
            case 'deadline_warning':
                return <Clock className="w-4 h-4 text-yellow-400" />;
            case 'result_announced':
                return <Target className="w-4 h-4 text-blue-400" />;
            case 'accuracy_update':
                return <TrendingUp className="w-4 h-4 text-green-400" />;
            case 'streak_milestone':
                return <Trophy className="w-4 h-4 text-orange-400" />;
            case 'ranking_change':
                return <Trophy className="w-4 h-4 text-purple-400" />;
            default:
                return <Bell className="w-4 h-4 text-gray-400" />;
        }
    };

    const getPriorityColor = (priority: OracleNotification['priority']) => {
        switch (priority) {
            case 'high':
                return 'border-red-500 bg-red-500/10';
            case 'medium':
                return 'border-yellow-500 bg-yellow-500/10';
            case 'low':
                return 'border-gray-500 bg-gray-500/10';
            default:
                return 'border-gray-500 bg-gray-500/10';
        }
    };

    const formatTime = (timestamp: string) => {
        const now = Date.now();
        const time = new Date(timestamp).getTime();
        const diff = now - time;

        const minutes = Math.floor(diff / (60 * 1000));
        const hours = Math.floor(diff / (60 * 60 * 1000));
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const visibleNotifications = notifications.slice(0, maxVisible);

    return (
        <div className={`notification-center ${className}`}>
            {/* Notification Bell */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`relative p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        unreadCount > 0 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                    <Bell className="w-5 h-5" />
                    
                    {/* Unread Badge */}
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.div>
                    )}
                </button>

                {/* Notification Panel */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className={`absolute ${isMobile ? 'left-0' : 'right-0'} top-full mt-2 ${
                                isMobile ? 'w-80' : 'w-96'
                            } max-w-[90vw] bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                                <div className="flex items-center space-x-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-gray-400 hover:text-white transition-colors p-1"
                                        aria-label="Close notifications"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-96 overflow-y-auto">
                                {visibleNotifications.length > 0 ? (
                                    visibleNotifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                                                notification.isRead ? 'opacity-75' : ''
                                            } hover:bg-gray-800/50 transition-colors cursor-pointer`}
                                            onClick={() => {
                                                if (!notification.isRead) {
                                                    handleMarkAsRead(notification.id);
                                                }
                                                if (notification.actionUrl) {
                                                    window.location.href = notification.actionUrl;
                                                }
                                            }}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-sm font-medium text-white truncate">
                                                            {notification.title}
                                                        </p>
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-sm text-gray-300 break-words">
                                                        {notification.message}
                                                    </p>
                                                    
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatTime(notification.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-400">
                                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No notifications yet</p>
                                        <p className="text-sm mt-1">We'll notify you about prediction updates</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-4 border-t border-gray-700 flex justify-between items-center">
                                    {notifications.length > maxVisible && (
                                        <p className="text-xs text-gray-400">
                                            Showing {maxVisible} of {notifications.length} notifications
                                        </p>
                                    )}
                                    
                                    <button
                                        onClick={handleClearAll}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: isMobile ? 0 : 300 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: 50, x: isMobile ? 0 : 300 }}
                        className={`fixed ${isMobile ? 'bottom-4 left-4 right-4' : 'bottom-4 right-4 w-80'} z-50`}
                    >
                        <div className={`bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 border-l-4 ${getPriorityColor(showToast.priority)}`}>
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    {getNotificationIcon(showToast.type)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white mb-1">
                                        {showToast.title}
                                    </p>
                                    <p className="text-sm text-gray-300 break-words">
                                        {showToast.message}
                                    </p>
                                </div>
                                
                                <button
                                    onClick={() => setShowToast(null)}
                                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                                    aria-label="Dismiss notification"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
