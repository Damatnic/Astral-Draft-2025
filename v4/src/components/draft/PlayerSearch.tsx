import { useState, useMemo, useCallback } from 'react';
import { trpc } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { QueuedPlayer } from '@/types/draft';
import { 
  Search, 
  Plus, 
  Check, 
  TrendingUp, 
  TrendingDown,
  Info,
  Filter
} from 'lucide-react';

interface PlayerSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  draftedPlayers: string[];
  onPlayerSelect?: (playerId: string) => void;
  onAddToQueue?: (player: QueuedPlayer) => void;
  selectedPlayer?: string | null;
  isMyTurn?: boolean;
  onDraftPlayer?: (playerId: string) => void;
}

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'DST', 'K'];

export function PlayerSearch({
  searchQuery,
  onSearchChange,
  draftedPlayers,
  onPlayerSelect,
  onAddToQueue,
  selectedPlayer,
  isMyTurn,
  onDraftPlayer,
}: PlayerSearchProps) {
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [sortBy, setSortBy] = useState<'adp' | 'name'>('adp');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  // Fetch players
  const { data: players, isLoading } = trpc.player.searchPlayers.useQuery({
    query: searchQuery,
    position: selectedPosition === 'ALL' ? undefined : selectedPosition,
    excludeIds: showOnlyAvailable ? draftedPlayers : [],
    sortBy,
    limit: 100,
  });

  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    
    return players.filter(player => {
      if (showOnlyAvailable && draftedPlayers.includes(player.id)) {
        return false;
      }
      return true;
    });
  }, [players, draftedPlayers, showOnlyAvailable]);

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      RB: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      WR: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      TE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      DST: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      K: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
  };

  const getAdpTrend = (rank: number, adp: number) => {
    const diff = adp - rank;
    if (Math.abs(diff) < 3) return null;
    
    if (diff > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="space-y-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search players by name or team..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Position filter */}
          <div className="flex gap-1">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={cn(
                  'px-3 py-1 rounded text-sm font-medium transition-colors',
                  selectedPosition === pos
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Sort options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 rounded text-sm bg-gray-100 dark:bg-gray-800 border-0"
          >
            <option value="adp">Sort by ADP</option>
            <option value="name">Sort by Name</option>
          </select>

          {/* Available toggle */}
          <button
            onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
            className={cn(
              'px-3 py-1 rounded text-sm font-medium transition-colors',
              showOnlyAvailable
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            {showOnlyAvailable ? 'Available Only' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Players list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredPlayers.map((player) => {
              const isDrafted = draftedPlayers.includes(player.id);
              const isSelected = selectedPlayer === player.id;

              return (
                <div
                  key={player.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer',
                    isDrafted
                      ? 'opacity-50 bg-gray-100 dark:bg-gray-800'
                      : isSelected
                      ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                  onClick={() => !isDrafted && onPlayerSelect?.(player.id)}
                >
                  {/* Position */}
                  <div className="w-10 text-center">
                    <div className="text-lg font-bold">{player.position}</div>
                  </div>

                  {/* Player info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{player.name}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          getPositionColor(player.position)
                        )}
                      >
                        {player.position}
                      </span>
                      <span className="text-sm text-gray-500">
                        {player.nflTeam || 'FA'}
                      </span>
                      {/* Trend removed - data not available */}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      {/* Additional player stats not available from API */}
                      {player.injuryStatus && (
                        <span className="text-red-500 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          {player.injuryStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isDrafted && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToQueue?.({
                              id: `queue-${player.id}-${Date.now()}`,
                              playerId: player.id,
                              playerName: player.name,
                              position: player.position,
                              team: player.nflTeam || 'FA',
                              // Additional data not available from API
                            });
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        {isMyTurn && isSelected && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDraftPlayer?.(player.id);
                            }}
                          >
                            Draft
                          </Button>
                        )}
                      </>
                    )}
                    {isDrafted && (
                      <span className="text-xs text-gray-500">Drafted</span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredPlayers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No players found matching your criteria
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}