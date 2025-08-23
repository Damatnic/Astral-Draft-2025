/**
 * Draft Preparation Service
 * Comprehensive draft preparation tools with cheat sheets, rankings customization,
 * strategy planning, and mock draft integration
 */

// Type Definitions
export type RiskLevel = 'low' | 'medium' | 'high';
export type ScoringSystem = 'standard' | 'ppr' | 'half_ppr' | 'super_flex';
export type WaiverPriority = 'rolling' | 'waiver_budget' | 'reverse_standings';

// Player and Draft Data Interfaces
export interface DraftPlayer {
    id: string;
    name: string;
    position: string;
    team: string;
    byeWeek: number;
    adp: number; // Average Draft Position
    projectedPoints: number;
    tier: number;
    rank: number;
    value: number; // Value over replacement
    riskLevel: RiskLevel;
    upside: number; // 0-100 scale
    floor: number;
    ceiling: number;
    consistency: number;
    injuries: string[];
    tags: string[];
    sleeper: boolean;
    breakout: boolean;
    rookie: boolean;
}

export interface CustomRankings {
    id: string;
    name: string;
    description: string;
    userId: string;
    isPublic: boolean;
    lastUpdated: Date;
    rankings: PlayerRanking[];
    settings: RankingSettings;
    categories: RankingCategory[];
}

export interface PlayerRanking {
    playerId: string;
    rank: number;
    tier: number;
    notes: string;
    customValue: number;
    tags: string[];
    locked: boolean; // Prevent auto-updates
}

export interface RankingSettings {
    scoringSystem: ScoringSystem;
    leagueSize: number;
    teamCount: number;
    startingPositions: Record<string, number>;
    benchSize: number;
    includeDefense: boolean;
    includeKicker: boolean;
    tradingEnabled: boolean;
    waiverPriority: WaiverPriority;
}

export interface RankingCategory {
    id: string;
    name: string;
    position: string;
    tiers: RankingTier[];
    notes: string;
}

export interface RankingTier {
    tier: number;
    label: string;
    color: string;
    description: string;
    playerIds: string[];
}

export interface CheatSheet {
    id: string;
    name: string;
    userId: string;
    template: CheatSheetTemplate;
    customizations: CheatSheetCustomization;
    generatedAt: Date;
    data: CheatSheetData;
    format: 'pdf' | 'web' | 'mobile';
    settings: CheatSheetSettings;
}

export interface CheatSheetTemplate {
    id: string;
    name: string;
    layout: 'grid' | 'list' | 'tiers' | 'custom';
    sections: CheatSheetSection[];
    colorScheme: string;
    density: 'compact' | 'normal' | 'spacious';
}

export interface CheatSheetSection {
    id: string;
    title: string;
    type: 'player_rankings' | 'targets' | 'sleepers' | 'avoid' | 'strategy_notes' | 'bye_weeks';
    position?: string;
    visible: boolean;
    order: number;
    config: Record<string, any>;
}

export interface CheatSheetCustomization {
    highlightTargets: boolean;
    showTiers: boolean;
    showByeWeeks: boolean;
    showRiskLevels: boolean;
    colorCodePositions: boolean;
    includeNotes: boolean;
    fontSize: 'small' | 'medium' | 'large';
    columnsPerPage: number;
}

export interface CheatSheetData {
    players: DraftPlayer[];
    targets: string[];
    sleepers: string[];
    avoid: string[];
    strategies: DraftStrategy[];
    notes: string[];
    byeWeekAnalysis: ByeWeekAnalysis;
}

export interface CheatSheetSettings {
    autoUpdate: boolean;
    includeInjuredPlayers: boolean;
    maxPlayersPerTier: number;
    showADP: boolean;
    showProjections: boolean;
    customWeights: Record<string, number>;
}

