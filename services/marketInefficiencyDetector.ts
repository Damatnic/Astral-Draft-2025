/**
 * Market Inefficiency Detection Service
 * Identifies undervalued players, market trends, and timing opportunities
 */

import { Player, Team, League } from '../types';

export interface MarketInefficiency {
    id: string;
    type: 'undervalued' | 'overvalued' | 'run_opportunity' | 'tier_break' | 'positional_scarcity' | 'bye_week_value';
    severity: 'low' | 'medium' | 'high' | 'critical';
    player?: Player;
    position?: string;
    description: string;
    value: number; // Numeric value representing the inefficiency magnitude
    confidence: number; // 0-100 confidence in the analysis
    timeWindow: number; // Picks remaining before opportunity expires
    reasoning: string[];
    actionRequired: string;
    potentialImpact: number; // Expected point/value impact
}

export interface PositionTrend {
    position: string;
    averagePickPosition: number;
    recentAveragePickPosition: number; // Last 5 picks
    trend: 'accelerating' | 'stable' | 'declining';
    scarcityLevel: number; // 0-1, where 1 is very scarce
    nextTierBreak: number; // Picks until next tier break
}

export interface ValueOpportunity {
    player: Player;
    expectedPick: number;
    currentPosition: number;
    valueDifference: number;
    confidence: number;
    reasons: string[];
}

export interface RunAnalysis {
    position: string;
    runLength: number;
    intensity: number; // How compressed the run is
    likelyToContinue: boolean;
    nextTargets: Player[];
    counterStrategy: string[];
}

class MarketInefficiencyDetector {
    private recentPicks: Array<{
        pickNumber: number;
        player: Player;
        adpDifference: number;
        timestamp: number;
    }> = [];
    
    private positionTrends: Map<string, PositionTrend> = new Map();
    private historicalADP: Map<number, number> = new Map(); // playerId -> historical ADP

    public detectInefficiencies(
        availablePlayers: Player[], 
        currentPick: number,
        recentPicks: any[],
        context: {
            currentRound: number;
            league: League;
            draftedPlayers: Player[];
        }
    ): MarketInefficiency[] {
        const inefficiencies: MarketInefficiency[] = [];

        // Update internal state
        this.updateMarketState(recentPicks, availablePlayers);

        // Detect various types of inefficiencies
        inefficiencies.push(...this.detectUndervaluedPlayers(availablePlayers, currentPick));
        inefficiencies.push(...this.detectPositionalRuns(availablePlayers, currentPick, context));
        inefficiencies.push(...this.detectTierBreaks(availablePlayers, currentPick));
        inefficiencies.push(...this.detectPositionalScarcity(availablePlayers, context));
        inefficiencies.push(...this.detectByeWeekOpportunities(availablePlayers, currentPick, context));
        inefficiencies.push(...this.detectMarketPanic(availablePlayers, currentPick));

        // Sort by priority (severity + confidence + time sensitivity)
        return inefficiencies.sort((a, b) => this.calculatePriority(b) - this.calculatePriority(a));
    }

    private updateMarketState(recentPicks: any[], availablePlayers: Player[]): void {
        // Update recent picks history
        this.recentPicks = recentPicks.slice(-10); // Keep last 10 picks

        // Update position trends
        this.updatePositionTrends(availablePlayers);
    }

    private updatePositionTrends(availablePlayers: Player[]): void {
        const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

        positions.forEach(position => {
            const positionPlayers = availablePlayers.filter(p => p.position === position);
            const draftedInPosition = this.recentPicks
                .filter(pick => pick.player.position === position)
                .slice(-5); // Last 5 picks of this position

            const averagePickPosition = this.calculateAveragePickPosition(position);
            const recentAveragePickPosition = draftedInPosition.length > 0 
                ? draftedInPosition.reduce((sum, pick) => sum + pick.pickNumber, 0) / draftedInPosition.length
                : averagePickPosition;

            const scarcityLevel = this.calculateScarcityLevel(position, positionPlayers);
            const nextTierBreak = this.calculateNextTierBreak(positionPlayers);

            let trend: 'accelerating' | 'stable' | 'declining' = 'stable';
            if (recentAveragePickPosition < averagePickPosition - 5) trend = 'accelerating';
            else if (recentAveragePickPosition > averagePickPosition + 5) trend = 'declining';

            this.positionTrends.set(position, {
                position,
                averagePickPosition,
                recentAveragePickPosition,
                trend,
                scarcityLevel,
                nextTierBreak
            });
        });
    }

