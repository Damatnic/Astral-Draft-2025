/**
 * Accessible Mobile Components
 * React components with built-in accessibility features
 */

import React, { useRef } from 'react';
import { useKeyboardNavigation } from './mobileAccessibilityUtils';

/**
 * Accessible button component
 */
interface AccessibleButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    ariaLabel?: string;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
    children,
    onClick,
    disabled = false,
    ariaLabel,
    className = '',
    type = 'button'
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    useKeyboardNavigation(buttonRef as React.RefObject<HTMLElement>);

    return (
        <button
            ref={buttonRef}
            type={type}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`${className} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
            {children}
        </button>
    );
};

/**
 * Visually hidden component for screen readers
 */
interface VisuallyHiddenProps {
    children: React.ReactNode;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children }) => {
    return (
        <span className="sr-only absolute left-[-10000px] top-auto w-[1px] h-[1px] overflow-hidden">
            {children}
        </span>
    );
};

/**
 * Live region component for announcements
 */
interface LiveRegionProps {
    children: React.ReactNode;
    politeness?: 'polite' | 'assertive';
    atomic?: boolean;
    relevant?: 'all' | 'additions' | 'removals' | 'text' | 'additions text' | 'additions removals' | 'removals text' | 'text additions' | 'text removals' | 'removals additions';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
    children,
    politeness = 'polite',
    atomic = true,
    relevant = 'all'
}) => {
    return (
        <div
            aria-live={politeness}
            aria-atomic={atomic}
            aria-relevant={relevant}
            className="sr-only"
        >
            {children}
        </div>
    );
};
