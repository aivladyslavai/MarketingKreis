import type { FullConfig, request } from '@playwright/test'
import { request as pwRequest } from '@playwright/test'

export default async function globalSetup(config: FullConfig) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  const apiBase = process.env.API_BASE_URL || 'http://localhost:3001'
  const email = process.env.E2E_TEST_USER || 'admin@marketingkreis.ch'
  const password = process.env.E2E_TEST_PASSWORD || 'password123'

  const req = await pwRequest.newContext({ baseURL: apiBase })

  // Try to register (ignore if already exists)
  await req.post('/auth/register', {
    data: {
      name: 'E2E Admin',
      email,
      password,
      role: 'Admin',
    },
  })

  // No persistent session needed here; tests will login via UI
}


