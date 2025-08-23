/**
 * Real-Time Strategy Adjustment Service
 * Dynamically adapts draft strategy based on live draft conditions
 */

import { Player, Team, League } from '../types';
import MarketInefficiencyDetector, { MarketInefficiency } from './marketInefficiencyDetector';

export interface DraftStrategy {
    id: string;
    name: string;
    description: string;
    active: boolean;
    confidence: number;
    positionPriorities: Record<string, number>;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    adaptationTriggers: StrategyTrigger[];
    pickGuidelines: PickGuideline[];
    targetPlayers: Player[];
    avoidPlayers: Player[];
    contextualRules: ContextualRule[];
}

export interface StrategyTrigger {
    id: string;
    condition: string;
    threshold: number;
    action: string;
    priority: number;
    timesSinceTriggered: number;
}

export interface PickGuideline {
    condition: string;
    recommendation: string;
    weight: number;
    roundRelevance: number[];
}

export interface ContextualRule {
    scenario: string;
    condition: (context: DraftContext) => boolean;
    adjustment: StrategyAdjustment;
    priority: number;
}

export interface StrategyAdjustment {
    positionPriorityChanges: Record<string, number>;
    riskToleranceShift: number;
    targetPlayerUpdates: {
        add: Player[];
        remove: Player[];
    };
    reasoningUpdates: string[];
}

export interface DraftContext {
    currentRound: number;
    currentPick: number;
    picksRemaining: number;
    availablePlayers: Player[];
    userTeam: Team;
    league: League;
    recentPicks: any[];
    marketInefficiencies: MarketInefficiency[];
    timeRemaining: number;
    isUserTurn: boolean;
    draftFlow: DraftFlow;
}

export interface DraftFlow {
    positionRuns: Record<string, number>;
    valueDeviations: number[];
    averagePickTime: number;
    emergentPatterns: string[];
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface StrategyRecommendation {
    type: 'position_pivot' | 'value_hunt' | 'safe_pick' | 'contrarian' | 'need_fill';
    title: string;
    description: string;
    confidence: number;
    urgency: number;
    reasoning: string[];
    suggestedPlayers: Player[];
    riskLevel: number;
    potentialImpact: number;
}

class RealTimeStrategyAdjustmentService {
    private marketDetector: MarketInefficiencyDetector;
    private activeStrategies: Map<string, DraftStrategy>;
    private strategyHistory: StrategyAdjustment[];
    private performanceMetrics: Map<string, number>;

    constructor() {
        this.marketDetector = new MarketInefficiencyDetector();
        this.activeStrategies = new Map();
        this.strategyHistory = [];
        this.performanceMetrics = new Map();
        
        this.initializeBaseStrategies();
    }

    private initializeBaseStrategies(): void {
        const strategies: DraftStrategy[] = [
            {
                id: 'balanced-value',
                name: 'Balanced Value',
                description: 'Target best available value with positional balance',
                active: true,
                confidence: 0.8,
                positionPriorities: { RB: 1.2, WR: 1.1, QB: 0.8, TE: 0.9, K: 0.3, DST: 0.3 },
                riskTolerance: 'moderate',
                adaptationTriggers: [
                    {
                        id: 'rb-scarcity',
                        condition: 'available_rb_tier1_count < 3',
                        threshold: 3,
                        action: 'increase_rb_priority',
                        priority: 8,
                        timesSinceTriggered: 0
                    }
                ],
                pickGuidelines: [
                    {
                        condition: 'round <= 3',
                        recommendation: 'Focus on RB/WR with high floor',
                        weight: 0.9,
                        roundRelevance: [1, 2, 3]
                    }
                ],
                targetPlayers: [],
                avoidPlayers: [],
                contextualRules: []
            },
            {
                id: 'zero-rb',
                name: 'Zero RB',
                description: 'Fade early RBs, focus on WR depth and QB',
                active: false,
                confidence: 0.6,
                positionPriorities: { RB: 0.4, WR: 1.5, QB: 1.3, TE: 1.0, K: 0.3, DST: 0.3 },
                riskTolerance: 'aggressive',
                adaptationTriggers: [
                    {
                        id: 'wr-run',
                        condition: 'wr_consecutive_picks >= 4',
                        threshold: 4,
                        action: 'pivot_to_rb',
                        priority: 7,
                        timesSinceTriggered: 0
                    }
                ],
                pickGuidelines: [
                    {
                        condition: 'round <= 5',
                        recommendation: 'Target elite WRs and QB',
                        weight: 0.8,
                        roundRelevance: [1, 2, 3, 4, 5]
                    }
                ],
                targetPlayers: [],
                avoidPlayers: [],
                contextualRules: []
            },
            {
                id: 'robust-rb',
                name: 'Robust RB',
                description: 'Build RB depth early, handcuff strategy',
                active: false,
                confidence: 0.7,
                positionPriorities: { RB: 1.6, WR: 0.8, QB: 0.7, TE: 0.8, K: 0.3, DST: 0.3 },
                riskTolerance: 'conservative',
                adaptationTriggers: [
                    {
                        id: 'rb-value',
                        condition: 'rb_adp_value > 10',
                        threshold: 10,
                        action: 'increase_rb_priority',
                        priority: 9,
                        timesSinceTriggered: 0
                    }
                ],
                pickGuidelines: [
                    {
                        condition: 'round <= 6',
                        recommendation: 'Prioritize RB depth and handcuffs',
                        weight: 0.85,
                        roundRelevance: [1, 2, 3, 4, 5, 6]
                    }
                ],
                targetPlayers: [],
                avoidPlayers: [],
                contextualRules: []
            }
        ];

        strategies.forEach(strategy => {
            this.activeStrategies.set(strategy.id, strategy);
        });
    }

