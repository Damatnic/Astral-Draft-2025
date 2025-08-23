

import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { motion } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { LazyImage } from '../ui/LazyImage';
import { MenuIcon } from '../icons/MenuIcon';
import TeamSwitcher from '../ui/TeamSwitcher';
import { MailIcon } from '../icons/MailIcon';

const Header: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { user } = state;

    const hasUnreadMessages = state.directMessages?.some((m: any) => m.toUserId === user.id && !m.isRead);

    return (
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 glass-pane border-b-0 rounded-b-xl mx-auto max-w-7xl mt-4">
             <div className="flex items-center gap-2">
                <LazyImage 
                  src="/favicon.svg" 
                  alt="Astral Draft Logo" 
                  className="h-8 w-8"
                  loading="eager"
                />
                <h1 className="font-display text-xl font-bold tracking-wider text-white hidden sm:block">ASTRAL DRAFT</h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
                <TeamSwitcher />
                <button 
                    onClick={() => dispatch({ type: 'SET_VIEW', payload: 'MESSAGES' })}
                    className="relative p-2 rounded-full hover:bg-white/10"
                    aria-label="Open messages"
                >
                    <MailIcon />
                    {hasUnreadMessages && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-800"></div>}
                </button>
                <button 
                    onClick={() => dispatch({ type: 'SET_VIEW', payload: 'PROFILE' })}
                    className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-white/10"
                >
                    <Avatar avatar={user.avatar} className="w-8 h-8 text-lg rounded-full" />
                    <span className="font-semibold text-sm hidden sm:block">{user.name}</span>
                </button>
                <button 
                    onClick={() => dispatch({ type: 'TOGGLE_MOBILE_NAV' })}
                    className="sm:hidden p-2 rounded-full hover:bg-white/10"
                    aria-label="Open navigation menu"
                >
                    <MenuIcon />
                </button>
            </div>
        </header>
    );
};

export default Header;
