"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBudgetData } from "@/hooks/use-budget-data"
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts"
import { AlertTriangle, DollarSign, Handshake, Target, RefreshCw, Wallet } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

export default function BudgetPage() {
  const { budgetData, loading, error, refetch } = useBudgetData()
  const [pct, setPct] = useState(20)
  const [elasticity, setElasticity] = useState(0.8)
  const [scenario, setScenario] = useState<any | null>(null)
  const [scenarioLoading, setScenarioLoading] = useState(false)
  const [scenarioOpen, setScenarioOpen] = useState(true)

  const period = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`
  }, [])

  async function runScenario(p: number, e: number) {
    setScenarioLoading(true)
    try {
      const res = await fetch('/api/budget/scenario', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          period,
          changePercent: p,
          elasticities: { revenue: e, conversion: 0.3, deals: 0.5 },
        }),
        credentials: 'include',
      })
      const json = await res.json()
      if (res.ok) setScenario(json)
      else setScenario({ error: json?.detail || json?.error })
    } catch (err: any) {
      setScenario({ error: err?.message || 'Scenario failed' })
    } finally {
      setScenarioLoading(false)
    }
  }

  useEffect(() => {
    runScenario(pct, elasticity)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading || !budgetData) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0b1020] dark:via-[#0a0f1c] dark:to-[#070b16] overflow-x-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Budget & KPIs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">Laden...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const colors: Record<string, string> = {
    VERKAUFSFOERDERUNG: '#3b82f6',
    IMAGE: '#ef4444',
    EMPLOYER_BRANDING: '#10b981',
    KUNDENPFLEGE: '#f59e0b',
  }

  const chf = (v: number) => `CHF ${Math.round(v).toLocaleString()}`

  // Micro sparkline for KPI cards
  const Sparkline = ({ series, stroke, from, to }: { series: number[]; stroke: string; from: string; to: string }) => {
    if (!series || series.length === 0) return null
    const n = series.length
    const max = Math.max(...series, 1)
    const min = Math.min(...series, 0)
    const w = 120
    const h = 28
    const toPoint = (v: number, i: number) => {
      const t = max === min ? 0.5 : (v - min) / (max - min)
      const x = (i / (n - 1)) * w
      const y = h - 6 - t * (h - 10)
      return { x, y }
    }
    const pts = series.map(toPoint)
    const d = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ")
    const area = `M 0 ${h} L ${pts.map(p=>`${p.x} ${p.y}`).join(' L ')} L ${w} ${h} Z`
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7">
        <defs>
          <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} stopOpacity="0.35" />
            <stop offset="100%" stopColor={to} stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#kpiGrad)" />
        <path d={d} stroke={stroke} strokeWidth="2" fill="none" />
      </svg>
    )
  }

  const pctFill = Math.round(((pct - (-50)) / (100 - (-50))) * 100)
  const elFill = Math.round(((elasticity - 0) / (1.5 - 0)) * 100)

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0b1020] dark:via-[#0a0f1c] dark:to-[#070b16] overflow-x-hidden">
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-gradient-to-tr from-fuchsia-500/30 to-blue-500/30 blur-3xl animate-gradient-shift" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-500/30 to-emerald-500/30 blur-3xl animate-gradient-shift" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-kaboom-red/30 to-blue-500/30 flex items-center justify-center border border-white/20 shadow-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">Budget & KPIs</h1>
              <p className="text-slate-300 text-sm">Ziele, Verlauf und Verteilung über Kategorien</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="glass-card w-full sm:w-auto" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" /> Aktualisieren
            </Button>
            <Button
              variant="outline"
              className="glass-card w-full sm:w-auto"
              onClick={() => alert('Bearbeitung der Ziele – kommt bald')}
            >
              Ziele bearbeiten
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Budget Scenario – premium controls (collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="relative"
      >
        <div className="pointer-events-none absolute -inset-8 rounded-[28px] bg-gradient-to-r from-blue-500/15 via-fuchsia-500/10 to-emerald-500/15 blur-2xl" />
        <Card className="glass-card relative overflow-hidden border border-white/15 bg-slate-950/80">
        <CardHeader
          className="border-b border-white/10 px-5 sm:px-6 pt-4 pb-4 cursor-pointer select-none"
          onClick={() => setScenarioOpen((v) => !v)}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-white text-lg sm:text-xl flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-400/40">
                    %
                  </span>
                  Budget Scenario
                </CardTitle>
                <button
                  type="button"
                  aria-label={scenarioOpen ? "Einklappen" : "Ausklappen"}
                  className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 border border-white/15 text-xs text-slate-200 hover:bg-slate-800 transition"
                >
                  <span
                    className={`transition-transform duration-200 ${
                      scenarioOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  >
                    ▾
                  </span>
                </button>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Spiele mit Budget & Elastizität und sieh in Echtzeit, wie sich Umsatz, Conversion und Deals verändern.
              </p>
            </div>
            {scenario && !scenario.error && (
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-[11px] text-slate-300">
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="uppercase tracking-[0.14em] text-[10px] text-emerald-300/80">
                      Revenue Impact
                    </span>
                    <span className="text-emerald-200 font-semibold">
                      {scenario.scenario.revenue >=
                      (budgetData?.kpiTargets?.find((k: any) => k.id === "revenue")?.current || 0)
                        ? "+↑"
                        : "↓"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-semibold">{chf(scenario.scenario.revenue || 0)}</div>
                </div>
                <div className="rounded-xl border border-blue-400/40 bg-blue-500/10 px-3 py-2">
                  <div className="uppercase tracking-[0.14em] text-[10px] text-blue-200/80">Conversion</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {(scenario.scenario.conversion || 0).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        {/* Collapsible body */}
        <CardContent
          className={`space-y-5 px-5 sm:px-6 transition-all duration-200 ${
            scenarioOpen ? "pt-5 pb-5 sm:pb-6 opacity-100" : "pt-0 pb-0 max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Budget change (%)</span>
                <span className="rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-100 border border-slate-700/70">
                  {pct > 0 ? "+" : ""}{pct}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={-50}
                  max={100}
                  value={pct}
                  onChange={e => setPct(Number(e.target.value))}
                  className="mk-range"
                  style={
                    {
                      ["--mk-range-pct" as any]: pctFill,
                      ["--mk-range-fill" as any]: "rgba(59, 130, 246, 0.95)",
                    } as any
                  }
                />
                <Input
                  value={pct}
                  onChange={e => setPct(Number(e.target.value || 0))}
                  className="w-20 h-9 bg-slate-900/70 border-slate-700 text-slate-100"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>-50%</span>
                <span>0%</span>
                <span>+100%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Elasticity (revenue)</span>
                <span className="rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-100 border border-slate-700/70">
                  {elasticity.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={elasticity}
                  onChange={e => setElasticity(Number(e.target.value))}
                  className="mk-range"
                  style={
                    {
                      ["--mk-range-pct" as any]: elFill,
                      ["--mk-range-fill" as any]: "rgba(16, 185, 129, 0.95)",
                    } as any
                  }
                />
                <Input
                  value={elasticity}
                  onChange={e => setElasticity(Number(e.target.value || 0))}
                  className="w-20 h-9 bg-slate-900/70 border-slate-700 text-slate-100"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>0.00</span>
                <span>0.75</span>
                <span>1.50</span>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                className="button-glow w-full h-10 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400"
                onClick={() => runScenario(pct, elasticity)}
                disabled={scenarioLoading}
              >
                {scenarioLoading ? (
                  <span className="inline-flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Recalculate…
                  </span>
                ) : (
                  "Recalculate"
                )}
              </Button>
            </div>
          </div>

          {scenario?.error && (
            <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-200" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-amber-100">Scenario konnte nicht geladen werden</div>
                  <div className="mt-1 text-xs text-amber-100/80 break-words">{String(scenario.error)}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="glass-card border-amber-300/20 text-amber-100 hover:text-amber-50"
                      onClick={() => runScenario(pct, elasticity)}
                      disabled={scenarioLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                    {String(scenario.error).toLowerCase().includes("backend_url") && (
                      <div className="text-[11px] text-amber-100/70">
                        Hinweis: In Vercel muss <span className="font-semibold">BACKEND_URL</span> gesetzt sein.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {scenario && !scenario.error && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white">
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/80 p-4">
                <div className="text-[11px] text-slate-400 uppercase tracking-[0.16em]">Total Budget</div>
                <div className="mt-1 text-2xl font-semibold">{chf(scenario.scenario.budgetTotal || 0)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-blue-500/5 p-4">
                <div className="text-[11px] text-slate-300 uppercase tracking-[0.16em]">Forecast Revenue</div>
                <div className="mt-1 text-2xl font-semibold">{chf(scenario.scenario.revenue || 0)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-emerald-400/5 p-4">
                <div className="text-[11px] text-slate-300 uppercase tracking-[0.16em]">Conversion</div>
                <div className="mt-1 text-2xl font-semibold">
                  {(scenario.scenario.conversion || 0).toFixed(1)}%
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-violet-400/5 p-4">
                <div className="text-[11px] text-slate-300 uppercase tracking-[0.16em]">Deals</div>
                <div className="mt-1 text-2xl font-semibold">
                  {Math.round(scenario.scenario.deals || 0)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {budgetData.kpiTargets.map(kpi => {
          const Icon = kpi.id === "revenue" ? DollarSign : kpi.id === "deals" ? Handshake : Target
          const series = kpi.id === "revenue" ? budgetData.monthlyData.map(m=>m.actual) : kpi.id === "deals" ? budgetData.monthlyData.map(m=>m.planned) : budgetData.monthlyData.map(m=>m.forecast)
        return (
          <Card key={kpi.id} className="glass-card p-6 group overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-300">{kpi.metric}</p>
                  <p className="text-2xl font-bold text-white">{kpi.unit === 'CHF' ? chf(kpi.current) : `${Math.round(kpi.current)} ${kpi.unit}`}</p>
                  <p className={`text-[11px] ${kpi.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}%</p>
                  <p className="text-xs text-slate-400">Ziel: {kpi.unit === 'CHF' ? chf(kpi.target) : `${Math.round(kpi.target)} ${kpi.unit}`}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-3 -mx-2">
                <Sparkline series={series} stroke="#93c5fd" from="#93c5fd" to="#1e3a8a" />
              </div>
            </CardContent>
          </Card>
        )})}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader>
            <CardTitle className="text-white">Revenue & Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(scenario?.scenario?.monthly || budgetData.monthlyData)}>
                  <CartesianGrid stroke="rgba(148, 163, 184, .15)" vertical={false} />
                  <XAxis dataKey="month" stroke="transparent" tick={{ fill: "#a3b1c6" }} axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                  <YAxis stroke="transparent" tick={{ fill: "#a3b1c6" }} axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "none", borderRadius: 12, color: "#1e293b", backdropFilter: "blur(10px)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#a3b1c6" }} />
                  <Line type="monotone" dataKey="planned" stroke="#94a3b8" strokeWidth={2} name="Planned" />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} name="Actual" />
                  <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={3} strokeDasharray="8 4" name="Forecast (Scenario)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Categories pie */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white">Verteilung nach Kategorien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={budgetData.categoryData} dataKey="value" nameKey="category" innerRadius={65} outerRadius={100} paddingAngle={3} stroke="#0f172a" labelLine={false}>
                    {budgetData.categoryData.map((entry, idx) => (
                      <Cell key={idx} fill={colors[entry.category] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "none", borderRadius: 12, color: "#1e293b", backdropFilter: "blur(10px)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {budgetData.categoryData.map(c => (
                <div key={c.category} className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[c.category] || '#64748b' }} />
                  {c.category} ({Math.round(c.value).toLocaleString()} CHF)
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement bars */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white">Planerfüllung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData.achievementData}>
                <CartesianGrid stroke="rgba(148, 163, 184, .15)" vertical={false} />
                <XAxis dataKey="category" stroke="transparent" tick={{ fill: "#a3b1c6" }} axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                <YAxis stroke="transparent" tick={{ fill: "#a3b1c6" }} axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "none", borderRadius: 12, color: "#1e293b", backdropFilter: "blur(10px)" }} />
                <Bar dataKey="achievement" fill="#10b981" name="%" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" className="glass-card" onClick={refetch}><RefreshCw className="h-4 w-4 mr-2" /> Aktualisieren</Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-xs text-amber-300">Hinweis: {error}</p>
      )}
      </div>
    </div>
  )
}



