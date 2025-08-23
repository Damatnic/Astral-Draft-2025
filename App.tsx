/**
 * Main App Component - Full Fantasy Football Application with Oracle Integration
 */

import React from 'react';
import { AppProvider, useAppState } from './contexts/AppContext';
import { AuthProvider, AuthInitializer } from './contexts/AuthContext';
// Import modern theme styles
import './styles/theme.css';
// Eager load only the most critical views that users will likely visit first
import ModernDashboardView from './views/ModernDashboardView';
import ModernAuthView from './views/ModernAuthView';
import EnhancedDashboardView from './views/EnhancedDashboardView';
import AuthView from './views/AuthView';

// Lazy load all other views for better initial bundle size
const DashboardView = React.lazy(() => import('./views/DashboardView'));
const LeagueHubView = React.lazy(() => import('./views/LeagueHubView'));
const TeamHubView = React.lazy(() => import('./views/TeamHubView'));
const HistoricalAnalyticsOverview = React.lazy(() => import('./views/HistoricalAnalyticsOverview'));
const LeagueStandingsView = React.lazy(() => import('./views/LeagueStandingsView'));
const WaiverWireView = React.lazy(() => import('./views/WaiverWireView'));
const MatchupView = React.lazy(() => import('./views/MatchupView'));
const PowerRankingsView = React.lazy(() => import('./views/PowerRankingsView'));
const PlayoffBracketView = React.lazy(() => import('./views/PlayoffBracketView'));
const WeeklyReportView = React.lazy(() => import('./views/WeeklyReportView'));
const DraftStoryView = React.lazy(() => import('./views/DraftStoryView'));
import { AnimatePresence, motion } from 'framer-motion';
import NotificationManager from './components/ui/NotificationManager';
const SeasonReviewView = React.lazy(() => import('./views/SeasonReviewView'));
const StartSitToolView = React.lazy(() => import('./views/StartSitToolView'));
const AssistantView = React.lazy(() => import('./views/AssistantView'));
import { ErrorBoundary } from './components/core/ErrorBoundary';
import { InstallPrompt, PWAStatusBanner } from './components/ui/InstallPrompt';
import SuspenseLoader from './components/core/SuspenseLoader';
const ProfileView = React.lazy(() => import('./views/ProfileView'));
const LeagueCreationWizard = React.lazy(() => import('./components/league/LeagueCreationWizard'));
const LeagueRulesView = React.lazy(() => import('./views/LeagueRulesView'));
const ManagerView = React.lazy(() => import('./views/ManagerView'));
import VoiceCommandButton from './components/core/VoiceCommandButton';
const EditRosterView = React.lazy(() => import('./views/EditRosterView'));
const DraftPrepCenterView = React.lazy(() => import('./views/DraftPrepCenterView'));
const SeasonStoryView = React.lazy(() => import('./views/SeasonStoryView'));
const PlayerDetailModal = React.lazy(() => import('./components/player/PlayerDetailModal'));
import { View } from './types';
const TeamComparisonView = React.lazy(() => import('./views/TeamComparisonView'));
const MobileNavMenu = React.lazy(() => import('./components/core/MobileNavMenu'));
const MainLayout = React.lazy(() => import('./components/layout/MainLayout'));
const EditLeagueSettingsView = React.lazy(() => import('./views/EditLeagueSettingsView'));
const SeasonArchiveView = React.lazy(() => import('./views/SeasonArchiveView'));
const LeagueStatsView = React.lazy(() => import('./views/LeagueStatsView'));
import { initializeGlobalFormEnhancement } from './utils/mobileFormEnhancement';
const ScheduleManagementView = React.lazy(() => import('./views/ScheduleManagementView'));
const MessagesView = React.lazy(() => import('./views/MessagesView'));
const ChampionshipOddsView = React.lazy(() => import('./views/ChampionshipOddsView'));
const ProjectedStandingsView = React.lazy(() => import('./views/ProjectedStandingsView'));
const TrophyRoomView = React.lazy(() => import('./views/TrophyRoomView'));
const FinanceTrackerView = React.lazy(() => import('./views/FinanceTrackerView'));
const CustomScoringEditorView = React.lazy(() => import('./views/CustomScoringEditorView'));
import { performanceMonitoringService } from './services/performanceMonitoringService';
const WeeklyRecapVideoView = React.lazy(() => import('./views/WeeklyRecapVideoView'));
const LeagueConstitutionView = React.lazy(() => import('./views/LeagueConstitutionView'));
const GamedayHostView = React.lazy(() => import('./views/GamedayHostView'));
const LeagueNewspaperView = React.lazy(() => import('./views/LeagueNewspaperView'));
const KeeperSelectionView = React.lazy(() => import('./views/KeeperSelectionView'));
const OpenLeaguesView = React.lazy(() => import('./views/OpenLeaguesView'));
const LeaderboardView = React.lazy(() => import('./views/LeaderboardView'));
const LiveDraftRoomView = React.lazy(() => import('./views/LiveDraftRoomView'));
const SeasonContestView = React.lazy(() => import('./views/SeasonContestView'));
const MobileLayoutWrapper = React.lazy(() => import('./components/mobile/MobileLayoutWrapper'));
const MobileOfflineIndicator = React.lazy(() => import('./components/mobile/MobileOfflineIndicator'));
import { useMediaQuery } from './hooks/useMediaQuery';
import './styles/mobile-touch-targets.css';
import './styles/mobile-form-optimization.css';
import './styles/mobile-focus-management.css';
import './styles/mobile-responsive.css';
import './styles/mobile-advanced.css';
import './styles/mobile-layout.css';
import './styles/mobile-accessibility.css';
import CrisisInterventionWidget from './components/crisis/CrisisInterventionWidget';

