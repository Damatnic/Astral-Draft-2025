/**
 * Oracle Collaborative Interaction Service
 * Handles collaborative features for Oracle predictions including group discussions, shared insights, and community interactions
 */

import { EventEmitter } from 'events';
import { oracleRealTimeService } from './oracleRealTimeService';
// @ts-ignore - backend module
import { getRow } from '../backend/db/index';

export interface CollaborativeMessage {
    id: string;
    type: 'DISCUSSION' | 'INSIGHT' | 'QUESTION' | 'ANALYSIS' | 'PREDICTION_SHARE' | 'EMOJI_REACTION';
    userId: string;
    username: string;
    predictionId: string;
    content: string;
    timestamp: string;
    reactions?: MessageReaction[];
    mentions?: string[];
    attachments?: MessageAttachment[];
    isEdited: boolean;
    editedAt?: string;
}

export interface MessageReaction {
    emoji: string;
    userId: string;
    username: string;
    timestamp: string;
}

export interface MessageAttachment {
    type: 'IMAGE' | 'CHART' | 'LINK' | 'DATA';
    url: string;
    title?: string;
    description?: string;
    metadata?: any;
}

export interface SharedInsight {
    id: string;
    predictionId: string;
    userId: string;
    username: string;
    title: string;
    content: string;
    type: 'STATISTICAL_ANALYSIS' | 'TREND_OBSERVATION' | 'EXPERT_OPINION' | 'DATA_POINT' | 'PREDICTION_STRATEGY';
    confidence: number;
    supportingData?: any[];
    tags: string[];
    votes: InsightVote[];
    timestamp: string;
    isVerified: boolean;
    verifiedBy?: string;
}

export interface InsightVote {
    userId: string;
    username: string;
    vote: 'HELPFUL' | 'NOT_HELPFUL' | 'MISLEADING';
    timestamp: string;
    comment?: string;
}

export interface CollaborativeRoom {
    id: string;
    predictionId: string;
    week: number;
    title: string;
    description: string;
    participants: CollaborativeParticipant[];
    messages: CollaborativeMessage[];
    sharedInsights: SharedInsight[];
    polls: CommunityPoll[];
    createdAt: string;
    status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
    moderators: string[];
    settings: RoomSettings;
    analytics: RoomAnalytics;
}

export interface CollaborativeParticipant {
    userId: string;
    username: string;
    avatar?: string;
    joinedAt: string;
    lastActive: string;
    role: 'PARTICIPANT' | 'MODERATOR' | 'EXPERT';
    contributionScore: number;
    isOnline: boolean;
    currentlyTyping: boolean;
    permissions: ParticipantPermissions;
}

export interface ParticipantPermissions {
    canMessage: boolean;
    canShareInsights: boolean;
    canCreatePolls: boolean;
    canModerate: boolean;
    canInviteOthers: boolean;
}

export interface RoomSettings {
    isPublic: boolean;
    allowAnonymous: boolean;
    moderationLevel: 'NONE' | 'LIGHT' | 'STRICT';
    messageRetention: number; // days
    insightVotingEnabled: boolean;
    pollsEnabled: boolean;
    maxParticipants: number;
}

export interface RoomAnalytics {
    totalMessages: number;
    totalInsights: number;
    totalPolls: number;
    engagementScore: number;
    consensusLevel: number;
    averageParticipationTime: number;
    topContributors: string[];
    mostDiscussedTopics: string[];
    lastUpdated: string;
}

export interface CommunityPoll {
    id: string;
    predictionId: string;
    createdBy: string;
    title: string;
    question: string;
    options: PollOption[];
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RANKING' | 'CONFIDENCE_RANGE';
    expiresAt: string;
    isAnonymous: boolean;
    responses: PollResponse[];
    results?: PollResults;
    status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
    createdAt: string;
}

export interface PollOption {
    id: string;
    text: string;
    description?: string;
    color?: string;
}

export interface PollResponse {
    userId: string;
    username?: string;
    choices: string[]; // option IDs
    confidence?: number;
    timestamp: string;
    isAnonymous: boolean;
}

export interface PollResults {
    totalResponses: number;
    optionResults: Map<string, PollOptionResult>;
    demographics?: any;
    confidence?: {
        average: number;
        distribution: number[];
    };
    completedAt: string;
}

