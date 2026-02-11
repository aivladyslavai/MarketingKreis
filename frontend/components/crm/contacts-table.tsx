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
  Users,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Search
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  position?: string
  company?: {
    name: string
    industry: string
  }
  owner: {
    name: string
    email: string
  }
  dealsCount: number
  totalValue: number
  createdAt: string
  updatedAt: string
  notes?: string
  linkedInUrl?: string
  status: 'active' | 'inactive' | 'prospect' | 'customer'
}

interface ContactsTableProps {
  contacts: Contact[]
  loading: boolean
  onCreateContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'dealsCount' | 'totalValue'>) => void
  onEditContact: (id: string, contact: Partial<Contact>) => void
  onDeleteContact: (id: string) => void
  onViewContact: (contact: Contact) => void
  searchTerm: string
  onSearchChange: (term: string) => void
}

const POSITIONS = [
  'CEO', 'CTO', 'CFO', 'COO', 'VP Sales', 'VP Marketing', 'Director',
  'Manager', 'Senior Manager', 'Team Lead', 'Developer', 'Designer',
  'Consultant', 'Analyst', 'Coordinator', 'Assistant', 'Other'
]

const CONTACT_STATUSES = ['active', 'inactive', 'prospect', 'customer'] as const

const STATUS_COLORS = {
  'active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300',
  'prospect': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'customer': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
}

const STATUS_LABELS = {
  'active': 'Aktiv',
  'inactive': 'Inaktiv',
  'prospect': 'Interessent',
  'customer': 'Kunde'
}

