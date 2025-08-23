import { useState, useEffect, useCallback } from 'react';
import { dataPersistenceService as dataPersistenceServicePromise, DraftSession, AnalyticsData, UserPreferences, OraclePredictionHistory, SyncStatus } from '../services/dataPersistenceService';
import { useAuth } from '../contexts/AuthContext';

export interface UseDataPersistenceOptions {
  autoSync?: boolean;
  syncInterval?: number;
}

export interface DataPersistenceHookState {
  isLoading: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus | null;
  error: string | null;
  isInitialized: boolean;
}

export function useDataPersistence(options: UseDataPersistenceOptions = {}) {
  const { user } = useAuth();
  const { autoSync = true, syncInterval = 30000 } = options;
  
  const [state, setState] = useState<DataPersistenceHookState>({
    isLoading: false,
    isOnline: navigator.onLine,
    syncStatus: null,
    error: null,
    isInitialized: false
  });

  const [dataPersistenceService, setDataPersistenceService] = useState<any>(null);

  // Initialize the service
  useEffect(() => {
    dataPersistenceServicePromise.then(service => {
      setDataPersistenceService(service);
      setState(prev => ({ ...prev, isInitialized: true }));
    }).catch(error => {
      console.error('Failed to initialize data persistence service:', error);
      setState(prev => ({ ...prev, error: 'Failed to initialize data persistence', isInitialized: false }));
    });
  }, []);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto sync status updates
  useEffect(() => {
    if (!autoSync || !dataPersistenceService) return;

    const updateSyncStatus = async () => {
      try {
        const status = await dataPersistenceService.getSyncStatus();
        setState(prev => ({ ...prev, syncStatus: status }));
      } catch (error) {
        console.error('Failed to get sync status:', error);
      }
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, dataPersistenceService]);

  // Draft Session Operations
  const saveDraftSession = useCallback(async (draftSession: DraftSession) => {
    if (!dataPersistenceService) {
      throw new Error('Data persistence service not initialized');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await dataPersistenceService.saveDraftSession(draftSession);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to save draft session' 
      }));
      throw error;
    }
  }, [dataPersistenceService]);

  const getDraftSession = useCallback(async (id: string): Promise<DraftSession | null> => {
    if (!dataPersistenceService) return null;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await dataPersistenceService.getDraftSession(id);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to get draft session' 
      }));
      return null;
    }
  }, [dataPersistenceService]);

  const getUserDraftSessions = useCallback(async (): Promise<DraftSession[]> => {
    if (!user || !dataPersistenceService) return [];
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await dataPersistenceService.getUserDraftSessions(user.id);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to get user draft sessions' 
      }));
      return [];
    }
  }, [user, dataPersistenceService]);

  // Analytics Operations
  const saveAnalyticsData = useCallback(async (analytics: AnalyticsData) => {
    if (!dataPersistenceService) {
      throw new Error('Data persistence service not initialized');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await dataPersistenceService.saveAnalyticsData(analytics);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to save analytics data' 
      }));
      throw error;
    }
  }, [dataPersistenceService]);

  const getAnalyticsData = useCallback(async (type?: string): Promise<AnalyticsData[]> => {
    if (!user || !dataPersistenceService) return [];
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await dataPersistenceService.getAnalyticsData(user.id, type);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to get analytics data' 
      }));
      return [];
    }
  }, [user, dataPersistenceService]);

  // User Preferences Operations
  const saveUserPreferences = useCallback(async (preferences: UserPreferences) => {
    if (!dataPersistenceService) {
      throw new Error('Data persistence service not initialized');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await dataPersistenceService.saveUserPreferences(preferences);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to save user preferences' 
      }));
      throw error;
    }
  }, [dataPersistenceService]);

  const getUserPreferences = useCallback(async (): Promise<UserPreferences | null> => {
    if (!user || !dataPersistenceService) return null;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await dataPersistenceService.getUserPreferences(user.id);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to get user preferences' 
      }));
      return null;
    }
  }, [user, dataPersistenceService]);

  // Oracle Predictions Operations
  const saveOraclePrediction = useCallback(async (prediction: OraclePredictionHistory) => {
    if (!dataPersistenceService) {
      throw new Error('Data persistence service not initialized');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await dataPersistenceService.saveOraclePrediction(prediction);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to save Oracle prediction' 
      }));
      throw error;
    }
  }, [dataPersistenceService]);

  const getOraclePredictions = useCallback(async (week?: number, season?: number): Promise<OraclePredictionHistory[]> => {
    if (!user || !dataPersistenceService) return [];
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await dataPersistenceService.getOraclePredictions(user.id, week, season);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to get Oracle predictions' 
      }));
      return [];
    }
  }, [user, dataPersistenceService]);

  // Cache Operations
  const cacheData = useCallback(async (key: string, data: any, ttl?: number) => {
    if (!dataPersistenceService) return;
    
    try {
      await dataPersistenceService.cacheData(key, data, ttl);
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }, [dataPersistenceService]);

  const getCachedData = useCallback(async <T>(key: string): Promise<T | null> => {
    if (!dataPersistenceService) return null;
    
    try {
      return await dataPersistenceService.getCachedData(key) as T | null;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }, [dataPersistenceService]);

  // Sync Operations
  const forceSync = useCallback(async () => {
    if (!dataPersistenceService) {
      throw new Error('Data persistence service not initialized');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await dataPersistenceService.forceSyncAll();
      const status = await dataPersistenceService.getSyncStatus();
      setState(prev => ({ ...prev, isLoading: false, syncStatus: status }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to sync data' 
      }));
      throw error;
    }
  }, [dataPersistenceService]);

  // Export/Import Operations
  const exportUserData = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    if (!dataPersistenceService) throw new Error('Data persistence service not initialized');
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await dataPersistenceService.exportUserData(user.id);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to export user data' 
      }));
      throw error;
    }
  }, [user, dataPersistenceService]);

  // Cleanup
  const cleanup = useCallback(async () => {
    if (!dataPersistenceService) return;
    
    try {
      await dataPersistenceService.cleanup();
    } catch (error) {
      console.error('Failed to cleanup data:', error);
    }
  }, [dataPersistenceService]);

  return {
    // State
    ...state,
    
    // Draft Sessions
    saveDraftSession,
    getDraftSession,
    getUserDraftSessions,
    
    // Analytics
    saveAnalyticsData,
    getAnalyticsData,
    
    // User Preferences
    saveUserPreferences,
    getUserPreferences,
    
    // Oracle Predictions
    saveOraclePrediction,
    getOraclePredictions,
    
    // Cache
    cacheData,
    getCachedData,
    
    // Sync
    forceSync,
    
    // Utilities
    exportUserData,
    cleanup
  };
}

export default useDataPersistence;
