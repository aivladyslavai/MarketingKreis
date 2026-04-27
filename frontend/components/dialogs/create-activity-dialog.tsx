"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField } from "@/components/ui/form-field"
import { Sparkles } from "lucide-react"
import { CategoryPicker } from "@/components/forms/category-picker"
import { DateRangePicker } from "@/components/forms/date-range-picker"

export interface NewActivityData {
  title: string
  category: string
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

  React.useEffect(() => {
    if (initialDate) {
      setFormData(prev => ({ ...prev, start: initialDate }))
    }
  }, [initialDate])

  const toDateInput = (value?: Date) => {
    if (!value) return ""
    return value.toISOString().slice(0, 10)
  }

  const fromDateInput = (value: string) => {
    return value ? new Date(`${value}T12:00:00`) : undefined
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.start) {
      return
    }

    onSubmit({
      title: formData.title,
      category: String(formData.category || ""),
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
      <DialogContent className="w-[min(92vw,720px)] sm:max-w-[720px]">
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

          <CategoryPicker
            id="category"
            value={String(formData.category || "")}
            onChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            required
          />

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

          <DateRangePicker
            start={toDateInput(formData.start)}
            end={toDateInput(formData.end)}
            startLabel="Startdatum"
            endLabel="Enddatum (optional)"
            onStartChange={(value) => setFormData((prev) => ({ ...prev, start: fromDateInput(value) || new Date() }))}
            onEndChange={(value) => setFormData((prev) => ({ ...prev, end: fromDateInput(value) }))}
          />

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
