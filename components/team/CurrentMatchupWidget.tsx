
import React from 'react';
import type { Team, League } from '../../types';
import { Widget } from '../ui/Widget';
import { TargetIcon } from '../icons/TargetIcon';
import { Avatar } from '../ui/Avatar';

interface CurrentMatchupWidgetProps {
    myTeam: Team;
    league: League;
    dispatch: React.Dispatch<any>;
}

const CurrentMatchupWidget: React.FC<CurrentMatchupWidgetProps> = ({ myTeam, league, dispatch }) => {
    const nextMatchup = league.schedule.find((m: any) => 
        m.week === league.currentWeek && 
        (m.teamA.teamId === myTeam.id || m.teamB.teamId === myTeam.id)
    );

    if (!nextMatchup) {
        return (
            <Widget title="Upcoming Matchup" icon={<TargetIcon />}>
                <div className="p-4 text-center text-sm text-gray-400">
                    You have a bye this week.
                </div>
            </Widget>
        );
    }

    const opponentId = nextMatchup.teamA.teamId === myTeam.id ? nextMatchup.teamB.teamId : nextMatchup.teamA.teamId;
    const opponent = league.teams.find((t: any) => t.id === opponentId);

    if (!opponent) {
        return null;
    }

    return (
        <Widget title={`Week ${league.currentWeek} Matchup`} icon={<TargetIcon />}>
            <div className="p-4 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-gray-400 mb-2">You are facing:</p>
                <Avatar avatar={opponent.avatar} className="w-16 h-16 text-4xl rounded-lg" />
                <p className="font-bold text-lg mt-2">{opponent.name}</p>
                <p className="text-sm text-gray-400">({opponent.record.wins}-{opponent.record.losses}-{opponent.record.ties})</p>
                <button 
                    onClick={() => dispatch({ type: 'SET_VIEW', payload: 'MATCHUP' })}
                    className="mt-3 w-full px-4 py-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-300 rounded-md hover:bg-cyan-500/20"
                >
                    View Full Matchup
                </button>
            </div>
        </Widget>
    );
};

export default CurrentMatchupWidget;
