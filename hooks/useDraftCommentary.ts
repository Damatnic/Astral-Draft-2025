import React from 'react';
import { useAppState } from '../contexts/AppContext';
import type { League } from '../types';
import { players } from '../data/players';
import { generateDraftPickCommentary } from '../services/geminiService';

export const useDraftCommentary = (league: League | undefined) => {
    const { dispatch } = useAppState();
    const picksSoFar = league?.draftPicks.filter(p => p.playerId).length || 0;
    const prevPicksCount = React.useRef(picksSoFar);
    
    React.useEffect(() => {
        const currentPicksCount = league?.draftPicks.filter(p => p.playerId).length || 0;

        if (league && currentPicksCount > prevPicksCount.current) {
            const latestPick = league.draftPicks.filter(p => p.playerId).sort((a,b) => b.overall - a.overall)[0];
            if (!latestPick) return;

            const player = players.find(p => p.id === latestPick.playerId);
            const team = league.teams.find(t => t.id === latestPick.teamId);

            if (player && team) {
                generateDraftPickCommentary(player, team, latestPick.overall, latestPick.round, league).then(commentaryText => {
                    if (commentaryText) {
                        dispatch({
                            type: 'ADD_DRAFT_COMMENTARY',
                            payload: {
                                leagueId: league.id,
                                commentary: {
                                    pickNumber: latestPick.overall,
                                    text: commentaryText,
                                }
                            }
                        });
                    }
                });
            }
        }
        prevPicksCount.current = currentPicksCount;

    }, [picksSoFar, league, dispatch]);
};
