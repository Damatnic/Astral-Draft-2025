/**
 * PWA Hooks (Phase 11.5)
 * React hooks for PWA functionality including install prompts, offline detection, and push notifications
 */

import { useState, useEffect, useCallback } from 'react';

// Hook for PWA installation
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Install failed:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    canInstall,
    isInstalled,
    installApp
  };
};

// Hook for offline detection
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Trigger sync when coming back online
        if ('serviceWorker' in navigator && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            // Check if sync is supported
            if ('sync' in (registration as any)) {
              (registration as any).sync.register('background-sync');
            }
          });
        }
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};

// Hook for push notifications
export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      
      // Get existing subscription
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(setSubscription);
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from your server
      const response = await fetch('/api/notifications/vapid-key');
      const { publicKey } = await response.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
      });

      setSubscription(subscription);

      // Send subscription to your server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      return subscription;
    } catch (error) {
      console.error('Subscription failed:', error);
      return null;
    }
  }, [isSupported, permission]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Notify your server
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      return true;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    }
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe
  };
};

// Hook for service worker management
export const useServiceWorker = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setIsSupported(true);
      
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          setRegistration(reg);
          
          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              setIsInstalling(true);
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  setIsInstalling(false);
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_STATUS') {
          console.log('Cache status:', event.data.status);
        }
      });
    }
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    }
  }, [registration]);

  const cacheUrls = useCallback((urls: string[]) => {
    if (registration) {
      registration.active?.postMessage({
        type: 'CACHE_URLS',
        urls
      });
    }
  }, [registration]);

  const storeOfflineData = useCallback((key: string, data: any) => {
    if (registration) {
      registration.active?.postMessage({
        type: 'STORE_OFFLINE_DATA',
        key,
        data
      });
    }
  }, [registration]);

  return {
    isSupported,
    registration,
    updateAvailable,
    isInstalling,
    updateServiceWorker,
    cacheUrls,
    storeOfflineData
  };
};

// Hook for background sync
export const useBackgroundSync = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator;
    setIsSupported(supported);
  }, []);

  const registerSync = useCallback(async (tag: string, data?: any) => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Store data for sync if provided
      if (data) {
        registration.active?.postMessage({
          type: 'STORE_OFFLINE_DATA',
          key: tag,
          data
        });
      }
      
      if ('sync' in (registration as any)) {
        await (registration as any).sync.register(tag);
      }
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }, [isSupported]);

  const syncLineupChanges = useCallback((teamId: string, lineup: any) => {
    return registerSync('lineup-sync', { teamId, lineup, timestamp: Date.now() });
  }, [registerSync]);

  const syncWaiverClaim = useCallback((teamId: string, playerId: string, dropPlayerId?: string) => {
    return registerSync('waiver-sync', { 
      teamId, 
      playerId, 
      dropPlayerId, 
      timestamp: Date.now() 
    });
  }, [registerSync]);

  const syncTradeAction = useCallback((tradeId: string, action: string, data?: any) => {
    return registerSync('trade-sync', { 
      tradeId, 
      action, 
      data, 
      timestamp: Date.now() 
    });
  }, [registerSync]);

  return {
    isSupported,
    registerSync,
    syncLineupChanges,
    syncWaiverClaim,
    syncTradeAction
  };
};

// Hook for PWA shortcuts
export const usePWAShortcuts = () => {
  const [shortcuts, setShortcuts] = useState<any[]>([]);

  useEffect(() => {
    // Get manifest shortcuts
    fetch('/manifest.json')
      .then(response => response.json())
      .then(manifest => {
        if (manifest.shortcuts) {
          setShortcuts(manifest.shortcuts);
        }
      })
      .catch(error => {
        console.error('Failed to load manifest:', error);
      });
  }, []);

  const executeShortcut = useCallback((shortcutName: string) => {
    const shortcut = shortcuts.find(s => s.name === shortcutName);
    if (shortcut) {
      window.location.href = shortcut.url;
    }
  }, [shortcuts]);

  return {
    shortcuts,
    executeShortcut
  };
};

// Hook for share functionality
export const useWebShare = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('share' in navigator);
  }, []);

  const share = useCallback(async (data: ShareData) => {
    if (!isSupported) {
      // Fallback to clipboard
      if ('clipboard' in navigator) {
        const text = `${data.title}\n${data.text}\n${data.url}`;
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
      return false;
    }
  }, [isSupported]);

  const shareTeam = useCallback((teamName: string, teamId: string) => {
    return share({
      title: `Check out my ${teamName} team!`,
      text: `See my fantasy football team on Astral Draft`,
      url: `${window.location.origin}/team/${teamId}`
    });
  }, [share]);

  const shareLeague = useCallback((leagueName: string, leagueId: string) => {
    return share({
      title: `Join my ${leagueName} league!`,
      text: `Join our fantasy football league on Astral Draft`,
      url: `${window.location.origin}/league/${leagueId}`
    });
  }, [share]);

  const shareTrade = useCallback((tradeDetails: string, tradeId: string) => {
    return share({
      title: 'Fantasy Football Trade',
      text: `Check out this trade: ${tradeDetails}`,
      url: `${window.location.origin}/trades/${tradeId}`
    });
  }, [share]);

  return {
    isSupported,
    share,
    shareTeam,
    shareLeague,
    shareTrade
  };
};

// Utility function for VAPID key conversion
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Master PWA hook that combines all functionality
export const usePWA = () => {
  const install = usePWAInstall();
  const offline = useOfflineStatus();
  const notifications = usePushNotifications();
  const serviceWorker = useServiceWorker();
  const backgroundSync = useBackgroundSync();
  const shortcuts = usePWAShortcuts();
  const share = useWebShare();

  const isPWA = install.isInstalled || 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  return {
    isPWA,
    install,
    offline,
    notifications,
    serviceWorker,
    backgroundSync,
    shortcuts,
    share
  };
};

export default usePWA;