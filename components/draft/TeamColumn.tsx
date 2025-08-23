


import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Team, DraftPick, Player } from '../../types';
import { players } from '../../data/players';
import { Avatar } from '../ui/Avatar';

interface TeamColumnProps {
  team: Team;
  picks: DraftPick[];
  currentPick?: number;
  onPlayerSelect: (player: Player) => void;
  draftFormat: 'SNAKE' | 'AUCTION';
  isMyTeam?: boolean;
  isOnTheClock?: boolean;
}

const positionColor: Record<string, string> = {
    QB: 'bg-red-500/70',
    RB: 'bg-green-500/70',
    WR: 'bg-blue-500/70',
    TE: 'bg-orange-500/70',
    DST: 'bg-purple-500/70',
    K: 'bg-yellow-500/70'
};

const TeamColumn: React.FC<TeamColumnProps> = ({ team, picks, currentPick, onPlayerSelect, draftFormat, isMyTeam, isOnTheClock }) => {

  const getSnakePickDisplay = (pick: DraftPick) => {
    return `${pick.round}.${pick.pickInRound}`;
  }
  
  const displayItems = draftFormat === 'AUCTION'
    ? team.roster.map((player, index) => {
        const pick = picks.find((p: any) => p.playerId === player.id);
        return {
            key: player.id,
            player,
            price: pick?.price,
            isCurrent: false,
            display: ''
        };
    })
    : picks.map((pick: any) => {
        const player = players.find((p: any) => p.id === pick.playerId);
        return {
            key: pick.overall,
            player,
            price: undefined,
            isCurrent: pick.overall === currentPick,
            display: getSnakePickDisplay(pick)
        }
    });

  const columnClasses = [
      'w-24 sm:w-32 flex-shrink-0 flex flex-col items-center gap-0.5 sm:gap-1 rounded-lg transition-all duration-300',
      isMyTeam ? 'bg-cyan-500/10' : '',
      isOnTheClock ? 'shadow-lg shadow-yellow-300/40 ring-2 ring-yellow-300' : ''
  ].join(' ');

  return (
    <div className={columnClasses}>
      <div className="h-10 sm:h-12 flex-shrink-0 flex flex-col items-center justify-center w-full bg-black/10 dark:bg-gray-800/50 rounded-t-lg border-b-2 border-transparent">
        <Avatar avatar={team.avatar} className="w-6 h-6 sm:w-8 sm:h-8 text-lg sm:text-2xl rounded-md" />
        <p className="text-[10px] sm:text-xs font-bold truncate w-full text-center px-0.5 sm:px-1">{team.name}</p>
         {draftFormat === 'AUCTION' && <p className="text-[10px] sm:text-xs font-bold text-green-400">${team.budget}</p>}
      </div>
      <AnimatePresence>
      {displayItems.map((item: any) => {
        const WrapperComponent = item.player ? motion.button : motion.div;
        const bgColor = item.player ? positionColor[item.player.position] : 'bg-slate-200/50 dark:bg-gray-800/30';
        const textColor = item.player ? 'text-white' : 'text-gray-500';

        return (
          <WrapperComponent
            key={item.key}
            onClick={() => item.player && onPlayerSelect(item.player)}
            {...{
                layout: true,
                initial: { opacity: 0, y: -10 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0 },
                transition: { duration: 0.3 },
            }}
            className={`h-6 sm:h-8 flex-shrink-0 w-full rounded-md flex items-center justify-center text-[10px] sm:text-xs transition-all duration-300 mobile-touch-target
              ${item.isCurrent ? 'ring-2 ring-offset-2 ring-offset-black/50 ring-yellow-300 scale-105 shadow-lg shadow-cyan-500/20' : ''}
              ${item.player ? 'font-semibold hover:ring-2 hover:ring-cyan-400' : 'border border-dashed border-gray-400/30 dark:border-gray-600/50'}
              ${bgColor} ${textColor}
            `}
          >
            {item.player ? (
              <div className="flex items-center gap-1 sm:gap-1.5 w-full px-1 sm:px-1.5 overflow-hidden">
                <span className="truncate flex-grow text-left text-shadow-sm">{item.player.name}</span>
                 {draftFormat === 'AUCTION' && item.price && (
                    <span className="font-bold text-yellow-300/90 text-[9px] sm:text-xs">${item.price}</span>
                )}
              </div>
            ) : (
              <span>{item.display}</span>
            )}
          </WrapperComponent>
        );
      })}
      </AnimatePresence>
    </div>
  );
};

export default TeamColumn;