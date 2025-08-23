/**
 * Mobile UI Patterns
 * Bottom sheets, swipe gestures, and mobile-first navigation components
 */

import React from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { AccessibleButton } from './AccessibleButton';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  snapPoints?: number[];
  initialSnap?: number;
}

/**
 * Bottom Sheet Modal for Mobile
 * Provides native mobile app-like modal experience
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  snapPoints = [0.4, 0.8],
  initialSnap = 0
}) => {
  const [currentSnap, setCurrentSnap] = React.useState(initialSnap);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [currentY, setCurrentY] = React.useState(0);
  const sheetRef = React.useRef<HTMLDialogElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      if (sheetRef.current) {
        sheetRef.current.showModal();
      }
    } else if (sheetRef.current) {
      sheetRef.current.close();
    }

    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging || !isMobile) return;
    
    const deltaY = currentY - startY;
    const threshold = 100;

    if (deltaY > threshold) {
      if (currentSnap === 0) {
        onClose();
      } else {
        setCurrentSnap(Math.max(0, currentSnap - 1));
      }
    } else if (deltaY < -threshold) {
      setCurrentSnap(Math.min(snapPoints.length - 1, currentSnap + 1));
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const getTransform = () => {
    if (!isOpen) return 'translateY(100%)';
    
    const snapPoint = snapPoints[currentSnap];
    const baseTransform = `translateY(${(1 - snapPoint) * 100}%)`;
    
    if (isDragging && currentY > startY) {
      const dragOffset = Math.min(currentY - startY, 200);
      return `translateY(calc(${(1 - snapPoint) * 100}% + ${dragOffset}px))`;
    }
    
    return baseTransform;
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <dialog
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 ease-out border-0 p-0 max-h-[90vh] ${className}`}
        style={{ transform: getTransform() }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        
        {title && (
          <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 id="bottom-sheet-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <AccessibleButton
              onClick={onClose}
              variant="ghost"
              size="sm"
              aria-label="Close bottom sheet"
            >
              ✕
            </AccessibleButton>
          </div>
        )}
        
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </dialog>
    </>
  );
};

interface SwipeGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  children: React.ReactNode;
  className?: string;
}

export const SwipeGesture: React.FC<SwipeGestureProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  children,
  className = ''
}) => {
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > threshold;
    const isRightSwipe = distanceX < -threshold;
    const isUpSwipe = distanceY > threshold;
    const isDownSwipe = distanceY < -threshold;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    } else if (isUpSwipe && onSwipeUp) {
      onSwipeUp();
    } else if (isDownSwipe && onSwipeDown) {
      onSwipeDown();
    }
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

interface MobileTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const MobileTabs: React.FC<MobileTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTabChange(tabId);
    }
  };

  return (
    <div 
      className={`flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e: any) => handleKeyDown(e, tab.id)}
          className={`
            relative flex-1 min-w-0 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 touch-manipulation
            ${activeTab === tab.id
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }
          `}
          style={{ minHeight: '44px' }}
        >
          <span className="flex items-center justify-center gap-2">
            {tab.icon}
            <span className="truncate">{tab.label}</span>
            {tab.badge && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};
