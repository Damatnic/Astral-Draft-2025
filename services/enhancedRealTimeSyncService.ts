/**
 * Enhanced Real-Time Data Synchronization Service
 * Comprehensive real-time system with WebSocket connections, conflict resolution, offline support, and performance optimization
 */

import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { realTimeDataService } from './realTimeDataServiceV2';

// Enhanced interfaces for real-time synchronization
export interface SyncEvent {
    id: string;
    type: 'SCORE_UPDATE' | 'PLAYER_UPDATE' | 'LINEUP_CHANGE' | 'TRADE_PROPOSAL' | 'INJURY_ALERT' | 'WAIVER_CLAIM' | 'DRAFT_PICK' | 'LEAGUE_SETTINGS' | 'CHAT_MESSAGE';
    leagueId: string;
    userId?: string;
    timestamp: number;
    version: number;
    data: any;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    requiresAck: boolean;
}

export interface ConflictResolution {
    strategy: 'LAST_WRITE_WINS' | 'MERGE' | 'MANUAL_REVIEW' | 'TIMESTAMP_PRIORITY';
    conflictId: string;
    originalEvent: SyncEvent;
    conflictingEvent: SyncEvent;
    resolvedEvent?: SyncEvent;
    status: 'PENDING' | 'RESOLVED' | 'ESCALATED';
}

export interface ClientConnection {
    id: string;
    ws: WebSocket;
    userId: string;
    leagueId: string;
    lastSeen: number;
    isAuthenticated: boolean;
    subscriptions: Set<string>;
    offlineEvents: SyncEvent[];
    connectionMetrics: {
        connected: number;
        reconnects: number;
        lastPing: number;
        latency: number;
    };
}

export interface SyncState {
    leagueId: string;
    version: number;
    lastUpdate: number;
    participants: Map<string, ClientConnection>;
    eventHistory: SyncEvent[];
    conflictQueue: ConflictResolution[];
    dataState: {
        scores: Map<string, any>;
        players: Map<string, any>;
        lineups: Map<string, any>;
        trades: Map<string, any>;
        waivers: Map<string, any>;
    };
}

export interface OfflineSync {
    userId: string;
    leagueId: string;
    events: SyncEvent[];
    lastSync: number;
    conflictCount: number;
}

export interface PerformanceMetrics {
    totalConnections: number;
    activeConnections: number;
    eventsThroughput: number;
    averageLatency: number;
    conflictRate: number;
    errorRate: number;
    dataVolume: number;
    lastMetricsUpdate: number;
}

class EnhancedRealTimeSyncService extends EventEmitter {
    private wss!: WebSocketServer;
    private readonly syncStates: Map<string, SyncState> = new Map();
    private readonly clientConnections: Map<string, ClientConnection> = new Map();
    private readonly offlineQueue: Map<string, OfflineSync> = new Map();
    private isRunning = false;
    
    // Performance and monitoring
    private readonly metrics: PerformanceMetrics = {
        totalConnections: 0,
        activeConnections: 0,
        eventsThroughput: 0,
        averageLatency: 0,
        conflictRate: 0,
        errorRate: 0,
        dataVolume: 0,
        lastMetricsUpdate: Date.now()
    };
    
    // Configuration
    private readonly config = {
        port: 3002,
        heartbeatInterval: 30000,
        reconnectTimeout: 5000,
        maxOfflineEvents: 1000,
        maxEventHistory: 10000,
        conflictTimeout: 300000, // 5 minutes
        performanceUpdateInterval: 60000, // 1 minute
        maxConnectionsPerLeague: 50,
        enableCompression: true,
        enableLogging: true
    };
    
    private heartbeatInterval?: NodeJS.Timeout;
    private performanceInterval?: NodeJS.Timeout;

    constructor(port?: number) {
        super();
        if (port) this.config.port = port;
    }

    /**
     * Initialize the enhanced real-time sync service
     */
    async initialize(): Promise<void> {
        if (this.isRunning) {
            console.warn('Real-time sync service already running');
            return;
        }

        try {
            this.setupWebSocketServer();
            this.startHeartbeat();
            this.startPerformanceMonitoring();
            this.setupEventHandlers();
            
            this.isRunning = true;
            console.log(`🚀 Enhanced Real-Time Sync Service started on port ${this.config.port}`);
            
            this.emit('service:started', { port: this.config.port });
        } catch (error) {
            console.error('Failed to initialize real-time sync service:', error);
            throw error;
        }
    }

