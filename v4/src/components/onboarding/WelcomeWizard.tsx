'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  TrophyIcon,
  UsersIcon,
  BoltIcon,
  StarIcon,
  PlayIcon,
  BookOpenIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';

interface WelcomeStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<WelcomeStepProps>;
  required?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface WelcomeStepProps {
  onNext: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  data: any;
  setData: (data: any) => void;
}

interface UserPreferences {
  favoriteTeam: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  interests: string[];
  notifications: {
    email: boolean;
    push: boolean;
    draft: boolean;
    trade: boolean;
    injury: boolean;
  };
  draftPreferences: {
    position: 'rb-heavy' | 'wr-heavy' | 'balanced' | 'zero-rb';
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  };
}

// Welcome Step Components
const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
          <TrophyIcon className="w-12 h-12 text-white" />
        </div>
      </motion.div>
      
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Welcome to Astral Draft v4!
      </h1>
      
      <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        The most advanced fantasy football platform designed to give you the competitive edge. 
        Let's get you set up in just a few minutes.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="p-6 text-center">
          <BoltIcon className="w-10 h-10 text-blue-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">AI-Powered Oracle</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Advanced predictions and insights to dominate your league
          </p>
        </Card>
        
        <Card className="p-6 text-center">
          <UsersIcon className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Real-Time Drafting</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Interactive draft rooms with live analysis and recommendations
          </p>
        </Card>
        
        <Card className="p-6 text-center">
          <StarIcon className="w-10 h-10 text-purple-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Advanced Analytics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Deep insights and trend analysis for strategic decisions
          </p>
        </Card>
      </div>
      
      <Button 
        onClick={onNext}
        size="lg"
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
      >
        Get Started
        <ChevronRightIcon className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
};

