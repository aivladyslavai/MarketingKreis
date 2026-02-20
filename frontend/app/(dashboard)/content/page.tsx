"use client"

import { useMemo, useState, useEffect, useId, useRef, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Plus,
  ArrowLeft,
  Filter,
  Download,
  CheckSquare,
  Square,
  X,
  Image as ImageIcon,
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
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useModal } from "@/components/ui/modal/ModalProvider"
import { sync } from "@/lib/sync"
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
import { adminAPI, contentItemsAPI, contentTemplatesAPI, type AdminUser, type ContentItemStatus, type ContentTemplateDTO } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentItemEditor } from "@/components/content/ContentItemEditor"
import { EditorialCalendar } from "@/components/content/EditorialCalendar"
import { ContentItemsPlannerBoard } from "@/components/content/ContentItemsPlannerBoard"
import { ContentTemplatesAdmin } from "@/components/content/ContentTemplatesAdmin"
import { NotificationsPanel } from "@/components/content/NotificationsPanel"

type ItemStatusFilter = "ALL" | ContentItemStatus

const ITEM_STATUS_OPTIONS: Array<{ value: ItemStatusFilter; label: string }> = [
  { value: "ALL", label: "Alle Status" },
  { value: "IDEA", label: "IDEA" },
  { value: "DRAFT", label: "DRAFT" },
  { value: "REVIEW", label: "REVIEW" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "SCHEDULED", label: "SCHEDULED" },
  { value: "PUBLISHED", label: "PUBLISHED" },
  { value: "ARCHIVED", label: "ARCHIVED" },
  { value: "BLOCKED", label: "BLOCKED" },
]

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

type SavedItemView = {
  id: string
  name: string
  q: string
  status: ItemStatusFilter
  sort: string
  scope: "mine" | "all"
  ownerFilter: string
  channel: string
  format: string
  createdAt: number
}

function SaveItemViewForm({
  defaultName,
  onSave,
}: {
  defaultName?: string
  onSave: (name: string) => void | Promise<void>
}) {
  const { closeModal } = useModal()
  const [name, setName] = useState(defaultName || "")
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    setSaving(true)
    try {
      await onSave(n)
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Reviews / Diese Woche" autoFocus />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
        <Button type="button" variant="outline" onClick={closeModal}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Speichere..." : "Speichern"}
        </Button>
      </div>
    </form>
  )
}

function ManageItemViews({
  views,
  onApply,
  onDelete,
}: {
  views: SavedItemView[]
  onApply: (v: SavedItemView) => void
  onDelete: (id: string) => void
}) {
  const { closeModal } = useModal()

  return (
    <div className="space-y-3">
      {views.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Noch keine gespeicherten Views.</div>
      ) : (
        <div className="space-y-2">
          {views
            .slice()
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .map((v) => (
              <div key={v.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">{v.name}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                    Suche: {v.q ? `"${v.q}"` : "—"} · Status: {String(v.status)} · Sort: {String(v.sort)} · Scope: {v.scope} · Channel: {v.channel} · Format: {v.format}
                  </div>
                </div>
                <div className="sm:ml-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="glass-card"
                    onClick={() => {
                      onApply(v)
                      closeModal()
                    }}
                  >
                    Anwenden
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="glass-card border-red-500/30 text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      if (!confirm(`View löschen: "${v.name}"?`)) return
                      onDelete(v.id)
                      closeModal()
                    }}
                  >
                    Löschen
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
      <div className="flex justify-end pt-2 border-t border-white/10">
        <Button variant="outline" className="glass-card" onClick={closeModal}>
          Schließen
        </Button>
      </div>
    </div>
  )
}

function BulkReviewRequestForm({
  count,
  onRun,
}: {
  count: number
  onRun: (note?: string) => void | Promise<void>
}) {
  const { closeModal } = useModal()
  const [note, setNote] = useState("")
  const [running, setRunning] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRunning(true)
    try {
      const n = note.trim()
      await onRun(n ? n : undefined)
      closeModal()
    } finally {
      setRunning(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-sm text-slate-200">
        Review anfragen für <span className="font-semibold">{count}</span> Items.
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Notiz (optional)</label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="z.B. Bitte bis Freitag prüfen." />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
        <Button type="button" variant="outline" onClick={closeModal}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={running}>
          {running ? "Starte…" : "Review anfragen"}
        </Button>
      </div>
    </form>
  )
}

function BulkApplyTemplateForm({
  count,
  onApply,
}: {
  count: number
  onApply: (tpl: ContentTemplateDTO) => void | Promise<void>
}) {
  const { closeModal } = useModal()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<ContentTemplateDTO[]>([])
  const [tplId, setTplId] = useState<string>("")
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await contentTemplatesAPI.list()
        if (cancelled) return
        setTemplates(Array.isArray(res) ? res : [])
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Templates konnten nicht geladen werden.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = Number(tplId)
    if (!tplId || Number.isNaN(id)) return
    const tpl = templates.find((t) => t.id === id)
    if (!tpl) return

    setRunning(true)
    try {
      await onApply(tpl)
      closeModal()
    } finally {
      setRunning(false)
    }
  }

  const options = useMemo(() => {
    const base = templates
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "de"))
      .map((t) => ({ value: String(t.id), label: t.name }))
    return [{ value: "", label: loading ? "Lade Templates…" : "Template auswählen…" }, ...base]
  }, [templates, loading])

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-sm text-slate-200">
        Template anwenden auf <span className="font-semibold">{count}</span> Items.
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Template</label>
        <GlassSelect value={tplId} onChange={(v) => setTplId(v)} options={options} />
        {error && <div className="text-[11px] text-amber-200 mt-1">{error}</div>}
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
        <Button type="button" variant="outline" onClick={closeModal}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={running || !tplId}>
          {running ? "Wende an…" : "Anwenden"}
        </Button>
      </div>
    </form>
  )
}

