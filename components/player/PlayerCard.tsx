

import React from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../types';
import { NewsIcon } from '../icons/NewsIcon';
import { InjuryIcon } from '../icons/InjuryIcon';
import { QueueIcon } from '../icons/QueueIcon';
import { CompareIcon } from '../icons/CompareIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { StarIcon } from '../icons/StarIcon';
import { StarFilledIcon } from '../icons/StarFilledIcon';
import { useAppState } from '../../contexts/AppContext';
import { GemIcon } from '../icons/GemIcon';

interface PlayerCardProps {
  player: Player;
  onSelect: () => void;
  onAddToQueue: () => void;
  onDraft: () => void;
  onNominate: () => void;
  onAddNote: () => void;
  isMyTurn: boolean;
  isNominationTurn: boolean;
  onToggleCompare: () => void;
  isSelectedForCompare: boolean;
  isInQueue: boolean;
}

const positionColor: Record<string, string> = {
    QB: 'border-red-400/50',
    RB: 'border-green-400/50',
    WR: 'border-blue-400/50',
    TE: 'border-orange-400/50',
    DST: 'border-purple-400/50',
    K: 'border-yellow-400/50'
};

const PlayerCard: React.FC<PlayerCardProps> = ({ 
    player, onSelect, onAddToQueue, onDraft, onNominate, onAddNote,
    isMyTurn, isNominationTurn, onToggleCompare, isSelectedForCompare, isInQueue 
}) => {
  const { state, dispatch } = useAppState();
  const hasNews = player.newsFeed && player.newsFeed.length > 0;
  const hasInjury = player?.injuryHistory && player?.injuryHistory.length > 0;
  const isOnWatchlist = state.watchlist.includes(player.id);
  const isValuePick = player.rank < player?.adp - 10;
  
  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onSelect from firing
    if(isOnWatchlist) {
        dispatch({ type: 'REMOVE_FROM_WATCHLIST', payload: player.id });
    } else {
        dispatch({ type: 'ADD_TO_WATCHLIST', payload: player.id });
    }
  };

  return (
    <motion.div
      className={`group w-full text-left p-1.5 sm:p-2 bg-slate-300/20 dark:bg-gray-800/40 rounded-lg border-l-4 ${positionColor[player.position]} ${isSelectedForCompare ? 'ring-2 ring-cyan-400' : 'hover:ring-2 hover:ring-cyan-400/50'} transition-all flex items-center gap-1.5 sm:gap-2`}
      {...{
        layout: true,
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
        transition: { duration: 0.3, type: 'spring', stiffness: 200, damping: 25 },
      }}
    >
        <div className="flex flex-col gap-0.5 sm:gap-1">
            <button
                onClick={handleToggleWatchlist}
                className={`p-1 sm:p-1.5 rounded-md transition-colors mobile-touch-target ${isOnWatchlist ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}
                aria-label={isOnWatchlist ? `Remove ${player.name} from watchlist` : `Add ${player.name} to watchlist`}
            >
                {isOnWatchlist ? <StarFilledIcon className="h-3 w-3 sm:h-4 sm:w-4" /> : <StarIcon className="h-3 w-3 sm:h-4 sm:w-4" />}
            </button>
            <button
                onClick={onToggleCompare}
                className={`p-1 sm:p-1.5 rounded-md transition-colors mobile-touch-target ${isSelectedForCompare ? 'bg-cyan-400/20 text-cyan-300' : 'text-gray-500 hover:text-cyan-400'}`}
                aria-label={`Toggle comparison for ${player.name}`}
            >
                <CompareIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <button 
                onClick={onAddNote}
                className="p-1 sm:p-1.5 rounded-md text-gray-500 hover:text-yellow-400 transition-colors mobile-touch-target"
                aria-label={`Add note for ${player.name}`}
            >
                <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
        </div>

        <button onClick={onSelect} className="flex-grow flex items-center justify-between overflow-hidden mobile-touch-target">
            <div className="flex-grow overflow-hidden">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">{player.name}</p>
                    {isValuePick && (
                        <div className="flex-shrink-0 flex items-center gap-1 px-1 sm:px-1.5 py-0.5 bg-green-500/20 text-green-300 text-[8px] sm:text-[10px] font-bold rounded-full">
                            <GemIcon /> <span className="hidden sm:inline">VALUE</span>
                        </div>
                    )}
                    {hasNews && <NewsIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400 flex-shrink-0" />}
                    {hasInjury && <InjuryIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 flex-shrink-0" />}
                </div>
                <p className="text-[10px] sm:text-xs text-[var(--text-secondary)]">{player.position} - {player.team}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-1 sm:ml-2">
                <p className="font-bold text-lg sm:text-xl text-cyan-400 dark:text-cyan-300">{player.rank}</p>
                <p className="text-[8px] sm:text-[10px] text-gray-400 dark:text-gray-500">
                    <span className="hidden sm:inline">ADP: {player?.adp} | Bye: {player.bye}</span>
                    <span className="sm:hidden">{player?.adp}</span>
                </p>
            </div>
        </button>

        {(() => {
            if (isNominationTurn) {
                return (
                    <button
                        onClick={onNominate}
                        className="flex-shrink-0 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md bg-blue-500 text-white font-bold text-[10px] sm:text-xs uppercase shadow-lg hover:bg-blue-400 transition-colors mobile-touch-target"
                        aria-label={`Nominate ${player.name}`}
                    >
                        <span className="hidden sm:inline">Nominate</span>
                        <span className="sm:hidden">Nom</span>
                    </button>
                );
            } else if (isMyTurn) {
                return (
                    <button
                        onClick={onDraft}
                        className="flex-shrink-0 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md bg-green-500 text-white font-bold text-[10px] sm:text-xs uppercase shadow-lg hover:bg-green-400 transition-colors mobile-touch-target"
                        aria-label={`Draft ${player.name}`}
                    >
                        <span className="hidden sm:inline">Draft</span>
                        <span className="sm:hidden">+</span>
                    </button>
                );
            } else {
                return (
                    <button 
                        onClick={onAddToQueue}
                        className={`flex-shrink-0 p-1.5 sm:p-2 rounded-md bg-transparent hover:bg-cyan-400/20 transition-all mobile-touch-target ${isInQueue ? 'text-cyan-400 opacity-100' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}
                        aria-label={isInQueue ? "Player is in queue" : "Add to queue"}
                    >
                        <QueueIcon />
                    </button>
                );
            }
        })()}
    </motion.div>
  );
};

export default PlayerCard;