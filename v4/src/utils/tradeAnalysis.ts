/**
 * Trade Analysis Utilities
 * Advanced analytics and validation for trades
 */

import type { Player, PlayerStats, PlayerProjection } from '@prisma/client';

export interface TradeAssets {
  playerIds: string[];
  draftPicks: DraftPick[];
}

export interface DraftPick {
  round: number;
  year: number;
  originalOwner?: string;
}

export interface EnrichedPlayer extends Player {
  stats?: PlayerStats[];
  projections?: PlayerProjection[];
  recentPerformance?: {
    averagePoints: number;
    trend: 'up' | 'down' | 'stable';
    consistency: number;
  };
}

export interface TradeAnalysis {
  initiatorValue: number;
  partnerValue: number;
  fairnessScore: number; // 0-100, 50 is perfectly fair
  initiatorGrade: string; // A+ to F
  partnerGrade: string;
  winProbabilityImpact: {
    initiator: number; // Change in win probability
    partner: number;
  };
  positionImpact: {
    initiator: PositionImpact;
    partner: PositionImpact;
  };
  recommendations: string[];
  warnings: string[];
}

interface PositionImpact {
  improved: string[];
  weakened: string[];
  depth: Record<string, number>;
}

/**
 * Calculate the total value of trade assets
 */
export function calculateTradeValue(
  players: EnrichedPlayer[],
  draftPicks: DraftPick[],
  leagueSettings: {
    scoringType: string;
    currentWeek: number;
    rosterPositions: Record<string, number>;
  }
): number {
  let totalValue = 0;

  // Calculate player values
  for (const player of players) {
    const playerValue = calculatePlayerValue(player, leagueSettings);
    totalValue += playerValue;
  }

  // Calculate draft pick values
  for (const pick of draftPicks) {
    const pickValue = calculateDraftPickValue(pick, leagueSettings.currentWeek);
    totalValue += pickValue;
  }

  return totalValue;
}

/**
 * Calculate individual player value
 */
export function calculatePlayerValue(
  player: EnrichedPlayer,
  leagueSettings: {
    scoringType: string;
    currentWeek: number;
    rosterPositions: Record<string, number>;
  }
): number {
  let baseValue = 0;

  // Position scarcity multiplier
  const positionMultiplier = getPositionScarcityMultiplier(
    player.position,
    leagueSettings.rosterPositions
  );

  // Recent performance (last 5 games)
  if (player.stats && player.stats.length > 0) {
    const recentStats = player.stats.slice(0, 5);
    const avgPoints = recentStats.reduce((sum, stat) => sum + stat.fantasyPoints, 0) / recentStats.length;
    baseValue = avgPoints * 10; // Base value from recent performance
  }

  // Future projections (rest of season)
  if (player.projections && player.projections.length > 0) {
    const futureProjections = player.projections;
    const projectedTotal = futureProjections.reduce((sum, proj) => sum + proj.projectedPoints, 0);
    baseValue = (baseValue + projectedTotal) / 2; // Average of past and future
  }

  // Adjust for injuries
  if (player.injuryStatus && player.injuryStatus !== 'ACTIVE') {
    baseValue *= getInjuryMultiplier(player.injuryStatus);
  }

  // Adjust for remaining games
  const remainingWeeks = 17 - leagueSettings.currentWeek;
  baseValue *= (remainingWeeks / 17);

  // Apply position scarcity
  baseValue *= positionMultiplier;

  // Scoring type adjustment
  if (leagueSettings.scoringType === 'PPR' && ['WR', 'RB', 'TE'].includes(player.position)) {
    baseValue *= 1.1; // 10% boost for pass catchers in PPR
  }

  return Math.round(baseValue);
}

/**
 * Calculate draft pick value
 */
export function calculateDraftPickValue(
  pick: DraftPick,
  currentWeek: number
): number {
  // Base values for each round (assumes 10-team league)
  const roundValues: Record<number, number> = {
    1: 1000,
    2: 700,
    3: 500,
    4: 350,
    5: 250,
    6: 180,
    7: 130,
    8: 90,
    9: 60,
    10: 40,
    11: 25,
    12: 15,
    13: 10,
    14: 5,
    15: 3,
    16: 1
  };

  let value = roundValues[pick.round] || 1;

  // Adjust for year (future picks worth less)
  const currentYear = new Date().getFullYear();
  const yearDifference = pick.year - currentYear;
  if (yearDifference > 0) {
    value *= Math.pow(0.85, yearDifference); // 15% discount per year
  }

  // Mid-season adjustment (picks worth more as season progresses)
  if (currentWeek > 8) {
    value *= 1.2; // 20% premium for picks in second half of season
  }

  return Math.round(value);
}

/**
 * Get position scarcity multiplier
 */
