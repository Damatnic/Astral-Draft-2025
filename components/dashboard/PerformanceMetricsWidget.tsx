
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { Widget } from '../ui/Widget';
import { ActivityIcon, TrophyIcon, UserIcon } from 'lucide-react'; // Assuming lucide-react is available or similar icons
import { FlameIcon } from '../icons/FlameIcon';
import { StarIcon } from '../icons/StarIcon';
import { BarChartIcon } from 'lucide-react';

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
    <div className="flex items-center gap-2">
        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-black/20 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-bold text-white">{value}</p>
        </div>
    </div>
);

const PerformanceMetricsWidget: React.FC = () => {
    const { state } = useAppState();
    const activeLeague = state.leagues.find((l: any) => l.id === state.activeLeagueId);
    const myTeam = activeLeague?.teams.find((t: any) => t.owner.id === state.user.id);

    if (!myTeam || !activeLeague || activeLeague?.status === 'PRE_DRAFT' || activeLeague?.status === 'DRAFTING') {
        return (
             <Widget title="My Performance">
                 <div className="p-4 text-center text-xs text-gray-400 h-full flex items-center justify-center">
                    Performance metrics will appear here once the season starts.
                 </div>
            </Widget>
        );
    }

    const weeklyScores = activeLeague.schedule
        .filter(m => m.week < activeLeague.currentWeek && (m.teamA.teamId === myTeam.id || m.teamB.teamId === myTeam.id))
        .map((m: any) => m.teamA.teamId === myTeam.id ? m.teamA.score : m.teamB.score);
    
    const bestWeek = weeklyScores.length > 0 ? Math.max(...weeklyScores).toFixed(2) : 'N/A';
    
    const teamMVP = myTeam.roster.length > 0 ? myTeam.roster.sort((a,b) => b.stats.projection - a.stats.projection)[0].name : 'N/A';
    
    const rank = [...activeLeague.teams].sort((a, b) => b.record.wins - a.record.wins).findIndex((t: any) => t.id === myTeam.id) + 1;


    return (
        <Widget title="My Performance">
            <div className="p-3 space-y-3">
                <StatCard icon={<FlameIcon />} label="Best Week" value={bestWeek} color="text-orange-400" />
                <StatCard icon={<StarIcon />} label="Team MVP" value={teamMVP} color="text-yellow-400" />
                <StatCard icon={<TrophyIcon />} label="Current Rank" value={rank} color="text-cyan-400" />
            </div>
        </Widget>
    );
};

export default PerformanceMetricsWidget;
