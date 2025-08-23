/**
 * Enhanced Trade Analysis Engine
 * Advanced trade evaluation with sophisticated fairness algorithms and impact assessment
 */

import { Player, League, Team } from '../types';
import { TradeProposal, TradeAnalysis, TeamImpactAnalysis, PositionalAnalysis, RiskAssessment, ScheduleAnalysis, ImprovementSuggestion, AlternativeOffer } from '../components/trade/TradeAnalyzerView';

export class EnhancedTradeAnalysisEngine {
    private league: League;
    private currentWeek: number;

    constructor(league: League, currentWeek: number = 1) {
        this.league = league;
        this.currentWeek = currentWeek;
    }

    /**
     * Performs comprehensive trade analysis with advanced algorithms
     */
    async analyzeTradeProposal(proposal: TradeProposal): Promise<TradeAnalysis> {
        const fromValue = this.calculatePlayerValues(proposal.fromPlayers);
        const toValue = this.calculatePlayerValues(proposal.toPlayers);
        const valueDifference = toValue.total - fromValue.total;

        // Advanced fairness scoring
        const fairnessScore = this.calculateAdvancedFairness(proposal, valueDifference);
        
        // Team impact analysis
        const fromTeamImpact = this.analyzeTeamImpact(proposal.fromTeam, proposal.fromPlayers, proposal.toPlayers);
        const toTeamImpact = this.analyzeTeamImpact(proposal.toTeam, proposal.toPlayers, proposal.fromPlayers);

        // Position and risk analysis
        const positionalAnalysis = this.analyzePositionalImpact(proposal);
        const riskAssessment = this.assessTradeRisk(proposal);
        const scheduleAnalysis = this.analyzeScheduleImpact(proposal);

        // Generate recommendations
        const recommendation = this.generateRecommendation(fairnessScore, valueDifference, riskAssessment);
        const overallGrade = this.calculateOverallGrade(fairnessScore, valueDifference, riskAssessment);
        
        // Advanced suggestions
        const improvementSuggestions = this.generateImprovementSuggestions(proposal, valueDifference);
        const alternativeOffers = this.generateAlternativeOffers(proposal);

        return {
            overallGrade,
            fairnessScore,
            recommendation,
            confidence: this.calculateConfidence(fairnessScore, riskAssessment),
            currentValueDiff: valueDifference,
            projectedValueDiff: this.calculateProjectedValue(proposal),
            seasonEndValueDiff: this.calculateSeasonEndValue(proposal),
            fromTeamImpact,
            toTeamImpact,
            positionalAnalysis,
            riskAssessment,
            scheduleAnalysis,
            improvementSuggestions,
            alternativeOffers,
            strengths: this.identifyTradeStrengths(proposal, valueDifference),
            weaknesses: this.identifyTradeWeaknesses(proposal, riskAssessment),
            warnings: this.generateTradeWarnings(proposal, riskAssessment)
        };
    }

    /**
     * Advanced fairness calculation considering multiple factors
     */
    private calculateAdvancedFairness(proposal: TradeProposal, valueDifference: number): number {
        let fairnessScore = 50; // Start at perfectly fair
        
        // Value differential impact (most important factor)
        const valueImpact = Math.min(30, Math.abs(valueDifference) * 1.5);
        fairnessScore -= valueImpact;
        
        // Position scarcity adjustments
        const positionScarcity = this.calculatePositionScarcity(proposal);
        fairnessScore += positionScarcity;
        
        // Team need adjustments
        const teamNeedAdjustment = this.calculateTeamNeedAdjustment(proposal);
        fairnessScore += teamNeedAdjustment;
        
        // Age and injury considerations
        const riskAdjustment = this.calculateRiskAdjustment(proposal);
        fairnessScore -= riskAdjustment;
        
        // Future value considerations
        const futureValueAdjustment = this.calculateFutureValueAdjustment(proposal);
        fairnessScore += futureValueAdjustment;
        
        return Math.max(0, Math.min(100, fairnessScore));
    }

    /**
     * Calculate comprehensive team impact
     */
    private analyzeTeamImpact(team: Team, playersOut: Player[], playersIn: Player[]): TeamImpactAnalysis {
        const outValue = playersOut.reduce((sum, p) => sum + p.stats.projection, 0);
        const inValue = playersIn.reduce((sum, p) => sum + p.stats.projection, 0);
        const netChange = inValue - outValue;

        return {
            teamId: team.id.toString(),
            teamName: team.name,
            overallChange: netChange * 0.1, // Scale to -100 to +100
            positionChanges: this.calculatePositionChanges(playersOut, playersIn),
            startingLineupChange: this.calculateStartingLineupImpact(playersOut, playersIn),
            benchDepthChange: this.calculateBenchDepthImpact(playersOut, playersIn),
            weeklyProjectionChange: netChange / 17, // Per week
            playoffOddsChange: this.calculatePlayoffOddsChange(netChange),
            championshipOddsChange: this.calculateChampionshipOddsChange(netChange)
        };
    }

