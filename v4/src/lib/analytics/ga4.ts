/**
 * Google Analytics 4 (GA4) Integration (Phase 11.4)
 * Comprehensive analytics tracking for user behavior and conversions
 */

declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
  }
}

// GA4 Configuration
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// Event Categories
export enum EventCategory {
  USER_ENGAGEMENT = 'user_engagement',
  FANTASY_FOOTBALL = 'fantasy_football',
  ORACLE_AI = 'oracle_ai',
  SOCIAL = 'social',
  ECOMMERCE = 'ecommerce',
  PERFORMANCE = 'performance',
  ERROR = 'error'
}

// Custom Event Types
export interface CustomEvent {
  action: string;
  category: EventCategory;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

// User Properties
export interface UserProperties {
  user_type?: 'free' | 'premium' | 'admin';
  league_count?: number;
  experience_level?: 'beginner' | 'intermediate' | 'expert';
  preferred_platform?: 'web' | 'mobile';
  draft_strategy?: string;
  oracle_usage_level?: 'none' | 'basic' | 'advanced';
}

// Initialize GA4
export const initializeGA4 = () => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  // Configure GA4
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true,
    // Enhanced ecommerce
    allow_google_signals: true,
    allow_ad_personalization_signals: true,
    // Custom configuration
    custom_map: {
      custom_parameter_1: 'league_id',
      custom_parameter_2: 'team_id',
      custom_parameter_3: 'draft_id'
    }
  });

  console.log('GA4 initialized with ID:', GA_MEASUREMENT_ID);
};

// Set User Properties
export const setUserProperties = (properties: UserProperties) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    user_properties: properties
  });
};

// Track Page Views
export const trackPageView = (page_title: string, page_location?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_title,
    page_location: page_location || window.location.href,
    page_referrer: document.referrer
  });
};

// Track Custom Events
export const trackEvent = (event: CustomEvent) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  const { action, category, label, value, custom_parameters } = event;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    ...custom_parameters
  });
};

// === FANTASY FOOTBALL SPECIFIC EVENTS ===

// League Management
export const trackLeagueEvent = {
  created: (leagueId: string, teamCount: number, scoringType: string) => {
    trackEvent({
      action: 'league_created',
      category: EventCategory.FANTASY_FOOTBALL,
      label: scoringType,
      value: teamCount,
      custom_parameters: {
        league_id: leagueId,
        team_count: teamCount,
        scoring_type: scoringType
      }
    });
  },

  joined: (leagueId: string, memberCount: number) => {
    trackEvent({
      action: 'league_joined',
      category: EventCategory.FANTASY_FOOTBALL,
      value: memberCount,
      custom_parameters: {
        league_id: leagueId,
        member_count: memberCount
      }
    });
  },

  invited: (leagueId: string, inviteMethod: string) => {
    trackEvent({
      action: 'league_invite_sent',
      category: EventCategory.SOCIAL,
      label: inviteMethod,
      custom_parameters: {
        league_id: leagueId,
        invite_method: inviteMethod
      }
    });
  }
};

// Draft Events
export const trackDraftEvent = {
  started: (draftId: string, draftType: string, teamCount: number) => {
    trackEvent({
      action: 'draft_started',
      category: EventCategory.FANTASY_FOOTBALL,
      label: draftType,
      value: teamCount,
      custom_parameters: {
        draft_id: draftId,
        draft_type: draftType,
        team_count: teamCount
      }
    });
  },

  playerSelected: (draftId: string, round: number, pick: number, position: string, adp: number) => {
    trackEvent({
      action: 'player_drafted',
      category: EventCategory.FANTASY_FOOTBALL,
      label: position,
      value: pick,
      custom_parameters: {
        draft_id: draftId,
        round,
        pick,
        position,
        adp_variance: pick - adp
      }
    });
  },

  completed: (draftId: string, duration: number, autopickCount: number) => {
    trackEvent({
      action: 'draft_completed',
      category: EventCategory.FANTASY_FOOTBALL,
      value: duration,
      custom_parameters: {
        draft_id: draftId,
        duration_minutes: Math.round(duration / 60),
        autopick_count: autopickCount
      }
    });
  },

  abandoned: (draftId: string, round: number, reason: string) => {
    trackEvent({
      action: 'draft_abandoned',
      category: EventCategory.FANTASY_FOOTBALL,
      label: reason,
      value: round,
      custom_parameters: {
        draft_id: draftId,
        round_abandoned: round,
        abandonment_reason: reason
      }
    });
  }
};

