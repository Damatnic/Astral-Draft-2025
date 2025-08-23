/**
 * Real-Time Oracle Prediction Dashboard
 * Live updates, collaborative features, and interactive prediction interface
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import Tabs from '../ui/Tabs';
import { Progress } from '../ui/Progress';
import { 
    TrendingUp, 
    TrendingDown, 
    Users, 
    MessageCircle, 
    Lightbulb,
    BarChart3,
    Send,
    ThumbsUp,
    ThumbsDown,
    Clock,
    Target,
    Zap
} from 'lucide-react';
import { oracleRealTimeService, LivePredictionUpdate } from '../../services/oracleRealTimeService';
import oracleCollaborativeService, { 
    CollaborativeMessage, 
    SharedInsight, 
    CollaborativeRoom,
    CommunityPoll
} from '../../services/oracleCollaborativeServiceMock';

interface OracleRealTimeDashboardProps {
    predictionId: string;
    userId: string;
    userInfo: {
        username: string;
        avatar?: string;
    };
    onPredictionUpdate?: (update: LivePredictionUpdate) => void;
}

interface RealTimeMetrics {
    activeUsers: number;
    totalMessages: number;
    consensusLevel: number;
    confidenceAverage: number;
    trendingDirection: 'up' | 'down' | 'stable';
}

const OracleRealTimeDashboard: React.FC<OracleRealTimeDashboardProps> = ({
    predictionId,
    userId,
    userInfo,
    onPredictionUpdate
}) => {
    // State management
    const [predictionUpdate] = useState<LivePredictionUpdate | null>(null);
    const [collaborativeRoom, setCollaborativeRoom] = useState<CollaborativeRoom | null>(null);
    const [messages, setMessages] = useState<CollaborativeMessage[]>([]);
    const [insights, setInsights] = useState<SharedInsight[]>([]);
    const [polls, setPolls] = useState<CommunityPoll[]>([]);
    const [metrics, setMetrics] = useState<RealTimeMetrics>({
        activeUsers: 0,
        totalMessages: 0,
        consensusLevel: 0,
        confidenceAverage: 0,
        trendingDirection: 'stable'
    });
    
    // UI state
    const [activeTab, setActiveTab] = useState('overview');
    const [messageInput, setMessageInput] = useState('');
    const [insightTitle, setInsightTitle] = useState('');
    const [insightContent, setInsightContent] = useState('');
    const [insightConfidence, setInsightConfidence] = useState(50);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize real-time connections
    useEffect(() => {
        const initializeServices = async () => {
            try {
                // Subscribe to live updates
                await oracleRealTimeService.subscribeToPrediction(userId, predictionId);
                
                // Join collaborative room
                const room = await oracleCollaborativeService.joinCollaborativeRoom(
                    predictionId,
                    userId
                );
                
                setCollaborativeRoom(room);
                setMessages(room.messages || []);
                setInsights(room.sharedInsights || []);
                setPolls(room.polls || []);
                setIsConnected(true);

                // Load initial data
                loadInitialData();

            } catch (error) {
                console.error('Failed to initialize real-time services:', error);
            }
        };

        initializeServices();

        // Cleanup on unmount
        return () => {
            // Cleanup if method exists
            if ('unsubscribeFromPrediction' in oracleRealTimeService) {
                (oracleRealTimeService as any).unsubscribeFromPrediction(userId, predictionId);
            }
        };
    }, [predictionId, userId, userInfo]);

    // Load initial data and metrics
    const loadInitialData = () => {
        // Update metrics with current data
        updateMetrics();
    };

    // Update metrics based on current data
    const updateMetrics = () => {
        if (!collaborativeRoom) return;

        const activeUsers = collaborativeRoom.participants?.filter((p: any) => p.isOnline).length || 0;
        const totalMessages = collaborativeRoom.analytics?.totalMessages || 0;
        const consensusLevel = collaborativeRoom.analytics?.consensusLevel || 0;
        
        // Calculate average confidence from recent insights
        const recentInsights = insights.slice(-10);
        const confidenceAverage = recentInsights.length > 0
            ? recentInsights.reduce((sum, insight) => sum + (insight.confidence || 0), 0) / recentInsights.length
            : 0;

        // Determine trending direction based on recent activity
        const recentMessages = messages.slice(-5);
        const positiveKeywords = ['good', 'positive', 'up', 'bullish', 'confident'];
        const negativeKeywords = ['bad', 'negative', 'down', 'bearish', 'uncertain'];
        
        let positiveCount = 0;
        let negativeCount = 0;
        
        recentMessages.forEach((msg: any) => {
            const content = msg.content.toLowerCase();
            positiveKeywords.forEach((keyword: any) => {
                if (content.includes(keyword)) positiveCount++;
            });
            negativeKeywords.forEach((keyword: any) => {
                if (content.includes(keyword)) negativeCount++;
            });
        });

        let trendingDirection: 'up' | 'down' | 'stable';
        if (positiveCount > negativeCount) {
            trendingDirection = 'up';
        } else if (negativeCount > positiveCount) {
            trendingDirection = 'down';
        } else {
            trendingDirection = 'stable';
        }

        setMetrics({
            activeUsers,
            totalMessages,
            consensusLevel,
            confidenceAverage,
            trendingDirection
        });
    };

    // Handle message sending
    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;

        try {
            const message = await oracleCollaborativeService.sendMessage(
                userId,
                predictionId,
                messageInput.trim()
            );

            setMessages(prev => [...prev, message]);
            setMessageInput('');
            updateMetrics();

        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get confidence color
    const getConfidenceColor = (confidence: number): string => {
        if (confidence >= 80) return 'text-green-600';
        if (confidence >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    // Tab items for the tabs component
    const tabItems = [
        { id: 'overview', label: 'Overview' },
        { id: 'chat', label: 'Discussion' },
        { id: 'insights', label: 'Insights' },
        { id: 'polls', label: 'Polls' }
    ];

    // Render metrics overview
    const renderMetricsOverview = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <div>
                            <p className="text-sm font-medium">Active Users</p>
                            <p className="text-2xl font-bold">{metrics.activeUsers}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4 text-green-500" />
                        <div>
                            <p className="text-sm font-medium">Messages</p>
                            <p className="text-2xl font-bold">{metrics.totalMessages}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-purple-500" />
                        <div>
                            <p className="text-sm font-medium">Consensus</p>
                            <p className="text-2xl font-bold">{metrics.consensusLevel.toFixed(0)}%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        {metrics.trendingDirection === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {metrics.trendingDirection === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        {metrics.trendingDirection === 'stable' && <BarChart3 className="h-4 w-4 text-gray-500" />}
                        <div>
                            <p className="text-sm font-medium">Sentiment</p>
                            <p className="text-2xl font-bold capitalize">{metrics.trendingDirection}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // Render chat interface
    const renderChatInterface = () => (
        <Card className="h-[600px] flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Live Discussion</span>
                    <Badge variant={isConnected ? "default" : "destructive"}>
                        {isConnected ? "Connected" : "Connecting..."}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
                <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                    {messages.map((message) => (
                        <div key={message.id} className="flex space-x-3">
                            <Avatar 
                                avatar={message.username.charAt(0).toUpperCase()} 
                                className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium"
                            />
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium text-sm">{message.username}</span>
                                    <span className="text-xs text-gray-500">
                                        {formatTimestamp(message.timestamp)}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                        {message.type}
                                    </Badge>
                                </div>
                                <p className="text-sm mt-1">{message.content}</p>
                                {message.reactions && message.reactions.length > 0 && (
                                    <div className="flex items-center space-x-1 mt-2">
                                        {message.reactions.map((reaction) => (
                                            <Badge key={`${reaction.userId}-${reaction.emoji}-${reaction.timestamp}`} variant="secondary" className="text-xs">
                                                {reaction.emoji}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex space-x-2">
                    <textarea
                        placeholder="Share your thoughts..."
                        value={messageInput}
                        onChange={(e: any) => setMessageInput(e.target.value)}
                        onKeyDown={(e: any) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        className="flex-1 p-2 border rounded-lg min-h-[60px] resize-none"
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );

    // Render insights panel
    const renderInsightsPanel = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Lightbulb className="h-5 w-5" />
                        <span>Share Insight</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <input
                        type="text"
                        placeholder="Insight title..."
                        value={insightTitle}
                        onChange={(e: any) => setInsightTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                    <textarea
                        placeholder="Share your analysis or insight..."
                        value={insightContent}
                        onChange={(e: any) => setInsightContent(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg min-h-[100px] resize-none"
                    />
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Confidence Level: {insightConfidence}%</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={insightConfidence}
                            onChange={(e: any) => setInsightConfidence(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                    <button 
                        onClick={() => {
                            // Handle insight sharing when method is available
                            console.log('Insight sharing not yet implemented');
                        }}
                        disabled={!insightTitle.trim() || !insightContent.trim()}
                        className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2"
                    >
                        <Lightbulb className="h-4 w-4" />
                        <span>Share Insight</span>
                    </button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Community Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {insights.map((insight) => (
                            <div key={insight.id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{insight.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{insight.content}</p>
                                        <div className="flex items-center space-x-4 mt-3">
                                            <span className="text-xs text-gray-500">
                                                by {insight.username}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatTimestamp(insight.timestamp)}
                                            </span>
                                            <Badge variant="outline">
                                                {insight.type?.replace('_', ' ') || 'General'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-medium ${getConfidenceColor(insight.confidence || 0)}`}>
                                            {insight.confidence || 0}%
                                        </div>
                                        <div className="flex items-center space-x-1 mt-2">
                                            <button className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1">
                                                <ThumbsUp className="h-3 w-3" />
                                                <span>{insight.votes.filter(v => v.vote === 'upvote').length}</span>
                                            </button>
                                            <button className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1">
                                                <ThumbsDown className="h-3 w-3" />
                                                <span>{insight.votes.filter(v => v.vote === 'downvote').length}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // Helper function to calculate poll option results
    const calculatePollOptionResults = (poll: CommunityPoll) => {
        return poll.options.map((option) => {
            const votes = poll.responses?.filter((r: any) => r.optionId === option.id).length || 0;
            const totalResponses = poll.responses?.length || 0;
            const percentage = totalResponses > 0 
                ? (votes / totalResponses) * 100 
                : 0;
            
            return {
                option,
                votes,
                percentage
            };
        });
    };

    // Render polls section
    const renderPollsSection = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Community Polls</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {polls.map((poll) => {
                        const optionResults = calculatePollOptionResults(poll);
                        
                        return (
                            <div key={poll.id} className="border rounded-lg p-4">
                                <h4 className="font-medium">{poll.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{poll.question}</p>
                                <div className="mt-4 space-y-2">
                                    {optionResults.map(({ option, percentage }) => (
                                        <div key={option.id} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>{option.text}</span>
                                                <span>{percentage.toFixed(1)}%</span>
                                            </div>
                                            <Progress value={percentage} className="h-2" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                                    <span>{poll.responses?.length || 0} responses</span>
                                    <span className="flex items-center space-x-1">
                                        <Clock className="h-3 w-3" />
                                        <span>Expires {poll.expiresAt ? new Date(poll.expiresAt).toLocaleDateString() : 'N/A'}</span>
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );

    // Render content based on active tab
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>{renderChatInterface()}</div>
                        <div>{renderInsightsPanel()}</div>
                    </div>
                );
            case 'chat':
                return renderChatInterface();
            case 'insights':
                return renderInsightsPanel();
            case 'polls':
                return renderPollsSection();
            default:
                return renderChatInterface();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Zap className="h-5 w-5" />
                            <span>Oracle Real-Time Dashboard</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant={isConnected ? "default" : "destructive"}>
                                {isConnected ? "Live" : "Connecting"}
                            </Badge>
                            {predictionUpdate && (
                                <Badge variant="outline">
                                    Updated {formatTimestamp(predictionUpdate.timestamp)}
                                </Badge>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Metrics Overview */}
            {renderMetricsOverview()}

            {/* Main Content Tabs */}
            <Card>
                <CardHeader>
                    <Tabs 
                        items={tabItems}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </CardHeader>
                <CardContent>
                    {renderTabContent()}
                </CardContent>
            </Card>
        </div>
    );
};

export default OracleRealTimeDashboard;
