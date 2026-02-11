"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Building2,
  Globe,
  MapPin,
  Users,
  DollarSign,
  Search
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

export interface Company {
  id: string
  name: string
  website?: string
  industry: string
  size: 'Startup' | 'SMB' | 'Enterprise' | 'Corporation'
  revenue?: number
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country: string
  owner: {
    name: string
    email: string
  }
  contactsCount: number
  dealsCount: number
  totalValue: number
  createdAt: string
  updatedAt: string
  description?: string
  phone?: string
  email?: string
}

interface CompaniesTableProps {
  companies: Company[]
  loading: boolean
  onCreateCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'contactsCount' | 'dealsCount' | 'totalValue'>) => void
  onEditCompany: (id: string, company: Partial<Company>) => void
  onDeleteCompany: (id: string) => void
  onViewCompany: (company: Company) => void
  searchTerm: string
  onSearchChange: (term: string) => void
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Consulting', 'Real Estate', 'Media', 'Other'
]

const COMPANY_SIZES = ['Startup', 'SMB', 'Enterprise', 'Corporation']

const COUNTRIES = ['Switzerland', 'Germany', 'Austria', 'France', 'Italy', 'Other']

const SIZE_COLORS = {
  'Startup': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'SMB': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Enterprise': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Corporation': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
}

