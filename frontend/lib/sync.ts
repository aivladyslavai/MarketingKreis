"use client"

// Lightweight event bus + BroadcastChannel for cross-page sync

export type SyncEvent =
  | 'global:refresh'
  | 'uploads:changed'
  | 'jobs:changed'
  | 'activities:changed'
  | 'calendar:changed'
  | 'crm:companies:changed'
  | 'crm:contacts:changed'
  | 'crm:deals:changed'
  | 'content:changed'
  | 'performance:changed'

type Handler = (payload?: any) => void

class SyncBus {
  private handlers = new Map<SyncEvent, Set<Handler>>()
  private bc: BroadcastChannel | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel('mk_sync_channel')
        this.bc.onmessage = (ev) => {
          const { type, payload } = ev.data || {}
          if (type) this.emitLocal(type, payload)
        }
      } catch {}
    }
  }

  private emitLocal(type: SyncEvent, payload?: any) {
    const set = this.handlers.get(type)
    if (!set) return
    set.forEach((fn) => {
      try { fn(payload) } catch {}
    })
  }

  emit(type: SyncEvent, payload?: any) {
    this.emitLocal(type, payload)
    if (this.bc) {
      try { this.bc.postMessage({ type, payload }) } catch {}
    }
  }

  on(type: SyncEvent, handler: Handler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler)
    return () => {
      this.handlers.get(type)?.delete(handler)
    }
  }

  refreshAll() {
    this.emit('global:refresh')
  }
}

export const sync = new SyncBus()

export const useSyncEffect = (type: SyncEvent, handler: Handler) => {
  if (typeof window === 'undefined') return
  // lazy require to avoid SSR mismatch
  const unsub = sync.on(type, handler)
  return unsub
}


