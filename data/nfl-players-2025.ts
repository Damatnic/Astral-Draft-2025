/**
 * NFL Players Database for 2025 Season
 * Complete rosters for fantasy football drafting
 */

import { Player, PlayerPosition } from '../types';

// Top 200 fantasy-relevant players for 2025 season
export const nflPlayers2025: Player[] = [
  // Quarterbacks
  { id: '1', name: 'Josh Allen', position: 'QB', team: 'BUF', age: 29, tier: 1, adp: 25.0, rank: 1, value: 85, status: 'healthy', projectedPoints: 380 },
  { id: '2', name: 'Jalen Hurts', position: 'QB', team: 'PHI', age: 26, tier: 1, adp: 28.0, rank: 2, value: 82, status: 'healthy', projectedPoints: 375 },
  { id: '3', name: 'Lamar Jackson', position: 'QB', team: 'BAL', age: 28, tier: 1, adp: 35.0, rank: 3, value: 80, status: 'healthy', projectedPoints: 365 },
  { id: '4', name: 'Dak Prescott', position: 'QB', team: 'DAL', age: 31, tier: 2, adp: 45.0, rank: 4, value: 75, status: 'healthy', projectedPoints: 340 },
  { id: '5', name: 'Patrick Mahomes', position: 'QB', team: 'KC', age: 29, tier: 1, adp: 40.0, rank: 5, value: 78, status: 'healthy', projectedPoints: 355 },
  { id: '6', name: 'C.J. Stroud', position: 'QB', team: 'HOU', age: 23, tier: 2, adp: 50.0, rank: 6, value: 72, status: 'healthy', projectedPoints: 330 },
  { id: '7', name: 'Anthony Richardson', position: 'QB', team: 'IND', age: 23, tier: 2, adp: 55.0, rank: 7, value: 70, status: 'healthy', projectedPoints: 325 },
  { id: '8', name: 'Joe Burrow', position: 'QB', team: 'CIN', age: 28, tier: 2, adp: 52.0, rank: 8, value: 71, status: 'healthy', projectedPoints: 335 },
  { id: '9', name: 'Jordan Love', position: 'QB', team: 'GB', age: 26, tier: 2, adp: 60.0, rank: 9, value: 68, status: 'healthy', projectedPoints: 320 },
  { id: '10', name: 'Tua Tagovailoa', position: 'QB', team: 'MIA', age: 27, tier: 3, adp: 65.0, rank: 10, value: 65, status: 'healthy', projectedPoints: 310 },
  { id: '11', name: 'Trevor Lawrence', position: 'QB', team: 'JAX', age: 25, tier: 3, adp: 70.0, rank: 11, value: 62, status: 'healthy', projectedPoints: 305 },
  { id: '12', name: 'Justin Herbert', position: 'QB', team: 'LAC', age: 27, tier: 3, adp: 68.0, rank: 12, value: 63, status: 'healthy', projectedPoints: 308 },

  // Running Backs
  { id: '13', name: 'Christian McCaffrey', position: 'RB', team: 'SF', age: 29, tier: 1, adp: 1.0, rank: 1, value: 100, status: 'healthy', projectedPoints: 350 },
  { id: '14', name: 'Breece Hall', position: 'RB', team: 'NYJ', age: 24, tier: 1, adp: 3.0, rank: 2, value: 95, status: 'healthy', projectedPoints: 320 },
  { id: '15', name: 'Bijan Robinson', position: 'RB', team: 'ATL', age: 23, tier: 1, adp: 4.0, rank: 3, value: 93, status: 'healthy', projectedPoints: 315 },
  { id: '16', name: 'Saquon Barkley', position: 'RB', team: 'PHI', age: 28, tier: 1, adp: 8.0, rank: 4, value: 88, status: 'healthy', projectedPoints: 300 },
  { id: '17', name: 'Jonathan Taylor', position: 'RB', team: 'IND', age: 26, tier: 1, adp: 9.0, rank: 5, value: 87, status: 'healthy', projectedPoints: 295 },
  { id: '18', name: 'Jahmyr Gibbs', position: 'RB', team: 'DET', age: 23, tier: 1, adp: 10.0, rank: 6, value: 85, status: 'healthy', projectedPoints: 290 },
  { id: '19', name: 'Travis Etienne Jr.', position: 'RB', team: 'JAX', age: 26, tier: 2, adp: 15.0, rank: 7, value: 80, status: 'healthy', projectedPoints: 275 },
  { id: '20', name: 'Derrick Henry', position: 'RB', team: 'BAL', age: 31, tier: 2, adp: 18.0, rank: 8, value: 78, status: 'healthy', projectedPoints: 270 },
  { id: '21', name: 'Josh Jacobs', position: 'RB', team: 'GB', age: 27, tier: 2, adp: 20.0, rank: 9, value: 76, status: 'healthy', projectedPoints: 265 },
  { id: '22', name: 'Kenneth Walker III', position: 'RB', team: 'SEA', age: 24, tier: 2, adp: 22.0, rank: 10, value: 74, status: 'healthy', projectedPoints: 260 },
  { id: '23', name: 'Rachaad White', position: 'RB', team: 'TB', age: 26, tier: 2, adp: 24.0, rank: 11, value: 72, status: 'healthy', projectedPoints: 255 },
  { id: '24', name: 'Isiah Pacheco', position: 'RB', team: 'KC', age: 26, tier: 2, adp: 26.0, rank: 12, value: 70, status: 'healthy', projectedPoints: 250 },
  { id: '25', name: 'Joe Mixon', position: 'RB', team: 'HOU', age: 28, tier: 2, adp: 28.0, rank: 13, value: 68, status: 'healthy', projectedPoints: 245 },
  { id: '26', name: 'De\'Von Achane', position: 'RB', team: 'MIA', age: 23, tier: 2, adp: 30.0, rank: 14, value: 66, status: 'healthy', projectedPoints: 240 },
  { id: '27', name: 'James Cook', position: 'RB', team: 'BUF', age: 25, tier: 3, adp: 32.0, rank: 15, value: 64, status: 'healthy', projectedPoints: 235 },

  // Wide Receivers
  { id: '28', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', age: 26, tier: 1, adp: 2.0, rank: 1, value: 98, status: 'healthy', projectedPoints: 340 },
  { id: '29', name: 'Tyreek Hill', position: 'WR', team: 'MIA', age: 31, tier: 1, adp: 5.0, rank: 2, value: 92, status: 'healthy', projectedPoints: 325 },
  { id: '30', name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', age: 25, tier: 1, adp: 6.0, rank: 3, value: 90, status: 'healthy', projectedPoints: 320 },
  { id: '31', name: 'Justin Jefferson', position: 'WR', team: 'MIN', age: 26, tier: 1, adp: 7.0, rank: 4, value: 89, status: 'healthy', projectedPoints: 318 },
  { id: '32', name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN', age: 25, tier: 1, adp: 11.0, rank: 5, value: 84, status: 'healthy', projectedPoints: 310 },
  { id: '33', name: 'A.J. Brown', position: 'WR', team: 'PHI', age: 28, tier: 1, adp: 12.0, rank: 6, value: 83, status: 'healthy', projectedPoints: 305 },
  { id: '34', name: 'Puka Nacua', position: 'WR', team: 'LAR', age: 24, tier: 1, adp: 13.0, rank: 7, value: 82, status: 'healthy', projectedPoints: 300 },
  { id: '35', name: 'Garrett Wilson', position: 'WR', team: 'NYJ', age: 25, tier: 1, adp: 14.0, rank: 8, value: 81, status: 'healthy', projectedPoints: 295 },
  { id: '36', name: 'Chris Olave', position: 'WR', team: 'NO', age: 25, tier: 2, adp: 16.0, rank: 9, value: 79, status: 'healthy', projectedPoints: 285 },
  { id: '37', name: 'Davante Adams', position: 'WR', team: 'NYJ', age: 32, tier: 2, adp: 17.0, rank: 10, value: 77, status: 'healthy', projectedPoints: 280 },
  { id: '38', name: 'DK Metcalf', position: 'WR', team: 'SEA', age: 27, tier: 2, adp: 19.0, rank: 11, value: 75, status: 'healthy', projectedPoints: 275 },
  { id: '39', name: 'Mike Evans', position: 'WR', team: 'TB', age: 31, tier: 2, adp: 21.0, rank: 12, value: 73, status: 'healthy', projectedPoints: 270 },
  { id: '40', name: 'Brandon Aiyuk', position: 'WR', team: 'SF', age: 27, tier: 2, adp: 23.0, rank: 13, value: 71, status: 'healthy', projectedPoints: 265 },
  { id: '41', name: 'Stefon Diggs', position: 'WR', team: 'HOU', age: 31, tier: 2, adp: 25.0, rank: 14, value: 69, status: 'healthy', projectedPoints: 260 },
  { id: '42', name: 'Deebo Samuel', position: 'WR', team: 'SF', age: 29, tier: 2, adp: 27.0, rank: 15, value: 67, status: 'healthy', projectedPoints: 255 },
  { id: '43', name: 'Marvin Harrison Jr.', position: 'WR', team: 'ARI', age: 23, tier: 2, adp: 29.0, rank: 16, value: 65, status: 'healthy', projectedPoints: 250 },
  { id: '44', name: 'DJ Moore', position: 'WR', team: 'CHI', age: 28, tier: 2, adp: 31.0, rank: 17, value: 63, status: 'healthy', projectedPoints: 245 },
  { id: '45', name: 'Nico Collins', position: 'WR', team: 'HOU', age: 26, tier: 2, adp: 33.0, rank: 18, value: 61, status: 'healthy', projectedPoints: 240 },

  // Tight Ends
  { id: '46', name: 'Travis Kelce', position: 'TE', team: 'KC', age: 35, tier: 1, adp: 34.0, rank: 1, value: 60, status: 'healthy', projectedPoints: 235 },
  { id: '47', name: 'Sam LaPorta', position: 'TE', team: 'DET', age: 24, tier: 1, adp: 36.0, rank: 2, value: 58, status: 'healthy', projectedPoints: 220 },
  { id: '48', name: 'Mark Andrews', position: 'TE', team: 'BAL', age: 30, tier: 2, adp: 42.0, rank: 3, value: 55, status: 'healthy', projectedPoints: 210 },
  { id: '49', name: 'Trey McBride', position: 'TE', team: 'ARI', age: 25, tier: 2, adp: 45.0, rank: 4, value: 53, status: 'healthy', projectedPoints: 200 },
  { id: '50', name: 'Dalton Kincaid', position: 'TE', team: 'BUF', age: 25, tier: 2, adp: 48.0, rank: 5, value: 51, status: 'healthy', projectedPoints: 195 },
  { id: '51', name: 'George Kittle', position: 'TE', team: 'SF', age: 31, tier: 2, adp: 50.0, rank: 6, value: 49, status: 'healthy', projectedPoints: 190 },
  { id: '52', name: 'Kyle Pitts', position: 'TE', team: 'ATL', age: 24, tier: 3, adp: 55.0, rank: 7, value: 47, status: 'healthy', projectedPoints: 185 },
  { id: '53', name: 'Evan Engram', position: 'TE', team: 'JAX', age: 30, tier: 3, adp: 60.0, rank: 8, value: 45, status: 'healthy', projectedPoints: 180 },
  { id: '54', name: 'T.J. Hockenson', position: 'TE', team: 'MIN', age: 28, tier: 3, adp: 62.0, rank: 9, value: 43, status: 'healthy', projectedPoints: 175 },
  { id: '55', name: 'Dallas Goedert', position: 'TE', team: 'PHI', age: 30, tier: 3, adp: 65.0, rank: 10, value: 41, status: 'healthy', projectedPoints: 170 },

  // More RBs (depth)
  { id: '56', name: 'Aaron Jones', position: 'RB', team: 'MIN', age: 30, tier: 3, adp: 35.0, rank: 16, value: 62, status: 'healthy', projectedPoints: 230 },
  { id: '57', name: 'Alvin Kamara', position: 'RB', team: 'NO', age: 30, tier: 3, adp: 37.0, rank: 17, value: 60, status: 'healthy', projectedPoints: 225 },
  { id: '58', name: 'Rhamondre Stevenson', position: 'RB', team: 'NE', age: 27, tier: 3, adp: 39.0, rank: 18, value: 58, status: 'healthy', projectedPoints: 220 },
  { id: '59', name: 'Tony Pollard', position: 'RB', team: 'TEN', age: 28, tier: 3, adp: 41.0, rank: 19, value: 56, status: 'healthy', projectedPoints: 215 },
  { id: '60', name: 'James Conner', position: 'RB', team: 'ARI', age: 30, tier: 3, adp: 43.0, rank: 20, value: 54, status: 'healthy', projectedPoints: 210 },
  { id: '61', name: 'Najee Harris', position: 'RB', team: 'PIT', age: 27, tier: 3, adp: 44.0, rank: 21, value: 52, status: 'healthy', projectedPoints: 205 },
  { id: '62', name: 'David Montgomery', position: 'RB', team: 'DET', age: 28, tier: 3, adp: 46.0, rank: 22, value: 50, status: 'healthy', projectedPoints: 200 },
  { id: '63', name: 'Brian Robinson Jr.', position: 'RB', team: 'WAS', age: 26, tier: 4, adp: 48.0, rank: 23, value: 48, status: 'healthy', projectedPoints: 195 },
  { id: '64', name: 'Jaylen Warren', position: 'RB', team: 'PIT', age: 26, tier: 4, adp: 51.0, rank: 24, value: 46, status: 'healthy', projectedPoints: 190 },
  { id: '65', name: 'Zack Moss', position: 'RB', team: 'CIN', age: 27, tier: 4, adp: 53.0, rank: 25, value: 44, status: 'healthy', projectedPoints: 185 },

  // More WRs (depth)
  { id: '66', name: 'Cooper Kupp', position: 'WR', team: 'LAR', age: 31, tier: 3, adp: 38.0, rank: 19, value: 59, status: 'healthy', projectedPoints: 235 },
  { id: '67', name: 'DeVonta Smith', position: 'WR', team: 'PHI', age: 26, tier: 3, adp: 40.0, rank: 20, value: 57, status: 'healthy', projectedPoints: 230 },
  { id: '68', name: 'Michael Pittman Jr.', position: 'WR', team: 'IND', age: 27, tier: 3, adp: 42.0, rank: 21, value: 55, status: 'healthy', projectedPoints: 225 },
  { id: '69', name: 'Calvin Ridley', position: 'WR', team: 'TEN', age: 30, tier: 3, adp: 44.0, rank: 22, value: 53, status: 'healthy', projectedPoints: 220 },
  { id: '70', name: 'Jaylen Waddle', position: 'WR', team: 'MIA', age: 26, tier: 3, adp: 46.0, rank: 23, value: 51, status: 'healthy', projectedPoints: 215 },
  { id: '71', name: 'Amari Cooper', position: 'WR', team: 'BUF', age: 31, tier: 3, adp: 48.0, rank: 24, value: 49, status: 'healthy', projectedPoints: 210 },
  { id: '72', name: 'Keenan Allen', position: 'WR', team: 'CHI', age: 33, tier: 3, adp: 50.0, rank: 25, value: 47, status: 'healthy', projectedPoints: 205 },
  { id: '73', name: 'Terry McLaurin', position: 'WR', team: 'WAS', age: 29, tier: 3, adp: 52.0, rank: 26, value: 45, status: 'healthy', projectedPoints: 200 },
  { id: '74', name: 'Drake London', position: 'WR', team: 'ATL', age: 24, tier: 3, adp: 54.0, rank: 27, value: 43, status: 'healthy', projectedPoints: 195 },
  { id: '75', name: 'Tee Higgins', position: 'WR', team: 'CIN', age: 26, tier: 3, adp: 56.0, rank: 28, value: 41, status: 'healthy', projectedPoints: 190 },

  // Additional players for depth
  { id: '76', name: 'George Pickens', position: 'WR', team: 'PIT', age: 24, tier: 4, adp: 58.0, rank: 29, value: 39, status: 'healthy', projectedPoints: 185 },
  { id: '77', name: 'Christian Watson', position: 'WR', team: 'GB', age: 26, tier: 4, adp: 60.0, rank: 30, value: 37, status: 'healthy', projectedPoints: 180 },
  { id: '78', name: 'Marquise Brown', position: 'WR', team: 'KC', age: 28, tier: 4, adp: 62.0, rank: 31, value: 35, status: 'healthy', projectedPoints: 175 },
  { id: '79', name: 'Diontae Johnson', position: 'WR', team: 'CAR', age: 28, tier: 4, adp: 64.0, rank: 32, value: 33, status: 'healthy', projectedPoints: 170 },
  { id: '80', name: 'Zay Flowers', position: 'WR', team: 'BAL', age: 24, tier: 4, adp: 66.0, rank: 33, value: 31, status: 'healthy', projectedPoints: 165 },

  // Quarterbacks (depth)
  { id: '81', name: 'Kyler Murray', position: 'QB', team: 'ARI', age: 28, tier: 3, adp: 72.0, rank: 13, value: 60, status: 'healthy', projectedPoints: 300 },
  { id: '82', name: 'Jared Goff', position: 'QB', team: 'DET', age: 30, tier: 3, adp: 75.0, rank: 14, value: 58, status: 'healthy', projectedPoints: 295 },
  { id: '83', name: 'Brock Purdy', position: 'QB', team: 'SF', age: 25, tier: 3, adp: 78.0, rank: 15, value: 56, status: 'healthy', projectedPoints: 290 },
  { id: '84', name: 'Caleb Williams', position: 'QB', team: 'CHI', age: 23, tier: 4, adp: 80.0, rank: 16, value: 54, status: 'healthy', projectedPoints: 285 },
  { id: '85', name: 'Kirk Cousins', position: 'QB', team: 'ATL', age: 36, tier: 4, adp: 82.0, rank: 17, value: 52, status: 'healthy', projectedPoints: 280 },
  { id: '86', name: 'Aaron Rodgers', position: 'QB', team: 'NYJ', age: 41, tier: 4, adp: 85.0, rank: 18, value: 50, status: 'healthy', projectedPoints: 275 },
  { id: '87', name: 'Deshaun Watson', position: 'QB', team: 'CLE', age: 29, tier: 4, adp: 88.0, rank: 19, value: 48, status: 'healthy', projectedPoints: 270 },
  { id: '88', name: 'Jayden Daniels', position: 'QB', team: 'WAS', age: 24, tier: 4, adp: 90.0, rank: 20, value: 46, status: 'healthy', projectedPoints: 265 },

  // Kickers
  { id: '89', name: 'Justin Tucker', position: 'K', team: 'BAL', age: 35, tier: 1, adp: 120.0, rank: 1, value: 20, status: 'healthy', projectedPoints: 150 },
  { id: '90', name: 'Harrison Butker', position: 'K', team: 'KC', age: 29, tier: 1, adp: 125.0, rank: 2, value: 18, status: 'healthy', projectedPoints: 145 },
  { id: '91', name: 'Tyler Bass', position: 'K', team: 'BUF', age: 28, tier: 2, adp: 130.0, rank: 3, value: 16, status: 'healthy', projectedPoints: 140 },
  { id: '92', name: 'Jake Moody', position: 'K', team: 'SF', age: 25, tier: 2, adp: 135.0, rank: 4, value: 14, status: 'healthy', projectedPoints: 135 },
  { id: '93', name: 'Brandon Aubrey', position: 'K', team: 'DAL', age: 29, tier: 2, adp: 140.0, rank: 5, value: 12, status: 'healthy', projectedPoints: 130 },

  // Defenses
  { id: '94', name: 'Baltimore Ravens', position: 'DST', team: 'BAL', age: 0, tier: 1, adp: 115.0, rank: 1, value: 22, status: 'healthy', projectedPoints: 160 },
  { id: '95', name: 'San Francisco 49ers', position: 'DST', team: 'SF', age: 0, tier: 1, adp: 118.0, rank: 2, value: 20, status: 'healthy', projectedPoints: 155 },
  { id: '96', name: 'Cleveland Browns', position: 'DST', team: 'CLE', age: 0, tier: 1, adp: 122.0, rank: 3, value: 18, status: 'healthy', projectedPoints: 150 },
  { id: '97', name: 'Dallas Cowboys', position: 'DST', team: 'DAL', age: 0, tier: 2, adp: 128.0, rank: 4, value: 16, status: 'healthy', projectedPoints: 145 },
  { id: '98', name: 'New York Jets', position: 'DST', team: 'NYJ', age: 0, tier: 2, adp: 132.0, rank: 5, value: 14, status: 'healthy', projectedPoints: 140 },

  // More depth players
  { id: '99', name: 'Jonathon Brooks', position: 'RB', team: 'CAR', age: 22, tier: 4, adp: 95.0, rank: 26, value: 42, status: 'healthy', projectedPoints: 180 },
  { id: '100', name: 'Tyjae Spears', position: 'RB', team: 'TEN', age: 24, tier: 4, adp: 98.0, rank: 27, value: 40, status: 'healthy', projectedPoints: 175 }
];

// Helper functions for player queries
export const getPlayersByPosition = (position: string): Player[] => {
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