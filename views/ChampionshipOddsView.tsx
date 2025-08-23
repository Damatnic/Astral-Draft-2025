
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { generateChampionshipProbabilities } from '../services/geminiService';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ChampionshipProbChart from '../components/analytics/ChampionshipProbChart';
import { Avatar } from '../components/ui/Avatar';
import { AnimatePresence } from 'framer-motion';
import TradeScenarioModal from '../components/modals/TradeScenarioModal';
import { FlaskConicalIcon } from '../components/icons/FlaskConicalIcon';

const ChampionshipOddsView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSimModalOpen, setIsSimModalOpen] = React.useState(false);

    React.useEffect(() => {
        const needsUpdate = league?.teams.some(t => {
            const history = t.championshipProbHistory || [];
            return !history.some(h => h.week === league.currentWeek);
        });

        if (league && needsUpdate && (league.status === 'IN_SEASON' || league.status === 'PLAYOFFS')) {
            setIsLoading(true);
            generateChampionshipProbabilities(league)
                .then(data => {
                    if (data) {
                        dispatch({ type: 'SET_CHAMPIONSHIP_PROBS', payload: { leagueId: league.id, data } });
                    }
                })
                .finally(() => setIsLoading(false));
        }
    }, [league, dispatch]);

    if (!league || !(league.status === 'IN_SEASON' || league.status === 'PLAYOFFS' || league.status === 'COMPLETE')) {
        return <ErrorDisplay title="Not Available" message="Championship odds are calculated during the season." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'ANALYTICS_HUB' })} />;
    }
    
    if (league.settings.aiAssistanceLevel === 'BASIC') {
        return <ErrorDisplay title="Feature Disabled" message="Championship Odds are disabled in leagues with Basic AI Assistance." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'ANALYTICS_HUB' })} />;
    }
    
    const rankedTeams = [...league.teams]
        .map(team => {
            const history = team.championshipProbHistory || [];
            const currentProb = history.length > 0 ? history.find(h => h.week === league.currentWeek)?.probability ?? history[history.length - 1].probability : 0;
            return { ...team, currentProb };
        })
        .sort((a, b) => b.currentProb - a.currentProb);

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Championship Odds
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <div className="flex items-center gap-2">
                     <button 
                        onClick={() => setIsSimModalOpen(true)}
                        className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm hover:bg-purple-500/30 flex items-center gap-2"
                    >
                        <FlaskConicalIcon /> Run Trade Scenario
                    </button>
                    <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'ANALYTICS_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                        Back to Analytics Hub
                    </button>
                </div>
            </header>
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Widget title="Probability Trends" icon={<TrophyIcon />}>
                        <div className="p-4 h-[60vh]">
                            {isLoading ? <LoadingSpinner text="Calculating probabilities..." /> : <ChampionshipProbChart league={league} />}
                        </div>
                    </Widget>
                </div>
                <div className="lg:col-span-1">
                     <Widget title={`Current Odds - Week ${league.currentWeek}`}>
                        <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
                            {rankedTeams.map((team, index) => (
                                <div key={team.id} className={`flex items-center justify-between p-2 rounded-md ${index === 0 ? 'bg-yellow-500/10' : 'bg-black/10'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold w-6">{index + 1}</span>
                                        <Avatar avatar={team.avatar} className="w-8 h-8 rounded-md" />
                                        <p className="font-semibold text-sm">{team.name}</p>
                                    </div>
                                    <p className="font-bold text-yellow-300">{team.currentProb.toFixed(1)}%</p>
                                </div>
                            ))}
                        </div>
                    </Widget>
                </div>
            </main>
             <AnimatePresence>
                {isSimModalOpen && (
                    <TradeScenarioModal 
                        league={league}
                        onClose={() => setIsSimModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChampionshipOddsView;
