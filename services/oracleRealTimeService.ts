/**
 * Enhanced Oracle Real-Time Service
 * Comprehensive real-time features for live prediction updates, collaborative interactions, and instant notifications
 */

import { EventEmitter } from 'events';

// Use browser's native WebSocket API instead of Node.js 'ws' package
declare global {
    interface Window {
        WebSocket: typeof WebSocket;
    }
}

export interface OracleRealtimeUser {
    id: string;
    username: string;
    playerNumber: number;
    avatar?: string;
    isOnline: boolean;
    currentPrediction?: string;
    lastActivity: number;
    preferences: {
        notifications: boolean;
        collaborativeUpdates: boolean;
        liveLeaderboard: boolean;
    };
}

export interface LivePredictionUpdate {
    id: string;
    type: 'PREDICTION_CREATED' | 'PREDICTION_UPDATED' | 'DEADLINE_WARNING' | 'RESULT_ANNOUNCED' | 
          'USER_SUBMISSION' | 'CONSENSUS_SHIFTED' | 'PARTICIPATION_MILESTONE' | 'ORACLE_CONFIDENCE_CHANGE';
    predictionId: string;
    timestamp: string;
    
    // Update-specific data
    data?: {
        predictionData?: any;
        userSubmission?: {
            userId: string;
            username: string;
            choice: number;
            confidence: number;
            timestamp: string;
        };
        consensusData?: {
            previousChoice: number;
            newChoice: number;
            confidence: number;
            participantCount: number;
        };
        resultData?: {
            correctChoice: number;
            accuracy: number;
            pointsAwarded: number[];
            leaderboardChanges: any[];
        };
        oracleUpdate?: {
            previousChoice: number;
            newChoice: number;
            previousConfidence: number;
            newConfidence: number;
            reasoning: string;
        };
    };
    
    // Target audience
    targetUsers?: string[];
    broadcastType: 'ALL' | 'PARTICIPANTS' | 'WEEK_SUBSCRIBERS' | 'SPECIFIC_USERS';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface CollaborativeSession {
    id: string;
    predictionId: string;
    week: number;
    participants: OracleRealtimeUser[];
    createdAt: string;
    status: 'ACTIVE' | 'PAUSED' | 'ENDED';
    features: {
        liveDiscussion: boolean;
        sharedAnalysis: boolean;
        realTimePolling: boolean;
        communityInsights: boolean;
    };
    metrics: {
        totalParticipants: number;
        activeParticipants: number;
        messagesExchanged: number;
        consensusReached: boolean;
        engagementScore: number;
    };
}

export interface LiveNotification {
    id: string;
    type: 'INSTANT' | 'SCHEDULED' | 'REMINDER' | 'MILESTONE' | 'SOCIAL';
    title: string;
    message: string;
    category: 'PREDICTION' | 'ACHIEVEMENT' | 'SOCIAL' | 'SYSTEM' | 'DEADLINE';
    severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    targetUserId?: string;
    predictionId?: string;
    timestamp: string;
    expiresAt?: string;
    actionUrl?: string;
    data?: any;
    deliveryChannels: ('WEBSOCKET' | 'PUSH' | 'IN_APP' | 'EMAIL')[];
    status: 'PENDING' | 'DELIVERED' | 'READ' | 'DISMISSED';
}

export interface RealTimeMetrics {
    activePredictions: number;
    liveParticipants: number;
    notificationsDelivered: number;
    collaborativeSessions: number;
    averageResponseTime: number;
    consensusReachedCount: number;
    engagementScore: number;
    lastUpdated: number;
}

export interface OracleEventStream {
    eventId: string;
    eventType: string;
    predictionId: string;
    userId?: string;
    eventData: any;
    timestamp: number;
    sequence: number;
}

class OracleRealTimeService extends EventEmitter {
    private isInitialized = false;
    private readonly websocketServer: any;
    private readonly activeConnections: Map<string, WebSocket> = new Map();
    private readonly userSessions: Map<string, OracleRealtimeUser> = new Map();
    private readonly livePredictions: Map<string, any> = new Map();
    private readonly collaborativeSessions: Map<string, CollaborativeSession> = new Map();
    private notificationQueue: LiveNotification[] = [];
    private readonly eventStream: OracleEventStream[] = [];
    private readonly metrics: RealTimeMetrics;

