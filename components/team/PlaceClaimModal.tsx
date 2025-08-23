
import React from 'react';
import { motion } from 'framer-motion';
import type { Team, Player, WaiverWireAdvice } from '../../types';
import Modal from '../ui/Modal';
import { SparklesIcon } from '../icons/SparklesIcon';
import { getWaiverWireAdvice } from '../../services/geminiService';
import { useLeague } from '../../hooks/useLeague';

interface PlaceClaimModalProps {
    playerToAdd: Player;
    myTeam: Team;
    leagueId: string;
    dispatch: React.Dispatch<any>;
    onClose: () => void;
}

const PlaceClaimModal: React.FC<PlaceClaimModalProps> = ({ playerToAdd, myTeam, leagueId, dispatch, onClose }) => {
    const { league } = useLeague();
    const [bid, setBid] = React.useState(1);
    const [playerToDropId, setPlayerToDropId] = React.useState<number | undefined>(myTeam.roster[myTeam.roster.length - 1]?.id);
    const [advice, setAdvice] = React.useState<WaiverWireAdvice | null>(null);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);

    const isFullAiEnabled = league?.settings.aiAssistanceLevel === 'FULL';

    const handleAnalyze = async () => {
        if (!isFullAiEnabled) return;
        setIsAnalyzing(true);
        setAdvice(null);
        const result = await getWaiverWireAdvice(myTeam, playerToAdd, undefined);
        setAdvice(result);
        if (result) {
            setBid(result.suggestedBid);
            if(result.optimalDropPlayerId) {
                setPlayerToDropId(result.optimalDropPlayerId);
            }
        }
        setIsAnalyzing(false);
    };
    
    // Automatically fetch advice on modal open
    React.useEffect(() => {
        handleAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerToAdd.id]);


    const handleSubmitClaim = () => {
        if (bid > myTeam.faab) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Error: Bid exceeds your FAAB budget.', type: 'SYSTEM' } });
            return;
        }
        if (bid <= 0) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Error: Bid must be positive.', type: 'SYSTEM' } });
            return;
        }
        dispatch({
            type: 'PLACE_WAIVER_CLAIM',
            payload: {
                leagueId,
                claim: {
                    teamId: myTeam.id,
                    playerId: playerToAdd.id,
                    bid,
                    playerToDropId
                }
            }
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Waiver claim for ${playerToAdd.name} placed!`, type: 'WAIVER' } });
        onClose();
    };

    const inputClasses = "mobile-touch-target w-full bg-black/10 dark:bg-gray-900/50 border border-[var(--panel-border)] rounded-md px-3 py-3 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-cyan-400";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

    return (
        <Modal onClose={onClose}>
            <motion.div
                className="glass-pane rounded-xl shadow-2xl w-full max-w-lg"
                {...{
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.95 },
                }}
            >
                <header className="p-6 border-b border-[var(--panel-border)] text-center">
                    <h2 className="text-2xl font-bold font-display">Place Waiver Claim</h2>
                    <p className="text-lg text-cyan-300">{playerToAdd.name} ({playerToAdd.position})</p>
                </header>
                
                <main className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="bid-amount" className={labelClasses}>Bid Amount (Max: ${myTeam.faab})</label>
                            <input
                                id="bid-amount"
                                type="number"
                                value={bid}
                                onChange={e => setBid(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                             <label htmlFor="player-drop" className={labelClasses}>Player to Drop</label>
                             <select
                                id="player-drop"
                                value={playerToDropId}
                                onChange={e => setPlayerToDropId(parseInt(e.target.value))}
                                className={inputClasses}
                            >
                                {myTeam.roster.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                     {isFullAiEnabled && (advice || isAnalyzing) && (
                        <div className="p-4 border-t border-b border-[var(--panel-border)]">
                             <h3 className="font-bold text-center text-cyan-300 mb-2">Oracle's Advice</h3>
                             {isAnalyzing ? (
                                 <div className="h-14 flex items-center justify-center text-sm text-gray-400">Consulting the cosmos...</div>
                             ) : advice && (
                                <div className="text-center">
                                    <p className="text-xs text-gray-300 italic">"{advice.summary}"</p>
                                    <p className="font-bold text-base mt-1">Suggested Bid: <span className="text-yellow-300">${advice.suggestedBid}</span></p>
                                </div>
                             )}
                        </div>
                     )}
                </main>

                <footer className="p-6 flex justify-between items-center gap-4 border-t border-[var(--panel-border)]">
                    {isFullAiEnabled ? (
                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="mobile-touch-target flex items-center gap-2 px-4 py-3 bg-transparent border border-cyan-400/50 text-cyan-300 font-bold rounded-lg hover:bg-cyan-400/20 disabled:opacity-50">
                            {isAnalyzing ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <SparklesIcon />}
                            Re-Analyze
                        </button>
                    ) : (
                        <div></div> // Placeholder for spacing
                    )}
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="mobile-touch-target px-4 py-3 bg-transparent border border-[var(--panel-border)] text-[var(--text-secondary)] font-bold rounded-lg hover:bg-white/10">Cancel</button>
                        <button onClick={handleSubmitClaim} className="mobile-touch-target px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold rounded-lg">Submit Claim</button>
                    </div>
                </footer>
            </motion.div>
        </Modal>
    );
};

export default PlaceClaimModal;
