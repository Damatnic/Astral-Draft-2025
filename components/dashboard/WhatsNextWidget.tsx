import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { Widget } from '../ui/Widget';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';
import { SparklesIcon } from '../icons/SparklesIcon';

const WhatsNextWidget: React.FC = () => {
    const { state, dispatch } = useAppState();
    
    // Find the most relevant league (active, or first non-mock, or first mock)
    const activeLeague = state.leagues.find((l: any) => l.id === state.activeLeagueId);
    const primaryLeague = activeLeague || state.leagues.find((l: any) => !l.isMock) || state.leagues[0];

    let action = {
        title: "Welcome to Astral Draft!",
        description: "Create a new league or start a mock draft to begin your journey.",
        buttonText: "Create League",
        onClick: () => { /* This should open the create league modal, handled in DashboardView */ }
    };

    if (primaryLeague) {
        switch (primaryLeague?.status) {
            case 'PRE_DRAFT':
                action = {
                    title: `Prepare for your draft in ${primaryLeague.name}!`,
                    description: "Head to the league hub to check settings and get ready for the big day.",
                    buttonText: "Go to League Hub",
                    onClick: () => {
                        dispatch({ type: 'SET_ACTIVE_LEAGUE', payload: primaryLeague.id });
                        dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' });
                    }
                };
                break;
            case 'DRAFTING':
                action = {
                    title: `Draft is live in ${primaryLeague.name}!`,
                    description: "Your draft is currently in progress. Enter the draft room to make your picks.",
                    buttonText: "Enter Draft Room",
                    onClick: () => {
                        dispatch({ type: 'SET_ACTIVE_LEAGUE', payload: primaryLeague.id });
                        dispatch({ type: 'SET_VIEW', payload: 'DRAFT_ROOM' });
                    }
                };
                break;
            case 'IN_SEASON':
            case 'PLAYOFFS':
                const myTeam = primaryLeague.teams.find((t: any) => t.owner.id === state.user.id);
                const matchup = primaryLeague.schedule.find((m: any) => m.week === primaryLeague.currentWeek && (m.teamA.teamId === myTeam?.id || m.teamB.teamId === myTeam?.id));
                const opponent = primaryLeague.teams.find((t: any) => t.id === (matchup?.teamA.teamId === myTeam?.id ? matchup?.teamB.teamId : matchup?.teamA.teamId));

                action = {
                    title: `Week ${primaryLeague.currentWeek}: vs. ${opponent?.name || 'Opponent'}`,
                    description: "It's game week! Set your lineup, check the waiver wire, and prepare for victory.",
                    buttonText: "Go to My Team",
                    onClick: () => {
                         dispatch({ type: 'SET_ACTIVE_LEAGUE', payload: primaryLeague.id });
                         dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' });
                    }
                };
                break;
             case 'DRAFT_COMPLETE':
                 action = {
                    title: `Draft Complete in ${primaryLeague.name}!`,
                    description: "Your draft is finished. Check out the analytics to see your grade and review the results.",
                    buttonText: "View Draft Analytics",
                    onClick: () => {
                         dispatch({ type: 'SET_ACTIVE_LEAGUE', payload: primaryLeague.id });
                         dispatch({ type: 'SET_VIEW', payload: 'ANALYTICS_HUB' });
                    }
                };
                break;
            case 'COMPLETE':
                 action = {
                    title: `Season Complete in ${primaryLeague.name}!`,
                    description: "The season is over. Relive the glory by checking out the season summary and awards.",
                    buttonText: "View Season Review",
                    onClick: () => {
                         dispatch({ type: 'SET_ACTIVE_LEAGUE', payload: primaryLeague.id });
                         dispatch({ type: 'SET_SEASON_REVIEW_YEAR', payload: new Date().getFullYear() - 1 });
                         dispatch({ type: 'SET_VIEW', payload: 'SEASON_REVIEW' });
                    }
                };
                break;
        }
    }

    return (
        <Widget title="What's Next" icon={<SparklesIcon />} className="row-span-2">
            <div className="p-4 flex flex-col justify-between h-full">
                <div>
                    <h3 className="font-bold text-lg text-white">{action.title}</h3>
                    <p className="text-sm text-gray-300 mt-1">{action.description}</p>
                </div>
                <button 
                    onClick={action.onClick}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg btn-primary"
                >
                    {action.buttonText}
                    <ArrowRightIcon />
                </button>
            </div>
        </Widget>
    );
};

export default WhatsNextWidget;