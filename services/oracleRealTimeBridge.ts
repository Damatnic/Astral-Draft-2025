/**
 * Oracle Real-Time Integration Bridge
 * Connects the new real-time and collaborative services with existing Oracle infrastructure
 */

import { oracleRealTimeService } from './oracleRealTimeService';
import { oracleCollaborativeService } from './oracleCollaborativeServiceMock';
import { oracleAnalyticsService } from './oracleAnalyticsService';

// Import existing real-time services for integration (with error handling)
let realTimeDraftService: any = null;
let liveDataService: any = null;

try {
    const enhancedRealTimeSync = require('./enhancedRealTimeSyncService');
    realTimeDraftService = enhancedRealTimeSync.default || enhancedRealTimeSync.realTimeDraftService;
} catch (error) {
    console.warn('Enhanced real-time sync service not available:', error);
}

try {
    const liveData = require('./liveDataService');
    liveDataService = liveData.default || liveData.liveDataService;
} catch (error) {
    console.warn('Live data service not available:', error);
}

/**
 * Oracle Real-Time Bridge
 * Manages integration between Oracle services and existing real-time infrastructure
 */
class OracleRealTimeBridge {
    private isInitialized = false;
    private readonly activeSubscriptions = new Map<string, Set<string>>(); // predictionId -> userIds

    /**
     * Initialize the integration bridge
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Set up event listeners between services
            this.setupServiceIntegration();
            
            // Initialize performance monitoring
            this.initializePerformanceMonitoring();
            
            // Set up data synchronization
            this.setupDataSync();

            this.isInitialized = true;
            console.log('🌉 Oracle Real-Time Bridge initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Oracle Real-Time Bridge:', error);
            throw error;
        }
    }

    /**
     * Connect user to Oracle real-time ecosystem
     */
    async connectUser(userId: string, predictionId: string, userInfo: any): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            // Connect to Oracle real-time service
            await oracleRealTimeService.subscribeToPrediction(userId, predictionId);
            
            // Join collaborative room
            await oracleCollaborativeService.joinRoom(predictionId, userId);
            
            // Track active subscription
            if (!this.activeSubscriptions.has(predictionId)) {
                this.activeSubscriptions.set(predictionId, new Set());
            }
            this.activeSubscriptions.get(predictionId)?.add(userId);

            // Integrate with existing real-time draft service if available
            if (realTimeDraftService && 'subscribeToUpdates' in realTimeDraftService) {
                try {
                    await (realTimeDraftService as any).subscribeToUpdates(userId, {
                        predictionId,
                        type: 'oracle_prediction'
                    });
                } catch (error) {
                    console.warn('Could not integrate with realTimeDraftService:', error);
                }
            }

