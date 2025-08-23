



import React from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../../types';
import { ContractIcon } from '../../icons/ContractIcon';

interface ScoutingTabProps {
  player: Player;
}

const ScoutingTab: React.FC<ScoutingTabProps> = ({ player }) => {
  const { scoutingReport: report, contract } = player;

  if (!report) {
      return <p className="text-gray-500">No scouting report available for this player.</p>
  }

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
        <h3 className="font-bold text-lg text-cyan-300 mb-2">Scouting Summary</h3>
        <p className="text-gray-300 text-sm italic">"{report.summary}"</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-green-400 mb-2">Strengths</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
            {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-red-400 mb-2">Weaknesses</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
             {report.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      </div>

      {contract && (
        <div>
            <h3 className="font-bold text-lg text-cyan-300 mb-2 flex items-center gap-2"><ContractIcon /> Contract Details</h3>
            <div className="text-sm bg-white/5 p-4 rounded-lg flex justify-around">
                <div><span className="text-gray-400">Years: </span><strong className="text-white">{contract.years}</strong></div>
                <div><span className="text-gray-400">Value: </span><strong className="text-white">{contract.amount}</strong></div>
                <div><span className="text-gray-400">Guaranteed: </span><strong className="text-white">{contract.guaranteed}</strong></div>
            </div>
        </div>
      )}

    </motion.div>
  );
};

export default ScoutingTab;