/**
 * League Hook
 * Manages league state and operations
 */

import React from 'react';
import { useAppState } from './useAppState';
import { League, Team } from '../types';

interface UseLeagueReturn {
  league: League | null;
  myTeam: Team | null;
  isCommissioner: boolean;
  isLoading: boolean;
  selectLeague: (leagueId: string) => void;
  createLeague: (leagueData: Partial<League>) => Promise<void>;
  updateLeagueSettings: (settings: any) => void;
  joinLeague: (inviteCode: string) => Promise<void>;
}

export const useLeague = (): UseLeagueReturn => {
  const { state, dispatch } = useAppState();
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Get current league from state
  const league = state.selectedLeagueId 
    ? state.leagues.find(l => l.id === state.selectedLeagueId) || null
    : null;
  
  // Get user's team in the current league
  const myTeam = React.useMemo(() => {
    if (!league || !state.user) return null;
    return league.teams.find(t => t.ownerId === state.user.id) || null;
  }, [league, state.user]);
  
  // Check if user is commissioner
  const isCommissioner = React.useMemo(() => {
    if (!league || !state.user) return false;
    return league.commissioner === state.user.id;
  }, [league, state.user]);
  
  const selectLeague = (leagueId: string) => {
    dispatch({ type: 'SELECT_LEAGUE', payload: leagueId });
  };
  
  const createLeague = async (leagueData: Partial<League>) => {
    setIsLoading(true);
    try {
      const newLeague = {
        id: Date.now().toString(),
        name: leagueData.name || 'New League',
        season: 2025,
        currentWeek: 0,
        status: 'PRE_DRAFT' as const,
        teams: [],
        commissioner: state.user?.id || '',
        settings: {
          numTeams: 10,
          scoringType: 'PPR' as const,
          playoffTeams: 6,
          tradeDeadline: 10,
          waiverType: 'FAAB' as const,
          waiverBudget: 100,
          ...leagueData.settings
        },
        ...leagueData
      };
      
      dispatch({ type: 'CREATE_LEAGUE', payload: newLeague });
      dispatch({ type: 'SELECT_LEAGUE', payload: newLeague.id });
    } catch (error) {
      console.error('Failed to create league:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateLeagueSettings = (settings: any) => {
    if (!league) return;
    
    dispatch({
      type: 'UPDATE_LEAGUE_SETTINGS',
      payload: {
        leagueId: league.id,
        settings
      }
    });
  };
  
  const joinLeague = async (inviteCode: string) => {
    setIsLoading(true);
    try {
      // For testing, just add user to first available league
      const availableLeague = state.leagues.find(l => 
        l.teams.length < (l.settings?.numTeams || 10)
      );
      
      if (availableLeague && state.user) {
        const newTeam: Team = {
          id: Date.now(),
          name: `${state.user.name}'s Team`,
          owner: state.user.name,
          ownerId: state.user.id,
          avatar: state.user.avatar || '🏈',
          roster: [],
          record: { wins: 0, losses: 0, ties: 0 },
          pointsFor: 0,
          pointsAgainst: 0,
          currentStreak: 0,
          championshipProbability: 10.0
        };
        
        dispatch({
          type: 'ADD_TEAM_TO_LEAGUE',
          payload: {
            leagueId: availableLeague.id,
            team: newTeam
          }
        });
        
        selectLeague(availableLeague.id);
      } else {
        throw new Error('No available leagues or user not logged in');
      }
    } catch (error) {
      console.error('Failed to join league:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    league,
    myTeam,
    isCommissioner,
    isLoading,
    selectLeague,
    createLeague,
    updateLeagueSettings,
    joinLeague
  };
};

export default useLeague;