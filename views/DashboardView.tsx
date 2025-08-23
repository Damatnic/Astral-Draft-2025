import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { Widget } from '../components/ui/Widget';
import { LeagueCard } from '../components/ui/LeagueCard';
import CreateLeagueModal from '../components/core/CreateLeagueModal';
import EnhancedCreateLeagueModal from '../components/core/EnhancedCreateLeagueModal';
import { AnimatePresence } from 'framer-motion';
import NewsTicker from '../components/ui/NewsTicker';
import { NewspaperIcon } from '../components/icons/NewspaperIcon';
import { RobotIcon } from '../components/icons/RobotIcon';
import MockDraftModal from '../components/core/MockDraftModal';
import { BrainCircuitIcon } from '../components/icons/BrainCircuitIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ZapIcon } from '../components/icons/ZapIcon';
import useSound from '../hooks/useSound';
import WatchlistWidget from '../components/team/WatchlistWidget';
import PowerBalanceChart from '../components/dashboard/PowerBalanceChart';
import CustomizeDashboardModal from '../components/dashboard/CustomizeDashboardModal';
import WhatsNextWidget from '../components/dashboard/WhatsNextWidget';
import PerformanceMetricsWidget from '../components/dashboard/PerformanceMetricsWidget';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import ActivityFeedWidget from '../components/dashboard/ActivityFeedWidget';
import { LayoutIcon } from '../components/icons/LayoutIcon';
import OnTheHotSeatWidget from '../components/dashboard/OnTheHotSeatWidget';
import { GlobeIcon } from '../components/icons/GlobeIcon';

interface DashboardViewProps {
  // No props currently needed, but interface ready for future expansion
}

const DashboardView: React.FC<DashboardViewProps> = () => {
    const { state, dispatch } = useAppState();
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isEnhancedCreateModalOpen, setIsEnhancedCreateModalOpen] = React.useState(false);
    const [isMockModalOpen, setIsMockModalOpen] = React.useState(false);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = React.useState(false);
    
    const playHoverSound = useSound('hover', 0.1);

    const handleJoinLeague = (leagueId: string) => {
        dispatch({ type: 'SET_ACTIVE_LEAGUE', payload: leagueId });
        dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' });
    };
        
    const widgetComponents: { [key: string]: React.ReactNode } = {
        whatsNext: (
            <WhatsNextWidget />
        ),
        leagues: (
            <Widget title="My Leagues" className="sm:col-span-1 lg:col-span-2">
                <div className="space-y-3 sm:space-y-4 p-2">
                    {state.leagues.filter(l => !l.isMock && l.members.some(m => m.id === state.user.id)).length > 0 ? state.leagues.filter(l => !l.isMock && l.members.some(m => m.id === state.user.id)).map(league => (
                        <LeagueCard key={league.id} league={league} onJoin={() => handleJoinLeague(league.id)} />
                    )) : (
                        <div className="p-3 sm:p-4 text-center text-[var(--text-secondary)]">
                            <p className="mb-4 text-sm sm:text-base">You haven't joined any leagues yet.</p>
                            <div className="flex flex-col gap-3 justify-center">
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    <button 
                                        onMouseEnter={() => playHoverSound()}
                                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'CREATE_LEAGUE' })}
                                        className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold rounded-lg btn-primary text-sm mobile-touch-target"
                                    >
                                        Create League (Wizard)
                                    </button>
                                    <button 
                                        onMouseEnter={() => playHoverSound()}
                                        onClick={() => setIsEnhancedCreateModalOpen(true)}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-lg text-sm mobile-touch-target"
                                    >
                                        <SparklesIcon />
                                        Enhanced League (ML + Your Players)
                                    </button>
                                </div>
                                <button 
                                    onMouseEnter={() => playHoverSound()}
                                    onClick={() => dispatch({ type: 'SET_VIEW', payload: 'OPEN_LEAGUES' })}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 mobile-touch-target"
                                >
                                    <GlobeIcon />
                                    Join Open League
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Widget>
        ),
        onTheHotSeat: <OnTheHotSeatWidget />,
        performance: <PerformanceMetricsWidget />,
        activity: <ActivityFeedWidget />,
        mockDrafts: (
            <Widget title="Mock Drafts" icon={<RobotIcon />}>
                <div className="p-3 sm:p-4 flex flex-col items-center justify-center h-full gap-3 sm:gap-4">
                    <p className="text-xs sm:text-sm text-center text-gray-400">Hone your strategy against AI opponents. Your mock drafts will appear here.</p>
                     <button 
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => setIsMockModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-lg btn-primary text-sm mobile-touch-target"
                    >
                        <RobotIcon />
                        Start Mock Draft
                    </button>
                </div>
            </Widget>
        ),
        watchlist: <WatchlistWidget />,
        power: <PowerBalanceChart leagues={state.leagues} />,
        news: (
            <Widget title="News Ticker" icon={<NewspaperIcon />} className="sm:col-span-1 lg:col-span-2">
               <NewsTicker />
            </Widget>
        ),
        assistant: (
             <Widget title="AI Assistant" icon={<BrainCircuitIcon />} className="sm:row-span-1 lg:row-span-2">
                <div className="p-3 sm:p-4 text-center flex flex-col items-center justify-center h-full gap-3">
                    <p className="text-xs sm:text-sm text-gray-400">Have a question? Need advice on a trade, or want to analyze your team? Ask Astral, your personal fantasy expert.</p>
                     <button 
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'ASSISTANT' })}
                        className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg btn-primary text-sm mobile-touch-target"
                    >
                        <SparklesIcon />
                        Ask Astral
                    </button>
                </div>
            </Widget>
        ),
        historicalAnalytics: (
            <Widget title="Historical Analytics" icon={<ZapIcon />}>
                <div className="p-4 text-center flex flex-col items-center justify-center h-full gap-3">
                    <p className="text-sm text-gray-400">Track your Oracle prediction accuracy over time and discover insights from your performance history.</p>
                    <button 
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'HISTORICAL_ANALYTICS' })}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-lg btn-primary"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        View Analytics
                    </button>
                </div>
            </Widget>
        ),
    };

    return (
        <div className="w-full h-full flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
             <header className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Dashboard
                    </h1>
                </div>
                <button 
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => setIsCustomizeModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 mobile-touch-target w-full sm:w-auto"
                >
                    <LayoutIcon />
                    <span>Customize</span>
                </button>
            </header>
            <main className="flex-grow grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {state.dashboardLayout.map(widgetId => {
                    const widget = widgetComponents[widgetId];
                    if (!widget) return null;
                    return <React.Fragment key={widgetId}>{widget}</React.Fragment>;
                })}
            </main>

            <AnimatePresence>
                {isCreateModalOpen && <CreateLeagueModal onClose={() => setIsCreateModalOpen(false)} user={state.user} dispatch={dispatch} />}
                {isEnhancedCreateModalOpen && (
                    <EnhancedCreateLeagueModal 
                        onClose={() => setIsEnhancedCreateModalOpen(false)}
                        user={state.user}
                        dispatch={dispatch}
                    />
                )}
                {isMockModalOpen && <MockDraftModal onClose={() => setIsMockModalOpen(false)} user={state.user} dispatch={dispatch} />}
                {isCustomizeModalOpen && <CustomizeDashboardModal onClose={() => setIsCustomizeModalOpen(false)} />}
            </AnimatePresence>
        </div>
    );
};

const DashboardViewWithErrorBoundary: React.FC<DashboardViewProps> = (props) => (
    <ErrorBoundary>
        <DashboardView {...props} />
    </ErrorBoundary>
);

export default DashboardViewWithErrorBoundary;