function getPositionScarcityMultiplier(
  position: string,
  rosterPositions: Record<string, number>
): number {
  const scarcityMap: Record<string, number> = {
    'QB': 1.2,  // Scarce elite QBs
    'RB': 1.3,  // Most scarce position
    'WR': 1.0,  // Baseline
    'TE': 1.15, // Scarce elite TEs
    'K': 0.5,   // Replaceable
    'DEF': 0.6, // Replaceable
    'FLEX': 0.9
  };

  return scarcityMap[position] || 1.0;
}

/**
 * Get injury status multiplier
 */
function getInjuryMultiplier(status: string): number {
  const injuryMap: Record<string, number> = {
    'QUESTIONABLE': 0.85,
    'DOUBTFUL': 0.5,
    'OUT': 0.3,
    'IR': 0.1,
    'SUSPENDED': 0.2
  };

  return injuryMap[status] || 1.0;
}

/**
 * Analyze trade fairness and impact
 */
export function analyzeTrade(
  initiatorGives: { players: EnrichedPlayer[], picks: DraftPick[] },
  initiatorReceives: { players: EnrichedPlayer[], picks: DraftPick[] },
  initiatorRoster: EnrichedPlayer[],
  partnerRoster: EnrichedPlayer[],
  leagueSettings: {
    scoringType: string;
    currentWeek: number;
    rosterPositions: Record<string, number>;
  }
): TradeAnalysis {
  // Calculate values
  const initiatorGivesValue = calculateTradeValue(
    initiatorGives.players,
    initiatorGives.picks,
    leagueSettings
  );

  const initiatorReceivesValue = calculateTradeValue(
    initiatorReceives.players,
    initiatorReceives.picks,
    leagueSettings
  );

  // Calculate fairness
  const valueDifference = Math.abs(initiatorReceivesValue - initiatorGivesValue);
  const averageValue = (initiatorReceivesValue + initiatorGivesValue) / 2;
  const fairnessScore = Math.max(0, 100 - (valueDifference / averageValue) * 100);

  // Calculate grades
  const initiatorGrade = calculateGrade(initiatorReceivesValue, initiatorGivesValue);
  const partnerGrade = calculateGrade(initiatorGivesValue, initiatorReceivesValue);

  // Analyze position impacts
  const initiatorPositionImpact = analyzePositionImpact(
    initiatorRoster,
    initiatorGives.players,
    initiatorReceives.players
  );

  const partnerPositionImpact = analyzePositionImpact(
    partnerRoster,
    initiatorReceives.players,
    initiatorGives.players
  );

  // Calculate win probability impact
  const winProbabilityImpact = calculateWinProbabilityImpact(
    initiatorRoster,
    partnerRoster,
    initiatorGives.players,
    initiatorReceives.players,
    leagueSettings
  );

  // Generate recommendations and warnings
  const { recommendations, warnings } = generateTradeAdvice(
    fairnessScore,
    initiatorPositionImpact,
    partnerPositionImpact,
    initiatorGives,
    initiatorReceives
  );

  return {
    initiatorValue: initiatorReceivesValue,
    partnerValue: initiatorGivesValue,
    fairnessScore,
    initiatorGrade,
    partnerGrade,
    winProbabilityImpact,
    positionImpact: {
      initiator: initiatorPositionImpact,
      partner: partnerPositionImpact
    },
    recommendations,
    warnings
  };
}

/**
 * Calculate trade grade (A+ to F)
 */
function calculateGrade(receivedValue: number, givenValue: number): string {
  const ratio = receivedValue / Math.max(givenValue, 1);
  
  if (ratio >= 1.5) return 'A+';
  if (ratio >= 1.3) return 'A';
  if (ratio >= 1.15) return 'A-';
  if (ratio >= 1.05) return 'B+';
  if (ratio >= 0.95) return 'B';
  if (ratio >= 0.85) return 'B-';
  if (ratio >= 0.75) return 'C+';
  if (ratio >= 0.65) return 'C';
  if (ratio >= 0.55) return 'C-';
  if (ratio >= 0.45) return 'D';
  return 'F';
}

/**
 * Analyze position depth impact
 */
function analyzePositionImpact(
  currentRoster: EnrichedPlayer[],
  playersLost: EnrichedPlayer[],
  playersGained: EnrichedPlayer[]
): PositionImpact {
  const positionDepth: Record<string, number> = {};
  const improved: string[] = [];
  const weakened: string[] = [];

  // Count current position depth
  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
  for (const position of positions) {
    const current = currentRoster.filter(p => p.position === position).length;
    const lost = playersLost.filter(p => p.position === position).length;
    const gained = playersGained.filter(p => p.position === position).length;
    
    positionDepth[position] = current - lost + gained;

    if (gained > lost) {
      improved.push(position);
    } else if (lost > gained) {
      weakened.push(position);
    }
  }

  return { improved, weakened, depth: positionDepth };
}

