import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

interface DraftTimerProps {
  timeRemaining: number;
  isMyTurn: boolean;
  size?: 'small' | 'large';
  onTimeout?: () => void;
}

export function DraftTimer({ 
  timeRemaining, 
  isMyTurn, 
  size = 'small',
  onTimeout 
}: DraftTimerProps) {
  const [localTime, setLocalTime] = useState(timeRemaining);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    setLocalTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isMyTurn) {
      setIsWarning(false);
      setIsCritical(false);
      return;
    }

    setIsWarning(localTime <= 30 && localTime > 10);
    setIsCritical(localTime <= 10);

    if (localTime === 0 && onTimeout) {
      onTimeout();
    }
  }, [localTime, isMyTurn, onTimeout]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (!isMyTurn) return 'text-gray-500';
    if (isCritical) return 'text-red-500';
    if (isWarning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressPercentage = () => {
    // Assuming max time is 90 seconds
    const maxTime = 90;
    return Math.max(0, Math.min(100, (localTime / maxTime) * 100));
  };

  if (size === 'large') {
    return (
      <div 
        className={cn(
          'flex flex-col items-center p-4 rounded-lg',
          isMyTurn && 'bg-gray-100 dark:bg-gray-800'
        )}
      >
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - getProgressPercentage() / 100)}`}
              className={cn(
                'transition-all duration-1000',
                getTimerColor()
              )}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-2xl font-bold', getTimerColor())}>
              {formatTime(localTime)}
            </span>
          </div>
        </div>
        {isMyTurn && isCritical && (
          <div className="flex items-center gap-1 mt-2 text-red-500 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Time running out!</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className={cn('w-4 h-4', getTimerColor())} />
      <span 
        className={cn(
          'font-mono font-medium text-lg',
          getTimerColor(),
          isCritical && isMyTurn && 'animate-pulse'
        )}
      >
        {formatTime(localTime)}
      </span>
    </div>
  );
}