    private detectUndervaluedPlayers(availablePlayers: Player[], currentPick: number): MarketInefficiency[] {
        const inefficiencies: MarketInefficiency[] = [];
        const topPlayers = availablePlayers.slice(0, 20); // Look at top 20 available

        topPlayers.forEach(player => {
            const adpDifference = player.adp - currentPick;
            
            // Significant value if player is available 10+ picks after ADP
            if (adpDifference >= 10) {
                const severity = this.determineSeverity(adpDifference, [10, 20, 30]);
                const confidence = Math.min(95, 60 + adpDifference * 2);

                inefficiencies.push({
                    id: `undervalued-${player.id}`,
                    type: 'undervalued',
                    severity,
                    player,
                    description: `${player.name} falling significantly below ADP`,
                    value: adpDifference,
                    confidence,
                    timeWindow: Math.min(10, Math.floor(adpDifference / 2)),
                    reasoning: [
                        `ADP: ${player.adp.toFixed(1)}, Current Pick: ${currentPick}`,
                        `Falling ${adpDifference.toFixed(1)} picks below expected`,
                        this.analyzeWhyFalling(player),
                        `Projected ${player.stats.projection} fantasy points`
                    ],
                    actionRequired: `Consider drafting ${player.name} for exceptional value`,
                    potentialImpact: adpDifference * 2
                });
            }
        });

        return inefficiencies;
    }

    private detectPositionalRuns(availablePlayers: Player[], currentPick: number, context: any): MarketInefficiency[] {
        const inefficiencies: MarketInefficiency[] = [];
        const positions = ['QB', 'RB', 'WR', 'TE'];

        positions.forEach(position => {
            const runAnalysis = this.analyzePositionalRun(position);
            
            if (runAnalysis.runLength >= 3) {
                const severity = this.determineSeverity(runAnalysis.runLength, [3, 4, 6]);
                const confidence = Math.min(90, 50 + runAnalysis.runLength * 10);

                inefficiencies.push({
                    id: `run-${position}`,
                    type: 'run_opportunity',
                    severity,
                    position,
                    description: `${position} run detected - ${runAnalysis.runLength} consecutive picks`,
                    value: runAnalysis.intensity * 10,
                    confidence,
                    timeWindow: runAnalysis.likelyToContinue ? 3 : 1,
                    reasoning: [
                        `${runAnalysis.runLength} ${position}s taken in recent picks`,
                        `Run intensity: ${(runAnalysis.intensity * 100).toFixed(1)}%`,
                        runAnalysis.likelyToContinue ? 'Trend likely to continue' : 'Run may be ending',
                        `Next targets: ${runAnalysis.nextTargets.slice(0, 2).map(p => p.name).join(', ')}`
                    ],
                    actionRequired: runAnalysis.likelyToContinue 
                        ? `Jump on ${position} run before value disappears`
                        : `Consider contrarian approach - target other positions`,
                    potentialImpact: runAnalysis.intensity * 25
                });
            }
        });

        return inefficiencies;
    }

    private detectTierBreaks(availablePlayers: Player[], currentPick: number): MarketInefficiency[] {
        const inefficiencies: MarketInefficiency[] = [];
        const positions = ['QB', 'RB', 'WR', 'TE'];

        positions.forEach(position => {
            const positionPlayers = availablePlayers.filter(p => p.position === position);
            if (positionPlayers.length < 2) return;

            const topPlayer = positionPlayers[0];
            const nextPlayer = positionPlayers[1];

            // Detect significant tier break (different tiers or large projection gap)
            const tierBreak = topPlayer.tier !== nextPlayer.tier;
            const projectionGap = (topPlayer.stats.projection || 0) - (nextPlayer.stats.projection || 0);
            const significantGap = projectionGap > 20; // 20+ point projection difference

            if (tierBreak || significantGap) {
                const severity = significantGap && tierBreak ? 'critical' : 'high';
                const confidence = tierBreak ? 90 : 75;

                inefficiencies.push({
                    id: `tier-break-${position}`,
                    type: 'tier_break',
                    severity,
                    player: topPlayer,
                    position,
                    description: `Major tier break at ${position} - last elite option`,
                    value: projectionGap || 20,
                    confidence,
                    timeWindow: 2,
                    reasoning: [
                        `${topPlayer.name} is Tier ${topPlayer.tier}`,
                        `Next ${position} (${nextPlayer.name}) is Tier ${nextPlayer.tier}`,
                        projectionGap > 0 ? `${projectionGap.toFixed(1)} point projection gap` : '',
                        'Significant drop-off in quality after this pick'
                    ].filter(Boolean),
                    actionRequired: `Secure ${topPlayer.name} before tier drop`,
                    potentialImpact: projectionGap || 25
                });
            }
        });

        return inefficiencies;
    }

