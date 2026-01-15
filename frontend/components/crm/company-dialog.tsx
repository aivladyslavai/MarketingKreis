"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { companiesAPI } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface Company {
  id?: string
  name: string
  industry?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  employees?: number
  revenue?: number
  status?: string
  notes?: string
  contact_person_name?: string
  contact_person_position?: string
  contact_person_email?: string
  contact_person_phone?: string
  vat_id?: string
  lead_source?: string
  priority?: string
  next_follow_up_at?: string
  linkedin_url?: string
  tags?: string
}

interface CompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: Company | null
  onSuccess: () => void
}

const emptyCompany: Company = {
  name: "",
  industry: "",
  website: "",
  phone: "",
  email: "",
  address: "",
  employees: undefined,
  revenue: undefined,
  status: "prospect",
  contact_person_name: "",
  contact_person_position: "",
  contact_person_email: "",
  contact_person_phone: "",
  vat_id: "",
  lead_source: "",
  priority: "medium",
  next_follow_up_at: "",
  linkedin_url: "",
  tags: "",
  notes: "",
}

export function CompanyDialog({ open, onOpenChange, company, onSuccess }: CompanyDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Company>(company || emptyCompany)

  // Keep local form state in sync when a different company is selected
  // or when switching between "new" and "edit" modes.
  useEffect(() => {
    if (company) {
      setFormData({
        ...emptyCompany,
        ...company,
        next_follow_up_at: (company as any)?.next_follow_up_at
          ? String((company as any).next_follow_up_at).slice(0, 10)
          : "",
      })
    } else {
      setFormData(emptyCompany)
    }
  }, [company, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: Company = {
        ...formData,
        name: String(formData.name || "").trim(),
        industry: (formData.industry || "").trim() || undefined,
        website: (formData.website || "").trim() || undefined,
        phone: (formData.phone || "").trim() || undefined,
        email: (formData.email || "").trim() || undefined,
        address: (formData.address || "").trim() || undefined,
        notes: (formData.notes || "").trim() || undefined,
        status: (formData.status || "prospect").trim() || "prospect",
        employees: typeof formData.employees === "number" ? formData.employees : undefined,
        revenue: typeof formData.revenue === "number" ? formData.revenue : undefined,
        contact_person_name: (formData.contact_person_name || "").trim() || undefined,
        contact_person_position: (formData.contact_person_position || "").trim() || undefined,
        contact_person_email: (formData.contact_person_email || "").trim() || undefined,
        contact_person_phone: (formData.contact_person_phone || "").trim() || undefined,
        vat_id: (formData.vat_id || "").trim() || undefined,
        lead_source: (formData.lead_source || "").trim() || undefined,
        priority: (formData.priority || "").trim() || undefined,
        next_follow_up_at: formData.next_follow_up_at
          ? new Date(formData.next_follow_up_at).toISOString()
          : undefined,
        linkedin_url: (formData.linkedin_url || "").trim() || undefined,
        tags: (formData.tags || "").trim() || undefined,
      }

      if (company?.id) {
        // Update existing company
        await companiesAPI.update(company.id, payload)
        toast({
          title: "✅ Unternehmen gespeichert",
          description: "Änderungen wurden übernommen.",
        })
      } else {
        // Create new company
        await companiesAPI.create(payload)
        toast({
          title: "✅ Unternehmen erstellt",
          description: "Das Unternehmen wurde angelegt.",
        })
      }
      onOpenChange(false)
      // Call onSuccess after closing dialog to avoid race conditions
      setTimeout(() => onSuccess(), 100)
    } catch (error: any) {
      console.error('Company save error:', error)
      toast({
        title: "Fehler",
        description: error.message || "Unternehmen konnte nicht gespeichert werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Company, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>
            <span className="text-slate-900 dark:text-white">
              {company?.id ? "Unternehmen bearbeiten" : "Neues Unternehmen"}
            </span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="ACME Corporation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry || ''}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  placeholder="Technology"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+41 44 123 45 67"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={String(formData.status || "prospect")} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employees">Employees</Label>
                <Input
                  id="employees"
                  type="number"
                  value={formData.employees ?? ""}
                  onChange={(e) =>
                    handleChange("employees", e.target.value === "" ? undefined : parseInt(e.target.value) || 0)
                  }
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenue">Revenue (CHF)</Label>
                <Input
                  id="revenue"
                  type="number"
                  value={formData.revenue ?? ""}
                  onChange={(e) =>
                    handleChange("revenue", e.target.value === "" ? undefined : parseInt(e.target.value) || 0)
                  }
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Kontaktperson (optional)</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Diese Felder sind nicht Pflicht. Wenn du später mehrere Kontakte pflegen willst, nutze den Tab{" "}
                <span className="font-medium">Kontakte</span>.
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="contact_person_name">Name</Label>
                  <Input
                    id="contact_person_name"
                    value={formData.contact_person_name || ""}
                    onChange={(e) => handleChange("contact_person_name", e.target.value)}
                    placeholder="Max Mustermann"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person_position">Position</Label>
                  <Input
                    id="contact_person_position"
                    value={formData.contact_person_position || ""}
                    onChange={(e) => handleChange("contact_person_position", e.target.value)}
                    placeholder="Marketing Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person_email">E-Mail</Label>
                  <Input
                    id="contact_person_email"
                    type="email"
                    value={formData.contact_person_email || ""}
                    onChange={(e) => handleChange("contact_person_email", e.target.value)}
                    placeholder="max@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person_phone">Telefon</Label>
                  <Input
                    id="contact_person_phone"
                    value={formData.contact_person_phone || ""}
                    onChange={(e) => handleChange("contact_person_phone", e.target.value)}
                    placeholder="+41 44 123 45 67"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Wichtige Infos (optional)</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Alles hier ist optional – hilft aber im CRM.</div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="vat_id">UID / MWST</Label>
                  <Input
                    id="vat_id"
                    value={formData.vat_id || ""}
                    onChange={(e) => handleChange("vat_id", e.target.value)}
                    placeholder="CHE-123.456.789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead_source">Lead Source</Label>
                  <Input
                    id="lead_source"
                    value={formData.lead_source || ""}
                    onChange={(e) => handleChange("lead_source", e.target.value)}
                    placeholder="Website, Empfehlung, Event…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorität</Label>
                  <Select
                    value={String(formData.priority || "medium")}
                    onValueChange={(v) => handleChange("priority", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priorität wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_follow_up_at">Next Follow-up</Label>
                  <Input
                    id="next_follow_up_at"
                    type="date"
                    value={formData.next_follow_up_at || ""}
                    onChange={(e) => handleChange("next_follow_up_at", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    value={formData.linkedin_url || ""}
                    onChange={(e) => handleChange("linkedin_url", e.target.value)}
                    placeholder="https://www.linkedin.com/company/…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags || ""}
                    onChange={(e) => handleChange("tags", e.target.value)}
                    placeholder="retail, b2b, newsletter"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Street, City, ZIP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional information..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Speichern…" : company?.id ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

