/**
 * Fairness Analysis Tab
 * Sophisticated fairness evaluation with detailed metrics and visualizations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Player, League } from '../../types';
import { TradeProposal, TradeAnalysis } from './TradeAnalyzerView';
import { BarChartIcon } from '../icons/BarChartIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { TrendingDownIcon } from '../icons/TrendingDownIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

interface FairnessAnalysisTabProps {
    proposal: TradeProposal | null;
    analysis: TradeAnalysis | null;
    league: League;
    dispatch: React.Dispatch<any>;
}

interface ValueMetric {
    name: string;
    yourValue: number;
    theirValue: number;
    difference: number;
    unit: string;
    description: string;
}

const FairnessAnalysisTab: React.FC<FairnessAnalysisTabProps> = ({
    proposal,
    analysis,
    league,
    dispatch
}) => {
    const valueMetrics: ValueMetric[] = React.useMemo(() => {
        if (!analysis) return [];
        
        return [
            {
                name: 'Current Value',
                yourValue: proposal?.fromPlayers.reduce((sum, p) => sum + p.auctionValue, 0) || 0,
                theirValue: proposal?.toPlayers.reduce((sum, p) => sum + p.auctionValue, 0) || 0,
                difference: analysis.currentValueDiff,
                unit: '$',
                description: 'Auction draft value of players'
            },
            {
                name: 'Projected Points',
                yourValue: proposal?.fromPlayers.reduce((sum, p) => sum + p.stats.projection, 0) || 0,
                theirValue: proposal?.toPlayers.reduce((sum, p) => sum + p.stats.projection, 0) || 0,
                difference: analysis.projectedValueDiff,
                unit: 'pts',
                description: 'Rest of season projected points'
            },
            {
                name: 'Season End Value',
                yourValue: (proposal?.fromPlayers.reduce((sum, p) => sum + p.auctionValue, 0) || 0) * 0.9,
                theirValue: (proposal?.toPlayers.reduce((sum, p) => sum + p.auctionValue, 0) || 0) * 0.9,
                difference: analysis.seasonEndValueDiff,
                unit: '$',
                description: 'Estimated keeper/dynasty value'
            }
        ];
    }, [proposal, analysis]);

    const getFairnessLevel = (score: number) => {
        if (score >= 80) return { level: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/20' };
        if (score >= 60) return { level: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20' };
        if (score >= 40) return { level: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
        if (score >= 20) return { level: 'Poor', color: 'text-orange-400', bg: 'bg-orange-500/20' };
        return { level: 'Very Poor', color: 'text-red-400', bg: 'bg-red-500/20' };
    };

    const getValueDifferenceColor = (diff: number) => {
        if (Math.abs(diff) <= 5) return 'text-green-400';
        if (Math.abs(diff) <= 15) return 'text-yellow-400';
        return 'text-red-400';
    };

    if (!proposal || !analysis) {
        return (
            <div className="text-center py-12 text-[var(--text-secondary)]">
                <BarChartIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Trade to Analyze</h3>
                <p>Build a trade proposal to see detailed fairness analysis</p>
            </div>
        );
    }

    const fairnessData = getFairnessLevel(analysis.fairnessScore);

    return (
        <div className="space-y-6">
            {/* Fairness Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Widget title="Fairness Score" className="bg-[var(--panel-bg)]">
                    <div className="p-4 text-center">
                        <div className="relative mb-4">
                            <div className="w-24 h-24 mx-auto relative">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        className="text-gray-600/20"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        strokeDasharray={`${(analysis.fairnessScore / 100) * 283} 283`}
                                        strokeLinecap="round"
                                        className={fairnessData.color}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-[var(--text-primary)]">
                                        {analysis.fairnessScore}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className={`text-sm font-medium ${fairnessData.color} mb-1`}>
                            {fairnessData.level}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                            50 is perfectly fair
                        </div>
                    </div>
                </Widget>

                <Widget title="Recommendation" className="bg-[var(--panel-bg)]">
                    <div className="p-4 text-center">
                        <div className="mb-3">
                            {analysis.recommendation.includes('accept') ? (
                                <CheckIcon className="w-12 h-12 mx-auto text-green-400" />
                            ) : analysis.recommendation === 'consider' ? (
                                <AlertTriangleIcon className="w-12 h-12 mx-auto text-yellow-400" />
                            ) : (
                                <TrendingDownIcon className="w-12 h-12 mx-auto text-red-400" />
                            )}
                        </div>
                        <div className="font-bold text-lg text-[var(--text-primary)] mb-1">
                            {analysis.recommendation.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mb-2">
                            Confidence: {analysis.confidence}%
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                            Based on value analysis
                        </div>
                    </div>
                </Widget>

                <Widget title="Trade Grade" className="bg-[var(--panel-bg)]">
                    <div className="p-4 text-center">
                        <div className="text-4xl font-bold mb-2">
                            <span className={`${
                                analysis.overallGrade.startsWith('A') ? 'text-green-400' :
                                analysis.overallGrade.startsWith('B') ? 'text-blue-400' :
                                analysis.overallGrade.startsWith('C') ? 'text-yellow-400' :
                                'text-red-400'
                            }`}>
                                {analysis.overallGrade}
                            </span>
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mb-2">
                            Overall Grade
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                            Considering all factors
                        </div>
                    </div>
                </Widget>
            </div>

            {/* Value Comparison */}
            <Widget title="Value Analysis" icon={<BarChartIcon className="w-5 h-5" />} className="bg-[var(--panel-bg)]">
                <div className="p-4 space-y-4">
                    {valueMetrics.map((metric, index) => (
                        <motion.div
                            key={metric.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white/5 rounded-lg p-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="font-medium text-[var(--text-primary)]">{metric.name}</h4>
                                    <p className="text-xs text-[var(--text-secondary)]">{metric.description}</p>
                                </div>
                                <div className={`text-lg font-bold ${getValueDifferenceColor(metric.difference)}`}>
                                    {metric.difference > 0 ? '+' : ''}{metric.difference}{metric.unit}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                                    <div className="text-lg font-bold text-blue-400">
                                        {metric.yourValue}{metric.unit}
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">You Give</div>
                                </div>
                                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                                    <div className="text-lg font-bold text-green-400">
                                        {metric.theirValue}{metric.unit}
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">You Get</div>
                                </div>
                            </div>
                            
                            {/* Progress bar showing relative values */}
                            <div className="relative h-2 bg-gray-600/20 rounded-full overflow-hidden">
                                <div 
                                    className="absolute left-0 top-0 h-full bg-blue-400 transition-all duration-1000"
                                    style={{ width: `${(metric.yourValue / (metric.yourValue + metric.theirValue)) * 100}%` }}
                                />
                                <div 
                                    className="absolute right-0 top-0 h-full bg-green-400 transition-all duration-1000"
                                    style={{ width: `${(metric.theirValue / (metric.yourValue + metric.theirValue)) * 100}%` }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Widget>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Widget title="Trade Strengths" className="bg-[var(--panel-bg)]">
                    <div className="p-4">
                        {analysis.strengths.length > 0 ? (
                            <div className="space-y-3">
                                {analysis.strengths.map((strength, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg"
                                    >
                                        <CheckIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-[var(--text-primary)]">{strength}</span>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-[var(--text-secondary)]">
                                No significant strengths identified
                            </div>
                        )}
                    </div>
                </Widget>

                {/* Weaknesses */}
                <Widget title="Trade Concerns" className="bg-[var(--panel-bg)]">
                    <div className="p-4">
                        {analysis.weaknesses.length > 0 ? (
                            <div className="space-y-3">
                                {analysis.weaknesses.map((weakness, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg"
                                    >
                                        <AlertTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-[var(--text-primary)]">{weakness}</span>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-[var(--text-secondary)]">
                                No significant concerns identified
                            </div>
                        )}
                    </div>
                </Widget>
            </div>

            {/* Warnings */}
            {analysis.warnings.length > 0 && (
                <Widget title="Important Warnings" className="bg-[var(--panel-bg)]">
                    <div className="p-4">
                        <div className="space-y-3">
                            {analysis.warnings.map((warning, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                                >
                                    <AlertTriangleIcon className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium text-yellow-400 mb-1">Warning</div>
                                        <span className="text-[var(--text-primary)]">{warning}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </Widget>
            )}

            {/* Fairness Factors */}
            <Widget title="Fairness Factors" className="bg-[var(--panel-bg)]">
                <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                            <div className="text-lg font-bold text-[var(--text-primary)] mb-1">
                                {Math.round((50 + analysis.currentValueDiff) * 2)}%
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">Value Balance</div>
                        </div>
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                            <div className="text-lg font-bold text-[var(--text-primary)] mb-1">
                                {analysis.riskAssessment.overallRisk === 'low' ? '85%' : 
                                 analysis.riskAssessment.overallRisk === 'medium' ? '65%' : '45%'}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">Risk Score</div>
                        </div>
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                            <div className="text-lg font-bold text-[var(--text-primary)] mb-1">
                                {Math.round(analysis.confidence)}%
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">Confidence</div>
                        </div>
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                            <div className="text-lg font-bold text-[var(--text-primary)] mb-1">
                                {proposal.fromPlayers.length + proposal.toPlayers.length}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">Players</div>
                        </div>
                    </div>
                </div>
            </Widget>
        </div>
    );
};

export default FairnessAnalysisTab;
