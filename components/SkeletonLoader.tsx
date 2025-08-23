
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text' | 'card' | 'table' | 'chart' | 'avatar';
  width?: string | number;
  height?: string | number;
  rows?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

const SkeletonLoader: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rect',
  width,
  height,
  rows = 1,
  animation = 'pulse'
}) => {
  const getBaseClasses = () => {
    let animationClass = '';
    if (animation === 'pulse') {
      animationClass = 'animate-pulse';
    } else if (animation === 'wave') {
      animationClass = 'animate-wave';
    }
    return `${animationClass} bg-slate-700/80`;
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'text':
        return 'rounded h-4';
      case 'card':
        return 'rounded-lg';
      case 'table':
        return 'rounded h-12';
      case 'chart':
        return 'rounded-lg';
      case 'avatar':
        return 'rounded-full w-10 h-10';
      default:
        return 'rounded';
    }
  };

  const getStyleProps = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };

  if (variant === 'text' && rows > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className={`${getBaseClasses()} ${getVariantClasses()}`}
            style={{
              ...getStyleProps(),
              width: i === rows - 1 ? '75%' : '100%' // Last row is shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={`${getBaseClasses()} ${getVariantClasses()} ${className}`}
      style={getStyleProps()}
    />
  );
};

// Specialized skeleton components
export const PlayerCardSkeleton: React.FC = () => (
  <div className="bg-gray-800 rounded-lg p-4 space-y-3">
    <div className="flex items-center space-x-3">
      <SkeletonLoader variant="avatar" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader variant="text" width="60%" />
        <SkeletonLoader variant="text" width="40%" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <SkeletonLoader variant="rect" height="24px" />
      <SkeletonLoader variant="rect" height="24px" />
      <SkeletonLoader variant="rect" height="24px" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="space-y-2">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }, (_, i) => (
        <SkeletonLoader key={`header-${i}`} variant="table" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }, (_, colIndex) => (
          <SkeletonLoader key={`cell-${rowIndex}-${colIndex}`} variant="rect" height="32px" />
        ))}
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="space-y-4">
    <SkeletonLoader variant="text" width="30%" />
    <SkeletonLoader variant="chart" height="200px" />
    <div className="flex justify-center space-x-4">
      <SkeletonLoader variant="rect" width="80px" height="20px" />
      <SkeletonLoader variant="rect" width="80px" height="20px" />
      <SkeletonLoader variant="rect" width="80px" height="20px" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <SkeletonLoader variant="text" width="200px" height="32px" />
      <SkeletonLoader variant="rect" width="120px" height="40px" />
    </div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4 space-y-2">
          <SkeletonLoader variant="text" width="60%" />
          <SkeletonLoader variant="text" width="40%" height="28px" />
        </div>
      ))}
    </div>
    
    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <TableSkeleton rows={6} cols={3} />
    </div>
  </div>
);

export default SkeletonLoader;
