/**
 * Oracle Live Data Integration Service
 * Integrates real-time NFL data with Oracle ML prediction services for dynamic updates
 * Manages prediction confidence adjustments and real-time Oracle intelligence
 */

import { realTimeNflDataService } from './realTimeNflDataService';
import type { 
  RealTimeGameEvent, 
  LivePlayerUpdate,
  RealTimeEventType
} from './realTimeNflDataService';
import type { OraclePrediction } from './oraclePredictionService';

export interface LivePredictionUpdate {
  predictionId: string;
  oldConfidence: number;
  newConfidence: number;
  reason: string;
  dataSource: string;
  timestamp: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface OracleIntelligenceUpdate {
  type: 'confidence_change' | 'new_insight' | 'data_alert' | 'trend_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  affectedPredictions: string[];
  data: any;
  timestamp: number;
}

export interface LiveOracleMetrics {
  totalPredictions: number;
  activePredictions: number;
  averageConfidence: number;
  confidenceChanges: number;
  dataPointsProcessed: number;
  lastUpdated: number;
  realtimeAccuracy: number;
  trendsDetected: number;
}

class OracleLiveDataIntegrationService {
  private isActive = false;
  private readonly predictionUpdates = new Map<string, LivePredictionUpdate[]>();
  private readonly intelligenceUpdates: OracleIntelligenceUpdate[] = [];
  private metrics: LiveOracleMetrics = {
    totalPredictions: 0,
    activePredictions: 0,
    averageConfidence: 0,
    confidenceChanges: 0,
    dataPointsProcessed: 0,
    lastUpdated: Date.now(),
    realtimeAccuracy: 0,
    trendsDetected: 0
  };

  private readonly listeners = new Map<string, Set<(data: any) => void>>();
  private readonly currentPredictions = new Map<string, OraclePrediction>();
  
