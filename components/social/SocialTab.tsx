import React, { useState, useEffect } from 'react';
import oracleSocialService, { 
    OracleLeague, 
    LeagueSettings,
    GroupPrediction,
    Debate,
    DebateSide
} from '../../services/oracleSocialService';

type ReactionType = '👍' | '👎' | '🔥' | '💯' | '🤔' | '😂';

interface SocialTabProps {
    isActive: boolean;
}

interface CreateLeagueFormData {
    name: string;
    description: string;
    isPublic: boolean;
    maxMembers: number;
    settings: LeagueSettings;
}

// Helper functions
const getPredictionStatusColor = (status: string) => {
    if (status === 'OPEN') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'CLOSED') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const getMemberRoleColor = (role: string) => {
    if (role === 'CREATOR') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (role === 'ADMIN') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300';
};

const getSideDisplayText = (side: DebateSide) => {
    if (side === 'SIDE_A') return 'Side A';
    if (side === 'SIDE_B') return 'Side B';
    return 'Neutral';
};

const SocialTab: React.FC<SocialTabProps> = ({ isActive }) => {
    const [activeSubTab, setActiveSubTab] = useState<'leagues' | 'predictions' | 'debates'>('leagues');
    const [userLeagues, setUserLeagues] = useState<OracleLeague[]>([]);
    const [publicLeagues, setPublicLeagues] = useState<OracleLeague[]>([]);
    const [showCreateLeague, setShowCreateLeague] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedLeague, setSelectedLeague] = useState<OracleLeague | null>(null);

    // Form data states
    const [createLeagueForm, setCreateLeagueForm] = useState<CreateLeagueFormData>({
        name: '',
        description: '',
        isPublic: true,
        maxMembers: 50,
        settings: {
            challengeFrequency: 'WEEKLY',
            pointsSystem: 'STANDARD',
            allowDebates: true,
            allowGroupPredictions: true,
            autoStartChallenges: true,
            minimumParticipants: 2,
            enableTrashtalk: true,
            moderationLevel: 'MODERATED',
            customRules: []
        }
    });

    const [joinCode, setJoinCode] = useState('');

    // Debates state
    const [debates, setDebates] = useState<Debate[]>([]);
    const [showCreateDebate, setShowCreateDebate] = useState(false);
    const [selectedDebate, setSelectedDebate] = useState<Debate | null>(null);
    const [createDebateForm, setCreateDebateForm] = useState({
        title: '',
        topic: '',
        description: '',
        leagueId: ''
    });
    const [debatePostContent, setDebatePostContent] = useState('');
    const [selectedSide, setSelectedSide] = useState<DebateSide>('NEUTRAL');

    useEffect(() => {
        if (isActive) {
            loadData();
        }
    }, [isActive]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [leagues, publicLeaguesData] = await Promise.all([
                oracleSocialService.getUserLeagues(),
                oracleSocialService.getPublicLeagues()
            ]);
            setUserLeagues(leagues);
            setPublicLeagues(publicLeaguesData);
            
            // Load debates for selected league
            if (selectedLeague) {
                const leagueDebates = await oracleSocialService.getLeagueDebates(selectedLeague.id);
                setDebates(leagueDebates);
            }
        } catch (error) {
            console.error('Failed to load social data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLeague = async () => {
        if (!createLeagueForm.name.trim()) return;

        setLoading(true);
        try {
            await oracleSocialService.createLeague(
                createLeagueForm.name,
                createLeagueForm.description,
                createLeagueForm.settings,
                createLeagueForm.isPublic,
                createLeagueForm.maxMembers
            );
            setShowCreateLeague(false);
            setCreateLeagueForm({
                name: '',
                description: '',
                isPublic: true,
                maxMembers: 50,
                settings: {
                    challengeFrequency: 'WEEKLY',
                    pointsSystem: 'STANDARD',
                    allowDebates: true,
                    allowGroupPredictions: true,
                    autoStartChallenges: true,
                    minimumParticipants: 2,
                    enableTrashtalk: true,
                    moderationLevel: 'MODERATED',
                    customRules: []
                }
            });
            loadData();
        } catch (error) {
            console.error('Failed to create league:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinLeague = async (leagueId: string) => {
        setLoading(true);
        try {
            const success = await oracleSocialService.joinLeague(leagueId);
            if (success) {
                loadData();
            }
        } catch (error) {
            console.error('Failed to join league:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinByCode = async () => {
        if (!joinCode.trim()) return;

        setLoading(true);
        try {
            const success = await oracleSocialService.joinLeague('', joinCode);
            if (success) {
                setJoinCode('');
                loadData();
            }
        } catch (error) {
            console.error('Failed to join league by code:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debate handlers
    const handleCreateDebate = async () => {
        if (!createDebateForm.title.trim() || !createDebateForm.leagueId) return;

        setLoading(true);
        try {
            await oracleSocialService.createDebate(
                createDebateForm.leagueId,
                createDebateForm.title,
                createDebateForm.topic,
                createDebateForm.description
            );
            setShowCreateDebate(false);
            setCreateDebateForm({
                title: '',
                topic: '',
                description: '',
                leagueId: ''
            });
            loadData();
        } catch (error) {
            console.error('Failed to create debate:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinDebate = async (debateId: string, side: DebateSide) => {
        setLoading(true);
        try {
            await oracleSocialService.joinDebate(debateId, side);
            loadData();
        } catch (error) {
            console.error('Failed to join debate:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostInDebate = async (debateId: string) => {
        if (!debatePostContent.trim()) return;

        setLoading(true);
        try {
            await oracleSocialService.postInDebate(debateId, debatePostContent, selectedSide);
            setDebatePostContent('');
            loadData();
        } catch (error) {
            console.error('Failed to post in debate:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVoteInDebate = async (debateId: string, side: 'SIDE_A' | 'SIDE_B') => {
        setLoading(true);
        try {
            await oracleSocialService.voteInDebate(debateId, side);
            loadData();
        } catch (error) {
            console.error('Failed to vote in debate:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddReaction = async (postId: string, reaction: ReactionType) => {
        try {
            await oracleSocialService.addReaction(postId, reaction);
            loadData();
        } catch (error) {
            console.error('Failed to add reaction:', error);
        }
    };

    if (!isActive) return null;

    return (
        <div className="space-y-6">
            {/* Sub-navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveSubTab('leagues')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeSubTab === 'leagues'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        🏆 Leagues
                    </button>
                    <button
                        onClick={() => setActiveSubTab('predictions')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeSubTab === 'predictions'
                                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        🔮 Group Predictions
                    </button>
                    <button
                        onClick={() => setActiveSubTab('debates')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeSubTab === 'debates'
                                ? 'border-red-500 text-red-600 dark:text-red-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        ⚔️ Debates
                    </button>
                </nav>
            </div>

            {loading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            )}

            {/* Tab Content */}
            {activeSubTab === 'leagues' && (
                <div className="space-y-6">
                    {/* Create/Join League Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Start Your Oracle League
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    Create a private league with friends or join public competitions
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setShowCreateLeague(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        Create League
                                    </button>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={joinCode}
                                            onChange={(e: any) => setJoinCode(e.target.value.toUpperCase())}
                                            placeholder="Enter join code"
                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-32"
                                        />
                                        <button
                                            onClick={handleJoinByCode}
                                            disabled={!joinCode.trim() || loading}
                                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Join
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:w-64">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {userLeagues.length}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Your Leagues
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Your Leagues */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Your Leagues ({userLeagues.length})
                        </h3>
                        {userLeagues.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">🏆</div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    You haven't joined any leagues yet. Create one or browse public leagues below!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {userLeagues.map((league) => (
                                    <LeagueCard 
                                        key={league.id} 
                                        league={league} 
                                        isOwned={league.creatorId === 'current-user'}
                                        onClick={() => setSelectedLeague(league)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Public Leagues */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Public Leagues ({publicLeagues.length})
                        </h3>
                        {publicLeagues.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">🌐</div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    No public leagues available at the moment.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {publicLeagues.map((league) => (
                                    <LeagueCard 
                                        key={league.id} 
                                        league={league} 
                                        onJoin={() => handleJoinLeague(league.id)}
                                        showJoinButton={true}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Create League Modal */}
                    {showCreateLeague && (
                        <CreateLeagueModal
                            formData={createLeagueForm}
                            setFormData={setCreateLeagueForm}
                            onSubmit={handleCreateLeague}
                            onClose={() => setShowCreateLeague(false)}
                            loading={loading}
                        />
                    )}

                    {/* League Details Modal */}
                    {selectedLeague && (
                        <LeagueDetailsModal
                            league={selectedLeague}
                            onClose={() => setSelectedLeague(null)}
                        />
                    )}
                </div>
            )}
            
            {activeSubTab === 'predictions' && (
                <GroupPredictionsTab 
                    userLeagues={userLeagues}
                    selectedLeague={selectedLeague}
                    onSelectLeague={setSelectedLeague}
                />
            )}
            
            {activeSubTab === 'debates' && (
                <DebatesTab 
                    userLeagues={userLeagues}
                    selectedLeague={selectedLeague}
                    onSelectLeague={setSelectedLeague}
                    debates={debates}
                    showCreateDebate={showCreateDebate}
                    onShowCreateDebate={setShowCreateDebate}
                    createDebateForm={createDebateForm}
                    onUpdateCreateDebateForm={setCreateDebateForm}
                    selectedDebate={selectedDebate}
                    onSelectDebate={setSelectedDebate}
                    debatePostContent={debatePostContent}
                    onUpdateDebatePostContent={setDebatePostContent}
                    selectedSide={selectedSide}
                    onUpdateSelectedSide={setSelectedSide}
                    onCreateDebate={handleCreateDebate}
                    onJoinDebate={handleJoinDebate}
                    onPostInDebate={handlePostInDebate}
                    onVoteInDebate={handleVoteInDebate}
                    onAddReaction={handleAddReaction}
                    loading={loading}
                />
            )}
        </div>
    );
};

// Debates Tab Component
interface DebatesTabProps {
    userLeagues: OracleLeague[];
    selectedLeague: OracleLeague | null;
    onSelectLeague: (league: OracleLeague | null) => void;
    debates: Debate[];
    showCreateDebate: boolean;
    onShowCreateDebate: (show: boolean) => void;
    createDebateForm: {
        title: string;
        topic: string;
        description: string;
        leagueId: string;
    };
    onUpdateCreateDebateForm: (form: any) => void;
    selectedDebate: Debate | null;
    onSelectDebate: (debate: Debate | null) => void;
    debatePostContent: string;
    onUpdateDebatePostContent: (content: string) => void;
    selectedSide: DebateSide;
    onUpdateSelectedSide: (side: DebateSide) => void;
    onCreateDebate: () => void;
    onJoinDebate: (debateId: string, side: DebateSide) => void;
    onPostInDebate: (debateId: string) => void;
    onVoteInDebate: (debateId: string, side: 'SIDE_A' | 'SIDE_B') => void;
    onAddReaction: (postId: string, reaction: ReactionType) => void;
    loading: boolean;
}

const DebatesTab: React.FC<DebatesTabProps> = ({
    userLeagues,
    selectedLeague,
    onSelectLeague,
    debates,
    showCreateDebate,
    onShowCreateDebate,
    createDebateForm,
    onUpdateCreateDebateForm,
    selectedDebate,
    onSelectDebate,
    debatePostContent,
    onUpdateDebatePostContent,
    selectedSide,
    onUpdateSelectedSide,
    onCreateDebate,
    onJoinDebate,
    onPostInDebate,
    onVoteInDebate,
    onAddReaction,
    loading
}) => {
    const getDebateStatusColor = (status: string) => {
        if (status === 'ACTIVE') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        if (status === 'CLOSED') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    };

    const getSideColor = (side: DebateSide) => {
        if (side === 'SIDE_A') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        if (side === 'SIDE_B') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300';
    };

    if (!selectedLeague) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚔️</div>
                    <h4 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                        Fantasy Debates
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Select a league to view or create debates about trades, lineups, and fantasy strategies!
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-sm mx-auto mb-6">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Join discussions with real-time voting and moderation tools
                        </p>
                    </div>
                </div>

                {/* League Selection */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Select a League for Debates
                    </h3>
                    {userLeagues.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">🏆</div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Join a league first to participate in debates!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userLeagues.map((league) => (
                                <button
                                    key={league.id}
                                    onClick={() => onSelectLeague(league)}
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow text-left"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{league.name}</h4>
                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                            ⚔️ Debates
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{league.description}</p>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {league.members.length} members
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* League Header with Back Button */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => onSelectLeague(null)}
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                        <span className="mr-2">&larr;</span>
                        <span>Back to League Selection</span>
                    </button>
                    <button
                        onClick={() => onShowCreateDebate(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Start New Debate
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {selectedLeague.name} Debates
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Engage in strategic discussions with league members
                        </p>
                    </div>
                    <div className="ml-auto bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {debates.length}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                Active Debates
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Debate Modal */}
            {showCreateDebate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Start New Debate
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="debate-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Debate Title *
                                </label>
                                <input
                                    id="debate-title"
                                    type="text"
                                    value={createDebateForm.title}
                                    onChange={(e: any) => onUpdateCreateDebateForm({
                                        ...createDebateForm,
                                        title: e.target.value,
                                        leagueId: selectedLeague.id
                                    })}
                                    placeholder="e.g., Should I trade my RB1 for a WR1?"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label htmlFor="debate-topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Topic Category
                                </label>
                                <select
                                    id="debate-topic"
                                    value={createDebateForm.topic}
                                    onChange={(e: any) => onUpdateCreateDebateForm({
                                        ...createDebateForm,
                                        topic: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select a topic</option>
                                    <option value="trades">Trade Proposals</option>
                                    <option value="lineups">Lineup Decisions</option>
                                    <option value="waivers">Waiver Pickups</option>
                                    <option value="draft">Draft Strategy</option>
                                    <option value="predictions">Performance Predictions</option>
                                    <option value="general">General Strategy</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="debate-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="debate-description"
                                    value={createDebateForm.description}
                                    onChange={(e: any) => onUpdateCreateDebateForm({
                                        ...createDebateForm,
                                        description: e.target.value
                                    })}
                                    placeholder="Provide context and details for your debate..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => onShowCreateDebate(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onCreateDebate}
                                disabled={!createDebateForm.title.trim() || loading}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                            >
                                {loading ? 'Creating...' : 'Start Debate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Debates List */}
            <div>
                {debates.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">⚔️</div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No debates yet
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Be the first to start a strategic discussion in this league!
                        </p>
                        <button
                            onClick={() => onShowCreateDebate(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Start First Debate
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {debates.map((debate) => (
                            <DebateCard
                                key={debate.id}
                                debate={debate}
                                onSelectDebate={onSelectDebate}
                                onJoinDebate={onJoinDebate}
                                onVoteInDebate={onVoteInDebate}
                                onPostInDebate={onPostInDebate}
                                onAddReaction={onAddReaction}
                                debatePostContent={debatePostContent}
                                onUpdateDebatePostContent={onUpdateDebatePostContent}
                                selectedSide={selectedSide}
                                onUpdateSelectedSide={onUpdateSelectedSide}
                                isExpanded={selectedDebate?.id === debate.id}
                                getDebateStatusColor={getDebateStatusColor}
                                getSideColor={getSideColor}
                                loading={loading}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Debate Card Component
interface DebateCardProps {
    debate: Debate;
    onSelectDebate: (debate: Debate | null) => void;
    onJoinDebate: (debateId: string, side: DebateSide) => void;
    onVoteInDebate: (debateId: string, side: 'SIDE_A' | 'SIDE_B') => void;
    onPostInDebate: (debateId: string) => void;
    onAddReaction: (postId: string, reaction: ReactionType) => void;
    debatePostContent: string;
    onUpdateDebatePostContent: (content: string) => void;
    selectedSide: DebateSide;
    onUpdateSelectedSide: (side: DebateSide) => void;
    isExpanded: boolean;
    getDebateStatusColor: (status: string) => string;
    getSideColor: (side: DebateSide) => string;
    loading: boolean;
}

const DebateCard: React.FC<DebateCardProps> = ({
    debate,
    onSelectDebate,
    onJoinDebate,
    onVoteInDebate,
    onPostInDebate,
    onAddReaction,
    debatePostContent,
    onUpdateDebatePostContent,
    selectedSide,
    onUpdateSelectedSide,
    isExpanded,
    getDebateStatusColor,
    getSideColor,
    loading
}) => {
    const sideAVotes = debate.votes.filter((v: any) => v.side === 'SIDE_A').length;
    const sideBVotes = debate.votes.filter((v: any) => v.side === 'SIDE_B').length;
    const totalVotes = sideAVotes + sideBVotes;
    const sideAPercentage = totalVotes > 0 ? (sideAVotes / totalVotes) * 100 : 0;
    const sideBPercentage = totalVotes > 0 ? (sideBVotes / totalVotes) * 100 : 0;

    const userParticipant = debate.participants.find((p: any) => p.userId === 'current-user');
    const userVote = debate.votes.find((v: any) => v.userId === 'current-user');

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {debate.title}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${getDebateStatusColor(debate?.status)}`}>
                                {debate?.status}
                            </span>
                            {debate.topic && (
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                    {debate.topic}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{debate.description}</p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
                            <span>{debate.participants.length} participants</span>
                            <span>{debate.posts.length} posts</span>
                            <span>{totalVotes} votes</span>
                            <span>{new Date(debate.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => onSelectDebate(isExpanded ? null : debate)}
                        className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        {isExpanded ? '▼' : '▶'}
                    </button>
                </div>

                {/* Voting Section */}
                {debate?.status === 'ACTIVE' && (
                    <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Community Vote</span>
                            {userVote && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                    You voted for {userVote.side === 'SIDE_A' ? 'Side A' : 'Side B'}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onVoteInDebate(debate.id, 'SIDE_A')}
                                disabled={!!userVote || loading}
                                className={`p-3 rounded-lg border transition-colors ${
                                    userVote?.side === 'SIDE_A'
                                        ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400'
                                        : 'border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                }`}
                            >
                                <div className="text-center">
                                    <div className="font-medium text-sm">Side A</div>
                                    <div className="text-xs mt-1">{sideAVotes} votes ({sideAPercentage.toFixed(0)}%)</div>
                                </div>
                            </button>
                            <button
                                onClick={() => onVoteInDebate(debate.id, 'SIDE_B')}
                                disabled={!!userVote || loading}
                                className={`p-3 rounded-lg border transition-colors ${
                                    userVote?.side === 'SIDE_B'
                                        ? 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400'
                                        : 'border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                }`}
                            >
                                <div className="text-center">
                                    <div className="font-medium text-sm">Side B</div>
                                    <div className="text-xs mt-1">{sideBVotes} votes ({sideBPercentage.toFixed(0)}%)</div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                        {/* Join Debate Section */}
                        {debate?.status === 'ACTIVE' && !userParticipant && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-3">
                                    Join the Debate
                                </h5>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => onJoinDebate(debate.id, 'SIDE_A')}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                                    >
                                        Side A
                                    </button>
                                    <button
                                        onClick={() => onJoinDebate(debate.id, 'SIDE_B')}
                                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                                    >
                                        Side B
                                    </button>
                                    <button
                                        onClick={() => onJoinDebate(debate.id, 'NEUTRAL')}
                                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                                    >
                                        Neutral
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Post in Debate */}
                        {userParticipant && debate?.status === 'ACTIVE' && (
                            <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
                                <div className="flex items-center gap-4 mb-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Post as:
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getSideColor(userParticipant.side)}`}>
                                        {getSideDisplayText(userParticipant.side)}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <textarea
                                        value={debatePostContent}
                                        onChange={(e: any) => onUpdateDebatePostContent(e.target.value)}
                                        placeholder="Share your argument or perspective..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    />
                                    <button
                                        onClick={() => onPostInDebate(debate.id)}
                                        disabled={!debatePostContent.trim() || loading}
                                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        {loading ? 'Posting...' : 'Post Argument'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Debate Posts */}
                        <div className="space-y-4">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                                Discussion ({debate.posts.length})
                            </h5>
                            {debate.posts.length === 0 ? (
                                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                    No posts yet. Be the first to share your perspective!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {debate.posts.map((post) => (
                                        <div
                                            key={post.id}
                                            className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {post.username}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${getSideColor(post.side)}`}>
                                                        {getSideDisplayText(post.side)}
                                                    </span>
                                                    {post.isPinned && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            📌 Pinned
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(post.postedAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 mb-3">{post.content}</p>
                                            
                                            {/* Reactions */}
                                            <div className="flex items-center gap-2">
                                                {['👍', '👎', '🔥', '💯', '🤔', '😂'].map((reaction) => {
                                                    const count = post.reactions.filter((r: any) => r.type === reaction).length;
                                                    const userReacted = post.reactions.some((r: any) => r.type === reaction && r.userId === 'current-user');
                                                    return (
                                                        <button
                                                            key={reaction}
                                                            onClick={() => onAddReaction(post.id, reaction as any)}
                                                            className={`text-sm px-2 py-1 rounded transition-colors ${
                                                                userReacted
                                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                            }`}
                                                        >
                                                            {reaction} {count > 0 && count}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// League Card Component
interface LeagueCardProps {
    league: OracleLeague;
    isOwned?: boolean;
    showJoinButton?: boolean;
    onJoin?: () => void;
    onClick?: () => void;
}

const LeagueCard: React.FC<LeagueCardProps> = ({ 
    league, 
    isOwned = false, 
    showJoinButton = false, 
    onJoin, 
    onClick 
}) => (
    <button 
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow text-left w-full"
        onClick={onClick}
        type="button"
    >
        <div className="flex justify-between items-start mb-3">
            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{league.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {league.description}
                </p>
            </div>
            {isOwned && (
                <span className="bg-gold-100 text-gold-800 text-xs px-2 py-1 rounded-full">
                    Owner
                </span>
            )}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span>{league.currentMembers}/{league.maxMembers} members</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
                league?.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
                {league?.status}
            </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
            {league.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">
                    {tag}
                </span>
            ))}
        </div>

        {showJoinButton && onJoin && (
            <button
                onClick={(e: any) => {
                    e.stopPropagation();
                    onJoin();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
            >
                Join League
            </button>
        )}

        {league.joinCode && (
            <div className="mt-2 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Join Code: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{league.joinCode}</code>
                </span>
            </div>
        )}
    </button>
);

// Group Prediction Card Component
interface GroupPredictionCardProps {
    prediction: GroupPrediction;
}

// Create League Modal Component
interface CreateLeagueModalProps {
    formData: CreateLeagueFormData;
    setFormData: React.Dispatch<React.SetStateAction<CreateLeagueFormData>>;
    onSubmit: () => void;
    onClose: () => void;
    loading: boolean;
}

const CreateLeagueModal: React.FC<CreateLeagueModalProps> = ({ 
    formData, 
    setFormData, 
    onSubmit, 
    onClose, 
    loading 
}) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Create New League
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="league-name-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            League Name *
                        </label>
                        <input
                            id="league-name-input"
                            type="text"
                            value={formData.name}
                            onChange={(e: any) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter league name"
                        />
                    </div>

                    <div>
                        <label htmlFor="league-description-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            id="league-description-input"
                            value={formData.description}
                            onChange={(e: any) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={3}
                            placeholder="Describe your league"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="max-members-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Max Members
                            </label>
                            <input
                                id="max-members-input"
                                type="number"
                                value={formData.maxMembers}
                                onChange={(e: any) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 50 }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                min="2"
                                max="500"
                            />
                        </div>

                        <div>
                            <label htmlFor="visibility-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Visibility
                            </label>
                            <select
                                id="visibility-select"
                                value={formData.isPublic ? 'public' : 'private'}
                                onChange={(e: any) => setFormData(prev => ({ ...prev, isPublic: e.target.value === 'public' }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">League Settings</h4>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Allow Debates</span>
                                <input
                                    type="checkbox"
                                    checked={formData.settings.allowDebates}
                                    onChange={(e: any) => setFormData(prev => ({
                                        ...prev,
                                        settings: { ...prev.settings, allowDebates: e.target.checked }
                                    }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Allow Group Predictions</span>
                                <input
                                    type="checkbox"
                                    checked={formData.settings.allowGroupPredictions}
                                    onChange={(e: any) => setFormData(prev => ({
                                        ...prev,
                                        settings: { ...prev.settings, allowGroupPredictions: e.target.checked }
                                    }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Trash Talk</span>
                                <input
                                    type="checkbox"
                                    checked={formData.settings.enableTrashtalk}
                                    onChange={(e: any) => setFormData(prev => ({
                                        ...prev,
                                        settings: { ...prev.settings, enableTrashtalk: e.target.checked }
                                    }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!formData.name.trim() || loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        {loading ? 'Creating...' : 'Create League'}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// League Details Modal Component
interface LeagueDetailsModalProps {
    league: OracleLeague;
    onClose: () => void;
}

const LeagueDetailsModal: React.FC<LeagueDetailsModalProps> = ({ league, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {league.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">{league.description}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                        <nav className="flex space-x-8">
                            {['overview', 'members', 'settings'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                                        activeTab === tab
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">League Stats</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Members:</span>
                                            <span className="text-gray-900 dark:text-white">{league.currentMembers}/{league.maxMembers}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                            <span className="text-gray-900 dark:text-white">{league?.status}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Created:</span>
                                            <span className="text-gray-900 dark:text-white">
                                                {new Date(league.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {league.joinCode && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Join Code</h4>
                                        <code className="bg-white dark:bg-gray-800 px-3 py-2 rounded border text-lg font-mono">
                                            {league.joinCode}
                                        </code>
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {league.tags.map((tag) => (
                                        <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                                Members ({league.members.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {league.members.map((member) => (
                                    <div key={member.userId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{member.avatar}</span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {member.username}
                                                </span>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getMemberRoleColor(member.role)}`}>
                                                {member.role}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            <div>Points: {member.stats.totalPoints}</div>
                                            <div>Rank: #{member.stats.rank}</div>
                                            <div>Win Rate: {(member.stats.winRate * 100).toFixed(1)}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 dark:text-white">League Settings</h4>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">Challenge Frequency:</span>
                                    <span className="text-gray-900 dark:text-white">{league.settings.challengeFrequency}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">Points System:</span>
                                    <span className="text-gray-900 dark:text-white">{league.settings.pointsSystem}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">Debates Allowed:</span>
                                    <span className="text-gray-900 dark:text-white">
                                        {league.settings.allowDebates ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">Group Predictions:</span>
                                    <span className="text-gray-900 dark:text-white">
                                        {league.settings.allowGroupPredictions ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">Moderation Level:</span>
                                    <span className="text-gray-900 dark:text-white">{league.settings.moderationLevel}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Group Predictions Tab Component
interface GroupPredictionsTabProps {
    userLeagues: OracleLeague[];
    selectedLeague: OracleLeague | null;
    onSelectLeague: (league: OracleLeague | null) => void;
}

const GroupPredictionsTab: React.FC<GroupPredictionsTabProps> = ({ 
    userLeagues, 
    selectedLeague, 
    onSelectLeague 
}) => {
    const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [createPredictionForm, setCreatePredictionForm] = useState({
        title: '',
        description: '',
        type: 'MAJORITY_VOTE' as GroupPrediction['type'],
        closesInHours: 24
    });

    useEffect(() => {
        if (selectedLeague) {
            loadGroupPredictions();
        }
    }, [selectedLeague]);

    const loadGroupPredictions = async () => {
        if (!selectedLeague) return;
        
        setLoading(true);
        try {
            const predictions = await oracleSocialService.getLeagueGroupPredictions(selectedLeague.id);
            setGroupPredictions(predictions);
        } catch (error) {
            console.error('Failed to load group predictions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePrediction = async () => {
        if (!selectedLeague || !createPredictionForm.title.trim()) return;

        setLoading(true);
        try {
            await oracleSocialService.createGroupPrediction(
                selectedLeague.id,
                'current-challenge', // In real app, this would be dynamic
                createPredictionForm.title,
                createPredictionForm.description,
                createPredictionForm.type,
                createPredictionForm.closesInHours
            );
            
            setShowCreateForm(false);
            setCreatePredictionForm({
                title: '',
                description: '',
                type: 'MAJORITY_VOTE',
                closesInHours: 24
            });
            
            await loadGroupPredictions();
        } catch (error) {
            console.error('Failed to create group prediction:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!selectedLeague) {
        return (
            <div className="space-y-6">
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔮</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Select a League
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Choose a league to view and participate in group predictions
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userLeagues.map((league: any) => (
                        <LeagueCard
                            key={league.id}
                            league={league}
                            isOwned={league.creatorId === 'current-user'}
                            onClick={() => onSelectLeague(league)}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* League Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => onSelectLeague(null)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
                    >
                        ← Back to Leagues
                    </button>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {selectedLeague.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Group Predictions
                        </p>
                    </div>
                </div>
                
                {selectedLeague.settings.allowGroupPredictions && (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Create Prediction
                    </button>
                )}
            </div>

            {/* Create Prediction Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Create Group Prediction
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="prediction-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title
                                </label>
                                <input
                                    id="prediction-title"
                                    type="text"
                                    value={createPredictionForm.title}
                                    onChange={(e: any) => setCreatePredictionForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                                    placeholder="e.g., Who will score the most points this week?"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="prediction-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="prediction-description"
                                    value={createPredictionForm.description}
                                    onChange={(e: any) => setCreatePredictionForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                                    rows={3}
                                    placeholder="Additional details about the prediction..."
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="prediction-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Prediction Type
                                </label>
                                <select
                                    id="prediction-type"
                                    value={createPredictionForm.type}
                                    onChange={(e: any) => setCreatePredictionForm(prev => ({ ...prev, type: e.target.value as GroupPrediction['type'] }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                                >
                                    <option value="MAJORITY_VOTE">Majority Vote</option>
                                    <option value="CONSENSUS">Consensus</option>
                                    <option value="WEIGHTED_AVERAGE">Weighted Average</option>
                                </select>
                            </div>
                            
                            <div>
                                <label htmlFor="prediction-hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Closes In (Hours)
                                </label>
                                <input
                                    id="prediction-hours"
                                    type="number"
                                    value={createPredictionForm.closesInHours}
                                    onChange={(e: any) => setCreatePredictionForm(prev => ({ ...prev, closesInHours: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                                    min="1"
                                    max="168"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePrediction}
                                disabled={!createPredictionForm.title.trim() || loading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                {loading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Predictions List */}
            {(() => {
                if (loading) {
                    return (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading predictions...</p>
                        </div>
                    );
                }
                
                if (groupPredictions.length === 0) {
                    return (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">🔮</div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                No Group Predictions Yet
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Be the first to create a group prediction for this league!
                            </p>
                            {selectedLeague.settings.allowGroupPredictions && (
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Create First Prediction
                                </button>
                            )}
                        </div>
                    );
                }
                
                return (
                    <div className="space-y-4">
                        {groupPredictions.map((prediction: any) => (
                            <GroupPredictionCard
                                key={prediction.id}
                                prediction={prediction}
                                onRefresh={loadGroupPredictions}
                            />
                        ))}
                    </div>
                );
            })()}
        </div>
    );
};

// Group Prediction Card Component
interface GroupPredictionCardProps {
    prediction: GroupPrediction;
    onRefresh: () => void;
}

const GroupPredictionCard: React.FC<GroupPredictionCardProps> = ({ prediction, onRefresh }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showSubmitForm, setShowSubmitForm] = useState(false);
    const [submitForm, setSubmitForm] = useState({
        prediction: '',
        confidence: 50,
        reasoning: ''
    });
    const [loading, setLoading] = useState(false);

    const isParticipating = prediction.participants.some((p: any) => p.userId === 'current-user');
    const userParticipation = prediction.participants.find((p: any) => p.userId === 'current-user');
    const timeLeft = new Date(prediction.closesAt).getTime() - Date.now();
    const isOpen = prediction?.status === 'OPEN' && timeLeft > 0;

    const handleSubmitPrediction = async () => {
        if (!submitForm.prediction.trim()) return;

        setLoading(true);
        try {
            await oracleSocialService.submitGroupPrediction(
                prediction.id,
                Number(submitForm.prediction),
                submitForm.confidence,
                submitForm.reasoning
            );
            
            setShowSubmitForm(false);
            setSubmitForm({ prediction: '', confidence: 50, reasoning: '' });
            onRefresh();
        } catch (error) {
            console.error('Failed to submit prediction:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeLeft = () => {
        if (timeLeft <= 0) return 'Closed';
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} day${days !== 1 ? 's' : ''} left`;
        }
        
        return `${hours}h ${minutes}m left`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {prediction.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {prediction.description}
                    </p>
                </div>
                
                <div className="ml-4 text-right">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        getPredictionStatusColor(prediction?.status)
                    }`}>
                        {prediction?.status}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formatTimeLeft()}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>👥 {prediction.participants.length} participants</span>
                    <span>📊 {prediction.type.replace('_', ' ')}</span>
                    <span>🏆 {prediction.rewards.winnerPoints} pts</span>
                </div>
                
                {isOpen && !isParticipating && (
                    <button
                        onClick={() => setShowSubmitForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Submit Prediction
                    </button>
                )}
                
                {isParticipating && (
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                        ✓ Participated
                    </span>
                )}
            </div>

            {userParticipation && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>Your Prediction:</strong> {userParticipation.prediction} 
                        <span className="ml-2 text-green-600 dark:text-green-400">
                            ({userParticipation.confidence}% confidence)
                        </span>
                    </p>
                    {userParticipation.reasoning && (
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            {userParticipation.reasoning}
                        </p>
                    )}
                </div>
            )}

            {prediction.result && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Group Result:</strong> {prediction.result.prediction} 
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                            ({prediction.result.confidence}% confidence)
                        </span>
                    </p>
                </div>
            )}

            <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
            >
                {showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            {showDetails && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">Participants</h5>
                    <div className="space-y-2">
                        {prediction.participants.map((participant: any) => (
                            <div key={participant.userId} className="flex justify-between items-center text-sm">
                                <span className="text-gray-900 dark:text-white">
                                    {participant.username}
                                </span>
                                <div className="text-right">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {participant.prediction} ({participant.confidence}%)
                                    </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                        {new Date(participant.submittedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submit Prediction Modal */}
            {showSubmitForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Submit Your Prediction
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="submit-prediction" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Your Prediction
                                </label>
                                <input
                                    id="submit-prediction"
                                    type="number"
                                    value={submitForm.prediction}
                                    onChange={(e: any) => setSubmitForm(prev => ({ ...prev, prediction: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                                    placeholder="Enter your prediction"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="submit-confidence" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confidence: {submitForm.confidence}%
                                </label>
                                <input
                                    id="submit-confidence"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={submitForm.confidence}
                                    onChange={(e: any) => setSubmitForm(prev => ({ ...prev, confidence: Number(e.target.value) }))}
                                    className="w-full"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="submit-reasoning" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Reasoning (Optional)
                                </label>
                                <textarea
                                    id="submit-reasoning"
                                    value={submitForm.reasoning}
                                    onChange={(e: any) => setSubmitForm(prev => ({ ...prev, reasoning: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                                    rows={3}
                                    placeholder="Explain your reasoning..."
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowSubmitForm(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitPrediction}
                                disabled={!submitForm.prediction.trim() || loading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                {loading ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialTab;
