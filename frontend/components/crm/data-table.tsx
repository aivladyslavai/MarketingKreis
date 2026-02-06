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
import { 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Upload,
  BarChart3
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export interface DataRow {
  id: string
  category: string
  subcategory: string
  value: number
  month: string
  year: number
  status: 'active' | 'planned' | 'completed' | 'cancelled'
  budget: number
  actual: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface DataTableProps {
  data: DataRow[]
  onAdd: (row: Omit<DataRow, 'id' | 'createdAt' | 'updatedAt'>) => void
  onEdit: (id: string, row: Partial<DataRow>) => void
  onDelete: (id: string) => void
  onExport: () => void
  loading?: boolean
}

const CATEGORIES = [
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'HR',
  'IT',
  'Research'
]

const SUBCATEGORIES: Record<string, string[]> = {
  'Marketing': ['Digital Marketing', 'Content Creation', 'SEO/SEM', 'Social Media', 'Events', 'PR'],
  'Sales': ['Lead Generation', 'Customer Acquisition', 'Account Management', 'Sales Tools', 'Training'],
  'Operations': ['Process Improvement', 'Quality Control', 'Supply Chain', 'Logistics'],
  'Finance': ['Accounting', 'Budgeting', 'Investment', 'Cost Reduction', 'Compliance'],
  'HR': ['Recruitment', 'Training', 'Benefits', 'Performance Management', 'Culture'],
  'IT': ['Software Development', 'Infrastructure', 'Security', 'Support', 'Innovation'],
  'Research': ['Market Research', 'Product Development', 'Innovation', 'Analysis']
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

const STATUS_COLORS = {
  'active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'planned': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'completed': 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300',
  'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
}

const STATUS_LABELS = {
  'active': 'Aktiv',
  'planned': 'Geplant',
  'completed': 'Abgeschlossen',
  'cancelled': 'Abgebrochen'
}

export function DataTable({ data, onAdd, onEdit, onDelete, onExport, loading = false }: DataTableProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [editingRow, setEditingRow] = React.useState<DataRow | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filterCategory, setFilterCategory] = React.useState<string>('all')
  const [filterStatus, setFilterStatus] = React.useState<string>('all')

  // Form state for new/edit row
  const [formData, setFormData] = React.useState({
    category: 'Marketing',
    subcategory: 'Digital Marketing',
    value: '',
    month: 'Januar',
    year: new Date().getFullYear().toString(),
    status: 'planned' as DataRow['status'],
    budget: '',
    actual: '',
    notes: ''
  })

  // Filter data based on search and filters
  const filteredData = React.useMemo(() => {
    return data.filter(row => {
      const matchesSearch = !searchTerm || 
        row.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = filterCategory === 'all' || row.category === filterCategory
      const matchesStatus = filterStatus === 'all' || row.status === filterStatus
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [data, searchTerm, filterCategory, filterStatus])

  const resetForm = () => {
    setFormData({
      category: 'Marketing',
      subcategory: 'Digital Marketing',
      value: '',
      month: 'Januar',
      year: new Date().getFullYear().toString(),
      status: 'planned',
      budget: '',
      actual: '',
      notes: ''
    })
  }

  const handleCreate = () => {
    if (!formData.category || !formData.subcategory || !formData.value || !formData.month) {
      return
    }

    onAdd({
      category: formData.category,
      subcategory: formData.subcategory,
      value: parseFloat(formData.value),
      month: formData.month,
      year: parseInt(formData.year),
      status: formData.status,
      budget: parseFloat(formData.budget) || 0,
      actual: parseFloat(formData.actual) || 0,
      notes: formData.notes
    })

    resetForm()
    setIsCreateDialogOpen(false)
  }

  const handleEdit = () => {
    if (!editingRow || !formData.category || !formData.subcategory || !formData.value || !formData.month) {
      return
    }

    onEdit(editingRow.id, {
      category: formData.category,
      subcategory: formData.subcategory,
      value: parseFloat(formData.value),
      month: formData.month,
      year: parseInt(formData.year),
      status: formData.status,
      budget: parseFloat(formData.budget) || 0,
      actual: parseFloat(formData.actual) || 0,
      notes: formData.notes,
      updatedAt: new Date()
    })

    resetForm()
    setEditingRow(null)
  }

  const startEdit = (row: DataRow) => {
    setEditingRow(row)
    setFormData({
      category: row.category,
      subcategory: row.subcategory,
      value: row.value.toString(),
      month: row.month,
      year: row.year.toString(),
      status: row.status,
      budget: row.budget.toString(),
      actual: row.actual.toString(),
      notes: row.notes || ''
    })
  }

  const getAvailableSubcategories = () => {
    return SUBCATEGORIES[formData.category] || []
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Marketing Daten Tabelle
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button onClick={onExport} variant="outline" size="sm" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Neue Daten
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Unterkategorie</TableHead>
                  <TableHead>Monat</TableHead>
                  <TableHead>Jahr</TableHead>
                  <TableHead className="text-right">Wert</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Ist</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notizen</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Keine Daten gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.category}</TableCell>
                      <TableCell>{row.subcategory}</TableCell>
                      <TableCell>{row.month}</TableCell>
                      <TableCell>{row.year}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.value)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.budget)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.actual)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.status]}`}>
                          {STATUS_LABELS[row.status]}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEdit(row)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDelete(row.id)}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Neue Daten hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie neue Marketing-Daten zur Tabelle hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie eine Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory">Unterkategorie</Label>
                <Select value={formData.subcategory} onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie eine Unterkategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSubcategories().map(subcategory => (
                      <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Monat</Label>
                <Select value={formData.month} onValueChange={(value) => setFormData(prev => ({ ...prev, month: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Monat" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Jahr</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  min="2020"
                  max="2030"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: DataRow['status']) => setFormData(prev => ({ ...prev, status: value }))}>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Wert (CHF)</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (CHF)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual">Ist (CHF)</Label>
                <Input
                  id="actual"
                  type="number"
                  value={formData.actual}
                  onChange={(e) => setFormData(prev => ({ ...prev, actual: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optionale Notizen..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsCreateDialogOpen(false); }}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate}>
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRow} onOpenChange={() => { setEditingRow(null); resetForm(); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Daten bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Marketing-Daten.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie eine Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory">Unterkategorie</Label>
                <Select value={formData.subcategory} onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie eine Unterkategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSubcategories().map(subcategory => (
                      <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Monat</Label>
                <Select value={formData.month} onValueChange={(value) => setFormData(prev => ({ ...prev, month: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Monat" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Jahr</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  min="2020"
                  max="2030"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: DataRow['status']) => setFormData(prev => ({ ...prev, status: value }))}>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Wert (CHF)</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (CHF)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual">Ist (CHF)</Label>
                <Input
                  id="actual"
                  type="number"
                  value={formData.actual}
                  onChange={(e) => setFormData(prev => ({ ...prev, actual: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optionale Notizen..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingRow(null); resetForm(); }}>
              Abbrechen
            </Button>
            <Button onClick={handleEdit}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
