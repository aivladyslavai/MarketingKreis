import { test, expect } from '@playwright/test'

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

test('Export CSV and PDF', async ({ page, context }) => {
  await page.goto(`${BASE}/(dashboard)/activities`)

  const [csvDownload] = await Promise.all([
    page.waitForEvent('download'),
    // Assume a link/button exists that triggers CSV export
    page.click('text=CSV'),
  ])
  expect((await csvDownload.suggestedFilename()).endsWith('.csv')).toBeTruthy()

  const [pdfDownload] = await Promise.all([
    page.waitForEvent('download'),
    // Assume a link/button exists that triggers PDF export
    page.click('text=PDF'),
  ])
  expect((await pdfDownload.suggestedFilename()).endsWith('.pdf')).toBeTruthy()
})


