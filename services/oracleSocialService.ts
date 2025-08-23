/**
 * Oracle Social Features Service
 * Manages leagues, group predictions, debates, and social interactions for Oracle challenges
 */

export type DebateSide = 'SIDE_A' | 'SIDE_B' | 'NEUTRAL';
export type GroupPredictionType = 'CONSENSUS' | 'MAJORITY_VOTE' | 'WEIGHTED_AVERAGE';

export interface OracleLeague {
    id: string;
    name: string;
    description: string;
    creatorId: string;
    creatorName: string;
    avatar: string;
    isPublic: boolean;
    maxMembers: number;
    currentMembers: number;
    members: LeagueMember[];
    settings: LeagueSettings;
    createdAt: string;
    seasonStartDate: string;
    seasonEndDate: string;
    status: 'ACTIVE' | 'ENDED' | 'PENDING';
    tags: string[];
    joinCode?: string;
}

export interface LeagueMember {
    userId: string;
    username: string;
    avatar: string;
    role: 'CREATOR' | 'ADMIN' | 'MEMBER';
    joinedAt: string;
    stats: LeagueMemberStats;
    isActive: boolean;
    lastActivity: string;
}

export interface LeagueMemberStats {
    totalPoints: number;
    weeklyPoints: number;
    wins: number;
    losses: number;
    winRate: number;
    currentStreak: number;
    longestStreak: number;
    rank: number;
    weeklyRank: number;
    achievements: number;
    badges: number;
}

export interface LeagueSettings {
    challengeFrequency: 'DAILY' | 'WEEKLY' | 'BI_WEEKLY';
    pointsSystem: 'STANDARD' | 'BOOSTED' | 'CUSTOM';
    allowDebates: boolean;
    allowGroupPredictions: boolean;
    autoStartChallenges: boolean;
    minimumParticipants: number;
    enableTrashtalk: boolean;
    moderationLevel: 'OPEN' | 'MODERATED' | 'STRICT';
    customRules: string[];
}

export interface GroupPrediction {
    id: string;
    leagueId: string;
    challengeId: string;
    title: string;
    description: string;
    type: GroupPredictionType;
    status: 'OPEN' | 'CLOSED' | 'COMPLETED';
    createdBy: string;
    createdAt: string;
    closesAt: string;
    participants: GroupPredictionParticipant[];
    result?: {
        prediction: number;
        confidence: number;
        accuracy?: boolean;
        participantCount: number;
    };
    rewards: {
        winnerPoints: number;
        participationPoints: number;
    };
}

export interface GroupPredictionParticipant {
    userId: string;
    username: string;
    avatar: string;
    prediction: number;
    confidence: number;
    reasoning?: string;
    submittedAt: string;
    weight?: number; // For weighted average calculations
}

export interface Debate {
    id: string;
    leagueId: string;
    challengeId?: string;
    title: string;
    topic: string;
    description: string;
    createdBy: string;
    createdAt: string;
    status: 'ACTIVE' | 'CLOSED' | 'RESOLVED';
    participants: DebateParticipant[];
    posts: DebatePost[];
    votes: DebateVote[];
    tags: string[];
    moderatorActions: ModeratorAction[];
    resolution?: {
        winner: 'SIDE_A' | 'SIDE_B' | 'DRAW';
        resolvedBy: string;
        resolvedAt: string;
        reasoning: string;
    };
}

export interface DebateParticipant {
    userId: string;
    username: string;
    avatar: string;
    side: DebateSide;
    joinedAt: string;
    reputation: number;
    badges: string[];
}

export interface DebatePost {
    id: string;
    debateId: string;
    userId: string;
    username: string;
    avatar: string;
    content: string;
    side: DebateSide;
    postedAt: string;
    editedAt?: string;
    reactions: PostReaction[];
    replies: DebateReply[];
    isModerated: boolean;
    isPinned: boolean;
}

export interface DebateReply {
    id: string;
    postId: string;
    userId: string;
    username: string;
    avatar: string;
    content: string;
    postedAt: string;
    reactions: PostReaction[];
}

export interface PostReaction {
    userId: string;
    type: '👍' | '👎' | '🔥' | '💯' | '🤔' | '😂';
    timestamp: string;
}

export interface DebateVote {
    userId: string;
    side: 'SIDE_A' | 'SIDE_B';
    timestamp: string;
    reasoning?: string;
}

export interface ModeratorAction {
    id: string;
    moderatorId: string;
    moderatorName: string;
    action: 'DELETE_POST' | 'EDIT_POST' | 'WARN_USER' | 'TIMEOUT_USER' | 'PIN_POST';
    targetId: string;
    targetType: 'POST' | 'REPLY' | 'USER';
    reason: string;
    timestamp: string;
}

