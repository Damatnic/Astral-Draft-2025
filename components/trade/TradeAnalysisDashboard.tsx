/**
 * Trade Analysis Dashboard Component
 * Comprehensive trade evaluation interface with fair value calculations and recommendations
 */

import React, { useState, useEffect } from 'react';
import { 
  useTradeAnalysis, 
  useTradeComparison, 
  useSingleTradeAnalysis,
  useTradeRecommendations 
} from '../../hooks/useTradeAnalysis';
import { TradeProposal, TradeAnalysis, FantasyRoster } from '../../services/tradeAnalysisService';

// Type aliases for better code organization
type TradeAction = 'accept' | 'reject' | 'counter';

// Dashboard props interface
interface TradeAnalysisDashboardProps {
  currentRoster: FantasyRoster;
  opponentRoster?: FantasyRoster;
  activeProposals?: TradeProposal[];
  onTradeAction?: (tradeId: string, action: TradeAction) => void;
  className?: string;
}

// Component interfaces
interface TradeScoreDisplayProps {
  analysis: TradeAnalysis;
  compact?: boolean;
}

interface PlayerValueCardProps {
  player: {
    playerId: string;
    playerName: string;
    position: string;
    team: string;
    currentValue: number;
    projectedValue: number;
    confidence: number;
  };
  isGiving: boolean;
}

interface TradeRecommendationProps {
  analysis: TradeAnalysis;
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
}

// Main dashboard component
const TradeAnalysisDashboard: React.FC<TradeAnalysisDashboardProps> = ({
  currentRoster,
  opponentRoster,
  activeProposals = [],
  onTradeAction,
  className = ''
}) => {
  const [selectedTab, setSelectedTab] = useState<'analyze' | 'compare' | 'recommendations'>('analyze');
  const [selectedProposal, setSelectedProposal] = useState<TradeProposal | null>(null);
  const [customGivingPlayers, setCustomGivingPlayers] = useState<string[]>([]);
  const [customReceivingPlayers, setCustomReceivingPlayers] = useState<string[]>([]);

  // Hooks
  const tradeAnalysis = useTradeAnalysis({ autoRefresh: true, refreshInterval: 300000 });
  const tradeComparison = useTradeComparison();
  const singleTradeAnalysis = useSingleTradeAnalysis();
  const tradeRecommendations = useTradeRecommendations();

  // Initialize recommendations
  useEffect(() => {
    tradeRecommendations.generateRecommendations(currentRoster, {}, 1);
  }, [currentRoster]);

  // Handle proposal selection
  const handleProposalSelect = async (proposal: TradeProposal) => {
    if (!opponentRoster) return;
    
    setSelectedProposal(proposal);
    await tradeAnalysis.analyzeTradeProposal(proposal, currentRoster, opponentRoster);
  };

  // Handle custom trade analysis
  const handleCustomTradeAnalysis = async () => {
    if (!opponentRoster || customGivingPlayers.length === 0 || customReceivingPlayers.length === 0) {
      return;
    }

    await singleTradeAnalysis.analyzeTradeByPlayers(
      customGivingPlayers,
      customReceivingPlayers,
      currentRoster,
      opponentRoster,
      {
        league: 'custom',
        week: 1,
        season: 2024,
        tradeDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    );
  };

  // Handle trade action
  const handleTradeAction = (action: TradeAction) => {
    if (selectedProposal && onTradeAction) {
      onTradeAction(selectedProposal.id, action);
    }
  };

  return (
    <div className={`trade-analysis-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">Trade Analysis Center</h2>
        <p className="dashboard-subtitle">
          Comprehensive trade evaluation with fair value calculations and AI-powered recommendations
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${selectedTab === 'analyze' ? 'active' : ''}`}
          onClick={() => setSelectedTab('analyze')}
        >
          Analyze Trades
        </button>
        <button
          className={`tab-button ${selectedTab === 'compare' ? 'active' : ''}`}
          onClick={() => setSelectedTab('compare')}
        >
          Compare Offers
        </button>
        <button
          className={`tab-button ${selectedTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setSelectedTab('recommendations')}
        >
          Recommendations
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {selectedTab === 'analyze' && (
          <AnalyzeTradesTab
            activeProposals={activeProposals}
            selectedProposal={selectedProposal}
            onProposalSelect={handleProposalSelect}
            tradeAnalysis={tradeAnalysis}
            singleTradeAnalysis={singleTradeAnalysis}
            customGivingPlayers={customGivingPlayers}
            customReceivingPlayers={customReceivingPlayers}
            onCustomGivingChange={setCustomGivingPlayers}
            onCustomReceivingChange={setCustomReceivingPlayers}
            onCustomAnalyze={handleCustomTradeAnalysis}
            onTradeAction={handleTradeAction}
            currentRoster={currentRoster}
          />
        )}

        {selectedTab === 'compare' && (
          <CompareTradesTab
            tradeComparison={tradeComparison}
            currentRoster={currentRoster}
            opponentRoster={opponentRoster}
          />
        )}

        {selectedTab === 'recommendations' && (
          <RecommendationsTab
            tradeRecommendations={tradeRecommendations}
            currentRoster={currentRoster}
          />
        )}
      </div>
    </div>
  );
};

// Analyze trades tab component
const AnalyzeTradesTab: React.FC<{
  activeProposals: TradeProposal[];
  selectedProposal: TradeProposal | null;
  onProposalSelect: (proposal: TradeProposal) => void;
  tradeAnalysis: any;
  singleTradeAnalysis: any;
  customGivingPlayers: string[];
  customReceivingPlayers: string[];
  onCustomGivingChange: (players: string[]) => void;
  onCustomReceivingChange: (players: string[]) => void;
  onCustomAnalyze: () => void;
  onTradeAction: (action: 'accept' | 'reject' | 'counter') => void;
  currentRoster: FantasyRoster;
}> = ({
  activeProposals,
  selectedProposal,
  onProposalSelect,
  tradeAnalysis,
  singleTradeAnalysis,
  customGivingPlayers,
  customReceivingPlayers,
  onCustomGivingChange,
  onCustomReceivingChange,
  onCustomAnalyze,
  onTradeAction,
  currentRoster
}) => {
  return (
    <div className="analyze-trades-tab">
      {/* Active Proposals Section */}
      <div className="proposals-section">
        <h3>Active Trade Proposals</h3>
        {activeProposals.length > 0 ? (
          <div className="proposals-list">
            {activeProposals.map((proposal) => (
              <div
                key={proposal.id}
                className={`proposal-card ${selectedProposal?.id === proposal.id ? 'selected' : ''}`}
                onClick={() => onProposalSelect(proposal)}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onProposalSelect(proposal);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="proposal-header">
                  <span className="proposal-id">Trade #{proposal.id}</span>
                  <span className={`proposal-status ${proposal?.status}`}>
                    {proposal?.status}
                  </span>
                </div>
                <div className="proposal-details">
                  <div className="proposal-side">
                    <span className="side-label">Giving:</span>
                    <span className="player-count">{proposal.givingPlayers.length} players</span>
                  </div>
                  <div className="proposal-side">
                    <span className="side-label">Receiving:</span>
                    <span className="player-count">{proposal.receivingPlayers.length} players</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-proposals">
            <p>No active trade proposals</p>
          </div>
        )}
      </div>

      {/* Custom Trade Builder */}
      <div className="custom-trade-section">
        <h3>Custom Trade Analyzer</h3>
        <div className="custom-trade-builder">
          <div className="trade-side">
            <label>Players You're Giving:</label>
            <PlayerSelector
              availablePlayers={currentRoster.players}
              selectedPlayers={customGivingPlayers}
              onSelectionChange={onCustomGivingChange}
              placeholder="Select players to trade away"
            />
          </div>
          <div className="trade-side">
            <label>Players You're Receiving:</label>
            <PlayerSelector
              availablePlayers={[]} // Would get from opponent roster
              selectedPlayers={customReceivingPlayers}
              onSelectionChange={onCustomReceivingChange}
              placeholder="Select players to receive"
            />
          </div>
          <button
            className="analyze-button"
            onClick={onCustomAnalyze}
            disabled={customGivingPlayers.length === 0 || customReceivingPlayers.length === 0}
          >
            Analyze Custom Trade
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {(tradeAnalysis.currentAnalysis || singleTradeAnalysis.analysis) && (
        <div className="analysis-results">
          <h3>Trade Analysis Results</h3>
          <TradeAnalysisDisplay
            analysis={tradeAnalysis.currentAnalysis || singleTradeAnalysis.analysis}
            onTradeAction={onTradeAction}
            showActions={!!selectedProposal}
          />
        </div>
      )}

      {/* Loading States */}
      {(tradeAnalysis.isAnalyzing || singleTradeAnalysis.isAnalyzing) && (
        <div className="analysis-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing trade proposal...</p>
        </div>
      )}

      {/* Error States */}
      {(tradeAnalysis.error || singleTradeAnalysis.error) && (
        <div className="analysis-error">
          <p>Error: {tradeAnalysis.error || singleTradeAnalysis.error}</p>
        </div>
      )}
    </div>
  );
};

// Compare trades tab component
const CompareTradesTab: React.FC<{
  tradeComparison: any;
  currentRoster: FantasyRoster;
  opponentRoster?: FantasyRoster;
}> = ({ tradeComparison, currentRoster, opponentRoster }) => {
  return (
    <div className="compare-trades-tab">
      <h3>Trade Comparison</h3>
      {tradeComparison.proposals.length > 0 ? (
        <div className="comparison-results">
          <div className="rankings-list">
            {tradeComparison.rankings.map((ranking: any, index: number) => (
              <div key={ranking.tradeId} className="ranking-item">
                <span className="rank">#{index + 1}</span>
                <span className="score">{ranking.score}%</span>
                <span className="recommendation">{ranking.recommendation}</span>
              </div>
            ))}
          </div>
          {tradeComparison.bestTrade && (
            <div className="best-trade">
              <h4>Best Trade Option</h4>
              <TradeScoreDisplay analysis={tradeComparison.bestTrade} />
            </div>
          )}
        </div>
      ) : (
        <div className="no-comparisons">
          <p>No trades added for comparison</p>
        </div>
      )}
    </div>
  );
};

// Recommendations tab component
const RecommendationsTab: React.FC<{
  tradeRecommendations: any;
  currentRoster: FantasyRoster;
}> = ({ tradeRecommendations }) => {
  return (
    <div className="recommendations-tab">
      <h3>Trade Recommendations</h3>
      
      {tradeRecommendations.isGenerating ? (
        <div className="recommendations-loading">
          <div className="loading-spinner"></div>
          <p>Generating personalized recommendations...</p>
        </div>
      ) : (
        <div className="recommendations-content">
          <div className="recommendation-section">
            <h4>Players to Consider Trading</h4>
            <ul className="recommendation-list">
              {tradeRecommendations.recommendations.playerToTrade.map((rec: any, index: number) => (
                <li key={index} className="recommendation-item">{rec}</li>
              ))}
            </ul>
          </div>

          <div className="recommendation-section">
            <h4>Players to Target</h4>
            <ul className="recommendation-list">
              {tradeRecommendations.recommendations.playersToTarget.map((rec: any, index: number) => (
                <li key={index} className="recommendation-item">{rec}</li>
              ))}
            </ul>
          </div>

          <div className="recommendation-section">
            <h4>Trade Strategies</h4>
            <ul className="recommendation-list">
              {tradeRecommendations.recommendations.tradeStrategies.map((rec: any, index: number) => (
                <li key={index} className="recommendation-item">{rec}</li>
              ))}
            </ul>
          </div>

          <div className="recommendation-section">
            <h4>Market Trends</h4>
            <ul className="recommendation-list">
              {tradeRecommendations.recommendations.marketTrends.map((rec: any, index: number) => (
                <li key={index} className="recommendation-item">{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Trade analysis display component
const TradeAnalysisDisplay: React.FC<{
  analysis: TradeAnalysis;
  onTradeAction?: (action: 'accept' | 'reject' | 'counter') => void;
  showActions?: boolean;
}> = ({ analysis, onTradeAction, showActions = false }) => {
  return (
    <div className="trade-analysis-display">
      {/* Overall Score and Recommendation */}
      <div className="analysis-header">
        <TradeScoreDisplay analysis={analysis} />
        <TradeRecommendationComponent
          analysis={analysis}
          onAccept={showActions ? () => onTradeAction?.('accept') : undefined}
          onReject={showActions ? () => onTradeAction?.('reject') : undefined}
          onCounter={showActions ? () => onTradeAction?.('counter') : undefined}
        />
      </div>

      {/* Value Comparison */}
      <div className="value-comparison">
        <h4>Value Analysis</h4>
        <div className="value-sides">
          <div className="value-side giving">
            <h5>Giving ({analysis.analysis.valueComparison.givingSide.totalValue.toFixed(1)})</h5>
            <div className="player-values">
              {analysis.analysis.valueComparison.givingSide.playerValues.map((player) => (
                <PlayerValueCard key={player.playerId} player={player} isGiving={true} />
              ))}
            </div>
          </div>
          <div className="value-side receiving">
            <h5>Receiving ({analysis.analysis.valueComparison.receivingSide.totalValue.toFixed(1)})</h5>
            <div className="player-values">
              {analysis.analysis.valueComparison.receivingSide.playerValues.map((player) => (
                <PlayerValueCard key={player.playerId} player={player} isGiving={false} />
              ))}
            </div>
          </div>
        </div>
        <div className="value-difference">
          <span className={`difference ${analysis.analysis.valueComparison.valueDifference >= 0 ? 'positive' : 'negative'}`}>
            {analysis.analysis.valueComparison.valueDifference >= 0 ? '+' : ''}
            {analysis.analysis.valueComparison.valueDifference.toFixed(1)} value difference
          </span>
        </div>
      </div>

      {/* Future Projections */}
      <div className="future-projections">
        <h4>Future Impact</h4>
        <div className="projection-metrics">
          <div className="metric">
            <span className="metric-label">Rest of Season:</span>
            <span className={`metric-value ${analysis.analysis.futureProjections.restOfSeasonProjection.cumulativeAdvantage >= 0 ? 'positive' : 'negative'}`}>
              {analysis.analysis.futureProjections.restOfSeasonProjection.cumulativeAdvantage >= 0 ? '+' : ''}
              {analysis.analysis.futureProjections.restOfSeasonProjection.cumulativeAdvantage.toFixed(1)} points
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Playoffs:</span>
            <span className={`metric-value ${analysis.analysis.futureProjections.playoffProjection.playoffAdvantage >= 0 ? 'positive' : 'negative'}`}>
              {analysis.analysis.futureProjections.playoffProjection.playoffAdvantage >= 0 ? '+' : ''}
              {analysis.analysis.futureProjections.playoffProjection.playoffAdvantage.toFixed(1)} points
            </span>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="risk-assessment">
        <h4>Risk Analysis</h4>
        <div className="risk-summary">
          <span className={`risk-level ${analysis.analysis.riskAssessment.overallRisk}`}>
            {analysis.analysis.riskAssessment.overallRisk.replace('_', ' ')} Risk
          </span>
          <span className="risk-score">
            Risk Score: {analysis.analysis.riskAssessment.riskScore.toFixed(0)}/100
          </span>
        </div>
        {analysis.analysis.riskAssessment.riskFactors.length > 0 && (
          <div className="risk-factors">
            {analysis.analysis.riskAssessment.riskFactors.map((factor, index) => (
              <div key={index} className={`risk-factor ${factor.severity}`}>
                <span className="factor-type">{factor.type.replace('_', ' ')}</span>
                <span className="factor-description">{factor.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reasoning */}
      <div className="analysis-reasoning">
        <h4>Analysis Summary</h4>
        <p>{analysis.reasoning}</p>
      </div>

      {/* Alternative Offers */}
      {analysis.alternativeOffers && analysis.alternativeOffers.length > 0 && (
        <div className="alternative-offers">
          <h4>Alternative Suggestions</h4>
          <div className="alternatives-list">
            {analysis.alternativeOffers.map((offer, index) => (
              <div key={index} className="alternative-offer">
                <div className="offer-score">
                  Score: {offer.fairnessScore.toFixed(1)}%
                </div>
                <div className="offer-reasoning">
                  {offer.reasoning}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Trade score display component
const TradeScoreDisplay: React.FC<TradeScoreDisplayProps> = ({ analysis, compact = false }) => {
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'accept': return 'accept';
      case 'reject': return 'reject';
      case 'counter': return 'counter';
      default: return 'hold';
    }
  };

  return (
    <div className={`trade-score-display ${compact ? 'compact' : ''}`}>
      <div className="score-container">
        <div className={`score-circle ${getScoreColor(analysis.fairnessScore)}`}>
          <span className="score-value">{analysis.fairnessScore.toFixed(0)}</span>
          <span className="score-label">Fair</span>
        </div>
        <div className={`recommendation ${getRecommendationColor(analysis.recommendation)}`}>
          {analysis.recommendation.toUpperCase()}
        </div>
      </div>
      <div className="confidence-indicator">
        <span>Confidence: {(analysis.confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};

// Player value card component
const PlayerValueCard: React.FC<PlayerValueCardProps> = ({ player, isGiving }) => {
  return (
    <div className={`player-value-card ${isGiving ? 'giving' : 'receiving'}`}>
      <div className="player-info">
        <span className="player-name">{player.playerName}</span>
        <span className="player-details">{player.position} - {player.team}</span>
      </div>
      <div className="player-values">
        <div className="value-metric">
          <span className="value-label">Current:</span>
          <span className="value-number">{player.currentValue.toFixed(1)}</span>
        </div>
        <div className="value-metric">
          <span className="value-label">Projected:</span>
          <span className="value-number">{player.projectedValue.toFixed(1)}</span>
        </div>
      </div>
      <div className="confidence-bar">
        <div 
          className="confidence-fill" 
          style={{ width: `${player.confidence * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

// Trade recommendation component
const TradeRecommendationComponent: React.FC<TradeRecommendationProps> = ({
  analysis,
  onAccept,
  onReject,
  onCounter
}) => {
  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation) {
      case 'accept': return 'recommendation-accept';
      case 'reject': return 'recommendation-reject';
      case 'counter': return 'recommendation-counter';
      default: return 'recommendation-hold';
    }
  };

  return (
    <div className={`trade-recommendation ${getRecommendationStyle(analysis.recommendation)}`}>
      <div className="recommendation-text">
        <strong>{analysis.recommendation.toUpperCase()}</strong>
      </div>
      {(onAccept || onReject || onCounter) && (
        <div className="recommendation-actions">
          {onAccept && (
            <button className="action-button accept" onClick={onAccept}>
              Accept
            </button>
          )}
          {onCounter && (
            <button className="action-button counter" onClick={onCounter}>
              Counter
            </button>
          )}
          {onReject && (
            <button className="action-button reject" onClick={onReject}>
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Player selector component
const PlayerSelector: React.FC<{
  availablePlayers: any[];
  selectedPlayers: string[];
  onSelectionChange: (players: string[]) => void;
  placeholder: string;
}> = ({ availablePlayers, selectedPlayers, onSelectionChange, placeholder }) => {
  return (
    <div className="player-selector">
      <div className="selected-players">
        {selectedPlayers.length > 0 ? (
          selectedPlayers.map((playerId) => (
            <div key={playerId} className="selected-player">
              <span>{playerId}</span>
              <button
                onClick={() => onSelectionChange(selectedPlayers.filter((id: any) => id !== playerId))}
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <div className="placeholder">{placeholder}</div>
        )}
      </div>
      {/* Would add dropdown for available players */}
    </div>
  );
};

export default TradeAnalysisDashboard;
