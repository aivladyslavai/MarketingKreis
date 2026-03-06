export type WakeBackendOptions = {
  /**
   * Force a wake attempt even if we recently did one.
   */
  force?: boolean
  /**
   * Max age since last wake attempt that counts as "warm".
   */
  maxAgeMs?: number
  /**
   * Maximum time to wait for the wake request to get a response.
   * This runs in the browser (not on Vercel functions), so it can be longer.
   */
  maxWaitMs?: number
}

let lastWakeAttemptAt = 0
let inflight: Promise<void> | null = null

function baseUrlFromEnv(): string {
  const raw = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim()
  return raw.replace(/\/+$/, "")
}

/**
 * Best-effort Render cold-start wakeup.
 *
 * Why: Vercel serverless functions can time out while waiting for a sleeping backend.
 * We wake the backend directly from the browser (no CORS required) so subsequent
 * same-origin `/api/*` proxy calls complete quickly.
 */
export function wakeBackend(opts: WakeBackendOptions = {}): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()

  const maxAgeMs = Number.isFinite(opts.maxAgeMs) ? Number(opts.maxAgeMs) : 4 * 60_000
  const maxWaitMs = Number.isFinite(opts.maxWaitMs) ? Number(opts.maxWaitMs) : 25_000

  const base = baseUrlFromEnv()
  if (!base) {
    // Local/dev fallback: still poke the app health endpoint through same-origin.
    try {
      fetch("/api/health", { cache: "no-store" }).catch(() => {})
    } catch {}
    return Promise.resolve()
  }

  const now = Date.now()
  if (!opts.force && lastWakeAttemptAt && now - lastWakeAttemptAt < maxAgeMs) {
    return inflight || Promise.resolve()
  }

  if (inflight) return inflight
  lastWakeAttemptAt = now

  const url = `${base}/health?t=${now}`

  inflight = new Promise<void>((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }

    // Option A: use an Image request (no CORS) and resolve when we get a response.
    try {
      const img = new Image()
      ;(img as any).referrerPolicy = "no-referrer"
      img.onload = finish
      img.onerror = finish
      img.src = url
    } catch {}

    // Option B: also send a fetch no-cors request (some browsers schedule images differently).
    try {
      fetch(url, { mode: "no-cors", cache: "no-store" }).then(finish).catch(() => {})
    } catch {}

    // Safety: never block forever.
    setTimeout(finish, Math.max(1000, maxWaitMs))
  }).finally(() => {
    inflight = null
  })

  return inflight
}

