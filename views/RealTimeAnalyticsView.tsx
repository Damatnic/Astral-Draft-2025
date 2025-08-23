/**
 * Real-Time Analytics View
 * Comprehensive real-time analytics dashboard with live metrics and predictive insights
 */

import React from 'react';
import RealTimeAnalyticsDashboard from '../components/analytics/RealTimeAnalyticsDashboard';

const RealTimeAnalyticsView: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <RealTimeAnalyticsDashboard />
    </div>
  );
};

export default RealTimeAnalyticsView;
