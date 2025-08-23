/**
 * League Management Service
 * Comprehensive league administration with commissioner controls and settings
 */

import { Player } from '../types';

export interface League {
    id: string;
    name: string;
    commissionerId: string;
    commissionerName: string;
    settings: LeagueSettings;
    members: LeagueMember[];
    status: 'draft' | 'active' | 'completed' | 'archived';
    createdAt: Date;
    updatedAt: Date;
    draftDate?: Date;
    seasonYear: number;
    password?: string;
    isPublic: boolean;
    maxMembers: number;
    description?: string;
    rules?: string;
    payouts?: PayoutStructure;
    history: LeagueEvent[];
}

export interface LeagueSettings {
    // Basic Settings
    leagueSize: number;
    teamSize: number;
    scoringSystem: 'standard' | 'ppr' | 'half-ppr' | 'superflex' | 'custom';
    draftType: 'snake' | 'auction' | 'linear';
    
    // Roster Settings
    startingLineup: {
        QB: number;
        RB: number;
        WR: number;
        TE: number;
        FLEX: number;
        SUPERFLEX?: number;
        K: number;
        DST: number;
    };
    benchSlots: number;
    irSlots: number;
    taxiSlots?: number;
    
    // Draft Settings
    draftOrderType: 'randomized' | 'manual' | 'snake-reverse' | 'auction';
    pickTimeLimit: number; // seconds
    autodraftEnabled: boolean;
    keeperSettings?: KeeperSettings;
    
    // Season Settings
    regularSeasonWeeks: number;
    playoffWeeks: number;
    playoffTeams: number;
    championshipWeek: number;
    tradeDeadline: number; // week number
    waiverType: 'rolling' | 'reverse-standings' | 'faab';
    waiverBudget?: number;
    
    // Scoring Settings
    passingYards: number;
    passingTouchdowns: number;
    passingInterceptions: number;
    rushingYards: number;
    rushingTouchdowns: number;
    receivingYards: number;
    receivingTouchdowns: number;
    receptions: number;
    fumbles: number;
    
    // Advanced Settings
    fractionalScoring: boolean;
    negativePoints: boolean;
    bonusScoring?: BonusScoring;
    customScoring?: CustomScoring[];
    
    // Commissioner Settings
    commissionerVeto: boolean;
    tradeReviewPeriod: number; // hours
    rosterMoves: 'unlimited' | 'limited';
    moveLimit?: number;
    lockTeams: boolean;
}

export interface KeeperSettings {
    enabled: boolean;
    maxKeepers: number;
    keeperDeadline: Date;
    roundPenalty: number;
    costIncrease?: number;
    rookieException: boolean;
}

export interface BonusScoring {
    passingYardBonus?: { threshold: number; points: number }[];
    rushingYardBonus?: { threshold: number; points: number }[];
    receivingYardBonus?: { threshold: number; points: number }[];
    multiTdBonus?: { threshold: number; points: number }[];
}

export interface CustomScoring {
    statType: string;
    points: number;
    description: string;
}

export interface LeagueMember {
    userId: string;
    username: string;
    email: string;
    teamName: string;
    avatar?: string;
    role: 'commissioner' | 'owner' | 'co-commissioner';
    joinedAt: Date;
    isActive: boolean;
    draftPosition?: number;
    roster?: Player[];
    waiverPriority?: number;
    waiverBudget?: number;
    record?: TeamRecord;
    powerRanking?: number;
}

export interface TeamRecord {
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
    streak: number;
    streakType: 'W' | 'L' | 'T';
}

export interface PayoutStructure {
    entryFee: number;
    totalPot: number;
    payouts: {
        position: number;
        amount: number;
        percentage: number;
    }[];
}

export interface LeagueEvent {
    id: string;
    type: 'trade' | 'waiver' | 'setting_change' | 'member_join' | 'member_leave' | 'draft_start' | 'season_start' | 'commissioner_action';
    description: string;
    initiatedBy: string;
    affectedUsers?: string[];
    timestamp: Date;
    data?: any;
}

export interface LeagueInvitation {
    id: string;
    leagueId: string;
    leagueName: string;
    invitedEmail: string;
    invitedBy: string;
    invitedByName: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    expiresAt: Date;
    createdAt: Date;
    message?: string;
}

export interface CommissionerAction {
    type: 'force_trade' | 'reverse_trade' | 'move_player' | 'adjust_score' | 'change_lineup' | 'reset_waivers' | 'extend_deadline' | 'kick_member';
    targetUserId?: string;
    data: any;
    reason: string;
}

