"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  BookOpen,
  Bug,
  Check,
  Copy,
  Monitor,
  Keyboard,
  LifeBuoy,
  LogOut,
  RotateCcw,
  Settings2,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  ZapOff,
} from "lucide-react"
import { restartOnboarding } from "@/components/onboarding/onboarding-tour"

interface AccountPanelProps {
  onClose: () => void
}

export function AccountPanel({ onClose }: AccountPanelProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [tab, setTab] = React.useState<"overview" | "settings" | "help">("overview")
  const [copied, setCopied] = React.useState(false)
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const [debugNetwork, setDebugNetwork] = React.useState(false)

  // Security: Sessions
  const [sessions, setSessions] = React.useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = React.useState(false)
  const [sessionsError, setSessionsError] = React.useState<string | null>(null)

  // Security: Admin 2FA (TOTP)
  const [totpEnabled, setTotpEnabled] = React.useState<boolean>(false)
  const [totpLoading, setTotpLoading] = React.useState(false)
  const [totpError, setTotpError] = React.useState<string | null>(null)
  const [totpSetupSecret, setTotpSetupSecret] = React.useState<string>("")
  const [totpSetupUri, setTotpSetupUri] = React.useState<string>("")
  const [totpCode, setTotpCode] = React.useState<string>("")
  const [totpQrDataUrl, setTotpQrDataUrl] = React.useState<string>("")
  const [recoveryRemaining, setRecoveryRemaining] = React.useState<number>(0)
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([])

  React.useEffect(() => {
    // Reduced motion
    try {
      const raw = localStorage.getItem("mk_reduced_motion")
      const enabled = raw === "1" || raw === "true"
      setReducedMotion(enabled)
      document.documentElement.classList.toggle("mk-reduced-motion", enabled)
    } catch {}

    // Debug network (featureFlags.debugNetwork)
    try {
      const flags = JSON.parse(localStorage.getItem("featureFlags") || "{}")
      setDebugNetwork(Boolean(flags?.debugNetwork))
    } catch {
      setDebugNetwork(false)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      onClose()
      if (typeof window !== "undefined") {
        window.location.href = "/signup?mode=login"
      } else {
        router.replace("/signup?mode=login")
      }
    }
  }

  const getCsrf = () => {
    try {
      const m = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/)
      return m ? decodeURIComponent(m[1]) : ""
    } catch {
      return ""
    }
  }

  const api = async (path: string, init: RequestInit = {}) => {
    const csrf = getCsrf()
    const method = (init.method || "GET").toUpperCase()
    const headers: any = { ...(init.headers || {}) }
    if (csrf && !["GET", "HEAD", "OPTIONS"].includes(method)) headers["X-CSRF-Token"] = csrf
    const res = await fetch(path.startsWith("/api") ? path : `/api${path.startsWith("/") ? path : "/" + path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    })
    const text = await res.text().catch(() => "")
    if (!res.ok) {
      let msg = text || res.statusText
      try {
        const j = JSON.parse(text)
        msg = j?.detail || j?.error || j?.message || msg
      } catch {}
      throw new Error(msg)
    }
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  const deviceLabelFromUA = (uaRaw: string) => {
    const ua = (uaRaw || "").toLowerCase()
    const isMobile =
      ua.includes("iphone") || ua.includes("ipad") || ua.includes("android") || ua.includes("mobile")
    const os = ua.includes("iphone") || ua.includes("ipad") ? "iOS" : ua.includes("android") ? "Android" : ua.includes("mac os") ? "macOS" : ua.includes("windows") ? "Windows" : ua.includes("linux") ? "Linux" : "Unknown OS"
    const browser =
      ua.includes("edg/") ? "Edge" :
      ua.includes("chrome/") ? "Chrome" :
      ua.includes("safari/") && !ua.includes("chrome/") ? "Safari" :
      ua.includes("firefox/") ? "Firefox" :
      "Browser"
    return `${isMobile ? "Mobile" : "Desktop"} · ${os} · ${browser}`
  }

  const loadSessions = async () => {
    try {
      setSessionsLoading(true)
      setSessionsError(null)
      const rows = await api("/auth/sessions")
      setSessions(Array.isArray(rows) ? rows : [])
    } catch (e: any) {
      setSessions([])
      setSessionsError(e?.message || "Failed to load sessions")
    } finally {
      setSessionsLoading(false)
    }
  }

  const loadTotpStatus = async () => {
    if (!isAdmin) return
    try {
      setTotpLoading(true)
      setTotpError(null)
      const j = await api("/auth/2fa/status")
      setTotpEnabled(Boolean((j as any)?.enabled))
      try {
        const rs = await api("/auth/2fa/recovery/status")
        setRecoveryRemaining(Number((rs as any)?.remaining || 0))
      } catch {
        setRecoveryRemaining(0)
      }
    } catch (e: any) {
      setTotpError(e?.message || "Failed to load 2FA status")
    } finally {
      setTotpLoading(false)
    }
  }

  const isAdmin = user?.role === "admin"
  const isDemo = (user?.email || "").trim().toLowerCase() === "demo@marketingkreis.ch"
  const initial = (user?.email || "A").trim().charAt(0).toUpperCase()
  const primaryLabel = user?.email || "Unbekannter Benutzer"
  const userIdLabel = (user as any)?.id != null ? String((user as any).id) : "—"

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-pink-500/10 px-5 py-5 sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute -top-24 -right-24 h-40 w-40 rounded-full bg-gradient-to-tr from-fuchsia-500/25 to-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-44 w-44 rounded-full bg-gradient-to-tr from-cyan-500/25 to-emerald-500/25 blur-3xl" />

        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-kaboom-red to-red-600 flex items-center justify-center text-white text-xl font-semibold shadow-xl ring-2 ring-white/40">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-200/80">
                Angemeldet als
              </div>
              <div className="mt-0.5 text-lg sm:text-xl font-semibold text-white truncate max-w-[260px] sm:max-w-[340px]">
                {primaryLabel}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-black/20 text-slate-100">
                  Rolle: {user?.role || "user"}
                </Badge>
                {isDemo && (
                  <Badge className="border-amber-300/40 bg-amber-500/20 text-amber-100 inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> DEMO · Read‑only
                  </Badge>
                )}
                {isAdmin && (
                  <Badge className="border-emerald-400/50 bg-emerald-500/80 text-white inline-flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 w-full">
            {isAdmin && (
              <Button
                variant="outline"
                className="glass-card w-full h-auto min-h-11 py-2.5 text-xs sm:text-sm border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => {
                  router.push("/admin")
                  onClose()
                }}
              >
                <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="min-w-0 truncate">Admin‑Bereich</span>
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full h-auto min-h-11 py-2.5 text-xs sm:text-sm border-red-400/60 bg-red-500/80 text-white hover:bg-red-500"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="min-w-0 truncate">Abmelden</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-4">
        <TabsList className="w-full justify-between bg-slate-900/40 dark:bg-slate-900/40 border-white/10">
          <TabsTrigger value="overview" className="flex-1 text-xs sm:text-sm flex items-center justify-center gap-2">
            <SlidersHorizontal className="h-4 w-4 flex-shrink-0" />
            <span className="min-w-0 truncate">Überblick</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 text-xs sm:text-sm flex items-center justify-center gap-2">
            <Settings2 className="h-4 w-4 flex-shrink-0" />
            <span className="min-w-0 truncate">Einstellungen</span>
          </TabsTrigger>
          <TabsTrigger value="help" className="flex-1 text-xs sm:text-sm flex items-center justify-center gap-2">
            <LifeBuoy className="h-4 w-4 flex-shrink-0" />
            <span className="min-w-0 truncate">Hilfe</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/70 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200">Account</div>
                  <div className="mt-1 text-sm font-medium text-white truncate">
                    {primaryLabel}
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10 flex-shrink-0"
                  onClick={async () => {
                    try {
                      if (navigator?.clipboard?.writeText && user?.email) {
                        await navigator.clipboard.writeText(user.email)
                        setCopied(true)
                        window.setTimeout(() => setCopied(false), 900)
                      }
                    } catch {}
                  }}
                  title="E‑Mail kopieren"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Kopiert" : "Copy"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] text-slate-400">User ID</div>
                  <div className="mt-0.5 font-semibold text-slate-100">{userIdLabel}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] text-slate-400">Modus</div>
                  <div className="mt-0.5 font-semibold text-slate-100">Dark</div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">Hinweis:</span> Die Plattform nutzt ausschließlich den
                Dunkelmodus für konsistentes UI.
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/70 p-5 space-y-4">
              <div className="text-xs font-semibold text-slate-200">Schnellaktionen</div>
              <div className="flex flex-col gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="glass-card h-auto min-h-11 py-3 px-3 justify-start items-start text-left gap-3 overflow-hidden"
                    onClick={() => {
                      router.push("/admin")
                      onClose()
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2 text-emerald-300 flex-shrink-0" />
                    <div className="min-w-0 flex-1 flex flex-col">
                      <div className="text-sm font-semibold text-white leading-tight truncate">Admin‑Bereich</div>
                      <div className="mt-0.5 text-[11px] text-slate-400 leading-snug truncate">
                        Benutzer, Seeds, System‑Checks und Debug‑Tools
                      </div>
                    </div>
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="glass-card h-auto min-h-11 py-3 px-3 justify-start items-start text-left gap-3 border-red-400/30 bg-red-500/10 hover:bg-red-500/15 overflow-hidden"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2 text-red-300 flex-shrink-0" />
                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="text-sm font-semibold text-white leading-tight truncate">Abmelden</div>
                    <div className="mt-0.5 text-[11px] text-slate-400 leading-snug truncate">
                      Sitzung beenden und zur Anmeldung zurückkehren
                    </div>
                  </div>
                </Button>

                {isDemo && (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-[11px] text-amber-100">
                    <div className="font-semibold">Demo‑Account</div>
                    <div className="mt-0.5 text-amber-100/80">
                      Dieser Account ist read‑only. Änderungen werden blockiert.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/70 p-5 space-y-4">
              <div className="text-xs font-semibold text-slate-200">Interface</div>

              <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white leading-tight">Reduced Motion</div>
                  <div className="mt-0.5 text-[11px] text-slate-400 leading-snug">
                    Weniger Animationen für bessere Lesbarkeit & Performance.
                  </div>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={(v) => {
                    setReducedMotion(v)
                    try {
                      localStorage.setItem("mk_reduced_motion", v ? "1" : "0")
                    } catch {}
                    document.documentElement.classList.toggle("mk-reduced-motion", v)
                  }}
                />
              </div>

              <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ZapOff className="h-4 w-4 text-slate-300" />
                    <div className="text-sm font-semibold text-white leading-tight">Dark‑only</div>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400 leading-snug">
                    Theme‑Wechsel ist deaktiviert (konsistentes Design).
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-300 border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 rounded-full whitespace-nowrap">
                  aktiv
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-slate-300" />
                    <div className="text-sm font-semibold text-white leading-tight">Lokale UI‑Daten zurücksetzen</div>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400 leading-snug">
                    Löscht UI‑Einstellungen (z.B. Flags, Onboarding‑Seen). Login bleibt erhalten.
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-9 px-3 text-xs bg-white/5 border-white/15 hover:bg-white/10"
                  onClick={() => {
                    try {
                      const keysToRemove = ["featureFlags", "mk_reduced_motion"]
                      keysToRemove.forEach((k) => localStorage.removeItem(k))
                      document.documentElement.classList.remove("mk-reduced-motion")
                      window.dispatchEvent(new Event("mk:flags"))
                      window.location.reload()
                    } catch {}
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/70 p-5 space-y-4">
              <div className="text-xs font-semibold text-slate-200">Developer</div>

              <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-slate-300" />
                    <div className="text-sm font-semibold text-white leading-tight">Network Debug Logs</div>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400 leading-snug">
                    Schreibt Fetch‑Timing in die Browser‑Konsole (für Debug).
                  </div>
                </div>
                <Switch
                  checked={debugNetwork}
                  onCheckedChange={(v) => {
                    setDebugNetwork(v)
                    try {
                      const flags = JSON.parse(localStorage.getItem("featureFlags") || "{}")
                      flags.debugNetwork = v
                      localStorage.setItem("featureFlags", JSON.stringify(flags))
                      window.dispatchEvent(new Event("mk:flags"))
                    } catch {}
                  }}
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">Tipp:</span> Wenn du Performance‑Probleme siehst, aktiviere
                “Reduced Motion” und deaktiviere Debug‑Logs.
              </div>
            </div>

            {/* Security */}
            <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/70 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-200" />
                    <div className="text-xs font-semibold text-slate-200">Security</div>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Aktive Geräte/Sitzungen verwalten. Hier kannst du einzelne Sessions beenden oder dich überall abmelden.
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-9 text-xs border-white/20 text-slate-200"
                  onClick={loadSessions}
                  disabled={sessionsLoading}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reload
                </Button>
              </div>

              {sessionsError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] text-rose-100">
                  {sessionsError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-11 text-xs border-white/20 text-slate-200"
                  onClick={async () => {
                    if (!confirm("Alle anderen Geräte/Sessions abmelden? (Dieses Gerät bleibt eingeloggt)")) return
                    await api("/auth/sessions/revoke_all?keep_current=true", { method: "POST" })
                    await loadSessions()
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Logout all other devices
                </Button>
                <Button
                  className="h-11 text-xs bg-red-500/90 hover:bg-red-500 text-white"
                  onClick={async () => {
                    if (!confirm("Wirklich überall abmelden? Du wirst auf die Login-Seite weitergeleitet.")) return
                    await api("/auth/sessions/revoke_all", { method: "POST" })
                    // cookies cleared -> go to login
                    onClose()
                    window.location.href = "/signup?mode=login"
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout everywhere
                </Button>
              </div>

              <div className="h-px w-full bg-white/10" />

              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <div className="text-[11px] text-slate-400">
                    {sessionsLoading ? "Loading…" : "Keine Sessions gefunden. (Klicke Reload)"}
                  </div>
                ) : (
                  sessions.map((s: any) => {
                    const ua = String(s.user_agent || "")
                    const ip = s.ip || "—"
                    const created = s.created_at ? new Date(s.created_at).toLocaleString() : "—"
                    const seen = s.last_seen_at ? new Date(s.last_seen_at).toLocaleString() : "—"
                    const revoked = s.revoked_at ? new Date(s.revoked_at).toLocaleString() : null
                    const label = deviceLabelFromUA(ua)
                    return (
                      <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-100 truncate">
                              <span className="inline-flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-slate-200" />
                                <span>{s.is_current ? "This device" : "Device"}</span>
                                {s.is_current && (
                                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                                    current
                                  </span>
                                )}
                              </span>{" "}
                              · <span className="text-slate-300">{ip}</span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-300">{label}</div>
                            <div className="mt-1 text-[11px] text-slate-400 break-words">
                              UA: {ua || "—"}
                            </div>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                              <div>Created: <span className="text-slate-200">{created}</span></div>
                              <div>Last seen: <span className="text-slate-200">{seen}</span></div>
                              <div className="sm:col-span-2">
                                Status:{" "}
                                {revoked ? (
                                  <span className="text-rose-200">revoked ({revoked})</span>
                                ) : (
                                  <span className="text-emerald-200">active</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {!revoked && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 text-xs border-white/20 text-slate-200"
                                onClick={async () => {
                                  const r = await api(`/auth/sessions/${encodeURIComponent(s.id)}/revoke`, { method: "POST" })
                                  if ((r as any)?.logged_out) {
                                    onClose()
                                    window.location.href = "/signup?mode=login"
                                    return
                                  }
                                  await loadSessions()
                                }}
                                disabled={Boolean(s.is_current)}
                                title={s.is_current ? "Du kannst die aktuelle Session nicht einzeln revoken. Nutze 'Logout everywhere'." : undefined}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {isAdmin && (
                <>
                  <div className="h-px w-full bg-white/10" />

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200">Admin 2FA (TOTP)</div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          Erhöht die Security deutlich: Login erfordert zusätzlich einen 6‑stelligen Code aus Authenticator (Google Authenticator, 1Password, etc.).
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="h-9 text-xs border-white/20 text-slate-200"
                        onClick={loadTotpStatus}
                        disabled={totpLoading}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-2" /> Status
                      </Button>
                    </div>

                    {totpError && (
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] text-rose-100">
                        {totpError}
                      </div>
                    )}

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-slate-300">Status</div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            totpEnabled
                              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                              : "border-amber-300/30 bg-amber-500/10 text-amber-100"
                          }`}
                        >
                          {totpEnabled ? "enabled" : "disabled"}
                        </span>
                      </div>
                    </div>

                    {!totpEnabled ? (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="h-11 text-xs border-white/20 text-slate-100 bg-white/5 hover:bg-white/10"
                          onClick={async () => {
                            try {
                              setTotpError(null)
                              const j = await api("/auth/2fa/setup", { method: "POST" })
                              setTotpSetupSecret(String((j as any)?.secret || ""))
                              setTotpSetupUri(String((j as any)?.otpauth_uri || ""))
                              setTotpQrDataUrl("")
                              const uri = String((j as any)?.otpauth_uri || "")
                              if (uri) {
                                try {
                                  const QRCode = (await import("qrcode")).default
                                  const url = await QRCode.toDataURL(uri, { margin: 1, width: 220 })
                                  setTotpQrDataUrl(url)
                                } catch {
                                  setTotpQrDataUrl("")
                                }
                              }
                            } catch (e: any) {
                              setTotpError(e?.message || "Setup failed")
                            }
                          }}
                        >
                          2FA Setup starten
                        </Button>

                        {(totpSetupSecret || totpSetupUri) && (
                          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3 space-y-2">
                            <div className="text-[11px] text-slate-400">
                              1) Scanne den QR-Code (oder nutze den Setup-Key manuell).
                            </div>
                            {totpQrDataUrl && (
                              <div className="flex items-center justify-center py-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={totpQrDataUrl} alt="2FA QR" className="rounded-xl border border-white/10" />
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400">
                              2) Issuer: <span className="text-slate-200">MarketingKreis</span> · Account:{" "}
                              <span className="text-slate-200">{user?.email}</span>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/5 p-2 flex items-center justify-between gap-2">
                              <div className="min-w-0 text-xs text-slate-300">
                                Secret: <span className="font-mono text-slate-100 break-all">{totpSetupSecret || "—"}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[11px] border-white/20 text-slate-200"
                                onClick={async () => {
                                  try { await navigator.clipboard.writeText(totpSetupSecret || "") } catch {}
                                }}
                                disabled={!totpSetupSecret}
                              >
                                Copy
                              </Button>
                            </div>
                            <details className="rounded-lg border border-white/10 bg-white/5 p-2">
                              <summary className="cursor-pointer text-[11px] text-slate-300 select-none">
                                otpauth URI anzeigen (für Debug)
                              </summary>
                              <div className="mt-2 flex items-start justify-between gap-2">
                                <div className="text-[11px] text-slate-500 break-all font-mono">{totpSetupUri || "—"}</div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-[11px] border-white/20 text-slate-200"
                                  onClick={async () => {
                                    try { await navigator.clipboard.writeText(totpSetupUri || "") } catch {}
                                  }}
                                  disabled={!totpSetupUri}
                                >
                                  Copy
                                </Button>
                              </div>
                            </details>
                            <input
                              value={totpCode}
                              onChange={(e) => setTotpCode(e.target.value)}
                              placeholder="6-digit Code"
                              inputMode="numeric"
                              className="h-11 w-full rounded-lg bg-slate-900/70 border border-white/15 px-3 text-slate-200 text-sm"
                            />
                            <Button
                              className="h-11 w-full bg-emerald-500/90 hover:bg-emerald-500 text-white"
                              onClick={async () => {
                                try {
                                  setTotpError(null)
                                  const j = await api("/auth/2fa/enable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: totpCode }) })
                                  const rc = Array.isArray((j as any)?.recovery_codes)
                                    ? (j as any).recovery_codes.map(String)
                                    : []
                                  if (rc.length) setRecoveryCodes(rc)
                                  setTotpCode("")
                                  setTotpSetupSecret("")
                                  setTotpSetupUri("")
                                  setTotpQrDataUrl("")
                                  await loadTotpStatus()
                                } catch (e: any) {
                                  setTotpError(e?.message || "Enable failed")
                                }
                              }}
                            >
                              2FA aktivieren
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value)}
                          placeholder="Code oder Recovery Code"
                          className="h-11 w-full rounded-lg bg-slate-900/70 border border-white/15 px-3 text-slate-200 text-sm"
                        />
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                          <span>Du kannst hier auch einen Recovery Code verwenden.</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-slate-200">
                            Remaining: <span className="font-semibold">{recoveryRemaining}</span>
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="h-11 w-full border-rose-400/30 bg-rose-500/10 hover:bg-rose-500/15 text-rose-100"
                          onClick={async () => {
                            try {
                              if (!confirm("2FA wirklich deaktivieren? (Du brauchst dann keinen OTP-Code mehr beim Login)")) return
                              setTotpError(null)
                              await api("/auth/2fa/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: totpCode }) })
                              setTotpCode("")
                              await loadTotpStatus()
                            } catch (e: any) {
                              setTotpError(e?.message || "Disable failed")
                            }
                          }}
                        >
                          2FA deaktivieren
                        </Button>

                        <Button
                          variant="outline"
                          className="h-11 w-full border-amber-300/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15"
                          onClick={async () => {
                            try {
                              if (!confirm("Neue Recovery Codes generieren? (Alte Codes werden ungültig)")) return
                              setTotpError(null)
                              const j = await api("/auth/2fa/recovery/regenerate", { method: "POST" })
                              const codes = Array.isArray((j as any)?.codes) ? (j as any).codes.map(String) : []
                              setRecoveryCodes(codes)
                              await loadTotpStatus()
                            } catch (e: any) {
                              setTotpError(e?.message || "Recovery codes failed")
                            }
                          }}
                        >
                          Recovery Codes generieren
                        </Button>

                        {recoveryCodes.length > 0 && (
                          <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 p-3 space-y-2">
                            <div className="text-[11px] text-amber-100 font-semibold">
                              Wichtig: Diese Codes werden nur jetzt angezeigt. Bitte speichern.
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {recoveryCodes.map((c) => (
                                <div key={c} className="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 font-mono text-xs text-slate-100">
                                  {c}
                                </div>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              className="h-10 text-xs border-white/20 text-slate-200"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(recoveryCodes.join("\n"))
                                } catch {}
                              }}
                            >
                              Copy all
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Help */}
        <TabsContent value="help" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/70 p-5 space-y-4">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Rundgänge
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  className="w-full rounded-xl border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/15 px-3 py-3 text-left"
                  onClick={() => {
                    onClose()
                    setTimeout(() => restartOnboarding("welcome"), 250)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <RotateCcw className="h-4 w-4 mt-0.5 text-rose-300 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white leading-tight">Welcome Tour</div>
                      <div className="mt-0.5 text-[11px] text-slate-300/80 leading-snug truncate">
                        Kurzer Überblick über Navigation, Module und wichtige Bereiche.
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-200/80 whitespace-nowrap flex-shrink-0">~2 min</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-3 text-left"
                  onClick={() => {
                    onClose()
                    setTimeout(() => restartOnboarding(), 250)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-4 w-4 mt-0.5 text-blue-300 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white leading-tight">Seiten‑Tour</div>
                      <div className="mt-0.5 text-[11px] text-slate-300/80 leading-snug truncate">
                        Zeigt die wichtigsten Elemente der aktuellen Seite.
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-200/80 whitespace-nowrap flex-shrink-0">~1 min</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/70 p-5 space-y-4">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-slate-300" />
                Shortcuts & Tipps
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="font-semibold text-slate-100">ESC</span>
                  <span className="text-slate-400">schließt Rundgang / Drawer</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 leading-snug">
                  Wenn Text zu lang ist: nutze Filter/Zoom oder öffne Details per Klick.
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">Support:</span> Wenn etwas komisch aussieht, mach einen
                Screenshot und sag kurz welche Seite — ich fix es.
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}



