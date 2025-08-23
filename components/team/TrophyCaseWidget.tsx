
import React from 'react';
import type { Team, League } from '../../types';
import { Widget } from '../ui/Widget';
import { TrophyIcon } from '../icons/TrophyIcon';

interface TrophyCaseWidgetProps {
    team: Team;
    league: League;
}

const TrophyCaseWidget: React.FC<TrophyCaseWidgetProps> = ({ team, league }) => {
    const awards = team.awards || [];

    return (
        <Widget title="Trophy Case" icon={<TrophyIcon />}>
            <div className="p-3">
                {awards.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-4">No awards yet. Go win some matchups!</p>
                ) : (
                    <div className="space-y-2">
                        {awards.map((award, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-black/10 rounded-md">
                                <div className="text-yellow-400"><TrophyIcon /></div>
                                <div>
                                    <p className="font-semibold text-sm">{award.title}</p>
                                    <p className="text-xs text-gray-400">Week {award.week}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Widget>
    );
};

export default TrophyCaseWidget;
