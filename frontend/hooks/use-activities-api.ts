"use client"

import useSWR from "swr"
import { requestLocal } from "@/lib/api"

export interface Activity {
  id: string
  title: string
  category: "VERKAUFSFOERDERUNG" | "IMAGE" | "EMPLOYER_BRANDING" | "KUNDENPFLEGE"
  status: "ACTIVE" | "PLANNED" | "COMPLETED" | "CANCELLED"
  weight?: number
  budgetCHF?: number
  expectedLeads?: number
  start?: string | Date
  end?: string | Date
  ownerId?: string
  owner?: { name: string }
  notes?: string
  created_at?: string
  updated_at?: string
}

const fetcher = async () => {
  // Always go through the Next.js proxy so auth cookies are forwarded.
  return requestLocal<Activity[]>("/api/activities").catch(() => [])
}

export function useActivitiesApi() {
  const { data, error, isLoading, mutate } = useSWR("/api/activities", fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  const createActivity = async (activity: Omit<Activity, "id">) => {
    const created = await requestLocal<Activity>("/api/activities", {
      method: "POST",
      body: JSON.stringify(activity),
    }).catch(() => null as any)
    await mutate()
    return created
  }

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    const updated = await requestLocal<Activity>(`/api/activities/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }).catch(() => null as any)
    await mutate()
    return updated
  }

  const deleteActivity = async (id: string) => {
    await requestLocal(`/api/activities/${id}`, { method: "DELETE" }).catch(() => null as any)
    await mutate()
  }

  return {
    activities: (data as Activity[]) || [],
    isLoading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    refresh: mutate,
  }
}

// Default export helper for components that prefer default import style
export default function useActivitiesApiHook() {
  return useActivitiesApi()
}

