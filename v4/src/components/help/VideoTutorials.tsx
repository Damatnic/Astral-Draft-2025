/**
 * Video Tutorials Component (Phase 11.3)
 * Interactive video tutorials and scripts for key features
 */

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { PlayIcon, PauseIcon, ClockIcon, UserIcon, StarIcon, BookOpenIcon } from 'lucide-react';

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl: string;
  videoUrl?: string;
  script: TutorialScript;
  tags: string[];
  rating: number;
  views: number;
}

interface TutorialScript {
  introduction: string;
  steps: TutorialStep[];
  conclusion: string;
  keyTakeaways: string[];
}

interface TutorialStep {
  stepNumber: number;
  title: string;
  content: string;
  action?: string;
  screenshot?: string;
  duration: string;
}

const videoTutorials: VideoTutorial[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Astral Draft',
    description: 'Complete beginner\'s guide to setting up your first fantasy football league and understanding the basics.',
    category: 'Getting Started',
    duration: '8:45',
    difficulty: 'beginner',
    thumbnailUrl: '/tutorials/getting-started-thumb.jpg',
    videoUrl: 'https://youtube.com/watch?v=astral-draft-intro',
    tags: ['basics', 'setup', 'league-creation'],
    rating: 4.8,
    views: 15420,
    script: {
      introduction: `Welcome to Astral Draft! I'm excited to help you get started with the most advanced fantasy football platform available. In this tutorial, we'll cover everything you need to know to set up your first league and start dominating your competition. By the end of this video, you'll understand how to create a league, invite friends, and use our powerful Oracle AI system.`,
      steps: [
        {
          stepNumber: 1,
          title: 'Creating Your Account',
          content: 'First, let\'s create your Astral Draft account. Click the "Sign Up" button in the top right corner. You\'ll need to provide an email address, create a secure password, and choose a unique username that your league mates will see.',
          action: 'Click Sign Up → Fill out registration form → Verify email',
          duration: '1:30'
        },
        {
          stepNumber: 2,
          title: 'League Creation Wizard',
          content: 'Now we\'ll create your first league. Click "Create League" and you\'ll see our smart league creation wizard. Choose your league name, number of teams (8-16 recommended), and scoring format. PPR scoring is most popular for beginners.',
          action: 'Dashboard → Create League → Configure settings',
          duration: '2:00'
        },
        {
          stepNumber: 3,
          title: 'Inviting League Members',
          content: 'A fantasy league is nothing without friends! Use the invite system to send email invitations to your league mates. You can also share the unique join code for easy access.',
          action: 'League Settings → Invite Members → Send invitations',
          duration: '1:15'
        },
        {
          stepNumber: 4,
          title: 'Draft Setup',
          content: 'Before you can draft, you need to schedule when it will happen. Choose a date and time that works for everyone. Our system supports both live and offline drafts with autopick backup.',
          action: 'Draft → Schedule Draft → Set date/time',
          duration: '1:30'
        },
        {
          stepNumber: 5,
          title: 'Understanding the Dashboard',
          content: 'Your dashboard is command central. Here you can see your team, upcoming matchups, league standings, and access all of Astral Draft\'s powerful features. The Oracle AI panel shows personalized recommendations.',
          action: 'Explore dashboard sections and widgets',
          duration: '2:30'
        }
      ],
      conclusion: `Congratulations! You've successfully set up your first Astral Draft league. Remember, fantasy football is all about having fun with friends while testing your NFL knowledge. Don't forget to check out our other tutorials on draft strategy and using Oracle AI. Good luck this season!`,
      keyTakeaways: [
        'Start with PPR scoring for beginners',
        'Schedule your draft early to ensure everyone can attend',
        'Use the Oracle AI for player recommendations',
        'Check your dashboard regularly for updates',
        'Have fun and stay engaged all season!'
      ]
    }
  },
  {
    id: 'draft-mastery',
    title: 'Draft Like a Pro: Advanced Strategies',
    description: 'Master advanced draft techniques including positional strategy, value-based drafting, and using Oracle AI predictions.',
    category: 'Draft Strategy',
    duration: '12:30',
    difficulty: 'advanced',
    thumbnailUrl: '/tutorials/draft-mastery-thumb.jpg',
    tags: ['draft', 'strategy', 'advanced', 'oracle'],
    rating: 4.9,
    views: 8934,
    script: {
      introduction: `Ready to take your draft game to the next level? This advanced tutorial covers proven strategies used by fantasy football pros, including how to leverage Astral Draft's Oracle AI for maximum advantage. We'll explore positional strategy, value-based drafting, and real-time decision making during your draft.`,
      steps: [
        {
          stepNumber: 1,
          title: 'Pre-Draft Preparation',
          content: 'Preparation is key to draft success. Start by reviewing Oracle AI rankings and identifying sleepers, busts, and value picks. Create your personal rankings and tier lists. Research ADP (Average Draft Position) to identify value opportunities.',
          action: 'Oracle → Player Rankings → Create custom tiers',
          duration: '2:30'
        },
        {
          stepNumber: 2,
          title: 'Draft Room Navigation',
          content: 'Familiarize yourself with the draft room interface. Learn where to find player information, Oracle predictions, and how to make picks quickly. Set up your queue to prepare for rapid-fire rounds.',
          action: 'Enter mock draft → Practice interface navigation',
          duration: '2:00'
        },
        {
          stepNumber: 3,
          title: 'Oracle AI Integration',
          content: 'This is where Astral Draft shines. Oracle AI provides real-time draft grades, optimal pick suggestions, and value alerts. Learn to balance AI recommendations with your own research and gut instincts.',
          action: 'Review Oracle suggestions → Understand confidence scores',
          duration: '3:00'
        },
        {
          stepNumber: 4,
          title: 'Positional Strategy Execution',
          content: 'Whether you\'re going Zero RB, Robust RB, or Best Player Available, stick to your strategy while remaining flexible. Oracle AI will alert you when exceptional value appears at any position.',
          action: 'Execute chosen strategy → Adapt to draft flow',
          duration: '2:30'
        },
        {
          stepNumber: 5,
          title: 'Late Round Value Mining',
          content: 'The late rounds separate good drafters from great ones. Use Oracle AI to identify handcuffs, lottery tickets, and breakout candidates that others might miss.',
          action: 'Focus on high-upside late round picks',
          duration: '2:30'
        }
      ],
      conclusion: `You now have the tools and knowledge to draft like a seasoned pro. Remember, the draft is just the beginning - stay active on waivers and use Oracle AI throughout the season for optimal lineup decisions. Your league mates won't know what hit them!`,
      keyTakeaways: [
        'Preparation beats luck every time',
        'Use Oracle AI confidence scores to guide decisions',
        'Stay flexible while maintaining your core strategy',
        'Late rounds are where championships are won',
        'Practice with mock drafts before the real thing'
      ]
    }
  },
  {
    id: 'oracle-ai-mastery',
    title: 'Mastering Oracle AI: Your Fantasy Assistant',
    description: 'Deep dive into Oracle AI features including predictions, trade analysis, lineup optimization, and learning from feedback.',
    category: 'Oracle AI',
    duration: '10:15',
    difficulty: 'intermediate',
    thumbnailUrl: '/tutorials/oracle-ai-thumb.jpg',
    tags: ['oracle', 'ai', 'predictions', 'analysis'],
    rating: 4.7,
    views: 12100,
    script: {
      introduction: `Oracle AI is Astral Draft's secret weapon - a sophisticated machine learning system that gives you a massive competitive advantage. In this comprehensive tutorial, we'll explore every Oracle feature and show you how to use AI insights to dominate your league.`,
      steps: [
        {
          stepNumber: 1,
          title: 'Understanding Oracle Predictions',
          content: 'Oracle analyzes thousands of data points to predict player performance. Learn to interpret confidence scores, projection ranges, and the factors that influence predictions like weather, injuries, and matchups.',
          action: 'Oracle Dashboard → Review player predictions',
          duration: '2:30'
        },
        {
          stepNumber: 2,
          title: 'Trade Analysis Tool',
          content: 'The trade analyzer is incredibly powerful. Input any proposed trade and Oracle evaluates fairness, long-term impact, and win probability changes. It even suggests counter-offers to improve deals.',
          action: 'Trade Center → Analyze Trade → Review recommendations',
          duration: '2:45'
        },
        {
          stepNumber: 3,
          title: 'Lineup Optimization',
          content: 'Why guess at lineups when Oracle can optimize them? The system considers projections, uncertainty, and your risk tolerance to build optimal starting lineups every week.',
          action: 'My Team → Lineup Optimizer → Review suggestions',
          duration: '2:00'
        },
        {
          stepNumber: 4,
          title: 'Waiver Wire Intelligence',
          content: 'Oracle identifies the best waiver wire pickups before your competition does. Get alerts for breakout candidates and stream recommendations for D/ST and kickers.',
          action: 'Waiver Wire → Oracle Recommendations → Set alerts',
          duration: '1:30'
        },
        {
          stepNumber: 5,
          title: 'Providing Feedback',
          content: 'Help Oracle learn by rating prediction accuracy. The more feedback you provide, the better Oracle becomes at understanding your league\'s unique dynamics and your personal preferences.',
          action: 'Rate predictions → Improve AI accuracy over time',
          duration: '1:30'
        }
      ],
      conclusion: `Oracle AI is your 24/7 fantasy football consultant, working tirelessly to give you every possible edge. The key is learning to trust the system while still applying your own football knowledge. Combined with Oracle insights, you'll make better decisions than ever before.`,
      keyTakeaways: [
        'Higher confidence predictions are more reliable',
        'Use trade analyzer before making any deals',
        'Lineup optimizer saves time and improves results',
        'Waiver recommendations give you early advantages',
        'Feedback helps Oracle learn your preferences'
      ]
    }
  },
  {
    id: 'mobile-mastery',
    title: 'Fantasy on the Go: Mobile App Features',
    description: 'Master the mobile app with offline capabilities, push notifications, and touch-optimized interfaces.',
    category: 'Mobile',
    duration: '6:20',
    difficulty: 'beginner',
    thumbnailUrl: '/tutorials/mobile-mastery-thumb.jpg',
    tags: ['mobile', 'offline', 'notifications'],
    rating: 4.6,
    views: 9850,
    script: {
      introduction: `Fantasy football doesn't stop when you leave your computer. Astral Draft's mobile app keeps you connected with full offline capabilities, instant notifications, and a beautiful touch interface. Never miss a lineup change or waiver opportunity again!`,
      steps: [
        {
          stepNumber: 1,
          title: 'Installing and Setup',
          content: 'Download Astral Draft from your app store and log in with your existing account. Enable push notifications to stay updated on all league activity.',
          action: 'Download app → Login → Enable notifications',
          duration: '1:00'
        },
        {
          stepNumber: 2,
          title: 'Offline Capabilities',
          content: 'The app works even without internet! View your roster, check player stats, and queue lineup changes that sync when you\'re back online. Perfect for subway commutes or airplane travel.',
          action: 'Explore offline features → Test sync capabilities',
          duration: '1:30'
        },
        {
          stepNumber: 3,
          title: 'Quick Actions',
          content: 'Touch-optimized interface makes common actions lightning fast. Swipe to compare players, long-press for quick menus, and use haptic feedback for confirmation.',
          action: 'Practice touch gestures → Set lineups quickly',
          duration: '1:20'
        },
        {
          stepNumber: 4,
          title: 'Live Draft Mobile',
          content: 'Drafting on mobile is smooth and intuitive. Auto-rotate for player comparison views, and use the floating draft board to track picks while researching players.',
          action: 'Join mock draft → Practice mobile drafting',
          duration: '1:30'
        },
        {
          stepNumber: 5,
          title: 'Notification Management',
          content: 'Customize which notifications you receive and when. Get alerts for lineup deadlines, injury news, trade offers, and Oracle recommendations.',
          action: 'Settings → Notifications → Customize alerts',
          duration: '1:00'
        }
      ],
      conclusion: `With the mobile app mastered, you'll never miss a fantasy opportunity. Whether you're in a meeting, traveling, or just away from your computer, Astral Draft keeps you competitive 24/7. Fantasy football is now truly in your pocket!`,
      keyTakeaways: [
        'Offline mode keeps you connected anywhere',
        'Touch gestures speed up common actions',
        'Mobile drafting is full-featured and intuitive',
        'Customize notifications for your lifestyle',
        'Sync seamlessly between devices'
      ]
    }
  },
  {
    id: 'season-management',
    title: 'Season-Long Management: Staying Competitive',
    description: 'Advanced techniques for managing your team throughout the season including waiver strategy, trades, and playoff preparation.',
    category: 'Team Management',
    duration: '14:20',
    difficulty: 'intermediate',
    thumbnailUrl: '/tutorials/season-management-thumb.jpg',
    tags: ['management', 'waivers', 'trades', 'playoffs'],
    rating: 4.8,
    views: 7243,
    script: {
      introduction: `The draft is just 10% of fantasy football success. This comprehensive guide covers season-long management strategies that separate champions from also-rans. Learn advanced waiver wire tactics, trade timing, and how to position your team for a playoff run.`,
      steps: [
        {
          stepNumber: 1,
          title: 'Early Season Strategy (Weeks 1-4)',
          content: 'The first month is about identifying trends and making quick adjustments. Use Oracle AI to spot early breakouts and busts. Be aggressive on waivers - season-winning pickups often come early.',
          action: 'Monitor player usage → Identify breakout candidates',
          duration: '3:00'
        },
        {
          stepNumber: 2,
          title: 'Mid-Season Optimization (Weeks 5-10)',
          content: 'This is prime trading season. Teams start to panic or get desperate. Use Oracle\'s trade analyzer to identify buy-low and sell-high opportunities. Focus on schedule strength for playoff planning.',
          action: 'Analyze trade targets → Execute strategic trades',
          duration: '3:30'
        },
        {
          stepNumber: 3,
          title: 'Playoff Preparation (Weeks 11-13)',
          content: 'Start planning for playoffs now. Stockpile players with favorable playoff schedules. Consider handcuffs for injury insurance. Oracle AI helps identify schedule-based advantages.',
          action: 'Review playoff schedules → Acquire lottery tickets',
          duration: '2:50'
        },
        {
          stepNumber: 4,
          title: 'Waiver Wire Mastery',
          content: 'Advanced waiver strategy goes beyond just adding the hot pickup. Consider roster construction, schedule, and opportunity cost. Oracle\'s waiver recommendations factor in long-term value.',
          action: 'Strategic waiver planning → Long-term roster building',
          duration: '2:30'
        },
        {
          stepNumber: 5,
          title: 'Playoff Execution',
          content: 'In playoffs, every decision matters. Use Oracle\'s lineup optimizer religiously. Consider ceiling vs floor based on your matchup. Don\'t overthink - trust your preparation.',
          action: 'Optimize playoff lineups → Execute game plan',
          duration: '2:30'
        }
      ],
      conclusion: `Season-long management is what turns good drafters into champions. Stay active, trust the process, and use Oracle AI as your guide. Remember, fantasy football rewards the persistent and prepared. Your championship trophy awaits!`,
      keyTakeaways: [
        'Early season aggression often pays off',
        'Mid-season trades can make or break your season',
        'Playoff preparation starts in November',
        'Advanced waiver strategy beats reactive pickups',
        'Trust your preparation during playoff pressure'
      ]
    }
  }
];

