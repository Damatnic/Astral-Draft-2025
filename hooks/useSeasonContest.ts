import { useState, useEffect, useCallback } from 'react';
import { seasonContestService, SeasonContest, BracketPick, AwardPick } from '../services/seasonContestService';

export interface UseSeasonContestOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface SeasonContestHookReturn {
  // Contest data
  userContests: SeasonContest[];
  availableContests: SeasonContest[];
  selectedContest: SeasonContest | null;
  
  // Loading states
  loading: boolean;
  submitting: boolean;
  
  // Actions
  selectContest: (contestId: string) => void;
  joinContest: (contestId: string) => Promise<boolean>;
  submitWeeklyPredictions: (week: number, predictions: { [categoryId: string]: any }) => Promise<boolean>;
  submitBracketPredictions: (picks: BracketPick[]) => Promise<boolean>;
  submitAwardPredictions: (picks: AwardPick[]) => Promise<boolean>;
  
  // Utilities
  getUserRank: (contestId?: string) => number;
  getUserScore: (contestId?: string) => number;
  getWeeklyScore: (week: number, contestId?: string) => number;
  refreshContests: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for managing season contest functionality
 */
export function useSeasonContest(options: UseSeasonContestOptions): SeasonContestHookReturn {
  const { userId, autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [userContests, setUserContests] = useState<SeasonContest[]>([]);
  const [availableContests, setAvailableContests] = useState<SeasonContest[]>([]);
  const [selectedContest, setSelectedContest] = useState<SeasonContest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user contests and available contests
  const refreshContests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's contests
      const userContestsList = seasonContestService.getUserContests(userId);
      setUserContests(userContestsList);

      // Get available contests (not joined by user)
      const allActiveContests = seasonContestService.getActiveContests();
      const available = allActiveContests.filter(contest => 
        !userContestsList.some(uc => uc.id === contest.id)
      );
      setAvailableContests(available);

      // Set default selected contest if none selected
      if (!selectedContest && userContestsList.length > 0) {
        setSelectedContest(userContestsList[0]);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contests';
      setError(errorMessage);
      console.error('Error loading contests:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedContest]);

  // Initial load
  useEffect(() => {
    refreshContests();
  }, [refreshContests]);

  // Auto-refresh contests
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshContests, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshContests]);

  // Select contest
  const selectContest = useCallback((contestId: string) => {
    const contest = userContests.find(c => c.id === contestId);
    if (contest) {
      setSelectedContest(contest);
    }
  }, [userContests]);

  // Join contest
  const joinContest = useCallback(async (contestId: string): Promise<boolean> => {
    try {
      setSubmitting(true);
      setError(null);

      const contest = availableContests.find(c => c.id === contestId);
      if (!contest) {
        throw new Error('Contest not found');
      }

      // Mock user data - in real app this would come from auth/user service
      const success = seasonContestService.joinContest(
        contestId,
        userId,
        'Your Name', // This should come from user service
        '/default-avatar.png' // This should come from user service
      );

      if (success) {
        await refreshContests();
        
        // Select the newly joined contest
        const updatedContest = seasonContestService.getContest(contestId);
        if (updatedContest) {
          setSelectedContest(updatedContest);
        }
      }

      return success;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join contest';
      setError(errorMessage);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [availableContests, userId, refreshContests]);

  // Submit weekly predictions
  const submitWeeklyPredictions = useCallback(async (
    week: number, 
    predictions: { [categoryId: string]: any }
  ): Promise<boolean> => {
    if (!selectedContest) {
      setError('No contest selected');
      return false;
    }

    try {
      setSubmitting(true);
      setError(null);

      const success = seasonContestService.submitWeeklyPredictions(
        selectedContest.id,
        userId,
        week,
        predictions
      );

      if (success) {
        // Refresh to get updated contest data
        await refreshContests();
      }

      return success;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit predictions';
      setError(errorMessage);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [selectedContest, userId, refreshContests]);

  // Submit bracket predictions
  const submitBracketPredictions = useCallback(async (picks: BracketPick[]): Promise<boolean> => {
    if (!selectedContest) {
      setError('No contest selected');
      return false;
    }

    try {
      setSubmitting(true);
      setError(null);

      const success = seasonContestService.submitBracketPredictions(
        selectedContest.id,
        userId,
        picks
      );

      if (success) {
        await refreshContests();
      }

      return success;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit bracket picks';
      setError(errorMessage);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [selectedContest, userId, refreshContests]);

  // Submit award predictions
  const submitAwardPredictions = useCallback(async (picks: AwardPick[]): Promise<boolean> => {
    if (!selectedContest) {
      setError('No contest selected');
      return false;
    }

    try {
      setSubmitting(true);
      setError(null);

      const success = seasonContestService.submitAwardPredictions(
        selectedContest.id,
        userId,
        picks
      );

      if (success) {
        await refreshContests();
      }

      return success;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit award picks';
      setError(errorMessage);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [selectedContest, userId, refreshContests]);

  // Get user's rank in contest
  const getUserRank = useCallback((contestId?: string): number => {
    const contest = contestId ? 
      userContests.find(c => c.id === contestId) : 
      selectedContest;
    
    if (!contest) return 0;
    
    const participant = contest.participants.find(p => p.userId === userId);
    return participant?.currentRank || 0;
  }, [userContests, selectedContest, userId]);

  // Get user's total score in contest
  const getUserScore = useCallback((contestId?: string): number => {
    const contest = contestId ? 
      userContests.find(c => c.id === contestId) : 
      selectedContest;
    
    if (!contest) return 0;
    
    const participant = contest.participants.find(p => p.userId === userId);
    return participant?.totalScore || 0;
  }, [userContests, selectedContest, userId]);

  // Get user's weekly score
  const getWeeklyScore = useCallback((week: number, contestId?: string): number => {
    const contest = contestId ? 
      userContests.find(c => c.id === contestId) : 
      selectedContest;
    
    if (!contest) return 0;
    
    const participant = contest.participants.find(p => p.userId === userId);
    return participant?.weeklyScores[week] || 0;
  }, [userContests, selectedContest, userId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Contest data
    userContests,
    availableContests,
    selectedContest,
    
    // Loading states
    loading,
    submitting,
    
    // Actions
    selectContest,
    joinContest,
    submitWeeklyPredictions,
    submitBracketPredictions,
    submitAwardPredictions,
    
    // Utilities
    getUserRank,
    getUserScore,
    getWeeklyScore,
    refreshContests,
    
    // Error handling
    error,
    clearError
  };
}

export default useSeasonContest;
