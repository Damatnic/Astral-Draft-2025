
import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useAppState } from '../contexts/AppContext';

import PlayerPool from '../components/player/PlayerPool';
import DraftBoard from '../components/draft/DraftBoard';
import PlayerDetailModal from '../components/player/PlayerDetailModal';
import PlayerCompareTool from '../components/analytics/PlayerCompareTool';
import { Player, League, User, AppState } from '../types';
import { AnimatePresence } from 'framer-motion';
import ChatPanel from '../components/chat/ChatPanel';
import WarRoomPanel from '../components/strategy/WarRoomPanel';
import ConversationalOracle from '../components/ai/ConversationalOracle';
import TurnTimer from '../components/draft/TurnTimer';
import AuctionPanel from '../components/draft/AuctionPanel';
import LiveDraftLog from '../components/draft/LiveDraftLog';
import { useRealtimeDraft } from '../hooks/useRealtimeDraft';
import { useRealtimeAuction } from '../hooks/useRealtimeAuction';
import DraftCompleteOverlay from '../components/draft/DraftCompleteOverlay';
import MyRosterPanel from '../components/draft/MyRosterPanel';
import { useLeague } from '../hooks/useLeague';
import CompareTray from '../components/analytics/CompareTray';
import { useDraftCommentary } from '../hooks/useDraftCommentary';
import AiCoPilotPanel from '../components/draft/AiCoPilotPanel';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface DraftRoomContainerProps {
    league: League;
    isPaused: boolean;
    user: User;
    dispatch: React.Dispatch<any>;
    playerNotes: AppState['playerNotes'];
    playerQueues: AppState['playerQueues'];
}

const DraftRoomContainer: React.FC<DraftRoomContainerProps> = ({ league, isPaused, user, dispatch, playerNotes, playerQueues }) => {
    const [playersToCompare, setPlayersToCompare] = React.useState<Player[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = React.useState(false);
    const [activeSideTab, setActiveSideTab] = React.useState('co-pilot');
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    const snakeDraftState = useRealtimeDraft(league, isPaused, user, dispatch);
    const auctionDraftState = useRealtimeAuction(league, isPaused, user, dispatch);
    useDraftCommentary(league);
    
    const { myTeam } = useLeague();
    const isAuction = league.settings.draftFormat === 'AUCTION';
    
    const draft = isAuction ? auctionDraftState : snakeDraftState;
    const teamOnClockId = !isAuction && snakeDraftState.currentPick > 0 && league.draftPicks.length >= snakeDraftState.currentPick ? league.draftPicks[snakeDraftState.currentPick - 1]?.teamId : undefined;
    const isMyTurnForSnake = !!(myTeam && myTeam.id === teamOnClockId && !isPaused);

    const myQueue = (league && playerQueues[league.id]) || [];

    const handlePlayerSelect = (player: Player) => {
        dispatch({ type: 'SET_PLAYER_DETAIL', payload: { player, initialTab: 'overview' } });
    };

    const handleOpenNotes = (player: Player) => {
        dispatch({ type: 'SET_PLAYER_DETAIL', payload: { player, initialTab: 'notes' } });
    };

    const handleToggleCompare = (player: Player) => {
        setPlayersToCompare(prev => {
            const isAlreadySelected = prev.some(p => p.id === player.id);
            if (isAlreadySelected) {
                return prev.filter(p => p.id !== player.id);
            }
            if (prev.length >= 4) {
                dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Comparison limit of 4 players reached.', type: 'SYSTEM' } });
                return prev;
            }
            return [...prev, player];
        });
    };

    const addToQueue = (player: Player) => {
        if (!league) return;
        if (myQueue.includes(player.id)) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${player.name} is already in your queue.`, type: 'SYSTEM' } });
            return;
        }
        dispatch({
            type: 'ADD_TO_QUEUE',
            payload: { leagueId: league.id, playerId: player.id }
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${player.name} added to queue.`, type: 'SYSTEM' }});
    };

    const sidePanelTabs = [
        { id: 'co-pilot', label: 'Co-pilot' },
        { id: 'oracle', label: 'Oracle' },
        { id: 'my_roster', label: 'My Roster' },
        { id: 'war_room', label: 'War Room' },
        { id: 'chat', label: 'Chat' },
        { id: 'log', label: 'Draft Log' },
    ];
    
    return (
        <div className="w-full h-full flex flex-col relative">
            <header className="p-3 sm:p-2 text-center flex-shrink-0 border-b border-[var(--panel-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 gap-2 sm:gap-0">
                <button onClick={() => dispatch({type: 'SET_VIEW', payload: 'LEAGUE_HUB'})} className="w-full sm:w-auto px-3 py-2 bg-white/10 rounded text-xs sm:text-sm mobile-touch-target">Back to Hub</button>
                <div className="flex-1 min-w-0">
                    <h1 className="font-display text-lg sm:text-xl md:text-2xl font-bold uppercase text-[var(--text-primary)] truncate">{league.name}</h1>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Live {league.settings.draftFormat} Draft In Progress...</p>
                </div>
                {league.isMock ? (
                    <div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-bold rounded-full text-xs self-center sm:self-auto">MOCK DRAFT</div>
                ) : (
                    <div className="hidden sm:block w-20"> {/* Spacer for desktop */} </div>
                )}
            </header>
            <div className="p-2 sm:p-3 flex-shrink-0">
                {isAuction ? (
                     <AuctionPanel
                        nominatingTeam={auctionDraftState.nominatingTeam || undefined}
                        nominatedPlayer={auctionDraftState.nominatedPlayer || null}
                        currentBid={auctionDraftState.currentBid}
                        highBidder={auctionDraftState.highBidderTeam}
                        timeLeft={auctionDraftState.timeLeft}
                        myBudget={myTeam?.budget || 0}
                        onPlaceBid={auctionDraftState.placeBid}
                        myTeamId={myTeam?.id}
                        bidHistory={auctionDraftState.bidHistory}
                        teams={league.teams}
                    />
                ) : (
                    <TurnTimer 
                        currentPick={snakeDraftState.currentPick} 
                        teams={league.teams}
                        draftPicks={league.draftPicks}
                        isMyTurn={isMyTurnForSnake}
                        isPaused={isPaused}
                    />
                )}
            </div>
            <PanelGroup direction={isMobile ? 'vertical' : 'horizontal'} className="flex-grow px-1 sm:px-2 pb-1 sm:pb-2 gap-1 sm:gap-2">
                <Panel defaultSize={isMobile ? 35 : 25} minSize={isMobile ? 25 : 20}>
                    <PlayerPool 
                        players={draft.availablePlayers} 
                        onPlayerSelect={handlePlayerSelect}
                        onAddToQueue={addToQueue}
                        onDraftPlayer={snakeDraftState.draftPlayer}
                        onNominatePlayer={auctionDraftState.nominatePlayer}
                        onAddNote={handleOpenNotes}
                        isMyTurn={isMyTurnForSnake}
                        playersToCompare={playersToCompare}
                        onToggleCompare={handleToggleCompare}
                        queuedPlayerIds={myQueue}
                        draftFormat={league.settings.draftFormat}
                        isNominationTurn={auctionDraftState.isMyNominationTurn}
                    />
                </Panel>
                <PanelResizeHandle className={`bg-black/20 hover:bg-cyan-400/50 transition-colors rounded-full ${isMobile ? 'h-1 sm:h-2 w-full' : 'w-1 sm:w-2 h-full'} mobile-touch-target`} />
                <Panel defaultSize={isMobile ? 45 : 50} minSize={30}>
                    <DraftBoard 
                        teams={league.teams} 
                        draftPicks={league.draftPicks} 
                        currentPick={snakeDraftState.currentPick}
                        onPlayerSelect={handlePlayerSelect} 
                        draftFormat={league.settings.draftFormat}
                    />
                </Panel>
                 <PanelResizeHandle className={`bg-black/20 hover:bg-cyan-400/50 transition-colors rounded-full ${isMobile ? 'h-1 sm:h-2 w-full' : 'w-1 sm:w-2 h-full'} mobile-touch-target`} />
                <Panel defaultSize={isMobile ? 20 : 25} minSize={isMobile ? 15 : 20}>
                    <div className="h-full flex flex-col glass-pane rounded-lg sm:rounded-2xl">
                        <div className="flex-shrink-0 border-b border-[var(--panel-border)] px-1 sm:px-2">
                             <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                                {sidePanelTabs.map(item => (
                                    <button
                                    key={item.id}
                                    onClick={() => setActiveSideTab(item.id)}
                                    className={`${
                                        activeSideTab === item.id ? 'text-[var(--text-primary)] border-cyan-400' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                                    } relative py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-colors focus:outline-none border-b-2 whitespace-nowrap mobile-touch-target min-w-fit`}
                                    >
                                    {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-grow overflow-hidden">
                           {activeSideTab === 'co-pilot' && <AiCoPilotPanel />}
                           {activeSideTab === 'oracle' && <ConversationalOracle myTeam={myTeam} availablePlayers={draft.availablePlayers} />}
                           {activeSideTab === 'my_roster' && <MyRosterPanel team={myTeam} />}
                           {activeSideTab === 'war_room' && league && <WarRoomPanel queue={myQueue} leagueId={league.id} dispatch={dispatch} />}
                           {activeSideTab === 'chat' && <ChatPanel />}
                           {activeSideTab === 'log' && <LiveDraftLog draftPicks={league.draftPicks} teams={league.teams} />}
                        </div>
                    </div>
                </Panel>
            </PanelGroup>

            <CompareTray 
                players={playersToCompare}
                onClear={() => setPlayersToCompare([])}
                onCompare={() => setIsCompareModalOpen(true)}
            />

            <AnimatePresence>
                {league.status === 'DRAFT_COMPLETE' && (
                    <DraftCompleteOverlay league={league} dispatch={dispatch} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCompareModalOpen && playersToCompare.length > 0 && (
                    <PlayerCompareTool
                        players={playersToCompare}
                        onClose={() => setIsCompareModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const DraftRoomView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();

    return (
        <div className="w-full h-full">
            {!league ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                    <p className="text-lg">Error: No active league found.</p>
                    <button onClick={() => dispatch({type: 'SET_VIEW', payload: 'DASHBOARD'})} className="mt-4 px-4 py-2 bg-cyan-500 rounded text-black font-bold">Back to Dashboard</button>
                </div>
            ) : league.status === 'PRE_DRAFT' ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                    <p className="text-lg">The draft has not started yet.</p>
                    <button onClick={() => dispatch({type: 'SET_VIEW', payload: 'LEAGUE_HUB'})} className="mt-4 px-4 py-2 bg-cyan-500 rounded text-black font-bold">Back to League Hub</button>
                </div>
            ) : (
                <DraftRoomContainer
                  league={league}
                  isPaused={state.isDraftPaused}
                  user={state.user}
                  dispatch={dispatch}
                  playerNotes={state.playerNotes}
                  playerQueues={state.playerQueues}
                />
            )}
        </div>
    );
};

export default DraftRoomView;
