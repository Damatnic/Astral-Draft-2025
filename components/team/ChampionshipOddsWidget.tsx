
import React from 'react';
import { Widget } from '../ui/Widget';
import { TrophyIcon } from '../icons/TrophyIcon';
import SparklineChart from '../ui/SparklineChart';
import type { Team, League } from '../../types';

interface ChampionshipOddsWidgetProps {
    team: Team;
    league: League;
    dispatch: React.Dispatch<any>;
}

const ChampionshipOddsWidget: React.FC<ChampionshipOddsWidgetProps> = ({ team, league, dispatch }) => {
    const history = team.championshipProbHistory || [];
    const currentProb = history.length > 0 ? history[history.length - 1].probability : 0;
    const dataPoints = history.map((h: any) => h.probability);

    return (
        <Widget title="Championship Odds" icon={<TrophyIcon />}>
            <div className="p-3">
                <div className="text-center">
                    <p className="font-display text-4xl font-bold text-yellow-300">{currentProb.toFixed(2)}%</p>
                    <p className="text-xs text-gray-400">Current probability to win the league</p>
                </div>
                {dataPoints.length > 1 && (
                    <div className="h-16 mt-2">
                        <SparklineChart data={dataPoints} />
                    </div>
                )}
                <button
                    onClick={() => dispatch({ type: 'SET_VIEW', payload: 'CHAMPIONSHIP_ODDS' })}
                    className="w-full mt-2 py-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-300 rounded-md hover:bg-cyan-500/20"
                >
                    View Full Analytics
                </button>
            </div>
        </Widget>
    );
};

export default ChampionshipOddsWidget;