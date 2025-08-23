/**
 * Advanced Trade Analysis Engine
 * Comprehensive trade evaluation with fairness analysis, future value projection, and negotiation insights
 */

import { Player } from '../types';

export interface TradeProposal {
    id: string;
    fromTeamId: string;
    toTeamId: string;
    fromPlayers: Player[];
    toPlayers: Player[];
    fromDraftPicks?: DraftPick[];
    toDraftPicks?: DraftPick[];
    proposedAt: Date;
    expiresAt: Date;
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'countered';
    message?: string;
}

export interface DraftPick {
    season: number;
    round: number;
    originalTeamId: string;
    estimatedPosition?: number;
}

export interface TradeAnalysis {
    overallGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
    fairnessScore: number; // 0-100, 50 is perfectly fair
    recommendation: 'accept' | 'reject' | 'counter' | 'negotiate';
    
    // Value Analysis
    currentValueDifference: number;
    projectedValueDifference: number;
    valueBreakdown: {
        fromTeamValue: number;
        toTeamValue: number;
        fromTeamProjected: number;
        toTeamProjected: number;
    };
    
    // Team Impact Analysis
    fromTeamImpact: TeamImpact;
    toTeamImpact: TeamImpact;
    
    // Advanced Metrics
    positionalAnalysis: PositionalImpact[];
    scheduleImpact: ScheduleImpact;
    injuryRiskAssessment: InjuryRiskAnalysis;
    
    // Negotiation Insights
    negotiationSuggestions: NegotiationSuggestion[];
    alternativeOffers: AlternativeOffer[];
    
    // Context
    leagueContext: LeagueContext;
    reasoning: string[];
    warnings: string[];
}

export interface TeamImpact {
    teamId: string;
    overallRatingChange: number;
    strengthChanges: PositionStrengthChange[];
    startingLineupImpact: LineupImpact;
    benchDepthImpact: number;
    playoffProjection: number;
    rosterBalance: number;
}

export interface PositionStrengthChange {
    position: string;
    currentStrength: number;
    newStrength: number;
    change: number;
    ranking: number; // League position ranking
}

export interface LineupImpact {
    weeklyProjectionChange: number;
    consistencyChange: number;
    upside: number;
    floor: number;
}

export interface PositionalImpact {
    position: string;
    scarcityFactor: number;
    marketValue: number;
    futureOutlook: 'improving' | 'stable' | 'declining';
    replacementLevel: number;
}

export interface ScheduleImpact {
    byeWeekConflicts: number;
    strengthOfSchedule: number;
    playoffScheduleImpact: number;
    upcomingMatchups: number; // Next 4 weeks impact
}

export interface InjuryRiskAnalysis {
    overallRiskChange: number;
    playerRisks: PlayerRiskProfile[];
    ageFactors: number;
    historyFactors: number;
}

export interface PlayerRiskProfile {
    playerId: string;
    injuryProbability: number;
    durabilityScore: number;
    ageRisk: number;
}

export interface NegotiationSuggestion {
    type: 'add_player' | 'add_pick' | 'remove_player' | 'swap_player';
    description: string;
    impact: number;
    reasoning: string;
}

export interface AlternativeOffer {
    players: Player[];
    draftPicks?: DraftPick[];
    fairnessScore: number;
    description: string;
}

export interface LeagueContext {
    scoringSystem: string;
    rosterSize: number;
    startingPositions: Record<string, number>;
    playoffTeams: number;
    tradingDeadline: Date;
    currentWeek: number;
}

export interface ValueCalculationParams {
    scoringSystem: 'standard' | 'ppr' | 'half_ppr' | 'superflex';
    leagueSize: number;
    rosterComposition: Record<string, number>;
    seasonLength: number;
    playoffStart: number;
}

class TradeAnalysisEngine {
    private readonly playerDatabase: Map<string, Player> = new Map();
    private readonly leagueSettings: LeagueContext;
    private readonly positionalScarcity: Map<string, number> = new Map();
    private readonly valueCalculationParams: ValueCalculationParams;

    constructor(leagueSettings: LeagueContext, players: Player[]) {
        this.leagueSettings = leagueSettings;
        this.initializePlayerDatabase(players);
        this.calculatePositionalScarcity();
        this.valueCalculationParams = this.deriveValueParams();
    }