function BulkSetDateForm({
  count,
  mode,
  onApply,
}: {
  count: number
  mode: "due" | "publish"
  onApply: (isoOrNull: string | null) => void | Promise<void>
}) {
  const { closeModal } = useModal()
  const [value, setValue] = useState("")
  const [clear, setClear] = useState(false)
  const [running, setRunning] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRunning(true)
    try {
      if (clear) {
        await onApply(null)
        closeModal()
        return
      }
      const s = String(value || "").trim()
      if (!s) return
      const d = new Date(s)
      if (Number.isNaN(d.getTime())) return
      await onApply(d.toISOString())
      closeModal()
    } finally {
      setRunning(false)
    }
  }

  const label = mode === "due" ? "Fällig bis" : "Publish (geplant)"

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-sm text-slate-200">
        {label} setzen für <span className="font-semibold">{count}</span> Items.
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-300">{label}</label>
        <Input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} disabled={clear} />
        <label className="mt-2 flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={clear}
            onChange={(e) => setClear(e.target.checked)}
            className="h-4 w-4 accent-white"
          />
          Datum entfernen
        </label>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
        <Button type="button" variant="outline" onClick={closeModal}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={running || (!clear && !value)}>
          {running ? "Speichere…" : "Anwenden"}
        </Button>
      </div>
    </form>
  )
}

