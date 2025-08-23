/**
 * Celebrity Draft Personas Service
 * AI-powered draft strategies mimicking celebrity approaches
 */

import { Player, PlayerPosition } from '../types';

export interface CelebrityPersona {
  id: string;
  name: string;
  avatar?: string;
  description: string;
  draftPhilosophy: string;
  strategies: {
    positionPreference: PlayerPosition[];
    playerTraits: string[];
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    valuationFactors: {
      factor: string;
      weight: number;
    }[];
  };
  catchPhrases: string[];
  draftTips: string[];
}

export const CELEBRITY_PERSONAS: CelebrityPersona[] = [
  {
    id: 'tom-brady',
    name: 'Tom Brady',
    description: 'The GOAT - Values proven winners and championship experience',
    draftPhilosophy: 'Championships are won with smart, clutch players who perform when it matters most',
    strategies: {
      positionPreference: ['QB', 'WR', 'TE', 'RB'],
      playerTraits: ['proven-veteran', 'clutch-performer', 'high-football-iq', 'leadership', 'playoff-experience'],
      riskTolerance: 'conservative',
      valuationFactors: [
        { factor: 'championship_experience', weight: 0.25 },
        { factor: 'consistency', weight: 0.30 },
        { factor: 'veteran_presence', weight: 0.20 },
        { factor: 'system_fit', weight: 0.15 },
        { factor: 'injury_history', weight: -0.10 }
      ]
    },
    catchPhrases: [
      "This guy's a winner - reminds me of my Super Bowl teams",
      "You need players who show up in December",
      "Leadership matters as much as talent",
      "I'd take this guy to war with me"
    ],
    draftTips: [
      "Never undervalue experience in crucial situations",
      "Target players from winning organizations",
      "Prioritize consistency over boom/bust potential",
      "Build around a strong QB-WR connection"
    ]
  },
  {
    id: 'peyton-manning',
    name: 'Peyton Manning',
    description: 'The Cerebral One - Analytics-heavy, loves high-IQ players',
    draftPhilosophy: 'Study the numbers, understand the matchups, and always be three moves ahead',
    strategies: {
      positionPreference: ['QB', 'WR', 'RB', 'TE'],
      playerTraits: ['high-target-share', 'route-running', 'pass-catching-rb', 'efficient', 'smart'],
      riskTolerance: 'moderate',
      valuationFactors: [
        { factor: 'yards_after_catch', weight: 0.20 },
        { factor: 'target_share', weight: 0.25 },
        { factor: 'red_zone_usage', weight: 0.20 },
        { factor: 'offensive_system', weight: 0.25 },
        { factor: 'quarterback_quality', weight: 0.10 }
      ]
    },
    catchPhrases: [
      "The analytics love this pick - 87.3% success rate",
      "Omaha! This player fits perfectly in their system",
      "Look at those third-down conversion rates",
      "His DVOA is off the charts"
    ],
    draftTips: [
      "Focus on players in high-volume passing offenses",
      "Target share is more predictive than total yards",
      "Red zone opportunities win championships",
      "Stack QB-WR combos for ceiling plays"
    ]
  },
  {
    id: 'michael-jordan',
    name: 'Michael Jordan',
    description: 'His Airness - Competitive players, clutch performers, winners',
    draftPhilosophy: 'I don\'t draft good players, I draft killers who want to win at all costs',
    strategies: {
      positionPreference: ['RB', 'WR', 'QB', 'TE'],
      playerTraits: ['alpha-mentality', 'clutch-gene', 'competitor', 'athletic-freak', 'winner'],
      riskTolerance: 'aggressive',
      valuationFactors: [
        { factor: 'fourth_quarter_performance', weight: 0.25 },
        { factor: 'primetime_games', weight: 0.20 },
        { factor: 'athletic_score', weight: 0.20 },
        { factor: 'competitive_drive', weight: 0.25 },
        { factor: 'big_play_ability', weight: 0.10 }
      ]
    },
    catchPhrases: [
      "This kid's got that killer instinct",
      "And I took that personally... drafting him",
      "Champions are built different",
      "He reminds me of myself - refuses to lose"
    ],
    draftTips: [
      "Draft players who elevate in big moments",
      "Athletic ability creates mismatches",
      "Mental toughness beats talent",
      "Target players with chips on their shoulders"
    ]
  },
  {
    id: 'lebron-james',
    name: 'LeBron James',
    description: 'The King - Athletic freaks, versatile players, high upside',
    draftPhilosophy: 'Give me athletes who can do it all - they\'ll find a way to produce',
    strategies: {
      positionPreference: ['RB', 'WR', 'TE', 'QB'],
      playerTraits: ['versatile', 'athletic', 'dual-threat', 'yac-ability', 'multi-position'],
      riskTolerance: 'moderate',
      valuationFactors: [
        { factor: 'athletic_measurables', weight: 0.30 },
        { factor: 'versatility', weight: 0.25 },
        { factor: 'age', weight: 0.15 },
        { factor: 'upside', weight: 0.20 },
        { factor: 'team_situation', weight: 0.10 }
      ]
    },
    catchPhrases: [
      "This guy can play multiple positions - that's valuable",
      "Built different - look at those combine numbers",
      "He's got that next-level athleticism",
      "Young talent with room to grow - I like it"
    ],
    draftTips: [
      "Prioritize players who contribute in multiple ways",
      "Athletic testing correlates with breakout potential",
      "Target ascending players in improving offenses",
      "Don't overlook dual-threat QBs and pass-catching RBs"
    ]
  },
  {
    id: 'patrick-mahomes',
    name: 'Patrick Mahomes',
    description: 'Showtime - Young talent, explosive players, risk-takers',
    draftPhilosophy: 'No risk it, no biscuit - swing for the fences and create fireworks',
    strategies: {
      positionPreference: ['WR', 'QB', 'TE', 'RB'],
      playerTraits: ['explosive', 'big-play', 'young-talent', 'upside', 'breakout-candidate'],
      riskTolerance: 'aggressive',
      valuationFactors: [
        { factor: 'explosive_play_rate', weight: 0.30 },
        { factor: 'age_breakout_potential', weight: 0.25 },
        { factor: 'deep_ball_ability', weight: 0.20 },
        { factor: 'yards_per_touch', weight: 0.15 },
        { factor: 'highlight_potential', weight: 0.10 }
      ]
    },
    catchPhrases: [
      "This guy can take it to the house any play",
      "Speed kills - and he's got jets",
      "Young hungry player ready to explode",
      "That's a league-winner right there"
    ],
    draftTips: [
      "Target second and third-year breakouts",
      "Speed and explosiveness create weekly ceiling",
      "Don't be afraid of high-risk, high-reward picks",
      "Stack explosive offenses for maximum upside"
    ]
  },
  {
    id: 'bill-belichick',
    name: 'Bill Belichick',
    description: 'The Hoodie - Value picks, system fits, depth over stars',
    draftPhilosophy: 'Do your job - find value where others don\'t look and build sustainable depth',
    strategies: {
      positionPreference: ['RB', 'WR', 'TE', 'DST'],
      playerTraits: ['system-fit', 'value', 'consistent', 'situational', 'depth'],
      riskTolerance: 'conservative',
      valuationFactors: [
        { factor: 'value_over_adp', weight: 0.35 },
        { factor: 'role_security', weight: 0.25 },
        { factor: 'system_familiarity', weight: 0.20 },
        { factor: 'special_teams_value', weight: 0.10 },
        { factor: 'injury_risk', weight: -0.10 }
      ]
    },
    catchPhrases: [
      "Great value at this spot",
      "He does his job, nothing flashy",
      "System players win games",
      "We're on to the next pick"
    ],
    draftTips: [
      "Find value in later rounds",
      "Target players with secure roles",
      "Build depth at every position",
      "Don't chase last year's stats"
    ]
  },
  {
    id: 'travis-kelce',
    name: 'Travis Kelce',
    description: 'The Showman - TE-heavy, receiving backs, pass-catchers',
    draftPhilosophy: 'Dominate the middle of the field with elite pass-catchers',
    strategies: {
      positionPreference: ['TE', 'WR', 'RB', 'QB'],
      playerTraits: ['pass-catching', 'red-zone-target', 'reliable-hands', 'route-runner', 'mismatch'],
      riskTolerance: 'moderate',
      valuationFactors: [
        { factor: 'targets_per_game', weight: 0.30 },
        { factor: 'red_zone_targets', weight: 0.25 },
        { factor: 'catch_rate', weight: 0.20 },
        { factor: 'slot_usage', weight: 0.15 },
        { factor: 'quarterback_rapport', weight: 0.10 }
      ]
    },
    catchPhrases: [
      "Elite tight ends are like cheat codes",
      "Pass-catching backs are the new meta",
      "This guy's always open - trust me",
      "Red zone monster right here"
    ],
    draftTips: [
      "Premium TEs provide positional advantage",
      "Target pass-catching specialists",
      "Red zone usage equals fantasy points",
      "PPR leagues favor volume receivers"
    ]
  },
  {
    id: 'shaquille-oneal',
    name: 'Shaquille O\'Neal',
    description: 'The Diesel - Big personalities, power runners, dominant players',
    draftPhilosophy: 'Dominate with power - give me the big dogs who punish defenses',
    strategies: {
      positionPreference: ['RB', 'TE', 'DST', 'QB'],
      playerTraits: ['power-runner', 'physical', 'dominant', 'personality', 'intimidating'],
      riskTolerance: 'aggressive',
      valuationFactors: [
        { factor: 'yards_after_contact', weight: 0.30 },
        { factor: 'goal_line_carries', weight: 0.25 },
        { factor: 'physical_dominance', weight: 0.20 },
        { factor: 'personality_factor', weight: 0.15 },
        { factor: 'broken_tackles', weight: 0.10 }
      ]
    },
    catchPhrases: [
      "BBQ chicken! This guy dominates",
      "That's a bad man right there",
      "Power football wins championships",
      "He's got that dawg in him"
    ],
    draftTips: [
      "Physical runners wear down defenses",
      "Goal line backs score TDs",
      "Personality and swagger matter",
      "Dominate the trenches, dominate the game"
    ]
  },
  {
    id: 'charles-barkley',
    name: 'Charles Barkley',
    description: 'Sir Charles - Gut feelings, entertainment value, bold picks',
    draftPhilosophy: 'Trust your gut, have fun, and don\'t be afraid to go against the grain',
    strategies: {
      positionPreference: ['RB', 'WR', 'QB', 'TE'],
      playerTraits: ['entertaining', 'boom-bust', 'personality', 'underdog', 'sleeper'],
      riskTolerance: 'aggressive',
      valuationFactors: [
        { factor: 'gut_feeling', weight: 0.30 },
        { factor: 'entertainment_value', weight: 0.20 },
        { factor: 'underdog_story', weight: 0.20 },
        { factor: 'boom_potential', weight: 0.20 },
        { factor: 'contrarian_value', weight: 0.10 }
      ]
    },
    catchPhrases: [
      "That's turrible analysis - I'm taking him anyway",
      "My gut says this is the pick",
      "Everybody's wrong about this guy",
      "Guaranteed league winner - Guaaaranteed!"
    ],
    draftTips: [
      "Sometimes you gotta trust your instincts",
      "Don't follow the herd mentality",
      "Bold picks win championships",
      "Have fun with it - it's just a game"
    ]
  },
  {
    id: 'stephen-curry',
    name: 'Stephen Curry',
    description: 'Chef Curry - Efficiency metrics, three-down backs, consistency',
    draftPhilosophy: 'Efficiency is everything - find players who maximize every opportunity',
    strategies: {
      positionPreference: ['WR', 'RB', 'QB', 'TE'],
      playerTraits: ['efficient', 'consistent', 'three-down-back', 'high-floor', 'reliable'],
      riskTolerance: 'moderate',
      valuationFactors: [
        { factor: 'yards_per_touch', weight: 0.25 },
        { factor: 'snap_share', weight: 0.25 },
        { factor: 'efficiency_metrics', weight: 0.20 },
        { factor: 'consistency_score', weight: 0.20 },
        { factor: 'opportunity_share', weight: 0.10 }
      ]
    },
    catchPhrases: [
      "Efficiency wins games - this guy delivers",
      "Three-down backs are gold in fantasy",
      "Consistency beats boom-bust every time",
      "Night night - this pick is automatic"
    ],
    draftTips: [
      "Target players with high snap counts",
      "Efficiency metrics predict success",
      "Consistent floor with upside wins leagues",
      "Opportunity plus efficiency equals production"
    ]
  }
];

