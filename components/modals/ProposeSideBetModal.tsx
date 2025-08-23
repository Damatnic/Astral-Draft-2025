
import React from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '../../contexts/AppContext';
import { useLeague } from '../../hooks/useLeague';
import Modal from '../ui/Modal';
import { SwordsIcon } from '../icons/SwordsIcon';

interface ProposeSideBetModalProps {
    onClose: () => void;
}

const ProposeSideBetModal: React.FC<ProposeSideBetModalProps> = ({ onClose }) => {
    const { dispatch } = useAppState();
    const { league, myTeam } = useLeague();
    const [opponentId, setOpponentId] = React.useState<string>('');
    const [terms, setTerms] = React.useState('');
    const [stakes, setStakes] = React.useState('');

    if (!league || !myTeam) return null;

    const opponents = league.teams.filter((t: any) => t.id !== myTeam.id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!opponentId || !terms.trim() || !stakes.trim()) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: "All fields are required.", type: 'SYSTEM' } });
            return;
        }

        dispatch({
            type: 'PROPOSE_SIDE_BET',
            payload: {
                leagueId: league.id,
                bet: {
                    proposerId: myTeam.id,
                    accepterId: Number(opponentId),
                    terms,
                    stakes,
                }
            }
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Side bet proposed!', type: 'SYSTEM' } });
        onClose();
    };

    const labelClasses = "block text-sm font-medium text-gray-400 mb-1";
    const inputClasses = "mobile-touch-target w-full bg-black/20 px-3 py-3 rounded-md border border-white/10";

    return (
        <Modal onClose={onClose}>
            <motion.form
                onSubmit={handleSubmit}
                className="glass-pane rounded-xl shadow-2xl w-full max-w-lg"
                onClick={e => e.stopPropagation()}
                {...{
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                }}
            >
                <header className="p-4 border-b border-[var(--panel-border)]">
                    <h2 className="text-xl font-bold font-display flex items-center gap-2">
                        <SwordsIcon /> Propose Side Bet
                    </h2>
                </header>
                <main className="p-4 space-y-4">
                    <div>
                        <label htmlFor="opponent-select" className={labelClasses}>Opponent</label>
                        <select
                            id="opponent-select"
                            value={opponentId}
                            onChange={e => setOpponentId(e.target.value)}
                            className={inputClasses}
                        >
                            <option value="" disabled>Select a manager</option>
                            {opponents.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="bet-terms" className={labelClasses}>Bet Terms</label>
                        <input
                            id="bet-terms"
                            type="text"
                            value={terms}
                            onChange={e => setTerms(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g., My QB outscores yours this week"
                        />
                    </div>
                     <div>
                        <label htmlFor="bet-stakes" className={labelClasses}>The Stakes</label>
                        <input
                            id="bet-stakes"
                            type="text"
                            value={stakes}
                            onChange={e => setStakes(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g., Loser buys pizza"
                        />
                    </div>
                </main>
                <footer className="p-4 flex justify-end gap-2 border-t border-[var(--panel-border)]">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold bg-transparent border border-transparent hover:border-[var(--panel-border)] rounded-md">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-bold bg-cyan-500 text-black rounded-md">Propose Bet</button>
                </footer>
            </motion.form>
        </Modal>
    );
};

export default ProposeSideBetModal;
