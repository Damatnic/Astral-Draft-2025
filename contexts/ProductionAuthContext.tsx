/**
 * Production Authentication Context
 * Comprehensive JWT-based authentication system with email verification,
 * password reset, user profiles, and secure session management
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  subscription: 'free' | 'premium' | 'oracle_pro';
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string;
  customization: {
    backgroundColor: string;
    emoji: string;
    theme: 'dark' | 'light' | 'auto';
  };
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      predictions: boolean;
      leaderboard: boolean;
      weekly_summary: boolean;
    };
    privacy: {
      showProfile: boolean;
      showStats: boolean;
      allowFriendRequests: boolean;
    };
  };
  stats: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    rank: number;
    streak: number;
    points: number;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ResetPasswordData {
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  resetPassword: (data: ResetPasswordData) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: ChangePasswordData) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

// JWT Token Interface
interface JWTPayload {
  userId: string;
  email: string;
  subscription: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com/api' 
  : 'http://localhost:3001/api';

// Token Storage Keys
const TOKEN_KEY = 'astral_draft_token';
const REFRESH_TOKEN_KEY = 'astral_draft_refresh_token';

// Helper Functions
const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Handle localStorage errors silently
  }
};

const removeStoredToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Handle localStorage errors silently
  }
};

const isTokenValid = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
};

// API Helper
const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  const token = getStoredToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Production Auth Provider
export const ProductionAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  });

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getStoredToken();
      
      if (!token || !isTokenValid(token)) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Fetch current user data
        const userData = await apiRequest('/auth/me');
        
        setAuthState({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          token,
        });
      } catch (error) {
        console.error('Auth initialization failed:', error);
        removeStoredToken();
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token
  useEffect(() => {
    if (!authState.token || !authState.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        const decoded = jwtDecode<JWTPayload>(authState.token!);
        const timeUntilExpiry = decoded.exp * 1000 - Date.now();
        
        // Refresh if token expires in less than 5 minutes
        if (timeUntilExpiry < 5 * 60 * 1000) {
          await refreshToken();
        }
      } catch (error) {
        console.error('Token refresh check failed:', error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [authState.token, authState.isAuthenticated]);

  // Login
  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      const { user, token, refreshToken } = response;

      setStoredToken(token);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        token,
      });

      return { success: true };
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  // Register
  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setAuthState(prev => ({ ...prev, isLoading: false }));

      return { 
        success: true
      };
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  // Logout
  const logout = () => {
    removeStoredToken();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
    });

    // Optional: Call logout endpoint to invalidate server-side session
    apiRequest('/auth/logout', { method: 'POST' }).catch(() => {
      // Ignore errors - local logout should still work
    });
  };

  // Refresh Token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await apiRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      const { token, user } = response;

      setStoredToken(token);
      setAuthState(prev => ({
        ...prev,
        token,
        user,
      }));

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  // Reset Password
  const resetPassword = async (data: ResetPasswordData): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Password reset failed' };
    }
  };

  // Change Password
  const changePassword = async (data: ChangePasswordData): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Password change failed' };
    }
  };

  // Update Profile
  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      setAuthState(prev => ({
        ...prev,
        user: { ...prev.user, ...response.user },
      }));

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Profile update failed' };
    }
  };

  // Verify Email
  const verifyEmail = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiRequest(`/auth/verify-email/${token}`, {
        method: 'POST',
      });

      // Refresh user data to update emailVerified status
      if (authState.isAuthenticated) {
        const userData = await apiRequest('/auth/me');
        setAuthState(prev => ({ ...prev, user: userData }));
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Email verification failed' };
    }
  };

  // Resend Verification
  const resendVerification = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiRequest('/auth/resend-verification', {
        method: 'POST',
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to resend verification' };
    }
  };

  // Delete Account
  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiRequest('/auth/delete-account', {
        method: 'DELETE',
      });

      logout();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Account deletion failed' };
    }
  };

  const contextValue: AuthContextType = useMemo(() => ({
    ...authState,
    login,
    register,
    logout,
    refreshToken,
    resetPassword,
    changePassword,
    updateProfile,
    verifyEmail,
    resendVerification,
    deleteAccount,
  }), [authState]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useProductionAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useProductionAuth must be used within a ProductionAuthProvider');
  }
  return context;
};

export default ProductionAuthProvider;
