import { test, expect } from '@playwright/test'
import path from 'path'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

test.beforeEach(async ({ page }) => {
  const email = process.env.E2E_TEST_USER || 'admin@marketingkreis.ch'
  const password = process.env.E2E_TEST_PASSWORD || 'password123'
  await page.goto(`${BASE}/auth/signin`)
  await page.getByPlaceholder('E-Mail-Adresse').fill(email)
  await page.getByPlaceholder('Passwort').fill(password)
  await page.getByRole('button', { name: 'Mit E-Mail anmelden' }).click()
  await page.waitForURL('**/dashboard*', { timeout: 15000 })
})

test('Upload file and observe job status', async ({ page }) => {
  await page.goto(`${BASE}/(dashboard)/uploads`)
  const filePath = path.resolve(__dirname, '../fixtures/sample-activities.csv')
  const input = page.locator('input[type="file"]')
  await input.setInputFiles(filePath)
  await page.getByRole('button', { name: 'Import Activities' }).click()
  await expect(page.getByText(/Job #/)).toBeVisible()
  await expect(page.getByText(/Done/)).toBeVisible({ timeout: 30000 })
})


