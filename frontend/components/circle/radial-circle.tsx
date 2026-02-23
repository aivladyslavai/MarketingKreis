"use client"

import * as React from "react"
import { getISOWeeksInYear } from "date-fns"

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
  onActivityClick?: (activity: Activity) => void
  categories?: Array<{ name: string; color: string }>
  onActivityUpdate?: (activityId: string, updates: Partial<Activity>) => void
  labelMode?: RadialCircleLabelMode
  connectionMode?: RadialCircleConnectionMode
}

export default function RadialCircle({
  activities,
  size = 600,
  year = new Date().getFullYear(),
  onActivityClick,
  categories,
  onActivityUpdate,
  labelMode = "auto",
  connectionMode = "auto",
}: RadialCircleProps) {
  // Responsive render size (fits container; capped by provided size)
  const wrapRef = React.useRef<HTMLDivElement | null>(null)
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const [renderSize, setRenderSize] = React.useState<number>(size)
  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    // ResizeObserver optional chaining cannot be used with `new`. Use a guard instead.
    const RO = (window as any).ResizeObserver
    const ro = RO ? new RO((entries: any[]) => {
      const w = Math.max(240, Math.floor(entries[0].contentRect.width))
      setRenderSize(Math.min(size, w))
    }) : null
    if (ro) { ro.observe(el); return () => ro.disconnect() }
  }, [size])
  const rs = renderSize
  const isSmall = rs < 520
  const isTiny = rs < 360
  const scale = rs / 700 // baseline tuning
  const sw = (v: number) => Math.max(1, v * Math.max(0.8, scale))
  const fs = (v: number) => Math.max(8, Math.round(v * Math.max(0.85, scale)))

  // Reserve "gutter" space for labels so they never get clipped by the card/container.
  // (We keep labels within the SVG viewBox instead of overflowing outside.)
  const labelGutter = (isTiny ? 78 : isSmall ? 120 : 170) * Math.max(0.9, scale)
  const radius = rs / 2 - labelGutter
  const center = rs / 2
  const months = 12

  // Month focus ("magnifier"): clicking a month zooms into it
  const [focusedMonth, setFocusedMonth] = React.useState<number | null>(null)
  const focus = React.useMemo(() => {
    if (focusedMonth == null) return null
    const start = new Date(year, focusedMonth, 1, 0, 0, 0, 0)
    const end = new Date(year, focusedMonth + 1, 0, 23, 59, 59, 999)
    const days = new Date(year, focusedMonth + 1, 0).getDate()
    return { month: focusedMonth, start, end, days }
  }, [focusedMonth, year])

  // Normalize category names so lookups are stable regardless of case/whitespace
  const normalizeCategoryName = React.useCallback((name?: string) => String(name ?? "").trim().toUpperCase(), [])

  const monthNamesFull = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  const monthNamesTiny = ['J','F','M','A','M','J','J','A','S','O','N','D']
  const monthNames = isTiny ? monthNamesTiny : monthNamesFull
  const weeksInYear = getISOWeeksInYear(new Date(year, 0, 4))

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
    const d = date ?? new Date()
    const m = d.getMonth() + d.getDate() / 30
    return (m / months) * Math.PI * 2 - Math.PI / 2
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
      return new Date(year, focus.month, day, 9, 0, 0)
    }

    const monthFloat = fraction * 12
    const month = Math.floor(monthFloat)
    const monthFrac = monthFloat - month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const day = Math.max(1, Math.min(daysInMonth, Math.round(monthFrac * (daysInMonth - 1)) + 1))
    return new Date(year, month, day, 9, 0, 0)
  }

  const renderActivities = React.useMemo(() => {
    if (!focus) return activities
    const startMs = focus.start.getTime()
    const endMs = focus.end.getTime()
    return activities.filter((a) => {
      const s = a.start instanceof Date ? a.start.getTime() : NaN
      const e = a.end instanceof Date ? a.end.getTime() : NaN
      if (!Number.isFinite(s)) return false
      if (Number.isFinite(e)) return s <= endMs && e >= startMs
      return s >= startMs && s <= endMs
    })
  }, [activities, focus])

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

  const wrapLabel = React.useCallback((text: string, opts: { maxChars: number; maxLines: number }) => {
    const raw = String(text || "").trim()
    if (!raw) return [""]
    const words = raw.split(/\s+/g)
    const lines: string[] = []
    let line = ""
    const push = () => {
      if (line.trim()) lines.push(line.trim())
      line = ""
    }
    const addWord = (w: string) => {
      const candidate = line ? `${line} ${w}` : w
      if (candidate.length <= opts.maxChars) {
        line = candidate
        return
      }
      if (!line) {
        // single very long token: hard cut
        lines.push(w.slice(0, Math.max(1, opts.maxChars - 1)) + "…")
        return
      }
      push()
      if (w.length <= opts.maxChars) {
        line = w
      } else {
        lines.push(w.slice(0, Math.max(1, opts.maxChars - 1)) + "…")
      }
    }
    for (const w of words) {
      if (lines.length >= opts.maxLines) break
      addWord(w)
    }
    push()
    // clamp lines count with ellipsis if needed
    if (lines.length > opts.maxLines) lines.length = opts.maxLines
    if (lines.length === opts.maxLines && words.join(" ").length > lines.join(" ").length) {
      const last = lines[lines.length - 1] || ""
      if (!last.endsWith("…")) lines[lines.length - 1] = last.slice(0, Math.max(1, opts.maxChars - 1)).trimEnd() + "…"
    }
    return lines.slice(0, Math.max(1, opts.maxLines))
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
    const dx = px - center
    const dy = py - center
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
    const r = ringRadiusByCategory[catKey] ?? radius * 0.7
    const x = center + Math.cos(startAngle) * r
    const y = center + Math.sin(startAngle) * r
    return { x, y }
  }, [center, resolveRingKey, ringRadiusByCategory])

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
    text: string
    anchor: "start" | "end"
  }

  const focusLabels: FocusLabelItem[] = (() => {
    if (!focus) return []
    if (resolvedLabelMode === "none") return []

    const labelOffset = (isSmall ? 26 : 34) * Math.max(0.9, scale)
    const minY = 20 * Math.max(0.9, scale)
    const maxY = rs - 20 * Math.max(0.9, scale)
    const spacing = 16 * Math.max(0.9, scale)

    const items: FocusLabelItem[] = []
    for (const a of renderActivities) {
      if (!labeledIds.has(a.id)) continue

      const start = a.start instanceof Date ? a.start : focus.start
      const ang = getAngle(start)
      const catKey = resolveRingKey(a.category)
      const r = ringRadiusByCategory[catKey] ?? radius * 0.7
      const x0 = center + Math.cos(ang) * r
      const y0 = center + Math.sin(ang) * r
      const side: "left" | "right" = x0 >= center ? "right" : "left"
      const x = center + (side === "right" ? 1 : -1) * (radius + labelOffset)
      const color = ringColorByCategory[catKey] || "#64748b"
      const text = truncateLabel(a.title, isSmall ? 24 : 32)
      items.push({
        id: a.id,
        a,
        side,
        x0,
        y0,
        x,
        y: y0,
        color,
        text,
        anchor: side === "right" ? "start" : "end",
      })
    }

    const relax = (arr: FocusLabelItem[]) => {
      if (arr.length === 0) return
      // forward pass
      let y = minY
      for (const it of arr) {
        it.y = Math.max(it.y, y)
        y = it.y + spacing
      }
      // if overflow, shift up then backward pass
      const overflow = y - spacing - maxY
      if (overflow > 0) {
        for (const it of arr) it.y -= overflow
        let y2 = maxY
        for (let i = arr.length - 1; i >= 0; i--) {
          arr[i].y = Math.min(arr[i].y, y2)
          y2 = arr[i].y - spacing
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
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', maxWidth: size, aspectRatio: '1 / 1', margin: '0 auto' }}>
      {focus && (
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 5 }}>
          <button
            type="button"
            className="pointer-events-auto rounded-lg border border-white/15 bg-slate-900/70 px-2 py-1 text-[11px] font-semibold text-slate-100 hover:bg-slate-900/90"
            onClick={() => {
              setFocusedMonth(null)
              setPopup(null)
            }}
          >
            ← Jahr
          </button>
        </div>
      )}
      <svg ref={svgRef} width={rs} height={rs} viewBox={`0 0 ${rs} ${rs}`} style={{ overflow: 'visible', position: 'absolute', inset: 0 }} onClick={(e)=>{ if (e.target === e.currentTarget) setPopup(null) }}>
      <defs>
        {/* Glow filters for activity dots */}
        {rings.map((ring, i) => (
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
      <circle cx={center} cy={center} r={radius} fill="#0a0f1e" stroke="#1e293b" strokeWidth={sw(2)} />

      {/* User-category rings (up to 5) */}
      {rings.map((ring, i) => {
        const ringR = ringRadiusByCategory[ring.nameKey]
        const color = ringColorByCategory[ring.nameKey]
        return (
          <g key={`ring-${ring.name}`}>
            <circle cx={center} cy={center} r={ringR} fill="none" stroke={color} strokeWidth={sw(1.5)} opacity={0.35} />
            {/* Ring labels are too noisy on mobile; use the legend outside the circle instead */}
            {!isSmall && (
              <text
                x={center}
                y={center - ringR - 12 * scale}
                fontSize={fs(11)}
                fill={color}
                textAnchor="middle"
                dominantBaseline="middle"
                fontWeight="600"
              >
                {ring.name}
              </text>
            )}
          </g>
        )
      })}

      {/* Month ticks and labels (click a month to zoom) */}
      {!focus && Array.from({ length: months }).map((_, i) => {
        const angle = (i / months) * Math.PI * 2 - Math.PI / 2
        // Outer tick
        const x1 = center + Math.cos(angle) * (radius - 10 * scale)
        const y1 = center + Math.sin(angle) * (radius - 10 * scale)
        const x2 = center + Math.cos(angle) * radius
        const y2 = center + Math.sin(angle) * radius
        // Label position
        const labelX = center + Math.cos(angle) * (radius + 18 * scale)
        const labelY = center + Math.sin(angle) * (radius + 18 * scale)

        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth={sw(2)} />
            <text
              x={labelX}
              y={labelY}
              fontSize={fs(12)}
              fill="#94a3b8"
              textAnchor="middle"
              dominantBaseline="middle"
              fontWeight="600"
              style={{ cursor: "zoom-in", userSelect: "none" }}
              onClick={() => {
                setFocusedMonth(i)
                setPopup(null)
              }}
            >
              {monthNames[i]}
            </text>
          </g>
        )
      })}

      {/* Day ticks for focused month */}
      {focus && Array.from({ length: focus.days }).map((_, idx) => {
        const day = idx + 1
        const angle = (idx / Math.max(1, focus.days)) * Math.PI * 2 - Math.PI / 2
        const inner = radius - 10 * scale
        const outer = radius
        const x1 = center + Math.cos(angle) * inner
        const y1 = center + Math.sin(angle) * inner
        const x2 = center + Math.cos(angle) * outer
        const y2 = center + Math.sin(angle) * outer

        const showLabel = day === 1 || day === focus.days || day % 7 === 1
        const labelX = center + Math.cos(angle) * (radius + 18 * scale)
        const labelY = center + Math.sin(angle) * (radius + 18 * scale)

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
      {!focus && Array.from({ length: weeksInYear }).map((_, i) => {
        const w = i + 1
        const angle = (w / weeksInYear) * Math.PI * 2 - Math.PI / 2
        const inner = radius - 16 * scale
        const outer = radius - 10 * scale
        const x1 = center + Math.cos(angle) * inner
        const y1 = center + Math.sin(angle) * inner
        const x2 = center + Math.cos(angle) * outer
        const y2 = center + Math.sin(angle) * outer
        // Reduce visual noise on small screens
        const step = isTiny ? 14 : isSmall ? 10 : 4
        const showLabel = w === 1 || w % step === 1
        const lx = center + Math.cos(angle) * (radius - 30 * scale)
        const ly = center + Math.sin(angle) * (radius - 30 * scale)
        return (
          <g key={`kw-${w}`}>
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
        const r = ringRadiusByCategory[catKey] ?? radius * 0.7
        const x = center + Math.cos(angle) * r
        const y = center + Math.sin(angle) * r
        const edgeX = center + Math.cos(angle) * radius
        const edgeY = center + Math.sin(angle) * radius
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
        const startAngle = getAngle(a.start)
        const catKey = resolveRingKey(a.category)
        const r = ringRadiusByCategory[catKey] ?? radius * 0.7
        const x = center + Math.cos(startAngle) * r
        const y = center + Math.sin(startAngle) * r
        const color = ringColorByCategory[catKey] || "#64748b"

        const showLabel = labeledIds.has(a.id)
        const labelText = resolvedLabelMode === "all"
          ? a.title
          : truncateLabel(a.title, isSmall ? 18 : 26)
        const labelR = 18 * scale
        const lx = x + Math.cos(startAngle) * labelR
        const ly = y + Math.sin(startAngle) * labelR
        const anchor: "start" | "end" = Math.cos(startAngle) >= 0 ? "start" : "end"
        
        // If activity has end date, draw an arc segment to represent duration
        const endAngle = a.end ? getAngle(a.end) : null
        const hasRange = a.end != null

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
                  const sx = center + Math.cos(angStart) * r
                  const sy = center + Math.sin(angStart) * r
                  const ex = center + Math.cos(angEnd) * r
                  const ey = center + Math.sin(angEnd) * r
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
                  const capX = center + Math.cos(startAngle) * (r + 10 * scale)
                  const capY = center + Math.sin(startAngle) * (r + 10 * scale)
                  return <circle cx={capX} cy={capY} r={sw(3)} fill={color} opacity={0.35} />
                })()
              )}
            </g>

            {/* End marker (draggable if hasRange) */}
            {hasRange && (() => {
              const ex = center + Math.cos(endAngle!) * r
              const ey = center + Math.sin(endAngle!) * r
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
                    const capX = center + Math.cos(endAngle!) * (r + 10 * scale)
                    const capY = center + Math.sin(endAngle!) * (r + 10 * scale)
                    return <circle cx={capX} cy={capY} r={sw(3)} fill={color} opacity={0.35} />
                  })()}
                </g>
              )
            })()}
            {!focus && showLabel && (() => {
              const fsize = fs(resolvedLabelMode === "all" ? 11 : 10)
              const maxLines = resolvedLabelMode === "all" ? 3 : 2
              const maxChars = isTiny ? 18 : isSmall ? 26 : 34
              const lines = wrapLabel(labelText, { maxChars, maxLines })
              const dy = Math.max(12, Math.round(fsize * 1.18))
              return (
                <text
                  x={lx}
                  y={ly}
                  fontSize={fsize}
                  fill="#e2e8f0"
                  fontWeight="700"
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  style={{
                    pointerEvents: "none",
                    paintOrder: "stroke",
                    stroke: "rgba(2, 6, 23, 0.92)",
                    strokeWidth: sw(4),
                  }}
                >
                  {lines.map((t, i) => (
                    <tspan
                      key={`${a.id}-l-${i}`}
                      x={lx}
                      dy={i === 0 ? 0 : dy}
                    >
                      {t}
                    </tspan>
                  ))}
                </text>
              )
            })()}
          </g>
        )
      })}

      {/* Focused-month label layout */}
      {focus && resolvedLabelMode !== "none" && focusLabels.length > 0 && (
        <g>
          {focusLabels.map((l) => {
            const sign = l.side === "right" ? 1 : -1
            const elbowX = center + sign * (radius + 10 * scale)
            const textX = l.x + sign * (10 * Math.max(0.9, scale))
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
                {(() => {
                  const fsize = fs(11)
                  const lines = wrapLabel(l.a.title, { maxChars: isSmall ? 28 : 36, maxLines: 3 })
                  const dy = Math.max(12, Math.round(fsize * 1.18))
                  return (
                    <text
                      x={textX}
                      y={l.y}
                      fontSize={fsize}
                      fill="#e2e8f0"
                      fontWeight="800"
                      textAnchor={l.anchor}
                      dominantBaseline="middle"
                      style={{
                        paintOrder: "stroke",
                        stroke: "rgba(2, 6, 23, 0.92)",
                        strokeWidth: sw(4),
                      }}
                    >
                      {lines.map((t, i) => (
                        <tspan key={`${l.id}-ml-${i}`} x={textX} dy={i === 0 ? 0 : dy}>
                          {t}
                        </tspan>
                      ))}
                    </text>
                  )
                })()}
              </g>
            )
          })}
        </g>
      )}


      {/* Center label */}
      <text
        x={center}
        y={center}
        fontSize={fs(focus ? 20 : 24)}
        fill="#64748b"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="300"
        style={focus ? { cursor: "zoom-out", userSelect: "none" } : { userSelect: "none" }}
        onClick={() => {
          if (!focus) return
          setFocusedMonth(null)
          setPopup(null)
        }}
      >
        {focus ? `${monthNamesFull[focus.month]} ${year}` : year}
      </text>
      {focus && (
        <text
          x={center}
          y={center + 22 * Math.max(0.9, scale)}
          fontSize={fs(11)}
          fill="#94a3b8"
          textAnchor="middle"
          dominantBaseline="middle"
          fontWeight="600"
          style={{ userSelect: "none" }}
        >
          Zurück zum Jahr
        </text>
      )}
      </svg>
      {/* Inline light popup near the clicked activity (HTML overlay, sibling of SVG) */}
      {popup && (
        (() => {
          const isDetailed = Boolean(popup.detailed)
          const w = isDetailed ? Math.min(340, rs - 24) : popupW
          const h = isDetailed ? Math.min(260, rs - 24) : popupH
          return (
            <div style={{ position: 'absolute', left: popup.x, top: popup.y, width: w, height: h }} onClick={(e)=> e.stopPropagation()}>
              <div className="pointer-events-auto select-none rounded-xl border border-white/15 bg-slate-900/90 text-slate-100 shadow-xl backdrop-blur-md p-3 text-[11px]">
                {/* Title */}
                <div className="font-semibold text-xs mb-1 truncate" title={popup.a.title}>{popup.a.title}</div>
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



