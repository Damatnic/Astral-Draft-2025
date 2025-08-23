# Astral Draft v4 Testing Guide

Welcome to the comprehensive testing guide for Astral Draft v4. This document covers all aspects of our testing strategy, from unit tests to end-to-end testing and performance testing.

## Table of Contents

- [Overview](#overview)
- [Testing Strategy](#testing-strategy)
- [Getting Started](#getting-started)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Visual Regression Testing](#visual-regression-testing)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Our testing strategy follows the [testing pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) with multiple layers:

```
         /\
        /  \    E2E Tests
       /____\   (Playwright)
      /      \
     /        \  Integration Tests
    /__________\ (Jest + tRPC)
   /            \
  /              \ Unit Tests
 /________________\ (Jest + RTL)
```

- **Unit Tests (80%)**: Fast, isolated tests for individual functions and components
- **Integration Tests (15%)**: Tests for API routes, database operations, and service interactions
- **End-to-End Tests (5%)**: User journey tests with real browsers

## Testing Strategy

### 1. Test Types

| Test Type | Tool | Purpose | Coverage Target |
|-----------|------|---------|-----------------|
| Unit | Jest + React Testing Library | Component logic, utilities, hooks | 80%+ |
| Integration | Jest + tRPC | API routes, database operations | 75%+ |
| E2E | Playwright | User journeys, critical flows | Key paths |
| Performance | k6 | Load testing, performance benchmarks | API endpoints |
| Visual | Playwright | UI consistency, regression detection | Key pages |

### 2. Testing Pyramid Goals

- **Fast Feedback**: Unit tests run in < 30 seconds
- **Reliable**: Tests are deterministic and don't flake
- **Maintainable**: Tests are easy to understand and update
- **Comprehensive**: Critical business logic is well covered

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL (for integration tests)
- Redis (for caching tests)

### Installation

```bash
# Install dependencies
npm install

# Set up test database
npm run test:setup

# Run all tests
npm test
```

### Environment Setup

Create a `.env.test` file:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/astral_draft_test"
REDIS_URL="redis://localhost:6379"
NODE_ENV="test"
NEXTAUTH_SECRET="test-secret"
```

## Unit Testing

### Framework: Jest + React Testing Library

Unit tests focus on testing individual components, hooks, and utility functions in isolation.

### File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── __tests__/
│   │       └── Button.test.tsx
├── hooks/
│   ├── useAuth.ts
│   └── __tests__/
│       └── useAuth.test.ts
└── lib/
    ├── utils.ts
    └── __tests__/
        └── utils.test.ts
```

### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Watch mode
npm run test:unit:watch

# Run specific test file
npm run test:unit Button.test.tsx
```

### Writing Unit Tests

#### Component Testing Example

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})
```

#### Hook Testing Example

```typescript
// useAuth.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../useAuth'

describe('useAuth Hook', () => {
  it('handles login successfully', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      const success = await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(success).toBe(true)
    })

    expect(result.current.isAuthenticated).toBe(true)
  })
})
```

### Test Factories

Use our test factories for consistent test data:

```typescript
import { userFactory, leagueFactory } from '@/test/factories'

describe('User Tests', () => {
  it('creates user with valid data', () => {
    const user = userFactory.build()
    expect(user.email).toMatch(/\S+@\S+\.\S+/)
    expect(user.username).toBeTruthy()
  })

  it('creates admin user', () => {
    const admin = userFactory.admin()
    expect(admin.isAdmin).toBe(true)
  })
})
```

## Integration Testing

### Framework: Jest + tRPC Test Client

Integration tests verify that different parts of the system work together correctly.

### File Structure

```
tests/
└── integration/
    ├── trpc/
    │   ├── auth.integration.test.ts
    │   ├── league.integration.test.ts
    │   └── trade.integration.test.ts
    └── database/
        └── operations.integration.test.ts
```

### Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run with database setup
npm run test:integration:full

# Run specific test suite
npm run test:integration -- auth.integration.test.ts
```

### Writing Integration Tests

```typescript
// auth.integration.test.ts
import { createTestContext, createTestClient } from '../helpers'
import { userFactory } from '@/test/factories'

describe('Auth Integration Tests', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  it('creates and authenticates user', async () => {
    const userData = userFactory.build()
    const client = createTestClient()

    // Create user
    const user = await client.auth.register(userData)
    expect(user.id).toBeTruthy()

    // Authenticate
    const session = await client.auth.login({
      email: userData.email,
      password: userData.password
    })
    expect(session.user.id).toBe(user.id)
  })
})
```

## End-to-End Testing

### Framework: Playwright

E2E tests verify complete user journeys across the entire application.

### File Structure

```
tests/
└── e2e/
    ├── auth.spec.ts
    ├── draft.spec.ts
    ├── leagues.spec.ts
    └── mobile.spec.ts
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run on specific browser
npm run test:e2e -- --project=chromium

# Run mobile tests
npm run test:e2e:mobile

# Run with UI
npm run test:e2e:ui
```

### Writing E2E Tests

```typescript
// auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can register and login', async ({ page }) => {
    // Registration
    await page.goto('/register')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'Password123!')
    await page.click('[data-testid="register-button"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

    // Login
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'Password123!')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL('/dashboard')
  })
})
```

### Page Object Model

Use Page Objects for maintainable E2E tests:

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email)
    await this.page.fill('[data-testid="password"]', password)
    await this.page.click('[data-testid="login-button"]')
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL('/dashboard')
  }
}
```