// Dynamic imports for lazy loading
const LazyLeagueHistoryView = React.lazy(() => import('./views/LeagueHistoryView'));
const LazyAnalyticsHubView = React.lazy(() => import('./views/AnalyticsHubView'));
const LazyRealTimeAnalyticsView = React.lazy(() => import('./views/RealTimeAnalyticsView'));
const LazyDraftRoomView = React.lazy(() => import('./views/DraftRoomView'));
const LazyCommissionerToolsView = React.lazy(() => import('./views/CommissionerToolsView'));
const LazyPerformanceTrendsView = React.lazy(() => import('./views/PerformanceTrendsView'));
const LazyBeatTheOracleView = React.lazy(() => import('./views/BeatTheOracleView'));

const viewVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '5%' : '-5%',
    opacity: 0,
    scale: 0.98,
  }),
  animate: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '5%' : '-5%',
    opacity: 0,
    scale: 0.98,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 30,
    },
  }),
};

const SplashScreen: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        >
            <img src="/favicon.svg" alt="Astral Draft Logo" className="h-24 w-24 mx-auto mb-4" />
        </motion.div>
         <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white text-center"
        >
            Astral Draft
        </motion.h1>
        <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-slate-300 text-center mt-2"
        >
            Fantasy Football Evolved
        </motion.p>
    </div>
);

const useViewNavigation = (currentView: View, activeLeague: any, userId: string) => {
    const [direction, setDirection] = React.useState(0);
    const viewRef = React.useRef<View>('DASHBOARD');

    React.useEffect(() => {
        const history: View[] = ['DASHBOARD', 'LEAGUE_HUB', 'TEAM_HUB'];
        const oldIndex = history.indexOf(viewRef.current);
        const newIndex = history.indexOf(currentView);

        if (oldIndex !== -1 && newIndex !== -1) {
            setDirection(newIndex > oldIndex ? 1 : -1);
        } else {
            setDirection(1);
        }
        
        viewRef.current = currentView;
        document.documentElement.dataset.view = currentView;
    }, [currentView]);

    // Initialize performance monitoring
    React.useEffect(() => {
        // Initialize performance monitoring on app load
        performanceMonitoringService.init();
        
        // Log performance metrics after initial load
        const logInitialMetrics = () => {
            setTimeout(() => {
                const report = performanceMonitoringService.generateReport();
                console.log('Initial Performance Metrics:', report);
            }, 2000);
        };

        if (document.readyState === 'complete') {
            logInitialMetrics();
        } else {
            window.addEventListener('load', logInitialMetrics);
        }

        // Cleanup on unmount
        return () => {
            performanceMonitoringService.destroy();
        };
    }, []);

    React.useEffect(() => {
        const myTeam = activeLeague?.teams.find((t: any) => t.owner.id === userId);
        let isRivalryWeek = false;

        if (activeLeague && myTeam && activeLeague.topRivalry) {
            const currentMatchup = activeLeague.schedule.find(
                (m: any) => m.week === activeLeague.currentWeek && (m.teamA.teamId === myTeam.id || m.teamB.teamId === myTeam.id)
            );

            if (currentMatchup) {
                const opponentId = currentMatchup.teamA.teamId === myTeam.id ? currentMatchup.teamB.teamId : currentMatchup.teamA.teamId;
                if (opponentId === activeLeague.topRivalry.teamAId || opponentId === activeLeague.topRivalry.teamBId) {
                    isRivalryWeek = true;
                }
            }
        }

        if (isRivalryWeek) {
            document.documentElement.dataset.theme = 'rivalry';
        } else {
            delete document.documentElement.dataset.theme;
        }

        return () => {
            delete document.documentElement.dataset.theme;
        };
    }, [activeLeague, userId]);

    return direction;
};

