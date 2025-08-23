
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import PlayerPerformanceChart from '../components/trends/PlayerPerformanceChart';
import type { Player } from '../types';
import WeeklyScoreChart from '../components/trends/WeeklyScoreChart';

const PerformanceTrendsView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league, myTeam } = useLeague();
    const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(myTeam?.roster[0] || null);

    if (!league || !myTeam) {
        return <ErrorDisplay title="No Data Available" message="Please select a league to view performance trends." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} />;
    }

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
             <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Performance Trends
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{myTeam.name} - {league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Team Hub
                </button>
            </header>
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Widget title="Player Performance" icon={<ChartBarIcon />}>
                    <div className="p-4 border-b border-white/10">
                        <label htmlFor="player-select" className="text-sm font-semibold text-gray-400 mr-2">Select Player:</label>
                        <select
                            id="player-select"
                            value={selectedPlayer?.id || ''}
                            onChange={(e) => {
                                const player = myTeam.roster.find(p => p.id === Number(e.target.value));
                                setSelectedPlayer(player || null);
                            }}
                            className="bg-black/20 p-2 rounded-md border border-white/10 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                        >
                            {myTeam.roster.map(player => (
                                <option key={player.id} value={player.id}>
                                    {player.name} ({player.position})
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedPlayer ? (
                        <PlayerPerformanceChart player={selectedPlayer} league={league} />
                    ) : (
                        <p className="p-8 text-center text-gray-400">Select a player to view their trends.</p>
                    )}
                </Widget>
                 <Widget title="Team Score vs. League Average" icon={<ChartBarIcon />}>
                    <WeeklyScoreChart team={myTeam} league={league} />
                </Widget>
            </main>
        </div>
    );
};

export default PerformanceTrendsView;
