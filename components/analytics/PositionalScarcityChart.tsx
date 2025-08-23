
import React from 'react';
import { Player, PlayerPosition } from '../../types';
import { players as allPlayers } from '../../data/players';
import Tooltip from '../ui/Tooltip';

interface PositionalScarcityChartProps {
    availablePlayers: Player[];
}

const positions: PlayerPosition[] = ['QB', 'RB', 'WR', 'TE'];
const ELITE_TIER_THRESHOLD = 3;

const PositionalScarcityChart: React.FC<PositionalScarcityChartProps> = ({ availablePlayers }) => {

    const scarcityData = React.useMemo(() => {
        return positions.map((pos: any) => {
            const totalEliteInPosition = allPlayers.filter(p => p.position === pos && p?.tier <= ELITE_TIER_THRESHOLD);
            const availableEliteInPosition = availablePlayers.filter(p => p.position === pos && p?.tier <= ELITE_TIER_THRESHOLD);
            
            const availabilityPercent = totalEliteInPosition.length > 0
                ? (availableEliteInPosition.length / totalEliteInPosition.length) * 100
                : 0;
            
            return {
                pos,
                availabilityPercent,
                tooltipText: `${availableEliteInPosition.length} of ${totalEliteInPosition.length} elite (Tiers 1-${ELITE_TIER_THRESHOLD}) ${pos}s remain.`
            };
        });
    }, [availablePlayers]);


    return (
         <div className="p-4">
            <h4 className="font-bold text-sm text-center mb-1 text-gray-300">Elite Talent Pool</h4>
            <p className="text-xs text-center mb-4 text-gray-500">Percentage of Tiers 1-3 players remaining.</p>
            <div className="space-y-3">
                {scarcityData.map((data: any) => (
                    <Tooltip key={data.pos} text={data.tooltipText}>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="w-8 font-bold text-gray-400">{data.pos}</span>
                            <div className="flex-grow bg-black/20 h-5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                    style={{ width: `${data.availabilityPercent}%`}}
                                >
                                   <span className="text-white font-bold text-[10px]">{Math.round(data.availabilityPercent)}%</span>
                                </div>
                            </div>
                        </div>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
};

export default PositionalScarcityChart;
