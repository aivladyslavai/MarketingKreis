"use client"

import useSWR from "swr"
import { type Activity } from "@/components/circle/radial-circle"
import { requestLocal } from "@/lib/api"
import { sync } from "@/lib/sync"
import * as React from "react"

const fetcher = async () => {
  try {
    // Всегда идём через Next.js proxy /api/activities, чтобы куки авторизации
    // корректно доходили до бекенда даже в продакшене (Vercel).
    return await requestLocal<Activity[]>("/api/activities")
  } catch {
    console.error("Failed to load activities via /api/activities")
    return []
  }
}

export function useActivities() {
    const { data, error, isLoading, mutate } = useSWR("/api/activities", fetcher, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })

    // Local cache to persist the exact chosen category names per activity id.
    const CAT_STORAGE_KEY = 'mk_activity_categories'
    const STAGE_STORAGE_KEY = 'mk_activity_stage'
    const CL_STORAGE_KEY = 'mk_activity_checklists'
    const loadCategoryMap = (): Record<string, string> => {
        if (typeof window === 'undefined') return {}
        try { return JSON.parse(localStorage.getItem(CAT_STORAGE_KEY) || '{}') } catch { return {} }
    }
    const saveCategoryMap = (map: Record<string, string>) => {
        if (typeof window === 'undefined') return
        try { localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(map)) } catch {}
    }
    const setActivityCategory = (id: string, category?: string) => {
        if (!id || !category) return
        const map = loadCategoryMap()
        map[id] = category
        saveCategoryMap(map)
    }
    const removeActivityCategory = (id: string) => {
        const map = loadCategoryMap()
        if (map[id]) { delete map[id]; saveCategoryMap(map) }
    }

    // Stage (Draft -> Review -> Publish)
    const loadStageMap = (): Record<string, string> => {
        if (typeof window === 'undefined') return {}
        try { return JSON.parse(localStorage.getItem(STAGE_STORAGE_KEY) || '{}') } catch { return {} }
    }
    const saveStageMap = (map: Record<string, string>) => {
        if (typeof window === 'undefined') return
        try { localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify(map)) } catch {}
    }
    const setActivityStage = (id: string, stage?: string) => {
        if (!id || !stage) return
        const map = loadStageMap()
        map[id] = stage
        saveStageMap(map)
    }
    const removeActivityStage = (id: string) => {
        const map = loadStageMap()
        if (map[id]) { delete map[id]; saveStageMap(map) }
    }

    // Checklists
    const loadChecklists = (): Record<string, string[]> => {
        if (typeof window === 'undefined') return {}
        try { return JSON.parse(localStorage.getItem(CL_STORAGE_KEY) || '{}') } catch { return {} }
    }
    const saveChecklists = (map: Record<string, string[]>) => {
        if (typeof window === 'undefined') return
        try { localStorage.setItem(CL_STORAGE_KEY, JSON.stringify(map)) } catch {}
    }
    const setActivityChecklist = (id: string, list?: string[]) => {
        if (!id) return
        const map = loadChecklists()
        if (list && list.length) map[id] = Array.from(new Set(list))
        else delete map[id]
        saveChecklists(map)
    }

    // Merge categories from cache to ensure rendering on the selected ring
    const activities: Activity[] = (() => {
        const list: any[] = Array.isArray(data) ? (data as any[]) : []
        const cats = loadCategoryMap()
        const stages = loadStageMap()
        const cls = loadChecklists()
        const parseDate = (v: any): Date | undefined => {
            if (v == null || v === "") return undefined
            if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v
            const d = new Date(v)
            return Number.isNaN(d.getTime()) ? undefined : d
        }
        return list.map((a) => {
            const id = String((a as any)?.id ?? "")
            return {
                ...a,
                // Normalize dates for components like RadialCircle (expects Date objects)
                start: parseDate((a as any).start),
                end: parseDate((a as any).end),
                category: cats[id] || (a as any).category,
                // attach local workflow metadata
                // @ts-ignore
                stage: (stages[id] as any) || (a as any).stage || 'DRAFT',
                // @ts-ignore
                checklist: (cls[id] as any) || (a as any).checklist || [],
            }
        }) as any
    })()

    const addActivity = React.useCallback(async (activity: Omit<Activity, "id">) => {
        const created = await requestLocal<any>("/api/activities", {
          method: "POST",
          body: JSON.stringify(activity),
        }).catch(() => null)
        // Persist chosen category even if backend normalizes it
        if (created?.id) {
            if ((activity as any).category) setActivityCategory(String(created.id), String((activity as any).category))
            if ((activity as any).stage) setActivityStage(String(created.id), String((activity as any).stage))
            if ((activity as any).checklist) setActivityChecklist(String(created.id), (activity as any).checklist as any)
        }
        await mutate()
        sync.emit('activities:changed')
        return created
    }, [mutate])

    const updateActivity = React.useCallback(async (activityId: string, updates: Partial<Activity>) => {
        const updated = await requestLocal<any>(`/api/activities/${activityId}`, {
          method: "PUT",
          body: JSON.stringify(updates),
        }).catch(() => null)
        if ((updates as any).category) setActivityCategory(String(activityId), String((updates as any).category))
        if ((updates as any).stage) setActivityStage(String(activityId), String((updates as any).stage))
        if ((updates as any).checklist) setActivityChecklist(String(activityId), (updates as any).checklist as any)
        await mutate()
        sync.emit('activities:changed')
        return updated
    }, [mutate])

    const deleteActivity = React.useCallback(async (activityId: string) => {
        await requestLocal(`/api/activities/${activityId}`, { method: "DELETE" }).catch(() => null)
        removeActivityCategory(String(activityId))
        removeActivityStage(String(activityId))
        const cls = loadChecklists()
        if (cls[String(activityId)]) {
            delete cls[String(activityId)]
            saveChecklists(cls)
        }
        await mutate()
        sync.emit('activities:changed')
    }, [mutate])

    const moveActivity = React.useCallback(async (activityId: string, newDate: Date) => {
        return updateActivity(activityId, { start: newDate })
    }, [updateActivity])

    React.useEffect(() => {
        const u1 = sync.on('global:refresh', () => mutate())
        const u2 = sync.on('activities:changed', () => mutate())
        return () => { u1(); u2() }
    }, [mutate])

    return {
      activities,
      loading: isLoading,
      // Если что-то пошло не так, показываем мягкую ошибку вместо падения всего экрана
      error: error ? (error as Error).message : null,
      addActivity,
      updateActivity,
      deleteActivity,
      moveActivity,
      refresh: async () => { await mutate(); sync.emit('activities:changed') },
      refetch: async () => { await mutate(); sync.emit('activities:changed') },
    }
}

