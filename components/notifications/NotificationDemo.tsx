/**
 * Notification Demo Component
 * Demonstrates the comprehensive notification system capabilities
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNotifications } from '../../contexts/NotificationContext';
import { Widget } from '../ui/Widget';
import { PlayIcon, SettingsIcon } from 'lucide-react';

const NotificationDemo: React.FC = () => {
    const { sendNotification, preferences, updatePreferences } = useNotifications();
    const [demoInProgress, setDemoInProgress] = useState(false);

    const runDemoSequence = async () => {
        setDemoInProgress(true);

        // Draft Pick Reminder
        await sendNotification(
            'DRAFT_PICK',
            'Your Turn to Pick! 🏈',
            "It's your turn to pick in the Draft League. Time remaining: 45s",
            {
                priority: 'urgent',
                actionUrl: '/draft/demo',
                actionText: 'Make Pick',
                data: { pickNumber: 15, timeRemaining: 45 }
            }
        );

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Oracle Prediction Update
        await sendNotification(
            'ORACLE_PREDICTION',
            'Oracle Prediction Updated',
            'Oracle updated prediction for Josh Allen Week 10 - Confidence: 85%',
            {
                priority: 'medium',
                actionUrl: '/oracle/predictions/demo',
                actionText: 'View Prediction',
                data: { confidence: 85, reasoning: 'Weather conditions favorable' }
            }
        );

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Trade Proposal
        await sendNotification(
            'TRADE',
            'New Trade Proposal',
            'Team Alpha sent you a trade proposal',
            {
                priority: 'medium',
                actionUrl: '/trades/demo',
                actionText: 'Review Trade',
                data: { fromTeam: 'Team Alpha' }
            }
        );

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Achievement Unlocked
        await sendNotification(
            'ACHIEVEMENT',
            'Achievement Unlocked! 🏆',
            'You unlocked "Oracle Master": Correctly predicted 10 Oracle challenges',
            {
                priority: 'low',
                actionUrl: '/achievements/demo',
                actionText: 'View Achievement',
                data: { achievementName: 'Oracle Master' }
            }
        );

        await new Promise(resolve => setTimeout(resolve, 2000));

        // League Announcement
        await sendNotification(
            'LEAGUE_UPDATE',
            'League Announcement',
            'Commissioner updated playoff format - Check the new rules',
            {
                priority: 'medium',
                actionUrl: '/league/announcements/demo',
                actionText: 'View Details',
                data: { commissionerName: 'League Admin' }
            }
        );

        setDemoInProgress(false);
    };

    const testNotificationTypes = [
        {
            type: 'DRAFT_START',
            title: 'Draft Starting Soon! 🚀',
            message: 'Your draft is starting in 15 minutes. Get ready!',
            priority: 'high'
        },
        {
            type: 'ORACLE_RESULT',
            title: 'Oracle Challenge Won! 🎉',
            message: 'Congratulations! You earned 150 points.',
            priority: 'medium'
        },
        {
            type: 'SYSTEM',
            title: 'Maintenance Alert',
            message: 'Scheduled maintenance will begin at 2:00 AM EST',
            priority: 'low'
        }
    ];

    const quickTestNotification = async (testNotif: any) => {
        await sendNotification(
            testNotif.type,
            testNotif.title,
            testNotif.message,
            {
                priority: testNotif.priority,
                data: { test: true }
            }
        );
    };

    return (
        <div className="space-y-6">
            <Widget title="🔔 Notification System Demo" className="bg-gray-900/50">
                <div className="space-y-6">
                    {/* Demo Sequence */}
                    <div className="bg-blue-900/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Full Demo Sequence
                        </h3>
                        <p className="text-gray-300 text-sm mb-4">
                            Experience a complete notification journey with draft alerts, Oracle predictions, 
                            trade proposals, achievements, and league updates.
                        </p>
                        <button
                            onClick={runDemoSequence}
                            disabled={demoInProgress}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                demoInProgress 
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            <PlayIcon className="w-4 h-4" />
                            <span>{demoInProgress ? 'Demo Running...' : 'Start Demo Sequence'}</span>
                        </button>
                    </div>

                    {/* Quick Tests */}
                    <div className="bg-gray-800/30 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Quick Notification Tests
                        </h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {testNotificationTypes.map((testNotif) => {
                                let priorityClasses = 'bg-gray-500/20 text-gray-400';
                                if (testNotif.priority === 'high') {
                                    priorityClasses = 'bg-orange-500/20 text-orange-400';
                                } else if (testNotif.priority === 'medium') {
                                    priorityClasses = 'bg-blue-500/20 text-blue-400';
                                }

                                return (
                                    <motion.button
                                        key={`${testNotif.type}-${testNotif.title}`}
                                        onClick={() => quickTestNotification(testNotif)}
                                        className="p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-left transition-colors"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="text-sm font-medium text-white mb-1">
                                            {testNotif.title}
                                        </div>
                                        <div className="text-xs text-gray-400 mb-2">
                                            {testNotif.message}
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${priorityClasses}`}>
                                            {testNotif.priority} priority
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Settings Preview */}
                    <div className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">
                                Notification Preferences
                            </h3>
                            <SettingsIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        
                        {preferences ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">Push Notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={preferences.enablePushNotifications || false}
                                        onChange={(e: any) => updatePreferences({
                                            enablePushNotifications: e.target.checked
                                        })}
                                        className="accent-blue-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">Sound Notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={preferences.enableSoundNotifications || false}
                                        onChange={(e: any) => updatePreferences({
                                            enableSoundNotifications: e.target.checked
                                        })}
                                        className="accent-blue-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">Draft Alerts</span>
                                    <input
                                        type="checkbox"
                                        checked={preferences.categories?.draft?.enabled || false}
                                        onChange={(e: any) => updatePreferences({
                                            categories: {
                                                ...preferences.categories,
                                                draft: {
                                                    ...preferences.categories?.draft,
                                                    enabled: e.target.checked
                                                }
                                            }
                                        })}
                                        className="accent-blue-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">Oracle Predictions</span>
                                    <input
                                        type="checkbox"
                                        checked={preferences.categories?.oracle?.enabled || false}
                                        onChange={(e: any) => updatePreferences({
                                            categories: {
                                                ...preferences.categories,
                                                oracle: {
                                                    ...preferences.categories?.oracle,
                                                    enabled: e.target.checked
                                                }
                                            }
                                        })}
                                        className="accent-blue-500"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400 text-sm">
                                Loading preferences...
                            </div>
                        )}
                    </div>

                    {/* Features List */}
                    <div className="bg-green-900/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            ✅ Notification System Features
                        </h3>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-300">
                            <div>• Real-time push notifications</div>
                            <div>• In-app notification center</div>
                            <div>• Toast notification overlays</div>
                            <div>• Notification bell with badge</div>
                            <div>• Draft pick reminders</div>
                            <div>• Oracle prediction updates</div>
                            <div>• Trade proposal alerts</div>
                            <div>• League announcements</div>
                            <div>• Achievement notifications</div>
                            <div>• Customizable preferences</div>
                            <div>• Priority-based filtering</div>
                            <div>• Offline notification queuing</div>
                            <div>• Mark as read/archive/delete</div>
                            <div>• Sound & vibration support</div>
                            <div>• Quiet hours scheduling</div>
                            <div>• Category-based filters</div>
                        </div>
                    </div>
                </div>
            </Widget>
        </div>
    );
};

export default NotificationDemo;
