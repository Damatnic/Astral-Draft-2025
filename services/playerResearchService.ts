/**
 * Player Research Service
 * Comprehensive player research tools with detailed statistics, projections, 
 * news integration, and comparative analysis
 */

// Player Statistics Interfaces
export interface PlayerBaseInfo {
    id: string;
    name: string;
    position: string;
    team: string;
    age: number;
    experience: number;
    height: string;
    weight: number;
    college?: string;
    jersey?: number;
    status: 'active' | 'injured' | 'suspended' | 'retired';
    imageUrl?: string;
}

export interface SeasonStats {
    season: number;
    week?: number;
    gamesPlayed: number;
    gamesStarted: number;
    // Position-specific stats will be in positionStats
    positionStats: Record<string, number>;
    // Fantasy-specific
    fantasyPoints: number;
    fantasyPointsPerGame: number;
    standardDeviation: number;
    boom: number; // Games with 1.5x+ average
    bust: number; // Games with 0.5x- average
    consistency: number; // 0-100 score
}

export interface PlayerProjection {
    playerId: string;
    week: number;
    season: number;
    projectedStats: Record<string, number>;
    fantasyPoints: number;
    confidence: number; // 0-100
    floor: number; // Conservative estimate
    ceiling: number; // Optimistic estimate
    mostLikely: number; // Expected value
    variance: number;
    factors: ProjectionFactor[];
    lastUpdated: Date;
    source: 'internal' | 'consensus' | 'expert' | 'ml_model';
}

export interface ProjectionFactor {
    factor: string;
    impact: number; // -1 to 1
    weight: number; // 0-1
    description: string;
}

export interface PlayerNews {
    id: string;
    playerId: string;
    headline: string;
    summary: string;
    content?: string;
    source: string;
    author?: string;
    publishedAt: Date;
    impact: 'positive' | 'negative' | 'neutral';
    severity: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    fantasyRelevance: number; // 0-100
    verified: boolean;
    sentimentScore: number; // -1 to 1
}

export interface PlayerTrend {
    playerId: string;
    metric: string;
    timeframe: 'last_3_games' | 'last_5_games' | 'last_month' | 'season';
    direction: 'up' | 'down' | 'stable';
    magnitude: number; // 0-1 (strength of trend)
    significance: number; // 0-1 (statistical significance)
    startValue: number;
    endValue: number;
    changePercent: number;
    description: string;
}

export interface PlayerComparison {
    playerId1: string;
    playerId2: string;
    metrics: ComparisonMetric[];
    overallSimilarity: number; // 0-1
    strengthComparison: PlayerStrengthComparison;
    recommendedTrade?: TradeRecommendation;
    createdAt: Date;
}

export interface ComparisonMetric {
    name: string;
    player1Value: number;
    player2Value: number;
    advantage: 'player1' | 'player2' | 'even';
    significantDifference: boolean;
    category: 'offense' | 'consistency' | 'opportunity' | 'efficiency';
}

export interface PlayerStrengthComparison {
    player1Strengths: string[];
    player1Weaknesses: string[];
    player2Strengths: string[];
    player2Weaknesses: string[];
    overallGrade: {
        player1: string; // A+ to F
        player2: string;
    };
}

export interface TradeRecommendation {
    recommended: boolean;
    reasoning: string;
    tradeValue: 'favor_player1' | 'favor_player2' | 'even';
    confidenceLevel: number; // 0-100
}

export interface PlayerResearchFilter {
    positions?: string[];
    teams?: string[];
    minAge?: number;
    maxAge?: number;
    minExperience?: number;
    maxExperience?: number;
    status?: ('active' | 'injured' | 'suspended')[];
    minFantasyPoints?: number;
    maxFantasyPoints?: number;
    availability?: 'all' | 'available' | 'owned';
    sortBy?: 'name' | 'position' | 'team' | 'fantasy_points' | 'projections' | 'trends';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}

export interface ResearchInsight {
    id: string;
    playerId: string;
    type: 'breakout_candidate' | 'buy_low' | 'sell_high' | 'injury_concern' | 'schedule_boost' | 'target_acquisition';
    title: string;
    description: string;
    confidence: number; // 0-100
    timeframe: 'immediate' | 'short_term' | 'long_term';
    actionItems: string[];
    supporting_data: Record<string, any>;
    generatedAt: Date;
}

// Main Player Research Service
class PlayerResearchService {
    private readonly baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    // Mock data for demonstration
    private readonly mockPlayers: PlayerBaseInfo[] = [
        {
            id: '1',
            name: 'Josh Allen',
            position: 'QB',
            team: 'BUF',
            age: 28,
            experience: 6,
            height: '6\'5"',
            weight: 237,
            college: 'Wyoming',
            jersey: 17,
            status: 'active'
        },
        {
            id: '2',
            name: 'Christian McCaffrey',
            position: 'RB',
            team: 'SF',
            age: 27,
            experience: 7,
            height: '5\'11"',
            weight: 205,
            college: 'Stanford',
            jersey: 23,
            status: 'active'
        },
        {
            id: '3',
            name: 'Cooper Kupp',
            position: 'WR',
            team: 'LAR',
            age: 30,
            experience: 7,
            height: '6\'2"',
            weight: 208,
            college: 'Eastern Washington',
            jersey: 10,
            status: 'active'
        }
    ];

    /**
     * Search players with advanced filtering
     */
    async searchPlayers(filter: PlayerResearchFilter = {}): Promise<PlayerBaseInfo[]> {
        try {
            // Mock implementation - in production this would call the API
            let filteredPlayers = [...this.mockPlayers];

            // Apply filters
            if (filter.positions?.length) {
                filteredPlayers = filteredPlayers.filter(p => 
                    filter.positions!.includes(p.position)
                );
            }

            if (filter.teams?.length) {
                filteredPlayers = filteredPlayers.filter(p => 
                    filter.teams!.includes(p.team)
                );
            }

            if (filter.status?.length) {
                filteredPlayers = filteredPlayers.filter(p => 
                    filter.status!.includes(p.status as any)
                );
            }

            // Apply sorting
            if (filter.sortBy) {
                filteredPlayers.sort((a, b) => {
                    let aVal: any, bVal: any;
                    switch (filter.sortBy) {
                        case 'name':
                            aVal = a.name;
                            bVal = b.name;
                            break;
                        case 'position':
                            aVal = a.position;
                            bVal = b.position;
                            break;
                        case 'team':
                            aVal = a.team;
                            bVal = b.team;
                            break;
                        default:
                            return 0;
                    }
                    
                    if (filter.sortOrder === 'desc') {
                        return bVal > aVal ? 1 : -1;
                    }
                    return aVal > bVal ? 1 : -1;
                });
            }

            // Apply pagination
            if (filter.offset || filter.limit) {
                const start = filter.offset || 0;
                const end = filter.limit ? start + filter.limit : undefined;
                filteredPlayers = filteredPlayers.slice(start, end);
            }

            return filteredPlayers;
        } catch (error) {
            console.error('Failed to search players:', error);
            throw new Error('Failed to search players');
        }
    }

    /**
     * Get detailed player information
     */
    async getPlayerDetails(playerId: string): Promise<PlayerBaseInfo | null> {
        try {
            const player = this.mockPlayers.find(p => p.id === playerId);
            return player || null;
        } catch (error) {
            console.error('Failed to get player details:', error);
            throw new Error('Failed to get player details');
        }
    }

    /**
     * Get player season statistics
     */
    async getPlayerSeasonStats(playerId: string, season: number): Promise<SeasonStats[]> {
        try {
            // Mock season stats generation
            const weeks = Array.from({ length: 17 }, (_, i) => i + 1);
            
            return weeks.map(week => ({
                season,
                week,
                gamesPlayed: Math.random() > 0.1 ? 1 : 0, // 90% chance of playing
                gamesStarted: Math.random() > 0.2 ? 1 : 0,
                positionStats: this.generateMockPositionStats(playerId),
                fantasyPoints: Math.random() * 30 + 5, // 5-35 points
                fantasyPointsPerGame: Math.random() * 20 + 10,
                standardDeviation: Math.random() * 8 + 2,
                boom: Math.random() > 0.7 ? 1 : 0,
                bust: Math.random() > 0.8 ? 1 : 0,
                consistency: Math.random() * 40 + 60 // 60-100
            }));
        } catch (error) {
            console.error('Failed to get player season stats:', error);
            throw new Error('Failed to get player season stats');
        }
    }

