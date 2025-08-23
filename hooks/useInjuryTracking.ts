/**
 * Injury Tracking Hook
 * React hook for managing injury tracking state and subscriptions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  injuryTrackingService,
  InjuryStatus,
  InjuryAlert,
  MonitoredPlayer,
  InjuryDashboardData,
  ReplacementPlayer
} from '../services/injuryTrackingService';

type PlayerPriority = 'LOW' | 'MEDIUM' | 'HIGH';

interface UseInjuryTrackingOptions {
  autoStart?: boolean;
  playerId?: string;
  playerIds?: string[];
  alertCallback?: (alert: InjuryAlert) => void;
  updateCallback?: (status: InjuryStatus) => void;
}

interface UseInjuryTrackingReturn {
  // State
  dashboardData: InjuryDashboardData | null;
  monitoredPlayers: MonitoredPlayer[];
  recentAlerts: InjuryAlert[];
  isMonitoring: boolean;
  loading: boolean;
  error: string | null;

  // Player-specific data
  playerStatus: InjuryStatus | null;
  playerAlerts: InjuryAlert[];
  replacementOptions: ReplacementPlayer[];

  // Actions
  addPlayer: (playerId: string, playerName: string, priority?: PlayerPriority) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerPriority: (playerId: string, priority: PlayerPriority) => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  refreshData: () => Promise<void>;
  dismissAlert: (alertId: string) => void;
  getFantasyImpact: (playerId: string) => Promise<any>;

  // Computed values
  activeInjuries: InjuryStatus[];
  criticalAlerts: InjuryAlert[];
  highPriorityPlayers: MonitoredPlayer[];
  injuryCount: number;
  alertCount: number;
}

export const useInjuryTracking = (options: UseInjuryTrackingOptions = {}): UseInjuryTrackingReturn => {
  const {
    autoStart = true,
    playerId,
    playerIds = [],
    alertCallback,
    updateCallback
  } = options;

  // State
  const [dashboardData, setDashboardData] = useState<InjuryDashboardData | null>(null);
  const [monitoredPlayers, setMonitoredPlayers] = useState<MonitoredPlayer[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<InjuryAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Player-specific state
  const [playerStatus, setPlayerStatus] = useState<InjuryStatus | null>(null);
  const [playerAlerts, setPlayerAlerts] = useState<InjuryAlert[]>([]);
  const [replacementOptions, setReplacementOptions] = useState<ReplacementPlayer[]>([]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await injuryTrackingService.getInjuryDashboard();
      setDashboardData(data);

      const players = injuryTrackingService.getMonitoredPlayers();
      setMonitoredPlayers(players);

      // Load player-specific data if playerId is provided
      if (playerId) {
        const status = injuryTrackingService.getPlayerInjuryStatus(playerId);
        setPlayerStatus(status);

        if (status) {
          const replacements = await injuryTrackingService.getReplacementRecommendations(
            playerId,
            status.position,
            5
          );
          setReplacementOptions(replacements);
        }
      }
    } catch (err) {
      console.error('Failed to load injury tracking data:', err);
      setError('Failed to load injury data');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  // Setup subscriptions
  useEffect(() => {
    const handleAlert = (alert: InjuryAlert) => {
      setRecentAlerts(prev => [alert, ...prev.slice(0, 19)]); // Keep last 20 alerts

      // Filter alerts for specific player
      if (playerId && alert.playerId === playerId) {
        setPlayerAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 player alerts
      }

      // Filter alerts for specific player list
      if (playerIds.length > 0 && playerIds.includes(alert.playerId)) {
        setPlayerAlerts(prev => [alert, ...prev.slice(0, 9)]);
      }

      // Call external callback
      alertCallback?.(alert);
    };

    const handleStatusUpdate = (status: InjuryStatus) => {
      // Update player-specific status
      if (playerId && status.playerId === playerId) {
        setPlayerStatus(status);
      }

      // Refresh dashboard data
      loadDashboardData();

      // Call external callback
      updateCallback?.(status);
    };

    // Subscribe to updates
    injuryTrackingService.onInjuryAlert(handleAlert);
    injuryTrackingService.onInjuryStatusUpdate(handleStatusUpdate);

    return () => {
      // Cleanup subscriptions would go here if the service supported unsubscribe
    };
  }, [playerId, playerIds, alertCallback, updateCallback, loadDashboardData]);

  // Auto-start monitoring
  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    // Initial data load
    loadDashboardData();
  }, [autoStart, loadDashboardData]);

  // Actions
  const addPlayer = useCallback((
    playerIdToAdd: string,
    playerName: string,
    priority: PlayerPriority = 'MEDIUM'
  ) => {
    injuryTrackingService.addMonitoredPlayer(
      playerIdToAdd,
      playerName,
      {}, // Default preferences
      priority,
      ['USER_ADDED']
    );
    
    setMonitoredPlayers(injuryTrackingService.getMonitoredPlayers());
  }, []);

  const removePlayer = useCallback((playerIdToRemove: string) => {
    injuryTrackingService.removeMonitoredPlayer(playerIdToRemove);
    setMonitoredPlayers(injuryTrackingService.getMonitoredPlayers());

    // Clear player-specific data if it was the current player
    if (playerId === playerIdToRemove) {
      setPlayerStatus(null);
      setPlayerAlerts([]);
      setReplacementOptions([]);
    }
  }, [playerId]);

  const updatePlayerPriority = useCallback((
    playerIdToUpdate: string,
    priority: PlayerPriority
  ) => {
    const player = monitoredPlayers.find(p => p.playerId === playerIdToUpdate);
    if (player) {
      // Remove and re-add with new priority
      injuryTrackingService.removeMonitoredPlayer(playerIdToUpdate);
      injuryTrackingService.addMonitoredPlayer(
        playerIdToUpdate,
        player.playerName,
        player.alertPreferences,
        priority,
        player.tags
      );
      setMonitoredPlayers(injuryTrackingService.getMonitoredPlayers());
    }
  }, [monitoredPlayers]);

  const startMonitoring = useCallback(() => {
    injuryTrackingService.startMonitoring();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    injuryTrackingService.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  const refreshData = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  const dismissAlert = useCallback((alertId: string) => {
    setRecentAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setPlayerAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const getFantasyImpact = useCallback(async (playerIdForImpact: string) => {
    return await injuryTrackingService.getFantasyImpactAnalysis(playerIdForImpact);
  }, []);

  // Computed values
  const activeInjuries = useMemo(() => {
    return injuryTrackingService.getAllInjuryStatuses()
      .filter(status => status.status !== 'healthy');
  }, [dashboardData]);

  const criticalAlerts = useMemo(() => {
    return recentAlerts.filter(alert => 
      alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
    );
  }, [recentAlerts]);

  const highPriorityPlayers = useMemo(() => {
    return monitoredPlayers.filter(player => player.priority === 'HIGH');
  }, [monitoredPlayers]);

  const injuryCount = useMemo(() => {
    return activeInjuries.length;
  }, [activeInjuries]);

  const alertCount = useMemo(() => {
    return recentAlerts.length;
  }, [recentAlerts]);

  return {
    // State
    dashboardData,
    monitoredPlayers,
    recentAlerts,
    isMonitoring,
    loading,
    error,

    // Player-specific data
    playerStatus,
    playerAlerts,
    replacementOptions,

    // Actions
    addPlayer,
    removePlayer,
    updatePlayerPriority,
    startMonitoring,
    stopMonitoring,
    refreshData,
    dismissAlert,
    getFantasyImpact,

    // Computed values
    activeInjuries,
    criticalAlerts,
    highPriorityPlayers,
    injuryCount,
    alertCount
  };
};

export default useInjuryTracking;
