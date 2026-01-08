"use client"

import useSWR from "swr"
import * as React from "react"
import { userCategoriesAPI, type UserCategory as APIUserCategory } from "@/lib/api"

export type UserCategory = APIUserCategory

const STORAGE_KEY = "userCategories"

const fetcher = async () => {
  try {
    const cats = await userCategoriesAPI.get()
    return cats
  } catch {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
      return raw ? (JSON.parse(raw) as UserCategory[]) : []
    } catch {
      return []
    }
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


