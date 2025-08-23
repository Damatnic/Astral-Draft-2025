/**
 * Tooltip System (Phase 11.3)
 * Contextual help tooltips for complex features
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { HelpCircleIcon, InfoIcon, LightbulbIcon, AlertTriangleIcon } from 'lucide-react';

export interface TooltipProps {
  content: React.ReactNode;
  trigger?: 'hover' | 'click' | 'focus';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  variant?: 'info' | 'help' | 'warning' | 'tip';
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  maxWidth?: string;
  interactive?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  trigger = 'hover',
  position = 'auto',
  variant = 'info',
  size = 'md',
  delay = 200,
  disabled = false,
  className,
  children,
  maxWidth = '320px',
  interactive = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(false), interactive ? 100 : 0);
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current || position !== 'auto') return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newPosition: 'top' | 'bottom' | 'left' | 'right' | 'auto' = 'top';

    // Check if there's space above
    if (triggerRect.top - tooltipRect.height - 10 < 0) {
      newPosition = 'bottom';
    }

    // Check if there's space below
    if (triggerRect.bottom + tooltipRect.height + 10 > viewportHeight) {
      newPosition = 'top';
    }

    // Check if there's space on the right
    if (triggerRect.right + tooltipRect.width + 10 > viewportWidth) {
      newPosition = triggerRect.top + tooltipRect.height / 2 > viewportHeight / 2 ? 'left' : 'right';
    }

    setActualPosition(newPosition);
  };

  useEffect(() => {
    if (isVisible && position === 'auto') {
      calculatePosition();
    }
  }, [isVisible, position]);

  const variantStyles = {
    info: {
      bg: 'bg-astral-steel/95',
      border: 'border-astral-purple-500/30',
      text: 'text-white',
      icon: InfoIcon
    },
    help: {
      bg: 'bg-blue-900/95',
      border: 'border-blue-500/30',
      text: 'text-blue-100',
      icon: HelpCircleIcon
    },
    warning: {
      bg: 'bg-yellow-900/95',
      border: 'border-yellow-500/30',
      text: 'text-yellow-100',
      icon: AlertTriangleIcon
    },
    tip: {
      bg: 'bg-green-900/95',
      border: 'border-green-500/30',
      text: 'text-green-100',
      icon: LightbulbIcon
    }
  };

  const sizeStyles = {
    sm: 'text-xs p-2',
    md: 'text-sm p-3',
    lg: 'text-base p-4'
  };

  const positionStyles = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    auto: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2' // Default to top position
  };

  const arrowStyles = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
    auto: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent' // Default to top arrow
  };

  const currentVariant = variantStyles[variant];
  const IconComponent = currentVariant.icon;

  return (
    <div
      ref={triggerRef}
      className={cn('relative inline-block', className)}
      onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
      onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
      onFocus={trigger === 'focus' ? showTooltip : undefined}
      onBlur={trigger === 'focus' ? hideTooltip : undefined}
      onClick={handleClick}
    >
      {children}
      
      {isVisible && !disabled && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 rounded-lg border backdrop-blur-sm',
            currentVariant.bg,
            currentVariant.border,
            currentVariant.text,
            sizeStyles[size],
            positionStyles[actualPosition]
          )}
          style={{ maxWidth }}
          onMouseEnter={interactive ? () => timeoutRef.current && clearTimeout(timeoutRef.current) : undefined}
          onMouseLeave={interactive ? hideTooltip : undefined}
        >
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowStyles[actualPosition],
              actualPosition === 'top' ? 'border-t-astral-steel' :
              actualPosition === 'bottom' ? 'border-b-astral-steel' :
              actualPosition === 'left' ? 'border-l-astral-steel' :
              'border-r-astral-steel'
            )}
          />
          
          {/* Content */}
          <div className="flex items-start space-x-2">
            <IconComponent className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{content}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick Tooltip Components for common use cases
export const HelpTooltip: React.FC<Omit<TooltipProps, 'variant'>> = (props) => (
  <Tooltip {...props} variant="help" />
);

export const InfoTooltip: React.FC<Omit<TooltipProps, 'variant'>> = (props) => (
  <Tooltip {...props} variant="info" />
);

export const WarningTooltip: React.FC<Omit<TooltipProps, 'variant'>> = (props) => (
  <Tooltip {...props} variant="warning" />
);

export const TipTooltip: React.FC<Omit<TooltipProps, 'variant'>> = (props) => (
  <Tooltip {...props} variant="tip" />
);

// Feature Tooltip - Specific tooltips for complex features
interface FeatureTooltipProps {
  feature: string;
  children: React.ReactNode;
  className?: string;
}

