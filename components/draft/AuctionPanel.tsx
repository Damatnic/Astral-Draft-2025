


import React from 'react';
import type { Player, Team, AuctionState } from '../../types';
import Tooltip from '../ui/Tooltip';
import { Avatar } from '../ui/Avatar';

interface AuctionPanelProps {
    nominatingTeam?: Team;
    nominatedPlayer: Player | null;
    currentBid: number;
    highBidder?: Team | null;
    timeLeft: number;
    myBudget: number;
    onPlaceBid: (bid: number) => void;
    myTeamId?: number;
    bidHistory: AuctionState['bidHistory'];
    teams: Team[];
}

const BidHistory: React.FC<{ history: AuctionState['bidHistory'], teams: Team[] }> = ({ history, teams }) => (
    <div className="text-xs text-gray-400 flex flex-wrap-reverse items-center gap-x-3 gap-y-1">
        <span>History:</span>
        {history.slice().reverse().slice(0, 5).map((item, index) => {
            const team = teams.find((t: any) => t.id === item.teamId);
            return (
                 <span key={index} className="flex items-center gap-1">
                    <Avatar avatar={team?.avatar || '❓'} className="w-4 h-4 text-xs rounded-full" />
                    <span className="font-mono">${item.bid}</span>
                </span>
            );
        })}
    </div>
);

const AuctionPanel: React.FC<AuctionPanelProps> = ({ nominatingTeam, nominatedPlayer, currentBid, highBidder, timeLeft, myBudget, onPlaceBid, myTeamId, bidHistory, teams }) => {
    const [myBidString, setMyBidString] = React.useState((currentBid + 1).toString());
    const isMeHighBidder = !!(myTeamId && highBidder && highBidder.id === myTeamId);

    React.useEffect(() => {
        const currentMyBidNumber = parseInt(myBidString, 10);
        if (isNaN(currentMyBidNumber) || currentMyBidNumber <= currentBid) {
           setMyBidString((currentBid + 1).toString());
        }
    }, [currentBid]);

    const handleBidSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const bidAmount = parseInt(myBidString, 10);
        if (isNaN(bidAmount) || bidAmount > myBudget || bidAmount <= currentBid) {
            return;
        }
        onPlaceBid(bidAmount);
    };
    
    const bidAmountAsNumber = parseInt(myBidString, 10);
    const isMyBidTooHigh = !isNaN(bidAmountAsNumber) && bidAmountAsNumber > myBudget;
    const isBidInvalid = isNaN(bidAmountAsNumber) || bidAmountAsNumber <= currentBid;
    
    const progress = (timeLeft / 10) * 100;

    return (
        <div className="glass-pane p-3 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
                {nominatedPlayer ? (
                    <>
                        <div>
                            <p className="text-xs text-gray-400">ON THE BLOCK (NOM BY: {nominatingTeam?.name || 'N/A'})</p>
                            <p className="font-bold text-lg text-white">{nominatedPlayer.name} <span className="text-sm font-normal">({nominatedPlayer.position})</span></p>
                            <p className="text-xs text-gray-400">High Bid: <span className="font-bold text-yellow-300">${currentBid}</span> ({highBidder?.name || 'N/A'})</p>
                        </div>
                        <form onSubmit={handleBidSubmit} className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Tooltip text={isMyBidTooHigh ? "Bid exceeds your budget!" : `Your Budget: $${myBudget}`}>
                                    <input 
                                        type="number" 
                                        value={myBidString}
                                        onChange={e => setMyBidString(e.target.value)}
                                        min={currentBid + 1}
                                        disabled={isMeHighBidder}
                                        className={`w-20 bg-black/20 text-white font-bold text-center p-2 rounded-md border  ${isMyBidTooHigh ? 'border-red-500' : 'border-cyan-400/50'} disabled:opacity-60`}
                                    />
                                </Tooltip>
                                <button type="submit" className={`px-6 py-2 text-white font-bold rounded-md transition-colors ${isMeHighBidder ? 'bg-yellow-600' : 'bg-green-500 hover:bg-green-400'} disabled:opacity-60 disabled:cursor-not-allowed`} disabled={isMyBidTooHigh || isBidInvalid || isMeHighBidder}>
                                    {isMeHighBidder ? 'LEADING' : 'BID'}
                                </button>
                            </div>
                            <div className="w-24 h-8 bg-gray-800/50 rounded-full relative overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000 linear" style={{ width: `${progress}%` }}></div>
                                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-lg text-white">
                                    {timeLeft}
                                </span>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="w-full flex justify-center items-center">
                        <p className="text-sm text-gray-400">{nominatingTeam?.name || '...'} is nominating...</p>
                    </div>
                )}
            </div>
            {nominatedPlayer && bidHistory.length > 0 && <BidHistory history={bidHistory} teams={teams} />}
        </div>
    );
};

export default AuctionPanel;