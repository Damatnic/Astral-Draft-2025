import React from 'react';
import type { Team, League } from '../../types';

interface WeeklyScoreChartProps {
    team: Team;
    league: League;
}

const WeeklyScoreChart: React.FC<WeeklyScoreChartProps> = ({ team, league }) => {
    const chartRef = React.useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = React.useState<{ x: number, y: number, content: React.ReactNode } | null>(null);

    const chartData = React.useMemo(() => {
        const data = [];
        for (let week = 1; week < league.currentWeek; week++) {
            const matchup = league.schedule.find((m: any) => m.week === week && (m.teamA.teamId === team.id || m.teamB.teamId === team.id));
            const myScore = matchup ? (matchup.teamA.teamId === team.id ? matchup.teamA.score : matchup.teamB.score) : 0;

            const weeklyMatchups = league.schedule.filter((m: any) => m.week === week);
            const totalScore = weeklyMatchups.reduce((acc, m) => acc + m.teamA.score + m.teamB.score, 0);
            const leagueAverage = weeklyMatchups.length > 0 ? totalScore / (weeklyMatchups.length * 2) : 0;
            
            data.push({ week, myScore, leagueAverage });
        }
        return data;
    }, [team, league]);

    if (chartData.length < 2) {
        return <p className="text-center text-sm text-gray-400 p-8">Not enough data to display a trend.</p>;
    }

    const width = 500;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };

    const maxScore = Math.max(...chartData.flatMap(d => [d.myScore, d.leagueAverage]), 1);
    const weeks = chartData.map((d: any) => d.week);

    const xScale = (week: number) => padding.left + ((week - weeks[0]) / (weeks[weeks.length - 1] - weeks[0] || 1)) * (width - padding.left - padding.right);
    const yScale = (score: number) => height - padding.bottom - (score / maxScore) * (height - padding.top - padding.bottom);

    const createPath = (dataKey: 'myScore' | 'leagueAverage') => {
        return chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.week)},${yScale(d[dataKey])}`).join(' ');
    };

    const myScorePath = createPath('myScore');
    const avgScorePath = createPath('leagueAverage');

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!chartRef.current) return;
        const svgRect = chartRef.current.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;

        const weekIndex = Math.round(((mouseX - padding.left) / (width - padding.left - padding.right)) * (weeks.length - 1));
        const weekData = chartData[weekIndex];
        if (!weekData) return;

        setTooltip({
            x: e.clientX - svgRect.left,
            y: e.clientY - svgRect.top,
            content: (
                <div className="p-2 bg-gray-900/80 border border-white/10 rounded-lg text-xs shadow-lg">
                    <p className="font-bold mb-1">Week {weekData.week}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                        <span>My Score:</span>
                        <span className="font-bold">{weekData.myScore.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        <span>League Avg:</span>
                        <span className="font-bold">{weekData.leagueAverage.toFixed(2)}</span>
                    </div>
                </div>
            )
        });
    };

    const handleMouseLeave = () => setTooltip(null);

    return (
        <div className="p-4 sm:p-6 h-full flex flex-col">
            <div className="relative flex-grow">
                <svg ref={chartRef} viewBox={`0 0 ${width} ${height}`} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="w-full h-full">
                    {/* Axes and Gridlines */}
                    <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#475569" />
                    <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#475569" />
                    
                    {[0, 0.25, 0.5, 0.75, 1].map((p: any) => {
                        const y = yScale(p * maxScore);
                        return (
                             <g key={p}>
                                <text x={padding.left - 8} y={y} textAnchor="end" alignmentBaseline="middle" fill="#94a3b8" fontSize="10">
                                    {Math.round(p * maxScore)}
                                </text>
                                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#475569" strokeDasharray="2,2" opacity="0.3"/>
                            </g>
                        );
                    })}
                     {weeks.map((w: any) => (
                         <text key={w} x={xScale(w)} y={height - padding.bottom + 15} textAnchor="middle" fill="#94a3b8" fontSize="10">
                             W{w}
                         </text>
                     ))}

                    {/* Data Lines */}
                    <path d={avgScorePath} fill="none" stroke="#6b7280" strokeWidth="2" strokeDasharray="4,4" />
                    <path d={myScorePath} fill="none" stroke="#06b6d4" strokeWidth="3" />

                    {/* Data Points */}
                    {chartData.map((d: any) => (
                         <circle key={`my-${d.week}`} cx={xScale(d.week)} cy={yScale(d.myScore)} r="3" fill="#06b6d4" />
                    ))}
                     {chartData.map((d: any) => (
                         <circle key={`avg-${d.week}`} cx={xScale(d.week)} cy={yScale(d.leagueAverage)} r="3" fill="#6b7280" />
                    ))}

                    {/* Tooltip line */}
                    {tooltip && (
                        <line x1={tooltip.x} y1={padding.top} x2={tooltip.x} y2={height - padding.bottom} stroke="#facc15" strokeDasharray="3,3" />
                    )}
                </svg>
                 {tooltip && (
                    <div className="absolute pointer-events-none p-2 rounded-lg" style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}>
                        {tooltip.content}
                    </div>
                )}
            </div>
             <div className="flex-shrink-0 flex justify-center gap-6 text-xs mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded-sm"></div>
                    <span>My Score</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-px border-t-2 border-dashed border-gray-500"></div>
                    <span>League Average</span>
                </div>
            </div>
        </div>
    );
};

export default WeeklyScoreChart;
