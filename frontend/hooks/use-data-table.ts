"use client"

import { useState, useEffect, useCallback } from 'react'
import { DataRow } from '@/components/crm/data-table'
import { authFetch } from '@/lib/api'

export function useDataTable() {
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authFetch('/crm/data-table')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result || [])
    } catch (err) {
      console.error('Error fetching data table:', err)
      setData([]) // No fallback data - only real CRM data
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addRow = useCallback(async (row: Omit<DataRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await authFetch('/crm/data-table', {
        method: 'POST',
        body: JSON.stringify(row)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const newRow = await response.json()
      setData(prev => [...prev, newRow])
      return newRow
    } catch (err) {
      console.error('Failed to create row:', err)
      throw err
    }
  }, [])

  const updateRow = useCallback(async (id: string, updates: Partial<DataRow>) => {
    try {
      const response = await authFetch(`/crm/data-table/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const updatedRow = await response.json()
      setData(prev => 
        prev.map(row => row.id === id ? updatedRow : row)
      )
      return updatedRow
    } catch (err) {
      console.error('Failed to update row:', err)
      throw err
    }
  }, [])

  const deleteRow = useCallback(async (id: string) => {
    try {
      const response = await authFetch(`/crm/data-table/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      setData(prev => prev.filter(row => row.id !== id))
    } catch (err) {
      console.error('Failed to delete row:', err)
      throw err
    }
  }, [])

  return {
    data,
    loading,
    error,
    addRow,
    updateRow,
    deleteRow,
    refetch: fetchData
  }
}
// Generate sample data
const generateSampleData = (): DataRow[] => {
  const categories = ['Marketing', 'Sales', 'Operations', 'Finance']
  const subcategories = {
    'Marketing': ['Digital Marketing', 'Content Creation', 'SEO/SEM', 'Social Media'],
    'Sales': ['Lead Generation', 'Customer Acquisition', 'Account Management'],
    'Operations': ['Process Improvement', 'Quality Control'],
    'Finance': ['Budgeting', 'Investment', 'Cost Reduction']
  }
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni']
  const statuses: DataRow['status'][] = ['active', 'planned', 'completed']

  const data: DataRow[] = []
  
  for (let i = 0; i < 20; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const subcategoryList = subcategories[category as keyof typeof subcategories]
    const subcategory = subcategoryList[Math.floor(Math.random() * subcategoryList.length)]
    const month = months[Math.floor(Math.random() * months.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    const budget = Math.floor(Math.random() * 50000) + 10000
    const actual = status === 'completed' ? budget + (Math.random() - 0.5) * budget * 0.2 : 0
    const value = status === 'active' ? actual + (Math.random() * budget * 0.3) : 
                  status === 'completed' ? actual : budget * (Math.random() * 0.8)

    data.push({
      id: `row-${i + 1}`,
      category,
      subcategory,
      value: Math.round(value),
      month,
      year: 2025,
      status,
      budget: Math.round(budget),
      actual: Math.round(actual),
      notes: Math.random() > 0.7 ? `Notiz für ${subcategory}` : undefined,
      createdAt: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28)),
      updatedAt: new Date()
    })
  }

  return data
}

export function useDataTable() {
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(true)

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsedData = JSON.parse(stored).map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }))
        setData(parsedData)
      } catch (error) {
        console.error('Error parsing stored data:', error)
        setData(generateSampleData())
      }
    } else {
      setData(generateSampleData())
    }
    setLoading(false)
  }, [])

  // Save data to localStorage whenever data changes
  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data])

  const addRow = useCallback((newRow: Omit<DataRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const row: DataRow = {
      ...newRow,
      id,
      createdAt: now,
      updatedAt: now
    }

    setData(prev => [...prev, row])
  }, [])

  const updateRow = useCallback((id: string, updates: Partial<DataRow>) => {
    setData(prev => prev.map(row => 
      row.id === id 
        ? { ...row, ...updates, updatedAt: new Date() }
        : row
    ))
  }, [])

  const deleteRow = useCallback((id: string) => {
    setData(prev => prev.filter(row => row.id !== id))
  }, [])

  const exportData = useCallback(() => {
    const csv = convertToCSV(data)
    downloadCSV(csv, 'marketing-data.csv')
  }, [data])

  // Get aggregated stats for charts and dashboard
  const getStats = useCallback(() => {
    const totalBudget = data.reduce((sum, row) => sum + row.budget, 0)
    const totalActual = data.reduce((sum, row) => sum + row.actual, 0)
    const totalValue = data.reduce((sum, row) => sum + row.value, 0)
    
    const categoryBreakdown = data.reduce((acc, row) => {
      acc[row.category] = (acc[row.category] || 0) + row.value
      return acc
    }, {} as Record<string, number>)

    const monthlyBreakdown = data.reduce((acc, row) => {
      const key = `${row.month} ${row.year}`
      acc[key] = (acc[key] || 0) + row.value
      return acc
    }, {} as Record<string, number>)

    const statusBreakdown = data.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalBudget,
      totalActual,
      totalValue,
      categoryBreakdown,
      monthlyBreakdown,
      statusBreakdown,
      efficiency: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0
    }
  }, [data])

  return {
    data,
    loading,
    addRow,
    updateRow,
    deleteRow,
    exportData,
    getStats
  }
}

