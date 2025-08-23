import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import type { Team, Player } from '../../types';
import { useAppState } from '../../contexts/AppContext';

// Component for a single draggable player
const SortablePlayerCard = ({ player }: { player: Player }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.id });
    
    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        zIndex: isDragging ? 10 : 'auto',
        boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-2 bg-white/5 rounded-lg flex items-center gap-2 touch-none cursor-grab active:cursor-grabbing">
            <div className="w-8 h-8 flex items-center justify-center bg-black/20 rounded-md font-bold text-cyan-400 text-xs">{player.position}</div>
            <div>
                <p className="font-bold text-white text-sm">{player.name}</p>
                <p className="text-xs text-gray-400">{player.team}</p>
            </div>
        </div>
    );
};

// Main VisualRoster component
const VisualRoster: React.FC<{ team: Team }> = ({ team }) => {
    const { dispatch, state } = useAppState();
    const activeLeague = state.leagues.find((l: any) => l.id === state.activeLeagueId);
    
    // Split roster into starters and bench, managed locally for instant feedback
    const [starters, setStarters] = React.useState<Player[]>(team.roster.slice(0, 9));
    const [bench, setBench] = React.useState<Player[]>(team.roster.slice(9));

    // Update local state if team roster changes from props
    React.useEffect(() => {
        setStarters(team.roster.slice(0, 9));
        setBench(team.roster.slice(9));
    }, [team.roster]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const findContainer = (id: number) => {
        if (starters.some((p: any) => p.id === id)) return 'starters';
        if (bench.some((p: any) => p.id === id)) return 'bench';
        return null;
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const activeContainer = findContainer(active.id as number);
        const overContainer = findContainer(over.id as number);
        
        if (!activeContainer || !overContainer) return;

        let newStarters = [...starters];
        let newBench = [...bench];

        if (activeContainer === overContainer) {
            // Reordering within the same list
            if (activeContainer === 'starters') {
                const oldIndex = starters.findIndex((p: any) => p.id === active.id);
                const newIndex = starters.findIndex((p: any) => p.id === over.id);
                newStarters = arrayMove(starters, oldIndex, newIndex);
            } else {
                const oldIndex = bench.findIndex((p: any) => p.id === active.id);
                const newIndex = bench.findIndex((p: any) => p.id === over.id);
                newBench = arrayMove(bench, oldIndex, newIndex);
            }
        } else {
            // Moving between lists
            let movingPlayer: Player;
             if (activeContainer === 'starters') {
                // Move from starters to bench
                const activeIndex = starters.findIndex((p: any) => p.id === active.id);
                movingPlayer = starters[activeIndex];
                newStarters.splice(activeIndex, 1);
                const overIndex = bench.findIndex((p: any) => p.id === over.id);
                newBench.splice(overIndex, 0, movingPlayer);
            } else {
                // Move from bench to starters
                if (starters.length >= 9) {
                    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: "Starting lineup is full (9 players).", type: 'SYSTEM' } });
                    return;
                }
                const activeIndex = bench.findIndex((p: any) => p.id === active.id);
                movingPlayer = bench[activeIndex];
                newBench.splice(activeIndex, 1);
                const overIndex = starters.findIndex((p: any) => p.id === over.id);
                newStarters.splice(overIndex, 0, movingPlayer);
            }
        }
        
        // Update local state for immediate feedback
        setStarters(newStarters);
        setBench(newBench);
        
        // Dispatch the final list of starter IDs to update global state
        if (activeLeague) {
            dispatch({
                type: 'SET_LINEUP',
                payload: {
                    leagueId: activeLeague.id,
                    teamId: team.id,
                    playerIds: newStarters.map((p: any) => p.id)
                }
            });
             dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Lineup updated!', type: 'SYSTEM' } });
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="p-4 space-y-6">
                <div>
                    <h3 className="font-bold text-lg text-cyan-300 mb-2">Starters ({starters.length}/9)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2 bg-black/10 rounded-lg min-h-[10rem] border border-transparent">
                        <SortableContext items={starters.map(p => p.id)} strategy={rectSortingStrategy}>
                            {starters.map(player => <SortablePlayerCard key={player.id} player={player} />)}
                        </SortableContext>
                        {starters.length === 0 && <p className="text-sm text-gray-500 col-span-full text-center p-8">Drag players here to start them.</p>}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-cyan-300 mb-2">Bench ({bench.length})</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2 bg-black/10 rounded-lg min-h-[10rem] border border-transparent">
                        <SortableContext items={bench.map(p => p.id)} strategy={rectSortingStrategy}>
                           {bench.map(player => <SortablePlayerCard key={player.id} player={player} />)}
                        </SortableContext>
                        {bench.length === 0 && <p className="text-sm text-gray-500 col-span-full text-center p-8">Your bench is empty.</p>}
                    </div>
                </div>
            </div>
        </DndContext>
    );
};

export default VisualRoster;