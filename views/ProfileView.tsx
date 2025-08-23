
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { Widget } from '../components/ui/Widget';
import { UserIcon } from '../components/icons/UserIcon';
import { Avatar } from '../components/ui/Avatar';
import { PencilIcon } from '../components/icons/PencilIcon';
import { AnimatePresence } from 'framer-motion';
import EditProfileModal from '../components/core/EditProfileModal';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { calculateManagerStats, calculateCareerHistory } from '../utils/careerStats';
import AchievementsWidget from '../components/profile/AchievementsWidget';
import { LogOutIcon } from '../components/icons/LogOutIcon';

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-white/5 p-3 rounded-lg text-center">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

const ProfileView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

    const stats = React.useMemo(() => {
        return calculateManagerStats(state.user, state.leagues);
    }, [state.leagues, state.user]);

    const careerHistory = React.useMemo(() => {
        return calculateCareerHistory(state.user.id, state.leagues);
    }, [state.leagues, state.user.id]);

    const memberSinceDate = state.user.memberSince
        ? new Date(state.user.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : 'a long time ago';
    
    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                    Manager Profile
                </h1>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Dashboard
                </button>
            </header>
            <main className="flex-grow max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <Widget title="Identity" icon={<UserIcon />}>
                            <div className="p-4 flex flex-col items-center text-center">
                                <Avatar avatar={state.user.avatar} className="w-28 h-28 text-7xl rounded-full mb-4 ring-4 ring-cyan-400/50" />
                                <h2 className="text-2xl font-bold font-display">{state.user.name}</h2>
                                <p className="text-xs text-gray-400">Member since {memberSinceDate}</p>
                                <p className="text-sm text-gray-300 mt-3 italic">"{state.user.bio || 'No bio set.'}"</p>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-transparent border border-cyan-400/50 text-cyan-300 font-bold text-xs rounded-md hover:bg-cyan-400/20"
                                    >
                                        <PencilIcon />
                                        Edit Profile
                                    </button>
                                     <button
                                        onClick={() => dispatch({ type: 'LOGOUT' })}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-300 font-bold text-xs rounded-md hover:bg-red-500/20"
                                    >
                                        <LogOutIcon />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </Widget>
                        <Widget title="Career Stats">
                            <div className="p-4 grid grid-cols-2 gap-4">
                                <StatCard label="Championships" value={stats.championships} />
                                <StatCard label="Leagues Joined" value={stats.leaguesJoined} />
                            </div>
                        </Widget>
                        <AchievementsWidget badges={state.user.badges || []} />
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Widget title="League History" icon={<BookOpenIcon />}>
                             <div className="p-4 space-y-3">
                                {careerHistory.map(entry => {
                                    const league = state.leagues.find(l=>l.id===entry.leagueId);
                                    return (
                                        <div key={entry.key} className="bg-black/10 p-3 rounded-lg flex items-center justify-between hover:bg-black/20 transition-colors">
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
                                            <button 
                                                onClick={() => {
                                                    dispatch({type: 'SET_ACTIVE_LEAGUE', payload: entry.leagueId});
                                                    if (entry.isComplete) {
                                                        dispatch({type: 'SET_SEASON_REVIEW_YEAR', payload: entry.season});
                                                        dispatch({type: 'SET_VIEW', payload: 'SEASON_REVIEW'});
                                                    } else {
                                                        dispatch({type: 'SET_VIEW', payload: 'LEAGUE_HUB'});
                                                    }
                                                }}
                                                className="px-3 py-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-300 rounded-md hover:bg-cyan-500/20"
                                            >
                                                {entry.isComplete ? 'Season Review' : 'Go to Hub'}
                                            </button>
                                        </div>
                                    )
                                })}
                                {careerHistory.length === 0 && <p className="text-sm text-center text-gray-500 py-4">No league history yet. Complete a season!</p>}
                            </div>
                        </Widget>
                    </div>
                </div>
            </main>
             <AnimatePresence>
                {isEditModalOpen && (
                    <EditProfileModal user={state.user} dispatch={dispatch} onClose={() => setIsEditModalOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileView;
