/**
 * Mobile Search Interface
 * Touch-optimized search with filters and quick actions for mobile devices
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, PlayerPosition } from '../../types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { 
    SearchIcon,
    FilterIcon,
    XIcon,
    ChevronDownIcon,
    SortAscIcon,
    SortDescIcon,
    StarIcon,
    TrendingUpIcon,
    TrendingDownIcon
} from 'lucide-react';

interface MobileSearchInterfaceProps {
    players: Player[];
    onPlayerSelect?: (player: Player) => void;
    onSearch?: (query: string) => void;
    placeholder?: string;
    showFilters?: boolean;
    showSorting?: boolean;
    className?: string;
}

interface SearchFilters {
    positions: PlayerPosition[];
    teams: string[];
    minRank?: number;
    maxRank?: number;
    injured?: boolean;
    available?: boolean;
}

interface SortOption {
    id: string;
    label: string;
    key: keyof Player | 'projection';
    direction: 'asc' | 'desc';
}

const MobileSearchInterface: React.FC<MobileSearchInterfaceProps> = ({
    players,
    onPlayerSelect,
    onSearch,
    placeholder = "Search players...",
    showFilters = true,
    showSorting = true,
    className = ''
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [query, setQuery] = React.useState('');
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [isSortOpen, setIsSortOpen] = React.useState(false);
    const [filters, setFilters] = React.useState<SearchFilters>({
        positions: [],
        teams: [],
        injured: false,
        available: false
    });
    const [sortBy, setSortBy] = React.useState<SortOption>({
        id: 'rank',
        label: 'Rank',
        key: 'rank',
        direction: 'asc'
    });
    const [filteredPlayers, setFilteredPlayers] = React.useState<Player[]>(players);

    const searchInputRef = React.useRef<HTMLInputElement>(null);

    const getPositionColor = (position: PlayerPosition) => {
        switch (position) {
            case 'QB': return 'bg-red-500/20 text-red-400';
            case 'RB': return 'bg-green-500/20 text-green-400';
            case 'WR': return 'bg-blue-500/20 text-blue-400';
            case 'TE': return 'bg-yellow-500/20 text-yellow-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const sortOptions: SortOption[] = [
        { id: 'rank', label: 'Rank', key: 'rank', direction: 'asc' },
        { id: 'name', label: 'Name', key: 'name', direction: 'asc' },
        { id: 'position', label: 'Position', key: 'position', direction: 'asc' },
        { id: 'team', label: 'Team', key: 'team', direction: 'asc' },
        { id: 'points', label: 'Points', key: 'projection', direction: 'desc' }
    ];

    const positions: PlayerPosition[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

    // Apply filters and search
    React.useEffect(() => {
        let filtered = [...players];

        // Apply search query
        if (query.trim()) {
            const searchTerm = query.toLowerCase();
            filtered = filtered.filter((player: any) => 
                player.name.toLowerCase().includes(searchTerm) ||
                player.team.toLowerCase().includes(searchTerm) ||
                player.position.toLowerCase().includes(searchTerm)
            );
        }

        // Apply position filters
        if (filters.positions.length > 0) {
            filtered = filtered.filter((player: any) => 
                filters.positions.includes(player.position)
            );
        }

        // Apply team filters
        if (filters.teams.length > 0) {
            filtered = filtered.filter((player: any) => 
                filters.teams.includes(player.team)
            );
        }

        // Apply rank filters
        if (filters.minRank !== undefined || filters.maxRank !== undefined) {
            filtered = filtered.filter((player: any) => {
                const rank = player.rank || 999;
                const minOk = filters.minRank === undefined || rank >= filters.minRank;
                const maxOk = filters.maxRank === undefined || rank <= filters.maxRank;
                return minOk && maxOk;
            });
        }

        // Apply injury filter
        if (filters.injured) {
            filtered = filtered.filter((player: any) => 
                !player?.injuryHistory?.some((injury: any) => injury?.status !== 'Active')
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const aVal = sortBy.key === 'projection' 
                ? (a as any).projection || 0 
                : (a as any)[sortBy.key];
            const bVal = sortBy.key === 'projection' 
                ? (b as any).projection || 0 
                : (b as any)[sortBy.key];
            
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortBy.direction === 'asc' 
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortBy.direction === 'asc' 
                    ? aVal - bVal
                    : bVal - aVal;
            }
            
            return 0;
        });

        setFilteredPlayers(filtered);
        
        if (onSearch) {
            onSearch(query);
        }
    }, [query, filters, sortBy, players, onSearch]);

    const handleSearch = (value: string) => {
        setQuery(value);
    };

    const handleClearSearch = () => {
        setQuery('');
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const togglePositionFilter = (position: PlayerPosition) => {
        setFilters(prev => ({
            ...prev,
            positions: prev.positions.includes(position)
                ? prev.positions.filter((p: any) => p !== position)
                : [...prev.positions, position]
        }));
    };

    const clearFilters = () => {
        setFilters({
            positions: [],
            teams: [],
            injured: false,
            available: false
        });
    };

    const getFilterCount = () => {
        let count = 0;
        if (filters.positions.length > 0) count++;
        if (filters.teams.length > 0) count++;
        if (filters.minRank !== undefined || filters.maxRank !== undefined) count++;
        if (filters.injured) count++;
        if (filters.available) count++;
        return count;
    };

    const renderPlayerCard = (player: Player) => (
        <motion.div
            key={player.id}
            layout
            onClick={() => onPlayerSelect?.(player)}
            className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-3 cursor-pointer hover:border-blue-400/50 transition-colors"
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[var(--text-primary)]">
                            {player.name}
                        </span>
                        {player?.injuryHistory?.some((injury: any) => injury?.status !== 'Active') && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                                Injured
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                getPositionColor(player.position)
                            }`}>
                                {player.position}
                            </span>
                            {player.team}
                        </span>
                        {Boolean(player.rank) && (
                            <span>#{player.rank}</span>
                        )}
                    </div>
                </div>
                
                <div className="text-right">
                    {Boolean(player.stats?.projection) && (
                        <div className="text-lg font-medium text-[var(--text-primary)]">
                            {player.stats.projection.toFixed(1)}
                        </div>
                    )}
                    <div className="text-xs text-[var(--text-secondary)]">
                        Proj
                    </div>
                </div>
            </div>
        </motion.div>
    );

    if (!isMobile) {
        return null; // Desktop search should use different component
    }

    return (
        <div className={`mobile-search-interface ${className}`}>
            {/* Search Header */}
            <div className="sticky top-0 bg-[var(--app-bg)] z-10 pb-2">
                {/* Search Input */}
                <div className="relative">
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={query}
                        onChange={(e: any) => handleSearch(e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-10 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-blue-400 focus:outline-none"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    {query && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filter and Sort Controls */}
                {(showFilters || showSorting) && (
                    <div className="flex items-center gap-2 mt-3">
                        {showFilters && (
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)] hover:border-blue-400/50 transition-colors"
                            >
                                <FilterIcon className="w-4 h-4" />
                                <span>Filters</span>
                                {getFilterCount() > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-xs">
                                        {getFilterCount()}
                                    </span>
                                )}
                            </button>
                        )}

                        {showSorting && (
                            <button
                                onClick={() => setIsSortOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)] hover:border-blue-400/50 transition-colors"
                            >
                                {sortBy.direction === 'asc' ? 
                                    <SortAscIcon className="w-4 h-4" /> : 
                                    <SortDescIcon className="w-4 h-4" />
                                }
                                <span>{sortBy.label}</span>
                                <ChevronDownIcon className="w-3 h-3" />
                            </button>
                        )}

                        <div className="ml-auto text-sm text-[var(--text-secondary)]">
                            {filteredPlayers.length} results
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="space-y-2 pb-20">
                <AnimatePresence mode="popLayout">
                    {filteredPlayers.map((player: any) => renderPlayerCard(player))}
                </AnimatePresence>
                
                {filteredPlayers.length === 0 && (
                    <div className="text-center py-8 text-[var(--text-secondary)]">
                        {query ? 'No players found matching your search' : 'No players available'}
                    </div>
                )}
            </div>

            {/* Filter Modal */}
            <AnimatePresence>
                {isFilterOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-end"
                        onClick={() => setIsFilterOpen(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="w-full bg-[var(--panel-bg)] rounded-t-lg p-4 max-h-[80vh] overflow-y-auto"
                            onClick={(e: any) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-[var(--text-primary)]">Filters</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={clearFilters}
                                        className="text-blue-400 text-sm"
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="text-[var(--text-secondary)]"
                                    >
                                        <XIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Position Filters */}
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Positions</h4>
                                <div className="flex flex-wrap gap-2">
                                    {positions.map((position: any) => (
                                        <button
                                            key={position}
                                            onClick={() => togglePositionFilter(position)}
                                            className={`px-3 py-1.5 rounded-lg border transition-colors ${
                                                filters.positions.includes(position)
                                                    ? 'bg-blue-500 border-blue-500 text-white'
                                                    : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)]'
                                            }`}
                                        >
                                            {position}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Other Filters */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={filters.injured}
                                        onChange={(e: any) => setFilters(prev => ({ ...prev, injured: e.target.checked }))}
                                        className="rounded border-[var(--input-border)]"
                                    />
                                    <span className="text-[var(--text-primary)]">Hide injured players</span>
                                </label>
                                
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={filters.available}
                                        onChange={(e: any) => setFilters(prev => ({ ...prev, available: e.target.checked }))}
                                        className="rounded border-[var(--input-border)]"
                                    />
                                    <span className="text-[var(--text-primary)]">Available only</span>
                                </label>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sort Modal */}
            <AnimatePresence>
                {isSortOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-end"
                        onClick={() => setIsSortOpen(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="w-full bg-[var(--panel-bg)] rounded-t-lg p-4"
                            onClick={(e: any) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-[var(--text-primary)]">Sort By</h3>
                                <button
                                    onClick={() => setIsSortOpen(false)}
                                    className="text-[var(--text-secondary)]"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {sortOptions.map((option: any) => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            setSortBy(option);
                                            setIsSortOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                                            sortBy.id === option.id
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'hover:bg-[var(--input-bg)] text-[var(--text-primary)]'
                                        }`}
                                    >
                                        <span>{option.label}</span>
                                        {sortBy.id === option.id && (
                                            option.direction === 'asc' ? 
                                                <SortAscIcon className="w-4 h-4" /> : 
                                                <SortDescIcon className="w-4 h-4" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileSearchInterface;