/**
 * Calculate win probability impact
 */
function calculateWinProbabilityImpact(
  initiatorRoster: EnrichedPlayer[],
  partnerRoster: EnrichedPlayer[],
  initiatorGives: EnrichedPlayer[],
  initiatorReceives: EnrichedPlayer[],
  leagueSettings: any
): { initiator: number; partner: number } {
  // Simplified win probability calculation
  // In production, this would use more sophisticated models

  const initiatorCurrentStrength = calculateRosterStrength(initiatorRoster, leagueSettings);
  const initiatorNewRoster = [
    ...initiatorRoster.filter(p => !initiatorGives.find(g => g.id === p.id)),
    ...initiatorReceives
  ];
  const initiatorNewStrength = calculateRosterStrength(initiatorNewRoster, leagueSettings);

  const partnerCurrentStrength = calculateRosterStrength(partnerRoster, leagueSettings);
  const partnerNewRoster = [
    ...partnerRoster.filter(p => !initiatorReceives.find(r => r.id === p.id)),
    ...initiatorGives
  ];
  const partnerNewStrength = calculateRosterStrength(partnerNewRoster, leagueSettings);

  return {
    initiator: ((initiatorNewStrength - initiatorCurrentStrength) / initiatorCurrentStrength) * 100,
    partner: ((partnerNewStrength - partnerCurrentStrength) / partnerCurrentStrength) * 100
  };
}

/**
 * Calculate roster strength
 */
function calculateRosterStrength(
  roster: EnrichedPlayer[],
  leagueSettings: any
): number {
  return roster.reduce((total, player) => {
    return total + calculatePlayerValue(player, leagueSettings);
  }, 0);
}

/**
 * Generate trade advice
 */
function generateTradeAdvice(
  fairnessScore: number,
  initiatorImpact: PositionImpact,
  partnerImpact: PositionImpact,
  initiatorGives: { players: EnrichedPlayer[], picks: DraftPick[] },
  initiatorReceives: { players: EnrichedPlayer[], picks: DraftPick[] }
): { recommendations: string[]; warnings: string[] } {
  const recommendations: string[] = [];
  const warnings: string[] = [];

  // Fairness warnings
  if (fairnessScore < 30) {
    warnings.push('This trade appears very lopsided and may be vetoed by league members');
  } else if (fairnessScore < 50) {
    warnings.push('This trade favors one side significantly');
  }

  // Position depth warnings
  if (initiatorImpact.weakened.includes('RB') && initiatorImpact.depth['RB'] < 4) {
    warnings.push('Trade leaves initiator thin at RB position');
  }
  if (initiatorImpact.weakened.includes('WR') && initiatorImpact.depth['WR'] < 4) {
    warnings.push('Trade leaves initiator thin at WR position');
  }
  if (initiatorImpact.weakened.includes('QB') && initiatorImpact.depth['QB'] < 2) {
    warnings.push('Trade leaves initiator without QB depth');
  }

  // Injury warnings
  const injuredPlayersReceiving = initiatorReceives.players.filter(
    p => p.injuryStatus && p.injuryStatus !== 'ACTIVE'
  );
  if (injuredPlayersReceiving.length > 0) {
    warnings.push(`Receiving ${injuredPlayersReceiving.length} injured player(s)`);
  }

  // Recommendations
  if (initiatorImpact.improved.includes('RB')) {
    recommendations.push('Trade improves RB depth, a critical position');
  }
  if (initiatorReceives.picks.length > 0) {
    recommendations.push('Acquiring draft capital for future team building');
  }
  if (fairnessScore > 70) {
    recommendations.push('This appears to be a fair trade that could benefit both teams');
  }

  // Check for buy-low candidates
  const buyLowCandidates = initiatorReceives.players.filter(p => {
    if (!p.recentPerformance) return false;
    return p.recentPerformance.trend === 'down' && p.projectedPoints && p.projectedPoints > p.recentPerformance.averagePoints;
  });
  if (buyLowCandidates.length > 0) {
    recommendations.push(`Acquiring ${buyLowCandidates.length} potential buy-low candidate(s)`);
  }

  return { recommendations, warnings };
}

/**
 * Validate trade constraints
 */
