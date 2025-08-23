/**
 * Oracle Education Service
 * Comprehensive educational content and methodology explanations
 * Helps users understand Oracle prediction algorithms and fantasy football analytics
 */

// Types for educational content
export interface EducationalTopic {
    id: string;
    title: string;
    category: EducationCategory;
    difficulty: DifficultyLevel;
    description: string;
    content: EducationalContent;
    estimatedReadTime: number;
    prerequisites?: string[];
    relatedTopics?: string[];
    lastUpdated: string;
}

export interface EducationalContent {
    introduction: string;
    sections: EducationSection[];
    keyTakeaways: string[];
    practiceExercises?: PracticeExercise[];
    additionalResources?: Resource[];
}

export interface EducationSection {
    id: string;
    title: string;
    content: string;
    examples?: CodeExample[];
    visualAids?: VisualAid[];
    quiz?: QuizQuestion[];
}

export interface CodeExample {
    id: string;
    title: string;
    description: string;
    code: string;
    language: string;
    explanation: string;
}

export interface VisualAid {
    id: string;
    type: 'chart' | 'diagram' | 'infographic' | 'animation';
    title: string;
    description: string;
    data?: any;
    imageUrl?: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer';
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
    points: number;
}

export interface PracticeExercise {
    id: string;
    title: string;
    description: string;
    type: 'prediction' | 'analysis' | 'calculation' | 'simulation';
    difficulty: DifficultyLevel;
    instructions: string[];
    sampleData?: any;
    expectedOutcome: string;
    hints?: string[];
}

export interface Resource {
    id: string;
    title: string;
    type: 'article' | 'video' | 'research-paper' | 'external-link';
    url?: string;
    description: string;
    author?: string;
    publishDate?: string;
}

export interface UserProgress {
    userId: string;
    completedTopics: string[];
    currentTopic?: string;
    quizScores: Record<string, number>;
    practiceResults: Record<string, any>;
    learningPath: string[];
    achievements: string[];
    totalTimeSpent: number;
    lastAccessed: string;
}

export type EducationCategory = 
    | 'ORACLE_BASICS'
    | 'PREDICTION_ALGORITHMS'
    | 'FANTASY_FUNDAMENTALS'
    | 'STATISTICAL_ANALYSIS'
    | 'MACHINE_LEARNING'
    | 'ADVANCED_STRATEGIES'
    | 'DATA_INTERPRETATION'
    | 'CONFIDENCE_CALIBRATION';

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

class OracleEducationService {
    private readonly STORAGE_KEY = 'oracleEducationProgress';
    private readonly topics: Map<string, EducationalTopic> = new Map();
    private userProgress: UserProgress | null = null;

    constructor() {
        this.initializeEducationalContent();
        this.loadUserProgress();
    }

    /**
     * Initialize comprehensive educational content
     */
    private initializeEducationalContent(): void {
        // Oracle Basics Topics
        this.addTopic(this.createOracleIntroductionTopic());
        this.addTopic(this.createPredictionTypesTopic());
        this.addTopic(this.createConfidenceLevelsTopic());
        
        // Fantasy Football Fundamentals
        this.addTopic(this.createFantasyBasicsTopic());
        this.addTopic(this.createScoringSystemsTopic());
        this.addTopic(this.createPlayerAnalysisTopic());
        
        // Prediction Algorithms
        this.addTopic(this.createAlgorithmBasicsTopic());
        this.addTopic(this.createDataSourcesTopic());
        this.addTopic(this.createAIAnalysisTopic());
        
        // Statistical Analysis
        this.addTopic(this.createStatisticalModelingTopic());
        this.addTopic(this.createProbabilityTheoryTopic());
        this.addTopic(this.createPerformanceMetricsTopic());
        
        // Machine Learning
        this.addTopic(this.createMLBasicsTopic());
        this.addTopic(this.createFeatureEngineeringTopic());
        this.addTopic(this.createModelOptimizationTopic());
        
        // Advanced Strategies
        this.addTopic(this.createAdvancedAnalyticsTopic());
        this.addTopic(this.createEnsembleMethodsTopic());
        this.addTopic(this.createMarketSentimentTopic());
    }

