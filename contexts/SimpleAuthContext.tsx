/**
 * Simple Authentication Context for Astral Draft
 * Works with SimpleAuthService for 10-player + admin system
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import SimpleAuthService, { SimpleUser } from '../services/simpleAuthService';

interface SimpleAuthContextType {
    user: SimpleUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (user: SimpleUser) => void;
    logout: () => void;
    updateUserPin: (newPin: string) => Promise<boolean>;
    updateUserEmail: (email: string) => Promise<boolean>;
    updateUserCustomization: (customization: Partial<SimpleUser['customization']>) => Promise<boolean>;
    updateUserDisplayName: (displayName: string) => Promise<boolean>;
    clearError: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

interface Props {
    children: ReactNode;
}

export const SimpleAuthProvider: React.FC<Props> = ({ children }) => {
    const [user, setUser] = useState<SimpleUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize and check for existing session
    useEffect(() => {
        const initializeAuth = () => {
            try {
                SimpleAuthService.initialize();
                const session = SimpleAuthService.getCurrentSession();
                
                if (session) {
                    setUser(session.user);
                }
            } catch (err) {
                console.error('Failed to initialize auth:', err);
                setError('Failed to initialize authentication');
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = (loggedInUser: SimpleUser) => {
        setUser(loggedInUser);
        setError(null);
    };

    const logout = () => {
        SimpleAuthService.logout();
        setUser(null);
        setError(null);
    };

    const updateUserPin = async (newPin: string): Promise<boolean> => {
        if (!user) return false;

        try {
            const success = SimpleAuthService.updateUserPin(user.id, newPin);
            if (success) {
                setUser({ ...user, pin: newPin });
            }
            return success;
        } catch (err) {
            console.error('Failed to update PIN:', err);
            setError('Failed to update PIN');
            return false;
        }
    };

    const updateUserEmail = async (email: string): Promise<boolean> => {
        if (!user) return false;

        try {
            const success = SimpleAuthService.updateUserEmail(user.id, email);
            if (success) {
                setUser({ ...user, email });
            }
            return success;
        } catch (err) {
            console.error('Failed to update email:', err);
            setError('Failed to update email');
            return false;
        }
    };

    const updateUserCustomization = async (customization: Partial<SimpleUser['customization']>): Promise<boolean> => {
        if (!user) return false;

        try {
            const success = SimpleAuthService.updateUserCustomization(user.id, customization);
            if (success) {
                setUser({
                    ...user,
                    customization: { ...user.customization, ...customization }
                });
            }
            return success;
        } catch (err) {
            console.error('Failed to update customization:', err);
            setError('Failed to update customization');
            return false;
        }
    };

    const updateUserDisplayName = async (displayName: string): Promise<boolean> => {
        if (!user) return false;

        try {
            const success = SimpleAuthService.updateUserDisplayName(user.id, displayName);
            if (success) {
                setUser({ ...user, displayName });
            }
            return success;
        } catch (err) {
            console.error('Failed to update display name:', err);
            setError('Failed to update display name');
            return false;
        }
    };

    const clearError = () => {
        setError(null);
    };

    const value: SimpleAuthContextType = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        updateUserPin,
        updateUserEmail,
        updateUserCustomization,
        updateUserDisplayName,
        clearError
    }), [user, isLoading, error]);

    return (
        <SimpleAuthContext.Provider value={value}>
            {children}
        </SimpleAuthContext.Provider>
    );
};

export const useAuth = (): SimpleAuthContextType => {
    const context = useContext(SimpleAuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a SimpleAuthProvider');
    }
    return context;
};

export default SimpleAuthProvider;