export interface PollOptionResult {
    optionId: string;
    votes: number;
    percentage: number;
    confidence?: number;
}

export interface TypingIndicator {
    userId: string;
    username: string;
    predictionId: string;
    timestamp: string;
    isTyping: boolean;
}

export interface MentionNotification {
    id: string;
    messageId: string;
    predictionId: string;
    mentionedUserId: string;
    mentionedByUserId: string;
    mentionedByUsername: string;
    content: string;
    timestamp: string;
    isRead: boolean;
}

export interface InsightCreationParams {
    title: string;
    content: string;
    type: SharedInsight['type'];
    confidence: number;
    supportingData?: any[];
    tags?: string[];
}

export interface PollCreationParams {
    title: string;
    question: string;
    options: Omit<PollOption, 'id'>[];
    type: CommunityPoll['type'];
    expiresInHours: number;
    isAnonymous: boolean;
}

class OracleCollaborativeService extends EventEmitter {
    private readonly collaborativeRooms: Map<string, CollaborativeRoom> = new Map();
    private readonly activeParticipants: Map<string, Set<string>> = new Map(); // predictionId -> userIds
    private readonly typingIndicators: Map<string, TypingIndicator[]> = new Map(); // predictionId -> indicators
    private readonly messageHistory: Map<string, CollaborativeMessage[]> = new Map(); // predictionId -> messages
    private readonly sharedInsights: Map<string, SharedInsight[]> = new Map(); // predictionId -> insights
    private readonly communityPolls: Map<string, CommunityPoll[]> = new Map(); // predictionId -> polls
    private mentionNotifications: MentionNotification[] = [];

    // Real-time features
    private readonly typingTimeout = 3000; // 3 seconds
    private readonly typingTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly insightUpdateInterval = 5000; // 5 seconds
    private readonly participantUpdateInterval = 10000; // 10 seconds

    constructor() {
        super();
        this.setupEventHandlers();
        this.startBackgroundProcesses();
        console.log('🤝 Oracle Collaborative Service initialized');
    }

    /**
     * Create or join a collaborative room for a prediction
     */
    async joinCollaborativeRoom(userId: string, predictionId: string, userInfo: any): Promise<CollaborativeRoom> {
        let room = this.collaborativeRooms.get(predictionId);

        if (!room) {
            // Create new room
            room = await this.createCollaborativeRoom(predictionId, userId, userInfo);
        } else {
            // Add participant to existing room
            await this.addParticipantToRoom(room, userId, userInfo);
        }

        // Register user with real-time service
        await oracleRealTimeService.subscribeToPrediction(userId, predictionId);

        // Notify others of new participant
        await this.broadcastRoomUpdate(predictionId, {
            type: 'PARTICIPANT_JOINED',
            userId,
            username: userInfo.username,
            timestamp: new Date().toISOString()
        });

        return room;
    }

    /**
     * Create a new collaborative room
     */
    private async createCollaborativeRoom(
        predictionId: string,
        creatorId: string,
        creatorInfo: any
    ): Promise<CollaborativeRoom> {
        const room: CollaborativeRoom = {
            id: `room-${predictionId}`,
            predictionId,
            week: await this.getPredictionWeek(predictionId),
            title: `Discussion: ${await this.getPredictionTitle(predictionId)}`,
            description: 'Collaborative discussion and analysis for this Oracle prediction',
            participants: [],
            messages: [],
            sharedInsights: [],
            polls: [],
            createdAt: new Date().toISOString(),
            status: 'ACTIVE',
            moderators: [creatorId],
            settings: {
                isPublic: true,
                allowAnonymous: false,
                moderationLevel: 'LIGHT',
                messageRetention: 30,
                insightVotingEnabled: true,
                pollsEnabled: true,
                maxParticipants: 100
            },
            analytics: {
                totalMessages: 0,
                totalInsights: 0,
                totalPolls: 0,
                engagementScore: 0,
                consensusLevel: 0,
                averageParticipationTime: 0,
                topContributors: [],
                mostDiscussedTopics: [],
                lastUpdated: new Date().toISOString()
            }
        };

        // Add creator as first participant
        await this.addParticipantToRoom(room, creatorId, creatorInfo);

        this.collaborativeRooms.set(predictionId, room);
        
        console.log(`🏠 Created collaborative room for prediction ${predictionId}`);
        return room;
    }

