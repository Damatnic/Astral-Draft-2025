



import React from 'react';
import type { LeagueSettings, User } from '../../types';
import Modal from '../ui/Modal';
import { motion } from 'framer-motion';

interface MockDraftModalProps {
    onClose: () => void;
    user: User;
    dispatch: React.Dispatch<any>;
}

const MockDraftModal: React.FC<MockDraftModalProps> = ({ onClose, user, dispatch }) => {
    const [draftFormat, setDraftFormat] = React.useState<LeagueSettings['draftFormat']>('SNAKE');
    const [teamCount, setTeamCount] = React.useState<LeagueSettings['teamCount']>(12);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const leagueId = `mock_${Date.now()}`;
        const newMockLeague = {
            id: leagueId,
            name: `Mock Draft (${draftFormat})`,
            settings: {
                draftFormat,
                teamCount,
                scoring: 'PPR' as const,
                rosterSize: 16
            },
        };
        dispatch({ type: 'CREATE_MOCK_DRAFT', payload: newMockLeague });
        dispatch({ type: 'SET_ACTIVE_LEAGUE', payload: leagueId });
        // The START_DRAFT action needs to be called after the state updates
        setTimeout(() => {
            dispatch({ type: 'START_DRAFT' });
        }, 100);
        onClose();
    };

    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

    return (
        <Modal onClose={onClose}>
            <motion.div 
                className="glass-pane rounded-xl shadow-2xl w-full max-w-md"
                role="dialog"
                aria-modal="true"
                aria-labelledby="mock-draft-title"
                onClick={(e: any) => e.stopPropagation()}
                {...{
                    initial: { opacity: 0, y: -20, scale: 0.95 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    exit: { opacity: 0, y: 20, scale: 0.95 },
                }}
            >
                <header className="p-6 border-b border-[var(--panel-border)]">
                    <h2 id="mock-draft-title" className="text-2xl font-bold font-display text-[var(--text-primary)]">
                        Start Mock Draft
                    </h2>
                </header>

                <form onSubmit={handleSubmit}>
                    <main className="p-6 space-y-6">
                        <div>
                            <label className={labelClasses}>Draft Format</label>
                            <div className="flex gap-2">
                                {['SNAKE', 'AUCTION'].map((format: any) => (
                                    <button type="button" key={format} onClick={() => setDraftFormat(format as any)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${draftFormat === format ? 'bg-cyan-400 text-black' : 'bg-black/10 dark:bg-gray-700/50 hover:bg-black/20 dark:hover:bg-gray-600/50'}`}>
                                        {format}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="team-count" className={labelClasses}>Number of Teams: <span className="font-bold text-[var(--text-primary)]">{teamCount}</span></label>
                            <input id="team-count" type="range" min="8" max="14" step="2" value={teamCount} onChange={e => setTeamCount(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        </div>
                    </main>

                    <footer className="p-6 flex justify-end gap-4 border-t border-[var(--panel-border)]">
                        <button type="button" onClick={onClose} className="mobile-touch-target px-4 py-3 bg-transparent border border-[var(--panel-border)] text-[var(--text-secondary)] font-bold rounded-lg hover:bg-white/10 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="mobile-touch-target px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-lg shadow-md transition-colors">
                            Start Drafting
                        </button>
                    </footer>
                </form>
            </motion.div>
        </Modal>
    );
};

export default MockDraftModal;