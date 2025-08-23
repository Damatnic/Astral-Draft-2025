
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { calculateLeagueStats } from '../utils/stats';
import type { TeamStats } from '../utils/stats';
import { Avatar } from '../components/ui/Avatar';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { FlameIcon } from '../components/icons/FlameIcon';
import { ShieldAlertIcon } from '../components/icons/ShieldAlertIcon';

const Leaderboard: React.FC<{ title: string; icon: React.ReactNode; data: TeamStats[]; valueKey: keyof TeamStats; subtext?: (stat: TeamStats) => string }> = ({ title, icon, data, valueKey, subtext }) => (
    <Widget title={title} icon={icon}>
        <div className="p-2 space-y-1">
            {data.map((stat, index) => (
                <div key={stat.teamId} className={`flex items-center gap-3 p-2 rounded-md ${index === 0 ? 'bg-yellow-500/10' : 'bg-black/10'}`}>
                    <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
                    <Avatar avatar={stat.avatar} className="w-8 h-8 rounded-md" />
                    <div className="flex-grow">
                        <p className="font-semibold text-sm">{stat.teamName}</p>
                        {subtext && <p className="text-xs text-gray-400">{subtext(stat)}</p>}
                    </div>
                    <p className="font-bold text-lg font-mono">
                        {(valueKey === 'highestWeek' ? stat.highestWeek.score : stat[valueKey] as number).toFixed(2)}
                    </p>
                </div>
            ))}
        </div>
    </Widget>
);

const LeagueStatsView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league } = useLeague();
    
    if (!league || league.status === 'PRE_DRAFT' || league.status === 'DRAFTING') {
        return <ErrorDisplay title="Not Available" message="League stats will be available once the season starts." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' })} />;
    }

    const leaderboards = calculateLeagueStats(league);

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        League Statistics
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to League Hub
                </button>
            </header>
            <main className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Leaderboard 
                    title="Total Points For"
                    icon={<TrophyIcon />}
                    data={leaderboards.pointsFor}
                    valueKey="totalPointsFor"
                />
                <Leaderboard 
                    title="Best Week"
                    icon={<FlameIcon />}
                    data={leaderboards.highestSingleGame}
                    valueKey="highestWeek"
                    subtext={(stat) => `Week ${stat.highestWeek.week}`}
                />
                <Leaderboard 
                    title="Total Points Against"
                    icon={<ShieldAlertIcon />}
                    data={leaderboards.pointsAgainst}
                    valueKey="totalPointsAgainst"
                />
            </main>
        </div>
    );
};

export default LeagueStatsView;