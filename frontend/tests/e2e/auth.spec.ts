import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

test('login success redirects to dashboard', async ({ page }) => {
  const email = process.env.E2E_TEST_USER || 'admin@marketingkreis.ch'
  const password = process.env.E2E_TEST_PASSWORD || 'password123'
  await page.goto(`${BASE}/auth/signin`)
  await page.getByPlaceholder('E-Mail-Adresse').fill(email)
  await page.getByPlaceholder('Passwort').fill(password)
  await page.getByRole('button', { name: 'Mit E-Mail anmelden' }).click()
  await page.waitForURL('**/dashboard*', { timeout: 15000 })
  await expect(page).toHaveURL(/.*\/dashboard.*/)
})

test('login failure shows error message', async ({ page }) => {
  await page.goto(`${BASE}/auth/signin`)
  await page.getByPlaceholder('E-Mail-Adresse').fill('wrong@example.com')
  await page.getByPlaceholder('Passwort').fill('wrongpass')
  await page.getByRole('button', { name: 'Mit E-Mail anmelden' }).click()
  // Expect toast or error
  await expect(page.locator('text=Ungültige E-Mail oder Passwort')).toBeVisible({ timeout: 10000 })
})


