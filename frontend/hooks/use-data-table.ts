"use client"

import { useState, useEffect, useCallback } from "react"
import type { DataRow } from "@/components/crm/data-table"

const STORAGE_KEY = "mk_marketing_data_table"

// Generate simple sample data for the dashboard charts
function generateSampleData(): DataRow[] {
  const categories = ["Marketing", "Sales", "Operations", "Finance"]
  const subcategories: Record<string, string[]> = {
    Marketing: ["Digital Marketing", "Content Creation", "SEO/SEM", "Social Media"],
    Sales: ["Lead Generation", "Customer Acquisition", "Account Management"],
    Operations: ["Process Improvement", "Quality Control"],
    Finance: ["Budgeting", "Investment", "Cost Reduction"],
  }
  const months = ["Januar", "Februar", "März", "April", "Mai", "Juni"]
  const statuses: DataRow["status"][] = ["active", "planned", "completed"]

  const data: DataRow[] = []

  for (let i = 0; i < 20; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const subcategoryList = subcategories[category]
    const subcategory =
      subcategoryList[Math.floor(Math.random() * subcategoryList.length)]
    const month = months[Math.floor(Math.random() * months.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    const budget = Math.floor(Math.random() * 50_000) + 10_000
    const actual =
      status === "completed"
        ? budget + (Math.random() - 0.5) * budget * 0.2
        : 0
    const value =
      status === "active"
        ? actual + Math.random() * budget * 0.3
        : status === "completed"
          ? actual
          : budget * (Math.random() * 0.8)

    const createdAt = new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28))

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
      createdAt,
      updatedAt: createdAt,
    })
  }

  return data
}

function convertToCSV(data: DataRow[]): string {
  const headers = [
    "ID",
    "Kategorie",
    "Unterkategorie",
    "Wert",
    "Monat",
    "Jahr",
    "Status",
    "Budget",
    "Ist",
    "Notizen",
    "Erstellt",
    "Aktualisiert",
  ]

  const rows = data.map((row) => [
    row.id,
    row.category,
    row.subcategory,
    row.value.toString(),
    row.month,
    row.year.toString(),
    row.status,
    row.budget.toString(),
    row.actual.toString(),
    row.notes || "",
    row.createdAt.toISOString(),
    row.updatedAt.toISOString(),
  ])

  return [headers, ...rows]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n")
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function useDataTable() {
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(true)

  // Load data on mount (from localStorage or generate sample)
  useEffect(() => {
    if (typeof window === "undefined") {
      setData(generateSampleData())
      setLoading(false)
      return
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: DataRow[] = JSON.parse(stored).map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }))
        setData(parsed)
      } else {
        setData(generateSampleData())
      }
    } catch (err) {
      console.error("Error loading stored marketing data:", err)
      setData(generateSampleData())
    } finally {
      setLoading(false)
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore storage errors
    }
  }, [data])

  const addRow = useCallback(
    (newRow: Omit<DataRow, "id" | "createdAt" | "updatedAt">) => {
      const id = `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const now = new Date()

      const row: DataRow = {
        ...newRow,
        id,
        createdAt: now,
        updatedAt: now,
      }

      setData((prev) => [...prev, row])
    },
    [],
  )

  const updateRow = useCallback((id: string, updates: Partial<DataRow>) => {
    setData((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, ...updates, updatedAt: new Date() } : row,
      ),
    )
  }, [])

  const deleteRow = useCallback((id: string) => {
    setData((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const exportData = useCallback(() => {
    const csv = convertToCSV(data)
    downloadCSV(csv, "marketing-data.csv")
  }, [data])

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
      efficiency: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
    }
  }, [data])

  return {
    data,
    loading,
    addRow,
    updateRow,
    deleteRow,
    exportData,
    getStats,
  }
}

