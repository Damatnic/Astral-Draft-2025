/**
 * Advanced Stats Tab
 * Comprehensive statistical analysis for player profiles
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Player, League } from '../../types';
import { BarChartIcon } from '../icons/BarChartIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { TrendingDownIcon } from '../icons/TrendingDownIcon';
import { TargetIcon } from '../icons/TargetIcon';

interface AdvancedStatsTabProps {
    player: Player;
    league: League;
    dispatch: React.Dispatch<any>;
}

interface StatComparison {
    label: string;
    playerValue: number;
    positionAverage: number;
    rank: number;
    total: number;
    format: 'number' | 'percentage' | 'decimal';
}

interface WeeklyProjection {
    week: number;
    projection: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    opponent: string;
    confidence: number;
}

const AdvancedStatsTab: React.FC<AdvancedStatsTabProps> = ({ player, league }) => {
    // Mock advanced stats - in real app this would come from analytics service
    const statComparisons: StatComparison[] = [
        {
            label: 'Fantasy Points Per Game',
            playerValue: player.stats.projection,
            positionAverage: player.position === 'QB' ? 18.5 : player.position === 'RB' ? 12.8 : 11.2,
            rank: Math.floor(Math.random() * 50) + 1,
            total: 200,
            format: 'decimal'
        },
        {
            label: 'Consistency Rating',
            playerValue: 8.2,
            positionAverage: 6.5,
            rank: 15,
            total: 200,
            format: 'decimal'
        },
        {
            label: 'Ceiling Score',
            playerValue: player.stats.projection * 1.4,
            positionAverage: (player.position === 'QB' ? 18.5 : player.position === 'RB' ? 12.8 : 11.2) * 1.3,
            rank: 8,
            total: 200,
            format: 'decimal'
        },
        {
            label: 'Floor Score',
            playerValue: player.stats.projection * 0.7,
            positionAverage: (player.position === 'QB' ? 18.5 : player.position === 'RB' ? 12.8 : 11.2) * 0.75,
            rank: 22,
            total: 200,
            format: 'decimal'
        }
    ];

    const weeklyProjections: WeeklyProjection[] = [
        { week: 5, projection: 18.5, difficulty: 'Easy', opponent: 'vs MIA', confidence: 85 },
        { week: 6, projection: 15.2, difficulty: 'Hard', opponent: '@ BUF', confidence: 65 },
        { week: 7, projection: 22.1, difficulty: 'Easy', opponent: 'vs JAX', confidence: 90 },
        { week: 8, projection: 16.8, difficulty: 'Medium', opponent: '@ NYJ', confidence: 75 }
    ];

    const getStatColor = (playerValue: number, positionAverage: number) => {
        const ratio = playerValue / positionAverage;
        if (ratio >= 1.2) return 'text-green-400';
        if (ratio <= 0.8) return 'text-red-400';
        return 'text-yellow-400';
    };

    const getStatIcon = (playerValue: number, positionAverage: number) => {
        const ratio = playerValue / positionAverage;
        if (ratio >= 1.1) return <TrendingUpIcon className="w-4 h-4 text-green-400" />;
        if (ratio <= 0.9) return <TrendingDownIcon className="w-4 h-4 text-red-400" />;
        return <BarChartIcon className="w-4 h-4 text-gray-400" />;
    };

    const formatStat = (value: number, format: StatComparison['format']) => {
        switch (format) {
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'decimal':
                return value.toFixed(1);
            default:
                return Math.round(value).toString();
        }
    };

    const getDifficultyColor = (difficulty: WeeklyProjection['difficulty']) => {
        switch (difficulty) {
            case 'Easy':
                return 'text-green-400 bg-green-500/20';
            case 'Hard':
                return 'text-red-400 bg-red-500/20';
            default:
                return 'text-yellow-400 bg-yellow-500/20';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Position Rankings */}
            <Widget title="Position Rankings & Comparisons">
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {statComparisons.map((stat, index) => (
                            <div key={index} className="p-4 bg-white/5 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-[var(--text-primary)]">{stat.label}</h4>
                                    {getStatIcon(stat.playerValue, stat.positionAverage)}
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--text-secondary)] text-sm">Player Value</span>
                                        <span className={`font-bold ${getStatColor(stat.playerValue, stat.positionAverage)}`}>
                                            {formatStat(stat.playerValue, stat.format)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--text-secondary)] text-sm">Position Avg</span>
                                        <span className="text-[var(--text-primary)]">
                                            {formatStat(stat.positionAverage, stat.format)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--text-secondary)] text-sm">Position Rank</span>
                                        <span className="text-blue-400 font-medium">
                                            #{stat.rank} of {stat.total}
                                        </span>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="mt-3">
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all ${
                                                    stat.playerValue > stat.positionAverage ? 'bg-green-400' : 'bg-red-400'
                                                }`}
                                                style={{ 
                                                    width: `${Math.min(100, (stat.playerValue / stat.positionAverage) * 50)}%` 
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Widget>

            {/* Advanced Metrics */}
            {player.advancedMetrics && (
                <Widget title="Advanced Metrics">
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                                <TargetIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-blue-400">
                                    {player.advancedMetrics.snapCountPct}%
                                </div>
                                <div className="text-sm text-[var(--text-secondary)]">Snap Count %</div>
                                <div className="text-xs text-[var(--text-secondary)] mt-1">
                                    Share of team's offensive snaps
                                </div>
                            </div>
                            
                            <div className="text-center p-4 bg-green-500/10 rounded-lg">
                                <TargetIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-green-400">
                                    {player.advancedMetrics.targetSharePct}%
                                </div>
                                <div className="text-sm text-[var(--text-secondary)]">Target Share</div>
                                <div className="text-xs text-[var(--text-secondary)] mt-1">
                                    Percentage of team targets
                                </div>
                            </div>
                            
                            <div className="text-center p-4 bg-red-500/10 rounded-lg">
                                <TargetIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-red-400">
                                    {player.advancedMetrics.redZoneTouches}
                                </div>
                                <div className="text-sm text-[var(--text-secondary)]">Red Zone Touches</div>
                                <div className="text-xs text-[var(--text-secondary)] mt-1">
                                    Opportunities inside the 20
                                </div>
                            </div>
                        </div>
                    </div>
                </Widget>
            )}

            {/* Weekly Projections */}
            <Widget title="Upcoming Weekly Projections">
                <div className="p-4">
                    <div className="space-y-3">
                        {weeklyProjections.map((week) => (
                            <div key={week.week} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="text-center min-w-[60px]">
                                        <div className="font-bold text-[var(--text-primary)]">Week {week.week}</div>
                                        <div className="text-xs text-[var(--text-secondary)]">{week.opponent}</div>
                                    </div>
                                    
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(week.difficulty)}`}>
                                        {week.difficulty}
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    <div className="font-bold text-[var(--text-primary)] text-lg">
                                        {week.projection} pts
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">
                                        {week.confidence}% confidence
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                        <div className="text-center">
                            <div className="text-sm text-[var(--text-secondary)] mb-1">4-Week Average Projection</div>
                            <div className="text-2xl font-bold text-blue-400">
                                {(weeklyProjections.reduce((sum, w) => sum + w.projection, 0) / weeklyProjections.length).toFixed(1)} pts
                            </div>
                        </div>
                    </div>
                </div>
            </Widget>

            {/* Matchup Difficulty Analysis */}
            <Widget title="Season Schedule Analysis">
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-500/10 rounded-lg">
                            <div className="text-2xl font-bold text-green-400">6</div>
                            <div className="text-sm text-[var(--text-secondary)]">Easy Matchups</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-400">7</div>
                            <div className="text-sm text-[var(--text-secondary)]">Medium Matchups</div>
                        </div>
                        <div className="text-center p-4 bg-red-500/10 rounded-lg">
                            <div className="text-2xl font-bold text-red-400">4</div>
                            <div className="text-sm text-[var(--text-secondary)]">Hard Matchups</div>
                        </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-white/5 rounded-lg">
                        <div className="text-center">
                            <div className="text-sm text-[var(--text-secondary)] mb-1">Overall Schedule Difficulty</div>
                            <div className="text-xl font-bold text-yellow-400">Moderate</div>
                            <div className="text-xs text-[var(--text-secondary)]">
                                Ranked 12th easiest among {player.position} players
                            </div>
                        </div>
                    </div>
                </div>
            </Widget>
        </motion.div>
    );
};

export default AdvancedStatsTab;
