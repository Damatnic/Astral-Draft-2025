
import React from 'react';
import type { Team } from '../../types';
import Tooltip from '../ui/Tooltip';

interface MyTeamCompositionChartProps {
    team: Team;
}

const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

const positionColors: { [key: string]: string } = {
    QB: 'from-red-500 to-red-700',
    RB: 'from-green-500 to-green-700',
    WR: 'from-blue-500 to-blue-700',
    TE: 'from-orange-500 to-orange-700',
    K: 'from-yellow-500 to-yellow-700',
    DST: 'from-purple-500 to-purple-700',
};

const MyTeamCompositionChart: React.FC<MyTeamCompositionChartProps> = ({ team }) => {
    const composition = React.useMemo(() => {
        const counts: { [key: string]: number } = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };
        team.roster.forEach((player: any) => {
            if (counts[player.position] !== undefined) {
                counts[player.position]++;
            }
        });
        return positionOrder.map((pos: any) => ({
            position: pos,
            count: counts[pos]
        }));
    }, [team.roster]);

    const maxCount = Math.max(...composition.map((c: any) => c.count), 5); // Ensure a minimum height for the chart

    return (
        <div className="p-4">
             <h4 className="font-bold text-sm text-center mb-4 text-gray-300">Roster Composition</h4>
             <div className="flex justify-around items-end h-48 gap-2">
                {composition.map(({ position, count }) => (
                     <Tooltip key={position} text={`${count} ${position}${count !== 1 ? 's' : ''}`}>
                        <div className="flex flex-col items-center gap-1 w-full">
                            <div 
                                className={`w-full bg-gradient-to-t ${positionColors[position]} rounded-t-md transition-all duration-500 ease-out`}
                                style={{ height: `${(count / maxCount) * 100}%` }}
                            ></div>
                            <span className="text-xs font-bold text-gray-400">{position}</span>
                        </div>
                     </Tooltip>
                ))}
            </div>
        </div>
    );
};

export default MyTeamCompositionChart;
