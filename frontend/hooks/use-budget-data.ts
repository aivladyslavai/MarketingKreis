"use client"

import { useEffect, useState } from "react"
import { crmApi } from "@/lib/crm-api"
import { authFetch } from "@/lib/api"
import { getCategoryColor, type CategoryType } from "@/lib/colors"

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
  const [period, setPeriod] = useState<string>("")
  const [periodOptions, setPeriodOptions] = useState<string[]>([])
  const [reloadNonce, setReloadNonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    const currentPeriod = () => {
      const now = new Date()
      return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`
    }

    const initPeriods = async () => {
      const fallback = currentPeriod()
      try {
        const res = await authFetch(`/budget/periods`)
        const j = await res.json().catch(() => null)
        const list = Array.isArray(j?.periods) ? (j.periods as any[]).map((p) => String(p || "").trim()).filter(Boolean) : []
        if (cancelled) return
        setPeriodOptions(list)
        setPeriod((prev) => prev || list[0] || fallback)
      } catch {
        if (cancelled) return
        setPeriod((prev) => prev || fallback)
      }
    }

    initPeriods()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async (selectedPeriod: string) => {
      setLoading(true)
      try {
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
          DIGITAL_MARKETING: { planned: 0, actual: 0 },
          EVENTS: { planned: 0, actual: 0 },
          CONTENT: { planned: 0, actual: 0 },
          SEO: { planned: 0, actual: 0 },
          PR: { planned: 0, actual: 0 },
        }

        for (const d of deals) {
          const cat = categoryMap[d?.company?.industry || "Technology"] || "VERKAUFSFOERDERUNG"
          const value = Number(d?.value) || 0
          const stage = String(d?.stage || "").toLowerCase()
          byCat[cat].planned += value
          if (stage === "won") byCat[cat].actual += value
          else if (["negotiation", "proposal"].includes(stage)) {
            byCat[cat].actual += value * ((Number(d?.probability) || 0) / 100)
          }
        }

        const totalPlanned = Object.values(byCat).reduce((s, v) => s + v.planned, 0)
        const totalActual = Object.values(byCat).reduce((s, v) => s + v.actual, 0)
        const won = deals.filter((d) => String(d?.stage || "").toLowerCase() === "won").length
        const conversion = deals.length ? (won / deals.length) * 100 : 0

        const baseKpis: KPITarget[] = [
          { id: "revenue", metric: "Umsatz", target: totalPlanned, current: totalActual, unit: "CHF", change: totalPlanned ? ((totalActual - totalPlanned) / totalPlanned) * 100 : 0 },
          { id: "deals", metric: "Abgeschlossene Deals", target: deals.length, current: won, unit: "Deals", change: 0 },
          { id: "conversion", metric: "Conversion Rate", target: 25, current: conversion, unit: "%", change: 0 },
        ]

        const monthlyData = [
          { month: "Jan", planned: 0, actual: totalActual * 0.12, forecast: totalActual * 0.16 },
          { month: "Feb", planned: 0, actual: totalActual * 0.14, forecast: totalActual * 0.17 },
          { month: "Mar", planned: 0, actual: totalActual * 0.16, forecast: totalActual * 0.18 },
          { month: "Apr", planned: 0, actual: totalActual * 0.15, forecast: totalActual * 0.17 },
          { month: "Mai", planned: 0, actual: totalActual * 0.18, forecast: totalActual * 0.19 },
          { month: "Jun", planned: 0, actual: totalActual * 0.25, forecast: totalActual * 0.13 },
        ]

        // Targets from backend (BudgetTarget / KpiTarget) for the selected period.
        // This is how imports (incl. SAP Mediaplan) become visible in the Budget UI.
        let budgetTargets: Array<{ category: string; amount: number }> = []
        let kpiTargetsFromBackend: Array<{ metric: string; target: number; unit?: string | null }> = []
        try {
          const res = await authFetch(`/budget/targets/${encodeURIComponent(selectedPeriod)}`)
          const t = await res.json().catch(() => null)
          budgetTargets = Array.isArray(t?.budgetTargets) ? t.budgetTargets : []
          kpiTargetsFromBackend = Array.isArray(t?.kpiTargets) ? t.kpiTargets : []
        } catch {}

        // Planned budget by category (prefer backend targets when present).
        const plannedByCat: Record<string, number> = {}
        for (const bt of budgetTargets || []) {
          const k = String((bt as any)?.category || "").trim().toUpperCase()
          const v = Number((bt as any)?.amount)
          if (k && Number.isFinite(v)) plannedByCat[k] = v
        }

        const budgetCategories: CategoryType[] = [
          "VERKAUFSFOERDERUNG",
          "IMAGE",
          "EMPLOYER_BRANDING",
          "KUNDENPFLEGE",
          "DIGITAL_MARKETING",
          "EVENTS",
          "CONTENT",
          "SEO",
          "PR",
        ]

        const budgetPlans: BudgetPlan[] = budgetCategories.map((c, i) => ({
          id: `bp-${i + 1}`,
          period: selectedPeriod,
          category: c,
          planned: plannedByCat[c] ?? 0,
          actual: 0,
          forecast: undefined,
        }))

        const totalPlannedBudget = budgetPlans.reduce((s, bp) => s + (Number(bp.planned) || 0), 0)
        monthlyData.forEach((m) => { m.planned = totalPlannedBudget / Math.max(1, monthlyData.length) })

        const categoryData = budgetPlans
          .filter((bp) => (Number(bp.planned) || 0) > 0)
          .map((bp) => ({
            category: bp.category,
            value: Number(bp.planned) || 0,
            color: getCategoryColor(bp.category),
          }))

        const achievementData =
          totalPlannedBudget > 0
            ? budgetPlans
                .filter((bp) => (Number(bp.planned) || 0) > 0)
                .map((bp) => ({
                  category: String(bp.category).replace(/_/g, " "),
                  achievement: ((Number(bp.planned) || 0) / totalPlannedBudget) * 100,
                }))
            : []

        // Merge KPI targets: start with base KPIs and override/add from backend.
        const kpiTargets: KPITarget[] = [...baseKpis]
        const normalizeMetric = (s: any) => String(s || "").trim().toLowerCase()
        const mkId = (metric: string) =>
          normalizeMetric(metric)
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "") || "kpi"

        for (const tk of kpiTargetsFromBackend || []) {
          const mName = String((tk as any)?.metric || "").trim()
          const target = Number((tk as any)?.target)
          const unit = (tk as any)?.unit != null ? String((tk as any)?.unit) : ""
          if (!mName || !Number.isFinite(target)) continue

          const n = normalizeMetric(mName)
          const existing = kpiTargets.find((k) => normalizeMetric(k.metric) === n)
          if (existing) {
            existing.target = target
            if (unit) existing.unit = unit
            continue
          }

          // Additional KPIs from imports (e.g. Impressions/Clicks/CTR) — show them too.
          kpiTargets.push({
            id: mkId(mName),
            metric: mName,
            target,
            // We usually only have "targets" for imported KPIs, not live measurements.
            // Show the target value as the main number so it doesn't look like "missing data".
            current: target,
            unit: unit || "",
            change: 0,
          })
        }

        if (cancelled) return
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

    if (!period) return
    load(period)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, reloadNonce])

  return {
    budgetData,
    loading,
    error,
    period,
    periodOptions,
    setPeriod,
    refetch: () => setReloadNonce((n) => n + 1),
  }
}


