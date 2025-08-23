/**
 * Cache Management Dashboard
 * Administrative interface for monitoring and managing cache performance
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    DatabaseIcon, 
    RefreshCwIcon, 
    TrashIcon, 
    BarChart3Icon,
    WifiOffIcon,
    CheckCircleIcon,
    AlertCircleIcon,
    SettingsIcon
} from 'lucide-react';
import { Widget } from '../ui/Widget';
import { useCacheStats, useCacheOperations } from '../../hooks/useCache';

interface CacheMetrics {
    hitRate: number;
    missRate: number;
    totalSize: string;
    totalItems: number;
    lastCleanup: string;
}

const CacheManagementDashboard: React.FC = () => {
    const stats = useCacheStats();
    const { clearCache, invalidateByTags } = useCacheOperations();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [clearing, setClearing] = useState<string | null>(null);
    const [lastAction, setLastAction] = useState<string | null>(null);

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Format cache metrics
    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString();
    };

    const metrics: CacheMetrics = {
        hitRate: Math.round(stats.hitRate * 100),
        missRate: Math.round(stats.missRate * 100),
        totalSize: formatSize(stats.totalSize),
        totalItems: stats.totalItems,
        lastCleanup: formatDate(stats.lastCleanup)
    };

    // Cache operations
    const handleClearCache = async (type?: string) => {
        const target = type || 'all';
        setClearing(target);
        try {
            await clearCache(type);
            setLastAction(`Cleared ${target} cache`);
        } catch (error) {
            console.error('Cache clear failed:', error);
            setLastAction(`Failed to clear ${target} cache`);
        } finally {
            setClearing(null);
        }
    };

    const handleInvalidateTags = async (tags: string[]) => {
        setClearing('tags');
        try {
            await invalidateByTags(tags);
            setLastAction(`Invalidated cache for tags: ${tags.join(', ')}`);
        } catch (error) {
            console.error('Tag invalidation failed:', error);
            setLastAction('Failed to invalidate cache by tags');
        } finally {
            setClearing(null);
        }
    };

    const getClearAllButtonClasses = (): string => {
        if (clearing === 'all') {
            return 'bg-red-600 text-white cursor-not-allowed';
        }
        if (clearing !== null) {
            return 'bg-gray-600 text-gray-400 cursor-not-allowed';
        }
        return 'bg-red-500 hover:bg-red-600 text-white';
    };

    const cacheTypes = [
        { name: 'API Cache', type: 'api', description: 'API responses and data' },
        { name: 'Player Data', type: 'players', description: 'Player information and stats' },
        { name: 'Draft Data', type: 'draft', description: 'Draft rooms and picks' },
        { name: 'Oracle Data', type: 'oracle', description: 'Oracle predictions and analysis' },
        { name: 'Analytics', type: 'analytics', description: 'Analytics and reports' },
        { name: 'Images', type: 'images', description: 'Player photos and assets' },
        { name: 'Static Files', type: 'static', description: 'CSS, JS, and other static resources' }
    ];

    const quickActions = [
        {
            name: 'Clear Expired',
            action: () => handleInvalidateTags(['expired']),
            icon: TrashIcon,
            description: 'Remove expired cache entries'
        },
        {
            name: 'Refresh Draft',
            action: () => handleInvalidateTags(['draft']),
            icon: RefreshCwIcon,
            description: 'Force refresh draft data'
        },
        {
            name: 'Refresh Oracle',
            action: () => handleInvalidateTags(['oracle']),
            icon: RefreshCwIcon,
            description: 'Force refresh Oracle predictions'
        }
    ];

    return (
        <div className="space-y-6">
            <Widget title="🗂️ Cache Management Dashboard" className="bg-gray-900/50">
                <div className="space-y-6">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center space-x-2 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                                {isOnline ? <CheckCircleIcon className="w-5 h-5" /> : <WifiOffIcon className="w-5 h-5" />}
                                <span className="text-sm font-medium">
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-400">
                                Service Worker: Active
                            </div>
                        </div>
                        
                        {lastAction && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-sm text-blue-400"
                            >
                                {lastAction}
                            </motion.div>
                        )}
                    </div>

                    {/* Cache Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-900/20 rounded-lg p-4 text-center">
                            <BarChart3Icon className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                            <div className="text-2xl font-bold text-white">{metrics.hitRate}%</div>
                            <div className="text-sm text-gray-400">Hit Rate</div>
                        </div>
                        
                        <div className="bg-orange-900/20 rounded-lg p-4 text-center">
                            <AlertCircleIcon className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                            <div className="text-2xl font-bold text-white">{metrics.missRate}%</div>
                            <div className="text-sm text-gray-400">Miss Rate</div>
                        </div>
                        
                        <div className="bg-green-900/20 rounded-lg p-4 text-center">
                            <DatabaseIcon className="w-8 h-8 mx-auto mb-2 text-green-400" />
                            <div className="text-2xl font-bold text-white">{metrics.totalItems}</div>
                            <div className="text-sm text-gray-400">Total Items</div>
                        </div>
                        
                        <div className="bg-purple-900/20 rounded-lg p-4 text-center">
                            <SettingsIcon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                            <div className="text-2xl font-bold text-white">{metrics.totalSize}</div>
                            <div className="text-sm text-gray-400">Cache Size</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gray-800/30 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                        <div className="grid md:grid-cols-3 gap-3">
                            {quickActions.map((action) => {
                                let buttonClasses = 'bg-gray-700/50 hover:bg-gray-700 text-white';
                                if (clearing !== null) {
                                    buttonClasses = 'bg-gray-600 text-gray-400 cursor-not-allowed';
                                }

                                return (
                                    <motion.button
                                        key={action.name}
                                        onClick={action.action}
                                        disabled={clearing !== null}
                                        className={`p-3 rounded-lg text-left transition-colors ${buttonClasses}`}
                                        whileHover={{ scale: clearing !== null ? 1 : 1.02 }}
                                        whileTap={{ scale: clearing !== null ? 1 : 0.98 }}
                                    >
                                        <div className="flex items-center space-x-2 mb-2">
                                            <action.icon className="w-4 h-4" />
                                            <span className="font-medium">{action.name}</span>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {action.description}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Cache Types Management */}
                    <div className="bg-gray-800/30 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Cache Types</h3>
                        <div className="space-y-3">
                            {cacheTypes.map((cacheType) => {
                                let buttonClasses = 'bg-red-500 hover:bg-red-600 text-white';
                                if (clearing === cacheType.type) {
                                    buttonClasses = 'bg-red-600 text-white cursor-not-allowed';
                                } else if (clearing !== null) {
                                    buttonClasses = 'bg-gray-600 text-gray-400 cursor-not-allowed';
                                }

                                return (
                                    <div
                                        key={cacheType.type}
                                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-white">{cacheType.name}</div>
                                            <div className="text-sm text-gray-400">{cacheType.description}</div>
                                        </div>
                                        <button
                                            onClick={() => handleClearCache(cacheType.type)}
                                            disabled={clearing !== null}
                                            className={`ml-4 px-3 py-1 rounded text-sm transition-colors ${buttonClasses}`}
                                        >
                                            {clearing === cacheType.type ? 'Clearing...' : 'Clear'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Clear All Cache */}
                    <div className="bg-red-900/20 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Clear All Cache</h3>
                                <p className="text-sm text-gray-400">
                                    This will remove all cached data. Use with caution.
                                </p>
                            </div>
                            <button
                                onClick={() => handleClearCache()}
                                disabled={clearing !== null}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${getClearAllButtonClasses()}`}
                            >
                                {clearing === 'all' ? 'Clearing All...' : 'Clear All Cache'}
                            </button>
                        </div>
                    </div>

                    {/* Cache Information */}
                    <div className="bg-gray-800/30 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Cache Information</h3>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-gray-400 mb-1">Last Cleanup:</div>
                                <div className="text-white">{metrics.lastCleanup}</div>
                            </div>
                            <div>
                                <div className="text-gray-400 mb-1">Storage Type:</div>
                                <div className="text-white">IndexedDB + Memory</div>
                            </div>
                            <div>
                                <div className="text-gray-400 mb-1">Cache Strategy:</div>
                                <div className="text-white">Intelligent Multi-tier</div>
                            </div>
                            <div>
                                <div className="text-gray-400 mb-1">Service Worker:</div>
                                <div className="text-white">Enhanced Caching</div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Tips */}
                    <div className="bg-blue-900/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">💡 Performance Tips</h3>
                        <div className="space-y-2 text-sm text-gray-300">
                            <div>• Cache hit rate above 70% indicates good performance</div>
                            <div>• Clear expired cache entries regularly for optimal performance</div>
                            <div>• Draft and Oracle data are cached with shorter TTL for real-time accuracy</div>
                            <div>• Images and static files are cached longer to reduce bandwidth</div>
                            <div>• Service Worker provides offline functionality when network is unavailable</div>
                        </div>
                    </div>
                </div>
            </Widget>
        </div>
    );
};

export default CacheManagementDashboard;