export class LeagueManagementService {
    private readonly leagues: Map<string, League> = new Map();
    private readonly invitations: Map<string, LeagueInvitation> = new Map();

    constructor() {
        this.initializeMockData();
    }

    // League Creation and Management
    async createLeague(
        commissionerId: string,
        commissionerName: string,
        leagueData: Partial<League>
    ): Promise<League> {
        const leagueId = `league_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        const defaultSettings: LeagueSettings = {
            leagueSize: 12,
            teamSize: 16,
            scoringSystem: 'ppr',
            draftType: 'snake',
            startingLineup: {
                QB: 1,
                RB: 2,
                WR: 2,
                TE: 1,
                FLEX: 1,
                K: 1,
                DST: 1
            },
            benchSlots: 7,
            irSlots: 1,
            draftOrderType: 'randomized',
            pickTimeLimit: 90,
            autodraftEnabled: true,
            regularSeasonWeeks: 14,
            playoffWeeks: 3,
            playoffTeams: 6,
            championshipWeek: 17,
            tradeDeadline: 12,
            waiverType: 'rolling',
            passingYards: 0.04,
            passingTouchdowns: 4,
            passingInterceptions: -2,
            rushingYards: 0.1,
            rushingTouchdowns: 6,
            receivingYards: 0.1,
            receivingTouchdowns: 6,
            receptions: 1,
            fumbles: -2,
            fractionalScoring: true,
            negativePoints: true,
            commissionerVeto: true,
            tradeReviewPeriod: 24,
            rosterMoves: 'unlimited',
            lockTeams: false
        };

        const league: League = {
            id: leagueId,
            name: leagueData.name || `${commissionerName}'s League`,
            commissionerId,
            commissionerName,
            settings: { ...defaultSettings, ...leagueData.settings },
            members: [{
                userId: commissionerId,
                username: commissionerName,
                email: '',
                teamName: `${commissionerName}'s Team`,
                role: 'commissioner',
                joinedAt: new Date(),
                isActive: true
            }],
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            seasonYear: new Date().getFullYear(),
            isPublic: leagueData.isPublic ?? false,
            maxMembers: leagueData.maxMembers || 12,
            description: leagueData.description,
            rules: leagueData.rules,
            payouts: leagueData.payouts,
            history: [{
                id: `event_${Date.now()}`,
                type: 'commissioner_action',
                description: 'League created',
                initiatedBy: commissionerId,
                timestamp: new Date(),
                data: { action: 'create_league' }
            }]
        };

