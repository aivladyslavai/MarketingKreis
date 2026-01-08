export type UploadItem = {
  id: string
  original_name: string
  file_type: string
  file_size: number
  created_at: string
}

export type JobItem = {
  id: string
  type: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  created_at: string
  progress?: number
}

const g = globalThis as any
if (!g.__mk_mem_store) {
  g.__mk_mem_store = { uploads: [] as UploadItem[], jobs: [] as JobItem[] }
}

export const store: { uploads: UploadItem[]; jobs: JobItem[] } = g.__mk_mem_store

export function createJob(type: string): JobItem {
  const job: JobItem = {
    id: String(Date.now()) + Math.random().toString(36).slice(2),
    type,
    status: 'processing',
    created_at: new Date().toISOString(),
    progress: 0,
  }
  store.jobs.unshift(job)
  // simulate progress
  const interval = setInterval(() => {
    if (!job.progress && job.progress !== 0) return
    job.progress = Math.min(100, (job.progress || 0) + 20)
    if (job.progress >= 100) {
      job.status = 'completed'
      clearInterval(interval)
      delete job.progress
    }
  }, 300)
  return job
}