    /**
     * Comprehensive trade analysis
     */
    async analyzeTradeProposal(proposal: TradeProposal): Promise<TradeAnalysis> {
        console.log(`🔍 Analyzing trade proposal: ${proposal.id}`);

        // Calculate base values
        const currentValues = this.calculateCurrentValues(proposal);
        const projectedValues = this.calculateProjectedValues(proposal);
        
        // Team impact analysis
        const fromTeamImpact = await this.analyzeTeamImpact(
            proposal.fromTeamId, 
            proposal.fromPlayers, 
            proposal.toPlayers,
            proposal.fromDraftPicks,
            proposal.toDraftPicks
        );
        
        const toTeamImpact = await this.analyzeTeamImpact(
            proposal.toTeamId,
            proposal.toPlayers,
            proposal.fromPlayers,
            proposal.toDraftPicks,
            proposal.fromDraftPicks
        );

        // Advanced analysis
        const positionalAnalysis = this.analyzePositionalImpact(proposal);
        const scheduleImpact = this.analyzeScheduleImpact(proposal);
        const injuryRiskAssessment = this.analyzeInjuryRisk(proposal);

        // Calculate fairness and grade
        const fairnessScore = this.calculateFairnessScore(currentValues, projectedValues, fromTeamImpact, toTeamImpact);
        const overallGrade = this.calculateOverallGrade(fairnessScore, fromTeamImpact, toTeamImpact);
        const recommendation = this.generateRecommendation(fairnessScore, fromTeamImpact, toTeamImpact);

        // Generate insights
        const negotiationSuggestions = this.generateNegotiationSuggestions(proposal, fairnessScore);
        const alternativeOffers = this.generateAlternativeOffers(proposal);
        const reasoning = this.generateReasoning(fairnessScore, fromTeamImpact, toTeamImpact);
        const warnings = this.generateWarnings(proposal, injuryRiskAssessment);

        return {
            overallGrade,
            fairnessScore,
            recommendation,
            currentValueDifference: currentValues.difference,
            projectedValueDifference: projectedValues.difference,
            valueBreakdown: {
                fromTeamValue: currentValues.fromTeamValue,
                toTeamValue: currentValues.toTeamValue,
                fromTeamProjected: projectedValues.fromTeamValue,
                toTeamProjected: projectedValues.toTeamValue
            },
            fromTeamImpact,
            toTeamImpact,
            positionalAnalysis,
            scheduleImpact,
            injuryRiskAssessment,
            negotiationSuggestions,
            alternativeOffers,
            leagueContext: this.leagueSettings,
            reasoning,
            warnings
        };
    }

    /**
     * Calculate current player values
     */
    private calculateCurrentValues(proposal: TradeProposal) {
        const fromTeamValue = this.calculateTeamTradeValue(proposal.fromPlayers, proposal.fromDraftPicks);
        const toTeamValue = this.calculateTeamTradeValue(proposal.toPlayers, proposal.toDraftPicks);
        
        return {
            fromTeamValue,
            toTeamValue,
            difference: Math.abs(fromTeamValue - toTeamValue)
        };
    }

    /**
     * Calculate projected future values (rest of season + next season)
     */
    private calculateProjectedValues(proposal: TradeProposal) {
        const fromTeamValue = this.calculateProjectedTeamValue(proposal.fromPlayers, proposal.fromDraftPicks);
        const toTeamValue = this.calculateProjectedTeamValue(proposal.toPlayers, proposal.toDraftPicks);
        
        return {
            fromTeamValue,
            toTeamValue,
            difference: Math.abs(fromTeamValue - toTeamValue)
        };
    }

    /**
     * Calculate team trade value including players and picks
     */
    private calculateTeamTradeValue(players: Player[], draftPicks?: DraftPick[]): number {
        let totalValue = 0;

        // Player values
        for (const player of players) {
            totalValue += this.calculatePlayerValue(player);
        }

        // Draft pick values
        if (draftPicks) {
            for (const pick of draftPicks) {
                totalValue += this.calculateDraftPickValue(pick);
            }
        }

        return totalValue;
    }

