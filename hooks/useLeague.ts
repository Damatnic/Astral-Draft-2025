
import { useAppState } from '../contexts/AppContext';

/**
 * A custom hook to conveniently access the active league and the user's team within that league.
 * This centralizes lookup logic and simplifies components.
 */
export const useLeague = () => {
    const { state } = useAppState();
    const league = state.leagues.find(l => l.id === state.activeLeagueId);
    const myTeam = league?.teams.find(t => t.owner.id === state.user.id);

    return { league, myTeam };
};