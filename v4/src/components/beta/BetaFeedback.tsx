'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Modal, ModalContent } from '@/components/ui/Modal';
import {
  ChatBubbleLeftIcon,
  BugAntIcon,
  LightBulbIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FlagIcon,
  GiftIcon,
  TrophyIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface BetaFeedback {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  steps?: string[];
  expected?: string;
  actual?: string;
  browser?: string;
  os?: string;
  viewport?: string;
  url?: string;
  screenshot?: string;
  userId: string;
  status: 'open' | 'in-progress' | 'resolved' | 'rejected';
  priority: number;
  votes: number;
  userVote?: 'up' | 'down';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  assignee?: string;
  milestone?: string;
  duplicate?: string;
  category: string;
  userInfo: {
    name: string;
    avatar?: string;
    betaLevel: 'alpha' | 'beta' | 'gamma';
    contributionScore: number;
  };
  responses: BetaResponse[];
}

interface BetaResponse {
  id: string;
  feedbackId: string;
  userId: string;
  message: string;
  type: 'comment' | 'status-update' | 'resolution';
  createdAt: Date;
  userInfo: {
    name: string;
    avatar?: string;
    role: 'user' | 'moderator' | 'developer' | 'admin';
  };
}

interface BetaProgram {
  id: string;
  name: string;
  description: string;
  phase: 'alpha' | 'beta' | 'rc' | 'live';
  features: string[];
  requirements: string[];
  rewards: BetaReward[];
  participants: number;
  maxParticipants: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

interface BetaReward {
  id: string;
  name: string;
  description: string;
  type: 'badge' | 'premium' | 'early-access' | 'merchandise' | 'credits';
  requirement: string;
  value?: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserBetaStats {
  level: 'alpha' | 'beta' | 'gamma';
  contributionScore: number;
  feedbackSubmitted: number;
  bugsReported: number;
  featuresRequested: number;
  votesReceived: number;
  responseRate: number;
  rewardsEarned: BetaReward[];
  rank: number;
  totalParticipants: number;
  streak: number;
  achievements: string[];
}

// Feedback form component
const FeedbackForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: Partial<BetaFeedback>) => void;
  type?: BetaFeedback['type'];
}> = ({ isOpen, onClose, onSubmit, type = 'general' }) => {
  const [formData, setFormData] = useState<Partial<BetaFeedback>>({
    type,
    severity: 'medium',
    title: '',
    description: '',
    steps: [''],
    expected: '',
    actual: '',
    category: '',
    tags: [],
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    {
      title: 'Basic Information',
      fields: ['type', 'severity', 'title', 'category'],
    },
    {
      title: 'Description',
      fields: ['description'],
    },
    {
      title: 'Details',
      fields: ['steps', 'expected', 'actual'],
    },
    {
      title: 'Review',
      fields: [],
    },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Collect system info
      const systemInfo = {
        browser: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.href,
        os: navigator.platform,
      };

      await onSubmit({ ...formData, ...systemInfo });
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type,
      severity: 'medium',
      title: '',
      description: '',
      steps: [''],
      expected: '',
      actual: '',
      category: '',
      tags: [],
    });
    setCurrentStep(0);
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...(formData.steps || []), ''],
    });
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...(formData.steps || [])];
    newSteps[index] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, steps: newSteps });
  };

  const getTypeIcon = (feedbackType: BetaFeedback['type']) => {
    switch (feedbackType) {
      case 'bug':
        return <BugAntIcon className="w-5 h-5" />;
      case 'feature':
        return <LightBulbIcon className="w-5 h-5" />;
      case 'improvement':
        return <StarIcon className="w-5 h-5" />;
      default:
        return <ChatBubbleLeftIcon className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: BetaFeedback['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-lg">
        <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getTypeIcon(formData.type!)}
            <h2 className="text-2xl font-bold">Submit Feedback</h2>
          </div>
          <button onClick={onClose}>
            <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
        </div>

        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Feedback Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'bug', label: 'Bug Report', icon: BugAntIcon },
                    { value: 'feature', label: 'Feature Request', icon: LightBulbIcon },
                    { value: 'improvement', label: 'Improvement', icon: StarIcon },
                    { value: 'general', label: 'General Feedback', icon: ChatBubbleLeftIcon },
                  ].map(option => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, type: option.value as any })}
                        className={`p-3 rounded-lg border-2 transition-colors flex items-center space-x-2 ${
                          formData.type === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low - Minor issue</option>
                  <option value="medium">Medium - Moderate impact</option>
                  <option value="high">High - Significant impact</option>
                  <option value="critical">Critical - Blocking issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue or request"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  <option value="ui-ux">UI/UX</option>
                  <option value="performance">Performance</option>
                  <option value="functionality">Functionality</option>
                  <option value="draft">Draft System</option>
                  <option value="oracle">Oracle AI</option>
                  <option value="mobile">Mobile Experience</option>
                  <option value="notifications">Notifications</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Description */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Description</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Detailed Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a detailed description of the issue or request..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 2 && formData.type === 'bug' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bug Details</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Steps to Reproduce
                </label>
                {formData.steps?.map((step, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      placeholder="Describe this step..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.steps!.length > 1 && (
                      <button
                        onClick={() => removeStep(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addStep}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="text-sm">Add Step</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Expected Behavior
                </label>
                <textarea
                  value={formData.expected}
                  onChange={(e) => setFormData({ ...formData, expected: e.target.value })}
                  placeholder="What did you expect to happen?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Actual Behavior
                </label>
                <textarea
                  value={formData.actual}
                  onChange={(e) => setFormData({ ...formData, actual: e.target.value })}
                  placeholder="What actually happened?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review Your Feedback</h3>
              
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(formData.type!)}
                    <span className="font-medium">{formData.title}</span>
                  </div>
                  <Badge className={getSeverityColor(formData.severity!)}>
                    {formData.severity}
                  </Badge>
                </div>
                
                <p className="text-gray-600 mb-3">{formData.description}</p>
                
                {formData.type === 'bug' && (
                  <div className="space-y-2 text-sm">
                    {formData.steps && formData.steps.length > 0 && (
                      <div>
                        <strong>Steps:</strong>
                        <ol className="list-decimal list-inside ml-2">
                          {formData.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {formData.expected && (
                      <div>
                        <strong>Expected:</strong> {formData.expected}
                      </div>
                    )}
                    {formData.actual && (
                      <div>
                        <strong>Actual:</strong> {formData.actual}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            variant="outline"
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="space-x-3">
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 0 && (!formData.title || !formData.category)) ||
                  (currentStep === 1 && !formData.description)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            )}
          </div>
        </div>
      </div>
      </ModalContent>
    </Modal>
  );
};

// Feedback item component
const FeedbackItem: React.FC<{
  feedback: BetaFeedback;
  onVote: (id: string, vote: 'up' | 'down') => void;
  onRespond: (id: string) => void;
}> = ({ feedback, onVote, onRespond }) => {
  const getTypeIcon = () => {
    switch (feedback.type) {
      case 'bug':
        return <BugAntIcon className="w-5 h-5 text-red-500" />;
      case 'feature':
        return <LightBulbIcon className="w-5 h-5 text-yellow-500" />;
      case 'improvement':
        return <StarIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (feedback.status) {
      case 'open':
        return 'text-blue-600 bg-blue-100';
      case 'in-progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
    }
  };

  const getSeverityColor = () => {
    switch (feedback.severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
    }
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          {getTypeIcon()}
          <div>
            <h3 className="font-semibold text-lg">{feedback.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getStatusColor()}>
                {feedback.status.replace('-', ' ')}
              </Badge>
              <Badge className={getSeverityColor()}>
                {feedback.severity}
              </Badge>
              <span className="text-sm text-gray-500">
                by {feedback.userInfo.name}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(feedback.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onVote(feedback.id, 'up')}
            className={`p-1 rounded ${
              feedback.userVote === 'up' ? 'text-green-600' : 'text-gray-400 hover:text-green-600'
            }`}
          >
            <ArrowUpIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">{feedback.votes}</span>
          <button
            onClick={() => onVote(feedback.id, 'down')}
            className={`p-1 rounded ${
              feedback.userVote === 'down' ? 'text-red-600' : 'text-gray-400 hover:text-red-600'
            }`}
          >
            <ArrowDownIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{feedback.description}</p>

      {feedback.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {feedback.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>#{feedback.id.slice(-6)}</span>
          {feedback.responses.length > 0 && (
            <span>{feedback.responses.length} responses</span>
          )}
        </div>
        
        <Button
          onClick={() => onRespond(feedback.id)}
          variant="outline"
          size="sm"
        >
          <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />
          Respond
        </Button>
      </div>
    </Card>
  );
};

// Beta stats component
const BetaStatsCard: React.FC<{ stats: UserBetaStats }> = ({ stats }) => {
  const getLevelColor = () => {
    switch (stats.level) {
      case 'alpha':
        return 'text-purple-600 bg-purple-100';
      case 'beta':
        return 'text-blue-600 bg-blue-100';
      case 'gamma':
        return 'text-green-600 bg-green-100';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-yellow-600';
      case 'epic':
        return 'text-purple-600';
      case 'rare':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Beta Stats</h3>
        <Badge className={getLevelColor()}>
          {stats.level.toUpperCase()} Tester
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.contributionScore}</div>
          <div className="text-sm text-gray-500">Contribution Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.feedbackSubmitted}</div>
          <div className="text-sm text-gray-500">Feedback Submitted</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.bugsReported}</div>
          <div className="text-sm text-gray-500">Bugs Reported</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">#{stats.rank}</div>
          <div className="text-sm text-gray-500">Leaderboard Rank</div>
        </div>
      </div>

      {stats.rewardsEarned.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Recent Rewards</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.rewardsEarned.slice(0, 4).map(reward => (
              <div key={reward.id} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className={`text-2xl mb-1 ${getRarityColor(reward.rarity)}`}>
                  {reward.icon}
                </div>
                <div className="text-xs font-medium">{reward.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// Main beta feedback component
export const BetaFeedback: React.FC = () => {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<BetaFeedback['type']>('general');
  const [filter, setFilter] = useState<{
    type?: BetaFeedback['type'];
    status?: BetaFeedback['status'];
    category?: string;
    sort: 'votes' | 'recent' | 'priority';
  }>({
    sort: 'votes',
  });

  // TODO: Uncomment when beta router is implemented
  // const { data: feedbackList = [], refetch: refetchFeedback } = api.beta.getFeedback.useQuery(
  //   filter,
  //   {
  //     onError: (error: any) => {
  //       console.error('Failed to load feedback:', error);
  //     }
  //   }
  // );

  // const { data: userStats, refetch: refetchUserStats } = api.beta.getUserStats.useQuery(
  //   undefined,
  //   {
  //     onError: (error: any) => {
  //       console.error('Failed to load user stats:', error);
  //     }
  //   }
  // );

  // Use tRPC mutation hooks (commented until beta router is implemented)
  // const submitFeedbackMutation = api.beta.submitFeedback.useMutation({
  //   onSuccess: () => {
  //     refetchFeedback();
  //     refetchUserStats();
  //   },
  //   onError: (error: any) => {
  //     console.error('Failed to submit feedback:', error);
  //   }
  // });

  // const voteFeedbackMutation = api.beta.voteFeedback.useMutation({
  //   onSuccess: () => {
  //     refetchFeedback();
  //   },
  //   onError: (error: any) => {
  //     console.error('Failed to vote:', error);
  //   }
  // });

  // Placeholder data and functions until API is ready
  const feedbackList: BetaFeedback[] = [];
  const userStats: UserBetaStats | null = null;

  const handleSubmitFeedback = async (feedback: Partial<BetaFeedback>) => {
    // await submitFeedbackMutation.mutateAsync(feedback);
    console.log('Submit feedback:', feedback);
  };

  const handleVote = async (id: string, vote: 'up' | 'down') => {
    // await voteFeedbackMutation.mutateAsync({ id, vote });
    console.log('Vote:', id, vote);
  };

  const handleRespond = (id: string) => {
    // Open response modal
    console.log('Respond to feedback:', id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Beta Feedback Center</h1>
            <p className="text-gray-600">
              Help us improve Astral Draft by sharing your feedback and reporting issues
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setFeedbackType('bug');
                setIsFormOpen(true);
              }}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <BugAntIcon className="w-5 h-5 mr-2" />
              Report Bug
            </Button>
            <Button
              onClick={() => {
                setFeedbackType('feature');
                setIsFormOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <LightBulbIcon className="w-5 h-5 mr-2" />
              Suggest Feature
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Stats */}
            {userStats && <BetaStatsCard stats={userStats} />}

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setFeedbackType('general');
                    setIsFormOpen(true);
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                  General Feedback
                </Button>
                <Button
                  onClick={() => {
                    setFeedbackType('improvement');
                    setIsFormOpen(true);
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <StarIcon className="w-4 h-4 mr-2" />
                  Suggest Improvement
                </Button>
              </div>
            </Card>

            {/* Filters */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={filter.type || ''}
                    onChange={(e) => setFilter({ ...filter, type: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="bug">Bug Reports</option>
                    <option value="feature">Feature Requests</option>
                    <option value="improvement">Improvements</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={filter.status || ''}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={filter.sort}
                    onChange={(e) => setFilter({ ...filter, sort: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="votes">Most Voted</option>
                    <option value="recent">Most Recent</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {feedbackList.length === 0 ? (
              <Card className="p-12 text-center">
                <ChatBubbleLeftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No feedback found
                </h3>
                <p className="text-gray-500 mb-6">
                  Be the first to share your thoughts and help us improve!
                </p>
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Submit Feedback
                </Button>
              </Card>
            ) : (
              feedbackList.map(feedback => (
                <FeedbackItem
                  key={feedback.id}
                  feedback={feedback}
                  onVote={handleVote}
                  onRespond={handleRespond}
                />
              ))
            )}
          </div>
        </div>

        {/* Feedback Form Modal */}
        <FeedbackForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmitFeedback}
          type={feedbackType}
        />
      </div>
    </div>
  );
};

export default BetaFeedback;