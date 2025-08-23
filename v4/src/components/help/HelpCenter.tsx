/**
 * Help Center Component (Phase 11.3)
 * Comprehensive in-app help system with search, categories, and interactive guides
 */

import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { SearchIcon, BookOpenIcon, ChevronRightIcon, ChevronDownIcon, StarIcon } from 'lucide-react';

// Help Article Interface
interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popularity: number;
  lastUpdated: string;
  videoUrl?: string;
  relatedArticles?: string[];
}

// Help Categories
const helpCategories = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: '🚀',
    description: 'New to fantasy football? Start here!'
  },
  {
    id: 'draft',
    name: 'Draft Guide',
    icon: '🎯',
    description: 'Master your draft strategy'
  },
  {
    id: 'team-management',
    name: 'Team Management',
    icon: '👥',
    description: 'Managing your roster and lineup'
  },
  {
    id: 'trading',
    name: 'Trading',
    icon: '🔄',
    description: 'Trade like a pro'
  },
  {
    id: 'waivers',
    name: 'Waiver Wire',
    icon: '📋',
    description: 'Navigate the waiver wire'
  },
  {
    id: 'oracle',
    name: 'Oracle AI',
    icon: '🔮',
    description: 'Using AI predictions and insights'
  },
  {
    id: 'scoring',
    name: 'Scoring & Rules',
    icon: '📊',
    description: 'Understanding league settings'
  },
  {
    id: 'mobile',
    name: 'Mobile App',
    icon: '📱',
    description: 'Using Astral Draft on mobile'
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    icon: '🔧',
    description: 'Common issues and solutions'
  }
];