    // Real-time tracking
    private readonly participantCounts: Map<string, number> = new Map(); // predictionId -> count
    private readonly consensusData: Map<string, any> = new Map(); // predictionId -> consensus info
    private readonly deadlineTimers: Map<string, NodeJS.Timeout> = new Map(); // predictionId -> timer
    private readonly liveLeaderboard: Map<string, any> = new Map(); // userId -> stats
    
    // Performance optimization
    private readonly updateBuffers: Map<string, LivePredictionUpdate[]> = new Map();
    private readonly batchInterval = 100; // milliseconds
    private readonly maxBatchSize = 10;

    constructor() {
        super();
        
        this.metrics = {
            activePredictions: 0,
            liveParticipants: 0,
            notificationsDelivered: 0,
            collaborativeSessions: 0,
            averageResponseTime: 0,
            consensusReachedCount: 0,
            engagementScore: 0,
            lastUpdated: Date.now()
        };

        this.setupEventHandlers();
        this.startMetricsCollection();
        
        console.log('🔮 Oracle Real-Time Service initialized');
    }

    /**
     * Initialize the real-time service
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Setup WebSocket server integration
            await this.setupWebSocketIntegration();
            
            // Initialize notification system
            await this.initializeNotificationSystem();
            
            // Setup prediction lifecycle handlers
            this.setupPredictionLifecycleHandlers();
            
            // Start background processes
            this.startBackgroundProcesses();
            
            this.isInitialized = true;
            console.log('✅ Oracle Real-Time Service fully initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Oracle Real-Time Service:', error);
            throw error;
        }
    }

    /**
     * Setup WebSocket integration for real-time communication
     */
    private async setupWebSocketIntegration(): Promise<void> {
        // Integrate with existing WebSocket servers
        this.emit('websocket_integration_ready');
        
        // Setup message routing
        this.setupMessageRouting();
        
        console.log('🔌 WebSocket integration configured');
    }

    /**
     * Register a user for real-time updates
     */
    async registerUser(userId: string, userInfo: Partial<OracleRealtimeUser>, ws?: WebSocket): Promise<void> {
        const user: OracleRealtimeUser = {
            id: userId,
            username: userInfo.username || `User${userId}`,
            playerNumber: userInfo.playerNumber || 0,
            avatar: userInfo.avatar,
            isOnline: true,
            lastActivity: Date.now(),
            preferences: {
                notifications: true,
                collaborativeUpdates: true,
                liveLeaderboard: true,
                ...userInfo.preferences
            }
        };

        this.userSessions.set(userId, user);
        
        if (ws) {
            this.activeConnections.set(userId, ws);
            
            // Setup WebSocket event handlers for this user
            ws.addEventListener('message', (event: MessageEvent) => this.handleUserMessage(userId, event.data));
            ws.addEventListener('close', () => this.handleUserDisconnect(userId));
            ws.addEventListener('error', (error: Event) => this.handleUserError(userId, error));
        }

        // Send welcome message
        await this.sendUserNotification(userId, {
            id: `welcome-${Date.now()}`,
            type: 'INSTANT',
            title: '🔮 Oracle Real-Time Connected',
            message: 'You\'re now connected to live prediction updates!',
            category: 'SYSTEM',
            severity: 'SUCCESS',
            timestamp: new Date().toISOString(),
            deliveryChannels: ['WEBSOCKET', 'IN_APP'],
            status: 'PENDING'
        });

        this.updateMetrics();
        
        console.log(`👤 User ${userId} registered for real-time updates`);
    }

