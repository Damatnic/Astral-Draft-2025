/**
 * Lineup Optimizer
 * AI-powered lineup suggestions and optimization tools
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Avatar } from '../ui/Avatar';
import { Player, Team, League, PlayerPosition } from '../../types';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { XIcon } from '../icons/XIcon';
import { StarIcon } from '../icons/StarIcon';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';

interface LineupOptimizerProps {
    team: Team;
    league: League;
    dispatch: React.Dispatch<any>;
    canEdit: boolean;
}

interface LineupSuggestion {
    id: string;
    name: string;
    starters: Player[];
    projectedScore: number;
    confidence: number;
    reasoning: string;
    improvements: string[];
    riskLevel: 'Low' | 'Medium' | 'High';
}

interface OptimizerSettings {
    optimizeFor: 'ceiling' | 'floor' | 'projection';
    riskTolerance: 'conservative' | 'balanced' | 'aggressive';
    considerMatchups: boolean;
    considerWeather: boolean;
    considerInjuries: boolean;
}

const LineupOptimizer: React.FC<LineupOptimizerProps> = ({ team, league, dispatch, canEdit }) => {
    const [isOptimizing, setIsOptimizing] = React.useState(false);
    const [suggestions, setSuggestions] = React.useState<LineupSuggestion[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = React.useState<LineupSuggestion | null>(null);
    const [settings, setSettings] = React.useState<OptimizerSettings>({
        optimizeFor: 'projection',
        riskTolerance: 'balanced',
        considerMatchups: true,
        considerWeather: true,
        considerInjuries: true
    });

    // Current lineup
    const currentLineup = team.roster.slice(0, 9); // First 9 are starters
    const currentProjection = currentLineup.reduce((sum, player) => sum + player.stats.projection, 0);

    const positionSlots = [
        { position: 'QB', count: 1 },
        { position: 'RB', count: 2 },
        { position: 'WR', count: 2 },
        { position: 'TE', count: 1 },
        { position: 'FLEX', count: 1 }, // RB/WR/TE
        { position: 'DST', count: 1 },
        { position: 'K', count: 1 }
    ];

    const generateOptimizations = async () => {
        setIsOptimizing(true);
        
        // Simulate AI optimization process
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockSuggestions: LineupSuggestion[] = [
            {
                id: '1',
                name: 'Maximum Points',
                starters: team.roster.slice(0, 9), // Mock optimized lineup
                projectedScore: currentProjection + 8.5,
                confidence: 87,
                reasoning: 'This lineup maximizes projected points by starting your highest-scoring players at each position.',
                improvements: [
                    'Move Josh Jacobs to RB2 for better matchup vs weak run defense',
                    'Start Mike Evans over Jerry Jeudy due to target share increase',
                    'Consider streaming defense with better matchup'
                ],
                riskLevel: 'Medium'
            },
            {
                id: '2',
                name: 'Safe Floor',
                starters: team.roster.slice(0, 9),
                projectedScore: currentProjection + 2.3,
                confidence: 94,
                reasoning: 'Conservative lineup focused on consistent performers with high floors.',
                improvements: [
                    'Start reliable pass-catching RBs for higher floor',
                    'Avoid boom-or-bust WR3 options',
                    'Play proven veterans over rookies in key spots'
                ],
                riskLevel: 'Low'
            },
            {
                id: '3',
                name: 'High Ceiling',
                starters: team.roster.slice(0, 9),
                projectedScore: currentProjection + 12.7,
                confidence: 73,
                reasoning: 'Aggressive lineup targeting maximum upside with boom potential.',
                improvements: [
                    'Start high-upside WRs in plus matchups',
                    'Play RBs with goal-line opportunity',
                    'Target quarterbacks in projected shootouts'
                ],
                riskLevel: 'High'
            }
        ];

        setSuggestions(mockSuggestions);
        setSelectedSuggestion(mockSuggestions[0]);
        setIsOptimizing(false);
    };

    const applyLineup = (suggestion: LineupSuggestion) => {
        if (!canEdit) return;

        dispatch({
            type: 'SET_LINEUP',
            payload: {
                leagueId: league.id,
                teamId: team.id,
                playerIds: suggestion.starters.map((p: any) => p.id)
            }
        });

        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                message: `Applied "${suggestion.name}" lineup optimization`,
                type: 'SYSTEM'
            }
        });
    };

    const renderLineupCard = (suggestion: LineupSuggestion) => (
        <div
            key={suggestion.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedSuggestion?.id === suggestion.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[var(--panel-border)] hover:border-gray-500'
            }`}
            onClick={() => setSelectedSuggestion(suggestion)}
        >
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[var(--text-primary)]">{suggestion.name}</h4>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                        suggestion.riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                        suggestion.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                    }`}>
                        {suggestion.riskLevel} Risk
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                <div className="text-center">
                    <div className="text-lg font-bold text-green-400">
                        {suggestion.projectedScore.toFixed(1)}
                    </div>
                    <div className="text-gray-400">Projected</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">
                        +{(suggestion.projectedScore - currentProjection).toFixed(1)}
                    </div>
                    <div className="text-gray-400">Improvement</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">
                        {suggestion.confidence}%
                    </div>
                    <div className="text-gray-400">Confidence</div>
                </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-3">{suggestion.reasoning}</p>

            {canEdit && (
                <button
                    onClick={(e: any) => {
                        e.stopPropagation();
                        applyLineup(suggestion);
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                    Apply This Lineup
                </button>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Optimizer Settings */}
            <Widget title="Optimization Settings">
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Optimize For
                            </label>
                            <select
                                value={settings.optimizeFor}
                                onChange={(e: any) => setSettings(prev => ({ ...prev, optimizeFor: e.target.value as any }))}
                                className="w-full px-3 py-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)]"
                            >
                                <option value="projection">Projected Points</option>
                                <option value="ceiling">Ceiling (Maximum Upside)</option>
                                <option value="floor">Floor (Consistent Points)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Risk Tolerance
                            </label>
                            <select
                                value={settings.riskTolerance}
                                onChange={(e: any) => setSettings(prev => ({ ...prev, riskTolerance: e.target.value as any }))}
                                className="w-full px-3 py-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)]"
                            >
                                <option value="conservative">Conservative</option>
                                <option value="balanced">Balanced</option>
                                <option value="aggressive">Aggressive</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Advanced Options
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={settings.considerMatchups}
                                        onChange={(e: any) => setSettings(prev => ({ ...prev, considerMatchups: e.target.checked }))}
                                        className="rounded"
                                    />
                                    Consider Matchups
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={settings.considerWeather}
                                        onChange={(e: any) => setSettings(prev => ({ ...prev, considerWeather: e.target.checked }))}
                                        className="rounded"
                                    />
                                    Consider Weather
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={settings.considerInjuries}
                                        onChange={(e: any) => setSettings(prev => ({ ...prev, considerInjuries: e.target.checked }))}
                                        className="rounded"
                                    />
                                    Consider Injuries
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={generateOptimizations}
                        disabled={isOptimizing || !canEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                    >
                        {isOptimizing ? (
                            <>
                                <RefreshIcon className="w-4 h-4 animate-spin" />
                                Optimizing...
                            </>
                        ) : (
                            <>
                                <BrainCircuitIcon className="w-4 h-4" />
                                Generate Optimizations
                            </>
                        )}
                    </button>
                </div>
            </Widget>

            {/* Current Lineup */}
            <Widget title="Current Lineup">
                <div className="p-4">
                    <div className="mb-4 text-center">
                        <div className="text-2xl font-bold text-[var(--text-primary)]">
                            {currentProjection.toFixed(1)} pts
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">Projected Score</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentLineup.map((player, index) => (
                            <div key={player.id} className="flex items-center gap-3 p-3 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg">
                                <Avatar
                                    avatar={player.astralIntelligence?.spiritAnimal?.[0] || '🏈'}
                                    className="w-10 h-10 text-xl rounded-md"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <p className="font-medium text-[var(--text-primary)] truncate">{player.name}</p>
                                        <StarIcon className="w-3 h-3 text-yellow-500" />
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)]">{player.position} - {player.team}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-green-400">{player.stats.projection.toFixed(1)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Widget>

            {/* Optimization Suggestions */}
            {suggestions.length > 0 && (
                <Widget title="Lineup Suggestions">
                    <div className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                            {suggestions.map(renderLineupCard)}
                        </div>

                        {/* Detailed View */}
                        {selectedSuggestion && (
                            <div className="border-t border-[var(--panel-border)] pt-4">
                                <h4 className="font-semibold text-[var(--text-primary)] mb-3">
                                    Detailed Analysis: {selectedSuggestion.name}
                                </h4>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h5 className="font-medium text-[var(--text-primary)] mb-2">Recommended Starters</h5>
                                        <div className="space-y-2">
                                            {selectedSuggestion.starters.map((player, index) => (
                                                <div key={player.id} className="flex items-center justify-between p-2 bg-[var(--panel-bg)] rounded">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                                                            {positionSlots[index]?.position || 'FLEX'}
                                                        </span>
                                                        <span className="font-medium">{player.name}</span>
                                                        <span className="text-sm text-[var(--text-secondary)]">({player.position})</span>
                                                    </div>
                                                    <span className="text-green-400 font-medium">{player.stats.projection.toFixed(1)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="font-medium text-[var(--text-primary)] mb-2">Key Improvements</h5>
                                        <ul className="space-y-2">
                                            {selectedSuggestion.improvements.map((improvement, index) => (
                                                <li key={index} className="flex items-start gap-2 text-sm">
                                                    <TrendingUpIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                                    <span className="text-[var(--text-secondary)]">{improvement}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Widget>
            )}

            {/* Empty State */}
            {suggestions.length === 0 && !isOptimizing && (
                <Widget title="Lineup Optimization">
                    <div className="p-8 text-center">
                        <BrainCircuitIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                            Ready to Optimize Your Lineup?
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-4">
                            Get AI-powered lineup suggestions based on projections, matchups, and your preferences.
                        </p>
                        {canEdit ? (
                            <button
                                onClick={generateOptimizations}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                            >
                                Generate Lineup Suggestions
                            </button>
                        ) : (
                            <p className="text-yellow-400">View-only mode - optimization not available</p>
                        )}
                    </div>
                </Widget>
            )}
        </div>
    );
};

export default LineupOptimizer;
