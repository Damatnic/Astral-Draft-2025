import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { GripVertical, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { QueuedPlayer, DraftQueueProps } from '@/types/draft';


export function DraftQueue({
  queue,
  onRemove,
  onReorder,
  draftedPlayers,
  maxQueueSize = 20,
}: DraftQueueProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCompact, setIsCompact] = useState(false);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(queue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: 'bg-red-100 text-red-800',
      RB: 'bg-green-100 text-green-800',
      WR: 'bg-blue-100 text-blue-800',
      TE: 'bg-orange-100 text-orange-800',
      DST: 'bg-purple-100 text-purple-800',
      K: 'bg-yellow-100 text-yellow-800',
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
  };

  const availableQueue = queue.filter(
    (player) => !draftedPlayers.includes(player.playerId)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">
            Queue ({availableQueue.length}/{maxQueueSize})
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {isCompact ? 'Expand' : 'Compact'}
          </button>
          {availableQueue.length > 0 && (
            <button
              onClick={() => {
                availableQueue.forEach((player) => onRemove(player.playerId));
              }}
              className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-800"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Queue list */}
      {isExpanded && (
        <div className={cn(
          'overflow-auto',
          isCompact ? 'max-h-32' : 'max-h-64'
        )}>
          {availableQueue.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Your queue is empty</p>
              <p className="text-xs mt-1">Add players to auto-draft them when it's your turn</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="queue">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="p-2 space-y-1"
                  >
                    {availableQueue.map((player, index) => {
                      const isDrafted = draftedPlayers.includes(player.playerId);

                      return (
                        <Draggable
                          key={player.id}
                          draggableId={player.id}
                          index={index}
                          isDragDisabled={isDrafted}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                'flex items-center gap-2 p-2 rounded transition-all',
                                snapshot.isDragging
                                  ? 'bg-primary-100 dark:bg-primary-900 shadow-lg'
                                  : isDrafted
                                  ? 'bg-gray-100 dark:bg-gray-700 opacity-50'
                                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                              )}
                            >
                              {/* Drag handle */}
                              <div
                                {...provided.dragHandleProps}
                                className={cn(
                                  'cursor-grab',
                                  isDrafted && 'cursor-not-allowed opacity-50'
                                )}
                              >
                                <GripVertical className="w-4 h-4 text-gray-400" />
                              </div>

                              {/* Queue position */}
                              <div className="w-6 text-center text-sm font-medium text-gray-500">
                                {index + 1}
                              </div>

                              {/* Player info */}
                              <div className="flex-1 min-w-0">
                                {isCompact ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">
                                      {player.playerName}
                                    </span>
                                    <span
                                      className={cn(
                                        'px-1.5 py-0.5 rounded text-xs font-medium',
                                        getPositionColor(player.position)
                                      )}
                                    >
                                      {player.position}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">
                                        {player.playerName}
                                      </span>
                                      <span
                                        className={cn(
                                          'px-1.5 py-0.5 rounded text-xs font-medium',
                                          getPositionColor(player.position)
                                        )}
                                      >
                                        {player.position}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {player.team}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      <span className="text-xs text-gray-500">
                                        Rank: {player.rank}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        ADP: {player.adp}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Remove button */}
                              <button
                                onClick={() => onRemove(player.playerId)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                disabled={isDrafted}
                              >
                                <X className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      )}
    </div>
  );
}