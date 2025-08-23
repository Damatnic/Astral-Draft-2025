import { EventEmitter } from 'events';

// Basic interfaces for collaborative service
export interface CollaborativeMessage {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: string;
    predictionId: string;
    mentions?: string[];
    type?: string;
    reactions?: Array<{
        emoji: string;
        userId: string;
        username: string;
        timestamp: string;
    }>;
}

export interface CollaborativeRoom {
    id: string;
    predictionId: string;
    participants: Array<{
        userId: string;
        username: string;
        isOnline: boolean;
        joinedAt: string;
    }>;
    settings: {
        messageLimit: number;
        moderationEnabled: boolean;
    };
    analytics?: {
        totalMessages: number;
        averageEngagement: number;
        consensusLevel: number;
        topContributors: Array<{
            userId: string;
            username: string;
            messageCount: number;
        }>;
    };
    messages?: CollaborativeMessage[];
    sharedInsights?: SharedInsight[];
    polls?: CommunityPoll[];
}

export interface SharedInsight {
    id: string;
    userId: string;
    username: string;
    content: string;
    predictionId: string;
    votes: Array<{
        userId: string;
        vote: 'upvote' | 'downvote';
    }>;
    timestamp: string;
    confidence?: number;
    title?: string;
    type?: string;
}

export interface CommunityPoll {
    id: string;
    question: string;
    title?: string;
    options: Array<{
        id: string;
        text: string;
        votes: number;
    }>;
    responses?: Array<{
        userId: string;
        optionId: string;
        timestamp: string;
    }>;
    totalVotes: number;
    createdBy: string;
    predictionId: string;
    endTime: string;
    expiresAt?: string;
    isActive: boolean;
}

// Mock collaborative service for testing
class OracleCollaborativeServiceMock extends EventEmitter {
    private readonly rooms = new Map<string, CollaborativeRoom>();
    private readonly messages = new Map<string, CollaborativeMessage[]>();
    private readonly insights = new Map<string, SharedInsight[]>();

    async createRoom(predictionId: string, userId: string): Promise<CollaborativeRoom> {
        const room: CollaborativeRoom = {
            id: `room-${predictionId}`,
            predictionId,
            participants: [{
                userId,
                username: `User${userId}`,
                isOnline: true,
                joinedAt: new Date().toISOString()
            }],
            settings: {
                messageLimit: 100,
                moderationEnabled: false
            }
        };

        this.rooms.set(predictionId, room);
        this.messages.set(predictionId, []);
        this.insights.set(predictionId, []);

        return room;
    }

    async joinRoom(predictionId: string, userId: string): Promise<void> {
        const room = this.rooms.get(predictionId);
        if (!room) return;

        const existingParticipant = room.participants.find(p => p.userId === userId);
        if (!existingParticipant) {
            room.participants.push({
                userId,
                username: `User${userId}`,
                isOnline: true,
                joinedAt: new Date().toISOString()
            });
        } else {
            existingParticipant.isOnline = true;
        }
    }

    async leaveRoom(predictionId: string, userId: string): Promise<void> {
        const room = this.rooms.get(predictionId);
        if (!room) return;

        const participant = room.participants.find(p => p.userId === userId);
        if (participant) {
            participant.isOnline = false;
        }
    }

    async joinCollaborativeRoom(predictionId: string, userId: string): Promise<CollaborativeRoom> {
        // First create room if it doesn't exist
        let room = this.rooms.get(predictionId);
        if (!room) {
            room = await this.createRoom(predictionId, userId);
        } else {
            // Join existing room
            await this.joinRoom(predictionId, userId);
        }
        return room;
    }

    async sendMessage(
        userId: string,
        predictionId: string,
        content: string,
        mentions?: string[]
    ): Promise<CollaborativeMessage> {
        const message: CollaborativeMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            userId,
            username: `User${userId}`,
            content,
            timestamp: new Date().toISOString(),
            predictionId,
            mentions
        };

        const messages = this.messages.get(predictionId) || [];
        messages.push(message);
        this.messages.set(predictionId, messages);

        // Emit message event for real-time updates
        this.emit('message', message);

        return message;
    }

    async shareInsight(
        userId: string,
        predictionId: string,
        content: string
    ): Promise<SharedInsight> {
        const insight: SharedInsight = {
            id: `insight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            userId,
            username: `User${userId}`,
            content,
            predictionId,
            votes: [],
            timestamp: new Date().toISOString()
        };

        const insights = this.insights.get(predictionId) || [];
        insights.push(insight);
        this.insights.set(predictionId, insights);

        // Emit insight event for real-time updates
        this.emit('insight', insight);

        return insight;
    }

    async voteOnInsight(
        userId: string,
        predictionId: string,
        insightId: string,
        vote: 'upvote' | 'downvote'
    ): Promise<void> {
        const insights = this.insights.get(predictionId);
        if (!insights) return;

        const insight = insights.find(i => i.id === insightId);
        if (!insight) return;

        // Remove existing vote if any
        insight.votes = insight.votes.filter(v => v.userId !== userId);

        // Add new vote
        insight.votes.push({ userId, vote });

        // Emit vote event
        this.emit('insight_vote', { insightId, vote, userId });
    }

    getRoom(predictionId: string): CollaborativeRoom | undefined {
        return this.rooms.get(predictionId);
    }

    getMessages(predictionId: string): CollaborativeMessage[] {
        return this.messages.get(predictionId) || [];
    }

    getInsights(predictionId: string): SharedInsight[] {
        return this.insights.get(predictionId) || [];
    }

    // Simulate connection latency
    async simulateLatency(min: number = 50, max: number = 200): Promise<void> {
        const delay = Math.random() * (max - min) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Get metrics for performance testing
    getMetrics() {
        return {
            totalRooms: this.rooms.size,
            totalMessages: Array.from(this.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
            totalInsights: Array.from(this.insights.values()).reduce((sum, insights) => sum + insights.length, 0),
            activeParticipants: Array.from(this.rooms.values()).reduce(
                (sum, room) => sum + room.participants.filter(p => p.isOnline).length, 
                0
            )
        };
    }

    // Cleanup for testing
    cleanup(): void {
        this.rooms.clear();
        this.messages.clear();
        this.insights.clear();
        this.removeAllListeners();
    }
}

// Create and export singleton instance
export const oracleCollaborativeService = new OracleCollaborativeServiceMock();
export default oracleCollaborativeService;