            console.log(`🔗 User ${userId} connected to Oracle real-time ecosystem for prediction ${predictionId}`);

        } catch (error) {
            console.error('Failed to connect user to Oracle real-time ecosystem:', error);
            throw error;
        }
    }

    /**
     * Disconnect user from Oracle real-time ecosystem
     */
    async disconnectUser(userId: string, predictionId: string): Promise<void> {
        try {
            // Remove from active subscriptions
            const activeUsers = this.activeSubscriptions.get(predictionId);
            if (activeUsers) {
                activeUsers.delete(userId);
                if (activeUsers.size === 0) {
                    this.activeSubscriptions.delete(predictionId);
                }
            }

            // Disconnect from Oracle services
            if ('unsubscribeFromPrediction' in oracleRealTimeService) {
                await (oracleRealTimeService as any).unsubscribeFromPrediction(userId, predictionId);
            }

            // Disconnect from existing real-time draft service if available
            if (realTimeDraftService && 'unsubscribeFromUpdates' in realTimeDraftService) {
                try {
                    await (realTimeDraftService as any).unsubscribeFromUpdates(userId, predictionId);
                } catch (error) {
                    console.warn('Could not disconnect from realTimeDraftService:', error);
                }
            }

            console.log(`🔗 User ${userId} disconnected from Oracle real-time ecosystem for prediction ${predictionId}`);

        } catch (error) {
            console.error('Failed to disconnect user from Oracle real-time ecosystem:', error);
        }
    }

    /**
     * Get real-time analytics for prediction
     */
    async getPredictionAnalytics(predictionId: string): Promise<any> {
        try {
            // Get collaborative room data
            const room = oracleCollaborativeService.getRoom(predictionId);
            
            // Get Oracle analytics if available
            let oracleData = null;
            if (oracleAnalyticsService && 'getPredictionAnalytics' in oracleAnalyticsService) {
                try {
                    oracleData = await (oracleAnalyticsService as any).getPredictionAnalytics(predictionId);
                } catch (error) {
                    console.warn('Could not get Oracle analytics:', error);
                }
            }

            // Combine data sources
            const analytics = {
                predictionId,
                timestamp: new Date().toISOString(),
                collaborative: room ? {
                    activeUsers: room.participants?.filter(p => p.isOnline).length || 0,
                    totalMessages: 0,
                    totalInsights: 0,
                    consensusLevel: 0,
                    engagementScore: 0
                } : null,
                oracle: oracleData,
                realTime: {
                    connectedUsers: this.activeSubscriptions.get(predictionId)?.size || 0,
                    isActive: this.activeSubscriptions.has(predictionId)
                }
            };

            return analytics;

        } catch (error) {
            console.error('Failed to get prediction analytics:', error);
            return null;
        }
    }

    /**
     * Broadcast update to all connected users for a prediction
     */
    async broadcastUpdate(predictionId: string, update: any): Promise<void> {
        try {
            const connectedUsers = this.activeSubscriptions.get(predictionId);
            if (!connectedUsers || connectedUsers.size === 0) return;

            // Broadcast through Oracle real-time service
            if ('broadcastToPrediction' in oracleRealTimeService) {
                await (oracleRealTimeService as any).broadcastToPrediction(predictionId, update);
            }

            // Broadcast through existing real-time services if available
            if (realTimeDraftService && 'broadcast' in realTimeDraftService) {
                try {
                    await realTimeDraftService.broadcast({
                        type: 'oracle_update',
                        predictionId,
                        data: update,
                        targetUsers: Array.from(connectedUsers)
                    });
                } catch (error) {
                    console.warn('Could not broadcast through realTimeDraftService:', error);
                }
            }

            console.log(`📡 Broadcasted update to ${connectedUsers.size} users for prediction ${predictionId}`);

        } catch (error) {
            console.error('Failed to broadcast update:', error);
        }
    }

    /**
     * Set up integration between services
     */
    private setupServiceIntegration(): void {
        // Listen for Oracle real-time events and relay to collaborative service
        if (oracleRealTimeService.on) {
            oracleRealTimeService.on('predictionUpdate', (update) => {
                // Relay to collaborative service for room updates
                oracleCollaborativeService.emit('oracle_prediction_update', update);
            });
        }

        // Listen for collaborative events and relay to real-time service
        if (oracleCollaborativeService.on) {
            oracleCollaborativeService.on('room_broadcast', (data) => {
                // Relay room updates to real-time service
                this.broadcastUpdate(data.predictionId, {
                    type: 'collaborative_update',
                    data: data.data
                });
            });
        }

        console.log('🔄 Service integration event handlers configured');
    }

    /**
     * Initialize performance monitoring
     */
    private initializePerformanceMonitoring(): void {
        // Monitor connection count and performance
        setInterval(() => {
            let totalConnections = 0;
            this.activeSubscriptions.forEach((users) => {
                totalConnections += users.size;
            });

            if (totalConnections > 0) {
                console.log(`📊 Oracle Real-Time Bridge: ${totalConnections} active connections across ${this.activeSubscriptions.size} predictions`);
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Set up data synchronization with existing services
     */
    private setupDataSync(): void {
        // Sync with live data service if available
        if (liveDataService && 'on' in liveDataService) {
            try {
                liveDataService.on('dataUpdate', (data: any) => {
                    // Relay relevant updates to Oracle services
                    if (data.type === 'prediction' || data.type === 'player') {
                        this.broadcastUpdate(data.predictionId || 'global', {
                            type: 'data_sync',
                            source: 'liveDataService',
                            data
                        });
                    }
                });
            } catch (error) {
                console.warn('Could not set up live data sync:', error);
            }
        }

        console.log('🔄 Data synchronization configured');
    }

    /**
     * Get bridge status and statistics
     */
    getStatus(): any {
        return {
            isInitialized: this.isInitialized,
            activePredictions: this.activeSubscriptions.size,
            totalConnections: Array.from(this.activeSubscriptions.values())
                .reduce((total, users) => total + users.size, 0),
            predictionDetails: Array.from(this.activeSubscriptions.entries()).map(([predictionId, users]) => ({
                predictionId,
                connectedUsers: users.size,
                userIds: Array.from(users)
            }))
        };
    }
}

// Create and export singleton instance
export const oracleRealTimeBridge = new OracleRealTimeBridge();

// Convenience functions for easy integration
export const connectToOracleRealTime = async (userId: string, predictionId: string, userInfo: any) => {
    return oracleRealTimeBridge.connectUser(userId, predictionId, userInfo);
};

export const disconnectFromOracleRealTime = async (userId: string, predictionId: string) => {
    return oracleRealTimeBridge.disconnectUser(userId, predictionId);
};

export const getOraclePredictionAnalytics = async (predictionId: string) => {
    return oracleRealTimeBridge.getPredictionAnalytics(predictionId);
};

export const broadcastOracleUpdate = async (predictionId: string, update: any) => {
    return oracleRealTimeBridge.broadcastUpdate(predictionId, update);
};

export default oracleRealTimeBridge;
