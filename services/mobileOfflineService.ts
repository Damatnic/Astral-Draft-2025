/**
 * Mobile Offline Service
 * Enhanced offline functionality specifically for mobile draft management
 */

import { Player, Team, League } from '../types';
import CacheService from './cacheService';

interface DraftPick {
    playerId: number;
    teamId: number;
    pick: number;
    timestamp: number;
    round: number;
    pickInRound: number;
}

interface OfflineAction {
    id: string;
    type: 'DRAFT_PLAYER' | 'UPDATE_ROSTER' | 'TRADE_PROPOSAL' | 'WAIVER_CLAIM' | 'SETTINGS_UPDATE';
    payload: any;
    timestamp: number;
    retryCount: number;
    maxRetries: number;
}

interface OfflineData {
    players: Player[];
    teams: Team[];
    leagues: League[];
    userDrafts: DraftPick[];
    lastSync: number;
    version: string;
}

interface OfflineState {
    isOffline: boolean;
    hasOfflineData: boolean;
    pendingActions: OfflineAction[];
    lastSync: Date | null;
    syncInProgress: boolean;
}

class MobileOfflineService {
    private readonly STORAGE_KEYS = {
        OFFLINE_DATA: 'astral_offline_data',
        PENDING_ACTIONS: 'astral_pending_actions',
        OFFLINE_STATE: 'astral_offline_state',
        PLAYER_CACHE: 'astral_players_cache',
        DRAFT_CACHE: 'astral_draft_cache'
    };

    private readonly CACHE_DURATION = {
        PLAYERS: 24 * 60 * 60 * 1000, // 24 hours
        LEAGUES: 60 * 60 * 1000,     // 1 hour
        DRAFTS: 10 * 60 * 1000,      // 10 minutes
        USER_DATA: 30 * 60 * 1000    // 30 minutes
    };

    private readonly cacheService: CacheService;
    private offlineState: OfflineState;
    private subscribers: Array<(state: OfflineState) => void> = [];
    private networkStatusListener: (() => void) | null = null;

    constructor() {
        this.cacheService = new CacheService({
            maxSize: 500,
            defaultTTL: this.CACHE_DURATION.LEAGUES,
            enablePersistence: true,
            storagePrefix: 'mobile_offline_'
        });

        this.offlineState = this.loadOfflineState();
        this.initializeNetworkMonitoring();
        this.initializePeriodicSync();
    }

    /**
     * Initialize network status monitoring
     */
    private initializeNetworkMonitoring(): void {
        const updateOnlineStatus = () => {
            const wasOffline = this.offlineState.isOffline;
            this.offlineState.isOffline = !navigator.onLine;
            
            if (wasOffline && navigator.onLine) {
                // Just came back online - trigger sync
                this.syncPendingActions();
            }
            
            this.notifySubscribers();
        };

        this.networkStatusListener = updateOnlineStatus;
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // Initial status check
        updateOnlineStatus();
    }

