


import React from 'react';
import { motion } from 'framer-motion';
import type { League } from '../../types';
import { PartyPopperIcon } from '../icons/PartyPopperIcon';
import { useConfetti } from '../../utils/confetti';

interface DraftCompleteOverlayProps {
    league: League;
    dispatch: React.Dispatch<any>;
}

const DraftCompleteOverlay: React.FC<DraftCompleteOverlayProps> = ({ league, dispatch }) => {
    const triggerConfetti = useConfetti();
    
    React.useEffect(() => {
        triggerConfetti();
    }, [triggerConfetti]);


    const handleViewAnalytics = () => {
        dispatch({ type: 'SET_VIEW', payload: 'ANALYTICS_HUB' });
    };

    const handleViewTeam = () => {
        dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' });
    };

    return (
        <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm"
            {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 0.5 },
            }}
        >
            <motion.div
                className="text-center p-8 rounded-2xl glass-pane max-w-lg"
                {...{
                    initial: { opacity: 0, y: -20, scale: 0.95 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    transition: { type: 'spring', delay: 0.3, duration: 0.5 },
                }}
            >
                <PartyPopperIcon className="h-16 w-16 text-yellow-300 mx-auto mb-4" />
                <h1 className="font-display text-4xl font-bold text-white mb-2">Draft Complete!</h1>
                <p className="text-gray-300 mb-6">Congratulations, your draft for "{league.name}" has concluded. Now it's time to see how you did.</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleViewAnalytics}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
                    >
                        View Draft Analytics
                    </button>
                    <button
                        onClick={handleViewTeam}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
                    >
                        Go to My Team Hub
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DraftCompleteOverlay;