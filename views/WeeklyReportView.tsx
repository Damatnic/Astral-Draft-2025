
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { generateWeeklyReport, generateWeeklyPowerPlay } from '../services/geminiService';
import type { League, WeeklyReportData } from '../types';
import WeeklyReportDisplay from '../components/reports/WeeklyReportDisplay';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useLeague } from '../hooks/useLeague';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { FilmIcon } from '../components/icons/FilmIcon';


const WeeklyReportContent: React.FC<{ league: League; dispatch: React.Dispatch<any> }> = ({ league, dispatch }) => {
    const [report, setReport] = React.useState<WeeklyReportData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedWeek, setSelectedWeek] = React.useState(league.currentWeek > 1 ? league.currentWeek - 1 : 1);
    const [retryCount, setRetryCount] = React.useState(0);
    
    const maxWeek = league.currentWeek - 1;

    const fetchReport = React.useCallback(async () => {
        if (!league || selectedWeek < 1) return;
        setIsLoading(true);
        setError(null);
        try {
            const [reportData, powerPlayData] = await Promise.all([
                generateWeeklyReport(league, selectedWeek),
                generateWeeklyPowerPlay(league, selectedWeek)
            ]);

            if(reportData) {
                setReport({ ...reportData, powerPlay: powerPlayData || undefined });
            } else {
                 setError("The Oracle could not produce a weekly report.");
            }

        } catch (err) {
            console.error(err);
            setError("An error occurred while consulting the Oracle for a weekly report.");
        } finally {
            setIsLoading(false);
        }
    }, [league, selectedWeek]);
    
    React.useEffect(() => {
        fetchReport();
    }, [fetchReport, retryCount]);

    const handleRetry = () => setRetryCount(c => c + 1);
    
    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        The Oracle's Report
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                 <div className="flex items-center gap-4">
                    <button
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'WEEKLY_RECAP_VIDEO' })}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm hover:bg-purple-500/30"
                    >
                        <FilmIcon /> Generate AI Recap Video
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedWeek(w => w - 1)} disabled={selectedWeek <= 1} className="px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50">
                            &lt;
                        </button>
                        <span className="font-bold w-24 text-center">Week {selectedWeek}</span>
                        <button onClick={() => setSelectedWeek(w => w + 1)} disabled={selectedWeek >= maxWeek} className="px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50">
                            &gt;
                        </button>
                    </div>
                    <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                        Back to Team
                    </button>
                </div>
            </header>
            <main className="flex-grow glass-pane rounded-2xl">
                 <motion.div
                    key={selectedWeek}
                    {...{
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        transition: { duration: 0.5 },
                    }}
                >
                    {(() => {
                        if (isLoading) {
                            return <div className="p-6"><LoadingSpinner text="Compiling the weekly report..." /></div>;
                        }
                        if (error) {
                            return <ErrorDisplay message={error} onRetry={handleRetry} />;
                        }
                        if (report) {
                            return <WeeklyReportDisplay report={report} />;
                        }
                        return <div className="p-6 text-center text-gray-400">No report available for this week.</div>;
                    })()}
                </motion.div>
            </main>
        </div>
    );
};

export const WeeklyReportView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league } = useLeague();
    
    if (!league) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p>Please select a league to view reports.</p>
                 <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    return <WeeklyReportContent league={league} dispatch={dispatch} />;
};

export default WeeklyReportView;