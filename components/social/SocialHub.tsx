import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageCircleIcon, 
    MessageSquareIcon,
    TrophyIcon,
    FlameIcon,
    UserIcon,
    PlusIcon,
    ThumbsUpIcon,
    ThumbsDownIcon,
    ReplyIcon,
    TrendingUpIcon,
    StarIcon
} from 'lucide-react';
import { Widget } from '../ui/Widget';
import { useAuth } from '../../contexts/AuthContext';
import { 
    socialInteractionService,
    type Message,
    type ForumTopic,
    type TrashTalkPost,
    type UserSocialProfile,
    type CommunityActivity,
    type Rivalry,
    type ForumCategory
} from '../../services/socialInteractionService';

interface Props {
    leagueId: string;
    className?: string;
}

type SocialTab = 'feed' | 'messages' | 'forum' | 'comparisons' | 'trash_talk' | 'rivalries' | 'profile';

// Helper functions for styling
const getActivityTypeStyles = (activityType: string): string => {
    switch (activityType) {
        case 'message':
            return 'bg-blue-500/20 text-blue-400';
        case 'forum_post':
            return 'bg-green-500/20 text-green-400';
        case 'trash_talk':
            return 'bg-orange-500/20 text-orange-400';
        default:
            return 'bg-gray-500/20 text-gray-400';
    }
};

const getTopicCategoryStyles = (category: string): string => {
    switch (category) {
        case 'announcements':
            return 'bg-red-500/20 text-red-400';
        case 'trades':
            return 'bg-green-500/20 text-green-400';
        case 'trash_talk':
            return 'bg-orange-500/20 text-orange-400';
        default:
            return 'bg-blue-500/20 text-blue-400';
    }
};

const getSeverityStyles = (severity: string): string => {
    switch (severity) {
        case 'friendly':
            return 'bg-green-500/20 text-green-400';
        case 'competitive':
            return 'bg-yellow-500/20 text-yellow-400';
        default:
            return 'bg-red-500/20 text-red-400';
    }
};

const getRivalryLevelStyles = (level: string): string => {
    switch (level) {
        case 'legendary':
            return 'text-purple-400';
        case 'intense':
            return 'text-red-400';
        case 'moderate':
            return 'text-orange-400';
        default:
            return 'text-yellow-400';
    }
};

const getBadgeRarityStyles = (rarity: string): string => {
    switch (rarity) {
        case 'legendary':
            return 'border-purple-500 bg-purple-500/20';
        case 'epic':
            return 'border-blue-500 bg-blue-500/20';
        case 'rare':
            return 'border-green-500 bg-green-500/20';
        default:
            return 'border-gray-500 bg-gray-500/20';
    }
};