// Sample Help Articles
const helpArticles: HelpArticle[] = [
  {
    id: 'getting-started-basics',
    title: 'Fantasy Football Basics for Beginners',
    content: `
# Fantasy Football Basics

Welcome to the exciting world of fantasy football! This guide will help you understand the fundamentals.

## What is Fantasy Football?

Fantasy football is a game where you draft and manage a team of real NFL players. Your team earns points based on how those players perform in actual NFL games.

## Key Concepts

### 1. The Draft
- You'll select players to build your team
- Each player can only be owned by one team in your league
- Draft order is usually randomized

### 2. Your Roster
- **Starting Lineup**: Players who score points for you each week
- **Bench**: Backup players who don't score points unless in your starting lineup
- **IR**: Injured Reserve for hurt players

### 3. Scoring
- **Touchdowns**: 6 points for rushing/receiving, 4 for passing
- **Yards**: 1 point per 10 rushing/receiving yards, 1 per 25 passing yards
- **Field Goals**: 3 points, with bonuses for longer kicks

## Getting Started Checklist

1. ✅ Join or create a league
2. ✅ Research players before your draft
3. ✅ Set your lineup each week
4. ✅ Monitor the waiver wire for free agents
5. ✅ Stay active with trades and roster moves

## Next Steps

Once you're comfortable with the basics, explore our advanced guides on draft strategy, trade analysis, and using the Oracle AI for predictions.
    `,
    category: 'getting-started',
    tags: ['basics', 'beginner', 'rules', 'draft'],
    difficulty: 'beginner',
    popularity: 95,
    lastUpdated: '2024-08-15',
    videoUrl: 'https://youtube.com/watch?v=fantasy-basics',
    relatedArticles: ['draft-strategy-guide', 'lineup-optimization']
  },
  {
    id: 'draft-strategy-guide',
    title: 'Advanced Draft Strategy Guide',
    content: `
# Advanced Draft Strategy

Master your draft with these proven strategies and tips.

## Pre-Draft Preparation

### 1. Research Player Rankings
- Use multiple sources for rankings
- Understand positional scarcity
- Identify sleepers and busts

### 2. Mock Drafts
- Practice with different draft positions
- Test various strategies
- Get comfortable with the draft interface

## Draft Strategies

### Zero RB Strategy
- Wait on running backs until later rounds
- Focus on WRs and elite TEs early
- Target RB handcuffs and lottery tickets

### Robust RB Strategy
- Secure multiple RBs early
- Build depth at the most volatile position
- Trade from strength during the season

### Best Player Available (BPA)
- Always draft the highest-rated player
- Ignore positional needs early
- Trust your rankings

## Position-Specific Tips

### Quarterbacks
- Don't reach early unless it's an elite tier
- Stream QBs based on matchups
- Target QBs with rushing upside

### Running Backs
- Prioritize workload over talent early
- Handcuff your RB1
- Monitor snap counts and target share

### Wide Receivers
- Target high-volume receivers
- Consider team passing offense strength
- Look for red zone targets

## Draft Day Execution

1. **Stay flexible** - Don't force a strategy if the draft isn't cooperating
2. **Watch ADP** - Identify when players are falling
3. **Take notes** - Track other teams' needs
4. **Time management** - Don't let the clock run out
5. **Have fun** - It's a game, enjoy the process!
    `,
    category: 'draft',
    tags: ['strategy', 'advanced', 'preparation', 'tactics'],
    difficulty: 'advanced',
    popularity: 88,
    lastUpdated: '2024-08-10',
    relatedArticles: ['getting-started-basics', 'oracle-draft-assistant']
  },
  {
    id: 'oracle-ai-guide',
    title: 'Using Oracle AI for Predictions',
    content: `
# Oracle AI: Your Fantasy Assistant

Learn how to leverage our advanced AI system for better fantasy decisions.

## What is Oracle AI?

Oracle AI is our proprietary machine learning system that analyzes thousands of data points to provide:
- Player performance predictions
- Trade analysis and recommendations
- Optimal lineup suggestions
- Waiver wire priorities

## Getting Accurate Predictions

### 1. Player Predictions
- Access individual player forecasts
- View confidence levels for each prediction
- Understand injury impact assessments
- Get weekly projection ranges

### 2. Trade Analyzer
- Input proposed trades for instant analysis
- Get fairness scores and win probability changes
- See long-term impact on your team
- Receive counter-offer suggestions

### 3. Lineup Optimizer
- Generate optimal lineups automatically
- Factor in weather, injuries, and matchups
- Adjust for risk tolerance (ceiling vs floor)
- Get explanations for recommendations

## Oracle Features

### Real-Time Updates
- Predictions update with breaking news
- Injury reports automatically incorporated
- Weather and game script adjustments
- Vegas line movements factored in

### Confidence Scores
- Each prediction includes confidence percentage
- Higher confidence = more reliable prediction
- Use for decision-making prioritization

### Learning Feedback
- Rate prediction accuracy to improve the system
- Oracle learns from your league's scoring settings
- Personalized recommendations based on your team

## Best Practices

1. **Don't blindly follow** - Use Oracle as one input among many
2. **Understand confidence** - Higher confidence predictions are more reliable
3. **Consider context** - Factor in your league's unique settings
4. **Provide feedback** - Help Oracle learn and improve
5. **Stay updated** - Check for new predictions throughout the week

## Pro Tips

- Set up Oracle alerts for your players
- Use trade analyzer before making any deals
- Check lineup optimizer Sunday mornings
- Review Oracle's accuracy to build trust
- Combine Oracle insights with your own research
    `,
    category: 'oracle',
    tags: ['ai', 'predictions', 'advanced', 'technology'],
    difficulty: 'intermediate',
    popularity: 92,
    lastUpdated: '2024-08-12',
    videoUrl: 'https://youtube.com/watch?v=oracle-ai-guide'
  }
];

