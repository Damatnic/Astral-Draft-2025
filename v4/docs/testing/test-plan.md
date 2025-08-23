# Astral Draft V4 Comprehensive Test Plan

## Executive Summary

This document outlines the complete testing strategy for Astral Draft V4, ensuring 80% minimum unit test coverage, 90% coverage for critical modules, comprehensive E2E testing across device matrices, and robust performance and security testing protocols.

## Testing Objectives

### Primary Goals
1. **Quality Assurance**: Ensure bug-free user experience across all features
2. **Performance Validation**: Meet Core Web Vitals and performance targets
3. **Security Verification**: Validate all security measures and threat mitigations
4. **Cross-Platform Compatibility**: Ensure consistent experience across devices and browsers
5. **Regression Prevention**: Prevent introduction of bugs in future releases

### Coverage Targets
- **Unit Tests**: 80% minimum coverage, 90% for critical modules
- **Integration Tests**: 100% coverage for API endpoints
- **E2E Tests**: 100% coverage for critical user journeys
- **Performance Tests**: 100% coverage for Core Web Vitals
- **Security Tests**: 100% coverage for OWASP Top 10

## Test Architecture

### Testing Pyramid Structure
```
              /\
             /  \    E2E Tests (10%)
            /____\   - Critical user journeys
           /      \  - Cross-browser testing
          /        \ - Mobile device testing
         /          \
        /__________\  Integration Tests (20%)
       /            \ - API endpoint testing
      /              \- Database integration
     /                \- Third-party services
    /                  \
   /____________________\ Unit Tests (70%)
  /                      \- Component testing
 /                        \- Function testing
/                          \- Business logic
```

## Unit Testing Strategy

### Framework Configuration
- **Primary Framework**: Jest + React Testing Library
- **Coverage Tool**: Jest with V8 coverage provider
- **Test Environment**: jsdom for DOM testing
- **Mocking**: Jest mocks + MSW for API mocking

### Coverage Requirements

#### Critical Modules (90% Coverage)
```typescript
// Authentication module
'./src/server/auth.ts': {
  branches: 90,
  functions: 90,
  lines: 90,
  statements: 90,
}

// Oracle AI system
'./src/lib/oracle/*.ts': {
  branches: 90,
  functions: 90,
  lines: 90,
  statements: 90,
}

// Payment processing
'./src/lib/payment/*.ts': {
  branches: 90,
  functions: 90,
  lines: 90,
  statements: 90,
}
```

#### Standard Modules (80% Coverage)
```typescript
// League management
'./src/server/api/routers/league.ts': {
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80,
}

// Draft system
'./src/server/api/routers/draft.ts': {
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80,
}
```

### Unit Test Categories

#### 1. Component Tests
```typescript
// Example: Player card component test
describe('PlayerCard', () => {
  it('should display player information correctly', () => {
    const player = createPlayerFixture()
    render(<PlayerCard player={player} />)
    
    expect(screen.getByText(player.name)).toBeInTheDocument()
    expect(screen.getByText(player.position)).toBeInTheDocument()
    expect(screen.getByText(player.team)).toBeInTheDocument()
  })
  
  it('should handle click events', async () => {
    const player = createPlayerFixture()
    const onSelect = jest.fn()
    
    render(<PlayerCard player={player} onSelect={onSelect} />)
    
    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(player.id)
  })
  
  it('should show injury status when player is injured', () => {
    const injuredPlayer = createPlayerFixture({ 
      isInjured: true, 
      injuryStatus: 'QUESTIONABLE' 
    })
    
    render(<PlayerCard player={injuredPlayer} />)
    expect(screen.getByText('Q')).toBeInTheDocument()
  })
})
```