const ProfileSetupStep: React.FC<WelcomeStepProps> = ({ onNext, onBack, data, setData }) => {
  const [profile, setProfile] = useState({
    displayName: data.displayName || '',
    favoriteTeam: data.favoriteTeam || '',
    experienceLevel: data.experienceLevel || 'intermediate',
    avatar: data.avatar || '',
  });

  const nflTeams = [
    'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
    'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
    'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
    'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
    'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
    'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
    'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
    'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'
  ];

  const handleNext = () => {
    setData({ ...data, ...profile });
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <BookOpenIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Set Up Your Profile</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Tell us a bit about yourself to personalize your experience
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Display Name</label>
          <input
            type="text"
            value={profile.displayName}
            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="How should we address you?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Favorite NFL Team</label>
          <select
            value={profile.favoriteTeam}
            onChange={(e) => setProfile({ ...profile, favoriteTeam: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select your team</option>
            {nflTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fantasy Football Experience</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'beginner', label: 'Beginner', desc: 'New to fantasy' },
              { value: 'intermediate', label: 'Intermediate', desc: '2-5 years' },
              { value: 'expert', label: 'Expert', desc: '5+ years' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setProfile({ ...profile, experienceLevel: option.value as any })}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  profile.experienceLevel === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!profile.displayName}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          Continue
          <ChevronRightIcon className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

const PreferencesStep: React.FC<WelcomeStepProps> = ({ onNext, onBack, data, setData }) => {
  const [preferences, setPreferences] = useState({
    interests: data.interests || [],
    notifications: data.notifications || {
      email: true,
      push: true,
      draft: true,
      trade: true,
      injury: true,
    },
    draftPreferences: data.draftPreferences || {
      position: 'balanced',
      riskTolerance: 'moderate',
    },
  });

  const interests = [
    { id: 'player-analysis', label: 'Player Analysis', icon: '📊' },
    { id: 'draft-strategy', label: 'Draft Strategy', icon: '🎯' },
    { id: 'trade-alerts', label: 'Trade Opportunities', icon: '🔄' },
    { id: 'injury-updates', label: 'Injury Updates', icon: '🏥' },
    { id: 'waiver-wire', label: 'Waiver Wire Gems', icon: '💎' },
    { id: 'matchup-analysis', label: 'Matchup Analysis', icon: '⚔️' },
    { id: 'rookie-scouting', label: 'Rookie Scouting', icon: '🌟' },
    { id: 'playoff-strategy', label: 'Playoff Strategy', icon: '🏆' },
  ];

  const toggleInterest = (interestId: string) => {
    const newInterests = preferences.interests.includes(interestId)
      ? preferences.interests.filter((id: string) => id !== interestId)
      : [...preferences.interests, interestId];
    setPreferences({ ...preferences, interests: newInterests });
  };

  const handleNext = () => {
    setData({ ...data, ...preferences });
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <StarIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Customize Your Experience</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Tell us what you're interested in so we can personalize your content
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">What interests you most?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {interests.map(interest => (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`p-3 rounded-lg border-2 transition-colors text-center ${
                  preferences.interests.includes(interest.id)
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{interest.icon}</div>
                <div className="text-sm font-medium">{interest.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Draft Strategy Preference</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'rb-heavy', label: 'RB Heavy', desc: 'Load up on RBs early' },
              { value: 'wr-heavy', label: 'WR Heavy', desc: 'Wide receiver priority' },
              { value: 'balanced', label: 'Balanced', desc: 'Best player available' },
              { value: 'zero-rb', label: 'Zero RB', desc: 'Wait on running backs' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setPreferences({
                  ...preferences,
                  draftPreferences: { ...preferences.draftPreferences, position: option.value as any }
                })}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  preferences.draftPreferences.position === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-gray-500">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
          <div className="space-y-3">
            {[
              { key: 'draft', label: 'Draft Reminders', desc: 'Get notified before your drafts' },
              { key: 'trade', label: 'Trade Alerts', desc: 'Opportunities and incoming offers' },
              { key: 'injury', label: 'Injury Updates', desc: 'Immediate player injury news' },
              { key: 'email', label: 'Email Notifications', desc: 'Weekly summaries and updates' },
              { key: 'push', label: 'Push Notifications', desc: 'Real-time mobile alerts' },
            ].map(option => (
              <label key={option.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifications[option.key as keyof typeof preferences.notifications]}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: {
                      ...preferences.notifications,
                      [option.key]: e.target.checked
                    }
                  })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleNext}
          className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
        >
          Continue
          <ChevronRightIcon className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

const TutorialStep: React.FC<WelcomeStepProps> = ({ onNext, onSkip, onBack }) => {
  const [selectedTutorial, setSelectedTutorial] = useState<string>('');

  const tutorials = [
    {
      id: 'quick-start',
      title: 'Quick Start (5 min)',
      description: 'Essential features to get you started immediately',
      duration: '5 minutes',
      level: 'Beginner',
      icon: PlayIcon,
      topics: ['Dashboard overview', 'Creating your first league', 'Basic navigation']
    },
    {
      id: 'draft-mastery',
      title: 'Draft Mastery (15 min)',
      description: 'Master the art of drafting with AI assistance',
      duration: '15 minutes',
      level: 'Intermediate',
      icon: TrophyIcon,
      topics: ['Draft room features', 'AI recommendations', 'Strategy tools']
    },
    {
      id: 'oracle-deep-dive',
      title: 'Oracle Deep Dive (20 min)',
      description: 'Unlock the full power of our AI Oracle system',
      duration: '20 minutes',
      level: 'Advanced',
      icon: BoltIcon,
      topics: ['Prediction algorithms', 'Advanced analytics', 'Custom insights']
    }
  ];

  const handleStartTutorial = () => {
    if (selectedTutorial) {
      // Here you would integrate with the tutorial system
      onNext();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <PlayIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Choose Your Learning Path</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Select a tutorial to get familiar with Astral Draft's powerful features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tutorials.map(tutorial => {
          const IconComponent = tutorial.icon;
          return (
            <Card
              key={tutorial.id}
              className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedTutorial === tutorial.id
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedTutorial(tutorial.id)}
            >
              <div className="text-center mb-4">
                <IconComponent className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">{tutorial.title}</h3>
                <div className="flex justify-center gap-2 mb-3">
                  <Badge variant="secondary">{tutorial.duration}</Badge>
                  <Badge variant="outline">{tutorial.level}</Badge>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                {tutorial.description}
              </p>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  What you'll learn:
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {tutorial.topics.map((topic, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Don't worry - you can access these tutorials anytime from the help menu
        </p>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Back
        </Button>
        <div className="space-x-3">
          <Button onClick={onSkip} variant="outline">
            Skip for now
          </Button>
          <Button 
            onClick={handleStartTutorial}
            disabled={!selectedTutorial}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
          >
            Start Tutorial
            <PlayIcon className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const CompletionStep: React.FC<WelcomeStepProps> = ({ data }) => {
  const router = useRouter();
  const { user } = useAuth();

  // TODO: Uncomment when user router methods are implemented
  // const updatePreferencesMutation = api.user.updatePreferences.useMutation({
  //   onError: (error: any) => {
  //     console.error('Failed to update preferences:', error);
  //   }
  // });

  // const completeOnboardingMutation = api.user.completeOnboarding.useMutation({
  //   onSuccess: () => {
  //     // Redirect to dashboard on success
  //     router.push('/dashboard');
  //   },
  //   onError: (error: any) => {
  //     console.error('Failed to complete onboarding:', error);
  //   }
  // });

  const handleFinish = async () => {
    try {
      // Save user preferences first (placeholder until API is ready)
      // await updatePreferencesMutation.mutateAsync(data);
      console.log('Saving preferences:', data);
      
      // Then mark onboarding as complete (placeholder until API is ready)
      // await completeOnboardingMutation.mutateAsync();
      console.log('Completing onboarding');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  return (
    <div className="text-center space-y-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="w-12 h-12 text-white" />
        </div>
      </motion.div>
      
      <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
        You're All Set!
      </h1>
      
      <p className="text-xl text-gray-600 dark:text-gray-300">
        Welcome to the future of fantasy football, {data.displayName || user?.name}! 
        Your personalized dashboard is ready.
      </p>

      <Card className="p-6 text-left">
        <h3 className="text-lg font-semibold mb-4">What's next?</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <GiftIcon className="w-5 h-5 text-green-500 mr-3" />
            <span>Explore your personalized dashboard</span>
          </div>
          <div className="flex items-center">
            <UsersIcon className="w-5 h-5 text-blue-500 mr-3" />
            <span>Create or join your first league</span>
          </div>
          <div className="flex items-center">
            <BoltIcon className="w-5 h-5 text-purple-500 mr-3" />
            <span>Try the AI Oracle for player insights</span>
          </div>
          <div className="flex items-center">
            <BookOpenIcon className="w-5 h-5 text-orange-500 mr-3" />
            <span>Access tutorials anytime from the help menu</span>
          </div>
        </div>
      </Card>
      
      <Button 
        onClick={handleFinish}
        size="lg"
        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
      >
        Enter Astral Draft
        <ChevronRightIcon className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
};

// Main Welcome Wizard Component
export const WelcomeWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<Partial<UserPreferences>>({});
  const { user } = useAuth();

  const steps: WelcomeStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Welcome to Astral Draft',
      component: WelcomeStep,
      icon: TrophyIcon,
    },
    {
      id: 'profile',
      title: 'Profile Setup',
      description: 'Set up your profile',
      component: ProfileSetupStep,
      required: true,
      icon: BookOpenIcon,
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your experience',
      component: PreferencesStep,
      icon: StarIcon,
    },
    {
      id: 'tutorial',
      title: 'Tutorial',
      description: 'Learn the basics',
      component: TutorialStep,
      icon: PlayIcon,
    },
    {
      id: 'completion',
      title: 'Complete',
      description: 'You\'re ready to go!',
      component: CompletionStep,
      icon: CheckCircleIcon,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(progress)}% Complete
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`flex items-center ${
                    index <= currentStep ? 'text-blue-600 font-medium' : ''
                  }`}
                >
                  <step.icon className="w-4 h-4 mr-1" />
                  {step.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentStepComponent
              onNext={handleNext}
              onBack={currentStep > 0 ? handleBack : undefined}
              onSkip={handleSkip}
              data={userData}
              setData={setUserData}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WelcomeWizard;