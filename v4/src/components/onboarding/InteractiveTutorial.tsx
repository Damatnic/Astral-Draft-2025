'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import {
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  type?: 'intro' | 'highlight' | 'action' | 'tip' | 'warning' | 'success';
  action?: {
    type: 'click' | 'input' | 'navigate' | 'wait';
    target?: string;
    value?: string;
    delay?: number;
  };
  validation?: () => boolean;
  autoAdvance?: boolean;
  delay?: number;
  optional?: boolean;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'drafting' | 'oracle' | 'league-management' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  steps: TutorialStep[];
  prerequisites?: string[];
  tags: string[];
}

interface TutorialState {
  currentTutorial: Tutorial | null;
  currentStep: number;
  isActive: boolean;
  isPlaying: boolean;
  highlightedElement: HTMLElement | null;
  overlay: HTMLElement | null;
}

// Tutorial data
const TUTORIALS: Tutorial[] = [
  {
    id: 'quick-start',
    title: 'Quick Start Guide',
    description: 'Get up and running with Astral Draft in 5 minutes',
    category: 'getting-started',
    difficulty: 'beginner',
    estimatedTime: 5,
    tags: ['basics', 'navigation', 'dashboard'],
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Astral Draft!',
        content: 'This quick tutorial will show you the essential features to get started. You can pause or skip at any time.',
        type: 'intro',
        position: 'center',
      },
      {
        id: 'dashboard-overview',
        title: 'Your Dashboard',
        content: 'This is your command center. Here you can see your leagues, upcoming drafts, and key notifications.',
        target: '.dashboard-container',
        position: 'center',
        type: 'highlight',
      },
      {
        id: 'navigation',
        title: 'Main Navigation',
        content: 'Use the sidebar to navigate between different sections: Leagues, Oracle, Players, and more.',
        target: '.sidebar-nav',
        position: 'right',
        type: 'highlight',
      },
      {
        id: 'create-league',
        title: 'Create Your First League',
        content: 'Click the "Create League" button to start your fantasy journey.',
        target: '[data-testid="create-league-btn"]',
        position: 'bottom',
        type: 'action',
        action: {
          type: 'click',
          target: '[data-testid="create-league-btn"]',
        },
      },
      {
        id: 'oracle-intro',
        title: 'Meet the Oracle',
        content: 'The Oracle is your AI assistant for predictions, analysis, and strategic insights.',
        target: '.oracle-panel',
        position: 'left',
        type: 'highlight',
      },
      {
        id: 'complete',
        title: 'You\'re Ready!',
        content: 'Great job! You now know the basics. Explore the platform and check out more tutorials when you\'re ready.',
        type: 'success',
        position: 'center',
      },
    ],
  },
  {
    id: 'draft-mastery',
    title: 'Draft Room Mastery',
    description: 'Master the art of drafting with AI assistance',
    category: 'drafting',
    difficulty: 'intermediate',
    estimatedTime: 15,
    prerequisites: ['quick-start'],
    tags: ['drafting', 'strategy', 'ai-assistance'],
    steps: [
      {
        id: 'draft-room-intro',
        title: 'Welcome to the Draft Room',
        content: 'This is where the magic happens. Let\'s explore the draft interface and AI features.',
        target: '.draft-room-container',
        position: 'center',
        type: 'intro',
      },
      {
        id: 'player-queue',
        title: 'Your Draft Queue',
        content: 'Add players you\'re targeting to your queue. The AI will help prioritize them based on your strategy.',
        target: '.draft-queue',
        position: 'left',
        type: 'highlight',
      },
      {
        id: 'ai-recommendations',
        title: 'AI Recommendations',
        content: 'Real-time AI suggestions based on your league settings, roster needs, and draft position.',
        target: '.ai-recommendations',
        position: 'right',
        type: 'highlight',
      },
      {
        id: 'player-comparison',
        title: 'Compare Players',
        content: 'Click on any two players to see an AI-powered comparison with projections and analysis.',
        target: '.player-comparison-tool',
        position: 'top',
        type: 'action',
        action: {
          type: 'click',
          target: '.player-card:first-child',
        },
      },
      {
        id: 'draft-strategy',
        title: 'Strategy Adjustments',
        content: 'The AI adapts your strategy in real-time based on how the draft unfolds.',
        target: '.strategy-panel',
        position: 'bottom',
        type: 'tip',
      },
    ],
  },
  {
    id: 'oracle-deep-dive',
    title: 'Oracle Deep Dive',
    description: 'Unlock the full power of our AI Oracle system',
    category: 'oracle',
    difficulty: 'advanced',
    estimatedTime: 20,
    prerequisites: ['quick-start'],
    tags: ['oracle', 'ai', 'predictions', 'analytics'],
    steps: [
      {
        id: 'oracle-overview',
        title: 'Oracle Overview',
        content: 'The Oracle combines machine learning, statistical analysis, and real-time data to provide insights.',
        target: '.oracle-dashboard',
        position: 'center',
        type: 'intro',
      },
      {
        id: 'prediction-types',
        title: 'Prediction Types',
        content: 'Get predictions for player performance, matchup outcomes, injury risks, and breakout candidates.',
        target: '.prediction-categories',
        position: 'top',
        type: 'highlight',
      },
      {
        id: 'confidence-levels',
        title: 'Confidence Indicators',
        content: 'Each prediction includes a confidence level based on data quality and model certainty.',
        target: '.confidence-indicators',
        position: 'right',
        type: 'highlight',
      },
      {
        id: 'custom-analysis',
        title: 'Custom Analysis',
        content: 'Ask the Oracle specific questions about players, matchups, or strategies.',
        target: '.oracle-chat',
        position: 'left',
        type: 'action',
        action: {
          type: 'input',
          target: '.oracle-input',
          value: 'Should I start Player X this week?',
        },
      },
      {
        id: 'data-sources',
        title: 'Data Sources',
        content: 'The Oracle analyzes injury reports, weather, snap counts, targets, and dozens of other factors.',
        target: '.data-sources-panel',
        position: 'bottom',
        type: 'tip',
      },
    ],
  },
];

