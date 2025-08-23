/**
 * Enhanced Roster Manager
 * Advanced roster editing with position management, depth chart, and player details
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, DragEndEvent, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Widget } from '../ui/Widget';
import { Avatar } from '../ui/Avatar';
import { Player, Team, League, PlayerPosition } from '../../types';
import { PencilIcon } from '../icons/PencilIcon';
import { UserPlusIcon } from '../icons/UserPlusIcon';
import { UserRemoveIcon } from '../icons/UserRemoveIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { TrendingDownIcon } from '../icons/TrendingDownIcon';
import { StarIcon } from '../icons/StarIcon';

interface EnhancedRosterManagerProps {
    team: Team;
    league: League;
    dispatch: React.Dispatch<any>;
    canEdit: boolean;
}

interface PlayerCardProps {
    player: Player;
    onView: () => void;
    onEdit?: () => void;
    onRemove?: () => void;
    showActions: boolean;
    isStarter?: boolean;
}

interface PositionGroupProps {
    position: PlayerPosition;
    players: Player[];
    maxStarters: number;
    onPlayerAction: (player: Player, action: 'view' | 'edit' | 'remove') => void;
    canEdit: boolean;
}

const SortablePlayerCard: React.FC<{ player: Player; onAction: (player: Player, action: 'view' | 'edit' | 'remove') => void; canEdit: boolean; isStarter?: boolean }> = ({ 
    player, onAction, canEdit, isStarter 
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(canEdit ? listeners : {})}
            className={`p-3 border rounded-lg transition-all ${
                isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--panel-border)] hover:border-gray-500'
            } ${isStarter ? 'bg-green-500/10 border-green-500/30' : 'bg-[var(--panel-bg)]'}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar 
                        avatar={player.astralIntelligence?.spiritAnimal?.[0] || '🏈'} 
                        className="w-10 h-10 text-xl rounded-md flex-shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[var(--text-primary)] truncate">{player.name}</h4>
                            {isStarter && <StarIcon className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">{player.position} - {player.team}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-green-400">Proj: {player.stats.projection.toFixed(1)}</span>
                            <span className="text-xs text-gray-400">ADP: {player?.adp}</span>
                            {player?.injuryHistory && player?.injuryHistory.length > 0 && (
                                <span className="text-xs text-red-400">⚠️ Injury History</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onAction(player, 'view')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="View Details"
                    >
                        <EyeIcon className="w-4 h-4" />
                    </button>
                    {canEdit && (
                        <>
                            <button
                                onClick={() => onAction(player, 'edit')}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Edit Player"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onAction(player, 'remove')}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                                title="Remove Player"
                            >
                                <UserRemoveIcon className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const PositionGroup: React.FC<PositionGroupProps> = ({ position, players, maxStarters, onPlayerAction, canEdit }) => {
    const starters = players.slice(0, maxStarters);
    const bench = players.slice(maxStarters);

    return (
        <div className="space-y-4">
            {/* Starters */}
            {maxStarters > 0 && (
                <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">
                            Starting {position}s ({starters.length}/{maxStarters})
                        </span>
                        {starters.length < maxStarters && (
                            <span className="text-yellow-400 text-xs">Need {maxStarters - starters.length} more</span>
                        )}
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <SortableContext items={starters.map(p => p.id)} strategy={rectSortingStrategy}>
                            {starters.map((player: any) => (
                                <SortablePlayerCard
                                    key={player.id}
                                    player={player}
                                    onAction={onPlayerAction}
                                    canEdit={canEdit}
                                    isStarter={true}
                                />
                            ))}
                        </SortableContext>
                        {starters.length === 0 && (
                            <div className="col-span-full p-6 border-2 border-dashed border-gray-600 rounded-lg text-center">
                                <p className="text-gray-400">No starting {position}s assigned</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bench */}
            {bench.length > 0 && (
                <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                        <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-sm">
                            Bench {position}s ({bench.length})
                        </span>
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <SortableContext items={bench.map(p => p.id)} strategy={rectSortingStrategy}>
                            {bench.map((player: any) => (
                                <SortablePlayerCard
                                    key={player.id}
                                    player={player}
                                    onAction={onPlayerAction}
                                    canEdit={canEdit}
                                    isStarter={false}
                                />
                            ))}
                        </SortableContext>
                    </div>
                </div>
            )}
        </div>
    );
};

const EnhancedRosterManager: React.FC<EnhancedRosterManagerProps> = ({ team, league, dispatch, canEdit }) => {
    const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
    const [rosterByPosition, setRosterByPosition] = React.useState<Record<PlayerPosition, Player[]>>({
        QB: [],
        RB: [],
        WR: [],
        TE: [],
        K: [],
        DST: []
    });

    // Position requirements (typical starting lineup)
    const positionRequirements: Record<PlayerPosition, number> = {
        QB: 1,
        RB: 2,
        WR: 2,
        TE: 1,
        K: 1,
        DST: 1
    };

    // Update roster by position when team roster changes
    React.useEffect(() => {
        const grouped = team.roster.reduce((acc, player) => {
            if (!acc[player.position]) acc[player.position] = [];
            acc[player.position].push(player);
            return acc;
        }, {} as Record<PlayerPosition, Player[]>);

        // Sort each position by projection (descending)
        Object.keys(grouped).forEach((pos: any) => {
            grouped[pos as PlayerPosition].sort((a, b) => b.stats.projection - a.stats.projection);
        });

        setRosterByPosition({
            QB: grouped.QB || [],
            RB: grouped.RB || [],
            WR: grouped.WR || [],
            TE: grouped.TE || [],
            K: grouped.K || [],
            DST: grouped.DST || []
        });
    }, [team.roster]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        if (!canEdit) return;

        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // Find which position group the dragged player belongs to
        let sourcePosition: PlayerPosition | null = null;
        for (const [pos, players] of Object.entries(rosterByPosition)) {
            if (players.some((p: any) => p.id === active.id)) {
                sourcePosition = pos as PlayerPosition;
                break;
            }
        }

        if (!sourcePosition) return;

        const sourceArray = rosterByPosition[sourcePosition];
        const oldIndex = sourceArray.findIndex((p: any) => p.id === active.id);
        const newIndex = sourceArray.findIndex((p: any) => p.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newArray = arrayMove(sourceArray, oldIndex, newIndex);
            setRosterByPosition(prev => ({
                ...prev,
                [sourcePosition]: newArray
            }));

            // Update global state with new lineup order
            const newStarters = newArray.slice(0, positionRequirements[sourcePosition]);
            dispatch({
                type: 'UPDATE_POSITION_DEPTH_CHART',
                payload: {
                    leagueId: league.id,
                    teamId: team.id,
                    position: sourcePosition,
                    playerIds: newArray.map((p: any) => p.id)
                }
            });
        }
    };

    const handlePlayerAction = (player: Player, action: 'view' | 'edit' | 'remove') => {
        switch (action) {
            case 'view':
                setSelectedPlayer(player);
                break;
            case 'edit':
                if (canEdit) {
                    dispatch({ 
                        type: 'SET_VIEW', 
                        payload: 'EDIT_PLAYER',
                        data: { playerId: player.id, teamId: team.id }
                    });
                }
                break;
            case 'remove':
                if (canEdit && window.confirm(`Remove ${player.name} from ${team.name}?`)) {
                    dispatch({
                        type: 'REMOVE_PLAYER_FROM_TEAM',
                        payload: { leagueId: league.id, teamId: team.id, playerId: player.id }
                    });
                }
                break;
        }
    };

    const addPlayer = () => {
        if (canEdit) {
            dispatch({ 
                type: 'SET_VIEW', 
                payload: 'ADD_PLAYER_TO_TEAM',
                data: { teamId: team.id }
            });
        }
    };

    const totalStarters = Object.values(positionRequirements).reduce((sum, count) => sum + count, 0);
    const currentStarters = Object.entries(rosterByPosition).reduce((sum, [pos, players]) => {
        const required = positionRequirements[pos as PlayerPosition];
        return sum + Math.min(players.length, required);
    }, 0);

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
                {/* Roster Overview */}
                <Widget title="Roster Overview">
                    <div className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                                <div className="text-2xl font-bold text-blue-400">{team.roster.length}</div>
                                <div className="text-xs text-gray-400">Total Players</div>
                            </div>
                            <div className="text-center p-3 bg-green-500/20 rounded-lg">
                                <div className="text-2xl font-bold text-green-400">{currentStarters}/{totalStarters}</div>
                                <div className="text-xs text-gray-400">Starters Set</div>
                            </div>
                            <div className="text-center p-3 bg-purple-500/20 rounded-lg">
                                <div className="text-2xl font-bold text-purple-400">
                                    {team.roster.reduce((sum, p) => sum + p.stats.projection, 0).toFixed(1)}
                                </div>
                                <div className="text-xs text-gray-400">Total Projection</div>
                            </div>
                            <div className="text-center p-3 bg-yellow-500/20 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-400">{team.budget || 0}</div>
                                <div className="text-xs text-gray-400">Remaining Budget</div>
                            </div>
                        </div>

                        {canEdit && (
                            <div className="flex gap-2">
                                <button
                                    onClick={addPlayer}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                                >
                                    <UserPlusIcon className="w-4 h-4" />
                                    Add Player
                                </button>
                                <button
                                    onClick={() => dispatch({ type: 'OPTIMIZE_LINEUP', payload: { teamId: team.id } })}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                >
                                    <TrendingUpIcon className="w-4 h-4" />
                                    Auto-Optimize
                                </button>
                            </div>
                        )}
                    </div>
                </Widget>

                {/* Position Groups */}
                {Object.entries(positionRequirements).map(([position, maxStarters]) => {
                    const pos = position as PlayerPosition;
                    const players = rosterByPosition[pos] || [];
                    
                    return (
                        <Widget key={position} title={`${position} (${players.length} players)`}>
                            <div className="p-4">
                                <PositionGroup
                                    position={pos}
                                    players={players}
                                    maxStarters={maxStarters}
                                    onPlayerAction={handlePlayerAction}
                                    canEdit={canEdit}
                                />
                            </div>
                        </Widget>
                    );
                })}

                {/* Player Details Modal */}
                <AnimatePresence>
                    {selectedPlayer && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
                            onClick={(e: any) => e.target === e.currentTarget && setSelectedPlayer(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{selectedPlayer.name}</h3>
                                    <button
                                        onClick={() => setSelectedPlayer(null)}
                                        className="p-2 hover:bg-white/10 rounded-lg"
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold text-[var(--text-primary)] mb-2">Basic Info</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Position:</strong> {selectedPlayer.position}</p>
                                            <p><strong>Team:</strong> {selectedPlayer.team}</p>
                                            <p><strong>Age:</strong> {selectedPlayer?.age}</p>
                                            <p><strong>Bye Week:</strong> {selectedPlayer.bye}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-[var(--text-primary)] mb-2">Statistics</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Projection:</strong> {selectedPlayer.stats.projection.toFixed(1)}</p>
                                            <p><strong>Last Year:</strong> {selectedPlayer.stats.lastYear.toFixed(1)}</p>
                                            <p><strong>ADP:</strong> {selectedPlayer?.adp}</p>
                                            <p><strong>Tier:</strong> {selectedPlayer?.tier}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedPlayer.scoutingReport && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold text-[var(--text-primary)] mb-2">Scouting Report</h4>
                                        <p className="text-sm text-[var(--text-secondary)] mb-2">{selectedPlayer.scoutingReport.summary}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h5 className="text-green-400 font-medium">Strengths</h5>
                                                <ul className="text-sm list-disc list-inside">
                                                    {selectedPlayer.scoutingReport.strengths.map((strength, i) => (
                                                        <li key={i}>{strength}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h5 className="text-red-400 font-medium">Weaknesses</h5>
                                                <ul className="text-sm list-disc list-inside">
                                                    {selectedPlayer.scoutingReport.weaknesses.map((weakness, i) => (
                                                        <li key={i}>{weakness}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DndContext>
    );
};

export default EnhancedRosterManager;
