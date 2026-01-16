"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Shield, LogOut, Sparkles, BookOpen, Keyboard } from "lucide-react"
import { restartOnboarding } from "@/components/onboarding/onboarding-tour"

interface AccountPanelProps {
  onClose: () => void
}

export function AccountPanel({ onClose }: AccountPanelProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

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

  const isAdmin = user?.role === "admin"
  const isDemo = (user?.email || "").trim().toLowerCase() === "demo@marketingkreis.ch"
  const initial = (user?.email || "A").trim().charAt(0).toUpperCase()
  const primaryLabel = user?.email || "Unbekannter Benutzer"

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-pink-500/10 px-5 py-5 sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute -top-24 -right-24 h-40 w-40 rounded-full bg-gradient-to-tr from-fuchsia-500/25 to-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-44 w-44 rounded-full bg-gradient-to-tr from-cyan-500/25 to-emerald-500/25 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-kaboom-red to-red-600 flex items-center justify-center text-white text-xl font-semibold shadow-xl ring-2 ring-white/40">
              {initial}
            </div>
            <div>
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

          <div className="flex flex-col items-stretch sm:flex-row sm:items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                className="glass-card h-9 text-xs sm:text-sm border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => {
                  router.push("/admin")
                  onClose()
                }}
              >
                <Shield className="h-4 w-4 mr-2" /> Admin‑Bereich öffnen
              </Button>
            )}
            <Button
              variant="outline"
              className="h-9 text-xs sm:text-sm border-red-400/60 bg-red-500/80 text-white hover:bg-red-500"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" /> Abmelden
            </Button>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Appearance (dark-only) */}
        <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 space-y-3">
          <div>
            <div className="text-sm font-semibold text-slate-50">Darstellung</div>
            <div className="text-xs text-slate-400 mt-1">
              Die Plattform nutzt ausschließlich den Dunkelmodus.
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Dark Mode aktiv
          </div>
          <div className="text-[11px] text-slate-500">
            (Kein Theme‑Wechsel mehr – konsistentes UI auf allen Geräten.)
          </div>
        </div>

        {/* Help / onboarding */}
        <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 space-y-4">
          <div>
            <div className="text-sm font-semibold text-slate-50 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Hilfe & Einführung
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Interaktive Rundgänge für jede Seite – starte sie jederzeit neu.
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="glass-card h-10 text-xs sm:text-sm border-rose-500/30 bg-rose-500/10 text-white hover:bg-rose-500/20 hover:border-rose-500/50 justify-start"
              onClick={() => {
                onClose()
                setTimeout(() => restartOnboarding("welcome"), 300)
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2 text-rose-400" />
              <span className="flex-1 text-left">Welcome Tour</span>
              <span className="text-[10px] text-slate-400">~2 min</span>
            </Button>
            <Button
              variant="outline"
              className="glass-card h-10 text-xs sm:text-sm border-white/20 bg-white/5 text-white hover:bg-white/10 justify-start"
              onClick={() => {
                onClose()
                setTimeout(() => restartOnboarding(), 300)
              }}
            >
              <BookOpen className="h-4 w-4 mr-2 text-blue-400" />
              <span className="flex-1 text-left">Seiten-Tour (aktuelle Seite)</span>
              <span className="text-[10px] text-slate-400">~1 min</span>
            </Button>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Keyboard className="h-3.5 w-3.5 text-slate-400" />
              <span>Tastenkürzel:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[10px]">ESC</kbd>
              <span className="text-slate-400">schließt Rundgang</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            💡 Jede Seite hat einen eigenen Mini‑Rundgang. Beim ersten Besuch startet er automatisch.
          </div>
        </div>
      </div>
    </div>
  )
}