    /**
     * Get player projections
     */
    async getPlayerProjections(playerId: string, week?: number): Promise<PlayerProjection[]> {
        try {
            const weeks = week ? [week] : Array.from({ length: 4 }, (_, i) => i + 1);
            
            return weeks.map(w => ({
                playerId,
                week: w,
                season: 2024,
                projectedStats: this.generateMockPositionStats(playerId),
                fantasyPoints: Math.random() * 25 + 8,
                confidence: Math.random() * 30 + 70, // 70-100%
                floor: Math.random() * 10 + 5,
                ceiling: Math.random() * 15 + 20,
                mostLikely: Math.random() * 10 + 12,
                variance: Math.random() * 5 + 2,
                factors: this.generateProjectionFactors(),
                lastUpdated: new Date(),
                source: 'ml_model'
            }));
        } catch (error) {
            console.error('Failed to get player projections:', error);
            throw new Error('Failed to get player projections');
        }
    }

    /**
     * Get player news and updates
     */
    async getPlayerNews(playerId: string, limit: number = 10): Promise<PlayerNews[]> {
        try {
            const newsItems = Array.from({ length: limit }, (_, i) => ({
                id: `news-${playerId}-${i}`,
                playerId,
                headline: this.generateMockHeadline(playerId),
                summary: this.generateMockSummary(),
                source: ['ESPN', 'NFL.com', 'The Athletic', 'Pro Football Talk'][Math.floor(Math.random() * 4)],
                publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
                impact: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any,
                severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
                tags: this.generateNewsTags(),
                fantasyRelevance: Math.random() * 100,
                verified: Math.random() > 0.2, // 80% verified
                sentimentScore: (Math.random() - 0.5) * 2 // -1 to 1
            }));

            return newsItems.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
        } catch (error) {
            console.error('Failed to get player news:', error);
            throw new Error('Failed to get player news');
        }
    }

    /**
     * Get player trends analysis
     */
    async getPlayerTrends(playerId: string): Promise<PlayerTrend[]> {
        try {
            const metrics = ['fantasy_points', 'targets', 'touches', 'red_zone_opportunities', 'snap_percentage'];
            const timeframes: Array<'last_3_games' | 'last_5_games' | 'last_month' | 'season'> = 
                ['last_3_games', 'last_5_games', 'last_month', 'season'];

            const trends: PlayerTrend[] = [];

            for (const metric of metrics) {
                for (const timeframe of timeframes.slice(0, 2)) { // Just first 2 timeframes for demo
                    const startValue = Math.random() * 20 + 5;
                    const endValue = startValue + (Math.random() - 0.5) * 10;
                    const changePercent = ((endValue - startValue) / startValue) * 100;
                    
                    let direction: 'up' | 'down' | 'stable';
                    if (changePercent > 5) {
                        direction = 'up';
                    } else if (changePercent < -5) {
                        direction = 'down';
                    } else {
                        direction = 'stable';
                    }

                    trends.push({
                        playerId,
                        metric,
                        timeframe,
                        direction,
                        magnitude: Math.abs(changePercent) / 100,
                        significance: Math.random() * 0.5 + 0.5, // 0.5-1.0
                        startValue,
                        endValue,
                        changePercent,
                        description: this.generateTrendDescription(metric, changePercent, timeframe)
                    });
                }
            }

            return trends;
        } catch (error) {
            console.error('Failed to get player trends:', error);
            throw new Error('Failed to get player trends');
        }
    }

