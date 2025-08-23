/**
 * Comprehensive Team Management Interface
 * Advanced roster editing, lineup optimization, and player transaction history
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { BarChartIcon } from '../components/icons/BarChartIcon';
import { Player, Team, League, PlayerPosition } from '../types';
import EnhancedRosterManager from '../components/team/EnhancedRosterManager';
import LineupOptimizer from '../components/team/LineupOptimizer';
import TransactionHistory from '../components/team/TransactionHistory';
import TeamAnalyticsDashboard from '../components/team/TeamAnalyticsDashboard';

type TabType = 'roster' | 'lineup' | 'transactions' | 'analytics';

interface TeamManagementViewProps {}

const TeamManagementView: React.FC<TeamManagementViewProps> = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    const [activeTab, setActiveTab] = React.useState<TabType>('roster');
    const [selectedTeamId, setSelectedTeamId] = React.useState<number | null>(null);

    if (!league) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p className="text-red-400">No league selected</p>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Get user's team
    const userTeam = league.teams.find(team => team.owner.id === state.user.id);
    
    // Initialize selected team to user's team
    React.useEffect(() => {
        if (userTeam && !selectedTeamId) {
            setSelectedTeamId(userTeam.id);
        }
    }, [userTeam, selectedTeamId]);

    const selectedTeam = league.teams.find(team => team.id === selectedTeamId);
    const isCommissioner = state.user?.id === league.commissionerId;
    const canManageTeam = Boolean(selectedTeam && state.user && (selectedTeam.owner.id === state.user.id || isCommissioner));

    const tabs = [
        { id: 'roster', label: 'Roster Management', icon: <UsersIcon className="w-4 h-4" />, description: 'Edit roster, manage positions, view player details' },
        { id: 'lineup', label: 'Lineup Optimizer', icon: <TrendingUpIcon className="w-4 h-4" />, description: 'AI-powered lineup suggestions and optimization' },
        { id: 'transactions', label: 'Transaction History', icon: <ClockIcon className="w-4 h-4" />, description: 'Complete history of adds, drops, trades, and waivers' },
        { id: 'analytics', label: 'Team Analytics', icon: <BarChartIcon className="w-4 h-4" />, description: 'Performance metrics, trends, and insights' }
    ];

    const renderTabContent = () => {
        if (!selectedTeam) {
            return (
                <div className="p-8 text-center">
                    <p className="text-gray-400">Please select a team to manage</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'roster':
                return <EnhancedRosterManager team={selectedTeam} league={league} dispatch={dispatch} canEdit={canManageTeam} />;
            case 'lineup':
                return <LineupOptimizer team={selectedTeam} league={league} dispatch={dispatch} canEdit={canManageTeam} />;
            case 'transactions':
                return <TransactionHistory team={selectedTeam} league={league} dispatch={dispatch} />;
            case 'analytics':
                return <TeamAnalyticsDashboard team={selectedTeam} league={league} dispatch={dispatch} />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Header */}
            <header className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Back to Team Hub"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Team Management</h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {selectedTeam ? `Managing ${selectedTeam.name}` : 'Advanced roster and lineup tools'}
                        </p>
                    </div>
                </div>

                {/* Team Selector */}
                <div className="flex items-center gap-3">
                    <select
                        value={selectedTeamId || ''}
                        onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                        className="px-3 py-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)] text-sm"
                    >
                        <option value="">Select Team...</option>
                        {league.teams.map((team) => (
                            <option key={team.id} value={team.id}>
                                {team.name} {team.owner.id === state.user.id ? '(You)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Access Control Notice */}
            {selectedTeam && !canManageTeam && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-300 text-sm">
                        <strong>View Only:</strong> You can view {selectedTeam.name}'s information but cannot make changes.
                        {!isCommissioner && " Only team owners and commissioners can edit team settings."}
                    </p>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex flex-col sm:flex-row border-b border-[var(--panel-border)] mb-6 overflow-x-auto">
                <div className="flex min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Description */}
            {selectedTeam && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-300 text-sm">
                        {tabs.find(tab => tab.id === activeTab)?.description}
                    </p>
                </div>
            )}

            {/* Tab Content */}
            <main className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default TeamManagementView;
