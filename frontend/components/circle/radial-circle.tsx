"use client"

import * as React from "react"
import { getISOWeek } from "date-fns"

export type Activity = {
  id: string
  title: string
  category: string
  status: "PLANNED" | "ACTIVE" | "PAUSED" | "DONE" | "CANCELLED"
  weight: number
  budgetCHF: number
  expectedLeads?: number
  start?: Date
  end?: Date
  ownerId?: string
  owner?: { name: string }
  notes?: string
  // Optional UI-only color (calendar/labels)
  color?: string
  // Optional links into CRM
  companyId?: string
  companyName?: string
  projectId?: string
  projectName?: string
}

export type RadialCircleLabelMode = "auto" | "all" | "smart" | "hover" | "none"
export type RadialCircleConnectionMode = "auto" | "all" | "labeled" | "none"

interface RadialCircleProps {
  activities: Activity[]
  size?: number
  year?: number
  viewStart?: Date
  viewEnd?: Date
  viewLabel?: string
  onActivityClick?: (activity: Activity) => void
  categories?: Array<{ name: string; color: string }>
  onActivityUpdate?: (activityId: string, updates: Partial<Activity>) => void
  labelMode?: RadialCircleLabelMode
  connectionMode?: RadialCircleConnectionMode
  showRangeBadge?: boolean
}

