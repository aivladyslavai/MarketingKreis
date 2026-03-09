"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Plus, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Eye,
  Play,
  Pause
} from "lucide-react"
import { formatDistanceToNow, isPast, isToday } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface ContentTask {
  id: string
  title: string
  channel: string
  format?: string
  deadline?: Date
  status: TaskStatus
  priority: TaskPriority
  notes?: string
  assets?: string[]
  owner?: {
    id: string
    name: string
    avatar?: string
  }
  activityId?: string
  activity?: {
    title: string
  }
  createdAt?: Date
  updatedAt?: Date
}

interface KanbanBoardProps {
  tasks: ContentTask[]
  onTaskMove?: (taskId: string, newStatus: TaskStatus, newIndex: number) => void
  onTaskClick?: (task: ContentTask) => void
  onCreateTask?: (status: TaskStatus) => void
  onEditTask?: (task: ContentTask) => void
  onDeleteTask?: (taskId: string) => void
}

const statusConfig = {
  TODO: {
    title: 'To Do',
    icon: Plus,
    accent: 'from-slate-500/40 via-slate-400/20 to-transparent',
    ring: 'ring-slate-400/25',
  },
  IN_PROGRESS: {
    title: 'In Bearbeitung',
    icon: Play,
    accent: 'from-blue-500/45 via-cyan-400/20 to-transparent',
    ring: 'ring-blue-500/30',
  },
  REVIEW: {
    title: 'Review',
    icon: Eye,
    accent: 'from-amber-500/45 via-yellow-400/20 to-transparent',
    ring: 'ring-amber-400/25',
  },
  APPROVED: {
    title: 'Freigegeben',
    icon: CheckCircle,
    accent: 'from-emerald-500/45 via-green-400/20 to-transparent',
    ring: 'ring-emerald-500/25',
  },
  PUBLISHED: {
    title: 'Veröffentlicht',
    icon: CheckCircle,
    accent: 'from-violet-500/45 via-fuchsia-400/20 to-transparent',
    ring: 'ring-violet-500/25',
  },
  ARCHIVED: {
    title: 'Archiviert',
    icon: Pause,
    accent: 'from-slate-400/35 via-slate-300/15 to-transparent',
    ring: 'ring-slate-400/15',
  }
}