## Performance Testing

### Framework: k6

Performance tests ensure the application can handle expected load.

### File Structure

```
k6/
├── load-tests.js
├── stress-tests.js
└── spike-tests.js
```

### Running Performance Tests

```bash
# Run load tests
k6 run k6/load-tests.js

# Run with custom configuration
k6 run --vus 100 --duration 5m k6/load-tests.js

# Run stress tests
k6 run k6/stress-tests.js
```

### Writing Performance Tests

```javascript
// load-tests.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export let options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
}

export default function() {
  const response = http.get('http://localhost:3000/api/health')
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  sleep(1)
}
```

## Visual Regression Testing

### Framework: Playwright Visual Testing

Visual tests catch unintended UI changes.

### Running Visual Tests

```bash
# Run visual regression tests
npm run test:visual

# Update visual baselines
npm run test:visual -- --update-snapshots
```

### Writing Visual Tests

```typescript
// visual.spec.ts
import { test, expect } from '@playwright/test'

test('homepage visual consistency', async ({ page }) => {
  await page.goto('/')
  
  // Hide dynamic content
  await page.addStyleTag({
    content: '[data-testid="live-scores"] { visibility: hidden; }'
  })
  
  await expect(page).toHaveScreenshot('homepage.png')
})
```

## Test Coverage

### Coverage Targets

- **Overall**: 80% minimum
- **Critical modules**: 95% (auth, security, payments)
- **Core business logic**: 90% (draft, trade, scoring)
- **UI components**: 80%

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html

# Upload to Codecov (CI only)
codecov
```

### Coverage Configuration

Coverage thresholds are configured in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  './src/server/auth.ts': {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95,
  },
}
```

## CI/CD Integration

### GitHub Actions

Our testing pipeline runs on every push and PR:

1. **Unit Tests**: Fast feedback on code changes
2. **Integration Tests**: Verify API and database operations
3. **E2E Tests**: Test critical user journeys
4. **Performance Tests**: Ensure acceptable performance
5. **Visual Tests**: Catch UI regressions

### Workflow Triggers

- **Push to main/develop**: Full test suite
- **Pull Requests**: Full test suite with diff coverage
- **Nightly**: Extended test suite with performance testing
- **Manual**: Custom test configurations

### Test Reports

- Coverage reports uploaded to Codecov
- E2E test results with screenshots/videos on failure
- Performance test results with trends
- Visual diff reports for UI changes

## Best Practices

### Writing Good Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Test Behavior, Not Implementation**: Focus on what the code does, not how
3. **Use Descriptive Names**: Test names should explain what is being tested
4. **Keep Tests Independent**: Each test should be able to run in isolation
5. **Use Test Data Factories**: Consistent, realistic test data

### Test Organization

1. **Group Related Tests**: Use `describe` blocks for logical grouping
2. **Setup and Teardown**: Use `beforeEach`/`afterEach` for test isolation
3. **Mock External Dependencies**: Use mocks for external APIs and services
4. **Test Edge Cases**: Include error conditions and boundary cases

### Performance

1. **Fast Unit Tests**: Keep unit tests under 30 seconds total
2. **Parallel Execution**: Run tests in parallel when possible
3. **Selective Testing**: Use `--findRelatedTests` for changed files
4. **Efficient Mocking**: Mock heavy dependencies and external services

### Debugging Tests

1. **Use `screen.debug()`**: Inspect rendered component tree
2. **Add `console.log`**: Temporary debugging (remove before commit)
3. **Use `--verbose`**: See detailed test output
4. **Run Single Tests**: Isolate failing tests with `.only`

## Troubleshooting

### Common Issues

#### Tests Timeout

```bash
# Increase timeout for slow tests
jest --testTimeout=10000

# Check for hanging promises
# Use --detectOpenHandles flag
```

#### Database Connection Issues

```bash
# Reset test database
npm run test:db:reset

# Check connection
npm run test:db:ping
```

#### Flaky E2E Tests

```bash
# Run tests multiple times
npm run test:e2e -- --repeat-each=3

# Use explicit waits
await page.waitForSelector('[data-testid="element"]')
```

#### Coverage Issues

```bash
# Clear Jest cache
npx jest --clearCache

# Check ignored files
cat jest.config.js | grep -A 10 collectCoverageFrom
```

### Getting Help

1. **Check Test Output**: Read error messages carefully
2. **Review Documentation**: This guide and framework docs
3. **Ask Team Members**: Use team chat for quick questions
4. **Create Issues**: For bugs or missing features

## Scripts Reference

```bash
# Unit Tests
npm run test:unit              # Run all unit tests
npm run test:unit:watch        # Watch mode
npm run test:unit:coverage     # With coverage

# Integration Tests
npm run test:integration       # Run integration tests
npm run test:integration:full  # With database setup

# E2E Tests
npm run test:e2e              # Run all E2E tests
npm run test:e2e:headed       # With browser UI
npm run test:e2e:mobile       # Mobile tests only

# All Tests
npm test                      # Run all test types
npm run test:coverage         # All tests with coverage
npm run test:ci              # CI test suite

# Utilities
npm run test:setup           # Set up test environment
npm run test:clean           # Clean test artifacts
npm run test:db:reset        # Reset test database
```

---

For more information, see our [Contributing Guidelines](./CONTRIBUTING.md) and [Development Setup](./README.md#development).