/**
 * Real-time Notification Service
 * Handles live updates and notifications for Oracle predictions
 */

import { io, Socket } from 'socket.io-client';

export interface RealtimeNotification {
  id: string;
  type: 'prediction' | 'result' | 'challenge' | 'achievement' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// Alias for internal use
type NotificationData = RealtimeNotification;

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPreferences {
  predictions: boolean;
  result: boolean;
  results: boolean;
  challenges: boolean;
  challenge: boolean;
  achievements: boolean;
  achievement: boolean;
  system: boolean;
  prediction: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  emailDigest: 'none' | 'daily' | 'weekly';
}

class RealtimeNotificationService {
  private static instance: RealtimeNotificationService;
  private socket: Socket | null = null;
  private notifications: NotificationData[] = [];
  private unreadCount: number = 0;
  private listeners: Set<(notification: NotificationData) => void> = new Set();
  private connectionRetries: number = 0;
  private maxRetries: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private userId: string | null = null;
  private preferences: NotificationPreferences = {
    predictions: true,
    result: true,
    results: true,
    challenge: true,
    challenges: true,
    achievement: true,
    achievements: true,
    prediction: true,
    system: true,
    soundEnabled: true,
    vibrationEnabled: true,
    emailDigest: 'daily'
  };
  private pushSubscriptions: Map<string, PushSubscription> = new Map();
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {
    // Check if we're in a browser environment before accessing localStorage
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      this.loadPreferences();
      this.loadNotificationHistory();
      this.initializeNotificationSystem();
    }
  }

  public static getInstance(): RealtimeNotificationService {
    if (!RealtimeNotificationService.instance) {
      RealtimeNotificationService.instance = new RealtimeNotificationService();
    }
    return RealtimeNotificationService.instance;
  }

  /**
   * Initialize notification system
   */
  private async initializeNotificationSystem(): Promise<void> {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Initialize service worker for push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        this.serviceWorkerRegistration = registration;
        await this.subscribeToPushNotifications();
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    }

