



import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppState } from '../../contexts/AppContext';
import { Widget } from '../ui/Widget';
import { StarFilledIcon } from '../icons/StarFilledIcon';
import { players } from '../../data/players';
import type { Player, WatchlistInsight } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import { generateWatchlistInsights } from '../../services/geminiService';
import { EyeIcon } from '../icons/EyeIcon';

const InsightDisplay: React.FC<{ insights: WatchlistInsight[] }> = ({ insights }) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (insights.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % insights.length);
            }, 6000); // Cycle every 6 seconds
            return () => clearInterval(timer);
        }
    }, [insights]);

    if (insights.length === 0) {
        return <p className="text-center text-xs text-gray-500 py-2">The Oracle has no new insights on your watchlist.</p>;
    }

    const currentInsight = insights[currentIndex];
    const player = players.find((p: any) => p.id === currentInsight.playerId);

    return (
        <div className="pt-2 text-center">
            <h4 className="flex items-center justify-center gap-1.5 text-xs font-bold text-cyan-300 mb-1">
                <EyeIcon />
                ORACLE'S WATCH
            </h4>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    {...{
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 },
                        exit: { opacity: 0, y: -10 },
                        transition: { duration: 0.4 },
                    }}
                >
                    <p className="text-xs text-gray-300 italic">
                        <strong className="text-yellow-300">{player?.name}:</strong> "{currentInsight.insight}"
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};


const WatchlistWidget: React.FC = () => {
    const { state, dispatch } = useAppState();
    
    const watchedPlayers = React.useMemo(() => {
        const playerMap = new Map(players.map((p: any) => [p.id, p]));
        return state.watchlist.map((id: any) => playerMap.get(id)).filter(Boolean) as Player[];
    }, [state.watchlist]);
    
    const activeLeague = state.leagues.find((l: any) => l.id === state.activeLeagueId);
    
    React.useEffect(() => {
        // Fetch insights if watchlist has players, an active league exists, and insights are currently empty
        if (watchedPlayers.length > 0 && activeLeague && state.watchlistInsights.length === 0) {
            const fetchInsights = async () => {
                try {
                    const insights = await generateWatchlistInsights(watchedPlayers, activeLeague);
                    if (insights) {
                        dispatch({ type: 'SET_WATCHLIST_INSIGHTS', payload: insights });
                    }
                } catch (e) {
                    console.error("Failed to fetch watchlist insights", e);
                }
            };
            fetchInsights();
        } else if (watchedPlayers.length === 0 && state.watchlistInsights.length > 0) {
            // Clear insights if watchlist is empty
            dispatch({ type: 'SET_WATCHLIST_INSIGHTS', payload: [] });
        }
    }, [watchedPlayers, activeLeague, dispatch, state.watchlistInsights.length]);


    const handleRemove = (e: React.MouseEvent, playerId: number) => {
        e.stopPropagation();
        dispatch({ type: 'REMOVE_FROM_WATCHLIST', payload: playerId });
    };

    const handlePlayerClick = (player: Player) => {
        dispatch({ type: 'SET_PLAYER_DETAIL', payload: { player } });
    };

    return (
        <Widget title="My Watchlist" icon={<StarFilledIcon />}>
            <div className="p-3">
                {watchedPlayers.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-4">Star players from the draft pool to add them to your watchlist.</p>
                ) : (
                    <div className="space-y-2">
                        {watchedPlayers.map((player: any) => (
                            <div 
                                key={player.id} 
                                onClick={() => handlePlayerClick(player)}
                                className="flex items-center justify-between p-2 bg-black/10 rounded-md group hover:bg-black/20 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-yellow-400">
                                        <StarFilledIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{player.name}</p>
                                        <p className="text-xs text-gray-400">{player.position} - {player.team}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e: any) => handleRemove(e, player.id)} 
                                    className="text-gray-500 hover:text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label={`Remove ${player.name} from watchlist`}
                                >
                                    <CloseIcon className="w-3 h-3"/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {state.watchlistInsights.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                        <InsightDisplay insights={state.watchlistInsights} />
                    </div>
                )}
            </div>
        </Widget>
    );
};

export default WatchlistWidget;