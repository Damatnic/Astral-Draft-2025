
import React from 'react';
import type { League } from '../../types';
import { Widget } from '../ui/Widget';
import { Avatar } from '../ui/Avatar';

interface PickTimeAnalyticsProps {
    league: League;
}

const PickTimeAnalytics: React.FC<PickTimeAnalyticsProps> = ({ league }) => {
    const analyticsData = React.useMemo(() => {
        const pickTimes: { [teamId: number]: number[] } = {};

        const sortedPicks = [...league.draftPicks]
            .filter((p: any) => p.timestamp)
            .sort((a, b) => a.overall - b.overall);

        for (let i = 1; i < sortedPicks.length; i++) {
            const currentPick = sortedPicks[i];
            const prevPick = sortedPicks[i - 1];
            
            if (currentPick.teamId && currentPick.timestamp && prevPick.timestamp) {
                const timeDiff = (currentPick.timestamp - prevPick.timestamp) / 1000; // in seconds
                
                if (!pickTimes[currentPick.teamId]) {
                    pickTimes[currentPick.teamId] = [];
                }
                pickTimes[currentPick.teamId].push(timeDiff);
            }
        }
        
        return league.teams.map((team: any) => {
            const times = pickTimes[team.id] || [];
            const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
            return {
                team,
                avgTime,
            };
        }).sort((a, b) => a.avgTime - b.avgTime);

    }, [league]);

    return (
        <Widget title="Average Pick Time">
            <div className="p-4">
                <p className="text-xs text-gray-400 mb-4">See which managers were the most decisive during the draft. Time is measured from the previous pick to their own.</p>
                <div className="space-y-2">
                    {analyticsData.map(({ team, avgTime }, index) => (
                        <div key={team.id} className="flex items-center justify-between p-2 bg-black/10 rounded-md">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
                                <Avatar avatar={team.avatar} className="w-8 h-8 rounded-md" />
                                <div>
                                    <p className="font-semibold text-sm">{team.name}</p>
                                </div>
                            </div>
                            <p className="font-bold text-lg font-mono">
                                {avgTime > 0 ? avgTime.toFixed(1) + 's' : 'N/A'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </Widget>
    );
};

export default PickTimeAnalytics;