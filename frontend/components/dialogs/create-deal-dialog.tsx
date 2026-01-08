"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neuen Deal erstellen</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="z.B. Enterprise Software Lizenz"
              required
            />
          </div>

          {/* Stage */}
          <div className="space-y-2">
            <Label htmlFor="stage">Status</Label>
            <Select
              value={formData.stage}
              onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value as any }))}
            >
              <SelectTrigger>
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
          </div>

          {/* Value and Probability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Wert (CHF)</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                placeholder="75000"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probability">Wahrscheinlichkeit (%)</Label>
              <Input
                id="probability"
                type="number"
                value={formData.probability}
                onChange={(e) => setFormData(prev => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
                placeholder="70"
                min="0"
                max="100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title}>
              {isLoading ? "Erstelle..." : "Deal erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
