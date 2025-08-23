/**
 * Enhanced Member Management Widget
 * Comprehensive member administration with advanced controls
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { UsersIcon } from '../icons/UsersIcon';
import { UserPlusIcon } from '../icons/UserPlusIcon';
import { UserRemoveIcon } from '../icons/UserRemoveIcon';
import { CrownIcon } from '../icons/CrownIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { XIcon } from '../icons/XIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { League, User } from '../../types';

interface EnhancedMemberManagementProps {
    league: League;
    dispatch: React.Dispatch<any>;
}

interface MemberAction {
    type: 'PROMOTE_TO_COMMISSIONER' | 'REMOVE_MEMBER' | 'EDIT_TEAM_NAME' | 'CHANGE_AVATAR' | 'TOGGLE_ADMIN';
    memberId: string;
    data?: any;
}

const EnhancedMemberManagement: React.FC<EnhancedMemberManagementProps> = ({ league, dispatch }) => {
    const [selectedMember, setSelectedMember] = React.useState<string | null>(null);
    const [editMode, setEditMode] = React.useState<{ memberId: string; field: string } | null>(null);
    const [editValue, setEditValue] = React.useState('');
    const [showConfirmAction, setShowConfirmAction] = React.useState<MemberAction | null>(null);

    // Mock members data - in real app this would come from league.members
    const members = [
        { id: '1', name: 'Alice Johnson', teamName: "Alice's Aces", isCommissioner: true, isCoCommissioner: false, avatar: '👩‍💼', joinDate: '2024-08-01', record: '8-4', points: 1245.6, activity: 'Active' },
        { id: '2', name: 'Bob Smith', teamName: 'Smithtown Stallions', isCommissioner: false, isCoCommissioner: true, avatar: '🤠', joinDate: '2024-08-01', record: '7-5', points: 1198.2, activity: 'Active' },
        { id: '3', name: 'Carol Davis', teamName: 'Thunder Bolts', isCommissioner: false, isCoCommissioner: false, avatar: '⚡', joinDate: '2024-08-02', record: '6-6', points: 1087.3, activity: 'Inactive (3 days)' },
        { id: '4', name: 'David Wilson', teamName: 'Wilson Warriors', isCommissioner: false, isCoCommissioner: false, avatar: '⚔️', joinDate: '2024-08-01', record: '9-3', points: 1312.7, activity: 'Active' }
    ];

    const handleMemberAction = (action: MemberAction) => {
        setShowConfirmAction(action);
    };

    const confirmAction = () => {
        if (!showConfirmAction) return;

        switch (showConfirmAction.type) {
            case 'REMOVE_MEMBER':
                dispatch({ 
                    type: 'REMOVE_LEAGUE_MEMBER', 
                    payload: { leagueId: league.id, memberId: showConfirmAction.memberId } 
                });
                dispatch({ 
                    type: 'ADD_NOTIFICATION', 
                    payload: { message: 'Member removed from league', type: 'SYSTEM' } 
                });
                break;
            case 'PROMOTE_TO_COMMISSIONER':
                dispatch({ 
                    type: 'TRANSFER_COMMISSIONER', 
                    payload: { leagueId: league.id, newCommissionerId: showConfirmAction.memberId } 
                });
                dispatch({ 
                    type: 'ADD_NOTIFICATION', 
                    payload: { message: 'Commissioner role transferred', type: 'SYSTEM' } 
                });
                break;
            case 'TOGGLE_ADMIN':
                dispatch({ 
                    type: 'TOGGLE_CO_COMMISSIONER', 
                    payload: { leagueId: league.id, memberId: showConfirmAction.memberId } 
                });
                break;
        }
        setShowConfirmAction(null);
    };

    const startEdit = (memberId: string, field: string, currentValue: string) => {
        setEditMode({ memberId, field });
        setEditValue(currentValue);
    };

    const saveEdit = () => {
        if (!editMode) return;
        
        dispatch({ 
            type: 'UPDATE_MEMBER_INFO', 
            payload: { 
                leagueId: league.id, 
                memberId: editMode.memberId, 
                field: editMode.field,
                value: editValue 
            } 
        });
        setEditMode(null);
        setEditValue('');
    };

    const cancelEdit = () => {
        setEditMode(null);
        setEditValue('');
    };

    return (
        <Widget title="Enhanced Member Management" icon={<UsersIcon className="w-5 h-5" />}>
            <div className="p-4 space-y-4">
                {/* Member Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-500/20 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-400">{members.length}</div>
                        <div className="text-xs text-gray-400">Total Members</div>
                    </div>
                    <div className="bg-green-500/20 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-400">{members.filter(m => m.activity === 'Active').length}</div>
                        <div className="text-xs text-gray-400">Active</div>
                    </div>
                    <div className="bg-yellow-500/20 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-400">{members.filter(m => m.activity.includes('Inactive')).length}</div>
                        <div className="text-xs text-gray-400">Inactive</div>
                    </div>
                    <div className="bg-purple-500/20 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-400">{members.filter(m => m.isCommissioner || m.isCoCommissioner).length}</div>
                        <div className="text-xs text-gray-400">Admins</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <button 
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'INVITE_MEMBERS' })}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                    >
                        <UserPlusIcon className="w-4 h-4" />
                        Invite Members
                    </button>
                    <button 
                        onClick={() => dispatch({ type: 'EXPORT_MEMBER_LIST', payload: league.id })}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                    >
                        📋 Export List
                    </button>
                    <button 
                        onClick={() => dispatch({ type: 'BULK_MESSAGE_MEMBERS', payload: league.id })}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                    >
                        📢 Send Message
                    </button>
                </div>

                {/* Members List */}
                <div className="space-y-3">
                    {members.map((member) => (
                        <motion.div
                            key={member.id}
                            layout
                            className={`p-4 border rounded-lg transition-all ${
                                selectedMember === member.id 
                                    ? 'border-blue-500 bg-blue-500/10' 
                                    : 'border-[var(--panel-border)] hover:border-gray-500'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{member.avatar}</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-[var(--text-primary)]">
                                                {member.name}
                                            </h4>
                                            {member.isCommissioner && (
                                                <span title="Commissioner">
                                                    <CrownIcon className="w-4 h-4 text-yellow-500" />
                                                </span>
                                            )}
                                            {member.isCoCommissioner && (
                                                <span title="Co-Commissioner">
                                                    <ShieldCheckIcon className="w-4 h-4 text-blue-500" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {editMode?.memberId === member.id && editMode?.field === 'teamName' ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={(e: any) => setEditValue(e.target.value)}
                                                        className="px-2 py-1 text-sm border border-[var(--panel-border)] rounded bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                                        autoFocus
                                                    />
                                                    <button onClick={saveEdit} className="text-green-500 hover:text-green-400">
                                                        <CheckIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={cancelEdit} className="text-red-500 hover:text-red-400">
                                                        <XIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-[var(--text-secondary)]">
                                                        {member.teamName}
                                                    </span>
                                                    <button 
                                                        onClick={() => startEdit(member.id, 'teamName', member.teamName)}
                                                        className="text-gray-400 hover:text-[var(--text-primary)]"
                                                    >
                                                        <PencilIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Member Stats */}
                                    <div className="text-right text-sm">
                                        <div className="text-[var(--text-primary)] font-medium">{member.record}</div>
                                        <div className="text-[var(--text-secondary)]">{member.points} pts</div>
                                    </div>

                                    {/* Actions Dropdown */}
                                    <div className="relative">
                                        <button 
                                            onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                                            className="p-2 hover:bg-white/10 rounded-lg"
                                        >
                                            ⋮
                                        </button>
                                        
                                        <AnimatePresence>
                                            {selectedMember === member.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="absolute right-0 top-full mt-1 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg shadow-lg z-10 min-w-[200px]"
                                                >
                                                    <div className="py-1">
                                                        {!member.isCommissioner && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleMemberAction({ 
                                                                        type: 'TOGGLE_ADMIN', 
                                                                        memberId: member.id 
                                                                    })}
                                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                                                                >
                                                                    <ShieldCheckIcon className="w-4 h-4" />
                                                                    {member.isCoCommissioner ? 'Remove Admin' : 'Make Admin'}
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleMemberAction({ 
                                                                        type: 'PROMOTE_TO_COMMISSIONER', 
                                                                        memberId: member.id 
                                                                    })}
                                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                                                                >
                                                                    <CrownIcon className="w-4 h-4" />
                                                                    Make Commissioner
                                                                </button>
                                                            </>
                                                        )}
                                                        <button 
                                                            onClick={() => dispatch({ type: 'VIEW_MEMBER_PROFILE', payload: member.id })}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/10"
                                                        >
                                                            👤 View Profile
                                                        </button>
                                                        <button 
                                                            onClick={() => dispatch({ type: 'MESSAGE_MEMBER', payload: member.id })}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/10"
                                                        >
                                                            💬 Send Message
                                                        </button>
                                                        <hr className="my-1 border-[var(--panel-border)]" />
                                                        {!member.isCommissioner && (
                                                            <button 
                                                                onClick={() => handleMemberAction({ 
                                                                    type: 'REMOVE_MEMBER', 
                                                                    memberId: member.id 
                                                                })}
                                                                className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 text-red-400 flex items-center gap-2"
                                                            >
                                                                <UserRemoveIcon className="w-4 h-4" />
                                                                Remove from League
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Status */}
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-[var(--text-secondary)]">
                                    Joined: {new Date(member.joinDate).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-1 rounded-full ${
                                    member.activity === 'Active' 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                    {member.activity}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Confirmation Modal */}
                <AnimatePresence>
                    {showConfirmAction && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
                            onClick={(e: any) => e.target === e.currentTarget && setShowConfirmAction(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg shadow-xl p-6 max-w-md w-full"
                            >
                                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                                    Confirm Action
                                </h3>
                                <p className="text-[var(--text-secondary)] mb-6">
                                    {showConfirmAction.type === 'REMOVE_MEMBER' && 'Are you sure you want to remove this member from the league?'}
                                    {showConfirmAction.type === 'PROMOTE_TO_COMMISSIONER' && 'Are you sure you want to transfer commissioner rights to this member?'}
                                    {showConfirmAction.type === 'TOGGLE_ADMIN' && 'Are you sure you want to change this member\'s admin status?'}
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowConfirmAction(null)}
                                        className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmAction}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Widget>
    );
};

export default EnhancedMemberManagement;
