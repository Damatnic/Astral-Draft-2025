/**
 * Notification System Demo Component
 * For testing and demonstrating Oracle notification features
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Target, Clock, Trophy, TrendingUp, Users, Zap } from 'lucide-react';
import { NotificationCenter } from '../oracle/NotificationCenter';
import { NotificationPreferencesComponent } from '../oracle/NotificationPreferences';
import { useOracleNotifications } from '../../hooks/useOracleNotifications';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export const NotificationDemo: React.FC = () => {
    const {
        addNotification,
        notifyPredictionDeadline,
        notifyPredictionResult,
        notifyAccuracyUpdate,
        notifyStreakMilestone,
        notifyRankingChange,
        notifications,
        unreadCount
    } = useOracleNotifications();

    const [showPreferences, setShowPreferences] = useState(false);

    const demoNotifications = [
        {
            title: 'Deadline Warning',
            description: 'Show a prediction deadline warning',
            icon: <Clock className="w-5 h-5 text-yellow-400" />,
            action: () => notifyPredictionDeadline(
                'demo-pred-1',
                'Will the Chiefs win their next game?',
                15
            )
        },
        {
            title: 'Correct Prediction',
            description: 'Celebrate a correct prediction',
            icon: <Target className="w-5 h-5 text-green-400" />,
            action: () => notifyPredictionResult(
                'demo-pred-2',
                'Will Patrick Mahomes throw for 300+ yards?',
                true,
                25
            )
        },
        {
            title: 'Incorrect Prediction',
            description: 'Show an incorrect prediction result',
            icon: <Target className="w-5 h-5 text-red-400" />,
            action: () => notifyPredictionResult(
                'demo-pred-3',
                'Will it rain tomorrow?',
                false,
                0
            )
        },
        {
            title: 'Accuracy Improved',
            description: 'Show accuracy improvement notification',
            icon: <TrendingUp className="w-5 h-5 text-green-400" />,
            action: () => notifyAccuracyUpdate(75.5, 68.2)
        },
        {
            title: 'Accuracy Decreased',
            description: 'Show accuracy decrease notification',
            icon: <TrendingUp className="w-5 h-5 text-red-400" />,
            action: () => notifyAccuracyUpdate(62.1, 68.9)
        },
        {
            title: 'Streak Milestone',
            description: 'Celebrate a 5-prediction streak',
            icon: <Zap className="w-5 h-5 text-orange-400" />,
            action: () => notifyStreakMilestone(5)
        },
        {
            title: 'Ranking Improved',
            description: 'Show ranking improvement',
            icon: <Trophy className="w-5 h-5 text-purple-400" />,
            action: () => notifyRankingChange(3, 7)
        },
        {
            title: 'Ranking Dropped',
            description: 'Show ranking decrease',
            icon: <Trophy className="w-5 h-5 text-gray-400" />,
            action: () => notifyRankingChange(12, 8)
        },
        {
            title: 'Custom High Priority',
            description: 'Show a high priority custom notification',
            icon: <Bell className="w-5 h-5 text-red-400" />,
            action: () => addNotification({
                type: 'result_announced',
                title: '🚨 Critical Update',
                message: 'This is a high priority notification that requires immediate attention!',
                priority: 'high'
            })
        },
        {
            title: 'Custom Medium Priority',
            description: 'Show a medium priority custom notification',
            icon: <Bell className="w-5 h-5 text-blue-400" />,
            action: () => addNotification({
                type: 'accuracy_update',
                title: '📊 Weekly Summary',
                message: 'Your weekly prediction summary is now available. Check your progress!',
                priority: 'medium',
                actionUrl: '/oracle/analytics'
            })
        }
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Oracle Notification System Demo
                    </h1>
                    <p className="text-gray-400">
                        Test and explore the Oracle notification features
                    </p>
                </div>
                
                {/* Notification Center */}
                <div className="flex items-center space-x-4">
                    <NotificationCenter />
                    <button
                        onClick={() => setShowPreferences(!showPreferences)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Settings
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6 text-center">
                        <Bell className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{notifications.length}</p>
                        <p className="text-sm text-gray-400">Total Notifications</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6 text-center">
                        <Target className="w-8 h-8 mx-auto text-green-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{unreadCount}</p>
                        <p className="text-sm text-gray-400">Unread Notifications</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6 text-center">
                        <Users className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                        <p className="text-2xl font-bold text-white">
                            {('Notification' in window && Notification.permission === 'granted') ? 'Enabled' : 'Disabled'}
                        </p>
                        <p className="text-sm text-gray-400">Browser Notifications</p>
                    </CardContent>
                </Card>
            </div>

            {/* Notification Preferences */}
            {showPreferences && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <NotificationPreferencesComponent 
                        onClose={() => setShowPreferences(false)}
                    />
                </motion.div>
            )}

            {/* Demo Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle>Test Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {demoNotifications.map((demo, index) => (
                            <motion.button
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={demo.action}
                                className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors text-left group"
                            >
                                <div className="flex items-center space-x-3 mb-2">
                                    {demo.icon}
                                    <h3 className="font-medium text-white group-hover:text-blue-300">
                                        {demo.title}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-400">{demo.description}</p>
                            </motion.button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Usage Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>How to Use</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                            <div>
                                <h4 className="font-medium text-white">Enable Browser Notifications</h4>
                                <p className="text-sm text-gray-400">Click "Settings" and enable browser notifications for the full experience.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                            <div>
                                <h4 className="font-medium text-white">Test Notifications</h4>
                                <p className="text-sm text-gray-400">Click any of the demo buttons above to trigger different types of notifications.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                            <div>
                                <h4 className="font-medium text-white">View Notifications</h4>
                                <p className="text-sm text-gray-400">Click the bell icon to see your notification history and manage them.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                            <div>
                                <h4 className="font-medium text-white">Customize Settings</h4>
                                <p className="text-sm text-gray-400">Use the settings panel to control which notifications you receive and when.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default NotificationDemo;
