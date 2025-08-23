/**
 * Enhanced Data Persistence Service
 * Provides comprehensive data storage and synchronization for Astral Draft
 * Supports local SQLite storage with cloud sync capabilities
 */

import { authService } from './authService';

export interface DraftSession {
  id: string;
  leagueId: string;
  userId: number;
  draftType: 'snake' | 'auction' | 'keeper';
  status: 'pending' | 'active' | 'completed' | 'abandoned';
  settings: {
    rounds: number;
    timePerPick: number;
    pickOrder: number[];
    budget?: number;
    keeperSlots?: number;
  };
  picks: DraftPick[];
  participants: DraftParticipant[];
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftPick {
  id: string;
  draftId: string;
  round: number;
  pick: number;
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  userId: number;
  cost?: number;
  timestamp: string;
}

export interface DraftParticipant {
  userId: number;
  username: string;
  pickOrder: number;
  budget?: number;
  roster: DraftPick[];
  isOnline: boolean;
}

export interface AnalyticsData {
  id: string;
  userId: number;
  type: 'draft_performance' | 'oracle_accuracy' | 'league_stats' | 'player_analysis';
  data: Record<string, any>;
  week?: number;
  season: number;
  createdAt: string;
}

export interface UserPreferences {
  userId: number;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    draftReminders: boolean;
    oraclePredictions: boolean;
    leagueUpdates: boolean;
    mobileOnly: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
    refreshInterval: number;
  };
  draft: {
    autoQueue: boolean;
    pickReminders: boolean;
    defaultSort: string;
    columns: string[];
  };
  oracle: {
    showConfidence: boolean;
    autoSubmit: boolean;
    defaultStake: number;
  };
  updatedAt: string;
}

export interface OraclePredictionHistory {
  id: string;
  userId: number;
  predictionId: string;
  question: string;
  userChoice: number;
  userConfidence: number;
  oracleChoice: number;
  oracleConfidence: number;
  actualOutcome?: number;
  points?: number;
  week: number;
  season: number;
  submittedAt: string;
  resolvedAt?: string;
}

export interface SyncStatus {
  lastSync: string;
  pendingChanges: number;
  conflicts: any[];
  isOnline: boolean;
}

