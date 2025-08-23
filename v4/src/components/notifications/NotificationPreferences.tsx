"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Bell, Mail, Volume2, Vibrate, Clock, Smartphone, Monitor, Send } from 'lucide-react';
import { trpc } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PreferencesData {
  enablePush: boolean;
  enableEmail: boolean;
  enableSound: boolean;
  enableVibration: boolean;
  tradeNotifications: boolean;
  waiverNotifications: boolean;
  draftNotifications: boolean;
  matchupNotifications: boolean;
  systemNotifications: boolean;
  messageNotifications: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
  batchNotifications: boolean;
  batchInterval: number;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<PreferencesData>({
    enablePush: true,
    enableEmail: true,
    enableSound: true,
    enableVibration: true,
    tradeNotifications: true,
    waiverNotifications: true,
    draftNotifications: true,
    matchupNotifications: true,
    systemNotifications: true,
    messageNotifications: true,
    timezone: 'UTC',
    batchNotifications: false,
    batchInterval: 60,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPushSupported('serviceWorker' in navigator && 'PushManager' in window);
    }
  }, []);

  // Load user preferences
  const { data: userPreferences, refetch } = trpc.notification.getPreferences.useQuery(
    undefined,
    { enabled: isOpen && !!user }
  );

  // Mutations
  const updatePreferencesMutation = trpc.notification.updatePreferences.useMutation({
    onSuccess: () => {
      setHasChanges(false);
      refetch();
    },
  });

  const subscribePushMutation = trpc.notification.subscribePush.useMutation({
    onSuccess: () => {
      setPushSubscribed(true);
    },
  });

  const unsubscribePushMutation = trpc.notification.unsubscribePush.useMutation({
    onSuccess: () => {
      setPushSubscribed(false);
    },
  });

  const testNotificationMutation = trpc.notification.createTestNotification.useMutation();

  // Load preferences when data arrives
  useEffect(() => {
    if (userPreferences) {
      setPreferences({
        enablePush: userPreferences.enablePush,
        enableEmail: userPreferences.enableEmail,
        enableSound: userPreferences.enableSound,
        enableVibration: userPreferences.enableVibration,
        tradeNotifications: userPreferences.tradeNotifications,
        waiverNotifications: userPreferences.waiverNotifications,
        draftNotifications: userPreferences.draftNotifications,
        matchupNotifications: userPreferences.matchupNotifications,
        systemNotifications: userPreferences.systemNotifications,
        messageNotifications: userPreferences.messageNotifications,
        quietHoursStart: userPreferences.quietHoursStart || undefined,
        quietHoursEnd: userPreferences.quietHoursEnd || undefined,
        timezone: userPreferences.timezone,
        batchNotifications: userPreferences.batchNotifications,
        batchInterval: userPreferences.batchInterval,
      });
      setHasChanges(false);
    }
  }, [userPreferences]);

  const handlePreferenceChange = (key: keyof PreferencesData, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updatePreferencesMutation.mutateAsync(preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handlePushToggle = async () => {
    if (!pushSupported) {
      alert('Push notifications are not supported in this browser');
      return;
    }

    try {
      if (preferences.enablePush && !pushSubscribed) {
        // Subscribe to push notifications
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          
          // Get VAPID public key from server
          const vapidResponse = await fetch('/api/notifications/vapid-key');
          const { publicKey } = await vapidResponse.json();
          
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey,
          });
          
          await subscribePushMutation.mutateAsync({
            subscription: {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.toJSON().keys?.p256dh || '',
                auth: subscription.toJSON().keys?.auth || '',
              },
            },
            deviceInfo: {
              userAgent: navigator.userAgent,
              deviceType: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
              browser: getBrowserName(),
            },
          });
        } else {
          handlePreferenceChange('enablePush', false);
          alert('Push notification permission denied');
        }
      } else if (!preferences.enablePush && pushSubscribed) {
        // Unsubscribe from push notifications
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          await unsubscribePushMutation.mutateAsync();
        }
      }
    } catch (error) {
      console.error('Error handling push subscription:', error);
      alert('Failed to update push notification settings');
    }
  };

  const handleTestNotification = async () => {
    try {
      await testNotificationMutation.mutateAsync({
        type: 'TEST',
        title: 'Test Notification',
        content: 'This is a test notification from Astral Draft!',
      });
      
      alert('Test notification sent! Check your notifications.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
    }
  };

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const getTimezones = () => {
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Australia/Sydney',
    ];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Preferences panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-gray-900 border-l border-purple-500/30 shadow-2xl overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-6">
            {/* Delivery Methods */}
            <section>
              <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center">
                <Smartphone className="w-4 h-4 mr-2" />
                Delivery Methods
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <div>
                      <label className="text-sm font-medium text-white">Push Notifications</label>
                      <p className="text-xs text-gray-400">Browser notifications</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={preferences.enablePush}
                      onChange={(e) => {
                        handlePreferenceChange('enablePush', e.target.checked);
                        if (e.target.checked !== pushSubscribed) {
                          handlePushToggle();
                        }
                      }}
                      disabled={!pushSupported}
                      className="w-4 h-4 text-purple-500 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <div>
                      <label className="text-sm font-medium text-white">Email Notifications</label>
                      <p className="text-xs text-gray-400">Email delivery</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.enableEmail}
                    onChange={(e) => handlePreferenceChange('enableEmail', e.target.checked)}
                    className="w-4 h-4 text-blue-500 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-4 h-4 text-green-400" />
                    <div>
                      <label className="text-sm font-medium text-white">Sound</label>
                      <p className="text-xs text-gray-400">Play notification sounds</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.enableSound}
                    onChange={(e) => handlePreferenceChange('enableSound', e.target.checked)}
                    className="w-4 h-4 text-green-500 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Vibrate className="w-4 h-4 text-orange-400" />
                    <div>
                      <label className="text-sm font-medium text-white">Vibration</label>
                      <p className="text-xs text-gray-400">Vibrate on mobile devices</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.enableVibration}
                    onChange={(e) => handlePreferenceChange('enableVibration', e.target.checked)}
                    className="w-4 h-4 text-orange-500 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                </div>
              </div>
            </section>

            {/* Notification Types */}
            <section>
              <h3 className="text-sm font-semibold text-purple-300 mb-3">Notification Types</h3>
              <div className="space-y-2">
                {[
                  { key: 'tradeNotifications', label: 'Trade Offers & Updates', icon: '🔄' },
                  { key: 'waiverNotifications', label: 'Waiver Wire Activity', icon: '⚡' },
                  { key: 'draftNotifications', label: 'Draft Reminders', icon: '🏆' },
                  { key: 'matchupNotifications', label: 'Matchup Updates', icon: '⚔️' },
                  { key: 'messageNotifications', label: 'League Messages', icon: '💬' },
                  { key: 'systemNotifications', label: 'System Announcements', icon: '📢' },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center justify-between p-2 hover:bg-gray-800/30 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{icon}</span>
                      <label className="text-sm text-white">{label}</label>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences[key as keyof PreferencesData] as boolean}
                      onChange={(e) => handlePreferenceChange(key as keyof PreferencesData, e.target.checked)}
                      className="w-4 h-4 text-purple-500 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Quiet Hours */}
            <section>
              <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Quiet Hours
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={preferences.quietHoursStart || ''}
                      onChange={(e) => handlePreferenceChange('quietHoursStart', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">End Time</label>
                    <input
                      type="time"
                      value={preferences.quietHoursEnd || ''}
                      onChange={(e) => handlePreferenceChange('quietHoursEnd', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Timezone</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                  >
                    {getTimezones().map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Batching */}
            <section>
              <h3 className="text-sm font-semibold text-purple-300 mb-3">Notification Batching</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div>
                    <label className="text-sm font-medium text-white">Batch Notifications</label>
                    <p className="text-xs text-gray-400">Group similar notifications together</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.batchNotifications}
                    onChange={(e) => handlePreferenceChange('batchNotifications', e.target.checked)}
                    className="w-4 h-4 text-purple-500 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                </div>
                
                {preferences.batchNotifications && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Batch Interval (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      step="5"
                      value={preferences.batchInterval}
                      onChange={(e) => handlePreferenceChange('batchInterval', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Test Notification */}
            <section>
              <button
                onClick={handleTestNotification}
                disabled={testNotificationMutation.isPending}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Send Test Notification</span>
              </button>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-purple-500/20 bg-gray-800/50">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || updatePreferencesMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;