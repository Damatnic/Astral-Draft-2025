// Message Types
export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    recipientId?: string; // For direct messages
    leagueId?: string; // For league-wide messages
    forumTopicId?: string; // For forum messages
    content: string;
    messageType: 'direct' | 'league' | 'forum' | 'trash_talk' | 'trade_discussion';
    timestamp: Date;
    edited: boolean;
    editedAt?: Date;
    reactions: MessageReaction[];
    attachments: MessageAttachment[];
    replyToId?: string;
    isRead: boolean;
    isPinned?: boolean;
    isDeleted: boolean;
}

export interface MessageReaction {
    id: string;
    userId: string;
    userName: string;
    emoji: string;
    timestamp: Date;
}

export interface MessageAttachment {
    id: string;
    type: 'image' | 'file' | 'link' | 'player_card' | 'trade_proposal';
    url: string;
    filename: string;
    size?: number;
    metadata?: Record<string, any>;
}

// Forum Types
export interface ForumTopic {
    id: string;
    leagueId: string;
    title: string;
    description: string;
    creatorId: string;
    creatorName: string;
    createdAt: Date;
    lastActivity: Date;
    lastActivityUser: string;
    messageCount: number;
    isSticky: boolean;
    isLocked: boolean;
    category: ForumCategory;
    tags: string[];
    views: number;
    subscribers: string[]; // User IDs who subscribe to notifications
}

export type ForumCategory = 
    | 'general' 
    | 'trades' 
    | 'waiver_wire' 
    | 'matchup_discussion' 
    | 'strategy' 
    | 'trash_talk' 
    | 'announcements';

// Team Comparison Types
export interface TeamComparison {
    id: string;
    leagueId: string;
    creatorId: string;
    team1Id: string;
    team2Id: string;
    team1Name: string;
    team2Name: string;
    week?: number; // For specific week comparison
    comparisonType: 'head_to_head' | 'season_long' | 'playoff_projection' | 'trade_impact';
    metrics: ComparisonMetric[];
    comments: ComparisonComment[];
    createdAt: Date;
    sharedWith: string[]; // User IDs who can view this comparison
    isPublic: boolean;
}

export interface ComparisonMetric {
    category: string;
    team1Value: number;
    team2Value: number;
    advantage: 'team1' | 'team2' | 'tie';
    weightedScore: number;
    description: string;
}

export interface ComparisonComment {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: Date;
    likes: number;
    likedBy: string[];
}

// Trash Talk & Rivalry Types
export interface TrashTalkPost {
    id: string;
    leagueId: string;
    authorId: string;
    authorName: string;
    targetId?: string; // Specific user being targeted
    targetName?: string;
    content: string;
    gif?: string;
    meme?: string;
    timestamp: Date;
    likes: number;
    dislikes: number;
    replies: TrashTalkReply[];
    tags: string[];
    context: 'matchup' | 'trade' | 'waiver' | 'general' | 'playoff';
    severity: 'friendly' | 'competitive' | 'heated';
    isReported: boolean;
    reportCount: number;
}

export interface TrashTalkReply {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    timestamp: Date;
    likes: number;
    parentId?: string; // For nested replies
}

// Rivalry System
export interface Rivalry {
    id: string;
    leagueId: string;
    user1Id: string;
    user2Id: string;
    user1Name: string;
    user2Name: string;
    rivalryScore: number;
    headToHeadRecord: {
        user1Wins: number;
        user2Wins: number;
        ties: number;
    };
    trashTalkCount: number;
    lastInteraction: Date;
    rivalryLevel: 'mild' | 'moderate' | 'intense' | 'legendary';
    seasonRecord: Record<string, any>;
    createdAt: Date;
}

// Community Activity Types
export interface CommunityActivity {
    id: string;
    userId: string;
    userName: string;
    leagueId: string;
    activityType: 'message' | 'forum_post' | 'trash_talk' | 'team_comparison' | 'trade_comment' | 'reaction';
    description: string;
    timestamp: Date;
    relatedEntityId?: string;
    relatedEntityType?: string;
    points: number; // Engagement points
    visibility: 'public' | 'league' | 'private';
}

// User Social Profile
export interface UserSocialProfile {
    userId: string;
    username: string;
    avatar?: string;
    bio?: string;
    favoriteTeam?: string;
    joinDate: Date;
    totalMessages: number;
    totalForumPosts: number;
    totalTrashTalks: number;
    engagementPoints: number;
    reputation: number;
    badges: SocialBadge[];
    socialStats: SocialStats;
    preferences: SocialPreferences;
}

