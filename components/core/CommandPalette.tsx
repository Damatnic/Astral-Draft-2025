



import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../../contexts/AppContext';
import { players } from '../../data/players';
import type { Player, View } from '../../types';
import { HistoryIcon } from '../icons/HistoryIcon';
import { useFocusTrap } from '../../utils/accessibility';

interface CommandPaletteProps {
}

const CommandPalette: React.FC<CommandPaletteProps> = () => {
    const { state, dispatch } = useAppState();
    const [query, setQuery] = React.useState('');
    const { containerRef } = useFocusTrap(state.isCommandPaletteOpen);

    const leagues = state.leagues.filter((l: any) => !l.isMock);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                dispatch({ type: 'SET_COMMAND_PALETTE_OPEN', payload: !state.isCommandPaletteOpen });
            }
            if (e.key === 'Escape') {
                dispatch({ type: 'SET_COMMAND_PALETTE_OPEN', payload: false });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.isCommandPaletteOpen, dispatch]);
    
    React.useEffect(() => {
        if (!state.isCommandPaletteOpen) {
            setQuery('');
        }
    }, [state.isCommandPaletteOpen]);

    const handleSelectLeague = (id: string) => {
        dispatch({ type: 'SET_ACTIVE_LEAGUE', payload: id });
        dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' });
        dispatch({ type: 'SET_COMMAND_PALETTE_OPEN', payload: false });
    }
    
    const handleSelectPlayer = (player: Player) => {
        dispatch({ type: 'SET_PLAYER_DETAIL', payload: { player } });
        dispatch({ type: 'SET_COMMAND_PALETTE_OPEN', payload: false });
    }

    const handleSelectView = (view: View, name: string) => {
        dispatch({ type: 'SET_VIEW', payload: view });
        dispatch({ type: 'LOG_COMMAND', payload: { name, view }});
        dispatch({ type: 'SET_COMMAND_PALETTE_OPEN', payload: false });
    }

    const commandActions = state.activeLeagueId ? [
        { name: 'Go to My Team', view: 'TEAM_HUB' as View },
        { name: 'View Standings', view: 'LEAGUE_STANDINGS' as View },
        { name: 'Waiver Wire', view: 'WAIVER_WIRE' as View },
        { name: 'Power Rankings', view: 'POWER_RANKINGS' as View },
        { name: 'Analytics Hub', view: 'ANALYTICS_HUB' as View },
        { name: 'Historical Analytics', view: 'HISTORICAL_ANALYTICS' as View },
        { name: 'Go to Dashboard', view: 'DASHBOARD' as View },
    ] : [{ name: 'Go to Dashboard', view: 'DASHBOARD' as View }];

    const queryLower = query.toLowerCase();

    const filteredPlayers = query.length > 2
        ? players.filter((p: any) => p.name.toLowerCase().includes(queryLower)).slice(0, 5)
        : [];
    
    const filteredActions = query.length > 1
        ? commandActions.filter((a: any) => a.name.toLowerCase().includes(queryLower))
        : [];


    const renderResults = () => {
        if (query.length === 0) {
            return (
                <>
                    {state.recentCommands.length > 0 && (
                         <>
                            <h4 className="px-3 py-1 text-xs text-gray-500 font-semibold uppercase flex items-center gap-2"><HistoryIcon className="h-4 w-4" /> Recent</h4>
                            {state.recentCommands.map((cmd, i) => (
                                <button key={i} onClick={() => handleSelectView(cmd.view, cmd.name)} className="w-full text-left p-3 rounded hover:bg-white/10 transition-colors text-[var(--text-secondary)]">
                                    {cmd.name}
                                </button>
                            ))}
                        </>
                    )}
                    <h4 className="px-3 py-1 text-xs text-gray-500 font-semibold uppercase">My Leagues</h4>
                    {leagues.map((league: any) => (
                        <button key={league.id} onClick={() => handleSelectLeague(league.id)} className="w-full text-left p-3 rounded hover:bg-white/10 transition-colors text-[var(--text-secondary)]">
                            {league.name}
                        </button>
                    ))}
                </>
            )
        }
        
        return (
            <>
                {filteredPlayers.length > 0 && (
                    <>
                        <h4 className="px-3 py-1 text-xs text-gray-500 font-semibold uppercase">Players</h4>
                        {filteredPlayers.map((player: any) => (
                            <button key={player.id} onClick={() => handleSelectPlayer(player)} className="w-full text-left p-3 rounded hover:bg-white/10 transition-colors text-[var(--text-secondary)]">
                                {player.name} <span className="text-gray-500">({player.position} - {player.team})</span>
                            </button>
                        ))}
                    </>
                )}
                {filteredActions.length > 0 && (
                     <>
                        <h4 className="px-3 py-1 text-xs text-gray-500 font-semibold uppercase">Navigation</h4>
                        {filteredActions.map((action: any) => (
                            <button key={action.view} onClick={() => handleSelectView(action.view, action.name)} className="w-full text-left p-3 rounded hover:bg-white/10 transition-colors text-[var(--text-secondary)]">
                                {action.name}
                            </button>
                        ))}
                    </>
                )}
                 {filteredPlayers.length === 0 && filteredActions.length === 0 && (
                    <p className="p-4 text-center text-gray-500">No results found.</p>
                 )}
            </>
        )
    };

    return (
        <AnimatePresence>
            {state.isCommandPaletteOpen && (
                 <motion.div
                    className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[20vh]"
                    onClick={() => dispatch({ type: 'SET_COMMAND_PALETTE_OPEN', payload: false })}
                    {...{
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        exit: { opacity: 0 },
                    }}
                >
                    <motion.div
                        ref={containerRef as React.RefObject<HTMLDivElement>}
                        className="glass-pane w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border-[var(--panel-border)]"
                        onClick={(e: any) => e.stopPropagation()}
                        {...{
                            initial: { opacity: 0, y: -20, scale: 0.95 },
                            animate: { opacity: 1, y: 0, scale: 1 },
                            exit: { opacity: 0, y: -20, scale: 0.95 },
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Search players or navigate..."
                            className="w-full p-4 bg-transparent text-lg focus:outline-none text-[var(--text-primary)]"
                            autoFocus
                            value={query}
                            onChange={(e: any) => setQuery(e.target.value)}
                        />
                        <div className="border-t border-[var(--panel-border)] p-2 max-h-96 overflow-y-auto">
                           {renderResults()}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;