/**
 * Enhanced Injury Status Tracking Service
 * Comprehensive injury monitoring system with real-time alerts, fantasy impact analysis,
 * and intelligent replacement player recommendations
 */

import { productionSportsDataService, NFLPlayer } from './productionSportsDataService';
import { machineLearningPlayerPredictionService } from './machineLearningPlayerPredictionService';

// Enhanced injury status interface
export type RecommendedAction = 'hold' | 'trade' | 'waiver';

export interface InjuryStatus {
  id: string;
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  injuryType: string;
  bodyPart: string;
  severity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'SEASON_ENDING';
  status: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'injured_reserve' | 'pup';
  dateReported: string;
  expectedReturn?: string;
  returnProbability?: number;
  gameImpact: 'NONE' | 'LIMITED' | 'OUT' | 'DOUBTFUL';
  fantasyImpact: InjuryFantasyImpact;
  historicalPattern?: InjuryHistoricalPattern;
  medicalTimeline?: MedicalTimeline;
  newsUpdates: InjuryNewsUpdate[];
  lastUpdated: string;
}

export interface InjuryFantasyImpact {
  projectionChange: number; // Percentage change in fantasy projection
  weeklyImpact: { [week: number]: number }; // Weekly projection adjustments
  replacementOptions: ReplacementPlayer[];
  rosteredPercentage: number;
  tradeValue: 'HOLD' | 'SELL_LOW' | 'BUY_LOW' | 'AVOID';
  weeklyRecommendation: 'START' | 'SIT' | 'FLEX' | 'BENCH' | 'DROP';
}

export interface ReplacementPlayer {
  playerId: string;
  name: string;
  position: string;
  team: string;
  availabilityPercentage: number;
  projectedPoints: number;
  matchupDifficulty: number;
  confidence: number;
}

export interface InjuryHistoricalPattern {
  totalInjuries: number;
  averageRecoveryTime: number;
  recurrenceRate: number;
  seasonEndingRate: number;
  positionComparison: number; // vs other players at position
  similarInjuries: SimilarInjuryCase[];
}

export interface SimilarInjuryCase {
  playerName: string;
  year: number;
  recoveryTime: number;
  fantasyImpact: number;
  outcome: 'FULL_RECOVERY' | 'LINGERING_EFFECTS' | 'CAREER_ENDING';
}

export interface MedicalTimeline {
  phases: MedicalPhase[];
  currentPhase: string;
  nextMilestone?: string;
  expectedMilestones: string[];
}

export interface MedicalPhase {
  phase: string;
  description: string;
  duration: string;
  activities: string[];
  riskFactors: string[];
}

export interface InjuryNewsUpdate {
  id: string;
  timestamp: string;
  source: string;
  headline: string;
  content: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  credibility: number; // 0-100
  keyQuotes: string[];
}

export interface InjuryAlert {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  alertType: 'NEW_INJURY' | 'STATUS_CHANGE' | 'RETURN_UPDATE' | 'SETBACK' | 'CLEARED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  actionRequired: boolean;
  fantasyActions: string[];
  timestamp: string;
  expiresAt?: string;
}

export interface MonitoredPlayer {
  playerId: string;
  playerName: string;
  alertPreferences: AlertPreferences;
  addedAt: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[]; // 'MY_TEAM', 'WATCHLIST', 'TRADE_TARGET', etc.
}

export interface AlertPreferences {
  newInjuries: boolean;
  statusChanges: boolean;
  returnUpdates: boolean;
  practiceReports: boolean;
  gameTimeDecisions: boolean;
  replacementSuggestions: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export interface InjuryDashboardData {
  totalMonitoredPlayers: number;
  activeInjuries: number;
  recentAlerts: InjuryAlert[];
  criticalUpdates: InjuryStatus[];
  weeklyImpact: WeeklyInjuryImpact;
  replacementRecommendations: ReplacementPlayer[];
  injuryTrends: InjuryTrendData[];
}

export interface WeeklyInjuryImpact {
  week: number;
  totalPlayersAffected: number;
  fantasyPointsLost: number;
  positionBreakdown: { [position: string]: number };
  severityBreakdown: { [severity: string]: number };
}

export interface InjuryTrendData {
  position: string;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  weeklyCount: number[];
  seasonTotal: number;
  averageRecoveryTime: number;
}

class InjuryTrackingService {
  private monitoredPlayers: Map<string, MonitoredPlayer> = new Map();
  private injuryStatuses: Map<string, InjuryStatus> = new Map();
  private readonly alertCallbacks: ((alert: InjuryAlert) => void)[] = [];
  private readonly updateCallbacks: ((status: InjuryStatus) => void)[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Start real-time injury monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🏥 Starting injury tracking monitoring...');

    // Check for updates every 2 minutes
    this.monitoringInterval = setInterval(() => {
      this.checkForInjuryUpdates();
    }, 2 * 60 * 1000);

    // Initial update
    this.checkForInjuryUpdates();
  }

