"use client"

import useSWR from 'swr'
import { useEffect } from 'react'
import { authFetch, apiBase } from '@/lib/api'
import { sync } from '@/lib/sync'

export interface UploadItem {
  id: string
  original_name: string
  file_type: string
  file_size: number
  created_at: string
}

export interface JobItem {
  id: string
  type: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  created_at: string
  progress?: number
}

export function useUploadsApi() {
  const { data, isLoading, error, mutate } = useSWR('/uploads', async (url) => {
    const res = await authFetch(url)
    try { return await res.json() } catch { return undefined }
  }, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })
  // subscribe to global sync events (with cleanup)
  useEffect(() => {
    const u1 = sync.on('global:refresh', () => mutate())
    const u2 = sync.on('uploads:changed', () => mutate())
    return () => { u1(); u2() }
  }, [mutate])

  return {
    uploads: (data?.items as UploadItem[]) || [],
    isLoading,
    error,
    previewFile: async (
      file: File,
    ): Promise<{
      headers: string[]
      samples: any[]
      suggested_mapping: Record<string, string | null>
      category_values?: string[]
    }> => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${apiBase}/uploads/preview`, { method: 'POST', body: fd, credentials: 'include' })
      if (!res.ok) throw new Error(await res.text())
      return await res.json()
    },
    uploadFile: async (file: File, onProgress?: (p: number) => void, mapping?: Record<string, string | null>) => {
      const fd = new FormData()
      fd.append('file', file)
      if (mapping) fd.append('mapping', JSON.stringify(mapping))
      // Note: avoid authFetch to let browser set multipart headers
      const res = await fetch(`${apiBase}/uploads`, { method: 'POST', body: fd, credentials: 'include' })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        let msg = res.statusText
        if (text) {
          try {
            const j = JSON.parse(text)
            msg = (j as any)?.detail || (j as any)?.error || msg
          } catch {
            msg = text || msg
          }
        }
        throw new Error(msg)
      }
      await mutate()
      sync.emit('uploads:changed')
      // CSV/XLS(X) uploads import activities on the backend. Notify other pages (Activities/Reports/etc.)
      // so the Marketing Circle updates immediately without a hard reload.
      try {
        const name = String(file?.name || '').toLowerCase()
        const isTabular = name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')
        if (isTabular) {
          sync.emit('activities:changed')
          sync.emit('performance:changed')
        }
      } catch {}
    },
    refresh: async () => { await mutate(); sync.emit('uploads:changed') },
  }
}

export function useJobsApi() {
  const { data, isLoading, error, mutate } = useSWR('/jobs', async (url) => {
    const res = await authFetch(url)
    try { return await res.json() } catch { return undefined }
  }, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })
  useEffect(() => {
    const u1 = sync.on('global:refresh', () => mutate())
    const u2 = sync.on('jobs:changed', () => mutate())
    return () => { u1(); u2() }
  }, [mutate])

  return {
    jobs: (data?.items as JobItem[]) || [],
    isLoading,
    error,
    refresh: async () => { await mutate(); sync.emit('jobs:changed') },
  }
}



