/**
 * Genius AI Assistant Service
 * Advanced fantasy football draft intelligence with natural language understanding
 */

import { Player, PlayerPosition, Team, League } from '../types';

export interface AssistantQuery {
  question: string;
  context: {
    currentRoster: Player[];
    availablePlayers: Player[];
    currentRound: number;
    currentPick: number;
    leagueSettings: any;
    draftHistory: any[];
  };
}

export interface AssistantResponse {
  answer: string;
  recommendations: Player[];
  insights: string[];
  confidence: number;
  followUpQuestions?: string[];
}

export interface RosterAnalysis {
  strengths: string[];
  weaknesses: string[];
  positionNeeds: PlayerPosition[];
  rosterBalance: number;
  projectedPoints: number;
  playoffProbability: number;
}

export interface PlayerComparison {
  player1: Player;
  player2: Player;
  recommendation: 'player1' | 'player2' | 'either';
  reasoning: string;
  keyDifferences: string[];
}

export class GeniusAiAssistant {
  private queryPatterns = {
    sleeper: /sleeper|undervalued|hidden gem|value pick/i,
    weakness: /weakness|need|lacking|missing|hole/i,
    pairing: /pair|stack|combo|match|complement/i,
    reach: /reach|early|too soon|wait/i,
    schedule: /schedule|playoff|weeks? \d+|matchup/i,
    boomBust: /boom|bust|ceiling|floor|variance|volatile/i,
    winner: /winner|championship|league winner|best overall/i,
    strategy: /zero.?rb|hero.?rb|strategy|approach/i,
    adp: /adp|value|outscore|bargain|steal/i,
    handcuff: /handcuff|backup|insurance|cuff/i,
    comparison: /vs|versus|or|better|compare/i,
    trade: /trade|swap|exchange|deal/i,
    injury: /injury|injured|health|risk/i,
    breakout: /breakout|emerge|explode|surprise/i,
    bust: /bust|avoid|overrated|fade|stay away/i
  };

  async processQuery(query: AssistantQuery): Promise<AssistantResponse> {
    const { question, context } = query;
    const lowerQuestion = question.toLowerCase();

    // Identify query type
    if (this.queryPatterns.sleeper.test(lowerQuestion)) {
      return this.findSleepers(context);
    }
    
    if (this.queryPatterns.weakness.test(lowerQuestion)) {
      return this.analyzeRosterWeakness(context);
    }
    
    if (this.queryPatterns.pairing.test(lowerQuestion)) {
      return this.findOptimalPairings(context);
    }
    
    if (this.queryPatterns.schedule.test(lowerQuestion)) {
      return this.analyzeSchedules(context);
    }
    
    if (this.queryPatterns.boomBust.test(lowerQuestion)) {
      return this.findBoomBustPlayers(context);
    }
    
    if (this.queryPatterns.winner.test(lowerQuestion)) {
      return this.identifyLeagueWinners(context);
    }
    
    if (this.queryPatterns.strategy.test(lowerQuestion)) {
      return this.buildDraftStrategy(context, lowerQuestion);
    }
    
    if (this.queryPatterns.adp.test(lowerQuestion)) {
      return this.findAdpValues(context);
    }
    
    if (this.queryPatterns.handcuff.test(lowerQuestion)) {
      return this.findHandcuffs(context);
    }
    
    if (this.queryPatterns.comparison.test(lowerQuestion)) {
      return this.comparePlayers(context, lowerQuestion);
    }
    
    if (this.queryPatterns.breakout.test(lowerQuestion)) {
      return this.identifyBreakouts(context);
    }
    
    if (this.queryPatterns.bust.test(lowerQuestion)) {
      return this.identifyBusts(context);
    }

    // Default comprehensive analysis
    return this.provideGeneralRecommendation(context);
  }

