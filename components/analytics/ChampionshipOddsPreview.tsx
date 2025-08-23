
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { Widget } from '../ui/Widget';
import type { League } from '../../types';
import { Avatar } from '../ui/Avatar';
import { TrophyIcon } from '../icons/TrophyIcon';

interface ChampionshipOddsPreviewProps {
    league: League;
    dispatch: React.Dispatch<any>;
}

const ChampionshipOddsPreview: React.FC<ChampionshipOddsPreviewProps> = ({ league, dispatch }) => {
    
    const topContenders = [...league.teams]
        .map((team: any) => {
            const history = team.championshipProbHistory || [];
            const currentProb = history.length > 0 ? history[history.length - 1].probability : 0;
            return {
                ...team,
                currentProb,
            };
        })
        .sort((a, b) => b.currentProb - a.currentProb)
        .slice(0, 3);
        
    return (
        <Widget title="Championship Contenders" icon={<TrophyIcon />}>
            <div className="p-3 space-y-2">
                {topContenders.map((team: any) => (
                    <div key={team.id} className="flex items-center justify-between p-2 bg-black/10 rounded-md">
                        <div className="flex items-center gap-2">
                            <Avatar avatar={team.avatar} className="w-8 h-8 rounded-md" />
                            <p className="font-semibold text-sm">{team.name}</p>
                        </div>
                        <p className="font-bold text-yellow-300">{team.currentProb.toFixed(1)}%</p>
                    </div>
                ))}
                 <button
                    onClick={() => dispatch({ type: 'SET_VIEW', payload: 'CHAMPIONSHIP_ODDS' })}
                    className="w-full mt-2 py-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-300 rounded-md hover:bg-cyan-500/20"
                >
                    View Full Odds Chart
                </button>
            </div>
        </Widget>
    );
};

export default ChampionshipOddsPreview;