  /**
   * Stop injury monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('🛑 Injury tracking monitoring stopped');
  }

  /**
   * Add player to monitoring list
   */
  addMonitoredPlayer(
    playerId: string,
    playerName: string,
    preferences: Partial<AlertPreferences> = {},
    priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
    tags: string[] = []
  ): void {
    const defaultPreferences: AlertPreferences = {
      newInjuries: true,
      statusChanges: true,
      returnUpdates: true,
      practiceReports: false,
      gameTimeDecisions: true,
      replacementSuggestions: true,
      emailNotifications: false,
      pushNotifications: true,
      smsNotifications: false
    };

    const monitoredPlayer: MonitoredPlayer = {
      playerId,
      playerName,
      alertPreferences: { ...defaultPreferences, ...preferences },
      addedAt: new Date().toISOString(),
      priority,
      tags
    };

    this.monitoredPlayers.set(playerId, monitoredPlayer);
    this.saveToStorage();

    // Immediately check this player's status
    this.checkPlayerInjuryStatus(playerId);
  }

  /**
   * Remove player from monitoring
   */
  removeMonitoredPlayer(playerId: string): void {
    this.monitoredPlayers.delete(playerId);
    this.injuryStatuses.delete(playerId);
    this.saveToStorage();
  }

  /**
   * Get all monitored players
   */
  getMonitoredPlayers(): MonitoredPlayer[] {
    return Array.from(this.monitoredPlayers.values());
  }

  /**
   * Get injury status for a specific player
   */
  getPlayerInjuryStatus(playerId: string): InjuryStatus | null {
    return this.injuryStatuses.get(playerId) || null;
  }

  /**
   * Get all current injury statuses
   */
  getAllInjuryStatuses(): InjuryStatus[] {
    return Array.from(this.injuryStatuses.values());
  }

  /**
   * Get injury dashboard data
   */
  async getInjuryDashboard(): Promise<InjuryDashboardData> {
    const allStatuses = this.getAllInjuryStatuses();
    const activeInjuries = allStatuses.filter(s => s.status !== 'healthy');
    
    return {
      totalMonitoredPlayers: this.monitoredPlayers.size,
      activeInjuries: activeInjuries.length,
      recentAlerts: await this.getRecentAlerts(24), // Last 24 hours
      criticalUpdates: activeInjuries.filter(s => 
        s.severity === 'SEVERE' || s.severity === 'SEASON_ENDING'
      ),
      weeklyImpact: this.calculateWeeklyImpact(),
      replacementRecommendations: await this.getReplacementRecommendations(),
      injuryTrends: this.calculateInjuryTrends()
    };
  }