    /**
     * Stop the real-time sync service
     */
    async shutdown(): Promise<void> {
        if (!this.isRunning) return;

        this.isRunning = false;
        
        // Clear intervals
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.performanceInterval) clearInterval(this.performanceInterval);
        
        // Close all connections gracefully
        for (const connection of this.clientConnections.values()) {
            if (connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.close(1000, 'Server shutdown');
            }
        }
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        console.log('🛑 Enhanced Real-Time Sync Service stopped');
        this.emit('service:stopped');
    }

    /**
     * Set up WebSocket server with enhanced features
     */
    private setupWebSocketServer(): void {
        this.wss = new WebSocketServer({ 
            port: this.config.port,
            perMessageDeflate: this.config.enableCompression,
            maxPayload: 1024 * 1024 // 1MB max message size
        });

        this.wss.on('connection', (ws, request) => {
            this.handleNewConnection(ws, request);
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
            this.emit('server:error', error);
        });
    }

    /**
     * Handle new client connections
     */
    private handleNewConnection(ws: WebSocket, request: any): void {
        const connectionId = this.generateConnectionId();
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const leagueId = url.searchParams.get('leagueId');
        const userId = url.searchParams.get('userId');
        const token = url.searchParams.get('token');

        // Validate connection parameters
        if (!leagueId || !userId) {
            ws.close(4000, 'Missing required parameters');
            return;
        }

        // Authenticate connection (simplified for now)
        const isAuthenticated = this.authenticateConnection(userId, token);
        if (!isAuthenticated) {
            ws.close(4001, 'Authentication failed');
            return;
        }

        // Check connection limits
        const leagueConnections = Array.from(this.clientConnections.values())
            .filter(conn => conn.leagueId === leagueId);
        
        if (leagueConnections.length >= this.config.maxConnectionsPerLeague) {
            ws.close(4002, 'Maximum connections reached for league');
            return;
        }

        // Create connection object
        const connection: ClientConnection = {
            id: connectionId,
            ws,
            userId,
            leagueId,
            lastSeen: Date.now(),
            isAuthenticated,
            subscriptions: new Set(),
            offlineEvents: [],
            connectionMetrics: {
                connected: Date.now(),
                reconnects: 0,
                lastPing: Date.now(),
                latency: 0
            }
        };

        this.clientConnections.set(connectionId, connection);
        this.metrics.totalConnections++;
        this.metrics.activeConnections++;

        // Initialize sync state for league if needed
        this.initializeSyncState(leagueId);
        const syncState = this.syncStates.get(leagueId);
        if (!syncState) throw new Error('Failed to initialize sync state');
        syncState.participants.set(connectionId, connection);

        // Set up message handlers
        ws.on('message', (data) => {
            this.handleMessage(connectionId, data);
        });

        ws.on('close', (code, reason) => {
            this.handleDisconnection(connectionId, code, reason);
        });

        ws.on('error', (error) => {
            this.handleConnectionError(connectionId, error);
        });

        ws.on('pong', () => {
            connection.connectionMetrics.lastPing = Date.now();
        });

        // Send initial sync data
        this.sendInitialSync(connectionId);
        
        // Process offline events if any
        this.processOfflineEvents(userId, leagueId);
        
        console.log(`✅ Client connected: ${userId} to league ${leagueId}`);
        this.emit('client:connected', { connectionId, userId, leagueId });
    }

    /**
     * Handle incoming messages from clients
     */
    private handleMessage(connectionId: string, data: any): void {
        try {
            const connection = this.clientConnections.get(connectionId);
            if (!connection) return;

            const message = JSON.parse(data.toString());
            connection.lastSeen = Date.now();

            switch (message.type) {
                case 'PING':
                    this.handlePing(connectionId, message);
                    break;
                case 'SUBSCRIBE':
                    this.handleSubscription(connectionId, message);
                    break;
                case 'UNSUBSCRIBE':
                    this.handleUnsubscription(connectionId, message);
                    break;
                case 'SYNC_EVENT':
                    this.handleSyncEvent(connectionId, message);
                    break;
                case 'ACK':
                    this.handleAcknowledgment(connectionId, message);
                    break;
                case 'CONFLICT_RESOLUTION':
                    this.handleConflictResolution(connectionId, message);
                    break;
                default:
                    console.warn(`Unknown message type: ${message.type}`);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            this.sendError(connectionId, 'Invalid message format');
        }
    }

    /**
     * Handle ping messages for latency measurement
     */
    private handlePing(connectionId: string, message: any): void {
        const connection = this.clientConnections.get(connectionId);
        if (!connection) return;

        const now = Date.now();
        const latency = now - (message.timestamp || now);
        connection.connectionMetrics.latency = latency;

        this.sendMessage(connectionId, {
            type: 'PONG',
            timestamp: now,
            latency
        });
    }

    /**
     * Handle subscription requests
     */
    private handleSubscription(connectionId: string, message: any): void {
        const connection = this.clientConnections.get(connectionId);
        if (!connection) return;

        const { channels } = message;
        if (Array.isArray(channels)) {
            channels.forEach(channel => {
                connection.subscriptions.add(channel);
            });
        }

        this.sendMessage(connectionId, {
            type: 'SUBSCRIPTION_CONFIRMED',
            channels: Array.from(connection.subscriptions)
        });
    }

    /**
     * Handle sync events from clients
     */
    private handleSyncEvent(connectionId: string, message: any): void {
        const connection = this.clientConnections.get(connectionId);
        if (!connection) return;

        const syncEvent: SyncEvent = {
            id: this.generateEventId(),
            type: message.eventType,
            leagueId: connection.leagueId,
            userId: connection.userId,
            timestamp: Date.now(),
            version: message.version || 1,
            data: message.data,
            priority: message.priority || 'MEDIUM',
            requiresAck: message.requiresAck || false
        };

        // Process the sync event
        this.processSyncEvent(syncEvent);
    }

    /**
     * Process sync events with conflict detection
     */
    private processSyncEvent(event: SyncEvent): void {
        const syncState = this.syncStates.get(event.leagueId);
        if (!syncState) return;

        // Check for conflicts
        const conflict = this.detectConflict(event, syncState);
        
        if (conflict) {
            this.handleConflict(conflict);
            return;
        }

        // Apply the event
        this.applyEvent(event, syncState);
        
        // Broadcast to relevant clients
        this.broadcastEvent(event);
        
        // Update metrics
        this.updateMetrics(event);
    }

    /**
     * Detect conflicts between events
     */
    private detectConflict(event: SyncEvent, syncState: SyncState): ConflictResolution | null {
        // Check recent events for conflicts
        const recentEvents = syncState.eventHistory
            .filter(e => e.type === event.type && e.timestamp > event.timestamp - 30000); // 30 seconds window

        for (const recentEvent of recentEvents) {
            if (this.eventsConflict(event, recentEvent)) {
                return {
                    strategy: this.getConflictStrategy(event.type),
                    conflictId: this.generateEventId(),
                    originalEvent: recentEvent,
                    conflictingEvent: event,
                    status: 'PENDING'
                };
            }
        }

        return null;
    }

    /**
     * Check if two events conflict
     */
    private eventsConflict(event1: SyncEvent, event2: SyncEvent): boolean {
        if (event1.type !== event2.type) return false;
        
        switch (event1.type) {
            case 'LINEUP_CHANGE':
                return event1.data.teamId === event2.data.teamId && 
                       event1.data.week === event2.data.week;
            case 'TRADE_PROPOSAL':
                return this.tradesConflict(event1.data, event2.data);
            case 'WAIVER_CLAIM':
                return event1.data.playerId === event2.data.playerId;
            default:
                return false;
        }
    }

    /**
     * Check if trades conflict
     */
    private tradesConflict(trade1: any, trade2: any): boolean {
        const team1Players = new Set([...trade1.team1.gives, ...trade1.team1.receives]);
        const team2Players = new Set([...trade2.team1.gives, ...trade2.team1.receives]);
        
        // Check if any players overlap
        for (const playerId of team1Players) {
            if (team2Players.has(playerId)) return true;
        }
        
        return false;
    }

    /**
     * Get conflict resolution strategy for event type
     */
    private getConflictStrategy(eventType: string): ConflictResolution['strategy'] {
        switch (eventType) {
            case 'SCORE_UPDATE':
            case 'PLAYER_UPDATE':
                return 'LAST_WRITE_WINS';
            case 'LINEUP_CHANGE':
                return 'TIMESTAMP_PRIORITY';
            case 'TRADE_PROPOSAL':
            case 'WAIVER_CLAIM':
                return 'MANUAL_REVIEW';
            default:
                return 'MERGE';
        }
    }

    /**
     * Handle conflicts based on strategy
     */
    private handleConflict(conflict: ConflictResolution): void {
        const syncState = this.syncStates.get(conflict.originalEvent.leagueId);
        if (!syncState) return;

        syncState.conflictQueue.push(conflict);

        switch (conflict.strategy) {
            case 'LAST_WRITE_WINS':
                this.resolveLastWriteWins(conflict);
                break;
            case 'TIMESTAMP_PRIORITY':
                this.resolveTimestampPriority(conflict);
                break;
            case 'MERGE':
                this.resolveMerge(conflict);
                break;
            case 'MANUAL_REVIEW':
                this.escalateConflict(conflict);
                break;
        }
    }

    /**
     * Apply event to sync state
     */
    private applyEvent(event: SyncEvent, syncState: SyncState): void {
        // Update version
        syncState.version++;
        syncState.lastUpdate = event.timestamp;
        
        // Store event in history
        syncState.eventHistory.push(event);
        
        // Trim history if needed
        if (syncState.eventHistory.length > this.config.maxEventHistory) {
            syncState.eventHistory = syncState.eventHistory.slice(-this.config.maxEventHistory);
        }

        // Update data state based on event type
        switch (event.type) {
            case 'SCORE_UPDATE':
                syncState.dataState.scores.set(event.data.gameId, event.data);
                break;
            case 'PLAYER_UPDATE':
                syncState.dataState.players.set(event.data.playerId, event.data);
                break;
            case 'LINEUP_CHANGE': {
                const lineupKey = `${event.data.teamId}-${event.data.week}`;
                syncState.dataState.lineups.set(lineupKey, event.data);
                break;
            }
            case 'TRADE_PROPOSAL':
                syncState.dataState.trades.set(event.data.tradeId, event.data);
                break;
            case 'WAIVER_CLAIM':
                syncState.dataState.waivers.set(event.data.claimId, event.data);
                break;
        }
    }

    /**
     * Broadcast event to relevant clients
     */
    private broadcastEvent(event: SyncEvent): void {
        const syncState = this.syncStates.get(event.leagueId);
        if (!syncState) return;

        const message = {
            type: 'SYNC_EVENT',
            event,
            timestamp: Date.now()
        };

        // Send to all participants in the league
        for (const connection of syncState.participants.values()) {
            if (connection.ws.readyState === WebSocket.OPEN) {
                // Check if client is subscribed to this event type
                const channel = `${event.type}:${event.leagueId}`;
                if (connection.subscriptions.has(channel) || connection.subscriptions.has('*')) {
                    this.sendMessage(connection.id, message);
                }
            }
        }
    }

    /**
     * Send initial sync data to new client
     */
    private sendInitialSync(connectionId: string): void {
        const connection = this.clientConnections.get(connectionId);
        if (!connection) return;

        const syncState = this.syncStates.get(connection.leagueId);
        if (!syncState) return;

        const initialData = {
            type: 'INITIAL_SYNC',
            version: syncState.version,
            timestamp: Date.now(),
            data: {
                scores: Object.fromEntries(syncState.dataState.scores),
                players: Object.fromEntries(syncState.dataState.players),
                lineups: Object.fromEntries(syncState.dataState.lineups),
                trades: Object.fromEntries(syncState.dataState.trades),
                waivers: Object.fromEntries(syncState.dataState.waivers)
            },
            recentEvents: syncState.eventHistory.slice(-50) // Last 50 events
        };

        this.sendMessage(connectionId, initialData);
    }

    /**
     * Process offline events when client reconnects
     */
    private processOfflineEvents(userId: string, leagueId: string): void {
        const offlineKey = `${userId}:${leagueId}`;
        const offlineSync = this.offlineQueue.get(offlineKey);
        
        if (!offlineSync || offlineSync.events.length === 0) return;

        // Send offline events to client
        const message = {
            type: 'OFFLINE_SYNC',
            events: offlineSync.events,
            lastSync: offlineSync.lastSync,
            conflictCount: offlineSync.conflictCount
        };

        const connection = Array.from(this.clientConnections.values())
            .find(conn => conn.userId === userId && conn.leagueId === leagueId);
        
        if (connection) {
            this.sendMessage(connection.id, message);
            
            // Clear offline queue
            this.offlineQueue.delete(offlineKey);
        }
    }

    /**
     * Handle client disconnection
     */
    private handleDisconnection(connectionId: string, code: number, reason: any): void {
        const connection = this.clientConnections.get(connectionId);
        if (!connection) return;

        const syncState = this.syncStates.get(connection.leagueId);
        if (syncState) {
            syncState.participants.delete(connectionId);
        }

        this.clientConnections.delete(connectionId);
        this.metrics.activeConnections--;

        console.log(`❌ Client disconnected: ${connection.userId} (${code}: ${reason})`);
        this.emit('client:disconnected', { connectionId, userId: connection.userId, code, reason });
    }

    /**
     * Start heartbeat for connection monitoring
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.checkConnections();
        }, this.config.heartbeatInterval);
    }

    /**
     * Check and clean up stale connections
     */
    private checkConnections(): void {
        const now = Date.now();
        const staleConnections: string[] = [];

        for (const [connectionId, connection] of this.clientConnections) {
            const timeSinceLastSeen = now - connection.lastSeen;
            
            if (timeSinceLastSeen > this.config.heartbeatInterval * 2) {
                staleConnections.push(connectionId);
            } else if (connection.ws.readyState === WebSocket.OPEN) {
                // Send ping
                connection.ws.ping();
            }
        }

        // Clean up stale connections
        staleConnections.forEach(connectionId => {
            this.handleDisconnection(connectionId, 1001, 'Connection timeout');
        });
    }

    /**
     * Start performance monitoring
     */
    private startPerformanceMonitoring(): void {
        this.performanceInterval = setInterval(() => {
            this.updatePerformanceMetrics();
        }, this.config.performanceUpdateInterval);
    }

    /**
     * Update performance metrics
     */
    private updatePerformanceMetrics(): void {
        const now = Date.now();
        
        // Calculate average latency
        const connections = Array.from(this.clientConnections.values());
        if (connections.length > 0) {
            this.metrics.averageLatency = connections.reduce((sum, conn) => 
                sum + conn.connectionMetrics.latency, 0) / connections.length;
        }

        // Calculate conflict rate
        const totalConflicts = Array.from(this.syncStates.values())
            .reduce((sum, state) => sum + state.conflictQueue.length, 0);
        this.metrics.conflictRate = totalConflicts / Math.max(this.metrics.totalConnections, 1);

        this.metrics.lastMetricsUpdate = now;
        
        // Emit metrics event
        this.emit('metrics:updated', { ...this.metrics });
    }

    /**
     * Utility methods
     */
    private generateConnectionId(): string {
        return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    private generateEventId(): string {
        return `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    private authenticateConnection(userId: string, token?: string | null): boolean {
        // Simplified authentication - in production, validate JWT token
        return !!(userId && userId.length > 0);
    }

    private initializeSyncState(leagueId: string): void {
        if (this.syncStates.has(leagueId)) return;

        const syncState: SyncState = {
            leagueId,
            version: 1,
            lastUpdate: Date.now(),
            participants: new Map(),
            eventHistory: [],
            conflictQueue: [],
            dataState: {
                scores: new Map(),
                players: new Map(),
                lineups: new Map(),
                trades: new Map(),
                waivers: new Map()
            }
        };

        this.syncStates.set(leagueId, syncState);
    }

    private sendMessage(connectionId: string, message: any): void {
        const connection = this.clientConnections.get(connectionId);
        if (!connection || connection.ws.readyState !== WebSocket.OPEN) return;

        try {
            connection.ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    private sendError(connectionId: string, error: string): void {
        this.sendMessage(connectionId, {
            type: 'ERROR',
            error,
            timestamp: Date.now()
        });
    }

    private updateMetrics(event: SyncEvent): void {
        this.metrics.eventsThroughput++;
        this.metrics.dataVolume += JSON.stringify(event).length;
    }

    private setupEventHandlers(): void {
        // Handle real-time data service events
        realTimeDataService.onGameUpdate((update) => {
            this.broadcastRealTimeUpdate('SCORE_UPDATE', update);
        });

        realTimeDataService.onPlayerUpdate((update) => {
            this.broadcastRealTimeUpdate('PLAYER_UPDATE', update);
        });

        realTimeDataService.onInjuryAlert((alert) => {
            this.broadcastRealTimeUpdate('INJURY_ALERT', alert);
        });
    }

    private broadcastRealTimeUpdate(type: string, data: any): void {
        // Broadcast to all relevant leagues
        for (const [leagueId, syncState] of this.syncStates) {
            const event: SyncEvent = {
                id: this.generateEventId(),
                type: type as SyncEvent['type'],
                leagueId,
                timestamp: Date.now(),
                version: syncState.version + 1,
                data,
                priority: 'HIGH',
                requiresAck: false
            };

            this.processSyncEvent(event);
        }
    }

    // Conflict resolution methods
    private resolveLastWriteWins(conflict: ConflictResolution): void {
        conflict.resolvedEvent = conflict.conflictingEvent;
        conflict.status = 'RESOLVED';
        
        const syncState = this.syncStates.get(conflict.conflictingEvent.leagueId);
        if (syncState) {
            this.applyEvent(conflict.resolvedEvent, syncState);
            this.broadcastEvent(conflict.resolvedEvent);
        }
    }

    private resolveTimestampPriority(conflict: ConflictResolution): void {
        const winner = conflict.originalEvent.timestamp > conflict.conflictingEvent.timestamp 
            ? conflict.originalEvent 
            : conflict.conflictingEvent;
        
        conflict.resolvedEvent = winner;
        conflict.status = 'RESOLVED';
        
        const syncState = this.syncStates.get(winner.leagueId);
        if (syncState) {
            this.applyEvent(conflict.resolvedEvent, syncState);
            this.broadcastEvent(conflict.resolvedEvent);
        }
    }

    private resolveMerge(conflict: ConflictResolution): void {
        // Implement merge logic based on event type
        const merged = this.mergeEvents(conflict.originalEvent, conflict.conflictingEvent);
        conflict.resolvedEvent = merged;
        conflict.status = 'RESOLVED';
        
        const syncState = this.syncStates.get(merged.leagueId);
        if (syncState) {
            this.applyEvent(conflict.resolvedEvent, syncState);
            this.broadcastEvent(conflict.resolvedEvent);
        }
    }

    private escalateConflict(conflict: ConflictResolution): void {
        conflict.status = 'ESCALATED';
        
        // Notify administrators or relevant parties
        this.emit('conflict:escalated', conflict);
        
        // Broadcast conflict to relevant clients for manual resolution
        const syncState = this.syncStates.get(conflict.originalEvent.leagueId);
        if (syncState) {
            for (const connection of syncState.participants.values()) {
                this.sendMessage(connection.id, {
                    type: 'CONFLICT_NOTIFICATION',
                    conflict,
                    timestamp: Date.now()
                });
            }
        }
    }

    private mergeEvents(event1: SyncEvent, event2: SyncEvent): SyncEvent {
        // Basic merge implementation - can be enhanced based on specific needs
        return {
            ...event2,
            id: this.generateEventId(),
            data: { ...event1.data, ...event2.data },
            timestamp: Math.max(event1.timestamp, event2.timestamp)
        };
    }

    private handleAcknowledgment(connectionId: string, message: any): void {
        // Handle event acknowledgments for reliable delivery
        console.log(`Received ACK from ${connectionId} for event ${message.eventId}`);
    }

    private handleUnsubscription(connectionId: string, message: any): void {
        const connection = this.clientConnections.get(connectionId);
        if (!connection) return;

        const { channels } = message;
        if (Array.isArray(channels)) {
            channels.forEach(channel => {
                connection.subscriptions.delete(channel);
            });
        }
    }

    private handleConflictResolution(connectionId: string, message: any): void {
        const { conflictId, resolution } = message;
        
        // Find and resolve the conflict
        for (const syncState of this.syncStates.values()) {
            const conflict = syncState.conflictQueue.find(c => c.conflictId === conflictId);
            if (conflict) {
                conflict.resolvedEvent = resolution.resolvedEvent;
                conflict.status = 'RESOLVED';
                
                if (conflict.resolvedEvent) {
                    this.applyEvent(conflict.resolvedEvent, syncState);
                    this.broadcastEvent(conflict.resolvedEvent);
                }
                break;
            }
        }
    }

    private handleConnectionError(connectionId: string, error: Error): void {
        console.error(`Connection error for ${connectionId}:`, error);
        this.metrics.errorRate++;
        this.emit('connection:error', { connectionId, error });
    }

    /**
     * Public API methods
     */
    public getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    public getConnectionCount(): number {
        return this.clientConnections.size;
    }

    public getLeagueParticipants(leagueId: string): ClientConnection[] {
        const syncState = this.syncStates.get(leagueId);
        return syncState ? Array.from(syncState.participants.values()) : [];
    }

    public getSyncState(leagueId: string): SyncState | undefined {
        return this.syncStates.get(leagueId);
    }

    public forceSync(leagueId: string): void {
        const syncState = this.syncStates.get(leagueId);
        if (!syncState) return;

        for (const connection of syncState.participants.values()) {
            this.sendInitialSync(connection.id);
        }
    }
}

// Export singleton instance
export const enhancedRealTimeSyncService = new EnhancedRealTimeSyncService();
export default enhancedRealTimeSyncService;