    /**
     * Compare two players
     */
    async comparePlayer(playerId1: string, playerId2: string): Promise<PlayerComparison> {
        try {
            const player1 = await this.getPlayerDetails(playerId1);
            const player2 = await this.getPlayerDetails(playerId2);

            if (!player1 || !player2) {
                throw new Error('One or both players not found');
            }

            const metrics: ComparisonMetric[] = [
                {
                    name: 'Fantasy Points Per Game',
                    player1Value: Math.random() * 15 + 10,
                    player2Value: Math.random() * 15 + 10,
                    advantage: 'player1',
                    significantDifference: true,
                    category: 'offense'
                },
                {
                    name: 'Consistency Score',
                    player1Value: Math.random() * 20 + 70,
                    player2Value: Math.random() * 20 + 70,
                    advantage: 'player2',
                    significantDifference: false,
                    category: 'consistency'
                },
                {
                    name: 'Opportunity Share',
                    player1Value: Math.random() * 30 + 60,
                    player2Value: Math.random() * 30 + 60,
                    advantage: 'even',
                    significantDifference: false,
                    category: 'opportunity'
                }
            ];

            // Determine advantages
            metrics.forEach(metric => {
                const diff = Math.abs(metric.player1Value - metric.player2Value);
                const threshold = metric.player1Value * 0.1; // 10% difference threshold
                
                metric.significantDifference = diff > threshold;
                if (metric.significantDifference) {
                    metric.advantage = metric.player1Value > metric.player2Value ? 'player1' : 'player2';
                } else {
                    metric.advantage = 'even';
                }
            });

            return {
                playerId1,
                playerId2,
                metrics,
                overallSimilarity: Math.random() * 0.4 + 0.6, // 0.6-1.0
                strengthComparison: {
                    player1Strengths: ['High ceiling', 'Consistent targets'],
                    player1Weaknesses: ['Injury history', 'Tough schedule'],
                    player2Strengths: ['Great matchup', 'Red zone usage'],
                    player2Weaknesses: ['Lower floor', 'Competition for touches'],
                    overallGrade: {
                        player1: 'A-',
                        player2: 'B+'
                    }
                },
                recommendedTrade: {
                    recommended: Math.random() > 0.5,
                    reasoning: 'Player 1 has higher upside but Player 2 offers better consistency',
                    tradeValue: 'favor_player1',
                    confidenceLevel: Math.random() * 30 + 60
                },
                createdAt: new Date()
            };
        } catch (error) {
            console.error('Failed to compare players:', error);
            throw new Error('Failed to compare players');
        }
    }

    /**
     * Get research insights for a player
     */
    async getPlayerInsights(playerId: string): Promise<ResearchInsight[]> {
        try {
            const insightTypes: ResearchInsight['type'][] = [
                'breakout_candidate', 'buy_low', 'sell_high', 'injury_concern', 'schedule_boost', 'target_acquisition'
            ];

            const insights = insightTypes.slice(0, 3).map((type, i) => ({
                id: `insight-${playerId}-${i}`,
                playerId,
                type,
                title: this.generateInsightTitle(type),
                description: this.generateInsightDescription(type),
                confidence: Math.random() * 30 + 70,
                timeframe: ['immediate', 'short_term', 'long_term'][Math.floor(Math.random() * 3)] as any,
                actionItems: this.generateActionItems(type),
                supporting_data: {
                    recent_performance: Math.random() * 20 + 10,
                    matchup_difficulty: Math.random() * 100,
                    target_share: Math.random() * 30 + 15
                },
                generatedAt: new Date()
            }));

            return insights;
        } catch (error) {
            console.error('Failed to get player insights:', error);
            throw new Error('Failed to get player insights');
        }
    }

    /**
     * Get similar players based on performance and profile
     */
    async getSimilarPlayers(playerId: string, limit: number = 5): Promise<PlayerBaseInfo[]> {
        try {
            const targetPlayer = await this.getPlayerDetails(playerId);
            if (!targetPlayer) {
                throw new Error('Player not found');
            }

            // Mock similar players (would use ML similarity in production)
            const similarPlayers = this.mockPlayers
                .filter(p => p.id !== playerId && p.position === targetPlayer.position)
                .slice(0, limit);

            return similarPlayers;
        } catch (error) {
            console.error('Failed to get similar players:', error);
            throw new Error('Failed to get similar players');
        }
    }

    // Helper methods for mock data generation
    private generateMockPositionStats(playerId: string): Record<string, number> {
        const player = this.mockPlayers.find(p => p.id === playerId);
        if (!player) return {};

        switch (player.position) {
            case 'QB':
                return {
                    passing_yards: Math.random() * 200 + 200,
                    passing_tds: Math.random() * 3,
                    interceptions: Math.random() * 2,
                    rushing_yards: Math.random() * 50,
                    rushing_tds: Math.random() * 1
                };
            case 'RB':
                return {
                    rushing_yards: Math.random() * 100 + 50,
                    rushing_tds: Math.random() * 2,
                    receptions: Math.random() * 5 + 2,
                    receiving_yards: Math.random() * 50,
                    receiving_tds: Math.random() * 1
                };
            case 'WR':
            case 'TE':
                return {
                    receptions: Math.random() * 8 + 3,
                    receiving_yards: Math.random() * 100 + 40,
                    receiving_tds: Math.random() * 2,
                    targets: Math.random() * 10 + 5
                };
            default:
                return {};
        }
    }

