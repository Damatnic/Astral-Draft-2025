
import React from 'react';
import type { Team, DraftPickAsset } from '../../types';
import { Widget } from '../ui/Widget';
import { ArchiveIcon } from '../icons/ArchiveIcon';

interface FuturePicksWidgetProps {
    team: Team;
}

const FuturePicksWidget: React.FC<FuturePicksWidgetProps> = ({ team }) => {
    const picksBySeason = (team.futureDraftPicks || []).reduce((acc, pick) => {
        if (!acc[pick.season]) {
            acc[pick.season] = [];
        }
        acc[pick.season].push(pick.round);
        acc[pick.season].sort((a, b) => a - b);
        return acc;
    }, {} as Record<number, number[]>);

    return (
        <Widget title="Future Draft Picks" icon={<ArchiveIcon />}>
            <div className="p-3 space-y-3">
                {Object.keys(picksBySeason).length > 0 ? Object.entries(picksBySeason).map(([season, rounds]) => (
                    <div key={season}>
                        <h4 className="font-bold text-sm text-cyan-300 mb-1">{season} Draft</h4>
                        <div className="flex flex-wrap gap-1">
                            {rounds.map((round: any) => (
                                <span key={round} className="text-xs bg-black/20 px-2 py-1 rounded-full font-mono">
                                    R{round}
                                </span>
                            ))}
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-xs text-gray-400 py-4">No future draft picks available.</p>
                )}
            </div>
        </Widget>
    );
};

export default FuturePicksWidget;
