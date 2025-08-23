/**
 * Netlify Functions Authentication Service
 * Modern authentication service for Astral Draft
 */

interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthResponse {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

class NetlifyAuthService {
  private state: AuthState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false
  };

  private listeners: Set<(state: AuthState) => void> = new Set();
  private refreshTimer: NodeJS.Timeout | null = null;
  
  // Use Netlify Functions endpoint
  private readonly API_URL = '/.netlify/functions/api';
  
  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication from stored tokens
   */
  private async initializeAuth() {
    const storedTokens = this.getStoredTokens();
    if (storedTokens) {
      this.state.isLoading = true;
      this.notifyListeners();
      
      try {
        const user = await this.fetchCurrentUser(storedTokens.accessToken);
        if (user) {
          this.state = {
            user,
            tokens: storedTokens,
            isAuthenticated: true,
            isLoading: false
          };
          this.scheduleTokenRefresh();
        } else {
          // Try to refresh token
          await this.refreshAccessToken();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        this.clearAuth();
      }
      
      this.state.isLoading = false;
      this.notifyListeners();
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.state.isLoading = true;
      this.notifyListeners();

      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user && data.accessToken && data.refreshToken) {
        this.state = {
          user: data.user,
          tokens: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          },
          isAuthenticated: true,
          isLoading: false
        };

        if (this.state.tokens) {
          this.storeTokens(this.state.tokens);
        }
        this.scheduleTokenRefresh();
        this.notifyListeners();

        return { success: true };
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      this.state.isLoading = false;
      this.notifyListeners();
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Register a new user
   */
  async register(email: string, username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.state.isLoading = true;
      this.notifyListeners();

      const response = await fetch(`${this.API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.user && data.accessToken && data.refreshToken) {
        this.state = {
          user: data.user,
          tokens: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          },
          isAuthenticated: true,
          isLoading: false
        };

        if (this.state.tokens) {
          this.storeTokens(this.state.tokens);
        }
        this.scheduleTokenRefresh();
        this.notifyListeners();

        return { success: true };
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      this.state.isLoading = false;
      this.notifyListeners();
      
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Logout the current user
   */
  async logout() {
    try {
      if (this.state.tokens?.accessToken) {
        await fetch(`${this.API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.state.tokens.accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Refresh the access token
   */
  private async refreshAccessToken(): Promise<boolean> {
    const tokens = this.getStoredTokens();
    if (!tokens?.refreshToken) {
      this.clearAuth();
      return false;
    }

    try {
      const response = await fetch(`${this.API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken })
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.accessToken && data.refreshToken) {
        const newTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        };

        this.state.tokens = newTokens;
        this.storeTokens(newTokens);
        this.scheduleTokenRefresh();
        
        // Fetch updated user data
        const user = await this.fetchCurrentUser(newTokens.accessToken);
        if (user) {
          this.state.user = user;
          this.state.isAuthenticated = true;
          this.notifyListeners();
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearAuth();
    return false;
  }

  /**
   * Fetch current user data
   */
  private async fetchCurrentUser(accessToken: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }

    return null;
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh token 1 minute before expiry (assuming 15 min expiry)
    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken();
    }, 14 * 60 * 1000); // 14 minutes
  }

  /**
   * Clear authentication state
   */
  private clearAuth() {
    this.state = {
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false
    };

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.clearStoredTokens();
    this.notifyListeners();
  }

  /**
   * Token storage management
   */
  private storeTokens(tokens: AuthTokens) {
    try {
      localStorage.setItem('astral_auth', JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  private getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem('astral_auth');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      return null;
    }
  }

  private clearStoredTokens() {
    try {
      localStorage.removeItem('astral_auth');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * State management
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state); // Call immediately with current state
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Get current state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    if (this.state.tokens?.accessToken) {
      return {
        'Authorization': `Bearer ${this.state.tokens.accessToken}`
      };
    }
    return {};
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const authHeaders = this.getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers
      }
    });

    // If unauthorized, try to refresh token and retry
    if (response.status === 401 && this.state.tokens) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        const newAuthHeaders = this.getAuthHeaders();
        return fetch(url, {
          ...options,
          headers: {
            ...newAuthHeaders,
            ...options.headers
          }
        });
      }
    }

    return response;
  }
}

// Export singleton instance
export const netlifyAuth = new NetlifyAuthService();
export type { User, AuthState, AuthTokens };