
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { Widget } from '../components/ui/Widget';
import { UserIcon } from '../components/icons/UserIcon';
import { Avatar } from '../components/ui/Avatar';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { calculateManagerStats, calculateCareerHistory } from '../utils/careerStats';
import RivalryWidget from '../components/manager/RivalryWidget';
import AchievementsWidget from '../components/profile/AchievementsWidget';

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-white/5 p-3 rounded-lg text-center">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

const ManagerView: React.FC = () => {
    const { state, dispatch } = useAppState();
    
    const managerId = state.activeManagerId;
    
    const manager = React.useMemo(() => {
        if (!managerId) return null;
        for (const league of state.leagues) {
            const member = league.members.find(m => m.id === managerId);
            if (member) return member;
        }
        return null;
    }, [managerId, state.leagues]);

    const stats = React.useMemo(() => {
        if (!manager) return { championships: 0, leaguesJoined: 0, trophies: [] };
        return calculateManagerStats(manager, state.leagues);
    }, [manager, state.leagues]);

    const careerHistory = React.useMemo(() => {
        if (!managerId) return [];
        return calculateCareerHistory(managerId, state.leagues);
    }, [managerId, state.leagues]);


    if (!manager) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <p>Manager not found.</p>
                 <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to League Hub
                </button>
            </div>
        );
    }
    
    const memberSinceDate = manager.memberSince
        ? new Date(manager.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : 'a long time ago';

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                    Manager Profile
                </h1>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to League Hub
                </button>
            </header>
            <main className="flex-grow max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <Widget title="Identity" icon={<UserIcon />}>
                            <div className="p-4 flex flex-col items-center text-center">
                                <Avatar avatar={manager.avatar} className="w-28 h-28 text-7xl rounded-full mb-4 ring-4 ring-cyan-400/50" />
                                <h2 className="text-2xl font-bold font-display">{manager.name}</h2>
                                <p className="text-xs text-gray-400">Member since {memberSinceDate}</p>
                                <p className="text-sm text-gray-300 mt-3 italic">"{manager.bio || 'No bio set.'}"</p>
                            </div>
                        </Widget>
                        {managerId && <RivalryWidget opponentManagerId={managerId} />}
                        <Widget title="Career Stats">
                            <div className="p-4 grid grid-cols-2 gap-4">
                                <StatCard label="Championships" value={stats.championships} />
                                <StatCard label="Leagues Joined" value={stats.leaguesJoined} />
                            </div>
                        </Widget>
                        <AchievementsWidget badges={manager.badges || []} />
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Widget title="League History" icon={<BookOpenIcon />}>
                             <div className="p-4 space-y-3">
                                {careerHistory.map(entry => {
                                    const league = state.leagues.find(l=>l.id===entry.leagueId);
                                    return (
                                        <div key={entry.key} className="bg-black/10 p-3 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-white">{entry.season} Season - <span className="text-cyan-300">{entry.leagueName}</span></p>
                                                {entry.isComplete ? (
                                                    <p className="text-sm text-gray-300">
                                                        Finished <span className="font-bold">{entry.rank}</span> / {league?.teams.length} ({entry.record.wins}-{entry.record.losses}-{entry.record.ties})
                                                        {entry.isChampion && <span className="ml-2">🏆</span>}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-300">Current Record: {entry.record.wins}-{entry.record.losses}-{entry.record.ties} (Rank {entry.rank})</p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                {careerHistory.length === 0 && <p className="text-sm text-center text-gray-500 py-4">No league history yet.</p>}
                            </div>
                        </Widget>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ManagerView;