    /**
     * Calculate individual player value using multiple factors
     */
    private calculatePlayerValue(player: Player): number {
        const baseValue = this.getBasePlayerValue(player);
        const positionalMultiplier = this.getPositionalValueMultiplier(player.position);
        const scarcityBonus = this.getScarcityBonus(player);
        const ageAdjustment = this.getAgeAdjustment(player);
        const injuryDiscount = this.getInjuryDiscount(player);
        const scheduleAdjustment = this.getScheduleAdjustment(player);

        return baseValue * positionalMultiplier * scarcityBonus * ageAdjustment * injuryDiscount * scheduleAdjustment;
    }

    /**
     * Get base player value from projected points and consistency
     */
    private getBasePlayerValue(player: Player): number {
        // Use existing player properties or provide defaults
        const projectedPoints = (player as any).projectedPoints || 150;
        const consistency = (player as any).consistency || 0.8;
        const ceiling = (player as any).ceiling || projectedPoints * 1.2;
        const floor = (player as any).floor || projectedPoints * 0.8;
        
        // Value formula considering upside and safety
        return projectedPoints + (consistency * 10) + ((ceiling - floor) * 0.1);
    }

    /**
     * Position-specific value multipliers
     */
    private getPositionalValueMultiplier(position: string): number {
        const multipliers: Record<string, number> = {
            'QB': this.valueCalculationParams.scoringSystem === 'superflex' ? 1.2 : 0.9,
            'RB': 1.1,
            'WR': this.valueCalculationParams.scoringSystem.includes('ppr') ? 1.05 : 1.0,
            'TE': this.valueCalculationParams.scoringSystem.includes('ppr') ? 1.02 : 0.95,
            'K': 0.3,
            'DST': 0.4
        };
        
        return multipliers[position] || 1.0;
    }

    /**
     * Scarcity bonus based on positional depth
     */
    private getScarcityBonus(player: Player): number {
        const scarcity = this.positionalScarcity.get(player.position) || 1.0;
        return 1.0 + (scarcity - 1.0) * 0.2; // 20% impact from scarcity
    }

    /**
     * Age-based value adjustment
     */
    private getAgeAdjustment(player: Player): number {
        const age = player.age || 26;
        
        if (age <= 24) return 1.05; // Young upside
        if (age <= 27) return 1.0;  // Prime
        if (age <= 30) return 0.98; // Slight decline
        if (age <= 33) return 0.95; // Aging
        return 0.9; // Old
    }

    /**
     * Injury history discount
     */
    private getInjuryDiscount(player: Player): number {
        const injuryHistory = player.injuryHistory || [];
        const recentInjuries = injuryHistory.filter(injury => 
            new Date(injury.date).getFullYear() >= new Date().getFullYear() - 1
        );
        
        return Math.max(0.85, 1.0 - (recentInjuries.length * 0.05));
    }

    /**
     * Schedule strength adjustment
     */
    private getScheduleAdjustment(player: Player): number {
        // Mock schedule data - in real implementation, would analyze opponent defenses
        const scheduleStrength = Math.random() * 0.2 + 0.9; // 0.9 to 1.1
        return scheduleStrength;
    }

    /**
     * Calculate draft pick value
     */
    private calculateDraftPickValue(pick: DraftPick): number {
        const currentYear = new Date().getFullYear();
        const yearOffset = pick.season - currentYear;
        
        // Base values for draft picks (first round = 100, decreases exponentially)
        const baseValue = Math.max(10, 120 - (pick.round - 1) * 15 - Math.pow(pick.round - 1, 1.5) * 5);
        
        // Discount future picks
        const futureDiscount = Math.pow(0.9, yearOffset);
        
        // Position adjustment based on expected draft position
        const positionAdjustment = pick.estimatedPosition ? 
            Math.max(0.5, 1.5 - (pick.estimatedPosition / (this.valueCalculationParams.leagueSize * 0.8))) : 1.0;
        
        return baseValue * futureDiscount * positionAdjustment;
    }

    /**
     * Calculate projected future team value
     */
    private calculateProjectedTeamValue(players: Player[], draftPicks?: DraftPick[]): number {
        let totalValue = 0;

        // Player future values (considering age, contract, etc.)
        for (const player of players) {
            const currentValue = this.calculatePlayerValue(player);
            const futureMultiplier = this.getFutureValueMultiplier(player);
            totalValue += currentValue * futureMultiplier;
        }

        // Draft picks maintain their value
        if (draftPicks) {
            for (const pick of draftPicks) {
                totalValue += this.calculateDraftPickValue(pick);
            }
        }

        return totalValue;
    }

