
import React from 'react';
import type { DraftPick, Team } from '../../types';
import { players } from '../../data/players';

interface LiveDraftLogProps {
  draftPicks: DraftPick[];
  teams: Team[];
}

const LiveDraftLog: React.FC<LiveDraftLogProps> = ({ draftPicks, teams }) => {
    const completedPicks = draftPicks.filter((p: any) => p.playerId).sort((a, b) => b.overall - a.overall);

    return (
        <div className="h-full flex flex-col text-[var(--text-primary)] p-2">
             <div className="flex-shrink-0 p-3 text-center border-b border-[var(--panel-border)] mb-2">
                <h3 className="font-display text-lg font-bold">DRAFT LOG</h3>
            </div>
            <div className="flex-grow space-y-2 overflow-y-auto text-xs p-1">
                {completedPicks.length === 0 && (
                    <p className="text-center text-sm text-[var(--text-secondary)] p-4">The draft is about to begin...</p>
                )}
                {completedPicks.map((pick: any) => {
                    const team = teams.find((t: any) => t.id === pick.teamId);
                    const player = players.find((p: any) => p.id === pick.playerId);

                    return (
                        <div key={pick.overall} className="p-2 bg-white/5 rounded-md">
                            <span className="text-gray-500 mr-2">
                                {pick.round}.{pick.pickInRound.toString().padStart(2, '0')}
                            </span>
                            <span>
                                <span className="font-semibold text-cyan-400">{team?.name || 'Unknown Team'}</span> selected <span className="font-bold text-white">{player?.name || 'Unknown Player'}</span> ({player?.position})
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LiveDraftLog;