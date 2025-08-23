/**
 * Secure Production Sports Data Service
 * All API calls routed through backend proxy - no API keys in frontend
 */

import { sportsDataService } from './secureApiClient';

// Data interfaces (same as before)
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

/**
 * Secure Production Sports Data Service
 * All methods use backend proxy - no API keys exposed
 */
class SecureProductionSportsDataService {
  private cache = new Map<string, { data: any; expires: number }>();
  
  /**
   * Fetch current NFL games for a specific week
   */
  async getCurrentWeekGames(week: number = 1, season: number = 2024): Promise<NFLGame[]> {
    const cacheKey = `games_week_${week}_${season}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await sportsDataService.getNFLGames(week, season);
      const games = response.data?.events?.map((event: any) => this.parseESPNGame(event)) || [];
      this.setCache(cacheKey, games, 5 * 60 * 1000); // 5 minutes
      return games;
    } catch (error) {
      console.error('Failed to fetch NFL games:', error);
      return [];
    }
  }

  /**
   * Fetch live game scores and updates
   */
  async getLiveScores(): Promise<NFLGame[]> {
    const cacheKey = 'live_scores';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await sportsDataService.getNFLGames();
      const games = response.data?.events
        ?.filter((event: any) => {
          const status = event.competitions[0].status.type.name;
          return ['STATUS_IN_PROGRESS', 'STATUS_HALFTIME', 'STATUS_END_PERIOD', 'STATUS_FINAL'].includes(status);
        })
        .map((event: any) => this.parseESPNGame(event)) || [];
      
      this.setCache(cacheKey, games, 60 * 1000); // 1 minute
      return games;
    } catch (error) {
      console.error('Failed to fetch live scores:', error);
      return [];
    }
  }

  /**
   * Fetch detailed player information and stats
   */
  async getPlayerDetails(playerId: string): Promise<NFLPlayer | null> {
    const cacheKey = `player_${playerId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await sportsDataService.getPlayerDetails(playerId);
      const player = this.parseESPNPlayer(response.data);
      this.setCache(cacheKey, player, 60 * 60 * 1000); // 1 hour
      return player;
    } catch (error) {
      console.error(`Failed to fetch player ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Fetch betting odds for games
   */
  async getGameOdds(gameDate?: string): Promise<GameOdds[]> {
    const cacheKey = `odds_${gameDate || 'current'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await sportsDataService.getOdds();
      const odds = response.data?.map((game: any) => this.parseOddsData(game)) || [];
      this.setCache(cacheKey, odds, 2 * 60 * 1000); // 2 minutes
      return odds;
    } catch (error) {
      console.error('Failed to fetch odds:', error);
      return [];
    }
  }

  /**
   * Get API status and usage statistics
   */
  async getAPIStatus(): Promise<{ 
    isConnected: boolean; 
    services: { name: string; status: string; hasKey: boolean }[];
  }> {
    try {
      const status = await sportsDataService.checkStatus();
      return {
        isConnected: true,
        services: [
          { name: 'ESPN API', status: 'connected', hasKey: true },
          { name: 'The Odds API', status: status.odds ? 'connected' : 'no_key', hasKey: status.odds },
          { name: 'Sports.io API', status: status.sportsio ? 'connected' : 'no_key', hasKey: status.sportsio },
          { name: 'NFL API', status: status.nfl ? 'connected' : 'no_key', hasKey: status.nfl }
        ]
      };
    } catch (error) {
      return {
        isConnected: false,
        services: []
      };
    }
  }

  // Cache helpers
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, { data, expires: Date.now() + ttl });
  }

  // Parsing helpers (same as original)
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
}

// Export singleton instance
export const secureProductionSportsDataService = new SecureProductionSportsDataService();
export default secureProductionSportsDataService;