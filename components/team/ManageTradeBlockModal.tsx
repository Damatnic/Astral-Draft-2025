

import React from 'react';
import { motion } from 'framer-motion';
import type { Team } from '../../types';
import Modal from '../ui/Modal';
import { CloseIcon } from '../icons/CloseIcon';

interface ManageTradeBlockModalProps {
    team: Team;
    leagueId: string;
    dispatch: React.Dispatch<any>;
    onClose: () => void;
}

const ManageTradeBlockModal: React.FC<ManageTradeBlockModalProps> = ({ team, leagueId, dispatch, onClose }) => {
    const originalBlockedIds = React.useMemo(() => new Set(team.tradeBlock || []), [team.tradeBlock]);
    const [selectedIds, setSelectedIds] = React.useState<Set<number>>(originalBlockedIds);

    const handleTogglePlayer = (playerId: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(playerId)) {
                newSet.delete(playerId);
            } else {
                newSet.add(playerId);
            }
            return newSet;
        });
    };

    const handleSaveChanges = () => {
        // Find players to add
        selectedIds.forEach((id: any) => {
            if (!originalBlockedIds.has(id)) {
                dispatch({ type: 'ADD_TO_TRADE_BLOCK', payload: { leagueId, teamId: team.id, playerId: id } });
            }
        });
        // Find players to remove
        originalBlockedIds.forEach((id: any) => {
            if (!selectedIds.has(id)) {
                dispatch({ type: 'REMOVE_FROM_TRADE_BLOCK', payload: { leagueId, teamId: team.id, playerId: id } });
            }
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Trade block updated!', type: 'SYSTEM' } });
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <motion.div
                className="glass-pane rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="trade-block-title"
                onClick={(e: any) => e.stopPropagation()}
                {...{
                    initial: { opacity: 0, y: -20, scale: 0.95 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    exit: { opacity: 0, y: 20, scale: 0.95 },
                }}
            >
                <header className="p-4 border-b border-[var(--panel-border)] flex justify-between items-center">
                    <h2 id="trade-block-title" className="text-xl font-bold font-display">Manage Trade Block</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                        <CloseIcon />
                    </button>
                </header>

                <main className="p-4 overflow-y-auto space-y-2">
                    <p className="text-xs text-gray-400 pb-2">Select players from your roster to make them available for trades.</p>
                    {team.roster.map((player: any) => (
                        <label key={player.id} className="flex items-center gap-3 p-2 bg-black/10 rounded-md cursor-pointer hover:bg-black/20">
                            <input 
                                type="checkbox"
                                checked={selectedIds.has(player.id)}
                                onChange={() => handleTogglePlayer(player.id)}
                                className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600"
                            />
                            <div>
                                <p className="font-bold">{player.name}</p>
                                <p className="text-xs text-gray-400">{player.position} - {player.team}</p>
                            </div>
                        </label>
                    ))}
                </main>

                <footer className="p-4 flex justify-end gap-4 border-t border-[var(--panel-border)]">
                    <button type="button" onClick={onClose} className="mobile-touch-target px-4 py-3 bg-transparent border border-[var(--panel-border)] text-[var(--text-secondary)] font-bold rounded-lg hover:bg-white/10">Cancel</button>
                    <button onClick={handleSaveChanges} className="mobile-touch-target px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold rounded-lg">Save Changes</button>
                </footer>
            </motion.div>
        </Modal>
    );
};
export default ManageTradeBlockModal;