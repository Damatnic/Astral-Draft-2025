/**
 * AI-Powered Draft Simulation Engine
 * Advanced mock draft simulation with opponent modeling and AI decision-making
 */

import { Player } from '../types';

// Draft simulation types
export interface DraftPick {
    round: number;
    pick: number;
    overallPick: number;
    teamId: string;
    teamName: string;
    playerId?: string;
    player?: Player;
    timeUsed: number; // seconds
    reasoning?: string;
    confidence: number;
    alternativeOptions?: string[];
}

export interface DraftTeam {
    id: string;
    name: string;
    owner: string;
    draftPosition: number;
    strategy: DraftStrategy;
    needs: Position[];
    roster: Player[];
    budget?: number; // for auction drafts
    aiPersonality: AIPersonality;
    pickHistory: DraftPick[];
    tendencies: DraftTendencies;
}

export interface DraftStrategy {
    type: 'balanced' | 'rb_heavy' | 'wr_heavy' | 'zero_rb' | 'hero_rb' | 'best_available';
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    positionPriority: Position[];
    rookiePreference: number; // 0-1 scale
    valueBased: boolean;
    targetADP: boolean; // follow ADP closely vs deviate
}

export interface AIPersonality {
    name: string;
    description: string;
    decisionSpeed: 'fast' | 'moderate' | 'slow';
    research_level: 'casual' | 'informed' | 'expert';
    tradeAggression: number; // 0-1 scale
    reaches: number; // tendency to reach for players (0-1)
    sleepers: number; // tendency to draft sleepers (0-1)
    consistency: number; // how consistent with stated strategy (0-1)
}

export interface DraftTendencies {
    averagePickTime: number;
    positionBias: Record<Position, number>;
    tierBreaking: 'random' | 'upside' | 'floor' | 'adp';
    handcuffing: boolean;
    streamingDST: boolean;
    lateQB: boolean;
    rookieHype: number;
    injuryAversion: number;
}

export interface SimulationSettings {
    draftType: 'snake' | 'linear' | 'auction';
    rounds: number;
    teams: number;
    userPosition: number;
    scoringType: 'standard' | 'ppr' | 'half_ppr' | 'superflex';
    positionLimits: Record<Position, number>;
    benchSize: number;
    aiDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
    realtimeSpeed: number; // 1x, 2x, 4x, etc.
    includeRookies: boolean;
    injuryUpdates: boolean;
}

export interface SimulationResult {
    id: string;
    draftOrder: DraftPick[];
    teams: DraftTeam[];
    userTeam: DraftTeam;
    analytics: SimulationAnalytics;
    timestamp: Date;
    settings: SimulationSettings;
}

export interface SimulationAnalytics {
    userRosterScore: number;
    userRosterRank: number;
    strengthsWeaknesses: {
        strengths: Position[];
        weaknesses: Position[];
    };
    valueFinds: Player[];
    reaches: DraftPick[];
    steals: DraftPick[];
    tradeSuggestions: TradeSuggestion[];
    comparison: TeamComparison[];
}

export interface TradeSuggestion {
    withTeam: string;
    give: Player[];
    receive: Player[];
    reasoning: string;
    confidence: number;
    valueGap: number;
}

export interface TeamComparison {
    teamId: string;
    vsUser: 'better' | 'similar' | 'worse';
    projectedWins: number;
    strengthAreas: Position[];
    notes: string;
}

type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';

class AIPlayerEvaluator {
    private readonly playerRankings: Map<string, number> = new Map();
    private readonly positionScarcity: Map<Position, number> = new Map();
    private readonly rookieProjections: Map<string, number> = new Map();

