"use client"

import React, { createContext, useContext, useState } from 'react'

interface MarketingData {
  id: string
  title: string
  category: string
  status: 'active' | 'completed' | 'pending'
  budget?: number
  expectedLeads?: number
  startDate?: string
  endDate?: string
}

interface CrmContextType {
  marketingData: MarketingData[]
  marketingStats: any
  isAnyLoading: boolean
  marketingLoading: boolean
  crmLoading: boolean
  companies: any[]
  contacts: any[]
  deals: any[]
  error: string | null
  globalRefresh: () => Promise<void>
  refreshMarketingData: () => Promise<void>
  refreshCrmData: () => Promise<void>
}

const CrmContext = createContext<CrmContextType | null>(null)

// Демо данные
const demoMarketingData: MarketingData[] = [
  {
    id: '1',
    title: 'SEO Campaign Q4',
    category: 'Digital Marketing',
    status: 'active',
    budget: 15000,
    expectedLeads: 120,
    startDate: '2024-01-01',
    endDate: '2024-03-31'
  },
  {
    id: '2',
    title: 'Product Launch Event',
    category: 'Event Marketing',
    status: 'completed',
    budget: 25000,
    expectedLeads: 200,
    startDate: '2024-02-01',
    endDate: '2024-02-28'
  },
  {
    id: '3',
    title: 'Social Media Strategy',
    category: 'Content Marketing',
    status: 'active',
    budget: 8000,
    expectedLeads: 80,
    startDate: '2024-01-15',
    endDate: '2024-06-15'
  }
]

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [marketingData, setMarketingData] = useState<MarketingData[]>(demoMarketingData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const globalRefresh = async () => {
    console.log('🌍 Global CRM refresh triggered')
    setIsLoading(true)
    // Симуляция загрузки
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const refreshMarketingData = async () => {
    console.log('📊 Marketing data refresh')
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
  }

  const refreshCrmData = async () => {
    console.log('🏢 CRM data refresh')
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
  }

  const contextValue: CrmContextType = {
    marketingData,
    marketingStats: {},
    isAnyLoading: isLoading,
    marketingLoading: isLoading,
    crmLoading: isLoading,
    companies: [],
    contacts: [],
    deals: [],
    error,
    globalRefresh,
    refreshMarketingData,
    refreshCrmData
  }

  return (
    <CrmContext.Provider value={contextValue}>
      {children}
    </CrmContext.Provider>
  )
}

export function useCrmContext() {
  const context = useContext(CrmContext)
  if (!context) {
    throw new Error('useCrmContext must be used within a CrmProvider')
  }
  return context
}
