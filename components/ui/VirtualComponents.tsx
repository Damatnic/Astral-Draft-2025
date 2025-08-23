/**
 * Virtual List and Grid Components
 * Optimized components for rendering large lists and grids on mobile
 */

import React from 'react';
import { useVirtualScroll } from '../../hooks/useVirtualScroll';
import { useOptimizedScroll } from '../../utils/mobilePerformanceUtils';

interface VirtualListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    overscan?: number;
    className?: string;
    onScroll?: (scrollTop: number) => void;
}

export const VirtualList = <T,>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 5,
    className = '',
    onScroll
}: VirtualListProps<T>): React.ReactElement => {
    const {
        visibleRange,
        offsetY,
        containerProps,
        viewportProps
    } = useVirtualScroll({
        itemHeight,
        containerHeight,
        overscan,
        totalItems: items.length
    });

    // Track scroll for external callback
    React.useEffect(() => {
        if (onScroll) {
            const element = containerProps.ref.current;
            if (element) {
                const handleScroll = () => onScroll(element.scrollTop);
                element.addEventListener('scroll', handleScroll, { passive: true });
                return () => element.removeEventListener('scroll', handleScroll);
            }
        }
    }, [onScroll, containerProps.ref]);

    const visibleItems = React.useMemo(() => {
        const result = [];
        for (let i = visibleRange.start; i <= visibleRange.end; i++) {
            if (items[i]) {
                result.push({
                    item: items[i],
                    index: i,
                    key: i
                });
            }
        }
        return result;
    }, [items, visibleRange]);

    return (
        <div {...containerProps} className={className}>
            <div {...viewportProps}>
                <div
                    style={{
                        transform: `translateY(${offsetY}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0
                    }}
                >
                    {visibleItems.map(({ item, index, key }) => (
                        <div
                            key={key}
                            style={{
                                height: itemHeight,
                                position: 'relative'
                            }}
                        >
                            {renderItem(item, index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Optimized grid variant for card layouts
interface VirtualGridProps<T> {
    items: T[];
    itemWidth: number;
    itemHeight: number;
    containerWidth: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    gap?: number;
    overscan?: number;
    className?: string;
}

export const VirtualGrid = React.memo(<T,>({
    items,
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight,
    renderItem,
    gap = 8,
    overscan = 3,
    className = ''
}: VirtualGridProps<T>): React.ReactElement => {
    const [scrollTop, setScrollTop] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Calculate grid dimensions
    const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
    const totalRows = Math.ceil(items.length / columnsPerRow);
    const rowHeight = itemHeight + gap;

    // Calculate visible range
    const visibleRange = React.useMemo(() => {
        const rowsInViewport = Math.ceil(containerHeight / rowHeight);
        const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
        const endRow = Math.min(totalRows - 1, startRow + rowsInViewport + overscan * 2);
        
        return { 
            startRow, 
            endRow,
            startIndex: startRow * columnsPerRow,
            endIndex: Math.min(items.length - 1, (endRow + 1) * columnsPerRow - 1)
        };
    }, [scrollTop, containerHeight, rowHeight, overscan, totalRows, columnsPerRow, items.length]);

    // Handle scroll
    useOptimizedScroll(() => {
        const element = containerRef.current;
        if (element) {
            setScrollTop(element.scrollTop);
        }
    });

    const visibleItems = React.useMemo(() => {
        const result = [];
        for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
            if (items[i]) {
                const row = Math.floor(i / columnsPerRow);
                const col = i % columnsPerRow;
                result.push({
                    item: items[i],
                    index: i,
                    key: i,
                    x: col * (itemWidth + gap),
                    y: row * rowHeight
                });
            }
        }
        return result;
    }, [items, visibleRange, columnsPerRow, itemWidth, gap, rowHeight]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                height: containerHeight,
                overflow: 'auto',
                position: 'relative'
            }}
        >
            <div
                style={{
                    height: totalRows * rowHeight,
                    position: 'relative'
                }}
            >
                {visibleItems.map(({ item, index, key, x, y }) => (
                    <div
                        key={key}
                        style={{
                            position: 'absolute',
                            left: x,
                            top: y,
                            width: itemWidth,
                            height: itemHeight
                        }}
                    >
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        </div>
    );
}) as <T>(props: VirtualGridProps<T>) => React.ReactElement;
