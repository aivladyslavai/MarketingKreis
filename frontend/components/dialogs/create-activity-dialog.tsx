"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { FormField } from "@/components/ui/form-field"
import { CalendarIcon, Sparkles } from "lucide-react"
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
      <DialogContent className="w-[min(92vw,720px)] sm:max-w-[720px] max-h-[90vh] overflow-y-auto bg-white/80 dark:bg-slate-950/50 border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-900 dark:text-white text-base sm:text-lg font-semibold leading-tight">
                  Neue Marketing‑Aktivität
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  Kategorie, Status, Zeitraum und Budget
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <FormField id="title" label="Titel" required hint="Wird in Kalender & Aktivitätenliste angezeigt.">
            {({ describedBy, invalid }) => (
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="z.B. Frühlingskampagne 2025"
                required
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
              />
            )}
          </FormField>

          {/* Category */}
          <FormField id="category" label="Kategorie" required>
            {({ describedBy, invalid }) => (
              <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value as CategoryType }))}>
                <SelectTrigger aria-describedby={describedBy} aria-invalid={invalid || undefined}>
                  <SelectValue placeholder="Kategorie auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VERKAUFSFOERDERUNG">Verkaufsförderung</SelectItem>
                  <SelectItem value="IMAGE">Image</SelectItem>
                  <SelectItem value="KUNDENPFLEGE">Kundenpflege</SelectItem>
                  <SelectItem value="EMPLOYER_BRANDING">Employer Branding</SelectItem>
                </SelectContent>
              </Select>
            )}
          </FormField>

          {/* Status */}
          <FormField id="status" label="Status">
            {({ describedBy, invalid }) => (
              <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as any }))}>
                <SelectTrigger aria-describedby={describedBy} aria-invalid={invalid || undefined}>
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
            )}
          </FormField>

          {/* Start Date */}
          <div className="space-y-2">
            <div className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300">Startdatum *</div>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-11 rounded-xl border-white/15 bg-white/50 hover:bg-white/70 dark:bg-slate-950/20 dark:hover:bg-slate-950/30",
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
              <div className="mt-2 p-3 border border-white/10 rounded-2xl bg-white/70 dark:bg-slate-950/30 backdrop-blur-md">
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
            <div className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300">Enddatum (optional)</div>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-11 rounded-xl border-white/15 bg-white/50 hover:bg-white/70 dark:bg-slate-950/20 dark:hover:bg-slate-950/30",
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
              <div className="mt-2 p-3 border border-white/10 rounded-2xl bg-white/70 dark:bg-slate-950/30 backdrop-blur-md">
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
            <FormField id="budget" label="Budget (CHF)">
              {({ describedBy, invalid }) => (
                <Input
                  id="budget"
                  type="number"
                  value={formData.budgetCHF}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budgetCHF: parseInt(e.target.value) || 0 }))}
                  placeholder="25000"
                  min="0"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                />
              )}
            </FormField>
            <FormField id="leads" label="Erwartete Leads">
              {({ describedBy, invalid }) => (
                <Input
                  id="leads"
                  type="number"
                  value={formData.expectedLeads}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expectedLeads: parseInt(e.target.value) || 0 }))}
                  placeholder="150"
                  min="0"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                />
              )}
            </FormField>
          </div>

          {/* Notes */}
          <FormField id="notes" label="Notizen">
            {({ describedBy, invalid }) => (
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Zusätzliche Informationen zur Aktivität…"
                rows={4}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
              />
            )}
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} className="h-11 border-white/15 bg-white/50 hover:bg-white/70 dark:bg-slate-950/20 dark:hover:bg-slate-950/30">
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title || !formData.start} className="h-11 bg-white text-slate-900 hover:bg-white/90 dark:bg-white dark:text-slate-900">
              {isLoading ? "Erstelle..." : "Aktivität erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
