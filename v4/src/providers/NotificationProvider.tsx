"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast, ToastManager } from '@/components/notifications/NotificationToast';
import type { ToastNotification } from '@/components/notifications/NotificationToast';
import { trpc } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface NotificationContextType {
  // Toast notifications
  addToast: (toast: Omit<ToastNotification, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  toast: {
    success: (title: string, message: string, options?: Partial<ToastNotification>) => string;
    error: (title: string, message: string, options?: Partial<ToastNotification>) => string;
    warning: (title: string, message: string, options?: Partial<ToastNotification>) => string;
    info: (title: string, message: string, options?: Partial<ToastNotification>) => string;
    urgent: (title: string, message: string, options?: Partial<ToastNotification>) => string;
  };
  
  // Push notifications
  isSupported: boolean;
  isSubscribed: boolean;
  isPermissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  
  // Service worker
  registerServiceWorker: () => Promise<ServiceWorkerRegistration | null>;
  
  // WebSocket notifications
  isConnected: boolean;
  
  // Real-time notification count
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toasts, addToast, removeToast, clearAllToasts, toast } = useToast();
  
  // Push notification state
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  // WebSocket connection
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  // Queries
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = trpc.notification.getUnreadCount.useQuery(
    undefined,
    { 
      enabled: !!user,
      refetchInterval: 30000,
    }
  );

  // Mutations
  const subscribePushMutation = trpc.notification.subscribePush.useMutation();
  const unsubscribePushMutation = trpc.notification.unsubscribePush.useMutation();

  // Check push notification support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      
      if (supported) {
        setIsPermissionGranted(Notification.permission === 'granted');
      }
    }
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isSupported) {
      console.warn('Service workers are not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log('Service worker registered:', registration);
      setServiceWorkerRegistration(registration);

      // Check if already subscribed
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker installed, show update notification
              toast.info(
                'App Updated',
                'A new version is available. Refresh to update.',
                {
                  duration: 0,
                  action: {
                    label: 'Refresh',
                    onClick: () => window.location.reload(),
                  },
                }
              );
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }, [isSupported, toast]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications are not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setIsPermissionGranted(granted);
      
      if (!granted) {
        toast.warning(
          'Notifications Disabled',
          'Enable notifications in your browser settings to get real-time updates.'
        );
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, toast]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !isPermissionGranted) {
      return false;
    }

    try {
      let registration = serviceWorkerRegistration;
      
      if (!registration) {
        registration = await registerServiceWorker();
        if (!registration) return false;
      }

      // Get VAPID public key
      const response = await fetch('/api/notifications/vapid-key');
      const { publicKey } = await response.json();

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      // Send subscription to server
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

      setIsSubscribed(true);
      
      toast.success(
        'Notifications Enabled',
        'You will now receive push notifications for important updates.'
      );
      
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error(
        'Subscription Failed',
        'Failed to enable push notifications. Please try again.'
      );
      return false;
    }
  }, [
    isSupported,
    isPermissionGranted,
    serviceWorkerRegistration,
    registerServiceWorker,
    subscribePushMutation,
    toast,
  ]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    try {
      let registration = serviceWorkerRegistration;
      
      if (!registration) {
        registration = await navigator.serviceWorker.ready;
      }

      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribePushMutation.mutateAsync();
      }

      setIsSubscribed(false);
      
      toast.info(
        'Notifications Disabled',
        'You will no longer receive push notifications.'
      );
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error(
        'Unsubscribe Failed',
        'Failed to disable push notifications. Please try again.'
      );
      return false;
    }
  }, [isSupported, serviceWorkerRegistration, unsubscribePushMutation, toast]);

  // Connect to WebSocket for real-time notifications
  useEffect(() => {
    if (!user) {
      if (ws) {
        ws.close();
        setWs(null);
        setIsConnected(false);
      }
      return;
    }

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          console.log('WebSocket connected for notifications');
          setIsConnected(true);
          
          // Authenticate
          socket.send(JSON.stringify({
            type: 'auth',
            token: localStorage.getItem('auth-token'),
          }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'notification:new' && data.notification) {
              // Show toast notification
              const notification = data.notification;
              const toastType = getToastType(notification.category, notification.priority);
              
              toast[toastType](
                notification.title,
                notification.content,
                {
                  action: notification.data?.url ? {
                    label: 'View',
                    onClick: () => window.location.href = notification.data.url,
                  } : undefined,
                }
              );
              
              // Refetch unread count
              refetchUnreadCount();
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        socket.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

        setWs(socket);
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user, toast, refetchUnreadCount]);

  // Auto-register service worker on mount
  useEffect(() => {
    if (isSupported && user) {
      registerServiceWorker();
    }
  }, [isSupported, user, registerServiceWorker]);

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const getToastType = (category: string, priority: string): keyof typeof toast => {
    if (priority === 'URGENT') return 'urgent';
    if (category === 'SUCCESS') return 'success';
    if (category === 'WARNING') return 'warning';
    if (category === 'ERROR') return 'error';
    return 'info';
  };

  const value: NotificationContextType = {
    // Toast notifications
    addToast,
    removeToast,
    clearAllToasts,
    toast,
    
    // Push notifications
    isSupported,
    isSubscribed,
    isPermissionGranted,
    requestPermission,
    subscribe,
    unsubscribe,
    
    // Service worker
    registerServiceWorker,
    
    // WebSocket
    isConnected,
    
    // Unread count
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastManager toasts={toasts} onDismiss={removeToast} />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};