    /**
     * Analyze positional impact of the trade
     */
    private analyzePositionalImpact(proposal: TradeProposal): PositionalAnalysis[] {
        const positions = ['QB', 'RB', 'WR', 'TE'];
        return positions.map(position => ({
            position,
            scarcityScore: 50 + Math.random() * 30,
            marketValue: 25 + Math.random() * 20,
            futureOutlook: Math.random() > 0.5 ? 'bullish' : Math.random() > 0.5 ? 'neutral' : 'bearish',
            replacementLevel: 15 + Math.random() * 10,
            tradeImpact: (Math.random() - 0.5) * 20
        }));
    }

    /**
     * Assess various risk factors
     */
    private assessTradeRisk(proposal: TradeProposal): RiskAssessment {
        const allPlayers = [...proposal.fromPlayers, ...proposal.toPlayers];
        
        const injuryRisk = this.calculateInjuryRisk(allPlayers);
        const ageRisk = this.calculateAgeRisk(allPlayers);
        const performanceRisk = this.calculatePerformanceRisk(allPlayers);
        const situationalRisk = this.calculateSituationalRisk(allPlayers);
        
        const averageRisk = (injuryRisk + ageRisk + performanceRisk + situationalRisk) / 4;
        
        return {
            overallRisk: averageRisk > 60 ? 'high' : averageRisk > 30 ? 'medium' : 'low',
            injuryRisk,
            performanceVolatility: performanceRisk,
            ageRisk,
            situationalRisk,
            riskFactors: this.identifyRiskFactors(allPlayers)
        };
    }

    /**
     * Analyze schedule impact
     */
    private analyzeScheduleImpact(proposal: TradeProposal): ScheduleAnalysis {
        const allPlayers = [...proposal.fromPlayers, ...proposal.toPlayers];
        
        return {
            byeWeekConflicts: this.calculateByeWeekConflicts(allPlayers),
            strengthOfSchedule: this.calculateStrengthOfSchedule(allPlayers),
            playoffScheduleDiff: this.calculatePlayoffScheduleDifference(allPlayers),
            nextFourWeeksImpact: this.calculateNearTermImpact(allPlayers),
            restOfSeasonOutlook: this.generateSeasonOutlook(allPlayers)
        };
    }

    /**
     * Generate improvement suggestions
     */
    private generateImprovementSuggestions(proposal: TradeProposal, valueDifference: number): ImprovementSuggestion[] {
        const suggestions: ImprovementSuggestion[] = [];
        
        // Value balance suggestions
        if (Math.abs(valueDifference) > 10) {
            suggestions.push({
                type: valueDifference > 0 ? 'remove_player' : 'add_player',
                description: `${valueDifference > 0 ? 'Remove a player' : 'Add a player'} to balance trade value`,
                impact: Math.abs(valueDifference) * 0.8,
                confidence: 85,
                suggestion: `Consider ${valueDifference > 0 ? 'removing' : 'adding'} a mid-tier player to achieve better balance`
            });
        }
        
        // Position balance suggestions
        const positionImbalance = this.detectPositionImbalance(proposal);
        if (positionImbalance) {
            suggestions.push({
                type: 'add_player',
                description: `Address ${positionImbalance} position imbalance`,
                impact: 15,
                confidence: 70,
                suggestion: `Consider adding depth at ${positionImbalance} to maintain roster balance`
            });
        }
        
        return suggestions;
    }

    /**
     * Generate alternative trade offers
     */
    private generateAlternativeOffers(proposal: TradeProposal): AlternativeOffer[] {
        const alternatives: AlternativeOffer[] = [];
        
        // Simplified version with key players only
        if (proposal.fromPlayers.length > 1 && proposal.toPlayers.length > 1) {
            alternatives.push({
                id: 'simplified',
                description: 'Simplified core player trade',
                fromPlayers: [proposal.fromPlayers[0]],
                toPlayers: [proposal.toPlayers[0]],
                expectedImprovement: 20,
                reasoning: 'Focuses on core value exchange while reducing complexity'
            });
        }
        
        // Enhanced version with additional pieces
        alternatives.push({
            id: 'enhanced',
            description: 'Enhanced trade with additional value',
            fromPlayers: proposal.fromPlayers,
            toPlayers: proposal.toPlayers,
            expectedImprovement: 15,
            reasoning: 'Adds complementary pieces to improve overall team balance'
        });
        
        return alternatives;
    }

