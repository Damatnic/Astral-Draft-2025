import React, { useState, useEffect, useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { 
  accessibilityMonitoringService, 
  AccessibilityMetrics, 
  ViolationTrend,
  ComponentAccessibilityMetric 
} from '../../services/accessibilityMonitoringService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface AccessibilityDashboardProps {
  className?: string;
}

export const AccessibilityDashboard: React.FC<AccessibilityDashboardProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<AccessibilityMetrics | null>(null);
  const [history, setHistory] = useState<AccessibilityMetrics[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<7 | 30 | 90>(30);
  const [selectedComponent, setSelectedComponent] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
    setLastUpdated(new Date().toLocaleString());
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from your testing service
      const historyData = accessibilityMonitoringService.getMetricsHistory();
      setHistory(historyData);
      
      if (historyData.length > 0) {
        setMetrics(historyData[0]); // Most recent metrics
      }
    } catch (error) {
      console.error('Failed to load accessibility dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const trendData = useMemo(() => {
    return accessibilityMonitoringService.getTrendData(selectedTimeRange);
  }, [history, selectedTimeRange]);

  const componentTrendData = useMemo(() => {
    if (selectedComponent === 'all') return trendData;
    return accessibilityMonitoringService.getComponentTrends(selectedComponent, selectedTimeRange);
  }, [trendData, selectedComponent, selectedTimeRange]);

  const overallScore = useMemo(() => {
    if (!metrics) return 0;
    const { violationsByLevel, wcagCompliance } = metrics;
    const violationPenalty = 
      (violationsByLevel.critical * 10) +
      (violationsByLevel.serious * 5) +
      (violationsByLevel.moderate * 2) +
      (violationsByLevel.minor * 1);
    return Math.max(0, Math.min(100, wcagCompliance.levelAA - violationPenalty));
  }, [metrics]);

  const trendDirection = useMemo(() => {
    if (trendData.length < 2) return 'stable';
    const recent = trendData[trendData.length - 1];
    const previous = trendData[trendData.length - 2];
    if (recent.total < previous.total) return 'improving';
    if (recent.total > previous.total) return 'declining';
    return 'stable';
  }, [trendData]);

  if (loading) {
    return (
      <div className={`accessibility-dashboard ${className}`}>
        <div className="loading-state">
          <div className="spinner" aria-label="Loading accessibility dashboard">
            <span className="sr-only">Loading...</span>
          </div>
          <p>Loading accessibility metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`accessibility-dashboard ${className}`}>
        <div className="empty-state">
          <h2>No Accessibility Data Available</h2>
          <p>Run accessibility tests to see metrics and trends.</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Refresh Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`accessibility-dashboard ${className}`}>
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Accessibility Monitoring Dashboard</h1>
          <div className="header-controls">
            <div className="time-range-selector">
              <label htmlFor="timeRange">Time Range:</label>
              <select
                id="timeRange"
                value={selectedTimeRange}
                onChange={(e: any) => setSelectedTimeRange(Number(e.target.value) as 7 | 30 | 90)}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <div className="component-selector">
              <label htmlFor="component">Component:</label>
              <select
                id="component"
                value={selectedComponent}
                onChange={(e: any) => setSelectedComponent(e.target.value)}
              >
                <option value="all">All Components</option>
                {metrics.componentMetrics.map((component: any) => (
                  <option key={component.componentName} value={component.componentName}>
                    {component.componentName}
                  </option>
                ))}
              </select>
            </div>
            <button className="refresh-btn" onClick={loadDashboardData} aria-label="Refresh dashboard">
              🔄 Refresh
            </button>
          </div>
        </div>
        <div className="last-updated">
          Last updated: {lastUpdated}
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Key Metrics Cards */}
        <div className="metrics-cards">
          <MetricCard
            title="Overall Score"
            value={overallScore}
            unit="%"
            trend={trendDirection}
            color={overallScore >= 90 ? 'success' : overallScore >= 70 ? 'warning' : 'danger'}
          />
          <MetricCard
            title="Total Violations"
            value={metrics.totalViolations}
            trend={trendDirection}
            color={metrics.totalViolations === 0 ? 'success' : metrics.totalViolations <= 5 ? 'warning' : 'danger'}
          />
          <MetricCard
            title="WCAG AA Compliance"
            value={Math.round(metrics.wcagCompliance.levelAA)}
            unit="%"
            trend={trendDirection}
            color={metrics.wcagCompliance.levelAA >= 95 ? 'success' : metrics.wcagCompliance.levelAA >= 80 ? 'warning' : 'danger'}
          />
          <MetricCard
            title="Test Coverage"
            value={Math.round(metrics.testCoverage.coveragePercentage)}
            unit="%"
            trend="stable"
            color={metrics.testCoverage.coveragePercentage >= 90 ? 'success' : metrics.testCoverage.coveragePercentage >= 70 ? 'warning' : 'danger'}
          />
        </div>

        {/* Violations Trend Chart */}
        <div className="chart-container">
          <h3>Violations Trend</h3>
          <ViolationTrendChart data={componentTrendData} />
        </div>

        {/* Violation Distribution */}
        <div className="chart-container">
          <h3>Current Violations by Severity</h3>
          <ViolationDistributionChart violationsByLevel={metrics.violationsByLevel} />
        </div>

        {/* Component Status */}
        <div className="component-status">
          <h3>Component Accessibility Status</h3>
          <ComponentStatusTable components={metrics.componentMetrics} />
        </div>

        {/* WCAG Compliance Levels */}
        <div className="wcag-compliance">
          <h3>WCAG Compliance Levels</h3>
          <WCAGComplianceChart wcagCompliance={metrics.wcagCompliance} />
        </div>

        {/* Performance Metrics */}
        <div className="performance-metrics">
          <h3>Performance Metrics</h3>
          <div className="performance-grid">
            <div className="performance-item">
              <span className="label">Test Execution Time:</span>
              <span className="value">{metrics.performanceMetrics.testExecutionTime.toFixed(2)}s</span>
            </div>
            <div className="performance-item">
              <span className="label">Avg Violations per Component:</span>
              <span className="value">{metrics.performanceMetrics.averageViolationsPerComponent.toFixed(1)}</span>
            </div>
            <div className="performance-item">
              <span className="label">Total Components Tested:</span>
              <span className="value">{metrics.testCoverage.testedComponents}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  trend: 'improving' | 'declining' | 'stable';
  color: 'success' | 'warning' | 'danger';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit = '', trend, color }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'improving': return 'Improving';
      case 'declining': return 'Declining';
      default: return 'Stable';
    }
  };

  return (
    <div className={`metric-card metric-card--${color}`}>
      <div className="metric-card__header">
        <h4>{title}</h4>
        <div className={`trend-indicator trend-indicator--${trend}`} title={getTrendText()}>
          {getTrendIcon()}
        </div>
      </div>
      <div className="metric-card__value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="metric-card__trend">
        {getTrendText()}
      </div>
    </div>
  );
};

interface ViolationTrendChartProps {
  data: ViolationTrend[];
}

const ViolationTrendChart: React.FC<ViolationTrendChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map((d: any) => d.date),
    datasets: [
      {
        label: 'Critical',
        data: data.map((d: any) => d.critical),
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        tension: 0.1
      },
      {
        label: 'Serious',
        data: data.map((d: any) => d.serious),
        borderColor: '#fd7e14',
        backgroundColor: 'rgba(253, 126, 20, 0.1)',
        tension: 0.1
      },
      {
        label: 'Moderate',
        data: data.map((d: any) => d.moderate),
        borderColor: '#ffc107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        tension: 0.1
      },
      {
        label: 'Minor',
        data: data.map((d: any) => d.minor),
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return <Line data={chartData} options={options} />;
};

interface ViolationDistributionChartProps {
  violationsByLevel: AccessibilityMetrics['violationsByLevel'];
}

const ViolationDistributionChart: React.FC<ViolationDistributionChartProps> = ({ violationsByLevel }) => {
  const chartData = {
    labels: ['Critical', 'Serious', 'Moderate', 'Minor'],
    datasets: [{
      data: [
        violationsByLevel.critical,
        violationsByLevel.serious,
        violationsByLevel.moderate,
        violationsByLevel.minor
      ],
      backgroundColor: [
        '#dc3545', // Critical - Red
        '#fd7e14', // Serious - Orange
        '#ffc107', // Moderate - Yellow
        '#28a745'  // Minor - Green
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return <Doughnut data={chartData} options={options} />;
};

interface ComponentStatusTableProps {
  components: ComponentAccessibilityMetric[];
}

const ComponentStatusTable: React.FC<ComponentStatusTableProps> = ({ components }) => {
  const getStatusIcon = (status: ComponentAccessibilityMetric['status']) => {
    switch (status) {
      case 'passing': return '✅';
      case 'warning': return '⚠️';
      case 'failing': return '❌';
      default: return '❓';
    }
  };

  const getStatusText = (status: ComponentAccessibilityMetric['status']) => {
    switch (status) {
      case 'passing': return 'Passing';
      case 'warning': return 'Warning';
      case 'failing': return 'Failing';
      default: return 'Unknown';
    }
  };

  return (
    <div className="component-table-container">
      <table className="component-status-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Status</th>
            <th>WCAG Score</th>
            <th>Violations</th>
            <th>Last Tested</th>
          </tr>
        </thead>
        <tbody>
          {components.map((component: any) => (
            <tr key={component.componentName} className={`status-${component?.status}`}>
              <td className="component-name">{component.componentName}</td>
              <td className="status-cell">
                <span className="status-indicator">
                  {getStatusIcon(component?.status)}
                  <span className="sr-only">{getStatusText(component?.status)}</span>
                </span>
                {getStatusText(component?.status)}
              </td>
              <td className="score-cell">
                <div className="score-bar-container">
                  <div 
                    className="score-bar" 
                    style={{ 
                      width: `${component.wcagScore}%`,
                      backgroundColor: component.wcagScore >= 90 ? '#28a745' : 
                                     component.wcagScore >= 70 ? '#ffc107' : '#dc3545'
                    }}
                  ></div>
                  <span className="score-text">{component.wcagScore}%</span>
                </div>
              </td>
              <td className="violations-cell">
                <div className="violations-breakdown">
                  <span className="total">{component.violationCount}</span>
                  {component.violationCount > 0 && (
                    <div className="violations-detail">
                      {component.violationsByLevel.critical > 0 && (
                        <span className="critical" title="Critical violations">
                          🔴 {component.violationsByLevel.critical}
                        </span>
                      )}
                      {component.violationsByLevel.serious > 0 && (
                        <span className="serious" title="Serious violations">
                          🟠 {component.violationsByLevel.serious}
                        </span>
                      )}
                      {component.violationsByLevel.moderate > 0 && (
                        <span className="moderate" title="Moderate violations">
                          🟡 {component.violationsByLevel.moderate}
                        </span>
                      )}
                      {component.violationsByLevel.minor > 0 && (
                        <span className="minor" title="Minor violations">
                          🟢 {component.violationsByLevel.minor}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </td>
              <td className="last-tested-cell">
                {new Date(component.lastTested).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface WCAGComplianceChartProps {
  wcagCompliance: AccessibilityMetrics['wcagCompliance'];
}

const WCAGComplianceChart: React.FC<WCAGComplianceChartProps> = ({ wcagCompliance }) => {
  const chartData = {
    labels: ['Level A', 'Level AA', 'Level AAA'],
    datasets: [{
      label: 'WCAG Compliance',
      data: [
        wcagCompliance.levelA,
        wcagCompliance.levelAA,
        wcagCompliance.levelAAA
      ],
      backgroundColor: [
        wcagCompliance.levelA >= 95 ? '#28a745' : wcagCompliance.levelA >= 80 ? '#ffc107' : '#dc3545',
        wcagCompliance.levelAA >= 95 ? '#28a745' : wcagCompliance.levelAA >= 80 ? '#ffc107' : '#dc3545',
        wcagCompliance.levelAAA >= 95 ? '#28a745' : wcagCompliance.levelAAA >= 80 ? '#ffc107' : '#dc3545'
      ],
      borderWidth: 1,
      borderColor: '#fff'
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default AccessibilityDashboard;
