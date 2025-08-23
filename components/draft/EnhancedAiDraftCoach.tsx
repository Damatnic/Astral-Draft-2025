/**
 * Enhanced AI Draft Coach Panel
 * Advanced real-time coaching with strategy adjustments and market analysis
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Player, League, Team } from '../../types';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { TrendingDownIcon } from '../icons/TrendingDownIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { BarChartIcon } from '../icons/BarChartIcon';
import { SearchIcon } from '../icons/SearchIcon';

interface EnhancedAiDraftCoachProps {
    league: League;
    currentTeam: Team;
    availablePlayers: Player[];
    currentPick: number;
    currentRound: number;
    isMyTurn: boolean;
    timeRemaining: number;
    recentPicks: DraftPick[];
    onPlayerSelect: (player: Player) => void;
    onStrategyUpdate: (strategy: DraftStrategy) => void;
}

export interface DraftPick {
    pickNumber: number;
    teamId: number;
    playerId: number;
    player: Player;
    timestamp: number;
    adpDifference: number;
}

export interface DraftStrategy {
    name: string;
    description: string;
    positionPriority: string[];
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    valueBased: boolean;
    targetPositions: string[];
}

export interface CoachRecommendation {
    id: string;
    type: 'pick' | 'strategy' | 'market' | 'opponent';
    priority: 'critical' | 'high' | 'medium' | 'low';
    confidence: number;
    title: string;
    description: string;
    reasoning: string[];
    player?: Player;
    action?: string;
    impact: number;
    timeLeft?: number;
}

export interface OpponentModel {
    teamId: number;
    teamName: string;
    tendencies: {
        averagePickTime: number;
        positionBias: Record<string, number>;
        reachTendency: number;
        valueTendency: number;
        riskProfile: 'conservative' | 'moderate' | 'aggressive';
    };
    predictedNextPicks: Player[];
    confidence: number;
    draftStrategy: string;
}

export interface MarketInefficiency {
    id: string;
    type: 'undervalued' | 'overvalued' | 'run_opportunity' | 'tier_break';
    player?: Player;
    position?: string;
    description: string;
    value: number;
    confidence: number;
    timeWindow: number;
    reasoning: string;
}

const EnhancedAiDraftCoach: React.FC<EnhancedAiDraftCoachProps> = ({
    league,
    currentTeam,
    availablePlayers,
    currentPick,
    currentRound,
    isMyTurn,
    timeRemaining,
    recentPicks,
    onPlayerSelect,
    onStrategyUpdate
}) => {
    const [selectedTab, setSelectedTab] = React.useState<'recommendations' | 'opponents' | 'market' | 'strategy'>('recommendations');
    const [recommendations, setRecommendations] = React.useState<CoachRecommendation[]>([]);
    const [opponentModels, setOpponentModels] = React.useState<OpponentModel[]>([]);
    const [marketInefficiencies, setMarketInefficiencies] = React.useState<MarketInefficiency[]>([]);
    const [currentStrategy, setCurrentStrategy] = React.useState<DraftStrategy>({
        name: 'Balanced Value',
        description: 'Target best available value with positional balance',
        positionPriority: ['RB', 'WR', 'QB', 'TE', 'K', 'DST'],
        riskTolerance: 'moderate',
        valueBased: true,
        targetPositions: []
    });

    // Generate real-time recommendations
    React.useEffect(() => {
        if (isMyTurn && availablePlayers.length > 0) {
            generateRecommendations();
        }
    }, [isMyTurn, currentPick, availablePlayers, currentTeam]);

    // Update opponent models based on recent picks
    React.useEffect(() => {
        updateOpponentModels();
    }, [recentPicks]);

    // Detect market inefficiencies
    React.useEffect(() => {
        detectMarketInefficiencies();
    }, [recentPicks, availablePlayers]);

    const generateRecommendations = React.useCallback(() => {
        const newRecommendations: CoachRecommendation[] = [];

        // Get top available players by position
        const topRBs = availablePlayers.filter((p: any) => p.position === 'RB').slice(0, 3);
        const topWRs = availablePlayers.filter((p: any) => p.position === 'WR').slice(0, 3);
        const topQBs = availablePlayers.filter((p: any) => p.position === 'QB').slice(0, 2);

        // Primary pick recommendation
        const topPlayer = availablePlayers[0];
        if (topPlayer) {
            newRecommendations.push({
                id: 'primary-pick',
                type: 'pick',
                priority: 'critical',
                confidence: 92,
                title: `Draft ${topPlayer.name}`,
                description: `Elite ${topPlayer.position} with exceptional value`,
                reasoning: [
                    `Projected ${topPlayer.stats.projection} points this season`,
                    `ADP: ${topPlayer?.adp} (excellent value at pick ${currentPick})`,
                    `Tier 1 player at premium position`,
                    `Addresses team need for reliable starter`
                ],
                player: topPlayer,
                action: 'Draft Now',
                impact: 85,
                timeLeft: timeRemaining
            });
        }

        // Position-specific recommendations
        if (currentRound <= 3 && topRBs.length > 0) {
            newRecommendations.push({
                id: 'rb-priority',
                type: 'strategy',
                priority: 'high',
                confidence: 87,
                title: 'Secure RB Depth',
                description: 'RB scarcity increasing - consider handcuffing strategy',
                reasoning: [
                    `Only ${topRBs.length} elite RBs remaining`,
                    'Historical data shows RB runs in early rounds',
                    'Your roster needs reliable rushing production'
                ],
                impact: 75
            });
        }

        // Urgency recommendations for time pressure
        if (timeRemaining < 30 && isMyTurn) {
            newRecommendations.push({
                id: 'time-pressure',
                type: 'pick',
                priority: 'critical',
                confidence: 95,
                title: 'Quick Decision Needed',
                description: 'Time running low - stick with prepared rankings',
                reasoning: [
                    'Less than 30 seconds remaining',
                    'Avoid overthinking - trust your preparation',
                    'Better to pick good player than auto-draft'
                ],
                impact: 60,
                timeLeft: timeRemaining
            });
        }

        // Market inefficiency alerts
        const undervaluedPlayers = availablePlayers.filter((p: any) => p?.adp > currentPick + 10);
        if (undervaluedPlayers.length > 0) {
            newRecommendations.push({
                id: 'value-opportunity',
                type: 'market',
                priority: 'medium',
                confidence: 78,
                title: 'Value Opportunities Available',
                description: `${undervaluedPlayers.length} players falling below ADP`,
                reasoning: [
                    'Market creating value opportunities',
                    'Consider reaching for falling players',
                    'Other teams may be panicking'
                ],
                impact: 65
            });
        }

        setRecommendations(newRecommendations);
    }, [availablePlayers, currentPick, currentRound, isMyTurn, timeRemaining, currentTeam]);

    const updateOpponentModels = React.useCallback(() => {
        const models: OpponentModel[] = league.teams
            .filter((team: any) => team.id !== currentTeam.id)
            .map((team: any) => {
                const teamPicks = recentPicks.filter((pick: any) => pick.teamId === team.id);
                const avgPickTime = teamPicks.reduce((sum, pick) => sum + (pick.timestamp || 60), 0) / Math.max(teamPicks.length, 1);
                
                // Calculate position bias based on picks
                const positionCounts: Record<string, number> = {};
                teamPicks.forEach((pick: any) => {
                    if (pick.player) {
                        positionCounts[pick.player.position] = (positionCounts[pick.player.position] || 0) + 1;
                    }
                });

                // Predict next picks based on patterns
                const predictedPicks = availablePlayers
                    .filter((p: any) => {
                        const teamRoster = team.roster || [];
                        const positionCount = teamRoster.filter((r: any) => r.position === p.position).length;
                        return positionCount < getPositionLimit(p.position);
                    })
                    .slice(0, 3);

                return {
                    teamId: team.id,
                    teamName: team.name,
                    tendencies: {
                        averagePickTime: avgPickTime,
                        positionBias: positionCounts,
                        reachTendency: calculateReachTendency(teamPicks),
                        valueTendency: calculateValueTendency(teamPicks),
                        riskProfile: determineRiskProfile(teamPicks)
                    },
                    predictedNextPicks: predictedPicks,
                    confidence: Math.min(95, 50 + teamPicks.length * 10),
                    draftStrategy: inferDraftStrategy(teamPicks, team.roster || [])
                };
            });

        setOpponentModels(models);
    }, [league.teams, currentTeam.id, recentPicks, availablePlayers]);

    const detectMarketInefficiencies = React.useCallback(() => {
        const inefficiencies: MarketInefficiency[] = [];

        // Detect position runs
        const recentPositions = recentPicks.slice(-5).map((pick: any) => pick.player?.position);
        const positionCounts = recentPositions.reduce((acc, pos) => {
            if (pos) acc[pos] = (acc[pos] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        Object.entries(positionCounts).forEach(([position, count]) => {
            if (count >= 3) {
                inefficiencies.push({
                    id: `run-${position}`,
                    type: 'run_opportunity',
                    position,
                    description: `${position} run detected - ${count} picks in last 5`,
                    value: count * 10,
                    confidence: 85,
                    timeWindow: 3,
                    reasoning: `Position scarcity increasing, consider targeting ${position} soon`
                });
            }
        });

        // Detect undervalued players
        availablePlayers.slice(0, 20).forEach((player: any) => {
            const adpDiff = player?.adp - currentPick;
            if (adpDiff > 15) {
                inefficiencies.push({
                    id: `undervalued-${player.id}`,
                    type: 'undervalued',
                    player,
                    description: `${player.name} falling ${adpDiff.toFixed(1)} picks below ADP`,
                    value: adpDiff,
                    confidence: 75,
                    timeWindow: 5,
                    reasoning: 'Significant value opportunity - player drafted much later than expected'
                });
            }
        });

        // Detect tier breaks
        const positions = ['QB', 'RB', 'WR', 'TE'];
        positions.forEach((position: any) => {
            const positionPlayers = availablePlayers.filter((p: any) => p.position === position);
            if (positionPlayers.length >= 2) {
                const tierBreak = positionPlayers[0].tier !== positionPlayers[1].tier;
                if (tierBreak) {
                    inefficiencies.push({
                        id: `tier-${position}`,
                        type: 'tier_break',
                        position,
                        description: `Major tier break at ${position} - last elite option available`,
                        value: 20,
                        confidence: 90,
                        timeWindow: 2,
                        reasoning: `Consider reaching for ${positionPlayers[0].name} before tier drop`
                    });
                }
            }
        });

        setMarketInefficiencies(inefficiencies);
    }, [recentPicks, availablePlayers, currentPick]);

    const getRecommendationIcon = (type: string, priority: string) => {
        if (priority === 'critical') return <AlertTriangleIcon className="w-5 h-5 text-red-400" />;
        if (type === 'pick') return <CheckIcon className="w-5 h-5 text-green-400" />;
        if (type === 'market') return <TrendingUpIcon className="w-5 h-5 text-blue-400" />;
        if (type === 'strategy') return <BarChartIcon className="w-5 h-5 text-purple-400" />;
        return <BrainCircuitIcon className="w-5 h-5 text-gray-400" />;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'border-red-400 bg-red-500/10';
            case 'high': return 'border-orange-400 bg-orange-500/10';
            case 'medium': return 'border-yellow-400 bg-yellow-500/10';
            case 'low': return 'border-gray-400 bg-gray-500/10';
            default: return 'border-gray-400 bg-gray-500/10';
        }
    };

    const handleRecommendationAction = (recommendation: CoachRecommendation) => {
        if (recommendation.player && recommendation.type === 'pick') {
            onPlayerSelect(recommendation.player);
        }
    };

    const tabs = [
        { id: 'recommendations', label: 'Recommendations', icon: <BrainCircuitIcon className="w-4 h-4" /> },
        { id: 'opponents', label: 'Opponents', icon: <SearchIcon className="w-4 h-4" /> },
        { id: 'market', label: 'Market', icon: <TrendingUpIcon className="w-4 h-4" /> },
        { id: 'strategy', label: 'Strategy', icon: <BarChartIcon className="w-4 h-4" /> }
    ];

    return (
        <div className="h-full flex flex-col bg-[var(--panel-bg)]">
            {/* Header with AI Status */}
            <div className="flex-shrink-0 p-4 border-b border-[var(--panel-border)]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                        <BrainCircuitIcon className="w-6 h-6 text-blue-400" />
                        AI Draft Coach
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-[var(--text-secondary)]">Active</span>
                    </div>
                </div>
                
                {isMyTurn && (
                    <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-blue-400 font-medium">Your Turn!</span>
                            <span className="text-blue-400 font-mono">
                                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-1">
                            Pick {currentPick} • Round {currentRound}
                        </div>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex-shrink-0 border-b border-[var(--panel-border)]">
                <div className="flex overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                                selectedTab === tab.id
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 h-full"
                    >
                        {selectedTab === 'recommendations' && (
                            <div className="space-y-3">
                                {recommendations.map((rec, index) => (
                                    <motion.div
                                        key={rec.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`border rounded-lg p-4 cursor-pointer hover:bg-white/5 transition-colors ${getPriorityColor(rec.priority)}`}
                                        onClick={() => handleRecommendationAction(rec)}
                                    >
                                        <div className="flex items-start gap-3">
                                            {getRecommendationIcon(rec.type, rec.priority)}
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-medium text-[var(--text-primary)]">
                                                        {rec.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-[var(--text-secondary)]">
                                                            {rec.confidence}% confidence
                                                        </span>
                                                        {rec.timeLeft && rec.timeLeft < 60 && (
                                                            <span className="text-xs text-red-400 font-mono">
                                                                {rec.timeLeft}s
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <p className="text-sm text-[var(--text-secondary)] mb-3">
                                                    {rec.description}
                                                </p>
                                                
                                                <div className="space-y-1">
                                                    {rec.reasoning.map((reason, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                                            <div className="w-1 h-1 bg-current rounded-full"></div>
                                                            {reason}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {rec.action && (
                                                    <button className="mt-3 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
                                                        {rec.action}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                
                                {recommendations.length === 0 && (
                                    <div className="text-center py-8 text-[var(--text-secondary)]">
                                        <BrainCircuitIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>AI is analyzing the draft...</p>
                                        <p className="text-sm">Recommendations will appear when it's your turn</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {selectedTab === 'opponents' && (
                            <div className="space-y-4">
                                {opponentModels.map((model, index) => (
                                    <motion.div
                                        key={model.teamId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white/5 rounded-lg p-4"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-[var(--text-primary)]">
                                                {model.teamName}
                                            </h4>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {model.confidence}% confidence
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <div className="text-xs text-[var(--text-secondary)]">Avg Pick Time</div>
                                                <div className="font-mono text-sm text-[var(--text-primary)]">
                                                    {Math.round(model.tendencies.averagePickTime)}s
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-[var(--text-secondary)]">Strategy</div>
                                                <div className="text-sm text-[var(--text-primary)]">
                                                    {model.draftStrategy}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="text-xs text-[var(--text-secondary)] mb-2">Likely Next Picks</div>
                                            <div className="space-y-1">
                                                {model.predictedNextPicks.slice(0, 2).map((player) => (
                                                    <div key={player.id} className="text-sm text-[var(--text-primary)]">
                                                        {player.name} ({player.position})
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                        
                        {selectedTab === 'market' && (
                            <div className="space-y-3">
                                {marketInefficiencies.map((inefficiency, index) => (
                                    <motion.div
                                        key={inefficiency.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white/5 rounded-lg p-4 border border-[var(--panel-border)]"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-[var(--text-primary)]">
                                                {inefficiency.description}
                                            </h4>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {inefficiency.confidence}% confidence
                                            </span>
                                        </div>
                                        
                                        <p className="text-sm text-[var(--text-secondary)] mb-2">
                                            {inefficiency.reasoning}
                                        </p>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                inefficiency.type === 'undervalued' ? 'bg-green-500/20 text-green-400' :
                                                inefficiency.type === 'overvalued' ? 'bg-red-500/20 text-red-400' :
                                                inefficiency.type === 'run_opportunity' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {inefficiency.type.replace('_', ' ').toUpperCase()}
                                            </span>
                                            
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                Act within {inefficiency.timeWindow} picks
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                                
                                {marketInefficiencies.length === 0 && (
                                    <div className="text-center py-8 text-[var(--text-secondary)]">
                                        <TrendingUpIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No significant market inefficiencies detected</p>
                                        <p className="text-sm">Market is following expected patterns</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {selectedTab === 'strategy' && (
                            <div className="space-y-4">
                                <div className="bg-white/5 rounded-lg p-4">
                                    <h4 className="font-medium text-[var(--text-primary)] mb-3">Current Strategy</h4>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-[var(--text-secondary)]">Name: </span>
                                            <span className="text-sm text-[var(--text-primary)]">{currentStrategy.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-[var(--text-secondary)]">Description: </span>
                                            <span className="text-sm text-[var(--text-primary)]">{currentStrategy.description}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-[var(--text-secondary)]">Risk Tolerance: </span>
                                            <span className="text-sm text-[var(--text-primary)]">{currentStrategy.riskTolerance}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white/5 rounded-lg p-4">
                                    <h4 className="font-medium text-[var(--text-primary)] mb-3">Position Priority</h4>
                                    <div className="space-y-2">
                                        {currentStrategy.positionPriority.map((position, index) => (
                                            <div key={position} className="flex items-center justify-between">
                                                <span className="text-sm text-[var(--text-primary)]">
                                                    {index + 1}. {position}
                                                </span>
                                                <span className="text-xs text-[var(--text-secondary)]">
                                                    Priority {index + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// Helper functions
const getPositionLimit = (position: string): number => {
    const limits: Record<string, number> = {
        'QB': 2,
        'RB': 4,
        'WR': 5,
        'TE': 2,
        'K': 1,
        'DST': 1
    };
    return limits[position] || 1;
};

const calculateReachTendency = (picks: DraftPick[]): number => {
    const reaches = picks.filter((pick: any) => pick?.adpDifference > 10).length;
    return Math.min(1, reaches / Math.max(picks.length, 1));
};

const calculateValueTendency = (picks: DraftPick[]): number => {
    const values = picks.filter(pick => pick?.adpDifference < -5).length;
    return Math.min(1, values / Math.max(picks.length, 1));
};

const determineRiskProfile = (picks: DraftPick[]): 'conservative' | 'moderate' | 'aggressive' => {
    const reachTendency = calculateReachTendency(picks);
    if (reachTendency > 0.3) return 'aggressive';
    if (reachTendency > 0.1) return 'moderate';
    return 'conservative';
};

const inferDraftStrategy = (picks: DraftPick[], roster: Player[]): string => {
    const positionCounts: Record<string, number> = {};
    [...picks.map((p: any) => p.player), ...roster].forEach((player: any) => {
        if (player) {
            positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
        }
    });

    const rbCount = positionCounts['RB'] || 0;
    const wrCount = positionCounts['WR'] || 0;
    
    if (rbCount > wrCount + 1) return 'RB Heavy';
    if (wrCount > rbCount + 1) return 'WR Heavy';
    if (picks.length > 0 && picks.every(p => p?.adpDifference < 5)) return 'Value Based';
    return 'Balanced';
};

export default EnhancedAiDraftCoach;
