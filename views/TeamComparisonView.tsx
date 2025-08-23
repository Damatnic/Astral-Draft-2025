
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { Widget } from '../components/ui/Widget';
import type { Team, TeamComparison } from '../types';
import { generateTeamComparison } from '../services/geminiService';
import TeamComparisonCard from '../components/comparison/TeamComparisonCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import ReactMarkdown from 'react-markdown';

const TeamComparisonView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    const [comparison, setComparison] = React.useState<TeamComparison | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    const teamIds = state.teamsToCompare;
    const teamA = league?.teams.find(t => t.id === teamIds?.[0]);
    const teamB = league?.teams.find(t => t.id === teamIds?.[1]);

    React.useEffect(() => {
        if (teamA && teamB && league) {
            setIsLoading(true);
            generateTeamComparison(teamA, teamB, league)
                .then(setComparison)
                .finally(() => setIsLoading(false));
        }
    }, [teamA, teamB, league]);

    if (!league || !teamA || !teamB) {
        return <ErrorDisplay title="Error" message="Could not find teams to compare." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_STANDINGS' })} />;
    }

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                 <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Team Comparison
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_STANDINGS' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Standings
                </button>
            </header>
            <main className="flex-grow grid grid-cols-1 xl:grid-cols-[1fr_2fr_1fr] gap-6">
                <TeamComparisonCard team={teamA} strengths={comparison?.strengthsA} weaknesses={comparison?.weaknessesA} />
                
                <Widget title="Oracle's Analysis" icon={<SparklesIcon />}>
                    <div className="p-4 h-full overflow-y-auto">
                        {isLoading ? <LoadingSpinner text="Analyzing both teams..." /> :
                         comparison ? (
                            <div className="prose prose-sm prose-invert">
                                <h3>Prediction</h3>
                                <p>{comparison.prediction}</p>
                                <h3>Analysis</h3>
                                <ReactMarkdown>{comparison.analysis}</ReactMarkdown>
                            </div>
                         ) : (
                            <ErrorDisplay title="Analysis Failed" message="The Oracle could not provide an analysis for this matchup." />
                         )}
                    </div>
                </Widget>
                
                <TeamComparisonCard team={teamB} strengths={comparison?.strengthsB} weaknesses={comparison?.weaknessesB} />
            </main>
        </div>
    );
};

export default TeamComparisonView;
