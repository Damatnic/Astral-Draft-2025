
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { Widget } from '../components/ui/Widget';
import VisualRoster from '../components/team/VisualRoster';
import type { League, Team, TradeSuggestion } from '../types';
import TradeCenterWidget from '../components/team/TradeCenterWidget';
import LeagueTeamsList from '../components/team/LeagueTeamsList';
import { DailyBriefingWidget } from '../components/team/DailyBriefingWidget';
import CurrentMatchupWidget from '../components/team/CurrentMatchupWidget';
import TeamChemistryWidget from '../components/team/TeamChemistryWidget';
import SeasonOutlookWidget from '../components/team/SeasonOutlookWidget';
import { AnimatePresence } from 'framer-motion';
import EditHeaderModal from '../components/team/EditHeaderModal';
import { ImageIcon } from '../components/icons/ImageIcon';
import TrophyCaseWidget from '../components/team/TrophyCaseWidget';
import { useLeague } from '../hooks/useLeague';
import InjuryReportWidget from '../components/team/InjuryReportWidget';
import AiCoManagerWidget from '../components/team/AiCoManagerWidget';
import ChampionshipOddsWidget from '../components/team/ChampionshipOddsWidget';
import EditTeamBrandingModal from '../components/modals/EditTeamBrandingModal';
import { MusicIcon } from '../components/icons/MusicIcon';
import FuturePicksWidget from '../components/team/FuturePicksWidget';
import { TvIcon } from '../components/icons/TvIcon';
import { Share2Icon } from '../components/icons/Share2Icon';
import ShareTeamCardModal from '../components/modals/ShareTeamCardModal';
import { MascotWidget } from '../components/team/MascotWidget';
import TradeWhispererWidget from '../components/team/TradeWhispererWidget';
import { AwardIcon } from '../components/icons/AwardIcon';
import AssignAwardsModal from '../components/modals/AssignAwardsModal';
import { UsersIcon } from '../components/icons/UsersIcon';
import ProposeTradeModal from '../components/team/ProposeTradeModal';
import { useResponsiveBreakpoint } from '../utils/mobileOptimizationUtils';

