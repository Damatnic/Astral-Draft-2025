/**
 * Main Zustand store for global app state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
}

interface League {
  id: string;
  name: string;
  slug: string;
  teamCount: number;
  currentWeek: number;
  status: string;
}

interface Team {
  id: string;
  name: string;
  leagueId: string;
  wins: number;
  losses: number;
  ties: number;
  standing: number;
}

interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Current context
  currentLeague: League | null;
  setCurrentLeague: (league: League | null) => void;
  currentTeam: Team | null;
  setCurrentTeam: (team: Team | null) => void;
  
  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Notifications
  notifications: any[];
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Draft
  draftRoom: {
    isConnected: boolean;
    currentPick: number | null;
    timeRemaining: number | null;
  };
  setDraftRoom: (room: Partial<AppState['draftRoom']>) => void;
  
  // Preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    soundEnabled: boolean;
    notificationsEnabled: boolean;
  };
  setPreferences: (prefs: Partial<AppState['preferences']>) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  user: null,
  currentLeague: null,
  currentTeam: null,
  sidebarOpen: true,
  notifications: [],
  draftRoom: {
    isConnected: false,
    currentPick: null,
    timeRemaining: null,
  },
  preferences: {
    theme: 'system' as const,
    soundEnabled: true,
    notificationsEnabled: true,
  },
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,
        
        setUser: (user) =>
          set((state) => {
            state.user = user;
          }),
        
        setCurrentLeague: (league) =>
          set((state) => {
            state.currentLeague = league;
          }),
        
        setCurrentTeam: (team) =>
          set((state) => {
            state.currentTeam = team;
          }),
        
        toggleSidebar: () =>
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          }),
        
        setSidebarOpen: (open) =>
          set((state) => {
            state.sidebarOpen = open;
          }),
        
        addNotification: (notification) =>
          set((state) => {
            state.notifications.push({
              ...notification,
              id: notification.id || Date.now().toString(),
              timestamp: new Date().toISOString(),
            });
          }),
        
        removeNotification: (id) =>
          set((state) => {
            state.notifications = state.notifications.filter(
              (n) => n.id !== id
            );
          }),
        
        clearNotifications: () =>
          set((state) => {
            state.notifications = [];
          }),
        
        setDraftRoom: (room) =>
          set((state) => {
            state.draftRoom = { ...state.draftRoom, ...room };
          }),
        
        setPreferences: (prefs) =>
          set((state) => {
            state.preferences = { ...state.preferences, ...prefs };
          }),
        
        reset: () => set(() => initialState),
      })),
      {
        name: 'astral-draft-store',
        partialize: (state) => ({
          preferences: state.preferences,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    )
  )
);