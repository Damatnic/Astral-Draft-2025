
import React from 'react';
import { useLeague } from '../../hooks/useLeague';
import { Widget } from '../ui/Widget';
import { MessageCircleIcon } from '../icons/MessageCircleIcon';
import { proactivelySuggestTrade } from '../../services/geminiService';
import type { TradeSuggestion } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { AnimatePresence, motion } from 'framer-motion';

interface TradeWhispererWidgetProps {
    onPropose: (suggestion: TradeSuggestion) => void;
}

const TradeWhispererWidget: React.FC<TradeWhispererWidgetProps> = ({ onPropose }) => {
    const { league, myTeam } = useLeague();
    const [isLoading, setIsLoading] = React.useState(false);
    const [suggestion, setSuggestion] = React.useState<TradeSuggestion | null>(null);

    const handleFindTrade = async () => {
        if (!myTeam || !league) return;
        setIsLoading(true);
        setSuggestion(null);
        try {
            const result = await proactivelySuggestTrade(myTeam, league);
            setSuggestion(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const opponent = league?.teams.find((t: any) => t.id === suggestion?.toTeamId);

    return (
        <Widget title="AI Trade Whisperer" icon={<MessageCircleIcon />}>
            <div className="p-3">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div key="loading" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}>
                            <LoadingSpinner size="sm" text="Scanning the league for opportunities..." />
                        </motion.div>
                    ) : suggestion && opponent ? (
                        <motion.div
                            key="suggestion"
                            {...{
                                initial: { opacity: 0, y: 10 },
                                animate: { opacity: 1, y: 0 },
                            }}
                        >
                            <p className="text-xs italic text-gray-300 mb-2">"{suggestion.rationale}"</p>
                            <div className="text-center text-xs font-bold text-gray-400 mb-2">Trade with {opponent.name}</div>
                            
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setSuggestion(null)} className="flex-1 px-2 py-1 text-xs font-bold rounded-md bg-transparent text-gray-400 hover:bg-white/10">Dismiss</button>
                                <button onClick={() => onPropose(suggestion)} className="flex-1 px-2 py-1 text-xs font-bold rounded-md bg-green-500 text-white hover:bg-green-400">Propose This Trade</button>
                            </div>
                        </motion.div>
                    ) : (
                         <motion.div key="default" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}>
                            <p className="text-center text-xs text-gray-400 mb-2">Let the Oracle find a mutually beneficial trade to improve your roster.</p>
                            <button onClick={handleFindTrade} className="w-full py-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-300 rounded-md hover:bg-cyan-500/20">
                                Find a Trade
                            </button>
                         </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Widget>
    );
};

export default TradeWhispererWidget;
