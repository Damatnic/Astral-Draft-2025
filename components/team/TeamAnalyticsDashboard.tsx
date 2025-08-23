/**
 * Team Analytics Dashboard
 * Comprehensive performance metrics and analytics for team management
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Avatar } from '../ui/Avatar';
import { Team, League, Player } from '../../types';
import { BarChartIcon } from '../icons/BarChartIcon';
import { TrendingDownIcon } from '../icons/TrendingDownIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { TargetIcon } from '../icons/TargetIcon';

interface TeamAnalyticsDashboardProps {
    team: Team;
    league: League;
    dispatch: React.Dispatch<any>;
}

interface WeeklyPerformance {
    week: number;
    points: number;
    projectedPoints: number;
    opponent: string;
    result: 'W' | 'L' | 'T';
}

interface PositionAnalysis {
    position: string;
    averagePoints: number;
    consistency: number;
    trend: 'up' | 'down' | 'stable';
    topPlayer: Player;
    depth: number;
}

interface MatchupPreview {
    opponent: Team;
    winProbability: number;
    projectedScore: number;
    opponentProjected: number;
    keyMatchups: {
        myPlayer: Player;
        theirPlayer: Player;
        advantage: 'favor' | 'against' | 'neutral';
    }[];
}

const TeamAnalyticsDashboard: React.FC<TeamAnalyticsDashboardProps> = ({ team, league, dispatch }) => {
    const [selectedTab, setSelectedTab] = React.useState<'overview' | 'trends' | 'projections' | 'matchup'>('overview');

    // Mock data - in real app this would come from analytics service
    const weeklyPerformance: WeeklyPerformance[] = [
        { week: 1, points: 142.5, projectedPoints: 138.2, opponent: 'Thunder Bolts', result: 'W' },
        { week: 2, points: 118.3, projectedPoints: 125.8, opponent: 'Fire Dragons', result: 'L' },
        { week: 3, points: 156.7, projectedPoints: 141.3, opponent: 'Ice Wolves', result: 'W' },
        { week: 4, points: 134.2, projectedPoints: 139.7, opponent: 'Storm Eagles', result: 'W' }
    ];

    const positionAnalysis: PositionAnalysis[] = [
        {
            position: 'QB',
            averagePoints: 22.8,
            consistency: 8.5,
            trend: 'up',
            topPlayer: { id: 1, name: 'Josh Allen', position: 'QB', team: 'BUF' } as Player,
            depth: 2
        },
        {
            position: 'RB',
            averagePoints: 18.4,
            consistency: 6.2,
            trend: 'stable',
            topPlayer: { id: 2, name: 'Christian McCaffrey', position: 'RB', team: 'SF' } as Player,
            depth: 4
        },
        {
            position: 'WR',
            averagePoints: 15.7,
            consistency: 7.1,
            trend: 'down',
            topPlayer: { id: 3, name: 'Tyreek Hill', position: 'WR', team: 'MIA' } as Player,
            depth: 5
        },
        {
            position: 'TE',
            averagePoints: 12.3,
            consistency: 5.8,
            trend: 'up',
            topPlayer: { id: 4, name: 'Travis Kelce', position: 'TE', team: 'KC' } as Player,
            depth: 2
        }
    ];

    const nextMatchup: MatchupPreview = {
        opponent: { 
            id: 5, 
            name: 'Desert Hawks', 
            owner: { id: '5', name: 'Mike Wilson', avatar: '🦅' },
            avatar: '🏜️'
        } as Team,
        winProbability: 67,
        projectedScore: 128.5,
        opponentProjected: 118.2,
        keyMatchups: [
            {
                myPlayer: { id: 1, name: 'Josh Allen', position: 'QB' } as Player,
                theirPlayer: { id: 6, name: 'Lamar Jackson', position: 'QB' } as Player,
                advantage: 'neutral'
            },
            {
                myPlayer: { id: 2, name: 'Christian McCaffrey', position: 'RB' } as Player,
                theirPlayer: { id: 7, name: 'Derrick Henry', position: 'RB' } as Player,
                advantage: 'favor'
            }
        ]
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUpIcon className="w-4 h-4 text-green-400" />;
            case 'down':
                return <TrendingDownIcon className="w-4 h-4 text-red-400" />;
            default:
                return <BarChartIcon className="w-4 h-4 text-gray-400" />;
        }
    };

    const getAdvantageColor = (advantage: 'favor' | 'against' | 'neutral') => {
        switch (advantage) {
            case 'favor':
                return 'text-green-400';
            case 'against':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-4 border-b border-[var(--panel-border)]">
                {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'trends', label: 'Trends' },
                    { id: 'projections', label: 'Projections' },
                    { id: 'matchup', label: 'Next Matchup' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id as any)}
                        className={`py-2 px-4 font-medium transition-colors relative ${
                            selectedTab === tab.id
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {selectedTab === 'overview' && (
                <div className="space-y-6">
                    {/* Performance Summary */}
                    <Widget title="Season Performance">
                        <div className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-400">
                                        {(weeklyPerformance.reduce((sum, w) => sum + w.points, 0) / weeklyPerformance.length).toFixed(1)}
                                    </div>
                                    <div className="text-xs text-gray-400">Avg Points/Week</div>
                                </div>
                                <div className="text-center p-3 bg-green-500/20 rounded-lg">
                                    <div className="text-2xl font-bold text-green-400">
                                        {weeklyPerformance.filter((w: any) => w.result === 'W').length}-{weeklyPerformance.filter((w: any) => w.result === 'L').length}
                                    </div>
                                    <div className="text-xs text-gray-400">Record</div>
                                </div>
                                <div className="text-center p-3 bg-purple-500/20 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-400">
                                        {Math.max(...weeklyPerformance.map((w: any) => w.points)).toFixed(1)}
                                    </div>
                                    <div className="text-xs text-gray-400">Season High</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-500/20 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-400">3rd</div>
                                    <div className="text-xs text-gray-400">League Rank</div>
                                </div>
                            </div>
                        </div>
                    </Widget>

                    {/* Position Analysis */}
                    <Widget title="Position Breakdown">
                        <div className="p-4">
                            <div className="space-y-4">
                                {positionAnalysis.map((pos) => (
                                    <div key={pos.position} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                <span className="font-bold text-blue-400">{pos.position}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-[var(--text-primary)]">{pos.topPlayer.name}</h4>
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    {pos.averagePoints.toFixed(1)} avg pts • Depth: {pos.depth}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-[var(--text-primary)]">
                                                    Consistency: {pos.consistency}/10
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {getTrendIcon(pos.trend)}
                                                    <span className="text-xs text-[var(--text-secondary)]">
                                                        {pos.trend === 'up' ? 'Trending Up' : 
                                                         pos.trend === 'down' ? 'Trending Down' : 'Stable'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Widget>
                </div>
            )}

            {/* Trends Tab */}
            {selectedTab === 'trends' && (
                <Widget title="Performance Trends">
                    <div className="p-4">
                        <div className="space-y-4">
                            <div className="mb-6">
                                <h4 className="font-medium text-[var(--text-primary)] mb-4">Weekly Performance</h4>
                                <div className="space-y-3">
                                    {weeklyPerformance.map((week) => (
                                        <div key={week.week} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                    week.result === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {week.result}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-[var(--text-primary)]">Week {week.week}</div>
                                                    <div className="text-sm text-[var(--text-secondary)]">vs {week.opponent}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right">
                                                <div className="font-bold text-[var(--text-primary)]">{week.points}</div>
                                                <div className={`text-sm ${
                                                    week.points > week.projectedPoints ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                    {week.points > week.projectedPoints ? '+' : ''}{(week.points - week.projectedPoints).toFixed(1)} vs proj
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Widget>
            )}

            {/* Projections Tab */}
            {selectedTab === 'projections' && (
                <Widget title="Rest of Season Projections">
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-blue-500/10 rounded-lg">
                                <h4 className="font-medium text-[var(--text-primary)] mb-3">Playoff Chances</h4>
                                <div className="text-3xl font-bold text-blue-400 mb-2">78%</div>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Based on current roster and schedule strength
                                </p>
                            </div>
                            
                            <div className="p-4 bg-purple-500/10 rounded-lg">
                                <h4 className="font-medium text-[var(--text-primary)] mb-3">Championship Odds</h4>
                                <div className="text-3xl font-bold text-purple-400 mb-2">12%</div>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    3rd highest in league
                                </p>
                            </div>
                            
                            <div className="p-4 bg-green-500/10 rounded-lg">
                                <h4 className="font-medium text-[var(--text-primary)] mb-3">Projected Final Record</h4>
                                <div className="text-3xl font-bold text-green-400 mb-2">10-4</div>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Should secure playoff spot
                                </p>
                            </div>
                            
                            <div className="p-4 bg-yellow-500/10 rounded-lg">
                                <h4 className="font-medium text-[var(--text-primary)] mb-3">Strength of Schedule</h4>
                                <div className="text-3xl font-bold text-yellow-400 mb-2">0.52</div>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Slightly above average difficulty
                                </p>
                            </div>
                        </div>
                    </div>
                </Widget>
            )}

            {/* Next Matchup Tab */}
            {selectedTab === 'matchup' && (
                <div className="space-y-6">
                    <Widget title="Week 5 Matchup Preview">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-6">
                                <div className="text-center flex-1">
                                    <Avatar avatar={team.avatar} className="w-16 h-16 text-2xl mx-auto mb-2 rounded-lg" />
                                    <h3 className="font-bold text-[var(--text-primary)]">{team.name}</h3>
                                    <p className="text-lg font-bold text-blue-400">{nextMatchup.projectedScore}</p>
                                </div>
                                
                                <div className="text-center px-6">
                                    <div className="text-xs text-[var(--text-secondary)] mb-1">WIN PROBABILITY</div>
                                    <div className="text-2xl font-bold text-green-400 mb-1">{nextMatchup.winProbability}%</div>
                                    <div className="text-xs text-[var(--text-secondary)]">VS</div>
                                </div>
                                
                                <div className="text-center flex-1">
                                    <Avatar avatar={nextMatchup.opponent.avatar} className="w-16 h-16 text-2xl mx-auto mb-2 rounded-lg" />
                                    <h3 className="font-bold text-[var(--text-primary)]">{nextMatchup.opponent.name}</h3>
                                    <p className="text-lg font-bold text-red-400">{nextMatchup.opponentProjected}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-[var(--text-primary)] mb-4">Key Matchups</h4>
                                <div className="space-y-3">
                                    {nextMatchup.keyMatchups.map((matchup, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <TargetIcon className="w-5 h-5 text-blue-400" />
                                                <div>
                                                    <div className="font-medium text-[var(--text-primary)]">
                                                        {matchup.myPlayer.name} vs {matchup.theirPlayer.name}
                                                    </div>
                                                    <div className="text-sm text-[var(--text-secondary)]">
                                                        {matchup.myPlayer.position} Matchup
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className={`px-3 py-1 rounded text-sm font-medium ${getAdvantageColor(matchup.advantage)}`}>
                                                {matchup.advantage === 'favor' ? 'Advantage' : 
                                                 matchup.advantage === 'against' ? 'Disadvantage' : 'Even'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Widget>
                </div>
            )}
        </div>
    );
};

export default TeamAnalyticsDashboard;
