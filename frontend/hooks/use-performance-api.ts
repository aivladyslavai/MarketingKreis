"use client"

import useSWR from 'swr'
import { authFetch } from '@/lib/api'

export interface PerformanceMetrics {
  id: string
  activity_id?: string
  date: string
  impressions?: number
  clicks?: number
  leads?: number
  conversions?: number
  cost?: number
  revenue?: number
  created_at?: string
  updated_at?: string
}

const fetcher = async (url: string): Promise<PerformanceMetrics[]> => {
  const res = await authFetch(url)
  if (!res.ok) {
    throw new Error(`Performance API error: ${res.status}`)
  }
  return (await res.json()) as PerformanceMetrics[]
}

export function usePerformanceApi() {
  const { data, error, isLoading, mutate } = useSWR('/performance', fetcher, {
    refreshInterval: 120000,
    revalidateOnFocus: false,
  })

  const createMetric = async (metric: Omit<PerformanceMetrics, 'id'>) => {
    const res = await authFetch('/performance', {
      method: 'POST',
      body: JSON.stringify(metric),
    })
    if (!res.ok) {
      throw new Error(`Performance create error: ${res.status}`)
    }
    const newMetric = (await res.json()) as PerformanceMetrics
    mutate()
    return newMetric
  }

  const updateMetric = async (id: string, updates: Partial<PerformanceMetrics>) => {
    const res = await authFetch(`/performance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      throw new Error(`Performance update error: ${res.status}`)
    }
    const updated = (await res.json()) as PerformanceMetrics
    mutate()
    return updated
  }

  return {
    metrics: data || [],
    isLoading,
    error,
    createMetric,
    updateMetric,
    refresh: mutate,
  }
}



