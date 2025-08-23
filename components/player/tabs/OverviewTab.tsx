import React from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../../types';
import { SparklesIcon } from '../../icons/SparklesIcon';
import { AwardIcon } from '../../icons/AwardIcon';
import { useLeague } from '../../../hooks/useLeague';

interface OverviewTabProps {
  player: Player;
  onFindSimilar: () => void;
}

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-white/5 p-3 rounded-lg text-center">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
    </div>
);

const OverviewTab: React.FC<OverviewTabProps> = ({ player, onFindSimilar }) => {
  const { league } = useLeague();
  const awards = (league?.playerAwards || []).filter((a: any) => a.playerId === player.id);
  const teamMap = new Map(league?.teams.map((t: any) => [t.id, t.name]));

  return (
    <motion.div
      className="space-y-6"
      {...{
        initial: { opacity: 0, x: -10 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.3 },
      }}
    >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-cyan-300">Player Bio</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{player.bio || "No biography available."}</p>
                </div>
                 {awards.length > 0 && (
                    <div>
                        <h3 className="font-bold text-lg text-yellow-300 flex items-center gap-2"><AwardIcon /> Season Awards</h3>
                        <div className="mt-2 space-y-2">
                            {awards.map((award, i) => (
                                <div key={i} className="bg-yellow-500/10 p-2 rounded-md text-sm">
                                    <p className="font-bold text-yellow-300">{award.awardType.replace('_', ' ')} ({award.season})</p>
                                    <p className="text-xs text-gray-400">Awarded by: {teamMap.get(award.awardedByTeamId) || 'Unknown'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div>
                    <button 
                        onClick={onFindSimilar} 
                        className="flex items-center gap-2 px-4 py-1.5 bg-transparent border border-cyan-400/50 text-cyan-300 font-bold text-sm rounded-md hover:bg-cyan-400/20"
                    >
                        <SparklesIcon />
                        Find Similar Players (AI)
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-cyan-300">Key Stats</h3>
                <div className="grid grid-cols-2 gap-2">
                    <StatCard label="Rank" value={player.rank} />
                    <StatCard label="ADP" value={player?.adp} />
                    <StatCard label="Tier" value={player?.tier} />
                    <StatCard label="Bye" value={player.bye} />
                    <StatCard label="Projection" value={player.stats.projection} />
                    <StatCard label="Last Year" value={player.stats.lastYear} />
                </div>
            </div>
        </div>
    </motion.div>
  );
};

export default OverviewTab;