/**
 * Season Management Component
 * Advanced season administration and control panel
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { CalendarIcon } from '../icons/CalendarIcon';
import { PlayIcon } from '../icons/PlayIcon';
import { PauseIcon } from '../icons/PauseIcon';
import { StopIcon } from '../icons/StopIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { AdjustmentsIcon } from '../icons/AdjustmentsIcon';
import { League } from '../../types';

interface SeasonManagementProps {
    league: League;
    dispatch: React.Dispatch<any>;
}

interface SeasonAction {
    type: 'ADVANCE_WEEK' | 'RESET_WEEK' | 'END_SEASON' | 'MANUAL_SCORE_ADJUSTMENT' | 'FORCE_SYNC';
    data?: any;
}

const SeasonManagement: React.FC<SeasonManagementProps> = ({ league, dispatch }) => {
    const [showConfirmAction, setShowConfirmAction] = React.useState<SeasonAction | null>(null);
    const [manualScoreMode, setManualScoreMode] = React.useState(false);
    const [selectedMatchup, setSelectedMatchup] = React.useState<string | null>(null);
    const [scoreAdjustment, setScoreAdjustment] = React.useState({ teamId: '', adjustment: 0, reason: '' });

    // Mock season data
    const seasonInfo = {
        currentWeek: 12,
        totalWeeks: 17,
        playoffWeeks: 3,
        regularSeasonWeeks: 14,
        tradeDeadline: '2024-11-15',
        playoffStart: '2024-12-01',
        championshipWeek: 17,
        waiverDay: 'Wednesday',
        lockTime: '13:00'
    };

    const weeklyMatchups = [
        { id: '1', team1: 'Alice\'s Aces', team2: 'Smithtown Stallions', score1: 125.6, score2: 118.2, completed: true },
        { id: '2', team1: 'Thunder Bolts', team2: 'Wilson Warriors', score1: 98.3, score2: 142.7, completed: true },
        { id: '3', team1: 'Dynasty Dominators', team2: 'Playoff Pushers', score1: 115.4, score2: 89.6, completed: false },
    ];

    const handleSeasonAction = (action: SeasonAction) => {
        setShowConfirmAction(action);
    };

    const confirmSeasonAction = () => {
        if (!showConfirmAction) return;

        switch (showConfirmAction.type) {
            case 'ADVANCE_WEEK':
                dispatch({ 
                    type: 'ADVANCE_WEEK', 
                    payload: { leagueId: league.id, currentWeek: seasonInfo.currentWeek + 1 } 
                });
                dispatch({ 
                    type: 'ADD_NOTIFICATION', 
                    payload: { message: `Advanced to Week ${seasonInfo.currentWeek + 1}`, type: 'SYSTEM' } 
                });
                break;
            case 'RESET_WEEK':
                dispatch({ 
                    type: 'RESET_WEEK', 
                    payload: { leagueId: league.id, week: seasonInfo.currentWeek } 
                });
                break;
            case 'END_SEASON':
                dispatch({ 
                    type: 'END_SEASON', 
                    payload: { leagueId: league.id } 
                });
                break;
            case 'FORCE_SYNC':
                dispatch({ 
                    type: 'FORCE_DATA_SYNC', 
                    payload: { leagueId: league.id } 
                });
                break;
        }
        setShowConfirmAction(null);
    };

    const handleScoreAdjustment = () => {
        if (!scoreAdjustment.teamId || !scoreAdjustment.reason) return;

        dispatch({
            type: 'MANUAL_SCORE_ADJUSTMENT',
            payload: {
                leagueId: league.id,
                week: seasonInfo.currentWeek,
                teamId: scoreAdjustment.teamId,
                adjustment: scoreAdjustment.adjustment,
                reason: scoreAdjustment.reason
            }
        });

        dispatch({
            type: 'ADD_AUDIT_LOG',
            payload: {
                action: 'Manual Score Adjustment',
                details: `${scoreAdjustment.adjustment} points to team ${scoreAdjustment.teamId}: ${scoreAdjustment.reason}`,
                commissioner: 'Current User'
            }
        });

        setScoreAdjustment({ teamId: '', adjustment: 0, reason: '' });
        setManualScoreMode(false);
    };

    const getSeasonPhase = () => {
        if (seasonInfo.currentWeek <= seasonInfo.regularSeasonWeeks) return 'Regular Season';
        if (seasonInfo.currentWeek <= seasonInfo.regularSeasonWeeks + seasonInfo.playoffWeeks) return 'Playoffs';
        return 'Championship';
    };

    const getWeekProgress = () => {
        return (seasonInfo.currentWeek / seasonInfo.totalWeeks) * 100;
    };

    return (
        <Widget title="Season Management" icon={<CalendarIcon className="w-5 h-5" />}>
            <div className="p-4 space-y-6">
                {/* Season Overview */}
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                            2024 Season - {getSeasonPhase()}
                        </h3>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-blue-400">Week {seasonInfo.currentWeek}</div>
                            <div className="text-xs text-gray-400">of {seasonInfo.totalWeeks}</div>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getWeekProgress()}%` }}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                            <div className="text-gray-400">Trade Deadline</div>
                            <div className="font-medium">{new Date(seasonInfo.tradeDeadline).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Playoffs Start</div>
                            <div className="font-medium">{new Date(seasonInfo.playoffStart).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Waiver Day</div>
                            <div className="font-medium">{seasonInfo.waiverDay}</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Lock Time</div>
                            <div className="font-medium">{seasonInfo.lockTime}</div>
                        </div>
                    </div>
                </div>

                {/* Week Controls */}
                <div className="border border-[var(--panel-border)] rounded-lg p-4">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <AdjustmentsIcon className="w-4 h-4" />
                        Week Controls
                    </h4>
                    
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleSeasonAction({ type: 'ADVANCE_WEEK' })}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                            disabled={seasonInfo.currentWeek >= seasonInfo.totalWeeks}
                        >
                            <PlayIcon className="w-4 h-4" />
                            Advance Week
                        </button>
                        
                        <button
                            onClick={() => handleSeasonAction({ type: 'RESET_WEEK' })}
                            className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm"
                        >
                            <RefreshIcon className="w-4 h-4" />
                            Reset Week
                        </button>
                        
                        <button
                            onClick={() => handleSeasonAction({ type: 'FORCE_SYNC' })}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                        >
                            <RefreshIcon className="w-4 h-4" />
                            Force Sync
                        </button>
                        
                        <button
                            onClick={() => setManualScoreMode(!manualScoreMode)}
                            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                        >
                            ✏️ Manual Scoring
                        </button>
                        
                        <button
                            onClick={() => handleSeasonAction({ type: 'END_SEASON' })}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                        >
                            <StopIcon className="w-4 h-4" />
                            End Season
                        </button>
                    </div>
                </div>

                {/* Current Week Matchups */}
                <div className="border border-[var(--panel-border)] rounded-lg p-4">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-3">
                        Week {seasonInfo.currentWeek} Matchups
                    </h4>
                    
                    <div className="space-y-3">
                        {weeklyMatchups.map((matchup) => (
                            <div
                                key={matchup.id}
                                className="flex items-center justify-between p-3 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--text-primary)]">{matchup.team1}</span>
                                        <span className="font-bold text-[var(--text-primary)]">{matchup.score1}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--text-primary)]">{matchup.team2}</span>
                                        <span className="font-bold text-[var(--text-primary)]">{matchup.score2}</span>
                                    </div>
                                </div>
                                
                                <div className="ml-4 flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        matchup.completed 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                        {matchup.completed ? 'Final' : 'In Progress'}
                                    </span>
                                    
                                    <button
                                        onClick={() => setSelectedMatchup(selectedMatchup === matchup.id ? null : matchup.id)}
                                        className="p-1 hover:bg-white/10 rounded"
                                    >
                                        ⋮
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Manual Score Adjustment Modal */}
                <AnimatePresence>
                    {manualScoreMode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
                            onClick={(e: any) => e.target === e.currentTarget && setManualScoreMode(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg shadow-xl p-6 max-w-md w-full"
                            >
                                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                                    Manual Score Adjustment
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            Select Team
                                        </label>
                                        <select
                                            value={scoreAdjustment.teamId}
                                            onChange={(e: any) => setScoreAdjustment(prev => ({ ...prev, teamId: e.target.value }))}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                        >
                                            <option value="">Choose team...</option>
                                            <option value="team1">Alice's Aces</option>
                                            <option value="team2">Smithtown Stallions</option>
                                            <option value="team3">Thunder Bolts</option>
                                            <option value="team4">Wilson Warriors</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            Point Adjustment
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={scoreAdjustment.adjustment}
                                            onChange={(e: any) => setScoreAdjustment(prev => ({ ...prev, adjustment: parseFloat(e.target.value) || 0 }))}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                            placeholder="Enter adjustment (+ or -)"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            Reason
                                        </label>
                                        <textarea
                                            value={scoreAdjustment.reason}
                                            onChange={(e: any) => setScoreAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                            placeholder="Explain the reason for this adjustment..."
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 justify-end mt-6">
                                    <button
                                        onClick={() => setManualScoreMode(false)}
                                        className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleScoreAdjustment}
                                        disabled={!scoreAdjustment.teamId || !scoreAdjustment.reason}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                                    >
                                        Apply Adjustment
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                    Confirm Season Action
                                </h3>
                                <p className="text-[var(--text-secondary)] mb-6">
                                    {showConfirmAction.type === 'ADVANCE_WEEK' && `Are you sure you want to advance to Week ${seasonInfo.currentWeek + 1}?`}
                                    {showConfirmAction.type === 'RESET_WEEK' && 'Are you sure you want to reset the current week? This will clear all scores and lineup locks.'}
                                    {showConfirmAction.type === 'END_SEASON' && 'Are you sure you want to end the season? This action cannot be undone.'}
                                    {showConfirmAction.type === 'FORCE_SYNC' && 'Force sync all league data with external sources?'}
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowConfirmAction(null)}
                                        className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmSeasonAction}
                                        className={`px-4 py-2 text-white rounded-lg ${
                                            showConfirmAction.type === 'END_SEASON' 
                                                ? 'bg-red-600 hover:bg-red-700' 
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
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

export default SeasonManagement;
