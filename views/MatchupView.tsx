


import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { AnimatePresence, motion } from 'framer-motion';
import MatchupScoreboard from '../components/matchup/MatchupScoreboard';
import MatchupRosterView from '../components/matchup/MatchupRosterView';
import type { League, Team, Matchup } from '../types';
import RivalryReportModal from '../components/matchup/RivalryReportModal';
import { NewspaperIcon } from '../components/icons/NewspaperIcon';
import { useLeague } from '../hooks/useLeague';
import MatchupAnalysisWidget from '../components/matchup/MatchupAnalysisWidget';
import LiveEventTicker from '../components/matchup/LiveEventTicker';
import { useLiveData } from '../hooks/useLiveData';

const MatchupViewContent: React.FC<{ league: League, myTeam: Team, dispatch: React.Dispatch<any> }> = ({ league, myTeam, dispatch }) => {
    const [viewedWeek, setViewedWeek] = React.useState(league.currentWeek);
    const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);

    const matchup = league.schedule.find(m => m.week === viewedWeek && (m.teamA.teamId === myTeam.id || m.teamB.teamId === myTeam.id));
    
    const opponentTeam = league.teams.find(t => t.id === (matchup?.teamA.teamId === myTeam.id ? matchup?.teamB.teamId : matchup?.teamA.teamId));

    useLiveData(league, myTeam, opponentTeam);

    if (!matchup) {
        return <div className="p-8 text-center text-gray-400">You have a bye week.</div>
    }
    
    const isMyTeamA = matchup.teamA.teamId === myTeam.id;
    const myMatchupTeam = isMyTeamA ? matchup.teamA : matchup.teamB;
    const opponentMatchupTeam = isMyTeamA ? matchup.teamB : matchup.teamA;

    if (!opponentTeam) {
        return <div className="p-8 text-center text-red-400">Error: Opponent not found.</div>;
    }

    const canGoToPrev = viewedWeek > 1;
    const canGoToNext = viewedWeek < 14;

    const isLive = viewedWeek === league.currentWeek && (league.status === 'IN_SEASON' || league.status === 'PLAYOFFS');

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
             <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Weekly Matchup
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setViewedWeek(v => v-1)} disabled={!canGoToPrev} className="mobile-touch-target px-3 py-3 bg-white/10 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            &lt; Prev
                        </button>
                        <span className="font-bold w-20 text-center">Week {viewedWeek}</span>
                        <button onClick={() => setViewedWeek(v => v+1)} disabled={!canGoToNext} className="mobile-touch-target px-3 py-3 bg-white/10 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            Next &gt;
                        </button>
                    </div>
                    <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} className="mobile-touch-target px-4 py-3 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                        Back to Team
                    </button>
                </div>
            </header>

            <motion.div
                key={viewedWeek}
                {...{
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: -20 },
                    transition: { duration: 0.3 },
                }}
            >
                <MatchupScoreboard
                    myTeam={myTeam}
                    opponentTeam={opponentTeam}
                    myMatchupTeam={myMatchupTeam}
                    opponentMatchupTeam={opponentMatchupTeam}
                    week={viewedWeek}
                    isLive={isLive}
                />
                 <div className="flex justify-center items-stretch gap-4 mt-4">
                    {isLive && <LiveEventTicker matchupId={matchup.id} />}
                    <div className="flex flex-col gap-2">
                         <MatchupAnalysisWidget myTeam={myTeam} opponentTeam={opponentTeam} />
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg btn-primary"
                        >
                            <NewspaperIcon />
                            Rivalry Report
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MatchupRosterView
                        team={myTeam}
                        matchupTeam={myMatchupTeam}
                        isLive={isLive}
                        week={viewedWeek}
                        matchupId={matchup.id}
                    />
                    <MatchupRosterView
                        team={opponentTeam}
                        matchupTeam={opponentMatchupTeam}
                        isLive={isLive}
                        week={viewedWeek}
                        matchupId={matchup.id}
                    />
                </div>
            </motion.div>
             <AnimatePresence>
                {isReportModalOpen && (
                    <RivalryReportModal
                        myTeam={myTeam}
                        opponentTeam={opponentTeam}
                        onClose={() => setIsReportModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};


const MatchupView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league, myTeam } = useLeague();

    return (
        <div className="w-full h-full">
            {(!myTeam || !league) ? (
                <div className="w-full h-full flex items-center justify-center">
                    <p>Team or League not found.</p>
                    <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="ml-4 px-4 py-2 bg-cyan-500 rounded">
                        Back to Dashboard
                    </button>
                </div>
            ) : (
                <MatchupViewContent league={league} myTeam={myTeam} dispatch={dispatch} />
            )}
        </div>
    );
};

export default MatchupView;