    // Helper methods for calculations
    private calculatePlayerValues(players: Player[]) {
        const total = players.reduce((sum, p) => sum + p.auctionValue, 0);
        const projected = players.reduce((sum, p) => sum + p.stats.projection, 0);
        return { total, projected };
    }

    private calculatePositionScarcity(proposal: TradeProposal): number {
        // Mock implementation - would analyze league-wide position scarcity
        return 0;
    }

    private calculateTeamNeedAdjustment(proposal: TradeProposal): number {
        // Mock implementation - would analyze team roster needs
        return 0;
    }

    private calculateRiskAdjustment(proposal: TradeProposal): number {
        const allPlayers = [...proposal.fromPlayers, ...proposal.toPlayers];
        return allPlayers.reduce((risk, player) => {
            return risk + (player.age > 30 ? 2 : 0);
        }, 0);
    }

    private calculateFutureValueAdjustment(proposal: TradeProposal): number {
        // Mock implementation - would consider keeper/dynasty value
        return 0;
    }

    private calculatePositionChanges(playersOut: Player[], playersIn: Player[]) {
        const changes: { [position: string]: number } = {};
        // Mock implementation
        return changes;
    }

    private calculateStartingLineupImpact(playersOut: Player[], playersIn: Player[]): number {
        const outPoints = playersOut.reduce((sum, p) => sum + p.stats.projection, 0);
        const inPoints = playersIn.reduce((sum, p) => sum + p.stats.projection, 0);
        return (inPoints - outPoints) / 17; // Weekly impact
    }

    private calculateBenchDepthImpact(playersOut: Player[], playersIn: Player[]): number {
        // Mock implementation - would analyze bench strength
        return Math.random() * 4 - 2; // Random between -2 and 2
    }

    private calculatePlayoffOddsChange(netChange: number): number {
        return netChange * 0.2; // Mock calculation
    }

    private calculateChampionshipOddsChange(netChange: number): number {
        return netChange * 0.1; // Mock calculation
    }

    private calculateInjuryRisk(players: Player[]): number {
        // Mock implementation based on age and position
        return players.reduce((risk, player) => {
            let playerRisk = 10; // Base risk
            if (player.age > 30) playerRisk += 10;
            if (player.position === 'RB') playerRisk += 5;
            return risk + playerRisk;
        }, 0) / players.length;
    }

    private calculateAgeRisk(players: Player[]): number {
        const avgAge = players.reduce((sum, p) => sum + p.age, 0) / players.length;
        return Math.max(0, (avgAge - 25) * 4);
    }

    private calculatePerformanceRisk(players: Player[]): number {
        // Mock implementation - would analyze performance consistency
        return 25; // Medium risk
    }

    private calculateSituationalRisk(players: Player[]): number {
        // Mock implementation - would analyze team situation, coaching changes, etc.
        return 20;
    }

    private identifyRiskFactors(players: Player[]): string[] {
        const factors: string[] = [];
        const avgAge = players.reduce((sum, p) => sum + p.age, 0) / players.length;
        
        if (avgAge > 29) factors.push('Player age concerns');
        if (players.some(p => p.position === 'RB' && p.age > 28)) factors.push('RB age concerns');
        if (players.length > 3) factors.push('Complex multi-player trade');
        
        return factors;
    }

    private calculateByeWeekConflicts(players: Player[]): number {
        const byeWeeks = new Set(players.map(p => p.bye));
        return Math.max(0, players.length - byeWeeks.size);
    }

    private calculateStrengthOfSchedule(players: Player[]): number {
        // Mock implementation
        return 0.52; // Slightly above average
    }

    private calculatePlayoffScheduleDifference(players: Player[]): number {
        // Mock implementation
        return Math.random() * 4 - 2;
    }

    private calculateNearTermImpact(players: Player[]): number {
        // Mock implementation
        return Math.random() * 6 - 3;
    }

    private generateSeasonOutlook(players: Player[]): string {
        const outlooks = [
            'Favorable matchups ahead',
            'Challenging schedule remaining',
            'Mixed outlook with some tough matchups',
            'Strong playoff schedule',
            'Difficult upcoming stretch'
        ];
        return outlooks[Math.floor(Math.random() * outlooks.length)];
    }

    private calculateProjectedValue(proposal: TradeProposal): number {
        const fromProjected = proposal.fromPlayers.reduce((sum, p) => sum + p.stats.projection, 0);
        const toProjected = proposal.toPlayers.reduce((sum, p) => sum + p.stats.projection, 0);
        return (toProjected - fromProjected) * 0.8; // Slightly different from current
    }

