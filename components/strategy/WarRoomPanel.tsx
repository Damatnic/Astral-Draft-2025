
import React from 'react';
import { Reorder } from 'framer-motion';
import type { Player } from '../../types';
import { players } from '../../data/players';
import { QueueIcon } from '../icons/QueueIcon';
import { DragHandleIcon } from '../icons/DragHandleIcon';
import { CloseIcon } from '../icons/CloseIcon';

interface WarRoomPanelProps {
    queue: number[]; // player IDs
    leagueId: string;
    dispatch: React.Dispatch<any>;
}

const WarRoomPanel: React.FC<WarRoomPanelProps> = ({ queue, leagueId, dispatch }) => {
    // We have player IDs, we need the full player objects, maintaining order
    const queuedPlayers = React.useMemo(() => {
        const playerMap = new Map(players.map((p: any) => [p.id, p]));
        return queue.map((id: any) => playerMap.get(id)).filter((p: any) => p !== undefined) as Player[];
    }, [queue]);
    
    const setQueuedPlayers = (newOrder: Player[]) => {
        const newPlayerIds = newOrder.map((p: any) => p.id);
        dispatch({
            type: 'REORDER_QUEUE',
            payload: { leagueId, playerIds: newPlayerIds }
        });
    };

    const handleRemove = (playerId: number) => {
        dispatch({
            type: 'REMOVE_FROM_QUEUE',
            payload: { leagueId, playerId }
        });
        const player = players.find((p: any) => p.id === playerId);
        if (player) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: `${player.name} removed from queue.` });
        }
    };
    
    return (
        <div className="h-full flex flex-col text-[var(--text-primary)] p-2">
            <div className="flex-shrink-0 p-3 text-center border-b border-[var(--panel-border)] mb-2">
                <h3 className="font-display text-lg font-bold flex items-center justify-center gap-2">
                    <QueueIcon />
                    MY DRAFT QUEUE
                </h3>
            </div>
            <div className="flex-grow space-y-1 overflow-y-auto pr-1">
                {queuedPlayers.length === 0 ? (
                    <div className="text-center text-sm text-[var(--text-secondary)] p-4 h-full flex items-center justify-center">
                        <p>Add players to your queue from the player pool. Drag and drop to reorder.</p>
                    </div>
                ) : (
                    <Reorder.Group axis="y" values={queuedPlayers} onReorder={setQueuedPlayers} className="space-y-1">
                        {queuedPlayers.map((player: any) => (
                            <Reorder.Item 
                                key={player.id} 
                                value={player}
                                className="bg-white/5 rounded-md flex justify-between items-center group cursor-grab active:cursor-grabbing"
                            >
                                <div className="flex items-center gap-2 overflow-hidden p-2">
                                     <DragHandleIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-sm truncate">{player.name}</p>
                                        <p className="text-xs text-gray-400">{player.position} - {player.team}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2">
                                    <span className="font-bold text-md text-cyan-400">{player.rank}</span>
                                    <button onClick={() => handleRemove(player.id)} className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" aria-label={`Remove ${player.name} from queue`}>
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </div>
        </div>
    );
};

export default WarRoomPanel;
