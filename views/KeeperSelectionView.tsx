import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { UsersIcon } from '../components/icons/UsersIcon';
import type { Player } from '../types';
import { Avatar } from '../components/ui/Avatar';

const KeeperSelectionView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league, myTeam } = useLeague();
    const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set(myTeam?.keepers || []));

    if (!league || !myTeam) {
        return <ErrorDisplay title="Error" message="Could not load league data." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} />;
    }
    
    const keeperCount = league.settings.keeperCount || 0;

    if (keeperCount === 0) {
        return <ErrorDisplay title="Not a Keeper League" message="This league is not set up for keepers." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} />;
    }

    const handleTogglePlayer = (playerId: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(playerId)) {
                newSet.delete(playerId);
            } else {
                if (newSet.size < keeperCount) {
                    newSet.add(playerId);
                }
            }
            return newSet;
        });
    };

    const handleSaveChanges = () => {
        dispatch({
            type: 'SET_KEEPERS',
            payload: { leagueId: league.id, teamId: myTeam.id, keeperPlayerIds: Array.from(selectedIds) }
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Keeper selections saved!', type: 'SYSTEM' } });
        dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' });
    };

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Select Keepers
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Team Hub
                </button>
            </header>
            <main className="flex-grow max-w-3xl mx-auto w-full">
                <Widget title={`Select Your Keepers (${selectedIds.size}/${keeperCount})`} icon={<UsersIcon />}>
                    <div className="p-4">
                        <p className="text-sm text-gray-400 mb-4">Choose up to {keeperCount} players from your previous season's roster to keep for the upcoming draft. These picks will replace your first {keeperCount} round draft selections.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myTeam.roster.map(player => {
                                const isSelected = selectedIds.has(player.id);
                                return (
                                    <div
                                        key={player.id}
                                        onClick={() => handleTogglePlayer(player.id)}
                                        className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                                            isSelected ? 'bg-cyan-500/30 ring-2 ring-cyan-400' : 'bg-black/20 hover:bg-black/30'
                                        }`}
                                    >
                                        <Avatar avatar={player.astralIntelligence?.spiritAnimal?.[0] || '🏈'} className="w-12 h-12 text-3xl rounded-md" />
                                        <div>
                                            <p className="font-bold">{player.name}</p>
                                            <p className="text-xs text-gray-400">{player.position} - {player.team}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={handleSaveChanges}
                                className="px-6 py-2 bg-cyan-500 text-black font-bold text-sm rounded-md"
                            >
                                Save Selections
                            </button>
                        </div>
                    </div>
                </Widget>
            </main>
        </div>
    );
};

export default KeeperSelectionView;