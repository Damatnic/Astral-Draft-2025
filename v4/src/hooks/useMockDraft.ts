import { useState, useCallback } from 'react';
import type { DraftState, Team, DraftPick, QueuedPlayer, UseMockDraftReturn } from '../types/draft';

export function useMockDraft(mockDraftId?: string): UseMockDraftReturn {
  const [isDrafting, setIsDrafting] = useState(false);
  const [currentPick, setCurrentPick] = useState(1);
  const [queue, setQueue] = useState<QueuedPlayer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [isMyTurn, setIsMyTurn] = useState(false);
  
  const draftState: DraftState = {
    isDrafting,
    currentPick,
    totalPicks: 160,
    currentRound: Math.ceil(currentPick / 10),
    currentPickInRound: ((currentPick - 1) % 10) + 1,
    picks: [] as DraftPick[],
    teams: [] as Team[],
    currentTeam: null,
    myTeamId: 'team-1'
  };
  
  const startDraft = useCallback(() => {
    setIsDrafting(true);
    setIsMyTurn(true);
  }, []);
  
  const makePick = useCallback(async (playerId: string) => {
    setCurrentPick(prev => prev + 1);
    setIsMyTurn(false);
    // Simulate other teams picking
    setTimeout(() => setIsMyTurn(true), 2000);
  }, []);
  
  const pauseDraft = useCallback(() => {
    setIsDrafting(false);
  }, []);
  
  const resetDraft = useCallback(() => {
    setIsDrafting(false);
    setCurrentPick(1);
    setQueue([]);
    setTimeRemaining(90);
    setIsMyTurn(false);
  }, []);
  
  const addToQueue = useCallback((player: QueuedPlayer) => {
    setQueue(prev => [...prev, player]);
  }, []);
  
  const removeFromQueue = useCallback((playerId: string) => {
    setQueue(prev => prev.filter(player => player.playerId !== playerId));
  }, []);
  
  const simulatePick = useCallback(async () => {
    // Simulate AI making a pick
    setCurrentPick(prev => prev + 1);
  }, []);
  
  return {
    draftState,
    isMyTurn,
    timeRemaining,
    isDrafting,
    currentPick,
    startDraft,
    makePick,
    pauseDraft,
    resetDraft,
    addToQueue,
    removeFromQueue,
    queue,
    simulatePick
  };
}