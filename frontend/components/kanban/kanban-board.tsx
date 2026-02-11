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

function TaskCard({ task, onTaskClick, onDragStart }: {
  task: ContentTask
  onTaskClick?: (task: ContentTask) => void
  onDragStart?: (task: ContentTask) => void
}) {
  const [isDragging, setIsDragging] = React.useState(false)

  const getDeadlineColor = () => {
    if (!task.deadline) return 'text-gray-500'
    if (isPast(task.deadline)) return 'text-red-500'
    if (isToday(task.deadline)) return 'text-orange-500'
    return 'text-gray-500'
  }

  return (
    <Card 
      className={cn(
        "mb-3 cursor-pointer transition-all select-none overflow-hidden border border-white/10 bg-slate-950/30 backdrop-blur-xl",
        "hover:bg-slate-950/40 hover:ring-1 hover:ring-white/10 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]",
        isDragging && "opacity-60 rotate-1 shadow-[0_18px_44px_rgba(0,0,0,0.55)] scale-[1.01]"
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
      onDragEnd={() => {
        setIsDragging(false)
      }}
      onClick={() => onTaskClick?.(task)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm leading-tight line-clamp-2 break-words text-slate-100" title={task.title}>
                {task.title}
              </h4>
            </div>
            <Badge 
              variant="secondary" 
              className={cn(
                "text-[10px] whitespace-nowrap flex-shrink-0 rounded-full border px-2 py-0.5 font-semibold",
                priorityConfig[task.priority].color
              )}
            >
              {priorityConfig[task.priority].label}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs min-w-0">
              <span
                className="inline-flex max-w-full items-center px-2 py-1 rounded-full border border-white/10 bg-white/5 text-slate-200/90 text-[11px] truncate"
                title={task.channel}
              >
                {task.channel}
              </span>
              {task.format && (
                <span
                  className="inline-flex max-w-full items-center px-2 py-1 rounded-full border border-white/10 bg-white/5 text-slate-200/80 text-[11px] truncate"
                  title={task.format}
                >
                  {task.format}
                </span>
              )}
            </div>

            {task.deadline && (
              <div className={cn("flex items-center gap-1 text-xs min-w-0", getDeadlineColor())}>
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="min-w-0 truncate">
                  {formatDistanceToNow(task.deadline, { 
                    addSuffix: true, 
                    locale: de 
                  })}
                </span>
              </div>
            )}

            {task.owner && (
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={task.owner.avatar} />
                  <AvatarFallback className="text-xs">
                    {task.owner.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-300 min-w-0 truncate" title={task.owner.name}>
                  {task.owner.name}
                </span>
              </div>
            )}

            {task.activity && (
              <div className="flex items-center gap-1 text-xs text-slate-400 min-w-0">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span className="min-w-0 truncate" title={task.activity.title}>
                  {task.activity.title}
                </span>
              </div>
            )}
          </div>
        </div>
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
        "relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/25 backdrop-blur-xl p-3 sm:p-4 transition-all",
        isDragOver && cn("ring-2", config.ring)
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r", config.accent)} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
            <Icon className="h-4 w-4 text-slate-100" />
          </div>
          <h3 className="font-semibold text-sm min-w-0 truncate text-slate-100">{config.title}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-200/80 flex-shrink-0 whitespace-nowrap">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCreateTask?.(status)}
          className="h-8 w-8 p-0 border-white/15 text-slate-200 hover:bg-white/10"
          title="Neue Aufgabe"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

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
          <div className="text-center py-8 text-slate-400">
            <Icon className="h-8 w-8 mx-auto mb-2 opacity-60" />
            <p className="text-sm">Keine Aufgaben</p>
            <p className="mt-1 text-[11px] text-slate-500">Ziehe eine Karte hierher oder erstelle eine neue.</p>
          </div>
        )}
        {isDragOver && (
          <div className="h-10 border-2 border-dashed border-white/20 rounded-xl" />
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