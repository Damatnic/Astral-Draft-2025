

import React from 'react';
import { useAppState } from '../contexts/AppContext';
import type { League, Matchup, Team, MatchupTeam } from '../types';
import { Widget } from '../components/ui/Widget';
import { TournamentIcon } from '../components/icons/TournamentIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { motion } from 'framer-motion';
import { Avatar } from '../components/ui/Avatar';
import { useLeague } from '../hooks/useLeague';
import { useResponsiveBreakpoint } from '../utils/mobileOptimizationUtils';

interface MatchupCardProps {
    matchup: Matchup;
    teams: Team[];
    isWinner?: boolean;
}

const MatchupCardTeam: React.FC<{ matchupTeam?: MatchupTeam, team?: Team }> = ({ matchupTeam, team }) => {
    if (!matchupTeam || !team) {
        return <div className="h-10 flex items-center px-2 text-sm text-gray-500">TBD</div>;
    }
    const score = matchupTeam.score > 0 ? matchupTeam.score.toFixed(2) : '-';
    return (
        <div className="flex justify-between items-center h-10 px-2">
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">({matchupTeam.seed})</span>
                <Avatar avatar={team.avatar} className="w-6 h-6 text-lg rounded-md" />
                <span className="font-semibold text-sm">{team.name}</span>
            </div>
            <span className="font-bold font-mono text-sm">{score}</span>
        </div>
    );
};

const MatchupCard: React.FC<MatchupCardProps> = ({ matchup, teams }) => {
    const teamA = teams.find(t => t.id === matchup.teamA.teamId);
    const teamB = teams.find(t => t.id === matchup.teamB.teamId);
    const winnerId = matchup.teamA.score > matchup.teamB.score ? matchup.teamA.teamId : matchup.teamA.score < matchup.teamB.score ? matchup.teamB.teamId : undefined;
    
    return (
        <motion.div 
            className="bg-black/20 rounded-lg w-full max-w-xs sm:w-64 shadow-lg mx-auto"
            {...{
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
            }}
        >
            <div className={`${winnerId === teamA?.id ? 'bg-green-500/20' : ''}`}>
                <MatchupCardTeam matchupTeam={matchup.teamA} team={teamA} />
            </div>
            <div className="h-px bg-white/10 mx-2"></div>
            <div className={`${winnerId === teamB?.id ? 'bg-green-500/20' : ''}`}>
                <MatchupCardTeam matchupTeam={matchup.teamB} team={teamB} />
            </div>
        </motion.div>
    );
};

