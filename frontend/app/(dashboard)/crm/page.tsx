"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  DollarSign, 
  Filter, 
  Target, 
  MoreHorizontal, 
  Eye, 
  X,
  Briefcase,
  UserCheck,
  Percent
} from "lucide-react"
import { companiesAPI, contactsAPI, dealsAPI } from "@/lib/api"
import { sync } from "@/lib/sync"
import { CompanyDialog } from "@/components/crm/company-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"

function ContactDetailForm({
  contact,
  companies,
  onClose,
  onSave,
}: {
  contact: any
  companies: any[]
  onClose: () => void
  onSave: (updates: any) => Promise<void>
}) {
  const fullName = String(contact.name || "").trim()
  const parts = fullName.split(/\s+/).filter(Boolean)
  const initialFirst = parts[0] || ""
  const initialLast = parts.slice(1).join(" ") || parts[0] || ""

  const [firstName, setFirstName] = useState(initialFirst)
  const [lastName, setLastName] = useState(initialLast)
  const [email, setEmail] = useState(String(contact.email || ""))
  const [phone, setPhone] = useState(String(contact.phone || ""))
  const [position, setPosition] = useState(String(contact.position || ""))
  const [companyId, setCompanyId] = useState<string>(
    contact.company_id != null ? String(contact.company_id) : "none",
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await onSave({
        first_name: firstName.trim(),
        last_name: lastName.trim() || firstName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        position: position.trim() || undefined,
        company_id: companyId !== "none" ? Number(companyId) : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const initials =
    `${firstName} ${lastName}`
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 mb-2">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-semibold text-white">
          {initials}
        </div>
        <div>
          <DialogTitle>
            <span className="text-base sm:text-lg">{(`${firstName} ${lastName}`.trim() || "Kontakt")}</span>
          </DialogTitle>
          <DialogDescription>
            <span className="text-xs sm:text-sm">Kontaktdetails bearbeiten</span>
          </DialogDescription>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Vorname</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Nachname</label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">E-Mail</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Telefon</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Firma</label>
          <Select value={companyId} onValueChange={(v) => setCompanyId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Firma wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Keine —</SelectItem>
              {companies.map((c: any) => (
                <SelectItem key={String(c.id)} value={String(c.id)}>
                  {String(c.name || "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Position</label>
          <Input value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Abbrechen
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={saving}>
          Speichern
        </Button>
      </div>
    </div>
  )
}

function ContactCreateDialog({
  open,
  onOpenChange,
  companies,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: any[]
  onCreate: (payload: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
    position?: string
    company_id?: number
  }) => Promise<void>
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [position, setPosition] = useState("")
  const [companyId, setCompanyId] = useState<string>("none")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
    setPosition("")
    setCompanyId("none")
    setSaving(false)
    setError(null)
  }, [open])

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      await onCreate({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        position: position.trim() || undefined,
        company_id: companyId !== "none" ? Number(companyId) : undefined,
      })
      onOpenChange(false)
    } catch (e: any) {
      setError(e?.message || "Speichern fehlgeschlagen")
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0 && !saving

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[min(92vw,640px)] bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 backdrop-blur-xl p-6">
        <DialogHeader>
          <DialogTitle>Neuen Kontakt</DialogTitle>
          <DialogDescription>Kontaktdaten erfassen und optional einer Firma zuordnen.</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Vorname *</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Max" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Nachname *</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Mustermann" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">E-Mail</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="max@company.com" type="email" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Telefon</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+41 44 123 45 67" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Position</label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Marketing Manager" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Firma</label>
            <Select value={companyId} onValueChange={(v) => setCompanyId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Firma wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Keine —</SelectItem>
                {companies.map((c: any) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {String(c.name || "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={submit} disabled={!canSubmit} className="bg-gradient-to-r from-blue-600 to-indigo-600">
            {saving ? "Speichern…" : "Kontakt erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DealCreateDialog({
  open,
  onOpenChange,
  companies,
  contacts,
  defaultOwner,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: any[]
  contacts: any[]
  defaultOwner: string
  onCreate: (payload: {
    title: string
    owner: string
    stage: string
    probability?: number
    value?: number
    expected_close_date?: string
    company_id?: number
    contact_id?: number
    notes?: string
  }) => Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [owner, setOwner] = useState(defaultOwner)
  const [stage, setStage] = useState("lead")
  const [probability, setProbability] = useState<string>("25")
  const [value, setValue] = useState<string>("")
  const [expectedClose, setExpectedClose] = useState<string>("")
  const [companyId, setCompanyId] = useState<string>("none")
  const [contactId, setContactId] = useState<string>("none")
  const [notes, setNotes] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle("")
    setOwner(defaultOwner)
    setStage("lead")
    setProbability("25")
    setValue("")
    setExpectedClose("")
    setCompanyId("none")
    setContactId("none")
    setNotes("")
    setSaving(false)
    setError(null)
  }, [open, defaultOwner])

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      await onCreate({
        title: title.trim(),
        owner: owner.trim() || defaultOwner,
        stage,
        probability: probability.trim() === "" ? undefined : Math.max(0, Math.min(100, Number(probability) || 0)),
        value: value.trim() === "" ? undefined : Math.max(0, Number(value) || 0),
        expected_close_date: expectedClose ? new Date(expectedClose).toISOString() : undefined,
        company_id: companyId !== "none" ? Number(companyId) : undefined,
        contact_id: contactId !== "none" ? Number(contactId) : undefined,
        notes: notes.trim() || undefined,
      })
      onOpenChange(false)
    } catch (e: any) {
      setError(e?.message || "Speichern fehlgeschlagen")
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = title.trim().length > 0 && owner.trim().length > 0 && !saving

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[min(92vw,820px)] bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 backdrop-blur-xl p-6">
        <DialogHeader>
          <DialogTitle>Neuen Deal</DialogTitle>
          <DialogDescription>Deal erfassen (Stage, Wert, Wahrscheinlichkeit, Owner).</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Titel *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Jahresvertrag Q1" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Firma</label>
            <Select value={companyId} onValueChange={(v) => setCompanyId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Firma wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Keine —</SelectItem>
                {companies.map((c: any) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {String(c.name || "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Kontakt</label>
            <Select value={contactId} onValueChange={(v) => setContactId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Kontakt wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Keiner —</SelectItem>
                {contacts.map((c: any) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {String(c.name || "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Stage</label>
            <Select value={stage} onValueChange={(v) => setStage(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Stage wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Owner *</label>
            <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="owner@email.com" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Wert (CHF)</label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" min="0" placeholder="50000" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Wahrscheinlichkeit (%)</label>
            <Input
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              type="number"
              min="0"
              max="100"
              placeholder="25"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Close Date</label>
            <Input value={expectedClose} onChange={(e) => setExpectedClose(e.target.value)} type="date" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Notizen</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Kontext, nächste Schritte…" rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={submit} disabled={!canSubmit} className="bg-gradient-to-r from-blue-600 to-indigo-600">
            {saving ? "Speichern…" : "Deal erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Company = any
type Contact = any
type Deal = any

export default function CRMPage() {
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("companies")
  const [filters, setFilters] = useState<string[]>([])
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)
  const [createContactOpen, setCreateContactOpen] = useState(false)
  const [createDealOpen, setCreateDealOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const [c, p, d] = await Promise.all([
          companiesAPI.getAll().catch(() => []),
          contactsAPI.getAll().catch(() => []),
          dealsAPI.getAll().catch(() => []),
        ])
        setCompanies(Array.isArray(c) ? c : [])
        setContacts(Array.isArray(p) ? p : [])
        setDeals(Array.isArray(d) ? d : [])
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Handlers: create entities
  const refreshAll = async () => {
    const [c, p, d] = await Promise.all([
      companiesAPI.getAll().catch(() => []),
      contactsAPI.getAll().catch(() => []),
      dealsAPI.getAll().catch(() => []),
    ])
    setCompanies(Array.isArray(c) ? c : [])
    setContacts(Array.isArray(p) ? p : [])
    setDeals(Array.isArray(d) ? d : [])
  }

  const deleteCompany = async (id: string) => {
    try {
      if (typeof window !== 'undefined' && !confirm('Unternehmen löschen?')) return
      await companiesAPI.delete(id).catch(() => {})
      await refreshAll()
      sync.emit('crm:companies:changed')
    } catch {}
  }

  const createContact = async (payload: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
    position?: string
    company_id?: number
  }) => {
    await contactsAPI.create(payload)
    await refreshAll()
    sync.emit("crm:contacts:changed")
    toast({ title: "✅ Kontakt erstellt" })
  }

  const updateContact = async (original: any, updates: any) => {
    try {
      const first = String(updates?.first_name ?? "").trim()
      const last = String(updates?.last_name ?? "").trim() || first

      const payload: any = {
        first_name: first || undefined,
        last_name: last || undefined,
        email: String(updates?.email ?? "").trim() || undefined,
        phone: String(updates?.phone ?? "").trim() || undefined,
        position: String(updates?.position ?? "").trim() || undefined,
        company_id: updates?.company_id != null ? Number(updates.company_id) : undefined,
      }

      await contactsAPI.update(String(original.id), payload)
      await refreshAll()
      sync.emit("crm:contacts:changed")
      toast({ title: "✅ Kontakt aktualisiert" })
      return true
    } catch (err) {
      console.error("updateContact error", err)
      toast({
        title: "Fehler beim Aktualisieren des Kontakts",
        description: (err as any)?.message || "Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      })
      return false
    }
  }

  const createDeal = async (payload: {
    title: string
    owner: string
    stage: string
    probability?: number
    value?: number
    expected_close_date?: string
    company_id?: number
    contact_id?: number
    notes?: string
  }) => {
    await dealsAPI.create(payload)
    await refreshAll()
    sync.emit("crm:deals:changed")
    toast({ title: "✅ Deal erstellt" })
  }

  const removeFilter = (filter: string) => {
    setFilters(prev => prev.filter(f => f !== filter))
  }

  const addFilter = (filter: string) => {
    if (!filters.includes(filter)) {
      setFilters(prev => [...prev, filter])
    }
  }

  // Calculate KPIs
  const totalPipeline = deals.reduce((sum: number, deal: any) => sum + (Number(deal.value) || 0), 0)
  const activeDeals = deals.filter((deal: any) => deal.stage !== 'won' && deal.stage !== 'lost').length
  const wonDeals = deals.filter((deal: any) => deal.stage === 'won').length
  const conversionRate = deals.length > 0 ? Math.round((wonDeals / deals.length) * 100) : 0

  const companyById = useMemo(() => {
    const m = new Map<number, any>()
    for (const c of companies) {
      const id = Number((c as any)?.id)
      if (!Number.isFinite(id)) continue
      m.set(id, c)
    }
    return m
  }, [companies])

  const contactById = useMemo(() => {
    const m = new Map<number, any>()
    for (const c of contacts) {
      const id = Number((c as any)?.id)
      if (!Number.isFinite(id)) continue
      m.set(id, c)
    }
    return m
  }, [contacts])

  const contactsCountByCompanyId = useMemo(() => {
    const m = new Map<number, number>()
    for (const c of contacts) {
      const cid = Number((c as any)?.company_id)
      if (!Number.isFinite(cid)) continue
      m.set(cid, (m.get(cid) || 0) + 1)
    }
    return m
  }, [contacts])

  const dealsAggByCompanyId = useMemo(() => {
    const m = new Map<number, { count: number; pipeline: number }>()
    for (const d of deals) {
      const cid = Number((d as any)?.company_id)
      if (!Number.isFinite(cid)) continue
      const prev = m.get(cid) || { count: 0, pipeline: 0 }
      prev.count += 1
      prev.pipeline += Number((d as any)?.value) || 0
      m.set(cid, prev)
    }
    return m
  }, [deals])

  const dealsAggByContactId = useMemo(() => {
    const m = new Map<number, { count: number; pipeline: number }>()
    for (const d of deals) {
      const cid = Number((d as any)?.contact_id)
      if (!Number.isFinite(cid)) continue
      const prev = m.get(cid) || { count: 0, pipeline: 0 }
      prev.count += 1
      prev.pipeline += Number((d as any)?.value) || 0
      m.set(cid, prev)
    }
    return m
  }, [deals])

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const hasStatusFilter = filters.includes("Status")
    const hasIndustryFilter = filters.includes("Branche")
    const hasOwnerFilter = filters.includes("Owner")

    return companies.filter((company: any) => {
      const name = String(company.name || "").toLowerCase()
      const industry = String(company.industry || "").toLowerCase()
      const website = String(company.website || "").toLowerCase()
      const email = String(company.email || "").toLowerCase()
      const contact = String(company.contact_person_name || "").toLowerCase()
      const vat = String(company.vat_id || "").toLowerCase()
      const lead = String(company.lead_source || "").toLowerCase()
      const tags = String(company.tags || "").toLowerCase()

      const matchesSearch =
        !q ||
        name.includes(q) ||
        industry.includes(q) ||
        website.includes(q) ||
        email.includes(q) ||
        contact.includes(q) ||
        vat.includes(q) ||
        lead.includes(q) ||
        tags.includes(q)
      if (!matchesSearch) return false

      // Simple, easy-to-understand filters:
      if (hasStatusFilter) {
        const status = String(company.status || "active").toLowerCase()
        if (status !== "active") return false
      }
      if (hasIndustryFilter && !industry) return false
      if (hasOwnerFilter && !email && !website) return false

      return true
    })
  }, [companies, searchQuery, filters])

  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return contacts
    return contacts.filter((contact: any) => {
      const name = String(contact.name || "").toLowerCase()
      const email = String(contact.email || "").toLowerCase()
      const phone = String(contact.phone || "").toLowerCase()
      const position = String(contact.position || "").toLowerCase()
      const companyName = String(companyById.get(Number(contact.company_id))?.name || "").toLowerCase()
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        position.includes(q) ||
        companyName.includes(q)
      )
    })
  }, [contacts, searchQuery, companyById])

  const filteredDeals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return deals
    return deals.filter((deal: any) => {
      const title = String(deal.title || "").toLowerCase()
      const stage = String(deal.stage || "").toLowerCase()
      const owner = String(deal.owner || "").toLowerCase()
      const companyName = String(companyById.get(Number(deal.company_id))?.name || "").toLowerCase()
      const contactName = String(contactById.get(Number(deal.contact_id))?.name || "").toLowerCase()
      return title.includes(q) || stage.includes(q) || owner.includes(q) || companyName.includes(q) || contactName.includes(q)
    })
  }, [deals, searchQuery, companyById, contactById])

  const getStatusColor = (status: string) => {
    switch (String(status).toLowerCase()) {
      case 'active': return 'bg-green-500/15 text-green-400 border-green-500/30'
      case 'pending': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
      case 'inactive': return 'bg-red-500/15 text-red-400 border-red-500/30'
      case 'hot': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'warm': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'cold': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'prospect': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getStageColor = (stage: string) => {
    const s = String(stage).toLowerCase()
    switch (s) {
      case 'qualification': return 'bg-blue-500/20 text-blue-400'
      case 'proposal': return 'bg-purple-500/20 text-purple-400'
      case 'negotiation': return 'bg-orange-500/20 text-orange-400'
      case 'won': return 'bg-green-500/20 text-green-400'
      case 'lead': return 'bg-blue-500/20 text-blue-400'
      case 'qualified': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0b1020] dark:via-[#0a0f1c] dark:to-[#070b16]">
      {/* Header Section */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 dark:bg-[#0b101a]/70 border-b border-slate-200 dark:border-slate-800/60">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 dark:from-blue-500/40 dark:to-purple-600/40 border border-blue-200/50 dark:border-white/10 shadow-lg shadow-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600 dark:text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">CRM</h1>
                {loading && (
                  <Badge className="bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-200 border-slate-300/50 dark:border-white/10">
                    Lädt…
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">Schneller Aufbau Ihrer Datenbasis</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200/50 dark:border-blue-800/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-blue-600 dark:text-blue-400">Total Pipeline</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">CHF {(totalPipeline / 1000).toFixed(0)}K</p>
                  </div>
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200/50 dark:border-green-800/30 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 group">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-green-600 dark:text-green-400">Active Deals</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-900 dark:text-green-100">{activeDeals}</p>
                  </div>
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 dark:text-green-400 group-hover:scale-110 transition-transform shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200/50 dark:border-purple-800/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-purple-600 dark:text-purple-400">Won Deals</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-100">{wonDeals}</p>
                  </div>
                  <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 dark:text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200/50 dark:border-orange-800/30 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 group">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-orange-600 dark:text-orange-400">Conversion Rate</p>
                    <p className="text-lg sm:text-2xl font-bold text-orange-900 dark:text-orange-100">{conversionRate}%</p>
                  </div>
                  <Percent className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-24 md:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Tabs Navigation - scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList
              className="glass-card border rounded-xl p-1 inline-flex gap-1 sm:gap-2 min-w-max"
              data-tour="crm-tabs"
            >
              <TabsTrigger 
                value="companies" 
                className="data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-800/80 data-[state=active]:shadow-sm rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Companies</span>
                <span className="xs:hidden">Firmen</span>
                <span className="ml-1">({companies.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="contacts" 
                className="data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-800/80 data-[state=active]:shadow-sm rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Contacts</span>
                <span className="xs:hidden">Kontakte</span>
                <span className="ml-1">({contacts.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="deals" 
                className="data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-800/80 data-[state=active]:shadow-sm rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Deals
                <span className="ml-1">({deals.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* COMPANIES TAB */}
          <TabsContent value="companies" className="space-y-4 sm:space-y-6">
            {/* Create Company (opens dialog) */}
            <Card className="glass-card">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Unternehmen</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Neues Unternehmen mit erweiterten Feldern anlegen (Branche, Status, Adresse, Umsatz, Notizen).
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setEditingCompany({} as any)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Unternehmen
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search & Filter Bar */}
            <div className="flex flex-col gap-3">
              <div className="relative" data-tour="crm-search">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="🔍 Suchen…" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-10 h-10 glass-card bg-white/60 dark:bg-slate-900/50 border-white/20 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 text-sm" 
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addFilter('Status')}
                  className="glass-card h-8 text-xs sm:text-sm"
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  Status
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addFilter('Branche')}
                  className="glass-card h-8 text-xs sm:text-sm"
                >
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  Branche
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addFilter('Owner')}
                  className="glass-card h-8 text-xs sm:text-sm"
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                  Owner
                </Button>
              </div>
            </div>

            {/* Filter Tags */}
            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Badge 
                    key={filter} 
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700 px-3 py-1"
                  >
                    {filter}
                    <button 
                      onClick={() => removeFilter(filter)}
                      className="ml-2 hover:text-blue-600 dark:hover:text-blue-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Companies List */}
            {filteredCompanies.length === 0 ? (
              <Card className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
                <CardContent className="p-12 text-center">
                  <div className="text-6xl mb-4">🏢</div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Noch keine Unternehmen
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Beginnen Sie mit dem Hinzufügen Ihres ersten Unternehmens.
                  </p>
                  <Button 
                    onClick={() => setEditingCompany({} as any)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    + Neues Unternehmen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4" data-tour="crm-table">
                {filteredCompanies.map((company: any) => (
                  <Card key={company.id} className="glass-card hover:border-blue-500/30 transition-all group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-md shadow-blue-500/20">
                            <Building2 className="h-7 w-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{company.name}</h3>
                              <Badge className={`${getStatusColor(company.status || 'active')} border px-2 py-0.5 capitalize`}>
                                {company.status || 'active'}
                              </Badge>
                            </div>
                            {/* aligned columns: 4 cols grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-12 gap-4 mt-4">
                              <div className="sm:col-span-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Industry</p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">{company.industry || '—'}</p>
                              </div>
                              <div className="sm:col-span-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Address</p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">{company.address || '—'}</p>
                              </div>
                              <div className="sm:col-span-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Contacts</p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">
                                  {contactsCountByCompanyId.get(Number(company.id)) || 0}
                                </p>
                              </div>
                              <div className="sm:col-span-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pipeline</p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">
                                  CHF {(((dealsAggByCompanyId.get(Number(company.id))?.pipeline || 0) as number) / 1000).toFixed(0)}K{" "}
                                  <span className="text-slate-500 dark:text-slate-400">
                                    · {(dealsAggByCompanyId.get(Number(company.id))?.count || 0) as number} deals
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            onClick={()=> setViewingCompany(company)}
                            aria-label="view-company"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 dark:hover:text-white" aria-label="company-actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={()=> setViewingCompany(company)}>
                                Details anzeigen
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={()=> setEditingCompany(company)}>
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={()=> deleteCompany(String(company.id))}>
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

        {/* Company view dialog */}
        <Dialog open={!!viewingCompany} onOpenChange={(o: boolean)=>{ if (!o) setViewingCompany(null) }}>
          <DialogContent className="max-w-2xl w-[min(90vw,720px)] bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 backdrop-blur-xl p-6">
            {viewingCompany && (
              <>
                {/* Header with avatar and status */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <DialogTitle>{viewingCompany.name}</DialogTitle>
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
                        {viewingCompany.status || 'active'}
                      </Badge>
                    </div>
                    <DialogDescription>Firmendetails</DialogDescription>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">Industry</div>
                    <div className="font-medium">{viewingCompany.industry || '—'}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">Website</div>
                    <div className="font-medium break-all">
                      {viewingCompany.website ? (
                        <a href={viewingCompany.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                          {viewingCompany.website}
                        </a>
                      ) : '—'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">E-Mail</div>
                    <div className="font-medium break-all">{viewingCompany.email || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">Telefon</div>
                    <div className="font-medium">{viewingCompany.phone || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 col-span-2">
                    <div className="text-slate-400 mb-1">Address</div>
                    <div className="font-medium whitespace-pre-wrap">{viewingCompany.address || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 col-span-2">
                    <div className="text-slate-400 mb-1">Kontaktperson</div>
                    <div className="font-medium">
                      {viewingCompany.contact_person_name || "—"}
                      {viewingCompany.contact_person_position ? (
                        <span className="text-slate-500 dark:text-slate-400"> · {viewingCompany.contact_person_position}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>{viewingCompany.contact_person_email || "—"}</span>
                      <span>{viewingCompany.contact_person_phone || "—"}</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">Employees</div>
                    <div className="font-medium">{viewingCompany.employees ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">Revenue (CHF)</div>
                    <div className="font-medium">{viewingCompany.revenue ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">UID / MWST</div>
                    <div className="font-medium break-all">{viewingCompany.vat_id || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">Lead Source</div>
                    <div className="font-medium">{viewingCompany.lead_source || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">Priorität</div>
                    <div className="font-medium capitalize">{viewingCompany.priority || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">Next Follow-up</div>
                    <div className="font-medium">
                      {viewingCompany.next_follow_up_at ? new Date(viewingCompany.next_follow_up_at).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 col-span-2">
                    <div className="text-slate-400 mb-1">LinkedIn</div>
                    <div className="font-medium break-all">
                      {viewingCompany.linkedin_url ? (
                        <a href={viewingCompany.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                          {viewingCompany.linkedin_url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 col-span-2">
                    <div className="text-slate-400 mb-1">Tags</div>
                    <div className="font-medium whitespace-pre-wrap">{viewingCompany.tags || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">Contacts</div>
                    <div className="font-medium">{contactsCountByCompanyId.get(Number(viewingCompany.id)) || 0}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1">Pipeline</div>
                    <div className="font-medium">
                      CHF {(((dealsAggByCompanyId.get(Number(viewingCompany.id))?.pipeline || 0) as number) / 1000).toFixed(0)}K{" "}
                      <span className="text-slate-500 dark:text-slate-400">
                        · {(dealsAggByCompanyId.get(Number(viewingCompany.id))?.count || 0) as number} deals
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 col-span-2">
                    <div className="text-slate-400 mb-1">Notizen</div>
                    <div className="font-medium whitespace-pre-wrap">{viewingCompany.notes || "—"}</div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="mt-5 flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={()=> setViewingCompany(null)}>Schließen</Button>
                  <Button onClick={() => { setEditingCompany(viewingCompany); setViewingCompany(null) }}>
                    Bearbeiten
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Contact view & edit dialog */}
        <Dialog open={!!viewingContact} onOpenChange={(o:boolean)=>{ if (!o) setViewingContact(null) }}>
          <DialogContent className="max-w-lg w-[min(90vw,560px)] bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 backdrop-blur-xl p-6">
            {viewingContact && (
              <ContactDetailForm
                contact={viewingContact}
                companies={companies}
                onClose={()=> setViewingContact(null)}
                onSave={async (updates)=> {
                  const ok = await updateContact(viewingContact, updates)
                  if (ok) setViewingContact(null)
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Company edit dialog */}
        <CompanyDialog
          open={!!editingCompany}
          onOpenChange={(o)=>{ if (!o) setEditingCompany(null) }}
          company={editingCompany}
          onSuccess={async ()=>{ setEditingCompany(null); await refreshAll(); sync.emit('crm:companies:changed') }}
        />

        <ContactCreateDialog
          open={createContactOpen}
          onOpenChange={setCreateContactOpen}
          companies={companies}
          onCreate={createContact}
        />

        <DealCreateDialog
          open={createDealOpen}
          onOpenChange={setCreateDealOpen}
          companies={companies}
          contacts={contacts}
          defaultOwner={(user as any)?.email || (user as any)?.name || "Unbekannter Besitzer"}
          onCreate={createDeal}
        />

          {/* CONTACTS TAB */}
          <TabsContent value="contacts" className="space-y-4 sm:space-y-6">
            {/* Create Contact (opens dialog) */}
            <Card className="glass-card">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Kontakte</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Kontakt per Dialog anlegen (Vorname/Nachname, Position, Firma, E-Mail, Telefon).
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCreateContactOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Neuer Kontakt
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contacts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact: any) => (
                <Card key={contact.id} className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all shadow-sm hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                        {String(contact.name || '?').split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{contact.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{contact.position || '—'}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {companyById.get(Number(contact.company_id))?.name || '—'}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="h-3 w-3" />
                        {contact.email || '—'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Phone className="h-3 w-3" />
                        {contact.phone || '—'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Pipeline</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          CHF {(((dealsAggByContactId.get(Number(contact.id))?.pipeline || 0) as number) / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Deals</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {(dealsAggByContactId.get(Number(contact.id))?.count || 0) as number}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => setViewingContact(contact)}
                        aria-label="view-contact"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* DEALS TAB */}
          <TabsContent value="deals" className="space-y-4 sm:space-y-6">
            {/* Create Deal (opens dialog) */}
            <Card className="glass-card">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center shrink-0">
                    <Target className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Deals</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Deal per Dialog anlegen (Stage, Wert, Wahrscheinlichkeit, Owner, Close Date, Notizen).
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCreateDealOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Neuer Deal
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Deals List */}
            <div className="space-y-3">
              {filteredDeals.map((deal: any) => (
                <Card key={deal.id} className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all shadow-sm hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{deal.title}</h3>
                            <Badge className={getStageColor(deal.stage)}>{deal.stage}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-4">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Value</p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">CHF {((Number(deal.value) || 0) / 1000).toFixed(0)}K</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Probability</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Number(deal.probability) || 0}%` }} />
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-300">{Number(deal.probability) || 0}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Company</p>
                              <p className="text-sm text-slate-700 dark:text-slate-200">
                                {companyById.get(Number(deal.company_id))?.name || '—'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {contactById.get(Number(deal.contact_id))?.name || '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Close Date</p>
                              <p className="text-sm text-slate-700 dark:text-slate-200">
                                {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Owner</p>
                              <p className="text-sm text-slate-700 dark:text-slate-200">{deal.owner || '—'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}