// Helper functions
function convertToCSV(data: DataRow[]): string {
  const headers = [
    'ID', 'Kategorie', 'Unterkategorie', 'Wert', 'Monat', 'Jahr', 
    'Status', 'Budget', 'Ist', 'Notizen', 'Erstellt', 'Aktualisiert'
  ]
  
  const rows = data.map(row => [
    row.id,
    row.category,
    row.subcategory,
    row.value.toString(),
    row.month,
    row.year.toString(),
    row.status,
    row.budget.toString(),
    row.actual.toString(),
    row.notes || '',
    row.createdAt.toISOString(),
    row.updatedAt.toISOString()
  ])

  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Generate sample data
const generateSampleData = (): DataRow[] => {
  const categories = ['Marketing', 'Sales', 'Operations', 'Finance']
  const subcategories = {
    'Marketing': ['Digital Marketing', 'Content Creation', 'SEO/SEM', 'Social Media'],
    'Sales': ['Lead Generation', 'Customer Acquisition', 'Account Management'],
    'Operations': ['Process Improvement', 'Quality Control'],
    'Finance': ['Budgeting', 'Investment', 'Cost Reduction']
  }
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni']
  const statuses: DataRow['status'][] = ['active', 'planned', 'completed']

  const data: DataRow[] = []
  
  for (let i = 0; i < 20; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const subcategoryList = subcategories[category as keyof typeof subcategories]
    const subcategory = subcategoryList[Math.floor(Math.random() * subcategoryList.length)]
    const month = months[Math.floor(Math.random() * months.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    const budget = Math.floor(Math.random() * 50000) + 10000
    const actual = status === 'completed' ? budget + (Math.random() - 0.5) * budget * 0.2 : 0
    const value = status === 'active' ? actual + (Math.random() * budget * 0.3) : 
                  status === 'completed' ? actual : budget * (Math.random() * 0.8)

    data.push({
      id: `row-${i + 1}`,
      category,
      subcategory,
      value: Math.round(value),
      month,
      year: 2025,
      status,
      budget: Math.round(budget),
      actual: Math.round(actual),
      notes: Math.random() > 0.7 ? `Notiz für ${subcategory}` : undefined,
      createdAt: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28)),
      updatedAt: new Date()
    })
  }

  return data
}

export function useDataTable() {
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(true)

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsedData = JSON.parse(stored).map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }))
        setData(parsedData)
      } catch (error) {
        console.error('Error parsing stored data:', error)
        setData(generateSampleData())
      }
    } else {
      setData(generateSampleData())
    }
    setLoading(false)
  }, [])

  // Save data to localStorage whenever data changes
  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data])

  const addRow = useCallback((newRow: Omit<DataRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const row: DataRow = {
      ...newRow,
      id,
      createdAt: now,
      updatedAt: now
    }

    setData(prev => [...prev, row])
  }, [])

  const updateRow = useCallback((id: string, updates: Partial<DataRow>) => {
    setData(prev => prev.map(row => 
      row.id === id 
        ? { ...row, ...updates, updatedAt: new Date() }
        : row
    ))
  }, [])

  const deleteRow = useCallback((id: string) => {
    setData(prev => prev.filter(row => row.id !== id))
  }, [])

  const exportData = useCallback(() => {
    const csv = convertToCSV(data)
    downloadCSV(csv, 'marketing-data.csv')
  }, [data])

  // Get aggregated stats for charts and dashboard
  const getStats = useCallback(() => {
    const totalBudget = data.reduce((sum, row) => sum + row.budget, 0)
    const totalActual = data.reduce((sum, row) => sum + row.actual, 0)
    const totalValue = data.reduce((sum, row) => sum + row.value, 0)
    
    const categoryBreakdown = data.reduce((acc, row) => {
      acc[row.category] = (acc[row.category] || 0) + row.value
      return acc
    }, {} as Record<string, number>)

    const monthlyBreakdown = data.reduce((acc, row) => {
      const key = `${row.month} ${row.year}`
      acc[key] = (acc[key] || 0) + row.value
      return acc
    }, {} as Record<string, number>)

    const statusBreakdown = data.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalBudget,
      totalActual,
      totalValue,
      categoryBreakdown,
      monthlyBreakdown,
      statusBreakdown,
      efficiency: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0
    }
  }, [data])

  return {
    data,
    loading,
    addRow,
    updateRow,
    deleteRow,
    exportData,
    getStats
  }
}

// Helper functions
function convertToCSV(data: DataRow[]): string {
  const headers = [
    'ID', 'Kategorie', 'Unterkategorie', 'Wert', 'Monat', 'Jahr', 
    'Status', 'Budget', 'Ist', 'Notizen', 'Erstellt', 'Aktualisiert'
  ]
  
  const rows = data.map(row => [
    row.id,
    row.category,
    row.subcategory,
    row.value.toString(),
    row.month,
    row.year.toString(),
    row.status,
    row.budget.toString(),
    row.actual.toString(),
    row.notes || '',
    row.createdAt.toISOString(),
    row.updatedAt.toISOString()
  ])

  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
