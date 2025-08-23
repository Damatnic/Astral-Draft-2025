
import React from 'react';
import { motion } from 'framer-motion';
import type { Player, League, PlayerStory } from '../../../types';
import { generatePlayerStory } from '../../../services/geminiService';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

interface StoryTabProps {
  player: Player;
  league: League;
}

const StoryTab: React.FC<StoryTabProps> = ({ player, league }) => {
    const [story, setStory] = React.useState<PlayerStory | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchStory = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await generatePlayerStory(player, league);
                setStory(result);
            } catch (e) {
                setError("The Oracle couldn't write this player's story.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchStory();
    }, [player, league]);

    return (
        <motion.div
            className="space-y-6"
            {...{
                initial: { opacity: 0, x: -10 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.3 },
            }}
        >
            {isLoading && <LoadingSpinner text="Chronicling this player's journey..." />}
            {error && <p className="text-center text-red-400">{error}</p>}
            {story && (
                 <div className="prose prose-invert prose-headings:text-cyan-300 prose-strong:text-yellow-300">
                    <h2>{story.title}</h2>
                    <ReactMarkdown>{story.narrative}</ReactMarkdown>
                </div>
            )}
        </motion.div>
    );
};

export default StoryTab;
