/**
 * Mobile Accessibility Utilities
 * Comprehensive accessibility tools and helpers for mobile components
 */

import React from 'react';

// ARIA live region types
export type LiveRegionPoliteness = 'off' | 'polite' | 'assertive';

// Screen reader utilities
export const announceToScreenReader = (message: string, politeness: LiveRegionPoliteness = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', politeness);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
};

// Focus management for mobile
export const useFocusManagement = () => {
    const focusRef = React.useRef<HTMLElement | null>(null);
    const lastFocusedElement = React.useRef<HTMLElement | null>(null);

    const saveFocus = () => {
        lastFocusedElement.current = document.activeElement as HTMLElement;
    };

    const restoreFocus = () => {
        if (lastFocusedElement.current && lastFocusedElement.current.focus) {
            lastFocusedElement.current.focus();
        }
    };

    const trapFocus = (container: HTMLElement) => {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);
        firstElement?.focus();

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    };

    return {
        focusRef,
        saveFocus,
        restoreFocus,
        trapFocus
    };
};

// Touch target accessibility
export const TOUCH_TARGET_SIZE = {
    MINIMUM: 44, // WCAG AA minimum
    RECOMMENDED: 48 // WCAG AAA recommended
};

export const validateTouchTarget = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width >= TOUCH_TARGET_SIZE.MINIMUM && rect.height >= TOUCH_TARGET_SIZE.MINIMUM;
};

// High contrast mode detection
export const useHighContrastMode = () => {
    const [isHighContrast, setIsHighContrast] = React.useState(false);

    React.useEffect(() => {
        const checkHighContrast = () => {
            // Check for Windows high contrast mode
            const testElement = document.createElement('div');
            testElement.style.borderColor = 'red green';
            testElement.style.color = 'red';
            document.body.appendChild(testElement);
            
            const computedStyle = window.getComputedStyle(testElement);
            const isHighContrastMode = computedStyle.borderTopColor === computedStyle.borderRightColor;
            
            document.body.removeChild(testElement);
            setIsHighContrast(isHighContrastMode);
        };

        checkHighContrast();
        
        // Check for CSS media query support
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');
        const handleChange = (e: MediaQueryListEvent) => {
            setIsHighContrast(e.matches);
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            setIsHighContrast(mediaQuery.matches);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleChange);
            }
        };
    }, []);

    return isHighContrast;
};

// Reduced motion preference
export const useReducedMotion = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

    React.useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleChange);
            }
        };
    }, []);

    return prefersReducedMotion;
};

// Keyboard navigation helpers
export const useKeyboardNavigation = (
    onEnter?: () => void,
    onEscape?: () => void,
    onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void
) => {
    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
        switch (event.key) {
            case 'Enter':
            case ' ':
                if (onEnter) {
                    event.preventDefault();
                    onEnter();
                }
                break;
            case 'Escape':
                if (onEscape) {
                    event.preventDefault();
                    onEscape();
                }
                break;
            case 'ArrowUp':
                if (onArrowKeys) {
                    event.preventDefault();
                    onArrowKeys('up');
                }
                break;
            case 'ArrowDown':
                if (onArrowKeys) {
                    event.preventDefault();
                    onArrowKeys('down');
                }
                break;
            case 'ArrowLeft':
                if (onArrowKeys) {
                    event.preventDefault();
                    onArrowKeys('left');
                }
                break;
            case 'ArrowRight':
                if (onArrowKeys) {
                    event.preventDefault();
                    onArrowKeys('right');
                }
                break;
        }
    }, [onEnter, onEscape, onArrowKeys]);

    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};

// Screen reader only text utility
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="sr-only">
        {children}
    </span>
);

// Accessible button component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    children: React.ReactNode;
    srText?: string; // Screen reader only text
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
    variant = 'primary',
    size = 'medium',
    loading = false,
    children,
    srText,
    disabled,
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    };

    const sizeClasses = {
        small: 'px-3 py-2 text-sm min-h-[32px] min-w-[32px]',
        medium: 'px-4 py-2 text-base min-h-[44px] min-w-[44px]', // WCAG minimum touch target
        large: 'px-6 py-3 text-lg min-h-[48px] min-w-[48px]'
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled || loading}
            aria-disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
            {srText && <VisuallyHidden>{srText}</VisuallyHidden>}
        </button>
    );
};

// Live region for announcements
export const LiveRegion: React.FC<{
    message: string;
    politeness?: LiveRegionPoliteness;
    clearAfter?: number;
}> = ({ message, politeness = 'polite', clearAfter = 5000 }) => {
    const [currentMessage, setCurrentMessage] = React.useState(message);

    React.useEffect(() => {
        setCurrentMessage(message);
        
        if (clearAfter && message) {
            const timer = setTimeout(() => {
                setCurrentMessage('');
            }, clearAfter);
            
            return () => clearTimeout(timer);
        }
    }, [message, clearAfter]);

    return (
        <div
            aria-live={politeness}
            aria-atomic="true"
            className="sr-only"
        >
            {currentMessage}
        </div>
    );
};

// Color contrast validation
export const getContrastRatio = (foreground: string, background: string): number => {
    const getLuminance = (color: string): number => {
        const rgb = parseInt(color.replace('#', ''), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;
        
        const [rs, gs, bs] = [r, g, b].map(c => {
            const sRGB = c / 255;
            return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
};

export const meetsWCAGContrast = (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = getContrastRatio(foreground, background);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
};

// Accessibility testing utilities
export const AccessibilityTester = {
    checkTouchTargets: (): string[] => {
        const issues: string[] = [];
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
        
        interactiveElements.forEach((element, index) => {
            if (!validateTouchTarget(element as HTMLElement)) {
                issues.push(`Element ${index + 1} (${element.tagName}) has insufficient touch target size`);
            }
        });
        
        return issues;
    },
    
    checkAriaLabels: (): string[] => {
        const issues: string[] = [];
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
        
        interactiveElements.forEach((element, index) => {
            const hasLabel = element.getAttribute('aria-label') || 
                            element.getAttribute('aria-labelledby') || 
                            element.textContent?.trim() ||
                            (element as HTMLInputElement).labels?.length;
            
            if (!hasLabel) {
                issues.push(`Element ${index + 1} (${element.tagName}) lacks accessible label`);
            }
        });
        
        return issues;
    },
    
    checkKeyboardNavigation: (): string[] => {
        const issues: string[] = [];
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
        
        interactiveElements.forEach((element, index) => {
            const tabIndex = element.getAttribute('tabindex');
            if (tabIndex === '-1' && element.tagName !== 'DIV') {
                issues.push(`Element ${index + 1} (${element.tagName}) is not keyboard accessible`);
            }
        });
        
        return issues;
    },
    
    runFullAudit: () => {
        return {
            touchTargets: AccessibilityTester.checkTouchTargets(),
            ariaLabels: AccessibilityTester.checkAriaLabels(),
            keyboardNavigation: AccessibilityTester.checkKeyboardNavigation()
        };
    }
};