    /**
     * Subscribe user to specific prediction updates
     */
    async subscribeToPrediction(userId: string, predictionId: string): Promise<void> {
        const user = this.userSessions.get(userId);
        if (!user) return;

        user.currentPrediction = predictionId;
        user.lastActivity = Date.now();

        // Add to prediction participants
        const currentCount = this.participantCounts.get(predictionId) || 0;
        this.participantCounts.set(predictionId, currentCount + 1);

        // Notify others of new participant
        await this.broadcastLiveUpdate({
            id: `participant-${Date.now()}`,
            type: 'USER_SUBMISSION',
            predictionId,
            timestamp: new Date().toISOString(),
            data: {
                userSubmission: {
                    userId,
                    username: user.username,
                    choice: -1, // Not submitted yet
                    confidence: 0,
                    timestamp: new Date().toISOString()
                }
            },
            broadcastType: 'PARTICIPANTS',
            priority: 'LOW'
        });

        console.log(`📍 User ${userId} subscribed to prediction ${predictionId}`);
    }

    /**
     * Handle real-time prediction submission
     */
    async handlePredictionSubmission(
        userId: string,
        predictionId: string,
        choice: number,
        confidence: number,
        reasoning?: string
    ): Promise<void> {
        const user = this.userSessions.get(userId);
        if (!user) return;

        // Update user activity
        user.lastActivity = Date.now();

        // Create submission update
        const submissionUpdate: LivePredictionUpdate = {
            id: `submission-${userId}-${Date.now()}`,
            type: 'USER_SUBMISSION',
            predictionId,
            timestamp: new Date().toISOString(),
            data: {
                userSubmission: {
                    userId,
                    username: user.username,
                    choice,
                    confidence,
                    timestamp: new Date().toISOString()
                }
            },
            broadcastType: 'PARTICIPANTS',
            priority: 'MEDIUM'
        };

        // Broadcast to other participants
        await this.broadcastLiveUpdate(submissionUpdate);

        // Update consensus calculation
        await this.updateConsensusData(predictionId);

        // Check for participation milestones
        await this.checkParticipationMilestones(predictionId);

        // Send confirmation to user
        await this.sendUserNotification(userId, {
            id: `submission-confirm-${Date.now()}`,
            type: 'INSTANT',
            title: '✅ Prediction Submitted',
            message: `Your prediction for "${await this.getPredictionTitle(predictionId)}" has been recorded!`,
            category: 'PREDICTION',
            severity: 'SUCCESS',
            predictionId,
            timestamp: new Date().toISOString(),
            deliveryChannels: ['WEBSOCKET', 'IN_APP'],
            status: 'PENDING'
        });

        console.log(`🎯 User ${userId} submitted prediction for ${predictionId}`);
    }

    /**
     * Update consensus data for a prediction
     */
    private async updateConsensusData(predictionId: string): Promise<void> {
        // Get all submissions for this prediction
        const submissions = await this.getPredictionSubmissions(predictionId);
        
        if (submissions.length === 0) return;

        // Calculate consensus
        const choiceCounts = new Map<number, number>();
        let totalConfidence = 0;
        
        submissions.forEach(sub => {
            choiceCounts.set(sub.choice, (choiceCounts.get(sub.choice) || 0) + 1);
            totalConfidence += sub.confidence;
        });

        const majorityChoice = Array.from(choiceCounts.entries())
            .sort((a, b) => b[1] - a[1])[0];

        const averageConfidence = totalConfidence / submissions.length;

        const previousConsensus = this.consensusData.get(predictionId);
        const newConsensus = {
            choice: majorityChoice[0],
            confidence: Math.round(averageConfidence),
            participantCount: submissions.length,
            distribution: Object.fromEntries(choiceCounts)
        };

        this.consensusData.set(predictionId, newConsensus);

        // Check if consensus has shifted significantly
        if (previousConsensus && 
            (previousConsensus.choice !== newConsensus.choice || 
             Math.abs(previousConsensus.confidence - newConsensus.confidence) >= 10)) {
            
            await this.broadcastLiveUpdate({
                id: `consensus-shift-${Date.now()}`,
                type: 'CONSENSUS_SHIFTED',
                predictionId,
                timestamp: new Date().toISOString(),
                data: {
                    consensusData: {
                        previousChoice: previousConsensus.choice,
                        newChoice: newConsensus.choice,
                        confidence: newConsensus.confidence,
                        participantCount: newConsensus.participantCount
                    }
                },
                broadcastType: 'PARTICIPANTS',
                priority: 'HIGH'
            });
        }
    }

    /**
     * Handle Oracle confidence/choice changes
     */
    async handleOracleUpdate(
        predictionId: string,
        newChoice: number,
        newConfidence: number,
        reasoning: string,
        previousChoice?: number,
        previousConfidence?: number
    ): Promise<void> {
        const oracleUpdate: LivePredictionUpdate = {
            id: `oracle-update-${Date.now()}`,
            type: 'ORACLE_CONFIDENCE_CHANGE',
            predictionId,
            timestamp: new Date().toISOString(),
            data: {
                oracleUpdate: {
                    previousChoice: previousChoice || -1,
                    newChoice,
                    previousConfidence: previousConfidence || 0,
                    newConfidence,
                    reasoning
                }
            },
            broadcastType: 'PARTICIPANTS',
            priority: 'HIGH'
        };

        await this.broadcastLiveUpdate(oracleUpdate);

        // Send notifications to users who predicted differently
        const affectedUsers = await this.getUsersWithDifferentPredictions(predictionId, newChoice);
        
        for (const userId of affectedUsers) {
            await this.sendUserNotification(userId, {
                id: `oracle-change-${userId}-${Date.now()}`,
                type: 'INSTANT',
                title: '🔮 Oracle Updated Prediction',
                message: `The Oracle has updated its prediction. New confidence: ${newConfidence}%`,
                category: 'PREDICTION',
                severity: 'WARNING',
                predictionId,
                timestamp: new Date().toISOString(),
                actionUrl: `/oracle?prediction=${predictionId}`,
                deliveryChannels: ['WEBSOCKET', 'PUSH', 'IN_APP'],
                status: 'PENDING'
            });
        }

        console.log(`🔮 Oracle updated prediction ${predictionId}: ${newChoice} (${newConfidence}%)`);
    }

    /**
     * Schedule deadline notifications
     */
    async scheduleDeadlineNotifications(
        predictionId: string,
        expiresAt: string,
        question: string
    ): Promise<void> {
        const expireTime = new Date(expiresAt).getTime();
        const now = Date.now();
        
        // Schedule notifications at different intervals
        const intervals = [
            { time: 60 * 60 * 1000, label: '1 hour' },    // 1 hour before
            { time: 30 * 60 * 1000, label: '30 minutes' }, // 30 minutes before
            { time: 15 * 60 * 1000, label: '15 minutes' }, // 15 minutes before
            { time: 5 * 60 * 1000, label: '5 minutes' },   // 5 minutes before
            { time: 60 * 1000, label: '1 minute' }         // 1 minute before
        ];

        intervals.forEach(interval => {
            const notifyTime = expireTime - interval.time;
            
            if (notifyTime > now) {
                const timer = setTimeout(async () => {
                    await this.sendDeadlineWarning(predictionId, question, interval.label);
                }, notifyTime - now);

                // Store timer for cleanup
                this.deadlineTimers.set(`${predictionId}-${interval.time}`, timer);
            }
        });

        console.log(`⏰ Scheduled deadline notifications for prediction ${predictionId}`);
    }

    /**
     * Send deadline warning notifications
     */
    private async sendDeadlineWarning(
        predictionId: string,
        question: string,
        timeRemaining: string
    ): Promise<void> {
        const participants = await this.getPredictionParticipants(predictionId);
        const unsubmittedUsers = participants.filter(p => !p.hasSubmitted);

        const deadlineUpdate: LivePredictionUpdate = {
            id: `deadline-warning-${Date.now()}`,
            type: 'DEADLINE_WARNING',
            predictionId,
            timestamp: new Date().toISOString(),
            broadcastType: 'PARTICIPANTS',
            priority: 'URGENT'
        };

        await this.broadcastLiveUpdate(deadlineUpdate);

        // Send targeted notifications to unsubmitted users
        for (const user of unsubmittedUsers) {
            await this.sendUserNotification(user.userId, {
                id: `deadline-${user.userId}-${Date.now()}`,
                type: 'REMINDER',
                title: '⏰ Prediction Deadline Approaching',
                message: `"${question}" expires in ${timeRemaining}!`,
                category: 'DEADLINE',
                severity: 'WARNING',
                predictionId,
                timestamp: new Date().toISOString(),
                actionUrl: `/oracle?prediction=${predictionId}`,
                deliveryChannels: ['WEBSOCKET', 'PUSH', 'IN_APP'],
                status: 'PENDING'
            });
        }

        console.log(`⚠️ Sent deadline warning for prediction ${predictionId} (${timeRemaining} remaining)`);
    }

    /**
     * Handle prediction result announcement
     */
    async announcePredictionResult(
        predictionId: string,
        correctChoice: number,
        resultData: any
    ): Promise<void> {
        // Clear deadline timers
        this.clearDeadlineTimers(predictionId);

        // Get all participants
        const participants = await this.getPredictionParticipants(predictionId);
        
        // Calculate points and accuracy
        const leaderboardChanges = await this.calculateLeaderboardChanges(
            predictionId, 
            correctChoice, 
            participants
        );

        // Broadcast result to all participants
        const resultUpdate: LivePredictionUpdate = {
            id: `result-${predictionId}-${Date.now()}`,
            type: 'RESULT_ANNOUNCED',
            predictionId,
            timestamp: new Date().toISOString(),
            data: {
                resultData: {
                    correctChoice,
                    accuracy: resultData.accuracy || 0,
                    pointsAwarded: resultData.pointsAwarded || [],
                    leaderboardChanges
                }
            },
            broadcastType: 'PARTICIPANTS',
            priority: 'HIGH'
        };

        await this.broadcastLiveUpdate(resultUpdate);

        // Send personalized result notifications
        for (const participant of participants) {
            const isCorrect = participant.choice === correctChoice;
            const pointsEarned = this.calculatePointsEarned(participant, isCorrect);

            await this.sendUserNotification(participant.userId, {
                id: `result-${participant.userId}-${Date.now()}`,
                type: 'INSTANT',
                title: isCorrect ? '🎉 Correct Prediction!' : '📊 Prediction Result',
                message: isCorrect 
                    ? `You were right! Earned ${pointsEarned} points.`
                    : `The correct answer was revealed. Better luck next time!`,
                category: 'PREDICTION',
                severity: isCorrect ? 'SUCCESS' : 'INFO',
                predictionId,
                timestamp: new Date().toISOString(),
                actionUrl: '/oracle/analytics',
                deliveryChannels: ['WEBSOCKET', 'PUSH', 'IN_APP'],
                status: 'PENDING',
                data: { isCorrect, pointsEarned }
            });
        }

        // Update metrics
        this.updateResultMetrics(predictionId, participants, correctChoice);

        console.log(`🏁 Announced results for prediction ${predictionId}`);
    }

    /**
     * Broadcast live update to appropriate audience
     */
    private async broadcastLiveUpdate(update: LivePredictionUpdate): Promise<void> {
        // Add to event stream
        this.eventStream.push({
            eventId: update.id,
            eventType: update.type,
            predictionId: update.predictionId,
            eventData: update.data,
            timestamp: Date.now(),
            sequence: this.eventStream.length
        });

        // Determine target users
        let targetUsers: string[] = [];
        
        switch (update.broadcastType) {
            case 'ALL':
                targetUsers = Array.from(this.userSessions.keys());
                break;
            case 'PARTICIPANTS':
                targetUsers = await this.getPredictionParticipantIds(update.predictionId);
                break;
            case 'WEEK_SUBSCRIBERS':
                targetUsers = await this.getWeekSubscriberIds(await this.getPredictionWeek(update.predictionId));
                break;
            case 'SPECIFIC_USERS':
                targetUsers = update.targetUsers || [];
                break;
        }

        // Buffer updates for batch delivery
        this.bufferUpdate(update, targetUsers);
    }

    /**
     * Buffer updates for efficient batch delivery
     */
    private bufferUpdate(update: LivePredictionUpdate, targetUsers: string[]): void {
        targetUsers.forEach(userId => {
            if (!this.updateBuffers.has(userId)) {
                this.updateBuffers.set(userId, []);
            }
            
            const userBuffer = this.updateBuffers.get(userId);
            if (!userBuffer) return;
            
            userBuffer.push(update);

            // Trigger immediate delivery for high priority updates
            if (update.priority === 'URGENT' || userBuffer.length >= this.maxBatchSize) {
                this.flushUserBuffer(userId);
            }
        });
    }