    /**
     * Add participant to room
     */
    private async addParticipantToRoom(
        room: CollaborativeRoom,
        userId: string,
        userInfo: any
    ): Promise<void> {
        // Check if user already in room
        const existingParticipant = room.participants.find(p => p.userId === userId);
        if (existingParticipant) {
            existingParticipant.isOnline = true;
            existingParticipant.lastActive = new Date().toISOString();
            return;
        }

        const participant: CollaborativeParticipant = {
            userId,
            username: userInfo.username || `User${userId}`,
            avatar: userInfo.avatar,
            joinedAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            role: 'PARTICIPANT',
            contributionScore: 0,
            isOnline: true,
            currentlyTyping: false,
            permissions: {
                canMessage: true,
                canShareInsights: true,
                canCreatePolls: true,
                canModerate: false,
                canInviteOthers: false
            }
        };

        room.participants.push(participant);

        // Add to active participants
        if (!this.activeParticipants.has(room.predictionId)) {
            this.activeParticipants.set(room.predictionId, new Set());
        }
        const activeParticipantsSet = this.activeParticipants.get(room.predictionId);
        if (activeParticipantsSet) {
            activeParticipantsSet.add(userId);
        }

        this.updateRoomAnalytics(room);
    }

    /**
     * Send message to collaborative room
     */
    async sendMessage(
        userId: string,
        predictionId: string,
        content: string,
        type: CollaborativeMessage['type'] = 'DISCUSSION',
        mentions?: string[],
        attachments?: MessageAttachment[]
    ): Promise<CollaborativeMessage> {
        const room = this.collaborativeRooms.get(predictionId);
        if (!room) {
            throw new Error('Collaborative room not found');
        }

        const participant = room.participants.find(p => p.userId === userId);
        if (!participant?.permissions?.canMessage) {
            throw new Error('User not authorized to send messages');
        }

        const message: CollaborativeMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type,
            userId,
            username: participant.username,
            predictionId,
            content,
            timestamp: new Date().toISOString(),
            reactions: [],
            mentions: mentions || [],
            attachments: attachments || [],
            isEdited: false
        };

        // Add to room messages
        room.messages.push(message);
        room.analytics.totalMessages++;

        // Add to message history
        if (!this.messageHistory.has(predictionId)) {
            this.messageHistory.set(predictionId, []);
        }
        const messageHistoryArray = this.messageHistory.get(predictionId);
        if (messageHistoryArray) {
            messageHistoryArray.push(message);
        }

        // Update participant activity
        participant.lastActive = new Date().toISOString();
        participant.contributionScore += this.calculateMessageScore(message);

        // Clear typing indicator
        await this.setTypingIndicator(userId, predictionId, false);

        // Process mentions
        if (mentions && mentions.length > 0) {
            await this.processMentions(message, mentions);
        }

        // Broadcast message to room participants
        await this.broadcastToRoom(predictionId, {
            type: 'NEW_MESSAGE',
            message,
            timestamp: new Date().toISOString()
        });

        this.updateRoomAnalytics(room);