    /**
     * Future value multiplier based on player trajectory
     */
    private getFutureValueMultiplier(player: Player): number {
        const age = player.age || 26;
        const trend = (player as any).trend || 'stable';
        
        let multiplier = 1.0;
        
        // Age factor
        if (age <= 24) multiplier *= 1.1; // Growth potential
        else if (age >= 30) multiplier *= 0.9; // Decline risk
        
        // Trend factor
        switch (trend) {
            case 'improving': multiplier *= 1.05; break;
            case 'declining': multiplier *= 0.95; break;
        }
        
        return multiplier;
    }

    /**
     * Analyze team impact from trade
     */
    private async analyzeTeamImpact(
        teamId: string, 
        playersOut: Player[], 
        playersIn: Player[],
        picksOut?: DraftPick[],
        picksIn?: DraftPick[]
    ): Promise<TeamImpact> {
        // Mock team data - in real implementation, would fetch from database
        const currentRoster = await this.getTeamRoster(teamId);
        const strengthChanges = this.calculateStrengthChanges(currentRoster, playersOut, playersIn);
        const lineupImpact = this.calculateLineupImpact(currentRoster, playersOut, playersIn);
        
        return {
            teamId,
            overallRatingChange: this.calculateOverallRatingChange(strengthChanges),
            strengthChanges,
            startingLineupImpact: lineupImpact,
            benchDepthImpact: this.calculateBenchDepthImpact(currentRoster, playersOut, playersIn),
            playoffProjection: this.calculatePlayoffProjectionChange(teamId, strengthChanges),
            rosterBalance: this.calculateRosterBalance(currentRoster, playersOut, playersIn)
        };
    }

    /**
     * Calculate positional strength changes
     */
    private calculateStrengthChanges(
        currentRoster: Player[], 
        playersOut: Player[], 
        playersIn: Player[]
    ): PositionStrengthChange[] {
        const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
        const changes: PositionStrengthChange[] = [];

        for (const position of positions) {
            const currentStrength = this.calculatePositionalStrength(currentRoster, position);
            
            // Apply trade changes
            const rosterAfterTrade = [
                ...currentRoster.filter(p => !playersOut.some(po => po.id === p.id)),
                ...playersIn
            ];
            
            const newStrength = this.calculatePositionalStrength(rosterAfterTrade, position);
            
            changes.push({
                position,
                currentStrength,
                newStrength,
                change: newStrength - currentStrength,
                ranking: this.getPositionalRanking(newStrength, position)
            });
        }

        return changes;
    }

    /**
     * Calculate positional strength for a roster
     */
    private calculatePositionalStrength(roster: Player[], position: string): number {
        const positionPlayers = roster.filter(p => p.position === position);
        if (positionPlayers.length === 0) return 0;

        // Sort by value and take top players for starting lineup
        const positionPlayersCopy = [...positionPlayers];
        positionPlayersCopy.sort((a, b) => 
            this.calculatePlayerValue(b) - this.calculatePlayerValue(a)
        );
        const sortedPlayers = positionPlayersCopy;

        const startingSlots = this.leagueSettings.startingPositions[position] || 1;
        const startingPlayers = sortedPlayers.slice(0, startingSlots);
        
        return startingPlayers.reduce((sum, player) => sum + this.calculatePlayerValue(player), 0);
    }

    /**
     * Calculate fairness score (0-100, 50 is fair)
     */
    private calculateFairnessScore(
        currentValues: any, 
        projectedValues: any, 
        fromTeamImpact: TeamImpact, 
        toTeamImpact: TeamImpact
    ): number {
        const valueDifference = Math.abs(currentValues.fromTeamValue - currentValues.toTeamValue);
        const maxValue = Math.max(currentValues.fromTeamValue, currentValues.toTeamValue);
        const valueRatio = maxValue > 0 ? valueDifference / maxValue : 0;

        // Base fairness from value difference (closer to 0 is more fair)
        const baseFairness = Math.max(0, 50 - (valueRatio * 100));

        // Adjust for team context and needs
        const contextAdjustment = this.calculateContextualAdjustment(fromTeamImpact, toTeamImpact);

        return Math.min(100, Math.max(0, baseFairness + contextAdjustment));
    }

