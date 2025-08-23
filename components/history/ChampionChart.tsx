


import React from 'react';
import { motion } from 'framer-motion';
import type { LeagueHistoryEntry, Team } from '../../types';
import { Avatar } from '../ui/Avatar';
import Tooltip from '../ui/Tooltip';

interface ChampionChartProps {
    history: LeagueHistoryEntry[];
    teams: Team[];
}

const ChampionChart: React.FC<ChampionChartProps> = ({ history, teams }) => {
    const championCounts = React.useMemo(() => {
        const counts: { [teamId: number]: number } = {};
        history.forEach((entry: any) => {
            counts[entry.championTeamId] = (counts[entry.championTeamId] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([teamId, count]) => {
                const team = teams.find((t: any) => t.id === Number(teamId));
                return {
                    team,
                    count
                };
            })
            .filter((item: any) => item.team)
            .sort((a, b) => b.count - a.count);
    }, [history, teams]);

    if (championCounts.length === 0) {
        return null;
    }

    const maxCount = Math.max(...championCounts.map((c: any) => c.count), 1);

    return (
        <div className="w-full h-56 flex items-end justify-center gap-4 px-4">
            {championCounts.map(({ team, count }, index) => (
                <motion.div
                    key={team!.id}
                    className="w-16 flex flex-col items-center gap-2"
                    {...{
                        initial: { opacity: 0, y: 30 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: index * 0.1, type: 'spring' },
                    }}
                >
                    <Tooltip text={`${count} championship${count > 1 ? 's' : ''}`}>
                        <div
                            className="w-full bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-md hover:shadow-lg hover:shadow-yellow-400/30 transition-shadow"
                            style={{ height: `${(count / maxCount) * 100}%` }}
                        ></div>
                    </Tooltip>
                    <Avatar avatar={team!.avatar} className="w-12 h-12 text-3xl rounded-lg" alt={team!.name}/>
                    <p className="text-xs text-center font-semibold truncate w-full">{team!.name}</p>
                </motion.div>
            ))}
        </div>
    );
};

export default ChampionChart;
