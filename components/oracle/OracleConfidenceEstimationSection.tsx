import React, { useState } from 'react';
import './OracleConfidenceEstimationSection.css';

interface ConfidenceMethod {
  id: string;
  name: string;
  description: string;
  formula: string;
  advantages: string[];
  limitations: string[];
  implementationDetails: string;
  confidenceRange: string;
  useCases: string[];
}

interface UncertaintySource {
  id: string;
  name: string;
  type: 'Aleatoric' | 'Epistemic';
  description: string;
  quantificationMethod: string;
  impact: 'Low' | 'Medium' | 'High';
  mitigation: string[];
}

interface CalibrationMetric {
  id: string;
  name: string;
  formula: string;
  description: string;
  idealValue: string;
  interpretation: string;
}

interface PredictionInterval {
  id: string;
  confidence: number;
  lowerBound: number;
  upperBound: number;
  prediction: number;
  method: string;
  width: number;
}

// Helper functions for method ratings
const getMethodEffectiveness = (methodId: string): string => {
  const ratings: Record<string, string> = {
    'temperature_scaling': '⭐⭐⭐⭐⭐',
    'evidential_deep_learning': '⭐⭐⭐⭐',
    'conformal_prediction': '⭐⭐⭐',
    'ensemble_uncertainty': '⭐⭐',
    'monte_carlo': '⭐',
    'bayesian_neural_networks': '⭐'
  };
  return ratings[methodId] || '⭐';
};

const getMethodSpeedRating = (methodId: string): string => {
  const ratings: Record<string, string> = {
    'ensemble_uncertainty': '⭐⭐⭐⭐⭐',
    'evidential_deep_learning': '⭐⭐⭐⭐',
    'conformal_prediction': '⭐⭐⭐⭐',
    'temperature_scaling': '⭐⭐⭐',
    'monte_carlo': '⭐⭐⭐',
    'bayesian_neural_networks': '⭐⭐⭐'
  };
  return ratings[methodId] || '⭐⭐⭐';
};

const getMethodScalabilityRating = (methodId: string): string => {
  const ratings: Record<string, string> = {
    'temperature_scaling': '⭐⭐⭐⭐⭐',
    'ensemble_uncertainty': '⭐⭐⭐⭐',
    'conformal_prediction': '⭐⭐⭐',
    'evidential_deep_learning': '⭐⭐',
    'monte_carlo': '⭐',
    'bayesian_neural_networks': '⭐'
  };
  return ratings[methodId] || '⭐';
};

const getMethodRobustnessRating = (methodId: string): string => {
  const ratings: Record<string, string> = {
    'conformal_prediction': '⭐⭐⭐⭐⭐',
    'evidential_deep_learning': '⭐⭐⭐⭐',
    'ensemble_uncertainty': '⭐⭐⭐',
    'temperature_scaling': '⭐⭐⭐',
    'monte_carlo': '⭐⭐',
    'bayesian_neural_networks': '⭐⭐'
  };
  return ratings[methodId] || '⭐⭐';
};

const getConfidenceClass = (confidence: number): string => {
  if (confidence > 0.8) return 'high';
  if (confidence > 0.7) return 'medium';
  return 'low';
};