// Help Center Component
export const HelpCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['getting-started']));

  // Filter articles based on search and category
  const filteredArticles = useMemo(() => {
    return helpArticles.filter(article => {
      const matchesSearch = searchTerm === '' || 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !selectedCategory || article.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const renderStars = (popularity: number) => {
    const stars = Math.round(popularity / 20);
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon 
        key={i} 
        className={cn('w-4 h-4', i < stars ? 'text-yellow-400 fill-current' : 'text-gray-400')} 
      />
    ));
  };

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-astral-void">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => setSelectedArticle(null)}
            className="mb-6 flex items-center text-astral-purple-300 hover:text-white transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4 rotate-180 mr-2" />
            Back to Help Center
          </button>

          {/* Article Header */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{selectedArticle.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-astral-purple-300">
                  <span className={getDifficultyColor(selectedArticle.difficulty)}>
                    {selectedArticle.difficulty.charAt(0).toUpperCase() + selectedArticle.difficulty.slice(1)}
                  </span>
                  <span>Updated {selectedArticle.lastUpdated}</span>
                  <div className="flex items-center space-x-1">
                    {renderStars(selectedArticle.popularity)}
                  </div>
                </div>
              </div>
              {selectedArticle.videoUrl && (
                <button className="btn-primary">
                  📹 Watch Video
                </button>
              )}
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {selectedArticle.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-astral-purple-500/20 text-astral-purple-300 rounded text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Article Content */}
          <div className="glass-card p-8">
            <div 
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: selectedArticle.content.replace(/\n/g, '<br/>').replace(/#{1,6}\s/g, '<h$&>').replace(/<h(\d+)>/g, '<h$1 class="text-white font-bold mb-4">') 
              }}
            />
          </div>

          {/* Related Articles */}
          {selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0 && (
            <div className="glass-card p-6 mt-8">
              <h3 className="text-xl font-bold text-white mb-4">Related Articles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedArticle.relatedArticles.map(articleId => {
                  const relatedArticle = helpArticles.find(a => a.id === articleId);
                  if (!relatedArticle) return null;
                  
                  return (
                    <button
                      key={articleId}
                      onClick={() => setSelectedArticle(relatedArticle)}
                      className="p-4 bg-astral-steel/20 rounded-lg text-left hover:bg-astral-steel/30 transition-colors"
                    >
                      <h4 className="font-semibold text-white mb-2">{relatedArticle.title}</h4>
                      <p className="text-sm text-astral-purple-300">
                        {relatedArticle.content.substring(0, 100)}...
                      </p>
                    </button>
                  );
                })}
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
          <h1 className="text-4xl font-bold text-gradient mb-4">Help Center</h1>
          <p className="text-xl text-astral-purple-300 max-w-2xl mx-auto">
            Everything you need to dominate your fantasy league
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-astral-purple-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-astral-steel/20 border border-astral-purple-500/30 rounded-lg text-white placeholder-astral-purple-400 focus:border-astral-purple-500 focus:outline-none focus:ring-2 focus:ring-astral-purple-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-6">
              <h2 className="text-lg font-bold text-white mb-4">Categories</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-colors',
                    selectedCategory === null 
                      ? 'bg-astral-purple-500/20 text-white' 
                      : 'hover:bg-astral-steel/20 text-astral-purple-300'
                  )}
                >
                  📚 All Articles
                </button>
                {helpCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-colors',
                      selectedCategory === category.id 
                        ? 'bg-astral-purple-500/20 text-white' 
                        : 'hover:bg-astral-steel/20 text-astral-purple-300'
                    )}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{category.icon}</span>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs opacity-75">{category.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="lg:col-span-3">
            {searchTerm && (
              <div className="mb-6 text-astral-purple-300">
                Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} for "{searchTerm}"
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map(article => (
                <div key={article.id} className="glass-card p-6 hover:border-astral-purple-500/50 transition-colors cursor-pointer"
                     onClick={() => setSelectedArticle(article)}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white line-clamp-2">{article.title}</h3>
                    {article.videoUrl && (
                      <span className="text-2xl">📹</span>
                    )}
                  </div>
                  
                  <p className="text-astral-purple-300 text-sm mb-4 line-clamp-3">
                    {article.content.replace(/#{1,6}\s/g, '').substring(0, 150)}...
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={cn('text-xs px-2 py-1 rounded', getDifficultyColor(article.difficulty))}>
                        {article.difficulty}
                      </span>
                      <div className="flex items-center space-x-1">
                        {renderStars(article.popularity)}
                      </div>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-astral-purple-400" />
                  </div>
                </div>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
                <p className="text-astral-purple-300">Try adjusting your search terms or browse categories</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Need More Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-astral-steel/20 rounded-lg text-left hover:bg-astral-steel/30 transition-colors">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-white mb-1">Contact Support</h3>
              <p className="text-sm text-astral-purple-300">Get help from our team</p>
            </button>
            
            <button className="p-4 bg-astral-steel/20 rounded-lg text-left hover:bg-astral-steel/30 transition-colors">
              <div className="text-2xl mb-2">📺</div>
              <h3 className="font-semibold text-white mb-1">Video Tutorials</h3>
              <p className="text-sm text-astral-purple-300">Watch step-by-step guides</p>
            </button>
            
            <button className="p-4 bg-astral-steel/20 rounded-lg text-left hover:bg-astral-steel/30 transition-colors">
              <div className="text-2xl mb-2">🎮</div>
              <h3 className="font-semibold text-white mb-1">Interactive Tour</h3>
              <p className="text-sm text-astral-purple-300">Guided walkthrough</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;