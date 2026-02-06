"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Plus, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import KanbanBoard, { type TaskStatus as KanbanStatus } from "@/components/kanban/kanban-board"
import { useModal } from "@/components/ui/modal/ModalProvider"
import { useContentData, type ContentTask } from "@/hooks/use-content-data"
import { crmApi, type Deal } from "@/lib/crm-api"

interface Props { slug: string }

function slugify(title: string): string {
  return (title || "deal")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function channelFromIndustry(industry?: string): string {
  const map: Record<string, string> = {
    Technology: "Website",
    Healthcare: "Email",
    Finance: "Social Media",
    Retail: "Blog",
  }
  if (!industry) return "Website"
  return map[industry] || "Website"
}

interface TaskQuickCreateProps {
  defaultStatus: KanbanStatus
  defaultChannel: string
  onCreate: (payload: {
    title: string
    channel: string
    format?: string
    status: KanbanStatus
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
    notes?: string
    deadline?: Date
  }) => Promise<void> | void
}

function TaskQuickCreate({ defaultStatus, defaultChannel, onCreate }: TaskQuickCreateProps) {
  const { closeModal } = useModal()
  const [title, setTitle] = useState("")
  const [channel, setChannel] = useState(defaultChannel)
  const [format, setFormat] = useState<string | undefined>("Landing Page")
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM")
  const [deadline, setDeadline] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onCreate({
        title: title.trim(),
        channel,
        format,
        status: defaultStatus,
        priority,
        notes: notes.trim() || undefined,
        deadline: deadline ? new Date(deadline) : undefined,
      })
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-1">
      <div className="space-y-1">
        <label className="text-xs text-slate-300">Titel</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Landingpage für Kampagne"
          className="h-11 sm:h-9 w-full rounded-md bg-slate-950/60 border border-slate-700 px-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Channel</label>
          <input
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="h-11 sm:h-9 w-full rounded-md bg-slate-950/60 border border-slate-700 px-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Format</label>
          <input
            value={format || ""}
            onChange={(e) => setFormat(e.target.value || undefined)}
            placeholder="Landing Page, Newsletter…"
            className="h-11 sm:h-9 w-full rounded-md bg-slate-950/60 border border-slate-700 px-2 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Priorität</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="h-11 sm:h-9 w-full rounded-md bg-slate-950/60 border border-slate-700 px-2 text-xs text-slate-200"
          >
            <option value="LOW">Niedrig</option>
            <option value="MEDIUM">Mittel</option>
            <option value="HIGH">Hoch</option>
            <option value="URGENT">Dringend</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Fällig am</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="h-11 sm:h-9 w-full rounded-md bg-slate-950/60 border border-slate-700 px-2 text-sm text-slate-200"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-300">Notizen</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[70px] w-full rounded-md bg-slate-950/60 border border-slate-700 px-2 py-1.5 text-xs text-slate-200"
          placeholder="Kurzbeschreibung / nächste Schritte…"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={closeModal}
          className="h-8 border-slate-600 text-xs"
        >
          Abbrechen
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={saving || !title.trim()}
          className="h-8 text-xs"
        >
          {saving ? "Speichere…" : "Task erstellen"}
        </Button>
      </div>
    </form>
  )
}

export default function CampaignDetailClient({ slug }: Props) {
  const { openModal } = useModal()
  const { tasks, loading, error, addTask, updateTask, deleteTask } = useContentData()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [deals, companies] = await Promise.all([
          crmApi.getDeals(),
          crmApi.getCompanies(),
        ])
        if (cancelled) return
        const found = deals.find((d) => slugify(d.title) === slug)
        if (!found) {
          setDeal(null)
          setCompanyName("")
          return
        }
        setDeal(found)
        const company =
          companies.find((c) => c.id === (found as any).company_id) ||
          (found as any).company ||
          null
        setCompanyName(company?.name || "")
      } catch {
        if (!cancelled) {
          setDeal(null)
          setCompanyName("")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  const campaignTasks: ContentTask[] = useMemo(() => {
    if (!deal) return []
    const id = String((deal as any).id)
    return tasks.filter((t) => t.activityId === id)
  }, [tasks, deal])

  const handleCreateTask = (status: KanbanStatus) => {
    if (!deal) return
    const id = String((deal as any).id)
    const channel = channelFromIndustry(((deal as any).company?.industry) || "")
    openModal({
      type: "custom",
      title: "Neue Content‑Aufgabe",
      content: (
        <TaskQuickCreate
          defaultStatus={status}
          defaultChannel={channel}
          onCreate={async (payload) => {
            await addTask({
              ...payload,
              activityId: id,
            })
          }}
        />
      ),
    })
  }

  if (!mounted || loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-500 dark:text-slate-400">
        Lade Kampagne…
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-red-500">
        Fehler beim Laden der Content‑Tasks: {error}
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-600 dark:text-slate-400">
        Kampagne nicht gefunden.
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <motion.div className="max-w-7xl mx-auto p-8 space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/content">
            <Button variant="outline" size="sm" className="glass-card hover:ring-1 hover:ring-blue-500/30">
              <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-light tracking-tight text-slate-900 dark:text-slate-100">{deal.title}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Content‑Plan für Deal {companyName ? `bei ${companyName}` : ""}.
            </p>
          </div>
        </div>
        <Button onClick={() => handleCreateTask("TODO")} className="glass-card hover:ring-1 hover:ring-blue-500/30 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Neuer Content
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
        <span>
          <span className="font-semibold">Kanal:</span>{" "}
          {channelFromIndustry(((deal as any).company?.industry) || "")}
        </span>
        {companyName && (
          <span>
            <span className="font-semibold">Unternehmen:</span> {companyName}
          </span>
        )}
        <span>
          <span className="font-semibold">Verantwortlicher:</span> {(deal as any).owner}
        </span>
        {(deal as any).expected_close_date && (
          <span>
            <span className="font-semibold">Expected Close:</span>{" "}
            {new Date((deal as any).expected_close_date).toLocaleDateString("de-DE")}
          </span>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <KanbanBoard
          tasks={campaignTasks}
          onTaskMove={async (taskId, newStatus) => {
            await updateTask(taskId, { status: newStatus as any })
          }}
          onDeleteTask={(taskId) => deleteTask(taskId)}
          onCreateTask={handleCreateTask}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="glass-card p-4 border-l-4 border-blue-500/40">
          <CardContent className="p-0">
            <div className="flex items-start gap-3">
              <Sparkles className="text-blue-400 w-5 h-5 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">AI Vorschläge für Kampagne</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Basierend на Kampagnenverlauf & CRM‑Daten.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
