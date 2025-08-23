

import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { AwardIcon } from '../components/icons/AwardIcon';
import { Avatar } from '../components/ui/Avatar';
import { motion } from 'framer-motion';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import type { LeagueHistoryEntry, LeagueAward, Team } from '../types';
import { ArrowRightLeftIcon } from '../components/icons/ArrowRightLeftIcon';
import { ZapIcon } from '../components/icons/ZapIcon';
import { FlameIcon } from '../components/icons/FlameIcon';

const awardConfig: Record<LeagueAward['type'], { icon: React.ReactNode, color: string, label: string }> = {
    HIGHEST_SCORE: { icon: <FlameIcon />, color: 'text-orange-400', label: 'Highest Weekly Score' },
    BEST_RECORD: { icon: <AwardIcon />, color: 'text-green-400', label: 'Best Regular Season Record' },
    BEST_TRADE: { icon: <ArrowRightLeftIcon />, color: 'text-purple-400', label: 'Trade of the Year' },
    CLOSEST_MATCHUP: { icon: <ZapIcon />, color: 'text-blue-400', label: 'Closest Matchup' },
};


const AwardCard: React.FC<{ award: LeagueAward, team: Team | undefined }> = ({ award, team }) => {
    const config = awardConfig[award.type];
    if (!config) return null;

    return (
        <div className="bg-white/5 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
                <span className={config.color}>{config.icon}</span>
                <h4 className="font-bold text-sm text-white">{config.label}</h4>
            </div>
            <p className="text-xs text-gray-300">
                <span className="font-semibold text-yellow-300">{team?.name || 'Unknown'}</span> - {award.details}
            </p>
        </div>
    );
};

const SeasonTrophies: React.FC<{ history: LeagueHistoryEntry, teams: Team[], index: number }> = ({ history, teams, index }) => {
    const champion = teams.find(t => t.id === history.championTeamId);
    
    return (
        <motion.div
            {...{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: index * 0.15 },
            }}
        >
            <Widget title={`${history.season} Season`}>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 bg-gradient-to-br from-yellow-800/30 to-yellow-900/40 rounded-lg p-4 text-center flex flex-col items-center justify-center">
                        <TrophyIcon className="w-16 h-16 text-yellow-300" />
                        <h3 className="font-display font-bold text-xl text-yellow-300 mt-2">LEAGUE CHAMPION</h3>
                        {champion && (
                            <>
                                <Avatar avatar={champion.avatar} className="w-20 h-20 text-5xl rounded-full my-3 ring-4 ring-yellow-400/50" />
                                <p className="font-bold text-lg">{champion.name}</p>
                            </>
                        )}
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(history.leagueAwards || []).map(award => (
                            <AwardCard key={award.id} award={award} team={teams.find(t => t.id === award.teamId)} />
                        ))}
                    </div>
                </div>
            </Widget>
        </motion.div>
    );
};

const TrophyRoomView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league } = useLeague();
    
    if (!league) {
        return <ErrorDisplay title="Error" message="Please select a league to view the trophy room." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} />;
    }

    const pastSeasons = (league.history || []).sort((a, b) => b.season - a.season);

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Trophy Room
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to League Hub
                </button>
            </header>
            <main className="flex-grow space-y-6">
                {pastSeasons.length > 0 ? (
                    pastSeasons.map((season, index) => (
                        <SeasonTrophies key={season.season} history={season} teams={league.teams} index={index} />
                    ))
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-lg text-gray-500">The trophy case is empty. A champion will be crowned soon!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TrophyRoomView;
