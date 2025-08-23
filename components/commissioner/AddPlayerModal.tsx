

import React from 'react';
import { motion } from 'framer-motion';
import type { Team, League, Player } from '../../types';
import { players } from '../../data/players';
import Modal from '../ui/Modal';
import { CloseIcon } from '../icons/CloseIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { Avatar } from '../ui/Avatar';

interface AddPlayerModalProps {
    league: League;
    team: Team;
    dispatch: React.Dispatch<any>;
    onClose: () => void;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ league, team, dispatch, onClose }) => {
    const [search, setSearch] = React.useState('');

    const rosteredPlayerIds = new Set(league.teams.flatMap(t => t.roster.map((p: any) => p.id)));
    const freeAgents = players.filter((p: any) => !rosteredPlayerIds.has(p.id));

    const filteredPlayers = freeAgents.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 100);

    const handleAddPlayer = (player: Player) => {
        dispatch({
            type: 'MANUAL_ADD_PLAYER',
            payload: { leagueId: league.id, teamId: team.id, player }
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${player.name} added to ${team.name}.`, type: 'SYSTEM' } });
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <motion.div
                className="glass-pane rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
                {...{
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                }}
            >
                <header className="p-4 border-b border-[var(--panel-border)] flex justify-between items-center">
                    <h2 className="text-xl font-bold font-display">Add Player to {team.name}</h2>
                    <button onClick={onClose} className="mobile-touch-target p-3 rounded-full hover:bg-white/10" aria-label="Close modal"><CloseIcon /></button>
                </header>

                <div className="p-4 border-b border-[var(--panel-border)]">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search free agents..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-black/20 p-2 pl-8 rounded-md border border-white/10 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                            autoFocus
                        />
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    </div>
                </div>

                <main className="flex-grow p-2 overflow-y-auto">
                    {filteredPlayers.map((player: any) => (
                        <button
                            key={player.id}
                            onClick={() => handleAddPlayer(player)}
                            className="w-full flex items-center justify-between p-2 hover:bg-black/20 rounded-md text-left"
                        >
                            <div className="flex items-center gap-2">
                                <Avatar avatar={player.astralIntelligence?.spiritAnimal?.[0] || '🏈'} className="w-8 h-8 text-xl rounded-md" />
                                <div>
                                    <p className="font-semibold text-sm">{player.name}</p>
                                    <p className="text-xs text-gray-400">{player.position} - {player.team}</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-green-400">ADD</span>
                        </button>
                    ))}
                </main>
            </motion.div>
        </Modal>
    );
};

export default AddPlayerModal;