// Mock данные по умолчанию
const ACTIVITIES_STORAGE_KEY = 'mk_activities'
const defaultMockActivities: Activity[] = [
  {
    id: '1',
    title: 'Frühlingskampagne',
    category: 'VERKAUFSFOERDERUNG',
    status: 'ACTIVE',
    weight: 80,
    budgetCHF: 25000,
    expectedLeads: 150,
    start: new Date(2024, 2, 15), // March 15, 2024
    end: new Date(2024, 4, 15), // May 15, 2024
    ownerId: 'user1',
    owner: { name: 'Max Mustermann' },
    notes: 'Fokus auf neue Produktlinie',
  },
  {
    id: '2',
    title: 'Brand Awareness Q2',
    category: 'IMAGE',
    status: 'PLANNED',
    weight: 60,
    budgetCHF: 40000,
    expectedLeads: 80,
    start: new Date(2024, 3, 1), // April 1, 2024
    end: new Date(2024, 5, 30), // June 30, 2024
    ownerId: 'user2',
    owner: { name: 'Anna Weber' },
  },
  {
    id: '3',
    title: 'Recruiting Drive',
    category: 'EMPLOYER_BRANDING',
    status: 'ACTIVE',
    weight: 70,
    budgetCHF: 15000,
    expectedLeads: 50,
    start: new Date(2024, 1, 1), // February 1, 2024
    end: new Date(2024, 7, 31), // August 31, 2024
    ownerId: 'user1',
    owner: { name: 'Max Mustermann' },
  },
  {
    id: '4',
    title: 'Newsletter Campaign',
    category: 'KUNDENPFLEGE',
    status: 'PLANNED',
    weight: 30,
    budgetCHF: 8000,
    expectedLeads: 25,
    start: new Date(2024, 3, 15), // April 15, 2024
    ownerId: 'user3',
    owner: { name: 'Sophie Schmidt' },
  },
  {
    id: '5',
    title: 'Sommerkampagne Vorbereitung',
    category: 'VERKAUFSFOERDERUNG',
    status: 'PLANNED',
    weight: 90,
    budgetCHF: 35000,
    expectedLeads: 200,
    start: new Date(2024, 5, 1), // June 1, 2024
    ownerId: 'user2',
    owner: { name: 'Anna Weber' },
  },
  {
    id: '6',
    title: 'Webinar Series',
    category: 'IMAGE',
    status: 'PLANNED',
    weight: 65,
    budgetCHF: 12000,
    expectedLeads: 75,
    start: new Date(2024, 4, 10), // May 10, 2024
    ownerId: 'user3',
    owner: { name: 'Sophie Schmidt' },
  },
]

// Функция для загрузки активностей из localStorage
const loadActivitiesFromStorage = (): Activity[] => {
  if (typeof window === 'undefined') return defaultMockActivities
  
  try {
    const stored = localStorage.getItem(ACTIVITIES_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Преобразуем даты из строк обратно в Date объекты
      return parsed.map((activity: any) => ({
        ...activity,
        start: activity.start ? new Date(activity.start) : undefined,
        end: activity.end ? new Date(activity.end) : undefined,
      }))
    }
  } catch (error) {
    console.warn('Не удалось загрузить активности из localStorage:', error)
  }
  
  return defaultMockActivities
}

// Функция для сохранения активностей в localStorage
const saveActivitiesToStorage = (activities: Activity[]) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities))
  } catch (error) {
    console.warn('Не удалось сохранить активности в localStorage:', error)
  }
}

// BELOW: legacy localStorage-based mock hook and helpers were removed to avoid
// duplicate definitions and ensure a single API-driven source of truth.
