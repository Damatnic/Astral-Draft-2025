
import React from 'react';
import type { Player, League } from '../../types';
import Tooltip from '../ui/Tooltip';

interface PlayerPerformanceChartProps {
    player: Player;
    league: League;
}

const PlayerPerformanceChart: React.FC<PlayerPerformanceChartProps> = ({ player, league }) => {
    const chartData = React.useMemo(() => {
        const data = [];
        for (let week = 1; week < league.currentWeek; week++) {
            const matchup = league.schedule.find((m: any) => m.week === week);
            if (!matchup) continue;

            const playerMatchupData = matchup.teamA.roster.find((p: any) => p.player.id === player.id) || matchup.teamB.roster.find((p: any) => p.player.id === player.id);
            
            const actualScore = playerMatchupData?.actualScore || 0;
            const projectedScore = player.stats.weeklyProjections[week] || (player.stats.projection / 17);

            data.push({ week, actualScore, projectedScore });
        }
        return data;
    }, [player, league]);

    if (chartData.length === 0) {
        return <p className="text-center text-sm text-gray-400 p-8">No games have been played yet.</p>;
    }

    const maxScore = Math.max(...chartData.flatMap(d => [d.actualScore, d.projectedScore]), 1);

    return (
        <div className="p-4 sm:p-6 h-80 flex flex-col">
            <div className="flex-grow flex items-end gap-2 sm:gap-4 border-b-2 border-l-2 border-white/10 p-2">
                {chartData.map(({ week, actualScore, projectedScore }) => (
                    <div key={week} className="flex-1 h-full flex flex-col justify-end items-center">
                        <div className="relative w-full h-full flex items-end justify-center">
                            <Tooltip text={`Actual: ${actualScore.toFixed(2)}`}>
                                <div
                                    className="w-1/2 bg-cyan-500 rounded-t-md"
                                    style={{ height: `${(actualScore / maxScore) * 100}%` }}
                                ></div>
                            </Tooltip>
                            <Tooltip text={`Projected: ${projectedScore.toFixed(2)}`}>
                                 <div
                                    className="absolute w-full bottom-0 border-t-2 border-dashed border-yellow-400"
                                    style={{ height: `${(projectedScore / maxScore) * 100}%` }}
                                ></div>
                            </Tooltip>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">Wk {week}</span>
                    </div>
                ))}
            </div>
            <div className="flex-shrink-0 flex justify-center gap-6 text-xs mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded-sm"></div>
                    <span>Actual Score</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-px border-t-2 border-dashed border-yellow-400"></div>
                    <span>Projected Score</span>
                </div>
            </div>
        </div>
    );
};

export default PlayerPerformanceChart;
