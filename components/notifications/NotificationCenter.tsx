/**
 * Enhanced Notification Center
 * Comprehensive notification display and management interface with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../contexts/NotificationContext';
import { realtimeNotificationService, RealtimeNotification } from '../../services/realtimeNotificationService';
import { 
    BellIcon, 
    CheckIcon, 
    ArchiveIcon, 
    TrashIcon, 
    SettingsIcon,
    FilterIcon,
    CheckCheckIcon,
    Star,
    Trophy,
    Users,
    Zap,
    AlertCircle,
    Info
} from 'lucide-react';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
    isOpen, 
    onClose, 
    className = '' 
}) => {
    const {
        notifications,
        unreadCount,
        preferences,
        loading,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        refreshNotifications
    } = useNotifications();

    const [filter, setFilter] = useState<'all' | 'unread' | 'draft' | 'oracle' | 'league'>('all');
    const [showSettings, setShowSettings] = useState(false);

    // Refresh notifications when opened
    useEffect(() => {
        if (isOpen) {
            refreshNotifications();
        }
    }, [isOpen, refreshNotifications]);

    // Setup real-time notification listener
    useEffect(() => {
        const handleRealtimeNotification = (notification: any) => {
            // Trigger refresh to get new notifications
            refreshNotifications();
            
            // Show sound notification if enabled
            if (preferences?.enableSoundNotifications) {
                const audio = new Audio('/notification-sound.mp3');
                audio.play().catch(() => {}); // Ignore errors if sound file not found
            }
        };

        realtimeNotificationService.on('notification_received', handleRealtimeNotification);

        return () => {
            realtimeNotificationService.off('notification_received', handleRealtimeNotification);
        };
    }, [refreshNotifications, preferences]);

    const filteredNotifications = notifications.filter((notification: any) => {
        if (filter === 'unread') return !notification.isRead;
        if (filter === 'draft') return notification.category === 'draft';
        if (filter === 'oracle') return notification.category === 'oracle';
        if (filter === 'league') return notification.category === 'league';
        return true;
    });

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
            case 'urgent': return 'border-red-500 bg-red-500/10';
            case 'high': return 'border-orange-500 bg-orange-500/10';
            case 'medium': return 'border-blue-500 bg-blue-500/10';
            default: return 'border-gray-500 bg-gray-500/10';
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const getNoNotificationsMessage = (currentFilter: string) => {
        if (currentFilter === 'all') return 'No notifications yet.';
        return `No ${currentFilter} notifications yet.`;
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed top-0 right-0 h-full w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-50 flex flex-col ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                    <BellIcon className="text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h2>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Settings"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex space-x-2">
                    <FilterIcon className="w-4 h-4 text-gray-400 mt-1" />
                    <select
                        value={filter}
                        onChange={(e: any) => setFilter(e.target.value as any)}
                        className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
                    >
                        <option value="all">All</option>
                        <option value="unread">Unread</option>
                        <option value="draft">Draft</option>
                        <option value="oracle">Oracle</option>
                        <option value="league">League</option>
                    </select>
                </div>
                
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllAsRead(filter === 'all' ? undefined : filter)}
                        className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        title="Mark all as read"
                    >
                        <CheckCheckIcon className="w-4 h-4" />
                        <span>Mark all read</span>
                    </button>
                )}
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-b border-gray-700 overflow-hidden"
                    >
                        <NotificationSettings 
                            preferences={preferences}
                            onClose={() => setShowSettings(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
                {loading && (
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                        <span className="ml-2 text-gray-400">Loading notifications...</span>
                    </div>
                )}
                
                {!loading && filteredNotifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <BellIcon className="w-12 h-12 text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-400 mb-2">
                            No notifications
                        </h3>
                        <p className="text-gray-500">
                            {filter === 'unread' 
                                ? "You're all caught up!" 
                                : getNoNotificationsMessage(filter)
                            }
                        </p>
                    </div>
                )}
                
                {!loading && filteredNotifications.length > 0 && (
                    <div className="p-4 space-y-3">
                        <AnimatePresence>
                            {filteredNotifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={markAsRead}
                                    onArchive={archiveNotification}
                                    onDelete={deleteNotification}
                                    getIcon={getNotificationIcon}
                                    getPriorityColor={getPriorityColor}
                                    formatTimeAgo={formatTimeAgo}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Notification Item Component
interface NotificationItemProps {
    notification: any;
    onMarkAsRead: (id: string) => void;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
    getIcon: (type: string) => string;
    getPriorityColor: (priority: string) => string;
    formatTimeAgo: (date: Date) => string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkAsRead,
    onArchive,
    onDelete,
    getIcon,
    getPriorityColor,
    formatTimeAgo
}) => {
    const [showActions, setShowActions] = useState(false);

    const handleAction = (actionFn: () => void) => {
        actionFn();
        setShowActions(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`relative p-3 rounded-lg border ${getPriorityColor(notification.priority)} ${
                notification.isRead ? 'opacity-75' : ''
            } hover:bg-gray-800/50 transition-all group`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">
                    {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-semibold ${
                            notification.isRead ? 'text-gray-300' : 'text-white'
                        }`}>
                            {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTimeAgo(new Date(notification.createdAt))}
                        </span>
                    </div>
                    
                    <p className={`text-sm ${
                        notification.isRead ? 'text-gray-400' : 'text-gray-300'
                    } line-clamp-2`}>
                        {notification.message}
                    </p>
                    
                    {notification.actionUrl && (
                        <a
                            href={notification.actionUrl}
                            className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {notification.actionText || 'View Details'} →
                        </a>
                    )}
                </div>
                
                {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                )}
            </div>

            {/* Action Buttons */}
            <AnimatePresence>
                {showActions && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-2 right-2 flex space-x-1 bg-gray-800 rounded-lg p-1 shadow-lg"
                    >
                        {!notification.isRead && (
                            <button
                                onClick={() => handleAction(() => onMarkAsRead(notification.id))}
                                className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                                title="Mark as read"
                            >
                                <CheckIcon className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => handleAction(() => onArchive(notification.id))}
                            className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                            title="Archive"
                        >
                            <ArchiveIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleAction(() => onDelete(notification.id))}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Notification Settings Component
interface NotificationSettingsProps {
    preferences: any;
    onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ preferences, onClose }) => {
    const { updatePreferences } = useNotifications();
    const [localPreferences, setLocalPreferences] = useState(preferences || {});

    const handleToggle = (path: string, value: boolean) => {
        const keys = path.split('.');
        const updated = { ...localPreferences };
        let current = updated;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        
        setLocalPreferences(updated);
        updatePreferences(updated);
    };

    return (
        <div className="p-4 bg-gray-800/50">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Notification Settings</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white text-sm"
                >
                    Done
                </button>
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Push Notifications</span>
                    <input
                        type="checkbox"
                        checked={localPreferences?.enablePushNotifications || false}
                        onChange={(e: any) => handleToggle('enablePushNotifications', e.target.checked)}
                        className="accent-blue-500"
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Sound Notifications</span>
                    <input
                        type="checkbox"
                        checked={localPreferences?.enableSoundNotifications || false}
                        onChange={(e: any) => handleToggle('enableSoundNotifications', e.target.checked)}
                        className="accent-blue-500"
                    />
                </div>
                
                <hr className="border-gray-600" />
                
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Categories
                </div>
                
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Draft Alerts</span>
                    <input
                        type="checkbox"
                        checked={localPreferences?.categories?.draft?.enabled || false}
                        onChange={(e: any) => handleToggle('categories.draft.enabled', e.target.checked)}
                        className="accent-blue-500"
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Oracle Predictions</span>
                    <input
                        type="checkbox"
                        checked={localPreferences?.categories?.oracle?.enabled || false}
                        onChange={(e: any) => handleToggle('categories.oracle.enabled', e.target.checked)}
                        className="accent-blue-500"
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">League Updates</span>
                    <input
                        type="checkbox"
                        checked={localPreferences?.categories?.league?.enabled || false}
                        onChange={(e: any) => handleToggle('categories.league.enabled', e.target.checked)}
                        className="accent-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