    public analyzeAndAdjust(context: DraftContext): {
        adjustments: StrategyAdjustment[];
        recommendations: StrategyRecommendation[];
        strategyUpdates: DraftStrategy[];
    } {
        // Detect market inefficiencies
        const inefficiencies = this.marketDetector.detectInefficiencies(
            context.availablePlayers,
            context.currentPick,
            context.recentPicks,
            {
                currentRound: context.currentRound,
                league: context.league,
                draftedPlayers: []
            }
        );

        context.marketInefficiencies = inefficiencies;

        // Analyze draft flow and update context
        this.updateDraftFlow(context);

        // Check for strategy trigger conditions
        const triggeredAdjustments = this.checkStrategyTriggers(context);

        // Generate contextual adjustments
        const contextualAdjustments = this.generateContextualAdjustments(context);

        // Combine all adjustments
        const allAdjustments = [...triggeredAdjustments, ...contextualAdjustments];

        // Apply adjustments to strategies
        const updatedStrategies = this.applyAdjustments(allAdjustments, context);

        // Generate recommendations based on current state
        const recommendations = this.generateRecommendations(context, updatedStrategies);

        return {
            adjustments: allAdjustments,
            recommendations,
            strategyUpdates: Array.from(updatedStrategies.values())
        };
    }

    private updateDraftFlow(context: DraftContext): void {
        // Analyze position runs
        const positionRuns: Record<string, number> = {};
        const recentPicks = context.recentPicks.slice(-5);
        
        // Count consecutive picks by position
        const positions = ['QB', 'RB', 'WR', 'TE'];
        positions.forEach(position => {
            let consecutiveCount = 0;
            for (let i = recentPicks.length - 1; i >= 0; i--) {
                if (recentPicks[i].player?.position === position) {
                    consecutiveCount++;
                } else {
                    break;
                }
            }
            positionRuns[position] = consecutiveCount;
        });

        // Analyze value deviations
        const valueDeviations = context.recentPicks
            .slice(-10)
            .map(pick => pick.adpDifference || 0);

        // Calculate average pick time
        const averagePickTime = context.recentPicks
            .slice(-10)
            .reduce((sum, pick) => sum + (pick.timestamp || 60), 0) / Math.max(context.recentPicks.length, 1);

        // Detect emergent patterns
        const emergentPatterns: string[] = [];
        if (Object.values(positionRuns).some(count => count >= 3)) {
            emergentPatterns.push('positional_run_detected');
        }
        if (valueDeviations.filter(dev => Math.abs(dev) > 10).length >= 3) {
            emergentPatterns.push('high_volatility');
        }
        if (averagePickTime > 90) {
            emergentPatterns.push('slow_draft_pace');
        }

        // Determine market sentiment
        const recentValueSum = valueDeviations.slice(-5).reduce((sum, val) => sum + val, 0);
        let marketSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (recentValueSum > 15) marketSentiment = 'bearish'; // Reaching
        else if (recentValueSum < -15) marketSentiment = 'bullish'; // Value picks

        context.draftFlow = {
            positionRuns,
            valueDeviations,
            averagePickTime,
            emergentPatterns,
            marketSentiment
        };
    }

