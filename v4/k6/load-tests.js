/**
 * K6 Load Testing Suite for Astral Draft v4
 * Comprehensive performance tests for API endpoints and WebSocket connections
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Custom metrics
const authSuccessRate = new Rate('auth_success_rate');
const apiResponseTime = new Trend('api_response_time');
const webSocketConnections = new Counter('websocket_connections');
const draftActions = new Counter('draft_actions');

// Test configuration
export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    auth_success_rate: ['rate>0.95'], // Authentication success rate > 95%
    api_response_time: ['p(95)<1000'], // 95% of API calls under 1s
  },
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test data
const TEST_USERS = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
  { email: 'test3@example.com', password: 'password123' },
];

/**
 * Setup function - runs once before all tests
 */
export function setup() {
  console.log('Setting up load test environment...');
  
  // Create test users if needed
  const setupData = {
    users: [],
    leagues: [],
  };

  // Create test users
  TEST_USERS.forEach((user, index) => {
    const response = http.post(`${API_URL}/auth/register`, JSON.stringify({
      email: user.email,
      password: user.password,
      firstName: `Test${index + 1}`,
      lastName: 'User',
      username: `testuser${index + 1}`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 201 || response.status === 409) { // 409 = already exists
      setupData.users.push(user);
    }
  });

  return setupData;
}

/**
 * Main test function
 */
export default function(data) {
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  group('Authentication Flow', () => {
    // Login
    const loginResponse = http.post(`${API_URL}/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    const loginSuccess = check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'login response has token': (r) => r.json('token') !== undefined,
    });

    authSuccessRate.add(loginSuccess);

    if (loginSuccess) {
      const authToken = loginResponse.json('token');
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };

      // Test authenticated endpoints
      testDashboardEndpoints(headers);
      testLeagueEndpoints(headers);
      testPlayerEndpoints(headers);
      testDraftEndpoints(headers);
      testTradeEndpoints(headers);
    }
  });

  sleep(1);
}

/**
 * Test dashboard-related endpoints
 */
function testDashboardEndpoints(headers) {
  group('Dashboard Endpoints', () => {
    const start = Date.now();
    
    const response = http.get(`${API_URL}/trpc/user.getProfile`, { headers });
    
    apiResponseTime.add(Date.now() - start);
    
    check(response, {
      'profile status is 200': (r) => r.status === 200,
      'profile has user data': (r) => r.json('result.data') !== undefined,
    });

    // Get user statistics
    const statsResponse = http.get(`${API_URL}/trpc/user.getStats`, { headers });
    
    check(statsResponse, {
      'stats status is 200': (r) => r.status === 200,
      'stats has data': (r) => r.json('result.data') !== undefined,
    });
  });
}

/**
 * Test league-related endpoints
 */
function testLeagueEndpoints(headers) {
  group('League Endpoints', () => {
    // Get user's leagues
    const leaguesResponse = http.get(`${API_URL}/trpc/league.getMyLeagues`, { headers });
    
    check(leaguesResponse, {
      'leagues status is 200': (r) => r.status === 200,
      'leagues response is array': (r) => Array.isArray(r.json('result.data')),
    });

    // Get public leagues
    const publicLeaguesResponse = http.get(`${API_URL}/trpc/league.getPublic`, { headers });
    
    check(publicLeaguesResponse, {
      'public leagues status is 200': (r) => r.status === 200,
    });

    // Create a new league (occasionally)
    if (Math.random() < 0.1) { // 10% chance
      const createLeagueResponse = http.post(`${API_URL}/trpc/league.create`, JSON.stringify({
        name: `Load Test League ${Date.now()}`,
        maxTeams: 12,
        scoringSystem: 'PPR',
        draftType: 'SNAKE',
      }), { headers });

      check(createLeagueResponse, {
        'create league status is 200': (r) => r.status === 200 || r.status === 201,
      });
    }
  });
}

/**
 * Test player-related endpoints
 */
function testPlayerEndpoints(headers) {
  group('Player Endpoints', () => {
    // Search players
    const searchResponse = http.get(`${API_URL}/trpc/player.search?input=${encodeURIComponent(JSON.stringify({ query: 'mahomes', position: 'QB' }))}`, { headers });
    
    check(searchResponse, {
      'player search status is 200': (r) => r.status === 200,
      'search returns players': (r) => r.json('result.data.length') > 0,
    });

    // Get player rankings
    const rankingsResponse = http.get(`${API_URL}/trpc/player.getRankings?input=${encodeURIComponent(JSON.stringify({ position: 'QB', scoring: 'PPR' }))}`, { headers });
    
    check(rankingsResponse, {
      'rankings status is 200': (r) => r.status === 200,
    });

    // Get player stats
    const statsResponse = http.get(`${API_URL}/trpc/player.getStats?input=${encodeURIComponent(JSON.stringify({ playerId: 'test-player-id' }))}`, { headers });
    
    check(statsResponse, {
      'player stats request sent': (r) => r.status !== 500, // Allow 404 for non-existent player
    });
  });
}

/**
 * Test draft-related endpoints
 */
function testDraftEndpoints(headers) {
  group('Draft Endpoints', () => {
    // Get draft eligible players
    const playersResponse = http.get(`${API_URL}/trpc/draft.getEligiblePlayers`, { headers });
    
    check(playersResponse, {
      'draft players status is 200': (r) => r.status === 200,
    });

    // Get mock draft suggestions
    const suggestionsResponse = http.get(`${API_URL}/trpc/draft.getMockDraftSuggestions?input=${encodeURIComponent(JSON.stringify({ position: 'QB', round: 1 }))}`, { headers });
    
    check(suggestionsResponse, {
      'draft suggestions status is 200': (r) => r.status === 200,
    });

    draftActions.add(1);
  });
}

/**
 * Test trade-related endpoints
 */
function testTradeEndpoints(headers) {
  group('Trade Endpoints', () => {
    // Get user's trades
    const tradesResponse = http.get(`${API_URL}/trpc/trade.getMyTrades`, { headers });
    
    check(tradesResponse, {
      'trades status is 200': (r) => r.status === 200,
      'trades response is array': (r) => Array.isArray(r.json('result.data')),
    });

    // Get trade analysis (if there are active trades)
    const analysisResponse = http.get(`${API_URL}/trpc/trade.analyzeValue?input=${encodeURIComponent(JSON.stringify({ tradeId: 'test-trade-id' }))}`, { headers });
    
    check(analysisResponse, {
      'trade analysis request sent': (r) => r.status !== 500, // Allow 404 for non-existent trade
    });
  });
}

/**
 * WebSocket Load Test
 */
export function websocketTest() {
  const url = 'ws://localhost:3000/ws/draft';
  
  const response = ws.connect(url, {}, function (socket) {
    webSocketConnections.add(1);
    
    socket.on('open', () => {
      console.log('WebSocket connection opened');
      
      // Join a draft room
      socket.send(JSON.stringify({
        type: 'JOIN_DRAFT',
        data: { draftId: 'test-draft-id', userId: 'test-user-id' }
      }));
    });

    socket.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('Received message:', message.type);
      
      // Simulate user actions based on message type
      if (message.type === 'DRAFT_TURN') {
        // Simulate making a pick
        setTimeout(() => {
          socket.send(JSON.stringify({
            type: 'MAKE_PICK',
            data: { playerId: 'random-player-id' }
          }));
          draftActions.add(1);
        }, Math.random() * 5000); // Random delay 0-5 seconds
      }
    });

    socket.on('close', () => {
      console.log('WebSocket connection closed');
    });

    // Keep connection open for 30 seconds
    sleep(30);
  });

  check(response, {
    'WebSocket status is 101': (r) => r && r.status === 101,
  });
}

/**
 * Stress test scenario - high load with burst traffic
 */
export const stressTest = {
  executor: 'ramping-arrival-rate',
  startRate: 10,
  timeUnit: '1s',
  preAllocatedVUs: 50,
  maxVUs: 200,
  stages: [
    { target: 50, duration: '1m' },
    { target: 100, duration: '2m' },
    { target: 200, duration: '2m' },
    { target: 300, duration: '1m' },
    { target: 0, duration: '1m' },
  ],
  exec: 'stressScenario',
};

export function stressScenario() {
  // Simplified scenario for stress testing
  const response = http.get(`${BASE_URL}/api/health`);
  
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(0.1);
}

/**
 * Spike test scenario - sudden traffic spike
 */
export const spikeTest = {
  executor: 'ramping-arrival-rate',
  startRate: 0,
  timeUnit: '1s',
  preAllocatedVUs: 100,
  maxVUs: 500,
  stages: [
    { target: 0, duration: '1m' },     // Normal traffic
    { target: 500, duration: '10s' },  // Sudden spike
    { target: 0, duration: '1m' },     // Return to normal
  ],
  exec: 'spikeScenario',
};

export function spikeScenario() {
  // Test critical endpoints during spike
  const endpoints = [
    `${BASE_URL}/api/health`,
    `${API_URL}/trpc/league.getPublic`,
    `${API_URL}/trpc/player.search?input=${encodeURIComponent(JSON.stringify({ query: 'test' }))}`,
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(endpoint);
  
  check(response, {
    'spike test response is successful': (r) => r.status >= 200 && r.status < 400,
    'spike test response time acceptable': (r) => r.timings.duration < 2000,
  });

  sleep(0.1);
}

/**
 * Generate HTML report after test completion
 */
export function handleSummary(data) {
  return {
    'load-test-report.html': htmlReport(data),
    'load-test-results.json': JSON.stringify(data),
  };
}

/**
 * Teardown function - runs once after all tests
 */
export function teardown(data) {
  console.log('Cleaning up load test environment...');
  
  // Clean up test data if needed
  // Note: In a real scenario, you might want to clean up test users/leagues
  console.log('Load test completed successfully');
}