export interface SocialBadge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    earnedAt: Date;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface SocialStats {
    messagesPerWeek: number;
    averageResponseTime: number; // In minutes
    mostActiveHours: number[]; // Hours of day (0-23)
    topTrashTalkTargets: Array<{ userId: string; userName: string; count: number }>;
    favoriteTopics: Array<{ topic: string; count: number }>;
    rivalries: Rivalry[];
}

export interface SocialPreferences {
    allowDirectMessages: boolean;
    allowTrashTalk: boolean;
    notifyOnMention: boolean;
    notifyOnReply: boolean;
    notifyOnTradeComment: boolean;
    autoSubscribeToTopics: boolean;
    profanityFilter: boolean;
    blockList: string[]; // User IDs
    mutedTopics: string[];
}

// Social Interaction Service
export class SocialInteractionService {
    private readonly messages: Map<string, Message> = new Map();
    private readonly forumTopics: Map<string, ForumTopic> = new Map();
    private readonly teamComparisons: Map<string, TeamComparison> = new Map();
    private readonly trashTalkPosts: Map<string, TrashTalkPost> = new Map();
    private readonly rivalries: Map<string, Rivalry> = new Map();
    private readonly userProfiles: Map<string, UserSocialProfile> = new Map();
    private readonly communityActivities: Map<string, CommunityActivity> = new Map();

    constructor() {
        this.initializeSampleData();
    }

    // Message Management
    async sendMessage(
        senderId: string,
        senderName: string,
        content: string,
        messageType: Message['messageType'],
        options: {
            recipientId?: string;
            leagueId?: string;
            forumTopicId?: string;
            replyToId?: string;
            attachments?: MessageAttachment[];
        } = {}
    ): Promise<Message> {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        const message: Message = {
            id: messageId,
            senderId,
            senderName,
            recipientId: options.recipientId,
            leagueId: options.leagueId,
            forumTopicId: options.forumTopicId,
            content,
            messageType,
            timestamp: new Date(),
            edited: false,
            reactions: [],
            attachments: options.attachments || [],
            replyToId: options.replyToId,
            isRead: false,
            isDeleted: false
        };

        this.messages.set(messageId, message);

        // Update forum topic if applicable
        if (options.forumTopicId) {
            const topic = this.forumTopics.get(options.forumTopicId);
            if (topic) {
                topic.messageCount++;
                topic.lastActivity = new Date();
                topic.lastActivityUser = senderName;
                this.forumTopics.set(options.forumTopicId, topic);
            }
        }

        // Record activity
        await this.recordActivity(senderId, senderName, options.leagueId || '', 'message', `Sent a ${messageType} message`);

        return message;
    }

    async getMessages(filters: {
        userId?: string;
        leagueId?: string;
        forumTopicId?: string;
        messageType?: Message['messageType'];
        since?: Date;
        limit?: number;
    }): Promise<Message[]> {
        let messages = Array.from(this.messages.values());

        // Apply filters
        if (filters.userId) {
            messages = messages.filter(m => 
                m.senderId === filters.userId || 
                m.recipientId === filters.userId
            );
        }
        if (filters.leagueId) {
            messages = messages.filter(m => m.leagueId === filters.leagueId);
        }
        if (filters.forumTopicId) {
            messages = messages.filter(m => m.forumTopicId === filters.forumTopicId);
        }
        if (filters.messageType) {
            messages = messages.filter(m => m.messageType === filters.messageType);
        }
        if (filters.since) {
            messages = messages.filter(m => m.timestamp >= filters.since!);
        }

        // Sort by timestamp (newest first)
        messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Apply limit
        if (filters.limit) {
            messages = messages.slice(0, filters.limit);
        }

        return messages;
    }

