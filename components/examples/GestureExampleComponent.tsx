import React, { useState, useRef } from 'react';
import { useAdvancedTouchGestures } from '../../hooks/useAdvancedTouchGestures';

interface GestureExampleComponentProps {
  className?: string;
}

export const GestureExampleComponent: React.FC<GestureExampleComponentProps> = ({ 
  className = '' 
}) => {
  const [gestureLog, setGestureLog] = useState<string[]>([]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const addToLog = (message: string) => {
    setGestureLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onDoubleTap,
    onPinch,
    touchHandlers,
    isGestureActive,
    gestureState
  } = useAdvancedTouchGestures({
    swipe: {
      threshold: 30,
      velocityThreshold: 0.3,
      direction: 'all',
      preventScroll: true
    },
    longPress: {
      threshold: 10,
      duration: 800
    },
    doubleTap: {
      threshold: 30,
      delay: 300
    },
    pinch: {
      threshold: 1.1,
      preventZoom: true
    }
  });

  // Set up gesture callbacks
  React.useEffect(() => {
    onSwipeLeft(() => {
      addToLog('Swiped Left');
      setPosition(prev => ({ ...prev, x: prev.x - 50 }));
    });

    onSwipeRight(() => {
      addToLog('Swiped Right');
      setPosition(prev => ({ ...prev, x: prev.x + 50 }));
    });

    onSwipeUp(() => {
      addToLog('Swiped Up');
      setPosition(prev => ({ ...prev, y: prev.y - 50 }));
    });

    onSwipeDown(() => {
      addToLog('Swiped Down');
      setPosition(prev => ({ ...prev, y: prev.y + 50 }));
    });

    onLongPress((point) => {
      addToLog(`Long Press at (${Math.round(point.x)}, ${Math.round(point.y)})`);
      setPosition({ x: 0, y: 0 });
      setScale(1);
    });

    onDoubleTap((point) => {
      addToLog(`Double Tap at (${Math.round(point.x)}, ${Math.round(point.y)})`);
      setScale(prev => prev === 1 ? 1.5 : 1);
    });

    onPinch((newScale, center) => {
      addToLog(`Pinch Scale: ${newScale.toFixed(2)}`);
      setScale(newScale);
    });
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onLongPress, onDoubleTap, onPinch]);

  return (
    <div className={`gesture-example-container ${className}`}>
      <div className="gesture-header mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Advanced Touch Gestures Demo
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Try swiping, long press, double tap, or pinch gestures
        </p>
      </div>

      {/* Gesture Status */}
      <div className="gesture-status mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Status: {isGestureActive ? '🤏 Active' : '⚪ Idle'}
          </span>
          <span className="text-sm">
            Distance: {Math.round(gestureState.distance)}px
          </span>
        </div>
        {gestureState.direction && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Direction: {gestureState.direction} | 
            Velocity: {gestureState.velocity.toFixed(2)}px/ms
          </div>
        )}
      </div>

      {/* Interactive Area */}
      <div
        ref={containerRef}
        {...touchHandlers}
        className="gesture-area relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 
                   border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-xl 
                   h-64 overflow-hidden touch-none select-none"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none'
        }}
      >
        {/* Moveable Element */}
        <div
          className="absolute top-1/2 left-1/2 w-12 h-12 bg-blue-500 rounded-full 
                     flex items-center justify-center text-white font-bold 
                     transition-transform duration-200 shadow-lg"
          style={{
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`
          }}
        >
          🎯
        </div>

        {/* Gesture Instructions */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            <div>Swipe to move • Long press to reset</div>
            <div>Double tap to zoom • Pinch to scale</div>
          </div>
        </div>
      </div>

      {/* Gesture Log */}
      <div className="gesture-log mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Gesture Log:
        </h4>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 min-h-[80px] max-h-[120px] overflow-y-auto">
          {gestureLog.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
              Perform gestures to see activity...
            </p>
          ) : (
            <div className="space-y-1">
              {gestureLog.map((entry, index) => (
                <div key={`${entry}-${index}`} className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  {entry}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          setPosition({ x: 0, y: 0 });
          setScale(1);
          setGestureLog([]);
          addToLog('Reset');
        }}
        className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium 
                   rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:ring-offset-2"
      >
        Reset Demo
      </button>
    </div>
  );
};

export default GestureExampleComponent;
