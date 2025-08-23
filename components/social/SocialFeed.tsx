/**
 * Social Feed Component
 * Enhanced activity stream with reactions, comments, and community interactions
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Player, Team, User, League } from '../../types';
import { 
    HeartIcon, 
    MessageCircleIcon, 
    ShareIcon, 
    ThumbsUpIcon,
    ThumbsDownIcon,
    FlameIcon,
    TrophyIcon,
    ArrowRightIcon,
    UsersIcon,
    CalendarIcon,
    MoreHorizontalIcon,
    PinIcon,
    FlagIcon,
    BookmarkIcon,
    ImageIcon,
    PlayIcon,
    ChevronDownIcon,
    FilterIcon,
    TrendingUpIcon,
    ClockIcon,
    EyeIcon
} from 'lucide-react';

export interface SocialFeedItem {
    id: string;
    type: FeedItemType;
    userId: string;
    userName: string;
    userAvatar?: string;
    teamId?: number;
    teamName?: string;
    content: FeedContent;
    timestamp: Date;
    reactions: FeedReaction[];
    comments: FeedComment[];
    shares: number;
    views: number;
    isPinned: boolean;
    isHighlighted: boolean;
    visibility: 'public' | 'league_only' | 'friends_only';
    tags: string[];
    mentions: FeedMention[];
}

export type FeedItemType = 
    | 'trade_announcement'
    | 'waiver_pickup'
    | 'lineup_brag'
    | 'team_story'
    | 'prediction'
    | 'trash_talk'
    | 'achievement'
    | 'milestone'
    | 'trade_request'
    | 'poll'
    | 'celebration'
    | 'complaint'
    | 'analysis'
    | 'meme'
    | 'news_share'
    | 'league_update';

export interface FeedContent {
    text?: string;
    media?: FeedMedia[];
    data?: any; // Flexible data for different content types
    poll?: FeedPoll;
    tradeProposal?: any;
    achievement?: any;
}

export interface FeedMedia {
    id: string;
    type: 'image' | 'video' | 'gif' | 'link';
    url: string;
    thumbnail?: string;
    caption?: string;
    metadata?: any;
}

export interface FeedPoll {
    id: string;
    question: string;
    options: FeedPollOption[];
    endsAt: Date;
    allowMultiple: boolean;
    isAnonymous: boolean;
}

export interface FeedPollOption {
    id: string;
    text: string;
    votes: number;
    voters: string[]; // User IDs
}

export interface FeedReaction {
    id: string;
    userId: string;
    userName: string;
    emoji: string;
    timestamp: Date;
}

export interface FeedComment {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    timestamp: Date;
    reactions: FeedReaction[];
    replies?: FeedComment[];
    isEdited: boolean;
    isPinned: boolean;
}

export interface FeedMention {
    userId: string;
    userName: string;
    type: 'user' | 'team';
    position: number;
    length: number;
}

export interface SocialFeedFilter {
    types: FeedItemType[];
    users: string[];
    timeRange: 'today' | 'week' | 'month' | 'all';
    sortBy: 'latest' | 'popular' | 'trending';
    showPinnedOnly: boolean;
}

interface SocialFeedProps {
    feedItems: SocialFeedItem[];
    currentUser: User;
    onReaction: (itemId: string, emoji: string) => void;
    onComment: (itemId: string, content: string, parentId?: string) => void;
    onShare: (itemId: string) => void;
    onPin: (itemId: string) => void;
    onReport: (itemId: string, reason: string) => void;
    onVote: (pollId: string, optionId: string) => void;
    onFilter: (filter: SocialFeedFilter) => void;
    className?: string;
}

const SocialFeed: React.FC<SocialFeedProps> = ({
    feedItems,
    currentUser,
    onReaction,
    onComment,
    onShare,
    onPin,
    onReport,
    onVote,
    onFilter,
    className = ''
}) => {
    const [filter, setFilter] = React.useState<SocialFeedFilter>({
        types: [],
        users: [],
        timeRange: 'all',
        sortBy: 'latest',
        showPinnedOnly: false
    });
    const [showFilters, setShowFilters] = React.useState(false);
    const [expandedComments, setExpandedComments] = React.useState<Set<string>>(new Set());
    const [newComment, setNewComment] = React.useState<Record<string, string>>({});
    const [replyingTo, setReplyingTo] = React.useState<string | null>(null);

    // Filter and sort feed items
    const processedFeedItems = React.useMemo(() => {
        let filtered = feedItems;

        // Type filter
        if (filter.types.length > 0) {
            filtered = filtered.filter((item: any) => filter.types.includes(item.type));
        }

        // User filter
        if (filter.users.length > 0) {
            filtered = filtered.filter((item: any) => filter.users.includes(item.userId));
        }

        // Time range filter
        const now = new Date();
        const timeFilters = {
            today: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            all: new Date(0)
        };

        if (filter.timeRange !== 'all') {
            filtered = filtered.filter((item: any) => item.timestamp >= timeFilters[filter.timeRange]);
        }

        // Pinned filter
        if (filter.showPinnedOnly) {
            filtered = filtered.filter((item: any) => item.isPinned);
        }

        // Sort
        switch (filter.sortBy) {
            case 'popular':
                filtered.sort((a, b) => {
                    const aScore = a.reactions.length + a.comments.length + a.shares;
                    const bScore = b.reactions.length + b.comments.length + b.shares;
                    return bScore - aScore;
                });
                break;
            case 'trending':
                filtered.sort((a, b) => {
                    const aRecent = a.reactions.filter((r: any) => r.timestamp.getTime() > now.getTime() - 3600000).length;
                    const bRecent = b.reactions.filter((r: any) => r.timestamp.getTime() > now.getTime() - 3600000).length;
                    return bRecent - aRecent;
                });
                break;
            default: // latest
                filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        }

        // Always show pinned items first (unless pinned-only filter is active)
        if (!filter.showPinnedOnly) {
            const pinned = filtered.filter((item: any) => item.isPinned);
            const unpinned = filtered.filter((item: any) => !item.isPinned);
            filtered = [...pinned, ...unpinned];
        }

        return filtered;
    }, [feedItems, filter]);

    const getItemTypeIcon = (type: FeedItemType) => {
        switch (type) {
            case 'trade_announcement':
            case 'trade_request':
                return <ArrowRightIcon className="w-4 h-4 text-blue-400" />;
            case 'achievement':
            case 'milestone':
                return <TrophyIcon className="w-4 h-4 text-yellow-400" />;
            case 'trash_talk':
                return <FlameIcon className="w-4 h-4 text-red-400" />;
            case 'prediction':
            case 'analysis':
                return <TrendingUpIcon className="w-4 h-4 text-purple-400" />;
            case 'celebration':
                return <TrophyIcon className="w-4 h-4 text-green-400" />;
            case 'poll':
                return <UsersIcon className="w-4 h-4 text-orange-400" />;
            default:
                return <MessageCircleIcon className="w-4 h-4 text-gray-400" />;
        }
    };

    const getItemTypeColor = (type: FeedItemType) => {
        switch (type) {
            case 'trade_announcement':
            case 'trade_request':
                return 'text-blue-400 bg-blue-500/20';
            case 'achievement':
            case 'milestone':
                return 'text-yellow-400 bg-yellow-500/20';
            case 'trash_talk':
                return 'text-red-400 bg-red-500/20';
            case 'prediction':
            case 'analysis':
                return 'text-purple-400 bg-purple-500/20';
            case 'celebration':
                return 'text-green-400 bg-green-500/20';
            case 'poll':
                return 'text-orange-400 bg-orange-500/20';
            default:
                return 'text-gray-400 bg-gray-500/20';
        }
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const toggleComments = (itemId: string) => {
        const newExpanded = new Set(expandedComments);
        if (expandedComments.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedComments(newExpanded);
    };

    const handleComment = (itemId: string, parentId?: string) => {
        const content = newComment[itemId];
        if (!content?.trim()) return;

        onComment(itemId, content, parentId);
        setNewComment(prev => ({ ...prev, [itemId]: '' }));
        setReplyingTo(null);
    };

    const renderPoll = (poll: FeedPoll, itemId: string) => {
        const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
        const hasVoted = poll.options.some((option: any) => option.voters.includes(currentUser.id));
        const isPollEnded = poll.endsAt < new Date();

        return (
            <div className="mt-3 p-4 bg-gray-500/10 rounded-lg">
                <h4 className="font-medium text-[var(--text-primary)] mb-3">{poll.question}</h4>
                <div className="space-y-2">
                    {poll.options.map((option: any) => {
                        const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                        const userVoted = option.voters.includes(currentUser.id);

                        return (
                            <button
                                key={option.id}
                                onClick={() => !hasVoted && !isPollEnded && onVote(poll.id, option.id)}
                                disabled={hasVoted || isPollEnded}
                                className={`w-full p-3 rounded border text-left transition-colors ${
                                    userVoted 
                                        ? 'border-blue-400 bg-blue-500/20' 
                                        : hasVoted || isPollEnded
                                            ? 'border-[var(--panel-border)] bg-gray-500/10 cursor-not-allowed'
                                            : 'border-[var(--panel-border)] hover:border-blue-400/50 hover:bg-blue-500/10'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--text-primary)]">{option.text}</span>
                                    <span className="text-sm text-[var(--text-secondary)]">
                                        {option.votes} ({percentage.toFixed(0)}%)
                                    </span>
                                </div>
                                {(hasVoted || isPollEnded) && (
                                    <div className="mt-2 h-2 bg-gray-500/20 rounded overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            className={`h-full ${userVoted ? 'bg-blue-400' : 'bg-gray-400'}`}
                                        />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center justify-between mt-3 text-sm text-[var(--text-secondary)]">
                    <span>{totalVotes} votes</span>
                    <span>Ends {formatTimestamp(poll.endsAt)}</span>
                </div>
            </div>
        );
    };

    const renderFeedItem = (item: SocialFeedItem) => {
        const isCommentsExpanded = expandedComments.has(item.id);

        return (
            <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-4 ${
                    item.isPinned ? 'border-yellow-400/50' : ''
                } ${item.isHighlighted ? 'ring-2 ring-blue-400/30' : ''}`}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                        <img
                            src={item.userAvatar || '/default-avatar.png'}
                            alt={item.userName}
                            className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-[var(--text-primary)]">
                                    {item.userName}
                                </span>
                                {item.teamName && (
                                    <span className="text-sm text-[var(--text-secondary)]">
                                        • {item.teamName}
                                    </span>
                                )}
                                <span className={`px-2 py-1 rounded text-xs ${getItemTypeColor(item.type)}`}>
                                    {getItemTypeIcon(item.type)}
                                </span>
                                {item.isPinned && <PinIcon className="w-4 h-4 text-yellow-400" />}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <span>{formatTimestamp(item.timestamp)}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <EyeIcon className="w-3 h-3" />
                                    {item.views}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1">
                        <MoreHorizontalIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-4">
                    {item.content.text && (
                        <p className="text-[var(--text-primary)] mb-3 whitespace-pre-wrap">
                            {item.content.text}
                        </p>
                    )}

                    {/* Media */}
                    {item.content.media && item.content.media.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {item.content.media.slice(0, 4).map((media: any) => (
                                <div key={media.id} className="relative">
                                    {media.type === 'image' && (
                                        <img
                                            src={media.url}
                                            alt={media.caption}
                                            className="w-full h-32 object-cover rounded"
                                        />
                                    )}
                                    {media.type === 'video' && (
                                        <div className="w-full h-32 bg-gray-500/20 rounded flex items-center justify-center">
                                            <PlayIcon className="w-8 h-8 text-[var(--text-secondary)]" />
                                        </div>
                                    )}
                                    {media.caption && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b">
                                            {media.caption}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Poll */}
                    {item.content.poll && renderPoll(item.content.poll, item.id)}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--panel-border)]">
                    <div className="flex items-center gap-4">
                        {/* Reactions */}
                        <div className="flex items-center gap-2">
                            {['👍', '❤️', '😂', '🔥', '🤔'].map((emoji: any) => {
                                const count = item.reactions.filter((r: any) => r.emoji === emoji).length;
                                const userReacted = item.reactions.some((r: any) => r.emoji === emoji && r.userId === currentUser.id);
                                
                                return (
                                    <button
                                        key={emoji}
                                        onClick={() => onReaction(item.id, emoji)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                                            userReacted 
                                                ? 'bg-blue-500/20 text-blue-400' 
                                                : 'hover:bg-white/10 text-[var(--text-secondary)]'
                                        }`}
                                    >
                                        <span>{emoji}</span>
                                        {count > 0 && <span className="text-xs">{count}</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Comment */}
                        <button
                            onClick={() => toggleComments(item.id)}
                            className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            <MessageCircleIcon className="w-4 h-4" />
                            {item.comments.length}
                        </button>

                        {/* Share */}
                        <button
                            onClick={() => onShare(item.id)}
                            className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            <ShareIcon className="w-4 h-4" />
                            {item.shares}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPin(item.id)}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1"
                        >
                            <BookmarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                    {isCommentsExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-[var(--panel-border)]"
                        >
                            {/* Comment Input */}
                            <div className="flex gap-3 mb-4">
                                <img
                                    src={currentUser.avatar || '/default-avatar.png'}
                                    alt={currentUser.name || 'User'}
                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                />
                                <div className="flex-1">
                                    <textarea
                                        value={newComment[item.id] || ''}
                                        onChange={(e: any) => setNewComment(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        placeholder="Write a comment..."
                                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none"
                                        rows={2}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={() => handleComment(item.id)}
                                            disabled={!newComment[item.id]?.trim()}
                                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Comment
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Comments List */}
                            <div className="space-y-3">
                                {item.comments.map((comment: any) => (
                                    <div key={comment.id} className="flex gap-3">
                                        <img
                                            src={comment.userAvatar || '/default-avatar.png'}
                                            alt={comment.userName}
                                            className="w-8 h-8 rounded-full flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-gray-500/10 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-[var(--text-primary)] text-sm">
                                                        {comment.userName}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-secondary)]">
                                                        {formatTimestamp(comment.timestamp)}
                                                    </span>
                                                    {comment.isEdited && (
                                                        <span className="text-xs text-[var(--text-secondary)]">
                                                            (edited)
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-[var(--text-primary)]">
                                                    {comment.content}
                                                </p>
                                            </div>
                                            
                                            {/* Comment reactions */}
                                            <div className="flex items-center gap-2 mt-1">
                                                <button className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                                    Like
                                                </button>
                                                <button className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                                    Reply
                                                </button>
                                                {comment.reactions.length > 0 && (
                                                    <span className="text-xs text-[var(--text-secondary)]">
                                                        {comment.reactions.length} reactions
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div className={`h-full flex flex-col bg-[var(--panel-bg)] ${className}`}>
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-[var(--panel-border)]">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Social Feed</h2>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-500/20 text-[var(--text-secondary)] rounded-lg hover:bg-gray-500/30 transition-colors text-sm"
                    >
                        <FilterIcon className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                {/* Filter Controls */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 bg-gray-500/10 rounded-lg"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                        Sort By
                                    </label>
                                    <select
                                        value={filter.sortBy}
                                        onChange={(e: any) => setFilter(prev => ({ ...prev, sortBy: e.target.value as any }))}
                                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-[var(--text-primary)]"
                                    >
                                        <option value="latest">Latest</option>
                                        <option value="popular">Popular</option>
                                        <option value="trending">Trending</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                        Time Range
                                    </label>
                                    <select
                                        value={filter.timeRange}
                                        onChange={(e: any) => setFilter(prev => ({ ...prev, timeRange: e.target.value as any }))}
                                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-[var(--text-primary)]"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                        Options
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={filter.showPinnedOnly}
                                            onChange={(e: any) => setFilter(prev => ({ ...prev, showPinnedOnly: e.target.checked }))}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-[var(--text-primary)]">Pinned only</span>
                                    </label>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    {processedFeedItems.length === 0 ? (
                        <div className="text-center py-12 text-[var(--text-secondary)]">
                            <MessageCircleIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">No posts found</p>
                            <p>Try adjusting your filters or be the first to post!</p>
                        </div>
                    ) : (
                        processedFeedItems.map((item: any) => renderFeedItem(item))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SocialFeed;
