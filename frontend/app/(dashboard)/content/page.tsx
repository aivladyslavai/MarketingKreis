"use client"

import { useMemo, useState, useEffect, useId } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, ArrowLeft, Filter, Download, Image, Video, Calendar as CalIcon, MoreHorizontal, User, File, Loader2 } from "lucide-react"
import Link from "next/link"
import { useModal } from "@/components/ui/modal/ModalProvider"
import { motion } from "framer-motion"
import { sync } from "@/lib/sync"
import { ResponsiveContainer, AreaChart, Area } from "recharts"
import { GlassSelect } from "@/components/ui/glass-select"
import { Input } from "@/components/ui/input"
import KanbanBoard, { type TaskStatus as KanbanStatus } from "@/components/kanban/kanban-board"
import { useContentData, type ContentTask } from "@/hooks/use-content-data"
import { useContentItems } from "@/hooks/use-content-items"
import { useAuth } from "@/hooks/use-auth"
import { adminAPI, type AdminUser } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentItemEditor } from "@/components/content/ContentItemEditor"
import { EditorialCalendar } from "@/components/content/EditorialCalendar"
import { ContentTemplatesAdmin } from "@/components/content/ContentTemplatesAdmin"
import { NotificationsPanel } from "@/components/content/NotificationsPanel"

type ContentStatus = "idea" | "draft" | "review" | "approved" | "published"

interface ContentItem {
  id: number
  title: string
  type: "blog" | "social" | "video" | "email" | "asset"
  status: ContentStatus
  assignee: string
  dueDate: string
  tags: string[]
  priority: "low" | "medium" | "high"
}

type TwoLevelTaxonomy = {
  channels: string[]
  formatsByChannel: Record<string, string[]>
  quickCombos: Array<{ channel: string; format: string }>
}

const DEFAULT_TWO_LEVEL_PRESETS: Array<{ channel: string; formats: string[] }> = [
  { channel: "Website", formats: ["Landing Page", "Blog", "Case Study"] },
  { channel: "Email", formats: ["Newsletter", "Automation", "Onboarding"] },
  { channel: "LinkedIn", formats: ["Post", "Carousel", "Video"] },
  { channel: "Meta", formats: ["Ads", "Creatives", "Retargeting"] },
  { channel: "Google", formats: ["Search Ads", "Display", "Performance Max"] },
  { channel: "PR", formats: ["List", "Press Kit", "Outreach"] },
]

function _normToken(v?: string | null) {
  return String(v ?? "").trim()
}

function buildTwoLevelTaxonomy(
  tasks: Array<{ channel?: string | null; format?: string | null }>
): TwoLevelTaxonomy {
  const channelByKey = new Map<string, string>()
  const formatsByChannelKey = new Map<string, Map<string, string>>() // channelKey -> (formatKey -> format)
  const pairCounts = new Map<string, number>() // channelKey||formatKey -> count

  const add = (channelRaw?: string | null, formatRaw?: string | null) => {
    const ch = _normToken(channelRaw)
    if (!ch) return
    const chKey = ch.toLowerCase()
    if (!channelByKey.has(chKey)) channelByKey.set(chKey, ch)

    const fmt = _normToken(formatRaw)
    if (!fmt) return
    const fmtKey = fmt.toLowerCase()
    let fmts = formatsByChannelKey.get(chKey)
    if (!fmts) {
      fmts = new Map<string, string>()
      formatsByChannelKey.set(chKey, fmts)
    }
    if (!fmts.has(fmtKey)) fmts.set(fmtKey, fmt)
    const pairKey = `${chKey}||${fmtKey}`
    pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1)
  }

  // Seed with defaults so UI has good suggestions even when list is empty/filtered.
  for (const p of DEFAULT_TWO_LEVEL_PRESETS) {
    add(p.channel, p.formats[0])
    for (const f of p.formats) add(p.channel, f)
  }
  for (const t of tasks) add(t.channel, t.format)

  const channels = Array.from(channelByKey.values()).sort((a, b) => a.localeCompare(b, "de"))

  const formatsByChannel: Record<string, string[]> = {}
  for (const ch of channels) {
    const chKey = ch.toLowerCase()
    const fmts = formatsByChannelKey.get(chKey)
    formatsByChannel[ch] = fmts ? Array.from(fmts.values()).sort((a, b) => a.localeCompare(b, "de")) : []
  }

  const quickCombos: Array<{ channel: string; format: string }> = []
  const seenCombos = new Set<string>()
  const pushCombo = (channel: string, format: string) => {
    const c = _normToken(channel)
    const f = _normToken(format)
    if (!c || !f) return
    const key = `${c.toLowerCase()}||${f.toLowerCase()}`
    if (seenCombos.has(key)) return
    seenCombos.add(key)
    quickCombos.push({ channel: c, format: f })
  }

  // Most common combos from tasks (best UX), then fall back to defaults.
  for (const pairKey of Array.from(pairCounts.keys()).sort((a, b) => (pairCounts.get(b) || 0) - (pairCounts.get(a) || 0))) {
    const [chKey, fmtKey] = pairKey.split("||")
    const ch = channelByKey.get(chKey) || chKey
    const fmts = formatsByChannelKey.get(chKey)
    const fmt = fmts?.get(fmtKey) || fmtKey
    pushCombo(ch, fmt)
    if (quickCombos.length >= 10) break
  }
  for (const p of DEFAULT_TWO_LEVEL_PRESETS) {
    for (const f of p.formats.slice(0, 2)) pushCombo(p.channel, f)
    if (quickCombos.length >= 12) break
  }

  return { channels, formatsByChannel, quickCombos }
}

