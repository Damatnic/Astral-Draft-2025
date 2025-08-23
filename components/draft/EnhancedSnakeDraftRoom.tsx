/**
 * Enhanced Snake Draft Room Component
 * Advanced draft interface with auto-draft, analytics, and keeper league support
 */

import React, { useState, useEffect } from 'react';
import { useSnakeDraft, SnakeDraftState } from '../../hooks/useSnakeDraft';
import { Player, League, PlayerPosition } from '../../types';
import { DraftRecommendation, AutoDraftConfig } from '../../services/enhancedDraftEngine';
import GeniusAiChat from './GeniusAiChat';
import './EnhancedSnakeDraftRoom.css';

interface Props {
  league: League;
  userTeamId: number;
  onExit: () => void;
}

interface PlayerRowProps {
  player: Player;
  isInQueue: boolean;
  isInWatchlist: boolean;
  recommendations: DraftRecommendation[];
  onSelect: () => void;
  onAddToQueue: () => void;
  onRemoveFromQueue: () => void;
  onAddToWatchlist: () => void;
  onRemoveFromWatchlist: () => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  isInQueue,
  isInWatchlist,
  recommendations,
  onSelect,
  onAddToQueue,
  onRemoveFromQueue,
  onAddToWatchlist,
  onRemoveFromWatchlist
}) => {
  const recommendation = recommendations.find((rec: any) => rec.player.id === player.id);
  
  return (
    <div className={`player-row ${recommendation ? 'recommended' : ''}`}>
      <div className="player-info">
        <div className="player-name">{player.name}</div>
        <div className="player-details">
          {player.position} | {player.team} | ADP: {player?.adp || 'N/A'}
          {Boolean(player?.tier) && <span className="tier">Tier {player?.tier}</span>}
        </div>
        {recommendation && (
          <div className="recommendation">
            <span className="rec-confidence">Confidence: {(recommendation.confidence * 100).toFixed(0)}%</span>
            <span className="rec-reason">{recommendation.reasoning}</span>
          </div>
        )}
      </div>
      
      <div className="player-actions">
        <button 
          className="btn-draft"
          onClick={onSelect}
        >
          Draft
        </button>
        
        {isInQueue ? (
          <button 
            className="btn-queue remove"
            onClick={onRemoveFromQueue}
          >
            Remove from Queue
          </button>
        ) : (
          <button 
            className="btn-queue add"
            onClick={onAddToQueue}
          >
            Add to Queue
          </button>
        )}
        
        {isInWatchlist ? (
          <button 
            className="btn-watchlist remove"
            onClick={onRemoveFromWatchlist}
          >
            Remove from Watchlist
          </button>
        ) : (
          <button 
            className="btn-watchlist add"
            onClick={onAddToWatchlist}
          >
            Add to Watchlist
          </button>
        )}
      </div>
    </div>
  );
};

interface AutoDraftPanelProps {
  autoDraftEnabled: boolean;
  autoDraftConfig: AutoDraftConfig;
  onEnableAutoDraft: (config?: Partial<AutoDraftConfig>) => void;
  onDisableAutoDraft: () => void;
}

const AutoDraftPanel: React.FC<AutoDraftPanelProps> = ({
  autoDraftEnabled,
  autoDraftConfig,
  onEnableAutoDraft,
  onDisableAutoDraft
}) => {
  const [strategy, setStrategy] = useState(autoDraftConfig.strategy);
  const [riskTolerance, setRiskTolerance] = useState(autoDraftConfig.riskTolerance);
  const [avoidInjuryProne, setAvoidInjuryProne] = useState(autoDraftConfig.avoidInjuryProne);
  
  const handleConfigChange = () => {
    onEnableAutoDraft({
      strategy,
      riskTolerance,
      avoidInjuryProne
    });
  };

  return (
    <div className="auto-draft-panel">
      <h3>Auto-Draft Settings</h3>
      
      <div className="settings-grid">
        <div className="setting-group">
          <label htmlFor="strategy-select">Strategy:</label>
          <select 
            id="strategy-select"
            value={strategy} 
            onChange={(e: any) => setStrategy(e.target.value as AutoDraftConfig['strategy'])}
          >
            <option value="BPA">Best Player Available</option>
            <option value="POSITIONAL_NEED">Positional Need</option>
            <option value="VALUE_BASED">Value Based</option>
            <option value="CONSERVATIVE">Conservative</option>
            <option value="AGGRESSIVE">Aggressive</option>
          </select>
        </div>
        
        <div className="setting-group">
          <label htmlFor="risk-select">Risk Tolerance:</label>
          <select 
            id="risk-select"
            value={riskTolerance} 
            onChange={(e: any) => setRiskTolerance(e.target.value as AutoDraftConfig['riskTolerance'])}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={avoidInjuryProne}
              onChange={(e: any) => setAvoidInjuryProne(e.target.checked)}
            />
            Avoid Injury-Prone Players
          </label>
        </div>
      </div>
      
      <div className="auto-draft-controls">
        {autoDraftEnabled ? (
          <button 
            className="btn-auto-draft disable"
            onClick={onDisableAutoDraft}
          >
            Disable Auto-Draft
          </button>
        ) : (
          <button 
            className="btn-auto-draft enable"
            onClick={handleConfigChange}
          >
            Enable Auto-Draft
          </button>
        )}
      </div>
    </div>
  );
};

const EnhancedSnakeDraftRoom: React.FC<Props> = ({ league, userTeamId, onExit }) => {
  const [activeTab, setActiveTab] = useState<'players' | 'queue' | 'watchlist' | 'analytics' | 'ai-assistant'>('players');
  const [showAiChat, setShowAiChat] = useState(false);
  
  const draftState: SnakeDraftState = useSnakeDraft({
    league,
    userTeamId,
    autoDraftTimeout: 60000,
    enableAnalytics: true
  });

  const {
    currentPick,
    currentRound,
    currentTeamId,
    isComplete,
    autoDraftEnabled,
    autoDraftConfig,
    draftAnalysis,
    recommendations,
    filteredPlayers,
    searchTerm,
    positionFilter,
    tierFilter,
    draftQueue,
    watchlist,
    makePick,
    enableAutoDraft,
    disableAutoDraft,
    addToQueue,
    removeFromQueue,
    addToWatchlist,
    removeFromWatchlist,
    setPositionFilter,
    setTierFilter,
    setSearchTerm,
    getRecommendations
  } = draftState;

  // Get current team info
  const currentTeam = league.teams.find((team: any) => team.id === currentTeamId);
  const userTeam = league.teams.find((team: any) => team.id === userTeamId);
  const isUserTurn = currentTeamId === userTeamId;

  // Update recommendations when it's user's turn
  useEffect(() => {
    if (isUserTurn && !isComplete) {
      getRecommendations();
    }
  }, [isUserTurn, isComplete, getRecommendations]);

  const renderPlayersList = () => {
    let playersToShow: Player[];
    
    if (activeTab === 'queue') {
      playersToShow = draftQueue
        .map((id: any) => filteredPlayers.find((p: any) => p.id === id))
        .filter((player): player is Player => Boolean(player));
    } else if (activeTab === 'watchlist') {
      playersToShow = watchlist
        .map((id: any) => filteredPlayers.find((p: any) => p.id === id))
        .filter((player): player is Player => Boolean(player));
    } else {
      playersToShow = filteredPlayers;
    }

    return (
      <div className="players-list">
        {playersToShow.map((player: any) => (
          <PlayerRow
            key={player.id}
            player={player}
            isInQueue={draftQueue.includes(player.id)}
            isInWatchlist={watchlist.includes(player.id)}
            recommendations={recommendations}
            onSelect={() => makePick(player.id)}
            onAddToQueue={() => addToQueue(player.id)}
            onRemoveFromQueue={() => removeFromQueue(player.id)}
            onAddToWatchlist={() => addToWatchlist(player.id)}
            onRemoveFromWatchlist={() => removeFromWatchlist(player.id)}
          />
        ))}
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="analytics-panel">
      <h3>Draft Analytics</h3>
      
      {draftAnalysis && (
        <div className="position-analysis">
          <h4>Position Analysis</h4>
          <div className="analysis-grid">
            <div className="metric">
              <span>Picks Until Next Turn:</span>
              <span>{draftAnalysis.turnAnalysis.nextPickIn}</span>
            </div>
            <div className="metric">
              <span>Strategic Value:</span>
              <span className={draftAnalysis.turnAnalysis.strategicValue > 0.7 ? 'high' : draftAnalysis.turnAnalysis.strategicValue > 0.4 ? 'medium' : 'low'}>
                {(draftAnalysis.turnAnalysis.strategicValue * 100).toFixed(1)}%
              </span>
            </div>
            <div className="metric">
              <span>Turn Position:</span>
              <span>{draftAnalysis.turnAnalysis.position}</span>
            </div>
          </div>
          
          {draftAnalysis.turnAnalysis.recommendations.length > 0 && (
            <div className="turn-recommendations">
              <h5>Position Recommendations:</h5>
              {draftAnalysis.turnAnalysis.recommendations.map((rec, index) => (
                <div key={`rec-${index}`} className="turn-recommendation">
                  {rec}
                </div>
              ))}
            </div>
          )}
          
          {draftAnalysis.pickTrading.suggestedTrades.length > 0 && (
            <div className="trade-suggestions">
              <h5>Trade Suggestions:</h5>
              {draftAnalysis.pickTrading.suggestedTrades.map((trade, index) => (
                <div key={`trade-${index}`} className="trade-suggestion">
                  {trade.rationale} (Value: {trade.valueGained.toFixed(2)})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {recommendations.length > 0 && (
        <div className="recommendations">
          <h4>Top Recommendations</h4>
          {recommendations.slice(0, 5).map((rec, index) => (
            <div key={rec.player.id} className="recommendation-item">
              <div className="rec-rank">#{index + 1}</div>
              <div className="rec-player">{rec.player.name}</div>
              <div className="rec-confidence">{(rec.confidence * 100).toFixed(0)}%</div>
              <div className="rec-reasoning">{rec.reasoning}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isComplete) {
    return (
      <div className="draft-complete">
        <h2>Draft Complete!</h2>
        <button onClick={onExit}>Return to League</button>
      </div>
    );
  }

  return (
    <div className="enhanced-snake-draft-room">
      <header className="draft-header">
        <div className="draft-status">
          <h2>Snake Draft - {league.name}</h2>
          <div className="pick-info">
            Pick {currentPick} (Round {currentRound})
          </div>
          <div className="current-team">
            {isUserTurn ? 'Your Turn!' : `${currentTeam?.name || 'Unknown'}'s Turn`}
          </div>
        </div>
        
        <div className="draft-controls">
          <button 
            className="ai-chat-toggle"
            onClick={() => setShowAiChat(!showAiChat)}
            title="Toggle Coach"
          >
            {showAiChat ? 'Hide' : 'Show'} Coach
          </button>
          <button onClick={onExit}>Exit Draft</button>
        </div>
      </header>

      <div className={`draft-content ${showAiChat ? 'with-ai-panel' : ''}`}>
        {showAiChat && (
          <div className="ai-chat-panel">
            <GeniusAiChat
              currentRoster={userTeam?.roster || []}
              availablePlayers={filteredPlayers}
              currentRound={currentRound}
              currentPick={currentPick}
              leagueSettings={league.settings || {}}
              draftHistory={league.draftPicks || []}
              onPlayerSelect={(player) => makePick(player.id)}
            />
          </div>
        )}
        <div className="left-panel">
          <div className="filters">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select 
              value={positionFilter} 
              onChange={(e: any) => setPositionFilter(e.target.value as PlayerPosition | 'ALL')}
              className="position-filter"
            >
              <option value="ALL">All Positions</option>
              <option value="QB">QB</option>
              <option value="RB">RB</option>
              <option value="WR">WR</option>
              <option value="TE">TE</option>
              <option value="K">K</option>
              <option value="DST">DST</option>
            </select>
            
            <select 
              value={tierFilter} 
              onChange={(e: any) => setTierFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
              className="tier-filter"
            >
              <option value="ALL">All Tiers</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tier: any) => (
                <option key={tier} value={tier}>Tier {tier}</option>
              ))}
            </select>
          </div>

          <div className="tabs">
            <button 
              className={activeTab === 'players' ? 'active' : ''}
              onClick={() => setActiveTab('players')}
            >
              Available Players ({filteredPlayers.length})
            </button>
            <button 
              className={activeTab === 'queue' ? 'active' : ''}
              onClick={() => setActiveTab('queue')}
            >
              Queue ({draftQueue.length})
            </button>
            <button 
              className={activeTab === 'watchlist' ? 'active' : ''}
              onClick={() => setActiveTab('watchlist')}
            >
              Watchlist ({watchlist.length})
            </button>
            <button 
              className={activeTab === 'analytics' ? 'active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
            <button 
              className={`ai-tab ${activeTab === 'ai-assistant' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai-assistant')}
            >
              Coach
            </button>
          </div>

          <div className="content-area">
            {activeTab === 'analytics' ? renderAnalytics() : 
             activeTab === 'ai-assistant' ? (
              <GeniusAiChat
                currentRoster={userTeam?.roster || []}
                availablePlayers={filteredPlayers}
                currentRound={currentRound}
                currentPick={currentPick}
                leagueSettings={league.settings || {}}
                draftHistory={league.draftPicks || []}
                onPlayerSelect={(player) => makePick(player.id)}
              />
            ) : renderPlayersList()}
          </div>
        </div>

        <div className="right-panel">
          <AutoDraftPanel
            autoDraftEnabled={autoDraftEnabled}
            autoDraftConfig={autoDraftConfig}
            onEnableAutoDraft={enableAutoDraft}
            onDisableAutoDraft={disableAutoDraft}
          />

          {userTeam && (
            <div className="team-roster">
              <h3>Your Roster</h3>
              <div className="roster-slots">
                {userTeam.roster?.map((player, index) => (
                  <div key={index} className="roster-slot">
                    <span className="position">{player.position}</span>
                    <span className="name">{player.name}</span>
                  </div>
                )) || <div>No players drafted yet</div>}
              </div>
            </div>
          )}

          <div className="draft-board">
            <h3>Recent Picks</h3>
            <div className="recent-picks">
              {league.draftPicks
                .filter((pick: any) => pick.playerId)
                .slice(-10)
                .reverse()
                .map((pick, index) => {
                  const team = league.teams.find((t: any) => t.id === pick.teamId);
                  return (
                    <div key={index} className="pick-item">
                      <span className="pick-number">{pick.overall}</span>
                      <span className="team-name">{team?.name}</span>
                      <span className="player-name">Player #{pick.playerId}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSnakeDraftRoom;
