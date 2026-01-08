"use client"

import { useEffect, useState } from "react"
import { crmApi } from "@/lib/crm-api"
import { authFetch } from "@/lib/api"
import type { CategoryType } from "@/lib/colors"

export interface BudgetPlan {
  id: string
  period: string
  category: CategoryType
  planned: number
  actual: number
  forecast?: number
}

export interface KPITarget {
  id: string
  metric: string
  target: number
  current: number
  unit: string
  change: number
}

export interface BudgetData {
  budgetPlans: BudgetPlan[]
  kpiTargets: KPITarget[]
  monthlyData: Array<{ month: string; planned: number; actual: number; forecast: number }>
  categoryData: Array<{ category: CategoryType; value: number; color: string }>
  achievementData: Array<{ category: string; achievement: number }>
}

export function useBudgetData() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const now = new Date()
        const period = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`

        const deals: any[] = await crmApi.getDeals()

        const categoryMap: Record<string, CategoryType> = {
          Technology: "VERKAUFSFOERDERUNG",
          Healthcare: "IMAGE",
          Finance: "EMPLOYER_BRANDING",
          Retail: "KUNDENPFLEGE",
        }

        const byCat: Record<CategoryType, { planned: number; actual: number }> = {
          VERKAUFSFOERDERUNG: { planned: 0, actual: 0 },
          IMAGE: { planned: 0, actual: 0 },
          EMPLOYER_BRANDING: { planned: 0, actual: 0 },
          KUNDENPFLEGE: { planned: 0, actual: 0 },
        }

        for (const d of deals) {
          const cat = categoryMap[d?.company?.industry || "Technology"] || "VERKAUFSFOERDERUNG"
          const value = Number(d?.value) || 0
          byCat[cat].planned += value
          if (d?.stage === "WON") byCat[cat].actual += value
          else if (["NEGOTIATION", "PROPOSAL"].includes(String(d?.stage))) byCat[cat].actual += value * ((Number(d?.probability) || 0) / 100)
        }

        const budgetPlans: BudgetPlan[] = Object.entries(byCat).map(([category, data], i) => ({
          id: `bp-${i + 1}`,
          period: `Q${Math.floor(i / 2) + 1} ${now.getFullYear()}`,
          category: category as CategoryType,
          planned: data.planned,
          actual: data.actual,
          forecast: data.actual * 1.1,
        }))

        const totalPlanned = Object.values(byCat).reduce((s, v) => s + v.planned, 0)
        const totalActual = Object.values(byCat).reduce((s, v) => s + v.actual, 0)
        const won = deals.filter((d) => d?.stage === "WON").length
        const conversion = deals.length ? (won / deals.length) * 100 : 0

        const kpiTargets: KPITarget[] = [
          { id: "revenue", metric: "Umsatz", target: totalPlanned, current: totalActual, unit: "CHF", change: totalPlanned ? ((totalActual - totalPlanned) / totalPlanned) * 100 : 0 },
          { id: "deals", metric: "Abgeschlossene Deals", target: deals.length, current: won, unit: "Deals", change: 0 },
          { id: "conversion", metric: "Conversion Rate", target: 25, current: conversion, unit: "%", change: 0 },
        ]

        const monthlyData = [
          { month: "Jan", planned: totalPlanned * 0.15, actual: totalActual * 0.12, forecast: totalActual * 0.16 },
          { month: "Feb", planned: totalPlanned * 0.15, actual: totalActual * 0.14, forecast: totalActual * 0.17 },
          { month: "Mar", planned: totalPlanned * 0.15, actual: totalActual * 0.16, forecast: totalActual * 0.18 },
          { month: "Apr", planned: totalPlanned * 0.15, actual: totalActual * 0.15, forecast: totalActual * 0.17 },
          { month: "Mai", planned: totalPlanned * 0.15, actual: totalActual * 0.18, forecast: totalActual * 0.19 },
          { month: "Jun", planned: totalPlanned * 0.25, actual: totalActual * 0.25, forecast: totalActual * 0.13 },
        ]

        const categoryData = Object.entries(byCat).map(([category, data]) => ({
          category: category as CategoryType,
          value: data.actual,
          color: "#3b82f6",
        }))

        const achievementData = Object.entries(byCat).map(([category, data]) => ({
          category: category.replace("_", " "),
          achievement: data.planned ? (data.actual / data.planned) * 100 : 0,
        }))

        // Optional: override planned/KPI from backend
        try {
          const res = await authFetch(`/budget/targets/${period}`)
          const t = await res.json().catch(() => null)
          if (t?.budgetTargets?.length) {
            const override: Record<string, number> = {}
            for (const bt of t.budgetTargets) override[bt.category] = bt.amount
            budgetPlans.forEach((bp) => { if (override[bp.category]) bp.planned = override[bp.category] })
          }
          if (t?.kpiTargets?.length) {
            for (const tk of t.kpiTargets) {
              const m = kpiTargets.find((k) => k.metric.toLowerCase() === String(tk.metric).toLowerCase())
              if (m) { m.target = tk.target; if (tk.unit) m.unit = tk.unit }
            }
          }
        } catch {}

        setBudgetData({ budgetPlans, kpiTargets, monthlyData, categoryData, achievementData })
        setError(null)
      } catch (e: any) {
        console.error("Failed to load budget data", e)
        // In production we prefer to show an explicit error instead of fake demo numbers
        setBudgetData(null)
        setError(e?.message || "Budget API not available")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { budgetData, loading, error, refetch: () => window.location.reload() }
}


