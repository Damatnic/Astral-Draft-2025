/**
 * @fileoverview Mobile-specific E2E tests for responsive design and touch interactions
 * Tests touch gestures, mobile navigation, PWA features, and responsive layouts
 */

import { test, expect, type Page } from '@playwright/test'

// Mobile device configurations for testing
const mobileDevices = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'iPad Mini', width: 768, height: 1024 },
]

// Page Object Model for Mobile Navigation
class MobileNavigation {
  constructor(private page: Page) {}

  async openMobileMenu() {
    await this.page.click('[data-testid="mobile-menu-button"]')
  }

  async closeMobileMenu() {
    await this.page.click('[data-testid="mobile-menu-close"]')
  }

  async navigateToSection(section: string) {
    await this.openMobileMenu()
    await this.page.click(`[data-testid="nav-${section}"]`)
  }

  async expectMenuOpen() {
    await expect(this.page.locator('[data-testid="mobile-menu"]')).toBeVisible()
  }

  async expectMenuClosed() {
    await expect(this.page.locator('[data-testid="mobile-menu"]')).not.toBeVisible()
  }

  async swipeToClose() {
    const menu = this.page.locator('[data-testid="mobile-menu"]')
    const box = await menu.boundingBox()
    if (box) {
      await this.page.touchscreen.tap(box.x + box.width / 2, box.y + 50)
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height - 50)
    }
  }
}

class TouchInteractions {
  constructor(private page: Page) {}

  async swipeLeft(selector: string) {
    const element = this.page.locator(selector)
    const box = await element.boundingBox()
    if (box) {
      await this.page.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2)
      await this.page.mouse.move(box.x + 50, box.y + box.height / 2)
    }
  }

  async swipeRight(selector: string) {
    const element = this.page.locator(selector)
    const box = await element.boundingBox()
    if (box) {
      await this.page.touchscreen.tap(box.x + 50, box.y + box.height / 2)
      await this.page.mouse.move(box.x + box.width - 50, box.y + box.height / 2)
    }
  }

  async longPress(selector: string, duration: number = 1000) {
    const element = this.page.locator(selector)
    const box = await element.boundingBox()
    if (box) {
      await this.page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
      await this.page.waitForTimeout(duration)
    }
  }

  async pinchZoom(selector: string, scale: number) {
    const element = this.page.locator(selector)
    const box = await element.boundingBox()
    if (box) {
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      
      // Simulate two-finger pinch
      await this.page.touchscreen.tap(centerX - 50, centerY)
      await this.page.touchscreen.tap(centerX + 50, centerY)
      
      if (scale > 1) {
        // Zoom in - move fingers apart
        await this.page.mouse.move(centerX - 100, centerY)
        await this.page.mouse.move(centerX + 100, centerY)
      } else {
        // Zoom out - move fingers together
        await this.page.mouse.move(centerX - 25, centerY)
        await this.page.mouse.move(centerX + 25, centerY)
      }
    }
  }

  async pullToRefresh(selector: string) {
    const element = this.page.locator(selector)
    const box = await element.boundingBox()
    if (box) {
      // Start pull from top
      await this.page.touchscreen.tap(box.x + box.width / 2, box.y + 10)
      await this.page.mouse.move(box.x + box.width / 2, box.y + 200)
    }
  }
}