  /**
   * Subscribe to injury alerts
   */
  onInjuryAlert(callback: (alert: InjuryAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Subscribe to injury status updates
   */
  onInjuryStatusUpdate(callback: (status: InjuryStatus) => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Get injury impact analysis for fantasy
   */
  async getFantasyImpactAnalysis(playerId: string): Promise<InjuryFantasyImpact | null> {
    const status = this.getPlayerInjuryStatus(playerId);
    if (!status) return null;

    return status.fantasyImpact;
  }

  /**
   * Get replacement player recommendations
   */
  async getReplacementRecommendations(
    playerId?: string,
    position?: string,
    limit: number = 10
  ): Promise<ReplacementPlayer[]> {
    try {
      // This would integrate with waiver wire and available players
      const mockReplacements: ReplacementPlayer[] = [
        {
          playerId: 'replacement_1',
          name: 'Backup Player 1',
          position: position || 'RB',
          team: 'FA',
          availabilityPercentage: 85,
          projectedPoints: 12.5,
          matchupDifficulty: 3,
          confidence: 75
        },
        {
          playerId: 'replacement_2',
          name: 'Backup Player 2',
          position: position || 'RB',
          team: 'FA',
          availabilityPercentage: 60,
          projectedPoints: 15.2,
          matchupDifficulty: 2,
          confidence: 82
        }
      ];

      return mockReplacements.slice(0, limit);
    } catch (error) {
      console.error('Failed to get replacement recommendations:', error);
      return [];
    }
  }

  /**
   * Update alert preferences for a player
   */
  updateAlertPreferences(playerId: string, preferences: Partial<AlertPreferences>): void {
    const player = this.monitoredPlayers.get(playerId);
    if (player) {
      player.alertPreferences = { ...player.alertPreferences, ...preferences };
      this.monitoredPlayers.set(playerId, player);
      this.saveToStorage();
    }
  }

  /**
   * Get enhanced replacement player recommendations with ML analysis
   */
  async getEnhancedReplacementRecommendations(
    playerId: string, 
    position: string, 
    count: number = 5,
    rosterAnalysis?: {
      currentRoster: string[];
      leagueSize: number;
      scoringSystem: 'standard' | 'ppr' | 'half-ppr';
      availablePlayers?: string[];
    }
  ): Promise<ReplacementPlayer[]> {
    try {
      console.log(`🔍 Finding ${count} replacement recommendations for ${position} player ${playerId}`);

      // Get all available players at the position
      const availablePlayers = await this.getAvailablePlayersByPosition(position, rosterAnalysis?.availablePlayers);
      
      // Enhanced analysis with ML predictions and matchup data
      const recommendations = await Promise.all(
        availablePlayers.slice(0, count * 2).map(async (player) => {
          const mlPrediction = await this.getPlayerMLPrediction(player.id);
          const matchupDifficulty = await this.calculateMatchupDifficulty(player.id);
          const availability = await this.calculatePlayerAvailability(player.id, rosterAnalysis?.leagueSize);
          const emergencyValue = this.calculateEmergencyValue(player, position, rosterAnalysis?.scoringSystem);

          return {
            playerId: player.id,
            name: player.name,
            position: player.position,
            team: player.team,
            availabilityPercentage: availability,
            projectedPoints: mlPrediction?.fantasyPoints.expected || player.fantasyProjection || 0,
            matchupDifficulty,
            confidence: mlPrediction?.confidence || 0.5,
            emergencyValue,
            replacementScore: this.calculateReplacementScore(
              mlPrediction?.fantasyPoints.expected || 0,
              availability,
              matchupDifficulty,
              emergencyValue
            ),
            weeklyProjections: await this.getWeeklyProjections(player.id),
            riskFactors: await this.assessReplacementRisks(player.id),
            upcomingSchedule: await this.getUpcomingSchedule(player.team)
          };
        })
      );

      // Sort by replacement score and return top recommendations
      const sortedRecommendations = [...recommendations];
      sortedRecommendations.sort((a, b) => b.replacementScore - a.replacementScore);

      console.log(`✅ Found ${sortedRecommendations.slice(0, count).length} replacement recommendations`);
      return sortedRecommendations.slice(0, count);

    } catch (error) {
      console.error('❌ Error getting replacement recommendations:', error);
      return [];
    }
  }

  /**
   * Assess injury risk prediction for a player using ML and historical data
   */
  async assessPlayerInjuryRisk(playerId: string): Promise<{
    riskScore: number; // 0-1, higher = more risk
    riskFactors: string[];
    prediction: 'low' | 'moderate' | 'high' | 'extreme';
    timeframe: string;
    confidence: number;
    preventiveMeasures: string[];
  } | null> {
    try {
      const player = await productionSportsDataService.getPlayerDetails(playerId);
      if (!player) return null;

      // Analyze injury history and current status
      const historicalPattern = await this.getHistoricalPattern(playerId);
      const currentStatus = this.getPlayerInjuryStatus(playerId);
      const workloadAnalysis = await this.analyzePlayerWorkload(playerId);
      const ageFactors = this.calculateAgeFactor(player);
      
      // Calculate risk factors
      const riskFactors: string[] = [];
      let riskScore = 0;

      // Historical injury pattern analysis
      if (historicalPattern.recurrenceRate > 0.3) {
        riskFactors.push('High injury recurrence rate');
        riskScore += 0.3;
      }

      // Current injury status
      if (currentStatus && currentStatus.status !== 'healthy') {
        riskFactors.push('Currently dealing with injury');
        riskScore += 0.4;
      }

      // Workload analysis
      if (workloadAnalysis.snapsPercentage > 85) {
        riskFactors.push('High snap count usage');
        riskScore += 0.2;
      }

      // Age factors
      if (ageFactors.riskMultiplier > 1.2) {
        riskFactors.push('Age-related injury risk increase');
        riskScore += 0.15;
      }

      // Position-specific risks
      const positionRisk = this.getPositionInjuryRisk(player.position);
      if (positionRisk > 0.6) {
        riskFactors.push('High-risk position');
        riskScore += 0.1;
      }

      // Normalize risk score
      riskScore = Math.min(1, riskScore);

      // Determine prediction level
      let prediction: 'low' | 'moderate' | 'high' | 'extreme';
      if (riskScore < 0.25) prediction = 'low';
      else if (riskScore < 0.5) prediction = 'moderate';
      else if (riskScore < 0.75) prediction = 'high';
      else prediction = 'extreme';

      // Generate preventive measures
      const preventiveMeasures = this.generatePreventiveMeasures(riskFactors, player.position);

      return {
        riskScore,
        riskFactors,
        prediction,
        timeframe: '4-6 weeks',
        confidence: 0.7,
        preventiveMeasures
      };

    } catch (error) {
      console.error('Error assessing injury risk:', error);
      return null;
    }
  }

  /**
   * Get real-time injury alerts and updates
   */
  async getRealTimeInjuryUpdates(): Promise<{
    newInjuries: InjuryAlert[];
    statusChanges: InjuryAlert[];
    practiceReports: InjuryAlert[];
    emergencyAlerts: InjuryAlert[];
  }> {
    try {
      // Check for new injury reports from multiple sources
      const espnUpdates = await this.checkESPNInjuryReports();
      const practiceReports = await this.checkPracticeReports();
      const emergencyAlerts = await this.checkEmergencyAlerts();

      // Process and categorize updates
      const newInjuries: InjuryAlert[] = [];
      const statusChanges: InjuryAlert[] = [];
      const practiceReportAlerts: InjuryAlert[] = [];
      const emergencyAlertsList: InjuryAlert[] = [];

      // Process each source and categorize
      [...espnUpdates, ...practiceReports, ...emergencyAlerts].forEach(alert => {
        if (alert.alertType === 'NEW_INJURY') {
          newInjuries.push(alert);
        } else if (alert.alertType === 'STATUS_CHANGE') {
          statusChanges.push(alert);
        } else if (alert.alertType === 'RETURN_UPDATE') {
          practiceReportAlerts.push(alert);
        } else if (alert.severity === 'HIGH') {
          emergencyAlertsList.push(alert);
        }
      });

      // Send notifications for monitored players
      await this.processRealTimeNotifications([...newInjuries, ...statusChanges, ...emergencyAlertsList]);

      return {
        newInjuries,
        statusChanges,
        practiceReports: practiceReportAlerts,
        emergencyAlerts: emergencyAlertsList
      };

    } catch (error) {
      console.error('Error getting real-time injury updates:', error);
      return {
        newInjuries: [],
        statusChanges: [],
        practiceReports: [],
        emergencyAlerts: []
      };
    }
  }

  /**
   * Generate comprehensive injury impact report
   */
  async generateInjuryImpactReport(playerIds: string[]): Promise<{
    overallImpact: {
      totalFantasyPointsLost: number;
      averageReplacementValue: number;
      positionScarcityImpact: number;
    };
    playerAnalysis: {
      playerId: string;
      playerName: string;
      injuryDetails: InjuryStatus;
      replacementOptions: ReplacementPlayer[];
      weeklyImpact: { week: number; pointsLost: number }[];
      tradeImplications: {
        currentValue: number;
        injuredValue: number;
        recommendedAction: RecommendedAction;
      };
    }[];
    recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  }> {
    try {
      const playerAnalysis = await Promise.all(
        playerIds.map(async (playerId) => {
          const injuryStatus = this.getPlayerInjuryStatus(playerId);
          if (!injuryStatus) return null;

          const replacementOptions = await this.getReplacementRecommendations(playerId, injuryStatus.position, 3);
          const weeklyImpact = await this.calculateWeeklyFantasyImpact(playerId);
          const tradeImplications = await this.analyzeTradeImplications(playerId, injuryStatus);

          return {
            playerId,
            playerName: injuryStatus.playerName,
            injuryDetails: injuryStatus,
            replacementOptions,
            weeklyImpact,
            tradeImplications
          };
        })
      );

      const validAnalysis = playerAnalysis.filter((analysis): analysis is NonNullable<typeof analysis> => analysis !== null);

      // Calculate overall impact
      const totalFantasyPointsLost = validAnalysis.reduce(
        (sum, analysis) => sum + analysis.weeklyImpact.reduce((weekSum, week) => weekSum + week.pointsLost, 0),
        0
      );

      const averageReplacementValue = validAnalysis.reduce(
        (sum, analysis) => sum + (analysis.replacementOptions[0]?.projectedPoints || 0),
        0
      ) / Math.max(validAnalysis.length, 1);

      const positionScarcityImpact = this.calculatePositionScarcityImpact(validAnalysis);

      // Generate recommendations
      const recommendations = this.generateActionableRecommendations(validAnalysis);

      return {
        overallImpact: {
          totalFantasyPointsLost,
          averageReplacementValue,
          positionScarcityImpact
        },
        playerAnalysis: validAnalysis,
        recommendations
      };

    } catch (error) {
      console.error('Error generating injury impact report:', error);
      throw error;
    }
  }

  // Private methods

  private async checkForInjuryUpdates(): Promise<void> {
    for (const [playerId] of this.monitoredPlayers) {
      await this.checkPlayerInjuryStatus(playerId);
    }
  }

  private async checkPlayerInjuryStatus(playerId: string): Promise<void> {
    try {
      const player = await productionSportsDataService.getPlayerDetails(playerId);
      if (!player) return;

      const currentStatus = this.injuryStatuses.get(playerId);
      const newStatus = await this.buildInjuryStatus(player);

      // Check if status changed
      if (!currentStatus || this.hasStatusChanged(currentStatus, newStatus)) {
        this.injuryStatuses.set(playerId, newStatus);
        this.saveToStorage();

        // Trigger callbacks
        this.updateCallbacks.forEach(callback => callback(newStatus));

        // Generate alert if necessary
        if (currentStatus && this.shouldGenerateAlert(currentStatus, newStatus)) {
          const alert = this.generateAlert(currentStatus, newStatus);
          this.alertCallbacks.forEach(callback => callback(alert));
        }
      }
    } catch (error) {
      console.error(`Failed to check injury status for player ${playerId}:`, error);
    }
  }

  private async buildInjuryStatus(player: NFLPlayer): Promise<InjuryStatus> {
    const fantasyImpact = await this.calculateFantasyImpact(player);
    const historicalPattern = await this.getHistoricalPattern(player.id);
    const medicalTimeline = this.generateMedicalTimeline(player.injuryStatus);

    return {
      id: `injury_${player.id}_${Date.now()}`,
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      team: player.team,
      injuryType: this.extractInjuryType(player.injuryStatus),
      bodyPart: this.extractBodyPart(player.injuryStatus),
      severity: this.determineSeverity(player.injuryStatus),
      status: player.injuryStatus || 'healthy',
      dateReported: new Date().toISOString(),
      gameImpact: this.determineGameImpact(player.injuryStatus),
      fantasyImpact,
      historicalPattern,
      medicalTimeline,
      newsUpdates: await this.getNewsUpdates(player.id),
      lastUpdated: new Date().toISOString()
    };
  }

  private async calculateFantasyImpact(player: NFLPlayer): Promise<InjuryFantasyImpact> {
    const baseProjection = player.fantasyProjection || 0;
    const injuryImpact = this.getInjuryImpactMultiplier(player.injuryStatus);
    
    return {
      projectionChange: (1 - injuryImpact) * 100,
      weeklyImpact: this.generateWeeklyImpact(baseProjection, injuryImpact),
      replacementOptions: await this.getReplacementRecommendations(player.id, player.position, 5),
      rosteredPercentage: Math.random() * 100, // Mock data
      tradeValue: this.determineTradeValue(player.injuryStatus),
      weeklyRecommendation: this.getWeeklyRecommendation(player.injuryStatus)
    };
  }

  private async getHistoricalPattern(playerId: string): Promise<InjuryHistoricalPattern> {
    // Mock historical data - in production, this would query injury database
    return {
      totalInjuries: Math.floor(Math.random() * 5),
      averageRecoveryTime: Math.floor(Math.random() * 21) + 7, // 7-28 days
      recurrenceRate: Math.random() * 0.3,
      seasonEndingRate: Math.random() * 0.1,
      positionComparison: Math.random() * 2, // Multiplier vs position average
      similarInjuries: []
    };
  }

  private generateMedicalTimeline(injuryStatus?: string): MedicalTimeline {
    if (!injuryStatus || injuryStatus === 'healthy') {
      return {
        phases: [],
        currentPhase: 'healthy',
        expectedMilestones: []
      };
    }

    return {
      phases: [
        {
          phase: 'initial_evaluation',
          description: 'Initial medical evaluation and diagnosis',
          duration: '1-2 days',
          activities: ['MRI/CT scan', 'Doctor consultation', 'Treatment plan'],
          riskFactors: ['Delayed diagnosis', 'Severity underestimation']
        },
        {
          phase: 'treatment',
          description: 'Active treatment and recovery',
          duration: '1-4 weeks',
          activities: ['Physical therapy', 'Rest', 'Medical treatment'],
          riskFactors: ['Reinjury', 'Slow healing']
        },
        {
          phase: 'return_to_play',
          description: 'Gradual return to football activities',
          duration: '1-2 weeks',
          activities: ['Limited practice', 'Full practice', 'Game clearance'],
          riskFactors: ['Rushed return', 'Practice limitations']
        }
      ],
      currentPhase: 'treatment',
      nextMilestone: 'Limited practice participation',
      expectedMilestones: ['Full practice', 'Game clearance']
    };
  }

  private async getNewsUpdates(playerId: string): Promise<InjuryNewsUpdate[]> {
    // Mock news updates - in production, this would fetch from news APIs
    return [
      {
        id: `news_${playerId}_1`,
        timestamp: new Date().toISOString(),
        source: 'ESPN',
        headline: 'Player expected to return soon',
        content: 'Coach optimistic about return timeline',
        impact: 'POSITIVE',
        credibility: 85,
        keyQuotes: ['Coach says player is progressing well']
      }
    ];
  }

  private hasStatusChanged(current: InjuryStatus, updated: InjuryStatus): boolean {
    return current.status !== updated.status ||
           current.severity !== updated.severity ||
           current.gameImpact !== updated.gameImpact;
  }

  private shouldGenerateAlert(current: InjuryStatus, updated: InjuryStatus): boolean {
    const player = this.monitoredPlayers.get(current.playerId);
    if (!player) return false;

    if (updated.status !== 'healthy' && current.status === 'healthy') {
      return player.alertPreferences.newInjuries;
    }

    if (current.status !== updated.status) {
      return player.alertPreferences.statusChanges;
    }

    return false;
  }

  private generateAlert(current: InjuryStatus, updated: InjuryStatus): InjuryAlert {
    let alertType: InjuryAlert['alertType'] = 'STATUS_CHANGE';
    let severity: InjuryAlert['severity'] = 'MEDIUM';
    let message = '';

    if (updated.status !== 'healthy' && current.status === 'healthy') {
      alertType = 'NEW_INJURY';
      severity = updated.severity === 'SEVERE' || updated.severity === 'SEASON_ENDING' ? 'HIGH' : 'MEDIUM';
      message = `${updated.playerName} has been listed as ${updated.status} with ${updated.injuryType}`;
    } else if (current.status !== updated.status) {
      severity = updated.status === 'healthy' ? 'LOW' : 'MEDIUM';
      message = `${updated.playerName} status changed from ${current.status} to ${updated.status}`;
    }

    return {
      id: `alert_${updated.playerId}_${Date.now()}`,
      playerId: updated.playerId,
      playerName: updated.playerName,
      team: updated.team,
      alertType,
      severity,
      message,
      actionRequired: severity === 'HIGH',
      fantasyActions: this.generateFantasyActions(updated),
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  }

  private generateFantasyActions(status: InjuryStatus): string[] {
    const actions: string[] = [];

    if (status.status === 'out') {
      actions.push('Consider benching or finding replacement');
      actions.push('Check waiver wire for alternatives');
    } else if (status.status === 'doubtful') {
      actions.push('Have backup plan ready');
      actions.push('Monitor practice reports');
    } else if (status.status === 'questionable') {
      actions.push('Monitor game-time decision');
      actions.push('Consider flex options');
    }

    return actions;
  }

  private async getRecentAlerts(hours: number): Promise<InjuryAlert[]> {
    // Mock implementation - in production, would query alert history
    return [];
  }

  private calculateWeeklyImpact(): WeeklyInjuryImpact {
    const currentWeek = Math.floor(Math.random() * 18) + 1;
    return {
      week: currentWeek,
      totalPlayersAffected: this.getAllInjuryStatuses().filter(s => s.status !== 'healthy').length,
      fantasyPointsLost: Math.random() * 100,
      positionBreakdown: {
        QB: Math.random() * 10,
        RB: Math.random() * 15,
        WR: Math.random() * 20,
        TE: Math.random() * 8
      },
      severityBreakdown: {
        MINOR: Math.random() * 10,
        MODERATE: Math.random() * 8,
        SEVERE: Math.random() * 5,
        SEASON_ENDING: Math.random() * 2
      }
    };
  }

  private calculateInjuryTrends(): InjuryTrendData[] {
    return ['QB', 'RB', 'WR', 'TE'].map(position => ({
      position,
      trend: ['INCREASING', 'DECREASING', 'STABLE'][Math.floor(Math.random() * 3)] as any,
      weeklyCount: Array.from({ length: 18 }, () => Math.floor(Math.random() * 5)),
      seasonTotal: Math.floor(Math.random() * 50),
      averageRecoveryTime: Math.floor(Math.random() * 21) + 7
    }));
  }

  private extractInjuryType(status?: string): string {
    if (!status || status === 'healthy') return 'None';
    const injuries = ['Hamstring', 'Ankle', 'Knee', 'Shoulder', 'Concussion', 'Back', 'Groin'];
    return injuries[Math.floor(Math.random() * injuries.length)];
  }

  private extractBodyPart(status?: string): string {
    if (!status || status === 'healthy') return 'None';
    const bodyParts = ['Lower leg', 'Upper leg', 'Knee', 'Shoulder', 'Head', 'Back', 'Hip'];
    return bodyParts[Math.floor(Math.random() * bodyParts.length)];
  }

  private determineSeverity(status?: string): InjuryStatus['severity'] {
    if (!status || status === 'healthy') return 'MINOR';
    if (status === 'out') return Math.random() > 0.7 ? 'SEVERE' : 'MODERATE';
    if (status === 'doubtful') return 'MODERATE';
    return 'MINOR';
  }

  private determineGameImpact(status?: string): InjuryStatus['gameImpact'] {
    if (!status || status === 'healthy') return 'NONE';
    if (status === 'out') return 'OUT';
    if (status === 'doubtful') return 'DOUBTFUL';
    if (status === 'questionable') return 'LIMITED';
    return 'NONE';
  }

  private getInjuryImpactMultiplier(status?: string): number {
    switch (status) {
      case 'out': return 0;
      case 'doubtful': return 0.3;
      case 'questionable': return 0.7;
      default: return 1;
    }
  }

  private generateWeeklyImpact(baseProjection: number, impactMultiplier: number): { [week: number]: number } {
    const weeklyImpact: { [week: number]: number } = {};
    for (let week = 1; week <= 18; week++) {
      weeklyImpact[week] = baseProjection * impactMultiplier;
    }
    return weeklyImpact;
  }

  private determineTradeValue(status?: string): InjuryFantasyImpact['tradeValue'] {
    if (!status || status === 'healthy') return 'HOLD';
    if (status === 'out') return 'SELL_LOW';
    if (status === 'doubtful') return 'SELL_LOW';
    return 'HOLD';
  }

  private getWeeklyRecommendation(status?: string): InjuryFantasyImpact['weeklyRecommendation'] {
    if (!status || status === 'healthy') return 'START';
    if (status === 'out') return 'BENCH';
    if (status === 'doubtful') return 'BENCH';
    if (status === 'questionable') return 'FLEX';
    return 'START';
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('injury_monitored_players', JSON.stringify(Array.from(this.monitoredPlayers.entries())));
      localStorage.setItem('injury_statuses', JSON.stringify(Array.from(this.injuryStatuses.entries())));
    } catch (error) {
      console.error('Failed to save injury tracking data to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const monitoredData = localStorage.getItem('injury_monitored_players');
      if (monitoredData) {
        const entries = JSON.parse(monitoredData);
        this.monitoredPlayers = new Map(entries);
      }

      const statusesData = localStorage.getItem('injury_statuses');
      if (statusesData) {
        const entries = JSON.parse(statusesData);
        this.injuryStatuses = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load injury tracking data from storage:', error);
    }
  }

  // Enhanced helper methods for improved functionality

  private async getAvailablePlayersByPosition(position: string, availablePlayers?: string[]): Promise<NFLPlayer[]> {
    // In a real implementation, this would query available players from league data
    // For now, mock some available players
    const mockPlayers: NFLPlayer[] = [];
    for (let i = 0; i < 20; i++) {
      mockPlayers.push({
        id: `available_${position}_${i}`,
        name: `Available ${position} ${i + 1}`,
        position,
        team: ['BUF', 'MIA', 'NE', 'NYJ', 'BAL', 'CIN', 'CLE', 'PIT'][Math.floor(Math.random() * 8)],
        jerseyNumber: Math.floor(Math.random() * 99) + 1,
        stats: {
          fantasyPoints: Math.random() * 20 + 5
        },
        fantasyProjection: Math.random() * 15 + 3
      });
    }
    return mockPlayers;
  }

  private async getPlayerMLPrediction(playerId: string): Promise<any> {
    try {
      return await machineLearningPlayerPredictionService.generatePlayerPrediction(playerId, 1, 2024);
    } catch (error) {
      console.error('Error getting ML prediction:', error);
      return null;
    }
  }

  private async calculateMatchupDifficulty(playerId: string): Promise<number> {
    // Mock implementation - would analyze opponent defense rankings
    return 0.3 + Math.random() * 0.7; // 0.3-1.0 scale
  }

  private async calculatePlayerAvailability(playerId: string, leagueSize?: number): Promise<number> {
    // Mock implementation - would check roster ownership across leagues
    const baseAvailability = 100 - Math.random() * 80; // 20-100% availability
    const leagueAdjustment = leagueSize ? Math.max(0.8, 1 - (leagueSize - 10) * 0.02) : 1;
    return Math.min(100, baseAvailability * leagueAdjustment);
  }

  private calculateEmergencyValue(player: NFLPlayer, position: string, scoringSystem?: string): number {
    const baseValue = player.fantasyProjection || 5;
    let positionMultiplier = 1.0;
    if (position === 'RB') {
      positionMultiplier = 1.2;
    } else if (position === 'TE') {
      positionMultiplier = 1.3;
    }

    let scoringMultiplier = 1.0;
    if (scoringSystem === 'ppr') {
      scoringMultiplier = 1.15;
    } else if (scoringSystem === 'half-ppr') {
      scoringMultiplier = 1.075;
    }
    
    return baseValue * positionMultiplier * scoringMultiplier;
  }

  private calculateReplacementScore(
    projectedPoints: number,
    availability: number,
    matchupDifficulty: number,
    emergencyValue: number
  ): number {
    // Weighted scoring for replacement value
    const pointsWeight = 0.4;
    const availabilityWeight = 0.3;
    const matchupWeight = 0.2;
    const emergencyWeight = 0.1;

    return (
      projectedPoints * pointsWeight +
      (availability / 100) * 20 * availabilityWeight +
      (1 - matchupDifficulty) * 15 * matchupWeight +
      emergencyValue * emergencyWeight
    );
  }

  private async getWeeklyProjections(playerId: string): Promise<{ week: number; projection: number }[]> {
    // Mock weekly projections - would use ML service
    const projections = [];
    for (let week = 1; week <= 18; week++) {
      projections.push({
        week,
        projection: Math.random() * 20 + 5
      });
    }
    return projections;
  }

  private async assessReplacementRisks(playerId: string): Promise<string[]> {
    const risks = [];
    
    // Mock risk assessment
    if (Math.random() > 0.7) risks.push('Injury history');
    if (Math.random() > 0.8) risks.push('Limited playing time');
    if (Math.random() > 0.75) risks.push('Inconsistent performance');
    if (Math.random() > 0.85) risks.push('Tough remaining schedule');
    
    return risks;
  }

  private async getUpcomingSchedule(team: string): Promise<{ week: number; opponent: string; difficulty: number }[]> {
    // Mock schedule data
    const opponents = ['BUF', 'MIA', 'NE', 'NYJ', 'BAL', 'CIN', 'CLE', 'PIT'];
    const schedule = [];
    
    for (let week = 1; week <= 5; week++) {
      schedule.push({
        week,
        opponent: opponents[Math.floor(Math.random() * opponents.length)],
        difficulty: Math.random() // 0-1, higher = more difficult
      });
    }
    
    return schedule;
  }

  private async analyzePlayerWorkload(playerId: string): Promise<{
    snapsPercentage: number;
    touchesPerGame: number;
    redZoneTargets: number;
    injuryRiskFromWorkload: number;
  }> {
    // Mock workload analysis
    return {
      snapsPercentage: 60 + Math.random() * 35, // 60-95%
      touchesPerGame: Math.random() * 20 + 5,   // 5-25 touches
      redZoneTargets: Math.random() * 3,        // 0-3 per game
      injuryRiskFromWorkload: Math.random() * 0.3 + 0.1 // 0.1-0.4
    };
  }

  private calculateAgeFactor(player: NFLPlayer): { age: number; riskMultiplier: number } {
    // Mock age calculation - would get real age from player data
    const age = 22 + Math.random() * 10; // 22-32 years old
    let riskMultiplier = 1.0;
    if (age > 30) {
      riskMultiplier = 1.3;
    } else if (age > 28) {
      riskMultiplier = 1.1;
    }
    
    return { age, riskMultiplier };
  }

  private getPositionInjuryRisk(position: string): number {
    const riskMap: { [key: string]: number } = {
      'RB': 0.75,  // High injury risk
      'WR': 0.45,  // Moderate injury risk
      'TE': 0.50,  // Moderate injury risk
      'QB': 0.35,  // Lower injury risk
      'K': 0.15,   // Very low injury risk
      'DEF': 0.20  // Low injury risk
    };
    
    return riskMap[position] || 0.5;
  }

  private generatePreventiveMeasures(riskFactors: string[], position: string): string[] {
    const measures: string[] = [];
    
    if (riskFactors.includes('High snap count usage')) {
      measures.push('Monitor snap count and consider rest');
    }
    
    if (riskFactors.includes('Age-related injury risk increase')) {
      measures.push('Focus on recovery and maintenance');
    }
    
    if (position === 'RB') {
      measures.push('Handcuff strategy recommended');
    }
    
    measures.push('Stay updated on practice reports');
    measures.push('Have backup options identified');
    
    return measures;
  }

  private async checkESPNInjuryReports(): Promise<InjuryAlert[]> {
    // Mock ESPN injury report checking
    return [];
  }

  private async checkPracticeReports(): Promise<InjuryAlert[]> {
    // Mock practice report checking
    return [];
  }

  private async checkEmergencyAlerts(): Promise<InjuryAlert[]> {
    // Mock emergency alert checking
    return [];
  }

  private async processRealTimeNotifications(alerts: InjuryAlert[]): Promise<void> {
    // Process notifications for each alert
    for (const alert of alerts) {
      const player = this.monitoredPlayers.get(alert.playerId);
      if (player) {
        // Send notifications based on preferences
        this.alertCallbacks.forEach(callback => callback(alert));
      }
    }
  }

  private async calculateWeeklyFantasyImpact(playerId: string): Promise<{ week: number; pointsLost: number }[]> {
    const impact = [];
    const status = this.getPlayerInjuryStatus(playerId);
    const baseProjection = 10; // Default base projection
    
    for (let week = 1; week <= 18; week++) {
      impact.push({
        week,
        pointsLost: status?.status === 'out' ? baseProjection : baseProjection * 0.3
      });
    }
    
    return impact;
  }

  private async analyzeTradeImplications(playerId: string, injuryStatus: InjuryStatus): Promise<{
    currentValue: number;
    injuredValue: number;
    recommendedAction: RecommendedAction;
  }> {
    const currentValue = 100; // Mock current trade value
    let injuryImpact = 0.8; // Default mild impact
    if (injuryStatus.severity === 'SEVERE') {
      injuryImpact = 0.3;
    } else if (injuryStatus.severity === 'MODERATE') {
      injuryImpact = 0.6;
    }
    const injuredValue = currentValue * injuryImpact;
    
    let recommendedAction: RecommendedAction;
    if (injuryStatus.severity === 'SEASON_ENDING') {
      recommendedAction = 'waiver';
    } else if (injuredValue < currentValue * 0.4) {
      recommendedAction = 'trade';
    } else {
      recommendedAction = 'hold';
    }
    
    return { currentValue, injuredValue, recommendedAction };
  }

  private calculatePositionScarcityImpact(analyses: any[]): number {
    // Calculate how much the injuries affect position scarcity
    const positionCounts = analyses.reduce((acc, analysis) => {
      acc[analysis.injuryDetails.position] = (acc[analysis.injuryDetails.position] || 0) + 1;
      return acc;
    }, {} as { [position: string]: number });
    
    // Higher impact for positions with more injuries
    let totalImpact = 0;
    Object.entries(positionCounts).forEach(([position, count]) => {
      let positionMultiplier = 1.0;
      if (position === 'RB') {
        positionMultiplier = 1.3;
      } else if (position === 'TE') {
        positionMultiplier = 1.2;
      }
      totalImpact += (count as number) * positionMultiplier;
    });
    
    return totalImpact;
  }

  private generateActionableRecommendations(analyses: any[]): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    
    analyses.forEach(analysis => {
      if (analysis.injuryDetails.status === 'out') {
        immediate.push(`Start ${analysis.replacementOptions[0]?.name || 'backup option'} for ${analysis.playerName}`);
      }
      
      if (analysis.injuryDetails.severity === 'MODERATE') {
        shortTerm.push(`Monitor ${analysis.playerName} practice reports closely`);
      }
      
      if (analysis.tradeImplications.recommendedAction === 'trade') {
        longTerm.push(`Consider trading ${analysis.playerName} before value drops further`);
      }
    });
    
    return { immediate, shortTerm, longTerm };
  }
}

// Export singleton instance
export const injuryTrackingService = new InjuryTrackingService();
export default injuryTrackingService;
