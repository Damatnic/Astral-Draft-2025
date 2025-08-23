"use client";

import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { trpc } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import NotificationCenter from './NotificationCenter';
import NotificationPreferences from './NotificationPreferences';

interface NotificationBellProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { user } = useAuth();
  const [showCenter, setShowCenter] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // Get unread count
  const {
    data: unreadCount,
    refetch: refetchUnreadCount,
  } = trpc.notification.getUnreadCount.useQuery(
    undefined,
    { 
      enabled: !!user,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Listen for real-time notifications
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    // WebSocket connection for real-time updates
    const connectWebSocket = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
      
      try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected for notifications');
          // Authenticate with the WebSocket
          ws.send(JSON.stringify({
            type: 'auth',
            token: localStorage.getItem('auth-token'),
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'notification') {
              // New notification received
              setHasNewNotification(true);
              refetchUnreadCount();
              
              // Show browser notification if permission granted
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(data.notification.title, {
                  body: data.notification.content,
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/badge-72x72.png',
                  tag: data.notification.id,
                });
              }
              
              // Auto-remove the new notification indicator after 5 seconds
              setTimeout(() => setHasNewNotification(false), 5000);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected, attempting to reconnect...');
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        return ws;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        return null;
      }
    };

    const ws = connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user, refetchUnreadCount]);

  // Request notification permission on first click
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  const handleBellClick = () => {
    requestNotificationPermission();
    setShowCenter(!showCenter);
    setHasNewNotification(false);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  const getContainerClasses = () => {
    const baseClasses = 'relative inline-flex items-center justify-center transition-all duration-200';
    const sizeClasses = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2';
    const hoverClasses = 'hover:bg-purple-500/20 hover:text-purple-300 rounded-lg';
    
    return `${baseClasses} ${sizeClasses} ${hoverClasses} ${className}`;
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleBellClick}
        className={getContainerClasses()}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        title={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        <div className="relative">
          {hasNewNotification ? (
            <BellRing 
              className={`${getSizeClasses()} text-purple-400 animate-pulse`} 
            />
          ) : (
            <Bell 
              className={`${getSizeClasses()} text-gray-300 hover:text-purple-300 transition-colors`} 
            />
          )}
          
          {/* Unread count badge */}
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-xs font-semibold text-white bg-red-500 rounded-full border-2 border-gray-900 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {/* New notification indicator */}
          {hasNewNotification && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 animate-ping"></span>
          )}
        </div>
        
        {showLabel && (
          <span className="ml-2 text-sm font-medium text-gray-300">
            Notifications
          </span>
        )}
      </button>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showCenter}
        onClose={() => setShowCenter(false)}
        onOpenPreferences={() => {
          setShowCenter(false);
          setShowPreferences(true);
        }}
      />

      {/* Notification Preferences */}
      <NotificationPreferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </>
  );
};

export default NotificationBell;