    async addMessageReaction(messageId: string, userId: string, userName: string, emoji: string): Promise<Message> {
        const message = this.messages.get(messageId);
        if (!message) throw new Error('Message not found');

        // Remove existing reaction from this user
        message.reactions = message.reactions.filter(r => r.userId !== userId);

        // Add new reaction
        const reaction: MessageReaction = {
            id: `reaction_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId,
            userName,
            emoji,
            timestamp: new Date()
        };

        message.reactions.push(reaction);
        this.messages.set(messageId, message);

        return message;
    }

    // Forum Management
    async createForumTopic(
        leagueId: string,
        creatorId: string,
        creatorName: string,
        title: string,
        description: string,
        category: ForumCategory,
        tags: string[] = []
    ): Promise<ForumTopic> {
        const topicId = `topic_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const topic: ForumTopic = {
            id: topicId,
            leagueId,
            title,
            description,
            creatorId,
            creatorName,
            createdAt: new Date(),
            lastActivity: new Date(),
            lastActivityUser: creatorName,
            messageCount: 0,
            isSticky: false,
            isLocked: false,
            category,
            tags,
            views: 0,
            subscribers: [creatorId]
        };

        this.forumTopics.set(topicId, topic);

        // Record activity
        await this.recordActivity(creatorId, creatorName, leagueId, 'forum_post', `Created forum topic: ${title}`);

        return topic;
    }

    async getForumTopics(leagueId: string, category?: ForumCategory): Promise<ForumTopic[]> {
        let topics = Array.from(this.forumTopics.values());

        topics = topics.filter(t => t.leagueId === leagueId);
        
        if (category) {
            topics = topics.filter(t => t.category === category);
        }

        // Sort by sticky first, then by last activity
        topics.sort((a, b) => {
            if (a.isSticky && !b.isSticky) return -1;
            if (!a.isSticky && b.isSticky) return 1;
            return b.lastActivity.getTime() - a.lastActivity.getTime();
        });

        return topics;
    }

    // Team Comparison
    async createTeamComparison(
        comparisonData: {
            leagueId: string;
            creatorId: string;
            team1Id: string;
            team2Id: string;
            team1Name: string;
            team2Name: string;
            comparisonType: TeamComparison['comparisonType'];
            metrics: ComparisonMetric[];
            isPublic?: boolean;
        }
    ): Promise<TeamComparison> {
        const comparisonId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const comparison: TeamComparison = {
            id: comparisonId,
            ...comparisonData,
            isPublic: comparisonData.isPublic ?? true,
            comments: [],
            createdAt: new Date(),
            sharedWith: []
        };

        this.teamComparisons.set(comparisonId, comparison);

        // Record activity
        await this.recordActivity(
            comparisonData.creatorId, 
            '', 
            comparisonData.leagueId, 
            'team_comparison', 
            `Created team comparison: ${comparisonData.team1Name} vs ${comparisonData.team2Name}`
        );

        return comparison;
    }

    async addComparisonComment(
        comparisonId: string,
        userId: string,
        userName: string,
        content: string
    ): Promise<TeamComparison> {
        const comparison = this.teamComparisons.get(comparisonId);
        if (!comparison) throw new Error('Comparison not found');

        const comment: ComparisonComment = {
            id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId,
            userName,
            content,
            timestamp: new Date(),
            likes: 0,
            likedBy: []
        };

        comparison.comments.push(comment);
        this.teamComparisons.set(comparisonId, comparison);

        return comparison;
    }

    // Trash Talk System
    async postTrashTalk(
        leagueId: string,
        authorId: string,
        authorName: string,
        content: string,
        options: {
            targetId?: string;
            targetName?: string;
            gif?: string;
            meme?: string;
            context?: TrashTalkPost['context'];
            severity?: TrashTalkPost['severity'];
            tags?: string[];
        } = {}
    ): Promise<TrashTalkPost> {
        const postId = `trash_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const trashTalk: TrashTalkPost = {
            id: postId,
            leagueId,
            authorId,
            authorName,
            targetId: options.targetId,
            targetName: options.targetName,
            content,
            gif: options.gif,
            meme: options.meme,
            timestamp: new Date(),
            likes: 0,
            dislikes: 0,
            replies: [],
            tags: options.tags || [],
            context: options.context || 'general',
            severity: options.severity || 'friendly',
            isReported: false,
            reportCount: 0
        };

        this.trashTalkPosts.set(postId, trashTalk);

        // Update rivalry if targeting someone
        if (options.targetId && options.targetId !== authorId) {
            await this.updateRivalry(leagueId, authorId, options.targetId, authorName, options.targetName || '');
        }

        // Record activity
        await this.recordActivity(authorId, authorName, leagueId, 'trash_talk', 'Posted trash talk');

        return trashTalk;
    }

    async getTrashTalkPosts(leagueId: string, limit: number = 50): Promise<TrashTalkPost[]> {
        let posts = Array.from(this.trashTalkPosts.values());
        
        posts = posts.filter(p => p.leagueId === leagueId && !p.isReported);
        posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        return posts.slice(0, limit);
    }

    // Rivalry Management
    private async updateRivalry(
        leagueId: string,
        user1Id: string,
        user2Id: string,
        user1Name: string,
        user2Name: string
    ): Promise<void> {
        const rivalryKey = [user1Id, user2Id].sort((a, b) => a.localeCompare(b)).join('_');
        let rivalry = this.rivalries.get(rivalryKey);

        if (!rivalry) {
            rivalry = {
                id: rivalryKey,
                leagueId,
                user1Id: user1Id < user2Id ? user1Id : user2Id,
                user2Id: user1Id < user2Id ? user2Id : user1Id,
                user1Name: user1Id < user2Id ? user1Name : user2Name,
                user2Name: user1Id < user2Id ? user2Name : user1Name,
                rivalryScore: 0,
                headToHeadRecord: { user1Wins: 0, user2Wins: 0, ties: 0 },
                trashTalkCount: 0,
                lastInteraction: new Date(),
                rivalryLevel: 'mild',
                seasonRecord: {},
                createdAt: new Date()
            };
        }

        rivalry.trashTalkCount++;
        rivalry.rivalryScore += 5; // Base points for trash talk
        rivalry.lastInteraction = new Date();

        // Update rivalry level based on score
        if (rivalry.rivalryScore >= 100) rivalry.rivalryLevel = 'legendary';
        else if (rivalry.rivalryScore >= 50) rivalry.rivalryLevel = 'intense';
        else if (rivalry.rivalryScore >= 20) rivalry.rivalryLevel = 'moderate';

        this.rivalries.set(rivalryKey, rivalry);
    }

    async getRivalries(leagueId: string): Promise<Rivalry[]> {
        return Array.from(this.rivalries.values())
            .filter(r => r.leagueId === leagueId)
            .sort((a, b) => b.rivalryScore - a.rivalryScore);
    }

    // User Profile Management
    async getUserSocialProfile(userId: string): Promise<UserSocialProfile | null> {
        return this.userProfiles.get(userId) || null;
    }

    async updateUserSocialProfile(userId: string, updates: Partial<UserSocialProfile>): Promise<UserSocialProfile> {
        const existing = this.userProfiles.get(userId);
        
        const profile: UserSocialProfile = {
            ...existing,
            ...updates,
            userId
        } as UserSocialProfile;

        this.userProfiles.set(userId, profile);
        return profile;
    }

    // Community Activity Tracking
    private async recordActivity(
        userId: string,
        userName: string,
        leagueId: string,
        activityType: CommunityActivity['activityType'],
        description: string,
        points: number = 1
    ): Promise<void> {
        const activityId = `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const activity: CommunityActivity = {
            id: activityId,
            userId,
            userName,
            leagueId,
            activityType,
            description,
            timestamp: new Date(),
            points,
            visibility: 'league'
        };

        this.communityActivities.set(activityId, activity);

        // Update user profile stats
        const profile = this.userProfiles.get(userId);
        if (profile) {
            profile.engagementPoints += points;
            if (activityType === 'message') profile.totalMessages++;
            if (activityType === 'forum_post') profile.totalForumPosts++;
            if (activityType === 'trash_talk') profile.totalTrashTalks++;
            
            this.userProfiles.set(userId, profile);
        }
    }

    async getCommunityActivity(leagueId: string, limit: number = 100): Promise<CommunityActivity[]> {
        let activities = Array.from(this.communityActivities.values());
        
        activities = activities.filter(a => a.leagueId === leagueId);
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        return activities.slice(0, limit);
    }

    // Initialize sample data
    private initializeSampleData(): void {
        // Create sample forum topics
        this.createForumTopic(
            'league_1',
            'user_1',
            'Commissioner Mike',
            'Welcome to the 2024 Season!',
            'Looking forward to another great year of fantasy football. Good luck everyone!',
            'announcements',
            ['welcome', '2024', 'season']
        );

        // Create sample user profiles
        const sampleProfile: UserSocialProfile = {
            userId: 'user_1',
            username: 'FantasyPro',
            avatar: '/avatars/user1.jpg',
            bio: 'Fantasy football enthusiast since 2010',
            favoriteTeam: 'Chiefs',
            joinDate: new Date('2020-01-01'),
            totalMessages: 156,
            totalForumPosts: 34,
            totalTrashTalks: 12,
            engagementPoints: 450,
            reputation: 85,
            badges: [{
                id: 'veteran',
                name: 'Veteran Player',
                description: 'Active for 3+ seasons',
                icon: '🏆',
                color: 'gold',
                earnedAt: new Date('2023-01-01'),
                rarity: 'rare'
            }],
            socialStats: {
                messagesPerWeek: 12,
                averageResponseTime: 45,
                mostActiveHours: [19, 20, 21],
                topTrashTalkTargets: [],
                favoriteTopics: [
                    { topic: 'trades', count: 25 },
                    { topic: 'waiver_wire', count: 18 }
                ],
                rivalries: []
            },
            preferences: {
                allowDirectMessages: true,
                allowTrashTalk: true,
                notifyOnMention: true,
                notifyOnReply: true,
                notifyOnTradeComment: true,
                autoSubscribeToTopics: false,
                profanityFilter: false,
                blockList: [],
                mutedTopics: []
            }
        };

        this.userProfiles.set('user_1', sampleProfile);
    }
}

// Export singleton instance
export const socialInteractionService = new SocialInteractionService();
