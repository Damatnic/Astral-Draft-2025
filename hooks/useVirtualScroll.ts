/**
 * Virtual Scrolling Hook
 * Optimized virtual scrolling for large lists on mobile devices
 */

import React from 'react';
import { useOptimizedScroll } from '../utils/mobilePerformanceUtils';

interface VirtualScrollOptions {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
    totalItems: number;
    scrollElement?: HTMLElement | null;
}

interface VirtualScrollResult {
    visibleRange: { start: number; end: number };
    totalHeight: number;
    offsetY: number;
    containerProps: {
        style: React.CSSProperties;
        ref: React.RefObject<HTMLDivElement | null>;
    };
    viewportProps: {
        style: React.CSSProperties;
    };
}

export const useVirtualScroll = ({
    itemHeight,
    containerHeight,
    overscan = 5,
    totalItems,
    scrollElement
}: VirtualScrollOptions): VirtualScrollResult => {
    const [scrollTop, setScrollTop] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Calculate visible range
    const visibleRange = React.useMemo(() => {
        const itemsInViewport = Math.ceil(containerHeight / itemHeight);
        const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const end = Math.min(totalItems - 1, start + itemsInViewport + overscan * 2);
        
        return { start, end };
    }, [scrollTop, containerHeight, itemHeight, overscan, totalItems]);

    // Total height of all items
    const totalHeight = totalItems * itemHeight;
    
    // Offset for visible items
    const offsetY = visibleRange.start * itemHeight;

    // Handle scroll with optimization
    useOptimizedScroll((event) => {
        const element = scrollElement || containerRef.current;
        if (element) {
            setScrollTop(element.scrollTop);
        }
    });

    // Effect to track scroll on provided element
    React.useEffect(() => {
        const element = scrollElement || containerRef.current;
        if (!element) return;

        const handleScroll = () => {
            setScrollTop(element.scrollTop);
        };

        element.addEventListener('scroll', handleScroll, { passive: true });
        return () => element.removeEventListener('scroll', handleScroll);
    }, [scrollElement]);

    return {
        visibleRange,
        totalHeight,
        offsetY,
        containerProps: {
            style: {
                height: containerHeight,
                overflow: 'auto',
                position: 'relative'
            },
            ref: containerRef
        },
        viewportProps: {
            style: {
                height: totalHeight,
                position: 'relative'
            }
        }
    };
};
