/**
 * @fileoverview End-to-end draft room functionality tests
 * Tests real-time draft features, WebSocket connections, and draft flow
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test'

// Test data
const testLeague = {
  id: 'test-league-1',
  name: 'Test Draft League',
  maxTeams: 10,
  draftSettings: {
    type: 'SNAKE',
    rounds: 15,
    pickTimeLimit: 60, // 1 minute for testing
  }
}

// Page Object Model for Draft Room
class DraftRoomPage {
  constructor(private page: Page) {}

  async navigate(leagueId: string = testLeague.id) {
    await this.page.goto(`/draft/${leagueId}/room`)
  }

  async waitForDraftToLoad() {
    await expect(this.page.locator('[data-testid="draft-board"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="draft-timer"]')).toBeVisible()
  }

  async expectCurrentPick(round: number, pick: number, teamName: string) {
    await expect(this.page.locator('[data-testid="current-round"]')).toContainText(`Round ${round}`)
    await expect(this.page.locator('[data-testid="current-pick"]')).toContainText(`Pick ${pick}`)
    await expect(this.page.locator('[data-testid="current-team"]')).toContainText(teamName)
  }

  async searchPlayer(playerName: string) {
    await this.page.fill('[data-testid="player-search"]', playerName)
    await this.page.waitForTimeout(500) // Debounce
  }

  async selectPlayer(playerId: string) {
    await this.page.click(`[data-testid="player-${playerId}"]`)
  }

  async confirmDraftPick() {
    await this.page.click('[data-testid="confirm-pick-button"]')
  }

  async expectPlayerDrafted(playerName: string, teamName: string, round: number, pick: number) {
    const draftedPlayer = this.page.locator(`[data-testid="drafted-player-${round}-${pick}"]`)
    await expect(draftedPlayer).toContainText(playerName)
    await expect(draftedPlayer).toContainText(teamName)
  }

  async expectTimerValue(seconds: number, tolerance: number = 5) {
    const timerText = await this.page.locator('[data-testid="draft-timer"]').textContent()
    const timerSeconds = parseInt(timerText?.replace(/\D/g, '') || '0')
    expect(Math.abs(timerSeconds - seconds)).toBeLessThanOrEqual(tolerance)
  }

  async waitForAutoPick() {
    await expect(this.page.locator('[data-testid="autopick-notification"]')).toBeVisible()
  }

  async toggleAutoDraft() {
    await this.page.click('[data-testid="autodraft-toggle"]')
  }

  async expectMyTurn() {
    await expect(this.page.locator('[data-testid="your-turn-indicator"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="confirm-pick-button"]')).toBeEnabled()
  }

  async expectWaitingForOthers() {
    await expect(this.page.locator('[data-testid="waiting-indicator"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="confirm-pick-button"]')).toBeDisabled()
  }

  async sendChatMessage(message: string) {
    await this.page.fill('[data-testid="chat-input"]', message)
    await this.page.press('[data-testid="chat-input"]', 'Enter')
  }

  async expectChatMessage(username: string, message: string) {
    await expect(
      this.page.locator(`[data-testid="chat-message"]`).filter({ hasText: username })
    ).toContainText(message)
  }

  async viewMyRoster() {
    await this.page.click('[data-testid="my-roster-tab"]')
  }

  async expectPlayerInRoster(playerName: string) {
    await expect(this.page.locator('[data-testid="my-roster"]')).toContainText(playerName)
  }

  async viewDraftBoard() {
    await this.page.click('[data-testid="draft-board-tab"]')
  }

  async expectDraftComplete() {
    await expect(this.page.locator('[data-testid="draft-complete-modal"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="draft-complete-title"]')).toContainText('Draft Complete!')
  }
}

class DraftQueuePage {
  constructor(private page: Page) {}

  async addPlayerToQueue(playerId: string) {
    await this.page.click(`[data-testid="add-to-queue-${playerId}"]`)
  }

  async removePlayerFromQueue(playerId: string) {
    await this.page.click(`[data-testid="remove-from-queue-${playerId}"]`)
  }

  async expectPlayerInQueue(playerName: string, position: number) {
    await expect(
      this.page.locator(`[data-testid="queue-player-${position}"]`)
    ).toContainText(playerName)
  }

  async reorderQueue(fromPosition: number, toPosition: number) {
    const fromLocator = this.page.locator(`[data-testid="queue-player-${fromPosition}"]`)
    const toLocator = this.page.locator(`[data-testid="queue-player-${toPosition}"]`)
    
    await fromLocator.dragTo(toLocator)
  }

  async expectQueueEmpty() {
    await expect(this.page.locator('[data-testid="empty-queue"]')).toBeVisible()
  }
}

test.describe('Draft Room Functionality', () => {
  let draftPage: DraftRoomPage
  let queuePage: DraftQueuePage

  test.beforeEach(async ({ page }) => {
    draftPage = new DraftRoomPage(page)
    queuePage = new DraftQueuePage(page)
    
    // Mock authenticated session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-1',
            username: 'TestUser1',
            email: 'test1@example.com',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })

    // Mock draft data
    await page.route('**/api/trpc/draft.getDraft*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              id: testLeague.id,
              status: 'IN_PROGRESS',
              currentRound: 1,
              currentPick: 1,
              currentTeamId: 'team-1',
              settings: testLeague.draftSettings,
              picks: [],
              teams: Array.from({ length: 10 }, (_, i) => ({
                id: `team-${i + 1}`,
                name: `Team ${i + 1}`,
                userId: `user-${i + 1}`,
                draftPosition: i + 1,
              })),
            }
          }
        })
      })
    })

    // Mock player data
    await page.route('**/api/trpc/player.getDraftEligible*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: Array.from({ length: 100 }, (_, i) => ({
              id: `player-${i + 1}`,
              name: `Player ${i + 1}`,
              position: ['QB', 'RB', 'WR', 'TE', 'K', 'DST'][i % 6],
              team: 'NFL',
              adp: i + 1,
              projectedPoints: 200 - i,
              tier: Math.floor(i / 10) + 1,
            }))
          }
        })
      })
    })
  })

  test.describe('Draft Room Loading and Setup', () => {
    test('should load draft room successfully', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()
      
      // Should display draft board
      await expect(page.locator('[data-testid="draft-board"]')).toBeVisible()
      
      // Should display current pick information
      await draftPage.expectCurrentPick(1, 1, 'Team 1')
      
      // Should display timer
      await expect(page.locator('[data-testid="draft-timer"]')).toBeVisible()
      
      // Should display player search
      await expect(page.locator('[data-testid="player-search"]')).toBeVisible()
    })

    test('should show correct draft order for snake draft', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()
      
      // Round 1 should go 1-10
      await draftPage.expectCurrentPick(1, 1, 'Team 1')
      
      // Mock advancing to round 2
      await page.route('**/api/trpc/draft.getDraft*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              data: {
                currentRound: 2,
                currentPick: 11,
                currentTeamId: 'team-10', // Snake draft reverses order
              }
            }
          })
        })
      })
      
      await page.reload()
      await draftPage.expectCurrentPick(2, 11, 'Team 10') // Should reverse for snake
    })

    test('should handle draft room errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/trpc/draft.getDraft*', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        })
      })

      await draftPage.navigate()
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load draft')
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    })
  })

  test.describe('Real-time WebSocket Communication', () => {
    test('should establish WebSocket connection', async ({ page }) => {
      // Monitor WebSocket connections
      let wsConnected = false
      page.on('websocket', ws => {
        wsConnected = true
        expect(ws.url()).toContain('/api/ws/draft')
      })

      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()
      
      // Wait for WebSocket connection
      await page.waitForTimeout(1000)
      expect(wsConnected).toBe(true)
    })

    test('should receive real-time pick updates', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Mock WebSocket message for new pick
      await page.evaluate(() => {
        const mockWs = {
          send: () => {},
          close: () => {},
          readyState: WebSocket.OPEN,
        }
        
        // Simulate receiving pick update
        const pickEvent = new CustomEvent('draft-pick', {
          detail: {
            playerId: 'player-1',
            playerName: 'Player 1',
            teamName: 'Team 1',
            round: 1,
            pick: 1,
          }
        })
        
        window.dispatchEvent(pickEvent)
      })

      // Should update draft board
      await draftPage.expectPlayerDrafted('Player 1', 'Team 1', 1, 1)
    })

    test('should handle WebSocket disconnections', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Mock WebSocket disconnection
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('ws-disconnect'))
      })

      // Should show connection lost indicator
      await expect(page.locator('[data-testid="connection-lost"]')).toBeVisible()

      // Mock reconnection
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('ws-reconnect'))
      })

      // Should hide connection lost indicator
      await expect(page.locator('[data-testid="connection-lost"]')).not.toBeVisible()
    })
  })

  test.describe('Making Draft Picks', () => {
    test('should make a manual draft pick', async ({ page }) => {
      // Mock it's user's turn
      await page.route('**/api/trpc/draft.getDraft*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              data: {
                currentTeamId: 'team-1', // User's team
                currentRound: 1,
                currentPick: 1,
              }
            }
          })
        })
      })

      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()
      await draftPage.expectMyTurn()

      // Search and select player
      await draftPage.searchPlayer('Player 1')
      await draftPage.selectPlayer('player-1')

      // Mock draft pick API
      await page.route('**/api/trpc/draft.makePick*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              data: {
                success: true,
                pick: {
                  playerId: 'player-1',
                  playerName: 'Player 1',
                  teamName: 'Team 1',
                  round: 1,
                  pick: 1,
                }
              }
            }
          })
        })
      })

      await draftPage.confirmDraftPick()

      // Should add player to roster
      await draftPage.viewMyRoster()
      await draftPage.expectPlayerInRoster('Player 1')
    })

    test('should handle pick timer countdown', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Mock timer at 30 seconds
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('timer-update', {
          detail: { timeRemaining: 30 }
        }))
      })

      await draftPage.expectTimerValue(30)

      // Timer should show warning when low
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('timer-update', {
          detail: { timeRemaining: 10 }
        }))
      })

      await expect(page.locator('[data-testid="draft-timer"]')).toHaveClass(/warning/)
    })

    test('should auto-pick when timer expires', async ({ page }) => {
      // Mock it's user's turn but timer expires
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Mock timer expiration
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('timer-expired', {
          detail: {
            autoPickedPlayer: {
              id: 'player-1',
              name: 'Player 1',
            }
          }
        }))
      })

      await draftPage.waitForAutoPick()
      await draftPage.expectPlayerInRoster('Player 1')
    })

    test('should prevent picking already drafted players', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Mock player already drafted
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('player-drafted', {
          detail: { playerId: 'player-1' }
        }))
      })

      await draftPage.searchPlayer('Player 1')
      
      // Player should be marked as unavailable
      await expect(page.locator('[data-testid="player-player-1"]')).toHaveClass(/drafted/)
      await expect(page.locator('[data-testid="player-player-1"] button')).toBeDisabled()
    })
  })

  test.describe('Draft Queue Management', () => {
    test('should add players to draft queue', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      await queuePage.addPlayerToQueue('player-1')
      await queuePage.expectPlayerInQueue('Player 1', 1)

      await queuePage.addPlayerToQueue('player-2')
      await queuePage.expectPlayerInQueue('Player 2', 2)
    })

    test('should reorder draft queue', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Add players to queue
      await queuePage.addPlayerToQueue('player-1')
      await queuePage.addPlayerToQueue('player-2')

      // Reorder queue
      await queuePage.reorderQueue(2, 1)

      // Player 2 should now be first
      await queuePage.expectPlayerInQueue('Player 2', 1)
      await queuePage.expectPlayerInQueue('Player 1', 2)
    })

    test('should auto-pick from queue when enabled', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Add player to queue and enable auto-draft
      await queuePage.addPlayerToQueue('player-1')
      await draftPage.toggleAutoDraft()

      // Mock it becomes user's turn
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('your-turn'))
      })

      // Should auto-pick from queue
      await page.waitForTimeout(1000)
      await draftPage.expectPlayerInRoster('Player 1')
    })

    test('should remove players from queue', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      await queuePage.addPlayerToQueue('player-1')
      await queuePage.expectPlayerInQueue('Player 1', 1)

      await queuePage.removePlayerFromQueue('player-1')
      await queuePage.expectQueueEmpty()
    })
  })

  test.describe('Draft Chat', () => {
    test('should send and receive chat messages', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      const message = 'Great pick!'
      await draftPage.sendChatMessage(message)

      // Mock receiving the message back
      await page.evaluate((msg) => {
        window.dispatchEvent(new CustomEvent('chat-message', {
          detail: {
            username: 'TestUser1',
            message: msg,
            timestamp: new Date().toISOString(),
          }
        }))
      }, message)

      await draftPage.expectChatMessage('TestUser1', message)
    })

    test('should handle long chat messages appropriately', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      const longMessage = 'A'.repeat(500) // Very long message
      await draftPage.sendChatMessage(longMessage)

      // Message should be truncated or rejected
      const chatInput = page.locator('[data-testid="chat-input"]')
      const inputValue = await chatInput.inputValue()
      expect(inputValue.length).toBeLessThanOrEqual(280) // Twitter-like limit
    })

    test('should moderate inappropriate chat content', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Mock inappropriate content detection
      await page.route('**/api/trpc/draft.sendMessage*', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { message: 'Message contains inappropriate content' }
          })
        })
      })

      await draftPage.sendChatMessage('inappropriate content')

      // Should show error message
      await expect(page.locator('[data-testid="chat-error"]')).toContainText('inappropriate content')
    })
  })

  test.describe('Multi-user Draft Simulation', () => {
    test('should handle multiple users in same draft', async ({ browser }) => {
      // Create multiple browser contexts to simulate different users
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()
      
      const page1 = await context1.newPage()
      const page2 = await context2.newPage()

      const draftPage1 = new DraftRoomPage(page1)
      const draftPage2 = new DraftRoomPage(page2)

      // Mock different users for each context
      await page1.route('**/api/auth/session', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'user-1', username: 'User1', email: 'user1@test.com' }
          })
        })
      })

      await page2.route('**/api/auth/session', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'user-2', username: 'User2', email: 'user2@test.com' }
          })
        })
      })

      // Both users join the same draft
      await Promise.all([
        draftPage1.navigate(),
        draftPage2.navigate()
      ])

      await Promise.all([
        draftPage1.waitForDraftToLoad(),
        draftPage2.waitForDraftToLoad()
      ])

      // Both should see the same draft state
      await Promise.all([
        draftPage1.expectCurrentPick(1, 1, 'Team 1'),
        draftPage2.expectCurrentPick(1, 1, 'Team 1')
      ])

      await context1.close()
      await context2.close()
    })
  })

  test.describe('Draft Completion', () => {
    test('should show draft completion screen', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Mock draft completion
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('draft-complete', {
          detail: {
            totalPicks: 150,
            duration: 7200, // 2 hours
          }
        }))
      })

      await draftPage.expectDraftComplete()
      
      // Should show draft recap options
      await expect(page.locator('[data-testid="view-recap-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="grade-draft-button"]')).toBeVisible()
    })

    test('should navigate to draft recap after completion', async ({ page }) => {
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Mock draft completion
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('draft-complete'))
      })

      await page.click('[data-testid="view-recap-button"]')

      // Should navigate to draft recap page
      await expect(page).toHaveURL(/.*draft.*recap/)
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
      
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Should show mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-draft-tabs"]')).toBeVisible()
      
      // Should be able to switch between tabs
      await page.click('[data-testid="players-tab"]')
      await expect(page.locator('[data-testid="player-search"]')).toBeVisible()
      
      await page.click('[data-testid="my-roster-tab"]')
      await expect(page.locator('[data-testid="my-roster"]')).toBeVisible()
      
      await page.click('[data-testid="draft-board-tab"]')
      await expect(page.locator('[data-testid="draft-board"]')).toBeVisible()
    })

    test('should handle touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await draftPage.navigate()
      await draftPage.waitForDraftToLoad()

      // Should handle touch scroll in player list
      await page.touchscreen.tap(200, 300)
      await page.mouse.wheel(0, 100)
      
      // Should handle touch selection of players
      await page.touchscreen.tap(200, 300) // Tap on player
      await expect(page.locator('[data-testid="player-selected"]')).toBeVisible()
    })
  })
})