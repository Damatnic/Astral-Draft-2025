/**
 * Oracle Architecture Overview Component
 * Educational section explaining Oracle's prediction architecture and system design
 */

import React, { useState, useEffect } from 'react';
import './OracleArchitectureOverview.css';

interface ArchitectureLayer {
    id: string;
    name: string;
    description: string;
    components: string[];
    dataFlow: string;
    examples: string[];
}

interface SystemComponent {
    id: string;
    name: string;
    purpose: string;
    inputs: string[];
    outputs: string[];
    technology: string;
}

interface DataFlowStep {
    id: string;
    step: number;
    title: string;
    description: string;
    duration: string;
    dependencies: string[];
}

const OracleArchitectureOverview: React.FC = () => {
    const [activeLayer, setActiveLayer] = useState<string>('data-layer');
    const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
    const [showDataFlow, setShowDataFlow] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

    // Architecture layers definition
    const architectureLayers: ArchitectureLayer[] = [
        {
            id: 'data-layer',
            name: 'Data Ingestion Layer',
            description: 'Real-time sports data collection and validation from multiple sources',
            components: ['SportsIO API', 'Live Data Feeds', 'Data Validators', 'Cache Management'],
            dataFlow: 'External APIs → Data Validation → Real-time Processing → Storage',
            examples: [
                'Player statistics updates every 30 seconds during games',
                'Injury reports processed within minutes of announcement',
                'Weather data refreshed hourly for all game locations',
                'Team roster changes tracked in real-time'
            ]
        },
        {
            id: 'processing-layer',
            name: 'Data Processing Layer',
            description: 'Feature extraction and data transformation for machine learning models',
            components: ['Feature Extractors', 'Data Preprocessors', 'Statistical Calculators', 'Trend Analyzers'],
            dataFlow: 'Raw Data → Feature Extraction → Normalization → Model Input',
            examples: [
                'Convert player stats into 18-dimensional feature vectors',
                'Calculate Player Efficiency Ratings (PER) from raw statistics',
                'Extract team chemistry scores from performance patterns',
                'Generate matchup difficulty ratings based on historical data'
            ]
        },
        {
            id: 'ai-layer',
            name: 'AI Intelligence Layer',
            description: 'Gemini AI integration for natural language processing and intelligent analysis',
            components: ['Gemini AI Engine', 'NLP Processors', 'Context Analyzers', 'Reasoning Generators'],
            dataFlow: 'Structured Data → AI Analysis → Natural Language Reasoning → Confidence Scoring',
            examples: [
                'Generate human-readable explanations for predictions',
                'Analyze complex scenario interactions using natural language',
                'Provide contextual reasoning for prediction confidence',
                'Adapt communication style based on user expertise level'
            ]
        },
        {
            id: 'ml-layer',
            name: 'Machine Learning Layer',
            description: 'Advanced statistical modeling and ensemble prediction algorithms',
            components: ['Ensemble Models', 'Confidence Calibrators', 'Pattern Detectors', 'Accuracy Optimizers'],
            dataFlow: 'Feature Vectors → Model Training → Ensemble Prediction → Confidence Calibration',
            examples: [
                'Combine multiple prediction models for consensus accuracy',
                'Calibrate confidence scores based on historical performance',
                'Detect seasonal patterns and trend shifts automatically',
                'Continuously learn from prediction outcomes'
            ]
        },
        {
            id: 'prediction-layer',
            name: 'Prediction Generation Layer',
            description: 'Final prediction synthesis and output formatting',
            components: ['Prediction Synthesizers', 'Probability Calculators', 'Risk Assessors', 'Output Formatters'],
            dataFlow: 'Model Outputs → Synthesis → Probability Assignment → User Interface',
            examples: [
                'Generate 5 types of predictions: Player, Game, Scoring, Weather, Injury',
                'Calculate precise probability distributions for all options',
                'Assess prediction risk and uncertainty levels',
                'Format predictions for optimal user comprehension'
            ]
        }
    ];

    // System components definition
    const systemComponents: SystemComponent[] = [
        {
            id: 'oracle-prediction-service',
            name: 'Oracle Prediction Service',
            purpose: 'Central orchestrator for all prediction generation and management',
            inputs: ['Live sports data', 'Historical trends', 'User preferences'],
            outputs: ['Structured predictions', 'Confidence scores', 'Supporting data'],
            technology: 'TypeScript/React with advanced analytics integration'
        },
        {
            id: 'gemini-ai-engine',
            name: 'Gemini AI Engine',
            purpose: 'Natural language processing and intelligent reasoning generation',
            inputs: ['Structured prediction data', 'Context prompts', 'Analysis requirements'],
            outputs: ['Human-readable reasoning', 'Contextual explanations', 'Confidence assessments'],
            technology: 'Google Gemini AI with fantasy football optimization'
        },
        {
            id: 'ml-learning-service',
            name: 'Machine Learning Service',
            purpose: 'Continuous model improvement and accuracy optimization',
            inputs: ['Historical predictions', 'Actual outcomes', 'Feature vectors'],
            outputs: ['Model updates', 'Accuracy metrics', 'Performance insights'],
            technology: 'Advanced ML algorithms with ensemble modeling'
        },
        {
            id: 'advanced-analytics',
            name: 'Advanced Analytics Service',
            purpose: 'Complex statistical modeling and advanced metric calculation',
            inputs: ['Player statistics', 'Team data', 'Market information'],
            outputs: ['PER ratings', 'Chemistry scores', 'Market sentiment'],
            technology: 'Statistical modeling with real-time calculation'
        },
        {
            id: 'real-time-processor',
            name: 'Real-time Data Processor',
            purpose: 'Live data monitoring and dynamic prediction updates',
            inputs: ['Live game feeds', 'Breaking news', 'Roster changes'],
            outputs: ['Real-time updates', 'Dynamic adjustments', 'Alert notifications'],
            technology: 'Event-driven architecture with WebSocket connections'
        }
    ];

    // Data flow steps
    const dataFlowSteps: DataFlowStep[] = [
        {
            id: 'data-collection',
            step: 1,
            title: 'Data Collection',
            description: 'Gather live sports data from multiple sources including SportsIO API, injury reports, and weather services',
            duration: '30-second intervals',
            dependencies: []
        },
        {
            id: 'data-validation',
            step: 2,
            title: 'Data Validation',
            description: 'Validate incoming data for accuracy, completeness, and consistency using automated quality checks',
            duration: '< 5 seconds',
            dependencies: ['data-collection']
        },
        {
            id: 'feature-extraction',
            step: 3,
            title: 'Feature Extraction',
            description: 'Convert raw data into structured feature vectors for machine learning models',
            duration: '10-15 seconds',
            dependencies: ['data-validation']
        },
        {
            id: 'advanced-analytics',
            step: 4,
            title: 'Advanced Analytics',
            description: 'Calculate Player Efficiency Ratings, team chemistry scores, and market sentiment analysis',
            duration: '15-20 seconds',
            dependencies: ['feature-extraction']
        },
        {
            id: 'ml-processing',
            step: 5,
            title: 'ML Processing',
            description: 'Run ensemble models and generate preliminary predictions with confidence scoring',
            duration: '20-30 seconds',
            dependencies: ['advanced-analytics']
        },
        {
            id: 'ai-analysis',
            step: 6,
            title: 'AI Analysis',
            description: 'Gemini AI processes structured data and generates human-readable reasoning',
            duration: '10-15 seconds',
            dependencies: ['ml-processing']
        },
        {
            id: 'prediction-synthesis',
            step: 7,
            title: 'Prediction Synthesis',
            description: 'Combine all analysis layers into final predictions with supporting evidence',
            duration: '5-10 seconds',
            dependencies: ['ai-analysis']
        },
        {
            id: 'output-generation',
            step: 8,
            title: 'Output Generation',
            description: 'Format predictions for user interface with interactive elements and explanations',
            duration: '< 5 seconds',
            dependencies: ['prediction-synthesis']
        }
    ];

    // Progress tracking
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => prev < 100 ? prev + 1 : 0);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // Helper functions
    const getLayerIcon = (layerId: string): string => {
        const icons: Record<string, string> = {
            'data-layer': '📡',
            'processing-layer': '⚙️',
            'ai-layer': '🤖',
            'ml-layer': '🧠',
            'prediction-layer': '🎯'
        };
        return icons[layerId] || '📊';
    };

    const getComponentStatusColor = (componentId: string): string => {
        const colors: Record<string, string> = {
            'oracle-prediction-service': '#2196F3',
            'gemini-ai-engine': '#4CAF50',
            'ml-learning-service': '#FF9800',
            'advanced-analytics': '#9C27B0',
            'real-time-processor': '#F44336'
        };
        return colors[componentId] || '#757575';
    };

    const renderArchitectureLayer = (layer: ArchitectureLayer) => (
        <button
            key={layer.id}
            className={`architecture-layer ${activeLayer === layer.id ? 'active' : ''}`}
            onClick={() => setActiveLayer(layer.id)}
            type="button"
            aria-expanded={activeLayer === layer.id}
            aria-controls={`layer-content-${layer.id}`}
        >
            <div className="layer-header">
                <span className="layer-icon">{getLayerIcon(layer.id)}</span>
                <h3 className="layer-name">{layer.name}</h3>
            </div>
            
            <div className="layer-content" id={`layer-content-${layer.id}`}>
                <p className="layer-description">{layer.description}</p>
                
                <div className="layer-components">
                    <h4>Key Components:</h4>
                    <ul>
                        {layer.components.map((component, index) => (
                            <li key={`${layer.id}-component-${index}`}>{component}</li>
                        ))}
                    </ul>
                </div>
                
                <div className="data-flow">
                    <h4>Data Flow:</h4>
                    <div className="flow-diagram">
                        {layer.dataFlow.split(' → ').map((step, index, array) => (
                            <React.Fragment key={`${layer.id}-flow-${index}`}>
                                <span className="flow-step">{step}</span>
                                {index < array.length - 1 && <span className="flow-arrow">→</span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                
                <div className="layer-examples">
                    <h4>Examples:</h4>
                    <ul>
                        {layer.examples.map((example, index) => (
                            <li key={`${layer.id}-example-${index}`}>{example}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </button>
    );

    const renderSystemComponent = (component: SystemComponent) => (
        <button
            key={component.id}
            className={`system-component ${selectedComponent === component.id ? 'selected' : ''}`}
            onClick={() => setSelectedComponent(selectedComponent === component.id ? null : component.id)}
            style={{ borderColor: getComponentStatusColor(component.id) }}
            type="button"
            aria-expanded={selectedComponent === component.id}
            aria-controls={`component-details-${component.id}`}
        >
            <div className="component-header">
                <div
                    className="component-status"
                    style={{ backgroundColor: getComponentStatusColor(component.id) }}
                ></div>
                <h4 className="component-name">{component.name}</h4>
            </div>
            
            {selectedComponent === component.id && (
                <div className="component-details" id={`component-details-${component.id}`}>
                    <p className="component-purpose">{component.purpose}</p>
                    
                    <div className="component-io">
                        <div className="inputs">
                            <h5>Inputs:</h5>
                            <ul>
                                {component.inputs.map((input, index) => (
                                    <li key={`${component.id}-input-${index}`}>{input}</li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="outputs">
                            <h5>Outputs:</h5>
                            <ul>
                                {component.outputs.map((output, index) => (
                                    <li key={`${component.id}-output-${index}`}>{output}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    <div className="component-tech">
                        <h5>Technology:</h5>
                        <p>{component.technology}</p>
                    </div>
                </div>
            )}
        </button>
    );

    const renderDataFlowStep = (step: DataFlowStep) => (
        <div key={step.id} className="data-flow-step">
            <div className="step-number">{step.step}</div>
            <div className="step-content">
                <h4 className="step-title">{step.title}</h4>
                <p className="step-description">{step.description}</p>
                <div className="step-meta">
                    <span className="step-duration">⏱️ {step.duration}</span>
                    {step.dependencies.length > 0 && (
                        <span className="step-dependencies">
                            🔗 Depends on: {step.dependencies.join(', ')}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="oracle-architecture-overview">
            <div className="overview-header">
                <h2>🏗️ Oracle Prediction Architecture</h2>
                <p className="overview-description">
                    Discover how Oracle's sophisticated AI-driven prediction system processes millions of data points 
                    to generate accurate fantasy football predictions. This multi-layered architecture combines 
                    real-time data processing, advanced machine learning, and natural language AI to deliver 
                    insights that consistently outperform traditional analysis methods.
                </p>
            </div>

            <div className="architecture-sections">
                {/* System Overview */}
                <section className="architecture-section">
                    <h3>📊 System Overview</h3>
                    <div className="system-overview">
                        <div className="overview-stats">
                            <div className="stat-item">
                                <span className="stat-number">5</span>
                                <span className="stat-label">Architecture Layers</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">18</span>
                                <span className="stat-label">Feature Dimensions</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">30s</span>
                                <span className="stat-label">Update Frequency</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">85%+</span>
                                <span className="stat-label">Accuracy Rate</span>
                            </div>
                        </div>
                        
                        <div className="architecture-diagram">
                            <div className="diagram-header">
                                <h4>Prediction Pipeline</h4>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                    <span className="progress-text">Processing: {progress}%</span>
                                </div>
                            </div>
                            
                            <div className="pipeline-visualization">
                                {architectureLayers.map((layer, index) => (
                                    <button 
                                        key={layer.id} 
                                        className={`pipeline-layer ${activeLayer === layer.id ? 'active' : ''}`}
                                        onClick={() => setActiveLayer(layer.id)}
                                        type="button"
                                        aria-label={`Select ${layer.name}`}
                                    >
                                        <div className="pipeline-icon">{getLayerIcon(layer.id)}</div>
                                        <div className="pipeline-name">{layer.name}</div>
                                        {index < architectureLayers.length - 1 && (
                                            <div className="pipeline-connector">↓</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Architecture Layers */}
                <section className="architecture-section">
                    <h3>🏗️ Architecture Layers</h3>
                    <p className="section-description">
                        Oracle's prediction system is built on five interconnected layers, each responsible 
                        for specific aspects of data processing and analysis. Click on each layer to explore 
                        its components and data flow.
                    </p>
                    
                    <div className="architecture-layers">
                        {architectureLayers.map(renderArchitectureLayer)}
                    </div>
                </section>

                {/* System Components */}
                <section className="architecture-section">
                    <h3>⚙️ Core Components</h3>
                    <p className="section-description">
                        Each layer contains specialized components that work together to process data and 
                        generate predictions. Click on components to see their inputs, outputs, and technology stack.
                    </p>
                    
                    <div className="system-components">
                        {systemComponents.map(renderSystemComponent)}
                    </div>
                </section>

                {/* Data Flow */}
                <section className="architecture-section">
                    <h3>🔄 Data Flow Process</h3>
                    <div className="section-controls">
                        <button
                            className={`control-button ${showDataFlow ? 'active' : ''}`}
                            onClick={() => setShowDataFlow(!showDataFlow)}
                        >
                            {showDataFlow ? 'Hide' : 'Show'} Detailed Flow
                        </button>
                    </div>
                    
                    {showDataFlow && (
                        <div className="data-flow-visualization">
                            <p className="flow-description">
                                Follow the complete journey of data from collection to final prediction output. 
                                Each step builds upon the previous one to create increasingly sophisticated analysis.
                            </p>
                            
                            <div className="data-flow-steps">
                                {dataFlowSteps.map(renderDataFlowStep)}
                            </div>
                            
                            <div className="flow-summary">
                                <h4>🎯 End-to-End Processing Time</h4>
                                <div className="timing-breakdown">
                                    <div className="timing-item">
                                        <span className="timing-label">Total Processing:</span>
                                        <span className="timing-value">90-120 seconds</span>
                                    </div>
                                    <div className="timing-item">
                                        <span className="timing-label">Critical Path:</span>
                                        <span className="timing-value">Data → ML → AI → Output</span>
                                    </div>
                                    <div className="timing-item">
                                        <span className="timing-label">Update Frequency:</span>
                                        <span className="timing-value">Every 30 seconds (10s during games)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Key Insights */}
                <section className="architecture-section">
                    <h3>💡 Key Architecture Insights</h3>
                    <div className="insights-grid">
                        <div className="insight-card">
                            <div className="insight-icon">🚀</div>
                            <h4>Performance Optimization</h4>
                            <p>
                                Parallel processing across layers enables sub-2-minute prediction generation 
                                while maintaining high accuracy through comprehensive data analysis.
                            </p>
                        </div>
                        
                        <div className="insight-card">
                            <div className="insight-icon">🔄</div>
                            <h4>Continuous Learning</h4>
                            <p>
                                The ML layer continuously improves by recording prediction outcomes and 
                                retraining models every 7 days to adapt to changing fantasy football patterns.
                            </p>
                        </div>
                        
                        <div className="insight-card">
                            <div className="insight-icon">🎯</div>
                            <h4>Ensemble Accuracy</h4>
                            <p>
                                Multiple prediction models are combined using weighted voting to achieve 
                                higher accuracy than any single model could provide independently.
                            </p>
                        </div>
                        
                        <div className="insight-card">
                            <div className="insight-icon">📊</div>
                            <h4>Real-time Adaptation</h4>
                            <p>
                                Live data monitoring allows predictions to adapt instantly to breaking news, 
                                injury reports, and game-time developments for maximum relevance.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Technical Specifications */}
                <section className="architecture-section">
                    <h3>🔧 Technical Specifications</h3>
                    <div className="tech-specs">
                        <div className="spec-category">
                            <h4>Data Processing</h4>
                            <ul>
                                <li><strong>Input Sources:</strong> SportsIO API, Weather APIs, News Feeds</li>
                                <li><strong>Processing Rate:</strong> 1M+ data points per prediction cycle</li>
                                <li><strong>Feature Dimensions:</strong> 18-dimensional feature vectors</li>
                                <li><strong>Update Frequency:</strong> 30-second intervals (10s during games)</li>
                            </ul>
                        </div>
                        
                        <div className="spec-category">
                            <h4>Machine Learning</h4>
                            <ul>
                                <li><strong>Model Types:</strong> Ensemble methods with multiple algorithms</li>
                                <li><strong>Training Data:</strong> Historical predictions and outcomes</li>
                                <li><strong>Retraining Schedule:</strong> Weekly model optimization</li>
                                <li><strong>Confidence Calibration:</strong> Historical accuracy-based adjustment</li>
                            </ul>
                        </div>
                        
                        <div className="spec-category">
                            <h4>AI Integration</h4>
                            <ul>
                                <li><strong>AI Engine:</strong> Google Gemini with fantasy football optimization</li>
                                <li><strong>Processing:</strong> Natural language reasoning generation</li>
                                <li><strong>Context Awareness:</strong> User expertise level adaptation</li>
                                <li><strong>Output Quality:</strong> Human-readable explanations</li>
                            </ul>
                        </div>
                        
                        <div className="spec-category">
                            <h4>Performance Metrics</h4>
                            <ul>
                                <li><strong>Accuracy Rate:</strong> 85%+ across all prediction types</li>
                                <li><strong>Response Time:</strong> &lt; 2 minutes end-to-end</li>
                                <li><strong>Uptime:</strong> 99.9% availability during NFL season</li>
                                <li><strong>Scalability:</strong> Handles 10K+ concurrent users</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>

            <div className="overview-footer">
                <div className="next-steps">
                    <h4>🎓 Continue Learning</h4>
                    <p>
                        Now that you understand Oracle's architecture, explore how each component works in detail:
                    </p>
                    <div className="next-step-buttons">
                        <button className="next-step-btn">
                            🤖 AI Integration Details
                        </button>
                        <button className="next-step-btn">
                            📡 Data Processing Deep Dive
                        </button>
                        <button className="next-step-btn">
                            🧠 Machine Learning Methods
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OracleArchitectureOverview;
