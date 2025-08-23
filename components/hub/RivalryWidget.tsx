
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { useLeague } from '../../hooks/useLeague';
import { Widget } from '../ui/Widget';
import { SwordIcon } from '../icons/SwordIcon';
import { detectTopRivalry } from '../../services/geminiService';
import { Avatar } from '../ui/Avatar';
import LoadingSpinner from '../ui/LoadingSpinner';

const RivalryWidget: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    const [isLoading, setIsLoading] = React.useState(false);

    const rivalry = league?.topRivalry;

    React.useEffect(() => {
        if (league && !rivalry && (league?.status === 'IN_SEASON' || league?.status === 'PLAYOFFS' || league?.status === 'COMPLETE')) {
            const fetchRivalry = async () => {
                setIsLoading(true);
                const result = await detectTopRivalry(league);
                if (result) {
                    dispatch({ type: 'SET_TOP_RIVALRY', payload: { leagueId: league.id, rivalry: result } });
                }
                setIsLoading(false);
            };
            fetchRivalry();
        }
    }, [league, rivalry, dispatch]);

    if (!league || !(league?.status === 'IN_SEASON' || league?.status === 'PLAYOFFS' || league?.status === 'COMPLETE')) {
        return null;
    }

    const teamA = rivalry ? league.teams.find((t: any) => t.id === rivalry.teamAId) : null;
    const teamB = rivalry ? league.teams.find((t: any) => t.id === rivalry.teamBId) : null;

    return (
        <Widget title="Top Rivalry" icon={<SwordIcon />}>
            <div className="p-3">
                {isLoading ? <LoadingSpinner size="sm" text="Detecting rivalries..." /> :
                 rivalry && teamA && teamB ? (
                    <div>
                        <div className="flex items-center justify-center gap-4 mb-2">
                             <div className="text-center">
                                <Avatar avatar={teamA.avatar} className="w-10 h-10 mx-auto text-2xl rounded-lg" />
                                <p className="text-xs font-bold mt-1">{teamA.name}</p>
                            </div>
                            <span className="font-bold text-red-400 text-lg">VS</span>
                             <div className="text-center">
                                <Avatar avatar={teamB.avatar} className="w-10 h-10 mx-auto text-2xl rounded-lg" />
                                <p className="text-xs font-bold mt-1">{teamB.name}</p>
                            </div>
                        </div>
                        <p className="text-xs italic text-gray-300">"{rivalry.narrative}"</p>
                    </div>
                ) : (
                    <p className="text-center text-xs text-gray-400 py-2">No significant rivalries detected yet.</p>
                )}
            </div>
        </Widget>
    );
};

export default RivalryWidget;
