

import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { Widget } from '../components/ui/Widget';
import type { Team, League } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { useLeague } from '../hooks/useLeague';
import { calculateStreak } from '../utils/streaks';
import { FlameIcon } from '../components/icons/FlameIcon';
import { SnowflakeIcon } from '../components/icons/SnowflakeIcon';
import { CompareIcon } from '../components/icons/CompareIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';

const LeagueStandingsContent: React.FC<{ league: League; myTeamId: number; myUserId: string; dispatch: React.Dispatch<any> }> = ({ league, myTeamId, myUserId, dispatch }) => {
    const [selectedTeams, setSelectedTeams] = React.useState<Set<number>>(new Set());
    
    const sortedTeams = [...league.teams].sort((a, b) => {
        const aWinPct = a.record.wins + a.record.ties * 0.5;
        const bWinPct = b.record.wins + b.record.ties * 0.5;
        if (aWinPct !== bWinPct) {
            return bWinPct - aWinPct;
        }
        // Could add points for as a tie-breaker
        return 0;
    });

    const handleSelectTeam = (teamId: number) => {
        setSelectedTeams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            } else {
                if (newSet.size < 2) {
                    newSet.add(teamId);
                }
            }
            return newSet;
        });
    };

    const handleCompare = () => {
        if (selectedTeams.size === 2) {
            const [teamAId, teamBId] = Array.from(selectedTeams);
            dispatch({ type: 'SET_TEAMS_TO_COMPARE', payload: [teamAId, teamBId] });
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        League Standings
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'PROJECTED_STANDINGS' })}
                        className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm hover:bg-purple-500/30 flex items-center gap-2"
                    >
                        <TrendingUpIcon /> View Projections
                    </button>
                    <AnimatePresence>
                        {selectedTeams.size === 2 && (
                            <motion.button
                                onClick={handleCompare}
                                className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-lg text-sm flex items-center gap-2"
                                {...{
                                    initial: { opacity: 0, scale: 0.8 },
                                    animate: { opacity: 1, scale: 1 },
                                    exit: { opacity: 0, scale: 0.8 },
                                }}
                            >
                                <CompareIcon /> Compare Teams
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                        Back to My Team
                    </button>
                </div>
            </header>
            <main className="flex-grow">
                <Widget title={`Current Standings - Week ${league.currentWeek}`}>
                     <div className="p-2">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-black/10">
                                <tr>
                                    <th className="p-3 w-12"></th>
                                    <th className="p-3">Rank</th>
                                    <th className="p-3">Team</th>
                                    <th className="p-3 text-center">W</th>
                                    <th className="p-3 text-center">L</th>
                                    <th className="p-3 text-center">T</th>
                                    <th className="p-3 text-center">Streak</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTeams.map((team, i) => {
                                    const streak = calculateStreak(team.id, league.schedule, league.currentWeek);
                                    const isSelected = selectedTeams.has(team.id);
                                    return (
                                        <tr key={team.id} className={`border-t border-white/5 ${team.id === myTeamId ? 'bg-cyan-500/10' : ''} ${isSelected ? 'bg-cyan-500/20' : ''}`}>
                                            <td className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectTeam(team.id)}
                                                    disabled={selectedTeams.size >= 2 && !isSelected}
                                                    className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600 cursor-pointer disabled:cursor-not-allowed"
                                                />
                                            </td>
                                            <td className="p-3 font-bold text-cyan-400">{i + 1}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <Avatar avatar={team.avatar} className="w-8 h-8 text-xl rounded-md" />
                                                    <div>
                                                        <button 
                                                            onClick={() => {
                                                                if (team.owner.id === myUserId) {
                                                                    dispatch({ type: 'SET_VIEW', payload: 'PROFILE' });
                                                                } else {
                                                                    dispatch({ type: 'SET_MANAGER_PROFILE', payload: team.owner.id });
                                                                }
                                                            }}
                                                            className="font-semibold text-white text-left hover:underline"
                                                        >
                                                            {team.name}
                                                        </button>
                                                        <p className="text-xs text-gray-400">{team.owner.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono text-center">{team.record.wins}</td>
                                            <td className="p-3 font-mono text-center">{team.record.losses}</td>
                                            <td className="p-3 font-mono text-center">{team.record.ties}</td>
                                            <td className="p-3 font-mono text-center">
                                                {streak ? (
                                                    <span className={`flex items-center justify-center gap-1 ${streak.type === 'W' ? 'text-orange-400' : 'text-blue-400'}`}>
                                                        {streak.type === 'W' ? <FlameIcon /> : <SnowflakeIcon />}
                                                        {streak.count}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Widget>
            </main>
        </div>
    );
};

const LeagueStandingsView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league, myTeam } = useLeague();
    
    return (
        <div className="w-full h-full">
            {!league || !myTeam ? (
                <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                    <p>Select a league to view standings.</p>
                     <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                        Back to Dashboard
                    </button>
                </div>
            ) : (
                <LeagueStandingsContent league={league} myTeamId={myTeam.id} myUserId={state.user.id} dispatch={dispatch} />
            )}
        </div>
    );
};

export default LeagueStandingsView;
