'use client'

import * as React from 'react'

type FeatureFlags = {
  debugNetwork?: boolean
}

function readFlags(): FeatureFlags {
  try {
    return JSON.parse(localStorage.getItem('featureFlags') || '{}') || {}
  } catch {
    return {}
  }
}

export function NetworkDebugPatch() {
  React.useEffect(() => {
    try {
      const w = window as any

      const patch = () => {
        if (w.__mkFetchPatched) return
        w.__mkFetchPatched = true
        const orig = window.fetch
        w.__mkFetchOrig = orig
        window.fetch = async function (...args: any[]) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || ''
          const t0 = window.performance?.now ? performance.now() : Date.now()
          const res = await orig.apply(this, args as any)
          const t1 = window.performance?.now ? performance.now() : Date.now()
          try {
            // eslint-disable-next-line no-console
            console.debug('[MK][fetch]', url, res.status, Math.round(t1 - t0) + 'ms')
          } catch {}
          return res
        }
      }

      const unpatch = () => {
        if (w.__mkFetchPatched && w.__mkFetchOrig) {
          window.fetch = w.__mkFetchOrig
          w.__mkFetchPatched = false
        }
      }

      const apply = () => {
        const ff = readFlags()
        if (ff?.debugNetwork) patch()
        else unpatch()
      }

      apply()
      const onStorage = (e: StorageEvent) => {
        if (e.key === 'featureFlags') apply()
      }
      window.addEventListener('storage', onStorage)
      window.addEventListener('mk:flags' as any, apply)
      return () => {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener('mk:flags' as any, apply)
        unpatch()
      }
    } catch {
      return
    }
  }, [])

  return null
}

