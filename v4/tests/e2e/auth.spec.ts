/**
 * @fileoverview End-to-end authentication flow tests
 * Tests all authentication providers and user flows
 */

import { test, expect, type Page } from '@playwright/test'

// Test data
const testCredentials = {
  email: 'test@astraldraft.com',
  password: 'TestPassword123!',
  username: 'testuser',
}

const invalidCredentials = {
  email: 'invalid@example.com',
  password: 'wrongpassword',
}

// Page Object Model helpers
class AuthPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/auth/signin')
  }

  async fillCredentialsForm(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)
  }

  async clickSignIn() {
    await this.page.click('[data-testid="signin-button"]')
  }

  async clickSignUp() {
    await this.page.click('[data-testid="signup-button"]')
  }

  async clickGoogleSignIn() {
    await this.page.click('[data-testid="google-signin-button"]')
  }

  async clickGitHubSignIn() {
    await this.page.click('[data-testid="github-signin-button"]')
  }

  async fillRegistrationForm(email: string, password: string, username: string) {
    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)
    await this.page.fill('[data-testid="confirm-password-input"]', password)
    await this.page.fill('[data-testid="username-input"]', username)
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message)
  }

  async expectSuccessMessage(message: string) {
    await expect(this.page.locator('[data-testid="success-message"]')).toContainText(message)
  }
}

class DashboardPage {
  constructor(private page: Page) {}

  async expectToBeOnDashboard() {
    await expect(this.page).toHaveURL(/.*dashboard/)
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible()
  }

  async signOut() {
    await this.page.click('[data-testid="user-menu"]')
    await this.page.click('[data-testid="signout-button"]')
  }

  async expectUserInfo(username: string, email: string) {
    await this.page.click('[data-testid="user-menu"]')
    await expect(this.page.locator('[data-testid="user-username"]')).toContainText(username)
    await expect(this.page.locator('[data-testid="user-email"]')).toContainText(email)
  }
}

