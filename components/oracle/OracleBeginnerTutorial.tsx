/**
 * Oracle Beginner Tutorial Component
 * Beginner-friendly tutorial covering Oracle basics, fantasy football fundamentals,
 * prediction types, confidence levels, and getting started guide
 */

import React, { useState, useEffect } from 'react';

interface TutorialStep {
    id: string;
    title: string;
    content: string;
    interactive?: boolean;
    quiz?: QuizQuestion;
    visual?: string;
    practiceChallenge?: PracticeChallenge;
}

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

interface PracticeChallenge {
    type: 'prediction' | 'confidence' | 'reasoning';
    scenario: string;
    options?: string[];
    expectedAnswer?: string | number;
}

interface UserProgress {
    currentStep: number;
    completedSteps: Set<number>;
    quizResults: Record<number, boolean>;
    practiceScores: Record<number, number>;
    startTime: string;
    lastAccessed: string;
}

const OracleBeginnerTutorial: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [userProgress, setUserProgress] = useState<UserProgress>({
        currentStep: 0,
        completedSteps: new Set(),
        quizResults: {},
        practiceScores: {},
        startTime: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
    });
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [practiceInput, setPracticeInput] = useState('');
    const [tutorialComplete, setTutorialComplete] = useState(false);

    // Tutorial steps with comprehensive beginner content
    const tutorialSteps: TutorialStep[] = [
        {
            id: 'welcome',
            title: '🔮 Welcome to Beat The Oracle',
            content: `
                <div class="tutorial-welcome">
                    <h3>Welcome to the Ultimate Fantasy Football Challenge!</h3>
                    <p>Beat The Oracle is an AI-powered prediction system that challenges you to outsmart advanced algorithms in fantasy football scenarios.</p>
                    
                    <div class="feature-highlights">
                        <div class="feature">
                            <h4>🎯 What You'll Learn</h4>
                            <ul>
                                <li>Oracle prediction basics</li>
                                <li>Fantasy football fundamentals</li>
                                <li>How to read confidence levels</li>
                                <li>Prediction strategies</li>
                                <li>How to beat the AI!</li>
                            </ul>
                        </div>
                        
                        <div class="feature">
                            <h4>🏆 What You'll Gain</h4>
                            <ul>
                                <li>Better fantasy decisions</li>
                                <li>Understanding of AI predictions</li>
                                <li>Competitive advantage</li>
                                <li>Rewards and achievements</li>
                                <li>Community recognition</li>
                            </ul>
                        </div>
                    </div>
                    
                    <p><strong>Time to complete:</strong> 15-20 minutes</p>
                    <p><strong>Difficulty:</strong> Beginner (No prior experience needed)</p>
                </div>
            `,
            visual: '🎮'
        },
        {
            id: 'oracle-intro',
            title: '🤖 What is The Oracle?',
            content: `
                <div class="oracle-explanation">
                    <h3>Meet Your AI Opponent</h3>
                    <p>The Oracle is an advanced AI system that uses cutting-edge technology to predict fantasy football outcomes:</p>
                    
                    <div class="oracle-features">
                        <div class="feature-card">
                            <h4>🧠 AI Brain Power</h4>
                            <p>Uses Google's Gemini AI to analyze complex patterns and data relationships that humans might miss.</p>
                        </div>
                        
                        <div class="feature-card">
                            <h4>📊 Live Data Feeds</h4>
                            <p>Constantly monitors live sports data, injury reports, weather conditions, and player performance metrics.</p>
                        </div>
                        
                        <div class="feature-card">
                            <h4>🔍 Advanced Analytics</h4>
                            <p>Processes historical trends, team chemistry, matchup difficulties, and market sentiment in real-time.</p>
                        </div>
                        
                        <div class="feature-card">
                            <h4>🎯 Machine Learning</h4>
                            <p>Continuously learns from past predictions to improve accuracy and calibrate confidence levels.</p>
                        </div>
                    </div>
                    
                    <div class="oracle-stats">
                        <h4>Oracle Performance Highlights:</h4>
                        <ul>
                            <li>Analyzes 100+ data points per prediction</li>
                            <li>Updates predictions every 30 seconds during games</li>
                            <li>Tracks accuracy across 6 prediction categories</li>
                            <li>Calibrates confidence based on historical performance</li>
                        </ul>
                    </div>
                </div>
            `,
            visual: '🔮',
            quiz: {
                question: "What makes The Oracle's predictions so powerful?",
                options: [
                    "It only uses historical data",
                    "It combines AI, live data, and machine learning",
                    "It relies on expert opinions",
                    "It uses simple statistical averages"
                ],
                correctAnswer: 1,
                explanation: "The Oracle's strength comes from combining AI analysis, real-time data feeds, and continuous machine learning to create comprehensive predictions."
            }
        },
        {
            id: 'fantasy-basics',
            title: '🏈 Fantasy Football Fundamentals',
            content: `
                <div class="fantasy-basics">
                    <h3>Fantasy Football Quick Refresher</h3>
                    <p>Before diving into Oracle predictions, let's review the key concepts that drive fantasy football:</p>
                    
                    <div class="positions-guide">
                        <h4>📍 Key Positions & Scoring</h4>
                        <div class="position-cards">
                            <div class="position">
                                <h5>QB (Quarterback)</h5>
                                <ul>
                                    <li>Passing yards: 1pt/25 yards</li>
                                    <li>Passing TDs: 4-6 points</li>
                                    <li>Rushing yards: 1pt/10 yards</li>
                                    <li>Interceptions: -1 to -2 points</li>
                                </ul>
                            </div>
                            
                            <div class="position">
                                <h5>RB (Running Back)</h5>
                                <ul>
                                    <li>Rushing yards: 1pt/10 yards</li>
                                    <li>Rushing TDs: 6 points</li>
                                    <li>Receptions: 0.5-1 point (PPR)</li>
                                    <li>Receiving yards: 1pt/10 yards</li>
                                </ul>
                            </div>
                            
                            <div class="position">
                                <h5>WR/TE (Receivers)</h5>
                                <ul>
                                    <li>Receptions: 0.5-1 point (PPR)</li>
                                    <li>Receiving yards: 1pt/10 yards</li>
                                    <li>Receiving TDs: 6 points</li>
                                    <li>Target share crucial for consistency</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="key-factors">
                        <h4>🎯 What Affects Fantasy Performance</h4>
                        <div class="factors-grid">
                            <div class="factor">
                                <strong>Matchup Difficulty:</strong> How tough the opposing defense is
                            </div>
                            <div class="factor">
                                <strong>Game Script:</strong> Whether a team is expected to lead or trail
                            </div>
                            <div class="factor">
                                <strong>Weather:</strong> Wind, rain, and temperature impact
                            </div>
                            <div class="factor">
                                <strong>Injuries:</strong> Player health and availability
                            </div>
                            <div class="factor">
                                <strong>Volume:</strong> How often a player gets the ball
                            </div>
                            <div class="factor">
                                <strong>Red Zone Usage:</strong> Touchdown opportunity frequency
                            </div>
                        </div>
                    </div>
                </div>
            `,
            visual: '🏆',
            quiz: {
                question: "Which factor is most important for consistent fantasy performance?",
                options: [
                    "Talent level only",
                    "Volume and opportunity",
                    "Team record",
                    "Previous week's performance"
                ],
                correctAnswer: 1,
                explanation: "Volume and opportunity are crucial because even talented players need touches and targets to produce fantasy points consistently."
            }
        },
        {
            id: 'prediction-types',
            title: '🎯 Oracle Prediction Categories',
            content: `
                <div class="prediction-types">
                    <h3>Understanding Oracle Challenge Types</h3>
                    <p>The Oracle creates different types of predictions to test various aspects of your fantasy knowledge:</p>
                    
                    <div class="prediction-categories">
                        <div class="category">
                            <h4>🏃‍♂️ Player Performance</h4>
                            <p><strong>What it predicts:</strong> Which player will score the most fantasy points</p>
                            <p><strong>Oracle analyzes:</strong> Recent form, matchup difficulty, target share, injury status, weather impact</p>
                            <p><strong>Your strategy:</strong> Look for high-volume players in good matchups with favorable conditions</p>
                            <div class="example">
                                <strong>Example:</strong> "Who will score the most fantasy points this week?"<br>
                                Options: Josh Allen (28%), Lamar Jackson (31%), Dak Prescott (25%), Aaron Rodgers (16%)
                            </div>
                        </div>
                        
                        <div class="category">
                            <h4>🏟️ Game Outcomes</h4>
                            <p><strong>What it predicts:</strong> Which game will have the highest total score</p>
                            <p><strong>Oracle analyzes:</strong> Team pace, weather conditions, historical scoring, offensive efficiency</p>
                            <p><strong>Your strategy:</strong> Look for dome games, high-powered offenses, and favorable weather</p>
                            <div class="example">
                                <strong>Example:</strong> "Which game will have the highest total score?"<br>
                                Options: Chiefs vs Bills (35%), Lions vs Packers (28%), Dolphins vs Ravens (22%), Others (15%)
                            </div>
                        </div>
                        
                        <div class="category">
                            <h4>📈 Weekly Scoring</h4>
                            <p><strong>What it predicts:</strong> The highest individual fantasy score ranges</p>
                            <p><strong>Oracle analyzes:</strong> League-wide projections, game environments, player ceiling potential</p>
                            <p><strong>Your strategy:</strong> Consider week-specific factors like injuries, weather, and game stakes</p>
                            <div class="example">
                                <strong>Example:</strong> "What will be the highest individual fantasy score?"<br>
                                Options: Under 25 pts (15%), 25-35 pts (45%), 35-45 pts (30%), Over 45 pts (10%)
                            </div>
                        </div>
                        
                        <div class="category">
                            <h4>🌦️ Weather Impact</h4>
                            <p><strong>What it predicts:</strong> Which weather condition will most affect scoring</p>
                            <p><strong>Oracle analyzes:</strong> Wind speed, precipitation, temperature, and historical weather impacts</p>
                            <p><strong>Your strategy:</strong> Remember that wind affects passing more than rain, snow favors rushing</p>
                        </div>
                        
                        <div class="category">
                            <h4>🏥 Injury Impact</h4>
                            <p><strong>What it predicts:</strong> Which position will be most affected by injuries</p>
                            <p><strong>Oracle analyzes:</strong> Current injury reports, position depth, and replacement value</p>
                            <p><strong>Your strategy:</strong> Consider backup quality and how injuries change game plans</p>
                        </div>
                    </div>
                </div>
            `,
            visual: '🎲',
            practiceChallenge: {
                type: 'prediction',
                scenario: 'You see a Player Performance prediction with these options: (A) Christian McCaffrey - clear weather, soft matchup (B) Josh Jacobs - windy conditions, tough defense (C) Derrick Henry - normal weather, average matchup. The Oracle chooses McCaffrey with 75% confidence. What factors likely influenced this choice?',
                options: ['Weather only', 'Matchup difficulty only', 'Combination of weather, matchup, and player volume', 'Team record'],
                expectedAnswer: 2
            }
        },
        {
            id: 'confidence-levels',
            title: '📊 Understanding Confidence Levels',
            content: `
                <div class="confidence-guide">
                    <h3>Decoding Oracle Confidence</h3>
                    <p>The Oracle's confidence level tells you how certain it is about its prediction. This is crucial for your strategy!</p>
                    
                    <div class="confidence-scale">
                        <h4>🎯 Confidence Scale Breakdown</h4>
                        <div class="confidence-levels">
                            <div class="level high-confidence">
                                <h5>85-95% - Very High Confidence</h5>
                                <p><strong>What it means:</strong> Oracle is very certain based on strong data alignment</p>
                                <p><strong>When this happens:</strong> Clear weather, obvious matchup advantages, injury impacts</p>
                                <p><strong>Your strategy:</strong> Harder to beat, but higher rewards if you do!</p>
                                <p><strong>Example:</strong> Healthy CMC vs worst run defense in perfect weather = 92% confidence</p>
                            </div>
                            
                            <div class="level medium-confidence">
                                <h5>70-84% - High Confidence</h5>
                                <p><strong>What it means:</strong> Oracle sees clear patterns but some uncertainty</p>
                                <p><strong>When this happens:</strong> Good matchups with minor concerns, slight weather impact</p>
                                <p><strong>Your strategy:</strong> Look for overlooked factors or contrarian plays</p>
                                <p><strong>Example:</strong> Top QB vs average defense with light wind = 78% confidence</p>
                            </div>
                            
                            <div class="level low-confidence">
                                <h5>60-69% - Moderate Confidence</h5>
                                <p><strong>What it means:</strong> Close call, multiple viable options</p>
                                <p><strong>When this happens:</strong> Even matchups, conflicting data signals</p>
                                <p><strong>Your strategy:</strong> Great opportunity to find value and beat Oracle!</p>
                                <p><strong>Example:</strong> Multiple RBs with similar projections = 65% confidence</p>
                            </div>
                            
                            <div class="level very-low-confidence">
                                <h5>Under 60% - Low Confidence</h5>
                                <p><strong>What it means:</strong> Oracle is uncertain, wide range of outcomes</p>
                                <p><strong>When this happens:</strong> Injury uncertainty, extreme weather, data conflicts</p>
                                <p><strong>Your strategy:</strong> Trust your instincts and knowledge!</p>
                                <p><strong>Example:</strong> Questionable players in bad weather = 58% confidence</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="confidence-strategy">
                        <h4>💡 Strategic Insights</h4>
                        <div class="strategy-tips">
                            <div class="tip">
                                <strong>High Confidence Challenges:</strong> Oracle is very sure, so consider if you have unique insights or if there's a contrarian play worth the risk
                            </div>
                            <div class="tip">
                                <strong>Low Confidence Opportunities:</strong> These are your best chances to beat Oracle using human intuition and game knowledge
                            </div>
                            <div class="tip">
                                <strong>Confidence Calibration:</strong> Oracle adjusts confidence based on how often its predictions at each level have been correct historically
                            </div>
                        </div>
                    </div>
                </div>
            `,
            visual: '📈',
            quiz: {
                question: "When is the best time to disagree with The Oracle?",
                options: [
                    "When confidence is 90%+",
                    "When confidence is 60-70%",
                    "When confidence is exactly 80%",
                    "Never disagree with The Oracle"
                ],
                correctAnswer: 1,
                explanation: "Low to moderate confidence (60-70%) indicates uncertainty in the data, making it the best time to use your human insights to potentially beat the Oracle."
            }
        },
        {
            id: 'reading-predictions',
            title: '🔍 How to Read Oracle Predictions',
            content: `
                <div class="reading-guide">
                    <h3>Analyzing Oracle Predictions Like a Pro</h3>
                    <p>Let's break down how to read and analyze Oracle predictions to make better decisions:</p>
                    
                    <div class="prediction-anatomy">
                        <h4>🔬 Anatomy of a Prediction</h4>
                        <div class="prediction-example">
                            <div class="prediction-header">
                                <h5>📋 Sample Prediction Analysis</h5>
                                <div class="mock-prediction">
                                    <h6>Player Performance Prediction - Week 7</h6>
                                    <p><strong>Question:</strong> "Who will score the most fantasy points this week?"</p>
                                    <div class="options-display">
                                        <div class="option winner">
                                            <span class="choice">🥇 Christian McCaffrey (CAR)</span>
                                            <span class="percentage">35%</span>
                                            <div class="supporting-data">
                                                • Projected: 24.8 pts • Recent avg: 22.3 pts • Matchup: 8/10
                                                • PER: 18.4 • Target Share: 28% • Weather: Clear
                                            </div>
                                        </div>
                                        <div class="option">
                                            <span class="choice">🥈 Josh Allen (BUF)</span>
                                            <span class="percentage">28%</span>
                                        </div>
                                        <div class="option">
                                            <span class="choice">🥉 Cooper Kupp (LAR)</span>
                                            <span class="percentage">22%</span>
                                        </div>
                                        <div class="option">
                                            <span class="choice">Derrick Henry (TEN)</span>
                                            <span class="percentage">15%</span>
                                        </div>
                                    </div>
                                    <div class="oracle-analysis">
                                        <p><strong>Oracle Confidence:</strong> 78%</p>
                                        <p><strong>Reasoning:</strong> McCaffrey benefits from a highly favorable matchup against a defense allowing 5.2 YPC to RBs, combined with clear weather conditions and his consistent 20+ touch workload. Advanced metrics show strong team chemistry (85/100) and optimal game script projection.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="analysis-breakdown">
                            <h4>📖 What Each Part Tells You</h4>
                            <div class="breakdown-sections">
                                <div class="section">
                                    <h5>1. Probabilities & Rankings</h5>
                                    <p>The percentages show Oracle's confidence in each option. Higher percentages indicate stronger data support.</p>
                                    <p><strong>Key insight:</strong> A close race (like 28% vs 25%) suggests uncertainty - opportunity for you!</p>
                                </div>
                                
                                <div class="section">
                                    <h5>2. Supporting Data Points</h5>
                                    <p>These show the key factors Oracle considered:</p>
                                    <ul>
                                        <li><strong>Projected pts:</strong> Oracle's point projection</li>
                                        <li><strong>Recent avg:</strong> Player's recent performance trend</li>
                                        <li><strong>Matchup rating:</strong> How favorable the opponent is (1-10 scale)</li>
                                        <li><strong>PER:</strong> Player Efficiency Rating (advanced metric)</li>
                                        <li><strong>Target Share:</strong> % of team's targets for receivers</li>
                                    </ul>
                                </div>
                                
                                <div class="section">
                                    <h5>3. Oracle's Reasoning</h5>
                                    <p>This explains the "why" behind the choice, revealing Oracle's logic and any factors it weighted heavily.</p>
                                    <p><strong>Look for:</strong> What factors does Oracle emphasize? Are there factors it might be missing?</p>
                                </div>
                                
                                <div class="section">
                                    <h5>4. Data Points Used</h5>
                                    <p>Shows what information sources Oracle consulted for this prediction.</p>
                                    <p><strong>Consider:</strong> Real-time updates, injury reports, weather changes that might not be reflected yet</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            visual: '📋',
            practiceChallenge: {
                type: 'reasoning',
                scenario: 'Looking at the sample prediction above, Oracle chose McCaffrey with 78% confidence. The reasoning mentions "favorable matchup" and "clear weather." If you wanted to disagree, what factors might you consider that Oracle could be underweighting?',
                expectedAnswer: 'Recent injury concerns, rest vs workload, game script if team falls behind, or red zone usage trends'
            }
        },
        {
            id: 'beating-oracle',
            title: '🎯 Strategies to Beat The Oracle',
            content: `
                <div class="beating-strategies">
                    <h3>How to Outsmart the AI</h3>
                    <p>While Oracle is sophisticated, human intuition and specific knowledge can find edges. Here are proven strategies:</p>
                    
                    <div class="strategy-categories">
                        <div class="strategy-category">
                            <h4>🧠 Human Advantage Areas</h4>
                            <div class="advantages">
                                <div class="advantage">
                                    <h5>💡 Intangible Factors</h5>
                                    <p><strong>What you know:</strong> Team chemistry, coaching tendencies, player motivation</p>
                                    <p><strong>Example:</strong> A player coming off a disappointing game often bounces back</p>
                                    <p><strong>Edge:</strong> Oracle might not weight emotional/psychological factors heavily enough</p>
                                </div>
                                
                                <div class="advantage">
                                    <h5>📰 Breaking News</h5>
                                    <p><strong>What you know:</strong> Very recent developments, social media hints</p>
                                    <p><strong>Example:</strong> Late injury reports, practice squad promotions</p>
                                    <p><strong>Edge:</strong> You might have more recent information than Oracle's data</p>
                                </div>
                                
                                <div class="advantage">
                                    <h5>🎮 Game Theory</h5>
                                    <p><strong>What you know:</strong> Contrarian thinking, market overcorrections</p>
                                    <p><strong>Example:</strong> Everyone avoiding a player after one bad game</p>
                                    <p><strong>Edge:</strong> Oracle might follow data trends; you can think contrarian</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="strategy-category">
                            <h4>🎯 Specific Beating Strategies</h4>
                            <div class="strategies">
                                <div class="strategy">
                                    <h5>1. Target Low Confidence Predictions (60-70%)</h5>
                                    <p>When Oracle is uncertain, your knowledge becomes more valuable</p>
                                    <div class="strategy-example">
                                        <strong>Example:</strong> Oracle at 65% confidence between 3 similar RBs<br>
                                        <strong>Your edge:</strong> You know one coach prefers passing to RBs in red zone
                                    </div>
                                </div>
                                
                                <div class="strategy">
                                    <h5>2. Look for Recency Bias</h5>
                                    <p>Oracle might overweight recent performance; look for regression candidates</p>
                                    <div class="strategy-example">
                                        <strong>Example:</strong> Oracle favors player coming off 3 great games<br>
                                        <strong>Your edge:</strong> You know those games had unusually favorable conditions
                                    </div>
                                </div>
                                
                                <div class="strategy">
                                    <h5>3. Weather Contrarian Plays</h5>
                                    <p>Oracle might be too conservative with weather impact</p>
                                    <div class="strategy-example">
                                        <strong>Example:</strong> Oracle downgrades players for light rain<br>
                                        <strong>Your edge:</strong> Modern NFL players handle light weather better than data suggests
                                    </div>
                                </div>
                                
                                <div class="strategy">
                                    <h5>4. Coaching Tendency Insights</h5>
                                    <p>Use specific coaching knowledge Oracle might not capture</p>
                                    <div class="strategy-example">
                                        <strong>Example:</strong> Oracle projects even touches for two RBs<br>
                                        <strong>Your edge:</strong> You know this coach always rides the hot hand
                                    </div>
                                </div>
                                
                                <div class="strategy">
                                    <h5>5. Injury Impact Timing</h5>
                                    <p>Consider how quickly replacements adapt vs Oracle's assumptions</p>
                                    <div class="strategy-example">
                                        <strong>Example:</strong> Oracle downgrades offense for injured star<br>
                                        <strong>Your edge:</strong> You know the backup has been practicing with first team for weeks
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="strategy-category">
                            <h4>⚠️ When NOT to Challenge Oracle</h4>
                            <div class="avoid-scenarios">
                                <div class="avoid">
                                    <h5>🔒 High Confidence + Clear Logic</h5>
                                    <p>When Oracle is 85%+ confident with obvious reasoning (like great matchup + perfect weather), the data is probably overwhelming</p>
                                </div>
                                <div class="avoid">
                                    <h5>📊 Pure Statistical Advantages</h5>
                                    <p>Don't fight clear statistical edges like target share, red zone touches, or pace of play advantages</p>
                                </div>
                                <div class="avoid">
                                    <h5>🤒 Obvious Injury Impacts</h5>
                                    <p>When Oracle accounts for clear injury downgrades, it's usually using accurate medical probability data</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            visual: '🏆',
            quiz: {
                question: "What's the best strategy for beating The Oracle?",
                options: [
                    "Always pick the opposite of Oracle's choice",
                    "Only challenge high confidence predictions",
                    "Target low confidence predictions with specific insights",
                    "Never disagree with AI predictions"
                ],
                correctAnswer: 2,
                explanation: "The best strategy is to target low confidence predictions (60-70%) where Oracle is uncertain, and use your specific knowledge about intangibles, recent developments, or coaching tendencies that the AI might miss."
            }
        },
        {
            id: 'getting-started',
            title: '🚀 Getting Started with Oracle Challenges',
            content: `
                <div class="getting-started">
                    <h3>Ready to Challenge The Oracle?</h3>
                    <p>You now have the foundation to compete! Here's your step-by-step action plan:</p>
                    
                    <div class="action-plan">
                        <div class="step">
                            <h4>Step 1: Start with Practice Mode</h4>
                            <p>Begin with low-stakes predictions to get comfortable with the interface and build confidence</p>
                            <div class="tips">
                                <p><strong>Focus on:</strong> Understanding how confidence levels work in practice</p>
                                <p><strong>Goal:</strong> Complete 5-10 practice predictions to learn the patterns</p>
                            </div>
                        </div>
                        
                        <div class="step">
                            <h4>Step 2: Target Your Strengths</h4>
                            <p>Choose prediction categories where you have the most knowledge</p>
                            <div class="tips">
                                <p><strong>If you know injuries well:</strong> Focus on Injury Impact predictions</p>
                                <p><strong>If you track weather:</strong> Target Weather Impact challenges</p>
                                <p><strong>If you know players deeply:</strong> Take on Player Performance predictions</p>
                            </div>
                        </div>
                        
                        <div class="step">
                            <h4>Step 3: Look for Low Confidence Opportunities</h4>
                            <p>When Oracle confidence is 60-70%, that's your prime opportunity</p>
                            <div class="tips">
                                <p><strong>Red flags for Oracle:</strong> Recent player news, coaching changes, unique weather</p>
                                <p><strong>Your advantage:</strong> Real-time insights, intuition, contrarian thinking</p>
                            </div>
                        </div>
                        
                        <div class="step">
                            <h4>Step 4: Track Your Performance</h4>
                            <p>Use the analytics dashboard to see where you're beating Oracle</p>
                            <div class="tips">
                                <p><strong>Learn from wins:</strong> What insights gave you an edge?</p>
                                <p><strong>Learn from losses:</strong> Where was Oracle's data advantage too strong?</p>
                            </div>
                        </div>
                        
                        <div class="step">
                            <h4>Step 5: Engage with the Community</h4>
                            <p>Join leagues and debates to share strategies and learn from others</p>
                            <div class="tips">
                                <p><strong>Social features:</strong> Create or join prediction leagues</p>
                                <p><strong>Debates:</strong> Discuss strategy and share insights</p>
                                <p><strong>Group predictions:</strong> Collaborate and learn from other users</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="success-metrics">
                        <h4>📈 Success Milestones</h4>
                        <div class="milestones">
                            <div class="milestone">
                                <h5>🎯 Beginner Success</h5>
                                <p>Beat Oracle on 1 out of 3 predictions (33% success rate)</p>
                                <p><em>This is already impressive against advanced AI!</em></p>
                            </div>
                            <div class="milestone">
                                <h5>🏆 Intermediate Success</h5>
                                <p>Beat Oracle on 2 out of 5 predictions (40% success rate)</p>
                                <p><em>You're developing real expertise!</em></p>
                            </div>
                            <div class="milestone">
                                <h5>🌟 Expert Success</h5>
                                <p>Beat Oracle on 1 out of 2 predictions (50% success rate)</p>
                                <p><em>You're matching AI performance - exceptional!</em></p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="final-tips">
                        <h4>💡 Final Pro Tips</h4>
                        <ul>
                            <li><strong>Stay updated:</strong> Follow injury reports and weather forecasts closely</li>
                            <li><strong>Think contrarian:</strong> When everyone expects one thing, consider the opposite</li>
                            <li><strong>Trust your instincts:</strong> Your human intuition is your biggest advantage</li>
                            <li><strong>Learn continuously:</strong> Each prediction teaches you something new</li>
                            <li><strong>Have fun:</strong> Enjoy the challenge of competing with AI!</li>
                        </ul>
                    </div>
                </div>
            `,
            visual: '🎊'
        }
    ];

    // Load saved progress on component mount
    useEffect(() => {
        const savedProgress = localStorage.getItem('oracle-beginner-tutorial-progress');
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);
                setUserProgress(prev => ({
                    ...prev,
                    ...progress,
                    completedSteps: new Set(progress.completedSteps || []),
                    lastAccessed: new Date().toISOString()
                }));
                setCurrentStep(progress.currentStep || 0);
            } catch (error) {
                console.warn('Failed to load tutorial progress:', error);
            }
        }
    }, []);

    // Save progress whenever it changes
    useEffect(() => {
        const progressToSave = {
            ...userProgress,
            completedSteps: Array.from(userProgress.completedSteps),
            currentStep,
            lastAccessed: new Date().toISOString()
        };
        localStorage.setItem('oracle-beginner-tutorial-progress', JSON.stringify(progressToSave));
    }, [userProgress, currentStep]);

    // Handle quiz submission
    const handleQuizSubmit = () => {
        if (selectedAnswer === null) return;
        
        const currentQuiz = tutorialSteps[currentStep].quiz;
        if (!currentQuiz) return;
        
        const isCorrect = selectedAnswer === currentQuiz.correctAnswer;
        
        setUserProgress(prev => ({
            ...prev,
            quizResults: {
                ...prev.quizResults,
                [currentStep]: isCorrect
            }
        }));
        
        setShowResult(true);
    };

    // Handle practice challenge submission
    const handlePracticeSubmit = () => {
        if (!practiceInput.trim()) return;
        
        // Simple scoring based on input length and relevance keywords
        const relevantKeywords = ['matchup', 'weather', 'injury', 'volume', 'target', 'chemistry', 'coaching', 'trend'];
        const score = Math.min(100, 
            (practiceInput.length / 10) + 
            (relevantKeywords.filter((keyword: any) => 
                practiceInput.toLowerCase().includes(keyword)
            ).length * 10)
        );
        
        setUserProgress(prev => ({
            ...prev,
            practiceScores: {
                ...prev.practiceScores,
                [currentStep]: score
            }
        }));
        
        setShowResult(true);
    };

    // Navigate to next step
    const nextStep = () => {
        const newCompletedSteps = new Set(userProgress.completedSteps);
        newCompletedSteps.add(currentStep);
        
        setUserProgress(prev => ({
            ...prev,
            completedSteps: newCompletedSteps
        }));
        
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setPracticeInput('');
        } else {
            // Tutorial complete
            setTutorialComplete(true);
            recordTutorialCompletion();
        }
    };

    // Navigate to previous step
    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setPracticeInput('');
        }
    };

    // Record tutorial completion
    const recordTutorialCompletion = () => {
        const completionData = {
            completedAt: new Date().toISOString(),
            timeSpent: new Date().getTime() - new Date(userProgress.startTime).getTime(),
            quizAccuracy: Object.values(userProgress.quizResults).filter(Boolean).length / Object.keys(userProgress.quizResults).length,
            stepsCompleted: userProgress.completedSteps.size + 1,
            averagePracticeScore: Object.values(userProgress.practiceScores).reduce((a, b) => a + b, 0) / Object.values(userProgress.practiceScores).length
        };
        
        // Record in education service
        try {
            // Record tutorial completion in localStorage for education service
            localStorage.setItem('oracle-tutorial-oracle-introduction-completion', JSON.stringify({
                completed: true,
                completedAt: completionData.completedAt,
                quizScore: completionData.quizAccuracy * 100,
                timeSpent: completionData.timeSpent
            }));
        } catch (error) {
            console.warn('Failed to record tutorial completion:', error);
        }
        
        localStorage.setItem('oracle-beginner-tutorial-completion', JSON.stringify(completionData));
    };

    const currentTutorialStep = tutorialSteps[currentStep];
    const progressPercentage = ((currentStep + 1) / tutorialSteps.length) * 100;

    if (tutorialComplete) {
        return (
            <div className="oracle-tutorial-complete">
                <div className="completion-celebration">
                    <div className="celebration-header">
                        <h2>🎉 Congratulations!</h2>
                        <h3>You&apos;ve completed the Oracle Beginner Tutorial!</h3>
                    </div>
                    
                    <div className="completion-stats">
                        <div className="stat">
                            <span className="stat-label">Quiz Accuracy:</span>
                            <span className="stat-value">
                                {Math.round((Object.values(userProgress.quizResults).filter(Boolean).length / Object.keys(userProgress.quizResults).length) * 100)}%
                            </span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Steps Completed:</span>
                            <span className="stat-value">{tutorialSteps.length}/{tutorialSteps.length}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Average Practice Score:</span>
                            <span className="stat-value">
                                {Math.round(Object.values(userProgress.practiceScores).reduce((a, b) => a + b, 0) / Object.values(userProgress.practiceScores).length) || 0}
                            </span>
                        </div>
                    </div>
                    
                    <div className="next-steps">
                        <h4>🚀 Ready for the Next Level?</h4>
                        <div className="next-step-options">
                            <button className="primary-button">
                                🎯 Start Oracle Challenges
                            </button>
                            <button className="secondary-button">
                                📚 Advanced Tutorial
                            </button>
                            <button className="secondary-button">
                                🏆 Practice Center
                            </button>
                        </div>
                    </div>
                    
                    <div className="restart-option">
                        <button 
                            className="text-button"
                            onClick={() => {
                                setTutorialComplete(false);
                                setCurrentStep(0);
                                setUserProgress({
                                    currentStep: 0,
                                    completedSteps: new Set(),
                                    quizResults: {},
                                    practiceScores: {},
                                    startTime: new Date().toISOString(),
                                    lastAccessed: new Date().toISOString()
                                });
                            }}
                        >
                            🔄 Restart Tutorial
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="oracle-beginner-tutorial">
            <div className="tutorial-header">
                <div className="progress-section">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="progress-text">
                        Step {currentStep + 1} of {tutorialSteps.length} ({Math.round(progressPercentage)}%)
                    </div>
                </div>
                
                <div className="step-indicator">
                    {tutorialSteps.map((step, index) => (
                        <div 
                            key={step.id}
                            className={`step-dot ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'current' : ''}`}
                            title={step.title}
                        >
                            {userProgress.completedSteps.has(index) ? '✓' : index + 1}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="tutorial-content">
                <div className="step-header">
                    <div className="step-visual">{currentTutorialStep.visual}</div>
                    <h2>{currentTutorialStep.title}</h2>
                </div>
                
                <div 
                    className="step-content"
                    dangerouslySetInnerHTML={{ __html: currentTutorialStep.content }}
                />
                
                {/* Quiz Section */}
                {currentTutorialStep.quiz && (
                    <div className="quiz-section">
                        <h4>🧠 Knowledge Check</h4>
                        <div className="quiz-question">
                            <p><strong>{currentTutorialStep.quiz.question}</strong></p>
                            <div className="quiz-options">
                                {currentTutorialStep.quiz.options.map((option, index) => (
                                    <button
                                        key={`quiz-option-${currentStep}-${index}`}
                                        className={`quiz-option ${selectedAnswer === index ? 'selected' : ''}`}
                                        onClick={() => setSelectedAnswer(index)}
                                        disabled={showResult}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            
                            {!showResult && selectedAnswer !== null && (
                                <button 
                                    className="submit-quiz-button"
                                    onClick={handleQuizSubmit}
                                >
                                    Submit Answer
                                </button>
                            )}
                            
                            {showResult && currentTutorialStep.quiz && (
                                <div className={`quiz-result ${selectedAnswer === currentTutorialStep.quiz.correctAnswer ? 'correct' : 'incorrect'}`}>
                                    <div className="result-header">
                                        {selectedAnswer === currentTutorialStep.quiz.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                                    </div>
                                    <div className="result-explanation">
                                        <strong>Explanation:</strong> {currentTutorialStep.quiz.explanation}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Practice Challenge Section */}
                {currentTutorialStep.practiceChallenge && (
                    <div className="practice-section">
                        <h4>💪 Practice Challenge</h4>
                        <div className="practice-scenario">
                            <p><strong>Scenario:</strong> {currentTutorialStep.practiceChallenge.scenario}</p>
                            
                            {currentTutorialStep.practiceChallenge.type === 'prediction' && currentTutorialStep.practiceChallenge.options && (
                                <div className="practice-options">
                                    {currentTutorialStep.practiceChallenge.options.map((option, index) => (
                                        <button
                                            key={`practice-option-${currentStep}-${index}`}
                                            className={`practice-option ${selectedAnswer === index ? 'selected' : ''}`}
                                            onClick={() => setSelectedAnswer(index)}
                                            disabled={showResult}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {currentTutorialStep.practiceChallenge.type === 'reasoning' && (
                                <div className="practice-input">
                                    <textarea
                                        value={practiceInput}
                                        onChange={(e: any) => setPracticeInput(e.target.value)}
                                        placeholder="Share your reasoning and analysis..."
                                        disabled={showResult}
                                        rows={4}
                                    />
                                </div>
                            )}
                            
                            {!showResult && (
                                <button 
                                    className="submit-practice-button"
                                    onClick={currentTutorialStep.practiceChallenge.type === 'prediction' ? handleQuizSubmit : handlePracticeSubmit}
                                    disabled={
                                        currentTutorialStep.practiceChallenge.type === 'prediction' 
                                            ? selectedAnswer === null 
                                            : !practiceInput.trim()
                                    }
                                >
                                    Submit Practice
                                </button>
                            )}
                            
                            {showResult && (
                                <div className="practice-result">
                                    {currentTutorialStep.practiceChallenge.type === 'prediction' ? (
                                        <div className={`result ${selectedAnswer === currentTutorialStep.practiceChallenge.expectedAnswer ? 'correct' : 'incorrect'}`}>
                                            {selectedAnswer === currentTutorialStep.practiceChallenge.expectedAnswer ? '🎯 Great thinking!' : '📚 Good attempt!'}
                                            <p>The key insight is understanding how multiple factors combine to influence Oracle&apos;s confidence.</p>
                                        </div>
                                    ) : (
                                        <div className="reasoning-feedback">
                                            <div className="score">
                                                Score: {userProgress.practiceScores[currentStep] || 0}/100
                                            </div>
                                            <p>Excellent reasoning! You&apos;re thinking like a fantasy expert. Key factors to consider: {currentTutorialStep.practiceChallenge.expectedAnswer}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="tutorial-navigation">
                <button 
                    className="nav-button prev-button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                >
                    ← Previous
                </button>
                
                <button 
                    className="nav-button next-button"
                    onClick={nextStep}
                    disabled={
                        (currentTutorialStep.quiz && !showResult) ||
                        (currentTutorialStep.practiceChallenge && !showResult)
                    }
                >
                    {currentStep === tutorialSteps.length - 1 ? 'Complete Tutorial' : 'Next →'}
                </button>
            </div>
        </div>
    );
};

export default OracleBeginnerTutorial;
