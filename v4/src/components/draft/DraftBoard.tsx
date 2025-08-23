import React, { useMemo, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { useOptimizedMemo, useOptimizedCallback } from '@/hooks/usePerformance';
import type { DraftPick, Team, DraftBoardProps } from '@/types/draft';


// Memoized components for better performance
const DraftPickCell = memo<{
  pick: DraftPick;
  status: 'completed' | 'current' | 'upcoming';
  onPlayerSelect?: (playerId: string) => void;
}>(({ pick, status, onPlayerSelect }) => {
  const handlePlayerSelect = useOptimizedCallback(() => {
    if (pick.playerId) {
      onPlayerSelect?.(pick.playerId);
    }
  }, [pick.playerId, onPlayerSelect], 'draftPickSelect');

  const getPositionColor = useOptimizedMemo(() => {
    if (!pick.position) return 'bg-gray-100 dark:bg-gray-700';
    
    const colors: Record<string, string> = {
      QB: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      RB: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      WR: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      TE: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      DST: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      K: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    };
    
    return colors[pick.position] || 'bg-gray-100 dark:bg-gray-700';
  }, [pick.position], 'positionColor');

  return (
    <td
      className={cn(
        'p-1 text-center relative',
        status === 'current' && 'ring-2 ring-primary-500 ring-inset'
      )}
    >
      {pick.playerId ? (
        <button
          onClick={handlePlayerSelect}
          className={cn(
            'w-full p-2 rounded text-xs transition-colors',
            getPositionColor,
            'hover:opacity-80'
          )}
        >
          <div className="font-semibold truncate">
            {pick.playerName}
          </div>
          <div className="text-[10px] opacity-75">
            {pick.position} • Pick {pick.pick}
          </div>
        </button>
      ) : (
        <div
          className={cn(
            'w-full p-2 rounded text-xs',
            status === 'current'
              ? 'bg-primary-100 dark:bg-primary-900 animate-pulse'
              : status === 'upcoming'
              ? 'bg-gray-100 dark:bg-gray-700 opacity-50'
              : 'bg-gray-200 dark:bg-gray-600'
          )}
        >
          <div className="text-gray-500 dark:text-gray-400">
            Pick {pick.pick}
          </div>
        </div>
      )}
    </td>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.pick.playerId === nextProps.pick.playerId &&
    prevProps.pick.playerName === nextProps.pick.playerName &&
    prevProps.pick.position === nextProps.pick.position &&
    prevProps.status === nextProps.status
  );
});
DraftPickCell.displayName = 'DraftPickCell';

const TeamHeader = memo<{ team: Team }>(({ team }) => (
  <th className="text-center p-2 text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
    <div className="flex flex-col items-center">
      {team.avatar && (
        <img 
          src={team.avatar} 
          alt={team.name}
          className="w-6 h-6 rounded-full mb-1"
          loading="lazy"
        />
      )}
      <span className="truncate max-w-[100px]">{team.name}</span>
    </div>
  </th>
), (prevProps, nextProps) => {
  return (
    prevProps.team.id === nextProps.team.id &&
    prevProps.team.name === nextProps.team.name &&
    prevProps.team.avatar === nextProps.team.avatar
  );
});
TeamHeader.displayName = 'TeamHeader';

export const DraftBoard = memo<DraftBoardProps>(({
  picks,
  teams,
  currentRound = 1,
  currentPick = 1,
  onPlayerSelect,
}) => {
  const boardData = useOptimizedMemo(() => {
    const rounds: DraftPick[][] = [];
    const maxRounds = Math.max(...picks.map(p => p.round), 16);
    
    // Initialize empty rounds
    for (let r = 1; r <= maxRounds; r++) {
      rounds[r - 1] = [];
      
      // Snake draft logic
      const isEvenRound = r % 2 === 0;
      const teamOrder = isEvenRound ? [...teams].reverse() : teams;
      
      teamOrder.forEach((team, index) => {
        const overallPick = (r - 1) * teams.length + index + 1;
        const existingPick = picks.find(p => p.round === r && p.teamId === team.id);
        
        rounds[r - 1].push(
          existingPick || {
            id: `draft-${r}-${overallPick}`,
            round: r,
            pick: overallPick,
            teamId: team.id,
            teamName: team.name,
          }
        );
      });
    }
    
    return rounds;
  }, [picks, teams], 'draftBoardData');

  const getPickStatus = useOptimizedCallback((round: number, pickIndex: number) => {
    const overallPick = (round - 1) * teams.length + pickIndex + 1;
    const currentOverallPick = (currentRound - 1) * teams.length + currentPick;
    
    if (overallPick < currentOverallPick) return 'completed';
    if (overallPick === currentOverallPick) return 'current';
    return 'upcoming';
  }, [teams.length, currentRound, currentPick], 'getPickStatus');

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="text-left p-2 text-xs font-medium text-gray-500 sticky left-0 bg-gray-100 dark:bg-gray-800 z-10">
              Round
            </th>
            {teams.map((team) => (
              <TeamHeader key={team.id} team={team} />
            ))}
          </tr>
        </thead>
        <tbody>
          {boardData.map((round, roundIndex) => (
            <tr
              key={roundIndex}
              className={cn(
                'border-b dark:border-gray-700',
                roundIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
              )}
            >
              <td className="p-2 text-sm font-medium sticky left-0 z-10 bg-inherit">
                R{roundIndex + 1}
              </td>
              {round.map((pick, pickIndex) => {
                const status = getPickStatus(roundIndex + 1, pickIndex + 1);
                
                return (
                  <DraftPickCell
                    key={`${pick.teamId}-${roundIndex}`}
                    pick={pick}
                    status={status}
                    onPlayerSelect={onPlayerSelect}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.picks.length === nextProps.picks.length &&
    prevProps.teams.length === nextProps.teams.length &&
    prevProps.currentRound === nextProps.currentRound &&
    prevProps.currentPick === nextProps.currentPick &&
    prevProps.picks.every((pick, index) => {
      const nextPick = nextProps.picks[index];
      return nextPick && 
        pick.playerId === nextPick.playerId &&
        pick.playerName === nextPick.playerName &&
        pick.position === nextPick.position;
    })
  );
});
DraftBoard.displayName = 'DraftBoard';