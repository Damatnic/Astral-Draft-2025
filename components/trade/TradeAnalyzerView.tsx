/**
 * Advanced Trade Analyzer View
 * Sophisticated trade analysis tool with fairness evaluation, impact assessment, and automated suggestions
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Avatar } from '../ui/Avatar';
import { Player, League, Team } from '../../types';
import { ArrowRightLeftIcon } from '../icons/ArrowRightLeftIcon';
import { BarChartIcon } from '../icons/BarChartIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { TrendingDownIcon } from '../icons/TrendingDownIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { SearchIcon } from '../icons/SearchIcon';
import TradeBuilderTab from './TradeBuilderTab';
import FairnessAnalysisTab from './FairnessAnalysisTab';
import ImpactAssessmentTab from './ImpactAssessmentTab';
import AutomatedSuggestionsTab from './AutomatedSuggestionsTab';

interface TradeAnalyzerViewProps {
    league: League;
    currentTeam: Team;
    dispatch: React.Dispatch<any>;
}

export interface TradeProposal {
    id: string;
    fromTeam: Team;
    toTeam: Team;
    fromPlayers: Player[];
    toPlayers: Player[];
    fromDraftPicks?: DraftPick[];
    toDraftPicks?: DraftPick[];
    status: 'draft' | 'pending' | 'accepted' | 'rejected' | 'countered';
    createdAt: Date;
    message?: string;
}

export interface DraftPick {
    season: number;
    round: number;
    originalTeamId: string;
    estimatedValue: number;
    description: string;
}

export interface TradeAnalysis {
    overallGrade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
    fairnessScore: number; // 0-100, 50 is perfectly fair
    recommendation: 'strong_accept' | 'accept' | 'consider' | 'reject' | 'strong_reject';
    confidence: number; // 0-100
    
    // Value Analysis
    currentValueDiff: number;
    projectedValueDiff: number;
    seasonEndValueDiff: number;
    
    // Team Impact
    fromTeamImpact: TeamImpactAnalysis;
    toTeamImpact: TeamImpactAnalysis;
    
    // Advanced Metrics
    positionalAnalysis: PositionalAnalysis[];
    riskAssessment: RiskAssessment;
    scheduleAnalysis: ScheduleAnalysis;
    
    // Suggestions
    improvementSuggestions: ImprovementSuggestion[];
    alternativeOffers: AlternativeOffer[];
    
    // Reasoning
    strengths: string[];
    weaknesses: string[];
    warnings: string[];
}

export interface TeamImpactAnalysis {
    teamId: string;
    teamName: string;
    overallChange: number; // -100 to +100
    positionChanges: { [position: string]: number };
    startingLineupChange: number;
    benchDepthChange: number;
    weeklyProjectionChange: number;
    playoffOddsChange: number;
    championshipOddsChange: number;
}

export interface PositionalAnalysis {
    position: string;
    scarcityScore: number;
    marketValue: number;
    futureOutlook: 'bullish' | 'neutral' | 'bearish';
    replacementLevel: number;
    tradeImpact: number;
}

export interface RiskAssessment {
    overallRisk: 'low' | 'medium' | 'high';
    injuryRisk: number;
    performanceVolatility: number;
    ageRisk: number;
    situationalRisk: number;
    riskFactors: string[];
}

export interface ScheduleAnalysis {
    byeWeekConflicts: number;
    strengthOfSchedule: number;
    playoffScheduleDiff: number;
    nextFourWeeksImpact: number;
    restOfSeasonOutlook: string;
}

export interface ImprovementSuggestion {
    type: 'add_player' | 'remove_player' | 'add_pick' | 'adjust_terms';
    description: string;
    impact: number;
    confidence: number;
    suggestion: string;
}

export interface AlternativeOffer {
    id: string;
    description: string;
    fromPlayers: Player[];
    toPlayers: Player[];
    expectedImprovement: number;
    reasoning: string;
}

const TradeAnalyzerView: React.FC<TradeAnalyzerViewProps> = ({ league, currentTeam, dispatch }) => {
    const [selectedTab, setSelectedTab] = React.useState<'builder' | 'fairness' | 'impact' | 'suggestions'>('builder');
    const [currentProposal, setCurrentProposal] = React.useState<TradeProposal | null>(null);
    const [analysis, setAnalysis] = React.useState<TradeAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);

    const tabs = [
        {
            id: 'builder',
            label: 'Trade Builder',
            icon: <ArrowRightLeftIcon className="w-4 h-4" />,
            description: 'Build and configure trade proposals'
        },
        {
            id: 'fairness',
            label: 'Fairness Analysis',
            icon: <BarChartIcon className="w-4 h-4" />,
            description: 'Evaluate trade fairness and value'
        },
        {
            id: 'impact',
            label: 'Impact Assessment',
            icon: <TrendingUpIcon className="w-4 h-4" />,
            description: 'Analyze long-term team impact'
        },
        {
            id: 'suggestions',
            label: 'Smart Suggestions',
            icon: <SearchIcon className="w-4 h-4" />,
            description: 'AI-powered trade recommendations'
        }
    ];

    const analyzeTradeProposal = React.useCallback(async (proposal: TradeProposal) => {
        if (!proposal.fromPlayers.length && !proposal.toPlayers.length) return;
        
        setIsAnalyzing(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock comprehensive analysis - in real app this would call the trade analysis service
        const mockAnalysis: TradeAnalysis = generateMockAnalysis(proposal, currentTeam, league);
        
        setAnalysis(mockAnalysis);
        setIsAnalyzing(false);
    }, [currentTeam, league]);

    React.useEffect(() => {
        if (currentProposal) {
            analyzeTradeProposal(currentProposal);
        } else {
            setAnalysis(null);
        }
    }, [currentProposal, analyzeTradeProposal]);

    const handleProposalUpdate = (proposal: TradeProposal) => {
        setCurrentProposal(proposal);
    };

    const getGradeColor = (grade: string) => {
        if (grade.startsWith('A')) return 'text-green-400';
        if (grade.startsWith('B')) return 'text-blue-400';
        if (grade.startsWith('C')) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getRecommendationColor = (recommendation: string) => {
        if (recommendation.includes('accept')) return 'text-green-400';
        if (recommendation === 'consider') return 'text-yellow-400';
        return 'text-red-400';
    };

    const getRecommendationIcon = (recommendation: string) => {
        if (recommendation.includes('accept')) return <CheckIcon className="w-5 h-5 text-green-400" />;
        if (recommendation === 'consider') return <AlertTriangleIcon className="w-5 h-5 text-yellow-400" />;
        return <TrendingDownIcon className="w-5 h-5 text-red-400" />;
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-[var(--panel-border)]">
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                                Trade Analyzer
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Advanced trade evaluation with fairness analysis and impact assessment
                            </p>
                        </div>
                        
                        {analysis && (
                            <div className="flex items-center gap-4">
                                <div className="text-center p-3 bg-white/10 rounded-lg">
                                    <div className={`text-2xl font-bold ${getGradeColor(analysis.overallGrade)}`}>
                                        {analysis.overallGrade}
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">Overall Grade</div>
                                </div>
                                
                                <div className="text-center p-3 bg-white/10 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {getRecommendationIcon(analysis.recommendation)}
                                        <span className={`font-bold ${getRecommendationColor(analysis.recommendation)}`}>
                                            {analysis.recommendation.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">Recommendation</div>
                                </div>
                                
                                <div className="text-center p-3 bg-white/10 rounded-lg">
                                    <div className="text-lg font-bold text-[var(--text-primary)]">
                                        {analysis.fairnessScore}/100
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">Fairness Score</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-[var(--panel-border)] bg-[var(--panel-bg)]">
                <div className="flex overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as any)}
                            className={`flex items-center gap-3 px-6 py-4 font-medium transition-colors relative whitespace-nowrap min-w-fit ${
                                selectedTab === tab.id
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                            }`}
                        >
                            {tab.icon}
                            <div className="text-left">
                                <div>{tab.label}</div>
                                <div className="text-xs opacity-70">{tab.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading Overlay */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-8 text-center"
                        >
                            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Analyzing Trade</h3>
                            <p className="text-[var(--text-secondary)]">
                                Evaluating fairness, impact, and generating recommendations...
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tab Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {selectedTab === 'builder' && (
                            <TradeBuilderTab
                                league={league}
                                currentTeam={currentTeam}
                                proposal={currentProposal}
                                onProposalUpdate={handleProposalUpdate}
                                dispatch={dispatch}
                            />
                        )}
                        
                        {selectedTab === 'fairness' && (
                            <FairnessAnalysisTab
                                proposal={currentProposal}
                                analysis={analysis}
                                league={league}
                                dispatch={dispatch}
                            />
                        )}
                        
                        {selectedTab === 'impact' && (
                            <ImpactAssessmentTab
                                proposal={currentProposal}
                                analysis={analysis}
                                league={league}
                                currentTeam={currentTeam}
                                dispatch={dispatch}
                            />
                        )}
                        
                        {selectedTab === 'suggestions' && (
                            <AutomatedSuggestionsTab
                                proposal={currentProposal}
                                analysis={analysis}
                                league={league}
                                currentTeam={currentTeam}
                                onProposalUpdate={handleProposalUpdate}
                                dispatch={dispatch}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// Mock analysis generator for demonstration
const generateMockAnalysis = (proposal: TradeProposal, currentTeam: Team, league: League): TradeAnalysis => {
    const fromValue = proposal.fromPlayers.reduce((sum, p) => sum + p.auctionValue, 0);
    const toValue = proposal.toPlayers.reduce((sum, p) => sum + p.auctionValue, 0);
    const valueDiff = toValue - fromValue;
    
    return {
        overallGrade: valueDiff > 10 ? 'A-' : valueDiff > 0 ? 'B+' : valueDiff > -5 ? 'B' : 'C+',
        fairnessScore: Math.max(20, Math.min(80, 50 + (valueDiff * 2))),
        recommendation: valueDiff > 8 ? 'accept' : valueDiff > -3 ? 'consider' : 'reject',
        confidence: 85,
        currentValueDiff: valueDiff,
        projectedValueDiff: valueDiff * 1.2,
        seasonEndValueDiff: valueDiff * 0.8,
        fromTeamImpact: {
            teamId: currentTeam.id.toString(),
            teamName: currentTeam.name,
            overallChange: -valueDiff * 0.5,
            positionChanges: {},
            startingLineupChange: valueDiff > 0 ? 2.5 : -1.2,
            benchDepthChange: 1.1,
            weeklyProjectionChange: valueDiff * 0.3,
            playoffOddsChange: valueDiff > 0 ? 5 : -2,
            championshipOddsChange: valueDiff > 0 ? 2 : -1
        },
        toTeamImpact: {
            teamId: proposal.toTeam.id.toString(),
            teamName: proposal.toTeam.name,
            overallChange: valueDiff * 0.5,
            positionChanges: {},
            startingLineupChange: valueDiff > 0 ? -2.5 : 1.2,
            benchDepthChange: -1.1,
            weeklyProjectionChange: -valueDiff * 0.3,
            playoffOddsChange: valueDiff > 0 ? -5 : 2,
            championshipOddsChange: valueDiff > 0 ? -2 : 1
        },
        positionalAnalysis: [],
        riskAssessment: {
            overallRisk: 'medium',
            injuryRisk: 15,
            performanceVolatility: 20,
            ageRisk: 10,
            situationalRisk: 12,
            riskFactors: ['Player age concerns', 'Position depth']
        },
        scheduleAnalysis: {
            byeWeekConflicts: 1,
            strengthOfSchedule: 0.52,
            playoffScheduleDiff: 2.1,
            nextFourWeeksImpact: 1.5,
            restOfSeasonOutlook: 'Favorable matchups ahead'
        },
        improvementSuggestions: [],
        alternativeOffers: [],
        strengths: [
            'Improves starting lineup strength',
            'Good value trade based on ADP',
            'Addresses positional need'
        ],
        weaknesses: [
            'Reduces bench depth',
            'Age concerns with acquired players'
        ],
        warnings: [
            'Consider bye week conflicts',
            'Monitor injury risk'
        ]
    };
};

export default TradeAnalyzerView;