    /**
     * Evaluate player value based on AI analysis
     */
    evaluatePlayer(
        player: Player, 
        team: DraftTeam, 
        availablePlayers: Player[], 
        currentRound: number,
        settings: SimulationSettings
    ): number {
        let baseValue = this.getBasePlayerValue(player, settings.scoringType);
        
        // Apply position scarcity multiplier
        const scarcityMultiplier = this.calculatePositionScarcity(player.position, availablePlayers);
        baseValue *= scarcityMultiplier;
        
        // Apply team need multiplier
        const needMultiplier = this.calculateTeamNeed(player.position, team);
        baseValue *= needMultiplier;
        
        // Apply strategy multiplier
        const strategyMultiplier = this.calculateStrategyFit(player, team.strategy, currentRound);
        baseValue *= strategyMultiplier;
        
        // Apply AI personality adjustments
        baseValue = this.applyPersonalityAdjustments(baseValue, player, team.aiPersonality);
        
        // Apply situational factors
        baseValue = this.applySituationalFactors(baseValue, player, currentRound, settings);
        
        return Math.max(0, baseValue);
    }

    private getBasePlayerValue(player: Player, scoringType: string): number {
        // Base fantasy projections (would come from external data)
        const baseProjections = {
            QB: 280, // fantasy points
            RB: 220,
            WR: 180,
            TE: 140,
            K: 120,
            DST: 110
        };

        const positionBase = baseProjections[player.position as Position] || 100;
        
        // Apply tier adjustments (simulated)
        const tierAdjustment = this.calculatePlayerTier(player);
        
        // Apply scoring type bonus
        const scoringAdjustment = this.getScoringTypeAdjustment(player, scoringType);
        
        return positionBase * tierAdjustment * scoringAdjustment;
    }

    private calculatePositionScarcity(position: Position, availablePlayers: Player[]): number {
        const positionPlayers = availablePlayers.filter(p => p.position === position);
        const totalPlayers = availablePlayers.length;
        
        if (totalPlayers === 0) return 1.0;
        
        const scarcityRatio = positionPlayers.length / totalPlayers;
        
        // Lower ratio = higher scarcity = higher multiplier
        switch (position) {
            case 'QB': return Math.max(0.8, 1.2 - scarcityRatio);
            case 'RB': return Math.max(0.9, 1.4 - scarcityRatio);
            case 'WR': return Math.max(0.95, 1.1 - scarcityRatio);
            case 'TE': return Math.max(0.85, 1.3 - scarcityRatio);
            default: return 1.0;
        }
    }

    private calculateTeamNeed(position: Position, team: DraftTeam): number {
        const currentRoster = team.roster.filter(p => p.position === position);
        const needLevel = team.needs.indexOf(position);
        
        if (needLevel === -1) return 0.7; // Not a need
        if (currentRoster.length === 0) return 1.5; // Urgent need
        if (currentRoster.length === 1) return 1.2; // Moderate need
        return 0.9; // Depth pick
    }

    private calculateStrategyFit(player: Player, strategy: DraftStrategy, round: number): number {
        let multiplier = 1.0;
        
        // Position priority adjustment
        const priorityIndex = strategy.positionPriority.indexOf(player.position as Position);
        if (priorityIndex !== -1) {
            multiplier += (5 - priorityIndex) * 0.05; // Higher priority = higher multiplier
        }
        
        // Strategy-specific adjustments
        switch (strategy.type) {
            case 'rb_heavy':
                if (player.position === 'RB' && round <= 6) multiplier += 0.2;
                break;
            case 'wr_heavy':
                if (player.position === 'WR' && round <= 5) multiplier += 0.15;
                break;
            case 'zero_rb':
                if (player.position === 'RB' && round <= 4) multiplier -= 0.3;
                if (player.position === 'WR' && round <= 6) multiplier += 0.2;
                break;
            case 'hero_rb':
                if (player.position === 'RB' && round === 1) multiplier += 0.25;
                if (player.position === 'RB' && round > 1 && round <= 6) multiplier -= 0.15;
                break;
        }
        
        return Math.max(0.5, multiplier);
    }

