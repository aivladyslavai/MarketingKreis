"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import RadialCircle from "@/components/circle/radial-circle"
import { useActivities } from "@/hooks/use-activities"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { GlassSelect } from "@/components/ui/glass-select"
import { useModal } from "@/components/ui/modal/ModalProvider"
import CategorySetup from "@/components/performance/CategorySetup"
import { useUserCategories, type UserCategory } from "@/hooks/use-user-categories"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { CalendarDays, Check, Download, Pencil, Trash2, X } from "lucide-react"
import { CategoryPicker } from "@/components/forms/category-picker"
import { DateRangePicker } from "@/components/forms/date-range-picker"
import { EntityFormSection } from "@/components/forms/entity-form"

// Category colors (same as in RadialCircle)
const categoryColors: Record<string, string> = {
  VERKAUFSFOERDERUNG: "#3b82f6",
  IMAGE: "#a78bfa",
  EMPLOYER_BRANDING: "#10b981",
  KUNDENPFLEGE: "#f59e0b",
}

const checklistItems = ["Brief", "Copy", "Design", "Approved", "Scheduled"] as const
type PeriodPreset = "1Y" | "2Y" | "3Y" | "CUSTOM"

function getActivityRangeBadge(activity: any, enabled: boolean) {
  if (!enabled) return null
  const start = activity?.start ? new Date(activity.start as any) : null
  const end = activity?.end ? new Date(activity.end as any) : null
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()
  if (startYear === endYear) return null
  return `${startYear}-${endYear}`
}

