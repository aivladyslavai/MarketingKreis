"use client"

import { useState, useEffect, useCallback } from 'react'
import { marketingDataApi, type MarketingData, type MarketingDataStats, type CreateMarketingDataDto, type UpdateMarketingDataDto, type MarketingDataFilters } from '@/lib/marketing-data-api'
import { crmApi, type Company, type Contact, type Deal, type CreateCompanyData, type CreateContactData, type CreateDealData } from '@/lib/crm-api'
// import { useToast } from '@/components/ui/use-toast' // Временно отключено для устойчивости"

export interface UnifiedCrmData {
  // Marketing Data
  marketingData: MarketingData[]
  marketingStats: MarketingDataStats | null
  marketingLoading: boolean

  // CRM Entities
  companies: Company[]
  contacts: Contact[]
  deals: Deal[]
  crmLoading: boolean

  // Error State
  error: string | null

  // Actions
  refreshMarketingData: () => Promise<void>
  refreshCrmData: () => Promise<void>
  createMarketingData: (data: CreateMarketingDataDto) => Promise<MarketingData | null>
  updateMarketingData: (id: string, data: UpdateMarketingDataDto) => Promise<MarketingData | null>
  deleteMarketingData: (id: string) => Promise<boolean>
  importFromLocalStorage: () => Promise<boolean>

  // Filtering
  setFilters: (filters: MarketingDataFilters) => void
  filters: MarketingDataFilters

  // CRM CRUD
  createCompany: (data: CreateCompanyData) => Promise<Company>
  updateCompany: (id: string, data: Partial<CreateCompanyData>) => Promise<Company>
  deleteCompany: (id: string) => Promise<void>

  createContact: (data: CreateContactData) => Promise<Contact>
  updateContact: (id: string, data: Partial<CreateContactData>) => Promise<Contact>
  deleteContact: (id: string) => Promise<void>

  createDeal: (data: CreateDealData) => Promise<Deal>
  updateDeal: (id: string, data: Partial<CreateDealData>) => Promise<Deal>
  deleteDeal: (id: string) => Promise<void>
}

const LOCALSTORAGE_KEY = 'marketing-data-table'

