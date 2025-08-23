/**
 * Critical User Journeys E2E Tests
 * Tests for the most important user flows in Astral Draft
 */

import { test, expect } from '@playwright/test'
import type { Page, BrowserContext } from '@playwright/test'
import { userFactory, leagueFactory } from '../../src/test/factories'

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

// Test data
const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'Password123!',
  username: 'e2etest',
  firstName: 'E2E',
  lastName: 'Test',
}

const LEAGUE_DATA = {
  name: 'E2E Test League',
  maxTeams: 10,
  scoringSystem: 'PPR',
  draftType: 'SNAKE',
}

// Helper functions
async function registerUser(page: Page, userData = TEST_USER) {
  await page.goto(`${BASE_URL}/register`)
  
  await page.fill('[data-testid="firstName"]', userData.firstName)
  await page.fill('[data-testid="lastName"]', userData.lastName)
  await page.fill('[data-testid="username"]', userData.username)
  await page.fill('[data-testid="email"]', userData.email)
  await page.fill('[data-testid="password"]', userData.password)
  await page.fill('[data-testid="confirmPassword"]', userData.password)
  
  await page.click('[data-testid="register-button"]')
  
  // Wait for success message or redirect
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
}

async function loginUser(page: Page, userData = TEST_USER) {
  await page.goto(`${BASE_URL}/login`)
  
  await page.fill('[data-testid="email"]', userData.email)
  await page.fill('[data-testid="password"]', userData.password)
  
  await page.click('[data-testid="login-button"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL(`${BASE_URL}/dashboard`)
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
}

async function createLeague(page: Page, leagueData = LEAGUE_DATA) {
  await page.goto(`${BASE_URL}/leagues/create`)
  
  await page.fill('[data-testid="league-name"]', leagueData.name)
  await page.selectOption('[data-testid="max-teams"]', leagueData.maxTeams.toString())
  await page.selectOption('[data-testid="scoring-system"]', leagueData.scoringSystem)
  await page.selectOption('[data-testid="draft-type"]', leagueData.draftType)
  
  await page.click('[data-testid="create-league-button"]')
  
  // Wait for league creation success
  await expect(page.locator('[data-testid="league-created-message"]')).toBeVisible()
  
  // Get the league ID from the URL
  await page.waitForURL(/\/leagues\/[a-zA-Z0-9]+/)
  const url = page.url()
  const leagueId = url.split('/leagues/')[1]
  
  return leagueId
}

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Set up clean state for each test
    await page.goto(BASE_URL)
  })

  test.describe('User Registration and Authentication Flow', () => {
    test('complete user registration flow', async ({ page }) => {
      // Test user registration
      await registerUser(page)
      
      // Verify user is redirected to email verification page
      await expect(page.locator('[data-testid="verify-email-message"]')).toBeVisible()
      await expect(page.locator('text=Check your email')).toBeVisible()
      
      // Test resend verification email
      await page.click('[data-testid="resend-verification"]')
      await expect(page.locator('[data-testid="resend-success"]')).toBeVisible()
    })

    test('user login and logout flow', async ({ page }) => {
      // Assume user is already registered (setup would handle this)
      await loginUser(page)
      
      // Verify dashboard is loaded
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="user-stats"]')).toBeVisible()
      
      // Test logout
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="logout-button"]')
      
      // Verify redirected to home page
      await page.waitForURL(BASE_URL)
      await expect(page.locator('[data-testid="login-link"]')).toBeVisible()
    })

    test('password reset flow', async ({ page }) => {
      await page.goto(`${BASE_URL}/forgot-password`)
      
      await page.fill('[data-testid="email"]', TEST_USER.email)
      await page.click('[data-testid="reset-password-button"]')
      
      // Verify success message
      await expect(page.locator('[data-testid="reset-email-sent"]')).toBeVisible()
      
      // Test with invalid email
      await page.fill('[data-testid="email"]', 'nonexistent@example.com')
      await page.click('[data-testid="reset-password-button"]')
      
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    })
  })

  test.describe('League Management Flow', () => {
    test('create and configure league', async ({ page }) => {
      await loginUser(page)
      
      const leagueId = await createLeague(page)
      
      // Verify league settings page
      await expect(page.locator('[data-testid="league-settings"]')).toBeVisible()
      await expect(page.locator(`text=${LEAGUE_DATA.name}`)).toBeVisible()
      
      // Test updating league settings
      await page.click('[data-testid="edit-league-button"]')
      await page.fill('[data-testid="league-description"]', 'Updated description')
      await page.click('[data-testid="save-settings-button"]')
      
      await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible()
    })

    test('join public league', async ({ page }) => {
      await loginUser(page)
      
      // Navigate to public leagues
      await page.goto(`${BASE_URL}/leagues`)
      await page.click('[data-testid="public-leagues-tab"]')
      
      // Find and join a league
      const firstLeague = page.locator('[data-testid="league-card"]').first()
      await expect(firstLeague).toBeVisible()
      
      await firstLeague.locator('[data-testid="join-league-button"]').click()
      
      // Verify team creation modal
      await expect(page.locator('[data-testid="team-name-input"]')).toBeVisible()
      
      await page.fill('[data-testid="team-name-input"]', 'My Fantasy Team')
      await page.click('[data-testid="create-team-button"]')
      
      // Verify team was created and user is in league
      await expect(page.locator('[data-testid="team-created-success"]')).toBeVisible()
    })

    test('invite members to league', async ({ page }) => {
      await loginUser(page)
      const leagueId = await createLeague(page)
      
      // Navigate to league member management
      await page.click('[data-testid="manage-members-button"]')
      
      // Send invite by email
      await page.fill('[data-testid="invite-email"]', 'friend@example.com')
      await page.click('[data-testid="send-invite-button"]')
      
      await expect(page.locator('[data-testid="invite-sent"]')).toBeVisible()
      
      // Copy invite link
      await page.click('[data-testid="copy-invite-link"]')
      await expect(page.locator('[data-testid="link-copied"]')).toBeVisible()
      
      // Verify invite appears in pending list
      await expect(page.locator('[data-testid="pending-invite"]')).toBeVisible()
      await expect(page.locator('text=friend@example.com')).toBeVisible()
    })
  })

  test.describe('Draft Experience Flow', () => {
    test('complete snake draft simulation', async ({ page, context }) => {
      await loginUser(page)
      
      // Navigate to mock draft
      await page.goto(`${BASE_URL}/draft/mock`)
      
      // Configure mock draft
      await page.selectOption('[data-testid="draft-position"]', '3')
      await page.selectOption('[data-testid="league-size"]', '12')
      await page.selectOption('[data-testid="scoring-format"]', 'PPR')
      
      await page.click('[data-testid="start-mock-draft"]')
      
      // Wait for draft room to load
      await expect(page.locator('[data-testid="draft-board"]')).toBeVisible()
      await expect(page.locator('[data-testid="available-players"]')).toBeVisible()
      
      // Make first pick when it's user's turn
      await page.waitForSelector('[data-testid="your-turn-indicator"]', { timeout: 30000 })
      
      const firstPlayer = page.locator('[data-testid="player-card"]').first()
      await firstPlayer.click()
      await page.click('[data-testid="draft-player-button"]')
      
      // Verify pick was made
      await expect(page.locator('[data-testid="pick-confirmation"]')).toBeVisible()
      await expect(page.locator('[data-testid="my-team"] [data-testid="player-card"]')).toHaveCount(1)
      
      // Continue with a few more picks to test flow
      for (let i = 0; i < 3; i++) {
        await page.waitForSelector('[data-testid="your-turn-indicator"]', { timeout: 60000 })
        
        const nextPlayer = page.locator('[data-testid="player-card"]').first()
        await nextPlayer.click()
        await page.click('[data-testid="draft-player-button"]')
        
        await expect(page.locator('[data-testid="my-team"] [data-testid="player-card"]')).toHaveCount(i + 2)
      }
    })

    test('draft room real-time features', async ({ page, context }) => {
      // This test would require WebSocket connection testing
      await loginUser(page)
      
      // Join live draft room
      await page.goto(`${BASE_URL}/draft/live/test-draft-id`)
      
      // Verify real-time elements load
      await expect(page.locator('[data-testid="draft-timer"]')).toBeVisible()
      await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()
      await expect(page.locator('[data-testid="live-updates"]')).toBeVisible()
      
      // Test chat functionality
      await page.fill('[data-testid="chat-input"]', 'Good luck everyone!')
      await page.press('[data-testid="chat-input"]', 'Enter')
      
      await expect(page.locator('[data-testid="chat-message"]').last()).toContainText('Good luck everyone!')
      
      // Test draft queue management
      await page.click('[data-testid="add-to-queue"]')
      const firstPlayer = page.locator('[data-testid="player-card"]').first()
      await firstPlayer.click()
      
      await expect(page.locator('[data-testid="draft-queue"] [data-testid="player-card"]')).toHaveCount(1)
    })
  })

  test.describe('Trade and Waiver Management', () => {
    test('propose and negotiate trade', async ({ page }) => {
      await loginUser(page)
      
      // Navigate to trades page
      await page.goto(`${BASE_URL}/trades`)
      
      // Start new trade proposal
      await page.click('[data-testid="propose-trade-button"]')
      
      // Select trade partner
      await page.selectOption('[data-testid="trade-partner"]', 'team-2')
      
      // Add players to trade
      const myPlayer = page.locator('[data-testid="my-players"] [data-testid="player-card"]').first()
      await myPlayer.click()
      await page.click('[data-testid="add-to-trade-offer"]')
      
      const theirPlayer = page.locator('[data-testid="their-players"] [data-testid="player-card"]').first()
      await theirPlayer.click()
      await page.click('[data-testid="add-to-trade-request"]')
      
      // Add trade note
      await page.fill('[data-testid="trade-note"]', 'This trade helps both our teams!')
      
      // Submit trade proposal
      await page.click('[data-testid="submit-trade-button"]')
      
      // Verify trade was proposed
      await expect(page.locator('[data-testid="trade-proposed-success"]')).toBeVisible()
      
      // Check trade appears in pending trades
      await expect(page.locator('[data-testid="pending-trades"] [data-testid="trade-card"]')).toHaveCount(1)
    })

    test('waiver wire claims', async ({ page }) => {
      await loginUser(page)
      
      // Navigate to waivers
      await page.goto(`${BASE_URL}/waivers`)
      
      // Verify waiver wire loads
      await expect(page.locator('[data-testid="available-players"]')).toBeVisible()
      await expect(page.locator('[data-testid="waiver-claims"]')).toBeVisible()
      
      // Add waiver claim
      const firstAvailablePlayer = page.locator('[data-testid="available-players"] [data-testid="player-card"]').first()
      await firstAvailablePlayer.click()
      
      await page.click('[data-testid="add-waiver-claim"]')
      
      // Select player to drop
      await page.selectOption('[data-testid="drop-player"]', 'bench-player-1')
      
      // Set waiver priority
      await page.fill('[data-testid="waiver-priority"]', '1')
      
      await page.click('[data-testid="submit-waiver-claim"]')
      
      // Verify claim was added
      await expect(page.locator('[data-testid="waiver-claims"] [data-testid="claim-card"]')).toHaveCount(1)
    })
  })

  test.describe('Mobile Responsive Experience', () => {
    test('mobile navigation and core features', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await loginUser(page)
      
      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-button"]')
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
      
      // Navigate to different sections via mobile menu
      await page.click('[data-testid="mobile-nav-leagues"]')
      await page.waitForURL(/\/leagues/)
      await expect(page.locator('[data-testid="leagues-page"]')).toBeVisible()
      
      // Test mobile draft experience
      await page.goto(`${BASE_URL}/draft/mock`)
      
      // Verify mobile-optimized draft interface
      await expect(page.locator('[data-testid="mobile-draft-board"]')).toBeVisible()
      await expect(page.locator('[data-testid="mobile-player-list"]')).toBeVisible()
      
      // Test mobile player search
      await page.fill('[data-testid="mobile-player-search"]', 'mahomes')
      await page.press('[data-testid="mobile-player-search"]', 'Enter')
      
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    })

    test('tablet experience', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await loginUser(page)
      
      // Test tablet layout adaptations
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
      
      // Test split-screen features on tablet
      await page.goto(`${BASE_URL}/draft/mock`)
      
      await expect(page.locator('[data-testid="draft-board"]')).toBeVisible()
      await expect(page.locator('[data-testid="player-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="my-team-panel"]')).toBeVisible()
    })
  })

  test.describe('Performance and Accessibility', () => {
    test('page load performance', async ({ page }) => {
      // Start performance monitoring
      await page.goto(BASE_URL)
      
      // Test critical page load times
      const startTime = Date.now()
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Assert reasonable load time (under 3 seconds)
      expect(loadTime).toBeLessThan(3000)
      
      // Test subsequent navigation performance
      await loginUser(page)
      
      const navigationStart = Date.now()
      await page.goto(`${BASE_URL}/leagues`)
      await page.waitForLoadState('networkidle')
      const navigationTime = Date.now() - navigationStart
      
      // Subsequent navigations should be faster
      expect(navigationTime).toBeLessThan(2000)
    })

    test('accessibility compliance', async ({ page }) => {
      await page.goto(BASE_URL)
      
      // Test keyboard navigation
      await page.keyboard.press('Tab')
      const focusedElement = await page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // Test skip links
      await page.keyboard.press('Tab')
      const skipLink = page.locator('[data-testid="skip-to-content"]')
      if (await skipLink.isVisible()) {
        await skipLink.click()
        const mainContent = page.locator('main')
        await expect(mainContent).toBeFocused()
      }
      
      // Test form accessibility
      await page.goto(`${BASE_URL}/register`)
      
      // Verify labels are associated with inputs
      const emailInput = page.locator('#email')
      const emailLabel = page.locator('label[for="email"]')
      await expect(emailLabel).toBeVisible()
      await expect(emailInput).toHaveAttribute('aria-labelledby')
      
      // Test error message accessibility
      await page.click('[data-testid="register-button"]') // Submit empty form
      
      const errorMessage = page.locator('[role="alert"]').first()
      await expect(errorMessage).toBeVisible()
    })
  })
})

test.describe('Visual Regression Tests', () => {
  test('homepage visual consistency', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Hide dynamic content for consistent screenshots
    await page.addStyleTag({
      content: `
        [data-testid="live-scores"],
        [data-testid="recent-activity"] { 
          visibility: hidden; 
        }
      `
    })
    
    await expect(page).toHaveScreenshot('homepage.png')
  })

  test('login page visual consistency', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    
    await expect(page).toHaveScreenshot('login-page.png')
  })

  test('dashboard visual consistency', async ({ page }) => {
    await loginUser(page)
    await page.waitForLoadState('networkidle')
    
    // Hide dynamic timestamps and scores
    await page.addStyleTag({
      content: `
        [data-testid="last-updated"],
        [data-testid="live-scores"] { 
          visibility: hidden; 
        }
      `
    })
    
    await expect(page).toHaveScreenshot('dashboard.png')
  })

  test('mobile homepage visual consistency', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    await expect(page).toHaveScreenshot('mobile-homepage.png')
  })
})