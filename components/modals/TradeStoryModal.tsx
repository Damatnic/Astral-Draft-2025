
import React from 'react';
import { motion } from 'framer-motion';
import type { TradeOffer, League, TradeStory } from '../../types';
import Modal from '../ui/Modal';
import { generateTradeStory } from '../../services/geminiService';
import LoadingSpinner from '../ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

interface TradeStoryModalProps {
    offer: TradeOffer;
    league: League;
    onClose: () => void;
}

const TradeStoryModal: React.FC<TradeStoryModalProps> = ({ offer, league, onClose }) => {
    const [story, setStory] = React.useState<TradeStory | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStory = async () => {
            setIsLoading(true);
            const result = await generateTradeStory(offer, league);
            setStory(result);
            setIsLoading(false);
        };
        fetchStory();
    }, [offer, league]);

    return (
        <Modal onClose={onClose}>
            <motion.div
                className="glass-pane rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                {...{
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                }}
            >
                <header className="p-4 border-b border-[var(--panel-border)] text-center">
                    <h2 className="text-xl font-bold font-display">The Story of the Trade</h2>
                </header>
                <main className="p-6 overflow-y-auto">
                    {isLoading ? <LoadingSpinner text="Analyzing the trade's fallout..." /> :
                     story ? (
                        <div className="prose prose-sm prose-invert prose-headings:text-cyan-300 prose-strong:text-yellow-300">
                           <h2>{story.title}</h2>
                           <p className="lead"><strong>Winner Declared:</strong> {story.winnerDeclared}</p>
                           <ReactMarkdown>{story.narrative}</ReactMarkdown>
                        </div>
                     ) : (
                        <p className="text-center text-red-400">Could not generate a story for this trade.</p>
                     )}
                </main>
                 <footer className="p-4 border-t border-[var(--panel-border)] text-center">
                    <button onClick={onClose} className="px-6 py-2 bg-cyan-500 text-black font-bold text-sm rounded-md">
                        Close
                    </button>
                </footer>
            </motion.div>
        </Modal>
    );
};

export default TradeStoryModal;
