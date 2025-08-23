/**
 * @fileoverview Lazy-loaded components for code splitting
 * Provides dynamic imports for large components to reduce bundle size
 */

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Loading component for lazy-loaded components
const LazyLoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

// Error boundary component for lazy loading failures
const LazyErrorBoundary = ({ error }: { error: Error }) => (
  <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-center">
      <h3 className="text-red-800 font-medium">Failed to load component</h3>
      <p className="text-red-600 text-sm mt-1">{error.message}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  </div>
);

// Draft components (heavy components loaded on demand)
export const LazyDraftBoard = dynamic(
  () => import('../draft/DraftBoard').then(mod => ({ default: mod.DraftBoard })),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyAuctionDraftRoom = dynamic(
  () => import('../draft/AuctionDraftRoom'),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyMockDraftRoom = dynamic(
  () => import('../draft/MockDraftRoom'),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyDraftChat = dynamic(
  () => import('../draft/DraftChat').then(mod => ({ default: mod.DraftChat })),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyPlayerSearch = dynamic(
  () => import('../draft/PlayerSearch').then(mod => ({ default: mod.PlayerSearch })),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

// Oracle/AI components (heavy ML/AI features)
export const LazyTradeAnalyzer = dynamic(
  () => import('../oracle/TradeAnalyzer').then(mod => ({ default: mod.TradeAnalyzer })),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyInsightPanel = dynamic(
  () => import('../oracle/InsightPanel').then(mod => ({ default: mod.InsightPanel })),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyTrendChart = dynamic(
  () => import('../oracle/TrendChart').then(mod => ({ default: mod.TrendChart })),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyPredictionCard = dynamic(
  () => import('../oracle/PredictionCard').then(mod => ({ default: mod.PredictionCard })),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

// Fantasy components (league management heavy features)
export const LazyLeagueSchedule = dynamic(
  () => import('../fantasy/LeagueSchedule').then(mod => ({ default: mod.LeagueSchedule })),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyWaiverWire = dynamic(
  () => import('../fantasy/WaiverWire').then(mod => ({ default: mod.WaiverWire })),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyCommissionerTools = dynamic(
  () => import('../fantasy/CommissionerTools').then(mod => ({ default: mod.CommissionerTools })),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyCreateLeagueModal = dynamic(
  () => import('../fantasy/CreateLeagueModal').then(mod => ({ default: mod.CreateLeagueModal })),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

// Playoff components (complex bracket rendering)
export const LazyPlayoffBracket = dynamic(
  () => import('../playoffs/PlayoffBracket'),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyConsolationBracket = dynamic(
  () => import('../playoffs/ConsolationBracket'),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyTrophyRoom = dynamic(
  () => import('../playoffs/TrophyRoom'),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

// Notification components
export const LazyNotificationCenter = dynamic(
  () => import('../notifications/NotificationCenter'),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

export const LazyNotificationPreferences = dynamic(
  () => import('../notifications/NotificationPreferences'),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

// Design system showcase (development only)
export const LazyDesignSystemShowcase = dynamic(
  () => import('../ui/DesignSystemShowcase'),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

// Performance monitoring dashboard
export const LazyPerformanceDashboard = dynamic(
  () => import('../performance/PerformanceDashboard'),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

// Bundle analyzer component (development only)
export const LazyBundleAnalyzer = dynamic(
  () => import('../performance/BundleAnalyzer'),
  { 
    loading: LazyLoadingSpinner,
    ssr: false 
  }
);

// Utility function to create lazy components with custom loading states
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: () => JSX.Element;
    ssr?: boolean;
    errorBoundary?: ComponentType<{ error: Error }>;
  }
) {
  const { 
    loading = LazyLoadingSpinner, 
    ssr = false,
    errorBoundary = LazyErrorBoundary 
  } = options || {};

  return dynamic(importFn, {
    loading,
    ssr
  });
}

// Preload functions for critical components
export const preloadDraftComponents = () => {
  if (typeof window !== 'undefined') {
    import('../draft/DraftBoard');
    import('../draft/DraftChat');
    import('../draft/PlayerSearch');
  }
};

export const preloadOracleComponents = () => {
  if (typeof window !== 'undefined') {
    import('../oracle/TradeAnalyzer');
    import('../oracle/InsightPanel');
  }
};

export const preloadFantasyComponents = () => {
  if (typeof window !== 'undefined') {
    import('../fantasy/LeagueSchedule');
    import('../fantasy/WaiverWire');
  }
};

// Route-based component preloading
export const preloadComponentsForRoute = (route: string) => {
  switch (true) {
    case route.startsWith('/draft'):
      preloadDraftComponents();
      break;
    case route.startsWith('/oracle'):
      preloadOracleComponents();
      break;
    case route.startsWith('/league'):
    case route.startsWith('/team'):
      preloadFantasyComponents();
      break;
    default:
      // Preload common components
      if (typeof window !== 'undefined') {
        import('../notifications/NotificationCenter');
      }
      break;
  }
};

// Component size tracking for bundle analysis
export const componentSizes = {
  DraftBoard: 'Large (~50KB)',
  AuctionDraftRoom: 'Large (~45KB)',
  TradeAnalyzer: 'Very Large (~80KB)',
  PlayoffBracket: 'Medium (~30KB)',
  WaiverWire: 'Medium (~25KB)',
  CommissionerTools: 'Large (~40KB)',
  NotificationCenter: 'Small (~15KB)',
  PerformanceDashboard: 'Medium (~35KB)',
};

const LazyComponents = {
  // Export all lazy components
  LazyDraftBoard,
  LazyAuctionDraftRoom,
  LazyMockDraftRoom,
  LazyDraftChat,
  LazyPlayerSearch,
  LazyTradeAnalyzer,
  LazyInsightPanel,
  LazyTrendChart,
  LazyPredictionCard,
  LazyLeagueSchedule,
  LazyWaiverWire,
  LazyCommissionerTools,
  LazyCreateLeagueModal,
  LazyPlayoffBracket,
  LazyConsolationBracket,
  LazyTrophyRoom,
  LazyNotificationCenter,
  LazyNotificationPreferences,
  LazyDesignSystemShowcase,
  LazyPerformanceDashboard,
  LazyBundleAnalyzer,
  
  // Utility functions
  createLazyComponent,
  preloadComponentsForRoute,
  componentSizes,
};

export default LazyComponents;