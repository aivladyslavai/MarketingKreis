// Marketing Data client-side store.
//
// The FastAPI backend in this repo currently does not expose a stable
// `/marketing-data` API. To avoid noisy 404s in production we keep this module
// fully client-side using localStorage.
const STORAGE_KEY = "marketing-data-table"

export interface MarketingData {
  id: string
  category: string
  subcategory?: string
  title: string
  description?: string
  budget: number
  actual: number
  value: number
  month: string
  year: number
  startDate?: string
  endDate?: string
  status: string
  priority: string
  companyId?: string
  contactId?: string
  dealId?: string
  impressions?: number
  clicks?: number
  conversions?: number
  ctr?: number
  cpc?: number
  cpl?: number
  notes?: string
  tags?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface MarketingDataStats {
  totalBudget: number
  totalActual: number
  totalValue: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  avgCtr: number
  avgCpc: number
  avgCpl: number
  activeCount: number
  completedCount: number
  plannedCount: number
}

export interface CreateMarketingDataDto {
  category: string
  subcategory?: string
  title: string
  description?: string
  budget: number
  actual?: number
  value: number
  month: string
  year: number
  startDate?: string
  endDate?: string
  status?: string
  priority?: string
  companyId?: string
  contactId?: string
  dealId?: string
  notes?: string
  tags?: string
}

export interface UpdateMarketingDataDto extends Partial<CreateMarketingDataDto> {}

export interface MarketingDataFilters {
  page?: number
  limit?: number
  year?: number
  category?: string
  status?: string
  priority?: string
  companyId?: string
  contactId?: string
  dealId?: string
}

class MarketingDataApi {
  private loadAll(): MarketingData[] {
    if (typeof window === "undefined") return []
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as MarketingData[]) : []
    } catch {
      return []
    }
  }

  private saveAll(items: MarketingData[]) {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore storage errors
    }
  }

  private applyFilters(items: MarketingData[], filters: MarketingDataFilters): MarketingData[] {
    const year = filters.year
    const category = (filters.category || "").trim().toLowerCase()
    const status = (filters.status || "").trim().toLowerCase()
    const priority = (filters.priority || "").trim().toLowerCase()
    const companyId = (filters.companyId || "").trim()
    const contactId = (filters.contactId || "").trim()
    const dealId = (filters.dealId || "").trim()

    return items.filter((it) => {
      if (year != null && Number(it.year) !== Number(year)) return false
      if (category && String(it.category || "").toLowerCase() !== category) return false
      if (status && String(it.status || "").toLowerCase() !== status) return false
      if (priority && String(it.priority || "").toLowerCase() !== priority) return false
      if (companyId && String(it.companyId || "") !== companyId) return false
      if (contactId && String(it.contactId || "") !== contactId) return false
      if (dealId && String(it.dealId || "") !== dealId) return false
      return true
    })
  }

  async getAll(filters: MarketingDataFilters = {}): Promise<{ data: MarketingData[], pagination?: any }> {
    const page = Number(filters.page || 1)
    const limit = Number(filters.limit || 50)

    const all = this.applyFilters(this.loadAll(), filters)
    const total = all.length
    const pages = Math.max(1, Math.ceil(total / Math.max(1, limit)))
    const start = (Math.max(1, page) - 1) * limit
    const data = all.slice(start, start + limit)

    return {
      data,
      pagination: { page: Math.max(1, page), limit, total, pages },
    }
  }

  async getById(id: string): Promise<MarketingData> {
    const it = this.loadAll().find((x) => String(x.id) === String(id))
    if (!it) {
      throw new Error("Not found")
    }
    return it
  }

  async create(data: CreateMarketingDataDto): Promise<MarketingData> {
    const now = new Date().toISOString()
    const item: MarketingData = {
      id: `md-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category: data.category,
      subcategory: data.subcategory,
      title: data.title,
      description: data.description,
      budget: Number(data.budget) || 0,
      actual: Number(data.actual) || 0,
      value: Number(data.value) || 0,
      month: data.month,
      year: Number(data.year) || new Date().getFullYear(),
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status || "active",
      priority: data.priority || "medium",
      companyId: data.companyId,
      contactId: data.contactId,
      dealId: data.dealId,
      notes: data.notes,
      tags: data.tags,
      userId: "me",
      createdAt: now,
      updatedAt: now,
    }
    const items = this.loadAll()
    items.unshift(item)
    this.saveAll(items)
    return item
  }

  async update(id: string, data: UpdateMarketingDataDto): Promise<MarketingData> {
    const items = this.loadAll()
    const idx = items.findIndex((x) => String(x.id) === String(id))
    if (idx === -1) throw new Error("Not found")

    const prev = items[idx]
    const next: MarketingData = {
      ...prev,
      ...data,
      budget: data.budget != null ? Number(data.budget) || 0 : prev.budget,
      actual: data.actual != null ? Number(data.actual) || 0 : prev.actual,
      value: data.value != null ? Number(data.value) || 0 : prev.value,
      year: data.year != null ? Number(data.year) || prev.year : prev.year,
      updatedAt: new Date().toISOString(),
    }
    items[idx] = next
    this.saveAll(items)
    return next
  }

  async delete(id: string): Promise<void> {
    const items = this.loadAll().filter((x) => String(x.id) !== String(id))
    this.saveAll(items)
  }

  async getStats(year?: number): Promise<MarketingDataStats> {
    const filtered = this.applyFilters(this.loadAll(), year ? { year } : {})

    const totalBudget = filtered.reduce((s, r) => s + (Number(r.budget) || 0), 0)
    const totalActual = filtered.reduce((s, r) => s + (Number(r.actual) || 0), 0)
    const totalValue = filtered.reduce((s, r) => s + (Number(r.value) || 0), 0)
    const totalImpressions = filtered.reduce((s, r) => s + (Number(r.impressions) || 0), 0)
    const totalClicks = filtered.reduce((s, r) => s + (Number(r.clicks) || 0), 0)
    const totalConversions = filtered.reduce((s, r) => s + (Number(r.conversions) || 0), 0)

    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgCpc = totalClicks > 0 ? totalActual / totalClicks : 0
    const avgCpl = totalConversions > 0 ? totalActual / totalConversions : 0

    const activeCount = filtered.filter((r) => String(r.status || "").toLowerCase() === "active").length
    const completedCount = filtered.filter((r) => String(r.status || "").toLowerCase() === "completed").length
    const plannedCount = filtered.filter((r) => String(r.status || "").toLowerCase() === "planned").length

    return {
      totalBudget,
      totalActual,
      totalValue,
      totalImpressions,
      totalClicks,
      totalConversions,
      avgCtr,
      avgCpc,
      avgCpl,
      activeCount,
      completedCount,
      plannedCount,
    }
  }

  async importData(file: File) {
    // Not implemented in this client-side only version.
    return { ok: false, error: "Import is not supported in this deployment", fileName: file?.name }
  }
}

export const marketingDataApi = new MarketingDataApi()
