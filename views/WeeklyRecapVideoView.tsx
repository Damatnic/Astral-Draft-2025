
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { generateWeeklyRecapVideoScript } from '../services/geminiService';
import type { RecapVideoScene } from '../types';
import ErrorDisplay from '../components/core/ErrorDisplay';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import RecapVideoPlayer from '../components/reports/RecapVideoPlayer';

export const WeeklyRecapVideoView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    const [script, setScript] = React.useState<RecapVideoScene[] | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const week = league ? (league.currentWeek > 1 ? league.currentWeek - 1 : 1) : 1;
    const scriptCacheKey = league ? `${league.id}_${week}` : '';

    React.useEffect(() => {
        if (!league || !scriptCacheKey) return;

        const cachedScript = state.weeklyRecapScripts[scriptCacheKey];
        if (cachedScript) {
            setScript(cachedScript);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        generateWeeklyRecapVideoScript(league, week)
            .then(data => {
                if (data) {
                    setScript(data);
                    dispatch({ type: 'SET_WEEKLY_RECAP_SCRIPT', payload: { key: scriptCacheKey, script: data } });
                } else {
                    setError("The Oracle could not produce a video script for this week.");
                }
            })
            .catch(() => setError("An error occurred while consulting the Oracle."))
            .finally(() => setIsLoading(false));

    }, [league, week, scriptCacheKey, state.weeklyRecapScripts, dispatch]);

    if (!league) {
        return <ErrorDisplay title="Error" message="No active league found." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} />;
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl shadow-2xl shadow-black/50 overflow-hidden relative glass-pane">
                {isLoading && <LoadingSpinner text="Generating your weekly highlight reel..." />}
                {error && <ErrorDisplay message={error} />}
                {script && <RecapVideoPlayer script={script} league={league} />}
            </div>
            <button
                onClick={() => dispatch({ type: 'SET_VIEW', payload: 'WEEKLY_REPORT' })}
                className="mt-6 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20"
            >
                Back to Report
            </button>
        </div>
    );
};

export default WeeklyRecapVideoView;