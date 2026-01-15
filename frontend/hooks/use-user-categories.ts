"use client"

import useSWR from "swr"
import * as React from "react"
import { userCategoriesAPI, type UserCategory as APIUserCategory } from "@/lib/api"

export type UserCategory = APIUserCategory

const STORAGE_KEY = "userCategories"
const HYDRATE_KEY = "userCategories:hydratedToBackend"

const fetcher = async () => {
  const readLocal = (): UserCategory[] => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
      return raw ? (JSON.parse(raw) as UserCategory[]) : []
    } catch {
      return []
    }
  }

  try {
    const cats = await userCategoriesAPI.get()
    if (Array.isArray(cats) && cats.length > 0) {
      try {
        if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
      } catch {}
      return cats
    }

    // If backend returns empty but we have local categories (older behavior / offline),
    // keep UI consistent and best-effort sync them to backend once.
    const localCats = readLocal()
    if (localCats.length > 0) {
      try {
        const ss = typeof window !== "undefined" ? window.sessionStorage : null
        const already = ss?.getItem(HYDRATE_KEY)
        if (!already) {
          ss?.setItem(HYDRATE_KEY, "1")
          await userCategoriesAPI.put(localCats)
        }
      } catch {}
      return localCats
    }
    return cats
  } catch {
    return readLocal()
  }
}

export function useUserCategories() {
  const { data, error, isLoading, mutate } = useSWR<UserCategory[]>("/user/categories", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
    fallbackData: (() => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
        return raw ? (JSON.parse(raw) as UserCategory[]) : []
      } catch { return [] }
    })(),
  })

  const save = React.useCallback(async (next: UserCategory[]) => {
    // optimistic update
    mutate(next, false)
    try {
      const saved = await userCategoriesAPI.put(next)
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      mutate(saved, false)
    } catch {
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      mutate(next, false)
    }
  }, [mutate])

  const reset = React.useCallback(() => {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
    mutate([], false)
  }, [mutate])

  return { categories: data || [], isLoading, error, save, reset, mutate }
}