// Tutorial tooltip component
const TutorialTooltip: React.FC<{
  step: TutorialStep;
  position: { x: number; y: number };
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
  isFirst: boolean;
  isLast: boolean;
  stepNumber: number;
  totalSteps: number;
}> = ({
  step,
  position,
  onNext,
  onPrev,
  onSkip,
  onClose,
  isFirst,
  isLast,
  stepNumber,
  totalSteps,
}) => {
  const getTypeIcon = () => {
    switch (step.type) {
      case 'tip':
        return <LightBulbIcon className="w-5 h-5 text-yellow-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeColors = () => {
    switch (step.type) {
      case 'tip':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20';
      case 'warning':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`fixed z-50 max-w-sm rounded-lg shadow-lg border-2 ${getTypeColors()}`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getTypeIcon()}
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {step.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {step.content}
        </p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">
              Step {stepNumber} of {totalSteps}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round((stepNumber / totalSteps) * 100)}%
            </span>
          </div>
          <Progress value={(stepNumber / totalSteps) * 100} className="h-1" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {!isFirst && (
              <Button onClick={onPrev} variant="outline" size="sm">
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={onSkip} variant="outline" size="sm">
              Skip
            </Button>
            {!isLast ? (
              <Button onClick={onNext} size="sm">
                Next
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={onNext} size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Complete
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Tutorial overlay component
const TutorialOverlay: React.FC<{
  highlightElement: HTMLElement | null;
  children: React.ReactNode;
}> = ({ highlightElement, children }) => {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (highlightElement) {
      const rect = highlightElement.getBoundingClientRect();
      setHighlightRect(rect);
    } else {
      setHighlightRect(null);
    }
  }, [highlightElement]);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Overlay with spotlight effect */}
      <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto">
        {highlightRect && (
          <div
            className="absolute bg-transparent rounded-lg"
            style={{
              left: highlightRect.left - 8,
              top: highlightRect.top - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              boxShadow: `
                0 0 0 4px rgba(59, 130, 246, 0.4),
                0 0 0 9999px rgba(0, 0, 0, 0.5)
              `,
            }}
          />
        )}
      </div>
      
      {/* Tooltip content */}
      <div className="relative z-50 pointer-events-auto">
        {children}
      </div>
    </div>
  );
};

// Main tutorial hook
export const useTutorial = () => {
  const [state, setState] = useState<TutorialState>({
    currentTutorial: null,
    currentStep: 0,
    isActive: false,
    isPlaying: false,
    highlightedElement: null,
    overlay: null,
  });

  const startTutorial = (tutorialId: string) => {
    const tutorial = TUTORIALS.find(t => t.id === tutorialId);
    if (!tutorial) return;

    setState({
      currentTutorial: tutorial,
      currentStep: 0,
      isActive: true,
      isPlaying: true,
      highlightedElement: null,
      overlay: null,
    });
  };

  const stopTutorial = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      isPlaying: false,
      currentTutorial: null,
      currentStep: 0,
      highlightedElement: null,
    }));
  };

  const nextStep = () => {
    setState(prev => {
      if (!prev.currentTutorial) return prev;
      
      const nextStepIndex = prev.currentStep + 1;
      if (nextStepIndex >= prev.currentTutorial.steps.length) {
        // Tutorial complete
        return {
          ...prev,
          isActive: false,
          isPlaying: false,
        };
      }
      
      return {
        ...prev,
        currentStep: nextStepIndex,
      };
    });
  };

  const prevStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  };

  const pauseTutorial = () => {
    setState(prev => ({ ...prev, isPlaying: false }));
  };

  const resumeTutorial = () => {
    setState(prev => ({ ...prev, isPlaying: true }));
  };

  const skipTutorial = () => {
    stopTutorial();
  };

  return {
    ...state,
    startTutorial,
    stopTutorial,
    nextStep,
    prevStep,
    pauseTutorial,
    resumeTutorial,
    skipTutorial,
    availableTutorials: TUTORIALS,
  };
};