#### 2. Hook Tests
```typescript
// Example: Draft room hook test
describe('useDraftRoom', () => {
  it('should connect to WebSocket on mount', () => {
    const { result } = renderHook(() => useDraftRoom('league-1'))
    
    expect(mockWebSocket).toHaveBeenCalledWith('/api/ws/draft/league-1')
    expect(result.current.connectionStatus).toBe('connecting')
  })
  
  it('should handle draft pick updates', () => {
    const { result } = renderHook(() => useDraftRoom('league-1'))
    
    act(() => {
      mockWebSocket.simulateMessage({
        type: 'PICK_MADE',
        data: { playerId: 'player-1', teamId: 'team-1' }
      })
    })
    
    expect(result.current.picks).toContainEqual(
      expect.objectContaining({ playerId: 'player-1' })
    )
  })
})
```

#### 3. Service Tests
```typescript
// Example: Oracle service test
describe('OracleService', () => {
  it('should generate player predictions', async () => {
    const mockPrediction = createOraclePredictionFixture()
    mockGeminiClient.generatePrediction.mockResolvedValue(mockPrediction)
    
    const result = await oracleService.generatePrediction('player-1', { week: 5 })
    
    expect(result.projectedPoints).toBeDefined()
    expect(result.confidence).toBeGreaterThan(0.5)
    expect(result.factors).toBeDefined()
  })
  
  it('should handle API failures gracefully', async () => {
    mockGeminiClient.generatePrediction.mockRejectedValue(new Error('API Error'))
    
    await expect(
      oracleService.generatePrediction('player-1', { week: 5 })
    ).rejects.toThrow('Failed to generate prediction')
  })
})
```

### Test Utilities and Fixtures

#### Comprehensive Test Fixtures
```typescript
// Player fixtures with realistic data
export const createPlayerFixture = (options = {}) => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  position: faker.helpers.arrayElement(['QB', 'RB', 'WR', 'TE', 'K', 'DST']),
  team: faker.helpers.arrayElement(NFL_TEAMS),
  projectedPoints: faker.number.float({ min: 50, max: 300 }),
  ...options
})

// League fixtures with valid configurations
export const createLeagueFixture = (options = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name() + ' League',
  maxTeams: faker.helpers.arrayElement([8, 10, 12, 14, 16]),
  settings: createDefaultLeagueSettings(),
  ...options
})
```

#### Mock Services
```typescript
// Oracle API client mock
export const mockOracleClient = {
  generatePrediction: jest.fn(),
  analyzePlayer: jest.fn(),
  getInsights: jest.fn(),
}

// Database mock with realistic responses
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  // ... other models
}
```

## Integration Testing Strategy

### API Endpoint Testing
```typescript
// Example: League API integration tests
describe('/api/leagues', () => {
  beforeEach(async () => {
    await testDb.setup()
    await seedTestData()
  })
  
  afterEach(async () => {
    await testDb.cleanup()
  })
  
  describe('POST /api/leagues', () => {
    it('should create a new league', async () => {
      const leagueData = createValidLeagueData()
      
      const response = await request(app)
        .post('/api/leagues')
        .send(leagueData)
        .expect(201)
      
      expect(response.body.league.name).toBe(leagueData.name)
      expect(response.body.league.inviteCode).toHaveLength(8)
    })
    
    it('should validate league data', async () => {
      const invalidData = { name: '' } // Missing required fields
      
      const response = await request(app)
        .post('/api/leagues')
        .send(invalidData)
        .expect(400)
      
      expect(response.body.errors).toBeDefined()
    })
    
    it('should require authentication', async () => {
      const leagueData = createValidLeagueData()
      
      await request(app)
        .post('/api/leagues')
        .send(leagueData)
        .expect(401)
    })
  })
})
```

### Database Integration Tests
```typescript
// Example: Database constraint tests
describe('Database Constraints', () => {
  it('should enforce unique email constraint', async () => {
    const user1 = await createUser({ email: 'test@example.com' })
    
    await expect(
      createUser({ email: 'test@example.com' })
    ).rejects.toThrow('Unique constraint violation')
  })
  
  it('should cascade delete related records', async () => {
    const league = await createLeague()
    const team = await createTeam({ leagueId: league.id })
    
    await deleteLeague(league.id)
    
    const foundTeam = await findTeam(team.id)
    expect(foundTeam).toBeNull()
  })
})
```

## End-to-End Testing Strategy

