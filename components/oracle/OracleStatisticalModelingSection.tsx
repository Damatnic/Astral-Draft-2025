import React, { useState, useEffect } from 'react';
import './OracleStatisticalModelingSection.css';

interface StatisticalModel {
  id: string;
  name: string;
  category: 'regression' | 'classification' | 'bayesian' | 'ensemble' | 'probability';
  description: string;
  formula: string;
  applications: string[];
  assumptions: string[];
  accuracy: number;
  complexity: 'low' | 'medium' | 'high';
  interpretability: number; // 0-100
}

interface ProbabilityDistribution {
  id: string;
  name: string;
  type: 'continuous' | 'discrete';
  formula: string;
  description: string;
  parameters: string[];
  applications: string[];
  examples: DistributionExample[];
  cdf?: string;
  mean?: string;
  variance?: string;
}

interface DistributionExample {
  scenario: string;
  parameters: Record<string, number>;
  visualization: number[];
  interpretation: string;
}

interface BayesianComponent {
  id: string;
  name: string;
  type: 'prior' | 'likelihood' | 'posterior' | 'evidence';
  description: string;
  formula: string;
  role: string;
  examples: string[];
}

interface ConfidenceMethod {
  id: string;
  name: string;
  category: 'frequentist' | 'bayesian' | 'bootstrap' | 'ensemble';
  description: string;
  formula: string;
  advantages: string[];
  limitations: string[];
  accuracy: number;
  computationalCost: 'low' | 'medium' | 'high';
}

interface StatisticalDemo {
  id: string;
  name: string;
  type: 'calculation' | 'simulation' | 'comparison' | 'prediction';
  description: string;
  inputData: Record<string, any>;
  steps: DemoStep[];
  result: any;
  interpretation: string;
}

interface DemoStep {
  id: string;
  title: string;
  description: string;
  calculation: string;
  result: string | number;
  explanation: string;
}

