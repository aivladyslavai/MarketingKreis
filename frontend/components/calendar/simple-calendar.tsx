"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Filter,
  Download,
  X,
  Sparkles,
  User,
  Coins,
  TrendingUp,
  Activity as ActivityIcon,
} from "lucide-react"
import { 
  format, 
  addDays,
  addMonths, 
  subDays,
  subMonths, 
  startOfMonth, 
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday 
} from "date-fns"
import { de } from "date-fns/locale"
import { getISOWeek, getWeekLabel, formatWeekRange } from "@/lib/date"
import { getCategoryColor, type CategoryType } from "@/lib/colors"
import { apiBase } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GlassSelect } from "@/components/ui/glass-select"
import { type Activity } from "@/components/circle/radial-circle"
// custom delayed tooltip implemented locally (no external popover)

interface CalendarViewProps {
  activities: Activity[]
  onActivityClick?: (activity: Activity) => void
  onDateClick?: (date: Date) => void
  onCreateActivity?: (date: Date) => void
  onUpdateActivity?: (
    id: string,
    updates: Partial<Activity>,
    opts?: { scope?: "series" | "only"; occurrenceDateISO?: string; sourceId?: string }
  ) => void | Promise<void>
  onDeleteActivity?: (id: string) => void | Promise<void>
  onDuplicateActivity?: (activity: Activity) => void | Promise<void>
}

