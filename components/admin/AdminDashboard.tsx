/**
 * Admin Dashboard Component
 * Main dashboard interface for platform administration
 */

import React, { useState, useEffect } from 'react';
import {
  adminService,
  AdminDashboardData,
  UserSummary,
  ContestSummary,
  type OracleMetrics
} from '../../services/adminService';

// Dashboard overview component
const DashboardOverview: React.FC<{ data: AdminDashboardData['overview'] }> = ({ data }) => {
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Users */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{data.totalUsers.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <span className="text-2xl">👥</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{data.activeUsers} active users</p>
      </div>

      {/* Total Contests */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Contests</p>
            <p className="text-2xl font-bold text-gray-900">{data.totalContests.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <span className="text-2xl">🏆</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{data.activeContests} active contests</p>
      </div>

      {/* Total Revenue */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">${data.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <span className="text-2xl">💰</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">${data.todayRevenue} today</p>
      </div>

      {/* System Health */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">System Health</p>
            <p className={`text-2xl font-bold ${getHealthColor(data.systemHealth)}`}>
              {data.systemHealth.toUpperCase()}
            </p>
          </div>
          <div className="p-3 bg-orange-100 rounded-full">
            <span className="text-2xl">{getHealthIcon(data.systemHealth)}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{data.pendingIssues} pending issues</p>
      </div>
    </div>
  );
};

// User management component
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    riskLevel: '',
    searchTerm: ''
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await adminService.getAllUsers(1, 50, filters);
      setUsers(result.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
    try {
      const reason = prompt(`Reason for changing status to ${status}:`);
      if (reason) {
        await adminService.updateUserStatus('admin_001', userId, status, reason);
        loadUsers();
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 7) return 'bg-red-100 text-red-800';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">User Management</h3>
        
        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search users..."
            value={filters.searchTerm}
            onChange={(e: any) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters?.status}
            onChange={(e: any) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
          <select
            value={filters.riskLevel}
            onChange={(e: any) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low Risk (0-3)</option>
            <option value="medium">Medium Risk (4-6)</option>
            <option value="high">High Risk (7+)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : (
              <>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user?.status)}`}>
                      {user?.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadgeColor(user.riskScore)}`}>
                      {user.riskScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{user.totalContests} contests</div>
                    <div>${user.totalSpent} spent</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${user.accountBalance}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(user.id, user?.status === 'active' ? 'suspended' : 'active')}
                        className={`px-3 py-1 rounded text-xs ${
                          user?.status === 'active' 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {user?.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleStatusChange(user.id, 'banned')}
                        className="px-3 py-1 rounded text-xs bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        Ban
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </>
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
};

// Contest management component
const ContestManagement: React.FC = () => {
  const [contests, setContests] = useState<ContestSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    setLoading(true);
    try {
      const result = await adminService.getAllContests(1, 50);
      setContests(result.contests);
    } catch (error) {
      console.error('Failed to load contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelContest = async (contestId: string) => {
    try {
      const reason = prompt('Reason for cancelling contest:');
      if (reason) {
        await adminService.cancelContest('admin_001', contestId, reason);
        loadContests();
      }
    } catch (error) {
      console.error('Failed to cancel contest:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Contest Management</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Create Contest
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contest
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prize Pool
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Loading contests...
                </td>
              </tr>
            ) : (
              <>
                {contests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No contests found
                    </td>
                  </tr>
                ) : (
                  contests.map((contest) => (
                <tr key={contest.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{contest.name}</div>
                      <div className="text-sm text-gray-500">{contest.type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(contest?.status)}`}>
                      {contest?.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contest.participantCount} / {contest.maxParticipants}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(contest.participantCount / contest.maxParticipants) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${contest.prizePool.toLocaleString()}
                    <div className="text-xs text-gray-400">${contest.entryFee} entry</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Start: {new Date(contest.startDate).toLocaleDateString()}</div>
                    <div>End: {new Date(contest.endDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        View
                      </button>
                      {contest?.status === 'active' && (
                        <button
                          onClick={() => handleCancelContest(contest.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </>
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
};

// Oracle metrics component
const OracleMetricsPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<OracleMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await adminService.getOracleMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load Oracle metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="bg-white rounded-lg shadow-md p-6">Loading Oracle metrics...</div>;
  }

  if (!metrics) {
    return <div className="bg-white rounded-lg shadow-md p-6">Failed to load Oracle metrics</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Oracle Performance</h3>
      </div>
      
      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{metrics.totalPredictions}</div>
            <div className="text-sm text-gray-500">Total Predictions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {(metrics.accuracyRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {(metrics.averageConfidence * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Avg Confidence</div>
          </div>
        </div>

        {/* Performance by Category */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Performance by Category</h4>
          <div className="space-y-4">
            {Object.entries(metrics.performanceByCategory).map(([category, stats]) => (
              <div key={category} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{category}</span>
                  <span className="text-sm text-gray-500">{stats.predictions} predictions</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Accuracy</div>
                    <div className="text-lg font-semibold text-green-600">
                      {(stats.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Confidence</div>
                    <div className="text-lg font-semibold text-purple-600">
                      {(stats.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Engagement */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">User Engagement</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{metrics.userEngagement.followingOracle}</div>
              <div className="text-sm text-gray-500">Following Oracle</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {(metrics.userEngagement.averageAgreementRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Agreement Rate</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {(metrics.userEngagement.oracleBeatRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Oracle Beat Rate</div>
            </div>
          </div>
        </div>

        {/* Oracle Controls */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Update Configuration
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
              Trigger Retrain
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main admin dashboard component
const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'contests' | 'payments' | 'oracle' | 'system'>('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'contests', name: 'Contests', icon: '🏆' },
    { id: 'payments', name: 'Payments', icon: '💳' },
    { id: 'oracle', name: 'Oracle', icon: '🔮' },
    { id: 'system', name: 'System', icon: '⚙️' }
  ];

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-600">Loading Admin Dashboard...</div>
          <div className="mt-2 text-gray-500">Please wait while we fetch the latest data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage platform operations and monitor system health</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={loadDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh Data
              </button>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && dashboardData && (
          <div>
            <DashboardOverview data={dashboardData.overview} />
            
            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Users */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {dashboardData.recentActivity.newUsers.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(user.joinDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* System Alerts */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
                </div>
                <div className="p-6">
                  {dashboardData.recentActivity.systemAlerts.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <span className="text-4xl">✅</span>
                      <div className="mt-2">No system alerts</div>
                      <div className="text-sm">All systems are running normally</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.recentActivity.systemAlerts.map((alert) => (
                        <div key={alert.id} className="border-l-4 border-red-400 bg-red-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <span className="text-red-400">⚠️</span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-red-700">{alert.message}</p>
                              <p className="text-xs text-red-500 mt-1">
                                {new Date(alert.lastOccurrence).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'contests' && <ContestManagement />}
        {activeTab === 'oracle' && <OracleMetricsPanel />}
        
        {activeTab === 'payments' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Management</h3>
            <p className="text-gray-500">Payment management interface coming soon...</p>
          </div>
        )}
        
        {activeTab === 'system' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Management</h3>
            <p className="text-gray-500">System management interface coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
