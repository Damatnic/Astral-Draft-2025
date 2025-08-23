
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../contexts/AppContext';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { Widget } from '../components/ui/Widget';
import LeagueSettingsEditor from '../components/commissioner/LeagueSettingsEditor';
import EnhancedMemberManagement from '../components/commissioner/EnhancedMemberManagement';
import SeasonManagement from '../components/commissioner/SeasonManagement';
import type { League } from '../types';
import { useLeague } from '../hooks/useLeague';
import { ShieldAlertIcon } from '../components/icons/ShieldAlertIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { PauseIcon } from '../components/icons/PauseIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { MegaphoneIcon } from '../components/icons/MegaphoneIcon';
import CreatePollModal from '../components/commissioner/CreatePollModal';
import PostAnnouncementModal from '../components/commissioner/PostAnnouncementModal';
import { ArrowRightLeftIcon } from '../components/icons/ArrowRightLeftIcon';
import ManageTradesModal from '../components/commissioner/ManageTradesModal';
import { UserPlusIcon } from '../components/icons/UserPlusIcon';
import InviteMemberModal from '../components/commissioner/InviteMemberModal';
import MemberManagementWidget from '../components/commissioner/MemberManagementWidget';
import { SettingsIcon } from '../components/icons/SettingsIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { FileTextIcon } from '../components/icons/FileTextIcon';

