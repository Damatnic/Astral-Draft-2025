
import React from 'react';
import type { League } from '../../types';

interface ChampionshipProbChartProps {
    league: League;
}

const teamColors = [
    '#34d399', '#f87171', '#60a5fa', '#facc15', '#a78bfa', '#fb923c',
    '#f472b6', '#38bdf8', '#a3e635', '#4ade80', '#c084fc', '#fb7185'
];

const ChampionshipProbChart: React.FC<ChampionshipProbChartProps> = ({ league }) => {
    const chartRef = React.useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = React.useState<{ x: number, y: number, content: React.ReactNode } | null>(null);

    const width = 800;
    const height = 400;
    const padding = 50;

    const weeks = Array.from({ length: league.currentWeek }, (_, i) => i + 1);
    const xScale = (week: number) => padding + ((week - 1) / (weeks.length - 1 || 1)) * (width - 2 * padding);
    const yScale = (prob: number) => height - padding - (prob / 100) * (height - 2 * padding);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!chartRef.current) return;
        const svgRect = chartRef.current.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        
        const weekIndex = Math.round(((mouseX - padding) / (width - 2 * padding)) * (weeks.length - 1));
        const week = weeks[weekIndex];
        if (week === undefined) return;

        const dataForWeek = league.teams.map((team, i) => {
            const prob = team.championshipProbHistory?.find((h: any) => h.week === week)?.probability ?? null;
            return { name: team.name, prob, color: teamColors[i % teamColors.length] };
        }).filter((d: any) => d.prob !== null).sort((a, b) => b.prob! - a.prob!);

        if (dataForWeek.length === 0) return;

        setTooltip({
            x: e.clientX - svgRect.left,
            y: e.clientY - svgRect.top,
            content: (
                <div className="p-2 bg-gray-900/80 rounded-lg text-xs">
                    <p className="font-bold mb-1">Week {week}</p>
                    {dataForWeek.map((d: any) => (
                        <div key={d.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                            <span>{d.name}:</span>
                            <span className="font-bold">{d.prob?.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            )
        });
    };
    
    const handleMouseLeave = () => setTooltip(null);

    return (
        <div className="relative w-full h-full">
            <svg ref={chartRef} viewBox={`0 0 ${width} ${height}`} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="w-full h-full">
                {/* Axes */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#475569" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#475569" />
                
                {/* Y-axis labels */}
                {[0, 25, 50, 75, 100].map((p: any) => (
                    <g key={p}>
                        <text x={padding - 10} y={yScale(p)} textAnchor="end" alignmentBaseline="middle" fill="#94a3b8" fontSize="12">{p}%</text>
                        <line x1={padding} y1={yScale(p)} x2={width - padding} y2={yScale(p)} stroke="#475569" strokeDasharray="2,2" opacity="0.5"/>
                    </g>
                ))}
                
                 {/* X-axis labels */}
                 {weeks.map((w: any) => (
                     <text key={w} x={xScale(w)} y={height - padding + 20} textAnchor="middle" fill="#94a3b8" fontSize="12">{w}</text>
                 ))}

                {/* Data lines */}
                {league.teams.map((team, i) => {
                    const history = team.championshipProbHistory?.filter(h => h.week <= league.currentWeek) || [];
                    if (history.length < 2) return null;
                    const pathData = history.map((h: any) => `${xScale(h.week)},${yScale(h.probability)}`).join(' L ');
                    return (
                        <path key={team.id} d={`M ${pathData}`} fill="none" stroke={teamColors[i % teamColors.length]} strokeWidth="2" />
                    );
                })}
            </svg>
            {tooltip && (
                <div className="absolute pointer-events-none p-2 rounded-lg" style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}>
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};

export default ChampionshipProbChart;