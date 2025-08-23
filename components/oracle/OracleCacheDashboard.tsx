/**
 * Oracle Cache Dashboard
 * Real-time cache monitoring and management interface
 */

import React, { useState } from 'react';
import { useOracleCacheManager } from '../../hooks/useOracleCacheHooks';
import './OracleCacheDashboard.css';

interface CacheMetricsDisplayProps {
    stats: any;
    isOptimizing: boolean;
    onOptimize: () => Promise<any>;
    onWarmCache: (userId: string) => Promise<void>;
    onClearCache: (tags?: string[]) => void;
}

const OracleCacheDashboard: React.FC<CacheMetricsDisplayProps> = ({
    stats,
    isOptimizing,
    onOptimize,
    onWarmCache,
    onClearCache
}) => {
    const [userId, setUserId] = useState('user123');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [optimizationResults, setOptimizationResults] = useState<any>(null);

    const handleOptimize = async () => {
        try {
            const results = await onOptimize();
            setOptimizationResults(results);
            setTimeout(() => setOptimizationResults(null), 5000);
        } catch (error) {
            console.error('Optimization failed:', error);
        }
    };

    const getHealthColor = (score: number) => {
        if (score >= 80) return '#22c55e'; // green
        if (score >= 60) return '#f59e0b'; // yellow
        return '#ef4444'; // red
    };

    const formatPercentage = (value: number) => {
        return `${Math.round(value * 100) / 100}%`;
    };

    if (!stats) {
        return (
            <div className="oracle-cache-dashboard loading">
                <div className="loading-spinner"></div>
                <p>Loading cache statistics...</p>
            </div>
        );
    }

    return (
        <div className="oracle-cache-dashboard">
            <div className="dashboard-header">
                <h2>🧠 Oracle Cache Dashboard</h2>
                <div className="health-score">
                    <span 
                        className="health-indicator"
                        style={{ backgroundColor: getHealthColor(stats.healthScore) }}
                    >
                        {stats.healthScore}
                    </span>
                    <span>Health Score</span>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">📊</div>
                    <div className="metric-content">
                        <h3>Hit Rate</h3>
                        <div className="metric-value">{formatPercentage(stats.hitRate)}</div>
                        <div className="metric-subtitle">
                            {stats.hits} hits / {stats.hits + stats.misses} requests
                        </div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">💾</div>
                    <div className="metric-content">
                        <h3>Memory Usage</h3>
                        <div className="metric-value">{stats.memoryUsage}</div>
                        <div className="metric-subtitle">
                            {stats.entryCount} entries cached
                        </div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">⚡</div>
                    <div className="metric-content">
                        <h3>Avg Response</h3>
                        <div className="metric-value">{Math.round(stats.avgResponseTime)}ms</div>
                        <div className="metric-subtitle">
                            Cache lookup time
                        </div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">🗑️</div>
                    <div className="metric-content">
                        <h3>Evictions</h3>
                        <div className="metric-value">{stats.evictions}</div>
                        <div className="metric-subtitle">
                            LRU evicted entries
                        </div>
                    </div>
                </div>
            </div>

            {/* Cache Operations */}
            <div className="cache-operations">
                <div className="operation-section">
                    <h3>🔧 Cache Operations</h3>
                    <div className="operation-buttons">
                        <button 
                            className="btn-optimize"
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                        >
                            {isOptimizing ? '🔄 Optimizing...' : '⚡ Optimize Cache'}
                        </button>

                        <div className="warm-cache-control">
                            <input
                                type="text"
                                placeholder="User ID"
                                value={userId}
                                onChange={(e: any) => setUserId(e.target.value)}
                                className="user-input"
                            />
                            <button 
                                className="btn-warm"
                                onClick={() => onWarmCache(userId)}
                                disabled={!userId}
                            >
                                🔥 Warm Cache
                            </button>
                        </div>

                        <div className="clear-cache-control">
                            <select 
                                multiple
                                value={selectedTags}
                                onChange={(e: any) => setSelectedTags(Array.from(e.target.selectedOptions, option => option.value))}
                                className="tags-select"
                            >
                                <option value="predictions">Predictions</option>
                                <option value="analytics">Analytics</option>
                                <option value="leaderboard">Leaderboard</option>
                                <option value="user-stats">User Stats</option>
                                <option value="notifications">Notifications</option>
                            </select>
                            <button 
                                className="btn-clear"
                                onClick={() => onClearCache(selectedTags.length > 0 ? selectedTags : undefined)}
                            >
                                🧹 Clear Cache
                            </button>
                        </div>
                    </div>
                </div>

                {optimizationResults && (
                    <div className="optimization-results">
                        <h4>✨ Optimization Results</h4>
                        <div className="results-grid">
                            <div className="result-item">
                                <span>Entries Evicted:</span>
                                <strong>{optimizationResults.entriesEvicted}</strong>
                            </div>
                            <div className="result-item">
                                <span>Memory Freed:</span>
                                <strong>{(optimizationResults.memoryFreed / 1024).toFixed(1)} KB</strong>
                            </div>
                            <div className="result-item">
                                <span>Compression Savings:</span>
                                <strong>{(optimizationResults.compressionSavings / 1024).toFixed(1)} KB</strong>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Top Cached Items */}
            <div className="top-items">
                <h3>🔝 Most Accessed Items</h3>
                <div className="items-list">
                    {stats.topKeys.map((item: any, index: number) => (
                        <div key={item.key} className="item-row">
                            <div className="item-rank">#{index + 1}</div>
                            <div className="item-details">
                                <div className="item-key">{item.key}</div>
                                <div className="item-stats">
                                    {item.accessCount} accesses • {item.size}
                                </div>
                            </div>
                            <div className="item-actions">
                                <button 
                                    className="btn-invalidate"
                                    onClick={() => onClearCache([item.key])}
                                    title="Invalidate this cache entry"
                                >
                                    ❌
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cache Strategies */}
            <div className="cache-strategies">
                <h3>📋 Cache Strategies</h3>
                <div className="strategies-grid">
                    {Object.entries(stats.strategies).map(([key, strategy]: [string, any]) => (
                        <div key={key} className="strategy-card">
                            <div className="strategy-header">
                                <h4>{strategy.name}</h4>
                                <div className="strategy-priority">
                                    Priority: {strategy.priority}
                                </div>
                            </div>
                            <div className="strategy-details">
                                <div className="strategy-row">
                                    <span>TTL:</span>
                                    <span>{Math.round(strategy.ttl / 1000)}s</span>
                                </div>
                                <div className="strategy-row">
                                    <span>Prefetch:</span>
                                    <span>{strategy.prefetch ? '✅' : '❌'}</span>
                                </div>
                                <div className="strategy-row">
                                    <span>Compression:</span>
                                    <span>{strategy.compression ? '✅' : '❌'}</span>
                                </div>
                                <div className="strategy-row">
                                    <span>Persistence:</span>
                                    <span>{strategy.persistence ? '✅' : '❌'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Real-time Activity Log */}
            <div className="activity-log">
                <h3>📝 Recent Activity</h3>
                <div className="log-entries">
                    <div className="log-entry">
                        <span className="log-time">{new Date().toLocaleTimeString()}</span>
                        <span className="log-action hit">Cache Hit</span>
                        <span className="log-key">predictions:week:12:user123</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">{new Date(Date.now() - 30000).toLocaleTimeString()}</span>
                        <span className="log-action miss">Cache Miss</span>
                        <span className="log-key">analytics:user456:7d</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">{new Date(Date.now() - 60000).toLocaleTimeString()}</span>
                        <span className="log-action set">Cache Set</span>
                        <span className="log-key">leaderboard:overall</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main component with integrated cache management
const OracleCacheManager: React.FC = () => {
    const { stats, isOptimizing, optimize, warmCache, clearCache } = useOracleCacheManager();

    return (
        <OracleCacheDashboard
            stats={stats}
            isOptimizing={isOptimizing}
            onOptimize={optimize}
            onWarmCache={warmCache}
            onClearCache={clearCache}
        />
    );
};

export default OracleCacheManager;
