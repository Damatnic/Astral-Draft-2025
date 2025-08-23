

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { generateGamedayHighlight } from '../services/geminiService';
import { Avatar } from '../components/ui/Avatar';
import { formatRelativeTime } from '../utils/time';
import type { Player, GamedayEvent } from '../types';
import { useLiveData } from '../hooks/useLiveData';

const GamedayHostView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league, myTeam } = useLeague();

    const matchup = league?.schedule.find(m =>
        m.week === league.currentWeek &&
        (m.teamA.teamId === myTeam?.id || m.teamB.teamId === myTeam?.id)
    );
    const opponentId = matchup?.teamA.teamId === myTeam?.id ? matchup?.teamB.teamId : matchup?.teamA.teamId;
    const opponentTeam = league?.teams.find(t => t.id === opponentId);

    // Use the live data hook
    useLiveData(league, myTeam, opponentTeam);

    const events = matchup ? state.gamedayEvents[matchup.id] || [] : [];
    const latestEvent = events.length > 0 ? events[events.length - 1] : null;

    React.useEffect(() => {
        // This effect will run when a new event is added from the live data hook
        const processNewEvent = async (event: GamedayEvent) => {
            if (!matchup || !myTeam || !opponentTeam) return;

            const commentary = await generateGamedayHighlight({ teamA: myTeam, teamB: opponentTeam }, event.player);
            if (commentary) {
                // We can update the event with the commentary or handle it separately
                // For simplicity, let's just log it for now but it could be displayed
                console.log(`New commentary for ${event.player.name}: ${commentary}`);
            }
        };

        if (latestEvent && !latestEvent.text.includes("commentary")) { // Simple check to avoid reprocessing
             // In a real app, you might have a better way to check if commentary exists
        }
        
    }, [latestEvent, matchup, myTeam, opponentTeam, dispatch]);


    if (!league || !myTeam) {
        return <ErrorDisplay title="Error" message="Could not load league data." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} />;
    }
    if (!matchup || !opponentTeam) {
        return <ErrorDisplay title="Bye Week" message="You don't have a matchup this week." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} />;
    }

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        AI Gameday Host
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{myTeam.name} vs. {opponentTeam.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Team Hub
                </button>
            </header>
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-pane rounded-2xl flex items-center justify-center p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={latestEvent?.id || 'waiting'}
                            className="text-center"
                            {...{
                                initial: { opacity: 0, scale: 0.8 },
                                animate: { opacity: 1, scale: 1 },
                                exit: { opacity: 0, scale: 1.2 },
                                transition: { duration: 0.5, type: 'spring' },
                            }}
                        >
                            {latestEvent ? (
                                <>
                                    <Avatar avatar={league.teams.find(t => t.id === latestEvent.teamId)?.avatar || '🏈'} className="w-24 h-24 text-6xl mx-auto rounded-lg mb-4" />
                                    <p className="font-display text-3xl font-bold">{latestEvent.text}</p>
                                </>
                            ) : (
                                <p className="text-2xl text-gray-400">Waiting for kickoff...</p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="glass-pane rounded-2xl flex flex-col">
                    <h3 className="p-3 font-bold text-center border-b border-[var(--panel-border)]">Event Timeline</h3>
                    <div className="flex-grow p-2 space-y-2 overflow-y-auto">
                        {events.slice().reverse().map(event => {
                            const team = league.teams.find(t => t.id === event.teamId);
                            return (
                                <div key={event.id} className="p-2 bg-black/20 rounded-md text-sm">
                                    <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                                        <span className="font-bold text-cyan-300">{team?.name}</span>
                                        <span>{formatRelativeTime(event.timestamp)}</span>
                                    </div>
                                    <p>{event.text}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GamedayHostView;
