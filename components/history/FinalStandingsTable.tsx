
import React from 'react';
import type { LeagueHistoryEntry, Team } from '../../types';
import { Avatar } from '../ui/Avatar';

interface FinalStandingsTableProps {
    standings: LeagueHistoryEntry['finalStandings'];
    teams: Team[];
}

const FinalStandingsTable: React.FC<FinalStandingsTableProps> = ({ standings, teams }) => {
    return (
        <div className="p-2">
            <table className="w-full text-sm text-left">
                <thead className="bg-black/10">
                    <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Team</th>
                        <th className="p-3 text-center">Record</th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((entry: any) => {
                        const team = teams.find((t: any) => t.id === entry.teamId);
                        if (!team) return null;

                        return (
                            <tr key={entry.teamId} className="border-t border-white/5">
                                <td className="p-3 font-bold text-cyan-400">{entry.rank}</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <Avatar avatar={team.avatar} className="w-8 h-8 text-xl rounded-md" />
                                        <div>
                                            <p className="font-semibold text-white">{team.name}</p>
                                            <p className="text-xs text-gray-400">{team.owner.name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 font-mono text-center">
                                    {entry.record.wins}-{entry.record.losses}-{entry.record.ties}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default FinalStandingsTable;