export default function RadialCircle({
  activities,
  size = 600,
  year = new Date().getFullYear(),
  viewStart,
  viewEnd,
  viewLabel,
  onActivityClick,
  categories,
  onActivityUpdate,
  labelMode = "auto",
  connectionMode = "auto",
  showRangeBadge = false,
}: RadialCircleProps) {
  // Responsive render size (fits container; capped by provided size)
  const wrapRef = React.useRef<HTMLDivElement | null>(null)
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  // Month focus ("magnifier"): clicking a month zooms into it
  const [focusedMonthStart, setFocusedMonthStart] = React.useState<Date | null>(null)
  const [renderSize, setRenderSize] = React.useState<number>(size)
  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    // ResizeObserver optional chaining cannot be used with `new`. Use a guard instead.
    const RO = (window as any).ResizeObserver
    const ro = RO ? new RO((entries: any[]) => {
      const w = Math.max(240, Math.floor(entries[0].contentRect.width))
      // Keep the core circle large; side labels can use the extra SVG gutter.
      setRenderSize(Math.min(size, w))
    }) : null
    if (ro) { ro.observe(el); return () => ro.disconnect() }
  }, [size, focusedMonthStart])
  const rs = renderSize
  const isSmall = rs < 520
  const isTiny = rs < 360
  // Make the circle a bit smaller (requested), keep labels inside the square block.
  const circleScale = 0.92
  const circleRs = rs * circleScale
  const scale = circleRs / 700 // baseline tuning
  const sw = (v: number) => Math.max(1, v * Math.max(0.8, scale))
  const fs = (v: number) => Math.max(8, Math.round(v * Math.max(0.85, scale)))

  const radius = circleRs / 2 - (isSmall ? 44 * Math.max(0.9, scale) : 60 * Math.max(0.9, scale))
  // Free margin on each side where focused labels can sit (still inside the same square block).
  const sideGutter = Math.max(0, (rs - circleRs) / 2)
  const cx = rs / 2
  const cy = rs / 2
  const baseViewStart = React.useMemo(() => {
    if (viewStart instanceof Date && !Number.isNaN(viewStart.getTime())) {
      return new Date(viewStart.getFullYear(), viewStart.getMonth(), viewStart.getDate(), 0, 0, 0, 0)
    }
    return new Date(year, 0, 1, 0, 0, 0, 0)
  }, [viewStart, year])

  const baseViewEnd = React.useMemo(() => {
    if (viewEnd instanceof Date && !Number.isNaN(viewEnd.getTime())) {
      return new Date(viewEnd.getFullYear(), viewEnd.getMonth(), viewEnd.getDate(), 23, 59, 59, 999)
    }
    return new Date(year, 11, 31, 23, 59, 59, 999)
  }, [viewEnd, year])

  const focus = React.useMemo(() => {
    if (!(focusedMonthStart instanceof Date) || Number.isNaN(focusedMonthStart.getTime())) return null
    const start = new Date(focusedMonthStart.getFullYear(), focusedMonthStart.getMonth(), 1, 0, 0, 0, 0)
    const end = new Date(focusedMonthStart.getFullYear(), focusedMonthStart.getMonth() + 1, 0, 23, 59, 59, 999)
    const days = new Date(focusedMonthStart.getFullYear(), focusedMonthStart.getMonth() + 1, 0).getDate()
    return { month: focusedMonthStart.getMonth(), start, end, days }
  }, [focusedMonthStart])

  // Normalize category names so lookups are stable regardless of case/whitespace
  const normalizeCategoryName = React.useCallback((name?: string) => String(name ?? "").trim().toUpperCase(), [])

  const monthNamesFull = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  const monthNamesTiny = ['J','F','M','A','M','J','J','A','S','O','N','D']
  const monthNames = isTiny ? monthNamesTiny : monthNamesFull
  const viewRangeMs = Math.max(1, baseViewEnd.getTime() - baseViewStart.getTime())
  const viewRangeDays = Math.max(1, Math.ceil(viewRangeMs / (1000 * 60 * 60 * 24)))
  const viewCenterLabel = React.useMemo(() => {
    if (viewLabel) return viewLabel
    if (baseViewStart.getFullYear() === baseViewEnd.getFullYear() && baseViewStart.getMonth() === 0 && baseViewEnd.getMonth() === 11) {
      return String(baseViewStart.getFullYear())
    }
    return `${monthNamesFull[baseViewStart.getMonth()]} ${baseViewStart.getFullYear()} - ${monthNamesFull[baseViewEnd.getMonth()]} ${baseViewEnd.getFullYear()}`
  }, [baseViewEnd, baseViewStart, monthNamesFull, viewLabel])

  const getAngle = (date?: Date) => {
    if (focus) {
      const base = date ?? focus.start
      const t = base.getTime()
      const clamped = new Date(Math.min(Math.max(t, focus.start.getTime()), focus.end.getTime()))
      const dayFloat =
        (clamped.getDate() - 1) +
        (clamped.getHours() / 24) +
        (clamped.getMinutes() / (24 * 60))
      const frac = Math.min(0.999999, Math.max(0, dayFloat / Math.max(1, focus.days)))
      return frac * Math.PI * 2 - Math.PI / 2
    }
    const d = date ?? baseViewStart
    const t = Math.min(Math.max(d.getTime(), baseViewStart.getTime()), baseViewEnd.getTime())
    const frac = Math.min(0.999999, Math.max(0, (t - baseViewStart.getTime()) / viewRangeMs))
    return frac * Math.PI * 2 - Math.PI / 2
  }

  const angleToDate = (angle: number): Date => {
    // Normalize angle to [0, 2PI)
    let a = angle + Math.PI / 2
    while (a < 0) a += Math.PI * 2
    a = a % (Math.PI * 2)
    const fraction = a / (Math.PI * 2) // 0..1

    if (focus) {
      const days = Math.max(1, focus.days)
      const dayFloat = fraction * days
      const day = Math.max(1, Math.min(days, Math.floor(dayFloat) + 1))
      return new Date(focus.start.getFullYear(), focus.month, day, 9, 0, 0)
    }
    return new Date(baseViewStart.getTime() + fraction * viewRangeMs)
  }

  const renderActivities = React.useMemo(() => {
    const activeStart = focus ? focus.start : baseViewStart
    const activeEnd = focus ? focus.end : baseViewEnd
    const startMs = activeStart.getTime()
    const endMs = activeEnd.getTime()
    return activities.filter((a) => {
      const s = a.start instanceof Date ? a.start.getTime() : NaN
      const e = a.end instanceof Date ? a.end.getTime() : NaN
      if (!Number.isFinite(s)) return false
      if (Number.isFinite(e)) return s <= endMs && e >= startMs
      return s >= startMs && s <= endMs
    })
  }, [activities, baseViewEnd, baseViewStart, focus])

  const monthTicks = React.useMemo(() => {
    if (focus) return [] as Date[]
    const ticks: Date[] = []
    const cursor = new Date(baseViewStart.getFullYear(), baseViewStart.getMonth(), 1, 0, 0, 0, 0)
    const last = new Date(baseViewEnd.getFullYear(), baseViewEnd.getMonth(), 1, 0, 0, 0, 0)
    while (cursor <= last) {
      ticks.push(new Date(cursor))
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return ticks
  }, [baseViewEnd, baseViewStart, focus])

  const weekTicks = React.useMemo(() => {
    if (focus) return [] as Date[]
    const ticks: Date[] = []
    const cursor = new Date(baseViewStart.getFullYear(), baseViewStart.getMonth(), baseViewStart.getDate(), 0, 0, 0, 0)
    while (cursor <= baseViewEnd) {
      ticks.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 7)
    }
    return ticks
  }, [baseViewEnd, baseViewStart, focus])

  const getRangeBadge = React.useCallback((a: Activity) => {
    if (!showRangeBadge) return null
    const s = a.start instanceof Date ? a.start : null
    const e = a.end instanceof Date ? a.end : null
    if (!s || !e) return null
    const sy = s.getFullYear()
    const ey = e.getFullYear()
    if (!Number.isFinite(sy) || !Number.isFinite(ey) || sy === ey) return null
    return `${sy}-${ey}`
  }, [showRangeBadge])

  // Build ring model
  const rings = React.useMemo(() => {
    const fromActivities = Array.from(new Set(activities.map(a => normalizeCategoryName(a.category)))).filter(Boolean).map(key => ({ name: key, nameKey: key, color: undefined as string | undefined }))
    const base = Array.isArray(categories) && categories.length > 0 ? categories.map((c:any)=>({ name: String(c.name), nameKey: normalizeCategoryName(c.name), color: c.color as string | undefined })) : fromActivities
    // ensure unique by normalized key, preserve order
    const seen = new Set<string>()
    const unique = base.filter(c => {
      const key = c.nameKey
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).map((c:any)=>({ name: String(c.name), nameKey: c.nameKey, color: c.color }))
    return unique.slice(0, 5)
  }, [activities, categories, normalizeCategoryName])

  const ringRadiusByCategory: Record<string, number> = {}
  const ringColorByCategory: Record<string, string> = {}
  {
    const ringCount = Math.max(1, rings.length)
    const start = 0.82
    const end = 0.54
    const step = ringCount === 1 ? 0 : (start - end) / (ringCount - 1)
    rings.forEach((ring, i) => {
      const factor = start - i * step
      const r = radius * factor
      ringRadiusByCategory[ring.nameKey] = r
      ringColorByCategory[ring.nameKey] = ring.color || ["#3b82f6", "#a78bfa", "#10b981", "#f59e0b", "#ef4444"][i % 5]
    })
  }

  const defaultRingKey = rings[0]?.nameKey
  const resolveRingKey = React.useCallback((category?: string) => {
    const key = normalizeCategoryName(category)
    if (ringRadiusByCategory[key] !== undefined) return key
    return defaultRingKey ?? key
  }, [defaultRingKey, normalizeCategoryName])

  // --- Anti-overlap ("lanes") within the same category ring ---
  // When many activities sit on the same ring and have close dates, their arcs/dots overlap.
  // We assign a small radial offset per activity (2–3 lanes) to keep the visualization readable.
  const laneOffsetById = React.useMemo(() => {
    const twoPi = Math.PI * 2
    const normAng = (a: number) => {
      let x = a
      while (x < 0) x += twoPi
      return x % twoPi
    }

    const byId: Record<string, number> = {}
    const minSep = focus ? 0.05 : 0.085 // radians; tighter in month-focus
    const laneGap = (focus ? 9 : 11) * Math.max(0.9, scale) // px-ish in our SVG units

    const groups: Record<string, Array<{ id: string; ang: number }>> = {}
    for (const a of renderActivities) {
      const id = a.id
      if (!id) continue
      const ang = normAng(getAngle(a.start))
      const key = resolveRingKey(a.category)
      ;(groups[key] ||= []).push({ id, ang })
    }

    for (const key of Object.keys(groups)) {
      const items = groups[key].sort((x, y) => x.ang - y.ang)
      const lanes = items.length <= 2 ? 1 : items.length <= 8 ? 2 : 3
      const lastAng: number[] = Array.from({ length: lanes }, () => -1e9)
      const laneIdxById: Record<string, number> = {}

      for (const it of items) {
        // Find first lane that is far enough from the last placed item in that lane.
        let chosen = 0
        let bestScore = -1
        for (let li = 0; li < lanes; li++) {
          const prev = lastAng[li]
          const ok = it.ang - prev >= minSep
          const score = ok ? (it.ang - prev) : -1
          if (score > bestScore) {
            bestScore = score
            chosen = li
          }
          if (ok) {
            chosen = li
            break
          }
        }
        laneIdxById[it.id] = chosen
        lastAng[chosen] = it.ang
      }

      for (const it of items) {
        const li = laneIdxById[it.id] ?? 0
        const center = (lanes - 1) / 2
        byId[it.id] = (li - center) * laneGap
      }
    }

    return byId
  }, [focus, getAngle, renderActivities, resolveRingKey, scale])

  // Drag handling for start/end markers with live preview
  const [preview, setPreview] = React.useState<Record<string, { start?: Date; end?: Date }>>({})
  const draggingRef = React.useRef<null | { id: string; handle: 'start' | 'end' }>(null)
  const [popup, setPopup] = React.useState<null | { a: Activity; x: number; y: number; detailed?: boolean }>(null)

  const resolvedLabelMode: RadialCircleLabelMode = React.useMemo(() => {
    if (labelMode !== "auto") return labelMode
    // In month-focus mode we want more labels, but still readable.
    if (focus) {
      if (renderActivities.length <= (isSmall ? 16 : 22)) return "all"
      return "smart"
    }
    if (isTiny) return "hover"
    // If we render many labels, it becomes unreadable very quickly.
    if (renderActivities.length <= (isSmall ? 8 : 12)) return "all"
    if (renderActivities.length <= (isSmall ? 14 : 18)) return "smart"
    return "hover"
  }, [labelMode, focus, renderActivities.length, isTiny, isSmall])

  const truncateLabel = React.useCallback((value: string, max: number) => {
    const s = String(value || "")
    if (s.length <= max) return s
    return s.slice(0, Math.max(0, max - 1)).trimEnd() + "…"
  }, [])

  const wrapLabel = React.useCallback((value: string, maxCharsPerLine: number, maxLines: number) => {
    const raw = String(value || "").replace(/\s+/g, " ").trim()
    if (!raw) return [] as string[]
    const words = raw.split(" ")
    const lines: string[] = []
    let cur = ""

    const pushCur = () => {
      const t = cur.trim()
      if (t) lines.push(t)
      cur = ""
    }

    for (const w0 of words) {
      const w = String(w0 || "").trim()
      if (!w) continue
      const candidate = cur ? `${cur} ${w}` : w
      if (candidate.length <= maxCharsPerLine) {
        cur = candidate
        continue
      }
      // start new line
      pushCur()
      // if a single word is too long, hard-break it
      if (w.length > maxCharsPerLine) {
        cur = w.slice(0, maxCharsPerLine)
        pushCur()
        continue
      }
      cur = w
    }
    pushCur()

    if (lines.length <= maxLines) return lines
    const cut = lines.slice(0, maxLines)
    cut[maxLines - 1] = cut[maxLines - 1].replace(/\s+$/, "").replace(/…?$/, "") + "…"
    return cut
  }, [])

  const labeledIds = React.useMemo(() => {
    const selectedId = popup?.a?.id

    if (resolvedLabelMode === "none") return new Set<string>()
    if (resolvedLabelMode === "all") return new Set<string>(renderActivities.map((a) => a.id))
    if (resolvedLabelMode === "hover") return selectedId ? new Set<string>([selectedId]) : new Set<string>()

    // smart: show only the most important labels + currently selected one
    const max = focus ? (isSmall ? 10 : 14) : (isSmall ? 6 : 10)
    const now = new Date()

    const isOngoing = (a: Activity) => {
      const s = a.start instanceof Date ? a.start : null
      const e = a.end instanceof Date ? a.end : null
      if (!s) return false
      if (e) return s <= now && e >= now
      // Single-date activities are treated as "ongoing" only near today
      const deltaDays = Math.abs(now.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
      return deltaDays <= 7
    }

    const score = (a: Activity) => {
      const budget = Number.isFinite(Number(a.budgetCHF)) ? Number(a.budgetCHF) : 0
      const weight = Number.isFinite(Number(a.weight)) ? Number(a.weight) : 0
      const durDays =
        a.start instanceof Date && a.end instanceof Date
          ? Math.max(0, (a.end.getTime() - a.start.getTime()) / (1000 * 60 * 60 * 24))
          : 0
      const statusBoost = a.status === "ACTIVE" ? 1000 : a.status === "PLANNED" ? 250 : 0
      return statusBoost + Math.min(2000, budget / 10) + Math.min(300, weight * 5) + Math.min(120, durDays)
    }

    const ids = new Set<string>()
    if (selectedId) ids.add(selectedId)

    // Prefer currently ongoing items first
    for (const a of renderActivities) {
      if (ids.size >= max) break
      if (isOngoing(a)) ids.add(a.id)
    }

    // Then fill with high-scoring ones
    const sorted = [...renderActivities].sort((a, b) => score(b) - score(a))
    for (const a of sorted) {
      if (ids.size >= max) break
      ids.add(a.id)
    }
    return ids
  }, [renderActivities, isSmall, focus, popup?.a?.id, resolvedLabelMode])

  const resolvedConnectionMode: RadialCircleConnectionMode = React.useMemo(() => {
    if (connectionMode !== "auto") return connectionMode
    // In month focus mode we draw dedicated label leader lines, so edge-connection lines are noise.
    if (focus) return "none"
    if (renderActivities.length <= 18) return "all"
    // With many items, connection lines are too noisy; keep only for labeled/selected ones.
    return "labeled"
  }, [connectionMode, focus, renderActivities.length])

  const connectionIds = React.useMemo(() => {
    if (resolvedConnectionMode === "none") return new Set<string>()
    if (resolvedConnectionMode === "all") return new Set<string>(renderActivities.map((a) => a.id))
    return labeledIds
  }, [renderActivities, labeledIds, resolvedConnectionMode])

  const getPointerAngle = (e: PointerEvent | MouseEvent): number => {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const px = (e as PointerEvent).clientX - rect.left
    const py = (e as PointerEvent).clientY - rect.top
    const dx = px - cx
    const dy = py - cy
    return Math.atan2(dy, dx)
  }

  const onGlobalMove = (e: PointerEvent) => {
    const drag = draggingRef.current
    if (!drag) return
    const ang = getPointerAngle(e)
    const dt = angleToDate(ang)
    setPreview((prev) => ({
      ...prev,
      [drag.id]: { ...(prev[drag.id] || {}), [drag.handle]: dt },
    }))
  }
  const onGlobalUp = (e: PointerEvent) => {
    const drag = draggingRef.current
    if (!drag) return
    const ang = getPointerAngle(e)
    const dt = angleToDate(ang)
    const id = drag.id
    draggingRef.current = null
    window.removeEventListener('pointermove', onGlobalMove)
    window.removeEventListener('pointerup', onGlobalUp)
    setPreview((prev) => {
      const next = { ...(prev[id] || {}), [drag.handle]: dt }
      const copy = { ...prev, [id]: next }
      // commit
      onActivityUpdate?.(id, { [drag.handle]: dt } as any)
      // clear preview for this id after commit
      const { [id]: _, ...rest } = copy
      return rest
    })
  }
  const startDrag = (id: string, handle: 'start' | 'end') => (e: React.PointerEvent) => {
    e.preventDefault()
    draggingRef.current = { id, handle }
    window.addEventListener('pointermove', onGlobalMove)
    window.addEventListener('pointerup', onGlobalUp)
  }

  const fmt = (d?: Date) => (d ? d.toLocaleDateString?.() : '')
  const popupW = isSmall ? 200 : 220
  const popupH = isSmall ? 100 : 110
  const positionPopupNear = (x: number, y: number, w: number = popupW, h: number = popupH) => {
    // default show above-right
    let px = x + 14
    let py = y - h - 12
    // flip horizontally if overflow
    if (px + w > rs) px = x - w - 14
    if (px < 0) px = 0
    // flip vertically if overflow
    if (py < 0) py = y + 12
    if (py + h > rs) py = rs - h - 4
    return { px, py }
  }

  const getActivityAnchor = React.useCallback((a: Activity) => {
    const startAngle = getAngle(a.start)
    const catKey = resolveRingKey(a.category)
    const baseR = ringRadiusByCategory[catKey] ?? radius * 0.7
    const r = baseR + (laneOffsetById[a.id] ?? 0)
    const x = cx + Math.cos(startAngle) * r
    const y = cy + Math.sin(startAngle) * r
    return { x, y }
  }, [cx, cy, getAngle, laneOffsetById, resolveRingKey, ringRadiusByCategory, radius])

  // (not needed now) convert screen to local SVG coords

  // Label layout for month-focus mode: place labels on the sides with collision avoidance
  type FocusLabelItem = {
    id: string
    a: Activity
    side: "left" | "right"
    x0: number
    y0: number
    x: number
    y: number
    color: string
    lines: string[]
    anchor: "start" | "end"
  }

  const focusLabels: FocusLabelItem[] = (() => {
    if (!focus) return []
    if (resolvedLabelMode === "none") return []

    const labelOffset = (isSmall ? 26 : 34) * Math.max(0.9, scale)
    const minY = 20 * Math.max(0.9, scale)
    const maxY = rs - 20 * Math.max(0.9, scale)
    const fontSize = fs(11)
    const lineH = fontSize * 1.15
    const gap = 10 * Math.max(0.9, scale)
    const maxLabelWidth = Math.max(84, sideGutter - 16) // svg units ~= px here
    const approxCharW = Math.max(6, fontSize * 0.56)
    const maxChars = Math.max(10, Math.floor(maxLabelWidth / approxCharW))

    const items: FocusLabelItem[] = []
    for (const a of renderActivities) {
      if (!labeledIds.has(a.id)) continue

      const start = a.start instanceof Date ? a.start : focus.start
      const ang = getAngle(start)
      const catKey = resolveRingKey(a.category)
      const baseR = ringRadiusByCategory[catKey] ?? radius * 0.7
      const r = baseR + (laneOffsetById[a.id] ?? 0)
      const x0 = cx + Math.cos(ang) * r
      const y0 = cy + Math.sin(ang) * r
      const side: "left" | "right" = x0 >= cx ? "right" : "left"
      const x = cx + (side === "right" ? 1 : -1) * (radius + labelOffset)
      const color = ringColorByCategory[catKey] || "#64748b"
      const lines = wrapLabel(a.title, maxChars, 3)
      items.push({
        id: a.id,
        a,
        side,
        x0,
        y0,
        x,
        y: y0,
        color,
        lines: lines.length ? lines : [truncateLabel(a.title, maxChars)],
        anchor: side === "right" ? "start" : "end",
      })
    }

    const relax = (arr: FocusLabelItem[]) => {
      if (arr.length === 0) return
      // forward pass
      let y = minY
      for (const it of arr) {
        it.y = Math.max(it.y, y)
        const h = Math.max(1, (it.lines?.length || 1)) * lineH
        y = it.y + h + gap
      }
      // if overflow, shift up then backward pass
      const overflow = y - gap - maxY
      if (overflow > 0) {
        for (const it of arr) it.y -= overflow
        let y2 = maxY
        for (let i = arr.length - 1; i >= 0; i--) {
          const h = Math.max(1, (arr[i].lines?.length || 1)) * lineH
          arr[i].y = Math.min(arr[i].y, y2 - h)
          y2 = arr[i].y - gap
          arr[i].y = Math.max(arr[i].y, minY)
        }
      }
    }

    const left = items.filter((i) => i.side === "left").sort((a, b) => a.y - b.y)
    const right = items.filter((i) => i.side === "right").sort((a, b) => a.y - b.y)
    relax(left)
    relax(right)
    return [...left, ...right]
  })()

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: size,
        aspectRatio: "1 / 1",
        margin: "0 auto",
        overflow: "visible",
      }}
    >
      {focus && (
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 5 }}>
          <button
            type="button"
            className="pointer-events-auto rounded-lg border border-white/15 bg-slate-900/70 px-2 py-1 text-[11px] font-semibold text-slate-100 hover:bg-slate-900/90"
            onClick={() => {
              setFocusedMonthStart(null)
              setPopup(null)
            }}
          >
            ← Zeitraum
          </button>
        </div>
      )}
      <svg
        ref={svgRef}
        width={rs}
        height={rs}
        viewBox={`0 0 ${rs} ${rs}`}
        style={{
          overflow: "visible",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPopup(null)
        }}
      >
      <defs>
        {/* Glow filters for activity dots */}
        {rings.map((ring) => (
          <filter key={`glow-${ring.nameKey}`} id={`glow-${ring.nameKey}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        ))}
      </defs>

      {/* Background circle with subtle gradient */}
      <circle cx={cx} cy={cy} r={radius} fill="#0a0f1e" stroke="#1e293b" strokeWidth={sw(2)} />

      {/* User-category rings (up to 5) */}
      {rings.map((ring, i) => {
        const ringR = ringRadiusByCategory[ring.nameKey]
        const color = ringColorByCategory[ring.nameKey]
        const fontSize = fs(11)
        const lineH = fontSize * 1.15
        // Keep these labels compact; they are "category names" not activity titles.
        const maxChars = isSmall ? 12 : 16
        const lines = wrapLabel(ring.name, maxChars, 2)

        // Spread labels around the top arc to avoid overlaps.
        // Angles are centered around "12 o'clock" with a small fixed step.
        const n = Math.max(1, rings.length)
        const step = 0.22 // ~12.6deg
        const base = -Math.PI / 2 - (n - 1) * step * 0.5
        const ang = base + i * step
        const labelRad = ringR + 12 * scale
        const lx = cx + Math.cos(ang) * labelRad
        const ly = cy + Math.sin(ang) * labelRad
        const anchor: "start" | "end" | "middle" =
          Math.abs(Math.cos(ang)) < 0.15 ? "middle" : Math.cos(ang) >= 0 ? "start" : "end"
        return (
          <g key={`ring-${ring.name}`}>
            <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={color} strokeWidth={sw(1.5)} opacity={0.35} />
            {/* Ring labels are too noisy on mobile; use the legend outside the circle instead */}
            {!isSmall && (
              <text
                x={lx}
                y={ly}
                fontSize={fontSize}
                fill={color}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontWeight="700"
                style={{
                  pointerEvents: "none",
                  paintOrder: "stroke",
                  stroke: "rgba(2, 6, 23, 0.92)",
                  strokeWidth: sw(4),
                }}
              >
                {lines.length > 0
                  ? lines.map((t, idx) => (
                      <tspan
                        key={idx}
                        x={lx}
                        dy={idx === 0 ? -((lines.length - 1) * lineH) / 2 : lineH}
                      >
                        {t}
                      </tspan>
                    ))
                  : ring.name}
              </text>
            )}
          </g>
        )
      })}

      {/* Month ticks and labels (click a month to zoom) */}
      {!focus && monthTicks.map((monthDate, i) => {
        const angle = getAngle(monthDate)
        // Outer tick
        const x1 = cx + Math.cos(angle) * (radius - 10 * scale)
        const y1 = cy + Math.sin(angle) * (radius - 10 * scale)
        const x2 = cx + Math.cos(angle) * radius
        const y2 = cy + Math.sin(angle) * radius
        // Label position
        const labelX = cx + Math.cos(angle) * (radius + 18 * scale)
        const labelY = cy + Math.sin(angle) * (radius + 18 * scale)
        const monthCount = monthTicks.length
        const showLabel =
          monthCount <= 12 ||
          i === 0 ||
          i === monthCount - 1 ||
          monthDate.getMonth() === 0 ||
          (monthCount <= 24 ? i % 2 === 0 : i % 3 === 0)
        const isYearBreak = i === 0 || monthDate.getMonth() === 0
        const monthLabel = monthCount <= 12
          ? monthNames[monthDate.getMonth()]
          : `${monthNames[monthDate.getMonth()]}${isYearBreak ? ` ${String(monthDate.getFullYear()).slice(-2)}` : ""}`

        return (
          <g key={monthDate.toISOString()}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth={sw(2)} />
            {showLabel && (
              <text
                x={labelX}
                y={labelY}
                fontSize={fs(monthCount <= 12 ? 12 : 10)}
                fill="#94a3b8"
                textAnchor="middle"
                dominantBaseline="middle"
                fontWeight="600"
                style={{ cursor: "zoom-in", userSelect: "none" }}
                onClick={() => {
                  setFocusedMonthStart(new Date(monthDate))
                  setPopup(null)
                }}
              >
                {monthLabel}
              </text>
            )}
          </g>
        )
      })}

      {/* Day ticks for focused month */}
      {focus && Array.from({ length: focus.days }).map((_, idx) => {
        const day = idx + 1
        const angle = (idx / Math.max(1, focus.days)) * Math.PI * 2 - Math.PI / 2
        const inner = radius - 10 * scale
        const outer = radius
        const x1 = cx + Math.cos(angle) * inner
        const y1 = cy + Math.sin(angle) * inner
        const x2 = cx + Math.cos(angle) * outer
        const y2 = cy + Math.sin(angle) * outer

        const showLabel = day === 1 || day === focus.days || day % 7 === 1
        const labelX = cx + Math.cos(angle) * (radius + 18 * scale)
        const labelY = cy + Math.sin(angle) * (radius + 18 * scale)

        return (
          <g key={`day-${day}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth={sw(1)} opacity={0.7} />
            {showLabel && (
              <text
                x={labelX}
                y={labelY}
                fontSize={fs(10)}
                fill="#94a3b8"
                textAnchor="middle"
                dominantBaseline="middle"
                fontWeight="600"
              >
                {day}
              </text>
            )}
          </g>
        )
      })}

      {/* Week ticks and sparse labels (KW) */}
      {!focus && weekTicks.map((weekDate, i) => {
        const w = getISOWeek(weekDate)
        const angle = getAngle(weekDate)
        const inner = radius - 16 * scale
        const outer = radius - 10 * scale
        const x1 = cx + Math.cos(angle) * inner
        const y1 = cy + Math.sin(angle) * inner
        const x2 = cx + Math.cos(angle) * outer
        const y2 = cy + Math.sin(angle) * outer
        // Reduce visual noise on small screens
        const step = viewRangeDays <= 370 ? (isTiny ? 14 : isSmall ? 10 : 4) : viewRangeDays <= 740 ? 8 : 12
        const showLabel = i === 0 || i === weekTicks.length - 1 || i % step === 0
        const lx = cx + Math.cos(angle) * (radius - 30 * scale)
        const ly = cy + Math.sin(angle) * (radius - 30 * scale)
        return (
          <g key={`kw-${weekDate.toISOString()}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth={sw(1)} opacity={0.6} />
            {showLabel && !isTiny && (
              <text 
                x={lx} 
                y={ly} 
                fontSize={fs(9)} 
                fill="#64748b" 
                textAnchor="middle" 
                dominantBaseline="middle"
              >
                {`KW${String(w).padStart(2,'0')}`}
              </text>
            )}
          </g>
        )
      })}

      {/* Connection lines from activities to circle edge */}
      {renderActivities.filter((a) => connectionIds.has(a.id)).map((a) => {
        const angle = getAngle(a.start)
        const catKey = resolveRingKey(a.category)
        const baseR = ringRadiusByCategory[catKey] ?? radius * 0.7
        const r = baseR + (laneOffsetById[a.id] ?? 0)
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        const edgeX = cx + Math.cos(angle) * radius
        const edgeY = cy + Math.sin(angle) * radius
        const color = ringColorByCategory[catKey] || "#64748b"
        
        return (
          <line 
            key={`line-${a.id}`}
            x1={x}
            y1={y}
            x2={edgeX}
            y2={edgeY}
            stroke={color}
            strokeWidth={sw(1.5)}
            strokeDasharray="3 3"
            opacity={0.35}
          />
        )
      })}

      {/* Activity dots and ranges aligned to category ring */}
      {renderActivities.map((a) => {
        const sourceStart = a.start instanceof Date ? a.start : undefined
        const sourceEnd = a.end instanceof Date ? a.end : undefined
        const activeRangeStart = focus ? focus.start : baseViewStart
        const activeRangeEnd = focus ? focus.end : baseViewEnd
        const displayStart = sourceStart ? new Date(Math.max(sourceStart.getTime(), activeRangeStart.getTime())) : undefined
        const displayEnd = sourceEnd ? new Date(Math.min(sourceEnd.getTime(), activeRangeEnd.getTime())) : undefined
        const startAngle = getAngle(displayStart ?? sourceStart)
        const catKey = resolveRingKey(a.category)
        const baseR = ringRadiusByCategory[catKey] ?? radius * 0.7
        const r = baseR + (laneOffsetById[a.id] ?? 0)
        const x = cx + Math.cos(startAngle) * r
        const y = cy + Math.sin(startAngle) * r
        const color = ringColorByCategory[catKey] || "#64748b"

        const showLabel = labeledIds.has(a.id)
        const labelR = 18 * scale
        const lx = x + Math.cos(startAngle) * labelR
        const ly = y + Math.sin(startAngle) * labelR
        const anchor: "start" | "end" = Math.cos(startAngle) >= 0 ? "start" : "end"

        // Keep labels inside the circle block: compute an approximate available width and truncate accordingly.
        const labelFont = fs(resolvedLabelMode === "all" ? 11 : 10)
        const approxCharW = Math.max(6, labelFont * 0.56)
        const pad = 12 * Math.max(0.9, scale)
        const available = anchor === "start" ? Math.max(0, rs - lx - pad) : Math.max(0, lx - pad)
        const maxByWidth = Math.max(6, Math.floor(available / approxCharW))
        const baseMax = resolvedLabelMode === "all" ? (isSmall ? 26 : 34) : (isSmall ? 18 : 26)
        const labelMax = Math.max(6, Math.min(baseMax, maxByWidth))
        const labelText = truncateLabel(a.title, labelMax)
        
        // If activity has end date, draw an arc segment to represent duration
        const endAngle = displayEnd ? getAngle(displayEnd) : null
        const hasRange = displayStart != null && displayEnd != null && displayEnd.getTime() >= displayStart.getTime()

        return (
          <g 
            key={a.id} 
            onClick={(e) => {
              e.stopPropagation()
              onActivityClick?.(a)
              // compute local SVG coords from event target position (cx, cy used for circle center)
              const { px, py } = positionPopupNear(x, y, popupW, popupH)
              setPopup({ a, x: px, y: py, detailed: false })
            }}
            cursor="pointer"
            className="activity-dot"
          >
            <title>{a.title}</title>
            {hasRange && (
              (() => {
                // Build arc path from start -> end (always forward in time, may wrap year)
                const normalize = (ang: number) => {
                  let a = ang
                  while (a < 0) a += Math.PI * 2
                  return a % (Math.PI * 2)
                }
                const a1 = normalize(startAngle)
                const a2 = normalize(endAngle!)
                let delta = a2 - a1
                if (delta < 0) delta += Math.PI * 2
                // If wrap is needed and long segment, split into two arcs to respect SVG elliptical-arc behavior
                const buildArc = (angStart: number, angEnd: number) => {
                  const largeArc = (Math.abs(angEnd - angStart) % (Math.PI * 2)) > Math.PI ? 1 : 0
                  const sx = cx + Math.cos(angStart) * r
                  const sy = cy + Math.sin(angStart) * r
                  const ex = cx + Math.cos(angEnd) * r
                  const ey = cy + Math.sin(angEnd) * r
                  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`
                }
                const path = a2 >= a1
                  ? buildArc(a1, a2)
                  : `${buildArc(a1, Math.PI * 2 - 0.0001)} ${buildArc(0, a2)}`
                return (
                  <g>
                    <path d={path} stroke={color} strokeWidth={sw(14)} opacity={0.08} fill="none" strokeLinecap="round" />
                    <path d={path} stroke={color} strokeWidth={sw(8)} opacity={0.18} fill="none" strokeLinecap="round" />
                    <path d={path} stroke={color} strokeWidth={sw(3)} opacity={0.85} fill="none" strokeLinecap="round" />
                  </g>
                )
              })()
            )}
            {/* Start marker (draggable) */}
            <g>
              {/* soft halo */}
                  <circle cx={x} cy={y} r={sw(11)} fill={color} opacity={0.12} />
              {/* ring accent */}
              <circle cx={x} cy={y} r={sw(9)} fill="none" stroke={color} strokeOpacity={0.6} strokeWidth={sw(1.5)} />
              {/* core dot */}
              <circle cx={x} cy={y} r={sw(6)} fill={color} stroke="#0f172a" strokeWidth={sw(2)} filter={`url(#glow-${catKey})`} onPointerDown={startDrag(a.id, 'start')} >
                <title>{`Start: ${a.start ? a.start.toLocaleDateString?.() : ''}`}</title>
              </circle>
              {/* tiny outer cap dot */}
              {hasRange && (
                (() => {
                  const capX = cx + Math.cos(startAngle) * (r + 10 * scale)
                  const capY = cy + Math.sin(startAngle) * (r + 10 * scale)
                  return <circle cx={capX} cy={capY} r={sw(3)} fill={color} opacity={0.35} />
                })()
              )}
            </g>

            {/* End marker (draggable if hasRange) */}
            {hasRange && (() => {
              const ex = cx + Math.cos(endAngle!) * r
              const ey = cy + Math.sin(endAngle!) * r
              return (
                <g>
                  {/* soft halo */}
                  <circle cx={ex} cy={ey} r={sw(11)} fill={color} opacity={0.1} />
                  {/* ring (hole) */}
                  <circle cx={ex} cy={ey} r={sw(6)} fill="#0f172a" stroke={color} strokeWidth={sw(2)} opacity={0.95} onPointerDown={startDrag(a.id, 'end')} >
                    <title>{`Ende: ${a.end ? a.end.toLocaleDateString?.() : ''}`}</title>
                  </circle>
                  {/* tiny outer cap dot */}
                  {(() => {
                    const capX = cx + Math.cos(endAngle!) * (r + 10 * scale)
                    const capY = cy + Math.sin(endAngle!) * (r + 10 * scale)
                    return <circle cx={capX} cy={capY} r={sw(3)} fill={color} opacity={0.35} />
                  })()}
                </g>
              )
            })()}
            {!focus && showLabel && (
              <text
                x={lx}
                y={ly}
                fontSize={labelFont}
                fill="#e2e8f0"
                fontWeight="600"
                textAnchor={anchor}
                dominantBaseline="middle"
                style={{
                  pointerEvents: "none",
                  paintOrder: "stroke",
                  stroke: "rgba(2, 6, 23, 0.9)",
                  strokeWidth: sw(4),
                }}
              >
                {labelText}
              </text>
            )}
          </g>
        )
      })}

      {/* Focused-month label layout */}
      {focus && resolvedLabelMode !== "none" && focusLabels.length > 0 && (
        <g>
          {focusLabels.map((l) => {
            const sign = l.side === "right" ? 1 : -1
            const elbowX = cx + sign * (radius + 10 * scale)
            const textX = l.x + sign * (6 * Math.max(0.9, scale))
            const fontSize = fs(11)
            const lineH = fontSize * 1.15
            const lines = (l.lines && l.lines.length ? l.lines : [""]) as string[]
            const startY = l.y - ((lines.length - 1) * lineH) / 2
            return (
              <g
                key={`lbl-${l.id}`}
                cursor="pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onActivityClick?.(l.a)
                  const pos = positionPopupNear(l.x0, l.y0, popupW, popupH)
                  setPopup({ a: l.a, x: pos.px, y: pos.py, detailed: false })
                }}
              >
                <polyline
                  points={`${l.x0},${l.y0} ${elbowX},${l.y0} ${l.x},${l.y}`}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={sw(1.5)}
                  opacity={0.5}
                />
                <text
                  x={textX}
                  y={startY}
                  fontSize={fontSize}
                  fill="#e2e8f0"
                  fontWeight="700"
                  textAnchor={l.anchor}
                  dominantBaseline="hanging"
                  style={{
                    paintOrder: "stroke",
                    stroke: "rgba(2, 6, 23, 0.92)",
                    strokeWidth: sw(4),
                  }}
                >
                  {lines.map((t, idx) => (
                    <tspan key={idx} x={textX} dy={idx === 0 ? 0 : lineH}>
                      {t}
                    </tspan>
                  ))}
                </text>
              </g>
            )
          })}
        </g>
      )}


      {/* Center label */}
      <text
        x={cx}
        y={cy}
        fontSize={fs(focus ? 20 : 24)}
        fill="#64748b"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="300"
        style={focus ? { cursor: "zoom-out", userSelect: "none" } : { userSelect: "none" }}
        onClick={() => {
          if (!focus) return
          setFocusedMonthStart(null)
          setPopup(null)
        }}
      >
        {focus ? `${monthNamesFull[focus.month]} ${focus.start.getFullYear()}` : viewCenterLabel}
      </text>
      {focus && (
        <text
          x={cx}
          y={cy + 22 * Math.max(0.9, scale)}
          fontSize={fs(11)}
          fill="#94a3b8"
          textAnchor="middle"
          dominantBaseline="middle"
          fontWeight="600"
          style={{ userSelect: "none" }}
        >
          Zurück zum Zeitraum
        </text>
      )}
      </svg>
      {/* Inline light popup near the clicked activity (HTML overlay, sibling of SVG) */}
      {popup && (
        (() => {
          const isDetailed = Boolean(popup.detailed)
          const rangeBadge = getRangeBadge(popup.a)
          const w = isDetailed ? Math.min(340, rs - 24) : popupW
          const h = isDetailed ? Math.min(260, rs - 24) : popupH
          return (
            <div style={{ position: 'absolute', left: popup.x, top: popup.y, width: w, height: h }} onClick={(e)=> e.stopPropagation()}>
              <div className="pointer-events-auto select-none rounded-xl border border-white/15 bg-slate-900/90 text-slate-100 shadow-xl backdrop-blur-md p-3 text-[11px]">
                {/* Title */}
                <div className="font-semibold text-xs mb-1 truncate" title={popup.a.title}>{popup.a.title}</div>
                {rangeBadge && (
                  <div className="mb-2 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                    {rangeBadge}
                  </div>
                )}
                {/* Summary rows when compact */}
                {!isDetailed && (
                  <>
                    <div className="opacity-80">Kategorie: <span style={{color: ringColorByCategory[resolveRingKey(popup.a.category)]}}>{popup.a.category}</span></div>
                    <div className="opacity-80">Start: {fmt(popup.a.start)}</div>
                    {popup.a.end && <div className="opacity-80">Ende: {fmt(popup.a.end)}</div>}
                    {popup.a.notes && <div className="opacity-80 line-clamp-2 mt-1">{popup.a.notes}</div>}
                  </>
                )}
                {/* Detailed view */}
                {isDetailed && (
                  <div className="space-y-1 text-[11px]">
                    <div className="opacity-80">ID: <span className="opacity-100">{popup.a.id}</span></div>
                    {rangeBadge && <div className="opacity-80">Zeitraum: <span className="opacity-100">{rangeBadge}</span></div>}
                    <div className="opacity-80">Kategorie: <span style={{color: ringColorByCategory[resolveRingKey(popup.a.category)]}}>{popup.a.category}</span></div>
                    <div className="opacity-80">Status: <span className="opacity-100">{popup.a.status}</span></div>
                    <div className="opacity-80">Start: <span className="opacity-100">{popup.a.start?.toLocaleString?.()}</span></div>
                    {popup.a.end && <div className="opacity-80">Ende: <span className="opacity-100">{popup.a.end?.toLocaleString?.()}</span></div>}
                    {(popup.a.start && popup.a.end) && (
                      <div className="opacity-80">
                        Dauer: <span className="opacity-100">{Math.max(0, Math.round(((popup.a.end!.getTime() - popup.a.start!.getTime()) / (1000*60*60*24))))} Tage</span>
                      </div>
                    )}
                    {typeof popup.a.budgetCHF === 'number' && <div className="opacity-80">Budget: <span className="opacity-100">CHF {popup.a.budgetCHF}</span></div>}
                    {typeof popup.a.expectedLeads === 'number' && <div className="opacity-80">Expected Leads: <span className="opacity-100">{popup.a.expectedLeads}</span></div>}
                    {popup.a.owner?.name && <div className="opacity-80">Owner: <span className="opacity-100">{popup.a.owner.name}</span></div>}
                    {popup.a.notes && (
                      <div className="opacity-80 mt-1">
                        Notizen:
                        <div className="mt-1 max-h-32 overflow-auto pr-1 text-slate-300">{popup.a.notes}</div>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {!isDetailed && (
                    <button
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/15"
                      onClick={() => {
                        const anchor = getActivityAnchor(popup.a)
                        const pos = positionPopupNear(anchor.x, anchor.y, 340, 260)
                        setPopup(prev => prev ? { ...prev, ...pos, detailed: true } : prev)
                      }}
                    >Mehr Details</button>
                  )}
                  {isDetailed && (
                    <button
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/15"
                      onClick={() => {
                        const anchor = getActivityAnchor(popup.a)
                        const pos = positionPopupNear(anchor.x, anchor.y, popupW, popupH)
                        setPopup(prev => prev ? { ...prev, ...pos, detailed: false } : prev)
                      }}
                    >Weniger</button>
                  )}
                  <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/15" onClick={()=>setPopup(null)}>Schließen</button>
                </div>
              </div>
            </div>
          )
        })()
      )}
    </div>
  )
}

export function RadialCirclePanel({
  selectedYear = new Date().getFullYear(),
}: { selectedYear?: number }) {
  return (
    <div className="flex items-center gap-4 text-sm text-slate-300">
      <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700">Jahr: {selectedYear}</div>
      <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700">Zoom: 1x</div>
      <div className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700">Filter: Alle</div>
    </div>
  )
}



