


import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Team } from '../../types';
import Modal from '../ui/Modal';
import { generateRivalryReport } from '../../services/geminiService';
import LoadingSpinner from '../ui/LoadingSpinner';

interface RivalryReportModalProps {
    myTeam: Team;
    opponentTeam: Team;
    onClose: () => void;
}

const RivalryReportModal: React.FC<RivalryReportModalProps> = ({ myTeam, opponentTeam, onClose }) => {
    const [report, setReport] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            try {
                const result = await generateRivalryReport(myTeam, opponentTeam);
                setReport(result);
            } catch (e) {
                setError("The Oracle could not be reached for a report.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReport();
    }, [myTeam, opponentTeam]);

    return (
        <Modal onClose={onClose}>
            <motion.div
                className="glass-pane rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                {...{
                    initial: { opacity: 0, y: -20, scale: 0.95 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    exit: { opacity: 0, y: 20, scale: 0.95 },
                }}
            >
                <header className="p-6 border-b border-[var(--panel-border)] text-center">
                    <h2 className="text-2xl font-bold font-display">Oracle's Rivalry Report</h2>
                </header>

                <main className="p-6 overflow-y-auto">
                    {isLoading ? <LoadingSpinner text="Gazing into the future..." /> :
                     error ? <p className="text-center text-red-400">{error}</p> :
                     report ? (
                        <div className="prose prose-invert prose-headings:text-cyan-300 prose-strong:text-yellow-300">
                            <ReactMarkdown>{report}</ReactMarkdown>
                        </div>
                     ) :
                     <p className="text-center text-gray-400">No report available.</p>
                    }
                </main>

                <footer className="p-4 text-center border-t border-[var(--panel-border)]">
                    <button onClick={onClose} className="px-6 py-2 bg-cyan-500 text-black font-bold rounded-lg">
                        Close
                    </button>
                </footer>
            </motion.div>
        </Modal>
    );
};

export default RivalryReportModal;