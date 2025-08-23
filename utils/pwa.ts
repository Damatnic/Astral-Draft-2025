/**
 * PWA Installation and Management Utilities
 * Handles app installation prompts, offline detection, and PWA features
 */

import React from 'react';
import { useAnnouncer } from './accessibility';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/**
 * Hook for managing PWA installation
 */
export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const { announce } = useAnnouncer();

  React.useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      announce('App can be installed for better experience', 'polite');
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setIsInstallable(false);
      announce('App successfully installed', 'assertive');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [announce]);

  const promptInstall = React.useCallback(async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        announce('Installing app...', 'assertive');
        return true;
      } else {
        announce('Installation cancelled', 'polite');
        return false;
      }
    } catch (error) {
      console.error('Error during installation:', error);
      announce('Installation failed', 'assertive');
      return false;
    } finally {
      setInstallPrompt(null);
      setIsInstallable(false);
    }
  }, [installPrompt, announce]);

  return {
    isInstallable,
    isInstalled,
    promptInstall
  };
};

/**
 * Hook for offline detection and management
 */
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [wasOffline, setWasOffline] = React.useState(false);
  const { announce } = useAnnouncer();

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        announce('Connection restored', 'assertive');
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      announce('You are now offline. Some features may be limited.', 'assertive');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, announce]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline
  };
};

/**
 * Hook for managing push notifications
 */
export const usePushNotifications = () => {
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = React.useState(false);
  const { announce } = useAnnouncer();

  React.useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = React.useCallback(async () => {
    if (!isSupported) {
      announce('Notifications not supported on this device', 'polite');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        announce('Notifications enabled', 'assertive');
        return true;
      } else {
        announce('Notifications denied', 'polite');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      announce('Failed to enable notifications', 'assertive');
      return false;
    }
  }, [isSupported, announce]);

  const showNotification = React.useCallback(async (
    title: string,
    options?: NotificationOptions
  ) => {
    if (permission !== 'granted') {
      return false;
    }

    try {
      // Use service worker to show notification
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'astral-draft',
          requireInteraction: false,
          ...options
        });
        return true;
      } else {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/favicon.svg',
          ...options
        });
        return true;
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, [permission]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    isEnabled: permission === 'granted'
  };
};

/**
 * PWA utility functions
 */
export const pwaUtils = {
  /**
   * Check if running as PWA
   */
  isPWA: (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  },

  /**
   * Get PWA platform
   */
  getPlatform: (): 'ios' | 'android' | 'desktop' | 'web' => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    } else if (pwaUtils.isPWA()) {
      return 'desktop';
    } else {
      return 'web';
    }
  },

  /**
   * Show iOS install instructions
   */
  showIOSInstallInstructions: (): string => {
    return 'To install this app on your iOS device, tap the share button and select "Add to Home Screen".';
  },

  /**
   * Show Android install instructions  
   */
  showAndroidInstallInstructions: (): string => {
    return 'To install this app on your Android device, tap the menu button and select "Add to Home Screen" or "Install App".';
  },

  /**
   * Register for updates
   */
  registerUpdateListener: (callback: () => void) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', callback);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', callback);
      };
    }
    return () => {};
  },

  /**
   * Force update service worker
   */
  updateServiceWorker: async (): Promise<boolean> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        return true;
      } catch (error) {
        console.error('Error updating service worker:', error);
        return false;
      }
    }
    return false;
  }
};

/**
 * Hook for managing PWA updates
 */
export const usePWAUpdates = () => {
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const { announce } = useAnnouncer();

  React.useEffect(() => {
    const handleUpdate = () => {
      setUpdateAvailable(true);
      announce('App update available', 'polite');
    };

    const cleanup = pwaUtils.registerUpdateListener(handleUpdate);
    return cleanup;
  }, [announce]);

  const applyUpdate = React.useCallback(async () => {
    setIsUpdating(true);
    announce('Updating app...', 'assertive');
    
    try {
      const success = await pwaUtils.updateServiceWorker();
      if (success) {
        announce('App updated successfully. Refreshing...', 'assertive');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        announce('Update failed', 'assertive');
        setIsUpdating(false);
      }
    } catch (error) {
      console.error('Error applying update:', error);
      announce('Update failed', 'assertive');
      setIsUpdating(false);
    }
  }, [announce]);

  return {
    updateAvailable,
    isUpdating,
    applyUpdate
  };
};

export default usePWAInstall;
