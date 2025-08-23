/**
 * Enhanced Player Profile View
 * Comprehensive player information with advanced stats, news, and comparison tools
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Avatar } from '../ui/Avatar';
import { Player, League, NewsItem } from '../../types';
import { SparklesIcon } from '../icons/SparklesIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { TrendingDownIcon } from '../icons/TrendingDownIcon';
import { BarChartIcon } from '../icons/BarChartIcon';
import { NewsIcon } from '../icons/NewsIcon';
import { CompareIcon } from '../icons/CompareIcon';
import { ShareIcon } from '../icons/ShareIcon';
import { HeartIcon } from '../icons/HeartIcon';
import AdvancedStatsTab from './AdvancedStatsTab';
import NewsAndUpdatesTab from './NewsAndUpdatesTab';
import PlayerComparisonTab from './PlayerComparisonTab';
import SeasonTrendsTab from './SeasonTrendsTab';

interface PlayerProfileViewProps {
    player: Player;
    league: League;
    dispatch: React.Dispatch<any>;
    onClose?: () => void;
}

const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({ player, league, dispatch, onClose }) => {
    const [selectedTab, setSelectedTab] = React.useState<string>('overview');
    const [isFavorited, setIsFavorited] = React.useState(false);
    const [showShareMenu, setShowShareMenu] = React.useState(false);

    const tabs: { id: string; label: string; icon: React.ReactNode }[] = [
        {
            id: 'overview',
            label: 'Overview',
            icon: <SparklesIcon className="w-4 h-4" />
        },
        {
            id: 'advanced-stats',
            label: 'Advanced Stats',
            icon: <BarChartIcon className="w-4 h-4" />
        },
        {
            id: 'news',
            label: 'News & Updates',
            icon: <NewsIcon className="w-4 h-4" />
        },
        {
            id: 'trends',
            label: 'Season Trends',
            icon: <TrendingUpIcon className="w-4 h-4" />
        },
        {
            id: 'comparison',
            label: 'Compare Players',
            icon: <CompareIcon className="w-4 h-4" />
        }
    ];

    const positionColors = {
        QB: 'from-red-500/30 to-red-600/20',
        RB: 'from-green-500/30 to-green-600/20',
        WR: 'from-blue-500/30 to-blue-600/20',
        TE: 'from-orange-500/30 to-orange-600/20',
        K: 'from-yellow-500/30 to-yellow-600/20',
        DST: 'from-purple-500/30 to-purple-600/20'
    };

    const getCurrentTrend = () => {
        // Mock trend calculation - in real app this would analyze recent performance
        const recent = player.stats.projection - player.stats.lastYear;
        if (recent > 2) return 'up';
        if (recent < -2) return 'down';
        return 'stable';
    };

    const getTrendIcon = () => {
        const trend = getCurrentTrend();
        switch (trend) {
            case 'up':
                return <TrendingUpIcon className="w-5 h-5 text-green-400" />;
            case 'down':
                return <TrendingDownIcon className="w-5 h-5 text-red-400" />;
            default:
                return <BarChartIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    const handleShare = (platform: string) => {
        const url = `${window.location.origin}/player/${player.id}`;
        const text = `Check out ${player.name} (${player.position}) - ${player.team} on Astral Draft!`;
        
        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
                break;
            case 'copy':
                navigator.clipboard.writeText(url);
                // Add toast notification here
                break;
        }
        setShowShareMenu(false);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header Section */}
            <div className={`relative bg-gradient-to-br ${positionColors[player.position]} border-b border-[var(--panel-border)]`}>
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Avatar
                                avatar={player.astralIntelligence?.spiritAnimal?.[0] || '🏈'}
                                className="w-20 h-20 text-3xl rounded-xl border-2 border-white/20"
                            />
                            <div>
                                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                                    {player.name}
                                </h1>
                                <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium">
                                        {player.position}
                                    </span>
                                    <span className="text-lg font-semibold">{player.team}</span>
                                    <span>#{player.rank} Overall</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsFavorited(!isFavorited)}
                                className={`p-2 rounded-lg transition-colors ${
                                    isFavorited ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400 hover:text-white'
                                }`}
                            >
                                <HeartIcon className="w-5 h-5" />
                            </button>
                            
                            <div className="relative">
                                <button
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <ShareIcon className="w-5 h-5 text-gray-400" />
                                </button>
                                
                                <AnimatePresence>
                                    {showShareMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            className="absolute right-0 top-full mt-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg shadow-xl z-50 min-w-[150px]"
                                        >
                                            <button
                                                onClick={() => handleShare('twitter')}
                                                className="w-full px-4 py-2 text-left hover:bg-white/5 text-[var(--text-primary)] text-sm"
                                            >
                                                Share on Twitter
                                            </button>
                                            <button
                                                onClick={() => handleShare('copy')}
                                                className="w-full px-4 py-2 text-left hover:bg-white/5 text-[var(--text-primary)] text-sm border-t border-[var(--panel-border)]"
                                            >
                                                Copy Link
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                        <div className="text-center p-3 bg-white/10 rounded-lg">
                            <div className="text-xl font-bold text-[var(--text-primary)]">{player.stats.projection}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Projected Pts</div>
                        </div>
                        <div className="text-center p-3 bg-white/10 rounded-lg">
                            <div className="text-xl font-bold text-[var(--text-primary)]">{player?.adp}</div>
                            <div className="text-xs text-[var(--text-secondary)]">ADP</div>
                        </div>
                        <div className="text-center p-3 bg-white/10 rounded-lg">
                            <div className="text-xl font-bold text-[var(--text-primary)]">${player.auctionValue}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Auction Value</div>
                        </div>
                        <div className="text-center p-3 bg-white/10 rounded-lg">
                            <div className="text-xl font-bold text-[var(--text-primary)]">Week {player.bye}</div>
                            <div className="text-xs text-[var(--text-secondary)]">Bye Week</div>
                        </div>
                        <div className="text-center p-3 bg-white/10 rounded-lg">
                            <div className="flex items-center justify-center gap-2">
                                {getTrendIcon()}
                                <div className="text-xl font-bold text-[var(--text-primary)]">
                                    {player.stats.vorp > 0 ? '+' : ''}{player.stats.vorp.toFixed(1)}
                                </div>
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">VORP</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-[var(--panel-border)] bg-[var(--panel-bg)]">
                <div className="flex overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
                                selectedTab === tab.id
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {selectedTab === 'overview' && <OverviewSection player={player} league={league} />}
                        {selectedTab === 'advanced-stats' && <AdvancedStatsTab player={player} league={league} dispatch={dispatch} />}
                        {selectedTab === 'news' && <NewsAndUpdatesTab player={player} league={league} dispatch={dispatch} />}
                        {selectedTab === 'trends' && <SeasonTrendsTab player={player} league={league} dispatch={dispatch} />}
                        {selectedTab === 'comparison' && <PlayerComparisonTab player={player} league={league} dispatch={dispatch} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// Overview Section Component
const OverviewSection: React.FC<{ player: Player; league: League }> = ({ player, league }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player Bio & Info */}
            <div className="lg:col-span-2 space-y-6">
                <Widget title="Player Information">
                    <div className="p-4 space-y-4">
                        <div>
                            <h4 className="font-medium text-[var(--text-primary)] mb-2">Biography</h4>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                {player.bio || "No biography available for this player."}
                            </p>
                        </div>

                        {player.scoutingReport && (
                            <div>
                                <h4 className="font-medium text-[var(--text-primary)] mb-2">Scouting Report</h4>
                                <p className="text-[var(--text-secondary)] mb-3">{player.scoutingReport.summary}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h5 className="font-medium text-green-400 mb-2">Strengths</h5>
                                        <ul className="space-y-1">
                                            {player.scoutingReport.strengths.map((strength) => (
                                                <li key={strength} className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                                    {strength}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h5 className="font-medium text-red-400 mb-2">Weaknesses</h5>
                                        <ul className="space-y-1">
                                            {player.scoutingReport.weaknesses.map((weakness) => (
                                                <li key={weakness} className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                                    {weakness}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Widget>

                {/* Contract Information */}
                {player.contract && (
                    <Widget title="Contract Details">
                        <div className="p-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                                    <div className="text-lg font-bold text-blue-400">{player.contract.years} years</div>
                                    <div className="text-xs text-[var(--text-secondary)]">Contract Length</div>
                                </div>
                                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                                    <div className="text-lg font-bold text-green-400">{player.contract.amount}</div>
                                    <div className="text-xs text-[var(--text-secondary)]">Total Value</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                                    <div className="text-lg font-bold text-yellow-400">{player.contract.guaranteed}</div>
                                    <div className="text-xs text-[var(--text-secondary)]">Guaranteed</div>
                                </div>
                            </div>
                        </div>
                    </Widget>
                )}
            </div>

            {/* Sidebar with Quick Stats and Astral Intelligence */}
            <div className="space-y-6">
                <Widget title="Fantasy Metrics">
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--text-secondary)]">Tier</span>
                            <span className="font-bold text-[var(--text-primary)]">Tier {player?.tier}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--text-secondary)]">Age</span>
                            <span className="font-bold text-[var(--text-primary)]">{player?.age} years</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--text-secondary)]">Last Year</span>
                            <span className="font-bold text-[var(--text-primary)]">{player.stats.lastYear} pts</span>
                        </div>
                        {player.advancedMetrics && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-[var(--text-secondary)]">Snap %</span>
                                    <span className="font-bold text-[var(--text-primary)]">{player.advancedMetrics.snapCountPct}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[var(--text-secondary)]">Target Share</span>
                                    <span className="font-bold text-[var(--text-primary)]">{player.advancedMetrics.targetSharePct}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[var(--text-secondary)]">RZ Touches</span>
                                    <span className="font-bold text-[var(--text-primary)]">{player.advancedMetrics.redZoneTouches}</span>
                                </div>
                            </>
                        )}
                    </div>
                </Widget>

                {player.astralIntelligence && (
                    <Widget title="Astral Intelligence">
                        <div className="p-4 space-y-3">
                            <div>
                                <span className="text-[var(--text-secondary)] text-sm">Spirit Animal</span>
                                <p className="font-medium text-[var(--text-primary)]">{player.astralIntelligence.spiritAnimal}</p>
                            </div>
                            <div>
                                <span className="text-[var(--text-secondary)] text-sm">Pregame Ritual</span>
                                <p className="font-medium text-[var(--text-primary)]">{player.astralIntelligence.pregameRitual}</p>
                            </div>
                            <div>
                                <span className="text-[var(--text-secondary)] text-sm">Offseason Hobby</span>
                                <p className="font-medium text-[var(--text-primary)]">{player.astralIntelligence.offseasonHobby}</p>
                            </div>
                            <div>
                                <span className="text-[var(--text-secondary)] text-sm">Signature Celebration</span>
                                <p className="font-medium text-[var(--text-primary)]">{player.astralIntelligence.signatureCelebration}</p>
                            </div>
                        </div>
                    </Widget>
                )}
            </div>
        </div>
    );
};

export default PlayerProfileView;
