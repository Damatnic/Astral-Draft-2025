/**
 * Enhanced Mobile Dashboard View
 * Mobile-responsive dashboard with touch-friendly components
 */

import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { motion } from 'framer-motion';
import { View } from '../types';
import MobilePullToRefresh from '../components/mobile/MobilePullToRefresh';
import { 
    TrophyIcon,
    BarChart3Icon,
    UsersIcon,
    CalendarIcon,
    TrendingUpIcon,
    BellIcon,
    PlusIcon,
    SearchIcon
} from 'lucide-react';

interface MobileDashboardWidgetProps {
    title: string;
    icon: React.ReactNode;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'stable';
    color: string;
    onClick?: () => void;
}

const MobileDashboardWidget: React.FC<MobileDashboardWidgetProps> = ({
    title,
    icon,
    value,
    subtitle,
    trend,
    color,
    onClick
}) => {
    const getTrendColor = (trendType: 'up' | 'down' | 'stable') => {
        switch (trendType) {
            case 'up': return 'text-green-400';
            case 'down': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-4 cursor-pointer hover:border-blue-400/50 transition-colors ${onClick ? 'active:bg-[var(--panel-hover)]' : ''}`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${color}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`text-xs ${getTrendColor(trend)}`}>
                        <TrendingUpIcon className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
                    </div>
                )}
            </div>
            
            <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                {value}
            </div>
            
            <div className="text-sm text-[var(--text-secondary)]">
                {title}
            </div>
            
            {subtitle && (
                <div className="text-xs text-[var(--text-tertiary)] mt-1">
                    {subtitle}
                </div>
            )}
        </motion.div>
    );
};

interface QuickActionProps {
    icon: React.ReactNode;
    label: string;
    color: string;
    onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, color, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={`flex flex-col items-center gap-2 p-4 rounded-lg border border-[var(--panel-border)] hover:border-blue-400/50 transition-colors ${color}`}
    >
        <div className="w-8 h-8 flex items-center justify-center">
            {icon}
        </div>
        <span className="text-xs text-[var(--text-primary)] font-medium">
            {label}
        </span>
    </motion.button>
);

const EnhancedDashboardView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const activeLeague = state.leagues.find(l => l.id === state.activeLeagueId);

    const handleRefresh = async () => {
        // Simulate data refresh
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Here you would typically trigger actual data fetching
    };

    const handleViewChange = (view: View) => {
        dispatch({ type: 'SET_VIEW', payload: view });
    };

    const mockData = {
        totalPoints: '1,247.6',
        weeklyRank: '3rd',
        leagueCount: state.leagues.length,
        activeMatchups: 2,
        notifications: 5
    };

    if (isMobile) {
        return (
            <div className="h-full bg-[var(--app-bg)]">
                <MobilePullToRefresh onRefresh={handleRefresh}>
                    <div className="p-4 space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                                    Dashboard
                                </h1>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Welcome back, {state.user.name}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                    <SearchIcon className="w-5 h-5" />
                                </button>
                                <button className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                    <BellIcon className="w-5 h-5" />
                                    {mockData.notifications > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {mockData.notifications}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <MobileDashboardWidget
                                title="Total Points"
                                icon={<TrophyIcon className="w-5 h-5 text-white" />}
                                value={mockData.totalPoints}
                                subtitle="Season total"
                                trend="up"
                                color="bg-blue-500"
                                onClick={() => handleViewChange('ANALYTICS_HUB')}
                            />
                            
                            <MobileDashboardWidget
                                title="Weekly Rank"
                                icon={<BarChart3Icon className="w-5 h-5 text-white" />}
                                value={mockData.weeklyRank}
                                subtitle="This week"
                                trend="stable"
                                color="bg-green-500"
                                onClick={() => handleViewChange('LEAGUE_STANDINGS')}
                            />
                            
                            <MobileDashboardWidget
                                title="My Leagues"
                                icon={<UsersIcon className="w-5 h-5 text-white" />}
                                value={mockData.leagueCount}
                                subtitle="Active leagues"
                                color="bg-purple-500"
                                onClick={() => handleViewChange('LEAGUE_HUB')}
                            />
                            
                            <MobileDashboardWidget
                                title="Matchups"
                                icon={<CalendarIcon className="w-5 h-5 text-white" />}
                                value={mockData.activeMatchups}
                                subtitle="This week"
                                color="bg-orange-500"
                                onClick={() => handleViewChange('MATCHUP')}
                            />
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                                Quick Actions
                            </h2>
                            <div className="grid grid-cols-4 gap-3">
                                <QuickAction
                                    icon={<PlusIcon className="w-5 h-5 text-blue-400" />}
                                    label="Create League"
                                    color="bg-blue-500/10"
                                    onClick={() => handleViewChange('CREATE_LEAGUE')}
                                />
                                
                                <QuickAction
                                    icon={<TrophyIcon className="w-5 h-5 text-green-400" />}
                                    label="Draft Room"
                                    color="bg-green-500/10"
                                    onClick={() => handleViewChange('DRAFT_ROOM')}
                                />
                                
                                <QuickAction
                                    icon={<BarChart3Icon className="w-5 h-5 text-purple-400" />}
                                    label="Analytics"
                                    color="bg-purple-500/10"
                                    onClick={() => handleViewChange('ANALYTICS_HUB')}
                                />
                                
                                <QuickAction
                                    icon={<UsersIcon className="w-5 h-5 text-orange-400" />}
                                    label="Teams"
                                    color="bg-orange-500/10"
                                    onClick={() => handleViewChange('TEAM_HUB')}
                                />
                            </div>
                        </div>

                        {/* Active League Summary */}
                        {activeLeague && (
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                                    Current League
                                </h2>
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleViewChange('LEAGUE_HUB')}
                                    className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-4 cursor-pointer hover:border-blue-400/50 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium text-[var(--text-primary)]">
                                            {activeLeague.name}
                                        </h3>
                                        <span className="text-sm text-[var(--text-secondary)]">
                                            Week {activeLeague.currentWeek}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className="text-lg font-bold text-[var(--text-primary)]">
                                                {activeLeague.teams.length}
                                            </div>
                                            <div className="text-xs text-[var(--text-secondary)]">
                                                Teams
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="text-lg font-bold text-[var(--text-primary)]">
                                                {activeLeague.schedule?.filter(m => m.week === activeLeague.currentWeek).length || 0}
                                            </div>
                                            <div className="text-xs text-[var(--text-secondary)]">
                                                Matchups
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="text-lg font-bold text-[var(--text-primary)]">
                                                $200
                                            </div>
                                            <div className="text-xs text-[var(--text-secondary)]">
                                                Budget
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Recent Activity */}
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                                Recent Activity
                            </h2>
                            <div className="space-y-2">
                                {[
                                    { text: "John drafted Patrick Mahomes", time: "2 minutes ago", type: "draft" },
                                    { text: "Trade proposal received", time: "1 hour ago", type: "trade" },
                                    { text: "Waiver claim processed", time: "3 hours ago", type: "waiver" }
                                ].map((activity) => (
                                    <div key={`${activity.type}-${activity.time}`} className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-[var(--text-primary)]">
                                                {activity.text}
                                            </span>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {activity.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom padding for mobile navigation */}
                        <div className="h-20" />
                    </div>
                </MobilePullToRefresh>
            </div>
        );
    }

    // Fallback to original dashboard for desktop
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
                Dashboard
            </h1>
            <p className="text-[var(--text-secondary)]">
                This is the desktop version of the dashboard.
                Mobile optimizations are active on screens ≤ 768px wide.
            </p>
        </div>
    );
};

export default EnhancedDashboardView;
