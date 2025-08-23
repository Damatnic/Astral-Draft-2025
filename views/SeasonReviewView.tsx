
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { generateSeasonReview } from '../services/geminiService';
import type { League, SeasonReviewData } from '../types';
import SeasonReviewDisplay from '../components/reports/SeasonReviewDisplay';
import { useLeague } from '../hooks/useLeague';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/core/ErrorDisplay';

const SeasonReviewLoader: React.FC = () => (
    <div className="p-4 sm:p-6 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded w-3/4 mx-auto mb-6"></div>
        <div className="space-y-3 mb-6">
            <div className="h-4 bg-slate-700/50 rounded w-full"></div>
            <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
            <div className="h-4 bg-slate-700/50 rounded w-full"></div>
            <div className="h-4 bg-slate-700/50 rounded w-4/6"></div>
        </div>
        <div className="h-4 bg-slate-700/50 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-24 bg-slate-700/50 rounded-lg"></div>
            <div className="h-24 bg-slate-700/50 rounded-lg"></div>
            <div className="h-24 bg-slate-700/50 rounded-lg"></div>
        </div>
    </div>
);

const SeasonReviewContent: React.FC<{ league: League; seasonYear: number; dispatch: React.Dispatch<any> }> = ({ league, seasonYear, dispatch }) => {
    const [review, setReview] = React.useState<SeasonReviewData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [retryCount, setRetryCount] = React.useState(0);

    const fetchReview = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await generateSeasonReview(league, seasonYear);
            if (data) {
                setReview(data);
            } else {
                 setError("The Oracle could not produce a season review. Please try again later.");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred while consulting the Oracle for a season review.");
        } finally {
            setIsLoading(false);
        }
    }, [league, seasonYear]);
    
    React.useEffect(() => {
        fetchReview();
    }, [fetchReview, retryCount]);

    const handleRetry = () => setRetryCount(c => c + 1);

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
             <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Season Review
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name} - {seasonYear} Season</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HISTORY' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to History
                </button>
            </header>
            <main className="flex-grow glass-pane rounded-2xl overflow-hidden">
                <div className="h-full overflow-y-auto">
                     {isLoading ? <SeasonReviewLoader /> :
                     error ? <ErrorDisplay message={error} onRetry={handleRetry} /> :
                     review ? <SeasonReviewDisplay review={review} teams={league.teams} /> :
                     <div className="p-6 text-center text-gray-400">No review available for this season.</div>
                    }
                </div>
            </main>
        </div>
    );
};


const SeasonReviewView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    const seasonYear = state.activeSeasonReviewYear;

    if (!league || !seasonYear) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p>Please select a season to review from the League History.</p>
                 <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return <SeasonReviewContent league={league} seasonYear={seasonYear} dispatch={dispatch} />
};

export default SeasonReviewView;