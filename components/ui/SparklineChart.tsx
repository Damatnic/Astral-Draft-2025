
import React from 'react';

interface SparklineChartProps {
    data: number[];
    width?: number;
    height?: number;
    strokeColor?: string;
    strokeWidth?: number;
}

const SparklineChart: React.FC<SparklineChartProps> = ({
    data,
    width = 100,
    height = 30,
    strokeColor = '#06b6d4', // cyan-500
    strokeWidth = 2,
}) => {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    const points = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d - min) / (range || 1)) * height;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="100%"
            preserveAspectRatio="none"
        >
            <polyline
                points={points}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default SparklineChart;