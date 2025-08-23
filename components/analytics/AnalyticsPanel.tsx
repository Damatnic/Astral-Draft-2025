
import React from 'react';
import type { Analytics } from '../../types';
import AnimatedNumber from '../ui/AnimatedNumber';
import { ZapIcon } from '../icons/ZapIcon';
import { FlameIcon } from '../icons/FlameIcon';
import { TrophyIcon } from '../icons/TrophyIcon';
import Tooltip from '../ui/Tooltip';


interface AnalyticsPanelProps {
  analytics: Analytics;
}

const AnalyticsCard: React.FC<{ icon: React.ReactNode; label: string; value: number; unit: string; color: string; tooltip: string; }> = ({ icon, label, value, unit, color, tooltip }) => (
    <div className={`p-2 bg-gray-800/50 rounded-lg flex items-center gap-3`}>
        <Tooltip text={tooltip}>
            <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-900/50 ${color}`}>
                {icon}
            </div>
        </Tooltip>
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-xl font-bold text-white">
                <AnimatedNumber value={value} />
                <span className="text-sm font-normal text-gray-400">{unit}</span>
            </p>
        </div>
    </div>
);

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ analytics }) => {
  return (
    <div className="glass-pane flex-shrink-0 flex flex-col bg-gray-900/40 border border-cyan-300/20 rounded-2xl backdrop-blur-sm shadow-2xl shadow-black/50">
      <div className="flex-shrink-0 p-3 text-center border-b border-cyan-300/20">
        <h2 className="font-display text-xl font-bold text-white tracking-wider">DRAFT ANALYTICS</h2>
      </div>
      <div className="p-2 space-y-2">
            <AnalyticsCard 
                icon={<ZapIcon />} 
                label="Draft Efficiency"
                value={analytics.draftEfficiency}
                unit="%"
                color="text-green-400"
                tooltip="Measures how well your picks align with expert rankings and ADP."
            />
             <AnalyticsCard 
                icon={<FlameIcon />} 
                label="Value Picks Found"
                value={analytics.valuePicks}
                unit=""
                color="text-orange-400"
                tooltip="Number of players drafted significantly later than their ADP."
            />
             <AnalyticsCard 
                icon={<TrophyIcon />} 
                label="Championship Prob."
                value={analytics.championshipProbability}
                unit="%"
                color="text-yellow-400"
                tooltip="An estimated probability of winning based on roster strength."
            />
      </div>
    </div>
  );
};

export default AnalyticsPanel;