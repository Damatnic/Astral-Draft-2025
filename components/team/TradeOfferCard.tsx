




import React from 'react';
import type { TradeOffer, League, Player, DraftPickAsset } from '../../types';
import { players } from '../../data/players';
import { ArrowRightLeftIcon } from '../icons/ArrowRightLeftIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import TradeStoryModal from '../modals/TradeStoryModal';
import { AnimatePresence } from 'framer-motion';
import { ScrollTextIcon } from '../icons/ScrollTextIcon';
import { generateEventHotTake } from '../../services/geminiService';

interface TradeOfferCardProps {
    offer: TradeOffer;
    league: League;
    myTeamId: number;
    dispatch: React.Dispatch<any>;
}

const statusStyles = {
    PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-300', label: 'Pending' },
    ACCEPTED: { bg: 'bg-green-500/10', text: 'text-green-300', label: 'Accepted' },
    REJECTED: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Rejected' },
    VETOED: { bg: 'bg-red-900/20', text: 'text-red-400', label: 'Vetoed' },
    FORCED: { bg: 'bg-green-900/20', text: 'text-green-300', label: 'Forced' },
};

const TradeOfferCard: React.FC<TradeOfferCardProps> = ({ offer, league, myTeamId, dispatch }) => {
    const [isStoryModalOpen, setIsStoryModalOpen] = React.useState(false);

    const isIncoming = offer.toTeamId === myTeamId;
    const otherTeamId = isIncoming ? offer.fromTeamId : offer.toTeamId;
    const otherTeam = league.teams.find((t: any) => t.id === otherTeamId);
    const myTeam = league.teams.find((t: any) => t.id === myTeamId)!;

    const playerMap = new Map(players.map((p: any) => [p.id, p]));
    const offeredPlayers = offer.playersOffered.map((id: any) => playerMap.get(id));
    const requestedPlayers = offer.playersRequested.map((id: any) => playerMap.get(id));
    const offeredPicks = offer.draftPicksOffered || [];
    const requestedPicks = offer.draftPicksRequested || [];

    // From my perspective
    const playersGiving = isIncoming ? requestedPlayers : offeredPlayers;
    const playersGetting = isIncoming ? offeredPlayers : requestedPlayers;
    const picksGiving = isIncoming ? requestedPicks : offeredPicks;
    const picksGetting = isIncoming ? offeredPicks : requestedPicks;
    
    const style = statusStyles[offer?.status];

    const getWinnerStyling = () => {
        if (!offer.tradeAnalysis || !offer.tradeAnalysis.winner) return { text: '', color: 'text-gray-400' };
        switch(offer.tradeAnalysis.winner) {
            case 'TEAM_A': return { text: `${myTeam.name} Wins`, color: 'text-green-400' };
            case 'TEAM_B': return { text: `${otherTeam?.name} Wins`, color: 'text-red-400' };
            case 'EVEN': return { text: 'Fair Trade', color: 'text-yellow-400' };
            default: return { text: 'Analysis available', color: 'text-cyan-400' };
        }
    };
    const winnerStyle = getWinnerStyling();

    const handleUpdateStatus = async (status: 'ACCEPTED' | 'REJECTED') => {
        dispatch({
            type: 'UPDATE_TRADE_STATUS',
            payload: { leagueId: league.id, tradeId: offer.id, status }
        });
        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: { message: `Trade offer ${status.toLowerCase()}!`, type: 'TRADE' }
        });

        // If accepted, post a system message to the chat
        if (status === 'ACCEPTED' && otherTeam) {
            const fromTeam = league.teams.find((t: any) => t.id === offer.fromTeamId)!;
            const toTeam = league.teams.find((t: any) => t.id === offer.toTeamId)!;

            const formatPicks = (picks: DraftPickAsset[]) => picks.map((p: any) => `${p.season} R${p.round}`).join(', ');
            const offeredPicksStr = offeredPicks.length > 0 ? ` and picks (${formatPicks(offeredPicks)})` : '';
            const requestedPicksStr = requestedPicks.length > 0 ? ` and picks (${formatPicks(requestedPicks)})` : '';
            const tradeDescription = `${fromTeam.name} trades ${offeredPlayers.map((p: any) => p?.name).join(', ')}${offeredPicksStr} to ${toTeam.name} for ${requestedPlayers.map((p: any) => p?.name).join(', ')}${requestedPicksStr}.`;
            const aiHotTake = await generateEventHotTake(tradeDescription);
            
            dispatch({
                type: 'ADD_CHAT_MESSAGE',
                payload: {
                    leagueId: league.id,
                    message: {
                        user: { id: 'system', name: 'League Event', avatar: '📣' },
                        text: '',
                        isSystemMessage: true,
                        tradeEvent: offer,
                        aiHotTake: aiHotTake || undefined,
                    }
                }
            });
        }
    };

    const AssetList: React.FC<{ players: (Player | undefined)[], picks: DraftPickAsset[] }> = ({ players, picks }) => (
        <div className="text-xs space-y-1">
            {players.length > 0 && players.map(p => p && <p key={p.id}>{p.name} ({p.position})</p>)}
            {picks.length > 0 && picks.map((p, i) => <p key={i} className="text-cyan-300">{p.season} R{p.round} Pick</p>)}
            {players.length === 0 && picks.length === 0 && <p className="text-gray-500 italic">Nothing</p>}
        </div>
    );

    return (
        <>
        <div className={`p-3 rounded-lg ${style.bg} border-l-4 ${style.text.replace('text-', 'border-')}`}>
            <div className="flex justify-between items-start text-xs">
                <p>{isIncoming ? `From: ${otherTeam?.name}` : `To: ${otherTeam?.name}`}</p>
                <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${style.bg} ${style.text}`}>{style.label}</span>
            </div>
            
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start my-2">
                <div>
                    <p className="font-bold text-red-400 text-xs mb-1">GIVING</p>
                    <AssetList players={playersGiving} picks={picksGiving} />
                </div>
                <div className="pt-4">
                    <ArrowRightLeftIcon className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                    <p className="font-bold text-green-400 text-xs mb-1">GETTING</p>
                    <AssetList players={playersGetting} picks={picksGetting} />
                </div>
            </div>
            
            {offer.tradeAnalysis && (
                 <div className="text-xs mt-2 pt-2 border-t border-white/10 flex items-center justify-center gap-2">
                    <SparklesIcon className={`w-3 h-3 ${winnerStyle.color}`} />
                    <span className={`font-bold ${winnerStyle.color}`}>{winnerStyle.text}:</span>
                    <span className="italic text-gray-400">"{offer.tradeAnalysis.summary}"</span>
                </div>
            )}

            {isIncoming && offer?.status === 'PENDING' && (
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => handleUpdateStatus('REJECTED')} className="px-3 py-1 text-xs font-bold bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30">
                        Reject
                    </button>
                    <button onClick={() => handleUpdateStatus('ACCEPTED')} className="px-3 py-1 text-xs font-bold bg-green-500/20 text-green-300 rounded-md hover:bg-green-500/30">
                        Accept
                    </button>
                </div>
            )}
            {offer?.status !== 'PENDING' && myTeamId !== -1 && (
                 <div className="flex justify-end mt-2">
                    <button onClick={() => setIsStoryModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-purple-500/20 text-purple-300 rounded-md hover:bg-purple-500/30">
                        <ScrollTextIcon /> View Story
                    </button>
                </div>
            )}
        </div>
        <AnimatePresence>
            {isStoryModalOpen && (
                <TradeStoryModal
                    offer={offer}
                    league={league}
                    onClose={() => setIsStoryModalOpen(false)}
                />
            )}
        </AnimatePresence>
        </>
    );
};

export default TradeOfferCard;