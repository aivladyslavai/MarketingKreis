"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useJobsApi } from "@/hooks/use-uploads-api"
import { useAuth } from "@/hooks/use-auth"
import {
  userCategoriesAPI,
  apiBase,
  crmAPI,
  companiesAPI,
  contactsAPI,
  dealsAPI,
  adminAPI,
  AdminUser,
  AdminSeedStatus,
} from "@/lib/api"
import { Shield, Server, Settings, PlayCircle, RefreshCw, RotateCcw, Database, Wrench, Flag, Info, Users, Briefcase, Contact2, Tag, Plus, FlaskConical, PanelLeft, Bug, Bot, Globe, Clock3, Monitor, Sun, Moon, Wifi, Grid3X3, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { jobs, isLoading: jobsLoading, refresh: refreshJobs } = useJobsApi()
  const [activeTab, setActiveTab] = React.useState("overview")
  const [categoriesCount, setCategoriesCount] = React.useState<number>(0)
  const [health, setHealth] = React.useState<null | { status?: string }>(null)
  const [checking, setChecking] = React.useState(false)
  const [stats, setStats] = React.useState<{ companies?: number; contacts?: number; deals?: number } | null>(null)
  const [series, setSeries] = React.useState<{ companies: number[]; contacts: number[]; deals: number[] }>({ companies: [], contacts: [], deals: [] })
  const [seriesDates, setSeriesDates] = React.useState<string[]>([])
  const [chartMode, setChartMode] = React.useState<'bars' | 'area'>('bars')
  const [categories, setCategories] = React.useState<{ name: string; color: string }[]>([])
  const [savingCats, setSavingCats] = React.useState(false)
  const [flags, setFlags] = React.useState<Record<string, boolean>>({})
  const [seedStatus, setSeedStatus] = React.useState<AdminSeedStatus | null>(null)
  const [seedLoading, setSeedLoading] = React.useState(false)
  const [seedError, setSeedError] = React.useState<string | null>(null)
  const [seedDemoLoading, setSeedDemoLoading] = React.useState(false)
  const [adminUsers, setAdminUsers] = React.useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = React.useState(0)
  const [usersLoading, setUsersLoading] = React.useState(false)
  const [usersError, setUsersError] = React.useState<string | null>(null)
  const [userSearch, setUserSearch] = React.useState("")
  const [userRoleFilter, setUserRoleFilter] = React.useState<"" | "user" | "editor" | "admin">("")
  const [updatingUserId, setUpdatingUserId] = React.useState<number | null>(null)
  const [deletingUserId, setDeletingUserId] = React.useState<number | null>(null)
  const [expandedPermsUserId, setExpandedPermsUserId] = React.useState<number | null>(null)
  const SECTION_KEYS: { key: string; label: string }[] = [
    { key: "crm", label: "CRM" },
    { key: "calendar", label: "Calendar" },
    { key: "activities", label: "Activities" },
    { key: "performance", label: "Performance" },
    { key: "budget", label: "Budget" },
    { key: "content", label: "Content" },
    { key: "reports", label: "Reports" },
    { key: "uploads", label: "Uploads" },
  ]

  // Admin sessions
  const [adminSessions, setAdminSessions] = React.useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = React.useState(false)
  const [sessionsError, setSessionsError] = React.useState<string | null>(null)
  const [sessionsActiveOnly, setSessionsActiveOnly] = React.useState(true)
  const [sessionsSearch, setSessionsSearch] = React.useState("")
  // Ops
  const [readyz, setReadyz] = React.useState<any | null>(null)
  const [readyzLoading, setReadyzLoading] = React.useState(false)
  const [viewport, setViewport] = React.useState<{ w: number; h: number; dpr: number; online: boolean }>({ w: 0, h: 0, dpr: 1, online: true })
  const prefersDark = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false
  const isMobile = viewport.w > 0 && viewport.w < 640

  // Redirect non-admins away from this page
  React.useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/signup?mode=login")
      return
    }
    if (user.role !== "admin") {
      router.replace("/dashboard")
    }
  }, [authLoading, user, router])

  // Tiny reusable micro charts for the overview cards
  function MicroBars({ data, dates, stroke, from, to }: { data: number[]; dates: string[]; stroke: string; from: string; to: string }) {
    const gid = React.useId()
    if (!data || data.length === 0) return null
    const n = data.length
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const w = 100
    const h = 24
    const barW = (w / n)
    const [hi, setHi] = React.useState<number | null>(null)
    const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = (e.target as SVGElement).closest('svg')!
      const rect = svg.getBoundingClientRect()
      const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width)
      const i = Math.round((x / rect.width) * (n - 1))
      setHi(i)
    }
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full h-6 opacity-90" onMouseMove={onMove} onMouseLeave={()=>setHi(null)}>
        <defs>
          <linearGradient id={`g-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} stopOpacity="0.9" />
            <stop offset="100%" stopColor={to} stopOpacity="0.25" />
          </linearGradient>
        </defs>
        {data.map((v, i) => {
          const t = max === min ? 0.5 : (v - min) / (max - min)
          const bh = 4 + t * (h - 6)
          const x = i * barW + 0.5
          const y = h - bh
          return (
            <rect key={i} x={x} y={y} width={Math.max(1.5, barW - 1)} height={bh} rx="1.5" fill={`url(#g-${gid})`} stroke={stroke} strokeOpacity="0.25">
              <title>{v}</title>
            </rect>
          )
        })}
        {hi !== null && hi >= 0 && hi < n && (
          <>
            <line x1={(hi/(n-1))*w} x2={(hi/(n-1))*w} y1="1" y2={h-1} stroke={stroke} strokeOpacity="0.4" />
            <rect x={Math.min(w-46, Math.max(0, (hi/(n-1))*w - 22))} y="1" width="46" height="12" rx="3" fill="rgba(15,23,42,.9)" stroke="rgba(255,255,255,.15)" />
            <text x={Math.min(w-46, Math.max(0, (hi/(n-1))*w - 22)) + 4} y="10" fill="#cbd5e1" fontSize="7">{(dates[hi]||'').slice(5)} • {data[hi]}</text>
          </>
        )}
      </svg>
    )
  }
  function MicroArea({ data, dates, stroke, from, to }: { data: number[]; dates: string[]; stroke: string; from: string; to: string }) {
    if (!data || data.length === 0) return null
    const n = data.length
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const w = 100
    const h = 24
    const toPoint = (v: number, i: number) => {
      const t = max === min ? 0.5 : (v - min) / (max - min)
      const x = (i / (n - 1)) * w
      const y = 18 - t * 12
      return { x, y }
    }
    const pts = data.map(toPoint)
    const d = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
    const area = `M 0 ${h} L ${pts.map(p=>`${p.x} ${p.y}`).join(' L ')} L ${w} ${h} Z`
    const [hi, setHi] = React.useState<number | null>(null)
    const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = (e.target as SVGElement).closest('svg')!
      const rect = svg.getBoundingClientRect()
      const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width)
      const i = Math.round((x / rect.width) * (n - 1))
      setHi(i)
    }
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full h-6 opacity-90" onMouseMove={onMove} onMouseLeave={()=>setHi(null)}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} stopOpacity="0.35" />
            <stop offset="100%" stopColor={to} stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaGrad)" />
        <path d={d} fill="none" stroke={stroke} strokeWidth="2" />
        {hi !== null && hi >= 0 && hi < n && (
          <>
            <line x1={pts[hi].x} x2={pts[hi].x} y1="1" y2={h-1} stroke={stroke} strokeOpacity="0.4" />
            <circle cx={pts[hi].x} cy={pts[hi].y} r="2" fill={stroke} />
            <rect x={Math.min(w-50, Math.max(0, pts[hi].x - 24))} y="1" width="50" height="12" rx="3" fill="rgba(15,23,42,.9)" stroke="rgba(255,255,255,.15)" />
            <text x={Math.min(w-50, Math.max(0, pts[hi].x - 24)) + 4} y="10" fill="#cbd5e1" fontSize="7">{(dates[hi]||'').slice(5)} • {data[hi]}</text>
          </>
        )}
      </svg>
    )
  }

  React.useEffect(() => {
    userCategoriesAPI.get().then((cats) => {
      setCategories(cats || [])
      setCategoriesCount((cats || []).length)
    }).catch(() => {
      setCategories([])
      setCategoriesCount(0)
    })
    // Load CRM counts + build simple weekly series for sparklines
    const buildBuckets = (items: any[], getDate: (x: any) => string | Date | undefined) => {
      const buckets: number[] = new Array(20).fill(0)
      const labels: string[] = new Array(20).fill("")
      const now = Date.now()
      const weekMs = 7 * 24 * 3600 * 1000
      for (let i = 0; i < 20; i++) {
        labels[i] = new Date(now - (19 - i) * weekMs).toISOString().slice(0, 10)
      }
      items.forEach((it) => {
        const d = getDate(it) ? new Date(getDate(it) as any).getTime() : NaN
        if (isNaN(d)) return
        const diff = Math.max(0, now - d)
        const idxFromNow = Math.floor(diff / weekMs)
        const bucket = 19 - Math.min(19, idxFromNow)
        if (bucket >= 0 && bucket < 20) buckets[bucket] += 1
      })
      return { buckets, labels }
    }
    Promise.all([
      companiesAPI.getAll().catch(()=>[] as any[]),
      contactsAPI.getAll().catch(()=>[] as any[]),
      dealsAPI.getAll().catch(()=>[] as any[]),
      crmAPI.getStats().catch(()=>({} as any)),
    ]).then(([companies, contacts, deals, s]) => {
      setStats({
        companies: typeof s?.totalCompanies === 'number' ? s.totalCompanies : (companies?.length || 0),
        contacts: typeof s?.totalContacts === 'number' ? s.totalContacts : (contacts?.length || 0),
        deals: typeof s?.totalDeals === 'number' ? s.totalDeals : (deals?.length || 0),
      })
      const c = buildBuckets(companies || [], (x)=> (x?.created_at || x?.createdAt))
      const ct = buildBuckets(contacts || [], (x)=> (x?.created_at || x?.createdAt))
      const dls = buildBuckets(deals || [], (x)=> (x?.created_at || x?.createdAt))
      setSeries({
        companies: c.buckets,
        contacts: ct.buckets,
        deals: dls.buckets,
      })
      setSeriesDates(c.labels)
    }).catch(()=> {
      setStats({ companies: 0, contacts: 0, deals: 0 })
      setSeries({ companies: [], contacts: [], deals: [] })
      setSeriesDates([])
    })
    try {
      const stored = JSON.parse(localStorage.getItem("featureFlags") || "{}")
      setFlags(stored || {})
    } catch { setFlags({}) }
  }, [])

  React.useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return
      setViewport({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1, online: navigator.onLine })
    }
    update()
    window.addEventListener("resize", update)
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  const checkHealth = async () => {
    setChecking(true)
    try {
      const res = await fetch(`${apiBase}/health`, { credentials: "include" })
      const j = await res.json().catch(() => ({}))
      setHealth(j || { status: res.ok ? "ok" : "error" })
    } catch {
      setHealth({ status: "error" })
    } finally {
      setChecking(false)
    }
  }

  const loadSeedStatus = async () => {
    setSeedLoading(true)
    setSeedError(null)
    try {
      const s = await adminAPI.getSeedStatus()
      setSeedStatus(s)
    } catch (e: any) {
      setSeedError(e?.message || "Fehler beim Laden des Seed‑Status")
    } finally {
      setSeedLoading(false)
    }
  }

  const runSeedDemo = async (opts?: { reset?: boolean }) => {
    const reset = !!opts?.reset
    if (reset) {
      const ok = window.confirm("Demo‑Datenset wirklich löschen und neu erstellen?")
      if (!ok) return
    }
    const value = window.prompt("Passwort für demo@marketingkreis.ch (min. 6 Zeichen)", "")
    if (value === null) return
    const pwd = value.trim()
    if (pwd.length < 6) {
      alert("Passwort muss mindestens 6 Zeichen haben")
      return
    }
    setSeedDemoLoading(true)
    try {
      const res = await adminAPI.seedDemo({
        email: "demo@marketingkreis.ch",
        password: pwd,
        reset,
      })
      await loadSeedStatus()
      alert(
        `Demo готово:\n${res?.demo?.email || "demo@marketingkreis.ch"}\n\n` +
          `Created: ${JSON.stringify(res?.created || {}, null, 2)}\n` +
          `Updated: ${JSON.stringify(res?.updated || {}, null, 2)}`,
      )
    } catch (e: any) {
      alert(e?.message || "Seed demo failed")
    } finally {
      setSeedDemoLoading(false)
    }
  }

  const loadUsers = async (overrides?: { search?: string; role?: "" | "user" | "editor" | "admin" }) => {
    const search = overrides?.search !== undefined ? overrides.search : userSearch
    const role = overrides?.role !== undefined ? overrides.role : userRoleFilter
    setUsersLoading(true)
    setUsersError(null)
    try {
      const res = await adminAPI.getUsers({
        skip: 0,
        limit: 100,
        search: search.trim() || undefined,
        role: role || undefined,
      })
      setAdminUsers(res.items || [])
      setUsersTotal(res.total || (res.items ? res.items.length : 0))
    } catch (e: any) {
      setUsersError(e?.message || "Fehler beim Laden der Benutzer")
    } finally {
      setUsersLoading(false)
    }
  }

  React.useEffect(() => {
    if (!authLoading && user && user.role === "admin") {
      loadSeedStatus()
    }
  }, [authLoading, user])

  React.useEffect(() => {
    if (activeTab === "users" && !authLoading && user && user.role === "admin") {
      loadUsers()
    }
  }, [activeTab, authLoading, user])

  const loadAdminSessions = async () => {
    setSessionsLoading(true)
    setSessionsError(null)
    try {
      const rows = await adminAPI.sessions.list({ active_only: sessionsActiveOnly, limit: 250 })
      setAdminSessions(Array.isArray(rows) ? rows : [])
    } catch (e: any) {
      setAdminSessions([])
      setSessionsError(e?.message || "Failed to load sessions")
    } finally {
      setSessionsLoading(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === "sessions" && !authLoading && user && user.role === "admin") {
      loadAdminSessions()
    }
  }, [activeTab, authLoading, user, sessionsActiveOnly])

  const loadReady = async () => {
    setReadyzLoading(true)
    try {
      const res = await fetch(`${apiBase}/readyz`, { credentials: "include", cache: "no-store" })
      const j = await res.json().catch(() => ({}))
      setReadyz({ ok: res.ok, status: res.status, ...j })
    } catch {
      setReadyz({ ok: false })
    } finally {
      setReadyzLoading(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === "ops" && !authLoading && user && user.role === "admin") {
      loadReady()
    }
  }, [activeTab, authLoading, user])

  const setSectionAllowed = async (u: AdminUser, section: string, allowed: boolean) => {
    const perms = (u as any)?.section_permissions && typeof (u as any).section_permissions === "object" ? { ...(u as any).section_permissions } : {}
    if (allowed) {
      // only explicit false denies; remove when allowing
      delete (perms as any)[section]
    } else {
      ;(perms as any)[section] = false
    }
    const updated = await adminAPI.updateUser(u.id, { section_permissions: perms as any })
    setAdminUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)))
  }

  const jobsSummary = React.useMemo(() => {
    const total = jobs.length
    const by = (s: string) => jobs.filter((j) => j.status === (s as any)).length
    return {
      total,
      queued: by("queued"),
      processing: by("processing"),
      completed: by("completed"),
      failed: by("failed"),
    }
  }, [jobs])

  const handleChangeRole = async (user: AdminUser, role: "user" | "editor" | "admin") => {
    if (user.role === role) return
    setUpdatingUserId(user.id)
    try {
      const updated = await adminAPI.updateUser(user.id, { role })
      setAdminUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
    } catch (e: any) {
      alert(e?.message || "Rolle konnte nicht aktualisiert werden")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleToggleVerified = async (user: AdminUser) => {
    setUpdatingUserId(user.id)
    try {
      const updated = await adminAPI.updateUser(user.id, { is_verified: !user.isVerified })
      setAdminUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
    } catch (e: any) {
      alert(e?.message || "Verifizierungsstatus konnte nicht aktualisiert werden")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleResetPassword = async (user: AdminUser) => {
    const value = window.prompt(`Neues Passwort für ${user.email}`, "")
    if (value === null) return
    const pwd = value.trim()
    if (pwd.length < 6) {
      alert("Passwort muss mindestens 6 Zeichen haben")
      return
    }
    setUpdatingUserId(user.id)
    try {
      const updated = await adminAPI.updateUser(user.id, { new_password: pwd })
      setAdminUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
      alert("Passwort aktualisiert")
    } catch (e: any) {
      alert(e?.message || "Passwort konnte nicht aktualisiert werden")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Benutzer ${user.email} wirklich löschen?`)) return
    setDeletingUserId(user.id)
    try {
      await adminAPI.deleteUser(user.id)
      setAdminUsers((prev) => prev.filter((u) => u.id !== user.id))
      setUsersTotal((prev) => Math.max(0, prev - 1))
    } catch (e: any) {
      alert(e?.message || "Benutzer konnte nicht gelöscht werden")
    } finally {
      setDeletingUserId(null)
    }
  }

  const addCategory = () => {
    setCategories(prev => [...prev, { name: "", color: "#3b82f6" }])
  }
  const updateCategory = (idx: number, key: "name" | "color", value: string) => {
    setCategories(prev => prev.map((c, i) => i === idx ? { ...c, [key]: value } : c))
  }
  const removeCategory = (idx: number) => {
    setCategories(prev => prev.filter((_, i) => i !== idx))
  }
  const saveCategories = async () => {
    setSavingCats(true)
    try {
      const cleaned = categories.filter(c => c.name.trim() !== "")
      const res = await userCategoriesAPI.put(cleaned)
      setCategories(res || cleaned)
      setCategoriesCount((res || cleaned).length)
      alert("✅ Kategorien gespeichert")
    } catch {
      alert("❌ Speichern fehlgeschlagen")
    } finally {
      setSavingCats(false)
    }
  }

  const toggleFlag = (k: string) => {
    setFlags(prev => {
      const next = { ...prev, [k]: !prev[k] }
      localStorage.setItem("featureFlags", JSON.stringify(next))
      try { window.dispatchEvent(new Event("mk:flags")) } catch {}
      return next
    })
  }
  const resetFlags = () => {
    const next: Record<string, boolean> = {}
    localStorage.setItem("featureFlags", JSON.stringify(next))
    setFlags(next)
    try { window.dispatchEvent(new Event("mk:flags")) } catch {}
  }

  const copyDiagnostics = async () => {
    const diag = {
      apiBase,
      health,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
      userAgent: navigator.userAgent,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      themeMode: document.documentElement.getAttribute("data-theme-mode"),
      prefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    }
    try { await navigator.clipboard.writeText(JSON.stringify(diag, null, 2)); alert("📋 Diagnostics kopiert") } catch { alert("❌ Kopieren fehlgeschlagen") }
  }

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="p-4 sm:p-10 md:p-12">
        <div className="glass-card rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-6 py-8 sm:py-10 text-center text-xs sm:text-sm text-slate-400">
          {authLoading ? "Lade Admin‑Bereich…" : "Kein Zugriff – du wirst weitergeleitet…"}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-10 md:p-12 space-y-6 sm:space-y-16">
      {/* Hero header with animated blobs */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-4 sm:p-8 md:p-10">
        <div className="pointer-events-none absolute -top-24 -right-16 h-48 sm:h-72 w-48 sm:w-72 rounded-full bg-gradient-to-tr from-fuchsia-500/30 to-blue-500/30 blur-3xl animate-gradient-shift" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 sm:h-64 w-40 sm:w-64 rounded-full bg-gradient-to-tr from-cyan-500/30 to-emerald-500/30 blur-3xl animate-gradient-shift" />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/20 shadow-lg flex-shrink-0">
              <Shield className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white/90">Admin</h1>
              <p className="text-slate-200/80 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base">Systemeinstellungen, Datenpflege und Hintergrundjobs</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button variant="outline" size="sm" className="glass-card h-8 text-xs sm:text-sm" onClick={checkHealth}>
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> <span className="hidden xs:inline">Health</span>
            </Button>
            <Button variant="outline" size="sm" className="glass-card h-8 text-xs sm:text-sm" onClick={copyDiagnostics}>
              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> <span className="hidden xs:inline">Diagnostics</span>
            </Button>
          </div>
        </div>
        {/* quick stats bar */}
        <div className="mt-4 sm:mt-8 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-5 sm:items-center sm:justify-between rounded-lg bg-white/5 border border-white/10 px-3 sm:px-8 py-3 sm:py-6 text-[10px] sm:text-sm text-slate-100 relative overflow-hidden">
          <div className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/2 animate-shine" />
          <span className="flex items-center gap-1.5 sm:gap-2 truncate"><Server className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">API: {apiBase.replace('https://', '')}</span></span>
          <span className="flex items-center gap-1.5 sm:gap-2"><Database className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> Kategorien: {categoriesCount}</span>
          <span className="flex items-center gap-1.5 sm:gap-2"><Wrench className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> Jobs: {jobsSummary.total}</span>
          <span className="flex items-center gap-1.5 sm:gap-2"><Flag className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> Flags: {Object.keys(flags).filter(k=>flags[k]).length}</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-12">
        <TabsList className="mt-2 w-full overflow-x-auto flex-nowrap justify-start sm:justify-center">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">Übersicht</TabsTrigger>
          <TabsTrigger value="jobs" className="text-xs sm:text-sm px-2 sm:px-4">Jobs</TabsTrigger>
          <TabsTrigger value="data" className="text-xs sm:text-sm px-2 sm:px-4">Daten</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-4">Benutzer</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs sm:text-sm px-2 sm:px-4">Sessions</TabsTrigger>
          <TabsTrigger value="flags" className="text-xs sm:text-sm px-2 sm:px-4">Flags</TabsTrigger>
          <TabsTrigger value="ops" className="text-xs sm:text-sm px-2 sm:px-4">Ops</TabsTrigger>
          <TabsTrigger value="system" className="text-xs sm:text-sm px-2 sm:px-4">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-10">
          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-6">
            {[
              {label: 'Refresh', onClick: refreshJobs, icon: <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />},
              {label: 'Health', onClick: checkHealth, icon: <Server className="h-3.5 w-3.5 sm:h-4 sm:w-4" />},
              {label: 'Diagnostics', onClick: copyDiagnostics, icon: <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />},
              {label: 'Add Category', onClick: () => { if (flags.readOnlyMode) { alert("Read‑Only aktiv – keine Änderungen möglich."); return } addCategory() }, icon: <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />},
            ].map((a, i)=>(
              <button key={i} onClick={a.onClick as any} className="button-glow group rounded-lg sm:rounded-xl border border-white/20 bg-white/60 dark:bg-neutral-900/40 px-2 sm:px-5 py-2.5 sm:py-3.5 text-[10px] sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-3 hover:ring-1 hover:ring-white/30 transition disabled:opacity-60" disabled={i===3 && !!flags.readOnlyMode} title={i===3 && flags.readOnlyMode ? "Read‑Only aktiv" : undefined}>
                {a.icon} <span className="truncate">{a.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-8">
            <Card className="glass-card">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Server className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Backend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 space-y-2 sm:space-y-4">
                <div className="text-xs sm:text-sm">
                  <span className="text-slate-500">API Base:</span>{" "}
                  <span className="font-medium truncate block sm:inline">{apiBase.replace('https://', '')}</span>
                </div>
                <div className="text-xs sm:text-sm">
                  <span className="text-slate-500">Health:</span>{" "}
                  <span className="font-medium">{health?.status || "—"}</span>
                </div>
                <Button size="sm" variant="outline" onClick={checkHealth} disabled={checking} className="text-xs sm:text-sm h-7 sm:h-8">
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Health prüfen
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Kategorien
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-xs sm:text-sm text-slate-500">User‑Kategorien</div>
                <div className="text-2xl sm:text-3xl font-bold mt-1">{categoriesCount}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Jobs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:block sm:space-y-3">
                  <div className="text-xs sm:text-sm">
                    <span className="text-slate-500">Gesamt:</span>{" "}
                    <span className="font-medium">{jobsSummary.total}</span>
                  </div>
                  <div className="text-xs sm:text-sm">
                    <span className="text-slate-500">Aktiv:</span>{" "}
                    <span className="font-medium">{jobsSummary.processing}</span>
                  </div>
                  <div className="text-xs sm:text-sm">
                    <span className="text-slate-500">Fertig:</span>{" "}
                    <span className="font-medium">{jobsSummary.completed}</span>
                  </div>
                  <div className="text-xs sm:text-sm">
                    <span className="text-slate-500">Fehler:</span>{" "}
                    <span className="font-medium">{jobsSummary.failed}</span>
                  </div>
                </div>
                {/* Completion meter */}
                <div className="mt-2">
                  {(() => {
                    const done = jobsSummary.completed
                    const rate = jobsSummary.total ? Math.round((done / jobsSummary.total) * 100) : 0
                    return (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0" style={{ background: `conic-gradient(#22c55e ${rate * 3.6}deg, rgba(148,163,184,.3) 0deg)` }}>
                          <div className="absolute inset-0.5 sm:inset-1 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] sm:text-xs font-semibold">{rate}%</div>
                        </div>
                        <div className="flex-1 h-1.5 sm:h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: `${rate}%` }} />
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <Button size="sm" variant="outline" onClick={refreshJobs} className="text-xs sm:text-sm h-7 sm:h-8">
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Aktualisieren
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* CRM stats row */}
          <div className="space-y-2">
            {!!flags.experimentalCharts && (
              <div className="flex items-center justify-end gap-2 text-[10px] sm:text-xs">
                <span className="text-slate-400">Chart:</span>
                <button onClick={()=>setChartMode('bars')} className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border ${chartMode==='bars' ? 'bg-white/10 border-white/20 text-slate-200' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>Bars</button>
                <button onClick={()=>setChartMode('area')} className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border ${chartMode==='area' ? 'bg-white/10 border-white/20 text-slate-200' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>Area</button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 sm:gap-8">
            <Card className="glass-card">
              <CardContent className="p-3 sm:p-6 flex items-center justify-between gap-2">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <div className="text-[10px] sm:text-sm text-slate-500 truncate">Unternehmen</div>
                  <div className="text-lg sm:text-3xl font-bold">{typeof stats?.companies === 'number' ? stats?.companies : "—"}</div>
                  {!!flags.experimentalCharts && (series.companies.length > 0) && (
                    chartMode === 'bars'
                      ? <MicroBars data={series.companies} dates={seriesDates} stroke="rgb(59,130,246)" from="#93c5fd" to="#1e3a8a" />
                      : <MicroArea data={series.companies} dates={seriesDates} stroke="rgb(59,130,246)" from="#93c5fd" to="#1e3a8a" />
                  )}
                </div>
                <Briefcase className="h-5 w-5 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-3 sm:p-6 flex items-center justify-between gap-2">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <div className="text-[10px] sm:text-sm text-slate-500 truncate">Kontakte</div>
                  <div className="text-lg sm:text-3xl font-bold">{typeof stats?.contacts === 'number' ? stats?.contacts : "—"}</div>
                  {!!flags.experimentalCharts && (series.contacts.length > 0) && (
                    chartMode === 'bars'
                      ? <MicroBars data={series.contacts} dates={seriesDates} stroke="rgb(34,197,94)" from="#86efac" to="#065f46" />
                      : <MicroArea data={series.contacts} dates={seriesDates} stroke="rgb(34,197,94)" from="#86efac" to="#065f46" />
                  )}
                </div>
                <Users className="h-5 w-5 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-3 sm:p-6 flex items-center justify-between gap-2">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <div className="text-[10px] sm:text-sm text-slate-500 truncate">Deals</div>
                  <div className="text-lg sm:text-3xl font-bold">{typeof stats?.deals === 'number' ? stats?.deals : "—"}</div>
                  {!!flags.experimentalCharts && (series.deals.length > 0) && (
                    chartMode === 'bars'
                      ? <MicroBars data={series.deals} dates={seriesDates} stroke="rgb(168,85,247)" from="#d8b4fe" to="#581c87" />
                      : <MicroArea data={series.deals} dates={seriesDates} stroke="rgb(168,85,247)" from="#d8b4fe" to="#581c87" />
                  )}
                </div>
                <Contact2 className="h-5 w-5 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              </CardContent>
            </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4 sm:space-y-8">
          <Card className="glass-card">
            <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4 flex flex-row flex-wrap items-start justify-between gap-2 sm:gap-3">
              <CardTitle className="text-sm sm:text-base">Hintergrund‑Jobs</CardTitle>
              <Button size="sm" variant="outline" onClick={refreshJobs} className="h-7 sm:h-8 text-xs sm:text-sm">
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {jobsLoading ? (
                <div className="py-6 sm:py-8 text-xs sm:text-sm text-slate-500">Lade Jobs…</div>
              ) : jobs.length === 0 ? (
                <div className="py-6 sm:py-8 text-xs sm:text-sm text-slate-500">Keine Jobs</div>
              ) : (
                <>
                  {/* Mobile: cards (no horizontal scroll) */}
                  {isMobile ? (
                    <div className="space-y-2">
                      {jobs.map((j) => {
                        const status = String(j.status || "").toLowerCase()
                        const statusClass =
                          status === "completed" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                          status === "processing" ? "bg-blue-500/15 text-blue-300 border-blue-500/30" :
                          status === "failed" ? "bg-red-500/15 text-red-300 border-red-500/30" :
                          "bg-slate-500/15 text-slate-300 border-slate-500/30"
                        return (
                          <div key={j.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-mono text-[10px] text-slate-400">#{j.id}</div>
                                <div className="mt-1 flex items-center gap-2 min-w-0">
                                  <span className="text-sm font-semibold text-slate-100 truncate">{j.type}</span>
                                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${statusClass}`}>
                                    {status === "processing" && <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />}
                                    {j.status}
                                  </span>
                                </div>
                                <div className="mt-1 text-[11px] text-slate-400">
                                  Erstellt: {j.created_at ? new Date(j.created_at).toLocaleDateString("de-DE") : "—"}
                                </div>
                              </div>
                            </div>
                            {typeof j.progress === "number" && status === "processing" && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                  <span>Fortschritt</span>
                                  <span>{Math.round(j.progress)}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${j.progress}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-white/10 -mx-1 sm:mx-0">
                      <table className="w-full text-xs sm:text-sm min-w-[500px]">
                        <thead className="bg-white/5">
                          <tr className="text-left text-slate-400 uppercase text-[10px] sm:text-xs tracking-wider">
                            <th className="py-2 sm:py-4 px-2 sm:px-5 font-medium">ID</th>
                            <th className="py-2 sm:py-4 px-2 sm:px-5 font-medium">Typ</th>
                            <th className="py-2 sm:py-4 px-2 sm:px-5 font-medium">Status</th>
                            <th className="py-2 sm:py-4 px-2 sm:px-5 font-medium hidden sm:table-cell">Fortschritt</th>
                            <th className="py-2 sm:py-4 px-2 sm:px-5 font-medium">Erstellt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {jobs.map((j) => {
                            const status = String(j.status || "").toLowerCase()
                            const statusClass =
                              status === "completed" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                              status === "processing" ? "bg-blue-500/15 text-blue-300 border-blue-500/30" :
                              status === "failed" ? "bg-red-500/15 text-red-300 border-red-500/30" :
                              "bg-slate-500/15 text-slate-300 border-slate-500/30"
                            return (
                              <tr key={j.id} className="hover:bg-white/5 even:bg-white/5 transition-colors">
                                <td className="py-2 sm:py-5 px-2 sm:px-5 font-mono text-[10px] sm:text-xs text-slate-400">{j.id}</td>
                                <td className="py-2 sm:py-5 px-2 sm:px-5">
                                  <span className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-white/10 bg-white/5 px-1.5 sm:px-3 py-0.5 sm:py-1">
                                    <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-slate-400" />
                                    <span className="text-slate-200 text-[10px] sm:text-sm truncate max-w-[60px] sm:max-w-none">{j.type}</span>
                                  </span>
                                </td>
                                <td className="py-2 sm:py-5 px-2 sm:px-5">
                                  <span className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-full border px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium capitalize ${statusClass}`}>
                                    {status === "processing" && <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-blue-400 animate-pulse" />}
                                    {j.status}
                                  </span>
                                </td>
                                <td className="py-2 sm:py-5 px-2 sm:px-5 hidden sm:table-cell">
                                  {typeof j.progress === "number" && status === "processing" ? (
                                    <div className="w-24 sm:w-48 h-1.5 sm:h-2 rounded-full bg-white/10 overflow-hidden">
                                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${j.progress}%` }} />
                                    </div>
                                  ) : (
                                    <span className="text-slate-500">—</span>
                                  )}
                                </td>
                                <td className="py-2 sm:py-5 px-2 sm:px-5 text-slate-400 text-[10px] sm:text-sm whitespace-nowrap">{new Date(j.created_at).toLocaleDateString("de-DE")}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATA */}
        <TabsContent value="data" className="space-y-4 sm:space-y-8">
          <Card className="glass-card">
            <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base">User‑Kategorien bearbeiten</CardTitle>
                  <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Definiere farbige Labels für Aktivitäten</div>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <Button variant="outline" size="sm" className="glass-card hover:ring-1 hover:ring-blue-500/30 h-7 sm:h-8 text-[10px] sm:text-sm" onClick={()=>{ if (flags.readOnlyMode) { alert("Read‑Only aktiv – keine Änderungen möglich."); return } addCategory() }} disabled={!!flags.readOnlyMode} title={flags.readOnlyMode ? "Read‑Only aktiv" : undefined}>
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Hinzufügen
                </Button>
                <Button size="sm" className="button-glow bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 h-7 sm:h-8 text-[10px] sm:text-sm" onClick={()=>{ if (flags.readOnlyMode) { alert("Read‑Only aktiv – keine Änderungen möglich."); return } saveCategories() }} disabled={savingCats || !!flags.readOnlyMode} title={flags.readOnlyMode ? "Read‑Only aktiv" : undefined}>
                  {savingCats ? "Speichern…" : "Speichern"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-8">
              {categories.length === 0 ? (
                <div className="text-center py-8 sm:py-16">
                  <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-white/5 border border-white/10 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <Tag className="h-4 w-4 sm:h-6 sm:w-6 text-slate-400" />
                  </div>
                  <div className="text-slate-300 mb-1 sm:mb-2 text-sm sm:text-base">Keine Kategorien</div>
                  <div className="text-slate-400 text-xs sm:text-sm mb-3 sm:mb-4">Füge deine ersten Kategorien hinzu</div>
                  <Button variant="outline" size="sm" onClick={addCategory} className="h-7 sm:h-8 text-xs sm:text-sm"><Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Hinzufügen</Button>
                </div>
              ) : (
                categories.map((c, idx) => (
                  <div key={idx} className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-7 flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-7 sm:items-center">
                    <div className="sm:col-span-7">
                      <Input value={c.name} placeholder="Name (z.B. Social, Email)" onChange={(e)=> updateCategory(idx, "name", e.target.value)} className="h-8 sm:h-10 text-xs sm:text-sm" />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2 sm:gap-3">
                      <input
                        type="color"
                        className="h-8 w-10 sm:h-10 sm:w-12 rounded-md border border-white/10 bg-transparent p-1"
                        value={c.color}
                        onChange={(e)=> updateCategory(idx, "color", e.target.value)}
                        title="Farbe wählen"
                      />
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 px-2 py-1">
                        <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-[10px] sm:text-xs text-slate-300">Beispiel</span>
                      </span>
                    </div>
                    <div className="sm:col-span-3 flex justify-end">
                      <Button variant="outline" size="sm" onClick={()=> { if (flags.readOnlyMode) { alert("Read‑Only aktiv – keine Änderungen möglich."); return } removeCategory(idx) }} disabled={!!flags.readOnlyMode} title={flags.readOnlyMode ? "Read‑Only aktiv" : undefined} className="h-7 sm:h-8 text-[10px] sm:text-sm">Entfernen</Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users" className="space-y-4 sm:space-y-8">
          <Card className="glass-card">
            <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500/30 to-blue-500/30 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base">Benutzerverwaltung</CardTitle>
                  <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                    Rollen, Verifizierung und Zugänge
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Suche nach E‑Mail…"
                    className="h-7 sm:h-9 w-full sm:w-44 md:w-56 text-xs sm:text-sm"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        loadUsers({ search: (e.target as HTMLInputElement).value })
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass-card h-7 sm:h-9 text-[10px] sm:text-sm"
                    onClick={() => loadUsers()}
                    disabled={usersLoading}
                  >
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> <span className="hidden xs:inline">Laden</span>
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-slate-400 flex-shrink-0">Rolle:</span>
                  {[
                    { key: "", label: "Alle" },
                    { key: "user", label: "User" },
                    { key: "editor", label: "Editor" },
                    { key: "admin", label: "Admin" },
                  ].map((r) => (
                    <button
                      key={r.key || "all"}
                      type="button"
                      onClick={() => {
                        const next = r.key as "" | "user" | "editor" | "admin"
                        setUserRoleFilter(next)
                        loadUsers({ role: next })
                      }}
                      className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border text-[10px] sm:text-[11px] font-medium transition flex-shrink-0 ${
                        userRoleFilter === r.key
                          ? "bg-white/15 border-white/30 text-slate-100"
                          : "bg-transparent border-white/15 text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-6">
              {seedStatus && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-[10px] sm:text-xs">
                  <div className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-4 flex items-center justify-between">
                    <div>
                      <div className="text-slate-400 truncate">Benutzer gesamt</div>
                      <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-semibold text-slate-100">{seedStatus.users.total}</div>
                    </div>
                  </div>
                  <div className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-4 flex items-center justify-between">
                    <div>
                      <div className="text-slate-400">Admins</div>
                      <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-semibold text-slate-100">{seedStatus.users.admins}</div>
                    </div>
                  </div>
                  <div className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-4 flex items-center justify-between">
                    <div>
                      <div className="text-slate-400 truncate">CRM Datensätze</div>
                      <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-semibold text-slate-100">
                        {seedStatus.crm.companies + seedStatus.crm.contacts + seedStatus.crm.deals}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-4 flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <div className="text-slate-400 truncate">Aktivität / Kalender</div>
                      <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-semibold text-slate-100">
                        {seedStatus.activities.activities + seedStatus.activities.calendarEntries}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 sm:h-8 px-1.5 sm:px-2 text-[10px] sm:text-xs flex-shrink-0"
                      onClick={loadSeedStatus}
                      disabled={seedLoading}
                    >
                      <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="text-[10px] sm:text-xs text-slate-400">
                  Demo‑Account (read‑only): <span className="text-slate-200">demo@marketingkreis.ch</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass-card h-8 text-xs"
                    onClick={() => runSeedDemo({ reset: false })}
                    disabled={seedDemoLoading}
                  >
                    <FlaskConical className="h-4 w-4 mr-2" /> Demo seed
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass-card h-8 text-xs border-red-400/40 text-red-200 hover:text-red-100 hover:bg-red-500/10"
                    onClick={() => runSeedDemo({ reset: true })}
                    disabled={seedDemoLoading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" /> Reset + seed
                  </Button>
                </div>
              </div>
              {seedError && (
                <div className="text-[10px] sm:text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2">
                  {seedError}
                </div>
              )}
              {usersError && (
                <div className="text-[10px] sm:text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2">
                  {usersError}
                </div>
              )}
              {usersLoading ? (
                <div className="py-6 sm:py-10 text-xs sm:text-sm text-slate-400">Lade Benutzer…</div>
              ) : adminUsers.length === 0 ? (
                <div className="py-8 sm:py-12 text-center text-xs sm:text-sm text-slate-400">
                  Keine Benutzer gefunden. Passe Filter oder Suche an.
                </div>
              ) : (
                <>
                  {/* Mobile: cards (no horizontal scroll) */}
                  {isMobile ? (
                    <div className="space-y-2">
                      {adminUsers.map((u) => {
                        const busy = updatingUserId === u.id || deletingUserId === u.id
                        return (
                          <div key={u.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-mono text-[10px] text-slate-400">#{u.id}</div>
                                <div className="mt-0.5 text-sm font-semibold text-slate-100 break-words">
                                  {u.email}
                                </div>
                                <div className="mt-1 text-[11px] text-slate-400">
                                  Erstellt: {u.createdAt ? new Date(u.createdAt).toLocaleDateString("de-DE") : "—"}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleVerified(u)}
                                disabled={busy}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium ${
                                  u.isVerified
                                    ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/40"
                                    : "bg-slate-500/10 text-slate-200 border-slate-500/40"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    u.isVerified ? "bg-emerald-400" : "bg-slate-400"
                                  }`}
                                />
                                {u.isVerified ? "Verifiziert" : "Unbestätigt"}
                              </button>
                            </div>

                            <div className="mt-3">
                              <div className="text-[10px] text-slate-400 mb-1">Rolle</div>
                              <select
                                className="h-11 w-full bg-transparent border border-white/15 rounded-lg px-3 text-xs text-slate-100"
                                value={u.role}
                                onChange={(e) =>
                                  handleChangeRole(
                                    u,
                                    e.target.value as "user" | "editor" | "admin"
                                  )
                                }
                                disabled={busy}
                              >
                                <option value="user">user</option>
                                <option value="editor">editor</option>
                                <option value="admin">admin</option>
                              </select>
                            </div>

                            <div className="mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-10 text-[11px]"
                                disabled={busy}
                                onClick={() => setExpandedPermsUserId((prev) => (prev === u.id ? null : u.id))}
                              >
                                Permissions {expandedPermsUserId === u.id ? "▾" : "▸"}
                              </Button>
                              {expandedPermsUserId === u.id && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  {SECTION_KEYS.map((s) => {
                                    const allowed = !((u as any)?.section_permissions && (u as any).section_permissions[s.key] === false)
                                    return (
                                      <label key={s.key} className="flex items-center gap-2 text-[11px] text-slate-200">
                                        <input
                                          type="checkbox"
                                          checked={allowed}
                                          disabled={busy}
                                          onChange={async (e) => {
                                            try {
                                              setUpdatingUserId(u.id)
                                              await setSectionAllowed(u, s.key, e.target.checked)
                                            } finally {
                                              setUpdatingUserId(null)
                                            }
                                          }}
                                        />
                                        <span className="truncate">{s.label}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-11 text-xs"
                                onClick={() => handleResetPassword(u)}
                                disabled={busy}
                              >
                                Passwort
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-11 text-xs border-red-500/40 text-red-300 hover:bg-red-500/10"
                                onClick={() => handleDeleteUser(u)}
                                disabled={busy}
                              >
                                Löschen
                              </Button>
                            </div>
                          </div>
                        )
                      })}

                      <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-400">
                        <span>
                          {adminUsers.length} / {usersTotal}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-card h-8 text-[11px]"
                          onClick={() => loadUsers()}
                          disabled={usersLoading}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" /> Neu laden
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg sm:rounded-2xl border border-white/10 -mx-1 sm:mx-0">
                      <table className="w-full text-xs sm:text-sm min-w-[600px]">
                        <thead className="bg-white/5">
                          <tr className="text-left text-slate-400 uppercase text-[10px] sm:text-xs tracking-wider">
                            <th className="py-2 sm:py-3.5 px-2 sm:px-5 font-medium">ID</th>
                            <th className="py-2 sm:py-3.5 px-2 sm:px-5 font-medium">E‑Mail</th>
                            <th className="py-2 sm:py-3.5 px-2 sm:px-5 font-medium">Rolle</th>
                            <th className="py-2 sm:py-3.5 px-2 sm:px-5 font-medium hidden sm:table-cell">Verifiziert</th>
                            <th className="py-2 sm:py-3.5 px-2 sm:px-5 font-medium hidden sm:table-cell">Erstellt</th>
                            <th className="py-2 sm:py-3.5 px-2 sm:px-5 font-medium hidden lg:table-cell">Perms</th>
                            <th className="py-2 sm:py-3.5 px-2 sm:px-5 font-medium text-right">Aktionen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {adminUsers.map((u) => (
                            <React.Fragment key={u.id}>
                            <tr className="hover:bg-white/5 transition-colors">
                              <td className="py-2 sm:py-3.5 px-2 sm:px-5 font-mono text-[10px] sm:text-xs text-slate-400">{u.id}</td>
                              <td className="py-2 sm:py-3.5 px-2 sm:px-5">
                                <div className="text-[10px] sm:text-sm text-slate-100 truncate max-w-[100px] sm:max-w-xs">{u.email}</div>
                              </td>
                              <td className="py-2 sm:py-3.5 px-2 sm:px-5">
                                <select
                                  className="bg-transparent border border-white/15 rounded-md px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-slate-100"
                                  value={u.role}
                                  onChange={(e) =>
                                    handleChangeRole(
                                      u,
                                      e.target.value as "user" | "editor" | "admin"
                                    )
                                  }
                                  disabled={updatingUserId === u.id || deletingUserId === u.id}
                                >
                                  <option value="user">user</option>
                                  <option value="editor">editor</option>
                                  <option value="admin">admin</option>
                                </select>
                              </td>
                              <td className="py-2 sm:py-3.5 px-2 sm:px-5 hidden sm:table-cell">
                                <button
                                  type="button"
                                  onClick={() => handleToggleVerified(u)}
                                  disabled={updatingUserId === u.id || deletingUserId === u.id}
                                  className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium ${
                                    u.isVerified
                                      ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/40"
                                      : "bg-slate-500/10 text-slate-200 border-slate-500/40"
                                  }`}
                                >
                                  <span
                                    className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${
                                      u.isVerified ? "bg-emerald-400" : "bg-slate-400"
                                    }`}
                                  />
                                  {u.isVerified ? "Verifiziert" : "Unbestätigt"}
                                </button>
                              </td>
                              <td className="py-2 sm:py-3.5 px-2 sm:px-5 text-[10px] sm:text-xs text-slate-400 hidden sm:table-cell">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString("de-DE") : "—"}
                              </td>
                              <td className="py-2 sm:py-3.5 px-2 sm:px-5 hidden lg:table-cell">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px]"
                                  onClick={() => setExpandedPermsUserId((prev) => (prev === u.id ? null : u.id))}
                                  disabled={updatingUserId === u.id || deletingUserId === u.id}
                                >
                                  {expandedPermsUserId === u.id ? "Hide" : "Edit"}
                                </Button>
                              </td>
                              <td className="py-2 sm:py-3.5 px-2 sm:px-5">
                                <div className="flex justify-end gap-1 sm:gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] sm:text-xs h-6 sm:h-8 px-1.5 sm:px-2"
                                    onClick={() => handleResetPassword(u)}
                                    disabled={updatingUserId === u.id || deletingUserId === u.id}
                                  >
                                    <span className="hidden sm:inline">Passwort</span>
                                    <span className="sm:hidden">PW</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] sm:text-xs h-6 sm:h-8 px-1.5 sm:px-2 border-red-500/40 text-red-300 hover:bg-red-500/10"
                                    onClick={() => handleDeleteUser(u)}
                                    disabled={updatingUserId === u.id || deletingUserId === u.id}
                                  >
                                    <span className="hidden sm:inline">Löschen</span>
                                    <span className="sm:hidden">×</span>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            {expandedPermsUserId === u.id && (
                              <tr className="bg-white/2">
                                <td colSpan={7} className="px-2 sm:px-5 py-3">
                                  <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                                    <div className="text-[11px] text-slate-400 mb-2">
                                      Wenn angehakt = erlaubt. Backend blockiert nur explizites <span className="text-slate-200 font-semibold">deny</span>.
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      {SECTION_KEYS.map((s) => {
                                        const busy = updatingUserId === u.id || deletingUserId === u.id
                                        const allowed = !((u as any)?.section_permissions && (u as any).section_permissions[s.key] === false)
                                        return (
                                          <label key={s.key} className="flex items-center gap-2 text-[11px] text-slate-200">
                                            <input
                                              type="checkbox"
                                              checked={allowed}
                                              disabled={busy}
                                              onChange={async (e) => {
                                                try {
                                                  setUpdatingUserId(u.id)
                                                  await setSectionAllowed(u, s.key, e.target.checked)
                                                } finally {
                                                  setUpdatingUserId(null)
                                                }
                                              }}
                                            />
                                            <span>{s.label}</span>
                                          </label>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex items-center justify-between px-2 sm:px-5 py-2 sm:py-3 text-[10px] sm:text-xs text-slate-400">
                        <span>
                          Zeigt {adminUsers.length} von {usersTotal}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-card h-6 sm:h-8 text-[10px] sm:text-xs"
                          onClick={() => loadUsers()}
                          disabled={usersLoading}
                        >
                          <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> <span className="hidden sm:inline">Neu laden</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SESSIONS */}
        <TabsContent value="sessions" className="space-y-4 sm:space-y-8">
          <Card className="glass-card">
            <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base">Sessions</CardTitle>
                  <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                    Aktive Geräte sehen und Sessions beenden
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <label className="flex items-center gap-2 text-[11px] text-slate-200">
                  <input type="checkbox" checked={sessionsActiveOnly} onChange={(e)=>setSessionsActiveOnly(e.target.checked)} />
                  Active only
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-card h-7 sm:h-9 text-[10px] sm:text-sm"
                  onClick={loadAdminSessions}
                  disabled={sessionsLoading}
                >
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Reload
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3">
              {sessionsError && (
                <div className="text-[10px] sm:text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2">
                  {sessionsError}
                </div>
              )}
              <Input
                placeholder="Filter by user email…"
                className="h-9 sm:h-10 text-xs sm:text-sm"
                value={sessionsSearch}
                onChange={(e)=>setSessionsSearch(e.target.value)}
              />
              {sessionsLoading ? (
                <div className="py-8 text-xs sm:text-sm text-slate-400">Loading…</div>
              ) : adminSessions.length === 0 ? (
                <div className="py-8 text-xs sm:text-sm text-slate-400">No sessions.</div>
              ) : (
                <div className="space-y-2">
                  {adminSessions
                    .filter((s: any) => !sessionsSearch || String(s.user_email || "").toLowerCase().includes(sessionsSearch.toLowerCase()))
                    .slice(0, 250)
                    .map((s: any) => (
                      <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-100 truncate">
                              {s.user_email} <span className="text-slate-400">({s.user_role})</span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-400 break-words">IP: {s.ip || "—"}</div>
                            <div className="mt-1 text-[11px] text-slate-400 break-words">UA: {s.user_agent || "—"}</div>
                            <div className="mt-2 text-[11px] text-slate-400">
                              Last seen: <span className="text-slate-200">{s.last_seen_at ? new Date(s.last_seen_at).toLocaleString() : "—"}</span>{" "}
                              · Status:{" "}
                              {s.revoked_at ? <span className="text-rose-200">revoked</span> : <span className="text-emerald-200">active</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {!s.revoked_at && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[10px] sm:text-xs"
                                onClick={async () => {
                                  await adminAPI.sessions.revoke(String(s.id))
                                  await loadAdminSessions()
                                }}
                              >
                                Revoke
                              </Button>
                            )}
                            {!s.revoked_at && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[10px] sm:text-xs border-red-500/40 text-red-300 hover:bg-red-500/10"
                                onClick={async () => {
                                  await adminAPI.sessions.revokeAllForUser(Number(s.user_id))
                                  await loadAdminSessions()
                                }}
                              >
                                Revoke all
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FLAGS */}
        <TabsContent value="flags" className="space-y-4 sm:space-y-8">
          <Card className="glass-card">
            <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4 flex flex-row flex-wrap items-start justify-between gap-2 sm:gap-4">
              <CardTitle className="tracking-tight text-sm sm:text-base">Feature Flags (lokal)</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs text-slate-400">Aktiv: {Object.keys(flags).filter(k=>flags[k]).length}</span>
                <Button variant="outline" size="sm" onClick={resetFlags} className="h-6 sm:h-8 text-[10px] sm:text-sm">Reset</Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-8">
              {([
                { key: "experimentalCharts", label: "Experimentelle Charts", desc: "Neue Mini‑Charts & Interaktionen", Icon: FlaskConical },
                { key: "compactSidebar", label: "Kompakte Sidebar", desc: "Schmalere Navigation & mehr Platz", Icon: PanelLeft },
                { key: "debugNetwork", label: "Netzwerk Debug", desc: "XHR/Fetch Logging in der Konsole", Icon: Bug },
                { key: "aiReportDeterministic", label: "AI Report (deterministisch)", desc: "Weniger kreative, stabilere Texte", Icon: Bot },
                { key: "gridBackground", label: "Subtiles Grid", desc: "Gitter‑Hintergrund im Layout", Icon: Grid3X3 },
                { key: "devRibbon", label: "DEV Ribbon", desc: "Zeigt DEV‑Banner oben rechts", Icon: Info },
                { key: "reducedMotion", label: "Weniger Animationen", desc: "Reduziert Animationen/Transitions", Icon: Monitor },
                { key: "autoRefresh", label: "Auto‑Refresh", desc: "Daten neu laden (1×/min)", Icon: Clock3 },
                { key: "readOnlyMode", label: "Schreibschutz", desc: "Blockiert Änderungen", Icon: Lock },
              ] as const).map(({ key, label, desc, Icon }) => {
                const active = !!flags[key]
                return (
                  <div
                    key={key}
                    className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-8 py-3 sm:py-8 flex items-center justify-between gap-3 sm:gap-6 hover:bg-white/10 transition cursor-pointer"
                    onClick={() => toggleFlag(key)}
                    role="switch"
                    aria-checked={active}
                    aria-label={`${label} ${active ? "ON" : "OFF"}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                      <div className="h-8 w-8 sm:h-11 sm:w-11 rounded-lg bg-gradient-to-br from-slate-200/10 to-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 truncate text-xs sm:text-[15px]">{label}</div>
                        <div className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5 sm:mt-2 leading-relaxed">{desc}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFlag(key) }}
                      className={`relative h-6 w-12 sm:h-8 sm:w-16 rounded-full border transition-all flex-shrink-0 ${active ? "bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-400/40 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" : "bg-white/10 border-white/20"}`}
                      aria-pressed={active}
                      aria-label={`${label} ${active ? "ON" : "OFF"}`}
                    >
                      <span
                        className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/90 dark:bg-slate-900/90 shadow transition-transform ${active ? "translate-x-6 sm:translate-x-8" : ""}`}
                      />
                    </button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPS */}
        <TabsContent value="ops" className="space-y-4 sm:space-y-8">
          <Card className="glass-card">
            <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500/30 to-rose-500/30 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Server className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base">Ops</CardTitle>
                  <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                    Health/Readiness + Hinweise zu Metrics/Alerts
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="glass-card h-7 sm:h-9 text-[10px] sm:text-sm"
                onClick={loadReady}
                disabled={readyzLoading}
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs font-semibold text-slate-200">Health</div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    <span className="font-mono">{apiBase}/health</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs font-semibold text-slate-200">Readiness</div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Status:{" "}
                    {readyz?.ok ? <span className="text-emerald-200 font-semibold">OK</span> : <span className="text-rose-200 font-semibold">NOT READY</span>}
                    {readyz?.status ? <span className="text-slate-500"> (HTTP {readyz.status})</span> : null}
                  </div>
                  <pre className="mt-2 text-[10px] text-slate-300 whitespace-pre-wrap break-words">
                    {JSON.stringify(readyz || {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-semibold text-slate-200">Metrics (Prometheus)</div>
                <div className="mt-2 text-[11px] text-slate-400">
                  In prod ist <span className="font-mono">/metrics</span> geschützt через <span className="font-mono">METRICS_TOKEN</span>.
                </div>
                <pre className="mt-2 text-[10px] text-slate-300 whitespace-pre-wrap break-words">{`curl -H \"Authorization: Bearer $METRICS_TOKEN\" ${apiBase}/metrics`}</pre>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-semibold text-slate-200">Alerts</div>
                <div className="mt-2 text-[11px] text-slate-400">
                  Cron endpoint: <span className="font-mono">POST /admin/alerts/run/system</span> с header{" "}
                  <span className="font-mono">X-Ops-Token</span>. Env: <span className="font-mono">OPS_ALERTS_ENABLED</span>,{" "}
                  <span className="font-mono">OPS_ALERT_EMAILS</span>.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SYSTEM */}
        <TabsContent value="system" className="space-y-4 sm:space-y-8">
          <Card className="glass-card">
            <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-sm sm:text-base">Systeminformationen</CardTitle>
              <Button variant="outline" size="sm" className="glass-card h-7 sm:h-8 text-[10px] sm:text-sm self-end sm:self-auto" onClick={copyDiagnostics}><Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Copy diagnostics</Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-7">
              <div className="grid grid-cols-2 gap-2 sm:gap-7">
                <div className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-indigo-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Clock3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs text-slate-400">Timezone</div>
                    <div className="font-medium text-xs sm:text-sm text-slate-200 truncate">{Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
                  </div>
                </div>
                <div className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-emerald-500/30 to-lime-500/30 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs text-slate-400">Locale</div>
                    <div className="font-medium text-xs sm:text-sm text-slate-200 truncate">{typeof navigator !== "undefined" ? navigator.language : "—"}</div>
                  </div>
                </div>
                <div className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] sm:text-xs text-slate-400">Theme Mode</div>
                    <div className="font-medium text-xs sm:text-sm text-slate-200">{typeof document !== "undefined" ? (document.documentElement.getAttribute("data-theme-mode") || "auto") : "—"}</div>
                    <div className="mt-0.5 sm:mt-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">
                      {prefersDark ? <Moon className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Sun className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                      <span className="text-slate-300">{prefersDark ? "Dark" : "Light"}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-cyan-500/30 to-sky-500/30 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs text-slate-400">Network</div>
                    <div className={`font-medium text-xs sm:text-sm ${viewport.online ? "text-emerald-300" : "text-red-300"}`}>{viewport.online ? "Online" : "Offline"}</div>
                    <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">{viewport.w}×{viewport.h} @ {viewport.dpr}x</div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-6">
                <div className="text-[10px] sm:text-xs text-slate-400 mb-1">User Agent</div>
                <div className="font-mono text-[10px] sm:text-xs text-slate-300 break-words line-clamp-3 sm:line-clamp-none">{typeof navigator !== "undefined" ? navigator.userAgent : "—"}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS (placeholder kept) */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Aktionen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => alert("Kommt bald: Cache leeren")}>
                Cache leeren
              </Button>
              <Button variant="outline" size="sm" onClick={() => alert("Kommt bald: Reindex starten")}>
                Reindex
              </Button>
              <Button variant="outline" size="sm" onClick={() => alert("Kommt bald: DB‑Export")}>
                DB Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => alert("Kommt bald: Konfiguration speichern")}>
                Konfiguration speichern
              </Button>
              <Button variant="outline" size="sm" onClick={() => alert("Kommt bald: Wartungsmodus")}>
                Wartungsmodus
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


