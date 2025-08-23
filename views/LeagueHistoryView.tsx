

import React from 'react';
import { useAppState } from '../contexts/AppContext';
import type { League } from '../types';
import { Widget } from '../components/ui/Widget';
import { CrownIcon } from '../components/icons/CrownIcon';
import { TelescopeIcon } from '../components/icons/TelescopeIcon';
import { useLeague } from '../hooks/useLeague';
import ChampionChart from '../components/history/ChampionChart';

const LeagueHistoryContent: React.FC<{ league: League, dispatch: React.Dispatch<any> }> = ({ league, dispatch }) => {
    const history = league.history || [];

    return (
         <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        League History
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to League Hub
                </button>
            </header>
            <main className="flex-grow space-y-6">
                <Widget title="Hall of Champions" icon={<CrownIcon />}>
                     <div className="p-4">
                        {history.length > 0 ? (
                           <ChampionChart history={history} teams={league.teams} />
                        ) : (
                            <p className="text-sm text-gray-400 col-span-full text-center py-8">No champions have been crowned yet.</p>
                        )}
                    </div>
                </Widget>
                 <Widget title="Past Seasons" icon={<TelescopeIcon />}>
                    <div className="p-4 space-y-3">
                        {history.length > 0 ? history.map(entry => (
                            <div key={entry.season} className="bg-black/10 p-3 rounded-lg flex items-center justify-between hover:bg-black/20 transition-colors">
                                <p className="font-bold text-white">{entry.season} Season</p>
                                <button
                                    onClick={() => {
                                        dispatch({ type: 'SET_ARCHIVE_SEASON', payload: entry.season });
                                        dispatch({ type: 'SET_VIEW', payload: 'SEASON_ARCHIVE' });
                                    }}
                                    className="px-3 py-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-300 rounded-md hover:bg-cyan-500/20"
                                >
                                    View Archive
                                </button>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 text-center py-8">No past seasons to display.</p>
                        )}
                    </div>
                </Widget>
            </main>
        </div>
    );
};

const LeagueHistoryView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league } = useLeague();
    
    if (!league) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p>Please select a league to view its history.</p>
                 <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    return <LeagueHistoryContent league={league} dispatch={dispatch} />;
};

export default LeagueHistoryView;