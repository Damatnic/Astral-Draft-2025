
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { liveDataService } from '../services/liveDataService';
import type { League, Team, GamedayEvent, LiveNewsItem } from '../types';

export const useLiveData = (league?: League, myTeam?: Team, opponentTeam?: Team) => {
    const { state, dispatch } = useAppState();
    const [latestNews, setLatestNews] = React.useState<LiveNewsItem | null>(null);

    React.useEffect(() => {
        // Only start the service if we are on the MATCHUP view and have all the data.
        if (state.currentView === 'MATCHUP' && league && myTeam && opponentTeam) {
            const handleEvent = (event: GamedayEvent | LiveNewsItem) => {
                if ('type' in event && 'player' in event) { // It's a GamedayEvent
                    const matchup = league.schedule.find(m =>
                        m.week === league.currentWeek &&
                        (m.teamA.teamId === myTeam.id || m.teamB.teamId === myTeam.id)
                    );
                    if (matchup) {
                        dispatch({
                            type: 'ADD_GAMEDAY_EVENT',
                            payload: { matchupId: matchup.id, event }
                        });
                    }
                } else { // It's a LiveNewsItem
                    setLatestNews(event as LiveNewsItem);
                }
            };
            
            liveDataService.subscribe(handleEvent);
            liveDataService.start(league, myTeam, opponentTeam);

            return () => {
                liveDataService.unsubscribe(handleEvent);
                liveDataService.stop();
            };
        } else {
             // Ensure the service is stopped if we navigate away or data is missing.
             liveDataService.stop();
        }
    }, [league, myTeam, opponentTeam, dispatch, state.currentView]);

    return { latestNews };
};
