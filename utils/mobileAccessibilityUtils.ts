/**
 * Mobile Accessibility Utilities
 * Provides comprehensive accessibility testing and validation functionality
 */

export interface TouchTargetValidation {
    isValid: boolean;
    violations: string[];
    touchTargets: {
        element: Element;
        size: { width: number; height: number };
        isValid: boolean;
        reason?: string;
    }[];
}

export interface AccessibilityAuditResult {
    isValid: boolean;
    violations: string[];
    touchTargetValidation: TouchTargetValidation;
    ariaValidation: {
        isValid: boolean;
        violations: string[];
    };
    colorContrastValidation: {
        isValid: boolean;
        violations: string[];
    };
}

export interface ColorContrastResult {
    isValid: boolean;
    ratio: number;
    level: 'AA' | 'AAA' | 'FAIL';
    backgroundColor: string;
    foregroundColor: string;
}

/**
 * Comprehensive accessibility testing utility
 */
export class AccessibilityTester {
    private readonly MINIMUM_TOUCH_TARGET = 44; // 44px minimum per WCAG guidelines
    private readonly AA_CONTRAST_RATIO = 4.5;
    private readonly AAA_CONTRAST_RATIO = 7;

    /**
     * Validate touch targets meet accessibility standards
     */
    validateTouchTargets(container: Element): TouchTargetValidation {
        const interactiveElements = container.querySelectorAll(
            'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex="0"]'
        );

        const touchTargets: TouchTargetValidation['touchTargets'] = [];
        const violations: string[] = [];

        interactiveElements.forEach((element) => {
            const rect = element.getBoundingClientRect();
            const size = { width: rect.width, height: rect.height };
            
            const isValid = size.width >= this.MINIMUM_TOUCH_TARGET && size.height >= this.MINIMUM_TOUCH_TARGET;
            
            touchTargets.push({
                element,
                size,
                isValid,
                reason: !isValid ? `Touch target too small: ${size.width}x${size.height}px (minimum: ${this.MINIMUM_TOUCH_TARGET}px)` : undefined
            });

            if (!isValid) {
                violations.push(`Element ${element.tagName} has insufficient touch target size: ${size.width}x${size.height}px`);
            }
        });

        return {
            isValid: violations.length === 0,
            violations,
            touchTargets
        };
    }

    /**
     * Check color contrast between background and foreground colors
     */
    checkColorContrast(backgroundColor: string, foregroundColor: string): ColorContrastResult {
        const bgLuminance = this.calculateLuminance(backgroundColor);
        const fgLuminance = this.calculateLuminance(foregroundColor);
        
        const ratio = (Math.max(bgLuminance, fgLuminance) + 0.05) / (Math.min(bgLuminance, fgLuminance) + 0.05);
        
        let level: 'AA' | 'AAA' | 'FAIL';
        if (ratio >= this.AAA_CONTRAST_RATIO) {
            level = 'AAA';
        } else if (ratio >= this.AA_CONTRAST_RATIO) {
            level = 'AA';
        } else {
            level = 'FAIL';
        }

        return {
            isValid: ratio >= this.AA_CONTRAST_RATIO,
            ratio: Math.round(ratio * 100) / 100,
            level,
            backgroundColor,
            foregroundColor
        };
    }

    /**
     * Run comprehensive accessibility audit
     */
    runAccessibilityAudit(container: Element): AccessibilityAuditResult {
        const touchTargetValidation = this.validateTouchTargets(container);
        const ariaValidation = this.validateAriaAttributes(container);
        const colorContrastValidation = this.validateColorContrast(container);

        const allViolations = [
            ...touchTargetValidation.violations,
            ...ariaValidation.violations,
            ...colorContrastValidation.violations
        ];

        return {
            isValid: allViolations.length === 0,
            violations: allViolations,
            touchTargetValidation,
            ariaValidation,
            colorContrastValidation
        };
    }

    /**
     * Validate ARIA attributes and labels
     */
    private validateAriaAttributes(container: Element): { isValid: boolean; violations: string[] } {
        const violations: string[] = [];
        
        // Check for missing labels on form controls
        const formControls = container.querySelectorAll('input, select, textarea');
        formControls.forEach((control) => {
            const hasLabel = control.getAttribute('aria-label') || 
                           control.getAttribute('aria-labelledby') ||
                           container.querySelector(`label[for="${control.id}"]`);
            
            if (!hasLabel) {
                violations.push(`Form control ${control.tagName} missing accessible label`);
            }
        });

        // Check for proper heading structure
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length > 0) {
            const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
            for (let i = 1; i < levels.length; i++) {
                if (levels[i] > levels[i - 1] + 1) {
                    violations.push(`Heading level skipped: h${levels[i - 1]} to h${levels[i]}`);
                }
            }
        }

