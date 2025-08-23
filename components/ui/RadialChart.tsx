
import React from 'react';
import { motion } from 'framer-motion';

interface RadialChartProps {
    value: number;
    maxValue: number;
    label: string;
    unit?: string;
    size?: number;
    strokeWidth?: number;
}

const RadialChart: React.FC<RadialChartProps> = ({ value, maxValue, label, unit = '', size = 80, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = value / maxValue;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="flex flex-col items-center gap-1 text-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        className="stroke-gray-700"
                        fill="none"
                    />
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        className="stroke-cyan-400"
                        fill="none"
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        strokeDasharray={circumference}
                        {...{
                            initial: { strokeDashoffset: circumference },
                            animate: { strokeDashoffset },
                            transition: { duration: 1, ease: 'easeOut' },
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-lg text-white">{value}{unit}</span>
                </div>
            </div>
            <p className="text-xs text-gray-400">{label}</p>
        </div>
    );
};

export default RadialChart;
