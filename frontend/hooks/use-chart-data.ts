"use client"

import { useMemo } from 'react'
import { useDataTable } from './use-data-table'

export function useChartData() {
  const { data, getStats } = useDataTable()

  // Convert data table to format suitable for dashboard charts
  const chartData = useMemo(() => {
    const stats = getStats()
    
    // Monthly breakdown for line/bar charts
    const monthlyData = Object.entries(stats.monthlyBreakdown || {}).map(([month, value]) => ({
      month,
      value,
      name: month
    }))

    // Category breakdown for pie charts  
    const categoryData = Object.entries(stats.categoryBreakdown || {}).map(([category, value]) => ({
      category,
      value,
      name: category
    }))

    // Status breakdown for status widgets
    const statusData = {
      active: stats.statusBreakdown.active || 0,
      planned: stats.statusBreakdown.planned || 0,
      completed: stats.statusBreakdown.completed || 0,
      cancelled: stats.statusBreakdown.cancelled || 0
    }

    // KPI data for dashboard
    const kpiData = {
      totalBudget: stats.totalBudget,
      totalActual: stats.totalActual,
      totalValue: stats.totalValue,
      efficiency: stats.efficiency,
      variance: stats.totalBudget > 0 ? ((stats.totalActual - stats.totalBudget) / stats.totalBudget) * 100 : 0
    }

    // Activity-like data for the radial circle
    const activityData = data.map((row, index) => ({
      id: row.id,
      title: `${row.category} - ${row.subcategory}`,
      category: mapCategoryToActivityType(row.category),
      status: mapStatusToActivityStatus(row.status),
      budget: row.budget,
      actual: row.actual,
      value: row.value,
      start: new Date(2025, getMonthIndex(row.month), 1),
      end: new Date(2025, getMonthIndex(row.month), 28),
      owner: {
        id: `user-${index}`,
        name: 'Marketing Team',
        email: 'marketing@company.com'
      },
      ownerId: `user-${index}`
    }))

    return {
      monthlyData,
      categoryData,
      statusData,
      kpiData,
      activityData
    }
  }, [data, getStats])

  return chartData
}

// Helper functions to map data table values to activity formats
function mapCategoryToActivityType(category: string): string {
  const mapping: Record<string, string> = {
    'Marketing': 'VERKAUFSFOERDERUNG',
    'Sales': 'KUNDENPFLEGE', 
    'Operations': 'EMPLOYER_BRANDING',
    'Finance': 'IMAGE',
    'HR': 'EMPLOYER_BRANDING',
    'IT': 'IMAGE',
    'Research': 'VERKAUFSFOERDERUNG'
  }
  
  return mapping[category] || 'VERKAUFSFOERDERUNG'
}

function mapStatusToActivityStatus(status: string): string {
  const mapping: Record<string, string> = {
    'active': 'ACTIVE',
    'planned': 'PLANNED', 
    'completed': 'DONE',
    'cancelled': 'CANCELLED'
  }
  
  return mapping[status] || 'PLANNED'
}

function getMonthIndex(monthName: string): number {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]
  
  return months.indexOf(monthName)
}
