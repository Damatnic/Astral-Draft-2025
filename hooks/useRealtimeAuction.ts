


import React from 'react';
import type { League, Team, Player, User, AuctionState } from '../types';
import { getAiNomination, getAiBid } from '../services/geminiService';
import { players } from '../data/players';
import useSound from './useSound';

const AUCTION_TIMER_SECONDS = 10;
const AI_ACTION_DELAY_MS = 2000;

export const useRealtimeAuction = (
    league: League | undefined,
    isPaused: boolean,
    user: User,
    dispatch: React.Dispatch<any>
) => {
    const playNominationSound = useSound('yourTurn', 0.4);
    const playBidSound = useSound('bid', 0.5);
    const playSoldSound = useSound('sold', 0.6);

    const auctionState = league?.auctionState;
    const teams = league?.teams ?? [];
    const draftedPlayerIds = new Set(league?.draftPicks.map(p => p.playerId));
    const availablePlayers = players.filter(p => !draftedPlayerIds.has(p.id));
    
    // Timer Logic
    React.useEffect(() => {
        if (isPaused || !league || !auctionState || !auctionState.nominatedPlayerId || auctionState.lastBidTimestamp === 0) {
            return;
        }

        const interval = setInterval(() => {
            const timeSinceLastBid = (Date.now() - auctionState.lastBidTimestamp) / 1000;
            if (timeSinceLastBid >= AUCTION_TIMER_SECONDS) {
                const soldPlayer = players.find(p => p.id === auctionState.nominatedPlayerId)
                dispatch({ type: 'PROCESS_AUCTION_SALE', payload: { leagueId: league.id } });
                dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${soldPlayer?.name} sold!`, type: 'DRAFT' }});
                playSoldSound();
            }
        }, 1000);

        return () => clearInterval(interval);

    }, [auctionState, isPaused, league, dispatch, playSoldSound]);

    // AI Logic (Nomination and Bidding)
    React.useEffect(() => {
        if (isPaused || !league || !auctionState || league.status !== 'DRAFTING') {
            return;
        }

        const nominatingTeam = teams.find(t => t.id === auctionState.nominatingTeamId);
        
        // AI Nomination
        if (!auctionState.nominatedPlayerId && nominatingTeam?.owner.id.startsWith('ai_')) {
            const timer = setTimeout(async () => {
                const playerName = await getAiNomination(nominatingTeam, availablePlayers);
                const playerToNominate = availablePlayers.find(p => p.name === playerName) || availablePlayers[Math.floor(Math.random() * 20)];
                if (playerToNominate) {
                    dispatch({ type: 'AUCTION_NOMINATE', payload: { leagueId: league.id, playerId: playerToNominate.id, teamId: nominatingTeam.id } });
                    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${nominatingTeam.name} nominates ${playerToNominate.name}.`, type: 'DRAFT' } });
                    playNominationSound();
                }
            }, AI_ACTION_DELAY_MS);
            return () => clearTimeout(timer);
        }

        // AI Bidding
        if (auctionState.nominatedPlayerId) {
            const nominatedPlayer = players.find(p => p.id === auctionState.nominatedPlayerId)!;
            
            const aiTeamsToAct = teams.filter(t => t.owner.id.startsWith('ai_') && t.id !== auctionState.highBidderId && t.budget > auctionState.currentBid);

            aiTeamsToAct.forEach(aiTeam => {
                const bidTimer = setTimeout(async () => {
                    const latestAuctionState = league?.auctionState; // Get latest state
                    if (!latestAuctionState || latestAuctionState.highBidderId === aiTeam.id || isPaused) return;

                    const newBid = await getAiBid(aiTeam, nominatedPlayer, latestAuctionState.currentBid);
                    if (newBid) {
                        dispatch({ type: 'AUCTION_BID', payload: { leagueId: league.id, teamId: aiTeam.id, bid: newBid } });
                        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${aiTeam.name} bids $${newBid}.`, type: 'DRAFT' }});
                        playBidSound();
                    }
                }, AI_ACTION_DELAY_MS + Math.random() * 2000); // Stagger AI bids
            });
        }

    }, [auctionState, isPaused, league, availablePlayers, dispatch, playBidSound, playNominationSound]);
    
    const myTeam = teams.find(t => t.owner.id === user.id);
    const nominatedPlayer = auctionState?.nominatedPlayerId ? players.find(p => p.id === auctionState.nominatedPlayerId) : null;
    const highBidderTeam = auctionState?.highBidderId ? teams.find(t => t.id === auctionState.highBidderId) : null;
    const nominatingTeam = auctionState ? teams.find(t => t.id === auctionState.nominatingTeamId) : null;
    
    const timeLeft = auctionState?.lastBidTimestamp ? Math.max(0, AUCTION_TIMER_SECONDS - Math.floor((Date.now() - auctionState.lastBidTimestamp) / 1000)) : 0;
    
    const isMyNominationTurn = myTeam && auctionState?.nominatingTeamId === myTeam.id;

    const placeBid = (bid: number) => {
        if (!league || !myTeam) return;
        dispatch({ type: 'AUCTION_BID', payload: { leagueId: league.id, teamId: myTeam.id, bid } });
        playBidSound();
    };

    const nominatePlayer = (player: Player) => {
        if (!league || !myTeam) return;
        dispatch({ type: 'AUCTION_NOMINATE', payload: { leagueId: league.id, playerId: player.id, teamId: myTeam.id } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `You nominated ${player.name}.`, type: 'DRAFT' }});
        playNominationSound();
    };
    
    return {
        teams,
        availablePlayers,
        nominatedPlayer,
        nominatingTeam,
        currentBid: auctionState?.currentBid ?? 0,
        highBidderTeam,
        timeLeft,
        myTeam,
        bidHistory: auctionState?.bidHistory ?? [],
        isMyNominationTurn: !!isMyNominationTurn && !auctionState?.nominatedPlayerId,
        isBiddingActive: !!auctionState?.nominatedPlayerId,
        placeBid,
        nominatePlayer,
    };
};