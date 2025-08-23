/**
 * Authentication Hook
 * Manages user authentication state and methods
 */

import React from 'react';
import { useAppState } from './useAppState';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const { state, dispatch } = useAppState();
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Check for existing session on mount
  React.useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');
    
    if (storedUser && authToken) {
      const user = JSON.parse(storedUser);
      dispatch({ type: 'SET_USER', payload: user });
    }
  }, [dispatch]);
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // For testing, use the test users
      const testUsers = JSON.parse(localStorage.getItem('testUsers') || '[]');
      const user = testUsers.find((u: any) => u.email === email && u.password === password);
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('authToken', `test-token-${user.id}`);
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    dispatch({ type: 'SET_USER', payload: null });
  };
  
  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // For testing, create a new user
      const newUser = {
        id: Date.now().toString(),
        email,
        name,
        avatar: '🎯'
      };
      
      // Store in test users
      const testUsers = JSON.parse(localStorage.getItem('testUsers') || '[]');
      testUsers.push({ ...newUser, password });
      localStorage.setItem('testUsers', JSON.stringify(testUsers));
      
      // Log them in
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      localStorage.setItem('authToken', `test-token-${newUser.id}`);
      dispatch({ type: 'SET_USER', payload: newUser });
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    user: state.user,
    isAuthenticated: !!state.user,
    isLoading,
    login,
    logout,
    signup
  };
};

export default useAuth;