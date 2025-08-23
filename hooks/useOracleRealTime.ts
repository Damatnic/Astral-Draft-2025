/**
 * Custom React hooks for Oracle real-time and collaborative features
 * Provides clean interfaces for components to interact with Oracle services
 */

import { useState, useEffect, useCallback } from 'react';
import { oracleRealTimeService, LivePredictionUpdate } from '../services/oracleRealTimeService';
import oracleCollaborativeService, { 
    CollaborativeMessage, 
    SharedInsight, 
    CollaborativeRoom
} from '../services/oracleCollaborativeServiceMock';

/**
 * Hook for Oracle real-time functionality
 */
export const useOracleRealTime = (userId: string, predictionId: string) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate] = useState<LivePredictionUpdate | null>(null);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    const connect = useCallback(async () => {
        try {
            await oracleRealTimeService.subscribeToPrediction(userId, predictionId);
            setIsConnected(true);
            setConnectionError(null);
        } catch (error) {
            setConnectionError(error instanceof Error ? error.message : 'Connection failed');
            setIsConnected(false);
        }
    }, [userId, predictionId]);

    const disconnect = useCallback(() => {
        // Disconnect if method exists
        if ('unsubscribeFromPrediction' in oracleRealTimeService) {
            (oracleRealTimeService as any).unsubscribeFromPrediction(userId, predictionId);
        }
        setIsConnected(false);
    }, [userId, predictionId]);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return {
        isConnected,
        lastUpdate,
        connectionError,
        connect,
        disconnect
    };
};

/**
 * Hook for Oracle collaborative features
 */