    private generateProjectionFactors(): ProjectionFactor[] {
        const factors = [
            { factor: 'Matchup Advantage', impact: 0.3, weight: 0.8, description: 'Favorable defensive matchup' },
            { factor: 'Recent Form', impact: 0.2, weight: 0.7, description: 'Strong recent performances' },
            { factor: 'Weather Conditions', impact: -0.1, weight: 0.3, description: 'Potential rain expected' },
            { factor: 'Injury Report', impact: -0.05, weight: 0.6, description: 'Listed as questionable' }
        ];

        return factors.slice(0, Math.floor(Math.random() * 3) + 2);
    }

    private generateMockHeadline(playerId: string): string {
        const headlines = [
            'Expected to have increased role this week',
            'Dealing with minor injury concerns',
            'Showing strong chemistry with quarterback',
            'Facing tough defensive matchup',
            'Coming off career-best performance'
        ];
        return headlines[Math.floor(Math.random() * headlines.length)];
    }

    private generateMockSummary(): string {
        const summaries = [
            'Recent developments suggest positive outlook for upcoming games.',
            'Injury report indicates some concern but expected to play.',
            'Strong performance metrics indicate continued upward trend.',
            'Matchup analysis shows both opportunities and challenges.'
        ];
        return summaries[Math.floor(Math.random() * summaries.length)];
    }

    private generateNewsTags(): string[] {
        const allTags = ['injury', 'performance', 'matchup', 'target_share', 'red_zone', 'snap_count', 'trade_rumors'];
        const numTags = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...allTags];
        shuffled.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numTags);
    }

    private generateTrendDescription(metric: string, changePercent: number, timeframe: string): string {
        const direction = changePercent > 0 ? 'increased' : 'decreased';
        const magnitude = Math.abs(changePercent) > 20 ? 'significantly' : 'slightly';
        return `${metric.replace('_', ' ')} has ${magnitude} ${direction} over the ${timeframe.replace('_', ' ')}`;
    }

    private generateInsightTitle(type: ResearchInsight['type']): string {
        const titles = {
            breakout_candidate: 'Potential Breakout Performance',
            buy_low: 'Buy-Low Opportunity',
            sell_high: 'Consider Selling High',
            injury_concern: 'Monitor Injury Status',
            schedule_boost: 'Favorable Schedule Ahead',
            target_acquisition: 'Recommended Waiver Target'
        };
        return titles[type];
    }

    private generateInsightDescription(type: ResearchInsight['type']): string {
        const descriptions = {
            breakout_candidate: 'Multiple indicators suggest this player is due for a strong performance.',
            buy_low: 'Recent poor performance may have depressed value, creating opportunity.',
            sell_high: 'Strong recent performances may have inflated trade value.',
            injury_concern: 'Injury reports suggest potential risk for upcoming games.',
            schedule_boost: 'Upcoming schedule features favorable matchups.',
            target_acquisition: 'Strong underlying metrics suggest valuable pickup opportunity.'
        };
        return descriptions[type];
    }

    private generateActionItems(type: ResearchInsight['type']): string[] {
        const actions = {
            breakout_candidate: ['Consider starting this week', 'Monitor target share', 'Check lineup availability'],
            buy_low: ['Explore trade opportunities', 'Offer lower-tier players', 'Act quickly before rebound'],
            sell_high: ['Listen to trade offers', 'Target consistency over upside', 'Consider package deals'],
            injury_concern: ['Monitor injury reports', 'Identify backup options', 'Check waiver wire'],
            schedule_boost: ['Hold for upcoming weeks', 'Consider increasing lineup priority', 'Monitor snap counts'],
            target_acquisition: ['Check waiver wire availability', 'Prepare FAAB bid', 'Monitor other managers']
        };
        return actions[type];
    }
}

export const playerResearchService = new PlayerResearchService();
export default playerResearchService;
