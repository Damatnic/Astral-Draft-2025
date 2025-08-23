
import React from 'react';
import type { League, Team } from '../../types';
import { generateTeamNeedsAnalysis } from '../../services/geminiService';
import { Widget } from '../ui/Widget';
import { SparklesIcon } from '../icons/SparklesIcon';
import LoadingSpinner from '../ui/LoadingSpinner';

interface TeamNeedsAnalysisProps {
    team: Team;
    league: League;
    dispatch: React.Dispatch<any>;
}

const TeamNeedsAnalysis: React.FC<TeamNeedsAnalysisProps> = ({ team, league, dispatch }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const needs = team.teamNeeds;

    const handleFetchNeeds = async () => {
        setIsLoading(true);
        try {
            const fetchedNeeds = await generateTeamNeedsAnalysis(team);
            if (fetchedNeeds) {
                dispatch({ type: 'SET_TEAM_NEEDS', payload: { leagueId: league.id, teamId: team.id, needs: fetchedNeeds } });
            }
        } catch (e) {
            console.error(e);
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Could not analyze team needs.', type: 'SYSTEM' } });
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        // Fetch only if needs are not already in state and the season has started
        if (!needs && (league?.status === 'IN_SEASON' || league?.status === 'PLAYOFFS' || league?.status === 'COMPLETE')) {
            handleFetchNeeds();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team.id, league?.status]);

    return (
        <Widget title="Team Needs Analysis" icon={<SparklesIcon />}>
            <div className="p-4">
                {isLoading ? (
                    <LoadingSpinner size="sm" text="Analyzing roster..." />
                ) : needs && needs.length > 0 ? (
                    <div className="space-y-3">
                        {needs.map((need, index) => (
                            <div key={index} className="bg-black/10 p-3 rounded-lg">
                                <h4 className="font-bold text-red-400">{need.position}</h4>
                                <p className="text-xs italic text-gray-300">"{need.rationale}"</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-gray-400 py-2">The Oracle sees a well-balanced team with no glaring needs.</p>
                )}
                <button
                    onClick={handleFetchNeeds}
                    disabled={isLoading}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-1.5 bg-transparent border border-cyan-400/50 text-cyan-300 font-bold text-xs rounded-md hover:bg-cyan-400/20 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                           <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                           Analyzing...
                        </>
                    ) : (
                       'Re-Analyze Needs'
                    )}
                </button>
            </div>
        </Widget>
    );
};

export default TeamNeedsAnalysis;