// Team Management
export const trackTeamEvent = {
  lineupSet: (teamId: string, week: number, playersChanged: number) => {
    trackEvent({
      action: 'lineup_set',
      category: EventCategory.FANTASY_FOOTBALL,
      value: playersChanged,
      custom_parameters: {
        team_id: teamId,
        week,
        players_changed: playersChanged
      }
    });
  },

  lineupOptimized: (teamId: string, week: number, accepted: boolean) => {
    trackEvent({
      action: 'lineup_optimized',
      category: EventCategory.ORACLE_AI,
      label: accepted ? 'accepted' : 'rejected',
      custom_parameters: {
        team_id: teamId,
        week,
        optimization_accepted: accepted
      }
    });
  },

  waiverClaim: (teamId: string, playerId: string, priority: number, successful: boolean) => {
    trackEvent({
      action: 'waiver_claim',
      category: EventCategory.FANTASY_FOOTBALL,
      label: successful ? 'successful' : 'failed',
      value: priority,
      custom_parameters: {
        team_id: teamId,
        player_id: playerId,
        waiver_priority: priority,
        claim_successful: successful
      }
    });
  }
};

// Trade Events
export const trackTradeEvent = {
  proposed: (tradeId: string, proposingTeamId: string, playersCount: number) => {
    trackEvent({
      action: 'trade_proposed',
      category: EventCategory.FANTASY_FOOTBALL,
      value: playersCount,
      custom_parameters: {
        trade_id: tradeId,
        proposing_team_id: proposingTeamId,
        players_involved: playersCount
      }
    });
  },

  analyzed: (tradeId: string, fairnessScore: number, recommendation: string) => {
    trackEvent({
      action: 'trade_analyzed',
      category: EventCategory.ORACLE_AI,
      label: recommendation,
      value: Math.round(fairnessScore * 100),
      custom_parameters: {
        trade_id: tradeId,
        fairness_score: fairnessScore,
        oracle_recommendation: recommendation
      }
    });
  },

  completed: (tradeId: string, timeToCompletion: number, hadAnalysis: boolean) => {
    trackEvent({
      action: 'trade_completed',
      category: EventCategory.FANTASY_FOOTBALL,
      value: timeToCompletion,
      custom_parameters: {
        trade_id: tradeId,
        completion_time_hours: Math.round(timeToCompletion / 3600),
        used_oracle_analysis: hadAnalysis
      }
    });
  },

  rejected: (tradeId: string, reason: string) => {
    trackEvent({
      action: 'trade_rejected',
      category: EventCategory.FANTASY_FOOTBALL,
      label: reason,
      custom_parameters: {
        trade_id: tradeId,
        rejection_reason: reason
      }
    });
  }
};

// Oracle AI Events
export const trackOracleEvent = {
  predictionViewed: (playerId: string, confidence: number, position: string) => {
    trackEvent({
      action: 'oracle_prediction_viewed',
      category: EventCategory.ORACLE_AI,
      label: position,
      value: Math.round(confidence * 100),
      custom_parameters: {
        player_id: playerId,
        confidence_score: confidence,
        player_position: position
      }
    });
  },

  feedbackProvided: (predictionId: string, accuracy: 'accurate' | 'inaccurate', actualScore?: number) => {
    trackEvent({
      action: 'oracle_feedback',
      category: EventCategory.ORACLE_AI,
      label: accuracy,
      value: actualScore,
      custom_parameters: {
        prediction_id: predictionId,
        feedback_type: accuracy,
        actual_score: actualScore
      }
    });
  },

  recommendationAccepted: (recommendationType: string, confidence: number) => {
    trackEvent({
      action: 'oracle_recommendation_accepted',
      category: EventCategory.ORACLE_AI,
      label: recommendationType,
      value: Math.round(confidence * 100),
      custom_parameters: {
        recommendation_type: recommendationType,
        confidence_score: confidence
      }
    });
  },

  insightShared: (insightType: string, shareMethod: string) => {
    trackEvent({
      action: 'oracle_insight_shared',
      category: EventCategory.SOCIAL,
      label: shareMethod,
      custom_parameters: {
        insight_type: insightType,
        share_method: shareMethod
      }
    });
  }
};

// User Journey Events
export const trackUserJourney = {
  onboardingStep: (stepNumber: number, stepName: string, completed: boolean) => {
    trackEvent({
      action: 'onboarding_step',
      category: EventCategory.USER_ENGAGEMENT,
      label: completed ? 'completed' : 'abandoned',
      value: stepNumber,
      custom_parameters: {
        step_number: stepNumber,
        step_name: stepName,
        step_completed: completed
      }
    });
  },

  featureDiscovery: (featureName: string, discoveryMethod: string) => {
    trackEvent({
      action: 'feature_discovered',
      category: EventCategory.USER_ENGAGEMENT,
      label: discoveryMethod,
      custom_parameters: {
        feature_name: featureName,
        discovery_method: discoveryMethod
      }
    });
  },

  helpRequested: (helpType: string, section: string) => {
    trackEvent({
      action: 'help_requested',
      category: EventCategory.USER_ENGAGEMENT,
      label: helpType,
      custom_parameters: {
        help_type: helpType,
        help_section: section
      }
    });
  },

  searchPerformed: (query: string, resultsCount: number, resultClicked: boolean) => {
    trackEvent({
      action: 'search_performed',
      category: EventCategory.USER_ENGAGEMENT,
      value: resultsCount,
      custom_parameters: {
        search_query: query.toLowerCase(),
        results_count: resultsCount,
        result_clicked: resultClicked
      }
    });
  }
};