const categories = [
  'All Categories',
  'Getting Started',
  'Draft Strategy', 
  'Oracle AI',
  'Mobile',
  'Team Management'
];

export const VideoTutorials: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const filteredVideos = selectedCategory === 'All Categories' 
    ? videoTutorials 
    : videoTutorials.filter(video => video.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'advanced': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon 
        key={i} 
        className={cn('w-4 h-4', i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-400')} 
      />
    ));
  };

  if (selectedVideo) {
    return (
      <div className="min-h-screen bg-astral-void">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedVideo(null);
              setShowScript(false);
              setCurrentStep(0);
            }}
            className="mb-6 flex items-center text-astral-purple-300 hover:text-white transition-colors"
          >
            ← Back to Tutorials
          </button>

          {/* Video Header */}
          <div className="glass-card p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player Placeholder */}
              <div className="lg:col-span-2">
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
                  <img 
                    src={selectedVideo.thumbnailUrl} 
                    alt={selectedVideo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <button className="w-20 h-20 bg-astral-purple-500 hover:bg-astral-purple-400 rounded-full flex items-center justify-center transition-colors">
                      <PlayIcon className="w-8 h-8 text-white ml-1" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-white text-sm">
                    {selectedVideo.duration}
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-white">{selectedVideo.title}</h1>
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className={cn('px-2 py-1 rounded text-xs', getDifficultyColor(selectedVideo.difficulty))}>
                    {selectedVideo.difficulty}
                  </span>
                  <div className="flex items-center space-x-1">
                    {renderStars(selectedVideo.rating)}
                    <span className="text-astral-purple-300 ml-1">({selectedVideo.rating})</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-astral-purple-300">
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {selectedVideo.duration}
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 mr-1" />
                    {selectedVideo.views.toLocaleString()} views
                  </div>
                </div>

                <p className="text-astral-purple-200">{selectedVideo.description}</p>

                <div className="flex flex-wrap gap-2">
                  {selectedVideo.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-astral-purple-500/20 text-astral-purple-300 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button className="btn-primary flex-1">
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Watch Video
                  </button>
                  <button 
                    onClick={() => setShowScript(!showScript)}
                    className="btn-secondary"
                  >
                    <BookOpenIcon className="w-4 h-4 mr-2" />
                    {showScript ? 'Hide' : 'Show'} Script
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tutorial Script */}
          {showScript && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Tutorial Script & Steps</h2>
              
              {/* Introduction */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-astral-purple-300 mb-3">Introduction</h3>
                <p className="text-astral-purple-200 leading-relaxed">{selectedVideo.script.introduction}</p>
              </div>

              {/* Steps */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-astral-purple-300 mb-4">Tutorial Steps</h3>
                <div className="space-y-4">
                  {selectedVideo.script.steps.map((step, index) => (
                    <div 
                      key={step.stepNumber}
                      className={cn(
                        'border-l-4 pl-6 py-4 transition-colors cursor-pointer',
                        currentStep === index 
                          ? 'border-astral-purple-500 bg-astral-purple-500/10'
                          : 'border-astral-steel hover:border-astral-purple-400'
                      )}
                      onClick={() => setCurrentStep(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">
                          Step {step.stepNumber}: {step.title}
                        </h4>
                        <span className="text-xs bg-astral-steel text-astral-purple-300 px-2 py-1 rounded">
                          {step.duration}
                        </span>
                      </div>
                      <p className="text-astral-purple-200 mb-3">{step.content}</p>
                      {step.action && (
                        <div className="bg-astral-steel/20 p-3 rounded">
                          <strong className="text-astral-purple-300">Action:</strong>
                          <span className="text-astral-purple-200 ml-2">{step.action}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Conclusion */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-astral-purple-300 mb-3">Conclusion</h3>
                <p className="text-astral-purple-200 leading-relaxed">{selectedVideo.script.conclusion}</p>
              </div>

              {/* Key Takeaways */}
              <div>
                <h3 className="text-lg font-semibold text-astral-purple-300 mb-3">Key Takeaways</h3>
                <ul className="space-y-2">
                  {selectedVideo.script.keyTakeaways.map((takeaway, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-astral-purple-500 mr-3 mt-1">✓</span>
                      <span className="text-astral-purple-200">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-astral-void">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient mb-4">Video Tutorials</h1>
          <p className="text-xl text-astral-purple-300 max-w-2xl mx-auto">
            Master every aspect of Astral Draft with our comprehensive video guide library
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors text-sm',
                selectedCategory === category
                  ? 'bg-astral-purple-500 text-white'
                  : 'bg-astral-steel/20 text-astral-purple-300 hover:bg-astral-steel/30'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <div 
              key={video.id}
              className="glass-card overflow-hidden hover:border-astral-purple-500/50 transition-colors cursor-pointer"
              onClick={() => setSelectedVideo(video)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video">
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <button className="w-12 h-12 bg-astral-purple-500 hover:bg-astral-purple-400 rounded-full flex items-center justify-center transition-colors">
                    <PlayIcon className="w-6 h-6 text-white ml-0.5" />
                  </button>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-xs">
                  {video.duration}
                </div>
                <div className="absolute top-2 left-2">
                  <span className={cn('px-2 py-1 rounded text-xs', getDifficultyColor(video.difficulty))}>
                    {video.difficulty}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-2 line-clamp-2">{video.title}</h3>
                <p className="text-astral-purple-300 text-sm mb-3 line-clamp-2">{video.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1">
                    {renderStars(video.rating)}
                    <span className="text-astral-purple-300 text-xs ml-1">({video.rating})</span>
                  </div>
                  <span className="text-astral-purple-400 text-xs">{video.views.toLocaleString()} views</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {video.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-astral-purple-500/20 text-astral-purple-300 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                  {video.tags.length > 3 && (
                    <span className="text-astral-purple-400 text-xs">+{video.tags.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start Section */}
        <div className="mt-12 glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">New to Fantasy Football?</h2>
          <p className="text-astral-purple-300 mb-6">
            Start with these essential tutorials to get up and running quickly.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {videoTutorials.filter(v => v.difficulty === 'beginner').slice(0, 3).map(video => (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="p-4 bg-astral-steel/20 rounded-lg text-left hover:bg-astral-steel/30 transition-colors"
              >
                <h3 className="font-semibold text-white mb-2">{video.title}</h3>
                <p className="text-sm text-astral-purple-300 mb-2">{video.duration}</p>
                <div className="flex items-center space-x-1">
                  {renderStars(video.rating)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoTutorials;