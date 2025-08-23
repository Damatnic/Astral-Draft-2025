/**
 * Analytics Hooks (Phase 11.4)
 * React hooks for easy analytics integration throughout the app
 */

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import analytics, { EventCategory } from '../lib/analytics/ga4';

// Hook for automatic page view tracking
export const usePageTracking = () => {
  const router = useRouter();

  useEffect(() => {
    // Track initial page load
    analytics.trackPageView(document.title, window.location.pathname);
    
    // Note: Next.js 13+ App Router doesn't have router.events
    // Route change tracking would be handled at the layout level
  }, []);
};

// Hook for performance tracking
export const usePerformanceTracking = () => {
  useEffect(() => {
    // Track page load performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
            analytics.performance.pageLoadTime(window.location.pathname, loadTime);
          }
        }, 0);
      });

      // Track largest contentful paint
      if ('web-vitals' in window || typeof window.PerformanceObserver !== 'undefined') {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'largest-contentful-paint') {
                analytics.performance.pageLoadTime(
                  `${window.location.pathname}-lcp`,
                  entry.startTime
                );
              }
            }
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.log('Performance tracking not supported');
        }
      }
    }
  }, []);
};

// Hook for tracking user interactions
export const useInteractionTracking = () => {
  const trackClick = useCallback((element: string, label?: string) => {
    analytics.trackEvent({
      action: 'click',
      category: EventCategory.USER_ENGAGEMENT,
      label: label || element,
      custom_parameters: {
        element_clicked: element,
        page_path: window.location.pathname
      }
    });
  }, []);

  const trackFormSubmit = useCallback((formName: string, success: boolean) => {
    analytics.trackEvent({
      action: 'form_submit',
      category: EventCategory.USER_ENGAGEMENT,
      label: success ? 'success' : 'error',
      custom_parameters: {
        form_name: formName,
        submission_successful: success
      }
    });
  }, []);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    analytics.journey.searchPerformed(query, resultsCount, false);
  }, []);

  const trackFeatureUsage = useCallback((featureName: string, action: string) => {
    analytics.trackEvent({
      action: `feature_${action}`,
      category: EventCategory.USER_ENGAGEMENT,
      label: featureName,
      custom_parameters: {
        feature_name: featureName,
        feature_action: action
      }
    });
  }, []);

  return {
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackFeatureUsage
  };
};

// Hook for tracking fantasy football specific events
export const useFantasyTracking = () => {
  const trackDraftAction = useCallback((action: string, details: any) => {
    switch (action) {
      case 'player_selected':
        analytics.draft.playerSelected(
          details.draftId,
          details.round,
          details.pick,
          details.position,
          details.adp
        );
        break;
      case 'draft_started':
        analytics.draft.started(details.draftId, details.type, details.teamCount);
        break;
      case 'draft_completed':
        analytics.draft.completed(details.draftId, details.duration, details.autopickCount);
        break;
    }
  }, []);

  const trackLeagueAction = useCallback((action: string, details: any) => {
    switch (action) {
      case 'created':
        analytics.league.created(details.leagueId, details.teamCount, details.scoringType);
        break;
      case 'joined':
        analytics.league.joined(details.leagueId, details.memberCount);
        break;
      case 'invited':
        analytics.league.invited(details.leagueId, details.inviteMethod);
        break;
    }
  }, []);

  const trackTeamAction = useCallback((action: string, details: any) => {
    switch (action) {
      case 'lineup_set':
        analytics.team.lineupSet(details.teamId, details.week, details.playersChanged);
        break;
      case 'lineup_optimized':
        analytics.team.lineupOptimized(details.teamId, details.week, details.accepted);
        break;
      case 'waiver_claim':
        analytics.team.waiverClaim(
          details.teamId,
          details.playerId,
          details.priority,
          details.successful
        );
        break;
    }
  }, []);

  const trackTradeAction = useCallback((action: string, details: any) => {
    switch (action) {
      case 'proposed':
        analytics.trade.proposed(details.tradeId, details.proposingTeamId, details.playersCount);
        break;
      case 'analyzed':
        analytics.trade.analyzed(details.tradeId, details.fairnessScore, details.recommendation);
        break;
      case 'completed':
        analytics.trade.completed(details.tradeId, details.timeToCompletion, details.hadAnalysis);
        break;
      case 'rejected':
        analytics.trade.rejected(details.tradeId, details.reason);
        break;
    }
  }, []);

  const trackOracleAction = useCallback((action: string, details: any) => {
    switch (action) {
      case 'prediction_viewed':
        analytics.oracle.predictionViewed(details.playerId, details.confidence, details.position);
        break;
      case 'feedback_provided':
        analytics.oracle.feedbackProvided(details.predictionId, details.accuracy, details.actualScore);
        break;
      case 'recommendation_accepted':
        analytics.oracle.recommendationAccepted(details.recommendationType, details.confidence);
        break;
      case 'insight_shared':
        analytics.oracle.insightShared(details.insightType, details.shareMethod);
        break;
    }
  }, []);

  return {
    trackDraftAction,
    trackLeagueAction,
    trackTeamAction,
    trackTradeAction,
    trackOracleAction
  };
};

