/**
 * Modern Error Boundary Component
 * Graceful error handling with beautiful UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon, MessageCircleIcon } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class ModernErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to error reporting service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error tracking service like Sentry
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <AlertTriangleIcon className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Oops! Something went wrong</h1>
                    <p className="text-gray-300 mt-1">
                      Don't worry, our team has been notified and is working on it.
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Error Message */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white mb-2">What happened?</h2>
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <p className="text-red-400 font-mono text-sm">
                      {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                  </div>
                </div>

                {/* Stack Trace (Development only) */}
                {isDevelopment && this.state.errorInfo && (
                  <div className="mb-6">
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        Show technical details
                      </summary>
                      <div className="mt-3 bg-black/30 rounded-lg p-4 border border-white/10 max-h-64 overflow-auto">
                        <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                          {this.state.error?.stack}
                        </pre>
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      </div>
                    </details>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105"
                  >
                    <RefreshCwIcon className="w-5 h-5" />
                    Try Again
                  </button>
                  
                  <button
                    onClick={this.handleReload}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20"
                  >
                    <RefreshCwIcon className="w-5 h-5" />
                    Reload Page
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20"
                  >
                    <HomeIcon className="w-5 h-5" />
                    Go Home
                  </button>
                </div>

                {/* Support Link */}
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <p className="text-sm text-gray-400">
                    Need help?{' '}
                    <a
                      href="mailto:support@astraldraft.com"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Contact our support team
                    </a>
                  </p>
                </div>

                {/* Error Count Warning */}
                {this.state.errorCount > 2 && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-400 flex items-center gap-2">
                      <AlertTriangleIcon className="w-4 h-4" />
                      Multiple errors detected. Consider refreshing the page.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Animated Background Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModernErrorBoundary;