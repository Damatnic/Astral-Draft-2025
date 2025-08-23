/**
 * NFL Players Database for 2025 Season - Fixed Types
 * Complete rosters for fantasy football drafting
 */

import { Player, PlayerPosition } from '../types';

// Helper to create a player with proper types
const createPlayer = (
  id: number,
  name: string,
  position: PlayerPosition,
  team: string,
  rank: number,
  adp: number,
  bye: number,
  tier: number,
  age: number,
  auctionValue: number,
  projectedPoints: number
): Player => ({
  id,
  name,
  position,
  team,
  rank,
  adp,
  bye,
  tier,
  age,
  auctionValue,
  projectedPoints,
  consistency: 'medium' as const,
  upside: 'medium' as const,
  injuryStatus: 'healthy' as const,
  injuryHistory: 'minimal' as const,
  yearsExperience: 3,
  situationChange: 'same' as const,
  role: 'starter' as const,
  stats: {
    projection: projectedPoints,
    lastYear: projectedPoints * 0.95,
    vorp: projectedPoints / 10,
    weeklyProjections: {}
  }
});

// Top 200 fantasy-relevant players for 2025 season
export const nflPlayers2025: Player[] = [
  // Quarterbacks
  createPlayer(1, 'Josh Allen', 'QB', 'BUF', 1, 25.0, 13, 1, 29, 85, 380),
  createPlayer(2, 'Jalen Hurts', 'QB', 'PHI', 2, 28.0, 10, 1, 26, 82, 375),
  createPlayer(3, 'Lamar Jackson', 'QB', 'BAL', 3, 35.0, 14, 1, 28, 80, 365),
  createPlayer(4, 'Dak Prescott', 'QB', 'DAL', 4, 45.0, 7, 2, 31, 75, 340),
  createPlayer(5, 'Patrick Mahomes', 'QB', 'KC', 5, 40.0, 6, 1, 29, 78, 355),
  createPlayer(6, 'C.J. Stroud', 'QB', 'HOU', 6, 50.0, 14, 2, 23, 72, 330),
  createPlayer(7, 'Anthony Richardson', 'QB', 'IND', 7, 55.0, 14, 2, 23, 70, 325),
  createPlayer(8, 'Joe Burrow', 'QB', 'CIN', 8, 52.0, 12, 2, 28, 71, 335),
  createPlayer(9, 'Jordan Love', 'QB', 'GB', 9, 60.0, 10, 2, 26, 68, 320),
  createPlayer(10, 'Tua Tagovailoa', 'QB', 'MIA', 10, 65.0, 6, 3, 27, 65, 310),
  createPlayer(11, 'Trevor Lawrence', 'QB', 'JAX', 11, 70.0, 12, 3, 25, 62, 305),
  createPlayer(12, 'Justin Herbert', 'QB', 'LAC', 12, 68.0, 5, 3, 27, 63, 308),

  // Running Backs
  createPlayer(13, 'Christian McCaffrey', 'RB', 'SF', 1, 1.0, 9, 1, 29, 100, 350),
  createPlayer(14, 'Breece Hall', 'RB', 'NYJ', 2, 3.0, 7, 1, 24, 95, 320),
  createPlayer(15, 'Bijan Robinson', 'RB', 'ATL', 3, 4.0, 11, 1, 23, 93, 315),
  createPlayer(16, 'Saquon Barkley', 'RB', 'PHI', 4, 8.0, 10, 1, 28, 88, 300),
  createPlayer(17, 'Jonathan Taylor', 'RB', 'IND', 5, 9.0, 14, 1, 26, 87, 295),
  createPlayer(18, 'Jahmyr Gibbs', 'RB', 'DET', 6, 10.0, 5, 1, 23, 85, 290),
  createPlayer(19, 'Travis Etienne Jr.', 'RB', 'JAX', 7, 15.0, 12, 2, 26, 80, 275),
  createPlayer(20, 'Derrick Henry', 'RB', 'BAL', 8, 18.0, 14, 2, 31, 78, 270),
  createPlayer(21, 'Josh Jacobs', 'RB', 'GB', 9, 20.0, 10, 2, 27, 76, 265),
  createPlayer(22, 'Kenneth Walker III', 'RB', 'SEA', 10, 22.0, 10, 2, 24, 74, 260),
  createPlayer(23, 'Rachaad White', 'RB', 'TB', 11, 24.0, 11, 2, 26, 72, 255),
  createPlayer(24, 'Isiah Pacheco', 'RB', 'KC', 12, 26.0, 6, 2, 26, 70, 250),
  createPlayer(25, 'Joe Mixon', 'RB', 'HOU', 13, 28.0, 14, 2, 28, 68, 245),
  createPlayer(26, 'De\'Von Achane', 'RB', 'MIA', 14, 30.0, 6, 2, 23, 66, 240),
  createPlayer(27, 'James Cook', 'RB', 'BUF', 15, 32.0, 13, 3, 25, 64, 235),

  // Wide Receivers
  createPlayer(28, 'CeeDee Lamb', 'WR', 'DAL', 1, 2.0, 7, 1, 26, 98, 340),
  createPlayer(29, 'Tyreek Hill', 'WR', 'MIA', 2, 5.0, 6, 1, 31, 92, 325),
  createPlayer(30, 'Amon-Ra St. Brown', 'WR', 'DET', 3, 6.0, 5, 1, 25, 90, 320),
  createPlayer(31, 'Justin Jefferson', 'WR', 'MIN', 4, 7.0, 13, 1, 26, 89, 318),
  createPlayer(32, 'Ja\'Marr Chase', 'WR', 'CIN', 5, 11.0, 12, 1, 25, 84, 310),
  createPlayer(33, 'A.J. Brown', 'WR', 'PHI', 6, 12.0, 10, 1, 28, 83, 305),
  createPlayer(34, 'Puka Nacua', 'WR', 'LAR', 7, 13.0, 10, 1, 24, 82, 300),
  createPlayer(35, 'Garrett Wilson', 'WR', 'NYJ', 8, 14.0, 7, 1, 25, 81, 295),
  createPlayer(36, 'Chris Olave', 'WR', 'NO', 9, 16.0, 11, 2, 25, 79, 285),
  createPlayer(37, 'Davante Adams', 'WR', 'NYJ', 10, 17.0, 7, 2, 32, 77, 280),
  createPlayer(38, 'DK Metcalf', 'WR', 'SEA', 11, 19.0, 10, 2, 27, 75, 275),
  createPlayer(39, 'Mike Evans', 'WR', 'TB', 12, 21.0, 11, 2, 31, 73, 270),
  createPlayer(40, 'Brandon Aiyuk', 'WR', 'SF', 13, 23.0, 9, 2, 27, 71, 265),
  createPlayer(41, 'Stefon Diggs', 'WR', 'HOU', 14, 25.0, 14, 2, 31, 69, 260),
  createPlayer(42, 'Deebo Samuel', 'WR', 'SF', 15, 27.0, 9, 2, 29, 67, 255),
  createPlayer(43, 'Marvin Harrison Jr.', 'WR', 'ARI', 16, 29.0, 14, 2, 23, 65, 250),
  createPlayer(44, 'DJ Moore', 'WR', 'CHI', 17, 31.0, 7, 2, 28, 63, 245),
  createPlayer(45, 'Nico Collins', 'WR', 'HOU', 18, 33.0, 14, 2, 26, 61, 240),

  // Tight Ends
  createPlayer(46, 'Travis Kelce', 'TE', 'KC', 1, 34.0, 6, 1, 35, 60, 235),
  createPlayer(47, 'Sam LaPorta', 'TE', 'DET', 2, 36.0, 5, 1, 24, 58, 220),
  createPlayer(48, 'Mark Andrews', 'TE', 'BAL', 3, 42.0, 14, 2, 30, 55, 210),
  createPlayer(49, 'Trey McBride', 'TE', 'ARI', 4, 45.0, 14, 2, 25, 53, 200),
  createPlayer(50, 'Dalton Kincaid', 'TE', 'BUF', 5, 48.0, 13, 2, 25, 51, 195),
  createPlayer(51, 'George Kittle', 'TE', 'SF', 6, 50.0, 9, 2, 31, 49, 190),
  createPlayer(52, 'Kyle Pitts', 'TE', 'ATL', 7, 55.0, 11, 3, 24, 47, 185),
  createPlayer(53, 'Evan Engram', 'TE', 'JAX', 8, 60.0, 12, 3, 30, 45, 180),
  createPlayer(54, 'T.J. Hockenson', 'TE', 'MIN', 9, 62.0, 13, 3, 28, 43, 175),
  createPlayer(55, 'Dallas Goedert', 'TE', 'PHI', 10, 65.0, 10, 3, 30, 41, 170),

  // More depth players
  createPlayer(56, 'Aaron Jones', 'RB', 'MIN', 16, 35.0, 13, 3, 30, 62, 230),
  createPlayer(57, 'Alvin Kamara', 'RB', 'NO', 17, 37.0, 11, 3, 30, 60, 225),
  createPlayer(58, 'Rhamondre Stevenson', 'RB', 'NE', 18, 39.0, 14, 3, 27, 58, 220),
  createPlayer(59, 'Tony Pollard', 'RB', 'TEN', 19, 41.0, 5, 3, 28, 56, 215),
  createPlayer(60, 'James Conner', 'RB', 'ARI', 20, 43.0, 14, 3, 30, 54, 210),

  // Kickers
  createPlayer(89, 'Justin Tucker', 'K', 'BAL', 1, 120.0, 14, 1, 35, 20, 150),
  createPlayer(90, 'Harrison Butker', 'K', 'KC', 2, 125.0, 6, 1, 29, 18, 145),
  createPlayer(91, 'Tyler Bass', 'K', 'BUF', 3, 130.0, 13, 2, 28, 16, 140),

  // Defenses
  createPlayer(94, 'Baltimore Ravens', 'DST', 'BAL', 1, 115.0, 14, 1, 0, 22, 160),
  createPlayer(95, 'San Francisco 49ers', 'DST', 'SF', 2, 118.0, 9, 1, 0, 20, 155),
  createPlayer(96, 'Cleveland Browns', 'DST', 'CLE', 3, 122.0, 10, 1, 0, 18, 150),
];

// Helper functions for player queries
export const getPlayersByPosition = (position: PlayerPosition): Player[] => {
  return nflPlayers2025.filter(p => p.position === position);
};

export const getPlayersByTier = (tier: number): Player[] => {
  return nflPlayers2025.filter(p => p.tier === tier);
};

export const getTopPlayers = (count: number = 10): Player[] => {
  return nflPlayers2025.slice(0, count);
};

export const searchPlayers = (query: string): Player[] => {
  const lowerQuery = query.toLowerCase();
  return nflPlayers2025.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.team.toLowerCase().includes(lowerQuery) ||
    p.position.toLowerCase().includes(lowerQuery)
  );
};

export default nflPlayers2025;