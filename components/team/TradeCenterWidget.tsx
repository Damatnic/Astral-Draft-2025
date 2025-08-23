



import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { League, Team, Player } from '../../types';
import { players } from '../../data/players';
import { Widget } from '../ui/Widget';
import ManageTradeBlockModal from './ManageTradeBlockModal';
import { CloseIcon } from '../icons/CloseIcon';
import { ScalesIcon } from '../icons/ScalesIcon';
import Tabs from '../ui/Tabs';
import TradeOfferCard from './TradeOfferCard';
import useSound from '../../hooks/useSound';
import EmptyState from '../ui/EmptyState';
import { InboxIcon } from '../icons/InboxIcon';
import { PaperPlaneIcon } from '../icons/PaperPlaneIcon';
import { EmptyTumbleweedIcon } from '../icons/EmptyTumbleweedIcon';

const TradeCenterWidget: React.FC<{ league: League; team: Team; dispatch: React.Dispatch<any> }> = ({ league, team, dispatch }) => {
    const [isBlockModalOpen, setIsBlockModalOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('incoming');
    
    const incomingOffers = league.tradeOffers.filter((o: any) => o.toTeamId === team.id && o?.status === 'PENDING');
    const outgoingOffers = league.tradeOffers.filter((o: any) => o.fromTeamId === team.id);
    const completedOffers = league.tradeOffers.filter((o: any) => o?.status !== 'PENDING' && (o.toTeamId === team.id || o.fromTeamId === team.id));

    const playTradeSound = useSound('tradeOffer', 0.5);
    const prevIncomingOffersCount = React.useRef(incomingOffers.length);
    
    React.useEffect(() => {
        if (incomingOffers.length > prevIncomingOffersCount.current) {
            playTradeSound();
        }
        prevIncomingOffersCount.current = incomingOffers.length;
    }, [incomingOffers.length, playTradeSound]);


    const myBlockedPlayers = React.useMemo(() => {
        const playerMap = new Map(players.map((p: any) => [p.id, p]));
        return (team.tradeBlock || []).map((id: any) => playerMap.get(id)).filter(Boolean) as Player[];
    }, [team.tradeBlock]);

    const handleRemoveFromBlock = (playerId: number) => {
        dispatch({ type: 'REMOVE_FROM_TRADE_BLOCK', payload: { leagueId: league.id, teamId: team.id, playerId } });
    };

    const tabItems = [
        { id: 'incoming', label: `Incoming (${incomingOffers.length})` },
        { id: 'outgoing', label: 'Outgoing' },
        { id: 'block', label: 'Trade Block' },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'incoming':
                return incomingOffers.length > 0 ? (
                    <div className="space-y-2">
                        {incomingOffers.map(offer => <TradeOfferCard key={offer.id} offer={offer} league={league} myTeamId={team.id} dispatch={dispatch} />)}
                    </div>
                ) : <EmptyState illustration={<InboxIcon />} message="No pending incoming offers." />;
            case 'outgoing':
                 return outgoingOffers.length > 0 ? (
                    <div className="space-y-2">
                        {outgoingOffers.map(offer => <TradeOfferCard key={offer.id} offer={offer} league={league} myTeamId={team.id} dispatch={dispatch} />)}
                    </div>
                ) : <EmptyState illustration={<PaperPlaneIcon />} message="You haven't sent any offers." />;
            case 'block':
                return (
                    <div>
                        {myBlockedPlayers.length > 0 ? (
                            <div className="space-y-1">
                                {myBlockedPlayers.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between text-xs bg-black/10 p-1.5 rounded-md">
                                        <span>{p.name} <span className="text-gray-400">({p.position})</span></span>
                                        <button onClick={() => handleRemoveFromBlock(p.id)} className="mobile-touch-target text-gray-500 hover:text-red-400 p-3 rounded-full" aria-label="Remove from block"><CloseIcon className="w-3 h-3"/></button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState illustration={<EmptyTumbleweedIcon />} message="You have no players on the block." />
                        )}
                        <button onClick={() => setIsBlockModalOpen(true)} className="w-full mt-2 py-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-300 rounded-md hover:bg-cyan-500/20">
                            Manage My Block
                        </button>
                    </div>
                );
            default:
                return null;
        }
    }


    return (
        <>
            <Widget title="Trade Center" icon={<ScalesIcon />}>
                <div className="px-3 border-b border-[var(--panel-border)]">
                    <Tabs items={tabItems} activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
                <div className="p-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            {...{
                                initial: { opacity: 0, y: 10 },
                                animate: { opacity: 1, y: 0 },
                                exit: { opacity: 0, y: -10 },
                                transition: { duration: 0.2 },
                            }}
                        >
                           {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Widget>
            <AnimatePresence>
                {isBlockModalOpen && <ManageTradeBlockModal team={team} leagueId={league.id} dispatch={dispatch} onClose={() => setIsBlockModalOpen(false)} />}
            </AnimatePresence>
        </>
    );
};
export default TradeCenterWidget;