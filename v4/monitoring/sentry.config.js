// ==============================================================================
// Astral Draft v4 - Sentry Error Tracking Configuration
// ==============================================================================
// This configuration provides comprehensive error tracking and performance 
// monitoring for the Astral Draft v4 application using Sentry.
// ==============================================================================

import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as Sentry from '@sentry/nextjs';

// ==========================================================================
// Environment Configuration
// ==========================================================================

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.NODE_ENV === 'staging';

// ==========================================================================
// Sentry DSN and Basic Configuration
// ==========================================================================

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ORG = process.env.SENTRY_ORG || 'astral-draft';
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || 'astral-draft-v4';
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;

// Release and environment information
const RELEASE_VERSION = process.env.APP_VERSION || 
  process.env.GITHUB_SHA?.substring(0, 7) || 
  process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) ||
  'unknown';

const ENVIRONMENT = process.env.NODE_ENV || 'development';

// ==========================================================================
// Performance Monitoring Configuration
// ==========================================================================

const getPerformanceConfig = () => {
  if (isProduction) {
    return {
      // Sample 10% of transactions in production
      tracesSampleRate: 0.1,
      // Profile 5% of transactions
      profilesSampleRate: 0.05,
    };
  } else if (isStaging) {
    return {
      // Sample 50% of transactions in staging
      tracesSampleRate: 0.5,
      // Profile 10% of transactions
      profilesSampleRate: 0.1,
    };
  } else {
    return {
      // Sample all transactions in development
      tracesSampleRate: 1.0,
      // Profile 25% of transactions
      profilesSampleRate: 0.25,
    };
  }
};

// ==========================================================================
// Error Filtering and Sanitization
// ==========================================================================

const beforeSend = (event, hint) => {
  // Don't send events in development unless explicitly enabled
  if (isDevelopment && !process.env.SENTRY_ENABLE_DEV) {
    return null;
  }

  // Filter out known non-critical errors
  const error = hint.originalException;
  
  if (error && error.message) {
    const message = error.message.toLowerCase();
    
    // Filter out common browser/network errors that aren't actionable
    const ignoredErrors = [
      'network error',
      'fetch error',
      'loading chunk',
      'script error',
      'non-error promise rejection',
      'resizeobserver loop limit exceeded',
      'cancelled',
      'aborted',
      'timeout',
    ];
    
    if (ignoredErrors.some(ignored => message.includes(ignored))) {
      return null;
    }
  }

  // Sanitize sensitive data
  if (event.exception) {
    event.exception.values?.forEach(exception => {
      if (exception.stacktrace?.frames) {
        exception.stacktrace.frames.forEach(frame => {
          // Remove sensitive data from stack traces
          if (frame.vars) {
            Object.keys(frame.vars).forEach(key => {
              if (key.toLowerCase().includes('password') || 
                  key.toLowerCase().includes('token') ||
                  key.toLowerCase().includes('secret')) {
                frame.vars[key] = '[Filtered]';
              }
            });
          }
        });
      }
    });
  }

  // Sanitize request data
  if (event.request) {
    // Remove sensitive headers
    if (event.request.headers) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
      sensitiveHeaders.forEach(header => {
        if (event.request.headers[header]) {
          event.request.headers[header] = '[Filtered]';
        }
      });
    }

    // Remove sensitive query parameters
    if (event.request.query_string) {
      const sensitiveParams = ['token', 'password', 'secret', 'key'];
      let queryString = event.request.query_string;
      sensitiveParams.forEach(param => {
        const regex = new RegExp(`(${param}=)[^&]*`, 'gi');
        queryString = queryString.replace(regex, '$1[Filtered]');
      });
      event.request.query_string = queryString;
    }
  }

  // Add custom tags based on error characteristics
  if (event.tags) {
    // Tag database-related errors
    if (error?.message?.includes('database') || error?.message?.includes('prisma')) {
      event.tags.error_category = 'database';
    }
    // Tag API-related errors
    else if (error?.message?.includes('api') || error?.message?.includes('fetch')) {
      event.tags.error_category = 'api';
    }
    // Tag authentication errors
    else if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
      event.tags.error_category = 'authentication';
    }
  }

  return event;
};

// ==========================================================================
// Custom Integrations
// ==========================================================================

const getIntegrations = () => {
  const integrations = [
    // HTTP integration for tracking HTTP requests
    new Sentry.Integrations.Http({
      tracing: true,
      breadcrumbs: true,
    }),

    // Prisma integration for database query tracking
    new Sentry.Integrations.Prisma({
      client: global.__prisma,
    }),

    // Console integration for capturing console logs
    new Sentry.Integrations.Console({
      levels: isProduction ? ['error'] : ['error', 'warn'],
    }),

    // Local variables integration for better debugging
    new Sentry.Integrations.LocalVariables({
      captureAllExceptions: !isProduction,
    }),
  ];

  // Add profiling integration for performance monitoring
  if (isProduction || isStaging) {
    integrations.push(nodeProfilingIntegration());
  }

  return integrations;
};

// ==========================================================================
// Breadcrumb Configuration
// ==========================================================================

