


import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../../types';
import { Avatar } from '../ui/Avatar';
import { CloseIcon } from '../icons/CloseIcon';
import { CompareIcon } from '../icons/CompareIcon';
import { useAppState } from '../../contexts/AppContext';

interface CompareTrayProps {
    players: Player[];
    onClear: () => void;
    onCompare: () => void;
}

const CompareTray: React.FC<CompareTrayProps> = ({ players, onClear, onCompare }) => {
    const { dispatch } = useAppState();

    const handleRemovePlayer = (e: React.MouseEvent, player: Player) => {
        e.stopPropagation();
        // This is a bit of a hack. Ideally the toggle function would be passed down.
        // For now, we'll just show a notification to guide the user.
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Click ${player.name} in the list to remove from comparison.`, type: 'SYSTEM' } });
    }

    return (
        <AnimatePresence>
            {players.length > 0 && (
                <motion.div
                    className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl z-30"
                    {...{
                        layout: true,
                        initial: { y: 100, opacity: 0 },
                        animate: { y: 0, opacity: 1 },
                        exit: { y: 100, opacity: 0 },
                        transition: { type: 'spring', stiffness: 200, damping: 30 },
                    }}
                >
                    <div className="mx-4 mb-4 glass-pane p-2 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                             {players.map((player: any) => (
                                <div key={player.id} className="relative group">
                                    <Avatar avatar={player.astralIntelligence?.spiritAnimal?.split(',')[0] || '🏈'} className="w-12 h-12 text-2xl rounded-lg" alt={player.name} />
                                    <button onClick={(e: any) => handleRemovePlayer(e, player)} className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CloseIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={onClear} className="px-3 py-1.5 text-xs font-bold bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30">Clear</button>
                            <button onClick={onCompare} disabled={players.length < 2} className="px-4 py-2 flex items-center gap-2 text-sm font-bold bg-cyan-500 text-black rounded-md hover:bg-cyan-400 disabled:opacity-50">
                                <CompareIcon />
                                Compare ({players.length})
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CompareTray;