const featureTooltips: Record<string, React.ReactNode> = {
  'oracle-confidence': (
    <div>
      <h4 className="font-semibold mb-2">Oracle Confidence Score</h4>
      <p className="mb-2">This percentage indicates how confident our AI is in this prediction:</p>
      <ul className="space-y-1 text-xs">
        <li><strong>90%+:</strong> Very reliable prediction</li>
        <li><strong>70-89%:</strong> Good prediction with some uncertainty</li>
        <li><strong>&lt;70%:</strong> High variance, use caution</li>
      </ul>
      <p className="mt-2 text-xs opacity-75">Higher confidence = more reliable prediction</p>
    </div>
  ),
  'ppr-scoring': (
    <div>
      <h4 className="font-semibold mb-2">PPR Scoring</h4>
      <p className="mb-2">Points Per Reception - players get points for each catch:</p>
      <ul className="space-y-1 text-xs">
        <li><strong>Full PPR:</strong> 1 point per reception</li>
        <li><strong>Half PPR:</strong> 0.5 points per reception</li>
        <li><strong>Standard:</strong> 0 points per reception</li>
      </ul>
      <p className="mt-2 text-xs opacity-75">Makes pass-catching players more valuable</p>
    </div>
  ),
  'waiver-priority': (
    <div>
      <h4 className="font-semibold mb-2">Waiver Priority</h4>
      <p className="mb-2">Your position in line for claiming free agents:</p>
      <ul className="space-y-1 text-xs">
        <li><strong>Lower number = higher priority</strong></li>
        <li>Priority #1 gets first pick of free agents</li>
        <li>After claiming, you move to the back of the line</li>
      </ul>
      <p className="mt-2 text-xs opacity-75">Use wisely - priority is valuable!</p>
    </div>
  ),
  'trade-analyzer': (
    <div>
      <h4 className="font-semibold mb-2">Trade Analyzer</h4>
      <p className="mb-2">AI-powered trade evaluation considering:</p>
      <ul className="space-y-1 text-xs">
        <li>Player values and projections</li>
        <li>Team needs and depth</li>
        <li>Schedule strength</li>
        <li>Injury risk factors</li>
      </ul>
      <p className="mt-2 text-xs opacity-75">Green = good for you, Red = favor opponent</p>
    </div>
  ),
  'lineup-optimizer': (
    <div>
      <h4 className="font-semibold mb-2">Lineup Optimizer</h4>
      <p className="mb-2">Automatically sets your best lineup based on:</p>
      <ul className="space-y-1 text-xs">
        <li>Projected points for each player</li>
        <li>Injury reports and game status</li>
        <li>Weather and matchup data</li>
        <li>Your risk tolerance settings</li>
      </ul>
      <p className="mt-2 text-xs opacity-75">Click to see detailed explanations</p>
    </div>
  ),
  'strength-of-schedule': (
    <div>
      <h4 className="font-semibold mb-2">Strength of Schedule</h4>
      <p className="mb-2">Measures difficulty of upcoming opponents:</p>
      <ul className="space-y-1 text-xs">
        <li><strong>Easy:</strong> Favorable matchups ahead</li>
        <li><strong>Average:</strong> Typical difficulty</li>
        <li><strong>Hard:</strong> Tough opponents coming up</li>
      </ul>
      <p className="mt-2 text-xs opacity-75">Consider for trades and waiver decisions</p>
    </div>
  ),
  'championship-odds': (
    <div>
      <h4 className="font-semibold mb-2">Championship Odds</h4>
      <p className="mb-2">Your probability of winning the league title:</p>
      <ul className="space-y-1 text-xs">
        <li>Based on current roster strength</li>
        <li>Remaining schedule difficulty</li>
        <li>Historical performance data</li>
        <li>Injury risk and depth</li>
      </ul>
      <p className="mt-2 text-xs opacity-75">Updates weekly as season progresses</p>
    </div>
  )
};

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({ feature, children, className }) => {
  const content = featureTooltips[feature];
  
  if (!content) {
    console.warn(`No tooltip content found for feature: ${feature}`);
    return <>{children}</>;
  }

  return (
    <Tooltip
      content={content}
      variant="help"
      size="md"
      position="auto"
      interactive={true}
      className={className}
      maxWidth="280px"
    >
      {children}
    </Tooltip>
  );
};

// Guided Tour Step
interface GuidedTourStepProps {
  stepNumber: number;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  isLastStep?: boolean;
  children: React.ReactNode;
}

export const GuidedTourStep: React.FC<GuidedTourStepProps> = ({
  stepNumber,
  title,
  description,
  position = 'bottom',
  onNext,
  onPrev,
  onSkip,
  isLastStep = false,
  children
}) => {
  return (
    <Tooltip
      content={
        <div className="min-w-[300px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs bg-astral-purple-500 text-white px-2 py-1 rounded">
              Step {stepNumber}
            </span>
            {onSkip && (
              <button onClick={onSkip} className="text-xs text-astral-purple-300 hover:text-white">
                Skip Tour
              </button>
            )}
          </div>
          
          <h4 className="font-semibold mb-2">{title}</h4>
          <p className="text-sm mb-4">{description}</p>
          
          <div className="flex justify-between">
            <button
              onClick={onPrev}
              disabled={stepNumber === 1}
              className="btn-secondary btn-sm disabled:opacity-50"
            >
              Previous
            </button>
            
            <button
              onClick={onNext}
              className="btn-primary btn-sm"
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      }
      trigger="click"
      position={position}
      variant="help"
      interactive={true}
      className="relative"
    >
      <div className="relative">
        {children}
        <div className="absolute -inset-1 border-2 border-astral-purple-500 rounded-lg animate-pulse pointer-events-none" />
      </div>
    </Tooltip>
  );
};

const TooltipComponents = {
  Tooltip,
  HelpTooltip,
  InfoTooltip,
  WarningTooltip,
  TipTooltip,
  FeatureTooltip,
  GuidedTourStep
};

export default TooltipComponents;