    private checkStrategyTriggers(context: DraftContext): StrategyAdjustment[] {
        const adjustments: StrategyAdjustment[] = [];

        this.activeStrategies.forEach(strategy => {
            strategy.adaptationTriggers.forEach(trigger => {
                if (this.evaluateTriggerCondition(trigger, context)) {
                    const adjustment = this.createTriggerAdjustment(trigger, context);
                    adjustments.push(adjustment);
                    trigger.timesSinceTriggered = 0;
                } else {
                    trigger.timesSinceTriggered++;
                }
            });
        });

        return adjustments;
    }

    private evaluateTriggerCondition(trigger: StrategyTrigger, context: DraftContext): boolean {
        switch (trigger.condition) {
            case 'available_rb_tier1_count < 3':
                const tier1RBs = context.availablePlayers.filter(p => p.position === 'RB' && p.tier <= 1);
                return tier1RBs.length < trigger.threshold;

            case 'wr_consecutive_picks >= 4':
                return (context.draftFlow.positionRuns['WR'] || 0) >= trigger.threshold;

            case 'rb_adp_value > 10':
                const topRBs = context.availablePlayers.filter(p => p.position === 'RB').slice(0, 3);
                const avgValue = topRBs.reduce((sum, p) => sum + (p.adp - context.currentPick), 0) / topRBs.length;
                return avgValue > trigger.threshold;

            default:
                return false;
        }
    }

    private createTriggerAdjustment(trigger: StrategyTrigger, context: DraftContext): StrategyAdjustment {
        const adjustment: StrategyAdjustment = {
            positionPriorityChanges: {},
            riskToleranceShift: 0,
            targetPlayerUpdates: { add: [], remove: [] },
            reasoningUpdates: []
        };

        switch (trigger.action) {
            case 'increase_rb_priority':
                adjustment.positionPriorityChanges['RB'] = 0.3;
                adjustment.reasoningUpdates.push('Increased RB priority due to scarcity');
                break;

            case 'pivot_to_rb':
                adjustment.positionPriorityChanges['RB'] = 0.4;
                adjustment.positionPriorityChanges['WR'] = -0.2;
                adjustment.reasoningUpdates.push('Pivoting to RB due to WR run');
                break;
        }

        return adjustment;
    }

    private generateContextualAdjustments(context: DraftContext): StrategyAdjustment[] {
        const adjustments: StrategyAdjustment[] = [];

        // Market inefficiency adjustments
        context.marketInefficiencies.forEach(inefficiency => {
            if (inefficiency.severity === 'critical' || inefficiency.severity === 'high') {
                const adjustment = this.createInefficiencyAdjustment(inefficiency, context);
                if (adjustment) adjustments.push(adjustment);
            }
        });

        // Time pressure adjustments
        if (context.isUserTurn && context.timeRemaining < 30) {
            adjustments.push({
                positionPriorityChanges: {},
                riskToleranceShift: -0.2, // More conservative under pressure
                targetPlayerUpdates: { add: [], remove: [] },
                reasoningUpdates: ['Reduced risk tolerance due to time pressure']
            });
        }

        // Late round adjustments
        if (context.currentRound >= 10) {
            adjustments.push({
                positionPriorityChanges: { 'K': 0.5, 'DST': 0.5 },
                riskToleranceShift: 0.1, // More aggressive in late rounds
                targetPlayerUpdates: { add: [], remove: [] },
                reasoningUpdates: ['Increased K/DST priority in late rounds']
            });
        }

        return adjustments;
    }

