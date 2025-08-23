/**
 * Responsive Design Helpers (Phase 11.2)
 * Provides responsive utilities and components for consistent mobile/desktop experience
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

// Breakpoints
export const breakpoints = {
  sm: 360,
  md: 640,
  lg: 1024,
  xl: 1440,
  '2xl': 1920
} as const;

// Responsive Hook
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>('lg');
  const [width, setWidth] = useState<number>(1024);

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      setWidth(currentWidth);

      if (currentWidth < breakpoints.sm) {
        setBreakpoint('sm');
      } else if (currentWidth < breakpoints.md) {
        setBreakpoint('sm');
      } else if (currentWidth < breakpoints.lg) {
        setBreakpoint('md');
      } else if (currentWidth < breakpoints.xl) {
        setBreakpoint('lg');
      } else if (currentWidth < breakpoints['2xl']) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { 
    breakpoint, 
    width,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isLarge: width >= breakpoints.xl
  };
};

// Responsive Container
export interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = 'md',
  className
}) => {
  const maxWidthClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-8xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-4 sm:px-6 lg:px-8 py-4',
    lg: 'px-6 sm:px-8 lg:px-12 py-6'
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};

// Responsive Grid
export interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div className={cn(
      'grid',
      `grid-cols-${cols.sm || 1}`,
      `md:grid-cols-${cols.md || 2}`,
      `lg:grid-cols-${cols.lg || 3}`,
      `xl:grid-cols-${cols.xl || 4}`,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};

// Show/Hide based on breakpoint
export interface ShowProps {
  above?: keyof typeof breakpoints;
  below?: keyof typeof breakpoints;
  only?: keyof typeof breakpoints;
  children: React.ReactNode;
  className?: string;
}

export const Show: React.FC<ShowProps> = ({
  above,
  below,
  only,
  children,
  className
}) => {
  const { breakpoint, width } = useBreakpoint();

  const shouldShow = (() => {
    if (only) {
      return breakpoint === only;
    }
    
    if (above && below) {
      return width >= breakpoints[above] && width < breakpoints[below];
    }
    
    if (above) {
      return width >= breakpoints[above];
    }
    
    if (below) {
      return width < breakpoints[below];
    }
    
    return true;
  })();

  if (!shouldShow) return null;

  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Hide component
export const Hide: React.FC<ShowProps> = (props) => {
  const { above, below, only, children, className } = props;
  
  // Invert the logic for Hide
  const { breakpoint } = useBreakpoint();
  
  const invertedProps = {
    above: below,
    below: above,
    only: only ? undefined : only, // Only can't be easily inverted
    children,
    className
  };

  if (only) {
    // For "only", we need custom logic
    if (breakpoint === only) return null;
    return <div className={className}>{children}</div>;
  }

  return <Show {...invertedProps} />;
};

// Responsive Text
export interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl' },
  className
}) => {
  return (
    <div className={cn(
      size.sm,
      `md:${size.md}`,
      `lg:${size.lg}`,
      `xl:${size.xl}`,
      className
    )}>
      {children}
    </div>
  );
};

// Responsive Stack
export interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: {
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
  };
  spacing?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  className?: string;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = { sm: 'col', md: 'row' },
  spacing = 'md',
  align = 'center',
  justify = 'start',
  className
}) => {
  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  };

  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col'
  };

  return (
    <div className={cn(
      'flex',
      direction.sm ? directionClasses[direction.sm] : directionClasses.col,
      direction.md ? `md:${directionClasses[direction.md]}` : '',
      direction.lg ? `lg:${directionClasses[direction.lg]}` : '',
      spacingClasses[spacing],
      alignClasses[align],
      justifyClasses[justify],
      className
    )}>
      {children}
    </div>
  );
};

// Responsive Image
export interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: {
    sm?: { width: number; height: number };
    md?: { width: number; height: number };
    lg?: { width: number; height: number };
  };
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sizes,
  className,
  loading = 'lazy'
}) => {
  const { isMobile, isTablet } = useBreakpoint();

  const currentSize = (() => {
    if (isMobile && sizes?.sm) return sizes.sm;
    if (isTablet && sizes?.md) return sizes.md;
    if (sizes?.lg) return sizes.lg;
    return { width: 400, height: 300 };
  })();

  return (
    <img
      src={src}
      alt={alt}
      width={currentSize.width}
      height={currentSize.height}
      loading={loading}
      className={cn('object-cover rounded-lg', className)}
    />
  );
};

// Touch Friendly Button
export interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className
}) => {
  const { isMobile } = useBreakpoint();

  const baseClasses = 'btn transition-all duration-200 touch-manipulation select-none';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost'
  };

  const sizeClasses = {
    sm: isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: isMobile ? 'px-6 py-4 text-base min-h-[48px]' : 'px-4 py-2 text-base',
    lg: isMobile ? 'px-8 py-5 text-lg min-h-[52px]' : 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

// Responsive Modal
export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  className
}) => {
  const { isMobile } = useBreakpoint();

  if (!isOpen) return null;

  const sizeClasses = {
    sm: isMobile ? 'w-full h-full' : 'max-w-md',
    md: isMobile ? 'w-full h-full' : 'max-w-lg',
    lg: isMobile ? 'w-full h-full' : 'max-w-2xl',
    xl: isMobile ? 'w-full h-full' : 'max-w-4xl',
    full: 'w-full h-full'
  };

  const positionClasses = isMobile 
    ? 'fixed inset-0' 
    : 'fixed inset-0 flex items-center justify-center p-4';

  return (
    <div className={positionClasses}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        'relative glass-card',
        sizeClasses[size],
        isMobile ? 'rounded-none' : 'rounded-xl',
        className
      )}>
        {children}
      </div>
    </div>
  );
};

// Responsive Navigation
export interface ResponsiveNavProps {
  children: React.ReactNode;
  mobileBreakpoint?: keyof typeof breakpoints;
  className?: string;
}

export const ResponsiveNav: React.FC<ResponsiveNavProps> = ({
  children,
  mobileBreakpoint = 'md',
  className
}) => {
  const { width } = useBreakpoint();
  const isMobileNav = width < breakpoints[mobileBreakpoint];
  const [isOpen, setIsOpen] = useState(false);

  if (isMobileNav) {
    return (
      <>
        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-white"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile menu */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-astral-void/95 backdrop-blur-sm">
            <div className="flex flex-col p-6 space-y-4">
              <button
                onClick={() => setIsOpen(false)}
                className="self-end p-2 text-white"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <nav className={cn('flex flex-col space-y-4', className)}>
                {children}
              </nav>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <nav className={cn('flex items-center space-x-6', className)}>
      {children}
    </nav>
  );
};

const ResponsiveHelpers = {
  useBreakpoint,
  ResponsiveContainer,
  ResponsiveGrid,
  Show,
  Hide,
  ResponsiveText,
  ResponsiveStack,
  ResponsiveImage,
  TouchButton,
  ResponsiveModal,
  ResponsiveNav
};

export default ResponsiveHelpers;