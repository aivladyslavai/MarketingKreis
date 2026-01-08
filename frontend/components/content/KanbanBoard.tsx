"use client"

import { useMemo, useState, useEffect } from "react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export type KanbanStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED"

export interface KanbanItem {
  id: string
  title: string
  assignee?: string
  due?: string
  status: KanbanStatus
}

export interface KanbanBoardProps {
  columns?: KanbanStatus[]
  rows?: KanbanStatus[][]
  items: KanbanItem[]
  onItemsChange?: (items: KanbanItem[]) => void
  onCreateItem?: (status: KanbanStatus) => void
}

function ColumnTitle({ status }: { status: KanbanStatus }) {
  const map: Record<KanbanStatus, string> = {
    TODO: "TODO",
    IN_PROGRESS: "IN PROGRESS",
    REVIEW: "REVIEW",
    APPROVED: "APPROVED",
    PUBLISHED: "PUBLISHED",
    ARCHIVED: "ARCHIVED",
  }
  return (
    <div className="text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-400">
      {map[status]}
    </div>
  )
}

export default function KanbanBoard({ columns = [], rows, items, onItemsChange, onCreateItem }: KanbanBoardProps) {
  const [localItems, setLocalItems] = useState<KanbanItem[]>(items)

  // Update local items when external items prop changes
  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const layoutRows: KanbanStatus[][] = useMemo(() => {
    if (rows && rows.length) return rows
    return [columns]
  }, [rows, columns])

  const grouped = useMemo(() => {
    const result: Record<KanbanStatus, KanbanItem[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      APPROVED: [],
      PUBLISHED: [],
      ARCHIVED: [],
    }
    for (const it of localItems) result[it.status].push(it)
    return result
  }, [localItems])

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    const from = source.droppableId as KanbanStatus
    const to = destination.droppableId as KanbanStatus
    if (from === to && source.index === destination.index) return

    // Rebuild new array
    const moved = localItems.find((i) => i.id === draggableId)
    if (!moved) return

    const next = localItems.map((i) => (i.id === draggableId ? { ...i, status: to } : i))
    setLocalItems(next)
    onItemsChange?.(next)

    // Here we would persist
    try {
      await fetch(`/api/content/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      })
    } catch (e) {
      // ignore in demo
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {layoutRows.map((row, rIdx) => (
        <div key={rIdx} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
          {row.map((col) => (
          <Droppable droppableId={col} key={col}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                  className={`relative overflow-hidden glass-card border rounded-2xl p-3 md:p-4 backdrop-blur-xl flex flex-col gap-3 min-h-[480px] transition ${
                    snapshot.isDraggingOver ? "ring-1 ring-blue-500/30" : ""
                }`}
              >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                  <ColumnTitle status={col} />
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/70">{grouped[col].length}</span>
                    </div>
                  <Button
                    size="sm"
                    variant="outline"
                      className="glass-card h-8 px-2 text-xs hover:ring-1 hover:ring-blue-500/30"
                    onClick={() => onCreateItem?.(col)}
                  >
                    + Neue Karte
                  </Button>
                </div>

                {grouped[col].map((item, index) => (
                  <Draggable draggableId={item.id} index={index} key={item.id}>
                    {(dragProvided, dragSnapshot) => (
                      <motion.div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                          className={`group rounded-xl bg-white/80 dark:bg-neutral-800/70 p-3 shadow-sm hover:shadow-md transition border border-white/10 dark:border-white/10 ${
                            dragSnapshot.isDragging ? "ring-1 ring-blue-500/30" : ""
                        }`}
                      >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {item.assignee ? (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-700 dark:text-slate-200">
                                      {item.assignee.slice(0,1).toUpperCase()}
                                    </span>
                                    {item.assignee}
                                  </span>
                                ) : (
                                  "Unassigned"
                                )}
                                {item.due ? <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 border border-white/30 dark:border-white/10">Due: {item.due}</span> : null}
                              </div>
                            </div>
                        </div>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
      ))}
    </DragDropContext>
  )
}


