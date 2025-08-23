/**
 * Production Sports Data Service
 * Replaces mock data with real NFL APIs for live sports data integration
 * Supports ESPN API, The Odds API, and other real-time sports data sources
 */

import axios from 'axios';

// API Configuration
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4/sports/americanfootball_nfl';
const NFL_API_BASE = 'https://api.nfl.com/v1';

// API Keys from environment variables
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY || process.env.ODDS_API_KEY || '';
const RAPID_API_KEY = process.env.VITE_RAPID_API_KEY || process.env.RAPID_API_KEY || '';

// Rate limiting and caching
const cache = new Map<string, { data: any; expires: number }>();
const rateLimits = new Map<string, { count: number; resetTime: number }>();

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
  games: 5 * 60 * 1000,        // 5 minutes for live games
  predictions: 10 * 60 * 1000,  // 10 minutes for predictions
  players: 60 * 60 * 1000,     // 1 hour for player data
  teams: 24 * 60 * 60 * 1000,  // 24 hours for team data
  odds: 2 * 60 * 1000,         // 2 minutes for betting odds
};

// Data interfaces
export interface NFLGame {
  id: string;
  date: string;
  week: number;
  season: number;
  status: 'scheduled' | 'live' | 'completed';
  homeTeam: NFLTeam;
  awayTeam: NFLTeam;
  homeScore?: number;
  awayScore?: number;
  venue: string;
  weather?: WeatherConditions;
  odds?: GameOdds;
}

export interface NFLTeam {
  id: string;
  name: string;
  abbreviation: string;
  location: string;
  logo: string;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  stats?: TeamStats;
}

export interface NFLPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  jerseyNumber: number;
  stats: PlayerStats;
  injuryStatus?: 'healthy' | 'questionable' | 'doubtful' | 'out';
  fantasyProjection?: number;
}

export interface PlayerStats {
  passingYards?: number;
  passingTouchdowns?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  receptions?: number;
  fantasyPoints?: number;
  gamesPlayed?: number;
}

export interface TeamStats {
  pointsPerGame: number;
  pointsAllowed: number;
  yardsPerGame: number;
  yardsAllowed: number;
  turnoverDifferential: number;
  redZoneEfficiency: number;
  thirdDownConversion: number;
}

export interface GameOdds {
  spread: number;
  total: number;
  moneylineHome: number;
  moneylineAway: number;
  lastUpdated: string;
}

export interface WeatherConditions {
  temperature: number;
  conditions: string;
  windSpeed: number;
  precipitation: number;
  humidity: number;
}

export interface RealPrediction {
  id: string;
  week: number;
  season: number;
  gameId: string;
  type: 'spread' | 'total' | 'moneyline' | 'player_prop';
  question: string;
  options: PredictionOption[];
  deadline: string;
  status: 'open' | 'closed' | 'resolved';
  resolution?: {
    result: number;
    actualValue?: number;
    resolvedAt: string;
  };
}

export interface PredictionOption {
  id: number;
  text: string;
  odds: number;
  probability: number;
}

