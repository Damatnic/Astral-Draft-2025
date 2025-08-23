/**
 * Mobile Offline Hook
 * React hook for managing offline functionality in mobile components
 */

import React from 'react';
import { mobileOfflineService } from '../services/mobileOfflineService';
import { Player, Team, League } from '../types';

interface OfflineState {
    isOffline: boolean;
    hasOfflineData: boolean;
    pendingActions: any[];
    lastSync: Date | null;
    syncInProgress: boolean;
}

interface OfflineActions {
    cacheDraftData: (players: Player[], leagues: League[], teams: Team[]) => Promise<void>;
    getCachedPlayers: () => Player[];
    getCachedLeagues: () => League[];
    draftPlayerOffline: (playerId: number, teamId: number, pick: number) => Promise<boolean>;
    queueAction: (type: string, payload: any) => string;
    syncPendingActions: () => Promise<void>;
    clearOfflineData: () => void;
}

export const useMobileOffline = (): [OfflineState, OfflineActions] => {
    const [state, setState] = React.useState<OfflineState>(mobileOfflineService.getState());

    React.useEffect(() => {
        const unsubscribe = mobileOfflineService.subscribe((newState) => {
            setState(newState);
        });

        return unsubscribe;
    }, []);

    const actions = React.useMemo<OfflineActions>(() => ({
        cacheDraftData: async (players: Player[], leagues: League[], teams: Team[]) => {
            await mobileOfflineService.cacheDraftData(players, leagues, teams);
        },
        
        getCachedPlayers: () => {
            return mobileOfflineService.getCachedPlayers();
        },
        
        getCachedLeagues: () => {
            return mobileOfflineService.getCachedLeagues();
        },
        
        draftPlayerOffline: async (playerId: number, teamId: number, pick: number) => {
            return await mobileOfflineService.draftPlayerOffline(playerId, teamId, pick);
        },
        
        queueAction: (type: string, payload: any) => {
            return mobileOfflineService.queueOfflineAction(type as any, payload);
        },
        
        syncPendingActions: async () => {
            await mobileOfflineService.syncPendingActions();
        },
        
        clearOfflineData: () => {
            mobileOfflineService.clearOfflineData();
        }
    }), []);

    return [state, actions];
};

export default useMobileOffline;
