import React from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../../types';
import { InjuryIcon } from '../../icons/InjuryIcon';
import Tooltip from '../../ui/Tooltip';
import { InfoIcon } from '../../icons/InfoIcon';
import StatChart from '../../ui/StatChart';
import RadialChart from '../../ui/RadialChart';

interface FantasyTabProps {
  player: Player;
}

const FantasyTab: React.FC<FantasyTabProps> = ({ player }) => {
  const maxStat = 500; // A reasonable max for chart scaling
  return (
    <motion.div
      className="space-y-6"
      {...{
        initial: { opacity: 0, x: -10 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.3 },
      }}
    >
      <div>
        <h3 className="font-bold text-lg text-cyan-300 mb-2">2024 Fantasy Outlook</h3>
        <p className="text-gray-300 text-sm">
          {`${player.name} enters the season as a key player for the ${player.team}. With a projection of ${player.stats.projection} points, he's considered a solid ${player.position}${player?.tier} in most formats. His ADP of ${player?.adp} suggests managers are valuing him as a reliable starter with significant upside.`}
        </p>
      </div>

       <div>
        <h3 className="font-bold text-lg text-cyan-300 mb-2">Fantasy Value Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <StatChart label="Projection" value={player.stats.projection} maxValue={maxStat} color="bg-green-500" />
            <StatChart label="Last Year" value={player.stats.lastYear} maxValue={maxStat} color="bg-blue-500" />
            <StatChart label="Auction Value" value={player.auctionValue} maxValue={100} prefix="$" color="bg-yellow-500" />
             <div className="bg-white/5 p-3 rounded-lg">
                 <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                    <span>VORP</span>
                     <Tooltip text="Value Over Replacement Player: Measures a player's value compared to a baseline 'replacement-level' player at the same position. Higher is better.">
                        <InfoIcon />
                    </Tooltip>
                 </div>
                <p className="text-2xl font-bold text-white">{player.stats.vorp.toFixed(1)}</p>
            </div>
        </div>
      </div>

      {player.advancedMetrics && (
        <div>
            <h3 className="font-bold text-lg text-cyan-300 mb-4">Advanced Metrics (Season)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <RadialChart 
                    label="Snap Count %"
                    value={player.advancedMetrics.snapCountPct}
                    maxValue={100}
                    unit="%"
                />
                <RadialChart 
                    label="Target Share %"
                    value={player.advancedMetrics.targetSharePct}
                    maxValue={40} // 40% is an elite share
                    unit="%"
                />
                 <RadialChart 
                    label="RedZone Touches"
                    value={player.advancedMetrics.redZoneTouches}
                    maxValue={60} // 60 is an elite number of RZ touches
                />
            </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-lg text-cyan-300 mb-2 flex items-center gap-2"><InjuryIcon /> Injury History</h3>
        {player?.injuryHistory && player?.injuryHistory.length > 0 ? (
          <div className="bg-white/5 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Injury</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {player?.injuryHistory.map((injury, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-2 text-gray-400">{injury.date}</td>
                    <td className="p-2 text-white">{injury?.injury}</td>
                    <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${injury?.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {injury?.status}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No significant injury history on record.</p>
        )}
      </div>
    </motion.div>
  );
};

export default FantasyTab;