const AppContent: React.FC = () => {
    const { state, dispatch } = useAppState();
    const activeLeague = state.leagues.find(l => l.id === state.activeLeagueId);
    const isMobile = useMediaQuery('(max-width: 768px)');

    React.useEffect(() => {
        initializeGlobalFormEnhancement();
        
        // Start offline service for mobile
        if (isMobile) {
            // Service is already started on instantiation
            console.log('Mobile offline service active');
        }
    }, [isMobile]);

    const direction = useViewNavigation(state.currentView, activeLeague, state.user.id);

    if (state.user.id === 'guest') {
        return <ModernAuthView />;
    }

    const handleViewChange = (view: View) => {
        dispatch({ type: 'SET_VIEW', payload: view });
    };

    const renderMainViews = () => {
        if (state.currentView === 'DASHBOARD') return <ModernDashboardView />;
        if (state.currentView === 'LEAGUE_HUB') return <LeagueHubView />;
        if (state.currentView === 'CREATE_LEAGUE') return <React.Suspense fallback={<SuspenseLoader message="Loading League Creation..." />}><LeagueCreationWizard /></React.Suspense>;
        if (state.currentView === 'DRAFT_ROOM') return <React.Suspense fallback={<SuspenseLoader message="Loading Draft Room..." />}><LazyDraftRoomView /></React.Suspense>;
        if (state.currentView === 'TEAM_HUB') return <TeamHubView />;
        if (state.currentView === 'ANALYTICS_HUB') return <React.Suspense fallback={<SuspenseLoader message="Loading Analytics Hub..." />}><LazyAnalyticsHubView /></React.Suspense>;
        if (state.currentView === 'REALTIME_ANALYTICS') return <React.Suspense fallback={<SuspenseLoader message="Loading Real-Time Analytics..." />}><LazyRealTimeAnalyticsView /></React.Suspense>;
        if (state.currentView === 'HISTORICAL_ANALYTICS') return <HistoricalAnalyticsOverview />;
        if (state.currentView === 'LEAGUE_STANDINGS') return <LeagueStandingsView />;
        if (state.currentView === 'WAIVER_WIRE') return <WaiverWireView />;
        if (state.currentView === 'MATCHUP') return <MatchupView />;
        if (state.currentView === 'POWER_RANKINGS') return <PowerRankingsView />;
        return null;
    };

    const renderSecondaryViews = () => {
        if (state.currentView === 'PLAYOFF_BRACKET') return <PlayoffBracketView />;
        if (state.currentView === 'WEEKLY_REPORT') return <WeeklyReportView />;
        if (state.currentView === 'LEAGUE_HISTORY') return <React.Suspense fallback={<SuspenseLoader message="Loading League History..." />}><LazyLeagueHistoryView /></React.Suspense>;
        if (state.currentView === 'SEASON_REVIEW') return <SeasonReviewView />;
        if (state.currentView === 'SEASON_ARCHIVE') return <SeasonArchiveView />;
        if (state.currentView === 'START_SIT_TOOL') return <StartSitToolView />;
        if (state.currentView === 'ASSISTANT') return <AssistantView />;
        if (state.currentView === 'PROFILE') return <ProfileView />;
        if (state.currentView === 'MANAGER_PROFILE') return <ManagerView />;
        if (state.currentView === 'LEAGUE_RULES') return <LeagueRulesView />;
        return null;
    };

    const renderAdminViews = () => {
        if (state.currentView === 'COMMISSIONER_TOOLS') return <React.Suspense fallback={<SuspenseLoader message="Loading Commissioner Tools..." />}><LazyCommissionerToolsView /></React.Suspense>;
        if (state.currentView === 'DRAFT_STORY') return <DraftStoryView />;
        if (state.currentView === 'EDIT_ROSTER') return <EditRosterView />;
        if (state.currentView === 'DRAFT_PREP_CENTER') return <DraftPrepCenterView />;
        if (state.currentView === 'PERFORMANCE_TRENDS') return <React.Suspense fallback={<SuspenseLoader message="Loading Performance Trends..." />}><LazyPerformanceTrendsView /></React.Suspense>;
        if (state.currentView === 'SEASON_STORY') return <SeasonStoryView />;
        if (state.currentView === 'TEAM_COMPARISON') return <TeamComparisonView />;
        if (state.currentView === 'EDIT_LEAGUE_SETTINGS') return <EditLeagueSettingsView />;
        if (state.currentView === 'LEAGUE_STATS') return <LeagueStatsView />;
        if (state.currentView === 'SCHEDULE_MANAGEMENT') return <ScheduleManagementView />;
        return null;
    };

    const renderUtilityViews = () => {
        if (state.currentView === 'MESSAGES') return <MessagesView />;
        if (state.currentView === 'CHAMPIONSHIP_ODDS') return <ChampionshipOddsView />;
        if (state.currentView === 'PROJECTED_STANDINGS') return <ProjectedStandingsView />;
        if (state.currentView === 'TROPHY_ROOM') return <TrophyRoomView />;
        if (state.currentView === 'BEAT_THE_ORACLE') return <React.Suspense fallback={<SuspenseLoader message="Loading Beat The Oracle..." />}><LazyBeatTheOracleView /></React.Suspense>;
        if (state.currentView === 'FINANCE_TRACKER') return <FinanceTrackerView />;
        if (state.currentView === 'CUSTOM_SCORING_EDITOR') return <CustomScoringEditorView />;
        if (state.currentView === 'WEEKLY_RECAP_VIDEO') return <WeeklyRecapVideoView />;
        if (state.currentView === 'LEAGUE_CONSTITUTION') return <LeagueConstitutionView />;
        if (state.currentView === 'GAMEDAY_HOST') return <GamedayHostView />;
        if (state.currentView === 'LEAGUE_NEWSPAPER') return <LeagueNewspaperView />;
        if (state.currentView === 'KEEPER_SELECTION') return <KeeperSelectionView />;
        if (state.currentView === 'OPEN_LEAGUES') return <OpenLeaguesView />;
        if (state.currentView === 'LEADERBOARD') return <LeaderboardView />;
        if (state.currentView === 'LIVE_DRAFT_ROOM') return <LiveDraftRoomView />;
        if (state.currentView === 'SEASON_CONTESTS') return <SeasonContestView />;
        return <DashboardView />;
    };

    const renderView = () => {
        return renderMainViews() || renderSecondaryViews() || renderAdminViews() || renderUtilityViews();
    };
    
    return (
        <div className="relative w-full h-full flex flex-col font-sans bg-transparent">
            {isMobile ? (
                <MobileLayoutWrapper
                    currentView={state.currentView}
                    onViewChange={handleViewChange}
                    showBottomNav={state.currentView !== 'DRAFT_ROOM' && state.currentView !== 'LIVE_DRAFT_ROOM'}
                >
                    <MobileOfflineIndicator />
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={state.currentView}
                            className="w-full h-full"
                            {...{
                              custom: direction,
                              variants: viewVariants,
                              initial: "initial",
                              animate: "animate",
                              exit: "exit",
                            }}
                        >
                            {renderView()}
                        </motion.div>
                    </AnimatePresence>
                </MobileLayoutWrapper>
            ) : (
                <>
                    <MainLayout>
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={state.currentView}
                                className="w-full h-full"
                                {...{
                                  custom: direction,
                                  variants: viewVariants,
                                  initial: "initial",
                                  animate: "animate",
                                  exit: "exit",
                                }}
                            >
                                {renderView()}
                            </motion.div>
                        </AnimatePresence>
                    </MainLayout>
                    <AnimatePresence>
                        {state.isMobileNavOpen && (
                            <React.Suspense fallback={<SuspenseLoader message="Loading Navigation..." size="sm" />}>
                                <MobileNavMenu />
                            </React.Suspense>
                        )}
                    </AnimatePresence>
                </>
            )}
            <NotificationManager />
            <VoiceCommandButton />
            <InstallPrompt />
            <PWAStatusBanner />
            <CrisisInterventionWidget />
             <AnimatePresence>
                {state.activePlayerDetail && (
                    <PlayerDetailModal
                        player={state.activePlayerDetail}
                        onClose={() => dispatch({ type: 'SET_PLAYER_DETAIL', payload: { player: null } })}
                        playerNotes={state.playerNotes}
                        dispatch={dispatch}
                        league={activeLeague}
                        initialTab={state.activePlayerDetailInitialTab}
                        playerAvatars={state.playerAvatars}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}


const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthInitializer fallback={<div className="loading-screen">Initializing authentication...</div>}>
        <AppProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </AppProvider>
      </AuthInitializer>
    </AuthProvider>
  );
};

export default App;