export class CelebrityPersonaEngine {
  private selectedPersona: CelebrityPersona | null = null;

  selectPersona(personaId: string): CelebrityPersona | null {
    this.selectedPersona = CELEBRITY_PERSONAS.find(p => p.id === personaId) || null;
    return this.selectedPersona;
  }

  getPersonaRecommendation(
    availablePlayers: Player[],
    currentRoster: Player[],
    pickNumber: number
  ): {
    recommendedPlayer: Player | null;
    reasoning: string;
    confidence: number;
    catchPhrase: string;
  } {
    if (!this.selectedPersona) {
      return {
        recommendedPlayer: null,
        reasoning: 'No persona selected',
        confidence: 0,
        catchPhrase: ''
      };
    }

    // Score each available player based on persona preferences
    const scoredPlayers = availablePlayers.map(player => {
      let score = 0;
      const reasons: string[] = [];

      // Position preference scoring
      const positionIndex = this.selectedPersona!.strategies.positionPreference.indexOf(player.position);
      if (positionIndex !== -1) {
        score += (4 - positionIndex) * 25;
        reasons.push(`Preferred position (${player.position})`);
      }

      // Value vs ADP scoring
      if (player.adp && player.adp > pickNumber) {
        const valueDiff = player.adp - pickNumber;
        score += Math.min(valueDiff * 2, 40);
        reasons.push(`Great value (ADP: ${player.adp})`);
      }

      // Risk tolerance adjustment
      if (this.selectedPersona!.strategies.riskTolerance === 'conservative') {
        if (player.injuryStatus === 'healthy') score += 20;
        if (player.yearsExperience && player.yearsExperience > 3) score += 15;
      } else if (this.selectedPersona!.strategies.riskTolerance === 'aggressive') {
        if (player.upside === 'high') score += 25;
        if (player.age && player.age < 25) score += 15;
      }

      // Apply persona-specific factors
      this.selectedPersona!.strategies.valuationFactors.forEach(factor => {
        // Simplified scoring based on factor names
        switch (factor.factor) {
          case 'consistency':
            if (player.consistency === 'high') score += 30 * factor.weight;
            break;
          case 'upside':
            if (player.upside === 'high') score += 30 * factor.weight;
            break;
          case 'age':
            if (player.age && player.age < 26) score += 25 * factor.weight;
            break;
          case 'veteran_presence':
            if (player.yearsExperience && player.yearsExperience > 5) score += 25 * factor.weight;
            break;
        }
      });

      return {
        player,
        score,
        reasons
      };
    });

    // Sort by score and get top recommendation
    scoredPlayers.sort((a, b) => b.score - a.score);
    const topPick = scoredPlayers[0];

    if (!topPick || topPick.score === 0) {
      return {
        recommendedPlayer: null,
        reasoning: 'No suitable players match persona preferences',
        confidence: 0,
        catchPhrase: ''
      };
    }

    // Calculate confidence based on score differential
    const confidence = Math.min(
      topPick.score / 100,
      scoredPlayers.length > 1 
        ? 0.5 + (topPick.score - scoredPlayers[1].score) / 100
        : 0.8
    );

    // Select a random catch phrase
    const catchPhrase = this.selectedPersona.catchPhrases[
      Math.floor(Math.random() * this.selectedPersona.catchPhrases.length)
    ];

    return {
      recommendedPlayer: topPick.player,
      reasoning: topPick.reasons.join(', '),
      confidence,
      catchPhrase
    };
  }

  getPersonaTip(): string {
    if (!this.selectedPersona) return '';
    return this.selectedPersona.draftTips[
      Math.floor(Math.random() * this.selectedPersona.draftTips.length)
    ];
  }
}