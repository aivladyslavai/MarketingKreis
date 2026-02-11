"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField } from "@/components/ui/form-field"
import { HandCoins } from "lucide-react"

export interface NewDealData {
  title: string
  stage: 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
  value?: number
  probability?: number
  companyId?: string
  description?: string
}

interface CreateDealDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: NewDealData) => void
  isLoading?: boolean
}

export function CreateDealDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: CreateDealDialogProps) {
  const [formData, setFormData] = React.useState<Partial<NewDealData>>({
    title: '',
    stage: 'NEW',
    value: 0,
    probability: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title) {
      return
    }

    onSubmit({
      title: formData.title,
      stage: formData.stage as 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST',
      value: formData.value,
      probability: formData.probability
    })
  }

  const handleClose = () => {
    setFormData({
      title: '',
      stage: 'NEW',
      value: 0,
      probability: 0
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[min(92vw,560px)] sm:max-w-[560px] bg-white/80 dark:bg-slate-950/50 border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                <HandCoins className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-900 dark:text-white text-base sm:text-lg font-semibold leading-tight">Neuen Deal erstellen</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">Pipeline-Status, Wert und Wahrscheinlichkeit</div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <FormField id="title" label="Titel" required hint="Kurz und eindeutig – wird in der Pipeline angezeigt.">
            {({ describedBy, invalid }) => (
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="z.B. Jahresvertrag – Newsletter Automation"
                required
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
              />
            )}
          </FormField>

          {/* Stage */}
          <FormField id="stage" label="Status">
            {({ describedBy, invalid }) => (
              <Select value={formData.stage} onValueChange={(value) => setFormData((prev) => ({ ...prev, stage: value as any }))}>
                <SelectTrigger aria-describedby={describedBy} aria-invalid={invalid || undefined}>
                  <SelectValue placeholder="Status auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">Neu</SelectItem>
                  <SelectItem value="QUALIFIED">Qualifiziert</SelectItem>
                  <SelectItem value="PROPOSAL">Angebot</SelectItem>
                  <SelectItem value="NEGOTIATION">Verhandlung</SelectItem>
                  <SelectItem value="WON">Gewonnen</SelectItem>
                  <SelectItem value="LOST">Verloren</SelectItem>
                </SelectContent>
              </Select>
            )}
          </FormField>

          {/* Value and Probability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="value" label="Wert (CHF)" hint="Nur Zahl.">
              {({ describedBy, invalid }) => (
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData((prev) => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                  placeholder="75000"
                  min="0"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                />
              )}
            </FormField>
            <FormField id="probability" label="Wahrscheinlichkeit (%)" hint="0–100">
              {({ describedBy, invalid }) => (
                <Input
                  id="probability"
                  type="number"
                  value={formData.probability}
                  onChange={(e) => setFormData((prev) => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
                  placeholder="70"
                  min="0"
                  max="100"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                />
              )}
            </FormField>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} className="h-11 border-white/15 bg-white/50 hover:bg-white/70 dark:bg-slate-950/20 dark:hover:bg-slate-950/30">
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title} className="h-11 bg-white text-slate-900 hover:bg-white/90 dark:bg-white dark:text-slate-900">
              {isLoading ? "Erstelle..." : "Deal erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
