
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { Widget } from '../components/ui/Widget';
import { GlobeIcon } from '../components/icons/GlobeIcon';
import type { League } from '../types';

const OpenLeaguesView: React.FC = () => {
    const { state, dispatch } = useAppState();

    const openLeagues = state.leagues.filter(l => {
        const humanMembers = l.members.filter(m => !m.id.startsWith('ai_'));
        return l.isPublic && humanMembers.length < l.settings.teamCount;
    });
    
    const handleJoin = (leagueId: string) => {
        dispatch({ type: 'JOIN_OPEN_LEAGUE', payload: { leagueId } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Successfully joined league!', type: 'SYSTEM' }});
    };

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Open Leagues
                    </h1>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Dashboard
                </button>
            </header>
            <main className="flex-grow max-w-2xl mx-auto w-full">
                <Widget title="Public Leagues" icon={<GlobeIcon />}>
                    <div className="p-4 space-y-3">
                        {openLeagues.length > 0 ? (
                            openLeagues.map(league => (
                                <div key={league.id} className="p-3 bg-black/10 rounded-lg flex items-center justify-between hover:bg-black/20">
                                    <div>
                                        <p className="font-bold text-white">{league.name}</p>
                                        <p className="text-xs text-gray-400">
                                            {league.settings.teamCount} Teams • {league.settings.draftFormat} • {league.settings.scoring}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleJoin(league.id)}
                                        className="px-4 py-2 bg-green-500 text-white font-bold text-sm rounded-md hover:bg-green-600"
                                    >
                                        Join
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-sm text-gray-500 py-8">No open public leagues available right now.</p>
                        )}
                    </div>
                </Widget>
            </main>
        </div>
    );
};

export default OpenLeaguesView;
