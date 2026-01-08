"use client"

import { useEffect, useRef, useState } from 'react'
import api from '@/lib/api'

type JobStatus = 'queued' | 'started' | 'finished' | 'failed'

export function useExportJobs() {
  const [jobId, setJobId] = useState<number | null>(null)
  const [status, setStatus] = useState<JobStatus | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<NodeJS.Timeout | null>(null)

  const startPolling = (id: number) => {
    setJobId(id)
    setStatus('queued')
    setResult(null)
    setError(null)
  }

  useEffect(() => {
    if (!jobId) return
    const poll = async () => {
      try {
        const data = await api.jobs.get(jobId)
        setStatus(data.status)
        setResult(data.result)
        if (data.status === 'finished' || data.status === 'failed') {
          if (timer.current) clearInterval(timer.current)
          timer.current = null
        }
      } catch (e: any) {
        setError(e?.message || 'Polling failed')
        if (timer.current) clearInterval(timer.current)
        timer.current = null
      }
    }
    poll()
    timer.current = setInterval(poll, 2000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [jobId])

  const enqueueExportActivitiesCsv = async () => {
    const data = await api.request<any>('/export/activities.csv')
    startPolling(data.jobId)
    return data.jobId as number
  }

  return {
    jobId,
    status,
    result,
    error,
    enqueueExportActivitiesCsv,
  }
}


