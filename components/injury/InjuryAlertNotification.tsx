/**
 * Injury Alert Notification Component
 * Real-time injury alert notifications with configurable preferences
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  AlertTriangle,
  X,
  Settings,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  ExternalLink
} from 'lucide-react';
import {
  injuryTrackingService,
  InjuryAlert
} from '../../services/injuryTrackingService';

interface InjuryAlertNotificationProps {
  className?: string;
  maxAlerts?: number;
  showSettings?: boolean;
  onDismiss?: (alertId: string) => void;
}

interface NotificationSettings {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHide: boolean;
  autoHideDuration: number; // seconds
  showRecommendations: boolean;
  groupSimilar: boolean;
  soundEnabled: boolean;
}

const InjuryAlertNotification: React.FC<InjuryAlertNotificationProps> = ({
  className = '',
  maxAlerts = 5,
  showSettings = true,
  onDismiss
}) => {
  const [alerts, setAlerts] = useState<InjuryAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    position: 'top-right',
    autoHide: true,
    autoHideDuration: 10,
    showRecommendations: true,
    groupSimilar: false,
    soundEnabled: true
  });

  useEffect(() => {
    loadSettings();
    setupAlertSubscription();
  }, []);

  useEffect(() => {
    if (settings.autoHide) {
      const timer = setTimeout(() => {
        setAlerts(prev => prev.slice(0, -1));
      }, settings.autoHideDuration * 1000);

      return () => clearTimeout(timer);
    }
  }, [alerts, settings.autoHide, settings.autoHideDuration]);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('injury_notification_settings');
      if (saved) {
        setSettings({ ...settings, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    try {
      localStorage.setItem('injury_notification_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const getNotificationFrequency = (severity: string): number => {
    switch (severity) {
      case 'CRITICAL': return 800;
      case 'HIGH': return 600;
      default: return 400;
    }
  };

  const addAlert = (alert: InjuryAlert) => {
    if (dismissedAlerts.has(alert.id)) return;

    setAlerts(prev => {
      const filtered = settings.groupSimilar 
        ? prev.filter((a: any) => a.playerId !== alert.playerId)
        : prev;
      return [alert, ...filtered].slice(0, maxAlerts);
    });

    if (settings.soundEnabled) {
      playNotificationSound(alert.severity);
    }
  };

  const setupAlertSubscription = () => {
    injuryTrackingService.onInjuryAlert(addAlert);
  };

  const playNotificationSound = (severity: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different severities
      const frequency = getNotificationFrequency(severity);
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter((alert: any) => alert.id !== alertId));
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onDismiss?.(alertId);
  };

  const handleDismissAll = () => {
    alerts.forEach((alert: any) => {
      setDismissedAlerts(prev => new Set([...prev, alert.id]));
      onDismiss?.(alert.id);
    });
    setAlerts([]);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'HIGH': return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case 'MEDIUM': return <Activity className="h-4 w-4 text-yellow-600" />;
      default: return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-red-500 bg-red-50';
      case 'HIGH': return 'border-orange-500 bg-orange-50';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-green-500 bg-green-50';
    }
  };

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-left': return 'top-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      default: return 'top-4 right-4';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (alerts.length === 0 && !showSettingsPanel) {
    return null;
  }

  return (
    <>
      {/* Main notification container */}
      <div className={`fixed ${getPositionClasses(settings.position)} z-50 w-96 space-y-3 ${className}`}>
        {/* Settings button */}
        {showSettings && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className="p-2 bg-white rounded-lg shadow-md border hover:bg-gray-50"
            >
              <Settings className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}

        {/* Settings panel */}
        {showSettingsPanel && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Notification Settings</h4>
                  <button
                    onClick={() => setShowSettingsPanel(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="position-select" className="block text-sm font-medium mb-1">Position</label>
                    <select
                      id="position-select"
                      value={settings.position}
                      onChange={(e: any) => saveSettings({ ...settings, position: e.target.value as any })}
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="auto-hide-checkbox" className="text-sm font-medium">Auto Hide</label>
                    <input
                      id="auto-hide-checkbox"
                      type="checkbox"
                      checked={settings.autoHide}
                      onChange={(e: any) => saveSettings({ ...settings, autoHide: e.target.checked })}
                      className="rounded"
                    />
                  </div>

                  {settings.autoHide && (
                    <div>
                      <label htmlFor="duration-slider" className="block text-sm font-medium mb-1">
                        Auto Hide Duration: {settings.autoHideDuration}s
                      </label>
                      <input
                        id="duration-slider"
                        type="range"
                        min="3"
                        max="30"
                        value={settings.autoHideDuration}
                        onChange={(e: any) => saveSettings({ ...settings, autoHideDuration: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label htmlFor="recommendations-checkbox" className="text-sm font-medium">Show Recommendations</label>
                    <input
                      id="recommendations-checkbox"
                      type="checkbox"
                      checked={settings.showRecommendations}
                      onChange={(e: any) => saveSettings({ ...settings, showRecommendations: e.target.checked })}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="sound-checkbox" className="text-sm font-medium">Sound Enabled</label>
                    <input
                      id="sound-checkbox"
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e: any) => saveSettings({ ...settings, soundEnabled: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alert notifications */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {/* Dismiss all button */}
            {alerts.length > 1 && (
              <div className="flex justify-end">
                <button
                  onClick={handleDismissAll}
                  className="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Dismiss All ({alerts.length})
                </button>
              </div>
            )}

            {/* Individual alerts */}
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`border-l-4 shadow-lg animate-slide-in ${getSeverityColor(alert.severity)}`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {alert.alertType.replace('_', ' ')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                        
                        <p className="text-sm font-medium mb-1">{alert.message}</p>
                        <p className="text-xs text-gray-600 mb-2">
                          {alert.team} • {formatTimeAgo(alert.timestamp)}
                        </p>

                        {settings.showRecommendations && alert.fantasyActions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">Quick Actions:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {alert.fantasyActions.slice(0, 2).map((action) => (
                                <li key={action} className="flex items-start gap-1">
                                  <span className="text-blue-600">•</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {alert.actionRequired && (
                          <div className="mt-2 flex items-center gap-2">
                            <ExternalLink className="h-3 w-3 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Action Required</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {settings.autoHide && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{settings.autoHideDuration}s</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Custom styles for animations */}
      <style>
        {`
          @keyframes slide-in {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }
        `}
      </style>
    </>
  );
};

export default InjuryAlertNotification;
