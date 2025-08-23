/**
 * Authentication Context for Astral Draft
 * Integrates with secure backend authentication system
 */
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo } from 'react';
import { authService } from '../services/authService';

// Types for authentication state (matching backend User interface)
interface User {
    id: number;
    username: string;
    email: string;
    display_name: string;
    avatar_url?: string;
    created_at: string;
}

interface AuthState {
    user: User | null;
    sessionToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;
}

// Auth actions
type AuthAction =
    | { type: 'AUTH_START' }
    | { type: 'AUTH_SUCCESS'; payload: { user: User; sessionToken: string } }
    | { type: 'AUTH_FAILURE'; payload: string }
    | { type: 'AUTH_LOGOUT' }
    | { type: 'AUTH_CLEAR_ERROR' }
    | { type: 'AUTH_INITIALIZED' }
    | { type: 'USER_UPDATE'; payload: Partial<User> };

// Initial auth state
const initialAuthState: AuthState = {
    user: null,
    sessionToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isInitialized: false,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'AUTH_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };

        case 'AUTH_SUCCESS':
            // Store session token in localStorage for persistence
            localStorage.setItem('sessionToken', action.payload.sessionToken);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            
            return {
                ...state,
                user: action.payload.user,
                sessionToken: action.payload.sessionToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };

        case 'AUTH_FAILURE':
            // Clear any stored auth data on failure
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('user');
            
            return {
                ...state,
                user: null,
                sessionToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload,
            };

        case 'AUTH_LOGOUT':
            // Clear all stored auth data
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('user');
            
            return {
                ...state,
                user: null,
                sessionToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };

        case 'AUTH_CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };

        case 'AUTH_INITIALIZED':
            return {
                ...state,
                isInitialized: true,
                isLoading: false,
            };

        case 'USER_UPDATE': {
            const updatedUser = state.user ? { ...state.user, ...action.payload } : null;
            if (updatedUser) {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            return {
                ...state,
                user: updatedUser,
            };
        }

        default:
            return state;
    }
};

// Context interface
interface AuthContextType {
    // State
    user: User | null;
    sessionToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<void>;
    clearError: () => void;
    checkAuth: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialAuthState);

    // Initialize auth state on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                dispatch({ type: 'AUTH_START' });
                
                // Check for stored session data
                const storedToken = localStorage.getItem('sessionToken');
                const storedUser = localStorage.getItem('user');
                
                if (storedToken && storedUser) {
                    try {
                        // Verify stored session is still valid
                        const isValid = await authService.validateSession();
                        
                        if (isValid) {
                            const user = JSON.parse(storedUser);
                            dispatch({
                                type: 'AUTH_SUCCESS',
                                payload: {
                                    user,
                                    sessionToken: storedToken,
                                },
                            });
                        } else {
                            // Invalid session, clear storage
                            localStorage.removeItem('sessionToken');
                            localStorage.removeItem('user');
                            dispatch({ type: 'AUTH_INITIALIZED' });
                        }
                    } catch (validationError) {
                        // Session validation failed, clear storage
                        console.warn('Session validation failed:', validationError);
                        localStorage.removeItem('sessionToken');
                        localStorage.removeItem('user');
                        dispatch({ type: 'AUTH_INITIALIZED' });
                    }
                } else {
                    dispatch({ type: 'AUTH_INITIALIZED' });
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                dispatch({ type: 'AUTH_INITIALIZED' });
            }
        };

        initializeAuth();
    }, []);

    // Login function
    const login = async (email: string, password: string): Promise<void> => {
        try {
            dispatch({ type: 'AUTH_START' });
            
            const result = await authService.login(email, password);
            
            if (result.success && result.data?.user && result.data?.session_token) {
                dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: {
                        user: result.data.user,
                        sessionToken: result.data.session_token,
                    },
                });
            } else {
                dispatch({
                    type: 'AUTH_FAILURE',
                    payload: result.error || 'Login failed',
                });
            }
        } catch (error) {
            dispatch({
                type: 'AUTH_FAILURE',
                payload: error instanceof Error ? error.message : 'Login failed',
            });
        }
    };

    // Register function
    const register = async (
        username: string,
        email: string,
        password: string,
        displayName?: string
    ): Promise<void> => {
        try {
            dispatch({ type: 'AUTH_START' });
            
            const result = await authService.register(username, email, password, displayName);
            
            if (result.success && result.data?.user && result.data?.session_token) {
                dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: {
                        user: result.data.user,
                        sessionToken: result.data.session_token,
                    },
                });
            } else {
                dispatch({
                    type: 'AUTH_FAILURE',
                    payload: result.error || 'Registration failed',
                });
            }
        } catch (error) {
            dispatch({
                type: 'AUTH_FAILURE',
                payload: error instanceof Error ? error.message : 'Registration failed',
            });
        }
    };

    // Logout function
    const logout = async (): Promise<void> => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch({ type: 'AUTH_LOGOUT' });
        }
    };

    // Update profile function
    const updateProfile = async (updates: Partial<User>): Promise<void> => {
        if (!state.user) {
            throw new Error('User not authenticated');
        }

        try {
            dispatch({ type: 'AUTH_START' });
            
            const result = await authService.updateProfile(updates);
            
            if (result) {
                // Fetch updated user profile
                const updatedProfile = await authService.getProfile();
                if (updatedProfile) {
                    dispatch({
                        type: 'USER_UPDATE',
                        payload: updatedProfile,
                    });
                }
            } else {
                dispatch({
                    type: 'AUTH_FAILURE',
                    payload: 'Profile update failed',
                });
            }
        } catch (error) {
            dispatch({
                type: 'AUTH_FAILURE',
                payload: error instanceof Error ? error.message : 'Profile update failed',
            });
        }
    };

    // Clear error function
    const clearError = (): void => {
        dispatch({ type: 'AUTH_CLEAR_ERROR' });
    };

    // Check auth function for manual validation
    const checkAuth = async (): Promise<void> => {
        try {
            const result = authService.getCurrentUser();
            
            if (result) {
                // Auth is valid, update user data
                dispatch({
                    type: 'USER_UPDATE',
                    payload: result,
                });
            } else {
                // Auth is invalid, logout
                dispatch({ type: 'AUTH_LOGOUT' });
            }
        } catch (error) {
            console.error('Auth check error:', error);
            dispatch({ type: 'AUTH_LOGOUT' });
        }
    };

    // Memoized context value
    const contextValue = useMemo<AuthContextType>(
        () => ({
            // State
            user: state.user,
            sessionToken: state.sessionToken,
            isAuthenticated: state.isAuthenticated,
            isLoading: state.isLoading,
            error: state.error,
            isInitialized: state.isInitialized,

            // Actions
            login,
            register,
            logout,
            updateProfile,
            clearError,
            checkAuth,
        }),
        [state]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Permission-based hook for role/permission checking
export const usePermission = (permission?: string) => {
    const { user, isAuthenticated } = useAuth();
    
    return useMemo(() => {
        if (!isAuthenticated || !user) return false;
        
        // For MVP, all authenticated users have basic permissions
        // This can be extended with role-based permissions later
        if (!permission) return true;
        
        // Add specific permission logic here when roles are implemented
        return true;
    }, [user, isAuthenticated, permission]);
};

// Loading component for auth initialization
export const AuthInitializer: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
    children,
    fallback = <div>Loading...</div>,
}) => {
    const { isInitialized } = useAuth();
    
    if (!isInitialized) {
        return <>{fallback}</>;
    }
    
    return <>{children}</>;
};

export default AuthProvider;