export function ContactsTable({ 
  contacts, 
  loading, 
  onCreateContact,
  onEditContact,
  onDeleteContact,
  onViewContact,
  searchTerm, 
  onSearchChange 
}: ContactsTableProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null)
  const [viewingContact, setViewingContact] = React.useState<Contact | null>(null)
  const [filterStatus, setFilterStatus] = React.useState<string>('all')
  
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    companyName: '',
    companyIndustry: 'Technology',
    linkedInUrl: '',
    notes: '',
    status: 'prospect' as Contact['status'],
    owner: {
      name: 'Admin User',
      email: 'admin@company.com'
    }
  })

  // Filter contacts
  const filteredContacts = React.useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = !searchTerm || 
        `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.position?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || contact.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
  }, [contacts, searchTerm, filterStatus])

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      companyName: '',
      companyIndustry: 'Technology',
      linkedInUrl: '',
      notes: '',
      status: 'prospect',
      owner: {
        name: 'Admin User',
        email: 'admin@company.com'
      }
    })
  }

  const handleCreate = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Fehler",
        description: "Vorname, Nachname und E-Mail sind erforderlich.",
        variant: "destructive"
      })
      return
    }

    onCreateContact({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      position: formData.position || undefined,
      company: formData.companyName ? {
        name: formData.companyName,
        industry: formData.companyIndustry
      } : undefined,
      linkedInUrl: formData.linkedInUrl || undefined,
      notes: formData.notes || undefined,
      status: formData.status,
      owner: formData.owner
    })

    resetForm()
    setIsCreateDialogOpen(false)
    toast({
      title: "Erfolg",
      description: "Kontakt wurde erfolgreich erstellt.",
    })
  }

  const handleEdit = () => {
    if (!editingContact || !formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Fehler",
        description: "Vorname, Nachname und E-Mail sind erforderlich.",
        variant: "destructive"
      })
      return
    }

    onEditContact(editingContact.id, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      position: formData.position || undefined,
      company: formData.companyName ? {
        name: formData.companyName,
        industry: formData.companyIndustry
      } : undefined,
      linkedInUrl: formData.linkedInUrl || undefined,
      notes: formData.notes || undefined,
      status: formData.status,
      updatedAt: new Date().toISOString()
    })

    resetForm()
    setEditingContact(null)
    toast({
      title: "Erfolg",
      description: "Kontakt wurde erfolgreich aktualisiert.",
    })
  }

  const startEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      position: contact.position || '',
      companyName: contact.company?.name || '',
      companyIndustry: contact.company?.industry || 'Technology',
      linkedInUrl: contact.linkedInUrl || '',
      notes: contact.notes || '',
      status: contact.status,
      owner: contact.owner
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Kontakt löschen möchten?')) {
      onDeleteContact(id)
      toast({
        title: "Erfolg",
        description: "Kontakt wurde erfolgreich gelöscht.",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Kontakte
          </CardTitle>
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kontakt
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Kontakte suchen..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-full sm:max-w-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
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
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden lg:table-cell">E-Mail</TableHead>
                  <TableHead className="hidden lg:table-cell">Position</TableHead>
                  <TableHead className="hidden lg:table-cell">Unternehmen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Deals</TableHead>
                  <TableHead className="text-right">Wert</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Keine Kontakte gefunden' 
                        : 'Keine Kontakte vorhanden'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1 min-w-0">
                          <div className="font-medium truncate">{contact.firstName} {contact.lastName}</div>
                          {contact.phone && (
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                              {contact.phone}
                            </div>
                          )}
                          {/* Mobile/tablet condensed details */}
                          <div className="lg:hidden space-y-1 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1 min-w-0">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <a href={`mailto:${contact.email}`} className="hover:underline truncate">
                                {contact.email}
                              </a>
                            </div>
                            {contact.position ? (
                              <div className="truncate">{contact.position}</div>
                            ) : null}
                            {contact.company?.name ? (
                              <div className="flex items-center gap-1 min-w-0">
                                <Building2 className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{contact.company.name}</span>
                              </div>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="inline-flex items-center gap-1">
                                <DollarSign className="h-3 w-3" /> {contact.dealsCount}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                Wert: {formatCurrency(contact.totalValue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                          <a 
                            href={`mailto:${contact.email}`}
                            className="hover:underline"
                          >
                            {contact.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{contact.position || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {contact.company ? (
                          <div className="flex items-center text-sm">
                            <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{contact.company.name}</div>
                              <div className="text-muted-foreground">{contact.company.industry}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[contact.status]}>
                          {STATUS_LABELS[contact.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                          {contact.dealsCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(contact.totalValue)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingContact(contact)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Details anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => startEdit(contact)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(contact.id)}
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
        <DialogContent className="w-[min(92vw,600px)] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Neuen Kontakt hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie einen neuen Kontakt zu Ihrem CRM hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Max"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="max@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+41 44 123 45 67"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Position wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keine Position</SelectItem>
                    {POSITIONS.map(position => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: Contact['status']) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Company Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Unternehmen</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Swiss Tech AG"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyIndustry">Branche</Label>
                <Select value={formData.companyIndustry} onValueChange={(value) => setFormData(prev => ({ ...prev, companyIndustry: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedInUrl">LinkedIn URL</Label>
              <Input
                id="linkedInUrl"
                value={formData.linkedInUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedInUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/max-mustermann"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optionale Notizen zum Kontakt..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsCreateDialogOpen(false); }}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate}>
              Kontakt erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => { setEditingContact(null); resetForm(); }}>
        <DialogContent className="w-[min(92vw,600px)] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Kontakt bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Kontaktdaten.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Vorname *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Max"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Nachname *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-Mail *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="max@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+41 44 123 45 67"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Position wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keine Position</SelectItem>
                    {POSITIONS.map(position => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: Contact['status']) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-companyName">Unternehmen</Label>
                <Input
                  id="edit-companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Swiss Tech AG"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-companyIndustry">Branche</Label>
                <Select value={formData.companyIndustry} onValueChange={(value) => setFormData(prev => ({ ...prev, companyIndustry: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-linkedInUrl">LinkedIn URL</Label>
              <Input
                id="edit-linkedInUrl"
                value={formData.linkedInUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedInUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/max-mustermann"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notizen</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optionale Notizen zum Kontakt..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingContact(null); resetForm(); }}>
              Abbrechen
            </Button>
            <Button onClick={handleEdit}>
              Änderungen speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingContact} onOpenChange={() => setViewingContact(null)}>
        <DialogContent className="w-[min(92vw,500px)] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {viewingContact?.firstName} {viewingContact?.lastName}
              </span>
            </DialogTitle>
          </DialogHeader>
          {viewingContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">E-Mail</Label>
                  <p>
                    <a href={`mailto:${viewingContact.email}`} className="text-blue-600 hover:underline">
                      {viewingContact.email}
                    </a>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <p><Badge className={STATUS_COLORS[viewingContact.status]}>{STATUS_LABELS[viewingContact.status]}</Badge></p>
                </div>
              </div>

              {viewingContact.phone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Telefon</Label>
                  <p>
                    <a href={`tel:${viewingContact.phone}`} className="text-blue-600 hover:underline">
                      {viewingContact.phone}
                    </a>
                  </p>
                </div>
              )}

              {viewingContact.position && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Position</Label>
                  <p>{viewingContact.position}</p>
                </div>
              )}

              {viewingContact.company && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Unternehmen</Label>
                  <p>
                    <div className="font-medium">{viewingContact.company.name}</div>
                    <div className="text-sm text-muted-foreground">{viewingContact.company.industry}</div>
                  </p>
                </div>
              )}

              {viewingContact.linkedInUrl && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">LinkedIn</Label>
                  <p>
                    <a 
                      href={viewingContact.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      LinkedIn Profil
                    </a>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Deals</Label>
                  <p className="text-2xl font-bold">{viewingContact.dealsCount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Gesamtwert</Label>
                  <p className="text-2xl font-bold">{formatCurrency(viewingContact.totalValue)}</p>
                </div>
              </div>

              {viewingContact.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notizen</Label>
                  <p className="whitespace-pre-wrap">{viewingContact.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Erstellt am</Label>
                <p>{new Date(viewingContact.createdAt).toLocaleDateString('de-CH')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