export interface SocialNotification {
    id: string;
    userId: string;
    type: 'LEAGUE_INVITE' | 'GROUP_PREDICTION' | 'DEBATE_MENTION' | 'CHALLENGE_RESULT' | 'LEAGUE_UPDATE';
    title: string;
    message: string;
    data: any;
    isRead: boolean;
    createdAt: string;
    expiresAt?: string;
}

export interface LeagueInvitation {
    id: string;
    leagueId: string;
    leagueName: string;
    fromUserId: string;
    fromUsername: string;
    toUserId: string;
    toUsername: string;
    message?: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
    createdAt: string;
    expiresAt: string;
}

export interface SocialChallenge {
    id: string;
    leagueId: string;
    type: 'HEAD_TO_HEAD' | 'MINI_TOURNAMENT' | 'SPEED_ROUND';
    title: string;
    description: string;
    participants: string[];
    settings: {
        duration: number; // minutes
        questionCount: number;
        difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
        categories: string[];
    };
    status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
    startTime: string;
    endTime: string;
    results?: {
        winner: string;
        scores: Record<string, number>;
        leaderboard: Array<{
            userId: string;
            username: string;
            score: number;
            rank: number;
        }>;
    };
}

class OracleSocialService {
    private readonly LEAGUES_KEY = 'oracleLeagues';
    private readonly USER_LEAGUES_KEY = 'oracleUserLeagues';
    private readonly GROUP_PREDICTIONS_KEY = 'oracleGroupPredictions';
    private readonly DEBATES_KEY = 'oracleDebates';
    private readonly NOTIFICATIONS_KEY = 'oracleSocialNotifications';
    private readonly INVITATIONS_KEY = 'oracleInvitations';

    // League Management
    /**
     * Create a new Oracle league
     */
    async createLeague(
        name: string,
        description: string,
        settings: LeagueSettings,
        isPublic: boolean = true,
        maxMembers: number = 50
    ): Promise<OracleLeague> {
        const league: OracleLeague = {
            id: `league-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            name,
            description,
            creatorId: 'current-user', // Would be actual user ID
            creatorName: 'You',
            avatar: '👤',
            isPublic,
            maxMembers,
            currentMembers: 1,
            members: [{
                userId: 'current-user',
                username: 'You',
                avatar: '👤',
                role: 'CREATOR',
                joinedAt: new Date().toISOString(),
                stats: {
                    totalPoints: 0,
                    weeklyPoints: 0,
                    wins: 0,
                    losses: 0,
                    winRate: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    rank: 1,
                    weeklyRank: 1,
                    achievements: 0,
                    badges: 0
                },
                isActive: true,
                lastActivity: new Date().toISOString()
            }],
            settings,
            createdAt: new Date().toISOString(),
            seasonStartDate: new Date().toISOString(),
            seasonEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
            status: 'ACTIVE',
            tags: this.generateLeagueTags(name, description),
            joinCode: this.generateJoinCode()
        };

        // Store league
        const leagues = this.getStoredLeagues();
        leagues.push(league);
        this.storeLeagues(leagues);

        // Add to user's leagues
        const userLeagues = this.getUserLeagueIds();
        userLeagues.push(league.id);
        this.storeUserLeagues(userLeagues);

        return league;
    }

    /**
     * Join a league by ID or join code
     */
    async joinLeague(leagueId: string, joinCode?: string): Promise<boolean> {
        const leagues = this.getStoredLeagues();
        const league = leagues.find(l => l.id === leagueId || l.joinCode === joinCode);
        
        if (!league || league.currentMembers >= league.maxMembers) {
            return false;
        }

        // Check if user is already a member
        const isAlreadyMember = league.members.some(m => m.userId === 'current-user');
        if (isAlreadyMember) {
            return false;
        }

        // Add user as member
        const newMember: LeagueMember = {
            userId: 'current-user',
            username: 'You',
            avatar: '👤',
            role: 'MEMBER',
            joinedAt: new Date().toISOString(),
            stats: {
                totalPoints: 0,
                weeklyPoints: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                currentStreak: 0,
                longestStreak: 0,
                rank: league.currentMembers + 1,
                weeklyRank: league.currentMembers + 1,
                achievements: 0,
                badges: 0
            },
            isActive: true,
            lastActivity: new Date().toISOString()
        };

        league.members.push(newMember);
        league.currentMembers += 1;

        // Update stored leagues
        this.storeLeagues(leagues);

        // Add to user's leagues
        const userLeagues = this.getUserLeagueIds();
        userLeagues.push(league.id);
        this.storeUserLeagues(userLeagues);

        return true;
    }

    /**
     * Get user's leagues
     */
    async getUserLeagues(): Promise<OracleLeague[]> {
        const userLeagueIds = this.getUserLeagueIds();
        const allLeagues = this.getStoredLeagues();
        return allLeagues.filter(league => userLeagueIds.includes(league.id));
    }

    /**
     * Get public leagues available to join
     */
    async getPublicLeagues(limit: number = 20): Promise<OracleLeague[]> {
        const allLeagues = this.getStoredLeagues();
        return allLeagues
            .filter(league => league.isPublic && league.currentMembers < league.maxMembers)
            .slice(0, limit);
    }

    // Group Predictions
    /**
     * Create a group prediction for a challenge
     */
    async createGroupPrediction(
        leagueId: string,
        challengeId: string,
        title: string,
        description: string,
        type: GroupPrediction['type'] = 'MAJORITY_VOTE',
        closesInHours: number = 24
    ): Promise<GroupPrediction> {
        const groupPrediction: GroupPrediction = {
            id: `group-pred-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            leagueId,
            challengeId,
            title,
            description,
            type,
            status: 'OPEN',
            createdBy: 'current-user',
            createdAt: new Date().toISOString(),
            closesAt: new Date(Date.now() + closesInHours * 60 * 60 * 1000).toISOString(),
            participants: [],
            rewards: {
                winnerPoints: 100,
                participationPoints: 25
            }
        };

        const groupPredictions = this.getStoredGroupPredictions();
        groupPredictions.push(groupPrediction);
        this.storeGroupPredictions(groupPredictions);

        return groupPrediction;
    }

