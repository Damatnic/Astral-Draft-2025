/**
 * Test League Setup for 2025 Season
 * Creates a league with 10 test users and full NFL rosters
 */

import { Player } from './data/players';

// Test users for the league
export const testUsers = [
  { id: '1', email: 'player1@astral.com', password: 'test123', name: 'The Commissioner', avatar: '👑' },
  { id: '2', email: 'player2@astral.com', password: 'test123', name: 'Dynasty Destroyer', avatar: '🔥' },
  { id: '3', email: 'player3@astral.com', password: 'test123', name: 'Waiver Wire Wizard', avatar: '🧙' },
  { id: '4', email: 'player4@astral.com', password: 'test123', name: 'Trade Shark', avatar: '🦈' },
  { id: '5', email: 'player5@astral.com', password: 'test123', name: 'Injury Prone', avatar: '🏥' },
  { id: '6', email: 'player6@astral.com', password: 'test123', name: 'Sleeper Seeker', avatar: '😴' },
  { id: '7', email: 'player7@astral.com', password: 'test123', name: 'Stats Guru', avatar: '📊' },
  { id: '8', email: 'player8@astral.com', password: 'test123', name: 'Lucky Charm', avatar: '🍀' },
  { id: '9', email: 'player9@astral.com', password: 'test123', name: 'Underdog Hero', avatar: '🐕' },
  { id: '10', email: 'player10@astral.com', password: 'test123', name: 'Trophy Hunter', avatar: '🏆' }
];

// Test league configuration
export const testLeague = {
  id: 'test-2025',
  name: 'Astral Test League 2025',
  season: 2025,
  settings: {
    teams: 10,
    rosterSize: 16,
    scoringType: 'PPR',
    draftType: 'snake',
    playoffTeams: 6,
    tradeDeadline: 10,
    waiverType: 'FAAB',
    waiverBudget: 100,
    positions: {
      QB: 1,
      RB: 2,
      WR: 2,
      TE: 1,
      FLEX: 1,
      K: 1,
      DST: 1,
      BENCH: 7
    }
  },
  teams: testUsers.map((user, index) => ({
    id: user.id,
    name: user.name,
    owner: user.name,
    ownerId: user.id,
    avatar: user.avatar,
    draftPosition: index + 1,
    budget: 200, // For auction drafts
    faabBudget: 100,
    roster: [],
    record: { wins: 0, losses: 0, ties: 0 },
    pointsFor: 0,
    pointsAgainst: 0,
    currentStreak: 0,
    championshipProbability: 10.0
  })),
  currentWeek: 0,
  status: 'PRE_DRAFT',
  draftDate: new Date('2025-08-28T19:00:00Z'),
  commissioner: testUsers[0].id
};

// Initialize test environment
export const initializeTestEnvironment = () => {
  // Store test users in localStorage for development
  if (typeof window !== 'undefined') {
    localStorage.setItem('testUsers', JSON.stringify(testUsers));
    localStorage.setItem('testLeague', JSON.stringify(testLeague));
    localStorage.setItem('currentUser', JSON.stringify(testUsers[0]));
    console.log('✅ Test environment initialized with 10 users and league');
  }
  
  return {
    users: testUsers,
    league: testLeague
  };
};

// Quick login helper for testing
export const quickLogin = (userId: string) => {
  const user = testUsers.find(u => u.id === userId);
  if (user && typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', `test-token-${userId}`);
    return user;
  }
  return null;
};

// Get current test user
export const getCurrentTestUser = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : testUsers[0];
  }
  return testUsers[0];
};

export default {
  testUsers,
  testLeague,
  initializeTestEnvironment,
  quickLogin,
  getCurrentTestUser
};