  private findSleepers(context: any): AssistantResponse {
    const { availablePlayers, currentPick } = context;
    
    // Find players with ADP significantly higher than current pick
    const sleepers = availablePlayers
      .filter((player: Player) => {
        if (!player.adp) return false;
        const adpDiff = player.adp - currentPick;
        return adpDiff > 20 && player.projectedPoints > 150;
      })
      .sort((a: Player, b: Player) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
      .slice(0, 5);

    const bestSleeper = sleepers[0];
    
    return {
      answer: bestSleeper 
        ? `My top sleeper pick is **${bestSleeper.name}** (${bestSleeper.position}, ${bestSleeper.team}). Currently going ${bestSleeper.adp! - currentPick} picks later than we are now, but projected for ${bestSleeper.projectedPoints} points. Excellent value at this spot.`
        : "No clear sleepers available at this pick. Most players are appropriately valued.",
      recommendations: sleepers,
      insights: [
        `Best RB sleeper: ${sleepers.find(p => p.position === 'RB')?.name || 'None available'}`,
        `Best WR sleeper: ${sleepers.find(p => p.position === 'WR')?.name || 'None available'}`,
        `Look for players in improved offensive situations`,
        `Target players with new coaching staffs or QB upgrades`
      ],
      confidence: sleepers.length > 0 ? 0.85 : 0.6,
      followUpQuestions: [
        "Would you like sleepers at a specific position?",
        "Should I focus on high-upside or safe-floor sleepers?",
        "Want to see late-round sleepers instead?"
      ]
    };
  }

  private analyzeRosterWeakness(context: any): AssistantResponse {
    const { currentRoster } = context;
    const analysis = this.performRosterAnalysis(currentRoster);
    
    const primaryNeed = analysis.positionNeeds[0];
    const recommendations = context.availablePlayers
      .filter((p: Player) => p.position === primaryNeed)
      .sort((a: Player, b: Player) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
      .slice(0, 3);

    return {
      answer: `Your biggest roster weakness is at **${primaryNeed}**. ${analysis.weaknesses[0]}. I recommend targeting a ${primaryNeed} with your next pick.`,
      recommendations,
      insights: analysis.weaknesses,
      confidence: 0.9,
      followUpQuestions: [
        `Should I show you the best available ${primaryNeed}s?`,
        "Would you prefer to address this need now or wait?",
        "Want to see a full roster analysis?"
      ]
    };
  }

  private findOptimalPairings(context: any): AssistantResponse {
    const { currentRoster, availablePlayers } = context;
    
    // Find QB-WR stacks or RB-DEF correlations
    const qbs = currentRoster.filter((p: Player) => p.position === 'QB');
    const recommendations: Player[] = [];
    const insights: string[] = [];

    if (qbs.length > 0) {
      const qbTeam = qbs[0].team;
      const teamWRs = availablePlayers
        .filter((p: Player) => p.position === 'WR' && p.team === qbTeam)
        .sort((a: Player, b: Player) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
        .slice(0, 2);
      
      recommendations.push(...teamWRs);
      insights.push(`Stack ${qbs[0].name} with his WR for correlation`);
    }

    // Find complementary RBs
    const rbs = currentRoster.filter((p: Player) => p.position === 'RB');
    if (rbs.length === 1) {
      const hasPassCatcher = rbs[0].receptions && rbs[0].receptions > 50;
      const complementType = hasPassCatcher ? 'power-runner' : 'pass-catching';
      insights.push(`Look for a ${complementType} RB to complement ${rbs[0].name}`);
    }

    return {
      answer: recommendations.length > 0
        ? `I recommend pairing with **${recommendations[0].name}** to create a powerful stack with your ${qbs[0]?.name || 'current roster'}.`
        : "Focus on best player available rather than forcing a pairing at this point.",
      recommendations,
      insights,
      confidence: 0.75,
      followUpQuestions: [
        "Want to see more stacking options?",
        "Should I find players with complementary bye weeks?",
        "Interested in negative correlation plays?"
      ]
    };
  }

  private analyzeSchedules(context: any): AssistantResponse {
    const { availablePlayers } = context;
    
    // Analyze strength of schedule for fantasy playoffs (weeks 15-17)
    const playoffFriendly = availablePlayers
      .filter((p: Player) => {
        // Simplified - would normally check actual schedule data
        return p.scheduleStrength && p.scheduleStrength.playoff === 'easy';
      })
      .slice(0, 5);

    return {
      answer: "Players with the easiest playoff schedules (Weeks 15-17) include top options at each position. Target players facing weaker defenses during your league's playoff weeks.",
      recommendations: playoffFriendly,
      insights: [
        "RBs facing bottom-10 run defenses in playoffs are gold",
        "WRs with 3+ dome games in playoffs have higher floors",
        "Avoid players with Week 14 byes if playoffs start then",
        "Consider handcuffing RBs with great playoff schedules"
      ],
      confidence: 0.8,
      followUpQuestions: [
        "Want to see position-specific playoff schedules?",
        "Should I analyze specific weeks?",
        "Interested in regular season schedule strength?"
      ]
    };
  }

  private findBoomBustPlayers(context: any): AssistantResponse {
    const { availablePlayers } = context;
    
    const boomPlayers = availablePlayers
      .filter((p: Player) => p.consistency === 'low' && p.upside === 'high')
      .sort((a: Player, b: Player) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
      .slice(0, 5);

    const safePlayers = availablePlayers
      .filter((p: Player) => p.consistency === 'high')
      .sort((a: Player, b: Player) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
      .slice(0, 3);

    return {
      answer: `For boom potential, target **${boomPlayers[0]?.name || 'No clear options'}**. For consistency, go with **${safePlayers[0]?.name || 'No clear options'}**. Your roster construction should determine which you need.`,
      recommendations: [...boomPlayers.slice(0, 3), ...safePlayers.slice(0, 2)],
      insights: [
        "Boom/bust players win weeks but can sink you",
        "Mix high-floor and high-ceiling players",
        "Target boom/bust as FLEX options, not core starters",
        "Deep-threat WRs and goal-line RBs are classic boom/bust"
      ],
      confidence: 0.82,
      followUpQuestions: [
        "Do you prefer ceiling or floor at this point?",
        "Want to see weekly variance data?",
        "Should I factor in your current roster's consistency?"
      ]
    };
  }

  private identifyLeagueWinners(context: any): AssistantResponse {
    const { availablePlayers, currentPick } = context;
    
    // Find players with league-winning upside
    const potentialWinners = availablePlayers
      .filter((p: Player) => {
        const hasUpside = p.upside === 'high';
        const goodValue = p.adp ? p.adp > currentPick : false;
        const youngTalent = p.age ? p.age <= 26 : false;
        return hasUpside && (goodValue || youngTalent);
      })
      .sort((a: Player, b: Player) => {
        const aScore = (a.projectedPoints || 0) * (a.upside === 'high' ? 1.2 : 1);
        const bScore = (b.projectedPoints || 0) * (b.upside === 'high' ? 1.2 : 1);
        return bScore - aScore;
      })
      .slice(0, 5);

    return {
      answer: `My top league-winner candidate is **${potentialWinners[0]?.name || 'Not found'}**. This player has the perfect combination of opportunity, talent, and situation to potentially finish as the overall RB1/WR1.`,
      recommendations: potentialWinners,
      insights: [
        "League winners often come from rounds 3-7",
        "Look for ascending players in year 2 or 3",
        "Target lead backs in improved offenses",
        "WRs who become the true WR1 in their offense",
        "Players with ambiguous ADP often provide value"
      ],
      confidence: 0.78,
      followUpQuestions: [
        "Want league-winner candidates by position?",
        "Should I include rookies with upside?",
        "Interested in late-round league winners?"
      ]
    };
  }

  private buildDraftStrategy(context: any, question: string): AssistantResponse {
    const strategies = {
      'zero-rb': {
        name: 'Zero-RB Strategy',
        approach: 'Load up on elite WRs and TEs early, grab RBs in middle/late rounds',
        targets: ['WR', 'WR', 'TE', 'WR', 'QB', 'RB', 'RB'],
        insights: [
          "Target pass-catching RBs in PPR",
          "Focus on committee backs with upside",
          "Handcuff lottery tickets are key",
          "Your WR corps should be elite"
        ]
      },
      'hero-rb': {
        name: 'Hero-RB Strategy',
        approach: 'One elite RB, then WRs, then value RBs',
        targets: ['RB', 'WR', 'WR', 'WR', 'TE', 'RB', 'QB'],
        insights: [
          "Get one locked-in RB1",
          "Hammer WR in rounds 2-5",
          "Find RB value in rounds 6-9",
          "More balanced than Zero-RB"
        ]
      },
      'robust-rb': {
        name: 'Robust-RB Strategy',
        approach: 'Load up on RBs early and often',
        targets: ['RB', 'RB', 'RB', 'WR', 'WR', 'TE', 'QB'],
        insights: [
          "Control the RB position",
          "Trade RB depth for WRs later",
          "Works best in standard scoring",
          "Limits roster flexibility"
        ]
      }
    };

    let selectedStrategy = strategies['hero-rb']; // default
    
    if (question.includes('zero')) {
      selectedStrategy = strategies['zero-rb'];
    } else if (question.includes('robust')) {
      selectedStrategy = strategies['robust-rb'];
    }

    const positionTargets = selectedStrategy.targets[Math.min(context.currentRound - 1, 6)];
    const recommendations = context.availablePlayers
      .filter((p: Player) => p.position === positionTargets)
      .sort((a: Player, b: Player) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
      .slice(0, 5);

    return {
      answer: `For **${selectedStrategy.name}**: ${selectedStrategy.approach}. In round ${context.currentRound}, target a ${positionTargets}.`,
      recommendations,
      insights: selectedStrategy.insights,
      confidence: 0.88,
      followUpQuestions: [
        "Want me to map out your next 3 picks?",
        "Should I adjust for your league settings?",
        "Interested in alternative strategies?"
      ]
    };
  }

  private findAdpValues(context: any): AssistantResponse {
    const { availablePlayers, currentPick } = context;
    
    const valuePickstrackers = availablePlayers
      .filter((p: Player) => p.adp && p.adp > currentPick + 10)
      .map((p: Player) => ({
        player: p,
        valueScore: (p.adp! - currentPick) * (p.projectedPoints || 100) / 100
      }))
      .sort((a: any, b: any) => b.valueScore - a.valueScore)
      .slice(0, 5)
      .map((item: any) => item.player);

    return {
      answer: valuePickstrackers.length > 0
        ? `Best value: **${valuePickstrackers[0].name}** (ADP: ${valuePickstrackers[0].adp}, Current Pick: ${currentPick}). Getting them ${valuePickstrackers[0].adp! - currentPick} picks early!`
        : "No significant ADP values available at this pick.",
      recommendations: valuePickstrackers,
      insights: [
        "ADP value doesn't always mean good pick",
        "Consider why player is falling",
        "Best values often found in rounds 4-8",
        "Rookie ADP can be volatile and create value"
      ],
      confidence: 0.83,
      followUpQuestions: [
        "Want values at a specific position?",
        "Should I show players going 2+ rounds early?",
        "Interested in ADP risers to avoid?"
      ]
    };
  }

  private findHandcuffs(context: any): AssistantResponse {
    const { currentRoster, availablePlayers } = context;
    
    const myRBs = currentRoster.filter((p: Player) => p.position === 'RB');
    const handcuffs: Player[] = [];
    const insights: string[] = [];

    // Find handcuffs for user's RBs
    myRBs.forEach((rb: Player) => {
      const teamBackups = availablePlayers.filter(
        (p: Player) => p.position === 'RB' && p.team === rb.team && p.id !== rb.id
      );
      if (teamBackups.length > 0) {
        handcuffs.push(teamBackups[0]);
        insights.push(`${teamBackups[0].name} handcuffs ${rb.name}`);
      }
    });

    // Find valuable handcuffs in general
    const valuableHandcuffs = availablePlayers
      .filter((p: Player) => p.role === 'backup' && p.handcuffValue === 'high')
      .slice(0, 3);
    
    handcuffs.push(...valuableHandcuffs);

    return {
      answer: handcuffs.length > 0
        ? `Priority handcuff: **${handcuffs[0].name}**. ${insights[0] || 'High-value backup with standalone value or injury upside.'}`
        : "No critical handcuffs needed at this point. Focus on starters.",
      recommendations: handcuffs,
      insights: [
        ...insights,
        "Handcuff your RB1 in rounds 10+",
        "Some handcuffs have standalone value",
        "Elite handcuffs can win leagues",
        "Consider handcuffing injury-prone starters"
      ],
      confidence: 0.79,
      followUpQuestions: [
        "Should I prioritize my own handcuffs?",
        "Want high-upside handcuffs regardless of roster?",
        "Interested in handcuffs with standalone value?"
      ]
    };
  }

  private comparePlayers(context: any, question: string): AssistantResponse {
    // Extract player names from question
    const { availablePlayers } = context;
    
    // This is simplified - would need better name extraction
    const words = question.split(' ');
    const playerNames = words.filter(w => w.length > 3 && w[0] === w[0].toUpperCase());
    
    if (playerNames.length < 2) {
      return this.provideGeneralRecommendation(context);
    }

    // Find matching players
    const player1 = availablePlayers.find((p: Player) => 
      p.name.toLowerCase().includes(playerNames[0].toLowerCase())
    );
    const player2 = availablePlayers.find((p: Player) => 
      p.name.toLowerCase().includes(playerNames[1].toLowerCase())
    );

    if (!player1 || !player2) {
      return this.provideGeneralRecommendation(context);
    }

    const comparison = this.comparePlayersDirectly(player1, player2);

    return {
      answer: `Between ${player1.name} and ${player2.name}, I recommend **${comparison.recommendation === 'player1' ? player1.name : player2.name}**. ${comparison.reasoning}`,
      recommendations: [
        comparison.recommendation === 'player1' ? player1 : player2,
        comparison.recommendation === 'player1' ? player2 : player1
      ],
      insights: comparison.keyDifferences,
      confidence: 0.85,
      followUpQuestions: [
        "Want to compare different players?",
        "Should I factor in your roster needs?",
        "Interested in a deeper statistical comparison?"
      ]
    };
  }

  private identifyBreakouts(context: any): AssistantResponse {
    const { availablePlayers } = context;
    
    const breakoutCandidates = availablePlayers
      .filter((p: Player) => {
        const secondOrThirdYear = p.yearsExperience && p.yearsExperience >= 2 && p.yearsExperience <= 3;
        const youngAge = p.age && p.age <= 25;
        const improvingSituation = p.situationChange === 'improved';
        return (secondOrThirdYear || youngAge) && improvingSituation;
      })
      .sort((a: Player, b: Player) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
      .slice(0, 5);

    return {
      answer: breakoutCandidates.length > 0
        ? `Top breakout candidate: **${breakoutCandidates[0].name}**. Perfect storm of youth, opportunity, and improved situation.`
        : "Limited breakout candidates available at this point.",
      recommendations: breakoutCandidates,
      insights: [
        "Year 2 WRs and Year 3 RBs break out most often",
        "New coaching staff can unlock player potential",
        "Increased target share is predictive",
        "Players who flashed late last season",
        "Athletic profile matters for breakouts"
      ],
      confidence: 0.76,
      followUpQuestions: [
        "Want position-specific breakout candidates?",
        "Should I include rookies?",
        "Interested in deep sleeper breakouts?"
      ]
    };
  }

  private identifyBusts(context: any): AssistantResponse {
    const { availablePlayers, currentPick } = context;
    
    const bustCandidates = availablePlayers
      .filter((p: Player) => {
        if (!p.adp) return false;
        const overdrafted = p.adp < currentPick - 10;
        const injuryRisk = p.injuryStatus === 'questionable' || p.injuryHistory === 'extensive';
        const declining = p.age && p.age > 29 && p.position === 'RB';
        return overdrafted && (injuryRisk || declining);
      })
      .slice(0, 5);

    return {
      answer: bustCandidates.length > 0
        ? `Avoid: **${bustCandidates[0].name}** at their ADP. Significant risk factors present.`
        : "No obvious bust candidates to avoid at this pick range.",
      recommendations: [], // Don't recommend busts
      insights: [
        "RBs over 28 with 300+ carries last year",
        "Players with new QBs in worse situations",
        "Injury-prone players going at ceiling price",
        "One-year wonders without underlying metrics",
        "Players losing target share to new additions"
      ],
      confidence: 0.74,
      followUpQuestions: [
        "Want bust alerts for specific positions?",
        "Should I explain the risk factors?",
        "Interested in fade candidates by round?"
      ]
    };
  }

  private provideGeneralRecommendation(context: any): AssistantResponse {
    const { availablePlayers, currentRoster } = context;
    const analysis = this.performRosterAnalysis(currentRoster);
    
    // Get best available at each position
    const bestByPosition = new Map<PlayerPosition, Player>();
    for (const player of availablePlayers) {
      if (!bestByPosition.has(player.position) || 
          (player.projectedPoints || 0) > (bestByPosition.get(player.position)?.projectedPoints || 0)) {
        bestByPosition.set(player.position, player);
      }
    }

    const recommendations = Array.from(bestByPosition.values())
      .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
      .slice(0, 5);

    return {
      answer: `Based on your roster needs and available players, I recommend **${recommendations[0]?.name || 'Best Player Available'}**. This addresses your need at ${analysis.positionNeeds[0] || 'flex positions'} while providing excellent value.`,
      recommendations,
      insights: [
        `Primary need: ${analysis.positionNeeds[0] || 'Best Player Available'}`,
        `Roster strength: ${analysis.strengths[0] || 'Balanced roster'}`,
        "Don't force positional needs over value",
        "Consider upcoming bye weeks",
        "Think 2-3 picks ahead"
      ],
      confidence: 0.7,
      followUpQuestions: [
        "Want a detailed roster analysis?",
        "Should I show tier breakdowns?",
        "Need help with a specific decision?"
      ]
    };
  }

  private performRosterAnalysis(roster: Player[]): RosterAnalysis {
    const positionCounts = new Map<PlayerPosition, number>();
    const positionQuality = new Map<PlayerPosition, number>();
    
    // Count positions and assess quality
    roster.forEach(player => {
      positionCounts.set(player.position, (positionCounts.get(player.position) || 0) + 1);
      positionQuality.set(
        player.position, 
        (positionQuality.get(player.position) || 0) + (player.projectedPoints || 0)
      );
    });

    // Determine needs based on standard roster requirements
    const requirements = {
      QB: 1,
      RB: 2,
      WR: 2,
      TE: 1,
      K: 1,
      DST: 1
    };

    const positionNeeds: PlayerPosition[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    for (const [position, required] of Object.entries(requirements)) {
      const count = positionCounts.get(position as PlayerPosition) || 0;
      if (count < required) {
        positionNeeds.push(position as PlayerPosition);
        weaknesses.push(`Need ${required - count} more ${position}`);
      } else if (count > required) {
        strengths.push(`Deep at ${position} (${count} rostered)`);
      }
    }

    // Calculate projected points and balance
    const totalProjected = Array.from(positionQuality.values()).reduce((a, b) => a + b, 0);
    const balance = 1 - (Math.max(...Array.from(positionQuality.values())) / totalProjected);

    return {
      strengths: strengths.length > 0 ? strengths : ['Balanced roster construction'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['No glaring weaknesses'],
      positionNeeds,
      rosterBalance: balance,
      projectedPoints: totalProjected,
      playoffProbability: totalProjected > 1500 ? 0.75 : totalProjected > 1200 ? 0.5 : 0.25
    };
  }

  private comparePlayersDirectly(player1: Player, player2: Player): PlayerComparison {
    const keyDifferences: string[] = [];
    let player1Score = 0;
    let player2Score = 0;

    // Compare projected points
    if ((player1.projectedPoints || 0) > (player2.projectedPoints || 0)) {
      player1Score += 2;
      keyDifferences.push(`${player1.name} projects for ${((player1.projectedPoints || 0) - (player2.projectedPoints || 0)).toFixed(1)} more points`);
    } else {
      player2Score += 2;
      keyDifferences.push(`${player2.name} projects for ${((player2.projectedPoints || 0) - (player1.projectedPoints || 0)).toFixed(1)} more points`);
    }

    // Compare consistency
    if (player1.consistency === 'high' && player2.consistency !== 'high') {
      player1Score += 1;
      keyDifferences.push(`${player1.name} is more consistent week-to-week`);
    } else if (player2.consistency === 'high' && player1.consistency !== 'high') {
      player2Score += 1;
      keyDifferences.push(`${player2.name} is more consistent week-to-week`);
    }

    // Compare age/upside
    if (player1.age && player2.age) {
      if (player1.age < player2.age - 2) {
        player1Score += 1;
        keyDifferences.push(`${player1.name} is ${player2.age - player1.age} years younger`);
      } else if (player2.age < player1.age - 2) {
        player2Score += 1;
        keyDifferences.push(`${player2.name} is ${player1.age - player2.age} years younger`);
      }
    }

    // Compare ADP value
    if (player1.adp && player2.adp) {
      if (player1.adp > player2.adp) {
        player1Score += 1;
        keyDifferences.push(`${player1.name} is better value (ADP ${player1.adp} vs ${player2.adp})`);
      } else {
        player2Score += 1;
        keyDifferences.push(`${player2.name} is better value (ADP ${player2.adp} vs ${player1.adp})`);
      }
    }

    const recommendation = player1Score > player2Score ? 'player1' : 
                          player2Score > player1Score ? 'player2' : 'either';
    
    const reasoning = player1Score > player2Score 
      ? `${player1.name} offers better overall value with higher projection and ${keyDifferences[0]}`
      : player2Score > player1Score
      ? `${player2.name} is the superior choice with ${keyDifferences[0]}`
      : "Both players offer similar value - choose based on roster construction";

    return {
      player1,
      player2,
      recommendation,
      reasoning,
      keyDifferences
    };
  }

  generateContextualTips(context: any): string[] {
    const tips: string[] = [];
    const { currentRound, currentRoster } = context;

    // Round-specific tips
    if (currentRound <= 2) {
      tips.push("Focus on securing elite talent - position scarcity matters less early");
    } else if (currentRound <= 5) {
      tips.push("This is the sweet spot for WR value in most drafts");
    } else if (currentRound <= 8) {
      tips.push("Start thinking about your QB if you haven't already");
    } else if (currentRound <= 12) {
      tips.push("Time for upside swings and handcuff lottery tickets");
    } else {
      tips.push("Target high-upside rookies and backups to elite players");
    }

    // Roster construction tips
    const rbCount = currentRoster.filter((p: Player) => p.position === 'RB').length;
    const wrCount = currentRoster.filter((p: Player) => p.position === 'WR').length;
    
    if (rbCount < 2) {
      tips.push("You need at least 2 starting RBs - prioritize the position");
    }
    if (wrCount < 2) {
      tips.push("Shore up your WR corps - you need reliable weekly starters");
    }
    if (rbCount + wrCount < 5) {
      tips.push("Build your RB/WR core before targeting other positions");
    }

    return tips;
  }
}