    private applyPersonalityAdjustments(value: number, player: Player, personality: AIPersonality): number {
        let adjusted = value;
        
        // Apply reaches tendency
        if (personality.reaches > 0.5) {
            adjusted *= (1 + (personality.reaches - 0.5) * 0.3);
        }
        
        // Apply sleepers tendency
        if (personality.sleepers > 0.5 && this.isSleeperPick(player)) {
            adjusted *= (1 + (personality.sleepers - 0.5) * 0.4);
        }
        
        // Apply consistency factor (random deviation)
        if (personality.consistency < 1.0) {
            const deviation = (1 - personality.consistency) * 0.2;
            const randomFactor = 1 + (Math.random() - 0.5) * deviation;
            adjusted *= randomFactor;
        }
        
        return adjusted;
    }

    private applySituationalFactors(value: number, player: Player, round: number, settings: SimulationSettings): number {
        let adjusted = value;
        
        // Rookie bonus/penalty
        if (this.isRookie(player)) {
            if (settings.includeRookies) {
                adjusted *= 1.1; // Rookie bonus
            } else {
                adjusted *= 0.8; // Rookie penalty
            }
        }
        
        // Injury concerns
        if (settings.injuryUpdates && this.hasInjuryConcerns(player)) {
            adjusted *= 0.85;
        }
        
        // Late round value picks
        if (round > 10 && this.isValuePick(player)) {
            adjusted *= 1.15;
        }
        
        return adjusted;
    }

    private calculatePlayerTier(player: Player): number {
        // Simulate tier-based evaluation
        // In real implementation, this would use actual rankings/tiers
        const playerHash = this.stringToNumber(player.id.toString());
        const tierValue = 0.7 + (playerHash % 100) / 100 * 0.6; // 0.7 to 1.3
        return tierValue;
    }

    private getScoringTypeAdjustment(player: Player, scoringType: string): number {
        if (player.position === 'WR' || player.position === 'RB') {
            switch (scoringType) {
                case 'ppr': return 1.15;
                case 'half_ppr': return 1.07;
                default: return 1.0;
            }
        }
        return 1.0;
    }

    private isSleeperPick(player: Player): boolean {
        // Simulate sleeper identification logic
        const playerHash = this.stringToNumber(player.id.toString());
        return (playerHash % 10) < 2; // 20% of players are "sleepers"
    }

    private isRookie(player: Player): boolean {
        // Simulate rookie identification
        const playerHash = this.stringToNumber(player.id.toString());
        return (playerHash % 8) === 0; // ~12.5% are rookies
    }

    private hasInjuryConcerns(player: Player): boolean {
        // Simulate injury concern detection
        const playerHash = this.stringToNumber(player.id.toString());
        return (playerHash % 6) === 0; // ~16.7% have injury concerns
    }

    private isValuePick(player: Player): boolean {
        // Simulate value pick identification
        const playerHash = this.stringToNumber(player.id.toString());
        return (playerHash % 5) === 0; // 20% are value picks
    }

    public stringToNumber(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}

class DraftSimulationEngine {
    private readonly aiEvaluator: AIPlayerEvaluator;
    private currentDraft: SimulationResult | null = null;

    constructor() {
        this.aiEvaluator = new AIPlayerEvaluator();
    }

    /**
     * Start a new draft simulation
     */
    async startSimulation(settings: SimulationSettings, availablePlayers: Player[]): Promise<SimulationResult> {
        const teams = this.generateAITeams(settings);
        const userTeam = teams[settings.userPosition - 1];
        
        const simulation: SimulationResult = {
            id: `sim_${Date.now()}`,
            draftOrder: [],
            teams,
            userTeam,
            analytics: {
                userRosterScore: 0,
                userRosterRank: 0,
                strengthsWeaknesses: { strengths: [], weaknesses: [] },
                valueFinds: [],
                reaches: [],
                steals: [],
                tradeSuggestions: [],
                comparison: []
            },
            timestamp: new Date(),
            settings
        };

        this.currentDraft = simulation;
        return simulation;
    }

