import React, { useState } from 'react';
import './OracleEnsemblePredictionSection.css';

interface EnsembleModel {
  id: string;
  name: string;
  type: string;
  accuracy: number;
  weight: number;
  prediction: number;
  confidence: number;
  description: string;
}

interface VotingMethod {
  id: string;
  name: string;
  description: string;
  formula: string;
  strengths: string[];
  limitations: string[];
}

interface WeightingStrategy {
  id: string;
  name: string;
  description: string;
  method: string;
  advantages: string[];
  useCases: string[];
}

const OracleEnsemblePredictionSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'voting' | 'weighting' | 'optimization' | 'demo'>('overview');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedVoting, setSelectedVoting] = useState<string>('weighted');
  const [selectedWeighting, setSelectedWeighting] = useState<string>('performance');
  const [ensembleResults, setEnsembleResults] = useState<any>(null);

  // Ensemble models used by Oracle
  const ensembleModels: EnsembleModel[] = [
    {
      id: 'linear_regression',
      name: 'Linear Regression',
      type: 'Statistical',
      accuracy: 78.5,
      weight: 0.15,
      prediction: 24.8,
      confidence: 0.82,
      description: 'Linear relationship modeling for baseline predictions'
    },
    {
      id: 'random_forest',
      name: 'Random Forest',
      type: 'Tree-based',
      accuracy: 82.3,
      weight: 0.20,
      prediction: 26.2,
      confidence: 0.88,
      description: 'Ensemble of decision trees for robust predictions'
    },
    {
      id: 'gradient_boosting',
      name: 'Gradient Boosting',
      type: 'Boosting',
      accuracy: 84.1,
      weight: 0.25,
      prediction: 25.9,
      confidence: 0.91,
      description: 'Sequential weak learners for high accuracy'
    },
    {
      id: 'neural_network',
      name: 'Neural Network',
      type: 'Deep Learning',
      accuracy: 85.7,
      weight: 0.25,
      prediction: 27.1,
      confidence: 0.89,
      description: 'Multi-layer perceptron for complex patterns'
    },
    {
      id: 'bayesian_regression',
      name: 'Bayesian Regression',
      type: 'Probabilistic',
      accuracy: 79.8,
      weight: 0.15,
      prediction: 25.4,
      confidence: 0.85,
      description: 'Uncertainty quantification and prior knowledge'
    }
  ];

  // Voting methodologies
  const votingMethods: VotingMethod[] = [
    {
      id: 'simple',
      name: 'Simple Averaging',
      description: 'Equal weight to all model predictions',
      formula: 'Prediction = (P₁ + P₂ + ... + Pₙ) / n',
      strengths: ['Simple to implement', 'Reduces overfitting', 'Stable results'],
      limitations: ['Ignores model quality', 'Poor models affect results', 'No confidence weighting']
    },
    {
      id: 'weighted',
      name: 'Weighted Voting',
      description: 'Weight predictions by model performance',
      formula: 'Prediction = Σ(wᵢ × Pᵢ) where Σwᵢ = 1',
      strengths: ['Emphasizes better models', 'Customizable weights', 'Performance-based'],
      limitations: ['Requires weight tuning', 'Risk of overfitting', 'Complex optimization']
    },
    {
      id: 'confidence',
      name: 'Confidence-Based',
      description: 'Weight by prediction confidence levels',
      formula: 'Prediction = Σ(cᵢ × Pᵢ) / Σcᵢ',
      strengths: ['Adaptive weighting', 'Uncertainty aware', 'Dynamic adjustment'],
      limitations: ['Confidence calibration needed', 'Complex computation', 'May amplify bias']
    },
    {
      id: 'rank',
      name: 'Rank-Based Voting',
      description: 'Use model rankings instead of raw scores',
      formula: 'Final Rank = Σ(wᵢ × Rankᵢ)',
      strengths: ['Scale invariant', 'Robust to outliers', 'Handles different scales'],
      limitations: ['Loses magnitude info', 'Ties handling needed', 'Less precise']
    },
    {
      id: 'stacking',
      name: 'Stacked Generalization',
      description: 'Meta-learner combines base model outputs',
      formula: 'Meta-Model(P₁, P₂, ..., Pₙ, Features)',
      strengths: ['Learns optimal combination', 'Non-linear mixing', 'Feature integration'],
      limitations: ['Requires training data', 'Overfitting risk', 'Computational complexity']
    },
    {
      id: 'bayesian',
      name: 'Bayesian Model Averaging',
      description: 'Weight models by posterior probability',
      formula: 'Prediction = Σ(P(M|Data) × P(Y|M,Data))',
      strengths: ['Principled uncertainty', 'Model uncertainty', 'Theoretical foundation'],
      limitations: ['Computational intensive', 'Prior specification', 'Approximation needed']
    }
  ];

  // Weighting strategies
  const weightingStrategies: WeightingStrategy[] = [
    {
      id: 'performance',
      name: 'Performance-Based',
      description: 'Weight by historical accuracy metrics',
      method: 'wᵢ = Accuracyᵢ / Σ(Accuracy)',
      advantages: ['Rewards accurate models', 'Simple to compute', 'Intuitive approach'],
      useCases: ['Stable environments', 'Clear performance metrics', 'Historical data available']
    },
    {
      id: 'diversity',
      name: 'Diversity-Based',
      description: 'Weight by model diversity contribution',
      method: 'wᵢ = (1 - Correlationᵢ) × Performanceᵢ',
      advantages: ['Promotes model diversity', 'Reduces correlation', 'Better generalization'],
      useCases: ['Correlated models', 'Overfitting concerns', 'Robust predictions needed']
    },
    {
      id: 'adaptive',
      name: 'Adaptive Weighting',
      description: 'Dynamic weights based on recent performance',
      method: 'wᵢ(t) = α × wᵢ(t-1) + (1-α) × Performanceᵢ(t)',
      advantages: ['Adapts to changes', 'Recent performance focus', 'Non-stationary handling'],
      useCases: ['Changing environments', 'Concept drift', 'Time-varying patterns']
    },
    {
      id: 'uncertainty',
      name: 'Uncertainty-Based',
      description: 'Weight by prediction uncertainty levels',
      method: 'wᵢ = (1 / Uncertaintyᵢ) / Σ(1 / Uncertainty)',
      advantages: ['Uncertainty aware', 'Confidence weighting', 'Risk management'],
      useCases: ['High-stakes decisions', 'Risk assessment', 'Calibrated predictions']
    },
    {
      id: 'meta_learning',
      name: 'Meta-Learning',
      description: 'Learn optimal weights from data',
      method: 'Optimize: min Σ(Actual - Σ(wᵢ × Predictionᵢ))²',
      advantages: ['Data-driven weights', 'Optimal combination', 'Feature integration'],
      useCases: ['Complex relationships', 'Large datasets', 'Non-linear combinations']
    },
    {
      id: 'contextual',
      name: 'Contextual Weighting',
      description: 'Weight based on prediction context',
      method: 'wᵢ = f(Context, Model_Type, Historical_Performance)',
      advantages: ['Context-aware', 'Situation-specific', 'Domain knowledge'],
      useCases: ['Context-dependent performance', 'Domain expertise', 'Specialized models']
    }
  ];

  // Helper functions for scoring
  const getComplexityScore = (methodId: string): string => {
    const scores: Record<string, string> = {
      'simple': '⭐',
      'weighted': '⭐⭐',
      'confidence': '⭐⭐⭐',
      'rank': '⭐⭐',
      'stacking': '⭐⭐⭐⭐',
      'bayesian': '⭐⭐⭐⭐⭐'
    };
    return scores[methodId] || '⭐⭐⭐';
  };

  const getAccuracyScore = (methodId: string): string => {
    const scores: Record<string, string> = {
      'simple': '⭐⭐',
      'weighted': '⭐⭐⭐',
      'confidence': '⭐⭐⭐⭐',
      'rank': '⭐⭐⭐',
      'stacking': '⭐⭐⭐⭐⭐',
      'bayesian': '⭐⭐⭐⭐'
    };
    return scores[methodId] || '⭐⭐⭐';
  };

  const getRobustnessScore = (methodId: string): string => {
    const scores: Record<string, string> = {
      'simple': '⭐⭐⭐',
      'weighted': '⭐⭐⭐⭐',
      'confidence': '⭐⭐⭐',
      'rank': '⭐⭐⭐⭐',
      'stacking': '⭐⭐',
      'bayesian': '⭐⭐⭐⭐⭐'
    };
    return scores[methodId] || '⭐⭐⭐';
  };

  const getInterpretabilityScore = (methodId: string): string => {
    const scores: Record<string, string> = {
      'simple': '⭐⭐⭐⭐⭐',
      'weighted': '⭐⭐⭐⭐',
      'confidence': '⭐⭐⭐',
      'rank': '⭐⭐⭐',
      'stacking': '⭐⭐',
      'bayesian': '⭐'
    };
    return scores[methodId] || '⭐⭐⭐';
  };

  // Calculate ensemble prediction
  const calculateEnsemblePrediction = () => {
    const method = votingMethods.find((m: any) => m.id === selectedVoting);
    const weighting = weightingStrategies.find((w: any) => w.id === selectedWeighting);
    
    let finalPrediction = 0;
    let totalWeight = 0;
    let confidence = 0;
    
    switch (selectedVoting) {
      case 'simple':
        finalPrediction = ensembleModels.reduce((sum, model) => sum + model.prediction, 0) / ensembleModels.length;
        confidence = ensembleModels.reduce((sum, model) => sum + model.confidence, 0) / ensembleModels.length;
        break;
        
      case 'weighted':
        ensembleModels.forEach((model: any) => {
          finalPrediction += model.weight * model.prediction;
          confidence += model.weight * model.confidence;
          totalWeight += model.weight;
        });
        break;
        
      case 'confidence':
        ensembleModels.forEach((model: any) => {
          const weight = model.confidence;
          finalPrediction += weight * model.prediction;
          confidence += weight * model.confidence;
          totalWeight += weight;
        });
        finalPrediction /= totalWeight;
        confidence /= totalWeight;
        break;
        
      default:
        finalPrediction = ensembleModels.reduce((sum, model) => sum + model.weight * model.prediction, 0);
        confidence = ensembleModels.reduce((sum, model) => sum + model.weight * model.confidence, 0);
    }
    
    // Calculate prediction variance for uncertainty
    const variance = ensembleModels.reduce((sum, model) => {
      const diff = model.prediction - finalPrediction;
      return sum + model.weight * diff * diff;
    }, 0);
    
    const uncertainty = Math.sqrt(variance);
    
    setEnsembleResults({
      prediction: finalPrediction,
      confidence: confidence,
      uncertainty: uncertainty,
      method: method?.name,
      weighting: weighting?.name,
      modelContributions: ensembleModels.map((model: any) => ({
        name: model.name,
        contribution: model.weight * model.prediction,
        weight: model.weight
      }))
    });
  };

  // Optimization techniques
  const optimizationTechniques = [
    {
      name: 'Cross-Validation',
      description: 'Validate ensemble performance across data folds',
      implementation: 'K-fold CV with ensemble weight optimization',
      benefits: ['Unbiased performance estimate', 'Overfitting detection', 'Robust validation']
    },
    {
      name: 'Hyperparameter Tuning',
      description: 'Optimize ensemble configuration parameters',
      implementation: 'Grid search, random search, Bayesian optimization',
      benefits: ['Optimal configuration', 'Performance maximization', 'Automated tuning']
    },
    {
      name: 'Dynamic Model Selection',
      description: 'Select subset of models based on performance',
      implementation: 'Performance thresholding, diversity metrics',
      benefits: ['Removes poor models', 'Computational efficiency', 'Quality focus']
    },
    {
      name: 'Online Learning',
      description: 'Update ensemble weights with new data',
      implementation: 'Incremental weight updates, sliding windows',
      benefits: ['Adaptation to changes', 'Real-time updates', 'Concept drift handling']
    }
  ];

  const renderOverview = () => (
    <div className="ensemble-overview">
      <h3>🎯 Ensemble Prediction Methodology</h3>
      <div className="overview-content">
        <div className="overview-section">
          <h4>What is Ensemble Learning?</h4>
          <p>
            Ensemble learning combines multiple machine learning models to create a stronger, more robust predictor than any individual model. 
            Oracle uses sophisticated ensemble methods to aggregate predictions from diverse models, reducing prediction variance and improving accuracy.
          </p>
          
          <div className="ensemble-benefits">
            <h5>🔄 Key Benefits</h5>
            <div className="benefits-grid">
              <div className="benefit-card">
                <span className="benefit-icon">📈</span>
                <h6>Improved Accuracy</h6>
                <p>Combining multiple models typically outperforms individual models by reducing prediction errors</p>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">🛡️</span>
                <h6>Reduced Overfitting</h6>
                <p>Ensemble methods help prevent overfitting by averaging out individual model biases</p>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">💪</span>
                <h6>Increased Robustness</h6>
                <p>Less sensitive to outliers and noise in data, providing more stable predictions</p>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">🎭</span>
                <h6>Model Diversity</h6>
                <p>Leverages different model strengths while compensating for individual weaknesses</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overview-section">
          <h4>Oracle's Ensemble Architecture</h4>
          <div className="architecture-diagram">
            <div className="model-layer">
              <h5>Base Models</h5>
              <div className="model-boxes">
                <div className="model-box">Linear Regression</div>
                <div className="model-box">Random Forest</div>
                <div className="model-box">Gradient Boosting</div>
                <div className="model-box">Neural Network</div>
                <div className="model-box">Bayesian Model</div>
              </div>
            </div>
            <div className="combination-layer">
              <h5>Combination Layer</h5>
              <div className="combination-methods">
                <div className="method-box">Weighted Voting</div>
                <div className="method-box">Confidence Weighting</div>
                <div className="method-box">Stacking</div>
              </div>
            </div>
            <div className="output-layer">
              <h5>Final Prediction</h5>
              <div className="output-box">
                Ensemble Prediction + Confidence Score
              </div>
            </div>
          </div>
        </div>
        
        <div className="overview-section">
          <h4>Mathematical Foundation</h4>
          <div className="math-foundation">
            <div className="formula-card">
              <h6>Basic Ensemble Formula</h6>
              <div className="formula">
                ŷ = Σᵢ₌₁ⁿ wᵢ × ŷᵢ
              </div>
              <p>Where wᵢ is the weight and ŷᵢ is the prediction of model i</p>
            </div>
            <div className="formula-card">
              <h6>Ensemble Variance</h6>
              <div className="formula">
                Var(ŷ) = Σᵢ₌₁ⁿ wᵢ² × Var(ŷᵢ) + 2Σᵢ&lt;j wᵢwⱼCov(ŷᵢ,ŷⱼ)
              </div>
              <p>Ensemble variance depends on individual model variance and correlation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModels = () => (
    <div className="ensemble-models">
      <h3>🤖 Base Models in Oracle's Ensemble</h3>
      <div className="models-grid">
        {ensembleModels.map((model) => (
          <div 
            key={model.id} 
            className={`model-card ${selectedModel === model.id ? 'selected' : ''}`}
            onClick={() => setSelectedModel(selectedModel === model.id ? '' : model.id)}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedModel(selectedModel === model.id ? '' : model.id);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Select ${model.name} model details`}
          >
            <div className="model-header">
              <h4>{model.name}</h4>
              <span className="model-type">{model.type}</span>
            </div>
            <div className="model-metrics">
              <div className="metric">
                <span className="metric-label">Accuracy:</span>
                <span className="metric-value">{model.accuracy}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Weight:</span>
                <span className="metric-value">{(model.weight * 100).toFixed(1)}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Confidence:</span>
                <span className="metric-value">{(model.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="model-prediction">
              <span className="prediction-label">Current Prediction:</span>
              <span className="prediction-value">{model.prediction.toFixed(1)} pts</span>
            </div>
            <p className="model-description">{model.description}</p>
            
            {selectedModel === model.id && (
              <div className="model-details">
                <h5>Model Details</h5>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Strengths:</strong>
                    <ul>
                      {model.type === 'Statistical' && (
                        <>
                          <li>Fast training and inference</li>
                          <li>Interpretable coefficients</li>
                          <li>Good baseline performance</li>
                        </>
                      )}
                      {model.type === 'Tree-based' && (
                        <>
                          <li>Handles non-linear relationships</li>
                          <li>Feature importance ranking</li>
                          <li>Robust to outliers</li>
                        </>
                      )}
                      {model.type === 'Boosting' && (
                        <>
                          <li>High predictive accuracy</li>
                          <li>Handles complex patterns</li>
                          <li>Feature selection capability</li>
                        </>
                      )}
                      {model.type === 'Deep Learning' && (
                        <>
                          <li>Captures complex non-linear patterns</li>
                          <li>Automatic feature learning</li>
                          <li>Scales with data size</li>
                        </>
                      )}
                      {model.type === 'Probabilistic' && (
                        <>
                          <li>Uncertainty quantification</li>
                          <li>Incorporates prior knowledge</li>
                          <li>Handles small datasets well</li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div className="detail-item">
                    <strong>Use Cases:</strong>
                    <ul>
                      {model.type === 'Statistical' && (
                        <>
                          <li>Linear trend identification</li>
                          <li>Baseline comparisons</li>
                          <li>Quick prototyping</li>
                        </>
                      )}
                      {model.type === 'Tree-based' && (
                        <>
                          <li>Feature interaction modeling</li>
                          <li>Mixed data types</li>
                          <li>Interpretable decisions</li>
                        </>
                      )}
                      {model.type === 'Boosting' && (
                        <>
                          <li>Competition-grade accuracy</li>
                          <li>Structured data problems</li>
                          <li>Feature engineering</li>
                        </>
                      )}
                      {model.type === 'Deep Learning' && (
                        <>
                          <li>High-dimensional data</li>
                          <li>Complex pattern recognition</li>
                          <li>Large dataset scenarios</li>
                        </>
                      )}
                      {model.type === 'Probabilistic' && (
                        <>
                          <li>Risk assessment</li>
                          <li>Decision under uncertainty</li>
                          <li>Prior knowledge integration</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="model-performance">
        <h4>📊 Model Performance Comparison</h4>
        <div className="performance-chart">
          <div className="chart-header">
            <span>Model</span>
            <span>Accuracy</span>
            <span>Weight</span>
            <span>Contribution</span>
          </div>
          {ensembleModels.map((model) => (
            <div key={model.id} className="chart-row">
              <span className="model-name">{model.name}</span>
              <div className="accuracy-bar">
                <div 
                  className="accuracy-fill" 
                  style={{ width: `${model.accuracy}%` }}
                ></div>
                <span className="accuracy-text">{model.accuracy}%</span>
              </div>
              <div className="weight-indicator">
                <div 
                  className="weight-fill" 
                  style={{ width: `${model.weight * 100}%` }}
                ></div>
                <span className="weight-text">{(model.weight * 100).toFixed(1)}%</span>
              </div>
              <span className="contribution">{(model.weight * model.prediction).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVoting = () => (
    <div className="voting-methods">
      <h3>🗳️ Voting and Combination Methods</h3>
      <div className="voting-grid">
        {votingMethods.map((method) => (
          <div 
            key={method.id} 
            className={`voting-card ${selectedVoting === method.id ? 'selected' : ''}`}
            onClick={() => setSelectedVoting(method.id)}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedVoting(method.id);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Select ${method.name} voting method`}
          >
            <div className="voting-header">
              <h4>{method.name}</h4>
              {selectedVoting === method.id && <span className="selected-badge">Active</span>}
            </div>
            <p className="voting-description">{method.description}</p>
            <div className="voting-formula">
              <strong>Formula:</strong>
              <code>{method.formula}</code>
            </div>
            <div className="voting-analysis">
              <div className="strengths">
                <h6>✅ Strengths</h6>
                <ul>
                  {method.strengths.map((strength, strengthIndex) => (
                    <li key={`strength-${method.id}-${strengthIndex}`}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div className="limitations">
                <h6>⚠️ Limitations</h6>
                <ul>
                  {method.limitations.map((limitation, limitationIndex) => (
                    <li key={`limitation-${method.id}-${limitationIndex}`}>{limitation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="voting-comparison">
        <h4>📈 Method Comparison</h4>
        <div className="comparison-table">
          <div className="table-header">
            <span>Method</span>
            <span>Complexity</span>
            <span>Accuracy</span>
            <span>Robustness</span>
            <span>Interpretability</span>
          </div>
          {votingMethods.map((method) => (
            <div key={method.id} className="table-row">
              <span className="method-name">{method.name}</span>
              <span className="complexity-score">
                {getComplexityScore(method.id)}
              </span>
              <span className="accuracy-score">
                {getAccuracyScore(method.id)}
              </span>
              <span className="robustness-score">
                {getRobustnessScore(method.id)}
              </span>
              <span className="interpretability-score">
                {getInterpretabilityScore(method.id)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWeighting = () => (
    <div className="weighting-strategies">
      <h3>⚖️ Weighting Strategies</h3>
      <div className="weighting-grid">
        {weightingStrategies.map((strategy) => (
          <div 
            key={strategy.id} 
            className={`weighting-card ${selectedWeighting === strategy.id ? 'selected' : ''}`}
            onClick={() => setSelectedWeighting(strategy.id)}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedWeighting(strategy.id);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Select ${strategy.name} weighting strategy`}
          >
            <div className="weighting-header">
              <h4>{strategy.name}</h4>
              {selectedWeighting === strategy.id && <span className="selected-badge">Active</span>}
            </div>
            <p className="weighting-description">{strategy.description}</p>
            <div className="weighting-method">
              <strong>Method:</strong>
              <code>{strategy.method}</code>
            </div>
            <div className="weighting-details">
              <div className="advantages">
                <h6>🎯 Advantages</h6>
                <ul>
                  {strategy.advantages.map((advantage, advIndex) => (
                    <li key={`advantage-${strategy.id}-${advIndex}`}>{advantage}</li>
                  ))}
                </ul>
              </div>
              <div className="use-cases">
                <h6>🎪 Use Cases</h6>
                <ul>
                  {strategy.useCases.map((useCase, caseIndex) => (
                    <li key={`usecase-${strategy.id}-${caseIndex}`}>{useCase}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="weighting-visualization">
        <h4>📊 Weight Distribution Visualization</h4>
        <div className="weight-chart">
          {ensembleModels.map((model, index) => (
            <div key={model.id} className="weight-bar-container">
              <div className="weight-label">{model.name}</div>
              <div className="weight-bar">
                <div 
                  className="weight-fill" 
                  style={{ 
                    width: `${model.weight * 100}%`,
                    backgroundColor: `hsl(${index * 60}, 70%, 60%)`
                  }}
                ></div>
                <span className="weight-percentage">{(model.weight * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="weight-explanation">
          <h5>Current Weighting: {weightingStrategies.find(s => s.id === selectedWeighting)?.name}</h5>
          <p>{weightingStrategies.find(s => s.id === selectedWeighting)?.description}</p>
          <div className="weight-factors">
            <h6>Key Factors in Weight Assignment:</h6>
            <ul>
              <li><strong>Historical Accuracy:</strong> Models with better past performance receive higher weights</li>
              <li><strong>Model Diversity:</strong> Uncorrelated models get bonus weight to improve ensemble diversity</li>
              <li><strong>Recent Performance:</strong> Recent prediction quality influences current weights</li>
              <li><strong>Uncertainty Levels:</strong> More confident predictions receive proportionally higher weights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOptimization = () => (
    <div className="optimization-techniques">
      <h3>🔧 Ensemble Optimization</h3>
      <div className="optimization-grid">
        {optimizationTechniques.map((technique) => (
          <div key={technique.name.toLowerCase().replace(/\s+/g, '-')} className="optimization-card">
            <h4>{technique.name}</h4>
            <p className="technique-description">{technique.description}</p>
            <div className="implementation">
              <strong>Implementation:</strong>
              <p>{technique.implementation}</p>
            </div>
            <div className="benefits">
              <strong>Benefits:</strong>
              <ul>
                {technique.benefits.map((benefit, benefitIdx) => (
                  <li key={`benefit-${technique.name.toLowerCase().replace(/\s+/g, '-')}-${benefitIdx}`}>{benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      
      <div className="optimization-process">
        <h4>🔄 Oracle's Optimization Process</h4>
        <div className="process-flow">
          <div className="process-step">
            <div className="step-number">1</div>
            <h5>Data Collection</h5>
            <p>Gather training data and historical performance metrics for each base model</p>
          </div>
          <div className="process-arrow">→</div>
          <div className="process-step">
            <div className="step-number">2</div>
            <h5>Weight Initialization</h5>
            <p>Initialize model weights based on historical accuracy or equal distribution</p>
          </div>
          <div className="process-arrow">→</div>
          <div className="process-step">
            <div className="step-number">3</div>
            <h5>Performance Evaluation</h5>
            <p>Evaluate ensemble performance using cross-validation and various metrics</p>
          </div>
          <div className="process-arrow">→</div>
          <div className="process-step">
            <div className="step-number">4</div>
            <h5>Weight Optimization</h5>
            <p>Optimize weights using gradient descent, grid search, or evolutionary algorithms</p>
          </div>
          <div className="process-arrow">→</div>
          <div className="process-step">
            <div className="step-number">5</div>
            <h5>Validation & Deployment</h5>
            <p>Validate optimized ensemble on held-out data and deploy to production</p>
          </div>
        </div>
      </div>
      
      <div className="optimization-metrics">
        <h4>📏 Optimization Metrics</h4>
        <div className="metrics-grid">
          <div className="metric-card">
            <h5>Ensemble Accuracy</h5>
            <div className="metric-value optimization-metric-value">87.3%</div>
            <p>Overall prediction accuracy across all test cases</p>
          </div>
          <div className="metric-card">
            <h5>Diversity Score</h5>
            <div className="metric-value optimization-metric-value">0.68</div>
            <p>Measure of disagreement between base models (higher is better)</p>
          </div>
          <div className="metric-card">
            <h5>Stability Index</h5>
            <div className="metric-value optimization-metric-value">0.92</div>
            <p>Consistency of predictions across different data samples</p>
          </div>
          <div className="metric-card">
            <h5>Computational Efficiency</h5>
            <div className="metric-value optimization-metric-value">145ms</div>
            <p>Average time to generate ensemble prediction</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDemo = () => (
    <div className="ensemble-demo">
      <h3>🧪 Interactive Ensemble Demo</h3>
      <div className="demo-controls">
        <div className="control-group">
          <label htmlFor="voting-method-select">Voting Method:</label>
          <select 
            id="voting-method-select"
            value={selectedVoting} 
            onChange={(e: any) => setSelectedVoting(e.target.value)}
          >
            {votingMethods.map((method: any) => (
              <option key={method.id} value={method.id}>{method.name}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="weighting-strategy-select">Weighting Strategy:</label>
          <select 
            id="weighting-strategy-select"
            value={selectedWeighting} 
            onChange={(e: any) => setSelectedWeighting(e.target.value)}
          >
            {weightingStrategies.map((strategy: any) => (
              <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
            ))}
          </select>
        </div>
        <button 
          className="calculate-button"
          onClick={calculateEnsemblePrediction}
        >
          Calculate Ensemble Prediction
        </button>
      </div>
      
      {ensembleResults && (
        <div className="demo-results">
          <h4>🎯 Ensemble Results</h4>
          <div className="results-summary">
            <div className="result-card main-result">
              <h5>Final Prediction</h5>
              <div className="prediction-value demo-prediction-value">{ensembleResults.prediction.toFixed(2)} points</div>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill" 
                  style={{ width: `${ensembleResults.confidence * 100}%` }}
                ></div>
                <span>Confidence: {(ensembleResults.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="result-card">
              <h5>Uncertainty</h5>
              <div className="uncertainty-value">±{ensembleResults.uncertainty.toFixed(2)}</div>
              <p>Prediction interval</p>
            </div>
            <div className="result-card">
              <h5>Method Used</h5>
              <div className="method-name">{ensembleResults.method}</div>
              <div className="weighting-name">{ensembleResults.weighting}</div>
            </div>
          </div>
          
          <div className="model-contributions">
            <h5>🤝 Model Contributions</h5>
            <div className="contributions-chart">
              {ensembleResults.modelContributions.map((contrib: any) => (
                <div key={`contribution-${contrib.name.toLowerCase().replace(/\s+/g, '-')}`} className="contribution-bar">
                  <span className="model-name">{contrib.name}</span>
                  <div className="contribution-visual">
                    <div 
                      className="contribution-fill" 
                      style={{ 
                        width: `${(contrib.contribution / ensembleResults.prediction) * 100}%`,
                        backgroundColor: `hsl(${ensembleResults.modelContributions.indexOf(contrib) * 60}, 70%, 60%)`
                      }}
                    ></div>
                    <span className="contribution-text">
                      {contrib.contribution.toFixed(2)} ({(contrib.weight * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="ensemble-explanation">
            <h5>📝 Explanation</h5>
            <p>
              The ensemble prediction of <strong>{ensembleResults.prediction.toFixed(2)} points</strong> was calculated using {ensembleResults.method.toLowerCase()} with {ensembleResults.weighting.toLowerCase()}. 
              The highest contributing model was <strong>{ensembleResults.modelContributions[0].name}</strong> with a contribution of {ensembleResults.modelContributions[0].contribution.toFixed(2)} points.
              The prediction uncertainty of ±{ensembleResults.uncertainty.toFixed(2)} indicates the expected variation in the prediction.
            </p>
          </div>
        </div>
      )}
      
      <div className="demo-insights">
        <h4>💡 Key Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <h5>Model Diversity</h5>
            <p>
              Different models capture different aspects of the data. Linear regression identifies trends, 
              while neural networks capture complex non-linear patterns. Combining them provides comprehensive coverage.
            </p>
          </div>
          <div className="insight-card">
            <h5>Weight Optimization</h5>
            <p>
              Optimal weights balance model accuracy with diversity. Giving too much weight to the best model 
              can hurt ensemble performance if that model overfits or has systematic biases.
            </p>
          </div>
          <div className="insight-card">
            <h5>Uncertainty Quantification</h5>
            <p>
              Ensemble predictions provide natural uncertainty estimates. High agreement between models indicates 
              confidence, while disagreement suggests higher uncertainty in the prediction.
            </p>
          </div>
          <div className="insight-card">
            <h5>Real-time Adaptation</h5>
            <p>
              Oracle continuously updates model weights based on recent performance, allowing the ensemble 
              to adapt to changing patterns in fantasy football data and maintain prediction accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="oracle-ensemble-section">
      <div className="section-header">
        <h2>🎯 Ensemble Prediction Methodology</h2>
        <p>Understanding how Oracle combines multiple models for superior predictions</p>
      </div>
      
      <div className="section-navigation">
        <button 
          className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-button ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          🤖 Base Models
        </button>
        <button 
          className={`nav-button ${activeTab === 'voting' ? 'active' : ''}`}
          onClick={() => setActiveTab('voting')}
        >
          🗳️ Voting Methods
        </button>
        <button 
          className={`nav-button ${activeTab === 'weighting' ? 'active' : ''}`}
          onClick={() => setActiveTab('weighting')}
        >
          ⚖️ Weighting
        </button>
        <button 
          className={`nav-button ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          🔧 Optimization
        </button>
        <button 
          className={`nav-button ${activeTab === 'demo' ? 'active' : ''}`}
          onClick={() => setActiveTab('demo')}
        >
          🧪 Demo
        </button>
      </div>
      
      <div className="section-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'models' && renderModels()}
        {activeTab === 'voting' && renderVoting()}
        {activeTab === 'weighting' && renderWeighting()}
        {activeTab === 'optimization' && renderOptimization()}
        {activeTab === 'demo' && renderDemo()}
      </div>
    </div>
  );
};

export default OracleEnsemblePredictionSection;
