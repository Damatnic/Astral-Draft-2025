
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { Widget } from '../ui/Widget';
import { SwordIcon } from '../icons/SwordIcon';
import { calculateHeadToHeadRecord } from '../../utils/careerStats';

interface RivalryWidgetProps {
    opponentManagerId: string;
}

const RivalryWidget: React.FC<RivalryWidgetProps> = ({ opponentManagerId }) => {
    const { state } = useAppState();

    const record = React.useMemo(() => {
        return calculateHeadToHeadRecord(state.user.id, opponentManagerId, state.leagues);
    }, [state.user.id, opponentManagerId, state.leagues]);

    const { regularSeason, playoffs } = record;
    const totalWins = regularSeason.wins + playoffs.wins;
    const totalLosses = regularSeason.losses + playoffs.losses;
    const totalTies = regularSeason.ties + playoffs.ties;

    const getRecordColor = (wins: number, losses: number) => {
        if (wins > losses) return 'text-green-400';
        if (losses > wins) return 'text-red-400';
        return 'text-yellow-400';
    };

    return (
        <Widget title="Rivalry" icon={<SwordIcon />}>
            <div className="p-4 text-center">
                <p className="text-sm text-gray-300">All-Time Head-to-Head</p>
                <p className={`font-display text-4xl font-bold my-2 ${getRecordColor(totalWins, totalLosses)}`}>
                    {totalWins}-{totalLosses}{totalTies > 0 ? `-${totalTies}` : ''}
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                    <p>Regular Season: {regularSeason.wins}-{regularSeason.losses}{regularSeason.ties > 0 ? `-${regularSeason.ties}` : ''}</p>
                    <p>Playoffs: {playoffs.wins}-{playoffs.losses}{playoffs.ties > 0 ? `-${playoffs.ties}` : ''}</p>
                </div>
            </div>
        </Widget>
    );
};

export default RivalryWidget;
