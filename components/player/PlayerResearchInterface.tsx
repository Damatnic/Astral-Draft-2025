import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SearchIcon, 
    UserIcon, 
    BarChart3Icon, 
    TrendingUpIcon,
    TrendingDownIcon,
    NewspaperIcon,
    GitCompareIcon,
    FilterIcon,
    StarIcon,
    AlertCircleIcon,
    ClockIcon,
    TargetIcon,
    BookOpenIcon,
    ActivityIcon
} from 'lucide-react';
import { Widget } from '../ui/Widget';
import { useAuth } from '../../contexts/AuthContext';
import { 
    playerResearchService,
    type PlayerBaseInfo,
    type PlayerProjection,
    type PlayerNews,
    type PlayerTrend,
    type PlayerComparison,
    type ResearchInsight,
    type PlayerResearchFilter
} from '../../services/playerResearchService';

interface Props {
    className?: string;
}

type ResearchTab = 'search' | 'projections' | 'news' | 'trends' | 'compare' | 'insights';
type PlayerDetailTab = 'overview' | 'stats' | 'projections' | 'news' | 'trends' | 'compare';

const PlayerResearchInterface: React.FC<Props> = ({ 
    className = '' 
}) => {
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<ResearchTab>('search');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data state
    const [searchResults, setSearchResults] = useState<PlayerBaseInfo[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerBaseInfo | null>(null);
    const [playerDetailTab, setPlayerDetailTab] = useState<PlayerDetailTab>('overview');
    const [playerProjections, setPlayerProjections] = useState<PlayerProjection[]>([]);
    const [playerNews, setPlayerNews] = useState<PlayerNews[]>([]);
    const [playerTrends, setPlayerTrends] = useState<PlayerTrend[]>([]);
    const [playerInsights, setPlayerInsights] = useState<ResearchInsight[]>([]);
    const [comparePlayer1, setComparePlayer1] = useState<PlayerBaseInfo | null>(null);
    const [comparePlayer2, setComparePlayer2] = useState<PlayerBaseInfo | null>(null);
    const [comparison, setComparison] = useState<PlayerComparison | null>(null);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFilter, setSearchFilter] = useState<PlayerResearchFilter>({
        sortBy: 'name',
        sortOrder: 'asc',
        limit: 20
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            handleSearch();
        }
    }, [isAuthenticated, searchFilter]);

    const handleSearch = async () => {
        setLoading(true);
        setError(null);

        try {
            const results = await playerResearchService.searchPlayers(searchFilter);
            
            // Apply text search if query exists
            let filteredResults = results;
            if (searchQuery.trim()) {
                filteredResults = results.filter((player: any) =>
                    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    player.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    player.position.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            setSearchResults(filteredResults);
        } catch (err) {
            console.error('Search failed:', err);
            setError('Failed to search players');
        } finally {
            setLoading(false);
        }
    };

    const handlePlayerSelect = useCallback(async (player: PlayerBaseInfo) => {
        setSelectedPlayer(player);
        setPlayerDetailTab('overview');
        setLoading(true);

        try {
            // Load all player data in parallel
            const [, projections, news, trends, insights] = await Promise.all([
                playerResearchService.getPlayerSeasonStats(player.id, 2024),
                playerResearchService.getPlayerProjections(player.id),
                playerResearchService.getPlayerNews(player.id, 5),
                playerResearchService.getPlayerTrends(player.id),
                playerResearchService.getPlayerInsights(player.id)
            ]);

            setPlayerProjections(projections);
            setPlayerNews(news);
            setPlayerTrends(trends);
            setPlayerInsights(insights);
        } catch (err) {
            console.error('Failed to load player data:', err);
            setError('Failed to load player data');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCompareSelect = (player: PlayerBaseInfo, slot: 1 | 2) => {
        if (slot === 1) {
            setComparePlayer1(player);
        } else {
            setComparePlayer2(player);
        }

        // Auto-compare when both players selected
        if ((slot === 1 && comparePlayer2) || (slot === 2 && comparePlayer1)) {
            const p1 = slot === 1 ? player : comparePlayer1;
            const p2 = slot === 2 ? player : comparePlayer2;
            if (p1 && p2) {
                executeComparison(p1, p2);
            }
        }
    };

    const executeComparison = async (player1: PlayerBaseInfo, player2: PlayerBaseInfo) => {
        setLoading(true);
        try {
            const comparisonResult = await playerResearchService.comparePlayer(player1.id, player2.id);
            setComparison(comparisonResult);
        } catch (err) {
            console.error('Comparison failed:', err);
            setError('Failed to compare players');
        } finally {
            setLoading(false);
        }
    };

    const getInsightIcon = (type: ResearchInsight['type']) => {
        switch (type) {
            case 'breakout_candidate': return <TrendingUpIcon className="w-4 h-4" />;
            case 'buy_low': return <TargetIcon className="w-4 h-4" />;
            case 'sell_high': return <TrendingDownIcon className="w-4 h-4" />;
            case 'injury_concern': return <AlertCircleIcon className="w-4 h-4" />;
            case 'schedule_boost': return <ClockIcon className="w-4 h-4" />;
            case 'target_acquisition': return <StarIcon className="w-4 h-4" />;
            default: return <BookOpenIcon className="w-4 h-4" />;
        }
    };

    const getInsightColor = (type: ResearchInsight['type']): string => {
        switch (type) {
            case 'breakout_candidate': return 'bg-green-500/20 text-green-400 border-green-500';
            case 'buy_low': return 'bg-blue-500/20 text-blue-400 border-blue-500';
            case 'sell_high': return 'bg-orange-500/20 text-orange-400 border-orange-500';
            case 'injury_concern': return 'bg-red-500/20 text-red-400 border-red-500';
            case 'schedule_boost': return 'bg-purple-500/20 text-purple-400 border-purple-500';
            case 'target_acquisition': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
        }
    };

    const formatTrendChange = (trend: PlayerTrend) => {
        const sign = trend.changePercent >= 0 ? '+' : '';
        return `${sign}${trend.changePercent.toFixed(1)}%`;
    };

    if (!isAuthenticated) {
        return (
            <Widget title="🔍 Player Research" className={className}>
                <div className="text-center py-8">
                    <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Please log in to access player research tools</p>
                </div>
            </Widget>
        );
    }

    const tabs = [
        { id: 'search', label: 'Player Search', icon: SearchIcon },
        { id: 'projections', label: 'Projections', icon: BarChart3Icon },
        { id: 'news', label: 'News', icon: NewspaperIcon },
        { id: 'trends', label: 'Trends', icon: TrendingUpIcon },
        { id: 'compare', label: 'Compare', icon: GitCompareIcon },
        { id: 'insights', label: 'Insights', icon: BookOpenIcon }
    ];

    const detailTabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'stats', label: 'Statistics' },
        { id: 'projections', label: 'Projections' },
        { id: 'news', label: 'News' },
        { id: 'trends', label: 'Trends' },
        { id: 'compare', label: 'Compare' }
    ];

    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    const teams = ['BUF', 'SF', 'LAR', 'KC', 'GB', 'TB', 'DAL', 'NE', 'PIT', 'BAL'];

    const renderPlayerCard = (player: PlayerBaseInfo, onClick?: () => void, showCompareButton?: boolean) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-medium text-white">{player.name}</h3>
                    <p className="text-sm text-gray-400">{player.position} • {player.team}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        player?.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        player?.status === 'injured' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                    }`}>
                        {player.status.toUpperCase()}
                    </span>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                <div>Age: {player?.age}</div>
                <div>Exp: {player.experience}y</div>
                <div>Height: {player.height}</div>
                <div>Weight: {player.weight}lbs</div>
            </div>

            {showCompareButton && (
                <div className="flex space-x-2">
                    <button
                        onClick={(e: any) => {
                            e.stopPropagation();
                            handleCompareSelect(player, 1);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs flex-1"
                    >
                        Compare A
                    </button>
                    <button
                        onClick={(e: any) => {
                            e.stopPropagation();
                            handleCompareSelect(player, 2);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs flex-1"
                    >
                        Compare B
                    </button>
                </div>
            )}
        </motion.div>
    );

    const renderPlayerDetails = () => {
        if (!selectedPlayer) return null;

        return (
            <div className="space-y-4">
                {/* Player Header */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedPlayer.name}</h2>
                            <p className="text-lg text-gray-400">{selectedPlayer.position} • {selectedPlayer.team}</p>
                            {selectedPlayer.college && (
                                <p className="text-sm text-gray-500">{selectedPlayer.college}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400">#{selectedPlayer.jersey}</div>
                            <div className={`px-3 py-1 rounded text-sm font-bold ${
                                selectedPlayer?.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                selectedPlayer?.status === 'injured' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                            }`}>
                                {selectedPlayer.status.toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* Detail Tabs */}
                    <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg mb-4">
                        {detailTabs.map((tab: any) => (
                            <button
                                key={tab.id}
                                onClick={() => setPlayerDetailTab(tab.id as PlayerDetailTab)}
                                className={`px-3 py-2 rounded-md transition-colors text-sm ${
                                    playerDetailTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-600'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Detail Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={playerDetailTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {playerDetailTab === 'overview' && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-medium text-white mb-3">Physical Profile</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Age:</span>
                                                <span className="text-white">{selectedPlayer?.age}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Experience:</span>
                                                <span className="text-white">{selectedPlayer.experience} years</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Height:</span>
                                                <span className="text-white">{selectedPlayer.height}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Weight:</span>
                                                <span className="text-white">{selectedPlayer.weight} lbs</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-medium text-white mb-3">Key Insights</h3>
                                        <div className="space-y-2">
                                            {playerInsights.slice(0, 3).map((insight: any) => (
                                                <div
                                                    key={insight.id}
                                                    className={`rounded-lg p-3 border ${getInsightColor(insight.type)}`}
                                                >
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        {getInsightIcon(insight.type)}
                                                        <span className="font-medium text-sm">{insight.title}</span>
                                                    </div>
                                                    <p className="text-xs opacity-90">{insight.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {playerDetailTab === 'projections' && (
                                <div className="space-y-4">
                                    <h3 className="font-medium text-white">Weekly Projections</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {playerProjections.slice(0, 4).map((projection: any) => (
                                            <div key={`${projection.week}`} className="bg-gray-700/50 rounded-lg p-4">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-medium text-white">Week {projection.week}</h4>
                                                    <span className="text-xs text-gray-400">{projection.confidence.toFixed(0)}% confident</span>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Projected Points:</span>
                                                        <span className="text-white font-medium">{projection.fantasyPoints.toFixed(1)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Floor:</span>
                                                        <span className="text-red-400">{projection.floor.toFixed(1)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Ceiling:</span>
                                                        <span className="text-green-400">{projection.ceiling.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {playerDetailTab === 'news' && (
                                <div className="space-y-3">
                                    <h3 className="font-medium text-white">Recent News</h3>
                                    {playerNews.map((news: any) => (
                                        <div key={news.id} className="bg-gray-700/50 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-medium text-white text-sm leading-tight">{news.headline}</h4>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        news.impact === 'positive' ? 'bg-green-500/20 text-green-400' :
                                                        news.impact === 'negative' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                        {news.impact}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-gray-400 text-sm mb-2">{news.summary}</p>
                                            <div className="flex justify-between items-center text-xs text-gray-500">
                                                <span>{news.source}</span>
                                                <span>{news.publishedAt.toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {playerDetailTab === 'trends' && (
                                <div className="space-y-4">
                                    <h3 className="font-medium text-white">Performance Trends</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {playerTrends.map((trend, index) => (
                                            <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-medium text-white text-sm">{trend.metric.replace('_', ' ')}</h4>
                                                    <div className="flex items-center space-x-2">
                                                        {trend.direction === 'up' && <TrendingUpIcon className="w-4 h-4 text-green-400" />}
                                                        {trend.direction === 'down' && <TrendingDownIcon className="w-4 h-4 text-red-400" />}
                                                        {trend.direction === 'stable' && <ActivityIcon className="w-4 h-4 text-gray-400" />}
                                                        <span className={`text-sm font-medium ${
                                                            trend.direction === 'up' ? 'text-green-400' :
                                                            trend.direction === 'down' ? 'text-red-400' :
                                                            'text-gray-400'
                                                        }`}>
                                                            {formatTrendChange(trend)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-gray-400 text-xs">{trend.description}</p>
                                                <div className="mt-2 text-xs text-gray-500">
                                                    {trend.timeframe.replace('_', ' ')} • {(trend.significance * 100).toFixed(0)}% confidence
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        );
    };

    return (
        <div className={`space-y-6 ${className}`}>
            <Widget title="🔍 Player Research" className="overflow-visible">
                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
                    {tabs.map((tab: any) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as ResearchTab)}
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

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'search' && (
                            <div className="space-y-4">
                                {/* Search Controls */}
                                <div className="flex items-center space-x-4">
                                    <div className="flex-1 relative">
                                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e: any) => setSearchQuery(e.target.value)}
                                            onKeyPress={(e: any) => e.key === 'Enter' && handleSearch()}
                                            placeholder="Search players by name, team, or position..."
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                                    >
                                        <FilterIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleSearch}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Search
                                    </button>
                                </div>

                                {/* Filters */}
                                {showFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-gray-800 rounded-lg p-4 space-y-4"
                                    >
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Position</label>
                                                <select
                                                    multiple
                                                    value={searchFilter.positions || []}
                                                    onChange={(e: any) => {
                                                        const values = Array.from(e.target.selectedOptions, option => option.value);
                                                        setSearchFilter(prev => ({ ...prev, positions: values }));
                                                    }}
                                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                                                >
                                                    {positions.map((pos: any) => (
                                                        <option key={pos} value={pos}>{pos}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Team</label>
                                                <select
                                                    multiple
                                                    value={searchFilter.teams || []}
                                                    onChange={(e: any) => {
                                                        const values = Array.from(e.target.selectedOptions, option => option.value);
                                                        setSearchFilter(prev => ({ ...prev, teams: values }));
                                                    }}
                                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                                                >
                                                    {teams.map((team: any) => (
                                                        <option key={team} value={team}>{team}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
                                                <select
                                                    value={searchFilter.sortBy}
                                                    onChange={(e: any) => setSearchFilter(prev => ({ 
                                                        ...prev, 
                                                        sortBy: e.target.value as any 
                                                    }))}
                                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                                                >
                                                    <option value="name">Name</option>
                                                    <option value="position">Position</option>
                                                    <option value="team">Team</option>
                                                    <option value="fantasy_points">Fantasy Points</option>
                                                </select>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Search Results */}
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                                        <span className="ml-2 text-gray-400">Searching players...</span>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {searchResults.map((player: any) => 
                                            renderPlayerCard(
                                                player, 
                                                () => handlePlayerSelect(player),
                                                false
                                            )
                                        )}
                                    </div>
                                )}

                                {/* Selected Player Details */}
                                {selectedPlayer && activeTab === 'search' && renderPlayerDetails()}
                            </div>
                        )}

                        {activeTab === 'compare' && (
                            <div className="space-y-6">
                                {/* Player Selection */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-white">Player A</h3>
                                        {comparePlayer1 ? (
                                            renderPlayerCard(comparePlayer1, () => setComparePlayer1(null))
                                        ) : (
                                            <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                                                <UserIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-400">Select a player to compare</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-white">Player B</h3>
                                        {comparePlayer2 ? (
                                            renderPlayerCard(comparePlayer2, () => setComparePlayer2(null))
                                        ) : (
                                            <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                                                <UserIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-400">Select a player to compare</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Comparison Results */}
                                {comparison && (
                                    <div className="bg-gray-800 rounded-lg p-6">
                                        <h3 className="font-medium text-white mb-4">Comparison Results</h3>
                                        
                                        <div className="space-y-4">
                                            {comparison.metrics.map((metric, index) => (
                                                <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-medium text-white">{metric.name}</h4>
                                                        <span className="text-xs text-gray-400">{metric.category}</span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className={`text-center p-2 rounded ${
                                                            metric.advantage === 'player1' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'
                                                        }`}>
                                                            <div className="font-bold">{metric.player1Value.toFixed(1)}</div>
                                                            <div className="text-xs">{comparePlayer1?.name}</div>
                                                        </div>
                                                        
                                                        <div className="text-center p-2">
                                                            <div className="text-xs text-gray-500">vs</div>
                                                        </div>
                                                        
                                                        <div className={`text-center p-2 rounded ${
                                                            metric.advantage === 'player2' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'
                                                        }`}>
                                                            <div className="font-bold">{metric.player2Value.toFixed(1)}</div>
                                                            <div className="text-xs">{comparePlayer2?.name}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Trade Recommendation */}
                                        {comparison.recommendedTrade && (
                                            <div className="mt-6 bg-blue-900/20 rounded-lg p-4">
                                                <h4 className="font-medium text-blue-400 mb-2">Trade Recommendation</h4>
                                                <p className="text-gray-300 text-sm mb-2">{comparison.recommendedTrade.reasoning}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-sm font-medium ${
                                                        comparison.recommendedTrade.recommended ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                        {comparison.recommendedTrade.recommended ? 'Recommended' : 'Not Recommended'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {comparison.recommendedTrade.confidenceLevel}% confidence
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Player Search for Comparison */}
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <h3 className="font-medium text-white mb-4">Search Players</h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {searchResults.slice(0, 6).map((player: any) => 
                                            renderPlayerCard(player, undefined, true)
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === 'projections' || activeTab === 'news' || activeTab === 'trends' || activeTab === 'insights') && (
                            <div className="text-center py-8">
                                <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400">Select a player from the search tab to view {activeTab}</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Widget>
        </div>
    );
};

export default PlayerResearchInterface;
