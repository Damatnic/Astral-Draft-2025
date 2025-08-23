
import React from 'react';
import type { League, Player, PlayerPosition, User } from '../types';
import { players } from '../data/players';
import { getAiDraftPick } from '../services/geminiService';
import useSound from './useSound';
import { useAppState } from '../contexts/AppContext';
import { showNotification } from '../utils/notifications';

const DRAFT_SPEED_MS = 3000; // Increased speed slightly to account for API latency
const USER_PICK_TIME_LIMIT_MS = 60000;

export const useRealtimeDraft = (
    league: League | undefined, 
    isPaused: boolean,
    user: User, 
    dispatch: React.Dispatch<any>
) => {
    const { state } = useAppState();
    const playDraftSound = useSound('draft', 0.5);
    const playYourTurnSound = useSound('yourTurn', 0.3);

    const teams = league?.teams ?? [];
    const draftPicks = league?.draftPicks ?? [];
    const status = league?.status;

    const currentPick = draftPicks.filter(p => p.playerId).length + 1;
    const availablePlayers = players.filter(p => !draftPicks.some(dp => dp.playerId === p.id));
    const myTeamId = teams.find(t => t.owner.id === user.id)?.id;
    const teamOnClockId = league ? league.draftPicks[currentPick - 1]?.teamId : null;
    const isMyTurn = myTeamId === teamOnClockId;
    
    // Play sound on user's turn
    React.useEffect(() => {
        if (!league || isPaused || status !== 'DRAFTING') return;
        if (isMyTurn) {
            playYourTurnSound();
            showNotification("It's your turn to draft!", {
                body: `You are on the clock in ${league.name}.`,
                tag: `turn-notification-${league.id}`
            });
        }
    }, [isMyTurn, user.id, league, isPaused, status, playYourTurnSound]);

    React.useEffect(() => {
        if (!league || status !== 'DRAFTING' || isPaused || currentPick > league.draftPicks.length) {
            return;
        }

        const teamOnTheClock = league.teams.find(t => t.id === teamOnClockId);

        if (!teamOnTheClock) return;

        // AI Pick Logic
        if (teamOnTheClock.owner.id.startsWith('ai_')) {
            const pickTimer = setTimeout(async () => {
                const currentPicksInHook = league.draftPicks.filter(p => p.playerId).length;
                
                if ((currentPicksInHook + 1) !== currentPick) return;

                const availablePlayersNow = players.filter(p => !league.draftPicks.some(dp => dp.playerId === p.id));
                const recommendedPlayerName = await getAiDraftPick(teamOnTheClock, availablePlayersNow);
                let playerToDraft = recommendedPlayerName ? availablePlayersNow.find(p => p.name === recommendedPlayerName) : undefined;

                if (!playerToDraft) {
                    console.warn("Gemini pick failed or was invalid. Using fallback logic.");
                    const rosterCount = (pos: Player['position']) => teamOnTheClock.roster.filter(rp => rp.position === pos).length;
                    const ROSTER_LIMITS: { [key in PlayerPosition]: number } = { QB: 2, RB: 5, WR: 6, TE: 2, K: 1, DST: 1 };
                    const neededPlayers = availablePlayersNow.filter(p => rosterCount(p.position) < ROSTER_LIMITS[p.position]);
                    playerToDraft = neededPlayers[0] || availablePlayersNow[0];
                }

                if (playerToDraft) {
                    dispatch({ type: 'DRAFT_PLAYER', payload: { teamId: teamOnTheClock.id, player: playerToDraft } });
                    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${teamOnTheClock.name} drafted ${playerToDraft.name}`, type: 'DRAFT' }});
                    playDraftSound();
                }
            }, DRAFT_SPEED_MS);

            return () => clearTimeout(pickTimer);
        }
        
        // User Auto-Draft Logic
        if (isMyTurn) {
             const autoDraftTimer = setTimeout(() => {
                const myQueue = state.playerQueues[league.id] || [];
                const availablePlayersNow = players.filter(p => !league.draftPicks.some(dp => dp.playerId === p.id));
                const availablePlayerIds = new Set(availablePlayersNow.map(p => p.id));
                const playerToDraftFromQueue = myQueue.map(pid => players.find(p => p.id === pid)).find(p => p && availablePlayerIds.has(p.id));

                if (playerToDraftFromQueue) {
                    dispatch({ type: 'DRAFT_PLAYER', payload: { teamId: myTeamId, player: playerToDraftFromQueue } });
                    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Auto-drafted ${playerToDraftFromQueue.name} from your queue.`, type: 'SYSTEM' }});
                    playDraftSound();
                } else if(availablePlayersNow.length > 0) {
                     // Fallback: draft best available player if queue is empty/exhausted
                    dispatch({ type: 'DRAFT_PLAYER', payload: { teamId: myTeamId, player: availablePlayersNow[0] } });
                    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Auto-drafted ${availablePlayersNow[0].name} (Best Available).`, type: 'SYSTEM' }});
                    playDraftSound();
                }
            }, USER_PICK_TIME_LIMIT_MS);
            
            return () => clearTimeout(autoDraftTimer);
        }

    }, [currentPick, league, status, isPaused, dispatch, playDraftSound, isMyTurn, myTeamId, state.playerQueues, teamOnClockId]);

    const draftPlayer = React.useCallback((player: Player) => {
        if (!league) return;
        
        const internalCurrentPick = league.draftPicks.filter(p => p.playerId).length + 1;
        const currentTeamId = league.draftPicks[internalCurrentPick - 1]?.teamId;

        if (myTeamId === currentTeamId) {
            dispatch({ type: 'DRAFT_PLAYER', payload: { teamId: myTeamId, player } });
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `You drafted ${player.name}!`, type: 'DRAFT' }});
            playDraftSound();
        } else {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: "It's not your turn!", type: 'SYSTEM' } });
        }
    }, [league, myTeamId, dispatch, playDraftSound]);

    const latestPickOverall = draftPicks.filter(p => p.playerId).length;
    const latestPick = draftPicks.find(p => p.overall === latestPickOverall);
    const latestPlayer = latestPick ? players.find(p => p.id === latestPick.playerId) : null;

    return {
        teams,
        draftPicks,
        availablePlayers,
        currentPick,
        latestPick: latestPlayer && latestPick ? { ...latestPick, player: latestPlayer } : null,
        draftPlayer
    };
};
