/**
 * Cache Integration Demo
 * Demonstrates intelligent caching in action with real examples
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DatabaseIcon, ZapIcon, WifiOffIcon, CheckCircleIcon } from 'lucide-react';
import { Widget } from '../ui/Widget';
import { useCache, useOfflineCache, useCacheOperations } from '../../hooks/useCache';

// Mock API functions for demonstration
const mockAPIFunctions = {
    fetchPlayerStats: async (playerId: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        return {
            id: playerId,
            name: `Player ${playerId}`,
            points: Math.floor(Math.random() * 100),
            position: ['QB', 'RB', 'WR', 'TE'][Math.floor(Math.random() * 4)],
            team: ['KC', 'SF', 'BUF', 'LAR'][Math.floor(Math.random() * 4)],
            lastUpdated: new Date().toISOString()
        };
    },

    fetchDraftRoomData: async (roomId: string) => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            id: roomId,
            name: `Draft Room ${roomId}`,
            participants: Math.floor(Math.random() * 12) + 1,
            currentPick: Math.floor(Math.random() * 200) + 1,
            status: ['active', 'paused', 'completed'][Math.floor(Math.random() * 3)],
            lastActivity: new Date().toISOString()
        };
    },

    fetchOraclePrediction: async (predictionId: string) => {
        await new Promise(resolve => setTimeout(resolve, 1200));
        return {
            id: predictionId,
            player: `Player ${predictionId}`,
            prediction: Math.floor(Math.random() * 50) + 50,
            confidence: Math.floor(Math.random() * 30) + 70,
            factors: ['Weather', 'Matchup', 'Recent Form', 'Injury Status'],
            timestamp: new Date().toISOString()
        };
    }
};

const CacheIntegrationDemo: React.FC = () => {
    const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
    const { preloadData } = useCacheOperations();

    // Demo 1: Standard caching with automatic refresh
    const playerCache = useCache(
        'players',
        'player-123',
        () => mockAPIFunctions.fetchPlayerStats('123'),
        {
            staleTime: 10 * 1000, // 10 seconds
            cacheTime: 30 * 1000, // 30 seconds
            refreshInterval: 15 * 1000, // Refresh every 15 seconds
            onSuccess: (data) => console.log('Player data updated:', data),
            onError: (error) => console.error('Player fetch failed:', error)
        }
    );

    // Demo 2: Offline-aware caching
    const draftCache = useOfflineCache(
        'draft',
        'room-456',
        () => mockAPIFunctions.fetchDraftRoomData('456'),
        {
            staleTime: 5 * 1000, // 5 seconds (real-time data)
            cacheTime: 60 * 1000, // 1 minute
        }
    );

    // Demo 3: Manual cache management
    const oracleCache = useCache(
        'oracle',
        'prediction-789',
        () => mockAPIFunctions.fetchOraclePrediction('789'),
        {
            enabled: selectedDemo === 'oracle', // Only fetch when selected
            staleTime: 30 * 1000, // 30 seconds
            cacheTime: 5 * 60 * 1000, // 5 minutes
        }
    );

    const demos = [
        {
            id: 'player',
            name: 'Player Stats Cache',
            description: 'Auto-refreshing player statistics with smart caching',
            cache: playerCache,
            icon: DatabaseIcon,
            color: 'blue'
        },
        {
            id: 'draft',
            name: 'Offline-Aware Draft',
            description: 'Draft room data with offline fallback',
            cache: draftCache,
            icon: WifiOffIcon,
            color: 'green'
        },
        {
            id: 'oracle',
            name: 'Oracle Predictions',
            description: 'On-demand Oracle predictions with manual control',
            cache: oracleCache,
            icon: ZapIcon,
            color: 'purple'
        }
    ];

    const handlePreload = async () => {
        try {
            await preloadData(
                'players',
                'player-preload',
                () => mockAPIFunctions.fetchPlayerStats('preload'),
                { tags: ['preload', 'demo'] }
            );
            console.log('Data preloaded successfully');
        } catch (error) {
            console.error('Preload failed:', error);
        }
    };

    const getStatusColor = (cache: any) => {
        if (cache.isLoading) return 'text-yellow-400';
        if (cache.isError) return 'text-red-400';
        if (cache.isStale) return 'text-orange-400';
        return 'text-green-400';
    };

    const getStatusIcon = (cache: any) => {
        if (cache.isLoading) return '⏳';
        if (cache.isError) return '❌';
        if (cache.isStale) return '⚠️';
        return '✅';
    };

    const getCacheStatusText = (cache: any) => {
        if (cache.isLoading) return 'Loading';
        if (cache.isError) return 'Error';
        if (cache.isStale) return 'Stale';
        return 'Fresh';
    };

    return (
        <div className="space-y-6">
            <Widget title="🚀 Intelligent Cache System Demo" className="bg-gray-900/50">
                <div className="space-y-6">
                    {/* Cache Strategy Overview */}
                    <div className="bg-blue-900/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Cache Strategy Overview
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <div className="font-medium text-blue-400 mb-2">Cache-First</div>
                                <div className="text-gray-300">Player data, team info, static resources</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <div className="font-medium text-green-400 mb-2">Network-First</div>
                                <div className="text-gray-300">Draft picks, Oracle predictions, live data</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <div className="font-medium text-purple-400 mb-2">Stale-While-Revalidate</div>
                                <div className="text-gray-300">User preferences, profile data</div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Demos */}
                    <div className="bg-gray-800/30 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Interactive Cache Demos
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {demos.map((demo) => {
                                const isActive = selectedDemo === demo.id;
                                const cache = demo.cache;

                                return (
                                    <motion.div
                                        key={demo.id}
                                        className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                                            isActive 
                                                ? `border-${demo.color}-500 bg-${demo.color}-900/20` 
                                                : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                                        }`}
                                        onClick={() => setSelectedDemo(demo.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center space-x-3 mb-3">
                                            <demo.icon className={`w-6 h-6 text-${demo.color}-400`} />
                                            <span className="font-medium text-white">{demo.name}</span>
                                        </div>
                                        
                                        <div className="text-sm text-gray-400 mb-3">
                                            {demo.description}
                                        </div>

                                        {/* Cache Status */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400">Status:</span>
                                                <span className={`flex items-center space-x-1 ${getStatusColor(cache)}`}>
                                                    <span>{getStatusIcon(cache)}</span>
                                                    <span>{getCacheStatusText(cache)}</span>
                                                </span>
                                            </div>
                                            
                                            {Boolean(cache.lastUpdated) && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-400">Last Updated:</span>
                                                    <span className="text-gray-300">
                                                        {cache.lastUpdated ? new Date(cache.lastUpdated).toLocaleTimeString() : 'Never'}
                                                    </span>
                                                </div>
                                            )}

                                            {demo.id === 'draft' && 'isOnline' in cache && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-400">Network:</span>
                                                    <span className={`flex items-center space-x-1 ${
                                                        cache.isOnline ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                        <span>{cache.isOnline ? '🟢' : '🔴'}</span>
                                                        <span>{cache.isOnline ? 'Online' : 'Offline'}</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-3 space-y-2">
                                            <button
                                                onClick={(e: any) => {
                                                    e.stopPropagation();
                                                    cache.refetch();
                                                }}
                                                disabled={cache.isFetching}
                                                className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                                            >
                                                {cache.isFetching ? 'Refreshing...' : 'Refresh'}
                                            </button>
                                            
                                            <button
                                                onClick={(e: any) => {
                                                    e.stopPropagation();
                                                    cache.invalidate();
                                                }}
                                                className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                            >
                                                Invalidate
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Data Preview */}
                    {selectedDemo && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800/30 rounded-lg p-4"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Cached Data Preview
                            </h3>
                            <pre className="bg-black/50 rounded-lg p-4 text-sm text-gray-300 overflow-auto">
                                {JSON.stringify(
                                    demos.find((d: any) => d.id === selectedDemo)?.cache.data,
                                    null,
                                    2
                                )}
                            </pre>
                        </motion.div>
                    )}

                    {/* Cache Operations */}
                    <div className="bg-gray-800/30 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Advanced Cache Operations
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <button
                                onClick={handlePreload}
                                className="flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                <DatabaseIcon className="w-5 h-5" />
                                <span>Preload Data</span>
                            </button>
                            
                            <button
                                onClick={() => {
                                    // Force all demos to refresh
                                    playerCache.refetch();
                                    draftCache.refetch();
                                    if (selectedDemo === 'oracle') {
                                        oracleCache.refetch();
                                    }
                                }}
                                className="flex items-center justify-center space-x-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                <span>Refresh All</span>
                            </button>
                        </div>
                    </div>

                    {/* Benefits Summary */}
                    <div className="bg-green-900/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            ✅ Intelligent Caching Benefits
                        </h3>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-300">
                            <div>• Reduced API calls and server load</div>
                            <div>• Improved app responsiveness</div>
                            <div>• Offline functionality support</div>
                            <div>• Smart cache invalidation</div>
                            <div>• Memory + IndexedDB storage</div>
                            <div>• Service Worker integration</div>
                            <div>• Automatic stale data refresh</div>
                            <div>• Priority-based cache cleanup</div>
                            <div>• Network-aware strategies</div>
                            <div>• Background data synchronization</div>
                        </div>
                    </div>
                </div>
            </Widget>
        </div>
    );
};

export default CacheIntegrationDemo;
