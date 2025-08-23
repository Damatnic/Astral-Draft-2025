/**
 * Oracle-Only App Component - Standalone Oracle Interface
 * Focuses on Oracle predictions with simple 10-player + admin login
 */

import React, { useState, memo } from 'react';
import ProductionAuthProvider, { useProductionAuth } from '../contexts/ProductionAuthContext';
import ProductionLoginInterface from '../components/auth/ProductionLoginInterface';
import MobileOptimizedOracleInterface from '../components/oracle/MobileOptimizedOracleInterface';
import NotificationDemo from '../components/oracle/NotificationDemo';
import UserSettings from '../components/auth/UserSettings';
import NotificationCenter from '../components/oracle/NotificationCenter';
import OraclePerformanceDashboard from '../components/oracle/OraclePerformanceDashboard';
import OracleCacheDashboard from '../components/oracle/OracleCacheDashboard';
import { motion } from 'framer-motion';
import { LogOutIcon, SettingsIcon, TestTubeIcon, ActivityIcon, DatabaseIcon } from 'lucide-react';

// Memoized AppContent for better performance
const OracleOnlyAppContent: React.FC = memo(() => {
    const { user, isAuthenticated, logout, isLoading } = useProductionAuth();
    const [showSettings, setShowSettings] = useState(false);
    const [showDemo, setShowDemo] = useState(false);
    const [showPerformance, setShowPerformance] = useState(false);
    const [showCache, setShowCache] = useState(false);

    // Show loading state while authenticating
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <ProductionLoginInterface />;
    }

    if (showSettings) {
        return (
            <div className="min-h-screen bg-gray-900">
                <div className="max-w-4xl mx-auto p-4">
                    {/* Settings Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setShowSettings(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ← Back to Oracle
                        </button>
                        <h1 className="text-2xl font-bold text-white">Settings</h1>
                        <div className="w-20"></div> {/* Spacer */}
                    </div>
                    
                    <UserSettings />
                </div>
            </div>
        );
    }

    if (showDemo) {
        return (
            <div className="min-h-screen bg-gray-900">
                <div className="max-w-4xl mx-auto p-4">
                    {/* Demo Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setShowDemo(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ← Back to Oracle
                        </button>
                        <h1 className="text-2xl font-bold text-white">Notification Demo</h1>
                        <div className="w-20"></div> {/* Spacer */}
                    </div>
                    
                    <NotificationDemo />
                </div>
            </div>
        );
    }

    if (showPerformance) {
        return (
            <div className="min-h-screen bg-gray-900">
                <div className="max-w-6xl mx-auto p-4">
                    {/* Performance Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setShowPerformance(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ← Back to Oracle
                        </button>
                        <h1 className="text-2xl font-bold text-white">Performance Dashboard</h1>
                        <div className="w-20"></div> {/* Spacer */}
                    </div>
                    
                    <OraclePerformanceDashboard />
                </div>
            </div>
        );
    }

    if (showCache) {
        return (
            <div className="min-h-screen bg-gray-900">
                <div className="max-w-6xl mx-auto p-4">
                    {/* Cache Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setShowCache(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ← Back to Oracle
                        </button>
                        <h1 className="text-2xl font-bold text-white">Cache Dashboard</h1>
                        <div className="w-20"></div> {/* Spacer */}
                    </div>
                    
                    <OracleCacheDashboard />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header with User Info and Controls */}
            <div className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* Left side - Welcome */}
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {user?.username?.[0]?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div>
                                <p className="text-white font-medium">Welcome, {user?.username || 'User'}</p>
                                <p className="text-gray-400 text-sm">Oracle System Ready</p>
                            </div>
                        </div>

                        {/* Right side - Action buttons */}
                        <div className="flex items-center space-x-2">
                            {/* Performance Dashboard Button */}
                            <button
                                onClick={() => setShowPerformance(true)}
                                className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Performance Dashboard"
                            >
                                <ActivityIcon className="w-5 h-5" />
                            </button>

                            {/* Cache Dashboard Button */}
                            <button
                                onClick={() => setShowCache(true)}
                                className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Cache Dashboard"
                            >
                                <DatabaseIcon className="w-5 h-5" />
                            </button>

                            {/* Demo Button */}
                            <button
                                onClick={() => setShowDemo(true)}
                                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Notification Demo"
                            >
                                <TestTubeIcon className="w-5 h-5" />
                            </button>
                            
                            {/* Settings Button */}
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Settings"
                            >
                                <SettingsIcon className="w-5 h-5" />
                            </button>
                            
                            {/* Logout Button */}
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOutIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <MobileOptimizedOracleInterface />
                </motion.div>
            </div>
        </div>
    );
});

const OracleOnlyApp: React.FC = () => {
    return (
        <ProductionAuthProvider>
            <OracleOnlyAppContent />
        </ProductionAuthProvider>
    );
};

export default OracleOnlyApp;
