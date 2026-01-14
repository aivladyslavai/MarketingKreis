import type { FullConfig } from '@playwright/test'
import { request as pwRequest } from '@playwright/test'
import fs from 'fs'
import path from 'path'

export default async function globalSetup(config: FullConfig) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  const backendUrl = process.env.E2E_BACKEND_URL || process.env.BACKEND_URL || ''

  // Generate per-run credentials unless explicitly provided.
  const email = process.env.E2E_TEST_USER || `e2e-smoke-${Date.now()}@marketingkreis.ch`
  const password = process.env.E2E_TEST_PASSWORD || `MK-${Date.now()}-SmokePass!`
  const inviteToken = process.env.E2E_INVITE_TOKEN || ''

  // Warm up backend (Render free tier can sleep -> first request may be slow)
  if (backendUrl) {
    const healthUrl = `${backendUrl.replace(/\/$/, '')}/health`
    const start = Date.now()
    // wait up to 2 minutes
    while (Date.now() - start < 120_000) {
      try {
        const r = await fetch(healthUrl, { cache: 'no-store' })
        if (r.ok) break
      } catch {}
      await new Promise((r) => setTimeout(r, 2500))
    }
  }

  const req = await pwRequest.newContext({ baseURL })

  // Store run metadata for debugging (avoid writing secrets)
  try {
    fs.writeFileSync(
      path.join(process.cwd(), 'e2e-run.json'),
      JSON.stringify({ email }, null, 2),
      'utf-8',
    )
  } catch {}

  // Try to register via Next.js proxy (auto-verifies email when possible)
  const registerPayload: any = { name: 'E2E Smoke', email, password }
  if (inviteToken) registerPayload.token = inviteToken

  const reg = await req.post('/api/auth/register', { data: registerPayload })
  const regText = await reg.text().catch(() => '')
  const regOk = reg.ok() || /user already exists/i.test(regText)

  // If invite token is required but not provided, we still try login (user may exist)
  if (!regOk && /invite token required/i.test(regText) && !inviteToken) {
    // fall through to login attempt
  } else if (!regOk) {
    throw new Error(`E2E register failed: ${reg.status()} ${regText}`)
  }

  // Login and persist cookies to storageState for all tests
  const login = await req.post('/api/auth/login', { data: { email, password } })
  const loginText = await login.text().catch(() => '')
  if (!login.ok()) {
    throw new Error(`E2E login failed: ${login.status()} ${loginText}`)
  }

  await req.storageState({ path: 'e2e-auth.json' })
}


