/**
 * Custom hook for Oracle WebSocket connection management
 * Handles connection, reconnection, message routing, and status tracking
 */

import { useRef, useCallback, useEffect, useState } from 'react';

export interface OracleWebSocketMessage {
    type: string;
    [key: string]: any;
}

export interface OracleWebSocketConfig {
    userId: string;
    week: number;
    onMessage: (data: OracleWebSocketMessage) => void;
    onError?: (error: string) => void;
    reconnectDelay?: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export interface UseOracleWebSocketReturn {
    connectionStatus: ConnectionStatus;
    sendMessage: (message: OracleWebSocketMessage) => void;
    reconnect: () => void;
    disconnect: () => void;
}

export const useOracleWebSocket = ({
    userId,
    week,
    onMessage,
    onError,
    reconnectDelay = 3000
}: OracleWebSocketConfig): UseOracleWebSocketReturn => {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const wsRef = useRef<WebSocket | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);

    // Send message to WebSocket
    const sendMessage = useCallback((message: OracleWebSocketMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            try {
                wsRef.current.send(JSON.stringify(message));
            } catch (error) {
                console.error('Failed to send WebSocket message:', error);
                onError?.('Failed to send message');
            }
        } else {
            console.warn('WebSocket not connected, message not sent:', message);
            onError?.('WebSocket not connected');
        }
    }, [onError]);

    // Initialize WebSocket connection
    const connect = useCallback(() => {
        if (!userId || !mountedRef.current) return;

        // Clear any existing retry timeout
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        setConnectionStatus('connecting');
        
        try {
            const wsUrl = `ws://localhost:8766?userId=${userId}&week=${week}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                if (!mountedRef.current) return;
                
                console.log('✅ Oracle WebSocket connected');
                setConnectionStatus('connected');
                
                // Send initial subscription
                sendMessage({
                    type: 'SUBSCRIBE_PREDICTIONS',
                    week,
                    userId
                });
            };

            wsRef.current.onmessage = (event) => {
                if (!mountedRef.current) return;
                
                try {
                    const data = JSON.parse(event.data);
                    onMessage(data);
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                    onError?.('Failed to parse message');
                }
            };

            wsRef.current.onclose = (event) => {
                if (!mountedRef.current) return;
                
                console.log('🔌 Oracle WebSocket disconnected', event.code, event.reason);
                setConnectionStatus('disconnected');
                
                // Auto-reconnect unless it was a clean close
                if (event.code !== 1000 && mountedRef.current) {
                    retryTimeoutRef.current = setTimeout(() => {
                        if (mountedRef.current) {
                            connect();
                        }
                    }, reconnectDelay);
                }
            };

            wsRef.current.onerror = (error) => {
                if (!mountedRef.current) return;
                
                console.error('Oracle WebSocket error:', error);
                setConnectionStatus('disconnected');
                onError?.('WebSocket connection failed');
            };
        } catch (err) {
            if (!mountedRef.current) return;
            
            console.error('Failed to initialize WebSocket:', err);
            setConnectionStatus('disconnected');
            onError?.('Failed to establish real-time connection');
        }
    }, [userId, week, onMessage, onError, reconnectDelay, sendMessage]);

    // Manual reconnect
    const reconnect = useCallback(() => {
        connect();
    }, [connect]);

    // Manual disconnect
    const disconnect = useCallback(() => {
        mountedRef.current = false;
        
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
        
        if (wsRef.current) {
            wsRef.current.close(1000, 'Manual disconnect');
            wsRef.current = null;
        }
        
        setConnectionStatus('disconnected');
    }, []);

    // Initialize connection on mount
    useEffect(() => {
        mountedRef.current = true;
        connect();

        return () => {
            mountedRef.current = false;
            
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounting');
            }
        };
    }, [connect]);

    // Reconnect when userId or week changes
    useEffect(() => {
        if (connectionStatus !== 'disconnected') {
            reconnect();
        }
    }, [userId, week, reconnect, connectionStatus]);

    return {
        connectionStatus,
        sendMessage,
        reconnect,
        disconnect
    };
};
