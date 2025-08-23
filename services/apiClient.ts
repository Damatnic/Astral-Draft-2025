/**
 * API Client for Astral Draft Fantasy Football Application
 * Handles all external API calls and data fetching
 */

// SportsIO API Interfaces
interface SportsIOGame {
  game_id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  quarter?: number;
  time_remaining?: string;
}

interface SportsIOPlayer {
  player_id: string;
  name: string;
  position: string;
  team: string;
  injury_status?: string;
  stats: {
    passing_yards?: number;
    passing_tds?: number;
    rushing_yards?: number;
    rushing_tds?: number;
    receiving_yards?: number;
    receiving_tds?: number;
    fantasy_points?: number;
  };
}

// ESPN API Interfaces
interface ESPNPlayer {
  id: number;
  fullName: string;
  defaultPositionId: number;
  proTeamId: number;
  stats?: any[];
  ownership?: {
    percentOwned: number;
    percentStarted: number;
  };
}

interface ESPNResponse {
  players: ESPNPlayer[];
}

// Transformed Player Interface (Unified)
interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  fantasyPoints?: number;
  projectedPoints?: number;
  injuryStatus?: string;
  ownership?: {
    percentOwned: number;
    percentStarted: number;
  };
  stats?: any;
}

class ApiClient {
  private readonly baseUrl: string;
  private readonly espnApiKey?: string;
  private readonly nflApiKey?: string;
  private readonly yahooApiKey?: string;
  private readonly sportsIOApiKey?: string;
  private readonly rateLimiter: Map<string, number> = new Map();
  private readonly requestQueue: Array<() => Promise<any>> = [];

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';
    this.espnApiKey = (import.meta as any).env?.VITE_ESPN_API_KEY;
    this.nflApiKey = (import.meta as any).env?.VITE_NFL_API_KEY;
    this.yahooApiKey = (import.meta as any).env?.VITE_YAHOO_API_KEY;
    this.sportsIOApiKey = (import.meta as any).env?.VITE_SPORTSIO_API_KEY;
  }

  /**
   * Rate limiting helper
   */
  private async checkRateLimit(endpoint: string, limit: number = 60): Promise<void> {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000; // 1-minute window
    const key = `${endpoint}:${windowStart}`;
    
    const requests = this.rateLimiter.get(key) || 0;
    if (requests >= limit) {
      const waitTime = 60000 - (now - windowStart);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.rateLimiter.set(key, requests + 1);
  }

  /**
   * Enhanced fetch with authentication and error handling
   */
  private async secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const defaultOptions: RequestInit = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'AstralDraft/1.0',
        ...options.headers
      },
      ...options
    };

    return await this.withRetry(async () => {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }
      
      return response;
    });
  }

  /**
   * SportsIO API Integration (Primary Data Source)
   */
  async getSportsIOGames(week?: number): Promise<SportsIOGame[]> {
    try {
      let url = 'https://api.sportsio.io/nfl/games';
      if (week) {
        url += `?week=${week}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.sportsIOApiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`SportsIO API error: ${response.status}`);
      }

      const data = await response.json();
      return data.games || [];
    } catch (error) {
      console.error('Failed to fetch SportsIO games:', error);
      return [];
    }
  }

  async getSportsIOPlayers(position?: string): Promise<SportsIOPlayer[]> {
    try {
      let url = 'https://api.sportsio.io/nfl/players';
      if (position) {
        url += `?position=${position}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.sportsIOApiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`SportsIO API error: ${response.status}`);
      }

      const data = await response.json();
      return data.players || [];
    } catch (error) {
      console.error('Failed to fetch SportsIO players:', error);
      return [];
    }
  }

  async getSportsIOLiveScores(): Promise<SportsIOGame[]> {
    try {
      const url = 'https://api.sportsio.io/nfl/games/live';
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.sportsIOApiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`SportsIO API error: ${response.status}`);
      }

      const data = await response.json();
      return data.games || [];
    } catch (error) {
      console.error('Failed to fetch live scores:', error);
      return [];
    }
  }

  /**
   * ESPN Fantasy API Integration (Backup Data Source)
   */
  async getESPNPlayers(leagueId?: string): Promise<Player[]> {
    try {
      // ESPN Fantasy API endpoint for player data
      const url = leagueId 
        ? `https://fantasy.espn.com/apis/v3/games/ffl/seasons/2024/segments/0/leagues/${leagueId}/players`
        : 'https://fantasy.espn.com/apis/v3/games/ffl/seasons/2024/players';
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...(this.espnApiKey && { 'Authorization': `Bearer ${this.espnApiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }

      const data: ESPNResponse = await response.json();
      
      // Transform ESPN data to unified Player interface
      return data.players.map(player => ({
        id: player.id.toString(),
        name: player.fullName,
        position: this.getPositionName(player.defaultPositionId),
        team: this.getTeamName(player.proTeamId),
        stats: player.stats?.[0] || {},
        ownership: player.ownership
      }));
    } catch (error) {
      console.error('Failed to fetch ESPN players:', error);
      return [];
    }
  }

  async getESPNLeagueInfo(leagueId: string): Promise<any> {
    try {
      const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/2024/segments/0/leagues/${leagueId}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...(this.espnApiKey && { 'Authorization': `Bearer ${this.espnApiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch ESPN league info:', error);
      return null;
    }
  }

  /**
   * Live Data Integration
   */
  async getLiveScores(): Promise<SportsIOGame[]> {
    // Primary: Try SportsIO
    const sportsIOScores = await this.getSportsIOLiveScores();
    if (sportsIOScores.length > 0) {
      return sportsIOScores;
    }

    // Fallback: Try other sources
    console.warn('SportsIO unavailable, using fallback data sources');
    return [];
  }

  async getPlayerUpdates(position?: string): Promise<Player[]> {
    // Primary: Try SportsIO
    const sportsIOPlayers = await this.getSportsIOPlayers(position);
    if (sportsIOPlayers.length > 0) {
      // Transform SportsIO to unified Player interface
      return sportsIOPlayers.map(player => ({
        id: player.player_id,
        name: player.name,
        position: player.position,
        team: player.team,
        fantasyPoints: player.stats.fantasy_points,
        injuryStatus: player.injury_status,
        stats: player.stats
      }));
    }

    // Fallback: Try ESPN
    return await this.getESPNPlayers();
  }

  /**
   * Utility methods for data transformation
   */
  private getPositionName(positionId: number): string {
    const positions: { [key: number]: string } = {
      1: 'QB',
      2: 'RB',
      3: 'WR',
      4: 'TE',
      5: 'K',
      16: 'DST'
    };
    return positions[positionId] || 'UNKNOWN';
  }

  private getTeamName(teamId: number): string {
    const teams: { [key: number]: string } = {
      1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL',
      7: 'DEN', 8: 'DET', 9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC',
      13: 'LV', 14: 'LAR', 15: 'MIA', 16: 'MIN', 17: 'NE', 18: 'NO',
      19: 'NYG', 20: 'NYJ', 21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC',
      25: 'SF', 26: 'SEA', 27: 'TB', 28: 'WAS', 29: 'CAR', 30: 'JAX',
      33: 'BAL', 34: 'HOU'
    };
    return teams[teamId] || 'UNKNOWN';
  }

  /**
   * Real-time data polling
   */
  async startLiveUpdates(callback: (data: any) => void): Promise<void> {
    const updateInterval = 30000; // 30 seconds

    const pollUpdates = async () => {
      try {
        const [scores, players] = await Promise.all([
          this.getLiveScores(),
          this.getPlayerUpdates()
        ]);

        callback({
          scores,
          players,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error polling live updates:', error);
      }
    };

    // Initial fetch
    await pollUpdates();

    // Set up interval
    setInterval(pollUpdates, updateInterval);
  }

  /**
   * Oracle Predictions API Integration (Production)
   */
  async getProductionOraclePredictions(week?: number, season?: number): Promise<any> {
    try {
      const cacheKey = `oracle_predictions_${week || 'current'}_${season || 2024}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      let url = '/api/oracle/predictions/production';
      const params = new URLSearchParams();
      
      if (week) params.append('week', String(week));
      if (season) params.append('season', String(season));
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await this.secureFetch(url);
      const data = await response.json();

      if (data.success) {
        this.setCachedData(cacheKey, data);
        console.log(`✅ Fetched ${data.data.predictions.length} production Oracle predictions`);
        return data;
      } else {
        throw new Error(data.error || 'Failed to fetch Oracle predictions');
      }
    } catch (error) {
      console.error('❌ Failed to fetch production Oracle predictions:', error);
      throw error;
    }
  }

  async submitProductionOraclePrediction(
    predictionId: string, 
    userChoice: number, 
    confidence: number
  ): Promise<any> {
    try {
      const url = `/api/oracle/predictions/production/${predictionId}/submit`;
      
      const response = await this.secureFetch(url, {
        method: 'POST',
        body: JSON.stringify({
          userChoice,
          confidence
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Successfully submitted production Oracle prediction: ${predictionId}`);
        return data;
      } else {
        throw new Error(data.error || 'Failed to submit prediction');
      }
    } catch (error) {
      console.error('❌ Failed to submit production Oracle prediction:', error);
      throw error;
    }
  }

  async generateProductionOraclePredictions(week: number, season?: number): Promise<any> {
    try {
      const url = '/api/oracle/predictions/production/generate';
      
      const response = await this.secureFetch(url, {
        method: 'POST',
        body: JSON.stringify({
          week,
          season: season || 2024
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Generated ${data.data.predictions.length} production Oracle predictions`);
        return data;
      } else {
        throw new Error(data.error || 'Failed to generate predictions');
      }
    } catch (error) {
      console.error('❌ Failed to generate production Oracle predictions:', error);
      throw error;
    }
  }

  async resolveProductionOraclePredictions(week: number, season?: number): Promise<any> {
    try {
      const url = '/api/oracle/predictions/production/resolve';
      
      const response = await this.secureFetch(url, {
        method: 'POST',
        body: JSON.stringify({
          week,
          season: season || 2024
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Resolved ${data.data.resolvedCount} production Oracle predictions`);
        return data;
      } else {
        throw new Error(data.error || 'Failed to resolve predictions');
      }
    } catch (error) {
      console.error('❌ Failed to resolve production Oracle predictions:', error);
      throw error;
    }
  }

  /**
   * Cache management for performance
   */
  private readonly cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCachedData(key: string): unknown {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Error handling and retry logic
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    throw new Error('Max retries exceeded');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;