"use client"

import useSWR from 'swr'
import { useEffect } from 'react'
import { authFetch, apiBase } from '@/lib/api'
import { sync } from '@/lib/sync'
import { wakeBackend } from '@/lib/wake-backend'

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

export type ImportKind = "activities" | "crm" | "content" | "budget"

export interface AiAnalyzeResult {
  ok: boolean
  provider: "openai" | "fallback"
  kind: ImportKind
  recommended_kinds: Array<{ kind: ImportKind; score: number; reason: string }>
  suggested_mapping: Record<string, string | null>
  confidence: Record<string, number>
  clean_rules: string[]
  insights: {
    rows_scanned: number
    rows_sampled: number
    header_row_detected?: boolean
    tables?: Array<{ sheet: string; rows: number; cols: number }>
    group_counts?: Record<string, number>
    period_guess?: { from?: string; to?: string }
    budget_range_chf?: { min?: number; max?: number }
    top_categories?: Array<{ value: string; count: number }>
    missingness?: Record<string, number>
    notes?: string[]
    todo?: Array<{ title: string; why?: string; how?: string }>
    column_stats?: Record<
      string,
      {
        missing_ratio?: number
        inferred_type?: "number" | "date" | "text"
        unique_sampled?: number
        top_values?: Array<{ value: string; count: number }>
        number?: { min?: number; max?: number; avg?: number; ok?: number; bad?: number }
        date?: { min?: string; max?: string; ok?: number; bad?: number }
      }
    >
  }
}

async function readApiErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "")
  const t = String(text || "").trim()
  const lower = t.toLowerCase()

  const looksLikeVercelTimeout =
    lower.includes("function_invocation_timeout") ||
    lower.includes("an error occurred with your deployment") ||
    lower.includes("function invocation timeout")

  if (looksLikeVercelTimeout || [502, 503, 504].includes(res.status)) {
    return "Der Server startet gerade (Cold Start). Bitte 20–30 Sekunden warten und erneut versuchen."
  }

  if (t) {
    try {
      const j = JSON.parse(t || "{}") as any
      return String(j?.detail || j?.error || j?.message || t)
    } catch {
      // If it's HTML, prefer statusText.
      if (t.includes("<html") || t.includes("<!doctype")) return res.statusText || `HTTP ${res.status}`
      return t.length > 500 ? t.slice(0, 500) + "…" : t
    }
  }

  return res.statusText || `HTTP ${res.status}`
}

export function useUploadsApi() {
  const { data, isLoading, error, mutate } = useSWR('/uploads', async (url) => {
    await wakeBackend().catch(() => {})
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
      importKind?: ImportKind,
    ): Promise<{
      headers: string[]
      samples: any[]
      suggested_mapping: Record<string, string | null>
      category_values?: string[]
      import_kind?: string
    }> => {
      await wakeBackend().catch(() => {})
      const fd = new FormData()
      fd.append('file', file)
      if (importKind) fd.append('import_kind', importKind)
      const res = await fetch(`${apiBase}/uploads/preview`, { method: 'POST', body: fd, credentials: 'include' })
      if (!res.ok) throw new Error(await readApiErrorMessage(res))
      return await res.json()
    },
    aiAnalyzeFile: async (
      file: File,
      importKind?: ImportKind,
    ): Promise<AiAnalyzeResult> => {
      await wakeBackend().catch(() => {})
      const fd = new FormData()
      fd.append('file', file)
      if (importKind) fd.append('import_kind', importKind)
      const res = await fetch(`${apiBase}/uploads/ai-analyze`, { method: 'POST', body: fd, credentials: 'include' })
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res))
      }
      return await res.json()
    },
    smartImportFile: async (
      file?: File | null,
      retryUploadId?: number | null,
    ): Promise<{
      ok: boolean
      upload_id: number
      job_id?: number
      import: Record<string, number>
      row_errors_count?: number
      tables: Array<{ sheet: string; rows: number; cols: number }>
    }> => {
      await wakeBackend().catch(() => {})
      const fd = new FormData()
      if (file) fd.append('file', file)
      if (retryUploadId) fd.append('retry_upload_id', String(retryUploadId))
      const res = await fetch(`${apiBase}/uploads/smart-import`, { method: 'POST', body: fd, credentials: 'include' })
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res))
      }
      return await res.json()
    },
    uploadFile: async (
      file: File,
      onProgress?: (p: number) => void,
      mapping?: Record<string, string | null>,
      importKind?: ImportKind,
    ) => {
      await wakeBackend().catch(() => {})
      const fd = new FormData()
      fd.append('file', file)
      if (mapping) fd.append('mapping', JSON.stringify(mapping))
      if (importKind) fd.append('import_kind', importKind)
      // Note: avoid authFetch to let browser set multipart headers
      const res = await fetch(`${apiBase}/uploads`, { method: 'POST', body: fd, credentials: 'include' })
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res))
      }
      await mutate()
      sync.emit('uploads:changed')
      // CSV/XLS(X) uploads import activities on the backend. Notify other pages (Activities/Reports/etc.)
      // so the Marketing Circle updates immediately without a hard reload.
      try {
        const name = String(file?.name || '').toLowerCase()
        const isTabular = name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')
        if (isTabular) {
          if ((importKind || "activities") === "activities") {
            sync.emit('activities:changed')
            sync.emit('performance:changed')
          }
          if ((importKind || "activities") === "crm") {
            sync.emit('crm:companies:changed')
          }
          if ((importKind || "activities") === "content") {
            sync.emit('content:items:changed')
          }
          if ((importKind || "activities") === "budget") {
            sync.emit('budget:changed')
          }
        }
      } catch {}
    },
    deleteUpload: async (uploadId: string): Promise<{ ok: boolean; deleted?: Record<string, number> }> => {
      await wakeBackend().catch(() => {})
      const res = await authFetch(`/uploads/${encodeURIComponent(String(uploadId))}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await readApiErrorMessage(res))
      const json = await res.json().catch(() => ({ ok: true }))
      await mutate()
      sync.emit("uploads:changed")
      // Best-effort: notify other pages to refetch
      try {
        sync.emit("activities:changed")
        sync.emit("calendar:changed")
        sync.emit("content:changed")
        sync.emit("crm:companies:changed")
        sync.emit("budget:changed")
        sync.emit("jobs:changed")
      } catch {}
      return json
    },
    refresh: async () => { await mutate(); sync.emit('uploads:changed') },
  }
}

export function useJobsApi() {
  const { data, isLoading, error, mutate } = useSWR('/jobs', async (url) => {
    await wakeBackend().catch(() => {})
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
    getJob: async (jobId: number) => {
      await wakeBackend().catch(() => {})
      const res = await authFetch(`/jobs/${jobId}`)
      if (!res.ok) throw new Error(await readApiErrorMessage(res))
      return await res.json()
    },
    downloadJobErrorsCsv: async (jobId: number) => {
      await wakeBackend().catch(() => {})
      const res = await authFetch(`/jobs/${jobId}/errors.csv`)
      if (!res.ok) throw new Error(await readApiErrorMessage(res))
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `import-errors-${jobId}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
    cancelJob: async (jobId: number) => {
      await wakeBackend().catch(() => {})
      const res = await authFetch(`/jobs/${jobId}/cancel`, { method: 'POST' })
      if (!res.ok) throw new Error(await readApiErrorMessage(res))
      await mutate()
      sync.emit('jobs:changed')
    },
  }
}



