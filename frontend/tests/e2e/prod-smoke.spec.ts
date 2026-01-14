import { test, expect } from '@playwright/test'

test.setTimeout(180_000)

test('PROD smoke: auth -> upload/import -> crm', async ({ request }) => {
  const now = Date.now()
  const activityTitle = `E2E Smoke Activity ${now}`

  const csv =
    'title,category,status,budgetCHF,weight,start,end,notes\n' +
    `${activityTitle},VERKAUFSFOERDERUNG,ACTIVE,123,1,2026-01-01,2026-01-02,prod-smoke\n`

  const mapping = JSON.stringify({
    title: 'title',
    category: 'category',
    status: 'status',
    budget: 'budgetCHF',
    notes: 'notes',
    start: 'start',
    end: 'end',
    weight: 'weight',
  })

  // 1) Upload + import activities (via Next.js proxy)
  const up = await request.post('/api/uploads', {
    multipart: {
      file: { name: `e2e-${now}.csv`, mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf-8') },
      mapping,
    },
    timeout: 120_000,
  })
  const upText = await up.text().catch(() => '')
  expect(up.ok(), `upload failed: ${up.status()} ${upText}`).toBeTruthy()

  // 2) Verify upload exists
  const uploadsRes = await request.get('/api/uploads', { timeout: 60_000 })
  const uploadsText = await uploadsRes.text().catch(() => '')
  expect(uploadsRes.ok(), `uploads list failed: ${uploadsRes.status()} ${uploadsText}`).toBeTruthy()
  const uploadsJson = JSON.parse(uploadsText || '{}')
  const items = (uploadsJson?.items || []) as any[]
  expect(Array.isArray(items)).toBeTruthy()
  expect(items.length).toBeGreaterThan(0)

  // 3) Verify activity imported for this user
  const actsRes = await request.get('/api/activities', { timeout: 60_000 })
  const actsText = await actsRes.text().catch(() => '')
  expect(actsRes.ok(), `activities list failed: ${actsRes.status()} ${actsText}`).toBeTruthy()
  const acts = JSON.parse(actsText || '[]') as any[]
  expect(Array.isArray(acts)).toBeTruthy()
  expect(acts.some((a) => String(a?.title || '') === activityTitle)).toBeTruthy()

  // 4) CRM endpoints reachable (auth)
  const statsRes = await request.get('/api/crm/stats', { timeout: 60_000 })
  const statsText = await statsRes.text().catch(() => '')
  expect(statsRes.ok(), `crm stats failed: ${statsRes.status()} ${statsText}`).toBeTruthy()
  const stats = JSON.parse(statsText || '{}')
  expect(stats).toBeTruthy()
  expect(typeof stats.totalCompanies).not.toBe('undefined')
})