    /**
     * Submit a prediction to a group prediction
     */
    async submitGroupPrediction(
        groupPredictionId: string,
        prediction: number,
        confidence: number,
        reasoning?: string
    ): Promise<boolean> {
        const groupPredictions = this.getStoredGroupPredictions();
        const groupPred = groupPredictions.find(gp => gp.id === groupPredictionId);

        if (!groupPred || groupPred.status !== 'OPEN') {
            return false;
        }

        // Check if user already participated
        const existingParticipant = groupPred.participants.find(p => p.userId === 'current-user');
        if (existingParticipant) {
            // Update existing prediction
            existingParticipant.prediction = prediction;
            existingParticipant.confidence = confidence;
            existingParticipant.reasoning = reasoning;
            existingParticipant.submittedAt = new Date().toISOString();
        } else {
            // Add new participant
            groupPred.participants.push({
                userId: 'current-user',
                username: 'You',
                avatar: '👤',
                prediction,
                confidence,
                reasoning,
                submittedAt: new Date().toISOString(),
                weight: 1.0 // Default weight
            });
        }

        this.storeGroupPredictions(groupPredictions);
        return true;
    }

    /**
     * Get group predictions for a league
     */
    async getLeagueGroupPredictions(leagueId: string): Promise<GroupPrediction[]> {
        const groupPredictions = this.getStoredGroupPredictions();
        return groupPredictions.filter(gp => gp.leagueId === leagueId);
    }

