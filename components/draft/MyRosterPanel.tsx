
import React from 'react';
import type { Team, PlayerPosition } from '../../types';
import { UserIcon } from '../icons/UserIcon';

interface MyRosterPanelProps {
    team: Team | undefined;
}

const positionOrder: PlayerPosition[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

const MyRosterPanel: React.FC<MyRosterPanelProps> = ({ team }) => {
    if (!team) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-sm text-[var(--text-secondary)]">Your team information is not available.</p>
            </div>
        );
    }

    const rosterByPosition = positionOrder.map((pos: any) => ({
        position: pos,
        players: team.roster.filter((p: any) => p.position === pos)
    }));

    return (
        <div className="h-full flex flex-col text-[var(--text-primary)] p-1.5 sm:p-2">
            <div className="flex-shrink-0 p-2 sm:p-3 text-center border-b border-[var(--panel-border)] mb-2">
                <h3 className="font-display text-base sm:text-lg font-bold flex items-center justify-center gap-2">
                    <UserIcon />
                    <span className="hidden sm:inline">MY ROSTER</span>
                    <span className="sm:hidden">ROSTER</span>
                </h3>
            </div>
            <div className="flex-grow space-y-2 sm:space-y-3 overflow-y-auto pr-1">
                {rosterByPosition.map(({ position, players }) => (
                    <div key={position}>
                        <h4 className="font-bold text-xs sm:text-sm text-cyan-300 px-1 mb-1">{position} ({players.length})</h4>
                        <div className="space-y-0.5 sm:space-y-1">
                            {players.length > 0 ? (
                                players.map((player: any) => (
                                    <div key={player.id} className="text-[10px] sm:text-xs p-1 sm:p-1.5 bg-white/5 rounded-md">
                                        {player.name}
                                    </div>
                                ))
                            ) : (
                                <div className="text-[10px] sm:text-xs p-1 sm:p-1.5 text-gray-500 italic">No players drafted</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyRosterPanel;