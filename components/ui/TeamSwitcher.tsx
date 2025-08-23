
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../../contexts/AppContext';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { Avatar } from './Avatar';

const TeamSwitcher: React.FC = () => {
    const { state, dispatch } = useAppState();
    const [isOpen, setIsOpen] = React.useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    const activeLeague = state.leagues.find((l: any) => l.id === state.activeLeagueId);
    const myActiveTeam = activeLeague?.teams.find((t: any) => t.owner.id === state.user.id);
    
    const otherTeams = state.leagues
        .filter((l: any) => !l.isMock && l.id !== state.activeLeagueId)
        .map((l: any) => ({
            leagueId: l.id,
            team: l.teams.find((t: any) => t.owner.id === state.user.id)
        }))
        .filter((item: any) => item.team);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleSwitch = (leagueId: string) => {
        dispatch({ type: 'SET_ACTIVE_LEAGUE', payload: leagueId });
        dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' });
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
            >
                {myActiveTeam ? (
                    <>
                        <Avatar avatar={myActiveTeam.avatar} className="w-6 h-6 rounded" />
                        <span className="text-sm font-semibold hidden md:block">{myActiveTeam.name}</span>
                    </>
                ) : (
                    <span className="text-sm font-semibold">Select Team</span>
                )}
                 <ChevronDownIcon />
            </button>
            <AnimatePresence>
                {isOpen && otherTeams.length > 0 && (
                    <motion.div
                        className="absolute top-full right-0 mt-2 w-64 bg-slate-800/90 backdrop-blur-md border border-white/10 rounded-lg shadow-lg z-50 p-2"
                        {...{
                            initial: { opacity: 0, y: -10 },
                            animate: { opacity: 1, y: 0 },
                            exit: { opacity: 0, y: -10 },
                        }}
                    >
                        {otherTeams.map((item: any) => (
                            item.team && (
                                <button
                                    key={item.leagueId}
                                    onClick={() => handleSwitch(item.leagueId)}
                                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/10 text-left"
                                >
                                    <Avatar avatar={item.team.avatar} className="w-8 h-8 rounded-md" />
                                    <div>
                                        <p className="font-semibold text-sm">{item.team.name}</p>
                                        <p className="text-xs text-gray-400">{state.leagues.find(l=>l.id===item.leagueId)?.name}</p>
                                    </div>
                                </button>
                            )
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamSwitcher;
