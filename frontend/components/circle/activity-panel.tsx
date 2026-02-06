"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Calendar, DollarSign, Users, Target } from "lucide-react"
import { getCategoryColor, type CategoryType } from "@/lib/colors"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import { type Activity } from "./radial-circle"
import { cn } from "@/lib/utils"

interface ActivityPanelProps {
  activity: Activity | null
  isOpen: boolean
  onClose: () => void
  onSave?: (activity: Activity) => void
  onDelete?: (activityId: string) => void
  isEditable?: boolean
  className?: string
}

const categoryOptions: { value: CategoryType; label: string }[] = [
  { value: 'VERKAUFSFOERDERUNG', label: 'Verkaufsförderung' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'EMPLOYER_BRANDING', label: 'Employer Branding' },
  { value: 'KUNDENPFLEGE', label: 'Kundenpflege' },
]

const statusOptions = [
  { value: 'PLANNED', label: 'Geplant' },
  { value: 'ACTIVE', label: 'Aktiv' },
  { value: 'PAUSED', label: 'Pausiert' },
  { value: 'DONE', label: 'Abgeschlossen' },
  { value: 'CANCELLED', label: 'Abgebrochen' },
]

export function ActivityPanel({
  activity,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isEditable = true,
  className,
}: ActivityPanelProps) {
  const [editedActivity, setEditedActivity] = React.useState<Activity | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)

  React.useEffect(() => {
    if (activity) {
      setEditedActivity({ ...activity })
      setIsEditing(false)
    }
  }, [activity])

  if (!activity || !isOpen) {
    return null
  }

  const handleSave = () => {
    if (editedActivity && onSave) {
      onSave(editedActivity)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditedActivity(activity ? { ...activity } : null)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (activity && onDelete) {
      onDelete(activity.id)
      onClose()
    }
  }

  const categoryColor = getCategoryColor(activity.category)
  const currentActivity = isEditing ? editedActivity : activity

  if (!currentActivity) return null

  return (
    <Card
      className={cn(
        // Mobile: bottom sheet. Desktop: floating side panel.
        "fixed z-[120] overflow-auto shadow-xl border-2 bg-white dark:bg-neutral-900",
        "inset-x-0 bottom-0 max-h-[75dvh] w-full rounded-t-2xl border-b-0",
        "sm:inset-auto sm:right-6 sm:top-1/2 sm:bottom-auto sm:w-96 sm:max-h-[80vh] sm:rounded-2xl sm:border-b-2 sm:-translate-y-1/2",
        className
      )}
    >
      <CardHeader className="pb-4 sticky top-0 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <CardTitle className="text-lg font-semibold">
              {isEditing ? (
                <Input
                  value={currentActivity.title}
                  onChange={(e) =>
                    setEditedActivity(prev => prev ? { ...prev, title: e.target.value } : null)
                  }
                  className="text-lg font-semibold"
                />
              ) : (
                currentActivity.title
              )}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-11 sm:w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            style={{
              borderColor: categoryColor,
              color: categoryColor,
            }}
          >
            {categoryOptions.find(c => c.value === currentActivity.category)?.label}
          </Badge>
          <Badge variant="secondary">
            {statusOptions.find(s => s.value === currentActivity.status)?.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Budget
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={currentActivity.budgetCHF}
                onChange={(e) =>
                  setEditedActivity(prev => prev ? { ...prev, budgetCHF: Number(e.target.value) } : null)
                }
              />
            ) : (
              <p className="text-lg font-semibold">
                {formatCurrency(currentActivity.budgetCHF)}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Erwartete Leads
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={currentActivity.expectedLeads}
                onChange={(e) =>
                  setEditedActivity(prev => prev ? { ...prev, expectedLeads: Number(e.target.value) } : null)
                }
              />
            ) : (
              <p className="text-lg font-semibold">
                {currentActivity.expectedLeads}
              </p>
            )}
          </div>
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            Gewichtung ({currentActivity.weight}%)
          </div>
          {isEditing ? (
            <Input
              type="range"
              min="0"
              max="100"
              value={currentActivity.weight}
              onChange={(e) =>
                setEditedActivity(prev => prev ? { ...prev, weight: Number(e.target.value) } : null)
              }
              className="w-full"
            />
          ) : (
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${currentActivity.weight}%`,
                  backgroundColor: categoryColor,
                }}
              />
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Startdatum
            </div>
            {isEditing ? (
              <Input
                type="date"
                value={currentActivity.start ? currentActivity.start.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setEditedActivity(prev => prev ? { ...prev, start: new Date(e.target.value) } : null)
                }
              />
            ) : (
              <p className="text-sm">
                {currentActivity.start ? formatDateShort(currentActivity.start) : '--'}
              </p>
            )}
          </div>
          
          {currentActivity.end && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Enddatum</div>
              {isEditing ? (
                <Input
                  type="date"
                  value={currentActivity.end ? currentActivity.end.toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setEditedActivity(prev => prev ? { ...prev, end: new Date(e.target.value) } : null)
                  }
                />
              ) : (
                <p className="text-sm">
                  {formatDateShort(currentActivity.end)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        {(currentActivity.notes || isEditing) && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Notizen</div>
            {isEditing ? (
              <textarea
                value={currentActivity.notes || ''}
                onChange={(e) =>
                  setEditedActivity(prev => prev ? { ...prev, notes: e.target.value } : null)
                }
                className="w-full p-2 border rounded-md min-h-[80px] text-sm"
                placeholder="Notizen zur Aktivität..."
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {currentActivity.notes}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        {isEditable && (
          <div className="flex gap-2 pt-4 border-t">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="flex-1">
                  Speichern
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex-1">
                  Abbrechen
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)} className="flex-1">
                  Bearbeiten
                </Button>
                <Button onClick={handleDelete} variant="destructive" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