export const useOracleCollaborative = (userId: string, predictionId: string, userInfo?: { username?: string }) => {
    const [room, setRoom] = useState<CollaborativeRoom | null>(null);
    const [messages, setMessages] = useState<CollaborativeMessage[]>([]);
    const [insights, setInsights] = useState<SharedInsight[]>([]);
    const [polls, setPolls] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize room
    useEffect(() => {
        const initializeRoom = async () => {
            try {
                setIsLoading(true);
                const collaborativeRoom = await oracleCollaborativeService.joinCollaborativeRoom(
                    predictionId,
                    userId
                );
                
                setRoom(collaborativeRoom);
                setMessages(collaborativeRoom.messages || []);
                setInsights(collaborativeRoom.sharedInsights || []);
                setPolls(collaborativeRoom.polls || []);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to join room');
            } finally {
                setIsLoading(false);
            }
        };

        initializeRoom();
    }, [userId, predictionId, userInfo]);

    // Send message
    const sendMessage = useCallback(async (
        content: string,
        type: CollaborativeMessage['type'] = 'DISCUSSION',
        mentions?: string[]
    ) => {
        try {
            const message = await oracleCollaborativeService.sendMessage(
                userId,
                predictionId,
                content,
                mentions
            );
            setMessages(prev => [...prev, message]);
            return message;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to send message');
        }
    }, [userId, predictionId]);

    // Share insight
    const shareInsight = useCallback(async (params: any) => {
        try {
            // For now, create a mock insight since the method doesn't exist yet
            const insight: SharedInsight = {
                id: `insight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                predictionId,
                userId,
                username: userInfo?.username || `User${userId}`,
                content: params.content,
                votes: [],
                timestamp: new Date().toISOString()
            };
            
            setInsights(prev => [...prev, insight]);
            return insight;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to share insight');
        }
    }, [userId, predictionId, userInfo]);

    // Create poll
    const createPoll = useCallback(async (params: any) => {
        try {
            // For now, create a mock poll since the method might not be implemented
            const poll: any = {
                id: `poll-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                predictionId,
                createdBy: userId,
                title: params.title,
                question: params.question,
                options: params.options.map((opt: any, index: number) => ({
                    id: `opt-${index}-${Math.random().toString(36).substring(2, 6)}`,
                    ...opt
                })),
                type: params.type,
                expiresAt: new Date(Date.now() + params.expiresInHours * 60 * 60 * 1000).toISOString(),
                isAnonymous: params.isAnonymous,
                responses: [],
                status: 'ACTIVE',
                createdAt: new Date().toISOString()
            };
            
            setPolls(prev => [...prev, poll]);
            return poll;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to create poll');
        }
    }, [userId, predictionId]);

    // Vote on insight
    const voteOnInsight = useCallback(async (insightId: string, voteType: 'upvote' | 'downvote') => {
        try {
            const updatedInsights = insights.map(i => {
                if (i.id === insightId) {
                    const existingVoteIndex = i.votes.findIndex(v => v.userId === userId);
                    const newVotes = [...i.votes];
                    
                    if (existingVoteIndex >= 0) {
                        if (newVotes[existingVoteIndex].vote === voteType) {
                            // Remove vote if clicking same type
                            newVotes.splice(existingVoteIndex, 1);
                        } else {
                            // Change vote type
                            newVotes[existingVoteIndex].vote = voteType;
                        }
                    } else {
                        // Add new vote
                        newVotes.push({ userId, vote: voteType });
                    }
                    
                    return { ...i, votes: newVotes };
                }
                return i;
            });
            
            setInsights(updatedInsights);
            
            // Calculate new score
            const insight = updatedInsights.find(i => i.id === insightId);
            const score = insight?.votes.reduce((acc, v) => 
                acc + (v.vote === 'upvote' ? 1 : -1), 0
            ) || 0;
            
            return { success: true, newScore: score };
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to vote on insight');
        }
    }, [userId, insights]);

    // Get community analytics
    const getCommunityAnalytics = useCallback(() => {
        return {
            totalMessages: messages.length,
            averageEngagement: messages.length > 0 ? messages.length / (room?.participants?.length || 1) : 0,
            consensusLevel: calculateConsensusLevel(insights),
            topContributors: getTopContributors(messages, insights)
        };
    }, [messages, insights, room]);

    // Helper function to calculate consensus
    const calculateConsensusLevel = (insights: SharedInsight[]) => {
        if (insights.length === 0) return 0;
        
        const averageConfidence = insights.reduce((acc, i) => 
            acc + (i.confidence || 50), 0
        ) / insights.length;
        
        return Math.round(averageConfidence);
    };

    // Helper function to get top contributors
    const getTopContributors = (messages: CollaborativeMessage[], insights: SharedInsight[]) => {
        const contributions = new Map<string, { username: string; count: number }>();
        
        messages.forEach(m => {
            const existing = contributions.get(m.userId) || { username: m.username, count: 0 };
            contributions.set(m.userId, { ...existing, count: existing.count + 1 });
        });
        
        insights.forEach(i => {
            const existing = contributions.get(i.userId) || { username: i.username, count: 0 };
            contributions.set(i.userId, { ...existing, count: existing.count + 2 }); // Insights worth more
        });
        
        return Array.from(contributions.entries())
            .map(([userId, data]) => ({ userId, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    };

    // React to message
    const reactToMessage = useCallback(async (messageId: string, reaction: 'HELPFUL' | 'NOT_HELPFUL' | 'MISLEADING') => {
        try {
            const reactionMap: Record<string, 'upvote' | 'downvote'> = {
                'HELPFUL': 'upvote',
                'NOT_HELPFUL': 'downvote',
                'MISLEADING': 'downvote'
            };

            const reactionType = reactionMap[reaction];
            
            const updatedMessages = messages.map(m => {
                if (m.id === messageId) {
                    const reactions = m.reactions || [];
                    const existingIndex = reactions.findIndex(r => r.userId === userId);
                    
                    if (existingIndex >= 0) {
                        reactions[existingIndex] = { 
                            emoji: reaction,
                            userId,
                            username: userInfo?.username || `User${userId}`,
                            timestamp: new Date().toISOString()
                        };
                    } else {
                        reactions.push({ 
                            emoji: reaction,
                            userId,
                            username: userInfo?.username || `User${userId}`,
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    return { ...m, reactions };
                }
                return m;
            });
            
            setMessages(updatedMessages);
            return { success: true };
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to react to message');
        }
    }, [userId, messages]);

    // Vote on poll
    const voteOnPoll = useCallback(async (pollId: string, optionId: string) => {
        try {
            const updatedPolls = polls.map((poll: any) => {
                if (poll.id === pollId) {
                    const responses = poll.responses || [];
                    const existingResponseIndex = responses.findIndex((r: any) => r.userId === userId);
                    
                    if (existingResponseIndex >= 0) {
                        // Update existing response
                        responses[existingResponseIndex] = {
                            userId,
                            optionId,
                            timestamp: new Date().toISOString()
                        };
                    } else {
                        // Add new response
                        responses.push({
                            userId,
                            optionId,
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    // Update option vote counts
                    const updatedOptions = poll.options.map((option: any) => {
                        const votes = responses.filter((r: any) => r.optionId === option.id).length;
                        return { ...option, votes };
                    });
                    
                    return {
                        ...poll,
                        responses,
                        options: updatedOptions,
                        totalVotes: responses.length
                    };
                }
                return poll;
            });
            
            setPolls(updatedPolls);
            
            // Calculate results
            const poll = updatedPolls.find((p: any) => p.id === pollId);
            if (poll) {
                const results = poll.options.map((option: any) => ({
                    optionId: option.id,
                    text: option.text,
                    votes: option.votes,
                    percentage: poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0
                }));
                
                return { success: true, results };
            }
            
            return { success: false, error: 'Poll not found' };
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to vote on poll');
        }
    }, [userId, polls]);

    return {
        room,
        messages,
        insights,
        polls,
        isLoading,
        error,
        sendMessage,
        shareInsight,
        createPoll,
        voteOnInsight,
        reactToMessage,
        voteOnPoll,
        getCommunityAnalytics
    };
};

/**
 * Hook for Oracle notifications
 */
export const useOracleNotifications = (userId: string) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // This would connect to a notification service
        // For now, just track locally
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
    }, [notifications]);

    const markAsRead = useCallback((notificationId: string) => {
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll
    };
};