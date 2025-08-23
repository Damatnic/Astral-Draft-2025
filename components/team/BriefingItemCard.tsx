

import React from 'react';
import { motion } from 'framer-motion';
import type { DailyBriefingItem, Player } from '../../types';
import { players } from '../../data/players';
import { TargetIcon } from '../icons/TargetIcon';
import { LightbulbIcon } from '../icons/LightbulbIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { ArrowRightLeftIcon } from '../icons/ArrowRightLeftIcon';
import { WandIcon } from '../icons/WandIcon';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { FireIcon } from '../icons/FireIcon';

interface BriefingItemCardProps {
    item: DailyBriefingItem;
    dispatch: React.Dispatch<any>;
    onGetAdvice?: (playerIds: number[]) => void;
    onClaimPlayer?: (player: Player) => void;
}

const itemConfig = {
    MATCHUP_PREVIEW: { icon: <TargetIcon />, color: 'text-blue-400' },
    WAIVER_GEM: { icon: <LightbulbIcon />, color: 'text-green-400' },
    ROSTER_WARNING: { icon: <AlertTriangleIcon />, color: 'text-red-400' },
    PLAYER_SPOTLIGHT: { icon: <SparklesIcon />, color: 'text-yellow-400' },
    TRADE_TIP: { icon: <ArrowRightLeftIcon />, color: 'text-purple-400' },
    ON_THE_HOT_SEAT: { icon: <FireIcon />, color: 'text-orange-400' },
};

const BriefingItemCard: React.FC<BriefingItemCardProps> = ({ item, dispatch, onGetAdvice, onClaimPlayer }) => {
    const config = itemConfig[item.type] || { icon: <SparklesIcon />, color: 'text-gray-400' };

    const handleCardClick = () => {
        if (item.type === 'WAIVER_GEM') {
            dispatch({ type: 'SET_VIEW', payload: 'WAIVER_WIRE' });
        } else if (item.type === 'MATCHUP_PREVIEW') {
            dispatch({ type: 'SET_VIEW', payload: 'MATCHUP' });
        } else if (item.type === 'TRADE_TIP') {
            // Future: Navigate to trade center or a specific trade proposal view
        }
    };

    const canGetAdvice = (item.type === 'ROSTER_WARNING' || item.type === 'ON_THE_HOT_SEAT') && item.relatedPlayerIds && item.relatedPlayerIds.length > 0 && onGetAdvice;
    const waiverGemPlayer = item.type === 'WAIVER_GEM' && item.playerName ? players.find((p: any) => p.name === item.playerName) : null;
    const canClaimPlayer = waiverGemPlayer && onClaimPlayer;

    const actionButton = () => {
        if (canGetAdvice) {
            return (
                <button
                    onClick={(e: any) => {
                        e.stopPropagation();
                        onGetAdvice(item.relatedPlayerIds!);
                    }}
                    className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 text-cyan-300 text-xs font-bold rounded-md hover:bg-cyan-500/20"
                >
                    <WandIcon />
                    Get Lineup Advice
                </button>
            );
        }
        if (canClaimPlayer) {
             return (
                <button
                    onClick={(e: any) => {
                        e.stopPropagation();
                        onClaimPlayer(waiverGemPlayer);
                    }}
                    className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-300 text-xs font-bold rounded-md hover:bg-green-500/20"
                >
                    <PlusCircleIcon />
                    Claim Player
                </button>
            );
        }
        return null;
    }
    
    return (
        <motion.div
            onClick={handleCardClick}
            className="flex items-start gap-3 p-2 bg-black/10 rounded-lg cursor-pointer hover:bg-black/20"
            {...{
                layout: true,
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0 },
                transition: { type: 'spring', stiffness: 300, damping: 30 },
            }}
        >
            <div className={`mt-0.5 ${config.color}`}>
                {config.icon}
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm text-white">{item.title}</h4>
                <p className="text-xs text-gray-300">{item.summary}</p>
                {actionButton()}
            </div>
        </motion.div>
    );
};

export default BriefingItemCard;