### Device and Browser Matrix
```typescript
// Playwright configuration for comprehensive testing
const testMatrix = [
  { name: 'Desktop Chrome', ...devices['Desktop Chrome'] },
  { name: 'Desktop Firefox', ...devices['Desktop Firefox'] },
  { name: 'Desktop Safari', ...devices['Desktop Safari'] },
  { name: 'iPhone 12', ...devices['iPhone 12'] },
  { name: 'Samsung Galaxy S21', ...devices['Pixel 5'] },
  { name: 'iPad Pro', ...devices['iPad Pro'] },
]
```

### Critical User Journeys

#### 1. Authentication Flow
```typescript
test('complete authentication flow', async ({ page }) => {
  // Sign up
  await page.goto('/auth/signup')
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'TestPassword123!')
  await page.click('[data-testid="signup-button"]')
  await expect(page).toHaveURL('/auth/verify')
  
  // Sign in
  await page.goto('/auth/signin')
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'TestPassword123!')
  await page.click('[data-testid="signin-button"]')
  await expect(page).toHaveURL('/dashboard')
  
  // Sign out
  await page.click('[data-testid="user-menu"]')
  await page.click('[data-testid="signout-button"]')
  await expect(page).toHaveURL('/auth/signin')
})
```

#### 2. Draft Room Functionality
```typescript
test('complete draft room flow', async ({ page, context }) => {
  // Create multiple browser contexts for multi-user testing
  const page2 = await context.newPage()
  
  // User 1 joins draft
  await page.goto('/draft/test-league/room')
  await expect(page.locator('[data-testid="draft-board"]')).toBeVisible()
  
  // User 2 joins draft
  await page2.goto('/draft/test-league/room')
  await expect(page2.locator('[data-testid="draft-board"]')).toBeVisible()
  
  // User 1 makes pick
  await page.click('[data-testid="player-1"]')
  await page.click('[data-testid="confirm-pick"]')
  
  // Verify pick appears for both users
  await expect(page.locator('[data-testid="pick-1"]')).toBeVisible()
  await expect(page2.locator('[data-testid="pick-1"]')).toBeVisible()
})
```

#### 3. Mobile Responsive Testing
```typescript
test('mobile navigation and functionality', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  
  await page.goto('/dashboard')
  
  // Test mobile menu
  await page.click('[data-testid="mobile-menu-button"]')
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
  
  // Test swipe gestures
  await page.touchscreen.tap(200, 300)
  await page.mouse.move(50, 300)
  
  // Test touch targets (minimum 44px)
  const buttons = await page.locator('button').all()
  for (const button of buttons) {
    const box = await button.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(44)
    expect(box?.height).toBeGreaterThanOrEqual(44)
  }
})
```

### Visual Regression Testing
```typescript
// Visual comparison testing
test('visual regression - dashboard', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  
  // Take screenshot and compare
  await expect(page).toHaveScreenshot('dashboard-desktop.png')
})

test('visual regression - mobile dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  
  await expect(page).toHaveScreenshot('dashboard-mobile.png')
})
```

## Performance Testing

### Core Web Vitals Testing
```typescript
// Lighthouse CI integration
test('Core Web Vitals - Dashboard', async ({ page }) => {
  await page.goto('/dashboard')
  
  // Measure Core Web Vitals
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        resolve(entries.map(entry => ({
          name: entry.name,
          value: entry.value,
          startTime: entry.startTime
        })))
      }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] })
    })
  })
  
  // Validate performance targets
  const fcp = metrics.find(m => m.name === 'first-contentful-paint')
  expect(fcp?.startTime).toBeLessThan(2500)
})
```

### Load Testing
```typescript
// API load testing with k6
import http from 'k6/http'
import { check, sleep } from 'k6'

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
}

export default function () {
  const response = http.get('https://api.astraldraft.com/leagues')
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  sleep(1)
}
```

## Security Testing

