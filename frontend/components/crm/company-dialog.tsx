"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { companiesAPI } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { FormField } from "@/components/ui/form-field"
import { Building2, UserRound, BadgeCheck, MapPin, Tag } from "lucide-react"

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
      <DialogContent className="w-[min(92vw,780px)] sm:max-w-[780px]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-900 dark:text-white text-base sm:text-lg font-semibold leading-tight">
                  {company?.id ? "Unternehmen bearbeiten" : "Neues Unternehmen"}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  Firmendetails, Kontaktperson und CRM-Metadaten
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/5 dark:bg-slate-950/30 p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Firmendetails</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">Basisdaten fürs CRM.</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField id="name" label="Unternehmen" required hint="So erscheint es im CRM & in Reports.">
                  {({ describedBy, invalid }) => (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                      placeholder="AlpenBerg Outdoor AG"
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>

                <FormField id="industry" label="Industry / Branche">
                  {({ describedBy, invalid }) => (
                    <Input
                      id="industry"
                      value={formData.industry || ""}
                      onChange={(e) => handleChange("industry", e.target.value)}
                      placeholder="Outdoor & Retail"
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <FormField id="email" label="E-Mail">
                  {({ describedBy, invalid }) => (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="info@unternehmen.ch"
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>
                <FormField id="phone" label="Telefon">
                  {({ describedBy, invalid }) => (
                    <Input
                      id="phone"
                      value={formData.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+41 44 555 12 10"
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <FormField id="website" label="Website">
                  {({ describedBy, invalid }) => (
                    <Input
                      id="website"
                      type="url"
                      value={formData.website || ""}
                      onChange={(e) => handleChange("website", e.target.value)}
                      placeholder="https://…"
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>
                <FormField id="status" label="Status">
                  {({ describedBy, invalid }) => (
                    <Select value={String(formData.status || "prospect")} onValueChange={(v) => handleChange("status", v)}>
                      <SelectTrigger aria-describedby={describedBy} aria-invalid={invalid || undefined}>
                        <SelectValue placeholder="Status wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/5 dark:bg-slate-950/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <BadgeCheck className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">KPIs & Größe</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">Optional – hilft beim Scoring.</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField id="employees" label="Employees">
                  {({ describedBy, invalid }) => (
                    <Input
                      id="employees"
                      type="number"
                      value={formData.employees ?? ""}
                      onChange={(e) => handleChange("employees", e.target.value === "" ? undefined : parseInt(e.target.value) || 0)}
                      min="0"
                      placeholder="z.B. 42"
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>
                <FormField id="revenue" label="Revenue (CHF)" hint="Nur Zahl, ohne Punkte/Komma.">
                  {({ describedBy, invalid }) => (
                    <Input
                      id="revenue"
                      type="number"
                      value={formData.revenue ?? ""}
                      onChange={(e) => handleChange("revenue", e.target.value === "" ? undefined : parseInt(e.target.value) || 0)}
                      min="0"
                      step="1000"
                      placeholder="z.B. 4200000"
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/5 dark:bg-slate-950/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <UserRound className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Kontaktperson</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Optional – wenn du später mehrere Kontakte pflegen willst, nutze den Tab <span className="font-medium">Kontakte</span>.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField id="contact_person_name" label="Name">
                  {({ describedBy, invalid }) => (
                    <Input
                      id="contact_person_name"
                      value={formData.contact_person_name || ""}
                      onChange={(e) => handleChange("contact_person_name", e.target.value)}
                      placeholder="Nina Keller"
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>
                <FormField id="contact_person_position" label="Position">
                  {({ describedBy, invalid }) => (
                    <Input
                      id="contact_person_position"
                      value={formData.contact_person_position || ""}
                      onChange={(e) => handleChange("contact_person_position", e.target.value)}
                      placeholder="Marketing Lead"
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>
                <FormField id="contact_person_email" label="E-Mail">
                  {({ describedBy, invalid }) => (
                    <Input
                      id="contact_person_email"
                      type="email"
                      value={formData.contact_person_email || ""}
                      onChange={(e) => handleChange("contact_person_email", e.target.value)}
                      placeholder="nina@unternehmen.ch"
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>
                <FormField id="contact_person_phone" label="Telefon">
                  {({ describedBy, invalid }) => (
                    <Input
                      id="contact_person_phone"
                      value={formData.contact_person_phone || ""}
                      onChange={(e) => handleChange("contact_person_phone", e.target.value)}
                      placeholder="+41 44 555 12 11"
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/5 dark:bg-slate-950/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <Tag className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Wichtige Infos</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">Alles optional – hilft aber im CRM.</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField id="vat_id" label="UID / MWST">
                  {({ describedBy, invalid }) => (
                    <Input id="vat_id" value={formData.vat_id || ""} onChange={(e) => handleChange("vat_id", e.target.value)} placeholder="CHE-123.456.789" aria-describedby={describedBy} aria-invalid={invalid || undefined} />
                  )}
                </FormField>
                <FormField id="lead_source" label="Lead Source">
                  {({ describedBy, invalid }) => (
                    <Input id="lead_source" value={formData.lead_source || ""} onChange={(e) => handleChange("lead_source", e.target.value)} placeholder="Website, Empfehlung, Event…" aria-describedby={describedBy} aria-invalid={invalid || undefined} />
                  )}
                </FormField>
                <FormField id="priority" label="Priorität">
                  {({ describedBy, invalid }) => (
                    <Select value={String(formData.priority || "medium")} onValueChange={(v) => handleChange("priority", v)}>
                      <SelectTrigger aria-describedby={describedBy} aria-invalid={invalid || undefined}>
                        <SelectValue placeholder="Priorität wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
                <FormField id="next_follow_up_at" label="Next Follow-up">
                  {({ describedBy, invalid }) => (
                    <Input id="next_follow_up_at" type="date" value={formData.next_follow_up_at || ""} onChange={(e) => handleChange("next_follow_up_at", e.target.value)} aria-describedby={describedBy} aria-invalid={invalid || undefined} />
                  )}
                </FormField>
                <FormField id="linkedin_url" label="LinkedIn">
                  {({ describedBy, invalid }) => (
                    <Input id="linkedin_url" type="url" value={formData.linkedin_url || ""} onChange={(e) => handleChange("linkedin_url", e.target.value)} placeholder="https://www.linkedin.com/company/…" aria-describedby={describedBy} aria-invalid={invalid || undefined} />
                  )}
                </FormField>
                <FormField id="tags" label="Tags" hint="Kommagetrennt, z.B. retail, b2b, newsletter.">
                  {({ describedBy, invalid }) => (
                    <Input id="tags" value={formData.tags || ""} onChange={(e) => handleChange("tags", e.target.value)} placeholder="retail, b2b, newsletter" aria-describedby={describedBy} aria-invalid={invalid || undefined} />
                  )}
                </FormField>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/5 dark:bg-slate-950/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Adresse</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">Optional – für Rechnungen / Einordnung.</div>
                </div>
              </div>
              <FormField id="address" label="Address">
                {({ describedBy, invalid }) => (
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Bahnhofstrasse 12, 8001 Zürich"
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                  />
                )}
              </FormField>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/5 dark:bg-slate-950/30 p-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Notizen</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">Alles, was beim nächsten Follow-up hilft.</div>
              <div className="mt-3">
                <FormField id="notes" label="Notes">
                  {({ describedBy, invalid }) => (
                    <Textarea
                      id="notes"
                      value={formData.notes || ""}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      placeholder="z.B. Entscheider, Timing, Einwände…"
                      rows={4}
                      aria-describedby={describedBy}
                      aria-invalid={invalid || undefined}
                    />
                  )}
                </FormField>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-11 border-white/15 bg-white/50 hover:bg-white/70 dark:bg-slate-950/20 dark:hover:bg-slate-950/30"
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading} className="h-11 bg-white text-slate-900 hover:bg-white/90 dark:bg-white dark:text-slate-900">
              {loading ? "Speichern…" : company?.id ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