    // Debate System
    /**
     * Create a new debate
     */
    async createDebate(
        leagueId: string,
        title: string,
        topic: string,
        description: string,
        challengeId?: string
    ): Promise<Debate> {
        const debate: Debate = {
            id: `debate-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            leagueId,
            challengeId,
            title,
            topic,
            description,
            createdBy: 'current-user',
            createdAt: new Date().toISOString(),
            status: 'ACTIVE',
            participants: [],
            posts: [],
            votes: [],
            tags: this.generateDebateTags(title, topic, description),
            moderatorActions: []
        };

        const debates = this.getStoredDebates();
        debates.push(debate);
        this.storeDebates(debates);

        return debate;
    }

    /**
     * Join a debate
     */
    async joinDebate(debateId: string, side: 'SIDE_A' | 'SIDE_B' | 'NEUTRAL'): Promise<boolean> {
        const debates = this.getStoredDebates();
        const debate = debates.find(d => d.id === debateId);

        if (!debate || debate.status !== 'ACTIVE') {
            return false;
        }

        // Check if user is already participating
        const existingParticipant = debate.participants.find(p => p.userId === 'current-user');
        if (existingParticipant) {
            existingParticipant.side = side;
        } else {
            debate.participants.push({
                userId: 'current-user',
                username: 'You',
                avatar: '👤',
                side,
                joinedAt: new Date().toISOString(),
                reputation: 100, // Default reputation
                badges: []
            });
        }

        this.storeDebates(debates);
        return true;
    }

    /**
     * Post in a debate
     */
    async postInDebate(
        debateId: string,
        content: string,
        side: 'SIDE_A' | 'SIDE_B' | 'NEUTRAL'
    ): Promise<DebatePost | null> {
        const debates = this.getStoredDebates();
        const debate = debates.find(d => d.id === debateId);

        if (!debate || debate.status !== 'ACTIVE') {
            return null;
        }

        const post: DebatePost = {
            id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            debateId,
            userId: 'current-user',
            username: 'You',
            avatar: '👤',
            content,
            side,
            postedAt: new Date().toISOString(),
            reactions: [],
            replies: [],
            isModerated: false,
            isPinned: false
        };

        debate.posts.push(post);
        this.storeDebates(debates);

        return post;
    }

    /**
     * Get debates for a league
     */
    async getLeagueDebates(leagueId: string): Promise<Debate[]> {
        const debates = this.getStoredDebates();
        return debates.filter(d => d.leagueId === leagueId);
    }

    /**
     * Vote in a debate
     */
    async voteInDebate(debateId: string, side: 'SIDE_A' | 'SIDE_B', reasoning?: string): Promise<boolean> {
        const debates = this.getStoredDebates();
        const debate = debates.find(d => d.id === debateId);

        if (!debate || debate.status !== 'ACTIVE') {
            return false;
        }

        // Remove existing vote if any
        debate.votes = debate.votes.filter(v => v.userId !== 'current-user');

        // Add new vote
        debate.votes.push({
            userId: 'current-user',
            side,
            timestamp: new Date().toISOString(),
            reasoning
        });

        this.storeDebates(debates);
        return true;
    }

    /**
     * Reply to a debate post
     */
    async replyToPost(postId: string, content: string): Promise<DebateReply | null> {
        const debates = this.getStoredDebates();
        
        for (const debate of debates) {
            const post = debate.posts.find(p => p.id === postId);
            if (post) {
                const reply: DebateReply = {
                    id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                    postId,
                    userId: 'current-user',
                    username: 'You',
                    avatar: '👤',
                    content,
                    postedAt: new Date().toISOString(),
                    reactions: []
                };

                post.replies.push(reply);
                this.storeDebates(debates);
                return reply;
            }
        }

        return null;
    }

    /**
     * Add reaction to a post
     */
    async addReaction(postId: string, reactionType: '👍' | '👎' | '🔥' | '💯' | '🤔' | '😂'): Promise<boolean> {
        const debates = this.getStoredDebates();
        
        for (const debate of debates) {
            const post = debate.posts.find(p => p.id === postId);
            if (post) {
                // Remove existing reaction from this user
                post.reactions = post.reactions.filter(r => r.userId !== 'current-user');
                
                // Add new reaction
                post.reactions.push({
                    userId: 'current-user',
                    type: reactionType,
                    timestamp: new Date().toISOString()
                });

                this.storeDebates(debates);
                return true;
            }
        }

        return false;
    }

    /**
     * Moderate a post (delete, edit, pin, etc.)
     */
    async moderatePost(
        postId: string, 
        action: 'DELETE_POST' | 'EDIT_POST' | 'WARN_USER' | 'TIMEOUT_USER' | 'PIN_POST',
        reason?: string
    ): Promise<boolean> {
        const debates = this.getStoredDebates();
        
        for (const debate of debates) {
            const post = debate.posts.find(p => p.id === postId);
            if (post) {
                const moderatorAction: ModeratorAction = {
                    id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                    moderatorId: 'current-user',
                    moderatorName: 'You',
                    action,
                    targetId: postId,
                    targetType: 'POST',
                    reason: reason || '',
                    timestamp: new Date().toISOString()
                };

                debate.moderatorActions.push(moderatorAction);

                // Apply the moderation action
                switch (action) {
                    case 'DELETE_POST':
                        debate.posts = debate.posts.filter(p => p.id !== postId);
                        break;
                    case 'PIN_POST':
                        post.isPinned = true;
                        break;
                    case 'EDIT_POST':
                        post.isModerated = true;
                        break;
                }

                this.storeDebates(debates);
                return true;
            }
        }

        return false;
    }

    /**
     * Resolve a debate
     */
    async resolveDebate(
        debateId: string, 
        winner: 'SIDE_A' | 'SIDE_B' | 'DRAW', 
        reasoning: string
    ): Promise<boolean> {
        const debates = this.getStoredDebates();
        const debate = debates.find(d => d.id === debateId);

        if (!debate) {
            return false;
        }

        debate.status = 'RESOLVED';
        debate.resolution = {
            winner,
            resolvedBy: 'current-user',
            resolvedAt: new Date().toISOString(),
            reasoning
        };

        this.storeDebates(debates);
        return true;
    }

    // Social Features
    /**
     * Send league invitation
     */
    async sendLeagueInvitation(
        leagueId: string,
        toUsername: string,
        message?: string
    ): Promise<LeagueInvitation> {
        const invitation: LeagueInvitation = {
            id: `invite-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            leagueId,
            leagueName: this.getStoredLeagues().find(l => l.id === leagueId)?.name || 'Unknown League',
            fromUserId: 'current-user',
            fromUsername: 'You',
            toUserId: 'target-user',
            toUsername: toUsername,
            message,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };

        const invitations = this.getStoredInvitations();
        invitations.push(invitation);
        this.storeInvitations(invitations);

        return invitation;
    }