    private createInefficiencyAdjustment(inefficiency: MarketInefficiency, context: DraftContext): StrategyAdjustment | null {
        const adjustment: StrategyAdjustment = {
            positionPriorityChanges: {},
            riskToleranceShift: 0,
            targetPlayerUpdates: { add: [], remove: [] },
            reasoningUpdates: []
        };

        switch (inefficiency.type) {
            case 'undervalued':
                if (inefficiency.player) {
                    adjustment.targetPlayerUpdates.add.push(inefficiency.player);
                    adjustment.reasoningUpdates.push(`Target ${inefficiency.player.name} for exceptional value`);
                }
                break;

            case 'positional_scarcity':
                if (inefficiency.position) {
                    adjustment.positionPriorityChanges[inefficiency.position] = 0.3;
                    adjustment.reasoningUpdates.push(`Increased ${inefficiency.position} priority due to scarcity`);
                }
                break;

            case 'tier_break':
                if (inefficiency.player) {
                    adjustment.targetPlayerUpdates.add.push(inefficiency.player);
                    adjustment.riskToleranceShift = 0.1; // More willing to reach
                    adjustment.reasoningUpdates.push(`Target ${inefficiency.player.name} before tier drop`);
                }
                break;

            case 'run_opportunity':
                if (inefficiency.position) {
                    // Decide whether to join or fade the run
                    const userPositionCount = context.userTeam.roster?.filter(p => p.position === inefficiency.position).length || 0;
                    const maxNeeded = this.getPositionMax(inefficiency.position);
                    
                    if (userPositionCount < maxNeeded / 2) {
                        adjustment.positionPriorityChanges[inefficiency.position] = 0.2;
                        adjustment.reasoningUpdates.push(`Join ${inefficiency.position} run to address need`);
                    } else {
                        adjustment.positionPriorityChanges[inefficiency.position] = -0.1;
                        adjustment.reasoningUpdates.push(`Fade ${inefficiency.position} run - position filled`);
                    }
                }
                break;

            default:
                return null;
        }

        return adjustment;
    }

    private applyAdjustments(adjustments: StrategyAdjustment[], context: DraftContext): Map<string, DraftStrategy> {
        const updatedStrategies = new Map<string, DraftStrategy>();

        this.activeStrategies.forEach((strategy, id) => {
            const updatedStrategy = { ...strategy };

            // Apply all adjustments to this strategy
            adjustments.forEach(adjustment => {
                // Apply position priority changes
                Object.entries(adjustment.positionPriorityChanges).forEach(([position, change]) => {
                    updatedStrategy.positionPriorities[position] = Math.max(0, 
                        (updatedStrategy.positionPriorities[position] || 1) + change);
                });

                // Apply risk tolerance shift
                if (adjustment.riskToleranceShift !== 0) {
                    const currentRisk = updatedStrategy.riskTolerance === 'conservative' ? 0.3 : 
                                      updatedStrategy.riskTolerance === 'moderate' ? 0.6 : 0.9;
                    const newRisk = Math.max(0, Math.min(1, currentRisk + adjustment.riskToleranceShift));
                    
                    updatedStrategy.riskTolerance = newRisk < 0.4 ? 'conservative' : 
                                                   newRisk < 0.7 ? 'moderate' : 'aggressive';
                }

                // Update target and avoid players
                updatedStrategy.targetPlayers.push(...adjustment.targetPlayerUpdates.add);
                updatedStrategy.avoidPlayers.push(...adjustment.targetPlayerUpdates.remove);
            });

            updatedStrategies.set(id, updatedStrategy);
        });

        this.strategyHistory.push(...adjustments);
        return updatedStrategies;
    }

    private generateRecommendations(context: DraftContext, strategies: Map<string, DraftStrategy>): StrategyRecommendation[] {
        const recommendations: StrategyRecommendation[] = [];

        // Get the active strategy
        const activeStrategy = Array.from(strategies.values()).find(s => s.active);
        if (!activeStrategy) return recommendations;

        // Position-based recommendations
        const positionRecommendations = this.generatePositionRecommendations(context, activeStrategy);
        recommendations.push(...positionRecommendations);

        // Value-based recommendations
        const valueRecommendations = this.generateValueRecommendations(context, activeStrategy);
        recommendations.push(...valueRecommendations);

        // Market timing recommendations
        const timingRecommendations = this.generateTimingRecommendations(context, activeStrategy);
        recommendations.push(...timingRecommendations);

        // Sort by urgency and confidence
        return recommendations.sort((a, b) => (b.urgency * b.confidence) - (a.urgency * a.confidence));
    }

