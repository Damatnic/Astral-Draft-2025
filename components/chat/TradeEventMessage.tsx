


import React from 'react';
import type { ChatMessage, League, Player, DraftPickAsset } from '../../types';
import { players } from '../../data/players';
import { ArrowRightLeftIcon } from '../icons/ArrowRightLeftIcon';
import ReactionPicker from './ReactionPicker';
import { SparklesIcon } from '../icons/SparklesIcon';

interface TradeEventMessageProps {
    message: ChatMessage;
    league: League;
    onReact: (messageId: string, emoji: string) => void;
}

const TradeEventMessage: React.FC<TradeEventMessageProps> = ({ message, league, onReact }) => {
    const { tradeEvent, aiHotTake, reactions } = message;

    if (!tradeEvent) return null;

    const fromTeam = league.teams.find((t: any) => t.id === tradeEvent.fromTeamId);
    const toTeam = league.teams.find((t: any) => t.id === tradeEvent.toTeamId);
    
    if (!fromTeam || !toTeam) return null;

    const playerMap = new Map(players.map((p: any) => [p.id, p]));
    const offeredPlayers = tradeEvent.playersOffered.map((id: any) => playerMap.get(id)).filter(Boolean) as Player[];
    const requestedPlayers = tradeEvent.playersRequested.map((id: any) => playerMap.get(id)).filter(Boolean) as Player[];
    const offeredPicks = tradeEvent.draftPicksOffered || [];
    const requestedPicks = tradeEvent.draftPicksRequested || [];

    const AssetChip: React.FC<{ children: React.ReactNode, isPick?: boolean }> = ({ children, isPick }) => (
        <div className={`px-1.5 py-0.5 rounded text-xs ${isPick ? 'bg-cyan-900/80' : 'bg-black/20'}`}>{children}</div>
    );

    return (
        <div className="p-3 my-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-2 border-purple-400/20 rounded-lg group relative">
            <ReactionPicker onSelect={(emoji) => onReact(message.id, emoji)} />
            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm mb-2">
                <ArrowRightLeftIcon />
                <span>TRADE ACCEPTED</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                    <p className="font-semibold">{fromTeam.name} gives:</p>
                    <div className="flex flex-wrap gap-1 mt-1 justify-center">
                        {offeredPlayers.map(p => <AssetChip key={p.id}>{p.name}</AssetChip>)}
                        {offeredPicks.map((p, i) => <AssetChip key={i} isPick>{p.season} R{p.round}</AssetChip>)}
                    </div>
                </div>
                <div>
                    <p className="font-semibold">{toTeam.name} gives:</p>
                    <div className="flex flex-wrap gap-1 mt-1 justify-center">
                        {requestedPlayers.map(p => <AssetChip key={p.id}>{p.name}</AssetChip>)}
                        {requestedPicks.map((p, i) => <AssetChip key={i} isPick>{p.season} R{p.round}</AssetChip>)}
                    </div>
                </div>
            </div>

            {aiHotTake && (
                <div className="mt-2 pt-2 border-t border-white/10 text-center">
                    <p className="text-xs text-cyan-300/80 font-semibold flex items-center justify-center gap-1">
                        <SparklesIcon className="w-3 h-3" />
                        Oracle's Take
                    </p>
                    <p className="text-xs italic text-gray-300">"{aiHotTake}"</p>
                </div>
            )}
            
            {reactions && Object.keys(reactions).length > 0 && (
                <div className="flex gap-1 mt-2 justify-center">
                    {Object.entries(reactions).map(([emoji, userIds]) => (
                        <div key={emoji} className="px-1.5 py-0.5 bg-black/30 rounded-full text-xs flex items-center gap-1">
                            <span>{emoji}</span>
                            <span className="text-gray-300">{userIds.length}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TradeEventMessage;