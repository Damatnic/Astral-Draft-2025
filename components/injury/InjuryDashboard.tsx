/**
 * Injury Dashboard Component
 * Comprehensive injury monitoring dashboard with real-time alerts and management tools
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import Tabs from '../ui/Tabs';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Bell,
  Settings,
  Plus,
  X,
  Heart,
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3,
  Search
} from 'lucide-react';
import {
  injuryTrackingService,
  InjuryDashboardData,
  InjuryAlert,
  MonitoredPlayer
} from '../../services/injuryTrackingService';

interface InjuryDashboardProps {
  className?: string;
}

interface PlayerSearchResult {
  playerId: string;
  name: string;
  position: string;
  team: string;
  currentInjuryStatus?: string;
}

const InjuryDashboard: React.FC<InjuryDashboardProps> = ({ className = '' }) => {
  const [dashboardData, setDashboardData] = useState<InjuryDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<InjuryAlert[]>([]);
  const [monitoredPlayers, setMonitoredPlayers] = useState<MonitoredPlayer[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);

  useEffect(() => {
    loadDashboardData();
    setupSubscriptions();
    injuryTrackingService.startMonitoring();

    return () => {
      injuryTrackingService.stopMonitoring();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await injuryTrackingService.getInjuryDashboard();
      setDashboardData(data);
      setMonitoredPlayers(injuryTrackingService.getMonitoredPlayers());
    } catch (error) {
      console.error('Failed to load injury dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSubscriptions = () => {
    injuryTrackingService.onInjuryAlert((alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    });

    injuryTrackingService.onInjuryStatusUpdate(() => {
      loadDashboardData(); // Refresh dashboard on updates
    });
  };

  const handleAddPlayer = (playerId: string, playerName: string, position: string) => {
    injuryTrackingService.addMonitoredPlayer(
      playerId,
      playerName,
      {}, // Default preferences
      'MEDIUM',
      ['WATCHLIST']
    );
    setMonitoredPlayers(injuryTrackingService.getMonitoredPlayers());
    setShowAddPlayer(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemovePlayer = (playerId: string) => {
    injuryTrackingService.removeMonitoredPlayer(playerId);
    setMonitoredPlayers(injuryTrackingService.getMonitoredPlayers());
  };

  const handlePlayerSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    // Mock search results - in production, would search player database
    const mockResults: PlayerSearchResult[] = [
      { playerId: 'search_1', name: 'Test Player 1', position: 'RB', team: 'TB' },
      { playerId: 'search_2', name: 'Test Player 2', position: 'WR', team: 'KC' },
      { playerId: 'search_3', name: 'Test Player 3', position: 'QB', team: 'BUF' }
    ].filter((player: any) => 
      player.name.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(mockResults);
  }, []);

  const getInjuryStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'questionable': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'doubtful': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'out': return <X className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInjuryStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'questionable': return 'secondary';
      case 'doubtful': return 'destructive';
      case 'out': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-l-red-500';
      case 'HIGH': return 'border-l-orange-500';
      case 'MEDIUM': return 'border-l-yellow-500';
      default: return 'border-l-green-500';
    }
  };

  const getTrendBadgeVariant = (trend: string) => {
    switch (trend) {
      case 'INCREASING': return 'destructive';
      case 'DECREASING': return 'default';
      default: return 'secondary';
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

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 animate-pulse text-red-500" />
            Loading Injury Dashboard...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Failed to load injury dashboard data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`injury-dashboard ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Injury Tracking Dashboard
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">
                {dashboardData.totalMonitoredPlayers} monitored
              </Badge>
              {dashboardData.activeInjuries > 0 && (
                <Badge variant="destructive">
                  {dashboardData.activeInjuries} injured
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monitored Players</p>
                    <p className="text-2xl font-bold">{dashboardData.totalMonitoredPlayers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Injuries</p>
                    <p className="text-2xl font-bold">{dashboardData.activeInjuries}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Recent Alerts</p>
                    <p className="text-2xl font-bold">{alerts.length}</p>
                  </div>
                  <Bell className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Fantasy Impact</p>
                    <p className="text-2xl font-bold">{dashboardData.weeklyImpact.fantasyPointsLost.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">pts lost</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs
            items={[
              { id: 'overview', label: 'Overview' },
              { id: 'monitored', label: 'Monitored Players' },
              { id: 'alerts', label: 'Alerts' },
              { id: 'trends', label: 'Trends' }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Critical Updates */}
                {dashboardData.criticalUpdates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Critical Injury Updates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.criticalUpdates.map((injury) => (
                          <div key={injury.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center gap-3">
                              {getInjuryStatusIcon(injury?.status)}
                              <div>
                                <p className="font-medium">{injury.playerName}</p>
                                <p className="text-sm text-gray-600">{injury.team} • {injury.position} • {injury?.injuryType}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={getInjuryStatusBadgeVariant(injury?.status)}>
                                {injury?.status}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(injury.lastUpdated)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Replacement Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Recommended Replacements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.replacementRecommendations.map((player) => (
                        <div key={player.playerId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-gray-600">{player.team} • {player.position}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{player.projectedPoints.toFixed(1)} pts</p>
                            <p className="text-xs text-gray-500">{player.availabilityPercentage}% available</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Impact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Week {dashboardData.weeklyImpact.week} Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(dashboardData.weeklyImpact.positionBreakdown).map(([position, count]) => (
                        <div key={position} className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-lg font-bold">{count.toFixed(0)}</p>
                          <p className="text-sm text-gray-600">{position} affected</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'monitored' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Monitored Players ({monitoredPlayers.length})</h3>
                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Player
                  </button>
                </div>

                {/* Add Player Modal */}
                {showAddPlayer && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Search className="h-5 w-5" />
                          Add Player to Monitor
                        </div>
                        <button
                          onClick={() => setShowAddPlayer(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Search for players..."
                          value={searchQuery}
                          onChange={(e: any) => {
                            setSearchQuery(e.target.value);
                            handlePlayerSearch(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        
                        {searchResults.length > 0 && (
                          <div className="space-y-2">
                            {searchResults.map((player) => (
                              <button
                                key={player.playerId}
                                type="button"
                                className="w-full flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50 text-left"
                                onClick={() => handleAddPlayer(player.playerId, player.name, player.position)}
                              >
                                <div>
                                  <p className="font-medium">{player.name}</p>
                                  <p className="text-sm text-gray-600">{player.team} • {player.position}</p>
                                </div>
                                <Plus className="h-4 w-4 text-blue-600" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Monitored Players List */}
                <div className="space-y-3">
                  {monitoredPlayers.map((player) => {
                    const status = injuryTrackingService.getPlayerInjuryStatus(player.playerId);
                    return (
                      <Card key={player.playerId}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {status && getInjuryStatusIcon(status?.status)}
                              <div>
                                <p className="font-medium">{player.playerName}</p>
                                <p className="text-sm text-gray-600">
                                  Priority: {player.priority} • Added: {new Date(player.addedAt).toLocaleDateString()}
                                </p>
                                {status && (
                                  <p className="text-sm">
                                    Status: <Badge variant={getInjuryStatusBadgeVariant(status?.status)}>
                                      {status?.status}
                                    </Badge>
                                    {status?.injuryType !== 'None' && (
                                      <span className="ml-2 text-gray-600">({status?.injuryType})</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => console.log('Open player details for', player.playerId)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Settings className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemovePlayer(player.playerId)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {monitoredPlayers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No players being monitored</p>
                    <button
                      onClick={() => setShowAddPlayer(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Your First Player
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Alerts</h3>
                
                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map((alert) => {
                      const borderColor = getSeverityBorderColor(alert.severity);
                      return (
                        <Card key={alert.id} className={`border-l-4 ${borderColor}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`font-medium ${getSeverityColor(alert.severity)}`}>
                                    {alert.alertType.replace('_', ' ')}
                                  </span>
                                  <Badge variant="outline">{alert.severity}</Badge>
                                </div>
                                <p className="font-medium mb-1">{alert.message}</p>
                                <p className="text-sm text-gray-600">{alert.team}</p>
                                
                                {alert.fantasyActions.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Recommended Actions:</p>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                      {alert.fantasyActions.map((action) => (
                                        <li key={action} className="flex items-start gap-2">
                                          <span className="text-blue-600">•</span>
                                          {action}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <p>{formatTimeAgo(alert.timestamp)}</p>
                                {alert.actionRequired && (
                                  <Badge variant="destructive" className="mt-1">Action Required</Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent alerts</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Injury Trends by Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData?.injuryTrends.map((trend) => {
                        const badgeVariant = getTrendBadgeVariant(trend.trend);
                        return (
                          <div key={trend.position} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {trend.trend === 'INCREASING' && <TrendingUp className="h-4 w-4 text-red-600" />}
                                {trend.trend === 'DECREASING' && <TrendingDown className="h-4 w-4 text-green-600" />}
                                {trend.trend === 'STABLE' && <Activity className="h-4 w-4 text-blue-600" />}
                                <span className="font-medium">{trend.position}</span>
                              </div>
                              <Badge variant={badgeVariant}>
                                {trend.trend}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{trend.seasonTotal} total</p>
                              <p className="text-sm text-gray-600">{trend.averageRecoveryTime}d avg recovery</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InjuryDashboard;