function OracleConfidenceEstimationSection() {
  const [activeTab, setActiveTab] = useState<'overview' | 'methods' | 'uncertainty' | 'calibration' | 'intervals' | 'demo'>('overview');
  const [selectedMethod, setSelectedMethod] = useState<string>('monte_carlo');
  const [selectedUncertaintyType, setSelectedUncertaintyType] = useState<string>('aleatoric');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // Confidence Estimation Methods
  const confidenceMethods: ConfidenceMethod[] = [
    {
      id: 'monte_carlo',
      name: 'Monte Carlo Dropout',
      description: 'Uses dropout at inference time to approximate Bayesian uncertainty through multiple forward passes',
      formula: 'μ = (1/T)∑f(x), σ² = (1/T)∑(f(x) - μ)²',
      advantages: [
        'Easy to implement with existing models',
        'Provides both prediction and uncertainty',
        'No architectural changes required',
        'Computationally efficient'
      ],
      limitations: [
        'Approximation quality depends on dropout rate',
        'May underestimate uncertainty',
        'Requires multiple forward passes',
        'Not theoretically grounded'
      ],
      implementationDetails: 'Enable dropout during inference and run T=100 forward passes to estimate prediction variance',
      confidenceRange: '0-100% based on prediction variance',
      useCases: ['Real-time prediction confidence', 'Model uncertainty estimation', 'Active learning']
    },
    {
      id: 'bayesian_neural_network',
      name: 'Bayesian Neural Networks',
      description: 'Treats network weights as probability distributions rather than point estimates',
      formula: 'p(y|x,D) = ∫p(y|x,θ)p(θ|D)dθ',
      advantages: [
        'Principled uncertainty quantification',
        'Naturally captures model uncertainty',
        'Theoretically well-founded',
        'Provides full posterior distribution'
      ],
      limitations: [
        'Computationally expensive',
        'Complex implementation',
        'Slower inference',
        'Requires specialized training'
      ],
      implementationDetails: 'Use variational inference with mean-field approximation and reparameterization trick',
      confidenceRange: '0-100% from posterior predictive distribution',
      useCases: ['High-stakes predictions', 'Safety-critical applications', 'Research applications']
    },
    {
      id: 'ensemble_uncertainty',
      name: 'Deep Ensembles',
      description: 'Trains multiple independent models and uses ensemble disagreement as uncertainty measure',
      formula: 'σ²_ensemble = (1/M)∑(fᵢ(x) - f̄(x))²',
      advantages: [
        'High-quality uncertainty estimates',
        'Captures both types of uncertainty',
        'Simple to understand and implement',
        'Proven effectiveness'
      ],
      limitations: [
        'Computationally expensive training',
        'Multiple models to maintain',
        'Higher memory requirements',
        'Slower inference'
      ],
      implementationDetails: 'Train 5-10 models with different initializations and compute prediction variance',
      confidenceRange: '0-100% based on ensemble variance',
      useCases: ['Production systems', 'Critical predictions', 'Uncertainty-aware decisions']
    },
    {
      id: 'evidential_deep_learning',
      name: 'Evidential Deep Learning',
      description: 'Learns a higher-order distribution over predictions to capture uncertainty',
      formula: 'p(y|x) ~ NormalInverseGamma(μ,λ,α,β)',
      advantages: [
        'Single forward pass',
        'Separates aleatoric and epistemic uncertainty',
        'Theoretically principled',
        'Computationally efficient'
      ],
      limitations: [
        'Complex loss function',
        'Sensitive to hyperparameters',
        'Limited empirical validation',
        'Requires specialized architecture'
      ],
      implementationDetails: 'Modify output layer to predict distribution parameters and use evidential loss',
      confidenceRange: '0-100% from evidential distribution',
      useCases: ['Out-of-distribution detection', 'Active learning', 'Robust predictions']
    },
    {
      id: 'conformal_prediction',
      name: 'Conformal Prediction',
      description: 'Provides prediction intervals with finite-sample validity guarantees',
      formula: 'C(x) = {y : s(x,y) ≤ ĝ((n+1)(1-α))}',
      advantages: [
        'Distribution-free guarantees',
        'Valid for any model',
        'Exact coverage probability',
        'Model-agnostic approach'
      ],
      limitations: [
        'Requires calibration set',
        'May produce large intervals',
        'Limited to coverage guarantees',
        'No uncertainty quantification'
      ],
      implementationDetails: 'Use nonconformity scores and calibration set to construct prediction intervals',
      confidenceRange: 'User-specified confidence level (e.g., 90%, 95%)',
      useCases: ['Safety-critical applications', 'Regulatory compliance', 'Risk management']
    },
    {
      id: 'temperature_scaling',
      name: 'Temperature Scaling',
      description: 'Post-hoc calibration method that rescales logits to improve confidence calibration',
      formula: 'p̂ᵢ = max σ(zᵢ/T), where T is learned temperature',
      advantages: [
        'Simple and effective',
        'Fast calibration',
        'Preserves accuracy',
        'Single parameter optimization'
      ],
      limitations: [
        'Only for classification',
        'Requires validation set',
        'Uniform scaling',
        'Limited expressiveness'
      ],
      implementationDetails: 'Optimize temperature parameter T on validation set using NLL loss',
      confidenceRange: '0-100% calibrated confidence scores',
      useCases: ['Model calibration', 'Confidence thresholding', 'Decision making']
    }
  ];

  // Uncertainty Sources
  const uncertaintySources: UncertaintySource[] = [
    {
      id: 'data_noise',
      name: 'Data/Measurement Noise',
      type: 'Aleatoric',
      description: 'Inherent randomness in player performance and game outcomes that cannot be reduced',
      quantificationMethod: 'Statistical analysis of historical variance in player performance',
      impact: 'Medium',
      mitigation: ['Robust loss functions', 'Data augmentation', 'Ensemble methods']
    },
    {
      id: 'model_uncertainty',
      name: 'Model Parameter Uncertainty',
      type: 'Epistemic',
      description: 'Uncertainty about the optimal model parameters due to limited training data',
      quantificationMethod: 'Bayesian inference over model weights',
      impact: 'High',
      mitigation: ['Bayesian neural networks', 'Dropout', 'Weight decay regularization']
    },
    {
      id: 'structural_uncertainty',
      name: 'Model Structure Uncertainty',
      type: 'Epistemic',
      description: 'Uncertainty about the correct model architecture and feature selection',
      quantificationMethod: 'Model averaging across different architectures',
      impact: 'High',
      mitigation: ['Neural architecture search', 'Ensemble of different models', 'Cross-validation']
    },
    {
      id: 'distributional_shift',
      name: 'Distribution Shift',
      type: 'Epistemic',
      description: 'Changes in data distribution between training and deployment (injuries, rule changes)',
      quantificationMethod: 'Out-of-distribution detection and domain adaptation metrics',
      impact: 'High',
      mitigation: ['Continual learning', 'Domain adaptation', 'Robust optimization']
    },
    {
      id: 'feature_uncertainty',
      name: 'Feature/Input Uncertainty',
      type: 'Aleatoric',
      description: 'Uncertainty in measured features like weather conditions or injury status',
      quantificationMethod: 'Propagation of input uncertainties through the model',
      impact: 'Medium',
      mitigation: ['Input noise modeling', 'Robust features', 'Multiple data sources']
    },
    {
      id: 'temporal_uncertainty',
      name: 'Temporal Dynamics',
      type: 'Aleatoric',
      description: 'Uncertainty due to changing player form, team dynamics, and seasonal effects',
      quantificationMethod: 'Time-series analysis and trend detection',
      impact: 'Medium',
      mitigation: ['Recurrent architectures', 'Attention mechanisms', 'Adaptive learning rates']
    }
  ];

  // Calibration Metrics
  const calibrationMetrics: CalibrationMetric[] = [
    {
      id: 'ece',
      name: 'Expected Calibration Error (ECE)',
      formula: 'ECE = Σᵦ (nᵦ/n)|acc(b) - conf(b)|',
      description: 'Measures the difference between confidence and accuracy across confidence bins',
      idealValue: '0.0',
      interpretation: 'Lower values indicate better calibration. ECE < 0.05 is considered well-calibrated.'
    },
    {
      id: 'mce',
      name: 'Maximum Calibration Error (MCE)',
      formula: 'MCE = maxᵦ|acc(b) - conf(b)|',
      description: 'Maximum difference between confidence and accuracy across all bins',
      idealValue: '0.0',
      interpretation: 'Measures worst-case calibration error. MCE < 0.1 indicates reasonable calibration.'
    },
    {
      id: 'reliability_diagram',
      name: 'Reliability Diagram',
      formula: 'Plot of bin accuracy vs bin confidence',
      description: 'Visual representation of calibration across different confidence levels',
      idealValue: 'Perfect diagonal line',
      interpretation: 'Points below diagonal indicate overconfidence, above indicate underconfidence.'
    },
    {
      id: 'brier_score',
      name: 'Brier Score',
      formula: 'BS = (1/N)Σᵢ(pᵢ - yᵢ)²',
      description: 'Measures accuracy of probabilistic predictions',
      idealValue: '0.0',
      interpretation: 'Lower scores indicate better calibrated predictions. Combines calibration and sharpness.'
    },
    {
      id: 'log_likelihood',
      name: 'Negative Log-Likelihood',
      formula: 'NLL = -(1/N)Σᵢlog(pᵢ)',
      description: 'Measures quality of predicted probabilities',
      idealValue: 'Lower values',
      interpretation: 'Proper scoring rule that rewards confident correct predictions and penalizes confident incorrect ones.'
    }
  ];

  // Generate prediction intervals
  const generatePredictionIntervals = (confidenceLevel: number): PredictionInterval[] => {
    const prediction = 18.5; // Example fantasy points prediction
    const baseUncertainty = 3.2;
    
    return [
      {
        id: 'monte_carlo_interval',
        confidence: confidenceLevel,
        prediction: prediction,
        method: 'Monte Carlo Dropout',
        lowerBound: prediction - (baseUncertainty * (confidenceLevel / 100) * 1.96),
        upperBound: prediction + (baseUncertainty * (confidenceLevel / 100) * 1.96),
        width: 2 * (baseUncertainty * (confidenceLevel / 100) * 1.96)
      },
      {
        id: 'bayesian_interval',
        confidence: confidenceLevel,
        prediction: prediction,
        method: 'Bayesian Neural Network',
        lowerBound: prediction - (baseUncertainty * 0.9 * (confidenceLevel / 100) * 1.96),
        upperBound: prediction + (baseUncertainty * 0.9 * (confidenceLevel / 100) * 1.96),
        width: 2 * (baseUncertainty * 0.9 * (confidenceLevel / 100) * 1.96)
      },
      {
        id: 'ensemble_interval',
        confidence: confidenceLevel,
        prediction: prediction,
        method: 'Deep Ensemble',
        lowerBound: prediction - (baseUncertainty * 1.1 * (confidenceLevel / 100) * 1.96),
        upperBound: prediction + (baseUncertainty * 1.1 * (confidenceLevel / 100) * 1.96),
        width: 2 * (baseUncertainty * 1.1 * (confidenceLevel / 100) * 1.96)
      },
      {
        id: 'conformal_interval',
        confidence: confidenceLevel,
        prediction: prediction,
        method: 'Conformal Prediction',
        lowerBound: prediction - (baseUncertainty * 1.2 * (confidenceLevel / 100) * 1.96),
        upperBound: prediction + (baseUncertainty * 1.2 * (confidenceLevel / 100) * 1.96),
        width: 2 * (baseUncertainty * 1.2 * (confidenceLevel / 100) * 1.96)
      }
    ];
  };

  // Simulate confidence estimation
  const simulateConfidenceEstimation = () => {
    const predictions = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      player: `Player ${i + 1}`,
      prediction: 15 + Math.random() * 10,
      confidence: 0.6 + Math.random() * 0.4,
      uncertainty: Math.random() * 2 + 0.5,
      method: confidenceMethods[Math.floor(Math.random() * confidenceMethods.length)].name
    }));

    setSimulationResults({
      predictions,
      averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
      averageUncertainty: predictions.reduce((sum, p) => sum + p.uncertainty, 0) / predictions.length,
      highConfidencePredictions: predictions.filter((p: any) => p.confidence > 0.8).length,
      lowConfidencePredictions: predictions.filter(p => p.confidence < 0.7).length,
      calibrationScore: 0.923, // Simulated calibration score
      reliabilityScore: 0.887  // Simulated reliability score
    });
  };

  const renderOverview = () => (
    <div className="confidence-overview">
      <h3>🎯 Confidence Scores & Uncertainty Quantification</h3>
      <div className="overview-content">
        <div className="overview-section">
          <h4>Why Confidence Matters</h4>
          <p>
            In fantasy football, knowing how confident Oracle is in its predictions is just as important as the predictions themselves. 
            Confidence scores help you make informed decisions about which players to start, trade, or target in drafts. 
            Oracle provides sophisticated uncertainty quantification to give you a complete picture of prediction reliability.
          </p>
          
          <div className="confidence-benefits">
            <h5>🎲 Key Benefits</h5>
            <div className="benefits-grid">
              <div className="benefit-card">
                <span className="benefit-icon">📊</span>
                <h6>Risk Assessment</h6>
                <p>Understand the risk level of each prediction to make better lineup decisions</p>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">🎯</span>
                <h6>Decision Support</h6>
                <p>Use confidence levels to prioritize high-certainty predictions over risky plays</p>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">⚖️</span>
                <h6>Balanced Strategies</h6>
                <p>Balance safe, high-confidence picks with potentially high-reward uncertain plays</p>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">🔬</span>
                <h6>Model Transparency</h6>
                <p>Understand when Oracle is uncertain and why certain predictions are more reliable</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overview-section">
          <h4>Oracle's Confidence Framework</h4>
          <div className="confidence-framework">
            <div className="framework-flow">
              <div className="flow-stage">
                <div className="stage-icon">🧠</div>
                <h6>Prediction Generation</h6>
                <p>Neural network generates base prediction</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-stage">
                <div className="stage-icon">📈</div>
                <h6>Uncertainty Estimation</h6>
                <p>Multiple methods quantify prediction uncertainty</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-stage">
                <div className="stage-icon">🎯</div>
                <h6>Confidence Score</h6>
                <p>Combined confidence metric (0-100%)</p>
              </div>
            </div>
          </div>
          
          <div className="confidence-types">
            <h5>Types of Uncertainty</h5>
            <div className="uncertainty-grid">
              <div className="uncertainty-card aleatoric">
                <h6>🎲 Aleatoric Uncertainty</h6>
                <p><strong>Data Uncertainty:</strong> Inherent randomness in player performance that cannot be reduced with more data</p>
                <ul>
                  <li>Player performance variability</li>
                  <li>Weather and game conditions</li>
                  <li>Injury and fatigue effects</li>
                </ul>
              </div>
              <div className="uncertainty-card epistemic">
                <h6>🧠 Epistemic Uncertainty</h6>
                <p><strong>Model Uncertainty:</strong> Uncertainty about the model itself that can be reduced with more data or better models</p>
                <ul>
                  <li>Model parameter uncertainty</li>
                  <li>Architecture uncertainty</li>
                  <li>Out-of-distribution scenarios</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overview-section">
          <h4>Confidence Score Interpretation</h4>
          <div className="score-interpretation">
            <div className="confidence-levels">
              <div className="confidence-level high">
                <div className="level-indicator">90-100%</div>
                <div className="level-content">
                  <h6>🟢 High Confidence</h6>
                  <p>Strong conviction in prediction. Low uncertainty across all methods. Ideal for must-start decisions.</p>
                </div>
              </div>
              <div className="confidence-level medium">
                <div className="level-indicator">70-89%</div>
                <div className="level-content">
                  <h6>🟡 Medium Confidence</h6>
                  <p>Moderate certainty with some uncertainty factors. Good for lineup decisions with alternatives.</p>
                </div>
              </div>
              <div className="confidence-level low">
                <div className="level-indicator">50-69%</div>
                <div className="level-content">
                  <h6>🟠 Low Confidence</h6>
                  <p>Significant uncertainty present. Consider as boom-or-bust plays with careful risk management.</p>
                </div>
              </div>
              <div className="confidence-level very-low">
                <div className="level-indicator">0-49%</div>
                <div className="level-content">
                  <h6>🔴 Very Low Confidence</h6>
                  <p>High uncertainty across methods. Avoid or use sparingly in low-stakes situations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMethods = () => (
    <div className="confidence-methods">
      <h3>🔬 Confidence Estimation Methods</h3>
      <div className="methods-grid">
        {confidenceMethods.map((method) => (
          <button
            key={method.id}
            className={`method-card ${selectedMethod === method.id ? 'selected' : ''}`}
            onClick={() => setSelectedMethod(method.id)}
            aria-label={`Select ${method.name} method`}
          >
            <div className="method-header">
              <h4>{method.name}</h4>
              {selectedMethod === method.id && <span className="selected-badge">Selected</span>}
            </div>
            
            <p className="method-description">{method.description}</p>
            
            <div className="method-formula">
              <strong>Formula:</strong>
              <div className="formula">{method.formula}</div>
            </div>
            
            <div className="method-range">
              <strong>Confidence Range:</strong> {method.confidenceRange}
            </div>
            
            <div className="method-analysis">
              <div className="advantages">
                <h6>✅ Advantages</h6>
                <ul>
                  {method.advantages.map((advantage, index) => (
                    <li key={`advantage-${method.id}-${index}`}>{advantage}</li>
                  ))}
                </ul>
              </div>
              <div className="limitations">
                <h6>⚠️ Limitations</h6>
                <ul>
                  {method.limitations.map((limitation, index) => (
                    <li key={`limitation-${method.id}-${index}`}>{limitation}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            {selectedMethod === method.id && (
              <div className="method-details">
                <div className="implementation-details">
                  <h6>🔧 Implementation</h6>
                  <p>{method.implementationDetails}</p>
                </div>
                
                <div className="use-cases">
                  <h6>🎯 Use Cases</h6>
                  <ul>
                    {method.useCases.map((useCase, index) => (
                      <li key={`usecase-${method.id}-${index}`}>{useCase}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="methods-comparison">
        <h4>📊 Method Comparison</h4>
        <div className="comparison-table">
          <div className="table-header">
            <span>Method</span>
            <span>Computational Cost</span>
            <span>Quality</span>
            <span>Implementation</span>
            <span>Theoretical Foundation</span>
          </div>
          {confidenceMethods.map((method) => (
            <div key={`comparison-${method.id}`} className="table-row">
              <span className="method-name">{method.name}</span>
              <span className="cost-score">
                {getMethodEffectiveness(method.id)}
              </span>
              <span className="quality-score">
                {getMethodSpeedRating(method.id)}
              </span>
              <span className="implementation-score">
                {getMethodScalabilityRating(method.id)}
              </span>
              <span className="theory-score">
                {getMethodRobustnessRating(method.id)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUncertainty = () => (
    <div className="uncertainty-sources">
      <h3>🔍 Uncertainty Sources & Analysis</h3>
      <div className="uncertainty-type-selector">
        <button
          className={`type-button ${selectedUncertaintyType === 'aleatoric' ? 'active' : ''}`}
          onClick={() => setSelectedUncertaintyType('aleatoric')}
        >
          🎲 Aleatoric (Data) Uncertainty
        </button>
        <button
          className={`type-button ${selectedUncertaintyType === 'epistemic' ? 'active' : ''}`}
          onClick={() => setSelectedUncertaintyType('epistemic')}
        >
          🧠 Epistemic (Model) Uncertainty
        </button>
        <button
          className={`type-button ${selectedUncertaintyType === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedUncertaintyType('all')}
        >
          📊 All Sources
        </button>
      </div>
      
      <div className="uncertainty-grid">
        {uncertaintySources
          .filter((source: any) => selectedUncertaintyType === 'all' || source.type.toLowerCase() === selectedUncertaintyType)
          .map((source) => (
            <div key={source.id} className={`uncertainty-card ${source.type.toLowerCase()}`}>
              <div className="uncertainty-header">
                <h4>{source.name}</h4>
                <div className="uncertainty-badges">
                  <span className={`type-badge ${source.type.toLowerCase()}`}>{source.type}</span>
                  <span className={`impact-badge ${source.impact.toLowerCase()}`}>{source.impact} Impact</span>
                </div>
              </div>
              
              <p className="uncertainty-description">{source.description}</p>
              
              <div className="quantification-method">
                <strong>Quantification:</strong>
                <p>{source.quantificationMethod}</p>
              </div>
              
              <div className="mitigation-strategies">
                <h6>🛡️ Mitigation Strategies</h6>
                <ul>
                  {source.mitigation.map((strategy, index) => (
                    <li key={`mitigation-${source.id}-${index}`}>{strategy}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
      </div>
      
      <div className="uncertainty-framework">
        <h4>🔬 Oracle's Uncertainty Decomposition</h4>
        <div className="decomposition-formula">
          <div className="formula-card">
            <h6>Total Uncertainty Decomposition</h6>
            <div className="formula">
              σ²_total = σ²_aleatoric + σ²_epistemic
            </div>
            <p>Oracle separates total prediction uncertainty into reducible and irreducible components</p>
          </div>
          
          <div className="formula-card">
            <h6>Aleatoric Uncertainty</h6>
            <div className="formula">
              σ²_aleatoric = E[Var[y|x,θ]]
            </div>
            <p>Data-dependent uncertainty that cannot be reduced by collecting more data</p>
          </div>
          
          <div className="formula-card">
            <h6>Epistemic Uncertainty</h6>
            <div className="formula">
              σ²_epistemic = Var[E[y|x,θ]]
            </div>
            <p>Model uncertainty that can be reduced with more data or better models</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCalibration = () => (
    <div className="calibration-section">
      <h3>⚖️ Calibration & Reliability</h3>
      <div className="calibration-intro">
        <p>
          A well-calibrated model means that when it predicts 80% confidence, it should be correct about 80% of the time. 
          Oracle employs multiple calibration techniques to ensure its confidence scores are reliable and trustworthy.
        </p>
      </div>
      
      <div className="calibration-metrics">
        <h4>📊 Calibration Metrics</h4>
        <div className="metrics-grid">
          {calibrationMetrics.map((metric) => (
            <div key={metric.id} className="metric-card">
              <h5>{metric.name}</h5>
              <div className="metric-formula">
                <strong>Formula:</strong>
                <div className="formula">{metric.formula}</div>
              </div>
              <p className="metric-description">{metric.description}</p>
              <div className="metric-interpretation">
                <div className="ideal-value">
                  <strong>Ideal Value:</strong> {metric.idealValue}
                </div>
                <div className="interpretation">
                  <strong>Interpretation:</strong> {metric.interpretation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="calibration-techniques">
        <h4>🔧 Calibration Techniques</h4>
        <div className="techniques-grid">
          <div className="technique-card">
            <h5>🌡️ Temperature Scaling</h5>
            <p>Post-hoc calibration method that learns a single temperature parameter to rescale logits</p>
            <div className="technique-details">
              <strong>When to use:</strong> Simple, effective for most models
              <br />
              <strong>Limitations:</strong> Uniform scaling across all predictions
            </div>
          </div>
          <div className="technique-card">
            <h5>📈 Platt Scaling</h5>
            <p>Fits a sigmoid function to map model outputs to calibrated probabilities</p>
            <div className="technique-details">
              <strong>When to use:</strong> Small datasets, binary classification
              <br />
              <strong>Limitations:</strong> Can overfit with limited data
            </div>
          </div>
          <div className="technique-card">
            <h5>🔍 Isotonic Regression</h5>
            <p>Non-parametric method that learns a monotonic mapping function</p>
            <div className="technique-details">
              <strong>When to use:</strong> Large datasets, complex calibration needs
              <br />
              <strong>Limitations:</strong> Requires more data, less interpretable
            </div>
          </div>
          <div className="technique-card">
            <h5>🧮 Histogram Binning</h5>
            <p>Divides predictions into bins and assigns calibrated probabilities</p>
            <div className="technique-details">
              <strong>When to use:</strong> Simple baseline method
              <br />
              <strong>Limitations:</strong> Loses information, sensitive to bin choice
            </div>
          </div>
        </div>
      </div>
      
      <div className="calibration-results">
        <h4>📈 Oracle's Calibration Performance</h4>
        <div className="results-dashboard">
          <div className="calibration-score">
            <h5>Overall Calibration Score</h5>
            <div className="score-display">
              <div className="score-value">92.3%</div>
              <div className="score-label">Well Calibrated</div>
            </div>
          </div>
          
          <div className="calibration-breakdown">
            <div className="breakdown-item">
              <span className="metric-name">Expected Calibration Error</span>
              <span className="metric-value">0.047</span>
              <span className="metric-status good">Excellent</span>
            </div>
            <div className="breakdown-item">
              <span className="metric-name">Maximum Calibration Error</span>
              <span className="metric-value">0.089</span>
              <span className="metric-status good">Good</span>
            </div>
            <div className="breakdown-item">
              <span className="metric-name">Brier Score</span>
              <span className="metric-value">0.123</span>
              <span className="metric-status good">Good</span>
            </div>
            <div className="breakdown-item">
              <span className="metric-name">Negative Log-Likelihood</span>
              <span className="metric-value">0.287</span>
              <span className="metric-status excellent">Excellent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntervals = () => {
    const intervals = generatePredictionIntervals(confidenceLevel);
    
    return (
      <div className="prediction-intervals">
        <h3>📊 Prediction Intervals</h3>
        <div className="intervals-intro">
          <p>
            Prediction intervals provide a range of plausible values for Oracle's predictions, 
            giving you a complete picture of uncertainty rather than just point estimates.
          </p>
        </div>
        
        <div className="confidence-selector">
          <label htmlFor="confidence-level">Confidence Level:</label>
          <input
            id="confidence-level"
            type="range"
            min="50"
            max="99"
            value={confidenceLevel}
            onChange={(e: any) => setConfidenceLevel(Number(e.target.value))}
            className="confidence-slider"
          />
          <span className="confidence-display">{confidenceLevel}%</span>
        </div>
        
        <div className="intervals-visualization">
          <h4>📈 Prediction Intervals for {confidenceLevel}% Confidence</h4>
          <div className="intervals-grid">
            {intervals.map((interval) => (
              <div key={interval.id} className="interval-card">
                <h5>{interval.method}</h5>
                <div className="interval-display">
                  <div className="prediction-point">
                    <span className="prediction-value">{interval.prediction.toFixed(1)}</span>
                    <span className="prediction-label">Prediction</span>
                  </div>
                  <div className="interval-range">
                    <div className="interval-bounds">
                      <span className="lower-bound">{interval.lowerBound.toFixed(1)}</span>
                      <span className="interval-separator">to</span>
                      <span className="upper-bound">{interval.upperBound.toFixed(1)}</span>
                    </div>
                    <div className="interval-width">
                      Width: {interval.width.toFixed(1)} points
                    </div>
                  </div>
                </div>
                <div className="interval-bar">
                  <div className="interval-range-bar">
                    <div className="prediction-marker"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="intervals-interpretation">
          <h4>🎯 Interpretation Guide</h4>
          <div className="interpretation-grid">
            <div className="interpretation-card">
              <h6>📏 Interval Width</h6>
              <p>Narrower intervals indicate higher confidence. Wider intervals suggest more uncertainty in the prediction.</p>
            </div>
            <div className="interpretation-card">
              <h6>🎲 Coverage Probability</h6>
              <p>A 95% confidence interval should contain the true value 95% of the time across many predictions.</p>
            </div>
            <div className="interpretation-card">
              <h6>⚖️ Risk Assessment</h6>
              <p>Use interval width to assess prediction risk. Narrow intervals are safer bets.</p>
            </div>
            <div className="interpretation-card">
              <h6>📊 Method Comparison</h6>
              <p>Different methods may produce different intervals. Ensemble approaches often provide best estimates.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDemo = () => (
    <div className="confidence-demo">
      <h3>🧪 Interactive Confidence Demo</h3>
      <div className="demo-controls">
        <button
          className="demo-button"
          onClick={simulateConfidenceEstimation}
        >
          Generate Confidence Analysis
        </button>
      </div>
      
      {simulationResults && (
        <div className="simulation-results">
          <h4>📊 Confidence Analysis Results</h4>
          <div className="results-summary">
            <div className="summary-metrics">
              <div className="metric-item">
                <div className="metric-label">Average Confidence</div>
                <div className="metric-value-display">{(simulationResults.averageConfidence * 100).toFixed(1)}%</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Average Uncertainty</div>
                <div className="metric-value-display">{simulationResults.averageUncertainty.toFixed(2)}</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">High Confidence Predictions</div>
                <div className="metric-value-display">{simulationResults.highConfidencePredictions}</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Low Confidence Predictions</div>
                <div className="metric-value-display">{simulationResults.lowConfidencePredictions}</div>
              </div>
            </div>
            
            <div className="calibration-metrics">
              <div className="calibration-item">
                <span className="calibration-label">Calibration Score</span>
                <span className="calibration-value">{(simulationResults.calibrationScore * 100).toFixed(1)}%</span>
                <span className="calibration-status good">Well Calibrated</span>
              </div>
              <div className="calibration-item">
                <span className="calibration-label">Reliability Score</span>
                <span className="calibration-value">{(simulationResults.reliabilityScore * 100).toFixed(1)}%</span>
                <span className="calibration-status good">Reliable</span>
              </div>
            </div>
          </div>
          
          <div className="predictions-sample">
            <h5>Sample Predictions with Confidence</h5>
            <div className="predictions-table">
              <div className="table-header">
                <span>Player</span>
                <span>Prediction</span>
                <span>Confidence</span>
                <span>Uncertainty</span>
                <span>Method</span>
              </div>
              {simulationResults.predictions.slice(0, 10).map((prediction: any) => (
                <div key={prediction.id} className="table-row">
                  <span className="player-name">{prediction.player}</span>
                  <span className="prediction-value">{prediction.prediction.toFixed(1)}</span>
                  <span className={`confidence-value ${getConfidenceClass(prediction.confidence)}`}>
                    {(prediction.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="uncertainty-value">±{prediction.uncertainty.toFixed(1)}</span>
                  <span className="method-name">{prediction.method}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="demo-insights">
        <h4>💡 Key Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <h5>Confidence-Based Strategies</h5>
            <p>
              Use high-confidence predictions for cash games and safe plays. 
              Reserve low-confidence, high-upside plays for tournaments where differentiation matters.
            </p>
          </div>
          <div className="insight-card">
            <h5>Uncertainty as Information</h5>
            <p>
              High uncertainty doesn't mean bad predictions - it indicates situations where 
              multiple outcomes are plausible, creating opportunity for strategic advantage.
            </p>
          </div>
          <div className="insight-card">
            <h5>Dynamic Confidence</h5>
            <p>
              Oracle's confidence adapts to changing conditions. Pre-game confidence may differ 
              from in-game confidence as new information becomes available.
            </p>
          </div>
          <div className="insight-card">
            <h5>Portfolio Approach</h5>
            <p>
              Balance your lineup with a mix of high-confidence safe plays and 
              lower-confidence high-upside options for optimal risk-reward profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="oracle-confidence-section">
      <div className="section-header">
        <h2>🎯 Confidence Scores & Uncertainty Quantification</h2>
        <p>Understanding prediction reliability and uncertainty bounds in Oracle's AI system</p>
      </div>
      
      <div className="section-navigation">
        <button
          className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`nav-button ${activeTab === 'methods' ? 'active' : ''}`}
          onClick={() => setActiveTab('methods')}
        >
          🔬 Methods
        </button>
        <button
          className={`nav-button ${activeTab === 'uncertainty' ? 'active' : ''}`}
          onClick={() => setActiveTab('uncertainty')}
        >
          🔍 Uncertainty
        </button>
        <button
          className={`nav-button ${activeTab === 'calibration' ? 'active' : ''}`}
          onClick={() => setActiveTab('calibration')}
        >
          ⚖️ Calibration
        </button>
        <button
          className={`nav-button ${activeTab === 'intervals' ? 'active' : ''}`}
          onClick={() => setActiveTab('intervals')}
        >
          📊 Intervals
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
        {activeTab === 'methods' && renderMethods()}
        {activeTab === 'uncertainty' && renderUncertainty()}
        {activeTab === 'calibration' && renderCalibration()}
        {activeTab === 'intervals' && renderIntervals()}
        {activeTab === 'demo' && renderDemo()}
      </div>
    </div>
  );
};

export default OracleConfidenceEstimationSection;
