"use client";

import React, { useState } from 'react';
import { trpc } from '@/lib/api';
import { useNotifications } from '@/providers/NotificationProvider';
import { 
  Bell, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff, 
  Check, 
  X, 
  Play,
  Settings,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react';

const NotificationSystemDemo: React.FC = () => {
  const {
    isSupported,
    isSubscribed,
    isPermissionGranted,
    isConnected,
    unreadCount,
    requestPermission,
    subscribe,
    unsubscribe,
    toast,
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);

  // Test notification mutation
  const testNotificationMutation = trpc.notification.createTestNotification.useMutation();

  const handlePermissionRequest = async () => {
    setIsLoading(true);
    const granted = await requestPermission();
    setIsLoading(false);
    
    if (granted) {
      toast.success('Permission Granted', 'You can now receive push notifications!');
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    const success = await subscribe();
    setIsLoading(false);
    
    if (!success) {
      toast.error('Subscription Failed', 'Could not enable push notifications');
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    const success = await unsubscribe();
    setIsLoading(false);
    
    if (!success) {
      toast.error('Unsubscribe Failed', 'Could not disable push notifications');
    }
  };

  const handleTestNotification = async (type: string) => {
    try {
      setIsLoading(true);
      await testNotificationMutation.mutateAsync({
        type,
        title: `Test ${type} Notification`,
        content: `This is a test ${type.toLowerCase()} notification to verify the system is working correctly.`,
      });
      
      toast.success('Test Sent', 'Test notification has been created!');
    } catch (error) {
      toast.error('Test Failed', 'Could not send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  const testToastNotifications = () => {
    toast.success('Success!', 'This is a success toast notification');
    
    setTimeout(() => {
      toast.info('Information', 'This is an info toast notification');
    }, 1000);
    
    setTimeout(() => {
      toast.warning('Warning', 'This is a warning toast notification');
    }, 2000);
    
    setTimeout(() => {
      toast.error('Error', 'This is an error toast notification that persists', { duration: 0 });
    }, 3000);
    
    setTimeout(() => {
      toast.urgent('Urgent!', 'This is an urgent notification with action', {
        action: {
          label: 'Take Action',
          onClick: () => alert('Action taken!'),
        },
      });
    }, 4000);
  };

  const getStatusIcon = (status: boolean, loading = false) => {
    if (loading) return <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />;
    return status ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />;
  };

  const getConnectionIcon = () => {
    return isConnected ? (
      <Wifi className="w-4 h-4 text-green-400" />
    ) : (
      <WifiOff className="w-4 h-4 text-red-400" />
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center space-x-2">
          <Bell className="w-8 h-8 text-purple-400" />
          <span>Notification System Demo</span>
        </h1>
        <p className="text-gray-400">
          Test and demonstrate the complete notification system including push notifications, 
          WebSocket real-time updates, and toast notifications.
        </p>
      </div>

      {/* System Status */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <Monitor className="w-5 h-5 text-blue-400" />
          <span>System Status</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-300">Browser Support</span>
            {getStatusIcon(isSupported)}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-300">Permission Granted</span>
            {getStatusIcon(isPermissionGranted, isLoading)}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-300">Push Subscribed</span>
            {getStatusIcon(isSubscribed, isLoading)}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-300">WebSocket Connected</span>
            {getConnectionIcon()}
          </div>
        </div>

        {unreadCount > 0 && (
          <div className="mt-4 p-3 bg-purple-900/30 border border-purple-500/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Push Notification Controls */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <Smartphone className="w-5 h-5 text-green-400" />
          <span>Push Notifications</span>
        </h2>
        
        <div className="space-y-4">
          {!isSupported && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-300">
                  Push notifications are not supported in this browser
                </span>
              </div>
            </div>
          )}
          
          {isSupported && !isPermissionGranted && (
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">
                Grant notification permission to receive push notifications.
              </p>
              <button
                onClick={handlePermissionRequest}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Request Permission
              </button>
            </div>
          )}
          
          {isSupported && isPermissionGranted && (
            <div className="space-y-2">
              {!isSubscribed ? (
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    Subscribe to receive push notifications from Astral Draft.
                  </p>
                  <button
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    Subscribe to Push Notifications
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-300">Subscribed to push notifications</span>
                  </div>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Unsubscribe
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Test Notifications */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <Play className="w-5 h-5 text-purple-400" />
          <span>Test Notifications</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Push Notification Tests */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-purple-300">Push Notifications</h3>
            <div className="space-y-2">
              {[
                { type: 'TRADE', label: 'Trade Offer', icon: '🔄' },
                { type: 'WAIVER', label: 'Waiver Update', icon: '⚡' },
                { type: 'DRAFT', label: 'Draft Reminder', icon: '🏆' },
                { type: 'MATCHUP', label: 'Matchup Alert', icon: '⚔️' },
                { type: 'SYSTEM', label: 'System Notice', icon: '📢' },
              ].map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => handleTestNotification(type)}
                  disabled={isLoading || !isSubscribed}
                  className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-white">{label}</span>
                  </div>
                  <Play className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Toast Notification Tests */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-purple-300">Toast Notifications</h3>
            <div className="space-y-2">
              <button
                onClick={testToastNotifications}
                className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🎭</span>
                  <span className="text-white">All Toast Types</span>
                </div>
                <Play className="w-4 h-4 text-gray-400" />
              </button>
              
              {[
                { type: 'success', label: 'Success Toast', icon: <CheckCircle className="w-4 h-4 text-green-400" /> },
                { type: 'info', label: 'Info Toast', icon: <Info className="w-4 h-4 text-blue-400" /> },
                { type: 'warning', label: 'Warning Toast', icon: <AlertTriangle className="w-4 h-4 text-yellow-400" /> },
                { type: 'error', label: 'Error Toast', icon: <XCircle className="w-4 h-4 text-red-400" /> },
                { type: 'urgent', label: 'Urgent Toast', icon: <Zap className="w-4 h-4 text-red-400" /> },
              ].map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => {
                    const toastType = type as keyof typeof toast;
                    toast[toastType](`${label} Title`, `This is a ${type} toast notification message.`);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {icon}
                    <span className="text-white">{label}</span>
                  </div>
                  <Play className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-400" />
          <span>Implementation Details</span>
        </h2>
        
        <div className="space-y-4 text-gray-300 text-sm">
          <div>
            <h3 className="font-medium text-white mb-2">Features Implemented:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Service Worker for push notifications and offline caching</li>
              <li>VAPID-based Web Push API integration</li>
              <li>Real-time WebSocket notifications</li>
              <li>In-app notification center with filtering and management</li>
              <li>Toast notifications with multiple types and actions</li>
              <li>Notification preferences with quiet hours and batching</li>
              <li>Push subscription management with device info tracking</li>
              <li>Notification utilities for common fantasy football events</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-white mb-2">Database Models:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>Notification</code> - Core notification data with categories and priorities</li>
              <li><code>NotificationSubscription</code> - Push subscription management</li>
              <li><code>NotificationPreference</code> - User notification settings</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-white mb-2">Integration Points:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>tRPC endpoints for all notification operations</li>
              <li>WebSocket events for real-time updates</li>
              <li>Service worker for push notifications and caching</li>
              <li>React context for notification state management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSystemDemo;