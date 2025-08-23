
import React from 'react';
import type { Team, MatchupTeam } from '../../types';
import AnimatedNumber from '../ui/AnimatedNumber';
import { Avatar } from '../ui/Avatar';

interface MatchupScoreboardProps {
    myTeam: Team;
    opponentTeam: Team;
    myMatchupTeam: MatchupTeam;
    opponentMatchupTeam: MatchupTeam;
    week: number;
    isLive: boolean;
}

const MatchupScoreboard: React.FC<MatchupScoreboardProps> = ({ myTeam, opponentTeam, myMatchupTeam, opponentMatchupTeam, week, isLive }) => {
    
    const calculateProjectedScore = (team: Team) => {
        return team.roster.slice(0, 9).reduce((total, player) => {
            const weeklyProj = player.stats.weeklyProjections[week] || player.stats.projection / 17;
            return total + weeklyProj;
        }, 0);
    }
    
    const isFutureWeek = week > new Date().getDate(); // Simplified logic for demo
    const myScore = isFutureWeek ? calculateProjectedScore(myTeam) : myMatchupTeam.score;
    const opponentScore = isFutureWeek ? calculateProjectedScore(opponentTeam) : opponentMatchupTeam.score;

    const getStatus = () => {
        if (isLive) return <span className="text-red-400 animate-pulse">LIVE</span>;
        if (myMatchupTeam.score > 0 || opponentMatchupTeam.score > 0) return 'FINAL';
        return 'PROJECTED';
    }


    return (
        <div className="glass-pane p-4 rounded-xl flex flex-col sm:flex-row items-center justify-around gap-4">
            {/* My Team */}
            <div className="flex items-center gap-4">
                <Avatar avatar={myTeam.avatar} className="w-12 h-12 sm:w-16 sm:h-16 text-4xl sm:text-5xl rounded-lg" />
                <div>
                    <p className="font-bold text-lg sm:text-xl">{myTeam.name}</p>
                    <p className="text-sm text-gray-400">{myTeam.record.wins}-{myTeam.record.losses}-{myTeam.record.ties}</p>
                </div>
            </div>
            {/* Score */}
            <div className="text-center">
                <p className="font-display text-4xl sm:text-5xl font-bold">
                    <AnimatedNumber value={myScore} /> - <AnimatedNumber value={opponentScore} />
                </p>
                <p className="text-sm text-cyan-400 font-bold">{getStatus()}</p>
            </div>
            {/* Opponent Team */}
            <div className="flex items-center gap-4 text-right flex-row-reverse sm:flex-row">
                 <div>
                    <p className="font-bold text-lg sm:text-xl">{opponentTeam.name}</p>
                    <p className="text-sm text-gray-400">{opponentTeam.record.wins}-{opponentTeam.record.losses}-{opponentTeam.record.ties}</p>
                </div>
                <Avatar avatar={opponentTeam.avatar} className="w-12 h-12 sm:w-16 sm:h-16 text-4xl sm:text-5xl rounded-lg" />
            </div>
        </div>
    );
};

export default MatchupScoreboard;
