/**
 * Mobile-Optimized Draft Interface
 * Streamlined draft experience with touch-friendly controls and gesture support
 */

import React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Player, Team, User } from '../../types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { 
    ChevronUpIcon, 
    ChevronDownIcon, 
    RefreshCwIcon,
    FilterIcon,
    SearchIcon,
    StarIcon,
    ClockIcon,
    UsersIcon,
    TrendingUpIcon,
    MenuIcon,
    XIcon,
    PlayIcon,
    PauseIcon,
    SkipForwardIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from 'lucide-react';

interface MobileDraftInterfaceProps {
    currentUser: User;
    teams: Team[];
    availablePlayers: Player[];
    draftedPlayers: Player[];
    currentPick: number;
    isUserTurn: boolean;
    timeRemaining: number;
    onDraftPlayer: (playerId: number) => void;
    onAutoPickToggle: () => void;
    onPauseResume: () => void;
    className?: string;
}

interface SwipeablePlayerCard {
    player: Player;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    onTap: () => void;
}

const SwipeablePlayerCard: React.FC<SwipeablePlayerCard> = ({
    player,
    onSwipeLeft,
    onSwipeRight,
    onTap
}) => {
    const [dragOffset, setDragOffset] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);

    const handleDragEnd = (event: any, info: PanInfo) => {
        setIsDragging(false);
        const threshold = 100;
        
        if (info.offset.x > threshold) {
            onSwipeRight();
        } else if (info.offset.x < -threshold) {
            onSwipeLeft();
        }
        
        setDragOffset(0);
    };

    const handleDrag = (event: any, info: PanInfo) => {
        setDragOffset(info.offset.x);
        if (!isDragging) setIsDragging(true);
    };

    const getBackgroundColor = () => {
        if (!isDragging) return 'bg-[var(--panel-bg)]';
        
        if (dragOffset > 50) return 'bg-green-500/20';
        if (dragOffset < -50) return 'bg-red-500/20';
        return 'bg-[var(--panel-bg)]';
    };

    const getSwipeIndicator = () => {
        if (!isDragging) return null;
        
        if (dragOffset > 50) {
            return (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400">
                    <StarIcon className="w-6 h-6" />
                    <span className="text-xs">Queue</span>
                </div>
            );
        }
        
        if (dragOffset < -50) {
            return (
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-400">
                    <XIcon className="w-6 h-6" />
                    <span className="text-xs">Pass</span>
                </div>
            );
        }
        
        return null;
    };

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: -150, right: 150 }}
            dragElastic={0.2}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onTap={onTap}
            animate={{ x: 0 }}
            className={`relative p-4 rounded-lg border border-[var(--panel-border)] cursor-pointer transition-colors ${getBackgroundColor()}`}
            style={{ x: dragOffset }}
            whileTap={{ scale: 0.98 }}
        >
            {getSwipeIndicator()}
            
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {player.name.split(' ').map((n: any) => n[0]).join('')}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-[var(--text-primary)] truncate">
                            {player.name}
                        </h3>
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                            #{player.rank}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            {player.position}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                            {player.team}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                            ADP {player?.adp}
                        </span>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                        {player.stats.projection.toFixed(1)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                        proj
                    </div>
                </div>
            </div>
            
            {/* Swipe hints */}
            {!isDragging && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-2 opacity-30">
                    <div className="flex items-center gap-1 text-red-400">
                        <ChevronLeftIcon className="w-4 h-4" />
                        <span className="text-xs">Pass</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-400">
                        <span className="text-xs">Queue</span>
                        <ChevronRightIcon className="w-4 h-4" />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const MobileDraftInterface: React.FC<MobileDraftInterfaceProps> = ({
    currentUser,
    teams,
    availablePlayers,
    draftedPlayers,
    currentPick,
    isUserTurn,
    timeRemaining,
    onDraftPlayer,
    onAutoPickToggle,
    onPauseResume,
    className = ''
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [activeView, setActiveView] = React.useState<'players' | 'picks' | 'queue'>('players');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterPosition, setFilterPosition] = React.useState<string>('all');
    const [showFilters, setShowFilters] = React.useState(false);
    const [playerQueue, setPlayerQueue] = React.useState<Player[]>([]);
    const [isAutoPick, setIsAutoPick] = React.useState(false);
    const [isDraftPaused, setIsDraftPaused] = React.useState(false);

    // Filter players based on search and position
    const filteredPlayers = React.useMemo(() => {
        let filtered = availablePlayers;

        if (searchQuery) {
            filtered = filtered.filter((player: any) =>
                player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                player.team.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterPosition !== 'all') {
            filtered = filtered.filter((player: any) => player.position === filterPosition);
        }

        return filtered.slice(0, 50); // Limit for performance
    }, [availablePlayers, searchQuery, filterPosition]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayerQueue = (player: Player) => {
        setPlayerQueue(prev => {
            if (prev.find((p: any) => p.id === player.id)) {
                return prev.filter((p: any) => p.id !== player.id);
            }
            return [...prev, player];
        });
    };

    const handlePlayerPass = (player: Player) => {
        // Remove from queue if present, otherwise just visual feedback
        setPlayerQueue(prev => prev.filter((p: any) => p.id !== player.id));
    };

    const handleQuickDraft = () => {
        if (playerQueue.length > 0) {
            onDraftPlayer(playerQueue[0].id);
            setPlayerQueue(prev => prev.slice(1));
        }
    };

    const positions = ['all', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'];

    return (
        <div className={`h-full flex flex-col bg-[var(--panel-bg)] ${className}`}>
            {/* Mobile Header */}
            <div className="flex-shrink-0 bg-[var(--panel-bg)] border-b border-[var(--panel-border)] sticky top-0 z-10">
                {/* Draft Status Bar */}
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-sm font-medium">
                                Pick {currentPick}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                <span className="font-mono text-sm">
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                            
                            {isUserTurn && (
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold"
                                >
                                    YOUR TURN
                                </motion.div>
                            )}
                        </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onPauseResume}
                                className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded text-xs"
                            >
                                {isDraftPaused ? <PlayIcon className="w-3 h-3" /> : <PauseIcon className="w-3 h-3" />}
                                {isDraftPaused ? 'Resume' : 'Pause'}
                            </button>
                            
                            <button
                                onClick={onAutoPickToggle}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                    isAutoPick ? 'bg-green-500/20 text-green-300' : 'bg-white/20'
                                }`}
                            >
                                <RefreshCwIcon className="w-3 h-3" />
                                Auto
                            </button>
                        </div>
                        
                        {playerQueue.length > 0 && (
                            <button
                                onClick={handleQuickDraft}
                                disabled={!isUserTurn}
                                className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                            >
                                Draft Queue ({playerQueue.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex">
                    {[
                        { id: 'players', label: 'Players', icon: <UsersIcon className="w-4 h-4" /> },
                        { id: 'picks', label: 'Picks', icon: <TrendingUpIcon className="w-4 h-4" /> },
                        { id: 'queue', label: `Queue (${playerQueue.length})`, icon: <StarIcon className="w-4 h-4" /> }
                    ].map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeView === tab.id
                                    ? 'border-blue-400 text-blue-400 bg-blue-500/10'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search and Filters (Players view only) */}
            {activeView === 'players' && (
                <div className="flex-shrink-0 p-3 bg-[var(--panel-bg)] border-b border-[var(--panel-border)]">
                    <div className="flex gap-2 mb-3">
                        <div className="flex-1 relative">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e: any) => setSearchQuery(e.target.value)}
                                placeholder="Search players..."
                                className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 rounded-lg border transition-colors ${
                                showFilters
                                    ? 'border-blue-400 text-blue-400 bg-blue-500/10'
                                    : 'border-[var(--panel-border)] text-[var(--text-secondary)]'
                            }`}
                        >
                            <FilterIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex gap-1 flex-wrap">
                                    {positions.map((position: any) => (
                                        <button
                                            key={position}
                                            onClick={() => setFilterPosition(position)}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                                filterPosition === position
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-500/20 text-[var(--text-secondary)] hover:bg-gray-500/30'
                                            }`}
                                        >
                                            {position.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeView}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="h-full overflow-y-auto p-3"
                    >
                        {activeView === 'players' && (
                            <div className="space-y-2">
                                {filteredPlayers.length === 0 ? (
                                    <div className="text-center py-8 text-[var(--text-secondary)]">
                                        <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No players found</p>
                                    </div>
                                ) : (
                                    filteredPlayers.map((player: any) => (
                                        <SwipeablePlayerCard
                                            key={player.id}
                                            player={player}
                                            onSwipeLeft={() => handlePlayerPass(player)}
                                            onSwipeRight={() => handlePlayerQueue(player)}
                                            onTap={() => isUserTurn && onDraftPlayer(player.id)}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {activeView === 'picks' && (
                            <div className="space-y-2">
                                {draftedPlayers.slice(-10).reverse().map((player, index) => (
                                    <div
                                        key={`${player.id}-${index}`}
                                        className="p-3 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-500/20 rounded-full flex items-center justify-center text-xs">
                                                {currentPick - index}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-[var(--text-primary)]">
                                                    {player.name}
                                                </div>
                                                <div className="text-sm text-[var(--text-secondary)]">
                                                    {player.position} • {player.team}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeView === 'queue' && (
                            <div className="space-y-2">
                                {playerQueue.length === 0 ? (
                                    <div className="text-center py-8 text-[var(--text-secondary)]">
                                        <StarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No players in queue</p>
                                        <p className="text-sm mt-1">Swipe right on players to add them</p>
                                    </div>
                                ) : (
                                    playerQueue.map((player, index) => (
                                        <motion.div
                                            key={player.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 bg-[var(--panel-bg)] border border-green-400/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-[var(--text-primary)]">
                                                        {player.name}
                                                    </div>
                                                    <div className="text-sm text-[var(--text-secondary)]">
                                                        {player.position} • {player.team} • #{player.rank}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setPlayerQueue(prev => prev.filter((p: any) => p.id !== player.id))}
                                                    className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                                >
                                                    <XIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MobileDraftInterface;
