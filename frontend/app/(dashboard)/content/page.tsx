"use client"

import { useMemo, useState, useEffect, useId } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Plus,
  ArrowLeft,
  Filter,
  Download,
  Image,
  Video,
  CalendarDays,
  Clock,
  Tag,
  File,
  Lock,
  Sparkles,
  Bell,
  ListTodo,
  Wand2,
  Search,
  RefreshCcw,
  MoreHorizontal,
  Copy,
  Archive,
  ArchiveRestore,
  Files,
} from "lucide-react"
import Link from "next/link"
import { useModal } from "@/components/ui/modal/ModalProvider"
import { motion } from "framer-motion"
import { sync } from "@/lib/sync"
import { ResponsiveContainer, AreaChart, Area } from "recharts"
import { GlassSelect } from "@/components/ui/glass-select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  const { toast } = useToast()
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
  const [itemSort, setItemSort] = useState<string>(() => {
    if (typeof window === "undefined") return "updated_desc"
    return localStorage.getItem("content:itemSort") || "updated_desc"
  })
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
    createItem: createContentItem,
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

  useEffect(() => {
    try {
      localStorage.setItem("content:itemSort", itemSort)
    } catch {}
  }, [itemSort])

  const fmtDate = (v: any) => {
    if (!v) return ""
    try {
      const d = v instanceof Date ? v : new Date(v)
      if (Number.isNaN(d.getTime())) return ""
      return d.toISOString().slice(0, 10)
    } catch {
      return ""
    }
  }

  const statusChip = (s: string) => {
    const v = String(s || "").toUpperCase()
    const base = "text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap font-semibold"
    if (v === "APPROVED") return `${base} bg-emerald-500/15 text-emerald-100 border-emerald-400/20`
    if (v === "REVIEW") return `${base} bg-amber-500/15 text-amber-100 border-amber-400/20`
    if (v === "DRAFT") return `${base} bg-sky-500/15 text-sky-100 border-sky-400/20`
    if (v === "PUBLISHED") return `${base} bg-emerald-500/15 text-emerald-100 border-emerald-400/20`
    if (v === "BLOCKED") return `${base} bg-rose-500/15 text-rose-100 border-rose-400/20`
    if (v === "ARCHIVED") return `${base} bg-slate-500/15 text-slate-200 border-white/10`
    if (v === "SCHEDULED") return `${base} bg-violet-500/15 text-violet-100 border-violet-400/20`
    return `${base} bg-white/5 text-slate-200 border-white/10`
  }

  const statusAccent = (s: string) => {
    const v = String(s || "").toUpperCase()
    if (v === "APPROVED") return "from-emerald-400/50 via-emerald-400/15 to-transparent"
    if (v === "REVIEW") return "from-amber-400/50 via-amber-400/15 to-transparent"
    if (v === "DRAFT") return "from-sky-400/50 via-sky-400/15 to-transparent"
    if (v === "PUBLISHED") return "from-emerald-400/50 via-emerald-400/15 to-transparent"
    if (v === "BLOCKED") return "from-rose-400/50 via-rose-400/15 to-transparent"
    if (v === "ARCHIVED") return "from-slate-400/40 via-slate-400/15 to-transparent"
    if (v === "SCHEDULED") return "from-violet-400/50 via-violet-400/15 to-transparent"
    return "from-white/25 via-white/10 to-transparent"
  }

  const sortedItems = useMemo(() => {
    const arr = Array.isArray(contentItems) ? [...contentItems] : []
    const statusRank: Record<string, number> = {
      IDEA: 1,
      DRAFT: 2,
      REVIEW: 3,
      APPROVED: 4,
      SCHEDULED: 5,
      PUBLISHED: 6,
      BLOCKED: 7,
      ARCHIVED: 8,
    }
    const dateOr = (fallback: number, d?: Date) => (d ? d.getTime() : fallback)

    arr.sort((a: any, b: any) => {
      const sa = String(a?.status || "").toUpperCase()
      const sb = String(b?.status || "").toUpperCase()
      switch (itemSort) {
        case "updated_asc":
          return dateOr(0, a.updatedAt) - dateOr(0, b.updatedAt)
        case "updated_desc":
          return dateOr(0, b.updatedAt) - dateOr(0, a.updatedAt)
        case "due_asc":
          return dateOr(Number.POSITIVE_INFINITY, a.dueAt) - dateOr(Number.POSITIVE_INFINITY, b.dueAt)
        case "due_desc":
          return dateOr(0, b.dueAt) - dateOr(0, a.dueAt)
        case "publish_asc":
          return dateOr(Number.POSITIVE_INFINITY, a.scheduledAt) - dateOr(Number.POSITIVE_INFINITY, b.scheduledAt)
        case "title_asc":
          return String(a.title || "").localeCompare(String(b.title || ""), "de")
        case "status_asc":
          return (statusRank[sa] || 999) - (statusRank[sb] || 999)
        default:
          return dateOr(0, b.updatedAt) - dateOr(0, a.updatedAt)
      }
    })
    return arr
  }, [contentItems, itemSort])

  const copyToClipboard = async (text: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "Kopiert", description: okMsg })
    } catch {
      toast({ title: "Kopieren fehlgeschlagen", description: "Bitte im Browser Clipboard erlauben.", variant: "destructive" as any })
    }
  }

  const toggleArchiveItem = async (it: any) => {
    const isArchived = String(it.status || "").toUpperCase() === "ARCHIVED"
    const next = isArchived ? "DRAFT" : "ARCHIVED"
    const label = isArchived ? "Wiederherstellen" : "Archivieren"
    if (!confirm(`${label}: "${it.title}"?`)) return
    try {
      await updateContentItem(it.id, { status: next as any })
      toast({ title: "OK", description: `${label} erfolgreich.` })
    } catch (e: any) {
      toast({ title: "Fehler", description: e?.message || "Aktion fehlgeschlagen", variant: "destructive" as any })
    }
  }

  const duplicateItem = async (it: any) => {
    try {
      const created = await createContentItem({
        title: `${String(it.title || "Untitled")} (Copy)`,
        channel: it.channel || undefined,
        format: it.format || null,
        status: "DRAFT",
        tags: Array.isArray(it.tags) ? it.tags : null,
        brief: it.brief || null,
        body: it.body || null,
        tone: it.tone || null,
        language: it.language || null,
        due_at: it.dueAt ? new Date(it.dueAt).toISOString() : null,
        scheduled_at: null,
        owner_id: it.ownerId ?? null,
      } as any)
      toast({ title: "Dupliziert", description: "Neues Item wurde erstellt." })
      openContentItem(created.id)
    } catch (e: any) {
      toast({ title: "Fehler", description: e?.message || "Duplizieren fehlgeschlagen", variant: "destructive" as any })
    }
  }
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

      <Card className="glass-card overflow-hidden">
        <CardHeader className="relative px-4 sm:px-6 pt-5 pb-4 border-b border-white/10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-500/40 via-violet-400/20 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="relative flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-violet-200" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2 leading-tight">
                  Content Items
                  <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-200/80">
                    Workflow · Assets · Kalender · KI
                  </span>
                </CardTitle>
                <p className="text-[11px] text-slate-400 mt-1">
                  Verwalte Kampagnen/Materialien in einem sauberen Prozess — von Idee bis Publish.
                </p>
              </div>
            </div>
            <div className="relative flex items-center gap-2 text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                {itemsLoading ? "Lade…" : `${contentItems.length} Items`}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                {tasksLoading ? "…" : `${tasks.length} Tasks`}
              </span>
              {itemsError && <span className="ml-1 text-amber-300">· {itemsError}</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-4 space-y-4">
          <Tabs value={hubTab} onValueChange={(v) => setHubTab(v as any)} className="space-y-4">
            <TabsList className="w-full overflow-x-auto mk-no-scrollbar rounded-2xl p-1.5 flex-nowrap justify-start sm:justify-center border border-white/10 bg-gradient-to-b from-white/10 to-white/5">
              <TabsTrigger
                value="items"
                className="min-w-[132px] text-xs sm:text-sm rounded-xl data-[state=active]:bg-slate-950/40 data-[state=active]:text-white data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-white/15"
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-300" />
                  Items
                  <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-200/80">
                    {contentItems.length}
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="min-w-[132px] text-xs sm:text-sm rounded-xl data-[state=active]:bg-slate-950/40 data-[state=active]:text-white data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-white/15"
              >
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-300" />
                  Kalender
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="min-w-[132px] text-xs sm:text-sm rounded-xl data-[state=active]:bg-slate-950/40 data-[state=active]:text-white data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-white/15"
              >
                <span className="inline-flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-slate-300" />
                  Tasks
                  <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-200/80">
                    {tasks.length}
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="min-w-[150px] text-xs sm:text-sm rounded-xl data-[state=active]:bg-slate-950/40 data-[state=active]:text-white data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-white/15"
              >
                <span className="inline-flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-slate-300" />
                  Templates
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="min-w-[180px] text-xs sm:text-sm rounded-xl data-[state=active]:bg-slate-950/40 data-[state=active]:text-white data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-white/15"
              >
                <span className="inline-flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-300" />
                  Notifications
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 backdrop-blur-xl p-3 sm:p-4 overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 -mt-4 h-20 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_60%)]" />
                <div className="relative flex flex-col gap-2 sm:gap-3">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
                    <div className="relative w-full sm:max-w-[340px]">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={itemQ}
                        onChange={(e) => setItemQ(e.target.value)}
                        placeholder="Suche nach Titel, Tags, Channel…"
                        className="pl-9"
                      />
                    </div>
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
                      className="sm:w-48 min-w-0"
                    />
                    <GlassSelect
                      value={itemSort}
                      onChange={(v) => setItemSort(v)}
                      options={[
                        { value: "updated_desc", label: "Sort: Zuletzt aktualisiert" },
                        { value: "updated_asc", label: "Sort: Älteste zuerst" },
                        { value: "due_asc", label: "Sort: Due (nächste zuerst)" },
                        { value: "due_desc", label: "Sort: Due (späteste zuerst)" },
                        { value: "publish_asc", label: "Sort: Publish (nächste zuerst)" },
                        { value: "title_asc", label: "Sort: Titel (A–Z)" },
                        { value: "status_asc", label: "Sort: Status" },
                      ]}
                      className="sm:w-56 min-w-0"
                    />
                    {isAdmin && (
                      <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
                        <button
                          type="button"
                          onClick={() => setItemScope("mine")}
                          className={[
                            "h-9 px-3 rounded-lg text-xs font-semibold transition",
                            itemScope === "mine" ? "bg-white/10 text-white shadow ring-1 ring-white/10" : "text-slate-200/80 hover:bg-white/10",
                          ].join(" ")}
                        >
                          Nur meine
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemScope("all")}
                          className={[
                            "h-9 px-3 rounded-lg text-xs font-semibold transition",
                            itemScope === "all" ? "bg-white/10 text-white shadow ring-1 ring-white/10" : "text-slate-200/80 hover:bg-white/10",
                          ].join(" ")}
                        >
                          Alle
                        </button>
                      </div>
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
                    <div className="sm:ml-auto flex items-stretch gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="glass-card shrink-0 whitespace-nowrap h-11 border-white/15 bg-white/5 hover:bg-white/10"
                        onClick={() => refetchItems()}
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
                      </Button>
                      <Button
                        size="sm"
                        className="shrink-0 whitespace-nowrap h-11 bg-white text-slate-900 hover:bg-white/90"
                        onClick={() => openContentItem()}
                      >
                        <Plus className="h-4 w-4 mr-2" /> New Item
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="truncate">
                      Tipp: nutze Status + Owner Filter, um schnell Reviews & Deadlines zu finden.
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        <Clock className="h-3.5 w-3.5" /> Due / Publish
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        <Tag className="h-3.5 w-3.5" /> Tags
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {itemsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 overflow-hidden">
                      <div className="h-1 w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent rounded-full" />
                      <div className="mt-4 h-4 w-2/3 bg-white/10 rounded" />
                      <div className="mt-2 h-3 w-1/2 bg-white/5 rounded" />
                      <div className="mt-4 flex gap-2">
                        <div className="h-5 w-16 bg-white/10 rounded-full" />
                        <div className="h-5 w-20 bg-white/5 rounded-full" />
                      </div>
                      <div className="mt-4 h-3 w-3/4 bg-white/5 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {contentItems.length === 0 && (
                    <div className="col-span-full">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-8 text-center overflow-hidden">
                        <div className="mx-auto h-12 w-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-slate-300" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-100">Noch keine Items</div>
                        <div className="mt-1 text-xs text-slate-400">
                          Erstelle dein erstes Content Item und nutze Templates, um Checklists & Tasks automatisch zu erzeugen.
                        </div>
                        <div className="mt-4 flex items-center justify-center">
                          <Button className="h-11 bg-white text-slate-900 hover:bg-white/90" onClick={() => openContentItem()}>
                            <Plus className="h-4 w-4 mr-2" /> New Item
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {sortedItems.map((it) => (
                    <div
                      key={it.id}
                      className="group relative rounded-2xl border border-white/10 bg-slate-950/30 backdrop-blur-xl p-4 text-left overflow-hidden transition-all hover:bg-slate-950/40 hover:ring-1 hover:ring-white/10 hover:shadow-[0_14px_36px_rgba(0,0,0,0.35)]"
                      role="button"
                      tabIndex={0}
                      onClick={() => openContentItem(it.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          openContentItem(it.id)
                        }
                      }}
                    >
                      <div className={["pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r", statusAccent(it.status)].join(" ")} />
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                              {iconForChannel(String(it.channel || ""))}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-100 truncate">{it.title}</div>
                              <div className="mt-1 text-[11px] text-slate-400 truncate">
                                {it.channel || "—"}
                                {it.format ? ` · ${it.format}` : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={statusChip(it.status)}>{String(it.status || "").toUpperCase()}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 inline-flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Quick actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="border-white/10 bg-slate-950/95 text-slate-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  openContentItem(it.id)
                                }}
                              >
                                Öffnen
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  copyToClipboard(String(it.id), `ID #${it.id}`)
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2 opacity-80" /> ID kopieren
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  copyToClipboard(String(it.title || ""), "Titel kopiert")
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2 opacity-80" /> Titel kopieren
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  duplicateItem(it)
                                }}
                              >
                                <Files className="h-4 w-4 mr-2 opacity-80" /> Duplizieren
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  toggleArchiveItem(it)
                                }}
                                className="text-amber-100 focus:text-amber-50"
                              >
                                {String(it.status || "").toUpperCase() === "ARCHIVED" ? (
                                  <>
                                    <ArchiveRestore className="h-4 w-4 mr-2 opacity-80" /> Wiederherstellen
                                  </>
                                ) : (
                                  <>
                                    <Archive className="h-4 w-4 mr-2 opacity-80" /> Archivieren
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(it.tags || []).slice(0, 4).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-200/90 border border-white/10 max-w-full truncate"
                            title={t}
                          >
                            {t}
                          </span>
                        ))}
                        {(it.tags || []).length > 4 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                            +{(it.tags || []).length - 4}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        {it.dueAt && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                            <Clock className="h-3.5 w-3.5" /> Due: {fmtDate(it.dueAt)}
                          </span>
                        )}
                        {it.scheduledAt && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                            <CalendarDays className="h-3.5 w-3.5" /> Publish: {fmtDate(it.scheduledAt)}
                          </span>
                        )}
                        <span className="ml-auto text-slate-300/70 group-hover:text-slate-200 transition">Öffnen →</span>
                      </div>
                    </div>
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
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold text-slate-100">Task Board</div>
                <div className="mt-1 text-xs text-slate-400">Das Task Board befindet sich weiter unten auf der Seite.</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 glass-card"
                  onClick={() => {
                    const el = document.getElementById("mk-task-board")
                    el?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                >
                  Zum Task Board
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-2">
              {!isAdmin ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-5 w-5 text-slate-200" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-100">Templates & Automation</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Dieser Bereich ist nur für <span className="text-slate-200 font-semibold">Admin</span> und{" "}
                        <span className="text-slate-200 font-semibold">Editor</span> verfügbar.
                      </div>
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-300">
                        Tipp: Templates erstellen automatisch Checklists/Tasks für neue Content Items und sorgen für einen sauberen Workflow.
                      </div>
                    </div>
                  </div>
                </div>
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


