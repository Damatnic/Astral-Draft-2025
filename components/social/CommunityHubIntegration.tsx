/**
 * Community Hub Integration Component
 * Central integration point for all social features
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Widget } from '../ui/Widget';
import LeagueHistoryViewer from './LeagueHistoryViewer';
import SocialFeed from './SocialFeed';
import { Player, Team, User, League } from '../../types';
import { 
    MessageSquareIcon, 
    BookOpenIcon, 
    HistoryIcon, 
    RssIcon,
    UsersIcon,
    HeartIcon,
    SparklesIcon,
    TrendingUpIcon,
    CalendarIcon
} from 'lucide-react';

export interface CommunityHubProps {
    league: League;
    currentUser: User;
    teams: Team[];
    users: User[];
    players: Player[];
    onTradeProposal: (trade: any) => void;
    onStoryPublish: (story: any) => void;
    onSocialInteraction: (type: string, data: any) => void;
    className?: string;
}

type SocialFeatureTab = 'feed' | 'trade_chat' | 'stories' | 'history' | 'community';

interface SocialActivity {
    id: string;
    type: 'trade_completed' | 'story_published' | 'milestone_achieved' | 'comment_posted' | 'reaction_added';
    userId: string;
    userName: string;
    teamName?: string;
    description: string;
    timestamp: Date;
    relatedId?: string;
}

interface CommunityStats {
    totalMembers: number;
    activeToday: number;
    storiesThisWeek: number;
    tradesThisMonth: number;
    interactionsToday: number;
    engagementScore: number;
}

const CommunityHubIntegration: React.FC<CommunityHubProps> = ({
    league,
    currentUser,
    teams,
    users,
    players,
    onTradeProposal,
    onStoryPublish,
    onSocialInteraction,
    className = ''
}) => {
    const [activeTab, setActiveTab] = React.useState<SocialFeatureTab>('feed');
    const [recentActivity, setRecentActivity] = React.useState<SocialActivity[]>([]);
    const [communityStats] = React.useState<CommunityStats>({
        totalMembers: users.length,
        activeToday: Math.floor(users.length * 0.6),
        storiesThisWeek: 12,
        tradesThisMonth: 8,
        interactionsToday: 45,
        engagementScore: 87
    });

    // Mock data for demonstration
    const mockFeedItems = React.useMemo(() => [
        {
            id: '1',
            type: 'trade_announcement' as const,
            userId: users[0]?.id || 'user1',
            userName: users[0]?.name || 'Manager 1',
            userAvatar: users[0]?.avatar,
            teamId: teams[0]?.id,
            teamName: teams[0]?.name || 'Team 1',
            content: {
                text: 'Just completed a huge trade! Really excited about the depth this adds to my roster. What do you all think about the value?',
                data: {
                    tradeId: 'trade_123',
                    playersGiven: ['Player A', 'Player B'],
                    playersReceived: ['Player C']
                }
            },
            timestamp: new Date(Date.now() - 3600000),
            reactions: [
                { id: 'r1', userId: 'user2', userName: 'User 2', emoji: '🔥', timestamp: new Date() }
            ],
            comments: [
                {
                    id: 'c1',
                    userId: 'user3',
                    userName: 'User 3',
                    content: 'Great move! That player fits your team perfectly.',
                    timestamp: new Date(Date.now() - 1800000),
                    reactions: [],
                    isEdited: false,
                    isPinned: false
                }
            ],
            shares: 2,
            views: 28,
            isPinned: false,
            isHighlighted: true,
            visibility: 'league_only' as const,
            tags: ['trade', 'depth', 'strategy'],
            mentions: []
        },
        {
            id: '2',
            type: 'team_story' as const,
            userId: users[1]?.id || 'user2',
            userName: users[1]?.name || 'Manager 2',
            userAvatar: users[1]?.avatar,
            teamId: teams[1]?.id,
            teamName: teams[1]?.name || 'Team 2',
            content: {
                text: 'Check out my season recap! It\'s been quite the journey from last place to playoff contention. Here\'s how we turned it around...',
                media: [
                    { id: 'm1', type: 'image' as const, url: '/story-image.jpg', caption: 'Key moment from Week 8' }
                ]
            },
            timestamp: new Date(Date.now() - 7200000),
            reactions: [
                { id: 'r2', userId: 'user1', userName: 'User 1', emoji: '👏', timestamp: new Date() },
                { id: 'r3', userId: 'user3', userName: 'User 3', emoji: '❤️', timestamp: new Date() }
            ],
            comments: [],
            shares: 1,
            views: 15,
            isPinned: false,
            isHighlighted: false,
            visibility: 'league_only' as const,
            tags: ['story', 'comeback', 'playoffs'],
            mentions: []
        }
    ], [users, teams]);

    const mockLeagueEvents = React.useMemo(() => [
        {
            id: 'event1',
            type: 'championship' as const,
            title: 'Season 2023 Championship',
            description: 'Epic championship battle between the top two teams. Came down to Monday Night Football!',
            date: new Date('2023-12-18'),
            season: 2023,
            week: 16,
            participants: [
                {
                    teamId: teams[0]?.id || 1,
                    teamName: teams[0]?.name || 'Team 1',
                    userId: users[0]?.id || 'user1',
                    userName: users[0]?.name || 'Manager 1',
                    role: 'primary' as const
                },
                {
                    teamId: teams[1]?.id || 2,
                    teamName: teams[1]?.name || 'Team 2',
                    userId: users[1]?.id || 'user2',
                    userName: users[1]?.name || 'Manager 2',
                    role: 'secondary' as const
                }
            ],
            data: {
                finalScore: { team1: 145.6, team2: 142.3 },
                margin: 3.3,
                clinchingPlayer: 'Travis Kelce'
            },
            stats: {
                fantasyPoints: 145.6,
                significance: 10
            },
            reactions: [
                { id: 'r1', userId: 'user3', userName: 'User 3', emoji: '🔥', timestamp: new Date() }
            ],
            comments: [
                {
                    id: 'c1',
                    userId: 'user4',
                    userName: 'User 4',
                    content: 'What an incredible finish! One of the best championship games we\'ve ever had.',
                    timestamp: new Date(),
                    likes: 5
                }
            ],
            tags: ['championship', 'thriller', '2023'],
            isHighlight: true,
            visibility: 'league_only' as const
        }
    ], [teams, users]);

    const mockMilestones = React.useMemo(() => [
        {
            id: 'milestone1',
            title: 'Perfect Week Achievement',
            description: 'Started the optimal lineup and scored the highest weekly total in league history',
            achievedDate: new Date('2023-10-15'),
            achievedBy: {
                teamId: teams[0]?.id || 1,
                teamName: teams[0]?.name || 'Team 1',
                userId: users[0]?.id || 'user1',
                userName: users[0]?.name || 'Manager 1',
                role: 'primary' as const
            },
            category: 'scoring' as const,
            rarity: 'legendary' as const,
            icon: '🏆',
            value: 187.4,
            isFirstTime: true
        },
        {
            id: 'milestone2',
            title: 'Trade Master',
            description: 'Completed 10 successful trades in a single season',
            achievedDate: new Date('2023-11-01'),
            achievedBy: {
                teamId: teams[1]?.id || 2,
                teamName: teams[1]?.name || 'Team 2',
                userId: users[1]?.id || 'user2',
                userName: users[1]?.name || 'Manager 2',
                role: 'primary' as const
            },
            category: 'trading' as const,
            rarity: 'epic' as const,
            icon: '🤝',
            value: 10,
            isFirstTime: false
        }
    ], [teams, users]);

    const handleSocialAction = (action: string, data: any) => {
        console.log('Social action:', action, data);
        onSocialInteraction(action, data);
        
        // Update activity feed
        const newActivity: SocialActivity = {
            id: `activity_${Date.now()}`,
            type: action as any,
            userId: currentUser.id,
            userName: currentUser.name,
            teamName: teams.find((t: any) => t.owner.id === currentUser.id)?.name,
            description: getActivityDescription(action, data),
            timestamp: new Date(),
            relatedId: data.id
        };
        
        setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
    };

    const getActivityDescription = (action: string, data: any): string => {
        switch (action) {
            case 'trade_proposal':
                return 'proposed a new trade';
            case 'story_publish':
                return 'published a team story';
            case 'event_reaction':
                return 'reacted to a league event';
            case 'event_comment':
                return 'commented on a league event';
            default:
                return 'performed an action';
        }
    };

    const tabs = [
        { 
            id: 'feed', 
            label: 'Social Feed', 
            icon: <RssIcon className="w-4 h-4" />,
            description: 'League activity and interactions'
        },
        { 
            id: 'trade_chat', 
            label: 'Trade Hub', 
            icon: <MessageSquareIcon className="w-4 h-4" />,
            description: 'Trade negotiations and discussions'
        },
        { 
            id: 'stories', 
            label: 'Team Stories', 
            icon: <BookOpenIcon className="w-4 h-4" />,
            description: 'Share your fantasy journey'
        },
        { 
            id: 'history', 
            label: 'League History', 
            icon: <HistoryIcon className="w-4 h-4" />,
            description: 'Memorable moments and milestones'
        },
        { 
            id: 'community', 
            label: 'Community', 
            icon: <UsersIcon className="w-4 h-4" />,
            description: 'League stats and member activity'
        }
    ];

    const renderCommunityOverview = () => (
        <div className="space-y-6">
            {/* Community Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <UsersIcon className="w-5 h-5 text-blue-400" />
                        <span className="font-medium text-[var(--text-primary)]">Total Members</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{communityStats.totalMembers}</div>
                </div>
                
                <div className="p-4 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="w-5 h-5 text-green-400" />
                        <span className="font-medium text-[var(--text-primary)]">Active Today</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">{communityStats.activeToday}</div>
                </div>
                
                <div className="p-4 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUpIcon className="w-5 h-5 text-purple-400" />
                        <span className="font-medium text-[var(--text-primary)]">Engagement</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">{communityStats.engagementScore}%</div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="p-4 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg">
                <h3 className="font-medium text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Recent Community Activity
                </h3>
                <div className="space-y-3">
                    {recentActivity.length === 0 ? (
                        <p className="text-[var(--text-secondary)] text-center py-4">
                            No recent activity. Be the first to engage!
                        </p>
                    ) : (
                        recentActivity.slice(0, 5).map((activity: any) => (
                            <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[var(--text-primary)]">
                                        <span className="font-medium">{activity.userName}</span>
                                        {activity.teamName && (
                                            <span className="text-[var(--text-secondary)]"> ({activity.teamName})</span>
                                        )}
                                        {' '}{activity.description}
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        {activity.timestamp.toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setActiveTab('trade_chat')}
                    className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/50 rounded-lg text-left"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <MessageSquareIcon className="w-6 h-6 text-blue-400" />
                        <span className="font-medium text-[var(--text-primary)]">Start Trade Chat</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Begin trade negotiations with league members
                    </p>
                </motion.button>
                
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setActiveTab('stories')}
                    className="p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/50 rounded-lg text-left"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpenIcon className="w-6 h-6 text-green-400" />
                        <span className="font-medium text-[var(--text-primary)]">Share Your Story</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Document your fantasy football journey
                    </p>
                </motion.button>
            </div>
        </div>
    );

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'feed':
                return (
                    <SocialFeed
                        feedItems={mockFeedItems}
                        currentUser={currentUser}
                        onReaction={(itemId, emoji) => handleSocialAction('feed_reaction', { itemId, emoji })}
                        onComment={(itemId, content) => handleSocialAction('feed_comment', { itemId, content })}
                        onShare={(itemId) => handleSocialAction('feed_share', { itemId })}
                        onPin={(itemId) => handleSocialAction('feed_pin', { itemId })}
                        onReport={(itemId, reason) => handleSocialAction('feed_report', { itemId, reason })}
                        onVote={(pollId, optionId) => handleSocialAction('poll_vote', { pollId, optionId })}
                        onFilter={(filter) => console.log('Filter changed:', filter)}
                    />
                );
                
            case 'trade_chat':
                // For now, return a placeholder since we need proper chat session data
                return (
                    <div className="p-8 text-center text-[var(--text-secondary)]">
                        <MessageSquareIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Trade Chat Coming Soon</h3>
                        <p>Advanced trade negotiation features will be available here.</p>
                        <p className="text-sm mt-2">Real-time chat, proposal sharing, and trade analytics.</p>
                    </div>
                );
                
            case 'stories':
                // For now, return a placeholder since we need proper story templates
                return (
                    <div className="p-8 text-center text-[var(--text-secondary)]">
                        <BookOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Team Stories Coming Soon</h3>
                        <p>Rich story creation tools will be available here.</p>
                        <p className="text-sm mt-2">Templates, multimedia support, and narrative building.</p>
                    </div>
                );
                
            case 'history':
                return (
                    <LeagueHistoryViewer
                        league={league}
                        events={mockLeagueEvents}
                        milestones={mockMilestones}
                        onEventReaction={(eventId, emoji) => handleSocialAction('event_reaction', { eventId, emoji })}
                        onEventComment={(eventId, content) => handleSocialAction('event_comment', { eventId, content })}
                        onShareEvent={(eventId) => handleSocialAction('event_share', { eventId })}
                    />
                );
                
            case 'community':
                return renderCommunityOverview();
                
            default:
                return null;
        }
    };

    return (
        <Widget title="Community Hub" className={`h-full flex flex-col ${className}`}>
            {/* Header with Tab Navigation */}
            <div className="flex-shrink-0 border-b border-[var(--panel-border)]">
                <div className="p-4 pb-0">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <HeartIcon className="w-6 h-6 text-red-400" />
                        Community Hub
                    </h1>
                </div>
                
                <div className="flex overflow-x-auto">
                    {tabs.map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as SocialFeatureTab)}
                            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                            }`}
                            title={tab.description}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                >
                    {renderActiveTab()}
                </motion.div>
            </div>
        </Widget>
    );
};

export default CommunityHubIntegration;
