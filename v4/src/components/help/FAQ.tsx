/**
 * FAQ Component (Phase 11.3)
 * Frequently Asked Questions with search and categorization
 */

import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDownIcon, SearchIcon, HelpCircleIcon } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  popularity: number;
}

const faqCategories = [
  { id: 'general', name: 'General', icon: '❓' },
  { id: 'draft', name: 'Draft', icon: '🎯' },
  { id: 'scoring', name: 'Scoring', icon: '📊' },
  { id: 'trades', name: 'Trades', icon: '🔄' },
  { id: 'waivers', name: 'Waivers', icon: '📋' },
  { id: 'oracle', name: 'Oracle AI', icon: '🔮' },
  { id: 'mobile', name: 'Mobile', icon: '📱' },
  { id: 'technical', name: 'Technical', icon: '⚙️' }
];

const faqItems: FAQItem[] = [
  {
    id: 'what-is-fantasy-football',
    question: 'What is fantasy football and how does it work?',
    answer: `Fantasy football is a game where you create a virtual team by drafting real NFL players. Your team earns points based on how those players perform in actual NFL games. 

Here's how it works:
• **Draft**: You and your league mates take turns selecting players
• **Set Lineups**: Each week, choose which players to start
• **Scoring**: Your players earn points for touchdowns, yards, etc.
• **Win/Lose**: The team with more points wins that week's matchup
• **Season**: Play through the NFL season, including playoffs

The goal is to have the best-performing team and win your league championship!`,
    category: 'general',
    tags: ['basics', 'beginner', 'how-to'],
    popularity: 95
  },
  {
    id: 'draft-order',
    question: 'How is draft order determined?',
    answer: `Draft order can be set several ways:

**Random (Recommended)**
• Computer generates random order
• Most fair and unbiased method
• Can be done live or preset

**Commissioner Choice**
• League commissioner manually sets order
• Allows for strategic placement
• Should be agreed upon by all members

**Previous Season Results**
• Worst team picks first (consolation)
• Best team picks last
• Encourages competitive balance

**Fun Methods**
• Draft lottery with ping pong balls
• Physical competition (mini-golf, trivia)
• Random events (dice roll, card draw)

Most leagues use random order to ensure fairness.`,
    category: 'draft',
    tags: ['draft-order', 'fairness', 'setup'],
    popularity: 88
  },
  {
    id: 'ppr-scoring',
    question: 'What is PPR scoring?',
    answer: `PPR stands for "Points Per Reception." It's a scoring system that awards points for each catch a player makes.

**Standard PPR**: 1 point per reception
**Half PPR**: 0.5 points per reception
**Non-PPR**: 0 points per reception

**Why use PPR?**
• Makes wide receivers and pass-catching RBs more valuable
• Rewards consistent players who get targets
• Adds more strategy to player evaluation
• Generally creates higher scoring games

**Impact on Strategy:**
• Slot receivers become more valuable
• Pass-catching RBs like Christian McCaffrey get a boost
• Volume receivers preferred over big-play specialists
• Changes draft rankings significantly

Most modern leagues use some form of PPR scoring.`,
    category: 'scoring',
    tags: ['ppr', 'scoring', 'strategy'],
    popularity: 92
  },
  {
    id: 'waiver-order',
    question: 'How does waiver order work?',
    answer: `Waiver order determines who gets first priority when claiming free agents.

**Common Systems:**

**1. Rolling Waivers (Most Popular)**
• After you claim a player, you move to the back of the line
• Encourages strategic timing of claims
• Most fair over the season

**2. Reverse Standings**
• Worst team gets first priority each week
• Helps maintain competitive balance
• Based on current win-loss record

**3. FAAB (Free Agent Acquisition Budget)**
• Each team gets a budget (usually $100)
• Bid on players with your remaining budget
• Highest bid wins the player
• Most strategic but more complex

**Waiver Processing:**
• Claims typically process Tuesday/Wednesday
• Multiple claims processed in priority order
• Failed claims don't affect your waiver position (in rolling)

Plan your waiver claims carefully - timing matters!`,
    category: 'waivers',
    tags: ['waivers', 'faab', 'strategy'],
    popularity: 85
  },
  {
    id: 'oracle-accuracy',
    question: 'How accurate is Oracle AI?',
    answer: `Oracle AI is our advanced machine learning system with impressive accuracy rates:

**Overall Accuracy:**
• Player performance predictions: ~73% accuracy
• Trade recommendations: ~79% success rate
• Lineup optimization: ~82% optimal choices
• Injury impact assessment: ~87% accuracy

**What Oracle Analyzes:**
• Historical player performance (5+ years)
• Weather conditions and venue effects
• Injury reports and recovery timelines
• Team offensive schemes and game scripts
• Vegas betting lines and public sentiment
• Real-time news and social media sentiment

**Confidence Levels:**
• **High (90%+)**: Very reliable predictions
• **Medium (70-89%)**: Good predictions with some uncertainty
• **Low (<70%)**: High variance situations

**Important Notes:**
• Football has inherent randomness - no prediction is 100%
• Use Oracle as one tool among many
• Higher confidence predictions are more reliable
• System improves as it learns from your league

Oracle is most accurate for established players in standard game scripts.`,
    category: 'oracle',
    tags: ['ai', 'accuracy', 'predictions'],
    popularity: 91
  },
  {
    id: 'trade-vetoes',
    question: 'When should trades be vetoed?',
    answer: `Trade vetoes should be rare and only used in extreme circumstances:

**Valid Reasons to Veto:**
• **Obvious Collusion**: Teams working together unfairly
• **Roster Dumping**: Team giving up and trading away good players
• **Taking Advantage**: Experienced player exploiting newcomer
• **Impossible to Justify**: No reasonable person would make the trade

**Invalid Reasons:**
• You don't like the trade
• It makes another team too good
• You wanted to trade for those players
• The trade seems "unfair" but both sides have reasons

**Best Practices:**
• Require clear evidence of collusion
• Use league vote (majority needed)
• Commissioner should explain veto reasons
• Set veto policies before the season
• Consider 24-48 hour review periods

**Alternatives to Vetoing:**
• Talk to both teams about their reasoning
• Set up trade review committee
• Use commissioner approval instead of league votes
• Education for newer players

Remember: Bad trades aren't necessarily vetoable trades. Let teams manage themselves unless there's clear misconduct.`,
    category: 'trades',
    tags: ['trades', 'vetoes', 'collusion', 'fairness'],
    popularity: 78
  },
  {
    id: 'app-offline',
    question: 'Can I use the app offline?',
    answer: `Yes! Astral Draft offers robust offline functionality:

**Available Offline:**
• View your roster and lineups
• Check player stats and rankings
• Read cached news and updates
• Access draft rankings and notes
• View league standings and schedules
• Browse help articles (if previously loaded)

**Requires Connection:**
• Setting lineups (changes sync when online)
• Making trades or waiver claims
• Live draft participation
• Real-time scoring updates
• Oracle AI predictions
• Live chat and notifications

**Offline Features:**
• **Smart Caching**: App saves recent data automatically
• **Queue Actions**: Lineup changes queue until you're online
• **Offline Indicator**: Clear indication when you're offline
• **Auto-Sync**: Changes sync automatically when connection returns

**Tips for Offline Use:**
• Load key pages while connected
• Download content before traveling
• Enable push notifications for important updates
• Use airplane mode to test offline features

The app is designed to work well even with poor connections!`,
    category: 'mobile',
    tags: ['offline', 'mobile', 'features'],
    popularity: 71
  },
  {
    id: 'scoring-delays',
    question: 'Why are scores delayed or incorrect?',
    answer: `Scoring delays can happen for several reasons:

**Common Causes:**
• **NFL Stat Corrections**: Official stats sometimes change post-game
• **Data Provider Delays**: Our sources may have temporary delays
• **Complex Plays**: Unusual plays require manual review
• **Technical Issues**: Server or connection problems

**Typical Timeline:**
• **Live Scoring**: Updates every 30-60 seconds during games
• **Final Scores**: Usually correct within 30 minutes of game end
• **Stat Corrections**: Can happen up to 48 hours later
• **Playoff Implications**: May take longer during crucial games

**What We Do:**
• Monitor multiple official sources
• Cross-reference NFL.com and ESPN data
• Automatic error detection and correction
• Manual review for disputed plays
• Push notifications for major corrections

**If You Notice Issues:**
• Check if it's an official NFL stat correction
• Compare with multiple sources (NFL.com, ESPN)
• Report persistent discrepancies to support
• Remember that official stats are final

**Pro Tip**: Most "incorrect" scores are actually stat corrections from the NFL. Always verify with official sources before reporting issues.`,
    category: 'technical',
    tags: ['scoring', 'delays', 'accuracy', 'stats'],
    popularity: 82
  },
  {
    id: 'draft-autopick',
    question: 'What happens if I miss my draft pick?',
    answer: `Don't panic! Here's what happens with missed picks:

**Autopick System:**
• Automatically selects best available player
• Uses your pre-draft rankings if set
• Follows position needs and ADP
• Prioritizes starters over bench depth

**Setting Up Autopick:**
• **Pre-Draft Rankings**: Rank players before draft
• **Position Priorities**: Set preferred draft strategy
• **Avoid Lists**: Mark players you don't want
• **Backup Queue**: Queue picks in advance

**During the Draft:**
• **Timer Warning**: Get alerts at 30 and 10 seconds
• **Mobile Notifications**: Push alerts to your phone
• **Pick Trading**: Can trade picks even if you miss
• **Late Arrivals**: Join mid-draft and autopick catches up

**Best Practices:**
• Arrive 15 minutes early
• Set pre-rankings as backup
• Have stable internet connection
• Use mobile app as backup
• Communicate with commissioner if issues arise

**Recovery Strategies:**
• Review autopicked team immediately
• Identify obvious needs or mistakes
• Use waiver wire to address gaps
• Make trades after draft to improve roster

The autopick system is smart, but preparation is still key!`,
    category: 'draft',
    tags: ['autopick', 'draft', 'backup', 'preparation'],
    popularity: 76
  },
  {
    id: 'password-reset',
    question: 'How do I reset my password?',
    answer: `Resetting your password is simple:

**Reset Steps:**
1. Go to the login page
2. Click "Forgot Password?"
3. Enter your email address
4. Check your email for reset link
5. Click the link and create new password
6. Log in with your new password

**Password Requirements:**
• At least 8 characters long
• Include uppercase and lowercase letters
• Include at least one number
• Include at least one special character
• Cannot be a common password

**Troubleshooting:**
• **No Email?** Check spam/junk folder
• **Link Expired?** Request a new reset (links expire in 1 hour)
• **Still Issues?** Try different browser or clear cache
• **Account Locked?** Contact support for assistance

**Security Tips:**
• Use a unique password for fantasy sports
• Consider using a password manager
• Enable two-factor authentication if available
• Don't share your login with league mates

**Need Help?**
Contact support at support@astraldraft.com with:
• Your username or email
• Description of the issue
• Any error messages you see

We'll get you back in your league quickly!`,
    category: 'technical',
    tags: ['password', 'login', 'account', 'security'],
    popularity: 69
  }
];