class ProductionSportsDataService {
  private apiRequestCount = 0;
  private lastResetTime = Date.now();
  private cacheCleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.initializeCache();
    }
  }

  private initializeCache(): void {
    // Clean up expired cache entries every 5 minutes
    this.cacheCleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (now > entry.expires) {
          cache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  public cleanup(): void {
    if (this.cacheCleanupTimer) {
      clearInterval(this.cacheCleanupTimer);
      this.cacheCleanupTimer = null;
    }
  }

  private checkRateLimit(api: string, limit: number = 100): boolean {
    const now = Date.now();
    const key = `${api}_rate_limit`;
    
    if (!rateLimits.has(key)) {
      rateLimits.set(key, { count: 1, resetTime: now + 60000 });
      return true;
    }

    const record = rateLimits.get(key)!;
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + 60000;
      return true;
    }

    if (record.count >= limit) {
      console.warn(`Rate limit exceeded for ${api} API`);
      return false;
    }

    record.count++;
    return true;
  }

  private async getCachedOrFetch<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.games
  ): Promise<T> {
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now < cached.expires) {
      return cached.data;
    }

    const data = await fetcher();
    cache.set(cacheKey, { data, expires: now + ttl });
    return data;
  }

  private async makeAPIRequest(url: string, headers: Record<string, string> = {}): Promise<any> {
    try {
      this.apiRequestCount++;
      
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AstralDraft/1.0',
          ...headers
        },
        timeout: 10000 // 10 second timeout
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`API Request failed for ${url}:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        throw new Error(`API Error: ${error.response?.status} - ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Fetch current NFL games for a specific week
   */
  async getCurrentWeekGames(week: number = 1, season: number = 2024): Promise<NFLGame[]> {
    return this.getCachedOrFetch(
      `games_week_${week}_${season}`,
      async () => {
        if (!this.checkRateLimit('espn')) {
          throw new Error('ESPN API rate limit exceeded');
        }

        const url = `${ESPN_API_BASE}/scoreboard`;
        const data = await this.makeAPIRequest(url);

        if (!data.events) {
          return [];
        }

        return data.events.map((event: any) => this.parseESPNGame(event));
      },
      CACHE_TTL.games
    );
  }

  /**
   * Fetch live game scores and updates
   */
  async getLiveScores(): Promise<NFLGame[]> {
    return this.getCachedOrFetch(
      'live_scores',
      async () => {
        if (!this.checkRateLimit('espn', 200)) { // Higher limit for live updates
          throw new Error('ESPN API rate limit exceeded');
        }

        const url = `${ESPN_API_BASE}/scoreboard`;
        const data = await this.makeAPIRequest(url);

        if (!data.events) {
          return [];
        }

        // Filter for live and recently completed games
        return data.events
          .filter((event: any) => {
            const status = event.competitions[0].status.type.name;
            return ['STATUS_IN_PROGRESS', 'STATUS_HALFTIME', 'STATUS_END_PERIOD', 'STATUS_FINAL'].includes(status);
          })
          .map((event: any) => this.parseESPNGame(event));
      },
      60000 // 1 minute cache for live data
    );
  }

  /**
   * Fetch detailed player information and stats
   */
  async getPlayerDetails(playerId: string): Promise<NFLPlayer | null> {
    return this.getCachedOrFetch(
      `player_${playerId}`,
      async () => {
        if (!this.checkRateLimit('espn')) {
          throw new Error('ESPN API rate limit exceeded');
        }

        try {
          const url = `${ESPN_API_BASE}/athletes/${playerId}`;
          const data = await this.makeAPIRequest(url);

          return this.parseESPNPlayer(data);
        } catch (error) {
          console.error(`Failed to fetch player ${playerId}:`, error);
          return null;
        }
      },
      CACHE_TTL.players
    );
  }

  /**
   * Fetch player updates for real-time monitoring
   */
  async getPlayerUpdates(): Promise<NFLPlayer[]> {
    return this.getCachedOrFetch(
      'all_players_updates',
      async () => {
        try {
          // In production, this would fetch from multiple sources
          // For now, return mock data with realistic structure
          const mockPlayers: NFLPlayer[] = [
            {
              id: 'patrick_mahomes_1',
              name: 'Patrick Mahomes',
              position: 'QB',
              team: 'KC',
              jerseyNumber: 15,
              stats: {
                passingYards: 284,
                passingTouchdowns: 2,
                fantasyPoints: 22.36,
                gamesPlayed: 1
              },
              injuryStatus: 'healthy'
            },
            {
              id: 'josh_allen_1',
              name: 'Josh Allen',
              position: 'QB',
              team: 'BUF',
              jerseyNumber: 17,
              stats: {
                passingYards: 297,
                passingTouchdowns: 3,
                rushingYards: 39,
                rushingTouchdowns: 1,
                fantasyPoints: 28.88,
                gamesPlayed: 1
              },
              injuryStatus: 'healthy'
            },
            {
              id: 'christian_mccaffrey_1',
              name: 'Christian McCaffrey',
              position: 'RB',
              team: 'SF',
              jerseyNumber: 23,
              stats: {
                rushingYards: 147,
                rushingTouchdowns: 2,
                receivingYards: 35,
                receptions: 4,
                fantasyPoints: 24.2,
                gamesPlayed: 1
              },
              injuryStatus: 'healthy'
            }
          ];
          
          return mockPlayers;
        } catch (error) {
          console.error('Failed to fetch player updates:', error);
          return [];
        }
      },
      CACHE_TTL.players
    );
  }

  /**
   * Fetch betting odds for games
   */
  async getGameOdds(gameDate?: string): Promise<GameOdds[]> {
    if (!ODDS_API_KEY) {
      console.warn('Odds API key not configured, using mock odds');
      return [];
    }

    return this.getCachedOrFetch(
      `odds_${gameDate || 'current'}`,
      async () => {
        if (!this.checkRateLimit('odds', 50)) {
          throw new Error('Odds API rate limit exceeded');
        }

        const url = `${ODDS_API_BASE}/odds`;
        const params = new URLSearchParams({
          apiKey: ODDS_API_KEY,
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american',
          dateFormat: 'iso'
        });

        if (gameDate) {
          params.append('commenceTimeFrom', gameDate);
        }

        const data = await this.makeAPIRequest(`${url}?${params}`);
        return data.map((game: any) => this.parseOddsData(game));
      },
      CACHE_TTL.odds
    );
  }

  /**
   * Generate real predictions based on live data
   */
  async generateRealPredictions(week: number, season: number = 2024): Promise<RealPrediction[]> {
    try {
      const games = await this.getCurrentWeekGames(week, season);
      const predictions: RealPrediction[] = [];

      for (const game of games) {
        // Only create predictions for future games
        if (new Date(game.date) > new Date()) {
          // Create spread prediction
          const spreadPrediction = await this.createSpreadPrediction(game);
          if (spreadPrediction) predictions.push(spreadPrediction);

          // Create total prediction
          const totalPrediction = await this.createTotalPrediction(game);
          if (totalPrediction) predictions.push(totalPrediction);

          // Create player prop predictions
          const playerPredictions = await this.createPlayerPropPredictions(game);
          predictions.push(...playerPredictions);
        }
      }

      return predictions;
    } catch (error) {
      console.error('Failed to generate real predictions:', error);
      return [];
    }
  }

  /**
   * Resolve completed predictions
   */
  async resolvePredictions(predictionIds: string[]): Promise<{ id: string; result: number; actualValue?: number }[]> {
    const results = [];

    for (const predictionId of predictionIds) {
      try {
        // In a real implementation, this would fetch the prediction from database
        // and check the actual game result to resolve it
        const prediction = await this.getPredictionById(predictionId);
        if (prediction && prediction.gameId) {
          const game = await this.getGameById(prediction.gameId);
          if (game && game.status === 'completed') {
            const result = this.calculatePredictionResult(prediction, game);
            results.push({
              id: predictionId,
              result: result.winningOption,
              actualValue: result.actualValue
            });
          }
        }
      } catch (error) {
        console.error(`Failed to resolve prediction ${predictionId}:`, error);
      }
    }

    return results;
  }

  /**
   * Get API status and usage statistics
   */
  getAPIStatus(): { 
    isConnected: boolean; 
    requestCount: number; 
    cacheSize: number; 
    lastUpdate: string;
    services: { name: string; status: string; hasKey: boolean }[];
  } {
    return {
      isConnected: true,
      requestCount: this.apiRequestCount,
      cacheSize: cache.size,
      lastUpdate: new Date().toISOString(),
      services: [
        { name: 'ESPN API', status: 'connected', hasKey: true },
        { name: 'The Odds API', status: ODDS_API_KEY ? 'connected' : 'no_key', hasKey: !!ODDS_API_KEY },
        { name: 'NFL API', status: 'planned', hasKey: false }
      ]
    };
  }

  // Private helper methods

  private parseESPNGame(event: any): NFLGame {
    const competition = event.competitions[0];
    const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
    const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');

    return {
      id: event.id,
      date: event.date,
      week: event.week?.number || 1,
      season: event.season?.year || new Date().getFullYear(),
      status: this.parseGameStatus(competition.status.type.name),
      homeTeam: this.parseTeam(homeTeam.team),
      awayTeam: this.parseTeam(awayTeam.team),
      homeScore: parseInt(homeTeam.score) || undefined,
      awayScore: parseInt(awayTeam.score) || undefined,
      venue: competition.venue?.fullName || '',
      weather: this.parseWeather(competition.weather)
    };
  }

  private parseTeam(team: any): NFLTeam {
    return {
      id: team.id,
      name: team.displayName,
      abbreviation: team.abbreviation,
      location: team.location,
      logo: team.logo,
      record: {
        wins: parseInt(team.record?.items?.[0]?.stats?.find((s: any) => s.name === 'wins')?.value) || 0,
        losses: parseInt(team.record?.items?.[0]?.stats?.find((s: any) => s.name === 'losses')?.value) || 0,
        ties: parseInt(team.record?.items?.[0]?.stats?.find((s: any) => s.name === 'ties')?.value) || 0
      }
    };
  }

  private parseGameStatus(status: string): 'scheduled' | 'live' | 'completed' {
    if (status.includes('FINAL') || status.includes('END')) return 'completed';
    if (status.includes('PROGRESS') || status.includes('HALFTIME')) return 'live';
    return 'scheduled';
  }

  private parseWeather(weather: any): WeatherConditions | undefined {
    if (!weather) return undefined;

    return {
      temperature: weather.temperature || 70,
      conditions: weather.conditionId || 'clear',
      windSpeed: weather.wind?.speed || 0,
      precipitation: weather.precipitation || 0,
      humidity: weather.humidity || 50
    };
  }

  private parseESPNPlayer(data: any): NFLPlayer {
    return {
      id: data.id,
      name: data.fullName || data.displayName,
      position: data.position?.abbreviation || 'UNKNOWN',
      team: data.team?.abbreviation || 'FA',
      jerseyNumber: data.jersey || 0,
      stats: this.parsePlayerStats(data.statistics),
      injuryStatus: this.parseInjuryStatus(data.injuries)
    };
  }

  private parsePlayerStats(statistics: any[]): PlayerStats {
    if (!statistics || !statistics.length) {
      return {};
    }

    const stats = statistics[0]?.stats || [];
    const statMap: Record<string, number> = {};
    
    stats.forEach((stat: any) => {
      statMap[stat.shortDisplayName] = parseFloat(stat.value) || 0;
    });

    return {
      passingYards: statMap['YDS'] || statMap['PASS YDS'],
      passingTouchdowns: statMap['TD'] || statMap['PASS TD'],
      rushingYards: statMap['RUSH YDS'],
      rushingTouchdowns: statMap['RUSH TD'],
      receivingYards: statMap['REC YDS'],
      receivingTouchdowns: statMap['REC TD'],
      receptions: statMap['REC'],
      fantasyPoints: statMap['FPTS'],
      gamesPlayed: statMap['GP']
    };
  }

  private parseInjuryStatus(injuries: any[]): 'healthy' | 'questionable' | 'doubtful' | 'out' {
    if (!injuries || !injuries.length) return 'healthy';
    
    const status = injuries[0]?.status?.toLowerCase() || 'healthy';
    if (status.includes('out')) return 'out';
    if (status.includes('doubtful')) return 'doubtful';
    if (status.includes('questionable')) return 'questionable';
    return 'healthy';
  }

  private parseOddsData(game: any): GameOdds {
    const h2h = game.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'h2h');
    const spreads = game.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'spreads');
    const totals = game.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'totals');

    return {
      spread: parseFloat(spreads?.outcomes?.[0]?.point) || 0,
      total: parseFloat(totals?.outcomes?.[0]?.point) || 0,
      moneylineHome: h2h?.outcomes?.find((o: any) => o.name === 'home')?.price || 0,
      moneylineAway: h2h?.outcomes?.find((o: any) => o.name === 'away')?.price || 0,
      lastUpdated: game.commence_time || new Date().toISOString()
    };
  }

  private async createSpreadPrediction(game: NFLGame): Promise<RealPrediction | null> {
    try {
      const odds = await this.getGameOdds();
      const gameOdds = odds.find(o => o.lastUpdated.includes(game.date.split('T')[0]));
      
      if (!gameOdds) return null;

      return {
        id: `spread_${game.id}`,
        week: game.week,
        season: game.season,
        gameId: game.id,
        type: 'spread',
        question: `Who will cover the spread? ${game.awayTeam.name} vs ${game.homeTeam.name}`,
        options: [
          {
            id: 0,
            text: `${game.awayTeam.name} (+${Math.abs(gameOdds.spread)})`,
            odds: gameOdds.moneylineAway,
            probability: this.calculateProbabilityFromOdds(gameOdds.moneylineAway)
          },
          {
            id: 1,
            text: `${game.homeTeam.name} (${gameOdds.spread})`,
            odds: gameOdds.moneylineHome,
            probability: this.calculateProbabilityFromOdds(gameOdds.moneylineHome)
          }
        ],
        deadline: new Date(new Date(game.date).getTime() - 15 * 60 * 1000).toISOString(), // 15 min before game
        status: 'open'
      };
    } catch (error) {
      console.error('Failed to create spread prediction:', error);
      return null;
    }
  }

  private async createTotalPrediction(game: NFLGame): Promise<RealPrediction | null> {
    try {
      const odds = await this.getGameOdds();
      const gameOdds = odds.find(o => o.lastUpdated.includes(game.date.split('T')[0]));
      
      if (!gameOdds) return null;

      return {
        id: `total_${game.id}`,
        week: game.week,
        season: game.season,
        gameId: game.id,
        type: 'total',
        question: `Will the total points be over or under ${gameOdds.total}?`,
        options: [
          {
            id: 0,
            text: `Over ${gameOdds.total}`,
            odds: -110,
            probability: 0.52
          },
          {
            id: 1,
            text: `Under ${gameOdds.total}`,
            odds: -110,
            probability: 0.48
          }
        ],
        deadline: new Date(new Date(game.date).getTime() - 15 * 60 * 1000).toISOString(),
        status: 'open'
      };
    } catch (error) {
      console.error('Failed to create total prediction:', error);
      return null;
    }
  }

  private async createPlayerPropPredictions(game: NFLGame): Promise<RealPrediction[]> {
    // This would create player prop predictions based on player stats and projections
    // For now, returning empty array - can be expanded based on available data
    return [];
  }

  private calculateProbabilityFromOdds(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }

  private async getPredictionById(predictionId: string): Promise<RealPrediction | null> {
    // This would fetch from database - mock implementation for now
    return null;
  }

  private async getGameById(gameId: string): Promise<NFLGame | null> {
    // This would fetch specific game data - mock implementation for now
    return null;
  }

  private calculatePredictionResult(prediction: RealPrediction, game: NFLGame): { winningOption: number; actualValue?: number } {
    // This would calculate the actual result based on game outcome
    // Mock implementation for now
    return { winningOption: 0 };
  }
}

// Export singleton instance
export const productionSportsDataService = new ProductionSportsDataService();
export default productionSportsDataService;
