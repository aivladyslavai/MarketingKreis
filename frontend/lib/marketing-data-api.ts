// Marketing Data API Client
// Uses shared auth-aware fetch helper from ./api
import { authFetch } from "./api"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')

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
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const base = API_BASE_URL || ''
      const url = base ? `${base}/api/marketing-data${endpoint}` : `/api/marketing-data${endpoint}`
      const response = await authFetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        credentials: 'include', // Send cookies for authentication
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Marketing Data API request failed:', error)
      throw error
    }
  }

  async getAll(filters: MarketingDataFilters = {}): Promise<{ data: MarketingData[], pagination?: any }> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    try {
      return await this.fetchApi(`?${params}`)
    } catch (error) {
      // Fallback data when API is not available
      return {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
      }
    }
  }

  async getById(id: string): Promise<MarketingData> {
    return this.fetchApi(`/${id}`)
  }

  async create(data: CreateMarketingDataDto): Promise<MarketingData> {
    return this.fetchApi('', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async update(id: string, data: UpdateMarketingDataDto): Promise<MarketingData> {
    return this.fetchApi(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete(id: string): Promise<void> {
    return this.fetchApi(`/${id}`, {
      method: 'DELETE',
    })
  }

  async getStats(year?: number): Promise<MarketingDataStats> {
    const params = year ? `?year=${year}` : ''
    try {
      return await this.fetchApi(`/stats${params}`)
    } catch (error) {
      // Fallback stats when API is not available
      return {
        totalBudget: 0,
        totalActual: 0,
        totalValue: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        avgCtr: 0,
        avgCpc: 0,
        avgCpl: 0,
        activeCount: 0,
        completedCount: 0,
        plannedCount: 0
      }
    }
  }

  async importData(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    
    const base = API_BASE_URL || ''
    const url = base ? `${base}/api/marketing-data/import` : `/api/marketing-data/import`
    const response = await authFetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {}, // Don't set Content-Type for FormData (browser will set it with boundary)
    })
    return response.json()
  }
}

export const marketingDataApi = new MarketingDataApi()
