/**
 * Accessible Button Component
 * Enhanced with proper ARIA attributes, keyboard navigation, and mobile touch targets
 */

import React from 'react';
import { motion } from 'framer-motion';
import { getButtonA11yProps, useAnnouncer } from '../../utils/accessibility';

export interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  isLoading?: boolean;
  loadingText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  // For toggle buttons
  pressed?: boolean;
  // For dropdown/expandable buttons
  expanded?: boolean;
  // Announcement settings
  announceOnClick?: string;
  announceOnDisabled?: string;
}

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent hover:border-gray-300'
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  ariaLabel,
  ariaDescribedBy,
  isLoading = false,
  loadingText = 'Loading...',
  startIcon,
  endIcon,
  pressed,
  expanded,
  announceOnClick,
  announceOnDisabled
}) => {
  const { announce } = useAnnouncer();

  const handleClick = () => {
    if (disabled || isLoading) {
      if (announceOnDisabled) {
        announce(announceOnDisabled, 'polite');
      }
      return;
    }

    if (onClick) {
      onClick();
    }

    if (announceOnClick) {
      announce(announceOnClick, 'polite');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter and Space key activation
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const buttonContent = isLoading ? (
    <>
      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
      {loadingText}
    </>
  ) : (
    <>
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-2">{endIcon}</span>}
    </>
  );

  const a11yProps = getButtonA11yProps(
    ariaLabel || (typeof children === 'string' ? children : ''),
    disabled || isLoading,
    pressed,
    expanded
  );

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || isLoading}
      className={`
        mobile-touch-target inline-flex items-center justify-center
        font-medium rounded-lg border transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || isLoading ? disabledClasses : ''}
        ${className}
      `}
      whileHover={disabled || isLoading ? {} : { scale: 1.02 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
      aria-describedby={ariaDescribedBy}
      {...a11yProps}
    >
      {buttonContent}
    </motion.button>
  );
};

/**
 * Icon Button - optimized for mobile touch targets
 */
export interface AccessibleIconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel: string; // Required for icon buttons
  ariaDescribedBy?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  isLoading?: boolean;
  pressed?: boolean;
  expanded?: boolean;
  announceOnClick?: string;
}

export const AccessibleIconButton: React.FC<AccessibleIconButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  size = 'md',
  variant = 'ghost',
  className = '',
  isLoading = false,
  pressed,
  expanded,
  announceOnClick
}) => {
  const { announce } = useAnnouncer();

  const handleClick = () => {
    if (disabled || isLoading) return;

    if (onClick) {
      onClick();
    }

    if (announceOnClick) {
      announce(announceOnClick, 'polite');
    }
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const a11yProps = getButtonA11yProps(ariaLabel, disabled || isLoading, pressed, expanded);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        mobile-touch-target inline-flex items-center justify-center
        rounded-full transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${variantClasses[variant]}
        ${buttonSizeClasses[size]}
        ${disabled || isLoading ? disabledClasses : ''}
        ${className}
      `}
      whileHover={disabled || isLoading ? {} : { scale: 1.05 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.95 }}
      aria-describedby={ariaDescribedBy}
      {...a11yProps}
    >
      {isLoading ? (
        <div className={`animate-spin border-2 border-current border-t-transparent rounded-full ${iconSizeClasses[size]}`} />
      ) : (
        <span className={iconSizeClasses[size]}>{icon}</span>
      )}
    </motion.button>
  );
};

export default AccessibleButton;
