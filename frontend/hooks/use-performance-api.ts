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

const fetcher = (url: string) => authFetch<PerformanceMetrics[]>(url)

export function usePerformanceApi() {
  const { data, error, isLoading, mutate } = useSWR('/performance', fetcher, {
    refreshInterval: 120000,
    revalidateOnFocus: false,
  })

  const createMetric = async (metric: Omit<PerformanceMetrics, 'id'>) => {
    const newMetric = await authFetch<PerformanceMetrics>('/performance', {
      method: 'POST',
      body: JSON.stringify(metric),
    })
    mutate()
    return newMetric
  }

  const updateMetric = async (id: string, updates: Partial<PerformanceMetrics>) => {
    const updated = await authFetch<PerformanceMetrics>(`/performance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
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



