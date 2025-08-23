/**
 * Enhanced AI Draft Coach Hook
 * Integrates real-time strategy adjustments, opponent modeling, and market analysis
 */

import React from 'react';
import { Player, Team, League } from '../types';
import EnhancedDraftSimulationEngine, { 
    PickRecommendation, 
    OpponentBehaviorModel,
    DraftContext as SimulationDraftContext 
} from '../services/enhancedDraftSimulationEngine';
import MarketInefficiencyDetector, { MarketInefficiency } from '../services/marketInefficiencyDetector';
import RealTimeStrategyAdjustmentService, { 
    DraftStrategy, 
    StrategyRecommendation, 
    StrategyAdjustment,
    DraftContext 
} from '../services/realTimeStrategyAdjustmentService';

export interface AiCoachState {
    isActive: boolean;
    confidence: number;
    currentStrategy: DraftStrategy | null;
    recommendations: StrategyRecommendation[];
    opponentModels: OpponentBehaviorModel[];
    marketInefficiencies: MarketInefficiency[];
    pickPredictions: Map<number, PickRecommendation>;
    strategyAdjustments: StrategyAdjustment[];
    analysisMetrics: AnalysisMetrics;
}

export interface AnalysisMetrics {
    predictionAccuracy: number;
    strategicAlignment: number;
    valueCapture: number;
    riskManagement: number;
    adaptabilityScore: number;
    overallPerformance: number;
}

