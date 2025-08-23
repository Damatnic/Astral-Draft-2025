
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import type { League } from '../types';
import { Widget } from '../components/ui/Widget';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { CrownIcon } from '../components/icons/CrownIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { Avatar } from '../components/ui/Avatar';
import FinalStandingsTable from '../components/history/FinalStandingsTable';

const SeasonArchiveContent: React.FC<{ league: League; seasonYear: number; dispatch: React.Dispatch<any> }> = ({ league, seasonYear, dispatch }) => {
    const historyEntry = league.history?.find(h => h.season === seasonYear);

    if (!historyEntry) {
        return <ErrorDisplay title="History Not Found" message={`Could not find historical data for the ${seasonYear} season.`} />;
    }

    const champion = league.teams.find(t => t.id === historyEntry.championTeamId);
    const record = historyEntry.records.highestScore;
    const recordTeam = league.teams.find(t => t.id === record.teamId);

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        {seasonYear} Season Archive
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HISTORY' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to History
                </button>
            </header>
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Widget title="League Champion" icon={<CrownIcon />}>
                        <div className="p-4 text-center">
                            {champion ? (
                                <>
                                    <Avatar avatar={champion.avatar} className="w-24 h-24 text-6xl mx-auto rounded-lg" />
                                    <p className="font-display font-bold text-2xl text-yellow-300 mt-2">{champion.name}</p>
                                </>
                            ) : (
                                <p>Champion not found</p>
                            )}
                        </div>
                    </Widget>
                    <Widget title="Season Records" icon={<TrophyIcon />}>
                        <div className="p-4 space-y-3">
                            <div className="bg-white/5 p-3 rounded-lg">
                                <p className="text-sm font-semibold text-cyan-300">Highest Weekly Score</p>
                                <p className="text-xl font-bold text-white mt-1">{record.score.toFixed(2)} pts</p>
                                <p className="text-xs text-gray-400">
                                    {recordTeam?.name} in Week {record.week}
                                </p>
                            </div>
                        </div>
                    </Widget>
                </div>
                <div className="lg:col-span-2">
                    <Widget title="Final Standings">
                        <FinalStandingsTable standings={historyEntry.finalStandings} teams={league.teams} />
                    </Widget>
                </div>
            </main>
        </div>
    );
};


const SeasonArchiveView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    const seasonYear = state.activeArchiveSeason;
    
    if (!league || !seasonYear) {
        return <ErrorDisplay title="Error" message="No season selected to display." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD'})} />;
    }

    return <SeasonArchiveContent league={league} seasonYear={seasonYear} dispatch={dispatch} />;
};

export default SeasonArchiveView;