  constructor() {
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for real-time data events
   */
  private setupEventListeners(): void {
    // Listen to game events
    realTimeNflDataService.subscribe('game_event', (event: RealTimeGameEvent) => {
      this.handleGameEvent(event);
    });

    // Listen to score updates
    realTimeNflDataService.subscribe('score_update', (data: any) => {
      this.handleScoreUpdate(data);
    });

    // Listen to player updates
    realTimeNflDataService.subscribe('player_update', (update: LivePlayerUpdate) => {
      this.handlePlayerUpdate(update);
    });

    // Listen to player injuries
    realTimeNflDataService.subscribe('player_injury', (data: any) => {
      this.handlePlayerInjury(data);
    });

    // Listen to odds updates
    realTimeNflDataService.subscribe('odds_update', (data: any) => {
      this.handleOddsUpdate(data);
    });
  }

  /**
   * Handle game events and update Oracle predictions
   */
  private async handleGameEvent(event: RealTimeGameEvent): Promise<void> {
    try {
      const affectedPredictions = await this.findAffectedPredictions(event.gameId);
      
      for (const prediction of affectedPredictions) {
        const confidenceAdjustment = this.calculateConfidenceAdjustment(event, prediction);
        
        if (Math.abs(confidenceAdjustment) > 0.01) { // Only update if change is significant
          const oldConfidence = prediction.confidence;
          const newConfidence = Math.max(0.6, Math.min(0.95, oldConfidence + confidenceAdjustment));
          
          // Update prediction confidence
          prediction.confidence = newConfidence;
          this.currentPredictions.set(prediction.id, prediction);
          
          // Record the update
          const update: LivePredictionUpdate = {
            predictionId: prediction.id,
            oldConfidence,
            newConfidence,
            reason: this.getConfidenceChangeReason(event, confidenceAdjustment),
            dataSource: 'live_game_event',
            timestamp: Date.now(),
            impact: confidenceAdjustment > 0 ? 'positive' : 'negative'
          };
          
          this.recordPredictionUpdate(update);
          
          // Generate intelligence update
          const intelligenceUpdate: OracleIntelligenceUpdate = {
            type: 'confidence_change',
            severity: Math.abs(confidenceAdjustment) > 0.05 ? 'high' : 'medium',
            title: 'Live Data Impact',
            message: `${event.data.description} affecting prediction confidence`,
            affectedPredictions: [prediction.id],
            data: { event, confidenceAdjustment },
            timestamp: Date.now()
          };
          
          this.addIntelligenceUpdate(intelligenceUpdate);
        }
      }
      
      this.updateMetrics();
      this.emit('predictions_updated', { affectedPredictions: affectedPredictions.map(p => p.id) });
      
    } catch (error) {
      console.error('❌ Error handling game event:', error);
    }
  }

  /**
   * Handle score updates
   */
  private async handleScoreUpdate(data: { gameId: string; homeScore: number; awayScore: number; timestamp: number }): Promise<void> {
    try {
      const affectedPredictions = await this.findAffectedPredictions(data.gameId);
      
      for (const prediction of affectedPredictions) {
        if (prediction.type === 'GAME_OUTCOME' || prediction.type === 'PLAYER_PERFORMANCE') {
          // Recalculate confidence based on current score
          const confidenceAdjustment = this.calculateScoreBasedConfidenceAdjustment(data, prediction);
          
          if (Math.abs(confidenceAdjustment) > 0.02) {
            const oldConfidence = prediction.confidence;
            const newConfidence = Math.max(0.6, Math.min(0.95, oldConfidence + confidenceAdjustment));
            
            prediction.confidence = newConfidence;
            this.currentPredictions.set(prediction.id, prediction);
            
            const update: LivePredictionUpdate = {
              predictionId: prediction.id,
              oldConfidence,
              newConfidence,
              reason: `Score update: ${data.homeScore}-${data.awayScore}`,
              dataSource: 'live_score_update',
              timestamp: Date.now(),
              impact: confidenceAdjustment > 0 ? 'positive' : 'negative'
            };
            
            this.recordPredictionUpdate(update);
          }
        }
      }
      
      this.updateMetrics();
      this.emit('score_updated', data);
      
    } catch (error) {
      console.error('❌ Error handling score update:', error);
    }
  }

  /**
   * Handle player updates
   */
  private async handlePlayerUpdate(update: LivePlayerUpdate): Promise<void> {
    try {
      const affectedPredictions = await this.findPlayerAffectedPredictions(update.playerId);
      
      for (const prediction of affectedPredictions) {
        const confidenceAdjustment = this.calculatePlayerBasedConfidenceAdjustment(update, prediction);
        
        if (Math.abs(confidenceAdjustment) > 0.01) {
          const oldConfidence = prediction.confidence;
          const newConfidence = Math.max(0.6, Math.min(0.95, oldConfidence + confidenceAdjustment));
          
          prediction.confidence = newConfidence;
          this.currentPredictions.set(prediction.id, prediction);
          
          const updateRecord: LivePredictionUpdate = {
            predictionId: prediction.id,
            oldConfidence,
            newConfidence,
            reason: `Player performance update: ${update.name} (${update.stats.fantasyPoints} fantasy pts)`,
            dataSource: 'live_player_update',
            timestamp: Date.now(),
            impact: confidenceAdjustment > 0 ? 'positive' : 'negative'
          };
          
          this.recordPredictionUpdate(updateRecord);
        }
      }
      
      this.updateMetrics();
      this.emit('player_updated', update);
      
    } catch (error) {
      console.error('❌ Error handling player update:', error);
    }
  }

  /**
   * Handle player injury updates
   */
  private async handlePlayerInjury(data: { playerId: string; name: string; team: string; oldStatus: string; newStatus: string; timestamp: number }): Promise<void> {
    try {
      const affectedPredictions = await this.findPlayerAffectedPredictions(data.playerId);
      
      const severityMap = {
        'healthy': 0,
        'questionable': -0.02,
        'doubtful': -0.05,
        'out': -0.1
      };
      
      const confidenceAdjustment = (severityMap[data.newStatus as keyof typeof severityMap] || 0) - 
                                  (severityMap[data.oldStatus as keyof typeof severityMap] || 0);
      
      for (const prediction of affectedPredictions) {
        const oldConfidence = prediction.confidence;
        const newConfidence = Math.max(0.6, Math.min(0.95, oldConfidence + confidenceAdjustment));
        
        prediction.confidence = newConfidence;
        this.currentPredictions.set(prediction.id, prediction);
        
        const update: LivePredictionUpdate = {
          predictionId: prediction.id,
          oldConfidence,
          newConfidence,
          reason: `Injury status change: ${data.name} (${data.oldStatus} → ${data.newStatus})`,
          dataSource: 'player_injury_update',
          timestamp: Date.now(),
          impact: confidenceAdjustment > 0 ? 'positive' : 'negative'
        };
        
        this.recordPredictionUpdate(update);
      }
      
      // Generate critical intelligence update for injuries
      const intelligenceUpdate: OracleIntelligenceUpdate = {
        type: 'data_alert',
        severity: data.newStatus === 'out' ? 'critical' : 'high',
        title: 'Player Injury Alert',
        message: `${data.name} (${data.team}) status changed from ${data.oldStatus} to ${data.newStatus}`,
        affectedPredictions: affectedPredictions.map(p => p.id),
        data,
        timestamp: Date.now()
      };
      
      this.addIntelligenceUpdate(intelligenceUpdate);
      this.updateMetrics();
      this.emit('player_injury', data);
      
    } catch (error) {
      console.error('❌ Error handling player injury:', error);
    }
  }

  /**
   * Handle odds updates
   */
  private async handleOddsUpdate(data: any): Promise<void> {
    try {
      const affectedPredictions = await this.findAffectedPredictions(data.gameId);
      
      for (const prediction of affectedPredictions) {
        if (prediction.type === 'GAME_OUTCOME') {
          // Adjust confidence based on odds movement
          const confidenceAdjustment = this.calculateOddsBasedConfidenceAdjustment(data.odds, prediction);
          
          if (Math.abs(confidenceAdjustment) > 0.01) {
            const oldConfidence = prediction.confidence;
            const newConfidence = Math.max(0.6, Math.min(0.95, oldConfidence + confidenceAdjustment));
            
            prediction.confidence = newConfidence;
            this.currentPredictions.set(prediction.id, prediction);
            
            const update: LivePredictionUpdate = {
              predictionId: prediction.id,
              oldConfidence,
              newConfidence,
              reason: 'Betting odds movement detected',
              dataSource: 'odds_update',
              timestamp: Date.now(),
              impact: confidenceAdjustment > 0 ? 'positive' : 'negative'
            };
            
            this.recordPredictionUpdate(update);
          }
        }
      }
      
      this.updateMetrics();
      this.emit('odds_updated', data);
      
    } catch (error) {
      console.error('❌ Error handling odds update:', error);
    }
  }

  /**
   * Calculate confidence adjustment based on game events
   */
  private calculateConfidenceAdjustment(event: RealTimeGameEvent, prediction: OraclePrediction): number {
    const eventTypeAdjustments: { [key in RealTimeEventType]: number } = {
      'GAME_START': 0.01,
      'SCORE_UPDATE': 0.02,
      'PLAYER_INJURY': -0.05,
      'PLAYER_STATUS_CHANGE': -0.02,
      'WEATHER_UPDATE': -0.01,
      'ODDS_UPDATE': 0.015,
      'QUARTER_END': 0.005,
      'GAME_END': 0,
      'TIMEOUT': 0,
      'PENALTY': -0.005,
      'TURNOVER': 0.03,
      'RED_ZONE_ENTRY': 0.02
    };
    
    const baseAdjustment = eventTypeAdjustments[event.type] || 0;
    
    let severityMultiplier: number;
    if (event.data.severity === 'critical') {
      severityMultiplier = 2;
    } else if (event.data.severity === 'high') {
      severityMultiplier = 1.5;
    } else if (event.data.severity === 'medium') {
      severityMultiplier = 1;
    } else {
      severityMultiplier = 0.5;
    }
    
    let impactMultiplier: number;
    if (event.data.impact === 'positive') {
      impactMultiplier = 1;
    } else if (event.data.impact === 'negative') {
      impactMultiplier = -1;
    } else {
      impactMultiplier = 0;
    }
    
    return baseAdjustment * severityMultiplier * impactMultiplier;
  }

  /**
   * Calculate confidence adjustment based on score updates
   */
  private calculateScoreBasedConfidenceAdjustment(data: { homeScore: number; awayScore: number }, prediction: OraclePrediction): number {
    // Simple logic - in production this would be more sophisticated
    const scoreDifference = Math.abs(data.homeScore - data.awayScore);
    const largeScoreDifference = scoreDifference > 14;
    
    if (prediction.type === 'GAME_OUTCOME') {
      return largeScoreDifference ? 0.03 : 0.01;
    }
    
    return 0;
  }

  /**
   * Calculate confidence adjustment based on player updates
   */
  private calculatePlayerBasedConfidenceAdjustment(update: LivePlayerUpdate, prediction: OraclePrediction): number {
    if (prediction.type === 'PLAYER_PERFORMANCE') {
      const fantasyPoints = update.stats.fantasyPoints;
      
      if (fantasyPoints > 20) return 0.03;
      if (fantasyPoints > 15) return 0.02;
      if (fantasyPoints > 10) return 0.01;
      if (fantasyPoints < 5) return -0.02;
    }
    
    return 0;
  }

  /**
   * Calculate confidence adjustment based on odds
   */
  private calculateOddsBasedConfidenceAdjustment(odds: any, prediction: OraclePrediction): number {
    // Simple implementation - in production this would analyze odds movement
    return 0.01;
  }

  /**
   * Find predictions affected by a game
   */
  private async findAffectedPredictions(gameId: string): Promise<OraclePrediction[]> {
    const allPredictions = Array.from(this.currentPredictions.values());
    return allPredictions.filter(prediction => 
      prediction.question.toLowerCase().includes(gameId.toLowerCase())
    );
  }

  /**
   * Find predictions affected by a player
   */
  private async findPlayerAffectedPredictions(playerId: string): Promise<OraclePrediction[]> {
    const allPredictions = Array.from(this.currentPredictions.values());
    return allPredictions.filter(prediction => 
      prediction.question.toLowerCase().includes(playerId.toLowerCase())
    );
  }

  /**
   * Get confidence change reason
   */
  private getConfidenceChangeReason(event: RealTimeGameEvent, adjustment: number): string {
    const direction = adjustment > 0 ? 'increased' : 'decreased';
    return `Confidence ${direction} due to ${event.data.description}`;
  }

  /**
   * Record prediction update
   */
  private recordPredictionUpdate(update: LivePredictionUpdate): void {
    if (!this.predictionUpdates.has(update.predictionId)) {
      this.predictionUpdates.set(update.predictionId, []);
    }
    
    const updates = this.predictionUpdates.get(update.predictionId);
    if (updates) {
      updates.push(update);
      
      // Keep only last 50 updates per prediction
      if (updates.length > 50) {
        updates.splice(0, updates.length - 50);
      }
    }
  }

  /**
   * Add intelligence update
   */
  private addIntelligenceUpdate(update: OracleIntelligenceUpdate): void {
    this.intelligenceUpdates.unshift(update);
    
    // Keep only last 100 intelligence updates
    if (this.intelligenceUpdates.length > 100) {
      this.intelligenceUpdates.splice(100);
    }
    
    this.emit('intelligence_update', update);
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    const activePredictions = Array.from(this.currentPredictions.values());
    
    this.metrics = {
      totalPredictions: activePredictions.length,
      activePredictions: activePredictions.length, // All predictions are considered active since we don't have status
      averageConfidence: activePredictions.reduce((sum, p) => sum + p.confidence, 0) / activePredictions.length || 0,
      confidenceChanges: Array.from(this.predictionUpdates.values()).reduce((sum, updates) => sum + updates.length, 0),
      dataPointsProcessed: this.metrics.dataPointsProcessed + 1,
      lastUpdated: Date.now(),
      realtimeAccuracy: this.calculateRealTimeAccuracy(),
      trendsDetected: this.intelligenceUpdates.filter(u => u.type === 'trend_detected').length
    };
    
    this.emit('metrics_updated', this.metrics);
  }

  /**
   * Calculate real-time accuracy
   */
  private calculateRealTimeAccuracy(): number {
    // Simple calculation - in production this would be more sophisticated
    const recentUpdates = this.intelligenceUpdates.slice(0, 20);
    const positiveUpdates = recentUpdates.filter(u => u.type === 'confidence_change').length;
    return recentUpdates.length > 0 ? positiveUpdates / recentUpdates.length : 0.85;
  }

  /**
   * Subscribe to events
   */
  public subscribe(eventType: string, callback: (data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.add(callback);
    }
  }

  /**
   * Unsubscribe from events
   */
  public unsubscribe(eventType: string, callback: (data: any) => void): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit events
   */
  private emit(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Start live data integration
   */
  public start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    realTimeNflDataService.start();
    
    console.log('🔄 Oracle Live Data Integration started');
    this.emit('service_started', { timestamp: Date.now() });
  }

  /**
   * Stop live data integration
   */
  public stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    realTimeNflDataService.stop();
    
    console.log('🛑 Oracle Live Data Integration stopped');
    this.emit('service_stopped', { timestamp: Date.now() });
  }

