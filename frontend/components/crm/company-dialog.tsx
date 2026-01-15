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
                    handleChange("revenue", e.target.value === "" ? undefined : parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="1000"
                />
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

