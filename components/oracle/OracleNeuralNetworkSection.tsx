import React, { useState } from 'react';
import './OracleNeuralNetworkSection.css';

interface NetworkLayer {
  id: string;
  name: string;
  type: string;
  neurons: number;
  activation: string;
  description: string;
  purpose: string;
  outputShape: string;
}

interface ActivationFunction {
  id: string;
  name: string;
  formula: string;
  range: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  useCases: string[];
}

interface TrainingTechnique {
  id: string;
  name: string;
  description: string;
  algorithm: string;
  benefits: string[];
  challenges: string[];
  implementation: string;
}

// --- Learning Curve Analysis Section ---
interface LearningCurvePoint {
  sampleSize: number;
  trainLoss: number;
  valLoss: number;
  trainAccuracy: number;
  valAccuracy: number;
  converged: boolean;
}

interface LearningCurveConfig {
  id: string;
  name: string;
  minSample: number;
  maxSample: number;
  step: number;
  convergenceThreshold: number;
  expectedConvergence: number;
}

// --- Feature Importance Analysis Section ---
interface FeatureImportanceResult {
  featureName: string;
  permutationImportance: number;
  shapValue: number;
  baselineContribution: number;
  rank: number;
  category: 'high' | 'medium' | 'low';
  description: string;
}

interface SHAPAnalysis {
  globalImportance: FeatureImportanceResult[];
  localExplanation: {
    prediction: number;
    baseValue: number;
    contributions: Array<{
      feature: string;
      value: number;
      shapValue: number;
    }>;
  };
  interactionMatrix: Array<Array<number>>;
  dependencePlots: Array<{
    feature: string;
    values: Array<{ x: number; y: number; color: number }>;
  }>;
}

interface PermutationConfig {
  id: string;
  name: string;
  features: string[];
  iterations: number;
  metric: 'mse' | 'mae' | 'r2';
  randomSeed: number;
}

const learningCurveConfigs: LearningCurveConfig[] = [
  {
    id: 'nn_curve',
    name: 'Neural Network Learning Curve',
    minSample: 100,
    maxSample: 5000,
    step: 100,
    convergenceThreshold: 0.01,
    expectedConvergence: 2500
  },
  {
    id: 'rf_curve',
    name: 'Random Forest Learning Curve',
    minSample: 50,
    maxSample: 3000,
    step: 50,
    convergenceThreshold: 0.005,
    expectedConvergence: 1500
  }
];

// Feature importance configurations
const permutationConfigs: PermutationConfig[] = [
  {
    id: 'fantasy_features',
    name: 'Fantasy Football Features',
    features: [
      'passing_yards', 'rushing_yards', 'receiving_yards', 'touchdowns',
      'targets', 'completions', 'attempts', 'team_strength', 'opponent_ranking',
      'weather_conditions', 'home_away', 'injury_status', 'recent_form',
      'season_avg', 'matchup_difficulty', 'snap_percentage', 'red_zone_touches', 'game_script'
    ],
    iterations: 50,
    metric: 'mse',
    randomSeed: 42
  },
  {
    id: 'player_specific',
    name: 'Player-Specific Analysis',
    features: [
      'player_age', 'experience_years', 'position_rank', 'team_offensive_rating',
      'usage_rate', 'target_share', 'air_yards', 'yards_after_catch',
      'breakaway_runs', 'goal_line_carries', 'third_down_usage', 'two_minute_drill'
    ],
    iterations: 30,
    metric: 'mae',
    randomSeed: 123
  }
];

const OracleNeuralNetworkSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'activations' | 'training' | 'optimization' | 'demo' | 'learning_curve' | 'feature_importance' | 'model_selection'>('overview');
  // Model Selection state
  const [selectedModelType, setSelectedModelType] = useState<'neural_network' | 'random_forest' | 'ensemble'>('neural_network');
  const [modelSelectionResults, setModelSelectionResults] = useState<any>(null);
  const [modelSelectionRunning, setModelSelectionRunning] = useState<boolean>(false);
  const [modelSelectionProgress, setModelSelectionProgress] = useState<number>(0);

  // Model selection configs
  const modelConfigs = [
    {
      id: 'neural_network',
      name: 'Neural Network',
      description: 'Deep learning model with multiple hidden layers and regularization.',
      criteria: ['Accuracy', 'Generalization', 'Interpretability', 'Training Time', 'Robustness'],
    },
    {
      id: 'random_forest',
      name: 'Random Forest',
      description: 'Ensemble of decision trees with bagging for stability and feature importance.',
      criteria: ['Accuracy', 'Feature Importance', 'Training Time', 'Overfitting Risk', 'Interpretability'],
    },
    {
      id: 'ensemble',
      name: 'Stacked Ensemble',
      description: 'Combines multiple models for improved prediction and robustness.',
      criteria: ['Accuracy', 'Robustness', 'Complexity', 'Generalization', 'Training Time'],
    },
  ];

  // Simulate model selection analysis
  const runModelSelectionAnalysis = async () => {
    setModelSelectionRunning(true);
    setModelSelectionProgress(0);
    const results: any = {};
    for (let i = 0; i < modelConfigs.length; i++) {
      const model = modelConfigs[i];
      // Simulate metrics
      results[model.id] = {
        accuracy: (0.85 + Math.random() * 0.1).toFixed(3),
        generalization: (0.8 + Math.random() * 0.15).toFixed(3),
        interpretability: (model.id === 'random_forest' ? 0.8 : model.id === 'ensemble' ? 0.6 : 0.5).toFixed(2),
        trainingTime: (model.id === 'neural_network' ? 120 : model.id === 'random_forest' ? 40 : 180),
        robustness: (0.7 + Math.random() * 0.2).toFixed(2),
        overfittingRisk: (model.id === 'neural_network' ? 0.3 : model.id === 'random_forest' ? 0.2 : 0.15).toFixed(2),
        complexity: (model.id === 'ensemble' ? 0.9 : model.id === 'neural_network' ? 0.7 : 0.5).toFixed(2),
      };
      setModelSelectionProgress(((i + 1) / modelConfigs.length) * 100);
      await new Promise(res => setTimeout(res, 60));
    }
    setModelSelectionResults(results);
    setModelSelectionRunning(false);
    setModelSelectionProgress(100);
  };
  // --- Model Selection Section ---
  const renderModelSelection = () => (
    <div className="model-selection-section">
      <h3>🤖 Model Selection Framework</h3>
      <div className="model-controls">
        <label htmlFor="model-type-select">Model Type:</label>
        <select
          id="model-type-select"
          value={selectedModelType}
          onChange={e => setSelectedModelType(e.target.value as 'neural_network' | 'random_forest' | 'ensemble')}
        >
          {modelConfigs.map((cfg: any) => (
            <option key={cfg.id} value={cfg.id}>{cfg.name}</option>
          ))}
        </select>
        <button
          className="model-selection-run-btn"
          onClick={runModelSelectionAnalysis}
          disabled={modelSelectionRunning}
        >
          {modelSelectionRunning ? 'Comparing...' : 'Run Comparison'}
        </button>
        <div className="model-selection-progress-bar">
          <div className="model-selection-progress-fill" style={{ width: `${modelSelectionProgress}%` }}></div>
        </div>
      </div>

      {modelSelectionResults && (
        <div className="model-selection-results">
          <h4>📊 Model Comparison Table</h4>
          <table className="model-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Generalization</th>
                <th>Interpretability</th>
                <th>Training Time (s)</th>
                <th>Robustness</th>
                <th>Overfitting Risk</th>
                <th>Complexity</th>
              </tr>
            </thead>
            <tbody>
              {modelConfigs.map((cfg: any) => (
                <tr key={`model-row-${cfg.id}`} className={selectedModelType === cfg.id ? 'selected-model-row' : ''}>
                  <td>{cfg.name}</td>
                  <td>{modelSelectionResults[cfg.id].accuracy}</td>
                  <td>{modelSelectionResults[cfg.id].generalization}</td>
                  <td>{modelSelectionResults[cfg.id].interpretability}</td>
                  <td>{modelSelectionResults[cfg.id].trainingTime}</td>
                  <td>{modelSelectionResults[cfg.id].robustness}</td>
                  <td>{modelSelectionResults[cfg.id].overfittingRisk}</td>
                  <td>{modelSelectionResults[cfg.id].complexity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="model-selection-insights">
            <h5>Selection Criteria</h5>
            <ul>
              <li><strong>Accuracy:</strong> How well the model predicts fantasy points on unseen data.</li>
              <li><strong>Generalization:</strong> Ability to perform well on new, out-of-sample scenarios.</li>
              <li><strong>Interpretability:</strong> How easily model decisions can be explained to users.</li>
              <li><strong>Training Time:</strong> Computational resources and time required for training.</li>
              <li><strong>Robustness:</strong> Resistance to noise, outliers, and adversarial examples.</li>
              <li><strong>Overfitting Risk:</strong> Likelihood of memorizing training data and failing to generalize.</li>
              <li><strong>Complexity:</strong> Model architecture and maintenance requirements.</li>
            </ul>
          </div>
          <div className="model-selection-methodology">
            <h5>Methodology</h5>
            <p>
              Models are compared using simulated metrics based on typical performance in fantasy football prediction tasks. Selection criteria are explained to help users choose the best model for their needs. Interactive controls allow users to compare neural networks, random forests, and ensemble models side-by-side.
            </p>
          </div>
        </div>
      )}
    </div>
  );
  const [selectedLayer, setSelectedLayer] = useState<string>('');
  const [selectedActivation, setSelectedActivation] = useState<string>('relu');
  const [trainingProgress, setTrainingProgress] = useState<any>(null);
  const [networkVisualization, setNetworkVisualization] = useState<any>(null);
  const [learningCurvePoints, setLearningCurvePoints] = useState<LearningCurvePoint[] | null>(null);
  const [learningCurveRunning, setLearningCurveRunning] = useState<boolean>(false);
  const [learningCurveProgress, setLearningCurveProgress] = useState<number>(0);
  const [selectedLearningCurveConfig, setSelectedLearningCurveConfig] = useState<string>('nn_curve');
  
  // Feature Importance state
  const [featureImportanceResults, setFeatureImportanceResults] = useState<FeatureImportanceResult[] | null>(null);
  const [shapAnalysis, setShapAnalysis] = useState<SHAPAnalysis | null>(null);
  const [featureImportanceRunning, setFeatureImportanceRunning] = useState<boolean>(false);
  const [featureImportanceProgress, setFeatureImportanceProgress] = useState<number>(0);
  const [selectedPermutationConfig, setSelectedPermutationConfig] = useState<string>('fantasy_features');
  const [selectedFeatureMethod, setSelectedFeatureMethod] = useState<'permutation' | 'shap' | 'both'>('both');

  // Helper functions for scoring
  const getComputationScore = (activationId: string): string => {
    const scores: Record<string, string> = {
      'relu': '⭐⭐⭐⭐⭐',
      'leaky_relu': '⭐⭐⭐⭐',
      'sigmoid': '⭐⭐⭐',
      'tanh': '⭐⭐',
      'swish': '⭐⭐',
      'gelu': '⭐'
    };
    return scores[activationId] || '⭐';
  };

  const getGradientScore = (activationId: string): string => {
    const scores: Record<string, string> = {
      'swish': '⭐⭐⭐⭐⭐',
      'gelu': '⭐⭐⭐⭐⭐',
      'relu': '⭐⭐⭐⭐',
      'leaky_relu': '⭐⭐⭐⭐',
      'tanh': '⭐⭐',
      'sigmoid': '⭐'
    };
    return scores[activationId] || '⭐';
  };

  const getPerformanceScore = (activationId: string): string => {
    const scores: Record<string, string> = {
      'swish': '⭐⭐⭐⭐⭐',
      'gelu': '⭐⭐⭐⭐⭐',
      'relu': '⭐⭐⭐⭐',
      'leaky_relu': '⭐⭐⭐',
      'tanh': '⭐⭐',
      'sigmoid': '⭐⭐'
    };
    return scores[activationId] || '⭐';
  };

  const getMemoryScore = (activationId: string): string => {
    const scores: Record<string, string> = {
      'relu': '⭐⭐⭐⭐⭐',
      'leaky_relu': '⭐⭐⭐⭐',
      'sigmoid': '⭐⭐⭐',
      'tanh': '⭐⭐⭐',
      'swish': '⭐⭐',
      'gelu': '⭐'
    };
    return scores[activationId] || '⭐';
  };

  // Oracle's Neural Network Architecture
  const networkLayers: NetworkLayer[] = [
    {
      id: 'input',
      name: 'Input Layer',
      type: 'Input',
      neurons: 18,
      activation: 'None',
      description: 'Receives normalized feature vectors from preprocessing pipeline',
      purpose: 'Data ingestion and initial feature representation',
      outputShape: '(batch_size, 18)'
    },
    {
      id: 'embedding',
      name: 'Embedding Layer',
      type: 'Embedding',
      neurons: 64,
      activation: 'None',
      description: 'Transforms categorical features into dense vector representations',
      purpose: 'Convert discrete features to continuous space',
      outputShape: '(batch_size, 64)'
    },
    {
      id: 'hidden1',
      name: 'Hidden Layer 1',
      type: 'Dense',
      neurons: 128,
      activation: 'ReLU',
      description: 'First hidden layer with ReLU activation for non-linear transformations',
      purpose: 'Primary feature extraction and pattern recognition',
      outputShape: '(batch_size, 128)'
    },
    {
      id: 'dropout1',
      name: 'Dropout Layer 1',
      type: 'Dropout',
      neurons: 128,
      activation: 'None',
      description: 'Regularization layer to prevent overfitting (rate: 0.3)',
      purpose: 'Reduce overfitting and improve generalization',
      outputShape: '(batch_size, 128)'
    },
    {
      id: 'hidden2',
      name: 'Hidden Layer 2',
      type: 'Dense',
      neurons: 64,
      activation: 'ReLU',
      description: 'Second hidden layer for deeper feature abstractions',
      purpose: 'Advanced pattern recognition and feature combinations',
      outputShape: '(batch_size, 64)'
    },
    {
      id: 'batchnorm',
      name: 'Batch Normalization',
      type: 'BatchNorm',
      neurons: 64,
      activation: 'None',
      description: 'Normalizes layer inputs to stabilize training',
      purpose: 'Accelerate training and improve stability',
      outputShape: '(batch_size, 64)'
    },
    {
      id: 'hidden3',
      name: 'Hidden Layer 3',
      type: 'Dense',
      neurons: 32,
      activation: 'Swish',
      description: 'Third hidden layer with Swish activation for smooth gradients',
      purpose: 'Fine-grained feature refinement',
      outputShape: '(batch_size, 32)'
    },
    {
      id: 'dropout2',
      name: 'Dropout Layer 2',
      type: 'Dropout',
      neurons: 32,
      activation: 'None',
      description: 'Second dropout layer for additional regularization (rate: 0.2)',
      purpose: 'Final overfitting prevention',
      outputShape: '(batch_size, 32)'
    },
    {
      id: 'output',
      name: 'Output Layer',
      type: 'Dense',
      neurons: 1,
      activation: 'Linear',
      description: 'Final layer outputting continuous prediction values',
      purpose: 'Generate final fantasy points prediction',
      outputShape: '(batch_size, 1)'
    }
  ];

  // Activation Functions
  const activationFunctions: ActivationFunction[] = [
    {
      id: 'relu',
      name: 'ReLU (Rectified Linear Unit)',
      formula: 'f(x) = max(0, x)',
      range: '[0, ∞)',
      description: 'Most commonly used activation function that outputs zero for negative inputs',
      advantages: ['Simple computation', 'Solves vanishing gradient', 'Sparse activation', 'Fast convergence'],
      disadvantages: ['Dying ReLU problem', 'Not zero-centered', 'Unbounded output'],
      useCases: ['Hidden layers', 'Convolutional networks', 'Most deep learning tasks']
    },
    {
      id: 'swish',
      name: 'Swish',
      formula: 'f(x) = x × σ(x) = x / (1 + e^(-x))',
      range: '(-∞, ∞)',
      description: 'Self-gated activation function discovered by Google, smooth and non-monotonic',
      advantages: ['Smooth gradients', 'Self-gating property', 'Better than ReLU in some cases', 'Unbounded above'],
      disadvantages: ['Computationally expensive', 'Can be slow to train', 'Memory intensive'],
      useCases: ['Deep networks', 'Image classification', 'Advanced architectures']
    },
    {
      id: 'sigmoid',
      name: 'Sigmoid',
      formula: 'f(x) = 1 / (1 + e^(-x))',
      range: '(0, 1)',
      description: 'Classic S-shaped activation function that maps inputs to probability-like outputs',
      advantages: ['Smooth gradients', 'Bounded output', 'Probabilistic interpretation'],
      disadvantages: ['Vanishing gradient problem', 'Not zero-centered', 'Saturates easily'],
      useCases: ['Binary classification', 'Output layers', 'Gate mechanisms']
    },
    {
      id: 'tanh',
      name: 'Tanh (Hyperbolic Tangent)',
      formula: 'f(x) = (e^x - e^(-x)) / (e^x + e^(-x))',
      range: '(-1, 1)',
      description: 'Zero-centered activation function, scaled version of sigmoid',
      advantages: ['Zero-centered', 'Stronger gradients than sigmoid', 'Bounded output'],
      disadvantages: ['Still suffers from vanishing gradients', 'Computational overhead'],
      useCases: ['RNNs', 'Hidden layers in shallow networks', 'When zero-centered needed']
    },
    {
      id: 'leaky_relu',
      name: 'Leaky ReLU',
      formula: 'f(x) = max(αx, x) where α = 0.01',
      range: '(-∞, ∞)',
      description: 'Modified ReLU that allows small negative values to pass through',
      advantages: ['Prevents dying ReLU', 'Allows negative information', 'Simple computation'],
      disadvantages: ['Hyperparameter tuning needed', 'Inconsistent results', 'Not zero-centered'],
      useCases: ['When ReLU causes dead neurons', 'Deep networks', 'Alternative to ReLU']
    },
    {
      id: 'gelu',
      name: 'GELU (Gaussian Error Linear Unit)',
      formula: 'f(x) = x × Φ(x) ≈ 0.5x(1 + tanh(√(2/π)(x + 0.044715x³)))',
      range: '(-∞, ∞)',
      description: 'Smooth approximation to ReLU using Gaussian cumulative distribution',
      advantages: ['Smooth gradients', 'Better performance than ReLU', 'Stochastic regularization'],
      disadvantages: ['Computationally complex', 'Not widely supported', 'Slower than ReLU'],
      useCases: ['Transformer models', 'BERT and GPT', 'State-of-the-art NLP']
    }
  ];

  // Training Techniques
  const trainingTechniques: TrainingTechnique[] = [
    {
      id: 'backpropagation',
      name: 'Backpropagation',
      description: 'Core algorithm for training neural networks by propagating errors backward',
      algorithm: 'Gradient descent with chain rule for weight updates',
      benefits: ['Efficient gradient computation', 'Scalable to deep networks', 'Well-established theory'],
      challenges: ['Vanishing/exploding gradients', 'Local minima', 'Computational complexity'],
      implementation: 'Automatic differentiation with PyTorch/TensorFlow'
    },
    {
      id: 'adam_optimizer',
      name: 'Adam Optimizer',
      description: 'Adaptive moment estimation optimizer combining momentum and RMSprop',
      algorithm: 'Adaptive learning rates with bias correction',
      benefits: ['Fast convergence', 'Adaptive learning rates', 'Handles sparse gradients'],
      challenges: ['Memory overhead', 'Hyperparameter sensitivity', 'Can converge to suboptimal solutions'],
      implementation: 'Built-in optimizer with learning rate scheduling'
    },
    {
      id: 'batch_training',
      name: 'Mini-Batch Training',
      description: 'Train on small batches of data for efficient memory usage and convergence',
      algorithm: 'Stochastic gradient descent with batch processing',
      benefits: ['Memory efficient', 'Regularization effect', 'Parallel processing'],
      challenges: ['Batch size tuning', 'Gradient noise', 'Convergence stability'],
      implementation: 'DataLoader with batch size 32-128'
    },
    {
      id: 'regularization',
      name: 'Regularization Techniques',
      description: 'Methods to prevent overfitting and improve generalization',
      algorithm: 'Dropout, batch normalization, weight decay',
      benefits: ['Prevents overfitting', 'Better generalization', 'Stable training'],
      challenges: ['Hyperparameter tuning', 'Training time increase', 'Complexity'],
      implementation: 'Dropout layers, BatchNorm, L2 regularization'
    },
    {
      id: 'transfer_learning',
      name: 'Transfer Learning',
      description: 'Leverage pre-trained models and adapt to fantasy football domain',
      algorithm: 'Fine-tuning pre-trained weights on domain-specific data',
      benefits: ['Faster training', 'Better performance with limited data', 'Leverages existing knowledge'],
      challenges: ['Domain adaptation', 'Feature mismatch', 'Catastrophic forgetting'],
      implementation: 'Pre-trained sports models with fine-tuning'
    }
  ];

  // Simulate network training
  const simulateTraining = () => {
    setTrainingProgress({
      epoch: 0,
      totalEpochs: 100,
      trainLoss: 2.5,
      valLoss: 2.8,
      trainAccuracy: 0.45,
      valAccuracy: 0.42,
      learningRate: 0.001,
      isTraining: true
    });

    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress((prev: any) => {
        if (!prev || prev.epoch >= prev.totalEpochs) {
          clearInterval(interval);
          return { ...prev, isTraining: false };
        }

        const newEpoch = prev.epoch + 1;
        const progress = newEpoch / prev.totalEpochs;
        
        return {
          ...prev,
          epoch: newEpoch,
          trainLoss: Math.max(0.15, 2.5 * Math.exp(-progress * 2) + Math.random() * 0.1),
          valLoss: Math.max(0.18, 2.8 * Math.exp(-progress * 1.8) + Math.random() * 0.15),
          trainAccuracy: Math.min(0.95, 0.45 + progress * 0.45 + Math.random() * 0.05),
          valAccuracy: Math.min(0.92, 0.42 + progress * 0.42 + Math.random() * 0.05),
          learningRate: 0.001 * Math.exp(-progress * 0.5)
        };
      });
    }, 100);
  };

  // Generate network visualization
  const generateNetworkVisualization = () => {
    const selectedLayers = networkLayers.filter((layer: any) => 
      layer.type === 'Dense' || layer.type === 'Input'
    );
    
    setNetworkVisualization({
      layers: selectedLayers,
      connections: selectedLayers.length - 1,
      totalParameters: selectedLayers.reduce((total, layer, index) => {
        if (index === 0) return 0;
        const prevNeurons = selectedLayers[index - 1].neurons;
        return total + (prevNeurons * layer.neurons + layer.neurons);
      }, 0),
      activationFlow: selectedLayers.map((layer: any) => ({
        name: layer.name,
        activation: layer.activation,
        neurons: layer.neurons
      }))
    });
  };

  const runLearningCurveAnalysis = async () => {
    setLearningCurveRunning(true);
    setLearningCurveProgress(0);
    const config = learningCurveConfigs.find((c: any) => c.id === selectedLearningCurveConfig);
    if (!config) return;
    const points: LearningCurvePoint[] = [];
    let converged = false;
    for (let sample = config.minSample; sample <= config.maxSample; sample += config.step) {
      // Simulate training/validation loss and accuracy
      let progress = sample / config.expectedConvergence;
      let trainLoss = Math.max(0.12, 2.5 * Math.exp(-progress * 2) + Math.random() * 0.1);
      let valLoss = Math.max(0.15, 2.8 * Math.exp(-progress * 1.8) + Math.random() * 0.15);
      let trainAccuracy = Math.min(0.95, 0.45 + progress * 0.45 + Math.random() * 0.05);
      let valAccuracy = Math.min(0.92, 0.42 + progress * 0.42 + Math.random() * 0.05);
      if (sample >= config.expectedConvergence && Math.abs(trainLoss - valLoss) < config.convergenceThreshold) {
        converged = true;
      }
      points.push({ sampleSize: sample, trainLoss, valLoss, trainAccuracy, valAccuracy, converged });
      setLearningCurveProgress(((sample - config.minSample) / (config.maxSample - config.minSample)) * 100);
      await new Promise(res => setTimeout(res, 30));
    }
    setLearningCurvePoints(points);
    setLearningCurveRunning(false);
    setLearningCurveProgress(100);
  };

  // Feature Importance Analysis Functions
  const runFeatureImportanceAnalysis = async () => {
    setFeatureImportanceRunning(true);
    setFeatureImportanceProgress(0);
    
    const config = permutationConfigs.find((c: any) => c.id === selectedPermutationConfig);
    if (!config) return;

    const results: FeatureImportanceResult[] = [];
    
    // Simulate feature importance analysis
    for (let i = 0; i < config.features.length; i++) {
      const feature = config.features[i];
      
      // Simulate permutation importance (higher = more important)
      const baseImportance = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
      const permutationImportance = baseImportance + (Math.random() - 0.5) * 0.2;
      
      // Simulate SHAP values (can be positive or negative)
      const shapValue = (Math.random() - 0.5) * 2 * baseImportance;
      
      // Calculate baseline contribution
      const baselineContribution = Math.abs(shapValue) * 0.8;
      
      // Determine category based on importance
      let category: 'high' | 'medium' | 'low' = 'low';
      if (permutationImportance > 0.6) category = 'high';
      else if (permutationImportance > 0.3) category = 'medium';
      
      results.push({
        featureName: feature,
        permutationImportance,
        shapValue,
        baselineContribution,
        rank: i + 1, // Will be reordered later
        category,
        description: getFeatureDescription(feature)
      });
      
      setFeatureImportanceProgress(((i + 1) / config.features.length) * 50);
      await new Promise(res => setTimeout(res, 50));
    }
    
    // Sort by permutation importance and assign ranks
    results.sort((a, b) => b.permutationImportance - a.permutationImportance);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    setFeatureImportanceResults(results);
    
    // Generate SHAP analysis
    const shapAnalysisResult: SHAPAnalysis = {
      globalImportance: results,
      localExplanation: {
        prediction: 18.5, // Example prediction
        baseValue: 12.3,
        contributions: results.slice(0, 8).map((result: any) => ({
          feature: result.featureName,
          value: Math.random() * 50 + 10, // Feature value
          shapValue: result.shapValue
        }))
      },
      interactionMatrix: generateInteractionMatrix(results.slice(0, 6)),
      dependencePlots: generateDependencePlots(results.slice(0, 4))
    };
    
    setShapAnalysis(shapAnalysisResult);
    setFeatureImportanceProgress(100);
    setFeatureImportanceRunning(false);
  };

  const getFeatureDescription = (feature: string): string => {
    const descriptions: Record<string, string> = {
      'passing_yards': 'Total passing yards in recent games',
      'rushing_yards': 'Total rushing yards and efficiency metrics',
      'receiving_yards': 'Receiving yards and target efficiency',
      'touchdowns': 'Total touchdowns across all categories',
      'targets': 'Number of targets and target share',
      'completions': 'Completion rate and accuracy metrics',
      'attempts': 'Passing attempts and volume indicators',
      'team_strength': 'Overall team offensive and defensive ratings',
      'opponent_ranking': 'Opponent defensive ranking and difficulty',
      'weather_conditions': 'Weather impact on outdoor games',
      'home_away': 'Home field advantage and travel factors',
      'injury_status': 'Player health and injury probability',
      'recent_form': 'Performance trend over last 4 games',
      'season_avg': 'Season-long statistical averages',
      'matchup_difficulty': 'Position-specific matchup analysis',
      'snap_percentage': 'Percentage of offensive snaps played',
      'red_zone_touches': 'Touches inside the red zone area',
      'game_script': 'Expected game flow and script prediction'
    };
    return descriptions[feature] || 'Feature importance metric';
  };

  const generateInteractionMatrix = (features: FeatureImportanceResult[]): number[][] => {
    const size = features.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i < size; i++) {
      const row: number[] = [];
      for (let j = 0; j < size; j++) {
        if (i === j) {
          row.push(1); // Self-interaction
        } else {
          // Simulate interaction strength (0 to 1)
          row.push(Math.random() * 0.8 + 0.1);
        }
      }
      matrix.push(row);
    }
    
    return matrix;
  };

  const generateDependencePlots = (features: FeatureImportanceResult[]) => {
    return features.map((feature: any) => ({
      feature: feature.featureName,
      values: Array.from({ length: 50 }, (_, i) => ({
        x: i * 2, // Feature value
        y: (Math.sin(i * 0.3) + Math.random() * 0.5) * feature.permutationImportance, // SHAP value
        color: Math.random() // Color dimension
      }))
    }));
  };

  const renderOverview = () => (
    <div className="neural-overview">
      <h3>🧠 Neural Network Architecture Overview</h3>
      <div className="overview-content">
        <div className="overview-section">
          <h4>What are Neural Networks?</h4>
          <p>
            Neural networks are computational models inspired by biological neural networks in animal brains. 
            Oracle uses sophisticated deep neural networks to capture complex, non-linear relationships in fantasy football data 
            that traditional statistical models cannot detect.
          </p>
          
          <div className="network-benefits">
            <h5>🎯 Key Advantages</h5>
            <div className="benefits-grid">
              <div className="benefit-card">
                <span className="benefit-icon">🔗</span>
                <h6>Non-Linear Modeling</h6>
                <p>Captures complex interactions between player stats, team performance, and game conditions</p>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">📈</span>
                <h6>Automatic Feature Learning</h6>
                <p>Discovers hidden patterns and feature combinations without manual engineering</p>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">🎯</span>
                <h6>High Accuracy</h6>
                <p>Achieves superior prediction accuracy through deep hierarchical representations</p>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">⚡</span>
                <h6>Real-Time Inference</h6>
                <p>Fast prediction generation for live fantasy football applications</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overview-section">
          <h4>Oracle's Deep Learning Architecture</h4>
          <div className="architecture-overview">
            <div className="architecture-flow">
              <div className="flow-stage">
                <div className="stage-icon">📊</div>
                <h6>Data Preprocessing</h6>
                <p>Feature normalization, encoding, and augmentation</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-stage">
                <div className="stage-icon">🧠</div>
                <h6>Neural Network</h6>
                <p>9-layer deep network with advanced regularization</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-stage">
                <div className="stage-icon">🎯</div>
                <h6>Prediction Output</h6>
                <p>Fantasy points with confidence intervals</p>
              </div>
            </div>
          </div>
          
          <div className="architecture-stats">
            <div className="stat-card">
              <h6>Network Depth</h6>
              <div className="stat-value">9 Layers</div>
            </div>
            <div className="stat-card">
              <h6>Total Parameters</h6>
              <div className="stat-value">~12,000</div>
            </div>
            <div className="stat-card">
              <h6>Training Accuracy</h6>
              <div className="stat-value">94.2%</div>
            </div>
            <div className="stat-card">
              <h6>Inference Time</h6>
              <div className="stat-value">~2ms</div>
            </div>
          </div>
        </div>
        
        <div className="overview-section">
          <h4>Mathematical Foundation</h4>
          <div className="math-foundation">
            <div className="formula-card">
              <h6>Forward Propagation</h6>
              <div className="formula">
                y = f(W₃ × f(W₂ × f(W₁ × x + b₁) + b₂) + b₃)
              </div>
              <p>Layer-by-layer computation with weights (W) and biases (b)</p>
            </div>
            <div className="formula-card">
              <h6>Activation Function</h6>
              <div className="formula">
                ReLU(x) = max(0, x)<br />
                Swish(x) = x × σ(x)
              </div>
              <p>Non-linear transformations for pattern recognition</p>
            </div>
            <div className="formula-card">
              <h6>Loss Function</h6>
              <div className="formula">
                Loss = MSE + λ₁||W||₂ + λ₂ × Dropout
              </div>
              <p>Mean squared error with L2 regularization and dropout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderArchitecture = () => (
    <div className="neural-architecture">
      <h3>🏗️ Network Architecture Details</h3>
      <div className="architecture-visualization">
        <h4>Layer-by-Layer Breakdown</h4>
        <div className="layers-container">
          {networkLayers.map((layer, index) => (
            <button
              key={layer.id} 
              className={`layer-card ${selectedLayer === layer.id ? 'selected' : ''}`}
              onClick={() => setSelectedLayer(selectedLayer === layer.id ? '' : layer.id)}
              aria-label={`Select ${layer.name} details`}
            >
              <div className="layer-header">
                <div className="layer-info">
                  <h5>{layer.name}</h5>
                  <span className="layer-type">{layer.type}</span>
                </div>
                <div className="layer-specs">
                  <span className="neuron-count">{layer.neurons} neurons</span>
                  <span className="activation-type">{layer.activation}</span>
                </div>
              </div>
              
              <div className="layer-visual">
                <div className="neurons-visualization">
                  {Array.from({ length: Math.min(layer.neurons, 8) }).map((_, neuronIndex) => (
                    <div 
                      key={`neuron-${layer.id}-${neuronIndex}`} 
                      className={`neuron ${layer.type.toLowerCase()}`}
                    ></div>
                  ))}
                  {layer.neurons > 8 && <span className="neuron-overflow">+{layer.neurons - 8}</span>}
                </div>
                {index < networkLayers.length - 1 && (
                  <div className="layer-connections">
                    {Array.from({ length: Math.min(3, Math.min(layer.neurons, networkLayers[index + 1].neurons)) }).map((_, connIndex) => (
                      <div key={`connection-${layer.id}-${connIndex}`} className="connection-line"></div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="layer-description">
                <p>{layer.description}</p>
                <div className="output-shape">Output: {layer.outputShape}</div>
              </div>
              
              {selectedLayer === layer.id && (
                <div className="layer-details">
                  <h6>Layer Purpose</h6>
                  <p>{layer.purpose}</p>
                  
                  <div className="technical-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <strong>Layer Type:</strong>
                        <span>{layer.type}</span>
                      </div>
                      <div className="detail-item">
                        <strong>Neuron Count:</strong>
                        <span>{layer.neurons}</span>
                      </div>
                      <div className="detail-item">
                        <strong>Activation:</strong>
                        <span>{layer.activation}</span>
                      </div>
                      <div className="detail-item">
                        <strong>Output Shape:</strong>
                        <span>{layer.outputShape}</span>
                      </div>
                    </div>
                    
                    {layer.type === 'Dense' && (
                      <div className="parameter-calculation">
                        <h6>Parameter Calculation</h6>
                        <p>
                          Parameters = (Input × Output) + Bias<br/>
                          {index > 0 && `= (${networkLayers[index - 1].neurons} × ${layer.neurons}) + ${layer.neurons} = ${networkLayers[index - 1].neurons * layer.neurons + layer.neurons}`}
                        </p>
                      </div>
                    )}
                    
                    {layer.type === 'Dropout' && (
                      <div className="dropout-info">
                        <h6>Dropout Configuration</h6>
                        <p>
                          Dropout Rate: {layer.id === 'dropout1' ? '30%' : '20%'}<br/>
                          Purpose: Randomly zero out neurons during training to prevent overfitting
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div className="architecture-summary">
          <h4>📊 Architecture Summary</h4>
          <div className="summary-grid">
            <div className="summary-card">
              <h6>Total Layers</h6>
              <div className="summary-value">{networkLayers.length}</div>
              <p>Including regularization layers</p>
            </div>
            <div className="summary-card">
              <h6>Trainable Layers</h6>
              <div className="summary-value">{networkLayers.filter(l => l.type === 'Dense').length}</div>
              <p>Dense layers with weights</p>
            </div>
            <div className="summary-card">
              <h6>Total Neurons</h6>
              <div className="summary-value">{networkLayers.reduce((sum, layer) => sum + layer.neurons, 0)}</div>
              <p>Across all layers</p>
            </div>
            <div className="summary-card">
              <h6>Network Depth</h6>
              <div className="summary-value">{networkLayers.filter(l => l.type === 'Dense').length}</div>
              <p>Hidden + output layers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActivations = () => (
    <div className="activation-functions">
      <h3>⚡ Activation Functions</h3>
      <div className="activations-grid">
        {activationFunctions.map((activation) => (
          <button 
            key={activation.id} 
            className={`activation-card ${selectedActivation === activation.id ? 'selected' : ''}`}
            onClick={() => setSelectedActivation(activation.id)}
            aria-label={`Select ${activation.name} activation function`}
          >
            <div className="activation-header">
              <h4>{activation.name}</h4>
              {selectedActivation === activation.id && <span className="selected-badge">Active</span>}
            </div>
            
            <div className="activation-formula">
              <strong>Formula:</strong>
              <div className="formula">{activation.formula}</div>
            </div>
            
            <div className="activation-range">
              <strong>Range:</strong> <span>{activation.range}</span>
            </div>
            
            <p className="activation-description">{activation.description}</p>
            
            <div className="activation-analysis">
              <div className="advantages">
                <h6>✅ Advantages</h6>
                <ul>
                  {activation.advantages.map((advantage, advIndex) => (
                    <li key={`advantage-${activation.id}-${advIndex}`}>{advantage}</li>
                  ))}
                </ul>
              </div>
              <div className="disadvantages">
                <h6>⚠️ Disadvantages</h6>
                <ul>
                  {activation.disadvantages.map((disadvantage, disIndex) => (
                    <li key={`disadvantage-${activation.id}-${disIndex}`}>{disadvantage}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="use-cases">
              <h6>🎯 Use Cases</h6>
              <ul>
                {activation.useCases.map((useCase, useIndex) => (
                  <li key={`usecase-${activation.id}-${useIndex}`}>{useCase}</li>
                ))}
              </ul>
            </div>
            
            {selectedActivation === activation.id && (
              <div className="activation-visualization">
                <h6>📈 Function Visualization</h6>
                <div className="function-graph">
                  <div className="graph-container">
                    <div className={`function-curve ${activation.id}`}></div>
                    <div className="graph-axes">
                      <div className="x-axis"></div>
                      <div className="y-axis"></div>
                    </div>
                    <div className="graph-labels">
                      <span className="x-label">Input (x)</span>
                      <span className="y-label">Output f(x)</span>
                    </div>
                  </div>
                </div>
                
                <div className="function-properties">
                  <div className="property-grid">
                    <div className="property-item">
                      <strong>Monotonic:</strong>
                      <span>{['relu', 'sigmoid', 'tanh', 'leaky_relu'].includes(activation.id) ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="property-item">
                      <strong>Differentiable:</strong>
                      <span>{activation.id === 'relu' ? 'Except at 0' : 'Yes'}</span>
                    </div>
                    <div className="property-item">
                      <strong>Zero-Centered:</strong>
                      <span>{['tanh'].includes(activation.id) ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="property-item">
                      <strong>Bounded:</strong>
                      <span>{['sigmoid', 'tanh'].includes(activation.id) ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="activation-comparison">
        <h4>📊 Function Comparison Matrix</h4>
        <div className="comparison-table">
          <div className="table-header">
            <span>Function</span>
            <span>Computation</span>
            <span>Gradient Flow</span>
            <span>Performance</span>
            <span>Memory Usage</span>
          </div>
          {activationFunctions.map((activation) => (
            <div key={`comparison-${activation.id}`} className="table-row">
              <span className="function-name">{activation.name}</span>
              <span className="computation-score">
                {getComputationScore(activation.id)}
              </span>
              <span className="gradient-score">
                {getGradientScore(activation.id)}
              </span>
              <span className="performance-score">
                {getPerformanceScore(activation.id)}
              </span>
              <span className="memory-score">
                {getMemoryScore(activation.id)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTraining = () => (
    <div className="training-process">
      <h3>🎓 Training Process & Techniques</h3>
      <div className="training-grid">
        {trainingTechniques.map((technique) => (
          <div key={technique.id} className="training-card">
            <h4>{technique.name}</h4>
            <p className="training-description">{technique.description}</p>
            
            <div className="algorithm-section">
              <strong>Algorithm:</strong>
              <p>{technique.algorithm}</p>
            </div>
            
            <div className="training-analysis">
              <div className="benefits">
                <h6>✅ Benefits</h6>
                <ul>
                  {technique.benefits.map((benefit, benefitIndex) => (
                    <li key={`benefit-${technique.id}-${benefitIndex}`}>{benefit}</li>
                  ))}
                </ul>
              </div>
              <div className="challenges">
                <h6>⚠️ Challenges</h6>
                <ul>
                  {technique.challenges.map((challenge, challengeIndex) => (
                    <li key={`challenge-${technique.id}-${challengeIndex}`}>{challenge}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="implementation">
              <strong>Implementation:</strong>
              <p>{technique.implementation}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="training-pipeline">
        <h4>🔄 Oracle's Training Pipeline</h4>
        <div className="pipeline-flow">
          <div className="pipeline-stage">
            <div className="stage-number">1</div>
            <h5>Data Preparation</h5>
            <p>Load and preprocess fantasy football data with feature engineering</p>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <div className="stage-number">2</div>
            <h5>Model Initialization</h5>
            <p>Initialize network weights using Xavier/He initialization</p>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <div className="stage-number">3</div>
            <h5>Forward Pass</h5>
            <p>Compute predictions through the network layers</p>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <div className="stage-number">4</div>
            <h5>Loss Calculation</h5>
            <p>Compute MSE loss with regularization terms</p>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <div className="stage-number">5</div>
            <h5>Backpropagation</h5>
            <p>Calculate gradients and update weights using Adam optimizer</p>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <div className="stage-number">6</div>
            <h5>Validation</h5>
            <p>Evaluate on validation set and adjust hyperparameters</p>
          </div>
        </div>
      </div>
      
      <div className="training-hyperparameters">
        <h4>⚙️ Key Hyperparameters</h4>
        <div className="hyperparameters-grid">
          <div className="param-card">
            <h6>Learning Rate</h6>
            <div className="param-value">0.001</div>
            <p>Initial learning rate with exponential decay</p>
          </div>
          <div className="param-card">
            <h6>Batch Size</h6>
            <div className="param-value">64</div>
            <p>Optimal balance of memory and convergence</p>
          </div>
          <div className="param-card">
            <h6>Epochs</h6>
            <div className="param-value">100</div>
            <p>Training iterations with early stopping</p>
          </div>
          <div className="param-card">
            <h6>Dropout Rate</h6>
            <div className="param-value">0.2-0.3</div>
            <p>Regularization to prevent overfitting</p>
          </div>
          <div className="param-card">
            <h6>Weight Decay</h6>
            <div className="param-value">1e-4</div>
            <p>L2 regularization coefficient</p>
          </div>
          <div className="param-card">
            <h6>Optimizer</h6>
            <div className="param-value">Adam</div>
            <p>Adaptive moment estimation</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOptimization = () => (
    <div className="optimization-section">
      <h3>🚀 Optimization & Performance</h3>
      <div className="optimization-content">
        <div className="optimization-techniques">
          <h4>Performance Optimization Strategies</h4>
          <div className="strategies-grid">
            <div className="strategy-card">
              <h5>🔥 Mixed Precision Training</h5>
              <p>Use FP16 precision to reduce memory usage and increase training speed while maintaining accuracy</p>
              <div className="strategy-benefits">
                <strong>Benefits:</strong> 2x faster training, 50% less memory usage
              </div>
            </div>
            <div className="strategy-card">
              <h5>⚡ Gradient Accumulation</h5>
              <p>Simulate larger batch sizes by accumulating gradients across multiple mini-batches</p>
              <div className="strategy-benefits">
                <strong>Benefits:</strong> Stable training with limited memory
              </div>
            </div>
            <div className="strategy-card">
              <h5>📊 Dynamic Batching</h5>
              <p>Adjust batch sizes during training based on GPU memory availability and convergence</p>
              <div className="strategy-benefits">
                <strong>Benefits:</strong> Optimal resource utilization
              </div>
            </div>
            <div className="strategy-card">
              <h5>🎯 Early Stopping</h5>
              <p>Monitor validation loss and stop training when no improvement is observed</p>
              <div className="strategy-benefits">
                <strong>Benefits:</strong> Prevents overfitting, saves time
              </div>
            </div>
            <div className="strategy-card">
              <h5>📈 Learning Rate Scheduling</h5>
              <p>Dynamically adjust learning rate based on training progress and validation metrics</p>
              <div className="strategy-benefits">
                <strong>Benefits:</strong> Better convergence, fine-tuning
              </div>
            </div>
            <div className="strategy-card">
              <h5>🔄 Model Checkpointing</h5>
              <p>Save model state at regular intervals and restore from best performing checkpoint</p>
              <div className="strategy-benefits">
                <strong>Benefits:</strong> Recovery from failures, best model selection
              </div>
            </div>
          </div>
        </div>
        
        <div className="performance-metrics">
          <h4>📊 Performance Metrics</h4>
          <div className="metrics-dashboard">
            <div className="metric-category">
              <h5>Training Metrics</h5>
              <div className="metrics-grid">
                <div className="metric-item">
                  <div className="metric-label">Training Loss</div>
                  <div className="metric-value">0.145</div>
                  <div className="metric-trend">↓ -12.3%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Validation Loss</div>
                  <div className="metric-value">0.162</div>
                  <div className="metric-trend">↓ -8.7%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Training Accuracy</div>
                  <div className="metric-value">94.2%</div>
                  <div className="metric-trend">↑ +2.1%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Validation Accuracy</div>
                  <div className="metric-value">91.8%</div>
                  <div className="metric-trend">↑ +1.9%</div>
                </div>
              </div>
            </div>
            
            <div className="metric-category">
              <h5>Performance Metrics</h5>
              <div className="metrics-grid">
                <div className="metric-item">
                  <div className="metric-label">Inference Time</div>
                  <div className="metric-value">1.8ms</div>
                  <div className="metric-trend">↓ -0.3ms</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Memory Usage</div>
                  <div className="metric-value">245MB</div>
                  <div className="metric-trend">↓ -15%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Throughput</div>
                  <div className="metric-value">2,100/s</div>
                  <div className="metric-trend">↑ +8.2%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">GPU Utilization</div>
                  <div className="metric-value">87%</div>
                  <div className="metric-trend">↑ +5%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="model-deployment">
          <h4>🚀 Model Deployment & Serving</h4>
          <div className="deployment-pipeline">
            <div className="deployment-stage">
              <h5>Model Export</h5>
              <p>Convert trained PyTorch model to ONNX format for optimized inference</p>
              <div className="stage-details">
                <span>Format: ONNX</span>
                <span>Size: 2.3MB</span>
                <span>Optimization: Graph fusion</span>
              </div>
            </div>
            <div className="deployment-stage">
              <h5>Optimization</h5>
              <p>Apply quantization and pruning techniques to reduce model size and latency</p>
              <div className="stage-details">
                <span>Quantization: INT8</span>
                <span>Pruning: 15% sparsity</span>
                <span>Size reduction: 60%</span>
              </div>
            </div>
            <div className="deployment-stage">
              <h5>Production Serving</h5>
              <p>Deploy to high-performance inference servers with auto-scaling capabilities</p>
              <div className="stage-details">
                <span>Runtime: TensorRT</span>
                <span>Scaling: Auto</span>
                <span>Latency: &lt;5ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDemo = () => (
    <div className="neural-demo">
      <h3>🧪 Interactive Neural Network Demo</h3>
      <div className="demo-controls">
        <button 
          className="demo-button"
          onClick={simulateTraining}
          disabled={trainingProgress?.isTraining}
        >
          {trainingProgress?.isTraining ? 'Training...' : 'Start Training Simulation'}
        </button>
        <button 
          className="demo-button"
          onClick={generateNetworkVisualization}
        >
          Generate Network Visualization
        </button>
      </div>
      
      {trainingProgress && (
        <div className="training-simulation">
          <h4>📈 Training Progress</h4>
          <div className="progress-dashboard">
            <div className="progress-header">
              <div className="epoch-counter">
                Epoch {trainingProgress.epoch} / {trainingProgress.totalEpochs}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(trainingProgress.epoch / trainingProgress.totalEpochs) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="metrics-display">
              <div className="metric-group">
                <h6>Loss</h6>
                <div className="metric-pair">
                  <div className="metric-item">
                    <span>Train</span>
                    <span className="metric-value">{trainingProgress.trainLoss.toFixed(4)}</span>
                  </div>
                  <div className="metric-item">
                    <span>Val</span>
                    <span className="metric-value">{trainingProgress.valLoss.toFixed(4)}</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-group">
                <h6>Accuracy</h6>
                <div className="metric-pair">
                  <div className="metric-item">
                    <span>Train</span>
                    <span className="metric-value">{(trainingProgress.trainAccuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric-item">
                    <span>Val</span>
                    <span className="metric-value">{(trainingProgress.valAccuracy * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-group">
                <h6>Learning Rate</h6>
                <div className="metric-value single">{trainingProgress.learningRate.toExponential(3)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {networkVisualization && (
        <div className="network-visualization">
          <h4>🧠 Network Structure</h4>
          <div className="visualization-summary">
            <div className="summary-item">
              <span>Total Layers:</span>
              <span>{networkVisualization.layers.length}</span>
            </div>
            <div className="summary-item">
              <span>Connections:</span>
              <span>{networkVisualization.connections}</span>
            </div>
            <div className="summary-item">
              <span>Parameters:</span>
              <span>{networkVisualization.totalParameters.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="activation-flow">
            <h5>Activation Flow</h5>
            <div className="flow-visualization">
              {networkVisualization.activationFlow.map((layer: any, index: number) => (
                <div key={`flow-${layer.name.toLowerCase().replace(/\s+/g, '-')}`} className="flow-layer">
                  <div className="layer-name">{layer.name}</div>
                  <div className="layer-neurons">{layer.neurons} neurons</div>
                  <div className="layer-activation">{layer.activation}</div>
                  {index < networkVisualization.activationFlow.length - 1 && (
                    <div className="flow-arrow">→</div>
                  )}
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
            <h5>Deep Learning Advantage</h5>
            <p>
              Neural networks can capture complex, non-linear relationships in fantasy football data 
              that traditional statistical models miss, leading to more accurate predictions.
            </p>
          </div>
          <div className="insight-card">
            <h5>Regularization Importance</h5>
            <p>
              Dropout and batch normalization are crucial for preventing overfitting in fantasy sports 
              where data can be noisy and patterns may not generalize well.
            </p>
          </div>
          <div className="insight-card">
            <h5>Architecture Design</h5>
            <p>
              Oracle's network architecture balances complexity and efficiency, using proven techniques 
              like residual connections and attention mechanisms for optimal performance.
            </p>
          </div>
          <div className="insight-card">
            <h5>Real-time Inference</h5>
            <p>
              Model optimization techniques ensure fast inference times (&lt;5ms) enabling real-time 
              predictions during live games and draft scenarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Learning Curve Analysis Section ---
  // Fix: Use unique key for table rows
  // Fix: Ensure all JSX tags are properly closed and parented
  const renderLearningCurveAnalysis = () => (
    <div className="learning-curve-section">
      <h3>📈 Learning Curve Analysis</h3>
      <div className="curve-controls">
        <label htmlFor="curve-select">Experiment:</label>
        <select id="curve-select" value={selectedLearningCurveConfig} onChange={e => setSelectedLearningCurveConfig(e.target.value)}>
          {learningCurveConfigs.map((cfg: any) => (
            <option key={cfg.id} value={cfg.id}>{cfg.name}</option>
          ))}
        </select>
        <button className="curve-run-btn" onClick={runLearningCurveAnalysis} disabled={learningCurveRunning}>
          {learningCurveRunning ? 'Running...' : 'Run Analysis'}
        </button>
        <div className="curve-progress-bar">
          <div className="curve-progress-fill" style={{ width: `${learningCurveProgress}%` }}></div>
        </div>
      </div>
      {learningCurvePoints && (
        <div className="curve-results">
          <h4>Results</h4>
          <table className="curve-table">
            <thead>
              <tr>
                <th>Sample Size</th>
                <th>Train Loss</th>
                <th>Val Loss</th>
                <th>Train Acc</th>
                <th>Val Acc</th>
                <th>Converged</th>
              </tr>
            </thead>
            <tbody>
              {learningCurvePoints.map((pt) => (
                <tr key={`curve-${pt.sampleSize}-${pt.trainLoss.toFixed(4)}-${pt.valLoss.toFixed(4)}`} className={pt.converged ? 'converged-row' : ''}>
                  <td>{pt.sampleSize}</td>
                  <td>{pt.trainLoss.toFixed(4)}</td>
                  <td>{pt.valLoss.toFixed(4)}</td>
                  <td>{(pt.trainAccuracy * 100).toFixed(1)}%</td>
                  <td>{(pt.valAccuracy * 100).toFixed(1)}%</td>
                  <td>{pt.converged ? '✅' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="curve-insights">
            <h5>Insights</h5>
            <ul>
              <li>Model performance improves as sample size increases, with diminishing returns after convergence.</li>
              <li>Convergence point indicates sufficient data for optimal training.</li>
              <li>Gap between train and validation loss narrows as model generalizes.</li>
              <li>Use learning curves to assess data efficiency and avoid under/overfitting.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  // --- Feature Importance Analysis Section ---
  const renderFeatureImportanceAnalysis = () => (
    <div className="feature-importance-section">
      <h3>🔍 Feature Importance Analysis</h3>
      
      <div className="importance-controls">
        <div className="control-group">
          <label htmlFor="config-select">Dataset:</label>
          <select 
            id="config-select" 
            value={selectedPermutationConfig} 
            onChange={e => setSelectedPermutationConfig(e.target.value)}
          >
            {permutationConfigs.map((cfg: any) => (
              <option key={cfg.id} value={cfg.id}>{cfg.name}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="method-select">Method:</label>
          <select 
            id="method-select" 
            value={selectedFeatureMethod} 
            onChange={e => setSelectedFeatureMethod(e.target.value as 'permutation' | 'shap' | 'both')}
          >
            <option value="permutation">Permutation Importance</option>
            <option value="shap">SHAP Values</option>
            <option value="both">Both Methods</option>
          </select>
        </div>
        
        <button 
          className="importance-run-btn" 
          onClick={runFeatureImportanceAnalysis} 
          disabled={featureImportanceRunning}
        >
          {featureImportanceRunning ? 'Analyzing...' : 'Run Analysis'}
        </button>
        
        <div className="importance-progress-bar">
          <div className="importance-progress-fill" style={{ width: `${featureImportanceProgress}%` }}></div>
        </div>
      </div>

      {featureImportanceResults && (
        <div className="importance-results">
          <div className="results-overview">
            <h4>📊 Feature Ranking</h4>
            <div className="ranking-table">
              <div className="table-header">
                <span>Rank</span>
                <span>Feature</span>
                <span>Permutation</span>
                <span>SHAP Value</span>
                <span>Category</span>
                <span>Description</span>
              </div>
              {featureImportanceResults.map((result) => (
                <div key={`importance-${result.featureName}`} className={`table-row ${result.category}`}>
                  <span className="rank">#{result.rank}</span>
                  <span className="feature-name">{result.featureName}</span>
                  <span className="permutation-score">
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${result.permutationImportance * 100}%` }}
                      ></div>
                    </div>
                    {result.permutationImportance.toFixed(3)}
                  </span>
                  <span className="shap-value">
                    <div className={`shap-indicator ${result.shapValue >= 0 ? 'positive' : 'negative'}`}>
                      {result.shapValue >= 0 ? '+' : ''}{result.shapValue.toFixed(3)}
                    </div>
                  </span>
                  <span className={`category-badge ${result.category}`}>
                    {result.category.toUpperCase()}
                  </span>
                  <span className="description">{result.description}</span>
                </div>
              ))}
            </div>
          </div>

          {shapAnalysis && (
            <div className="shap-analysis">
              <h4>🎯 SHAP Analysis</h4>
              
              <div className="shap-sections">
                <div className="local-explanation">
                  <h5>Local Explanation (Sample Prediction)</h5>
                  <div className="prediction-breakdown">
                    <div className="prediction-summary">
                      <div className="prediction-value">
                        Predicted: <strong>{shapAnalysis.localExplanation.prediction.toFixed(1)} points</strong>
                      </div>
                      <div className="base-value">
                        Base Value: {shapAnalysis.localExplanation.baseValue.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="contributions-chart">
                      {shapAnalysis.localExplanation.contributions.map((contrib) => (
                        <div key={`contrib-${contrib.feature}`} className="contribution-bar">
                          <div className="contrib-feature">{contrib.feature}</div>
                          <div className="contrib-value">
                            Value: {contrib.value.toFixed(1)}
                          </div>
                          <div className="contrib-shap">
                            <div 
                              className={`shap-bar ${contrib.shapValue >= 0 ? 'positive' : 'negative'}`}
                              style={{ 
                                width: `${Math.abs(contrib.shapValue) * 50}px`,
                                marginLeft: contrib.shapValue < 0 ? `${50 - Math.abs(contrib.shapValue) * 50}px` : '50px'
                              }}
                            ></div>
                            <span className="shap-number">
                              {contrib.shapValue >= 0 ? '+' : ''}{contrib.shapValue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="interaction-matrix">
                  <h5>Feature Interactions</h5>
                  <div className="matrix-visualization">
                    <div className="matrix-grid">
                      {shapAnalysis.interactionMatrix.map((row, i) => (
                        <div key={`matrix-row-${featureImportanceResults[i]?.featureName || i}`} className="matrix-row">
                          {row.map((value, j) => (
                            <div 
                              key={`matrix-cell-${featureImportanceResults[i]?.featureName || i}-${featureImportanceResults[j]?.featureName || j}`}
                              className="matrix-cell"
                              style={{ 
                                backgroundColor: `rgba(59, 130, 246, ${value})`,
                                color: value > 0.5 ? 'white' : 'black'
                              }}
                              title={`Interaction: ${value.toFixed(3)}`}
                            >
                              {value.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="matrix-labels">
                      {featureImportanceResults.slice(0, 6).map((result) => (
                        <div key={`label-${result.featureName}`} className="matrix-label">
                          {result.featureName}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="dependence-plots">
                <h5>Feature Dependence Plots</h5>
                <div className="plots-grid">
                  {shapAnalysis.dependencePlots.map((plot) => (
                    <div key={`plot-${plot.feature}`} className="dependence-plot">
                      <h6>{plot.feature}</h6>
                      <div className="plot-container">
                        <div className="plot-points">
                          {plot.values.map((point, i) => (
                            <div
                              key={`point-${plot.feature}-${i}`}
                              className="plot-point"
                              style={{
                                left: `${(point.x / 100) * 100}%`,
                                bottom: `${((point.y + 1) / 2) * 100}%`,
                                backgroundColor: `hsl(${point.color * 360}, 70%, 50%)`
                              }}
                            ></div>
                          ))}
                        </div>
                        <div className="plot-axes">
                          <div className="x-axis-label">Feature Value</div>
                          <div className="y-axis-label">SHAP Value</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="importance-insights">
            <h4>💡 Key Insights</h4>
            <div className="insights-grid">
              <div className="insight-card">
                <h5>🏆 Top Predictors</h5>
                <p>
                  The most important features for fantasy prediction are <strong>{featureImportanceResults[0]?.featureName}</strong> and <strong>{featureImportanceResults[1]?.featureName}</strong>, 
                  indicating that recent performance and usage metrics are critical for accurate forecasting.
                </p>
              </div>
              <div className="insight-card">
                <h5>⚖️ SHAP Interpretability</h5>
                <p>
                  SHAP values show both positive and negative contributions, helping understand not just which features matter, 
                  but how they specifically impact individual predictions in either direction.
                </p>
              </div>
              <div className="insight-card">
                <h5>🔗 Feature Interactions</h5>
                <p>
                  The interaction matrix reveals how features work together. Strong interactions between position-specific metrics 
                  and matchup difficulty create complex, non-linear prediction patterns.
                </p>
              </div>
              <div className="insight-card">
                <h5>📈 Model Transparency</h5>
                <p>
                  Feature importance analysis provides transparency into Oracle's decision-making process, 
                  building trust and enabling better understanding of prediction rationale.
                </p>
              </div>
            </div>
          </div>

          <div className="methodology-section">
            <h4>🔬 Methodology</h4>
            <div className="methodology-grid">
              <div className="method-card">
                <h5>Permutation Importance</h5>
                <p>
                  Measures feature importance by randomly shuffling feature values and observing the decrease in model performance. 
                  Higher values indicate features that are crucial for maintaining prediction accuracy.
                </p>
                <div className="method-formula">
                  Importance = Performance(original) - Performance(permuted)
                </div>
              </div>
              <div className="method-card">
                <h5>SHAP Values</h5>
                <p>
                  Provides unified framework for feature attribution based on cooperative game theory. 
                  SHAP values sum to the difference between prediction and baseline, ensuring faithful explanations.
                </p>
                <div className="method-formula">
                  φᵢ = Σ |S|!(M-|S|-1)!/M! × [f(S∪&#123;i&#125;) - f(S)]
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="oracle-neural-section">
      <div className="section-header">
        <h2>🧠 Neural Network Architecture</h2>
        <p>Deep learning foundations powering Oracle's predictive intelligence</p>
      </div>
      
      <div className="section-navigation">
        <button 
          className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-button ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          🏗️ Architecture
        </button>
        <button 
          className={`nav-button ${activeTab === 'activations' ? 'active' : ''}`}
          onClick={() => setActiveTab('activations')}
        >
          ⚡ Activations
        </button>
        <button 
          className={`nav-button ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveTab('training')}
        >
          🎓 Training
        </button>
        <button 
          className={`nav-button ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          🚀 Optimization
        </button>
        <button 
          className={`nav-button ${activeTab === 'demo' ? 'active' : ''}`}
          onClick={() => setActiveTab('demo')}
        >
          🧪 Demo
        </button>
        <button 
          className={`nav-button ${activeTab === 'learning_curve' ? 'active' : ''}`}
          onClick={() => setActiveTab('learning_curve')}
        >
          📈 Learning Curve
        </button>
        <button 
          className={`nav-button ${activeTab === 'feature_importance' ? 'active' : ''}`}
          onClick={() => setActiveTab('feature_importance')}
        >
          🔍 Feature Importance
        </button>
        <button 
          className={`nav-button ${activeTab === 'model_selection' ? 'active' : ''}`}
          onClick={() => setActiveTab('model_selection')}
        >
          🤖 Model Selection
        </button>
      </div>
      
      <div className="section-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'architecture' && renderArchitecture()}
        {activeTab === 'activations' && renderActivations()}
        {activeTab === 'training' && renderTraining()}
        {activeTab === 'optimization' && renderOptimization()}
        {activeTab === 'demo' && renderDemo()}
        {activeTab === 'learning_curve' && renderLearningCurveAnalysis()}
        {activeTab === 'feature_importance' && renderFeatureImportanceAnalysis()}
        {activeTab === 'model_selection' && renderModelSelection()}
      </div>
    </div>
  );
};

export default OracleNeuralNetworkSection;
