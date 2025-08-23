/**
 * Frontend Authentication Service
 * Handles user authentication, session management, and profile operations
 */

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    session_token: string;
  };
  error?: string;
  message?: string;
}

interface UserProfile extends User {
  leagues_joined: number;
  total_predictions: number;
  total_points: number;
}

class AuthService {
  private currentUser: User | null = null;
  private sessionToken: string | null = null;
  private readonly baseUrl: string;
  private readonly storageKeys = {
    user: 'astral_user',
    token: 'astral_session_token'
  };

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';
    this.loadFromStorage();
  }

  /**
   * Login user with username and password
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        this.currentUser = data.data.user;
        this.sessionToken = data.data.session_token;
        this.saveToStorage();
        this.notifyAuthChange();
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please check your connection and try again.'
      };
    }
  }

  /**
   * Register new user account
   */
  async register(username: string, email: string, password: string, displayName?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, displayName })
      });

      const data: AuthResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please check your connection and try again.'
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      if (this.sessionToken) {
        await fetch(`${this.baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.sessionToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.currentUser = null;
      this.sessionToken = null;
      this.clearStorage();
      this.notifyAuthChange();
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile | null> {
    if (!this.sessionToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, logout
          await this.logout();
        }
        return null;
      }

      const data = await response.json();
      return data.success ? data.data.user : null;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Pick<User, 'display_name' | 'email'>>): Promise<boolean> {
    if (!this.sessionToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        const updatedUser = { ...this.currentUser, ...data.data.user } as User;
        this.currentUser = updatedUser;
        this.saveToStorage();
        this.notifyAuthChange();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.currentUser && this.sessionToken);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get session token for API calls
   */
  getSessionToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Set session data (for OAuth and external auth)
   */
  async setSession(user: User, sessionToken: string): Promise<void> {
    this.currentUser = user;
    this.sessionToken = sessionToken;
    this.saveToStorage();
    this.notifyAuthChange();
  }

  /**
   * Create authenticated fetch function
   */
  createAuthenticatedFetch() {
    return async (url: string, options: RequestInit = {}) => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>)
      };

      if (this.sessionToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${this.sessionToken}`;
      }

      return fetch(url, {
        ...options,
        headers
      });
    };
  }

  /**
   * Validate session token
   */
  async validateSession(): Promise<boolean> {
    if (!this.sessionToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.logout();
        }
        return false;
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Auth state change listeners
   */
  private readonly authChangeListeners: Array<(user: User | null) => void> = [];

  onAuthChange(listener: (user: User | null) => void): () => void {
    this.authChangeListeners.push(listener);
    // Call immediately with current state
    listener(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authChangeListeners.indexOf(listener);
      if (index > -1) {
        this.authChangeListeners.splice(index, 1);
      }
    };
  }

  private notifyAuthChange(): void {
    this.authChangeListeners.forEach(listener => {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.error('Auth change listener error:', error);
      }
    });
  }

  /**
   * Persistence helpers
   */
  private saveToStorage(): void {
    try {
      if (this.currentUser) {
        localStorage.setItem(this.storageKeys.user, JSON.stringify(this.currentUser));
      }
      if (this.sessionToken) {
        localStorage.setItem(this.storageKeys.token, this.sessionToken);
      }
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const userJson = localStorage.getItem(this.storageKeys.user);
      const token = localStorage.getItem(this.storageKeys.token);

      if (userJson && token) {
        this.currentUser = JSON.parse(userJson);
        this.sessionToken = token;
        
        // Validate session on load
        this.validateSession();
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
      this.clearStorage();
    }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem(this.storageKeys.user);
      localStorage.removeItem(this.storageKeys.token);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
export type { User, UserProfile, AuthResponse };