    /**
     * Create Oracle Introduction Topic
     */
    private createOracleIntroductionTopic(): EducationalTopic {
        return {
            id: 'oracle-introduction',
            title: 'Introduction to Beat The Oracle',
            category: 'ORACLE_BASICS',
            difficulty: 'BEGINNER',
            description: 'Learn what Oracle is, how it works, and why it\'s revolutionary for fantasy football',
            estimatedReadTime: 8,
            content: {
                introduction: `Beat The Oracle is an AI-powered prediction system that challenges users to outperform sophisticated algorithms in fantasy football predictions. Unlike traditional fantasy advice, Oracle uses real-time data, machine learning, and advanced analytics to make confident predictions about player performance, game outcomes, and fantasy scoring trends.`,
                sections: [
                    {
                        id: 'what-is-oracle',
                        title: 'What is Oracle?',
                        content: `Oracle is an advanced AI system that combines multiple data sources and analytical models to generate predictions about fantasy football outcomes. It processes:

• Live sports data from professional APIs
• Historical player and team performance
• Weather conditions and external factors
• Market sentiment and expert opinions
• Advanced statistical modeling

The system then presents these predictions as challenges where users can test their fantasy football knowledge against AI-powered analysis.`,
                        examples: [
                            {
                                id: 'prediction-example',
                                title: 'Sample Oracle Prediction',
                                description: 'Here\'s how Oracle presents a typical prediction challenge:',
                                code: `{
  "question": "Who will score the most fantasy points this week?",
  "options": [
    { "player": "Josh Allen (BUF)", "probability": 0.34 },
    { "player": "Lamar Jackson (BAL)", "probability": 0.28 },
    { "player": "Jalen Hurts (PHI)", "probability": 0.23 },
    { "player": "Justin Herbert (LAC)", "probability": 0.15 }
  ],
  "oracleChoice": 0,
  "confidence": 87,
  "reasoning": "Josh Allen shows exceptional efficiency metrics..."
}`,
                                language: 'json',
                                explanation: 'Oracle calculates probabilities for each option, makes its choice, and provides confidence levels with detailed reasoning.'
                            }
                        ]
                    },
                    {
                        id: 'how-oracle-works',
                        title: 'How Oracle Makes Predictions',
                        content: `Oracle uses a sophisticated multi-layered approach:

**1. Data Collection**
• Real-time player statistics
• Team performance metrics
• Weather and game conditions
• Injury reports and status updates
• Historical trends and patterns

**2. Advanced Analytics**
• Player Efficiency Ratings (PER)
• Target share analysis
• Team chemistry scores
• Market sentiment analysis
• Weather impact calculations

**3. Machine Learning**
• Ensemble prediction models
• Confidence calibration
• Feature importance analysis
• Continuous model improvement
• Pattern recognition

**4. AI Reasoning**
• Natural language explanations
• Supporting data points
• Confidence assessment
• Risk factor analysis`,
                        visualAids: [
                            {
                                id: 'oracle-workflow',
                                type: 'diagram',
                                title: 'Oracle Prediction Workflow',
                                description: 'Visual representation of how Oracle processes data to generate predictions'
                            }
                        ]
                    },
                    {
                        id: 'why-oracle-matters',
                        title: 'Why Oracle Matters for Fantasy Football',
                        content: `Oracle revolutionizes fantasy football by:

**🎯 Objective Analysis**
• Removes emotional bias from decisions
• Processes vast amounts of data instantly
• Identifies patterns humans might miss
• Provides consistent analytical framework

**📊 Educational Value**
• Learn from AI reasoning and explanations
• Understand which factors matter most
• Improve your own analysis skills
• Challenge your assumptions

**🏆 Competitive Edge**
• Test your knowledge against advanced AI
• Earn achievements and build streaks
• Track improvement over time
• Compete with other users

**🔬 Scientific Approach**
• Data-driven decision making
• Statistical significance testing
• Confidence interval analysis
• Continuous validation and improvement`
                    }
                ],
                keyTakeaways: [
                    'Oracle combines multiple data sources for comprehensive analysis',
                    'AI-powered predictions include confidence levels and detailed reasoning',
                    'The system continuously learns and improves from outcomes',
                    'Oracle challenges help users improve their fantasy football skills',
                    'Predictions are based on objective data rather than subjective opinions'
                ],
                practiceExercises: [
                    {
                        id: 'analyze-prediction',
                        title: 'Analyze an Oracle Prediction',
                        description: 'Practice interpreting Oracle\'s reasoning and confidence levels',
                        type: 'analysis',
                        difficulty: 'BEGINNER',
                        instructions: [
                            'Review the sample prediction provided',
                            'Identify the key factors Oracle considered',
                            'Evaluate whether the confidence level seems appropriate',
                            'Consider what additional factors you might analyze'
                        ],
                        expectedOutcome: 'Understanding of Oracle\'s analytical approach and reasoning process',
                        hints: [
                            'Pay attention to the probability distribution across options',
                            'Consider how confidence relates to the margin between top choices',
                            'Think about what data sources Oracle might be using'
                        ]
                    }
                ]
            },
            relatedTopics: ['prediction-types', 'confidence-levels', 'algorithm-basics'],
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Create Prediction Types Topic
     */
    private createPredictionTypesTopic(): EducationalTopic {
        return {
            id: 'prediction-types',
            title: 'Understanding Oracle Prediction Types',
            category: 'ORACLE_BASICS',
            difficulty: 'BEGINNER',
            description: 'Explore the different types of predictions Oracle makes and their unique characteristics',
            estimatedReadTime: 12,
            prerequisites: ['oracle-introduction'],
            content: {
                introduction: `Oracle generates six distinct types of predictions, each designed to test different aspects of fantasy football knowledge. Understanding these prediction types helps you know what to expect and how to approach each challenge strategically.`,
                sections: [
                    {
                        id: 'player-performance',
                        title: 'Player Performance Predictions',
                        content: `**Focus:** Individual player fantasy scoring potential

**What Oracle Analyzes:**
• Recent performance trends and consistency
• Player Efficiency Ratings (PER) and advanced metrics
• Target share and usage patterns
• Matchup difficulty against opposing defenses
• Team chemistry and offensive scheme fit
• Weather impact on player type (passing vs. rushing)
• Rest days and injury status

**Example Questions:**
• "Who will score the most fantasy points this week?"
• "Which QB will have the highest completion percentage?"
• "Who will lead all RBs in rushing yards?"

**Key Factors Oracle Considers:**
• **Projection Models:** Statistical forecasts based on historical data
• **Advanced Metrics:** PER, target share, air yards, red zone usage
• **Situational Analysis:** Game script, weather, home/away splits
• **Market Sentiment:** Expert opinions and betting line movements`,
                        examples: [
                            {
                                id: 'player-analysis',
                                title: 'Player Performance Analysis',
                                description: 'How Oracle evaluates a top QB for the week',
                                code: `// Oracle's player analysis factors
const playerAnalysis = {
  baseProjection: 24.3,
  efficiencyRating: 18.7,  // Above average (15.0)
  targetShare: 0.31,       // 31% of team targets
  matchupRating: 8.2,      // Favorable matchup (1-10 scale)
  weatherImpact: 0.95,     // Minimal weather impact
  teamChemistry: 88,       // Strong offensive unit
  restDays: 6,            // Standard rest
  confidence: 0.87         // High confidence prediction
};`,
                                language: 'javascript',
                                explanation: 'Oracle weighs multiple factors to arrive at a confidence-adjusted projection for each player.'
                            }
                        ]
                    },
                    {
                        id: 'game-outcome',
                        title: 'Game Outcome Predictions',
                        content: `**Focus:** Team-level performance and game totals

**What Oracle Analyzes:**
• Team offensive and defensive efficiency
• Historical head-to-head performance
• Home field advantage and venue effects
• Pace of play and game script scenarios
• Weather conditions for outdoor games
• Key player availability and depth charts
• Coaching tendencies and game planning

**Example Questions:**
• "Which game will have the highest total score?"
• "Which team will control time of possession?"
• "What will be the margin of victory?"

**Advanced Considerations:**
• **Pace Metrics:** Plays per game, time per drive
• **Efficiency Ratings:** Points per drive, yards per play
• **Situational Performance:** Red zone, third down conversion rates
• **Environmental Factors:** Temperature, wind, precipitation`
                    },
                    {
                        id: 'weekly-scoring',
                        title: 'Weekly Scoring Predictions',
                        content: `**Focus:** Overall fantasy landscape and scoring patterns

**What Oracle Analyzes:**
• League-wide scoring trends and volatility
• Position scarcity and opportunity distribution
• Game environment factors (weather, pace)
• Injury impact on replacement players
• Seasonal timing (early/mid/late season patterns)
• Playoff implications affecting effort levels

**Example Questions:**
• "What will be the highest individual fantasy score?"
• "How many players will score 20+ points?"
• "Which position will have the most variance?"

**Predictive Models:**
• **Historical Benchmarks:** Season averages and distributions
• **Environmental Adjustments:** Weather and pace factors
• **Opportunity Analysis:** Target and carry distributions
• **Variance Modeling:** Boom/bust probability calculations`
                    },
                    {
                        id: 'weather-impact',
                        title: 'Weather Impact Predictions',
                        content: `**Focus:** Environmental effects on fantasy performance

**What Oracle Analyzes:**
• Wind speed and direction effects on passing
• Precipitation impact on ball security and field conditions
• Temperature effects on player performance
• Visibility conditions for passing accuracy
• Historical weather performance by player type

**Example Questions:**
• "Which weather condition will most impact scoring?"
• "How will 20+ mph winds affect the Chiefs vs. Bills game?"
• "Which outdoor games are most weather-dependent?"

**Weather Scoring System:**
• **Wind Impact:** Reduced passing efficiency, increased fumbles
• **Rain/Snow:** Lower completion rates, more rushing attempts
• **Cold Weather:** Reduced fine motor skills, equipment issues
• **Heat:** Increased fatigue, hydration concerns`
                    },
                    {
                        id: 'injury-impact',
                        title: 'Injury Impact Predictions',
                        content: `**Focus:** How injuries affect fantasy landscapes

**What Oracle Analyzes:**
• Injury severity and expected timeline
• Replacement player quality and opportunity
• Positional depth and scheme adjustments
• Historical performance of backup players
• Team offensive philosophy changes

**Example Questions:**
• "Which position will be most affected by injuries?"
• "How will the CMC injury impact 49ers passing game?"
• "Which backup player has the highest upside?"

**Injury Assessment Framework:**
• **Direct Impact:** Missed games and reduced effectiveness
• **Indirect Impact:** Scheme changes and target redistribution
• **Replacement Analysis:** Backup player capabilities
• **Timeline Modeling:** Return probability by week`
                    }
                ],
                keyTakeaways: [
                    'Each prediction type focuses on different aspects of fantasy football',
                    'Oracle uses specialized analytical approaches for each prediction type',
                    'Player performance predictions rely heavily on efficiency metrics and matchups',
                    'Game outcome predictions emphasize team-level analytics and environmental factors',
                    'Weather and injury predictions help identify situational advantages',
                    'Understanding prediction types helps you focus on relevant factors'
                ],
                practiceExercises: [
                    {
                        id: 'classify-predictions',
                        title: 'Classify Prediction Types',
                        description: 'Practice identifying which category different Oracle questions belong to',
                        type: 'analysis',
                        difficulty: 'BEGINNER',
                        instructions: [
                            'Review sample Oracle questions',
                            'Classify each question by prediction type',
                            'Identify the key analytical focus for each type',
                            'Consider what data would be most relevant'
                        ],
                        sampleData: [
                            '"Who will have more receiving yards: Tyreek Hill or Davante Adams?"',
                            '"Will the Packers vs. Lions game go over 52.5 points?"',
                            '"How many QBs will throw for 300+ yards this week?"',
                            '"Will weather impact any games significantly this Sunday?"'
                        ],
                        expectedOutcome: 'Ability to quickly identify prediction types and their analytical focus'
                    }
                ]
            },
            relatedTopics: ['oracle-introduction', 'confidence-levels', 'statistical-modeling'],
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Create Confidence Levels Topic
     */
    private createConfidenceLevelsTopic(): EducationalTopic {
        return {
            id: 'confidence-levels',
            title: 'Oracle Confidence Levels and Calibration',
            category: 'ORACLE_BASICS',
            difficulty: 'INTERMEDIATE',
            description: 'Understand how Oracle calculates and calibrates confidence levels for predictions',
            estimatedReadTime: 15,
            prerequisites: ['oracle-introduction', 'prediction-types'],
            content: {
                introduction: `Oracle's confidence levels are more than just numbers—they represent the system's assessment of prediction reliability based on data quality, model agreement, and historical accuracy. Understanding confidence helps you make strategic decisions about when to challenge Oracle and when to follow its lead.`,
                sections: [
                    {
                        id: 'confidence-calculation',
                        title: 'How Oracle Calculates Confidence',
                        content: `**Base Confidence Factors:**

**1. Data Quality & Completeness**
• Availability of recent performance data
• Injury report clarity and reliability
• Weather forecast accuracy
• Market sentiment data quality

**2. Model Agreement**
• Consensus across multiple prediction models
• Statistical significance of projections
• Margin between top choices
• Historical accuracy for similar scenarios

**3. External Validation**
• Expert opinion alignment
• Betting market correlation
• Social sentiment consistency
• Recent performance trends

**4. Historical Calibration**
• Past accuracy at similar confidence levels
• Seasonal adjustment factors
• Position-specific reliability
• Game context considerations`,
                        examples: [
                            {
                                id: 'confidence-formula',
                                title: 'Confidence Calculation Example',
                                description: 'Simplified version of Oracle\'s confidence calculation',
                                code: `function calculateConfidence(prediction) {
  let baseConfidence = 75; // Starting point
  
  // Data quality adjustment
  const dataQuality = assessDataQuality(prediction.dataPoints);
  baseConfidence += (dataQuality - 0.5) * 20; // ±10 points
  
  // Model agreement adjustment  
  const modelConsensus = calculateModelConsensus(prediction.models);
  baseConfidence += (modelConsensus - 0.7) * 30; // ±9 points
  
  // Historical calibration
  const historicalAccuracy = getHistoricalAccuracy(
    prediction.type, 
    prediction.week
  );
  baseConfidence += (historicalAccuracy - 0.75) * 20; // ±5 points
  
  // Margin adjustment (higher margin = higher confidence)
  const topMargin = prediction.options[0].probability - 
                    prediction.options[1].probability;
  baseConfidence += topMargin * 50; // Up to +25 points
  
  return Math.max(60, Math.min(95, baseConfidence));
}`,
                                language: 'javascript',
                                explanation: 'Oracle adjusts base confidence using multiple factors, with bounds between 60-95% to avoid overconfidence.'
                            }
                        ]
                    },
                    {
                        id: 'confidence-ranges',
                        title: 'Understanding Confidence Ranges',
                        content: `**Oracle Confidence Scale:**

**🔥 High Confidence (85-95%)**
• Strong data supporting clear favorite
• Multiple models in agreement
• Historical patterns strongly favor choice
• Low variance in similar scenarios
• *Strategy: Consider following Oracle's lead*

**⚡ Medium-High Confidence (75-84%)**
• Good data quality with clear leader
• Most models agree on direction
• Some uncertainty in magnitude
• Moderate historical reliability
• *Strategy: Evaluate your own analysis carefully*

**📊 Medium Confidence (65-74%)**
• Decent data but close competition
• Models show mixed agreement
• Historical precedent is unclear
• Several viable options
• *Strategy: Great opportunity to challenge Oracle*

**🤔 Lower Confidence (60-64%)**
• Limited or conflicting data
• High uncertainty in outcomes
• Multiple equally viable options
• Unusual circumstances present
• *Strategy: Perfect spot to trust your expertise*

**📈 Confidence Trends:**
• Early season: Generally lower due to small sample sizes
• Mid-season: Peak confidence with established patterns  
• Late season: High confidence with playoff implications
• Weather games: Reduced confidence due to volatility`
                    },
                    {
                        id: 'calibration-system',
                        title: 'Oracle\'s Calibration System',
                        content: `**What is Calibration?**
Calibration measures whether Oracle's confidence levels match actual outcomes. A well-calibrated system should be correct 80% of the time when it expresses 80% confidence.

**How Oracle Stays Calibrated:**

**1. Continuous Monitoring**
• Track prediction accuracy by confidence level
• Identify systematic over/under-confidence
• Adjust algorithms based on results
• Account for changing league dynamics

**2. Seasonal Adjustments**
• Early season: Increase uncertainty due to small samples
• Mid-season: Peak calibration with stable patterns
• Late season: Adjust for playoff intensity
• Weather season: Account for environmental volatility

**3. Position-Specific Calibration**
• QB predictions: Generally higher confidence due to consistency
• RB predictions: Lower confidence due to injury risk
• WR predictions: Medium confidence with target competition
• DST predictions: Lowest confidence due to volatility

**4. Machine Learning Integration**
• Use historical outcomes to improve calibration
• Identify overconfident scenarios
• Adjust confidence bounds automatically
• Learn from prediction errors`,
                        visualAids: [
                            {
                                id: 'calibration-chart',
                                type: 'chart',
                                title: 'Oracle Calibration Analysis',
                                description: 'Shows how Oracle\'s stated confidence levels match actual prediction accuracy'
                            }
                        ]
                    }
                ],
                keyTakeaways: [
                    'Confidence levels reflect prediction reliability, not just strength of preference',
                    'Higher confidence generally means better data and model agreement',
                    'Lower confidence predictions offer the best opportunities to beat Oracle',
                    'Oracle continuously calibrates to ensure confidence levels match actual accuracy',
                    'Different prediction types and seasons affect natural confidence levels',
                    'Understanding confidence helps you choose when to challenge Oracle strategically'
                ],
                practiceExercises: [
                    {
                        id: 'confidence-strategy',
                        title: 'Confidence-Based Strategy Exercise',
                        description: 'Practice developing strategies based on Oracle\'s confidence levels',
                        type: 'analysis',
                        difficulty: 'INTERMEDIATE',
                        instructions: [
                            'Review Oracle predictions with different confidence levels',
                            'Identify patterns in high vs. low confidence scenarios',
                            'Develop decision rules for when to agree vs. disagree with Oracle',
                            'Consider how confidence should affect your betting strategy'
                        ],
                        sampleData: {
                            highConfidence: '92% confidence - Josh Allen to score most QB points',
                            mediumConfidence: '71% confidence - Eagles vs. Cowboys over 48.5 points',
                            lowConfidence: '63% confidence - Most fantasy points by a TE'
                        },
                        expectedOutcome: 'Strategic framework for using confidence levels in decision-making'
                    }
                ]
            },
            relatedTopics: ['statistical-modeling', 'performance-metrics', 'ml-basics'],
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Create Fantasy Football Basics Topic
     */
    private createFantasyBasicsTopic(): EducationalTopic {
        return {
            id: 'fantasy-basics',
            title: 'Fantasy Football Fundamentals',
            category: 'FANTASY_FUNDAMENTALS',
            difficulty: 'BEGINNER',
            description: 'Essential fantasy football concepts that Oracle\'s predictions are built upon',
            estimatedReadTime: 20,
            content: {
                introduction: `To understand Oracle's predictions, you need a solid foundation in fantasy football fundamentals. This topic covers the core concepts that Oracle analyzes when making predictions about player performance and game outcomes.`,
                sections: [
                    {
                        id: 'scoring-systems',
                        title: 'Fantasy Scoring Systems',
                        content: `**Standard Scoring:**
• Passing: 1 point per 25 yards, 4 points per TD
• Rushing/Receiving: 1 point per 10 yards, 6 points per TD
• Receiving: No points per reception (Non-PPR)
• Kicking: 3 points per FG, 1 point per XP
• Defense: Points for TDs, sacks, interceptions, fumbles

**PPR (Points Per Reception):**
• Same as standard PLUS 1 point per reception
• Increases value of high-target receivers
• Reduces variance compared to touchdown dependency

**Half-PPR:**
• 0.5 points per reception
• Middle ground between standard and full PPR

**How Oracle Adapts:**
• Adjusts projections based on league scoring
• Values possession receivers higher in PPR
• Considers target share more heavily in PPR formats
• Accounts for touchdown regression in all formats`,
                        examples: [
                            {
                                id: 'scoring-comparison',
                                title: 'Scoring System Impact',
                                description: 'How different scoring affects player values',
                                code: `// Example: Cooper Kupp's 2021 season
const kuppStats = {
  receptions: 145,
  receivingYards: 1947,
  receivingTDs: 16,
  rushingYards: 8,
  rushingTDs: 0
};

const standardPoints = 
  (kuppStats.receivingYards / 10) +      // 194.7 points
  (kuppStats.receivingTDs * 6) +         // 96 points  
  (kuppStats.rushingYards / 10);         // 0.8 points
  // Total: 291.5 points

const pprPoints = standardPoints + kuppStats.receptions;
  // Total: 436.5 points (+145 from receptions)`,
                                language: 'javascript',
                                explanation: 'PPR scoring dramatically increases the value of high-reception players like Kupp.'
                            }
                        ]
                    },
                    {
                        id: 'positional-strategy',
                        title: 'Positional Analysis and Strategy',
                        content: `**Quarterback Strategy:**
• Highest floor, moderate ceiling
• Streaming vs. elite options
• Weather impact on outdoor games
• Rushing upside for mobile QBs

**Running Back Considerations:**
• Opportunity (touches) vs. efficiency
• Injury risk and handcuff strategies
• Game script dependency
• Goal line and passing down roles

**Wide Receiver Factors:**
• Target share and air yards
• Slot vs. outside alignment
• Red zone usage patterns
• QB chemistry and connection

**Tight End Analysis:**
• Positional scarcity considerations
• Blocking vs. receiving specialists  
• Matchup advantages vs. linebackers
• Target competition within offense

**Defense/Special Teams:**
• Matchup-dependent streaming
• Home vs. away performance splits
• Weather advantages for defenses
• Turnover variance and sustainability`
                    },
                    {
                        id: 'key-metrics',
                        title: 'Essential Fantasy Metrics',
                        content: `**Volume Metrics:**
• **Snap Count %:** Playing time opportunity
• **Target Share:** % of team targets (WR/TE)
• **Carry Share:** % of team rushing attempts (RB)
• **Red Zone Targets/Carries:** High-value scoring opportunities
• **Air Yards:** Downfield target distance

**Efficiency Metrics:**
• **Yards per Target:** Reception efficiency
• **Yards per Carry:** Rushing efficiency  
• **Catch Rate:** Target conversion %
• **TD Rate:** Touchdown conversion efficiency
• **YAC (Yards After Catch):** Playmaking ability

**Advanced Analytics:**
• **ADOT (Average Depth of Target):** Route complexity
• **Target Quality:** Catchable pass %
• **Broken Tackle Rate:** Elusiveness metric
• **Pressure Rate:** QB durability under pressure
• **Route Participation:** Passing down involvement

**Oracle's Metric Priorities:**
1. **Volume First:** Opportunity drives fantasy points
2. **Efficiency Second:** Maximizing given opportunities  
3. **Situation Third:** Game script and usage context
4. **Trends Fourth:** Recent performance momentum`
                    }
                ],
                keyTakeaways: [
                    'Scoring format significantly impacts player valuations and Oracle predictions',
                    'Volume metrics (targets, carries) are the strongest predictors of fantasy success',
                    'Each position has unique analytical considerations and strategies',
                    'Oracle combines volume, efficiency, and situational factors in predictions',
                    'Understanding these fundamentals helps interpret Oracle\'s reasoning'
                ]
            },
            relatedTopics: ['player-analysis', 'statistical-modeling'],
            lastUpdated: new Date().toISOString()
        };
    }

    // Additional topic creation methods would continue here...
    // For brevity, I'll create stubs for the remaining topics

    private createScoringSystemsTopic(): EducationalTopic {
        return {
            id: 'scoring-systems',
            title: 'Fantasy Scoring Systems Deep Dive',
            category: 'FANTASY_FUNDAMENTALS',
            difficulty: 'INTERMEDIATE',
            description: 'Advanced understanding of how different scoring systems affect Oracle predictions',
            estimatedReadTime: 10,
            content: {
                introduction: 'Detailed analysis of scoring systems and their impact on predictions...',
                sections: [],
                keyTakeaways: ['Scoring systems directly impact player value.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createPlayerAnalysisTopic(): EducationalTopic {
        return {
            id: 'player-analysis',
            title: 'Advanced Player Analysis Techniques',
            category: 'FANTASY_FUNDAMENTALS',
            difficulty: 'ADVANCED',
            description: 'Learn Oracle\'s methods for evaluating player performance potential',
            estimatedReadTime: 18,
            content: {
                introduction: 'Deep dive into player evaluation methodologies...',
                sections: [],
                keyTakeaways: ['Player analysis involves more than just looking at box scores.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createAlgorithmBasicsTopic(): EducationalTopic {
        return {
            id: 'algorithm-basics',
            title: 'Understanding Oracle\'s Prediction Algorithms',
            category: 'PREDICTION_ALGORITHMS',
            difficulty: 'INTERMEDIATE',
            description: 'How Oracle processes data to generate predictions',
            estimatedReadTime: 22,
            content: {
                introduction: 'Oracle uses sophisticated algorithms combining multiple analytical approaches to create robust and reliable forecasts.',
                sections: [],
                keyTakeaways: ['Algorithms are the engines of Oracle\'s predictions.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createDataSourcesTopic(): EducationalTopic {
        return {
            id: 'data-sources',
            title: 'Oracle\'s Data Sources and Integration',
            category: 'PREDICTION_ALGORITHMS',
            difficulty: 'INTERMEDIATE',
            description: 'Understanding the data that powers Oracle predictions',
            estimatedReadTime: 16,
            content: {
                introduction: 'Oracle integrates multiple data sources for comprehensive analysis...',
                sections: [],
                keyTakeaways: ['High-quality data is essential for accurate predictions.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createAIAnalysisTopic(): EducationalTopic {
        return {
            id: 'ai-analysis',
            title: 'AI-Powered Analysis and Reasoning',
            category: 'PREDICTION_ALGORITHMS',
            difficulty: 'ADVANCED',
            description: 'How Oracle uses AI to analyze data and generate insights',
            estimatedReadTime: 25,
            content: {
                introduction: 'Oracle leverages advanced AI to process complex data relationships...',
                sections: [],
                keyTakeaways: ['AI helps uncover hidden patterns in the data.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createStatisticalModelingTopic(): EducationalTopic {
        return {
            id: 'statistical-modeling',
            title: 'Statistical Modeling in Fantasy Football',
            category: 'STATISTICAL_ANALYSIS',
            difficulty: 'ADVANCED',
            description: 'Advanced statistical concepts Oracle uses for predictions',
            estimatedReadTime: 30,
            content: {
                introduction: 'Statistical modeling forms the foundation of Oracle\'s analytical approach...',
                sections: [],
                keyTakeaways: ['Statistical models help quantify uncertainty.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createProbabilityTheoryTopic(): EducationalTopic {
        return {
            id: 'probability-theory',
            title: 'Probability Theory and Confidence Intervals',
            category: 'STATISTICAL_ANALYSIS',
            difficulty: 'EXPERT',
            description: 'Mathematical foundations of Oracle\'s probability calculations',
            estimatedReadTime: 35,
            content: {
                introduction: 'Understanding probability theory helps interpret Oracle\'s confidence levels...',
                sections: [],
                keyTakeaways: ['Probability is the language of uncertainty.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createPerformanceMetricsTopic(): EducationalTopic {
        return {
            id: 'performance-metrics',
            title: 'Advanced Performance Metrics',
            category: 'STATISTICAL_ANALYSIS',
            difficulty: 'ADVANCED',
            description: 'Sophisticated metrics Oracle uses for player evaluation',
            estimatedReadTime: 20,
            content: {
                introduction: 'Oracle uses advanced metrics beyond basic fantasy statistics...',
                sections: [],
                keyTakeaways: ['Advanced metrics provide a deeper understanding of player performance.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createMLBasicsTopic(): EducationalTopic {
        return {
            id: 'ml-basics',
            title: 'Machine Learning in Fantasy Football',
            category: 'MACHINE_LEARNING',
            difficulty: 'ADVANCED',
            description: 'How Oracle uses machine learning for continuous improvement',
            estimatedReadTime: 28,
            content: {
                introduction: 'Machine learning enables Oracle to improve predictions over time...',
                sections: [],
                keyTakeaways: ['Machine learning allows the system to learn from data.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createFeatureEngineeringTopic(): EducationalTopic {
        return {
            id: 'feature-engineering',
            title: 'Feature Engineering for Predictions',
            category: 'MACHINE_LEARNING',
            difficulty: 'EXPERT',
            description: 'How Oracle creates meaningful features from raw data',
            estimatedReadTime: 32,
            content: {
                introduction: 'Feature engineering transforms raw data into predictive signals...',
                sections: [],
                keyTakeaways: ['Feature engineering is a critical step in the machine learning pipeline.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createModelOptimizationTopic(): EducationalTopic {
        return {
            id: 'model-optimization',
            title: 'Model Optimization and Validation',
            category: 'MACHINE_LEARNING',
            difficulty: 'EXPERT',
            description: 'Oracle\'s approach to optimizing prediction models',
            estimatedReadTime: 25,
            content: {
                introduction: 'Oracle continuously optimizes models for better predictions...',
                sections: [],
                keyTakeaways: ['Model optimization is key to maintaining a competitive edge.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createAdvancedAnalyticsTopic(): EducationalTopic {
        return {
            id: 'advanced-analytics',
            title: 'Advanced Analytics and Ensemble Methods',
            category: 'ADVANCED_STRATEGIES',
            difficulty: 'EXPERT',
            description: 'Sophisticated analytical techniques Oracle employs',
            estimatedReadTime: 40,
            content: {
                introduction: 'Advanced analytics combine multiple approaches for robust predictions...',
                sections: [],
                keyTakeaways: ['Advanced analytics can provide a significant competitive advantage.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createEnsembleMethodsTopic(): EducationalTopic {
        return {
            id: 'ensemble-methods',
            title: 'Ensemble Prediction Methods',
            category: 'ADVANCED_STRATEGIES',
            difficulty: 'EXPERT',
            description: 'How Oracle combines multiple models for better accuracy',
            estimatedReadTime: 30,
            content: {
                introduction: 'Ensemble methods combine multiple prediction models...',
                sections: [],
                keyTakeaways: ['Ensemble methods can improve prediction accuracy and robustness.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    private createMarketSentimentTopic(): EducationalTopic {
        return {
            id: 'market-sentiment',
            title: 'Market Sentiment and External Factors',
            category: 'ADVANCED_STRATEGIES',
            difficulty: 'ADVANCED',
            description: 'How Oracle incorporates market sentiment and external data',
            estimatedReadTime: 22,
            content: {
                introduction: 'Market sentiment provides additional signals for Oracle predictions...',
                sections: [],
                keyTakeaways: ['Market sentiment can be a powerful contrarian indicator.']
            },
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Add topic to the service
     */
    private addTopic(topic: EducationalTopic): void {
        this.topics.set(topic.id, topic);
    }

    /**
     * Get all educational topics
     */
    getTopics(): EducationalTopic[] {
        return Array.from(this.topics.values());
    }

    /**
     * Get topics by category
     */
    getTopicsByCategory(category: EducationCategory): EducationalTopic[] {
        return this.getTopics().filter(topic => topic.category === category);
    }

    /**
     * Get topics by difficulty
     */
    getTopicsByDifficulty(difficulty: DifficultyLevel): EducationalTopic[] {
        return this.getTopics().filter(topic => topic.difficulty === difficulty);
    }

    /**
     * Get specific topic by ID
     */
    getTopic(topicId: string): EducationalTopic | null {
        return this.topics.get(topicId) || null;
    }

    /**
     * Get recommended learning path for user
     */
    getRecommendedLearningPath(userLevel: DifficultyLevel = 'BEGINNER'): string[] {
        const levelPaths = {
            'BEGINNER': [
                'oracle-introduction',
                'fantasy-basics', 
                'prediction-types',
                'confidence-levels',
                'scoring-systems'
            ],
            'INTERMEDIATE': [
                'player-analysis',
                'algorithm-basics',
                'data-sources',
                'statistical-modeling',
                'performance-metrics'
            ],
            'ADVANCED': [
                'ai-analysis',
                'ml-basics',
                'probability-theory',
                'market-sentiment',
                'advanced-analytics'
            ],
            'EXPERT': [
                'feature-engineering',
                'model-optimization', 
                'ensemble-methods'
            ]
        };

        return levelPaths[userLevel] || levelPaths['BEGINNER'];
    }

    /**
     * Load user progress from localStorage
     */
    private loadUserProgress(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.userProgress = JSON.parse(stored);
            } else {
                this.userProgress = this.createDefaultProgress();
            }
        } catch (error) {
            console.error('Failed to load user progress:', error);
            this.userProgress = this.createDefaultProgress();
        }
    }

    /**
     * Save user progress to localStorage
     */
    private saveUserProgress(): void {
        try {
            if (this.userProgress) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.userProgress));
            }
        } catch (error) {
            console.error('Failed to save user progress:', error);
        }
    }

    /**
     * Create default user progress
     */
    private createDefaultProgress(): UserProgress {
        return {
            userId: 'default-user',
            completedTopics: [],
            quizScores: {},
            practiceResults: {},
            learningPath: this.getRecommendedLearningPath('BEGINNER'),
            achievements: [],
            totalTimeSpent: 0,
            lastAccessed: new Date().toISOString()
        };
    }

    /**
     * Mark topic as completed
     */
    markTopicCompleted(topicId: string): void {
        if (!this.userProgress) return;

        if (!this.userProgress.completedTopics.includes(topicId)) {
            this.userProgress.completedTopics.push(topicId);
            this.userProgress.lastAccessed = new Date().toISOString();
            this.saveUserProgress();
        }
    }

    /**
     * Record quiz score
     */
    recordQuizScore(topicId: string, score: number): void {
        if (!this.userProgress) return;

        this.userProgress.quizScores[topicId] = score;
        this.userProgress.lastAccessed = new Date().toISOString();
        this.saveUserProgress();
    }

    /**
     * Get user progress
     */
    getUserProgress(): UserProgress | null {
        return this.userProgress;
    }

    /**
     * Get next recommended topic
     */
    getNextRecommendedTopic(): EducationalTopic | null {
        if (!this.userProgress) return null;

        const nextTopicId = this.userProgress.learningPath.find(
            topicId => !this.userProgress?.completedTopics.includes(topicId)
        );

        return nextTopicId ? this.getTopic(nextTopicId) : null;
    }

    /**
     * Search topics by query
     */
    searchTopics(query: string): EducationalTopic[] {
        const searchTerm = query.toLowerCase();
        return this.getTopics().filter(topic =>
            topic.title.toLowerCase().includes(searchTerm) ||
            topic.description.toLowerCase().includes(searchTerm) ||
            topic.content.introduction.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Get topic prerequisites
     */
    getTopicPrerequisites(topicId: string): EducationalTopic[] {
        const topic = this.getTopic(topicId);
        if (!topic?.prerequisites) return [];

        return topic.prerequisites
            .map(prereqId => this.getTopic(prereqId))
            .filter((t): t is EducationalTopic => t !== null);
    }

    /**
     * Check if user can access topic
     */
    canAccessTopic(topicId: string): boolean {
        if (!this.userProgress) return true;

        const prerequisites = this.getTopicPrerequisites(topicId);
        return prerequisites.every(prereq => 
            this.userProgress?.completedTopics.includes(prereq.id)
        );
    }

    /**
     * Get learning statistics
     */
    getLearningStatistics(): any {
        if (!this.userProgress) return null;

        const totalTopics = this.getTopics().length;
        const completedCount = this.userProgress.completedTopics.length;
        const completionRate = (completedCount / totalTopics) * 100;

        const categoryProgress = this.getCategoryProgress();
        const difficultyProgress = this.getDifficultyProgress();

        return {
            totalTopics,
            completedCount,
            completionRate,
            categoryProgress,
            difficultyProgress,
            totalTimeSpent: this.userProgress.totalTimeSpent,
            averageQuizScore: this.getAverageQuizScore(),
            achievements: this.userProgress.achievements.length
        };
    }

    /**
     * Get progress by category
     */
    private getCategoryProgress(): Record<EducationCategory, number> {
        const progress: Record<string, number> = {};
        
        Object.values(this.topics).forEach(topic => {
            if (!progress[topic.category]) {
                progress[topic.category] = 0;
            }
            if (this.userProgress?.completedTopics.includes(topic.id)) {
                progress[topic.category]++;
            }
        });

        return progress as Record<EducationCategory, number>;
    }

    /**
     * Get progress by difficulty
     */
    private getDifficultyProgress(): Record<DifficultyLevel, number> {
        const progress: Record<string, number> = {
            'BEGINNER': 0,
            'INTERMEDIATE': 0, 
            'ADVANCED': 0,
            'EXPERT': 0
        };

        Object.values(this.topics).forEach(topic => {
            if (this.userProgress?.completedTopics.includes(topic.id)) {
                progress[topic.difficulty]++;
            }
        });

        return progress as Record<DifficultyLevel, number>;
    }

    /**
     * Calculate average quiz score
     */
    private getAverageQuizScore(): number {
        if (!this.userProgress || Object.keys(this.userProgress.quizScores).length === 0) {
            return 0;
        }

        const scores = Object.values(this.userProgress.quizScores);
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
}

// Export singleton instance
export const oracleEducationService = new OracleEducationService();
export default oracleEducationService;
