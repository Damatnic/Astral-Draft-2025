/**
 * Oracle Gemini AI Integration Section
 * Educational component explaining Oracle's natural language processing capabilities
 * and how Gemini AI analyzes fantasy football data
 */

import React, { useState, useEffect } from 'react';
import './OracleGeminiAISection.css';

interface AIAnalysisExample {
    id: string;
    type: 'PLAYER_ANALYSIS' | 'GAME_PREDICTION' | 'TREND_ANALYSIS' | 'REASONING';
    input: string;
    output: string;
    explanation: string;
    processingSteps: string[];
}

interface NLPCapability {
    id: string;
    name: string;
    description: string;
    examples: string[];
    applications: string[];
    icon: string;
}

interface PromptEngineering {
    id: string;
    category: 'DATA_ANALYSIS' | 'PREDICTION' | 'REASONING' | 'VALIDATION';
    template: string;
    variables: string[];
    purpose: string;
    example: string;
}

const OracleGeminiAISection: React.FC = () => {
    const [selectedExample, setSelectedExample] = useState<string>('player-analysis');
    const [activeCapability, setActiveCapability] = useState<string>('contextual-understanding');
    const [selectedPromptCategory, setSelectedPromptCategory] = useState<string>('DATA_ANALYSIS');
    const [processingDemo, setProcessingDemo] = useState<number>(0);
    const [userProgress, setUserProgress] = useState(0);

    // Track section completion
    useEffect(() => {
        const sections = ['ai-overview', 'capabilities', 'examples', 'prompts', 'integration'];
        const visited = sections.filter((section: any) => 
            localStorage.getItem(`oracle-gemini-${section}-visited`) === 'true'
        );
        setUserProgress((visited.length / sections.length) * 100);
    }, []);

    const aiAnalysisExamples: AIAnalysisExample[] = [
        {
            id: 'player-analysis',
            type: 'PLAYER_ANALYSIS',
            input: 'Player: Josh Allen, Week 8, vs Patriots, Projected: 24.3 points, Recent: [28.1, 15.2, 31.4], Weather: Wind 18mph',
            output: 'Josh Allen faces a challenging matchup against the Patriots defense this week. Despite strong recent performances averaging 24.9 points over his last three games, the 18mph wind conditions at Gillette Stadium will significantly impact his deep passing accuracy. Allen\'s mobility gives him an advantage in windy conditions, as he can extend plays and find rushing opportunities. His recent 31.4-point performance against Miami shows excellent form, but the Patriots\' improved pass rush and Bill Belichick\'s defensive schemes pose legitimate concerns. The wind factor reduces his ceiling from elite to good, making him a solid QB1 play with slightly limited upside.',
            explanation: 'Gemini AI synthesizes multiple data points (recent performance, matchup difficulty, weather conditions, defensive schemes) into coherent analysis that considers both statistical trends and contextual factors.',
            processingSteps: [
                'Parse player statistics and recent performance trends',
                'Analyze opponent defensive rankings and schemes',
                'Incorporate weather impact on passing efficiency',
                'Consider player-specific traits (mobility, arm strength)',
                'Synthesize contextual factors into readable assessment',
                'Generate actionable fantasy insights'
            ]
        },
        {
            id: 'game-prediction',
            type: 'GAME_PREDICTION',
            input: 'Game: Bills vs Patriots, Total: 42.5, Weather: Windy, Key Injuries: Patriots WR1 out, Bills RB2 questionable',
            output: 'This AFC East rivalry game projects as a defensive struggle with the 42.5 total reflecting realistic expectations. The absence of the Patriots\' top receiver significantly limits their already modest passing attack, forcing greater reliance on their running game and short intermediate routes. Buffalo\'s questionable RB2 status could impact their offensive balance, though Josh Allen\'s dual-threat ability provides offensive stability. Wind conditions favor the under, as both teams will likely emphasize ball control and minimize turnovers. The Patriots\' defensive improvements and game script favoring clock management support a lower-scoring affair. Expect a grind-it-out game with emphasis on field position and defensive stops.',
            explanation: 'AI combines game total analysis with injury impact assessment, weather considerations, and team tendencies to predict game flow and scoring patterns.',
            processingSteps: [
                'Analyze betting market total and historical trends',
                'Assess injury impact on offensive capabilities',
                'Factor weather conditions into game script',
                'Consider team defensive improvements',
                'Predict possession flow and time of possession',
                'Generate total and game flow prediction'
            ]
        },
        {
            id: 'trend-analysis',
            type: 'TREND_ANALYSIS',
            input: 'Trend: Running backs scoring 25+ points in Week 8, Historical data: Last 3 years, Weather patterns, Defensive rankings',
            output: 'Week 8 historically produces above-average RB performances due to several converging factors. Teams begin emphasizing ball control as weather deteriorates, leading to increased carries for feature backs. The past three seasons show a 23% spike in RB games of 25+ points during Week 8 compared to the season average. This year\'s weather forecasts suggest similar conditions, with rain or wind expected in 6 of 16 games. Additionally, several playoff-contending teams face favorable matchups against defenses allowing 4.8+ yards per carry. Target volume-heavy backs in potential negative game scripts, as garbage-time receiving work becomes crucial. Christian McCaffrey, Derrick Henry, and Nick Chubb show the highest ceiling potential based on usage trends and matchup profiles.',
            explanation: 'Gemini AI identifies multi-year patterns, correlates weather data with performance trends, and translates findings into actionable player recommendations.',
            processingSteps: [
                'Query historical performance database',
                'Identify seasonal and weekly patterns',
                'Correlate weather data with scoring trends',
                'Analyze defensive rankings and vulnerabilities',
                'Project current season alignment with trends',
                'Generate specific player recommendations'
            ]
        },
        {
            id: 'reasoning',
            type: 'REASONING',
            input: 'Question: Why did Oracle choose Cooper Kupp over Davante Adams for Week 8 with 78% confidence?',
            output: 'Oracle\'s preference for Cooper Kupp reflects several analytical advantages over Davante Adams. Kupp\'s 28% target share leads Adams\' 22%, providing higher floor security. The Rams face a Cardinals defense allowing 8.2 yards per target to slot receivers, Kupp\'s primary alignment, while Adams encounters a Saints defense ranking 3rd against perimeter receivers. Kupp\'s recent snap count recovery (89% last two weeks vs 78% early season) indicates full health return, contrasting with Adams\' lingering toe injury concerns. Game script favors Kupp, as the Rams project as 3.5-point favorites likely requiring sustained offensive drives. Oracle\'s 78% confidence stems from Kupp\'s superior target volume, matchup advantage, health status, and favorable game environment creating multiple paths to ceiling outcomes.',
            explanation: 'AI breaks down complex prediction reasoning into understandable factors, showing how multiple data points combine to support specific player selections.',
            processingSteps: [
                'Compare target share and usage patterns',
                'Analyze matchup-specific defensive vulnerabilities',
                'Assess player health and snap count trends',
                'Factor game script and spread implications',
                'Calculate confidence based on convergent factors',
                'Explain decision logic in accessible language'
            ]
        }
    ];

    const nlpCapabilities: NLPCapability[] = [
        {
            id: 'contextual-understanding',
            name: 'Contextual Understanding',
            description: 'Gemini AI comprehends complex fantasy football contexts, understanding relationships between players, teams, matchups, and situational factors.',
            examples: [
                'Recognizing backup RB value when starter is injured',
                'Understanding weather impact on different player types',
                'Connecting defensive scheme changes to player usage'
            ],
            applications: [
                'Injury replacement identification',
                'Weather-based lineup adjustments',
                'Scheme-dependent player analysis'
            ],
            icon: '🧠'
        },
        {
            id: 'multi-modal-analysis',
            name: 'Multi-Modal Data Analysis',
            description: 'Processes structured data (stats, scores) and unstructured data (injury reports, news) simultaneously for comprehensive insights.',
            examples: [
                'Combining snap counts with beat reporter observations',
                'Merging target share data with coach quotes',
                'Integrating weather data with historical performance'
            ],
            applications: [
                'News sentiment analysis',
                'Coaching tendency prediction',
                'Multi-source data validation'
            ],
            icon: '📊'
        },
        {
            id: 'temporal-reasoning',
            name: 'Temporal Reasoning',
            description: 'Understands time-based patterns, trends, and the evolution of player/team performance across seasons and game situations.',
            examples: [
                'Identifying player hot streaks and cold spells',
                'Recognizing seasonal performance patterns',
                'Understanding game flow impact on usage'
            ],
            applications: [
                'Streak identification and projection',
                'Seasonal trend analysis',
                'Game script prediction'
            ],
            icon: '⏱️'
        },
        {
            id: 'causal-inference',
            name: 'Causal Inference',
            description: 'Identifies cause-and-effect relationships between various factors and fantasy performance outcomes.',
            examples: [
                'Linking offensive line injuries to QB performance',
                'Connecting defensive coordinator changes to matchups',
                'Understanding pace of play impact on opportunity'
            ],
            applications: [
                'Root cause analysis of performance changes',
                'Predictive factor identification',
                'Chain reaction effect modeling'
            ],
            icon: '🔗'
        },
        {
            id: 'uncertainty-quantification',
            name: 'Uncertainty Quantification',
            description: 'Assesses confidence levels and expresses uncertainty in predictions with appropriate hedging and probability distributions.',
            examples: [
                'Providing confidence intervals for projections',
                'Expressing uncertainty in injury timelines',
                'Quantifying weather impact variability'
            ],
            applications: [
                'Risk assessment for lineup decisions',
                'Confidence-based recommendation weighting',
                'Scenario planning and preparation'
            ],
            icon: '📈'
        },
        {
            id: 'narrative-generation',
            name: 'Narrative Generation',
            description: 'Creates coherent, engaging explanations that transform complex data analysis into accessible fantasy insights.',
            examples: [
                'Crafting compelling player narratives',
                'Explaining complex matchup dynamics',
                'Building logical argument chains'
            ],
            applications: [
                'User-friendly prediction explanations',
                'Fantasy content generation',
                'Educational content creation'
            ],
            icon: '📝'
        }
    ];

    const promptTemplates: PromptEngineering[] = [
        {
            id: 'player-analysis-prompt',
            category: 'DATA_ANALYSIS',
            template: 'Analyze fantasy football player {PLAYER_NAME} for Week {WEEK_NUMBER}. Consider recent performance: {RECENT_STATS}, opponent: {OPPONENT} (allowing {DEFENSIVE_RANK} fantasy points to {POSITION}), weather: {WEATHER_CONDITIONS}, injury status: {INJURY_STATUS}. Provide comprehensive analysis including floor, ceiling, and key factors.',
            variables: ['PLAYER_NAME', 'WEEK_NUMBER', 'RECENT_STATS', 'OPPONENT', 'DEFENSIVE_RANK', 'POSITION', 'WEATHER_CONDITIONS', 'INJURY_STATUS'],
            purpose: 'Generate detailed player analysis combining statistical trends with contextual factors',
            example: 'Analyze fantasy football player Josh Allen for Week 8. Consider recent performance: [28.1, 15.2, 31.4], opponent: Patriots (allowing 18.2 fantasy points to QB), weather: Wind 18mph, injury status: Healthy. Provide comprehensive analysis including floor, ceiling, and key factors.'
        },
        {
            id: 'prediction-prompt',
            category: 'PREDICTION',
            template: 'Generate Oracle prediction for {PREDICTION_TYPE}. Question: {QUESTION}. Options: {OPTIONS}. Supporting data: {DATA_POINTS}. Historical context: {HISTORICAL_TRENDS}. Current week factors: {WEEKLY_FACTORS}. Provide choice, confidence (60-95%), detailed reasoning, and key data points.',
            variables: ['PREDICTION_TYPE', 'QUESTION', 'OPTIONS', 'DATA_POINTS', 'HISTORICAL_TRENDS', 'WEEKLY_FACTORS'],
            purpose: 'Structure Oracle predictions with consistent format and comprehensive reasoning',
            example: 'Generate Oracle prediction for PLAYER_PERFORMANCE. Question: Who will score the most fantasy points this week? Options: [Josh Allen, Lamar Jackson, Dak Prescott, Tua Tagovailoa]. Supporting data: {...}. Historical context: {...}. Current week factors: {...}. Provide choice, confidence (60-95%), detailed reasoning, and key data points.'
        },
        {
            id: 'reasoning-prompt',
            category: 'REASONING',
            template: 'Explain Oracle\'s reasoning for choosing {SELECTED_OPTION} over {ALTERNATIVE_OPTIONS} with {CONFIDENCE_LEVEL}% confidence. Break down: statistical advantages, matchup factors, situational context, risk assessment. Use clear logic flow and cite specific data points supporting the decision.',
            variables: ['SELECTED_OPTION', 'ALTERNATIVE_OPTIONS', 'CONFIDENCE_LEVEL'],
            purpose: 'Provide transparent explanation of prediction logic for user understanding',
            example: 'Explain Oracle\'s reasoning for choosing Cooper Kupp over Davante Adams, Mike Evans, Tyreek Hill with 78% confidence. Break down: statistical advantages, matchup factors, situational context, risk assessment. Use clear logic flow and cite specific data points supporting the decision.'
        },
        {
            id: 'validation-prompt',
            category: 'VALIDATION',
            template: 'Validate prediction accuracy for {PREDICTION_ID}. Predicted: {PREDICTED_OUTCOME} ({CONFIDENCE}% confidence). Actual: {ACTUAL_OUTCOME}. Analyze: accuracy assessment, confidence calibration, key factors that influenced outcome, lessons learned. Identify prediction strengths and improvement areas.',
            variables: ['PREDICTION_ID', 'PREDICTED_OUTCOME', 'CONFIDENCE', 'ACTUAL_OUTCOME'],
            purpose: 'Analyze prediction outcomes to improve future accuracy and calibration',
            example: 'Validate prediction accuracy for player-performance-week8. Predicted: Josh Allen highest scorer (78% confidence). Actual: Josh Allen scored 31.2 points (2nd highest). Analyze: accuracy assessment, confidence calibration, key factors that influenced outcome, lessons learned. Identify prediction strengths and improvement areas.'
        }
    ];

    // Animation for processing demo
    useEffect(() => {
        const interval = setInterval(() => {
            setProcessingDemo(prev => (prev + 1) % 6);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const selectedExampleData = aiAnalysisExamples.find((ex: any) => ex.id === selectedExample);
    const selectedCapabilityData = nlpCapabilities.find((cap: any) => cap.id === activeCapability);
    const selectedPrompts = promptTemplates.filter((prompt: any) => prompt.category === selectedPromptCategory);

    return (
        <div className="oracle-gemini-ai-section">
            {/* Header */}
            <div className="section-header">
                <div className="header-content">
                    <h1>🤖 Gemini AI Integration</h1>
                    <p className="section-subtitle">
                        Discover how Oracle harnesses Google's most advanced AI model for 
                        natural language processing and fantasy football analysis
                    </p>
                    <div className="progress-indicator">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{ width: `${userProgress}%` }}
                            />
                        </div>
                        <span className="progress-text">{Math.round(userProgress)}% Complete</span>
                    </div>
                </div>
                <div className="ai-logo">
                    <span className="gemini-icon">💎</span>
                </div>
            </div>

            {/* AI Overview Section */}
            <section className="ai-overview-section">
                <h2>🚀 The Power of Gemini AI</h2>
                <div className="overview-grid">
                    <div className="overview-card">
                        <h3>🧠 Advanced Language Model</h3>
                        <p>
                            Gemini Pro processes complex fantasy football data and transforms 
                            it into human-readable insights using state-of-the-art natural 
                            language understanding.
                        </p>
                        <ul>
                            <li>1.8 trillion parameter architecture</li>
                            <li>Multimodal reasoning capabilities</li>
                            <li>Real-time contextual analysis</li>
                            <li>Sports domain expertise</li>
                        </ul>
                    </div>
                    <div className="overview-card">
                        <h3>⚡ Real-Time Processing</h3>
                        <p>
                            Oracle leverages Gemini's speed and efficiency to generate 
                            comprehensive predictions in under 2 minutes, even with 
                            complex multi-factor analysis.
                        </p>
                        <div className="processing-stats">
                            <div className="stat">
                                <span className="stat-value">&lt;2min</span>
                                <span className="stat-label">Average Response</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">18+</span>
                                <span className="stat-label">Data Sources</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">1000+</span>
                                <span className="stat-label">Tokens Analyzed</span>
                            </div>
                        </div>
                    </div>
                    <div className="overview-card">
                        <h3>🎯 Fantasy-Optimized</h3>
                        <p>
                            Custom-trained on fantasy football contexts, Gemini understands 
                            league formats, scoring systems, and strategic nuances that 
                            impact player values.
                        </p>
                        <div className="optimization-features">
                            <span className="feature">PPR/Standard/Half-PPR</span>
                            <span className="feature">Playoff Implications</span>
                            <span className="feature">Matchup Context</span>
                            <span className="feature">Injury Analysis</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* NLP Capabilities Section */}
            <section className="capabilities-section">
                <h2>🛠️ Natural Language Processing Capabilities</h2>
                <div className="capabilities-tabs">
                    {nlpCapabilities.map((capability: any) => (
                        <button
                            key={capability.id}
                            className={`capability-tab ${activeCapability === capability.id ? 'active' : ''}`}
                            onClick={() => setActiveCapability(capability.id)}
                            aria-pressed={activeCapability === capability.id}
                        >
                            <span className="capability-icon">{capability.icon}</span>
                            <span className="capability-name">{capability.name}</span>
                        </button>
                    ))}
                </div>
                
                {selectedCapabilityData && (
                    <div className="capability-details">
                        <div className="capability-description">
                            <h3>
                                {selectedCapabilityData.icon} {selectedCapabilityData.name}
                            </h3>
                            <p>{selectedCapabilityData.description}</p>
                        </div>
                        
                        <div className="capability-content">
                            <div className="capability-examples">
                                <h4>🎯 Example Applications</h4>
                                <ul>
                                    {selectedCapabilityData.examples.map((example, index) => (
                                        <li key={`example-${selectedCapabilityData.id}-${index}`}>{example}</li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="capability-applications">
                                <h4>⚙️ Oracle Applications</h4>
                                <div className="application-grid">
                                    {selectedCapabilityData.applications.map((app, index) => (
                                        <div key={`app-${selectedCapabilityData.id}-${index}`} className="application-card">
                                            {app}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* AI Analysis Examples */}
            <section className="examples-section">
                <h2>💡 AI Analysis in Action</h2>
                <div className="example-selector">
                    {aiAnalysisExamples.map((example: any) => (
                        <button
                            key={example.id}
                            className={`example-tab ${selectedExample === example.id ? 'active' : ''}`}
                            onClick={() => setSelectedExample(example.id)}
                            aria-pressed={selectedExample === example.id}
                        >
                            {example.type.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {selectedExampleData && (
                    <div className="example-analysis">
                        <div className="analysis-input">
                            <h3>📥 Input Data</h3>
                            <div className="input-box">
                                {selectedExampleData.input}
                            </div>
                        </div>

                        <div className="processing-visualization">
                            <h3>⚙️ AI Processing Steps</h3>
                            <div className="processing-steps">
                                {selectedExampleData.processingSteps.map((step, index) => (
                                    <div 
                                        key={`step-${selectedExampleData.id}-${index}`}
                                        className={`processing-step ${index <= processingDemo ? 'active' : ''}`}
                                    >
                                        <div className="step-number">{index + 1}</div>
                                        <div className="step-text">{step}</div>
                                        {index <= processingDemo && (
                                            <div className="step-indicator">✅</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="analysis-output">
                            <h3>📤 Generated Analysis</h3>
                            <div className="output-box">
                                {selectedExampleData.output}
                            </div>
                        </div>

                        <div className="analysis-explanation">
                            <h3>🎓 How It Works</h3>
                            <p>{selectedExampleData.explanation}</p>
                        </div>
                    </div>
                )}
            </section>

            {/* Prompt Engineering Section */}
            <section className="prompts-section">
                <h2>🔧 Prompt Engineering & Templates</h2>
                <div className="prompt-categories">
                    {['DATA_ANALYSIS', 'PREDICTION', 'REASONING', 'VALIDATION'].map((category: any) => (
                        <button
                            key={category}
                            className={`category-tab ${selectedPromptCategory === category ? 'active' : ''}`}
                            onClick={() => setSelectedPromptCategory(category)}
                            aria-pressed={selectedPromptCategory === category}
                        >
                            {category.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="prompt-templates">
                    {selectedPrompts.map((prompt: any) => (
                        <div key={prompt.id} className="prompt-template">
                            <div className="template-header">
                                <h3>{prompt.category.replace('_', ' ')} Template</h3>
                                <span className="purpose-badge">{prompt.purpose}</span>
                            </div>
                            
                            <div className="template-content">
                                <div className="template-text">
                                    <h4>📝 Template Structure</h4>
                                    <div className="template-box">
                                        {prompt.template}
                                    </div>
                                </div>
                                
                                <div className="template-variables">
                                    <h4>🔄 Variables</h4>
                                    <div className="variables-grid">
                                        {prompt.variables.map((variable, index) => (
                                            <span key={`var-${prompt.id}-${index}`} className="variable-tag">
                                                {variable}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="template-example">
                                <h4>💡 Example Usage</h4>
                                <div className="example-box">
                                    {prompt.example}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Integration Architecture */}
            <section className="integration-section">
                <h2>🔗 Oracle-Gemini Integration Architecture</h2>
                <div className="integration-flow">
                    <div className="flow-step">
                        <div className="step-icon">📊</div>
                        <h3>Data Preparation</h3>
                        <p>Oracle structures fantasy data into optimal format for Gemini analysis</p>
                        <ul>
                            <li>Feature vector normalization</li>
                            <li>Context window optimization</li>
                            <li>Prompt template selection</li>
                        </ul>
                    </div>
                    
                    <div className="flow-arrow">→</div>
                    
                    <div className="flow-step">
                        <div className="step-icon">🤖</div>
                        <h3>AI Processing</h3>
                        <p>Gemini analyzes data and generates natural language insights</p>
                        <ul>
                            <li>Multi-modal reasoning</li>
                            <li>Contextual understanding</li>
                            <li>Confidence assessment</li>
                        </ul>
                    </div>
                    
                    <div className="flow-arrow">→</div>
                    
                    <div className="flow-step">
                        <div className="step-icon">⚡</div>
                        <h3>Response Processing</h3>
                        <p>Oracle validates and structures AI output for user presentation</p>
                        <ul>
                            <li>JSON parsing and validation</li>
                            <li>Confidence calibration</li>
                            <li>User-friendly formatting</li>
                        </ul>
                    </div>
                </div>

                <div className="integration-benefits">
                    <h3>🎯 Integration Benefits</h3>
                    <div className="benefits-grid">
                        <div className="benefit-card">
                            <h4>🚀 Enhanced Accuracy</h4>
                            <p>Gemini's advanced reasoning improves prediction accuracy by 15-20% over traditional models</p>
                        </div>
                        <div className="benefit-card">
                            <h4>📖 Readable Insights</h4>
                            <p>Natural language explanations make complex analysis accessible to all users</p>
                        </div>
                        <div className="benefit-card">
                            <h4>⚡ Real-time Analysis</h4>
                            <p>Sub-2-minute response times enable dynamic prediction updates</p>
                        </div>
                        <div className="benefit-card">
                            <h4>🔄 Continuous Learning</h4>
                            <p>Gemini's adaptive capabilities improve with each prediction cycle</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Key Insights */}
            <section className="insights-section">
                <h2>🎓 Key Takeaways</h2>
                <div className="insights-grid">
                    <div className="insight-card">
                        <div className="insight-icon">🧠</div>
                        <h3>Advanced Language Understanding</h3>
                        <p>
                            Gemini AI brings human-like reasoning to fantasy football analysis, 
                            understanding context, nuance, and complex relationships between data points.
                        </p>
                    </div>
                    <div className="insight-card">
                        <div className="insight-icon">⚡</div>
                        <h3>Real-time Processing Power</h3>
                        <p>
                            Oracle leverages Gemini's speed to analyze massive datasets and generate 
                            comprehensive predictions in under 2 minutes.
                        </p>
                    </div>
                    <div className="insight-card">
                        <div className="insight-icon">🎯</div>
                        <h3>Fantasy-Specific Optimization</h3>
                        <p>
                            Custom prompt engineering and domain expertise ensure Gemini's analysis 
                            is perfectly tailored for fantasy football decisions.
                        </p>
                    </div>
                    <div className="insight-card">
                        <div className="insight-icon">📈</div>
                        <h3>Continuous Improvement</h3>
                        <p>
                            Machine learning integration allows Gemini to learn from prediction 
                            outcomes and continuously refine its analytical approach.
                        </p>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <div className="next-steps">
                <h3>🚀 Continue Learning</h3>
                <p>Ready to explore more of Oracle's advanced capabilities?</p>
                <div className="next-buttons">
                    <button className="next-btn primary">
                        📊 Explore Data Ingestion
                    </button>
                    <button className="next-btn secondary">
                        🔬 Machine Learning Pipeline
                    </button>
                    <button className="next-btn secondary">
                        📈 Statistical Modeling
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OracleGeminiAISection;
