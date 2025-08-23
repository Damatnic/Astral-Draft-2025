
import React from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '../../contexts/AppContext';
import { View } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import { Avatar } from '../ui/Avatar';

const navItems: { id: View, label: string }[] = [
    { id: 'DASHBOARD', label: 'Dashboard' },
    { id: 'LEAGUE_HUB', label: 'League Hub' },
    { id: 'TEAM_HUB', label: 'Team Hub' },
    { id: 'ASSISTANT', label: 'AI Assistant' },
];

const MobileNavMenu: React.FC = () => {
    const { state, dispatch } = useAppState();

    const handleNav = (view: View) => {
        dispatch({ type: 'SET_VIEW', payload: view });
        dispatch({ type: 'TOGGLE_MOBILE_NAV' });
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => dispatch({ type: 'TOGGLE_MOBILE_NAV' })}
            {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
            }}
        >
            <motion.div
                className="absolute top-0 right-0 h-full w-4/5 max-w-sm bg-slate-900/90 backdrop-blur-lg border-l border-white/10 flex flex-col"
                onClick={(e: any) => e.stopPropagation()}
                {...{
                    initial: { x: '100%' },
                    animate: { x: '0%' },
                    exit: { x: '100%' },
                    transition: { type: 'spring', stiffness: 300, damping: 30 },
                }}
            >
                <header className="p-4 flex justify-between items-center border-b border-white/10">
                    <h2 className="font-display font-bold text-lg">Menu</h2>
                    <button onClick={() => dispatch({ type: 'TOGGLE_MOBILE_NAV' })} className="p-1 rounded-full hover:bg-white/10">
                        <CloseIcon />
                    </button>
                </header>
                <nav className="flex-grow p-4 space-y-2">
                    {navItems.map((item: any) => {
                        const isDisabled = (item.id === 'LEAGUE_HUB' || item.id === 'TEAM_HUB') && !state.activeLeagueId;
                        return (
                             <button
                                key={item.id}
                                onClick={() => handleNav(item.id)}
                                disabled={isDisabled}
                                className={`w-full text-left p-3 text-lg font-semibold rounded-lg transition-colors focus:outline-none ${
                                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-400/10 hover:text-cyan-300'
                                }`}
                            >
                               {item.label}
                            </button>
                        )
                    })}
                </nav>
                 <footer className="p-4 border-t border-white/10">
                     <button 
                        onClick={() => handleNav('PROFILE')}
                        className="flex items-center gap-3 p-2 w-full rounded-lg hover:bg-white/10"
                    >
                        <Avatar avatar={state.user.avatar} className="w-10 h-10 text-2xl rounded-full" />
                        <span className="font-semibold">{state.user.name}</span>
                    </button>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default MobileNavMenu;
