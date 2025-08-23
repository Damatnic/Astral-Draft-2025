import React from 'react';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { motion } from 'framer-motion';
import { DollarSignIcon } from '../components/icons/DollarSignIcon';

const FinanceTrackerView: React.FC = () => {
    const { league } = useLeague();

    if (!league) {
        return <ErrorDisplay message="No league selected" />;
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-3 mb-6">
                <DollarSignIcon className="w-8 h-8 text-green-400" />
                <h1 className="text-2xl font-bold">Finance Tracker</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Widget
                    title="Budget Overview"
                    icon={<DollarSignIcon />}
                    className="lg:col-span-2"
                >
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">League Financial Summary</h3>
                            <p className="text-gray-300 mb-4">
                                Track your league's financial health and budget allocations.
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-400">$200</div>
                                    <div className="text-sm text-gray-400">Budget Cap</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-400">$150</div>
                                    <div className="text-sm text-gray-400">Avg Spent</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-400">$50</div>
                                    <div className="text-sm text-gray-400">Avg Remaining</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Budget Breakdown</h4>
                            <p className="text-gray-300 text-sm mb-3">
                                View detailed breakdown of spending across all teams.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                View Breakdown
                            </motion.button>
                        </div>
                    </div>
                </Widget>

                <Widget
                    title="Team Budgets"
                    icon={<DollarSignIcon />}
                >
                    <div className="space-y-3">
                        <div className="text-center py-8 text-gray-400">
                            <DollarSignIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Budget data loading...</p>
                            <p className="text-sm">Team budget information will appear here</p>
                        </div>
                    </div>
                </Widget>

                <Widget
                    title="Transaction History"
                    icon={<DollarSignIcon />}
                >
                    <div className="space-y-3">
                        <div className="text-center py-8 text-gray-400">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/5 flex items-center justify-center">
                                <DollarSignIcon className="w-6 h-6 opacity-50" />
                            </div>
                            <p>No transactions yet</p>
                            <p className="text-sm">Transaction history will appear here</p>
                        </div>
                    </div>
                </Widget>
            </div>
        </div>
    );
};

export default FinanceTrackerView;