    private generatePositionRecommendations(context: DraftContext, strategy: DraftStrategy): StrategyRecommendation[] {
        const recommendations: StrategyRecommendation[] = [];
        const userRoster = context.userTeam.roster || [];

        // Check for critical position needs
        Object.entries(strategy.positionPriorities).forEach(([position, priority]) => {
            const currentCount = userRoster.filter(p => p.position === position).length;
            const maxNeeded = this.getPositionMax(position);
            const needLevel = Math.max(0, maxNeeded - currentCount) / maxNeeded;

            if (needLevel > 0.5 && priority > 1.0) {
                const availablePlayers = context.availablePlayers
                    .filter(p => p.position === position)
                    .slice(0, 3);

                if (availablePlayers.length > 0) {
                    recommendations.push({
                        type: 'need_fill',
                        title: `Address ${position} Need`,
                        description: `Critical ${position} shortage - only ${currentCount}/${maxNeeded} rostered`,
                        confidence: Math.min(95, 60 + needLevel * 30),
                        urgency: Math.min(100, needLevel * 80 + priority * 10),
                        reasoning: [
                            `Current ${position} count: ${currentCount}/${maxNeeded}`,
                            `Position priority: ${(priority * 100).toFixed(0)}%`,
                            `${availablePlayers.length} quality options available`
                        ],
                        suggestedPlayers: availablePlayers,
                        riskLevel: strategy.riskTolerance === 'conservative' ? 20 : 
                                  strategy.riskTolerance === 'moderate' ? 40 : 60,
                        potentialImpact: needLevel * 25
                    });
                }
            }
        });

        return recommendations;
    }

    private generateValueRecommendations(context: DraftContext, strategy: DraftStrategy): StrategyRecommendation[] {
        const recommendations: StrategyRecommendation[] = [];

        // Find significant value opportunities
        const valueOpportunities = context.availablePlayers
            .filter(p => p.adp - context.currentPick > 10)
            .slice(0, 5);

        if (valueOpportunities.length > 0) {
            recommendations.push({
                type: 'value_hunt',
                title: 'Value Opportunities Available',
                description: `${valueOpportunities.length} players falling below ADP`,
                confidence: 80,
                urgency: 70,
                reasoning: [
                    'Market creating value opportunities',
                    'Players falling significantly below ADP',
                    'Consider reaching for falling talent'
                ],
                suggestedPlayers: valueOpportunities,
                riskLevel: 30,
                potentialImpact: 20
            });
        }

        return recommendations;
    }

    private generateTimingRecommendations(context: DraftContext, strategy: DraftStrategy): StrategyRecommendation[] {
        const recommendations: StrategyRecommendation[] = [];

        // Check for run opportunities
        const highRunPositions = Object.entries(context.draftFlow.positionRuns)
            .filter(([_, count]) => count >= 2)
            .map(([position]) => position);

        highRunPositions.forEach(position => {
            const priority = strategy.positionPriorities[position] || 1;
            const availablePlayers = context.availablePlayers
                .filter(p => p.position === position)
                .slice(0, 2);

            if (priority > 0.8 && availablePlayers.length > 0) {
                recommendations.push({
                    type: 'position_pivot',
                    title: `${position} Run Detected`,
                    description: `Consider joining ${position} run before value disappears`,
                    confidence: 75,
                    urgency: 85,
                    reasoning: [
                        `${context.draftFlow.positionRuns[position]} consecutive ${position} picks`,
                        'Position scarcity increasing rapidly',
                        'Jump on run before tier drop'
                    ],
                    suggestedPlayers: availablePlayers,
                    riskLevel: 50,
                    potentialImpact: 18
                });
            }
        });

        return recommendations;
    }

    private getPositionMax(position: string): number {
        const limits: Record<string, number> = {
            'QB': 2, 'RB': 4, 'WR': 5, 'TE': 2, 'K': 1, 'DST': 1
        };
        return limits[position] || 1;
    }

    public getActiveStrategy(): DraftStrategy | null {
        return Array.from(this.activeStrategies.values()).find(s => s.active) || null;
    }

    public switchStrategy(strategyId: string): boolean {
        const strategy = this.activeStrategies.get(strategyId);
        if (!strategy) return false;

        // Deactivate all strategies
        this.activeStrategies.forEach(s => s.active = false);
        
        // Activate selected strategy
        strategy.active = true;
        return true;
    }

    public getStrategyHistory(): StrategyAdjustment[] {
        return [...this.strategyHistory];
    }
}

export default RealTimeStrategyAdjustmentService;
