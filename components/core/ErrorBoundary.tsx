
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // Default fallback UI
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/20 text-red-300 p-8 rounded-lg border border-red-500/30">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">Something Went Wrong</h1>
            <p className="text-red-200 mb-6">
              An unexpected error occurred. This has been logged and our team has been notified.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-red-300 hover:text-red-100">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-red-950/50 rounded text-xs overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
            
            <div className="space-x-3">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg shadow hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg shadow hover:bg-gray-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

// Feature-specific error boundaries
const DraftErrorFallback: React.FC<{ retry: () => void }> = ({ retry }) => (
  <div className="text-center p-8 bg-gray-800 rounded-lg">
    <h3 className="text-xl font-bold text-red-400 mb-2">Draft Feature Error</h3>
    <p className="text-gray-300 mb-4">
      There was an issue with the draft feature. Please try again.
    </p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
    >
      Retry Draft
    </button>
  </div>
);

const OracleErrorFallback: React.FC<{ retry: () => void }> = ({ retry }) => (
  <div className="text-center p-8 bg-gray-800 rounded-lg">
    <h3 className="text-xl font-bold text-purple-400 mb-2">Oracle Feature Error</h3>
    <p className="text-gray-300 mb-4">
      The Oracle is temporarily unavailable. Please try again.
    </p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
    >
      Retry Oracle
    </button>
  </div>
);

export const DraftErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error('Draft feature error:', error, errorInfo);
      // Could send to analytics: trackEvent('error', 'draft', error.message);
    }}
    fallback={DraftErrorFallback}
  >
    {children}
  </ErrorBoundary>
);

export const OracleErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error('Oracle feature error:', error, errorInfo);
    }}
    fallback={OracleErrorFallback}
  >
    {children}
  </ErrorBoundary>
);
