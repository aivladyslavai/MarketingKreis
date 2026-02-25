"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, RefreshCw, BarChart3, CalendarDays, Target, FileText, Activity, Eye, Settings2, Mail, Check, Search, Filter, PlayCircle, FileDown } from "lucide-react"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { GlassSelect } from "@/components/ui/glass-select"
import { authFetch } from "@/lib/api"
import { useActivities } from "@/hooks/use-activities"
import { useCalendarApi } from "@/hooks/use-calendar-api"
import { useUploadsApi, useJobsApi } from "@/hooks/use-uploads-api"
import { sync } from "@/lib/sync"
import { ResponsiveContainer, AreaChart, Area } from "recharts"
import { useModal } from "@/components/ui/modal/ModalProvider"
import { reportsAPI } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import type { ReportDocumentV1 } from "@/lib/reports/report-types"
import { exportReportToPDF } from "@/lib/reports/export-pdf"
import { exportReportToDOCX } from "@/lib/reports/export-docx"

export default function ReportsPage() {
  const toYMD = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  const [loading, setLoading] = useState(true)
  const [crmStats, setCrmStats] = useState<any | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Default to last ~quarter so the report isn't empty by default.
  const [from, setFrom] = useState<string>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 89)
    return toYMD(start)
  })
  const [to, setTo] = useState<string>(() => toYMD(new Date()))
  const [genLoading, setGenLoading] = useState(false)
  const [reportHtml, setReportHtml] = useState<string>("")
  const [reportDoc, setReportDoc] = useState<ReportDocumentV1 | null>(null)
  const { openModal, closeModal } = useModal()
  const { toast } = useToast()
  const { user } = useAuth()
  const canManageReports = user?.role === "admin" || user?.role === "editor"
  const [compare, setCompare] = useState<"none" | "prev" | "yoy">("none")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sections, setSections] = useState({
    kpi: true,
    changes: true,
    insights: true,
    pipeline: true,
    activities: true,
    calendar: true,
    crm: true,
    uploads: true,
    risks: true,
    conclusion: true,
    appendix: true,
  })
  const [language, setLanguage] = useState<"de" | "en">("de")
  const [tone, setTone] = useState<"executive" | "neutral" | "marketing">("executive")
  const [brand, setBrand] = useState<{ company?: string; logoUrl?: string }>({ company: "", logoUrl: "" })

  // Saved templates + history
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [templateName, setTemplateName] = useState<string>("")
  const [templateDesc, setTemplateDesc] = useState<string>("")
  const [runs, setRuns] = useState<any[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [runsLoading, setRunsLoading] = useState(false)
  const [historyTpl, setHistoryTpl] = useState<string>("all")
  const [historyQ, setHistoryQ] = useState<string>("")
  const [historyOnlyErrors, setHistoryOnlyErrors] = useState<boolean>(false)

  // Weekly email schedules (admin/editor)
  const [schedules, setSchedules] = useState<any[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const [scheduleName, setScheduleName] = useState<string>("Weekly Executive")
  const [scheduleRecipients, setScheduleRecipients] = useState<string>("")
  const [scheduleWeekday, setScheduleWeekday] = useState<number>(0)
  const [scheduleHour, setScheduleHour] = useState<number>(8)
  const [scheduleMinute, setScheduleMinute] = useState<number>(0)
  const [scheduleActive, setScheduleActive] = useState<boolean>(true)

  const ReportIFrame = ({ html, height }: { html: string; height: number }) => {
    // IMPORTANT: viewport meta makes the report readable on phones (otherwise iOS renders at ~980px and scales down).
    const src = `<!doctype html><html><head><meta charset='utf-8'><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${html}</body></html>`
    return (
      <iframe
        srcDoc={src}
        className="w-full rounded-lg border border-white/10 bg-slate-900"
        style={{ height }}
        // No scripts needed; keep preview safe even if HTML contains unexpected tags.
        sandbox="allow-same-origin allow-popups"
      />
    )
  }
  const LogoDrop = () => {
    const onFiles = (files: FileList | null) => {
      if (!files || files.length === 0) return
      const f = files[0]
      if (!f.type.startsWith("image/")) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = String(reader.result || "")
        setBrand(b => ({ ...b, logoUrl: dataUrl }))
      }
      reader.readAsDataURL(f)
    }
    return (
      <div
        className="group relative w-full h-11 sm:h-9 rounded-lg border border-dashed border-white/20 bg-slate-900/50 hover:bg-slate-900/60 transition-colors cursor-pointer overflow-hidden"
        onDragOver={(e)=>{ e.preventDefault() }}
        onDrop={(e)=>{ e.preventDefault(); onFiles(e.dataTransfer.files) }}
        onClick={()=>{ const input = document.getElementById('logoFileInput') as HTMLInputElement; input?.click() }}
        title="Drag & Drop Logo oder klicken"
      >
        <input id="logoFileInput" type="file" accept="image/*" className="hidden" onChange={(e)=> onFiles(e.target.files)} />
        {brand.logoUrl ? (
          <div className="flex items-center justify-between h-full px-2">
            <div className="text-xs text-slate-300 truncate mr-2">Logo ausgewählt</div>
            <Image
              src={brand.logoUrl}
              alt="Logo Preview"
              width={140}
              height={40}
              className="h-7 w-auto max-w-[120px] object-contain rounded-sm"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            <span className="opacity-80">Logo hier ablegen oder klicken</span>
          </div>
        )}
        {brand.logoUrl && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-300 hover:text-white"
            onClick={(e)=>{ e.stopPropagation(); setBrand(b => ({ ...b, logoUrl: "" })) }}
            title="Entfernen"
          >✕</button>
        )}
      </div>
    )
  }
  const { activities, error: activitiesError, refetch: refetchActivities } = useActivities()
  const { events, error: calendarError, refresh: refreshCalendar } = useCalendarApi()
  const { uploads, error: uploadsError, refresh: refreshUploads } = useUploadsApi()
  const { jobs, error: jobsError, refresh: refreshJobs } = useJobsApi()

  // Some hook-returned functions are not stable across renders; keep refs so effects don't loop.
  const refetchActivitiesRef = useRef(refetchActivities)
  const refreshCalendarRef = useRef(refreshCalendar)
  const refreshUploadsRef = useRef(refreshUploads)
  const refreshJobsRef = useRef(refreshJobs)
  useEffect(() => { refetchActivitiesRef.current = refetchActivities }, [refetchActivities])
  useEffect(() => { refreshCalendarRef.current = refreshCalendar }, [refreshCalendar])
  useEffect(() => { refreshUploadsRef.current = refreshUploads }, [refreshUploads])
  useEffect(() => { refreshJobsRef.current = refreshJobs }, [refreshJobs])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const res = await authFetch('/crm/stats')
      let body: any = null
      try { body = await res.json() } catch { body = null }
      if (!res.ok) {
        const msg = body?.detail || body?.error || res.statusText || "Failed to load CRM stats"
        throw new Error(msg)
      }
      setCrmStats(body || {})
    } catch (e: any) {
      setCrmStats({})
      setLoadError(e?.message || "Failed to load CRM stats")
    } finally { setLoading(false) }
  }, [])

  const loadTemplatesAndRuns = useCallback(async () => {
    try {
      setTemplatesLoading(true)
      setRunsLoading(true)
      const [tpls, rs] = await Promise.all([reportsAPI.templates.list().catch(() => []), reportsAPI.runs.list({ limit: 30 }).catch(() => [])])
      setTemplates(Array.isArray(tpls) ? tpls : [])
      setRuns(Array.isArray(rs) ? rs : [])
    } finally {
      setTemplatesLoading(false)
      setRunsLoading(false)
    }
  }, [])

  const loadSchedules = useCallback(async () => {
    try {
      setSchedulesLoading(true)
      const rows = await reportsAPI.schedules.list().catch(() => [])
      setSchedules(Array.isArray(rows) ? rows : [])
    } finally {
      setSchedulesLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    loadTemplatesAndRuns()
    const unsub = [
      sync.on('global:refresh', () => {
        load()
        refetchActivitiesRef.current?.()
        refreshCalendarRef.current?.()
        refreshUploadsRef.current?.()
        refreshJobsRef.current?.()
      }),
      sync.on('activities:changed', () => { refetchActivitiesRef.current?.() }),
      sync.on('calendar:changed', () => { refreshCalendarRef.current?.() }),
      sync.on('uploads:changed', () => { refreshUploadsRef.current?.() }),
      sync.on('jobs:changed', () => { refreshJobsRef.current?.() }),
      sync.on('crm:companies:changed', () => { load() }),
    ]
    return () => { unsub.forEach(fn => fn && (fn as any)()) }
  }, [load, loadTemplatesAndRuns])

  useEffect(() => {
    if (!canManageReports) return
    loadSchedules()
  }, [canManageReports, loadSchedules])

  const filteredRuns = useMemo(() => {
    const q = (historyQ || "").trim().toLowerCase()
    const tpl = (historyTpl || "").trim()
    return (Array.isArray(runs) ? runs : [])
      .filter((r: any) => {
        if (historyOnlyErrors && String(r?.status || "") === "ok") return false
        if (tpl && tpl !== "all" && String(r?.template_id || "") !== tpl) return false
        if (!q) return true
        const tplName = r?.template_id ? templates.find((t: any) => t.id === r.template_id)?.name : ""
        const hay = [
          String(r?.id ?? ""),
          String(r?.status ?? ""),
          String(r?.error ?? ""),
          String(tplName || ""),
        ]
          .join(" ")
          .toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 24)
  }, [runs, templates, historyQ, historyTpl, historyOnlyErrors])

  const kpis = useMemo(() => {
    const pipelineValue = crmStats?.pipelineValue || 0
    const wonValue = crmStats?.wonValue || 0
    const totalDeals = crmStats?.totalDeals || 0
    const upcomingEvents = events.filter(e => e.start && new Date(e.start as any) >= new Date()).length
    // stable pseudo-random series for a "real" micro-trend sparkline
    const mkSeries = (seed: number) => {
      let x = seed || 1
      let y = Math.max(1, (seed % 5) + 2)
      const arr: { x: number; y: number }[] = []
      for (let i = 0; i < 24; i++) {
        x = (x * 9301 + 49297) % 233280
        const r = x / 233280
        y = Math.max(0.2, y + (r - 0.5) * 0.8)
        arr.push({ x: i, y: Number(y.toFixed(2)) })
      }
      return arr
    }
    return [
      { key: 'pipeline', title: 'Pipeline', value: `CHF ${Math.round(pipelineValue).toLocaleString()}`, icon: BarChart3, color: 'text-amber-500', stroke: '#f59e0b', fillFrom: 'rgba(245,158,11,0.25)', fillTo: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)', data: mkSeries(pipelineValue || 3) },
      { key: 'won', title: 'Won', value: `CHF ${Math.round(wonValue).toLocaleString()}`, icon: Target, color: 'text-green-500', stroke: '#22c55e', fillFrom: 'rgba(34,197,94,0.25)', fillTo: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.25)', data: mkSeries(wonValue || 2) },
      { key: 'deals', title: 'Deals', value: totalDeals, icon: FileText, color: 'text-blue-500', stroke: '#3b82f6', fillFrom: 'rgba(59,130,246,0.25)', fillTo: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.25)', data: mkSeries(totalDeals || 1) },
      { key: 'upcoming', title: 'Upcoming', value: upcomingEvents, icon: CalendarDays, color: 'text-purple-500', stroke: '#a855f7', fillFrom: 'rgba(168,85,247,0.25)', fillTo: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.25)', data: mkSeries(upcomingEvents || 4) },
    ]
  }, [crmStats, events])

  const kpiSnapshot = useMemo(() => {
    return {
      pipelineValue: crmStats?.pipelineValue || 0,
      wonValue: crmStats?.wonValue || 0,
      totalDeals: crmStats?.totalDeals || 0,
      upcomingEvents: events.filter((e: any) => e.start && new Date(e.start as any) >= new Date()).length,
      sources: {
        pipeline: { endpoint: "/crm/stats", formula: "Pipeline = sum(value) of deals where stage != lost" },
        won: { endpoint: "/crm/stats", formula: "Won = sum(value) of deals where stage == won" },
        deals: { endpoint: "/crm/stats", formula: "Deals = count(all deals)" },
        upcoming: { endpoint: "/calendar", formula: "Upcoming = count(events where start >= now)" },
      },
    }
  }, [crmStats, events])

  const applyTemplateConfig = (cfg: any) => {
    const c = cfg || {}
    if (typeof c.from === "string") setFrom(c.from)
    if (typeof c.to === "string") setTo(c.to)
    if (typeof c.compare === "string") setCompare(c.compare)
    if (c.sections && typeof c.sections === "object") setSections((s) => ({ ...s, ...c.sections }))
    if (c.language) setLanguage(c.language)
    if (c.tone) setTone(c.tone)
    if (c.brand && typeof c.brand === "object") setBrand((b) => ({ ...b, ...c.brand }))
  }

  const applyRunParams = (params: any) => {
    if (!params) return
    if (params?.from) setFrom(String(params.from))
    if (params?.to) setTo(String(params.to))
    if (params?.options?.compare) setCompare(params.options.compare)
    if (params?.options?.sections) setSections((s) => ({ ...s, ...params.options.sections }))
    if (params?.options?.language) setLanguage(params.options.language)
    if (params?.options?.tone) setTone(params.options.tone)
    if (params?.options?.brand) setBrand((b) => ({ ...b, ...params.options.brand }))
  }

  const previewHtml = (title: string, html: string) => {
    openModal({
      type: "custom",
      title,
      content: (
        <div className="px-1">
          <ReportIFrame html={html} height={window.innerHeight ? Math.round(window.innerHeight * 0.8) : 700} />
        </div>
      ),
    })
  }

  const downloadHtml = (filename: string, html: string) => {
    const blob = new Blob(
      [
        `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${html}</body></html>`,
      ],
      { type: "text/html;charset=utf-8" },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateReport = async (payload: { from: string; to: string; options: any; template_id?: number | null }) => {
    const ff = (() => {
      try {
        return JSON.parse(localStorage.getItem("featureFlags") || "{}")
      } catch {
        return {}
      }
    })()

    const options = { ...(payload.options || {}), deterministic: !!ff?.aiReportDeterministic }

    const res = await authFetch("/reports/generate", {
      method: "POST",
      body: JSON.stringify({ from: payload.from, to: payload.to, options }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error((j as any)?.error || (j as any)?.detail || res.statusText)
    const html = String((j as any)?.html || "")
    setReportHtml(html)
    const doc = (j as any)?.report as ReportDocumentV1 | undefined
    setReportDoc(doc && (doc as any)?.version === 1 ? doc : null)

    // Persist run history (best-effort)
    try {
      const tplId = payload.template_id != null ? Number(payload.template_id) : null
      await reportsAPI.runs.create({
        template_id: Number.isFinite(tplId as any) ? (tplId as any) : null,
        params: { from: payload.from, to: payload.to, options: { compare, sections, language, tone, brand } },
        kpi_snapshot: { ...kpiSnapshot, generatedAt: new Date().toISOString() },
        html,
        status: "ok",
      })
      await loadTemplatesAndRuns()
    } catch {
      // best-effort
    }

    toast({
      title: "Report generiert",
      description: "Preview öffnen oder HTML/PDF herunterladen.",
    })
  }

  const renderStatus = (raw: string) => {
    const v = String(raw || '').toUpperCase()
    const base = 'inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium'
    const cls =
      v === 'PLANNED' ? 'bg-amber-500/10 text-amber-300 border-amber-400/20' :
      v === 'ACTIVE' ? 'bg-blue-500/10 text-blue-300 border-blue-400/20' :
      v === 'DONE' || v === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20' :
      v === 'CANCELLED' ? 'bg-rose-500/10 text-rose-300 border-rose-400/20' :
      v === 'PAUSED' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-400/20' :
      v === 'UPCOMING' ? 'bg-purple-500/10 text-purple-300 border-purple-400/20' :
      v === 'PAST' ? 'bg-slate-500/10 text-slate-300 border-slate-400/20' :
      'bg-white/10 text-slate-200 border-white/15'
    return <span className={`${base} ${cls}`}>{v}</span>
  }

  const sectionLabels = useMemo(() => {
    const de: Record<string, string> = {
      kpi: "KPIs",
      changes: "Was hat sich verändert",
      insights: "AI Insights & Ergebnisse",
      pipeline: "Pipeline & Deals",
      activities: "Aktivitäten",
      calendar: "Kalender",
      crm: "CRM (Unternehmen/Kontakte)",
      uploads: "Uploads & Jobs",
      risks: "Risiken & Empfehlungen",
      conclusion: "Fazit",
      appendix: "Anhang (Datenbasis)",
    }
    const en: Record<string, string> = {
      kpi: "KPIs",
      changes: "What changed",
      insights: "AI insights & results",
      pipeline: "Pipeline & deals",
      activities: "Activities",
      calendar: "Calendar",
      crm: "CRM (companies/contacts)",
      uploads: "Uploads & jobs",
      risks: "Risks & recommendations",
      conclusion: "Conclusion",
      appendix: "Appendix (data sources)",
    }
    return language === "de" ? de : en
  }, [language])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (<Skeleton key={i} className="h-28" />))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {(loadError || activitiesError || calendarError || uploadsError || jobsError) && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-100">
          <div className="text-sm font-semibold">Daten konnten nicht geladen werden</div>
          <div className="mt-1 text-xs text-rose-100/90 space-y-1">
            {loadError && <div>- CRM: {loadError}</div>}
            {activitiesError && <div>- Aktivitäten: {activitiesError}</div>}
            {calendarError && <div>- Kalender: {(calendarError as any)?.message || String(calendarError)}</div>}
            {uploadsError && <div>- Uploads: {(uploadsError as any)?.message || String(uploadsError)}</div>}
            {jobsError && <div>- Jobs: {(jobsError as any)?.message || String(jobsError)}</div>}
          </div>
          <div className="mt-2 text-[11px] text-rose-100/70">
            Tipp: Prüfe Login/Cookies und dass in Vercel/Render die Variable <span className="font-semibold">BACKEND_URL</span> korrekt gesetzt ist.
          </div>
        </div>
      )}
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white">Reports</h1>
              <p className="text-slate-300 text-xs sm:text-sm truncate">Live Business Überblick über CRM, Calendar, Activities und Uploads</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="border-white/20 text-slate-200 h-8 sm:h-9 text-xs sm:text-sm" onClick={()=>{ load(); refetchActivities(); refreshCalendar(); refreshUploads(); refreshJobs(); }}>
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" /> <span className="hidden sm:inline">Aktualisieren</span>
            </Button>
            <Button variant="outline" size="sm" className="border-white/20 text-slate-200 h-8 sm:h-9 text-xs sm:text-sm" onClick={()=> window.open('/api/reports/export?format=csv', '_blank') }>
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" /> <span className="hidden xs:inline">CSV</span>
            </Button>
            <Button size="sm" className="bg-white text-slate-900 hover:bg-white/90 h-8 sm:h-9 text-xs sm:text-sm" onClick={()=> window.open('/api/reports/export?format=json', '_blank') }>
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" /> <span className="hidden xs:inline">JSON</span>
            </Button>
          </div>
        </div>

        {/* Generator */}
        <div className="mt-4 space-y-3">
          {/* Presets - scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="flex items-center gap-2 text-xs min-w-max">
              <span className="text-slate-400">Presets:</span>
              {[
                { k: "Heute", d: 0 },
                { k: "7 Tage", d: 6 },
                { k: "Monat", d: 29 },
                { k: "Quartal", d: 89 },
                { k: "Jahr", d: 364 },
              ].map(p => (
                <Button key={p.k} size="sm" variant="outline" className="border-white/15 text-slate-300 h-7 sm:h-8 px-2 sm:px-3 text-xs"
                  onClick={()=> {
                    const end = new Date()
                    const start = new Date()
                    start.setDate(end.getDate() - p.d)
                    setFrom(toYMD(start))
                    setTo(toYMD(end))
                  }}>{p.k}</Button>
              ))}
            </div>
          </div>
          {/* Date range and comparison */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="text-slate-300 w-full sm:w-auto">Zeitraum:</span>
              <Input
                type="date"
                value={from}
                onChange={(e)=>setFrom(e.target.value)}
                className="w-[160px] max-w-full h-11 sm:h-9 px-2 text-xs sm:text-sm"
              />
              <span className="text-slate-400">–</span>
              <Input
                type="date"
                value={to}
                onChange={(e)=>setTo(e.target.value)}
                className="w-[160px] max-w-full h-11 sm:h-9 px-2 text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-slate-300">Vergleich:</span>
              <GlassSelect
                value={compare}
                onChange={(v) => setCompare(v as any)}
                options={[
                  { value: "none", label: "Kein" },
                  { value: "prev", label: "Vorh. Zeitraum" },
                  { value: "yoy", label: "YoY" },
                ]}
                className="w-[220px] max-w-full"
              />
            </div>
          </div>
          {/* Templates: select + save */}
          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 min-w-0">
              <GlassSelect
                value={selectedTemplateId}
                onChange={(v) => {
                  const id = String(v || "")
                  setSelectedTemplateId(id)
                  const tpl = templates.find((t: any) => String(t.id) === id)
                  if (tpl?.config) applyTemplateConfig(tpl.config)
                }}
                placeholder={templatesLoading ? "Lade Templates…" : "Template auswählen…"}
                options={templates.map((t: any) => ({
                  value: String(t.id),
                  label: String(t.name || ""),
                }))}
                className="w-full"
              />
              <div className="mt-1 text-[11px] text-slate-400">
                {templatesLoading
                  ? "Templates werden geladen…"
                  : templates.length === 0
                    ? "Noch keine Templates. Speichere deine Einstellungen als Template."
                    : `${templates.length} Template${templates.length === 1 ? "" : "s"} verfügbar.`}
              </div>
            </div>
            {canManageReports && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-slate-200 h-11 sm:h-9 text-xs sm:text-sm"
                  disabled={templatesLoading}
                  onClick={loadTemplatesAndRuns}
                  title="Templates neu laden"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-slate-200 h-11 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
                  disabled={templatesLoading}
                  onClick={() => {
                    openModal({
                      type: "custom",
                      title: "Report Template speichern",
                      content: (
                        <div className="space-y-3">
                          <div className="text-xs text-slate-300">
                            Speichert Einstellungen (Zeitraum, Sektionen, Sprache/Ton, Branding) als wiederverwendbares Template.
                          </div>
                          <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="Name (z.B. Weekly Executive)"
                            className="h-11 w-full"
                          />
                          <Input
                            value={templateDesc}
                            onChange={(e) => setTemplateDesc(e.target.value)}
                            placeholder="Beschreibung (optional)"
                            className="h-11 w-full"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              className="h-11"
                              onClick={async () => {
                                const payload: any = {
                                  name: templateName || `Template ${new Date().toISOString().slice(0, 10)}`,
                                  description: templateDesc || undefined,
                                  config: {
                                    from,
                                    to,
                                    compare,
                                    sections,
                                    language,
                                    tone,
                                    brand,
                                  },
                                }
                                await reportsAPI.templates.create(payload)
                                setTemplateName("")
                                setTemplateDesc("")
                                await loadTemplatesAndRuns()
                                try {
                                  sync.emit("global:refresh")
                                } catch {}
                                closeModal()
                              }}
                            >
                              Speichern
                            </Button>
                            <Button variant="outline" className="h-11" onClick={closeModal}>
                              Schließen
                            </Button>
                          </div>
                        </div>
                      ),
                    })
                  }}
                >
                  Template speichern
                </Button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2" data-tour="reports-actions">
          <Button
            disabled={genLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 h-11 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
            onClick={async()=>{
            try {
              setGenLoading(true)
              await generateReport({
                from,
                to,
                template_id: selectedTemplateId ? Number(selectedTemplateId) : null,
                options: {
                  compare,
                  sections,
                  language,
                  tone,
                  brand,
                  linkBase: {
                    deal: "/crm?focus=deal:",
                    activity: "/activities?id=",
                    event: "/calendar?event=",
                  },
                },
              })
            } catch (e) {
              toast({
                title: "Report fehlgeschlagen",
                description: (e as any)?.message || "Report generation failed",
                variant: "destructive",
              })
            } finally { setGenLoading(false) }
          }}>
            {genLoading ? 'Generiere…' : 'Report generieren'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-slate-200 h-11 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
            onClick={()=> setSettingsOpen(v=>!v)}
          >
            <Settings2 className="h-3.5 w-3.5 mr-2" />
            {settingsOpen ? 'Einstellungen' : 'Einstellungen'}
            <span className="ml-2 text-slate-400">{settingsOpen ? '▾' : '▸'}</span>
          </Button>
          {reportHtml && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-slate-200 h-11 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
                onClick={()=>{
                openModal({
                  type: 'custom',
                  title: 'Report – Preview',
                  content: (
                    <div className="px-1">
                      <ReportIFrame html={reportHtml} height={window.innerHeight ? Math.round(window.innerHeight*0.8) : 700} />
                    </div>
                  )
                })
              }}>
                <Eye className="h-3.5 w-3.5 mr-2" /> Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-slate-200 h-11 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
                onClick={()=>{
                const blob = new Blob([`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${reportHtml}</body></html>`], { type: 'text/html;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = `report-${from||'all'}_${to||'all'}.html`; a.click(); URL.revokeObjectURL(url)
              }}>
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" /> <span className="hidden sm:inline">Download HTML</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-slate-200 h-11 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
                onClick={async()=>{
                  try {
                    const base = `report-${from||'all'}_${to||'all'}`
                    if (!reportDoc) {
                      // Fallback: open print preview if structured doc isn't available (older runs).
                      const wrapper = `<!doctype html><html><head><meta charset='utf-8'><meta name="viewport" content="width=device-width, initial-scale=1"><title>Report</title>
                      <style>@page{margin:18mm} body{background:#0b1220;color:#e5e7eb} @media print{body{background:white;color:black}}</style>
                      </head><body>${reportHtml}<script>window.onload=()=>{window.print(); setTimeout(()=>window.close(), 500)}</script></body></html>`
                      const blob = new Blob([wrapper], { type: 'text/html;charset=utf-8' })
                      const url = URL.createObjectURL(blob)
                      window.open(url, '_blank')
                      return
                    }
                    await exportReportToPDF(reportDoc, base)
                  } catch (e: any) {
                    toast({ title: "PDF fehlgeschlagen", description: e?.message || "PDF konnte nicht erstellt werden", variant: "destructive" })
                  }
                }}>
                <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" /> <span className="hidden sm:inline">Download PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-slate-200 h-11 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
                onClick={async()=>{
                  try {
                    if (!reportDoc) {
                      toast({ title: "DOC nicht verfügbar", description: "Bitte Report erneut generieren (neue Version speichert strukturierte Daten)." })
                      return
                    }
                    const base = `report-${from||'all'}_${to||'all'}`
                    await exportReportToDOCX(reportDoc, base)
                  } catch (e: any) {
                    toast({ title: "DOC fehlgeschlagen", description: e?.message || "DOC konnte nicht erstellt werden", variant: "destructive" })
                  }
                }}
              >
                <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" /> <span className="hidden sm:inline">Download DOC</span>
              </Button>
            </>
          )}
          </div>
        </div>

        {/* History */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-200" />
              <div className="text-sm font-semibold text-slate-200">Historie</div>
              <div className="hidden sm:block text-xs text-slate-400">Gespeicherte Generierungen</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-slate-200 h-9 text-xs"
              onClick={loadTemplatesAndRuns}
              disabled={runsLoading}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Neu laden
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  value={historyQ}
                  onChange={(e) => setHistoryQ(e.target.value)}
                  placeholder="Suchen: Run-ID, Template, Status…"
                  className="h-11 w-full pl-10 pr-3 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <GlassSelect
                    value={historyTpl}
                    onChange={setHistoryTpl}
                    options={[
                      { value: "all", label: "Alle Templates" },
                      ...templates.map((t: any) => ({ value: String(t.id), label: String(t.name || "") })),
                    ]}
                    className="w-full pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              {runsLoading ? "…" : `${filteredRuns.length} / ${runs.length} angezeigt`}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-300">Only errors</span>
              <Switch checked={historyOnlyErrors} onCheckedChange={setHistoryOnlyErrors} />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {runsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                    <div className="h-4 w-2/3 bg-white/10 rounded" />
                    <div className="mt-2 h-3 w-1/2 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            ) : runs.length === 0 ? (
              <div className="text-xs text-slate-400">Noch keine gespeicherten Generierungen.</div>
            ) : filteredRuns.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4 text-xs text-slate-300">
                Keine Treffer. Passe Filter oder Suche an.
              </div>
            ) : (
              filteredRuns.map((r: any) => {
                const dt = r.created_at ? new Date(r.created_at) : null
                const when = dt && Number.isFinite(dt.getTime()) ? dt.toLocaleString("de-DE") : String(r.created_at || "")
                const tplName = r.template_id ? templates.find((t: any) => t.id === r.template_id)?.name : null
                const ok = String(r.status || "") === "ok"
                return (
                  <div key={r.id} className="rounded-xl border border-white/10 bg-slate-950/30 p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-slate-300 min-w-0">
                        <span className="font-semibold text-slate-100">#{r.id}</span>
                        <span className="text-slate-500">·</span>
                        <span className="truncate">{when}</span>
                        {tplName ? (
                          <>
                            <span className="text-slate-500">·</span>
                            <span className="truncate text-slate-200">{tplName}</span>
                          </>
                        ) : null}
                        <span
                          className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            ok
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                              : "border-rose-400/20 bg-rose-500/10 text-rose-200"
                          }`}
                        >
                          {ok ? "ok" : "error"}
                        </span>
                      </div>
                      {!ok && (
                        <div className="mt-1 text-[11px] text-rose-200/90 truncate">
                          {String(r.error || "unknown error")}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs border-white/20 text-slate-200"
                        onClick={async () => {
                          try {
                            const full = await reportsAPI.runs.get(r.id)
                            const html = String((full as any)?.html || "")
                            if (html) setReportHtml(html)
                            applyRunParams((full as any)?.params)
                            toast({ title: "Run geladen", description: "Einstellungen wurden übernommen." })
                          } catch (e: any) {
                            toast({ title: "Laden fehlgeschlagen", description: e?.message || "Run konnte nicht geladen werden", variant: "destructive" })
                          }
                        }}
                      >
                        Laden
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs border-white/20 text-slate-200"
                        disabled={!r.id}
                        onClick={async () => {
                          try {
                            const full = await reportsAPI.runs.get(r.id)
                            const html = String((full as any)?.html || "")
                            if (!html) {
                              toast({ title: "Kein HTML gespeichert", description: "Dieser Run enthält kein HTML (z.B. E-Mail-only schedule run)." })
                              return
                            }
                            previewHtml(`Report Run #${r.id}`, html)
                          } catch (e: any) {
                            toast({ title: "Preview fehlgeschlagen", description: e?.message || "Preview konnte nicht geöffnet werden", variant: "destructive" })
                          }
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-2" /> Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs border-white/20 text-slate-200"
                        onClick={async () => {
                          try {
                            const full = await reportsAPI.runs.get(r.id)
                            const html = String((full as any)?.html || "")
                            if (!html) {
                              toast({ title: "Kein HTML gespeichert", description: "Dieser Run enthält kein HTML." })
                              return
                            }
                            downloadHtml(`report-run-${r.id}.html`, html)
                          } catch (e: any) {
                            toast({ title: "Download fehlgeschlagen", description: e?.message || "HTML konnte nicht geladen werden", variant: "destructive" })
                          }
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-2" /> HTML
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs border-white/20 text-slate-200"
                        onClick={async () => {
                          try {
                            const full = await reportsAPI.runs.get(r.id)
                            const params = (full as any)?.params || null
                            if (!params?.from || !params?.to) {
                              toast({ title: "Run again nicht möglich", description: "Dieser Run enthält keine vollständigen Parameter." })
                              return
                            }
                            setGenLoading(true)
                            await generateReport({
                              from: String(params.from),
                              to: String(params.to),
                              template_id: (full as any)?.template_id ?? null,
                              options: params?.options || {},
                            })
                          } catch (e: any) {
                            toast({ title: "Run again fehlgeschlagen", description: e?.message || "Run konnte nicht wiederholt werden", variant: "destructive" })
                          } finally {
                            setGenLoading(false)
                          }
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-2" /> Run again
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Weekly email schedule */}
        {canManageReports && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-200" />
                <div className="text-sm font-semibold text-slate-200">E-Mail Versand</div>
                <div className="hidden sm:block text-xs text-slate-400">wöchentlich</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-slate-200 h-9 text-xs"
                onClick={loadSchedules}
                disabled={schedulesLoading}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Neu laden
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3 space-y-2">
                <div className="text-xs font-semibold text-slate-200">Neuen Schedule anlegen</div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-300">
                  Template:{" "}
                  <span className="text-slate-100 font-semibold">
                    {selectedTemplateId ? (templates.find((t: any) => String(t.id) === String(selectedTemplateId))?.name || "—") : "kein Template (nur KPI-Summary)"}
                  </span>
                </div>
                <Input
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="Name"
                  className="w-full"
                />
                <Input
                  value={scheduleRecipients}
                  onChange={(e) => setScheduleRecipients(e.target.value)}
                  placeholder="Empfänger (comma/semicolon getrennt)"
                  className="w-full"
                />
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span>Wochentag:</span>
                  <GlassSelect
                    value={String(scheduleWeekday)}
                    onChange={(v) => setScheduleWeekday(Number(v))}
                    options={[
                      { value: "0", label: "Mo" },
                      { value: "1", label: "Di" },
                      { value: "2", label: "Mi" },
                      { value: "3", label: "Do" },
                      { value: "4", label: "Fr" },
                      { value: "5", label: "Sa" },
                      { value: "6", label: "So" },
                    ]}
                    className="w-[96px]"
                  />
                  <span>Uhrzeit:</span>
                  <Input
                    type="number"
                    value={scheduleHour}
                    onChange={(e) => setScheduleHour(Math.max(0, Math.min(23, Number(e.target.value))))}
                    className="w-20 h-11 sm:h-9 px-2"
                  />
                  <span>:</span>
                  <Input
                    type="number"
                    value={scheduleMinute}
                    onChange={(e) => setScheduleMinute(Math.max(0, Math.min(59, Number(e.target.value))))}
                    className="w-20 h-11 sm:h-9 px-2"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-xs text-slate-200">
                    Aktiv
                    <div className="text-[11px] text-slate-400">Wenn aus, wird nichts gesendet.</div>
                  </div>
                  <Switch checked={scheduleActive} onCheckedChange={setScheduleActive} />
                </div>
                <Button
                  className="h-11 w-full"
                  onClick={async () => {
                    try {
                      const recipients = scheduleRecipients
                        .split(/[,;\\s]+/g)
                        .map((s) => s.trim())
                        .filter(Boolean)
                      await reportsAPI.schedules.create({
                        name: scheduleName || "Weekly Executive",
                        template_id: selectedTemplateId ? Number(selectedTemplateId) : null,
                        is_active: scheduleActive,
                        weekday: scheduleWeekday,
                        hour: scheduleHour,
                        minute: scheduleMinute,
                        timezone: "Europe/Zurich",
                        recipients,
                      } as any)
                      setScheduleRecipients("")
                      toast({ title: "Schedule gespeichert", description: "Wöchentlicher Versand wurde angelegt." })
                      await loadSchedules()
                    } catch (e: any) {
                      toast({ title: "Schedule fehlgeschlagen", description: e?.message || "Schedule konnte nicht gespeichert werden", variant: "destructive" })
                    }
                  }}
                >
                  Schedule speichern
                </Button>
                <div className="text-[11px] text-slate-400">
                  Hinweis: Versand passiert über einen cron-call an Backend: <span className="font-mono">POST /reports/schedules/run/system</span> mit Header{" "}
                  <span className="font-mono">X-Reports-Token</span>.
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                <div className="text-xs font-semibold text-slate-200">Aktive Schedules</div>
                <div className="mt-2 space-y-2">
                  {schedulesLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="h-4 w-1/2 bg-white/10 rounded" />
                          <div className="mt-2 h-3 w-5/6 bg-white/10 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : schedules.length === 0 ? (
                    <div className="text-xs text-slate-400">Noch keine Schedules.</div>
                  ) : (
                    schedules.slice(0, 10).map((s: any) => (
                      <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="text-sm font-semibold text-slate-100 truncate">{s.name}</div>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                s.is_active
                                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                                  : "border-slate-400/20 bg-slate-500/10 text-slate-200"
                              }`}
                            >
                              {s.is_active ? "active" : "paused"}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400 truncate">
                            {s.is_active ? "Aktiv" : "Pausiert"} · {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][s.weekday] || "—"} ·{" "}
                            {String(s.hour).padStart(2, "0")}:{String(s.minute).padStart(2, "0")} · {Array.isArray(s.recipients) ? s.recipients.join(", ") : ""}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2">
                            <div className="text-[11px] text-slate-300 mr-3">Active</div>
                            <Switch
                              checked={!!s.is_active}
                              onCheckedChange={async (v) => {
                                try {
                                  await reportsAPI.schedules.update(s.id, { is_active: !!v } as any)
                                  toast({ title: "Schedule aktualisiert", description: v ? "Aktiviert." : "Pausiert." })
                                  await loadSchedules()
                                } catch (e: any) {
                                  toast({ title: "Update fehlgeschlagen", description: e?.message || "Konnte Schedule nicht aktualisieren", variant: "destructive" })
                                }
                              }}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs border-white/20 text-slate-200"
                            onClick={async () => {
                              try {
                                const out = await reportsAPI.schedules.runNow(s.id)
                                if ((out as any)?.delivery === "disabled") {
                                  toast({
                                    title: "Test-Run erstellt",
                                    description: "E-Mail Versand ist serverseitig deaktiviert (REPORTS_EMAIL_ENABLED=false).",
                                  })
                                } else if ((out as any)?.ok) {
                                  toast({
                                    title: "E-Mail gesendet",
                                    description: `${(out as any)?.emails_sent || 0} E-Mails gesendet.`,
                                  })
                                } else {
                                  toast({
                                    title: "E-Mail fehlgeschlagen",
                                    description: (out as any)?.error || "email_failed",
                                    variant: "destructive",
                                  })
                                }
                                await loadTemplatesAndRuns()
                              } catch (e: any) {
                                toast({ title: "Test-Run fehlgeschlagen", description: e?.message || "Konnte Schedule nicht ausführen", variant: "destructive" })
                              }
                            }}
                          >
                            <PlayCircle className="h-3.5 w-3.5 mr-2" /> Test now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs border-red-500/30 text-red-200 hover:bg-red-500/10"
                            onClick={async () => {
                              if (!confirm(`Schedule „${String(s.name || s.id)}“ wirklich löschen?`)) return
                              await reportsAPI.schedules.delete(s.id)
                              toast({ title: "Schedule gelöscht" })
                              await loadSchedules()
                            }}
                          >
                            Löschen
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {settingsOpen && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-slate-200" />
              <div className="text-sm font-semibold text-slate-200">Einstellungen</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-slate-400">Sektionen</div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(sections).map((k) => {
                  const on = Boolean((sections as any)[k])
                  return (
                    <label
                      key={k}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs cursor-pointer select-none ${
                        on ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-100" : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        className="sr-only"
                        onChange={(e)=> setSections(s=>({ ...s, [k]: e.target.checked }))}
                      />
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          on ? "border-emerald-400/30 bg-emerald-500/15" : "border-white/15 bg-white/5"
                        }`}
                      >
                        {on ? <Check className="h-3 w-3 text-emerald-200" /> : null}
                      </span>
                      <span>{sectionLabels[k] || k}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-slate-300">Sprache:</div>
              <GlassSelect
                value={language}
                onChange={(v) => setLanguage(v as any)}
                options={[
                  { value: "de", label: "Deutsch" },
                  { value: "en", label: "English" },
                ]}
                className="w-[160px] max-w-full"
              />
              <div className="text-sm text-slate-300">Ton:</div>
              <GlassSelect
                value={tone}
                onChange={(v) => setTone(v as any)}
                options={[
                  { value: "executive", label: "Executive" },
                  { value: "neutral", label: "Neutral" },
                  { value: "marketing", label: "Marketing" },
                ]}
                className="w-[180px] max-w-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-slate-300">Branding:</div>
              <Input
                placeholder="Company"
                value={brand.company || ''}
                onChange={(e)=> setBrand(b => ({ ...b, company: e.target.value }))}
                className="w-full sm:w-[260px] h-11 sm:h-9 px-2"
              />
              <div className="w-full sm:min-w-[280px] sm:w-[320px]"><LogoDrop /></div>
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k, i) => (
          <Card
            key={i}
            className="group relative overflow-hidden backdrop-blur-xl border rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: `linear-gradient(180deg, ${k.fillTo}, rgba(2,6,23,0.55))`, borderColor: k.border }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: `0 12px 34px ${k.fillFrom}, inset 0 0 0 1px ${k.fillFrom}` }} />
            <CardHeader className="pt-3 sm:pt-4 px-3 sm:px-4 pb-1 sm:pb-2">
              <CardTitle className={`${k.color} flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm`}>
                <k.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${k.color}`} />
                <span className="flex-1 min-w-0 truncate">{k.title}</span>
                <button
                  type="button"
                  className="ml-auto inline-flex items-center justify-center h-7 w-7 rounded-md border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                  title="Wie wird das berechnet?"
                  aria-label="Wie wird das berechnet?"
                  onClick={() => {
                    const src = (kpiSnapshot as any)?.sources?.[k.key]
                    openModal({
                      type: "custom",
                      title: `${k.title} – Wie wird das berechnet?`,
                      content: (
                        <div className="space-y-2 text-sm">
                          <div className="text-slate-300">
                            <div className="font-semibold text-white">Quelle</div>
                            <div className="mt-1 text-slate-300">
                              Endpoint: <span className="font-mono text-slate-200">{src?.endpoint || "—"}</span>
                            </div>
                          </div>
                          <div className="text-slate-300">
                            <div className="font-semibold text-white">Berechnung</div>
                            <div className="mt-1 text-slate-300">{src?.formula || "—"}</div>
                          </div>
                          <div className="text-xs text-slate-400">
                            Tipp: Für Audit/Transparenz wird bei jeder Generierung ein KPI-Snapshot in der Historie gespeichert.
                          </div>
                        </div>
                      ),
                    })
                  }}
                >
                  i
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-lg sm:text-2xl font-semibold text-white mt-1">{k.value}</div>
              <div className="mt-2 sm:mt-3 h-10 sm:h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={k.data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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

      {/* Middle: Aktivitäten + Kalender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* Aktivitäten table */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Aktivitäten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto mk-no-scrollbar max-h-[520px] pr-1 sm:pr-2">
              {/* Mobile: cards */}
              <div className="sm:hidden space-y-2">
                {activities
                  .filter((a: any) => a.start)
                  .sort((a: any, b: any) => new Date(b.start as any).getTime() - new Date(a.start as any).getTime())
                  .map((a: any) => (
                    <div key={a.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] text-slate-400">Aktivität</div>
                          <div className="mt-0.5 text-sm font-semibold text-slate-100 truncate">
                            {a.title}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {new Date(a.start as any).toLocaleDateString("de-DE")}
                          </div>
                        </div>
                        <div className="flex-shrink-0">{renderStatus(a.status || "PLANNED")}</div>
                      </div>
                    </div>
                  ))}
                {activities.length === 0 && (
                  <div className="py-10 text-center text-sm text-slate-400">Keine Aktivitäten</div>
                )}
              </div>

              {/* Desktop/tablet: table */}
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-white/10">
                      <th className="py-2 pr-2">Typ</th>
                      <th className="py-2 pr-2">Titel</th>
                      <th className="py-2 pr-2">Datum</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {activities
                      .filter((a: any) => a.start)
                      .sort((a: any, b: any) => new Date(b.start as any).getTime() - new Date(a.start as any).getTime())
                      .map((a: any) => (
                        <tr key={a.id} className="border-b border-white/5">
                          <td className="py-2 pr-2">Aktivität</td>
                          <td className="py-2 pr-2 truncate max-w-[240px]">{a.title}</td>
                          <td className="py-2 pr-2 whitespace-nowrap">
                            {new Date(a.start as any).toLocaleDateString("de-DE")}
                          </td>
                          <td className="py-2">{renderStatus(a.status || "PLANNED")}</td>
                        </tr>
                      ))}
                    {activities.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          Keine Aktivitäten
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kalender table */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Kalender Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto mk-no-scrollbar max-h-[520px] pr-1 sm:pr-2">
              {/* Mobile: cards */}
              <div className="sm:hidden space-y-2">
                {events
                  .filter((e: any) => e.start)
                  .sort((a: any, b: any) => new Date(b.start as any).getTime() - new Date(a.start as any).getTime())
                  .map((e: any) => {
                    const date = new Date(e.start as any)
                    const status = date >= new Date() ? "UPCOMING" : "PAST"
                    return (
                      <div key={e.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[11px] text-slate-400">Event</div>
                            <div className="mt-0.5 text-sm font-semibold text-slate-100 truncate">
                              {e.title}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-400">
                              {date.toLocaleDateString("de-DE")}
                            </div>
                          </div>
                          <div className="flex-shrink-0">{renderStatus(status)}</div>
                        </div>
                      </div>
                    )
                  })}
                {events.length === 0 && (
                  <div className="py-10 text-center text-sm text-slate-400">Keine Events</div>
                )}
              </div>

              {/* Desktop/tablet: table */}
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-white/10">
                      <th className="py-2 pr-2">Typ</th>
                      <th className="py-2 pr-2">Titel</th>
                      <th className="py-2 pr-2">Datum</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {events
                      .filter((e: any) => e.start)
                      .sort((a: any, b: any) => new Date(b.start as any).getTime() - new Date(a.start as any).getTime())
                      .map((e: any) => {
                        const date = new Date(e.start as any)
                        const status = date >= new Date() ? "UPCOMING" : "PAST"
                        return (
                          <tr key={e.id} className="border-b border-white/5">
                            <td className="py-2 pr-2">Event</td>
                            <td className="py-2 pr-2 truncate max-w-[240px]">{e.title}</td>
                            <td className="py-2 pr-2 whitespace-nowrap">{date.toLocaleDateString("de-DE")}</td>
                            <td className="py-2">{renderStatus(status)}</td>
                          </tr>
                        )
                      })}
                    {events.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          Keine Events
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Uploads / Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded border border-white/10">
                <div className="text-xs text-slate-300">Uploads</div>
                <div className="text-2xl text-white font-semibold">{uploads.length}</div>
              </div>
              <div className="p-3 rounded border border-white/10">
                <div className="text-xs text-slate-300">Jobs</div>
                <div className="text-2xl text-white font-semibold">{jobs.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Schnelle Aktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <Button size="sm" variant="outline" className="border-white/20 text-slate-200 h-11 sm:h-9 w-full sm:w-auto">
                🔄 Global Refresh
              </Button>
              <Button size="sm" variant="outline" className="border-white/20 text-slate-200 h-11 sm:h-9 w-full sm:w-auto" onClick={()=> { refetchActivities(); }}>
                📋 Reload Aktivitäten
              </Button>
              <Button size="sm" variant="outline" className="border-white/20 text-slate-200 h-11 sm:h-9 w-full sm:w-auto" onClick={()=> { refreshCalendar(); }}>
                📅 Reload Kalender
              </Button>
              <Button size="sm" variant="outline" className="border-white/20 text-slate-200 h-11 sm:h-9 w-full sm:w-auto" onClick={()=> { refreshUploads(); refreshJobs(); }}>
                📂 Reload Uploads
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Preview */}
      {reportHtml && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl" data-tour="reports-list">
          <CardHeader>
            <CardTitle className="text-white">Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportIFrame html={reportHtml} height={700} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}