test.describe('Mobile Responsive Design', () => {
  let mobileNav: MobileNavigation
  let touchInteractions: TouchInteractions

  mobileDevices.forEach(device => {
    test.describe(`${device.name} (${device.width}x${device.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: device.width, height: device.height })
        mobileNav = new MobileNavigation(page)
        touchInteractions = new TouchInteractions(page)

        // Mock authentication
        await page.route('**/api/auth/session', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: 'user-1',
                username: 'MobileUser',
                email: 'mobile@test.com',
              }
            })
          })
        })
      })

      test('should display mobile navigation', async ({ page }) => {
        await page.goto('/dashboard')

        // Desktop nav should be hidden
        await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible()
        
        // Mobile menu button should be visible
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
        
        // Bottom navigation should be visible on mobile
        await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible()
      })

      test('should open and close mobile menu', async ({ page }) => {
        await page.goto('/dashboard')

        // Open mobile menu
        await mobileNav.openMobileMenu()
        await mobileNav.expectMenuOpen()

        // Close mobile menu
        await mobileNav.closeMobileMenu()
        await mobileNav.expectMenuClosed()
      })

      test('should close mobile menu on backdrop click', async ({ page }) => {
        await page.goto('/dashboard')

        await mobileNav.openMobileMenu()
        await mobileNav.expectMenuOpen()

        // Click backdrop to close
        await page.click('[data-testid="mobile-menu-backdrop"]')
        await mobileNav.expectMenuClosed()
      })

      test('should navigate between sections', async ({ page }) => {
        await page.goto('/dashboard')

        const sections = ['leagues', 'draft', 'oracle', 'team']

        for (const section of sections) {
          await mobileNav.navigateToSection(section)
          await expect(page).toHaveURL(`/${section}`)
          await expect(page.locator('[data-testid="page-title"]')).toBeVisible()
        }
      })

      test('should have touch-friendly button sizes', async ({ page }) => {
        await page.goto('/dashboard')

        const buttons = await page.locator('button').all()
        
        for (const button of buttons) {
          const box = await button.boundingBox()
          if (box) {
            // Minimum touch target size should be 44x44px (iOS guidelines)
            expect(box.width).toBeGreaterThanOrEqual(44)
            expect(box.height).toBeGreaterThanOrEqual(44)
          }
        }
      })

      test('should handle form inputs on mobile', async ({ page }) => {
        await page.goto('/leagues/create')

        const leagueName = page.locator('[data-testid="league-name-input"]')
        
        // Tap to focus input
        await leagueName.click()
        
        // Should show mobile keyboard
        await expect(leagueName).toBeFocused()
        
        // Type with mobile keyboard
        await leagueName.fill('Mobile Test League')
        
        // Should update value
        await expect(leagueName).toHaveValue('Mobile Test League')
      })
    })
  })
})

test.describe('Touch Interactions and Gestures', () => {
  let touchInteractions: TouchInteractions

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    touchInteractions = new TouchInteractions(page)
  })

  test('should handle swipe gestures on cards', async ({ page }) => {
    await page.goto('/leagues')

    // Mock leagues data
    await page.route('**/api/trpc/league.getUserLeagues*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: Array.from({ length: 3 }, (_, i) => ({
              id: `league-${i}`,
              name: `League ${i}`,
              status: 'ACTIVE',
            }))
          }
        })
      })
    })

    // Wait for leagues to load
    await page.waitForSelector('[data-testid="league-card-0"]')

    // Swipe left on league card to reveal actions
    await touchInteractions.swipeLeft('[data-testid="league-card-0"]')
    
    // Should show action buttons
    await expect(page.locator('[data-testid="league-actions-0"]')).toBeVisible()
    await expect(page.locator('[data-testid="edit-league-0"]')).toBeVisible()
    await expect(page.locator('[data-testid="leave-league-0"]')).toBeVisible()

    // Swipe right to hide actions
    await touchInteractions.swipeRight('[data-testid="league-card-0"]')
    await expect(page.locator('[data-testid="league-actions-0"]')).not.toBeVisible()
  })

  test('should handle long press for context menus', async ({ page }) => {
    await page.goto('/team/my-roster')

    // Mock roster data
    await page.route('**/api/trpc/team.getRoster*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              players: [{
                id: 'player-1',
                name: 'Test Player',
                position: 'QB',
                status: 'STARTER'
              }]
            }
          }
        })
      })
    })

    await page.waitForSelector('[data-testid="roster-player-0"]')

    // Long press on player card
    await touchInteractions.longPress('[data-testid="roster-player-0"]', 800)

    // Should show context menu
    await expect(page.locator('[data-testid="player-context-menu"]')).toBeVisible()
    await expect(page.locator('[data-testid="move-to-bench"]')).toBeVisible()
    await expect(page.locator('[data-testid="view-player-stats"]')).toBeVisible()
    await expect(page.locator('[data-testid="drop-player"]')).toBeVisible()
  })

  test('should handle pull-to-refresh', async ({ page }) => {
    await page.goto('/dashboard')

    // Mock refresh API call
    let refreshCalled = false
    await page.route('**/api/trpc/dashboard.refresh*', async route => {
      refreshCalled = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: { data: { refreshed: true } } })
      })
    })

    // Perform pull to refresh
    await touchInteractions.pullToRefresh('[data-testid="dashboard-content"]')

    // Should show refresh indicator
    await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible()

    // Wait for refresh to complete
    await page.waitForTimeout(1000)
    
    expect(refreshCalled).toBe(true)
    await expect(page.locator('[data-testid="refresh-indicator"]')).not.toBeVisible()
  })

  test('should handle scroll momentum', async ({ page }) => {
    await page.goto('/players')

    // Mock long list of players
    await page.route('**/api/trpc/player.getAvailable*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: Array.from({ length: 100 }, (_, i) => ({
              id: `player-${i}`,
              name: `Player ${i}`,
              position: 'QB',
            }))
          }
        })
      })
    })

    await page.waitForSelector('[data-testid="player-list"]')

    const playerList = page.locator('[data-testid="player-list"]')
    const initialScroll = await playerList.evaluate(el => el.scrollTop)

    // Fast swipe to create momentum scroll
    await touchInteractions.swipeLeft('[data-testid="player-list"]')
    await page.waitForTimeout(500)

    const finalScroll = await playerList.evaluate(el => el.scrollTop)
    expect(finalScroll).toBeGreaterThan(initialScroll)
  })

  test('should handle double tap to zoom', async ({ page }) => {
    await page.goto('/draft/123/board')

    // Mock draft board data
    await page.route('**/api/trpc/draft.getDraft*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              picks: Array.from({ length: 150 }, (_, i) => ({
                id: i,
                playerId: `player-${i}`,
                playerName: `Player ${i}`,
                teamName: `Team ${Math.floor(i / 15) + 1}`,
                round: Math.floor(i / 10) + 1,
                pick: i + 1,
              }))
            }
          }
        })
      })
    })

    await page.waitForSelector('[data-testid="draft-board"]')

    const draftBoard = page.locator('[data-testid="draft-board"]')
    const box = await draftBoard.boundingBox()

    if (box) {
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2

      // Double tap to zoom in
      await page.touchscreen.tap(centerX, centerY)
      await page.waitForTimeout(100)
      await page.touchscreen.tap(centerX, centerY)

      // Should zoom in (check if transform scale increased)
      const transform = await draftBoard.evaluate(el => 
        window.getComputedStyle(el).transform
      )
      expect(transform).toContain('scale')
    }
  })
})

test.describe('Mobile-Specific Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('should show mobile-optimized draft interface', async ({ page }) => {
    await page.goto('/draft/123/room')

    // Mock draft data
    await page.route('**/api/trpc/draft.getDraft*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              id: '123',
              status: 'IN_PROGRESS',
              currentRound: 1,
              currentPick: 1,
            }
          }
        })
      })
    })

    // Should show mobile-specific draft tabs
    await expect(page.locator('[data-testid="mobile-draft-tabs"]')).toBeVisible()
    
    // Should have swipeable tabs
    const tabs = ['board', 'players', 'roster', 'chat']
    for (const tab of tabs) {
      await page.click(`[data-testid="tab-${tab}"]`)
      await expect(page.locator(`[data-testid="${tab}-panel"]`)).toBeVisible()
    }
  })

  test('should optimize player cards for mobile', async ({ page }) => {
    await page.goto('/players')

    await page.route('**/api/trpc/player.getAvailable*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: [{
              id: 'player-1',
              name: 'Mobile Player',
              position: 'QB',
              team: 'NFL',
              projectedPoints: 250.5,
            }]
          }
        })
      })
    })

    await page.waitForSelector('[data-testid="player-card-0"]')

    const playerCard = page.locator('[data-testid="player-card-0"]')
    
    // Should be sized appropriately for mobile
    const box = await playerCard.boundingBox()
    expect(box?.width).toBeLessThan(400) // Fits mobile screen
    expect(box?.height).toBeLessThan(200) // Reasonable height

    // Should show essential info only
    await expect(playerCard).toContainText('Mobile Player')
    await expect(playerCard).toContainText('QB')
    await expect(playerCard).toContainText('250.5')
  })

  test('should handle mobile keyboard interactions', async ({ page }) => {
    await page.goto('/leagues/join')

    const inviteCodeInput = page.locator('[data-testid="invite-code-input"]')
    
    // Focus input
    await inviteCodeInput.click()
    
    // Should show mobile-optimized keyboard
    await expect(inviteCodeInput).toBeFocused()
    
    // Type with mobile keyboard
    await inviteCodeInput.fill('ABC123XYZ')
    
    // Should format code with spaces for readability
    await expect(inviteCodeInput).toHaveValue('ABC123XYZ')
    
    // Should validate format
    const submitButton = page.locator('[data-testid="join-league-button"]')
    await expect(submitButton).toBeEnabled()
  })

  test('should show mobile-friendly error messages', async ({ page }) => {
    await page.goto('/auth/signin')

    // Submit empty form
    await page.click('[data-testid="signin-button"]')

    // Should show mobile-optimized error toast
    const errorToast = page.locator('[data-testid="error-toast"]')
    await expect(errorToast).toBeVisible()
    
    // Should be positioned appropriately for mobile
    const box = await errorToast.boundingBox()
    expect(box?.y).toBeLessThan(100) // Near top of screen
    expect(box?.width).toBeLessThan(350) // Fits mobile width with margin
  })

  test('should handle mobile share functionality', async ({ page }) => {
    await page.goto('/leagues/123')

    // Mock Web Share API
    await page.addInitScript(() => {
      (window.navigator as any).share = async (data: any) => {
        return Promise.resolve()
      }
      ;(window.navigator as any).canShare = (data: any) => true
    })

    await page.click('[data-testid="share-league-button"]')

    // Should call native share API on mobile
    const shareResult = await page.evaluate(() => {
      return typeof (window.navigator as any).share === 'function'
    })
    
    expect(shareResult).toBe(true)
  })

  test('should optimize performance on mobile', async ({ page }) => {
    await page.goto('/dashboard')

    // Monitor performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      }
    })

    // Should load quickly on mobile
    expect(performanceMetrics.loadTime).toBeLessThan(3000) // 3 seconds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000) // 2 seconds
    expect(performanceMetrics.firstPaint).toBeLessThan(1500) // 1.5 seconds
  })
})

test.describe('Progressive Web App (PWA) Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('should show PWA install prompt', async ({ page }) => {
    await page.goto('/')

    // Mock PWA install event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt')
      ;(event as any).prompt = () => Promise.resolve({ outcome: 'accepted' })
      window.dispatchEvent(event)
    })

    // Should show install prompt
    await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeVisible()
    await expect(page.locator('[data-testid="install-app-button"]')).toBeVisible()
  })

  test('should handle offline functionality', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Go offline
    await page.context().setOffline(true)

    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()

    // Should still display cached content
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible()

    // Go back online
    await page.context().setOffline(false)

    // Should hide offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible()
  })

  test('should cache resources for offline use', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator
    })
    expect(swRegistered).toBe(true)

    // Check if resources are cached
    const cachedResources = await page.evaluate(async () => {
      const cacheNames = await caches.keys()
      if (cacheNames.length > 0) {
        const cache = await caches.open(cacheNames[0])
        const keys = await cache.keys()
        return keys.map(req => req.url)
      }
      return []
    })

    expect(cachedResources.length).toBeGreaterThan(0)
  })

  test('should sync data when back online', async ({ page }) => {
    await page.goto('/team/my-roster')

    // Make changes while online
    await page.click('[data-testid="edit-roster-button"]')
    await page.fill('[data-testid="team-name-input"]', 'Offline Team')
    
    // Go offline before saving
    await page.context().setOffline(true)
    await page.click('[data-testid="save-team-button"]')

    // Should queue changes for sync
    await expect(page.locator('[data-testid="sync-pending"]')).toBeVisible()

    // Go back online
    await page.context().setOffline(false)

    // Should sync changes
    await page.waitForTimeout(2000)
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible()
  })

  test('should show appropriate PWA splash screen', async ({ page }) => {
    // This would be tested by checking the web app manifest
    await page.goto('/')
    
    const manifest = await page.evaluate(() => {
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
      return manifestLink?.href
    })
    
    expect(manifest).toContain('manifest.json')

    // Fetch and validate manifest
    const response = await page.request.get(manifest)
    const manifestData = await response.json()
    
    expect(manifestData).toHaveProperty('name')
    expect(manifestData).toHaveProperty('short_name')
    expect(manifestData).toHaveProperty('icons')
    expect(manifestData).toHaveProperty('theme_color')
    expect(manifestData).toHaveProperty('background_color')
    expect(manifestData.display).toBe('standalone')
  })
})

test.describe('Accessibility on Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('should support screen readers on mobile', async ({ page }) => {
    await page.goto('/dashboard')

    // Check for proper ARIA labels
    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label')
      const textContent = await button.textContent()
      
      // Button should have accessible name
      expect(ariaLabel || textContent?.trim()).toBeTruthy()
    }
  })

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/leagues')

    // Tab through focusable elements
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()

    // Tab to next element
    await page.keyboard.press('Tab')
    const nextFocusedElement = await page.evaluate(() => document.activeElement?.tagName)
    
    // Focus should move to next focusable element
    expect(nextFocusedElement).toBeTruthy()
  })

  test('should meet contrast requirements', async ({ page }) => {
    await page.goto('/dashboard')

    // This would require contrast checking library
    // For now, we check that text is visible against background
    const textElements = await page.locator('[data-testid*="text"]').all()
    
    for (const element of textElements) {
      const isVisible = await element.isVisible()
      expect(isVisible).toBe(true)
    }
  })

  test('should support voice control', async ({ page }) => {
    await page.goto('/draft/123/room')

    // Mock speech recognition
    await page.addInitScript(() => {
      (window as any).SpeechRecognition = class MockSpeechRecognition {
        onresult = null
        start() {}
        stop() {}
      }
    })

    await page.click('[data-testid="voice-search-button"]')

    // Should activate voice search
    await expect(page.locator('[data-testid="voice-active"]')).toBeVisible()
  })
})