class DataPersistenceService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private readonly syncQueue: any[] = [];
  private isOnline = navigator.onLine;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupOnlineListener();
  }

  /**
   * Initialize the service (call this after construction)
   */
  async initialize(): Promise<void> {
    try {
      await this.initializeDB();
    } catch (error) {
      console.error('Failed to initialize data persistence:', error);
      throw error;
    }
  }

  /**
   * Initialize IndexedDB for local storage
   */
  private async initializeDB(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AstralDraftDB', 1);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('✅ IndexedDB initialized successfully');
        this.startSyncInterval();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Draft Sessions store
        if (!db.objectStoreNames.contains('draftSessions')) {
          const draftStore = db.createObjectStore('draftSessions', { keyPath: 'id' });
          draftStore.createIndex('userId', 'userId', { unique: false });
          draftStore.createIndex('leagueId', 'leagueId', { unique: false });
          draftStore.createIndex('status', 'status', { unique: false });
        }

        // Analytics store
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
          analyticsStore.createIndex('userId', 'userId', { unique: false });
          analyticsStore.createIndex('type', 'type', { unique: false });
          analyticsStore.createIndex('season', 'season', { unique: false });
        }

        // User Preferences store
        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'userId' });
        }

        // Oracle Predictions store
        if (!db.objectStoreNames.contains('oraclePredictions')) {
          const oracleStore = db.createObjectStore('oraclePredictions', { keyPath: 'id' });
          oracleStore.createIndex('userId', 'userId', { unique: false });
          oracleStore.createIndex('week', 'week', { unique: false });
          oracleStore.createIndex('season', 'season', { unique: false });
        }

        // Sync Queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('priority', 'priority', { unique: false });
        }

        // Cache store
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }
      };
    });
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Start periodic sync interval
   */
  private startSyncInterval(): void {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.processSyncQueue();
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Generic store operation
   */
  private async performDBOperation<T>(
    storeName: string,
    operation: 'get' | 'put' | 'delete' | 'getAll' | 'index',
    data?: any,
    indexName?: string
  ): Promise<T> {
    if (!this.db) {
      await this.initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([storeName], operation === 'get' || operation === 'getAll' || operation === 'index' ? 'readonly' : 'readwrite');
      if (!transaction) {
        reject(new Error('Database not available'));
        return;
      }
      
      const store = transaction.objectStore(storeName);

      let request: IDBRequest;

      switch (operation) {
        case 'get':
          request = store.get(data);
          break;
        case 'put':
          request = store.put(data);
          break;
        case 'delete':
          request = store.delete(data);
          break;
        case 'getAll':
          request = store.getAll();
          break;
        case 'index': {
          if (!indexName) {
            reject(new Error('Index name required for index operation'));
            return;
          }
          const index = store.index(indexName);
          request = index.getAll(data);
          break;
        }
        default:
          reject(new Error(`Unknown operation: ${operation}`));
          return;
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save draft session
   */
  async saveDraftSession(draftSession: DraftSession): Promise<void> {
    try {
      draftSession.updatedAt = new Date().toISOString();
      await this.performDBOperation('draftSessions', 'put', draftSession);
      
      // Queue for sync if online
      if (this.isOnline) {
        this.queueForSync('draftSessions', 'put', draftSession);
      }
    } catch (error) {
      console.error('Failed to save draft session:', error);
      throw error;
    }
  }

  /**
   * Get draft session by ID
   */
  async getDraftSession(id: string): Promise<DraftSession | null> {
    try {
      const result = await this.performDBOperation<DraftSession>('draftSessions', 'get', id);
      return result || null;
    } catch (error) {
      console.error('Failed to get draft session:', error);
      return null;
    }
  }

  /**
   * Get all draft sessions for user
   */
  async getUserDraftSessions(userId: number): Promise<DraftSession[]> {
    try {
      const result = await this.performDBOperation<DraftSession[]>('draftSessions', 'index', userId, 'userId');
      return result || [];
    } catch (error) {
      console.error('Failed to get user draft sessions:', error);
      return [];
    }
  }

  /**
   * Save analytics data
   */
  async saveAnalyticsData(analytics: AnalyticsData): Promise<void> {
    try {
      analytics.createdAt = new Date().toISOString();
      await this.performDBOperation('analytics', 'put', analytics);
      
      if (this.isOnline) {
        this.queueForSync('analytics', 'put', analytics);
      }
    } catch (error) {
      console.error('Failed to save analytics data:', error);
      throw error;
    }
  }

  /**
   * Get analytics data by type
   */
  async getAnalyticsData(userId: number, type?: string): Promise<AnalyticsData[]> {
    try {
      let result: AnalyticsData[];
      
      if (type) {
        // Get all analytics and filter by type
        const allAnalytics = await this.performDBOperation<AnalyticsData[]>('analytics', 'index', userId, 'userId');
        result = allAnalytics.filter(item => item.type === type);
      } else {
        result = await this.performDBOperation<AnalyticsData[]>('analytics', 'index', userId, 'userId');
      }
      
      return result || [];
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      return [];
    }
  }

  /**
   * Save user preferences
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      preferences.updatedAt = new Date().toISOString();
      await this.performDBOperation('userPreferences', 'put', preferences);
      
      if (this.isOnline) {
        this.queueForSync('userPreferences', 'put', preferences);
      }
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: number): Promise<UserPreferences | null> {
    try {
      const result = await this.performDBOperation<UserPreferences>('userPreferences', 'get', userId);
      return result || this.getDefaultPreferences(userId);
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(userId: number): UserPreferences {
    return {
      userId,
      theme: 'auto',
      notifications: {
        draftReminders: true,
        oraclePredictions: true,
        leagueUpdates: true,
        mobileOnly: false
      },
      dashboard: {
        layout: 'grid',
        widgets: ['oracle', 'leagues', 'analytics', 'draft'],
        refreshInterval: 300000 // 5 minutes
      },
      draft: {
        autoQueue: false,
        pickReminders: true,
        defaultSort: 'rank',
        columns: ['name', 'position', 'team', 'rank', 'projected']
      },
      oracle: {
        showConfidence: true,
        autoSubmit: false,
        defaultStake: 5
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Save Oracle prediction
   */
  async saveOraclePrediction(prediction: OraclePredictionHistory): Promise<void> {
    try {
      await this.performDBOperation('oraclePredictions', 'put', prediction);
      
      if (this.isOnline) {
        this.queueForSync('oraclePredictions', 'put', prediction);
      }
    } catch (error) {
      console.error('Failed to save Oracle prediction:', error);
      throw error;
    }
  }

  /**
   * Get Oracle predictions for user
   */
  async getOraclePredictions(userId: number, week?: number, season?: number): Promise<OraclePredictionHistory[]> {
    try {
      let result = await this.performDBOperation<OraclePredictionHistory[]>('oraclePredictions', 'index', userId, 'userId');
      
      if (week !== undefined) {
        result = result.filter(p => p.week === week);
      }
      
      if (season !== undefined) {
        result = result.filter(p => p.season === season);
      }
      
      return result || [];
    } catch (error) {
      console.error('Failed to get Oracle predictions:', error);
      return [];
    }
  }

  /**
   * Queue data for cloud sync
   */
  private async queueForSync(table: string, operation: string, data: any): Promise<void> {
    const syncItem = {
      table,
      operation,
      data,
      timestamp: new Date().toISOString(),
      priority: this.getSyncPriority(table),
      retries: 0
    };

    this.syncQueue.push(syncItem);
    await this.performDBOperation('syncQueue', 'put', syncItem);
  }

  /**
   * Get sync priority for table
   */
  private getSyncPriority(table: string): number {
    const priorities: Record<string, number> = {
      'userPreferences': 1,
      'oraclePredictions': 2,
      'draftSessions': 3,
      'analytics': 4
    };
    return priorities[table] || 5;
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const sessionToken = authService.getSessionToken();
    if (!sessionToken) return;

    // Sort by priority and timestamp
    this.syncQueue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    const itemsToSync = this.syncQueue.splice(0, 10); // Process 10 items at a time

    for (const item of itemsToSync) {
      try {
        await this.syncToCloud(item, sessionToken);
        // Remove from IndexedDB sync queue
        await this.performDBOperation('syncQueue', 'delete', item.id);
      } catch (error) {
        console.error('Sync failed for item:', item, error);
        item.retries += 1;
        
        // Retry up to 3 times
        if (item.retries < 3) {
          this.syncQueue.push(item);
        } else {
          console.error('Max retries reached for sync item:', item);
          await this.performDBOperation('syncQueue', 'delete', item.id);
        }
      }
    }
  }

  /**
   * Sync item to cloud
   */
  private async syncToCloud(item: any, sessionToken: string): Promise<void> {
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';
    
    const response = await fetch(`${baseUrl}/api/sync/${item.table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        operation: item.operation,
        data: item.data
      })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  /**
   * Cache data with expiry
   */
  async cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
    const cacheItem = {
      key,
      data,
      expiry: new Date(Date.now() + ttl).toISOString()
    };

    await this.performDBOperation('cache', 'put', cacheItem);
  }

  /**
   * Get cached data
   */
  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cacheItem = await this.performDBOperation<any>('cache', 'get', key);
      
      if (!cacheItem) return null;
      
      // Check if expired
      if (new Date(cacheItem.expiry) < new Date()) {
        await this.performDBOperation('cache', 'delete', key);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const allCache = await this.performDBOperation<any[]>('cache', 'getAll');
      const now = new Date();
      
      for (const item of allCache) {
        if (new Date(item.expiry) < now) {
          await this.performDBOperation('cache', 'delete', item.key);
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  /**
   * Export user data
   */
  async exportUserData(userId: number): Promise<any> {
    try {
      const [draftSessions, analytics, preferences, oraclePredictions] = await Promise.all([
        this.getUserDraftSessions(userId),
        this.getAnalyticsData(userId),
        this.getUserPreferences(userId),
        this.getOraclePredictions(userId)
      ]);

      return {
        exportedAt: new Date().toISOString(),
        userId,
        data: {
          draftSessions,
          analytics,
          preferences,
          oraclePredictions
        }
      };
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingChanges = this.syncQueue.length;
    const queuedItems = await this.performDBOperation<any[]>('syncQueue', 'getAll');
    
    // Detect conflicts by checking for items with multiple retry attempts
    const conflicts = queuedItems.filter(item => item.retries > 0);
    
    return {
      lastSync: localStorage.getItem('lastSyncTime') || 'Never',
      pendingChanges: pendingChanges + queuedItems.length,
      conflicts: conflicts.map(item => ({
        table: item.table,
        operation: item.operation,
        retries: item.retries,
        data: item.data
      })),
      isOnline: this.isOnline
    };
  }

  /**
   * Force sync all data
   */
  async forceSyncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    // Load all queued items
    const queuedItems = await this.performDBOperation<any[]>('syncQueue', 'getAll');
    this.syncQueue.push(...queuedItems);
    
    await this.processSyncQueue();
    
    localStorage.setItem('lastSyncTime', new Date().toISOString());
  }

  /**
   * Cleanup old data
   */
  async cleanup(): Promise<void> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const cutoffDate = oneMonthAgo.toISOString();

    try {
      // Clean up old analytics data
      const allAnalytics = await this.performDBOperation<AnalyticsData[]>('analytics', 'getAll');
      for (const item of allAnalytics) {
        if (item.createdAt < cutoffDate) {
          await this.performDBOperation('analytics', 'delete', item.id);
        }
      }

      // Clear expired cache
      await this.clearExpiredCache();
      
      console.log('✅ Data cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup data:', error);
    }
  }

  /**
   * Destroy service and cleanup
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.db) {
      this.db.close();
    }
  }
}

// Create and initialize the service instance
const createDataPersistenceService = async (): Promise<DataPersistenceService> => {
  const service = new DataPersistenceService();
  await service.initialize();
  return service;
};

// Export a promise that resolves to the initialized service
export const dataPersistenceService = createDataPersistenceService().catch(error => {
  console.error('Failed to create data persistence service:', error);
  // Return a fallback service that logs errors
  return new DataPersistenceService();
});

export default dataPersistenceService;
