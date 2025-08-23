/**
 * Mobile Offline Manager
 * Handles offline functionality and data synchronization for mobile devices
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface OfflineData {
  id: string;
  type: 'prediction' | 'analytics' | 'draft-action' | 'user-preference';
  data: any;
  timestamp: number;
  retryCount?: number;
}

interface ConnectionStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface MobileOfflineManagerOptions {
  maxRetries?: number;
  retryDelay?: number;
  syncInterval?: number;
  enableBackgroundSync?: boolean;
}

export const useMobileOfflineManager = (options: MobileOfflineManagerOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 5000,
    syncInterval = 30000,
    enableBackgroundSync = true
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine
  });
  const [pendingData, setPendingData] = useState<OfflineData[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const dbRef = useRef<IDBDatabase | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize IndexedDB
  const initDB = useCallback(async () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('astral-draft-offline', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        dbRef.current = db;
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for different data types
        if (!db.objectStoreNames.contains('pending-predictions')) {
          const store = db.createObjectStore('pending-predictions', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('pending-analytics')) {
          const store = db.createObjectStore('pending-analytics', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('pending-draft-actions')) {
          const store = db.createObjectStore('pending-draft-actions', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('cached-data')) {
          const store = db.createObjectStore('cached-data', { keyPath: 'key' });
          store.createIndex('expiry', 'expiry');
        }
      };
    });
  }, []);

  // Monitor network connection
  const updateConnectionStatus = useCallback(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    const status: ConnectionStatus = {
      isOnline: navigator.onLine
    };
    
    if (connection) {
      status.connectionType = connection.type;
      status.effectiveType = connection.effectiveType;
      status.downlink = connection.downlink;
      status.rtt = connection.rtt;
    }
    
    setConnectionStatus(status);
  }, []);

  // Store data for offline sync
  const storeOfflineData = useCallback(async (type: OfflineData['type'], data: any): Promise<string> => {
    const db = dbRef.current;
    if (!db) throw new Error('Database not initialized');
    
    const offlineData: OfflineData = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    const transaction = db.transaction([`pending-${type}s`], 'readwrite');
    const store = transaction.objectStore(`pending-${type}s`);
    
    await new Promise((resolve, reject) => {
      const request = store.add(offlineData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    setPendingData(prev => [...prev, offlineData]);
    
    // Attempt immediate sync if online
    if (connectionStatus.isOnline) {
      syncData();
    }
    
    return offlineData.id;
  }, [connectionStatus.isOnline]);

  // Cache data for offline access
  const cacheData = useCallback(async (key: string, data: any, ttl: number = 3600000) => {
    const db = dbRef.current;
    if (!db) return;
    
    const cachedItem = {
      key,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    
    const transaction = db.transaction(['cached-data'], 'readwrite');
    const store = transaction.objectStore('cached-data');
    
    try {
      await new Promise((resolve, reject) => {
        const request = store.put(cachedItem);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }, []);

  // Retrieve cached data
  const getCachedData = useCallback(async <T = any>(key: string): Promise<T | null> => {
    const db = dbRef.current;
    if (!db) return null;
    
    const transaction = db.transaction(['cached-data'], 'readonly');
    const store = transaction.objectStore('cached-data');
    
    try {
      const cachedItem = await new Promise<any>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      if (!cachedItem) return null;
      
      // Check if data has expired
      if (Date.now() > cachedItem.expiry) {
        // Remove expired data
        const deleteTransaction = db.transaction(['cached-data'], 'readwrite');
        const deleteStore = deleteTransaction.objectStore('cached-data');
        deleteStore.delete(key);
        return null;
      }
      
      return cachedItem.data;
    } catch (error) {
      console.error('Failed to retrieve cached data:', error);
      return null;
    }
  }, []);

  // Sync pending data to server
  const syncData = useCallback(async () => {
    if (!connectionStatus.isOnline || syncStatus === 'syncing') return;
    
    setSyncStatus('syncing');
    
    try {
      const db = dbRef.current;
      if (!db) throw new Error('Database not initialized');
      
      const storeNames = ['pending-predictions', 'pending-analytics', 'pending-draft-actions'];
      const allPendingData: OfflineData[] = [];
      
      // Collect all pending data
      for (const storeName of storeNames) {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        const items = await new Promise<OfflineData[]>((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        allPendingData.push(...items);
      }
      
      // Sync each item
      const syncPromises = allPendingData.map(async (item) => {
        try {
          const endpoint = getSyncEndpoint(item.type);
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item.data)
          });
          
          if (response.ok) {
            // Remove successfully synced item
            const deleteTransaction = db.transaction([`pending-${item.type}s`], 'readwrite');
            const deleteStore = deleteTransaction.objectStore(`pending-${item.type}s`);
            deleteStore.delete(item.id);
            return { success: true, id: item.id };
          } else {
            throw new Error(`Sync failed: ${response.status}`);
          }
        } catch (error) {
          // Increment retry count
          item.retryCount = (item.retryCount || 0) + 1;
          
          if (item.retryCount >= maxRetries) {
            // Remove item after max retries
            const deleteTransaction = db.transaction([`pending-${item.type}s`], 'readwrite');
            const deleteStore = deleteTransaction.objectStore(`pending-${item.type}s`);
            deleteStore.delete(item.id);
            console.error(`Max retries exceeded for ${item.id}:`, error);
          } else {
            // Update retry count
            const updateTransaction = db.transaction([`pending-${item.type}s`], 'readwrite');
            const updateStore = updateTransaction.objectStore(`pending-${item.type}s`);
            updateStore.put(item);
          }
          
          return { success: false, id: item.id, error };
        }
      });
      
      await Promise.allSettled(syncPromises);
      
      // Update pending data state
      const remainingData = await getAllPendingData();
      setPendingData(remainingData);
      
      setSyncStatus('idle');
      setLastSyncTime(new Date());
      
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      
      // Schedule retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        if (connectionStatus.isOnline) {
          syncData();
        }
      }, retryDelay);
    }
  }, [connectionStatus.isOnline, syncStatus, maxRetries, retryDelay]);

  // Get sync endpoint for data type
  const getSyncEndpoint = (type: OfflineData['type']): string => {
    switch (type) {
      case 'prediction':
        return '/api/predictions';
      case 'analytics':
        return '/api/analytics/events';
      case 'draft-action':
        return '/api/draft/actions';
      case 'user-preference':
        return '/api/user/preferences';
      default:
        throw new Error(`Unknown data type: ${type}`);
    }
  };

  // Get all pending data from IndexedDB
  const getAllPendingData = useCallback(async (): Promise<OfflineData[]> => {
    const db = dbRef.current;
    if (!db) return [];
    
    const storeNames = ['pending-predictions', 'pending-analytics', 'pending-draft-actions'];
    const allData: OfflineData[] = [];
    
    for (const storeName of storeNames) {
      try {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        const items = await new Promise<OfflineData[]>((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        allData.push(...items);
      } catch (error) {
        console.error(`Failed to get data from ${storeName}:`, error);
      }
    }
    
    return allData;
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-mobile.js');
        console.log('Service worker registered:', registration);
        
        // Register for background sync if supported
        if (enableBackgroundSync && 'serviceWorker' in navigator) {
          try {
            // Background sync registration
            (registration as any).sync?.register('offline-sync');
          } catch (error) {
            console.log('Background sync not supported:', error);
          }
        }
        
        return registration;
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }, [enableBackgroundSync]);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        await registerServiceWorker();
        
        const pendingData = await getAllPendingData();
        setPendingData(pendingData);
        
        updateConnectionStatus();
      } catch (error) {
        console.error('Failed to initialize offline manager:', error);
      }
    };
    
    initialize();
  }, [initDB, registerServiceWorker, getAllPendingData, updateConnectionStatus]);

  // Set up network event listeners
  useEffect(() => {
    const handleOnline = () => {
      updateConnectionStatus();
      syncData(); // Sync when coming back online
    };
    
    const handleOffline = () => {
      updateConnectionStatus();
    };
    
    const handleConnectionChange = () => {
      updateConnectionStatus();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateConnectionStatus, syncData]);

  // Set up sync interval
  useEffect(() => {
    if (syncInterval > 0 && connectionStatus.isOnline) {
      syncIntervalRef.current = setInterval(() => {
        if (connectionStatus.isOnline && pendingData.length > 0) {
          syncData();
        }
      }, syncInterval);
    }
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [syncInterval, connectionStatus.isOnline, pendingData.length, syncData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  return {
    connectionStatus,
    pendingData,
    syncStatus,
    lastSyncTime,
    storeOfflineData,
    cacheData,
    getCachedData,
    syncData,
    isOfflineCapable: 'serviceWorker' in navigator && 'indexedDB' in window
  };
};

export default useMobileOfflineManager;
