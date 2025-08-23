/**
 * Oracle API Client
 * Handles communication with the enhanced Oracle backend API
 */

// Re-export types needed by components
export interface PredictionResponse {
    id: string;
    week: number;
    season: number;
    type: string;
    question: string;
    options: string[];
    oracleChoice: number;
    oracleConfidence: number;
    oracleReasoning: string;
    dataPoints: any[];
    expiresAt?: string;
    status?: string;
    participantsCount?: number;
    consensusChoice?: number;
    consensusConfidence?: number;
    userSubmission?: {
        choice: number;
        confidence: number;
        submittedAt: string;
    };
    playerPrediction?: {
        choice: number;
        confidence: number;
        submittedAt: string;
    };
}

export interface CreateOraclePredictionRequest {
    id: string;
    week: number;
    season?: number;
    type: string;
    category?: string;
    question: string;
    description?: string;
    options: string[];
    oracleChoice: number;
    oracleConfidence: number;
    oracleReasoning: string;
    dataPoints: any[];
    difficultyLevel?: number;
    pointsMultiplier?: number;
    expiresAt: string;
    tags?: string[];
    metadata?: any;
}

export interface SubmitPredictionRequest {
    predictionId: string;
    playerNumber: number;
    choice: number;
    confidence: number;
    reasoning?: string;
}

export interface OracleApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface WeeklyPredictionsResponse {
    success: boolean;
    data: PredictionResponse[];
    week: number;
    season: number;
    count: number;
}

export interface UserStatsResponse {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    totalPoints: number;
    currentStreak: number;
    bestStreak: number;
    oracleBeats: number;
    averageConfidence: number;
}

export interface LeaderboardEntry {
    playerNumber: number;
    username: string;
    emoji: string;
    colorTheme: string;
    rank: number;
    points: number;
    accuracy: number;
    currentStreak: number;
}

export interface LeaderboardResponse {
    success: boolean;
    data: LeaderboardEntry[];
    season: number;
    week: string | number;
    limit: number;
}

class OracleApiClient {
    private readonly baseUrl: string;
    private playerNumber: number | null = null;
    private pin: string | null = null;

    constructor() {
        this.baseUrl = 'http://localhost:3001';
    }

    /**
     * Set authentication credentials for Oracle API
     */
    setAuth(playerNumber: number, pin: string) {
        this.playerNumber = playerNumber;
        this.pin = pin;
    }

    /**
     * Clear authentication credentials
     */
    clearAuth() {
        this.playerNumber = null;
        this.pin = null;
    }

    /**
     * Get common headers for API requests
     */
    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (this.playerNumber !== null && this.pin !== null) {
            headers['x-player-number'] = this.playerNumber.toString();
            headers['x-player-pin'] = this.pin;
        }

        return headers;
    }

    /**
     * Handle API response and check for errors
     */
    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || `API Error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * GET /api/oracle/predictions/week/:week
     * Get active predictions for a specific week
     */
    async getWeeklyPredictions(week: number, season: number = 2024): Promise<WeeklyPredictionsResponse> {
        const url = `${this.baseUrl}/api/oracle/predictions/week/${week}?season=${season}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<WeeklyPredictionsResponse>(response);
    }

    /**
     * GET /api/oracle/predictions/:id
     * Get detailed information about a specific prediction
     */
    async getPredictionDetails(predictionId: string): Promise<OracleApiResponse<PredictionResponse>> {
        const url = `${this.baseUrl}/api/oracle/predictions/${predictionId}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<OracleApiResponse<PredictionResponse>>(response);
    }

    /**
     * POST /api/oracle/predictions/:id/submit
     * Submit a user prediction
     */
    async submitPrediction(
        predictionId: string, 
        choice: number, 
        confidence: number, 
        reasoning?: string
    ): Promise<OracleApiResponse> {
        if (this.playerNumber === null || this.pin === null) {
            throw new Error('Authentication required to submit predictions');
        }

        const url = `${this.baseUrl}/api/oracle/predictions/${predictionId}/submit`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                choice,
                confidence,
                reasoning,
            }),
        });

        return this.handleResponse<OracleApiResponse>(response);
    }

    /**
     * POST /api/oracle/predictions
     * Create a new Oracle prediction (Admin only)
     */
    async createPrediction(predictionData: CreateOraclePredictionRequest): Promise<OracleApiResponse> {
        if (this.playerNumber === null || this.pin === null) {
            throw new Error('Authentication required to create predictions');
        }

        const url = `${this.baseUrl}/api/oracle/predictions`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(predictionData),
        });

        return this.handleResponse<OracleApiResponse>(response);
    }

    /**
     * GET /api/oracle/user/:playerNumber/stats
     * Get user prediction statistics
     */
    async getUserStats(playerNumber: number, season: number = 2024, week?: number): Promise<OracleApiResponse<UserStatsResponse>> {
        let url = `${this.baseUrl}/api/oracle/user/${playerNumber}/stats?season=${season}`;
        if (week) {
            url += `&week=${week}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<OracleApiResponse<UserStatsResponse>>(response);
    }

    /**
     * GET /api/oracle/leaderboard
     * Get current leaderboard rankings
     */
    async getLeaderboard(season: number = 2024, week?: number, limit: number = 10): Promise<LeaderboardResponse> {
        let url = `${this.baseUrl}/api/oracle/leaderboard?season=${season}&limit=${limit}`;
        if (week) {
            url += `&week=${week}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<LeaderboardResponse>(response);
    }

    /**
     * GET /api/oracle/analytics/performance/:playerNumber
     * Get detailed performance analytics for a specific user
     */
    async getPerformanceAnalytics(playerNumber: number, options: { season?: number; weeks?: number } = {}): Promise<OracleApiResponse<any>> {
        const { season = 2024, weeks = 10 } = options;
        const url = `${this.baseUrl}/api/oracle/analytics/performance/${playerNumber}?season=${season}&weeks=${weeks}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<OracleApiResponse<any>>(response);
    }

    /**
     * GET /api/oracle/analytics/global
     * Get global analytics and trends across all users
     */
    async getGlobalAnalytics(options: { season?: number; weeks?: number } = {}): Promise<OracleApiResponse<any>> {
        const { season = 2024, weeks = 10 } = options;
        const url = `${this.baseUrl}/api/oracle/analytics/global?season=${season}&weeks=${weeks}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<OracleApiResponse<any>>(response);
    }

    /**
     * Health check endpoint
     */
    async healthCheck(): Promise<{ status: string; service: string; database: string; websocket: string }> {
        const url = `${this.baseUrl}/health`;
        
        const response = await fetch(url, {
            method: 'GET',
        });

        return this.handleResponse(response);
    }

    /**
     * Check if the Oracle backend is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            await this.healthCheck();
            return true;
        } catch (error) {
            console.warn('Oracle backend not available:', error);
            return false;
        }
    }
}

// Export singleton instance
export const oracleApiClient = new OracleApiClient();
export default oracleApiClient;
