"use client";

import React, { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings, 
  Filter,
  ChevronDown,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Zap,
  Users,
  Trophy,
  MessageSquare,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  iconType?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  data?: any;
  action?: {
    label: string;
    url: string;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreferences: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onOpenPreferences,
}) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'trade' | 'waiver' | 'league' | 'system'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Queries
  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = trpc.notification.getMyNotifications.useQuery(
    { filter },
    { enabled: isOpen && !!user }
  );

  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery(
    undefined,
    { enabled: !!user, refetchInterval: 30000 }
  );

  // Mutations
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteNotificationMutation = trpc.notification.deleteNotification.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action?.url) {
      window.location.href = notification.action.url;
      onClose();
    }
  };

  const getNotificationIcon = (notification: any) => {
    const iconClass = `w-5 h-5 ${getIconColor(notification)}`;
    
    switch (notification.type) {
      case 'TRADE':
        return <TrendingUp className={iconClass} />;
      case 'WAIVER':
        return <Users className={iconClass} />;
      case 'DRAFT':
        return <Trophy className={iconClass} />;
      case 'MATCHUP':
        return <Zap className={iconClass} />;
      case 'MESSAGE':
        return <MessageSquare className={iconClass} />;
      case 'SYSTEM':
        return <Settings className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getIconColor = (notification: any) => {
    if (notification.priority === 'URGENT') return 'text-red-400';
    if (notification.priority === 'HIGH') return 'text-orange-400';
    if (notification.category === 'SUCCESS') return 'text-green-400';
    if (notification.category === 'WARNING') return 'text-yellow-400';
    if (notification.category === 'ERROR') return 'text-red-400';
    return 'text-blue-400';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'URGENT':
        return <Zap className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getFilterLabel = (filterType: string) => {
    switch (filterType) {
      case 'all': return 'All';
      case 'unread': return 'Unread';
      case 'trade': return 'Trades';
      case 'waiver': return 'Waivers';
      case 'league': return 'League';
      case 'system': return 'System';
      default: return 'All';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Notification panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-purple-500/30 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              {unreadCount && unreadCount > 0 && (
                <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenPreferences}
                className="p-2 text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors"
                title="Notification preferences"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters and actions */}
          <div className="flex items-center justify-between p-3 border-b border-purple-500/20">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">{getFilterLabel(filter)}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showFilters && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-gray-800 border border-purple-500/30 rounded-lg shadow-xl z-10">
                  {['all', 'unread', 'trade', 'waiver', 'league', 'system'].map((filterType) => (
                    <button
                      key={filterType}
                      onClick={() => {
                        setFilter(filterType as any);
                        setShowFilters(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                        filter === filterType
                          ? 'bg-purple-500/30 text-purple-300'
                          : 'text-gray-300 hover:bg-purple-500/20 hover:text-white'
                      }`}
                    >
                      {getFilterLabel(filterType)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending || !notificationsData?.notifications?.some(n => !n.isRead)}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-300 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          </div>

          {/* Notifications list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              </div>
            ) : !notificationsData?.notifications?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <Bell className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {notificationsData.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`group relative p-3 rounded-lg border cursor-pointer transition-all hover:bg-purple-500/10 ${
                      notification.isRead
                        ? 'bg-gray-800/50 border-gray-700 opacity-75'
                        : 'bg-purple-900/20 border-purple-500/30 shadow-lg'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${
                              notification.isRead ? 'text-gray-300' : 'text-white'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className={`text-sm mt-1 ${
                              notification.isRead ? 'text-gray-400' : 'text-gray-300'
                            }`}>
                              {notification.message || ''}
                            </p>
                          </div>

                          {/* Category indicator */}
                          <div className="flex-shrink-0 ml-2">
                            {getCategoryIcon(notification.type || 'INFO')}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>

                          {notification.action && (
                            <span className="text-xs text-purple-400 hover:text-purple-300">
                              {notification.action.label} →
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center space-x-1">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-green-400 hover:bg-green-500/20 rounded transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-purple-400 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificationsData?.hasMore && (
            <div className="p-3 border-t border-purple-500/20">
              <button className="w-full py-2 text-sm text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors">
                Load more notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;