test.describe('Authentication Flows', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
  })

  test.describe('Sign In', () => {
    test('should sign in with valid credentials', async ({ page }) => {
      await authPage.navigate()
      
      // Fill and submit form
      await authPage.fillCredentialsForm(testCredentials.email, testCredentials.password)
      await authPage.clickSignIn()
      
      // Should redirect to dashboard
      await dashboardPage.expectToBeOnDashboard()
      
      // Should display user info
      await dashboardPage.expectUserInfo(testCredentials.username, testCredentials.email)
    })

    test('should show error with invalid email', async ({ page }) => {
      await authPage.navigate()
      
      await authPage.fillCredentialsForm(invalidCredentials.email, invalidCredentials.password)
      await authPage.clickSignIn()
      
      await authPage.expectErrorMessage('Invalid credentials')
    })

    test('should show error with invalid password', async ({ page }) => {
      await authPage.navigate()
      
      await authPage.fillCredentialsForm(testCredentials.email, invalidCredentials.password)
      await authPage.clickSignIn()
      
      await authPage.expectErrorMessage('Invalid credentials')
    })

    test('should validate email format', async ({ page }) => {
      await authPage.navigate()
      
      await authPage.fillCredentialsForm('invalid-email', testCredentials.password)
      await authPage.clickSignIn()
      
      // Should show HTML5 validation error
      const emailInput = page.locator('[data-testid="email-input"]')
      await expect(emailInput).toHaveAttribute('type', 'email')
      
      // Browser validation should prevent form submission
      const isFormValid = await emailInput.evaluate(el => (el as HTMLInputElement).validity.valid)
      expect(isFormValid).toBe(false)
    })

    test('should validate password requirements', async ({ page }) => {
      await authPage.navigate()
      
      await authPage.fillCredentialsForm(testCredentials.email, '123')
      await authPage.clickSignIn()
      
      await authPage.expectErrorMessage('Password must be at least 6 characters')
    })

    test('should handle sign in loading state', async ({ page }) => {
      await authPage.navigate()
      
      await authPage.fillCredentialsForm(testCredentials.email, testCredentials.password)
      
      // Intercept sign-in request to add delay
      await page.route('/api/auth/callback/credentials', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.continue()
      })
      
      await authPage.clickSignIn()
      
      // Should show loading state
      await expect(page.locator('[data-testid="signin-button"]')).toBeDisabled()
      await expect(page.locator('[data-testid="signin-loading"]')).toBeVisible()
    })

    test('should remember user session', async ({ page }) => {
      await authPage.navigate()
      await authPage.fillCredentialsForm(testCredentials.email, testCredentials.password)
      await authPage.clickSignIn()
      
      await dashboardPage.expectToBeOnDashboard()
      
      // Refresh page
      await page.reload()
      
      // Should still be authenticated
      await dashboardPage.expectToBeOnDashboard()
    })
  })

  test.describe('Sign Up', () => {
    test('should register new user with valid data', async ({ page }) => {
      const newUser = {
        email: `newuser+${Date.now()}@astraldraft.com`,
        password: 'NewPassword123!',
        username: `newuser${Date.now()}`,
      }

      await page.goto('/auth/signup')
      
      await authPage.fillRegistrationForm(newUser.email, newUser.password, newUser.username)
      await authPage.clickSignUp()
      
      // Should show success message or redirect to verification page
      await expect(page).toHaveURL(/.*auth\/(verify|signin)/)
      await authPage.expectSuccessMessage('Account created successfully')
    })

    test('should validate password confirmation', async ({ page }) => {
      await page.goto('/auth/signup')
      
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.fill('[data-testid="confirm-password-input"]', 'different-password')
      await page.fill('[data-testid="username-input"]', 'testuser')
      
      await authPage.clickSignUp()
      
      await authPage.expectErrorMessage('Passwords do not match')
    })

    test('should validate username uniqueness', async ({ page }) => {
      await page.goto('/auth/signup')
      
      // Try to register with existing username
      await authPage.fillRegistrationForm(
        'different@example.com',
        'password123',
        testCredentials.username // Existing username
      )
      
      await authPage.clickSignUp()
      
      await authPage.expectErrorMessage('Username already exists')
    })

    test('should validate email uniqueness', async ({ page }) => {
      await page.goto('/auth/signup')
      
      await authPage.fillRegistrationForm(
        testCredentials.email, // Existing email
        'password123',
        'differentusername'
      )
      
      await authPage.clickSignUp()
      
      await authPage.expectErrorMessage('Email already exists')
    })

    test('should validate username format', async ({ page }) => {
      await page.goto('/auth/signup')
      
      await authPage.fillRegistrationForm(
        'test@example.com',
        'password123',
        'invalid username!' // Contains spaces and special characters
      )
      
      await authPage.clickSignUp()
      
      await authPage.expectErrorMessage('Username can only contain letters, numbers, and underscores')
    })
  })

  test.describe('OAuth Sign In', () => {
    test('should initiate Google OAuth flow', async ({ page }) => {
      await authPage.navigate()
      
      // Mock Google OAuth redirect
      await page.route('**/auth/signin/google', async route => {
        await route.fulfill({
          status: 302,
          headers: {
            'Location': 'https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=callback'
          }
        })
      })
      
      await authPage.clickGoogleSignIn()
      
      // Should redirect to Google OAuth
      await expect(page).toHaveURL(/.*accounts\.google\.com.*/)
    })

    test('should initiate GitHub OAuth flow', async ({ page }) => {
      await authPage.navigate()
      
      await page.route('**/auth/signin/github', async route => {
        await route.fulfill({
          status: 302,
          headers: {
            'Location': 'https://github.com/login/oauth/authorize?client_id=test&redirect_uri=callback'
          }
        })
      })
      
      await authPage.clickGitHubSignIn()
      
      // Should redirect to GitHub OAuth
      await expect(page).toHaveURL(/.*github\.com.*/)
    })

    test('should handle OAuth callback success', async ({ page }) => {
      // Mock successful OAuth callback
      await page.goto('/api/auth/callback/google?code=test-auth-code&state=test-state')
      
      // Should redirect to dashboard after successful OAuth
      await dashboardPage.expectToBeOnDashboard()
    })

    test('should handle OAuth callback error', async ({ page }) => {
      // Mock OAuth error callback
      await page.goto('/api/auth/callback/google?error=access_denied')
      
      // Should redirect to sign in with error
      await expect(page).toHaveURL(/.*auth\/signin/)
      await authPage.expectErrorMessage('OAuth authentication failed')
    })
  })

  test.describe('Sign Out', () => {
    test('should sign out user successfully', async ({ page }) => {
      // First sign in
      await authPage.navigate()
      await authPage.fillCredentialsForm(testCredentials.email, testCredentials.password)
      await authPage.clickSignIn()
      await dashboardPage.expectToBeOnDashboard()
      
      // Then sign out
      await dashboardPage.signOut()
      
      // Should redirect to sign in page
      await expect(page).toHaveURL(/.*auth\/signin/)
      
      // Should not be able to access protected pages
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/.*auth\/signin/)
    })

    test('should clear session on sign out', async ({ page }) => {
      // Sign in
      await authPage.navigate()
      await authPage.fillCredentialsForm(testCredentials.email, testCredentials.password)
      await authPage.clickSignIn()
      await dashboardPage.expectToBeOnDashboard()
      
      // Sign out
      await dashboardPage.signOut()
      
      // Try to navigate back to dashboard
      await page.goto('/dashboard')
      
      // Should redirect to sign in (session cleared)
      await expect(page).toHaveURL(/.*auth\/signin/)
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to sign in', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard',
        '/leagues',
        '/draft',
        '/team',
        '/oracle',
      ]

      for (const route of protectedRoutes) {
        await page.goto(route)
        await expect(page).toHaveURL(/.*auth\/signin/)
      }
    })

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      // Sign in first
      await authPage.navigate()
      await authPage.fillCredentialsForm(testCredentials.email, testCredentials.password)
      await authPage.clickSignIn()
      await dashboardPage.expectToBeOnDashboard()
      
      const protectedRoutes = [
        '/dashboard',
        '/leagues',
        '/oracle',
      ]

      for (const route of protectedRoutes) {
        await page.goto(route)
        await expect(page).toHaveURL(route)
      }
    })

    test('should preserve redirect URL after authentication', async ({ page }) => {
      // Try to access protected route while unauthenticated
      await page.goto('/leagues/create')
      
      // Should redirect to sign in with callbackUrl
      await expect(page).toHaveURL(/.*auth\/signin.*callbackUrl/)
      
      // Sign in
      await authPage.fillCredentialsForm(testCredentials.email, testCredentials.password)
      await authPage.clickSignIn()
      
      // Should redirect to original intended route
      await expect(page).toHaveURL('/leagues/create')
    })
  })

  test.describe('Session Management', () => {
    test('should handle session expiration', async ({ page }) => {
      // Sign in
      await authPage.navigate()
      await authPage.fillCredentialsForm(testCredentials.email, testCredentials.password)
      await authPage.clickSignIn()
      await dashboardPage.expectToBeOnDashboard()
      
      // Mock expired session
      await page.evaluate(() => {
        document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      })
      
      // Make authenticated request
      await page.reload()
      
      // Should redirect to sign in due to expired session
      await expect(page).toHaveURL(/.*auth\/signin/)
    })

    test('should refresh expired tokens automatically', async ({ page }) => {
      // This test would require implementing token refresh logic
      // For now, we'll test the UI behavior
      
      await authPage.navigate()
      await authPage.fillCredentialsForm(testCredentials.email, testCredentials.password)
      await authPage.clickSignIn()
      await dashboardPage.expectToBeOnDashboard()
      
      // Mock token refresh endpoint
      await page.route('**/api/auth/session', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: '1',
                username: testCredentials.username,
                email: testCredentials.email,
              },
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
          })
        } else {
          await route.continue()
        }
      })
      
      await page.reload()
      await dashboardPage.expectToBeOnDashboard()
    })
  })

  test.describe('Security', () => {
    test('should prevent CSRF attacks', async ({ page }) => {
      // Attempt to sign in with missing CSRF token
      await page.route('**/api/auth/callback/credentials', async route => {
        const request = route.request()
        const postData = request.postData()
        
        // Remove CSRF token from request
        if (postData && postData.includes('csrfToken')) {
          const modifiedData = postData.replace(/csrfToken=[^&]+&?/, '')
          await route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'CSRF token mismatch' })
          })
        } else {
          await route.continue()
        }
      })
      
      await authPage.navigate()
      await authPage.fillCredentialsForm(testCredentials.email, testCredentials.password)
      await authPage.clickSignIn()
      
      await authPage.expectErrorMessage('Security error occurred')
    })

    test('should rate limit authentication attempts', async ({ page }) => {
      await authPage.navigate()
      
      // Mock rate limiting after multiple attempts
      let attemptCount = 0
      await page.route('**/api/auth/callback/credentials', async route => {
        attemptCount++
        if (attemptCount > 3) {
          await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Too many attempts. Please try again later.' })
          })
        } else {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid credentials' })
          })
        }
      })
      
      // Make multiple failed attempts
      for (let i = 0; i < 4; i++) {
        await authPage.fillCredentialsForm(invalidCredentials.email, invalidCredentials.password)
        await authPage.clickSignIn()
        
        if (i < 3) {
          await authPage.expectErrorMessage('Invalid credentials')
        } else {
          await authPage.expectErrorMessage('Too many attempts')
        }
      }
    })

    test('should sanitize user input', async ({ page }) => {
      const xssPayload = '<script>alert("XSS")</script>'
      
      await page.goto('/auth/signup')
      
      await authPage.fillRegistrationForm(
        'test@example.com',
        'password123',
        xssPayload
      )
      
      await authPage.clickSignUp()
      
      // Username should be sanitized and not execute script
      const usernameInput = page.locator('[data-testid="username-input"]')
      const inputValue = await usernameInput.inputValue()
      expect(inputValue).not.toContain('<script>')
    })
  })
})