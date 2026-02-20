"use client"

import * as React from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { GripVertical, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type ContentItemStatus } from "@/lib/api"

export type PlannerItem = {
  id: number
  title: string
  channel?: string
  format?: string
  status: ContentItemStatus
  dueAt?: Date
  scheduledAt?: Date
  ownerEmail?: string | null
}

const LABEL: Record<ContentItemStatus, string> = {
  IDEA: "Idee",
  DRAFT: "Entwurf",
  REVIEW: "Review",
  APPROVED: "Freigegeben",
  SCHEDULED: "Geplant",
  PUBLISHED: "Veröffentlicht",
  BLOCKED: "Blockiert",
  ARCHIVED: "Archiv",
}

function fmtShortDate(v?: Date) {
  if (!v) return ""
  try {
    const d = v instanceof Date ? v : new Date(v)
    if (Number.isNaN(d.getTime())) return ""
    return d.toISOString().slice(0, 10)
  } catch {
    return ""
  }
}

type Columns = Record<string, PlannerItem[]>

function buildColumns(statuses: ContentItemStatus[], items: PlannerItem[]): Columns {
  const cols: Columns = {}
  for (const s of statuses) cols[s] = []
  for (const it of items) {
    const key = String(it.status || "")
    if (!cols[key]) cols[key] = []
    cols[key].push(it)
  }
  for (const s of Object.keys(cols)) {
    cols[s].sort((a, b) => {
      const ad = a.dueAt ? a.dueAt.getTime() : Number.POSITIVE_INFINITY
      const bd = b.dueAt ? b.dueAt.getTime() : Number.POSITIVE_INFINITY
      if (ad !== bd) return ad - bd
      return String(a.title || "").localeCompare(String(b.title || ""), "de")
    })
  }
  return cols
}

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

export function ContentItemsPlannerBoard({
  statuses,
  items,
  disabled,
  onMove,
  onOpenItem,
  onCreateItem,
}: {
  statuses: ContentItemStatus[]
  items: PlannerItem[]
  disabled?: boolean
  onMove: (id: number, nextStatus: ContentItemStatus) => Promise<void> | void
  onOpenItem: (id: number) => void
  onCreateItem?: (status: ContentItemStatus) => void
}) {
  const [columns, setColumns] = React.useState<Columns>(() => buildColumns(statuses, items))

  React.useEffect(() => {
    setColumns(buildColumns(statuses, items))
  }, [items, statuses])

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    const from = String(source.droppableId)
    const to = String(destination.droppableId)
    if (!from || !to) return
    if (disabled) return

    const movedId = Number(draggableId)
    if (Number.isNaN(movedId)) return

    const prev = columns

    // Same column: reorder only
    if (from === to) {
      const list = prev[from] || []
      const nextCols = { ...prev, [from]: reorder(list, source.index, destination.index) }
      setColumns(nextCols)
      return
    }

    const src = Array.from(prev[from] || [])
    const dst = Array.from(prev[to] || [])
    const srcIdx = source.index
    const [moved] = src.splice(srcIdx, 1)
    if (!moved) return
    const movedNext: PlannerItem = { ...moved, status: to as any }
    dst.splice(destination.index, 0, movedNext)

    const nextCols: Columns = { ...prev, [from]: src, [to]: dst }
    setColumns(nextCols)

    try {
      await onMove(movedId, to as any)
    } catch {
      // revert on failure
      setColumns(prev)
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        <div className="flex gap-3 min-w-max">
          {statuses.map((status) => {
            const key = String(status)
            const list = columns[key] || []
            return (
              <Droppable droppableId={key} key={key} isDropDisabled={!!disabled}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={[
                      "relative w-[320px] glass-card border rounded-2xl p-3 backdrop-blur-xl flex flex-col gap-3 min-h-[520px] transition",
                      snapshot.isDraggingOver ? "ring-1 ring-blue-500/30" : "",
                    ].join(" ")}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10" />
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold tracking-wider text-slate-200 truncate">
                          {LABEL[status]}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                            {list.length}
                          </span>
                        </div>
                      </div>
                      {onCreateItem && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass-card h-8 px-2 text-xs shrink-0"
                          disabled={disabled}
                          onClick={() => onCreateItem(status)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Neu
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {list.map((it, index) => (
                        <Draggable draggableId={String(it.id)} index={index} key={it.id} isDragDisabled={!!disabled}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={[
                                "group rounded-xl border border-white/10 bg-slate-950/40 p-3 transition hover:bg-slate-950/55 hover:ring-1 hover:ring-white/10",
                                dragSnapshot.isDragging ? "ring-1 ring-blue-500/30" : "",
                              ].join(" ")}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  {...dragProvided.dragHandleProps}
                                  className="mt-0.5 h-7 w-7 rounded-lg border border-white/10 bg-white/5 text-slate-300 inline-flex items-center justify-center shrink-0"
                                  aria-label="Ziehen"
                                >
                                  <GripVertical className="h-4 w-4 opacity-80" />
                                </div>
                                <button
                                  type="button"
                                  className="min-w-0 flex-1 text-left"
                                  onClick={() => onOpenItem(it.id)}
                                >
                                  <div className="text-sm font-semibold text-slate-100 truncate">
                                    {it.title}
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                                    {it.channel || "—"}
                                    {it.format ? ` · ${it.format}` : ""}
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                    {it.dueAt && (
                                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                                        Fällig: {fmtShortDate(it.dueAt)}
                                      </span>
                                    )}
                                    {it.scheduledAt && (
                                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                                        Publish: {fmtShortDate(it.scheduledAt)}
                                      </span>
                                    )}
                                    {it.ownerEmail && (
                                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 max-w-[220px] truncate">
                                        {it.ownerEmail}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}

                      {list.length === 0 && (
                        <div className="text-center text-slate-400 text-xs py-6 border border-dashed border-white/10 rounded-xl">
                          Hier ablegen
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </div>
    </DragDropContext>
  )
}

