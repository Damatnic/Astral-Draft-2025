/**
 * Secure API Client Service
 * Routes all external API calls through backend proxy
 * No API keys stored in frontend code
 */

import axios, { AxiosInstance } from 'axios';

// Determine backend URL based on environment
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    // In browser
    const { hostname, protocol } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    // Production - use same domain with /api prefix
    return `${protocol}//${hostname}`;
  }
  // Server-side or tests
  return process.env.BACKEND_URL || 'http://localhost:3001';
};

const BACKEND_URL = getBackendUrl();

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: `${BACKEND_URL}/api/proxy`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          break;
        case 429:
          // Rate limit exceeded
          console.warn('Rate limit exceeded. Please try again later.');
          break;
        case 503:
          // Service unavailable
          console.error('Service temporarily unavailable');
          break;
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Gemini AI Service - Secure proxy
 */
export const geminiService = {
  /**
   * Generate content using Gemini AI
   */
  async generateContent(prompt: string, model: string = 'gemini-pro', config?: any) {
    try {
      const response = await apiClient.post('/gemini/generate', {
        prompt,
        model,
        config
      });
      return response.data;
    } catch (error) {
      console.error('Gemini generate error:', error);
      throw error;
    }
  },

  /**
   * Stream content using Gemini AI (SSE)
   */
  async streamContent(
    prompt: string, 
    history: any[] = [], 
    onChunk: (text: string) => void,
    model: string = 'gemini-pro'
  ) {
    try {
      const eventSource = new EventSource(
        `${BACKEND_URL}/api/proxy/gemini/stream?` + 
        new URLSearchParams({
          prompt,
          model,
          history: JSON.stringify(history)
        })
      );

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          return;
        }
        
        try {
          const data = JSON.parse(event.data);
          if (data.text) {
            onChunk(data.text);
          }
        } catch (e) {
          console.error('Stream parse error:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Stream error:', error);
        eventSource.close();
      };

      return eventSource;
    } catch (error) {
      console.error('Gemini stream error:', error);
      throw error;
    }
  },

  /**
   * Check if Gemini service is available
   */
  async checkStatus() {
    try {
      const response = await apiClient.get('/health');
      return response.data.apis?.gemini || false;
    } catch (error) {
      return false;
    }
  }
};

/**
 * Sports Data Service - Secure proxy
 */
export const sportsDataService = {
  /**
   * Get NFL games for a specific week
   */
  async getNFLGames(week?: number, season?: number) {
    try {
      const response = await apiClient.get('/sports/nfl/games', {
        params: { week, season }
      });
      return response.data;
    } catch (error) {
      console.error('NFL games fetch error:', error);
      throw error;
    }
  },

  /**
   * Get player details
   */
  async getPlayerDetails(playerId: string) {
    try {
      const response = await apiClient.get(`/sports/nfl/players/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('Player details fetch error:', error);
      throw error;
    }
  },

  /**
   * Get betting odds
   */
  async getOdds() {
    try {
      const response = await apiClient.get('/sports/odds');
      return response.data;
    } catch (error) {
      console.error('Odds fetch error:', error);
      throw error;
    }
  },

  /**
   * Sports.io API proxy (if configured)
   */
  async sportsIoRequest(endpoint: string, params?: any) {
    try {
      const response = await apiClient.post('/sports/sportsio', {
        endpoint,
        params
      });
      return response.data;
    } catch (error) {
      console.error('Sports.io request error:', error);
      throw error;
    }
  },

  /**
   * Check sports data service status
   */
  async checkStatus() {
    try {
      const response = await apiClient.get('/health');
      return response.data.apis || {};
    } catch (error) {
      return {};
    }
  }
};

/**
 * Oracle Service - Uses secure backend
 */
export const oracleService = {
  /**
   * Get Oracle prediction with secure processing
   */
  async getPrediction(data: any) {
    try {
      // This should already be using backend endpoints
      const response = await axios.post(`${BACKEND_URL}/api/oracle/predictions`, data);
      return response.data;
    } catch (error) {
      console.error('Oracle prediction error:', error);
      throw error;
    }
  },

  /**
   * Stream Oracle response
   */
  async streamResponse(prompt: string, context: any, onChunk: (text: string) => void) {
    try {
      // Use the secure Gemini proxy for Oracle streaming
      return geminiService.streamContent(
        `Oracle Context: ${JSON.stringify(context)}\n\nUser Question: ${prompt}`,
        [],
        onChunk,
        'gemini-pro'
      );
    } catch (error) {
      console.error('Oracle stream error:', error);
      throw error;
    }
  }
};

/**
 * Check overall API health
 */
export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('API health check failed:', error);
    return {
      status: 'error',
      message: 'Unable to connect to backend services'
    };
  }
};

export default {
  geminiService,
  sportsDataService,
  oracleService,
  checkApiHealth
};