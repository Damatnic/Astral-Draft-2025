
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { generatePowerRankings } from '../services/geminiService';
import type { League, PowerRanking } from '../types';
import PowerRankingCard from '../components/rankings/PowerRankingCard';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { Widget } from '../components/ui/Widget';
import PowerRankingCardSkeleton from '../components/rankings/PowerRankingCardSkeleton';
import { useLeague } from '../hooks/useLeague';
import ErrorDisplay from '../components/core/ErrorDisplay';

const PowerRankingsContent: React.FC<{ league: League; dispatch: React.Dispatch<any> }> = ({ league, dispatch }) => {
    const { state } = useAppState();
    const [rankings, setRankings] = React.useState<PowerRanking[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [retryCount, setRetryCount] = React.useState(0);

    const myTeamId = league.teams.find(t => t.owner.id === state.user.id)?.id;
    
    const fetchRankings = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await generatePowerRankings(league);
            if (data) {
                // Gemini might not return sorted, so we sort here
                data.sort((a, b) => a.rank - b.rank);
                setRankings(data);
            } else {
                setError("The Oracle could not produce power rankings. Please try again later.");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred while consulting the Oracle for power rankings.");
        } finally {
            setIsLoading(false);
        }
    }, [league]);

    React.useEffect(() => {
        fetchRankings();
    }, [league.id, league.currentWeek, retryCount, fetchRankings]);

    const handleRetry = () => {
        setRetryCount(c => c + 1);
    };

    return (
         <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Power Rankings
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name} - Week {league.currentWeek}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to My Team
                </button>
            </header>
            <main className="flex-grow">
                 <Widget title="The Oracle's Official Rankings" icon={<ChartBarIcon />}>
                    {isLoading ? (
                        <div className="p-2 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Array.from({ length: league.teams.length || 8 }).map((_, i) => <PowerRankingCardSkeleton key={i} />)}
                        </div>
                    ) :
                     error ? <ErrorDisplay message={error} onRetry={handleRetry} /> :
                     <div className="p-2 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                         {rankings.map(ranking => (
                             <PowerRankingCard 
                                key={ranking.teamId} 
                                ranking={ranking} 
                                team={league.teams.find(t => t.id === ranking.teamId)}
                                isMyTeam={ranking.teamId === myTeamId}
                            />
                         ))}
                     </div>
                    }
                </Widget>
            </main>
        </div>
    );
};


const PowerRankingsView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league } = useLeague();
    
    if (!league) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p>Please select a league to view power rankings.</p>
                 <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    return <PowerRankingsContent league={league} dispatch={dispatch} />;
};

export default PowerRankingsView;