    /**
     * Simulate AI pick for a specific team
     */
    simulateAIPick(
        team: DraftTeam, 
        availablePlayers: Player[], 
        currentRound: number, 
        settings: SimulationSettings
    ): DraftPick {
        const startTime = Date.now();
        
        // Evaluate all available players
        const playerEvaluations = availablePlayers.map(player => ({
            player,
            value: this.aiEvaluator.evaluatePlayer(player, team, availablePlayers, currentRound, settings)
        }));

        // Sort by value and apply some randomness based on AI personality
        playerEvaluations.sort((a, b) => b.value - a.value);
        
        // Apply decision-making logic
        const selectedPlayer = this.makeAIDecision(playerEvaluations, team, currentRound);
        
        // Calculate pick details
        const overallPick = this.calculateOverallPick(currentRound, team.draftPosition, settings);
        const timeUsed = this.calculatePickTime(team.aiPersonality.decisionSpeed);
        const reasoning = this.generatePickReasoning(selectedPlayer.player, team, currentRound);
        
        const pick: DraftPick = {
            round: currentRound,
            pick: team.draftPosition,
            overallPick,
            teamId: team.id,
            teamName: team.name,
            playerId: selectedPlayer.player.id.toString(),
            player: selectedPlayer.player,
            timeUsed,
            reasoning,
            confidence: Math.min(100, Math.max(60, selectedPlayer.value / 10)),
            alternativeOptions: playerEvaluations
                .slice(1, 4)
                .map(pe => pe.player.name)
        };

        // Update team roster
        team.roster.push(selectedPlayer.player);
        team.pickHistory.push(pick);
        
        // Update team needs
        this.updateTeamNeeds(team, selectedPlayer.player);

        console.log(`AI Draft Pick: ${team.name} selects ${selectedPlayer.player.name} (${selectedPlayer.player.position}) in round ${currentRound}`);
        
        return pick;
    }

    /**
     * Generate comprehensive analytics for the completed draft
     */
    generateAnalytics(simulation: SimulationResult): SimulationAnalytics {
        const userTeam = simulation.userTeam;
        const allTeams = simulation.teams;
        
        // Calculate roster scores
        const teamScores = allTeams.map(team => ({
            team,
            score: this.calculateRosterScore(team, simulation.settings)
        }));
        
        teamScores.sort((a, b) => b.score - a.score);
        
        const userTeamScore = teamScores.find(ts => ts.team.id === userTeam.id);
        const userRank = teamScores.findIndex(ts => ts.team.id === userTeam.id) + 1;
        
        return {
            userRosterScore: userTeamScore?.score || 0,
            userRosterRank: userRank,
            strengthsWeaknesses: this.analyzeStrengthsWeaknesses(userTeam),
            valueFinds: this.identifyValueFinds(simulation.draftOrder),
            reaches: this.identifyReaches(simulation.draftOrder),
            steals: this.identifySteals(simulation.draftOrder),
            tradeSuggestions: this.generateTradeSuggestions(userTeam, allTeams),
            comparison: this.generateTeamComparisons(userTeam, allTeams)
        };
    }

    private generateAITeams(settings: SimulationSettings): DraftTeam[] {
        const teams: DraftTeam[] = [];
        const personalities = this.getAIPersonalities();
        const strategies = this.getDraftStrategies();
        
        for (let i = 0; i < settings.teams; i++) {
            const personality = personalities[i % personalities.length];
            const strategy = strategies[i % strategies.length];
            
            teams.push({
                id: `team_${i + 1}`,
                name: i === settings.userPosition - 1 ? 'Your Team' : `Team ${i + 1}`,
                owner: i === settings.userPosition - 1 ? 'User' : `AI Owner ${i + 1}`,
                draftPosition: i + 1,
                strategy,
                needs: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'K', 'DST'] as Position[],
                roster: [],
                aiPersonality: personality,
                pickHistory: [],
                tendencies: this.generateDraftTendencies(personality, strategy)
            });
        }
        
        return teams;
    }