    private detectPositionalScarcity(availablePlayers: Player[], context: any): MarketInefficiency[] {
        const inefficiencies: MarketInefficiency[] = [];
        const positions = ['QB', 'RB', 'WR', 'TE'];

        positions.forEach(position => {
            const trend = this.positionTrends.get(position);
            if (!trend) return;

            if (trend.scarcityLevel > 0.7) { // High scarcity
                const positionPlayers = availablePlayers.filter(p => p.position === position);
                const elitePlayers = positionPlayers.filter(p => p.tier <= 2);

                if (elitePlayers.length <= 2) {
                    const severity = elitePlayers.length === 1 ? 'critical' : 'high';
                    
                    inefficiencies.push({
                        id: `scarcity-${position}`,
                        type: 'positional_scarcity',
                        severity,
                        position,
                        description: `Critical ${position} scarcity - only ${elitePlayers.length} elite options left`,
                        value: trend.scarcityLevel * 100,
                        confidence: 85,
                        timeWindow: elitePlayers.length + 1,
                        reasoning: [
                            `Only ${elitePlayers.length} Tier 1-2 ${position}s remaining`,
                            `Position scarcity level: ${(trend.scarcityLevel * 100).toFixed(1)}%`,
                            trend.trend === 'accelerating' ? 'Position being drafted earlier than usual' : '',
                            `Next ${position} tier break in ${trend.nextTierBreak} picks`
                        ].filter(Boolean),
                        actionRequired: `Prioritize ${position} before scarcity drives reaching`,
                        potentialImpact: trend.scarcityLevel * 30
                    });
                }
            }
        });

        return inefficiencies;
    }

    private detectByeWeekOpportunities(availablePlayers: Player[], currentPick: number, context: any): MarketInefficiency[] {
        const inefficiencies: MarketInefficiency[] = [];

        // Late round strategy - target players with favorable bye weeks
        if (context.currentRound >= 8) {
            const byeWeekCounts = this.analyzeByeWeekDistribution(availablePlayers);
            const optimalByeWeeks = this.findOptimalByeWeeks(byeWeekCounts);

            optimalByeWeeks.forEach(byeWeek => {
                const playersWithBye = availablePlayers.filter(p => p.bye === byeWeek);
                const valuePlayers = playersWithBye.filter(p => p.adp > currentPick);

                if (valuePlayers.length > 0) {
                    inefficiencies.push({
                        id: `bye-week-${byeWeek}`,
                        type: 'bye_week_value',
                        severity: 'low',
                        description: `Bye week ${byeWeek} value opportunities`,
                        value: valuePlayers.length * 5,
                        confidence: 70,
                        timeWindow: 5,
                        reasoning: [
                            `Week ${byeWeek} bye players undervalued`,
                            `${valuePlayers.length} value options available`,
                            'Late-round bye week optimization opportunity'
                        ],
                        actionRequired: `Target players with Week ${byeWeek} bye for roster balance`,
                        potentialImpact: 10
                    });
                }
            });
        }

        return inefficiencies;
    }

    private detectMarketPanic(availablePlayers: Player[], currentPick: number): MarketInefficiency[] {
        const inefficiencies: MarketInefficiency[] = [];

        // Detect if recent picks show panic (multiple reaches in a row)
        const recentReaches = this.recentPicks.slice(-3).filter(pick => pick.adpDifference > 10);
        
        if (recentReaches.length >= 2) {
            const averageReach = recentReaches.reduce((sum, pick) => sum + pick.adpDifference, 0) / recentReaches.length;
            
            inefficiencies.push({
                id: 'market-panic',
                type: 'overvalued',
                severity: 'medium',
                description: 'Market showing panic behavior - multiple reaches detected',
                value: averageReach,
                confidence: 80,
                timeWindow: 3,
                reasoning: [
                    `${recentReaches.length} reaches in last 3 picks`,
                    `Average reach: ${averageReach.toFixed(1)} picks`,
                    'Market may be overreacting to positional scarcity',
                    'Contrarian value opportunities emerging'
                ],
                actionRequired: 'Stay disciplined - avoid panic picks and target falling players',
                potentialImpact: 15
            });
        }

        return inefficiencies;
    }

