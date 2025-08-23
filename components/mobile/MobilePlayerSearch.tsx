/**
 * Mobile Player Search Wrapper
 * Integrates MobileSearchInterface for player search functionality
 */

import React from 'react';
import { Player } from '../../types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MobileSearchInterface from './MobileSearchInterface';

interface MobilePlayerSearchProps {
    players: Player[];
    onPlayerSelect?: (player: Player) => void;
    onSearch?: (query: string) => void;
    placeholder?: string;
    className?: string;
}

const MobilePlayerSearch: React.FC<MobilePlayerSearchProps> = ({
    players,
    onPlayerSelect,
    onSearch,
    placeholder = "Search players...",
    className = ''
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');

    if (!isMobile) {
        // Return desktop search component or null
        return (
            <div className={`desktop-search-fallback p-4 ${className}`}>
                <input
                    type="text"
                    placeholder={placeholder}
                    onChange={(e: any) => onSearch?.(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <div className="mt-4 grid gap-2">
                    {players.slice(0, 10).map((player: any) => (
                        <button
                            key={player.id}
                            onClick={() => onPlayerSelect?.(player)}
                            className="w-full p-3 border rounded-lg cursor-pointer hover:bg-gray-50 text-left"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{player.name}</span>
                                <span className="text-sm text-gray-500">
                                    {player.position} - {player.team}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <MobileSearchInterface
            players={players}
            onPlayerSelect={onPlayerSelect}
            onSearch={onSearch}
            placeholder={placeholder}
            showFilters={true}
            showSorting={true}
            className={className}
        />
    );
};

export default MobilePlayerSearch;
