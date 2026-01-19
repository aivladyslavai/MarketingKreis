"use client"

import * as React from "react"
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd"
import { addDays, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns"
import { de } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ContentItem } from "@/hooks/use-content-items"

type Props = {
  items: ContentItem[]
  onOpenItem?: (id: number) => void
  onReschedule: (id: number, scheduledAtIso: string | null) => Promise<void> | void
}

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd")
}

export function EditorialCalendar({ items, onOpenItem, onReschedule }: Props) {
  const [cursor, setCursor] = React.useState<Date>(() => new Date())
  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = React.useMemo(() => {
    const out: Date[] = []
    let d = gridStart
    while (d <= gridEnd) {
      out.push(d)
      d = addDays(d, 1)
    }
    return out
  }, [gridStart, gridEnd])

  const scheduledByDay = React.useMemo(() => {
    const map = new Map<string, ContentItem[]>()
    for (const it of items) {
      if (!it.scheduledAt) continue
      const k = dayKey(it.scheduledAt)
      const arr = map.get(k) || []
      arr.push(it)
      map.set(k, arr)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.scheduledAt?.getTime() || 0) - (b.scheduledAt?.getTime() || 0))
    }
    return map
  }, [items])

  const unscheduled = React.useMemo(() => items.filter((it) => !it.scheduledAt && it.status !== "ARCHIVED"), [items])

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const id = Number(draggableId.replace("item-", ""))
    if (!Number.isFinite(id)) return

    if (destination.droppableId === "unscheduled") {
      await onReschedule(id, null)
      return
    }

    if (destination.droppableId.startsWith("day-")) {
      const k = destination.droppableId.replace("day-", "")
      const base = new Date(`${k}T09:00:00`)
      await onReschedule(id, base.toISOString())
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="text-sm font-semibold text-slate-100">
              {format(cursor, "MMMM yyyy", { locale: de })}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursor((d) => addDays(startOfMonth(d), -1))}>
                ←
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
                Heute
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCursor((d) => addDays(endOfMonth(d), 1))}>
                →
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-white/10">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((w) => (
              <div key={w} className="bg-slate-950/70 p-2 text-[11px] font-semibold text-slate-300">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-white/10">
            {days.map((d) => {
              const k = dayKey(d)
              const list = scheduledByDay.get(k) || []
              const isDim = !isSameMonth(d, cursor)
              const isToday = isSameDay(d, new Date())
              return (
                <Droppable droppableId={`day-${k}`} key={k}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[110px] bg-slate-950/70 p-2 overflow-hidden",
                        snapshot.isDraggingOver && "ring-1 ring-blue-500/30",
                        isDim && "opacity-60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className={cn("text-[11px] font-semibold", isToday ? "text-emerald-300" : "text-slate-300")}>
                          {format(d, "d")}
                        </div>
                        {list.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {list.length}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        {list.map((it, idx) => (
                          <Draggable draggableId={`item-${it.id}`} index={idx} key={it.id}>
                            {(dragProvided, dragSnapshot) => (
                              <button
                                type="button"
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={cn(
                                  "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-left text-[11px] text-slate-100 hover:bg-white/10",
                                  dragSnapshot.isDragging && "ring-1 ring-blue-500/30",
                                )}
                                onClick={() => onOpenItem?.(it.id)}
                                title={it.title}
                              >
                                <div className="truncate font-semibold">{it.title}</div>
                                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                                  <span className="truncate">{it.channel}</span>
                                  {it.format ? <span className="truncate">· {it.format}</span> : null}
                                </div>
                              </button>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-4">
          <div className="text-xs font-semibold text-slate-200">Unscheduled</div>
          <div className="mt-2 text-[11px] text-slate-400">Drag & drop in den Kalender.</div>

          <Droppable droppableId="unscheduled">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "mt-3 space-y-2 min-h-[180px] rounded-xl border border-white/10 bg-slate-950/50 p-2",
                  snapshot.isDraggingOver && "ring-1 ring-blue-500/30",
                )}
              >
                {unscheduled.length === 0 && (
                  <div className="text-center text-xs text-slate-500 py-8">Alles geplant.</div>
                )}
                {unscheduled.map((it, idx) => (
                  <Draggable draggableId={`item-${it.id}`} index={idx} key={it.id}>
                    {(dragProvided, dragSnapshot) => (
                      <button
                        type="button"
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={cn(
                          "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-left text-xs text-slate-100 hover:bg-white/10",
                          dragSnapshot.isDragging && "ring-1 ring-blue-500/30",
                        )}
                        onClick={() => onOpenItem?.(it.id)}
                      >
                        <div className="truncate font-semibold">{it.title}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                          <span className="truncate">{it.channel}</span>
                          {it.format ? <span className="truncate">· {it.format}</span> : null}
                        </div>
                      </button>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </DragDropContext>
  )
}