const PlayoffBracketContent: React.FC<{ league: League, dispatch: React.Dispatch<any> }> = ({ league, dispatch }) => {
    const { isMobile } = useResponsiveBreakpoint();
    const semifinals = league.playoffBracket?.[15] || [];
    const championship = league.playoffBracket?.[16]?.[0];

    const championMatchup = league.status === 'COMPLETE' ? championship : undefined;
    const championId = championMatchup ? (championMatchup.teamA.score > championMatchup.teamB.score ? championMatchup.teamA.teamId : championMatchup.teamB.teamId) : undefined;
    const champion = championId ? league.teams.find(t => t.id === championId) : undefined;

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
             <header className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        League Playoffs
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} 
                        className="w-full sm:w-auto px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 min-h-[44px]">
                    Back to My Team
                </button>
            </header>
            <main className="flex-grow">
                <Widget title="Playoff Bracket" icon={<TournamentIcon />}>
                    {isMobile ? (
                        // Mobile: Vertical stacked layout
                        <div className="p-4 space-y-8">
                            {/* Semifinals - Mobile Vertical */}
                            <div className="space-y-6">
                                <h3 className="text-center font-bold text-lg text-cyan-300">Semifinals (Week 15)</h3>
                                <div className="space-y-4">
                                    {semifinals.map((matchup, index) => (
                                        <div key={matchup.teamA.teamId} className="flex flex-col items-center">
                                            <MatchupCard matchup={matchup} teams={league.teams} />
                                            <div className="text-xs text-gray-400 mt-2">Game {index + 1}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Championship - Mobile */}
                            {championship && (
                                <div className="space-y-6">
                                    <h3 className="text-center font-bold text-lg text-cyan-300">Championship (Week 16)</h3>
                                    <div className="flex justify-center">
                                        <MatchupCard matchup={championship} teams={league.teams} />
                                    </div>
                                </div>
                            )}

                             {/* Champion - Mobile */}
                             {champion && (
                                 <div className="text-center space-y-4">
                                    <h3 className="font-bold text-lg text-yellow-400 flex items-center justify-center gap-2">
                                        <TrophyIcon /> League Champion
                                    </h3>
                                    <motion.div 
                                        className="p-4 bg-yellow-400/10 rounded-lg max-w-xs mx-auto"
                                        {...{
                                            initial: { opacity: 0, scale: 0.8 },
                                            animate: { opacity: 1, scale: 1 },
                                            transition: { type: 'spring', delay: 0.5, duration: 0.8 },
                                        }}
                                    >
                                        <Avatar avatar={champion.avatar} className="w-20 h-20 text-5xl mx-auto rounded-lg" />
                                        <p className="font-display font-bold text-xl text-yellow-300 mt-2">{champion.name}</p>
                                    </motion.div>
                                 </div>
                             )}
                        </div>
                    ) : (
                        // Desktop/Tablet: Horizontal bracket layout
                        <div className="p-8 flex items-center justify-center min-h-[60vh] gap-8">
                            {/* Semifinals */}
                            <div className="flex flex-col justify-around h-80 gap-10 relative">
                                <h3 className="text-center font-bold text-lg text-cyan-300 absolute -top-8 left-1/2 -translate-x-1/2">Semifinals (Week 15)</h3>
                                {semifinals.map(matchup => <MatchupCard key={matchup.teamA.teamId} matchup={matchup} teams={league.teams} />)}
                            </div>
                            {/* Connecting Lines */}
                            {championship && (
                                <div className="relative h-80 w-16">
                                    <div className="absolute top-[2.5rem] left-0 h-[17.5rem] w-1/2 border-r-2 border-white/20"></div>
                                    <div className="absolute top-[2.5rem] left-1/2 w-1/2 h-0 border-t-2 border-white/20"></div>
                                    <div className="absolute bottom-[2.5rem] left-1/2 w-1/2 h-0 border-t-2 border-white/20"></div>
                                </div>
                            )}
                            {/* Championship */}
                             {championship && (
                                <div className="flex flex-col justify-center relative">
                                    <h3 className="text-center font-bold text-lg text-cyan-300 absolute -top-8 left-1/2 -translate-x-1/2">Championship (Week 16)</h3>
                                    <MatchupCard matchup={championship} teams={league.teams} />
                                </div>
                             )}

                             {/* Champion */}
                             {champion && (
                                 <>
                                    <div className="relative h-40 w-16">
                                        <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-green-400/50"></div>
                                    </div>
                                    <motion.div 
                                        className="text-center"
                                        {...{
                                            initial: { opacity: 0, scale: 0.8 },
                                            animate: { opacity: 1, scale: 1 },
                                            transition: { type: 'spring', delay: 0.5, duration: 0.8 },
                                        }}
                                    >
                                        <h3 className="font-bold text-lg text-yellow-400 flex items-center gap-2">
                                            <TrophyIcon /> League Champion
                                        </h3>
                                        <div className="mt-4 p-4 bg-yellow-400/10 rounded-lg">
                                            <Avatar avatar={champion.avatar} className="w-24 h-24 text-6xl mx-auto rounded-lg" />
                                            <p className="font-display font-bold text-2xl text-yellow-300">{champion.name}</p>
                                        </div>
                                    </motion.div>
                                 </>
                             )}
                        </div>
                    )}
                </Widget>
            </main>
        </div>
    );
};

const PlayoffBracketView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league } = useLeague();
    
    if (!league || !league.playoffBracket) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p>The playoffs have not started yet for this league.</p>
                 <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    return <PlayoffBracketContent league={league} dispatch={dispatch} />;
};

export default PlayoffBracketView;