        console.log(`💬 Message sent to room ${predictionId} by ${userId}`);
        return message;
    }

    /**
     * Share insight in collaborative room
     */
    async shareInsight(
        userId: string,
        predictionId: string,
        params: InsightCreationParams
    ): Promise<SharedInsight> {
        const room = this.collaborativeRooms.get(predictionId);
        if (!room) {
            throw new Error('Collaborative room not found');
        }

        const participant = room.participants.find(p => p.userId === userId);
        if (!participant?.permissions?.canShareInsights) {
            throw new Error('User not authorized to share insights');
        }

        const insight: SharedInsight = {
            id: `insight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            predictionId,
            userId,
            username: participant.username,
            title: params.title,
            content: params.content,
            type: params.type,
            confidence: params.confidence,
            supportingData: params.supportingData || [],
            tags: params.tags || [],
            votes: [],
            timestamp: new Date().toISOString(),
            isVerified: false
        };

        // Add to room insights
        room.sharedInsights.push(insight);
        room.analytics.totalInsights++;

        // Add to shared insights history
        if (!this.sharedInsights.has(predictionId)) {
            this.sharedInsights.set(predictionId, []);
        }
        const sharedInsightsArray = this.sharedInsights.get(predictionId);
        if (sharedInsightsArray) {
            sharedInsightsArray.push(insight);
        }

        // Update participant contribution score
        participant.contributionScore += this.calculateInsightScore(insight);

        // Broadcast insight to room participants
        await this.broadcastToRoom(predictionId, {
            type: 'NEW_INSIGHT',
            insight,
            timestamp: new Date().toISOString()
        });

        this.updateRoomAnalytics(room);

        console.log(`💡 Insight shared in room ${predictionId} by ${userId}`);
        return insight;
    }

    /**
     * Vote on shared insight
     */
    async voteOnInsight(
        userId: string,
        predictionId: string,
        insightId: string,
        vote: InsightVote['vote'],
        comment?: string
    ): Promise<void> {
        const insights = this.sharedInsights.get(predictionId);
        if (!insights) return;

        const insight = insights.find(i => i.id === insightId);
        if (!insight) return;

        const room = this.collaborativeRooms.get(predictionId);
        if (!room?.settings?.insightVotingEnabled) return;

        const participant = room.participants.find(p => p.userId === userId);
        if (!participant) return;

        // Remove existing vote if any
        insight.votes = insight.votes.filter(v => v.userId !== userId);

        // Add new vote
        const newVote: InsightVote = {
            userId,
            username: participant.username,
            vote,
            timestamp: new Date().toISOString(),
            comment
        };

        insight.votes.push(newVote);

        // Broadcast vote update
        await this.broadcastToRoom(predictionId, {
            type: 'INSIGHT_VOTED',
            insightId,
            vote: newVote,
            totalVotes: insight.votes.length,
            timestamp: new Date().toISOString()
        });

        console.log(`👍 Vote cast on insight ${insightId} in room ${predictionId}`);
    }

    /**
     * Create community poll
     */
    async createCommunityPoll(
        userId: string,
        predictionId: string,
        params: {
            title: string;
            question: string;
            options: Omit<PollOption, 'id'>[];
            type?: CommunityPoll['type'];
            expiresInHours?: number;
            isAnonymous?: boolean;
        }
    ): Promise<CommunityPoll> {
        const room = this.collaborativeRooms.get(predictionId);
        if (!room) {
            throw new Error('Collaborative room not found');
        }

        const participant = room.participants.find(p => p.userId === userId);
        if (!participant?.permissions?.canCreatePolls) {
            throw new Error('User not authorized to create polls');
        }

        const { title, question, options, type = 'SINGLE_CHOICE', expiresInHours = 24, isAnonymous = false } = params;

        const poll: CommunityPoll = {
            id: `poll-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            predictionId,
            createdBy: userId,
            title,
            question,
            options: options.map((opt, index) => ({
                id: `opt-${index}-${Math.random().toString(36).substring(2, 6)}`,
                ...opt
            })),
            type,
            expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
            isAnonymous,
            responses: [],
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
        };

        // Add to room polls
        room.polls.push(poll);
        room.analytics.totalPolls++;

        // Add to community polls history
        if (!this.communityPolls.has(predictionId)) {
            this.communityPolls.set(predictionId, []);
        }
        const communityPollsArray = this.communityPolls.get(predictionId);
        if (communityPollsArray) {
            communityPollsArray.push(poll);
        }

        // Update participant contribution score
        participant.contributionScore += 5; // Poll creation points

        // Broadcast poll creation
        await this.broadcastToRoom(predictionId, {
            type: 'NEW_POLL',
            poll,
            timestamp: new Date().toISOString()
        });

        // Schedule poll expiration
        setTimeout(() => {
            this.closePoll(predictionId, poll.id);
        }, expiresInHours * 60 * 60 * 1000);

        this.updateRoomAnalytics(room);

        console.log(`📊 Poll created in room ${predictionId} by ${userId}`);
        return poll;
    }

    /**
     * Respond to community poll
     */
    async respondToPoll(
        userId: string,
        predictionId: string,
        pollId: string,
        choices: string[],
        confidence?: number
    ): Promise<void> {
        const polls = this.communityPolls.get(predictionId);
        if (!polls) return;

        const poll = polls.find(p => p.id === pollId);
        if (!poll || poll.status !== 'ACTIVE') return;

        const room = this.collaborativeRooms.get(predictionId);
        if (!room) return;

        const participant = room.participants.find(p => p.userId === userId);
        if (!participant) return;

        // Remove existing response if any
        poll.responses = poll.responses.filter(r => r.userId !== userId);

        // Add new response
        const response: PollResponse = {
            userId,
            username: poll.isAnonymous ? undefined : participant.username,
            choices,
            confidence,
            timestamp: new Date().toISOString(),
            isAnonymous: poll.isAnonymous
        };

        poll.responses.push(response);

        // Broadcast poll update
        await this.broadcastToRoom(predictionId, {
            type: 'POLL_RESPONSE',
            pollId,
            totalResponses: poll.responses.length,
            timestamp: new Date().toISOString()
        });

        console.log(`📊 Poll response submitted by ${userId} for poll ${pollId}`);
    }

    /**
     * Set typing indicator
     */
    async setTypingIndicator(userId: string, predictionId: string, isTyping: boolean): Promise<void> {
        const room = this.collaborativeRooms.get(predictionId);
        if (!room) return;

        const participant = room.participants.find(p => p.userId === userId);
        if (!participant) return;

        participant.currentlyTyping = isTyping;

        // Get current typing indicators for this prediction
        let indicators = this.typingIndicators.get(predictionId) || [];

        if (isTyping) {
            // Add or update typing indicator
            const existingIndex = indicators.findIndex(ind => ind.userId === userId);
            const indicator: TypingIndicator = {
                userId,
                username: participant.username,
                predictionId,
                timestamp: new Date().toISOString(),
                isTyping: true
            };

            if (existingIndex >= 0) {
                indicators[existingIndex] = indicator;
            } else {
                indicators.push(indicator);
            }

            // Clear existing timer and set new one
            const timerKey = `${userId}-${predictionId}`;
            const existingTimer = this.typingTimers.get(timerKey);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            const timer = setTimeout(() => {
                this.setTypingIndicator(userId, predictionId, false);
            }, this.typingTimeout);

            this.typingTimers.set(timerKey, timer);

        } else {
            // Remove typing indicator
            indicators = indicators.filter(ind => ind.userId !== userId);
            
            const timerKey = `${userId}-${predictionId}`;
            const existingTimer = this.typingTimers.get(timerKey);
            if (existingTimer) {
                clearTimeout(existingTimer);
                this.typingTimers.delete(timerKey);
            }
        }

        this.typingIndicators.set(predictionId, indicators);

        // Broadcast typing update to room participants
        await this.broadcastToRoom(predictionId, {
            type: 'TYPING_UPDATE',
            typingUsers: indicators.filter(ind => ind.isTyping),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * React to message
     */
    async reactToMessage(
        userId: string,
        predictionId: string,
        messageId: string,
        emoji: string
    ): Promise<void> {
        const messages = this.messageHistory.get(predictionId);
        if (!messages) return;

        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const room = this.collaborativeRooms.get(predictionId);
        if (!room) return;

        const participant = room.participants.find(p => p.userId === userId);
        if (!participant) return;

        // Initialize reactions array if needed
        if (!message.reactions) {
            message.reactions = [];
        }

        // Remove existing reaction from this user for this emoji
        message.reactions = message.reactions.filter(r => !(r.userId === userId && r.emoji === emoji));

        // Add new reaction
        const reaction: MessageReaction = {
            emoji,
            userId,
            username: participant.username,
            timestamp: new Date().toISOString()
        };

        message.reactions.push(reaction);

        // Broadcast reaction update
        await this.broadcastToRoom(predictionId, {
            type: 'MESSAGE_REACTION',
            messageId,
            reaction,
            timestamp: new Date().toISOString()
        });

        console.log(`😀 Reaction ${emoji} added to message ${messageId} by ${userId}`);
    }

    /**
     * Get collaborative room data
     */
    getCollaborativeRoom(predictionId: string): CollaborativeRoom | undefined {
        return this.collaborativeRooms.get(predictionId);
    }

    /**
     * Get room messages with pagination
     */
    getRoomMessages(predictionId: string, limit: number = 50, before?: string): CollaborativeMessage[] {
        const messages = this.messageHistory.get(predictionId) || [];
        
        let filteredMessages = messages;
        if (before) {
            const beforeIndex = messages.findIndex(m => m.id === before);
            if (beforeIndex > 0) {
                filteredMessages = messages.slice(0, beforeIndex);
            }
        }

        return filteredMessages.slice(-limit);
    }

    /**
     * Get shared insights for prediction
     */
    getSharedInsights(predictionId: string): SharedInsight[] {
        return this.sharedInsights.get(predictionId) || [];
    }

    /**
     * Get community polls for prediction
     */
    getCommunityPolls(predictionId: string): CommunityPoll[] {
        return this.communityPolls.get(predictionId) || [];
    }

    /**
     * Get typing indicators for prediction
     */
    getTypingIndicators(predictionId: string): TypingIndicator[] {
        return this.typingIndicators.get(predictionId) || [];
    }

    /**
     * Close poll and calculate results
     */
    private async closePoll(predictionId: string, pollId: string): Promise<void> {
        const polls = this.communityPolls.get(predictionId);
        if (!polls) return;

        const poll = polls.find(p => p.id === pollId);
        if (!poll || poll.status !== 'ACTIVE') return;

        poll.status = 'CLOSED';

        // Calculate results
        const optionResults = new Map<string, PollOptionResult>();
        const totalResponses = poll.responses.length;

        poll.options.forEach(option => {
            const votes = poll.responses.filter(r => r.choices.includes(option.id)).length;
            const percentage = totalResponses > 0 ? (votes / totalResponses) * 100 : 0;

            optionResults.set(option.id, {
                optionId: option.id,
                votes,
                percentage
            });
        });

        poll.results = {
            totalResponses,
            optionResults,
            completedAt: new Date().toISOString()
        };

        // Broadcast poll closure
        await this.broadcastToRoom(predictionId, {
            type: 'POLL_CLOSED',
            pollId,
            results: poll.results,
            timestamp: new Date().toISOString()
        });

        console.log(`📊 Poll ${pollId} closed with ${totalResponses} responses`);
    }

    /**
     * Broadcast message to all room participants
     */
    private async broadcastToRoom(predictionId: string, data: any): Promise<void> {
        const activeUsers = this.activeParticipants.get(predictionId);
        if (!activeUsers) return;

        // Use real-time service for broadcasting
        this.emit('room_broadcast', {
            predictionId,
            targetUsers: Array.from(activeUsers),
            data
        });
    }

    /**
     * Broadcast room update
     */
    private async broadcastRoomUpdate(predictionId: string, update: any): Promise<void> {
        await this.broadcastToRoom(predictionId, {
            type: 'ROOM_UPDATE',
            update,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Process mentions in message
     */
    private async processMentions(message: CollaborativeMessage, mentions: string[]): Promise<void> {
        for (const mentionedUserId of mentions) {
            const notification: MentionNotification = {
                id: `mention-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                messageId: message.id,
                predictionId: message.predictionId,
                mentionedUserId,
                mentionedByUserId: message.userId,
                mentionedByUsername: message.username,
                content: message.content,
                timestamp: new Date().toISOString(),
                isRead: false
            };

            this.mentionNotifications.push(notification);

            // Send notification through real-time service
            this.emit('mention_notification', notification);
        }
    }

    /**
     * Calculate message contribution score
     */
    private calculateMessageScore(message: CollaborativeMessage): number {
        let score = 1; // Base score

        // Higher score for insights and analysis
        if (message.type === 'INSIGHT' || message.type === 'ANALYSIS') {
            score += 2;
        }

        // Score based on content length (meaningful contributions)
        if (message.content.length > 100) {
            score += 1;
        }

        // Score for attachments
        if (message.attachments && message.attachments.length > 0) {
            score += message.attachments.length;
        }

        return score;
    }

    /**
     * Calculate insight contribution score
     */
    private calculateInsightScore(insight: SharedInsight): number {
        let score = 5; // Base score for sharing insight

        // Score based on confidence
        score += Math.floor(insight.confidence / 20);

        // Score for supporting data
        if (insight.supportingData && insight.supportingData.length > 0) {
            score += insight.supportingData.length * 2;
        }

        // Score for tags
        score += insight.tags.length;

        return score;
    }

    /**
     * Update room analytics
     */
    private updateRoomAnalytics(room: CollaborativeRoom): void {
        const now = new Date().toISOString();
        
        // Calculate engagement score
        const activeParticipants = room.participants.filter(p => p.isOnline).length;
        const totalParticipants = room.participants.length;
        room.analytics.engagementScore = totalParticipants > 0 
            ? (activeParticipants / totalParticipants) * 100 
            : 0;

        // Update top contributors
        const sortedParticipants = [...room.participants].sort((a, b) => b.contributionScore - a.contributionScore);
        room.analytics.topContributors = sortedParticipants
            .slice(0, 5)
            .map(p => p.username);

        room.analytics.lastUpdated = now;
    }

    /**
     * Setup event handlers
     */
    private setupEventHandlers(): void {
        // Handle real-time service events
        this.on('room_broadcast', this.handleRoomBroadcast.bind(this));
        this.on('mention_notification', this.handleMentionNotification.bind(this));

        console.log('🔄 Collaborative service event handlers configured');
    }

    /**
     * Start background processes
     */
    private startBackgroundProcesses(): void {
        // Update participant activity status
        setInterval(() => {
            this.updateParticipantActivity();
        }, this.participantUpdateInterval);

        // Process insight ranking updates
        setInterval(() => {
            this.processInsightRankings();
        }, this.insightUpdateInterval);

        // Clean up old data
        setInterval(() => {
            this.cleanupOldData();
        }, 60000 * 60); // Every hour

        console.log('🔄 Collaborative background processes started');
    }

    /**
     * Update participant activity status
     */
    private updateParticipantActivity(): void {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

        this.collaborativeRooms.forEach(room => {
            room.participants.forEach(participant => {
                const lastActiveTime = new Date(participant.lastActive).getTime();
                if (participant.isOnline && lastActiveTime < fiveMinutesAgo) {
                    participant.isOnline = false;
                    participant.currentlyTyping = false;
                }
            });

            this.updateRoomAnalytics(room);
        });
    }

    /**
     * Process insight rankings based on votes
     */
    private processInsightRankings(): void {
        this.sharedInsights.forEach(insights => {
            insights.forEach(insight => {
                // Calculate helpful vs not helpful ratio
                const helpfulVotes = insight.votes.filter(v => v.vote === 'HELPFUL').length;
                const totalVotes = insight.votes.length;
                
                // Verify insights with high helpful ratio
                if (totalVotes >= 3 && (helpfulVotes / totalVotes) >= 0.8) {
                    insight.isVerified = true;
                }
            });
        });
    }

    /**
     * Cleanup old data
     */
    private cleanupOldData(): void {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        // Clean up old mention notifications
        this.mentionNotifications = this.mentionNotifications.filter(notif => 
            new Date(notif.timestamp).getTime() > thirtyDaysAgo
        );

        // Clean up old typing indicators
        this.typingIndicators.forEach((indicators, predictionId) => {
            const activeIndicators = indicators.filter(ind => 
                new Date(ind.timestamp).getTime() > (Date.now() - this.typingTimeout)
            );
            this.typingIndicators.set(predictionId, activeIndicators);
        });
    }

    // Event handlers
    private handleRoomBroadcast(data: any): void {
        // Handle room broadcast through real-time service
        console.log('📢 Broadcasting to room:', data.predictionId);
    }

    private handleMentionNotification(notification: MentionNotification): void {
        // Handle mention notification delivery
        console.log('📢 Mention notification:', notification.mentionedUserId);
    }

    // Helper methods to get prediction data from database
    private async getPredictionWeek(predictionId: string): Promise<number> {
        try {
            const result = await getRow(`
                SELECT week FROM oracle_predictions WHERE id = ?
            `, [predictionId]);
            
            return result ? Number(result.week) : 1;
        } catch (error) {
            console.error('Error getting prediction week:', error);
            return 1;
        }
    }

    private async getPredictionTitle(predictionId: string): Promise<string> {
        try {
            const result = await getRow(`
                SELECT question FROM oracle_predictions WHERE id = ?
            `, [predictionId]);
            
            return result ? result.question : `Prediction ${predictionId}`;
        } catch (error) {
            console.error('Error getting prediction title:', error);
            return `Prediction ${predictionId}`;
        }
    }
}

// Create and export singleton instance
export const oracleCollaborativeService = new OracleCollaborativeService();
export default oracleCollaborativeService;
