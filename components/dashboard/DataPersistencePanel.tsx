import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Download, Upload, Database, Clock, Wifi, WifiOff } from 'lucide-react';
import useDataPersistence from '../../hooks/useDataPersistence';
import { useAuth } from '../../contexts/AuthContext';

const DataPersistencePanel: React.FC = () => {
  const { user } = useAuth();
  const {
    isLoading,
    isOnline,
    syncStatus,
    error,
    isInitialized,
    forceSync,
    exportUserData,
    cleanup,
    getUserPreferences,
    saveUserPreferences
  } = useDataPersistence();

  const [lastAction, setLastAction] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isInitialized && user) {
      // Load user preferences on mount
      getUserPreferences().then(prefs => {
        if (prefs) {
          console.log('✅ User preferences loaded:', prefs);
        }
      });
    }
  }, [isInitialized, user, getUserPreferences]);

  const handleForceSync = async () => {
    try {
      setLastAction('Starting sync...');
      await forceSync();
      setLastAction('✅ Sync completed successfully');
    } catch (error) {
      setLastAction(`❌ Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    try {
      setIsExporting(true);
      setLastAction('Exporting user data...');
      const exportData = await exportUserData();
      
      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `astral-draft-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setLastAction('✅ Data exported successfully');
    } catch (error) {
      setLastAction(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setLastAction('Cleaning up old data...');
      await cleanup();
      setLastAction('✅ Cleanup completed');
    } catch (error) {
      setLastAction(`❌ Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestPreferences = async () => {
    if (!user) return;
    
    try {
      setLastAction('Testing preferences save/load...');
      
      const testPreferences = {
        userId: user.id,
        theme: 'dark' as const,
        notifications: {
          draftReminders: true,
          oraclePredictions: true,
          leagueUpdates: false,
          mobileOnly: true
        },
        dashboard: {
          layout: 'grid',
          widgets: ['oracle', 'analytics'],
          refreshInterval: 60000
        },
        draft: {
          autoQueue: true,
          pickReminders: true,
          defaultSort: 'projected',
          columns: ['name', 'position', 'team']
        },
        oracle: {
          showConfidence: true,
          autoSubmit: false,
          defaultStake: 10
        },
        updatedAt: new Date().toISOString()
      };

      await saveUserPreferences(testPreferences);
      const savedPrefs = await getUserPreferences();
      
      if (savedPrefs && savedPrefs.oracle.defaultStake === 10) {
        setLastAction('✅ Preferences test successful');
      } else {
        setLastAction('❌ Preferences test failed - data mismatch');
      }
    } catch (error) {
      setLastAction(`❌ Preferences test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-300">Initializing data persistence...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Data Persistence
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <div className="flex items-center space-x-1 text-green-600">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Online</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-600">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Cloud className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Sync Status</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {syncStatus?.pendingChanges || 0} pending
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last: {syncStatus?.lastSync || 'Never'}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Conflicts</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {syncStatus?.conflicts?.length || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No conflicts detected
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Local Storage</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            Active
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            IndexedDB ready
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <div className="h-4 w-4 bg-green-500 rounded-full"></div>
            )}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {isLoading ? 'Processing' : 'Ready'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {error ? 'Error detected' : 'All systems operational'}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Last Action */}
      {lastAction && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">{lastAction}</p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={handleForceSync}
          disabled={isLoading || !isOnline}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Sync</span>
        </button>

        <button
          onClick={handleExportData}
          disabled={isLoading || isExporting || !user}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>

        <button
          onClick={handleTestPreferences}
          disabled={isLoading || !user}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Database className="h-4 w-4" />
          <span>Test</span>
        </button>

        <button
          onClick={handleCleanup}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Clock className="h-4 w-4" />
          <span>Cleanup</span>
        </button>
      </div>

      {/* Technical Details */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <details className="text-sm text-gray-600 dark:text-gray-400">
          <summary className="cursor-pointer font-medium">Technical Details</summary>
          <div className="mt-2 space-y-1">
            <p>• IndexedDB for local storage with automatic conflict resolution</p>
            <p>• Background sync with exponential backoff retry logic</p>
            <p>• Offline-first architecture with cloud sync when available</p>
            <p>• Encrypted data transmission and secure token-based authentication</p>
            <p>• Automatic cleanup of expired cache entries and old data</p>
          </div>
        </details>
      </div>
    </motion.div>
  );
};

export default DataPersistencePanel;
