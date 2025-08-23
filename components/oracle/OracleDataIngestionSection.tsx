import React, { useState, useEffect } from 'react';
import './OracleDataIngestionSection.css';

interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'websocket' | 'database' | 'scraper';
  updateFrequency: string;
  reliability: number;
  latency: string;
  description: string;
  dataTypes: string[];
  validationRules: string[];
}

interface IngestionStage {
  id: string;
  name: string;
  description: string;
  processes: string[];
  outputFormat: string;
  validationChecks: string[];
  timing: string;
}

interface ValidationRule {
  id: string;
  name: string;
  category: 'integrity' | 'consistency' | 'completeness' | 'timeliness' | 'accuracy';
  description: string;
  examples: string[];
  failureHandling: string;
  criticalLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface DataQualityMetric {
  id: string;
  name: string;
  description: string;
  formula: string;
  threshold: string;
  impact: string;
}

interface ProcessingPipeline {
  id: string;
  name: string;
  stages: string[];
  parallelization: boolean;
  throughput: string;
  errorRecovery: string[];
}

const OracleDataIngestionSection: React.FC = () => {
  const [activeDataSource, setActiveDataSource] = useState<string>('sportsio');
  const [activeStage, setActiveStage] = useState<string>('acquisition');
  const [activeValidation, setActiveValidation] = useState<string>('integrity');
  const [activeMetric, setActiveMetric] = useState<string>('completeness');
  const [activePipeline, setActivePipeline] = useState<string>('realtime');
  const [isProcessingDemo, setIsProcessingDemo] = useState<boolean>(false);
  const [demoStage, setDemoStage] = useState<number>(0);

  const dataSources: DataSource[] = [
    {
      id: 'sportsio',
      name: 'SportsIO API',
      type: 'api',
      updateFrequency: 'Real-time (30-second intervals)',
      reliability: 99.2,
      latency: '< 500ms',
      description: 'Primary live sports data feed providing player stats, game scores, injury reports, and weather conditions',
      dataTypes: ['Player Statistics', 'Game Scores', 'Team Metrics', 'Injury Reports', 'Weather Data', 'Vegas Lines'],
      validationRules: ['Schema Validation', 'Data Freshness', 'Statistical Consistency', 'Cross-Reference Checks']
    },
    {
      id: 'websocket',
      name: 'Real-Time WebSocket Feeds',
      type: 'websocket',
      updateFrequency: 'Continuous (< 1-second)',
      reliability: 97.8,
      latency: '< 100ms',
      description: 'Ultra-low latency feeds for live game events, score updates, and breaking news',
      dataTypes: ['Live Scores', 'Play-by-Play', 'Breaking News', 'Lineup Changes', 'In-Game Events'],
      validationRules: ['Message Ordering', 'Duplicate Detection', 'Timestamp Validation', 'Event Sequencing']
    },
    {
      id: 'market',
      name: 'Market Data Sources',
      type: 'api',
      updateFrequency: 'Every 5 minutes',
      reliability: 98.5,
      latency: '< 2 seconds',
      description: 'Fantasy market data including ownership percentages, salary trends, and expert consensus',
      dataTypes: ['Ownership %', 'Salary Data', 'Expert Rankings', 'DFS Trends', 'Market Sentiment'],
      validationRules: ['Range Validation', 'Trend Analysis', 'Outlier Detection', 'Historical Comparison']
    },
    {
      id: 'historical',
      name: 'Historical Database',
      type: 'database',
      updateFrequency: 'Daily batch updates',
      reliability: 99.8,
      latency: '< 50ms',
      description: 'Comprehensive historical data warehouse with multi-year player and team statistics',
      dataTypes: ['Historical Stats', 'Season Trends', 'Career Data', 'Team History', 'Coaching Records'],
      validationRules: ['Referential Integrity', 'Data Completeness', 'Statistical Accuracy', 'Version Control']
    }
  ];

  const ingestionStages: IngestionStage[] = [
    {
      id: 'acquisition',
      name: 'Data Acquisition',
      description: 'Initial data collection from multiple sources with parallel processing and load balancing',
      processes: [
        'API Request Management',
        'WebSocket Connection Handling',
        'Rate Limiting & Throttling',
        'Connection Pool Management',
        'Failover & Retry Logic',
        'Load Balancing Across Sources'
      ],
      outputFormat: 'Raw JSON/XML streams',
      validationChecks: ['Source Authentication', 'Response Format', 'Data Availability', 'Connection Status'],
      timing: '< 1 second for critical data'
    },
    {
      id: 'parsing',
      name: 'Data Parsing & Normalization',
      description: 'Transform raw data into standardized formats with schema validation and type conversion',
      processes: [
        'Schema Validation',
        'Data Type Conversion',
        'Format Standardization',
        'Encoding Normalization',
        'Field Mapping & Translation',
        'Error Detection & Logging'
      ],
      outputFormat: 'Structured JSON objects',
      validationChecks: ['Schema Compliance', 'Type Validation', 'Required Fields', 'Format Consistency'],
      timing: '< 500ms per record batch'
    },
    {
      id: 'validation',
      name: 'Data Validation & Quality Control',
      description: 'Comprehensive validation using business rules, statistical checks, and cross-reference verification',
      processes: [
        'Business Rule Validation',
        'Statistical Outlier Detection',
        'Cross-Source Verification',
        'Historical Consistency Checks',
        'Completeness Assessment',
        'Quality Score Calculation'
      ],
      outputFormat: 'Validated data with quality metrics',
      validationChecks: ['Business Logic', 'Statistical Bounds', 'Data Integrity', 'Completeness Score'],
      timing: '< 2 seconds for full validation'
    },
    {
      id: 'enrichment',
      name: 'Data Enrichment & Enhancement',
      description: 'Augment core data with calculated metrics, derived features, and contextual information',
      processes: [
        'Calculated Field Generation',
        'Feature Engineering',
        'Contextual Data Addition',
        'Trend Calculation',
        'Performance Metrics',
        'Predictive Indicators'
      ],
      outputFormat: 'Enhanced datasets with derived features',
      validationChecks: ['Calculation Accuracy', 'Feature Validity', 'Trend Consistency', 'Performance Bounds'],
      timing: '< 3 seconds for complex enrichment'
    },
    {
      id: 'storage',
      name: 'Data Storage & Indexing',
      description: 'Optimized storage with real-time indexing, partitioning, and accessibility for prediction algorithms',
      processes: [
        'Data Partitioning by Time/Type',
        'Index Creation & Maintenance',
        'Cache Layer Management',
        'Backup & Replication',
        'Performance Optimization',
        'Access Pattern Analysis'
      ],
      outputFormat: 'Indexed database records',
      validationChecks: ['Storage Integrity', 'Index Consistency', 'Access Performance', 'Backup Verification'],
      timing: '< 1 second for write operations'
    }
  ];

  const validationRules: ValidationRule[] = [
    {
      id: 'integrity',
      name: 'Data Integrity Validation',
      category: 'integrity',
      description: 'Ensures data structure, relationships, and constraints are maintained throughout the pipeline',
      examples: [
        'Player ID consistency across all data sources',
        'Game date/time format validation',
        'Statistical value ranges (e.g., completion % between 0-100)',
        'Referential integrity between players and teams'
      ],
      failureHandling: 'Flag inconsistencies, attempt auto-correction, escalate critical issues',
      criticalLevel: 'critical'
    },
    {
      id: 'consistency',
      name: 'Cross-Source Consistency',
      category: 'consistency',
      description: 'Validates that the same data points match across different sources and time periods',
      examples: [
        'Player statistics matching between SportsIO and official league data',
        'Game scores consistent across real-time and official sources',
        'Injury status alignment between multiple reporting sources',
        'Team roster consistency across data feeds'
      ],
      failureHandling: 'Compare sources, weight by reliability, flag discrepancies for review',
      criticalLevel: 'high'
    },
    {
      id: 'completeness',
      name: 'Data Completeness Assessment',
      category: 'completeness',
      description: 'Ensures all required data fields are present and populated for accurate predictions',
      examples: [
        'All starting lineup positions filled',
        'Complete weather data for outdoor games',
        'Full injury report availability',
        'Historical data coverage for trend analysis'
      ],
      failureHandling: 'Identify missing data, attempt backfill, adjust prediction confidence',
      criticalLevel: 'medium'
    },
    {
      id: 'timeliness',
      name: 'Data Freshness & Timeliness',
      category: 'timeliness',
      description: 'Validates that data is current, relevant, and received within acceptable time windows',
      examples: [
        'Player stats updated within 30 seconds of game events',
        'Injury reports reflecting latest medical evaluations',
        'Weather data current within 15 minutes',
        'Lineup changes processed within 5 minutes of announcement'
      ],
      failureHandling: 'Timestamp validation, staleness detection, priority refresh triggering',
      criticalLevel: 'high'
    },
    {
      id: 'accuracy',
      name: 'Statistical Accuracy Verification',
      category: 'accuracy',
      description: 'Validates statistical calculations, derived metrics, and data transformations for mathematical correctness',
      examples: [
        'Fantasy point calculations match league scoring rules',
        'Player efficiency ratings within statistical bounds',
        'Team pace calculations aligned with game duration',
        'Weather impact scores properly normalized'
      ],
      failureHandling: 'Recalculate using multiple methods, flag calculation errors, manual review',
      criticalLevel: 'critical'
    }
  ];

  const qualityMetrics: DataQualityMetric[] = [
    {
      id: 'completeness',
      name: 'Completeness Score',
      description: 'Percentage of required data fields that are populated and valid',
      formula: '(Populated Fields / Required Fields) × 100',
      threshold: '≥ 95% for prediction generation',
      impact: 'Lower completeness reduces prediction confidence and accuracy'
    },
    {
      id: 'accuracy',
      name: 'Accuracy Rate',
      description: 'Percentage of data points that pass validation checks and consistency tests',
      formula: '(Valid Records / Total Records) × 100',
      threshold: '≥ 98% for high-confidence predictions',
      impact: 'Accuracy directly correlates with Oracle prediction reliability'
    },
    {
      id: 'freshness',
      name: 'Data Freshness Index',
      description: 'Measure of how current the data is relative to real-time events',
      formula: '1 - (Current Time - Data Timestamp) / Acceptable Lag',
      threshold: '≥ 0.9 for real-time predictions',
      impact: 'Stale data leads to outdated predictions and missed opportunities'
    },
    {
      id: 'consistency',
      name: 'Consistency Coefficient',
      description: 'Degree of agreement between multiple data sources for the same information',
      formula: 'Σ(Source Agreement) / Number of Sources',
      threshold: '≥ 0.85 for multi-source validation',
      impact: 'Inconsistent data triggers manual review and confidence adjustment'
    }
  ];

  const processingPipelines: ProcessingPipeline[] = [
    {
      id: 'realtime',
      name: 'Real-Time Processing Pipeline',
      stages: ['Immediate Acquisition', 'Stream Processing', 'Live Validation', 'Instant Enrichment', 'Cache Update'],
      parallelization: true,
      throughput: '10,000+ records/second',
      errorRecovery: ['Automatic Retry', 'Fallback Sources', 'Graceful Degradation', 'Alert Generation']
    },
    {
      id: 'batch',
      name: 'Batch Processing Pipeline',
      stages: ['Bulk Acquisition', 'Batch Validation', 'Historical Analysis', 'Trend Calculation', 'Database Update'],
      parallelization: true,
      throughput: '1M+ records/hour',
      errorRecovery: ['Checkpoint Recovery', 'Partial Reprocessing', 'Error Quarantine', 'Manual Review Queue']
    },
    {
      id: 'prediction',
      name: 'Prediction-Ready Pipeline',
      stages: ['Feature Extraction', 'Model Input Preparation', 'Validation for ML', 'Quality Scoring', 'Algorithm Dispatch'],
      parallelization: false,
      throughput: '5,000+ predictions/minute',
      errorRecovery: ['Data Imputation', 'Confidence Adjustment', 'Alternative Models', 'Human Oversight']
    }
  ];

  useEffect(() => {
    if (isProcessingDemo) {
      const interval = setInterval(() => {
        setDemoStage((prev) => {
          if (prev >= ingestionStages.length - 1) {
            setIsProcessingDemo(false);
            return 0;
          }
          return prev + 1;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isProcessingDemo, ingestionStages.length]);

  const startProcessingDemo = () => {
    setDemoStage(0);
    setIsProcessingDemo(true);
  };

  const selectedDataSource = dataSources.find((source: any) => source.id === activeDataSource);
  const selectedValidation = validationRules.find((rule: any) => rule.id === activeValidation);
  const selectedMetric = qualityMetrics.find((metric: any) => metric.id === activeMetric);
  const selectedPipeline = processingPipelines.find((pipeline: any) => pipeline.id === activePipeline);

  return (
    <div className="oracle-data-ingestion-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="title-icon">📊</span>
          {' '}
          Data Ingestion & Validation Workflows
        </h2>
        <p className="section-description">
          Explore Oracle's sophisticated data pipeline that processes millions of data points from live sports feeds, 
          validates information in real-time, and ensures prediction-ready data quality through comprehensive validation workflows.
        </p>
      </div>

      {/* Data Sources Overview */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">🔌</span>
          {' '}
          Data Sources & Feeds
        </h3>
        <p className="subsection-description">
          Oracle ingests data from multiple high-reliability sources, each optimized for specific data types and update frequencies.
        </p>

        <div className="data-sources-grid">
          {dataSources.map((source) => (
            <button
              key={source.id}
              className={`data-source-card ${activeDataSource === source.id ? 'active' : ''}`}
              onClick={() => setActiveDataSource(source.id)}
              aria-label={`Select ${source.name} data source`}
            >
              <div className="source-header">
                <h4 className="source-name">{source.name}</h4>
                <span className={`source-type ${source.type}`}>{source.type.toUpperCase()}</span>
              </div>
              <div className="source-metrics">
                <div className="metric">
                  <span className="metric-label">Reliability</span>
                  <span className="metric-value">{source.reliability}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Latency</span>
                  <span className="metric-value">{source.latency}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedDataSource && (
          <div className="selected-source-details">
            <div className="source-details-header">
              <h4>{selectedDataSource.name} Details</h4>
              <span className="update-frequency">Updates: {selectedDataSource.updateFrequency}</span>
            </div>
            <p className="source-description">{selectedDataSource.description}</p>
            
            <div className="details-grid">
              <div className="detail-section">
                <h5>Data Types</h5>
                <ul className="data-types-list">
                  {selectedDataSource.dataTypes.map((type) => (
                    <li key={`type-${type}`} className="data-type-item">{type}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-section">
                <h5>Validation Rules</h5>
                <ul className="validation-rules-list">
                  {selectedDataSource.validationRules.map((rule) => (
                    <li key={`rule-${rule}`} className="validation-rule-item">{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ingestion Pipeline Stages */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">⚡</span>
          {' '}
          Data Ingestion Pipeline
        </h3>
        <p className="subsection-description">
          Oracle's five-stage ingestion pipeline processes raw data into prediction-ready information with comprehensive validation at each step.
        </p>

        <div className="pipeline-demo-controls">
          <button
            className="demo-button"
            onClick={startProcessingDemo}
            disabled={isProcessingDemo}
            aria-label="Start processing pipeline demonstration"
          >
            {isProcessingDemo ? 'Processing...' : 'Watch Pipeline Demo'}
          </button>
        </div>

        <div className="pipeline-stages">
          {ingestionStages.map((stage, index) => (
            <div
              key={stage.id}
              className={`pipeline-stage ${activeStage === stage.id ? 'active' : ''} ${
                isProcessingDemo && index === demoStage ? 'processing' : ''
              } ${isProcessingDemo && index < demoStage ? 'completed' : ''}`}
            >
              <button
                className="stage-header"
                onClick={() => setActiveStage(stage.id)}
                aria-label={`View details for ${stage.name}`}
              >
                <div className="stage-number">{index + 1}</div>
                <div className="stage-info">
                  <h4 className="stage-name">{stage.name}</h4>
                  <span className="stage-timing">{stage.timing}</span>
                </div>
                <div className="stage-status">
                  {isProcessingDemo && index === demoStage && (
                    <div className="processing-indicator">Processing...</div>
                  )}
                  {isProcessingDemo && index < demoStage && (
                    <div className="completed-indicator">✓</div>
                  )}
                </div>
              </button>

              {activeStage === stage.id && (
                <div className="stage-details">
                  <p className="stage-description">{stage.description}</p>
                  
                  <div className="stage-info-grid">
                    <div className="info-section">
                      <h5>Processing Steps</h5>
                      <ul className="processes-list">
                        {stage.processes.map((process) => (
                          <li key={`process-${process}`} className="process-item">{process}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="info-section">
                      <h5>Validation Checks</h5>
                      <ul className="validation-checks-list">
                        {stage.validationChecks.map((check) => (
                          <li key={`check-${check}`} className="validation-check-item">{check}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="output-format">
                    <h5>Output Format</h5>
                    <span className="format-description">{stage.outputFormat}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Validation Rules & Quality Control */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">🛡️</span>
          {' '}
          Validation Rules & Quality Control
        </h3>
        <p className="subsection-description">
          Comprehensive validation framework ensuring data integrity, consistency, and accuracy across all ingestion stages.
        </p>

        <div className="validation-categories">
          {validationRules.map((rule) => (
            <button
              key={rule.id}
              className={`validation-category ${activeValidation === rule.id ? 'active' : ''} ${rule.criticalLevel}`}
              onClick={() => setActiveValidation(rule.id)}
              aria-label={`View ${rule.name} validation details`}
            >
              <div className="category-header">
                <h4 className="category-name">{rule.name}</h4>
                <span className={`critical-level ${rule.criticalLevel}`}>
                  {rule.criticalLevel.toUpperCase()}
                </span>
              </div>
              <span className="category-type">{rule.category}</span>
            </button>
          ))}
        </div>

        {selectedValidation && (
          <div className="validation-details">
            <div className="validation-header">
              <h4>{selectedValidation.name}</h4>
              <span className="validation-category">{selectedValidation.category}</span>
            </div>
            
            <p className="validation-description">{selectedValidation.description}</p>
            
            <div className="validation-content">
              <div className="examples-section">
                <h5>Validation Examples</h5>
                <ul className="examples-list">
                  {selectedValidation.examples.map((example) => (
                    <li key={`example-${example.substring(0, 20)}`} className="example-item">{example}</li>
                  ))}
                </ul>
              </div>
              
              <div className="failure-handling-section">
                <h5>Failure Handling</h5>
                <p className="failure-handling">{selectedValidation.failureHandling}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Quality Metrics */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">📈</span>
          {' '}
          Data Quality Metrics
        </h3>
        <p className="subsection-description">
          Oracle continuously monitors data quality using mathematical metrics that directly impact prediction confidence and accuracy.
        </p>

        <div className="quality-metrics-grid">
          {qualityMetrics.map((metric) => (
            <button
              key={metric.id}
              className={`quality-metric-card ${activeMetric === metric.id ? 'active' : ''}`}
              onClick={() => setActiveMetric(metric.id)}
              aria-label={`View ${metric.name} metric details`}
            >
              <h4 className="metric-name">{metric.name}</h4>
              <p className="metric-description">{metric.description}</p>
            </button>
          ))}
        </div>

        {selectedMetric && (
          <div className="metric-details">
            <div className="metric-header">
              <h4>{selectedMetric.name}</h4>
            </div>
            
            <div className="metric-content">
              <div className="formula-section">
                <h5>Calculation Formula</h5>
                <code className="formula">{selectedMetric.formula}</code>
              </div>
              
              <div className="threshold-section">
                <h5>Quality Threshold</h5>
                <span className="threshold">{selectedMetric.threshold}</span>
              </div>
              
              <div className="impact-section">
                <h5>Impact on Predictions</h5>
                <p className="impact">{selectedMetric.impact}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing Pipelines */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">🔄</span>
          {' '}
          Processing Pipelines & Orchestration
        </h3>
        <p className="subsection-description">
          Oracle operates multiple specialized pipelines optimized for different data processing requirements and performance needs.
        </p>

        <div className="pipeline-tabs">
          {processingPipelines.map((pipeline) => (
            <button
              key={pipeline.id}
              className={`pipeline-tab ${activePipeline === pipeline.id ? 'active' : ''}`}
              onClick={() => setActivePipeline(pipeline.id)}
              aria-label={`View ${pipeline.name} details`}
            >
              {pipeline.name}
            </button>
          ))}
        </div>

        {selectedPipeline && (
          <div className="pipeline-details">
            <div className="pipeline-header">
              <h4>{selectedPipeline.name}</h4>
              <div className="pipeline-specs">
                <span className="spec">
                  <strong>Throughput:</strong> {selectedPipeline.throughput}
                </span>
                <span className="spec">
                  <strong>Parallelization:</strong> {selectedPipeline.parallelization ? 'Enabled' : 'Sequential'}
                </span>
              </div>
            </div>
            
            <div className="pipeline-content">
              <div className="stages-section">
                <h5>Processing Stages</h5>
                <div className="stages-flow">
                  {selectedPipeline.stages.map((stage) => (
                    <div key={`stage-${stage}`} className="flow-stage">
                      <span className="stage-name">{stage}</span>
                      {selectedPipeline.stages.indexOf(stage) < selectedPipeline.stages.length - 1 && (
                        <div className="flow-arrow">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="error-recovery-section">
                <h5>Error Recovery Mechanisms</h5>
                <ul className="recovery-list">
                  {selectedPipeline.errorRecovery.map((recovery) => (
                    <li key={`recovery-${recovery}`} className="recovery-item">{recovery}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div className="content-section">
        <h3 className="subsection-title">
          <span className="subsection-icon">💡</span>
          {' '}
          Key Data Ingestion Insights
        </h3>
        
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Multi-Source Validation</h4>
            <p>
              Oracle cross-references data from 4+ sources to ensure accuracy, with automatic conflict resolution 
              and reliability weighting based on historical source performance.
            </p>
          </div>
          
          <div className="insight-card">
            <h4>Real-Time Quality Monitoring</h4>
            <p>
              Continuous quality assessment with 15+ metrics ensures data meets prediction standards, 
              with automatic confidence adjustments based on quality scores.
            </p>
          </div>
          
          <div className="insight-card">
            <h4>Adaptive Processing</h4>
            <p>
              Pipeline automatically adjusts processing priority and resource allocation based on data importance, 
              game timing, and prediction urgency for optimal performance.
            </p>
          </div>
          
          <div className="insight-card">
            <h4>Predictive Data Health</h4>
            <p>
              Machine learning models predict data quality issues before they impact predictions, 
              enabling proactive resolution and maintaining 99%+ system reliability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OracleDataIngestionSection;