    /**
     * Calculate contextual adjustment for team needs
     */
    private calculateContextualAdjustment(fromTeamImpact: TeamImpact, toTeamImpact: TeamImpact): number {
        let adjustment = 0;

        // If both teams improve, it's more fair
        if (fromTeamImpact.overallRatingChange > 0 && toTeamImpact.overallRatingChange > 0) {
            adjustment += 10;
        }

        // Roster balance improvements
        const balanceImprovement = (fromTeamImpact.rosterBalance + toTeamImpact.rosterBalance) / 2;
        adjustment += balanceImprovement * 5;

        return Math.min(20, Math.max(-20, adjustment));
    }

    /**
     * Generate overall trade grade
     */
    private calculateOverallGrade(
        fairnessScore: number, 
        fromTeamImpact: TeamImpact, 
        toTeamImpact: TeamImpact
    ): TradeAnalysis['overallGrade'] {
        let score = fairnessScore;

        // Bonus for mutual benefit
        if (fromTeamImpact.overallRatingChange > 0 && toTeamImpact.overallRatingChange > 0) {
            score += 10;
        }

        // Penalty for lopsided trades
        const impactDifference = Math.abs(fromTeamImpact.overallRatingChange - toTeamImpact.overallRatingChange);
        if (impactDifference > 15) {
            score -= 10;
        }

        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'B+';
        if (score >= 75) return 'B';
        if (score >= 70) return 'C+';
        if (score >= 65) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * Generate trade recommendation
     */
    private generateRecommendation(
        fairnessScore: number, 
        fromTeamImpact: TeamImpact, 
        toTeamImpact: TeamImpact
    ): TradeAnalysis['recommendation'] {
        if (fairnessScore >= 75 && fromTeamImpact.overallRatingChange > 0) {
            return 'accept';
        }
        
        if (fairnessScore >= 65 && fromTeamImpact.overallRatingChange >= -2) {
            return 'negotiate';
        }
        
        if (fairnessScore >= 55) {
            return 'counter';
        }
        
        return 'reject';
    }

    /**
     * Initialize helper methods and data structures
     */
    private initializePlayerDatabase(players: Player[]) {
        for (const player of players) {
            this.playerDatabase.set(player.id.toString(), player);
        }
    }

    private calculatePositionalScarcity() {
        // Mock scarcity calculation - would analyze league-wide positional depth
        this.positionalScarcity.set('QB', 1.2);
        this.positionalScarcity.set('RB', 1.4);
        this.positionalScarcity.set('WR', 1.1);
        this.positionalScarcity.set('TE', 1.3);
        this.positionalScarcity.set('K', 0.8);
        this.positionalScarcity.set('DST', 0.8);
    }

    private deriveValueParams(): ValueCalculationParams {
        return {
            scoringSystem: this.leagueSettings.scoringSystem as any,
            leagueSize: 12, // Mock
            rosterComposition: this.leagueSettings.startingPositions,
            seasonLength: 17,
            playoffStart: 15
        };
    }

    // Mock implementation methods - would be replaced with real data access
    private async getTeamRoster(teamId: string): Promise<Player[]> {
        // Mock roster data
        return Array.from(this.playerDatabase.values()).slice(0, 16);
    }

    private calculateLineupImpact(roster: Player[], playersOut: Player[], playersIn: Player[]): LineupImpact {
        return {
            weeklyProjectionChange: Math.random() * 20 - 10,
            consistencyChange: Math.random() * 10 - 5,
            upside: Math.random() * 15,
            floor: Math.random() * 10 - 5
        };
    }

    private calculateOverallRatingChange(changes: PositionStrengthChange[]): number {
        return changes.reduce((sum, change) => sum + change.change, 0) / changes.length;
    }

    private calculateBenchDepthImpact(roster: Player[], playersOut: Player[], playersIn: Player[]): number {
        return Math.random() * 20 - 10; // Mock implementation
    }

    private calculatePlayoffProjectionChange(teamId: string, changes: PositionStrengthChange[]): number {
        return Math.random() * 15 - 7.5; // Mock implementation
    }

    private calculateRosterBalance(roster: Player[], playersOut: Player[], playersIn: Player[]): number {
        return Math.random() * 10 - 5; // Mock implementation
    }

    private getPositionalRanking(strength: number, position: string): number {
        return Math.floor(Math.random() * 12) + 1; // Mock ranking
    }

    private analyzePositionalImpact(proposal: TradeProposal): PositionalImpact[] {
        const positions = ['QB', 'RB', 'WR', 'TE'];
        return positions.map(position => ({
            position,
            scarcityFactor: this.positionalScarcity.get(position) || 1.0,
            marketValue: Math.random() * 100 + 50,
            futureOutlook: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any,
            replacementLevel: Math.random() * 50 + 25
        }));
    }

    private analyzeScheduleImpact(proposal: TradeProposal): ScheduleImpact {
        return {
            byeWeekConflicts: Math.floor(Math.random() * 3),
            strengthOfSchedule: Math.random() * 20 - 10,
            playoffScheduleImpact: Math.random() * 15 - 7.5,
            upcomingMatchups: Math.random() * 10 - 5
        };
    }

    private analyzeInjuryRisk(proposal: TradeProposal): InjuryRiskAnalysis {
        const allPlayers = [...proposal.fromPlayers, ...proposal.toPlayers];
        
        return {
            overallRiskChange: Math.random() * 10 - 5,
            playerRisks: allPlayers.map(player => ({
                playerId: player.id.toString(),
                injuryProbability: Math.random() * 0.3 + 0.1,
                durabilityScore: Math.random() * 40 + 60,
                ageRisk: this.calculateAgeRisk(player.age || 26)
            })),
            ageFactors: Math.random() * 5,
            historyFactors: Math.random() * 5
        };
    }

    private calculateAgeRisk(age: number): number {
        if (age <= 25) return 1;
        if (age <= 28) return 2;
        if (age <= 31) return 4;
        return 8;
    }

    private generateNegotiationSuggestions(proposal: TradeProposal, fairnessScore: number): NegotiationSuggestion[] {
        const suggestions: NegotiationSuggestion[] = [];

        if (fairnessScore < 65) {
            suggestions.push({
                type: 'add_pick',
                description: 'Request a 2nd round pick to balance the trade',
                impact: 10,
                reasoning: 'Additional draft capital would improve trade fairness'
            });

            suggestions.push({
                type: 'add_player',
                description: 'Include a bench player to sweeten the deal',
                impact: 8,
                reasoning: 'Adding depth player would provide better value balance'
            });
        }

        return suggestions;
    }

    private generateAlternativeOffers(proposal: TradeProposal): AlternativeOffer[] {
        // Mock alternative offers - would use AI to generate realistic alternatives
        return [
            {
                players: proposal.fromPlayers.slice(0, 1),
                draftPicks: [{ season: 2025, round: 2, originalTeamId: proposal.fromTeamId }],
                fairnessScore: 72,
                description: 'Simplified trade with draft pick compensation'
            }
        ];
    }

    private generateReasoning(fairnessScore: number, fromTeamImpact: TeamImpact, toTeamImpact: TeamImpact): string[] {
        const reasoning: string[] = [];

        if (fairnessScore >= 75) {
            reasoning.push('Trade value is well-balanced between both teams');
        } else if (fairnessScore >= 60) {
            reasoning.push('Trade is somewhat lopsided but may work based on team needs');
        } else {
            reasoning.push('Significant value imbalance favoring one side');
        }

        if (fromTeamImpact.overallRatingChange > 5) {
            reasoning.push('Receiving team gets substantial upgrade to starting lineup');
        }

        if (Math.abs(fromTeamImpact.rosterBalance) > 3) {
            reasoning.push('Trade addresses roster construction imbalances');
        }

        return reasoning;
    }

    private generateWarnings(proposal: TradeProposal, riskAnalysis: InjuryRiskAnalysis): string[] {
        const warnings: string[] = [];

        if (riskAnalysis.overallRiskChange > 5) {
            warnings.push('Trade significantly increases injury risk');
        }

        const highRiskPlayers = riskAnalysis.playerRisks.filter(p => p.injuryProbability > 0.25);
        if (highRiskPlayers.length > 0) {
            warnings.push(`${highRiskPlayers.length} players have elevated injury risk`);
        }

        // Check for trading deadline proximity
        const daysToDeadline = Math.floor((this.leagueSettings.tradingDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysToDeadline < 7) {
            warnings.push('Trade deadline approaching - limited time for counter-offers');
        }

        return warnings;
    }
}

export { TradeAnalysisEngine };