function parseDateValue(value?: string) {
  if (!value) return undefined
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function FancyDateInput({
  value,
  onChange,
  placeholder,
  className,
  align = "left",
  allowClear = false,
}: {
  value?: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
  align?: "left" | "right"
  allowClear?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const selectedDate = parseDateValue(value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl border border-white/15 bg-white/8 px-3 text-left text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition-colors",
          "hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-200">
            <CalendarDays className="h-3.5 w-3.5" />
          </span>
          <span className={cn("truncate", !selectedDate && "text-slate-400")}>
            {selectedDate ? format(selectedDate, "d. MMM yyyy", { locale: de }) : placeholder}
          </span>
        </span>
        {allowClear && value ? (
          <span
            role="button"
            aria-label="Datum löschen"
            className="ml-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            onClick={(event) => {
              event.stopPropagation()
              onChange("")
              setOpen(false)
            }}
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-[130] rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return
              onChange(format(date, "yyyy-MM-dd"))
              setOpen(false)
            }}
            initialFocus
            className="rounded-xl bg-transparent text-white"
            classNames={{
              caption_label: "text-sm font-semibold text-white",
              head_cell: "w-9 text-[0.8rem] font-medium uppercase tracking-[0.18em] text-slate-500",
              day: "h-9 w-9 rounded-xl p-0 font-medium text-slate-200 hover:bg-white/10",
              day_selected: "bg-blue-600 text-white hover:bg-blue-500 focus:bg-blue-600 focus:text-white",
              day_today: "bg-white/10 text-white",
              day_outside: "text-slate-600 opacity-70",
              nav_button: "h-8 w-8 rounded-full border border-white/10 bg-white/5 p-0 text-slate-300 opacity-100 hover:bg-white/10 hover:text-white",
              cell: "h-9 w-9 p-0 text-center text-sm",
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function ActivitiesPage() {
  const { activities, loading, error, addActivity, updateActivity, deleteActivity, refresh } = useActivities() as any
  const [ready, setReady] = useState(false)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const didAutoYearRef = useRef(false)
  const [isSmall, setIsSmall] = useState(false)
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window === "undefined") return 1
    const z = parseFloat(String(localStorage.getItem("activities:zoom") || ""))
    return Number.isFinite(z) ? Math.min(1.6, Math.max(0.6, z)) : 1
  })
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [preset, setPreset] = useState<"ALL" | "ONGOING" | "UPCOMING" | "PAST">(() => {
    if (typeof window === "undefined") return "ALL"
    return (localStorage.getItem("activities:preset") as any) || "ALL"
  })
  const [compact, setCompact] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    const v = localStorage.getItem("activities:compact")
    return v === "1" || v === "true"
  })
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>(() => {
    if (typeof window === "undefined") return "1Y"
    const v = localStorage.getItem("activities:periodPreset")
    return v === "2Y" || v === "3Y" || v === "CUSTOM" ? v : "1Y"
  })
  const [customStart, setCustomStart] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-01-01`
  })
  const [customEnd, setCustomEnd] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-12-31`
  })
  const { openModal, closeModal } = useModal()
  const { categories } = useUserCategories()
  const [editCats, setEditCats] = useState(false)

  useEffect(() => {
    setReady(true)
    try {
      const mql = window.matchMedia("(max-width: 640px)")
      const apply = () => setIsSmall(mql.matches)
      apply()
      mql.addEventListener?.("change", apply)
      return () => { mql.removeEventListener?.("change", apply) }
    } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem("activities:preset", preset) } catch {} }, [preset])
  useEffect(() => { try { localStorage.setItem("activities:compact", compact ? "1" : "0") } catch {} }, [compact])
  useEffect(() => { try { localStorage.setItem("activities:zoom", String(zoom)) } catch {} }, [zoom])
  useEffect(() => { try { localStorage.setItem("activities:periodPreset", periodPreset) } catch {} }, [periodPreset])

  const viewStart = (() => {
    if (periodPreset === "CUSTOM") {
      const start = new Date(`${customStart}T00:00:00`)
      return Number.isNaN(start.getTime()) ? new Date(year, 0, 1, 0, 0, 0, 0) : start
    }
    return new Date(year, 0, 1, 0, 0, 0, 0)
  })()

  const viewEnd = (() => {
    if (periodPreset === "CUSTOM") {
      const end = new Date(`${customEnd}T23:59:59`)
      const safeEnd = Number.isNaN(end.getTime()) ? new Date(year, 11, 31, 23, 59, 59, 999) : end
      return safeEnd >= viewStart ? safeEnd : new Date(viewStart.getFullYear(), viewStart.getMonth(), viewStart.getDate(), 23, 59, 59, 999)
    }
    const spanYears = periodPreset === "3Y" ? 3 : periodPreset === "2Y" ? 2 : 1
    return new Date(year + spanYears - 1, 11, 31, 23, 59, 59, 999)
  })()

  const viewLabel = (() => {
    if (periodPreset === "CUSTOM") {
      return `${format(viewStart, "dd.MM.yyyy", { locale: de })} - ${format(viewEnd, "dd.MM.yyyy", { locale: de })}`
    }
    if (periodPreset === "1Y") return String(year)
    return `${year}-${viewEnd.getFullYear()}`
  })()

  const showYearRangeBadge = periodPreset === "1Y"

  // If imported activities live in a different year (e.g. media plan 2022/2023),
  // auto-switch the year once so the circle isn't empty.
  useEffect(() => {
    if (didAutoYearRef.current) return
    if (!Array.isArray(activities) || activities.length === 0) return

    const years = new Set<number>()
    for (const a of activities as any[]) {
      const s = a?.start ? new Date(a.start as any) : null
      const e = a?.end ? new Date(a.end as any) : null
      if (s && !Number.isNaN(s.getTime())) years.add(s.getFullYear())
      if (e && !Number.isNaN(e.getTime())) years.add(e.getFullYear())
    }
    if (years.size === 0) return

    const y = year
    const hasCurrent = years.has(y)
    const latest = Math.max(...Array.from(years))
    // Only auto-switch if current year isn't present and we're still on "today's year".
    if (!hasCurrent && y === new Date().getFullYear()) {
      didAutoYearRef.current = true
      setYear(latest)
    }
  }, [activities, year])

  if (!ready || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="lg:col-span-3">
            <Skeleton className="h-[700px]" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[700px]" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="p-6 sm:p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Fehler beim Laden der Daten</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <p className="text-sm text-slate-500">Bitte stellen Sie sicher, dass der CRM-Server läuft und Sie eingeloggt sind.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // helper: resolve color for category (user-defined first, fallback to defaults)
  const userColorMap: Record<string, string> = (categories || []).reduce((m, c) => { m[c.name] = c.color; return m }, {} as Record<string,string>)
  const getColor = (name: string) => userColorMap[name] || (categoryColors as any)[name] || '#64748b'

  const filtered = activities
    // show if the activity overlaps the selected visible period at all
    .filter((a: any) => {
      const s = a.start ? new Date(a.start) : undefined
      const e = a.end ? new Date(a.end) : undefined
      if (s && e) return s <= viewEnd && e >= viewStart
      if (s && !e) return s >= viewStart && s <= viewEnd
      return true
    })
    .filter((a: any) => {
      if (categoryFilter === 'ALL') return true
      const left = String(a.category || '').trim().toUpperCase()
      const right = String(categoryFilter || '').trim().toUpperCase()
      return left === right
    })

  // Aktuelle Aktivitäten = läuft gerade ODER начинается в будущем; если ничего — показать последние 5
  const today = new Date()
  let aktuellActivities = filtered
    .filter((a: any) => {
      const s = a.start ? new Date(a.start as any) : null
      const e = a.end ? new Date(a.end as any) : null
      if (s && e) return s <= today && e >= today // ongoing
      if (s && !e) return s >= today // single-day in future
      return false
    })
    .sort((a: any, b: any) => new Date(a.start as any).getTime() - new Date(b.start as any).getTime())
  if (aktuellActivities.length === 0) {
    aktuellActivities = filtered
      .filter((a: any) => !!a.start)
      .sort((a: any, b: any) => new Date(b.start as any).getTime() - new Date(a.start as any).getTime())
  }

  // Apply preset filter for visible set
  const visibleActivities = (() => {
    if (preset === "ALL") return filtered
    if (preset === "ONGOING") {
      return filtered.filter((a: any) => {
        const s = a.start ? new Date(a.start) : undefined
        const e = a.end ? new Date(a.end) : undefined
        return s && e ? s <= today && e >= today : false
      })
    }
    if (preset === "UPCOMING") {
      return filtered.filter((a: any) => {
        const s = a.start ? new Date(a.start) : undefined
        return s ? s >= today : false
      })
    }
    // PAST
    return filtered.filter((a: any) => {
      const e = a.end ? new Date(a.end) : undefined
      const s = a.start ? new Date(a.start) : undefined
      if (e) return e < today
      if (s) return s < today
      return false
    })
  })()

  const exportCsv = () => {
    const rows = [
      ["id", "title", "category", "status", "start", "end"].join(","),
      ...visibleActivities.map((a: any) =>
        [
          JSON.stringify(a.id ?? ""),
          JSON.stringify(a.title ?? ""),
          JSON.stringify(a.category ?? ""),
          JSON.stringify(a.status ?? ""),
          JSON.stringify(a.start ?? ""),
          JSON.stringify(a.end ?? ""),
        ].join(",")
      ),
    ].join("\n")
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `activities-${viewStart.getFullYear()}-${preset.toLowerCase()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-4 sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-gradient-to-tr from-fuchsia-500/30 to-blue-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-500/30 to-emerald-500/30 blur-3xl" />
        <div className="relative flex flex-col gap-4">
          {/* Title */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">Aktivitäten</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">Planen und visualisieren Sie Ihre Marketing-Aktivitäten</p>
          </div>
          
          {/* Controls - responsive grid */}
          <div className="flex flex-col gap-3">
            {/* Filter tabs - scrollable on mobile */}
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="inline-flex rounded-lg overflow-hidden border border-white/20 min-w-max">
                {[
                  { k: "ALL", label: "Alle" },
                  { k: "ONGOING", label: "Läuft" },
                  { k: "UPCOMING", label: "Zukünftig" },
                  { k: "PAST", label: "Vergangen" },
                ].map(({ k, label }) => (
                  <button
                    key={k}
                    onClick={() => setPreset(k as any)}
                    className={`px-2.5 sm:px-3 h-10 sm:h-9 text-xs sm:text-sm whitespace-nowrap ${preset === k ? "bg-white/20 text-white" : "bg-white/5 text-white/80"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2" data-tour="activities-actions">
              <button
                onClick={() => setCompact(c => !c)}
                className={`h-10 sm:h-9 px-2.5 sm:px-3 rounded-lg border border-white/20 text-xs sm:text-sm ${compact ? "bg-white/20 text-white" : "bg-white/5 text-white/80"}`}
              >
                {compact ? "Kompakt" : "Erweitert"}
              </button>
              <Button size="sm" variant="outline" className="glass-card h-8 sm:h-9 text-xs sm:text-sm" onClick={exportCsv}>
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button size="sm" className="bg-white text-slate-900 hover:bg-white/90 h-8 sm:h-9 text-xs sm:text-sm ml-auto" onClick={() => openModal({
                type: 'custom',
                title: 'Aktivität hinzufügen',
                content: (<AddActivityForm onCreate={async (p) => { await addActivity(p); refresh?.(); }} />)
              })}>+ Aktivität</Button>
            </div>
          </div>
        </div>
      </div>
      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Left side: Marketing Circle + Legend */}
        <div className="lg:col-span-4 space-y-6">
          {/* Marketing Circle */}
          <Card className="glass-card p-3 sm:p-6 overflow-visible">
            {/* Controls - stacked on mobile, inline on desktop */}
            <div className="mb-4 space-y-3 text-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs sm:text-sm">
                  Zeitraum: {viewLabel}
                </span>
                <div className="w-full sm:w-40">
                  <GlassSelect
                    value={periodPreset}
                    onChange={(value) => setPeriodPreset(value as PeriodPreset)}
                    options={[
                      { value: "1Y", label: "1 Jahr" },
                      { value: "2Y", label: "2 Jahre" },
                      { value: "3Y", label: "3 Jahre" },
                      { value: "CUSTOM", label: "Custom" },
                    ]}
                    className="w-full"
                  />
                </div>
                {periodPreset !== "CUSTOM" ? (
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs sm:text-sm">
                      Startjahr: {year}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="glass-card h-8 w-8 sm:w-auto sm:px-2 p-0" onClick={() => setYear((y) => y - 1)}>-</Button>
                      <Button size="sm" variant="outline" className="glass-card h-8 w-8 sm:w-auto sm:px-2 p-0" onClick={() => setYear((y) => y + 1)}>+</Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
                    <FancyDateInput
                      value={customStart}
                      onChange={setCustomStart}
                      placeholder="Startdatum"
                    />
                    <FancyDateInput
                      value={customEnd}
                      onChange={setCustomEnd}
                      placeholder="Enddatum"
                      align="right"
                    />
                  </div>
                )}
              </div>
              {/* Zoom controls are useful on desktop, but add noise on mobile */}
              {!isSmall && (
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs sm:text-sm">Zoom: {zoom.toFixed(1)}x</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="glass-card h-8 w-8 sm:w-auto sm:px-2 p-0" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}>-</Button>
                    <Button size="sm" variant="outline" className="glass-card h-8 w-8 sm:w-auto sm:px-2 p-0" onClick={() => setZoom((z) => Math.min(1.6, z + 0.2))}>+</Button>
                  </div>
                </div>
              )}
              <div className="w-full sm:w-auto">
                <GlassSelect
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    { value: 'ALL', label: 'Alle' },
                    ...((categories && categories.length > 0)
                      ? categories.map(c => ({ value: c.name, label: c.name }))
                      : Object.keys(categoryColors).map(k => ({ value: k, label: k })))
                  ]}
                  className="w-full sm:w-44"
                />
              </div>
            </div>
            {/* Circle container with proper overflow handling */}
            <div className="w-full flex items-center justify-center px-2 sm:px-6">
              <RadialCircle
                // Important: don't invent dates. Activities without a start date would otherwise
                // render as "today" and collapse into a single dot cluster.
                activities={visibleActivities
                  .filter((a: any) => Boolean(a?.start))
                  .map((a: any) => ({
                  ...a,
                  status: (String(a.status).toUpperCase() === 'COMPLETED' ? 'DONE' : a.status) as any,
                  start: a.start ? new Date(a.start as any) : undefined,
                  end: a.end ? new Date(a.end as any) : undefined,
                  weight: a.weight || 50,
                  budgetCHF: a.budgetCHF || 0,
                  expectedLeads: a.expectedLeads || 0,
                }))}
                // Let the circle fill the available width on mobile (no tiny 360px cap)
                size={(isSmall ? 740 : 820) * (isSmall ? 1 : zoom)}
                year={year}
                viewStart={viewStart}
                viewEnd={viewEnd}
                viewLabel={viewLabel}
                showRangeBadge={showYearRangeBadge}
                categories={categories}
                onActivityUpdate={async (id, updates) => {
                  try {
                    await updateActivity(id as any, {
                      ...updates,
                      start: updates.start ? (updates.start as any).toISOString?.() || updates.start : undefined,
                      end: updates.end ? (updates.end as any).toISOString?.() || updates.end : undefined,
                    })
                    refresh?.()
                  } catch (e) { console.error(e) }
                }}
              />
            </div>
          </Card>

          {/* Legend & Tips card to align height with sidebar */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Legende & Tipps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                {(categories && categories.length > 0
                  ? categories.map(c => [c.name, c.color] as const)
                  : Object.entries(categoryColors)
                ).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color as string }} />
                    {key}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
                <div>• Klick auf Punkt: Details öffnen</div>
                <div>• Shift + Drag: Datum verschieben</div>
                <div>• Hover: Linien & Label hervorheben</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side: Sidebar with activities and chart */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current Activities */}
          <Card className="glass-card" data-tour="activities-list">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Aktuelle Aktivitäten</CardTitle>
                <Link
                  href={`/activities?year=${year}&status=all`}
                  className="text-sm text-slate-300 hover:text-white inline-flex items-center gap-2"
                >
                  Alle anzeigen <span aria-hidden>→</span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="max-h-[560px] overflow-y-auto pr-2 mk-no-scrollbar">
              <div className="space-y-3">
                {aktuellActivities.length === 0 && (
                  <p className="text-slate-400 text-sm">Keine Aktivitäten</p>
                )}
                {aktuellActivities.map((a: any) => (
                  <div 
                    key={a.id} 
                    className="group p-3 rounded-2xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 hover:border-white/15 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white leading-snug break-words">
                          {a.title}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-300/90">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            {a.start ? format(new Date(a.start as any), 'dd.MM.yyyy HH:mm', { locale: de }) : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 glass-card"
                          title="Bearbeiten"
                          aria-label="Bearbeiten"
                          onClick={(e) => {
                            e.stopPropagation()
                            openModal({
                              type: 'custom',
                              title: 'Aktivität bearbeiten',
                              content: (
                                <EditActivityForm activity={a} onSave={async (updates)=>{ await updateActivity(String(a.id), updates as any); await refresh?.(); }} />
                              )
                            })
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-rose-500/30 text-rose-200 hover:bg-rose-500/10"
                          title="Löschen"
                          aria-label="Löschen"
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const ok = typeof window === "undefined" ? true : window.confirm("Aktivität wirklich löschen?")
                              if (!ok) return
                              await deleteActivity?.(String(a.id))
                            } catch (err) {
                              console.error("Failed to delete activity", err)
                              if (typeof window !== "undefined") window.alert("Aktivität konnte nicht gelöscht werden. Bitte später erneut versuchen.")
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-100"
                        title={String(a.category || "")}
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getColor(a.category) }} />
                        <span className="break-words">{a.category}</span>
                      </span>
                      <Badge className="bg-white/10 text-slate-200 border-white/20 text-[11px] px-2 py-1">
                        {String(a.status).toUpperCase()}
                      </Badge>
                      {getActivityRangeBadge(a, showYearRangeBadge) && (
                        <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-100 text-[11px] px-2 py-1">
                          {getActivityRangeBadge(a, showYearRangeBadge)}
                        </Badge>
                      )}
                      {a?.stage && (
                        <Badge className="bg-blue-900/30 text-blue-200 border-blue-800 text-[11px] px-2 py-1">
                          {String(a.stage).toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        {/* Пользовательские категории / круговая диаграмма */}
          <Card className="glass-card">
            <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Kategorien</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="glass-card"
                onClick={(e) => {
                  e.preventDefault()
                  try {
                    openModal({
                      type: 'custom',
                      title: 'Kategorien einrichten',
                      content: (
                        <CategorySetup onReady={() => {
                          // после сохранения перерисуем локальный список
                          setEditCats(false)
                          closeModal()
                        }} />
                      )
                    })
                  } catch {
                    setEditCats(true)
                  }
                }}
              >
                ⚙️ Kategorien
              </Button>
            </div>
            </CardHeader>
            <CardContent>            {(!categories || categories.length === 0 || editCats) ? (
              <CategorySetup onReady={() => setEditCats(false)} />
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categories.map((c: UserCategory) => ({ name: c.name, value: 1, color: c.color }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} stroke="#0f172a">
                        {categories.map((c: UserCategory, index: number) => (<Cell key={`cell-${index}`} fill={c.color} />))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 12, color: '#0f172a', backdropFilter: 'blur(10px)' }}
                        labelStyle={{ color: '#0f172a' }}
                        itemStyle={{ color: '#0f172a' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {categories.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </div>
                  ))}
                </div>
              </>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AddActivityForm({ onCreate }: { onCreate: (payload: any) => Promise<void> }) {
  const { closeModal } = useModal()
  const [title, setTitle] = useState("")
  const [dateStart, setDateStart] = useState(new Date().toISOString().slice(0,10))
  const [dateEnd, setDateEnd] = useState("")
  const [type, setType] = useState("event")
  const [category, setCategory] = useState("")
  const [stage, setStage] = useState<'DRAFT'|'REVIEW'|'PUBLISHED'>('DRAFT')
  const [checklist, setChecklist] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const canCreate = title.trim().length > 0

  return (
    <div className="space-y-5">
      <EntityFormSection>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Titel</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. E-Mail Nurture Automation" />
          </div>

          <DateRangePicker start={dateStart} end={dateEnd} onStartChange={setDateStart} onEndChange={setDateEnd} endLabel="Ende (optional)" />

          <div className="grid gap-1.5">
            <Label>Beschreibung</Label>
            <Textarea
              className="min-h-[110px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurzbeschreibung / Kontext / nächste Schritte"
            />
          </div>
        </div>
      </EntityFormSection>

      <EntityFormSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>Typ</Label>
            <GlassSelect value={type} onChange={setType} options={[{ value: "event", label: "Event" }, { value: "task", label: "Aufgabe" }]} />
          </div>
          <CategoryPicker id="activity_category" value={category} onChange={setCategory} required />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>Workflow</Label>
            <GlassSelect
              value={stage}
              onChange={(v: any) => setStage(v)}
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "REVIEW", label: "Review" },
                { value: "PUBLISHED", label: "Published" },
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Checklist</Label>
            <div className="flex flex-wrap gap-2">
              {checklistItems.map((item) => {
                const active = checklist.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setChecklist((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]))
                    }
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25",
                      active
                        ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                        : "bg-white/60 dark:bg-slate-950/20 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/5",
                    ].join(" ")}
                  >
                    <Check className={`h-3.5 w-3.5 ${active ? "opacity-100" : "opacity-0"}`} />
                    {item}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </EntityFormSection>

      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          className="flex-1 rounded-xl border-white/15 bg-white/50 hover:bg-white/70 dark:bg-slate-950/20 dark:hover:bg-slate-950/30"
          onClick={closeModal}
        >
          Abbrechen
        </Button>
        <Button
          className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 disabled:opacity-60"
          disabled={!canCreate}
          onClick={async () => {
            if (!title.trim()) return
            await onCreate({
              title,
              description,
              start: `${dateStart}T09:00:00`,
              end: dateEnd ? `${dateEnd}T18:00:00` : undefined,
              category,
              status: "PLANNED",
              weight: 50,
              budgetCHF: 0,
              stage,
              checklist,
            })
            closeModal()
          }}
        >
          Erstellen
        </Button>
      </div>
    </div>
  )
}


function EditActivityForm({ activity, onSave }: { activity: any; onSave: (updates: any) => Promise<void> }) {
  const { closeModal } = useModal()
  const [title, setTitle] = useState(String(activity.title || ''))
  const [dateStart, setDateStart] = useState(activity.start ? new Date(activity.start as any).toISOString().slice(0,10) : new Date().toISOString().slice(0,10))
  const [dateEnd, setDateEnd] = useState(activity.end ? new Date(activity.end as any).toISOString().slice(0,10) : '')
  const [status, setStatus] = useState(String(activity.status || 'PLANNED'))
  const [category, setCategory] = useState(String(activity.category || 'VERKAUFSFOERDERUNG'))
  const [description, setDescription] = useState(String(activity.notes || ''))
  const [stage, setStage] = useState<string>(String(activity.stage || 'DRAFT'))
  const [checklist, setChecklist] = useState<string[]>(Array.isArray(activity.checklist)? activity.checklist: [])
  const canSave = title.trim().length > 0

  return (
    <div className="space-y-5">
      <EntityFormSection>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Titel</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" />
          </div>

          <DateRangePicker start={dateStart} end={dateEnd} onStartChange={setDateStart} onEndChange={setDateEnd} endLabel="Ende (optional)" />

          <div className="grid gap-1.5">
            <Label>Beschreibung</Label>
            <Textarea
              className="min-h-[110px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurzbeschreibung / Kontext / nächste Schritte"
            />
          </div>
        </div>
      </EntityFormSection>

      <EntityFormSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <GlassSelect
              value={status}
              onChange={(v) => setStatus(String(v))}
              options={[
                { value: "PLANNED", label: "Geplant" },
                { value: "ACTIVE", label: "Aktiv" },
                { value: "PAUSED", label: "Pausiert" },
                { value: "DONE", label: "Abgeschlossen" },
                { value: "CANCELLED", label: "Abgebrochen" },
              ]}
            />
          </div>
          <CategoryPicker id="activity_category_edit" value={category} onChange={setCategory} required />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>Workflow</Label>
            <GlassSelect
              value={stage}
              onChange={(v: any) => setStage(v)}
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "REVIEW", label: "Review" },
                { value: "PUBLISHED", label: "Published" },
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Checklist</Label>
            <div className="flex flex-wrap gap-2">
              {checklistItems.map((item) => {
                const active = checklist.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setChecklist((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]))
                    }
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25",
                      active
                        ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                        : "bg-white/60 dark:bg-slate-950/20 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/5",
                    ].join(" ")}
                  >
                    <Check className={`h-3.5 w-3.5 ${active ? "opacity-100" : "opacity-0"}`} />
                    {item}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </EntityFormSection>

      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          className="flex-1 rounded-xl border-white/15 bg-white/50 hover:bg-white/70 dark:bg-slate-950/20 dark:hover:bg-slate-950/30"
          onClick={closeModal}
        >
          Abbrechen
        </Button>
        <Button
          className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 disabled:opacity-60"
          disabled={!canSave}
          onClick={async () => {
            if (!title.trim()) return
            await onSave({
              title,
              notes: description,
              status,
              category,
              start: `${dateStart}T09:00:00`,
              end: dateEnd ? `${dateEnd}T18:00:00` : undefined,
              stage,
              checklist,
            })
            closeModal()
          }}
        >
          Speichern
        </Button>
      </div>
    </div>
  )
}





