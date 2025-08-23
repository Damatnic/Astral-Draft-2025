
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { Widget } from '../ui/Widget';
import { SparklesIcon } from '../icons/SparklesIcon';
import { generateTeamChemistryReport } from '../../services/geminiService';
import type { League, Team } from '../../types';

interface TeamChemistryWidgetProps {
    myTeam: Team;
    league: League;
    dispatch: React.Dispatch<any>;
}

const TeamChemistryWidget: React.FC<TeamChemistryWidgetProps> = ({ myTeam, league, dispatch }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const report = myTeam.chemistryReport;

    const handleFetchReport = async () => {
        if(isLoading) return;
        setIsLoading(true);
        try {
            const fetchedReport = await generateTeamChemistryReport(myTeam);
            if(fetchedReport) {
                dispatch({ type: 'SET_TEAM_CHEMISTRY', payload: { leagueId: league.id, teamId: myTeam.id, report: fetchedReport } });
            }
        } catch (e) {
            console.error("Error fetching chemistry report", e);
            dispatch({ type: 'ADD_NOTIFICATION', payload: 'Could not fetch chemistry report.' });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Widget title="Team Chemistry" icon={<SparklesIcon />}>
            <div className="p-4">
                {report ? (
                     <p className="text-sm text-gray-300 italic">"{report}"</p>
                ) : (
                    <p className="text-center text-sm text-gray-400">The Oracle can analyze your roster for strategic balance and player synergy.</p>
                )}
               
                <button
                    onClick={handleFetchReport}
                    disabled={isLoading}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-1.5 bg-transparent border border-cyan-400/50 text-cyan-300 font-bold text-xs rounded-md hover:bg-cyan-400/20 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <>
                            <SparklesIcon />
                            <span>{report ? 'Re-analyze Chemistry' : 'Analyze My Team'}</span>
                        </>
                    )}
                </button>
            </div>
        </Widget>
    );
};

export default TeamChemistryWidget;
