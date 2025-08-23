import React from 'react';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { motion } from 'framer-motion';
import { SettingsIcon } from '../components/icons/SettingsIcon';

const CustomScoringEditorView: React.FC = () => {
    const { league } = useLeague();

    if (!league) {
        return <ErrorDisplay message="No league selected" />;
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-3 mb-6">
                <SettingsIcon className="w-8 h-8 text-blue-400" />
                <h1 className="text-2xl font-bold">Custom Scoring Editor</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Widget
                    title="Scoring Settings"
                    icon={<SettingsIcon />}
                    className="lg:col-span-2"
                >
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Customize Your League Scoring</h3>
                            <p className="text-gray-300 mb-4">
                                Set up custom scoring rules to make your league unique and engaging.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-400">6</div>
                                    <div className="text-sm text-gray-400">Passing TD</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-400">1</div>
                                    <div className="text-sm text-gray-400">Per 10 Yards</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Scoring Categories</h4>
                            <p className="text-gray-300 text-sm mb-3">
                                Configure point values for different statistical categories.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                Edit Scoring
                            </motion.button>
                        </div>
                    </div>
                </Widget>

                <Widget
                    title="Position Settings"
                    icon={<SettingsIcon />}
                >
                    <div className="space-y-3">
                        <div className="text-center py-8 text-gray-400">
                            <SettingsIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Position scoring setup</p>
                            <p className="text-sm">Configure position-specific scoring rules</p>
                        </div>
                    </div>
                </Widget>

                <Widget
                    title="Bonus Rules"
                    icon={<SettingsIcon />}
                >
                    <div className="space-y-3">
                        <div className="text-center py-8 text-gray-400">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/5 flex items-center justify-center">
                                <SettingsIcon className="w-6 h-6 opacity-50" />
                            </div>
                            <p>Bonus scoring rules</p>
                            <p className="text-sm">Set up performance bonuses</p>
                        </div>
                    </div>
                </Widget>
            </div>
        </div>
    );
};

export default CustomScoringEditorView;
