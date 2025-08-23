/**
 * League Management Interface
 * Comprehensive dashboard for league administration and commissioner controls
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SettingsIcon, 
    UsersIcon, 
    ShieldIcon, 
    CalendarIcon,
    BarChart3Icon,
    PlusIcon,
    CrownIcon
} from 'lucide-react';
import { Widget } from '../ui/Widget';
import { useAuth } from '../../contexts/AuthContext';
import { 
    leagueManagementService, 
    type League, 
    type LeagueSettings,
    type LeagueInvitation,
    type CommissionerAction
} from '../../services/leagueManagementService';

interface Props {
    leagueId?: string;
    className?: string;
}

// Helper function to get status badge styles
const getStatusBadgeStyles = (status: string): string => {
    switch (status) {
        case 'active':
            return 'bg-green-500/20 text-green-400';
        case 'draft':
            return 'bg-blue-500/20 text-blue-400';
        case 'completed':
            return 'bg-purple-500/20 text-purple-400';
        default:
            return 'bg-gray-500/20 text-gray-400';
    }
};

type Tab = 'overview' | 'members' | 'settings' | 'history' | 'commissioner';

const LeagueManagementInterface: React.FC<Props> = ({ 
    leagueId, 
    className = '' 
}) => {
    const { user, isAuthenticated } = useAuth();
    const [league, setLeague] = useState<League | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLeagues, setUserLeagues] = useState<League[]>([]);
    const [invitations, setInvitations] = useState<LeagueInvitation[]>([]);
    const [editingSettings, setEditingSettings] = useState(false);
    const [pendingAction, setPendingAction] = useState<CommissionerAction | null>(null);

    // Load league data
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Load user's leagues
                const leagues = await leagueManagementService.getUserLeagues(user.id.toString());
                setUserLeagues(leagues);

                // Load invitations
                const userInvites = await leagueManagementService.getUserInvitations(user.email || '');
                setInvitations(userInvites);

                // Load specific league if provided
                if (leagueId) {
                    const leagueData = await leagueManagementService.getLeague(leagueId);
                    setLeague(leagueData);
                } else if (leagues.length > 0) {
                    setLeague(leagues[0]);
                }
            } catch (err) {
                console.error('Failed to load league data:', err);
                setError('Failed to load league information');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [leagueId, isAuthenticated, user]);

    // Check if user is commissioner
    const isCommissioner = league && user && league.commissionerId === user.id.toString();

    // Handle creating new league
    const handleCreateLeague = () => {
        // Show placeholder message - full implementation would show creation modal
        console.log('Create league modal not yet implemented');
    };

    // Handle invitation responses
    const handleAcceptInvitation = async (invitationId: string) => {
        if (!user) return;
        
        try {
            // For now, use placeholder values - in a real app, these would come from a form
            await leagueManagementService.acceptInvitation(
                invitationId, 
                user.id.toString(), 
                user.username || 'Player', 
                `${user.username || 'Player'}'s Team`
            );
            // Refresh invitations
            if (user.email) {
                const userInvites = await leagueManagementService.getUserInvitations(user.email);
                setInvitations(userInvites);
            }
        } catch (err) {
            console.error('Failed to accept invitation:', err);
            setError('Failed to accept invitation');
        }
    };

    const handleDeclineInvitation = async (invitationId: string) => {
        try {
            await leagueManagementService.declineInvitation(invitationId);
            // Refresh invitations
            if (user?.email) {
                const userInvites = await leagueManagementService.getUserInvitations(user.email);
                setInvitations(userInvites);
            }
        } catch (err) {
            console.error('Failed to decline invitation:', err);
            setError('Failed to decline invitation');
        }
    };

    // Handle setting updates
    const handleSettingsUpdate = async (updates: Partial<LeagueSettings>) => {
        if (!league || !user || !isCommissioner) return;

        try {
            const updatedLeague = await leagueManagementService.updateLeagueSettings(
                league.id,
                user.id.toString(),
                updates
            );
            setLeague(updatedLeague);
            setEditingSettings(false);
        } catch (err) {
            console.error('Failed to update settings:', err);
            setError('Failed to update league settings');
        }
    };

    // Handle member invitation
    const handleInviteMember = async (email: string, message?: string) => {
        if (!league || !user || !isCommissioner) return;

        try {
            await leagueManagementService.inviteMember(league.id, user.id.toString(), email, message);
            // Refresh league data
            const updatedLeague = await leagueManagementService.getLeague(league.id);
            if (updatedLeague) setLeague(updatedLeague);
        } catch (err) {
            console.error('Failed to invite member:', err);
            setError('Failed to send invitation');
        }
    };

    // Handle member removal
    const handleRemoveMember = async (memberId: string, reason: string) => {
        if (!league || !user || !isCommissioner) return;

        try {
            const updatedLeague = await leagueManagementService.removeMember(
                league.id,
                user.id.toString(),
                memberId,
                reason
            );
            setLeague(updatedLeague);
        } catch (err) {
            console.error('Failed to remove member:', err);
            setError('Failed to remove member');
        }
    };

    // Handle commissioner action
    const handleCommissionerAction = async (action: CommissionerAction) => {
        if (!league || !user || !isCommissioner) return;

        try {
            const updatedLeague = await leagueManagementService.executeCommissionerAction(
                league.id,
                user.id.toString(),
                action
            );
            setLeague(updatedLeague);
            setPendingAction(null);
        } catch (err) {
            console.error('Failed to execute commissioner action:', err);
            setError('Failed to execute action');
        }
    };

    if (!isAuthenticated) {
        return (
            <Widget title="League Management" className={className}>
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                        Please log in to manage your leagues
                    </div>
                </div>
            </Widget>
        );
    }

    if (loading) {
        return (
            <Widget title="League Management" className={className}>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    <span className="ml-2 text-gray-400">Loading league data...</span>
                </div>
            </Widget>
        );
    }

    if (error) {
        return (
            <Widget title="League Management" className={className}>
                <div className="text-center py-8">
                    <div className="text-red-400 mb-4">{error}</div>
                    <button 
                        onClick={() => setError(null)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            </Widget>
        );
    }

    return (
        <div className={`league-management-interface ${className}`}>
            {/* League Selector */}
            <Widget title="League Management" className="bg-gray-900/50 mb-6">
                <div className="flex flex-wrap items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <select
                            value={league?.id || ''}
                            onChange={(e: any) => {
                                const selectedLeague = userLeagues.find((l: any) => l.id === e.target.value);
                                setLeague(selectedLeague || null);
                            }}
                            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        >
                            <option value="">Select a League</option>
                            {userLeagues.map((l: any) => (
                                <option key={l.id} value={l.id}>
                                    {l.name} {l.commissionerId === user?.id.toString() && '(Commissioner)'}
                                </option>
                            ))}
                        </select>
                        
                        <button
                            onClick={handleCreateLeague}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Create League</span>
                        </button>
                    </div>

                    {league && (
                        <div className="flex items-center space-x-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeStyles(league?.status)}`}>
                                {league.status.toUpperCase()}
                            </div>
                            {isCommissioner && (
                                <div className="flex items-center space-x-1 text-yellow-400">
                                    <CrownIcon className="w-4 h-4" />
                                    <span className="text-xs font-medium">Commissioner</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <div className="bg-blue-900/20 rounded-lg p-4 mb-4">
                        <h3 className="text-lg font-semibold text-blue-400 mb-3">
                            Pending Invitations ({invitations.length})
                        </h3>
                        <div className="space-y-2">
                            {invitations.map((invitation: any) => (
                                <InvitationCard
                                    key={invitation.id}
                                    invitation={invitation}
                                    onAccept={() => handleAcceptInvitation(invitation.id)}
                                    onDecline={() => handleDeclineInvitation(invitation.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                {league && (
                    <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3Icon },
                            { id: 'members', label: 'Members', icon: UsersIcon },
                            { id: 'settings', label: 'Settings', icon: SettingsIcon },
                            { id: 'history', label: 'History', icon: CalendarIcon },
                            ...(isCommissioner ? [{ id: 'commissioner', label: 'Commissioner', icon: ShieldIcon }] : [])
                        ].map((tab: any) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                    activeTab === tab.id 
                                        ? 'bg-blue-600 text-white' 
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </Widget>

            {/* Tab Content */}
            {league && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && (
                            <LeagueOverview league={league} />
                        )}
                        
                        {activeTab === 'members' && (
                            <MembersManagement 
                                league={league}
                                isCommissioner={isCommissioner}
                                onInvite={handleInviteMember}
                                onRemove={handleRemoveMember}
                            />
                        )}
                        
                        {activeTab === 'settings' && (
                            <LeagueSettingsPanel
                                league={league}
                                isCommissioner={isCommissioner}
                                editing={editingSettings}
                                onEdit={() => setEditingSettings(true)}
                                onSave={handleSettingsUpdate}
                                onCancel={() => setEditingSettings(false)}
                            />
                        )}
                        
                        {activeTab === 'history' && (
                            <LeagueHistory league={league} />
                        )}
                        
                        {activeTab === 'commissioner' && isCommissioner && (
                            <CommissionerPanel
                                league={league}
                                onAction={handleCommissionerAction}
                                pendingAction={pendingAction}
                                setPendingAction={setPendingAction}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

// Sub-components for each tab
const LeagueOverview: React.FC<{ league: League }> = ({ league }) => {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* League Info */}
            <Widget title="League Information" className="bg-gray-900/50">
                <div className="space-y-3">
                    <div>
                        <div className="text-sm text-gray-400">League Name</div>
                        <div className="text-white font-medium">{league.name}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-400">Commissioner</div>
                        <div className="text-white">{league.commissionerName}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-400">Members</div>
                        <div className="text-white">{league.members.length}/{league.maxMembers}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-400">Format</div>
                        <div className="text-white">
                            {league.settings.leagueSize}-team {league.settings.scoringSystem.toUpperCase()}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-400">Season</div>
                        <div className="text-white">{league.seasonYear}</div>
                    </div>
                </div>
            </Widget>

            {/* Standings Preview */}
            <Widget title="Current Standings" className="bg-gray-900/50">
                <div className="space-y-2">
                    {league.members
                        .filter((m: any) => m.record)
                        .sort((a, b) => (b.record?.wins || 0) - (a.record?.wins || 0))
                        .slice(0, 5)
                        .map((member, index) => (
                            <div key={member.userId} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                                <div className="flex items-center space-x-3">
                                    <span className="text-gray-400 text-sm w-4">#{index + 1}</span>
                                    <div>
                                        <div className="text-white font-medium">{member.teamName}</div>
                                        <div className="text-xs text-gray-400">{member.username}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-medium">
                                        {member.record?.wins}-{member.record?.losses}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {member.record?.pointsFor.toFixed(1)} PF
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </Widget>

            {/* Recent Activity */}
            <Widget title="Recent Activity" className="bg-gray-900/50">
                <div className="space-y-2">
                    {league.history.slice(0, 5).map((event: any) => (
                        <div key={event.id} className="py-2 border-b border-gray-700 last:border-b-0">
                            <div className="text-sm text-white">{event.description}</div>
                            <div className="text-xs text-gray-400">
                                {new Date(event.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            </Widget>
        </div>
    );
};

const InvitationCard: React.FC<{
    invitation: LeagueInvitation;
    onAccept: () => void;
    onDecline: () => void;
}> = ({ invitation, onAccept, onDecline }) => {
    return (
        <div className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
            <div>
                <div className="text-white font-medium">{invitation.leagueName}</div>
                <div className="text-sm text-gray-400">
                    Invited by {invitation.invitedByName}
                </div>
                {invitation.message && (
                    <div className="text-xs text-gray-500 mt-1">{invitation.message}</div>
                )}
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={onAccept}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                    Accept
                </button>
                <button
                    onClick={onDecline}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                    Decline
                </button>
            </div>
        </div>
    );
};

// Placeholder components for other tabs
const MembersManagement: React.FC<any> = () => <div>Members Management - Coming Soon</div>;
const LeagueSettingsPanel: React.FC<any> = () => <div>League Settings - Coming Soon</div>;
const LeagueHistory: React.FC<any> = () => <div>League History - Coming Soon</div>;
const CommissionerPanel: React.FC<any> = () => <div>Commissioner Panel - Coming Soon</div>;

export default LeagueManagementInterface;
