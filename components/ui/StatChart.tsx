

import React from 'react';
import { motion } from 'framer-motion';

interface StatChartProps {
  label: string;
  value: number;
  maxValue: number;
  prefix?: string;
  color?: string;
}

const StatChart: React.FC<StatChartProps> = ({ label, value, maxValue, prefix = '', color = 'bg-cyan-500' }) => {
  const percentage = (value / maxValue) * 100;

  return (
    <div className="bg-white/5 p-3 rounded-lg w-full">
      <div className="flex justify-between items-baseline mb-1">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-lg font-bold text-white">{prefix}{value}</p>
      </div>
      <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          {...{
            initial: { width: 0 },
            animate: { width: `${percentage}%` },
            transition: { duration: 0.8, ease: 'easeOut' },
          }}
        />
      </div>
    </div>
  );
};

export default StatChart;