const SocialHub: React.FC<Props> = ({ 
    leagueId, 
    className = '' 
}) => {
    const { user, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<SocialTab>('feed');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data state
    const [messages, setMessages] = useState<Message[]>([]);
    const [forumTopics, setForumTopics] = useState<ForumTopic[]>([]);
    const [trashTalkPosts, setTrashTalkPosts] = useState<TrashTalkPost[]>([]);
    const [userProfile, setUserProfile] = useState<UserSocialProfile | null>(null);
    const [communityActivity, setCommunityActivity] = useState<CommunityActivity[]>([]);
    const [rivalries, setRivalries] = useState<Rivalry[]>([]);

    // UI state
    const [selectedCategory, setSelectedCategory] = useState<ForumCategory | 'all'>('all');
    const [newMessage, setNewMessage] = useState('');
    const [newTopicTitle, setNewTopicTitle] = useState('');
    const [newTopicContent, setNewTopicContent] = useState('');
    const [showNewTopicModal, setShowNewTopicModal] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !user) return;
        loadSocialData();
    }, [isAuthenticated, user, leagueId, activeTab]);

    const loadSocialData = async () => {
        if (!user) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Load data based on active tab
            switch (activeTab) {
                case 'feed': {
                    const activity = await socialInteractionService.getCommunityActivity(leagueId);
                    setCommunityActivity(activity);
                    break;
                }
                    
                case 'messages': {
                    const userMessages = await socialInteractionService.getMessages({
                        userId: user.id.toString(),
                        leagueId,
                        limit: 50
                    });
                    setMessages(userMessages);
                    break;
                }
                    
                case 'forum': {
                    const topics = await socialInteractionService.getForumTopics(
                        leagueId, 
                        selectedCategory === 'all' ? undefined : selectedCategory
                    );
                    setForumTopics(topics);
                    break;
                }
                    
                case 'trash_talk': {
                    const trashTalk = await socialInteractionService.getTrashTalkPosts(leagueId);
                    setTrashTalkPosts(trashTalk);
                    break;
                }
                    
                case 'rivalries': {
                    const leagueRivalries = await socialInteractionService.getRivalries(leagueId);
                    setRivalries(leagueRivalries);
                    break;
                }
                    
                case 'profile': {
                    const profile = await socialInteractionService.getUserSocialProfile(user.id.toString());
                    setUserProfile(profile);
                    break;
                }
            }
        } catch (err) {
            console.error('Failed to load social data:', err);
            setError('Failed to load social data');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!user || !newMessage.trim()) return;

        try {
            await socialInteractionService.sendMessage(
                user.id.toString(),
                user.username || 'User',
                newMessage,
                'league',
                { leagueId }
            );
            setNewMessage('');
            await loadSocialData(); // Refresh messages
        } catch (err) {
            console.error('Failed to send message:', err);
            setError('Failed to send message');
        }
    };

    const handleCreateTopic = async () => {
        if (!user || !newTopicTitle.trim() || !newTopicContent.trim()) return;

        try {
            await socialInteractionService.createForumTopic(
                leagueId,
                user.id.toString(),
                user.username || 'User',
                newTopicTitle,
                newTopicContent,
                'general'
            );
            setNewTopicTitle('');
            setNewTopicContent('');
            setShowNewTopicModal(false);
            await loadSocialData(); // Refresh topics
        } catch (err) {
            console.error('Failed to create topic:', err);
            setError('Failed to create forum topic');
        }
    };

    const handlePostTrashTalk = (content: string, targetId?: string, targetName?: string) => {
        if (!user || !content.trim()) return;

        socialInteractionService.postTrashTalk(
            leagueId,
            user.id.toString(),
            user.username || 'User',
            content,
            { targetId, targetName, context: 'general', severity: 'friendly' }
        ).then(() => {
            loadSocialData(); // Refresh trash talk
        }).catch(err => {
            console.error('Failed to post trash talk:', err);
            setError('Failed to post trash talk');
        });
    };

    const handleReactToMessage = async (messageId: string, emoji: string) => {
        if (!user) return;

        try {
            await socialInteractionService.addMessageReaction(
                messageId,
                user.id.toString(),
                user.username || 'User',
                emoji
            );
            await loadSocialData(); // Refresh to show updated reactions
        } catch (err) {
            console.error('Failed to add reaction:', err);
        }
    };

    if (!isAuthenticated || !user) {
        return (
            <Widget title="Social Hub" className={className}>
                <div className="text-center py-8">
                    <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Please log in to access social features</p>
                </div>
            </Widget>
        );
    }

    const tabs = [
        { id: 'feed', label: 'Activity Feed', icon: TrendingUpIcon },
        { id: 'messages', label: 'Messages', icon: MessageCircleIcon },
        { id: 'forum', label: 'Forum', icon: MessageSquareIcon },
        { id: 'comparisons', label: 'Comparisons', icon: TrophyIcon },
        { id: 'trash_talk', label: 'Trash Talk', icon: FlameIcon },
        { id: 'rivalries', label: 'Rivalries', icon: StarIcon },
        { id: 'profile', label: 'Profile', icon: UserIcon }
    ];

    const forumCategories: Array<{ id: ForumCategory | 'all', label: string }> = [
        { id: 'all', label: 'All Topics' },
        { id: 'general', label: 'General' },
        { id: 'trades', label: 'Trades' },
        { id: 'waiver_wire', label: 'Waiver Wire' },
        { id: 'matchup_discussion', label: 'Matchups' },
        { id: 'strategy', label: 'Strategy' },
        { id: 'trash_talk', label: 'Trash Talk' },
        { id: 'announcements', label: 'Announcements' }
    ];

    const renderActivityFeed = () => (
        <div className="space-y-4">
            {communityActivity.map((activity: any) => (
                <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                    <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                                {activity.userName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-white">{activity.userName}</span>
                                <span className="text-gray-400 text-sm">
                                    {activity.timestamp.toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-300 text-sm mt-1">{activity.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    activity.activityType === 'message' ? 'bg-blue-500/20 text-blue-400' :
                                    activity.activityType === 'forum_post' ? 'bg-green-500/20 text-green-400' :
                                    activity.activityType === 'trash_talk' ? 'bg-orange-500/20 text-orange-400' :
                                    'bg-gray-500/20 text-gray-400'
                                }`}>
                                    {activity.activityType.replace('_', ' ')}
                                </span>
                                <span className="text-gray-400 text-xs">+{activity.points} points</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderMessages = () => (
        <div className="space-y-4">
            {/* Message composer */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex space-x-3">
                    <textarea
                        value={newMessage}
                        onChange={(e: any) => setNewMessage(e.target.value)}
                        placeholder="Share something with your league..."
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none"
                        rows={3}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg h-fit"
                    >
                        Send
                    </button>
                </div>
            </div>

            {/* Messages list */}
            {messages.map((message: any) => (
                <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                    <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                                {message.senderName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-white">{message.senderName}</span>
                                <span className="text-gray-400 text-sm">
                                    {message.timestamp.toLocaleDateString()} at {message.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-gray-300 mt-2">{message.content}</p>
                            
                            {/* Reactions */}
                            <div className="flex items-center space-x-4 mt-3">
                                <div className="flex space-x-2">
                                    {['👍', '❤️', '😂', '😮'].map((emoji: any) => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReactToMessage(message.id, emoji)}
                                            className="hover:bg-gray-700 p-1 rounded"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                                {message.reactions.length > 0 && (
                                    <div className="flex space-x-1">
                                        {message.reactions.map((reaction: any) => (
                                            <span key={reaction.id} className="text-sm">
                                                {reaction.emoji} {reaction.userName}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderForum = () => (
        <div className="space-y-4">
            {/* Forum controls */}
            <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                    <select
                        value={selectedCategory}
                        onChange={(e: any) => setSelectedCategory(e.target.value as ForumCategory | 'all')}
                        className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                        {forumCategories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => setShowNewTopicModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>New Topic</span>
                </button>
            </div>

            {/* Forum topics */}
            {forumTopics.map((topic: any) => (
                <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                {topic.isSticky && <StarIcon className="w-4 h-4 text-yellow-400" />}
                                <h3 className="font-medium text-white">{topic.title}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    topic.category === 'announcements' ? 'bg-red-500/20 text-red-400' :
                                    topic.category === 'trades' ? 'bg-green-500/20 text-green-400' :
                                    topic.category === 'trash_talk' ? 'bg-orange-500/20 text-orange-400' :
                                    'bg-blue-500/20 text-blue-400'
                                }`}>
                                    {topic.category.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mt-1">{topic.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                                <span>By {topic.creatorName}</span>
                                <span>{topic.messageCount} replies</span>
                                <span>{topic.views} views</span>
                                <span>Last: {topic.lastActivity.toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderTrashTalk = () => (
        <div className="space-y-4">
            {/* Trash talk composer */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <button
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                    <FlameIcon className="w-4 h-4" />
                    <span>Post Trash Talk</span>
                </button>
            </div>

            {/* Trash talk posts */}
            {trashTalkPosts.map((post: any) => (
                <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                    <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                            <FlameIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-white">{post.authorName}</span>
                                {post.targetName && (
                                    <>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-orange-400">{post.targetName}</span>
                                    </>
                                )}
                                <span className="text-gray-400 text-sm">
                                    {post.timestamp.toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    post.severity === 'friendly' ? 'bg-green-500/20 text-green-400' :
                                    post.severity === 'competitive' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                }`}>
                                    {post.severity}
                                </span>
                            </div>
                            <p className="text-gray-300 mt-2">{post.content}</p>
                            
                            <div className="flex items-center space-x-4 mt-3">
                                <button className="flex items-center space-x-1 text-green-400 hover:text-green-300">
                                    <ThumbsUpIcon className="w-4 h-4" />
                                    <span>{post.likes}</span>
                                </button>
                                <button className="flex items-center space-x-1 text-red-400 hover:text-red-300">
                                    <ThumbsDownIcon className="w-4 h-4" />
                                    <span>{post.dislikes}</span>
                                </button>
                                <button className="flex items-center space-x-1 text-gray-400 hover:text-gray-300">
                                    <ReplyIcon className="w-4 h-4" />
                                    <span>Reply ({post.replies.length})</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderRivalries = () => (
        <div className="space-y-4">
            <div className="text-center py-4">
                <h3 className="text-lg font-bold text-white mb-2">League Rivalries</h3>
                <p className="text-gray-400">The hottest competitions in your league</p>
            </div>
            
            {rivalries.map((rivalry: any) => (
                <motion.div
                    key={rivalry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="text-center">
                                <div className="text-white font-bold">{rivalry.user1Name}</div>
                                <div className="text-sm text-gray-400">
                                    {rivalry.headToHeadRecord.user1Wins}W - {rivalry.headToHeadRecord.user2Wins}L
                                </div>
                            </div>
                            <div className="text-2xl">⚡</div>
                            <div className="text-center">
                                <div className="text-white font-bold">{rivalry.user2Name}</div>
                                <div className="text-sm text-gray-400">
                                    {rivalry.headToHeadRecord.user2Wins}W - {rivalry.headToHeadRecord.user1Wins}L
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-lg font-bold ${
                                rivalry.rivalryLevel === 'legendary' ? 'text-purple-400' :
                                rivalry.rivalryLevel === 'intense' ? 'text-red-400' :
                                rivalry.rivalryLevel === 'moderate' ? 'text-orange-400' :
                                'text-yellow-400'
                            }`}>
                                {rivalry.rivalryLevel.toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-400">
                                {rivalry.rivalryScore} rivalry points
                            </div>
                            <div className="text-xs text-gray-500">
                                {rivalry.trashTalkCount} trash talks
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderUserProfile = () => (
        <div className="space-y-6">
            {userProfile ? (
                <>
                    {/* Profile header */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-xl font-bold text-white">
                                    {userProfile.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-white">{userProfile.username}</h2>
                                {userProfile.bio && <p className="text-gray-400 mt-1">{userProfile.bio}</p>}
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                                    <span>Joined {userProfile.joinDate.toLocaleDateString()}</span>
                                    {userProfile.favoriteTeam && <span>Fan of {userProfile.favoriteTeam}</span>}
                                    <span>Reputation: {userProfile.reputation}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
                            <div className="text-2xl font-bold text-blue-400">{userProfile.totalMessages}</div>
                            <div className="text-sm text-gray-400">Messages</div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
                            <div className="text-2xl font-bold text-green-400">{userProfile.totalForumPosts}</div>
                            <div className="text-sm text-gray-400">Forum Posts</div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
                            <div className="text-2xl font-bold text-orange-400">{userProfile.totalTrashTalks}</div>
                            <div className="text-sm text-gray-400">Trash Talks</div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
                            <div className="text-2xl font-bold text-purple-400">{userProfile.engagementPoints}</div>
                            <div className="text-sm text-gray-400">Points</div>
                        </div>
                    </div>

                    {/* Badges */}
                    {userProfile.badges.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-lg font-bold text-white mb-3">Badges</h3>
                            <div className="flex flex-wrap gap-2">
                                {userProfile.badges.map((badge: any) => (
                                    <div
                                        key={badge.id}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${
                                            badge.rarity === 'legendary' ? 'border-purple-500 bg-purple-500/20' :
                                            badge.rarity === 'epic' ? 'border-blue-500 bg-blue-500/20' :
                                            badge.rarity === 'rare' ? 'border-green-500 bg-green-500/20' :
                                            'border-gray-500 bg-gray-500/20'
                                        }`}
                                    >
                                        <span className="text-lg">{badge.icon}</span>
                                        <span className="text-sm font-medium text-white">{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                    <span className="ml-2 text-gray-400">Loading profile...</span>
                </div>
            )}
        </div>
    );

    return (
        <div className={`space-y-6 ${className}`}>
            <Widget title="Social Hub" className="overflow-visible">
                {/* Tab navigation */}
                <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
                    {tabs.map((tab: any) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as SocialTab)}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Tab content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                                <span className="ml-2 text-gray-400">Loading...</span>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'feed' && renderActivityFeed()}
                                {activeTab === 'messages' && renderMessages()}
                                {activeTab === 'forum' && renderForum()}
                                {activeTab === 'trash_talk' && renderTrashTalk()}
                                {activeTab === 'rivalries' && renderRivalries()}
                                {activeTab === 'profile' && renderUserProfile()}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Widget>

            {/* New Topic Modal */}
            {showNewTopicModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700"
                    >
                        <h3 className="text-lg font-bold text-white mb-4">Create New Topic</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newTopicTitle}
                                onChange={(e: any) => setNewTopicTitle(e.target.value)}
                                placeholder="Topic title..."
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                            />
                            <textarea
                                value={newTopicContent}
                                onChange={(e: any) => setNewTopicContent(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none"
                                rows={4}
                            />
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowNewTopicModal(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTopic}
                                    disabled={!newTopicTitle.trim() || !newTopicContent.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
                                >
                                    Create Topic
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SocialHub;