export interface DraftStrategy {
    id: string;
    name: string;
    description: string;
    type: 'early_rb' | 'late_rb' | 'wr_heavy' | 'balanced' | 'zero_rb' | 'hero_rb' | 'late_qb' | 'qb_streaming';
    rounds: StrategyRound[];
    considerations: string[];
    pros: string[];
    cons: string[];
    leagueSizes: number[];
    scoringFormats: string[];
    success_rate: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface StrategyRound {
    round: number;
    positions: string[];
    targets: string[];
    avoid: string[];
    notes: string;
    flexibility: number; // 0-1 scale
}

export interface MockDraftResult {
    id: string;
    userId: string;
    strategy: string;
    completed: boolean;
    totalRounds: number;
    currentRound: number;
    currentPick: number;
    userTeam: DraftedPlayer[];
    allPicks: DraftPick[];
    analysis: MockDraftAnalysis;
    timestamp: Date;
    duration: number; // in seconds
    settings: MockDraftSettings;
}

export interface DraftedPlayer extends DraftPlayer {
    round: number;
    pick: number;
    draftedBy: string;
    timeSelected: Date;
    valueAtPick: number;
}

export interface DraftPick {
    round: number;
    pick: number;
    playerId: string;
    teamName: string;
    timeSelected: Date;
    autopick: boolean;
}

export interface MockDraftAnalysis {
    teamGrade: string; // A+ to F
    strengthPositions: string[];
    weakPositions: string[];
    recommendations: string[];
    bestPicks: DraftedPlayer[];
    questionablePicks: DraftedPlayer[];
    projectedFinish: number;
    totalProjectedPoints: number;
    rosterBalance: Record<string, number>;
    byeWeekCoverage: number;
}

export interface MockDraftSettings {
    leagueSize: number;
    scoringFormat: string;
    draftType: 'snake' | 'linear';
    timePerPick: number;
    autopickEnabled: boolean;
    strategy: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface ByeWeekAnalysis {
    conflicts: ByeWeekConflict[];
    coverage: Record<string, number>;
    recommendations: string[];
    worstWeeks: number[];
}

export interface ByeWeekConflict {
    week: number;
    positions: string[];
    players: string[];
    severity: 'low' | 'medium' | 'high';
    impact: string;
}

export interface DraftPrepFilter {
    positions?: string[];
    tiers?: number[];
    adpRange?: [number, number];
    riskLevel?: RiskLevel[];
    tags?: string[];
    availability?: 'all' | 'available' | 'targeted';
    sortBy?: 'rank' | 'adp' | 'projected_points' | 'value' | 'upside';
    sortOrder?: 'asc' | 'desc';
}

// Main Draft Preparation Service
class DraftPreparationService {
    private readonly baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    // Mock data for demonstration
    private readonly mockPlayers: DraftPlayer[] = [
        {
            id: '1',
            name: 'Josh Allen',
            position: 'QB',
            team: 'BUF',
            byeWeek: 12,
            adp: 15.2,
            projectedPoints: 387.5,
            tier: 1,
            rank: 1,
            value: 45.3,
            riskLevel: 'low',
            upside: 95,
            floor: 320,
            ceiling: 450,
            consistency: 88,
            injuries: [],
            tags: ['elite', 'rushing_upside', 'safe'],
            sleeper: false,
            breakout: false,
            rookie: false
        },
        {
            id: '2',
            name: 'Christian McCaffrey',
            position: 'RB',
            team: 'SF',
            byeWeek: 9,
            adp: 2.1,
            projectedPoints: 285.8,
            tier: 1,
            rank: 1,
            value: 52.7,
            riskLevel: 'medium',
            upside: 98,
            floor: 180,
            ceiling: 350,
            consistency: 75,
            injuries: ['ankle sprain 2023'],
            tags: ['elite', 'injury_history', 'high_ceiling'],
            sleeper: false,
            breakout: false,
            rookie: false
        },
        {
            id: '3',
            name: 'Cooper Kupp',
            position: 'WR',
            team: 'LAR',
            byeWeek: 6,
            adp: 8.5,
            projectedPoints: 245.2,
            tier: 1,
            rank: 1,
            value: 38.1,
            riskLevel: 'low',
            upside: 92,
            floor: 200,
            ceiling: 290,
            consistency: 91,
            injuries: [],
            tags: ['target_monster', 'consistent', 'safe'],
            sleeper: false,
            breakout: false,
            rookie: false
        }
    ];

