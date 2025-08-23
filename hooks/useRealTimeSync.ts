/**
 * Enhanced Real-Time Sync Hook
 * React hook for managing real-time data synchronization with WebSocket connections
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';

interface SyncConnection {
    id: string;
    isConnected: boolean;
    isAuthenticated: boolean;
    latency: number;
    reconnectCount: number;
    lastUpdate: number;
}

interface SyncMetrics {
    eventsReceived: number;
    eventsSent: number;
    conflictsDetected: number;
    offlineEventsQueued: number;
    dataVolume: number;
    connectionUptime: number;
}

interface RealTimeSyncOptions {
    leagueId: string;
    userId: string;
    autoReconnect?: boolean;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
    subscriptions?: string[];
    enableOfflineSync?: boolean;
    enableMetrics?: boolean;
}

interface UseRealTimeSyncReturn {
    // Connection state
    connection: SyncConnection;
    isConnecting: boolean;
    isOffline: boolean;
    error: string | null;
    
    // Data state
    syncVersion: number;
    lastSync: number;
    pendingEvents: any[];
    conflicts: any[];
    
    // Metrics
    metrics: SyncMetrics;
    
    // Actions
    connect: () => Promise<void>;
    disconnect: () => void;
    subscribe: (channels: string[]) => void;
    unsubscribe: (channels: string[]) => void;
    sendEvent: (eventType: string, data: any, priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => void;
    resolveConflict: (conflictId: string, resolution: any) => void;
    forceSync: () => void;
    
    // Event handlers
    onScoreUpdate: (callback: (update: any) => void) => void;
    onPlayerUpdate: (callback: (update: any) => void) => void;
    onLineupChange: (callback: (change: any) => void) => void;
    onTradeProposal: (callback: (trade: any) => void) => void;
    onInjuryAlert: (callback: (alert: any) => void) => void;
}

export function useRealTimeSync(options: RealTimeSyncOptions): UseRealTimeSyncReturn {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const eventCallbacksRef = useRef<Map<string, ((data: any) => void)[]>>(new Map());
    
    // State management
    const [connection, setConnection] = useState<SyncConnection>({
        id: '',
        isConnected: false,
        isAuthenticated: false,
        latency: 0,
        reconnectCount: 0,
        lastUpdate: 0
    });
    
    const [isConnecting, setIsConnecting] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [error, setError] = useState<string | null>(null);
    const [syncVersion, setSyncVersion] = useState(1);
    const [lastSync, setLastSync] = useState(Date.now());
    const [pendingEvents, setPendingEvents] = useState<any[]>([]);
    const [conflicts, setConflicts] = useState<any[]>([]);
    
    const [metrics, setMetrics] = useState<SyncMetrics>({
        eventsReceived: 0,
        eventsSent: 0,
        conflictsDetected: 0,
        offlineEventsQueued: 0,
        dataVolume: 0,
        connectionUptime: 0
    });

    const {
        leagueId,
        userId,
        autoReconnect = true,
        reconnectDelay = 5000,
        maxReconnectAttempts = 10,
        subscriptions = ['*'],
        enableOfflineSync = true,
        enableMetrics = true
    } = options;

    // WebSocket connection management
    const connect = useCallback(async (): Promise<void> => {
        if (isConnecting || connection.isConnected) {
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            const wsUrl = new URL('ws://localhost:3002');
            wsUrl.searchParams.set('leagueId', leagueId);
            wsUrl.searchParams.set('userId', userId);
            wsUrl.searchParams.set('token', authService.getSessionToken() || '');

            const ws = new WebSocket(wsUrl.toString());
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('🔗 Real-time sync connected');
                setIsConnecting(false);
                setConnection(prev => ({
                    ...prev,
                    isConnected: true,
                    lastUpdate: Date.now()
                }));
                
                // Subscribe to channels
                if (subscriptions.length > 0) {
                    subscribe(subscriptions);
                }
                
                // Start heartbeat
                startHeartbeat();
                
                // Process offline events if enabled
                if (enableOfflineSync && pendingEvents.length > 0) {
                    processOfflineEvents();
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handleMessage(message);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.onclose = (event) => {
                console.log('🔌 Real-time sync disconnected:', event.code, event.reason);
                setConnection(prev => ({
                    ...prev,
                    isConnected: false,
                    isAuthenticated: false
                }));
                
                stopHeartbeat();
                
                if (autoReconnect && connection.reconnectCount < maxReconnectAttempts) {
                    scheduleReconnect();
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('Connection error occurred');
                setIsConnecting(false);
            };

        } catch (error) {
            console.error('Failed to connect to real-time sync:', error);
            setError('Failed to establish connection');
            setIsConnecting(false);
        }
    }, [isConnecting, connection.isConnected, leagueId, userId, authService.getSessionToken(), subscriptions, autoReconnect, connection.reconnectCount, maxReconnectAttempts, enableOfflineSync, pendingEvents.length]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close(1000, 'User disconnected');
            wsRef.current = null;
        }
        
        stopHeartbeat();
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        setConnection(prev => ({
            ...prev,
            isConnected: false,
            isAuthenticated: false
        }));
    }, []);

    // Message handling
    const handleMessage = useCallback((message: any) => {
        setConnection(prev => ({ ...prev, lastUpdate: Date.now() }));
        
        if (enableMetrics) {
            setMetrics(prev => ({
                ...prev,
                eventsReceived: prev.eventsReceived + 1,
                dataVolume: prev.dataVolume + JSON.stringify(message).length
            }));
        }

        switch (message.type) {
            case 'INITIAL_SYNC':
                handleInitialSync(message);
                break;
            case 'SYNC_EVENT':
                handleSyncEvent(message);
                break;
            case 'CONFLICT_NOTIFICATION':
                handleConflictNotification(message);
                break;
            case 'OFFLINE_SYNC':
                handleOfflineSync(message);
                break;
            case 'PONG':
                handlePong(message);
                break;
            case 'SUBSCRIPTION_CONFIRMED':
                console.log('Subscriptions confirmed:', message.channels);
                break;
            case 'ERROR':
                setError(message.error);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }, [enableMetrics]);

    const handleInitialSync = useCallback((message: any) => {
        console.log('📥 Received initial sync data');
        setSyncVersion(message.version);
        setLastSync(message.timestamp);
        
        // Process initial data and update app state
        if (message.data) {
            // Update scores
            if (message.data.scores) {
                Object.values(message.data.scores).forEach((score: any) => {
                    console.log('📊 Score update received:', { leagueId, score });
                    // Real-time score updates will be handled by event callbacks
                });
            }
            
            // Update player data
            if (message.data.players) {
                Object.values(message.data.players).forEach((player: any) => {
                    console.log('👤 Player update received:', { leagueId, player });
                    // Real-time player updates will be handled by event callbacks
                });
            }
            
            // Update lineups
            if (message.data.lineups) {
                Object.values(message.data.lineups).forEach((lineup: any) => {
                    console.log('📋 Lineup update received:', { leagueId, lineup });
                    // Real-time lineup updates will be handled by event callbacks
                });
            }
        }
    }, [leagueId]);

    const handleSyncEvent = useCallback((message: any) => {
        const event = message.event;
        setSyncVersion(event.version);
        setLastSync(message.timestamp);
        
        // Trigger event-specific callbacks
        const eventType = event.type;
        const callbacks = eventCallbacksRef.current.get(eventType) || [];
        callbacks.forEach(callback => {
            try {
                callback(event.data);
            } catch (error) {
                console.error('Event callback error:', error);
            }
        });
        
        // Update app state based on event type
        switch (eventType) {
            case 'SCORE_UPDATE':
                console.log('📊 Live score update:', { leagueId, score: event.data });
                // Real-time score updates handled via callbacks
                break;
            case 'PLAYER_UPDATE':
                console.log('👤 Player status update:', { leagueId, player: event.data });
                // Real-time player updates handled via callbacks
                break;
            case 'LINEUP_CHANGE':
                console.log('📋 Lineup change:', { leagueId, lineup: event.data });
                // Real-time lineup updates handled via callbacks
                break;
            case 'TRADE_PROPOSAL':
                console.log('🔄 Trade proposal:', { leagueId, trade: event.data });
                // Real-time trade proposals handled via callbacks
                break;
            case 'INJURY_ALERT':
                console.log('🚨 Injury alert:', { leagueId, alert: event.data });
                // Real-time injury alerts handled via callbacks
                break;
        }
    }, [leagueId]);

    const handleConflictNotification = useCallback((message: any) => {
        console.log('⚠️ Conflict detected:', message.conflict);
        setConflicts(prev => [...prev, message.conflict]);
        
        if (enableMetrics) {
            setMetrics(prev => ({
                ...prev,
                conflictsDetected: prev.conflictsDetected + 1
            }));
        }
    }, [enableMetrics]);

    const handleOfflineSync = useCallback((message: any) => {
        console.log('📤 Processing offline sync:', message.events.length, 'events');
        
        // Process offline events
        message.events.forEach((event: any) => {
            handleSyncEvent({ event, timestamp: Date.now() });
        });
        
        // Clear pending events
        setPendingEvents([]);
    }, [handleSyncEvent]);

    const handlePong = useCallback((message: any) => {
        const latency = Date.now() - message.timestamp;
        setConnection(prev => ({ ...prev, latency }));
    }, []);

    // Subscription management
    const subscribe = useCallback((channels: string[]) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        wsRef.current.send(JSON.stringify({
            type: 'SUBSCRIBE',
            channels
        }));
    }, []);

    const unsubscribe = useCallback((channels: string[]) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        wsRef.current.send(JSON.stringify({
            type: 'UNSUBSCRIBE',
            channels
        }));
    }, []);

    // Event sending
    const sendEvent = useCallback((eventType: string, data: any, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM') => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            // Queue for offline sync if enabled
            if (enableOfflineSync) {
                const offlineEvent = {
                    eventType,
                    data,
                    priority,
                    timestamp: Date.now(),
                    version: syncVersion + 1
                };
                setPendingEvents(prev => [...prev, offlineEvent]);
                
                if (enableMetrics) {
                    setMetrics(prev => ({
                        ...prev,
                        offlineEventsQueued: prev.offlineEventsQueued + 1
                    }));
                }
            }
            return;
        }

        const message = {
            type: 'SYNC_EVENT',
            eventType,
            data,
            priority,
            version: syncVersion + 1,
            requiresAck: priority === 'CRITICAL'
        };

        wsRef.current.send(JSON.stringify(message));
        
        if (enableMetrics) {
            setMetrics(prev => ({
                ...prev,
                eventsSent: prev.eventsSent + 1,
                dataVolume: prev.dataVolume + JSON.stringify(message).length
            }));
        }
    }, [enableOfflineSync, syncVersion, enableMetrics]);

    // Conflict resolution
    const resolveConflict = useCallback((conflictId: string, resolution: any) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        wsRef.current.send(JSON.stringify({
            type: 'CONFLICT_RESOLUTION',
            conflictId,
            resolution
        }));
        
        // Remove from local conflicts
        setConflicts(prev => prev.filter(c => c.conflictId !== conflictId));
    }, []);

    // Force sync
    const forceSync = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        wsRef.current.send(JSON.stringify({
            type: 'FORCE_SYNC',
            timestamp: Date.now()
        }));
    }, []);

    // Event callback registration
    const registerEventCallback = useCallback((eventType: string, callback: (data: any) => void) => {
        const callbacks = eventCallbacksRef.current.get(eventType) || [];
        callbacks.push(callback);
        eventCallbacksRef.current.set(eventType, callbacks);
        
        // Return unsubscribe function
        return () => {
            const updatedCallbacks = eventCallbacksRef.current.get(eventType)?.filter(cb => cb !== callback) || [];
            if (updatedCallbacks.length > 0) {
                eventCallbacksRef.current.set(eventType, updatedCallbacks);
            } else {
                eventCallbacksRef.current.delete(eventType);
            }
        };
    }, []);

    // Event handler functions
    const onScoreUpdate = useCallback((callback: (update: any) => void) => {
        return registerEventCallback('SCORE_UPDATE', callback);
    }, [registerEventCallback]);

    const onPlayerUpdate = useCallback((callback: (update: any) => void) => {
        return registerEventCallback('PLAYER_UPDATE', callback);
    }, [registerEventCallback]);

    const onLineupChange = useCallback((callback: (change: any) => void) => {
        return registerEventCallback('LINEUP_CHANGE', callback);
    }, [registerEventCallback]);

    const onTradeProposal = useCallback((callback: (trade: any) => void) => {
        return registerEventCallback('TRADE_PROPOSAL', callback);
    }, [registerEventCallback]);

    const onInjuryAlert = useCallback((callback: (alert: any) => void) => {
        return registerEventCallback('INJURY_ALERT', callback);
    }, [registerEventCallback]);

    // Utility functions
    const startHeartbeat = useCallback(() => {
        heartbeatIntervalRef.current = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'PING',
                    timestamp: Date.now()
                }));
            }
        }, 30000); // 30 seconds
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
    }, []);

    const scheduleReconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        
        const delay = reconnectDelay * Math.pow(2, connection.reconnectCount); // Exponential backoff
        
        reconnectTimeoutRef.current = setTimeout(() => {
            setConnection(prev => ({ ...prev, reconnectCount: prev.reconnectCount + 1 }));
            connect();
        }, delay);
    }, [reconnectDelay, connection.reconnectCount, connect]);

    const processOfflineEvents = useCallback(() => {
        pendingEvents.forEach(event => {
            sendEvent(event.eventType, event.data, event.priority);
        });
        setPendingEvents([]);
    }, [pendingEvents, sendEvent]);

    // Network status monitoring
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            if (autoReconnect && !connection.isConnected) {
                connect();
            }
        };

        const handleOffline = () => {
            setIsOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [autoReconnect, connection.isConnected, connect]);

    // Auto-connect on mount
    useEffect(() => {
        if (!isOffline) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [leagueId, userId]); // Only reconnect when core params change

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        // Connection state
        connection,
        isConnecting,
        isOffline,
        error,
        
        // Data state
        syncVersion,
        lastSync,
        pendingEvents,
        conflicts,
        
        // Metrics
        metrics,
        
        // Actions
        connect,
        disconnect,
        subscribe,
        unsubscribe,
        sendEvent,
        resolveConflict,
        forceSync,
        
        // Event handlers
        onScoreUpdate,
        onPlayerUpdate,
        onLineupChange,
        onTradeProposal,
        onInjuryAlert
    };
}