export default function SimpleCalendarView({ 
  activities, 
  onActivityClick, 
  onDateClick,
  onCreateActivity,
  onUpdateActivity,
  onDeleteActivity,
  onDuplicateActivity,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [isSmall, setIsSmall] = React.useState(false)
  const [view, setView] = React.useState<"agenda" | "grid">(() => {
    try {
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches) return "agenda"
    } catch {}
    return "grid"
  })
  const [selectedActivity, setSelectedActivity] = React.useState<Activity | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [draft, setDraft] = React.useState<Activity | null>(null)
  const [scope, setScope] = React.useState<'series' | 'only'>('series')
  // AI suggestion for editing existing activity
  const [aiEnabled, setAiEnabled] = React.useState(false)
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiSuggestion, setAiSuggestion] = React.useState<{ title?: string; desc?: string } | null>(null)
  const { toast } = useToast()
  const [hoverEventId, setHoverEventId] = React.useState<string | null>(null)
  const hoverTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const [openDayIso, setOpenDayIso] = React.useState<string | null>(null)

  // Responsive helpers
  React.useEffect(() => {
    try {
      const mql = window.matchMedia("(max-width: 640px)")
      const apply = () => setIsSmall(mql.matches)
      apply()
      mql.addEventListener?.("change", apply)
      return () => mql.removeEventListener?.("change", apply)
    } catch {
      return
    }
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const isoToDate = (iso: string) => {
    const [y, m, d] = String(iso || "").split("-").map((x) => parseInt(x, 10))
    return new Date(y || 1970, Math.max(0, (m || 1) - 1), d || 1)
  }

  const activitiesByIso = React.useMemo(() => {
    const m = new Map<string, Activity[]>()
    for (const a of activities || []) {
      if (!(a as any)?.start) continue
      const dt = (a.start instanceof Date ? a.start : new Date(a.start as any)) as Date
      if (!Number.isFinite(dt.getTime())) continue
      const iso = format(dt, "yyyy-MM-dd")
      const list = m.get(iso)
      if (list) list.push(a)
      else m.set(iso, [a])
    }
    for (const list of m.values()) {
      list.sort((aa, bb) => {
        const ad = aa.start instanceof Date ? aa.start : new Date(aa.start as any)
        const bd = bb.start instanceof Date ? bb.start : new Date(bb.start as any)
        return (ad?.getTime?.() || 0) - (bd?.getTime?.() || 0)
      })
    }
    return m
  }, [activities])

  const getActivitiesForDate = (date: Date) => {
    try {
      return activitiesByIso.get(format(date, "yyyy-MM-dd")) || []
    } catch {
      return []
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity)
    setDraft(activity)
    setIsEditing(false)
    setAiEnabled(false)
    setAiSuggestion(null)
    setScope((activity as any).sourceId ? 'series' : 'series')
    onActivityClick?.(activity)
  }

  const closeDetails = () => {
    setSelectedActivity(null)
    setIsEditing(false)
    setDraft(null)
    setAiEnabled(false)
    setAiSuggestion(null)
  }

  const handleCreateClick = (date: Date) => {
    onCreateActivity?.(date)
    toast({
      title: "Neues Event",
      description: `${format(date, 'EEEE, dd.MM.yyyy', { locale: de })}`,
    })
  }

  const handleFilter = () => {
    toast({
      title: "Filter",
      description: "Filter-Funktionalität wird geladen...",
    })
  }

  const handleExport = () => {
    toast({
      title: "Export",
      description: "Kalender wird exportiert...",
    })
  }

  const handleNewActivity = () => {
    onCreateActivity?.(new Date())
    toast({
      title: "Neue Aktivität",
      description: "Dialog für neue Aktivität wird geöffnet",
    })
  }

  const agendaStart = React.useMemo(() => {
    const d = new Date(currentDate)
    d.setHours(0, 0, 0, 0)
    return d
  }, [currentDate])

  const agendaDays = React.useMemo(() => {
    // 7-day agenda window (mobile-friendly).
    return Array.from({ length: 7 }, (_, i) => addDays(agendaStart, i))
  }, [agendaStart])

  const openDayDate = openDayIso ? isoToDate(openDayIso) : null
  const openDayActivities = openDayDate ? getActivitiesForDate(openDayDate) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (view === "grid" ? handlePrevMonth() : setCurrentDate(subDays(currentDate, 1)))}
            className="w-7 h-7 sm:w-8 sm:h-8 p-0 shrink-0 glass-card"
            aria-label={view === "grid" ? "Vorheriger Monat" : "Vorheriger Tag"}
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <h2 className="text-lg sm:text-xl font-semibold text-center sm:text-left min-w-0">
            {view === "grid"
              ? format(currentDate, "MMMM yyyy", { locale: de })
              : format(currentDate, "EEE, dd.MM.yyyy", { locale: de })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (view === "grid" ? handleNextMonth() : setCurrentDate(addDays(currentDate, 1)))}
            className="w-7 h-7 sm:w-8 sm:h-8 p-0 shrink-0 glass-card"
            aria-label={view === "grid" ? "Nächster Monat" : "Nächster Tag"}
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
        
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 w-full xs:w-auto">
            <button
              type="button"
              onClick={() => setView("agenda")}
              className={cn(
                "h-9 xs:h-9 flex-1 xs:flex-none px-3 rounded-lg text-xs font-semibold transition-colors",
                view === "agenda" ? "bg-white/15 text-white" : "text-slate-300 hover:text-white"
              )}
              aria-pressed={view === "agenda"}
            >
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "h-9 xs:h-9 flex-1 xs:flex-none px-3 rounded-lg text-xs font-semibold transition-colors",
                view === "grid" ? "bg-white/15 text-white" : "text-slate-300 hover:text-white"
              )}
              aria-pressed={view === "grid"}
            >
              Monat
            </button>
          </div>
          {view === "agenda" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full xs:w-auto text-xs sm:text-sm glass-card"
              onClick={() => setCurrentDate(new Date())}
            >
              Heute
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full xs:w-auto text-xs sm:text-sm glass-card"
            onClick={handleFilter}
          >
            <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Filter</span>
            <span className="xs:hidden">🔍</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full xs:w-auto text-xs sm:text-sm glass-card"
            onClick={handleExport}
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Export</span>
            <span className="xs:hidden">📥</span>
          </Button>
          <Button 
            size="sm" 
            className="w-full xs:w-auto text-xs sm:text-sm"
            onClick={() => onCreateActivity?.(new Date())}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Neue </span>Aktivität
          </Button>
        </div>
      </div>

      {/* Agenda (mobile-first) */}
      {view === "agenda" && (
        <Card className="glass-card">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ActivityIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Agenda
              <span className="ml-auto text-xs text-slate-400">
                {format(agendaDays[0] || currentDate, "dd.MM")} –{" "}
                {format(agendaDays[agendaDays.length - 1] || currentDate, "dd.MM", { locale: de })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6">
            <div className="space-y-3">
              {agendaDays.map((day) => {
                const iso = format(day, "yyyy-MM-dd")
                const dayActivities = getActivitiesForDate(day)
                const dayLabel = format(day, "EEEE, dd.MM", { locale: de })
                const today = isToday(day)

                return (
                  <div
                    key={iso}
                    className={cn(
                      "rounded-2xl border border-white/10 bg-white/5 overflow-hidden",
                      today && "ring-1 ring-blue-500/30"
                    )}
                  >
                    <div
                      className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-slate-950/30"
                      onClick={() => {
                        setCurrentDate(day)
                        setOpenDayIso(iso)
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-100 truncate">
                          {dayLabel}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {today ? "Heute" : "Tippen für Details"}
                          {dayActivities.length > 0 ? ` · ${dayActivities.length} Aktivitäten` : ""}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0 glass-card flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCreateActivity?.(day)
                        }}
                        aria-label="Neue Aktivität"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="p-2 space-y-2">
                      {dayActivities.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2 text-xs text-slate-400">
                          Keine Aktivitäten
                        </div>
                      ) : (
                        dayActivities.map((activity) => {
                          const customColor = (activity as any).color as string | undefined
                          const baseColor = customColor || getCategoryColor(activity.category as any)
                          const primaryColor = baseColor
                          const dt = activity.start instanceof Date ? activity.start : new Date(activity.start as any)
                          const t = Number.isFinite(dt.getTime()) ? format(dt, "HH:mm") : ""
                          const timeLabel = t && t !== "00:00" ? t : "Ganztägig"

                          return (
                            <button
                              key={`agenda-${iso}-${activity.id}`}
                              type="button"
                              className="w-full text-left rounded-xl border border-white/10 bg-slate-950/30 hover:bg-slate-950/40 transition-colors px-3 py-2.5"
                              style={{ borderLeft: `4px solid ${primaryColor}` }}
                              onClick={() => handleActivityClick(activity)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                                    <span className="font-semibold text-sm text-slate-100 truncate">
                                      {activity.title}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-400 flex flex-wrap gap-x-2 gap-y-1">
                                    <span className="text-slate-300">{timeLabel}</span>
                                    <span className="opacity-60">·</span>
                                    <span className="truncate">{String(activity.category || "").replace(/_/g, " ")}</span>
                                    {activity.owner?.name ? (
                                      <>
                                        <span className="opacity-60">·</span>
                                        <span className="truncate">{activity.owner.name}</span>
                                      </>
                                    ) : null}
                                  </div>
                                  {(activity as any)?.companyName && (
                                    <div className="mt-1 text-[11px] text-slate-400 truncate">
                                      {(activity as any).companyName}
                                      {(activity as any).projectName ? ` · ${(activity as any).projectName}` : ""}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-slate-200 flex-shrink-0">
                                  {String((activity as any).status || "PLANNED")}
                                </span>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Grid */}
      {view === "grid" && (
      <Card className="glass-card">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Marketing Kalender</span>
            <span className="sm:hidden">Kalender</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 lg:p-6">
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-4">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
              <div
                key={day}
                className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {calendarDays.map((day, idx) => {
              const dayActivities = getActivitiesForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isMonday = day.getDay() === 1
              
              return (
                <React.Fragment key={day.toISOString()}>
                  {/* Week separator before each new ISO week (Monday), except the first cell */}
                  {isMonday && idx !== 0 && (
                    <div className="col-span-7 h-px bg-white/10" />
                  )}
                <div
                  key={`cell-${day.toISOString()}`}
                  className={cn(
                    "group relative min-h-[76px] xs:min-h-[86px] sm:min-h-[100px] lg:min-h-[120px] p-1 sm:p-2 border rounded-md sm:rounded-lg transition-colors cursor-pointer backdrop-blur-sm",
                    isCurrentMonth ? "bg-white/5 dark:bg-neutral-900/40 border-white/10" : "bg-white/3 dark:bg-neutral-900/20 border-white/5",
                    isToday(day) && "ring-2 ring-blue-500/50 ring-inset",
                    "hover:bg-white/10 hover:border-white/20"
                  )}
                  onClick={() => {
                    // Open inline day details popover instead of create form
                    const iso = format(day, "yyyy-MM-dd")
                    setCurrentDate(day)
                    setOpenDayIso(iso)
                  }}
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className={cn(
                      "text-[11px] xs:text-xs sm:text-sm font-medium",
                      !isCurrentMonth && "text-muted-foreground",
                      isToday(day) && "text-blue-400 font-bold"
                    )}>
                      {format(day, 'd')}
                    </span>
                    <Button
                      aria-label="add-event"
                      variant="ghost"
                      size="icon"
                      className="hidden sm:inline-flex h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 text-slate-300 hover:text-white bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCreateActivity?.(day)
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    {dayActivities.slice(0, 3).map((activity) => {
                      const customColor = (activity as any).color as string | undefined
                      const baseColor = customColor || getCategoryColor(activity.category as any)
                      const primaryColor = baseColor
                      const bgColor = `${baseColor}20`

                      return (
                        <div
                          key={activity.id}
                          className="relative p-1 rounded text-[11px] sm:text-xs cursor-pointer transition-all hover:opacity-100 bg-opacity-90 hover:bg-opacity-100 shadow-sm"
                          style={{ backgroundColor: bgColor, borderLeft: `3px solid ${primaryColor}` }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleActivityClick(activity)
                          }}
                          onMouseEnter={() => {
                            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
                            hoverTimerRef.current = setTimeout(() => setHoverEventId(activity.id), 2000)
                          }}
                          onMouseLeave={() => {
                            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
                            setHoverEventId((id) => (id === activity.id ? null : id))
                          }}
                        >
                          <div className="font-medium truncate flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                            <span className="truncate">{activity.title}</span>
                          </div>
                          <div className="opacity-70 hidden sm:block">{activity.owner?.name || 'Unassigned'}</div>

                          {hoverEventId === activity.id && (
                            <div className="absolute left-0 top-full mt-2 z-[90] w-64 rounded-xl border border-white/10 bg-slate-900/95 text-slate-200 shadow-2xl p-3 backdrop-blur-md">
                              <div className="font-semibold truncate">{activity.title}</div>
                              <div className="text-sm text-slate-300">
                                {format(activity.start as any, 'EEEE, dd.MM.yyyy', { locale: de })}
                              </div>
                              {activity.owner?.name && (
                                <div className="text-xs text-slate-400">Verantwortlich: {activity.owner.name}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    
                    {dayActivities.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        +{dayActivities.length - 3} mehr
                      </div>
                    )}
                  </div>

                  {/* Inline day details popover (opens on day click) */}
                    {!isSmall && openDayIso === format(day, 'yyyy-MM-dd') && (
                    <div className="absolute inset-0 z-20 rounded-md sm:rounded-lg border border-white/10 bg-slate-900/90 p-2 flex flex-col backdrop-blur-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs sm:text-sm font-semibold">
                          {format(day, 'EEEE, dd.MM.yyyy', { locale: de })}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-white/10"
                            onClick={(e)=>{ e.stopPropagation(); onCreateActivity?.(day) }}
                            aria-label="add-day-activity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-white/10"
                            onClick={(e)=>{ e.stopPropagation(); setOpenDayIso(null) }}
                            aria-label="close-day-popover"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto space-y-1 pr-1">
                        {dayActivities.length === 0 && (
                          <div className="text-xs text-muted-foreground">Keine Aktivitäten</div>
                        )}
                        {dayActivities.map((activity) => {
                          const customColor = (activity as any).color as string | undefined
                          const baseColor = customColor || getCategoryColor(activity.category as any)
                          const primaryColor = baseColor
                          const bgColor = `${baseColor}20`
                          return (
                            <div
                              key={`popover-${activity.id}`}
                              className="p-1 rounded text-[11px] sm:text-xs cursor-pointer shadow-sm"
                              style={{ backgroundColor: bgColor, borderLeft: `3px solid ${primaryColor}` }}
                              onClick={(e)=>{ e.stopPropagation(); handleActivityClick(activity) }}
                            >
                              <div className="font-medium truncate flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                                <span className="truncate">{activity.title}</span>
                              </div>
                              <div className="opacity-70 hidden sm:block">
                                {activity.owner?.name || 'Unassigned'}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Day sheet (mobile: replaces inline cell popover; agenda view: details) */}
      {(isSmall || view === "agenda") && (
        <Dialog
          open={!!openDayIso}
          onOpenChange={(o) => {
            if (!o) setOpenDayIso(null)
          }}
        >
          <DialogContent className="bg-slate-950/95 border-white/10 text-slate-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold truncate">
                  {openDayDate ? format(openDayDate, "EEEE, dd.MM.yyyy", { locale: de }) : "Tag"}
                </div>
                <div className="text-xs text-slate-400">
                  {openDayActivities.length > 0 ? `${openDayActivities.length} Aktivitäten` : "Keine Aktivitäten"}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 glass-card"
                  onClick={() => {
                    if (openDayDate) onCreateActivity?.(openDayDate)
                  }}
                  aria-label="Neue Aktivität"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 glass-card"
                  onClick={() => setOpenDayIso(null)}
                  aria-label="Schließen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {openDayActivities.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
                  Keine Aktivitäten an diesem Tag.
                </div>
              ) : (
                openDayActivities.map((activity) => {
                  const customColor = (activity as any).color as string | undefined
                  const baseColor = customColor || getCategoryColor(activity.category as any)
                  const primaryColor = baseColor
                  const dt = activity.start instanceof Date ? activity.start : new Date(activity.start as any)
                  const t = Number.isFinite(dt.getTime()) ? format(dt, "HH:mm") : ""
                  const timeLabel = t && t !== "00:00" ? t : "Ganztägig"

                  return (
                    <button
                      key={`day-${activity.id}`}
                      type="button"
                      className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors px-3 py-3"
                      style={{ borderLeft: `4px solid ${primaryColor}` }}
                      onClick={() => {
                        setOpenDayIso(null)
                        handleActivityClick(activity)
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                            <span className="font-semibold text-sm text-slate-100 truncate">{activity.title}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400 flex flex-wrap gap-x-2 gap-y-1">
                            <span className="text-slate-300">{timeLabel}</span>
                            <span className="opacity-60">·</span>
                            <span className="truncate">{String(activity.category || "").replace(/_/g, " ")}</span>
                            {(activity as any)?.companyName ? (
                              <>
                                <span className="opacity-60">·</span>
                                <span className="truncate">{(activity as any).companyName}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                        <span className="text-[10px] rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-slate-200 flex-shrink-0">
                          {String((activity as any).status || "PLANNED")}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Activity Details Panel */}
      {selectedActivity && (
        <>
          {/* Mobile: backdrop + bottom-sheet details */}
          {isSmall && (
            <div className="fixed inset-0 z-[110] bg-black/50" onClick={closeDetails} />
          )}
          <Card
            className={cn(
              "relative overflow-hidden rounded-2xl border-white/10 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/70 shadow-[0_0_40px_-10px_rgba(59,130,246,.45)] ring-1 ring-white/10 flex flex-col",
              isSmall
                ? "fixed inset-x-0 bottom-0 z-[120] max-h-[75dvh] rounded-t-2xl rounded-b-none border-b-0"
                : ""
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_0%_0%,rgba(59,130,246,.12),transparent_60%)]" />
            <CardHeader
              className={cn(
                "relative p-5 md:p-6 pb-3 md:pb-4",
                isSmall && "shrink-0 border-b border-white/10 bg-slate-950/80 backdrop-blur"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  Aktivität Details
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 glass-card border-white/15 bg-white/5"
                  onClick={closeDetails}
                  aria-label="Schließen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent
              className={cn(
                "relative p-5 md:p-8 pt-2 md:pt-3",
                isSmall && "flex-1 overflow-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
              )}
            >
            <div className="space-y-6">
              <div>
                {isEditing ? (
                  <Input
                    className="text-xl font-semibold bg-transparent border-0 border-b border-white/15 rounded-none px-0 focus:ring-0 focus:border-white/25 text-slate-100 placeholder:text-slate-400"
                    value={draft?.title || ''}
                    onChange={(e)=> setDraft(d => d ? { ...d, title: e.target.value } : d)}
                  />
                ) : (
                  <h3 className="font-semibold text-xl text-slate-100">{selectedActivity.title}</h3>
                )}
                <Badge className="mt-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 border border-white/10 px-3 py-1">
                  {selectedActivity.category}
                </Badge>
              </div>

              {/* Date/time + category + color */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <Label className="text-slate-400">Datum</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      className="h-10 w-full bg-white/5 border-white/10 text-slate-100"
                      value={format(((draft as any)?.start as any) || (selectedActivity as any)?.start || new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const dateStr = e.target.value
                        const baseStart = (draft as any)?.start ? new Date((draft as any).start) : ((selectedActivity as any)?.start ? new Date((selectedActivity as any).start) : new Date())
                        const baseEnd = (draft as any)?.end ? new Date((draft as any).end) : ((selectedActivity as any)?.end ? new Date((selectedActivity as any).end) : undefined)
                        const durationMs = baseEnd ? Math.max(0, baseEnd.getTime() - baseStart.getTime()) : 0
                        const timeStr = format(baseStart, 'HH:mm')
                        const [y, m, d] = dateStr.split('-').map((x) => Number(x))
                        const [hh, mm] = timeStr.split(':').map((x) => Number(x))
                        const next = new Date(baseStart)
                        if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
                          next.setFullYear(y, Math.max(0, m - 1), d)
                        }
                        next.setHours(hh || 0, mm || 0, 0, 0)
                        const nextEnd = baseEnd ? new Date(next.getTime() + durationMs) : undefined
                        setDraft((cur) => (cur ? ({ ...cur, start: next, end: nextEnd } as any) : cur))
                      }}
                    />
                  ) : (
                    <div className="h-10 flex items-center px-3 rounded-md bg-white/5 border border-white/10 text-slate-100">
                      {selectedActivity.start ? format(selectedActivity.start as any, 'EEEE, dd.MM.yyyy', { locale: de }) : '—'}
                    </div>
                  )}
                </div>
                <div className="md:col-span-1">
                  <Label className="text-slate-400">Start</Label>
                  {isEditing ? (
                    <Input
                      type="time"
                      className="h-10 w-full bg-white/5 border-white/10 text-slate-100"
                      value={format(((draft as any)?.start as any) || (selectedActivity as any)?.start || new Date(), 'HH:mm')}
                      onChange={(e) => {
                        const t = e.target.value
                        const baseStart = (draft as any)?.start ? new Date((draft as any).start) : ((selectedActivity as any)?.start ? new Date((selectedActivity as any).start) : new Date())
                        const baseEnd = (draft as any)?.end ? new Date((draft as any).end) : ((selectedActivity as any)?.end ? new Date((selectedActivity as any).end) : undefined)
                        const durationMs = baseEnd ? Math.max(0, baseEnd.getTime() - baseStart.getTime()) : 0
                        const [hh, mm] = t.split(':').map((x) => Number(x))
                        const next = new Date(baseStart)
                        next.setHours(hh || 0, mm || 0, 0, 0)
                        const nextEnd = baseEnd ? new Date(next.getTime() + durationMs) : undefined
                        setDraft((cur) => (cur ? ({ ...cur, start: next, end: nextEnd } as any) : cur))
                      }}
                    />
                  ) : (
                    <div className="h-10 flex items-center px-3 rounded-md bg-white/5 border border-white/10 text-slate-100">
                      {selectedActivity.start ? format(selectedActivity.start as any, 'HH:mm') : '—'}
                    </div>
                  )}
                </div>
                <div className="md:col-span-1">
                  <Label className="text-slate-400">Ende</Label>
                  {isEditing ? (
                    <Input
                      type="time"
                      className="h-10 w-full bg-white/5 border-white/10 text-slate-100"
                      value={(draft as any)?.end ? format((draft as any).end as any, 'HH:mm') : ''}
                      onChange={(e) => {
                        const t = e.target.value
                        if (!t) {
                          setDraft((cur) => (cur ? ({ ...cur, end: undefined } as any) : cur))
                          return
                        }
                        const base = (draft as any)?.start ? new Date((draft as any).start) : ((selectedActivity as any)?.start ? new Date((selectedActivity as any).start) : new Date())
                        const [hh, mm] = t.split(':').map((x) => Number(x))
                        const next = new Date(base)
                        next.setHours(hh || 0, mm || 0, 0, 0)
                        // keep end after start (fallback +60min)
                        if (next.getTime() < base.getTime()) {
                          next.setTime(base.getTime() + 60 * 60 * 1000)
                        }
                        setDraft((cur) => (cur ? ({ ...cur, end: next } as any) : cur))
                      }}
                    />
                  ) : (
                    <div className="h-10 flex items-center px-3 rounded-md bg-white/5 border border-white/10 text-slate-100">
                      {(selectedActivity as any).end ? format((selectedActivity as any).end as any, 'HH:mm') : '—'}
                    </div>
                  )}
                </div>
                <div className="md:col-span-1">
                  <Label className="text-slate-400">Typ</Label>
                  {isEditing ? (
                    <GlassSelect
                      value={String(((draft as any)?.category ?? selectedActivity.category) || "event")}
                      onChange={(v) => setDraft((cur) => (cur ? ({ ...cur, category: v } as any) : cur))}
                      options={[
                        { value: "event", label: "Event" },
                        { value: "meeting", label: "Meeting" },
                        { value: "task", label: "Aufgabe" },
                        { value: "campaign", label: "Kampagne" },
                        { value: "reminder", label: "Erinnerung" },
                      ]}
                      className="h-10 bg-white/5 border-white/10 text-slate-100"
                    />
                  ) : (
                    <div className="h-10 flex items-center px-3 rounded-md bg-white/5 border border-white/10 text-slate-100">
                      {String(selectedActivity.category || '—')}
                    </div>
                  )}
                </div>
                <div className="md:col-span-1">
                  <Label className="text-slate-400">Farbe</Label>
                  {isEditing ? (
                    <div className="h-10 rounded-md bg-white/5 border border-white/10 px-2 flex items-center gap-2">
                      {['#3b82f6','#a78bfa','#10b981','#f59e0b','#ef4444','#06b6d4'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDraft((cur) => (cur ? ({ ...cur, color: c } as any) : cur))}
                          className={`h-6 w-6 rounded-full border ${String((draft as any)?.color || (selectedActivity as any)?.color) === c ? 'ring-2 ring-white border-white' : 'border-slate-600'}`}
                          style={{ backgroundColor: c }}
                          aria-label={`color-${c}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-10 flex items-center px-3 rounded-md bg-white/5 border border-white/10 text-slate-100 gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-white/20"
                        style={{ backgroundColor: String((selectedActivity as any)?.color || '#3b82f6') }}
                      />
                      <span className="text-sm opacity-80">{String((selectedActivity as any)?.color || '')}</span>
                    </div>
                  )}
                </div>
              </div>
                
                {/* Quick status when editing */}
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Status</label>
                    <GlassSelect
                      value={String((draft as any)?.status || "PLANNED")}
                      onChange={(v) => setDraft((d) => (d ? ({ ...(d as any), status: v as any } as any) : d))}
                      options={[
                        { value: "PLANNED", label: "PLANNED" },
                        { value: "DONE", label: "DONE" },
                        { value: "DELAYED", label: "DELAYED" },
                        { value: "CANCELLED", label: "CANCELLED" },
                      ]}
                      className="h-8 bg-white/10 border-white/15 text-slate-100"
                    />
                  </div>
                )}
              
              {/* Description editor with AI assist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-400">Beschreibung</Label>
                  {isEditing && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${aiEnabled ? 'border-blue-400 text-blue-300' : ''} border-white/20 bg-white/5`}
                        onClick={async ()=>{
                          const next = !aiEnabled; setAiEnabled(next)
                          if (next) {
                            setAiLoading(true)
                            try {
                              // Try server first (optional best-effort)
                              const res = await fetch(`${apiBase}/ai/activity_suggest`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                cache: 'no-store',
                                body: JSON.stringify({
                                  company_id: undefined,
                                  draft: { title: draft?.title, description: draft?.notes, type: 'event' }
                                })
                              }).catch(()=>null)
                              const data = await (res ? res.json().catch(()=>({})) : ({}))
                              if (data?.title || data?.description) {
                                setAiSuggestion({ title: data.title, desc: data.description })
                              } else {
                                // Local fallback based on user's current input
                                const t = (draft?.title && draft.title.trim().length > 2) ? draft.title.trim() : 'Event'
                                const d = `${t}: Kurze Übersicht. Ziele definieren, nächste Schritte planen. Teilnehmer vorbereiten.`
                                setAiSuggestion({ title: t, desc: d })
                              }
                            } finally { setAiLoading(false) }
                          } else {
                            setAiSuggestion(null)
                          }
                        }}
                      >{aiEnabled ? 'Vorschlag an' : 'Vorschlag'}</Button>
                      {aiEnabled && (
                        <Button variant="outline" size="sm" onClick={async ()=>{
                          // regenerate only, do not insert
                          setAiLoading(true)
                          try {
                            const t = (draft?.title && draft.title.trim().length > 0) ? draft.title.trim() : selectedActivity.title
                            const seed = `${t} ${draft?.notes || ''}`.trim()
                            const d = seed.length > 0 ? `${seed}\nAgenda: Update • Diskussion • To‑dos.` : `${t}: Neue Details und Ziele.`
                            setAiSuggestion({ title: t, desc: d })
                          } finally { setAiLoading(false) }
                        }}>Regenerieren</Button>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <Textarea
                    className="w-full min-h-[112px] bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-400"
                    value={(draft as any)?.notes || ''}
                    onChange={(e)=> setDraft(d => d ? { ...d, notes: e.target.value } as any : d)}
                  />
                ) : (
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{(selectedActivity as any)?.notes || '—'}</p>
                )}

                {/* Suggestion preview (not auto-insert) */}
                {isEditing && aiEnabled && aiSuggestion && (
                  <div className="relative max-w-[640px] rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 p-4 shadow-[0_0_30px_-10px_rgba(59,130,246,.35)] animate-pulse">
                    <div className="flex items-center gap-2 text-[11px] text-blue-300 font-medium mb-2">
                      <Sparkles className="h-3 w-3" />
                      <span>KI‑Vorschlag (Vorschau)</span>
                    </div>
                    <div className="grid gap-2">
                      <Input
                        className="bg-transparent border-white/15 text-slate-100 placeholder:text-slate-400"
                        value={aiSuggestion.title || ''}
                        onChange={(e)=> setAiSuggestion(s => ({ ...(s||{}), title: e.target.value }))}
                        placeholder="Vorschlag Titel"
                      />
                      <Textarea
                        className="bg-transparent border-white/15 text-slate-100 placeholder:text-slate-400 min-h-[84px]"
                        value={aiSuggestion.desc || ''}
                        onChange={(e)=> setAiSuggestion(s => ({ ...(s||{}), desc: e.target.value }))}
                        placeholder="Vorschlag Beschreibung"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Button size="sm" className="px-2.5 py-1 text-xs" onClick={()=>{
                        setDraft(d => d ? { ...d, title: d.title || aiSuggestion.title || d.title, notes: (aiSuggestion.desc || '') } as any : d)
                        setAiEnabled(false); setAiSuggestion(null)
                      }}>Einfügen</Button>
                      <Button size="sm" variant="outline" className="px-2.5 py-1 text-xs" onClick={async ()=>{
                        setAiLoading(true)
                        try {
                          const t = (aiSuggestion.title || '').trim() || (draft?.title || selectedActivity.title)
                          const d = (aiSuggestion.desc || '').trim()
                          const refined = d.length > 0 ? `${d}\n\nAgenda: Begrüßung • Update • Diskussion • To‑dos.` : `${t}: Ziel, Agenda, nächste Schritte.`
                          setAiSuggestion({ title: t, desc: refined })
                        } finally { setAiLoading(false) }
                      }}>Verfeinern</Button>
                      <Button size="sm" variant="outline" className="px-2.5 py-1 text-xs" onClick={()=>{ setAiSuggestion(null); setAiEnabled(false) }}>Verwerfen</Button>
                    </div>
                  </div>
                )}
              </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 min-h-[88px] flex items-start gap-3">
                    <ActivityIcon className="h-4 w-4 text-blue-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Status</div>
                    {isEditing ? (
                      <GlassSelect
                        value={String(draft?.status || selectedActivity.status)}
                        onChange={(v)=> setDraft(d => d ? { ...d, status: v as any } : d)}
                        options={[
                          { value: "PLANNED", label: "PLANNED" },
                          { value: "ACTIVE", label: "ACTIVE" },
                          { value: "PAUSED", label: "PAUSED" },
                          { value: "DONE", label: "DONE" },
                          { value: "CANCELLED", label: "CANCELLED" },
                        ]}
                        className="mt-1 bg-transparent border-white/15 text-slate-100 h-9"
                      />
                    ) : (
                      <div className="mt-1 font-semibold text-slate-100">{selectedActivity.status}</div>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 min-h-[88px] flex items-start gap-3">
                  <User className="h-4 w-4 text-purple-300 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <div>
                      <div className="text-xs text-slate-400">Verantwortlich</div>
                      <div className="mt-1 font-semibold text-slate-100">
                        {selectedActivity.owner?.name || "Unassigned"}
                      </div>
                    </div>
                    {(selectedActivity as any)?.companyName && (
                      <div className="text-[11px] text-slate-400">
                        Unternehmen:{" "}
                        <span className="text-slate-100">
                          {(selectedActivity as any).companyName}
                        </span>
                      </div>
                    )}
                    {(selectedActivity as any)?.projectName && (
                      <div className="text-[11px] text-slate-400">
                        Deal:{" "}
                        <span className="text-slate-100">
                          {(selectedActivity as any).projectName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 min-h-[88px] flex items-start gap-3">
                  <Coins className="h-4 w-4 text-amber-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Budget</div>
                    <div className="mt-1 font-semibold text-slate-100">CHF {selectedActivity.budgetCHF.toLocaleString()}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 min-h-[88px] flex items-start gap-3">
                  <TrendingUp className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Erwartete Leads</div>
                    <div className="mt-1 font-semibold text-slate-100">{selectedActivity.expectedLeads}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-1">
                {isEditing ? (
                  <>
                    {(selectedActivity as any)?.sourceId && (
                      <div className="inline-flex rounded-lg overflow-hidden border border-white/15">
                        <button onClick={()=> setScope('series')} className={`px-2 h-8 text-xs ${scope==='series'?'bg-white/20 text-white':'bg-white/5 text-white/70'}`}>Serie</button>
                        <button onClick={()=> setScope('only')} className={`px-2 h-8 text-xs ${scope==='only'?'bg-white/20 text-white':'bg-white/5 text-white/70'}`}>Nur dieses</button>
                      </div>
                    )}
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30" onClick={async ()=>{ if (draft) { await onUpdateActivity?.(selectedActivity.id as any, { title: (draft as any).title, status: (draft as any).status, notes: (draft as any).notes, start: (draft as any).start, end: (draft as any).end, category: (draft as any).category, color: (draft as any).color }, { scope, occurrenceDateISO: (selectedActivity as any).occurrenceDateISO, sourceId: (selectedActivity as any).sourceId }); setSelectedActivity({ ...selectedActivity, title: (draft as any).title, status: (draft as any).status, notes: (draft as any).notes, start: (draft as any).start, end: (draft as any).end, category: (draft as any).category || selectedActivity.category, color: (draft as any).color } as any); setIsEditing(false) } }}>Speichern</Button>
                    <Button size="sm" variant="outline" className="border-white/20 bg-white/5" onClick={()=>{ setIsEditing(false); setDraft(selectedActivity) }}>Abbrechen</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30" onClick={()=> setIsEditing(true)}>Bearbeiten</Button>
                    <Button variant="outline" size="sm" className="border-white/20 bg-white/5" onClick={async ()=>{ await onDuplicateActivity?.(selectedActivity) }}>Duplizieren</Button>
                    <Button size="sm" className="shadow-lg shadow-red-500/20" onClick={async ()=>{ await onDeleteActivity?.(selectedActivity.id); setSelectedActivity(null) }}>Löschen</Button>
                  </>
                )}
              </div>
            </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