    private readonly mockStrategies: DraftStrategy[] = [
        {
            id: 'zero_rb',
            name: 'Zero RB Strategy',
            description: 'Draft WRs and other positions early, wait on RBs until middle/late rounds',
            type: 'zero_rb',
            rounds: [
                {
                    round: 1,
                    positions: ['WR', 'TE'],
                    targets: ['Elite WR1s', 'Travis Kelce'],
                    avoid: ['RB'],
                    notes: 'Target elite wide receivers with high target share',
                    flexibility: 0.2
                },
                {
                    round: 2,
                    positions: ['WR', 'QB'],
                    targets: ['WR1s', 'Elite QBs'],
                    avoid: ['RB'],
                    notes: 'Continue building WR depth or secure elite QB',
                    flexibility: 0.4
                }
            ],
            considerations: [
                'Requires strong waiver wire management',
                'High risk, high reward strategy',
                'Need to hit on late-round RBs'
            ],
            pros: [
                'Secure elite WR production',
                'RB value often available later',
                'Less injury risk early'
            ],
            cons: [
                'Thin at RB to start season',
                'Requires active management',
                'Can backfire if late RBs fail'
            ],
            leagueSizes: [10, 12, 14],
            scoringFormats: ['ppr', 'half_ppr'],
            success_rate: 68,
            difficulty: 'advanced'
        },
        {
            id: 'robust_rb',
            name: 'Robust RB Strategy',
            description: 'Secure multiple strong RBs early to build foundation',
            type: 'early_rb',
            rounds: [
                {
                    round: 1,
                    positions: ['RB'],
                    targets: ['Elite RB1s'],
                    avoid: ['QB', 'TE'],
                    notes: 'Secure bellcow RB with high touch volume',
                    flexibility: 0.1
                },
                {
                    round: 2,
                    positions: ['RB', 'WR'],
                    targets: ['RB1s', 'Elite WRs'],
                    avoid: ['QB', 'TE'],
                    notes: 'Double down on RB or pivot to elite WR',
                    flexibility: 0.6
                }
            ],
            considerations: [
                'RB injury risk higher',
                'Positional scarcity at RB',
                'Workload sustainability'
            ],
            pros: [
                'Strong RB foundation',
                'Positional scarcity advantage',
                'Clear early strategy'
            ],
            cons: [
                'Higher injury risk',
                'May miss elite WRs',
                'Less roster flexibility'
            ],
            leagueSizes: [8, 10, 12],
            scoringFormats: ['standard', 'half_ppr'],
            success_rate: 72,
            difficulty: 'beginner'
        }
    ];

    /**
     * Get all available players for draft preparation
     */
    async getDraftPlayers(filter: DraftPrepFilter = {}): Promise<DraftPlayer[]> {
        try {
            let filteredPlayers = [...this.mockPlayers];

            // Apply filters
            if (filter.positions?.length) {
                filteredPlayers = filteredPlayers.filter(p => 
                    filter.positions!.includes(p.position)
                );
            }

            if (filter.tiers?.length) {
                filteredPlayers = filteredPlayers.filter(p => 
                    filter.tiers!.includes(p.tier)
                );
            }

            if (filter.riskLevel?.length) {
                filteredPlayers = filteredPlayers.filter(p => 
                    filter.riskLevel!.includes(p.riskLevel)
                );
            }

            if (filter.adpRange) {
                filteredPlayers = filteredPlayers.filter(p => 
                    p.adp >= filter.adpRange![0] && p.adp <= filter.adpRange![1]
                );
            }

            // Apply sorting
            if (filter.sortBy) {
                filteredPlayers.sort((a, b) => {
                    let aVal: number, bVal: number;
                    
                    switch (filter.sortBy) {
                        case 'rank':
                            aVal = a.rank;
                            bVal = b.rank;
                            break;
                        case 'adp':
                            aVal = a.adp;
                            bVal = b.adp;
                            break;
                        case 'projected_points':
                            aVal = a.projectedPoints;
                            bVal = b.projectedPoints;
                            break;
                        case 'value':
                            aVal = a.value;
                            bVal = b.value;
                            break;
                        case 'upside':
                            aVal = a.upside;
                            bVal = b.upside;
                            break;
                        default:
                            return 0;
                    }
                    
                    return filter.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
                });
            }

            return filteredPlayers;
        } catch (error) {
            console.error('Failed to get draft players:', error);
            throw new Error('Failed to get draft players');
        }
    }

    /**
     * Get available draft strategies
     */
    async getDraftStrategies(): Promise<DraftStrategy[]> {
        try {
            return this.mockStrategies;
        } catch (error) {
            console.error('Failed to get draft strategies:', error);
            throw new Error('Failed to get draft strategies');
        }
    }

    /**
     * Get draft strategy by ID
     */
    async getDraftStrategy(strategyId: string): Promise<DraftStrategy | null> {
        try {
            return this.mockStrategies.find(s => s.id === strategyId) || null;
        } catch (error) {
            console.error('Failed to get draft strategy:', error);
            throw new Error('Failed to get draft strategy');
        }
    }