const OracleStatisticalModelingSection: React.FC = () => {
  const [activeModel, setActiveModel] = useState<string>('linear-regression');
  const [activeDistribution, setActiveDistribution] = useState<string>('normal');
  const [activeBayesian, setActiveBayesian] = useState<string>('bayes-theorem');
  const [activeConfidence, setActiveConfidence] = useState<string>('confidence-intervals');
  const [activeDemo, setActiveDemo] = useState<string>('player-performance-prediction');
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(0);

  const statisticalModels: StatisticalModel[] = [
    {
      id: 'linear-regression',
      name: 'Linear Regression',
      category: 'regression',
      description: 'Fundamental model for predicting continuous outcomes based on linear relationships between features',
      formula: 'y = β₀ + β₁x₁ + β₂x₂ + ... + βₚxₚ + ε',
      applications: ['Player point predictions', 'Team scoring projections', 'Season performance trends'],
      assumptions: ['Linear relationship', 'Independence of residuals', 'Homoscedasticity', 'Normal distribution of errors'],
      accuracy: 78,
      complexity: 'low',
      interpretability: 95
    },
    {
      id: 'logistic-regression',
      name: 'Logistic Regression',
      category: 'classification',
      description: 'Classification model for binary and multinomial outcomes using logistic function',
      formula: 'P(y=1) = 1 / (1 + e^(-z)), where z = β₀ + β₁x₁ + ... + βₚxₚ',
      applications: ['Win/loss predictions', 'Injury risk classification', 'Over/under outcomes'],
      assumptions: ['Log-linear relationship', 'Independence of observations', 'No multicollinearity'],
      accuracy: 82,
      complexity: 'medium',
      interpretability: 85
    },
    {
      id: 'poisson-regression',
      name: 'Poisson Regression',
      category: 'regression',
      description: 'Specialized model for count data like touchdowns, field goals, and scoring events',
      formula: 'log(λ) = β₀ + β₁x₁ + β₂x₂ + ... + βₚxₚ',
      applications: ['Touchdown predictions', 'Field goal counts', 'Turnover frequencies'],
      assumptions: ['Count data', 'Log-linear relationship', 'Equidispersion (mean = variance)'],
      accuracy: 75,
      complexity: 'medium',
      interpretability: 80
    },
    {
      id: 'ridge-regression',
      name: 'Ridge Regression (L2 Regularization)',
      category: 'regression',
      description: 'Regularized regression preventing overfitting with penalty on coefficient magnitudes',
      formula: 'Loss = MSE + λ∑βᵢ²',
      applications: ['High-dimensional feature spaces', 'Multicollinearity handling', 'Stable predictions'],
      assumptions: ['Linear relationship', 'Feature scaling beneficial', 'Regularization parameter tuning'],
      accuracy: 81,
      complexity: 'medium',
      interpretability: 75
    },
    {
      id: 'lasso-regression',
      name: 'LASSO Regression (L1 Regularization)',
      category: 'regression',
      description: 'Feature selection regression using L1 penalty to drive coefficients to zero',
      formula: 'Loss = MSE + λ∑|βᵢ|',
      applications: ['Feature selection', 'Sparse model creation', 'Automated variable selection'],
      assumptions: ['Linear relationship', 'Sparsity assumption', 'Cross-validation for λ'],
      accuracy: 80,
      complexity: 'medium',
      interpretability: 85
    },
    {
      id: 'random-forest',
      name: 'Random Forest',
      category: 'ensemble',
      description: 'Ensemble of decision trees with bootstrap aggregating for robust predictions',
      formula: 'ŷ = (1/B)∑ᵇ₌₁ᴮ Tᵦ(x), where Tᵦ is tree b trained on bootstrap sample',
      applications: ['Non-linear patterns', 'Feature importance ranking', 'Robust predictions'],
      assumptions: ['No distributional assumptions', 'Handles mixed data types', 'Resistant to outliers'],
      accuracy: 85,
      complexity: 'high',
      interpretability: 60
    },
    {
      id: 'gradient-boosting',
      name: 'Gradient Boosting',
      category: 'ensemble',
      description: 'Sequential ensemble building models to correct previous model errors',
      formula: 'Fₘ(x) = Fₘ₋₁(x) + γₘhₘ(x), where hₘ fits residuals',
      applications: ['Complex pattern recognition', 'High accuracy predictions', 'Competition-grade models'],
      assumptions: ['Sequential improvement', 'Learning rate optimization', 'Overfitting prevention'],
      accuracy: 88,
      complexity: 'high',
      interpretability: 45
    },
    {
      id: 'bayesian-regression',
      name: 'Bayesian Regression',
      category: 'bayesian',
      description: 'Probabilistic regression incorporating prior beliefs and uncertainty quantification',
      formula: 'p(β|D) ∝ p(D|β)p(β), where D is data and β are parameters',
      applications: ['Uncertainty quantification', 'Prior knowledge incorporation', 'Confidence intervals'],
      assumptions: ['Prior distribution specification', 'Posterior computability', 'MCMC convergence'],
      accuracy: 83,
      complexity: 'high',
      interpretability: 70
    }
  ];

  const probabilityDistributions: ProbabilityDistribution[] = [
    {
      id: 'normal',
      name: 'Normal (Gaussian) Distribution',
      type: 'continuous',
      formula: 'f(x) = (1/√(2πσ²)) × e^(-(x-μ)²/(2σ²))',
      description: 'Bell-shaped continuous distribution fundamental to many statistical methods',
      parameters: ['μ (mean)', 'σ² (variance)'],
      applications: ['Player performance scores', 'Error terms', 'Confidence intervals'],
      mean: 'μ',
      variance: 'σ²',
      cdf: 'Φ((x-μ)/σ)',
      examples: [
        {
          scenario: 'QB Fantasy Points',
          parameters: { mean: 22.5, variance: 6.25 },
          visualization: [0.02, 0.05, 0.12, 0.24, 0.35, 0.24, 0.12, 0.05, 0.02],
          interpretation: 'Most QB performances cluster around 22.5 points with 68% falling within ±2.5 points'
        },
        {
          scenario: 'Prediction Errors',
          parameters: { mean: 0, variance: 4 },
          visualization: [0.01, 0.04, 0.15, 0.30, 0.50, 0.30, 0.15, 0.04, 0.01],
          interpretation: 'Model errors are centered at zero with most predictions within ±2 points of actual'
        }
      ]
    },
    {
      id: 'binomial',
      name: 'Binomial Distribution',
      type: 'discrete',
      formula: 'P(X = k) = C(n,k) × p^k × (1-p)^(n-k)',
      description: 'Distribution of successes in fixed number of independent trials',
      parameters: ['n (trials)', 'p (success probability)'],
      applications: ['Win/loss records', 'Touchdown probabilities', 'Binary outcome predictions'],
      mean: 'np',
      variance: 'np(1-p)',
      examples: [
        {
          scenario: 'Team Wins in 16 Games',
          parameters: { n: 16, p: 0.625 },
          visualization: [0.0, 0.01, 0.04, 0.08, 0.15, 0.20, 0.23, 0.18, 0.11],
          interpretation: 'Team with 62.5% win probability expected to win 10 games (±2 games typical range)'
        },
        {
          scenario: 'Red Zone Touchdowns',
          parameters: { n: 20, p: 0.65 },
          visualization: [0.0, 0.0, 0.01, 0.04, 0.09, 0.16, 0.22, 0.23, 0.17, 0.08],
          interpretation: '20 red zone trips with 65% TD rate yields ~13 touchdowns typically'
        }
      ]
    },
    {
      id: 'poisson',
      name: 'Poisson Distribution',
      type: 'discrete',
      formula: 'P(X = k) = (λ^k × e^(-λ)) / k!',
      description: 'Distribution of rare events occurring at constant average rate',
      parameters: ['λ (rate parameter)'],
      applications: ['Scoring events per game', 'Injury occurrences', 'Turnover frequencies'],
      mean: 'λ',
      variance: 'λ',
      examples: [
        {
          scenario: 'Touchdowns per Game',
          parameters: { lambda: 2.8 },
          visualization: [0.06, 0.17, 0.24, 0.22, 0.15, 0.09, 0.04, 0.02, 0.01],
          interpretation: 'Team averages 2.8 TDs per game, with 2-3 TDs being most likely outcomes'
        },
        {
          scenario: 'Player Injuries per Season',
          parameters: { lambda: 1.2 },
          visualization: [0.30, 0.36, 0.22, 0.09, 0.03, 0.01, 0.0, 0.0, 0.0],
          interpretation: 'Player experiences ~1.2 injuries per season, 0-1 injuries most common'
        }
      ]
    },
    {
      id: 'beta',
      name: 'Beta Distribution',
      type: 'continuous',
      formula: 'f(x) = (x^(α-1) × (1-x)^(β-1)) / B(α,β), x ∈ [0,1]',
      description: 'Flexible distribution for probabilities and proportions bounded between 0 and 1',
      parameters: ['α (shape 1)', 'β (shape 2)'],
      applications: ['Success probabilities', 'Completion percentages', 'Efficiency ratings'],
      mean: 'α/(α+β)',
      variance: 'αβ/((α+β)²(α+β+1))',
      examples: [
        {
          scenario: 'Passing Completion Rate',
          parameters: { alpha: 32, beta: 8 },
          visualization: [0.0, 0.0, 0.02, 0.08, 0.18, 0.28, 0.25, 0.15, 0.04],
          interpretation: 'QB with 80% completion rate (32 successes, 8 failures) with tight confidence'
        },
        {
          scenario: 'Field Goal Success Rate',
          parameters: { alpha: 27, beta: 3 },
          visualization: [0.0, 0.0, 0.0, 0.01, 0.04, 0.12, 0.25, 0.35, 0.23],
          interpretation: 'Kicker with 90% success rate showing high reliability in range'
        }
      ]
    },
    {
      id: 'gamma',
      name: 'Gamma Distribution',
      type: 'continuous',
      formula: 'f(x) = (β^α/Γ(α)) × x^(α-1) × e^(-βx), x > 0',
      description: 'Versatile distribution for positive continuous values with skewed shape',
      parameters: ['α (shape)', 'β (rate)'],
      applications: ['Time to events', 'Performance streaks', 'Waiting times'],
      mean: 'α/β',
      variance: 'α/β²',
      examples: [
        {
          scenario: 'Time Between Touchdowns',
          parameters: { alpha: 2, beta: 0.5 },
          visualization: [0.25, 0.30, 0.20, 0.12, 0.07, 0.04, 0.02, 0.0, 0.0],
          interpretation: 'Average 4 minutes between TDs, with exponential decay for longer intervals'
        }
      ]
    },
    {
      id: 'student-t',
      name: 'Student\'s t-Distribution',
      type: 'continuous',
      formula: 'f(x) = Γ((ν+1)/2) / (√(νπ)Γ(ν/2)) × (1 + x²/ν)^(-(ν+1)/2)',
      description: 'Heavy-tailed distribution used for small sample inference and robust modeling',
      parameters: ['ν (degrees of freedom)'],
      applications: ['Small sample confidence intervals', 'Robust regression', 'Outlier modeling'],
      mean: '0 (for ν > 1)',
      variance: 'ν/(ν-2) (for ν > 2)',
      examples: [
        {
          scenario: 'Small Sample Player Analysis',
          parameters: { nu: 5 },
          visualization: [0.02, 0.06, 0.15, 0.25, 0.35, 0.25, 0.15, 0.06, 0.02],
          interpretation: 'With only 5 games, wider confidence intervals account for uncertainty'
        }
      ]
    }
  ];

  const bayesianComponents: BayesianComponent[] = [
    {
      id: 'bayes-theorem',
      name: 'Bayes\' Theorem',
      type: 'evidence',
      description: 'Fundamental theorem for updating probabilities with new evidence',
      formula: 'P(H|E) = P(E|H) × P(H) / P(E)',
      role: 'Foundation for all Bayesian inference and probability updating',
      examples: [
        'Update player injury probability with medical reports',
        'Revise team win probability with roster changes',
        'Adjust weather impact estimates with forecast updates'
      ]
    },
    {
      id: 'prior-distribution',
      name: 'Prior Distribution',
      type: 'prior',
      description: 'Initial beliefs about parameters before observing data',
      formula: 'p(θ) - represents knowledge before data collection',
      role: 'Incorporates domain expertise and historical knowledge into models',
      examples: [
        'Historical team performance as starting point',
        'Expert opinions on player capabilities',
        'League-wide statistical patterns as baseline'
      ]
    },
    {
      id: 'likelihood-function',
      name: 'Likelihood Function',
      type: 'likelihood',
      description: 'Probability of observed data given parameter values',
      formula: 'L(θ|data) = p(data|θ)',
      role: 'Quantifies how well parameters explain observed data',
      examples: [
        'How well do QB stats explain team wins?',
        'Probability of observed scores given player projections',
        'Likelihood of weather affecting game outcomes'
      ]
    },
    {
      id: 'posterior-distribution',
      name: 'Posterior Distribution',
      type: 'posterior',
      description: 'Updated beliefs after incorporating new data via Bayes\' theorem',
      formula: 'p(θ|data) ∝ p(data|θ) × p(θ)',
      role: 'Combines prior knowledge with data evidence for refined estimates',
      examples: [
        'Updated player projections after recent games',
        'Revised team strength after key injuries',
        'Adjusted weather impact after historical analysis'
      ]
    },
    {
      id: 'marginal-likelihood',
      name: 'Marginal Likelihood (Evidence)',
      type: 'evidence',
      description: 'Total probability of data across all possible parameter values',
      formula: 'p(data) = ∫ p(data|θ) × p(θ) dθ',
      role: 'Normalizing constant for posterior and model comparison metric',
      examples: [
        'Model selection between different prediction approaches',
        'Evidence for including specific features',
        'Comparing team strength models'
      ]
    },
    {
      id: 'conjugate-priors',
      name: 'Conjugate Priors',
      type: 'prior',
      description: 'Prior distributions that yield posterior in same family after updating',
      formula: 'If p(θ) ~ Family, then p(θ|data) ~ Family with updated parameters',
      role: 'Enable analytical solutions without numerical integration',
      examples: [
        'Beta prior for completion percentages yields beta posterior',
        'Normal prior for player means yields normal posterior',
        'Gamma prior for rate parameters yields gamma posterior'
      ]
    }
  ];

  const confidenceMethods: ConfidenceMethod[] = [
    {
      id: 'confidence-intervals',
      name: 'Confidence Intervals',
      category: 'frequentist',
      description: 'Range of values containing true parameter with specified probability',
      formula: '95% CI: θ̂ ± 1.96 × SE(θ̂)',
      advantages: ['Well-established interpretation', 'Wide applicability', 'Standard in research'],
      limitations: ['Frequentist interpretation', 'Fixed parameter assumption', 'No prior incorporation'],
      accuracy: 85,
      computationalCost: 'low'
    },
    {
      id: 'prediction-intervals',
      name: 'Prediction Intervals',
      category: 'frequentist',
      description: 'Range for future individual observations rather than parameter estimates',
      formula: 'PI: ŷ ± t_{α/2} × √(MSE × (1 + 1/n + (x-x̄)²/Σ(xᵢ-x̄)²))',
      advantages: ['Accounts for prediction uncertainty', 'Realistic ranges', 'Practical application'],
      limitations: ['Wider than confidence intervals', 'Normality assumptions', 'Homoscedasticity required'],
      accuracy: 80,
      computationalCost: 'low'
    },
    {
      id: 'bootstrap-confidence',
      name: 'Bootstrap Confidence Intervals',
      category: 'bootstrap',
      description: 'Resampling-based confidence intervals without distributional assumptions',
      formula: 'Resample data B times, calculate statistic for each, use percentiles',
      advantages: ['Distribution-free', 'Handles complex statistics', 'Robust to outliers'],
      limitations: ['Computationally intensive', 'Sample size dependent', 'Bootstrap assumptions'],
      accuracy: 88,
      computationalCost: 'high'
    },
    {
      id: 'bayesian-credible',
      name: 'Bayesian Credible Intervals',
      category: 'bayesian',
      description: 'Range containing parameter with specified posterior probability',
      formula: 'P(θ ∈ [a,b] | data) = 0.95',
      advantages: ['Direct probability interpretation', 'Prior incorporation', 'Natural uncertainty quantification'],
      limitations: ['Prior sensitivity', 'Computational complexity', 'Subjective priors'],
      accuracy: 90,
      computationalCost: 'high'
    },
    {
      id: 'ensemble-uncertainty',
      name: 'Ensemble Uncertainty',
      category: 'ensemble',
      description: 'Uncertainty estimation from multiple model predictions',
      formula: 'Var(ŷ) = (1/M)Σ(ŷᵢ - ȳ)², where M is number of models',
      advantages: ['Model uncertainty capture', 'Robust to individual model failures', 'Practical implementation'],
      limitations: ['Model correlation issues', 'Computational overhead', 'Interpretation complexity'],
      accuracy: 87,
      computationalCost: 'medium'
    },
    {
      id: 'quantile-regression',
      name: 'Quantile Regression Intervals',
      category: 'frequentist',
      description: 'Model different quantiles to create prediction intervals',
      formula: 'Model Q₀.₀₂₅(y|x) and Q₀.₉₇₅(y|x) for 95% interval',
      advantages: ['Distribution-free', 'Handles heteroscedasticity', 'Asymmetric intervals'],
      limitations: ['Crossing quantiles possible', 'Limited software support', 'Interpretation complexity'],
      accuracy: 83,
      computationalCost: 'medium'
    }
  ];

  const statisticalDemos: StatisticalDemo[] = [
    {
      id: 'player-performance-prediction',
      name: 'Player Performance Prediction',
      type: 'prediction',
      description: 'Comprehensive statistical modeling of QB fantasy points using multiple approaches',
      inputData: {
        player: 'Josh Allen',
        position: 'QB',
        recentGames: [24.7, 31.2, 18.4, 42.1, 28.5],
        opponent: 'Miami Dolphins',
        oppDefRank: 18,
        weather: 'Clear',
        homeAway: 'Home',
        restDays: 7
      },
      steps: [
        {
          id: 'step-1',
          title: 'Data Preparation',
          description: 'Calculate relevant statistics from recent performance data',
          calculation: 'Mean = (24.7 + 31.2 + 18.4 + 42.1 + 28.5) / 5',
          result: 28.98,
          explanation: 'Recent 5-game average provides baseline performance estimate'
        },
        {
          id: 'step-2',
          title: 'Linear Regression Model',
          description: 'Apply linear regression with opponent defensive rank adjustment',
          calculation: 'ŷ = 28.98 + β₁(DefRank-16) + β₂(Home) + ε',
          result: 26.3,
          explanation: 'Opponent defense strength reduces projection by 2.7 points'
        },
        {
          id: 'step-3',
          title: 'Bayesian Update',
          description: 'Incorporate prior beliefs about QB performance at home',
          calculation: 'Posterior = (Likelihood × Prior) / Evidence',
          result: 27.1,
          explanation: 'Home field advantage increases estimate by 0.8 points'
        },
        {
          id: 'step-4',
          title: 'Confidence Interval',
          description: 'Calculate 95% confidence interval using bootstrap resampling',
          calculation: '95% CI = ŷ ± 1.96 × SE(ŷ)',
          result: '[22.4, 31.8]',
          explanation: 'Model predicts 27.1 points with 95% confidence range of ±4.7 points'
        },
        {
          id: 'step-5',
          title: 'Probability Distributions',
          description: 'Model performance using normal distribution for outcome probabilities',
          calculation: 'P(>30 pts) = 1 - Φ((30-27.1)/2.4)',
          result: 0.227,
          explanation: '22.7% probability of exceeding 30 fantasy points'
        }
      ],
      result: {
        prediction: 27.1,
        confidenceInterval: [22.4, 31.8],
        probabilities: {
          'under20': 0.15,
          '20to25': 0.23,
          '25to30': 0.40,
          'over30': 0.22
        }
      },
      interpretation: 'Statistical models converge on 27.1 point prediction with moderate confidence. Bayesian approach provides slight upward adjustment for home field advantage. Bootstrap confidence intervals account for recent performance variability.'
    },
    {
      id: 'team-scoring-model',
      name: 'Team Total Scoring Model',
      type: 'prediction',
      description: 'Poisson regression model for predicting total game points',
      inputData: {
        homeTeam: 'Buffalo Bills',
        awayTeam: 'Miami Dolphins',
        homeOffRank: 3,
        awayOffRank: 12,
        homeDefRank: 8,
        awayDefRank: 15,
        weather: 'Clear',
        total: 47.5
      },
      steps: [
        {
          id: 'poisson-1',
          title: 'Home Team Scoring Rate',
          description: 'Calculate expected home team points using Poisson model',
          calculation: 'log(λ_home) = β₀ + β₁(OffRank) + β₂(OppDefRank)',
          result: 2.73,
          explanation: 'Home team expected to score ~15.3 points (e^2.73)'
        },
        {
          id: 'poisson-2',
          title: 'Away Team Scoring Rate',
          description: 'Calculate expected away team points with road penalty',
          calculation: 'log(λ_away) = β₀ + β₁(OffRank) + β₂(OppDefRank) - 0.15',
          result: 2.48,
          explanation: 'Away team expected to score ~12.0 points (e^2.48)'
        },
        {
          id: 'poisson-3',
          title: 'Total Points Distribution',
          description: 'Sum of independent Poisson variables follows Poisson distribution',
          calculation: 'λ_total = λ_home + λ_away = 15.3 + 12.0',
          result: 27.3,
          explanation: 'Expected total of 27.3 points from both teams combined'
        },
        {
          id: 'poisson-4',
          title: 'Over/Under Probability',
          description: 'Calculate probability of exceeding betting total using CDF',
          calculation: 'P(Total > 47.5) = 1 - P(Poisson(27.3) ≤ 47)',
          result: 0.02,
          explanation: 'Only 2% chance of exceeding 47.5 points - strong Under indication'
        }
      ],
      result: {
        homeScore: 15.3,
        awayScore: 12.0,
        totalPoints: 27.3,
        overProbability: 0.02,
        recommendation: 'Strong Under play'
      },
      interpretation: 'Poisson regression model suggests significantly lower scoring than market expects. Both teams face above-average defenses, leading to conservative point estimates.'
    },
    {
      id: 'injury-impact-bayesian',
      name: 'Bayesian Injury Impact Analysis',
      type: 'calculation',
      description: 'Update team win probability based on key player injury report',
      inputData: {
        priorWinProb: 0.65,
        playerPosition: 'QB',
        injuryStatus: 'Questionable',
        playerImportance: 0.85,
        historicalData: {
          gamesWithPlayer: 12,
          winsWithPlayer: 9,
          gamesWithoutPlayer: 4,
          winsWithoutPlayer: 1
        }
      },
      steps: [
        {
          id: 'bayes-1',
          title: 'Prior Distribution',
          description: 'Establish prior belief about team strength',
          calculation: 'P(Win) ~ Beta(α=13, β=7) based on season record',
          result: 0.65,
          explanation: 'Prior win probability of 65% with moderate confidence'
        },
        {
          id: 'bayes-2',
          title: 'Likelihood Calculation',
          description: 'Calculate likelihood of injury impact based on historical data',
          calculation: 'P(Win|Available) = 9/12 = 0.75, P(Win|Unavailable) = 1/4 = 0.25',
          result: 0.5,
          explanation: 'Strong evidence that player availability affects win probability'
        },
        {
          id: 'bayes-3',
          title: 'Injury Probability',
          description: 'Estimate probability player misses game based on injury status',
          calculation: 'P(Miss|Questionable) = 0.35 based on historical "Questionable" outcomes',
          result: 0.35,
          explanation: '35% chance questionable player sits out the game'
        },
        {
          id: 'bayes-4',
          title: 'Updated Win Probability',
          description: 'Calculate expected win probability incorporating injury uncertainty',
          calculation: 'P(Win) = 0.65×0.75 + 0.35×0.25',
          result: 0.575,
          explanation: 'Win probability drops from 65% to 57.5% due to injury uncertainty'
        }
      ],
      result: {
        originalWinProb: 0.65,
        updatedWinProb: 0.575,
        impactMagnitude: -0.075,
        confidence: 0.82
      },
      interpretation: 'Bayesian analysis shows meaningful 7.5 percentage point decrease in win probability. The impact reflects both the player\'s importance and uncertainty around injury status.'
    },
    {
      id: 'confidence-comparison',
      name: 'Confidence Method Comparison',
      type: 'comparison',
      description: 'Compare different confidence estimation methods for same prediction',
      inputData: {
        prediction: 24.6,
        sampleSize: 16,
        standardError: 2.1,
        sampleData: [22.1, 26.3, 23.8, 25.9, 21.7, 27.2, 24.1, 23.5, 25.8, 22.9, 26.7, 24.3, 23.1, 25.4, 22.6, 26.1]
      },
      steps: [
        {
          id: 'conf-1',
          title: 'Classical Confidence Interval',
          description: 'Standard t-distribution based confidence interval',
          calculation: '95% CI = 24.6 ± 2.131 × 2.1',
          result: '[20.1, 29.1]',
          explanation: 'Traditional approach assuming normal distribution and known variance'
        },
        {
          id: 'conf-2',
          title: 'Bootstrap Confidence Interval',
          description: 'Resampling-based confidence interval (1000 bootstrap samples)',
          calculation: 'Percentile method: 2.5th and 97.5th percentiles of bootstrap distribution',
          result: '[20.3, 28.8]',
          explanation: 'Distribution-free approach slightly tighter due to empirical distribution'
        },
        {
          id: 'conf-3',
          title: 'Bayesian Credible Interval',
          description: 'Posterior distribution interval with non-informative prior',
          calculation: 'HPD interval from posterior t-distribution',
          result: '[20.0, 29.2]',
          explanation: 'Bayesian approach with direct probability interpretation'
        },
        {
          id: 'conf-4',
          title: 'Prediction Interval',
          description: 'Interval for future individual observation',
          calculation: 'PI = 24.6 ± 2.131 × √(2.1² + 4.41)',
          result: '[18.4, 30.8]',
          explanation: 'Wider interval accounting for both estimation and individual variability'
        }
      ],
      result: {
        methods: {
          'Classical CI': [20.1, 29.1],
          'Bootstrap CI': [20.3, 28.8],
          'Bayesian CI': [20.0, 29.2],
          'Prediction Interval': [18.4, 30.8]
        },
        recommendations: {
          'Parameter estimation': 'Classical CI',
          'Model-free inference': 'Bootstrap CI',
          'Prior incorporation': 'Bayesian CI',
          'Future prediction': 'Prediction Interval'
        }
      },
      interpretation: 'All confidence methods provide similar parameter intervals (~±4.5 points). Prediction intervals are wider for forecasting individuals. Bootstrap method shows slight efficiency gain from empirical distribution.'
    }
  ];

  useEffect(() => {
    if (isDemoRunning) {
      const interval = setInterval(() => {
        setDemoStep((prev) => {
          const currentDemo = statisticalDemos.find((d: any) => d.id === activeDemo);
          if (prev >= (currentDemo?.steps.length || 0) - 1) {
            setIsDemoRunning(false);
            return 0;
          }
          return prev + 1;
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isDemoRunning, activeDemo, statisticalDemos]);

  const startDemo = () => {
    setDemoStep(0);
    setIsDemoRunning(true);
  };

  const selectedModel = statisticalModels.find((model: any) => model.id === activeModel);
  const selectedDistribution = probabilityDistributions.find((dist: any) => dist.id === activeDistribution);
  const selectedBayesian = bayesianComponents.find((comp: any) => comp.id === activeBayesian);
  const selectedConfidence = confidenceMethods.find((method: any) => method.id === activeConfidence);
  const selectedDemo = statisticalDemos.find((demo: any) => demo.id === activeDemo);

  return (
    <div className="oracle-statistical-modeling-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="title-icon">📊</span>
          {' '}
          Statistical Modeling & Probability Calculations
        </h2>
        <p className="section-description">
          Explore Oracle's sophisticated statistical foundation including regression models, probability 
          distributions, Bayesian inference, and confidence estimation techniques that power accurate 
          sports predictions with quantified uncertainty.
        </p>
      </div>

      {/* Statistical Models */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">🔢</span>
          {' '}
          Core Statistical Models
        </h3>
        <p className="subsection-description">
          Oracle employs a comprehensive suite of statistical models, from simple linear regression to 
          advanced ensemble methods, each optimized for specific prediction scenarios and data characteristics.
        </p>

        <div className="models-grid">
          {statisticalModels.map((model) => (
            <button
              key={model.id}
              className={`model-card ${activeModel === model.id ? 'active' : ''} ${model.category}`}
              onClick={() => setActiveModel(model.id)}
              aria-label={`Explore ${model.name} model`}
            >
              <div className="model-header">
                <h4 className="model-name">{model.name}</h4>
                <span className={`model-category ${model.category}`}>
                  {model.category}
                </span>
              </div>
              
              <div className="model-metrics">
                <div className="metric">
                  <span className="metric-label">Accuracy</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill" 
                      style={{ width: `${model.accuracy}%` }}
                    />
                  </div>
                  <span className="metric-value">{model.accuracy}%</span>
                </div>
                
                <div className="metric">
                  <span className="metric-label">Interpretability</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill interpretability" 
                      style={{ width: `${model.interpretability}%` }}
                    />
                  </div>
                  <span className="metric-value">{model.interpretability}%</span>
                </div>
              </div>
              
              <div className="complexity-indicator">
                <span className={`complexity ${model.complexity}`}>
                  {model.complexity} complexity
                </span>
              </div>
            </button>
          ))}
        </div>

        {selectedModel && (
          <div className="model-details">
            <div className="model-details-header">
              <h4>{selectedModel.name}</h4>
              <span className={`category-badge ${selectedModel.category}`}>
                {selectedModel.category}
              </span>
            </div>
            
            <p className="model-description">{selectedModel.description}</p>
            
            <div className="model-content">
              <div className="formula-section">
                <h5>Mathematical Formula</h5>
                <div className="formula-display">
                  <code className="formula">{selectedModel.formula}</code>
                </div>
              </div>
              
              <div className="applications-section">
                <h5>Oracle Applications</h5>
                <ul className="applications-list">
                  {selectedModel.applications.map((app) => (
                    <li key={`${selectedModel.id}-${app}`} className="application-item">{app}</li>
                  ))}
                </ul>
              </div>
              
              <div className="assumptions-section">
                <h5>Model Assumptions</h5>
                <ul className="assumptions-list">
                  {selectedModel.assumptions.map((assumption) => (
                    <li key={`${selectedModel.id}-${assumption}`} className="assumption-item">{assumption}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Probability Distributions */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">📈</span>
          {' '}
          Probability Distributions
        </h3>
        <p className="subsection-description">
          Oracle leverages fundamental probability distributions to model uncertainty, variability, and 
          likelihood in sports data, providing mathematical foundations for prediction confidence.
        </p>

        <div className="distribution-tabs">
          {probabilityDistributions.map((dist) => (
            <button
              key={dist.id}
              className={`distribution-tab ${activeDistribution === dist.id ? 'active' : ''} ${dist.type}`}
              onClick={() => setActiveDistribution(dist.id)}
              aria-label={`Explore ${dist.name} distribution`}
            >
              <span className="tab-name">{dist.name.split(' ')[0]}</span>
              <span className={`tab-type ${dist.type}`}>{dist.type}</span>
            </button>
          ))}
        </div>

        {selectedDistribution && (
          <div className="distribution-details">
            <div className="distribution-header">
              <h4>{selectedDistribution.name}</h4>
              <span className={`type-badge ${selectedDistribution.type}`}>
                {selectedDistribution.type}
              </span>
            </div>
            
            <p className="distribution-description">{selectedDistribution.description}</p>
            
            <div className="distribution-content">
              <div className="formula-parameters">
                <div className="formula-display">
                  <h5>Probability Density/Mass Function</h5>
                  <code className="formula">{selectedDistribution.formula}</code>
                </div>
                
                <div className="parameters-display">
                  <h5>Parameters</h5>
                  <ul className="parameters-list">
                    {selectedDistribution.parameters.map((param) => (
                      <li key={`${selectedDistribution.id}-${param}`} className="parameter-item">
                        <code>{param}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="statistics-display">
                <h5>Key Statistics</h5>
                <div className="statistics-grid">
                  <div className="statistic">
                    <span className="stat-label">Mean (μ)</span>
                    <code className="stat-value">{selectedDistribution.mean}</code>
                  </div>
                  <div className="statistic">
                    <span className="stat-label">Variance (σ²)</span>
                    <code className="stat-value">{selectedDistribution.variance}</code>
                  </div>
                  {selectedDistribution.cdf && (
                    <div className="statistic">
                      <span className="stat-label">CDF</span>
                      <code className="stat-value">{selectedDistribution.cdf}</code>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="applications-display">
                <h5>Oracle Applications</h5>
                <ul className="applications-list">
                  {selectedDistribution.applications.map((app) => (
                    <li key={`${selectedDistribution.id}-${app}`} className="application-item">{app}</li>
                  ))}
                </ul>
              </div>
              
              <div className="examples-display">
                <h5>Real-World Examples</h5>
                <div className="examples-grid">
                  {selectedDistribution.examples.map((example, exampleIndex) => (
                    <div key={`${selectedDistribution.id}-example-${exampleIndex}`} className="example-card">
                      <h6>{example.scenario}</h6>
                      <div className="example-parameters">
                        {Object.entries(example.parameters).map(([key, value]) => (
                          <span key={key} className="parameter">
                            {key}: <code>{value}</code>
                          </span>
                        ))}
                      </div>
                      <div className="visualization">
                        <div className="viz-bars">
                          {example.visualization.map((height, barIndex) => (
                            <div 
                              key={`${selectedDistribution.id}-example-${exampleIndex}-bar-${barIndex}`} 
                              className="viz-bar"
                              style={{ height: `${height * 100}px` }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="example-interpretation">{example.interpretation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bayesian Methods */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">🧠</span>
          {' '}
          Bayesian Inference Framework
        </h3>
        <p className="subsection-description">
          Oracle incorporates Bayesian methodology to update predictions with new evidence, combine prior 
          knowledge with current data, and provide probabilistic reasoning for uncertainty quantification.
        </p>

        <div className="bayesian-grid">
          {bayesianComponents.map((component) => (
            <button
              key={component.id}
              className={`bayesian-card ${activeBayesian === component.id ? 'active' : ''} ${component.type}`}
              onClick={() => setActiveBayesian(component.id)}
              aria-label={`Learn about ${component.name}`}
            >
              <div className="component-header">
                <h4 className="component-name">{component.name}</h4>
                <span className={`component-type ${component.type}`}>
                  {component.type}
                </span>
              </div>
              <p className="component-description">{component.description}</p>
            </button>
          ))}
        </div>

        {selectedBayesian && (
          <div className="bayesian-details">
            <div className="bayesian-details-header">
              <h4>{selectedBayesian.name}</h4>
              <span className={`type-badge ${selectedBayesian.type}`}>
                {selectedBayesian.type}
              </span>
            </div>
            
            <p className="bayesian-description">{selectedBayesian.description}</p>
            
            <div className="bayesian-content">
              <div className="formula-section">
                <h5>Mathematical Representation</h5>
                <code className="formula">{selectedBayesian.formula}</code>
              </div>
              
              <div className="role-section">
                <h5>Role in Oracle's System</h5>
                <p className="role-description">{selectedBayesian.role}</p>
              </div>
              
              <div className="examples-section">
                <h5>Practical Examples</h5>
                <ul className="examples-list">
                  {selectedBayesian.examples.map((example) => (
                    <li key={`${selectedBayesian.id}-${example}`} className="example-item">{example}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confidence Estimation */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">🎯</span>
          {' '}
          Confidence Estimation Methods
        </h3>
        <p className="subsection-description">
          Oracle employs multiple approaches to quantify prediction uncertainty, from classical confidence 
          intervals to modern ensemble methods, ensuring reliable uncertainty estimates across all predictions.
        </p>

        <div className="confidence-methods-grid">
          {confidenceMethods.map((method) => (
            <button
              key={method.id}
              className={`confidence-card ${activeConfidence === method.id ? 'active' : ''} ${method.category}`}
              onClick={() => setActiveConfidence(method.id)}
              aria-label={`Explore ${method.name} method`}
            >
              <div className="method-header">
                <h4 className="method-name">{method.name}</h4>
                <span className={`method-category ${method.category}`}>
                  {method.category}
                </span>
              </div>
              
              <div className="method-metrics">
                <div className="accuracy-metric">
                  <span className="metric-label">Accuracy</span>
                  <span className="metric-value">{method.accuracy}%</span>
                </div>
                <div className="cost-metric">
                  <span className="metric-label">Cost</span>
                  <span className={`cost-indicator ${method.computationalCost}`}>
                    {method.computationalCost}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedConfidence && (
          <div className="confidence-details">
            <div className="confidence-details-header">
              <h4>{selectedConfidence.name}</h4>
              <span className={`category-badge ${selectedConfidence.category}`}>
                {selectedConfidence.category}
              </span>
            </div>
            
            <p className="confidence-description">{selectedConfidence.description}</p>
            
            <div className="confidence-content">
              <div className="formula-section">
                <h5>Mathematical Formula</h5>
                <code className="formula">{selectedConfidence.formula}</code>
              </div>
              
              <div className="pros-cons">
                <div className="advantages">
                  <h5>Advantages</h5>
                  <ul className="advantages-list">
                    {selectedConfidence.advantages.map((advantage) => (
                      <li key={`${selectedConfidence.id}-adv-${advantage}`} className="advantage-item">{advantage}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="limitations">
                  <h5>Limitations</h5>
                  <ul className="limitations-list">
                    {selectedConfidence.limitations.map((limitation) => (
                      <li key={`${selectedConfidence.id}-lim-${limitation}`} className="limitation-item">{limitation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Demonstrations */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">🧪</span>
          {' '}
          Interactive Statistical Demonstrations
        </h3>
        <p className="subsection-description">
          See Oracle's statistical methods in action through step-by-step demonstrations of real prediction 
          scenarios, complete with calculations, interpretations, and comparative analysis.
        </p>

        <div className="demo-controls">
          <div className="demo-selector">
            {statisticalDemos.map((demo) => (
              <button
                key={demo.id}
                className={`demo-tab ${activeDemo === demo.id ? 'active' : ''}`}
                onClick={() => setActiveDemo(demo.id)}
                aria-label={`Select ${demo.name} demonstration`}
              >
                {demo.name}
              </button>
            ))}
          </div>
          
          <button
            className="demo-start-button"
            onClick={startDemo}
            disabled={isDemoRunning}
            aria-label="Start statistical demonstration"
          >
            {isDemoRunning ? 'Running...' : 'Start Demo'}
          </button>
        </div>

        {selectedDemo && (
          <div className="demo-content">
            <div className="demo-header">
              <h4>{selectedDemo.name}</h4>
              <span className={`demo-type ${selectedDemo.type}`}>
                {selectedDemo.type}
              </span>
            </div>
            
            <p className="demo-description">{selectedDemo.description}</p>
            
            <div className="demo-input">
              <h5>Input Data</h5>
              <div className="input-display">
                {Object.entries(selectedDemo.inputData).map(([key, value]) => (
                  <div key={key} className="input-item">
                    <span className="input-key">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                    <span className="input-value">
                      {(() => {
                        if (Array.isArray(value)) {
                          return `[${value.join(', ')}]`;
                        }
                        if (typeof value === 'object' && value !== null) {
                          return JSON.stringify(value, null, 2);
                        }
                        return String(value);
                      })()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="demo-steps">
              <h5>Calculation Steps</h5>
              <div className="steps-container">
                {selectedDemo.steps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`demo-step ${
                      isDemoRunning && index === demoStep ? 'active' : ''
                    } ${
                      isDemoRunning && index < demoStep ? 'completed' : ''
                    }`}
                  >
                    <div className="step-number">{index + 1}</div>
                    <div className="step-content">
                      <h6>{step.title}</h6>
                      <p className="step-description">{step.description}</p>
                      <div className="calculation">
                        <code className="calculation-formula">{step.calculation}</code>
                        <span className="calculation-result">= {step.result}</span>
                      </div>
                      <p className="step-explanation">{step.explanation}</p>
                    </div>
                    {isDemoRunning && index === demoStep && (
                      <div className="processing-indicator">Computing...</div>
                    )}
                    {isDemoRunning && index < demoStep && (
                      <div className="completed-indicator">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="demo-result">
              <h5>Final Results</h5>
              <div className="result-display">
                {typeof selectedDemo.result === 'object' ? (
                  Object.entries(selectedDemo.result).map(([key, value]) => (
                    <div key={key} className="result-item">
                      <span className="result-key">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                      <span className="result-value">
                        {(() => {
                          if (Array.isArray(value)) {
                            return `[${value.join(', ')}]`;
                          }
                          if (typeof value === 'object' && value !== null) {
                            return JSON.stringify(value, null, 2);
                          }
                          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                            return String(value);
                          }
                          return '';
                        })()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="result-item">
                    <span className="result-value">{String(selectedDemo.result)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="demo-interpretation">
              <h5>Statistical Interpretation</h5>
              <p className="interpretation-text">{selectedDemo.interpretation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Key Mathematical Insights */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">💡</span>
          {' '}
          Statistical Modeling Insights
        </h3>
        
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Model Selection Strategy</h4>
            <p>
              Oracle dynamically selects optimal statistical models based on data characteristics, 
              sample size, and prediction horizon. Linear models for interpretability, ensemble 
              methods for accuracy, Bayesian approaches for uncertainty quantification.
            </p>
          </div>
          
          <div className="insight-card">
            <h4>Probability Distribution Matching</h4>
            <p>
              Each prediction scenario uses domain-appropriate distributions: Normal for player 
              scores, Poisson for counting events, Beta for success rates, ensuring mathematical 
              validity and realistic confidence bounds.
            </p>
          </div>
          
          <div className="insight-card">
            <h4>Bayesian Prior Integration</h4>
            <p>
              Oracle incorporates expert knowledge through carefully constructed priors, allowing 
              predictions to benefit from historical patterns while adapting to new information 
              through Bayesian updating mechanisms.
            </p>
          </div>
          
          <div className="insight-card">
            <h4>Multi-Level Confidence</h4>
            <p>
              Prediction confidence operates at multiple levels: model uncertainty, parameter 
              uncertainty, and future outcome variability, providing comprehensive uncertainty 
              quantification for decision-making.
            </p>
          </div>
          
          <div className="insight-card">
            <h4>Computational Efficiency</h4>
            <p>
              Statistical calculations are optimized for real-time prediction generation, using 
              analytical solutions where possible and efficient numerical methods for complex 
              Bayesian computations and bootstrap procedures.
            </p>
          </div>
          
          <div className="insight-card">
            <h4>Validation Framework</h4>
            <p>
              All statistical models undergo rigorous validation including cross-validation, 
              residual analysis, assumption checking, and out-of-sample testing to ensure 
              prediction reliability and model appropriateness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OracleStatisticalModelingSection;
