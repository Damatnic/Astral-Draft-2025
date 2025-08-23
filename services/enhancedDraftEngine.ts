/**
 * Enhanced Draft Core Engine
 * Comprehensive draft system with auto-draft algorithms, snake draft optimization, and keeper league support
 */

import { Player, Team, DraftPick, League, PlayerPosition } from '../types';
import { players } from '../data/players';
import { getAiDraftPick } from './geminiService';

export interface AutoDraftConfig {
  enabled: boolean;
  strategy: 'BPA' | 'POSITIONAL_NEED' | 'VALUE_BASED' | 'BALANCED' | 'CONSERVATIVE' | 'AGGRESSIVE';
  positionPriority: PlayerPosition[];
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  targetRosterComposition: {
    [key in PlayerPosition]: number;
  };
  avoidInjuryProne: boolean;
  preferVeterans: boolean;
  timeoutAction: 'AUTO_DRAFT' | 'SKIP_PICK' | 'BEST_AVAILABLE';
}

export interface SnakeDraftOptimization {
  turnAnalysis: {
    pickNumber: number;
    round: number;
    position: 'EARLY' | 'MIDDLE' | 'LATE';
    nextPickIn: number;
    strategicValue: number;
    recommendations: string[];
  };
  valueDropoffs: {
    position: PlayerPosition;
    nextTierDrop: number;
    playersUntilDrop: number;
    shouldReach: boolean;
  }[];
  pickTrading: {
    suggestedTrades: DraftPickTrade[];
    optimalDraftPosition: number;
  };
}

export interface DraftPickTrade {
  givesPicks: number[];
  receivesPicks: number[];
  valueGained: number;
  rationale: string;
  targetPosition?: PlayerPosition;
}

export interface KeeperLeagueConfig {
  enabled: boolean;
  maxKeepers: number;
  keeperCost: 'DRAFT_ROUND' | 'AUCTION_VALUE' | 'FLAT_COST' | 'NO_COST';
  keeperInflation: number; // Cost increase per year kept
  tradingDeadline: Date;
  keeperDeadline: Date;
  contractYears: boolean;
  salaryCapEnabled: boolean;
  salaryCap?: number;
}

export interface KeeperPlayer extends Player {
  keeperCost: number;
  yearsKept: number;
  contractYearsRemaining?: number;
  originalDraftRound?: number;
  isEligibleKeeper: boolean;
  keeperValue: number; // Calculated keeper value vs cost
}

export interface DraftAnalytics {
  efficiencyScore: number;
  valuePicks: DraftPick[];
  reaches: DraftPick[];
  steals: DraftPick[];
  positionDrafted: { [key in PlayerPosition]: number };
  averageADP: number;
  rosterBalance: number;
  upside: number;
  floor: number;
  championshipProbability: number;
}

export interface DraftRecommendation {
  player: Player;
  confidence: number;
  reasoning: string;
  type: 'BPA' | 'NEED' | 'VALUE' | 'UPSIDE' | 'SAFE' | 'KEEPER_VALUE';
  valueVsADP: number;
  positionRank: number;
  tierInfo: {
    tier: number;
    playersLeftInTier: number;
    nextTierDrop: number;
  };
}

export class EnhancedDraftEngine {
  private readonly playerTiers: Map<PlayerPosition, Player[][]> = new Map();
  private readonly valueMatrix: Map<number, number> = new Map();
  private readonly autoDraftStrategies: Map<string, AutoDraftConfig> = new Map();

  constructor() {
    this.initializePlayerTiers();
    this.initializeValueMatrix();
    this.initializeAutoDraftStrategies();
  }

