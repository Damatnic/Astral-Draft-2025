

import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { MatchupPlayer, GamedayEvent } from '../../types';
import AnimatedNumber from '../ui/AnimatedNumber';
import { FlameIcon } from '../icons/FlameIcon';
import Tooltip from '../ui/Tooltip';

interface PlayerRowProps {
    playerData: MatchupPlayer;
    position: string;
    latestEvent: GamedayEvent | null;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ playerData, position, latestEvent }) => {
    const controls = useAnimation();
    const { player, projectedScore, actualScore, isHot } = playerData;

    React.useEffect(() => {
        if (latestEvent && latestEvent.player.id === player.id && latestEvent.type !== 'REDZONE_ENTRY') {
            controls.start({
                backgroundColor: ["#16a34a", "rgba(0,0,0,0.1)"],
                transition: { duration: 1.5, ease: "easeOut" },
            });
        }
    }, [latestEvent, player.id, controls]);

    return (
        <motion.div
            {...{ animate: controls }}
            className="grid grid-cols-[3rem_1fr_4rem_4rem] gap-2 items-center p-2 rounded-md"
        >
            <span className="font-bold text-cyan-300">{position}</span>
            <div className="flex items-center gap-2">
                {isHot && (
                    <Tooltip text={`${player.name} is in the RedZone!`}>
                        <FlameIcon className="h-4 w-4 text-red-500 animate-pulse" />
                    </Tooltip>
                )}
                <div>
                    <p className="font-semibold text-sm text-white">{player.name}</p>
                    <p className="text-xs text-gray-500">{player.team}</p>
                </div>
            </div>
            <span className="text-right text-sm text-gray-300 font-mono">{projectedScore.toFixed(2)}</span>
            <span className="text-right text-sm font-bold text-white font-mono">
                <AnimatedNumber value={actualScore} />
            </span>
        </motion.div>
    );
};

export default PlayerRow;
