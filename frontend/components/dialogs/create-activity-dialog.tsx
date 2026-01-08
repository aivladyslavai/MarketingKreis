"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { type CategoryType } from "@/lib/colors"

export interface NewActivityData {
  title: string
  category: CategoryType
  status: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'DONE' | 'CANCELLED'
  budgetCHF: number
  expectedLeads: number
  start: Date
  end?: Date
  notes?: string
}

interface CreateActivityDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: NewActivityData) => void
  initialDate?: Date
  isLoading?: boolean
}

export function CreateActivityDialog({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  isLoading = false
}: CreateActivityDialogProps) {
  const [formData, setFormData] = React.useState<Partial<NewActivityData>>({
    title: '',
    category: 'VERKAUFSFOERDERUNG',
    status: 'PLANNED',
    budgetCHF: 0,
    expectedLeads: 0,
    start: initialDate || new Date(),
    end: undefined,
    notes: ''
  })

  const [startDateOpen, setStartDateOpen] = React.useState(false)
  const [endDateOpen, setEndDateOpen] = React.useState(false)

  React.useEffect(() => {
    if (initialDate) {
      setFormData(prev => ({ ...prev, start: initialDate }))
    }
  }, [initialDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.start) {
      return
    }

    onSubmit({
      title: formData.title,
      category: formData.category as CategoryType,
      status: formData.status as 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'DONE' | 'CANCELLED',
      budgetCHF: formData.budgetCHF || 0,
      expectedLeads: formData.expectedLeads || 0,
      start: formData.start,
      end: formData.end,
      notes: formData.notes
    })
  }

  const handleClose = () => {
    setFormData({
      title: '',
      category: 'VERKAUFSFOERDERUNG',
      status: 'PLANNED',
      budgetCHF: 0,
      expectedLeads: 0,
      start: new Date(),
      end: undefined,
      notes: ''
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Marketing-Aktivität erstellen</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="z.B. Frühlingskampagne 2025"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as CategoryType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategorie auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VERKAUFSFOERDERUNG">Verkaufsförderung</SelectItem>
                <SelectItem value="IMAGE">Image</SelectItem>
                <SelectItem value="KUNDENPFLEGE">Kundenpflege</SelectItem>
                <SelectItem value="EMPLOYER_BRANDING">Employer Branding</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">Geplant</SelectItem>
                <SelectItem value="ACTIVE">Aktiv</SelectItem>
                <SelectItem value="PAUSED">Pausiert</SelectItem>
                <SelectItem value="DONE">Abgeschlossen</SelectItem>
                <SelectItem value="CANCELLED">Abgebrochen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Startdatum *</Label>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.start && "text-muted-foreground"
              )}
              onClick={() => setStartDateOpen(!startDateOpen)}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.start ? (
                format(formData.start, "d. MMMM yyyy", { locale: de })
              ) : (
                <span>Datum auswählen</span>
              )}
            </Button>
            {startDateOpen && (
              <div className="mt-2 p-3 border rounded-md bg-popover">
                <Calendar
                  mode="single"
                  selected={formData.start}
                  onSelect={(date: Date | undefined) => {
                    setFormData(prev => ({ ...prev, start: date || new Date() }))
                    setStartDateOpen(false)
                  }}
                  initialFocus
                />
              </div>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>Enddatum (optional)</Label>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.end && "text-muted-foreground"
              )}
              onClick={() => setEndDateOpen(!endDateOpen)}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.end ? (
                format(formData.end, "d. MMMM yyyy", { locale: de })
              ) : (
                <span>Datum auswählen</span>
              )}
            </Button>
            {endDateOpen && (
              <div className="mt-2 p-3 border rounded-md bg-popover">
                <Calendar
                  mode="single"
                  selected={formData.end}
                  onSelect={(date: Date | undefined) => {
                    setFormData(prev => ({ ...prev, end: date }))
                    setEndDateOpen(false)
                  }}
                  initialFocus
                />
              </div>
            )}
          </div>

          {/* Budget and Expected Leads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (CHF)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budgetCHF}
                onChange={(e) => setFormData(prev => ({ ...prev, budgetCHF: parseInt(e.target.value) || 0 }))}
                placeholder="25000"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leads">Erwartete Leads</Label>
              <Input
                id="leads"
                type="number"
                value={formData.expectedLeads}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedLeads: parseInt(e.target.value) || 0 }))}
                placeholder="150"
                min="0"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Zusätzliche Informationen zur Aktivität..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title || !formData.start}>
              {isLoading ? "Erstelle..." : "Aktivität erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