// Conversion Events
export const trackConversion = {
  signUp: (method: string, source: string) => {
    trackEvent({
      action: 'sign_up',
      category: EventCategory.ECOMMERCE,
      label: method,
      custom_parameters: {
        method,
        source,
        timestamp: Date.now()
      }
    });
  },

  firstLeague: (leagueId: string, daysAfterSignup: number) => {
    trackEvent({
      action: 'first_league_created',
      category: EventCategory.ECOMMERCE,
      value: daysAfterSignup,
      custom_parameters: {
        league_id: leagueId,
        days_after_signup: daysAfterSignup
      }
    });
  },

  premiumUpgrade: (planType: string, fromTrial: boolean, revenue: number) => {
    trackEvent({
      action: 'purchase',
      category: EventCategory.ECOMMERCE,
      label: planType,
      value: revenue,
      custom_parameters: {
        transaction_id: `premium_${Date.now()}`,
        item_id: planType,
        item_name: `Premium ${planType}`,
        item_category: 'subscription',
        currency: 'USD',
        value: revenue,
        from_trial: fromTrial
      }
    });
  },

  retention: (daysActive: number, sessionsThisWeek: number) => {
    trackEvent({
      action: 'user_retention',
      category: EventCategory.USER_ENGAGEMENT,
      value: daysActive,
      custom_parameters: {
        days_active: daysActive,
        sessions_this_week: sessionsThisWeek,
        retention_cohort: getRetentionCohort(daysActive)
      }
    });
  }
};

// Performance Tracking
export const trackPerformance = {
  pageLoadTime: (page: string, loadTime: number) => {
    trackEvent({
      action: 'page_load_time',
      category: EventCategory.PERFORMANCE,
      label: page,
      value: Math.round(loadTime),
      custom_parameters: {
        page_name: page,
        load_time_ms: Math.round(loadTime),
        performance_score: getPerformanceScore(loadTime)
      }
    });
  },

  apiResponseTime: (endpoint: string, responseTime: number, success: boolean) => {
    trackEvent({
      action: 'api_response_time',
      category: EventCategory.PERFORMANCE,
      label: success ? 'success' : 'error',
      value: Math.round(responseTime),
      custom_parameters: {
        api_endpoint: endpoint,
        response_time_ms: Math.round(responseTime),
        request_successful: success
      }
    });
  },

  errorOccurred: (errorType: string, errorMessage: string, userAgent: string) => {
    trackEvent({
      action: 'error_occurred',
      category: EventCategory.ERROR,
      label: errorType,
      custom_parameters: {
        error_type: errorType,
        error_message: errorMessage.substring(0, 100), // Truncate long messages
        user_agent: userAgent,
        page_url: window.location.href
      }
    });
  }
};

// Enhanced Ecommerce Events
export const trackEcommerce = {
  viewItem: (itemId: string, itemName: string, category: string, value: number) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'view_item', {
      currency: 'USD',
      value,
      items: [{
        item_id: itemId,
        item_name: itemName,
        item_category: category,
        quantity: 1,
        price: value
      }]
    });
  },

  addToCart: (itemId: string, itemName: string, category: string, value: number) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'add_to_cart', {
      currency: 'USD',
      value,
      items: [{
        item_id: itemId,
        item_name: itemName,
        item_category: category,
        quantity: 1,
        price: value
      }]
    });
  },

  beginCheckout: (transactionId: string, value: number, items: any[]) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'begin_checkout', {
      transaction_id: transactionId,
      currency: 'USD',
      value,
      items
    });
  },

  purchase: (transactionId: string, value: number, items: any[]) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      currency: 'USD',
      value,
      items
    });
  }
};

// Utility Functions
const getRetentionCohort = (daysActive: number): string => {
  if (daysActive <= 7) return 'week_1';
  if (daysActive <= 30) return 'month_1';
  if (daysActive <= 90) return 'month_3';
  if (daysActive <= 365) return 'year_1';
  return 'veteran';
};

const getPerformanceScore = (loadTime: number): string => {
  if (loadTime < 1000) return 'excellent';
  if (loadTime < 2500) return 'good';
  if (loadTime < 4000) return 'fair';
  return 'poor';
};

// Custom Dimensions Helper
export const setCustomDimensions = (dimensions: Record<string, string | number>) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    custom_map: dimensions
  });
};

// Session Recording (for heatmaps and session replay)
export const startSessionRecording = () => {
  if (typeof window === 'undefined') return;

  // This would integrate with tools like Hotjar, FullStory, etc.
  console.log('Session recording started');
};

// Export all tracking functions
const GA4Analytics = {
  initialize: initializeGA4,
  setUserProperties,
  trackPageView,
  trackEvent,
  league: trackLeagueEvent,
  draft: trackDraftEvent,
  team: trackTeamEvent,
  trade: trackTradeEvent,
  oracle: trackOracleEvent,
  journey: trackUserJourney,
  conversion: trackConversion,
  performance: trackPerformance,
  ecommerce: trackEcommerce
};

export default GA4Analytics;