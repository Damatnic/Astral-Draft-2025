/**
 * Trade Builder Tab
 * Interface for building and configuring trade proposals
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Avatar } from '../ui/Avatar';
import { Player, League, Team } from '../../types';
import { TradeProposal, DraftPick } from './TradeAnalyzerView';
import { ArrowRightLeftIcon } from '../icons/ArrowRightLeftIcon';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { CloseIcon } from '../icons/CloseIcon';

interface TradeBuilderTabProps {
    league: League;
    currentTeam: Team;
    proposal: TradeProposal | null;
    onProposalUpdate: (proposal: TradeProposal) => void;
    dispatch: React.Dispatch<any>;
}

interface PlayerSearchResult extends Player {
    teamName: string;
    isAvailable: boolean;
}

const TradeBuilderTab: React.FC<TradeBuilderTabProps> = ({
    league,
    currentTeam,
    proposal,
    onProposalUpdate,
    dispatch
}) => {
    const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);
    const [fromPlayers, setFromPlayers] = React.useState<Player[]>([]);
    const [toPlayers, setToPlayers] = React.useState<Player[]>([]);
    const [fromPicks, setFromPicks] = React.useState<DraftPick[]>([]);
    const [toPicks, setToPicks] = React.useState<DraftPick[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showPlayerSearch, setShowPlayerSearch] = React.useState<'from' | 'to' | null>(null);
    const [tradeMessage, setTradeMessage] = React.useState('');

    // Mock players data for demonstration
    const mockPlayers: PlayerSearchResult[] = React.useMemo(() => [
        {
            id: 1,
            name: 'Josh Allen',
            position: 'QB',
            team: 'BUF',
            rank: 1,
            adp: 12,
            bye: 7,
            tier: 1,
            age: 27,
            auctionValue: 45,
            stats: {
                projection: 285,
                lastYear: 275,
                vorp: 45,
                weeklyProjections: {}
            },
            teamName: selectedTeam?.name || 'Team Alpha',
            isAvailable: true
        },
        {
            id: 2,
            name: 'Derrick Henry',
            position: 'RB',
            team: 'TEN',
            rank: 8,
            adp: 18,
            bye: 6,
            tier: 2,
            age: 29,
            auctionValue: 38,
            stats: {
                projection: 245,
                lastYear: 230,
                vorp: 32,
                weeklyProjections: {}
            },
            teamName: selectedTeam?.name || 'Team Alpha',
            isAvailable: true
        },
        {
            id: 3,
            name: 'Cooper Kupp',
            position: 'WR',
            team: 'LAR',
            rank: 5,
            adp: 15,
            bye: 9,
            tier: 1,
            age: 30,
            auctionValue: 42,
            stats: {
                projection: 265,
                lastYear: 250,
                vorp: 38,
                weeklyProjections: {}
            },
            teamName: selectedTeam?.name || 'Team Alpha',
            isAvailable: true
        }
    ], [selectedTeam?.name]);

    const availableTeams = React.useMemo(() => 
        league.teams.filter((team: any) => team.id !== currentTeam.id),
        [league.teams, currentTeam.id]
    );

    const filteredPlayers = React.useMemo(() => {
        if (!searchTerm) return mockPlayers;
        return mockPlayers.filter((player: any) =>
            player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.team.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [mockPlayers, searchTerm]);

    React.useEffect(() => {
        if (selectedTeam && (fromPlayers.length > 0 || toPlayers.length > 0 || fromPicks.length > 0 || toPicks.length > 0)) {
            const newProposal: TradeProposal = {
                id: `trade-${Date.now()}`,
                fromTeam: currentTeam,
                toTeam: selectedTeam,
                fromPlayers,
                toPlayers,
                fromDraftPicks: fromPicks,
                toDraftPicks: toPicks,
                status: 'draft',
                createdAt: new Date(),
                message: tradeMessage
            };
            onProposalUpdate(newProposal);
        }
    }, [selectedTeam, fromPlayers, toPlayers, fromPicks, toPicks, tradeMessage, currentTeam, onProposalUpdate]);

    const addPlayer = (player: Player, side: 'from' | 'to') => {
        if (side === 'from') {
            setFromPlayers(prev => [...prev, player]);
        } else {
            setToPlayers(prev => [...prev, player]);
        }
        setShowPlayerSearch(null);
        setSearchTerm('');
    };

    const removePlayer = (playerId: number, side: 'from' | 'to') => {
        if (side === 'from') {
            setFromPlayers(prev => prev.filter((p: any) => p.id !== playerId));
        } else {
            setToPlayers(prev => prev.filter((p: any) => p.id !== playerId));
        }
    };

    const addDraftPick = (side: 'from' | 'to') => {
        const newPick: DraftPick = {
            season: 2024,
            round: 1,
            originalTeamId: side === 'from' ? currentTeam.id.toString() : selectedTeam?.id.toString() || '',
            estimatedValue: 15,
            description: '2024 1st Round Pick'
        };

        if (side === 'from') {
            setFromPicks(prev => [...prev, newPick]);
        } else {
            setToPicks(prev => [...prev, newPick]);
        }
    };

    const removeDraftPick = (index: number, side: 'from' | 'to') => {
        if (side === 'from') {
            setFromPicks(prev => prev.filter((_, i) => i !== index));
        } else {
            setToPicks(prev => prev.filter((_, i) => i !== index));
        }
    };

    const clearTrade = () => {
        setFromPlayers([]);
        setToPlayers([]);
        setFromPicks([]);
        setToPicks([]);
        setTradeMessage('');
        setSelectedTeam(null);
    };

    const getTotalValue = (players: Player[], picks: DraftPick[]) => {
        const playerValue = players.reduce((sum, p) => sum + p.auctionValue, 0);
        const pickValue = picks.reduce((sum, p) => sum + p.estimatedValue, 0);
        return playerValue + pickValue;
    };

    const fromValue = getTotalValue(fromPlayers, fromPicks);
    const toValue = getTotalValue(toPlayers, toPicks);
    const valueDifference = toValue - fromValue;

    return (
        <div className="space-y-6">
            {/* Team Selection */}
            <Widget title="Trade Partner" className="bg-[var(--panel-bg)]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                    {availableTeams.map((team) => (
                        <motion.button
                            key={team.id}
                            onClick={() => setSelectedTeam(team)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-lg border transition-all ${
                                selectedTeam?.id === team.id
                                    ? 'border-blue-400 bg-blue-500/20 text-blue-400'
                                    : 'border-[var(--panel-border)] bg-white/5 text-[var(--text-primary)] hover:border-blue-400/50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar avatar={team.avatar} className="w-10 h-10 rounded-full" />
                                <div className="text-left">
                                    <div className="font-medium">{team.name}</div>
                                    <div className="text-xs opacity-70">{team.record.wins}-{team.record.losses}</div>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </Widget>

            {selectedTeam && (
                <>
                    {/* Trade Configuration */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Your Team (From) */}
                        <Widget title={`${currentTeam.name} (You)`} className="bg-[var(--panel-bg)]">
                            <div className="p-4 space-y-4">
                                <div className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                                    Trade Value: ${fromValue}
                                </div>
                                
                                {/* Players */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-[var(--text-primary)]">Players</h4>
                                        <button
                                            onClick={() => setShowPlayerSearch('from')}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                        >
                                            <PlusCircleIcon className="w-4 h-4" />
                                            Add Player
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {fromPlayers.map((player) => (
                                            <div key={player.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Avatar avatar="🏈" className="w-8 h-8 rounded-full" />
                                                    <div>
                                                        <div className="font-medium text-[var(--text-primary)]">{player.name}</div>
                                                        <div className="text-sm text-[var(--text-secondary)]">
                                                            {player.position} • {player.team} • ${player.auctionValue}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removePlayer(player.id, 'from')}
                                                    className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                                >
                                                    <CloseIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        {fromPlayers.length === 0 && (
                                            <div className="text-center py-8 text-[var(--text-secondary)]">
                                                No players selected
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Draft Picks */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-[var(--text-primary)]">Draft Picks</h4>
                                        <button
                                            onClick={() => addDraftPick('from')}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                                        >
                                            <PlusCircleIcon className="w-4 h-4" />
                                            Add Pick
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {fromPicks.map((pick, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                <div>
                                                    <div className="font-medium text-[var(--text-primary)]">{pick.description}</div>
                                                    <div className="text-sm text-[var(--text-secondary)]">
                                                        Estimated Value: ${pick.estimatedValue}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeDraftPick(index, 'from')}
                                                    className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                                >
                                                    <CloseIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        {fromPicks.length === 0 && (
                                            <div className="text-center py-4 text-[var(--text-secondary)] text-sm">
                                                No draft picks included
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Widget>

                        {/* Trade Partner (To) */}
                        <Widget title={selectedTeam.name} className="bg-[var(--panel-bg)]">
                            <div className="p-4 space-y-4">
                                <div className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                                    Trade Value: ${toValue}
                                </div>
                                
                                {/* Players */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-[var(--text-primary)]">Players</h4>
                                        <button
                                            onClick={() => setShowPlayerSearch('to')}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                        >
                                            <PlusCircleIcon className="w-4 h-4" />
                                            Add Player
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {toPlayers.map((player) => (
                                            <div key={player.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Avatar avatar="🏈" className="w-8 h-8 rounded-full" />
                                                    <div>
                                                        <div className="font-medium text-[var(--text-primary)]">{player.name}</div>
                                                        <div className="text-sm text-[var(--text-secondary)]">
                                                            {player.position} • {player.team} • ${player.auctionValue}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removePlayer(player.id, 'to')}
                                                    className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                                >
                                                    <CloseIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        {toPlayers.length === 0 && (
                                            <div className="text-center py-8 text-[var(--text-secondary)]">
                                                No players selected
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Draft Picks */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-[var(--text-primary)]">Draft Picks</h4>
                                        <button
                                            onClick={() => addDraftPick('to')}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                                        >
                                            <PlusCircleIcon className="w-4 h-4" />
                                            Add Pick
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {toPicks.map((pick, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                <div>
                                                    <div className="font-medium text-[var(--text-primary)]">{pick.description}</div>
                                                    <div className="text-sm text-[var(--text-secondary)]">
                                                        Estimated Value: ${pick.estimatedValue}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeDraftPick(index, 'to')}
                                                    className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                                >
                                                    <CloseIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        {toPicks.length === 0 && (
                                            <div className="text-center py-4 text-[var(--text-secondary)] text-sm">
                                                No draft picks included
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Widget>
                    </div>

                    {/* Trade Summary */}
                    {(fromPlayers.length > 0 || toPlayers.length > 0 || fromPicks.length > 0 || toPicks.length > 0) && (
                        <Widget title="Trade Summary" className="bg-[var(--panel-bg)]">
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-center gap-4 p-4 bg-white/5 rounded-lg">
                                    <div className="text-center">
                                        <div className="font-bold text-2xl text-[var(--text-primary)]">${fromValue}</div>
                                        <div className="text-sm text-[var(--text-secondary)]">{currentTeam.name}</div>
                                    </div>
                                    
                                    <ArrowRightLeftIcon className="w-8 h-8 text-[var(--text-secondary)]" />
                                    
                                    <div className="text-center">
                                        <div className="font-bold text-2xl text-[var(--text-primary)]">${toValue}</div>
                                        <div className="text-sm text-[var(--text-secondary)]">{selectedTeam.name}</div>
                                    </div>
                                </div>
                                
                                <div className={`text-center p-3 rounded-lg ${
                                    Math.abs(valueDifference) <= 5 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : Math.abs(valueDifference) <= 15
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-red-500/20 text-red-400'
                                }`}>
                                    <div className="font-medium">
                                        {valueDifference === 0 
                                            ? 'Perfectly balanced trade' 
                                            : `${valueDifference > 0 ? 'You receive' : 'You give'} $${Math.abs(valueDifference)} more value`
                                        }
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="block">
                                        <span className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
                                            Trade Message (Optional)
                                        </span>
                                        <textarea
                                            value={tradeMessage}
                                            onChange={(e: any) => setTradeMessage(e.target.value)}
                                            placeholder="Add a message to your trade partner..."
                                            className="w-full p-3 bg-white/5 border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none"
                                            rows={3}
                                        />
                                    </label>
                                    
                                    <div className="flex gap-3">
                                        <button
                                            onClick={clearTrade}
                                            className="px-6 py-2 border border-[var(--panel-border)] text-[var(--text-secondary)] rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                            Clear Trade
                                        </button>
                                        <button className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                            Send Trade Proposal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Widget>
                    )}

                    {/* Trade Message */}
                    {(fromPlayers.length === 0 && toPlayers.length === 0 && fromPicks.length === 0 && toPicks.length === 0) && (
                        <div className="text-center py-12 text-[var(--text-secondary)]">
                            <ArrowRightLeftIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium mb-2">Build Your Trade</h3>
                            <p>Add players and draft picks to both sides to create a trade proposal</p>
                        </div>
                    )}
                </>
            )}

            {/* Player Search Modal */}
            <AnimatePresence>
                {showPlayerSearch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                        onClick={() => setShowPlayerSearch(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e: any) => e.stopPropagation()}
                            className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden"
                        >
                            <div className="p-4 border-b border-[var(--panel-border)]">
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">
                                    Add Player to {showPlayerSearch === 'from' ? currentTeam.name : selectedTeam?.name}
                                </h3>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e: any) => setSearchTerm(e.target.value)}
                                        placeholder="Search players..."
                                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            
                            <div className="p-4 max-h-96 overflow-y-auto">
                                <div className="space-y-2">
                                    {filteredPlayers.map((player) => (
                                        <button
                                            key={player.id}
                                            onClick={() => addPlayer(player, showPlayerSearch)}
                                            className="w-full p-3 text-left bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar avatar="🏈" className="w-8 h-8 rounded-full" />
                                                <div className="flex-1">
                                                    <div className="font-medium text-[var(--text-primary)]">{player.name}</div>
                                                    <div className="text-sm text-[var(--text-secondary)]">
                                                        {player.position} • {player.team} • ${player.auctionValue} • {player.teamName}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                    
                                    {filteredPlayers.length === 0 && (
                                        <div className="text-center py-8 text-[var(--text-secondary)]">
                                            No players found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TradeBuilderTab;
