

import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { generateDraftStoryHighlights } from '../services/geminiService';
import type { League, DraftEvent, Player, Team } from '../types';
import { Widget } from '../components/ui/Widget';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { players } from '../data/players';
import { Avatar } from '../components/ui/Avatar';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { FirstPlaceIcon } from '../components/icons/FirstPlaceIcon';
import { GemIcon } from '../components/icons/GemIcon';
import { ZapIcon } from '../components/icons/ZapIcon';
import { useLeague } from '../hooks/useLeague';

const eventIcons: { [key: string]: React.ReactNode } = {
    FIRST_PICK: <FirstPlaceIcon />,
    QB_RUSH: <ZapIcon />,
    DRAFT_STEAL: <GemIcon />,
    THE_REACH: <ZapIcon />,
    MR_IRRELEVANT: <SparklesIcon />,
};

const HighlightCard: React.FC<{ event: DraftEvent, player?: Player, team?: Team }> = ({ event, player, team }) => {
    const icon = eventIcons[event.type] || <SparklesIcon />;
    return (
        <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-cyan-400/10 rounded-full text-cyan-300 border-2 border-cyan-400/20">
                    {icon}
                </div>
            </div>
            <div className="pt-2">
                <p className="text-xs text-gray-400">PICK {event.timestamp}</p>
                <p className="font-semibold text-white">{event.content}</p>
                 {player && team && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-300">
                        <Avatar avatar={team.avatar} className="w-5 h-5 text-sm rounded-full" />
                        <span>{team.name} selects <strong className="text-yellow-300">{player.name}</strong></span>
                    </div>
                )}
            </div>
        </div>
    );
};

const DraftStoryContent: React.FC<{ league: League, dispatch: React.Dispatch<any> }> = ({ league, dispatch }) => {
    const [highlights, setHighlights] = React.useState<DraftEvent[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchHighlights = async () => {
            setIsLoading(true);
            try {
                const data = await generateDraftStoryHighlights(league);
                if (data) {
                    setHighlights(data.sort((a,b) => a.timestamp - b.timestamp));
                } else {
                    setError("The Oracle couldn't find the story in this draft.");
                }
            } catch (e) {
                setError("An error occurred while consulting the Oracle.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchHighlights();
    }, [league]);

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        The Story of the Draft
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'ANALYTICS_HUB' })} className="mobile-touch-target px-4 py-3 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Analytics
                </button>
            </header>
            <main className="flex-grow max-w-3xl mx-auto w-full">
                <Widget title="Key Moments & Highlights">
                    <div className="p-6">
                    {isLoading ? <LoadingSpinner text="Reading the tea leaves..." /> :
                     error ? <p className="text-center text-red-400">{error}</p> :
                     (
                        <div className="relative space-y-8">
                            {/* Vertical line */}
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10"></div>
                            
                            {highlights.map((event, index) => (
                                <motion.div
                                    key={event.id}
                                    {...{
                                        initial: { opacity: 0, x: -20 },
                                        animate: { opacity: 1, x: 0 },
                                        transition: { delay: index * 0.15 },
                                    }}
                                >
                                    <HighlightCard 
                                        event={event}
                                        player={players.find(p => p.id === event.playerId)}
                                        team={league.teams.find(t => t.id === event.teamId)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                     )}
                    </div>
                </Widget>
            </main>
        </div>
    );
};


const DraftStoryView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league } = useLeague();

    if (!league) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p>Please select a completed league to view its draft story.</p>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mobile-touch-target mt-4 px-4 py-3 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    return <DraftStoryContent league={league} dispatch={dispatch} />;
};

export default DraftStoryView;