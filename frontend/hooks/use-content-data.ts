"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { contentTasksAPI, type ContentTaskDTO, type ContentTasksListParams } from "@/lib/api"
import { sync } from "@/lib/sync"

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED"
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

export interface ContentTask {
  id: string
  backendId?: number
  title: string
  channel: string
  format?: string
  deadline?: Date
  status: TaskStatus
  priority: TaskPriority
  notes?: string
  ownerId?: string | null
  owner?: {
    id: string
    name: string
    avatar?: string
  }
  activityId?: string
  createdAt?: Date
  updatedAt?: Date
}

function displayNameFromEmail(email?: string | null) {
  const e = String(email || "").trim()
  if (!e) return "Unassigned"
  return e
}

function mapDto(t: ContentTaskDTO): ContentTask {
  const ownerEmail = (t as any)?.owner?.email || null
  const ownerId = t.owner_id != null ? String(t.owner_id) : null
  return {
    id: `content-${t.id}`,
    backendId: t.id,
    title: t.title,
    channel: t.channel,
    format: t.format || undefined,
    deadline: t.deadline ? new Date(t.deadline) : undefined,
    status: (t.status as TaskStatus) || "TODO",
    priority: (t.priority as TaskPriority) || "MEDIUM",
    notes: t.notes || undefined,
    ownerId,
    owner: ownerEmail
      ? { id: ownerId || "", name: displayNameFromEmail(ownerEmail) }
      : undefined,
    activityId: t.activity_id != null ? String(t.activity_id) : undefined,
    createdAt: t.created_at ? new Date(t.created_at) : undefined,
    updatedAt: t.updated_at ? new Date(t.updated_at) : undefined,
  }
}

export function useContentData(listParams?: ContentTasksListParams) {
  const [tasks, setTasks] = useState<ContentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const paramsKey = useMemo(() => JSON.stringify(listParams || {}), [listParams])

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const backendTasks = await contentTasksAPI.list(listParams).catch(() => [] as ContentTaskDTO[])
      const mapped = (backendTasks || []).map(mapDto)
      setTasks(mapped)
    } catch (err: any) {
      setTasks([])
      setError(err?.message || "Failed to load content tasks")
    } finally {
      setLoading(false)
    }
  }, [paramsKey])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    const u1 = sync.on("global:refresh", () => fetchTasks())
    const u2 = sync.on("content:changed", () => fetchTasks())
    return () => {
      u1()
      u2()
    }
  }, [fetchTasks])

  const addTask = async (
    newTask: Omit<ContentTask, "id" | "backendId" | "createdAt" | "updatedAt">
  ) => {
    const payload: any = {
      title: newTask.title,
      channel: newTask.channel,
      format: newTask.format ?? null,
      status: newTask.status,
      priority: newTask.priority,
      notes: newTask.notes ?? null,
      deadline: newTask.deadline ? newTask.deadline.toISOString() : null,
      activity_id: newTask.activityId ? Number(newTask.activityId) || null : null,
    }

    // Admin can explicitly assign/unassign; for non-admin backend will ignore.
    if (newTask.ownerId === "unassigned") payload.owner_id = null
    else if (typeof newTask.ownerId === "string" && newTask.ownerId.trim()) payload.owner_id = Number(newTask.ownerId)

    const created = await contentTasksAPI.create(payload)
    const task = mapDto(created)
    setTasks((prev) => [task, ...prev])
    try {
      sync.emit("content:changed")
    } catch {}
    return task
  }

  const updateTask = async (taskId: string, updates: Partial<ContentTask>) => {
    const current = tasks.find((t) => t.id === taskId)
    if (!current?.backendId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: new Date() } : t))
      )
      return
    }

    // optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: new Date() } : t))
    )

    const payload: any = {}
    if (updates.title !== undefined) payload.title = updates.title
    if (updates.channel !== undefined) payload.channel = updates.channel
    if (updates.format !== undefined) payload.format = updates.format ?? null
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.priority !== undefined) payload.priority = updates.priority
    if (updates.notes !== undefined) payload.notes = updates.notes ?? null
    if (updates.deadline !== undefined) payload.deadline = updates.deadline ? updates.deadline.toISOString() : null
    if (updates.activityId !== undefined) payload.activity_id = updates.activityId ? Number(updates.activityId) : null
    if (updates.ownerId !== undefined) {
      if (updates.ownerId === "unassigned" || updates.ownerId === null) payload.owner_id = null
      else if (typeof updates.ownerId === "string" && updates.ownerId.trim()) payload.owner_id = Number(updates.ownerId)
    }

    try {
      const updated = await contentTasksAPI.update(current.backendId, payload)
      const mapped = mapDto(updated)
      setTasks((prev) => prev.map((t) => (t.id === taskId ? mapped : t)))
      try {
        sync.emit("content:changed")
      } catch {}
    } catch (err) {
      // best-effort refetch to restore truth
      fetchTasks()
    }
  }

  const deleteTask = async (taskId: string) => {
    const current = tasks.find((t) => t.id === taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    if (current?.backendId) {
      try {
        await contentTasksAPI.delete(current.backendId)
        try {
          sync.emit("content:changed")
        } catch {}
      } catch {
        fetchTasks()
      }
    }
  }

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  }
}