const beforeBreadcrumb = (breadcrumb, hint) => {
  // Filter out noisy breadcrumbs in production
  if (isProduction) {
    // Skip DOM breadcrumbs to reduce noise
    if (breadcrumb.category === 'ui.click' || breadcrumb.category === 'ui.input') {
      return null;
    }
    
    // Skip console breadcrumbs except errors
    if (breadcrumb.category === 'console' && breadcrumb.level !== 'error') {
      return null;
    }
  }

  // Add custom data to API breadcrumbs
  if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
    if (breadcrumb.data?.url) {
      // Extract endpoint information
      const url = new URL(breadcrumb.data.url);
      breadcrumb.data.endpoint = url.pathname;
      breadcrumb.data.api_version = url.pathname.includes('/api/v') ? 
        url.pathname.match(/\/api\/(v\d+)/)?.[1] : 'v1';
    }
  }

  // Add user context to navigation breadcrumbs
  if (breadcrumb.category === 'navigation') {
    breadcrumb.data = breadcrumb.data || {};
    breadcrumb.data.user_id = Sentry.getCurrentHub().getScope()?.getUser()?.id;
  }

  return breadcrumb;
};

// ==========================================================================
// Main Sentry Configuration
// ==========================================================================

const sentryConfig = {
  dsn: SENTRY_DSN,
  environment: ENVIRONMENT,
  release: `astral-draft-v4@${RELEASE_VERSION}`,
  
  // Performance monitoring
  ...getPerformanceConfig(),
  
  // Error filtering and processing
  beforeSend,
  beforeBreadcrumb,
  
  // Integrations
  integrations: getIntegrations(),
  
  // Debug mode for development
  debug: isDevelopment && process.env.SENTRY_DEBUG === 'true',
  
  // Server name for better identification
  serverName: process.env.SENTRY_SERVER_NAME || 
    process.env.VERCEL_REGION || 
    process.env.HOSTNAME || 
    'astral-draft-v4',
  
  // Initial scope data
  initialScope: {
    tags: {
      component: 'api',
      version: RELEASE_VERSION,
      deployment: process.env.VERCEL_ENV || ENVIRONMENT,
    },
    user: {
      ip_address: '{{auto}}',
    },
    level: 'info',
  },
  
  // Transport options
  transport: Sentry.makeNodeTransport,
  transportOptions: {
    // Capture unhandled promise rejections
    captureUnhandledRejections: true,
    // Buffer size for events
    bufferSize: 30,
    // Request timeout
    requestTimeout: 5000,
  },
  
  // Security and privacy
  sendDefaultPii: false,
  attachStacktrace: true,
  
  // Maximum breadcrumbs
  maxBreadcrumbs: isProduction ? 50 : 100,
  
  // Automatic session tracking
  autoSessionTracking: true,
  
  // Enable source maps for better error tracking
  enableSourceMaps: true,
};

// ==========================================================================
// Sentry Initialization
// ==========================================================================

// Initialize Sentry only if DSN is provided
if (SENTRY_DSN) {
  Sentry.init(sentryConfig);
  
  // Set up global error handlers
  process.on('unhandledRejection', (reason, promise) => {
    Sentry.captureException(reason, {
      tags: {
        error_type: 'unhandled_rejection',
      },
      extra: {
        promise: promise.toString(),
      },
    });
  });

  process.on('uncaughtException', (error) => {
    Sentry.captureException(error, {
      tags: {
        error_type: 'uncaught_exception',
      },
    });
  });

  console.log(`Sentry initialized for ${ENVIRONMENT} environment`);
} else {
  console.warn('Sentry DSN not provided, error tracking disabled');
}

// ==========================================================================
// Utility Functions for Application Use
// ==========================================================================

export const captureUserFeedback = (feedback) => {
  Sentry.captureUserFeedback({
    event_id: Sentry.lastEventId(),
    name: feedback.name,
    email: feedback.email,
    comments: feedback.comments,
  });
};

export const setUserContext = (user) => {
  Sentry.setUser({
    id: user.id,
    username: user.username || user.email,
    email: user.email,
    ip_address: '{{auto}}',
  });
};

export const addBreadcrumb = (message, category = 'custom', level = 'info', data = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

export const captureMessage = (message, level = 'info', extra = {}) => {
  Sentry.captureMessage(message, level, {
    extra,
    tags: {
      source: 'application',
    },
  });
};

export const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    ...context,
    tags: {
      source: 'application',
      ...context.tags,
    },
  });
};

export const startTransaction = (name, op = 'custom') => {
  return Sentry.startTransaction({
    name,
    op,
    tags: {
      source: 'application',
    },
  });
};

export const measurePerformance = async (name, operation) => {
  const transaction = startTransaction(name, 'custom.operation');
  
  try {
    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    captureException(error, {
      tags: {
        performance_measurement: name,
      },
    });
    throw error;
  } finally {
    transaction.finish();
  }
};

// ==========================================================================
// Health Check Integration
// ==========================================================================

export const sentryHealthCheck = () => {
  try {
    // Test Sentry connectivity
    Sentry.captureMessage('Health check - Sentry connectivity test', 'debug');
    
    return {
      status: 'healthy',
      service: 'sentry',
      timestamp: new Date().toISOString(),
      environment: ENVIRONMENT,
      release: RELEASE_VERSION,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      service: 'sentry',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// ==========================================================================
// Export Configuration
// ==========================================================================

export default sentryConfig;

export {
  Sentry,
  SENTRY_DSN,
  ENVIRONMENT,
  RELEASE_VERSION,
};