// Player data and types for Astral Draft
import { Player as MainPlayer, PlayerPosition } from '../types';

// Re-export the main Player type
export type Player = MainPlayer;

// Import full 2025 NFL roster
import nflPlayers2025 from './nfl-players-2025-fixed';

// Export the full player list
export const players: Player[] = nflPlayers2025;

// Helper functions
export const getPlayerById = (id: string): Player | undefined => {
  return players.find(p => p.id === id);
};

export const getPlayersByPosition = (position: string): Player[] => {
  return players.filter(p => p.position === position);
};

export const getPlayersByTier = (tier: number): Player[] => {
  return players.filter(p => p.tier === tier);
};

export const searchPlayers = (query: string): Player[] => {
  const lowerQuery = query.toLowerCase();
  return players.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.team.toLowerCase().includes(lowerQuery) ||
    p.position.toLowerCase().includes(lowerQuery)
  );
};

export default players;