// Hook for tracking user journey and conversions
export const useConversionTracking = () => {
  const trackSignUp = useCallback((method: string, source: string) => {
    analytics.conversion.signUp(method, source);
  }, []);

  const trackFirstLeague = useCallback((leagueId: string, daysAfterSignup: number) => {
    analytics.conversion.firstLeague(leagueId, daysAfterSignup);
  }, []);

  const trackPremiumUpgrade = useCallback((planType: string, fromTrial: boolean, revenue: number) => {
    analytics.conversion.premiumUpgrade(planType, fromTrial, revenue);
  }, []);

  const trackOnboardingStep = useCallback((stepNumber: number, stepName: string, completed: boolean) => {
    analytics.journey.onboardingStep(stepNumber, stepName, completed);
  }, []);

  const trackFeatureDiscovery = useCallback((featureName: string, discoveryMethod: string) => {
    analytics.journey.featureDiscovery(featureName, discoveryMethod);
  }, []);

  const trackRetention = useCallback((daysActive: number, sessionsThisWeek: number) => {
    analytics.conversion.retention(daysActive, sessionsThisWeek);
  }, []);

  return {
    trackSignUp,
    trackFirstLeague,
    trackPremiumUpgrade,
    trackOnboardingStep,
    trackFeatureDiscovery,
    trackRetention
  };
};

// Hook for error tracking
export const useErrorTracking = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      analytics.performance.errorOccurred(
        'javascript_error',
        event.message,
        navigator.userAgent
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.performance.errorOccurred(
        'promise_rejection',
        event.reason?.toString() || 'Unknown promise rejection',
        navigator.userAgent
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const trackApiError = useCallback((endpoint: string, statusCode: number, errorMessage: string) => {
    analytics.trackEvent({
      action: 'api_error',
      category: EventCategory.ERROR,
      label: `${statusCode}`,
      custom_parameters: {
        api_endpoint: endpoint,
        error_code: statusCode,
        error_message: errorMessage.substring(0, 100)
      }
    });
  }, []);

  const trackComponentError = useCallback((componentName: string, errorBoundary: string) => {
    analytics.trackEvent({
      action: 'component_error',
      category: EventCategory.ERROR,
      label: componentName,
      custom_parameters: {
        component_name: componentName,
        error_boundary: errorBoundary
      }
    });
  }, []);

  return {
    trackApiError,
    trackComponentError
  };
};

// Hook for tracking user session data
export const useSessionTracking = () => {
  useEffect(() => {
    const sessionStart = Date.now();
    let lastActivity = sessionStart;

    const trackActivity = () => {
      lastActivity = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    // Track session end on page unload
    const handleBeforeUnload = () => {
      const sessionDuration = (lastActivity - sessionStart) / 1000;
      analytics.trackEvent({
        action: 'session_end',
        category: EventCategory.USER_ENGAGEMENT,
        value: Math.round(sessionDuration),
        custom_parameters: {
          session_duration_seconds: Math.round(sessionDuration),
          pages_visited: performance.getEntriesByType('navigation').length
        }
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};

// Hook for A/B testing
export const useABTesting = () => {
  const trackVariantView = useCallback((testName: string, variant: string) => {
    analytics.trackEvent({
      action: 'ab_test_view',
      category: EventCategory.USER_ENGAGEMENT,
      label: `${testName}_${variant}`,
      custom_parameters: {
        test_name: testName,
        variant_name: variant
      }
    });
  }, []);

  const trackVariantConversion = useCallback((testName: string, variant: string, goalName: string) => {
    analytics.trackEvent({
      action: 'ab_test_conversion',
      category: EventCategory.USER_ENGAGEMENT,
      label: `${testName}_${variant}_${goalName}`,
      custom_parameters: {
        test_name: testName,
        variant_name: variant,
        goal_name: goalName
      }
    });
  }, []);

  return {
    trackVariantView,
    trackVariantConversion
  };
};

// Master hook that combines all tracking
export const useAnalytics = () => {
  const interaction = useInteractionTracking();
  const fantasy = useFantasyTracking();
  const conversion = useConversionTracking();
  const error = useErrorTracking();
  const abTesting = useABTesting();

  // Initialize all tracking
  usePageTracking();
  usePerformanceTracking();
  useSessionTracking();

  return {
    ...interaction,
    ...fantasy,
    ...conversion,
    ...error,
    ...abTesting,
    
    // Direct access to analytics functions
    track: analytics.trackEvent,
    setUserProperties: analytics.setUserProperties,
    ecommerce: analytics.ecommerce
  };
};

export default useAnalytics;