export const FAQ: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredFAQs = useMemo(() => {
    return faqItems.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => b.popularity - a.popularity);
  }, [searchTerm, selectedCategory]);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const popularFAQs = faqItems
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-astral-void">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <HelpCircleIcon className="w-12 h-12 text-astral-purple-500 mr-4" />
            <h1 className="text-4xl font-bold text-gradient">Frequently Asked Questions</h1>
          </div>
          <p className="text-xl text-astral-purple-300 max-w-2xl mx-auto">
            Quick answers to the most common questions about Astral Draft
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="glass-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-astral-purple-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-astral-steel/20 border border-astral-purple-500/30 rounded-lg text-white placeholder-astral-purple-400 focus:border-astral-purple-500 focus:outline-none focus:ring-2 focus:ring-astral-purple-500/20"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-3 px-4 bg-astral-steel/20 border border-astral-purple-500/30 rounded-lg text-white focus:border-astral-purple-500 focus:outline-none focus:ring-2 focus:ring-astral-purple-500/20"
              >
                <option value="">All Categories</option>
                {faqCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Popular FAQs (when no search/filter) */}
          {!searchTerm && !selectedCategory && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">🔥 Most Popular Questions</h2>
              <div className="space-y-3">
                {popularFAQs.map(faq => (
                  <button
                    key={faq.id}
                    onClick={() => toggleExpanded(faq.id)}
                    className="w-full text-left glass-card p-4 hover:border-astral-purple-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{faq.question}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-astral-purple-500/20 text-astral-purple-300 px-2 py-1 rounded">
                          {faq.popularity}% helpful
                        </span>
                        <ChevronDownIcon 
                          className={cn(
                            'w-5 h-5 text-astral-purple-400 transition-transform',
                            expandedItems.has(faq.id) && 'rotate-180'
                          )} 
                        />
                      </div>
                    </div>
                    {expandedItems.has(faq.id) && (
                      <div className="mt-4 pt-4 border-t border-astral-purple-500/20">
                        <div className="text-astral-purple-200 whitespace-pre-line">
                          {faq.answer}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {faq.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-astral-purple-500/20 text-astral-purple-300 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {(searchTerm || selectedCategory) && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {searchTerm ? `Search Results for "${searchTerm}"` : `${faqCategories.find(c => c.id === selectedCategory)?.name} Questions`}
              </h2>
              <p className="text-astral-purple-300">
                Found {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.map(faq => (
              <div key={faq.id} className="glass-card overflow-hidden">
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full text-left p-6 hover:bg-astral-steel/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2">{faq.question}</h3>
                      <div className="flex items-center space-x-4 text-sm text-astral-purple-300">
                        <span>{faqCategories.find(c => c.id === faq.category)?.icon} {faqCategories.find(c => c.id === faq.category)?.name}</span>
                        <span>{faq.popularity}% found helpful</span>
                      </div>
                    </div>
                    <ChevronDownIcon 
                      className={cn(
                        'w-5 h-5 text-astral-purple-400 transition-transform ml-4 flex-shrink-0',
                        expandedItems.has(faq.id) && 'rotate-180'
                      )} 
                    />
                  </div>
                </button>
                
                {expandedItems.has(faq.id) && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-astral-purple-500/20 pt-4">
                      <div className="text-astral-purple-200 whitespace-pre-line leading-relaxed">
                        {faq.answer}
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-6">
                        {faq.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-astral-purple-500/20 text-astral-purple-300 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Helpful Rating */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-astral-purple-500/10">
                        <span className="text-sm text-astral-purple-300">Was this helpful?</span>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30 transition-colors">
                            👍 Yes
                          </button>
                          <button className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors">
                            👎 No
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤔</div>
              <h3 className="text-xl font-semibold text-white mb-2">No matching questions found</h3>
              <p className="text-astral-purple-300 mb-6">
                Try adjusting your search terms or browse different categories
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
                className="btn-primary"
              >
                View All FAQs
              </button>
            </div>
          )}

          {/* Contact Support */}
          <div className="mt-12 glass-card p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-4">Still Need Help?</h3>
            <p className="text-astral-purple-300 mb-6">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                📧 Contact Support
              </button>
              <button className="btn-secondary">
                💬 Live Chat
              </button>
              <button className="btn-secondary">
                📖 Browse Help Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;