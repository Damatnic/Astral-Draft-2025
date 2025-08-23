
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { Widget } from '../components/ui/Widget';
import DraftGradeCard from '../components/analytics/DraftGradeCard';
import type { League, Team } from '../types';
import DraftRecap from '../components/analytics/DraftRecap';
import PositionalScarcityChart from '../components/analytics/PositionalScarcityChart';
import { players } from '../data/players';
import Tabs from '../components/ui/Tabs';
import { AnimatePresence, motion } from 'framer-motion';
import MyTeamCompositionChart from '../components/analytics/MyTeamCompositionChart';
import TeamNeedsAnalysis from '../components/analytics/TeamNeedsAnalysis';
import { useLeague } from '../hooks/useLeague';
import PickTimeAnalytics from '../components/analytics/PickTimeAnalytics';
import ChampionshipOddsPreview from '../components/analytics/ChampionshipOddsPreview';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import type { AnalyticsViewProps } from '../types/viewTypes';

interface AnalyticsHubViewProps extends AnalyticsViewProps {
  // Additional props specific to analytics hub
}

const LeagueWideAnalytics: React.FC<{ league: League; dispatch: React.Dispatch<any> }> = ({ league, dispatch }) => {
    const draftedPlayerIds = new Set(league.draftPicks.map(p => p.playerId));
    const availablePlayers = players.filter(p => !draftedPlayerIds.has(p.id));
    const isFullAiEnabled = league.settings.aiAssistanceLevel === 'FULL';
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="md:col-span-2 lg:col-span-2 space-y-4 sm:space-y-6">
                <Widget title="Oracle's Post-Draft Analysis">
                    <DraftRecap league={league} dispatch={dispatch} />
                </Widget>
                <Widget title="Team-by-Team Grades">
                    <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {league.teams.map(team => (
                            <DraftGradeCard key={team.id} team={team} league={league} />
                        ))}
                    </div>
                </Widget>
            </div>
            <div className="md:col-span-2 lg:col-span-1 space-y-4 sm:space-y-6">
                 <Widget title="Positional Scarcity">
                    <PositionalScarcityChart availablePlayers={availablePlayers} />
                 </Widget>
                 {isFullAiEnabled && <ChampionshipOddsPreview league={league} dispatch={dispatch} />}
            </div>
        </div>
    );
};

const MyTeamAnalytics: React.FC<{ league: League; myTeam: Team, dispatch: React.Dispatch<any> }> = ({ league, myTeam, dispatch }) => {
    const isFullAiEnabled = league.settings.aiAssistanceLevel === 'FULL';
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                <Widget title="My Draft Grade">
                    <div className="p-3 sm:p-4">
                        <DraftGradeCard team={myTeam} league={league} />
                    </div>
                </Widget>
                {isFullAiEnabled && <TeamNeedsAnalysis team={myTeam} league={league} dispatch={dispatch} />}
            </div>
            <div className="lg:col-span-2">
                <Widget title="My Roster Analysis">
                    <MyTeamCompositionChart team={myTeam} />
                </Widget>
            </div>
        </div>
    );
};


const AnalyticsHubContent: React.FC<{ league: League; myTeam: Team; dispatch: React.Dispatch<any> }> = ({ league, myTeam, dispatch }) => {
    const [activeTab, setActiveTab] = React.useState('league');
    const isFullAiEnabled = league.settings.aiAssistanceLevel === 'FULL';
    
    const tabs = [
        {id: 'league', label: 'League-Wide'}, 
        {id: 'my-team', label: 'My Team'},
        {id: 'performance', label: 'Draft Performance'}
    ];
    
    const isSeasonStarted = league.status === 'IN_SEASON' || league.status === 'PLAYOFFS' || league.status === 'COMPLETE';

    if (isSeasonStarted && isFullAiEnabled && !tabs.find(t => t.id === 'needs')) {
        tabs.push({ id: 'needs', label: 'Team Needs' });
    }

    return (
         <div className="w-full h-full flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Analytics Hub
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button 
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'HISTORICAL_ANALYTICS' })} 
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors mobile-touch-target"
                    >
                        <span>Historical Analytics</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </button>
                    <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 mobile-touch-target">
                        Back to My Team
                    </button>
                </div>
            </header>
            <div className="border-b border-[var(--panel-border)] mb-4 sm:mb-6">
                <Tabs items={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <main className="flex-grow">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        {...{
                            initial: { opacity: 0, y: 20 },
                            animate: { opacity: 1, y: 0 },
                            exit: { opacity: 0, y: -20 },
                            transition: { duration: 0.2 },
                        }}
                    >
                        {activeTab === 'league' && <LeagueWideAnalytics league={league} dispatch={dispatch} />}
                        {activeTab === 'my-team' && <MyTeamAnalytics league={league} myTeam={myTeam} dispatch={dispatch} />}
                        {activeTab === 'performance' && <PickTimeAnalytics league={league} />}
                        {activeTab === 'needs' && isFullAiEnabled && <TeamNeedsAnalysis team={myTeam} league={league} dispatch={dispatch} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};


const AnalyticsHubView: React.FC<AnalyticsHubViewProps> = () => {
    const { dispatch } = useAppState();
    const { league, myTeam } = useLeague();
    
    const isDraftFinished = league && (
        league.status === 'DRAFT_COMPLETE' || 
        league.status === 'IN_SEASON' || 
        league.status === 'PLAYOFFS' ||
        league.status === 'COMPLETE'
    );

    // Early returns to avoid nested ternary complexity
    if (!league || !myTeam) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p>Please select a completed league to view analytics.</p>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!isDraftFinished) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p>Draft analytics are available after the draft is complete.</p>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <AnalyticsHubContent league={league} myTeam={myTeam} dispatch={dispatch} />
        </div>
    );
};

const AnalyticsHubViewWithErrorBoundary: React.FC<AnalyticsHubViewProps> = (props) => (
    <ErrorBoundary>
        <AnalyticsHubView {...props} />
    </ErrorBoundary>
);

export default AnalyticsHubViewWithErrorBoundary;