    /**
     * Create custom player rankings
     */
    async createCustomRankings(rankings: Omit<CustomRankings, 'id' | 'lastUpdated'>): Promise<CustomRankings> {
        try {
            const newRankings: CustomRankings = {
                ...rankings,
                id: `rankings-${Date.now()}`,
                lastUpdated: new Date()
            };

            // In production, this would save to database
            console.log('Created custom rankings:', newRankings);
            
            return newRankings;
        } catch (error) {
            console.error('Failed to create custom rankings:', error);
            throw new Error('Failed to create custom rankings');
        }
    }

    /**
     * Update custom player rankings
     */
    async updateCustomRankings(rankingsId: string, updates: Partial<CustomRankings>): Promise<CustomRankings> {
        try {
            // Mock update - in production would update database
            const updatedRankings: CustomRankings = {
                id: rankingsId,
                name: updates.name || 'Updated Rankings',
                description: updates.description || '',
                userId: updates.userId || 'user-1',
                isPublic: updates.isPublic || false,
                lastUpdated: new Date(),
                rankings: updates.rankings || [],
                settings: updates.settings || {
                    scoringSystem: 'ppr',
                    leagueSize: 12,
                    teamCount: 12,
                    startingPositions: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1 },
                    benchSize: 6,
                    includeDefense: true,
                    includeKicker: true,
                    tradingEnabled: true,
                    waiverPriority: 'rolling'
                },
                categories: updates.categories || []
            };

            return updatedRankings;
        } catch (error) {
            console.error('Failed to update custom rankings:', error);
            throw new Error('Failed to update custom rankings');
        }
    }

    /**
     * Generate cheat sheet
     */
    async generateCheatSheet(
        userId: string, 
        template: CheatSheetTemplate, 
        customizations: CheatSheetCustomization,
        settings: CheatSheetSettings
    ): Promise<CheatSheet> {
        try {
            const players = await this.getDraftPlayers();
            
            // Generate cheat sheet data
            const cheatSheetData: CheatSheetData = {
                players: players.slice(0, 200), // Top 200 players
                targets: players.filter(p => p.tags.includes('target') || p.sleeper).map(p => p.id),
                sleepers: players.filter(p => p.sleeper).map(p => p.id),
                avoid: players.filter(p => p.riskLevel === 'high' && p.injuries.length > 0).map(p => p.id),
                strategies: await this.getDraftStrategies(),
                notes: [
                    'Focus on positional scarcity',
                    'Monitor injury reports before draft',
                    'Have backup plans for each pick'
                ],
                byeWeekAnalysis: this.generateByeWeekAnalysis(players.slice(0, 100))
            };

            const cheatSheet: CheatSheet = {
                id: `cheatsheet-${Date.now()}`,
                name: `${template.name} Cheat Sheet`,
                userId,
                template,
                customizations,
                generatedAt: new Date(),
                data: cheatSheetData,
                format: 'web',
                settings
            };

            return cheatSheet;
        } catch (error) {
            console.error('Failed to generate cheat sheet:', error);
            throw new Error('Failed to generate cheat sheet');
        }
    }