function ContentPageInner() {
  const { openModal, closeModal } = useModal()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const openedItemIdRef = useRef<number | null>(null)
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
  const [dealsLoading, setDealsLoading] = useState(false)
  const [dealsError, setDealsError] = useState<string | null>(null)
  const [deals, setDeals] = useState<any[]>([])
  const [dealPick, setDealPick] = useState<string>("")
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
    if (typeof window === "undefined") return "items"
    return (localStorage.getItem("contentHubTab") as any) || "items"
  })
  useEffect(() => {
    try {
      localStorage.setItem("contentHubTab", hubTab)
    } catch {}
  }, [hubTab])

  const [itemQ, setItemQ] = useState<string>("")
  const [itemStatus, setItemStatus] = useState<ItemStatusFilter>(() => {
    if (typeof window === "undefined") return "ALL"
    try {
      const v = String(localStorage.getItem("content:itemStatus") || "ALL").toUpperCase()
      const allowed = new Set(ITEM_STATUS_OPTIONS.map((o) => String(o.value)))
      return allowed.has(v) ? (v as ItemStatusFilter) : "ALL"
    } catch {
      return "ALL"
    }
  })
  const [itemSort, setItemSort] = useState<string>(() => {
    if (typeof window === "undefined") return "updated_desc"
    return localStorage.getItem("content:itemSort") || "updated_desc"
  })
  const [itemScope, setItemScope] = useState<"mine" | "all">(() => {
    if (typeof window === "undefined") return "mine"
    const v = localStorage.getItem("content:itemScope")
    return v === "all" || v === "mine" ? (v as any) : "mine"
  })
  const [itemOwnerFilter, setItemOwnerFilter] = useState<string>(() => {
    if (typeof window === "undefined") return "all"
    try {
      const v = localStorage.getItem("content:itemOwnerFilter")
      return v ? String(v) : "all"
    } catch {
      return "all"
    }
  })
  const [itemChannel, setItemChannel] = useState<string>(() => {
    if (typeof window === "undefined") return "all"
    try {
      const v = localStorage.getItem("content:itemChannel")
      return v ? String(v) : "all"
    } catch {
      return "all"
    }
  })
  const [itemFormat, setItemFormat] = useState<string>(() => {
    if (typeof window === "undefined") return "all"
    try {
      const v = localStorage.getItem("content:itemFormat")
      return v ? String(v) : "all"
    } catch {
      return "all"
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem("content:itemStatus", String(itemStatus))
    } catch {}
  }, [itemStatus])
  useEffect(() => {
    try {
      localStorage.setItem("content:itemScope", itemScope)
    } catch {}
  }, [itemScope])
  useEffect(() => {
    try {
      localStorage.setItem("content:itemOwnerFilter", String(itemOwnerFilter))
    } catch {}
  }, [itemOwnerFilter])
  useEffect(() => {
    try {
      localStorage.setItem("content:itemChannel", String(itemChannel))
    } catch {}
  }, [itemChannel])
  useEffect(() => {
    try {
      localStorage.setItem("content:itemFormat", String(itemFormat))
    } catch {}
  }, [itemFormat])

  useEffect(() => {
    if (!showPlanner) return
    try {
      setHubTab("items")
      setItemStatus("ALL")
      setSelectMode(false)
      requestAnimationFrame(() => {
        document.getElementById("mk-planner")?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    } catch {
      /* noop */
    }
  }, [showPlanner])

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

  const itemTaxonomy = useMemo(() => buildTwoLevelTaxonomy(contentItems as any), [contentItems])
  const channelOptions = useMemo(() => {
    return [
      { value: "all", label: "Alle Channels" },
      ...itemTaxonomy.channels.map((c) => ({ value: c, label: c })),
    ]
  }, [itemTaxonomy])
  const formatOptions = useMemo(() => {
    const all = new Set<string>()

    if (itemChannel && itemChannel !== "all") {
      const key = itemChannel.toLowerCase()
      const match = itemTaxonomy.channels.find((c) => c.toLowerCase() === key)
      const list = match ? itemTaxonomy.formatsByChannel[match] || [] : []
      return [
        { value: "all", label: "Alle Formate" },
        ...list.map((f) => ({ value: f, label: f })),
      ]
    }

    for (const list of Object.values(itemTaxonomy.formatsByChannel || {})) {
      for (const f of list || []) all.add(f)
    }
    const arr = Array.from(all).sort((a, b) => a.localeCompare(b, "de"))
    return [{ value: "all", label: "Alle Formate" }, ...arr.map((f) => ({ value: f, label: f }))]
  }, [itemTaxonomy, itemChannel])
  useEffect(() => {
    if (!itemChannel || itemChannel === "all") return
    if (!itemFormat || itemFormat === "all") return
    const key = itemChannel.toLowerCase()
    const match = itemTaxonomy.channels.find((c) => c.toLowerCase() === key)
    const list = match ? itemTaxonomy.formatsByChannel[match] || [] : []
    const ok = list.some((f) => f.toLowerCase() === itemFormat.toLowerCase())
    if (!ok) setItemFormat("all")
  }, [itemChannel, itemFormat, itemTaxonomy])

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

  const relDays = (v: any) => {
    if (!v) return ""
    try {
      const d = v instanceof Date ? v : new Date(v)
      if (Number.isNaN(d.getTime())) return ""
      const ms = d.getTime() - Date.now()
      const days = Math.ceil(ms / 86_400_000)
      if (days === 0) return "today"
      if (days > 0) return `in ${days}d`
      return `${Math.abs(days)}d overdue`
    } catch {
      return ""
    }
  }

  const datePill = (v: any, kind: "due" | "publish") => {
    const d = v instanceof Date ? v : v ? new Date(v) : null
    if (!d || Number.isNaN(d.getTime())) return "border-white/10 bg-white/5 text-slate-200"
    const ms = d.getTime() - Date.now()
    const day = 86_400_000
    if (ms < 0) return "bg-rose-500/15 text-rose-200 border-rose-400/30"
    if (ms <= 2 * day) return kind === "publish" ? "bg-violet-500/15 text-violet-200 border-violet-400/30" : "bg-amber-500/15 text-amber-200 border-amber-400/30"
    if (ms <= 7 * day) return kind === "publish" ? "bg-violet-500/10 text-violet-200 border-violet-400/20" : "bg-sky-500/10 text-sky-200 border-sky-400/20"
    return "border-white/10 bg-white/5 text-slate-200"
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
    const chKey = itemChannel && itemChannel !== "all" ? String(itemChannel).toLowerCase() : ""
    const fmtKey = itemFormat && itemFormat !== "all" ? String(itemFormat).toLowerCase() : ""
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

    const filtered = arr.filter((it: any) => {
      const chOk = !chKey || String(it?.channel || "").toLowerCase() === chKey
      const fmtOk = !fmtKey || String(it?.format || "").toLowerCase() === fmtKey
      return chOk && fmtOk
    })

    filtered.sort((a: any, b: any) => {
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
    return filtered
  }, [contentItems, itemSort, itemChannel, itemFormat])

  const [savedItemViews, setSavedItemViews] = useState<SavedItemView[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem("content:itemViews")
      const arr = JSON.parse(raw || "[]")
      if (!Array.isArray(arr)) return []
      return arr
        .map((v: any) => {
          const status = String(v?.status || "ALL").toUpperCase() as ItemStatusFilter
          const allowed = new Set(ITEM_STATUS_OPTIONS.map((o) => String(o.value)))
          return {
            id: String(v?.id || ""),
            name: String(v?.name || ""),
            q: String(v?.q || ""),
            status: allowed.has(status) ? status : "ALL",
            sort: String(v?.sort || "updated_desc"),
            scope: v?.scope === "all" ? "all" : "mine",
            ownerFilter: String(v?.ownerFilter || "all"),
            channel: String(v?.channel || "all") || "all",
            format: String(v?.format || "all") || "all",
            createdAt: Number(v?.createdAt || 0) || 0,
          } satisfies SavedItemView
        })
        .filter((v: SavedItemView) => Boolean(v.id) && Boolean(v.name))
    } catch {
      return []
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem("content:itemViews", JSON.stringify(savedItemViews))
    } catch {}
  }, [savedItemViews])

  const applyItemView = (v: SavedItemView) => {
    setItemQ(v.q || "")
    setItemStatus(v.status)
    setItemSort(v.sort)
    setItemScope(v.scope)
    setItemOwnerFilter(v.ownerFilter)
    setItemChannel(v.channel || "all")
    setItemFormat(v.format || "all")
    toast({ title: "View angewendet", description: v.name })
  }

  const resetItemFilters = () => {
    setItemQ("")
    setItemStatus("ALL")
    setItemSort("updated_desc")
    setItemScope("mine")
    setItemOwnerFilter("all")
    setItemChannel("all")
    setItemFormat("all")
    toast({ title: "Zurückgesetzt", description: "Filter wurden zurückgesetzt." })
  }

  const openSaveViewModal = () => {
    openModal({
      type: "custom",
      title: "View speichern",
      description: "Speichert Suche/Status/Sort/Scope/Owner/Channel/Format als schnelle Ansicht.",
      content: (
        <SaveItemViewForm
          onSave={async (name) => {
            const norm = name.trim()
            if (!norm) return
            const makeId = () => `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
            setSavedItemViews((prev) => {
              const existing = prev.find((x) => x.name.trim().toLowerCase() === norm.toLowerCase())
              const id = existing?.id || makeId()
              const next: SavedItemView = {
                id,
                name: norm,
                q: itemQ.trim(),
                status: itemStatus,
                sort: itemSort,
                scope: itemScope,
                ownerFilter: itemOwnerFilter,
                channel: itemChannel,
                format: itemFormat,
                createdAt: Date.now(),
              }
              return [next, ...prev.filter((x) => x.id !== id)]
            })
            toast({ title: "Gespeichert", description: `"${norm}" wurde gespeichert.` })
          }}
        />
      ),
    })
  }

  const openManageViewsModal = () => {
    openModal({
      type: "custom",
      title: "Views verwalten",
      content: (
        <ManageItemViews
          views={savedItemViews}
          onApply={(v) => applyItemView(v)}
          onDelete={(id) => {
            setSavedItemViews((prev) => prev.filter((x) => x.id !== id))
            toast({ title: "Gelöscht", description: "View wurde gelöscht." })
          }}
        />
      ),
    })
  }

  const exportItemsCsv = () => {
    const csvEscape = (v: any) => {
      const s = String(v ?? "")
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
      return s
    }
    const rows = sortedItems
    const header = ["id", "title", "status", "channel", "format", "due_at", "scheduled_at", "owner", "tags"]
    const lines = [header.map(csvEscape).join(",")]
    for (const it of rows as any[]) {
      lines.push(
        [
          it.id,
          it.title,
          it.status,
          it.channel,
          it.format || "",
          it.dueAt ? new Date(it.dueAt).toISOString() : "",
          it.scheduledAt ? new Date(it.scheduledAt).toISOString() : "",
          it.owner?.email || (it.ownerId != null ? `#${it.ownerId}` : ""),
          Array.isArray(it.tags) ? it.tags.join("|") : "",
        ]
          .map(csvEscape)
          .join(",")
      )
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `content-items-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast({ title: "Export bereit", description: `${rows.length} Items als CSV heruntergeladen.` })
  }

  const [selectMode, setSelectMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<ContentItemStatus | "">("")
  const [bulkOwnerId, setBulkOwnerId] = useState<string>("")

  useEffect(() => {
    if (hubTab !== "items") setSelectMode(false)
  }, [hubTab])
  useEffect(() => {
    if (!selectMode) setSelectedItemIds(new Set())
  }, [selectMode])
  useEffect(() => {
    setSelectedItemIds((prev) => {
      if (prev.size === 0) return prev
      const allowed = new Set(sortedItems.map((it) => it.id))
      let changed = false
      const next = new Set<number>()
      for (const id of prev) {
        if (allowed.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [sortedItems])

  const toggleSelected = (id: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const clearSelection = () => setSelectedItemIds(new Set())
  const selectAll = () => setSelectedItemIds(new Set(sortedItems.map((it) => it.id)))

  const runBulkAction = async (
    label: string,
    ids: number[],
    action: (id: number) => Promise<unknown>,
    confirmText?: string | null
  ) => {
    if (ids.length === 0) return
    if (confirmText !== null) {
      if (!confirm(confirmText || `${label} für ${ids.length} Items?`)) return
    }

    setBulkBusy(true)
    let ok = 0
    let fail = 0
    try {
      for (const id of ids) {
        try {
          await action(id)
          ok += 1
        } catch {
          fail += 1
        }
      }
    } finally {
      setBulkBusy(false)
    }
    try {
      sync.emit("content:changed")
    } catch {
      await refetchItems()
    }
    toast({
      title: label,
      description: `${ok}/${ids.length} erfolgreich${fail ? `, ${fail} fehlgeschlagen` : ""}`,
      variant: fail ? ("destructive" as any) : undefined,
    })
    clearSelection()
    setBulkStatus("")
    setBulkOwnerId("")
  }

  const runBulkUpdate = async (label: string, updates: any) => {
    const ids = Array.from(selectedItemIds)
    return runBulkAction(label, ids, (id) => contentItemsAPI.update(id, updates))
  }

  const openBulkReviewModal = () => {
    const ids = Array.from(selectedItemIds)
    if (ids.length === 0) return
    openModal({
      type: "custom",
      title: "Review anfragen",
      description: `Für ${ids.length} Items`,
      content: (
        <BulkReviewRequestForm
          count={ids.length}
          onRun={(note) =>
            runBulkAction(
              "Review anfragen",
              ids,
              (id) => contentItemsAPI.review.request(id, note),
              null
            )
          }
        />
      ),
    })
  }

  const openBulkApplyTemplateModal = () => {
    const ids = Array.from(selectedItemIds)
    if (ids.length === 0) return
    openModal({
      type: "custom",
      title: "Template anwenden",
      description: `Für ${ids.length} Items`,
      content: (
        <BulkApplyTemplateForm
          count={ids.length}
          onApply={(tpl) =>
            runBulkAction(
              `Template: ${tpl.name}`,
              ids,
              (id) => contentItemsAPI.applyTemplate(id, tpl.id),
              null
            )
          }
        />
      ),
    })
  }

  const openBulkSetDueModal = () => {
    const ids = Array.from(selectedItemIds)
    if (ids.length === 0) return
    openModal({
      type: "custom",
      title: "Fälligkeitsdatum setzen",
      description: `Für ${ids.length} Items`,
      content: (
        <BulkSetDateForm
          count={ids.length}
          mode="due"
          onApply={(isoOrNull) =>
            runBulkAction(
              "Fälligkeitsdatum setzen",
              ids,
              (id) => contentItemsAPI.update(id, { due_at: isoOrNull } as any),
              null
            )
          }
        />
      ),
    })
  }

  const openBulkSetPublishModal = () => {
    const ids = Array.from(selectedItemIds)
    if (ids.length === 0) return
    openModal({
      type: "custom",
      title: "Publish planen",
      description: `Für ${ids.length} Items`,
      content: (
        <BulkSetDateForm
          count={ids.length}
          mode="publish"
          onApply={(isoOrNull) =>
            runBulkAction(
              "Publish planen",
              ids,
              (id) =>
                contentItemsAPI.update(
                  id,
                  { scheduled_at: isoOrNull, ...(isoOrNull ? { status: "SCHEDULED" } : {}) } as any
                ),
              null
            )
          }
        />
      ),
    })
  }

  const openReviewRequestItemModal = (itemId: number) => {
    openModal({
      type: "custom",
      title: "Review anfragen",
      description: `Item #${itemId}`,
      content: (
        <BulkReviewRequestForm
          count={1}
          onRun={async (note) => {
            await contentItemsAPI.review.request(itemId, note)
            toast({ title: "OK", description: "Review wurde angefragt." })
            await refetchItems()
          }}
        />
      ),
    })
  }

  const openApplyTemplateItemModal = (itemId: number) => {
    openModal({
      type: "custom",
      title: "Template anwenden",
      description: `Item #${itemId}`,
      content: (
        <BulkApplyTemplateForm
          count={1}
          onApply={async (tpl) => {
            await contentItemsAPI.applyTemplate(itemId, tpl.id)
            toast({ title: "OK", description: `Template "${tpl.name}" angewendet.` })
            await refetchItems()
          }}
        />
      ),
    })
  }

  const copyToClipboard = async (text: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "Kopiert", description: okMsg })
    } catch {
      toast({ title: "Kopieren fehlgeschlagen", description: "Bitte im Browser Clipboard erlauben.", variant: "destructive" as any })
    }
  }

  const copyItemLink = (id: number) => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const url = `${origin}/content?item=${encodeURIComponent(String(id))}`
    return copyToClipboard(url, `Link für #${id}`)
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

  const load = async () => {
    try {
      setDealsLoading(true)
      setDealsError(null)
      const response = await fetch("/api/crm/deals", { credentials: "include" })
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      const data = await response.json()
      setDeals(data || [])
    } catch (err) {
      setDealsError(err instanceof Error ? err.message : "Unknown error")
      setDeals([])
    } finally {
      setDealsLoading(false)
    }
  }
  useEffect(() => {
    load()
    const unsub = [
      sync.on("global:refresh", load),
      sync.on("crm:companies:changed", load),
      sync.on("activities:changed", load),
    ]
    return () => { unsub.forEach(fn => fn && (fn as any)()) }
  }, [])

  const iconForChannel = (channel: string) => {
    const c = channel.toLowerCase()
    if (c.includes("email")) return <FileText className="h-5 w-5 text-blue-500" />
    if (c.includes("linked")) return <ImageIcon className="h-5 w-5 text-sky-400" />
    if (c.includes("insta")) return <ImageIcon className="h-5 w-5 text-pink-400" />
    if (c.includes("web")) return <File className="h-5 w-5 text-indigo-400" />
    return <FileText className="h-5 w-5 text-slate-300" />
  }

  const dealOptions = useMemo(() => {
    const out: Array<{ value: string; label: string }> = [
      { value: "", label: dealsLoading ? "Lade Deals…" : "Deal auswählen…" },
    ]
    const arr = Array.isArray(deals) ? deals : []
    for (const d of arr.slice(0, 80)) {
      const id = (d as any)?.id ?? (d as any)?.deal_id ?? (d as any)?.dealId
      if (id == null) continue
      const value = String(id)
      const title = String((d as any)?.title || (d as any)?.name || "").trim()
      out.push({ value, label: title ? title : `Deal #${value}` })
    }
    return out
  }, [deals, dealsLoading])

  const replaceItemParam = (id?: number) => {
    try {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : "")
      if (id == null) params.delete("item")
      else params.set("item", String(id))
      const qs = params.toString()
      const base = pathname || "/content"
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false })
    } catch {
      /* noop */
    }
  }

  const openContentItem = (id?: number, initial?: any, opts?: { syncUrl?: boolean }) => {
    if (opts?.syncUrl !== false && id != null) replaceItemParam(id)
    if (id != null) openedItemIdRef.current = id
    openModal({
      type: "custom",
      title: id ? `Content Item #${id}` : "Neues Content Item",
      onDismiss: () => {
        openedItemIdRef.current = null
        replaceItemParam(undefined)
      },
      content: <ContentItemEditor itemId={id} initial={initial} onClose={closeModal} />,
    })
  }

  const openFromUrlRef = useRef<(id: number) => void>(() => {})
  openFromUrlRef.current = (id: number) => openContentItem(id, undefined, { syncUrl: false })

  const itemParam = searchParams ? searchParams.get("item") : null
  useEffect(() => {
    if (!itemParam) return
    const id = Number(itemParam)
    if (Number.isNaN(id) || id <= 0) return
    if (openedItemIdRef.current === id) return
    openedItemIdRef.current = id
    openFromUrlRef.current(id)
  }, [itemParam])

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
              {dealsLoading && <span className="ml-2 hidden sm:inline text-[10px] text-white/70">Sync…</span>}
              {!dealsLoading && dealsError && <span className="ml-2 hidden sm:inline text-[10px] text-amber-200">Error</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20 h-11 sm:h-8 text-xs sm:text-sm"
              onClick={exportItemsCsv}
            >
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
                {itemsLoading ? "Lade…" : `${sortedItems.length} Items`}
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
                    {sortedItems.length}
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
              <div className="relative rounded-2xl border border-white/10 bg-slate-950/30 backdrop-blur-xl p-3 sm:p-4 overflow-hidden">
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
                      onChange={(v) => setItemStatus(v as ItemStatusFilter)}
                      options={ITEM_STATUS_OPTIONS}
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
                    <GlassSelect
                      value={itemChannel}
                      onChange={(v) => setItemChannel(v)}
                      options={channelOptions}
                      className="sm:w-56 min-w-0"
                    />
                    <GlassSelect
                      value={itemFormat}
                      onChange={(v) => setItemFormat(v)}
                      options={formatOptions}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-card shrink-0 whitespace-nowrap h-11 border-white/15 bg-white/5 hover:bg-white/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Filter className="h-4 w-4 mr-2" /> Views
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-white/10 bg-slate-950/95 text-slate-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              openSaveViewModal()
                            }}
                          >
                            View speichern…
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              openManageViewsModal()
                            }}
                          >
                            Views verwalten…
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              resetItemFilters()
                            }}
                          >
                            Filter zurücksetzen
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          {savedItemViews.length === 0 ? (
                            <DropdownMenuItem disabled>Keine gespeicherten Views</DropdownMenuItem>
                          ) : (
                            savedItemViews
                              .slice()
                              .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                              .slice(0, 12)
                              .map((v) => (
                                <DropdownMenuItem
                                  key={v.id}
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    applyItemView(v)
                                  }}
                                >
                                  {v.name}
                                </DropdownMenuItem>
                              ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="outline"
                        size="sm"
                        className="glass-card shrink-0 whitespace-nowrap h-11 border-white/15 bg-white/5 hover:bg-white/10"
                        onClick={() => setSelectMode((v) => !v)}
                      >
                        {selectMode ? <X className="h-4 w-4 mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
                        {selectMode ? "Fertig" : "Auswählen"}
                      </Button>
                      {selectMode && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-card shrink-0 whitespace-nowrap h-11 border-white/15 bg-white/5 hover:bg-white/10"
                            onClick={selectAll}
                            disabled={sortedItems.length === 0}
                          >
                            <Square className="h-4 w-4 mr-2" /> All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-card shrink-0 whitespace-nowrap h-11 border-white/15 bg-white/5 hover:bg-white/10"
                            onClick={clearSelection}
                            disabled={selectedItemIds.size === 0}
                          >
                            Leeren
                          </Button>
                        </>
                      )}
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
                        <Plus className="h-4 w-4 mr-2" /> Neues Item
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
                        <div className="mt-3 text-sm font-semibold text-slate-100">Keine Items gefunden</div>
                        <div className="mt-1 text-xs text-slate-400">
                          Keine Treffer mit den aktuellen Filtern. Setze Filter zurück oder erstelle ein neues Item.
                        </div>
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            className="h-11 glass-card"
                            onClick={() => resetItemFilters()}
                          >
                            Filter zurücksetzen
                          </Button>
                          <Button className="h-11 bg-white text-slate-900 hover:bg-white/90" onClick={() => openContentItem()}>
                            <Plus className="h-4 w-4 mr-2" /> Neues Item
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {sortedItems.map((it) => (
                    <div
                      key={it.id}
                      className={[
                        "group relative rounded-2xl border border-white/10 bg-slate-950/30 backdrop-blur-xl p-4 text-left overflow-hidden transition-all hover:bg-slate-950/40 hover:ring-1 hover:ring-white/10 hover:shadow-[0_14px_36px_rgba(0,0,0,0.35)]",
                        selectMode && selectedItemIds.has(it.id) ? "ring-1 ring-white/25 bg-slate-950/45" : "",
                      ].join(" ")}
                      role="button"
                      tabIndex={0}
                      onClick={() => (selectMode ? toggleSelected(it.id) : openContentItem(it.id))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          selectMode ? toggleSelected(it.id) : openContentItem(it.id)
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
                          {selectMode && (
                            <button
                              type="button"
                              className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 inline-flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSelected(it.id)
                              }}
                              aria-label={selectedItemIds.has(it.id) ? "Deselect item" : "Select item"}
                            >
                              {selectedItemIds.has(it.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            </button>
                          )}
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
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  openReviewRequestItemModal(it.id)
                                }}
                              >
                                Review anfragen…
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  openApplyTemplateItemModal(it.id)
                                }}
                              >
                                Template anwenden…
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
                                  copyItemLink(it.id)
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2 opacity-80" /> Link kopieren
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
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${datePill(it.dueAt, "due")}`}>
                            <Clock className="h-3.5 w-3.5" /> Due: {fmtDate(it.dueAt)}{" "}
                            <span className="opacity-80">({relDays(it.dueAt)})</span>
                          </span>
                        )}
                        {it.scheduledAt && (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${datePill(it.scheduledAt, "publish")}`}>
                            <CalendarDays className="h-3.5 w-3.5" /> Publish: {fmtDate(it.scheduledAt)}{" "}
                            <span className="opacity-80">({relDays(it.scheduledAt)})</span>
                          </span>
                        )}
                        {isAdmin && (
                          <span
                            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 max-w-[220px] truncate"
                            title={it.owner?.email || undefined}
                          >
                            {it.owner?.email || (it.ownerId != null ? `User #${it.ownerId}` : "Unassigned")}
                          </span>
                        )}
                        <span className="ml-auto text-slate-300/70 group-hover:text-slate-200 transition">Öffnen →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectMode && selectedItemIds.size > 0 && (
                <div className="fixed inset-x-0 bottom-3 z-50 px-4 sm:px-6">
                  <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-3 shadow-[0_18px_70px_rgba(0,0,0,0.55)]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-100">
                          {selectedItemIds.size} selected
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass-card h-9"
                          disabled={bulkBusy}
                          onClick={clearSelection}
                        >
                          Leeren
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass-card h-9"
                          disabled={bulkBusy}
                          onClick={() => setSelectMode(false)}
                        >
                          <X className="h-4 w-4 mr-2" /> Fertig
                        </Button>
                      </div>

                      <div className="sm:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <GlassSelect
                            value={bulkStatus}
                            onChange={(v) => setBulkStatus(v as any)}
                            options={[
                              { value: "", label: "Status…" },
                              ...ITEM_STATUS_OPTIONS.filter((o) => o.value !== "ALL").map((o) => ({
                                value: String(o.value),
                                label: o.label,
                              })),
                            ]}
                            className="w-full sm:w-48"
                          />
                          <Button
                            size="sm"
                            className="h-9 bg-white text-slate-900 hover:bg-white/90 shrink-0"
                            disabled={bulkBusy || !bulkStatus}
                            onClick={() => runBulkUpdate("Status setzen", { status: bulkStatus })}
                          >
                            Anwenden
                          </Button>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <GlassSelect
                              value={bulkOwnerId}
                              onChange={(v) => setBulkOwnerId(v)}
                              options={[
                                { value: "", label: "Owner…" },
                                { value: "unassigned", label: "Unassigned" },
                                ...adminUsers.map((u) => ({ value: String(u.id), label: u.email })),
                              ]}
                              className="w-full sm:w-64"
                            />
                            <Button
                              size="sm"
                              className="h-9 bg-white text-slate-900 hover:bg-white/90 shrink-0"
                              disabled={bulkBusy || !bulkOwnerId}
                              onClick={() =>
                                runBulkUpdate("Owner setzen", {
                                  owner_id: bulkOwnerId === "unassigned" ? null : Number(bulkOwnerId),
                                })
                              }
                            >
                              Anwenden
                            </Button>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-card h-9 shrink-0"
                            disabled={bulkBusy}
                            onClick={() => runBulkUpdate("Archivieren", { status: "ARCHIVED" })}
                          >
                            <Archive className="h-4 w-4 mr-2" /> Archivieren
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-card h-9 shrink-0"
                            disabled={bulkBusy}
                            onClick={() => runBulkUpdate("Wiederherstellen", { status: "DRAFT" })}
                          >
                            <ArchiveRestore className="h-4 w-4 mr-2" /> Wiederherstellen
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="glass-card h-9 shrink-0"
                                disabled={bulkBusy}
                              >
                                <MoreHorizontal className="h-4 w-4 mr-2" /> Mehr
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="border-white/10 bg-slate-950/95 text-slate-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  openBulkReviewModal()
                                }}
                              >
                                Review anfragen…
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  openBulkApplyTemplateModal()
                                }}
                              >
                                Template anwenden…
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  openBulkSetDueModal()
                                }}
                              >
                                Fälligkeitsdatum setzen…
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  openBulkSetPublishModal()
                                }}
                              >
                                Publish planen…
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
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
        <Card id="mk-planner" className="glass-card overflow-hidden">
          <CardHeader className="px-4 sm:px-6 pt-4 pb-3 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  Planner‑Board
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-200/80">
                    Drag & Drop
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Ziehe Items durch den Workflow. Änderungen werden sofort gespeichert.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                  {itemsLoading ? "…" : `${sortedItems.length} Items`}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                  Review: {sortedItems.filter((it) => String(it.status || "").toUpperCase() === "REVIEW").length}
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                    Unassigned: {sortedItems.filter((it: any) => it.ownerId == null).length}
                  </span>
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <GlassSelect
                  value={dealPick}
                  onChange={(v) => setDealPick(v)}
                  options={dealOptions}
                  className="w-full sm:flex-1 min-w-0"
                />
                <Button
                  size="sm"
                  className="h-11 sm:h-9 bg-white text-slate-900 hover:bg-white/90 shrink-0"
                  disabled={!dealPick || dealsLoading}
                  onClick={async () => {
                    const id = Number(dealPick)
                    if (Number.isNaN(id)) return
                    try {
                      const res = await contentItemsAPI.generateFromDeal(id)
                      toast({ title: "Erstellt", description: `Content Item #${res.item_id} wurde generiert.` })
                      await refetchItems()
                      openContentItem(res.item_id)
                      setDealPick("")
                    } catch (e: any) {
                      toast({
                        title: "Fehler",
                        description: e?.message || "Generieren fehlgeschlagen.",
                        variant: "destructive" as any,
                      })
                    }
                  }}
                >
                  {dealsLoading ? "…" : "Aus Deal generieren"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-4">
            {itemsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 overflow-hidden">
                    <div className="h-3 w-1/3 bg-white/10 rounded" />
                    <div className="mt-4 h-4 w-2/3 bg-white/10 rounded" />
                    <div className="mt-2 h-3 w-1/2 bg-white/5 rounded" />
                    <div className="mt-4 h-20 w-full bg-white/5 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : (
              <ContentItemsPlannerBoard
                disabled={bulkBusy}
                statuses={[
                  "IDEA",
                  "DRAFT",
                  "REVIEW",
                  "APPROVED",
                  "SCHEDULED",
                  "PUBLISHED",
                  "BLOCKED",
                  "ARCHIVED",
                ]}
                items={sortedItems.map((it: any) => ({
                  id: it.id,
                  title: it.title,
                  channel: it.channel,
                  format: it.format,
                  status: it.status,
                  dueAt: it.dueAt,
                  scheduledAt: it.scheduledAt,
                  ownerEmail: it.owner?.email || null,
                }))}
                onOpenItem={(id) => openContentItem(id)}
                onCreateItem={(status) => openContentItem(undefined, { status })}
                onMove={async (id, nextStatus) => {
                  try {
                    await updateContentItem(id, { status: nextStatus } as any)
                    toast({ title: "Gespeichert", description: `Status → ${nextStatus}` })
                  } catch (e: any) {
                    toast({
                      title: "Fehler",
                      description: e?.message || "Status konnte nicht gespeichert werden.",
                      variant: "destructive" as any,
                    })
                    throw e
                  }
                }}
              />
            )}
          </CardContent>
        </Card>
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
            onTaskMove={async (taskId, newStatus) => {
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

export default function ContentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 md:p-8 min-h-[100dvh]">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 backdrop-blur-xl p-6 text-slate-200">
            Lade Content Hub…
          </div>
        </div>
      }
    >
      <ContentPageInner />
    </Suspense>
  )
}