interface TaskQuickCreateProps {
  defaultStatus: KanbanStatus
  taxonomy?: TwoLevelTaxonomy
  ownerOptions?: { value: string; label: string }[]
  defaultOwnerId?: string
  onCreate: (payload: {
    title: string
    channel: string
    format?: string
    status: KanbanStatus
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
    notes?: string
    deadline?: Date
    ownerId?: string
  }) => Promise<void> | void
}

function TaskQuickCreate({ defaultStatus, taxonomy, onCreate, ownerOptions, defaultOwnerId }: TaskQuickCreateProps) {
  const { closeModal } = useModal()
  const [title, setTitle] = useState("")
  const [channel, setChannel] = useState("Website")
  const [format, setFormat] = useState<string | undefined>("Landing Page")
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM")
  const [deadline, setDeadline] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [ownerId, setOwnerId] = useState<string>(defaultOwnerId || "")
  const [saving, setSaving] = useState(false)

  const channelListId = useId()
  const formatListId = useId()

  const channelSuggestions = useMemo(() => {
    const base =
      taxonomy?.channels && taxonomy.channels.length
        ? taxonomy.channels
        : DEFAULT_TWO_LEVEL_PRESETS.map((p) => p.channel)
    const uniq = new Set<string>()
    for (const v of base) {
      const t = _normToken(v)
      if (t) uniq.add(t)
    }
    return Array.from(uniq).sort((a, b) => a.localeCompare(b, "de"))
  }, [taxonomy])

  const allFormatSuggestions = useMemo(() => {
    const uniq = new Set<string>()
    const source = taxonomy?.formatsByChannel || {}
    for (const list of Object.values(source)) {
      for (const v of list) {
        const t = _normToken(v)
        if (t) uniq.add(t)
      }
    }
    if (uniq.size === 0) {
      for (const p of DEFAULT_TWO_LEVEL_PRESETS) for (const f of p.formats) uniq.add(f)
    }
    return Array.from(uniq).sort((a, b) => a.localeCompare(b, "de"))
  }, [taxonomy])

  const formatSuggestions = useMemo(() => {
    const ch = _normToken(channel)
    if (taxonomy && ch) {
      const key = ch.toLowerCase()
      const match = taxonomy.channels.find((c) => c.toLowerCase() === key)
      if (match) {
        const list = taxonomy.formatsByChannel[match] || []
        if (list.length) return list
      }
    }
    return allFormatSuggestions
  }, [taxonomy, channel, allFormatSuggestions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const ch = _normToken(channel) || "Website"
      const fmt = _normToken(format) || undefined
      await onCreate({
        title: title.trim(),
        channel: ch,
        format: fmt,
        status: defaultStatus,
        priority,
        notes: notes.trim() || undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        ownerId: ownerOptions && ownerOptions.length > 0 ? (ownerId || undefined) : undefined,
      })
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div className="space-y-1">
        <label className="text-xs text-slate-300">Titel</label>
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Q4 Launch Landingpage"
          className="text-sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Bereich (Level 1)</label>
          <Input
            value={channel}
            onChange={(e) => {
              const v = e.target.value
              setChannel(v)
              if (!_normToken(format)) {
                const key = _normToken(v).toLowerCase()
                const match = taxonomy?.channels?.find((c) => c.toLowerCase() === key)
                const next = match ? taxonomy?.formatsByChannel?.[match]?.[0] : undefined
                if (next) setFormat(next)
              }
            }}
            placeholder="z.B. Website, LinkedIn, Meta, PR…"
            className="text-sm"
            list={channelListId}
          />
          <datalist id={channelListId}>
            {channelSuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Format (Level 2)</label>
          <Input
            value={format || ""}
            onChange={(e) => setFormat(e.target.value || undefined)}
            placeholder="z.B. Landing Page, Newsletter, Carousel…"
            className="text-sm"
            list={formatListId}
          />
          <datalist id={formatListId}>
            {formatSuggestions.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
      </div>
      {taxonomy && taxonomy.quickCombos && taxonomy.quickCombos.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">Schnellwahl</div>
          <div className="flex flex-wrap gap-1.5">
            {taxonomy.quickCombos.slice(0, 10).map((p) => (
              <button
                key={`${p.channel}||${p.format}`}
                type="button"
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10"
                onClick={() => {
                  setChannel(p.channel)
                  setFormat(p.format)
                }}
                title={`${p.channel} · ${p.format}`}
              >
                <span className="min-w-0 truncate">{p.channel}</span>
                <span className="text-slate-500">/</span>
                <span className="min-w-0 truncate">{p.format}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Priorität</label>
          <GlassSelect
            value={priority}
            onChange={(v) => setPriority(v as any)}
            options={[
              { value: "LOW", label: "Niedrig" },
              { value: "MEDIUM", label: "Mittel" },
              { value: "HIGH", label: "Hoch" },
              { value: "URGENT", label: "Dringend" },
            ]}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Fällig am</label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="text-sm"
          />
        </div>
      </div>
      {ownerOptions && ownerOptions.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Zuständig</label>
          <GlassSelect
            value={ownerId}
            onChange={(v) => setOwnerId(v)}
            options={ownerOptions}
            placeholder="Zuweisen (optional)"
          />
        </div>
      )}
      <div className="space-y-1">
        <label className="text-xs text-slate-300">Notizen</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[60px] w-full rounded-md bg-slate-950/60 border border-slate-700 px-2 py-1.5 text-xs"
          placeholder="Kurzbeschreibung / nächste Schritte..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" size="sm" disabled={saving || !title.trim()}>
          {saving ? "Speichere..." : "Task erstellen"}
        </Button>
      </div>
    </form>
  )
}

function TaskEditForm({
  task,
  taxonomy,
  isAdmin,
  users,
  onSave,
  onDelete,
}: {
  task: ContentTask
  taxonomy?: TwoLevelTaxonomy
  isAdmin: boolean
  users: AdminUser[]
  onSave: (taskId: string, updates: Partial<ContentTask>) => Promise<void>
  onDelete: (taskId: string) => Promise<void> | void
}) {
  const { closeModal } = useModal()
  const [title, setTitle] = useState(task.title || "")
  const [channel, setChannel] = useState(task.channel || "Website")
  const [format, setFormat] = useState(task.format || "")
  const [status, setStatus] = useState<KanbanStatus>((task.status as any) || "TODO")
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">((task.priority as any) || "MEDIUM")
  const [deadline, setDeadline] = useState<string>(task.deadline ? task.deadline.toISOString().slice(0, 10) : "")
  const [notes, setNotes] = useState(task.notes || "")
  const [activityId, setActivityId] = useState(task.activityId || "")
  const [ownerId, setOwnerId] = useState<string>(() => {
    if (!isAdmin) return ""
    const v = task.ownerId
    if (v == null || String(v).trim() === "") return "unassigned"
    return String(v)
  })
  const [saving, setSaving] = useState(false)

  const channelListId = useId()
  const formatListId = useId()

  const channelSuggestions = useMemo(() => {
    const base =
      taxonomy?.channels && taxonomy.channels.length
        ? taxonomy.channels
        : DEFAULT_TWO_LEVEL_PRESETS.map((p) => p.channel)
    const uniq = new Set<string>()
    for (const v of base) {
      const t = _normToken(v)
      if (t) uniq.add(t)
    }
    return Array.from(uniq).sort((a, b) => a.localeCompare(b, "de"))
  }, [taxonomy])

  const allFormatSuggestions = useMemo(() => {
    const uniq = new Set<string>()
    const source = taxonomy?.formatsByChannel || {}
    for (const list of Object.values(source)) {
      for (const v of list) {
        const t = _normToken(v)
        if (t) uniq.add(t)
      }
    }
    if (uniq.size === 0) {
      for (const p of DEFAULT_TWO_LEVEL_PRESETS) for (const f of p.formats) uniq.add(f)
    }
    return Array.from(uniq).sort((a, b) => a.localeCompare(b, "de"))
  }, [taxonomy])

  const formatSuggestions = useMemo(() => {
    const ch = _normToken(channel)
    if (taxonomy && ch) {
      const key = ch.toLowerCase()
      const match = taxonomy.channels.find((c) => c.toLowerCase() === key)
      if (match) {
        const list = taxonomy.formatsByChannel[match] || []
        if (list.length) return list
      }
    }
    return allFormatSuggestions
  }, [taxonomy, channel, allFormatSuggestions])

  const ownerOptions = useMemo(() => {
    if (!isAdmin) return []
    return [
      { value: "unassigned", label: "— Unassigned —" },
      ...users.map((u) => ({ value: String(u.id), label: `${u.email} (${u.role})` })),
    ]
  }, [isAdmin, users])

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave(task.id, {
        title: title.trim(),
        channel: channel.trim() || "Website",
        format: format.trim() || undefined,
        status: status as any,
        priority: priority as any,
        notes: notes.trim() || undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        activityId: activityId.trim() || undefined,
        ownerId: isAdmin ? (ownerId || "unassigned") : undefined,
      })
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Titel</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Bereich (Level 1)</label>
          <Input
            value={channel}
            onChange={(e) => {
              const v = e.target.value
              setChannel(v)
              if (!_normToken(format)) {
                const key = _normToken(v).toLowerCase()
                const match = taxonomy?.channels?.find((c) => c.toLowerCase() === key)
                const next = match ? taxonomy?.formatsByChannel?.[match]?.[0] : undefined
                if (next) setFormat(next)
              }
            }}
            placeholder="z.B. Website, LinkedIn, Meta, PR…"
            list={channelListId}
          />
          <datalist id={channelListId}>
            {channelSuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Format (Level 2)</label>
          <Input
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            placeholder="z.B. Landing Page, Newsletter, Carousel…"
            list={formatListId}
          />
          <datalist id={formatListId}>
            {formatSuggestions.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Status</label>
          <GlassSelect
            value={status}
            onChange={(v) => setStatus(v as any)}
            options={[
              { value: "TODO", label: "TODO" },
              { value: "IN_PROGRESS", label: "IN PROGRESS" },
              { value: "REVIEW", label: "REVIEW" },
              { value: "APPROVED", label: "APPROVED" },
              { value: "PUBLISHED", label: "PUBLISHED" },
              { value: "ARCHIVED", label: "ARCHIVED" },
            ]}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Priorität</label>
          <GlassSelect
            value={priority}
            onChange={(v) => setPriority(v as any)}
            options={[
              { value: "LOW", label: "LOW" },
              { value: "MEDIUM", label: "MEDIUM" },
              { value: "HIGH", label: "HIGH" },
              { value: "URGENT", label: "URGENT" },
            ]}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Fällig am</label>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Deal/Activity ID (optional)</label>
          <Input value={activityId} onChange={(e) => setActivityId(e.target.value)} placeholder="z.B. 123" />
        </div>
        {isAdmin && (
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Zuständig</label>
            <GlassSelect value={ownerId} onChange={setOwnerId} options={ownerOptions} />
          </div>
        )}
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Notizen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[110px] w-full rounded-md bg-white/70 dark:bg-slate-900/60 border border-slate-300/60 dark:border-slate-700 px-3 py-2 text-sm"
            placeholder="Kurzbeschreibung / nächste Schritte..."
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
        <Button
          variant="destructive"
          onClick={async () => {
            if (!confirm("Task wirklich löschen?")) return
            await onDelete(task.id)
            closeModal()
          }}
        >
          Löschen
        </Button>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={closeModal}>
            Abbrechen
          </Button>
          <Button onClick={save} disabled={saving || !title.trim()}>
            {saving ? "Speichere..." : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ContentPage() {
  const { openModal, closeModal } = useModal()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin" || user?.role === "editor"
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [taskScope, setTaskScope] = useState<"mine" | "all">(() => {
    if (typeof window === "undefined") return "mine"
    const v = localStorage.getItem("content:taskScope")
    return v === "all" || v === "mine" ? (v as any) : "mine"
  })
  const [ownerFilter, setOwnerFilter] = useState<string>("all") // all | unassigned | <id>
  const [taskQ, setTaskQ] = useState<string>("")
  const [showPlanner, setShowPlanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deals, setDeals] = useState<any[]>([])
  // локальный список контент‑элементов как раньше (для KPI + Grid),
  // но тасковая система теперь опирается на useContentData
  const [contents, setContents] = useState<ContentItem[]>([
    { id: 1, title: "Q1 Marketing Blog Post", type: "blog", status: "draft", assignee: "Anna Schmidt", dueDate: "2024-01-20", tags: ["Marketing", "Blog"], priority: "high" },
    { id: 2, title: "Instagram Carousel - Product Launch", type: "social", status: "review", assignee: "Peter Weber", dueDate: "2024-01-18", tags: ["Social Media", "Product"], priority: "high" },
    { id: 3, title: "Welcome Email Template", type: "email", status: "approved", assignee: "Hans Müller", dueDate: "2024-01-22", tags: ["Email", "Onboarding"], priority: "medium" },
  ])
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    addTask,
    updateTask,
    deleteTask,
    refetch: refetchTasks,
  } = useContentData(
    useMemo(() => {
      const p: any = {}
      const q = taskQ.trim()
      if (q) p.q = q
      if (isAdmin) {
        if (taskScope === "mine") {
          if (user?.id != null) p.owner_id = user.id
        } else {
          if (ownerFilter === "unassigned") p.unassigned = true
          else if (ownerFilter !== "all") p.owner_id = Number(ownerFilter)
        }
      }
      return p
    }, [taskQ, isAdmin, taskScope, ownerFilter, user?.id])
  )
  const twoLevelTaxonomy = useMemo(() => buildTwoLevelTaxonomy(tasks), [tasks])

  const [hubTab, setHubTab] = useState<"items" | "calendar" | "tasks" | "templates" | "notifications">(() => {
    if (typeof window === "undefined") return "tasks"
    return (localStorage.getItem("contentHubTab") as any) || "tasks"
  })
  useEffect(() => {
    try {
      localStorage.setItem("contentHubTab", hubTab)
    } catch {}
  }, [hubTab])

  const [itemQ, setItemQ] = useState<string>("")
  const [itemStatus, setItemStatus] = useState<string>("ALL")
  const [itemScope, setItemScope] = useState<"mine" | "all">(() => {
    if (typeof window === "undefined") return "mine"
    const v = localStorage.getItem("content:itemScope")
    return v === "all" || v === "mine" ? (v as any) : "mine"
  })
  const [itemOwnerFilter, setItemOwnerFilter] = useState<string>("all")
  useEffect(() => {
    try {
      localStorage.setItem("content:itemScope", itemScope)
    } catch {}
  }, [itemScope])

  const {
    items: contentItems,
    loading: itemsLoading,
    error: itemsError,
    refetch: refetchItems,
    updateItem: updateContentItem,
  } = useContentItems(
    useMemo(() => {
      const p: any = {}
      const q = itemQ.trim()
      if (q) p.q = q
      if (itemStatus && itemStatus !== "ALL") p.status = itemStatus
      if (isAdmin) {
        if (itemScope === "mine") {
          if (user?.id != null) p.owner_id = user.id
        } else {
          if (itemOwnerFilter === "unassigned") p.unassigned = true
          else if (itemOwnerFilter !== "all") p.owner_id = Number(itemOwnerFilter)
        }
      }
      return p
    }, [itemQ, itemStatus, isAdmin, itemScope, itemOwnerFilter, user?.id])
  )
  const [view, setView] = useState<"grid" | "kanban">(() => {
    if (typeof window === "undefined") return "grid"
    return (localStorage.getItem("contentView") as "grid" | "kanban") || "grid"
  })
  useEffect(() => {
    try { localStorage.setItem("contentView", view) } catch {}
  }, [view])
  useEffect(() => {
    try {
      localStorage.setItem("content:taskScope", taskScope)
    } catch {}
  }, [taskScope])
  useEffect(() => {
    if (!isAdmin) return
    try {
      const saved = localStorage.getItem("content:taskScope")
      if (!saved) setTaskScope("all")
    } catch {}
  }, [isAdmin])
  useEffect(() => {
    if (!isAdmin) {
      setAdminUsers([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await adminAPI.getUsers({ limit: 100 })
        if (!cancelled) setAdminUsers(res.items || [])
      } catch {
        if (!cancelled) setAdminUsers([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAdmin])
  const [statusTab, setStatusTab] = useState<"ALL" | ContentStatus>("ALL")
  const [q, setQ] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<"all" | ContentItem["type"]>("all")
  const [assignee, setAssignee] = useState<"all" | string>("all")

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/crm/deals', { credentials: 'include' })
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      const data = await response.json()
      setDeals(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setDeals([])
    } finally { setLoading(false) }
  }
  useEffect(() => {
    load()
    const unsub = [
      sync.on('global:refresh', load),
      sync.on('crm:companies:changed', load),
      sync.on('activities:changed', load),
    ]
    return () => { unsub.forEach(fn => fn && (fn as any)()) }
  }, [])

  const campaigns = [
    {
      title: "Q4 Marketing Campaign",
      channel: "LinkedIn",
      description: "Social media campaign for Q4 product launch",
      due: "2024-12-15",
      slug: "q4-marketing-campaign",
    },
    {
      title: "Product Newsletter",
      channel: "Email",
      description: "Monthly newsletter featuring new features",
      due: "2024-12-10",
      slug: "product-newsletter",
    },
  ] as const

  const iconForChannel = (channel: string) => {
    const c = channel.toLowerCase()
    if (c.includes("email")) return <FileText className="h-5 w-5 text-blue-500" />
    if (c.includes("linked")) return <Image className="h-5 w-5 text-sky-400" />
    if (c.includes("insta")) return <Image className="h-5 w-5 text-pink-400" />
    if (c.includes("web")) return <File className="h-5 w-5 text-indigo-400" />
    return <FileText className="h-5 w-5 text-slate-300" />
  }

  const getTypeIcon = (type: ContentItem["type"]) => {
    switch (type) {
      case "blog": return <FileText className="h-4 w-4" />
      case "social": return <Image className="h-4 w-4" />
      case "video": return <Video className="h-4 w-4" />
      case "email": return <File className="h-4 w-4" />
      case "asset": return <File className="h-4 w-4" />
    }
  }

  const getColumnColor = (id: ContentStatus) => {
    switch (id) {
      case "idea": return "#94a3b8"
      case "draft": return "#60a5fa"
      case "review": return "#f59e0b"
      case "approved": return "#a78bfa"
      case "published": return "#34d399"
    }
  }

  const makeSeries = (base: number) =>
    Array.from({ length: 12 }, (_, i) => ({ y: Math.max(1, Math.round((base || 1) * (0.6 + 0.4 * Math.sin((i + 1) / 1.5)))) }))

  const statuses: ContentStatus[] = ["idea", "draft", "review", "approved", "published"]
  const nextStatus = (s: ContentStatus): ContentStatus => {
    const idx = statuses.indexOf(s)
    return statuses[(idx + 1) % statuses.length]
  }
  const updateStatus = (id: number, s: ContentStatus) => {
    setContents(prev => prev.map(c => (c.id === id ? { ...c, status: s } : c)))
  }
  const onDragStart = (id: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", String(id))
    e.dataTransfer.effectAllowed = "move"
  }
  const onDropTo = (s: ContentStatus) => (e: React.DragEvent) => {
    e.preventDefault()
    const id = Number(e.dataTransfer.getData("text/plain"))
    if (!Number.isNaN(id)) updateStatus(id, s)
  }
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move" }

  const assignees = Array.from(new Set(contents.map(c => c.assignee))).sort()
  const matchesFilters = (c: ContentItem) => {
    const qMatch = !q || c.title.toLowerCase().includes(q.toLowerCase()) || c.tags.join(" ").toLowerCase().includes(q.toLowerCase())
    const tMatch = typeFilter === "all" || c.type === typeFilter
    const aMatch = assignee === "all" || c.assignee === assignee
    const sMatch = statusTab === "ALL" || c.status === statusTab
    return qMatch && tMatch && aMatch && sMatch
  }
  const filteredContents = contents.filter(matchesFilters)

  const openContentItem = (id?: number) => {
    openModal({
      type: "custom",
      title: id ? `Content Item #${id}` : "Neues Content Item",
      content: <ContentItemEditor itemId={id} onClose={closeModal} />,
    })
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8 min-h-[100dvh]">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-4 sm:p-6 md:p-10 text-white shadow-2xl border border-white/10">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-fuchsia-500/30 to-blue-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-500/30 to-emerald-500/30 blur-3xl" />
        <div className="relative flex flex-col gap-4">
          {/* Top row: back + title */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-11 sm:h-8 px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center border border-white/20 shadow shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold">Content Hub</h1>
                <p className="text-xs sm:text-sm text-white/70">Content Management</p>
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20 h-11 sm:h-8 text-xs sm:text-sm"
              onClick={() => setShowPlanner((v) => !v)}
            >
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">{showPlanner ? "Planner ausblenden" : "Planner anzeigen"}</span>
              <span className="sm:hidden">{showPlanner ? "Planner" : "Planner"}</span>
            </Button>
            <Button variant="ghost" size="sm" className="bg-white/10 text-white hover:bg-white/20 h-11 sm:h-8 text-xs sm:text-sm">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20 h-11 sm:h-8 text-xs sm:text-sm"
              onClick={() => openContentItem()}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Item</span>
              <span className="sm:hidden">Item</span>
            </Button>
            <Button
              size="sm"
              className="bg-white text-slate-900 hover:bg-white/90 h-11 sm:h-8 text-xs sm:text-sm w-full sm:w-auto sm:ml-auto"
              onClick={() =>
                openModal({
                  type: "custom",
                  title: "Neue Content‑Aufgabe",
                  content: (
                    <TaskQuickCreate
                      defaultStatus={"TODO"}
                      taxonomy={twoLevelTaxonomy}
                      ownerOptions={
                        isAdmin
                          ? [
                              { value: "", label: "Zuweisen (optional)" },
                              { value: "unassigned", label: "— Unassigned —" },
                              ...adminUsers.map((u) => ({ value: String(u.id), label: u.email })),
                            ]
                          : undefined
                      }
                      defaultOwnerId={
                        isAdmin
                          ? ownerFilter === "unassigned"
                            ? "unassigned"
                            : ownerFilter !== "all"
                            ? ownerFilter
                            : ""
                          : undefined
                      }
                      onCreate={async (payload) => {
                        await addTask(payload as any)
                        refetchTasks()
                      }}
                    />
                  ),
                })
              }
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Task
            </Button>
          </div>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader className="px-4 sm:px-6 pt-4 pb-3 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-400/40 text-xs">
                  ✦
                </span>
                Content Items
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">Kampagnen/Materialien mit Workflow, Assets, Kalender & KI.</p>
            </div>
            <div className="text-[11px] text-slate-400">
              {itemsLoading ? "Lade…" : `${contentItems.length} Items`}
              {itemsError && <span className="ml-2 text-amber-300">· {itemsError}</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-4 space-y-4">
          <Tabs value={hubTab} onValueChange={(v) => setHubTab(v as any)} className="space-y-4">
            <TabsList className="w-full bg-slate-900/40 border-white/10">
              <TabsTrigger value="items" className="flex-1 text-xs sm:text-sm">
                Items
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 text-xs sm:text-sm">
                Calendar
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex-1 text-xs sm:text-sm">
                Tasks
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex-1 text-xs sm:text-sm">
                Templates
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex-1 text-xs sm:text-sm">
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
                <Input
                  value={itemQ}
                  onChange={(e) => setItemQ(e.target.value)}
                  placeholder="Suche Content Items…"
                  className="sm:max-w-[320px] min-w-0 bg-white/10 dark:bg-slate-900/50 text-white placeholder:text-white/50 border border-white/20 dark:border-slate-700"
                />
                <GlassSelect
                  value={itemStatus}
                  onChange={(v) => setItemStatus(v)}
                  options={[
                    { value: "ALL", label: "Alle Status" },
                    { value: "IDEA", label: "IDEA" },
                    { value: "DRAFT", label: "DRAFT" },
                    { value: "REVIEW", label: "REVIEW" },
                    { value: "APPROVED", label: "APPROVED" },
                    { value: "SCHEDULED", label: "SCHEDULED" },
                    { value: "PUBLISHED", label: "PUBLISHED" },
                    { value: "ARCHIVED", label: "ARCHIVED" },
                    { value: "BLOCKED", label: "BLOCKED" },
                  ]}
                  className="sm:w-44 min-w-0"
                />
                {isAdmin && (
                  <GlassSelect
                    value={itemScope}
                    onChange={(v) => setItemScope(v as any)}
                    options={[
                      { value: "mine", label: "Nur meine" },
                      { value: "all", label: "Alle" },
                    ]}
                    className="sm:w-40 min-w-0"
                  />
                )}
                {isAdmin && itemScope === "all" && (
                  <GlassSelect
                    value={itemOwnerFilter}
                    onChange={(v) => setItemOwnerFilter(v)}
                    options={[
                      { value: "all", label: "Alle Owner" },
                      { value: "unassigned", label: "Unassigned" },
                      ...adminUsers.map((u) => ({ value: String(u.id), label: u.email })),
                    ]}
                    className="w-full sm:w-64 min-w-0"
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:ml-auto glass-card shrink-0 whitespace-nowrap h-11 sm:h-9"
                  onClick={() => refetchItems()}
                >
                  Refresh
                </Button>
                <Button
                  size="sm"
                  className="bg-white text-slate-900 hover:bg-white/90 shrink-0 whitespace-nowrap h-11 sm:h-9"
                  onClick={() => openContentItem()}
                >
                  <Plus className="h-4 w-4 mr-2" /> New Item
                </Button>
              </div>

              {itemsLoading ? (
                <div className="py-8 flex items-center justify-center text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Lade…
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {contentItems.length === 0 && (
                    <div className="col-span-full text-center text-xs text-slate-400 py-10">
                      Keine Content Items. Erstelle eins mit “New Item”.
                    </div>
                  )}
                  {contentItems.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-left hover:bg-white/5 transition overflow-hidden"
                      onClick={() => openContentItem(it.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-100 truncate">{it.title}</div>
                          <div className="mt-1 text-[11px] text-slate-400 truncate">
                            {it.channel}
                            {it.format ? ` · ${it.format}` : ""}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 whitespace-nowrap">
                          {it.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(it.tags || []).slice(0, 4).map((t, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/70 border border-white/10">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap gap-2">
                        {it.dueAt && <span>Due: {it.dueAt.toISOString().slice(0, 10)}</span>}
                        {it.scheduledAt && <span>Publish: {it.scheduledAt.toISOString().slice(0, 10)}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar" className="space-y-3">
              <EditorialCalendar
                items={contentItems}
                onOpenItem={(id) => openContentItem(id)}
                onReschedule={async (id, iso) => {
                  await updateContentItem(id, { scheduled_at: iso, ...(iso ? { status: "SCHEDULED" } : {}) } as any)
                  refetchItems()
                }}
              />
            </TabsContent>

            <TabsContent value="tasks" className="space-y-2">
              <div className="text-xs text-slate-300">Task Board находится ниже на странице.</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const el = document.getElementById("mk-task-board")
                  el?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
              >
                Перейти к Task Board
              </Button>
            </TabsContent>

            <TabsContent value="templates" className="space-y-2">
              {!isAdmin ? (
                <div className="text-xs text-slate-400">Templates/Automation доступны только Admin/Editor.</div>
              ) : (
                <ContentTemplatesAdmin />
              )}
            </TabsContent>

            <TabsContent value="notifications" className="space-y-2">
              <NotificationsPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showPlanner && (
      <>
      {/* Planner / Templates (optional) */}
      {/* Toolbar: tabs + search/filters + view toggle */}
      <div className="flex flex-col gap-3">
        {/* Status tabs - horizontal scroll on mobile */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-2 min-w-max">
            {(["ALL", ...statuses] as const).map((t) => {
              const count = t === "ALL" ? contents.length : contents.filter(c => c.status === t).length
              const active = statusTab === t
              return (
                <button
                  key={t}
                  onClick={() => setStatusTab(t as any)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition whitespace-nowrap ${active ? "bg-white/15 text-white border-white/30" : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"}`}
                >
                  {t.toString().toUpperCase()} <span className="ml-0.5 sm:ml-1 text-white/60">({count})</span>
                </button>
              )
            })}
          </div>
        </div>
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suche Titel oder Tags..."
            className="h-11 sm:h-10 w-full sm:w-56 lg:w-64 rounded-xl px-3 text-xs sm:text-sm bg-white/10 dark:bg-slate-900/50 text-white placeholder:text-white/60 border border-white/20 dark:border-slate-700 focus:ring-blue-500/40"
          />
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <GlassSelect
              value={String(typeFilter)}
              onChange={(v) => setTypeFilter(v as any)}
              options={[
                { value: "all", label: "Alle Typen" },
                { value: "blog", label: "Blog" },
                { value: "social", label: "Social" },
                { value: "video", label: "Video" },
                { value: "email", label: "Email" },
                { value: "asset", label: "Asset" },
              ]}
              className="flex-1 sm:flex-none sm:w-36 lg:w-44"
            />
            <GlassSelect
              value={String(assignee)}
              onChange={(v) => setAssignee(v)}
              options={[{ value: "all", label: "Alle Bearbeiter" }, ...assignees.map(a => ({ value: a, label: a }))]}
              className="flex-1 sm:flex-none sm:w-40 lg:w-56"
            />
          </div>
          <div className="inline-flex rounded-lg overflow-hidden border border-white/20 self-stretch sm:self-start w-full sm:w-auto">
            <button
              onClick={() => setView("grid")}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 h-11 sm:h-9 text-xs sm:text-sm ${view === "grid" ? "bg-white/20 text-white" : "bg-white/5 text-white/80"}`}
            >
              Grid
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 h-11 sm:h-9 text-xs sm:text-sm ${view === "kanban" ? "bg-white/20 text-white" : "bg-white/5 text-white/80"}`}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* KPI level with micro-sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { key: "total", title: "Total Content", value: contents.length, color: "text-blue-400", stroke: "#93c5fd", fillFrom: "rgba(147,197,253,.35)", fillTo: "rgba(30,58,138,.05)" },
          { key: "deals", title: "Deals as Content", value: deals.length, color: "text-cyan-400", stroke: "#67e8f9", fillFrom: "rgba(103,232,249,.35)", fillTo: "rgba(8,145,178,.05)" },
          { key: "review", title: "Review", value: contents.filter(c=>c.status==='review').length, color: "text-amber-400", stroke: "#fbbf24", fillFrom: "rgba(251,191,36,.35)", fillTo: "rgba(146,64,14,.05)" },
          { key: "pub", title: "Veröffentlicht", value: contents.filter(c=>c.status==='published').length, color: "text-emerald-400", stroke: "#34d399", fillFrom: "rgba(52,211,153,.35)", fillTo: "rgba(6,95,70,.05)" },
        ].map((k) => (
          <Card
            key={k.key}
            className="group relative overflow-hidden backdrop-blur-xl border rounded-2xl transition-all duration-300 hover:-translate-y-0.5 glass-card"
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: `0 12px 34px ${k.fillFrom}, inset 0 0 0 1px ${k.fillFrom}` }} />
            <CardHeader className="pt-3 sm:pt-4 px-3 sm:px-4 pb-1 sm:pb-2">
              <CardTitle className={`${k.color} flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm`}>
                <FileText className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${k.color}`} />
                {k.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-lg sm:text-2xl font-semibold text-white mt-1">{k.value}</div>
              <div className="mt-2 sm:mt-3 h-10 sm:h-12 hidden sm:block">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={makeSeries(k.value)}>
                    <defs>
                      <linearGradient id={`grad-${k.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={k.stroke} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={k.stroke} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="y" stroke={k.stroke} strokeWidth={2} fill={`url(#grad-${k.key})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overview grid (Level 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[
          ...campaigns,
          ...deals.slice(0, 4).map((d: any) => ({
            title: `${d.title} – Content`,
            channel: "Website",
            description: `Landing page and assets for ${d.title}`,
            due: d.expected_close_date?.slice(0, 10) || "",
            slug: (d.title || "deal").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          })),
        ].map((c, idx) => (
          <Link key={idx} href={`/content/${c.slug}`} className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="group relative overflow-hidden glass-card border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: "0 12px 34px rgba(147,197,253,.18), inset 0 0 0 1px rgba(147,197,253,.35)" }} />
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  {iconForChannel(c.channel)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 truncate">{c.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{c.channel}</p>
                </div>
              </div>
              {c.description && (
                <p className="text-sm text-slate-700/90 dark:text-slate-300/90 line-clamp-2 mb-4">{c.description}</p>
              )}
              {c.due && (
                <div className="text-xs text-slate-500 dark:text-slate-400">Due: {c.due}</div>
              )}
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Content items section: Grid or Kanban (визуальный уровень 2, локальные элементы) */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContents.map((c) => (
            <Card key={c.id} className="glass-card p-5">
              <CardContent className="p-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white/90">
                      {getTypeIcon(c.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white truncate">{c.title}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] border border-white/20 text-white/80">{c.status.toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-white/60 mt-1">Due: {c.dueDate} · {c.assignee}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.tags.map((t,i)=>(<span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">{t}</span>))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 px-2 glass-card" onClick={() => updateStatus(c.id, nextStatus(c.status))}>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredContents.length === 0 && (
            <Card className="glass-card"><CardContent className="p-6 text-center text-white/70">Keine Einträge</CardContent></Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {statuses.map((s) => {
            const list = filteredContents.filter(c => c.status === s)
            return (
              <div key={s} className="glass-card border rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white/90 text-sm font-medium">{s.toUpperCase()}</div>
                  <div className="text-white/60 text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/20">{list.length}</div>
                </div>
                <div
                  onDrop={onDropTo(s)}
                  onDragOver={onDragOver}
                  className="space-y-2 max-h-[520px] overflow-y-auto pr-1"
                >
                  {list.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={onDragStart(c.id)}
                      className="p-3 rounded-xl bg-white/10 border border-white/15 text-white/90 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 border border-white/20">{getTypeIcon(c.type)}</span>
                          <span className="truncate">{c.title}</span>
                        </div>
                        <button onClick={() => updateStatus(c.id, nextStatus(c.status))} className="text-[11px] px-2 py-0.5 rounded bg-white/10 border border-white/20">Next</button>
                      </div>
                      <div className="mt-1 text-[11px] text-white/60">{c.assignee} · {c.dueDate}</div>
                    </div>
                  ))}
                  {list.length === 0 && (
                    <div className="text-center text-white/50 text-xs py-6 border border-dashed border-white/20 rounded-lg">Drop here</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </>
      )}

      {/* Task Board – реальная двухуровневая система задач, сохраняется в Backend */}
      <Card className="glass-card" id="mk-task-board">
        <CardHeader className="px-4 sm:px-6 pt-4 pb-3 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-400/40 text-xs">
                  ✦
                </span>
                Task Board
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Operative Aufgaben für Content‑Produktion. Alle manuellen Tasks werden im Backend gespeichert.
              </p>
            </div>
            <div className="text-[11px] text-slate-400">
              {tasksLoading ? "Lade Tasks..." : `${tasks.length} Tasks gesamt`}
              {tasksError && <span className="ml-2 text-amber-300">· {tasksError}</span>}
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
            <Input
              value={taskQ}
              onChange={(e) => setTaskQ(e.target.value)}
              placeholder="Suche Tasks..."
              className="sm:max-w-[320px] min-w-0 bg-white/10 dark:bg-slate-900/50 text-white placeholder:text-white/50 border border-white/20 dark:border-slate-700"
            />
            {isAdmin && (
              <GlassSelect
                value={taskScope}
                onChange={(v) => setTaskScope(v as any)}
                options={[
                  { value: "mine", label: "Nur meine" },
                  { value: "all", label: "Alle" },
                ]}
                className="sm:w-40 min-w-0"
              />
            )}
            {isAdmin && taskScope === "all" && (
              <GlassSelect
                value={ownerFilter}
                onChange={(v) => setOwnerFilter(v)}
                options={[
                  { value: "all", label: "Alle Owner" },
                  { value: "unassigned", label: "Unassigned" },
                  ...adminUsers.map((u) => ({ value: String(u.id), label: u.email })),
                ]}
                className="sm:w-64 min-w-0"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              className="sm:ml-auto glass-card shrink-0 whitespace-nowrap"
              onClick={() => refetchTasks()}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              className="bg-white text-slate-900 hover:bg-white/90 shrink-0 whitespace-nowrap"
              onClick={() =>
                openModal({
                  type: "custom",
                  title: "Neue Content‑Aufgabe",
                  content: (
                    <TaskQuickCreate
                      defaultStatus={"TODO"}
                      taxonomy={twoLevelTaxonomy}
                      ownerOptions={
                        isAdmin
                          ? [
                              { value: "", label: "Zuweisen (optional)" },
                              { value: "unassigned", label: "— Unassigned —" },
                              ...adminUsers.map((u) => ({ value: String(u.id), label: u.email })),
                            ]
                          : undefined
                      }
                      defaultOwnerId={
                        isAdmin
                          ? ownerFilter === "unassigned"
                            ? "unassigned"
                            : ownerFilter !== "all"
                            ? ownerFilter
                            : ""
                          : undefined
                      }
                      onCreate={async (payload) => {
                        await addTask(payload as any)
                        refetchTasks()
                      }}
                    />
                  ),
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 py-4">
          <KanbanBoard
            tasks={tasks}
            onTaskMove={async (taskId, newStatus, _index) => {
              const task = tasks.find(t => t.id === taskId)
              if (!task) return
              await updateTask(taskId, { status: newStatus as any })
            }}
            onTaskClick={(task) => {
              const backendId =
                (task as any)?.backendId ??
                (() => {
                  const m = String((task as any)?.id || "").match(/content-(\d+)/)
                  return m ? Number(m[1]) : undefined
                })()
              openModal({
                type: "custom",
                title: "Task bearbeiten",
                description: backendId ? `#${backendId}` : undefined,
                content: (
                  <TaskEditForm
                    task={task as any}
                    taxonomy={twoLevelTaxonomy}
                    isAdmin={!!isAdmin}
                    users={adminUsers}
                    onSave={updateTask as any}
                    onDelete={deleteTask as any}
                  />
                ),
              })
            }}
            onCreateTask={(status: KanbanStatus) => {
              openModal({
                type: "custom",
                title: "Neue Content‑Aufgabe",
                content: (
                  <TaskQuickCreate
                    defaultStatus={status}
                    taxonomy={twoLevelTaxonomy}
                    ownerOptions={
                      isAdmin
                        ? [
                            { value: "", label: "Zuweisen (optional)" },
                            { value: "unassigned", label: "— Unassigned —" },
                            ...adminUsers.map((u) => ({ value: String(u.id), label: u.email })),
                          ]
                        : undefined
                    }
                    defaultOwnerId={
                      isAdmin
                        ? ownerFilter === "unassigned"
                          ? "unassigned"
                          : ownerFilter !== "all"
                          ? ownerFilter
                          : ""
                        : undefined
                    }
                    onCreate={async (payload) => {
                      await addTask(payload)
                      refetchTasks()
                    }}
                  />
                ),
              })
            }}
            onDeleteTask={(taskId) => deleteTask(taskId)}
          />
        </CardContent>
      </Card>
    </div>
  )
}


