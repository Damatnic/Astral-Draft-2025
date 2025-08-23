
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { generateProjectedStandings } from '../services/geminiService';
import type { ProjectedStanding } from '../types';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Avatar } from '../components/ui/Avatar';

const ProjectedStandingsView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    const [standings, setStandings] = React.useState<ProjectedStanding[] | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (league && (league.status === 'IN_SEASON' || league.status === 'PLAYOFFS')) {
            setIsLoading(true);
            setError(null);
            generateProjectedStandings(league)
                .then(data => {
                    if (data) {
                        setStandings(data);
                    } else {
                        setError("The Oracle could not generate projections at this time.");
                    }
                })
                .catch(() => setError("An error occurred while consulting the Oracle."))
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [league]);

    if (!league || !(league.status === 'IN_SEASON' || league.status === 'PLAYOFFS')) {
        return <ErrorDisplay title="Not Available" message="Projected standings are only available during an active season." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_STANDINGS' })} />;
    }
    
    const sortedStandings = standings
        ? [...standings].sort((a, b) => b.projectedWins - a.projectedWins)
        : [];

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Projected Standings
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_STANDINGS' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Standings
                </button>
            </header>
            <main className="flex-grow">
                <Widget title="End of Season Projections" icon={<TrendingUpIcon />}>
                    {isLoading ? <LoadingSpinner text="Simulating the rest of the season..." /> :
                     error ? <ErrorDisplay message={error} /> :
                     standings && (
                        <div className="p-2">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-black/10">
                                    <tr>
                                        <th className="p-3">Rank</th>
                                        <th className="p-3">Team</th>
                                        <th className="p-3 text-center">Projected Record</th>
                                        <th className="p-3">Oracle's Outlook</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedStandings.map((standing, i) => {
                                        const team = league.teams.find(t => t.id === standing.teamId);
                                        if (!team) return null;
                                        
                                        return (
                                            <tr key={team.id} className="border-t border-white/5">
                                                <td className="p-3 font-bold text-cyan-400">{i + 1}</td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar avatar={team.avatar} className="w-8 h-8 text-xl rounded-md" />
                                                        <div>
                                                            <p className="font-semibold text-white">{team.name}</p>
                                                            <p className="text-xs text-gray-400">{team.owner.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 font-mono text-center">
                                                    {standing.projectedWins}-{standing.projectedLosses}-{standing.projectedTies}
                                                </td>
                                                <td className="p-3 text-xs italic text-gray-300">
                                                    "{standing.narrative}"
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                     )
                    }
                </Widget>
            </main>
        </div>
    );
};

export default ProjectedStandingsView;