    /**
     * Run mock draft simulation
     */
    async runMockDraft(settings: MockDraftSettings, strategy: string): Promise<MockDraftResult> {
        try {
            const players = await this.getDraftPlayers();
            const draftStrategy = await this.getDraftStrategy(strategy);
            
            if (!draftStrategy) {
                throw new Error('Draft strategy not found');
            }

            // Simulate draft picks
            const totalPicks = settings.leagueSize * 15; // Assuming 15 rounds
            const allPicks: DraftPick[] = [];
            const userTeam: DraftedPlayer[] = [];
            
            // User's draft position (random for demo)
            const userPosition = Math.floor(Math.random() * settings.leagueSize) + 1;
            
            for (let pick = 1; pick <= totalPicks; pick++) {
                const round = Math.ceil(pick / settings.leagueSize);
                const pickInRound = ((pick - 1) % settings.leagueSize) + 1;
                
                // Determine if it's user's pick
                let isUserPick = false;
                if (settings.draftType === 'snake') {
                    isUserPick = (round % 2 === 1) ? 
                        (pickInRound === userPosition) : 
                        (pickInRound === settings.leagueSize - userPosition + 1);
                } else {
                    isUserPick = pickInRound === userPosition;
                }

                // Select player (simplified logic)
                const availablePlayers = players.filter(p => 
                    !allPicks.some(pick => pick.playerId === p.id)
                );
                
                if (availablePlayers.length === 0) break;
                
                const selectedPlayer = availablePlayers[0]; // Simple selection for demo
                
                const draftPick: DraftPick = {
                    round,
                    pick: pickInRound,
                    playerId: selectedPlayer.id,
                    teamName: isUserPick ? 'Your Team' : `Team ${pickInRound}`,
                    timeSelected: new Date(),
                    autopick: !isUserPick
                };

                allPicks.push(draftPick);

                if (isUserPick) {
                    const draftedPlayer: DraftedPlayer = {
                        ...selectedPlayer,
                        round,
                        pick: pickInRound,
                        draftedBy: 'Your Team',
                        timeSelected: new Date(),
                        valueAtPick: selectedPlayer.value - pick
                    };
                    userTeam.push(draftedPlayer);
                }
            }

            // Generate analysis
            const analysis = this.generateMockDraftAnalysis(userTeam, allPicks);

            const mockDraftResult: MockDraftResult = {
                id: `mock-${Date.now()}`,
                userId: 'user-1',
                strategy,
                completed: true,
                totalRounds: 15,
                currentRound: 15,
                currentPick: totalPicks,
                userTeam,
                allPicks,
                analysis,
                timestamp: new Date(),
                duration: 1800, // 30 minutes
                settings
            };

            return mockDraftResult;
        } catch (error) {
            console.error('Failed to run mock draft:', error);
            throw new Error('Failed to run mock draft');
        }
    }

    /**
     * Generate bye week analysis
     */
    private generateByeWeekAnalysis(players: DraftPlayer[]): ByeWeekAnalysis {
        const byeWeeks: Record<number, DraftPlayer[]> = {};
        
        // Group players by bye week
        players.forEach(player => {
            if (!byeWeeks[player.byeWeek]) {
                byeWeeks[player.byeWeek] = [];
            }
            byeWeeks[player.byeWeek].push(player);
        });

        const conflicts: ByeWeekConflict[] = [];
        const coverage: Record<string, number> = {};
        
        // Analyze each bye week
        Object.entries(byeWeeks).forEach(([week, weekPlayers]) => {
            const weekNum = parseInt(week);
            const positions = [...new Set(weekPlayers.map(p => p.position))];
            
            if (weekPlayers.length > 3) { // Arbitrary threshold
                conflicts.push({
                    week: weekNum,
                    positions,
                    players: weekPlayers.map(p => p.name),
                    severity: weekPlayers.length > 5 ? 'high' : 'medium',
                    impact: `${weekPlayers.length} key players on bye`
                });
            }
        });

        return {
            conflicts,
            coverage,
            recommendations: [
                'Avoid drafting too many players with the same bye week',
                'Plan ahead for bye week coverage',
                'Consider streaming options for thin weeks'
            ],
            worstWeeks: conflicts.map(c => c.week).slice(0, 3)
        };
    }

    /**
     * Generate mock draft analysis
     */
    private generateMockDraftAnalysis(userTeam: DraftedPlayer[], allPicks: DraftPick[]): MockDraftAnalysis {
        const positionCounts: Record<string, number> = {};
        let totalProjectedPoints = 0;

        userTeam.forEach(player => {
            positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
            totalProjectedPoints += player.projectedPoints;
        });

        const strengthPositions = Object.entries(positionCounts)
            .filter(([, count]) => count >= 3)
            .map(([position]) => position);

        const weakPositions = ['QB', 'RB', 'WR', 'TE']
            .filter(pos => (positionCounts[pos] || 0) < 2);

        return {
            teamGrade: 'B+',
            strengthPositions,
            weakPositions,
            recommendations: [
                'Strong depth at WR position',
                'Consider adding RB depth',
                'Monitor waiver wire for TE options'
            ],
            bestPicks: userTeam.filter(p => p.valueAtPick > 10).slice(0, 3),
            questionablePicks: userTeam.filter(p => p.valueAtPick < -5).slice(0, 2),
            projectedFinish: Math.floor(Math.random() * 6) + 4, // 4th-9th place
            totalProjectedPoints,
            rosterBalance: positionCounts,
            byeWeekCoverage: 85 // Percentage score
        };
    }
}

export const draftPreparationService = new DraftPreparationService();
export default draftPreparationService;
