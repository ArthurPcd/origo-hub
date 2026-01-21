import { test, expect } from '@playwright/test'

test.describe('Authentication flow', () => {
  test('landing page loads and shows hero CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Primary CTA button should be present
    const cta = page.getByRole('link', { name: /start free|commencer|starten|empezar|inizia|начать|免费/i }).first()
    await expect(cta).toBeVisible()
  })

  test('signup page renders', async ({ page }) => {
    await page.goto('/en/signup')
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('login page renders', async ({ page }) => {
    await page.goto('/en/login')
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('unauthenticated user is redirected from /history to /login', async ({ page }) => {
    await page.goto('/en/history')
    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })
})
