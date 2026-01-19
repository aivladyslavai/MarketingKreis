"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  contentItemsAPI,
  type ContentItemCreateDTO,
  type ContentItemDTO,
  type ContentItemStatus,
  type ContentItemsListParams,
  type ContentItemUpdateDTO,
} from "@/lib/api"
import { sync } from "@/lib/sync"

export interface ContentItem {
  id: number
  title: string
  channel: string
  format?: string
  status: ContentItemStatus
  tags: string[]
  brief?: string
  body?: string
  tone?: string
  language?: string
  dueAt?: Date
  scheduledAt?: Date
  publishedAt?: Date
  companyId?: number
  projectId?: number
  activityId?: number
  ownerId?: number | null
  owner?: { id: number; email: string; role: string } | null
  blockedReason?: string
  blockedBy?: string[]
  createdAt?: Date
  updatedAt?: Date
}

function mapDto(it: ContentItemDTO): ContentItem {
  return {
    id: it.id,
    title: it.title,
    channel: it.channel,
    format: it.format || undefined,
    status: it.status,
    tags: Array.isArray(it.tags) ? it.tags : [],
    brief: it.brief || undefined,
    body: it.body || undefined,
    tone: it.tone || undefined,
    language: it.language || undefined,
    dueAt: it.due_at ? new Date(it.due_at) : undefined,
    scheduledAt: it.scheduled_at ? new Date(it.scheduled_at) : undefined,
    publishedAt: it.published_at ? new Date(it.published_at) : undefined,
    companyId: it.company_id ?? undefined,
    projectId: it.project_id ?? undefined,
    activityId: it.activity_id ?? undefined,
    ownerId: it.owner_id ?? null,
    owner: (it.owner as any) || null,
    blockedReason: it.blocked_reason || undefined,
    blockedBy: Array.isArray(it.blocked_by) ? it.blocked_by : undefined,
    createdAt: it.created_at ? new Date(it.created_at) : undefined,
    updatedAt: it.updated_at ? new Date(it.updated_at) : undefined,
  }
}

export function useContentItems(listParams?: ContentItemsListParams) {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const paramsKey = useMemo(() => JSON.stringify(listParams || {}), [listParams])

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await contentItemsAPI.list(listParams).catch(() => [] as ContentItemDTO[])
      setItems((res || []).map(mapDto))
    } catch (e: any) {
      setItems([])
      setError(e?.message || "Failed to load content items")
    } finally {
      setLoading(false)
    }
  }, [paramsKey])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    const u1 = sync.on("global:refresh", () => refetch())
    const u2 = sync.on("content:changed", () => refetch())
    return () => {
      u1()
      u2()
    }
  }, [refetch])

  const createItem = async (payload: ContentItemCreateDTO) => {
    const created = await contentItemsAPI.create(payload)
    const mapped = mapDto(created)
    setItems((prev) => [mapped, ...prev])
    try {
      sync.emit("content:changed")
    } catch {}
    return mapped
  }

  const updateItem = async (id: number, updates: ContentItemUpdateDTO) => {
    try {
      const updated = await contentItemsAPI.update(id, updates)
      const mapped = mapDto(updated)
      setItems((prev) => prev.map((it) => (it.id === id ? mapped : it)))
      try {
        sync.emit("content:changed")
      } catch {}
      return mapped
    } catch (e) {
      await refetch()
      throw e
    }
  }

  const deleteItem = async (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    try {
      await contentItemsAPI.delete(id)
      try {
        sync.emit("content:changed")
      } catch {}
    } catch (e) {
      await refetch()
      throw e
    }
  }

  return { items, loading, error, refetch, createItem, updateItem, deleteItem }
}