  /**
   * Get current metrics
   */
  public getMetrics(): LiveOracleMetrics {
    return { ...this.metrics };
  }

  /**
   * Get prediction updates
   */
  public getPredictionUpdates(predictionId?: string): LivePredictionUpdate[] {
    if (predictionId) {
      return this.predictionUpdates.get(predictionId) || [];
    }
    
    return Array.from(this.predictionUpdates.values()).flat();
  }

  /**
   * Get intelligence updates
   */
  public getIntelligenceUpdates(limit = 20): OracleIntelligenceUpdate[] {
    return this.intelligenceUpdates.slice(0, limit);
  }

  /**
   * Add prediction to monitoring
   */
  public addPrediction(prediction: OraclePrediction): void {
    this.currentPredictions.set(prediction.id, prediction);
    this.updateMetrics();
  }

  /**
   * Remove prediction from monitoring
   */
  public removePrediction(predictionId: string): void {
    this.currentPredictions.delete(predictionId);
    this.predictionUpdates.delete(predictionId);
    this.updateMetrics();
  }

  /**
   * Get connection status
   */
  public getStatus(): { isActive: boolean; dataServiceStatus: any; predictions: number } {
    return {
      isActive: this.isActive,
      dataServiceStatus: realTimeNflDataService.getConnectionStatus(),
      predictions: this.currentPredictions.size
    };
  }
}

// Export singleton instance
export const oracleLiveDataIntegrationService = new OracleLiveDataIntegrationService();
