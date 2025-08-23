
import React from 'react';
import { motion } from 'framer-motion';
import type { Player, League, MatchupPlayer } from '../../../types';
import { useLeague } from '../../../hooks/useLeague';
import { Avatar } from '../../ui/Avatar';

interface GameLogTabProps {
    player: Player;
}

const GameLogTab: React.FC<GameLogTabProps> = ({ player }) => {
    const { league } = useLeague();

    if (!league || league?.status === 'PRE_DRAFT' || league?.status === 'DRAFTING') {
        return <p className="text-gray-500 text-center py-8">The season has not started yet.</p>;
    }

    const gameLog = React.useMemo(() => {
        const log: { week: number; opponent: any; projected: number; actual: number; }[] = [];
        const playerTeam = league.teams.find((t: any) => t.roster.some((p: any) => p.id === player.id));
        if (!playerTeam) return [];
        
        for (let week = 1; week < league.currentWeek; week++) {
            const matchup = league.schedule.find((m: any) => m.week === week && (m.teamA.teamId === playerTeam.id || m.teamB.teamId === playerTeam.id));
            if (!matchup) continue;

            const playerTeamInMatchup = matchup.teamA.teamId === playerTeam.id ? matchup.teamA : matchup.teamB;
            const opponentTeamInMatchup = matchup.teamA.teamId === playerTeam.id ? matchup.teamB : matchup.teamA;
            const opponent = league.teams.find((t: any) => t.id === opponentTeamInMatchup.teamId);

            const playerData = playerTeamInMatchup.roster.find((p: any) => p.player.id === player.id);
            if (!playerData) continue;
            
            log.push({
                week,
                opponent,
                projected: playerData.projectedScore,
                actual: playerData.actualScore,
            });
        }
        return log;
    }, [player, league]);

    if (gameLog.length === 0) {
        return <p className="text-gray-500 text-center py-8">No game data available for this player yet.</p>;
    }

    return (
        <motion.div
            {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
            }}
        >
            <div className="bg-white/5 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/10">
                        <tr>
                            <th className="p-3">Week</th>
                            <th className="p-3">Opponent</th>
                            <th className="p-3 text-right">Proj</th>
                            <th className="p-3 text-right">Actual</th>
                            <th className="p-3 text-right">+/-</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gameLog.map((game: any) => {
                            const diff = game.actual - game.projected;
                            const diffColor = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400';
                            return (
                                <tr key={game.week} className="border-t border-white/5">
                                    <td className="p-3 font-bold">{game.week}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <Avatar avatar={game.opponent?.avatar || '?'} className="w-6 h-6 rounded-md" />
                                            <span>vs {game.opponent?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right font-mono">{game.projected.toFixed(2)}</td>
                                    <td className="p-3 text-right font-mono font-bold">{game.actual.toFixed(2)}</td>
                                    <td className={`p-3 text-right font-mono font-bold ${diffColor}`}>
                                        {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default GameLogTab;
