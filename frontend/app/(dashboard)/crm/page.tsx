"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
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
  TrendingUp, 
  Calendar, 
  MapPin,
  CheckCircle,
  AlertCircle,
  X,
  Globe,
  Briefcase,
  UserCheck,
  Percent
} from "lucide-react"
import { companiesAPI, contactsAPI, dealsAPI, authFetch } from "@/lib/api"
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
  const [name, setName] = useState(String(contact.name || ""))
  const [email, setEmail] = useState(String(contact.email || ""))
  const [phone, setPhone] = useState(String(contact.phone || ""))
  const [company, setCompany] = useState(String(contact.company || ""))
  const [title, setTitle] = useState(String(contact.title || ""))
  const [saving, setSaving] = useState(false)

  const companyOptions = useMemo(
    () => companies.map((c: any) => String(c.name || "")).filter(Boolean),
    [companies],
  )

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await onSave({
        name,
        email,
        phone,
        company,
        title,
      })
    } finally {
      setSaving(false)
    }
  }

  const initials =
    name
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
            <span className="text-base sm:text-lg">{name || "Kontakt"}</span>
          </DialogTitle>
          <DialogDescription>
            <span className="text-xs sm:text-sm">Kontaktdetails bearbeiten</span>
          </DialogDescription>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">E-Mail</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Telefon</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Firma</label>
          <Input
            list="contact-company-options"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
          />
          <datalist id="contact-company-options">
            {companyOptions.map((name: string) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-300">Titel / Position</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
          />
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
  const { toast } = useToast()

  // Quick-add forms
  const [newCompany, setNewCompany] = useState<any>({ 
    name: "", 
    website: "", 
    email: "", 
    phone: "" 
  })
  const [newContact, setNewContact] = useState<any>({ 
    name: "", 
    email: "", 
    phone: "", 
    company: "", 
    title: "" 
  })
  const [newDeal, setNewDeal] = useState<any>({ 
    title: "", 
    company: "", 
    value: "", 
    probability: 50, 
    stage: "lead", 
    expected_close_date: "" 
  })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [validation, setValidation] = useState<Record<string, boolean>>({})
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

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case 'website':
        return value === '' || /^https?:\/\/.+/.test(value)
      case 'phone':
        return value === '' || /^[\+]?[0-9\s\-\(\)]+$/.test(value)
      default:
        return value.trim().length > 0
    }
  }

  const handleFieldBlur = (entity: string, field: string, value: string) => {
    const isValid = validateField(field, value)
    setValidation(prev => ({ ...prev, [`${entity}_${field}`]: isValid }))
  }

  const addCompany = async () => {
    const e: Record<string,string> = {}
    if (!newCompany.name?.trim()) e.name = 'Company name is required'
    if (newCompany.email && !validateField('email', newCompany.email)) e.email = 'Invalid email format'
    if (newCompany.website && !validateField('website', newCompany.website)) e.website = 'Invalid website URL'
    if (newCompany.phone && !validateField('phone', newCompany.phone)) e.phone = 'Invalid phone format'
    
    setErrors(e)
    if (Object.keys(e).length) return
    
    await companiesAPI.create(newCompany).catch(() => {})
    setNewCompany({ name: "", website: "", email: "", phone: "" })
    setValidation({})
    await refreshAll()
    sync.emit('crm:companies:changed')
    toast({ title: '✅ Company added successfully' })
  }

  const deleteCompany = async (id: string) => {
    try {
      if (typeof window !== 'undefined' && !confirm('Unternehmen löschen?')) return
      await companiesAPI.delete(id).catch(() => {})
      await refreshAll()
      sync.emit('crm:companies:changed')
    } catch {}
  }

  const addContact = async () => {
    const e: Record<string,string> = {}
    if (!newContact.name?.trim()) e.name = 'Contact name is required'
    if (newContact.email && !validateField('email', newContact.email)) e.email = 'Invalid email format'
    if (newContact.phone && !validateField('phone', newContact.phone)) e.phone = 'Invalid phone format'
    
    setErrors(e)
    if (Object.keys(e).length) return
    
    try {
      // Map full name to first/last name for backend schema
      const trimmed = String(newContact.name || "").trim()
      const [first, ...rest] = trimmed.split(/\s+/)
      const last = rest.join(" ") || first

      // Try to resolve company_id by name (best-effort)
      let companyId: number | undefined = undefined
      const companyName = String(newContact.company || "").trim().toLowerCase()
      if (companyName) {
        const match = companies.find((c: any) =>
          String(c.name || "").trim().toLowerCase() === companyName
        )
        if (match?.id) companyId = Number(match.id)
      }

      const payload: any = {
        first_name: first,
        last_name: last,
        email: newContact.email || undefined,
        phone: newContact.phone || undefined,
        position: newContact.title || undefined,
        company_id: companyId,
      }

      const res = await authFetch("/crm/contacts", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => "")
        console.error("Failed to create contact", res.status, detail)
        toast({
          title: "Kontakt konnte nicht gespeichert werden",
          description: `Server: ${res.status}`,
          variant: "destructive",
        })
        return
      }

      setNewContact({ name: "", email: "", phone: "", company: "", title: "" })
      setValidation({})
      await refreshAll()
      sync.emit("crm:contacts:changed")
      toast({ title: "✅ Kontakt hinzugefügt" })
    } catch (err) {
      console.error("addContact error", err)
      toast({
        title: "Fehler beim Speichern des Kontakts",
        description: "Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      })
    }
  }

  const updateContact = async (original: any, updates: any) => {
    try {
      const merged = { ...original, ...updates }
      const trimmed = String(merged.name || "").trim()
      const [first, ...rest] = trimmed.split(/\s+/)
      const last = rest.join(" ") || first

      // Resolve company_id by name (best-effort)
      let companyId: number | undefined = undefined
      const companyName = String(merged.company || "").trim().toLowerCase()
      if (companyName) {
        const match = companies.find((c: any) =>
          String(c.name || "").trim().toLowerCase() === companyName,
        )
        if (match?.id) companyId = Number(match.id)
      }

      const payload: any = {
        first_name: first,
        last_name: last,
        email: merged.email || undefined,
        phone: merged.phone || undefined,
        position: merged.title || undefined,
        company_id: companyId,
      }

      const res = await authFetch(`/crm/contacts/${original.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => "")
        console.error("Failed to update contact", res.status, detail)
        toast({
          title: "Kontakt konnte nicht aktualisiert werden",
          description: `Server: ${res.status}`,
          variant: "destructive",
        })
        return false
      }

      await refreshAll()
      sync.emit("crm:contacts:changed")
      toast({ title: "✅ Kontakt aktualisiert" })
      return true
    } catch (err) {
      console.error("updateContact error", err)
      toast({
        title: "Fehler beim Aktualisieren des Kontakts",
        description: "Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      })
      return false
    }
  }

  const addDeal = async () => {
    const e: Record<string,string> = {}
    if (!newDeal.title?.trim()) e.title = 'Deal title is required'
    
    setErrors(e)
    if (Object.keys(e).length) return
    
    try {
      // Normalize stage to allowed backend values
      const allowedStages = ["lead", "qualified", "proposal", "negotiation", "won", "lost"]
      let stage = String(newDeal.stage || "lead").toLowerCase()
      if (!allowedStages.includes(stage)) stage = "lead"

      // Resolve company_id by name (best-effort)
      let companyId: number | undefined = undefined
      const companyName = String(newDeal.company || "").trim().toLowerCase()
      if (companyName) {
        const match = companies.find((c: any) =>
          String(c.name || "").trim().toLowerCase() === companyName
        )
        if (match?.id) companyId = Number(match.id)
      }

      const ownerName =
        (user as any)?.email ||
        (user as any)?.name ||
        "Unbekannter Besitzer"

      const payload: any = {
        company_id: companyId,
        contact_id: undefined,
        title: newDeal.title.trim(),
        value: Number(newDeal.value) || 0,
        stage,
        probability: Number(newDeal.probability) || 0,
        expected_close_date: newDeal.expected_close_date
          ? new Date(newDeal.expected_close_date).toISOString()
          : undefined,
        owner: ownerName,
        notes: undefined,
      }

      const res = await authFetch("/crm/deals", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => "")
        console.error("Failed to create deal", res.status, detail)
        toast({
          title: "Deal konnte nicht gespeichert werden",
          description: `Server: ${res.status}`,
          variant: "destructive",
        })
        return
      }

      setNewDeal({
        title: "",
        company: "",
        value: "",
        probability: 50,
        stage: "lead",
        expected_close_date: "",
      })
      setValidation({})
      await refreshAll()
      sync.emit("crm:deals:changed")
      toast({ title: "✅ Deal hinzugefügt" })
    } catch (err) {
      console.error("addDeal error", err)
      toast({
        title: "Fehler beim Speichern des Deals",
        description: "Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      })
    }
  }

  const clearForm = (entity: string) => {
    switch (entity) {
      case 'company':
        setNewCompany({ name: "", website: "", email: "", phone: "" })
        break
      case 'contact':
        setNewContact({ name: "", email: "", phone: "", company: "", title: "" })
        break
      case 'deal':
        setNewDeal({ title: "", company: "", value: "", probability: 50, stage: "lead", expected_close_date: "" })
        break
    }
    setValidation({})
    setErrors({})
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

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const hasStatusFilter = filters.includes("Status")
    const hasIndustryFilter = filters.includes("Branche")
    const hasOwnerFilter = filters.includes("Owner")

    return companies.filter((company: any) => {
      const name = String(company.name || "").toLowerCase()
      const industry = String(company.industry || "").toLowerCase()
      const owner = String((company as any).owner || "").toLowerCase()

      const matchesSearch = !q || name.includes(q) || industry.includes(q)
      if (!matchesSearch) return false

      // Simple, easy-to-understand filters:
      if (hasStatusFilter) {
        // показываем только активные компании
        const status = String(company.status || "active").toLowerCase()
        if (status !== "active" && status !== "hot" && status !== "warm") return false
      }
      if (hasIndustryFilter && !industry) return false
      if (hasOwnerFilter && !owner) return false

      return true
    })
  }, [companies, searchQuery, filters])

  const filteredContacts = useMemo(() => contacts.filter((contact: any) =>
    String(contact.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(contact.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(contact.company || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [contacts, searchQuery])

  const filteredDeals = useMemo(() => deals.filter((deal: any) =>
    String(deal.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(deal.company || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [deals, searchQuery])

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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">CRM</h1>
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
            <TabsList className="glass-card border rounded-xl p-1 inline-flex gap-1 sm:gap-2 min-w-max">
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
            {/* Add Company Form */}
            <Card className="glass-card">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  + Neues Unternehmen
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Name *</label>
                    <div className="relative">
                      <Input 
                        placeholder="Enter company name" 
                        value={newCompany.name} 
                        onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                        onBlur={() => handleFieldBlur('company', 'name', newCompany.name)}
                        className="bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                      {validation.company_name !== undefined && (
                        validation.company_name ? 
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" /> :
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="https://company.com" 
                        value={newCompany.website} 
                        onChange={(e) => setNewCompany({...newCompany, website: e.target.value})}
                        onBlur={() => handleFieldBlur('company', 'website', newCompany.website)}
                        className="pl-10 bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                      {validation.company_website !== undefined && (
                        validation.company_website ? 
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" /> :
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {errors.website && <p className="text-xs text-red-500">{errors.website}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-Mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="contact@company.com" 
                        value={newCompany.email} 
                        onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                        onBlur={() => handleFieldBlur('company', 'email', newCompany.email)}
                        className="pl-10 bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                      {validation.company_email !== undefined && (
                        validation.company_email ? 
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" /> :
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefon</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="+41 44 123 45 67" 
                        value={newCompany.phone} 
                        onChange={(e) => setNewCompany({...newCompany, phone: e.target.value})}
                        onBlur={() => handleFieldBlur('company', 'phone', newCompany.phone)}
                        className="pl-10 bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                      {validation.company_phone !== undefined && (
                        validation.company_phone ? 
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" /> :
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={addCompany} 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => clearForm('company')}
                    className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search & Filter Bar */}
            <div className="flex flex-col gap-3">
              <div className="relative">
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
                    onClick={() => setActiveTab('companies')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    + Neues Unternehmen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
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
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">City</p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">{company.city || '—'}</p>
                              </div>
                              <div className="sm:col-span-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Country</p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">{company.country || '—'}</p>
                              </div>
                              <div className="sm:col-span-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pipeline</p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">CHF {(((company as any).pipelineValue || 0) / 1000).toFixed(0)}K</p>
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
                    <div className="text-slate-400 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> City</div>
                    <div className="font-medium">{viewingCompany.city || '—'}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                    <div className="text-slate-400 mb-1 flex items-center gap-1"><Globe className="h-3 w-3" /> Country</div>
                    <div className="font-medium">{viewingCompany.country || '—'}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 col-span-2">
                    <div className="text-slate-400 mb-1">Owner</div>
                    <div className="font-medium">{viewingCompany.owner?.name || '—'}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 col-span-2">
                    <div className="text-slate-400 mb-1">Pipeline</div>
                    <div className="font-medium">CHF {(((viewingCompany as any).pipelineValue || 0) / 1000).toFixed(0)}K</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 col-span-2">
                    <div className="text-slate-400 mb-1">Beschreibung</div>
                    <div className="font-medium whitespace-pre-wrap text-slate-200">{viewingCompany.description || '—'}</div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="mt-5 flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={()=> setViewingCompany(null)}>Schließen</Button>
                  <Button disabled>Bearbeiten (bald)</Button>
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

          {/* CONTACTS TAB */}
          <TabsContent value="contacts" className="space-y-6">
            {/* Add Contact Form */}
            <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                  + Neuen Kontakt hinzufügen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
                    <div className="relative">
                      <Input 
                        placeholder="Enter full name" 
                        value={newContact.name} 
                        onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                        onBlur={() => handleFieldBlur('contact', 'name', newContact.name)}
                        className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      {validation.contact_name !== undefined && (
                        validation.contact_name ? 
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" /> :
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-Mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="contact@email.com" 
                        value={newContact.email} 
                        onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                        onBlur={() => handleFieldBlur('contact', 'email', newContact.email)}
                        className="pl-10 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      {validation.contact_email !== undefined && (
                        validation.contact_email ? 
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" /> :
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="+41 44 123 45 67" 
                        value={newContact.phone} 
                        onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                        onBlur={() => handleFieldBlur('contact', 'phone', newContact.phone)}
                        className="pl-10 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      {validation.contact_phone !== undefined && (
                        validation.contact_phone ? 
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" /> :
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
                    <Input 
                      placeholder="Company name" 
                      value={newContact.company} 
                      onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                    <Input 
                      placeholder="Job title" 
                      value={newContact.title} 
                      onChange={(e) => setNewContact({...newContact, title: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={addContact} 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => clearForm('contact')}
                    className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Clear
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
                      <Badge className={getStatusColor((contact as any).status || 'active')}>
                        {(contact as any).status || 'active'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{contact.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{contact.title || '—'}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{contact.company || '—'}</p>
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
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">CHF {((((contact as any).value) || 0) / 1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Deals</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{(contact as any).deals || 0}</p>
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
          <TabsContent value="deals" className="space-y-6">
            {/* Add Deal Form */}
            <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                  + Neuen Deal hinzufügen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Deal Title *</label>
                    <Input 
                      placeholder="Enter deal title" 
                      value={newDeal.title} 
                      onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
                    <Input 
                      placeholder="Company name" 
                      value={newDeal.company} 
                      onChange={(e) => setNewDeal({...newDeal, company: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Value (CHF)</label>
                    <Input 
                      placeholder="50000" 
                      type="number" 
                      value={newDeal.value} 
                      onChange={(e) => setNewDeal({...newDeal, value: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Probability %</label>
                    <Input 
                      placeholder="50" 
                      type="number" 
                      value={newDeal.probability} 
                      onChange={(e) => setNewDeal({...newDeal, probability: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stage</label>
                    <Input 
                      placeholder="lead" 
                      value={newDeal.stage} 
                      onChange={(e) => setNewDeal({...newDeal, stage: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Close Date</label>
                    <Input 
                      placeholder="2024-12-31" 
                      value={newDeal.expected_close_date} 
                      onChange={(e) => setNewDeal({...newDeal, expected_close_date: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={addDeal} 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => clearForm('deal')}
                    className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Clear
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
                              <p className="text-sm text-slate-700 dark:text-slate-200">{deal.company || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Close Date</p>
                              <p className="text-sm text-slate-700 dark:text-slate-200">
                                {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : 
                                 (deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : '—')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Next Action</p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">{deal.nextAction || '—'}</p>
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




