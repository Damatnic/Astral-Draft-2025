
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { Widget } from '../ui/Widget';
import { PawPrintIcon } from '../icons/PawPrintIcon';
import { generateTeamMascot } from '../../services/geminiService';
import type { League, Team } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import LazyImage from '../ui/LazyImage';

interface MascotWidgetProps {
    team: Team;
    league: League;
    dispatch: React.Dispatch<any>;
}

export const MascotWidget: React.FC<MascotWidgetProps> = ({ team, league, dispatch }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const mascotUrl = team.mascotUrl;

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const newMascotUrl = await generateTeamMascot(team);
            if (newMascotUrl) {
                dispatch({
                    type: 'SET_TEAM_MASCOT',
                    payload: { leagueId: league.id, teamId: team.id, mascotUrl: newMascotUrl }
                });
                dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Mascot generated!', type: 'SYSTEM' }});
            } else {
                 dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Could not generate a mascot.', type: 'SYSTEM' }});
            }
        } catch (e) {
            console.error(e);
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'An error occurred while generating the mascot.', type: 'SYSTEM' }});
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Widget title="Team Mascot" icon={<PawPrintIcon />}>
            <div className="p-4 flex items-center justify-center">
                {isLoading ? (
                    <LoadingSpinner size="sm" text="The Oracle is sketching..." />
                ) : mascotUrl ? (
                    <LazyImage 
                      src={mascotUrl} 
                      alt={`${team.name} Mascot`} 
                      className="w-32 h-32 rounded-lg object-cover"
                      loading="lazy"
                    />
                ) : (
                    <div className="text-center">
                        <p className="text-xs text-gray-400 mb-2">Your team doesn't have a mascot yet. Let the Oracle create one for you!</p>
                        <button
                            onClick={handleGenerate}
                            className="px-4 py-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-300 rounded-md hover:bg-cyan-500/20"
                        >
                            Generate AI Mascot
                        </button>
                    </div>
                )}
            </div>
        </Widget>
    );
};
