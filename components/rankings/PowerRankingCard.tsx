



import React from 'react';
import type { PowerRanking, Team } from '../../types';
import { motion } from 'framer-motion';
import { ArrowUpIcon } from '../icons/ArrowUpIcon';
import { ArrowDownIcon } from '../icons/ArrowDownIcon';
import { MinusIcon } from '../icons/MinusIcon';
import { Avatar } from '../ui/Avatar';

interface PowerRankingCardProps {
    ranking: PowerRanking;
    team?: Team;
    isMyTeam?: boolean;
}

const TrendIcon: React.FC<{ trend: PowerRanking['trend'] }> = ({ trend }) => {
    switch (trend) {
        case 'up': return <ArrowUpIcon className="h-5 w-5 text-green-400" />;
        case 'down': return <ArrowDownIcon className="h-5 w-5 text-red-400" />;
        case 'same': return <MinusIcon className="h-5 w-5 text-gray-500" />;
        default: return null;
    }
};

const PowerRankingCard: React.FC<PowerRankingCardProps> = ({ ranking, team, isMyTeam }) => {
    if (!team) return null;

    return (
        <motion.div
            className={`p-4 bg-white/5 rounded-lg flex gap-4 transition-all ${isMyTeam ? 'ring-2 ring-cyan-400 bg-cyan-500/10' : ''}`}
            {...{
                layout: true,
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0 },
            }}
        >
            <div className="flex flex-col items-center flex-shrink-0">
                <span className="font-display font-bold text-4xl text-cyan-300">{ranking.rank}</span>
                <TrendIcon trend={ranking.trend} />
            </div>
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <Avatar avatar={team.avatar} className="w-10 h-10 text-2xl rounded-lg" />
                    <div>
                        <p className="font-bold text-white">{team.name}</p>
                        <p className="text-xs text-gray-400">
                           ({team.record.wins}-{team.record.losses}{team.record.ties > 0 ? `-${team.record.ties}`: ''})
                        </p>
                    </div>
                </div>
                <p className="text-xs text-gray-300 mt-2 italic">
                    "{ranking.justification}"
                </p>
            </div>
        </motion.div>
    );
};

export default PowerRankingCard;