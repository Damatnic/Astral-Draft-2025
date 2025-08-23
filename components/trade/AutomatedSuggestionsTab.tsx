/**
 * Automated Suggestions Tab
 * AI-powered trade recommendations and alternative offers
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Avatar } from '../ui/Avatar';
import { League, Team, Player } from '../../types';
import { TradeProposal, TradeAnalysis, ImprovementSuggestion, AlternativeOffer } from './TradeAnalyzerView';
import { SearchIcon } from '../icons/SearchIcon';
import { ArrowRightLeftIcon } from '../icons/ArrowRightLeftIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';
import { CheckIcon } from '../icons/CheckIcon';

interface AutomatedSuggestionsTabProps {
    proposal: TradeProposal | null;
    analysis: TradeAnalysis | null;
    league: League;
    currentTeam: Team;
    onProposalUpdate: (proposal: TradeProposal) => void;
    dispatch: React.Dispatch<any>;
}

interface SmartSuggestion {
    id: string;
    type: 'balance' | 'upgrade' | 'need' | 'value';
    title: string;
    description: string;
    confidence: number;
    impact: number;
    players?: Player[];
    reasoning: string;
}

const AutomatedSuggestionsTab: React.FC<AutomatedSuggestionsTabProps> = ({
    proposal,
    analysis,
    league,
    currentTeam,
    onProposalUpdate,
    dispatch
}) => {
    const [selectedSuggestion, setSelectedSuggestion] = React.useState<SmartSuggestion | null>(null);
    const [showAlternatives, setShowAlternatives] = React.useState(false);

    // Generate smart suggestions based on analysis
    const smartSuggestions: SmartSuggestion[] = React.useMemo(() => {
        if (!proposal || !analysis) return [];

        const suggestions: SmartSuggestion[] = [];

        // Balance suggestions
        if (Math.abs(analysis.currentValueDiff) > 10) {
            suggestions.push({
                id: 'balance-value',
                type: 'balance',
                title: 'Balance Trade Value',
                description: `Add a ${analysis.currentValueDiff > 0 ? 'lower' : 'higher'} value player to balance the trade`,
                confidence: 85,
                impact: Math.abs(analysis.currentValueDiff) * 0.5,
                reasoning: `Current value difference of $${Math.abs(analysis.currentValueDiff)} creates unfair trade`
            });
        }

        // Position need suggestions
        if (proposal.fromPlayers.some((p: any) => p.position === 'RB')) {
            suggestions.push({
                id: 'rb-depth',
                type: 'need',
                title: 'Address RB Depth',
                description: 'Consider adding RB depth to maintain roster balance',
                confidence: 70,
                impact: 15,
                reasoning: 'Trading away RB creates potential depth issues'
            });
        }

        // Upgrade suggestions
        suggestions.push({
            id: 'upgrade-wr',
            type: 'upgrade',
            title: 'Target Elite WR',
            description: 'Package players for a top-tier WR upgrade',
            confidence: 75,
            impact: 20,
            reasoning: 'WR position offers best upgrade potential for your roster'
        });

        // Value suggestions
        if (analysis.riskAssessment.overallRisk === 'high') {
            suggestions.push({
                id: 'reduce-risk',
                type: 'value',
                title: 'Reduce Risk Profile',
                description: 'Target younger, more consistent players',
                confidence: 80,
                impact: 12,
                reasoning: 'Current trade involves high-risk players'
            });
        }

        return suggestions;
    }, [proposal, analysis]);

    // Mock alternative offers
    const alternativeOffers: AlternativeOffer[] = React.useMemo(() => {
        if (!proposal) return [];

        return [
            {
                id: 'alt-1',
                description: 'Balanced value trade with pick sweetener',
                fromPlayers: proposal.fromPlayers.slice(0, 1),
                toPlayers: proposal.toPlayers.slice(0, 1),
                expectedImprovement: 15,
                reasoning: 'Reduces complexity while maintaining core value exchange'
            },
            {
                id: 'alt-2',
                description: 'Package deal for single elite player',
                fromPlayers: proposal.fromPlayers,
                toPlayers: proposal.toPlayers.slice(0, 1),
                expectedImprovement: 22,
                reasoning: 'Consolidates depth into top-tier talent'
            },
            {
                id: 'alt-3',
                description: 'Add complementary pieces for position balance',
                fromPlayers: [...proposal.fromPlayers],
                toPlayers: [...proposal.toPlayers],
                expectedImprovement: 8,
                reasoning: 'Maintains current framework with better position balance'
            }
        ];
    }, [proposal]);

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'text-green-400';
        if (confidence >= 60) return 'text-blue-400';
        if (confidence >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getSuggestionIcon = (type: string) => {
        switch (type) {
            case 'balance': return <ArrowRightLeftIcon className="w-5 h-5" />;
            case 'upgrade': return <TrendingUpIcon className="w-5 h-5" />;
            case 'need': return <SearchIcon className="w-5 h-5" />;
            case 'value': return <CheckIcon className="w-5 h-5" />;
            default: return <BrainCircuitIcon className="w-5 h-5" />;
        }
    };

    const applySuggestion = (suggestion: SmartSuggestion) => {
        // Mock implementation - in real app would modify the proposal
        console.log('Applying suggestion:', suggestion);
        setSelectedSuggestion(suggestion);
    };

    const selectAlternativeOffer = (offer: AlternativeOffer) => {
        if (!proposal) return;
        
        const newProposal: TradeProposal = {
            ...proposal,
            id: `trade-alt-${Date.now()}`,
            fromPlayers: offer.fromPlayers,
            toPlayers: offer.toPlayers,
            status: 'draft'
        };
        
        onProposalUpdate(newProposal);
        setShowAlternatives(false);
    };

    if (!proposal || !analysis) {
        return (
            <div className="text-center py-12 text-[var(--text-secondary)]">
                <BrainCircuitIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Trade to Analyze</h3>
                <p>Build a trade proposal to get AI-powered suggestions and alternatives</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* AI Suggestions Overview */}
            <Widget title="Smart Suggestions" icon={<BrainCircuitIcon className="w-5 h-5" />} className="bg-[var(--panel-bg)]">
                <div className="p-4">
                    <div className="grid gap-4">
                        {smartSuggestions.map((suggestion, index) => (
                            <motion.div
                                key={suggestion.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/5 rounded-lg p-4 border border-[var(--panel-border)] hover:border-blue-400/50 transition-colors cursor-pointer"
                                onClick={() => applySuggestion(suggestion)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-lg ${
                                        suggestion.type === 'balance' ? 'bg-blue-500/20 text-blue-400' :
                                        suggestion.type === 'upgrade' ? 'bg-green-500/20 text-green-400' :
                                        suggestion.type === 'need' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-purple-500/20 text-purple-400'
                                    }`}>
                                        {getSuggestionIcon(suggestion.type)}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-[var(--text-primary)]">
                                                {suggestion.title}
                                            </h4>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                                    {suggestion.confidence}% confidence
                                                </span>
                                                <span className="text-sm text-[var(--text-secondary)]">
                                                    +{suggestion.impact} impact
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <p className="text-[var(--text-secondary)] mb-3">
                                            {suggestion.description}
                                        </p>
                                        
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-[var(--text-secondary)] mb-1">AI Reasoning:</div>
                                            <div className="text-sm text-[var(--text-primary)]">
                                                {suggestion.reasoning}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        
                        {smartSuggestions.length === 0 && (
                            <div className="text-center py-8 text-[var(--text-secondary)]">
                                <BrainCircuitIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>AI is analyzing your trade for optimization opportunities...</p>
                            </div>
                        )}
                    </div>
                </div>
            </Widget>

            {/* Improvement Suggestions */}
            {analysis.improvementSuggestions.length > 0 && (
                <Widget title="Trade Improvements" className="bg-[var(--panel-bg)]">
                    <div className="p-4">
                        <div className="space-y-3">
                            {analysis.improvementSuggestions.map((improvement, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                                >
                                    <TrendingUpIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-medium text-[var(--text-primary)]">
                                                {improvement.description}
                                            </div>
                                            <div className="text-sm text-green-400 font-medium">
                                                +{improvement.impact}% improvement
                                            </div>
                                        </div>
                                        <div className="text-sm text-[var(--text-secondary)]">
                                            {improvement.suggestion}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </Widget>
            )}

            {/* Alternative Offers */}
            <Widget title="Alternative Trade Structures" className="bg-[var(--panel-bg)]">
                <div className="p-4">
                    <div className="mb-4">
                        <button
                            onClick={() => setShowAlternatives(!showAlternatives)}
                            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                            {showAlternatives ? 'Hide' : 'Show'} Alternative Structures
                        </button>
                    </div>
                    
                    <AnimatePresence>
                        {showAlternatives && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4"
                            >
                                {alternativeOffers.map((offer, index) => (
                                    <motion.div
                                        key={offer.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white/5 rounded-lg p-4 border border-[var(--panel-border)] hover:border-green-400/50 transition-colors cursor-pointer"
                                        onClick={() => selectAlternativeOffer(offer)}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-[var(--text-primary)]">
                                                {offer.description}
                                            </h4>
                                            <div className="text-green-400 font-medium">
                                                +{offer.expectedImprovement}% better
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <div className="text-sm text-[var(--text-secondary)] mb-2">You Trade:</div>
                                                <div className="space-y-1">
                                                    {offer.fromPlayers.map((player) => (
                                                        <div key={player.id} className="flex items-center gap-2 text-sm">
                                                            <Avatar avatar="🏈" className="w-6 h-6 rounded-full" />
                                                            <span className="text-[var(--text-primary)]">
                                                                {player.name}
                                                            </span>
                                                            <span className="text-[var(--text-secondary)]">
                                                                ({player.position})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <div className="text-sm text-[var(--text-secondary)] mb-2">You Receive:</div>
                                                <div className="space-y-1">
                                                    {offer.toPlayers.map((player) => (
                                                        <div key={player.id} className="flex items-center gap-2 text-sm">
                                                            <Avatar avatar="🏈" className="w-6 h-6 rounded-full" />
                                                            <span className="text-[var(--text-primary)]">
                                                                {player.name}
                                                            </span>
                                                            <span className="text-[var(--text-secondary)]">
                                                                ({player.position})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-[var(--text-secondary)] mb-1">Why this works:</div>
                                            <div className="text-sm text-[var(--text-primary)]">
                                                {offer.reasoning}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Widget>

            {/* AI Analysis Summary */}
            <Widget title="AI Trade Analysis" className="bg-[var(--panel-bg)]">
                <div className="p-4">
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/30">
                        <div className="flex items-start gap-3">
                            <BrainCircuitIcon className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-blue-400 mb-2">AI Recommendation Summary</h4>
                                <div className="text-[var(--text-primary)] mb-3">
                                    Based on comprehensive analysis of {proposal.fromPlayers.length + proposal.toPlayers.length} players, 
                                    market values, team needs, and risk factors, this trade shows{' '}
                                    <span className={analysis.fairnessScore >= 60 ? 'text-green-400' : 'text-yellow-400'}>
                                        {analysis.fairnessScore >= 80 ? 'excellent' : 
                                         analysis.fairnessScore >= 60 ? 'good' : 'moderate'} fairness
                                    </span>{' '}
                                    with {analysis.confidence}% confidence.
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div className="text-center p-2 bg-white/10 rounded">
                                        <div className="font-bold text-[var(--text-primary)]">{smartSuggestions.length}</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Suggestions</div>
                                    </div>
                                    <div className="text-center p-2 bg-white/10 rounded">
                                        <div className="font-bold text-[var(--text-primary)]">{alternativeOffers.length}</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Alternatives</div>
                                    </div>
                                    <div className="text-center p-2 bg-white/10 rounded">
                                        <div className={`font-bold ${analysis.riskAssessment.overallRisk === 'low' ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {analysis.riskAssessment.overallRisk.toUpperCase()}
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)]">Risk Level</div>
                                    </div>
                                    <div className="text-center p-2 bg-white/10 rounded">
                                        <div className="font-bold text-[var(--text-primary)]">
                                            {Math.abs(analysis.currentValueDiff)} pts
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)]">Value Gap</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Widget>
        </div>
    );
};

export default AutomatedSuggestionsTab;
