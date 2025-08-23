/**
 * Impact Assessment Tab
 * Long-term team impact analysis with projections and trends
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { League, Team } from '../../types';
import { TradeProposal, TradeAnalysis, TeamImpactAnalysis } from './TradeAnalyzerView';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { TrendingDownIcon } from '../icons/TrendingDownIcon';
import { BarChartIcon } from '../icons/BarChartIcon';
import { CalendarIcon } from '../icons/CalendarIcon';

interface ImpactAssessmentTabProps {
    proposal: TradeProposal | null;
    analysis: TradeAnalysis | null;
    league: League;
    currentTeam: Team;
    dispatch: React.Dispatch<any>;
}

interface ImpactMetric {
    name: string;
    value: number;
    unit: string;
    description: string;
    isPositive: boolean;
}

const ImpactAssessmentTab: React.FC<ImpactAssessmentTabProps> = ({
    proposal,
    analysis,
    league,
    currentTeam,
    dispatch
}) => {
    const impactMetrics: ImpactMetric[] = React.useMemo(() => {
        if (!analysis) return [];
        
        const impact = analysis.fromTeamImpact;
        return [
            {
                name: 'Starting Lineup',
                value: impact.startingLineupChange,
                unit: 'pts/week',
                description: 'Expected change in weekly scoring',
                isPositive: impact.startingLineupChange > 0
            },
            {
                name: 'Bench Depth',
                value: impact.benchDepthChange,
                unit: 'depth score',
                description: 'Quality of backup players',
                isPositive: impact.benchDepthChange > 0
            },
            {
                name: 'Playoff Odds',
                value: impact.playoffOddsChange,
                unit: '%',
                description: 'Change in playoff probability',
                isPositive: impact.playoffOddsChange > 0
            },
            {
                name: 'Championship Odds',
                value: impact.championshipOddsChange,
                unit: '%',
                description: 'Change in championship probability',
                isPositive: impact.championshipOddsChange > 0
            }
        ];
    }, [analysis]);

    const scheduleMetrics = React.useMemo(() => {
        if (!analysis) return [];
        
        const schedule = analysis.scheduleAnalysis;
        return [
            {
                name: 'Bye Week Conflicts',
                value: schedule.byeWeekConflicts,
                description: 'Additional bye week complications'
            },
            {
                name: 'Next 4 Weeks Impact',
                value: schedule.nextFourWeeksImpact,
                description: 'Short-term scoring change'
            },
            {
                name: 'Playoff Schedule',
                value: schedule.playoffScheduleDiff,
                description: 'Strength of playoff matchups'
            }
        ];
    }, [analysis]);

    const getImpactColor = (value: number, isPositive: boolean) => {
        if (Math.abs(value) < 0.5) return 'text-gray-400';
        return isPositive ? 'text-green-400' : 'text-red-400';
    };

    const getImpactIcon = (value: number, isPositive: boolean) => {
        if (Math.abs(value) < 0.5) return null;
        return isPositive ? 
            <TrendingUpIcon className="w-5 h-5 text-green-400" /> : 
            <TrendingDownIcon className="w-5 h-5 text-red-400" />;
    };

    if (!proposal || !analysis) {
        return (
            <div className="text-center py-12 text-[var(--text-secondary)]">
                <BarChartIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Trade to Analyze</h3>
                <p>Build a trade proposal to see detailed impact assessment</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Impact Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Widget title="Your Team Impact" className="bg-[var(--panel-bg)]">
                    <div className="p-4">
                        <div className="text-center mb-4">
                            <div className={`text-3xl font-bold mb-2 ${
                                analysis.fromTeamImpact.overallChange > 0 ? 'text-green-400' : 
                                analysis.fromTeamImpact.overallChange < 0 ? 'text-red-400' : 
                                'text-gray-400'
                            }`}>
                                {analysis.fromTeamImpact.overallChange > 0 ? '+' : ''}
                                {analysis.fromTeamImpact.overallChange.toFixed(1)}
                            </div>
                            <div className="text-sm text-[var(--text-secondary)]">Overall Team Change</div>
                        </div>
                        
                        <div className="space-y-3">
                            {impactMetrics.map((metric, index) => (
                                <motion.div
                                    key={metric.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        {getImpactIcon(metric.value, metric.isPositive)}
                                        <div>
                                            <div className="font-medium text-[var(--text-primary)]">
                                                {metric.name}
                                            </div>
                                            <div className="text-xs text-[var(--text-secondary)]">
                                                {metric.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-lg font-bold ${getImpactColor(metric.value, metric.isPositive)}`}>
                                        {metric.value > 0 ? '+' : ''}{metric.value.toFixed(1)}{metric.unit}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </Widget>

                <Widget title="Trade Partner Impact" className="bg-[var(--panel-bg)]">
                    <div className="p-4">
                        <div className="text-center mb-4">
                            <div className={`text-3xl font-bold mb-2 ${
                                analysis.toTeamImpact.overallChange > 0 ? 'text-green-400' : 
                                analysis.toTeamImpact.overallChange < 0 ? 'text-red-400' : 
                                'text-gray-400'
                            }`}>
                                {analysis.toTeamImpact.overallChange > 0 ? '+' : ''}
                                {analysis.toTeamImpact.overallChange.toFixed(1)}
                            </div>
                            <div className="text-sm text-[var(--text-secondary)]">Their Team Change</div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {analysis.toTeamImpact.startingLineupChange > 0 ? 
                                        <TrendingUpIcon className="w-5 h-5 text-green-400" /> : 
                                        <TrendingDownIcon className="w-5 h-5 text-red-400" />
                                    }
                                    <div>
                                        <div className="font-medium text-[var(--text-primary)]">Starting Lineup</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Weekly scoring change</div>
                                    </div>
                                </div>
                                <div className={`text-lg font-bold ${
                                    analysis.toTeamImpact.startingLineupChange > 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {analysis.toTeamImpact.startingLineupChange > 0 ? '+' : ''}
                                    {analysis.toTeamImpact.startingLineupChange.toFixed(1)}pts
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {analysis.toTeamImpact.playoffOddsChange > 0 ? 
                                        <TrendingUpIcon className="w-5 h-5 text-green-400" /> : 
                                        <TrendingDownIcon className="w-5 h-5 text-red-400" />
                                    }
                                    <div>
                                        <div className="font-medium text-[var(--text-primary)]">Playoff Odds</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Playoff probability change</div>
                                    </div>
                                </div>
                                <div className={`text-lg font-bold ${
                                    analysis.toTeamImpact.playoffOddsChange > 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {analysis.toTeamImpact.playoffOddsChange > 0 ? '+' : ''}
                                    {analysis.toTeamImpact.playoffOddsChange.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </Widget>
            </div>

            {/* Schedule Analysis */}
            <Widget title="Schedule Impact" icon={<CalendarIcon className="w-5 h-5" />} className="bg-[var(--panel-bg)]">
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {scheduleMetrics.map((metric, index) => (
                            <motion.div
                                key={metric.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center p-4 bg-white/5 rounded-lg"
                            >
                                <div className="text-xl font-bold text-[var(--text-primary)] mb-1">
                                    {metric.value > 0 ? '+' : ''}{metric.value}
                                </div>
                                <div className="font-medium text-[var(--text-primary)] text-sm mb-1">
                                    {metric.name}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)]">
                                    {metric.description}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">Rest of Season Outlook</h4>
                        <p className="text-[var(--text-secondary)]">{analysis.scheduleAnalysis.restOfSeasonOutlook}</p>
                    </div>
                </div>
            </Widget>

            {/* Risk Assessment */}
            <Widget title="Risk Analysis" className="bg-[var(--panel-bg)]">
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-[var(--text-primary)] mb-4">Risk Breakdown</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-[var(--text-primary)]">Injury Risk</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-gray-600/20 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-red-400 transition-all duration-1000"
                                                style={{ width: `${analysis.riskAssessment?.injuryRisk}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-[var(--text-secondary)]">
                                            {analysis.riskAssessment?.injuryRisk}%
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-[var(--text-primary)]">Performance Risk</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-gray-600/20 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-yellow-400 transition-all duration-1000"
                                                style={{ width: `${analysis.riskAssessment.performanceVolatility}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-[var(--text-secondary)]">
                                            {analysis.riskAssessment.performanceVolatility}%
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-[var(--text-primary)]">Age Risk</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-gray-600/20 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-orange-400 transition-all duration-1000"
                                                style={{ width: `${analysis.riskAssessment?.ageRisk}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-[var(--text-secondary)]">
                                            {analysis.riskAssessment?.ageRisk}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-medium text-[var(--text-primary)] mb-4">Risk Factors</h4>
                            <div className="space-y-2">
                                {analysis.riskAssessment.riskFactors.map((factor, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                        <div className={`w-2 h-2 rounded-full ${
                                            analysis.riskAssessment.overallRisk === 'high' ? 'bg-red-400' :
                                            analysis.riskAssessment.overallRisk === 'medium' ? 'bg-yellow-400' :
                                            'bg-green-400'
                                        }`} />
                                        <span className="text-[var(--text-primary)]">{factor}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-[var(--text-primary)]">Overall Risk</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        analysis.riskAssessment.overallRisk === 'low' ? 'bg-green-500/20 text-green-400' :
                                        analysis.riskAssessment.overallRisk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                        {analysis.riskAssessment.overallRisk.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Widget>

            {/* Long-term Projections */}
            <Widget title="Long-term Projections" className="bg-[var(--panel-bg)]">
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white/5 rounded-lg">
                            <div className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                                Week {league.currentWeek + 4}
                            </div>
                            <div className="text-sm text-[var(--text-secondary)] mb-2">Next Month</div>
                            <div className={`text-lg font-medium ${
                                analysis.scheduleAnalysis.nextFourWeeksImpact > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {analysis.scheduleAnalysis.nextFourWeeksImpact > 0 ? '+' : ''}
                                {analysis.scheduleAnalysis.nextFourWeeksImpact.toFixed(1)} pts/week
                            </div>
                        </div>
                        
                        <div className="text-center p-4 bg-white/5 rounded-lg">
                            <div className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                                Playoffs
                            </div>
                            <div className="text-sm text-[var(--text-secondary)] mb-2">Weeks 15-17</div>
                            <div className={`text-lg font-medium ${
                                analysis.scheduleAnalysis.playoffScheduleDiff > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {analysis.scheduleAnalysis.playoffScheduleDiff > 0 ? '+' : ''}
                                {analysis.scheduleAnalysis.playoffScheduleDiff.toFixed(1)} matchup rating
                            </div>
                        </div>
                        
                        <div className="text-center p-4 bg-white/5 rounded-lg">
                            <div className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                                2025
                            </div>
                            <div className="text-sm text-[var(--text-secondary)] mb-2">Next Season</div>
                            <div className={`text-lg font-medium ${
                                analysis.seasonEndValueDiff > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {analysis.seasonEndValueDiff > 0 ? '+' : ''}
                                ${Math.abs(analysis.seasonEndValueDiff)} value
                            </div>
                        </div>
                    </div>
                </div>
            </Widget>
        </div>
    );
};

export default ImpactAssessmentTab;