const priorityConfig = {
  LOW: { label: 'Niedrig', color: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100' },
  MEDIUM: { label: 'Mittel', color: 'border-amber-300/25 bg-amber-500/10 text-amber-100' },
  HIGH: { label: 'Hoch', color: 'border-orange-300/25 bg-orange-500/10 text-orange-100' },
  URGENT: { label: 'Dringend', color: 'border-rose-400/25 bg-rose-500/10 text-rose-100' }
}

const priorityAccent: Record<TaskPriority, string> = {
  LOW: 'bg-emerald-400',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-orange-400',
  URGENT: 'bg-rose-500',
}

const deadlineBadge = (d: Date) => {
  if (isPast(d) && !isToday(d))
    return { bg: 'bg-rose-500/15 border-rose-400/25', text: 'text-rose-300', icon: 'text-rose-400' }
  if (isToday(d))
    return { bg: 'bg-amber-500/15 border-amber-400/25', text: 'text-amber-300', icon: 'text-amber-400' }
  return { bg: 'bg-white/5 border-white/10', text: 'text-slate-300', icon: 'text-slate-400' }
}

function TaskCard({ task, onTaskClick, onDragStart }: {
  task: ContentTask
  onTaskClick?: (task: ContentTask) => void
  onDragStart?: (task: ContentTask) => void
}) {
  const [isDragging, setIsDragging] = React.useState(false)

  const ownerInitials = task.owner
    ? task.owner.name.split(/[\s.@]+/).filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join('')
    : null

  return (
    <Card
      className={cn(
        "group/card relative mb-3 cursor-pointer select-none overflow-hidden rounded-xl border border-white/[0.07]",
        "bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 backdrop-blur-xl",
        "transition-all duration-200 ease-out",
        "hover:border-white/15 hover:shadow-[0_8px_32px_rgba(0,0,0,0.45)] hover:-translate-y-0.5",
        isDragging && "opacity-50 rotate-1 scale-[1.02] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      )}
      data-task-id={task.id}
      data-status={task.status}
      data-priority={task.priority}
      data-owner={task.owner?.name || ''}
      data-deadline={task.deadline?.toISOString?.() || ''}
      data-channel={task.channel}
      data-format={task.format || ''}
      data-created={task.createdAt?.toISOString?.() || ''}
      data-updated={task.updatedAt?.toISOString?.() || ''}
      data-testid={`task-${task.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.setData('application/json', JSON.stringify(task))
        e.dataTransfer.effectAllowed = 'move'
        setIsDragging(true)
        onDragStart?.(task)
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={() => onTaskClick?.(task)}
    >
      {/* Priority accent stripe */}
      <div className={cn("absolute inset-y-0 left-0 w-[3px] rounded-l-xl", priorityAccent[task.priority])} />

      {/* Subtle top-edge shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />

      <CardContent className="p-3.5 pl-4">
        {/* Row 1: Title + Priority badge */}
        <div className="flex items-start gap-2 mb-2.5">
          <h4
            className="flex-1 min-w-0 text-[13px] font-semibold leading-snug text-slate-100 line-clamp-2 break-words"
            title={task.title}
          >
            {task.title}
          </h4>
          <Badge
            variant="secondary"
            className={cn(
              "mt-0.5 shrink-0 rounded-md border px-1.5 py-px text-[10px] font-bold uppercase tracking-wide",
              priorityConfig[task.priority].color
            )}
          >
            {priorityConfig[task.priority].label}
          </Badge>
        </div>

        {/* Row 2: Channel / format pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span
            className="inline-flex max-w-full items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10.5px] font-medium text-slate-300 truncate"
            title={task.channel}
          >
            {task.channel}
          </span>
          {task.format && task.format !== task.channel && (
            <span
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10.5px] font-medium text-slate-400 truncate"
              title={task.format}
            >
              {task.format}
            </span>
          )}
        </div>

        {/* Row 3: Deadline */}
        {task.deadline && (() => {
          const db = deadlineBadge(task.deadline)
          return (
            <div className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 mb-2.5", db.bg)}>
              <Calendar className={cn("h-3 w-3 shrink-0", db.icon)} />
              <span className={cn("text-[11px] font-medium", db.text)}>
                {formatDistanceToNow(task.deadline, { addSuffix: true, locale: de })}
              </span>
            </div>
          )
        })()}

        {/* Row 4: Footer — owner + activity link */}
        {(task.owner || task.activity) && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
            {task.owner ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar className="h-5 w-5 shrink-0 ring-1 ring-white/10">
                  <AvatarImage src={task.owner.avatar} />
                  <AvatarFallback className="text-[9px] font-bold bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-white/80">
                    {ownerInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-slate-400 truncate" title={task.owner.name}>
                  {task.owner.name}
                </span>
              </div>
            ) : <span />}

            {task.activity && (
              <div className="flex items-center gap-1 min-w-0 ml-auto">
                <AlertCircle className="h-3 w-3 shrink-0 text-slate-500" />
                <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={task.activity.title}>
                  {task.activity.title}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function KanbanColumn({ 
  status, 
  tasks, 
  onCreateTask, 
  onTaskClick,
  onTaskMove,
  onDragStart
}: {
  status: TaskStatus
  tasks: ContentTask[]
  onCreateTask?: (status: TaskStatus) => void
  onTaskClick?: (task: ContentTask) => void
  onTaskMove?: (taskId: string, newStatus: TaskStatus, newIndex: number) => void
  onDragStart?: (task: ContentTask) => void
}) {
  const config = statusConfig[status]
  const Icon = config.icon
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
    // calculate potential insertion index for nicer reordering
    const container = listRef.current
    if (!container) return
    const cards = Array.from(container.querySelectorAll('[data-testid^="task-" ]')) as HTMLElement[]
    const y = e.clientY
    let index = tasks.length
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect()
      const mid = rect.top + rect.height / 2
      if (y < mid) { index = i; break }
    }
    setHoverIndex(index)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setHoverIndex(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const index = hoverIndex ?? tasks.length
    setHoverIndex(null)
    
    const taskId = e.dataTransfer.getData('text/plain')
    
    if (taskId && onTaskMove) {
      onTaskMove(taskId, status, index)
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/30 backdrop-blur-xl p-3 sm:p-4 transition-all duration-200",
        isDragOver && cn("ring-2 border-white/15", config.ring)
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top accent gradient bar */}
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r", config.accent)} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]" />

      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-slate-300" />
          </div>
          <h3 className="font-bold text-[13px] tracking-tight min-w-0 truncate text-slate-100">
            {config.title}
          </h3>
          <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-slate-300/80 shrink-0">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCreateTask?.(status)}
          className="h-7 w-7 p-0 border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] hover:border-white/15 transition-colors"
          title="Neue Aufgabe"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Task list */}
      <div className="space-y-2 min-h-[180px] sm:min-h-[200px]" ref={listRef}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onTaskClick={onTaskClick}
            onDragStart={onDragStart}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-10 w-10 rounded-xl border border-dashed border-white/10 flex items-center justify-center mb-3">
              <Icon className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-[13px] font-medium text-slate-500">Keine Aufgaben</p>
            <p className="mt-1 text-[11px] text-slate-600">Karte hierher ziehen oder neue erstellen</p>
          </div>
        )}

        {isDragOver && (
          <div className="h-12 border-2 border-dashed border-white/15 rounded-xl bg-white/[0.02] transition-colors" />
        )}
      </div>
    </div>
  )
}

function KanbanBoard({ tasks, onTaskMove, onTaskClick, onCreateTask }: KanbanBoardProps) {
  const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']
  const { toast } = useToast()

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status)
  }

  const handleDragStart = (task: ContentTask) => {
    // no-op (placeholder for analytics)
  }

  const handleTaskMove = (taskId: string, newStatus: TaskStatus, newIndex: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== newStatus) {
      toast({
        title: "Task verschoben",
        description: `"${task.title}" wurde zu ${statusConfig[newStatus].title} verschoben`,
      })
      
      onTaskMove?.(taskId, newStatus, newIndex)
    }
  }

  return (
    <div className="w-full">
      {/* Mobile: horizontal swipe columns (prevents an endless vertical list). */}
      <div className="lg:hidden -mx-4 px-4 overflow-x-auto mk-no-scrollbar snap-x snap-mandatory">
        <div className="flex gap-4 min-w-max pb-2">
          {statuses.map((status) => (
            <div key={status} className="w-[86vw] max-w-[420px] flex-shrink-0 snap-start">
              <KanbanColumn
                status={status}
                tasks={getTasksByStatus(status)}
                onCreateTask={onCreateTask}
                onTaskClick={onTaskClick}
                onTaskMove={handleTaskMove}
                onDragStart={handleDragStart}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop/tablet: multi-column grid */}
      <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={getTasksByStatus(status)}
            onCreateTask={onCreateTask}
            onTaskClick={onTaskClick}
            onTaskMove={handleTaskMove}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  )
}

export default KanbanBoard