        return {
            isValid: violations.length === 0,
            violations
        };
    }

    /**
     * Validate color contrast throughout the container
     */
    private validateColorContrast(container: Element): { isValid: boolean; violations: string[] } {
        const violations: string[] = [];
        
        // Check text elements for sufficient contrast
        const textElements = container.querySelectorAll('*');
        textElements.forEach((element) => {
            const styles = window.getComputedStyle(element);
            const hasText = element.textContent && element.textContent.trim().length > 0;
            
            if (hasText && styles.color && styles.backgroundColor) {
                const contrast = this.checkColorContrast(styles.backgroundColor, styles.color);
                if (!contrast.isValid) {
                    violations.push(`Insufficient color contrast: ${contrast.ratio}:1 (minimum: ${this.AA_CONTRAST_RATIO}:1)`);
                }
            }
        });

        return {
            isValid: violations.length === 0,
            violations
        };
    }

    /**
     * Calculate relative luminance of a color
     */
    private calculateLuminance(color: string): number {
        // Convert color to RGB values
        const rgb = this.parseColor(color);
        
        // Convert RGB to relative luminance
        const sRGB = rgb.map(value => {
            const normalized = value / 255;
            return normalized <= 0.03928 
                ? normalized / 12.92 
                : Math.pow((normalized + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    }

    /**
     * Parse color string to RGB values
     */
    private parseColor(color: string): [number, number, number] {
        // Create a temporary element to parse the color
        const div = document.createElement('div');
        div.style.color = color;
        document.body.appendChild(div);
        
        const computed = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        
        // Parse rgb(r, g, b) format
        const match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }
        
        // Fallback to black
        return [0, 0, 0];
    }
}

/**
 * Announce text to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * Focus management utilities
 */
export const focusManagement = {
    /**
     * Trap focus within a container
     */
    trapFocus(container: Element): () => void {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: Event) => {
            const keyboardEvent = e as KeyboardEvent;
            if (keyboardEvent.key === 'Tab') {
                if (keyboardEvent.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        keyboardEvent.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        keyboardEvent.preventDefault();
                    }
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);
        
        // Focus first element
        firstElement?.focus();

        // Return cleanup function
        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    },

    /**
     * Return focus to previous element
     */
    returnFocus(element: HTMLElement | null): void {
        if (element && typeof element.focus === 'function') {
            element.focus();
        }
    }
};

/**
 * ARIA utilities
 */
export const ariaUtils = {
    /**
     * Set expanded state for disclosure widgets
     */
    setExpanded(element: Element, isExpanded: boolean): void {
        element.setAttribute('aria-expanded', isExpanded.toString());
    },

    /**
     * Set selected state for selectable items
     */
    setSelected(element: Element, isSelected: boolean): void {
        element.setAttribute('aria-selected', isSelected.toString());
    },

    /**
     * Set pressed state for toggle buttons
     */
    setPressed(element: Element, isPressed: boolean): void {
        element.setAttribute('aria-pressed', isPressed.toString());
    },

    /**
     * Update live region content
     */
    updateLiveRegion(regionId: string, content: string, priority: 'polite' | 'assertive' = 'polite'): void {
        const region = document.getElementById(regionId);
        if (region) {
            region.setAttribute('aria-live', priority);
            region.textContent = content;
        }
    }
};

export default AccessibilityTester;

/**
 * React hooks for accessibility
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Hook for keyboard navigation support
 */
export function useKeyboardNavigation(elementRef: React.RefObject<HTMLElement>) {
    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    element.blur();
                    break;
                case 'Enter':
                case ' ':
                    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
                        e.preventDefault();
                        element.click();
                    }
                    break;
            }
        };

        element.addEventListener('keydown', handleKeyDown);
        return () => element.removeEventListener('keydown', handleKeyDown);
    }, [elementRef]);
}

/**
 * Hook for focus management
 */
export function useFocusManagement() {
    const focusRef = useRef<HTMLElement | null>(null);

    const trapFocus = (container: HTMLElement) => {
        return focusManagement.trapFocus(container);
    };

    const returnFocus = () => {
        focusManagement.returnFocus(focusRef.current);
    };

    const saveFocus = () => {
        focusRef.current = document.activeElement as HTMLElement;
    };

    return { trapFocus, returnFocus, saveFocus };
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReducedMotion;
}
