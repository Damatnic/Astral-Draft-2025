
import React from 'react';
import type { Team, Player } from '../../types';
import { Widget } from '../ui/Widget';
import { InjuryIcon } from '../icons/InjuryIcon';
import { useAppState } from '../../contexts/AppContext';

interface InjuryReportWidgetProps {
    myTeam: Team;
}

const InjuryReportWidget: React.FC<InjuryReportWidgetProps> = ({ myTeam }) => {
    const { dispatch } = useAppState();

    const injuredPlayers = myTeam.roster.filter((p: any) => 
        p?.injuryHistory && p?.injuryHistory.length > 0 && p?.injuryHistory[0].status !== 'Active'
    );

    const handlePlayerClick = (player: Player) => {
        dispatch({ type: 'SET_PLAYER_DETAIL', payload: { player, initialTab: 'fantasy' } });
    };

    return (
        <Widget title="Injury Report" icon={<InjuryIcon />}>
            <div className="p-3">
                {injuredPlayers.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-4">Your roster is fully healthy!</p>
                ) : (
                    <div className="space-y-2">
                        {injuredPlayers.map((player: any) => (
                            <button 
                                key={player.id} 
                                onClick={() => handlePlayerClick(player)}
                                className="w-full flex items-center justify-between p-2 bg-black/10 rounded-md hover:bg-black/20 text-left"
                            >
                                <div>
                                    <p className="font-semibold text-sm">{player.name}</p>
                                    <p className="text-xs text-gray-400">{player?.injuryHistory![0].injury}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    player?.injuryHistory![0].status === 'Out' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                                }`}>
                                    {player?.injuryHistory![0].status}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </Widget>
    );
};

export default InjuryReportWidget;