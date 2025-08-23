
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppState } from '../contexts/AppContext';
import { players } from '../data/players';
import type { Player, Team, League, WaiverClaim, AppState } from '../types';
import { Widget } from '../components/ui/Widget';
import { SearchIcon } from '../components/icons/SearchIcon';
import PlaceClaimModal from '../components/team/PlaceClaimModal';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import PlayerDetailModal from '../components/player/PlayerDetailModal';
import { useLeague } from '../hooks/useLeague';
import WaiverIntelligenceWidget from '../components/team/WaiverIntelligenceWidget';

const WaiverWireContent: React.FC<{ league: League; myTeam: Team; dispatch: React.Dispatch<any>; playerNotes: AppState['playerNotes'], playerAvatars: AppState['playerAvatars'] }> = ({ league, myTeam, dispatch, playerNotes, playerAvatars }) => {
    const [search, setSearch] = React.useState('');
    const [positionFilter, setPositionFilter] = React.useState<string>('ALL');
    const [isClaimModalOpen, setIsClaimModalOpen] = React.useState(false);
    const [playerToClaim, setPlayerToClaim] = React.useState<Player | null>(null);
    const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);

    const draftedPlayerIds = new Set(league.teams.flatMap(t => t.roster.map(p => p.id)));
    const freeAgents = players.filter(p => !draftedPlayerIds.has(p.id));

    const filteredPlayers = React.useMemo(() => {
        return freeAgents.filter(p => {
            const searchLower = search.toLowerCase();
            const matchesSearch = p.name.toLowerCase().includes(searchLower) || p.team.toLowerCase().includes(searchLower);
            const matchesPosition = positionFilter === 'ALL' || p.position === positionFilter;
            return matchesSearch && matchesPosition;
        }).slice(0, 100);
    }, [freeAgents, search, positionFilter]);

    const myPendingClaims = league.waiverClaims.filter(c => c.teamId === myTeam.id && c.status === 'PENDING');

    const handleOpenClaimModal = (player: Player) => {
        setPlayerToClaim(player);
        setIsClaimModalOpen(true);
    };

    const handleCancelClaim = (claimId: string) => {
        dispatch({ type: 'CANCEL_WAIVER_CLAIM', payload: { leagueId: league.id, claimId }});
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message:'Waiver claim cancelled.', type: 'SYSTEM' } });
    };

    const positions = ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'];

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Waiver Wire
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-green-500/10 rounded-lg text-sm">
                        <span className="text-green-300 font-bold">FAAB: ${myTeam.faab}</span>
                    </div>
                    <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                        Back to Team
                    </button>
                </div>
            </header>
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Widget title="Available Free Agents">
                        <div className="flex-shrink-0 p-2 space-y-2 border-b border-[var(--panel-border)]">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search player..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-black/10 dark:bg-gray-900/50 border border-[var(--panel-border)] rounded-md px-3 py-1.5 pl-8 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                />
                                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                            </div>
                            <div className="flex gap-1 justify-center flex-wrap">
                                {positions.map(pos => (
                                    <button
                                        key={pos}
                                        onClick={() => setPositionFilter(pos)}
                                        className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all
                                            ${positionFilter === pos ? 'bg-cyan-400 text-black' : 'bg-black/10 dark:bg-gray-700/50 text-[var(--text-secondary)] hover:bg-black/20 dark:hover:bg-gray-600/50'}
                                        `}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-2 space-y-1 overflow-y-auto">
                            {filteredPlayers.map(player => (
                                <div key={player.id} className="flex items-center justify-between p-1 pr-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                                    <button onClick={() => setSelectedPlayer(player)} className="flex-grow text-left p-1 flex items-center gap-2">
                                        <div className="font-bold text-lg text-cyan-400 w-8 text-center">{player.rank}</div>
                                        <div>
                                            <p className="font-bold">{player.name}</p>
                                            <p className="text-xs text-gray-400">{player.position} - {player.team}</p>
                                        </div>
                                    </button>
                                    <button onClick={() => handleOpenClaimModal(player)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-500/10 text-green-300 rounded-md hover:bg-green-500/20">
                                        <PlusCircleIcon />
                                        Claim
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Widget>
                </div>
                <div className="space-y-6">
                    <Widget title="My Pending Claims">
                        <div className="p-3 space-y-2">
                            {myPendingClaims.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-4">You have no pending claims.</p>
                            ) : myPendingClaims.map(claim => {
                                const playerToAdd = players.find(p => p.id === claim.playerId);
                                return (
                                <div key={claim.id} className="p-2 bg-black/10 rounded-md">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-sm">{playerToAdd?.name}</p>
                                        <button onClick={() => handleCancelClaim(claim.id)} className="mobile-touch-target text-gray-500 hover:text-red-400 p-3 rounded-full" aria-label="Cancel claim"><CloseIcon className="w-3 h-3"/></button>
                                    </div>
                                    <p className="text-xs text-gray-400">Bid: <span className="font-bold text-yellow-300">${claim.bid}</span></p>
                                </div>
                            )})}
                        </div>
                    </Widget>
                    <WaiverIntelligenceWidget league={league} />
                </div>
            </main>
            <AnimatePresence>
                {isClaimModalOpen && playerToClaim && (
                    <PlaceClaimModal
                        playerToAdd={playerToClaim}
                        myTeam={myTeam}
                        leagueId={league.id}
                        dispatch={dispatch}
                        onClose={() => setIsClaimModalOpen(false)}
                    />
                )}
                {selectedPlayer && (
                    <PlayerDetailModal
                        player={selectedPlayer}
                        onClose={() => setSelectedPlayer(null)}
                        playerNotes={playerNotes}
                        dispatch={dispatch}
                        league={league}
                        playerAvatars={playerAvatars}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const WaiverWireView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league, myTeam } = useLeague();

    if (!league || !myTeam) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
                <p>Could not load waiver wire. Please select a league first.</p>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="ml-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return <WaiverWireContent league={league} myTeam={myTeam} dispatch={dispatch} playerNotes={state.playerNotes} playerAvatars={state.playerAvatars} />;
};

export default WaiverWireView;
