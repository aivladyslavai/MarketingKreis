"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Handshake, Target, RefreshCw, BarChart3 } from "lucide-react"
import { crmAPI, authFetch } from "@/lib/api"
import { sync } from "@/lib/sync"
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts"
import CategorySetup from "@/components/performance/CategorySetup"
import { useUserCategories, type UserCategory } from "@/hooks/use-user-categories"
import { getWeek } from "date-fns"

export default function PerformancePage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any | null>(null)
  const { categories } = useUserCategories()
  const [isSmall, setIsSmall] = useState(false)
  const [chartsOpen, setChartsOpen] = useState(false)

  // Mobile UX: collapse heavy charts by default on phones.
  useEffect(() => {
    try {
      const mql = window.matchMedia("(max-width: 640px)")
      const apply = () => {
        const small = mql.matches
        setIsSmall(small)
        if (!small) setChartsOpen(true)
      }
      apply()
      mql.addEventListener?.("change", apply)
      return () => mql.removeEventListener?.("change", apply)
    } catch {
      /* noop */
    }
  }, [])

  // Simple micro-sparkline SVG for KPI cards
  const Sparkline = ({ data, stroke, fillFrom, fillTo }: { data: number[]; stroke: string; fillFrom: string; fillTo: string }) => {
    if (!data || data.length === 0) return null
    const n = data.length
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const w = 120
    const h = 28
    const toPoint = (v: number, i: number) => {
      const t = max === min ? 0.5 : (v - min) / (max - min)
      const x = (i / (n - 1)) * w
      const y = h - 6 - t * (h - 10)
      return { x, y }
    }
    const pts = data.map(toPoint)
    const d = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ")
    const area = `M 0 ${h} L ${pts.map(p=>`${p.x} ${p.y}`).join(' L ')} L ${w} ${h} Z`
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7">
        <defs>
          <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillFrom} stopOpacity="0.35" />
            <stop offset="100%" stopColor={fillTo} stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#kpiGrad)" />
        <path d={d} stroke={stroke} strokeWidth="2" fill="none" />
      </svg>
    )
  }

  const load = async () => {
    try {
      setLoading(true)
      const res = await authFetch("/performance")
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to load performance data (${res.status})`)
      }
      const data = await res.json().catch(() => null)
      setMetrics(data || null)
    } catch (e) {
      console.error("Error loading performance data:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      try {
        await load()
      } catch (e) {
        console.error(e)
      } finally {
        /* noop */
      }
    }
    run()
    const unsub = [
      sync.on('global:refresh', load),
      sync.on('activities:changed', load),
      sync.on('calendar:changed', load),
      sync.on('crm:companies:changed', load),
    ]
    return () => { unsub.forEach(fn => fn && (fn as any)()) }
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }
  const cardHoverVariants = {
    hover: { scale: 1.02, transition: { duration: 0.3 } },
  }

  if (loading || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Skeleton className="h-16 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    )
  }

  const chf = (v: number) => `CHF ${Math.round(v).toLocaleString()}`

  const totalRevenue = Number(metrics.totalRevenue || 0)
  const totalForecast = Number(metrics.totalForecast || 0)
  const openDeals = Number(metrics.openDeals || 0)
  const conversionRate = Number(metrics.conversionRate || 0)

  const revenueData = (metrics.revenueSeries || []) as { month: string; revenue: number; forecast: number }[]
  const leadsDealsData = (metrics.leadsDealsSeries || []) as { month: string; deals: number; leads: number; won: number }[]
  const weeksData = (metrics.weeksSeries || []) as { week: string; events: number; activities: number }[]

  const rawPipeline = (metrics.pipelineByStage || []) as { name: string; value: number }[]
  const stageColors: Record<string, string> = {
    Lead: "#3b82f6",
    Qualified: "#8b5cf6",
    Proposal: "#ec4899",
    Negotiation: "#f59e0b",
    Won: "#10b981",
  }
  const pipelineData = rawPipeline.map((p) => ({
    ...p,
    color: stageColors[p.name] || "#64748b",
  }))
  const filteredPipeline = pipelineData.filter((d) => d.value > 0)
  const totalPipelineCount = filteredPipeline.reduce((s, d) => s + d.value, 0)

  const kpiCards = [
    { title: "Revenue (YTD)", value: chf(totalRevenue), icon: DollarSign, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-900/20", change: "+12%", series: revenueData.map(d=>d.revenue), stroke:"#10b981", from:"#34d399", to:"#065f46" },
    { title: "Forecast (YTD)", value: chf(totalForecast), icon: TrendingUp, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-900/20", change: "+7%", series: revenueData.map(d=>d.forecast), stroke:"#3b82f6", from:"#93c5fd", to:"#1e3a8a" },
    { title: "Open Deals", value: openDeals.toString(), icon: Handshake, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-900/20", change: "+3", series: leadsDealsData.map(d=>d.deals), stroke:"#8b5cf6", from:"#d8b4fe", to:"#581c87" },
    { title: "Conversion Rate", value: `${conversionRate.toFixed(1)}%`, icon: Target, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-50 dark:bg-orange-900/20", change: "+2.1%", series: leadsDealsData.map(d=>d.won), stroke:"#f59e0b", from:"#fbbf24", to:"#7c2d12" },
  ]

  // Если нет сохранённых категорий — показываем мастер настройки
  if (categories && categories.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:p-8">
        <CategorySetup />
      </div>
    )
  }

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-slate-900 dark:text-slate-100">Performance</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">Umsatz, Pipeline, Leads und Aktivitäten im Überblick</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isSmall && (
              <Button
                variant="outline"
                size="sm"
                className="glass-card h-11 sm:h-9 text-xs"
                onClick={() => setChartsOpen((v) => !v)}
              >
                {chartsOpen ? "Charts ausblenden" : "Charts anzeigen"}
              </Button>
            )}
            <Badge className="glass-card px-4 py-2 text-sm font-medium">KABOOM</Badge>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {kpiCards.map((card, i) => (
            <motion.div key={i} variants={cardHoverVariants} whileHover="hover">
              <Card className="glass-card p-6 group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{card.title}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
                      <p className="text-[11px] text-green-600 dark:text-green-400">{card.change}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${card.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
      </div>
                  <div className="mt-3 -mx-2">
                    <Sparkline data={card.series as any} stroke={card.stroke as string} fillFrom={card.from as string} fillTo={card.to as string} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {(!isSmall || chartsOpen) && (
        <>
      {/* Charts Row 1 */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Revenue & Forecast */}
          <motion.div variants={cardHoverVariants} whileHover="hover">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Revenue & Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid stroke="rgba(148, 163, 184, .15)" vertical={false} />
                      <XAxis dataKey="month" stroke="transparent" tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                      <YAxis stroke="transparent" tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "none", borderRadius: 12, color: "#1e293b", backdropFilter: "blur(10px)" }} formatter={(v: any) => chf(v)} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue (Won)" />
                      <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={3} strokeDasharray="8 4" name="Forecast (Weighted)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pipeline by Stage (использует пользовательские категории при наличии) */}
          <motion.div variants={cardHoverVariants} whileHover="hover">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Pipeline by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {categories && categories.length > 0 ? (
                        <Pie data={categories.map((c: UserCategory) => ({ name: c.name, value: 1, color: c.color }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={75} outerRadius={110} paddingAngle={3} labelLine={false}>
                          {categories.map((c: UserCategory, i: number) => (<Cell key={i} fill={c.color} />))}
                        </Pie>
                      ) : (
                        <Pie data={filteredPipeline} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={75} outerRadius={110} paddingAngle={3} labelLine={false}>
                          {filteredPipeline.map((p, i) => (<Cell key={i} fill={p.color} />))}
                        </Pie>
                      )}
                      <Tooltip contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "none", borderRadius: 12, color: "#1e293b", backdropFilter: "blur(10px)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  Gesamt: <span className="font-medium text-slate-200">{totalPipelineCount}</span>
                </div>
                {categories && categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
                    {categories.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />{c.name}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Leads vs Deals */}
          <motion.div variants={cardHoverVariants} whileHover="hover">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Leads vs. Deals (YTD)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsDealsData}>
                      <CartesianGrid stroke="rgba(148, 163, 184, .15)" vertical={false} />
                      <XAxis dataKey="month" stroke="transparent" tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                      <YAxis stroke="transparent" tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "none", borderRadius: 12, color: "#1e293b", backdropFilter: "blur(10px)" }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
                      <Bar dataKey="leads" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Leads" />
                      <Bar dataKey="deals" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Deals" />
                      <Line type="monotone" dataKey="won" stroke="#10b981" strokeWidth={2} name="Won" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Aktivitäten & Events */}
          <motion.div variants={cardHoverVariants} whileHover="hover">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Aktivitäten & Events (letzte 12 Wochen)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeksData}>
                      <CartesianGrid stroke="rgba(148, 163, 184, .15)" vertical={false} />
                      <XAxis dataKey="week" stroke="transparent" tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                      <YAxis stroke="transparent" tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "none", borderRadius: 12, color: "#1e293b", backdropFilter: "blur(10px)" }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
                      <Area type="monotone" dataKey="events" stroke="#3b82f6" fillOpacity={0.4} fill="#3b82f6" name="Events" />
                      <Area type="monotone" dataKey="activities" stroke="#10b981" fillOpacity={0.4} fill="#10b981" name="Aktivitäten" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-red-600 dark:text-red-400" /> AI Insights
              </CardTitle>
              <Button variant="outline" size="sm" className="glass-card hover:ring-1 hover:ring-red-500/30" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh insights
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex items-start space-x-3 p-3.5 sm:p-4 bg-white/50 dark:bg-neutral-900/30 rounded-xl backdrop-blur-sm">
                <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Revenue stable in Q3</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Consistent growth pattern with +12% YoY increase</p>
                          </div>
                        </div>
              <div className="flex items-start space-x-3 p-3.5 sm:p-4 bg-white/50 dark:bg-neutral-900/30 rounded-xl backdrop-blur-sm">
                <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Activities decreased last 4 weeks</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Consider increasing marketing efforts to maintain momentum</p>
                    </div>
              </div>
              <div className="flex items-start space-x-3 p-3.5 sm:p-4 bg-white/50 dark:bg-neutral-900/30 rounded-xl backdrop-blur-sm">
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Forecast predicts +7% growth in Q4</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Strong pipeline indicates positive Q4 performance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
        </>
      )}
    </motion.div>
  )
}