    /**
     * Get league leaderboard
     */
    async getLeagueLeaderboard(leagueId: string): Promise<LeagueMember[]> {
        const leagues = this.getStoredLeagues();
        const league = leagues.find(l => l.id === leagueId);
        
        if (!league) return [];

        return [...league.members].sort((a, b) => b.stats.totalPoints - a.stats.totalPoints);
    }

    // Helper Methods
    private generateJoinCode(): string {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    private generateLeagueTags(name: string, description: string): string[] {
        const tags: string[] = [];
        const text = `${name} ${description}`.toLowerCase();
        
        if (text.includes('fantasy')) tags.push('fantasy');
        if (text.includes('nfl')) tags.push('nfl');
        if (text.includes('competitive')) tags.push('competitive');
        if (text.includes('casual')) tags.push('casual');
        if (text.includes('friends')) tags.push('friends');
        if (text.includes('expert')) tags.push('expert');
        
        return tags;
    }

    private generateDebateTags(title: string, topic: string, description: string): string[] {
        const tags: string[] = [];
        const text = `${title} ${topic} ${description}`.toLowerCase();
        
        if (text.includes('trade')) tags.push('trades');
        if (text.includes('draft')) tags.push('draft');
        if (text.includes('waiver')) tags.push('waivers');
        if (text.includes('lineup')) tags.push('lineups');
        if (text.includes('injury')) tags.push('injuries');
        if (text.includes('prediction')) tags.push('predictions');
        
        return tags;
    }

    // Storage Methods
    private getStoredLeagues(): OracleLeague[] {
        try {
            const stored = localStorage.getItem(this.LEAGUES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load leagues:', error);
            return [];
        }
    }

    private storeLeagues(leagues: OracleLeague[]): void {
        try {
            localStorage.setItem(this.LEAGUES_KEY, JSON.stringify(leagues));
        } catch (error) {
            console.error('Failed to store leagues:', error);
        }
    }

    private getUserLeagueIds(): string[] {
        try {
            const stored = localStorage.getItem(this.USER_LEAGUES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load user leagues:', error);
            return [];
        }
    }

    private storeUserLeagues(leagueIds: string[]): void {
        try {
            localStorage.setItem(this.USER_LEAGUES_KEY, JSON.stringify(leagueIds));
        } catch (error) {
            console.error('Failed to store user leagues:', error);
        }
    }

    private getStoredGroupPredictions(): GroupPrediction[] {
        try {
            const stored = localStorage.getItem(this.GROUP_PREDICTIONS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load group predictions:', error);
            return [];
        }
    }

    private storeGroupPredictions(predictions: GroupPrediction[]): void {
        try {
            localStorage.setItem(this.GROUP_PREDICTIONS_KEY, JSON.stringify(predictions));
        } catch (error) {
            console.error('Failed to store group predictions:', error);
        }
    }

    private getStoredDebates(): Debate[] {
        try {
            const stored = localStorage.getItem(this.DEBATES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load debates:', error);
            return [];
        }
    }

    private storeDebates(debates: Debate[]): void {
        try {
            localStorage.setItem(this.DEBATES_KEY, JSON.stringify(debates));
        } catch (error) {
            console.error('Failed to store debates:', error);
        }
    }

    private getStoredInvitations(): LeagueInvitation[] {
        try {
            const stored = localStorage.getItem(this.INVITATIONS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load invitations:', error);
            return [];
        }
    }

    private storeInvitations(invitations: LeagueInvitation[]): void {
        try {
            localStorage.setItem(this.INVITATIONS_KEY, JSON.stringify(invitations));
        } catch (error) {
            console.error('Failed to store invitations:', error);
        }
    }
}

// Export singleton instance
export const oracleSocialService = new OracleSocialService();
export default oracleSocialService;
