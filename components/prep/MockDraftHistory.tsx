
import React from 'react';
import { useAppState } from '../../contexts/AppContext';

const MockDraftHistory: React.FC = () => {
    const { state, dispatch } = useAppState();

    const mockDrafts = state.leagues.filter((l: any) => l.isMock);

    const handleViewDraft = (leagueId: string) => {
        dispatch({ type: 'SET_ACTIVE_LEAGUE', payload: leagueId });
        dispatch({ type: 'SET_VIEW', payload: 'DRAFT_ROOM' });
    }

    return (
        <div className="glass-pane p-4 rounded-xl">
            <h3 className="font-bold mb-2">My Mock Drafts</h3>
            {mockDrafts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">You haven't completed any mock drafts yet.</p>
            ) : (
                <div className="space-y-2">
                    {mockDrafts.map((league: any) => (
                        <div key={league.id} className="p-3 bg-white/5 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{league.name}</p>
                                <p className="text-xs text-gray-400">{league.settings.teamCount} Teams - {new Date(parseInt(league.id.split('_')[1])).toLocaleDateString()}</p>
                            </div>
                            {/* In a real app, this would link to a recap or a read-only board */}
                            <button className="px-3 py-1 text-xs font-bold bg-cyan-500/10 text-cyan-300 rounded-md hover:bg-cyan-500/20" disabled>
                                View Results
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MockDraftHistory;
