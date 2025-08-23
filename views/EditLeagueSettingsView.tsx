
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import { SettingsIcon } from '../components/icons/SettingsIcon';
import ErrorDisplay from '../components/core/ErrorDisplay';
import type { LeagueSettings } from '../types';

const EditLeagueSettingsView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();

    const [name, setName] = React.useState(league?.name || '');
    const [logoUrl, setLogoUrl] = React.useState(league?.logoUrl || '');
    const [tradeDeadline, setTradeDeadline] = React.useState(league?.settings.tradeDeadline || 10);
    const [keeperCount, setKeeperCount] = React.useState(league?.settings.keeperCount || 0);
    const [aiAssistanceLevel, setAiAssistanceLevel] = React.useState<LeagueSettings['aiAssistanceLevel']>(league?.settings.aiAssistanceLevel || 'FULL');

    if (!league || state.user.id !== league.commissionerId) {
        return <ErrorDisplay title="Access Denied" message="You are not the commissioner of this league." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} />;
    }

    const isDraftComplete = league.status !== 'PRE_DRAFT' && league.status !== 'DRAFTING';

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({
            type: 'UPDATE_LEAGUE_SETTINGS',
            payload: { leagueId: league.id, name, logoUrl, tradeDeadline, keeperCount, aiAssistanceLevel }
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'League settings saved!', type: 'SYSTEM' } });
        dispatch({ type: 'SET_VIEW', payload: 'COMMISSIONER_TOOLS' });
    };

    const labelClasses = "block text-sm font-medium text-gray-400 mb-1";
    const inputClasses = "mobile-touch-target w-full bg-black/20 px-3 py-3 rounded-md border border-white/10 focus:ring-2 focus:ring-cyan-400 focus:outline-none";
    const buttonGroupButtonClasses = (isActive: boolean) => `flex-1 py-2 text-sm font-bold rounded-md transition-all ${isActive ? 'bg-cyan-400 text-black' : 'bg-black/10 dark:bg-gray-700/50 hover:bg-black/20 dark:hover:bg-gray-600/50'}`;

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Edit League Settings
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'COMMISSIONER_TOOLS' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Tools
                </button>
            </header>
            <main className="flex-grow max-w-2xl mx-auto w-full">
                <form onSubmit={handleSaveChanges}>
                    <Widget title="General Settings" icon={<SettingsIcon />}>
                        <div className="p-4 space-y-4">
                            <div>
                                <label htmlFor="league-name" className={labelClasses}>League Name</label>
                                <input id="league-name" type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label htmlFor="logo-url" className={labelClasses}>League Logo URL</label>
                                <input id="logo-url" type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className={inputClasses} placeholder="https://example.com/logo.png" />
                            </div>
                            <div className={isDraftComplete ? 'opacity-50' : ''}>
                                <label className={labelClasses}>AI Assistance Level</label>
                                 <div className="flex gap-2">
                                    <button type="button" onClick={() => setAiAssistanceLevel('FULL')} className={buttonGroupButtonClasses(aiAssistanceLevel === 'FULL')} disabled={isDraftComplete}>Full AI</button>
                                    <button type="button" onClick={() => setAiAssistanceLevel('BASIC')} className={buttonGroupButtonClasses(aiAssistanceLevel === 'BASIC')} disabled={isDraftComplete}>Basic AI</button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Basic AI disables strategic advice features like lineup suggestions and trade analysis.</p>
                                {isDraftComplete && <p className="text-xs text-yellow-400 mt-1">Cannot be changed after the draft.</p>}
                            </div>
                            <div className={isDraftComplete ? 'opacity-50' : ''}>
                                <label htmlFor="trade-deadline" className={labelClasses}>Trade Deadline (Week): {tradeDeadline}</label>
                                <input
                                    id="trade-deadline"
                                    type="range"
                                    min="8"
                                    max="14"
                                    step="1"
                                    value={tradeDeadline}
                                    onChange={e => setTradeDeadline(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                    disabled={isDraftComplete}
                                />
                                {isDraftComplete && <p className="text-xs text-yellow-400 mt-1">Cannot be changed after the draft.</p>}
                            </div>
                             <div className={isDraftComplete ? 'opacity-50' : ''}>
                                <label htmlFor="keeper-count" className={labelClasses}>Keepers per Team: {keeperCount}</label>
                                <input
                                    id="keeper-count"
                                    type="range"
                                    min="0"
                                    max="5"
                                    step="1"
                                    value={keeperCount}
                                    onChange={e => setKeeperCount(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                    disabled={isDraftComplete}
                                />
                                {isDraftComplete && <p className="text-xs text-yellow-400 mt-1">Cannot be changed after the draft.</p>}
                            </div>
                             <div className="opacity-50">
                                <label className={labelClasses}>Scoring / Roster Size</label>
                                <p className="text-xs text-yellow-400">These settings cannot be changed after league creation.</p>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="px-6 py-2 bg-cyan-500 text-black font-bold text-sm rounded-md">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </Widget>
                </form>
            </main>
        </div>
    );
};

export default EditLeagueSettingsView;