export function useUnifiedCrm(): UnifiedCrmData {
  // Marketing Data State
  const [marketingData, setMarketingData] = useState<MarketingData[]>([])
  const [marketingStats, setMarketingStats] = useState<MarketingDataStats | null>(null)
  const [marketingLoading, setMarketingLoading] = useState(false)

  // CRM Data State
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [crmLoading, setCrmLoading] = useState(false)

  // Error State
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState<MarketingDataFilters>({
    page: 1,
    limit: 50,
    year: new Date().getFullYear()
  })

  // NOTE:
  // `useToast` is currently disabled; keep a stable fallback to avoid infinite
  // render loops (a new function each render would break useCallback deps).
  const toast = useCallback((message: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Toast:', message)
    }
  }, [])

  // Refresh Marketing Data with retry mechanism
  const refreshMarketingData = useCallback(async () => {
    setMarketingLoading(true)
    setError(null)
    
    try {
      const [dataResponse, statsResponse] = await Promise.all([
        marketingDataApi.getAll(filters),
        marketingDataApi.getStats(filters.year)
      ])

      // Extract data from the correct API response structure
      const marketingDataArray = dataResponse?.data || []
      
      setMarketingData(marketingDataArray)
      setMarketingStats(statsResponse)
    } catch (error) {
      console.error('Failed to fetch marketing data:', error)
      setError('Backend API nicht verfügbar - verwende lokale Daten')
      
      // Show toast notification for better user feedback
      toast({
        title: "Backend Verbindung",
        description: "API nicht erreichbar - lokale Daten werden verwendet",
        variant: "destructive",
      })
    } finally {
      setMarketingLoading(false)
    }
  }, [filters, toast])

  // Refresh CRM Data
  const refreshCrmData = useCallback(async () => {
    setCrmLoading(true)
    try {
      const [companiesResponse, contactsResponse, dealsResponse] = await Promise.all([
        crmApi.getCompanies(),
        crmApi.getContacts(),
        crmApi.getDeals()
      ])
      
      setCompanies(companiesResponse || [])
      setContacts(contactsResponse || [])
      setDeals(dealsResponse || [])
    } catch (error) {
      console.error('Failed to fetch CRM data:', error)
      // Don't show error toast for CRM data as it might not be available
    } finally {
      setCrmLoading(false)
    }
  }, [])

  // Create Marketing Data
  const createMarketingData = useCallback(async (data: CreateMarketingDataDto): Promise<MarketingData | null> => {
    try {
      console.log('Creating marketing data with:', data)
      const newEntry = await marketingDataApi.create(data)
      console.log('Created successfully:', newEntry)
      
      await refreshMarketingData()
      
      toast({
        title: "Erfolg",
        description: "Marketing Daten erfolgreich erstellt",
      })
      
      return newEntry
    } catch (error) {
      console.error('Failed to create marketing data:', error)
      toast({ 
        title: 'Fehler', 
        description: `Backend Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, 
        variant: 'destructive' 
      })
      return null
    }
  }, [refreshMarketingData, toast])

  // Update Marketing Data
  const updateMarketingData = useCallback(async (id: string, data: UpdateMarketingDataDto): Promise<MarketingData | null> => {
    try {
      const updatedEntry = await marketingDataApi.update(id, data)
      await refreshMarketingData()
      
      toast({
        title: "Erfolg",
        description: "Marketing Daten erfolgreich aktualisiert",
      })
      
      return updatedEntry
    } catch (error) {
      console.error('Failed to update marketing data:', error)
      toast({ title: 'Fehler', description: 'Backend nicht verfügbar', variant: 'destructive' })
      return null
    }
  }, [refreshMarketingData, toast])

  // Delete Marketing Data
  const deleteMarketingData = useCallback(async (id: string): Promise<boolean> => {
    try {
      await marketingDataApi.delete(id)
      await refreshMarketingData()
      
      toast({
        title: "Erfolg",
        description: "Marketing Daten erfolgreich gelöscht",
      })
      
      return true
    } catch (error) {
      console.error('Failed to delete marketing data:', error)
      toast({ title: 'Fehler', description: 'Backend nicht verfügbar', variant: 'destructive' })
      return false
    }
  }, [refreshMarketingData, toast])

  // Import from localStorage
  const importFromLocalStorage = useCallback(async (): Promise<boolean> => {
    toast({ title: 'Nicht unterstützt', description: 'Lokaler Import wurde deaktiviert' })
    return false
  }, [toast])

  // Load data on mount and when filters change
  useEffect(() => {
    refreshMarketingData()
  }, [refreshMarketingData])

  // CRUD Companies
  const createCompany = useCallback(async (data: CreateCompanyData) => {
    try {
      const result = await crmApi.createCompany(data)
      await refreshCrmData()
      return result
    } catch (error) {
      console.error('Failed to create company:', error)
      throw error
    }
  }, [refreshCrmData])

  const updateCompany = useCallback(async (id: string, data: Partial<CreateCompanyData>) => {
    try {
      const result = await crmApi.updateCompany(id, data)
      await refreshCrmData()
      return result
    } catch (error) {
      console.error('Failed to update company:', error)
      throw error
    }
  }, [refreshCrmData])

  const deleteCompany = useCallback(async (id: string) => {
    try {
      await crmApi.deleteCompany(id)
      await refreshCrmData()
    } catch (error) {
      console.error('Failed to delete company:', error)
      throw error
    }
  }, [refreshCrmData])

  // CRUD Contacts
  const createContact = useCallback(async (data: CreateContactData) => {
    try {
      const result = await crmApi.createContact(data)
      await refreshCrmData()
      return result
    } catch (error) {
      console.error('Failed to create contact:', error)
      throw error
    }
  }, [refreshCrmData])

  const updateContact = useCallback(async (id: string, data: Partial<CreateContactData>) => {
    try {
      const result = await crmApi.updateContact(id, data)
      await refreshCrmData()
      return result
    } catch (error) {
      console.error('Failed to update contact:', error)
      throw error
    }
  }, [refreshCrmData])

  const deleteContact = useCallback(async (id: string) => {
    try {
      await crmApi.deleteContact(id)
      await refreshCrmData()
    } catch (error) {
      console.error('Failed to delete contact:', error)
      throw error
    }
  }, [refreshCrmData])

  // CRUD Deals
  const createDeal = useCallback(async (data: CreateDealData) => {
    try {
      const result = await crmApi.createDeal(data)
      await refreshCrmData()
      return result
    } catch (error) {
      console.error('Failed to create deal:', error)
      throw error
    }
  }, [refreshCrmData])

  const updateDeal = useCallback(async (id: string, data: Partial<CreateDealData>) => {
    try {
      const result = await crmApi.updateDeal(id, data)
      await refreshCrmData()
      return result
    } catch (error) {
      console.error('Failed to update deal:', error)
      throw error
    }
  }, [refreshCrmData])

  const deleteDeal = useCallback(async (id: string) => {
    try {
      await crmApi.deleteDeal(id)
      await refreshCrmData()
    } catch (error) {
      console.error('Failed to delete deal:', error)
      throw error
    }
  }, [refreshCrmData])

  // Load CRM data on mount
  useEffect(() => {
    refreshCrmData()
  }, [refreshCrmData])

  return {
    // Marketing Data
    marketingData,
    marketingStats,
    marketingLoading,

    // CRM Entities
    companies,
    contacts,
    deals,
    crmLoading,

    // Error State
    error,

    // Actions
    refreshMarketingData,
    refreshCrmData,
    createMarketingData,
    updateMarketingData,
    deleteMarketingData,
    importFromLocalStorage,
    
    // CRM CRUD
    createCompany,
    updateCompany,
    deleteCompany,
    createContact,
    updateContact,
    deleteContact,
    createDeal,
    updateDeal,
    deleteDeal,

    // Filtering
    setFilters,
    filters
  }
}

