        this.leagues.set(leagueId, league);
        return league;
    }

    async updateLeagueSettings(
        leagueId: string,
        commissionerId: string,
        updates: Partial<LeagueSettings>
    ): Promise<League> {
        const league = this.leagues.get(leagueId);
        if (!league) {
            throw new Error('League not found');
        }

        if (league.commissionerId !== commissionerId) {
            throw new Error('Only the commissioner can update league settings');
        }

        league.settings = { ...league.settings, ...updates };
        league.updatedAt = new Date();

        // Log the setting change
        league.history.push({
            id: `event_${Date.now()}`,
            type: 'setting_change',
            description: `League settings updated: ${Object.keys(updates).join(', ')}`,
            initiatedBy: commissionerId,
            timestamp: new Date(),
            data: { changes: updates }
        });

        this.leagues.set(leagueId, league);
        return league;
    }

    // Member Management
    async inviteMember(
        leagueId: string,
        commissionerId: string,
        email: string,
        message?: string
    ): Promise<LeagueInvitation> {
        const league = this.leagues.get(leagueId);
        if (!league) {
            throw new Error('League not found');
        }

        if (league.commissionerId !== commissionerId) {
            throw new Error('Only the commissioner can invite members');
        }

        if (league.members.length >= league.maxMembers) {
            throw new Error('League is full');
        }

        const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const invitation: LeagueInvitation = {
            id: invitationId,
            leagueId,
            leagueName: league.name,
            invitedEmail: email,
            invitedBy: commissionerId,
            invitedByName: league.commissionerName,
            status: 'pending',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdAt: new Date(),
            message
        };

        this.invitations.set(invitationId, invitation);
        return invitation;
    }

    async acceptInvitation(
        invitationId: string,
        userId: string,
        username: string,
        teamName: string
    ): Promise<League> {
        const invitation = this.invitations.get(invitationId);
        if (!invitation) {
            throw new Error('Invitation not found');
        }

        if (invitation.status !== 'pending') {
            throw new Error('Invitation is no longer valid');
        }

        if (invitation.expiresAt < new Date()) {
            invitation.status = 'expired';
            throw new Error('Invitation has expired');
        }

        const league = this.leagues.get(invitation.leagueId);
        if (!league) {
            throw new Error('League not found');
        }

        if (league.members.length >= league.maxMembers) {
            throw new Error('League is full');
        }

        // Add new member
        const newMember: LeagueMember = {
            userId,
            username,
            email: invitation.invitedEmail,
            teamName,
            role: 'owner',
            joinedAt: new Date(),
            isActive: true
        };

        league.members.push(newMember);
        league.updatedAt = new Date();

        // Log the member join
        league.history.push({
            id: `event_${Date.now()}`,
            type: 'member_join',
            description: `${username} joined the league`,
            initiatedBy: userId,
            timestamp: new Date(),
            data: { teamName }
        });

        // Update invitation status
        invitation.status = 'accepted';

        this.leagues.set(invitation.leagueId, league);
        this.invitations.set(invitationId, invitation);

        return league;
    }

    async declineInvitation(invitationId: string): Promise<void> {
        const invitation = this.invitations.get(invitationId);
        if (!invitation) {
            throw new Error('Invitation not found');
        }

        if (invitation.status !== 'pending') {
            throw new Error('Invitation is no longer valid');
        }

        // Update invitation status
        invitation.status = 'declined';
        this.invitations.set(invitationId, invitation);
    }

    async removeMember(
        leagueId: string,
        commissionerId: string,
        targetUserId: string,
        reason: string
    ): Promise<League> {
        const league = this.leagues.get(leagueId);
        if (!league) {
            throw new Error('League not found');
        }

        if (league.commissionerId !== commissionerId) {
            throw new Error('Only the commissioner can remove members');
        }

        const memberIndex = league.members.findIndex(m => m.userId === targetUserId);
        if (memberIndex === -1) {
            throw new Error('Member not found');
        }

        const removedMember = league.members[memberIndex];
        league.members.splice(memberIndex, 1);
        league.updatedAt = new Date();

        // Log the removal
        league.history.push({
            id: `event_${Date.now()}`,
            type: 'member_leave',
            description: `${removedMember.username} was removed from the league: ${reason}`,
            initiatedBy: commissionerId,
            affectedUsers: [targetUserId],
            timestamp: new Date(),
            data: { reason, kicked: true }
        });

        this.leagues.set(leagueId, league);
        return league;
    }

    // Commissioner Actions
    async executeCommissionerAction(
        leagueId: string,
        commissionerId: string,
        action: CommissionerAction
    ): Promise<League> {
        const league = this.leagues.get(leagueId);
        if (!league) {
            throw new Error('League not found');
        }

        if (league.commissionerId !== commissionerId) {
            throw new Error('Only the commissioner can execute these actions');
        }

        let description = '';
        const affectedUsers: string[] = [];

        switch (action.type) {
            case 'force_trade':
                description = `Commissioner forced trade: ${action.data.description}`;
                affectedUsers.push(...action.data.participants);
                break;
            case 'reverse_trade':
                description = `Commissioner reversed trade: ${action.data.tradeId}`;
                affectedUsers.push(...action.data.participants);
                break;
            case 'move_player':
                description = `Commissioner moved player: ${action.data.playerName} to ${action.data.targetTeam}`;
                if (action.targetUserId) affectedUsers.push(action.targetUserId);
                break;
            case 'adjust_score':
                description = `Commissioner adjusted score for ${action.data.teamName}: ${action.data.adjustment} points`;
                if (action.targetUserId) affectedUsers.push(action.targetUserId);
                break;
            case 'change_lineup':
                description = `Commissioner changed lineup for ${action.data.teamName}`;
                if (action.targetUserId) affectedUsers.push(action.targetUserId);
                break;
            case 'reset_waivers':
                description = 'Commissioner reset waiver order';
                break;
            case 'extend_deadline':
                description = `Commissioner extended ${action.data.deadlineType} deadline`;
                break;
            case 'kick_member':
                description = `Commissioner removed ${action.data.username} from league`;
                if (action.targetUserId) affectedUsers.push(action.targetUserId);
                break;
            default:
                description = `Commissioner action: ${action.type}`;
        }

        // Log the commissioner action
        league.history.push({
            id: `event_${Date.now()}`,
            type: 'commissioner_action',
            description: `${description}. Reason: ${action.reason}`,
            initiatedBy: commissionerId,
            affectedUsers: affectedUsers.length > 0 ? affectedUsers : undefined,
            timestamp: new Date(),
            data: { action: action.type, ...action.data, reason: action.reason }
        });

        league.updatedAt = new Date();
        this.leagues.set(leagueId, league);
        return league;
    }

    // League Query Methods
    async getLeague(leagueId: string): Promise<League | null> {
        return this.leagues.get(leagueId) || null;
    }

    async getUserLeagues(userId: string): Promise<League[]> {
        return Array.from(this.leagues.values()).filter(
            league => league.members.some(member => member.userId === userId)
        );
    }

    async getPublicLeagues(): Promise<League[]> {
        return Array.from(this.leagues.values())
            .filter(league => league.isPublic && league.members.length < league.maxMembers)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async getUserInvitations(email: string): Promise<LeagueInvitation[]> {
        return Array.from(this.invitations.values())
            .filter(inv => inv.invitedEmail === email && inv.status === 'pending')
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Draft Management
    async startDraft(leagueId: string, commissionerId: string): Promise<League> {
        const league = this.leagues.get(leagueId);
        if (!league) {
            throw new Error('League not found');
        }

        if (league.commissionerId !== commissionerId) {
            throw new Error('Only the commissioner can start the draft');
        }

        if (league.status !== 'draft') {
            throw new Error('League is not in draft status');
        }

        if (league.members.length < 2) {
            throw new Error('Need at least 2 members to start draft');
        }

        league.status = 'active';
        league.draftDate = new Date();
        league.updatedAt = new Date();

        // Log draft start
        league.history.push({
            id: `event_${Date.now()}`,
            type: 'draft_start',
            description: 'Draft started',
            initiatedBy: commissionerId,
            timestamp: new Date()
        });

        this.leagues.set(leagueId, league);
        return league;
    }

    // Utilities
    private initializeMockData(): void {
        // Create a sample league for testing
        const mockLeague: League = {
            id: 'mock_league_1',
            name: 'Championship League',
            commissionerId: 'user_1',
            commissionerName: 'Commissioner',
            settings: {
                leagueSize: 12,
                teamSize: 16,
                scoringSystem: 'ppr',
                draftType: 'snake',
                startingLineup: {
                    QB: 1,
                    RB: 2,
                    WR: 2,
                    TE: 1,
                    FLEX: 1,
                    K: 1,
                    DST: 1
                },
                benchSlots: 7,
                irSlots: 1,
                draftOrderType: 'randomized',
                pickTimeLimit: 90,
                autodraftEnabled: true,
                regularSeasonWeeks: 14,
                playoffWeeks: 3,
                playoffTeams: 6,
                championshipWeek: 17,
                tradeDeadline: 12,
                waiverType: 'rolling',
                passingYards: 0.04,
                passingTouchdowns: 4,
                passingInterceptions: -2,
                rushingYards: 0.1,
                rushingTouchdowns: 6,
                receivingYards: 0.1,
                receivingTouchdowns: 6,
                receptions: 1,
                fumbles: -2,
                fractionalScoring: true,
                negativePoints: true,
                commissionerVeto: true,
                tradeReviewPeriod: 24,
                rosterMoves: 'unlimited',
                lockTeams: false
            },
            members: [
                {
                    userId: 'user_1',
                    username: 'Commissioner',
                    email: 'commissioner@example.com',
                    teamName: 'The Champions',
                    role: 'commissioner',
                    joinedAt: new Date(),
                    isActive: true,
                    record: { wins: 8, losses: 4, ties: 0, pointsFor: 1250.5, pointsAgainst: 1180.2, streak: 3, streakType: 'W' }
                },
                {
                    userId: 'user_2',
                    username: 'Player2',
                    email: 'player2@example.com',
                    teamName: 'The Contenders',
                    role: 'owner',
                    joinedAt: new Date(),
                    isActive: true,
                    record: { wins: 7, losses: 5, ties: 0, pointsFor: 1180.3, pointsAgainst: 1200.1, streak: 1, streakType: 'L' }
                }
            ],
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            seasonYear: new Date().getFullYear(),
            isPublic: true,
            maxMembers: 12,
            description: 'Competitive fantasy football league',
            history: []
        };

        this.leagues.set('mock_league_1', mockLeague);
    }
}

// Singleton instance
export const leagueManagementService = new LeagueManagementService();
