"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalendarApi } from "@/hooks/use-calendar-api"
import { useModal } from "@/components/ui/modal/ModalProvider"
import { apiBase } from "@/lib/api"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { GlassSelect } from "@/components/ui/glass-select"
import { type Activity } from "@/components/circle/radial-circle"
import dynamic from 'next/dynamic'
const SimpleCalendar = dynamic(() => import("@/components/calendar/simple-calendar"), { ssr: false })
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts"

export default function CalendarPage() {
  const { events, isLoading, error, createEvent, updateEvent, deleteEvent, refresh, addExceptionDate, getExceptions } =
    useCalendarApi() as any
  const { openModal } = useModal()
  const [companies, setCompanies] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const [companiesRes, projectsRes] = await Promise.all([
          fetch(`${apiBase}/crm/companies`, { credentials: "include" }).catch(() => null),
          fetch(`${apiBase}/crm/projects`, { credentials: "include" }).catch(() => null),
        ])

        const companiesData = await (companiesRes ? companiesRes.json().catch(() => []) : [])
        const projectsData = await (projectsRes ? projectsRes.json().catch(() => []) : [])

        setCompanies(Array.isArray(companiesData) ? companiesData : (companiesData?.items ?? []))
        setProjects(Array.isArray(projectsData) ? projectsData : (projectsData?.items ?? []))
      } catch {}
    })()
  }, [])
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Kalender</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">Lade Kalender...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Kalender</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-red-400">Fehler beim Laden des Kalenders: {error.message}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Convert CalendarEvent to Activity format + expand recurrences
  const safeEvents = Array.isArray(events) ? events : []
  const now = new Date()
  const horizonStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0)
  const horizonEnd = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59, 999)
  const expandRecurrence = (e: any): Activity[] => {
    const rec = (e as any).recurrence
    const serverExceptions = Array.isArray((e as any).recurrence_exceptions) ? ((e as any).recurrence_exceptions as string[]) : []
    const localExceptions = typeof getExceptions === "function" ? (getExceptions(String(e.id)) as string[]) : []
    const exceptionSet = new Set<string>([...serverExceptions, ...(Array.isArray(localExceptions) ? localExceptions : [])])
    const companyId = (e as any).company_id
    const projectId = (e as any).project_id
    const company = companies.find((c: any) => String(c.id ?? c._id) === String(companyId))
    const project = (projects as any[] | undefined)?.find(
      (p: any) => String(p.id ?? p._id) === String(projectId)
    )
    const base: Activity = {
      id: String(e.id),
      title: e.title,
      category: (e as any).category ? (String((e as any).category) as any) : ("KUNDENPFLEGE" as const),
      status: ((e as any).status as any) || ("PLANNED" as const),
      weight: 1,
      budgetCHF: 0,
      expectedLeads: 0,
      start: new Date(e.start),
      end: e.end ? new Date(e.end as any) : undefined,
      ownerId: (e as any).owner_id ? String((e as any).owner_id) : undefined,
      owner: (e as any).owner
        ? { name: String((e as any).owner.full_name || (e as any).owner.email || "") }
        : undefined,
      notes: (e as any).description || (e as any).notes,
      // Enriched CRM links for UI
      companyId: companyId ? String(companyId) : undefined,
      companyName: company?.name,
      projectId: project ? String(project.id ?? project._id) : undefined,
      projectName: project?.title,
      // @ts-ignore - Activity.color is optional
      color: (e as any)?.color,
    }
    if (!rec || !rec.freq) return [base]
    const occurrences: Activity[] = []
    const interval = Math.max(1, rec.interval || 1)
    const maxCount = Math.min(rec.count || 5000, 5000)
    const untilIso =
      typeof rec.until === "string" && String(rec.until).trim()
        ? String(rec.until).trim().slice(0, 10)
        : null
    let cursor = new Date(e.start)
    let i = 0
    while (i < maxCount) {
      if (cursor > horizonEnd) break
      const iso = format(cursor, "yyyy-MM-dd")
      if (untilIso && iso > untilIso) break
      if (cursor >= horizonStart && cursor <= horizonEnd && !exceptionSet.has(iso)) {
        occurrences.push({
          ...base,
          id: `${e.id}::${iso}`,
          // @ts-ignore
          sourceId: String(e.id),
          // @ts-ignore
          occurrenceDateISO: iso,
          start: new Date(cursor),
        })
      }
      if (rec.freq === 'daily') cursor.setDate(cursor.getDate() + interval)
      else if (rec.freq === 'weekly') cursor.setDate(cursor.getDate() + 7 * interval)
      else cursor.setMonth(cursor.getMonth() + interval)
      i++
    }
    return occurrences
  }
  const activities: Activity[] = safeEvents.flatMap(expandRecurrence)
  // Reports datasets
  const byCategory = Object.values(activities.reduce((acc: any, a: any) => {
    const k = a.category || 'OTHER'
    acc[k] = acc[k] || { name: k, value: 0 }
    acc[k].value += 1
    return acc
  }, {}))
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  const byMonth = Object.values(activities.reduce((acc: any, a: any) => {
    const k = monthKey(new Date(a.start as any))
    acc[k] = acc[k] || { month: k, planned: 0, done: 0 }
    acc[k].planned += 1
    // naive completion: treat items with status DONE as done
    if ((a as any).status === 'DONE') acc[k].done += 1
    return acc
  }, {})).sort((a:any,b:any)=> a.month.localeCompare(b.month))
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 sm:space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-gradient-to-tr from-fuchsia-500/30 to-blue-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-500/30 to-emerald-500/30 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">Kalender</h1>
            <p className="text-slate-300 text-sm">Marketing Termine, Events und Aufgaben</p>
          </div>
          <div className="flex gap-2" data-tour="calendar-toolbar">
            <Button size="sm" variant="outline" className="glass-card" onClick={() => openModal({
              type: "custom",
              title: "Vorlagen",
              content: (
                <CalendarTemplates
                  onCreate={async (payloads) => {
                    for (const p of payloads) { await createEvent(p as any) }
                    await refresh()
                  }}
                />
              )
            })}>Vorlagen</Button>
            <Button size="sm" className="bg-white text-slate-900 hover:bg-white/90" onClick={() => openModal({
              type: "custom",
              title: "Neue Aktivität",
              content: (
                <CalendarCreateForm
                  date={new Date()}
                  companies={companies}
                  onCreate={async (payload) => {
                    await createEvent(payload)
                    refresh()
                  }}
                />
              )
            })}>+ Neue Aktivität</Button>
          </div>
        </div>
      </div>

      <div data-tour="calendar-grid">
        <SimpleCalendar
            activities={activities}
            onCreateActivity={(date: Date) => {
              openModal({
                type: "custom",
                title: "Neue Aktivität",
                description: `Für ${format(date, 'PPP', { locale: de })}`,
                content: (
                  <CalendarCreateForm
                    date={date}
                    companies={companies}
                    onCreate={async (payload) => {
                      await createEvent(payload)
                      refresh()
                    }}
                  />
                )
              })
            }}
            onDateClick={(date: Date) => {
              // Shortcut: Klick auf Tag öffnet сразу создание
              openModal({
                type: "custom",
                title: "Neue Aktivität",
                description: `Für ${format(date, 'PPP', { locale: de })}`,
                content: (
                  <CalendarCreateForm
                    date={date}
                    companies={companies}
                    onCreate={async (payload) => {
                      await createEvent(payload)
                      refresh()
                    }}
                  />
                )
              })
            }}
            onUpdateActivity={async (id: string, updates: any, opts?: { scope?: 'series' | 'only'; occurrenceDateISO?: string; sourceId?: string }) => {
              try {
                const payload: any = {}
                if (updates.title !== undefined) payload.title = updates.title
                if ((updates as any).notes !== undefined) payload.description = (updates as any).notes
                if ((updates as any).status !== undefined) payload.status = (updates as any).status
                if ((updates as any).start !== undefined) {
                  payload.start =
                    updates.start instanceof Date
                      ? (updates.start as Date).toISOString()
                      : String(updates.start)
                }
                if ((updates as any).end !== undefined) {
                  payload.end =
                    updates.end instanceof Date
                      ? (updates.end as Date).toISOString()
                      : (updates.end ? String(updates.end) : undefined)
                }
                if ((updates as any).color !== undefined) payload.color = (updates as any).color
                if ((updates as any).category !== undefined) payload.category = (updates as any).category
                if (opts?.scope === 'only' && opts?.occurrenceDateISO && opts?.sourceId) {
                  // detach one occurrence: create a new event on that date and add exception to series locally
                  addExceptionDate(opts.sourceId, opts.occurrenceDateISO)
                  // persist exception to backend (cross-browser)
                  await updateEvent(String(opts.sourceId), { add_exception_date: opts.occurrenceDateISO } as any)
                  const series = safeEvents.find((ev: any) => String(ev?.id) === String(opts.sourceId)) as any
                  await createEvent({
                    title: payload.title || updates.title,
                    description: payload.description,
                    status: payload.status,
                    start: payload.start || (opts.occurrenceDateISO + 'T09:00:00'),
                    end: payload.end,
                    type: 'event',
                    category: payload.category || series?.category,
                    color: payload.color || series?.color,
                    company_id: series?.company_id ?? undefined,
                    project_id: series?.project_id ?? undefined,
                  })
                } else {
                  await updateEvent(String(id).split('::')[0], payload)
                }
                refresh()
              } catch {}
            }}
            onDeleteActivity={async (id) => {
              try {
                const s = String(id)
                if (s.includes('::')) {
                  const [sourceId, iso] = s.split('::')
                  if (sourceId && iso) {
                    addExceptionDate(sourceId, iso)
                    await updateEvent(String(sourceId), { add_exception_date: iso } as any)
                    refresh()
                    return
                  }
                }
                await deleteEvent(id as any)
                refresh()
              } catch {}
            }}
            onDuplicateActivity={async (activity) => {
              // quick duplicate: create a new event on the same date with same title/category/color
              await createEvent({
                title: `${activity.title} (Copy)`,
                description: activity.notes,
                start: activity.start as any,
                end: activity.end as any,
                type: 'event',
                color: (activity as any).color,
                category: activity.category,
                company_id: (activity as any).companyId,
                project_id: (activity as any).projectId,
              } as any)
              refresh()
            }}
          />
      </div>

      {/* Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-white">Verteilung nach Typ</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="#0f172a">
                  {byCategory.map((c:any, i:number) => <Cell key={i} fill={['#3b82f6','#a78bfa','#10b981','#f59e0b','#ef4444','#06b6d4'][i%6]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 12, color: '#0f172a' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass-card lg:col-span-2">
          <CardHeader><CardTitle className="text-white">Plan vs Done</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byMonth}>
                <CartesianGrid stroke="rgba(148,163,184,.15)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#a3b1c6' }} />
                <YAxis tick={{ fill: '#a3b1c6' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 12, color: '#0f172a' }} />
                <Line dataKey="planned" stroke="#a3b1c6" strokeWidth={2} />
                <Line dataKey="done" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

// Inline client-side form used as custom modal content
function CalendarCreateForm({ date, companies, onCreate }: { date: Date; companies: any[]; onCreate: (payload: any) => Promise<void> }) {
  const { closeModal } = useModal()
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined)
  const [aiEnabled, setAiEnabled] = useState(true) // legacy flag (kept for compatibility)
  const [aiPreview, setAiPreview] = useState<{ title?: string; desc?: string } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [when, setWhen] = useState(format(date, 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("")
  const [activityType, setActivityType] = useState("event")
  const [priority, setPriority] = useState("medium")
  const [ownerId, setOwnerId] = useState<string | undefined>(undefined)
  const [projectId, setProjectId] = useState<string | undefined>(undefined)
  const [color, setColor] = useState<string>("#3b82f6")
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  // recurrence
  const [recFreq, setRecFreq] = useState<'none'|'daily'|'weekly'|'monthly'>('none')
  const [recInterval, setRecInterval] = useState<number>(1)
  const [recCount, setRecCount] = useState<number>(0)
  const [recUntil, setRecUntil] = useState<string>("")
  const recEnabled = recFreq !== 'none'
  useEffect(() => {
    if (!recEnabled) {
      setRecInterval(1)
      setRecCount(0)
      setRecUntil("")
    }
  }, [recEnabled])

  // Helper: produce local demo suggestions when server AI is unavailable or company is not selected
  const generateLocalSuggestion = () => {
    const companyName = companies.find((c:any) => String(c.id ?? c._id) === String(selectedCompanyId))?.name
    const dateLabel = (() => {
      try { return format(new Date(`${when}T${startTime || '09:00'}:00`), "PPP p", { locale: de }) } catch { return when }
    })()
    const baseTitle = title && title.trim().length > 2 ? title.trim() : (
      activityType === 'meeting' ? `${companyName ? companyName + ' – ' : ''}Meeting` :
      activityType === 'task' ? `${companyName ? companyName + ': ' : ''}Aufgabe` :
      activityType === 'campaign' ? `${companyName ? companyName + ' – ' : ''}Kampagne` :
      activityType === 'reminder' ? `Erinnerung` : `Event`
    )
    const genDesc = `Kurzbeschreibung: ${companyName ? companyName + ' – ' : ''}${baseTitle} am ${dateLabel}.
Ziele: klares Ergebnis definieren, nächste Schritte festlegen.
Agenda: Begrüßung • Update • Diskussion • To‑dos.
Hinweis: Bitte relevante Unterlagen mitbringen.`
    return { t: baseTitle, d: genDesc }
  }

  const makeSuggestion = async () => {
    setAiLoading(true)
    try {
      const url = `${apiBase}/ai/activity_suggest`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          company_id: selectedCompanyId || undefined,
          draft: {
            title,
            description,
            type: activityType,
            date: when,
            startTime,
            endTime,
            priority,
            recurrence: recFreq === 'none' ? undefined : { freq: recFreq, interval: recInterval || 1, count: recCount || undefined, until: recUntil || undefined },
          }
        })
      }).catch(()=>null)
      const data = await (res ? res.json().catch(()=>({})) : ({}))
      if (data?.title || data?.description) {
        setAiPreview({ title: data.title, desc: data.description })
        return
      }
      const { t, d } = generateLocalSuggestion()
      setAiPreview({ title: t, desc: d })
    } finally { setAiLoading(false) }
  }

  const refineSuggestion = async () => {
    if (!aiPreview) return
    setAiLoading(true)
    try {
      const url = `${apiBase}/ai/activity_suggest`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          company_id: selectedCompanyId || undefined,
          prompt: { title: aiPreview.title, description: aiPreview.desc },
          draft: {
            type: activityType,
            date: when,
            startTime,
            endTime,
            priority,
          }
        })
      }).catch(()=>null)
      const data = await (res ? res.json().catch(()=>({})) : ({}))
      if (data?.title || data?.description) {
        setAiPreview({ title: data.title || aiPreview.title, desc: data.description || aiPreview.desc })
      } else {
        // Local refinement: keep title, improve structure of description
        const t = (aiPreview.title || '').trim() || 'Event'
        const d = (aiPreview.desc || '').trim()
        const refined = d.length > 0
          ? `${t}\n\n${d}\n\nAgenda: Begrüßung • Update • Diskussion • To‑dos.`
          : `${t}: Ziel, Agenda, nächste Schritte. Bitte Materialien mitbringen.`
        setAiPreview({ title: t, desc: refined })
      }
    } finally { setAiLoading(false) }
  }

  // (Optional legacy) keep minimal autofill when включено авто; теперь отключено по умолчанию
  useEffect(() => { /* no‑auto insert */ }, [aiEnabled, selectedCompanyId])

  // Reactive enhancement: if user starts typing a short hint, expand description once
  useEffect(() => { /* reactive hints handled in preview */ }, [title, activityType, when, startTime])

  // Fetch users/projects for selects (best-effort)
  useEffect(() => {
    const base = apiBase
    ;(async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          fetch(`${base}/crm/users`).catch(() => null),
          fetch(`${base}/crm/projects`).catch(() => null),
        ])
        const u = await (uRes ? uRes.json().catch(() => []) : [])
        const p = await (pRes ? pRes.json().catch(() => []) : [])
        setUsers(Array.isArray(u) ? u : (u?.items ?? []))
        setProjects(Array.isArray(p) ? p : (p?.items ?? []))
      } catch {}
    })()
  }, [])

  const handleSubmit = async () => {
    const startISO = `${when}T${(startTime || '09:00')}:00`
    const endISO = endTime ? `${when}T${endTime}:00` : undefined
    await onCreate({
      title: title || 'Neue Aktivität',
      description,
      type: activityType,
      start: startISO,
      end: endISO,
      priority,
      owner_id: ownerId,
      project_id: projectId,
      color, // persist chosen color
      category: activityType ? activityType : undefined,
      company_id: selectedCompanyId,
      recurrence: recFreq === 'none' ? undefined : { freq: recFreq, interval: recInterval || 1, count: recCount || undefined, until: recUntil || undefined },
    })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 space-y-6 border border-white/20 dark:border-neutral-800/40 backdrop-blur-md bg-white/70 dark:bg-neutral-900/40 shadow-[0_0_25px_rgba(59,130,246,0.12)]">
      <div className="pointer-events-none absolute inset-px rounded-[14px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
      <div className="relative space-y-5">
        <div className="grid gap-2">
          <Label>Unternehmen auswählen</Label>
          <GlassSelect
            value={selectedCompanyId || ''}
            onChange={(v) => setSelectedCompanyId(v || undefined)}
            placeholder="Firma auswählen"
            options={companies.map((c: any) => ({ value: String(c.id ?? c._id), label: c.name || c.title }))}
          />
                </div>

        <div className="grid gap-2">
          <Label>Titel</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel eingeben" className="focus:ring-2 focus:ring-blue-500/60 border-white/20 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60" />
                </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>Beschreibung</Label>
            <div className="flex items-center gap-2">
              {/* WOW AI button */}
              <button
                type="button"
                onClick={makeSuggestion}
                disabled={aiLoading}
                className="group relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-all duration-300 focus:outline-none disabled:opacity-60 backdrop-blur-sm border border-white/10 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 hover:from-blue-500/20 hover:via-purple-500/20 hover:to-pink-500/20"
                style={{ 
                  boxShadow: '0 0 20px rgba(59,130,246,0.3), 0 0 40px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <span className="relative z-10">KI-Vorschlag</span>
                <span 
                  className="absolute -inset-[1px] rounded-lg opacity-50 blur-sm pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.4) 0%, rgba(168,85,247,0.4) 50%, rgba(236,72,153,0.4) 100%)' }}
                />
              </button>
              {aiPreview && (
                <Button variant="outline" size="sm" onClick={makeSuggestion} disabled={aiLoading} className="border-white/30 bg-white/5">Regenerieren</Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibung" className="flex-1 min-h-[88px] focus:ring-2 focus:ring-blue-500/60 border-white/20 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60" />
            <Button
              type="button"
              variant="outline"
              className="h-9 border-white/20 bg-white/5"
              onClick={() => {
                const c = companies.find((cc:any)=> String(cc.id ?? cc._id) === String(selectedCompanyId))
                const nextDate = (() => { const d = new Date(); d.setDate(d.getDate()+1); return format(d, 'yyyy-MM-dd') })()
                setWhen(nextDate); setStartTime('10:00'); setEndTime('11:00'); setActivityType('meeting')
                if (c?.name) setTitle(t => t || `${c.name} — Meeting`)
                setDescription(prev => prev || `Besprechung mit ${c?.name || 'Partner'}.\nAgenda: Intro • Update • Nächste Schritte.`)
              }}
            >
              Autofill aus Firma
            </Button>
          </div>
          {aiPreview && (
            <div className="relative max-w-[560px] rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 p-2.5 shadow-[0_0_0_1px_rgba(59,130,246,.15)] animate-pulse">
              <div className="flex items-center gap-2 text-[11px] text-blue-300 font-medium mb-1.5">
                <div className="h-4 w-4 rounded-md bg-blue-500/20 text-blue-300 flex items-center justify-center">✨</div>
                <span>KI‑Vorschlag (Vorschau) — отредактируйте и нажмите "Verfeinern"</span>
              </div>
              <div className="grid gap-1.5">
                <Input value={aiPreview.title || ''} onChange={(e)=> setAiPreview(p=>({ ...(p||{}), title: e.target.value }))} placeholder="Vorschlag Titel" className="bg-transparent border border-white/15 text-sm h-8 px-2" />
                <Textarea value={aiPreview.desc || ''} onChange={(e)=> setAiPreview(p=>({ ...(p||{}), desc: e.target.value }))} className="min-h-[72px] text-sm bg-transparent border border-white/15 px-2 py-1" placeholder="Vorschlag Beschreibung" />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button size="sm" className="px-2.5 py-1 text-xs" onClick={()=>{ if (aiPreview?.title && (!title || title.trim().length<3)) setTitle(aiPreview.title); if (aiPreview?.desc) setDescription(aiPreview.desc); setAiPreview(null) }}>Einfügen</Button>
                <Button size="sm" variant="outline" className="px-2.5 py-1 text-xs" onClick={refineSuggestion} disabled={aiLoading}>Verfeinern</Button>
                <Button size="sm" variant="outline" className="px-2.5 py-1 text-xs" onClick={()=> setAiPreview(null)}>Verwerfen</Button>
              </div>
            </div>
          )}
        </div>

        {/* Meta row: type, priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Typ</Label>
            <GlassSelect value={activityType} onChange={setActivityType} options={[
              { value: 'event', label: 'Event' },
              { value: 'task', label: 'Aufgabe' },
              { value: 'meeting', label: 'Meeting' },
              { value: 'campaign', label: 'Kampagne' },
              { value: 'reminder', label: 'Erinnerung' },
            ]} />
            </div>
          <div className="grid gap-2">
            <Label>Priorität</Label>
            <GlassSelect value={priority} onChange={setPriority} options={[
              { value: 'low', label: 'Niedrig' },
              { value: 'medium', label: 'Mittel' },
              { value: 'high', label: 'Hoch' },
              { value: 'urgent', label: 'Dringend' },
            ]} />
        </div>
      </div>

        {/* Row: owner, project */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Verantwortlicher</Label>
            <GlassSelect value={ownerId || ''} onChange={(v) => setOwnerId(v || undefined)} placeholder="Nicht zugewiesen" options={[
              { value: '', label: 'Nicht zugewiesen' },
              ...users.map((u: any) => ({ value: String(u.id ?? u._id), label: u.name || u.full_name || u.email }))
            ]} />
                    </div>
          <div className="grid gap-2">
            <Label>Projekt</Label>
            <GlassSelect value={projectId || ''} onChange={(v) => setProjectId(v || undefined)} placeholder="Kein Projekt" options={[
              { value: '', label: 'Kein Projekt' },
              ...projects.map((p: any) => ({ value: String(p.id ?? p._id), label: p.name || p.title }))
            ]} />
                    </div>
                  </div>

        {/* Date + time row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="grid gap-2">
            <Label>Datum</Label>
            <Input type="date" value={when} onChange={(e) => setWhen(e.target.value)} className="focus:ring-2 focus:ring-blue-500/60 border-white/20 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60" />
                </div>
          <div className="grid gap-2">
            <Label>Start</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                      </div>
          <div className="grid gap-2">
            <Label>Ende</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                                </div>

        {/* Recurrence */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="grid gap-2">
            <Label>Wiederholung</Label>
            <GlassSelect value={recFreq} onChange={(v:any)=> setRecFreq(v)} options={[
              { value: 'none', label: 'Keine' },
              { value: 'daily', label: 'Täglich' },
              { value: 'weekly', label: 'Wöchentlich' },
              { value: 'monthly', label: 'Monatlich' },
            ]} />
          </div>
          <div className="grid gap-2">
            <Label>Intervall</Label>
            <Input type="number" min={1} value={recInterval} disabled={!recEnabled} onChange={(e)=> setRecInterval(Number(e.target.value || 1))} />
          </div>
          <div className="grid gap-2">
            <Label>Wiederholungen (optional)</Label>
            <Input type="number" min={0} value={recCount} disabled={!recEnabled} onChange={(e)=> setRecCount(Number(e.target.value || 0))} placeholder="0 = unbegrenzt/bis Datum" />
          </div>
          <div className="grid gap-2">
            <Label>Bis (optional)</Label>
            <Input type="date" value={recUntil} disabled={!recEnabled} onChange={(e)=> setRecUntil(e.target.value)} />
                  </div>
                                </div>

        {/* Color picker */}
        <div className="grid gap-2">
          <Label>Farbe</Label>
          <div className="flex flex-wrap gap-2">
            {['#3b82f6','#a78bfa','#10b981','#f59e0b','#ef4444','#06b6d4'].map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} className={`h-6 w-6 rounded-full border ${color===c?'ring-2 ring-white border-white':'border-slate-600'}`} style={{backgroundColor:c}} />
                              ))}
                            </div>
                          </div>
        {/* entfernt авто-вставку; теперь превью через кнопки Vorschlag/Regenerieren */}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={closeModal}>
            Abbrechen
          </Button>
          <Button className="flex-1 bg-gradient-to-r from-red-500 to-blue-500 text-white disabled:opacity-60" disabled={loading} onClick={async () => {
            await handleSubmit()
            // success toast modal
            const ok = document.createElement('div')
            ok.className = 'fixed inset-0 z-[100] flex items-center justify-center'
            ok.innerHTML = `
              <div class="backdrop-blur-sm bg-black/40 absolute inset-0"></div>
              <div class="relative z-10 rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 shadow-2xl px-6 py-5 flex items-center gap-3">
                <div class="h-8 w-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">✓</div>
                <div class="text-sm font-medium">Event wurde erstellt</div>
              </div>`
            document.body.appendChild(ok)
            setTimeout(() => { ok.remove(); closeModal() }, 1200)
          }}>
            Erstellen
          </Button>
        </div>
      </div>
    </div>
  )
}


function CalendarTemplates({ onCreate }: { onCreate: (payloads: any[]) => Promise<void> }) {
  const [start, setStart] = useState<string>(() => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1); return format(d, 'yyyy-MM-dd')
  })
  const [months, setMonths] = useState<number>(3)
  const [loading, setLoading] = useState(false)

  const nextDow = (from: Date, dow: number) => {
    const d = new Date(from)
    const add = (dow - d.getDay() + 7) % 7
    d.setDate(d.getDate() + add)
    return d
  }
  const addWeeks = (d: Date, w: number) => { const x = new Date(d); x.setDate(x.getDate() + 7 * w); return x }
  const addMonths = (d: Date, m: number) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x }

  const genQ1Demand = () => {
    const s = new Date(start + 'T09:00:00')
    const end = addMonths(s, months)
    const items: any[] = []
    // Weekly promo (Mon), Live webinar (Thu), Follow-up (Fri)
    const seeds = [
      { title: 'Webinar Promo Post', dow: 1, color: '#3b82f6' },
      { title: 'Webinar Live', dow: 4, color: '#a78bfa' },
      { title: 'Follow-up Email', dow: 5, color: '#10b981' },
    ]
    for (const seed of seeds) {
      const first = nextDow(s, seed.dow) // 0=Sun..6=Sat
      items.push({
        title: seed.title,
        type: 'event',
        start: format(first, 'yyyy-MM-dd') + 'T10:00:00',
        end: undefined,
        color: seed.color,
        category: 'event',
        recurrence: { freq: 'weekly' as const, interval: 1, until: format(end, 'yyyy-MM-dd') },
      })
    }
    return items
  }

  const genContent3M = () => {
    const s = new Date(start + 'T09:00:00')
    const end = addMonths(s, months)
    return [
      { title: 'Blog Post', type: 'event', start: format(nextDow(s, 2), 'yyyy-MM-dd') + 'T09:00:00', recurrence: { freq: 'weekly' as const, interval: 1, until: format(end, 'yyyy-MM-dd') }, color: '#f59e0b', category: 'event' },
      { title: 'Newsletter', type: 'event', start: format(nextDow(s, 3), 'yyyy-MM-dd') + 'T11:00:00', recurrence: { freq: 'weekly' as const, interval: 2, until: format(end, 'yyyy-MM-dd') }, color: '#06b6d4', category: 'event' },
      { title: 'SEO Update', type: 'task', start: format(s, 'yyyy-MM-dd') + 'T13:00:00', recurrence: { freq: 'monthly' as const, interval: 1, count: months }, color: '#ef4444', category: 'event' },
    ]
  }

  const genSmmPlan = () => {
    const s = new Date(start + 'T09:00:00')
    const end = addMonths(s, months)
    const posts = [
      { title: 'IG Carousel', dow: 1, color: '#ec4899' },
      { title: 'LinkedIn Post', dow: 3, color: '#6366f1' },
      { title: 'Reel/Shorts', dow: 5, color: '#22c55e' },
    ]
    return posts.map(p => ({
      title: p.title, type: 'event',
      start: format(nextDow(s, p.dow), 'yyyy-MM-dd') + 'T09:30:00',
      recurrence: { freq: 'weekly' as const, interval: 1, until: format(end, 'yyyy-MM-dd') },
      color: p.color, category: 'event'
    }))
  }

  const createTemplate = async (key: 'q1' | 'content' | 'smm') => {
    setLoading(true)
    try {
      const packs = key === 'q1' ? genQ1Demand() : key === 'content' ? genContent3M() : genSmmPlan()
      await onCreate(packs)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-white/15 bg-white/6">
          <div className="font-semibold text-white mb-1">Q1 Demand Gen</div>
          <div className="text-sm text-slate-300 mb-3">Еженедельные вебинары + промо/фоллоу‑ап</div>
          <Button disabled={loading} onClick={()=> createTemplate('q1')} className="w-full">Создать</Button>
        </div>
        <div className="p-4 rounded-xl border border-white/15 bg-white/6">
          <div className="font-semibold text-white mb-1">Контент 3‑месячный</div>
          <div className="text-sm text-slate-300 mb-3">Блог еженедельно, рассылка раз в 2 недели, SEO — раз в месяц</div>
          <Button disabled={loading} onClick={()=> createTemplate('content')} className="w-full">Создать</Button>
        </div>
        <div className="p-4 rounded-xl border border-white/15 bg-white/6">
          <div className="font-semibold text-white mb-1">SMM‑план</div>
          <div className="text-sm text-slate-300 mb-3">Mon/Wed/Fri публикации (IG/LI/Reels)</div>
          <Button disabled={loading} onClick={()=> createTemplate('smm')} className="w-full">Создать</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="grid gap-1">
          <Label>Старт</Label>
          <Input type="date" value={start} onChange={(e)=> setStart(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Длительность (мес.)</Label>
          <Input type="number" min={1} max={12} value={months} onChange={(e)=> setMonths(Number(e.target.value||3))} />
        </div>
      </div>
    </div>
  )
}