    private makeAIDecision(
        evaluations: Array<{player: Player, value: number}>, 
        team: DraftTeam, 
        round: number
    ): {player: Player, value: number} {
        if (evaluations.length === 0) {
            throw new Error('No players available for selection');
        }
        
        // Apply personality-based decision making
        const personality = team.aiPersonality;
        
        // Determine selection pool size based on research level
        let poolSize = 1;
        switch (personality.research_level) {
            case 'casual': poolSize = Math.min(5, evaluations.length); break;
            case 'informed': poolSize = Math.min(3, evaluations.length); break;
            case 'expert': poolSize = Math.min(2, evaluations.length); break;
        }
        
        // Random selection from top options (weighted by value)
        const topOptions = evaluations.slice(0, poolSize);
        const totalValue = topOptions.reduce((sum, opt) => sum + opt.value, 0);
        
        let random = Math.random() * totalValue;
        for (const option of topOptions) {
            random -= option.value;
            if (random <= 0) {
                return option;
            }
        }
        
        return topOptions[0]; // Fallback
    }

    private calculateOverallPick(round: number, position: number, settings: SimulationSettings): number {
        if (settings.draftType === 'snake') {
            if (round % 2 === 1) {
                return (round - 1) * settings.teams + position;
            } else {
                return (round - 1) * settings.teams + (settings.teams - position + 1);
            }
        } else {
            return (round - 1) * settings.teams + position;
        }
    }

    private calculatePickTime(speed: 'fast' | 'moderate' | 'slow'): number {
        const baseTimes = { fast: 15, moderate: 45, slow: 90 };
        const baseTime = baseTimes[speed];
        return baseTime + Math.random() * 30; // Add some randomness
    }

    private generatePickReasoning(player: Player, team: DraftTeam, round: number): string {
        const reasons = [
            `Strong value at this position in round ${round}`,
            `Fills a critical need at ${player.position}`,
            `Best player available on our board`,
            `Excellent fit for our ${team.strategy.type} strategy`,
            `High upside pick with great potential`,
            `Reliable floor player for consistent production`,
            `Addressing depth at ${player.position}`,
            `Can't let them fall any further`
        ];
        
        return reasons[Math.floor(Math.random() * reasons.length)];
    }

    private updateTeamNeeds(team: DraftTeam, selectedPlayer: Player): void {
        const position = selectedPlayer.position as Position;
        const positionCount = team.roster.filter(p => p.position === position).length;
        
        // Remove from needs if threshold met
        const thresholds = { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1 };
        if (positionCount >= (thresholds[position] || 1)) {
            team.needs = team.needs.filter(need => need !== position);
        }
    }

    private calculateRosterScore(team: DraftTeam, settings: SimulationSettings): number {
        // Simplified roster scoring algorithm
        let score = 0;
        
        const positionValues = {
            QB: 100, RB: 90, WR: 85, TE: 70, K: 40, DST: 35
        };
        
        team.roster.forEach(player => {
            const baseValue = positionValues[player.position as Position] || 50;
            const playerHash = this.aiEvaluator.stringToNumber(player.id.toString());
            const variance = (playerHash % 40) - 20; // -20 to +20
            score += baseValue + variance;
        });
        
        return score;
    }

    private analyzeStrengthsWeaknesses(team: DraftTeam): {strengths: Position[], weaknesses: Position[]} {
        const positionCounts = team.roster.reduce((counts, player) => {
            const pos = player.position as Position;
            counts[pos] = (counts[pos] || 0) + 1;
            return counts;
        }, {} as Record<Position, number>);
        
        const strengths: Position[] = [];
        const weaknesses: Position[] = [];
        
        Object.entries(positionCounts).forEach(([pos, count]) => {
            const position = pos as Position;
            const ideal = { QB: 2, RB: 3, WR: 3, TE: 2, K: 1, DST: 1 }[position] || 1;
            
            if (count > ideal) strengths.push(position);
            if (count < ideal) weaknesses.push(position);
        });
        
        return { strengths, weaknesses };
    }

    private identifyValueFinds(draftOrder: DraftPick[]): Player[] {
        // Simplified value identification
        return draftOrder
            .filter(pick => pick.confidence > 85 && pick.round > 5)
            .map(pick => pick.player)
            .filter((player): player is Player => player !== undefined)
            .slice(0, 3);
    }