export function CompaniesTable({ 
  companies, 
  loading, 
  onCreateCompany,
  onEditCompany,
  onDeleteCompany,
  onViewCompany,
  searchTerm, 
  onSearchChange 
}: CompaniesTableProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [editingCompany, setEditingCompany] = React.useState<Company | null>(null)
  const [viewingCompany, setViewingCompany] = React.useState<Company | null>(null)
  const [filterIndustry, setFilterIndustry] = React.useState<string>('all')
  const [filterSize, setFilterSize] = React.useState<string>('all')
  
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    website: '',
    industry: 'Technology',
    size: 'SMB' as Company['size'],
    revenue: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Switzerland',
    phone: '',
    email: '',
    description: '',
    owner: {
      name: 'Admin User',
      email: 'admin@company.com'
    }
  })

  // Filter companies
  const filteredCompanies = React.useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = !searchTerm || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.city?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesIndustry = filterIndustry === 'all' || company.industry === filterIndustry
      const matchesSize = filterSize === 'all' || company.size === filterSize
      
      return matchesSearch && matchesIndustry && matchesSize
    })
  }, [companies, searchTerm, filterIndustry, filterSize])

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      industry: 'Technology',
      size: 'SMB',
      revenue: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Switzerland',
      phone: '',
      email: '',
      description: '',
      owner: {
        name: 'Admin User',
        email: 'admin@company.com'
      }
    })
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.industry) {
      toast({
        title: "Fehler",
        description: "Name und Branche sind erforderlich.",
        variant: "destructive"
      })
      return
    }

    try {
      await onCreateCompany({
        name: formData.name,
        website: formData.website || undefined,
        industry: formData.industry,
        size: formData.size,
        revenue: formData.revenue ? parseFloat(formData.revenue) : undefined,
        street: formData.street || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        country: formData.country,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        description: formData.description || undefined,
        owner: formData.owner
      })

      // Only close and show success if no error thrown
      resetForm()
      setIsCreateDialogOpen(false)
      toast({
        title: "Erfolg",
        description: "Unternehmen wurde erfolgreich erstellt.",
      })
    } catch (error: any) {
      // Error handled by parent, just log
      console.error('Create company failed:', error)
    }
  }

  const handleEdit = () => {
    if (!editingCompany || !formData.name || !formData.industry) {
      toast({
        title: "Fehler",
        description: "Name und Branche sind erforderlich.",
        variant: "destructive"
      })
      return
    }

    onEditCompany(editingCompany.id, {
      name: formData.name,
      website: formData.website || undefined,
      industry: formData.industry,
      size: formData.size,
      revenue: formData.revenue ? parseFloat(formData.revenue) : undefined,
      street: formData.street || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      country: formData.country,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      description: formData.description || undefined,
      updatedAt: new Date().toISOString()
    })

    resetForm()
    setEditingCompany(null)
    toast({
      title: "Erfolg",
      description: "Unternehmen wurde erfolgreich aktualisiert.",
    })
  }

  const startEdit = (company: Company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      website: company.website || '',
      industry: company.industry,
      size: company.size,
      revenue: company.revenue?.toString() || '',
      street: company.street || '',
      city: company.city || '',
      state: company.state || '',
      zipCode: company.zipCode || '',
      country: company.country,
      phone: company.phone || '',
      email: company.email || '',
      description: company.description || '',
      owner: company.owner
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Unternehmen löschen möchten?')) {
      onDeleteCompany(id)
      toast({
        title: "Erfolg",
        description: "Unternehmen wurde erfolgreich gelöscht.",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Unternehmen
          </CardTitle>
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Neues Unternehmen
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Unternehmen suchen..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-full sm:max-w-sm"
            />
          </div>
          <Select value={filterIndustry} onValueChange={setFilterIndustry}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Branche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Branchen</SelectItem>
              {INDUSTRIES.map(industry => (
                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSize} onValueChange={setFilterSize}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Größe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Größen</SelectItem>
              {COMPANY_SIZES.map(size => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unternehmen</TableHead>
                  <TableHead className="hidden lg:table-cell">Branche</TableHead>
                  <TableHead className="hidden lg:table-cell">Größe</TableHead>
                  <TableHead className="hidden lg:table-cell">Standort</TableHead>
                  <TableHead className="hidden lg:table-cell">Kontakte</TableHead>
                  <TableHead className="hidden lg:table-cell">Deals</TableHead>
                  <TableHead className="text-right">Wert</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm || filterIndustry !== 'all' || filterSize !== 'all' 
                        ? 'Keine Unternehmen gefunden' 
                        : 'Keine Unternehmen vorhanden'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1 min-w-0">
                          <div className="font-medium truncate">{company.name}</div>
                          {company.website && (
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground min-w-0">
                              <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
                              <a 
                                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline truncate"
                              >
                                {company.website}
                              </a>
                            </div>
                          )}
                          {/* Mobile/tablet condensed details */}
                          <div className="lg:hidden space-y-1 text-[11px] text-muted-foreground">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              {company.industry ? <span>{company.industry}</span> : null}
                              {company.size ? (
                                <>
                                  <span className="opacity-60">·</span>
                                  <span>{company.size}</span>
                                </>
                              ) : null}
                            </div>
                            {company.city && company.country ? (
                              <div className="flex items-center gap-1 min-w-0">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{company.city}, {company.country}</span>
                              </div>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3 w-3" /> {company.contactsCount}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <DollarSign className="h-3 w-3" /> {company.dealsCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{company.industry}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge className={SIZE_COLORS[company.size]}>
                          {company.size}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {company.city && company.country ? (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                            {company.city}, {company.country}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                          {company.contactsCount}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                          {company.dealsCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(company.totalValue)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingCompany(company)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Details anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => startEdit(company)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(company.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[min(92vw,700px)] sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Neues Unternehmen hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie ein neues Unternehmen zu Ihrem CRM hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Unternehmensname *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Swiss Tech AG"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="z.B. swiss-tech.ch"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Branche *</Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Unternehmensgröße</Label>
                <Select value={formData.size} onValueChange={(value: Company['size']) => setFormData(prev => ({ ...prev, size: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenue">Jahresumsatz (CHF)</Label>
                <Input
                  id="revenue"
                  type="number"
                  value={formData.revenue}
                  onChange={(e) => setFormData(prev => ({ ...prev, revenue: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+41 44 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@company.com"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="street">Straße</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Bahnhofstrasse 1"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Zürich"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Kanton/Staat</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="ZH"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">PLZ</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="8001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Land</Label>
                <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optionale Beschreibung des Unternehmens..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsCreateDialogOpen(false); }}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate}>
              Unternehmen erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={() => { setEditingCompany(null); resetForm(); }}>
        <DialogContent className="w-[min(92vw,700px)] sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Unternehmen bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Unternehmensdaten.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Unternehmensname *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Swiss Tech AG"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="z.B. swiss-tech.ch"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-industry">Branche *</Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-size">Unternehmensgröße</Label>
                <Select value={formData.size} onValueChange={(value: Company['size']) => setFormData(prev => ({ ...prev, size: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-revenue">Jahresumsatz (CHF)</Label>
                <Input
                  id="edit-revenue"
                  type="number"
                  value={formData.revenue}
                  onChange={(e) => setFormData(prev => ({ ...prev, revenue: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+41 44 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-Mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-street">Straße</Label>
              <Input
                id="edit-street"
                value={formData.street}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Bahnhofstrasse 1"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">Stadt</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Zürich"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">Kanton/Staat</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="ZH"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-zipCode">PLZ</Label>
                <Input
                  id="edit-zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="8001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Land</Label>
                <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optionale Beschreibung des Unternehmens..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingCompany(null); resetForm(); }}>
              Abbrechen
            </Button>
            <Button onClick={handleEdit}>
              Änderungen speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingCompany} onOpenChange={() => setViewingCompany(null)}>
        <DialogContent className="w-[min(92vw,600px)] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {viewingCompany?.name}
              </span>
            </DialogTitle>
          </DialogHeader>
          {viewingCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Branche</Label>
                  <p>{viewingCompany.industry}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Größe</Label>
                  <p><Badge className={SIZE_COLORS[viewingCompany.size]}>{viewingCompany.size}</Badge></p>
                </div>
              </div>
              
              {viewingCompany.website && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                  <p>
                    <a 
                      href={viewingCompany.website.startsWith('http') ? viewingCompany.website : `https://${viewingCompany.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {viewingCompany.website}
                    </a>
                  </p>
                </div>
              )}

              {(viewingCompany.phone || viewingCompany.email) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {viewingCompany.phone && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Telefon</Label>
                      <p>{viewingCompany.phone}</p>
                    </div>
                  )}
                  {viewingCompany.email && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">E-Mail</Label>
                      <p>{viewingCompany.email}</p>
                    </div>
                  )}
                </div>
              )}

              {(viewingCompany.street || viewingCompany.city) && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Adresse</Label>
                  <p>
                    {viewingCompany.street && <>{viewingCompany.street}<br /></>}
                    {viewingCompany.zipCode} {viewingCompany.city}, {viewingCompany.country}
                  </p>
                </div>
              )}

              {viewingCompany.revenue && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Jahresumsatz</Label>
                  <p>{formatCurrency(viewingCompany.revenue)}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Kontakte</Label>
                  <p className="text-2xl font-bold">{viewingCompany.contactsCount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Deals</Label>
                  <p className="text-2xl font-bold">{viewingCompany.dealsCount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Gesamtwert</Label>
                  <p className="text-2xl font-bold">{formatCurrency(viewingCompany.totalValue)}</p>
                </div>
              </div>

              {viewingCompany.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Beschreibung</Label>
                  <p>{viewingCompany.description}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Erstellt am</Label>
                <p>{new Date(viewingCompany.createdAt).toLocaleDateString('de-CH')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
