
import type { League, Team, GamedayEvent, LiveNewsItem, GamedayEventType } from '../types';
import { realTimeNflDataService } from './realTimeNflDataService';
import { oracleLiveDataIntegrationService } from './oracleLiveDataIntegrationService';
import type { RealTimeGameEvent, LivePlayerUpdate } from './realTimeNflDataService';

// This is a singleton to provide live data integration across the application
class LiveDataService {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private listeners: ((event: GamedayEvent | LiveNewsItem) => void)[] = [];
    private isActive = false;

    constructor() {
        this.setupRealTimeListeners();
    }

    /**
     * Set up listeners for real-time NFL data events
     */
    private setupRealTimeListeners(): void {
        // Listen to real-time game events and convert to app events
        realTimeNflDataService.subscribe('game_event', (event: RealTimeGameEvent) => {
            const gamedayEvent: GamedayEvent = {
                id: event.id,
                type: this.convertEventType(event.type),
                timestamp: event.timestamp,
                text: event.data.description,
                teamId: 1, // Default team ID
                player: {
                    id: parseInt(event.data.playerId || '1'),
                    name: event.data.playerName || 'Player',
                    position: 'RB',
                    team: event.data.team || 'NFL',
                    rank: 1,
                    adp: 1,
                    bye: 0,
                    tier: 1,
                    age: 25,
                    auctionValue: 1,
                    stats: {
                        projection: 0,
                        lastYear: 0,
                        vorp: 0,
                        weeklyProjections: {}
                    }
                },
                points: 0
            };
            
            this.emit(gamedayEvent);
        });

        // Listen to player updates
        realTimeNflDataService.subscribe('player_update', (update: LivePlayerUpdate) => {
            const gamedayEvent: GamedayEvent = {
                id: `player_update_${update.playerId}_${Date.now()}`,
                type: 'BIG_PLAY',
                timestamp: update.lastUpdated,
                text: `${update.name} has ${update.stats.fantasyPoints} fantasy points`,
                teamId: 1,
                player: {
                    id: parseInt(update.playerId.replace(/\D/g, '') || '1'),
                    name: update.name,
                    position: update.position as any || 'RB',
                    team: update.team,
                    rank: 1,
                    adp: 1,
                    bye: 0,
                    tier: 1,
                    age: 25,
                    auctionValue: 1,
                    stats: {
                        projection: update.stats.fantasyPoints,
                        lastYear: 0,
                        vorp: 0,
                        weeklyProjections: {}
                    }
                },
                points: update.stats.fantasyPoints
            };
            
            this.emit(gamedayEvent);
        });

        // Listen to player injuries
        realTimeNflDataService.subscribe('player_injury', (data: any) => {
            const gamedayEvent: GamedayEvent = {
                id: `injury_${data.playerId}_${Date.now()}`,
                type: 'FUMBLE', // Using closest available type for negative events
                timestamp: data.timestamp,
                text: `${data.name} injury status: ${data.oldStatus} → ${data.newStatus}`,
                teamId: 1,
                player: {
                    id: parseInt(data.playerId.replace(/\D/g, '') || '1'),
                    name: data.name,
                    position: 'RB',
                    team: data.team,
                    rank: 1,
                    adp: 1,
                    bye: 0,
                    tier: 1,
                    age: 25,
                    auctionValue: 1,
                    stats: {
                        projection: 0,
                        lastYear: 0,
                        vorp: 0,
                        weeklyProjections: {}
                    }
                },
                points: -5 // Negative points for injury
            };
            
            this.emit(gamedayEvent);
        });

        // Listen to Oracle intelligence updates
        oracleLiveDataIntegrationService.subscribe('intelligence_update', (update: any) => {
            const newsItem: LiveNewsItem = {
                id: `oracle_${Date.now()}`,
                date: new Date(update.timestamp).toISOString(),
                headline: update.title,
                source: 'Oracle AI'
            };
            
            this.emit(newsItem);
        });
    }

    /**
     * Convert real-time event types to app event types
     */
    private convertEventType(eventType: string): GamedayEventType {
        const eventTypeMap: { [key: string]: GamedayEventType } = {
            'SCORE_UPDATE': 'TOUCHDOWN',
            'PLAYER_INJURY': 'FUMBLE',
            'TURNOVER': 'FUMBLE',
            'RED_ZONE_ENTRY': 'REDZONE_ENTRY',
            'GAME_START': 'BIG_PLAY',
            'GAME_END': 'BIG_PLAY',
            'QUARTER_END': 'BIG_PLAY'
        };
        
        return eventTypeMap[eventType] || 'BIG_PLAY';
    }

    start(league: League, myTeam: Team, opponentTeam: Team) {
        if (this.intervalId) {
            this.stop();
        }
        
        this.isActive = true;
        
        // Start real-time services
        realTimeNflDataService.start();
        oracleLiveDataIntegrationService.start();
        
        console.log('🚀 Live Data Service started with real-time integration');
        
        // Generate initial welcome event
        this.emit({
            id: 'welcome_live_data',
            type: 'BIG_PLAY',
            timestamp: Date.now(),
            text: 'Real-time NFL data and Oracle insights are now active',
            teamId: 1,
            player: {
                id: 1,
                name: 'Oracle System',
                position: 'QB',
                team: 'NFL',
                rank: 1,
                adp: 1,
                bye: 0,
                tier: 1,
                age: 25,
                auctionValue: 1,
                stats: {
                    projection: 0,
                    lastYear: 0,
                    vorp: 0,
                    weeklyProjections: {}
                }
            },
            points: 5
        });
    }

    stop() {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isActive = false;
        
        // Stop real-time services
        realTimeNflDataService.stop();
        oracleLiveDataIntegrationService.stop();
        
        console.log('🛑 Live Data Service stopped');
    }

    subscribe(listener: (event: GamedayEvent | LiveNewsItem) => void) {
        this.listeners.push(listener);
    }

    unsubscribe(listener: (event: GamedayEvent | LiveNewsItem) => void) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    private emit(event: GamedayEvent | LiveNewsItem) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('❌ Error in live data listener:', error);
            }
        });
    }

    /**
     * Get connection status for all live data services
     */
    getStatus() {
        return {
            isActive: this.isActive,
            realTimeNfl: realTimeNflDataService.getConnectionStatus(),
            oracleIntegration: oracleLiveDataIntegrationService.getStatus(),
            listeners: this.listeners.length
        };
    }

    /**
     * Force refresh all live data
     */
    async forceRefresh() {
        if (this.isActive) {
            await realTimeNflDataService.forceRefresh();
        }
    }
}

// Export a single instance to be used across the app
export const liveDataService = new LiveDataService();