### OWASP Top 10 Testing
```typescript
// SQL injection testing
test('SQL injection prevention', async ({ page }) => {
  const maliciousPayload = "'; DROP TABLE users; --"
  
  await page.goto('/search')
  await page.fill('[data-testid="search-input"]', maliciousPayload)
  await page.click('[data-testid="search-button"]')
  
  // Should sanitize input and not cause errors
  await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
})

// XSS prevention testing
test('XSS prevention', async ({ page }) => {
  const xssPayload = '<script>alert("XSS")</script>'
  
  await page.goto('/profile/edit')
  await page.fill('[data-testid="bio-input"]', xssPayload)
  await page.click('[data-testid="save-button"]')
  
  // Check that script is not executed
  const bioContent = await page.locator('[data-testid="bio-display"]').textContent()
  expect(bioContent).not.toContain('<script>')
})
```

### Authentication Security Testing
```typescript
// Rate limiting tests
test('rate limiting on auth endpoints', async ({ page }) => {
  const promises = []
  
  // Make multiple concurrent requests
  for (let i = 0; i < 10; i++) {
    promises.push(
      page.request.post('/api/auth/signin', {
        data: { email: 'test@example.com', password: 'wrong' }
      })
    )
  }
  
  const responses = await Promise.all(promises)
  const rateLimited = responses.filter(r => r.status() === 429)
  
  expect(rateLimited.length).toBeGreaterThan(0)
})
```

## Accessibility Testing

### WCAG Compliance Testing
```typescript
// Automated accessibility testing
import { injectAxe, checkA11y } from 'axe-playwright'

test('accessibility compliance', async ({ page }) => {
  await page.goto('/dashboard')
  await injectAxe(page)
  
  await checkA11y(page, null, {
    rules: {
      'color-contrast': { enabled: true },
      'heading-order': { enabled: true },
      'keyboard-navigation': { enabled: true },
    }
  })
})

// Keyboard navigation testing
test('keyboard navigation', async ({ page }) => {
  await page.goto('/leagues')
  
  // Tab through all focusable elements
  let focusedElement = await page.evaluate(() => document.activeElement?.tagName)
  
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab')
    const newFocusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(newFocusedElement).toBeTruthy()
  }
})
```

## Test Automation and CI/CD

### GitHub Actions Integration
```yaml
name: Comprehensive Testing
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install
      - name: Run E2E tests
        run: npm run test:e2e:${{ matrix.browser }}

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build application
        run: npm run build
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

### Test Reporting and Metrics

#### Coverage Reporting
```json
{
  "jest": {
    "coverageReporters": ["text", "lcov", "html", "json"],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

#### Test Metrics Dashboard
```typescript
// Test metrics collection
const testMetrics = {
  unitTests: {
    total: 450,
    passed: 448,
    failed: 2,
    coverage: 82.5,
    duration: '2m 30s'
  },
  e2eTests: {
    total: 75,
    passed: 74,
    failed: 1,
    duration: '8m 15s'
  },
  performance: {
    lighthouse: 98,
    coreWebVitals: 'passing',
    loadTime: '1.2s'
  }
}
```

## Test Maintenance and Quality

### Test Code Quality Standards
1. **DRY Principle**: Reuse test utilities and fixtures
2. **Clear Naming**: Descriptive test names explaining behavior
3. **Isolated Tests**: Each test independent and repeatable
4. **Fast Execution**: Unit tests under 100ms, E2E tests under 30s
5. **Stable Tests**: Minimal flakiness, reliable assertions

### Test Review Checklist
- [ ] Test covers the happy path
- [ ] Test covers error conditions
- [ ] Test covers edge cases
- [ ] Test is isolated and repeatable
- [ ] Test has clear assertions
- [ ] Test follows naming conventions
- [ ] Test uses appropriate fixtures
- [ ] Test runs within time limits

### Continuous Improvement
- **Weekly**: Review test failures and flakiness
- **Monthly**: Analyze test coverage and gaps
- **Quarterly**: Review and update test strategy
- **Annually**: Complete test architecture evaluation

---

**Document Version**: 1.0  
**Last Updated**: 2024-08-20  
**Next Review**: 2024-11-20  
**Test Target Review**: Weekly