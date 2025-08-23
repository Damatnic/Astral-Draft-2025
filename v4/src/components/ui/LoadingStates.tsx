/**
 * Loading States Component Library (Phase 11.2)
 * Provides consistent loading indicators across the application
 */

import React from 'react';
import { cn } from '../../lib/utils';

// Basic Spinner
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'neon' | 'minimal';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  variant = 'primary',
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'border-astral-purple-500 border-t-transparent',
    secondary: 'border-astral-neon-cyan border-t-transparent',
    neon: 'border-astral-accent-pink border-t-transparent animate-neon-pulse',
    minimal: 'border-gray-300 border-t-transparent'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Pulse Loader
export interface PulseLoaderProps {
  dots?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'neon' | 'gradient';
  className?: string;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({
  dots = 3,
  size = 'md',
  variant = 'primary',
  className
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const variantClasses = {
    primary: 'bg-astral-purple-500',
    neon: 'bg-gradient-to-r from-astral-neon-cyan to-astral-accent-pink',
    gradient: 'bg-gradient-to-r from-astral-purple-500 via-astral-neon-blue to-astral-accent-lime'
  };

  return (
    <div className={cn('flex space-x-1', className)} role="status" aria-label="Loading">
      {[...Array(dots)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            sizeClasses[size],
            variantClasses[variant]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Skeleton Components
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'shimmer' | 'wave';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  animation = 'shimmer'
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'h-12 w-12 rounded-full',
    rectangular: 'h-4 w-full rounded'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer',
    wave: 'animate-pulse'
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-astral-steel/50 via-astral-ash/30 to-astral-steel/50',
        'bg-size-200 animate-shimmer',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      role="status"
      aria-label="Loading content"
    />
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('glass-card p-6 space-y-4', className)}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" className="h-12 w-12" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6" />
    </div>
  </div>
);

// Player Card Skeleton
export const PlayerCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('glass-card p-4 space-y-3', className)}>
    <div className="flex items-center space-x-3">
      <Skeleton variant="circular" className="h-10 w-10" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div className="text-center space-y-1">
        <Skeleton className="h-3 w-8 mx-auto" />
        <Skeleton className="h-6 w-12 mx-auto" />
      </div>
      <div className="text-center space-y-1">
        <Skeleton className="h-3 w-8 mx-auto" />
        <Skeleton className="h-6 w-12 mx-auto" />
      </div>
      <div className="text-center space-y-1">
        <Skeleton className="h-3 w-8 mx-auto" />
        <Skeleton className="h-6 w-12 mx-auto" />
      </div>
    </div>
  </div>
);

// Table Skeleton
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  className
}) => (
  <div className={cn('glass-card overflow-hidden', className)}>
    <div className="p-4 border-b border-astral-purple-800/30">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 w-20" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-astral-purple-800/20">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, colIndex) => (
              <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Page Skeleton
export const PageSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('container mx-auto px-4 py-8 space-y-8', className)}>
    {/* Header */}
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    
    {/* Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <TableSkeleton />
      </div>
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  </div>
);

// Loading Overlay
export interface LoadingOverlayProps {
  isLoading?: boolean;
  message?: string;
  variant?: 'transparent' | 'blur' | 'dark';
  className?: string;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading = false,
  message = 'Loading...',
  variant = 'blur',
  className,
  children
}) => {
  if (!isLoading) return children as React.ReactElement;

  const variantClasses = {
    transparent: 'bg-black/50',
    blur: 'bg-black/30 backdrop-blur-sm',
    dark: 'bg-astral-void/80'
  };

  return (
    <div className={cn('relative', className)}>
      {children}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center z-50',
          variantClasses[variant]
        )}
      >
        <div className="glass-card p-6 text-center space-y-4 max-w-sm">
          <Spinner size="lg" variant="neon" />
          <p className="text-white font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Progress Bars
export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  variant?: 'primary' | 'neon' | 'gradient' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  variant = 'primary',
  size = 'md',
  showPercentage = true,
  className
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-astral-purple-500 to-astral-purple-600',
    neon: 'bg-gradient-to-r from-astral-neon-cyan to-astral-neon-blue',
    gradient: 'bg-gradient-to-r from-astral-purple-500 via-astral-neon-blue to-astral-accent-lime',
    minimal: 'bg-gray-400'
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-astral-purple-300">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-astral-purple-300">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={cn('bg-astral-steel/30 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Pulsing Dot
export interface PulsingDotProps {
  variant?: 'online' | 'away' | 'busy' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PulsingDot: React.FC<PulsingDotProps> = ({
  variant = 'online',
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const variantClasses = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500'
  };

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <div
        className={cn(
          'rounded-full animate-ping absolute',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      <div
        className={cn(
          'rounded-full relative',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
    </div>
  );
};

// Loading Screen
export interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  progress?: number;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading Astral Draft',
  subMessage = 'Initializing your fantasy experience...',
  progress,
  className
}) => (
  <div className={cn(
    'fixed inset-0 bg-astral-void flex items-center justify-center z-max',
    className
  )}>
    <div className="text-center space-y-8 max-w-md px-8">
      {/* Logo/Brand */}
      <div className="text-4xl font-display text-gradient mb-8">
        ASTRAL DRAFT
      </div>
      
      {/* Main Spinner */}
      <div className="relative flex justify-center">
        <div className="w-16 h-16 border-4 border-astral-purple-600/30 border-t-astral-purple-500 rounded-full animate-spin" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-astral-neon-cyan rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      
      {/* Messages */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{message}</h2>
        <p className="text-astral-purple-300">{subMessage}</p>
      </div>
      
      {/* Progress */}
      {progress !== undefined && (
        <ProgressBar
          value={progress}
          variant="gradient"
          showPercentage={true}
          className="w-full"
        />
      )}
      
      {/* Footer */}
      <div className="text-xs text-astral-purple-400 mt-8">
        Powered by next-generation AI and real-time analytics
      </div>
    </div>
  </div>
);

const LoadingStateComponents = {
  Spinner,
  PulseLoader,
  Skeleton,
  CardSkeleton,
  PlayerCardSkeleton,
  TableSkeleton,
  PageSkeleton,
  LoadingOverlay,
  ProgressBar,
  PulsingDot,
  LoadingScreen
};

export default LoadingStateComponents;