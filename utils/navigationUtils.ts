/**
 * Standardized navigation utilities for view components
 * Provides consistent navigation patterns and helpers for better UX
 */

// Standard navigation destinations
export const NAVIGATION_ROUTES = {
  DASHBOARD: 'DASHBOARD',
  LEAGUE_HUB: 'LEAGUE_HUB',
  TEAM_HUB: 'TEAM_HUB',
  ANALYTICS_HUB: 'ANALYTICS_HUB',
  DRAFT_ROOM: 'DRAFT_ROOM',
  COMMISSIONER_TOOLS: 'COMMISSIONER_TOOLS',
  SETTINGS: 'SETTINGS',
  PROFILE: 'PROFILE',
  ASSISTANT: 'ASSISTANT',
} as const;

export type NavigationRoute = keyof typeof NAVIGATION_ROUTES;

// Common navigation patterns
export interface NavigationAction {
  type: 'navigate' | 'back' | 'forward' | 'replace';
  route: string;
  data?: any;
  preserveHistory?: boolean;
}

// Standard button styles for navigation
export const NAVIGATION_BUTTON_STYLES = {
  primary: "px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200",
  secondary: "px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors duration-200",
  back: "px-4 py-2 bg-gray-600/20 text-gray-300 rounded-lg text-sm hover:bg-gray-600/30 transition-colors duration-200",
  danger: "px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition-colors duration-200",
  success: "px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm hover:bg-green-500/30 transition-colors duration-200",
  warning: "px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors duration-200",
} as const;

// Helper to create navigation handler
export const createNavigationHandler = (
  dispatch: React.Dispatch<any>,
  route: string,
  data?: any
) => {
  return () => {
    if (data) {
      // If data is provided, might need to set additional state
      Object.keys(data).forEach(key => {
        if (key !== 'view') {
          dispatch({ type: `SET_${key.toUpperCase()}`, payload: data[key] });
        }
      });
    }
    dispatch({ type: 'SET_VIEW', payload: route });
  };
};

// Standard back navigation patterns
export const BACK_NAVIGATION_MAP: Record<string, string> = {
  // League-based views go back to league hub
  'TEAM_HUB': 'LEAGUE_HUB',
  'ANALYTICS_HUB': 'TEAM_HUB',
  'WEEKLY_REPORT': 'TEAM_HUB',
  'WAIVER_WIRE': 'TEAM_HUB',
  'PERFORMANCE_TRENDS': 'TEAM_HUB',
  'POWER_RANKINGS': 'TEAM_HUB',
  'PLAYOFF_BRACKET': 'TEAM_HUB',
  'SEASON_STORY': 'TEAM_HUB',
  'START_SIT_TOOL': 'TEAM_HUB',
  
  // League management views
  'LEAGUE_RULES': 'LEAGUE_HUB',
  'LEAGUE_STATS': 'LEAGUE_HUB',
  'LEAGUE_NEWSPAPER': 'LEAGUE_HUB',
  'TROPHY_ROOM': 'LEAGUE_HUB',
  'LEAGUE_HISTORY': 'LEAGUE_HUB',
  'COMMISSIONER_TOOLS': 'LEAGUE_HUB',
  
  // Draft views
  'DRAFT_PREP_CENTER': 'LEAGUE_HUB',
  'DRAFT_ROOM': 'LEAGUE_HUB',
  
  // Archive/historical views
  'SEASON_REVIEW': 'SEASON_ARCHIVE',
  'HISTORICAL_ANALYTICS': 'DASHBOARD',
  
  // Video/media views
  'WEEKLY_RECAP_VIDEO': 'WEEKLY_REPORT',
  
  // Settings and profile
  'PROFILE': 'DASHBOARD',
  'SETTINGS': 'DASHBOARD',
  
  // Special Oracle views
  'PROJECT_VIEW': 'DASHBOARD',
  'PROJECT_INTEGRITY_VIEW': 'DASHBOARD',
  
  // Default fallback
  'DEFAULT': 'DASHBOARD',
};

// Get the appropriate back navigation route
export const getBackRoute = (currentRoute: string): string => {
  return BACK_NAVIGATION_MAP[currentRoute] || BACK_NAVIGATION_MAP.DEFAULT;
};

// Create a standardized back button handler
export const createBackHandler = (
  dispatch: React.Dispatch<any>,
  currentRoute: string,
  customBackRoute?: string
) => {
  const backRoute = customBackRoute || getBackRoute(currentRoute);
  return createNavigationHandler(dispatch, backRoute);
};

// Breadcrumb navigation helper
export interface BreadcrumbItem {
  label: string;
  route: string;
  isActive?: boolean;
}

export const generateBreadcrumbs = (
  currentRoute: string,
  leagueName?: string,
  teamName?: string
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Always start with dashboard
  breadcrumbs.push({ label: 'Dashboard', route: 'DASHBOARD' });
  
  // Add league-specific breadcrumbs
  if (leagueName && currentRoute !== 'DASHBOARD') {
    breadcrumbs.push({ label: leagueName, route: 'LEAGUE_HUB' });
    
    if (teamName && ['TEAM_HUB', 'ANALYTICS_HUB', 'WEEKLY_REPORT', 'WAIVER_WIRE'].includes(currentRoute)) {
      breadcrumbs.push({ label: teamName, route: 'TEAM_HUB' });
    }
  }
  
  // Add current route as active
  const routeLabels: Record<string, string> = {
    'ANALYTICS_HUB': 'Analytics',
    'WEEKLY_REPORT': 'Weekly Report',
    'WAIVER_WIRE': 'Waiver Wire',
    'DRAFT_PREP_CENTER': 'Draft Prep',
    'COMMISSIONER_TOOLS': 'Commissioner Tools',
    'HISTORICAL_ANALYTICS': 'Historical Analytics',
    'PROJECT_VIEW': 'Project Overview',
    'PROJECT_INTEGRITY_VIEW': 'System Status',
  };
  
  if (currentRoute !== 'DASHBOARD' && currentRoute !== 'LEAGUE_HUB' && currentRoute !== 'TEAM_HUB') {
    breadcrumbs.push({ 
      label: routeLabels[currentRoute] || currentRoute, 
      route: currentRoute, 
      isActive: true 
    });
  }
  
  return breadcrumbs;
};