    private identifyReaches(draftOrder: DraftPick[]): DraftPick[] {
        // Simplified reach identification
        return draftOrder
            .filter(pick => pick.confidence < 70 && pick.round < 8)
            .slice(0, 3);
    }

    private identifySteals(draftOrder: DraftPick[]): DraftPick[] {
        // Simplified steal identification
        return draftOrder
            .filter(pick => pick.confidence > 90 && pick.round > 3)
            .slice(0, 3);
    }

    private generateTradeSuggestions(userTeam: DraftTeam, allTeams: DraftTeam[]): TradeSuggestion[] {
        // Simplified trade suggestion generation
        return [];
    }

    private generateTeamComparisons(userTeam: DraftTeam, allTeams: DraftTeam[]): TeamComparison[] {
        return allTeams
            .filter(team => team.id !== userTeam.id)
            .slice(0, 3)
            .map(team => ({
                teamId: team.id,
                vsUser: 'similar' as const,
                projectedWins: 8,
                strengthAreas: ['RB'],
                notes: `${team.name} has a balanced roster with solid depth`
            }));
    }

    private getAIPersonalities(): AIPersonality[] {
        return [
            {
                name: 'The Scholar',
                description: 'Methodical and research-driven drafter',
                decisionSpeed: 'slow',
                research_level: 'expert',
                tradeAggression: 0.3,
                reaches: 0.2,
                sleepers: 0.8,
                consistency: 0.9
            },
            {
                name: 'The Gambler',
                description: 'High-risk, high-reward strategy',
                decisionSpeed: 'fast',
                research_level: 'casual',
                tradeAggression: 0.9,
                reaches: 0.7,
                sleepers: 0.6,
                consistency: 0.4
            },
            {
                name: 'The Safe Pick',
                description: 'Conservative, floor-focused drafter',
                decisionSpeed: 'moderate',
                research_level: 'informed',
                tradeAggression: 0.2,
                reaches: 0.1,
                sleepers: 0.2,
                consistency: 0.8
            }
        ];
    }

    private getDraftStrategies(): DraftStrategy[] {
        return [
            {
                type: 'balanced',
                riskTolerance: 'moderate',
                positionPriority: ['RB', 'WR', 'QB', 'TE', 'DST', 'K'],
                rookiePreference: 0.5,
                valueBased: true,
                targetADP: true
            },
            {
                type: 'rb_heavy',
                riskTolerance: 'conservative',
                positionPriority: ['RB', 'RB', 'WR', 'QB', 'TE', 'DST'],
                rookiePreference: 0.3,
                valueBased: false,
                targetADP: false
            },
            {
                type: 'zero_rb',
                riskTolerance: 'aggressive',
                positionPriority: ['WR', 'WR', 'QB', 'TE', 'RB', 'DST'],
                rookiePreference: 0.7,
                valueBased: true,
                targetADP: false
            }
        ];
    }

    private generateDraftTendencies(personality: AIPersonality, strategy: DraftStrategy): DraftTendencies {
        let averagePickTime = 45; // default
        if (personality.decisionSpeed === 'fast') {
            averagePickTime = 20;
        } else if (personality.decisionSpeed === 'slow') {
            averagePickTime = 90;
        }

        return {
            averagePickTime,
            positionBias: {
                QB: 1.0, RB: 1.1, WR: 1.0, TE: 0.9, K: 0.8, DST: 0.8
            },
            tierBreaking: 'upside',
            handcuffing: strategy.riskTolerance === 'conservative',
            streamingDST: true,
            lateQB: strategy.type === 'zero_rb',
            rookieHype: personality.sleepers,
            injuryAversion: strategy.riskTolerance === 'conservative' ? 0.8 : 0.4
        };
    }
}

// Export singleton instance
export const draftSimulationEngine = new DraftSimulationEngine();
export default draftSimulationEngine;