export function validateTradeConstraints(
  initiatorRoster: EnrichedPlayer[],
  partnerRoster: EnrichedPlayer[],
  initiatorGives: string[],
  initiatorReceives: string[],
  leagueSettings: {
    maxRosterSize: number;
    rosterPositions: Record<string, number>;
    tradeDeadline?: Date;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check trade deadline
  if (leagueSettings.tradeDeadline && new Date() > leagueSettings.tradeDeadline) {
    errors.push('Trade deadline has passed');
  }

  // Check roster size limits
  const initiatorNewSize = initiatorRoster.length - initiatorGives.length + initiatorReceives.length;
  const partnerNewSize = partnerRoster.length - initiatorReceives.length + initiatorGives.length;

  if (initiatorNewSize > leagueSettings.maxRosterSize) {
    errors.push(`Trade would exceed initiator's maximum roster size of ${leagueSettings.maxRosterSize}`);
  }
  if (partnerNewSize > leagueSettings.maxRosterSize) {
    errors.push(`Trade would exceed partner's maximum roster size of ${leagueSettings.maxRosterSize}`);
  }

  // Check for duplicate players
  const initiatorKeeping = initiatorRoster.filter(p => !initiatorGives.includes(p.id));
  const duplicates = initiatorReceives.filter(id => 
    initiatorKeeping.some(p => p.id === id)
  );
  if (duplicates.length > 0) {
    errors.push('Cannot trade for players already on roster');
  }

  // Check ownership
  const invalidGives = initiatorGives.filter(id => 
    !initiatorRoster.some(p => p.id === id)
  );
  if (invalidGives.length > 0) {
    errors.push('Cannot trade players not on roster');
  }

  const invalidReceives = initiatorReceives.filter(id => 
    !partnerRoster.some(p => p.id === id)
  );
  if (invalidReceives.length > 0) {
    errors.push('Partner does not own all players being received');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate trade suggestions based on team needs
 */
export function generateTradeSuggestions(
  myRoster: EnrichedPlayer[],
  targetRoster: EnrichedPlayer[],
  leagueSettings: any
): Array<{
  give: EnrichedPlayer[];
  receive: EnrichedPlayer[];
  reasoning: string;
  fairnessScore: number;
}> {
  const suggestions: Array<{
    give: EnrichedPlayer[];
    receive: EnrichedPlayer[];
    reasoning: string;
    fairnessScore: number;
  }> = [];

  // Analyze team needs
  const myNeeds = analyzeTeamNeeds(myRoster);
  const targetNeeds = analyzeTeamNeeds(targetRoster);

  // Find mutually beneficial trades
  for (const myNeed of myNeeds) {
    for (const targetNeed of targetNeeds) {
      // Find players to trade
      const myTradeable = myRoster.filter(p => 
        p.position === targetNeed && !isStarter(p, myRoster)
      );
      const targetTradeable = targetRoster.filter(p => 
        p.position === myNeed && !isStarter(p, targetRoster)
      );

      if (myTradeable.length > 0 && targetTradeable.length > 0) {
        // Create trade suggestion
        const give = [myTradeable[0]];
        const receive = [targetTradeable[0]];
        
        const analysis = analyzeTrade(
          { players: give, picks: [] },
          { players: receive, picks: [] },
          myRoster,
          targetRoster,
          leagueSettings
        );

        if (analysis.fairnessScore > 40) {
          suggestions.push({
            give,
            receive,
            reasoning: `Trade depth at ${targetNeed} for need at ${myNeed}`,
            fairnessScore: analysis.fairnessScore
          });
        }
      }
    }
  }

  // Sort by fairness score
  suggestions.sort((a, b) => b.fairnessScore - a.fairnessScore);

  return suggestions.slice(0, 5); // Return top 5 suggestions
}

/**
 * Analyze team needs based on roster composition
 */
function analyzeTeamNeeds(roster: EnrichedPlayer[]): string[] {
  const needs: string[] = [];
  const positionCounts: Record<string, number> = {};

  // Count positions
  for (const player of roster) {
    positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
  }

  // Determine needs based on minimum requirements
  const minimums: Record<string, number> = {
    'QB': 2,
    'RB': 4,
    'WR': 4,
    'TE': 2,
    'K': 1,
    'DEF': 1
  };

  for (const [position, minimum] of Object.entries(minimums)) {
    if ((positionCounts[position] || 0) < minimum) {
      needs.push(position);
    }
  }

  return needs;
}

/**
 * Check if player is a starter
 */
function isStarter(player: EnrichedPlayer, roster: EnrichedPlayer[]): boolean {
  // Simple check - in production would use actual lineup data
  const samePositionPlayers = roster
    .filter(p => p.position === player.position)
    .sort((a, b) => {
      const aValue = a.projectedPoints || 0;
      const bValue = b.projectedPoints || 0;
      return bValue - aValue;
    });

  const starterCounts: Record<string, number> = {
    'QB': 1,
    'RB': 2,
    'WR': 2,
    'TE': 1,
    'K': 1,
    'DEF': 1
  };

  const starterCount = starterCounts[player.position] || 1;
  const playerIndex = samePositionPlayers.findIndex(p => p.id === player.id);

  return playerIndex < starterCount;
}