export interface AiCoachConfig {
    enableOpponentModeling: boolean;
    enableMarketAnalysis: boolean;
    enableRealTimeAdjustments: boolean;
    adaptationSensitivity: 'low' | 'medium' | 'high';
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

const useEnhancedAiDraftCoach = (params: {
    league: League;
    userTeam: Team;
    currentPick: number;
    currentRound: number;
    availablePlayers: Player[];
    recentPicks: any[];
    timeRemaining: number;
    isUserTurn: boolean;
    config?: AiCoachConfig;
}) => {
    const {
        league,
        userTeam,
        currentPick,
        currentRound,
        availablePlayers,
        recentPicks,
        timeRemaining,
        isUserTurn,
        config = {
            enableOpponentModeling: true,
            enableMarketAnalysis: true,
            enableRealTimeAdjustments: true,
            adaptationSensitivity: 'medium',
            riskTolerance: 'moderate'
        }
    } = params;
    // Core AI services
    const simulationEngine = React.useRef(new EnhancedDraftSimulationEngine());
    const marketDetector = React.useRef(new MarketInefficiencyDetector());
    const strategyService = React.useRef(new RealTimeStrategyAdjustmentService());

    // State management
    const [aiState, setAiState] = React.useState<AiCoachState>({
        isActive: true,
        confidence: 0.5,
        currentStrategy: null,
        recommendations: [],
        opponentModels: [],
        marketInefficiencies: [],
        pickPredictions: new Map(),
        strategyAdjustments: [],
        analysisMetrics: {
            predictionAccuracy: 0.5,
            strategicAlignment: 0.5,
            valueCapture: 0.5,
            riskManagement: 0.5,
            adaptabilityScore: 0.5,
            overallPerformance: 0.5
        }
    });

    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [lastUpdateTime, setLastUpdateTime] = React.useState(Date.now());

    // Initialize AI systems
    React.useEffect(() => {
        if (league.teams && simulationEngine.current) {
            simulationEngine.current.initializeOpponentModels(league.teams);
            setAiState(prev => ({
                ...prev,
                currentStrategy: strategyService.current.getActiveStrategy()
            }));
        }
    }, [league.teams]);

    // Real-time analysis when draft state changes
    React.useEffect(() => {
        if (!aiState.isActive || !availablePlayers.length) return;

        const runAnalysis = async () => {
            setIsAnalyzing(true);
            
            try {
                // Build draft context
                const draftContext: DraftContext = {
                    currentRound,
                    currentPick,
                    picksRemaining: calculatePicksRemaining(currentPick, league),
                    availablePlayers,
                    userTeam,
                    league,
                    recentPicks,
                    marketInefficiencies: [],
                    timeRemaining,
                    isUserTurn,
                    draftFlow: {
                        positionRuns: {},
                        valueDeviations: [],
                        averagePickTime: 60,
                        emergentPatterns: [],
                        marketSentiment: 'neutral'
                    }
                };

                const analysisResults = await performComprehensiveAnalysis(draftContext);
                
                setAiState(prev => ({
                    ...prev,
                    ...analysisResults,
                    confidence: Math.min(0.95, prev.confidence + 0.05) // Gradually increase confidence
                }));

                setLastUpdateTime(Date.now());
            } catch (error) {
                console.error('AI analysis error:', error);
            } finally {
                setIsAnalyzing(false);
            }
        };

        // Debounce rapid updates
        const timeoutId = setTimeout(runAnalysis, 300);
        return () => clearTimeout(timeoutId);
    }, [currentPick, availablePlayers.length, recentPicks.length, isUserTurn]);

    // Update opponent models when picks are made
    React.useEffect(() => {
        if (recentPicks.length > 0 && config.enableOpponentModeling) {
            const latestPick = recentPicks[recentPicks.length - 1];
            if (latestPick && simulationEngine.current) {
                const draftContext: DraftContext = {
                    currentRound,
                    currentPick,
                    picksRemaining: calculatePicksRemaining(currentPick, league),
                    availablePlayers,
                    userTeam,
                    league,
                    recentPicks,
                    marketInefficiencies: aiState.marketInefficiencies,
                    timeRemaining,
                    isUserTurn,
                    draftFlow: {
                        positionRuns: calculatePositionRuns(recentPicks),
                        valueDeviations: [],
                        averagePickTime: 60,
                        emergentPatterns: [],
                        marketSentiment: 'neutral'
                    }
                };

                // Create context compatible with both services
                const simulationContext = {
                    ...draftContext,
                    positionRuns: calculatePositionRuns(recentPicks),
                    marketTrends: []
                };

                simulationEngine.current.updateOpponentModel(
                    latestPick.teamId,
                    latestPick,
                    simulationContext
                );
            }
        }
    }, [recentPicks.length]);

    const performComprehensiveAnalysis = async (context: DraftContext) => {
        const results: Partial<AiCoachState> = {};

        // 1. Market inefficiency detection
        if (config.enableMarketAnalysis && marketDetector.current) {
            results.marketInefficiencies = marketDetector.current.detectInefficiencies(
                context.availablePlayers,
                context.currentPick,
                context.recentPicks,
                {
                    currentRound: context.currentRound,
                    league: context.league,
                    draftedPlayers: []
                }
            );
            context.marketInefficiencies = results.marketInefficiencies;
        }

        // 2. Real-time strategy adjustments
        if (config.enableRealTimeAdjustments && strategyService.current) {
            const strategyAnalysis = strategyService.current.analyzeAndAdjust(context);
            results.recommendations = strategyAnalysis.recommendations;
            results.strategyAdjustments = strategyAnalysis.adjustments;
            results.currentStrategy = strategyAnalysis.strategyUpdates.find(s => s.active) || null;
        }

        // 3. Opponent modeling and predictions
        if (config.enableOpponentModeling && simulationEngine.current) {
            const pickPredictions = new Map<number, PickRecommendation>();
            
            // Create simulation-compatible context
            const simulationContext = {
                ...context,
                positionRuns: calculatePositionRuns(context.recentPicks),
                marketTrends: []
            };
            
            // Predict next few picks
            const upcomingTeams = getUpcomingTeams(context.currentPick, context.league, 3);
            for (const teamId of upcomingTeams) {
                const prediction = simulationEngine.current.predictOpponentPick(teamId, simulationContext);
                if (prediction) {
                    pickPredictions.set(teamId, prediction);
                }
            }
            
            results.pickPredictions = pickPredictions;
        }

        // 4. Generate user recommendations if it's their turn
        if (context.isUserTurn && simulationEngine.current) {
            const simulationContext = {
                ...context,
                positionRuns: calculatePositionRuns(context.recentPicks),
                marketTrends: []
            };
            
            const userRecommendations = simulationEngine.current.generateStrategyRecommendations(
                context.userTeam,
                simulationContext
            );
            
            // Merge with existing recommendations
            if (results.recommendations) {
                results.recommendations = [...results.recommendations, ...convertToStrategyRecommendations(userRecommendations)];
            }
        }

        // 5. Update performance metrics
        results.analysisMetrics = calculateMetrics(context, results, aiState.analysisMetrics);

        return results;
    };

    const calculateMetrics = (
        context: DraftContext, 
        results: Partial<AiCoachState>, 
        previousMetrics: AnalysisMetrics
    ): AnalysisMetrics => {
        // This would be more sophisticated in practice
        const baseScore = 0.5;
        const improvement = 0.01;

        return {
            predictionAccuracy: Math.min(0.95, previousMetrics.predictionAccuracy + improvement),
            strategicAlignment: baseScore + (results.recommendations?.length || 0) * 0.05,
            valueCapture: baseScore + (results.marketInefficiencies?.filter(m => m.type === 'undervalued').length || 0) * 0.1,
            riskManagement: baseScore + (aiState.currentStrategy?.riskTolerance === config.riskTolerance ? 0.2 : 0),
            adaptabilityScore: baseScore + (results.strategyAdjustments?.length || 0) * 0.1,
            overallPerformance: 0 // Would be calculated as weighted average
        };
    };

    // Helper functions
    const calculatePicksRemaining = (currentPick: number, league: League): number => {
        const totalPicks = league.teams.length * 16; // Standard 16 rounds
        return totalPicks - currentPick;
    };

    const calculatePositionRuns = (picks: any[]): Record<string, number> => {
        const runs: Record<string, number> = {};
        const recentPicks = picks.slice(-5);
        
        ['QB', 'RB', 'WR', 'TE'].forEach(position => {
            let count = 0;
            for (let i = recentPicks.length - 1; i >= 0; i--) {
                if (recentPicks[i].player?.position === position) {
                    count++;
                } else {
                    break;
                }
            }
            runs[position] = count;
        });
        
        return runs;
    };

    const getUpcomingTeams = (currentPick: number, league: League, count: number): number[] => {
        const teams: number[] = [];
        const totalTeams = league.teams.length;
        
        for (let i = 1; i <= count; i++) {
            const nextPick = currentPick + i;
            const teamIndex = Math.floor(nextPick / totalTeams) % 2 === 0 
                ? (nextPick - 1) % totalTeams 
                : totalTeams - 1 - ((nextPick - 1) % totalTeams);
            teams.push(league.teams[teamIndex]?.id || 0);
        }
        
        return teams;
    };

    const convertToStrategyRecommendations = (pickRecs: PickRecommendation[]): StrategyRecommendation[] => {
        return pickRecs.map(rec => ({
            type: 'safe_pick' as const,
            title: `Draft ${rec.player.name}`,
            description: rec.reasoning.join('. '),
            confidence: rec.confidence,
            urgency: 100 - rec.risk,
            reasoning: rec.reasoning,
            suggestedPlayers: [rec.player, ...rec.alternatives],
            riskLevel: rec.risk,
            potentialImpact: rec.value
        }));
    };

    // Public API
    const toggleAiCoach = React.useCallback(() => {
        setAiState(prev => ({ ...prev, isActive: !prev.isActive }));
    }, []);

    const switchStrategy = React.useCallback((strategyId: string) => {
        const success = strategyService.current.switchStrategy(strategyId);
        if (success) {
            setAiState(prev => ({
                ...prev,
                currentStrategy: strategyService.current.getActiveStrategy()
            }));
        }
        return success;
    }, []);

    const getOpponentPrediction = React.useCallback((teamId: number): PickRecommendation | null => {
        return aiState.pickPredictions.get(teamId) || null;
    }, [aiState.pickPredictions]);

    const getMarketAnalysis = React.useCallback(() => {
        return {
            inefficiencies: aiState.marketInefficiencies,
            positionRuns: calculatePositionRuns(recentPicks),
            marketSentiment: 'neutral' as const };
    }, [aiState.marketInefficiencies, recentPicks]);

    const getTopRecommendations = React.useCallback((count: number = 3): StrategyRecommendation[] => {
        const sortedRecommendations = [...aiState.recommendations];
        sortedRecommendations.sort((a, b) => (b.confidence * b.urgency) - (a.confidence * a.urgency));
        return sortedRecommendations.slice(0, count);
    }, [aiState.recommendations]);

    const forceRefresh = React.useCallback(() => {
        setLastUpdateTime(Date.now());
    }, []);

    return {
        // State
        aiState,
        isAnalyzing,
        lastUpdateTime,
        
        // Actions
        toggleAiCoach,
        switchStrategy,
        forceRefresh,
        
        // Data access
        getOpponentPrediction,
        getMarketAnalysis,
        getTopRecommendations,
        
        // Metrics
        analysisMetrics: aiState.analysisMetrics,
        
        // Config
        config
    };
};

export default useEnhancedAiDraftCoach;
