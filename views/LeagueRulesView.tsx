
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { Widget } from '../components/ui/Widget';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import type { League } from '../types';
import { useLeague } from '../hooks/useLeague';

const RuleItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
        <span className="font-semibold text-gray-300">{label}</span>
        <span className="font-bold text-white">{value}</span>
    </div>
);

const LeagueRulesContent: React.FC<{ league: League; dispatch: React.Dispatch<any> }> = ({ league, dispatch }) => {
    const settings = league.settings;

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        League Rules
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to League Hub
                </button>
            </header>
            <main className="flex-grow">
                <Widget title="League Settings" icon={<BookOpenIcon />}>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Widget title="General">
                            <div className="p-3 space-y-2">
                                <RuleItem label="League Name" value={league.name} />
                                <RuleItem label="Number of Teams" value={settings.teamCount} />
                                <RuleItem label="Draft Format" value={settings.draftFormat} />
                                <RuleItem label="Scoring Type" value={settings.scoring} />
                            </div>
                        </Widget>
                        <Widget title="Roster">
                             <div className="p-3 space-y-2">
                                <RuleItem label="Total Roster Spots" value={settings.rosterSize} />
                                <RuleItem label="Quarterbacks (QB)" value={1} />
                                <RuleItem label="Running Backs (RB)" value={2} />
                                <RuleItem label="Wide Receivers (WR)" value={2} />
                                <RuleItem label="Tight Ends (TE)" value={1} />
                                <RuleItem label="Flex (RB/WR/TE)" value={1} />
                                <RuleItem label="Defense/Special Teams" value={1} />
                                <RuleItem label="Kickers (K)" value={1} />
                                <RuleItem label="Bench" value={7} />
                            </div>
                        </Widget>
                         <Widget title="Season & Playoffs" className="md:col-span-1">
                             <div className="p-3 space-y-2">
                                <RuleItem label="Playoff Teams" value={settings.playoffFormat.replace('_', ' ')} />
                                <RuleItem label="Trade Deadline" value={`Week ${settings.tradeDeadline}`} />
                            </div>
                        </Widget>
                         <Widget title="Waivers" className="md:col-span-1">
                             <div className="p-3 space-y-2">
                                <RuleItem label="Waiver System" value={settings.waiverRule} />
                                <RuleItem label="Season FAAB" value="$100" />
                                <RuleItem label="Waiver Period" value="Wednesday Mornings" />
                            </div>
                        </Widget>
                    </div>
                </Widget>
            </main>
        </div>
    );
};

const LeagueRulesView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league } = useLeague();
    
    if (!league) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p>Please select a league to view its rules.</p>
                 <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    return <LeagueRulesContent league={league} dispatch={dispatch} />;
};

export default LeagueRulesView;