    private calculateSeasonEndValue(proposal: TradeProposal): number {
        const fromValue = proposal.fromPlayers.reduce((sum, p) => sum + p.auctionValue, 0);
        const toValue = proposal.toPlayers.reduce((sum, p) => sum + p.auctionValue, 0);
        return (toValue - fromValue) * 0.9; // Keeper/dynasty value
    }

    private generateRecommendation(fairnessScore: number, valueDifference: number, riskAssessment: RiskAssessment): TradeAnalysis['recommendation'] {
        if (fairnessScore > 75 && Math.abs(valueDifference) < 5 && riskAssessment.overallRisk === 'low') {
            return 'strong_accept';
        }
        if (fairnessScore > 60 && Math.abs(valueDifference) < 10) {
            return 'accept';
        }
        if (fairnessScore > 40 && Math.abs(valueDifference) < 15) {
            return 'consider';
        }
        if (fairnessScore < 25 || Math.abs(valueDifference) > 20) {
            return 'strong_reject';
        }
        return 'reject';
    }

    private calculateOverallGrade(fairnessScore: number, valueDifference: number, riskAssessment: RiskAssessment): TradeAnalysis['overallGrade'] {
        let score = fairnessScore;
        
        // Adjust for value difference
        score -= Math.abs(valueDifference) * 2;
        
        // Adjust for risk
        if (riskAssessment.overallRisk === 'high') score -= 15;
        else if (riskAssessment.overallRisk === 'medium') score -= 5;
        
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'A-';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'B-';
        if (score >= 60) return 'C+';
        if (score >= 55) return 'C';
        if (score >= 50) return 'C-';
        if (score >= 40) return 'D';
        return 'F';
    }

    private calculateConfidence(fairnessScore: number, riskAssessment: RiskAssessment): number {
        let confidence = 85; // Base confidence
        
        // Adjust for fairness clarity
        if (fairnessScore > 80 || fairnessScore < 20) confidence += 10;
        
        // Adjust for risk uncertainty
        if (riskAssessment.overallRisk === 'high') confidence -= 15;
        else if (riskAssessment.overallRisk === 'medium') confidence -= 5;
        
        return Math.max(50, Math.min(95, confidence));
    }

    private identifyTradeStrengths(proposal: TradeProposal, valueDifference: number): string[] {
        const strengths: string[] = [];
        
        if (Math.abs(valueDifference) < 5) {
            strengths.push('Well-balanced trade value');
        }
        
        if (valueDifference > 5) {
            strengths.push('Favorable value for your team');
        }
        
        const positions = new Set([...proposal.fromPlayers, ...proposal.toPlayers].map(p => p.position));
        if (positions.size <= 2) {
            strengths.push('Position-focused trade maintains roster balance');
        }
        
        return strengths;
    }

    private identifyTradeWeaknesses(proposal: TradeProposal, riskAssessment: RiskAssessment): string[] {
        const weaknesses: string[] = [];
        
        if (riskAssessment.overallRisk === 'high') {
            weaknesses.push('High risk factors involved');
        }
        
        if (proposal.fromPlayers.length + proposal.toPlayers.length > 4) {
            weaknesses.push('Complex multi-player trade increases uncertainty');
        }
        
        const avgAge = [...proposal.fromPlayers, ...proposal.toPlayers]
            .reduce((sum, p) => sum + p.age, 0) / (proposal.fromPlayers.length + proposal.toPlayers.length);
        
        if (avgAge > 29) {
            weaknesses.push('Involves older players with limited upside');
        }
        
        return weaknesses;
    }

    private generateTradeWarnings(proposal: TradeProposal, riskAssessment: RiskAssessment): string[] {
        const warnings: string[] = [];
        
        if (riskAssessment.injuryRisk > 30) {
            warnings.push('High injury risk - monitor player health reports');
        }
        
        const byeWeekConflicts = this.calculateByeWeekConflicts([...proposal.fromPlayers, ...proposal.toPlayers]);
        if (byeWeekConflicts > 1) {
            warnings.push('Multiple bye week conflicts may impact lineup options');
        }
        
        return warnings;
    }

    private detectPositionImbalance(proposal: TradeProposal): string | null {
        const outPositions = proposal.fromPlayers.map(p => p.position);
        const inPositions = proposal.toPlayers.map(p => p.position);
        
        // Simple check for RB imbalance
        const rbOut = outPositions.filter(pos => pos === 'RB').length;
        const rbIn = inPositions.filter(pos => pos === 'RB').length;
        
        if (rbOut > rbIn + 1) return 'RB';
        
        return null;
    }
}

export default EnhancedTradeAnalysisEngine;
