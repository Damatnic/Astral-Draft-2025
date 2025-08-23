/**
 * Main Oracle Dashboard Container
 * Integrates user dashboard with performance analytics and insights
 */

import React, { useState } from 'react';
import OracleUserDashboard from './OracleUserDashboard';
import { Widget } from '../ui/Widget';
import { 
    Brain, 
    TrendingUp, 
    Target, 
    Users, 
    BarChart3,
    Settings,
    RefreshCw
} from 'lucide-react';

interface DashboardTab {
    id: string;
    label: string;
    icon: React.ReactNode;
    component: React.ReactNode;
}

const OracleDashboardContainer: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate refresh delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsRefreshing(false);
    };

    const tabs: DashboardTab[] = [
        {
            id: 'overview',
            label: 'Overview',
            icon: <BarChart3 className="w-4 h-4" />,
            component: <OracleUserDashboard />
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: <TrendingUp className="w-4 h-4" />,
            component: (
                <Widget title="Advanced Analytics">
                    <div className="p-6 text-center text-gray-400">
                        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
                        <p className="text-sm">
                            Detailed statistical analysis and predictive modeling insights coming soon.
                        </p>
                    </div>
                </Widget>
            )
        },
        {
            id: 'comparison',
            label: 'Comparisons',
            icon: <Users className="w-4 h-4" />,
            component: (
                <Widget title="User Comparisons">
                    <div className="p-6 text-center text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Peer Comparisons</h3>
                        <p className="text-sm">
                            Compare your performance with other Oracle users and see how you rank.
                        </p>
                    </div>
                </Widget>
            )
        },
        {
            id: 'insights',
            label: 'AI Insights',
            icon: <Brain className="w-4 h-4" />,
            component: (
                <Widget title="AI-Powered Insights">
                    <div className="p-6 text-center text-gray-400">
                        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">AI Insights</h3>
                        <p className="text-sm">
                            Machine learning-powered recommendations and pattern analysis.
                        </p>
                    </div>
                </Widget>
            )
        },
        {
            id: 'goals',
            label: 'Goals',
            icon: <Target className="w-4 h-4" />,
            component: (
                <Widget title="Performance Goals">
                    <div className="p-6 text-center text-gray-400">
                        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Performance Goals</h3>
                        <p className="text-sm">
                            Set and track your prediction accuracy goals and milestones.
                        </p>
                    </div>
                </Widget>
            )
        }
    ];

    return (
        <div className="oracle-dashboard-container">
            {/* Dashboard Header */}
            <div className="dashboard-header mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Brain className="w-8 h-8 text-purple-500" />
                        <div>
                            <h1 className="text-3xl font-bold text-white">Oracle Dashboard</h1>
                            <p className="text-gray-400">
                                Track your prediction performance and get personalized insights
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        
                        <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="dashboard-tabs mb-6">
                <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="dashboard-content">
                {tabs.find((tab: any) => tab.id === activeTab)?.component}
            </div>

            {/* Quick Stats Footer */}
            <div className="dashboard-footer mt-8 p-4 bg-gray-800/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-blue-500">68.1%</div>
                        <div className="text-sm text-gray-400">Season Accuracy</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-500">47</div>
                        <div className="text-sm text-gray-400">Total Predictions</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-yellow-500">#15</div>
                        <div className="text-sm text-gray-400">Global Rank</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-purple-500">320</div>
                        <div className="text-sm text-gray-400">Oracle Points</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OracleDashboardContainer;
