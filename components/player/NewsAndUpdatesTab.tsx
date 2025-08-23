/**
 * News and Updates Tab
 * Real-time news integration and player updates
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Player, League, NewsItem } from '../../types';
import { NewsIcon } from '../icons/NewsIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { UserIcon } from '../icons/UserIcon';

interface NewsAndUpdatesTabProps {
    player: Player;
    league: League;
    dispatch: React.Dispatch<any>;
}

interface InjuryUpdate {
    id: string;
    date: string;
    type: 'injury' | 'return' | 'update';
    severity: 'minor' | 'moderate' | 'major';
    description: string;
    expectedReturn?: string;
    source: string;
}

interface SocialMediaPost {
    id: string;
    platform: 'twitter' | 'instagram';
    date: string;
    content: string;
    engagement: number;
    verified: boolean;
}

interface FantasyAlert {
    id: string;
    type: 'target_share' | 'snap_count' | 'usage' | 'opportunity';
    severity: 'positive' | 'negative' | 'neutral';
    message: string;
    date: string;
    impact: 'high' | 'medium' | 'low';
}

const NewsAndUpdatesTab: React.FC<NewsAndUpdatesTabProps> = ({ player, league }) => {
    const [selectedFilter, setSelectedFilter] = React.useState<'all' | 'news' | 'injuries' | 'social' | 'fantasy'>('all');

    // Mock data - in real app this would come from news/social media APIs
    const newsItems: NewsItem[] = player.newsFeed || [
        {
            date: '2024-09-15T14:30:00Z',
            headline: `${player.name} shows strong chemistry with quarterback in practice`,
            source: 'ESPN'
        },
        {
            date: '2024-09-12T09:15:00Z',
            headline: `Coach praises ${player.name}'s work ethic and preparation`,
            source: 'NFL Network'
        },
        {
            date: '2024-09-10T16:45:00Z',
            headline: `${player.name} expected to see increased role in upcoming weeks`,
            source: 'The Athletic'
        }
    ];

    const injuryUpdates: InjuryUpdate[] = player?.injuryHistory?.map((injury, index) => ({
        id: `injury-${index}`,
        date: injury.date,
        type: injury?.status === 'Active' ? 'return' : 'injury',
        severity: injury?.status === 'Out' ? 'major' : 'minor',
        description: `${injury?.injury} - ${injury?.status}`,
        source: 'Team Report'
    })) || [];

    const socialPosts: SocialMediaPost[] = [
        {
            id: 'social-1',
            platform: 'twitter',
            date: '2024-09-16T12:00:00Z',
            content: `Locked in and ready for Week 3! 💪 #GameDay`,
            engagement: 15420,
            verified: true
        },
        {
            id: 'social-2',
            platform: 'instagram',
            date: '2024-09-14T18:30:00Z',
            content: 'Training camp grind never stops. Putting in the work! 🏈',
            engagement: 23150,
            verified: true
        }
    ];

    const fantasyAlerts: FantasyAlert[] = [
        {
            id: 'alert-1',
            type: 'target_share',
            severity: 'positive',
            message: `${player.name} saw 25% target share in last game, up from 18% season average`,
            date: '2024-09-15T20:00:00Z',
            impact: 'high'
        },
        {
            id: 'alert-2',
            type: 'snap_count',
            severity: 'positive',
            message: 'Played 85% of offensive snaps, highest of the season',
            date: '2024-09-15T19:45:00Z',
            impact: 'medium'
        }
    ];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays}d ago`;
        }
    };

    const getAlertIcon = (type: FantasyAlert['type']) => {
        switch (type) {
            case 'target_share':
                return <TrendingUpIcon className="w-4 h-4" />;
            case 'snap_count':
                return <ClockIcon className="w-4 h-4" />;
            case 'usage':
                return <BarChartIcon className="w-4 h-4" />;
            default:
                return <NewsIcon className="w-4 h-4" />;
        }
    };

    const getAlertColor = (severity: FantasyAlert['severity']) => {
        switch (severity) {
            case 'positive':
                return 'border-l-green-500 bg-green-500/5 text-green-400';
            case 'negative':
                return 'border-l-red-500 bg-red-500/5 text-red-400';
            default:
                return 'border-l-blue-500 bg-blue-500/5 text-blue-400';
        }
    };

    const getInjuryColor = (severity: InjuryUpdate['severity']) => {
        switch (severity) {
            case 'major':
                return 'border-l-red-500 bg-red-500/5';
            case 'moderate':
                return 'border-l-yellow-500 bg-yellow-500/5';
            default:
                return 'border-l-green-500 bg-green-500/5';
        }
    };

    const getSocialIcon = (platform: SocialMediaPost['platform']) => {
        switch (platform) {
            case 'twitter':
                return '🐦';
            case 'instagram':
                return '📷';
            default:
                return '📱';
        }
    };

    const filteredContent = React.useMemo(() => {
        const allContent: Array<{
            type: 'news' | 'injury' | 'social' | 'fantasy';
            date: string;
            content: any;
        }> = [];

        if (selectedFilter === 'all' || selectedFilter === 'news') {
            newsItems.forEach((item: any) => allContent.push({ type: 'news', date: item.date, content: item }));
        }
        
        if (selectedFilter === 'all' || selectedFilter === 'injuries') {
            injuryUpdates.forEach((item: any) => allContent.push({ type: 'injury', date: item.date, content: item }));
        }
        
        if (selectedFilter === 'all' || selectedFilter === 'social') {
            socialPosts.forEach((item: any) => allContent.push({ type: 'social', date: item.date, content: item }));
        }
        
        if (selectedFilter === 'all' || selectedFilter === 'fantasy') {
            fantasyAlerts.forEach((item: any) => allContent.push({ type: 'fantasy', date: item.date, content: item }));
        }

        return allContent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedFilter, newsItems, injuryUpdates, socialPosts, fantasyAlerts]);

    const filterCounts = {
        all: newsItems.length + injuryUpdates.length + socialPosts.length + fantasyAlerts.length,
        news: newsItems.length,
        injuries: injuryUpdates.length,
        social: socialPosts.length,
        fantasy: fantasyAlerts.length
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Filter Tabs */}
            <Widget title="News & Updates">
                <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {[
                            { id: 'all', label: 'All Updates', icon: <NewsIcon className="w-4 h-4" /> },
                            { id: 'news', label: 'News', icon: <NewsIcon className="w-4 h-4" /> },
                            { id: 'injuries', label: 'Health', icon: <AlertTriangleIcon className="w-4 h-4" /> },
                            { id: 'social', label: 'Social Media', icon: <UserIcon className="w-4 h-4" /> },
                            { id: 'fantasy', label: 'Fantasy Alerts', icon: <TrendingUpIcon className="w-4 h-4" /> }
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setSelectedFilter(filter.id as any)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedFilter === filter.id
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                {filter.icon}
                                {filter.label}
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    selectedFilter === filter.id ? 'bg-blue-500/30' : 'bg-white/10'
                                }`}>
                                    {filterCounts[filter.id as keyof typeof filterCounts]}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Content Feed */}
                    <div className="space-y-4">
                        {filteredContent.length === 0 ? (
                            <div className="text-center py-8">
                                <NewsIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-[var(--text-secondary)]">No updates found for this filter</p>
                            </div>
                        ) : (
                            filteredContent.map((item, index) => (
                                <motion.div
                                    key={`${item.type}-${index}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`p-4 border-l-4 rounded-lg ${
                                        item.type === 'news' ? 'border-l-blue-500 bg-blue-500/5' :
                                        item.type === 'injury' ? getInjuryColor(item.content.severity) :
                                        item.type === 'social' ? 'border-l-purple-500 bg-purple-500/5' :
                                        getAlertColor(item.content.severity)
                                    }`}
                                >
                                    {item.type === 'news' && (
                                        <div>
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-medium text-[var(--text-primary)] flex-1">
                                                    {item.content.headline}
                                                </h4>
                                                <span className="text-xs text-[var(--text-secondary)] ml-3">
                                                    {formatDate(item.content.date)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                                <NewsIcon className="w-3 h-3" />
                                                <span>{item.content.source}</span>
                                            </div>
                                        </div>
                                    )}

                                    {item.type === 'injury' && (
                                        <div>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangleIcon className={`w-4 h-4 ${
                                                        item.content.severity === 'major' ? 'text-red-400' :
                                                        item.content.severity === 'moderate' ? 'text-yellow-400' :
                                                        'text-green-400'
                                                    }`} />
                                                    <h4 className="font-medium text-[var(--text-primary)]">
                                                        {item.content.description}
                                                    </h4>
                                                </div>
                                                <span className="text-xs text-[var(--text-secondary)]">
                                                    {formatDate(item.content.date)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-[var(--text-secondary)]">
                                                Source: {item.content.source}
                                                {item.content.expectedReturn && (
                                                    <span className="ml-2">• Expected Return: {item.content.expectedReturn}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {item.type === 'social' && (
                                        <div>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{getSocialIcon(item.content.platform)}</span>
                                                    <h4 className="font-medium text-[var(--text-primary)]">
                                                        {player.name}
                                                        {item.content.verified && (
                                                            <span className="ml-1 text-blue-400">✓</span>
                                                        )}
                                                    </h4>
                                                </div>
                                                <span className="text-xs text-[var(--text-secondary)]">
                                                    {formatDate(item.content.date)}
                                                </span>
                                            </div>
                                            <p className="text-[var(--text-secondary)] mb-2">{item.content.content}</p>
                                            <div className="text-xs text-[var(--text-secondary)]">
                                                {item.content.engagement.toLocaleString()} interactions
                                            </div>
                                        </div>
                                    )}

                                    {item.type === 'fantasy' && (
                                        <div>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={getAlertColor(item.content.severity)}>
                                                        {getAlertIcon(item.content.type)}
                                                    </div>
                                                    <h4 className="font-medium text-[var(--text-primary)] flex-1">
                                                        Fantasy Alert
                                                    </h4>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        item.content.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                                                        item.content.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-green-500/20 text-green-400'
                                                    }`}>
                                                        {item.content.impact.toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-[var(--text-secondary)] ml-3">
                                                    {formatDate(item.content.date)}
                                                </span>
                                            </div>
                                            <p className="text-[var(--text-secondary)]">{item.content.message}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </Widget>
        </motion.div>
    );
};

// Add missing import
import { BarChartIcon } from '../icons/BarChartIcon';

export default NewsAndUpdatesTab;