// Tutorial provider component
export const InteractiveTutorial: React.FC = () => {
  const tutorial = useTutorial();
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!tutorial.isActive || !tutorial.currentTutorial) return;

    const currentStep = tutorial.currentTutorial.steps[tutorial.currentStep];
    let highlightElement: HTMLElement | null = null;

    if (currentStep.target) {
      highlightElement = document.querySelector(currentStep.target) as HTMLElement;
      
      if (highlightElement) {
        // Calculate tooltip position
        const rect = highlightElement.getBoundingClientRect();
        let x = rect.left + rect.width / 2;
        let y = rect.top + rect.height / 2;

        // Adjust position based on step.position
        switch (currentStep.position) {
          case 'top':
            y = rect.top - 20;
            break;
          case 'bottom':
            y = rect.bottom + 20;
            break;
          case 'left':
            x = rect.left - 20;
            break;
          case 'right':
            x = rect.right + 20;
            break;
          case 'center':
          default:
            x = window.innerWidth / 2;
            y = window.innerHeight / 2;
            break;
        }

        setTooltipPosition({ x, y });
      }
    } else {
      // Center position for steps without targets
      setTooltipPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }

    // Update highlighted element
    tutorial.highlightedElement = highlightElement;

    // Auto-advance if specified
    if (currentStep.autoAdvance && tutorial.isPlaying) {
      const timer = setTimeout(() => {
        tutorial.nextStep();
      }, currentStep.delay || 3000);
      
      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [tutorial.currentStep, tutorial.isActive, tutorial.currentTutorial]);

  if (!tutorial.isActive || !tutorial.currentTutorial) {
    return null;
  }

  const currentStep = tutorial.currentTutorial.steps[tutorial.currentStep];
  const isFirst = tutorial.currentStep === 0;
  const isLast = tutorial.currentStep === tutorial.currentTutorial.steps.length - 1;

  return createPortal(
    <TutorialOverlay highlightElement={tutorial.highlightedElement}>
      <AnimatePresence>
        {tutorial.isPlaying && (
          <TutorialTooltip
            step={currentStep}
            position={tooltipPosition}
            onNext={tutorial.nextStep}
            onPrev={tutorial.prevStep}
            onSkip={tutorial.skipTutorial}
            onClose={tutorial.stopTutorial}
            isFirst={isFirst}
            isLast={isLast}
            stepNumber={tutorial.currentStep + 1}
            totalSteps={tutorial.currentTutorial.steps.length}
          />
        )}
      </AnimatePresence>
    </TutorialOverlay>,
    document.body
  );
};

// Tutorial launcher component
export const TutorialLauncher: React.FC<{
  category?: Tutorial['category'];
  className?: string;
}> = ({ category, className = '' }) => {
  const tutorial = useTutorial();
  const [selectedTutorial, setSelectedTutorial] = useState<string>('');

  const filteredTutorials = category
    ? tutorial.availableTutorials.filter(t => t.category === category)
    : tutorial.availableTutorials;

  const handleStartTutorial = () => {
    if (selectedTutorial) {
      tutorial.startTutorial(selectedTutorial);
    }
  };

  return (
    <div className={className}>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Interactive Tutorials</h3>
        
        <div className="space-y-4">
          {filteredTutorials.map(tut => (
            <div
              key={tut.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedTutorial === tut.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
              }`}
              onClick={() => setSelectedTutorial(tut.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{tut.title}</h4>
                <span className="text-sm text-gray-500">{tut.estimatedTime} min</span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {tut.description}
              </p>
              
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  tut.difficulty === 'beginner' 
                    ? 'bg-green-100 text-green-800' 
                    : tut.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {tut.difficulty}
                </span>
                {tut.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleStartTutorial}
            disabled={!selectedTutorial}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            Start Tutorial
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default InteractiveTutorial;