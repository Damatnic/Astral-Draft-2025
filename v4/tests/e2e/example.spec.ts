import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should display the welcome page', async ({ page }) => {
    await page.goto('/')

    // Expect the page title
    await expect(page).toHaveTitle(/Astral Draft V4/)

    // Expect the main heading
    await expect(
      page.getByRole('heading', { name: /Welcome to Astral Draft V4/ })
    ).toBeVisible()

    // Expect the action buttons
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Learn More' })).toBeVisible()
  })

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/')

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(
      page.getByRole('heading', { name: /Welcome to Astral Draft V4/ })
    ).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(
      page.getByRole('heading', { name: /Welcome to Astral Draft V4/ })
    ).toBeVisible()
  })

  test('should load health check endpoint @smoke', async ({ page }) => {
    const response = await page.goto('/api/health')
    expect(response?.status()).toBe(200)

    const body = await response?.json()
    expect(body.status).toBe('ok')
  })
})