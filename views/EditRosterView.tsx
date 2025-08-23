
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import type { Player } from '../types';
import { Avatar } from '../components/ui/Avatar';
import AddPlayerModal from '../components/commissioner/AddPlayerModal';
import { UserPlusIcon } from '../components/icons/UserPlusIcon';
import { UserRemoveIcon } from '../components/icons/UserRemoveIcon';
import { PencilIcon } from '../components/icons/PencilIcon';

const EditRosterView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    const [selectedTeamId, setSelectedTeamId] = React.useState<number | null>(league?.teams[0]?.id || null);
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

    if (!league || state.user.id !== league.commissionerId) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-400">Access Denied. You are not the commissioner of this league.</p>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    const selectedTeam = league.teams.find(t => t.id === selectedTeamId);

    const handleRemovePlayer = (player: Player) => {
        if (!selectedTeam) return;
        if (window.confirm(`Are you sure you want to remove ${player.name} from ${selectedTeam.name}?`)) {
            dispatch({ type: 'MANUAL_REMOVE_PLAYER', payload: { leagueId: league.id, teamId: selectedTeam.id, playerId: player.id }});
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${player.name} removed from ${selectedTeam.name}.`, type: 'SYSTEM' } });
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Edit Rosters
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'COMMISSIONER_TOOLS' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Tools
                </button>
            </header>
            <main className="flex-grow max-w-4xl mx-auto w-full">
                <Widget title="Roster Management" icon={<PencilIcon />}>
                    <div className="p-4 space-y-4">
                        <div>
                            <label htmlFor="team-select" className="block text-sm font-medium text-gray-400 mb-1">Select Team to Edit</label>
                            <select
                                id="team-select"
                                value={selectedTeamId || ''}
                                onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                                className="w-full bg-black/20 p-2 rounded-md border border-white/10 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                            >
                                {league.teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedTeam && (
                            <div className="p-3 bg-black/10 rounded-lg">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-lg text-cyan-300">Roster for {selectedTeam.name} ({selectedTeam.roster.length}/{league.settings.rosterSize})</h3>
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        disabled={selectedTeam.roster.length >= league.settings.rosterSize}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-500/10 text-green-300 rounded-md hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <UserPlusIcon /> Add Player
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {selectedTeam.roster.map(player => (
                                        <div key={player.id} className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <Avatar avatar={player.astralIntelligence?.spiritAnimal?.[0] || '🏈'} className="w-8 h-8 text-xl rounded-md" />
                                                <div>
                                                    <p className="font-semibold text-sm">{player.name}</p>
                                                    <p className="text-xs text-gray-400">{player.position} - {player.team}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleRemovePlayer(player)}
                                                className="flex items-center gap-1 px-2 py-1 text-xs font-bold bg-red-500/10 text-red-300 rounded-md hover:bg-red-500/20"
                                            >
                                                <UserRemoveIcon /> Remove
                                            </button>
                                        </div>
                                    ))}
                                    {selectedTeam.roster.length === 0 && <p className="text-center text-sm text-gray-500 py-8">This roster is empty.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </Widget>
            </main>
            <AnimatePresence>
                {isAddModalOpen && selectedTeam && (
                    <AddPlayerModal
                        league={league}
                        team={selectedTeam}
                        dispatch={dispatch}
                        onClose={() => setIsAddModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default EditRosterView;