    /**
     * Flush update buffer for a specific user
     */
    private async flushUserBuffer(userId: string): Promise<void> {
        const buffer = this.updateBuffers.get(userId);
        if (!buffer || buffer.length === 0) return;

        const ws = this.activeConnections.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                const batchMessage = {
                    type: 'ORACLE_BATCH_UPDATE',
                    updates: buffer,
                    timestamp: new Date().toISOString(),
                    count: buffer.length
                };

                ws.send(JSON.stringify(batchMessage));
                
                // Clear buffer
                this.updateBuffers.set(userId, []);
                
            } catch (error) {
                console.error(`Failed to send batch update to user ${userId}:`, error);
                this.handleUserError(userId, error);
            }
        }
    }

    /**
     * Send notification to specific user
     */
    private async sendUserNotification(userId: string, notification: LiveNotification): Promise<void> {
        // Add to notification queue
        this.notificationQueue.push(notification);

        // Process notification through delivery channels
        await this.processNotificationDelivery(userId, notification);

        this.metrics.notificationsDelivered++;
    }

    /**
     * Process notification delivery through multiple channels
     */
    private async processNotificationDelivery(userId: string, notification: LiveNotification): Promise<void> {
        const user = this.userSessions.get(userId);
        if (!user?.preferences?.notifications) return;

        for (const channel of notification.deliveryChannels) {
            switch (channel) {
                case 'WEBSOCKET':
                    await this.deliverWebSocketNotification(userId, notification);
                    break;
                case 'PUSH':
                    await this.deliverPushNotification(userId, notification);
                    break;
                case 'IN_APP':
                    await this.deliverInAppNotification(userId, notification);
                    break;
                case 'EMAIL':
                    await this.deliverEmailNotification(userId, notification);
                    break;
            }
        }
    }

    /**
     * Deliver WebSocket notification
     */
    private async deliverWebSocketNotification(userId: string, notification: LiveNotification): Promise<void> {
        const ws = this.activeConnections.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                const message = {
                    type: 'ORACLE_NOTIFICATION',
                    notification,
                    timestamp: new Date().toISOString()
                };

                ws.send(JSON.stringify(message));
                notification.status = 'DELIVERED';
                
            } catch (error) {
                console.error(`Failed to deliver WebSocket notification to ${userId}:`, error);
            }
        }
    }

    /**
     * Start background processes
     */
    private startBackgroundProcesses(): void {
        // Batch update flushing
        setInterval(() => {
            this.flushAllBuffers();
        }, this.batchInterval);

        // Metrics collection
        setInterval(() => {
            this.collectMetrics();
        }, 30000); // Every 30 seconds

        // Cleanup expired notifications
        setInterval(() => {
            this.cleanupExpiredNotifications();
        }, 60000); // Every minute

        // Update user activity status
        setInterval(() => {
            this.updateUserActivityStatus();
        }, 10000); // Every 10 seconds

        console.log('🔄 Background processes started');
    }

    /**
     * Flush all user buffers
     */
    private async flushAllBuffers(): Promise<void> {
        const userIds = Array.from(this.updateBuffers.keys());
        
        await Promise.all(
            userIds.map(userId => this.flushUserBuffer(userId))
        );
    }

    /**
     * Setup event handlers for lifecycle management
     */
    private setupEventHandlers(): void {
        // Prediction lifecycle events
        this.on('prediction_created', this.handlePredictionCreated.bind(this));
        this.on('prediction_updated', this.handlePredictionUpdated.bind(this));
        this.on('prediction_expired', this.handlePredictionExpired.bind(this));
        this.on('prediction_resolved', this.handlePredictionResolved.bind(this));

        // User interaction events
        this.on('user_joined', this.handleUserJoined.bind(this));
        this.on('user_submitted', this.handleUserSubmitted.bind(this));
        this.on('user_disconnected', this.handleUserDisconnected.bind(this));

        // System events
        this.on('system_maintenance', this.handleSystemMaintenance.bind(this));
        this.on('oracle_updated', this.handleOracleUpdated.bind(this));
    }

    /**
     * Setup message routing for WebSocket communications
     */
    private setupMessageRouting(): void {
        // Route messages to appropriate handlers
        this.emit('message_routing_configured');
    }

    /**
     * Handle user message from WebSocket
     */
    private async handleUserMessage(userId: string, data: Buffer): Promise<void> {
        try {
            const message = JSON.parse(data.toString());
            
            switch (message.type) {
                case 'PING':
                    await this.handlePing(userId);
                    break;
                case 'SUBSCRIBE_PREDICTION':
                    await this.subscribeToPrediction(userId, message.predictionId);
                    break;
                case 'SUBMIT_PREDICTION':
                    await this.handlePredictionSubmission(
                        userId,
                        message.predictionId,
                        message.choice,
                        message.confidence,
                        message.reasoning
                    );
                    break;
                case 'REQUEST_LIVE_DATA':
                    await this.sendLiveData(userId, message.predictionId);
                    break;
                default:
                    console.log(`Unknown message type from ${userId}:`, message.type);
            }

        } catch (error) {
            console.error(`Error handling message from ${userId}:`, error);
        }
    }

    /**
     * Handle user disconnect
     */
    private handleUserDisconnect(userId: string): void {
        const user = this.userSessions.get(userId);
        if (user) {
            user.isOnline = false;
            user.lastActivity = Date.now();
        }

        this.activeConnections.delete(userId);
        this.updateMetrics();
        
        console.log(`👤 User ${userId} disconnected`);
    }

    /**
     * Handle user error
     */
    private handleUserError(userId: string, error: any): void {
        console.error(`User ${userId} connection error:`, error);
        this.handleUserDisconnect(userId);
    }

    /**
     * Update real-time metrics
     */
    private updateMetrics(): void {
        this.metrics.liveParticipants = this.activeConnections.size;
        this.metrics.activePredictions = this.livePredictions.size;
        this.metrics.collaborativeSessions = this.collaborativeSessions.size;
        this.metrics.lastUpdated = Date.now();
    }

    /**
     * Collect detailed metrics
     */
    private collectMetrics(): void {
        // Calculate engagement score
        const activeUsers = Array.from(this.userSessions.values())
            .filter(user => user.isOnline && (Date.now() - user.lastActivity) < 60000);
        
        this.metrics.engagementScore = activeUsers.length > 0 
            ? (activeUsers.length / this.userSessions.size) * 100 
            : 0;

        // Calculate average response time
        // This would be calculated based on actual response time tracking
        this.metrics.averageResponseTime = 150; // placeholder

        this.emit('metrics_updated', this.metrics);
    }

    /**
     * Get real-time metrics
     */
    getMetrics(): RealTimeMetrics {
        return { ...this.metrics };
    }

    /**
     * Get active user sessions
     */
    getActiveSessions(): OracleRealtimeUser[] {
        return Array.from(this.userSessions.values())
            .filter(user => user.isOnline);
    }

    /**
     * Get event stream for debugging/monitoring
     */
    getEventStream(limit: number = 100): OracleEventStream[] {
        return this.eventStream.slice(-limit);
    }

    // Helper methods (implement based on your database/API structure)
    private async getPredictionTitle(predictionId: string): Promise<string> {
        // Implement based on your prediction storage
        return `Prediction ${predictionId}`;
    }

    private async getPredictionSubmissions(predictionId: string): Promise<any[]> {
        // Implement based on your database
        return [];
    }

    private async getPredictionParticipants(predictionId: string): Promise<any[]> {
        // Implement based on your database
        return [];
    }

    private async getPredictionParticipantIds(predictionId: string): Promise<string[]> {
        return [];
    }

    private async getWeekSubscriberIds(week: number): Promise<string[]> {
        return [];
    }

    private async getPredictionWeek(predictionId: string): Promise<number> {
        return 1;
    }

    private async getUsersWithDifferentPredictions(predictionId: string, oracleChoice: number): Promise<string[]> {
        return [];
    }

    private async checkParticipationMilestones(predictionId: string): Promise<void> {
        // Implementation for milestone checking
    }

    private async calculateLeaderboardChanges(predictionId: string, correctChoice: number, participants: any[]): Promise<any[]> {
        return [];
    }

    private calculateCorrectPredictionPoints(participant: any): number {
        return 10; // Base points for correct prediction
    }

    private calculateIncorrectPredictionPoints(participant: any): number {
        return 0; // No points for incorrect prediction
    }

    private calculatePointsEarned(participant: any, isCorrect: boolean): number {
        if (isCorrect) {
            return this.calculateCorrectPredictionPoints(participant);
        }
        return this.calculateIncorrectPredictionPoints(participant);
    }

    private clearDeadlineTimers(predictionId: string): void {
        Array.from(this.deadlineTimers.keys())
            .filter(key => key.startsWith(predictionId))
            .forEach(key => {
                const timer = this.deadlineTimers.get(key);
                if (timer) {
                    clearTimeout(timer);
                    this.deadlineTimers.delete(key);
                }
            });
    }

    private updateResultMetrics(predictionId: string, participants: any[], correctChoice: number): void {
        // Update metrics based on results
        this.updateMetrics();
    }

    private async initializeNotificationSystem(): Promise<void> {
        // Initialize notification delivery system
        console.log('📢 Notification system initialized');
    }

    private setupPredictionLifecycleHandlers(): void {
        // Setup handlers for prediction lifecycle events
        console.log('🔄 Prediction lifecycle handlers configured');
    }

    private startMetricsCollection(): void {
        // Start metrics collection
        console.log('📊 Metrics collection started');
    }

    private async deliverPushNotification(userId: string, notification: LiveNotification): Promise<void> {
        // Implement push notification delivery
    }

    private async deliverInAppNotification(userId: string, notification: LiveNotification): Promise<void> {
        // Implement in-app notification delivery
    }

    private async deliverEmailNotification(userId: string, notification: LiveNotification): Promise<void> {
        // Implement email notification delivery
    }

    private cleanupExpiredNotifications(): void {
        const now = Date.now();
        this.notificationQueue = this.notificationQueue.filter(notif => {
            if (notif.expiresAt) {
                return new Date(notif.expiresAt).getTime() > now;
            }
            return true;
        });
    }

    private updateUserActivityStatus(): void {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        this.userSessions.forEach(user => {
            if (user.isOnline && user.lastActivity < fiveMinutesAgo) {
                user.isOnline = false;
            }
        });
    }

    private async handlePing(userId: string): Promise<void> {
        const user = this.userSessions.get(userId);
        if (user) {
            user.lastActivity = Date.now();
        }

        const ws = this.activeConnections.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'PONG',
                timestamp: new Date().toISOString()
            }));
        }
    }

    private async sendLiveData(userId: string, predictionId: string): Promise<void> {
        const ws = this.activeConnections.get(userId);
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const liveData = {
            type: 'LIVE_DATA',
            predictionId,
            participants: this.participantCounts.get(predictionId) || 0,
            consensus: this.consensusData.get(predictionId),
            timestamp: new Date().toISOString()
        };

        ws.send(JSON.stringify(liveData));
    }

    // Event lifecycle handlers
    private async handlePredictionCreated(data: any): Promise<void> {
        console.log('📝 Prediction created:', data.predictionId);
    }

    private async handlePredictionUpdated(data: any): Promise<void> {
        console.log('✏️ Prediction updated:', data.predictionId);
    }

    private async handlePredictionExpired(data: any): Promise<void> {
        console.log('⏰ Prediction expired:', data.predictionId);
    }

    private async handlePredictionResolved(data: any): Promise<void> {
        console.log('🏁 Prediction resolved:', data.predictionId);
    }

    private async handleUserJoined(data: any): Promise<void> {
        console.log('👋 User joined:', data.userId);
    }

    private async handleUserSubmitted(data: any): Promise<void> {
        console.log('📤 User submitted:', data.userId, data.predictionId);
    }

    private async handleUserDisconnected(data: any): Promise<void> {
        console.log('👋 User disconnected:', data.userId);
    }

    private async handleSystemMaintenance(data: any): Promise<void> {
        console.log('🔧 System maintenance:', data);
    }

    private async handleOracleUpdated(data: any): Promise<void> {
        console.log('🔮 Oracle updated:', data);
    }
}

// Create and export singleton instance
export const oracleRealTimeService = new OracleRealTimeService();
export default oracleRealTimeService;