    /**
     * Cache critical draft data for offline use
     */
    async cacheDraftData(players: Player[], leagues: League[], teams: Team[]): Promise<void> {
        try {
            const offlineData: OfflineData = {
                players,
                teams,
                leagues,
                userDrafts: [],
                lastSync: Date.now(),
                version: '1.0.0'
            };

            // Store in multiple locations for redundancy
            localStorage.setItem(this.STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData));
            
            // Cache individual collections for better performance
            this.cacheService.set(this.STORAGE_KEYS.PLAYER_CACHE, players, this.CACHE_DURATION.PLAYERS);
            this.cacheService.set('leagues_cache', leagues, this.CACHE_DURATION.LEAGUES);
            this.cacheService.set('teams_cache', teams, this.CACHE_DURATION.USER_DATA);

            this.offlineState.hasOfflineData = true;
            this.offlineState.lastSync = new Date();
            this.saveOfflineState();
            
            console.log('✅ Draft data cached for offline use', {
                players: players.length,
                leagues: leagues.length,
                teams: teams.length
            });
        } catch (error) {
            console.error('❌ Failed to cache draft data:', error);
        }
    }

    /**
     * Get cached players with offline fallback
     */
    getCachedPlayers(): Player[] {
        try {
            // Try cache first
            let players = this.cacheService.get<Player[]>(this.STORAGE_KEYS.PLAYER_CACHE);
            
            if (!players) {
                // Fallback to offline data
                const offlineData = this.getOfflineData();
                players = offlineData?.players || [];
            }
            
            return players;
        } catch (error) {
            console.error('❌ Failed to get cached players:', error);
            return [];
        }
    }

    /**
     * Get cached leagues with offline fallback
     */
    getCachedLeagues(): League[] {
        try {
            let leagues = this.cacheService.get<League[]>('leagues_cache');
            
            if (!leagues) {
                const offlineData = this.getOfflineData();
                leagues = offlineData?.leagues || [];
            }
            
            return leagues;
        } catch (error) {
            console.error('❌ Failed to get cached leagues:', error);
            return [];
        }
    }

    /**
     * Queue action for when back online
     */
    queueOfflineAction(type: OfflineAction['type'], payload: any): string {
        const action: OfflineAction = {
            id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type,
            payload,
            timestamp: Date.now(),
            retryCount: 0,
            maxRetries: 3
        };

        this.offlineState.pendingActions.push(action);
        this.savePendingActions();
        
        console.log('📋 Queued offline action:', action.type, action.id);
        return action.id;
    }

    /**
     * Execute a draft pick offline
     */
    async draftPlayerOffline(playerId: number, teamId: number, pick: number): Promise<boolean> {
        try {
            // Cache the pick locally
            const draftPick: DraftPick = {
                playerId,
                teamId,
                pick,
                timestamp: Date.now(),
                round: Math.ceil(pick / 12), // Assuming 12 teams
                pickInRound: ((pick - 1) % 12) + 1
            };

            // Store pick in cache
            const existingPicks = this.cacheService.get<DraftPick[]>(this.STORAGE_KEYS.DRAFT_CACHE) || [];
            existingPicks.push(draftPick);
            this.cacheService.set(this.STORAGE_KEYS.DRAFT_CACHE, existingPicks, this.CACHE_DURATION.DRAFTS);

            // Queue for sync when online
            this.queueOfflineAction('DRAFT_PLAYER', {
                playerId,
                teamId,
                pick,
                timestamp: draftPick.timestamp
            });

            console.log('✅ Player drafted offline:', { playerId, teamId, pick });
            return true;
        } catch (error) {
            console.error('❌ Failed to draft player offline:', error);
            return false;
        }
    }

    /**
     * Sync pending actions when back online
     */
    async syncPendingActions(): Promise<void> {
        if (this.offlineState.isOffline || this.offlineState.syncInProgress) {
            return;
        }

        this.offlineState.syncInProgress = true;
        this.notifySubscribers();

        try {
            const actionsToSync = [...this.offlineState.pendingActions];
            const successfulActions: string[] = [];

            for (const action of actionsToSync) {
                try {
                    const success = await this.executeAction(action);
                    if (success) {
                        successfulActions.push(action.id);
                    } else {
                        action.retryCount++;
                        if (action.retryCount >= action.maxRetries) {
                            console.warn('⚠️ Action failed after max retries:', action.id);
                            successfulActions.push(action.id); // Remove failed actions
                        }
                    }
                } catch (error) {
                    console.error('❌ Failed to sync action:', action.id, error);
                    action.retryCount++;
                }
            }

            // Remove successful actions
            this.offlineState.pendingActions = this.offlineState.pendingActions.filter(
                action => !successfulActions.includes(action.id)
            );

            this.savePendingActions();
            this.offlineState.lastSync = new Date();
            
            console.log('✅ Sync completed:', {
                synced: successfulActions.length,
                remaining: this.offlineState.pendingActions.length
            });
        } catch (error) {
            console.error('❌ Sync failed:', error);
        } finally {
            this.offlineState.syncInProgress = false;
            this.saveOfflineState();
            this.notifySubscribers();
        }
    }

    /**
     * Execute a pending action
     */
    private async executeAction(action: OfflineAction): Promise<boolean> {
        // This would integrate with your existing API services
        switch (action.type) {
            case 'DRAFT_PLAYER':
                // Call your draft API
                return await this.syncDraftPlayer(action.payload);
            case 'UPDATE_ROSTER':
                // Call roster update API
                return await this.syncRosterUpdate(action.payload);
            case 'TRADE_PROPOSAL':
                // Call trade proposal API
                return await this.syncTradeProposal(action.payload);
            default:
                console.warn('Unknown action type:', action.type);
                return false;
        }
    }

    /**
     * Sync draft player action
     */
    private async syncDraftPlayer(payload: any): Promise<boolean> {
        try {
            // Replace with actual API call
            console.log('🔄 Syncing draft player:', payload);
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For now, return true to simulate success
            return true;
        } catch (error) {
            console.error('❌ Failed to sync draft player:', error);
            return false;
        }
    }

    /**
     * Sync roster update action
     */
    private async syncRosterUpdate(payload: any): Promise<boolean> {
        try {
            console.log('🔄 Syncing roster update:', payload);
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        } catch (error) {
            console.error('❌ Failed to sync roster update:', error);
            return false;
        }
    }

    /**
     * Sync trade proposal action
     */
    private async syncTradeProposal(payload: any): Promise<boolean> {
        try {
            console.log('🔄 Syncing trade proposal:', payload);
            await new Promise(resolve => setTimeout(resolve, 800));
            return true;
        } catch (error) {
            console.error('❌ Failed to sync trade proposal:', error);
            return false;
        }
    }

    /**
     * Get offline data from storage
     */
    private getOfflineData(): OfflineData | null {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.OFFLINE_DATA);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('❌ Failed to get offline data:', error);
            return null;
        }
    }

    /**
     * Load offline state from storage
     */
    private loadOfflineState(): OfflineState {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.OFFLINE_STATE);
            if (stored) {
                const state = JSON.parse(stored);
                return {
                    ...state,
                    lastSync: state.lastSync ? new Date(state.lastSync) : null,
                    syncInProgress: false // Always reset sync status on load
                };
            }
        } catch (error) {
            console.error('❌ Failed to load offline state:', error);
        }

        return {
            isOffline: !navigator.onLine,
            hasOfflineData: false,
            pendingActions: [],
            lastSync: null,
            syncInProgress: false
        };
    }

    /**
     * Save offline state to storage
     */
    private saveOfflineState(): void {
        try {
            localStorage.setItem(this.STORAGE_KEYS.OFFLINE_STATE, JSON.stringify(this.offlineState));
        } catch (error) {
            console.error('❌ Failed to save offline state:', error);
        }
    }

    /**
     * Save pending actions to storage
     */
    private savePendingActions(): void {
        try {
            localStorage.setItem(this.STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(this.offlineState.pendingActions));
        } catch (error) {
            console.error('❌ Failed to save pending actions:', error);
        }
    }

    /**
     * Initialize periodic sync attempts
     */
    private initializePeriodicSync(): void {
        setInterval(() => {
            if (!this.offlineState.isOffline && this.offlineState.pendingActions.length > 0) {
                this.syncPendingActions();
            }
        }, 30000); // Try sync every 30 seconds when online
    }

    /**
     * Subscribe to offline state changes
     */
    subscribe(callback: (state: OfflineState) => void): () => void {
        this.subscribers.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    /**
     * Notify all subscribers of state changes
     */
    private notifySubscribers(): void {
        this.subscribers.forEach(callback => {
            try {
                callback(this.offlineState);
            } catch (error) {
                console.error('❌ Subscriber callback failed:', error);
            }
        });
    }

    /**
     * Get current offline state
     */
    getState(): OfflineState {
        return { ...this.offlineState };
    }

    /**
     * Clear all offline data and cache
     */
    clearOfflineData(): void {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            
            this.offlineState = {
                isOffline: !navigator.onLine,
                hasOfflineData: false,
                pendingActions: [],
                lastSync: null,
                syncInProgress: false
            };
            
            console.log('✅ Offline data cleared');
        } catch (error) {
            console.error('❌ Failed to clear offline data:', error);
        }
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        if (this.networkStatusListener) {
            window.removeEventListener('online', this.networkStatusListener);
            window.removeEventListener('offline', this.networkStatusListener);
        }
        this.subscribers = [];
    }
}

// Export singleton instance
export const mobileOfflineService = new MobileOfflineService();
export default MobileOfflineService;