const TeamHubContent: React.FC<{ league: League; team: Team; dispatch: React.Dispatch<any> }> = ({ league, team, dispatch }) => {
    const { isMobile } = useResponsiveBreakpoint();
    const isWaiversActive = league.status === 'DRAFT_COMPLETE' || league.status === 'IN_SEASON' || league.status === 'PLAYOFFS';
    const isSeasonStarted = league.status === 'IN_SEASON' || league.status === 'PLAYOFFS' || league.status === 'COMPLETE';
    const isDraftComplete = league.status !== 'PRE_DRAFT' && league.status !== 'DRAFTING';
    const isPlayoffs = league.status === 'PLAYOFFS' || league.status === 'COMPLETE';
    const isInSeason = league.status === 'IN_SEASON' || league.status === 'PLAYOFFS';
    const isSeasonComplete = league.status === 'COMPLETE';
    const isKeeperLeague = (league.settings.keeperCount || 0) > 0;
    const isPreDraft = league.status === 'PRE_DRAFT';
    const isFullAiEnabled = league.settings.aiAssistanceLevel === 'FULL';


    const [isEditHeaderModalOpen, setIsEditHeaderModalOpen] = React.useState(false);
    const [isBrandingModalOpen, setIsBrandingModalOpen] = React.useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
    const [isAwardsModalOpen, setIsAwardsModalOpen] = React.useState(false);
    const [isProposeTradeModalOpen, setIsProposeTradeModalOpen] = React.useState(false);
    const [tradeSuggestion, setTradeSuggestion] = React.useState<TradeSuggestion | null>(null);
    const [tradeOpponent, setTradeOpponent] = React.useState<Team | null>(null);
    const audioRef = React.useRef<HTMLAudioElement>(null);
    
    const headerStyle = team.headerImage ? { backgroundImage: `url(${team.headerImage})` } : {};
    
    const playThemeSong = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        }
    };
    
    const handleProposeFromWhisperer = (suggestion: TradeSuggestion) => {
        const opponent = league.teams.find(t => t.id === suggestion.toTeamId);
        if (opponent) {
            setTradeSuggestion(suggestion);
            setTradeOpponent(opponent);
            setIsProposeTradeModalOpen(true);
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header 
                className={`flex-shrink-0 flex flex-col justify-between mb-6 p-4 rounded-xl relative bg-cover bg-center bg-no-repeat bg-gradient-to-t from-black/50 to-transparent`}
                style={headerStyle}
            >
                <div className="bg-black/40 p-2 rounded-lg mb-4">
                    <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        {team.name}
                    </h1>
                     {team.motto && <p className="text-sm italic text-cyan-200/80 mt-1">"{team.motto}"</p>}
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">TEAM HUB • WEEK {league.currentWeek > 16 ? 'Post-Season' : league.currentWeek}</p>
                </div>
                 <button onClick={() => setIsEditHeaderModalOpen(true)} 
                         className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 bg-black/50 hover:bg-black/70 rounded-md min-h-[44px] min-w-[44px] justify-center">
                    <ImageIcon /> {!isMobile && 'Edit Header'}
                </button>
                <div className={`${isMobile ? 'grid grid-cols-2 sm:grid-cols-3 gap-2' : 'flex gap-2 flex-wrap justify-end'}`}>
                    {isKeeperLeague && isPreDraft && (
                         <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'KEEPER_SELECTION' })} 
                                 className="px-4 py-2 bg-yellow-500/80 text-white rounded-lg text-sm hover:bg-yellow-500 backdrop-blur-sm flex items-center gap-2 min-h-[44px] justify-center">
                            <UsersIcon /> {!isMobile && 'Select Keepers'}
                        </button>
                    )}
                    <button onClick={() => setIsBrandingModalOpen(true)} 
                            className="px-4 py-2 bg-black/50 rounded-lg text-sm hover:bg-black/70 backdrop-blur-sm min-h-[44px]">
                        {isMobile ? 'Brand' : 'Edit Branding'}
                    </button>
                    <button onClick={() => setIsShareModalOpen(true)} 
                            className="px-4 py-2 bg-black/50 rounded-lg text-sm hover:bg-black/70 backdrop-blur-sm flex items-center gap-2 min-h-[44px] justify-center">
                        <Share2Icon /> {!isMobile && 'Share Team Card'}
                    </button>
                     {team.themeSongUrl && 
                        <button onClick={playThemeSong} 
                                className="px-4 py-2 bg-black/50 rounded-lg text-sm hover:bg-black/70 backdrop-blur-sm flex items-center gap-2 min-h-[44px] justify-center">
                            <MusicIcon /> {!isMobile && 'Play Anthem'}
                        </button>
                     }
                     {isInSeason && (
                        <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'GAMEDAY_HOST' })} 
                                className="px-4 py-2 bg-red-500/80 text-white rounded-lg text-sm hover:bg-red-500 backdrop-blur-sm flex items-center gap-2 min-h-[44px] justify-center">
                           <TvIcon /> {!isMobile && 'Gameday Host'}
                        </button>
                     )}
                     {isSeasonComplete && (
                         <button onClick={() => setIsAwardsModalOpen(true)} 
                                 className="px-4 py-2 bg-yellow-500/80 text-white rounded-lg text-sm hover:bg-yellow-500 backdrop-blur-sm flex items-center gap-2 min-h-[44px] justify-center">
                            <AwardIcon /> {!isMobile && 'Assign Season Awards'}
                        </button>
                     )}
                     {league.status === 'COMPLETE' && (
                         <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'SEASON_STORY' })} 
                                 className="px-4 py-2 bg-purple-500/80 text-white rounded-lg text-sm hover:bg-purple-500 backdrop-blur-sm min-h-[44px]">
                            {isMobile ? 'Story' : 'View My Season Story'}
                        </button>
                     )}
                     {isWaiversActive && (
                         <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'WAIVER_WIRE' })} 
                                 className="px-4 py-2 bg-black/50 rounded-lg text-sm hover:bg-black/70 backdrop-blur-sm min-h-[44px]">
                            {isMobile ? 'Waivers' : 'Waiver Wire'}
                        </button>
                    )}
                    {isSeasonStarted && (
                        <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'WEEKLY_REPORT' })} 
                                className="px-4 py-2 bg-black/50 rounded-lg text-sm hover:bg-black/70 backdrop-blur-sm min-h-[44px]">
                            {isMobile ? 'Report' : 'Weekly Report'}
                        </button>
                    )}
                     {isSeasonStarted && (
                        <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'PERFORMANCE_TRENDS' })} 
                                className="px-4 py-2 bg-black/50 rounded-lg text-sm hover:bg-black/70 backdrop-blur-sm min-h-[44px]">
                            Performance
                        </button>
                     )}
                    {isSeasonStarted && (
                        <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'POWER_RANKINGS' })} 
                                className="px-4 py-2 bg-black/50 rounded-lg text-sm hover:bg-black/70 backdrop-blur-sm min-h-[44px]">
                            {isMobile ? 'Rankings' : 'Power Rankings'}
                        </button>
                    )}
                    {isPlayoffs && (
                         <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'PLAYOFF_BRACKET' })} 
                                 className="px-4 py-2 bg-black/50 rounded-lg text-sm hover:bg-black/70 backdrop-blur-sm min-h-[44px]">
                            {isMobile ? 'Playoffs' : 'Playoff Bracket'}
                        </button>
                    )}
                    <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'ANALYTICS_HUB' })} 
                            className="px-4 py-2 bg-black/50 rounded-lg text-sm hover:bg-black/70 backdrop-blur-sm min-h-[44px]">
                        Analytics
                    </button>
                    <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_STANDINGS' })} 
                            className="px-4 py-2 bg-black/50 rounded-lg text-sm hover:bg-black/70 backdrop-blur-sm min-h-[44px]">
                        Standings
                    </button>
                    <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} 
                            className="px-4 py-2 bg-black/50 rounded-lg text-sm hover:bg-black/70 backdrop-blur-sm min-h-[44px]">
                        Dashboard
                    </button>
                </div>
            </header>
            <main className={`flex-grow grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-5'} gap-6`}>
                <div className={isMobile ? '' : 'lg:col-span-3'}>
                    <Widget title="My Roster">
                        <VisualRoster team={team} />
                    </Widget>
                </div>
                <div className={`${isMobile ? 'space-y-4' : 'lg:col-span-2 space-y-6'}`}>
                    {isInSeason && <CurrentMatchupWidget myTeam={team} league={league} dispatch={dispatch} />}
                    {isFullAiEnabled && <TradeWhispererWidget onPropose={handleProposeFromWhisperer} />}
                    {isFullAiEnabled && isInSeason && <ChampionshipOddsWidget team={team} league={league} dispatch={dispatch} />}
                    {isFullAiEnabled && isDraftComplete && <SeasonOutlookWidget league={league} myTeam={team} dispatch={dispatch} />}
                    <MascotWidget team={team} league={league} dispatch={dispatch} />
                    {isFullAiEnabled && isInSeason && <DailyBriefingWidget league={league} myTeam={team} dispatch={dispatch} />}
                    {isFullAiEnabled && isInSeason && <AiCoManagerWidget team={team} league={league} dispatch={dispatch} />}
                    {isInSeason && <InjuryReportWidget myTeam={team} />}
                    {isFullAiEnabled && <TeamChemistryWidget league={league} myTeam={team} dispatch={dispatch} />}
                    <FuturePicksWidget team={team} />
                    <TrophyCaseWidget team={team} league={league} />
                    <LeagueTeamsList league={league} myTeamId={team.id} dispatch={dispatch} />
                    <TradeCenterWidget league={league} team={team} dispatch={dispatch} />
                </div>
            </main>
            <AnimatePresence>
                {isEditHeaderModalOpen && (
                    <EditHeaderModal
                        leagueId={league.id}
                        teamId={team.id}
                        currentHeader={team.headerImage}
                        dispatch={dispatch}
                        onClose={() => setIsEditHeaderModalOpen(false)}
                    />
                )}
                 {isBrandingModalOpen && (
                    <EditTeamBrandingModal
                        team={team}
                        leagueId={league.id}
                        dispatch={dispatch}
                        onClose={() => setIsBrandingModalOpen(false)}
                    />
                )}
                 {isShareModalOpen && (
                    <ShareTeamCardModal
                        team={team}
                        onClose={() => setIsShareModalOpen(false)}
                    />
                )}
                {isAwardsModalOpen && (
                    <AssignAwardsModal
                        team={team}
                        league={league}
                        dispatch={dispatch}
                        onClose={() => setIsAwardsModalOpen(false)}
                    />
                )}
                {isProposeTradeModalOpen && tradeOpponent && (
                    <ProposeTradeModal
                        myTeam={team}
                        otherTeam={tradeOpponent}
                        leagueId={league.id}
                        dispatch={dispatch}
                        onClose={() => setIsProposeTradeModalOpen(false)}
                        initialOffer={tradeSuggestion || undefined}
                    />
                )}
            </AnimatePresence>
            {team.themeSongUrl && <audio ref={audioRef} src={team.themeSongUrl} />}
        </div>
    );
};


const TeamHubView: React.FC = () => {
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
                <TeamHubContent league={league} team={myTeam} dispatch={dispatch} />
            )}
        </div>
    );
};

export default TeamHubView;