    // Load push subscriptions
    this.loadPushSubscriptions();
  }

  /**
   * Connect to notification server
   */
  public connect(userId: string): void {
    if (this.socket?.connected) {
      console.log('Already connected to notification service');
      return;
    }

    this.userId = userId;
    
    // Get WebSocket URL from environment or use default
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
    
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxRetries,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        userId: this.userId
      }
    });

    this.setupSocketListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to notification service');
      this.isConnected = true;
      this.connectionRetries = 0;
      
      // Subscribe to user's notification channels
      this.socket?.emit('subscribe', {
        userId: this.userId,
        channels: ['predictions', 'results', 'challenges', 'achievements']
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification service');
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.socket.on('notification', (data: NotificationData) => {
      this.handleNotification(data);
    });

    this.socket.on('prediction:new', (data: any) => {
      this.handleNotification({
        id: `pred-${Date.now()}`,
        type: 'prediction',
        title: 'New Oracle Prediction',
        message: data.title || 'A new prediction is available!',
        timestamp: new Date(),
        priority: 'medium',
        actionUrl: `/oracle/prediction/${data.predictionId}`,
        metadata: data
      });
    });

    this.socket.on('prediction:resolved', (data: any) => {
      this.handleNotification({
        id: `result-${Date.now()}`,
        type: 'result',
        title: 'Prediction Resolved',
        message: `The Oracle prediction "${data.title}" has been resolved!`,
        timestamp: new Date(),
        priority: 'high',
        actionUrl: `/oracle/prediction/${data.predictionId}`,
        metadata: data
      });
    });

    this.socket.on('challenge:received', (data: any) => {
      this.handleNotification({
        id: `challenge-${Date.now()}`,
        type: 'challenge',
        title: 'Challenge Received!',
        message: `${data.challengerName} has challenged your prediction!`,
        timestamp: new Date(),
        priority: 'high',
        actionUrl: `/oracle/challenges`,
        metadata: data
      });
    });

    this.socket.on('achievement:unlocked', (data: any) => {
      this.handleNotification({
        id: `achievement-${Date.now()}`,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: data.achievementName || 'You\'ve earned a new achievement!',
        timestamp: new Date(),
        priority: 'medium',
        actionUrl: '/profile/achievements',
        metadata: data
      });
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(notification: NotificationData): void {
    // Check if notification type is enabled in preferences
    const typeKey = notification.type === 'prediction' ? 'predictions' : 
                   notification.type === 'result' ? 'results' :
                   notification.type === 'challenge' ? 'challenges' :
                   notification.type === 'achievement' ? 'achievements' :
                   'system';
    
    if (!this.preferences[typeKey as keyof NotificationPreferences]) {
      return;
    }

    // Add to notifications list
    this.notifications.unshift(notification);
    this.unreadCount++;
    
    // Limit stored notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Save to local storage
    this.saveNotificationHistory();

    // Notify listeners
    this.listeners.forEach(listener => listener(notification));

    // Show browser notification if permitted
    this.showBrowserNotification(notification);

    // Play sound if enabled
    if (this.preferences.soundEnabled) {
      this.playNotificationSound();
    }

    // Vibrate if enabled and supported
    if (this.preferences.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(notification: NotificationData): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/icons/oracle-icon-192.png',
      badge: '/icons/oracle-badge-72.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'high',
      data: {
        url: notification.actionUrl,
        notificationId: notification.id
      }
    };

    try {
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(
          notification.title,
          options
        );
      } else {
        new Notification(notification.title, options);
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    if (typeof window === 'undefined') return;

    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    } catch (error) {
      console.warn('Audio playback not supported:', error);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.connectionRetries >= this.maxRetries) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.connectionRetries), 30000);
    this.connectionRetries++;

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.connectionRetries}/${this.maxRetries})...`);
      if (this.userId) {
        this.connect(this.userId);
      }
    }, delay);
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPushNotifications(): Promise<void> {
    if (!this.serviceWorkerRegistration) return;

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        ) as BufferSource
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

  /**
   * Send push subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscriptionJSON): Promise<void> {
    if (!subscription.endpoint) return;

    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          subscription,
          userId: this.userId
        })
      });

      if (response.ok) {
        console.log('Push subscription sent to server');
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  /**
   * Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Get all notifications
   */
  public getNotifications(): NotificationData[] {
    return this.notifications;
  }

  /**
   * Get unread count
   */
  public getUnreadCount(): number {
    return this.unreadCount;
  }

  /**
   * Mark notification as read
   */
  public markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.saveNotificationHistory();
    }
  }

  /**
   * Mark all as read
   */
  public markAllAsRead(): void {
    this.unreadCount = 0;
    this.saveNotificationHistory();
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    this.notifications = [];
    this.unreadCount = 0;
    this.saveNotificationHistory();
  }

  /**
   * Add notification listener
   */
  public addListener(callback: (notification: NotificationData) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Alias for addListener (for compatibility)
   */
  public on(event: string, callback: (notification: NotificationData) => void): void {
    if (event === 'notification') {
      this.listeners.add(callback);
    }
  }

  /**
   * Remove notification listener (for compatibility)
   */
  public off(event: string, callback: (notification: NotificationData) => void): void {
    if (event === 'notification') {
      this.listeners.delete(callback);
    }
  }

  /**
   * Update preferences
   */
  public updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();
    
    // Update server preferences
    if (this.socket?.connected) {
      this.socket.emit('updatePreferences', {
        userId: this.userId,
        preferences: this.preferences
      });
    }
  }

  /**
   * Get preferences
   */
  public getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  /**
   * Load preferences from storage
   */
  private loadPreferences(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const stored = localStorage.getItem('notification_preferences');
    if (stored) {
      try {
        this.preferences = JSON.parse(stored);
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    }
  }

  /**
   * Save preferences to storage
   */
  private savePreferences(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  /**
   * Load notification history
   */
  private loadNotificationHistory(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const stored = localStorage.getItem('notification_history');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.notifications = data.notifications || [];
        this.unreadCount = data.unreadCount || 0;
      } catch (error) {
        console.error('Failed to load notification history:', error);
      }
    }
  }

  /**
   * Save notification history
   */
  private saveNotificationHistory(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      localStorage.setItem('notification_history', JSON.stringify({
        notifications: this.notifications.slice(0, 50), // Keep last 50
        unreadCount: this.unreadCount
      }));
    } catch (error) {
      console.error('Failed to save notification history:', error);
    }
  }

  /**
   * Load push subscriptions
   */
  private loadPushSubscriptions(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    // Load from storage - simplified for now
    const stored = localStorage.getItem('push_subscriptions');
    if (stored) {
      try {
        const subscriptions = JSON.parse(stored);
        Object.entries(subscriptions).forEach(([id, sub]) => {
          this.pushSubscriptions.set(id, sub as PushSubscription);
        });
      } catch (error) {
        console.error('Failed to load push subscriptions:', error);
      }
    }
  }

  /**
   * Save push subscriptions
   */
  private savePushSubscriptions(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const subscriptions: Record<string, PushSubscription> = {};
      this.pushSubscriptions.forEach((sub, id) => {
        subscriptions[id] = sub;
      });
      localStorage.setItem('push_subscriptions', JSON.stringify(subscriptions));
    } catch (error) {
      console.error('Failed to save push subscriptions:', error);
    }
  }

  /**
   * Send test notification
   */
  public sendTestNotification(): void {
    const testNotification: NotificationData = {
      id: `test-${Date.now()}`,
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification to verify your settings.',
      timestamp: new Date(),
      priority: 'low'
    };
    
    this.handleNotification(testNotification);
  }

  /**
   * Disconnect from notification service
   */
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.userId = null;
  }

  /**
   * Check connection status
   */
  public isConnectedToService(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status details
   */
  public getConnectionStatus(): {
    connected: boolean;
    retries: number;
    maxRetries: number;
  } {
    return {
      connected: this.isConnected,
      retries: this.connectionRetries,
      maxRetries: this.maxRetries
    };
  }
}

// Export singleton instance
export const realtimeNotificationService = RealtimeNotificationService.getInstance();

// Export types
export type { NotificationData, NotificationPreferences, PushSubscription };
