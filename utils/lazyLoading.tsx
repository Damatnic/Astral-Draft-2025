import React, { Suspense, lazy, ComponentType } from 'react';

interface LazyComponentWrapperProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  minDelay?: number; // Minimum delay in ms to prevent flash
  preload?: boolean; // Preload on hover/focus
  retryCount?: number; // Number of retry attempts
}

/**
 * Higher-order component for lazy loading heavy components with optimized loading states
 */
export function withLazyLoading<T extends Record<string, any>>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentWrapperProps = {}
) {
  const LazyComponent = lazy(importFunc);

  const {
    fallback = <ComponentSkeleton />,
    errorFallback = <ErrorFallback />,
    minDelay = 200,
    preload = false,
    retryCount = 3
  } = options;

  return React.forwardRef<any, T>((props, ref) => {
    const [showSkeleton, setShowSkeleton] = React.useState(true);
    const [retries, setRetries] = React.useState(0);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, minDelay);

      return () => clearTimeout(timer);
    }, [minDelay]);

    // Preload on component mount if enabled
    React.useEffect(() => {
      if (preload) {
        importFunc().catch(() => {
          // Silently ignore preload errors
        });
      }
    }, [preload]);

    return (
      <ErrorBoundary 
        retryCount={retryCount}
        onRetry={() => setRetries(prev => prev + 1)}
        currentRetries={retries}
        fallback={errorFallback}
      >
        <Suspense fallback={showSkeleton ? fallback : <ComponentSkeleton />}>
          <LazyComponent {...props} ref={ref} />
        </Suspense>
      </ErrorBoundary>
    );
  });
}

/**
 * Default loading skeleton for components
 */
const ComponentSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-gray-300 rounded-lg h-48 mb-4"></div>
    <div className="space-y-3">
      <div className="bg-gray-300 rounded h-4 w-3/4"></div>
      <div className="bg-gray-300 rounded h-4 w-1/2"></div>
      <div className="bg-gray-300 rounded h-4 w-5/6"></div>
    </div>
  </div>
);

/**
 * Default error fallback for failed component loads
 */
const ErrorFallback: React.FC = () => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
    <div className="text-red-600 mb-2">⚠️ Failed to load component</div>
    <button 
      onClick={() => window.location.reload()} 
      className="mobile-touch-target px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
    >
      Reload Page
    </button>
  </div>
);

/**
 * Error boundary for catching component load errors
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  retryCount?: number;
  onRetry?: () => void;
  currentRetries?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component lazy loading error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const { retryCount = 3, currentRetries = 0 } = this.props;
      const canRetry = currentRetries < retryCount;
      
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-red-600 mb-2">⚠️ Failed to load component</div>
          {canRetry ? (
            <button 
              onClick={this.handleRetry}
              className="mobile-touch-target px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Retry ({retryCount - currentRetries} attempts left)
            </button>
          ) : (
            <button 
              onClick={() => window.location.reload()} 
              className="mobile-touch-target px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Reload Page
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Specific skeletons for different component types
 */
export const SkeletonLibrary = {
  Chart: () => (
    <div className="animate-pulse bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="bg-gray-300 rounded h-6 w-1/3 mb-4"></div>
      <div className="bg-gray-300 rounded h-64 mb-4"></div>
      <div className="flex justify-between">
        <div className="bg-gray-300 rounded h-4 w-16"></div>
        <div className="bg-gray-300 rounded h-4 w-16"></div>
        <div className="bg-gray-300 rounded h-4 w-16"></div>
      </div>
    </div>
  ),

  Widget: () => (
    <div className="animate-pulse bg-white rounded-lg border border-gray-200 p-4">
      <div className="bg-gray-300 rounded h-5 w-2/3 mb-3"></div>
      <div className="space-y-2">
        <div className="bg-gray-300 rounded h-4 w-full"></div>
        <div className="bg-gray-300 rounded h-4 w-4/5"></div>
        <div className="bg-gray-300 rounded h-4 w-3/5"></div>
      </div>
    </div>
  ),

  Table: () => (
    <div className="animate-pulse bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-200 p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-300 rounded h-4"></div>
          <div className="bg-gray-300 rounded h-4"></div>
          <div className="bg-gray-300 rounded h-4"></div>
          <div className="bg-gray-300 rounded h-4"></div>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-300 rounded h-4"></div>
            <div className="bg-gray-300 rounded h-4"></div>
            <div className="bg-gray-300 rounded h-4"></div>
            <div className="bg-gray-300 rounded h-4"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-300 rounded h-4"></div>
            <div className="bg-gray-300 rounded h-4"></div>
            <div className="bg-gray-300 rounded h-4"></div>
            <div className="bg-gray-300 rounded h-4"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-300 rounded h-4"></div>
            <div className="bg-gray-300 rounded h-4"></div>
            <div className="bg-gray-300 rounded h-4"></div>
            <div className="bg-gray-300 rounded h-4"></div>
          </div>
        </div>
      </div>
    </div>
  ),

  Modal: () => (
    <div className="animate-pulse bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="bg-gray-300 rounded h-6 w-1/3"></div>
        <div className="bg-gray-300 rounded-full h-8 w-8"></div>
      </div>
      <div className="space-y-4 mb-6">
        <div className="bg-gray-300 rounded h-4 w-full"></div>
        <div className="bg-gray-300 rounded h-4 w-3/4"></div>
        <div className="bg-gray-300 rounded h-32 w-full"></div>
      </div>
      <div className="flex justify-end gap-4">
        <div className="bg-gray-300 rounded h-10 w-20"></div>
        <div className="bg-gray-300 rounded h-10 w-24"></div>
      </div>
    </div>
  ),

  Dashboard: () => (
    <div className="animate-pulse space-y-6">
      <div className="bg-gray-300 rounded h-8 w-1/3"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-300 rounded-lg h-32"></div>
        <div className="bg-gray-300 rounded-lg h-32"></div>
        <div className="bg-gray-300 rounded-lg h-32"></div>
        <div className="bg-gray-300 rounded-lg h-32"></div>
        <div className="bg-gray-300 rounded-lg h-32"></div>
        <div className="bg-gray-300 rounded-lg h-32"></div>
      </div>
      <div className="bg-gray-300 rounded-lg h-64"></div>
    </div>
  )
};

/**
 * Pre-configured lazy loading wrappers for common component types
 */
export const LazyComponents = {
  /**
   * For heavy chart components (Recharts, D3, etc.)
   */
  Chart: <T extends Record<string, any>>(
    importFunc: () => Promise<{ default: ComponentType<T> }>
  ) => withLazyLoading(importFunc, {
    fallback: <SkeletonLibrary.Chart />,
    minDelay: 300
  }),

  /**
   * For complex analytics dashboards
   */
  Dashboard: <T extends Record<string, any>>(
    importFunc: () => Promise<{ default: ComponentType<T> }>
  ) => withLazyLoading(importFunc, {
    fallback: <SkeletonLibrary.Dashboard />,
    minDelay: 500
  }),

  /**
   * For modal components with complex content
   */
  Modal: <T extends Record<string, any>>(
    importFunc: () => Promise<{ default: ComponentType<T> }>
  ) => withLazyLoading(importFunc, {
    fallback: <SkeletonLibrary.Modal />,
    minDelay: 200
  }),

  /**
   * For data table components
   */
  Table: <T extends Record<string, any>>(
    importFunc: () => Promise<{ default: ComponentType<T> }>
  ) => withLazyLoading(importFunc, {
    fallback: <SkeletonLibrary.Table />,
    minDelay: 300
  })
};

export default withLazyLoading;
