/**
 * Player Comparison Tab
 * Side-by-side player analysis and comparison tools
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Avatar } from '../ui/Avatar';
import { Player, League } from '../../types';
import { CompareIcon } from '../icons/CompareIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { TrendingDownIcon } from '../icons/TrendingDownIcon';
import { BarChartIcon } from '../icons/BarChartIcon';

interface PlayerComparisonTabProps {
    player: Player;
    league: League;
    dispatch: React.Dispatch<any>;
}

interface ComparisonMetric {
    label: string;
    player1Value: number;
    player2Value: number;
    format: 'number' | 'decimal' | 'percentage';
    higherIsBetter: boolean;
}

const PlayerComparisonTab: React.FC<PlayerComparisonTabProps> = ({ player, league }) => {
    const [comparePlayer, setComparePlayer] = React.useState<Player | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showSearch, setShowSearch] = React.useState(false);

    // Mock similar players - in real app this would come from ML similarity service
    const availablePlayers = React.useMemo(() => {
        // Filter players by same position and similar tier
        const samePosition = league.teams.flatMap(team => 
            team.roster.filter((p: any) => 
                p.position === player.position && 
                p.id !== player.id &&
                Math.abs(p?.tier - player?.tier) <= 2
            )
        );
        
        // If no same position players, create mock data
        if (samePosition.length === 0) {
            return [
                {
                    id: 999,
                    name: `Mock ${player.position} Player 1`,
                    position: player.position,
                    team: 'TB',
                    rank: player.rank + 5,
                    adp: player?.adp + 10,
                    tier: player?.tier,
                    age: player?.age + 2,
                    bye: player.bye + 1,
                    auctionValue: player.auctionValue - 3,
                    stats: {
                        projection: player.stats.projection - 2.5,
                        lastYear: player.stats.lastYear - 1.8,
                        vorp: player.stats.vorp - 1.2,
                        weeklyProjections: {}
                    }
                } as Player,
                {
                    id: 998,
                    name: `Mock ${player.position} Player 2`,
                    position: player.position,
                    team: 'GB',
                    rank: player.rank - 3,
                    adp: player?.adp - 8,
                    tier: player?.tier,
                    age: player?.age - 1,
                    bye: player.bye + 2,
                    auctionValue: player.auctionValue + 2,
                    stats: {
                        projection: player.stats.projection + 1.8,
                        lastYear: player.stats.lastYear + 2.1,
                        vorp: player.stats.vorp + 0.8,
                        weeklyProjections: {}
                    }
                } as Player
            ];
        }
        
        return samePosition;
    }, [league.teams, player]);

    const filteredPlayers = availablePlayers.filter((p: any) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.team.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const comparisonMetrics: ComparisonMetric[] = comparePlayer ? [
        {
            label: 'Fantasy Projection',
            player1Value: player.stats.projection,
            player2Value: comparePlayer.stats.projection,
            format: 'decimal',
            higherIsBetter: true
        },
        {
            label: 'Last Year Points',
            player1Value: player.stats.lastYear,
            player2Value: comparePlayer.stats.lastYear,
            format: 'decimal',
            higherIsBetter: true
        },
        {
            label: 'VORP',
            player1Value: player.stats.vorp,
            player2Value: comparePlayer.stats.vorp,
            format: 'decimal',
            higherIsBetter: true
        },
        {
            label: 'Overall Rank',
            player1Value: player.rank,
            player2Value: comparePlayer.rank,
            format: 'number',
            higherIsBetter: false
        },
        {
            label: 'ADP',
            player1Value: player?.adp,
            player2Value: comparePlayer?.adp,
            format: 'number',
            higherIsBetter: false
        },
        {
            label: 'Auction Value',
            player1Value: player.auctionValue,
            player2Value: comparePlayer.auctionValue,
            format: 'number',
            higherIsBetter: true
        },
        {
            label: 'Age',
            player1Value: player?.age,
            player2Value: comparePlayer?.age,
            format: 'number',
            higherIsBetter: false
        },
        {
            label: 'Bye Week',
            player1Value: player.bye,
            player2Value: comparePlayer.bye,
            format: 'number',
            higherIsBetter: false
        }
    ] : [];

    const formatValue = (value: number, format: ComparisonMetric['format']) => {
        switch (format) {
            case 'decimal':
                return value.toFixed(1);
            case 'percentage':
                return `${value.toFixed(1)}%`;
            default:
                return Math.round(value).toString();
        }
    };

    const getAdvantageIcon = (player1Value: number, player2Value: number, higherIsBetter: boolean) => {
        const player1Better = higherIsBetter ? player1Value > player2Value : player1Value < player2Value;
        const player2Better = higherIsBetter ? player2Value > player1Value : player2Value < player1Value;
        
        if (Math.abs(player1Value - player2Value) < 0.1) {
            return <BarChartIcon className="w-4 h-4 text-gray-400" />;
        }
        
        return player1Better ? 
            <TrendingUpIcon className="w-4 h-4 text-green-400" /> : 
            <TrendingDownIcon className="w-4 h-4 text-red-400" />;
    };

    const getAdvantageColor = (player1Value: number, player2Value: number, higherIsBetter: boolean, isPlayer1: boolean) => {
        const player1Better = higherIsBetter ? player1Value > player2Value : player1Value < player2Value;
        const isEqual = Math.abs(player1Value - player2Value) < 0.1;
        
        if (isEqual) return 'text-gray-400';
        
        return (isPlayer1 && player1Better) || (!isPlayer1 && !player1Better) ? 
            'text-green-400 font-bold' : 
            'text-red-400';
    };

    const handlePlayerSelect = (selectedPlayer: Player) => {
        setComparePlayer(selectedPlayer);
        setShowSearch(false);
        setSearchTerm('');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Player Selection */}
            <Widget title="Player Comparison Tool">
                <div className="p-4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg flex-1">
                            <Avatar
                                avatar={player.astralIntelligence?.spiritAnimal?.[0] || '🏈'}
                                className="w-10 h-10 text-lg rounded-md"
                            />
                            <div>
                                <h3 className="font-medium text-[var(--text-primary)]">{player.name}</h3>
                                <p className="text-sm text-[var(--text-secondary)]">{player.position} • {player.team}</p>
                            </div>
                        </div>
                        
                        <CompareIcon className="w-6 h-6 text-gray-400" />
                        
                        <div className="flex-1">
                            {comparePlayer ? (
                                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            avatar={comparePlayer.astralIntelligence?.spiritAnimal?.[0] || '🏈'}
                                            className="w-10 h-10 text-lg rounded-md"
                                        />
                                        <div>
                                            <h3 className="font-medium text-[var(--text-primary)]">{comparePlayer.name}</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">{comparePlayer.position} • {comparePlayer.team}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setComparePlayer(null)}
                                        className="p-1 hover:bg-white/10 rounded"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowSearch(true)}
                                    className="w-full p-3 border-2 border-dashed border-gray-600 rounded-lg text-[var(--text-secondary)] hover:border-blue-400 hover:text-blue-400 transition-colors"
                                >
                                    <SearchIcon className="w-5 h-5 mx-auto mb-2" />
                                    Select player to compare
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search Modal */}
                    <AnimatePresence>
                        {showSearch && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
                                onClick={(e: any) => e.target === e.currentTarget && setShowSearch(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg shadow-xl p-6 max-w-md w-full max-h-[70vh] overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-[var(--text-primary)]">Select Player</h3>
                                        <button
                                            onClick={() => setShowSearch(false)}
                                            className="p-2 hover:bg-white/10 rounded-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="relative mb-4">
                                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search players..."
                                            value={searchTerm}
                                            onChange={(e: any) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)]"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {filteredPlayers.length === 0 ? (
                                            <p className="text-center text-[var(--text-secondary)] py-4">
                                                No players found
                                            </p>
                                        ) : (
                                            filteredPlayers.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handlePlayerSelect(p)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
                                                >
                                                    <Avatar
                                                        avatar={p.astralIntelligence?.spiritAnimal?.[0] || '🏈'}
                                                        className="w-8 h-8 text-sm rounded-md"
                                                    />
                                                    <div className="text-left">
                                                        <div className="font-medium text-[var(--text-primary)]">{p.name}</div>
                                                        <div className="text-sm text-[var(--text-secondary)]">
                                                            {p.position} • {p.team} • #{p.rank}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Widget>

            {/* Comparison Results */}
            {comparePlayer && (
                <Widget title="Head-to-Head Comparison">
                    <div className="p-4">
                        <div className="space-y-3">
                            {comparisonMetrics.map((metric, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`text-right min-w-[80px] ${getAdvantageColor(metric.player1Value, metric.player2Value, metric.higherIsBetter, true)}`}>
                                            {formatValue(metric.player1Value, metric.format)}
                                            {metric.format === 'number' && metric.label === 'Auction Value' && '$'}
                                        </div>
                                        
                                        <div className="text-center flex-1">
                                            <div className="font-medium text-[var(--text-primary)] mb-1">{metric.label}</div>
                                            {getAdvantageIcon(metric.player1Value, metric.player2Value, metric.higherIsBetter)}
                                        </div>
                                        
                                        <div className={`text-left min-w-[80px] ${getAdvantageColor(metric.player1Value, metric.player2Value, metric.higherIsBetter, false)}`}>
                                            {formatValue(metric.player2Value, metric.format)}
                                            {metric.format === 'number' && metric.label === 'Auction Value' && '$'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="mt-6 p-4 bg-blue-500/10 rounded-lg">
                            <h4 className="font-medium text-[var(--text-primary)] mb-2">Comparison Summary</h4>
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                                {player.name} vs {comparePlayer.name}: 
                                {player.stats.projection > comparePlayer.stats.projection ? 
                                    ` ${player.name} has the higher projection (${player.stats.projection.toFixed(1)} vs ${comparePlayer.stats.projection.toFixed(1)})` :
                                    ` ${comparePlayer.name} has the higher projection (${comparePlayer.stats.projection.toFixed(1)} vs ${player.stats.projection.toFixed(1)})`
                                }
                                {player?.adp < comparePlayer?.adp ? 
                                    ` but ${player.name} is being drafted earlier (ADP ${player?.adp} vs ${comparePlayer?.adp}).` :
                                    ` and ${comparePlayer.name} is being drafted earlier (ADP ${comparePlayer?.adp} vs ${player?.adp}).`
                                }
                            </p>
                        </div>
                    </div>
                </Widget>
            )}

            {/* Suggested Comparisons */}
            <Widget title="Suggested Comparisons">
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availablePlayers.slice(0, 4).map((suggestedPlayer) => (
                            <button
                                key={suggestedPlayer.id}
                                onClick={() => handlePlayerSelect(suggestedPlayer)}
                                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                            >
                                <Avatar
                                    avatar={suggestedPlayer.astralIntelligence?.spiritAnimal?.[0] || '🏈'}
                                    className="w-10 h-10 text-lg rounded-md"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-[var(--text-primary)]">{suggestedPlayer.name}</div>
                                    <div className="text-sm text-[var(--text-secondary)]">
                                        {suggestedPlayer.position} • {suggestedPlayer.team} • #{suggestedPlayer.rank}
                                    </div>
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">
                                    {suggestedPlayer.stats.projection.toFixed(1)} proj
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Widget>
        </motion.div>
    );
};

export default PlayerComparisonTab;
