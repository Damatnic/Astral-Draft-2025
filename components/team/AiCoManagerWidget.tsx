

import React from 'react';
import type { Team, League, AiLineupSuggestion } from '../../types';
import { Widget } from '../ui/Widget';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';
import { getAiOptimalLineup } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AiCoManagerWidgetProps {
    team: Team;
    league: League;
    dispatch: React.Dispatch<any>;
}

const AiCoManagerWidget: React.FC<AiCoManagerWidgetProps> = ({ team, league, dispatch }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [suggestion, setSuggestion] = React.useState<AiLineupSuggestion | null>(null);

    const handleGetLineup = async () => {
        setIsLoading(true);
        setSuggestion(null);
        try {
            const result = await getAiOptimalLineup(team, league);
            setSuggestion(result);
        } catch (e) {
            console.error(e);
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: "Could not get a lineup suggestion.", type: 'SYSTEM' } });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptLineup = () => {
        if (!suggestion) return;
        dispatch({
            type: 'SET_LINEUP',
            payload: { leagueId: league.id, teamId: team.id, playerIds: suggestion.recommendedStarters }
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Optimal lineup has been set!', type: 'SYSTEM' }});
        setSuggestion(null);
    };

    return (
        <Widget title="AI Co-Manager" icon={<BrainCircuitIcon />}>
            <div className="p-3">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div key="loading" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}>
                            <LoadingSpinner size="sm" text="Optimizing your lineup..." />
                        </motion.div>
                    ) : suggestion ? (
                        <motion.div
                            key="suggestion"
                            {...{
                                initial: { opacity: 0, y: 10 },
                                animate: { opacity: 1, y: 0 },
                            }}
                        >
                            <p className="text-xs text-cyan-300 font-bold">Oracle's Recommendation:</p>
                            <p className="text-xs italic text-gray-300 my-1">"{suggestion.reasoning}"</p>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setSuggestion(null)} className="flex-1 px-2 py-1 text-xs font-bold rounded-md bg-transparent text-gray-400 hover:bg-white/10">Dismiss</button>
                                <button onClick={handleAcceptLineup} className="flex-1 px-2 py-1 text-xs font-bold rounded-md bg-green-500 text-white hover:bg-green-400">Set Lineup</button>
                            </div>
                        </motion.div>
                    ) : (
                         <motion.div key="default" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}>
                            <p className="text-center text-xs text-gray-400 mb-2">Let the Oracle recommend your best starting lineup for this week.</p>
                            <button onClick={handleGetLineup} className="w-full py-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-300 rounded-md hover:bg-cyan-500/20">
                                Get Optimal Lineup
                            </button>
                         </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Widget>
    );
};

export default AiCoManagerWidget;
