/**
 * Complete User Journey E2E Tests (Phase 11.1)
 * Tests the entire user experience from signup to championship
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Complete User Journey', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable request/response logging for debugging
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('API Request:', request.method(), request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') && !response.ok()) {
        console.log('API Error:', response.status(), response.url());
      }
    });
  });

  test('Complete Fantasy Football Season Journey', async () => {
    // 1. USER REGISTRATION & ONBOARDING
    await test.step('User Registration', async () => {
      await page.goto('/register');
      
      await page.fill('[data-testid="email-input"]', 'testuser@astraldraft.com');
      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
      
      await page.click('[data-testid="register-button"]');
      
      // Should redirect to email verification
      await expect(page).toHaveURL(/\/verify-email/);
      
      // Simulate email verification (in real test, would check email)
      await page.goto('/login');
    });

    await test.step('User Login', async () => {
      await page.fill('[data-testid="email-input"]', 'testuser@astraldraft.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');
      
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    // 2. LEAGUE CREATION & MANAGEMENT
    await test.step('Create League', async () => {
      await page.click('[data-testid="create-league-button"]');
      
      await page.fill('[data-testid="league-name-input"]', 'Test Championship League');
      await page.selectOption('[data-testid="team-count-select"]', '12');
      await page.selectOption('[data-testid="scoring-format-select"]', 'PPR');
      await page.selectOption('[data-testid="draft-type-select"]', 'SNAKE');
      
      await page.click('[data-testid="create-league-submit"]');
      
      await expect(page).toHaveURL(/\/leagues\/[^\/]+$/);
      await expect(page.locator('[data-testid="league-name"]')).toContainText('Test Championship League');
    });

    await test.step('Invite League Members', async () => {
      await page.click('[data-testid="manage-league-button"]');
      await page.click('[data-testid="invite-members-tab"]');
      
      // Add multiple test users
      for (let i = 1; i <= 11; i++) {
        await page.fill('[data-testid="invite-email-input"]', `user${i}@test.com`);
        await page.click('[data-testid="send-invite-button"]');
        await expect(page.locator(`[data-testid="invite-${i}"]`)).toBeVisible();
      }
    });

    // 3. DRAFT EXPERIENCE
    await test.step('Schedule and Start Draft', async () => {
      await page.click('[data-testid="draft-tab"]');
      await page.click('[data-testid="schedule-draft-button"]');
      
      // Set draft for immediate start (test purposes)
      await page.click('[data-testid="start-now-button"]');
      await page.click('[data-testid="confirm-draft-start"]');
      
      await expect(page).toHaveURL(/\/draft\/[^\/]+\/room/);
      await expect(page.locator('[data-testid="draft-board"]')).toBeVisible();
    });

    await test.step('Complete Draft Process', async () => {
      // Wait for draft room to load
      await expect(page.locator('[data-testid="current-pick"]')).toBeVisible();
      
      // Simulate draft picks (automated for test speed)
      for (let round = 1; round <= 16; round++) {
        for (let pick = 1; pick <= 12; pick++) {
          // If it's our turn
          const isOurTurn = await page.locator('[data-testid="your-turn-indicator"]').isVisible();
          
          if (isOurTurn) {
            // Select best available player
            await page.click('[data-testid="player-search"]');
            await page.fill('[data-testid="player-search"]', '');
            await page.click('[data-testid="best-available"] [data-testid="draft-player-button"]');
            
            // Confirm pick
            await page.click('[data-testid="confirm-pick-button"]');
          }
          
          // Wait for pick to complete
          await page.waitForSelector('[data-testid="last-pick"]', { timeout: 10000 });
        }
      }
      
      // Verify draft completed
      await expect(page.locator('[data-testid="draft-complete-modal"]')).toBeVisible();
      await page.click('[data-testid="view-team-button"]');
    });

    // 4. TEAM MANAGEMENT
    await test.step('Set Optimal Lineup', async () => {
      await expect(page).toHaveURL(/\/team\/[^\/]+$/);
      await expect(page.locator('[data-testid="roster-grid"]')).toBeVisible();
      
      // Click optimal lineup button
      await page.click('[data-testid="optimal-lineup-button"]');
      await page.click('[data-testid="confirm-optimal-lineup"]');
      
      // Verify lineup is set
      await expect(page.locator('[data-testid="lineup-complete"]')).toBeVisible();
      
      // Check that all starting positions are filled
      const startingPositions = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'TE', 'FLEX', 'K', 'DST'];
      for (const position of startingPositions) {
        await expect(page.locator(`[data-testid="lineup-${position}"] [data-testid="player-card"]`)).toBeVisible();
      }
    });

    await test.step('Manage Team Settings', async () => {
      await page.click('[data-testid="team-settings-button"]');
      
      // Update team name
      await page.fill('[data-testid="team-name-input"]', 'The Test Champions');
      
      // Upload team logo (mock file)
      await page.setInputFiles('[data-testid="team-logo-upload"]', {
        name: 'logo.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake-image-data')
      });
      
      await page.click('[data-testid="save-team-settings"]');
      await expect(page.locator('[data-testid="team-name"]')).toContainText('The Test Champions');
    });

    // 5. TRADING SYSTEM
    await test.step('Propose and Execute Trade', async () => {
      await page.click('[data-testid="trades-tab"]');
      await page.click('[data-testid="propose-trade-button"]');
      
      // Select trading partner
      await page.selectOption('[data-testid="trade-partner-select"]', '1'); // First available team
      
      // Add players to trade
      await page.click('[data-testid="my-players"] [data-testid="player-card"]:first-child [data-testid="add-to-trade"]');
      await page.click('[data-testid="their-players"] [data-testid="player-card"]:first-child [data-testid="add-to-trade"]');
      
      // Review trade
      await page.click('[data-testid="review-trade-button"]');
      await expect(page.locator('[data-testid="trade-analysis"]')).toBeVisible();
      
      // Submit trade
      await page.click('[data-testid="submit-trade-button"]');
      await expect(page.locator('[data-testid="trade-proposed-success"]')).toBeVisible();
      
      // Simulate trade acceptance (in real scenario, would be other user)
      await page.goto('/api/test/accept-trade'); // Test endpoint
      await page.goBack();
      
      // Verify trade completed
      await expect(page.locator('[data-testid="trade-completed"]')).toBeVisible();
    });

    // 6. WAIVER WIRE MANAGEMENT
    await test.step('Manage Waiver Claims', async () => {
      await page.click('[data-testid="waivers-tab"]');
      
      // Add waiver claim
      await page.click('[data-testid="available-players"] [data-testid="player-card"]:first-child');
      await page.click('[data-testid="add-waiver-claim"]');
      
      // Select drop player
      await page.selectOption('[data-testid="drop-player-select"]', '1');
      await page.fill('[data-testid="waiver-priority"]', '1');
      
      await page.click('[data-testid="submit-waiver-claim"]');
      await expect(page.locator('[data-testid="waiver-claim-success"]')).toBeVisible();
      
      // Wait for waiver processing (simulated)
      await page.goto('/api/test/process-waivers'); // Test endpoint
      await page.goBack();
      
      // Verify claim processed
      await expect(page.locator('[data-testid="waiver-processed"]')).toBeVisible();
    });

    // 7. SEASON PROGRESSION
    await test.step('Navigate Through Season', async () => {
      // View matchup
      await page.click('[data-testid="schedule-tab"]');
      await page.click('[data-testid="current-matchup"]');
      
      await expect(page.locator('[data-testid="matchup-view"]')).toBeVisible();
      await expect(page.locator('[data-testid="opponent-team"]')).toBeVisible();
      
      // Check live scoring
      await expect(page.locator('[data-testid="live-score"]')).toBeVisible();
      
      // Simulate week progression
      for (let week = 1; week <= 14; week++) {
        await page.goto(`/api/test/advance-week/${week}`); // Test endpoint
        await page.goto('/team');
        
        // Set lineup for each week
        await page.click('[data-testid="optimal-lineup-button"]');
        await page.click('[data-testid="confirm-optimal-lineup"]');
        
        // Check standings
        await page.click('[data-testid="standings-tab"]');
        await expect(page.locator('[data-testid="standings-table"]')).toBeVisible();
        await expect(page.locator(`[data-testid="week-${week}-scores"]`)).toBeVisible();
      }
    });

    // 8. PLAYOFFS & CHAMPIONSHIP
    await test.step('Playoff Experience', async () => {
      // Advance to playoffs
      await page.goto('/api/test/start-playoffs'); // Test endpoint
      await page.goto('/leagues');
      
      // View playoff bracket
      await page.click('[data-testid="playoffs-tab"]');
      await expect(page.locator('[data-testid="playoff-bracket"]')).toBeVisible();
      await expect(page.locator('[data-testid="playoff-teams"]')).toBeVisible();
      
      // Simulate playoff weeks
      for (let week = 15; week <= 17; week++) {
        await page.goto(`/api/test/advance-week/${week}`);
        await page.goto('/team');
        
        // Set playoff lineup
        await page.click('[data-testid="optimal-lineup-button"]');
        await page.click('[data-testid="confirm-optimal-lineup"]');
        
        // Check if still in playoffs
        const eliminated = await page.locator('[data-testid="eliminated"]').isVisible();
        if (eliminated) break;
      }
    });

    await test.step('Season Conclusion', async () => {
      // View final standings
      await page.click('[data-testid="standings-tab"]');
      await expect(page.locator('[data-testid="final-standings"]')).toBeVisible();
      
      // Check awards and achievements
      await page.click('[data-testid="awards-tab"]');
      await expect(page.locator('[data-testid="season-awards"]')).toBeVisible();
      
      // View season recap
      await page.click('[data-testid="season-recap-button"]');
      await expect(page.locator('[data-testid="season-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="draft-recap"]')).toBeVisible();
      await expect(page.locator('[data-testid="trade-history"]')).toBeVisible();
      
      // Export season data
      await page.click('[data-testid="export-season-button"]');
      // Wait for download to start
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="confirm-export"]');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('season-data');
    });

    // 9. REAL-TIME FEATURES VALIDATION
    await test.step('Validate Real-time Updates', async () => {
      // Open second browser context to simulate other user
      const context2 = await page.context().browser()?.newContext();
      const page2 = await context2?.newPage();
      
      if (page2) {
        // Login as different user
        await page2.goto('/login');
        await page2.fill('[data-testid="email-input"]', 'user2@test.com');
        await page2.fill('[data-testid="password-input"]', 'password');
        await page2.click('[data-testid="login-button"]');
        
        // Both users view same league
        await page.goto('/leagues');
        await page2.goto('/leagues');
        
        // User 1 makes a waiver claim
        await page.click('[data-testid="waivers-tab"]');
        await page.click('[data-testid="add-waiver-claim-quick"]');
        
        // Verify User 2 sees the update in real-time
        await expect(page2.locator('[data-testid="live-activity-feed"]')).toContainText('waiver claim');
        
        await context2?.close();
      }
    });

    // 10. MOBILE EXPERIENCE VALIDATION
    await test.step('Mobile Experience Check', async () => {
      // Simulate mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/team');
      
      // Check mobile navigation
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Test mobile gestures
      await page.touchTap('[data-testid="roster-grid"]');
      
      // Check responsive design
      await expect(page.locator('[data-testid="roster-grid"]')).toBeVisible();
      await expect(page.locator('[data-testid="lineup-optimizer-mobile"]')).toBeVisible();
      
      // Test PWA features
      await page.goto('/');
      await expect(page.locator('[data-testid="install-app-prompt"]')).toBeVisible();
    });
  });

  test('Oracle AI Integration Journey', async () => {
    await test.step('Access Oracle Features', async () => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'testuser@astraldraft.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/oracle');
      await expect(page.locator('[data-testid="oracle-dashboard"]')).toBeVisible();
    });

    await test.step('Test Prediction Features', async () => {
      // Get player predictions
      await page.click('[data-testid="player-predictions-tab"]');
      await page.fill('[data-testid="player-search"]', 'Josh Allen');
      await page.click('[data-testid="get-prediction-button"]');
      
      await expect(page.locator('[data-testid="prediction-result"]')).toBeVisible();
      await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
      
      // Test trade analysis
      await page.click('[data-testid="trade-analyzer-tab"]');
      await page.click('[data-testid="analyze-trade-button"]');
      
      await expect(page.locator('[data-testid="trade-analysis-result"]')).toBeVisible();
      await expect(page.locator('[data-testid="fairness-score"]')).toBeVisible();
    });

    await test.step('Test Oracle Learning', async () => {
      // Provide feedback on prediction
      await page.click('[data-testid="prediction-feedback-button"]');
      await page.click('[data-testid="accurate-prediction"]');
      
      await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible();
      
      // Check Oracle accuracy tracking
      await page.click('[data-testid="oracle-stats-tab"]');
      await expect(page.locator('[data-testid="accuracy-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="prediction-history"]')).toBeVisible();
    });
  });

  test('Accessibility and Performance Validation', async () => {
    await test.step('Accessibility Compliance', async () => {
      await page.goto('/dashboard');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Test screen reader support
      const ariaLabels = await page.locator('[aria-label]').count();
      expect(ariaLabels).toBeGreaterThan(10);
      
      // Test color contrast
      const contrastIssues = await page.locator('[data-contrast-issue]').count();
      expect(contrastIssues).toBe(0);
    });

    await test.step('Performance Benchmarks', async () => {
      const startTime = Date.now();
      await page.goto('/team');
      const loadTime = Date.now() - startTime;
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check Core Web Vitals
      const performanceMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const metrics = entries.reduce((acc: any, entry) => {
              acc[entry.name] = entry.value;
              return acc;
            }, {});
            resolve(metrics);
          }).observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
        });
      });
      
      console.log('Performance metrics:', performanceMetrics);
    });
  });
});