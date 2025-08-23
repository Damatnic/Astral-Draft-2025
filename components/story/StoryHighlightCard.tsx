import React from 'react';
import type { Player } from '../../types';
import { Avatar } from '../ui/Avatar';

interface StoryHighlightCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    player?: Player | null;
}

const StoryHighlightCard: React.FC<StoryHighlightCardProps> = ({ icon, title, description, player }) => {
    return (
        <div className="glass-pane p-4 rounded-xl flex items-start gap-4">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-cyan-400/10 text-cyan-300 rounded-lg text-2xl">
                {icon}
            </div>
            <div className="flex-grow">
                <h4 className="font-bold text-lg text-white">{title}</h4>
                {player && (
                    <div className="flex items-center gap-2 my-1">
                        <Avatar avatar={player.astralIntelligence?.spiritAnimal?.split(',')[0] || '🏈'} className="w-8 h-8 text-xl rounded-md" />
                        <div>
                             <p className="font-semibold text-base">{player.name}</p>
                             <p className="text-xs text-gray-400">{player.position} - {player.team}</p>
                        </div>
                    </div>
                )}
                <p className="text-sm text-gray-300">{description}</p>
            </div>
        </div>
    );
};

export default StoryHighlightCard;