const CommissionerToolsContent: React.FC<{ league: League; dispatch: React.Dispatch<any> }> = ({ league, dispatch }) => {
    const { state } = useAppState();
    const [isPollModalOpen, setIsPollModalOpen] = React.useState(false);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = React.useState(false);
    const [isManageTradesModalOpen, setIsManageTradesModalOpen] = React.useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'tools' | 'members' | 'season'>('tools');
    
    const isDrafting = league?.status === 'DRAFTING';
    const isPostDraft = league && league.status !== 'PRE_DRAFT' && league.status !== 'DRAFTING';

    const handleAdvanceWeek = () => {
        if(window.confirm(`Are you sure you want to advance to Week ${league.currentWeek + 1}? This cannot be undone.`)) {
            dispatch({ type: 'ADVANCE_WEEK', payload: { leagueId: league.id } });
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Manually advancing to Week ${league.currentWeek + 1}...`, type: 'SYSTEM' } });
        }
    };

    const tabs = [
        { id: 'tools', label: 'Commissioner Tools', icon: '🔧' },
        { id: 'members', label: 'Member Management', icon: '👥' },
        { id: 'season', label: 'Season Management', icon: '📅' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'members':
                return <EnhancedMemberManagement league={league} dispatch={dispatch} />;
            case 'season':
                return <SeasonManagement league={league} dispatch={dispatch} />;
            default:
                return renderToolsTab();
        }
    };

    const renderToolsTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-6">
                <Widget title="Communication">
                    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                        <button onClick={() => setIsPollModalOpen(true)} className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 mobile-touch-target">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base"><ClipboardListIcon /> Create Poll</h3>
                            <p className="text-xs text-gray-400 mt-1">Poll league members on important decisions.</p>
                        </button>
                        <button onClick={() => setIsAnnouncementModalOpen(true)} className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 mobile-touch-target">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base"><MegaphoneIcon /> Post Announcement</h3>
                            <p className="text-xs text-gray-400 mt-1">Send league-wide announcements.</p>
                        </button>
                    </div>
                </Widget>
                <Widget title="League Settings">
                    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                        <button 
                            onClick={() => setIsSettingsModalOpen(true)} 
                            className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 mobile-touch-target"
                        >
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
                                <SettingsIcon className="w-4 h-4" /> League Settings
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Configure league rules and settings.</p>
                        </button>
                        <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'EDIT_SCORING' })} className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 mobile-touch-target">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base"><PencilIcon /> Edit Scoring Rules</h3>
                            <p className="text-xs text-gray-400 mt-1">Customize your league's scoring system.</p>
                        </button>
                        <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'SCHEDULE_MANAGEMENT' })} disabled={!isPostDraft} className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base"><CalendarIcon /> Edit Schedule</h3>
                            <p className="text-xs text-gray-400 mt-1">View and manually adjust weekly matchups.</p>
                        </button>
                         <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_CONSTITUTION' })} className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 mobile-touch-target">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base"><FileTextIcon /> Generate Constitution</h3>
                            <p className="text-xs text-gray-400 mt-1">Create a formal league constitution document.</p>
                        </button>
                    </div>
                </Widget>
                <MemberManagementWidget league={league} dispatch={dispatch} />
            </div>
            <div className="space-y-4 sm:space-y-6">
                 <Widget title="In-Season Management">
                     <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                         <button onClick={() => setIsManageTradesModalOpen(true)} disabled={!isPostDraft} className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base"><ArrowRightLeftIcon /> Manage Trades</h3>
                            <p className="text-xs text-gray-400 mt-1">Review, force, or veto pending trades in the league.</p>
                        </button>
                         <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'EDIT_ROSTER' })} disabled={!isPostDraft} className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base"><PencilIcon /> Edit Rosters</h3>
                            <p className="text-xs text-gray-400 mt-1">Manually add or remove players from any team's roster.</p>
                        </button>
                         <button onClick={() => dispatch({ type: 'PAUSE_DRAFT', payload: !state.isDraftPaused })} disabled={!isDrafting} className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base"><PauseIcon /> {state.isDraftPaused ? 'Resume Draft' : 'Pause Draft'}</h3>
                            <p className="text-xs text-gray-400 mt-1">Temporarily pause or unpause a live draft.</p>
                        </button>
                        <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'FINANCE_TRACKER' })} className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 mobile-touch-target">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base"><PencilIcon /> Financials</h3>
                            <p className="text-xs text-gray-400 mt-1">Track league dues and payouts.</p>
                        </button>
                     </div>
                </Widget>
                <Widget title="Membership">
                    <div className="p-3 sm:p-4">
                         <button onClick={() => setIsInviteModalOpen(true)} className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 mobile-touch-target">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base"><UserPlusIcon /> Invite Members</h3>
                            <p className="text-xs text-gray-400 mt-1">Add new managers to your league.</p>
                        </button>
                    </div>
                </Widget>
                 <Widget title="Danger Zone">
                    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                         <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <h3 className="font-semibold text-red-300 text-sm sm:text-base">Advance Week</h3>
                            <p className="text-xs text-gray-400 mt-1 mb-2">Manually process the results of the current week and advance the league to the next week. Use with caution.</p>
                            <button onClick={handleAdvanceWeek} className="w-full sm:w-auto px-4 py-2 bg-red-500/80 text-white font-bold text-sm rounded-lg hover:bg-red-500 mobile-touch-target">
                                Force Advance to Week {league.currentWeek + 1}
                            </button>
                        </div>
                         <div className="p-3 bg-gray-800/50 border border-gray-600/50 rounded-lg">
                            <h3 className="font-semibold text-white flex items-center gap-2"><ShieldAlertIcon /> Project Integrity</h3>
                            <p className="text-xs text-gray-400 mt-1 mb-2">Run a diagnostic scan on the application codebase to check for potential issues.</p>
                            <button
                                onClick={() => dispatch({ type: 'SET_VIEW', payload: 'PROJECT_INTEGRITY' })}
                                className="px-4 py-2 bg-gray-600/80 text-white font-bold text-sm rounded-lg hover:bg-gray-500"
                            >
                                Run Integrity Scan
                            </button>
                        </div>
                    </div>
                </Widget>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Back to Dashboard"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Commissioner Tools</h1>
                        <p className="text-sm text-[var(--text-secondary)]">Manage {league.name}</p>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="flex border-b border-[var(--panel-border)] mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'tools' | 'members' | 'season')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <main className="flex-1 overflow-y-auto">
                {renderTabContent()}
            </main>

            {/* Modals */}
            <AnimatePresence>
                {isPollModalOpen && (
                    <CreatePollModal leagueId={league.id} onClose={() => setIsPollModalOpen(false)} />
                )}
                {isAnnouncementModalOpen && (
                    <PostAnnouncementModal leagueId={league.id} onClose={() => setIsAnnouncementModalOpen(false)} />
                )}
                {isManageTradesModalOpen && (
                    <ManageTradesModal league={league} onClose={() => setIsManageTradesModalOpen(false)} />
                )}
                {isInviteModalOpen && (
                    <InviteMemberModal league={league} onClose={() => setIsInviteModalOpen(false)} />
                )}
                {isSettingsModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
                        onClick={(e) => e.target === e.currentTarget && setIsSettingsModalOpen(false)}
                    >
                        <LeagueSettingsEditor 
                            league={league} 
                            onClose={() => setIsSettingsModalOpen(false)}
                            onSave={(settings) => {
                                dispatch({ type: 'UPDATE_LEAGUE_SETTINGS', payload: { leagueId: league.id, settings } });
                                setIsSettingsModalOpen(false);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CommissionerToolsView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    
    if (!league || state.user.id !== league.commissionerId) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p className="text-red-400">Access Denied. You are not the commissioner of this league.</p>
                 <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    return <CommissionerToolsContent league={league} dispatch={dispatch} />;
};

export default CommissionerToolsView;