    private analyzePositionalRun(position: string): RunAnalysis {
        const positionPicks = this.recentPicks.filter(pick => pick.player.position === position);
        const recentPositionPicks = positionPicks.slice(-5);

        // Calculate run metrics
        let consecutiveCount = 0;
        for (let i = this.recentPicks.length - 1; i >= 0; i--) {
            if (this.recentPicks[i].player.position === position) {
                consecutiveCount++;
            } else {
                break;
            }
        }

        const intensity = recentPositionPicks.length / Math.min(5, this.recentPicks.length);
        const likelyToContinue = intensity > 0.4 && consecutiveCount >= 2;

        return {
            position,
            runLength: consecutiveCount,
            intensity,
            likelyToContinue,
            nextTargets: [], // Would be populated with actual player data
            counterStrategy: this.generateCounterStrategy(position, consecutiveCount)
        };
    }

    private generateCounterStrategy(position: string, runLength: number): string[] {
        const strategies: string[] = [];

        if (runLength >= 3) {
            strategies.push(`Consider joining ${position} run before tier drop`);
            strategies.push(`Alternative: Target complementary positions being ignored`);
        }

        if (runLength >= 5) {
            strategies.push(`Heavy ${position} run may signal market inefficiency`);
            strategies.push(`Contrarian approach: Target other premium positions`);
        }

        return strategies;
    }

    private calculateAveragePickPosition(position: string): number {
        // Simplified - would use historical data
        const baseADP: Record<string, number> = {
            'QB': 60, 'RB': 25, 'WR': 30, 'TE': 70, 'K': 140, 'DST': 130
        };
        return baseADP[position] || 100;
    }

    private calculateScarcityLevel(position: string, availablePlayers: Player[]): number {
        const elitePlayers = availablePlayers.filter(p => p.tier <= 2);
        const totalEliteExpected = this.getExpectedEliteCount(position);
        
        return Math.max(0, 1 - (elitePlayers.length / totalEliteExpected));
    }

    private getExpectedEliteCount(position: string): number {
        const expected: Record<string, number> = {
            'QB': 12, 'RB': 24, 'WR': 30, 'TE': 12, 'K': 5, 'DST': 5
        };
        return expected[position] || 10;
    }

    private calculateNextTierBreak(players: Player[]): number {
        if (players.length < 2) return 999;
        
        for (let i = 0; i < players.length - 1; i++) {
            if (players[i].tier !== players[i + 1].tier) {
                return i + 1;
            }
        }
        return 999;
    }

    private analyzeWhyFalling(player: Player): string {
        // Simplified analysis - would be more sophisticated
        const reasons = [
            'Market overreaction to recent performance',
            'Positional run affecting draft flow',
            'Injury concerns creating value opportunity',
            'Age/situation creating artificial discount'
        ];
        
        return reasons[Math.floor(Math.random() * reasons.length)];
    }

    private determineSeverity(value: number, thresholds: number[]): 'low' | 'medium' | 'high' | 'critical' {
        if (value >= thresholds[2]) return 'critical';
        if (value >= thresholds[1]) return 'high';
        if (value >= thresholds[0]) return 'medium';
        return 'low';
    }

    private calculatePriority(inefficiency: MarketInefficiency): number {
        const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
        const timeUrgency = Math.max(0, 10 - inefficiency.timeWindow);
        
        return (severityWeights[inefficiency.severity] * 25) + 
               (inefficiency.confidence * 0.5) + 
               (timeUrgency * 3) +
               (inefficiency.potentialImpact * 0.3);
    }

    private analyzeByeWeekDistribution(availablePlayers: Player[]): Record<number, number> {
        const byeWeeks: Record<number, number> = {};
        
        availablePlayers.forEach(player => {
            if (player.bye) {
                byeWeeks[player.bye] = (byeWeeks[player.bye] || 0) + 1;
            }
        });
        
        return byeWeeks;
    }

    private findOptimalByeWeeks(byeWeekCounts: Record<number, number>): number[] {
        // Find bye weeks with more available players (potential value)
        const avgCount = Object.values(byeWeekCounts).reduce((sum, count) => sum + count, 0) / Object.keys(byeWeekCounts).length;
        
        return Object.entries(byeWeekCounts)
            .filter(([week, count]) => count > avgCount * 1.2)
            .map(([week]) => parseInt(week));
    }
}

export default MarketInefficiencyDetector;
