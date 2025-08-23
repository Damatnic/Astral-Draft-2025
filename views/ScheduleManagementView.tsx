
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import type { Matchup } from '../types';
import { Avatar } from '../components/ui/Avatar';

const MatchupCard: React.FC<{ matchup: Matchup, league: ReturnType<typeof useLeague>['league'] }> = ({ matchup, league }) => {
    const teamA = league?.teams.find(t => t.id === matchup.teamA.teamId);
    const teamB = league?.teams.find(t => t.id === matchup.teamB.teamId);

    if (!teamA || !teamB) return null;

    return (
        <div className="p-3 bg-black/10 rounded-lg flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
                <Avatar avatar={teamA.avatar} className="w-8 h-8 rounded-md" />
                <span className="font-semibold">{teamA.name}</span>
            </div>
            <span className="text-red-400 font-bold">vs</span>
            <div className="flex items-center gap-2">
                <span className="font-semibold">{teamB.name}</span>
                <Avatar avatar={teamB.avatar} className="w-8 h-8 rounded-md" />
            </div>
        </div>
    );
};

const ScheduleManagementView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    const [selectedWeek, setSelectedWeek] = React.useState(1);

    if (!league || state.user.id !== league.commissionerId) {
        return <ErrorDisplay title="Access Denied" message="You are not the commissioner of this league." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} />;
    }
    
    if (league.schedule.length === 0) {
        return <ErrorDisplay title="No Schedule" message="The league schedule has not been generated yet. It will be created after the draft." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'COMMISSIONER_TOOLS' })} />;
    }

    const weeklyMatchups = league.schedule.filter(m => m.week === selectedWeek);
    const maxWeek = Math.max(...league.schedule.map(m => m.week));

    const handleRegenerate = () => {
        if (window.confirm(`Are you sure you want to regenerate all matchups for Week ${selectedWeek}? This cannot be undone.`)) {
            dispatch({ type: 'EDIT_MATCHUPS', payload: { leagueId: league.id, week: selectedWeek } });
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Matchups for Week ${selectedWeek} have been regenerated.`, type: 'SYSTEM' }});
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Schedule Management
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'COMMISSIONER_TOOLS' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Tools
                </button>
            </header>
            <main className="flex-grow max-w-2xl mx-auto w-full">
                <Widget title="League Schedule" icon={<CalendarIcon />}>
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedWeek(w => Math.max(1, w-1))} disabled={selectedWeek === 1} className="px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50">
                                &lt; Prev
                            </button>
                            <span className="font-bold w-20 text-center">Week {selectedWeek}</span>
                            <button onClick={() => setSelectedWeek(w => Math.min(maxWeek, w+1))} disabled={selectedWeek === maxWeek} className="px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50">
                                Next &gt;
                            </button>
                        </div>
                        <button 
                            onClick={handleRegenerate}
                            className="px-4 py-2 text-sm font-bold bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                        >
                            Regenerate Matchups
                        </button>
                    </div>
                    <div className="p-4 space-y-2">
                        {weeklyMatchups.map((matchup, index) => (
                            <MatchupCard key={index} matchup={matchup} league={league} />
                        ))}
                    </div>
                </Widget>
            </main>
        </div>
    );
};

export default ScheduleManagementView;