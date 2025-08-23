
import React from 'react';
import type { League } from '../../types';

interface LeagueCardProps {
    league: League;
    onJoin: () => void;
}

export const LeagueCard: React.FC<LeagueCardProps> = ({ league, onJoin }) => {
    const isPreDraft = league?.status === 'PRE_DRAFT';
    return (
        <div className="p-4 bg-white/5 rounded-lg flex items-center justify-between hover:bg-white/10 transition-colors">
            <div>
                <p className="font-bold text-[var(--text-primary)]">{league.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                    {league.settings.teamCount} Teams • {league.settings.draftFormat} • {league.status.replace('_', ' ')}
                </p>
            </div>
            <button onClick={onJoin} className="px-4 py-2 bg-cyan-500 text-black font-bold text-sm rounded-md hover:bg-cyan-400">
                {isPreDraft ? 'Join Lobby' : 'View'}
            </button>
        </div>
    );
};
