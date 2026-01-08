"use client"

import useSWR from 'swr'
import { authFetch } from '@/lib/api'
import { sync } from '@/lib/sync'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: string | Date
  end?: string | Date
  type: 'meeting' | 'deadline' | 'event' | 'reminder'
  attendees?: string[]
  location?: string
  color?: string
  category?: string
  status?: 'PLANNED' | 'DONE' | 'DELAYED' | 'CANCELLED'
  // simple RRULE-like structure stored client-side when backend lacks support
  recurrence?: { freq: 'daily' | 'weekly' | 'monthly'; interval?: number; count?: number; until?: string }
  created_at?: string
  updated_at?: string
}

// SWR fetcher: ensure we return parsed JSON, not Response
const fetcher = async (url: string): Promise<any> => {
  const res = await authFetch(url)
  if (!res.ok) return []
  try {
    return await res.json()
  } catch {
    return []
  }
}

export function useCalendarApi() {
  const { data, error, isLoading, mutate } = useSWR('/calendar', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  // Persist colors locally so UI can render chosen color even if backend doesn't store it
  const STORAGE_KEY = 'mk_calendar_colors'
  const STORAGE_CAT_KEY = 'mk_calendar_categories'
  const STORAGE_DESC_KEY = 'mk_calendar_descriptions'
  const STORAGE_REC_KEY = 'mk_calendar_recurrences'
  const STORAGE_STATUS_KEY = 'mk_calendar_status'
  const STORAGE_EXC_KEY = 'mk_calendar_exceptions' // { [id]: string[] ISO dates }
  const loadColorMap = (): Record<string, string> => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
  }
  const saveColorMap = (map: Record<string, string>) => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)) } catch {}
  }
  const setEventColor = (id: string, color?: string) => {
    if (!id || !color) return
    const map = loadColorMap()
    map[id] = color
    saveColorMap(map)
  }
  const removeEventColor = (id: string) => {
    const map = loadColorMap()
    if (map[id]) { delete map[id]; saveColorMap(map) }
  }

  const loadCategoryMap = (): Record<string, string> => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(STORAGE_CAT_KEY) || '{}') } catch { return {} }
  }
  const saveCategoryMap = (map: Record<string, string>) => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(STORAGE_CAT_KEY, JSON.stringify(map)) } catch {}
  }
  const setEventCategory = (id: string, category?: string) => {
    if (!id || !category) return
    const map = loadCategoryMap()
    map[id] = category
    saveCategoryMap(map)
  }
  const removeEventCategory = (id: string) => {
    const map = loadCategoryMap()
    if (map[id]) { delete map[id]; saveCategoryMap(map) }
  }

  // Recurrence + Status (client-side persistence layers)
  const loadMap = (key: string): Record<string, any> => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} }
  }
  const saveMap = (key: string, value: Record<string, any>) => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }
  const setEventRecurrence = (id: string, rec?: CalendarEvent['recurrence']) => {
    const map = loadMap(STORAGE_REC_KEY)
    if (rec) map[id] = rec; else delete map[id]
    saveMap(STORAGE_REC_KEY, map)
  }
  const setEventStatus = (id: string, status?: CalendarEvent['status']) => {
    const map = loadMap(STORAGE_STATUS_KEY)
    if (status) map[id] = status; else delete map[id]
    saveMap(STORAGE_STATUS_KEY, map)
  }
  const addExceptionDate = (id: string, isoDate: string) => {
    const map = loadMap(STORAGE_EXC_KEY) as Record<string, string[]>
    const arr = Array.isArray(map[id]) ? map[id] : []
    if (!arr.includes(isoDate)) arr.push(isoDate)
    map[id] = arr
    saveMap(STORAGE_EXC_KEY, map)
  }
  const getExceptions = (id: string): string[] => {
    const map = loadMap(STORAGE_EXC_KEY) as Record<string, string[]>
    return Array.isArray(map[id]) ? map[id] : []
  }

  // Persist descriptions locally because backend list endpoint doesn't return them yet
  const loadDescMap = (): Record<string, string> => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(STORAGE_DESC_KEY) || '{}') } catch { return {} }
  }
  const saveDescMap = (map: Record<string, string>) => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(STORAGE_DESC_KEY, JSON.stringify(map)) } catch {}
  }
  const setEventDescription = (id: string, description?: string) => {
    if (!id || !description) return
    const map = loadDescMap()
    map[id] = description
    saveDescMap(map)
  }
  const removeEventDescription = (id: string) => {
    const map = loadDescMap()
    if (map[id]) { delete map[id]; saveDescMap(map) }
  }

  const createEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    const res = await authFetch('/calendar', { method: 'POST', body: JSON.stringify(event) })
    const newEvent = await res.json().catch(() => null)
    // Save chosen color/category locally for future renders
    if (newEvent?.id && (event as any).color) setEventColor(String(newEvent.id), (event as any).color as string)
    if (newEvent?.id && (event as any).category) setEventCategory(String(newEvent.id), (event as any).category as string)
    if (newEvent?.id && (event as any).description) setEventDescription(String(newEvent.id), (event as any).description as string)
    await mutate()
    sync.emit('calendar:changed')
    return newEvent
  }

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const res = await authFetch(`/calendar/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
    const updated = await res.json().catch(() => null)
    if (updates.color) setEventColor(id, updates.color)
    if (updates.category) setEventCategory(id, updates.category)
    if ((updates as any).description) setEventDescription(id, (updates as any).description as string)
    if ((updates as any).recurrence) setEventRecurrence(id, (updates as any).recurrence as any)
    if ((updates as any).status) setEventStatus(id, (updates as any).status as any)
    await mutate()
    sync.emit('calendar:changed')
    return updated
  }

  const deleteEvent = async (id: string) => {
    await authFetch(`/calendar/${id}`, {
      method: 'DELETE',
    })
    removeEventColor(id)
    removeEventCategory(id)
    removeEventDescription(id)
    await mutate()
    sync.emit('calendar:changed')
  }

  // Normalize to always be an array (some backends may wrap as {items: []})
  const normalized: CalendarEvent[] = (() => {
    const list: CalendarEvent[] = Array.isArray(data) ? (data as CalendarEvent[]) : (data?.items ?? [])
    const colors = loadColorMap()
    const cats = loadCategoryMap()
    const descs = loadDescMap()
    const recs = loadMap(STORAGE_REC_KEY)
    const statuses = loadMap(STORAGE_STATUS_KEY)
    return list.map((e) => ({ 
      ...e, 
      color: colors[String(e.id)] || (e as any).color, 
      category: cats[String(e.id)] || (e as any).category,
      description: (e as any).description || descs[String(e.id)],
      recurrence: (e as any).recurrence || recs[String(e.id)],
      status: (e as any).status || statuses[String(e.id)],
    }))
  })()

  if (typeof window !== 'undefined') {
    sync.on('global:refresh', () => mutate())
    sync.on('calendar:changed', () => mutate())
  }

  return {
    events: normalized,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    addExceptionDate,
    getExceptions,
    refresh: async () => { await mutate(); sync.emit('calendar:changed') },
  }
}



