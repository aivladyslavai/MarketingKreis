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
    color: 'bg-gray-500 dark:bg-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
  IN_PROGRESS: {
    title: 'In Bearbeitung',
    icon: Play,
    color: 'bg-blue-500 dark:bg-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-700'
  },
  REVIEW: {
    title: 'Review',
    icon: Eye,
    color: 'bg-yellow-500 dark:bg-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-700'
  },
  APPROVED: {
    title: 'Freigegeben',
    icon: CheckCircle,
    color: 'bg-green-500 dark:bg-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-700'
  },
  PUBLISHED: {
    title: 'Veröffentlicht',
    icon: CheckCircle,
    color: 'bg-purple-500 dark:bg-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-700'
  },
  ARCHIVED: {
    title: 'Archiviert',
    icon: Pause,
    color: 'bg-gray-400 dark:bg-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-700'
  }
}

const priorityConfig = {
  LOW: { label: 'Niedrig', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  MEDIUM: { label: 'Mittel', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  HIGH: { label: 'Hoch', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  URGENT: { label: 'Dringend', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
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
        "mb-3 cursor-pointer hover:shadow-md transition-all select-none overflow-hidden",
        isDragging && "opacity-50 rotate-2 shadow-lg scale-105"
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
              <h4 className="font-medium text-sm leading-tight line-clamp-2 break-words" title={task.title}>
                {task.title}
              </h4>
            </div>
            <Badge 
              variant="secondary" 
              className={cn("text-xs whitespace-nowrap flex-shrink-0", priorityConfig[task.priority].color)}
            >
              {priorityConfig[task.priority].label}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground min-w-0">
              <span
                className="inline-flex max-w-full items-center px-2 py-1 bg-muted dark:bg-muted/80 rounded text-xs truncate"
                title={task.channel}
              >
                {task.channel}
              </span>
              {task.format && (
                <span
                  className="inline-flex max-w-full items-center px-2 py-1 bg-muted dark:bg-muted/80 rounded text-xs truncate"
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
                <span className="text-xs text-muted-foreground min-w-0 truncate" title={task.owner.name}>
                  {task.owner.name}
                </span>
              </div>
            )}

            {task.activity && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
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
        // Mobile: slightly tighter padding; desktop keeps roomy column cards.
        "rounded-xl p-3 sm:p-4 transition-all",
        config.bgColor, 
        config.borderColor, 
        "border",
        isDragOver && "ring-2 ring-blue-400 bg-blue-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn("h-4 w-4 text-white rounded p-0.5 flex-shrink-0", config.color)} />
          <h3 className="font-medium text-sm min-w-0 truncate">{config.title}</h3>
          <Badge variant="secondary" className="text-xs flex-shrink-0 whitespace-nowrap">
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCreateTask?.(status)}
          className="h-8 w-8 p-0"
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
          <div className="text-center py-8 text-muted-foreground">
            <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Keine Aufgaben</p>
          </div>
        )}
        {isDragOver && (
          <div className="h-10 border-2 border-dashed border-blue-400/60 rounded-md" />
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
    console.log('🎯 Drag started:', task.title)
  }

  const handleTaskMove = (taskId: string, newStatus: TaskStatus, newIndex: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== newStatus) {
      console.log(`🎯 Moving task "${task.title}" from ${task.status} to ${newStatus}`)
      
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