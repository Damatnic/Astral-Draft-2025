
import React from 'react';
import type { Team } from '../../types';
import { Avatar } from '../ui/Avatar';

interface TeamBrandingCardProps {
    team: Team;
    slogan: string;
}

const TeamBrandingCard: React.FC<TeamBrandingCardProps> = ({ team, slogan }) => {
    const { name, avatar, record } = team;
    return (
        <div className="w-full max-w-sm aspect-[2/1] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 flex flex-col justify-between shadow-lg border border-cyan-400/30 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-radial from-cyan-500/10 via-transparent to-transparent animate-pulse"></div>
            
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h3 className="font-display text-2xl font-bold text-white leading-tight">{name}</h3>
                    <p className="font-mono text-sm text-gray-400">{record.wins}-{record.losses}-{record.ties}</p>
                </div>
                 <Avatar avatar={avatar} className="w-16 h-16 text-4xl rounded-lg flex-shrink-0" />
            </div>
            <div className="text-center">
                 <p className="font-display text-lg italic text-cyan-200">"{slogan}"</p>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="font-display font-bold">ASTRAL DRAFT</span>
                <span>{new Date().getFullYear()} Season</span>
            </div>
        </div>
    );
};

export default TeamBrandingCard;