  /**
   * Initialize player tiers for each position
   */
  private initializePlayerTiers(): void {
    const positions: PlayerPosition[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    
    positions.forEach(position => {
      const positionPlayers = players
        .filter(p => p.position === position)
        .sort((a, b) => (a.adp || 999) - (b.adp || 999));

      // Create tiers based on ADP gaps
      const tiers: Player[][] = [];
      let currentTier: Player[] = [];
      let lastADP = 0;

      positionPlayers.forEach(player => {
        const adp = player.adp || 999;
        
        // Start new tier if ADP gap > tier threshold
        const tierThreshold = this.getTierThreshold(position);
        if (adp - lastADP > tierThreshold && currentTier.length > 0) {
          tiers.push([...currentTier]);
          currentTier = [];
        }
        
        currentTier.push(player);
        lastADP = adp;
      });

      if (currentTier.length > 0) {
        tiers.push(currentTier);
      }

      this.playerTiers.set(position, tiers);
    });
  }

  /**
   * Get tier threshold for position-specific tier breaks
   */
  private getTierThreshold(position: PlayerPosition): number {
    const thresholds = {
      QB: 8,
      RB: 12,
      WR: 15,
      TE: 10,
      K: 20,
      DST: 20
    };
    return thresholds[position] || 10;
  }

  /**
   * Initialize value matrix for draft pick values
   */
  private initializeValueMatrix(): void {
    // Standard draft pick value chart (modified Stuart chart)
    const baseValues = [
      1000, 875, 750, 650, 550, 475, 415, 365, 325, 290,
      260, 235, 215, 195, 180, 165, 152, 140, 130, 120,
      112, 104, 97, 91, 85, 80, 75, 71, 67, 63,
      60, 57, 54, 51, 49, 46, 44, 42, 40, 38,
      36, 34, 33, 31, 30, 29, 27, 26, 25, 24
    ];

    baseValues.forEach((value, index) => {
      this.valueMatrix.set(index + 1, value);
    });

    // Continue with diminishing returns for later picks
    for (let pick = 51; pick <= 300; pick++) {
      const value = Math.max(1, 24 - Math.floor((pick - 50) / 10));
      this.valueMatrix.set(pick, value);
    }
  }

  /**
   * Initialize pre-configured auto-draft strategies
   */
  private initializeAutoDraftStrategies(): void {
    // Best Player Available
    this.autoDraftStrategies.set('BPA', {
      enabled: true,
      strategy: 'BPA',
      positionPriority: ['RB', 'WR', 'QB', 'TE', 'K', 'DST'],
      riskTolerance: 'MEDIUM',
      targetRosterComposition: { QB: 2, RB: 5, WR: 6, TE: 2, K: 1, DST: 1 },
      avoidInjuryProne: false,
      preferVeterans: false,
      timeoutAction: 'AUTO_DRAFT'
    });

    // Positional Need
    this.autoDraftStrategies.set('POSITIONAL_NEED', {
      enabled: true,
      strategy: 'POSITIONAL_NEED',
      positionPriority: ['RB', 'WR', 'QB', 'TE', 'K', 'DST'],
      riskTolerance: 'MEDIUM',
      targetRosterComposition: { QB: 1, RB: 4, WR: 5, TE: 2, K: 1, DST: 1 },
      avoidInjuryProne: true,
      preferVeterans: false,
      timeoutAction: 'AUTO_DRAFT'
    });

    // Value-Based Drafting
    this.autoDraftStrategies.set('VALUE_BASED', {
      enabled: true,
      strategy: 'VALUE_BASED',
      positionPriority: ['RB', 'WR', 'QB', 'TE', 'K', 'DST'],
      riskTolerance: 'HIGH',
      targetRosterComposition: { QB: 2, RB: 6, WR: 7, TE: 2, K: 1, DST: 1 },
      avoidInjuryProne: false,
      preferVeterans: false,
      timeoutAction: 'AUTO_DRAFT'
    });

    // Conservative Strategy
    this.autoDraftStrategies.set('CONSERVATIVE', {
      enabled: true,
      strategy: 'CONSERVATIVE',
      positionPriority: ['RB', 'WR', 'QB', 'TE', 'K', 'DST'],
      riskTolerance: 'LOW',
      targetRosterComposition: { QB: 2, RB: 4, WR: 5, TE: 2, K: 1, DST: 2 },
      avoidInjuryProne: true,
      preferVeterans: true,
      timeoutAction: 'AUTO_DRAFT'
    });

    // Aggressive/Upside Strategy
    this.autoDraftStrategies.set('AGGRESSIVE', {
      enabled: true,
      strategy: 'AGGRESSIVE',
      positionPriority: ['RB', 'WR', 'QB', 'TE', 'K', 'DST'],
      riskTolerance: 'HIGH',
      targetRosterComposition: { QB: 1, RB: 6, WR: 7, TE: 1, K: 1, DST: 1 },
      avoidInjuryProne: false,
      preferVeterans: false,
      timeoutAction: 'AUTO_DRAFT'
    });
  }

  /**
   * Generate auto-draft pick recommendation
   */
  async generateAutoDraftPick(
    team: Team,
    availablePlayers: Player[],
    draftedPlayers: Player[],
    currentPick: number,
    totalRounds: number,
    config: AutoDraftConfig
  ): Promise<DraftRecommendation | null> {
    try {
      const currentRoster = team.roster || [];
      const recommendations = this.getPickRecommendations(
        availablePlayers,
        currentRoster,
        currentPick,
        totalRounds,
        config
      );

      if (recommendations.length === 0) {
        return null;
      }

      // Use AI for final decision between top recommendations
      const topRecommendations = recommendations.slice(0, 3);
      const aiChoice = await this.getAIPickRecommendation(team, topRecommendations, config);
      
      return aiChoice || recommendations[0];
    } catch (error) {
      console.error('Auto-draft generation failed:', error);
      // Fallback to best available
      return this.getBestAvailablePlayer(availablePlayers, currentPick);
    }
  }

  /**
   * Get multiple pick recommendations for analysis
   */
  getPickRecommendations(
    availablePlayers: Player[],
    currentRoster: Player[],
    currentPick: number,
    totalRounds: number,
    config: AutoDraftConfig
  ): DraftRecommendation[] {
    const recommendations: DraftRecommendation[] = [];
    const remainingPicks = totalRounds - Math.floor((currentPick - 1) / 12);
    
    // Analyze roster needs
    const rosterNeeds = this.analyzeRosterNeeds(currentRoster, config.targetRosterComposition, remainingPicks);
    
    // Get candidates for each strategy type
    const bpaCandidate = this.getBestPlayerAvailable(availablePlayers);
    const needCandidate = this.getBestByNeed(availablePlayers, rosterNeeds);
    const valueCandidate = this.getBestValue(availablePlayers, currentPick);
    const upsideCandidate = this.getBestUpside(availablePlayers, config.riskTolerance);
    const safeCandidate = this.getSafestPick(availablePlayers, config.avoidInjuryProne);

    // Add candidates to recommendations
    if (bpaCandidate) recommendations.push(bpaCandidate);
    if (needCandidate && needCandidate.player.id !== bpaCandidate?.player.id) {
      recommendations.push(needCandidate);
    }
    if (valueCandidate && !recommendations.find(r => r.player.id === valueCandidate.player.id)) {
      recommendations.push(valueCandidate);
    }
    if (upsideCandidate && !recommendations.find(r => r.player.id === upsideCandidate.player.id)) {
      recommendations.push(upsideCandidate);
    }
    if (safeCandidate && !recommendations.find(r => r.player.id === safeCandidate.player.id)) {
      recommendations.push(safeCandidate);
    }

    // Sort by strategy preference and confidence
    const sortedRecommendations = [...recommendations]
      .sort((a, b) => this.getStrategyWeight(b.type, config.strategy) * b.confidence - 
                      this.getStrategyWeight(a.type, config.strategy) * a.confidence);
    return sortedRecommendations.slice(0, 5);
  }

  /**
   * Analyze roster needs based on target composition
   */
  private analyzeRosterNeeds(
    currentRoster: Player[],
    targetComposition: { [key in PlayerPosition]: number },
    remainingPicks: number
  ): { position: PlayerPosition; priority: number; slotsNeeded: number }[] {
    const positionCounts = this.getPositionCounts(currentRoster);
    const needs: { position: PlayerPosition; priority: number; slotsNeeded: number }[] = [];

    Object.entries(targetComposition).forEach(([position, target]) => {
      const pos = position as PlayerPosition;
      const current = positionCounts[pos] || 0;
      const needed = Math.max(0, target - current);
      
      if (needed > 0) {
        // Higher priority for positions with greater need and fewer remaining opportunities
        const priority = (needed / target) * (1 + (target - current) / remainingPicks);
        needs.push({ position: pos, priority, slotsNeeded: needed });
      }
    });

    return needs.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get position counts from roster
   */
  private getPositionCounts(roster: Player[]): { [key in PlayerPosition]: number } {
    return roster.reduce((counts, player) => {
      counts[player.position] = (counts[player.position] || 0) + 1;
      return counts;
    }, {} as { [key in PlayerPosition]: number });
  }

  /**
   * Get best player available
   */
  private getBestPlayerAvailable(availablePlayers: Player[]): DraftRecommendation | null {
    if (availablePlayers.length === 0) return null;

    const sortedPlayers = [...availablePlayers].sort((a, b) => (a.adp || 999) - (b.adp || 999));
    const bestPlayer = sortedPlayers[0];

    const tierInfo = this.getPlayerTierInfo(bestPlayer);

    return {
      player: bestPlayer,
      confidence: 0.9,
      reasoning: `Highest ranked available player (ADP: ${bestPlayer.adp})`,
      type: 'BPA',
      valueVsADP: 0,
      positionRank: this.getPositionRank(bestPlayer, availablePlayers),
      tierInfo
    };
  }

  /**
   * Get best player by positional need
   */
  private getBestByNeed(
    availablePlayers: Player[],
    needs: { position: PlayerPosition; priority: number; slotsNeeded: number }[]
  ): DraftRecommendation | null {
    if (needs.length === 0) return null;

    const topNeed = needs[0];
    const needPlayers = availablePlayers
      .filter(p => p.position === topNeed.position);
    const sortedNeedPlayers = [...needPlayers].sort((a, b) => (a.adp || 999) - (b.adp || 999));

    if (sortedNeedPlayers.length === 0) return null;

    const bestNeedPlayer = sortedNeedPlayers[0];
    const tierInfo = this.getPlayerTierInfo(bestNeedPlayer);

    return {
      player: bestNeedPlayer,
      confidence: 0.8,
      reasoning: `Addresses top roster need (${topNeed.position}) with ${topNeed.slotsNeeded} slots needed`,
      type: 'NEED',
      valueVsADP: 0,
      positionRank: this.getPositionRank(bestNeedPlayer, availablePlayers),
      tierInfo
    };
  }

  /**
   * Get best value pick relative to ADP
   */
  private getBestValue(availablePlayers: Player[], currentPick: number): DraftRecommendation | null {
    const valuePickCandidates = availablePlayers
      .filter(p => p.adp && p.adp > currentPick + 5); // Players falling below ADP
    const sortedValueCandidates = [...valuePickCandidates]
      .sort((a, b) => ((b.adp || 0) - currentPick) - ((a.adp || 0) - currentPick));

    if (sortedValueCandidates.length === 0) return null;

    const valuePlayer = sortedValueCandidates[0];
    const adpDiff = (valuePlayer.adp || 0) - currentPick;
    const tierInfo = this.getPlayerTierInfo(valuePlayer);

    return {
      player: valuePlayer,
      confidence: 0.85,
      reasoning: `Excellent value - ADP ${valuePlayer.adp} at pick ${currentPick} (+${adpDiff})`,
      type: 'VALUE',
      valueVsADP: adpDiff,
      positionRank: this.getPositionRank(valuePlayer, availablePlayers),
      tierInfo
    };
  }

  /**
   * Get highest upside player based on risk tolerance
   */
  private getBestUpside(availablePlayers: Player[], riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH'): DraftRecommendation | null {
    // Filter by age and situation for upside
    const upsideCandidates = availablePlayers.filter(player => {
      if (riskTolerance === 'LOW') return (player.age || 30) <= 27;
      if (riskTolerance === 'MEDIUM') return (player.age || 30) <= 29;
      return true; // High tolerance includes all ages
    });

    if (upsideCandidates.length === 0) return null;

    // Sort by combination of youth and talent (inverse ADP with age bonus)
    const sortedUpsideCandidates = [...upsideCandidates]
      .sort((a, b) => {
        const aScore = (1000 - (a.adp || 999)) + ((30 - (a.age || 30)) * 10);
        const bScore = (1000 - (b.adp || 999)) + ((30 - (b.age || 30)) * 10);
        return bScore - aScore;
      });
    const upsidePlayer = sortedUpsideCandidates[0];

    const tierInfo = this.getPlayerTierInfo(upsidePlayer);

    return {
      player: upsidePlayer,
      confidence: 0.7,
      reasoning: `High upside pick - Age ${upsidePlayer.age}, favorable situation`,
      type: 'UPSIDE',
      valueVsADP: 0,
      positionRank: this.getPositionRank(upsidePlayer, availablePlayers),
      tierInfo
    };
  }

  /**
   * Get safest pick (avoid injury-prone, prefer veterans)
   */
  private getSafestPick(availablePlayers: Player[], avoidInjuryProne: boolean): DraftRecommendation | null {
    let safeCandidates = [...availablePlayers];

    if (avoidInjuryProne) {
      // Filter out players with injury history
      safeCandidates = safeCandidates.filter(player => 
        !player.injuryHistory || player.injuryHistory.length === 0
      );
    }

    // Prefer players aged 25-29 (prime years)
    const primeAgePlayers = safeCandidates
      .filter(p => (p.age || 30) >= 24 && (p.age || 30) <= 30);
    const sortedPrimePlayers = [...primeAgePlayers].sort((a, b) => (a.adp || 999) - (b.adp || 999));
    const sortedSafeCandidates = [...safeCandidates].sort((a, b) => (a.adp || 999) - (b.adp || 999));
    
    const safePlayer = sortedPrimePlayers[0] || sortedSafeCandidates[0];

    if (!safePlayer) return null;

    const tierInfo = this.getPlayerTierInfo(safePlayer);

    return {
      player: safePlayer,
      confidence: 0.9,
      reasoning: `Safe pick - Proven production, minimal injury risk`,
      type: 'SAFE',
      valueVsADP: 0,
      positionRank: this.getPositionRank(safePlayer, availablePlayers),
      tierInfo
    };
  }

  /**
   * Get player tier information
   */
  private getPlayerTierInfo(player: Player): { tier: number; playersLeftInTier: number; nextTierDrop: number } {
    const positionTiers = this.playerTiers.get(player.position) || [];
    
    for (let i = 0; i < positionTiers.length; i++) {
      const tier = positionTiers[i];
      const playerIndex = tier.findIndex(p => p.id === player.id);
      
      if (playerIndex !== -1) {
        const playersLeftInTier = tier.length - playerIndex - 1;
        const lastPlayerADP = tier[tier.length - 1].adp || 0;
        const nextTierFirstADP = positionTiers[i + 1]?.[0]?.adp || 0;
        const nextTierDrop = positionTiers[i + 1] ? lastPlayerADP - nextTierFirstADP : 0;
        
        return {
          tier: i + 1,
          playersLeftInTier,
          nextTierDrop
        };
      }
    }

    return { tier: 99, playersLeftInTier: 0, nextTierDrop: 0 };
  }

  /**
   * Get position rank among available players
   */
  private getPositionRank(player: Player, availablePlayers: Player[]): number {
    const positionPlayers = availablePlayers
      .filter(p => p.position === player.position)
      .sort((a, b) => (a.adp || 999) - (b.adp || 999));
    
    return positionPlayers.findIndex(p => p.id === player.id) + 1;
  }

  /**
   * Get strategy weight for recommendation sorting
   */
  private getStrategyWeight(type: string, strategy: string): number {
    const weights: { [key: string]: { [key: string]: number } } = {
      'BPA': { 'BPA': 1.0, 'NEED': 0.7, 'VALUE': 0.8, 'UPSIDE': 0.6, 'SAFE': 0.8 },
      'POSITIONAL_NEED': { 'BPA': 0.7, 'NEED': 1.0, 'VALUE': 0.6, 'UPSIDE': 0.5, 'SAFE': 0.9 },
      'VALUE_BASED': { 'BPA': 0.8, 'NEED': 0.6, 'VALUE': 1.0, 'UPSIDE': 0.9, 'SAFE': 0.7 },
      'CONSERVATIVE': { 'BPA': 0.9, 'NEED': 0.8, 'VALUE': 0.7, 'UPSIDE': 0.3, 'SAFE': 1.0 },
      'AGGRESSIVE': { 'BPA': 0.7, 'NEED': 0.5, 'VALUE': 0.9, 'UPSIDE': 1.0, 'SAFE': 0.4 }
    };

    return weights[strategy]?.[type] || 0.5;
  }

  /**
   * Get AI recommendation from top candidates
   */
  private async getAIPickRecommendation(
    team: Team,
    candidates: DraftRecommendation[],
    config: AutoDraftConfig
  ): Promise<DraftRecommendation | null> {
    try {
      const aiChoice = await getAiDraftPick(team, candidates.map(c => c.player));
      
      const chosenCandidate = candidates.find(c => c.player.name === aiChoice);
      return chosenCandidate || null;
    } catch (error) {
      console.error('AI pick recommendation failed:', error);
      return null;
    }
  }

  /**
   * Fallback to best available player
   */
  private getBestAvailablePlayer(availablePlayers: Player[], currentPick: number): DraftRecommendation | null {
    if (availablePlayers.length === 0) return null;

    const sortedPlayers = [...availablePlayers].sort((a, b) => (a.adp || 999) - (b.adp || 999));
    const bestPlayer = sortedPlayers[0];

    return {
      player: bestPlayer,
      confidence: 0.8,
      reasoning: 'Fallback: Best available player by ADP',
      type: 'BPA',
      valueVsADP: 0,
      positionRank: 1,
      tierInfo: { tier: 1, playersLeftInTier: 0, nextTierDrop: 0 }
    };
  }

  /**
   * Analyze snake draft position and optimize turn strategy
   */
  analyzeSnakeDraftPosition(
    draftPosition: number,
    totalTeams: number,
    currentRound: number
  ): SnakeDraftOptimization {
    const currentPick = this.calculatePickNumber(draftPosition, currentRound, totalTeams);
    const nextPick = this.calculateNextPickNumber(draftPosition, currentRound, totalTeams);
    
    return {
      turnAnalysis: {
        pickNumber: currentPick,
        round: currentRound,
        position: this.getDraftPositionType(draftPosition, totalTeams),
        nextPickIn: nextPick - currentPick,
        strategicValue: this.calculateStrategicValue(draftPosition, currentRound, totalTeams),
        recommendations: this.getPositionalRecommendations(draftPosition, currentRound, totalTeams)
      },
      valueDropoffs: this.analyzeValueDropoffs(currentPick),
      pickTrading: {
        suggestedTrades: this.analyzeDraftPickTrades(draftPosition, currentRound, totalTeams),
        optimalDraftPosition: this.calculateOptimalDraftPosition(totalTeams)
      }
    };
  }

  /**
   * Calculate overall pick number in snake draft
   */
  private calculatePickNumber(draftPosition: number, round: number, totalTeams: number): number {
    if (round % 2 === 1) {
      // Odd rounds: normal order
      return (round - 1) * totalTeams + draftPosition;
    } else {
      // Even rounds: reverse order
      return (round - 1) * totalTeams + (totalTeams - draftPosition + 1);
    }
  }

  /**
   * Calculate next pick number for the same team
   */
  private calculateNextPickNumber(draftPosition: number, round: number, totalTeams: number): number {
    return this.calculatePickNumber(draftPosition, round + 1, totalTeams);
  }

  /**
   * Determine draft position type
   */
  private getDraftPositionType(position: number, totalTeams: number): 'EARLY' | 'MIDDLE' | 'LATE' {
    if (position <= Math.ceil(totalTeams / 3)) return 'EARLY';
    if (position <= Math.ceil(totalTeams * 2 / 3)) return 'MIDDLE';
    return 'LATE';
  }

  /**
   * Calculate strategic value of current pick
   */
  private calculateStrategicValue(position: number, round: number, totalTeams: number): number {
    const pickNumber = this.calculatePickNumber(position, round, totalTeams);
    const nextPickNumber = this.calculateNextPickNumber(position, round, totalTeams);
    
    const currentValue = this.valueMatrix.get(pickNumber) || 0;
    
    // Higher strategic value for positions with shorter waits between picks
    const waitFactor = 1 / (nextPickNumber - pickNumber);
    return currentValue * (1 + waitFactor);
  }

  /**
   * Get positional recommendations based on draft position
   */
  private getPositionalRecommendations(position: number, round: number, totalTeams: number): string[] {
    const positionType = this.getDraftPositionType(position, totalTeams);
    const recommendations: string[] = [];

    if (round === 1) {
      switch (positionType) {
        case 'EARLY':
          recommendations.push('Target top-tier RB or elite WR');
          recommendations.push('Consider positional scarcity');
          break;
        case 'MIDDLE':
          recommendations.push('Balance between RB and WR');
          recommendations.push('Target players with gap to next pick');
          break;
        case 'LATE':
          recommendations.push('Consider back-to-back strategy');
          recommendations.push('Target complementary positions');
          break;
      }
    } else if (round <= 3) {
      recommendations.push('Fill core skill positions (RB/WR)');
      recommendations.push('Avoid QB/TE unless elite value');
    } else if (round <= 6) {
      recommendations.push('Balance roster construction');
      recommendations.push('Consider QB if needed');
    }

    return recommendations;
  }

  /**
   * Analyze value dropoffs at each position
   */
  private analyzeValueDropoffs(currentPick: number): SnakeDraftOptimization['valueDropoffs'] {
    const positions: PlayerPosition[] = ['QB', 'RB', 'WR', 'TE'];
    const dropoffs: SnakeDraftOptimization['valueDropoffs'] = [];

    positions.forEach(position => {
      const tiers = this.playerTiers.get(position) || [];
      let playersUntilDrop = 0;
      let nextTierDrop = 0;
      let shouldReach = false;

      // Find current tier and next tier drop
      for (let i = 0; i < tiers.length - 1; i++) {
        const currentTier = tiers[i];
        const nextTier = tiers[i + 1];
        
        const lastPlayerInTier = currentTier[currentTier.length - 1];
        const firstPlayerInNextTier = nextTier[0];
        
        if ((lastPlayerInTier.adp || 0) >= currentPick) {
          playersUntilDrop = currentTier.filter(p => (p.adp || 0) >= currentPick).length;
          nextTierDrop = (firstPlayerInNextTier.adp || 0) - (lastPlayerInTier.adp || 0);
          shouldReach = nextTierDrop > 20; // Significant tier drop
          break;
        }
      }

      dropoffs.push({
        position,
        nextTierDrop,
        playersUntilDrop,
        shouldReach
      });
    });

    return dropoffs;
  }

  /**
   * Analyze potential draft pick trades
   */
  private analyzeDraftPickTrades(
    draftPosition: number,
    currentRound: number,
    totalTeams: number
  ): DraftPickTrade[] {
    const trades: DraftPickTrade[] = [];
    const currentPick = this.calculatePickNumber(draftPosition, currentRound, totalTeams);
    const currentValue = this.valueMatrix.get(currentPick) || 0;

    // Analyze trading up
    for (let targetPick = Math.max(1, currentPick - 10); targetPick < currentPick; targetPick++) {
      const targetValue = this.valueMatrix.get(targetPick) || 0;
      const valueGap = targetValue - currentValue;
      
      if (valueGap > 50) { // Significant value difference
        const nextRoundPick = this.calculateNextPickNumber(draftPosition, currentRound, totalTeams);
        const compensationValue = this.valueMatrix.get(nextRoundPick) || 0;
        
        if (compensationValue >= valueGap * 0.6) { // Reasonable compensation
          trades.push({
            givesPicks: [currentPick, nextRoundPick],
            receivesPicks: [targetPick],
            valueGained: targetValue - currentValue - compensationValue,
            rationale: `Trade up to secure top-tier player before tier break`
          });
        }
      }
    }

    // Analyze trading down
    for (let targetPick = currentPick + 1; targetPick <= currentPick + 15; targetPick++) {
      const targetValue = this.valueMatrix.get(targetPick) || 0;
      const valueLoss = currentValue - targetValue;
      
      if (valueLoss < 100) { // Acceptable value loss
        const additionalPick = targetPick + 24; // Next round equivalent
        const additionalValue = this.valueMatrix.get(additionalPick) || 0;
        
        if (additionalValue >= valueLoss * 1.2) { // Good compensation
          trades.push({
            givesPicks: [currentPick],
            receivesPicks: [targetPick, additionalPick],
            valueGained: targetValue + additionalValue - currentValue,
            rationale: `Trade down to accumulate picks while maintaining value`
          });
        }
      }
    }

    return trades.slice(0, 3); // Return top 3 trade suggestions
  }

  /**
   * Calculate optimal draft position
   */
  private calculateOptimalDraftPosition(totalTeams: number): number {
    // Generally positions 3-5 are considered optimal in 12-team leagues
    const optimalRange = Math.ceil(totalTeams * 0.25); // Top 25%
    return Math.min(optimalRange, 5);
  }

  /**
   * Generate keeper league recommendations
   */
  generateKeeperRecommendations(
    team: Team,
    eligibleKeepers: KeeperPlayer[],
    config: KeeperLeagueConfig
  ): {
    recommendedKeepers: KeeperPlayer[];
    droppedKeepers: KeeperPlayer[];
    analysis: string;
    totalKeeperCost: number;
  } {
    // Sort keepers by value vs cost
    const sortedKeepers = [...eligibleKeepers].sort((a, b) => b.keeperValue - a.keeperValue);
    const keepersByValue = sortedKeepers;

    const recommendedKeepers: KeeperPlayer[] = [];
    const droppedKeepers: KeeperPlayer[] = [];
    let totalCost = 0;

    // Select best value keepers up to maximum
    for (const keeper of keepersByValue) {
      if (recommendedKeepers.length < config.maxKeepers) {
        if (config.salaryCapEnabled && config.salaryCap) {
          if (totalCost + keeper.keeperCost <= config.salaryCap * 0.7) { // Reserve 30% for draft
            recommendedKeepers.push(keeper);
            totalCost += keeper.keeperCost;
          } else {
            droppedKeepers.push(keeper);
          }
        } else {
          recommendedKeepers.push(keeper);
          totalCost += keeper.keeperCost;
        }
      } else {
        droppedKeepers.push(keeper);
      }
    }

    // Generate analysis
    const analysis = this.generateKeeperAnalysis(recommendedKeepers, droppedKeepers, config);

    return {
      recommendedKeepers,
      droppedKeepers,
      analysis,
      totalKeeperCost: totalCost
    };
  }

  /**
   * Generate keeper analysis text
   */
  private generateKeeperAnalysis(
    recommended: KeeperPlayer[],
    dropped: KeeperPlayer[],
    config: KeeperLeagueConfig
  ): string {
    const lines: string[] = [];
    
    lines.push(`Keeping ${recommended.length}/${config.maxKeepers} eligible players.`);
    
    if (recommended.length > 0) {
      const avgValue = recommended.reduce((sum, k) => sum + k.keeperValue, 0) / recommended.length;
      lines.push(`Average keeper value: ${avgValue.toFixed(1)} points above cost.`);
      
      const topKeeper = recommended[0];
      lines.push(`Best keeper: ${topKeeper.name} (${topKeeper.keeperValue.toFixed(1)} value).`);
    }
    
    if (dropped.length > 0) {
      const topDropped = dropped[0];
      lines.push(`Top dropped player: ${topDropped.name} (cost vs value not favorable).`);
    }

    return lines.join(' ');
  }

  /**
   * Calculate post-draft analytics
   */
  calculateDraftAnalytics(
    team: Team,
    draftPicks: DraftPick[],
    league: League
  ): DraftAnalytics {
    const teamPicks = draftPicks.filter(pick => pick.teamId === team.id);
    const draftedPlayers = teamPicks
      .map(pick => players.find(p => p.id === pick.playerId))
      .filter((p): p is Player => p !== undefined);

    // Calculate efficiency score
    const totalADP = draftedPlayers.reduce((sum, player) => sum + (player.adp || 999), 0);
    const averagePickPosition = teamPicks.reduce((sum, pick) => sum + pick.overall, 0) / teamPicks.length;
    const efficiencyScore = Math.max(0, 100 - ((totalADP / teamPicks.length) - averagePickPosition));

    // Identify value picks and reaches
    const valuePicks = teamPicks.filter(pick => {
      const player = players.find(p => p.id === pick.playerId);
      return player?.adp && player.adp > pick.overall + 10;
    });

    const reaches = teamPicks.filter(pick => {
      const player = players.find(p => p.id === pick.playerId);
      return player?.adp && player.adp < pick.overall - 10;
    });

    const steals = teamPicks.filter(pick => {
      const player = players.find(p => p.id === pick.playerId);
      return player?.adp && player.adp > pick.overall + 20;
    });

    // Position analysis
    const positionDrafted = draftedPlayers.reduce((counts, player) => {
      counts[player.position] = (counts[player.position] || 0) + 1;
      return counts;
    }, {} as { [key in PlayerPosition]: number });

    // Calculate roster balance (deviation from ideal composition)
    const idealComposition = { QB: 2, RB: 5, WR: 6, TE: 2, K: 1, DST: 1 };
    const balanceScore = Object.entries(idealComposition).reduce((score, [pos, ideal]) => {
      const actual = positionDrafted[pos as PlayerPosition] || 0;
      const deviation = Math.abs(actual - ideal) / ideal;
      return score + (1 - deviation);
    }, 0) / Object.keys(idealComposition).length;

    // Calculate upside and floor
    const upside = draftedPlayers.reduce((sum, player) => {
      // Young players and those with opportunity add upside
      const ageBonus = Math.max(0, (30 - (player.age || 30)) / 10);
      return sum + ageBonus;
    }, 0) / draftedPlayers.length;

    const floor = draftedPlayers.reduce((sum, player) => {
      // Experienced players with consistent production add floor
      const experienceBonus = Math.min(1, ((player.age || 25) - 22) / 8);
      return sum + experienceBonus;
    }, 0) / draftedPlayers.length;

    // Mock championship probability (would need more complex modeling)
    const championshipProbability = Math.min(100, efficiencyScore + (balanceScore * 20) + (upside * 10));

    return {
      efficiencyScore,
      valuePicks,
      reaches,
      steals,
      positionDrafted,
      averageADP: totalADP / teamPicks.length,
      rosterBalance: balanceScore,
      upside,
      floor,
      championshipProbability
    };
  }
}

// Create singleton instance
export const enhancedDraftEngine = new EnhancedDraftEngine();

// Export utility functions
export const getDraftRecommendations = (
  team: Team,
  availablePlayers: Player[],
  config: AutoDraftConfig,
  currentPick: number,
  totalRounds: number = 16
) => enhancedDraftEngine.getPickRecommendations(
  availablePlayers,
  team.roster || [],
  currentPick,
  totalRounds,
  config
);

export const getSnakeDraftAnalysis = (
  draftPosition: number,
  totalTeams: number,
  currentRound: number
) => enhancedDraftEngine.analyzeSnakeDraftPosition(draftPosition, totalTeams, currentRound);

export const getKeeperRecommendations = (
  team: Team,
  keepers: KeeperPlayer[],
  config: KeeperLeagueConfig
) => enhancedDraftEngine.generateKeeperRecommendations(team, keepers, config);

export const getDraftAnalytics = (
  team: Team,
  draftPicks: DraftPick[],
  league: League
) => enhancedDraftEngine.calculateDraftAnalytics(team, draftPicks, league);
